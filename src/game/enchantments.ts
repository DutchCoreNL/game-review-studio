// ========== ENCHANTMENT / SOCKET SYSTEM ==========
// Enchantments are standalone items that can be socketed into weapons or gear.
// Max 1 enchantment per item. Replacing an enchantment destroys the old one.

import type { WeaponRarity } from './weaponGenerator';

// ========== TYPES ==========

export type EnchantmentId = 
  | 'vampiric' | 'swift' | 'fortified' | 'venomous' 
  | 'blazing' | 'frozen' | 'electric' | 'lucky'
  | 'precise' | 'brutal' | 'stealthy' | 'berserker';

export type EnchantmentRarity = 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface EnchantmentDef {
  id: EnchantmentId;
  name: string;
  icon: string;
  color: string;
  description: string;
  rarity: EnchantmentRarity;
  effects: {
    lifesteal?: number;       // % of damage healed
    fireRateBonus?: number;   // flat bonus
    defenseBonus?: number;    // flat bonus
    dotDamage?: number;       // damage per turn
    stunChance?: number;      // 0-1
    critBonus?: number;       // flat %
    accuracyBonus?: number;   // flat bonus
    damageMult?: number;      // multiplier
    heatReduction?: number;   // flat reduction
    berserkThreshold?: number; // HP % below which bonus activates
    berserkDamageMult?: number;
  };
}

export interface EnchantmentItem {
  id: string;          // unique instance id
  enchantmentId: EnchantmentId;
  rarity: EnchantmentRarity;
}

// ========== ENCHANTMENT DEFINITIONS ==========

export const ENCHANTMENTS: EnchantmentDef[] = [
  {
    id: 'vampiric', name: 'Vampirisch', icon: '🩸', color: 'text-blood',
    description: 'Steelt 5% van toegebrachte schade als HP',
    rarity: 'rare',
    effects: { lifesteal: 0.05 },
  },
  {
    id: 'swift', name: 'Snelheid', icon: '💨', color: 'text-ice',
    description: '+1 vuursnelheid',
    rarity: 'uncommon',
    effects: { fireRateBonus: 1 },
  },
  {
    id: 'fortified', name: 'Versterkt', icon: '🏰', color: 'text-gold',
    description: '+3 defense',
    rarity: 'uncommon',
    effects: { defenseBonus: 3 },
  },
  {
    id: 'venomous', name: 'Giftig', icon: '☠️', color: 'text-emerald',
    description: '+2 gif schade per beurt',
    rarity: 'rare',
    effects: { dotDamage: 2 },
  },
  {
    id: 'blazing', name: 'Brandend', icon: '🔥', color: 'text-orange-400',
    description: '+3 brand schade per beurt',
    rarity: 'rare',
    effects: { dotDamage: 3 },
  },
  {
    id: 'frozen', name: 'Bevroren', icon: '❄️', color: 'text-cyan-400',
    description: '12% kans op bevriezing (stun)',
    rarity: 'rare',
    effects: { stunChance: 0.12 },
  },
  {
    id: 'electric', name: 'Elektrisch', icon: '⚡', color: 'text-yellow-400',
    description: '15% stun kans + 1 schade/beurt',
    rarity: 'epic',
    effects: { stunChance: 0.15, dotDamage: 1 },
  },
  {
    id: 'lucky', name: 'Geluksvogel', icon: '🍀', color: 'text-emerald',
    description: '+8% crit kans',
    rarity: 'uncommon',
    effects: { critBonus: 8 },
  },
  {
    id: 'precise', name: 'Precisie', icon: '🎯', color: 'text-ice',
    description: '+2 accuracy',
    rarity: 'uncommon',
    effects: { accuracyBonus: 2 },
  },
  {
    id: 'brutal', name: 'Brutaal', icon: '💀', color: 'text-blood',
    description: '+10% schade',
    rarity: 'epic',
    effects: { damageMult: 1.1 },
  },
  {
    id: 'stealthy', name: 'Sluipend', icon: '🤫', color: 'text-slate-300',
    description: '-4 heat per actie',
    rarity: 'rare',
    effects: { heatReduction: 4 },
  },
  {
    id: 'berserker', name: 'Berserker', icon: '😤', color: 'text-red-500',
    description: '+25% schade onder 30% HP',
    rarity: 'legendary',
    effects: { berserkThreshold: 0.3, berserkDamageMult: 1.25 },
  },
];

// ========== ENCHANTMENT RARITY ==========

export const ENCHANTMENT_RARITY_COLORS: Record<EnchantmentRarity, string> = {
  uncommon: 'text-emerald',
  rare: 'text-ice',
  epic: 'text-game-purple',
  legendary: 'text-gold',
};

export const ENCHANTMENT_RARITY_BG: Record<EnchantmentRarity, string> = {
  uncommon: 'bg-emerald/10 border-emerald/30',
  rare: 'bg-ice/10 border-ice/30',
  epic: 'bg-game-purple/10 border-game-purple/30',
  legendary: 'bg-gold/10 border-gold/30',
};

// ========== FUNCTIONS ==========

export function getEnchantmentDef(id: EnchantmentId): EnchantmentDef {
  return ENCHANTMENTS.find(e => e.id === id)!;
}

/** Socket cost in money */
export function getSocketCost(enchantmentRarity: EnchantmentRarity): number {
  const costs: Record<EnchantmentRarity, number> = {
    uncommon: 2000,
    rare: 5000,
    epic: 12000,
    legendary: 25000,
  };
  return costs[enchantmentRarity];
}

/** Generate a random enchantment drop */
let enchantIdCounter = 0;
export function generateEnchantmentDrop(playerLevel: number): EnchantmentItem {
  const r = Math.random();
  const levelBonus = Math.min(playerLevel * 0.02, 0.2);

  let rarity: EnchantmentRarity;
  if (r < 0.03 + levelBonus * 0.3) rarity = 'legendary';
  else if (r < 0.12 + levelBonus) rarity = 'epic';
  else if (r < 0.40 + levelBonus) rarity = 'rare';
  else rarity = 'uncommon';

  const pool = ENCHANTMENTS.filter(e => e.rarity === rarity);
  // If no exact match, widen pool
  const pick = pool.length > 0
    ? pool[Math.floor(Math.random() * pool.length)]
    : ENCHANTMENTS[Math.floor(Math.random() * ENCHANTMENTS.length)];

  enchantIdCounter++;
  return {
    id: `ench_${Date.now()}_${enchantIdCounter}`,
    enchantmentId: pick.id,
    rarity: pick.rarity,
  };
}

/** Salvage value of an enchantment in scrap */
export const ENCHANTMENT_SCRAP_VALUES: Record<EnchantmentRarity, number> = {
  uncommon: 2,
  rare: 5,
  epic: 12,
  legendary: 30,
};
