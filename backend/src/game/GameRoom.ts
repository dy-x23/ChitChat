import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  GamePhase,
  GameMode,
  Player,
  ChitSubmission,
  GuessSubmission,
  RoundResult,
  GameRoomConfig,
  ClientGameState,
  ClientPublicPlayer,
  ClientAssignedChit,
  ReactionType,
  ConfidenceLevel
} from '../types/index.js';
import { getRandomPrompt, BOT_TEMPLATES } from './prompts.js';
import { calculateGuessPoints, computeGameAwards } from './scoring.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GameRoom {
  public code: string;
  public hostId: string;
  public players: Map<string, Player> = new Map();
  public phase: GamePhase = 'LOBBY';
  public currentRound: number = 0;
  public currentPrompt: string = '';
  public timerSeconds: number = 0;
  public timerInterval: NodeJS.Timeout | null = null;

  public config: GameRoomConfig = {
    totalRounds: 5,
    mode: 'STANDARD_MIXED',
    writingTimeSeconds: 60,
    guessingTimeSeconds: 45,
    allowCustomPrompts: true
  };

  // Round specific state
  public chits: Map<string, ChitSubmission> = new Map(); // chitId -> ChitSubmission
  public assignments: Map<string, string> = new Map(); // playerId -> chitId
  public guesses: Map<string, GuessSubmission> = new Map(); // playerId -> GuessSubmission
  public allRoundResults: RoundResult[] = [];
  public usedPrompts: Set<string> = new Set();

  private io: Server;
  private dbRoomId: string | null = null;

  constructor(code: string, hostId: string, io: Server) {
    this.code = code;
    this.hostId = hostId;
    this.io = io;
    this.initDatabaseRoom();
  }

  private async initDatabaseRoom() {
    try {
      const room = await prisma.room.create({
        data: {
          code: this.code,
          hostId: this.hostId,
          totalRounds: this.config.totalRounds,
          mode: this.config.mode
        }
      });
      this.dbRoomId = room.id;
    } catch (err) {
      console.error('Error saving room to DB:', err);
    }
  }

  public addPlayer(id: string, name: string, socketId: string, isBot = false): Player {
    const isHost = this.players.size === 0;
    if (isHost) {
      this.hostId = id;
    }
    const avatarSeed = isBot ? `bot_${name.toLowerCase().replace(/\s+/g, '_')}` : `user_${name}_${Math.floor(Math.random() * 9999)}`;
    const player: Player = {
      id,
      name,
      socketId,
      isHost,
      isConnected: true,
      isBot,
      avatarSeed,
      score: 0,
      stats: {
        correctGuesses: 0,
        totalGuesses: 0,
        timesGuessed: 0,
        timesGuessedCorrectly: 0,
        reactionsReceived: { relatable: 0, funny: 0, surprising: 0, mindblown: 0 }
      }
    };
    this.players.set(id, player);
    return player;
  }

  public removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    if (this.phase === 'LOBBY') {
      this.players.delete(playerId);
      if (this.hostId === playerId && this.players.size > 0) {
        const nextHost = Array.from(this.players.values())[0];
        nextHost.isHost = true;
        this.hostId = nextHost.id;
      }
    } else {
      player.isConnected = false;
    }
    this.broadcastState();
  }

  public reconnectPlayer(playerId: string, newSocketId: string): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;
    player.socketId = newSocketId;
    player.isConnected = true;
    this.broadcastState();
    return true;
  }

  public addBotPlayer(): Player | null {
    if (this.players.size >= 8) return null;
    const existingBotNames = new Set(Array.from(this.players.values()).filter((p) => p.isBot).map((p) => p.name));
    const available = BOT_TEMPLATES.filter((b) => !existingBotNames.has(b.name));
    const template = available.length > 0 ? available[0] : {
      name: `Mystery Friend #${this.players.size + 1}`,
      avatarSeed: `bot_${Date.now()}`,
      answers: { default: "I always take the last slice of pizza without asking." },
      reactions: ["Classic move, definitely them!"]
    };

    const botId = `bot_${uuidv4().slice(0, 8)}`;
    const bot = this.addPlayer(botId, template.name, `sock_${botId}`, true);
    bot.avatarSeed = template.avatarSeed;
    this.broadcastState();
    return bot;
  }

  public removeBotPlayer(botId: string): void {
    if (this.phase !== 'LOBBY') return;
    const p = this.players.get(botId);
    if (p && p.isBot) {
      this.players.delete(botId);
      this.broadcastState();
    }
  }

  public updateConfig(newConfig: Partial<GameRoomConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.broadcastState();
  }

  public startGame(): boolean {
    if (this.players.size < 3) return false;
    this.currentRound = 0;
    this.allRoundResults = [];
    this.usedPrompts.clear();
    // Reset player scores
    for (const p of this.players.values()) {
      p.score = 0;
      p.stats = {
        correctGuesses: 0,
        totalGuesses: 0,
        timesGuessed: 0,
        timesGuessedCorrectly: 0,
        reactionsReceived: { relatable: 0, funny: 0, surprising: 0, mindblown: 0 }
      };
    }
    this.startRound();
    return true;
  }

  public setPrompt(prompt: string): void {
    this.currentPrompt = prompt;
    this.usedPrompts.add(prompt);
    this.startWritingPhase();
  }

  public startRound(): void {
    this.currentRound += 1;
    this.chits.clear();
    this.assignments.clear();
    this.guesses.clear();

    const prompt = getRandomPrompt(this.config.mode, this.usedPrompts);
    this.currentPrompt = prompt;
    this.usedPrompts.add(prompt);
    this.startWritingPhase();
  }

  private startWritingPhase(): void {
    this.phase = 'WRITING';
    this.timerSeconds = this.config.writingTimeSeconds;
    this.startTimer(() => this.handleWritingTimeout());
    this.broadcastState();

    // Trigger bots to submit answers after small realistic delays
    this.scheduleBotChits();
  }

  private scheduleBotChits(): void {
    const bots = Array.from(this.players.values()).filter((p) => p.isBot);
    bots.forEach((bot, index) => {
      const delay = 1500 + index * 1000 + Math.random() * 1500;
      setTimeout(() => {
        if (this.phase !== 'WRITING') return;
        const botTemplate = BOT_TEMPLATES.find((b) => b.name === bot.name);
        let answer = "I have a secret habit of dancing in front of mirrors.";
        if (botTemplate) {
          const matchKey = Object.keys(botTemplate.answers).find((k) =>
            this.currentPrompt.toLowerCase().includes(k.toLowerCase())
          );
          if (matchKey) {
            answer = (botTemplate.answers as Record<string, string>)[matchKey];
          } else {
            answer = botTemplate.answers.default || answer;
          }
        }
        if (this.config.mode === 'TWO_TRUTHS_LIE') {
          const statements = [
            `I once won a regional spicy ramen contest.`,
            `I have visited 14 countries solo.`,
            `I can hold my breath underwater for 4 minutes.`
          ];
          this.submitChit(bot.id, JSON.stringify({ statements, lieIndex: 2 }));
        } else {
          this.submitChit(bot.id, answer);
        }
      }, delay);
    });
  }

  public submitChit(playerId: string, content: string): boolean {
    if (this.phase !== 'WRITING') return false;
    const player = this.players.get(playerId);
    if (!player) return false;

    let parsedStatements: string[] | undefined;
    let lieIndex: number | undefined;

    if (this.config.mode === 'TWO_TRUTHS_LIE') {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.statements)) {
          parsedStatements = parsed.statements;
          lieIndex = typeof parsed.lieIndex === 'number' ? parsed.lieIndex : 0;
        }
      } catch {
        parsedStatements = [content, "Truth item 2", "Lie item 3"];
        lieIndex = 2;
      }
    }

    const chit: ChitSubmission = {
      id: `chit_${uuidv4().slice(0, 8)}`,
      authorId: player.id,
      authorName: player.name,
      content,
      parsedStatements,
      lieIndex,
      reactions: {}
    };

    this.chits.set(player.id, chit);
    this.broadcastState();

    // Check if everyone has submitted
    const activePlayers = Array.from(this.players.values()).filter((p) => p.isConnected);
    const allSubmitted = activePlayers.every((p) => this.chits.has(p.id));
    if (allSubmitted) {
      this.clearTimer();
      this.startShufflingPhase();
    }
    return true;
  }

  private handleWritingTimeout(): void {
    // Fill default chits for any player who missed the timer
    for (const player of this.players.values()) {
      if (!this.chits.has(player.id)) {
        this.chits.set(player.id, {
          id: `chit_${uuidv4().slice(0, 8)}`,
          authorId: player.id,
          authorName: player.name,
          content: "I didn't manage to write in time, but I'm enjoying the chaos!",
          reactions: {}
        });
      }
    }
    this.startShufflingPhase();
  }

  private startShufflingPhase(): void {
    this.phase = 'SHUFFLING';
    this.performChitDerangement();
    this.broadcastState();

    // Shuffling animation delay (2.5 seconds)
    setTimeout(() => {
      if (this.phase === 'SHUFFLING') {
        this.startGuessingPhase();
      }
    }, 2500);
  }

  /**
   * Guaranteed Derangement: Every player gets a chit from someone else (assignedToId !== authorId).
   */
  private performChitDerangement(): void {
    const playerList = Array.from(this.players.values());
    const n = playerList.length;
    if (n < 2) return;

    const chitAuthors = playerList.map((p) => p.id);
    let derangedAuthors: string[] = [];

    // Try Fisher-Yates derangement shuffle
    for (let attempt = 0; attempt < 150; attempt++) {
      const shuffled = [...chitAuthors];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const isDerangement = shuffled.every((authorId, idx) => authorId !== playerList[idx].id);
      if (isDerangement) {
        derangedAuthors = shuffled;
        break;
      }
    }

    // Fallback: cyclic shift guaranteed derangement
    if (derangedAuthors.length === 0) {
      derangedAuthors = [...chitAuthors.slice(1), chitAuthors[0]];
    }

    this.assignments.clear();
    playerList.forEach((recipient, idx) => {
      const authorId = derangedAuthors[idx];
      const chit = this.chits.get(authorId);
      if (chit) {
        chit.assignedToId = recipient.id;
        this.assignments.set(recipient.id, chit.id);
      }
    });
  }

  private startGuessingPhase(): void {
    this.phase = 'GUESSING';
    this.timerSeconds = this.config.guessingTimeSeconds;
    this.startTimer(() => this.handleGuessingTimeout());
    this.broadcastState();

    this.scheduleBotGuesses();
  }

  private scheduleBotGuesses(): void {
    const bots = Array.from(this.players.values()).filter((p) => p.isBot);
    bots.forEach((bot, index) => {
      const delay = 2000 + index * 1200 + Math.random() * 2000;
      setTimeout(() => {
        if (this.phase !== 'GUESSING') return;
        const assignedChitId = this.assignments.get(bot.id);
        if (!assignedChitId) return;

        // Find eligible targets (exclude bot itself)
        const candidates = Array.from(this.players.values()).filter((p) => p.id !== bot.id);
        if (candidates.length === 0) return;

        const pickedTarget = candidates[Math.floor(Math.random() * candidates.length)];
        const confidences: ConfidenceLevel[] = ['sure', 'fifty_fifty', 'no_idea'];
        const pickedConf = confidences[Math.floor(Math.random() * confidences.length)];
        const botTemplate = BOT_TEMPLATES.find((b) => b.name === bot.name);
        const reactionText = botTemplate
          ? botTemplate.reactions[Math.floor(Math.random() * botTemplate.reactions.length)]
          : "They definitely wrote this!";

        this.submitGuess(bot.id, {
          guesserId: bot.id,
          targetChitId: assignedChitId,
          guessedAuthorId: pickedTarget.id,
          confidence: pickedConf,
          reactionText,
          guessedLieIndex: Math.floor(Math.random() * 3)
        });
      }, delay);
    });
  }

  public submitGuess(playerId: string, guess: GuessSubmission): boolean {
    if (this.phase !== 'GUESSING') return false;
    const player = this.players.get(playerId);
    if (!player) return false;

    this.guesses.set(playerId, guess);
    this.broadcastState();

    // Check if all players have submitted guesses
    const activePlayers = Array.from(this.players.values()).filter((p) => p.isConnected);
    const allSubmitted = activePlayers.every((p) => this.guesses.has(p.id));
    if (allSubmitted) {
      this.clearTimer();
      this.startRevealPhase();
    }
    return true;
  }

  private handleGuessingTimeout(): void {
    // Fill default random guesses for any missing players
    for (const player of this.players.values()) {
      if (!this.guesses.has(player.id)) {
        const chitId = this.assignments.get(player.id);
        if (chitId) {
          const others = Array.from(this.players.values()).filter((p) => p.id !== player.id);
          const randomOther = others[Math.floor(Math.random() * others.length)];
          this.guesses.set(player.id, {
            guesserId: player.id,
            targetChitId: chitId,
            guessedAuthorId: randomOther?.id || player.id,
            confidence: 'no_idea',
            reactionText: "Ran out of time to guess!"
          });
        }
      }
    }
    this.startRevealPhase();
  }

  private startRevealPhase(): void {
    this.phase = 'REVEAL';
    this.timerSeconds = 30; // 30s for reading, laughing, and reacting
    this.startTimer(() => {
      // Auto move to round summary or next round
    });

    const roundResult = this.computeRoundResults();
    this.allRoundResults.push(roundResult);
    this.saveRoundToDatabase(roundResult);

    this.broadcastState();
  }

  private computeRoundResults(): RoundResult {
    const scores: Record<string, number> = {};
    const scoreDeltas: Record<string, number> = {};

    for (const p of this.players.values()) {
      scores[p.id] = p.score;
      scoreDeltas[p.id] = 0;
    }

    const chitItems = Array.from(this.chits.values()).map((chit) => {
      const recipient = Array.from(this.players.values()).find((p) => p.id === chit.assignedToId);
      const guess = recipient ? this.guesses.get(recipient.id) : null;

      let guessData = null;
      if (guess && recipient) {
        const isCorrect = guess.guessedAuthorId === chit.authorId;
        const isLieCorrect =
          this.config.mode === 'TWO_TRUTHS_LIE' &&
          typeof chit.lieIndex === 'number' &&
          guess.guessedLieIndex === chit.lieIndex;

        const points = calculateGuessPoints(isCorrect, guess.confidence, isLieCorrect);

        // Update guesser stats
        recipient.score += points;
        scoreDeltas[recipient.id] = (scoreDeltas[recipient.id] || 0) + points;
        scores[recipient.id] = recipient.score;
        recipient.stats.totalGuesses += 1;
        if (isCorrect) recipient.stats.correctGuesses += 1;

        // Update author stats
        const author = this.players.get(chit.authorId);
        if (author) {
          author.stats.timesGuessed += 1;
          if (isCorrect) author.stats.timesGuessedCorrectly += 1;
        }

        const guessedAuthor = this.players.get(guess.guessedAuthorId);

        guessData = {
          guesserId: recipient.id,
          guesserName: recipient.name,
          guessedAuthorId: guess.guessedAuthorId,
          guessedAuthorName: guessedAuthor?.name || 'Unknown',
          confidence: guess.confidence,
          reactionText: guess.reactionText,
          guessedLieIndex: guess.guessedLieIndex,
          isCorrect,
          pointsAwarded: points
        };
      }

      return {
        chitId: chit.id,
        content: chit.content,
        parsedStatements: chit.parsedStatements,
        lieIndex: chit.lieIndex,
        authorId: chit.authorId,
        authorName: chit.authorName,
        assignedToId: chit.assignedToId || '',
        assignedToName: recipient?.name || 'Unknown',
        guess: guessData,
        reactions: chit.reactions
      };
    });

    return {
      roundNumber: this.currentRound,
      prompt: this.currentPrompt,
      mode: this.config.mode,
      chits: chitItems,
      scores,
      scoreDeltas
    };
  }

  public addReaction(playerId: string, chitId: string, reactionType: ReactionType): boolean {
    const chit = Array.from(this.chits.values()).find((c) => c.id === chitId);
    if (!chit) return false;

    chit.reactions[playerId] = reactionType;

    // Track on author
    const author = this.players.get(chit.authorId);
    if (author) {
      author.stats.reactionsReceived[reactionType] = (author.stats.reactionsReceived[reactionType] || 0) + 1;
    }

    // Update in latest round result if present
    const latestRound = this.allRoundResults[this.allRoundResults.length - 1];
    if (latestRound) {
      const match = latestRound.chits.find((c) => c.chitId === chitId);
      if (match) {
        match.reactions[playerId] = reactionType;
      }
    }

    this.broadcastState();
    return true;
  }

  public advanceNext(): void {
    this.clearTimer();
    if (this.currentRound >= this.config.totalRounds) {
      this.phase = 'FINAL_RESULTS';
      this.broadcastState();
    } else {
      this.startRound();
    }
  }

  public resetToLobby(): void {
    this.clearTimer();
    this.phase = 'LOBBY';
    this.currentRound = 0;
    this.chits.clear();
    this.assignments.clear();
    this.guesses.clear();
    this.allRoundResults = [];
    this.usedPrompts.clear();
    for (const p of this.players.values()) {
      p.score = 0;
    }
    this.broadcastState();
  }

  private async saveRoundToDatabase(roundResult: RoundResult) {
    if (!this.dbRoomId) return;
    try {
      const dbRound = await prisma.round.create({
        data: {
          roomId: this.dbRoomId,
          roundNumber: roundResult.roundNumber,
          prompt: roundResult.prompt,
          mode: roundResult.mode
        }
      });

      for (const item of roundResult.chits) {
        const chit = await prisma.chit.create({
          data: {
            roundId: dbRound.id,
            authorId: item.authorId,
            authorName: item.authorName,
            assignedToId: item.assignedToId,
            content: item.content,
            isLie: item.lieIndex ?? null
          }
        });

        if (item.guess) {
          await prisma.guess.create({
            data: {
              roundId: dbRound.id,
              guesserId: item.guess.guesserId,
              targetChitId: chit.id,
              guessedAuthorId: item.guess.guessedAuthorId,
              confidence: item.guess.confidence,
              reactionText: item.guess.reactionText ?? null,
              isCorrect: item.guess.isCorrect,
              pointsAwarded: item.guess.pointsAwarded
            }
          });
        }
      }
    } catch (err) {
      console.error('Error saving round to DB:', err);
    }
  }

  private startTimer(onComplete: () => void): void {
    this.clearTimer();
    this.timerInterval = setInterval(() => {
      this.timerSeconds -= 1;
      this.io.to(this.code).emit('timer_tick', { seconds: this.timerSeconds });
      if (this.timerSeconds <= 0) {
        this.clearTimer();
        onComplete();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * CRITICAL SECURITY METHOD:
   * Strips out secret author information so clients cannot peek network responses during GUESSING!
   */
  public getClientStateForPlayer(playerId: string): ClientGameState {
    const player = this.players.get(playerId);
    const isHost = player?.isHost || false;

    const publicPlayers: ClientPublicPlayer[] = Array.from(this.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      isConnected: p.isConnected,
      isBot: p.isBot,
      avatarSeed: p.avatarSeed,
      score: p.score,
      hasSubmittedChit: this.chits.has(p.id),
      hasSubmittedGuess: this.guesses.has(p.id)
    }));

    // Find assigned chit for this player
    let assignedChit: ClientAssignedChit | null = null;
    if (this.phase === 'GUESSING' || this.phase === 'REVEAL') {
      const assignedChitId = this.assignments.get(playerId);
      const chit = assignedChitId
        ? Array.from(this.chits.values()).find((c) => c.id === assignedChitId)
        : null;

      if (chit) {
        // Exclude the player themself from candidates
        const eligibleAuthors = Array.from(this.players.values())
          .filter((p) => p.id !== playerId)
          .map((p) => ({ id: p.id, name: p.name, avatarSeed: p.avatarSeed }));

        assignedChit = {
          chitId: chit.id,
          content: chit.content,
          parsedStatements: chit.parsedStatements,
          isWhoWould: this.config.mode === 'WHO_WOULD',
          eligibleAuthors
          // Notice: authorId is NEVER included here!
        };
      }
    }

    const latestRoundResult =
      this.phase === 'REVEAL' || this.phase === 'ROUND_SUMMARY' || this.phase === 'FINAL_RESULTS'
        ? this.allRoundResults[this.allRoundResults.length - 1] || null
        : null;

    let finalResults = null;
    if (this.phase === 'FINAL_RESULTS') {
      const sortedPlayers = [...publicPlayers].sort((a, b) => b.score - a.score);
      const leaderboard = sortedPlayers.map((p, idx) => {
        const fullPlayer = this.players.get(p.id);
        const total = fullPlayer?.stats.totalGuesses || 0;
        const correct = fullPlayer?.stats.correctGuesses || 0;
        return {
          rank: idx + 1,
          player: p,
          score: p.score,
          accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
          stats: fullPlayer?.stats || {
            correctGuesses: 0,
            totalGuesses: 0,
            timesGuessed: 0,
            timesGuessedCorrectly: 0,
            reactionsReceived: { relatable: 0, funny: 0, surprising: 0, mindblown: 0 }
          }
        };
      });

      const awards = computeGameAwards(
        Array.from(this.players.values()),
        this.allRoundResults,
        Array.from(this.chits.values())
      );

      const chitWall = this.allRoundResults.map((r) => ({
        roundNumber: r.roundNumber,
        prompt: r.prompt,
        answers: r.chits.map((c) => ({
          authorName: c.authorName,
          content: c.content,
          reactions: c.reactions
        }))
      }));

      finalResults = { leaderboard, awards, chitWall };
    }

    return {
      roomCode: this.code,
      phase: this.phase,
      currentRound: this.currentRound,
      totalRounds: this.config.totalRounds,
      mode: this.config.mode,
      currentPrompt: this.currentPrompt,
      timerSeconds: this.timerSeconds,
      players: publicPlayers,
      myPlayerId: playerId,
      isHost,
      assignedChit,
      roundResults: latestRoundResult,
      finalResults
    };
  }

  public broadcastState(): void {
    for (const player of this.players.values()) {
      if (player.isConnected && !player.isBot) {
        const state = this.getClientStateForPlayer(player.id);
        this.io.to(player.socketId).emit('game_state_update', state);
      }
    }
  }

  public destroy(): void {
    this.clearTimer();
  }
}
