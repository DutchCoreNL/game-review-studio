import { describe, it, expect } from 'vitest';
import {
  basePrice, buyPrice, sellPrice, stashFree, maxAffordable, unitProfit,
  bestRouteFor, bestRoutes,
  FENCE_CUT, TRADE_HEAT_BUY, TRADE_HEAT_SELL,
} from './market';
import { getBestTradeRoute } from './engine';
import { marketSurcharge } from './heat';
import { performTrade } from './engine';
import { createInitialState } from './constants';
import type { GameState, GoodId } from './types';

function market(over: Partial<GameState> = {}): GameState {
  return {
    loc: 'low',
    money: 100000,
    rep: 0,
    personalHeat: 0,
    player: { level: 1, stats: { muscle: 0, brains: 0, charm: 0 } },
    org: null,
    equipment: {},
    inventory: {},
    inventoryCosts: {},
    maxInv: 15,
    prices: { low: { weapons: 1000, drugs: 200 } },
    ...over,
  } as unknown as GameState;
}

describe('buyPrice', () => {
  it('is the listed price when you are cold and on neutral ground', () => {
    expect(buyPrice(market(), 'weapons' as GoodId)).toBe(1000);
  });

  it('rises with heat, on the same curve the screen prints', () => {
    // The engine used to charge a flat +20% above an average that included vehicle heat
    // — always zero — so the surcharge the banner advertised was never actually applied.
    const hot = market({ personalHeat: 80 });
    const expected = Math.floor(1000 * (1 + marketSurcharge(80)));
    expect(buyPrice(hot, 'weapons' as GoodId)).toBe(expected);
    expect(buyPrice(hot, 'weapons' as GoodId)).toBeGreaterThan(buyPrice(market(), 'weapons' as GoodId));
  });

  it('is cheaper on your own turf', () => {
    const turf = market({ org: { controlledDistricts: ['low'], members: [] } } as any);
    expect(buyPrice(turf, 'weapons' as GoodId)).toBeLessThan(buyPrice(market(), 'weapons' as GoodId));
  });

  it('is zero for something this district does not trade', () => {
    expect(buyPrice(market(), 'crypto' as GoodId)).toBe(0);
  });
});

describe('sellPrice', () => {
  it('is the listed price minus the fence cut', () => {
    expect(sellPrice(market(), 'weapons' as GoodId)).toBe(Math.floor(1000 * FENCE_CUT));
  });

  it('improves with charm and with your name', () => {
    const known = market({ rep: 5000, player: { level: 9, stats: { charm: 10 } } } as any);
    expect(sellPrice(known, 'weapons' as GoodId)).toBeGreaterThan(sellPrice(market(), 'weapons' as GoodId));
  });

  it('pays more on your own turf — which is what the turf banner promises', () => {
    const turf = market({ org: { controlledDistricts: ['low'], members: [] } } as any);
    expect(sellPrice(turf, 'weapons' as GoodId)).toBeGreaterThan(sellPrice(market(), 'weapons' as GoodId));
  });
});

describe('stash space', () => {
  it('counts the Opslag track, not just the base stash', () => {
    // performTrade capped buying at `state.maxInv`, so the market counted your stash out
    // of 40 and then refused to fill past 15.
    const kitted = market({ equipment: { opslag: 2 } } as any);
    expect(stashFree(kitted)).toBeGreaterThan(stashFree(market()));
  });

  it('shrinks as you fill it', () => {
    const half = market({ inventory: { weapons: 5 } } as any);
    expect(stashFree(half)).toBe(stashFree(market()) - 5);
  });

  it('caps what you can afford by both space and capital', () => {
    const poor = market({ money: 2500 });
    expect(maxAffordable(poor, 'weapons' as GoodId)).toBe(2);
    const cramped = market({ inventory: { drugs: 14 } } as any);
    expect(maxAffordable(cramped, 'weapons' as GoodId)).toBe(1);
  });
});

describe('unitProfit', () => {
  it('counts loot from a klus as pure profit — it cost you nothing', () => {
    const looted = market({ inventory: { weapons: 3 }, inventoryCosts: {} } as any);
    expect(unitProfit(looted, 'weapons' as GoodId)).toBe(sellPrice(looted, 'weapons' as GoodId));
  });

  it('goes negative when you paid more than the fence offers', () => {
    const bagheld = market({ inventory: { weapons: 2 }, inventoryCosts: { weapons: 5000 } } as any);
    expect(unitProfit(bagheld, 'weapons' as GoodId)).toBeLessThan(0);
  });
});

