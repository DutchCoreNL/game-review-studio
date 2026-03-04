// ========== WEAPON UPGRADE, FUSION & MODDING SYSTEM ==========

import { GeneratedWeapon, WeaponRarity, AccessoryId, WEAPON_ACCESSORIES, WEAPON_BRANDS, WEAPON_FRAMES, WEAPON_BARRELS, WEAPON_MAGAZINES, RARITY_STAT_MULT, RARITY_SELL_MULT, generateWeapon } from './weaponGenerator';

// ========== UPGRADE COSTS ==========

const UPGRADE_COST_BASE: Record<WeaponRarity, number> = {
  common: 800,
  uncommon: 2000,
  rare: 5000,
  epic: 12000,
  legendary: 30000,
};

export function getUpgradeCost(weapon: GeneratedWeapon): number {
  return Math.floor(UPGRADE_COST_BASE[weapon.rarity] * (1 + weapon.level * 0.3));
}

export function canUpgradeWeapon(weapon: GeneratedWeapon, money: number): { canUpgrade: boolean; cost: number; reason?: string } {
  const cost = getUpgradeCost(weapon);
  if (weapon.level >= 15) return { canUpgrade: false, cost, reason: 'Max level bereikt' };
  if (money < cost) return { canUpgrade: false, cost, reason: 'Niet genoeg geld' };
  return { canUpgrade: true, cost };
}

export function upgradeWeapon(weapon: GeneratedWeapon): GeneratedWeapon {
  const newLevel = weapon.level + 1;
  const brand = WEAPON_BRANDS.find(b => b.id === weapon.brand)!;
  const frame = WEAPON_FRAMES.find(f => f.id === weapon.frame)!;
  const barrel = WEAPON_BARRELS.find(b => b.id === weapon.barrel)!;
  const magazine = WEAPON_MAGAZINES.find(m => m.id === weapon.magazine)!;
  const accessory = WEAPON_ACCESSORIES.find(a => a.id === weapon.accessory)!;

  const mult = RARITY_STAT_MULT[weapon.rarity];
  const levelScale = 1 + newLevel * 0.08;

  const rawDamage = (frame.baseDamage + barrel.damageBonus) * brand.damageMult * mult * levelScale;
  const rawAccuracy = (frame.baseAccuracy + barrel.accuracyBonus + accessory.accuracyBonus) * brand.accuracyMult * mult;
  const rawFireRate = (frame.baseFireRate + magazine.fireRateBonus) * brand.fireRateMult * mult;
  const rawClip = frame.isMelee ? 0 : Math.floor((frame.baseClip + magazine.clipBonus) * brand.clipMult * mult);

  return {
    ...weapon,
    level: newLevel,
    damage: Math.max(1, Math.round(rawDamage)),
    accuracy: Math.min(10, Math.max(1, Math.round(rawAccuracy))),
    fireRate: Math.min(10, Math.max(1, Math.round(rawFireRate))),
    clipSize: Math.max(0, rawClip),
    sellValue: Math.floor(RARITY_SELL_MULT[weapon.rarity] * levelScale),
  };
}

// ========== ACCESSORY SWAP ==========

const ACCESSORY_SWAP_COST = 3000;

export function getAccessorySwapCost(): number {
  return ACCESSORY_SWAP_COST;
}

export function getAvailableAccessories(currentAccessory: AccessoryId): { id: AccessoryId; name: string; icon: string; effect: string }[] {
  return WEAPON_ACCESSORIES.filter(a => a.id !== currentAccessory && a.id !== 'geen').map(a => ({
    id: a.id, name: a.name, icon: a.icon, effect: a.effect,
  }));
}

