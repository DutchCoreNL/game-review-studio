import { GameState } from './types';

// ========== MERIT NODE DEFINITIONS ==========

export type MeritCategoryId = 'combat' | 'trade' | 'stealth' | 'leadership' | 'survival';

export interface MeritNodeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  category: MeritCategoryId;
  maxLevel: number;
  costPerLevel: number; // merit points per level
  requires?: string; // prerequisite node id
  minPlayerLevel?: number; // minimum player level to unlock
  bonusPerLevel: MeritBonus;
}

export interface MeritBonus {
  type: 'damage' | 'defense' | 'xp' | 'cash' | 'heat_reduction' | 'trade_discount' | 'crit_chance' | 'rep' | 'crew_loyalty' | 'energy_regen' | 'nerve_regen' | 'hp' | 'max_energy' | 'max_nerve' | 'ammo_save' | 'smuggle_profit';
  value: number; // per level (percentage or flat)
  label: string; // e.g. "+5% schade"
}

export const MERIT_CATEGORIES: { id: MeritCategoryId; name: string; icon: string; color: string }[] = [
  { id: 'combat', name: 'Gevecht', icon: '⚔️', color: 'text-red-400' },
  { id: 'trade', name: 'Handel', icon: '💰', color: 'text-yellow-400' },
  { id: 'stealth', name: 'Stealth', icon: '🌑', color: 'text-purple-400' },
  { id: 'leadership', name: 'Leiderschap', icon: '👑', color: 'text-blue-400' },
  { id: 'survival', name: 'Overleving', icon: '🛡️', color: 'text-green-400' },
];

export const MERIT_NODES: MeritNodeDef[] = [
  // ===== COMBAT =====
  { id: 'brute_force', name: 'Brute Kracht', desc: 'Meer schade bij gevechten', icon: '💪', category: 'combat', maxLevel: 5, costPerLevel: 1, bonusPerLevel: { type: 'damage', value: 5, label: '+5% schade' } },
  { id: 'thick_skin', name: 'Dikke Huid', desc: 'Minder schade ontvangen', icon: '🦾', category: 'combat', maxLevel: 5, costPerLevel: 1, requires: 'brute_force', bonusPerLevel: { type: 'defense', value: 5, label: '+5% verdediging' } },
  { id: 'critical_eye', name: 'Kritisch Oog', desc: 'Hogere kans op critical hits', icon: '🎯', category: 'combat', maxLevel: 3, costPerLevel: 2, requires: 'brute_force', minPlayerLevel: 10, bonusPerLevel: { type: 'crit_chance', value: 3, label: '+3% crit kans' } },
  { id: 'ammo_saver', name: 'Munitie Spaarder', desc: 'Kans om geen ammo te verbruiken', icon: '🔫', category: 'combat', maxLevel: 3, costPerLevel: 2, requires: 'thick_skin', minPlayerLevel: 15, bonusPerLevel: { type: 'ammo_save', value: 5, label: '+5% ammo besparing' } },

  // ===== TRADE =====
  { id: 'shrewd_trader', name: 'Slimme Handelaar', desc: 'Betere inkoop- en verkoopprijzen', icon: '🤝', category: 'trade', maxLevel: 5, costPerLevel: 1, bonusPerLevel: { type: 'trade_discount', value: 3, label: '+3% handelsvoordeel' } },
  { id: 'cash_flow', name: 'Cash Flow', desc: 'Meer cash verdienen bij alle acties', icon: '💵', category: 'trade', maxLevel: 5, costPerLevel: 1, requires: 'shrewd_trader', bonusPerLevel: { type: 'cash', value: 4, label: '+4% cash bonus' } },
  { id: 'smuggle_master', name: 'Smokkel Meester', desc: 'Hogere winst op smokkelroutes', icon: '📦', category: 'trade', maxLevel: 3, costPerLevel: 2, requires: 'cash_flow', minPlayerLevel: 15, bonusPerLevel: { type: 'smuggle_profit', value: 8, label: '+8% smokkelwinst' } },

  // ===== STEALTH =====
  { id: 'ghost', name: 'Spook', desc: 'Minder heat bij alle acties', icon: '👻', category: 'stealth', maxLevel: 5, costPerLevel: 1, bonusPerLevel: { type: 'heat_reduction', value: 4, label: '-4% heat' } },
  { id: 'xp_hunter', name: 'XP Jager', desc: 'Meer XP verdienen', icon: '⭐', category: 'stealth', maxLevel: 5, costPerLevel: 1, requires: 'ghost', bonusPerLevel: { type: 'xp', value: 3, label: '+3% XP' } },

  // ===== LEADERSHIP =====
  { id: 'inspiring', name: 'Inspirerend', desc: 'Meer reputatie verdienen', icon: '📢', category: 'leadership', maxLevel: 5, costPerLevel: 1, bonusPerLevel: { type: 'rep', value: 5, label: '+5% reputatie' } },
  { id: 'crew_bond', name: 'Crew Band', desc: 'Hogere crew loyaliteit', icon: '🤜', category: 'leadership', maxLevel: 3, costPerLevel: 2, requires: 'inspiring', minPlayerLevel: 10, bonusPerLevel: { type: 'crew_loyalty', value: 5, label: '+5 crew loyaliteit' } },

  // ===== SURVIVAL =====
  { id: 'endurance', name: 'Uithoudingsvermogen', desc: 'Meer max HP', icon: '❤️', category: 'survival', maxLevel: 5, costPerLevel: 1, bonusPerLevel: { type: 'hp', value: 10, label: '+10 max HP' } },
  { id: 'quick_recovery', name: 'Snel Herstel', desc: 'Snellere energy regeneratie', icon: '⚡', category: 'survival', maxLevel: 3, costPerLevel: 2, requires: 'endurance', minPlayerLevel: 10, bonusPerLevel: { type: 'energy_regen', value: 10, label: '+10% energy regen' } },
  { id: 'iron_nerves', name: 'IJzeren Zenuwen', desc: 'Meer max nerve', icon: '🧠', category: 'survival', maxLevel: 3, costPerLevel: 2, requires: 'endurance', minPlayerLevel: 10, bonusPerLevel: { type: 'max_nerve', value: 5, label: '+5 max nerve' } },
];

