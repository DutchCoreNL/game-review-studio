// ========== DUNGEON / RAID SYSTEEM — IDLE-STIJL ==========

import type { LootBoxTier } from './lootBoxes';

export type DungeonId = 'gang_raid' | 'tunnels' | 'complex' | 'docks';
export type DungeonTier = 1 | 2 | 3 | 4 | 5;

export interface DungeonDef {
  id: DungeonId;
  name: string;
  icon: string;
  description: string;
  color: string;       // tailwind token
  glowColor: string;   // HSL for effects
}

export const DUNGEON_DEFS: DungeonDef[] = [
  {
    id: 'gang_raid',
    name: 'Bende Raid',
    icon: '🔥',
    description: 'Val een rivaliserende bende aan in hun eigen safehouse. Verwacht zware weerstand.',
    color: 'text-blood',
    glowColor: '0 70% 50%',
  },
  {
    id: 'tunnels',
    name: 'Ondergrondse Tunnels',
    icon: '🕳️',
    description: 'Verlaten metrotunnels vol vallen, smokkelwaar en vergeten schatten.',
    color: 'text-emerald',
    glowColor: '160 60% 45%',
  },
  {
    id: 'complex',
    name: 'Beveiligd Complex',
    icon: '🏢',
    description: 'Infiltreer een zwaar beveiligd bedrijfsgebouw. Stealth en tech zijn essentieel.',
    color: 'text-ice',
    glowColor: '200 70% 55%',
  },
  {
    id: 'docks',
    name: 'Haven & Dokken',
    icon: '⚓',
    description: 'Smokkelroutes en verlaten scheepswrakken vol gevaarlijke NPCs en contrabande.',
    color: 'text-gold',
    glowColor: '45 80% 55%',
  },
];

export interface DungeonTierDef {
  tier: DungeonTier;
  name: string;
  label: string;
  minLevel: number;
  durationMinutes: number;    // real-time minutes
  energyCost: number;
  moneyRange: [number, number];
  xpRange: [number, number];
  scrapRange: [number, number];
  lootBoxChances: Partial<Record<LootBoxTier, number>>; // chance 0-1 for each box type
  failChanceBase: number;     // base fail chance (reduced by stats)
}

export const DUNGEON_TIERS: DungeonTierDef[] = [
  {
    tier: 1, name: 'Verkenning', label: 'Tier 1',
    minLevel: 1, durationMinutes: 5, energyCost: 15,
    moneyRange: [1000, 5000], xpRange: [50, 120], scrapRange: [1, 3],
    lootBoxChances: { street: 0.60, underground: 0.10 },
    failChanceBase: 0.05,
  },
  {
    tier: 2, name: 'Aanval', label: 'Tier 2',
    minLevel: 5, durationMinutes: 10, energyCost: 25,
    moneyRange: [3000, 12000], xpRange: [100, 250], scrapRange: [2, 6],
    lootBoxChances: { street: 0.45, underground: 0.30, kingpin: 0.05 },
    failChanceBase: 0.10,
  },
  {
    tier: 3, name: 'Invasie', label: 'Tier 3',
    minLevel: 10, durationMinutes: 20, energyCost: 40,
    moneyRange: [8000, 25000], xpRange: [200, 500], scrapRange: [4, 12],
    lootBoxChances: { street: 0.25, underground: 0.40, kingpin: 0.15, nox: 0.02 },
    failChanceBase: 0.18,
  },
  {
    tier: 4, name: 'Verwoesting', label: 'Tier 4',
    minLevel: 18, durationMinutes: 35, energyCost: 60,
    moneyRange: [15000, 50000], xpRange: [400, 900], scrapRange: [8, 25],
    lootBoxChances: { underground: 0.35, kingpin: 0.35, nox: 0.10 },
    failChanceBase: 0.25,
  },
  {
    tier: 5, name: 'Apocalyps', label: 'Tier 5',
    minLevel: 25, durationMinutes: 60, energyCost: 80,
    moneyRange: [30000, 100000], xpRange: [800, 1800], scrapRange: [15, 50],
    lootBoxChances: { underground: 0.20, kingpin: 0.45, nox: 0.25 },
    failChanceBase: 0.35,
  },
];

export interface ActiveDungeonRun {
  dungeonId: DungeonId;
  tier: DungeonTier;
  startedAt: string;     // ISO timestamp
  completesAt: string;   // ISO timestamp
}

export interface DungeonRunResult {
  dungeonId: DungeonId;
  tier: DungeonTier;
  success: boolean;
  money: number;
  xp: number;
  scrap: number;
  lootBoxRewards: LootBoxTier[];   // which loot boxes dropped
  bonusText: string | null;
}

export function getDungeonDef(id: DungeonId): DungeonDef {
  return DUNGEON_DEFS.find(d => d.id === id)!;
}

