import type { GameState, PvPPlayerInfo } from '../types';
import { DISTRICTS, GEAR, VEHICLES } from '../constants';
import type { WorldBot, WorldSimState } from './types';

const DISTRICT_NAME = (id: string) => DISTRICTS[id]?.name || id;

/** Public profile shape consumed by PlayerDetailPopup — built from a rich WorldBot. */
export interface BotPublicProfile {
  username: string;
  memberSince: string | null;
  level: number;
  xp: number;
  rep: number;
  karma: number;
  hp: number;
  maxHp: number;
  loc: string;
  locName: string;
  backstory: string | null;
  endgamePhase: string;
  day: number;
  wealth: number;
  stats: Record<string, number>;
  hospitalizations: number;
  totalEarned: number;
  tradesCompleted: number;
  missionsCompleted: number;
  casinoWon: number;
  casinoLost: number;
  gear: { id: string; name: string; type: string }[];
  vehicles: { id: string; name: string; active: boolean; condition: number }[];
  districts: { id: string; name: string; rep: number }[];
  businesses: { id: string; name: string }[];
  crew: { name: string; role: string; level: number; spec: string | null }[];
  // Extra fields for the richer bot presentation.
  bio: string;
  personality: string;
  combatRating: number;
  wins: number;
  losses: number;
  killStreak: number;
  gangName: string | null;
  gangRole: string | null;
  online: boolean;
  rivalry: number;
}

function phaseForLevel(level: number): string {
  if (level >= 40) return 'onderwerelds_koning';
  if (level >= 25) return 'kingpin';
  if (level >= 12) return 'baas';
  if (level >= 5) return 'dealer';
  return 'straatdealer';
}

/** Builds a full, believable public profile for a bot (as if it were a real player). */
export function buildBotProfile(world: WorldSimState | undefined, botId: string, gameDay: number): BotPublicProfile | null {
  const bot = world?.bots.find(b => b.id === botId);
  if (!bot) return null;
  const gang = bot.gangId ? world?.gangs.find(g => g.id === bot.gangId) : null;

  const gearItems = (bot.gear || []).map(id => {
    const g = GEAR.find(x => x.id === id);
    return g ? { id: g.id, name: g.name, type: g.type } : null;
  }).filter(Boolean) as { id: string; name: string; type: string }[];

  const veh = VEHICLES.find(v => v.id === bot.vehicleId);

  // "Member since" as a relative day count (bots joined before the player started).
  const daysAgo = Math.max(1, gameDay - (bot.joinDay ?? 0));
  const memberSince = `${daysAgo} dagen geleden`;

  return {
    username: bot.name,
    memberSince,
    level: bot.level,
    xp: bot.xp,
    rep: bot.rep,
    karma: bot.karma ?? 0,
    hp: bot.hp ?? bot.maxHp ?? 100,
    maxHp: bot.maxHp ?? 100,
    loc: bot.loc,
    locName: DISTRICT_NAME(bot.loc),
    backstory: bot.backstory ?? null,
    endgamePhase: phaseForLevel(bot.level),
    day: gameDay,
    wealth: bot.money,
    stats: bot.stats ?? { muscle: 1, brains: 1, charm: 1 },
    hospitalizations: bot.losses ?? 0,
    totalEarned: Math.floor(bot.money * 2.5),
    tradesCompleted: Math.floor(bot.level * 8),
    missionsCompleted: Math.floor(bot.level * 3),
    casinoWon: bot.archetype === 'gambler' ? bot.level * 500 : 0,
    casinoLost: bot.archetype === 'gambler' ? bot.level * 400 : 0,
    gear: gearItems,
    vehicles: veh ? [{ id: veh.id, name: veh.name, active: true, condition: 100 }] : [],
    districts: gang?.controlledDistrict ? [{ id: gang.controlledDistrict, name: DISTRICT_NAME(gang.controlledDistrict), rep: 80 }] : [],
    businesses: [],
    crew: [],
    bio: bot.bio ?? '',
    personality: bot.personality ?? '',
    combatRating: bot.combatRating ?? 1000,
    wins: bot.wins ?? 0,
    losses: bot.losses ?? 0,
    killStreak: bot.killStreak ?? 0,
    gangName: gang ? `[${gang.tag}] ${gang.name}` : null,
    gangRole: bot.gangRole ?? null,
    online: bot.online,
    rivalry: bot.rivalry ?? 0,
  };
}

