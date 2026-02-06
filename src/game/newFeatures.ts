/**
 * New feature engine functions for Noxhaven
 * Weather, District Rep, Crew Specs, Smuggle Routes, Territory Defense, Nemesis, Phone
 */

import { GameState, DistrictId, GoodId, FamilyId, WeatherType, NemesisState, SmuggleRoute, PhoneMessage, NightReportData } from './types';
import { DISTRICTS, GOODS, FAMILIES, NEMESIS_NAMES, PHONE_CONTACTS, DISTRICT_REP_PERKS } from './constants';

// ========== 1. WEATHER SYSTEM ==========

export function generateWeather(state: GameState): WeatherType {
  const types: WeatherType[] = ['clear', 'clear', 'rain', 'fog', 'heatwave', 'storm'];
  // Weighted: clear is more common, storm is rare
  const weights = [25, 25, 20, 15, 10, 5];
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < types.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return types[i];
  }
  return 'clear';
}

export function applyWeatherEffects(state: GameState, report: NightReportData): void {
  switch (state.weather) {
    case 'rain':
      state.heat = Math.max(0, state.heat - 5);
      report.heatChange -= 5;
      break;
    case 'heatwave':
      state.heat = Math.min(100, state.heat + 3);
      report.heatChange += 3;
      // Crew loses HP
      state.crew.forEach(c => {
        if (c.hp > 0) c.hp = Math.max(1, c.hp - 5);
      });
      break;
    case 'storm':
      // Double lab output handled in endTurn lab section
      break;
    case 'fog':
      // Effects applied in mission/trade checks
      break;
  }
}

// ========== 2. DISTRICT REPUTATION ==========

export function updateDistrictRep(state: GameState): void {
  // Owned districts gain rep passively
  state.ownedDistricts.forEach(id => {
    state.districtRep[id] = Math.min(100, (state.districtRep[id] || 0) + 2);
  });

  // High heat in current district loses rep
  if (state.heat > 70) {
    state.districtRep[state.loc] = Math.max(0, (state.districtRep[state.loc] || 0) - 3);
  }
}

export function getDistrictRepBonus(state: GameState, districtId: DistrictId): number {
  return state.districtRep?.[districtId] || 0;
}

export function hasDistrictPerk(state: GameState, districtId: DistrictId, threshold: number): boolean {
  return (state.districtRep?.[districtId] || 0) >= threshold;
}

// ========== 3. NEMESIS SYSTEM ==========

