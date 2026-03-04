// ========== COMBAT LOOT SYSTEM ==========

import { generateWeapon } from './weaponGenerator';
import { generateGear } from './gearGenerator';

export type LootRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export interface LootItem {
  id: string;
  name: string;
  icon: string;
  rarity: LootRarity;
  type: 'money' | 'gear' | 'ammo' | 'consumable';
  value: number; // money amount, ammo count, or gear stat boost
  desc: string;
}

export interface CombatLootResult {
  items: LootItem[];
  rating: CombatRating;
  streakBonus: number; // multiplier, e.g. 1.1 for 10% bonus
  totalMoney: number;
  totalAmmo: number;
  droppedWeapon: import('./weaponGenerator').GeneratedWeapon | null;
  droppedGear: import('./gearGenerator').GeneratedGear | null;
}

export type CombatRating = 'S' | 'A' | 'B' | 'C' | 'D';

export interface CombatStats {
  damageDealt: number;
  damageTaken: number;
  turnsUsed: number;
  skillsUsed: number;
  combosLanded: number;
  playerHPPercent: number; // % HP remaining
}

const RARITY_COLORS: Record<LootRarity, string> = {
  common: 'text-muted-foreground',
  uncommon: 'text-emerald',
  rare: 'text-game-purple',
  epic: 'text-gold',
};

const RARITY_BG: Record<LootRarity, string> = {
  common: 'bg-muted/30 border-border',
  uncommon: 'bg-emerald/10 border-emerald/30',
  rare: 'bg-game-purple/10 border-game-purple/30',
  epic: 'bg-gold/10 border-gold/30',
};

export { RARITY_COLORS, RARITY_BG };

// ========== RATING CALCULATION ==========

export function calculateCombatRating(stats: CombatStats): CombatRating {
  let score = 0;

  // Efficiency: fewer turns = better
  if (stats.turnsUsed <= 3) score += 40;
  else if (stats.turnsUsed <= 5) score += 30;
  else if (stats.turnsUsed <= 8) score += 20;
  else score += 10;

  // HP remaining
  if (stats.playerHPPercent >= 80) score += 30;
  else if (stats.playerHPPercent >= 50) score += 20;
  else if (stats.playerHPPercent >= 25) score += 10;
  else score += 5;

  // Skills & combos used
  if (stats.skillsUsed >= 3) score += 15;
  else if (stats.skillsUsed >= 1) score += 10;

  if (stats.combosLanded >= 1) score += 15;
  else score += 5;

  if (score >= 85) return 'S';
  if (score >= 70) return 'A';
  if (score >= 50) return 'B';
  if (score >= 30) return 'C';
  return 'D';
}

// ========== STREAK BONUS ==========

export function getStreakBonus(streak: number): number {
  if (streak >= 10) return 1.5;
  if (streak >= 5) return 1.25;
  if (streak >= 3) return 1.1;
  return 1;
}

export function getStreakLabel(streak: number): string | null {
  if (streak >= 10) return '🔥 ONSTOPBAAR';
  if (streak >= 5) return '⚡ DOMINANTIE';
  if (streak >= 3) return '💪 OP DREEF';
  return null;
}

// ========== LOOT GENERATION ==========

const GEAR_LOOT: Omit<LootItem, 'id'>[] = [
  { name: 'Tactisch Vest', icon: '🦺', rarity: 'rare', type: 'gear', value: 2, desc: '+2 Defense' },
  { name: 'Gevechtshandschoenen', icon: '🥊', rarity: 'uncommon', type: 'gear', value: 1, desc: '+1 Muscle' },
  { name: 'Nachtkijker', icon: '🔭', rarity: 'rare', type: 'gear', value: 2, desc: '+2 Brains' },
  { name: 'Gouden Ring', icon: '💍', rarity: 'epic', type: 'gear', value: 3, desc: '+3 Charm' },
];

const CONSUMABLE_LOOT: Omit<LootItem, 'id'>[] = [
  { name: 'Medkit', icon: '🩹', rarity: 'common', type: 'consumable', value: 30, desc: '+30 HP herstel' },
  { name: 'Adrenaline Shot', icon: '💉', rarity: 'uncommon', type: 'consumable', value: 50, desc: '+50 HP herstel' },
  { name: 'Energiedrank', icon: '⚡', rarity: 'common', type: 'consumable', value: 20, desc: '+20 Energie' },
];

