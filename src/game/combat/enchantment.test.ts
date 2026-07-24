import { describe, it, expect } from 'vitest';
import { applyWeaponEnchantmentOffense, applyDefensiveGearEffects, applyCrewAssist } from '../engine';
import { createInitialState } from '../constants';
import type { CombatState, GameState } from '../types';
import type { PlayerOrg, OrgMember } from '../organization';
import type { GeneratedWeapon } from '../weaponGenerator';

function makeCombat(partial: Partial<CombatState> = {}): CombatState {
  return {
    idx: 0, targetName: 'Doelwit', targetHP: 100, enemyMaxHP: 100, enemyAttack: 10,
    playerHP: 50, playerMaxHP: 100, logs: [], isBoss: false, familyId: null,
    stunned: false, turn: 1, finished: false, won: false,
    activeBuffs: [], skillCooldowns: {}, comboCounter: 0, lastAction: null, stance: 'balanced',
    ...partial,
  };
}

// The helper only reads `enchantmentId` off the weapon.
const weaponWith = (enchantmentId: string) => ({ enchantmentId } as unknown as GeneratedWeapon);

describe('applyWeaponEnchantmentOffense', () => {
  it('vampiric heals the player from the hit', () => {
    const state = createInitialState() as GameState;
    const combat = makeCombat({ playerHP: 50 });
    applyWeaponEnchantmentOffense(state, combat, weaponWith('vampiric'), 20);
    // lifesteal 0.05 * 20 = 1 HP
    expect(combat.playerHP).toBe(51);
  });

  it('brutal adds extra damage to the target', () => {
    const state = createInitialState() as GameState;
    const combat = makeCombat({ targetHP: 100 });
    applyWeaponEnchantmentOffense(state, combat, weaponWith('brutal'), 20);
    // damageMult 1.1 -> +floor(20*0.1) = 2
    expect(combat.targetHP).toBe(98);
  });

  it('does nothing when the hit dealt no damage', () => {
    const state = createInitialState() as GameState;
    const combat = makeCombat({ targetHP: 100, playerHP: 50 });
    applyWeaponEnchantmentOffense(state, combat, weaponWith('brutal'), 0);
    expect(combat.targetHP).toBe(100);
    expect(combat.playerHP).toBe(50);
  });
});

describe('applyDefensiveGearEffects', () => {
  it('returns no guardian chance with no enchanted defensive gear', () => {
    const state = createInitialState() as GameState;
    expect(applyDefensiveGearEffects(state)).toBe(0);
  });
});

function makeOrg(members: Partial<OrgMember>[]): PlayerOrg {
  return {
    name: 'Test Crew', tag: 'TST', respect: 0, upgrades: [], controlledDistricts: [], foundedDay: 1,
    members: members.map((m, i) => ({
      id: `m${i}`, name: `Lid ${i}`, role: 'soldaat', level: 10, loyalty: 80, ...m,
    })),
  };
}

describe('applyCrewAssist', () => {
  const alwaysHit = () => 0; // rand() always below the assist chance

  it('does nothing without an organisation', () => {
    const state = createInitialState() as GameState;
    const combat = makeCombat({ targetHP: 100 });
    expect(applyCrewAssist(state, combat, 20, alwaysHit)).toBe(0);
    expect(combat.targetHP).toBe(100);
  });

  it('a loyal member piles on for bonus damage when the roll hits', () => {
    const state = createInitialState() as GameState;
    state.org = makeOrg([{ level: 10, loyalty: 80 }]);
    const combat = makeCombat({ targetHP: 100 });
    const bonus = applyCrewAssist(state, combat, 20, alwaysHit);
    expect(bonus).toBeGreaterThan(0);
    expect(combat.targetHP).toBe(100 - bonus);
    expect(combat.logs.some(l => l.includes('valt mee aan'))).toBe(true);
  });

  it('never fires on a whiff (no player damage)', () => {
    const state = createInitialState() as GameState;
    state.org = makeOrg([{ loyalty: 90 }]);
    const combat = makeCombat({ targetHP: 100 });
    expect(applyCrewAssist(state, combat, 0, alwaysHit)).toBe(0);
    expect(combat.targetHP).toBe(100);
  });

  it('low-loyalty members hang back', () => {
    const state = createInitialState() as GameState;
    state.org = makeOrg([{ loyalty: 10 }, { loyalty: 20 }]);
    const combat = makeCombat({ targetHP: 100 });
    expect(applyCrewAssist(state, combat, 20, alwaysHit)).toBe(0);
    expect(combat.targetHP).toBe(100);
  });

  it('skips the assist when the roll misses', () => {
    const state = createInitialState() as GameState;
    state.org = makeOrg([{ loyalty: 80 }]);
    const combat = makeCombat({ targetHP: 100 });
    // rand() = 0.99 is above any assist chance, so no member steps in.
    expect(applyCrewAssist(state, combat, 20, () => 0.99)).toBe(0);
    expect(combat.targetHP).toBe(100);
  });
});
