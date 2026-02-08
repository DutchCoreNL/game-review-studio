/**
 * Endgame system for Noxhaven
 * Progression phases, final boss (multi-phase), ranking, New Game+, endgame events
 */

import { GameState, EndgamePhase, VictoryData, VictoryRank, CombatState, FamilyId } from './types';
import { FAMILIES, DISTRICTS, createInitialState } from './constants';
import { getPlayerStat, gainXp } from './engine';

// ========== PROGRESSION PHASES ==========

export const ENDGAME_PHASES: { id: EndgamePhase; label: string; desc: string; icon: string }[] = [
  { id: 'straatdealer', label: 'Straatdealer', desc: 'Begin je reis in de onderwereld', icon: '🔫' },
  { id: 'wijkbaas', label: 'Wijkbaas', desc: 'Bezit 2+ districten', icon: '🏘️' },
  { id: 'districtheerser', label: 'Districtheerser', desc: 'Bezit 4+ districten & verover 1+ factie', icon: '🏰' },
  { id: 'onderwerelds_koning', label: 'Onderwerelds Koning', desc: 'Verover alle 3 facties', icon: '👑' },
  { id: 'noxhaven_baas', label: 'Noxhaven Baas', desc: 'Versla de eindbaas en claim de stad', icon: '🌆' },
];

export function calculateEndgamePhase(state: GameState): EndgamePhase {
  if (state.finalBossDefeated) return 'noxhaven_baas';
  if ((state.conqueredFactions?.length || 0) >= 3) return 'onderwerelds_koning';
  if (state.ownedDistricts.length >= 4 && (state.conqueredFactions?.length || 0) >= 1) return 'districtheerser';
  if (state.ownedDistricts.length >= 2) return 'wijkbaas';
  return 'straatdealer';
}

export function getPhaseIndex(phase: EndgamePhase): number {
  return ENDGAME_PHASES.findIndex(p => p.id === phase);
}

// ========== FINAL BOSS CHECK ==========

export function canTriggerFinalBoss(state: GameState): boolean {
  if (state.finalBossDefeated || state.freePlayMode) return false;
  if (state.victoryData) return false;
  // Must have conquered all 3 factions and defeated nemesis at least once
  const allFactionsConquered = (state.conqueredFactions?.length || 0) >= 3;
  const nemesisDefeatedOnce = state.nemesis.defeated >= 1;
  return allFactionsConquered && nemesisDefeatedOnce;
}

// ========== MULTI-PHASE FINAL BOSS ==========

export const BOSS_PHASES = [
  {
    phase: 1,
    name: 'SWAT-Commandant Voss',
    title: 'FASE 1: SWAT INVAL',
    desc: 'Decker stuurt zijn beste SWAT-team vooruit. Commandant Voss leidt de operatie.',
    introLines: [
      '🚔 SWAT-teams bestormen je positie van alle kanten!',
      'Commandant Voss: "Op de grond! NU!"',
      'Je crew bereidt zich voor op het eerste vuurgevecht.',
    ],
  },
  {
    phase: 2,
    name: 'Commissaris Decker',
    title: 'FASE 2: DE COMMISSARIS',
    desc: 'Decker betreedt persoonlijk het slagveld. Dit is het einde.',
    introLines: [
      '⚠️ De rookwolken trekken op...',
      'Een silhouet stapt door de puinhopen.',
      'Decker: "Ik kom niet arresteren. Ik kom afrekenen."',
      '🔥 LAATSTE GEVECHT — VERSLA DECKER OM DE STAD TE CLAIMEN',
    ],
  },
];

export function startFinalBoss(state: GameState): CombatState | null {
  if (!canTriggerFinalBoss(state)) return null;
  return createBossPhase(state, 1);
}

export function createBossPhase(state: GameState, phase: number): CombatState {
  const muscle = getPlayerStat(state, 'muscle');
  const playerMaxHP = 100 + (state.player.level * 8) + (muscle * 4);
  const phaseData = BOSS_PHASES[phase - 1];

  if (phase === 1) {
    // Phase 1: SWAT Commander Voss
    const hp = 120 + state.player.level * 6 + state.day;
    const attack = 14 + Math.floor(state.player.level * 0.7) + Math.floor(state.day * 0.15);
    return {
      idx: 0,
      targetName: phaseData.name,
      targetHP: hp,
      enemyMaxHP: hp,
      enemyAttack: attack,
      playerHP: playerMaxHP,
      playerMaxHP,
      logs: [...phaseData.introLines, ''],
      isBoss: true,
      familyId: null,
      stunned: false,
      turn: 0,
      finished: false,
      won: false,
      isNemesis: false,
      bossPhase: 1,
    };
  }

  // Phase 2: Commissioner Decker
  const bossHP = 200 + state.player.level * 10 + state.day * 2;
  const bossAttack = 20 + state.player.level + Math.floor(state.day * 0.3);

  // Carry over remaining HP from phase 1 (or full if starting fresh)
  const currentHP = state.activeCombat
    ? Math.max(Math.floor(playerMaxHP * 0.4), state.activeCombat.playerHP) // At least 40% HP
    : playerMaxHP;

  return {
    idx: 0,
    targetName: phaseData.name,
    targetHP: bossHP,
    enemyMaxHP: bossHP,
    enemyAttack: bossAttack,
    playerHP: currentHP,
    playerMaxHP,
    logs: [...phaseData.introLines, ''],
    isBoss: true,
    familyId: null,
    stunned: false,
    turn: 0,
    finished: false,
    won: false,
    isNemesis: false,
    bossPhase: 2,
  };
}

