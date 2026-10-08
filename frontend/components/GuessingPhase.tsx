'use client';

import React, { useState } from 'react';
import {
  Clock,
  HelpCircle,
  CheckCircle2,
  Send,
  Sparkles,
  Target,
  Dice5,
  Smile,
  ShieldAlert
} from 'lucide-react';
import { ClientGameState, ConfidenceLevel } from '../lib/types';
import { Avatar } from './Avatar';

interface GuessingPhaseProps {
  gameState: ClientGameState;
  onSubmitGuess: (
    guessedAuthorId: string,
    confidence: ConfidenceLevel,
    reactionText?: string,
    guessedLieIndex?: number
  ) => void;
}

export const GuessingPhase: React.FC<GuessingPhaseProps> = ({ gameState, onSubmitGuess }) => {
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>('');
  const [confidence, setConfidence] = useState<ConfidenceLevel>('sure');
  const [reactionText, setReactionText] = useState<string>('');
  const [selectedLieIndex, setSelectedLieIndex] = useState<number>(0);

  const myPlayer = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const hasSubmitted = myPlayer?.hasSubmittedGuess || false;
  const assignedChit = gameState.assignedChit;
  const isTwoTruths = gameState.mode === 'TWO_TRUTHS_LIE';

  const timer = gameState.timerSeconds;
  const isLowTime = timer <= 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuthorId || hasSubmitted) return;
    onSubmitGuess(
      selectedAuthorId,
      confidence,
      reactionText.trim() || undefined,
      isTwoTruths ? selectedLieIndex : undefined
    );
  };

  const submittedCount = gameState.players.filter((p) => p.hasSubmittedGuess).length;
  const totalCount = gameState.players.length;

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between bg-zinc-900/90 border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-2">
          <Clock
            className={`w-4 h-4 ${isLowTime ? 'text-red-400 animate-bounce' : 'text-amber-400'}`}
          />
          <span className="text-xs text-zinc-400 font-medium">Guessing Time:</span>
          <span
            className={`text-sm font-mono font-bold ${
              isLowTime ? 'text-red-400 animate-pulse text-base' : 'text-amber-400'
            }`}
          >
            00:{timer < 10 ? `0${timer}` : timer}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Target className="w-4 h-4 text-purple-400" />
          <span>Guesses In:</span>
          <span className="font-bold text-white">
            {submittedCount} / {totalCount}
          </span>
        </div>
      </div>

      {/* The Mystery Chit Card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-amber-950/20 via-zinc-900 to-zinc-900/95 border-2 border-amber-500/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Stamp */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 border border-amber-500/40 text-amber-400/80 rounded-xl px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest rotate-6">
          ANONYMOUS CHIT
        </div>

        <div className="mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 block mb-1">
            Original Question
          </span>
          <p className="text-xs text-zinc-400 italic leading-relaxed">
            &ldquo;{gameState.currentPrompt}&rdquo;
          </p>
        </div>

        {/* The Mystery Content */}
        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-white/10 my-4 shadow-inner">
          {assignedChit?.parsedStatements ? (
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                3 Statements from Unknown Friend:
              </span>
              {assignedChit.parsedStatements.map((stmt, idx) => (
                <div
                  key={idx}
                  onClick={() => !hasSubmitted && setSelectedLieIndex(idx)}
                  className={`p-3 rounded-xl border text-sm transition-all cursor-pointer flex items-center justify-between ${
                    selectedLieIndex === idx
                      ? 'bg-red-950/30 border-red-500/50 text-white font-medium'
                      : 'bg-zinc-900/70 border-white/5 text-zinc-300 hover:border-white/15'
                  }`}
                >
                  <span>
                    <strong className="text-zinc-500 mr-2">{idx + 1}.</strong> {stmt}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      selectedLieIndex === idx
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'text-zinc-500'
                    }`}
                  >
                    {selectedLieIndex === idx ? 'Your Lie Pick' : 'Select if Lie'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-2">
              <span className="text-3xl block mb-2 opacity-80">💭</span>
              <p className="text-lg sm:text-xl font-bold text-white tracking-tight leading-relaxed">
                &ldquo;{assignedChit?.content || 'Loading mystery chit...'}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Deduction Form */}
        {!hasSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            {/* Step 1: Who wrote this? */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5">
                Who do you think wrote this?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {assignedChit?.eligibleAuthors.map((author) => {
                  const isSelected = selectedAuthorId === author.id;
                  return (
                    <button
                      key={author.id}
                      type="button"
                      onClick={() => setSelectedAuthorId(author.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-gradient-to-r from-rose-500/30 to-purple-500/30 border-rose-500 ring-2 ring-rose-500/40 text-white shadow-lg'
                          : 'bg-zinc-950 border-white/10 hover:border-white/20 text-zinc-300'
                      }`}
                    >
                      <Avatar seed={author.avatarSeed} name={author.name} size="sm" />
                      <span className="text-xs font-bold truncate">{author.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Confidence Bonus */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Confidence Bonus
                </label>
                <span className="text-[11px] text-zinc-400">Higher risk = more points</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sure' as ConfidenceLevel, label: 'Pretty Sure', points: '+100 pts', icon: '🎯' },
                  { id: 'fifty_fifty' as ConfidenceLevel, label: '50 / 50', points: '+50 pts', icon: '🤔' },
                  { id: 'no_idea' as ConfidenceLevel, label: 'No Idea', points: '+25 pts', icon: '🎲' }
                ].map((c) => {
                  const isSelected = confidence === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setConfidence(c.id)}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-white font-bold ring-2 ring-amber-500/30'
                          : 'bg-zinc-950 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="text-base block mb-0.5">{c.icon}</span>
                      <span className="text-xs font-bold block">{c.label}</span>
                      <span className="text-[10px] text-amber-400 font-semibold">{c.points}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Why do you think so? (Optional Reaction Comment) */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Why do you think they wrote this? (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. This is 100% Rahul because he literally did this last week 😂"
                value={reactionText}
                onChange={(e) => setReactionText(e.target.value)}
                maxLength={140}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-xs sm:text-sm font-medium transition-all"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Revealed alongside the chit in the next phase!
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedAuthorId}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white font-bold text-sm tracking-wide shadow-xl shadow-rose-600/25 hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-4"
            >
              <Send className="w-4 h-4" />
              <span>Lock In My Guess</span>
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">Guess Locked In!</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Waiting for friends to lock in their guesses. Get ready for the dramatic author reveal!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