export function rollCombatLoot(
  enemyLevel: number,
  rating: CombatRating,
  streakBonus: number,
  isBoss: boolean
): CombatLootResult {
  const items: LootItem[] = [];
  const ratingMult = rating === 'S' ? 2 : rating === 'A' ? 1.5 : rating === 'B' ? 1.2 : rating === 'C' ? 1 : 0.8;
  const baseMoney = isBoss ? 25000 : Math.floor(5000 + enemyLevel * 2000);
  const money = Math.floor(baseMoney * ratingMult * streakBonus);

  // Always: money
  items.push({
    id: 'money_' + Date.now(),
    name: `€${money.toLocaleString()}`,
    icon: '💰',
    rarity: money > 20000 ? 'epic' : money > 10000 ? 'rare' : 'common',
    type: 'money',
    value: money,
    desc: 'Contant geld',
  });

  // Ammo drop (60% chance)
  if (Math.random() < 0.6) {
    const ammo = Math.floor((10 + enemyLevel * 5) * streakBonus);
    items.push({
      id: 'ammo_' + Date.now(),
      name: `${ammo} Kogels`,
      icon: '🔫',
      rarity: ammo > 30 ? 'uncommon' : 'common',
      type: 'ammo',
      value: ammo,
      desc: 'Munitie',
    });
  }

  // Consumable drop (40% chance, higher with better rating)
  const consumableChance = 0.3 + (ratingMult - 0.8) * 0.15;
  if (Math.random() < consumableChance) {
    const pool = CONSUMABLE_LOOT;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    items.push({ ...pick, id: 'cons_' + Date.now() });
  }

  // Gear drop (10% base, 25% for S-rating, 40% for boss)
  const gearChance = isBoss ? 0.4 : rating === 'S' ? 0.25 : rating === 'A' ? 0.15 : 0.08;
  if (Math.random() < gearChance) {
    const pool = GEAR_LOOT;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    items.push({ ...pick, id: 'gear_' + Date.now() });
  }

  // Procedural weapon drop
  const weaponChance = isBoss ? 0.6 : rating === 'S' ? 0.35 : rating === 'A' ? 0.2 : rating === 'B' ? 0.12 : 0.05;
  let droppedWeapon: import('./weaponGenerator').GeneratedWeapon | null = null;
  if (Math.random() < weaponChance) {
    const lootRarity: LootRarity = rating === 'S' ? 'epic' : rating === 'A' ? 'rare' : rating === 'B' ? 'uncommon' : 'common';
    droppedWeapon = generateWeapon(enemyLevel, undefined, lootRarity);
    items.push({
      id: 'wpn_drop_' + Date.now(),
      name: droppedWeapon.name,
      icon: '🗡️',
      rarity: (droppedWeapon.rarity === 'legendary' ? 'epic' : droppedWeapon.rarity) as LootRarity,
      type: 'gear',
      value: droppedWeapon.sellValue,
      desc: `${droppedWeapon.damage} DMG | ${droppedWeapon.accuracy} ACC`,
    });
  }

  // Procedural gear drop (armor or gadget)
  const gearDropChance = isBoss ? 0.5 : rating === 'S' ? 0.25 : rating === 'A' ? 0.15 : rating === 'B' ? 0.08 : 0.03;
  let droppedGear: import('./gearGenerator').GeneratedGear | null = null;
  if (Math.random() < gearDropChance) {
    const gearType = Math.random() < 0.5 ? 'armor' as const : 'gadget' as const;
    const gearLootRarity: LootRarity = rating === 'S' ? 'epic' : rating === 'A' ? 'rare' : rating === 'B' ? 'uncommon' : 'common';
    droppedGear = generateGear(enemyLevel, gearType, undefined, gearLootRarity);
    items.push({
      id: 'gear_drop_' + Date.now(),
      name: droppedGear.name,
      icon: gearType === 'armor' ? '🛡️' : '📱',
      rarity: (droppedGear.rarity === 'legendary' ? 'epic' : droppedGear.rarity) as LootRarity,
      type: 'gear',
      value: droppedGear.sellValue,
      desc: `${droppedGear.defense} DEF | ${droppedGear.brains} INT`,
    });
  }

  return {
    items,
    rating,
    streakBonus,
    totalMoney: money,
    totalAmmo: items.filter(i => i.type === 'ammo').reduce((s, i) => s + i.value, 0),
    droppedWeapon,
    droppedGear,
  };
}
