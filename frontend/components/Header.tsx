'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, LogOut, Users, Sparkles } from 'lucide-react';
import { ClientGameState } from '../lib/types';
import { sound } from '../lib/sound';

interface HeaderProps {
  gameState: ClientGameState | null;
  onLeaveRoom: () => void;
}

export const Header: React.FC<HeaderProps> = ({ gameState, onLeaveRoom }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    setIsMuted(sound.getMuted());
  }, []);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const copyRoomCode = () => {
    if (!gameState?.roomCode) return;
    navigator.clipboard.writeText(gameState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'LOBBY':
        return 'Lobby';
      case 'WRITING':
        return 'Writing Chits';
      case 'SHUFFLING':
        return 'Shuffling';
      case 'GUESSING':
        return 'Guessing Authors';
      case 'REVEAL':
        return 'The Reveal';
      case 'FINAL_RESULTS':
        return 'Final Standings';
      default:
        return phase;
    }
  };

  return (
    <header className="w-full max-w-5xl mx-auto px-4 py-3 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-zinc-950/60 sticky top-0 z-50">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-rose-500/20 text-lg">
          🤫
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            CHIT
          </h1>
          <p className="text-[10px] text-zinc-400 tracking-wider font-semibold uppercase -mt-0.5">
            The Anonymous Guessing Game
          </p>
        </div>
      </div>

      {/* Middle info (when inside room) */}
      {gameState && (
        <div className="hidden sm:flex items-center gap-2 md:gap-3">
          {/* Room Code Badge */}
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/10 hover:border-amber-500/50 hover:bg-zinc-800 transition-all text-xs font-mono font-medium text-zinc-300 group"
            title="Click to copy room code"
          >
            <span className="text-zinc-500">ROOM:</span>
            <span className="text-amber-400 font-bold tracking-wider">{gameState.roomCode}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
            )}
          </button>

          {/* Round Indicator */}
          {gameState.phase !== 'LOBBY' && gameState.phase !== 'FINAL_RESULTS' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                Round {gameState.currentRound} / {gameState.totalRounds}
              </span>
            </div>
          )}

          {/* Phase Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-white/10 text-zinc-300 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{getPhaseLabel(gameState.phase)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSound}
          className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          aria-label="Toggle Sound"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {gameState && (
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 hover:border-red-500/30 transition-colors text-xs font-medium"
            title="Leave Game"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Leave</span>
          </button>
        )}
      </div>
    </header>
  );
};