export function swapAccessory(weapon: GeneratedWeapon, newAccessoryId: AccessoryId): GeneratedWeapon {
  const accessory = WEAPON_ACCESSORIES.find(a => a.id === newAccessoryId)!;
  const oldAccessory = WEAPON_ACCESSORIES.find(a => a.id === weapon.accessory)!;
  const brand = WEAPON_BRANDS.find(b => b.id === weapon.brand)!;
  const frame = WEAPON_FRAMES.find(f => f.id === weapon.frame)!;
  const barrel = WEAPON_BARRELS.find(b => b.id === weapon.barrel)!;
  const mult = RARITY_STAT_MULT[weapon.rarity];

  // Recalculate accuracy with new accessory
  const rawAccuracy = (frame.baseAccuracy + barrel.accuracyBonus + accessory.accuracyBonus) * brand.accuracyMult * mult;

  // Build new special effect
  let specialEffect: string | null = null;
  if (accessory.id === 'cryo') specialEffect = `❄️ ${Math.round(accessory.stunChance * 100)}% slow + ${accessory.dotDamage} cryo/beurt`;
  else if (accessory.id === 'toxic') specialEffect = `☠️ ${accessory.dotDamage} gif schade/beurt`;
  else if (accessory.dotDamage > 0) specialEffect = `🔥 ${accessory.dotDamage} brand schade/beurt`;
  else if (accessory.stunChance > 0) specialEffect = `⚡ ${Math.round(accessory.stunChance * 100)}% stun kans`;
  else if (accessory.heatReduction > 0) specialEffect = `🤫 -${accessory.heatReduction} heat per gevecht`;
  else if (accessory.accuracyBonus > 0) specialEffect = `🔴 +${accessory.accuracyBonus} accuracy`;

  // Update name
  const baseName = weapon.name.replace(` ${oldAccessory.name}`, '').replace(` ${accessory.name}`, '');
  const newName = accessory.id !== 'geen' ? `${baseName} ${accessory.name}` : baseName;

  return {
    ...weapon,
    accessory: newAccessoryId,
    accuracy: Math.min(10, Math.max(1, Math.round(rawAccuracy))),
    specialEffect,
    name: newName,
  };
}

// ========== FUSION SYSTEM ==========

const FUSION_RARITY_MAP: Record<WeaponRarity, WeaponRarity | null> = {
  common: 'uncommon',
  uncommon: 'rare',
  rare: 'epic',
  epic: 'legendary',
  legendary: null, // can't fuse legendary
};

const FUSION_COST: Record<WeaponRarity, number> = {
  common: 1000,
  uncommon: 3000,
  rare: 8000,
  epic: 20000,
  legendary: 0,
};

export function canFuseWeapons(weapons: GeneratedWeapon[], money: number): { canFuse: boolean; cost: number; targetRarity: WeaponRarity | null; reason?: string } {
  if (weapons.length !== 3) return { canFuse: false, cost: 0, targetRarity: null, reason: 'Selecteer exact 3 wapens' };
  const rarity = weapons[0].rarity;
  if (!weapons.every(w => w.rarity === rarity)) return { canFuse: false, cost: 0, targetRarity: null, reason: 'Alle wapens moeten dezelfde rarity hebben' };
  if (weapons.some(w => w.equipped)) return { canFuse: false, cost: 0, targetRarity: null, reason: 'Kan uitgeruste wapens niet fuseren' };
  if (weapons.some(w => w.locked)) return { canFuse: false, cost: 0, targetRarity: null, reason: 'Kan gelocked wapens niet fuseren' };
  const targetRarity = FUSION_RARITY_MAP[rarity];
  if (!targetRarity) return { canFuse: false, cost: 0, targetRarity: null, reason: 'Legendarische wapens kunnen niet gefuseerd worden' };
  const cost = FUSION_COST[rarity];
  if (money < cost) return { canFuse: false, cost, targetRarity, reason: 'Niet genoeg geld' };
  return { canFuse: true, cost, targetRarity };
}

export function fuseWeapons(weapons: GeneratedWeapon[], playerLevel: number): GeneratedWeapon {
  const rarity = weapons[0].rarity;
  const targetRarity = FUSION_RARITY_MAP[rarity]!;
  const avgLevel = Math.round(weapons.reduce((s, w) => s + w.level, 0) / weapons.length);
  return generateWeapon(Math.max(avgLevel, playerLevel), targetRarity);
}

