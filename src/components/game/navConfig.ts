import {
  Hand, LayoutDashboard, Crown as CrownIcon, Wrench,
  ShoppingBag, Droplets, BarChart3,
  Map, Dices, Home,
  Trophy, BookOpen, Settings, ShieldAlert, LucideIcon,
} from 'lucide-react';
import type { GameView, GameState } from '@/game/types';
import type { Translations } from '@/i18n/types';

/**
 * SINGLE SOURCE OF TRUTH for in-game navigation.
 *
 * The bottom nav (GameNav), the mobile drawer (GameSidebar) and the desktop rail
 * (DesktopSidebar) all derive their structure from this file.
 *
 * Scope note: this game is a single-player mafia idle game built around one loop
 * — work a job by hand, let your crew run rackets in the districts, sell and
 * launder what you take, buy gear and crew, answer the incidents the city throws
 * back, and eventually hand the empire to a successor. The menu lists exactly the
 * screens that serve that loop or its setting. The old MMO/RPG destinations (PvP,
 * bounties, world bosses, shared markets, the skill tree, the arsenals, contracts,
 * factions, heists) are deliberately absent: they belong to a different game and
 * their presence was what made this one feel like a wall of buttons.
 *
 * Two more went the same way:
 *   - Ziekenhuis, because HP is not shown anywhere and nothing drains it any more —
 *     bounty-hunter encounters were the last thing that did, and those are an
 *     Incident now.
 *   - Villa, a whole second progression system (drug labs, weapon room, helipad,
 *     pool, escape tunnel, garage extension) whose modules hung off retired
 *     systems, and whose live parts — storage, a vault — Uitrusting already owns.
 */

export type NavGroupId = 'klus' | 'imperium' | 'handel' | 'uitrusting' | 'profile';

interface NavItemDef {
  id: GameView;
  icon: LucideIcon;
  label: (t: Translations) => string;
  /** One line telling the player what this screen is for. */
  hint?: string;
  badge?: (s: GameState) => number | boolean;
}

interface NavGroupDef {
  id: NavGroupId;
  emoji: string;
  label: (t: Translations) => string;
  /** The view this group's bottom-nav tab opens. */
  primary: GameView;
  items: NavItemDef[];
}

const GROUPS: NavGroupDef[] = [
  {
    id: 'klus', emoji: '✊', label: t => t.sidebar.score, primary: 'klus',
    items: [
      { id: 'klus', icon: Hand, label: t => t.sidebar.score, hint: 'Zelf klussen draaien voor buit' },
      { id: 'city', icon: Map, label: t => t.sidebar.map, hint: 'De stadskaart en het nieuws' },
      { id: 'casino', icon: Dices, label: t => t.sidebar.casino, hint: 'Gokken met je geld' },
      { id: 'safehouse', icon: Home, label: t => t.sidebar.safehouse, hint: 'Onderduiken als het heet wordt' },
    ],
  },
  {
    id: 'imperium', emoji: '🏙', label: t => t.sidebar.overview, primary: 'overzicht',
    items: [
      // Unassigned crew is the one thing you always want nudging you.
      { id: 'overzicht', icon: LayoutDashboard, label: t => t.sidebar.overview, hint: 'Districten, rackets en je crew aansturen', badge: s => (s.org?.members.filter(m => !m.assignment && !m.injuredUntilDay).length || 0) },
      { id: 'gang', icon: CrownIcon, label: t => t.sidebar.gang, hint: 'Crew ronselen, upgrades, diplomatie', badge: s => (s.org?.members.length || 0) },
      { id: 'opvolger', icon: CrownIcon, label: t => t.sidebar.successor, hint: 'Met pensioen voor permanente bonussen', badge: s => (s.legacy?.points || 0) },
    ],
  },
  {
    id: 'handel', emoji: '💰', label: t => t.sidebar.trade, primary: 'market',
    items: [
      { id: 'market', icon: ShoppingBag, label: t => t.sidebar.market, hint: 'Je buit verkopen' },
      { id: 'launder', icon: Droplets, label: t => t.sidebar.launder, hint: 'Zwart geld omzetten in bruikbaar geld', badge: s => (s.dirtyMoney || 0) > 0 },
      { id: 'analysis', icon: BarChart3, label: t => t.sidebar.analysis, hint: 'Waar is welke waar het duurst?' },
    ],
  },
  {
    id: 'uitrusting', emoji: '🧰', label: t => t.sidebar.equipment, primary: 'uitrusting',
    items: [
      { id: 'uitrusting', icon: Wrench, label: t => t.sidebar.equipment, hint: 'Sterkere tik, snellere crew, meer opslag' },
    ],
  },
  {
    id: 'profile', emoji: '👤', label: t => t.sidebar.profile, primary: 'profile',
    items: [
      { id: 'profile', icon: BarChart3, label: t => t.sidebar.statsSkills, hint: 'Je cijfers en voortgang' },
      { id: 'codex', icon: BookOpen, label: t => t.sidebar.codex, hint: 'Alles over Noxhaven' },
      { id: 'trophies', icon: Trophy, label: t => t.sidebar.trophies, hint: 'Behaalde mijlpalen' },
      { id: 'settings', icon: Settings, label: t => t.sidebar.settings, hint: 'Geluid en voorkeuren' },
    ],
  },
];

export interface ResolvedNavItem {
  id: GameView;
  label: string;
  icon: LucideIcon;
  hint?: string;
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
      hint: it.hint,
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
