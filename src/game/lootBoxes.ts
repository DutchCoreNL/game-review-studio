// ========== LOOT BOX SYSTEEM — NIEUW, LOS VAN CRATES ==========

import { generateWeapon, type GeneratedWeapon, type WeaponRarity } from './weaponGenerator';
import { generateGear, type GeneratedGear, type GearRarity } from './gearGenerator';

export type LootBoxTier = 'street' | 'underground' | 'kingpin' | 'nox';

export interface LootBoxDef {
  id: LootBoxTier;
  name: string;
  icon: string;
  price: number;
  color: string;          // tailwind color token
  glowColor: string;      // HSL for glow effects
  bgGradient: string;     // gradient for the box card
  minItems: number;
  maxItems: number;
  moneyRange: [number, number]; // min-max money reward
  rarityWeights: Record<WeaponRarity, number>; // relative weights
  guaranteedMinRarity: WeaponRarity;
}

export const LOOT_BOX_DEFS: LootBoxDef[] = [
  {
    id: 'street',
    name: 'Straat Kist',
    icon: '📦',
    price: 3000,
    color: 'text-muted-foreground',
    glowColor: '0 0% 60%',
    bgGradient: 'from-zinc-800/80 to-zinc-900/90',
    minItems: 1,
    maxItems: 2,
    moneyRange: [500, 3000],
    rarityWeights: { common: 60, uncommon: 30, rare: 8, epic: 1.8, legendary: 0.2 },
    guaranteedMinRarity: 'common',
  },
  {
    id: 'underground',
    name: 'Underground Kist',
    icon: '🗃️',
    price: 12000,
    color: 'text-emerald',
    glowColor: '160 60% 45%',
    bgGradient: 'from-emerald-900/60 to-zinc-900/90',
    minItems: 2,
    maxItems: 3,
    moneyRange: [2000, 8000],
    rarityWeights: { common: 30, uncommon: 40, rare: 22, epic: 7, legendary: 1 },
    guaranteedMinRarity: 'uncommon',
  },
  {
    id: 'kingpin',
    name: 'Kingpin Kist',
    icon: '👑',
    price: 35000,
    color: 'text-gold',
    glowColor: '45 90% 55%',
    bgGradient: 'from-yellow-900/50 to-zinc-900/90',
    minItems: 3,
    maxItems: 4,
    moneyRange: [5000, 20000],
    rarityWeights: { common: 5, uncommon: 20, rare: 40, epic: 28, legendary: 7 },
    guaranteedMinRarity: 'rare',
  },
  {
    id: 'nox',
    name: 'Nox Kist',
    icon: '💀',
    price: 80000,
    color: 'text-blood',
    glowColor: '0 70% 50%',
    bgGradient: 'from-red-950/60 via-purple-950/40 to-zinc-900/90',
    minItems: 4,
    maxItems: 5,
    moneyRange: [15000, 50000],
    rarityWeights: { common: 0, uncommon: 5, rare: 25, epic: 45, legendary: 25 },
    guaranteedMinRarity: 'epic',
  },
];

export type LootBoxRewardType = 'weapon' | 'armor' | 'gadget' | 'money' | 'ammo' | 'scrap';

export interface LootBoxReward {
  id: string;
  type: LootBoxRewardType;
  rarity: WeaponRarity;
  name: string;
  icon: string;
  description: string;
  value: number; // money amount, ammo count, or sellValue
  weapon?: GeneratedWeapon;
  gear?: GeneratedGear;
}

export interface LootBoxResult {
  tier: LootBoxTier;
  rewards: LootBoxReward[];
  wasPity: boolean;
}

let rewardIdCounter = 0;

function rollRarity(weights: Record<WeaponRarity, number>, minRarity: WeaponRarity): WeaponRarity {
  const order: WeaponRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const minIdx = order.indexOf(minRarity);
  
  // Zero out weights below min
  const adjusted: Record<string, number> = {};
  let total = 0;
  for (let i = 0; i < order.length; i++) {
    const w = i >= minIdx ? weights[order[i]] : 0;
    adjusted[order[i]] = w;
    total += w;
  }
  
  let roll = Math.random() * total;
  for (const r of order) {
    roll -= adjusted[r];
    if (roll <= 0) return r as WeaponRarity;
  }
  return minRarity;
}

function rollRewardType(): LootBoxRewardType {
  const r = Math.random();
  if (r < 0.30) return 'weapon';
  if (r < 0.55) return 'armor';
  if (r < 0.75) return 'gadget';
  if (r < 0.88) return 'money';
  if (r < 0.95) return 'ammo';
  return 'scrap';
}

