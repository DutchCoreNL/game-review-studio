import { GameState, DistrictId, GoodId, FamilyId, StatId, ActiveContract, CombatState, CrewRole } from './types';
import { DISTRICTS, VEHICLES, GOODS, FAMILIES, CONTRACT_TEMPLATES, GEAR, BUSINESSES, SOLO_OPERATIONS, COMBAT_ENVIRONMENTS, CREW_NAMES, CREW_ROLES, ACHIEVEMENTS } from './constants';

const SAVE_KEY = 'noxhaven_save_v8';

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Save failed:', e);
  }
}

export function loadGame(): GameState | null {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    return data ? JSON.parse(data) : null;
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
      reward: Math.floor(template.rewardBase * (1 + (state.day * 0.05))),
      xp: 35 + (state.day * 2)
    });
  }
}

export function endTurn(state: GameState): { labYield: number; report: string } {
  let labYield = 0;
  if (state.hqUpgrades.includes('lab') && state.lab.chemicals > 0) {
    const currentInv = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
    const space = state.maxInv - currentInv;
    if (space > 0) {
      const batchSize = Math.min(state.lab.chemicals, 20, space);
      state.lab.chemicals -= batchSize;
      const existingCount = state.inventory.drugs || 0;
      const existingCost = state.inventoryCosts.drugs || 0;
      const baseCost = GOODS.find(g => g.id === 'drugs')!.base * 0.5;
      const totalQty = existingCount + batchSize;
      state.inventoryCosts.drugs = totalQty > 0 ? Math.floor(((existingCount * existingCost) + (batchSize * baseCost)) / totalQty) : baseCost;
      state.inventory.drugs = totalQty;
      labYield = batchSize;
      state.heat += 4;
    }
  }

  state.day++;
  const districtInc = state.ownedDistricts.reduce((s, id) => s + DISTRICTS[id].income, 0);
  let businessInc = 0;
  let totalWashed = 0;
  state.ownedBusinesses.forEach(bid => {
    const biz = BUSINESSES.find(b => b.id === bid);
    if (biz) {
      businessInc += biz.income;
      let washAmount = Math.min(state.dirtyMoney, biz.clean);
      if (state.ownedDistricts.includes('neon')) washAmount = Math.floor(washAmount * 1.2);
      state.dirtyMoney -= washAmount;
      state.money += Math.floor(washAmount * 0.85);
      totalWashed += washAmount;
    }
  });

  state.money += districtInc + businessInc;

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
  }

  // Debt interest
  if (state.debt > 0) {
    state.debt = Math.floor(state.debt * 1.03);
  }

  generatePrices(state);
  generateContracts(state);
  state.maxInv = recalcMaxInv(state);

  const report = `Dag ${state.day}: +€${districtInc + businessInc} inkomen`;
  return { labYield, report };
}

export function performTrade(state: GameState, gid: GoodId, mode: 'buy' | 'sell'): { success: boolean; message: string } {
  const basePrice = state.prices[state.loc]?.[gid] || 0;
  const totalCharm = getPlayerStat(state, 'charm');
  const charmBonus = (totalCharm * 0.02) + (state.rep / 5000);

  if (mode === 'buy') {
    const invCount = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
    if (invCount >= state.maxInv) return { success: false, message: "Kofferbak vol." };

    let buyPrice = basePrice;
    const good = GOODS.find(g => g.id === gid);
    if (good?.faction && (state.familyRel[good.faction] || 0) > 50) {
      buyPrice = Math.floor(buyPrice * 0.7);
    }
    if (state.heat > 50) buyPrice = Math.floor(buyPrice * 1.2);
    if (state.money < buyPrice) return { success: false, message: "Te weinig kapitaal." };

    state.money -= buyPrice;
    const currentCount = state.inventory[gid] || 0;
    const currentCost = state.inventoryCosts[gid] || 0;
    const totalQty = currentCount + 1;
    state.inventoryCosts[gid] = totalQty > 0 ? Math.floor(((currentCount * currentCost) + buyPrice) / totalQty) : buyPrice;
    state.inventory[gid] = (state.inventory[gid] || 0) + 1;

    return { success: true, message: `${GOODS.find(g => g.id === gid)?.name} gekocht voor €${buyPrice}` };
  } else {
    if (!state.inventory[gid] || state.inventory[gid]! <= 0) return { success: false, message: "Niet op voorraad." };
    const sellPrice = Math.floor(basePrice * 0.85 * (1 + charmBonus));
    state.money += sellPrice;
    state.inventory[gid] = state.inventory[gid]! - 1;
    if (state.inventory[gid]! <= 0) state.inventoryCosts[gid] = 0;
    state.rep += 2;
    gainXp(state, 2);
    return { success: true, message: `Verkocht voor €${sellPrice}` };
  }
}

