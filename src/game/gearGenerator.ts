// ========== BORDERLANDS-STYLE PROCEDURAL GEAR SYSTEM (ARMOR & GADGETS) ==========

import type { LootRarity } from './combatLoot';

// ========== TYPES ==========

export type GearRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type GearType = 'armor' | 'gadget';

export type ArmorFrameId = 'vest' | 'jacket' | 'exosuit' | 'shield' | 'cloak';
export type GadgetFrameId = 'phone' | 'deck' | 'implant' | 'drone' | 'scanner';
export type GearFrameId = ArmorFrameId | GadgetFrameId;

export type GearBrandId = 'aegis' | 'neurox' | 'blackwall' | 'stealthcore' | 'titanweave' | 'ciphertech';
export type GearModId = 'geen' | 'reflective' | 'thermal' | 'emp' | 'regen' | 'stealth' | 'boost';

// ========== INTERFACES ==========

export interface GearBrand {
  id: GearBrandId;
  name: string;
  icon: string;
  color: string;
  bonus: string;
  defenseMult: number;
  brainsMult: number;
  charmMult: number;
  specialBonus: string;
}

export interface GearFrame {
  id: GearFrameId;
  type: GearType;
  name: string;
  icon: string;
  baseDefense: number;
  baseBrains: number;
  baseCharm: number;
  baseHP: number;
}

export interface GearMod {
  id: GearModId;
  name: string;
  icon: string;
  effect: string;
  defenseBonus: number;
  brainsBonus: number;
  specialEffect: string | null;
}

export interface GeneratedGear {
  id: string;
  name: string;
  type: GearType;
  brand: GearBrandId;
  frame: GearFrameId;
  mod: GearModId;
  rarity: GearRarity;
  // Computed stats
  defense: number;
  brains: number;
  charm: number;
  bonusHP: number;
  specialEffect: string | null;
  // Meta
  level: number;
  sellValue: number;
  equipped: boolean;
  locked?: boolean;
  masteryXp?: number;
  isUnique?: boolean;
  uniqueGlow?: string;
  lore?: string;
  // Arsenal enhancement features
  enchantmentId?: import('./enchantments').EnchantmentId;
  skinId?: import('./weaponSkins').SkinId;
  durability?: number; // 0-100, default 100
}

// ========== BRANDS ==========

export const GEAR_BRANDS: GearBrand[] = [
  { id: 'aegis', name: 'Aegis Defense', icon: '🛡️', color: 'text-ice', bonus: '+20% defense', defenseMult: 1.2, brainsMult: 1, charmMult: 1, specialBonus: 'Extra bescherming' },
  { id: 'neurox', name: 'NeuroX Labs', icon: '🧠', color: 'text-game-purple', bonus: '+20% vernuft', defenseMult: 1, brainsMult: 1.2, charmMult: 1, specialBonus: 'Mentale boost' },
  { id: 'blackwall', name: 'Blackwall Corp', icon: '🔒', color: 'text-emerald', bonus: '+15% alle stats', defenseMult: 1.15, brainsMult: 1.15, charmMult: 1.15, specialBonus: 'Gebalanceerd' },
  { id: 'stealthcore', name: 'StealthCore', icon: '👤', color: 'text-slate-300', bonus: '+15% stealth & charm', defenseMult: 1, brainsMult: 1.1, charmMult: 1.15, specialBonus: 'Onzichtbaarheid' },
  { id: 'titanweave', name: 'TitanWeave', icon: '⚔️', color: 'text-gold', bonus: '+25% defense, -5% snelheid', defenseMult: 1.25, brainsMult: 0.95, charmMult: 0.95, specialBonus: 'Onverwoestbaar' },
  { id: 'ciphertech', name: 'CipherTech', icon: '💻', color: 'text-cyan-400', bonus: '+25% vernuft, -5% defense', defenseMult: 0.95, brainsMult: 1.25, charmMult: 1, specialBonus: 'Hack expert' },
];

// ========== FRAMES ==========

