export type GamePhase =
  | 'LOBBY'
  | 'PROMPT_SELECT'
  | 'WRITING'
  | 'SHUFFLING'
  | 'GUESSING'
  | 'REVEAL'
  | 'ROUND_SUMMARY'
  | 'FINAL_RESULTS';

export type GameMode =
  | 'STANDARD_FUN'
  | 'STANDARD_DEEP'
  | 'STANDARD_RANDOM'
  | 'STANDARD_MIXED'
  | 'WHO_WOULD'
  | 'TWO_TRUTHS_LIE';

export type ConfidenceLevel = 'sure' | 'fifty_fifty' | 'no_idea';

export type ReactionType = 'relatable' | 'funny' | 'surprising' | 'mindblown';

export interface PlayerStats {
  correctGuesses: number;
  totalGuesses: number;
  timesGuessed: number;
  timesGuessedCorrectly: number;
  reactionsReceived: Record<ReactionType, number>;
}

export interface Player {
  id: string;
  name: string;
  socketId: string;
  isHost: boolean;
  isConnected: boolean;
  isBot?: boolean;
  avatarSeed: string;
  score: number;
  stats: PlayerStats;
}

export interface ChitSubmission {
  id: string;
  authorId: string;
  authorName: string;
  assignedToId?: string;
  content: string; // Plain text or JSON for 2T1L: { statements: string[], lieIndex: number }
  parsedStatements?: string[];
  lieIndex?: number;
  reactions: Record<string, ReactionType>; // playerId -> ReactionType
}

export interface GuessSubmission {
  guesserId: string;
  targetChitId: string;
  guessedAuthorId: string;
  confidence: ConfidenceLevel;
  reactionText?: string;
  guessedLieIndex?: number;
  isCorrect?: boolean;
  pointsAwarded?: number;
}

export interface RoundResult {
  roundNumber: number;
  prompt: string;
  mode: GameMode;
  chits: {
    chitId: string;
    content: string;
    parsedStatements?: string[];
    lieIndex?: number;
    authorId: string;
    authorName: string;
    assignedToId: string;
    assignedToName: string;
    guess: {
      guesserId: string;
      guesserName: string;
      guessedAuthorId: string;
      guessedAuthorName: string;
      confidence: ConfidenceLevel;
      reactionText?: string;
      guessedLieIndex?: number;
      isCorrect: boolean;
      pointsAwarded: number;
    } | null;
    reactions: Record<string, ReactionType>;
  }[];
  scores: Record<string, number>;
  scoreDeltas: Record<string, number>;
}

export interface GameAward {
  id: string;
  title: string;
  icon: string;
  recipientName: string;
  recipientId: string;
  description: string;
  highlightText?: string;
}

export interface GameRoomConfig {
  totalRounds: number;
  mode: GameMode;
  writingTimeSeconds: number;
  guessingTimeSeconds: number;
  allowCustomPrompts: boolean;
}

export interface ClientPublicPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  isBot?: boolean;
  avatarSeed: string;
  score: number;
  hasSubmittedChit?: boolean;
  hasSubmittedGuess?: boolean;
}

export interface ClientAssignedChit {
  chitId: string;
  content: string;
  parsedStatements?: string[]; // for 2T1L
  isWhoWould?: boolean;
  eligibleAuthors: { id: string; name: string; avatarSeed: string }[];
}

export interface ClientGameState {
  roomCode: string;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  mode: GameMode;
  currentPrompt: string;
  timerSeconds: number;
  players: ClientPublicPlayer[];
  myPlayerId: string;
  isHost: boolean;
  // Specific phase payload
  assignedChit?: ClientAssignedChit | null;
  roundResults?: RoundResult | null;
  finalResults?: {
    leaderboard: {
      rank: number;
      player: ClientPublicPlayer;
      score: number;
      accuracy: number;
      stats: PlayerStats;
    }[];
    awards: GameAward[];
    chitWall: {
      roundNumber: number;
      prompt: string;
      answers: {
        authorName: string;
        content: string;
        reactions: Record<string, ReactionType>;
      }[];
    }[];
  } | null;
}
