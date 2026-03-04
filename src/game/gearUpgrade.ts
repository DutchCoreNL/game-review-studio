// ========== GEAR UPGRADE, FUSION & MASTERY SYSTEM ==========

import { GeneratedGear, GearRarity, GearModId, GEAR_MODS, GEAR_BRANDS, ALL_GEAR_FRAMES, GEAR_RARITY_STAT_MULT, GEAR_RARITY_SELL_MULT, generateGear } from './gearGenerator';

// ========== UPGRADE ==========

const GEAR_UPGRADE_COST_BASE: Record<GearRarity, number> = {
  common: 600,
  uncommon: 1500,
  rare: 4000,
  epic: 10000,
  legendary: 25000,
};

export function getGearUpgradeCost(gear: GeneratedGear): number {
  return Math.floor(GEAR_UPGRADE_COST_BASE[gear.rarity] * (1 + gear.level * 0.3));
}

export function canUpgradeGear(gear: GeneratedGear, money: number): { canUpgrade: boolean; cost: number; reason?: string } {
  const cost = getGearUpgradeCost(gear);
  if (gear.level >= 15) return { canUpgrade: false, cost, reason: 'Max level bereikt' };
  if (money < cost) return { canUpgrade: false, cost, reason: 'Niet genoeg geld' };
  return { canUpgrade: true, cost };
}

export function upgradeGear(gear: GeneratedGear): GeneratedGear {
  const newLevel = gear.level + 1;
  const brand = GEAR_BRANDS.find(b => b.id === gear.brand)!;
  const frame = ALL_GEAR_FRAMES.find(f => f.id === gear.frame)!;
  const mod = GEAR_MODS.find(m => m.id === gear.mod)!;

  const mult = GEAR_RARITY_STAT_MULT[gear.rarity];
  const levelScale = 1 + newLevel * 0.08;

  const rawDefense = (frame.baseDefense + mod.defenseBonus) * brand.defenseMult * mult * levelScale;
  const rawBrains = (frame.baseBrains + mod.brainsBonus) * brand.brainsMult * mult * levelScale;
  const rawCharm = frame.baseCharm * brand.charmMult * mult * levelScale;
  const rawHP = Math.floor(frame.baseHP * mult * levelScale);

  return {
    ...gear,
    level: newLevel,
    defense: Math.max(0, Math.round(rawDefense)),
    brains: Math.max(0, Math.round(rawBrains)),
    charm: Math.max(0, Math.round(rawCharm)),
    bonusHP: Math.max(0, rawHP),
    sellValue: Math.floor(GEAR_RARITY_SELL_MULT[gear.rarity] * levelScale),
  };
}

// ========== MOD SWAP ==========

const GEAR_MOD_SWAP_COST = 2500;

export function getGearModSwapCost(): number {
  return GEAR_MOD_SWAP_COST;
}

export function getAvailableMods(currentMod: GearModId): { id: GearModId; name: string; icon: string; effect: string }[] {
  return GEAR_MODS.filter(m => m.id !== currentMod && m.id !== 'geen').map(m => ({
    id: m.id, name: m.name, icon: m.icon, effect: m.effect,
  }));
}

export function swapGearMod(gear: GeneratedGear, newModId: GearModId): GeneratedGear {
  const mod = GEAR_MODS.find(m => m.id === newModId)!;
  const oldMod = GEAR_MODS.find(m => m.id === gear.mod)!;
  const brand = GEAR_BRANDS.find(b => b.id === gear.brand)!;
  const frame = ALL_GEAR_FRAMES.find(f => f.id === gear.frame)!;
  const mult = GEAR_RARITY_STAT_MULT[gear.rarity];
  const levelScale = 1 + gear.level * 0.08;

  const rawDefense = (frame.baseDefense + mod.defenseBonus) * brand.defenseMult * mult * levelScale;
  const rawBrains = (frame.baseBrains + mod.brainsBonus) * brand.brainsMult * mult * levelScale;

  const baseName = gear.name.replace(` ${oldMod.name}`, '').replace(` ${mod.name}`, '');
  const newName = mod.id !== 'geen' ? `${baseName} ${mod.name}` : baseName;

  return {
    ...gear,
    mod: newModId,
    defense: Math.max(0, Math.round(rawDefense)),
    brains: Math.max(0, Math.round(rawBrains)),
    specialEffect: mod.specialEffect,
    name: newName,
  };
}

// ========== FUSION ==========

const GEAR_FUSION_RARITY_MAP: Record<GearRarity, GearRarity | null> = {
  common: 'uncommon',
  uncommon: 'rare',
  rare: 'epic',
  epic: 'legendary',
  legendary: null,
};

const GEAR_FUSION_COST: Record<GearRarity, number> = {
  common: 800,
  uncommon: 2500,
  rare: 7000,
  epic: 18000,
  legendary: 0,
};

