import type { DistrictId } from './types';
import type { PlayerOrg, OrgMember } from './organization';

/**
 * RACKETS — the operations your crew runs across Noxhaven.
 *
 * A racket is a *place*, not an abstract slider: "Containersmokkel" happens in
 * Port Nero, which is El Serpiente's harbour, and running it there makes the Rojo
 * Cartel notice you. That is the whole game in one sentence — richer turf pays
 * better, but every euro you take out of someone's district buys their attention,
 * and attention becomes an Incident you must answer (see src/game/incidents.ts).
 *
 * Crew are not interchangeable: each has a trait that makes them shine at some
 * work and stumble at other work, so who you put where is a real decision.
 */

// ========== CREW TRAITS ==========

export type CrewTraitId = 'meedogenloos' | 'straatslim' | 'gladjanus' | 'spook' | 'roekeloos';

export interface CrewTraitDef {
  id: CrewTraitId;
  name: string;
  icon: string;
  desc: string;
  /** Racket kinds this crew member excels at (x1.35 output). */
  strong: RacketKind[];
  /** Racket kinds they are poor at (x0.7 output). */
  weak: RacketKind[];
  /** Multiplier on the rival attention their work draws (a Spook draws less). */
  attentionMult: number;
}

export const CREW_TRAITS: CrewTraitDef[] = [
  { id: 'meedogenloos', name: 'Meedogenloos', icon: '🔪', desc: 'Bang maken is zijn vak. Sterk in afpersing, slecht in stille zaken.',
    strong: ['macht'], weak: ['schoon'], attentionMult: 1.25 },
  { id: 'straatslim', name: 'Straatslim', icon: '🎯', desc: 'Kent elke steeg en elke koerier. Sterk in straatwerk.',
    strong: ['geld'], weak: [], attentionMult: 1 },
  { id: 'gladjanus', name: 'Gladjanus', icon: '🎩', desc: 'Praat zich overal in en uit. Sterk in fraude en chantage.',
    strong: ['schoon', 'macht'], weak: [], attentionMult: 0.9 },
  { id: 'spook', name: 'Spook', icon: '👻', desc: 'Niemand ziet hem komen. Trekt nauwelijks aandacht.',
    strong: ['schoon'], weak: ['macht'], attentionMult: 0.5 },
  { id: 'roekeloos', name: 'Roekeloos', icon: '💥', desc: 'Levert veel op, maar maakt herrie. Veel aandacht.',
    strong: ['geld', 'macht'], weak: ['schoon'], attentionMult: 1.8 },
];

export const TRAIT_BY_ID: Record<CrewTraitId, CrewTraitDef> =
  CREW_TRAITS.reduce((a, t) => { a[t.id] = t; return a; }, {} as Record<CrewTraitId, CrewTraitDef>);

export function rollTrait(rand: () => number = Math.random): CrewTraitId {
  return CREW_TRAITS[Math.floor(rand() * CREW_TRAITS.length)].id;
}

// ========== RACKETS ==========

/** What a racket produces: cash, standing, or heat-cleaning. */
export type RacketKind = 'geld' | 'macht' | 'schoon';

export interface RacketDef {
  id: string;
  district: DistrictId;
  name: string;
  flavor: string;
  icon: string;
  kind: RacketKind;
  /** Cash per assigned member per day (before trait/loyalty scaling). */
  income: number;
  /** Organisation respect per member per day. */
  respect: number;
  /** Police heat per member per day (negative = launders heat away). */
  heat: number;
  /** Rival attention added in this district per member per day. */
  attention: number;
  /** Organisation respect needed before this racket unlocks. */
  minRespect: number;
}

/**
 * Twelve rackets across the five districts. Poor turf is safe and cheap to work;
 * the rich districts pay far better but belong to somebody who will notice.
 */
