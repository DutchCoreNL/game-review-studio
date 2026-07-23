import type { DistrictId, GoodId } from '../types';
import { DISTRICTS, GOODS } from '../constants';
import type { WorldSimState, WorldBot, WorldFeedItem, WorldListing, WorldWar } from './types';
import { mulberry32, pick, randInt, jitter } from './rng';

const DISTRICT_IDS = Object.keys(DISTRICTS) as DistrictId[];
const FEED_CAP = 60;
const LISTING_CAP = 40;

function districtName(id: DistrictId): string {
  return DISTRICTS[id]?.name || id;
}

function addFeed(world: WorldSimState, item: Omit<WorldFeedItem, 'id' | 'createdAt'>, nowMs: number, rand: () => number) {
  world.feed.unshift({
    ...item,
    id: `feed_${nowMs}_${Math.floor(rand() * 1e6)}`,
    createdAt: nowMs,
  });
  if (world.feed.length > FEED_CAP) world.feed.length = FEED_CAP;
}

export interface SimStepSummary {
  botActions: number;
  newListings: number;
  warsStarted: number;
  warsResolved: string[]; // human-readable results
  districtCaptures: string[];
  notableFeed: string[]; // a few headline lines for the catch-up report
}

/**
 * Advances the local bot world by ONE simulated day. Mutates `world` in place.
 * `gameDay` is the player's current in-game day, `nowMs` a monotonically increasing timestamp.
 */
