/**
 * Daily Challenges engine
 * Generates 3 random challenges per day, tracks progress, and handles rewards
 */

import { GameState, ActiveChallenge, DailyChallengeTemplate, ChallengeCategory } from './types';

// ========== CHALLENGE TEMPLATES ==========

const CHALLENGE_TEMPLATES: DailyChallengeTemplate[] = [
  // Trade challenges
  { id: 'trade_3', name: 'Handelaar', desc: 'Voltooi 3 transacties', category: 'trade', icon: '📦', checkType: 'trades', target: 3, rewardMoney: 1500, rewardXp: 20, rewardRep: 10, minDay: 1, minLevel: 1 },
  { id: 'trade_10', name: 'Marktmeester', desc: 'Voltooi 10 transacties', category: 'trade', icon: '📦', checkType: 'trades', target: 10, rewardMoney: 5000, rewardXp: 40, rewardRep: 25, minDay: 5, minLevel: 3 },
  { id: 'earn_5k', name: 'Dagwinst', desc: 'Verdien €5.000 vandaag', category: 'wealth', icon: '💰', checkType: 'earned', target: 5000, rewardMoney: 2000, rewardXp: 25, rewardRep: 15, minDay: 3, minLevel: 2 },
  { id: 'earn_25k', name: 'Grote Slag', desc: 'Verdien €25.000 vandaag', category: 'wealth', icon: '💰', checkType: 'earned', target: 25000, rewardMoney: 8000, rewardXp: 60, rewardRep: 30, minDay: 10, minLevel: 5 },
  { id: 'wash_money', name: 'Witwasser', desc: 'Was €3.000 zwart geld wit', category: 'trade', icon: '🧼', checkType: 'washed', target: 3000, rewardMoney: 1500, rewardXp: 20, rewardRep: 10, minDay: 5, minLevel: 3 },

  // Combat challenges
  { id: 'solo_op_1', name: 'Eénmansactie', desc: 'Voltooi een solo operatie', category: 'combat', icon: '🎯', checkType: 'solo_ops', target: 1, rewardMoney: 2000, rewardXp: 30, rewardRep: 15, minDay: 1, minLevel: 1 },
  { id: 'solo_op_3', name: 'Drievoudige Dreiging', desc: 'Voltooi 3 solo operaties', category: 'combat', icon: '🎯', checkType: 'solo_ops', target: 3, rewardMoney: 6000, rewardXp: 50, rewardRep: 30, minDay: 5, minLevel: 3 },
  { id: 'contract_1', name: 'Contractkiller', desc: 'Voltooi een contract', category: 'combat', icon: '⚔️', checkType: 'contracts', target: 1, rewardMoney: 3000, rewardXp: 35, rewardRep: 20, minDay: 3, minLevel: 2 },
  { id: 'contract_2', name: 'Dubbele Dienst', desc: 'Voltooi 2 contracten', category: 'combat', icon: '⚔️', checkType: 'contracts', target: 2, rewardMoney: 7000, rewardXp: 60, rewardRep: 35, minDay: 8, minLevel: 4 },

  // Empire challenges
  { id: 'travel_3', name: 'Reiziger', desc: 'Reis naar 3 districten', category: 'empire', icon: '🗺️', checkType: 'travels', target: 3, rewardMoney: 1000, rewardXp: 15, rewardRep: 10, minDay: 1, minLevel: 1 },
  { id: 'travel_5', name: 'Ontdekker', desc: 'Reis naar 5 districten', category: 'empire', icon: '🗺️', checkType: 'travels', target: 5, rewardMoney: 3000, rewardXp: 30, rewardRep: 20, minDay: 3, minLevel: 2 },
  { id: 'bribe_police', name: 'Corruptie', desc: 'Koop de politie om', category: 'social', icon: '👮', checkType: 'bribes', target: 1, rewardMoney: 2000, rewardXp: 20, rewardRep: 10, minDay: 3, minLevel: 2 },

  // Social challenges
  { id: 'faction_action', name: 'Diplomaat', desc: 'Voer een factie-actie uit', category: 'social', icon: '🤝', checkType: 'faction_actions', target: 1, rewardMoney: 2500, rewardXp: 25, rewardRep: 15, minDay: 5, minLevel: 3 },
  { id: 'faction_actions_3', name: 'Netwerker', desc: 'Voer 3 factie-acties uit', category: 'social', icon: '🤝', checkType: 'faction_actions', target: 3, rewardMoney: 6000, rewardXp: 45, rewardRep: 30, minDay: 10, minLevel: 5 },
  { id: 'recruit_crew', name: 'Rekruteerder', desc: 'Huur een crewlid', category: 'social', icon: '👥', checkType: 'recruits', target: 1, rewardMoney: 1500, rewardXp: 20, rewardRep: 10, minDay: 1, minLevel: 1 },

  // Stealth challenges
  { id: 'low_heat', name: 'Onder de Radar', desc: 'Eindig de dag met heat < 20', category: 'stealth', icon: '🥷', checkType: 'low_heat', target: 20, rewardMoney: 3000, rewardXp: 30, rewardRep: 20, minDay: 5, minLevel: 3 },
  { id: 'steal_car', name: 'Autodief', desc: 'Steel een auto', category: 'stealth', icon: '🚗', checkType: 'cars_stolen', target: 1, rewardMoney: 2000, rewardXp: 25, rewardRep: 15, minDay: 3, minLevel: 2 },

  // Casino challenges
  { id: 'casino_win', name: 'Geluksvogel', desc: 'Win €2.000 in het casino', category: 'wealth', icon: '🎰', checkType: 'casino_won', target: 2000, rewardMoney: 1000, rewardXp: 15, rewardRep: 5, minDay: 1, minLevel: 1 },
  { id: 'casino_win_big', name: 'High Roller', desc: 'Win €10.000 in het casino', category: 'wealth', icon: '🎰', checkType: 'casino_won', target: 10000, rewardMoney: 5000, rewardXp: 40, rewardRep: 20, minDay: 8, minLevel: 4 },
];

