'use client';

import React, { useState } from 'react';
import {
  Users,
  Play,
  Copy,
  Check,
  Bot,
  UserPlus,
  Sparkles,
  Layers,
  HelpCircle,
  Flame,
  Heart,
  Shuffle,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { Avatar } from './Avatar';
import { ClientGameState, GameMode } from '../lib/types';

interface LobbyViewProps {
  gameState: ClientGameState | null;
  playerId: string;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
  onUpdateConfig: (config: { totalRounds?: number; mode?: GameMode }) => void;
  onAddBot: () => void;
  onRemoveBot: (botId: string) => void;
  onStartGame: () => void;
}

const MODES: { id: GameMode; title: string; desc: string; icon: React.ReactNode; badge?: string }[] = [
  {
    id: 'STANDARD_MIXED',
    title: 'Mixed Blend',
    desc: 'The best mix of fun confessions and deeper questions.',
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    badge: 'Popular'
  },
  {
    id: 'STANDARD_FUN',
    title: 'Fun & Silly',
    desc: 'Guilty pleasures, 2 AM habits, hilarious regrets.',
    icon: <Flame className="w-4 h-4 text-rose-400" />
  },
  {
    id: 'STANDARD_DEEP',
    title: 'Deep & Psychological',
    desc: 'Misconceptions, green flags, dreams, and hidden sides.',
    icon: <Heart className="w-4 h-4 text-purple-400" />
  },
  {
    id: 'STANDARD_RANDOM',
    title: 'Pure Random',
    desc: 'Unpredictable, off-the-wall questions to spice things up.',
    icon: <Shuffle className="w-4 h-4 text-cyan-400" />
  },
  {
    id: 'WHO_WOULD',
    title: 'Who Would?',
    desc: 'Pick which friend in the room would most likely do it!',
    icon: <Users className="w-4 h-4 text-emerald-400" />,
    badge: 'Party'
  },
  {
    id: 'TWO_TRUTHS_LIE',
    title: '2 Truths, 1 Lie',
    desc: 'Write 3 statements anonymously. Guess author AND uncover the lie!',
    icon: <ShieldCheck className="w-4 h-4 text-indigo-400" />,
    badge: 'Challenge'
  }
];

export const LobbyView: React.FC<LobbyViewProps> = ({
  gameState,
  playerId,
  onCreateRoom,
  onJoinRoom,
  onUpdateConfig,
  onAddBot,
  onRemoveBot,
  onStartGame
}) => {
  // Landing state
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('chit_player_name');
    if (saved) {
      setPlayerNameInput(saved);
    }
  }, []);

  // If NOT in room yet:
  if (!gameState) {
    return (
      <div className="w-full max-w-lg mx-auto py-8 px-4">
        {/* Hero Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-white/10 text-amber-300 text-xs font-semibold mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Anonymous Social Party Game • 3 to 8 Players</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-3">
            Write. Guess.{' '}
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
              Laugh.
            </span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            Everyone secretly submits an anonymous confession or answer. Chits get shuffled. Can you deduce which of your friends wrote it?
          </p>
        </div>

        {/* Tab card */}
        <div className="rounded-3xl bg-zinc-900/90 border border-white/10 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600" />

          {/* Toggle buttons */}
          <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-2xl mb-6 border border-white/5">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-lg shadow-rose-500/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Create Game
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'join'
                  ? 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-lg shadow-rose-500/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Join Game
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Your Nickname
              </label>
              <input
                type="text"
                placeholder="e.g. Alex, Rahul, Sam..."
                value={playerNameInput}
                onChange={(e) => setPlayerNameInput(e.target.value)}
                maxLength={20}
                className="w-full px-4 py-3.5 rounded-2xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/80 focus:ring-2 focus:ring-rose-500/20 text-sm font-medium transition-all"
              />
            </div>

            {activeTab === 'join' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  4-Character Room Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. K7XM"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  maxLength={4}
                  className="w-full px-4 py-3.5 rounded-2xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 text-base font-mono uppercase tracking-widest text-center transition-all"
                />
              </div>
            )}

            <button
              onClick={() => {
                const name = playerNameInput.trim() || 'Player';
                if (activeTab === 'create') {
                  onCreateRoom(name);
                } else {
                  if (roomCodeInput.trim().length >= 3) {
                    onJoinRoom(roomCodeInput.trim(), name);
                  }
                }
              }}
              disabled={!playerNameInput.trim() || (activeTab === 'join' && !roomCodeInput.trim())}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 text-white font-bold text-sm tracking-wide shadow-xl shadow-rose-600/30 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{activeTab === 'create' ? 'Host New Game Room' : 'Join Game Room'}</span>
            </button>
          </div>

          {/* Quick Demo Hint */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-xs text-zinc-400">
              💡 <span className="text-zinc-300 font-medium">Solo or Demo testing?</span> Create a room and click &ldquo;Add Bot Friend&rdquo; to test the entire game loop in seconds!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // INSIDE LOBBY
  const copyRoomCode = () => {
    navigator.clipboard.writeText(gameState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyInviteLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}?room=${gameState.roomCode}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isHost = gameState.isHost;
  const playerCount = gameState.players.length;
  const canStart = playerCount >= 3;

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Room Code Showcase Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border border-white/10 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Room Live • Ready for Friends</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Game Room Lobby
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Share this room code with friends so they can join from their phones or laptops.
          </p>
        </div>

        {/* Big Code Pill */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="px-6 py-3.5 rounded-2xl bg-zinc-950 border border-white/10 shadow-inner flex items-center gap-3">
            <span className="text-xs uppercase text-zinc-500 font-semibold tracking-wider">
              CODE:
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 tracking-widest">
              {gameState.roomCode}
            </span>
          </div>
          <button
            onClick={copyRoomCode}
            className="px-4 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 border border-white/10 shadow-md"
            title="Copy room code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Players, Right = Host Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Players List (col 7) */}
        <div className="lg:col-span-7 rounded-3xl bg-zinc-900/80 border border-white/10 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Players Joined ({playerCount}/8)
                </h3>
              </div>
              <span className="text-xs text-zinc-400">Min 3 • Ideal 4</span>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {gameState.players.map((p) => {
                const isMe = p.id === playerId;
                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      isMe
                        ? 'bg-rose-950/20 border-rose-500/30'
                        : 'bg-zinc-950/60 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        seed={p.avatarSeed}
                        name={p.name}
                        size="md"
                        isHost={p.isHost}
                        isBot={p.isBot}
                        isConnected={p.isConnected}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-white leading-tight">
                            {p.name}
                          </span>
                          {isMe && (
                            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded-full font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          {p.isHost ? 'Room Host 👑' : p.isBot ? 'Bot Friend 🤖' : 'Ready to play'}
                        </span>
                      </div>
                    </div>

                    {isHost && p.isBot && (
                      <button
                        onClick={() => onRemoveBot(p.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-900 transition-colors"
                        title="Remove bot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Empty slots placeholders */}
              {Array.from({ length: Math.max(0, 4 - playerCount) }).map((_, idx) => (
                <div
                  key={`empty_${idx}`}
                  className="p-3.5 rounded-2xl border border-dashed border-white/10 bg-zinc-950/20 flex items-center gap-3 text-zinc-500"
                >
                  <div className="w-11 h-11 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-xs font-mono">
                    ?
                  </div>
                  <span className="text-xs italic">Waiting for friend...</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Bot Demo Button */}
          {isHost && playerCount < 8 && (
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-300">Testing alone or need players?</p>
                <p className="text-[11px] text-zinc-400">Add friendly bot players with realistic confessions.</p>
              </div>
              <button
                onClick={onAddBot}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/20 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Bot className="w-4 h-4" />
                <span>+ Add Bot Friend</span>
              </button>
            </div>
          )}
        </div>

        {/* Host Configuration Panel (col 5) */}
        <div className="lg:col-span-5 rounded-3xl bg-zinc-900/80 border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Layers className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">Game Settings</h3>
          </div>

          {/* Rounds selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
              Number of Rounds
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 7, 10].map((rounds) => (
                <button
                  key={rounds}
                  disabled={!isHost}
                  onClick={() => onUpdateConfig({ totalRounds: rounds })}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    gameState.totalRounds === rounds
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/30'
                      : 'bg-zinc-950 text-zinc-400 border-white/10 hover:text-white disabled:opacity-60'
                  }`}
                >
                  {rounds}
                </button>
              ))}
            </div>
          </div>

          {/* Game Mode selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
              Game Mode
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {MODES.map((m) => {
                const isSelected = gameState.mode === m.id;
                return (
                  <button
                    key={m.id}
                    disabled={!isHost}
                    onClick={() => onUpdateConfig({ mode: m.id })}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                        : 'bg-zinc-950/60 border-white/5 hover:border-white/15 disabled:opacity-60'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-zinc-900 border border-white/10 shrink-0">
                      {m.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{m.title}</span>
                        {m.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Game Action */}
          <div className="pt-2">
            {isHost ? (
              <button
                onClick={onStartGame}
                disabled={!canStart}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-500/25 hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>
                  {canStart ? 'Start Game Now' : `Need at least 3 players (${playerCount}/8)`}
                </span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 text-center">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping mr-2" />
                <span className="text-xs text-zinc-300 font-medium">
                  Waiting for host to configure and start the game...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
