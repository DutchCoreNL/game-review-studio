import type { DistrictId } from './types';

/**
 * Player-run criminal Organization — a local, single-player system.
 *
 * You found your own outfit, recruit soldiers, pay their upkeep, buy upgrades,
 * and seize districts from the bot-world gangs. Everything resolves locally
 * against the living bot world (see src/game/world). This replaces the old
 * server-backed P2P "gang" screen, which had no data offline.
 */

export type OrgRole = 'soldaat' | 'luitenant' | 'onderbaas';

/**
 * The idle "posture" a crew member holds. Each member you assign to a racket
 * contributes to that racket's output every world tick, so the empire runs itself
 * (see src/game/rackets.ts). `null`/undefined means the member is idle (reserve).
 */
export type RacketId = 'afpersing' | 'territorium' | 'witwassen' | 'werving';

export interface OrgMember {
  id: string;
  name: string;
  role: OrgRole;
  level: number;
  loyalty: number; // 0-100
  assignment?: RacketId | null; // which racket this member runs each tick
}

export type OrgRelation = 'ally' | 'enemy';

export interface PlayerOrg {
  name: string;
  tag: string;
  members: OrgMember[];
  controlledDistricts: DistrictId[];
  respect: number;
  upgrades: string[];
  foundedDay: number;
  opCooldownUntil?: string | null; // ISO — cooldown between crew operations
  relations?: Record<string, OrgRelation>; // world gang id -> pact/vendetta
}

export const ORG_PACT_COST = 20000;
export const ORG_PACT_MIN_RESPECT = 30;

/** Combat power your allies lend to an attack or defense (a share of their strength). */
export function orgAllySupport(allyPowers: number[]): number {
  return Math.floor(allyPowers.reduce((s, p) => s + p, 0) * 0.25);
}

/** Your organisation's stance toward a world gang: ally, enemy, or neutral. */
export function orgRelation(org: PlayerOrg | null | undefined, gangId: string): OrgRelation | 'neutral' {
  return org?.relations?.[gangId] ?? 'neutral';
}

/** A job you can send your crew on for money/rep, scaled by organisation power. */
export interface OrgOperation {
  id: string;
  name: string;
  desc: string;
  minPower: number;    // power at which success is comfortable
  minRespect: number;  // organisation respect required to unlock
  energyCost: number;
  baseReward: number;  // base money on success
  repReward: number;
  risk: number;        // extra loyalty damage / injury chance on failure (0..1)
}

export const ORG_OPERATIONS: OrgOperation[] = [
  { id: 'protection', name: 'Beschermingsgeld innen', desc: 'Laag risico. Vaste opbrengst uit de buurt.', minPower: 0, minRespect: 0, energyCost: 8, baseReward: 4000, repReward: 5, risk: 0.1 },
  { id: 'transport', name: 'Transport overvallen', desc: 'Gemiddeld risico. Goede buit.', minPower: 45, minRespect: 40, energyCost: 15, baseReward: 12000, repReward: 15, risk: 0.25 },
  { id: 'takeover', name: 'Vijandige overname', desc: 'Hoog risico. Grote buit en aanzien.', minPower: 100, minRespect: 120, energyCost: 25, baseReward: 28000, repReward: 35, risk: 0.4 },
];

/** Organisation rank, earned with respect. Higher ranks add roster slots + a perk. */
export interface OrgRank {
  id: string;
  name: string;
  minRespect: number;
  bonusMemberSlots: number;
  perk: string; // short description of this rank's cumulative bonus
}

export const ORG_RANKS: OrgRank[] = [
  { id: 'bende', name: 'Straatbende', minRespect: 0, bonusMemberSlots: 0, perk: 'Basis' },
  { id: 'crew', name: 'Crew', minRespect: 40, bonusMemberSlots: 2, perk: '−25% pactkosten' },
  { id: 'syndicaat', name: 'Syndicaat', minRespect: 120, bonusMemberSlots: 4, perk: '+€2.000 dagelijks inkomen' },
  { id: 'kartel', name: 'Kartel', minRespect: 300, bonusMemberSlots: 6, perk: '+20% operatie-buit' },
  { id: 'imperium', name: 'Imperium', minRespect: 700, bonusMemberSlots: 8, perk: '+10% thuisvoordeel bij verdediging' },
];

