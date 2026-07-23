import {
  Map, Dices, Heart, Home, Building2, Wrench,
  Crosshair, FileText, Target, Skull, Swords, Award, Calendar,
  ShoppingBag, BarChart3, Gavel, TrendingUp, Droplets, ShieldCheck,
  Users, Handshake, Crown as CrownIcon,
  Car, Store, MapPin, Hammer,
  Star, Shield, Trophy, Settings, Sword, Smartphone,
  ShieldAlert, LucideIcon, BookOpen, Sparkles, GraduationCap, Plane, MessageCircle, Waypoints,
  Package, Flame,
} from 'lucide-react';
import type { GameView, GameState } from '@/game/types';
import type { Translations } from '@/i18n/types';

/**
 * SINGLE SOURCE OF TRUTH for in-game navigation.
 *
 * The bottom nav (GameNav), the mobile drawer (GameSidebar) and the desktop rail
 * (DesktopSidebar) all derive their structure from this file so the menu can never
 * drift between surfaces again. The game is single-player, so dead/broken
 * "multiplayer" destinations (the P2P gang panel, the player-to-player inbox,
 * orphaned stat panels) are intentionally absent here — they are simply not part
 * of the menu, which keeps every reachable screen a working one.
 */

export type NavGroupId = 'city' | 'ops' | 'market' | 'garage' | 'profile';

interface NavItemDef {
  id: GameView;
  icon: LucideIcon;
  /** Resolves the localized label from the translation dictionary. */
  label: (t: Translations) => string;
  /** Optional live badge count/flag derived from game state. */
  badge?: (s: GameState) => number | boolean;
}

interface NavGroupDef {
  id: NavGroupId;
  emoji: string;
  label: (t: Translations) => string;
  /** The view the bottom-nav tab for this group opens. */
  primary: GameView;
  items: NavItemDef[];
}

/**
 * The 5 single-player sections. The old "Crew & Oorlog" group has been folded into
 * Imperium, matching the 5 bottom-nav tabs and the 5 music scenes.
 */
