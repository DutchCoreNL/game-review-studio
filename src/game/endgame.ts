/**
 * Endgame system for Noxhaven
 * Progression phases, final boss, ranking, New Game+
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

export function startFinalBoss(state: GameState): CombatState | null {
  if (!canTriggerFinalBoss(state)) return null;

  const muscle = getPlayerStat(state, 'muscle');
  const playerMaxHP = 100 + (state.player.level * 8) + (muscle * 4);

  // Final boss: Commissioner Decker - scales with player
  const bossHP = 200 + state.player.level * 10 + state.day * 2;
  const bossAttack = 20 + state.player.level + Math.floor(state.day * 0.3);

  return {
    idx: 0,
    targetName: 'Commissaris Decker',
    targetHP: bossHP,
    enemyMaxHP: bossHP,
    enemyAttack: bossAttack,
    playerHP: playerMaxHP,
    playerMaxHP,
    logs: [
      '⚠️ OPERATIE GERECHTIGHEID ⚠️',
      'Commissaris Decker leidt persoonlijk de grootste politie-inval in de geschiedenis van Noxhaven.',
      '"Je hebt lang genoeg de baas gespeeld. Vanavond eindigt het."',
      '',
      'Dit is je laatste gevecht. Versla Decker om Noxhaven definitief te claimen.',
    ],
    isBoss: true,
    familyId: null,
    stunned: false,
    turn: 0,
    finished: false,
    won: false,
    isNemesis: false,
  };
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
