import { describe, it, expect } from 'vitest';
import {
  sentenceForHeat, SENTENCE_TABLE, bribeCost, BRIBE_COST_PER_DAY,
  escapeOdds, escapeChance, ESCAPE_MAX_CHANCE, minutesUntilRelease,
  rollPrisonDayEvent, PRISON_DAY_EVENTS,
} from './prison';
import { arrestPlayer, endTurn } from './engine';
import { createInitialState } from './constants';
import type { GameState } from './types';

function stateWith(over: Partial<GameState> = {}): GameState {
  return {
    player: { level: 1, stats: { brains: 0, muscle: 0, charm: 0 } },
    equipment: {},
    org: null,
    tickIntervalMinutes: 30,
    prison: null,
    ...over,
  } as unknown as GameState;
}

describe('sentenceForHeat', () => {
  it('scales with the heat that got you caught', () => {
    expect(sentenceForHeat(20)).toBe(1);
    expect(sentenceForHeat(70)).toBe(2);
    expect(sentenceForHeat(95)).toBe(3);
  });

  it('never exceeds the table, even above 100 heat', () => {
    const max = SENTENCE_TABLE[SENTENCE_TABLE.length - 1].days;
    expect(sentenceForHeat(400)).toBe(max);
  });

  it('stays short enough to be served inside a session', () => {
    // A game day is 30 real minutes; a sentence you cannot outlast in one sitting
    // is a lockout, which is what this rewrite exists to remove.
    expect(SENTENCE_TABLE.every(r => r.days * 30 <= 120)).toBe(true);
  });
});

describe('bribeCost', () => {
  it('is priced per remaining day', () => {
    const s = stateWith({ prison: { daysRemaining: 3, totalSentence: 3, dayServed: 0, moneyLost: 0, dirtyMoneyLost: 0, goodsLost: [], escapeAttempted: false, events: [] } } as any);
    expect(bribeCost(s)).toBe(3 * BRIBE_COST_PER_DAY);
  });

  it('is zero when there is nothing left to serve', () => {
    expect(bribeCost(stateWith())).toBe(0);
  });
});

describe('escapeOdds', () => {
  it('reads only live systems: brains, a spook in the crew, and gear', () => {
    const s = stateWith({
      player: { level: 5, stats: { brains: 10, muscle: 0, charm: 0 } },
      equipment: { gereedschap: 3 },
      org: { members: [{ id: 'a', trait: 'spook' }] },
    } as any);
    const o = escapeOdds(s);
    expect(o.brains).toBeCloseTo(0.2);
    expect(o.ghost).toBeCloseTo(0.12);
    expect(o.gear).toBeCloseTo(0.09);
    expect(o.total).toBeCloseTo(0.18 + 0.2 + 0.12 + 0.09);
  });

  it('gives no ghost bonus without a spook', () => {
    const s = stateWith({ org: { members: [{ id: 'a', trait: 'roekeloos' }] } } as any);
    expect(escapeOdds(s).ghost).toBe(0);
  });

  it('is capped — there is always a guard who is not for sale', () => {
    const s = stateWith({
      player: { level: 99, stats: { brains: 200, muscle: 0, charm: 0 } },
      equipment: { gereedschap: 5 },
      org: { members: [{ id: 'a', trait: 'spook' }] },
    } as any);
    expect(escapeChance(s)).toBe(ESCAPE_MAX_CHANCE);
  });

  it('survives a state with no player, org or equipment', () => {
    expect(escapeChance({} as GameState)).toBeGreaterThan(0);
  });
});

