import { GameState, GoodId, TradeMode } from '../types';
import * as Engine from '../engine';
import { GEAR, BUSINESSES, GOODS } from '../constants';
import { syncChallenges } from './helpers';
import { rollStreetEvent } from '../storyEvents';

export function handleTrade(s: GameState, gid: GoodId, mode: TradeMode, quantity: number): void {
  if ((s.hidingDays || 0) > 0 || s.prison || s.hospital) return;
  if (Engine.isWanted(s) && !s.prison) {
    if (Engine.checkWantedArrest(s)) {
      const { addPhoneMessage } = require('../newFeatures');
      addPhoneMessage(s, 'NHPD', `Gearresteerd tijdens een handelsactie! Je was GEZOCHT. Straf: ${s.prison?.daysRemaining} dagen.`, 'threat');
      s.screenEffect = 'blood-flash';
      return;
    }
  }
  const moneyBefore = s.money;
  const invBefore = s.inventory[gid] || 0;
  const avgCostBefore = s.inventoryCosts[gid] || 0;
  Engine.performTrade(s, gid, mode, quantity);
  const tradeHeat = mode === 'buy' ? 1 : 2;
  Engine.addVehicleHeat(s, tradeHeat);
  Engine.recomputeHeat(s);
  s.districtRep[s.loc] = Math.min(100, (s.districtRep[s.loc] || 0) + 1);
  if (mode === 'sell') {
    const earned = s.money - moneyBefore;
    if (earned > 0) s.lastRewardAmount = earned;
  }
  const tradedQty = Math.abs((s.inventory[gid] || 0) - invBefore);
  if (tradedQty > 0) {
    const moneyDiff = Math.abs(s.money - moneyBefore);
    const pricePerUnit = Math.round(moneyDiff / tradedQty);
    if (!s.tradeLog) s.tradeLog = [];
    s.tradeLog.unshift({
      id: `${s.day}-${Date.now()}-${gid}`,
      day: s.day, goodId: gid, mode, quantity: tradedQty,
      pricePerUnit, totalPrice: moneyDiff, district: s.loc,
      profitPerUnit: mode === 'sell' ? pricePerUnit - avgCostBefore : undefined,
    });
    if (s.tradeLog.length > 50) s.tradeLog = s.tradeLog.slice(0, 50);
  }
  if (s.dailyProgress) {
    s.dailyProgress.trades += quantity;
    if (mode === 'sell') {
      const tradeEarned = s.money - moneyBefore;
      if (tradeEarned > 0) s.dailyProgress.earned += tradeEarned;
    }
  }
  syncChallenges(s);
}

export function handleWashMoney(s: GameState): void {
  if ((s.hidingDays || 0) > 0 || s.dirtyMoney <= 0) return;
  const amount = Math.min(s.dirtyMoney, 3000 + (s.ownedDistricts.length * 1000));
  s.dirtyMoney -= amount;
  let washed = amount;
  if (s.ownedDistricts.includes('neon')) washed = Math.floor(amount * 1.15);
  const clean = Math.floor(washed * 0.85);
  s.money += clean;
  s.stats.totalEarned += clean;
  Engine.addPersonalHeat(s, 8);
  Engine.recomputeHeat(s);
  Engine.gainXp(s, 5);
}

export function handleWashMoneyAmount(s: GameState, amount: number): void {
  if ((s.hidingDays || 0) > 0 || s.dirtyMoney <= 0 || amount <= 0) return;
  const washCap = Engine.getWashCapacity(s);
  const maxWash = Math.min(s.dirtyMoney, washCap.remaining);
  const washAmt = Math.min(amount, maxWash);
  if (washAmt <= 0) return;
  s.dirtyMoney -= washAmt;
  let washedAmt = washAmt;
  if (s.ownedDistricts.includes('neon')) washedAmt = Math.floor(washAmt * 1.15);
  const cleanAmt = Math.floor(washedAmt * 0.85);
  s.money += cleanAmt;
  s.stats.totalEarned += cleanAmt;
  s.washUsedToday = (s.washUsedToday || 0) + washAmt;
  Engine.addPersonalHeat(s, Math.max(1, Math.floor(washAmt / 500)));
  Engine.recomputeHeat(s);
  Engine.gainXp(s, Math.max(1, Math.floor(washAmt / 200)));
  if (s.dailyProgress) { s.dailyProgress.washed += washAmt; }
  syncChallenges(s);
}

export function handleBuyGear(s: GameState, id: string): void {
  const item = GEAR.find(g => g.id === id);
  if (!item || s.ownedGear.includes(id)) return;
  let price = item.cost;
  if (s.heat > 50) price = Math.floor(price * 1.2);
  if (s.money < price) return;
  s.money -= price;
  s.stats.totalSpent += price;
  s.ownedGear.push(id);
  Engine.checkAchievements(s);
}

export function handleBuyGearDeal(s: GameState, id: string, price: number): void {
  const dealItem = GEAR.find(g => g.id === id);
  if (!dealItem || s.ownedGear.includes(id) || s.money < price) return;
  s.money -= price;
  s.stats.totalSpent += price;
  s.ownedGear.push(id);
}

