import { Server, Socket } from 'socket.io';
import { GameManager } from '../game/GameManager.js';
import { ConfidenceLevel, GameMode, ReactionType } from '../types/index.js';

export function setupSocketHandlers(io: Server, gameManager: GameManager) {
  io.on('connection', (socket: Socket) => {
    // 1. Create Room
    socket.on('create_room', ({ playerName, playerId }: { playerName: string; playerId: string }) => {
      const room = gameManager.createRoom(playerId, playerName, socket.id);
      socket.join(room.code);
      socket.emit('room_created', { roomCode: room.code });
      room.broadcastState();
    });

    // 2. Join Room
    socket.on(
      'join_room',
      ({
        roomCode,
        playerName,
        playerId
      }: {
        roomCode: string;
        playerName: string;
        playerId: string;
      }) => {
        const result = gameManager.joinRoom(roomCode, playerId, playerName, socket.id);
        if (!result.success || !result.room) {
          socket.emit('error_message', { message: result.error || 'Failed to join room' });
          return;
        }
        socket.join(result.room.code);
        socket.emit('room_joined', { roomCode: result.room.code });
        result.room.broadcastState();
      }
    );

    // 3. Reconnect Room
    socket.on('reconnect_room', ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      const room = gameManager.getRoom(roomCode);
      if (!room) {
        socket.emit('error_message', { message: 'Room no longer exists.' });
        return;
      }
      const ok = room.reconnectPlayer(playerId, socket.id);
      if (ok) {
        socket.join(room.code);
        const state = room.getClientStateForPlayer(playerId);
        socket.emit('game_state_update', state);
      }
    });

    // 4. Update Game Config (Host only)
    socket.on(
      'update_config',
      (configUpdate: { totalRounds?: number; mode?: GameMode; writingTimeSeconds?: number }) => {
        const match = gameManager.getRoomBySocket(socket.id);
        if (!match) return;
        const { room, playerId } = match;
        if (room.hostId === playerId && room.phase === 'LOBBY') {
          room.updateConfig(configUpdate);
        }
      }
    );

    // 5. Add Bot Player (Host only)
    socket.on('add_bot', () => {
      const match = gameManager.getRoomBySocket(socket.id);
      if (!match) return;
      const { room, playerId } = match;
      if (room.hostId === playerId && room.phase === 'LOBBY') {
        room.addBotPlayer();
      }
    });

    // 6. Remove Bot Player
    socket.on('remove_bot', ({ botId }: { botId: string }) => {
      const match = gameManager.getRoomBySocket(socket.id);
      if (!match) return;
      const { room, playerId } = match;
      if (room.hostId === playerId && room.phase === 'LOBBY') {
        room.removeBotPlayer(botId);
      }
    });

    // 7. Start Game (Host only)
    socket.on('start_game', () => {
      const match = gameManager.getRoomBySocket(socket.id);
      if (!match) return;
      const { room, playerId } = match;
      if (room.hostId === playerId && room.phase === 'LOBBY') {
        if (room.players.size < 3) {
          socket.emit('error_message', {
            message: 'Need at least 3 players to start! Add a bot or invite a friend.'
          });
          return;
        }
        room.startGame();
      }
    });

    // 8. Custom Prompt Submit (Host only)
    socket.on('submit_custom_prompt', ({ prompt }: { prompt: string }) => {
      const match = gameManager.getRoomBySocket(socket.id);
      if (!match) return;
      const { room, playerId } = match;
      if (room.hostId === playerId && prompt.trim()) {
        room.setPrompt(prompt.trim());
      }
    });

    // 9. Submit Chit Answer
    socket.on('submit_chit', ({ content }: { content: string }) => {
      const match = gameManager.getRoomBySocket(socket.id);
      if (!match) return;
      const { room, playerId } = match;
      room.submitChit(playerId, content);
    });

    // 10. Submit Guess
    socket.on(
      'submit_guess',
      (payload: {
        guessedAuthorId: string;
        confidence: ConfidenceLevel;
        reactionText?: string;
        guessedLieIndex?: number;
      }) => {
        const match = gameManager.getRoomBySocket(socket.id);
        if (!match) return;
        const { room, playerId } = match;
        const assignedChitId = room.assignments.get(playerId);
        if (!assignedChitId) return;

        room.submitGuess(playerId, {
          guesserId: playerId,
          targetChitId: assignedChitId,
          guessedAuthorId: payload.guessedAuthorId,
          confidence: payload.confidence || 'sure',
          reactionText: payload.reactionText?.trim(),
          guessedLieIndex: payload.guessedLieIndex
        });
      }
    );

    // 11. Add Post-Round Reaction
    socket.on(
      'react_chit',
      ({ chitId, reactionType }: { chitId: string; reactionType: ReactionType }) => {
        const match = gameManager.getRoomBySocket(socket.id);
        if (!match) return;
        const { room, playerId } = match;
        room.addReaction(playerId, chitId, reactionType);
      }
    );

    // 12. Advance Next Round / Results
    socket.on('advance_next', () => {
      const match = gameManager.getRoomBySocket(socket.id);
      if (!match) return;
      const { room, playerId } = match;
      if (room.hostId === playerId) {
        room.advanceNext();
      }
    });

    // 13. Reset / Play Again
    socket.on('reset_game', () => {
      const match = gameManager.getRoomBySocket(socket.id);
      if (!match) return;
      const { room, playerId } = match;
      if (room.hostId === playerId) {
        room.resetToLobby();
      }
    });

    // 14. Disconnect
    socket.on('disconnect', () => {
      gameManager.handleDisconnect(socket.id);
    });
  });
}
