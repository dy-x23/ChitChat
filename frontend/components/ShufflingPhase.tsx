'use client';

import React from 'react';
import { Shuffle, Sparkles, Lock } from 'lucide-react';

export const ShufflingPhase: React.FC = () => {
  return (
    <div className="w-full max-w-md mx-auto py-16 px-4 text-center space-y-8">
      {/* Animated Floating Chits Graphic */}
      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 via-purple-500/20 to-amber-500/20 rounded-full blur-2xl animate-pulse" />

        {/* Card 1 */}
        <div className="absolute w-28 h-36 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-xl border border-white/20 flex flex-col items-center justify-center text-white transform -rotate-12 translate-x-4 animate-bounce duration-1000">
          <span className="text-2xl mb-1">📝</span>
          <span className="text-[10px] font-mono tracking-widest uppercase opacity-75">Chit #1</span>
        </div>

        {/* Card 2 */}
        <div className="absolute w-28 h-36 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-700 shadow-2xl border border-white/20 flex flex-col items-center justify-center text-white transform rotate-12 -translate-x-4 animate-pulse">
          <span className="text-2xl mb-1">🤫</span>
          <span className="text-[10px] font-mono tracking-widest uppercase opacity-75">Secret</span>
        </div>

        {/* Card 3 (Center) */}
        <div className="relative w-32 h-40 rounded-2xl bg-zinc-900 shadow-2xl border border-amber-500/40 flex flex-col items-center justify-center text-white z-10">
          <div className="p-3 rounded-full bg-amber-500/20 text-amber-300 mb-2 animate-spin duration-3000">
            <Shuffle className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold tracking-wider uppercase text-amber-300">Shuffling</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Guaranteed Anonymity Matrix</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Shuffling Anonymous Chits...
        </h2>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto">
          Distributing chits fairly so everyone gets one mystery answer and nobody receives their own!
        </p>
      </div>
    </div>
  );
};
