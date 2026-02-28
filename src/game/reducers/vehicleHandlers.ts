import { GameState, DistrictId } from '../types';
import * as Engine from '../engine';
import { VEHICLES, REKAT_COSTS, VEHICLE_UPGRADES, STEALABLE_CARS, CHOP_SHOP_UPGRADES, OMKAT_COST, RACES, CRUSHER_AMMO_REWARDS, ARREST_HEAT_THRESHOLD, PRISON_ARREST_CHANCE_CARJACK } from '../constants';
import { addPhoneMessage } from '../newFeatures';
import { syncChallenges } from './helpers';
import type { VehicleUpgradeType, RaceType } from '../types';
import type { RaceResult } from '../racing';

export function handleBuyVehicle(s: GameState, id: string): void {
  const v = VEHICLES.find(v => v.id === id);
  if (!v || s.money < v.cost) return;
  s.money -= v.cost;
  s.stats.totalSpent += v.cost;
  s.ownedVehicles.push({ id, condition: 100, vehicleHeat: 0, rekatCooldown: 0 });
  Engine.checkAchievements(s);
}

export function handleSetVehicle(s: GameState, id: string): void {
  if (s.ownedVehicles.some(v => v.id === id)) {
    s.activeVehicle = id;
    s.maxInv = Engine.recalcMaxInv(s);
  }
}

export function handleRepairVehicle(s: GameState): void {
  const activeObj = s.ownedVehicles.find(v => v.id === s.activeVehicle);
  if (!activeObj) return;
  const cost = (100 - activeObj.condition) * 25;
  if (s.money < cost) return;
  s.money -= cost;
  s.stats.totalSpent += cost;
  activeObj.condition = 100;
}

export function handleUpgradeVehicle(s: GameState, vehicleId: string, upgradeType: VehicleUpgradeType): void {
  const vehicle = s.ownedVehicles.find(v => v.id === vehicleId);
  if (!vehicle) return;
  const upgradeDef = VEHICLE_UPGRADES[upgradeType];
  if (!upgradeDef) return;
  if (!vehicle.upgrades) vehicle.upgrades = {};
  const currentLevel = vehicle.upgrades[upgradeType] || 0;
  if (currentLevel >= upgradeDef.maxLevel) return;
  const cost = upgradeDef.costs[currentLevel];
  if (s.money < cost) return;
  s.money -= cost;
  s.stats.totalSpent += cost;
  vehicle.upgrades[upgradeType] = currentLevel + 1;
  s.maxInv = Engine.recalcMaxInv(s);
}

export function handleRekatVehicle(s: GameState, vehicleId: string): void {
  const vehicle = s.ownedVehicles.find(v => v.id === vehicleId);
  if (!vehicle || (vehicle.rekatCooldown || 0) > 0) return;
  const cost = REKAT_COSTS[vehicleId] || 5000;
  if (s.money < cost) return;
  s.money -= cost;
  s.stats.totalSpent += cost;
  vehicle.vehicleHeat = 0;
  vehicle.rekatCooldown = 3;
  Engine.recomputeHeat(s);
}

export function handleSellVehicle(s: GameState, vehicleId: string): void {
  const vIdx = s.ownedVehicles.findIndex(v => v.id === vehicleId);
  if (vIdx === -1 || s.ownedVehicles.length <= 1) return;
  const vDef = VEHICLES.find(v => v.id === vehicleId);
  if (!vDef || vDef.cost === 0) return;
  const ov = s.ownedVehicles[vIdx];
  const conditionMod = (ov.condition / 100) * 0.3 + 0.4;
  const upgradeBonus = ov.upgrades ? Object.values(ov.upgrades).reduce((sum, lvl) => sum + ((lvl as number) || 0) * 0.05, 0) : 0;
  const sellPrice = Math.floor(vDef.cost * (0.55 + upgradeBonus) * conditionMod);
  s.money += sellPrice;
  s.stats.totalEarned += sellPrice;
  s.ownedVehicles.splice(vIdx, 1);
  if (s.activeVehicle === vehicleId && s.ownedVehicles.length > 0) {
    s.activeVehicle = s.ownedVehicles[0].id;
    s.maxInv = Engine.recalcMaxInv(s);
  }
}