export const RACKETS: RacketDef[] = [
  // ---- Lowrise: your home turf, nobody's family owns it ----
  { id: 'low_protection', district: 'low', name: 'Beschermingsgeld', icon: '🪟', kind: 'macht',
    flavor: 'Winkeliers in Lowrise betalen liever jou dan de volgende die langskomt.',
    income: 900, respect: 2, heat: 1, attention: 1, minRespect: 0 },
  { id: 'low_runners', district: 'low', name: 'Straatkoeriers', icon: '🏃', kind: 'geld',
    flavor: 'Jonge koeriers die pakjes door de steegjes brengen. Niemand kijkt op.',
    income: 1400, respect: 1, heat: 2, attention: 1, minRespect: 0 },

  // ---- Port Nero: Rojo Cartel territory (El Serpiente) ----
  { id: 'port_docks', district: 'port', name: 'Havenafpersing', icon: '⚓', kind: 'macht',
    flavor: 'Ploegbazen op de kade rekenen af aan het eind van hun shift.',
    income: 2200, respect: 3, heat: 2, attention: 3, minRespect: 20 },
  { id: 'port_smuggle', district: 'port', name: 'Containersmokkel', icon: '📦', kind: 'geld',
    flavor: 'Eén container tussen de duizenden. El Serpiente telt ze allemaal.',
    income: 4200, respect: 2, heat: 4, attention: 6, minRespect: 60 },

  // ---- Iron Borough: Iron Skulls territory (Hammer) ----
  { id: 'iron_chop', district: 'iron', name: 'Chopshop-ring', icon: '🔧', kind: 'geld',
    flavor: 'Auto\'s die om middernacht binnenrijden en om vier uur onderdelen zijn.',
    income: 2600, respect: 2, heat: 3, attention: 3, minRespect: 30 },
  { id: 'iron_guns', district: 'iron', name: 'Wapenlijn', icon: '🔫', kind: 'macht',
    flavor: 'Hammer verkoopt ijzer in Iron Borough. Nu verkoop jij het ook.',
    income: 3800, respect: 5, heat: 6, attention: 7, minRespect: 90 },

  // ---- Neon Strip: no family, but the police watch the lights ----
  { id: 'neon_clubs', district: 'neon', name: 'Clubprotectie', icon: '🎰', kind: 'macht',
    flavor: 'Portiers op de Strip dragen jouw naam. Dat kost de eigenaars wat.',
    income: 3200, respect: 4, heat: 4, attention: 2, minRespect: 50 },
  { id: 'neon_launder', district: 'neon', name: 'Witwasserij', icon: '🧼', kind: 'schoon',
    flavor: 'Zwart geld gaat de casino\'s in en komt er schoon weer uit.',
    income: 0, respect: 0, heat: -7, attention: 1, minRespect: 25 },

  // ---- Crown Heights: Blue Lotus territory (Mr. Wu), the richest turf ----
  { id: 'crown_blackmail', district: 'crown', name: 'Chantage', icon: '📸', kind: 'macht',
    flavor: 'Iedereen in Crown Heights heeft iets te verbergen. Jij bewaart de foto\'s.',
    income: 3000, respect: 8, heat: 3, attention: 5, minRespect: 120 },
  { id: 'crown_fraud', district: 'crown', name: 'Witteboordenfraude', icon: '💼', kind: 'schoon',
    flavor: 'Papieren bedrijven, echte miljoenen. Mr. Wu doet precies hetzelfde.',
    income: 6500, respect: 4, heat: 2, attention: 8, minRespect: 200 },
  { id: 'crown_fixer', district: 'crown', name: 'Advocatenkantoor', icon: '⚖️', kind: 'schoon',
    flavor: 'Een kantoor op de 40e verdieping dat dossiers laat verdwijnen.',
    income: 0, respect: 2, heat: -12, attention: 3, minRespect: 160 },
];

export const RACKET_BY_ID: Record<string, RacketDef> =
  RACKETS.reduce((a, r) => { a[r.id] = r; return a; }, {} as Record<string, RacketDef>);

/** Which family, if any, considers this district theirs. */
export const DISTRICT_OWNER: Partial<Record<DistrictId, string>> = {
  port: 'cartel',
  crown: 'syndicate',
  iron: 'bikers',
};

export function racketsInDistrict(district: DistrictId): RacketDef[] {
  return RACKETS.filter(r => r.district === district);
}

/** Rackets the organisation has earned the standing to run. */
export function unlockedRackets(org: PlayerOrg | null | undefined): RacketDef[] {
  const respect = org?.respect || 0;
  return RACKETS.filter(r => respect >= r.minRespect);
}

export function isRacketUnlocked(org: PlayerOrg | null | undefined, racketId: string): boolean {
  const def = RACKET_BY_ID[racketId];
  return !!def && (org?.respect || 0) >= def.minRespect;
}

// ========== OUTPUT MATH ==========

