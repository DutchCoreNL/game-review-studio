import type { DistrictId } from '../types';
import type { WorldBot, WorldGang, WorldSimState, BotArchetype } from './types';
import { WORLD_SIM_VERSION } from './types';
import { mulberry32, pick, randInt, jitter } from './rng';
import { BOT_FIRST_NAMES, BOT_NICKNAMES, BOT_LAST_NAMES, BOT_GANG_NAMES } from './botNames';

const DISTRICT_IDS: DistrictId[] = ['port', 'crown', 'iron', 'low', 'neon'];
const ARCHETYPES: BotArchetype[] = ['trader', 'brawler', 'gambler', 'gangster', 'hustler'];

const DEFAULT_BOT_COUNT = 110;
const DEFAULT_GANG_COUNT = 8;

function makeBotName(rand: () => number, used: Set<string>): string {
  for (let attempt = 0; attempt < 12; attempt++) {
    const first = pick(rand, BOT_FIRST_NAMES);
    // 45% chance of a "First 'Nick' Last" handle, otherwise "First Last"
    const name = rand() < 0.45
      ? `${first} "${pick(rand, BOT_NICKNAMES)}" ${pick(rand, BOT_LAST_NAMES)}`
      : `${first} ${pick(rand, BOT_LAST_NAMES)}`;
    if (!used.has(name)) { used.add(name); return name; }
  }
  // Fallback guarantees uniqueness
  const fallback = `${pick(rand, BOT_FIRST_NAMES)} #${used.size}`;
  used.add(fallback);
  return fallback;
}

/**
 * Builds the initial local bot population, scaled loosely around the player's starting level.
 * Deterministic given `seed` so the same save always regenerates the same world if needed.
 */
export function generateWorld(seed: number, playerLevel = 1): WorldSimState {
  const rand = mulberry32(seed);
  const usedNames = new Set<string>();

  // --- Gangs first, so bots can be assigned membership ---
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
    // Spread levels around the player: mostly near, a few well above (aspirational rivals).
    const spread = rand() < 0.15 ? randInt(rand, 3, 12) : randInt(rand, -3, 4);
    const level = Math.max(1, playerLevel + spread);
    const money = Math.floor((2000 + level * 1800) * jitter(rand, 0.5));
    const inGang = rand() < 0.55 && gangs.length > 0;
    const gang = inGang ? gangs[Math.floor(rand() * gangs.length)] : null;
    const bot: WorldBot = {
      id: `bot_${i}`,
      name: makeBotName(rand, usedNames),
      archetype,
      level,
      xp: 0,
      money,
      rep: level * randInt(rand, 8, 20),
      loc: pick(rand, DISTRICT_IDS),
      gangId: gang ? gang.id : null,
      online: rand() < 0.35,
      lastActionDay: 0,
    };
    bots.push(bot);
    if (gang) gang.memberBotIds.push(bot.id);
  }

  // Recompute gang power from members so it reflects the actual roster.
  for (const gang of gangs) {
    const members = bots.filter(b => b.gangId === gang.id);
    gang.power = members.reduce((sum, b) => sum + b.level * 2 + b.rep / 10, gang.power * 0.3);
  }

  return {
    seed,
    bots,
    gangs,
    feed: [],
    listings: [],
    wars: [],
    factionControl: { cartel: null, syndicate: null, bikers: null },
    lastSimAt: new Date().toISOString(),
    version: WORLD_SIM_VERSION,
  };
}
