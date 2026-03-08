// ========== BLUEPRINT / RECIPE SYSTEM ==========
// Blueprints specify exact item outcomes for targeted crafting

import type { BrandId, FrameId, WeaponRarity } from './weaponGenerator';
import type { GearBrandId, GearFrameId, GearRarity, GearType } from './gearGenerator';
import { generateWeapon, WEAPON_BRANDS, WEAPON_FRAMES } from './weaponGenerator';
import { generateGear, GEAR_BRANDS, ALL_GEAR_FRAMES } from './gearGenerator';

// ========== TYPES ==========

export interface BlueprintDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: 'weapon' | 'armor' | 'gadget';
  // Constraints on what gets generated
  brandId?: BrandId | GearBrandId;
  frameId?: FrameId | GearFrameId;
  guaranteedRarity: WeaponRarity;
  // Costs
  scrapCost: number;
  moneyCost: number;
  // Source info (for UI)
  source: string;
}

export interface BlueprintItem {
  id: string;        // unique instance
  blueprintId: string;
  acquiredDay: number;
}

// ========== BLUEPRINT DEFINITIONS ==========

export const BLUEPRINTS: BlueprintDef[] = [
  // Weapon blueprints
  {
    id: 'bp_noxforge_rifle',
    name: 'Noxforge Rifle Schema',
    icon: '📐',
    description: 'Craft een gegarandeerd epic+ Noxforge Rifle',
    type: 'weapon',
    brandId: 'noxforge',
    frameId: 'rifle',
    guaranteedRarity: 'epic',
    scrapCost: 60,
    moneyCost: 15000,
    source: 'Campaign Chapter 5+',
  },
  {
    id: 'bp_drakon_lmg',
    name: 'Drakon LMG Blauwdruk',
    icon: '📐',
    description: 'Craft een gegarandeerd epic+ Drakon LMG',
    type: 'weapon',
    brandId: 'drakon',
    frameId: 'lmg',
    guaranteedRarity: 'epic',
    scrapCost: 70,
    moneyCost: 18000,
    source: 'Boss drops',
  },
  {
    id: 'bp_phantom_blade',
    name: 'Phantom Blade Schema',
    icon: '📐',
    description: 'Craft een gegarandeerd epic+ Phantom Blade',
    type: 'weapon',
    brandId: 'phantom',
    frameId: 'blade',
    guaranteedRarity: 'epic',
    scrapCost: 55,
    moneyCost: 14000,
    source: 'Zwarte Markt (zeldzaam)',
  },
  {
    id: 'bp_serpiente_shotgun',
    name: 'Serpiente Shotgun Schema',
    icon: '📐',
    description: 'Craft een gegarandeerd epic+ Serpiente Shotgun',
    type: 'weapon',
    brandId: 'serpiente',
    frameId: 'shotgun',
    guaranteedRarity: 'epic',
    scrapCost: 65,
    moneyCost: 16000,
    source: 'Story Arc beloning',
  },
  {
    id: 'bp_krakeel_smg',
    name: 'Krakeel SMG Blauwdruk',
    icon: '📐',
    description: 'Craft een gegarandeerd rare+ Krakeel SMG',
    type: 'weapon',
    brandId: 'krakeel',
    frameId: 'smg',
    guaranteedRarity: 'rare',
    scrapCost: 30,
    moneyCost: 8000,
    source: 'District verhalen',
  },
  // Armor blueprints
  {
    id: 'bp_aegis_exosuit',
    name: 'Aegis Exo-Suit Schema',
    icon: '📋',
    description: 'Craft een gegarandeerd epic+ Aegis Exo-Suit',
    type: 'armor',
    brandId: 'aegis',
    frameId: 'exosuit',
    guaranteedRarity: 'epic',
    scrapCost: 60,
    moneyCost: 15000,
    source: 'Campaign Chapter 7+',
  },
  {
    id: 'bp_titanweave_shield',
    name: 'TitanWeave Schild Schema',
    icon: '📋',
    description: 'Craft een gegarandeerd epic+ TitanWeave Schild',
    type: 'armor',
    brandId: 'titanweave',
    frameId: 'shield',
    guaranteedRarity: 'epic',
    scrapCost: 65,
    moneyCost: 16000,
    source: 'Gang arc milestones',
  },
  // Gadget blueprints
  {
    id: 'bp_neurox_implant',
    name: 'NeuroX Implant Schema',
    icon: '📋',
    description: 'Craft een gegarandeerd epic+ NeuroX Implant',
    type: 'gadget',
    brandId: 'neurox',
    frameId: 'implant',
    guaranteedRarity: 'epic',
    scrapCost: 60,
    moneyCost: 15000,
    source: 'Boss drops (zeldzaam)',
  },
  {
    id: 'bp_ciphertech_deck',
    name: 'CipherTech Deck Schema',
    icon: '📋',
    description: 'Craft een gegarandeerd rare+ CipherTech Deck',
    type: 'gadget',
    brandId: 'ciphertech',
    frameId: 'deck',
    guaranteedRarity: 'rare',
    scrapCost: 35,
    moneyCost: 9000,
    source: 'Zwarte Markt (zeldzaam)',
  },
];

