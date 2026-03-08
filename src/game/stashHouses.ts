// ========== STASH HOUSES — Underground Storage System ==========

import { DistrictId, GoodId } from './types';

export interface StashHouse {
  id: string;
  district: DistrictId;
  capacity: number; // max total units
  storedGoods: Partial<Record<GoodId, number>>;
  discovered: boolean;
  discoveredDay: number | null;
  level: number; // 1-3
  createdDay: number;
}

export function createStashHouse(district: DistrictId, safehouseLevel: number, day: number): StashHouse {
  const capacity = 20 + safehouseLevel * 15; // 35, 50, 65
  return {
    id: `stash_${district}_${Date.now()}`,
    district,
    capacity,
    storedGoods: {},
    discovered: false,
    discoveredDay: null,
    level: 1,
    createdDay: day,
  };
}

export function getStashUsed(stash: StashHouse): number {
  return Object.values(stash.storedGoods).reduce((sum, q) => sum + (q || 0), 0);
}

export function getStashRemaining(stash: StashHouse): number {
  return stash.capacity - getStashUsed(stash);
}

export function getDiscoveryChance(heat: number, personalHeat: number, stashLevel: number): number {
  const baseChance = 0.02;
  const heatPenalty = (heat + personalHeat) / 600;
  const levelReduction = (stashLevel - 1) * 0.015;
  return Math.min(0.25, Math.max(0.005, baseChance + heatPenalty - levelReduction));
}

export function getStashUpgradeCost(currentLevel: number): number {
  return [0, 10000, 25000][currentLevel - 1] || 999999;
}

export function getStashPurchaseCost(district: DistrictId): number {
  const costs: Record<DistrictId, number> = {
    port: 8000,
    crown: 15000,
    iron: 10000,
    low: 6000,
    neon: 12000,
  };
  return costs[district] || 10000;
}

/** Process daily discovery check for all stash houses */
export function processStashDiscovery(
  stashes: StashHouse[],
  heat: number,
  personalHeat: number,
  day: number,
): { updatedStashes: StashHouse[]; discoveredDistricts: DistrictId[]; confiscatedValue: number } {
  const discovered: DistrictId[] = [];
  let confiscatedValue = 0;

  const updated = stashes.map(stash => {
    if (stash.discovered) return stash;
    const used = getStashUsed(stash);
    if (used === 0) return stash; // empty stashes can't be found

    const chance = getDiscoveryChance(heat, personalHeat, stash.level);
    if (Math.random() < chance) {
      discovered.push(stash.district);
      confiscatedValue += used * 500; // rough value estimate
      return {
        ...stash,
        discovered: true,
        discoveredDay: day,
        storedGoods: {}, // confiscated
      };
    }
    return stash;
  });

  return { updatedStashes: updated, discoveredDistricts: discovered, confiscatedValue };
}
