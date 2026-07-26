import { describe, it, expect } from 'vitest';
import {
  rollIncident, districtIncome, ATTENTION_INCIDENT_THRESHOLD, HEAT_INCIDENT_THRESHOLD,
  LOYALTY_TROUBLE_THRESHOLD, HUNTER_HEAT_THRESHOLD,
} from './incidents';
import type { GameState } from './types';
import type { OrgMember, PlayerOrg } from './organization';

function member(p: Partial<OrgMember>): OrgMember {
  return { id: Math.random().toString(36).slice(2), name: 'Rico', role: 'soldaat', level: 12, loyalty: 80, ...p };
}
function org(members: Partial<OrgMember>[], respect = 500): PlayerOrg {
  return { name: 'NW', tag: 'NW', respect, upgrades: [], controlledDistricts: [], foundedDay: 1, members: members.map(member) };
}
function stub(p: Partial<GameState>): GameState {
  return {
    day: 10, money: 100000, personalHeat: 0, org: org([{ assignment: 'port_smuggle' }]),
    districtAttention: {}, world: { gangs: [] },
    ...p,
  } as unknown as GameState;
}

/** Deterministic rand that always passes probability gates. */
const always = () => 0;
/** Deterministic rand that always fails probability gates. */
const never = () => 0.999;

describe('rollIncident', () => {
  it('stays quiet when there is no organisation', () => {
    expect(rollIncident(stub({ org: null }), always)).toBeNull();
  });

  it('stays quiet on a calm day', () => {
    const s = stub({ personalHeat: 0, districtAttention: {}, org: org([{ assignment: 'low_runners', loyalty: 90 }]) });
    expect(rollIncident(s, never)).toBeNull();
  });

  it('fires a rival incident when a family district gets too much attention', () => {
    const s = stub({ districtAttention: { port: ATTENTION_INCIDENT_THRESHOLD + 10 } as any });
    const inc = rollIncident(s, always);
    expect(inc).not.toBeNull();
    expect(inc!.kind).toBe('rivaal');
    expect(inc!.district).toBe('port');
    expect(inc!.factionId).toBe('cartel');
    // Every branch must be a real decision with a stated cost.
    expect(inc!.choices.length).toBeGreaterThanOrEqual(3);
    for (const c of inc!.choices) expect(c.hint.length).toBeGreaterThan(0);
  });

  it('does not fire a rival incident for a district no family owns', () => {
    const s = stub({ districtAttention: { low: 100 } as any, personalHeat: 0,
      org: org([{ assignment: 'low_runners', loyalty: 90 }]) });
    expect(rollIncident(s, never)).toBeNull();
  });

  it('fires a police incident once heat is high enough', () => {
    const s = stub({ personalHeat: HEAT_INCIDENT_THRESHOLD + 5, districtAttention: {} });
    const inc = rollIncident(s, always);
    expect(inc!.kind).toBe('politie');
    // Bribing must cost money; laying low must not.
    const bribe = inc!.choices.find(c => c.id === 'bribe')!;
    expect(bribe.costMoney).toBeGreaterThan(0);
  });

  it('fires a crew incident for an unhappy member', () => {
    const s = stub({
      personalHeat: 0, districtAttention: {},
      org: org([{ assignment: 'low_runners', loyalty: LOYALTY_TROUBLE_THRESHOLD - 5, name: 'Sanne' }]),
    });
    const inc = rollIncident(s, always);
    expect(inc!.kind).toBe('crew');
    expect(inc!.title).toContain('Sanne');
  });

  it('prioritises the rival over lesser pressure', () => {
    const s = stub({
      personalHeat: HEAT_INCIDENT_THRESHOLD + 20,
      districtAttention: { port: 90 } as any,
    });
    expect(rollIncident(s, always)!.kind).toBe('rivaal');
  });

  it('every choice carries a consequence message', () => {
    const s = stub({ districtAttention: { crown: 80 } as any });
    const inc = rollIncident(s, always)!;
    for (const c of inc.choices) {
      expect(c.outcome.message.length).toBeGreaterThan(0);
      if (c.successChance != null) expect(c.failOutcome).toBeDefined();
    }
  });
});

describe('the bounty hunter', () => {
  /**
   * A hunter at the door used to be a whole separate system: its own generator, its own
   * popup, and consequences that drained `playerHP` — a stat the game never shows. It is
   * an incident now, so it has to behave like one.
   */
  const hot = (over: Partial<GameState> = {}) => stub({
    personalHeat: HUNTER_HEAT_THRESHOLD + 15,
    districtAttention: {},
    org: org([{ assignment: 'low_runners', loyalty: 90 }]),
    ...over,
  });

  it('never turns up while you are barely warm', () => {
    // Below the threshold, no price on your head is worth collecting. Police pressure
    // is the only thing `always` can still fire here, so assert on the kind.
    const s = hot({ personalHeat: HUNTER_HEAT_THRESHOLD - 20 });
    const inc = rollIncident(s, always);
    expect(inc?.kind).not.toBe('premiejager');
  });

  it('turns up once you are properly wanted', () => {
    // The police branch is rolled first, so fail that one and let the hunter roll.
    let n = 0;
    const rand = () => (n++ === 0 ? 0.999 : 0);
    const inc = rollIncident(hot(), rand);
    expect(inc!.kind).toBe('premiejager');
  });

  it('offers fighting, buying him off, and going to ground', () => {
    let n = 0;
    const rand = () => (n++ === 0 ? 0.999 : 0);
    const inc = rollIncident(hot(), rand)!;
    expect(inc.choices.map(c => c.id).sort()).toEqual(['buyout', 'fight', 'hide']);
    const fight = inc.choices.find(c => c.id === 'fight')!;
    expect(fight.successChance).toBeGreaterThan(0);
    expect(fight.failOutcome).toBeDefined();
    expect(inc.choices.find(c => c.id === 'buyout')!.costMoney).toBeGreaterThan(0);
    // Going to ground is free but pulls the crew off their rackets.
    const hide = inc.choices.find(c => c.id === 'hide')!;
    expect(hide.costMoney).toBeUndefined();
    expect(hide.outcome.pullOutOfDistrict).toBe(true);
  });

  it('names the hunter in the title and quotes the price in the body', () => {
    let n = 0;
    const rand = () => (n++ === 0 ? 0.999 : 0);
    const inc = rollIncident(hot(), rand)!;
    expect(inc.title.length).toBeGreaterThan(4);
    expect(inc.body).toMatch(/€[\d.,]+/);
  });

  it('never touches HP — every outcome is money, heat, respect or loyalty', () => {
    let n = 0;
    const rand = () => (n++ === 0 ? 0.999 : 0);
    const inc = rollIncident(hot(), rand)!;
    const allowed = ['money', 'heat', 'respect', 'attention', 'loyalty', 'injureChance', 'rivalPower', 'pullOutOfDistrict', 'message'];
    for (const c of inc.choices) {
      for (const o of [c.outcome, c.failOutcome]) {
        if (!o) continue;
        for (const k of Object.keys(o)) expect(allowed).toContain(k);
      }
    }
  });
});

describe('districtIncome', () => {
  it('sums only the rackets worked in that district', () => {
    const o = org([{ assignment: 'port_smuggle' }, { assignment: 'low_runners' }]);
    expect(districtIncome(o, 'port' as any)).toBeGreaterThan(0);
    expect(districtIncome(o, 'iron' as any)).toBe(0);
  });
});
