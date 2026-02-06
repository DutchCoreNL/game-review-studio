import { PlayingCard, CardSuit } from '@/game/types';

const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUITS: CardSuit[] = ['spade', 'heart', 'diamond', 'club'];

export function createDeck(): PlayingCard[] {
  const deck: PlayingCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function getCardValue(rank: string): number {
  if (rank === 'A') return 11;
  if (['K','Q','J'].includes(rank)) return 10;
  return parseInt(rank);
}

export function getBlackjackScore(hand: PlayingCard[]): number {
  let score = 0, aces = 0;
  for (const card of hand) {
    if (card.rank === 'A') { aces++; score += 11; }
    else if (['K','Q','J'].includes(card.rank)) score += 10;
    else score += parseInt(card.rank);
  }
  while (score > 21 && aces > 0) { score -= 10; aces--; }
  return score;
}

export function getCardRankValue(rank: string): number {
  const order = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  return order.indexOf(rank);
}

export function isRedSuit(suit: CardSuit): boolean {
  return suit === 'heart' || suit === 'diamond';
}

export function getSuitSymbol(suit: CardSuit): string {
  switch (suit) {
    case 'spade': return '♠';
    case 'heart': return '♥';
    case 'diamond': return '♦';
    case 'club': return '♣';
  }
}

export interface CasinoSessionStats {
  sessionWins: number;
  sessionLosses: number;
  sessionProfit: number;
  currentStreak: number;
  bestStreak: number;
}

export const INITIAL_SESSION_STATS: CasinoSessionStats = {
  sessionWins: 0,
  sessionLosses: 0,
  sessionProfit: 0,
  currentStreak: 0,
  bestStreak: 0,
};

export function getVipBonus(state: { ownedDistricts: string[]; districtRep: Record<string, number> }): { label: string; bonus: number }[] {
  const bonuses: { label: string; bonus: number }[] = [];
  if (state.ownedDistricts.includes('neon')) {
    bonuses.push({ label: 'Neon Strip Eigenaar', bonus: 5 });
  }
  const neonRep = state.districtRep?.neon || 0;
  if (neonRep >= 25) bonuses.push({ label: 'Casino Bonus (Rep 25)', bonus: 3 });
  if (neonRep >= 50) bonuses.push({ label: 'Witwas Pro (Rep 50)', bonus: 2 });
  const crownRep = state.districtRep?.crown || 0;
  if (crownRep >= 50) bonuses.push({ label: 'Crown VIP (Rep 50)', bonus: 5 });
  return bonuses;
}

// VIP bonus capped at 15% max, applied to NET PROFIT only (not the multiplier)
export function getTotalVipBonus(state: { ownedDistricts: string[]; districtRep: Record<string, number> }): number {
  const raw = getVipBonus(state).reduce((sum, b) => sum + b.bonus, 0);
  return Math.min(raw, 15);
}

// Apply VIP bonus correctly: only on net profit, preserving house edge
export function applyVipToWinnings(basePayout: number, bet: number, vipBonus: number): number {
  const netProfit = basePayout - bet;
  const bonusProfit = Math.floor(netProfit * (vipBonus / 100));
  return basePayout + bonusProfit;
}
