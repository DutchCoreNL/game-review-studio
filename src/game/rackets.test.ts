import { describe, it, expect } from 'vitest';
import {
  RACKETS, RACKET_BY_ID, resolveRacketTick, racketsInDistrict, unlockedRackets,
  restingMembers, racketMemberCount, memberIncome, traitFit, TRAIT_BY_ID, CREW_TRAITS,
  REST_LOYALTY_REGEN,
} from './rackets';
import type { PlayerOrg, OrgMember } from './organization';

function member(p: Partial<OrgMember>): OrgMember {
  return { id: Math.random().toString(36).slice(2), name: 'X', role: 'soldaat', level: 10, loyalty: 80, ...p };
}
function org(members: Partial<OrgMember>[], respect = 999): PlayerOrg {
  return { name: 'T', tag: 'T', respect, upgrades: [], controlledDistricts: [], foundedDay: 1, members: members.map(member) };
}

describe('racket catalogue', () => {
  it('spreads rackets across all five districts', () => {
    const districts = new Set(RACKETS.map(r => r.district));
    expect(districts.size).toBe(5);
  });
  it('indexes every racket by id', () => {
    for (const r of RACKETS) expect(RACKET_BY_ID[r.id]).toBe(r);
  });
  it('gates the richest rackets behind respect', () => {
    const fraud = RACKET_BY_ID['crown_fraud'];
    const street = RACKET_BY_ID['low_runners'];
    expect(fraud.income).toBeGreaterThan(street.income);
    expect(fraud.minRespect).toBeGreaterThan(street.minRespect);
  });
  it('only lists rackets the org has standing for', () => {
    const rookie = unlockedRackets(org([], 0));
    expect(rookie.every(r => r.minRespect === 0)).toBe(true);
    expect(rookie.length).toBeLessThan(RACKETS.length);
  });
  it('groups rackets by district', () => {
    expect(racketsInDistrict('low' as any).every(r => r.district === 'low')).toBe(true);
  });
});

describe('crew traits', () => {
  it('defines five traits, all indexed', () => {
    expect(CREW_TRAITS).toHaveLength(5);
    for (const t of CREW_TRAITS) expect(TRAIT_BY_ID[t.id]).toBe(t);
  });
  it('a Meedogenloos is strong at muscle work and weak at quiet work', () => {
    const m = member({ trait: 'meedogenloos' });
    expect(traitFit(m, 'macht')).toBeGreaterThan(1);
    expect(traitFit(m, 'schoon')).toBeLessThan(1);
  });
  it('trait fit changes what a member earns on the same racket', () => {
    const def = RACKET_BY_ID['low_runners']; // kind: geld
    const good = memberIncome(member({ trait: 'straatslim' }), def);
    const bad = memberIncome(member({ trait: 'spook' }), def);
    expect(good).toBeGreaterThan(bad);
  });
});

describe('resolveRacketTick', () => {
  it('is empty with no org or no crew', () => {
    expect(resolveRacketTick(null).money).toBe(0);
    expect(resolveRacketTick(org([])).activeCount).toBe(0);
  });

  it('an assigned member earns money and draws attention in their district', () => {
    const r = resolveRacketTick(org([{ assignment: 'port_smuggle' }]));
    expect(r.money).toBeGreaterThan(0);
    expect(r.activeCount).toBe(1);
    expect(r.attention.port).toBeGreaterThan(0);
  });

  it('laundering pulls heat down instead of earning', () => {
    const r = resolveRacketTick(org([{ assignment: 'neon_launder' }]));
    expect(r.heat).toBeLessThan(0);
    expect(r.money).toBe(0);
  });

  it('resting crew regain loyalty and produce nothing', () => {
    const r = resolveRacketTick(org([{ assignment: null }]));
    expect(r.restingCount).toBe(1);
    expect(r.loyaltyRegen).toBe(REST_LOYALTY_REGEN);
    expect(r.money).toBe(0);
  });

  it('a member assigned to a racket above the org\'s standing does not work', () => {
    const r = resolveRacketTick(org([{ assignment: 'crown_fraud' }], 0));
    expect(r.activeCount).toBe(0);
    expect(r.restingCount).toBe(1);
    expect(r.money).toBe(0);
  });

  it('richer turf pays more than the home streets', () => {
    const home = resolveRacketTick(org([{ assignment: 'low_runners', trait: undefined }]));
    const crown = resolveRacketTick(org([{ assignment: 'crown_fraud', trait: undefined }]));
    expect(crown.money).toBeGreaterThan(home.money);
    expect((crown.attention.crown || 0)).toBeGreaterThan(home.attention.low || 0);
  });

  it('a disloyal member earns less than a loyal one', () => {
    const loyal = resolveRacketTick(org([{ assignment: 'low_runners', loyalty: 100, trait: undefined }]));
    const sulky = resolveRacketTick(org([{ assignment: 'low_runners', loyalty: 0, trait: undefined }]));
    expect(sulky.money).toBeLessThan(loyal.money);
  });

  it('counts members per racket', () => {
    const o = org([{ assignment: 'low_runners' }, { assignment: 'low_runners' }, { assignment: null }]);
    expect(racketMemberCount(o, 'low_runners')).toBe(2);
    expect(restingMembers(o)).toHaveLength(1);
  });
});
