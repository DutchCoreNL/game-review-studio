import { GameState, GoodId, DistrictId, FamilyId, VillaModuleId } from '../types';
import * as Engine from '../engine';
import { addPhoneMessage } from '../newFeatures';
import { VILLA_COST, VILLA_REQ_LEVEL, VILLA_REQ_REP, VILLA_UPGRADE_COSTS, VILLA_MODULES, getVaultMax, getStorageMax } from '../villa';
import { canUpgradeLab, LAB_UPGRADE_COSTS, createDrugEmpireState, shouldShowDrugEmpire, sellNoxCrystal, canAssignDealer } from '../drugEmpire';
import type { ProductionLabId, DrugTier } from '../drugEmpire';

export function handleBuyVilla(s: GameState): void {
  if (s.villa || s.money < VILLA_COST) return;
  if (s.player.level < VILLA_REQ_LEVEL || s.rep < VILLA_REQ_REP) return;
  s.money -= VILLA_COST;
  s.stats.totalSpent += VILLA_COST;
  s.villa = {
    level: 1, modules: [], prestigeModules: [], vaultMoney: 0, storedGoods: {},
    storedAmmo: 0, helipadUsedToday: false, purchaseDay: s.day, lastPartyDay: 0,
  };
  addPhoneMessage(s, 'Makelaar', '🏛️ Villa Noxhaven is nu van jou. Welkom thuis, baas.', 'info');
  Engine.checkAchievements(s);
}

export function handleUpgradeVilla(s: GameState): void {
  if (!s.villa || s.villa.level >= 3) return;
  const nextLevel = s.villa.level + 1;
  const cost = VILLA_UPGRADE_COSTS[nextLevel];
  if (!cost || s.money < cost) return;
  s.money -= cost;
  s.stats.totalSpent += cost;
  s.villa.level = nextLevel;
}

export function handleInstallVillaModule(s: GameState, moduleId: VillaModuleId): void {
  if (!s.villa) return;
  const modDef = VILLA_MODULES.find(m => m.id === moduleId);
  if (!modDef) return;
  if (s.villa.modules.includes(moduleId)) return;
  if (s.villa.level < modDef.reqLevel) return;
  if (s.money < modDef.cost) return;
  s.money -= modDef.cost;
  s.stats.totalSpent += modDef.cost;
  s.villa.modules.push(moduleId);
  s.maxInv = Engine.recalcMaxInv(s);
  Engine.checkAchievements(s);
}

export function handlePrestigeVillaModule(s: GameState, moduleId: VillaModuleId): void {
  if (!s.villa || s.villa.level < 3) return;
  if (!s.villa.modules.includes(moduleId)) return;
  if (!s.villa.prestigeModules) s.villa.prestigeModules = [];
  if (s.villa.prestigeModules.includes(moduleId)) return;
  const PRESTIGE_COSTS: Record<string, number> = {
    kluis: 50000, opslagkelder: 40000, wietplantage: 60000, coke_lab: 100000,
    synthetica_lab: 30000, crew_kwartieren: 40000, wapenkamer: 30000, commandocentrum: 80000,
    camera: 90000, server_room: 50000, zwembad: 70000, helipad: 120000, tunnel: 100000, garage_uitbreiding: 30000,
  };
  const cost = PRESTIGE_COSTS[moduleId] || 50000;
  if (s.money < cost) return;
  s.money -= cost;
  s.stats.totalSpent += cost;
  s.villa.prestigeModules.push(moduleId);
  s.maxInv = Engine.recalcMaxInv(s);
}

export function handleDepositVillaMoney(s: GameState, amount: number): void {
  if (!s.villa || !s.villa.modules.includes('kluis')) return;
  const hasPrestige = s.villa.prestigeModules?.includes('kluis') || false;
  const max = getVaultMax(s.villa.level, hasPrestige);
  const space = max - s.villa.vaultMoney;
  const dAmt = Math.min(amount, s.money, space);
  if (dAmt <= 0) return;
  s.money -= dAmt;
  s.villa.vaultMoney += dAmt;
}

