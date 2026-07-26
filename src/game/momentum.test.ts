import { describe, it, expect } from 'vitest';
import {
  MOMENTUM_MAX, MOMENTUM_PER_TAP, MOMENTUM_DECAY_PER_SEC, MOMENTUM_TIERS,
  momentumTier, momentumMultiplier, addTapMomentum, decayMomentum,
  critChance, resolveTap, CRIT_MULTIPLIER,
  returnMomentum, RETURN_MOMENTUM_CAP, RETURN_MIN_MINUTES,
  streakPayoutMultiplier, STREAK_BONUS_CAP,
} from './momentum';

describe('momentum build-up and decay', () => {
  it('starts calm with no bonus', () => {
    expect(momentumMultiplier(0)).toBe(1);
    expect(momentumTier(0).label).toBe('Rustig');
  });

  it('each tap adds momentum, capped at the ceiling', () => {
    expect(addTapMomentum(0)).toBe(MOMENTUM_PER_TAP);
    expect(addTapMomentum(MOMENTUM_MAX)).toBe(MOMENTUM_MAX);
  });

  it('bleeds away while you are not tapping, never below zero', () => {
    expect(decayMomentum(50, 1)).toBe(50 - MOMENTUM_DECAY_PER_SEC);
    expect(decayMomentum(5, 10)).toBe(0);
  });

  it('climbs through the tiers in order', () => {
    const mults = MOMENTUM_TIERS.map(t => momentumMultiplier(t.at));
    expect(mults).toEqual(MOMENTUM_TIERS.map(t => t.mult));
    for (let i = 1; i < mults.length; i++) expect(mults[i]).toBeGreaterThan(mults[i - 1]);
  });
});

describe('crit chance', () => {
  it('is low when calm and higher when flying', () => {
    expect(critChance(0)).toBeLessThan(critChance(MOMENTUM_MAX));
    expect(critChance(0)).toBeGreaterThan(0);
    expect(critChance(MOMENTUM_MAX)).toBeLessThan(1);
  });
});

describe('resolveTap', () => {
  const never = () => 0.999;  // never crits
  const always = () => 0;     // always crits

  it('a single tap from cold is worth about its base power', () => {
    const r = resolveTap(10, 0, never);
    expect(r.crit).toBe(false);
    expect(r.multiplier).toBe(1);
    expect(r.amount).toBe(10);
  });

  it('sustained tapping pays more than the same tap from cold', () => {
    const cold = resolveTap(10, 0, never);
    const hot = resolveTap(10, MOMENTUM_MAX, never);
    expect(hot.amount).toBeGreaterThan(cold.amount);
  });

  it('a crit doubles the tap', () => {
    const plain = resolveTap(10, 0, never);
    const crit = resolveTap(10, 0, always);
    expect(crit.crit).toBe(true);
    expect(crit.amount).toBe(plain.amount * CRIT_MULTIPLIER);
  });

  it('always contributes at least one unit of work', () => {
    expect(resolveTap(0, 0, never).amount).toBeGreaterThanOrEqual(1);
  });

  it('reports the momentum the tap just built', () => {
    expect(resolveTap(5, 0, never).momentum).toBe(MOMENTUM_PER_TAP);
  });
});

describe('coming back after a break', () => {
  it('a quick glance away grants nothing', () => {
    expect(returnMomentum(0)).toBe(0);
    expect(returnMomentum(RETURN_MIN_MINUTES - 1)).toBe(0);
  });

  it('real time away grants a running start', () => {
    expect(returnMomentum(20)).toBeGreaterThan(0);
  });

  it('never hands out a top-tier head start', () => {
    expect(returnMomentum(100000)).toBe(RETURN_MOMENTUM_CAP);
    expect(RETURN_MOMENTUM_CAP).toBeLessThan(MOMENTUM_TIERS[MOMENTUM_TIERS.length - 1].at);
  });
});

describe('job streak payout', () => {
  it('a first job pays plain', () => {
    expect(streakPayoutMultiplier(0)).toBe(1);
  });

  it('a run of jobs pays progressively better', () => {
    expect(streakPayoutMultiplier(5)).toBeGreaterThan(streakPayoutMultiplier(1));
  });

  it('is capped so it cannot run away', () => {
    expect(streakPayoutMultiplier(9999)).toBe(1 + STREAK_BONUS_CAP);
  });

  it('treats a negative streak as none', () => {
    expect(streakPayoutMultiplier(-5)).toBe(1);
  });
});