export function handleTradeInVehicle(s: GameState, oldVehicleId: string, newVehicleId: string): void {
  const oldIdx = s.ownedVehicles.findIndex(v => v.id === oldVehicleId);
  if (oldIdx === -1) return;
  const oldDef = VEHICLES.find(v => v.id === oldVehicleId);
  const newDef = VEHICLES.find(v => v.id === newVehicleId);
  if (!oldDef || !newDef || oldDef.cost === 0) return;
  const oldOv = s.ownedVehicles[oldIdx];
  const condMod = (oldOv.condition / 100) * 0.3 + 0.4;
  const upBonus = oldOv.upgrades ? Object.values(oldOv.upgrades).reduce((sum, lvl) => sum + ((lvl as number) || 0) * 0.05, 0) : 0;
  const tradeInPrice = Math.floor(oldDef.cost * (0.55 + upBonus + 0.10) * condMod);
  const mod = s.vehiclePriceModifiers?.[newVehicleId] ?? 1;
  const newPrice = Math.floor(newDef.cost * mod);
  const netCost = newPrice - tradeInPrice;
  if (netCost > 0 && s.money < netCost) return;
  s.money -= Math.max(0, netCost);
  if (netCost > 0) s.stats.totalSpent += netCost;
  if (netCost < 0) { s.money += Math.abs(netCost); s.stats.totalEarned += Math.abs(netCost); }
  s.ownedVehicles.splice(oldIdx, 1);
  s.ownedVehicles.push({ id: newVehicleId, condition: 100, vehicleHeat: 0, rekatCooldown: 0 });
  if (s.activeVehicle === oldVehicleId) {
    s.activeVehicle = newVehicleId;
    s.maxInv = Engine.recalcMaxInv(s);
  }
}

export function handleStartRace(s: GameState, raceType: RaceType, bet: number, result: RaceResult): void {
  if (s.raceUsedToday) return;
  const raceDef = RACES.find(r => r.id === raceType);
  if (!raceDef || s.money < bet) return;
  s.raceUsedToday = true;
  if (result.won) {
    const winnings = Math.floor(bet * result.multiplier);
    s.money += winnings;
    s.stats.totalEarned += winnings;
    s.rep += result.repGain;
    Engine.gainXp(s, result.xpGain);
    s.screenEffect = 'gold-flash';
    s.lastRewardAmount = winnings;
  } else {
    s.money -= bet;
    s.stats.totalSpent += bet;
    const activeOv = s.ownedVehicles.find(v => v.id === s.activeVehicle);
    if (activeOv && result.conditionLoss > 0) {
      activeOv.condition = Math.max(10, activeOv.condition - result.conditionLoss);
    }
  }
  Engine.addVehicleHeat(s, raceDef.heatGain);
  Engine.recomputeHeat(s);
}

