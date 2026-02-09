/**
 * New feature engine functions for Noxhaven
 * Weather, District Rep, Crew Specs, Smuggle Routes, Territory Defense, Nemesis, Phone
 */

import { GameState, DistrictId, GoodId, FamilyId, WeatherType, NemesisState, SmuggleRoute, PhoneMessage, NightReportData, WarEvent, WarTactic, WarEventResult, DistrictHQUpgradeId } from './types';
import { addPersonalHeat, addVehicleHeat, getActiveVehicleHeat, getVehicleUpgradeBonus, getPlayerStat } from './engine';
import { DISTRICTS, GOODS, FAMILIES, NEMESIS_NAMES, PHONE_CONTACTS, DISTRICT_REP_PERKS, DISTRICT_HQ_UPGRADES } from './constants';

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
      addPersonalHeat(state, -5);
      report.personalHeatChange = (report.personalHeatChange || 0) - 5;
      break;
    case 'heatwave':
      addPersonalHeat(state, 3);
      report.personalHeatChange = (report.personalHeatChange || 0) + 3;
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
  if ((state.personalHeat || 0) > 70) {
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

  // === VILLA ATTACK (special action, higher chance when player is powerful) ===
  const villaAttackChance = state.villa
    ? Math.min(0.25, 0.05 + (state.villa.level * 0.03) + (state.villa.modules.length * 0.01) + (state.ownedDistricts.length * 0.02))
    : 0;

  if (state.villa && Math.random() < villaAttackChance) {
    // Villa defense calculation
    const villa = state.villa;
    let defenseScore = villa.level * 15; // base defense from level
    if (villa.modules.includes('commandocentrum')) defenseScore += 20;
    if (villa.modules.includes('wapenkamer')) defenseScore += 10;
    if (villa.modules.includes('crew_kwartieren')) defenseScore += 10;
    // Crew contributes
    const crewDefense = state.crew.filter(c => c.hp > 30).length * 5;
    defenseScore += crewDefense;

    const attackPower = nem.power + Math.floor(Math.random() * 20);
    const won = defenseScore >= attackPower;

    if (won) {
      // Defender wins — nemesis takes damage
      nem.hp = Math.max(0, nem.hp - 15);
      actions.push('villa-aanval afgeslagen!');
      report.villaAttack = {
        won: true,
        nemesisName: nem.name,
        damage: `Verdediging: ${defenseScore} vs Aanval: ${attackPower}`,
      };
      addPhoneMessage(state, 'anonymous', `${nem.name} heeft je villa aangevallen, maar je verdediging hield stand!`, 'info');
    } else {
      // Attacker wins — damage to villa
      const damages: string[] = [];
      let stolenMoney = 0;
      let moduleDamaged: string | undefined;

      // Steal from vault (25-40% of vault)
      if (villa.modules.includes('kluis') && villa.vaultMoney > 0) {
        const stealPct = 0.25 + Math.random() * 0.15;
        stolenMoney = Math.floor(villa.vaultMoney * stealPct);
        villa.vaultMoney -= stolenMoney;
        damages.push(`€${stolenMoney.toLocaleString()} gestolen uit kluis`);
      }

      // Damage a random module (disable it temporarily by removing — player needs to reinstall)
      const damageable = villa.modules.filter(m => m !== 'kluis' && m !== 'opslagkelder');
      if (damageable.length > 0 && Math.random() < 0.4) {
        const targetMod = damageable[Math.floor(Math.random() * damageable.length)];
        villa.modules = villa.modules.filter(m => m !== targetMod);
        const modName = targetMod.replace('_', ' ');
        moduleDamaged = modName;
        damages.push(`${modName} vernietigd`);
      }

      // Crew damage
      state.crew.forEach(c => {
        if (c.hp > 0 && Math.random() < 0.5) {
          const dmg = 10 + Math.floor(Math.random() * 15);
          c.hp = Math.max(1, c.hp - dmg);
        }
      });

      actions.push('valt je villa aan!');
      report.villaAttack = {
        won: false,
        nemesisName: nem.name,
        damage: damages.join(', ') || 'Schade aan je villa',
        stolenMoney: stolenMoney > 0 ? stolenMoney : undefined,
        moduleDamaged,
      };
      addPhoneMessage(state, 'nemesis', `Je villa is niet zo veilig als je denkt. - ${nem.name}`, 'threat');
    }
  } else {
    // Normal nemesis actions
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

/** Calculate total defense for a district based on HQ upgrades */
export function getDistrictDefenseLevel(state: GameState, distId: DistrictId): number {
  const def = state.districtDefenses[distId];
  if (!def) return 0;
  let total = def.fortLevel;
  def.upgrades.forEach(uid => {
    const upgDef = DISTRICT_HQ_UPGRADES.find(u => u.id === uid);
    if (upgDef) total += upgDef.defense;
  });
  // Faction alliance bonus
  const localFaction = Object.values(FAMILIES).find(f => f.home === distId);
  if (localFaction && (state.familyRel[localFaction.id] || 0) >= 50) {
    total += 15;
  }
  return total;
}

/** Calculate attack chance reduction from surveillance upgrades */
function getAttackReduction(state: GameState, distId: DistrictId): number {
  const def = state.districtDefenses[distId];
  if (!def) return 0;
  let reduction = 0;
  def.upgrades.forEach(uid => {
    const upgDef = DISTRICT_HQ_UPGRADES.find(u => u.id === uid);
    if (upgDef) reduction += upgDef.attackReduction;
  });
  return reduction;
}

/** Check if district has command center for spionage */
export function hasCommandCenter(state: GameState, distId: DistrictId): boolean {
  const def = state.districtDefenses[distId];
  return def?.upgrades.includes('command') || false;
}

/** Get random attacker name */
function getAttackerName(): string {
  const names = ['De Schaduw Bende', 'Los Diablos', 'Het Syndikaat', 'Zwarte Hand', 'De Wolven', 'Neon Vipers', 'Bloedbroederschap'];
  return names[Math.floor(Math.random() * names.length)];
}

/** Generate war loot based on attack strength */
function generateWarLoot(attackStrength: number, defenseLevel: number): { money: number; goodsLoot: { good: GoodId; amount: number } | null } {
  const baseLoot = Math.min(5000, Math.max(500, Math.floor(attackStrength * 50)));
  const overkill = defenseLevel - attackStrength;
  const bonusMult = overkill > 30 ? 1.5 : overkill > 15 ? 1.2 : 1.0;
  const money = Math.floor(baseLoot * bonusMult);

  let goodsLoot: { good: GoodId; amount: number } | null = null;
  if (Math.random() < 0.2) {
    const goods: GoodId[] = ['drugs', 'weapons', 'tech', 'luxury', 'meds'];
    goodsLoot = { good: goods[Math.floor(Math.random() * goods.length)], amount: 1 + Math.floor(Math.random() * 3) };
  }

  return { money, goodsLoot };
}

export function resolveDistrictAttacks(state: GameState, report: NightReportData): void {
  if (!report.defenseResults) report.defenseResults = [];

  // Clean up expired sabotage effects
  state.sabotageEffects = (state.sabotageEffects || []).filter(s => s.expiresDay > state.day);
  // Clean up expired intel
  state.spionageIntel = (state.spionageIntel || []).filter(s => s.expiresDay > state.day);

  state.ownedDistricts.forEach(distId => {
    const attackReduction = getAttackReduction(state, distId);
    const hidingBonus = (state.hidingDays || 0) > 0 ? 0.25 : 0;
    let attackChance = 0.15 + state.day / 200 + (state.personalHeat || 0) / 200 + hidingBonus;
    attackChance *= (1 - attackReduction / 100); // surveillance reduces chance

    if (Math.random() > attackChance) return;

    const defenseLevel = getDistrictDefenseLevel(state, distId);

    // Attack strength, reduced by sabotage
    let attackStrength = 20 + Math.floor(Math.random() * 40) + Math.floor(state.day * 0.5);
    const sabotage = (state.sabotageEffects || []).find(s => s.district === distId);
    if (sabotage) {
      attackStrength = Math.floor(attackStrength * (1 - sabotage.reductionPercent / 100));
    }

    // Check if this is a major attack that requires intervention
    if (attackStrength > defenseLevel * 0.6 && !state.pendingWarEvent) {
      state.pendingWarEvent = {
        district: distId,
        attackStrength,
        defenseLevel,
        attackerName: getAttackerName(),
      };
      addPhoneMessage(state, 'anonymous', `⚠️ Grote aanval op ${DISTRICTS[distId].name}! Interventie vereist!`, 'threat');
      report.defenseResults.push({
        district: distId,
        attacked: true,
        won: false,
        details: `${DISTRICTS[distId].name}: Grote aanval! Interventie vereist.`,
      });
      return;
    }

    // Auto-resolve smaller attacks
    const won = defenseLevel >= attackStrength;

    if (won) {
      const loot = generateWarLoot(attackStrength, defenseLevel);
      state.money += loot.money;
      state.stats.totalEarned += loot.money;
      state.rep += 10;
      state.districtRep[distId] = Math.min(100, (state.districtRep[distId] || 0) + 5);
      if (loot.goodsLoot) {
        state.inventory[loot.goodsLoot.good] = (state.inventory[loot.goodsLoot.good] || 0) + loot.goodsLoot.amount;
      }
      const overkill = defenseLevel - attackStrength;
      if (overkill > 30) state.rep += 15;
      report.defenseResults.push({
        district: distId,
        attacked: true,
        won: true,
        details: `${DISTRICTS[distId].name} verdedigd! (${defenseLevel} vs ${attackStrength}) +€${loot.money.toLocaleString()}`,
        loot: loot.money,
        goodsLoot: loot.goodsLoot,
      });
    } else {
      state.ownedDistricts = state.ownedDistricts.filter(d => d !== distId);
      state.rep = Math.max(0, state.rep - 30);
      const moneyLoss = Math.floor(state.money * 0.05);
      state.money = Math.max(0, state.money - moneyLoss);
      const def = state.districtDefenses[distId];
      if (def) { def.upgrades = []; def.fortLevel = 0; }
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

/** Resolve a war event with player tactic choice */
export function resolveWarEvent(state: GameState, tactic: WarTactic): WarEventResult {
  const war = state.pendingWarEvent!;
  let defenseLevel = war.defenseLevel;
  let won = false;
  let details = '';

  const muscle = getPlayerStat(state, 'muscle');
  const brains = getPlayerStat(state, 'brains');
  const charm = getPlayerStat(state, 'charm');

  switch (tactic) {
    case 'defend': {
      // Standard defense with muscle bonus
      defenseLevel += muscle * 3;
      won = defenseLevel >= war.attackStrength;
      details = won ? `Verdediging geslaagd met brute kracht! (${defenseLevel} vs ${war.attackStrength})` : `Verdediging gefaald. (${defenseLevel} vs ${war.attackStrength})`;
      break;
    }
    case 'ambush': {
      // Higher win chance but risky — brains check
      const roll = Math.random() * 100;
      const threshold = 50 - brains * 5;
      if (roll > threshold) {
        // Ambush success — massive defense boost
        defenseLevel += 40 + brains * 5;
        won = true;
        details = `Hinderlaag succesvol! De vijand liep in de val. (${defenseLevel} vs ${war.attackStrength})`;
      } else {
        // Ambush failed — defense weakened
        defenseLevel = Math.floor(defenseLevel * 0.5);
        won = defenseLevel >= war.attackStrength;
        details = won ? `Hinderlaag mislukt maar toch verdedigd. (${defenseLevel} vs ${war.attackStrength})` : `Hinderlaag mislukt! Verdediging gebroken. (${defenseLevel} vs ${war.attackStrength})`;
      }
      break;
    }
    case 'negotiate': {
      // Pay money to buy off the attack — charm check
      const bribeCost = Math.max(3000, Math.floor(war.attackStrength * 100) - charm * 500);
      if (state.money >= bribeCost) {
        state.money -= bribeCost;
        state.stats.totalSpent += bribeCost;
        won = true;
        details = `Aanval afgekocht voor €${bribeCost.toLocaleString()}. Diplomatie wint.`;
      } else {
        won = false;
        details = `Niet genoeg geld om te onderhandelen (€${bribeCost.toLocaleString()} nodig). Aanval niet gestopt.`;
      }
      break;
    }
  }

  let loot = 0;
  let goodsLoot: { good: GoodId; amount: number } | null = null;

  if (won) {
    const warLoot = generateWarLoot(war.attackStrength, defenseLevel);
    loot = warLoot.money;
    goodsLoot = warLoot.goodsLoot;
    // Bonus loot for ambush
    if (tactic === 'ambush') loot = Math.floor(loot * 1.5);
    state.money += loot;
    state.stats.totalEarned += loot;
    state.rep += 20;
    state.districtRep[war.district] = Math.min(100, (state.districtRep[war.district] || 0) + 10);
    if (goodsLoot) {
      state.inventory[goodsLoot.good] = (state.inventory[goodsLoot.good] || 0) + goodsLoot.amount;
    }
  } else {
    state.ownedDistricts = state.ownedDistricts.filter(d => d !== war.district);
    state.rep = Math.max(0, state.rep - 30);
    const moneyLoss = Math.floor(state.money * 0.05);
    state.money = Math.max(0, state.money - moneyLoss);
    const def = state.districtDefenses[war.district];
    if (def) { def.upgrades = []; def.fortLevel = 0; }
  }

  state.pendingWarEvent = null;

  return { won, tactic, loot, goodsLoot, details };
}

/** Perform spionage on a district */
export function performSpionage(state: GameState, distId: DistrictId): { attackChance: number } {
  const hidingBonus = (state.hidingDays || 0) > 0 ? 0.25 : 0;
  const attackChance = Math.min(95, Math.floor((0.15 + state.day / 200 + (state.personalHeat || 0) / 200 + hidingBonus) * 100));
  state.spionageIntel.push({ district: distId, attackChance, expiresDay: state.day + 3 });
  return { attackChance };
}

/** Perform sabotage on a district */
export function performSabotage(state: GameState, distId: DistrictId): void {
  state.sabotageEffects.push({ district: distId, reductionPercent: 30, expiresDay: state.day + 2 });
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
    let interceptChance = 0.10 + getActiveVehicleHeat(state) / 200;
    // While hiding: +15% interception (no supervision)
    if ((state.hidingDays || 0) > 0) interceptChance += 0.15;
    // Speed upgrade reduces interception: -3% per bonus point
    const speedUpgrade = getVehicleUpgradeBonus(state, 'speed');
    if (speedUpgrade > 0) interceptChance -= speedUpgrade * 0.03;
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
      addVehicleHeat(state, 15);
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
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const chance = (pct: number) => Math.random() < pct;
  const nem = state.nemesis;
  const districtName = DISTRICTS[state.loc]?.name || 'de stad';

  // ======= WEATHER — contextual reports =======
  if (state.weather !== 'clear') {
    const weatherMsgs: Record<WeatherType, string[]> = {
      clear: [],
      rain: [
        `Stortbuien verwacht in Noxhaven. Minder politie op straat — goed moment voor handel.`,
        `Regenfront trekt over ${districtName}. Agenten blijven in hun auto's. Heat daalt sneller.`,
        `Code geel: zware neerslag. Handelsvolume ligt lager, maar de straten zijn van jou.`,
      ],
      fog: [
        `Dichte mist in heel Noxhaven. Perfect weer voor smokkelen — zicht onder 50 meter.`,
        `Mistbank hangt over ${districtName}. Camera's zijn nutteloos. Missie-slagingskans hoger.`,
        `Noxhaven ontwaakt in dikke mist. De stad is blind — gebruik het.`,
      ],
      heatwave: [
        `Extreme hitte vandaag. Crew verliest stamina, maar marktprijzen schieten omhoog.`,
        `40+ graden in ${districtName}. Spanningen lopen op — heat stijgt sneller. Hou je crew gehydrateerd.`,
        `Hittegolf dag ${state.day}: de stad kookt. Prijzen stijgen, maar je crew lijdt.`,
      ],
      storm: [
        `Stormwaarschuwing: alle reizen zijn geblokkeerd. Lab-productie draait op volle kracht.`,
        `Noodweer in Noxhaven! Casino's gesloten, wegen afgezet. Perfecte nacht voor productie.`,
        `Tropische storm bereikt ${districtName}. Blijf waar je bent — fabrieken draaien dubbel.`,
      ],
    };
    addPhoneMessage(state, 'weather', pick(weatherMsgs[state.weather]), 'info');
  }

  // ======= HEAT — escalating warnings =======
  if ((state.personalHeat || 0) >= 80) {
    addPhoneMessage(state, 'police', pick([
      `NHPD heeft een speciaal team op je gezet. Verlaat ${districtName} of lig laag. Nu.`,
      `Bronnen bij het bureau: er is een arrestatiebevel onderweg. Alles boven 80% heat is zelfmoord.`,
      `Je staat op de radar van de commissaris persoonlijk. Ze plannen een inval.`,
    ]), 'threat');
  } else if ((state.personalHeat || 0) >= 60) {
    addPhoneMessage(state, 'police', pick([
      `Politie patrouilleert extra in ${districtName}. Wees voorzichtig met deals.`,
      `Mijn bron zegt dat ze je in de gaten houden. Houd het rustig vandaag.`,
      `Er hangen undercoveragenten rond ${districtName}. Je heat is te hoog.`,
      `NHPD heeft een dossier over je geopend. Nog niet kritiek, maar wees slim.`,
    ]), 'warning');
  }

  // ======= DEBT — pressure messages =======
  if (state.debt > 50000 && chance(0.5)) {
    addPhoneMessage(state, 'anonymous', pick([
      `Je schuld is €${state.debt.toLocaleString()}. De rente vreet je op. Los af of verdwijn.`,
      `Iemand op straat vraagt naar je. Ze willen hun geld terug. €${state.debt.toLocaleString()} is geen grap.`,
      `De woekeraars worden ongeduldig. €${(state.debt / 1000).toFixed(0)}k schuld — dat overleef je niet lang.`,
    ]), 'threat');
  } else if (state.debt > 20000 && chance(0.3)) {
    addPhoneMessage(state, 'anonymous', pick([
      `Vergeet je schuld niet. €${state.debt.toLocaleString()} hangt als een molensteen om je nek.`,
      `Elke dag groeit de rente. Los je schuld af voordat het uit de hand loopt.`,
    ]), 'warning');
  }

  // ======= MARKET DEMAND — trading tips =======
  if (chance(0.5)) {
    const demandDistricts = (Object.keys(state.districtDemands) as DistrictId[]).filter(d => state.districtDemands[d]);
    if (demandDistricts.length > 0) {
      const d = pick(demandDistricts);
      const goodId = state.districtDemands[d];
      const good = GOODS.find(g => g.id === goodId);
      if (good) {
        addPhoneMessage(state, 'informant', pick([
          `Tip: ${good.name} is schaars in ${DISTRICTS[d].name}. Prijzen liggen 60% hoger dan normaal.`,
          `Ik hoor dat ${DISTRICTS[d].name} schreeuwt om ${good.name}. Koop laag, verkoop hoog.`,
          `Interessant... ${good.name} wordt als een gek opgekocht in ${DISTRICTS[d].name}. Grijp je kans.`,
          `${DISTRICTS[d].name} heeft een tekort aan ${good.name}. Elke dealer wil er zijn.`,
        ]), 'opportunity');
      }
    }
  }

  // ======= INVENTORY — contextual advice =======
  const totalGoods = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
  if (totalGoods > state.maxInv * 0.8 && chance(0.3)) {
    addPhoneMessage(state, 'informant', pick([
      `Je voorraad is bijna vol (${totalGoods}/${state.maxInv}). Dump wat in ${districtName} of upgrade je voertuig.`,
      `Je rijdt rond met een volle bak. Verkoop iets voordat je betrapt wordt.`,
    ]), 'info');
  } else if (totalGoods === 0 && state.money > 5000 && chance(0.2)) {
    addPhoneMessage(state, 'informant', pick([
      `Je hebt niks op voorraad en €${state.money.toLocaleString()} cash. Tijd om in te kopen.`,
      `Lege handen verdienen niks. Ga naar de markt en investeer.`,
    ]), 'info');
  }

  // ======= CREW STATUS — injuries, level ups =======
  const injuredCrew = state.crew.filter(c => c.hp < 40);
  if (injuredCrew.length > 0 && chance(0.4)) {
    const c = pick(injuredCrew);
    addPhoneMessage(state, 'anonymous', pick([
      `${c.name} is er slecht aan toe (${c.hp}/100 HP). Laat ze herstellen of je verliest ze.`,
      `Je ${c.role} ${c.name} heeft medische hulp nodig. ${c.hp} HP over.`,
    ]), 'warning');
  }

  // ======= FACTION — relationship-based messages =======
  (Object.keys(FAMILIES) as FamilyId[]).forEach(fid => {
    const fam = FAMILIES[fid];
    const rel = state.familyRel[fid] || 0;
    if (rel >= 50 && chance(0.15)) {
      addPhoneMessage(state, 'informant', pick([
        `${fam.contact} is tevreden met je. De ${fam.name} biedt speciale contracten aan.`,
        `"Je hebt jezelf bewezen." — ${fam.contact}. Check je missies voor exclusieve ops.`,
        `De ${fam.name} beschouwt je als bondgenoot. Dat opent deuren in ${DISTRICTS[fam.home].name}.`,
      ]), 'opportunity');
    } else if (rel <= -30 && chance(0.2)) {
      addPhoneMessage(state, 'anonymous', pick([
        `De ${fam.name} is niet blij met je. ${fam.contact} heeft een prijs op je hoofd gezet.`,
        `Pas op in ${DISTRICTS[fam.home].name}. De ${fam.name} wacht op een kans om toe te slaan.`,
        `Relatie met ${fam.name}: ${rel}. Ze zijn vijanden nu. Verwacht sabotage.`,
      ]), 'threat');
    }
  });

  // ======= SMUGGLE ROUTES — status updates =======
  if (state.smuggleRoutes.length > 0 && chance(0.4)) {
    const route = pick(state.smuggleRoutes.filter(r => r.active));
    if (route) {
      const good = GOODS.find(g => g.id === route.good);
      addPhoneMessage(state, 'courier', pick([
        `Route ${DISTRICTS[route.from].name} → ${DISTRICTS[route.to].name}: ${good?.name || 'goederen'} succesvol afgeleverd. Dag ${route.daysActive} actief.`,
        `Alles rustig op de ${DISTRICTS[route.from].name}-${DISTRICTS[route.to].name} lijn. Lading ${good?.name || ''} onderweg.`,
        `Koerier meldt: ${good?.name || 'Goederen'} aangekomen in ${DISTRICTS[route.to].name}. Geen politie gezien.`,
      ]), 'info');
    }
  }

  // ======= TERRITORY — owned district flavor =======
  if (state.ownedDistricts.length > 0 && chance(0.25)) {
    const d = pick(state.ownedDistricts);
    const rep = state.districtRep[d] || 0;
    if (rep >= 75) {
      addPhoneMessage(state, 'informant', pick([
        `${DISTRICTS[d].name} is volledig onder controle. Jouw naam wordt gefluisterd met respect.`,
        `In ${DISTRICTS[d].name} ben je een legende. Reputatie: ${rep}/100.`,
      ]), 'info');
    } else if (rep >= 50) {
      addPhoneMessage(state, 'informant', pick([
        `Je invloed groeit in ${DISTRICTS[d].name}. Nog even en je bent onaantastbaar.`,
        `De mensen in ${DISTRICTS[d].name} kennen je naam. Reputatie: ${rep}/100.`,
      ]), 'info');
    } else {
      addPhoneMessage(state, 'informant', pick([
        `${DISTRICTS[d].name} is van jou, maar je grip is zwak. Investeer in reputatie.`,
        `Geruchten in ${DISTRICTS[d].name}: sommigen twijfelen aan je leiderschap. Doe er iets aan.`,
      ]), 'warning');
    }
  }

  // ======= DEFENSE — vulnerability warnings =======
  state.ownedDistricts.forEach(d => {
    const defLevel = getDistrictDefenseLevel(state, d);
    if (defLevel < 30 && chance(0.3)) {
      addPhoneMessage(state, 'anonymous', pick([
        `${DISTRICTS[d].name} is nauwelijks verdedigd (${defLevel}). Een aanval is een kwestie van tijd.`,
        `Waarschuwing: ${DISTRICTS[d].name} staat wijd open. Upgrade je HQ verdediging.`,
        `Bronnen melden dat ${DISTRICTS[d].name} een doelwit is vannacht. Verdediging: ${defLevel}.`,
      ]), 'warning');
    }
  });

  // ======= NEMESIS — contextual taunts =======
  if (nem && nem.cooldown === 0 && chance(0.3)) {
    const nemLoc = DISTRICTS[nem.location]?.name || 'ergens';
    const playerRicher = state.money > 50000;
    const playerStronger = state.player.level > 5;

    const contextTaunts: string[] = [];

    // Location-based
    if (nem.location === state.loc) {
      contextTaunts.push(
        `Ik zie je. ${districtName} is niet groot genoeg voor ons beiden.`,
        `Je bent dichtbij. Dat is óf dapper, óf dom.`,
      );
    } else {
      contextTaunts.push(
        `Ik ben in ${nemLoc}. Kom me zoeken als je durft.`,
        `Vanuit ${nemLoc} bouw ik mijn imperium. Wat doe jij?`,
      );
    }

    // Wealth-based
    if (playerRicher) {
      contextTaunts.push(
        `Ik hoor dat je goed verdient. Geniet ervan — ik kom het halen.`,
        `€${state.money.toLocaleString()}? Mooi potje. Wordt binnenkort het mijne.`,
      );
    } else {
      contextTaunts.push(
        `Nog steeds arm? Pathisch. Je bent deze stad niet waard.`,
        `Je kunt niet eens je schulden betalen. Geef het op.`,
      );
    }

    // Power-based
    if (nem.defeated > 0) {
      contextTaunts.push(
        `Je hebt me ${nem.defeated}x verslagen. Dat was de laatste keer.`,
        `Elke keer dat je me vloert, kom ik sterker terug. Power: ${nem.power}.`,
      );
    }

    // Territory-based
    if (state.ownedDistricts.length >= 3) {
      contextTaunts.push(
        `${state.ownedDistricts.length} districten? Indrukwekkend. Maar kwetsbaar.`,
        `Hoe meer je bezit, hoe meer je kunt verliezen. Onthoud dat.`,
      );
    }

    addPhoneMessage(state, 'nemesis', `${pick(contextTaunts)} — ${nem.name}`, 'threat');
  }

  // ======= MILESTONES & ACHIEVEMENTS =======
  if (state.day === 7 && chance(0.8)) {
    addPhoneMessage(state, 'anonymous', `Een week in Noxhaven overleefd. De meesten halen dat niet. Respect.`, 'info');
  }
  if (state.day === 30 && chance(0.8)) {
    addPhoneMessage(state, 'informant', `30 dagen. Je bent geen nieuwkomer meer. De stad kent je naam.`, 'info');
  }
  if (state.money > 100000 && state.day > 1 && chance(0.1)) {
    addPhoneMessage(state, 'informant', pick([
      `€${(state.money / 1000).toFixed(0)}k op zak. Je begint op te vallen bij de grote jongens.`,
      `Met €${state.money.toLocaleString()} ben je een speler aan het worden. Pas op voor jaloezie.`,
    ]), 'info');
  }

  // ======= VEHICLE — condition warning =======
  const activeV = state.ownedVehicles.find(v => v.id === state.activeVehicle);
  if (activeV && activeV.condition < 30 && chance(0.4)) {
    addPhoneMessage(state, 'anonymous', pick([
      `Je auto valt uit elkaar (${activeV.condition}%). Repareer hem of je strandt midden in een deal.`,
      `Die ${state.activeVehicle} houdt het niet lang meer vol. ${activeV.condition}% conditie.`,
    ]), 'warning');
  }

  // ======= LAB — production hints =======
  if (state.hqUpgrades.includes('lab') && chance(0.2)) {
    if (state.lab.chemicals < 5) {
      addPhoneMessage(state, 'informant', pick([
        `Je lab draait op fumes. Nog maar ${state.lab.chemicals} chemicaliën over. Koop bij.`,
        `Zonder chemicaliën geen Synthetica. Je hebt er nog ${state.lab.chemicals}.`,
      ]), 'warning');
    } else {
      addPhoneMessage(state, 'informant', pick([
        `Lab draait goed. ${state.lab.chemicals} chemicaliën op voorraad. Productie vannacht.`,
        `Alles klaar in het lab. Verwachte output vannacht: max 20 Synthetica.`,
      ]), 'info');
    }
  }

  // ======= DIRTY MONEY — laundering tips =======
  if (state.dirtyMoney > 10000 && chance(0.3)) {
    addPhoneMessage(state, 'informant', pick([
      `€${state.dirtyMoney.toLocaleString()} zwart geld. Was het via je bedrijven of het casino.`,
      `Dat zwarte geld stapelt op. €${(state.dirtyMoney / 1000).toFixed(0)}k — de belastingdienst ruikt bloed.`,
      `Tip: met een dekmantel-bedrijf kun je tot €${state.ownedBusinesses.length > 0 ? '5k' : '0'}/dag witwassen.`,
    ]), 'info');
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