export const ARMOR_FRAMES: GearFrame[] = [
  { id: 'vest', type: 'armor', name: 'Kevlar Vest', icon: '🦺', baseDefense: 5, baseBrains: 0, baseCharm: 0, baseHP: 10 },
  { id: 'jacket', type: 'armor', name: 'Pantser Jas', icon: '🧥', baseDefense: 3, baseBrains: 0, baseCharm: 3, baseHP: 5 },
  { id: 'exosuit', type: 'armor', name: 'Exo-Suit', icon: '🤖', baseDefense: 8, baseBrains: 1, baseCharm: 0, baseHP: 20 },
  { id: 'shield', type: 'armor', name: 'Energieschild', icon: '🔋', baseDefense: 6, baseBrains: 2, baseCharm: 0, baseHP: 15 },
  { id: 'cloak', type: 'armor', name: 'Stealth Mantel', icon: '🦇', baseDefense: 2, baseBrains: 3, baseCharm: 4, baseHP: 5 },
];

export const GADGET_FRAMES: GearFrame[] = [
  { id: 'phone', type: 'gadget', name: 'Secure Phone', icon: '📱', baseDefense: 0, baseBrains: 3, baseCharm: 2, baseHP: 0 },
  { id: 'deck', type: 'gadget', name: 'Hack Deck', icon: '💻', baseDefense: 0, baseBrains: 6, baseCharm: 0, baseHP: 0 },
  { id: 'implant', type: 'gadget', name: 'Neural Implant', icon: '🧠', baseDefense: 1, baseBrains: 5, baseCharm: 2, baseHP: 5 },
  { id: 'drone', type: 'gadget', name: 'Recon Drone', icon: '🛸', baseDefense: 0, baseBrains: 4, baseCharm: 0, baseHP: 0 },
  { id: 'scanner', type: 'gadget', name: 'Bio Scanner', icon: '📡', baseDefense: 0, baseBrains: 3, baseCharm: 3, baseHP: 0 },
];

export const ALL_GEAR_FRAMES: GearFrame[] = [...ARMOR_FRAMES, ...GADGET_FRAMES];

// ========== MODS ==========

export const GEAR_MODS: GearMod[] = [
  { id: 'geen', name: 'Geen', icon: '', effect: '', defenseBonus: 0, brainsBonus: 0, specialEffect: null },
  { id: 'reflective', name: 'Reflectief', icon: '✨', effect: '+2 defense, 10% reflect', defenseBonus: 2, brainsBonus: 0, specialEffect: '✨ 10% schade reflectie' },
  { id: 'thermal', name: 'Thermisch', icon: '🌡️', effect: '+1 defense, vuur resistent', defenseBonus: 1, brainsBonus: 0, specialEffect: '🌡️ 50% minder brand schade' },
  { id: 'emp', name: 'EMP Module', icon: '⚡', effect: '+2 brains, emp schild', defenseBonus: 0, brainsBonus: 2, specialEffect: '⚡ 15% kans op vijand stun' },
  { id: 'regen', name: 'Nano Regen', icon: '💚', effect: 'Heal 2 HP/beurt', defenseBonus: 0, brainsBonus: 0, specialEffect: '💚 Regenereer 2 HP per beurt' },
  { id: 'stealth', name: 'Stealth Coating', icon: '👻', effect: '-2 heat per actie', defenseBonus: 0, brainsBonus: 1, specialEffect: '👻 -2 heat per actie' },
  { id: 'boost', name: 'Stat Boost', icon: '⬆️', effect: '+1 alle stats', defenseBonus: 1, brainsBonus: 1, specialEffect: '⬆️ +1 alle combat stats' },
];

// ========== RARITY ==========

export const GEAR_RARITY_COLORS: Record<GearRarity, string> = {
  common: 'text-muted-foreground',
  uncommon: 'text-emerald',
  rare: 'text-ice',
  epic: 'text-game-purple',
  legendary: 'text-gold',
};

export const GEAR_RARITY_BG: Record<GearRarity, string> = {
  common: 'bg-muted/30 border-border',
  uncommon: 'bg-emerald/10 border-emerald/30',
  rare: 'bg-ice/10 border-ice/30',
  epic: 'bg-game-purple/10 border-game-purple/30',
  legendary: 'bg-gold/10 border-gold/30',
};

