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

export interface PrestigePerk {
  level: number;
  label: string;
  icon: string;
  desc: string;
  cash_bonus: number;
  sp_carry: number;
  stat_bonus?: Record<string, number>;
  max_hp_bonus?: number;
  max_energy_bonus?: number;
}

export const PRESTIGE_CONFIG = {
  requiredLevel: 50,
  xpBonusPerLevel: 0.05,
  maxPrestige: 10,
  rewards: [
    { level: 1, label: 'Prestige I', icon: '🥇', desc: 'Gouden badge + €25K startbonus', cash_bonus: 25000, sp_carry: 2 },
    { level: 2, label: 'Prestige II', icon: '⚡', desc: 'Elite Contracts + Kracht +2, HP +10', cash_bonus: 50000, sp_carry: 3, stat_bonus: { muscle: 2 }, max_hp_bonus: 10 },
    { level: 3, label: 'Prestige III', icon: '🔮', desc: 'Prestige Gear + Vernuft +2, Energy +10', cash_bonus: 75000, sp_carry: 4, stat_bonus: { brains: 2 }, max_energy_bonus: 10 },
    { level: 4, label: 'Prestige IV', icon: '🎖️', desc: 'Veteraan + Charisma +2, HP +15', cash_bonus: 100000, sp_carry: 5, stat_bonus: { charm: 2 }, max_hp_bonus: 15 },
    { level: 5, label: 'Prestige V', icon: '🏰', desc: 'Prestige Villa + Kracht/Vernuft +2, Energy +15', cash_bonus: 150000, sp_carry: 6, stat_bonus: { muscle: 2, brains: 2 }, max_energy_bonus: 15 },
    { level: 6, label: 'Prestige VI', icon: '👑', desc: 'Onderwerelds Icoon + Kracht +3, Charisma +2, HP +20', cash_bonus: 200000, sp_carry: 7, stat_bonus: { muscle: 3, charm: 2 }, max_hp_bonus: 20 },
    { level: 7, label: 'Prestige VII', icon: '🌑', desc: 'Schaduwkoning + Vernuft/Charisma +3, Energy +20', cash_bonus: 250000, sp_carry: 8, stat_bonus: { brains: 3, charm: 3 }, max_energy_bonus: 20 },
    { level: 8, label: 'Prestige VIII', icon: '💀', desc: 'Onsterfelijk + Alle stats +3, HP +25', cash_bonus: 350000, sp_carry: 9, stat_bonus: { muscle: 3, brains: 3, charm: 3 }, max_hp_bonus: 25 },
    { level: 9, label: 'Prestige IX', icon: '🔱', desc: 'Godfather + Alle stats +5, HP +30, Energy +25', cash_bonus: 500000, sp_carry: 10, stat_bonus: { muscle: 5, brains: 5, charm: 5 }, max_hp_bonus: 30, max_energy_bonus: 25 },
    { level: 10, label: 'Prestige X', icon: '🌟', desc: 'Legende + Alle stats +8, HP +50, Energy +50, €1M', cash_bonus: 1000000, sp_carry: 15, stat_bonus: { muscle: 8, brains: 8, charm: 8 }, max_hp_bonus: 50, max_energy_bonus: 50 },
  ] as PrestigePerk[],
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
