import type { GameState, DistrictId } from './types';
import { getVehicleUpgradeBonus } from './engine';

/**
 * RIJDEN DOOR DE STAD — wat een rit kost en wanneer hij niet kan.
 *
 * (Not to be confused with travel.ts, which is the international smuggling run.)
 *
 * Three screens each computed the price of a trip across town and none of them matched
 * the reducer. The district popup said "€50" unless you had a Chauffeur or owned the
 * district. The analysis screen's Reis & Koop dialog said "Reiskosten: €50" flat. The
 * reducer charges €50 minus €8 per point of vehicle speed upgrade, and nothing at all if
 * you have a Chauffeur, a racer, own the district, or if it is storming.
 *
 * Worse, the reducer's first three guards are silent refusals: locked up, on cooldown, or
 * out of energy and it returns the state untouched. The Reis & Koop dialog fired its
 * "Aangekomen in X" toast regardless, so the game could tell you you had travelled while
 * you stood exactly where you were.
 *
 * Everything here is what the reducer does, in one place, so a screen can quote the real
 * price and grey out a trip you cannot make.
 */

export const TRAVEL_BASE_COST = 50;
export const TRAVEL_ENERGY = 5;
/** Cooldown between trips, in ms — you cannot criss-cross the city on one breath. */
export const TRAVEL_COOLDOWN_MS = 30000;

/** What the trip costs in cash. Free is genuinely free, not "€50 shown, €0 charged". */
export function travelCost(state: GameState, to: DistrictId): number {
  const hasChauffeur = state.crew?.some(c => c.role === 'Chauffeur');
  const hasRacer = state.crew?.some(c => c.specialization === 'racer');
  const isOwned = state.ownedDistricts?.includes(to);
  const isStorm = state.weather === 'storm';
  if (hasChauffeur || hasRacer || isOwned || isStorm) return 0;

  const speedBonus = getVehicleUpgradeBonus(state, 'speed');
  return speedBonus > 0 ? Math.max(0, TRAVEL_BASE_COST - speedBonus * 8) : TRAVEL_BASE_COST;
}

/** Seconds left on the travel cooldown, or 0. */
export function travelCooldownLeft(state: GameState): number {
  if (!state.travelCooldownUntil) return 0;
  const ms = new Date(state.travelCooldownUntil).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 1000) : 0;
}

/**
 * Why you cannot go, in words a player can act on — or null when the trip is on.
 * Mirrors the guards at the top of the TRAVEL reducer, in the same order.
 */
export function travelBlockedReason(state: GameState, to: DistrictId): string | null {
  if (state.loc === to) return 'Je bent hier al.';
  if ((state.hidingDays || 0) > 0) return 'Je zit ondergedoken.';
  if (state.prison) return 'Je zit vast.';
  if (state.hospital) return 'Je ligt in het ziekenhuis.';
  const cooldown = travelCooldownLeft(state);
  if (cooldown > 0) return `Nog ${cooldown}s tot je weer de weg op kunt.`;
  if ((state.energy || 0) < TRAVEL_ENERGY) return `Te weinig energie — ${TRAVEL_ENERGY} nodig.`;
  if ((state.money || 0) < travelCost(state, to)) return 'Te weinig geld voor de rit.';
  return null;
}

export function canTravel(state: GameState, to: DistrictId): boolean {
  return travelBlockedReason(state, to) === null;
}
