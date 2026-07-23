/**
 * Shared combat damage core.
 *
 * Both the PvE engine (engine.combatAction) and the PvP engine (pvpCombatTurn)
 * previously re-implemented their own base-hit formulas, which drifted apart —
 * notably, PvP ignored weapons entirely. This module is the single, transparent
 * source of the base hit so both sides of every fight resolve the same way and
 * a better weapon always means a harder hit.
 *
 * It computes only the *base* hit (weapon + muscle + spread, plus the heavy
 * miss check). Callers layer their own stance / buff / crit / enchantment
 * modifiers on top, so migrating an engine onto this core is behaviour-additive.
 */

export interface WeaponProfile {
  damage: number;      // raw weapon damage contribution (0 = bare fists)
  accuracy: number;    // 0..1 — improves the heavy-attack hit chance
  critChance: number;  // 0..1 — kept here so callers can share crit rolls
  isMelee: boolean;
}

/** Unarmed baseline — a 0.7 accuracy melee "weapon". */
export const FISTS: WeaponProfile = { damage: 0, accuracy: 0.7, critChance: 0.05, isMelee: true };

/** Normalizes a procedural weapon (weaponInventory item) into a WeaponProfile. */
export function weaponProfileFromProc(
  w: { damage: number; accuracy: number; critChance: number; frame?: string } | null | undefined,
): WeaponProfile {
  if (!w) return FISTS;
  return {
    damage: w.damage,
    accuracy: Math.max(0.1, Math.min(1, w.accuracy / 10)), // proc accuracy is 1..10
    critChance: Math.max(0, Math.min(1, w.critChance / 100)), // proc crit is a percentage
    isMelee: w.frame === 'blade',
  };
}

/** A believable weapon profile for a leveled NPC/bot that carries no procedural weapon. */
export function weaponProfileForLevel(level: number): WeaponProfile {
  return {
    damage: Math.round(level * 2.2),
    accuracy: 0.7,
    critChance: 0.05,
    isMelee: false,
  };
}

export interface ResolveAttackParams {
  kind: 'light' | 'heavy';
  muscle: number;
  weapon?: WeaponProfile;
  rand?: () => number;
}

export interface ResolveAttackResult {
  /** Base damage before the caller's stance/buff/crit modifiers. 0 on a miss. */
  damage: number;
  missed: boolean;
}

/**
 * The canonical additive base-hit term shared by PvE and PvP:
 *   light: 8 + muscle*2.5 + weaponDmg*0.4 + spread(6)
 *   heavy: 15 + muscle*3.5 + weaponDmg*0.6 + spread(10)
 * This is the single source of the raw hit magnitude; callers layer their own
 * accuracy / crit / stance / enchantment modifiers on top.
 */
export function baseHitDamage(
  kind: 'light' | 'heavy',
  muscle: number,
  weaponDamage: number,
  rand: () => number = Math.random,
): number {
  const dmg = kind === 'heavy'
    ? 15 + muscle * 3.5 + weaponDamage * 0.6 + rand() * 10
    : 8 + muscle * 2.5 + weaponDamage * 0.4 + rand() * 6;
  return Math.max(1, Math.floor(dmg));
}

/**
 * PvP-style hit resolution: the shared base term plus a heavy-attack hit check
 * where a more accurate weapon connects more often. Light attacks always land.
 */
export function resolveAttack(p: ResolveAttackParams): ResolveAttackResult {
  const rand = p.rand || Math.random;
  const w = p.weapon || FISTS;

  if (p.kind === 'heavy') {
    const hitChance = 0.6 + p.muscle * 0.03 + (w.accuracy - 0.7) * 0.3;
    if (rand() >= hitChance) return { damage: 0, missed: true };
  }
  return { damage: baseHitDamage(p.kind, p.muscle, w.damage, rand), missed: false };
}
