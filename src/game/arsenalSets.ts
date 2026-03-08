// ========== ARSENAL SET BONUS SYSTEM ==========
// When equipping items of the same brand across weapon + armor + gadget slots, 
// the player receives escalating set bonuses.

import type { BrandId } from './weaponGenerator';
import type { GearBrandId } from './gearGenerator';
import type { GeneratedWeapon } from './weaponGenerator';
import type { GeneratedGear } from './gearGenerator';

// ========== BRAND MAPPING ==========
// Maps weapon brands to their gear brand equivalents for set matching
// Some brands share a "family" for set purposes

export type SetFamilyId = 'nox' | 'serpiente' | 'volkov' | 'shadow' | 'iron' | 'krakeel' | 'phantom' | 'drakon';

const WEAPON_BRAND_TO_FAMILY: Record<BrandId, SetFamilyId> = {
  noxforge: 'nox',
  serpiente: 'serpiente',
  volkov: 'volkov',
  shadowtech: 'shadow',
  ironjaw: 'iron',
  krakeel: 'krakeel',
  phantom: 'phantom',
  drakon: 'drakon',
};

const GEAR_BRAND_TO_FAMILY: Record<GearBrandId, SetFamilyId> = {
  aegis: 'iron',        // Aegis + Ironjaw = defensive family
  neurox: 'shadow',     // NeuroX + ShadowTech = tech family
  blackwall: 'volkov',  // Blackwall + Volkov = balanced family
  stealthcore: 'phantom', // StealthCore + Phantom = stealth family
  titanweave: 'drakon', // TitanWeave + Drakon = heavy family
  ciphertech: 'nox',    // CipherTech + Noxforge = offensive family
};

// ========== SET BONUS DEFINITIONS ==========

export interface SetBonusTier {
  pieces: number;
  label: string;
  effects: {
    damageMult?: number;      // multiplier on weapon damage
    defenseMult?: number;     // multiplier on gear defense
    critBonus?: number;       // flat crit chance bonus
    hpBonus?: number;         // flat HP bonus
    heatReduction?: number;   // flat heat reduction per action
    xpMult?: number;          // multiplier on XP gained
    lifesteal?: number;       // percentage of damage healed
    armorPierce?: number;     // flat armor pierce bonus
  };
}

export interface SetBonusDef {
  familyId: SetFamilyId;
  name: string;
  icon: string;
  color: string;
  tiers: SetBonusTier[];
}

export const SET_BONUSES: SetBonusDef[] = [
  {
    familyId: 'nox',
    name: 'Nox Arsenal',
    icon: '🔨',
    color: 'text-orange-400',
    tiers: [
      { pieces: 2, label: '+8% schade, +5% crit', effects: { damageMult: 1.08, critBonus: 5 } },
      { pieces: 3, label: '+15% schade, +10% crit, 3% lifesteal', effects: { damageMult: 1.15, critBonus: 10, lifesteal: 0.03 } },
    ],
  },
  {
    familyId: 'serpiente',
    name: 'Serpiente Protocol',
    icon: '🐍',
    color: 'text-blood',
    tiers: [
      { pieces: 2, label: '+12% crit, +5 HP', effects: { critBonus: 12, hpBonus: 5 } },
      { pieces: 3, label: '+20% crit, +15 HP, 5% lifesteal', effects: { critBonus: 20, hpBonus: 15, lifesteal: 0.05 } },
    ],
  },
  {
    familyId: 'volkov',
    name: 'Volkov Pact',
    icon: '⚙️',
    color: 'text-ice',
    tiers: [
      { pieces: 2, label: '+10% defense, +10 HP', effects: { defenseMult: 1.1, hpBonus: 10 } },
      { pieces: 3, label: '+20% defense, +25 HP, +10% XP', effects: { defenseMult: 1.2, hpBonus: 25, xpMult: 1.1 } },
    ],
  },
  {
    familyId: 'shadow',
    name: 'Shadow Network',
    icon: '👁️',
    color: 'text-game-purple',
    tiers: [
      { pieces: 2, label: '+5% alle stats, -2 heat', effects: { damageMult: 1.05, defenseMult: 1.05, heatReduction: 2 } },
      { pieces: 3, label: '+12% alle stats, -5 heat, +15% XP', effects: { damageMult: 1.12, defenseMult: 1.12, heatReduction: 5, xpMult: 1.15 } },
    ],
  },
  {
    familyId: 'iron',
    name: 'Iron Bastion',
    icon: '💀',
    color: 'text-gold',
    tiers: [
      { pieces: 2, label: '+15% defense, +10% armor pierce', effects: { defenseMult: 1.15, armorPierce: 10 } },
      { pieces: 3, label: '+25% defense, +20% armor pierce, +20 HP', effects: { defenseMult: 1.25, armorPierce: 20, hpBonus: 20 } },
    ],
  },
  {
    familyId: 'krakeel',
    name: 'Krakeel Chaos',
    icon: '💣',
    color: 'text-red-500',
    tiers: [
      { pieces: 2, label: '+10% schade, +8% crit', effects: { damageMult: 1.1, critBonus: 8 } },
      { pieces: 3, label: '+20% schade, +15% crit, +10% armor pierce', effects: { damageMult: 1.2, critBonus: 15, armorPierce: 10 } },
    ],
  },
  {
    familyId: 'phantom',
    name: 'Phantom Shroud',
    icon: '👻',
    color: 'text-slate-300',
    tiers: [
      { pieces: 2, label: '-3 heat, +5% crit', effects: { heatReduction: 3, critBonus: 5 } },
      { pieces: 3, label: '-6 heat, +10% crit, +10% schade', effects: { heatReduction: 6, critBonus: 10, damageMult: 1.1 } },
    ],
  },
  {
    familyId: 'drakon',
    name: 'Drakon Might',
    icon: '🐉',
    color: 'text-amber-500',
    tiers: [
      { pieces: 2, label: '+12% schade, +15 HP', effects: { damageMult: 1.12, hpBonus: 15 } },
      { pieces: 3, label: '+25% schade, +30 HP, +15% armor pierce', effects: { damageMult: 1.25, hpBonus: 30, armorPierce: 15 } },
    ],
  },
];

