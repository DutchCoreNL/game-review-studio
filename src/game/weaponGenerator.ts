// ========== BORDERLANDS-STYLE PROCEDURAL WEAPON SYSTEM ==========

import type { LootRarity } from './combatLoot';

// ========== TYPES ==========

export type WeaponRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type BrandId = 'noxforge' | 'serpiente' | 'volkov' | 'shadowtech' | 'ironjaw' | 'krakeel' | 'phantom' | 'drakon';
export type FrameId = 'pistol' | 'smg' | 'shotgun' | 'rifle' | 'blade' | 'lmg' | 'launcher';
export type BarrelId = 'kort' | 'standaard' | 'lang' | 'precisie' | 'gedempt' | 'dubbel' | 'plasma';
export type MagazineId = 'klein' | 'standaard' | 'uitgebreid' | 'drum' | 'speciaal' | 'belt' | 'cassette';
export type AccessoryId = 'geen' | 'laser' | 'silencer' | 'incendiary' | 'shock' | 'cryo' | 'toxic';

export interface WeaponBrand {
  id: BrandId;
  name: string;
  icon: string;
  color: string; // tailwind color class
  bonus: string;
  damageMult: number;
  accuracyMult: number;
  fireRateMult: number;
  clipMult: number;
  critBonus: number;
  armorPierce: number;
}

export interface WeaponFrame {
  id: FrameId;
  name: string;
  icon: string;
  baseDamage: number;
  baseAccuracy: number;
  baseFireRate: number;
  baseClip: number;
  isMelee: boolean;
}

export interface WeaponBarrel {
  id: BarrelId;
  name: string;
  damageBonus: number;
  accuracyBonus: number;
  rangeLabel: string;
}

export interface WeaponMagazine {
  id: MagazineId;
  name: string;
  clipBonus: number;
  fireRateBonus: number;
  reloadLabel: string;
}

export interface WeaponAccessory {
  id: AccessoryId;
  name: string;
  icon: string;
  effect: string;
  accuracyBonus: number;
  heatReduction: number;
  dotDamage: number; // damage over time per turn
  stunChance: number; // 0-1
}

export interface GeneratedWeapon {
  id: string;
  name: string;
  brand: BrandId;
  frame: FrameId;
  barrel: BarrelId;
  magazine: MagazineId;
  accessory: AccessoryId;
  rarity: WeaponRarity;
  // Computed stats
  damage: number;
  accuracy: number;
  fireRate: number;
  clipSize: number;
  critChance: number;
  armorPierce: number;
  specialEffect: string | null;
  // Meta
  level: number;
  sellValue: number;
  equipped: boolean;
  // New features
  locked?: boolean;
  masteryXp?: number;
  isUnique?: boolean;
  uniqueGlow?: string;
  lore?: string;
  // Arsenal enhancement features
  enchantmentId?: import('./enchantments').EnchantmentId;
  skinId?: import('./weaponSkins').SkinId;
  durability?: number; // 0-100, default 100
  challenges?: import('./weaponChallenges').WeaponChallengeProgress[];
}

// ========== COMPONENT DEFINITIONS ==========

