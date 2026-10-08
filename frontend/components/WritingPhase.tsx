'use client';

import React, { useState } from 'react';
import { Clock, Send, Lock, CheckCircle2, HelpCircle, Sparkles, UserCheck } from 'lucide-react';
import { ClientGameState } from '../lib/types';
import { Avatar } from './Avatar';

interface WritingPhaseProps {
  gameState: ClientGameState;
  onSubmitChit: (content: string) => void;
}

export const WritingPhase: React.FC<WritingPhaseProps> = ({ gameState, onSubmitChit }) => {
  const [content, setContent] = useState('');
  // For Two Truths One Lie
  const [statement1, setStatement1] = useState('');
  const [statement2, setStatement2] = useState('');
  const [statement3, setStatement3] = useState('');
  const [lieIndex, setLieIndex] = useState(2);
  // For Who Would
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  const myPlayer = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const hasSubmitted = myPlayer?.hasSubmittedChit || false;
  const isTwoTruths = gameState.mode === 'TWO_TRUTHS_LIE';
  const isWhoWould = gameState.mode === 'WHO_WOULD';

  const timer = gameState.timerSeconds;
  const isLowTime = timer <= 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasSubmitted) return;

    if (isTwoTruths) {
      if (!statement1.trim() || !statement2.trim() || !statement3.trim()) return;
      const payload = JSON.stringify({
        statements: [statement1.trim(), statement2.trim(), statement3.trim()],
        lieIndex
      });
      onSubmitChit(payload);
    } else if (isWhoWould) {
      if (!selectedPlayerId) return;
      const target = gameState.players.find((p) => p.id === selectedPlayerId);
      onSubmitChit(target ? target.name : 'Unknown');
    } else {
      if (!content.trim()) return;
      onSubmitChit(content.trim());
    }
  };

  const submittedCount = gameState.players.filter((p) => p.hasSubmittedChit).length;
  const totalCount = gameState.players.length;

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* Top Status Bar: Timer + Submissions Progress */}
      <div className="flex items-center justify-between bg-zinc-900/90 border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-2">
          <Clock
            className={`w-4 h-4 ${isLowTime ? 'text-red-400 animate-bounce' : 'text-amber-400'}`}
          />
          <span className="text-xs text-zinc-400 font-medium">Time Remaining:</span>
          <span
            className={`text-sm font-mono font-bold ${
              isLowTime ? 'text-red-400 animate-pulse text-base' : 'text-amber-400'
            }`}
          >
            00:{timer < 10 ? `0${timer}` : timer}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>Chits Submitted:</span>
          <span className="font-bold text-white">
            {submittedCount} / {totalCount}
          </span>
        </div>
      </div>

      {/* Prompt Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950/70 via-purple-950/50 to-zinc-900 border border-indigo-500/30 p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Question</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight max-w-xl mx-auto">
          &ldquo;{gameState.currentPrompt}&rdquo;
        </h2>
      </div>

      {/* The Tactile Chit Paper Card */}
      <div className="rounded-3xl bg-zinc-900/95 border border-white/15 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <h3 className="text-base font-extrabold text-white tracking-wide">
              YOUR ANONYMOUS CHIT
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <Lock className="w-3 h-3" />
            <span>100% Anonymous</span>
          </span>
        </div>

        {!hasSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isTwoTruths ? (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  Write 3 statements about yourself. Mark the one that is a lie:
                </p>
                {[
                  { val: statement1, set: setStatement1, idx: 0, label: 'Statement 1' },
                  { val: statement2, set: setStatement2, idx: 1, label: 'Statement 2' },
                  { val: statement3, set: setStatement3, idx: 2, label: 'Statement 3' }
                ].map((s) => (
                  <div key={s.idx} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-zinc-300 uppercase">
                        {s.label}
                      </label>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="lieSelection"
                          checked={lieIndex === s.idx}
                          onChange={() => setLieIndex(s.idx)}
                          className="text-red-500 focus:ring-red-400"
                        />
                        <span
                          className={`text-[11px] font-bold ${
                            lieIndex === s.idx ? 'text-red-400' : 'text-zinc-500'
                          }`}
                        >
                          {lieIndex === s.idx ? '🔴 This is the LIE' : 'Truth'}
                        </span>
                      </label>
                    </div>
                    <input
                      type="text"
                      placeholder={`Enter ${s.label.toLowerCase()}...`}
                      value={s.val}
                      onChange={(e) => s.set(e.target.value)}
                      maxLength={120}
                      className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 text-sm"
                    />
                  </div>
                ))}
              </div>
            ) : isWhoWould ? (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  Secretly cast your vote on who in this room fits best:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {gameState.players.map((p) => {
                    const isSelected = selectedPlayerId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlayerId(p.id)}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                          isSelected
                            ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/30'
                            : 'bg-zinc-950 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Avatar seed={p.avatarSeed} name={p.name} size="md" />
                        <span className="text-xs font-bold text-white truncate max-w-full">
                          {p.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-zinc-400 mb-2">
                  Answer honestly or hilariously. Your friends will see the answer and try to guess that you wrote it!
                </p>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="e.g. Eating Maggi at 2 AM in complete silence..."
                  rows={4}
                  maxLength={250}
                  className="w-full p-4 rounded-2xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/80 focus:ring-2 focus:ring-rose-500/20 text-base font-medium leading-relaxed resize-none transition-all"
                />
                <div className="flex justify-between items-center text-xs text-zinc-500 mt-1">
                  <span>Keep it fun and friendly</span>
                  <span>{content.length} / 250</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={
                isTwoTruths
                  ? !statement1.trim() || !statement2.trim() || !statement3.trim()
                  : isWhoWould
                  ? !selectedPlayerId
                  : !content.trim()
              }
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 text-white font-bold text-sm tracking-wide shadow-xl shadow-rose-600/25 hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Fold &amp; Submit Chit</span>
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">Chit Folded &amp; Submitted!</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Your answer is securely sealed in the server vault. Waiting for the remaining players to submit before shuffling...
            </p>
          </div>
        )}
      </div>

      {/* Live Player Submission Badges */}
      <div className="rounded-2xl bg-zinc-900/60 border border-white/5 p-4 backdrop-blur-md">
        <h4 className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
          Player Status
        </h4>
        <div className="flex flex-wrap gap-2">
          {gameState.players.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                p.hasSubmittedChit
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-zinc-950 border-white/10 text-zinc-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  p.hasSubmittedChit ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span>{p.name}</span>
              {p.hasSubmittedChit && <span className="text-[10px]">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
