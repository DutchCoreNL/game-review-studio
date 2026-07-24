import { describe, it, expect } from 'vitest';
import {
  getLegacy, legacyIncomeMult, legacyStartCash, computeLegacyGain, canRetire,
  RETIRE_MIN_RESPECT,
} from './legacy';
import type { GameState } from './types';

function stub(partial: Partial<GameState>): GameState {
  return { stats: { totalEarned: 0 }, org: null, ...partial } as unknown as GameState;
}

describe('legacy standing', () => {
  it('defaults to generation 0, no points', () => {
    const l = getLegacy(stub({}));
    expect(l.generation).toBe(0);
    expect(l.points).toBe(0);
  });
  it('income multiplier scales 2% per point', () => {
    expect(legacyIncomeMult(stub({ legacy: { generation: 1, points: 10, totalEarned: 10 } }))).toBeCloseTo(1.2, 5);
  });
  it('start cash scales with points', () => {
    expect(legacyStartCash(0)).toBe(3000);
    expect(legacyStartCash(10)).toBe(3000 + 10 * 1500);
  });
});

describe('computeLegacyGain', () => {
  it('is zero for a bare start', () => {
    expect(computeLegacyGain(stub({}))).toBe(0);
  });
  it('rewards respect, earnings and territory', () => {
    const s = stub({
      stats: { totalEarned: 1_000_000 } as any,
      org: { respect: 200, controlledDistricts: ['a', 'b'] } as any,
    });
    // sqrt(10) ~3.16 + 200/40=5 + 2*3=6 -> floor = 14
    expect(computeLegacyGain(s)).toBe(14);
  });
});

describe('canRetire', () => {
  it('requires the respect threshold and a positive gain', () => {
    const belowRespect = stub({ org: { respect: RETIRE_MIN_RESPECT - 1, controlledDistricts: [] } as any, stats: { totalEarned: 5_000_000 } as any });
    expect(canRetire(belowRespect)).toBe(false);

    const eligible = stub({ org: { respect: RETIRE_MIN_RESPECT, controlledDistricts: [] } as any, stats: { totalEarned: 5_000_000 } as any });
    expect(canRetire(eligible)).toBe(true);
  });
});