/** Index of the org's current rank within ORG_RANKS. */
export function orgRankIndex(org: PlayerOrg): number {
  let idx = 0;
  ORG_RANKS.forEach((r, i) => { if (org.respect >= r.minRespect) idx = i; });
  return idx;
}

/** The org's current rank based on accumulated respect. */
export function orgRank(org: PlayerOrg): OrgRank {
  return ORG_RANKS[orgRankIndex(org)];
}

/** The next rank the org can reach, or null at max rank. */
export function nextOrgRank(org: PlayerOrg): OrgRank | null {
  return ORG_RANKS.find(r => r.minRespect > org.respect) || null;
}

/** The cumulative rank perks the org has unlocked (all ranks up to the current). */
export function unlockedRankPerks(org: PlayerOrg): string[] {
  return ORG_RANKS.slice(1, orgRankIndex(org) + 1).map(r => r.perk);
}

// ---- Rank effect helpers (each gated by reaching the relevant rank) ----

/** Pact cost after the Crew rank discount. */
export function orgPactCost(org: PlayerOrg): number {
  return Math.round(ORG_PACT_COST * (orgRankIndex(org) >= 1 ? 0.75 : 1));
}

/** Flat daily income bonus from the Syndicaat rank. */
export function orgRankIncomeBonus(org: PlayerOrg): number {
  return orgRankIndex(org) >= 2 ? 2000 : 0;
}

/** Operation payout multiplier from the Kartel rank. */
export function orgOperationRewardMult(org: PlayerOrg): number {
  return orgRankIndex(org) >= 3 ? 1.2 : 1;
}

/** Home-defense multiplier (applied to org power when a gang attacks your turf). */
export function orgDefenseAdvantage(org: PlayerOrg): number {
  return orgRankIndex(org) >= 4 ? 1.3 : 1.2;
}

export const ORG_OP_COOLDOWN_MS = 120000; // 2 minutes between operations

/** Success chance for an operation given the organisation's power. */
export function orgOperationSuccessChance(orgPow: number, op: OrgOperation): number {
  return Math.max(0.1, Math.min(0.95, 0.45 + (orgPow - op.minPower) / 220));
}

export interface OrgUpgradeDef {
  id: string;
  name: string;
  desc: string;
  cost: number;
  incomeBonus?: number;    // flat daily income
  powerBonus?: number;     // flat organisation power
  upkeepReduction?: number; // fraction 0..1
  loyaltyRegen?: number;   // daily loyalty regen for all members
  maxMembers?: number;     // extra roster slots
}

export const ORG_FOUND_COST = 25000;
export const ORG_FOUND_MIN_REP = 40;
export const ORG_MAX_MEMBERS_BASE = 6;
export const ORG_DISTRICT_INCOME = 2500; // per controlled district per day

export const ORG_UPGRADES: OrgUpgradeDef[] = [
  { id: 'safehouse_net', name: 'Safehouse Netwerk', desc: '+€1.500 dagelijks inkomen', cost: 40000, incomeBonus: 1500 },
  { id: 'arsenal', name: 'Wapenarsenaal', desc: '+30 organisatiekracht', cost: 60000, powerBonus: 30 },
  { id: 'payroll', name: 'Vaste Loonlijst', desc: '-30% dagelijkse kosten', cost: 50000, upkeepReduction: 0.3 },
  { id: 'code', name: 'Erecode', desc: '+4 loyaliteit per dag', cost: 35000, loyaltyRegen: 4 },
  { id: 'capos', name: "Capo's", desc: '+3 ledenslots', cost: 80000, maxMembers: 3 },
];

const ROLE_MULT: Record<OrgRole, number> = { soldaat: 1, luitenant: 1.6, onderbaas: 2.4 };
export const ROLE_LABEL: Record<OrgRole, string> = { soldaat: 'Soldaat', luitenant: 'Luitenant', onderbaas: 'Onderbaas' };
const ROLE_ORDER: OrgRole[] = ['soldaat', 'luitenant', 'onderbaas'];

export function nextRole(role: OrgRole): OrgRole | null {
  const i = ROLE_ORDER.indexOf(role);
  return i >= 0 && i < ROLE_ORDER.length - 1 ? ROLE_ORDER[i + 1] : null;
}

