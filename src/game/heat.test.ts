import { describe, it, expect } from 'vitest';
import {
  HEAT_BASE_DECAY, HEAT_BANDS, heatBand, marketSurcharge, SURCHARGE_FROM, policeIncidentChance, POLICE_FROM, dailyHeatFlow, dailyHeatDelta, personalHeatDecay, safehouseHeatDecay,
} from './heat';
import type { GameState } from './types';
import type { OrgMember } from './organization';

function member(p: Partial<OrgMember>): OrgMember {
  return { id: Math.random().toString(36).slice(2), name: 'X', role: 'soldaat', level: 8, loyalty: 80, ...p };
}
function stub(p: Partial<GameState> = {}): GameState {
  return { org: null, equipment: {}, ...p } as unknown as GameState;
}

describe('heat bands', () => {
  it('names every level and rises in order', () => {
    expect(heatBand(0).label).toBe('Onopvallend');
    expect(heatBand(100).label).toBe('Gezocht');
    for (let i = 1; i < HEAT_BANDS.length; i++) {
      expect(HEAT_BANDS[i].at).toBeGreaterThan(HEAT_BANDS[i - 1].at);
    }
  });
  it('every band explains itself', () => {
    for (const b of HEAT_BANDS) expect(b.desc.length).toBeGreaterThan(0);
  });
});

describe('market surcharge', () => {
  it('is free while you are unremarkable', () => {
    expect(marketSurcharge(0)).toBe(0);
    expect(marketSurcharge(SURCHARGE_FROM)).toBe(0);
  });
  it('climbs continuously rather than in one jump', () => {
    expect(marketSurcharge(45)).toBeGreaterThan(0);
    expect(marketSurcharge(70)).toBeGreaterThan(marketSurcharge(45));
  });
  it('is capped so it never becomes unplayable', () => {
    expect(marketSurcharge(100)).toBeLessThanOrEqual(0.4);
  });
});

describe('police pressure', () => {
  it('ignores you while you are cool', () => {
    expect(policeIncidentChance(0)).toBe(0);
    expect(policeIncidentChance(POLICE_FROM - 1)).toBe(0);
  });
  it('rises with heat instead of switching on at a threshold', () => {
    const a = policeIncidentChance(50);
    const b = policeIncidentChance(80);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
  });
  it('never becomes a certainty', () => {
    expect(policeIncidentChance(100)).toBeLessThan(1);
  });
});

describe('daily heat flow', () => {
  it('an idle player cools down on their own', () => {
    const flow = dailyHeatFlow(stub());
    expect(flow.decay).toBe(HEAT_BASE_DECAY);
    expect(flow.net).toBeLessThan(0);
  });

  it('earning rackets push the balance upward', () => {
    const hot = stub({ org: { members: [
      member({ assignment: 'port_smuggle' }), member({ assignment: 'iron_guns' }),
    ] } as any });
    expect(dailyHeatFlow(hot).rackets).toBeGreaterThan(0);
    expect(dailyHeatDelta(hot)).toBeGreaterThan(dailyHeatDelta(stub()));
  });

  it('laundering crew and a network pull it back down', () => {
    const earning = stub({ org: { members: [member({ assignment: 'port_smuggle' })] } as any });
    const managed = stub({
      org: { members: [member({ assignment: 'port_smuggle' }), member({ assignment: 'neon_launder' })] } as any,
      equipment: { netwerk: 2 },
    });
    expect(dailyHeatDelta(managed)).toBeLessThan(dailyHeatDelta(earning));
  });

  it('breaks the rate down so the UI can explain it', () => {
    const f = dailyHeatFlow(stub({ equipment: { netwerk: 1 } }));
    expect(f.net).toBe(f.rackets + f.fence - f.shield - f.decay);
  });
});

// ---------- Safehouses and the decay the tick actually applies ----------

describe('personalHeatDecay', () => {
  const base = (over: any = {}) => ({ loc: 'low', safehouses: [], ...over }) as any;

  it('is the base rate with nothing else going on', () => {
    expect(personalHeatDecay(base())).toBe(HEAT_BASE_DECAY);
  });

  it('counts a safehouse in the district you are standing in', () => {
    const s = base({ safehouses: [{ district: 'low', level: 2, upgrades: [] }] });
    expect(safehouseHeatDecay(s)).toBe(3);
    expect(personalHeatDecay(s)).toBe(HEAT_BASE_DECAY + 3);
  });

  it('counts a remote safehouse for much less', () => {
    const s = base({ safehouses: [{ district: 'crown', level: 2, upgrades: [] }] });
    expect(safehouseHeatDecay(s)).toBe(1);
  });

  it('gives a remote level-1 safehouse nothing', () => {
    expect(safehouseHeatDecay(base({ safehouses: [{ district: 'crown', level: 1, upgrades: [] }] }))).toBe(0);
  });

  it('feeds the flow the UI shows, so the quoted rate is the applied rate', () => {
    // The tick used a base of 2 and added safehouses; the header used 3 and ignored
    // them. Whatever the numbers are, both sides have to read this one function.
    const s = base({ safehouses: [{ district: 'low', level: 3, upgrades: [] }] });
    expect(dailyHeatFlow(s).decay).toBe(personalHeatDecay(s));
  });
});
