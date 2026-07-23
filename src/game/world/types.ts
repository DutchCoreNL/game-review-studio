import type { DistrictId, FamilyId, GoodId } from '../types';

/** Behavioural archetype — biases which world actions a bot tends to take. */
export type BotArchetype = 'trader' | 'brawler' | 'gambler' | 'gangster' | 'hustler';

export interface WorldBot {
  id: string; // stable, e.g. "bot_0"
  name: string;
  archetype: BotArchetype;
  level: number;
  xp: number;
  money: number;
  rep: number;
  loc: DistrictId;
  gangId: string | null; // world gang id, not the player's gang
  online: boolean; // presence flag, recomputed each tick
  lastActionDay: number;
}

export interface WorldGang {
  id: string;
  name: string;
  tag: string;
  memberBotIds: string[];
  power: number; // aggregate strength, drives war outcomes
  controlledDistrict: DistrictId | null;
}

/** A single line in the shared activity/chat feed. */
export interface WorldFeedItem {
  id: string;
  botId: string | null; // null = world/system event
  botName: string;
  icon: string;
  text: string;
  district: DistrictId | null;
  day: number;
  createdAt: number; // ms epoch (simulated)
}

/** A bot-listed item on the marketplace the player can buy. */
export interface WorldListing {
  id: string;
  sellerBotId: string;
  sellerName: string;
  goodId: GoodId;
  quantity: number;
  pricePerUnit: number;
  district: DistrictId;
  expiresDay: number;
}

/** An ongoing bot-vs-bot gang war shown on the world map / feed. */
export interface WorldWar {
  id: string;
  attackerGangId: string;
  defenderGangId: string;
  district: DistrictId;
  attackerScore: number;
  defenderScore: number;
  startedDay: number;
  endsDay: number;
}

/** Everything the local MMO simulation owns. Lives inside GameState.world. */
export interface WorldSimState {
  seed: number;
  bots: WorldBot[];
  gangs: WorldGang[];
  feed: WorldFeedItem[]; // capped ring buffer, newest first
  listings: WorldListing[];
  wars: WorldWar[];
  factionControl: Record<FamilyId, string | null>; // faction -> gang id that dominates its turf
  lastSimAt: string; // ISO timestamp of the last processed tick
  version: number; // schema version for migrations
}

export const WORLD_SIM_VERSION = 1;