export function gainXp(state: GameState, amount: number): boolean {
  state.player.xp += amount;
  if (state.player.xp >= state.player.nextXp) {
    state.player.xp -= state.player.nextXp;
    state.player.level++;
    state.player.nextXp = Math.floor(state.player.nextXp * 1.4);
    state.player.skillPoints += 2;
    return true; // leveled up
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
    gainXp(state, 15);
    return { success: true, message: `${op.name} geslaagd! +€${op.reward} zwart geld.` };
  } else {
    state.heat += Math.floor(op.heat * 1.5);
    return { success: false, message: `${op.name} mislukt! Extra heat opgelopen.` };
  }
}

export function executeContract(state: GameState, contractId: number, crewIndex: number): { success: boolean; message: string; crewDamage: number; repChange: number } {
  const contract = state.activeContracts.find(c => c.id === contractId);
  if (!contract) return { success: false, message: 'Contract niet gevonden.', crewDamage: 0, repChange: 0 };
  if (crewIndex < 0 || crewIndex >= state.crew.length) return { success: false, message: 'Crewlid niet gevonden.', crewDamage: 0, repChange: 0 };

  const member = state.crew[crewIndex];
  if (member.hp <= 0) return { success: false, message: `${member.name} is te zwaar gewond.`, crewDamage: 0, repChange: 0 };

  // Calculate success chance based on contract type and crew role
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

  // Player stats also help
  const statMap: Record<string, StatId> = {
    delivery: 'charm',
    combat: 'muscle',
    stealth: 'brains',
    tech: 'brains',
  };
  const relevantStat = getPlayerStat(state, statMap[contract.type] || 'brains');
  bonus += relevantStat * 3;

  // Faction relationship bonus
  const employerRel = state.familyRel[contract.employer] || 0;
  if (employerRel > 30) bonus += 10;

  const successChance = Math.min(95, Math.max(10, 100 - contract.risk + bonus));
  const roll = Math.random() * 100;
  const success = roll < successChance;

  let crewDamage = 0;
  let repChange = 0;

  if (success) {
    // Rewards
    state.dirtyMoney += contract.reward;
    state.heat += contract.heat;
    state.rep += 15;
    repChange = 15;
    gainXp(state, contract.xp);

    // Faction relations
    state.familyRel[contract.employer] = Math.min(100, (state.familyRel[contract.employer] || 0) + 8);
    state.familyRel[contract.target] = Math.max(-100, (state.familyRel[contract.target] || 0) - 5);

    // Crew XP
    member.xp += 10;
    if (member.xp >= 30 * member.level) {
      member.xp = 0;
      member.level = Math.min(10, member.level + 1);
    }

    // Small crew damage on risky missions
    if (contract.risk > 40) {
      crewDamage = Math.floor(Math.random() * 15) + 5;
      member.hp = Math.max(1, member.hp - crewDamage);
    }
  } else {
    // Failure consequences
    state.heat += Math.floor(contract.heat * 1.5);
    crewDamage = Math.floor(Math.random() * 30) + 15;
    member.hp = Math.max(0, member.hp - crewDamage);

    // Faction rep hit
    state.familyRel[contract.employer] = Math.max(-100, (state.familyRel[contract.employer] || 0) - 3);
    state.rep = Math.max(0, state.rep - 5);
    repChange = -5;
  }

  // Remove the contract
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
  const name = CREW_NAMES[Math.floor(Math.random() * CREW_NAMES.length)];
  const role = CREW_ROLES[Math.floor(Math.random() * CREW_ROLES.length)] as CrewRole;
  state.crew.push({ name, role, hp: 100, xp: 0, level: 1 });
  state.maxInv = recalcMaxInv(state);
  return { success: true, message: `${name} (${role}) gerekruteerd!` };
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