// ========== CATEGORY STYLING ==========

export const CHALLENGE_CATEGORIES: Record<ChallengeCategory, { label: string; color: string; bgColor: string }> = {
  trade: { label: 'Handel', color: 'text-gold', bgColor: 'bg-gold/10' },
  combat: { label: 'Gevecht', color: 'text-blood', bgColor: 'bg-blood/10' },
  empire: { label: 'Imperium', color: 'text-game-purple', bgColor: 'bg-game-purple/10' },
  social: { label: 'Sociaal', color: 'text-ice', bgColor: 'bg-ice/10' },
  stealth: { label: 'Stealth', color: 'text-emerald', bgColor: 'bg-emerald/10' },
  wealth: { label: 'Geld', color: 'text-gold', bgColor: 'bg-gold/10' },
};

/**
 * Generate 3 random daily challenges appropriate for the player's level and day.
 */
export function generateDailyChallenges(state: GameState): ActiveChallenge[] {
  const eligible = CHALLENGE_TEMPLATES.filter(t => 
    state.day >= t.minDay && state.player.level >= t.minLevel
  );

  if (eligible.length === 0) return [];

  // Pick 3 unique challenges from different categories when possible
  const picked: DailyChallengeTemplate[] = [];
  const usedCategories = new Set<ChallengeCategory>();
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);

  // First pass: try to get different categories
  for (const template of shuffled) {
    if (picked.length >= 3) break;
    if (!usedCategories.has(template.category)) {
      picked.push(template);
      usedCategories.add(template.category);
    }
  }

  // Second pass: fill remaining slots
  for (const template of shuffled) {
    if (picked.length >= 3) break;
    if (!picked.includes(template)) {
      picked.push(template);
    }
  }

  return picked.map(t => ({
    templateId: t.id,
    progress: 0,
    target: t.target,
    completed: false,
    claimed: false,
    generatedDay: state.day,
  }));
}

/**
 * Get the template definition for a challenge.
 */
export function getChallengeTemplate(templateId: string): DailyChallengeTemplate | undefined {
  return CHALLENGE_TEMPLATES.find(t => t.id === templateId);
}

/**
 * Track daily progress counters in the state.
 * Called from the reducer on relevant actions.
 */
export interface DailyProgress {
  trades: number;
  earned: number;
  washed: number;
  solo_ops: number;
  contracts: number;
  travels: number;
  bribes: number;
  faction_actions: number;
  recruits: number;
  cars_stolen: number;
  casino_won: number;
}

/**
 * Update challenge progress based on current daily trackers.
 * Returns the updated challenges array.
 */
export function updateChallengeProgress(challenges: ActiveChallenge[], progress: DailyProgress, heat: number): ActiveChallenge[] {
  return challenges.map(ch => {
    if (ch.completed) return ch;

    const template = getChallengeTemplate(ch.templateId);
    if (!template) return ch;

    let currentProgress = 0;

    switch (template.checkType) {
      case 'trades': currentProgress = progress.trades; break;
      case 'earned': currentProgress = progress.earned; break;
      case 'washed': currentProgress = progress.washed; break;
      case 'solo_ops': currentProgress = progress.solo_ops; break;
      case 'contracts': currentProgress = progress.contracts; break;
      case 'travels': currentProgress = progress.travels; break;
      case 'bribes': currentProgress = progress.bribes; break;
      case 'faction_actions': currentProgress = progress.faction_actions; break;
      case 'recruits': currentProgress = progress.recruits; break;
      case 'cars_stolen': currentProgress = progress.cars_stolen; break;
      case 'casino_won': currentProgress = progress.casino_won; break;
      case 'low_heat':
        // Special: "succeed" if heat is below target
        currentProgress = heat < template.target ? template.target : 0;
        break;
    }

    const newProgress = Math.min(currentProgress, ch.target);
    const nowCompleted = newProgress >= ch.target;

    return {
      ...ch,
      progress: newProgress,
      completed: nowCompleted,
    };
  });
}

/**
 * Get all challenge templates (for reference).
 */
export function getAllChallengeTemplates(): DailyChallengeTemplate[] {
  return CHALLENGE_TEMPLATES;
}