export function getDungeonTierDef(tier: DungeonTier): DungeonTierDef {
  return DUNGEON_TIERS.find(t => t.tier === tier)!;
}

export function canStartDungeon(
  tier: DungeonTier,
  playerLevel: number,
  energy: number,
  activeDungeon: ActiveDungeonRun | null,
): { ok: boolean; reason?: string } {
  if (activeDungeon) return { ok: false, reason: 'Je hebt al een actieve run.' };
  const tierDef = getDungeonTierDef(tier);
  if (playerLevel < tierDef.minLevel) return { ok: false, reason: `Minimaal level ${tierDef.minLevel} vereist.` };
  if (energy < tierDef.energyCost) return { ok: false, reason: `Niet genoeg energie (${tierDef.energyCost} nodig).` };
  return { ok: true };
}

export function startDungeonRun(dungeonId: DungeonId, tier: DungeonTier): ActiveDungeonRun {
  const tierDef = getDungeonTierDef(tier);
  const now = new Date();
  const completesAt = new Date(now.getTime() + tierDef.durationMinutes * 60 * 1000);
  return {
    dungeonId,
    tier,
    startedAt: now.toISOString(),
    completesAt: completesAt.toISOString(),
  };
}

export function isDungeonComplete(run: ActiveDungeonRun): boolean {
  return new Date() >= new Date(run.completesAt);
}

export function getTimeRemaining(run: ActiveDungeonRun): { minutes: number; seconds: number; totalSeconds: number } {
  const remaining = Math.max(0, new Date(run.completesAt).getTime() - Date.now());
  const totalSeconds = Math.ceil(remaining / 1000);
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
  };
}

/**
 * Resolve a completed dungeon run into rewards.
 * Combat rating and stats reduce fail chance.
 */
export function resolveDungeonRun(
  run: ActiveDungeonRun,
  playerLevel: number,
  combatRating: number,
): DungeonRunResult {
  const tierDef = getDungeonTierDef(run.tier);
  
  // Fail chance reduced by combat rating and level advantage
  const levelBonus = Math.max(0, (playerLevel - tierDef.minLevel) * 0.02); // 2% per level above min
  const ratingBonus = Math.min(0.15, combatRating * 0.01); // max 15% from combat rating
  const failChance = Math.max(0.02, tierDef.failChanceBase - levelBonus - ratingBonus);
  
  const success = Math.random() > failChance;

  if (!success) {
    // Failed run: partial rewards (30%)
    const money = Math.floor((tierDef.moneyRange[0] + Math.random() * (tierDef.moneyRange[1] - tierDef.moneyRange[0])) * 0.3);
    const xp = Math.floor((tierDef.xpRange[0] + Math.random() * (tierDef.xpRange[1] - tierDef.xpRange[0])) * 0.3);
    return {
      dungeonId: run.dungeonId,
      tier: run.tier,
      success: false,
      money,
      xp,
      scrap: 0,
      lootBoxRewards: [],
      bonusText: 'Je bent betrapt en moest vluchten!',
    };
  }

  // Success: full rewards
  const money = Math.floor(tierDef.moneyRange[0] + Math.random() * (tierDef.moneyRange[1] - tierDef.moneyRange[0]));
  const xp = Math.floor(tierDef.xpRange[0] + Math.random() * (tierDef.xpRange[1] - tierDef.xpRange[0]));
  const scrap = Math.floor(tierDef.scrapRange[0] + Math.random() * (tierDef.scrapRange[1] - tierDef.scrapRange[0]));

  // Roll loot boxes
  const lootBoxRewards: LootBoxTier[] = [];
  const boxOrder: LootBoxTier[] = ['nox', 'kingpin', 'underground', 'street'];
  for (const boxTier of boxOrder) {
    const chance = tierDef.lootBoxChances[boxTier];
    if (chance && Math.random() < chance) {
      lootBoxRewards.push(boxTier);
    }
  }

  // Bonus text for special rolls
  let bonusText: string | null = null;
  if (lootBoxRewards.includes('nox')) bonusText = '💀 NOX KIST gevonden!';
  else if (lootBoxRewards.includes('kingpin')) bonusText = '👑 Kingpin Kist buitgemaakt!';
  else if (lootBoxRewards.length >= 2) bonusText = '🎁 Dubbele buit!';

  return {
    dungeonId: run.dungeonId,
    tier: run.tier,
    success: true,
    money,
    xp,
    scrap,
    lootBoxRewards,
    bonusText,
  };
}

/** Stat labels for UI */
export const TIER_LABELS: Record<DungeonTier, string> = {
  1: '⭐',
  2: '⭐⭐',
  3: '⭐⭐⭐',
  4: '⭐⭐⭐⭐',
  5: '⭐⭐⭐⭐⭐',
};
