import type { DistrictId, FamilyId, GoodId } from '../types';

/** Behavioural archetype — biases which world actions a bot tends to take. */
export type BotArchetype = 'trader' | 'brawler' | 'gambler' | 'gangster' | 'hustler';

/** Personality — flavours behaviour, chat tone and combat AI so bots read as distinct people. */
export type BotPersonality = 'agressief' | 'berekenend' | 'roekeloos' | 'sociaal' | 'meedogenloos';

export type BotGangRole = 'leider' | 'onderbaas' | 'soldaat';

export interface WorldBot {
  id: string; // stable, e.g. "bot_0"
  name: string;
  archetype: BotArchetype;
  personality: BotPersonality;
  bio: string; // short flavour line shown on the profile
  backstory: string; // backstory id (weduwnaar/bankier/straatkind)
  joinDay: number; // world day the bot "joined" (memberSince)
  level: number;
  xp: number;
  money: number;
  rep: number;
  karma: number;
  loc: DistrictId;
  gangId: string | null; // world gang id, not the player's gang
  gangRole: BotGangRole | null;
  online: boolean; // presence flag, recomputed each tick
  activity: number; // 0..1 — how active/"hardcore" this player is (drives presence + actions)
  lastActionDay: number;

  // Combat identity
  stats: { muscle: number; brains: number; charm: number };
  maxHp: number;
  hp: number;
  combatRating: number;
  wins: number;
  losses: number;
  killStreak: number;
  gear: string[]; // owned gear ids
  vehicleId: string; // active vehicle id

  // Relationship to the human player (makes the world feel personal)
  rivalry: number; // 0..100 — how much this bot has beef with the player
  bountyOnPlayer: number; // € this bot has placed on the player's head (0 = none)
  lastInteractedDay: number; // last day the player fought/traded with them (0 = never)
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
  auctions: WorldAuction[];
  factionControl: Record<FamilyId, string | null>; // faction -> gang id that dominates its turf
  lastSimAt: string; // ISO timestamp of the last processed tick
  version: number; // schema version for migrations
}

/** A live auction the player can bid on; bots also bid to feel like competing players. */
export interface WorldAuction {
  id: string;
  sellerBotId: string | null; // null = player-created
  sellerName: string;
  itemType: string; // 'gear' | 'vehicle' | 'weapon' | ...
  itemId: string;
  itemName: string;
  startingPrice: number;
  currentBid: number;
  topBidderId: string | null; // bot id or 'player'
  topBidderName: string | null;
  bidCount: number;
  endsDay: number;
  status: 'active' | 'sold' | 'expired';
}

export const WORLD_SIM_VERSION = 2;
