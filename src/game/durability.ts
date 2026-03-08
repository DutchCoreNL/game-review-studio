// ========== DURABILITY / SLIJTAGE SYSTEM ==========
// Items lose condition when used in combat. Below 50%, stats degrade proportionally.
// Repair costs scrap or money.

import type { WeaponRarity } from './weaponGenerator';
import type { GearRarity } from './gearGenerator';

// ========== CONSTANTS ==========

export const MAX_DURABILITY = 100;
export const DURABILITY_PENALTY_THRESHOLD = 50; // below this, stats start degrading

/** Durability lost per combat use */
export const DURABILITY_LOSS_PER_COMBAT: Record<WeaponRarity, number> = {
  common: 5,
  uncommon: 4,
  rare: 3,
  epic: 2,
  legendary: 1, // legendary items are more durable
};

/** Repair cost in money per durability point */
export const REPAIR_COST_PER_POINT: Record<WeaponRarity, number> = {
  common: 20,
  uncommon: 40,
  rare: 80,
  epic: 150,
  legendary: 300,
};

/** Alternative: repair cost in scrap */
export const REPAIR_SCRAP_COST: Record<WeaponRarity, number> = {
  common: 1,    // 1 scrap repairs fully
  uncommon: 2,
  rare: 4,
  epic: 8,
  legendary: 15,
};

// ========== FUNCTIONS ==========

/** Get stat effectiveness multiplier based on durability */
export function getDurabilityMultiplier(durability: number): number {
  if (durability >= DURABILITY_PENALTY_THRESHOLD) return 1;
  if (durability <= 0) return 0.5; // minimum 50% effectiveness
  // Linear scaling from 50% to 100% between 0 and threshold
  return 0.5 + (durability / DURABILITY_PENALTY_THRESHOLD) * 0.5;
}

/** Calculate durability loss after a combat encounter */
export function getDurabilityLoss(rarity: WeaponRarity | GearRarity): number {
  return DURABILITY_LOSS_PER_COMBAT[rarity as WeaponRarity] || 3;
}

/** Calculate money cost to fully repair an item */
export function getRepairCostMoney(rarity: WeaponRarity | GearRarity, currentDurability: number): number {
  const missing = MAX_DURABILITY - currentDurability;
  if (missing <= 0) return 0;
  return Math.ceil(missing * (REPAIR_COST_PER_POINT[rarity as WeaponRarity] || 80));
}

/** Get scrap cost for full repair */
export function getRepairCostScrap(rarity: WeaponRarity | GearRarity): number {
  return REPAIR_SCRAP_COST[rarity as WeaponRarity] || 4;
}

/** Get durability status label and color */
export function getDurabilityStatus(durability: number): { label: string; color: string; icon: string } {
  if (durability >= 80) return { label: 'Uitstekend', color: 'text-emerald', icon: '🟢' };
  if (durability >= 50) return { label: 'Goed', color: 'text-gold', icon: '🟡' };
  if (durability >= 25) return { label: 'Beschadigd', color: 'text-orange-400', icon: '🟠' };
  if (durability > 0) return { label: 'Kritiek', color: 'text-blood', icon: '🔴' };
  return { label: 'Kapot', color: 'text-muted-foreground', icon: '⚫' };
}

/** Check if item needs repair (below threshold) */
export function needsRepair(durability: number): boolean {
  return durability < DURABILITY_PENALTY_THRESHOLD;
}
