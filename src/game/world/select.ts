import type { DistrictId } from '../types';
import type { WorldSimState, WorldBot, WorldFeedItem, WorldListing } from './types';

export interface OnlinePlayerRow {
  user_id: string;
  username: string;
  district_id: string;
  level: number;
  last_seen_at: string;
}

/** Derives the "online players" list from the local world (bots flagged online). */
export function selectOnlinePlayers(world: WorldSimState | undefined, districtFilter?: string): OnlinePlayerRow[] {
  if (!world) return [];
  const now = new Date().toISOString();
  return world.bots
    .filter(b => b.online && (!districtFilter || b.loc === districtFilter))
    .slice(0, 40)
    .map(b => ({
      user_id: b.id,
      username: b.name,
      district_id: b.loc,
      level: b.level,
      last_seen_at: now,
    }));
}

export function selectOnlineCountByDistrict(world: WorldSimState | undefined): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!world) return counts;
  for (const b of world.bots) {
    if (b.online) counts[b.loc] = (counts[b.loc] || 0) + 1;
  }
  return counts;
}

export interface ActivityRow {
  id: string;
  user_id: string;
  username: string;
  action_type: string;
  description: string;
  icon: string;
  district_id: string | null;
  target_name: string | null;
  data: Record<string, unknown>;
  created_at: string;
}

/** Maps the world feed into the shape the activity-feed UI expects. */
export function selectActivityFeed(world: WorldSimState | undefined, districtFilter?: string): ActivityRow[] {
  if (!world) return [];
  return world.feed
    .filter(f => !districtFilter || f.district === districtFilter)
    .slice(0, 30)
    .map((f: WorldFeedItem) => ({
      id: f.id,
      user_id: f.botId || 'world',
      username: f.botName,
      action_type: 'world',
      description: f.text,
      icon: f.icon,
      district_id: f.district,
      target_name: null,
      data: {},
      created_at: new Date(f.createdAt).toISOString(),
    }));
}

export interface LeaderboardRow {
  user_id: string;
  username: string;
  level: number;
  cash: number;
  rep: number;
  isPlayer: boolean;
}

/** Ranks the local bots plus the player into a single leaderboard. */
export function selectLeaderboard(
  world: WorldSimState | undefined,
  player: { username: string; level: number; cash: number; rep: number },
  sortBy: 'rep' | 'cash' | 'level' = 'rep',
): LeaderboardRow[] {
  const rows: LeaderboardRow[] = (world?.bots || []).map(b => ({
    user_id: b.id, username: b.name, level: b.level, cash: b.money, rep: b.rep, isPlayer: false,
  }));
  rows.push({ user_id: 'player', username: player.username, level: player.level, cash: player.cash, rep: player.rep, isPlayer: true });
  rows.sort((a, b) => b[sortBy] - a[sortBy]);
  return rows;
}

/** Marketplace listings the player can browse/buy, optionally filtered by district. */
export function selectListings(world: WorldSimState | undefined, districtFilter?: DistrictId): WorldListing[] {
  if (!world) return [];
  return world.listings.filter(l => !districtFilter || l.district === districtFilter);
}

export function findBot(world: WorldSimState | undefined, botId: string): WorldBot | undefined {
  return world?.bots.find(b => b.id === botId);
}
