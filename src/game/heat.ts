import type { GameState } from './types';
import { resolveRacketTick } from './rackets';
import { equipHeatShield } from './equipment';
import { autoFenceActive, AUTO_FENCE_HEAT } from './tradeNetwork';

/**
 * HITTE — the pressure you play against.
 *
 * Three things were wrong with how this worked:
 *
 * 1. There was no base decay at all. Heat only ever came down through Netwerk gear,
 *    crew on a laundering racket, or bribing the police. A player with none of those
 *    watched it climb forever with no way back — a trap, not a tension.
 * 2. The consequences were two cliffs (a market surcharge at 50, a police incident
 *    at 65) with a dead zone below. Half the meter did nothing.
 * 3. You could not see the rate. The number moved between visits with no way to tell
 *    whether you were heading for a raid or cooling off, so it could not be managed.
 *
 * This module fixes all three: the streets forget a little every day, the pressure
 * scales continuously through named bands, and `dailyHeatDelta` exposes the rate so
 * the UI can simply tell you.
 */

/** Heat the city forgets each day on its own. */
export const HEAT_BASE_DECAY = 3;

export interface HeatBand {
  at: number;
  label: string;
  /** What this level means for the player, in one line. */
  desc: string;
  accent: 'emerald' | 'gold' | 'blood';
}

export const HEAT_BANDS: HeatBand[] = [
  { at: 0,  label: 'Onopvallend', desc: 'Niemand kijkt je kant op.', accent: 'emerald' },
  { at: 30, label: 'Gezien',      desc: 'Verkopers rekenen je een risico-opslag.', accent: 'gold' },
  { at: 55, label: 'Gemarkeerd',  desc: 'De politie let op je. Invallen worden waarschijnlijk.', accent: 'gold' },
  { at: 80, label: 'Gezocht',     desc: 'Een inval is een kwestie van tijd.', accent: 'blood' },
];

export function heatBand(heat: number): HeatBand {
  let band = HEAT_BANDS[0];
  for (const b of HEAT_BANDS) if (heat >= b.at) band = b;
  return band;
}

/** Where the market starts charging you extra, and how steeply. */
export const SURCHARGE_FROM = 30;

/** Fractional price increase sellers add because you are hot (0 .. 0.4). */
export function marketSurcharge(heat: number): number {
  if (heat <= SURCHARGE_FROM) return 0;
  return Math.min(0.4, (heat - SURCHARGE_FROM) * 0.006);
}

/** Heat at which the police start showing an interest at all. */
export const POLICE_FROM = 40;

/**
 * Chance per day that the police force a decision on you. Continuous rather than a
 * hard threshold, so heat is a slope you manage instead of a line you hop over.
 */
export function policeIncidentChance(heat: number): number {
  if (heat < POLICE_FROM) return 0;
  return Math.min(0.55, (heat - POLICE_FROM) / 110);
}

export interface HeatFlow {
  /** Heat your rackets add per day. */
  rackets: number;
  /** Heat the auto-fence adds per day. */
  fence: number;
  /** Heat your network absorbs per day. */
  shield: number;
  /** Heat the city forgets per day. */
  decay: number;
  /** Net change per day: positive climbs, negative cools. */
  net: number;
}

/**
 * The daily heat balance, broken out so the UI can both show the net rate and
 * explain where it comes from. This is what turns heat from a mystery number into
 * something the player can actually steer.
 */
export function dailyHeatFlow(state: GameState): HeatFlow {
  const rackets = state.org ? resolveRacketTick(state.org).heat : 0;
  const fence = autoFenceActive(state) ? AUTO_FENCE_HEAT : 0;
  const shield = equipHeatShield(state);
  const decay = HEAT_BASE_DECAY;
  return { rackets, fence, shield, decay, net: rackets + fence - shield - decay };
}

/** Shorthand for the net daily change. */
export function dailyHeatDelta(state: GameState): number {
  return dailyHeatFlow(state).net;
}
