import { StatId } from './types';

// ========== SKILL TREE SYSTEM ==========

export type SkillBranch = 'muscle' | 'brains' | 'charm';

export interface SkillNode {
  id: string;
  name: string;
  desc: string;
  icon: string;
  branch: SkillBranch;
  tier: number; // 1-3 (depth in tree)
  cost: number; // SP cost
  requires: string | null; // parent skill id
  effects: SkillEffect[];
  maxLevel: number; // 1-3
}

export interface SkillEffect {
  type: 'stat_bonus' | 'passive' | 'unlock';
  stat?: StatId;
  value?: number;
  key?: string; // e.g. 'crit_chance', 'trade_bonus'
  label: string;
}

export const SKILL_NODES: SkillNode[] = [
  // ========== MUSCLE BRANCH ==========
  {
    id: 'brawler', name: 'Brawler', desc: 'Basis gevechtstechnieken.',
    icon: '👊', branch: 'muscle', tier: 1, cost: 1, requires: null, maxLevel: 3,
    effects: [
      { type: 'stat_bonus', stat: 'muscle', value: 1, label: '+1 Kracht per level' },
      { type: 'passive', key: 'crit_chance', value: 3, label: '+3% crit kans per level' },
    ],
  },
  {
    id: 'tank', name: 'Tank', desc: 'Verhoogde verdediging en HP.',
    icon: '🛡️', branch: 'muscle', tier: 2, cost: 2, requires: 'brawler', maxLevel: 3,
    effects: [
      { type: 'passive', key: 'max_hp_bonus', value: 15, label: '+15 Max HP per level' },
      { type: 'passive', key: 'damage_reduction', value: 5, label: '+5% schade reductie per level' },
    ],
  },
  {
    id: 'berserker', name: 'Berserker', desc: 'Ongeremde kracht bij lage HP.',
    icon: '🔥', branch: 'muscle', tier: 3, cost: 3, requires: 'tank', maxLevel: 2,
    effects: [
      { type: 'passive', key: 'lifesteal', value: 8, label: '+8% lifesteal per level' },
      { type: 'passive', key: 'low_hp_damage', value: 20, label: '+20% schade onder 30% HP per level' },
    ],
  },

  // ========== BRAINS BRANCH ==========
  {
    id: 'hacker', name: 'Hacker', desc: 'Digitale infiltratie.',
    icon: '💻', branch: 'brains', tier: 1, cost: 1, requires: null, maxLevel: 3,
    effects: [
      { type: 'stat_bonus', stat: 'brains', value: 1, label: '+1 Vernuft per level' },
      { type: 'passive', key: 'hack_success', value: 5, label: '+5% hack slagingskans per level' },
    ],
  },
  {
    id: 'strategist', name: 'Strateeg', desc: 'Betere planning en handel.',
    icon: '🎯', branch: 'brains', tier: 2, cost: 2, requires: 'hacker', maxLevel: 3,
    effects: [
      { type: 'passive', key: 'trade_bonus', value: 4, label: '+4% handelswinst per level' },
      { type: 'passive', key: 'heist_intel', value: 10, label: '+10% heist intel per level' },
    ],
  },
  {
    id: 'mastermind', name: 'Mastermind', desc: 'Ultieme controle over alle operaties.',
    icon: '🧠', branch: 'brains', tier: 3, cost: 3, requires: 'strategist', maxLevel: 2,
    effects: [
      { type: 'passive', key: 'xp_bonus', value: 10, label: '+10% XP bonus per level' },
      { type: 'passive', key: 'cooldown_reduction', value: 15, label: '-15% cooldowns per level' },
    ],
  },

  // ========== CHARM BRANCH ==========
  {
    id: 'smooth_talker', name: 'Gladde Prater', desc: 'Meester in overtuiging.',
    icon: '🗣️', branch: 'charm', tier: 1, cost: 1, requires: null, maxLevel: 3,
    effects: [
      { type: 'stat_bonus', stat: 'charm', value: 1, label: '+1 Charisma per level' },
      { type: 'passive', key: 'npc_relation', value: 5, label: '+5% NPC relatie bonus per level' },
    ],
  },
  {
    id: 'negotiator', name: 'Onderhandelaar', desc: 'Betere deals en recruitering.',
    icon: '🤝', branch: 'charm', tier: 2, cost: 2, requires: 'smooth_talker', maxLevel: 3,
    effects: [
      { type: 'passive', key: 'recruit_chance', value: 8, label: '+8% recruit kans per level' },
      { type: 'passive', key: 'corruption_discount', value: 10, label: '-10% corruptiekosten per level' },
    ],
  },
  {
    id: 'kingpin', name: 'Kingpin', desc: 'Absolute macht en invloed.',
    icon: '👑', branch: 'charm', tier: 3, cost: 3, requires: 'negotiator', maxLevel: 2,
    effects: [
      { type: 'passive', key: 'rep_multiplier', value: 15, label: '+15% rep bonus per level' },
      { type: 'passive', key: 'intimidation', value: 20, label: '+20% intimidatie bonus per level' },
    ],
  },
];

