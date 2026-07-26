import type { GameState, GoodId, DistrictId } from './types';
import { marketSurcharge } from './heat';
import { orgControlsDistrict, ORG_TURF_BUY_DISCOUNT, ORG_TURF_SELL_BONUS } from './organization';
import { stashCapacity } from './score';
import { DISTRICTS, GOODS } from './constants';

/**
 * DE MARKT — één plek waar prijzen worden bepaald.
 *
 * The price the market screen printed and the price the engine charged were two
 * different calculations that had drifted apart:
 *
 *   - The screen showed a heat surcharge from `marketSurcharge(personalHeat)`, a smooth
 *     curve up to +40%. The engine applied a flat +20% and only when `getAverageHeat`
 *     cleared 50 — an average of personal heat and *vehicle* heat, which is always zero
 *     now, so personal heat had to reach 100 before the surcharge ever fired. The banner
 *     could read "+35% risico toeslag" while you were charged nothing.
 *   - The screen showed a sell price without the organisation's turf bonus, while the
 *     engine paid it — and a banner two rows up promised "+10% verkoop".
 *   - Buying was capped at `state.maxInv`, the base stash, ignoring the Opslag track
 *     entirely: the panel counted your stash out of 40 and the engine refused to fill
 *     past 15.
 *
 * Everything below is now the only place any of that is decided, and both the screen and
 * the reducer call it.
 */

/** The listed price of one unit today, before who you are changes it. Defaults to here. */
export function basePrice(state: GameState, gid: GoodId, district?: DistrictId): number {
  return state.prices?.[district || state.loc]?.[gid] || 0;
}

/**
 * What a seller charges you. Heat is the big lever: when you are hot, everyone you buy
 * from prices in the risk of dealing with you.
 */
export function buyPrice(state: GameState, gid: GoodId, district?: DistrictId): number {
  const where = district || state.loc;
  let price = basePrice(state, gid, where);
  if (price <= 0) return 0;
  if (orgControlsDistrict(state.org, where)) {
    price = price * (1 - ORG_TURF_BUY_DISCOUNT);
  }
  price = price * (1 + marketSurcharge(state.personalHeat || 0));
  return Math.max(1, Math.floor(price));
}

/** The cut a fence takes off the listed price before anything improves it. */
export const FENCE_CUT = 0.85;

/** Your charm and your name talk the fence up. */
export function sellBonus(state: GameState): number {
  const charm = state.player?.stats?.charm || 0;
  return charm * 0.02 + (state.rep || 0) / 5000;
}

/** What a fence pays you for one unit. Defaults to here. */
export function sellPrice(state: GameState, gid: GoodId, district?: DistrictId): number {
  const where = district || state.loc;
  const listed = basePrice(state, gid, where);
  if (listed <= 0) return 0;
  let price = listed * FENCE_CUT * (1 + sellBonus(state));
  if (orgControlsDistrict(state.org, where)) {
    price = price * (1 + ORG_TURF_SELL_BONUS);
  }
  return Math.max(1, Math.floor(price));
}

/** Free slots in the stash, counting the Opslag track. */
export function stashFree(state: GameState): number {
  const held = Object.values(state.inventory || {}).reduce((a, b) => a + (b || 0), 0);
  return Math.max(0, stashCapacity(state) - held);
}

/** How many units you could actually buy right now, given space and capital. */
export function maxAffordable(state: GameState, gid: GoodId): number {
  const price = buyPrice(state, gid);
  if (price <= 0) return 0;
  return Math.min(stashFree(state), Math.floor((state.money || 0) / price));
}

/**
 * Profit on one unit you are holding, against what you paid for it. Loot from a klus
 * costs nothing, so its whole sale price is profit — which is the point.
 */
export function unitProfit(state: GameState, gid: GoodId): number {
  const held = state.inventory?.[gid] || 0;
  if (held <= 0) return 0;
  const avgCost = Math.floor((state.inventoryCosts?.[gid] || 0));
  return sellPrice(state, gid) - avgCost;
}

/** Heat from moving goods. Selling contraband is the loudest thing you do here. */
export const TRADE_HEAT_BUY = 1;
export const TRADE_HEAT_SELL = 2;

/* ------------------------------------------------------------------ *
 * ROUTES — koop daar, verkoop hier.
 *
 * Three separate places used to compute "the profit on this route" and all three
 * disagreed. The analysis screen used `duurste × 0.85 × (1 + charme)`, the header strip
 * on the market used `duurste × 0.85` with no charm at all, and the smart alarm used a
 * third copy of the first one. None of them applied the heat surcharge to the buy side or
 * the turf bonus to the sell side, so every profit this game quoted you was a number you
 * could not actually realise — and the hotter you were, the further off it got.
 *
 * A route is now priced with the same two functions a real purchase and a real sale go
 * through, so the figure on the card is the figure in your pocket.
 * ------------------------------------------------------------------ */

export interface TradeRoute {
  good: GoodId;
  /** Where it is cheap. */
  from: DistrictId;
  /** Where the fence pays best. */
  to: DistrictId;
  /** What one unit costs you there. */
  buy: number;
  /** What one unit fetches there. */
  sell: number;
  /** Margin on one unit. */
  perUnit: number;
  /** How many you could actually carry and afford — the size of the real run. */
  units: number;
  /** What the whole run is worth: `perUnit × units`. */
  total: number;
}

const ALL_DISTRICTS = Object.keys(DISTRICTS) as DistrictId[];

/** The best pair of districts to move one good between, today. */
export function bestRouteFor(state: GameState, gid: GoodId): TradeRoute | null {
  let best: TradeRoute | null = null;

  for (const from of ALL_DISTRICTS) {
    const buy = buyPrice(state, gid, from);
    if (buy <= 0) continue;
    for (const to of ALL_DISTRICTS) {
      if (to === from) continue;
      const sell = sellPrice(state, gid, to);
      if (sell <= 0) continue;
      const perUnit = sell - buy;
      if (perUnit <= 0) continue;
      if (best && perUnit <= best.perUnit) continue;
      const units = Math.min(stashFree(state), Math.floor((state.money || 0) / buy));
      best = { good: gid, from, to, buy, sell, perUnit, units, total: perUnit * units };
    }
  }

  return best;
}

/** Every good worth moving today, richest run first. */
export function bestRoutes(state: GameState): TradeRoute[] {
  return GOODS
    .map(g => bestRouteFor(state, g.id as GoodId))
    .filter((r): r is TradeRoute => r !== null)
    .sort((a, b) => (b.total - a.total) || (b.perUnit - a.perUnit));
}