export function handleWithdrawVillaMoney(s: GameState, amount: number): void {
  if (!s.villa) return;
  const wAmt = Math.min(amount, s.villa.vaultMoney);
  if (wAmt <= 0) return;
  s.villa.vaultMoney -= wAmt;
  s.money += wAmt;
}

export function handleDepositVillaGoods(s: GameState, goodId: GoodId, amount: number): void {
  if (!s.villa || !s.villa.modules.includes('opslagkelder')) return;
  const hasPrestige = s.villa.prestigeModules?.includes('opslagkelder') || false;
  const maxStorage = getStorageMax(s.villa.level, hasPrestige);
  const currentStored = Object.values(s.villa.storedGoods).reduce((a, b) => a + (b || 0), 0);
  const space = maxStorage - currentStored;
  const playerHas = s.inventory[goodId] || 0;
  const dAmt = Math.min(amount, playerHas, space);
  if (dAmt <= 0) return;
  s.inventory[goodId] = playerHas - dAmt;
  s.villa.storedGoods[goodId] = (s.villa.storedGoods[goodId] || 0) + dAmt;
}

export function handleWithdrawVillaGoods(s: GameState, goodId: GoodId, amount: number): void {
  if (!s.villa) return;
  const stored = s.villa.storedGoods[goodId] || 0;
  const currentInvCount = Object.values(s.inventory).reduce((a, b) => a + (b || 0), 0);
  const invSpace = s.maxInv - currentInvCount;
  const wgAmt = Math.min(amount, stored, invSpace);
  if (wgAmt <= 0) return;
  s.villa.storedGoods[goodId] = stored - wgAmt;
  s.inventory[goodId] = (s.inventory[goodId] || 0) + wgAmt;
}

export function handleVillaThrowParty(s: GameState): void {
  if (!s.villa || !s.villa.modules.includes('zwembad')) return;
  const partyCost = [0, 15000, 25000, 40000][s.villa.level] || 15000;
  if (s.money < partyCost) return;
  if (s.day - (s.villa.lastPartyDay || 0) < 5) return;
  s.money -= partyCost;
  s.stats.totalSpent += partyCost;
  s.villa.lastPartyDay = s.day;
  const relBoost = [0, 8, 12, 18][s.villa.level] || 8;
  (['cartel', 'syndicate', 'bikers'] as const).forEach(fid => {
    s.familyRel[fid] = Math.min(100, (s.familyRel[fid] || 0) + relBoost);
  });
  const repBoost = [0, 15, 25, 40][s.villa.level] || 15;
  s.rep += repBoost;
  s.karma = Math.min(100, (s.karma || 0) + 3);
  s.crew.forEach(c => { if (c.hp > 0 && c.hp < 100) c.hp = Math.min(100, c.hp + 10); });
  addPhoneMessage(s, 'anonymous', `Legendarisch feest bij Villa Noxhaven! Iedereen praat erover. +${relBoost} factie-relaties, +${repBoost} rep.`, 'info');
}

export function handleUpgradeLab(s: GameState, labId: ProductionLabId, targetTier: 2 | 3): void {
  if (!s.villa) return;
  if (!s.drugEmpire) {
    if (shouldShowDrugEmpire(s)) s.drugEmpire = createDrugEmpireState();
    else return;
  }
  if (!canUpgradeLab(s, labId, targetTier)) return;
  const labCost = LAB_UPGRADE_COSTS[labId][targetTier];
  s.money -= labCost;
  s.stats.totalSpent += labCost;
  s.drugEmpire!.labTiers[labId] = targetTier;
}

export function handleAssignDealer(s: GameState, district: DistrictId, crewName: string, product: GoodId): void {
  if (!s.drugEmpire || !canAssignDealer(s, district)) return;
  s.drugEmpire.dealers.push({ district, crewName, marketShare: 5, daysActive: 0, product });
}

export function handleSellNoxCrystal(s: GameState, amount: number): void {
  if (!s.drugEmpire || s.drugEmpire.noxCrystalStock < amount) return;
  const noxValue = sellNoxCrystal(s, amount);
  if (noxValue > 0) s.lastRewardAmount = noxValue;
}
