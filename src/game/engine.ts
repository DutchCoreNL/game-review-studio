import { GameState, DistrictId, GoodId, FamilyId, StatId, ActiveContract, CombatState, CrewRole, NightReportData, RandomEvent, FactionActionType, MapEvent } from './types';
import { DISTRICTS, VEHICLES, GOODS, FAMILIES, CONTRACT_TEMPLATES, GEAR, BUSINESSES, SOLO_OPERATIONS, COMBAT_ENVIRONMENTS, CREW_NAMES, CREW_ROLES, ACHIEVEMENTS, RANDOM_EVENTS, BOSS_DATA, FACTION_ACTIONS, FACTION_GIFTS, FACTION_REWARDS } from './constants';
import { applyNewFeatures, resolveNemesisDefeat } from './newFeatures';

const SAVE_KEY = 'noxhaven_save_v11';

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
  if (state.hqUpgrades.includes('garage')) inv += 10;
  if (state.ownedDistricts.includes('port')) inv = Math.floor(inv * 1.1);
  if (state.crew.some(c => c.role === 'Smokkelaar')) inv += 5;
  return inv;
}

export function generatePrices(state: GameState): void {
  state.prices = {};
  state.districtDemands = {};
  Object.keys(DISTRICTS).forEach(id => {
    state.prices[id] = {};
    state.districtDemands[id] = Math.random() > 0.8 ? GOODS[Math.floor(Math.random() * GOODS.length)].id : null;
    GOODS.forEach(g => {
      const volatility = 0.6 + (Math.random() * 0.8);
      let demandMod = (state.districtDemands[id] === g.id) ? 1.6 : 1.0;
      if (g.faction === 'cartel' && id === 'port' && (state.familyRel['cartel'] || 0) > 60) {
        demandMod = 0.6;
      }
      state.prices[id][g.id] = Math.floor(g.base * volatility * DISTRICTS[id].mods[g.id as GoodId] * demandMod);
      state.priceTrends[g.id] = Math.random() > 0.5 ? 'up' : 'down';
    });
  });
}