export function handleAttemptCarTheft(s: GameState, success: boolean): void {
  if (!s.pendingCarTheft) return;
  const carDef = STEALABLE_CARS.find(c => c.id === s.pendingCarTheft!.carTypeId);
  if (!carDef) { s.pendingCarTheft = null; return; }
  if (success) {
    const condition = 60 + Math.floor(Math.random() * 40);
    s.stolenCars.push({
      id: `stolen_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      carTypeId: carDef.id, condition, omgekat: false, upgrades: [],
      stolenDay: s.day, stolenFrom: s.pendingCarTheft!.district, baseValue: carDef.baseValue,
    });
    Engine.addVehicleHeat(s, carDef.heatGain);
    Engine.addPersonalHeat(s, Math.floor(carDef.heatGain * 0.5));
    Engine.recomputeHeat(s);
    Engine.gainXp(s, 15 + Math.floor(carDef.baseValue / 2000));
    s.districtRep[s.loc] = Math.min(100, (s.districtRep[s.loc] || 0) + 3);
    s.screenEffect = 'gold-flash';
    s.lastRewardAmount = carDef.baseValue;
    if (s.dailyProgress) { s.dailyProgress.cars_stolen++; }
  } else {
    Engine.addPersonalHeat(s, carDef.heatGain + 10);
    Engine.addVehicleHeat(s, 5);
    Engine.recomputeHeat(s);
    if (s.crew.length > 0 && Math.random() < 0.3) {
      const target = s.crew[Math.floor(Math.random() * s.crew.length)];
      target.hp = Math.max(1, target.hp - 10);
    }
    if ((s.personalHeat || 0) > ARREST_HEAT_THRESHOLD && !s.prison) {
      if (Math.random() < PRISON_ARREST_CHANCE_CARJACK) {
        const report: any = {};
        Engine.arrestPlayer(s, report);
        addPhoneMessage(s, 'NHPD', `Gearresteerd tijdens een mislukte autodiefstal! Straf: ${s.prison?.daysRemaining} dagen.`, 'threat');
      }
    }
    s.screenEffect = 'blood-flash';
  }
  s.pendingCarTheft = null;
  syncChallenges(s);
}

export function handleCrushCar(s: GameState, carId: string): void {
  const car = s.stolenCars.find(c => c.id === carId);
  if (!car) return;
  const carDef = STEALABLE_CARS.find(c => c.id === car.carTypeId);
  if (!carDef) return;
  const [minAmmo, maxAmmo] = CRUSHER_AMMO_REWARDS[carDef.rarity] || [3, 5];
  let ammoGain = minAmmo + Math.floor(Math.random() * (maxAmmo - minAmmo + 1));
  if (car.condition >= 80) ammoGain += 2;
  ammoGain += car.upgrades.length;
  const oldAmmo = s.ammo || 0;
  s.ammo = Math.min(500, oldAmmo + ammoGain);
  const actualGain = s.ammo - oldAmmo;
  if (!s.ammoStock) s.ammoStock = { '9mm': 0, '7.62mm': 0, 'shells': 0 };
  s.ammoStock['9mm'] = s.ammo;
  s.stolenCars = s.stolenCars.filter(c => c.id !== carId);
  Engine.gainXp(s, 10);
  s.screenEffect = 'gold-flash';
  s.lastRewardAmount = actualGain;
}

export function handleSellStolenCar(s: GameState, carId: string, orderId: string | null): void {
  const car = s.stolenCars.find(c => c.id === carId);
  if (!car || !car.omgekat) return;
  let value = car.baseValue * (car.condition / 100);
  car.upgrades.forEach((uid) => {
    const upg = CHOP_SHOP_UPGRADES.find(u => u.id === uid);
    if (upg) value *= (1 + upg.valueBonus / 100);
  });
  value = Math.floor(value);
  if (orderId) {
    const order = s.carOrders.find(o => o.id === orderId);
    if (order && order.carTypeId === car.carTypeId) {
      value = Math.floor(value * (1 + order.bonusPercent / 100));
      s.carOrders = s.carOrders.filter(o => o.id !== orderId);
    }
  }
  s.dirtyMoney += value;
  s.stats.totalEarned += value;
  s.stolenCars = s.stolenCars.filter(c => c.id !== carId);
  s.lastRewardAmount = value;
  s.screenEffect = 'gold-flash';
  Engine.gainXp(s, 20);
}

export function handleUseStolenCar(s: GameState, carId: string): void {
  const car = s.stolenCars.find(c => c.id === carId);
  if (!car || !car.omgekat) return;
  const vehicleMap: Record<string, string> = {
    'rusted_sedan': 'toyohata', 'city_hatch': 'toyohata', 'delivery_van': 'forgedyer',
    'sport_coupe': 'bavamotor', 'suv_terrain': 'forgedyer', 'luxury_sedan': 'meridiolux',
    'muscle_car': 'bavamotor', 'exotic_sports': 'lupoghini', 'armored_limo': 'royaleryce',
    'rare_classic': 'meridiolux',
  };
  const vehicleId = vehicleMap[car.carTypeId] || 'toyohata';
  if (!s.ownedVehicles.some(v => v.id === vehicleId)) {
    s.ownedVehicles.push({ id: vehicleId, condition: car.condition, vehicleHeat: 0, rekatCooldown: 0 });
  }
  s.stolenCars = s.stolenCars.filter(c => c.id !== carId);
}
