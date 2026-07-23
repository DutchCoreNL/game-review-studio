import type { DistrictId } from '../types';
import type { WorldBot, WorldGang, WorldSimState, BotArchetype, BotPersonality, BotGangRole } from './types';
import { WORLD_SIM_VERSION } from './types';
import { mulberry32, pick, randInt, jitter } from './rng';
import { BOT_FIRST_NAMES, BOT_NICKNAMES, BOT_LAST_NAMES, BOT_GANG_NAMES } from './botNames';

const DISTRICT_IDS: DistrictId[] = ['port', 'crown', 'iron', 'low', 'neon'];
const ARCHETYPES: BotArchetype[] = ['trader', 'brawler', 'gambler', 'gangster', 'hustler'];
const PERSONALITIES: BotPersonality[] = ['agressief', 'berekenend', 'roekeloos', 'sociaal', 'meedogenloos'];
const BACKSTORIES = ['weduwnaar', 'bankier', 'straatkind'];

const DEFAULT_BOT_COUNT = 110;
const DEFAULT_GANG_COUNT = 8;

// Gear tiers by weapon/armor/gadget, ordered weakest→strongest so higher-level bots carry better kit.
const WEAPONS = ['glock', 'shotgun', 'cartel_blade', 'sniper', 'obsidian_edge', 'voidcaster'];
const ARMORS = ['vest', 'suit', 'skull_armor', 'nox_exosuit'];
const GADGETS = ['phone', 'laptop', 'lotus_implant', 'quantum_deck'];
const VEHICLES = ['toyohata', 'forgedyer', 'bavamotor', 'meridiolux', 'lupoghini', 'royaleryce'];

const BIO_TEMPLATES: Record<BotPersonality, string[]> = {
  agressief: ['Slaat eerst, praat later.', 'Zoekt altijd ruzie op de strip.', 'Niemand loopt over hem heen.'],
  berekenend: ['Plant elke zet drie dagen vooruit.', 'Handelt liever dan vecht.', 'Kent de prijs van alles.'],
  roekeloos: ['Gokt alles op één kaart.', 'Leeft snel, sterft waarschijnlijk jong.', 'Rem? Wat is een rem.'],
  sociaal: ['Kent iedereen in de onderwereld.', 'Bouwt allianties, geen vijanden.', 'Altijd in voor een deal.'],
  meedogenloos: ['Laat geen getuigen achter.', 'Loyaliteit is voor de zwakken.', 'Klimt over lijken naar de top.'],
};

function makeBotName(rand: () => number, used: Set<string>): string {
  for (let attempt = 0; attempt < 12; attempt++) {
    const first = pick(rand, BOT_FIRST_NAMES);
    const name = rand() < 0.45
      ? `${first} "${pick(rand, BOT_NICKNAMES)}" ${pick(rand, BOT_LAST_NAMES)}`
      : `${first} ${pick(rand, BOT_LAST_NAMES)}`;
    if (!used.has(name)) { used.add(name); return name; }
  }
  const fallback = `${pick(rand, BOT_FIRST_NAMES)} #${used.size}`;
  used.add(fallback);
  return fallback;
}

/** Pick a gear id from a tier list, scaled by level (higher level → deeper into the list). */
function gearForLevel(rand: () => number, tier: readonly string[], level: number): string {
  const maxIdx = Math.min(tier.length - 1, Math.floor((level / 12) + rand() * 1.5));
  return tier[Math.max(0, Math.min(maxIdx, tier.length - 1))];
}

/**
 * Builds the initial local bot population: rich, distinct "players" scaled around the human's
 * level. Deterministic given `seed`.
 */