export const WEAPON_BRANDS: WeaponBrand[] = [
  { id: 'noxforge', name: 'Noxforge', icon: '🔨', color: 'text-orange-400', bonus: '+15% schade', damageMult: 1.15, accuracyMult: 1, fireRateMult: 1, clipMult: 1, critBonus: 0, armorPierce: 0 },
  { id: 'serpiente', name: 'Serpiente Arms', icon: '🐍', color: 'text-blood', bonus: '+20% crit kans', damageMult: 1, accuracyMult: 1.05, fireRateMult: 1, clipMult: 1, critBonus: 0.2, armorPierce: 0 },
  { id: 'volkov', name: 'Volkov Industries', icon: '⚙️', color: 'text-ice', bonus: '+25% clip size', damageMult: 1, accuracyMult: 1, fireRateMult: 0.95, clipMult: 1.25, critBonus: 0, armorPierce: 0 },
  { id: 'shadowtech', name: 'ShadowTech', icon: '👁️', color: 'text-game-purple', bonus: '+10% alle stats', damageMult: 1.1, accuracyMult: 1.1, fireRateMult: 1.1, clipMult: 1.1, critBonus: 0.05, armorPierce: 0.05 },
  { id: 'ironjaw', name: 'Ironjaw', icon: '💀', color: 'text-gold', bonus: '+30% armor pierce', damageMult: 1.05, accuracyMult: 0.95, fireRateMult: 1, clipMult: 1, critBonus: 0, armorPierce: 0.3 },
  { id: 'krakeel', name: 'Krakeel', icon: '💣', color: 'text-red-500', bonus: '+20% vuursnelheid', damageMult: 0.95, accuracyMult: 0.9, fireRateMult: 1.2, clipMult: 1, critBonus: 0, armorPierce: 0.1 },
  { id: 'phantom', name: 'Phantom Corp', icon: '👻', color: 'text-slate-300', bonus: '+15% accuracy & stealth', damageMult: 0.95, accuracyMult: 1.15, fireRateMult: 1.05, clipMult: 0.9, critBonus: 0.1, armorPierce: 0 },
  { id: 'drakon', name: 'Drakon Heavy', icon: '🐉', color: 'text-amber-500', bonus: '+25% schade, -10% snelheid', damageMult: 1.25, accuracyMult: 0.9, fireRateMult: 0.9, clipMult: 1.1, critBonus: 0, armorPierce: 0.15 },
];

export const WEAPON_FRAMES: WeaponFrame[] = [
  { id: 'pistol', name: 'Pistool', icon: '🔫', baseDamage: 6, baseAccuracy: 7, baseFireRate: 6, baseClip: 12, isMelee: false },
  { id: 'smg', name: 'SMG', icon: '🔫', baseDamage: 4, baseAccuracy: 5, baseFireRate: 9, baseClip: 20, isMelee: false },
  { id: 'shotgun', name: 'Shotgun', icon: '💥', baseDamage: 12, baseAccuracy: 4, baseFireRate: 3, baseClip: 6, isMelee: false },
  { id: 'rifle', name: 'Rifle', icon: '🎯', baseDamage: 10, baseAccuracy: 9, baseFireRate: 4, baseClip: 10, isMelee: false },
  { id: 'blade', name: 'Blade', icon: '🗡️', baseDamage: 8, baseAccuracy: 8, baseFireRate: 7, baseClip: 0, isMelee: true },
  { id: 'lmg', name: 'LMG', icon: '🔫', baseDamage: 7, baseAccuracy: 3, baseFireRate: 8, baseClip: 30, isMelee: false },
  { id: 'launcher', name: 'Launcher', icon: '🚀', baseDamage: 18, baseAccuracy: 3, baseFireRate: 1, baseClip: 2, isMelee: false },
];

export const WEAPON_BARRELS: WeaponBarrel[] = [
  { id: 'kort', name: 'Korte Loop', damageBonus: -1, accuracyBonus: -2, rangeLabel: 'Kort bereik' },
  { id: 'standaard', name: 'Standaard Loop', damageBonus: 0, accuracyBonus: 0, rangeLabel: 'Normaal bereik' },
  { id: 'lang', name: 'Lange Loop', damageBonus: 2, accuracyBonus: 2, rangeLabel: 'Lang bereik' },
  { id: 'precisie', name: 'Precisie Loop', damageBonus: 1, accuracyBonus: 4, rangeLabel: 'Precisie' },
  { id: 'gedempt', name: 'Gedempte Loop', damageBonus: -1, accuracyBonus: 1, rangeLabel: 'Stil' },
  { id: 'dubbel', name: 'Dubbele Loop', damageBonus: 4, accuracyBonus: -3, rangeLabel: 'Dubbel vuur' },
  { id: 'plasma', name: 'Plasma Loop', damageBonus: 3, accuracyBonus: 1, rangeLabel: 'Energie' },
];

