import type { DistrictId, GameState, GoodId } from './types';
import { RACKET_BY_ID } from './rackets';
import { equipTapBonus, equipCrewMultiplier, equipStashBonus } from './equipment';
import { BASE_STASH_SLOTS } from './engine';

/**
 * DE KLUS — the hands-on core of the game.
 *
 * Everything else in this game is delegation: you place crew and time passes.
 * This is the part you actually *do*. A job runs in a district — a warehouse, a
 * courier route, a penthouse — and it has a progress bar. Your crew in that
 * district chip away at it every second, and you can put your own hands on it by
 * tapping, which is meaningfully faster early on. When the bar fills you get a
 * loot burst: real contraband into your stash plus dirty cash.
 *
 * That loot is not an abstract number. It lands in `state.inventory` — the same
 * goods the market trades — so the chain is: work a job -> hold contraband ->
 * fence or sell it -> launder the dirty money -> buy crew and upgrades -> work
 * richer districts. Progress is gated by crew strength, not by a wall of text.
 */

export interface ScoreJob {
  id: string;
  district: DistrictId;
  name: string;
  flavor: string;
  /** Work units needed to finish. */
  required: number;
  /** Work units done so far. */
  progress: number;
  /** Which contraband this job can drop. */
  loot: GoodId[];
  /** Dirty cash paid out on completion. */
  payout: number;
  /** Difficulty band, drives payout and loot quality. */
  tier: number;
  /** What you are physically working on, so the scene can draw it. */
  target: TargetKind;
}

/**
 * The thing under your hands. A bar filling up is a number; a container door that
 * cracks, pops its rivets and swings open is a job. Each kind is drawn in
 * src/components/game/score/JobTarget.tsx and reacts to progress and to every tap.
 */
export type TargetKind = 'container' | 'safe' | 'crate' | 'case' | 'door' | 'bag';

interface JobTemplate {
  name: string;
  flavor: string;
  loot: GoodId[];
  target: TargetKind;
}

/** Jobs are district-flavoured so the fiction stays local. */
const JOB_TEMPLATES: Record<string, JobTemplate[]> = {
  low: [
    { name: 'Steegdeal', flavor: 'Een overdracht achter de flats. Snel, smerig, betaalt slecht.', loot: ['drugs', 'meds'], target: 'bag' },
    { name: 'Uitgebrande garage', flavor: 'Er staat nog een kluis achterin die niemand is komen halen.', loot: ['meds', 'electronics'], target: 'safe' },
    { name: 'Koeriersroute', flavor: 'Drie adressen, één tas. Niet vragen wat erin zit.', loot: ['drugs', 'chemicals'], target: 'bag' },
  ],
  port: [
    { name: 'Magazijn aan de kade', flavor: 'Loods 12 staat een uur zonder bewaking. Eén uur.', loot: ['chemicals', 'electronics', 'drugs'], target: 'door' },
    { name: 'Container 4471', flavor: 'De papieren kloppen niet. Precies daarom is hij interessant.', loot: ['weapons', 'chemicals'], target: 'container' },
    { name: 'Nachtploeg omkopen', flavor: 'De kraanmachinist kijkt de andere kant op voor het juiste bedrag.', loot: ['electronics', 'drugs'], target: 'crate' },
  ],
  iron: [
    { name: 'Chopshop-inval', flavor: 'Twee wagens strippen voor Hammers jongens terugkomen.', loot: ['electronics', 'weapons'], target: 'door' },
    { name: 'Wapendepot', flavor: 'Achter de bandenzaak ligt meer dan rubber.', loot: ['weapons', 'explosives'], target: 'crate' },
    { name: 'Fabriekskluis', flavor: 'Het weekloon van driehonderd man, in één kast.', loot: ['electronics', 'meds'], target: 'safe' },
  ],
  neon: [
    { name: 'Kluis van de club', flavor: 'De avondopbrengst van de Strip, voordat de boekhouder komt.', loot: ['luxury', 'drugs'], target: 'safe' },
    { name: 'Kaartentafel', flavor: 'Een privéspel op de bovenverdieping met te veel contant geld.', loot: ['luxury', 'crypto'], target: 'bag' },
    { name: 'Datakoffer', flavor: 'Iemand heeft de gastenlijst van de VIP-ruimte gekopieerd.', loot: ['tech', 'crypto'], target: 'case' },
  ],
  crown: [
    { name: 'Penthouse-inbraak', flavor: 'De eigenaar is drie weken in het buitenland. Zijn kunst niet.', loot: ['luxury', 'crypto'], target: 'door' },
    { name: 'Serverruimte', flavor: 'Veertigste verdieping. Alles wat daar staat is geld waard.', loot: ['tech', 'crypto'], target: 'case' },
    { name: 'Kunstveiling', flavor: 'Wat na afloop de achterdeur uit gaat, staat op geen enkele lijst.', loot: ['luxury', 'tech'], target: 'crate' },
  ],
};

