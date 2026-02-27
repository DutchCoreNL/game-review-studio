/**
 * Weekly Recurring Events System
 * Every 7 days a special event triggers with unique rewards and time-limited challenges.
 */

import type { GameState, GoodId, FamilyId, DistrictId } from './types';
import { addPhoneMessage } from './newFeatures';

export interface WeekEvent {
  id: string;
  name: string;
  icon: string;
  desc: string;
  duration: number; // days the event lasts
  effects: WeekEventEffect[];
}

export interface WeekEventEffect {
  type: 'money_bonus' | 'trade_bonus' | 'heat_reduction' | 'rep_bonus' | 'xp_bonus' | 'casino_bonus' | 'combat_bonus' | 'crew_heal' | 'heat_surge' | 'price_crash' | 'price_surge' | 'faction_gift' | 'heat_freeze';
  value: number;
  desc: string;
}

export interface ActiveWeekEvent {
  eventId: string;
  name: string;
  icon: string;
  desc: string;
  startDay: number;
  daysLeft: number;
  effects: WeekEventEffect[];
  claimed: boolean; // one-time reward claimed
}

const WEEK_EVENTS: WeekEvent[] = [
  {
    id: 'fight_night',
    name: 'Noxhaven Fight Night',
    icon: '🥊',
    desc: 'Ondergrondse gevechten in Iron Borough. Dubbele combat beloningen deze week!',
    duration: 3,
    effects: [
      { type: 'combat_bonus', value: 2, desc: '2x combat beloningen (XP, rep, cash)' },
      { type: 'money_bonus', value: 5000, desc: '€5.000 fight purse' },
    ],
  },
  {
    id: 'black_market_festival',
    name: 'Zwarte Markt Festival',
    icon: '🏴',
    desc: 'De zwarte markt van Noxhaven bruist! Dubbele handelswinst op alle goederen.',
    duration: 3,
    effects: [
      { type: 'trade_bonus', value: 100, desc: '2x handelswinst' },
      { type: 'price_crash', value: 20, desc: 'Inkoopprijzen -20%' },
      { type: 'money_bonus', value: 3000, desc: '€3.000 welkomstbonus' },
    ],
  },
  {
    id: 'police_crackdown',
    name: 'Politie Razzia Week',
    icon: '🚔',
    desc: 'De NHPD voert grootschalige razzia\'s uit. Heat stijgt sneller, maar beloningen zijn hoger.',
    duration: 3,
    effects: [
      { type: 'heat_surge', value: 5, desc: '+5 extra heat per actie' },
      { type: 'money_bonus', value: 8000, desc: '€8.000 risicopremie' },
      { type: 'rep_bonus', value: 30, desc: '+30 rep voor overleven' },
    ],
  },
  {
    id: 'casino_night',
    name: 'Velvet Room Gala',
    icon: '🎰',
    desc: 'Het casino draait overuren! Verhoogde jackpot en speciale bonussen.',
    duration: 2,
    effects: [
      { type: 'casino_bonus', value: 50, desc: '+50% casino winsten' },
      { type: 'money_bonus', value: 3000, desc: '€3.000 welkomstbonus' },
    ],
  },
  {
    id: 'turf_war',
    name: 'Territoriumoorlog',
    icon: '⚔️',
    desc: 'Facties vechten om controle. District verdedigingen worden getest, maar buit is groot.',
    duration: 3,
    effects: [
      { type: 'combat_bonus', value: 1.5, desc: '+50% combat beloningen' },
      { type: 'rep_bonus', value: 50, desc: '+50 rep' },
      { type: 'money_bonus', value: 6000, desc: '€6.000 oorlogsbuit' },
    ],
  },
  {
    id: 'neon_festival',
    name: 'Neon Nights Festival',
    icon: '🌃',
    desc: 'Drie dagen van feest en debauchery in Neon Strip. Crew morale stijgt.',
    duration: 3,
    effects: [
      { type: 'crew_heal', value: 30, desc: 'Crew +30 HP' },
      { type: 'heat_reduction', value: 10, desc: '-10 heat' },
      { type: 'rep_bonus', value: 20, desc: '+20 rep' },
    ],
  },
  {
    id: 'smuggler_run',
    name: 'Smokkelaar\'s Race',
    icon: '🚗',
    desc: 'Illegale race door de stad. Winnaar krijgt cash en street cred.',
    duration: 2,
    effects: [
      { type: 'money_bonus', value: 7000, desc: '€7.000 prijzenpot' },
      { type: 'xp_bonus', value: 75, desc: '+75 XP' },
      { type: 'rep_bonus', value: 25, desc: '+25 rep' },
    ],
  },
  {
    id: 'arms_deal',
    name: 'Internationale Wapenbeurs',
    icon: '🔫',
    desc: 'Wapendealers uit het buitenland zijn in de stad. Gear is goedkoper.',
    duration: 2,
    effects: [
      { type: 'price_crash', value: 25, desc: '-25% wapenprijzen' },
      { type: 'money_bonus', value: 4000, desc: '€4.000 handelsdeal' },
    ],
  },
  {
    id: 'heat_freeze',
    name: 'Stroom Blackout',
    icon: '❄️',
    desc: 'Een massale stroomstoring legt alle politiesystemen plat. Geen heat gain gedurende het event!',
    duration: 3,
    effects: [
      { type: 'heat_freeze', value: 1, desc: 'Geen heat gain' },
      { type: 'heat_reduction', value: 15, desc: '-15 heat bij start' },
      { type: 'money_bonus', value: 2000, desc: '€2.000 plunderbuit' },
    ],
  },
  {
    id: 'xp_weekend',
    name: '2x XP Weekend',
    icon: '⭐',
    desc: 'De onderwereld gonst van energie. Alle XP gains zijn verdubbeld!',
    duration: 2,
    effects: [
      { type: 'xp_bonus', value: 100, desc: '2x XP op alles' },
      { type: 'rep_bonus', value: 15, desc: '+15 rep' },
    ],
  },
  {
    id: 'harbor_rush',
    name: 'Haven Drukte',
    icon: '🚢',
    desc: 'Smokkelschepen overspoelen de haven. Goederenprijzen kelderen en voorraden stijgen.',
    duration: 3,
    effects: [
      { type: 'price_crash', value: 30, desc: '-30% inkoopprijzen' },
      { type: 'trade_bonus', value: 40, desc: '+40% handelswinst' },
    ],
  },
];

