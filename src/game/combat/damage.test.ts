import { describe, it, expect } from 'vitest';
import { resolveAttack, weaponProfileFromProc, weaponProfileForLevel, enemyBaseHit, FISTS } from './damage';

// Deterministic RNG helper: returns a fixed value.
const fixed = (v: number) => () => v;

describe('resolveAttack', () => {
  it('a better weapon deals more base damage on a light hit', () => {
    const bare = resolveAttack({ kind: 'light', muscle: 5, weapon: FISTS, rand: fixed(0.5) }).damage;
    const armed = resolveAttack({ kind: 'light', muscle: 5, weapon: { damage: 100, accuracy: 0.8, critChance: 0.1, isMelee: false }, rand: fixed(0.5) }).damage;
    expect(armed).toBeGreaterThan(bare);
  });

  it('reproduces the legacy no-weapon light formula with fists', () => {
    // 8 + muscle*2.5 + 0 + rand*6 ; rand=0 -> floor(8 + 10) = 18
    const r = resolveAttack({ kind: 'light', muscle: 4, rand: fixed(0) });
    expect(r.missed).toBe(false);
    expect(r.damage).toBe(18);
  });

  it('a heavy attack can miss when the roll exceeds the hit chance', () => {
    // hitChance for muscle 1, fists = 0.6 + 0.03 = 0.63; rand=0.99 -> miss
    const miss = resolveAttack({ kind: 'heavy', muscle: 1, rand: fixed(0.99) });
    expect(miss.missed).toBe(true);
    expect(miss.damage).toBe(0);
  });

  it('a heavy attack connects on a low roll and out-damages a light hit', () => {
    const heavy = resolveAttack({ kind: 'heavy', muscle: 6, weapon: { damage: 40, accuracy: 0.9, critChance: 0.1, isMelee: false }, rand: fixed(0.1) });
    const light = resolveAttack({ kind: 'light', muscle: 6, weapon: { damage: 40, accuracy: 0.9, critChance: 0.1, isMelee: false }, rand: fixed(0.1) });
    expect(heavy.missed).toBe(false);
    expect(heavy.damage).toBeGreaterThan(light.damage);
  });

  it('damage is always at least 1', () => {
    const r = resolveAttack({ kind: 'light', muscle: 0, weapon: FISTS, rand: fixed(0) });
    expect(r.damage).toBeGreaterThanOrEqual(1);
  });
});

describe('weapon profiles', () => {
  it('normalizes a procedural weapon (accuracy 1..10, crit percentage)', () => {
    const p = weaponProfileFromProc({ damage: 50, accuracy: 8, critChance: 25, frame: 'rifle' });
    expect(p.damage).toBe(50);
    expect(p.accuracy).toBeCloseTo(0.8);
    expect(p.critChance).toBeCloseTo(0.25);
    expect(p.isMelee).toBe(false);
  });

  it('treats a blade frame as melee and falls back to fists when unarmed', () => {
    expect(weaponProfileFromProc({ damage: 30, accuracy: 6, critChance: 10, frame: 'blade' }).isMelee).toBe(true);
    expect(weaponProfileFromProc(null)).toEqual(FISTS);
  });

  it('scales an NPC weapon profile with level', () => {
    expect(weaponProfileForLevel(20).damage).toBeGreaterThan(weaponProfileForLevel(5).damage);
  });
});

describe('enemyBaseHit', () => {
  it('reproduces the stat-block swing formula', () => {
    // enemyAttack 20, rand 0.5 -> 20 * (0.7 + 0.3) * 1 = 20
    expect(enemyBaseHit(20, () => 0.5, 1)).toBe(20);
    // rand 0 -> floor(20 * 0.7) = 14 ; rand 1 -> floor(20 * 1.2999…) = 25
    expect(enemyBaseHit(20, () => 0, 1)).toBe(14);
    expect(enemyBaseHit(20, () => 1, 1)).toBe(25);
  });

  it('applies the NG+ difficulty scale', () => {
    expect(enemyBaseHit(20, () => 0.5, 1.5)).toBe(30);
  });
});