export function generateContracts(state: GameState): void {
  state.activeContracts = [];
  for (let i = 0; i < 3; i++) {
    const template = CONTRACT_TEMPLATES[Math.floor(Math.random() * CONTRACT_TEMPLATES.length)];
    const factionKeys = Object.keys(FAMILIES) as FamilyId[];
    const employer = factionKeys[Math.floor(Math.random() * factionKeys.length)];
    let target = factionKeys[Math.floor(Math.random() * factionKeys.length)];
    while (target === employer) target = factionKeys[Math.floor(Math.random() * factionKeys.length)];
    
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

    if (state.heat > 60 && roll < 0.3) {
      type = 'drone';
    } else if (state.heat > 40 && roll < 0.5) {
      type = 'police_checkpoint';
    } else if (Object.values(state.familyRel).some(r => (r || 0) < -30) && roll < 0.6) {
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

  if (state.heat > 70 && events.filter(e => e.type === 'police_checkpoint').length === 0) {
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
      state.crew.forEach(c => {
        if (c.hp > 0) c.hp = Math.max(1, c.hp - Math.floor(Math.random() * 20 + 10));
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
      if (activeV) activeV.condition = Math.max(10, activeV.condition - 25);
      break;
    }
    case 'bonus_money': {
      const bonus = Math.floor(500 + state.day * 100);
      state.money += bonus;
      state.stats.totalEarned += bonus;
      break;
    }
    case 'reduce_heat': {
      state.heat = Math.max(0, state.heat - 25);
      break;
    }
    case 'heal_crew': {
      state.crew.forEach(c => { c.hp = 100; });
      break;
    }
    case 'price_shift':
      // Prices already regenerated — no extra action needed
      break;
    case 'faction_war': {
      const factions = Object.keys(FAMILIES) as FamilyId[];
      const f1 = factions[Math.floor(Math.random() * factions.length)];
      let f2 = factions[Math.floor(Math.random() * factions.length)];
      while (f2 === f1) f2 = factions[Math.floor(Math.random() * factions.length)];
      state.familyRel[f1] = Math.max(-100, (state.familyRel[f1] || 0) - 10);
      state.familyRel[f2] = Math.max(-100, (state.familyRel[f2] || 0) - 10);
      break;
    }
  }
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
    policeRaid: false,
    policeFine: 0,
    crewHealing: 0,
    vehicleDecay: [],
    randomEvent: null,
  };

  const heatBefore = state.heat;

  // Lab production (storm gives +50% output, not double)
  const labMultiplier = state.weather === 'storm' ? 1.5 : 1;
  if (state.hqUpgrades.includes('lab') && state.lab.chemicals > 0) {
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
      state.heat += 4;
    }
  }

  state.day++;
  state.stats.daysPlayed++;

  // District income
  report.districtIncome = state.ownedDistricts.reduce((s, id) => s + DISTRICTS[id].income, 0);
  
  // Business income & washing
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

  state.money += report.districtIncome + report.businessIncome;
  state.stats.totalEarned += report.districtIncome + report.businessIncome;

  // Heat decay
  let heatDecay = 5;
  if (state.ownedDistricts.includes('crown')) heatDecay += Math.floor(heatDecay * 0.2);
  if (state.hqUpgrades.includes('server')) heatDecay += 10;
  if (state.crew.some(c => c.role === 'Hacker')) heatDecay += 3;
  state.heat = Math.max(0, state.heat - heatDecay);

  // Police heat check
  if (state.heat > 70 && Math.random() < 0.3 && state.policeRel < 50) {
    const fine = Math.floor(state.money * 0.1);
    state.money -= fine;
    state.heat = Math.max(0, state.heat - 20);
    report.policeRaid = true;
    report.policeFine = fine;
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
  state.crew.forEach(c => {
    if (c.hp < 100 && c.hp > 0) {
      const heal = Math.floor(Math.random() * 5) + 3; // 3-7 HP per night
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

  report.heatChange = state.heat - heatBefore;

  // Track price history before regenerating
  if (!state.priceHistory) state.priceHistory = {};
  Object.keys(state.prices).forEach(distId => {
    if (!state.priceHistory[distId]) state.priceHistory[distId] = {};
    Object.keys(state.prices[distId]).forEach(gid => {
      if (!state.priceHistory[distId][gid]) state.priceHistory[distId][gid] = [];
      state.priceHistory[distId][gid].push(state.prices[distId][gid]);
      if (state.priceHistory[distId][gid].length > 5) {
        state.priceHistory[distId][gid] = state.priceHistory[distId][gid].slice(-5);
      }
    });
  });

  // Reset daily wash counter
  state.washUsedToday = 0;

  // Reset faction cooldowns
  state.factionCooldowns = { cartel: [], syndicate: [], bikers: [] };

  // Apply faction war effects for hostile factions
  applyFactionWar(state);

  // Faction alliance passive income (both high-rel and conquered)
  (Object.keys(FAMILIES) as FamilyId[]).forEach(fid => {
    const rel = state.familyRel[fid] || 0;
    const isConquered = state.conqueredFactions?.includes(fid);
    if (rel >= 80 || isConquered) {
      const income = isConquered ? 1000 : 500;
      state.money += income;
      state.stats.totalEarned += income;
      report.businessIncome += income;
    }
  });

  generatePrices(state);
  generateContracts(state);
  generateMapEvents(state);

  // Apply all new feature logic (weather, district rep, nemesis, defense, smuggling, phone)
  applyNewFeatures(state, report);

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
    if (state.heat > 50) buyPrice = Math.floor(buyPrice * 1.2);

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

    return { success: true, message: `${actualQty}x ${GOODS.find(g => g.id === gid)?.name} gekocht voor €${totalCost}` };
  } else {
    const owned = state.inventory[gid] || 0;
    if (owned <= 0) return { success: false, message: "Niet op voorraad." };

    const actualQty = Math.min(quantity, owned);
    const sellPrice = Math.floor(basePrice * 0.85 * (1 + charmBonus));
    const totalRevenue = sellPrice * actualQty;

    state.money += totalRevenue;
    state.stats.totalEarned += totalRevenue;
    state.inventory[gid] = owned - actualQty;
    if (state.inventory[gid]! <= 0) state.inventoryCosts[gid] = 0;
    state.rep += 2 * actualQty;
    gainXp(state, 2 * actualQty);
    state.stats.tradesCompleted += actualQty;

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

  if (Math.random() * 100 < chance) {
    state.dirtyMoney += op.reward;
    state.heat += op.heat;
    state.rep += 10;
    state.stats.totalEarned += op.reward;
    state.stats.missionsCompleted++;
    gainXp(state, 15);
    return { success: true, message: `${op.name} geslaagd! +€${op.reward} zwart geld.` };
  } else {
    state.heat += Math.floor(op.heat * 1.5);
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
    state.heat += contract.heat;
    state.rep += 15;
    repChange = 15;
    state.stats.totalEarned += contract.reward;
    state.stats.missionsCompleted++;
    gainXp(state, contract.xp);

    state.familyRel[contract.employer] = Math.min(100, (state.familyRel[contract.employer] || 0) + 8);
    state.familyRel[contract.target] = Math.max(-100, (state.familyRel[contract.target] || 0) - 5);

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
    state.heat += Math.floor(contract.heat * 1.5);
    crewDamage = Math.floor(Math.random() * 30) + 15;
    member.hp = Math.max(0, member.hp - crewDamage);
    state.stats.missionsFailed++;

    state.familyRel[contract.employer] = Math.max(-100, (state.familyRel[contract.employer] || 0) - 3);
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
  if (state.crew.length >= 6) return { success: false, message: "Crew limiet bereikt (Max 6)." };
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
  state.crew.push({ name, role, hp: 100, xp: 0, level: 1, specialization: null });
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

  return {
    idx: 0,
    targetName: boss.name,
    targetHP: boss.hp,
    enemyMaxHP: boss.hp,
    enemyAttack: boss.attack,
    playerHP: playerMaxHP,
    playerMaxHP,
    logs: [`Je staat tegenover ${boss.name}...`, boss.desc],
    isBoss: true,
    familyId,
    stunned: false,
    turn: 0,
    finished: false,
    won: false,
  };
}

export function combatAction(state: GameState, action: 'attack' | 'heavy' | 'defend' | 'environment'): void {
  const combat = state.activeCombat;
  if (!combat || combat.finished) return;

  combat.turn++;
  const muscle = getPlayerStat(state, 'muscle');
  const brains = getPlayerStat(state, 'brains');

  // Player action
  let playerDamage = 0;
  let playerDefenseBonus = 0;
  let stunChance = 0;

  switch (action) {
    case 'attack':
      playerDamage = Math.floor(8 + muscle * 2.5 + Math.random() * 6);
      combat.logs.push(`Je slaat toe voor ${playerDamage} schade!`);
      break;
    case 'heavy':
      if (Math.random() < 0.6 + (muscle * 0.03)) {
        playerDamage = Math.floor(15 + muscle * 3.5 + Math.random() * 10);
        combat.logs.push(`ZWARE KLAP! ${playerDamage} schade!`);
      } else {
        combat.logs.push('Je zware aanval mist!');
      }
      break;
    case 'defend':
      playerDefenseBonus = 0.6;
      const heal = Math.floor(5 + brains * 1.5);
      combat.playerHP = Math.min(combat.playerMaxHP, combat.playerHP + heal);
      combat.logs.push(`Je verdedigt en herstelt ${heal} HP.`);
      break;
    case 'environment': {
      const env = COMBAT_ENVIRONMENTS[state.loc];
      if (env) {
        stunChance = 0.4 + (brains * 0.05);
        if (Math.random() < stunChance) {
          combat.stunned = true;
          playerDamage = Math.floor(5 + brains * 2);
          combat.logs.push(`${env.log} STUNNED! +${playerDamage} schade.`);
        } else {
          combat.logs.push(`${env.log} ...maar het mislukt.`);
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
      combat.logs.push(`+€${(15000 + state.nemesis.defeated * 10000).toLocaleString()} | +150 REP`);
    } else if (combat.familyId) {
      state.leadersDefeated.push(combat.familyId);
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
    combat.playerHP = Math.max(0, combat.playerHP - enemyDamage);
    combat.logs.push(`${combat.targetName} slaat terug voor ${enemyDamage} schade!`);
  } else {
    combat.logs.push(`${combat.targetName} is verdoofd en kan niet aanvallen!`);
    combat.stunned = false;
  }

  // Check if player defeated
  if (combat.playerHP <= 0) {
    combat.finished = true;
    combat.won = false;
    combat.logs.push('Je bent verslagen...');
    state.heat += 20;
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
      const cost = Math.max(500, actionDef.baseCost - (charm * 100));
      if (state.money < cost) return { success: false, message: `Niet genoeg geld (€${cost} nodig).` };
      moneyChange = -cost;
      relChange = 8 + Math.floor(Math.random() * 8) + Math.floor(charm * 0.5);
      message = `Onderhandeling geslaagd! +${relChange} relatie met ${fam.name}.`;
      break;
    }
    case 'bribe': {
      const cost = actionDef.baseCost + Math.floor(Math.abs(rel) * 30);
      if (state.money < cost) return { success: false, message: `Niet genoeg geld (€${cost} nodig).` };
      moneyChange = -cost;
      relChange = 20;
      heatChange = 3;
      message = `${fam.contact} accepteert je geld. +${relChange} relatie.`;
      break;
    }
    case 'intimidate': {
      const successChance = 0.5 + (muscle * 0.05);
      if (Math.random() < successChance) {
        relChange = -15;
        repChange = 15;
        heatChange = 10;
        const extortion = Math.floor(1000 + Math.random() * 2000);
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
  (Object.keys(FAMILIES) as FamilyId[]).forEach(fid => {
    const rel = state.familyRel[fid] || 0;
    const isConquered = state.conqueredFactions?.includes(fid);
    if (rel < -50 && !isConquered) {
      if (Math.random() < 0.4) {
        const goods = Object.keys(state.inventory) as GoodId[];
        const target = goods.find(g => (state.inventory[g] || 0) > 0);
        if (target) {
          const stolen = Math.min(state.inventory[target] || 0, Math.ceil(Math.random() * 3));
          state.inventory[target] = Math.max(0, (state.inventory[target] || 0) - stolen);
        }
      }
      if (Math.random() < 0.3) {
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