export function updateNemesis(state: GameState, report: NightReportData): void {
  const nem = state.nemesis;
  if (!nem) return;

  // Cooldown handling
  if (nem.cooldown > 0) {
    nem.cooldown--;
    if (nem.cooldown === 0) {
      // Nemesis returns stronger
      nem.hp = nem.maxHp;
      nem.power = Math.min(100, nem.power + 10);
      nem.maxHp = 80 + nem.defeated * 30 + state.day * 2;
      nem.hp = nem.maxHp;
      addPhoneMessage(state, 'nemesis', `Ik ben terug. Sterker dan ooit. - ${nem.name}`, 'threat');
    }
    report.nemesisAction = `${nem.name} herstelt... (${nem.cooldown} dagen)`;
    return;
  }

  // Scale power with player
  nem.power = Math.min(100, 10 + state.day + state.player.level * 2 + nem.defeated * 8);

  // Nemesis moves
  const districts: DistrictId[] = ['port', 'crown', 'iron', 'low', 'neon'];
  if (Math.random() < 0.4) {
    nem.location = districts[Math.floor(Math.random() * districts.length)];
  }

  // Nemesis actions (1-2 per day)
  const actions: string[] = [];
  const actionCount = 1 + (Math.random() < 0.3 ? 1 : 0);

  for (let i = 0; i < actionCount; i++) {
    const roll = Math.random();
    if (roll < 0.3) {
      // Market manipulation
      const district = districts[Math.floor(Math.random() * districts.length)];
      if (state.prices[district]) {
        const goods = Object.keys(state.prices[district]);
        const good = goods[Math.floor(Math.random() * goods.length)];
        const shift = Math.random() < 0.5 ? 0.7 : 1.4;
        state.prices[district][good] = Math.floor(state.prices[district][good] * shift);
      }
      actions.push('manipuleert de markt');
    } else if (roll < 0.5) {
      // Sabotage (steal goods)
      if (Math.random() < 0.2 + nem.power / 200) {
        const goods = Object.keys(state.inventory) as GoodId[];
        const target = goods.find(g => (state.inventory[g] || 0) > 0);
        if (target) {
          const stolen = Math.min(state.inventory[target] || 0, Math.ceil(Math.random() * 2));
          state.inventory[target] = Math.max(0, (state.inventory[target] || 0) - stolen);
          actions.push(`steelt ${stolen}x voorraad`);
          addPhoneMessage(state, 'anonymous', `Iemand heeft je goederen gestolen. ${nem.name} wordt verdacht.`, 'warning');
        }
      }
    } else if (roll < 0.7) {
      // Faction influence
      const factions = Object.keys(FAMILIES) as FamilyId[];
      const fid = factions[Math.floor(Math.random() * factions.length)];
      state.familyRel[fid] = Math.max(-100, (state.familyRel[fid] || 0) - 3);
      actions.push(`beïnvloedt ${FAMILIES[fid].name} tegen je`);
    } else {
      // Territory claim attempt on unowned district
      const unowned = districts.filter(d => !state.ownedDistricts.includes(d));
      if (unowned.length > 0) {
        actions.push('breidt invloed uit');
      }
    }
  }

  nem.lastAction = actions.join(', ') || 'houdt zich gedeisd';
  report.nemesisAction = `${nem.name}: ${nem.lastAction}`;
}

export function startNemesisCombat(state: GameState): import('./types').CombatState | null {
  const nem = state.nemesis;
  if (!nem || nem.cooldown > 0 || state.loc !== nem.location) return null;

  const muscle = state.player.stats.muscle;
  const playerMaxHP = 80 + (state.player.level * 5) + (muscle * 3);

  return {
    idx: 0,
    targetName: nem.name,
    targetHP: nem.hp,
    enemyMaxHP: nem.maxHp,
    enemyAttack: Math.floor(12 + nem.power * 0.15 + nem.defeated * 3),
    playerHP: playerMaxHP,
    playerMaxHP,
    logs: [`Je staat tegenover ${nem.name}...`, `Power Level: ${nem.power}`],
    isBoss: false,
    familyId: null,
    stunned: false,
    turn: 0,
    finished: false,
    won: false,
    isNemesis: true,
  };
}

export function resolveNemesisDefeat(state: GameState): void {
  const nem = state.nemesis;
  nem.defeated++;
  nem.cooldown = 5;
  const reward = 15000 + nem.defeated * 10000;
  state.money += reward;
  state.rep += 150;
  state.stats.totalEarned += reward;
  addPhoneMessage(state, 'anonymous', `${nem.name} is verslagen! +€${reward.toLocaleString()} buit.`, 'opportunity');
}

// ========== 4. TERRITORY DEFENSE ==========

