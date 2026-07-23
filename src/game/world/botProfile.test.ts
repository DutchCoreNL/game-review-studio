import { describe, it, expect } from 'vitest';
import { generateWorld } from './generateWorld';
import {
  buildBotProfile,
  botToPvPInfo,
  botToCombatTarget,
  selectDuelOpponents,
  selectRivals,
  selectMostWanted,
} from './botProfile';

describe('bot profiles', () => {
  it('builds a believable public profile from a bot', () => {
    const w = generateWorld(12345, 5);
    const bot = w.bots[0];
    const profile = buildBotProfile(w, bot.id, 30);
    expect(profile).not.toBeNull();
    expect(profile!.username).toBe(bot.name);
    expect(profile!.level).toBe(bot.level);
    expect(profile!.combatRating).toBeGreaterThan(0);
    // Member-since is expressed relative to the player's current day.
    expect(profile!.memberSince).toMatch(/dagen geleden/);
  });

  it('returns null for an unknown bot id', () => {
    const w = generateWorld(1, 1);
    expect(buildBotProfile(w, 'nope', 1)).toBeNull();
  });

  it('derives a combat-ready PvP target with a loadout from gear', () => {
    const w = generateWorld(777, 6);
    const bot = w.bots.find(b => (b.gear || []).length > 0)!;
    const info = botToPvPInfo(bot);
    expect(info.userId).toBe(bot.id);
    expect(info.isBot).toBe(true);
    expect(info.maxHp).toBeGreaterThan(0);
    expect(info.loadout).toBeTruthy();
    // A duel target enters at full health.
    const target = botToCombatTarget(bot);
    expect(target.hp).toBe(target.maxHp);
  });

  it('selects duel opponents within a reasonable level band', () => {
    const w = generateWorld(2024, 8);
    const playerLevel = 10;
    const opponents = selectDuelOpponents(w, w.bots[0].loc, playerLevel, 8);
    expect(opponents.length).toBeGreaterThan(0);
    expect(opponents.length).toBeLessThanOrEqual(8);
    for (const o of opponents) {
      expect(Math.abs(o.level - playerLevel)).toBeLessThanOrEqual(15);
    }
  });

  it('surfaces rivals only when there is a grudge', () => {
    const w = generateWorld(9, 4);
    // Fresh world: nobody has rivalry yet.
    expect(selectRivals(w).length).toBe(0);
    w.bots[3].rivalry = 40;
    w.bots[5].bountyOnPlayer = 5000;
    const rivals = selectRivals(w);
    expect(rivals.length).toBe(2);
  });

  it('ranks most-wanted by combat rating and rep', () => {
    const w = generateWorld(31337, 10);
    const wanted = selectMostWanted(w, 12);
    expect(wanted.length).toBeGreaterThan(0);
    for (let i = 1; i < wanted.length; i++) {
      const prev = wanted[i - 1].combatRating + wanted[i - 1].rep;
      const cur = wanted[i].combatRating + wanted[i].rep;
      expect(prev).toBeGreaterThanOrEqual(cur);
    }
  });
});

describe('auctions', () => {
  it('seeds active auctions in a fresh world', () => {
    const w = generateWorld(4242, 5);
    expect(w.auctions.length).toBeGreaterThan(0);
    for (const a of w.auctions) {
      expect(a.status).toBe('active');
      expect(a.currentBid).toBeGreaterThanOrEqual(a.startingPrice);
      // A seeded auction's seller is a real bot.
      expect(w.bots.some(b => b.id === a.sellerBotId)).toBe(true);
    }
  });
});