export function simulateWorldDay(world: WorldSimState, gameDay: number, nowMs: number): SimStepSummary {
  // Fold the day into the seed so each day is deterministic but distinct.
  const rand = mulberry32((world.seed ^ (gameDay * 2654435761)) >>> 0);
  const summary: SimStepSummary = {
    botActions: 0, newListings: 0, warsStarted: 0,
    warsResolved: [], districtCaptures: [], notableFeed: [],
  };

  // --- Presence: reshuffle who's "online" ---
  for (const bot of world.bots) {
    bot.online = rand() < 0.3;
  }

  // --- Bot economic/level drift: each bot does a little something ---
  // Only a sample acts each day to keep the feed believable and cheap.
  const actorsThisDay = Math.min(world.bots.length, randInt(rand, 18, 32));
  for (let i = 0; i < actorsThisDay; i++) {
    const bot = world.bots[Math.floor(rand() * world.bots.length)];
    bot.lastActionDay = gameDay;
    summary.botActions++;

    const roll = rand();
    switch (bot.archetype) {
      case 'trader': {
        const gain = Math.floor(bot.level * 120 * jitter(rand, 0.6));
        bot.money += gain;
        if (roll < 0.12) {
          const good = pick(rand, GOODS);
          addFeed(world, {
            botId: bot.id, botName: bot.name, icon: '💰', district: bot.loc,
            text: `verkocht een lading ${good.name} in ${districtName(bot.loc)}`, day: gameDay,
          }, nowMs, rand);
        }
        break;
      }
      case 'brawler': {
        bot.xp += randInt(rand, 20, 60);
        if (roll < 0.14) {
          const victim = pick(rand, world.bots);
          if (victim.id !== bot.id) {
            addFeed(world, {
              botId: bot.id, botName: bot.name, icon: '⚔️', district: bot.loc,
              text: `versloeg ${victim.name.split(' ')[0]} in een straatgevecht`, day: gameDay,
            }, nowMs, rand);
          }
        }
        break;
      }
      case 'gambler': {
        const swing = Math.floor(bot.level * 200 * (rand() - 0.45));
        bot.money = Math.max(0, bot.money + swing);
        if (swing > 0 && roll < 0.1) {
          addFeed(world, {
            botId: bot.id, botName: bot.name, icon: '🎰', district: 'neon',
            text: `won groot in het casino op de Neon Strip`, day: gameDay,
          }, nowMs, rand);
        }
        break;
      }
      case 'gangster': {
        bot.rep += randInt(rand, 5, 15);
        break;
      }
      case 'hustler': {
        bot.money += Math.floor(bot.level * 80 * jitter(rand, 0.8));
        bot.xp += randInt(rand, 10, 30);
        break;
      }
    }

    // Level-up when xp threshold crossed (simple curve).
    const threshold = bot.level * 100;
    if (bot.xp >= threshold) {
      bot.xp -= threshold;
      bot.level++;
      if (rand() < 0.25) {
        addFeed(world, {
          botId: bot.id, botName: bot.name, icon: '⭐', district: bot.loc,
          text: `bereikte level ${bot.level}`, day: gameDay,
        }, nowMs, rand);
      }
    }

    // Occasional relocation.
    if (rand() < 0.08) bot.loc = pick(rand, DISTRICT_IDS);
  }

  // --- Marketplace: bots post fresh listings, expire old ones ---
  world.listings = world.listings.filter(l => l.expiresDay > gameDay);
  const newListingCount = randInt(rand, 1, 3);
  for (let i = 0; i < newListingCount && world.listings.length < LISTING_CAP; i++) {
    const seller = pick(rand, world.bots);
    const good = pick(rand, GOODS);
    const distMod = DISTRICTS[seller.loc]?.mods?.[good.id as GoodId] ?? 1;
    const price = Math.max(1, Math.floor(good.base * distMod * jitter(rand, 0.35)));
    world.listings.unshift({
      id: `wl_${nowMs}_${i}_${Math.floor(rand() * 1e5)}`,
      sellerBotId: seller.id,
      sellerName: seller.name,
      goodId: good.id as GoodId,
      quantity: randInt(rand, 2, 12),
      pricePerUnit: price,
      district: seller.loc,
      expiresDay: gameDay + randInt(rand, 1, 3),
    });
    summary.newListings++;
  }

  // --- Gang wars: resolve ongoing, maybe start new ones ---
  const stillActive: WorldWar[] = [];
  for (const war of world.wars) {
    war.attackerScore += randInt(rand, 0, 30);
    war.defenderScore += randInt(rand, 0, 30);
    if (gameDay >= war.endsDay) {
      const atk = world.gangs.find(g => g.id === war.attackerGangId);
      const def = world.gangs.find(g => g.id === war.defenderGangId);
      const attackerWon = war.attackerScore >= war.defenderScore;
      const winner = attackerWon ? atk : def;
      const loser = attackerWon ? def : atk;
      if (winner && loser) {
        winner.power += 10;
        loser.power = Math.max(10, loser.power - 8);
        if (attackerWon && atk) {
          const captured = war.district;
          atk.controlledDistrict = captured;
          if (def && def.controlledDistrict === captured) def.controlledDistrict = null;
          summary.districtCaptures.push(`${atk.name} veroverde ${districtName(captured)}`);
          addFeed(world, {
            botId: null, botName: 'Wereld', icon: '🏴', district: captured,
            text: `${atk.name} heeft ${districtName(captured)} veroverd op ${def?.name || 'een rivaal'}!`, day: gameDay,
          }, nowMs, rand);
        }
        summary.warsResolved.push(`${winner.name} won de oorlog om ${districtName(war.district)}`);
      }
    } else {
      stillActive.push(war);
    }
  }
  world.wars = stillActive;

  if (world.wars.length < 3 && world.gangs.length >= 2 && rand() < 0.35) {
    const a = pick(rand, world.gangs);
    let b = pick(rand, world.gangs);
    let guard = 0;
    while (b.id === a.id && guard++ < 5) b = pick(rand, world.gangs);
    if (b.id !== a.id) {
      const district = b.controlledDistrict || pick(rand, DISTRICT_IDS);
      world.wars.push({
        id: `war_${nowMs}_${Math.floor(rand() * 1e5)}`,
        attackerGangId: a.id, defenderGangId: b.id, district,
        attackerScore: 0, defenderScore: 0,
        startedDay: gameDay, endsDay: gameDay + randInt(rand, 2, 4),
      });
      summary.warsStarted++;
      addFeed(world, {
        botId: null, botName: 'Wereld', icon: '⚔️', district,
        text: `${a.name} verklaart de oorlog aan ${b.name} om ${districtName(district)}!`, day: gameDay,
      }, nowMs, rand);
    }
  }

  // Collect a few headline lines for the catch-up report.
  summary.notableFeed = world.feed.slice(0, 4).map(f => `${f.icon} ${f.text}`);

  world.lastSimAt = new Date(nowMs).toISOString();
  return summary;
}
