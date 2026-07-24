import type { GameState } from './types';
import { GOODS } from './constants';

/**
 * AUTO-FENCE — the passive, idle version of the contraband market.
 *
 * The manual market is buy-low-in-one-district, sell-high-in-another, by hand.
 * The auto-fence runs that loop for you every world tick: it reads the live price
 * spreads across districts and skims a profit scaled by your fence's throughput
 * (level) and your business sense (brains). Smuggling stays risky — it stokes a
 * little heat each tick and a shipment is occasionally seized.
 *
 * This turns the game's most click-heavy system into an idle income stream you
 * simply switch on, and manage against heat like every other racket.
 */

export const AUTO_FENCE_COST = 50000;
export const AUTO_FENCE_HEAT = 1;            // heat added per active tick
export const AUTO_FENCE_SEIZURE_CHANCE = 0.08; // chance a tick's run is busted

export function autoFenceOwned(state: GameState): boolean {
  return !!state.autoFence?.owned;
}

export function autoFenceActive(state: GameState): boolean {
  return !!state.autoFence?.owned && !state.autoFence?.paused;
}

/**
 * Average price spread across the market right now, as a fraction (0..1): for each
 * good, (maxPrice - minPrice) / maxPrice over all districts, averaged. Higher when
 * the market is volatile — that's when a fence makes the most money.
 */
export function marketSpreadPct(state: GameState): number {
  const prices = state.prices;
  if (!prices) return 0;
  const districts = Object.keys(prices);
  if (districts.length < 2) return 0;

  let sum = 0, counted = 0;
  for (const g of GOODS) {
    let min = Infinity, max = 0;
    for (const d of districts) {
      const p = prices[d]?.[g.id];
      if (!p || p <= 0) continue;
      if (p < min) min = p;
      if (p > max) max = p;
    }
    if (max > 0 && min !== Infinity && max > min) {
      sum += (max - min) / max;
      counted++;
    }
  }
  return counted > 0 ? sum / counted : 0;
}

/** Your fence's throughput — how much contraband it can move per tick. */
export function fenceThroughput(state: GameState): number {
  return 800 + (state.player?.level || 1) * 120;
}

/** Your fencing efficiency multiplier, sharpened by brains. */
export function fenceEfficiency(state: GameState): number {
  const brains = state.player?.stats?.brains || 0;
  return 1 + brains * 0.03;
}

/**
 * Passive profit the auto-fence earns this tick (0 if not active). Driven by the
 * live market spread, your throughput and efficiency.
 */
export function autoFenceIncome(state: GameState): number {
  if (!autoFenceActive(state)) return 0;
  const spread = marketSpreadPct(state);
  if (spread <= 0) return 0;
  return Math.floor(fenceThroughput(state) * spread * fenceEfficiency(state));
}
