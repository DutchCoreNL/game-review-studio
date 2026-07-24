import { describe, it, expect } from 'vitest';
import {
  autoFenceOwned, autoFenceActive, autoFenceIncome, marketSpreadPct, fenceThroughput,
} from './tradeNetwork';
import { GOODS } from './constants';
import type { GameState } from './types';

/** Minimal state stub carrying only the fields the trade-network functions read. */
function stub(partial: Partial<GameState>): GameState {
  return {
    player: { level: 10, stats: { muscle: 0, brains: 20, charm: 0 } },
    prices: {},
    ...partial,
  } as unknown as GameState;
}

/** Prices where every good costs `low` in district A and `high` in district B. */
function twoDistrictPrices(low: number, high: number) {
  const a: Record<string, number> = {};
  const b: Record<string, number> = {};
  for (const g of GOODS) { a[g.id] = low; b[g.id] = high; }
  return { A: a, B: b };
}

describe('auto-fence ownership + activation', () => {
  it('is not owned or active by default', () => {
    const s = stub({});
    expect(autoFenceOwned(s)).toBe(false);
    expect(autoFenceActive(s)).toBe(false);
  });
  it('owned but paused is not active', () => {
    const s = stub({ autoFence: { owned: true, paused: true } });
    expect(autoFenceOwned(s)).toBe(true);
    expect(autoFenceActive(s)).toBe(false);
  });
  it('owned and running is active', () => {
    expect(autoFenceActive(stub({ autoFence: { owned: true, paused: false } }))).toBe(true);
  });
});

describe('marketSpreadPct', () => {
  it('is zero with fewer than two districts', () => {
    expect(marketSpreadPct(stub({ prices: { A: { drugs: 100 } } as any }))).toBe(0);
  });
  it('reflects the buy/sell gap across districts', () => {
    // low 50, high 100 -> (100-50)/100 = 0.5 for every good
    const s = stub({ prices: twoDistrictPrices(50, 100) as any });
    expect(marketSpreadPct(s)).toBeCloseTo(0.5, 5);
  });
});

describe('autoFenceIncome', () => {
  it('earns nothing when inactive even with a juicy spread', () => {
    const s = stub({ prices: twoDistrictPrices(50, 100) as any });
    expect(autoFenceIncome(s)).toBe(0);
  });
  it('earns from spread when active, scaled by throughput and brains', () => {
    const s = stub({ autoFence: { owned: true, paused: false }, prices: twoDistrictPrices(50, 100) as any });
    // throughput = 800 + 10*120 = 2000; efficiency = 1 + 20*0.03 = 1.6; spread 0.5
    // income = floor(2000 * 0.5 * 1.6) = 1600
    expect(autoFenceIncome(s)).toBe(1600);
  });
  it('earns nothing in a flat market (no spread)', () => {
    const s = stub({ autoFence: { owned: true, paused: false }, prices: twoDistrictPrices(80, 80) as any });
    expect(autoFenceIncome(s)).toBe(0);
  });
  it('throughput grows with player level', () => {
    expect(fenceThroughput(stub({ player: { level: 20, stats: { brains: 0 } } as any }))).toBe(3200);
  });
});
