/**
 * MOMENTUM — the rhythm that makes working a job by hand worth doing.
 *
 * Without this, every tap is identical: the same +N, the same crawl along the bar.
 * There is nothing to chase and no reason to tap quickly rather than idly.
 *
 * Momentum builds while you keep at it and bleeds away the moment you stop, so a
 * burst of focused work pays meaningfully better than the same number of taps
 * spread out. It never replaces the crew — they keep grinding at their own pace —
 * it rewards *being there*, which is exactly the part an idle game usually lacks.
 */

/** Momentum added by a single tap. */
export const MOMENTUM_PER_TAP = 9;
/** Momentum lost per second while you are not tapping. */
export const MOMENTUM_DECAY_PER_SEC = 14;
export const MOMENTUM_MAX = 100;

export interface MomentumTier {
  /** Momentum needed to reach this tier. */
  at: number;
  /** Multiplier applied to tap power. */
  mult: number;
  label: string;
  /** Colour token for the bar and the readout. */
  accent: 'muted' | 'gold' | 'blood';
}

/** Three bands, so the climb has two audible clicks rather than a smooth ramp. */
export const MOMENTUM_TIERS: MomentumTier[] = [
  { at: 0, mult: 1, label: 'Rustig', accent: 'muted' },
  { at: 40, mult: 1.5, label: 'Op gang', accent: 'gold' },
  { at: 78, mult: 2.2, label: 'Op rolletjes', accent: 'blood' },
];

export function momentumTier(momentum: number): MomentumTier {
  let tier = MOMENTUM_TIERS[0];
  for (const t of MOMENTUM_TIERS) if (momentum >= t.at) tier = t;
  return tier;
}

/** Tap-power multiplier at the current momentum. */
export function momentumMultiplier(momentum: number): number {
  return momentumTier(momentum).mult;
}

/** Momentum after a tap, clamped to the ceiling. */
export function addTapMomentum(momentum: number): number {
  return Math.min(MOMENTUM_MAX, momentum + MOMENTUM_PER_TAP);
}

/** Momentum after `seconds` of not tapping. */
export function decayMomentum(momentum: number, seconds: number): number {
  return Math.max(0, momentum - MOMENTUM_DECAY_PER_SEC * seconds);
}

/**
 * Chance that a tap lands as a "perfecte inzet" — a crit worth double. Rises with
 * momentum, so the harder you are going the more often it pops.
 */
export function critChance(momentum: number): number {
  return 0.04 + (momentum / MOMENTUM_MAX) * 0.16;
}

export const CRIT_MULTIPLIER = 2;

export interface TapResult {
  /** Work units this tap contributed. */
  amount: number;
  crit: boolean;
  momentum: number;
  multiplier: number;
}

/** Resolves one tap: momentum first, then the multiplier and crit roll it enables. */
export function resolveTap(basePower: number, momentum: number, rand: () => number = Math.random): TapResult {
  const next = addTapMomentum(momentum);
  const multiplier = momentumMultiplier(next);
  const crit = rand() < critChance(next);
  const amount = Math.max(1, Math.round(basePower * multiplier * (crit ? CRIT_MULTIPLIER : 1)));
  return { amount, crit, momentum: next, multiplier };
}

// ========== COMING BACK ==========

/**
 * Checking back in used to feel identical to never having left: you opened the
 * game and started tapping from cold. A returning player has earned a running
 * start, so time away converts into momentum you begin with — capped well below
 * the top tier so it is a kick-off, not a free ride.
 */
export const RETURN_MOMENTUM_CAP = 70;
/** Minutes away before a return bonus is worth granting at all. */
export const RETURN_MIN_MINUTES = 10;

export function returnMomentum(minutesAway: number): number {
  if (minutesAway < RETURN_MIN_MINUTES) return 0;
  // Roughly a third of an hour away gives a full kick-off; longer adds nothing more.
  return Math.min(RETURN_MOMENTUM_CAP, Math.round(minutesAway * 3.5));
}

/**
 * Consecutive jobs finished without walking away build a streak. It multiplies the
 * dirty cash a job pays out, so staying on one district and seeing scores through
 * beats hopping around — and it gives checking in a reason to last more than one tap.
 */
export const STREAK_BONUS_PER_JOB = 0.04;
export const STREAK_BONUS_CAP = 0.6;

export function streakPayoutMultiplier(streak: number): number {
  return 1 + Math.min(STREAK_BONUS_CAP, Math.max(0, streak) * STREAK_BONUS_PER_JOB);
}
