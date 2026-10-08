'use client';

import React, { useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { Header } from '../components/Header';
import { LobbyView } from '../components/LobbyView';
import { WritingPhase } from '../components/WritingPhase';
import { ShufflingPhase } from '../components/ShufflingPhase';
import { GuessingPhase } from '../components/GuessingPhase';
import { RevealPhase } from '../components/RevealPhase';
import { FinalResultsView } from '../components/FinalResultsView';
import { AlertCircle, WifiOff } from 'lucide-react';

export default function Home() {
  const {
    isConnected,
    gameState,
    errorMessage,
    playerId,
    createRoom,
    joinRoom,
    updateConfig,
    addBot,
    removeBot,
    startGame,
    submitChit,
    submitGuess,
    reactChit,
    advanceNext,
    resetGame,
    leaveRoom
  } = useSocket();

  // Check URL search params for invite link (?room=K7XM)
  useEffect(() => {
    if (typeof window !== 'undefined' && !gameState) {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      const name = localStorage.getItem('chit_player_name');
      if (roomParam && name && isConnected) {
        joinRoom(roomParam, name);
      }
    }
  }, [isConnected, gameState, joinRoom]);

  const renderPhaseView = () => {
    if (!gameState || gameState.phase === 'LOBBY') {
      return (
        <LobbyView
          gameState={gameState}
          playerId={playerId}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onUpdateConfig={updateConfig}
          onAddBot={addBot}
          onRemoveBot={removeBot}
          onStartGame={startGame}
        />
      );
    }

    switch (gameState.phase) {
      case 'WRITING':
        return <WritingPhase gameState={gameState} onSubmitChit={submitChit} />;
      case 'SHUFFLING':
        return <ShufflingPhase />;
      case 'GUESSING':
        return <GuessingPhase gameState={gameState} onSubmitGuess={submitGuess} />;
      case 'REVEAL':
        return (
          <RevealPhase
            gameState={gameState}
            onReactChit={reactChit}
            onAdvanceNext={advanceNext}
          />
        );
      case 'FINAL_RESULTS':
        return <FinalResultsView gameState={gameState} onResetGame={resetGame} />;
      default:
        return (
          <div className="text-center py-20 text-zinc-400">
            Phase: {gameState.phase}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation & Status */}
      <Header gameState={gameState} onLeaveRoom={leaveRoom} />

      {/* Disconnection Warning */}
      {!isConnected && (
        <div className="bg-red-500/15 border-b border-red-500/30 text-red-400 px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Connecting to realtime game server... (Make sure backend is running)</span>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-2 border border-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Game Screen */}
      <main className="flex-1 flex flex-col justify-center">{renderPhaseView()}</main>

      {/* Footer */}
      <footer className="w-full py-4 text-center border-t border-white/5 text-[11px] text-zinc-400">
        CHIT 🤫 • Anonymous Guessing Party Game • Real-time Multiplayer
      </footer>
    </div>
  );
}