export const WEAPON_MAGAZINES: WeaponMagazine[] = [
  { id: 'klein', name: 'Klein Magazijn', clipBonus: -4, fireRateBonus: 2, reloadLabel: 'Snelle herlaad' },
  { id: 'standaard', name: 'Standaard Magazijn', clipBonus: 0, fireRateBonus: 0, reloadLabel: 'Normaal' },
  { id: 'uitgebreid', name: 'Uitgebreid Magazijn', clipBonus: 6, fireRateBonus: -1, reloadLabel: 'Langzame herlaad' },
  { id: 'drum', name: 'Drum Magazijn', clipBonus: 12, fireRateBonus: -2, reloadLabel: 'Zware herlaad' },
  { id: 'speciaal', name: 'Speciaal Magazijn', clipBonus: 3, fireRateBonus: 1, reloadLabel: 'Snelle feed' },
  { id: 'belt', name: 'Belt Feed', clipBonus: 20, fireRateBonus: -3, reloadLabel: 'Belt herlaad' },
  { id: 'cassette', name: 'Cassette Mag', clipBonus: 8, fireRateBonus: 2, reloadLabel: 'Cassette feed' },
];

export const WEAPON_ACCESSORIES: WeaponAccessory[] = [
  { id: 'geen', name: 'Geen', icon: '', effect: '', accuracyBonus: 0, heatReduction: 0, dotDamage: 0, stunChance: 0 },
  { id: 'laser', name: 'Laser Sight', icon: '🔴', effect: '+3 accuracy', accuracyBonus: 3, heatReduction: 0, dotDamage: 0, stunChance: 0 },
  { id: 'silencer', name: 'Silencer', icon: '🤫', effect: '-3 heat per gevecht', accuracyBonus: 0, heatReduction: 3, dotDamage: 0, stunChance: 0 },
  { id: 'incendiary', name: 'Incendiary', icon: '🔥', effect: '+2 DoT/beurt', accuracyBonus: 0, heatReduction: 0, dotDamage: 2, stunChance: 0 },
  { id: 'shock', name: 'Shock', icon: '⚡', effect: '15% stun kans', accuracyBonus: 0, heatReduction: 0, dotDamage: 0, stunChance: 0.15 },
  { id: 'cryo', name: 'Cryo Module', icon: '❄️', effect: '12% slow + 1 DoT', accuracyBonus: 0, heatReduction: 0, dotDamage: 1, stunChance: 0.12 },
  { id: 'toxic', name: 'Toxic Rounds', icon: '☠️', effect: '+3 DoT/beurt (gif)', accuracyBonus: 0, heatReduction: 0, dotDamage: 3, stunChance: 0 },
];

// ========== RARITY ==========

export const WEAPON_RARITY_COLORS: Record<WeaponRarity, string> = {
  common: 'text-muted-foreground',
  uncommon: 'text-emerald',
  rare: 'text-ice',
  epic: 'text-game-purple',
  legendary: 'text-gold',
};

export const WEAPON_RARITY_BG: Record<WeaponRarity, string> = {
  common: 'bg-muted/30 border-border',
  uncommon: 'bg-emerald/10 border-emerald/30',
  rare: 'bg-ice/10 border-ice/30',
  epic: 'bg-game-purple/10 border-game-purple/30',
  legendary: 'bg-gold/10 border-gold/30',
};

export const WEAPON_RARITY_LABEL: Record<WeaponRarity, string> = {
  common: 'Gewoon',
  uncommon: 'Ongewoon',
  rare: 'Zeldzaam',
  epic: 'Episch',
  legendary: 'Legendarisch',
};

export const RARITY_STAT_MULT: Record<WeaponRarity, number> = {
  common: 0.8,
  uncommon: 1.0,
  rare: 1.15,
  epic: 1.3,
  legendary: 1.5,
};

export const RARITY_SELL_MULT: Record<WeaponRarity, number> = {
  common: 500,
  uncommon: 1500,
  rare: 4000,
  epic: 10000,
  legendary: 25000,
};

// ========== GENERATION ==========

