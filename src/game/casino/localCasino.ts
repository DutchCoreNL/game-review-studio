// Local casino engine — replaces the former server-side casino RNG. Each function returns the
// same data shape the casino UI components expect, computing outcomes fairly on the client.

export interface CasinoResult {
  success: boolean;
  message: string;
  data: Record<string, any>;
}

const rnd = () => Math.random();
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];

// ===== BLACKJACK =====
const CARD_VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11]; // 11 = ace
function drawCard(): number { return pick(CARD_VALUES); }
function handScore(cards: number[]): number {
  let score = cards.reduce((a, b) => a + b, 0);
  let aces = cards.filter(c => c === 11).length;
  while (score > 21 && aces > 0) { score -= 10; aces--; }
  return score;
}

function playBlackjack(bet: number): CasinoResult {
  const player = [drawCard(), drawCard()];
  const dealer = [drawCard(), drawCard()];
  // Simple auto-play: player stands at 17+, otherwise hits until 17+ or bust.
  while (handScore(player) < 17) player.push(drawCard());
  while (handScore(dealer) < 17) dealer.push(drawCard());
  const ps = handScore(player);
  const ds = handScore(dealer);
  const isBj = ps === 21 && player.length === 2;
  let won: boolean | null;
  let netResult: number;
  if (ps > 21) { won = false; netResult = -bet; }
  else if (ds > 21 || ps > ds) { won = true; netResult = isBj ? Math.floor(bet * 1.5) : bet; }
  else if (ps < ds) { won = false; netResult = -bet; }
  else { won = null; netResult = 0; }
  return {
    success: true, message: 'Blackjack gespeeld.',
    data: { playerHand: player, dealerHand: dealer, playerScore: ps, won, isBj, netResult },
  };
}

// ===== ROULETTE =====
const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
function playRoulette(bet: number, betType: string): CasinoResult {
  const num = Math.floor(rnd() * 37); // 0-36
  const color = num === 0 ? 'green' : RED_NUMBERS.has(num) ? 'red' : 'black';
  let won = false;
  let payoutMult = 0;
  if (betType === 'red' || betType === 'black') { won = color === betType; payoutMult = 1; }
  else if (betType === 'even') { won = num !== 0 && num % 2 === 0; payoutMult = 1; }
  else if (betType === 'odd') { won = num % 2 === 1; payoutMult = 1; }
  else if (betType === 'low') { won = num >= 1 && num <= 18; payoutMult = 1; }
  else if (betType === 'high') { won = num >= 19 && num <= 36; payoutMult = 1; }
  else if (/^\d+$/.test(betType)) { won = num === parseInt(betType, 10); payoutMult = 35; }
  const netResult = won ? bet * payoutMult : -bet;
  return { success: true, message: 'Roulette gespeeld.', data: { num, color, won, netResult } };
}

// ===== SLOTS =====
const SLOT_SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];
const SLOT_PAYOUT: Record<string, number> = { '🍒': 3, '🍋': 4, '🔔': 6, '⭐': 10, '💎': 20, '7️⃣': 50 };
function playSlots(bet: number): CasinoResult {
  const reels = [pick(SLOT_SYMBOLS), pick(SLOT_SYMBOLS), pick(SLOT_SYMBOLS)];
  let netResult = -bet;
  let isJackpot = false;
  let jackpotAmount = 0;
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    const mult = SLOT_PAYOUT[reels[0]] || 3;
    netResult = bet * mult;
    if (reels[0] === '7️⃣') { isJackpot = true; jackpotAmount = netResult; }
  } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    netResult = Math.floor(bet * 0.5); // small two-of-a-kind consolation
  }
  return { success: true, message: 'Slots gespeeld.', data: { reels, netResult, isJackpot, jackpotAmount } };
}

// ===== HIGH-LOW =====
function playHighLow(bet: number, guesses: string[]): CasinoResult {
  // Guess sequence of 'high'/'low'; each correct guess compounds the multiplier.
  let current = Math.floor(rnd() * 13) + 1;
  let round = 0;
  let mult = 1;
  let lost = false;
  for (const g of guesses) {
    const next = Math.floor(rnd() * 13) + 1;
    const correct = (g === 'high' && next >= current) || (g === 'low' && next <= current);
    round++;
    if (correct) { mult = Math.round(mult * 1.5 * 100) / 100; current = next; }
    else { lost = true; break; }
  }
  const netResult = lost ? -bet : Math.floor(bet * mult) - bet;
  return { success: true, message: 'High-Low gespeeld.', data: { round, mult, lost, netResult } };
}

// ===== RUSSIAN ROULETTE =====
function playRussianRoulette(bet: number, rounds: number): CasinoResult {
  // 6-chamber revolver; each round has 1/6 chance of "death". Survive all rounds → payout.
  let dead = false;
  for (let i = 0; i < rounds; i++) {
    if (Math.floor(rnd() * 6) === 0) { dead = true; break; }
  }
  const survived = !dead;
  const mult = 1 + rounds * 0.8; // more rounds = higher reward
  const netResult = survived ? Math.floor(bet * mult) - bet : -bet;
  return { success: true, message: 'Russisch roulette gespeeld.', data: { dead, survived, mult, netResult } };
}

// ===== POKER (simplified 5-card draw payout) =====
const POKER_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const POKER_SUITS = ['♠', '♥', '♦', '♣'];
function playPoker(bet: number): CasinoResult {
  const hand = Array.from({ length: 5 }, () => ({ rank: pick(POKER_RANKS), suit: pick(POKER_SUITS) }));
  const rankCounts: Record<string, number> = {};
  for (const c of hand) rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const flush = new Set(hand.map(c => c.suit)).size === 1;
  let payoutMult = 0;
  let handName = 'Niets';
  if (counts[0] === 4) { payoutMult = 25; handName = 'Four of a Kind'; }
  else if (counts[0] === 3 && counts[1] === 2) { payoutMult = 9; handName = 'Full House'; }
  else if (flush) { payoutMult = 6; handName = 'Flush'; }
  else if (counts[0] === 3) { payoutMult = 4; handName = 'Three of a Kind'; }
  else if (counts[0] === 2 && counts[1] === 2) { payoutMult = 2; handName = 'Two Pair'; }
  else if (counts[0] === 2) { payoutMult = 1; handName = 'Pair'; }
  const won = payoutMult > 0;
  const netResult = won ? bet * payoutMult : -bet;
  return { success: true, message: handName, data: { hand, handName, won, netResult } };
}

/** Entry point matching the old gameApi.casinoPlay(game, bet, choice) contract. */
export function playCasino(game: string, bet: number, choice?: any): CasinoResult {
  switch (game) {
    case 'blackjack': return playBlackjack(bet);
    case 'roulette': return playRoulette(bet, choice?.betType ?? 'red');
    case 'slots': return playSlots(bet);
    case 'highlow': return playHighLow(bet, choice?.guesses ?? []);
    case 'russian_roulette': return playRussianRoulette(bet, choice?.rounds ?? 1);
    case 'poker': return playPoker(bet);
    default: return { success: false, message: 'Onbekend casinospel.', data: {} };
  }
}