// ========== MASTERY SYSTEM ==========

export const MASTERY_XP_PER_LEVEL = [0, 50, 150, 350, 700, 1200]; // XP needed for each level (0-5)
export const MASTERY_STAT_BONUS_PER_LEVEL = 0.02; // +2% per mastery level
export const MAX_MASTERY_LEVEL = 5;

const MASTERY_TITLES: Record<string, string[]> = {
  pistol: ['Scherpschutter', 'Deadeye', 'Pistolero', 'Gunslinger', 'Legendaire Schutter'],
  smg: ['Spuitbus', 'Lead Storm', 'Bullet Hose', 'Ratel Koning', 'SMG Meester'],
  shotgun: ['Straat Jager', 'Buckshot', 'Devastator', 'Donderslag', 'Shotgun Legende'],
  rifle: ['Marksman', 'Scherp Oog', 'Precisieschutter', 'Ghost Shot', 'Rifle Virtuoos'],
  blade: ['Messentrekker', 'Schaduw Snijder', 'Sluipmoordenaar', 'Ronin', 'Blade Meester'],
  lmg: ['Sloopkogel', 'Vuurstorm', 'Suppressor', 'Lead Rain', 'LMG Legende'],
  launcher: ['Bomawerper', 'Explosief Expert', 'Devastator', 'Hellfire', 'Raket Legende'],
};

export function getMasteryTitle(frame: string, masteryLevel: number): string | null {
  if (masteryLevel < 1 || masteryLevel > 5) return null;
  return MASTERY_TITLES[frame]?.[masteryLevel - 1] || null;
}

export function getMasteryLevel(masteryXp: number): number {
  for (let i = MASTERY_XP_PER_LEVEL.length - 1; i >= 0; i--) {
    if (masteryXp >= MASTERY_XP_PER_LEVEL[i]) return i;
  }
  return 0;
}

export function getMasteryProgress(masteryXp: number): { level: number; currentXp: number; nextXp: number; progress: number } {
  const level = getMasteryLevel(masteryXp);
  if (level >= MAX_MASTERY_LEVEL) return { level, currentXp: masteryXp, nextXp: MASTERY_XP_PER_LEVEL[MAX_MASTERY_LEVEL], progress: 1 };
  const currentThreshold = MASTERY_XP_PER_LEVEL[level];
  const nextThreshold = MASTERY_XP_PER_LEVEL[level + 1];
  const progress = (masteryXp - currentThreshold) / (nextThreshold - currentThreshold);
  return { level, currentXp: masteryXp, nextXp: nextThreshold, progress };
}

export function getEffectiveStats(weapon: GeneratedWeapon): { damage: number; accuracy: number; fireRate: number; clipSize: number; critChance: number; armorPierce: number } {
  const masteryLevel = getMasteryLevel(weapon.masteryXp || 0);
  const bonus = 1 + masteryLevel * MASTERY_STAT_BONUS_PER_LEVEL;
  return {
    damage: Math.round(weapon.damage * bonus),
    accuracy: Math.min(10, Math.round(weapon.accuracy * bonus)),
    fireRate: Math.min(10, Math.round(weapon.fireRate * bonus)),
    clipSize: Math.round(weapon.clipSize * bonus),
    critChance: Math.round(weapon.critChance * bonus),
    armorPierce: Math.round(weapon.armorPierce * bonus),
  };
}

// ========== BULK SELL ==========

export function getWeaponsBelowRarity(weapons: GeneratedWeapon[], maxRarity: WeaponRarity): GeneratedWeapon[] {
  const rarityOrder: Record<WeaponRarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
  const threshold = rarityOrder[maxRarity];
  return weapons.filter(w => !w.equipped && !w.locked && rarityOrder[w.rarity] <= threshold);
}

export function getBulkSellValue(weapons: GeneratedWeapon[]): number {
  return weapons.reduce((sum, w) => sum + w.sellValue, 0);
}