const GROUPS: NavGroupDef[] = [
  {
    id: 'city', emoji: '🗺', label: t => t.sidebar.city, primary: 'city',
    items: [
      { id: 'city', icon: Map, label: t => t.sidebar.map },
      { id: 'travel', icon: Plane, label: t => t.sidebar.travel },
      { id: 'chat', icon: MessageCircle, label: t => t.sidebar.chat },
      { id: 'casino', icon: Dices, label: t => t.sidebar.casino },
      { id: 'hospital', icon: Heart, label: t => t.sidebar.hospital },
      { id: 'safehouse', icon: Home, label: t => t.sidebar.safehouse },
      { id: 'villa', icon: Building2, label: t => t.sidebar.villa },
      { id: 'chopshop', icon: Wrench, label: t => t.sidebar.chopShop },
    ],
  },
  {
    id: 'ops', emoji: '⚔', label: t => t.sidebar.actions, primary: 'ops',
    items: [
      { id: 'campaign', icon: BookOpen, label: t => t.sidebar.campaign },
      { id: 'ops', icon: Crosshair, label: t => t.sidebar.operations, badge: s => (s.activeContracts?.length || 0) + (s.hitContracts?.length || 0) },
      { id: 'contracts', icon: FileText, label: t => t.sidebar.contracts },
      { id: 'heists', icon: Target, label: t => t.sidebar.heists },
      { id: 'raids', icon: Flame, label: t => t.sidebar.raids, badge: s => (s.activeDungeon ? 1 : 0) },
      { id: 'bounties', icon: Skull, label: t => t.sidebar.bounties },
      { id: 'pvp', icon: Swords, label: t => t.sidebar.pvp },
      { id: 'wanted', icon: ShieldAlert, label: t => t.sidebar.mostWanted },
      { id: 'challenges', icon: Calendar, label: t => t.sidebar.daily },
      { id: 'hits', icon: Award, label: t => t.sidebar.hits },
      { id: 'crew', icon: Users, label: t => t.sidebar.crew, badge: s => (s.crew?.filter(c => c.hp < 100).length || 0) },
    ],
  },
  {
    id: 'market', emoji: '💰', label: t => t.sidebar.trade, primary: 'market',
    items: [
      { id: 'market', icon: ShoppingBag, label: t => t.sidebar.market },
      { id: 'analysis', icon: BarChart3, label: t => t.sidebar.analysis },
      { id: 'auction', icon: Gavel, label: t => t.sidebar.auction, badge: s => (s.auctionItems?.length || 0) },
      { id: 'stocks', icon: TrendingUp, label: t => t.sidebar.stocks, badge: s => !!s.pendingInsiderTip },
      { id: 'launder', icon: Droplets, label: t => t.sidebar.launder },
      { id: 'gear', icon: ShieldCheck, label: t => t.sidebar.gear },
      { id: 'black-market', icon: Skull, label: t => t.sidebar.blackMarket },
      { id: 'salvage', icon: Hammer, label: t => t.sidebar.salvage },
      { id: 'loot-boxes', icon: Package, label: t => t.sidebar.lootBoxes },
    ],
  },
  {
    id: 'garage', emoji: '🏛', label: t => t.sidebar.imperium, primary: 'garage',
    items: [
      { id: 'business', icon: Store, label: t => t.sidebar.business },
      { id: 'garage', icon: Car, label: t => t.sidebar.garage, badge: s => (s.carOrders?.filter(o => s.day >= o.deadline).length || 0) },
      { id: 'districts', icon: MapPin, label: t => t.sidebar.districts },
      { id: 'properties', icon: Home, label: t => t.sidebar.properties },
      { id: 'families', icon: Users, label: t => t.sidebar.factions },
      { id: 'organized-crimes', icon: Waypoints, label: t => t.sidebar.organizedCrime },
      { id: 'war', icon: Swords, label: t => t.sidebar.war },
      { id: 'corruption', icon: Handshake, label: t => t.sidebar.corruption },
    ],
  },
  {
    id: 'profile', emoji: '👤', label: t => t.sidebar.profile, primary: 'profile',
    items: [
      { id: 'profile', icon: BarChart3, label: t => t.sidebar.statsSkills },
      { id: 'merit', icon: Sparkles, label: t => t.sidebar.meritPoints, badge: s => (s.meritPoints || 0) },
      { id: 'gym', icon: Award, label: t => t.sidebar.gym },
      { id: 'jobs', icon: Star, label: t => t.sidebar.jobs },
      { id: 'education', icon: GraduationCap, label: t => t.sidebar.education },
      { id: 'loadout', icon: Shield, label: t => t.sidebar.loadout },
      { id: 'weapons', icon: Sword, label: t => t.sidebar.weaponArsenal, badge: s => (s.weaponInventory?.length || 0) },
      { id: 'armor-arsenal', icon: Shield, label: t => t.sidebar.armorArsenal, badge: s => (s.armorInventory?.length || 0) },
      { id: 'gadget-arsenal', icon: Smartphone, label: t => t.sidebar.gadgetArsenal, badge: s => (s.gadgetInventory?.length || 0) },
      { id: 'contacts', icon: Users, label: t => t.sidebar.npcRelations },
      { id: 'reputation', icon: Star, label: t => t.sidebar.reputation },
      { id: 'leaderboard', icon: CrownIcon, label: t => t.sidebar.leaderboard },
      { id: 'arcs', icon: Target, label: t => t.sidebar.storyArcs },
      { id: 'codex', icon: BookOpen, label: t => t.sidebar.codex },
      { id: 'trophies', icon: Trophy, label: t => t.sidebar.trophies },
      { id: 'settings', icon: Settings, label: t => t.sidebar.settings },
    ],
  },
];

export interface ResolvedNavItem {
  id: GameView;
  label: string;
  icon: LucideIcon;
  badge: number | boolean;
}

export interface ResolvedNavGroup {
  id: NavGroupId;
  emoji: string;
  label: string;
  primary: GameView;
  items: ResolvedNavItem[];
}

/** Builds the fully-resolved nav groups for the current language + game state. */
export function buildNavGroups(t: Translations, state: GameState, isAdmin: boolean): ResolvedNavGroup[] {
  const groups: ResolvedNavGroup[] = GROUPS.map(g => ({
    id: g.id,
    emoji: g.emoji,
    label: g.label(t),
    primary: g.primary,
    items: g.items.map(it => ({
      id: it.id,
      label: it.label(t),
      icon: it.icon,
      badge: it.badge ? it.badge(state) : 0,
    })),
  }));

  if (isAdmin) {
    groups.push({
      id: 'profile',
      emoji: '🛡',
      label: t.sidebar.admin,
      primary: 'admin',
      items: [{ id: 'admin', label: t.sidebar.adminPanel, icon: ShieldAlert, badge: 0 }],
    });
  }

  return groups;
}

/** Static map of bottom-nav group id -> the view ids that belong to it (for highlight). */
export const GROUP_VIEW_IDS: Record<NavGroupId, GameView[]> = GROUPS.reduce((acc, g) => {
  acc[g.id] = g.items.map(i => i.id);
  return acc;
}, {} as Record<NavGroupId, GameView[]>);

/** Ordered bottom-nav group ids. */
export const NAV_GROUP_ORDER: NavGroupId[] = GROUPS.map(g => g.id);