export function openLootBox(
  tier: LootBoxTier,
  playerLevel: number,
  pityCounter: number,
): { result: LootBoxResult; newPityCounter: number } {
  const def = LOOT_BOX_DEFS.find(b => b.id === tier)!;
  const itemCount = def.minItems + Math.floor(Math.random() * (def.maxItems - def.minItems + 1));
  
  let wasPity = false;
  let forcedEpic = false;
  if (pityCounter >= 9) {
    forcedEpic = true;
    wasPity = true;
  }

  const rewards: LootBoxReward[] = [];

  for (let i = 0; i < itemCount; i++) {
    let rarity = rollRarity(def.rarityWeights, def.guaranteedMinRarity);
    
    // Apply pity on first item only
    if (i === 0 && forcedEpic && (rarity === 'common' || rarity === 'uncommon' || rarity === 'rare')) {
      rarity = 'epic';
    }

    const rewardType = rollRewardType();
    const reward = generateReward(rewardType, rarity, playerLevel, def);
    rewards.push(reward);
  }

  // Always include some money
  const hasMoney = rewards.some(r => r.type === 'money');
  if (!hasMoney) {
    const moneyAmount = def.moneyRange[0] + Math.floor(Math.random() * (def.moneyRange[1] - def.moneyRange[0]));
    rewards.push({
      id: `lb_money_${Date.now()}_${++rewardIdCounter}`,
      type: 'money',
      rarity: moneyAmount > 10000 ? 'rare' : moneyAmount > 5000 ? 'uncommon' : 'common',
      name: `€${moneyAmount.toLocaleString()}`,
      icon: '💰',
      description: 'Contant geld',
      value: moneyAmount,
    });
  }

  const hasEpicPlus = rewards.some(r => r.rarity === 'epic' || r.rarity === 'legendary');
  const newPityCounter = hasEpicPlus ? 0 : pityCounter + 1;

  return { result: { tier, rewards, wasPity }, newPityCounter };
}

function generateReward(
  type: LootBoxRewardType,
  rarity: WeaponRarity,
  playerLevel: number,
  def: LootBoxDef,
): LootBoxReward {
  rewardIdCounter++;
  const id = `lb_${type}_${Date.now()}_${rewardIdCounter}`;

  switch (type) {
    case 'weapon': {
      const weapon = generateWeapon(playerLevel, undefined, rarity as any);
      return {
        id, type, rarity, name: weapon.name, icon: '🔫',
        description: `${weapon.damage} DMG | ${weapon.accuracy} ACC`,
        value: weapon.sellValue, weapon,
      };
    }
    case 'armor': {
      const gear = generateGear(playerLevel, 'armor', undefined, rarity as any);
      return {
        id, type, rarity, name: gear.name, icon: '🛡️',
        description: `${gear.defense} DEF | ${gear.brains} INT`,
        value: gear.sellValue, gear,
      };
    }
    case 'gadget': {
      const gear = generateGear(playerLevel, 'gadget', undefined, rarity as any);
      return {
        id, type, rarity, name: gear.name, icon: '📱',
        description: `${gear.defense} DEF | ${gear.charm} CHA`,
        value: gear.sellValue, gear,
      };
    }
    case 'money': {
      const amount = def.moneyRange[0] + Math.floor(Math.random() * (def.moneyRange[1] - def.moneyRange[0]));
      const mult = rarity === 'legendary' ? 3 : rarity === 'epic' ? 2.2 : rarity === 'rare' ? 1.5 : 1;
      const finalAmount = Math.floor(amount * mult);
      return {
        id, type, rarity, name: `€${finalAmount.toLocaleString()}`, icon: '💰',
        description: 'Contant geld', value: finalAmount,
      };
    }
    case 'ammo': {
      const base = rarity === 'legendary' ? 100 : rarity === 'epic' ? 60 : rarity === 'rare' ? 35 : 15;
      return {
        id, type, rarity, name: `${base} Kogels`, icon: '🔫',
        description: 'Munitie', value: base,
      };
    }
    case 'scrap': {
      const base = rarity === 'legendary' ? 50 : rarity === 'epic' ? 20 : rarity === 'rare' ? 8 : 3;
      return {
        id, type, rarity, name: `${base} Scrap`, icon: '⚙️',
        description: 'Onderdelen voor crafting', value: base,
      };
    }
  }
}

export function getLootBoxDef(tier: LootBoxTier): LootBoxDef {
  return LOOT_BOX_DEFS.find(b => b.id === tier)!;
}
