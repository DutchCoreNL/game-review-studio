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

export interface OrgMember {
  id: string;
  name: string;
  role: OrgRole;
  level: number;
  loyalty: number; // 0-100
}

export interface PlayerOrg {
  name: string;
  tag: string;
  members: OrgMember[];
  controlledDistricts: DistrictId[];
  respect: number;
  upgrades: string[];
  foundedDay: number;
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
  return ORG_MAX_MEMBERS_BASE + ownedUpgrades(org).reduce((s, u) => s + (u.maxMembers || 0), 0);
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
  return districts + ownedUpgrades(org).reduce((s, u) => s + (u.incomeBonus || 0), 0);
}

export function orgDailyLoyaltyRegen(org: PlayerOrg): number {
  // Upgrade regen plus "territory pride": every district you hold keeps morale up.
  return ownedUpgrades(org).reduce((s, u) => s + (u.loyaltyRegen || 0), 0) + org.controlledDistricts.length;
}

/** Passive reputation the organization earns per day from the turf it controls. */
export function orgDailyRep(org: PlayerOrg): number {
  return org.controlledDistricts.length * 6;
}

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
