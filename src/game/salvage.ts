// ========== SALVAGE / CRAFTING SYSTEEM — ONTMANTELEN & CRAFTING ==========

import { generateWeapon, type GeneratedWeapon, type WeaponRarity } from './weaponGenerator';
import { generateGear, type GeneratedGear, type GearRarity, type GearType } from './gearGenerator';

// ========== SCRAP VALUES ==========

export const SCRAP_VALUES: Record<WeaponRarity, number> = {
  common: 1,
  uncommon: 3,
  rare: 8,
  epic: 20,
  legendary: 50,
};

// ========== CRAFTING RECIPES ==========

export type CraftTargetType = 'random_weapon' | 'random_armor' | 'random_gadget' | 'choose_type';

export interface CraftRecipe {
  id: string;
  name: string;
  icon: string;
  scrapCost: number;
  targetType: CraftTargetType;
  guaranteedRarity: WeaponRarity;
  description: string;
}

export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'craft_rare_random',
    name: 'Rare Fabricatie',
    icon: '🔧',
    scrapCost: 15,
    targetType: 'random_weapon',
    guaranteedRarity: 'rare',
    description: 'Smelt 15 scrap om tot een willekeurig rare wapen of gear.',
  },
  {
    id: 'craft_epic_random',
    name: 'Epic Fabricatie',
    icon: '⚙️',
    scrapCost: 40,
    targetType: 'random_weapon',
    guaranteedRarity: 'epic',
    description: 'Smelt 40 scrap om tot een willekeurig epic wapen of gear.',
  },
  {
    id: 'craft_epic_weapon',
    name: 'Epic Wapen (Keuze)',
    icon: '🗡️',
    scrapCost: 100,
    targetType: 'random_weapon',
    guaranteedRarity: 'epic',
    description: 'Kies wapen type. Gegarandeerd epic of beter.',
  },
  {
    id: 'craft_epic_armor',
    name: 'Epic Pantser (Keuze)',
    icon: '🛡️',
    scrapCost: 100,
    targetType: 'random_armor',
    guaranteedRarity: 'epic',
    description: 'Craft een gegarandeerd epic+ pantser.',
  },
  {
    id: 'craft_epic_gadget',
    name: 'Epic Gadget (Keuze)',
    icon: '📱',
    scrapCost: 100,
    targetType: 'random_gadget',
    guaranteedRarity: 'epic',
    description: 'Craft een gegarandeerd epic+ gadget.',
  },
];

// ========== SALVAGE FUNCTIONS ==========

/** Calculate scrap from salvaging a weapon */
export function getWeaponScrapValue(weapon: GeneratedWeapon): number {
  return SCRAP_VALUES[weapon.rarity] || 1;
}

/** Calculate scrap from salvaging gear */
export function getGearScrapValue(gear: GeneratedGear): number {
  return SCRAP_VALUES[gear.rarity as WeaponRarity] || 1;
}

// ========== CRAFTING FUNCTIONS ==========

export interface CraftResult {
  weapon?: GeneratedWeapon;
  gear?: GeneratedGear;
  recipe: CraftRecipe;
}

/** Execute a craft recipe */
export function executeCraft(recipeId: string, playerLevel: number): CraftResult | null {
  const recipe = CRAFT_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return null;

  // For "random" recipes, 50/50 weapon vs gear
  // For typed recipes, specific type
  const result: CraftResult = { recipe };

  // Small chance to roll legendary when crafting epic
  const rarity = recipe.guaranteedRarity === 'epic' && Math.random() < 0.12
    ? 'legendary' as const
    : recipe.guaranteedRarity;

  switch (recipe.targetType) {
    case 'random_weapon': {
      if (recipeId === 'craft_rare_random' || recipeId === 'craft_epic_random') {
        // 50/50 weapon vs gear
        if (Math.random() < 0.5) {
          result.weapon = generateWeapon(playerLevel, rarity);
        } else {
          const gearType: GearType = Math.random() < 0.5 ? 'armor' : 'gadget';
          result.gear = generateGear(playerLevel, gearType, rarity as GearRarity);
        }
      } else {
        result.weapon = generateWeapon(playerLevel, rarity);
      }
      break;
    }
    case 'random_armor':
      result.gear = generateGear(playerLevel, 'armor', rarity as GearRarity);
      break;
    case 'random_gadget':
      result.gear = generateGear(playerLevel, 'gadget', rarity as GearRarity);
      break;
  }

  return result;
}