// ========== DETECTION ==========

export interface ActiveSetBonus {
  def: SetBonusDef;
  matchedPieces: number; // how many equipped items match this family
  activeTier: SetBonusTier | null; // highest activated tier
}

/**
 * Detect active set bonuses from equipped loadout
 */
export function detectSetBonuses(
  equippedWeapon: GeneratedWeapon | undefined,
  equippedArmor: GeneratedGear | undefined,
  equippedGadget: GeneratedGear | undefined,
): ActiveSetBonus[] {
  if (!equippedWeapon && !equippedArmor && !equippedGadget) return [];

  // Count pieces per family
  const familyCounts: Partial<Record<SetFamilyId, number>> = {};

  if (equippedWeapon) {
    const fam = WEAPON_BRAND_TO_FAMILY[equippedWeapon.brand];
    familyCounts[fam] = (familyCounts[fam] || 0) + 1;
  }
  if (equippedArmor) {
    const fam = GEAR_BRAND_TO_FAMILY[equippedArmor.brand];
    familyCounts[fam] = (familyCounts[fam] || 0) + 1;
  }
  if (equippedGadget) {
    const fam = GEAR_BRAND_TO_FAMILY[equippedGadget.brand];
    familyCounts[fam] = (familyCounts[fam] || 0) + 1;
  }

  // Find active set bonuses (need at least 2 pieces)
  const active: ActiveSetBonus[] = [];
  for (const [famId, count] of Object.entries(familyCounts)) {
    if (count < 2) continue;
    const def = SET_BONUSES.find(s => s.familyId === famId);
    if (!def) continue;

    // Find highest activated tier
    let activeTier: SetBonusTier | null = null;
    for (const tier of def.tiers) {
      if (count >= tier.pieces) activeTier = tier;
    }

    active.push({ def, matchedPieces: count, activeTier });
  }

  return active;
}

/**
 * Get combined effects from all active set bonuses
 */
export function getCombinedSetEffects(
  equippedWeapon: GeneratedWeapon | undefined,
  equippedArmor: GeneratedGear | undefined,
  equippedGadget: GeneratedGear | undefined,
): SetBonusTier['effects'] {
  const bonuses = detectSetBonuses(equippedWeapon, equippedArmor, equippedGadget);
  const combined: SetBonusTier['effects'] = {};

  for (const bonus of bonuses) {
    if (!bonus.activeTier) continue;
    const e = bonus.activeTier.effects;
    if (e.damageMult) combined.damageMult = (combined.damageMult || 1) * e.damageMult;
    if (e.defenseMult) combined.defenseMult = (combined.defenseMult || 1) * e.defenseMult;
    if (e.critBonus) combined.critBonus = (combined.critBonus || 0) + e.critBonus;
    if (e.hpBonus) combined.hpBonus = (combined.hpBonus || 0) + e.hpBonus;
    if (e.heatReduction) combined.heatReduction = (combined.heatReduction || 0) + e.heatReduction;
    if (e.xpMult) combined.xpMult = (combined.xpMult || 1) * e.xpMult;
    if (e.lifesteal) combined.lifesteal = (combined.lifesteal || 0) + e.lifesteal;
    if (e.armorPierce) combined.armorPierce = (combined.armorPierce || 0) + e.armorPierce;
  }

  return combined;
}
