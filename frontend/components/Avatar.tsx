'use client';

import React from 'react';
import { Crown, Bot } from 'lucide-react';

interface AvatarProps {
  seed: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isHost?: boolean;
  isBot?: boolean;
  isConnected?: boolean;
  className?: string;
}

const GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-blue-600',
  'from-fuchsia-500 to-rose-600',
  'from-violet-500 to-indigo-600',
  'from-teal-400 to-emerald-600'
];

export const Avatar: React.FC<AvatarProps> = ({
  seed,
  name,
  size = 'md',
  isHost = false,
  isBot = false,
  isConnected = true,
  className = ''
}) => {
  // Deterministic gradient choice based on seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const gradient = GRADIENTS[Math.abs(hash) % GRADIENTS.length];

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm font-semibold',
    lg: 'w-14 h-14 text-base font-bold',
    xl: 'w-20 h-20 text-xl font-bold'
  };

  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-tr ${gradient} text-white flex items-center justify-center shadow-lg shadow-purple-500/10 ring-2 ring-white/10 transition-transform select-none`}
      >
        {isBot ? <Bot className={size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'} /> : initial}
      </div>

      {isHost && (
        <span
          className="absolute -top-1.5 -right-1.5 bg-amber-400 text-amber-950 p-1 rounded-full shadow-md shadow-amber-500/30"
          title="Room Host"
        >
          <Crown className="w-3 h-3 fill-amber-950" />
        </span>
      )}

      {isConnected === false && (
        <span
          className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 ring-2 ring-zinc-950"
          title="Disconnected"
        />
      )}
    </div>
  );
};