export const GEAR_RARITY_LABEL: Record<GearRarity, string> = {
  common: 'Gewoon',
  uncommon: 'Ongewoon',
  rare: 'Zeldzaam',
  epic: 'Episch',
  legendary: 'Legendarisch',
};

export const GEAR_RARITY_STAT_MULT: Record<GearRarity, number> = {
  common: 0.8,
  uncommon: 1.0,
  rare: 1.15,
  epic: 1.3,
  legendary: 1.5,
};

export const GEAR_RARITY_SELL_MULT: Record<GearRarity, number> = {
  common: 400,
  uncommon: 1200,
  rare: 3500,
  epic: 8000,
  legendary: 20000,
};

// ========== GENERATION ==========

function rollGearRarity(level: number, lootRarity?: LootRarity): GearRarity {
  const r = Math.random();
  const levelBonus = Math.min(level * 0.02, 0.2);

  if (lootRarity === 'epic') {
    if (r < 0.15 + levelBonus) return 'legendary';
    if (r < 0.5) return 'epic';
    return 'rare';
  }
  if (lootRarity === 'rare') {
    if (r < 0.05 + levelBonus) return 'legendary';
    if (r < 0.25) return 'epic';
    return 'rare';
  }

  if (r < 0.02 + levelBonus * 0.5) return 'legendary';
  if (r < 0.08 + levelBonus) return 'epic';
  if (r < 0.22 + levelBonus) return 'rare';
  if (r < 0.50) return 'uncommon';
  return 'common';
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let gearIdCounter = 0;

export function generateGear(level: number, type: GearType, forcedRarity?: GearRarity, lootRarity?: LootRarity): GeneratedGear {
  const brand = pickRandom(GEAR_BRANDS);
  const frames = type === 'armor' ? ARMOR_FRAMES : GADGET_FRAMES;
  const frame = pickRandom(frames);
  const mod = Math.random() < 0.6
    ? pickRandom(GEAR_MODS.filter(m => m.id !== 'geen'))
    : GEAR_MODS[0];

  const rarity = forcedRarity || rollGearRarity(level, lootRarity);
  const mult = GEAR_RARITY_STAT_MULT[rarity];
  const levelScale = 1 + level * 0.08;

  const rawDefense = (frame.baseDefense + mod.defenseBonus) * brand.defenseMult * mult * levelScale;
  const rawBrains = (frame.baseBrains + mod.brainsBonus) * brand.brainsMult * mult * levelScale;
  const rawCharm = frame.baseCharm * brand.charmMult * mult * levelScale;
  const rawHP = Math.floor(frame.baseHP * mult * levelScale);

  const defense = Math.max(0, Math.round(rawDefense));
  const brains = Math.max(0, Math.round(rawBrains));
  const charm = Math.max(0, Math.round(rawCharm));
  const bonusHP = Math.max(0, rawHP);

  const modSuffix = mod.id !== 'geen' ? ` ${mod.name}` : '';
  const name = `${brand.name} ${frame.name}${modSuffix}`;

  const sellValue = Math.floor(GEAR_RARITY_SELL_MULT[rarity] * levelScale);

  gearIdCounter++;
  return {
    id: `gear_${Date.now()}_${gearIdCounter}`,
    name,
    type,
    brand: brand.id,
    frame: frame.id,
    mod: mod.id,
    rarity,
    defense,
    brains,
    charm,
    bonusHP,
    specialEffect: mod.specialEffect,
    level,
    sellValue,
    equipped: false,
    locked: false,
    masteryXp: 0,
  };
}

// ========== HELPERS ==========

export function getGearBrandDef(id: GearBrandId): GearBrand {
  return GEAR_BRANDS.find(b => b.id === id)!;
}

export function getGearFrameDef(id: GearFrameId): GearFrame {
  return ALL_GEAR_FRAMES.find(f => f.id === id)!;
}

export function getGearModDef(id: GearModId): GearMod {
  return GEAR_MODS.find(m => m.id === id)!;
}

export const MAX_GEAR_INVENTORY = 20;
