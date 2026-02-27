import { GameState, FamilyId, FactionActionType } from '../types';
import * as Engine from '../engine';
import { startNemesisCombat, addPhoneMessage, resolveWarEvent, performSpionage, performSabotage, negotiateNemesis, scoutNemesis, checkNemesisWoundedRevenge } from '../newFeatures';
import { calculateEndgamePhase, buildVictoryData, startFinalBoss, createBossPhase, createNewGamePlus, getDeckDialogue } from '../endgame';
import { checkCinematicTrigger } from '../cinematics';
import { NEMESIS_TAUNTS, NEMESIS_ARCHETYPES, HOSPITAL_ADMISSION_COST_PER_MAXHP, HOSPITAL_STAY_DAYS, HOSPITAL_REP_LOSS, MAX_HOSPITALIZATIONS } from '../constants';
import { generateDailyNews } from '../newsGenerator';

export function handleStartCombat(s: GameState, familyId: FamilyId): void {
  const combat = Engine.startCombat(s, familyId);
  if (combat) s.activeCombat = combat;
}

export function handleStartNemesisCombat(s: GameState): void {
  const combat = startNemesisCombat(s);
  if (combat) s.activeCombat = combat;
}

export function handleCombatAction(s: GameState, combatAction: 'attack' | 'heavy' | 'defend' | 'environment' | 'tactical'): void {
  if (!s.activeCombat) return;
  const hpBefore = s.activeCombat.playerHP;
  const enemyHpBefore = s.activeCombat.targetHP;
  Engine.combatAction(s, combatAction);
  Engine.checkAchievements(s);
  if (s.activeCombat && s.activeCombat.bossPhase) {
    const dialogue = getDeckDialogue(s.activeCombat);
    if (dialogue) s.activeCombat.logs.push(dialogue);
  }
  if (s.activeCombat) {
    const playerTookDamage = s.activeCombat.playerHP < hpBefore;
    const dealtHeavyDamage = (enemyHpBefore - s.activeCombat.targetHP) > 15;
    const enemyDefeated = s.activeCombat.finished && s.activeCombat.won;
    const playerDefeated = s.activeCombat.finished && !s.activeCombat.won;
    if (enemyDefeated) s.screenEffect = 'gold-flash';
    else if (playerDefeated) s.screenEffect = 'blood-flash';
    else if (combatAction === 'heavy' && dealtHeavyDamage) s.screenEffect = 'shake';
    else if (playerTookDamage && (hpBefore - s.activeCombat.playerHP) > 10) s.screenEffect = 'blood-flash';
  }
  if (s.activeCombat?.finished && s.activeCombat?.won && s.activeCombat?.bossPhase === 2) {
    s._finalBossWon = true;
  }
  s.endgamePhase = calculateEndgamePhase(s);
}

export function handleEndCombat(s: GameState): void {
  if (s.activeCombat) {
    if (s.activeCombat.won) {
      s.playerHP = Math.max(1, s.activeCombat.playerHP);
    } else {
      const lastStandRoll = Math.random();
      if (lastStandRoll < 0.15) {
        s.playerHP = 1;
        addPhoneMessage(s, '⚡ Last Stand', 'Je weigerde te vallen. Met pure wilskracht overleef je het gevecht met 1 HP!', 'warning');
      } else {
        const maxHP = s.playerMaxHP;
        const hospitalCost = maxHP * HOSPITAL_ADMISSION_COST_PER_MAXHP;
        s.hospitalizations = (s.hospitalizations || 0) + 1;
        if (s.hospitalizations >= MAX_HOSPITALIZATIONS) {
          s.gameOver = true;
          s.playerHP = 0;
        } else {
          s.hospital = { daysRemaining: HOSPITAL_STAY_DAYS, totalDays: HOSPITAL_STAY_DAYS, cost: hospitalCost };
          s.money = Math.max(0, s.money - hospitalCost);
          s.stats.totalSpent += Math.min(s.money + hospitalCost, hospitalCost);
          s.rep = Math.max(0, s.rep - HOSPITAL_REP_LOSS);
          s.playerHP = 1;
          addPhoneMessage(s, 'Crown Heights Ziekenhuis', `Je bent opgenomen na een verloren gevecht. Kosten: €${hospitalCost.toLocaleString()}. Hersteltijd: ${HOSPITAL_STAY_DAYS} dagen. (Opname ${s.hospitalizations}/${MAX_HOSPITALIZATIONS})`, 'warning');
        }
      }
    }
    if (s.activeCombat?.isNemesis && !s.activeCombat.won && s.nemesis?.alive) {
      s.nemesis.hp = s.activeCombat.targetHP;
      checkNemesisWoundedRevenge(s);
    }
  }
  const wasFinalBoss = s._finalBossWon;
  delete s._finalBossWon;
  if (s.activeCombat?.won) {
    const combatCinematic = checkCinematicTrigger(s, 'combat_won');
    if (combatCinematic) s.pendingCinematic = combatCinematic;
  }
  if (s.activeCombat?.isNemesis && s.activeCombat?.won) {
    const nemCinematic = checkCinematicTrigger(s, 'nemesis_combat_start');
    if (nemCinematic) s.pendingCinematic = nemCinematic;
  }
  s.activeCombat = null;
  if (wasFinalBoss) {
    s.finalBossDefeated = true;
    s.endgamePhase = 'noxhaven_baas';
    s.rep += 500;
    s.money += 100000;
    s.stats.totalEarned += 100000;
    Engine.gainXp(s, 500);
    s.heat = 0;
    s.personalHeat = 0;
    s.ownedVehicles.forEach(v => { v.vehicleHeat = 0; });
    s.playerHP = s.playerMaxHP;
    s.victoryData = buildVictoryData(s);
    addPhoneMessage(s, 'anonymous', 'Commissaris Decker is verslagen. Noxhaven is van jou. De stad knielt.', 'opportunity');
  }
}