export function resolveDistrictAttacks(state: GameState, report: NightReportData): void {
  if (!report.defenseResults) report.defenseResults = [];

  state.ownedDistricts.forEach(distId => {
    // Base attack chance: 15% + day/200 + heat/200
    const attackChance = 0.15 + state.day / 200 + state.heat / 200;
    if (Math.random() > attackChance) {
      return; // No attack tonight
    }

    const def = state.districtDefenses[distId];
    if (!def) return;

    // Calculate defense level
    let defenseLevel = def.level;
    defenseLevel += def.stationedCrew.length * 20;
    if (def.wallUpgrade) defenseLevel += 30;
    if (def.turretUpgrade) defenseLevel += 20;

    // Faction alliance bonus
    const localFaction = Object.values(FAMILIES).find(f => f.home === distId);
    if (localFaction && (state.familyRel[localFaction.id] || 0) >= 50) {
      defenseLevel += 15;
    }

    // Attack strength scales with day
    const attackStrength = 20 + Math.floor(Math.random() * 40) + Math.floor(state.day * 0.5);

    const won = defenseLevel >= attackStrength;

    if (won) {
      state.rep += 10;
      state.districtRep[distId] = Math.min(100, (state.districtRep[distId] || 0) + 5);
      // Stationed crew gain XP
      def.stationedCrew.forEach(ci => {
        if (state.crew[ci]) {
          state.crew[ci].xp += 5;
        }
      });
      report.defenseResults.push({
        district: distId,
        attacked: true,
        won: true,
        details: `${DISTRICTS[distId].name} verdedigd! (${defenseLevel} vs ${attackStrength})`,
      });
    } else {
      // Lost district
      state.ownedDistricts = state.ownedDistricts.filter(d => d !== distId);
      state.rep = Math.max(0, state.rep - 30);
      const moneyLoss = Math.floor(state.money * 0.05);
      state.money = Math.max(0, state.money - moneyLoss);
      // Clear defense
      def.stationedCrew = [];
      def.level = 0;
      report.defenseResults.push({
        district: distId,
        attacked: true,
        won: false,
        details: `${DISTRICTS[distId].name} verloren! (${defenseLevel} vs ${attackStrength}) -€${moneyLoss.toLocaleString()}`,
      });
      addPhoneMessage(state, 'anonymous', `Je bent ${DISTRICTS[distId].name} kwijtgeraakt na een aanval!`, 'threat');
    }
  });
}

// ========== 5. SMUGGLE ROUTES ==========

export function processSmuggleRoutes(state: GameState, report: NightReportData): void {
  if (!report.smuggleResults) report.smuggleResults = [];

  state.smuggleRoutes = state.smuggleRoutes.filter(route => {
    if (!route.active) return true;

    route.daysActive++;

    // Calculate income based on price difference
    const buyPrice = state.prices[route.from]?.[route.good] || GOODS.find(g => g.id === route.good)!.base;
    const sellPrice = state.prices[route.to]?.[route.good] || GOODS.find(g => g.id === route.good)!.base;
    const income = Math.max(100, Math.floor((sellPrice - buyPrice) * 0.6));

    // Interception chance
    let interceptChance = 0.10 + state.heat / 200;
    // Smokkelaar crew reduces risk
    if (state.crew.some(c => c.role === 'Smokkelaar')) interceptChance -= 0.05;
    if (state.crew.some(c => c.specialization === 'ghost')) interceptChance -= 0.05;
    // Port Nero ownership reduces risk
    if (state.ownedDistricts.includes('port')) interceptChance -= 0.03;
    // Police relation helps
    interceptChance -= state.policeRel / 500;
    interceptChance = Math.max(0.02, interceptChance);

    if (Math.random() < interceptChance) {
      // Intercepted!
      state.heat += 15;
      const fine = Math.floor(income * 3);
      state.money = Math.max(0, state.money - fine);
      report.smuggleResults!.push({
        routeId: route.id,
        good: route.good,
        income: -fine,
        intercepted: true,
      });
      addPhoneMessage(state, 'courier', `Route ${DISTRICTS[route.from].name} → ${DISTRICTS[route.to].name} onderschept! -€${fine.toLocaleString()}`, 'warning');
      return false; // Remove route
    }

    // Success
    state.money += income;
    state.stats.totalEarned += income;
    state.districtRep[route.from] = Math.min(100, (state.districtRep[route.from] || 0) + 1);
    state.districtRep[route.to] = Math.min(100, (state.districtRep[route.to] || 0) + 1);
    report.smuggleResults!.push({
      routeId: route.id,
      good: route.good,
      income,
      intercepted: false,
    });
    return true; // Keep route
  });
}

// ========== 6. PHONE/MESSAGE SYSTEM ==========\\

