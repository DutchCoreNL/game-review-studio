// ========== WEAPON CHALLENGE SYSTEM ==========
// Per-weapon kill/combat challenges that unlock permanent stat bonuses

import type { FrameId } from './weaponGenerator';

// ========== TYPES ==========

export interface WeaponChallengeTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  target: number; // kills/wins needed
  reward: {
    critBonus?: number;
    accuracyBonus?: number;
    damageMult?: number;
    armorPierce?: number;
    fireRateBonus?: number;
  };
  rewardLabel: string;
}

export interface WeaponChallengeProgress {
  challengeId: string;
  progress: number;
  completed: boolean;
}

// ========== CHALLENGE DEFINITIONS ==========
// These apply per-weapon (tracked on each GeneratedWeapon)

export const WEAPON_CHALLENGES: WeaponChallengeTemplate[] = [
  {
    id: 'kills_25',
    name: 'Eerste Bloed',
    icon: '🩸',
    description: 'Win 25 gevechten met dit wapen',
    target: 25,
    reward: { critBonus: 3 },
    rewardLabel: '+3% crit kans',
  },
  {
    id: 'kills_50',
    name: 'Veteraan',
    icon: '⭐',
    description: 'Win 50 gevechten met dit wapen',
    target: 50,
    reward: { accuracyBonus: 1 },
    rewardLabel: '+1 accuracy',
  },
  {
    id: 'kills_100',
    name: 'Oorlogsmachine',
    icon: '💀',
    description: 'Win 100 gevechten met dit wapen',
    target: 100,
    reward: { critBonus: 5 },
    rewardLabel: '+5% crit kans',
  },
  {
    id: 'kills_250',
    name: 'Legende',
    icon: '👑',
    description: 'Win 250 gevechten met dit wapen',
    target: 250,
    reward: { damageMult: 1.05 },
    rewardLabel: '+5% schade',
  },
  {
    id: 'perfect_10',
    name: 'Perfectionist',
    icon: '🎯',
    description: 'Win 10 gevechten zonder geraakt te worden',
    target: 10,
    reward: { accuracyBonus: 2 },
    rewardLabel: '+2 accuracy',
  },
];

// ========== FUNCTIONS ==========

/** Initialize challenge progress for a new weapon */
export function initWeaponChallenges(): WeaponChallengeProgress[] {
  return WEAPON_CHALLENGES.map(c => ({
    challengeId: c.id,
    progress: 0,
    completed: false,
  }));
}

/** Update progress for kill-based challenges */
export function updateChallengeProgress(
  challenges: WeaponChallengeProgress[],
  type: 'kill' | 'perfect_kill',
): { updated: WeaponChallengeProgress[]; newlyCompleted: WeaponChallengeTemplate[] } {
  const newlyCompleted: WeaponChallengeTemplate[] = [];
  const updated = challenges.map(cp => {
    const template = WEAPON_CHALLENGES.find(c => c.id === cp.challengeId);
    if (!template || cp.completed) return cp;

    // Check which challenges this event applies to
    let applies = false;
    if (type === 'kill' && template.id.startsWith('kills_')) applies = true;
    if (type === 'perfect_kill' && template.id === 'perfect_10') applies = true;
    // Kills also count for kill-based challenges
    if (type === 'perfect_kill' && template.id.startsWith('kills_')) applies = true;

    if (!applies) return cp;

    const newProgress = cp.progress + 1;
    const completed = newProgress >= template.target;
    if (completed && !cp.completed) {
      newlyCompleted.push(template);
    }

    return { ...cp, progress: Math.min(newProgress, template.target), completed };
  });

  return { updated, newlyCompleted };
}

/** Get total challenge bonuses for a weapon */
export function getChallengeBonus(challenges: WeaponChallengeProgress[]): {
  critBonus: number;
  accuracyBonus: number;
  damageMult: number;
  armorPierce: number;
  fireRateBonus: number;
} {
  const result = { critBonus: 0, accuracyBonus: 0, damageMult: 1, armorPierce: 0, fireRateBonus: 0 };

  for (const cp of challenges) {
    if (!cp.completed) continue;
    const template = WEAPON_CHALLENGES.find(c => c.id === cp.challengeId);
    if (!template) continue;

    if (template.reward.critBonus) result.critBonus += template.reward.critBonus;
    if (template.reward.accuracyBonus) result.accuracyBonus += template.reward.accuracyBonus;
    if (template.reward.damageMult) result.damageMult *= template.reward.damageMult;
    if (template.reward.armorPierce) result.armorPierce += template.reward.armorPierce;
    if (template.reward.fireRateBonus) result.fireRateBonus += template.reward.fireRateBonus;
  }

  return result;
}

/** Get number of completed challenges for display */
export function getCompletedChallengeCount(challenges: WeaponChallengeProgress[]): number {
  return challenges.filter(c => c.completed).length;
}