/** Check if a week event should trigger (called during end_turn) */
export function checkWeekEvent(state: GameState): ActiveWeekEvent | null {
  // Only trigger on multiples of 7
  if (state.day < 7 || state.day % 7 !== 0) return null;
  // Don't overlap with existing event
  if ((state as any).activeWeekEvent?.daysLeft > 0) return null;

  const seen = (state as any).seenWeekEvents || [];
  // Prefer unseen events, but allow repeats if all seen
  let pool = WEEK_EVENTS.filter(e => !seen.includes(e.id));
  if (pool.length === 0) pool = [...WEEK_EVENTS];

  const event = pool[Math.floor(Math.random() * pool.length)];

  return {
    eventId: event.id,
    name: event.name,
    icon: event.icon,
    desc: event.desc,
    startDay: state.day,
    daysLeft: event.duration,
    effects: event.effects,
    claimed: false,
  };
}

/** Apply week event effects during end-of-turn */
export function processWeekEvent(state: GameState): void {
  const event = (state as any).activeWeekEvent as ActiveWeekEvent | null;
  if (!event || event.daysLeft <= 0) return;

  // One-time rewards (first day only)
  if (!event.claimed) {
    event.claimed = true;
    for (const effect of event.effects) {
      switch (effect.type) {
        case 'money_bonus':
          state.money += effect.value;
          state.stats.totalEarned += effect.value;
          break;
        case 'rep_bonus':
          state.rep += effect.value;
          break;
        case 'xp_bonus':
          // Handled by import in engine
          break;
        case 'crew_heal':
          state.crew.forEach(c => { if (c.hp > 0) c.hp = Math.min(100, c.hp + effect.value); });
          break;
        case 'heat_reduction':
          state.personalHeat = Math.max(0, (state.personalHeat || 0) - effect.value);
          break;
      }
    }

    addPhoneMessage(state, '📢 Event', `${event.icon} ${event.name}: ${event.desc}`, 'opportunity');

    // Track seen events
    if (!(state as any).seenWeekEvents) (state as any).seenWeekEvents = [];
    if (!(state as any).seenWeekEvents.includes(event.eventId)) {
      (state as any).seenWeekEvents.push(event.eventId);
    }
  }

  // Daily countdown
  event.daysLeft--;

  // Event expired
  if (event.daysLeft <= 0) {
    addPhoneMessage(state, '📢 Event', `${event.icon} ${event.name} is afgelopen.`, 'info');
  }
}

/** Get active trade bonus from week event (percentage) */
export function getWeekEventTradeBonus(state: GameState): number {
  const event = (state as any).activeWeekEvent as ActiveWeekEvent | null;
  if (!event || event.daysLeft <= 0) return 0;
  const tradeEffect = event.effects.find(e => e.type === 'trade_bonus');
  return tradeEffect ? tradeEffect.value / 100 : 0;
}

/** Get active casino bonus from week event (percentage) */
export function getWeekEventCasinoBonus(state: GameState): number {
  const event = (state as any).activeWeekEvent as ActiveWeekEvent | null;
  if (!event || event.daysLeft <= 0) return 0;
  const casinoEffect = event.effects.find(e => e.type === 'casino_bonus');
  return casinoEffect ? casinoEffect.value / 100 : 0;
}

/** Check if heat surge is active */
export function isHeatSurgeActive(state: GameState): boolean {
  const event = (state as any).activeWeekEvent as ActiveWeekEvent | null;
  if (!event || event.daysLeft <= 0) return false;
  return event.effects.some(e => e.type === 'heat_surge');
}

/** Check if heat freeze is active (no heat gain) */
export function isHeatFreezeActive(state: GameState): boolean {
  const event = (state as any).activeWeekEvent as ActiveWeekEvent | null;
  if (!event || event.daysLeft <= 0) return false;
  return event.effects.some(e => e.type === 'heat_freeze');
}

/** Get active XP multiplier from week event */
export function getWeekEventXpMultiplier(state: GameState): number {
  const event = (state as any).activeWeekEvent as ActiveWeekEvent | null;
  if (!event || event.daysLeft <= 0) return 1;
  const xpEffect = event.effects.find(e => e.type === 'xp_bonus');
  return xpEffect ? 1 + xpEffect.value / 100 : 1;
}

/** Get active combat multiplier from week event */
export function getWeekEventCombatMultiplier(state: GameState): number {
  const event = (state as any).activeWeekEvent as ActiveWeekEvent | null;
  if (!event || event.daysLeft <= 0) return 1;
  const combatEffect = event.effects.find(e => e.type === 'combat_bonus');
  return combatEffect ? combatEffect.value : 1;
}