/** Selects believable PvP opponents in/near the player's district (online bots preferred). */
export function selectDuelOpponents(world: WorldSimState | undefined, playerLoc: string, playerLevel: number, limit = 8): WorldBot[] {
  if (!world) return [];
  const sameDistrict = world.bots.filter(b => b.loc === playerLoc);
  const pool = sameDistrict.length >= 3 ? sameDistrict : world.bots;
  // Prefer online bots within a sensible level band, sorted by how close in level they are.
  return [...pool]
    .filter(b => Math.abs(b.level - playerLevel) <= 15)
    .sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      return Math.abs(a.level - playerLevel) - Math.abs(b.level - playerLevel);
    })
    .slice(0, limit);
}

/** Bots with a bounty on the player, plus high-rep/high-rivalry "most wanted" style rivals. */
export function selectRivals(world: WorldSimState | undefined, limit = 10): WorldBot[] {
  if (!world) return [];
  return [...world.bots]
    .filter(b => (b.rivalry ?? 0) > 0 || (b.bountyOnPlayer ?? 0) > 0)
    .sort((a, b) => (b.rivalry + b.bountyOnPlayer / 1000) - (a.rivalry + a.bountyOnPlayer / 1000))
    .slice(0, limit);
}

/** The world's "most wanted" — highest combat rating / rep bots, as public targets. */
export function selectMostWanted(world: WorldSimState | undefined, limit = 12): WorldBot[] {
  if (!world) return [];
  return [...world.bots]
    .sort((a, b) => (b.combatRating + b.rep) - (a.combatRating + a.rep))
    .slice(0, limit);
}

/** Loadout derived from a bot's gear ids, keyed by slot. */
function loadoutFromGear(bot: WorldBot): Record<string, string | null> {
  const loadout: Record<string, string | null> = { weapon: null, armor: null, gadget: null };
  for (const id of bot.gear || []) {
    const g = GEAR.find(x => x.id === id);
    if (g && (g.type === 'weapon' || g.type === 'armor' || g.type === 'gadget')) {
      loadout[g.type] = g.id;
    }
  }
  return loadout;
}

/** Converts a bot into the PvPPlayerInfo shape the arena / combat reducer expects. */
export function botToPvPInfo(bot: WorldBot): PvPPlayerInfo {
  return {
    userId: bot.id,
    username: bot.name,
    level: bot.level,
    hp: bot.hp ?? bot.maxHp ?? 100,
    maxHp: bot.maxHp ?? 100,
    stats: bot.stats ?? { muscle: 1, brains: 1, charm: 1 },
    loadout: loadoutFromGear(bot),
    backstory: bot.backstory ?? undefined,
    rep: bot.rep,
    isBot: true,
    combatRating: bot.combatRating ?? 1000,
  };
}

export interface CombatTarget {
  userId: string;
  username: string;
  level: number;
  hp: number;
  maxHp: number;
  stats: { muscle: number; brains: number; charm: number };
  loadout: Record<string, string | null>;
}

/** Converts a bot into a START_PVP_COMBAT target, deriving a loadout from its gear. */
export function botToCombatTarget(bot: WorldBot): CombatTarget {
  const loadout = loadoutFromGear(bot);
  return {
    userId: bot.id,
    username: bot.name,
    level: bot.level,
    hp: bot.maxHp ?? 100, // bots enter a duel at full health
    maxHp: bot.maxHp ?? 100,
    stats: bot.stats ?? { muscle: 1, brains: 1, charm: 1 },
    loadout,
  };
}
