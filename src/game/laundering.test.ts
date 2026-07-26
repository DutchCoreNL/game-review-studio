import { describe, it, expect } from 'vitest';
import {
  getWashCapacity, WASH_BASE_CAPACITY, WASH_PER_LAUNDERER, WASH_PER_NETWORK_TIER, WASH_KEEP_RATE,
} from './engine';
import type { GameState } from './types';
import type { OrgMember } from './organization';

function member(p: Partial<OrgMember>): OrgMember {
  return { id: Math.random().toString(36).slice(2), name: 'X', role: 'soldaat', level: 5, loyalty: 80, ...p };
}
function stub(p: Partial<GameState> = {}): GameState {
  return { ownedBusinesses: [], washUsedToday: 0, org: null, equipment: {}, ...p } as unknown as GameState;
}

describe('wash capacity', () => {
  it('a bare player still gets a usable base', () => {
    expect(getWashCapacity(stub()).total).toBe(WASH_BASE_CAPACITY);
  });

  it('crew on laundering rackets widen the pipe', () => {
    const s = stub({ org: { members: [
      member({ assignment: 'neon_launder' }),   // kind: schoon
      member({ assignment: 'crown_fixer' }),    // kind: schoon
      member({ assignment: 'low_runners' }),    // kind: geld — should not count
    ] } as any });
    expect(getWashCapacity(s).total).toBe(WASH_BASE_CAPACITY + 2 * WASH_PER_LAUNDERER);
  });

  it('injured launderers do not count', () => {
    const s = stub({ org: { members: [member({ assignment: 'neon_launder', injuredUntilDay: 99 })] } as any });
    expect(getWashCapacity(s).total).toBe(WASH_BASE_CAPACITY);
  });

  it('the network track raises throughput per tier', () => {
    const s = stub({ equipment: { netwerk: 3 } });
    expect(getWashCapacity(s).total).toBe(WASH_BASE_CAPACITY + 3 * WASH_PER_NETWORK_TIER);
  });

  it('what you already washed today comes off the remainder', () => {
    const s = stub({ washUsedToday: 2000 });
    const cap = getWashCapacity(s);
    expect(cap.remaining).toBe(cap.total - 2000);
  });

  it('never reports a negative remainder', () => {
    expect(getWashCapacity(stub({ washUsedToday: 999999 })).remaining).toBe(0);
  });

  it('an invested player launders far more than a bare one', () => {
    const bare = getWashCapacity(stub()).total;
    const invested = getWashCapacity(stub({
      org: { members: [member({ assignment: 'neon_launder' }), member({ assignment: 'crown_fixer' })] } as any,
      equipment: { netwerk: 2 },
    })).total;
    expect(invested).toBeGreaterThan(bare * 3);
  });

  it('the launderers keep a cut', () => {
    expect(WASH_KEEP_RATE).toBeGreaterThan(0);
    expect(WASH_KEEP_RATE).toBeLessThan(1);
  });
});