function rollRarity(level: number, lootRarity?: LootRarity): WeaponRarity {
  const r = Math.random();
  const levelBonus = Math.min(level * 0.02, 0.2); // up to 20% boost at level 10

  // If coming from combat loot, use the loot rarity as a floor
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

  // Standard roll
  if (r < 0.02 + levelBonus * 0.5) return 'legendary';
  if (r < 0.08 + levelBonus) return 'epic';
  if (r < 0.22 + levelBonus) return 'rare';
  if (r < 0.50) return 'uncommon';
  return 'common';
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let weaponIdCounter = 0;

export function generateWeapon(level: number, forcedRarity?: WeaponRarity, lootRarity?: LootRarity): GeneratedWeapon {
  const brand = pickRandom(WEAPON_BRANDS);
  const frame = pickRandom(WEAPON_FRAMES);
  const barrel = pickRandom(WEAPON_BARRELS);
  const magazine = frame.isMelee ? WEAPON_MAGAZINES[1] : pickRandom(WEAPON_MAGAZINES); // blades get standard mag
  // Accessories: 60% chance of having one
  const accessory = Math.random() < 0.6
    ? pickRandom(WEAPON_ACCESSORIES.filter(a => a.id !== 'geen'))
    : WEAPON_ACCESSORIES[0];

  const rarity = forcedRarity || rollRarity(level, lootRarity);
  const mult = RARITY_STAT_MULT[rarity];
  const levelScale = 1 + level * 0.08; // 8% more per level

  // Calculate stats
  const rawDamage = (frame.baseDamage + barrel.damageBonus) * brand.damageMult * mult * levelScale;
  const rawAccuracy = (frame.baseAccuracy + barrel.accuracyBonus + accessory.accuracyBonus) * brand.accuracyMult * mult;
  const rawFireRate = (frame.baseFireRate + magazine.fireRateBonus) * brand.fireRateMult * mult;
  const rawClip = frame.isMelee ? 0 : Math.floor((frame.baseClip + magazine.clipBonus) * brand.clipMult * mult);

  const damage = Math.max(1, Math.round(rawDamage));
  const accuracy = Math.min(10, Math.max(1, Math.round(rawAccuracy)));
  const fireRate = Math.min(10, Math.max(1, Math.round(rawFireRate)));
  const clipSize = Math.max(0, rawClip);
  const critChance = Math.round((5 + brand.critBonus * 100) * mult);
  const armorPierce = Math.round(brand.armorPierce * 100 * mult);

  // Build name
  const accessorySuffix = accessory.id !== 'geen' ? ` ${accessory.name}` : '';
  const name = `${brand.name} ${frame.name}${accessorySuffix}`;

  // Special effect text
  let specialEffect: string | null = null;
  if (accessory.id === 'cryo') specialEffect = `❄️ ${Math.round(accessory.stunChance * 100)}% slow + ${accessory.dotDamage} cryo/beurt`;
  else if (accessory.id === 'toxic') specialEffect = `☠️ ${accessory.dotDamage} gif schade/beurt`;
  else if (accessory.dotDamage > 0) specialEffect = `🔥 ${accessory.dotDamage} brand schade/beurt`;
  else if (accessory.stunChance > 0) specialEffect = `⚡ ${Math.round(accessory.stunChance * 100)}% stun kans`;
  else if (accessory.heatReduction > 0) specialEffect = `🤫 -${accessory.heatReduction} heat per gevecht`;
  else if (accessory.accuracyBonus > 0) specialEffect = `🔴 +${accessory.accuracyBonus} accuracy`;

  const sellValue = Math.floor(RARITY_SELL_MULT[rarity] * levelScale);

  weaponIdCounter++;
  return {
    id: `wpn_${Date.now()}_${weaponIdCounter}`,
    name,
    brand: brand.id,
    frame: frame.id,
    barrel: barrel.id,
    magazine: magazine.id,
    accessory: accessory.id,
    rarity,
    damage,
    accuracy,
    fireRate,
    clipSize,
    critChance,
    armorPierce,
    specialEffect,
    level,
    sellValue,
    equipped: false,
  };
}

// ========== HELPERS ==========

export function getBrandDef(id: BrandId): WeaponBrand {
  return WEAPON_BRANDS.find(b => b.id === id)!;
}

export function getFrameDef(id: FrameId): WeaponFrame {
  return WEAPON_FRAMES.find(f => f.id === id)!;
}

export function getWeaponDamageBonus(weapon: GeneratedWeapon): number {
  // Convert weapon damage to a muscle-equivalent stat bonus
  return Math.floor(weapon.damage * 0.6);
}

export const MAX_WEAPON_INVENTORY = 20;
