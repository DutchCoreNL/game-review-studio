import { GameState, DistrictId, GoodId, FamilyId, StatId, ActiveContract, CombatState, CrewRole, NightReportData, RandomEvent, FactionActionType, MapEvent, PrisonState } from './types';
import { DISTRICTS, VEHICLES, GOODS, FAMILIES, CONTRACT_TEMPLATES, GEAR, BUSINESSES, SOLO_OPERATIONS, COMBAT_ENVIRONMENTS, CREW_NAMES, CREW_ROLES, ACHIEVEMENTS, RANDOM_EVENTS, BOSS_DATA, BOSS_COMBAT_OVERRIDES, FACTION_ACTIONS, FACTION_GIFTS, FACTION_REWARDS, AMMO_FACTORY_DAILY_PRODUCTION, PRISON_SENTENCE_TABLE, PRISON_MONEY_CONFISCATION, PRISON_ARREST_CHANCE_RAID, CORRUPT_CONTACTS, MARKET_EVENTS, GOOD_SPOILAGE } from './constants';
import { applyNewFeatures, resolveNemesisDefeat, addPhoneMessage } from './newFeatures';
import { FINAL_BOSS_COMBAT_OVERRIDES } from './endgame';
import { DISTRICT_EVENTS, DistrictEvent } from './districtEvents';
import { processCorruptionNetwork, getCorruptionRaidProtection, getCorruptionFineReduction } from './corruption';
import { getKarmaIntimidationBonus, getKarmaRepMultiplier, getKarmaIntimidationMoneyBonus, getKarmaFearReduction, getKarmaCrewHealingBonus, getKarmaCrewProtection, getKarmaRaidReduction, getKarmaHeatDecayBonus, getKarmaDiplomacyDiscount, getKarmaTradeSellBonus } from './karma';
import { processVillaProduction, getVillaProtectedMoney, getVillaCrewHealMultiplier, getVillaHeatReduction, getVillaMaxCrewBonus } from './villa';
import { processCrewLoyalty } from './crewLoyalty';
import { processSafehouseRaids } from './safehouseRaids';

const SAVE_KEY = 'noxhaven_save_v11';

// ========== FACTION ACTIVE HELPER ==========

/** Returns false if the faction leader is defeated (chaos) or faction is conquered (vassal). */
export function isFactionActive(state: GameState, familyId: FamilyId): boolean {
  if (state.conqueredFactions?.includes(familyId)) return false;
  if (state.leadersDefeated.includes(familyId)) return false;
  return true;
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Save failed:', e);
  }
}