// ========== FUNCTIONS ==========

export function getBlueprintDef(id: string): BlueprintDef | undefined {
  return BLUEPRINTS.find(b => b.id === id);
}

let bpIdCounter = 0;
export function createBlueprintItem(blueprintId: string, day: number): BlueprintItem {
  bpIdCounter++;
  return {
    id: `bpi_${Date.now()}_${bpIdCounter}`,
    blueprintId,
    acquiredDay: day,
  };
}

/** Roll a random blueprint drop (used by bosses, story arcs, etc.) */
export function rollBlueprintDrop(playerLevel: number): BlueprintDef | null {
  // 15% base chance, scales with level
  const chance = 0.15 + Math.min(playerLevel * 0.01, 0.15);
  if (Math.random() > chance) return null;

  return BLUEPRINTS[Math.floor(Math.random() * BLUEPRINTS.length)];
}

/** Execute blueprint craft — generates the specific item */
export function craftFromBlueprint(blueprint: BlueprintDef, playerLevel: number) {
  // Small chance to upgrade to legendary
  const rarity = blueprint.guaranteedRarity === 'epic' && Math.random() < 0.15
    ? 'legendary' as const
    : blueprint.guaranteedRarity;

  if (blueprint.type === 'weapon') {
    // Generate weapon, then force brand + frame
    const wpn = generateWeapon(playerLevel, rarity);
    // Override brand and frame if specified
    const brand = blueprint.brandId ? WEAPON_BRANDS.find(b => b.id === blueprint.brandId) : undefined;
    const frame = blueprint.frameId ? WEAPON_FRAMES.find(f => f.id === blueprint.frameId) : undefined;

    if (brand && frame) {
      const baseName = `${brand.name} ${frame.name}`;
      return {
        type: 'weapon' as const,
        item: { ...wpn, brand: brand.id as any, frame: frame.id as any, name: baseName },
      };
    }
    return { type: 'weapon' as const, item: wpn };
  } else {
    const gearType = blueprint.type as 'armor' | 'gadget';
    const gear = generateGear(playerLevel, gearType, rarity as any);
    const brand = blueprint.brandId ? GEAR_BRANDS.find(b => b.id === blueprint.brandId) : undefined;
    const frame = blueprint.frameId ? ALL_GEAR_FRAMES.find(f => f.id === blueprint.frameId) : undefined;

    if (brand && frame) {
      const baseName = `${brand.name} ${frame.name}`;
      return {
        type: gearType,
        item: { ...gear, brand: brand.id as any, frame: frame.id as any, name: baseName },
      };
    }
    return { type: gearType, item: gear };
  }
}
