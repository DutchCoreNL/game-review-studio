// ========== LOOT CRATES / KISTEN — MET PITY SYSTEEM ==========

import { generateWeapon, type GeneratedWeapon, type WeaponRarity } from './weaponGenerator';
import { generateGear, type GeneratedGear, type GearRarity } from './gearGenerator';

export type CrateTier = 'bronze' | 'silver' | 'gold';

export interface CrateDef {
  id: CrateTier;
  name: string;
  icon: string;
  price: number;
  color: string;
  rarityPool: WeaponRarity[];
  guaranteedMinRarity: WeaponRarity;
}

export const CRATE_DEFS: CrateDef[] = [
  {
    id: 'bronze',
    name: 'Bronze Kist',
    icon: '🥉',
    price: 5000,
    color: 'text-amber-600',
    rarityPool: ['common', 'uncommon', 'rare'],
    guaranteedMinRarity: 'common',
  },
  {
    id: 'silver',
    name: 'Zilver Kist',
    icon: '🥈',
    price: 15000,
    color: 'text-slate-300',
    rarityPool: ['uncommon', 'rare', 'epic'],
    guaranteedMinRarity: 'uncommon',
  },
  {
    id: 'gold',
    name: 'Gouden Kist',
    icon: '🥇',
    price: 40000,
    color: 'text-gold',
    rarityPool: ['rare', 'epic', 'legendary'],
    guaranteedMinRarity: 'rare',
  },
];

export interface CrateResult {
  tier: CrateTier;
  weapon?: GeneratedWeapon;
  gear?: GeneratedGear;
  wasPity: boolean;
}

/** Open a loot crate, with pity system */
export function openCrate(
  tier: CrateTier,
  playerLevel: number,
  pityCounter: number,
): { result: CrateResult; newPityCounter: number } {
  const def = CRATE_DEFS.find(c => c.id === tier)!;

  // Pity system: after 10 crates without epic+, force epic
  let forcedRarity: WeaponRarity | undefined;
  let wasPity = false;
  if (pityCounter >= 9) {
    forcedRarity = 'epic';
    wasPity = true;
  }

  // Roll rarity from pool
  const rarity = forcedRarity || rollCrateRarity(def);

  // 50/50 weapon vs gear
  const isWeapon = Math.random() < 0.5;
  const result: CrateResult = { tier, wasPity };

  if (isWeapon) {
    result.weapon = generateWeapon(playerLevel, rarity);
  } else {
    const gearType = Math.random() < 0.5 ? 'armor' as const : 'gadget' as const;
    result.gear = generateGear(playerLevel, gearType, rarity as GearRarity);
  }

  // Update pity counter
  const isEpicPlus = rarity === 'epic' || rarity === 'legendary';
  const newPityCounter = isEpicPlus ? 0 : pityCounter + 1;

  return { result, newPityCounter };
}

function rollCrateRarity(def: CrateDef): WeaponRarity {
  const r = Math.random();
  const pool = def.rarityPool;

  // Weight distribution based on pool size
  if (pool.length === 3) {
    if (r < 0.1) return pool[2]; // highest
    if (r < 0.35) return pool[1]; // middle
    return pool[0]; // lowest (most common)
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Get crate def by tier */
export function getCrateDef(tier: CrateTier): CrateDef {
  return CRATE_DEFS.find(c => c.id === tier)!;
}