export function generateWorld(seed: number, playerLevel = 1, gameDay = 1): WorldSimState {
  const rand = mulberry32(seed);
  const usedNames = new Set<string>();

  // --- Gangs first ---
  const gangs: WorldGang[] = [];
  const gangNamePool = [...BOT_GANG_NAMES];
  for (let i = 0; i < DEFAULT_GANG_COUNT && gangNamePool.length > 0; i++) {
    const idx = Math.floor(rand() * gangNamePool.length);
    const [name, tag] = gangNamePool.splice(idx, 1)[0];
    gangs.push({
      id: `wgang_${i}`,
      name,
      tag,
      memberBotIds: [],
      power: randInt(rand, 40, 90),
      controlledDistrict: i < DISTRICT_IDS.length ? DISTRICT_IDS[i] : null,
    });
  }

  // --- Bots ---
  const bots: WorldBot[] = [];
  for (let i = 0; i < DEFAULT_BOT_COUNT; i++) {
    const archetype = pick(rand, ARCHETYPES);
    const personality = pick(rand, PERSONALITIES);
    const spread = rand() < 0.15 ? randInt(rand, 3, 12) : randInt(rand, -3, 4);
    const level = Math.max(1, playerLevel + spread);
    const money = Math.floor((2000 + level * 1800) * jitter(rand, 0.5));

    // Stats scale with level, biased by archetype.
    const base = 1 + Math.floor(level * 0.4);
    const muscle = base + (archetype === 'brawler' || archetype === 'gangster' ? randInt(rand, 2, 6) : randInt(rand, 0, 3));
    const brains = base + (archetype === 'trader' || archetype === 'hustler' ? randInt(rand, 2, 6) : randInt(rand, 0, 3));
    const charm = base + (archetype === 'gambler' ? randInt(rand, 2, 5) : randInt(rand, 0, 3));
    const maxHp = 80 + level * 5 + muscle * 3;

    const inGang = rand() < 0.55 && gangs.length > 0;
    const gang = inGang ? gangs[Math.floor(rand() * gangs.length)] : null;
    const gangRole: BotGangRole | null = gang
      ? (rand() < 0.1 ? 'onderbaas' : 'soldaat')
      : null;

    const bot: WorldBot = {
      id: `bot_${i}`,
      name: makeBotName(rand, usedNames),
      archetype,
      personality,
      bio: pick(rand, BIO_TEMPLATES[personality]),
      backstory: pick(rand, BACKSTORIES),
      joinDay: -randInt(rand, 5, 400), // "joined" days before the player started
      level,
      xp: 0,
      money,
      rep: level * randInt(rand, 8, 20),
      karma: randInt(rand, -60, 60),
      loc: pick(rand, DISTRICT_IDS),
      gangId: gang ? gang.id : null,
      gangRole,
      online: rand() < 0.35,
      activity: 0.15 + rand() * 0.85, // some casual, some hardcore
      lastActionDay: 0,
      stats: { muscle, brains, charm },
      maxHp,
      hp: maxHp,
      combatRating: 1000 + level * randInt(rand, 8, 22) + muscle * 5,
      wins: randInt(rand, 0, level * 3),
      losses: randInt(rand, 0, level * 2),
      killStreak: rand() < 0.2 ? randInt(rand, 1, 6) : 0,
      gear: [
        gearForLevel(rand, WEAPONS, level),
        gearForLevel(rand, ARMORS, level),
        gearForLevel(rand, GADGETS, level),
      ],
      vehicleId: gearForLevel(rand, VEHICLES, level),
      rivalry: 0,
      bountyOnPlayer: 0,
      lastInteractedDay: 0,
    };
    bots.push(bot);
    if (gang) gang.memberBotIds.push(bot.id);
  }

  // Promote the highest-level member of each gang to leader; recompute power from roster.
  for (const gang of gangs) {
    const members = bots.filter(b => b.gangId === gang.id);
    if (members.length > 0) {
      const leader = members.reduce((a, b) => (b.level > a.level ? b : a));
      leader.gangRole = 'leider';
    }
    gang.power = members.reduce((sum, b) => sum + b.level * 2 + b.rep / 10, gang.power * 0.3);
  }

  // Seed a handful of live auctions so the auction house feels active from day one.
  const auctionPool = [
    { type: 'weapon', id: 'sniper', name: 'Dragunov Sniper' },
    { type: 'armor', id: 'skull_armor', name: 'Skull Plate Armor' },
    { type: 'vehicle', id: 'lupoghini', name: 'Lupo-Ghini Strike' },
    { type: 'gadget', id: 'quantum_deck', name: 'Quantum Deck' },
    { type: 'weapon', id: 'obsidian_edge', name: 'Obsidian Edge' },
  ];
  const auctions = [];
  const auctionCount = 3 + Math.floor(rand() * 2);
  for (let i = 0; i < auctionCount && bots.length > 0; i++) {
    const seller = pick(rand, bots);
    const item = auctionPool[i % auctionPool.length];
    const startingPrice = randInt(rand, 8000, 60000);
    const hasEarlyBid = rand() < 0.5;
    const earlyBidder = hasEarlyBid ? pick(rand, bots) : null;
    auctions.push({
      id: `auc_seed_${i}_${Math.floor(rand() * 1e6)}`,
      sellerBotId: seller.id,
      sellerName: seller.name,
      itemType: item.type,
      itemId: item.id,
      itemName: item.name,
      startingPrice,
      currentBid: hasEarlyBid ? Math.floor(startingPrice * (1.1 + rand() * 0.3)) : startingPrice,
      topBidderId: earlyBidder ? earlyBidder.id : null,
      topBidderName: earlyBidder ? earlyBidder.name : null,
      bidCount: hasEarlyBid ? randInt(rand, 1, 5) : 0,
      endsDay: gameDay + randInt(rand, 1, 3),
      status: 'active' as const,
    });
  }

  return {
    seed,
    bots,
    gangs,
    feed: [],
    listings: [],
    wars: [],
    auctions,
    factionControl: { cartel: null, syndicate: null, bikers: null },
    lastSimAt: new Date().toISOString(),
    version: WORLD_SIM_VERSION,
  };
}