export function loadGame(): GameState | null {
  try {
    // Try current version first
    let data = localStorage.getItem(SAVE_KEY);
    if (data) return JSON.parse(data);
    // Migrate from older versions
    for (const oldKey of ['noxhaven_save_v10', 'noxhaven_save_v9', 'noxhaven_save_v8']) {
      data = localStorage.getItem(oldKey);
      if (data) {
        const old = JSON.parse(data);
        if (!old.stats) old.stats = { totalEarned: 0, totalSpent: 0, casinoWon: 0, casinoLost: 0, missionsCompleted: 0, missionsFailed: 0, tradesCompleted: 0, daysPlayed: old.day || 0 };
        if (!old.nightReport) old.nightReport = null;
        localStorage.setItem(SAVE_KEY, JSON.stringify(old));
        localStorage.removeItem(oldKey);
        return old;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function deleteGame(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function getPlayerStat(state: GameState, stat: StatId): number {
  let base = state.player.stats[stat];
  const loadout = state.player.loadout;
  (['weapon', 'armor', 'gadget'] as const).forEach(slot => {
    const gearId = loadout[slot];
    if (gearId) {
      const item = GEAR.find(g => g.id === gearId);
      if (item?.stats[stat]) base += item.stats[stat]!;
    }
  });
  const activeV = VEHICLES.find(v => v.id === state.activeVehicle);
  if (activeV && stat === 'charm') base += activeV.charm;
  return base;
}

export function recalcMaxInv(state: GameState): number {
  let inv = 15;
  const activeV = VEHICLES.find(v => v.id === state.activeVehicle);
  if (activeV) inv = activeV.storage;
  // Vehicle storage upgrades
  const activeObj = state.ownedVehicles.find(v => v.id === state.activeVehicle);
  if (activeObj?.upgrades?.storage) {
    const storageUpgrades = [3, 5, 8];
    const totalBonus = storageUpgrades.slice(0, activeObj.upgrades.storage).reduce((a, b) => a + b, 0);
    inv += totalBonus;
  }
  if (state.villa?.modules.includes('garage_uitbreiding')) inv += 10;
  if (state.ownedDistricts.includes('port')) inv = Math.floor(inv * 1.1);
  if (state.crew.some(c => c.role === 'Smokkelaar')) inv += 5;
  // Safehouse storage bonuses (level 2: +5, level 3: +10)
  if (state.safehouses) {
    state.safehouses.forEach(sh => {
      if (sh.level >= 2) inv += 5;
      if (sh.level >= 3) inv += 5;
    });
  }
  // Villa opslagkelder bonus
  if (state.villa?.modules.includes('opslagkelder')) {
    inv += 10;
  }
  return inv;
}

// ========== VEHICLE UPGRADE HELPERS ==========

export function getVehicleUpgradeBonus(state: GameState, type: 'armor' | 'speed' | 'storage'): number {
  const v = state.ownedVehicles.find(v => v.id === state.activeVehicle);
  if (!v?.upgrades?.[type]) return 0;
  const bonusTable = { armor: [1, 2, 4], speed: [1, 2, 3], storage: [3, 5, 8] };
  return bonusTable[type].slice(0, v.upgrades[type]!).reduce((a, b) => a + b, 0);
}

// ========== HEAT 2.0 HELPERS ==========

export function getActiveVehicleHeat(state: GameState): number {
  const v = state.ownedVehicles.find(v => v.id === state.activeVehicle);
  return v?.vehicleHeat || 0;
}

export function addVehicleHeat(state: GameState, amount: number): void {
  const v = state.ownedVehicles.find(v => v.id === state.activeVehicle);
  if (v) {
    v.vehicleHeat = Math.max(0, Math.min(100, (v.vehicleHeat || 0) + amount));
  }
}

export function addPersonalHeat(state: GameState, amount: number): void {
  state.personalHeat = Math.max(0, Math.min(100, (state.personalHeat || 0) + amount));
}

export function splitHeat(state: GameState, amount: number, vehiclePct = 0.5): void {
  const vHeat = Math.round(amount * vehiclePct);
  const pHeat = amount - vHeat;
  addVehicleHeat(state, vHeat);
  addPersonalHeat(state, pHeat);
}

export function recomputeHeat(state: GameState): void {
  state.heat = Math.max(getActiveVehicleHeat(state), state.personalHeat || 0);
}

export function getAverageHeat(state: GameState): number {
  return Math.round((getActiveVehicleHeat(state) + (state.personalHeat || 0)) / 2);
}

export function generatePrices(state: GameState): void {
  state.prices = {};
  state.districtDemands = {};
  if (!state.marketPressure) state.marketPressure = {};
  
  // Get active market event effects
  const eventEffects = state.activeMarketEvent?.effects || {};
  
  Object.keys(DISTRICTS).forEach(id => {
    state.prices[id] = {};
    state.districtDemands[id] = Math.random() > 0.8 ? GOODS[Math.floor(Math.random() * GOODS.length)].id : null;
    if (!state.marketPressure[id]) state.marketPressure[id] = {};
    
    GOODS.forEach(g => {
      // Wider volatility for cheaper goods, narrower for expensive
      const volRange = g.base < 500 ? 0.9 : g.base < 1200 ? 0.7 : 0.5;
      const volatility = (1 - volRange / 2) + (Math.random() * volRange);
      
      let demandMod = (state.districtDemands[id] === g.id) ? 1.6 : 1.0;
      if (g.faction === 'cartel' && id === 'port' && isFactionActive(state, 'cartel') && (state.familyRel['cartel'] || 0) > 60) {
        demandMod = 0.6;
      }
      
      // Apply market pressure (supply/demand from player trading)
      const pressure = state.marketPressure[id]?.[g.id] || 0;
      const pressureMod = 1 + (pressure * 0.15); // ±15% per pressure point
      
      // Apply market event effects
      const eventMod = eventEffects[g.id as GoodId] || 1.0;
      
      state.prices[id][g.id] = Math.floor(g.base * volatility * DISTRICTS[id].mods[g.id as GoodId] * demandMod * pressureMod * eventMod);
      state.priceTrends[g.id] = Math.random() > 0.5 ? 'up' : 'down';
    });
    
    // Decay market pressure toward 0 each day
    GOODS.forEach(g => {
      const p = state.marketPressure[id]?.[g.id] || 0;
      if (p > 0) state.marketPressure[id][g.id] = Math.max(0, p - 0.3);
      else if (p < 0) state.marketPressure[id][g.id] = Math.min(0, p + 0.3);
    });
  });
}

export function generateContracts(state: GameState): void {
  state.activeContracts = [];
  const factionKeys = (Object.keys(FAMILIES) as FamilyId[]);
  const activeFactions = factionKeys.filter(fid => isFactionActive(state, fid));

  for (let i = 0; i < 3; i++) {
    const template = CONTRACT_TEMPLATES[Math.floor(Math.random() * CONTRACT_TEMPLATES.length)];

    if (activeFactions.length < 2) {
      // Not enough active factions — generate "solo" contracts without faction ties
      state.activeContracts.push({
        id: Date.now() + i,
        name: template.name,
        type: template.type,
        employer: activeFactions[0] || factionKeys[0],
        target: activeFactions[0] || factionKeys[0],
        risk: Math.min(90, Math.floor(template.risk + (state.day / 2))),
        heat: template.heat,
        reward: Math.floor(template.rewardBase * (1 + Math.min(state.day * 0.05, 3.0))),
        xp: 35 + (state.day * 2)
      });
      continue;
    }

    const employer = activeFactions[Math.floor(Math.random() * activeFactions.length)];
    let target = activeFactions[Math.floor(Math.random() * activeFactions.length)];
    while (target === employer) target = activeFactions[Math.floor(Math.random() * activeFactions.length)];
    
    state.activeContracts.push({
      id: Date.now() + i,
      name: template.name,
      type: template.type,
      employer,
      target,
      risk: Math.min(90, Math.floor(template.risk + (state.day / 2))),
      heat: template.heat,
      reward: Math.floor(template.rewardBase * (1 + Math.min(state.day * 0.05, 3.0))),
      xp: 35 + (state.day * 2)
    });
  }
}

export function generateMapEvents(state: GameState): void {
  const events: MapEvent[] = [];
  const totalRoads = 8;
  const eventCount = 2 + Math.floor(Math.random() * 3);
  const usedRoads = new Set<number>();

  for (let i = 0; i < eventCount; i++) {
    let roadIndex: number;
    do { roadIndex = Math.floor(Math.random() * totalRoads); } while (usedRoads.has(roadIndex));
    usedRoads.add(roadIndex);

    let type: MapEvent['type'];
    const roll = Math.random();

    const vHeat = getActiveVehicleHeat(state);
    // Speed upgrade reduces checkpoint spawn chance
    const speedUpgrade = getVehicleUpgradeBonus(state, 'speed');
    const checkpointReduction = speedUpgrade * 0.05; // 5%/15%/30% less likely at lvl 1/2/3
    if (vHeat > 60 && roll < 0.3) {
      type = 'drone';
    } else if (vHeat > 40 && roll < (0.5 - checkpointReduction)) {
      type = 'police_checkpoint';
  } else if ((Object.keys(FAMILIES) as FamilyId[]).some(fid => isFactionActive(state, fid) && (state.familyRel[fid] || 0) < -30) && roll < 0.6) {
      type = 'street_fight';
    } else if (roll < 0.7) {
      type = 'black_market';
    } else if (roll < 0.85) {
      type = 'accident';
    } else {
      type = 'ambulance';
    }

    const labels: Record<MapEvent['type'], string> = {
      police_checkpoint: 'Politie Controle',
      accident: 'Wegblokkade',
      street_fight: 'Straatgevecht',
      black_market: 'Zwarte Markt',
      drone: 'Surveillance Drone',
      ambulance: 'Spoedgeval',
    };

    events.push({
      id: `evt-${state.day}-${i}`,
      type,
      roadIndex,
      position: 20 + Math.floor(Math.random() * 60),
      label: labels[type],
    });
  }

  if (getActiveVehicleHeat(state) > 70 && events.filter(e => e.type === 'police_checkpoint').length === 0) {
    let roadIndex: number;
    do { roadIndex = Math.floor(Math.random() * totalRoads); } while (usedRoads.has(roadIndex));
    events.push({
      id: `evt-${state.day}-police`,
      type: 'police_checkpoint',
      roadIndex,
      position: 40 + Math.floor(Math.random() * 20),
      label: 'Politie Controle',
    });
  }

  state.mapEvents = events;
}

function rollRandomEvent(state: GameState): RandomEvent | null {
  if (Math.random() > 0.35) return null; // 35% chance of event

  // 50% chance for a district-specific event when in a district
  if (Math.random() < 0.5) {
    const districtEvents = DISTRICT_EVENTS.filter(
      e => e.district === state.loc && state.heat >= e.minHeat
    );
    if (districtEvents.length > 0) {
      const de = districtEvents[Math.floor(Math.random() * districtEvents.length)];
      return { id: de.id, title: de.title, description: de.description, type: de.type, effect: de.effect };
    }
  }

  // Fallback to generic events
  const eligible = RANDOM_EVENTS.filter(e => state.heat >= e.minHeat);
  if (eligible.length === 0) return null;

  const event = eligible[Math.floor(Math.random() * eligible.length)];
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    type: event.type,
    effect: event.effect,
  };
}

function applyRandomEvent(state: GameState, event: RandomEvent): void {
  switch (event.effect) {
    case 'lose_inventory': {
      const goods = Object.keys(state.inventory) as GoodId[];
      const target = goods.find(g => (state.inventory[g] || 0) > 0);
      if (target) {
        const lost = Math.ceil((state.inventory[target] || 0) * 0.3);
        state.inventory[target] = Math.max(0, (state.inventory[target] || 0) - lost);
      }
      break;
    }
    case 'crew_damage': {
      const armorBonus = getVehicleUpgradeBonus(state, 'armor');
      const dmgReduction = armorBonus > 0 ? armorBonus * 0.06 : 0;
      state.crew.forEach(c => {
        let dmg = Math.floor(Math.random() * 20 + 10);
        if (dmgReduction > 0) dmg = Math.floor(dmg * (1 - dmgReduction));
        if (c.hp > 0) c.hp = Math.max(1, c.hp - dmg);
      });
      break;
    }
    case 'lose_money': {
      const fine = Math.floor(state.money * 0.08);
      state.money = Math.max(0, state.money - fine);
      break;
    }
    case 'vehicle_damage': {
      const activeV = state.ownedVehicles.find(v => v.id === state.activeVehicle);
      if (activeV) {
        let vDmg = 25;
        const armorBonusV = getVehicleUpgradeBonus(state, 'armor');
        if (armorBonusV > 0) vDmg = Math.floor(vDmg * (1 - armorBonusV * 0.06));
        activeV.condition = Math.max(10, activeV.condition - vDmg);
      }
      break;
    }
    case 'bonus_money': {
      const bonus = Math.floor(500 + state.day * 100);
      state.money += bonus;
      state.stats.totalEarned += bonus;
      break;
    }
    case 'reduce_heat': {
      addPersonalHeat(state, -25);
      break;
    }
    case 'heal_crew': {
      state.crew.forEach(c => { c.hp = 100; });
      break;
    }
    case 'price_shift':
      // Prices already regenerated — no extra action needed
      break;
    // === DISTRICT-SPECIFIC EVENT EFFECTS ===

    // Port Nero
    case 'port_free_goods': {
      const portGoods: GoodId[] = ['tech', 'luxury', 'meds'];
      const pick = portGoods[Math.floor(Math.random() * portGoods.length)];
      const amount = Math.floor(Math.random() * 3) + 2;
      const currentInv = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
      const space = state.maxInv - currentInv;
      const added = Math.min(amount, space);
      if (added > 0) state.inventory[pick] = (state.inventory[pick] || 0) + added;
      break;
    }
    case 'port_lose_smuggle': {
      const smuggleGoods: GoodId[] = ['drugs', 'weapons'];
      smuggleGoods.forEach(g => {
        const qty = state.inventory[g] || 0;
        if (qty > 0) {
          const lost = Math.ceil(qty * 0.25);
          state.inventory[g] = Math.max(0, qty - lost);
        }
      });
      break;
    }
    case 'port_heat_reduction': {
      addPersonalHeat(state, -12);
      addVehicleHeat(state, -10);
      break;
    }
    case 'port_price_spike': {
      // Goods from port become more expensive (less available)
      addPersonalHeat(state, 3);
      break;
    }
    case 'port_bonus_money': {
      const portBonus = Math.floor(800 + state.day * 150);
      state.dirtyMoney += portBonus;
      state.stats.totalEarned += portBonus;
      break;
    }

    // Crown Heights
    case 'crown_trade_bonus': {
      const tradeBonus = Math.floor(1500 + state.day * 200);
      state.money += tradeBonus;
      state.stats.totalEarned += tradeBonus;
      break;
    }
    case 'crown_money_freeze': {
      const frozen = Math.floor(state.money * 0.1);
      state.money = Math.max(0, state.money - frozen);
      break;
    }
    case 'crown_rep_boost': {
      state.rep += 15;
      state.districtRep.crown = Math.min(100, (state.districtRep.crown || 0) + 5);
      break;
    }
    case 'crown_tech_spike': {
      // Tech goods temporarily worth more - give some free tech
      const currentInvT = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
      const spaceT = state.maxInv - currentInvT;
      if (spaceT > 0) state.inventory.tech = (state.inventory.tech || 0) + Math.min(2, spaceT);
      break;
    }
    case 'crown_heat_spike': {
      addPersonalHeat(state, 15);
      break;
    }

    // Iron Borough
    case 'iron_cheap_weapons': {
      const currentInvW = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
      const spaceW = state.maxInv - currentInvW;
      if (spaceW > 0) state.inventory.weapons = (state.inventory.weapons || 0) + Math.min(2, spaceW);
      break;
    }
    case 'iron_free_chemicals': {
      state.lab.chemicals += Math.floor(Math.random() * 10) + 5;
      break;
    }
    case 'iron_crew_damage': {
      state.crew.forEach(c => {
        if (c.hp > 0) c.hp = Math.max(1, c.hp - Math.floor(Math.random() * 15 + 8));
      });
      break;
    }
    case 'iron_vehicle_repair': {
      const veh = state.ownedVehicles.find(v => v.id === state.activeVehicle);
      if (veh) veh.condition = Math.min(100, veh.condition + 20);
      break;
    }
    case 'iron_crew_heal': {
      state.crew.forEach(c => { c.hp = Math.min(100, c.hp + 30); });
      break;
    }

    // Lowrise
    case 'low_quick_cash': {
      const quickCash = Math.floor(300 + state.day * 50);
      state.dirtyMoney += quickCash;
      state.stats.totalEarned += quickCash;
      break;
    }
    case 'low_lose_cash': {
      const lost = Math.floor(Math.random() * 500 + 200);
      state.money = Math.max(0, state.money - lost);
      break;
    }
    case 'low_heat_increase': {
      addPersonalHeat(state, 12);
      break;
    }
    case 'low_free_drugs': {
      const currentInvD = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
      const spaceD = state.maxInv - currentInvD;
      if (spaceD > 0) state.inventory.drugs = (state.inventory.drugs || 0) + Math.min(4, spaceD);
      break;
    }
    case 'low_community_cover': {
      addPersonalHeat(state, -18);
      break;
    }

    // Neon Strip
    case 'neon_bonus_money': {
      const neonBonus = Math.floor(2000 + state.day * 250);
      state.money += neonBonus;
      state.stats.totalEarned += neonBonus;
      break;
    }
    case 'neon_lose_drugs': {
      const drugsHeld = state.inventory.drugs || 0;
      if (drugsHeld > 0) {
        state.inventory.drugs = Math.max(0, Math.floor(drugsHeld * 0.5));
      }
      addPersonalHeat(state, 10);
      break;
    }
    case 'neon_rep_boost': {
      state.rep += 20;
      state.districtRep.neon = Math.min(100, (state.districtRep.neon || 0) + 8);
      break;
    }
    case 'neon_casino_bonus': {
      const casinoComp = Math.floor(1000 + state.day * 100);
      state.money += casinoComp;
      state.stats.totalEarned += casinoComp;
      state.stats.casinoWon += casinoComp;
      break;
    }
    case 'neon_chaos_loss': {
      const chaosLoss = Math.floor(state.money * 0.05);
      state.money = Math.max(0, state.money - chaosLoss);
      break;
    }
  }
}

// ========== PRISON HELPERS ==========

export function calculateSentence(personalHeat: number): number {
  for (const entry of PRISON_SENTENCE_TABLE) {
    if (personalHeat <= entry.maxHeat) return entry.days;
  }
  return 7;
}

export function arrestPlayer(state: GameState, report: NightReportData): void {
  const sentence = calculateSentence(state.personalHeat || 0);

  // Confiscate money (villa vault money is protected)
  const protectedMoney = getVillaProtectedMoney(state);
  const vulnerableMoney = Math.max(0, state.money - 0); // all pocket money is vulnerable
  const moneyLost = Math.floor(vulnerableMoney * PRISON_MONEY_CONFISCATION);
  state.money -= moneyLost;

  // Confiscate all dirty money
  const dirtyMoneyLost = state.dirtyMoney;
  state.dirtyMoney = 0;

  // Confiscate illegal goods (drugs, weapons) — villa stored goods are PROTECTED
  const goodsLost: string[] = [];
  const illegalGoods: GoodId[] = ['drugs', 'weapons'];
  illegalGoods.forEach(gid => {
    if ((state.inventory[gid] || 0) > 0) {
      goodsLost.push(GOODS.find(g => g.id === gid)?.name || gid);
      state.inventory[gid] = 0;
      state.inventoryCosts[gid] = 0;
    }
  });
  // Villa stored goods are NOT touched (that's the whole point)

  state.prison = {
    daysRemaining: sentence,
    totalSentence: sentence,
    moneyLost,
    dirtyMoneyLost,
    goodsLost,
    escapeAttempted: false,
  };

  report.imprisoned = true;
  report.prisonSentence = sentence;
  report.prisonMoneyLost = moneyLost;
  report.prisonDirtyMoneyLost = dirtyMoneyLost;
  report.prisonGoodsLost = goodsLost;
  if (protectedMoney > 0) report.villaVaultProtected = protectedMoney;
}

export function endTurn(state: GameState): NightReportData {
  const report: NightReportData = {
    day: state.day + 1,
    districtIncome: 0,
    businessIncome: 0,
    totalWashed: 0,
    debtInterest: 0,
    labYield: 0,
    heatChange: 0,
    vehicleHeatChange: 0,
    personalHeatChange: 0,
    policeRaid: false,
    policeFine: 0,
    crewHealing: 0,
    vehicleDecay: [],
    randomEvent: null,
  };

  const personalHeatBefore = state.personalHeat || 0;
  const vehicleHeatBefore = getActiveVehicleHeat(state);

  // Lab production (storm gives +50% output, not double)
  const labMultiplier = state.weather === 'storm' ? 1.5 : 1;

  // Villa production FIRST (before old HQ lab, to consume chemicals)
  let villaProduction: import('./villa').VillaProductionResult | null = null;
  if (state.villa) {
    villaProduction = processVillaProduction(state);
    if (villaProduction.heatGenerated > 0) {
      addPersonalHeat(state, villaProduction.heatGenerated);
    }
    // Store in report
    if (villaProduction.wietProduced > 0) report.villaWietProduced = villaProduction.wietProduced;
    if (villaProduction.cokeProduced > 0) report.villaCokeProduced = villaProduction.cokeProduced;
    if (villaProduction.labProduced > 0) report.villaLabProduced = villaProduction.labProduced;
    // Reset helipad daily
    state.villa.helipadUsedToday = false;
  }

  // Only run old HQ lab if villa doesn't have synthetica_lab
  const villaHasLab = state.villa?.modules.includes('synthetica_lab');
  if (!villaHasLab && state.lab.chemicals > 0) {
    const currentInv = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
    const space = state.maxInv - currentInv;
    if (space > 0) {
      const maxBatch = state.weather === 'storm' ? 30 : 20;
      const batchSize = Math.min(state.lab.chemicals, maxBatch, space) * labMultiplier;
      state.lab.chemicals -= batchSize;
      const existingCount = state.inventory.drugs || 0;
      const existingCost = state.inventoryCosts.drugs || 0;
      const baseCost = GOODS.find(g => g.id === 'drugs')!.base * 0.5;
      const totalQty = existingCount + batchSize;
      state.inventoryCosts.drugs = totalQty > 0 ? Math.floor(((existingCount * existingCost) + (batchSize * baseCost)) / totalQty) : baseCost;
      state.inventory.drugs = totalQty;
      report.labYield = batchSize;
      addPersonalHeat(state, 4);
    }
  }

  state.day++;
  state.stats.daysPlayed++;

  // === HIDING DAYS PROCESSING ===
  const isHiding = (state.hidingDays || 0) > 0;
  if (isHiding) {
    state.hidingDays = Math.max(0, state.hidingDays - 1);
    const safeHouseBonus = 0;
    const villaHideBonus = state.villa ? getVillaHeatReduction(state) : 0;
    addPersonalHeat(state, -(15 + safeHouseBonus + villaHideBonus));

    // Notify when hiding ends
    if (state.hidingDays <= 0) {
      addPhoneMessage(state, 'anonymous', 'Je bent weer op straat. Wees voorzichtig — vijanden hebben je afwezigheid opgemerkt.', 'info');
    } else {
      addPhoneMessage(state, 'anonymous', `Nog ${state.hidingDays} dag(en) ondergedoken. Je bent veilig, maar je mist alles.`, 'info');
    }
  }

  // District income (0 while hiding)
  if (!isHiding) {
    report.districtIncome = state.ownedDistricts.reduce((s, id) => s + DISTRICTS[id].income, 0);
  }

  // Business income & washing (0 while hiding)
  if (!isHiding) {
    state.ownedBusinesses.forEach(bid => {
      const biz = BUSINESSES.find(b => b.id === bid);
      if (biz) {
        report.businessIncome += biz.income;
        let washAmount = Math.min(state.dirtyMoney, biz.clean);
        if (state.ownedDistricts.includes('neon')) washAmount = Math.floor(washAmount * 1.2);
        state.dirtyMoney -= washAmount;
        const washed = Math.floor(washAmount * 0.85);
        state.money += washed;
        report.totalWashed += washAmount;
      }
    });
  }

  state.money += report.districtIncome + report.businessIncome;
  state.stats.totalEarned += report.districtIncome + report.businessIncome;

  // === VEHICLE HEAT DECAY (each vehicle) ===
  state.ownedVehicles.forEach(v => {
    let vDecay = 8;
    if (state.ownedDistricts.includes('crown')) vDecay += 2;
    if (state.villa?.modules.includes('server_room')) vDecay += 5;
    v.vehicleHeat = Math.max(0, (v.vehicleHeat || 0) - vDecay);
    // Rekat cooldown countdown
    if (v.rekatCooldown > 0) v.rekatCooldown--;
  });

   // === PERSONAL HEAT DECAY ===
  let pDecay = 2;
  if (state.ownedDistricts.includes('crown')) pDecay += 1;
  if (state.villa?.modules.includes('server_room')) pDecay += 5;
  if (state.crew.some(c => c.role === 'Hacker')) pDecay += 2;
  // Karma: Eerbaar extra heat decay
  pDecay += getKarmaHeatDecayBonus(state);
  // Safehouse heat reduction
  if (state.safehouses) {
    state.safehouses.forEach(sh => {
      if (sh.district === state.loc) {
        // Being in the same district as safehouse gives extra bonus
        pDecay += sh.level <= 1 ? 3 : sh.level === 2 ? 5 : 8;
      } else {
        // Remote safehouses give small passive bonus
        pDecay += sh.level >= 2 ? 1 : 0;
      }
      // Garage upgrade: vehicle heat reduction
      if (sh.upgrades.includes('garage') && sh.district === state.loc) {
        state.ownedVehicles.forEach(v => {
          v.vehicleHeat = Math.max(0, (v.vehicleHeat || 0) - 5);
        });
      }
    });
  }
  addPersonalHeat(state, -pDecay);

  // Recompute effective heat
  recomputeHeat(state);

  // Police heat check (uses personalHeat, modified by corruption protection)
  const raidProtection = getCorruptionRaidProtection(state);
  const karmaRaidReduction = getKarmaRaidReduction(state);
  const raidChance = 0.3 * (1 - raidProtection / 100) * (1 - karmaRaidReduction);
  if ((state.personalHeat || 0) > 60 && Math.random() < raidChance && state.policeRel < 50) {
    let fine = Math.floor(state.money * 0.1);
    // Armor upgrade reduces police fine
    const armorBonus = getVehicleUpgradeBonus(state, 'armor');
    if (armorBonus > 0) {
      fine = Math.floor(fine * (1 - armorBonus * 0.06));
    }
    // Corruption fine reduction
    const fineReduction = getCorruptionFineReduction(state);
    if (fineReduction > 0) {
      fine = Math.floor(fine * (1 - fineReduction / 100));
    }
    state.money -= fine;
    addPersonalHeat(state, -20);
    report.policeRaid = true;
    report.policeFine = fine;

    // === PRISON: Arrest chance during raid ===
    let arrestChance = PRISON_ARREST_CHANCE_RAID;
    // Corrupt contacts reduce arrest chance
    arrestChance *= (1 - raidProtection / 100);
    // Lawyer halves arrest chance
    const hasLawyer = state.corruptContacts?.some(c => {
      const def = CORRUPT_CONTACTS.find(cd => cd.id === c.contactDefId);
      return def?.type === 'lawyer' && c.active && !c.compromised;
    });
    if (hasLawyer) arrestChance *= 0.5;

    if (Math.random() < arrestChance) {
      arrestPlayer(state, report);
    }
  }

  // === PRISON: Day countdown ===
  if (state.prison) {
    state.prison.daysRemaining--;
    if (state.prison.daysRemaining <= 0) {
      // Release: reset heat
      state.personalHeat = 0;
      state.ownedVehicles.forEach(v => { v.vehicleHeat = 0; });
      recomputeHeat(state);
      state.prison = null;
      addPhoneMessage(state, 'anonymous', 'Je bent vrijgelaten. Schone lei. Begin opnieuw.', 'info');
    }
  }

  // Debt interest
  if (state.debt > 0) {
    report.debtInterest = Math.floor(state.debt * 0.03);
    state.debt = Math.floor(state.debt * 1.03);
  }

  // Vehicle condition decay
  state.ownedVehicles.forEach(v => {
    const decay = Math.floor(Math.random() * 5) + 2; // 2-6% per day
    const oldCondition = v.condition;
    v.condition = Math.max(10, v.condition - decay);
    if (oldCondition !== v.condition) {
      report.vehicleDecay.push({ id: v.id, amount: oldCondition - v.condition });
    }
  });

  // Crew natural healing (small amount)
  let totalHealing = 0;
  const hasMedbay = state.safehouses?.some(sh => sh.upgrades.includes('medbay') && sh.district === state.loc);
  const hasLevel3Safehouse = state.safehouses?.some(sh => sh.level >= 3 && sh.district === state.loc);
  const karmaHealBonus = getKarmaCrewHealingBonus(state);
  state.crew.forEach(c => {
    if (c.hp < 100 && c.hp > 0) {
      let heal = Math.floor(Math.random() * 5) + 3; // 3-7 HP per night
      if (hasMedbay) heal *= 2; // medbay doubles healing
      if (hasLevel3Safehouse) heal += 3; // level 3 safehouse bonus
      // Karma: Eerbaar crew healing bonus
      if (karmaHealBonus > 0) heal = Math.floor(heal * (1 + karmaHealBonus));
      const oldHp = c.hp;
      c.hp = Math.min(100, c.hp + heal);
      totalHealing += c.hp - oldHp;
    }
  });
  report.crewHealing = totalHealing;

  // Random event
  const event = rollRandomEvent(state);
  if (event) {
    applyRandomEvent(state, event);
    report.randomEvent = event;
  }

  recomputeHeat(state);
  report.vehicleHeatChange = getActiveVehicleHeat(state) - vehicleHeatBefore;
  report.personalHeatChange = (state.personalHeat || 0) - personalHeatBefore;
  report.heatChange = state.heat - Math.max(vehicleHeatBefore, personalHeatBefore);

  // Track price history before regenerating
  if (!state.priceHistory) state.priceHistory = {};
  Object.keys(state.prices).forEach(distId => {
    if (!state.priceHistory[distId]) state.priceHistory[distId] = {};
    Object.keys(state.prices[distId]).forEach(gid => {
      if (!state.priceHistory[distId][gid]) state.priceHistory[distId][gid] = [];
      state.priceHistory[distId][gid].push(state.prices[distId][gid]);
      if (state.priceHistory[distId][gid].length > 14) {
        state.priceHistory[distId][gid] = state.priceHistory[distId][gid].slice(-14);
      }
    });
  });

  // Reset daily wash counter
  state.washUsedToday = 0;

  // Reset faction cooldowns
  state.factionCooldowns = { cartel: [], syndicate: [], bikers: [] };

  // Apply faction war effects for hostile factions
  applyFactionWar(state);

  // Faction alliance passive income (only conquered factions or active alliances with living leader)
  (Object.keys(FAMILIES) as FamilyId[]).forEach(fid => {
    const rel = state.familyRel[fid] || 0;
    const isConquered = state.conqueredFactions?.includes(fid);
    const leaderAlive = !state.leadersDefeated.includes(fid);
    // Conquered = vassal income; Active alliance (rel>=80 + leader alive) = alliance income
    if (isConquered) {
      state.money += 1000;
      state.stats.totalEarned += 1000;
      report.businessIncome += 1000;
    } else if (rel >= 80 && leaderAlive) {
      state.money += 500;
      state.stats.totalEarned += 500;
      report.businessIncome += 500;
    }
  });

  // === POWER DECAY: defeated-but-not-conquered factions lose influence ===
  if (!state.leaderDefeatedDay) state.leaderDefeatedDay = {};
  (Object.keys(FAMILIES) as FamilyId[]).forEach(fid => {
    const isDefeated = state.leadersDefeated.includes(fid);
    const isConquered = state.conqueredFactions?.includes(fid);
    if (isDefeated && !isConquered) {
      // Track the day the leader was defeated
      if (!state.leaderDefeatedDay[fid]) state.leaderDefeatedDay[fid] = state.day;
      // Daily relation decay
      state.familyRel[fid] = Math.max(-100, (state.familyRel[fid] || 0) - 2);
      // After 10 days: send threatening phone message (once)
      const defeatedDay = state.leaderDefeatedDay[fid]!;
      const daysSince = state.day - defeatedDay;
      if (daysSince === 10) {
        const fam = FAMILIES[fid];
        addPhoneMessage(state, fam.contact, `De straat vergeet niet, ${fam.name} laat je dit niet zomaar doen. Neem ons over of betaal de prijs.`, 'threat');
      }
    }
  });

  // === MARKET EVENTS ===
  if (state.activeMarketEvent && state.activeMarketEvent.daysLeft > 0) {
    state.activeMarketEvent.daysLeft--;
    if (state.activeMarketEvent.daysLeft <= 0) state.activeMarketEvent = null;
  }
  // 25% chance of new event if none active
  if (!state.activeMarketEvent && Math.random() < 0.25) {
    const evt = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
    state.activeMarketEvent = { id: evt.id, name: evt.name, desc: evt.desc, effects: evt.effects, daysLeft: evt.duration };
    report.marketEvent = { name: evt.name, desc: evt.desc };
  }

  // === SPOILAGE ===
  const spoilageReport: { good: string; lost: number }[] = [];
  (Object.keys(GOOD_SPOILAGE) as GoodId[]).forEach(gid => {
    const rate = GOOD_SPOILAGE[gid];
    if (rate <= 0) return;
    const owned = state.inventory[gid] || 0;
    if (owned <= 0) return;
    // Villa opslagkelder halves spoilage
    const hasStorage = state.villa?.modules.includes('opslagkelder');
    const effectiveRate = hasStorage ? rate * 0.5 : rate;
    const lost = Math.max(1, Math.floor(owned * effectiveRate));
    state.inventory[gid] = owned - lost;
    if (state.inventory[gid]! <= 0) { state.inventory[gid] = 0; state.inventoryCosts[gid] = 0; }
    const goodName = GOODS.find(g => g.id === gid)?.name || gid;
    spoilageReport.push({ good: goodName, lost });
  });
  if (spoilageReport.length > 0) report.spoilage = spoilageReport;

  generatePrices(state);
  generateContracts(state);
  generateMapEvents(state);

  // === PROCESS MARKET ALERTS ===
  if (state.marketAlerts && state.marketAlerts.length > 0) {
    const triggered: import('./types').TriggeredMarketAlert[] = [];
    const remaining = state.marketAlerts.filter(alert => {
      const districts = alert.district === 'any' ? Object.keys(DISTRICTS) : [alert.district];
      for (const did of districts) {
        const price = state.prices[did]?.[alert.goodId] || 0;
        const hit = alert.condition === 'below' ? price <= alert.threshold : price >= alert.threshold;
        if (hit) {
          const good = GOODS.find(g => g.id === alert.goodId);
          triggered.push({
            goodName: good?.name || alert.goodId,
            districtName: DISTRICTS[did]?.name || did,
            condition: alert.condition,
            threshold: alert.threshold,
            actualPrice: price,
          });
          return !alert.oneShot; // keep if not one-shot
        }
      }
      return true; // not triggered, keep
    });
    state.marketAlerts = remaining;
    state.triggeredAlerts = triggered;
    if (triggered.length > 0) report.triggeredAlerts = triggered;
  }

  // Apply all new feature logic (weather, district rep, nemesis, defense, smuggling, phone)
  applyNewFeatures(state, report);

  // Process corruption network (payments, betrayals, passive effects)
  processCorruptionNetwork(state, report);

  // Process crew loyalty (decay, defections)
  processCrewLoyalty(state, report);

  // Process safehouse raids
  processSafehouseRaids(state, report);

  // Ammo factory production
  if (state.ownedBusinesses.includes('ammo_factory')) {
    const produced = AMMO_FACTORY_DAILY_PRODUCTION;
    const oldAmmo = state.ammo || 0;
    state.ammo = Math.min(99, oldAmmo + produced);
    const actualProduced = state.ammo - oldAmmo;
    if (actualProduced > 0) {
      report.ammoFactoryProduction = actualProduced;
    }
  }

  state.maxInv = recalcMaxInv(state);
  state.nightReport = report;

  return report;
}

export function performTrade(state: GameState, gid: GoodId, mode: 'buy' | 'sell', quantity = 1): { success: boolean; message: string } {
  const basePrice = state.prices[state.loc]?.[gid] || 0;
  const totalCharm = getPlayerStat(state, 'charm');
  const charmBonus = (totalCharm * 0.02) + (state.rep / 5000);

  if (mode === 'buy') {
    const invCount = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
    const maxBuy = Math.min(quantity, state.maxInv - invCount);
    if (maxBuy <= 0) return { success: false, message: "Kofferbak vol." };

    let buyPrice = basePrice;
    const good = GOODS.find(g => g.id === gid);
    if (good?.faction && (state.familyRel[good.faction] || 0) > 50) {
      buyPrice = Math.floor(buyPrice * 0.7);
    }
    if (getAverageHeat(state) > 50) buyPrice = Math.floor(buyPrice * 1.2);

    const actualQty = Math.min(maxBuy, Math.floor(state.money / buyPrice));
    if (actualQty <= 0) return { success: false, message: "Te weinig kapitaal." };

    const totalCost = buyPrice * actualQty;
    state.money -= totalCost;
    state.stats.totalSpent += totalCost;

    const currentCount = state.inventory[gid] || 0;
    const currentCost = state.inventoryCosts[gid] || 0;
    const totalQty = currentCount + actualQty;
    state.inventoryCosts[gid] = totalQty > 0 ? Math.floor(((currentCount * currentCost) + totalCost) / totalQty) : buyPrice;
    state.inventory[gid] = totalQty;
    state.stats.tradesCompleted += actualQty;

    // Market pressure: buying raises prices in this district
    if (!state.marketPressure) state.marketPressure = {};
    if (!state.marketPressure[state.loc]) state.marketPressure[state.loc] = {};
    state.marketPressure[state.loc][gid] = Math.min(3, (state.marketPressure[state.loc][gid] || 0) + actualQty * 0.1);

    return { success: true, message: `${actualQty}x ${GOODS.find(g => g.id === gid)?.name} gekocht voor €${totalCost}` };
  } else {
    const owned = state.inventory[gid] || 0;
    if (owned <= 0) return { success: false, message: "Niet op voorraad." };

    const actualQty = Math.min(quantity, owned);
    const karmaSellBonus = getKarmaTradeSellBonus(state);
    const sellPrice = Math.floor(basePrice * 0.85 * (1 + charmBonus + karmaSellBonus));
    const totalRevenue = sellPrice * actualQty;

    state.money += totalRevenue;
    state.stats.totalEarned += totalRevenue;
    state.inventory[gid] = owned - actualQty;
    if (state.inventory[gid]! <= 0) state.inventoryCosts[gid] = 0;
    // Karma: Meedogenloos rep multiplier
    const repGain = Math.floor(2 * actualQty * getKarmaRepMultiplier(state));
    state.rep += repGain;
    gainXp(state, 2 * actualQty);
    state.stats.tradesCompleted += actualQty;

    // Market pressure: selling lowers prices in this district
    if (!state.marketPressure) state.marketPressure = {};
    if (!state.marketPressure[state.loc]) state.marketPressure[state.loc] = {};
    state.marketPressure[state.loc][gid] = Math.max(-3, (state.marketPressure[state.loc][gid] || 0) - actualQty * 0.1);

    return { success: true, message: `${actualQty}x verkocht voor €${totalRevenue}` };
  }
}

export function gainXp(state: GameState, amount: number): boolean {
  state.player.xp += amount;
  if (state.player.xp >= state.player.nextXp) {
    state.player.xp -= state.player.nextXp;
    state.player.level++;
    state.player.nextXp = Math.floor(state.player.nextXp * 1.4);
    state.player.skillPoints += 2;
    return true;
  }
  return false;
}

export function performSoloOp(state: GameState, opId: string): { success: boolean; message: string } {
  const op = SOLO_OPERATIONS.find(o => o.id === opId);
  if (!op) return { success: false, message: "Operatie niet gevonden." };
  if (state.player.level < op.level) return { success: false, message: "Te laag level." };

  const statVal = getPlayerStat(state, op.stat);
  const isLowrise = state.ownedDistricts.includes('low');
  const effectiveRisk = isLowrise ? Math.floor(op.risk * 0.7) : op.risk;
  const chance = Math.min(95, 100 - effectiveRisk + (statVal * 5));

  // Scale reward with player level (cap at 3x base)
  const scaledReward = Math.floor(op.reward * Math.min(3, 1 + state.player.level * 0.1));

  if (Math.random() * 100 < chance) {
    state.dirtyMoney += scaledReward;
    splitHeat(state, op.heat, 0.4);
    // Karma: Meedogenloos rep multiplier
    const repGain = Math.floor(10 * getKarmaRepMultiplier(state));
    state.rep += repGain;
    state.stats.totalEarned += scaledReward;
    state.stats.missionsCompleted++;
    gainXp(state, 15);
    return { success: true, message: `${op.name} geslaagd! +€${scaledReward.toLocaleString()} zwart geld.` };
  } else {
    splitHeat(state, Math.floor(op.heat * 1.5), 0.3);
    state.stats.missionsFailed++;
    return { success: false, message: `${op.name} mislukt! Extra heat opgelopen.` };
  }
}

export function executeContract(state: GameState, contractId: number, crewIndex: number): { success: boolean; message: string; crewDamage: number; repChange: number } {
  const contract = state.activeContracts.find(c => c.id === contractId);
  if (!contract) return { success: false, message: 'Contract niet gevonden.', crewDamage: 0, repChange: 0 };
  if (crewIndex < 0 || crewIndex >= state.crew.length) return { success: false, message: 'Crewlid niet gevonden.', crewDamage: 0, repChange: 0 };

  const member = state.crew[crewIndex];
  if (member.hp <= 0) return { success: false, message: `${member.name} is te zwaar gewond.`, crewDamage: 0, repChange: 0 };

  let bonus = 0;
  const typeRoleMap: Record<string, string> = {
    delivery: 'Chauffeur',
    combat: 'Enforcer',
    stealth: 'Smokkelaar',
    tech: 'Hacker',
  };
  if (member.role === typeRoleMap[contract.type]) bonus += 25;
  bonus += member.level * 3;
  bonus += Math.floor(member.hp / 20);

  const statMap: Record<string, StatId> = {
    delivery: 'charm',
    combat: 'muscle',
    stealth: 'brains',
    tech: 'brains',
  };
  const relevantStat = getPlayerStat(state, statMap[contract.type] || 'brains');
  bonus += relevantStat * 3;

  const employerRel = state.familyRel[contract.employer] || 0;
  if (employerRel > 30) bonus += 10;

  const successChance = Math.min(95, Math.max(10, 100 - contract.risk + bonus));
  const roll = Math.random() * 100;
  const success = roll < successChance;

  let crewDamage = 0;
  let repChange = 0;

  if (success) {
    state.dirtyMoney += contract.reward;
    splitHeat(state, contract.heat, contract.type === 'delivery' ? 0.8 : 0.3);
    // Karma: Meedogenloos rep multiplier
    const contractRepGain = Math.floor(15 * getKarmaRepMultiplier(state));
    state.rep += contractRepGain;
    repChange = contractRepGain;
    state.stats.totalEarned += contract.reward;
    state.stats.missionsCompleted++;
    gainXp(state, contract.xp);

    // Only change relations with active factions (leader alive & not conquered)
    if (isFactionActive(state, contract.employer)) {
      state.familyRel[contract.employer] = Math.min(100, (state.familyRel[contract.employer] || 0) + 8);
    }
    if (isFactionActive(state, contract.target)) {
      state.familyRel[contract.target] = Math.max(-100, (state.familyRel[contract.target] || 0) - 5);
    }

    member.xp += 10;
    if (member.xp >= 30 * member.level) {
      member.xp = 0;
      member.level = Math.min(10, member.level + 1);
    }

    if (contract.risk > 40) {
      crewDamage = Math.floor(Math.random() * 15) + 5;
      member.hp = Math.max(1, member.hp - crewDamage);
    }
  } else {
    splitHeat(state, Math.floor(contract.heat * 1.5), 0.3);
    let baseDamage = Math.floor(Math.random() * 30) + 15;
    // Karma: Eerbaar crew damage reduction
    const crewProtection = getKarmaCrewProtection(state);
    if (crewProtection > 0) baseDamage = Math.floor(baseDamage * (1 - crewProtection));
    crewDamage = baseDamage;
    member.hp = Math.max(0, member.hp - crewDamage);
    state.stats.missionsFailed++;

    if (isFactionActive(state, contract.employer)) {
      state.familyRel[contract.employer] = Math.max(-100, (state.familyRel[contract.employer] || 0) - 3);
    }
    state.rep = Math.max(0, state.rep - 5);
    repChange = -5;
  }

  state.activeContracts = state.activeContracts.filter(c => c.id !== contractId);

  const memberName = member.name;
  const message = success
    ? `${memberName} voltooit "${contract.name}"! +€${contract.reward} zwart geld, +${contract.xp} XP.${crewDamage > 0 ? ` (${crewDamage} schade opgelopen)` : ''}`
    : `${memberName} faalt bij "${contract.name}"! ${crewDamage} schade opgelopen.${member.hp <= 0 ? ' BEWUSTELOOS!' : ''}`;

  return { success, message, crewDamage, repChange };
}

export function recruit(state: GameState): { success: boolean; message: string } {
  const maxCrew = 6 + getVillaMaxCrewBonus(state);
  if (state.crew.length >= maxCrew) return { success: false, message: `Crew limiet bereikt (Max ${maxCrew}).` };
  if (state.money < 2500) return { success: false, message: "Onvoldoende geld." };

  state.money -= 2500;
  state.stats.totalSpent += 2500;

  // Pick unique name
  const usedNames = state.crew.map(c => c.name);
  const availableNames = CREW_NAMES.filter(n => !usedNames.includes(n));
  const name = availableNames.length > 0
    ? availableNames[Math.floor(Math.random() * availableNames.length)]
    : `Agent-${Math.floor(Math.random() * 999)}`;

  const role = CREW_ROLES[Math.floor(Math.random() * CREW_ROLES.length)] as CrewRole;
  state.crew.push({ name, role, hp: 100, xp: 0, level: 1, specialization: null, loyalty: 75 });
  state.maxInv = recalcMaxInv(state);
  return { success: true, message: `${name} (${role}) gerekruteerd!` };
}

export function healCrew(state: GameState, crewIndex: number): { success: boolean; message: string; cost: number } {
  if (crewIndex < 0 || crewIndex >= state.crew.length) return { success: false, message: 'Crewlid niet gevonden.', cost: 0 };
  const member = state.crew[crewIndex];
  if (member.hp >= 100) return { success: false, message: `${member.name} heeft al volle HP.`, cost: 0 };

  const hpNeeded = 100 - member.hp;
  let costPerHp = 50;
  if (state.ownedDistricts.includes('iron')) costPerHp = Math.floor(costPerHp * 0.8); // Iron Borough perk
  const totalCost = hpNeeded * costPerHp;

  if (state.money < totalCost) return { success: false, message: 'Niet genoeg geld.', cost: totalCost };

  state.money -= totalCost;
  state.stats.totalSpent += totalCost;
  member.hp = 100;
  return { success: true, message: `${member.name} volledig genezen! (-€${totalCost})`, cost: totalCost };
}

export function fireCrew(state: GameState, crewIndex: number): { success: boolean; message: string } {
  if (crewIndex < 0 || crewIndex >= state.crew.length) return { success: false, message: 'Crewlid niet gevonden.' };
  const name = state.crew[crewIndex].name;
  state.crew.splice(crewIndex, 1);
  state.maxInv = recalcMaxInv(state);
  return { success: true, message: `${name} ontslagen.` };
}

// ========== COMBAT SYSTEM ==========
export function startCombat(state: GameState, familyId: FamilyId): CombatState | null {
  const boss = BOSS_DATA[familyId];
  if (!boss) return null;
  if (state.leadersDefeated.includes(familyId)) return null;

  const muscle = getPlayerStat(state, 'muscle');
  const playerMaxHP = 80 + (state.player.level * 5) + (muscle * 3);

  const bossOverride = BOSS_COMBAT_OVERRIDES[familyId];
  const introLines = bossOverride
    ? [...bossOverride.introLines]
    : [`Je staat tegenover ${boss.name}...`, boss.desc];

  return {
    idx: 0,
    targetName: boss.name,
    targetHP: boss.hp,
    enemyMaxHP: boss.hp,
    enemyAttack: boss.attack,
    playerHP: playerMaxHP,
    playerMaxHP,
    logs: introLines,
    isBoss: true,
    familyId,
    stunned: false,
    turn: 0,
    finished: false,
    won: false,
  };
}

export function combatAction(state: GameState, action: 'attack' | 'heavy' | 'defend' | 'environment' | 'tactical'): void {
  const combat = state.activeCombat;
  if (!combat || combat.finished) return;

  combat.turn++;
  const muscle = getPlayerStat(state, 'muscle');
  const brains = getPlayerStat(state, 'brains');
  const charm = getPlayerStat(state, 'charm');
  const baseEnv = COMBAT_ENVIRONMENTS[state.loc];
  const factionBossOverride = combat.isBoss && combat.familyId ? BOSS_COMBAT_OVERRIDES[combat.familyId] : null;
  const finalBossOverride = combat.bossPhase ? FINAL_BOSS_COMBAT_OVERRIDES[combat.bossPhase] : null;
  const override = finalBossOverride || factionBossOverride;
  // Boss override: use boss-specific actions/logs, fallback to district env
  const env = override ? { ...baseEnv, actions: override.actions, enemyAttackLogs: override.enemyAttackLogs } : baseEnv;

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const fmt = (s: string, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce((r, [k, v]) => r.replace(`{${k}}`, String(v)), s);

  // Ammo system
  const hasAmmo = (state.ammo || 0) > 0;
  const hasHeavyAmmo = (state.ammo || 0) >= 2;

  let playerDamage = 0;
  let playerDefenseBonus = 0;
  let stunChance = 0;

  switch (action) {
    case 'attack':
      if (hasAmmo) {
        state.ammo = Math.max(0, (state.ammo || 0) - 1);
        playerDamage = Math.floor(8 + muscle * 2.5 + Math.random() * 6);
        if (env) {
          combat.logs.push(fmt(pick(env.actions.attack.logs), { dmg: playerDamage }) + ' 🔫');
        } else {
          combat.logs.push(`Je slaat toe voor ${playerDamage} schade! 🔫 (-1 kogel)`);
        }
      } else {
        playerDamage = Math.floor((8 + muscle * 2.5 + Math.random() * 6) * 0.5);
        combat.logs.push(`⚠️ Geen kogels! Melee aanval voor ${playerDamage} schade (50%).`);
      }
      break;
    case 'heavy':
      if (hasHeavyAmmo) {
        state.ammo = Math.max(0, (state.ammo || 0) - 2);
        if (Math.random() < 0.6 + (muscle * 0.03)) {
          playerDamage = Math.floor(15 + muscle * 3.5 + Math.random() * 10);
          if (env) {
            combat.logs.push(fmt(pick(env.actions.heavy.logs), { dmg: playerDamage }) + ' 🔫🔫');
          } else {
            combat.logs.push(`ZWARE KLAP! ${playerDamage} schade! 🔫🔫 (-2 kogels)`);
          }
        } else {
          combat.logs.push('Je zware aanval mist! 🔫🔫 (-2 kogels)');
        }
      } else if (hasAmmo) {
        state.ammo = Math.max(0, (state.ammo || 0) - 1);
        playerDamage = Math.floor(8 + muscle * 2.5 + Math.random() * 6);
        combat.logs.push(`⚠️ Te weinig kogels voor zware klap. Normale aanval: ${playerDamage} schade.`);
      } else {
        playerDamage = Math.floor((15 + muscle * 3.5 + Math.random() * 10) * 0.5);
        if (Math.random() < 0.6 + (muscle * 0.03)) {
          combat.logs.push(`⚠️ Geen kogels! Zware melee voor ${playerDamage} schade (50%).`);
        } else {
          combat.logs.push('⚠️ Geen kogels! Je zware melee mist!');
          playerDamage = 0;
        }
      }
      break;
    case 'defend': {
      playerDefenseBonus = 0.6;
      const heal = Math.floor(5 + brains * 1.5);
      combat.playerHP = Math.min(combat.playerMaxHP, combat.playerHP + heal);
      if (env) {
        combat.logs.push(fmt(pick(env.actions.defend.logs), { heal }));
      } else {
        combat.logs.push(`Je verdedigt en herstelt ${heal} HP.`);
      }
      break;
    }
    case 'environment': {
      if (env) {
        stunChance = 0.4 + (brains * 0.05);
        if (Math.random() < stunChance) {
          combat.stunned = true;
          playerDamage = Math.floor(5 + brains * 2);
          combat.logs.push(fmt(pick(env.actions.environment.logs), { dmg: playerDamage }) + ` +${playerDamage} schade.`);
        } else {
          combat.logs.push(`${env.actions.environment.label}... maar het mislukt.`);
        }
      }
      break;
    }
    case 'tactical': {
      if (env) {
        const statMap: Record<string, number> = { muscle, brains, charm };
        const statVal = statMap[env.actions.tactical.stat] || brains;
        const successChance = 0.35 + (statVal * 0.04);
        if (Math.random() < successChance) {
          // Tactical success: heal + stun + small damage
          const tactHeal = Math.floor(10 + statVal * 2);
          playerDamage = Math.floor(5 + statVal * 1.5);
          combat.stunned = true;
          combat.playerHP = Math.min(combat.playerMaxHP, combat.playerHP + tactHeal);
          combat.logs.push(pick(env.actions.tactical.logs));
          combat.logs.push(`✓ Tactiek geslaagd! +${tactHeal} HP, vijand STUNNED, +${playerDamage} schade.`);
        } else {
          combat.logs.push(pick(env.actions.tactical.logs));
          combat.logs.push(`✗ Tactiek mislukt! Je verliest een beurt.`);
        }
      }
      break;
    }
  }

  combat.targetHP = Math.max(0, combat.targetHP - playerDamage);

  // Check if enemy defeated
  if (combat.targetHP <= 0) {
    combat.finished = true;
    combat.won = true;
    combat.logs.push(`${combat.targetName} is verslagen!`);
    if (combat.isNemesis) {
      resolveNemesisDefeat(state);
      const nemReward = 15000 + state.nemesis.generation * 12000;
      combat.logs.push(`+€${nemReward.toLocaleString()} | +${100 + state.nemesis.generation * 50} REP | ${state.nemesis.name} is permanent uitgeschakeld!`);
    } else if (combat.familyId) {
      state.leadersDefeated.push(combat.familyId);
      if (!state.leaderDefeatedDay) state.leaderDefeatedDay = {};
      state.leaderDefeatedDay[combat.familyId] = state.day;
      state.rep += 200;
      state.money += 25000;
      state.stats.totalEarned += 25000;
      state.stats.missionsCompleted++;
      gainXp(state, 100);
      combat.logs.push(`+€25.000 | +200 REP | +100 XP`);
    }
    return;
  }

  // Enemy attack
  if (!combat.stunned) {
    let enemyDamage = Math.floor(combat.enemyAttack * (0.7 + Math.random() * 0.6));
    if (playerDefenseBonus > 0) {
      enemyDamage = Math.floor(enemyDamage * (1 - playerDefenseBonus));
    }
    const armorBonus = getVehicleUpgradeBonus(state, 'armor');
    if (armorBonus > 0) {
      const armorReduction = armorBonus * 0.06;
      enemyDamage = Math.floor(enemyDamage * (1 - armorReduction));
      if (armorReduction >= 0.18) {
        combat.logs.push(`Pantser absorbeert ${Math.round(armorReduction * 100)}% schade.`);
      }
    }
    combat.playerHP = Math.max(0, combat.playerHP - enemyDamage);
    if (env) {
      combat.logs.push(fmt(pick(env.enemyAttackLogs), { name: combat.targetName, dmg: enemyDamage }));
    } else {
      combat.logs.push(`${combat.targetName} slaat terug voor ${enemyDamage} schade!`);
    }
  } else {
    combat.logs.push(`${combat.targetName} is verdoofd en kan niet aanvallen!`);
    combat.stunned = false;
  }

  // Check if player defeated
  if (combat.playerHP <= 0) {
    combat.finished = true;
    combat.won = false;
    combat.logs.push('Je bent verslagen...');
    splitHeat(state, 20, 0.5);
    recomputeHeat(state);
    state.money = Math.max(0, state.money - Math.floor(state.money * 0.1));
    state.stats.missionsFailed++;
    return;
  }
}

export function checkAchievements(state: GameState): string[] {
  const newAchievements: string[] = [];
  ACHIEVEMENTS.forEach(a => {
    if (!state.achievements.includes(a.id) && a.condition(state)) {
      state.achievements.push(a.id);
      newAchievements.push(a.id);
    }
  });
  // Store pending achievements for popup display
  if (newAchievements.length > 0) {
    if (!state.pendingAchievements) state.pendingAchievements = [];
    state.pendingAchievements.push(...newAchievements);
  }
  return newAchievements;
}

export function getRankTitle(rep: number): string {
  if (rep >= 5000) return 'KINGPIN';
  if (rep >= 2000) return 'CRIME LORD';
  if (rep >= 1000) return 'UNDERBOSS';
  if (rep >= 500) return 'CAPO';
  if (rep >= 200) return 'SOLDAAT';
  if (rep >= 50) return 'ASSOCIATE';
  return 'STRAATRAT';
}

// ========== TRADE HELPERS ==========

export function getBestTradeRoute(state: GameState): { good: GoodId; buyDistrict: string; sellDistrict: string; buyPrice: number; sellPrice: number; profit: number } | null {
  let best: { good: GoodId; buyDistrict: string; sellDistrict: string; buyPrice: number; sellPrice: number; profit: number } | null = null;
  let bestProfit = 0;

  GOODS.forEach(g => {
    Object.keys(DISTRICTS).forEach(buyDist => {
      const buyPrice = state.prices[buyDist]?.[g.id] || g.base;
      Object.keys(DISTRICTS).forEach(sellDist => {
        if (buyDist === sellDist) return;
        const sellPrice = Math.floor((state.prices[sellDist]?.[g.id] || g.base) * 0.85);
        const profit = sellPrice - buyPrice;
        if (profit > bestProfit) {
          bestProfit = profit;
          best = { good: g.id as GoodId, buyDistrict: buyDist, sellDistrict: sellDist, buyPrice, sellPrice, profit };
        }
      });
    });
  });

  return best;
}

export function getWashCapacity(state: GameState): { total: number; used: number; remaining: number } {
  let total = 3000 + (state.ownedDistricts.length * 1000);
  state.ownedBusinesses.forEach(bid => {
    const biz = BUSINESSES.find(b => b.id === bid);
    if (biz) total += biz.clean;
  });
  if (state.ownedDistricts.includes('neon')) total = Math.floor(total * 1.2);
  const used = state.washUsedToday || 0;
  return { total, used, remaining: Math.max(0, total - used) };
}

export function getDailyDeal(state: GameState): { item: typeof GEAR[0]; discountedPrice: number; discount: number } | null {
  const availableGear = GEAR.filter(g => {
    if (state.ownedGear.includes(g.id)) return false;
    // Exclude gear with unmet reputation requirements
    if (g.reqRep && (state.familyRel[g.reqRep.f] || 0) < g.reqRep.val) return false;
    return true;
  });
  if (availableGear.length === 0) return null;
  const index = state.day % availableGear.length;
  const item = availableGear[index];
  const discount = 0.3;
  const discountedPrice = Math.floor(item.cost * (1 - discount));
  return { item, discountedPrice, discount };
}

// ========== FACTION SYSTEM ==========

export function getFactionStatus(rel: number): { label: string; color: string } {
  if (rel >= 80) return { label: 'ALLIANTIE', color: 'text-gold' };
  if (rel >= 50) return { label: 'BONDGENOOT', color: 'text-emerald' };
  if (rel >= 20) return { label: 'VRIENDELIJK', color: 'text-emerald' };
  if (rel > -20) return { label: 'NEUTRAAL', color: 'text-muted-foreground' };
  if (rel > -50) return { label: 'VIJANDIG', color: 'text-blood' };
  return { label: 'OORLOG', color: 'text-blood' };
}

export function getFactionPerks(rel: number): typeof FACTION_REWARDS {
  return FACTION_REWARDS.filter(r => rel >= r.minRel);
}

export function performFactionAction(
  state: GameState,
  familyId: FamilyId,
  actionType: FactionActionType
): { success: boolean; message: string } {
  const actionDef = FACTION_ACTIONS.find(a => a.id === actionType);
  if (!actionDef) return { success: false, message: 'Actie niet gevonden.' };

  const fam = FAMILIES[familyId];
  if (!fam) return { success: false, message: 'Factie niet gevonden.' };

  // Check cooldown
  const cooldowns = state.factionCooldowns[familyId] || [];
  if (cooldowns.includes(actionType)) {
    return { success: false, message: 'Je hebt vandaag al een actie uitgevoerd bij deze factie.' };
  }

  // Check district requirement
  if (actionDef.requiresDistrict && state.loc !== fam.home) {
    return { success: false, message: `Je moet in ${DISTRICTS[fam.home].name} zijn.` };
  }

  // Check relation requirements
  const rel = state.familyRel[familyId] || 0;
  if (actionDef.minRelation !== null && rel < actionDef.minRelation) {
    return { success: false, message: `Relatie te laag (min: ${actionDef.minRelation}).` };
  }
  if (actionDef.maxRelation !== null && rel > actionDef.maxRelation) {
    return { success: false, message: `Relatie te hoog (max: ${actionDef.maxRelation}).` };
  }

  // Check if leader is dead
  if (state.leadersDefeated.includes(familyId)) {
    return { success: false, message: 'Leider is verslagen, factie is verzwakt.' };
  }

  let relChange = 0;
  let heatChange = 0;
  let repChange = 0;
  let moneyChange = 0;
  let message = '';

  const charm = getPlayerStat(state, 'charm');
  const muscle = getPlayerStat(state, 'muscle');
  const brains = getPlayerStat(state, 'brains');

  switch (actionType) {
    case 'negotiate': {
      const diplomacyDiscount = getKarmaDiplomacyDiscount(state);
      const cost = Math.max(500, Math.floor((actionDef.baseCost - (charm * 100)) * (1 - diplomacyDiscount)));
      if (state.money < cost) return { success: false, message: `Niet genoeg geld (€${cost} nodig).` };
      moneyChange = -cost;
      relChange = 8 + Math.floor(Math.random() * 8) + Math.floor(charm * 0.5);
      message = `Onderhandeling geslaagd! +${relChange} relatie met ${fam.name}.`;
      break;
    }
    case 'bribe': {
      const diplomacyDiscount = getKarmaDiplomacyDiscount(state);
      const cost = Math.floor((actionDef.baseCost + Math.floor(Math.abs(rel) * 30)) * (1 - diplomacyDiscount));
      if (state.money < cost) return { success: false, message: `Niet genoeg geld (€${cost} nodig).` };
      moneyChange = -cost;
      relChange = 20;
      heatChange = 3;
      message = `${fam.contact} accepteert je geld. +${relChange} relatie.`;
      break;
    }
    case 'intimidate': {
      const karmaIntimBonus = getKarmaIntimidationBonus(state);
      const successChance = 0.5 + (muscle * 0.05) + karmaIntimBonus;
      if (Math.random() < successChance) {
        relChange = -15;
        // Karma: Meedogenloos rep & money multiplier
        const karmaMoneyMult = getKarmaIntimidationMoneyBonus(state);
        const karmaRepMult = getKarmaRepMultiplier(state);
        repChange = Math.floor(15 * karmaRepMult);
        heatChange = 10;
        const extortion = Math.floor((1000 + Math.random() * 2000) * karmaMoneyMult);
        moneyChange = extortion;
        message = `Je intimideert ${fam.contact}. +€${extortion}, +${repChange} REP, -${Math.abs(relChange)} relatie.`;
      } else {
        relChange = -10;
        heatChange = 8;
        message = `Intimidatie mislukt! ${fam.contact} is woedend. -${Math.abs(relChange)} relatie.`;
      }
      break;
    }
    case 'sabotage': {
      const cost = actionDef.baseCost;
      if (state.money < cost) return { success: false, message: `Niet genoeg geld (€${cost} nodig).` };
      const successChance = 0.4 + (brains * 0.06);
      moneyChange = -cost;
      if (Math.random() < successChance) {
        relChange = -25;
        repChange = 20;
        heatChange = 15;
        message = `Sabotage geslaagd! ${fam.name} operaties beschadigd. +${repChange} REP.`;
      } else {
        relChange = -15;
        heatChange = 12;
        message = `Sabotage ontdekt! ${fam.name} weet dat jij het was.`;
      }
      break;
    }
    case 'gift': {
      const giftGood = FACTION_GIFTS[familyId];
      const giftCount = state.inventory[giftGood] || 0;
      if (giftCount < 3) {
        const goodName = GOODS.find(g => g.id === giftGood)?.name || giftGood;
        return { success: false, message: `Je hebt minimaal 3x ${goodName} nodig.` };
      }
      state.inventory[giftGood] = giftCount - 3;
      relChange = 10 + Math.floor(charm * 0.3);
      message = `Gift geaccepteerd door ${fam.contact}! +${relChange} relatie.`;
      break;
    }
    case 'intel': {
      const cost = actionDef.baseCost;
      if (state.money < cost) return { success: false, message: `Niet genoeg geld (€${cost} nodig).` };
      moneyChange = -cost;
      relChange = -2;
      gainXp(state, 15);
      message = `Informatie gekocht van ${fam.name}. Handelsroutes onthuld! +15 XP.`;
      break;
    }
  }

  // Apply effects
  if (moneyChange < 0) {
    if (state.money < Math.abs(moneyChange)) return { success: false, message: 'Niet genoeg geld.' };
    state.money += moneyChange;
    state.stats.totalSpent += Math.abs(moneyChange);
  } else if (moneyChange > 0) {
    state.dirtyMoney += moneyChange;
    state.stats.totalEarned += moneyChange;
  }

  state.familyRel[familyId] = Math.max(-100, Math.min(100, (state.familyRel[familyId] || 0) + relChange));
  state.heat = Math.max(0, Math.min(100, state.heat + heatChange));
  state.rep += repChange;

  // Register cooldown — one action per faction per day
  if (!state.factionCooldowns[familyId]) state.factionCooldowns[familyId] = [];
  state.factionCooldowns[familyId].push(actionType);

  return { success: true, message };
}

function applyFactionWar(state: GameState): void {
  const fearReduction = getKarmaFearReduction(state);
  (Object.keys(FAMILIES) as FamilyId[]).forEach(fid => {
    const rel = state.familyRel[fid] || 0;
    // Defeated or conquered factions cannot wage organized war
    if (!isFactionActive(state, fid)) return;
    if (rel < -50) {
      // Karma: Meedogenloos fear factor reduces faction attacks
      const stealChance = 0.4 * (1 - fearReduction);
      if (Math.random() < stealChance) {
        const goods = Object.keys(state.inventory) as GoodId[];
        const target = goods.find(g => (state.inventory[g] || 0) > 0);
        if (target) {
          const stolen = Math.min(state.inventory[target] || 0, Math.ceil(Math.random() * 3));
          state.inventory[target] = Math.max(0, (state.inventory[target] || 0) - stolen);
        }
      }
      const attackChance = 0.3 * (1 - fearReduction);
      if (Math.random() < attackChance) {
        state.crew.forEach(c => {
          if (c.hp > 0 && Math.random() < 0.4) {
            c.hp = Math.max(1, c.hp - Math.floor(Math.random() * 15 + 5));
          }
        });
      }
    }
  });
}

// ========== FACTION CONQUEST ==========

export function conquerFaction(state: GameState, familyId: FamilyId): { success: boolean; message: string } {
  if (!state.conqueredFactions) state.conqueredFactions = [];
  if (state.conqueredFactions.includes(familyId)) {
    return { success: false, message: 'Factie is al veroverd.' };
  }
  if (!state.leadersDefeated.includes(familyId)) {
    return { success: false, message: 'Versla eerst de leider.' };
  }

  const fam = FAMILIES[familyId];
  state.conqueredFactions.push(familyId);
  state.familyRel[familyId] = 100;
  state.rep += 300;
  gainXp(state, 150);

  // Grant the faction's home district if not owned
  if (!state.ownedDistricts.includes(fam.home)) {
    state.ownedDistricts.push(fam.home);
  }

  return { success: true, message: `${fam.name} is nu jouw vazal! Je krijgt hun thuisdistrict, +€1000/dag passief inkomen, en permanente marktkorting.` };
}

export function annexFaction(state: GameState, familyId: FamilyId): { success: boolean; message: string } {
  if (!state.conqueredFactions) state.conqueredFactions = [];
  if (state.conqueredFactions.includes(familyId)) {
    return { success: false, message: 'Factie is al veroverd.' };
  }

  const rel = state.familyRel[familyId] || 0;
  if (rel < 100) {
    return { success: false, message: 'Relatie moet 100 zijn voor diplomatieke annexatie.' };
  }

  const fam = FAMILIES[familyId];
  const cost = 50000;
  if (state.money < cost) {
    return { success: false, message: `Niet genoeg geld (€${cost.toLocaleString()} nodig).` };
  }

  state.money -= cost;
  state.stats.totalSpent += cost;
  state.conqueredFactions.push(familyId);
  state.rep += 200;
  gainXp(state, 100);

  // Grant the faction's home district if not owned
  if (!state.ownedDistricts.includes(fam.home)) {
    state.ownedDistricts.push(fam.home);
  }

  return { success: true, message: `${fam.name} is diplomatiek geannexeerd! Je krijgt hun thuisdistrict, +€1000/dag passief inkomen, en permanente marktkorting.` };
}