export function handleFactionAction(s: GameState, familyId: FamilyId, actionType: FactionActionType): void {
  const result = Engine.performFactionAction(s, familyId, actionType);
  s._lastFactionResult = result;
  Engine.checkAchievements(s);
  if (s.dailyProgress) { s.dailyProgress.faction_actions++; }
  const { syncChallenges } = require('./helpers');
  syncChallenges(s);
}

export function handleNemesisDefeatChoice(s: GameState, choice: 'execute' | 'exile' | 'recruit'): void {
  const nem = s.nemesis;
  if (!nem) return;
  nem.pendingDefeatChoice = false;
  nem.defeatChoice = choice;
  switch (choice) {
    case 'execute':
      s.rep += 50;
      Engine.splitHeat(s, 15, 0.7);
      nem.nextSpawnDay = Math.max(s.day + 1, nem.nextSpawnDay - 5);
      addPhoneMessage(s, 'anonymous', `Je hebt ${nem.name} geëxecuteerd. De straten sidderen. Maar zijn opvolger zal wraak willen...`, 'warning');
      break;
    case 'exile':
      addPhoneMessage(s, 'anonymous', `${nem.name} is verbannen uit Noxhaven. Een neutrale opvolger zal verschijnen.`, 'info');
      break;
    case 'recruit':
      s.rep -= 25;
      const archetypes: import('../types').NemesisArchetype[] = ['zakenman', 'brute', 'schaduw', 'strateeg'];
      const nextArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];
      nem.informantArchetype = nextArchetype;
      const archDef = NEMESIS_ARCHETYPES.find(a => a.id === nextArchetype);
      addPhoneMessage(s, 'informant', `${nem.name} werkt nu als informant. De volgende rivaal wordt een ${archDef?.icon} ${archDef?.name}.`, 'opportunity');
      nem.nextSpawnDay = Math.max(nem.nextSpawnDay, s.day + 15);
      break;
  }
}

export function handleStartFinalBoss(s: GameState): void {
  const finalCombat = startFinalBoss(s);
  if (finalCombat) {
    s.activeCombat = finalCombat;
    s.screenEffect = 'shake';
  }
}

export function handleStartBossPhase2(s: GameState): void {
  s.activeCombat = createBossPhase(s, 2);
  s.screenEffect = 'blood-flash';
}

export function handleResolveFinalBoss(s: GameState): void {
  s.finalBossDefeated = true;
  s.endgamePhase = 'noxhaven_baas';
  s.rep += 500;
  s.money += 100000;
  s.stats.totalEarned += 100000;
  Engine.gainXp(s, 500);
  s.heat = 0;
  s.personalHeat = 0;
  s.ownedVehicles.forEach(v => { v.vehicleHeat = 0; });
  s.victoryData = buildVictoryData(s);
  addPhoneMessage(s, 'anonymous', 'Commissaris Decker is verslagen. Noxhaven is van jou. De stad knielt.', 'opportunity');
}

export function handleNewGamePlus(s: GameState): GameState {
  const ngPlus = createNewGamePlus(s);
  Engine.generatePrices(ngPlus);
  Engine.generateContracts(ngPlus);
  return ngPlus;
}

export function handleResolveWarEvent(s: GameState, tactic: import('../types').WarTactic): void {
  if (!s.pendingWarEvent) return;
  const result = resolveWarEvent(s, tactic);
  if (result.won) {
    s.screenEffect = 'gold-flash';
    s.lastRewardAmount = result.loot;
  } else {
    s.screenEffect = 'blood-flash';
  }
}

export function handleFormAlliance(s: GameState, familyId: FamilyId): void {
  const rel = s.familyRel[familyId] || 0;
  if (rel < 30) return;
  const cost = Math.max(5000, 15000 - rel * 100);
  if (s.money < cost) return;
  s.money -= cost;
  s.stats.totalSpent += cost;
  if (!s.alliancePacts) s.alliancePacts = {};
  s.alliancePacts[familyId] = {
    familyId,
    active: true,
    expiresDay: s.day + 10,
    benefit: familyId === 'cartel' ? '-15% Marktprijzen Drugs' : familyId === 'syndicate' ? '+20% Hack Inkomsten' : '+15% Combat Bonus',
    costPerDay: Math.floor(cost / 10),
  };
  s.familyRel[familyId] = Math.min(100, rel + 10);
}

export function handleBreakAlliance(s: GameState, familyId: FamilyId): void {
  if (!s.alliancePacts?.[familyId]) return;
  delete s.alliancePacts[familyId];
  s.familyRel[familyId] = Math.max(-100, (s.familyRel[familyId] || 0) - 20);
}