describe('minutesUntilRelease', () => {
  it('counts in real minutes off the tick length, not in real days', () => {
    // Tick just happened, 2 days left => a full tick plus one more day.
    const s = stateWith({
      tickIntervalMinutes: 30,
      lastTickAt: new Date().toISOString(),
      prison: { daysRemaining: 2, totalSentence: 2, dayServed: 0, moneyLost: 0, dirtyMoneyLost: 0, goodsLost: [], escapeAttempted: false, events: [] },
    } as any);
    expect(minutesUntilRelease(s)).toBeGreaterThan(59);
    expect(minutesUntilRelease(s)).toBeLessThanOrEqual(60);
  });

  it('is zero once the sentence is served', () => {
    expect(minutesUntilRelease(stateWith())).toBe(0);
  });

  it('honours a custom tick length', () => {
    const s = stateWith({
      tickIntervalMinutes: 10,
      lastTickAt: new Date().toISOString(),
      prison: { daysRemaining: 3, totalSentence: 3, dayServed: 0, moneyLost: 0, dirtyMoneyLost: 0, goodsLost: [], escapeAttempted: false, events: [] },
    } as any);
    expect(minutesUntilRelease(s)).toBeLessThanOrEqual(30);
  });
});

describe('rollPrisonDayEvent', () => {
  it('returns nothing on a quiet day', () => {
    expect(rollPrisonDayEvent(() => 0.9)).toBeNull();
  });

  it('returns an event when the day is not quiet', () => {
    const evt = rollPrisonDayEvent(() => 0.1);
    expect(evt).not.toBeNull();
    expect(PRISON_DAY_EVENTS).toContain(evt!);
  });

  it('only carries effects that touch live systems', () => {
    // The old set moved HP and loyalty on the retired `state.crew` roster, so a day
    // inside changed nothing the player could see.
    const allowed = ['brains_up', 'muscle_up', 'charm_up', 'respect_up', 'day_reduce', 'money_cost', 'loyalty_down'];
    for (const e of PRISON_DAY_EVENTS) expect(allowed).toContain(e.effect);
  });
});

// ---------- Arrest and the day you are arrested ----------

function arrestable() {
  const s = createInitialState();
  s.personalHeat = 92;
  s.money = 100000;
  s.dirtyMoney = 10000;
  s.inventory = { ...s.inventory, weapons: 6, drugs: 4 } as any;
  s.inventoryCosts = { ...s.inventoryCosts, weapons: 6000, drugs: 4000 } as any;
  return s;
}

describe('arrestPlayer', () => {
  it('takes a cut, not the lot — the stash survives an arrest', () => {
    const s = arrestable();
    arrestPlayer(s, {} as any);
    expect(s.money).toBe(80000);              // 20% of clean money
    expect(s.dirtyMoney).toBe(5000);          // half the dirty money
    expect(s.inventory.weapons).toBe(3);      // half the contraband on you
    expect(s.inventory.drugs).toBe(2);
    // Cost basis moves with the goods, so profit maths stays honest afterwards.
    expect(s.inventoryCosts.weapons).toBe(3000);
  });

  it('records what it took, for the report and the panel', () => {
    const s = arrestable();
    arrestPlayer(s, {} as any);
    expect(s.prison!.moneyLost).toBe(20000);
    expect(s.prison!.dirtyMoneyLost).toBe(5000);
    expect(s.prison!.goodsLost.length).toBe(2);
    expect(s.prison!.dayServed).toBe(0);
  });

  it('opens the sentence with every day still to serve', () => {
    const s = arrestable();
    arrestPlayer(s, {} as any);
    expect(s.prison!.daysRemaining).toBe(s.prison!.totalSentence);
    expect(s.prison!.totalSentence).toBe(sentenceForHeat(92));
  });
});

describe('the tick you are arrested', () => {
  it('does not also serve a day of the sentence', () => {
    // The countdown used to run in the same tick as the arrest, so every sentence was
    // one day short and a one-day sentence was served before it was ever visible.
    const s = arrestable();
    const real = Math.random;
    let n = 0;
    Math.random = () => (n++ < 40 ? 0.01 : real());
    try { endTurn(s); } finally { Math.random = real; }
    expect(s.prison).not.toBeNull();
    expect(s.prison!.dayServed).toBe(0);
    expect(s.prison!.daysRemaining).toBe(s.prison!.totalSentence);
  });
});