/** A sulking crew member half-asses the job; a loyal one gives everything. */
function effort(m: OrgMember): number {
  return 0.4 + (Math.max(0, Math.min(100, m.loyalty)) / 100) * 0.6;
}

/** Trait fit for a racket: 1.35 when it plays to their strength, 0.7 against it. */
export function traitFit(m: OrgMember, kind: RacketKind): number {
  const t = m.trait ? TRAIT_BY_ID[m.trait] : null;
  if (!t) return 1;
  if (t.strong.includes(kind)) return 1.35;
  if (t.weak.includes(kind)) return 0.7;
  return 1;
}

/** How much cash this member pulls in per day on their current racket. */
export function memberIncome(m: OrgMember, def: RacketDef): number {
  if (def.income <= 0) return 0;
  const skill = 0.7 + m.level * 0.05;
  return Math.round(def.income * skill * effort(m) * traitFit(m, def.kind));
}

/** Heat this member generates (or launders away, when negative) per day. */
export function memberHeat(m: OrgMember, def: RacketDef): number {
  if (def.heat < 0) return -Math.round(Math.abs(def.heat) * effort(m) * traitFit(m, def.kind));
  return Math.round(def.heat * (m.trait ? TRAIT_BY_ID[m.trait].attentionMult : 1) * 0.6 + def.heat * 0.4);
}

/** Rival attention this member draws in the racket's district per day. */
export function memberAttention(m: OrgMember, def: RacketDef): number {
  const mult = m.trait ? TRAIT_BY_ID[m.trait].attentionMult : 1;
  return Math.max(0, Math.round(def.attention * mult));
}

export function memberRespect(m: OrgMember, def: RacketDef): number {
  return Math.round(def.respect * effort(m));
}

export interface RacketTickResult {
  money: number;
  heat: number;
  respect: number;
  loyaltyRegen: number;
  /** Rival attention added, per district. */
  attention: Partial<Record<DistrictId, number>>;
  /** Members working, by racket id. */
  counts: Record<string, number>;
  activeCount: number;
  restingCount: number;
  notes: string[];
}

export function emptyTick(): RacketTickResult {
  return { money: 0, heat: 0, respect: 0, loyaltyRegen: 0, attention: {}, counts: {}, activeCount: 0, restingCount: 0, notes: [] };
}

/** Members with no racket — they rest, and slowly recover loyalty. */
export function restingMembers(org: PlayerOrg | null | undefined): OrgMember[] {
  return org ? org.members.filter(m => !m.assignment) : [];
}

export function racketMemberCount(org: PlayerOrg | null | undefined, racketId: string): number {
  return org ? org.members.filter(m => m.assignment === racketId).length : 0;
}

export function membersOnRacket(org: PlayerOrg | null | undefined, racketId: string): OrgMember[] {
  return org ? org.members.filter(m => m.assignment === racketId) : [];
}

export const REST_LOYALTY_REGEN = 5;

/**
 * Resolves one day of every racket. Pure: returns the deltas for the caller to
 * apply. Members on a racket produce and draw attention in that district; members
 * left resting recover loyalty instead.
 */
export function resolveRacketTick(org: PlayerOrg | null | undefined): RacketTickResult {
  const out = emptyTick();
  if (!org || org.members.length === 0) return out;

  for (const m of org.members) {
    const def = m.assignment ? RACKET_BY_ID[m.assignment] : null;
    // Unassigned, or assigned to a racket they no longer have the standing for.
    if (!def || org.respect < def.minRespect) {
      out.restingCount++;
      continue;
    }
    out.activeCount++;
    out.counts[def.id] = (out.counts[def.id] || 0) + 1;
    out.money += memberIncome(m, def);
    out.respect += memberRespect(m, def);
    out.heat += memberHeat(m, def);
    const att = memberAttention(m, def);
    if (att > 0) out.attention[def.district] = (out.attention[def.district] || 0) + att;
  }

  out.loyaltyRegen = out.restingCount > 0 ? REST_LOYALTY_REGEN : 0;

  if (out.money > 0) out.notes.push(`Je rackets brachten €${out.money.toLocaleString()} op`);
  if (out.heat < 0) out.notes.push(`Witwassen koelde ${Math.abs(out.heat)} hitte af`);
  if (out.respect > 0) out.notes.push(`Je naam groeide met ${out.respect} aanzien`);

  return out;
}