export function isFinalBossPhase1Complete(combat: CombatState): boolean {
  return combat.bossPhase === 1 && combat.finished && combat.won;
}

// ========== DECKER COMBAT DIALOGUE ==========

export const DECKER_COMBAT_DIALOGUE: { phase: number; hpThreshold: number; line: string }[] = [
  // Phase 1 - Voss
  { phase: 1, hpThreshold: 0.7, line: 'Voss: "Alle eenheden, doelwit is sterker dan verwacht!"' },
  { phase: 1, hpThreshold: 0.4, line: 'Voss: "We verliezen terrein! Commissaris, we hebben versterking nodig!"' },
  { phase: 1, hpThreshold: 0.1, line: 'Voss: "Retreat! RETREAT! ...Dit is niet te stoppen."' },
  // Phase 2 - Decker
  { phase: 2, hpThreshold: 0.8, line: 'Decker: "Je bent niets meer dan een crimineel met geluk."' },
  { phase: 2, hpThreshold: 0.6, line: 'Decker: "Ik heb 30 jaar aan dit moment gewerkt..."' },
  { phase: 2, hpThreshold: 0.4, line: 'Decker: "Hoe... hoe kun je zo sterk zijn?!"' },
  { phase: 2, hpThreshold: 0.2, line: 'Decker: "Nee... NOXHAVEN IS MIJN STAD!"' },
  { phase: 2, hpThreshold: 0.05, line: 'Decker: "Je... je hebt gewonnen. De stad is van jou. Ik hoop dat je beseft wat dat betekent."' },
];

export function getDeckDialogue(combat: CombatState): string | null {
  if (!combat.bossPhase) return null;
  const hpRatio = combat.targetHP / combat.enemyMaxHP;

  for (const d of DECKER_COMBAT_DIALOGUE) {
    if (d.phase !== combat.bossPhase) continue;
    // Check if we just crossed this threshold
    if (hpRatio <= d.hpThreshold && !combat.logs.some(l => l === d.line)) {
      return d.line;
    }
  }
  return null;
}

// ========== ENDGAME EVENTS ==========

export interface EndgameEvent {
  id: string;
  title: string;
  desc: string;
  icon: string;
  reward: { money?: number; rep?: number; xp?: number; heat?: number };
}

export const ENDGAME_EVENTS: EndgameEvent[] = [
  {
    id: 'decker_warning',
    title: 'Waarschuwing van Decker',
    desc: 'Commissaris Decker stuurt een boodschap: "Geniet van je laatste dagen van vrijheid."',
    icon: '📋',
    reward: { heat: 15 },
  },
  {
    id: 'police_sweep',
    title: 'Grootschalige Politie-inval',
    desc: 'De NHPD voert huiszoekingen uit in al je districten. Extra heat voor al je operaties.',
    icon: '🚔',
    reward: { heat: 25 },
  },
  {
    id: 'informant_reward',
    title: 'Informant Bonus',
    desc: 'Een informant binnen de NHPD geeft je cruciale informatie over Deckers plannen.',
    icon: '🕵️',
    reward: { money: 15000, xp: 50 },
  },
  {
    id: 'loyalty_test',
    title: 'Loyaliteitstest',
    desc: 'Je vazallen tonen hun trouw. Extra inkomsten en reputatie.',
    icon: '🤝',
    reward: { money: 25000, rep: 100 },
  },
  {
    id: 'arms_deal',
    title: 'Wapendeal voor de Confrontatie',
    desc: 'Je crew bereidt zich voor op het gevecht. Extra wapens en uitrusting.',
    icon: '🔫',
    reward: { money: -10000, xp: 75, rep: 50 },
  },
];

export function getEndgameEvent(state: GameState): EndgameEvent | null {
  if ((state.conqueredFactions?.length || 0) < 3) return null;
  if (state.finalBossDefeated) return null;

  // 30% chance per night cycle when conditions met
  if (Math.random() > 0.3) return null;

  const available = ENDGAME_EVENTS.filter(e =>
    !(state as any).seenEndgameEvents?.includes(e.id)
  );
  if (available.length === 0) return null;

  return available[Math.floor(Math.random() * available.length)];
}

