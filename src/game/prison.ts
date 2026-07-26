/**
 * INGEREKEND — the top rung of the heat ladder.
 *
 * Getting picked up used to be a wall: a modal covering the whole game for up to
 * seven game days, confiscating your cash and your stash, counting down in *real
 * days* (so it advertised "119u 48m" for a sentence that actually lasts a couple of
 * hours), and offering ways out that hung off retired systems — a villa tunnel, a
 * "Hacker" crew role, and a multiplayer jail-bust panel that could only ever say
 * "no prisoners found".
 *
 * In an idle game a lockout is the worst possible punishment: it stops the one thing
 * the genre is built on. So being inside is no longer a wall. Your *hands* are out
 * of action — you cannot work a klus or trade on the street — but the empire keeps
 * running: your crew works their rackets, the fence keeps moving goods, and the days
 * keep ticking. You choose how it ends:
 *
 *   - sit it out   → slow, but you walk out with the heat wiped clean
 *   - buy out      → instant, costs real money, and you stay exactly as hot as you were
 *   - break out    → one attempt, fast and free if it lands, +heat and a longer stay if not
 *
 * That is the whole point of the mechanic: heat you ignored takes your hands away for
 * an hour and hands you a bill.
 */

import type { GameState } from './types';

// ---------- Sentence ----------

/**
 * Sentence in game days, by the heat that got you caught. A game day is
 * `tickIntervalMinutes` (30) of real time, so this tops out around an hour and a
 * half — long enough to hurt, short enough that checking back in still finds a game.
 */
export const SENTENCE_TABLE: { maxHeat: number; days: number }[] = [
  { maxHeat: 55, days: 1 },
  { maxHeat: 80, days: 2 },
  { maxHeat: 100, days: 3 },
];

export function sentenceForHeat(heat: number): number {
  for (const row of SENTENCE_TABLE) if (heat <= row.maxHeat) return row.days;
  return SENTENCE_TABLE[SENTENCE_TABLE.length - 1].days;
}

/** Fraction of clean money seized on arrest. */
export const MONEY_CONFISCATION = 0.2;
/** Fraction of dirty money seized on arrest — it is the least defensible thing you own. */
export const DIRTY_CONFISCATION = 0.5;
/** Fraction of contraband in the stash seized: what you had on you, not what is buried. */
export const GOODS_CONFISCATION = 0.5;

// ---------- Buying your way out ----------

export const BRIBE_COST_PER_DAY = 8000;

export function bribeCost(state: GameState): number {
  const days = state.prison?.daysRemaining || 0;
  return days * BRIBE_COST_PER_DAY;
}

// ---------- Breaking out ----------

export const ESCAPE_BASE_CHANCE = 0.18;
export const ESCAPE_HEAT_PENALTY = 15;
export const ESCAPE_FAIL_EXTRA_DAYS = 1;
/** Nothing gets you past 80% — there is always a guard who is not for sale. */
export const ESCAPE_MAX_CHANCE = 0.8;

export interface EscapeOdds {
  base: number;
  /** Working out the rota, the shift change, the blind spot. */
  brains: number;
  /** A 'spook' on the outside who can be where nobody is looking. */
  ghost: number;
  /** Good gear travels in with the laundry. */
  gear: number;
  total: number;
}

/**
 * The odds, itemised, so the button can show its own maths. Every line reads from a
 * system that is still in the game: your own Vernuft, the traits of the crew you
 * actually recruited, and the Gereedschap track you actually bought.
 */
export function escapeOdds(state: GameState): EscapeOdds {
  const base = ESCAPE_BASE_CHANCE;
  const brains = (state.player?.stats?.brains || 0) * 0.02;
  const hasGhost = (state.org?.members || []).some(m => m.trait === 'spook');
  const ghost = hasGhost ? 0.12 : 0;
  const gear = (state.equipment?.gereedschap || 0) * 0.03;
  const total = Math.min(ESCAPE_MAX_CHANCE, base + brains + ghost + gear);
  return { base, brains, ghost, gear, total };
}

export function escapeChance(state: GameState): number {
  return escapeOdds(state).total;
}

// ---------- Time left ----------

/**
 * Real minutes until release. The old overlay assumed one game day was one real day
 * and so quoted five-day sentences for something that runs on the 30-minute tick.
 */
export function minutesUntilRelease(state: GameState): number {
  const days = state.prison?.daysRemaining || 0;
  if (days <= 0) return 0;
  const perDay = state.tickIntervalMinutes || 30;
  const last = state.lastTickAt ? new Date(state.lastTickAt).getTime() : Date.now();
  const nextTickInMs = Math.max(0, last + perDay * 60000 - Date.now());
  return nextTickInMs / 60000 + (days - 1) * perDay;
}

// ---------- Days inside ----------

export interface PrisonDayEvent {
  id: string;
  title: string;
  desc: string;
  effect: 'brains_up' | 'muscle_up' | 'charm_up' | 'respect_up' | 'day_reduce' | 'money_cost' | 'loyalty_down';
  value: number;
}

/**
 * What a day inside does to you. Rewritten to touch only live systems — the old set
 * moved HP on the retired `state.crew` array and drained a loyalty field nothing read
 * any more, so serving a sentence was mechanically inert.
 */
export const PRISON_DAY_EVENTS: PrisonDayEvent[] = [
  { id: 'cellmate_intel', title: 'Celgenoot met verhalen', desc: 'Een oude rot legt uit hoe de dienstwissel werkt. Je onthoudt het.', effect: 'brains_up', value: 1 },
  { id: 'yard_fight', title: 'Gevecht op de binnenplaats', desc: 'Je moest jezelf verdedigen. Pijnlijk, maar je staat steviger.', effect: 'muscle_up', value: 1 },
  { id: 'guard_deal', title: 'Corrupte bewaker', desc: 'Een bewaker verkort je papieren — voor een envelop.', effect: 'day_reduce', value: 1 },
  { id: 'prison_respect', title: 'Je naam gaat rond', desc: 'Ze weten binnen wie je buiten bent. Dat is respect waard.', effect: 'respect_up', value: 8 },
  { id: 'smooth_talker', title: 'Gesprek met de advocaat', desc: 'Je praat je een beter regime in.', effect: 'charm_up', value: 1 },
  { id: 'canteen', title: 'Kantinerekening', desc: 'Binnen betaal je voor alles. Ook voor rust.', effect: 'money_cost', value: 600 },
  { id: 'crew_doubt', title: 'Twijfel in de crew', desc: 'Je bent er niet, en dat merken ze. Er wordt gemopperd.', effect: 'loyalty_down', value: 4 },
];

export function rollPrisonDayEvent(rand: () => number = Math.random): PrisonDayEvent | null {
  if (rand() >= 0.6) return null;
  return PRISON_DAY_EVENTS[Math.floor(rand() * PRISON_DAY_EVENTS.length)];
}
