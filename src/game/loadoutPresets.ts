// ========== LOADOUT PRESETS SYSTEM ==========
// Save and quickly swap between full equipment configurations

import type { GeneratedWeapon } from './weaponGenerator';
import type { GeneratedGear } from './gearGenerator';

// ========== TYPES ==========

export interface LoadoutPreset {
  id: string;
  name: string;
  weaponId: string | null;    // id of weapon to equip
  armorId: string | null;     // id of armor to equip
  gadgetId: string | null;    // id of gadget to equip
  createdDay: number;
}

export const MAX_LOADOUT_PRESETS = 5;

// ========== FUNCTIONS ==========

let presetIdCounter = 0;

/** Create a new loadout preset from current equipment */
export function createLoadoutPreset(
  name: string,
  equippedWeapon: GeneratedWeapon | undefined,
  equippedArmor: GeneratedGear | undefined,
  equippedGadget: GeneratedGear | undefined,
  day: number,
): LoadoutPreset {
  presetIdCounter++;
  return {
    id: `preset_${Date.now()}_${presetIdCounter}`,
    name,
    weaponId: equippedWeapon?.id || null,
    armorId: equippedArmor?.id || null,
    gadgetId: equippedGadget?.id || null,
    createdDay: day,
  };
}

/** Check if all items in a preset still exist in inventory */
export function validatePreset(
  preset: LoadoutPreset,
  weapons: GeneratedWeapon[],
  armors: GeneratedGear[],
  gadgets: GeneratedGear[],
): { valid: boolean; missingWeapon: boolean; missingArmor: boolean; missingGadget: boolean } {
  const missingWeapon = !!preset.weaponId && !weapons.find(w => w.id === preset.weaponId);
  const missingArmor = !!preset.armorId && !armors.find(g => g.id === preset.armorId);
  const missingGadget = !!preset.gadgetId && !gadgets.find(g => g.id === preset.gadgetId);
  return {
    valid: !missingWeapon && !missingArmor && !missingGadget,
    missingWeapon,
    missingArmor,
    missingGadget,
  };
}

/** Default preset names */
export const PRESET_NAME_SUGGESTIONS = [
  'Stealth Build',
  'Tank Build',
  'DPS Build',
  'Balanced',
  'Boss Killer',
];