function ownedUpgrades(org: PlayerOrg): OrgUpgradeDef[] {
  return ORG_UPGRADES.filter(u => org.upgrades.includes(u.id));
}

export function memberPower(m: OrgMember): number {
  return Math.round(m.level * 3 * ROLE_MULT[m.role] * (0.5 + m.loyalty / 200));
}

export function memberUpkeep(m: OrgMember): number {
  return Math.round(m.level * 120 * ROLE_MULT[m.role]);
}

export function orgMaxMembers(org: PlayerOrg): number {
  return ORG_MAX_MEMBERS_BASE
    + ownedUpgrades(org).reduce((s, u) => s + (u.maxMembers || 0), 0)
    + orgRank(org).bonusMemberSlots;
}

export function orgPower(org: PlayerOrg): number {
  const base = org.members.reduce((s, m) => s + memberPower(m), 0);
  return base + ownedUpgrades(org).reduce((s, u) => s + (u.powerBonus || 0), 0);
}

export function orgDailyUpkeep(org: PlayerOrg): number {
  const raw = org.members.reduce((s, m) => s + memberUpkeep(m), 0);
  const reduction = ownedUpgrades(org).reduce((max, u) => Math.max(max, u.upkeepReduction || 0), 0);
  return Math.round(raw * (1 - reduction));
}

export function orgDailyIncome(org: PlayerOrg): number {
  const districts = org.controlledDistricts.length * ORG_DISTRICT_INCOME;
  return districts + ownedUpgrades(org).reduce((s, u) => s + (u.incomeBonus || 0), 0) + orgRankIncomeBonus(org);
}

export function orgDailyLoyaltyRegen(org: PlayerOrg): number {
  // Upgrade regen plus "territory pride": every district you hold keeps morale up.
  return ownedUpgrades(org).reduce((s, u) => s + (u.loyaltyRegen || 0), 0) + org.controlledDistricts.length;
}

/** Passive reputation the organization earns per day from the turf it controls. */
export function orgDailyRep(org: PlayerOrg): number {
  return org.controlledDistricts.length * 6;
}

/** Whether the player's organization controls a given district (its turf). */
export function orgControlsDistrict(org: PlayerOrg | null | undefined, districtId: string): boolean {
  return !!org && org.controlledDistricts.includes(districtId as DistrictId);
}

/** Trade edge on your own turf: buy this much cheaper, sell this much dearer. */
export const ORG_TURF_BUY_DISCOUNT = 0.12; // -12% buy price
export const ORG_TURF_SELL_BONUS = 0.10;   // +10% sell price

/** Cost to recruit the next member — scales with roster size and the player's level. */
export function recruitCost(org: PlayerOrg, playerLevel: number): number {
  return Math.round(3000 + org.members.length * 1500 + playerLevel * 200);
}

/** Cost to promote a member to the next rank. */
export function promoteCost(m: OrgMember): number {
  const target = nextRole(m.role);
  if (!target) return 0;
  return Math.round(8000 * ROLE_MULT[target] + m.level * 400);
}

let recruitCounter = 0;
export function makeRecruit(name: string, playerLevel: number, rand: () => number = Math.random): OrgMember {
  const level = Math.max(1, playerLevel - 2 + Math.floor(rand() * 5));
  return {
    id: `om_${Date.now()}_${recruitCounter++}`,
    name,
    role: 'soldaat',
    level,
    loyalty: 60 + Math.floor(rand() * 20),
    assignment: 'afpersing', // new crew start earning on the extortion racket
  };
}

/**
 * Resolves an attack on a rival district. `orgPow` is the player org's power,
 * `defencePow` the defending gang's power. Returns win probability-weighted outcome.
 */
export function resolveOrgAttack(orgPow: number, defencePow: number, rand: () => number = Math.random): boolean {
  const total = orgPow + defencePow;
  if (total <= 0) return true;
  // Attacker needs a real edge; add mild variance so upsets happen.
  const chance = Math.max(0.05, Math.min(0.95, (orgPow / total) * 1.1 - 0.1 + (rand() - 0.5) * 0.15));
  return rand() < chance;
}
