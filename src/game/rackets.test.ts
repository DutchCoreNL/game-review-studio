import { describe, it, expect } from 'vitest';
import { resolveRacketTick, racketMemberCount, idleMembers, RACKETS, RACKET_BY_ID } from './rackets';
import type { PlayerOrg, OrgMember, RacketId } from './organization';

function member(partial: Partial<OrgMember>): OrgMember {
  return { id: Math.random().toString(36).slice(2), name: 'X', role: 'soldaat', level: 10, loyalty: 80, ...partial };
}

function org(members: Partial<OrgMember>[]): PlayerOrg {
  return {
    name: 'Test', tag: 'T', respect: 0, upgrades: [], controlledDistricts: [], foundedDay: 1,
    members: members.map(member),
  };
}

describe('rackets metadata', () => {
  it('exposes four rackets, all indexed by id', () => {
    expect(RACKETS).toHaveLength(4);
    for (const r of RACKETS) expect(RACKET_BY_ID[r.id]).toBe(r);
  });
});

describe('resolveRacketTick', () => {
  it('returns an all-zero result for no org or empty roster', () => {
    expect(resolveRacketTick(null).money).toBe(0);
    expect(resolveRacketTick(org([])).respect).toBe(0);
  });

  it('extortion earns money and adds a little heat', () => {
    const r = resolveRacketTick(org([{ assignment: 'afpersing' }]));
    expect(r.money).toBeGreaterThan(0);
    expect(r.heat).toBe(1); // one extortion member = +1 heat
    expect(r.respect).toBe(0);
    expect(r.counts.afpersing).toBe(1);
  });

  it('territory earns respect and the most heat', () => {
    const r = resolveRacketTick(org([{ assignment: 'territorium' }]));
    expect(r.respect).toBeGreaterThan(0);
    expect(r.heat).toBe(2); // round(1.6)
    expect(r.money).toBe(0);
  });

  it('laundering nets heat downward', () => {
    const r = resolveRacketTick(org([{ assignment: 'witwassen' }]));
    expect(r.heat).toBeLessThan(0);
    expect(r.money).toBe(0);
  });

  it('recruiting lifts crew morale, no money or heat', () => {
    const r = resolveRacketTick(org([{ assignment: 'werving' }, { assignment: 'werving' }]));
    expect(r.loyaltyRegen).toBe(4); // 2 per werving member
    expect(r.money).toBe(0);
    expect(r.heat).toBe(0);
  });

  it('laundering offsets extortion heat (Groei vs Hitte)', () => {
    const hot = resolveRacketTick(org([{ assignment: 'afpersing' }, { assignment: 'afpersing' }]));
    const balanced = resolveRacketTick(org([
      { assignment: 'afpersing' }, { assignment: 'afpersing' }, { assignment: 'witwassen' },
    ]));
    expect(balanced.heat).toBeLessThan(hot.heat);
  });

  it('a disloyal member earns less than a loyal one', () => {
    const loyal = resolveRacketTick(org([{ assignment: 'afpersing', loyalty: 100 }]));
    const sulky = resolveRacketTick(org([{ assignment: 'afpersing', loyalty: 0 }]));
    expect(sulky.money).toBeLessThan(loyal.money);
  });
});

describe('assignment helpers', () => {
  const o = org([
    { assignment: 'afpersing' }, { assignment: 'afpersing' }, { assignment: 'witwassen' }, {},
  ]);
  it('counts members per racket', () => {
    expect(racketMemberCount(o, 'afpersing' as RacketId)).toBe(2);
    expect(racketMemberCount(o, 'witwassen' as RacketId)).toBe(1);
    expect(racketMemberCount(o, 'werving' as RacketId)).toBe(0);
  });
  it('lists idle (unassigned) members', () => {
    expect(idleMembers(o)).toHaveLength(1);
  });
});