export function handleEquip(s: GameState, id: string): void {
  const item = GEAR.find(g => g.id === id);
  if (!item || !s.ownedGear.includes(id)) return;
  s.player.loadout[item.type] = id;
}

export function handleUnequip(s: GameState, slot: string): void {
  const slotKey = slot as 'weapon' | 'armor' | 'gadget';
  s.player.loadout[slotKey] = null;
}

export function handleBuyBusiness(s: GameState, id: string): void {
  const biz = BUSINESSES.find(b => b.id === id);
  if (!biz || s.ownedBusinesses.includes(id) || s.money < biz.cost) return;
  if (biz.reqDistrict && !s.ownedDistricts.includes(biz.reqDistrict)) return;
  if (biz.reqRep && s.rep < biz.reqRep) return;
  if (biz.reqDay && s.day < biz.reqDay) return;
  if (biz.reqBusinessCount && s.ownedBusinesses.length < biz.reqBusinessCount) return;
  s.money -= biz.cost;
  s.stats.totalSpent += biz.cost;
  s.ownedBusinesses.push(id);
}

export function handleBribePolice(s: GameState): void {
  const charm = Engine.getPlayerStat(s, 'charm');
  const cost = Math.max(1500, 4000 - (charm * 150));
  if (s.money < cost) return;
  s.money -= cost;
  s.stats.totalSpent += cost;
  s.policeRel = Math.min(100, s.policeRel + 15);
  Engine.addPersonalHeat(s, -10);
  Engine.recomputeHeat(s);
  if (s.dailyProgress) { s.dailyProgress.bribes++; }
  syncChallenges(s);
}

export function handleSoloOp(s: GameState, opId: string): void {
  if ((s.hidingDays || 0) > 0 || s.prison) return;
  const { SOLO_OPERATIONS, PRISON_ARREST_CHANCE_HIGH_RISK, PRISON_ARREST_CHANCE_MISSION } = require('../constants');
  const { addPhoneMessage } = require('../newFeatures');
  const soloOpDef = SOLO_OPERATIONS.find((o: any) => o.id === opId);
  const soloResult = Engine.performSoloOp(s, opId);
  if (soloResult.nearMiss) (s as any)._nearMiss = soloResult.nearMiss;
  Engine.recomputeHeat(s);
  s.districtRep[s.loc] = Math.min(100, (s.districtRep[s.loc] || 0) + 5);
  Engine.checkAchievements(s);
  if (!soloResult.success && soloOpDef) {
    const risk = soloOpDef.risk;
    let arrestChance = risk > 70 ? PRISON_ARREST_CHANCE_HIGH_RISK : PRISON_ARREST_CHANCE_MISSION;
    const charm = Engine.getPlayerStat(s, 'charm');
    arrestChance -= charm * 0.02;
    if (arrestChance > 0 && Math.random() < arrestChance && !s.prison) {
      const report: any = {};
      Engine.arrestPlayer(s, report);
      addPhoneMessage(s, 'NHPD', `Je bent gearresteerd na een mislukte operatie! Straf: ${s.prison?.daysRemaining} dagen.`, 'threat');
      s.screenEffect = 'blood-flash';
    }
  }
  const soloEvent = rollStreetEvent(s, 'solo_op');
  if (soloEvent) {
    s.pendingStreetEvent = soloEvent;
    s.streetEventResult = null;
    s.lastStreetEventAt = new Date().toISOString();
  }
  if (s.dailyProgress) { s.dailyProgress.solo_ops++; }
  syncChallenges(s);
}

export function handleCraftItem(s: GameState, recipeId: string): void {
  if (!s.villa) return;
  const { CRAFT_RECIPES, canCraft } = require('../crafting');
  const recipe = CRAFT_RECIPES.find((r: any) => r.id === recipeId);
  if (!recipe) return;
  const check = canCraft(s, recipe);
  if (!check.ok) return;
  for (const ing of recipe.ingredients) {
    s.inventory[ing.goodId] = (s.inventory[ing.goodId] || 0) - ing.amount;
  }
  s.lab.chemicals -= recipe.chemCost;
  const baseCost = GOODS.find((g: any) => g.id === recipe.output.goodId)?.base || 500;
  const craftedCost = Math.floor(baseCost * recipe.sellMultiplier);
  s.inventory[recipe.output.goodId] = (s.inventory[recipe.output.goodId] || 0) + recipe.output.amount;
  s.inventoryCosts[recipe.output.goodId] = craftedCost;
  s.heat = Math.min(100, s.heat + recipe.heatGain);
  if (!s.craftLog) s.craftLog = [];
  s.craftLog.unshift({
    id: `craft-${s.day}-${Date.now()}`,
    day: s.day,
    recipeId: recipe.id,
    recipeName: recipe.name,
    outputGoodId: recipe.output.goodId,
    outputAmount: recipe.output.amount,
    estimatedValue: craftedCost * recipe.output.amount,
  });
  if (s.craftLog.length > 30) s.craftLog = s.craftLog.slice(0, 30);
  if (s.dailyProgress) {
    s.dailyProgress.earned += craftedCost * recipe.output.amount;
  }
  syncChallenges(s);
}
