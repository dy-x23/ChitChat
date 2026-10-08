'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Trophy,
  Smile,
  Heart,
  Zap,
  MessageCircle
} from 'lucide-react';
import { ClientGameState, ReactionType, RoundResultChit } from '../lib/types';
import { Avatar } from './Avatar';

interface RevealPhaseProps {
  gameState: ClientGameState;
  onReactChit: (chitId: string, reactionType: ReactionType) => void;
  onAdvanceNext: () => void;
}

const REACTIONS: { type: ReactionType; label: string; icon: string }[] = [
  { type: 'funny', label: 'Funniest', icon: '😂' },
  { type: 'relatable', label: 'Relatable', icon: '❤️' },
  { type: 'surprising', label: 'Surprising', icon: '😲' },
  { type: 'mindblown', label: 'Mind Blown', icon: '🤯' }
];

export const RevealPhase: React.FC<RevealPhaseProps> = ({
  gameState,
  onReactChit,
  onAdvanceNext
}) => {
  const roundResults = gameState.roundResults;
  const chits = roundResults?.chits || [];
  const [activeChitIndex, setActiveChitIndex] = useState(0);

  if (!roundResults || chits.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto py-12 text-center text-zinc-400">
        Calculating round results...
      </div>
    );
  }

  const currentChit: RoundResultChit = chits[activeChitIndex] || chits[0];
  const guess = currentChit.guess;
  const isLastRound = gameState.currentRound >= gameState.totalRounds;
  const isHost = gameState.isHost;

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Truth Revealed</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Round {gameState.currentRound} Confessions
        </h2>
        <p className="text-xs text-zinc-400 italic">
          &ldquo;{gameState.currentPrompt}&rdquo;
        </p>
      </div>

      {/* Chit Navigator Pills */}
      <div className="flex items-center justify-center gap-2">
        {chits.map((c, idx) => (
          <button
            key={c.chitId}
            onClick={() => setActiveChitIndex(idx)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              activeChitIndex === idx
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/25 scale-105'
                : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
            }`}
          >
            Chit #{idx + 1}
          </button>
        ))}
      </div>

      {/* Hero Reveal Card */}
      <div className="rounded-3xl bg-zinc-900/95 border-2 border-white/15 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 relative overflow-hidden transition-all">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* The Chit Text */}
        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-white/10 shadow-inner">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-2">
            THE CHIT
          </span>
          {currentChit.parsedStatements ? (
            <div className="space-y-2">
              {currentChit.parsedStatements.map((stmt, idx) => {
                const isLie = idx === currentChit.lieIndex;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-sm flex items-center justify-between ${
                      isLie
                        ? 'bg-red-950/30 border-red-500/50 text-red-200'
                        : 'bg-zinc-900 border-white/5 text-zinc-300'
                    }`}
                  >
                    <span>
                      <strong className="text-zinc-500 mr-2">{idx + 1}.</strong> {stmt}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isLie
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {isLie ? '🔴 THE LIE' : 'TRUTH'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-lg sm:text-xl font-bold text-white text-center leading-relaxed">
              &ldquo;{currentChit.content}&rdquo;
            </p>
          )}
        </div>

        {/* Written By (The Author Reveal) */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/30 via-purple-950/30 to-indigo-950/30 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              seed={currentChit.authorId}
              name={currentChit.authorName}
              size="lg"
            />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 block">
                WRITTEN BY
              </span>
              <span className="text-lg font-extrabold text-white">
                {currentChit.authorName}
              </span>
            </div>
          </div>
          <span className="text-2xl">🤫</span>
        </div>

        {/* The Guesser & Deduction */}
        {guess ? (
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Assigned to:</span>
                <span className="text-xs font-bold text-white">{guess.guesserName}</span>
              </div>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  guess.isCorrect
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {guess.isCorrect ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Guessed Correctly (+{guess.pointsAwarded} pts)</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Guessed Wrong (+0 pts)</span>
                  </>
                )}
              </div>
            </div>

            <div className="text-xs text-zinc-300">
              <span className="text-zinc-500">Their guess: </span>
              <span className="font-bold text-white">{guess.guessedAuthorName}</span>
              <span className="text-zinc-500 ml-2">
                (Confidence: {guess.confidence === 'sure' ? '🎯 High' : guess.confidence === 'fifty_fifty' ? '🤔 Medium' : '🎲 Low'})
              </span>
            </div>

            {guess.reactionText && (
              <div className="p-3 rounded-xl bg-zinc-900 border border-white/5 flex items-start gap-2 text-xs text-zinc-300">
                <MessageCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-zinc-500 font-semibold block text-[10px]">
                    WHY THEY THOUGHT SO:
                  </span>
                  <p className="italic">&ldquo;{guess.reactionText}&rdquo;</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-zinc-950 border border-white/10 text-center text-xs text-zinc-500">
            No guess recorded for this chit.
          </div>
        )}

        {/* Reaction Bar */}
        <div className="pt-2 border-t border-white/10">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2.5">
            React to this answer:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {REACTIONS.map((r) => {
              const count = Object.values(currentChit.reactions || {}).filter(
                (v) => v === r.type
              ).length;
              const hasReacted =
                currentChit.reactions?.[gameState.myPlayerId] === r.type;

              return (
                <button
                  key={r.type}
                  onClick={() => onReactChit(currentChit.chitId, r.type)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    hasReacted
                      ? 'bg-rose-500/20 border-rose-500/50 text-white ring-1 ring-rose-500/30'
                      : 'bg-zinc-950 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span className="text-base">{r.icon}</span>
                  <span className="text-[11px]">{r.label}</span>
                  {count > 0 && (
                    <span className="ml-1 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full text-zinc-300">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Round Leaderboard Standings Snapshot */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/10 p-4 backdrop-blur-xl">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Round {gameState.currentRound} Score Standings</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {gameState.players.map((p) => {
            const delta = roundResults.scoreDeltas[p.id] || 0;
            return (
              <div
                key={p.id}
                className="p-2.5 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 truncate">
                  <Avatar seed={p.avatarSeed} name={p.name} size="sm" />
                  <span className="text-xs font-bold text-white truncate">{p.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-amber-400 block">
                    {p.score}
                  </span>
                  {delta > 0 && (
                    <span className="text-[10px] text-emerald-400 font-bold">
                      +{delta}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Controls */}
      <div className="pt-2">
        {isHost ? (
          <button
            onClick={onAdvanceNext}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-500/25 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>{isLastRound ? 'See Final Leaderboard 🏆' : `Next Round (${gameState.currentRound + 1}/${gameState.totalRounds})`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 text-center text-xs text-zinc-400">
            Waiting for host to proceed to {isLastRound ? 'the grand finale' : 'the next round'}...
          </div>
        )}
      </div>
    </div>
  );
};