export const BRANCH_INFO: Record<SkillBranch, { label: string; color: string; icon: string }> = {
  muscle: { label: 'Kracht', color: 'text-blood', icon: '⚔️' },
  brains: { label: 'Vernuft', color: 'text-ice', icon: '🧠' },
  charm: { label: 'Charisma', color: 'text-gold', icon: '👑' },
};

// ========== XP MULTIPLIER CONFIG ==========

export const XP_MULTIPLIERS = {
  // District danger bonuses
  districtBonus: { port: 0.05, iron: 0.10, neon: 0.15, crown: 0.20, low: 0.0 } as Record<string, number>,
  // Streak bonus: +2% per consecutive action without hospitalization (max 20%)
  streakMax: 10,
  streakPerAction: 0.02,
  // Gang bonus: flat +10% if in gang
  gangBonus: 0.10,
  // First action of the day: 2x XP
  firstOfDayMultiplier: 2.0,
  // Prestige: +5% per prestige level
  prestigePerLevel: 0.05,
  // Mastermind skill: +10% per level
  mastermindPerLevel: 0.10,
};

// ========== LEVEL GATING ==========

export const LEVEL_GATES: { level: number; unlocks: string[] }[] = [
  { level: 1, unlocks: ['Solo ops', 'Basic trade'] },
  { level: 5, unlocks: ['Car theft', 'Chop shop'] },
  { level: 10, unlocks: ['Contracts', 'Basic PvP', 'Skill Tree Tier 2'] },
  { level: 15, unlocks: ['Safehouse', 'Corruption netwerk'] },
  { level: 20, unlocks: ['Heists', 'Casino VIP', 'Factions'] },
  { level: 25, unlocks: ['Villa', 'Skill Tree Tier 3'] },
  { level: 30, unlocks: ['Drug Empire', 'Gang Wars'] },
  { level: 40, unlocks: ['Endgame Bosses'] },
  { level: 50, unlocks: ['Prestige unlock'] },
];

// ========== PRESTIGE CONFIG ==========

export const PRESTIGE_CONFIG = {
  requiredLevel: 50,
  xpBonusPerLevel: 0.05, // +5% per prestige
  maxPrestige: 10,
  rewards: [
    { level: 1, reward: 'Prestige Badge 🥇', desc: 'Gouden badge naast je naam' },
    { level: 2, reward: 'Elite Contracts ⚡', desc: 'Toegang tot elite contracten' },
    { level: 3, reward: 'Prestige Gear 🔮', desc: 'Unieke prestige wapens' },
    { level: 5, reward: 'Prestige Villa 🏰', desc: 'Speciale villa modules' },
    { level: 10, reward: 'Legende Status 💀', desc: 'Permanente leaderboard vermelding' },
  ],
};

/** Get total skill level for a given skill across all levels */
export function getSkillLevel(unlockedSkills: { skillId: string; level: number }[], skillId: string): number {
  return unlockedSkills.find(s => s.skillId === skillId)?.level || 0;
}

/** Check if a skill can be unlocked/upgraded */
export function canUnlockSkill(
  node: SkillNode,
  unlockedSkills: { skillId: string; level: number }[],
  availableSP: number,
  playerLevel: number
): { canUnlock: boolean; reason?: string } {
  const current = getSkillLevel(unlockedSkills, node.id);
  if (current >= node.maxLevel) return { canUnlock: false, reason: 'Max level bereikt' };
  if (availableSP < node.cost) return { canUnlock: false, reason: `${node.cost} SP nodig` };
  
  // Tier requirements
  const tierLevelReq = node.tier === 2 ? 10 : node.tier === 3 ? 25 : 1;
  if (playerLevel < tierLevelReq) return { canUnlock: false, reason: `Level ${tierLevelReq} vereist` };
  
  // Parent requirement
  if (node.requires) {
    const parentLevel = getSkillLevel(unlockedSkills, node.requires);
    if (parentLevel < 1) return { canUnlock: false, reason: `Vereist: ${SKILL_NODES.find(n => n.id === node.requires)?.name}` };
  }
  
  return { canUnlock: true };
}

/** Calculate total passive bonus from skills */
export function getSkillPassive(unlockedSkills: { skillId: string; level: number }[], key: string): number {
  let total = 0;
  for (const s of unlockedSkills) {
    const node = SKILL_NODES.find(n => n.id === s.skillId);
    if (!node) continue;
    for (const e of node.effects) {
      if (e.type === 'passive' && e.key === key && e.value) {
        total += e.value * s.level;
      }
    }
  }
  return total;
}

/** Calculate total stat bonus from skills */
export function getSkillStatBonus(unlockedSkills: { skillId: string; level: number }[], stat: StatId): number {
  let total = 0;
  for (const s of unlockedSkills) {
    const node = SKILL_NODES.find(n => n.id === s.skillId);
    if (!node) continue;
    for (const e of node.effects) {
      if (e.type === 'stat_bonus' && e.stat === stat && e.value) {
        total += e.value * s.level;
      }
    }
  }
  return total;
}
