'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Medal,
  Sparkles,
  RotateCcw,
  BookOpen,
  Search,
  Shield,
  Smile,
  Flame,
  MessageSquare,
  Award
} from 'lucide-react';
import { ClientGameState, GameAward } from '../lib/types';
import { Avatar } from './Avatar';

interface FinalResultsViewProps {
  gameState: ClientGameState;
  onResetGame: () => void;
}

export const FinalResultsView: React.FC<FinalResultsViewProps> = ({ gameState, onResetGame }) => {
  const [activeWallRound, setActiveWallRound] = useState<number>(1);
  const finalResults = gameState.finalResults;

  useEffect(() => {
    // Launch celebratory confetti bursts!
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#f43f5e', '#ec4899', '#8b5cf6', '#eab308', '#10b981'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  if (!finalResults) {
    return (
      <div className="w-full max-w-xl mx-auto py-12 text-center text-zinc-400">
        Calculating final scores and awards...
      </div>
    );
  }

  const { leaderboard, awards, chitWall } = finalResults;
  const winner = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];
  const isHost = gameState.isHost;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 space-y-10">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
          <Trophy className="w-3.5 h-3.5" />
          <span>Game Finished</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          🏆 Victory Celebration
        </h2>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          All rounds completed! Here is how your friendship circle stacks up in intuition and deception.
        </p>
      </div>

      {/* The Podium */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-2xl mx-auto pt-6 pb-2">
        {/* 2nd Place */}
        {second ? (
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <Avatar seed={second.player.avatarSeed} name={second.player.name} size="lg" />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-300 text-slate-900 font-extrabold text-[10px] shadow">
                🥈 2nd
              </span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-white truncate max-w-full mt-2">
              {second.player.name}
            </span>
            <span className="text-xs font-extrabold text-slate-300 mb-2">
              {second.score} pts
            </span>
            <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-gradient-to-t from-zinc-800 to-slate-400/20 border-t-2 border-slate-300/40 flex items-center justify-center text-slate-300 font-black text-2xl">
              2
            </div>
          </div>
        ) : (
          <div />
        )}

        {/* 1st Place */}
        {winner && (
          <div className="flex flex-col items-center -mt-6">
            <div className="relative mb-2">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                👑
              </div>
              <Avatar
                seed={winner.player.avatarSeed}
                name={winner.player.name}
                size="xl"
                className="ring-4 ring-amber-400 shadow-2xl shadow-amber-500/40"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-extrabold text-xs shadow-lg">
                🥇 1st
              </span>
            </div>
            <span className="text-sm sm:text-base font-extrabold text-amber-300 truncate max-w-full mt-2">
              {winner.player.name}
            </span>
            <span className="text-sm font-black text-amber-400 mb-2">
              {winner.score} pts
            </span>
            <div className="w-full h-32 sm:h-36 rounded-t-2xl bg-gradient-to-t from-zinc-800 to-amber-500/20 border-t-2 border-amber-400 flex items-center justify-center text-amber-400 font-black text-3xl shadow-xl shadow-amber-500/10">
              1
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {third ? (
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <Avatar seed={third.player.avatarSeed} name={third.player.name} size="lg" />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-700 text-amber-100 font-extrabold text-[10px] shadow">
                🥉 3rd
              </span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-white truncate max-w-full mt-2">
              {third.player.name}
            </span>
            <span className="text-xs font-extrabold text-amber-600 mb-2">
              {third.score} pts
            </span>
            <div className="w-full h-18 sm:h-20 rounded-t-2xl bg-gradient-to-t from-zinc-800 to-amber-700/20 border-t-2 border-amber-700/40 flex items-center justify-center text-amber-700 font-black text-xl">
              3
            </div>
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* Full Leaderboard Table */}
      <div className="rounded-3xl bg-zinc-900/90 border border-white/10 p-6 backdrop-blur-xl shadow-2xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Medal className="w-4 h-4 text-amber-400" />
          <span>Final Standings</span>
        </h3>
        <div className="space-y-2">
          {leaderboard.map((item) => (
            <div
              key={item.player.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                item.rank === 1
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-zinc-950/60 border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center font-mono font-bold text-sm text-zinc-500">
                  #{item.rank}
                </span>
                <Avatar
                  seed={item.player.avatarSeed}
                  name={item.player.name}
                  size="md"
                  isHost={item.player.isHost}
                  isBot={item.player.isBot}
                />
                <div>
                  <span className="text-sm font-bold text-white">{item.player.name}</span>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <span>
                      {item.stats.correctGuesses}/{item.stats.totalGuesses} correct
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{item.accuracy}% acc</span>
                  </div>
                </div>
              </div>
              <span className="text-base font-black text-amber-400">{item.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Special Fun Awards */}
      {awards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-rose-400" />
            <h3 className="text-lg font-extrabold text-white">Social Badges &amp; Awards</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {awards.map((award) => (
              <div
                key={award.id}
                className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-xl shadow-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    {award.title}
                  </span>
                  <span className="text-xl">🏆</span>
                </div>
                <h4 className="text-sm font-extrabold text-white">{award.recipientName}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{award.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* The Final Chit Wall */}
      {chitWall.length > 0 && (
        <div className="rounded-3xl bg-zinc-900/90 border border-white/10 p-6 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-base font-extrabold text-white">The Chit Wall</h3>
                <p className="text-xs text-zinc-400">
                  Read through every secret confession revealed during the game
                </p>
              </div>
            </div>

            {/* Round switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {chitWall.map((w) => (
                <button
                  key={w.roundNumber}
                  onClick={() => setActiveWallRound(w.roundNumber)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    activeWallRound === w.roundNumber
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                      : 'bg-zinc-950 text-zinc-400 border-white/10 hover:text-white'
                  }`}
                >
                  Round {w.roundNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Answers in active round */}
          {(() => {
            const roundData =
              chitWall.find((w) => w.roundNumber === activeWallRound) || chitWall[0];
            if (!roundData) return null;

            return (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                    Question
                  </span>
                  <p className="text-sm font-bold text-white italic">
                    &ldquo;{roundData.prompt}&rdquo;
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roundData.answers.map((ans, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col justify-between space-y-3"
                    >
                      <p className="text-sm text-zinc-200 font-medium leading-relaxed">
                        &ldquo;{ans.content}&rdquo;
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                        <span className="font-bold text-amber-400">
                          ✍️ {ans.authorName}
                        </span>
                        <div className="flex items-center gap-1">
                          {Object.values(ans.reactions || {}).map((r, rIdx) => (
                            <span key={rIdx} className="text-xs">
                              {r === 'funny'
                                ? '😂'
                                : r === 'relatable'
                                ? '❤️'
                                : r === 'surprising'
                                ? '😲'
                                : '🤯'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Reset / Host Actions */}
      <div className="pt-4 text-center">
        {isHost ? (
          <button
            onClick={onResetGame}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-rose-600/30 hover:brightness-110 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again in Lobby</span>
          </button>
        ) : (
          <p className="text-xs text-zinc-400">
            Waiting for host to restart or choose a new game...
          </p>
        )}
      </div>
    </div>
  );
};