export function addPhoneMessage(
  state: GameState,
  contactKey: string,
  text: string,
  type: PhoneMessage['type'] = 'info'
): void {
  const contact = PHONE_CONTACTS[contactKey] || { name: contactKey, avatar: '📱' };
  const msg: PhoneMessage = {
    id: `msg-${state.day}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    from: contact.name,
    avatar: contact.avatar,
    text,
    day: state.day,
    read: false,
    type,
  };
  state.phone.messages.unshift(msg);
  state.phone.unread++;

  // Keep max 20 messages
  if (state.phone.messages.length > 20) {
    state.phone.messages = state.phone.messages.slice(0, 20);
  }
}

export function generateDailyMessages(state: GameState): void {
  // Weather message
  if (state.weather !== 'clear') {
    const weatherNames: Record<WeatherType, string> = {
      clear: 'Helder', rain: 'Regen', fog: 'Mist', heatwave: 'Hittegolf', storm: 'Storm',
    };
    addPhoneMessage(state, 'weather', `Weerbericht: ${weatherNames[state.weather]} verwacht vandaag.`, 'info');
  }

  // Heat warning
  if (state.heat > 60) {
    addPhoneMessage(state, 'anonymous', 'De politie is op je pad. Lig laag.', 'warning');
  }

  // Demand tip (random)
  if (Math.random() < 0.4) {
    const districtKeys = Object.keys(state.districtDemands) as DistrictId[];
    const withDemand = districtKeys.find(d => state.districtDemands[d]);
    if (withDemand && state.districtDemands[withDemand]) {
      const goodName = GOODS.find(g => g.id === state.districtDemands[withDemand])?.name;
      if (goodName) {
        addPhoneMessage(state, 'informant', `Hoge vraag op ${goodName} in ${DISTRICTS[withDemand].name} vandaag.`, 'opportunity');
      }
    }
  }

  // Faction messages
  (Object.keys(FAMILIES) as FamilyId[]).forEach(fid => {
    const rel = state.familyRel[fid] || 0;
    if (rel >= 50 && Math.random() < 0.2) {
      addPhoneMessage(state, 'informant', `${FAMILIES[fid].contact} heeft een speciaal contract voor je. Check je missies.`, 'opportunity');
    }
  });

  // Nemesis taunt
  if (state.nemesis && state.nemesis.cooldown === 0 && Math.random() < 0.25) {
    const taunts = [
      `Geniet ervan zolang het duurt. - ${state.nemesis.name}`,
      `Ik kom voor je. - ${state.nemesis.name}`,
      `Die straten zijn niet groot genoeg voor ons beiden. - ${state.nemesis.name}`,
      `Hoorde dat je zaken goed gaan. Dat verandert snel. - ${state.nemesis.name}`,
    ];
    addPhoneMessage(state, 'nemesis', taunts[Math.floor(Math.random() * taunts.length)], 'threat');
  }
}

// ========== 7. CREW SPECIALIZATION CHECK ==========\\

export function checkCrewSpecialization(state: GameState): void {
  const specLevels = [3, 5, 7, 9];
  for (let i = 0; i < state.crew.length; i++) {
    const c = state.crew[i];
    if (!c.specialization && specLevels.includes(c.level)) {
      state.pendingSpecChoice = { crewIndex: i, level: c.level };
      return; // Only one at a time
    }
  }
}

// ========== INTEGRATED END-TURN FEATURES ==========

export function applyNewFeatures(state: GameState, report: NightReportData): void {
  // 1. Weather effects
  applyWeatherEffects(state, report);

  // 2. District reputation
  updateDistrictRep(state);

  // 3. Smuggle routes
  processSmuggleRoutes(state, report);

  // 4. Territory defense
  resolveDistrictAttacks(state, report);

  // 5. Nemesis
  updateNemesis(state, report);

  // 6. Generate new weather for next day
  const newWeather = generateWeather(state);
  report.weatherChange = newWeather;
  state.weather = newWeather;

  // 7. Generate daily messages
  generateDailyMessages(state);

  // 8. Check crew specializations
  checkCrewSpecialization(state);
}
