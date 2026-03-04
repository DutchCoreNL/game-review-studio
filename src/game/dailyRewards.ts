// ========== DAILY REWARD SYSTEEM — 7-DAAGS LOGIN CYCLUS ==========

import { generateWeapon, type GeneratedWeapon } from './weaponGenerator';
import { generateGear, type GeneratedGear } from './gearGenerator';

export type DailyRewardType = 'money' | 'ammo' | 'gear' | 'weapon' | 'crate';

export interface DailyReward {
  day: number; // 1-7
  type: DailyRewardType;
  label: string;
  icon: string;
  amount?: number; // for money/ammo
  rarity?: string; // min rarity for weapon/gear
}

export const DAILY_REWARD_CYCLE: DailyReward[] = [
  { day: 1, type: 'money', label: '€2.500', icon: '💰', amount: 2500 },
  { day: 2, type: 'ammo', label: '15 Kogels', icon: '🔫', amount: 15 },
  { day: 3, type: 'money', label: '€5.000', icon: '💰', amount: 5000 },
  { day: 4, type: 'gear', label: 'Random Gear', icon: '🛡️', rarity: 'uncommon' },
  { day: 5, type: 'gear', label: 'Random Gear', icon: '⚙️', rarity: 'rare' },
  { day: 6, type: 'weapon', label: 'Rare+ Wapen', icon: '🗡️', rarity: 'rare' },
  { day: 7, type: 'crate', label: 'Epic Kist', icon: '📦', rarity: 'epic' },
];

export interface DailyRewardResult {
  reward: DailyReward;
  streakDay: number;
  money?: number;
  ammo?: number;
  weapon?: GeneratedWeapon;
  gear?: GeneratedGear;
}

/** Claim the daily reward for the current streak day */
export function claimDailyReward(streakDay: number, playerLevel: number): DailyRewardResult {
  const cycleDay = ((streakDay - 1) % 7) + 1; // 1-7 cycling
  const reward = DAILY_REWARD_CYCLE[cycleDay - 1];
  const result: DailyRewardResult = { reward, streakDay };

  switch (reward.type) {
    case 'money':
      result.money = reward.amount! * (1 + Math.floor(streakDay / 7) * 0.2); // 20% more per full cycle
      break;
    case 'ammo':
      result.ammo = reward.amount!;
      break;
    case 'gear': {
      const gearType = Math.random() < 0.5 ? 'armor' as const : 'gadget' as const;
      const minRarity = reward.rarity as any;
      result.gear = generateGear(playerLevel, gearType, minRarity);
      break;
    }
    case 'weapon':
      result.weapon = generateWeapon(playerLevel, reward.rarity as any);
      break;
    case 'crate': {
      // Epic crate: 60% weapon, 40% gear, guaranteed epic+
      if (Math.random() < 0.6) {
        const r = Math.random() < 0.15 ? 'legendary' as const : 'epic' as const;
        result.weapon = generateWeapon(playerLevel, r);
      } else {
        const gearType = Math.random() < 0.5 ? 'armor' as const : 'gadget' as const;
        const r = Math.random() < 0.15 ? 'legendary' as const : 'epic' as const;
        result.gear = generateGear(playerLevel, gearType, r);
      }
      break;
    }
  }

  return result;
}

/** Check if daily reward can be claimed (new real-world day) */
export function canClaimDailyReward(lastClaimDate: string | null): boolean {
  if (!lastClaimDate) return true;
  const lastDate = new Date(lastClaimDate).toDateString();
  const today = new Date().toDateString();
  return lastDate !== today;
}

/** Check if streak should reset (missed a day) */
export function shouldResetStreak(lastClaimDate: string | null): boolean {
  if (!lastClaimDate) return false;
  const last = new Date(lastClaimDate);
  const now = new Date();
  const diffMs = now.getTime() - last.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 2; // missed at least 1 full day
}
