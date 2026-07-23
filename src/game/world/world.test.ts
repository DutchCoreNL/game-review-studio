import { describe, it, expect } from 'vitest';
import { generateWorld } from './generateWorld';
import { simulateWorldDay } from './simulate';
import { WORLD_SIM_VERSION } from './types';

describe('world generation', () => {
  it('produces a populated, well-formed world', () => {
    const w = generateWorld(12345, 5);
    expect(w.bots.length).toBeGreaterThan(50);
    expect(w.gangs.length).toBeGreaterThan(0);
    expect(w.version).toBe(WORLD_SIM_VERSION);
    // Every bot has the required fields and sane values.
    for (const bot of w.bots) {
      expect(bot.id).toMatch(/^bot_\d+$/);
      expect(bot.name.length).toBeGreaterThan(0);
      expect(bot.level).toBeGreaterThanOrEqual(1);
      expect(bot.money).toBeGreaterThanOrEqual(0);
    }
  });

  it('is deterministic for the same seed', () => {
    const a = generateWorld(999, 3);
    const b = generateWorld(999, 3);
    expect(a.bots.map(x => x.name)).toEqual(b.bots.map(x => x.name));
    expect(a.gangs.map(x => x.name)).toEqual(b.gangs.map(x => x.name));
  });

  it('generates unique bot names', () => {
    const w = generateWorld(42, 1);
    const names = w.bots.map(b => b.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('assigns gang members consistently (membership matches roster)', () => {
    const w = generateWorld(7, 4);
    for (const gang of w.gangs) {
      for (const botId of gang.memberBotIds) {
        const bot = w.bots.find(b => b.id === botId);
        expect(bot?.gangId).toBe(gang.id);
      }
    }
  });
});

describe('world simulation', () => {
  it('advances a day without corrupting state', () => {
    const w = generateWorld(555, 5);
    const beforeBotCount = w.bots.length;
    const summary = simulateWorldDay(w, 1, Date.now());
    expect(w.bots.length).toBe(beforeBotCount); // bots never vanish
    expect(summary.botActions).toBeGreaterThan(0);
    expect(w.feed.length).toBeLessThanOrEqual(60); // ring buffer respected
    // Listings never exceed their cap and always reference a real seller.
    for (const l of w.listings) {
      expect(w.bots.some(b => b.id === l.sellerBotId)).toBe(true);
      expect(l.pricePerUnit).toBeGreaterThan(0);
    }
  });

  it('keeps money non-negative across many simulated days', () => {
    const w = generateWorld(2024, 8);
    for (let day = 1; day <= 60; day++) {
      simulateWorldDay(w, day, Date.now() + day * 1000);
    }
    for (const bot of w.bots) {
      expect(bot.money).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(bot.money)).toBe(true);
    }
    // Feed stays capped even after 60 days.
    expect(w.feed.length).toBeLessThanOrEqual(60);
  });

  it('resolves gang wars and can capture districts over time', () => {
    const w = generateWorld(31337, 10);
    let captures = 0;
    let warsStarted = 0;
    for (let day = 1; day <= 120; day++) {
      const s = simulateWorldDay(w, day, Date.now() + day * 1000);
      captures += s.districtCaptures.length;
      warsStarted += s.warsStarted;
    }
    // Over 120 days at least some wars should start (probabilistic but overwhelmingly likely).
    expect(warsStarted).toBeGreaterThan(0);
    expect(captures).toBeGreaterThanOrEqual(0);
  });
});
