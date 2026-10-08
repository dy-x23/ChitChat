'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientGameState,
  ConfidenceLevel,
  GameMode,
  ReactionType
} from '../lib/types';
import { sound } from '../lib/sound';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:4000`
    : 'http://localhost:4000');

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');

  const previousPhaseRef = useRef<string | null>(null);

  // Initialize player identity from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let storedId = localStorage.getItem('chit_player_id');
      if (!storedId) {
        storedId = 'p_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('chit_player_id', storedId);
      }
      setPlayerId(storedId);

      const storedName = localStorage.getItem('chit_player_name') || '';
      setPlayerName(storedName);
    }
  }, []);

  // Initialize Socket connection
  useEffect(() => {
    const s = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10
    });

    s.on('connect', () => {
      setIsConnected(true);
      // Attempt auto-reconnect if we have a roomCode in session
      if (typeof window !== 'undefined') {
        const storedRoom = sessionStorage.getItem('chit_room_code');
        const storedId = localStorage.getItem('chit_player_id');
        if (storedRoom && storedId) {
          s.emit('reconnect_room', { roomCode: storedRoom, playerId: storedId });
        }
      }
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('game_state_update', (state: ClientGameState) => {
      setGameState((prevState) => {
        // Trigger sound transitions when phase changes
        if (prevState?.phase !== state.phase) {
          if (state.phase === 'SHUFFLING') sound.playCardFlip();
          else if (state.phase === 'REVEAL') sound.playRevealGong();
          else if (state.phase === 'FINAL_RESULTS') sound.playWinFanfare();
        }
        return state;
      });

      if (typeof window !== 'undefined' && state.roomCode) {
        sessionStorage.setItem('chit_room_code', state.roomCode);
      }
    });

    s.on('timer_tick', ({ seconds }: { seconds: number }) => {
      setGameState((prev) => (prev ? { ...prev, timerSeconds: seconds } : prev));
      if (seconds <= 5 && seconds > 0) {
        sound.playTick();
      }
    });

    s.on('error_message', ({ message }: { message: string }) => {
      setErrorMessage(message);
      sound.playWrong();
      setTimeout(() => setErrorMessage(null), 4000);
    });

    s.on('room_created', ({ roomCode }: { roomCode: string }) => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('chit_room_code', roomCode);
      }
    });

    s.on('room_joined', ({ roomCode }: { roomCode: string }) => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('chit_room_code', roomCode);
      }
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const createRoom = useCallback(
    (name: string) => {
      if (!socket || !playerId) return;
      setPlayerName(name);
      if (typeof window !== 'undefined') {
        localStorage.setItem('chit_player_name', name);
      }
      socket.emit('create_room', { playerName: name, playerId });
    },
    [socket, playerId]
  );

  const joinRoom = useCallback(
    (roomCode: string, name: string) => {
      if (!socket || !playerId) return;
      setPlayerName(name);
      if (typeof window !== 'undefined') {
        localStorage.setItem('chit_player_name', name);
      }
      socket.emit('join_room', {
        roomCode: roomCode.trim().toUpperCase(),
        playerName: name,
        playerId
      });
    },
    [socket, playerId]
  );

  const updateConfig = useCallback(
    (config: { totalRounds?: number; mode?: GameMode; writingTimeSeconds?: number }) => {
      if (!socket) return;
      socket.emit('update_config', config);
    },
    [socket]
  );

  const addBot = useCallback(() => {
    if (!socket) return;
    socket.emit('add_bot');
  }, [socket]);

  const removeBot = useCallback(
    (botId: string) => {
      if (!socket) return;
      socket.emit('remove_bot', { botId });
    },
    [socket]
  );

  const startGame = useCallback(() => {
    if (!socket) return;
    socket.emit('start_game');
  }, [socket]);

  const submitPrompt = useCallback(
    (prompt: string) => {
      if (!socket) return;
      socket.emit('submit_custom_prompt', { prompt });
    },
    [socket]
  );

  const submitChit = useCallback(
    (content: string) => {
      if (!socket) return;
      sound.playSubmit();
      socket.emit('submit_chit', { content });
    },
    [socket]
  );

  const submitGuess = useCallback(
    (
      guessedAuthorId: string,
      confidence: ConfidenceLevel,
      reactionText?: string,
      guessedLieIndex?: number
    ) => {
      if (!socket) return;
      sound.playSubmit();
      socket.emit('submit_guess', {
        guessedAuthorId,
        confidence,
        reactionText,
        guessedLieIndex
      });
    },
    [socket]
  );

  const reactChit = useCallback(
    (chitId: string, reactionType: ReactionType) => {
      if (!socket) return;
      socket.emit('react_chit', { chitId, reactionType });
    },
    [socket]
  );

  const advanceNext = useCallback(() => {
    if (!socket) return;
    socket.emit('advance_next');
  }, [socket]);

  const resetGame = useCallback(() => {
    if (!socket) return;
    socket.emit('reset_game');
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('chit_room_code');
    }
    setGameState(null);
    window.location.reload();
  }, []);

  const myPlayer = gameState?.players.find((p) => p.id === playerId) || null;

  return {
    isConnected,
    gameState,
    errorMessage,
    playerId,
    playerName,
    myPlayer,
    createRoom,
    joinRoom,
    updateConfig,
    addBot,
    removeBot,
    startGame,
    submitPrompt,
    submitChit,
    submitGuess,
    reactChit,
    advanceNext,
    resetGame,
    leaveRoom
  };
}
