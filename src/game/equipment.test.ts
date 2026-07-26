import { describe, it, expect } from 'vitest';
import {
  EQUIPMENT, EQUIP_BY_ID, ownedTier, nextTier, canBuyTier, activeValue,
  equipTapBonus, equipCrewMultiplier, equipStashBonus, equipHeatShield,
} from './equipment';
import { tapPower, stashCapacity } from './score';
import { recalcMaxInv, BASE_STASH_SLOTS } from './engine';
import type { GameState } from './types';

function stub(p: Partial<GameState> = {}): GameState {
  return {
    money: 1_000_000, maxInv: 15, player: { level: 1, stats: {} },
    org: { respect: 1000, members: [] }, equipment: {},
    ...p,
  } as unknown as GameState;
}

describe('equipment catalogue', () => {
  it('has four tracks of five tiers, all indexed', () => {
    expect(EQUIPMENT).toHaveLength(4);
    for (const t of EQUIPMENT) {
      expect(t.tiers).toHaveLength(5);
      expect(EQUIP_BY_ID[t.id]).toBe(t);
    }
  });

  it('tiers get strictly more expensive and more powerful', () => {
    for (const t of EQUIPMENT) {
      for (let i = 1; i < t.tiers.length; i++) {
        expect(t.tiers[i].cost).toBeGreaterThan(t.tiers[i - 1].cost);
        expect(t.tiers[i].value).toBeGreaterThan(t.tiers[i - 1].value);
        expect(t.tiers[i].minRespect).toBeGreaterThanOrEqual(t.tiers[i - 1].minRespect);
      }
    }
  });
});

describe('buying tiers', () => {
  it('starts at nothing owned, with tier 1 up next', () => {
    const s = stub();
    expect(ownedTier(s, 'gereedschap')).toBe(0);
    expect(nextTier(s, 'gereedschap')!.name).toBe('Koevoet');
    expect(activeValue(s, 'gereedschap')).toBe(0);
  });

  it('blocks a purchase you cannot afford', () => {
    expect(canBuyTier(stub({ money: 0 }), 'gereedschap')).toBe(false);
  });

  it('blocks a purchase gated behind respect', () => {
    const s = stub({ equipment: { gereedschap: 1 }, org: { respect: 0, members: [] } as any });
    // Tier 2 (Slotenset) needs 30 respect.
    expect(nextTier(s, 'gereedschap')!.minRespect).toBe(30);
    expect(canBuyTier(s, 'gereedschap')).toBe(false);
  });

  it('runs out of tiers once maxed', () => {
    const s = stub({ equipment: { gereedschap: 5 } });
    expect(nextTier(s, 'gereedschap')).toBeNull();
    expect(canBuyTier(s, 'gereedschap')).toBe(false);
  });
});

describe('effects reach the game', () => {
  it('tools make every tap count for more', () => {
    const bare = stub();
    const kitted = stub({ equipment: { gereedschap: 3 } });
    expect(equipTapBonus(kitted)).toBeGreaterThan(equipTapBonus(bare));
    expect(tapPower(kitted)).toBeGreaterThan(tapPower(bare));
  });

  it('vehicles multiply crew speed, and no vehicle is neutral', () => {
    expect(equipCrewMultiplier(stub())).toBe(1);
    expect(equipCrewMultiplier(stub({ equipment: { voertuig: 2 } }))).toBeGreaterThan(1);
  });

  it('storage raises the stash ceiling', () => {
    const bare = stub();
    const stocked = stub({ equipment: { opslag: 2 } });
    expect(stashCapacity(stocked)).toBe(stashCapacity(bare) + equipStashBonus(stocked));
    expect(equipStashBonus(stocked)).toBeGreaterThan(0);
  });

  it('the network absorbs heat only once you have one', () => {
    expect(equipHeatShield(stub())).toBe(0);
    expect(equipHeatShield(stub({ equipment: { netwerk: 1 } }))).toBeGreaterThan(0);
  });
});

describe('stash capacity is one number everywhere', () => {
  it('a vehicle never shrinks the stash below the base', () => {
    // The free starter van has storage 5. It used to overwrite maxInv outright,
    // cutting the stash from 15 to 5 with no way back once vehicles were retired.
    const s = stub({ maxInv: BASE_STASH_SLOTS, activeVehicle: 'toyohata', ownedVehicles: [], crew: [], safehouses: [] } as any);
    expect(recalcMaxInv(s)).toBeGreaterThanOrEqual(BASE_STASH_SLOTS);
  });

  it('storage upgrades stack on top of the base', () => {
    const bare = stub({ maxInv: BASE_STASH_SLOTS });
    const upgraded = stub({ maxInv: BASE_STASH_SLOTS, equipment: { opslag: 1 } });
    expect(stashCapacity(bare)).toBe(BASE_STASH_SLOTS);
    expect(stashCapacity(upgraded)).toBe(BASE_STASH_SLOTS + equipStashBonus(upgraded));
    expect(stashCapacity(upgraded)).toBeGreaterThan(stashCapacity(bare));
  });
});