// ========== MERIT POINTS PER LEVEL-UP ==========
export const MERIT_POINTS_PER_LEVEL = 1;
export const BONUS_MERIT_AT_LEVELS = [5, 10, 15, 20, 25, 30, 40, 50]; // extra +1 at these milestones

export function getMeritPointsForLevelUp(newLevel: number): number {
  let points = MERIT_POINTS_PER_LEVEL;
  if (BONUS_MERIT_AT_LEVELS.includes(newLevel)) points += 1;
  return points;
}

// ========== HELPERS ==========

export function getMeritNodeLevel(state: GameState, nodeId: string): number {
  return (state.meritNodes || {})[nodeId] || 0;
}

export function canUnlockMeritNode(state: GameState, nodeDef: MeritNodeDef): { canUnlock: boolean; reason?: string } {
  const currentLevel = getMeritNodeLevel(state, nodeDef.id);
  if (currentLevel >= nodeDef.maxLevel) return { canUnlock: false, reason: 'Max level bereikt' };
  
  const cost = nodeDef.costPerLevel;
  if ((state.meritPoints || 0) < cost) return { canUnlock: false, reason: `Niet genoeg merit punten (${cost} nodig)` };
  
  if (nodeDef.requires) {
    const reqNode = MERIT_NODES.find(n => n.id === nodeDef.requires);
    if (reqNode && getMeritNodeLevel(state, nodeDef.requires) < 1) {
      return { canUnlock: false, reason: `Vereist: ${reqNode.name}` };
    }
  }
  
  if (nodeDef.minPlayerLevel && state.player.level < nodeDef.minPlayerLevel) {
    return { canUnlock: false, reason: `Vereist level ${nodeDef.minPlayerLevel}` };
  }
  
  return { canUnlock: true };
}

/** Get total bonus value from all invested merit nodes for a given bonus type */
export function getMeritBonus(state: GameState, bonusType: MeritBonus['type']): number {
  let total = 0;
  for (const node of MERIT_NODES) {
    if (node.bonusPerLevel.type === bonusType) {
      const level = getMeritNodeLevel(state, node.id);
      total += level * node.bonusPerLevel.value;
    }
  }
  return total;
}

/** Get merit bonus as multiplier (e.g. 15% → 1.15) */
export function getMeritMultiplier(state: GameState, bonusType: MeritBonus['type']): number {
  return 1 + getMeritBonus(state, bonusType) / 100;
}