describe('performTrade', () => {
  const stocked = () => {
    const s = createInitialState();
    s.loc = 'low' as never;
    s.money = 100000;
    s.prices = { low: { weapons: 1000 } } as never;
    s.inventory = {} as never;
    s.inventoryCosts = {} as never;
    return s;
  };

  it('charges exactly what the screen would print', () => {
    const s = stocked();
    const quoted = buyPrice(s, 'weapons' as GoodId);
    const before = s.money;
    performTrade(s, 'weapons' as GoodId, 'buy', 3);
    expect(before - s.money).toBe(quoted * 3);
    expect(s.inventory.weapons).toBe(3);
  });

  it('pays exactly what the screen would print', () => {
    const s = stocked();
    s.inventory = { weapons: 4 } as never;
    const quoted = sellPrice(s, 'weapons' as GoodId);
    const before = s.money;
    performTrade(s, 'weapons' as GoodId, 'sell', 4);
    expect(s.money - before).toBe(quoted * 4);
    expect(s.inventory.weapons).toBe(0);
  });

  it('lets you fill the stash the Opslag track actually gives you', () => {
    const s = stocked();
    s.equipment = { opslag: 2 } as never;
    const room = stashFree(s);
    expect(room).toBeGreaterThan(15);
    performTrade(s, 'weapons' as GoodId, 'buy', room);
    expect(s.inventory.weapons).toBe(room);
  });

  it('refuses rather than half-filling when there is no space', () => {
    const s = stocked();
    s.inventory = { weapons: stashFree(s) } as never;
    const res = performTrade(s, 'weapons' as GoodId, 'buy', 1);
    expect(res.success).toBe(false);
  });
});

describe('trade heat', () => {
  it('costs more to sell than to buy — moving the goods is the loud part', () => {
    expect(TRADE_HEAT_SELL).toBeGreaterThan(TRADE_HEAT_BUY);
  });
});

describe('routes', () => {
  /** Cheap in Sloppen, dear in Kroon. */
  const spread = (over: Partial<GameState> = {}) => market({
    prices: {
      low: { weapons: 1000 },
      crown: { weapons: 3000 },
      port: { weapons: 1500 },
      iron: { weapons: 1200 },
      neon: { weapons: 1800 },
    },
    ...over,
  } as any);

  it('buys where it is cheap and sells where the fence pays most', () => {
    const r = bestRouteFor(spread(), 'weapons' as GoodId)!;
    expect(r.from).toBe('low');
    expect(r.to).toBe('crown');
  });

  it('quotes the price you would really pay and really get, not the listed one', () => {
    const s = spread();
    const r = bestRouteFor(s, 'weapons' as GoodId)!;
    expect(r.buy).toBe(buyPrice(s, 'weapons' as GoodId, 'low' as never));
    expect(r.sell).toBe(sellPrice(s, 'weapons' as GoodId, 'crown' as never));
    expect(r.perUnit).toBe(r.sell - r.buy);
  });

  it('prices the buy side with your heat — the old screen quoted a profit you could not get', () => {
    // The analysis panel took the raw listed price on the buy side, so the surcharge you
    // were about to be charged never appeared in the margin it promised you.
    const cold = bestRouteFor(spread(), 'weapons' as GoodId)!;
    const hot = bestRouteFor(spread({ personalHeat: 90 }), 'weapons' as GoodId)!;
    expect(hot.buy).toBeGreaterThan(cold.buy);
    expect(hot.perUnit).toBeLessThan(cold.perUnit);
  });

  it('sizes the run by what your stash and your capital allow', () => {
    const s = spread({ money: 5000 });
    const r = bestRouteFor(s, 'weapons' as GoodId)!;
    expect(r.units).toBe(Math.floor(5000 / r.buy));
    expect(r.total).toBe(r.perUnit * r.units);
  });

  it('offers nothing when there is no spread worth the fence cut', () => {
    const flat = market({
      prices: { low: { weapons: 1000 }, crown: { weapons: 1000 }, port: { weapons: 1000 }, iron: { weapons: 1000 }, neon: { weapons: 1000 } },
    } as any);
    expect(bestRouteFor(flat, 'weapons' as GoodId)).toBeNull();
    expect(bestRoutes(flat)).toHaveLength(0);
  });

  it('never routes a good back to the district it came from', () => {
    for (const r of bestRoutes(spread())) expect(r.from).not.toBe(r.to);
  });

  it('ranks the fattest run first', () => {
    const rs = bestRoutes(spread());
    for (let i = 1; i < rs.length; i++) expect(rs[i - 1].total).toBeGreaterThanOrEqual(rs[i].total);
  });

  it('agrees with the route the market header prints — there used to be four formulas', () => {
    const s = spread();
    const header = getBestTradeRoute(s)!;
    const [top] = bestRoutes(s);
    expect(header.buyDistrict).toBe(top.from);
    expect(header.sellDistrict).toBe(top.to);
    expect(header.profit).toBe(top.perUnit);
  });
});
