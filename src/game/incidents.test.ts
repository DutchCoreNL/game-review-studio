import { describe, it, expect } from 'vitest';
import {
  rollIncident, districtIncome, ATTENTION_INCIDENT_THRESHOLD, HEAT_INCIDENT_THRESHOLD,
  LOYALTY_TROUBLE_THRESHOLD,
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

describe('districtIncome', () => {
  it('sums only the rackets worked in that district', () => {
    const o = org([{ assignment: 'port_smuggle' }, { assignment: 'low_runners' }]);
    expect(districtIncome(o, 'port' as any)).toBeGreaterThan(0);
    expect(districtIncome(o, 'iron' as any)).toBe(0);
  });
});
