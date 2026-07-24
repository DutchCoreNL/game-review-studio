import type { GameState } from './types';

/**
 * OPVOLGER (successor) — the prestige loop.
 *
 * Idle games live on prestige: reset the run for a permanent edge. Here you retire
 * your boss and hand the empire to a successor. The successor starts over — fresh
 * crew, cash and level — but inherits Erfenis (legacy) points earned from how far
 * the previous boss got. Legacy points permanently boost every income stream and
 * the successor's starting cash, so each generation climbs faster than the last.
 */

export interface LegacyState {
  generation: number;   // 0 = the founding boss, 1 = first successor, ...
  points: number;       // spendable/standing legacy points (permanent edge)
  totalEarned: number;  // lifetime legacy points ever earned (for display)
}

export const LEGACY_INCOME_PER_POINT = 0.02;     // +2% to all income per point
export const LEGACY_START_CASH_PER_POINT = 1500; // extra starting cash per point
export const RETIRE_MIN_RESPECT = 120;           // must reach a real empire to retire

export function getLegacy(state: GameState): LegacyState {
  return state.legacy ?? { generation: 0, points: 0, totalEarned: 0 };
}

/** Permanent multiplier applied to every income stream (rackets, auto-fence). */
export function legacyIncomeMult(state: GameState): number {
  return 1 + getLegacy(state).points * LEGACY_INCOME_PER_POINT;
}

/** The cash a fresh successor starts with, given the standing legacy points. */
export function legacyStartCash(points: number): number {
  return 3000 + points * LEGACY_START_CASH_PER_POINT;
}

/**
 * Legacy points this run would yield if you retired now — rewards the empire's
 * peak: total earned, organisation respect and the turf you hold.
 */
export function computeLegacyGain(state: GameState): number {
  const org = state.org;
  const respect = org?.respect || 0;
  const earned = state.stats?.totalEarned || 0;
  const districts = org?.controlledDistricts.length || 0;
  return Math.floor(Math.sqrt(earned / 100000) + respect / 40 + districts * 3);
}

/** You can only retire once you've built a real empire worth passing on. */
export function canRetire(state: GameState): boolean {
  return (state.org?.respect || 0) >= RETIRE_MIN_RESPECT && computeLegacyGain(state) > 0;
}