/** How hard the jobs in each district are — and therefore how well they pay. */
const DISTRICT_TIER: Record<string, number> = { low: 1, port: 2, iron: 3, neon: 4, crown: 5 };

/** Crew strength needed before a district's jobs are workable at all. */
export const DISTRICT_CREW_REQUIREMENT: Record<string, number> = {
  low: 0, port: 2, iron: 4, neon: 6, crown: 9,
};

/** Your crew's effective strength for gating: members weighted by loyalty. */
export function crewStrength(state: GameState): number {
  const members = state.org?.members || [];
  return members.reduce((s, m) => s + (m.injuredUntilDay ? 0 : 0.5 + m.loyalty / 100), 0);
}

export function districtUnlocked(state: GameState, district: DistrictId): boolean {
  return crewStrength(state) >= (DISTRICT_CREW_REQUIREMENT[district] ?? 0);
}

let jobCounter = 0;

/** Rolls the next job for a district. Later jobs in a run get gradually longer. */
export function makeJob(district: DistrictId, streak = 0, rand: () => number = Math.random): ScoreJob {
  const pool = JOB_TEMPLATES[district] || JOB_TEMPLATES.low;
  const tpl = pool[Math.floor(rand() * pool.length)];
  const tier = DISTRICT_TIER[district] || 1;
  const required = Math.round((18 + tier * 14) * (1 + streak * 0.06));
  return {
    id: `job_${Date.now()}_${jobCounter++}`,
    district,
    name: tpl.name,
    flavor: tpl.flavor,
    required,
    progress: 0,
    loot: tpl.loot,
    payout: Math.round((450 + tier * 900) * (0.8 + rand() * 0.5)),
    tier,
    target: tpl.target,
  };
}

/**
 * Work a single tap adds. Three things feed it: the levels you earn by working,
 * the Kracht you put your stat points into, and the tools you buy.
 */
export function tapPower(state: GameState): number {
  const muscle = state.player?.stats?.muscle || 0;
  return 1 + Math.floor((state.player?.level || 1) / 4) + Math.floor(muscle / 2) + equipTapBonus(state);
}

/** Total contraband your stash holds, base capacity plus storage upgrades. */
export function stashCapacity(state: GameState): number {
  return (state.maxInv || BASE_STASH_SLOTS) + equipStashBonus(state);
}

/**
 * Work your crew contributes per second in a district. Only members actually
 * assigned to a racket there pitch in, scaled by loyalty — an unhappy crew is slow.
 */
export function crewWorkPerSecond(state: GameState, district: DistrictId): number {
  const members = state.org?.members || [];
  let work = 0;
  for (const m of members) {
    if (!m.assignment || m.injuredUntilDay) continue;
    const def = RACKET_BY_ID[m.assignment];
    if (!def || def.district !== district) continue;
    work += 0.25 + (m.loyalty / 100) * 0.45;
  }
  // Charisma keeps the crew keen, so they put more in per second.
  const charm = state.player?.stats?.charm || 0;
  return work * equipCrewMultiplier(state) * (1 + charm * 0.02);
}

export interface JobReward {
  goods: Partial<Record<GoodId, number>>;
  dirtyMoney: number;
  /** Goods that could not be stored and were fenced on the spot. */
  overflowMoney: number;
  lines: string[];
}

/**
 * Rolls the loot for a finished job. Richer districts drop more and better.
 * Anything that will not fit in your stash is fenced immediately for dirty cash
 * rather than silently lost.
 */
export function rollJobReward(
  state: GameState,
  job: ScoreJob,
  rand: () => number = Math.random,
): JobReward {
  const goods: Partial<Record<GoodId, number>> = {};
  const lines: string[] = [];
  const drops = 1 + Math.floor(rand() * 2) + Math.floor(job.tier / 2);

  const held = Object.values(state.inventory || {}).reduce((a: number, b) => a + (Number(b) || 0), 0);
  const capacity = Math.max(0, stashCapacity(state) - held);
  let stored = 0;
  let overflowUnits = 0;

  for (let i = 0; i < drops; i++) {
    const gid = job.loot[Math.floor(rand() * job.loot.length)];
    const qty = 1 + Math.floor(rand() * job.tier);
    const room = Math.max(0, capacity - stored);
    const fits = Math.min(qty, room);
    if (fits > 0) {
      goods[gid] = (goods[gid] || 0) + fits;
      stored += fits;
    }
    overflowUnits += qty - fits;
  }

  const dirtyMoney = job.payout;
  const overflowMoney = overflowUnits * 120 * job.tier;

  for (const [gid, qty] of Object.entries(goods)) lines.push(`+${qty} ${gid}`);
  if (overflowUnits > 0) lines.push(`${overflowUnits} stuks direct doorverkocht (voorraad vol)`);

  return { goods, dirtyMoney, overflowMoney, lines };
}
