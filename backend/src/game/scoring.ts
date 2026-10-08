import {
  ConfidenceLevel,
  Player,
  RoundResult,
  GameAward,
  ChitSubmission,
  ReactionType
} from '../types/index.js';

export const CONFIDENCE_POINTS: Record<ConfidenceLevel, number> = {
  sure: 100,
  fifty_fifty: 50,
  no_idea: 25
};

export function calculateGuessPoints(
  isCorrect: boolean,
  confidence: ConfidenceLevel,
  isLieCorrect?: boolean
): number {
  if (!isCorrect) {
    // If author guess was wrong, but lie guess was correct (in 2T1L mode), grant small consolation
    return isLieCorrect ? 30 : 0;
  }
  const basePoints = CONFIDENCE_POINTS[confidence] || 100;
  const lieBonus = isLieCorrect ? 50 : 0;
  return basePoints + lieBonus;
}

export function computeGameAwards(
  players: Player[],
  allRoundResults: RoundResult[],
  allChits: ChitSubmission[]
): GameAward[] {
  const awards: GameAward[] = [];
  if (players.length === 0) return awards;

  // 1. Sherlock Holmes: Best Guesser (highest accuracy)
  let bestGuesser: Player | null = null;
  let bestAccuracy = -1;
  for (const p of players) {
    if (p.stats.totalGuesses >= 2) {
      const acc = (p.stats.correctGuesses / p.stats.totalGuesses) * 100;
      if (acc > bestAccuracy) {
        bestAccuracy = acc;
        bestGuesser = p;
      }
    }
  }
  if (bestGuesser && bestAccuracy > 0) {
    awards.push({
      id: 'best_guesser',
      title: '🕵️ Sherlock Holmes',
      icon: 'Search',
      recipientName: bestGuesser.name,
      recipientId: bestGuesser.id,
      description: `Uncanny intuition with a stellar ${Math.round(bestAccuracy)}% guess accuracy!`
    });
  }

  // 2. The Chameleon: Most Mysterious (least often guessed correctly by others)
  let mostMysterious: Player | null = null;
  let minGuessedRate = 999;
  for (const p of players) {
    if (p.stats.timesGuessed >= 2) {
      const rate = p.stats.timesGuessedCorrectly / p.stats.timesGuessed;
      if (rate < minGuessedRate) {
        minGuessedRate = rate;
        mostMysterious = p;
      }
    }
  }
  if (mostMysterious) {
    awards.push({
      id: 'chameleon',
      title: '🎭 The Chameleon',
      icon: 'Shield',
      recipientName: mostMysterious.name,
      recipientId: mostMysterious.id,
      description: `Master of disguise! Friends had the hardest time pinning down their chits.`
    });
  }

  // 3. Open Book: Most Correctly Guessed
  let openBook: Player | null = null;
  let maxGuessedRate = -1;
  for (const p of players) {
    if (p.stats.timesGuessed >= 2 && p.id !== mostMysterious?.id) {
      const rate = p.stats.timesGuessedCorrectly / p.stats.timesGuessed;
      if (rate > maxGuessedRate) {
        maxGuessedRate = rate;
        openBook = p;
      }
    }
  }
  if (openBook && maxGuessedRate > 0) {
    awards.push({
      id: 'open_book',
      title: '📖 The Open Book',
      icon: 'BookOpen',
      recipientName: openBook.name,
      recipientId: openBook.id,
      description: `Wears their heart on their sleeve! Friends recognized their style instantly.`
    });
  }

  // 4. Reaction counts per player
  const reactionTotals: Record<string, Record<ReactionType, number>> = {};
  for (const p of players) {
    reactionTotals[p.id] = { relatable: 0, funny: 0, surprising: 0, mindblown: 0 };
  }

  for (const r of allRoundResults) {
    for (const c of r.chits) {
      if (reactionTotals[c.authorId]) {
        for (const reaction of Object.values(c.reactions)) {
          reactionTotals[c.authorId][reaction] = (reactionTotals[c.authorId][reaction] || 0) + 1;
        }
      }
    }
  }

  // Comedy Genius: most funny reactions
  let funniestPlayer: Player | null = null;
  let maxFunny = 0;
  for (const p of players) {
    const f = reactionTotals[p.id]?.funny || 0;
    if (f > maxFunny) {
      maxFunny = f;
      funniestPlayer = p;
    }
  }
  if (funniestPlayer && maxFunny >= 1) {
    awards.push({
      id: 'comedy_genius',
      title: '😂 Stand-up Comedian',
      icon: 'Smile',
      recipientName: funniestPlayer.name,
      recipientId: funniestPlayer.id,
      description: `Had the entire room in stitches with ${maxFunny} hilarious chit reactions!`
    });
  }

  // Mind Blower / Most Surprising
  let mindBlower: Player | null = null;
  let maxMindblown = 0;
  for (const p of players) {
    const mb = (reactionTotals[p.id]?.mindblown || 0) + (reactionTotals[p.id]?.surprising || 0);
    if (mb > maxMindblown) {
      maxMindblown = mb;
      mindBlower = p;
    }
  }
  if (mindBlower && maxMindblown >= 1 && mindBlower.id !== funniestPlayer?.id) {
    awards.push({
      id: 'mind_blower',
      title: '🤯 Mind Blower',
      icon: 'Sparkles',
      recipientName: mindBlower.name,
      recipientId: mindBlower.id,
      description: `Delivered confessions that left everyone's jaw on the floor!`
    });
  }

  // Nobody Saw This Coming: Chit with 0 correct guesses
  for (const r of allRoundResults) {
    for (const c of r.chits) {
      if (c.guess && !c.guess.isCorrect) {
        awards.push({
          id: 'nobody_saw_it',
          title: '⚡ Plot Twist Award',
          icon: 'Flame',
          recipientName: c.authorName,
          recipientId: c.authorId,
          description: `Wrote: "${c.content.length > 50 ? c.content.slice(0, 47) + '...' : c.content}" which completely fooled everyone!`
        });
        break;
      }
    }
    if (awards.some((a) => a.id === 'nobody_saw_it')) break;
  }

  return awards;
}
