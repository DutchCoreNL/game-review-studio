// ========== CAMPAIGN REWARDS — Trophies, milestones, streaks ==========

export interface BossTrophy {
  bossId: string;
  name: string;
  icon: string;
  effect: string;
}

export const BOSS_TROPHIES: Record<string, BossTrophy> = {
  boss_viktor: { bossId: 'boss_viktor', name: "Kozlov's Bijl", icon: '🪓', effect: '+3% crit kans' },
  boss_vasari: { bossId: 'boss_vasari', name: "Vasari's Ring", icon: '💍', effect: '+5% handelswinst' },
  boss_carmela: { bossId: 'boss_carmela', name: "La Loba's Tand", icon: '🐺', effect: '+3% dodge kans' },
  boss_decker: { bossId: 'boss_decker', name: "Decker's Badge", icon: '🛡️', effect: '-5% heat per actie' },
  boss_architect: { bossId: 'boss_architect', name: "Architect's Blauwdruk", icon: '📐', effect: '+8% XP bonus' },
  boss_oracle: { bossId: 'boss_oracle', name: "Orakel's Kristal", icon: '🔮', effect: '+5% succes kans' },
  boss_phoenix: { bossId: 'boss_phoenix', name: "Feniks Veer", icon: '🪶', effect: '+10% HP regeneratie' },
  boss_noxhaven: { bossId: 'boss_noxhaven', name: "Kroon van Noxhaven", icon: '👑', effect: '+10% alle stats' },
};

export interface MilestoneReward {
  threshold: number;
  name: string;
  icon: string;
  description: string;
}

export const ENCOUNTER_MILESTONES: MilestoneReward[] = [
  { threshold: 10, name: 'Beginneling', icon: '🌱', description: '10 encounters voltooid' },
  { threshold: 25, name: 'Ervaren', icon: '⭐', description: '25 encounters voltooid' },
  { threshold: 50, name: 'Veteraan', icon: '🎖️', description: '50 encounters voltooid' },
  { threshold: 100, name: 'Legende', icon: '🏆', description: '100 encounters voltooid' },
  { threshold: 200, name: 'Onsterfelijk', icon: '💎', description: '200 encounters voltooid' },
];

export function getNextMilestone(completed: number): MilestoneReward | null {
  return ENCOUNTER_MILESTONES.find(m => m.threshold > completed) || null;
}

export function getAchievedMilestones(completed: number): MilestoneReward[] {
  return ENCOUNTER_MILESTONES.filter(m => m.threshold <= completed);
}

export function getStreakBonus(streak: number): { money: number; xp: number } {
  if (streak >= 5) return { money: 5000, xp: 200 };
  if (streak >= 3) return { money: 2000, xp: 100 };
  return { money: 0, xp: 0 };
}