export function canFuseGear(gears: GeneratedGear[], money: number): { canFuse: boolean; cost: number; targetRarity: GearRarity | null; reason?: string } {
  if (gears.length !== 3) return { canFuse: false, cost: 0, targetRarity: null, reason: 'Selecteer exact 3 gear items' };
  const rarity = gears[0].rarity;
  const gearType = gears[0].type;
  if (!gears.every(g => g.rarity === rarity)) return { canFuse: false, cost: 0, targetRarity: null, reason: 'Alle gear moet dezelfde rarity hebben' };
  if (!gears.every(g => g.type === gearType)) return { canFuse: false, cost: 0, targetRarity: null, reason: 'Alle gear moet hetzelfde type zijn' };
  if (gears.some(g => g.equipped)) return { canFuse: false, cost: 0, targetRarity: null, reason: 'Kan uitgeruste gear niet fuseren' };
  if (gears.some(g => g.locked)) return { canFuse: false, cost: 0, targetRarity: null, reason: 'Kan gelocked gear niet fuseren' };
  const targetRarity = GEAR_FUSION_RARITY_MAP[rarity];
  if (!targetRarity) return { canFuse: false, cost: 0, targetRarity: null, reason: 'Legendarische gear kan niet gefuseerd worden' };
  const cost = GEAR_FUSION_COST[rarity];
  if (money < cost) return { canFuse: false, cost, targetRarity, reason: 'Niet genoeg geld' };
  return { canFuse: true, cost, targetRarity };
}

export function fuseGear(gears: GeneratedGear[], playerLevel: number): GeneratedGear {
  const rarity = gears[0].rarity;
  const gearType = gears[0].type;
  const targetRarity = GEAR_FUSION_RARITY_MAP[rarity]!;
  const avgLevel = Math.round(gears.reduce((s, g) => s + g.level, 0) / gears.length);
  return generateGear(Math.max(avgLevel, playerLevel), gearType, targetRarity);
}

// ========== MASTERY ==========

export const GEAR_MASTERY_XP_PER_LEVEL = [0, 40, 120, 300, 600, 1000];
export const GEAR_MASTERY_STAT_BONUS = 0.02;
export const GEAR_MAX_MASTERY = 5;

const GEAR_MASTERY_TITLES: Record<string, string[]> = {
  vest: ['Schilddrager', 'Kogelvrij', 'Tank', 'Bastion', 'Onkwetsbaar'],
  jacket: ['Stijlvol', 'Gepantserd Chic', 'Straatridder', 'Schaduwprins', 'Mode Legende'],
  exosuit: ['Piloot', 'Titanium Kern', 'Mech Warrior', 'Exo Veteraan', 'Iron Legende'],
  shield: ['Bewaker', 'Barrière', 'Energiekern', 'Schild Meester', 'Aegis Legende'],
  cloak: ['Sluiper', 'Schaduw', 'Fantoom', 'Nachtschim', 'Onzichtbaar'],
  phone: ['Beller', 'Informant', 'Netwerker', 'Spymaster', 'Telefoon Legende'],
  deck: ['Scriptkiddy', 'Hacker', 'Codebreker', 'Cybergeest', 'Deck Meester'],
  implant: ['Verbeterd', 'Cyborg', 'Transhumaan', 'Neuraal Genie', 'Implant Legende'],
  drone: ['Piloot', 'Verkenner', 'Drone Oog', 'Luchtmacht', 'Drone Meester'],
  scanner: ['Spotter', 'Analist', 'Scanner Pro', 'Datamaster', 'Scanner Legende'],
};

export function getGearMasteryTitle(frame: string, level: number): string | null {
  if (level < 1 || level > 5) return null;
  return GEAR_MASTERY_TITLES[frame]?.[level - 1] || null;
}

export function getGearMasteryLevel(xp: number): number {
  for (let i = GEAR_MASTERY_XP_PER_LEVEL.length - 1; i >= 0; i--) {
    if (xp >= GEAR_MASTERY_XP_PER_LEVEL[i]) return i;
  }
  return 0;
}

export function getGearMasteryProgress(xp: number): { level: number; currentXp: number; nextXp: number; progress: number } {
  const level = getGearMasteryLevel(xp);
  if (level >= GEAR_MAX_MASTERY) return { level, currentXp: xp, nextXp: GEAR_MASTERY_XP_PER_LEVEL[GEAR_MAX_MASTERY], progress: 1 };
  const current = GEAR_MASTERY_XP_PER_LEVEL[level];
  const next = GEAR_MASTERY_XP_PER_LEVEL[level + 1];
  return { level, currentXp: xp, nextXp: next, progress: (xp - current) / (next - current) };
}

export function getEffectiveGearStats(gear: GeneratedGear): { defense: number; brains: number; charm: number; bonusHP: number } {
  const masteryLevel = getGearMasteryLevel(gear.masteryXp || 0);
  const bonus = 1 + masteryLevel * GEAR_MASTERY_STAT_BONUS;
  return {
    defense: Math.round(gear.defense * bonus),
    brains: Math.round(gear.brains * bonus),
    charm: Math.round(gear.charm * bonus),
    bonusHP: Math.round(gear.bonusHP * bonus),
  };
}

// ========== BULK SELL ==========

export function getGearBelowRarity(gears: GeneratedGear[], maxRarity: GearRarity): GeneratedGear[] {
  const order: Record<GearRarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
  const threshold = order[maxRarity];
  return gears.filter(g => !g.equipped && !g.locked && order[g.rarity] <= threshold);
}

export function getGearBulkSellValue(gears: GeneratedGear[]): number {
  return gears.reduce((sum, g) => sum + g.sellValue, 0);
}