// ========== RANKING SYSTEM ==========

export function calculateRanking(state: GameState): { rank: VictoryRank; score: number } {
  let score = 0;

  // Speed bonus (fewer days = better, max 400 points)
  if (state.day <= 20) score += 400;
  else if (state.day <= 40) score += 300;
  else if (state.day <= 60) score += 200;
  else if (state.day <= 100) score += 100;
  else score += 50;

  // Wealth (max 200 points)
  const totalWealth = state.money + state.dirtyMoney;
  if (totalWealth >= 500000) score += 200;
  else if (totalWealth >= 200000) score += 150;
  else if (totalWealth >= 100000) score += 100;
  else score += 50;

  // Efficiency: missions completed vs failed (max 150 points)
  const mTotal = state.stats.missionsCompleted + state.stats.missionsFailed;
  if (mTotal > 0) {
    const successRate = state.stats.missionsCompleted / mTotal;
    score += Math.floor(successRate * 150);
  }

  // Achievements (max 150 points)
  score += Math.min(150, state.achievements.length * 10);

  // Districts owned (max 100 points)
  score += state.ownedDistricts.length * 20;

  // Conquest method variety bonus (50 points max)
  const combatConquests = state.leadersDefeated.length;
  const diplomaticConquests = state.conqueredFactions.filter(
    fid => !state.leadersDefeated.includes(fid)
  ).length;
  if (combatConquests > 0 && diplomaticConquests > 0) score += 50;
  else score += 25;

  // Nemesis defeats bonus (max 50 points)
  score += Math.min(50, state.nemesis.defeated * 15);

  // Determine rank
  let rank: VictoryRank;
  if (score >= 900) rank = 'S';
  else if (score >= 700) rank = 'A';
  else if (score >= 500) rank = 'B';
  else if (score >= 300) rank = 'C';
  else rank = 'D';

  return { rank, score };
}

export function buildVictoryData(state: GameState): VictoryData {
  const { rank, score } = calculateRanking(state);

  const combatConquests = state.leadersDefeated.length;
  const diplomaticConquests = state.conqueredFactions.filter(
    fid => !state.leadersDefeated.includes(fid)
  ).length;

  let method = 'Gemengd';
  if (combatConquests >= 3 && diplomaticConquests === 0) method = 'Brute Kracht';
  else if (diplomaticConquests >= 2) method = 'Diplomatiek Meester';
  else if (combatConquests >= 2) method = 'Oorlogsheer';

  return {
    day: state.day,
    rank,
    score,
    totalEarned: state.stats.totalEarned,
    totalSpent: state.stats.totalSpent,
    missionsCompleted: state.stats.missionsCompleted,
    missionsFailed: state.stats.missionsFailed,
    factionsConquered: state.conqueredFactions.length,
    nemesisDefeated: state.nemesis.defeated,
    achievementsUnlocked: state.achievements.length,
    casinoWon: state.stats.casinoWon,
    casinoLost: state.stats.casinoLost,
    districtsOwned: state.ownedDistricts.length,
    crewSize: state.crew.length,
    method,
  };
}

// ========== NEW GAME+ ==========

export function createNewGamePlus(state: GameState): GameState {
  const fresh = createInitialState() as GameState;

  const ngLevel = (state.newGamePlusLevel || 0) + 1;

  // Carry over bonuses
  fresh.newGamePlusLevel = ngLevel;
  fresh.money = 3000 + ngLevel * 5000; // Extra starting money
  fresh.player.stats.muscle = 1 + ngLevel; // Bonus stats
  fresh.player.stats.brains = 1 + ngLevel;
  fresh.player.stats.charm = 1 + ngLevel;
  fresh.achievements = [...state.achievements]; // Keep achievements
  fresh.tutorialDone = true; // Skip tutorial
  fresh.endgamePhase = 'straatdealer';
  fresh.victoryData = null;
  fresh.finalBossDefeated = false;
  fresh.freePlayMode = false;

  // Scale enemies for NG+
  fresh.nemesis.maxHp = 80 + ngLevel * 40;
  fresh.nemesis.hp = fresh.nemesis.maxHp;
  fresh.nemesis.power = 10 + ngLevel * 15;

  return fresh;
}

// ========== ENDGAME NOTIFICATIONS ==========

export function getPhaseUpMessage(oldPhase: EndgamePhase, newPhase: EndgamePhase): string | null {
  if (oldPhase === newPhase) return null;
  const phaseData = ENDGAME_PHASES.find(p => p.id === newPhase);
  if (!phaseData) return null;
  return `${phaseData.icon} Nieuwe rang: ${phaseData.label}! ${phaseData.desc}`;
}
