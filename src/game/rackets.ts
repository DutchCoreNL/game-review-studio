import type { PlayerOrg, OrgMember, RacketId } from './organization';
import { memberPower } from './organization';

/**
 * RACKETS — the heart of the idle loop.
 *
 * Instead of building generators, you delegate a living crew. Every member you
 * assign to a racket contributes to that racket's output on each world tick, so
 * the empire keeps earning, expanding, cooling down or growing while you are away.
 *
 * The genre-fresh tension is Groei vs. Hitte: the money and territory rackets
 * also raise police heat, while laundering burns it back down. Let heat run away
 * and you get raided (see resolveRaid in the tick handler). You idle-manage the
 * balance by moving crew between rackets — not by clicking a hundred buttons.
 */

export interface RacketDef {
  id: RacketId;
  name: string;
  short: string;      // one-word label for tight UI
  icon: string;
  desc: string;
  /** Accent colour token used by the dashboard. */
  accent: 'gold' | 'blood' | 'emerald' | 'purple';
}

export const RACKETS: RacketDef[] = [
  { id: 'afpersing',  name: 'Afpersing',  short: 'Geld',    icon: '💰', accent: 'gold',
    desc: 'Beschermingsgeld en straatinkomsten. Levert geld op, maar trekt hitte aan.' },
  { id: 'territorium', name: 'Territorium', short: 'Turf',   icon: '🏴', accent: 'blood',
    desc: 'Druk op rivalen om je gebied. Levert aanzien op, maar de meeste hitte.' },
  { id: 'witwassen',  name: 'Witwassen',  short: 'Hitte',   icon: '🧼', accent: 'emerald',
    desc: 'Verdoezel het spoor. Verlaagt de politiehitte per tick.' },
  { id: 'werving',    name: 'Werving',    short: 'Crew',    icon: '🤝', accent: 'purple',
    desc: 'Train en motiveer de crew. Herstelt loyaliteit van de hele organisatie.' },
];

export const RACKET_BY_ID: Record<RacketId, RacketDef> =
  RACKETS.reduce((acc, r) => { acc[r.id] = r; return acc; }, {} as Record<RacketId, RacketDef>);

/** A member only pulls their weight when loyal; a disgruntled member half-asses it. */
function effort(m: OrgMember): number {
  return 0.4 + (m.loyalty / 100) * 0.6; // 0.4 (loyalty 0) .. 1.0 (loyalty 100)
}

/** Money a single member on the extortion racket brings in per tick. */
export function afpersingIncome(m: OrgMember): number {
  return Math.round((memberPower(m) * 55 + m.level * 45) * effort(m));
}

/** Respect a single member on the territory racket earns per tick. */
export function territoriumRespect(m: OrgMember): number {
  return Math.max(1, Math.round((memberPower(m) * 0.12 + 1) * effort(m)));
}

/** Heat a single member on the laundering racket removes per tick. */
export function witwassenCooling(m: OrgMember): number {
  return Math.round((memberPower(m) * 0.18 + 2) * effort(m));
}

export interface RacketTickResult {
  money: number;       // net money earned this tick
  heat: number;        // net heat change (+ raises, - lowers)
  respect: number;     // org respect earned
  loyaltyRegen: number; // flat loyalty added to every member (from the werving racket)
  counts: Record<RacketId, number>; // members on each racket
  notes: string[];     // short human-readable summary lines
}

/** How many members are running a given racket. */
export function racketMemberCount(org: PlayerOrg | null | undefined, id: RacketId): number {
  if (!org) return 0;
  return org.members.filter(m => m.assignment === id).length;
}

/** Members not assigned to any racket (reserve). */
export function idleMembers(org: PlayerOrg | null | undefined): OrgMember[] {
  return org ? org.members.filter(m => !m.assignment) : [];
}

/**
 * Resolves one tick of every racket for the whole organisation. Pure — returns the
 * deltas to apply; the caller mutates game state. Heat model: extortion adds a
 * little heat per active member, territory adds more, laundering subtracts.
 */
export function resolveRacketTick(org: PlayerOrg | null | undefined): RacketTickResult {
  const empty: RacketTickResult = {
    money: 0, heat: 0, respect: 0, loyaltyRegen: 0,
    counts: { afpersing: 0, territorium: 0, witwassen: 0, werving: 0 }, notes: [],
  };
  if (!org || org.members.length === 0) return empty;

  const counts = { afpersing: 0, territorium: 0, witwassen: 0, werving: 0 } as Record<RacketId, number>;
  let money = 0, respect = 0, heatUp = 0, heatDown = 0;

  for (const m of org.members) {
    switch (m.assignment) {
      case 'afpersing':
        counts.afpersing++;
        money += afpersingIncome(m);
        heatUp += 1;
        break;
      case 'territorium':
        counts.territorium++;
        respect += territoriumRespect(m);
        heatUp += 1.6;
        break;
      case 'witwassen':
        counts.witwassen++;
        heatDown += witwassenCooling(m);
        break;
      case 'werving':
        counts.werving++;
        break;
      default:
        break; // idle reserve
    }
  }

  // Each werving member lifts the whole crew's morale a touch per tick.
  const loyaltyRegen = counts.werving * 2;
  const heat = Math.round(heatUp) - Math.round(heatDown);

  const notes: string[] = [];
  if (money > 0) notes.push(`Afpersing bracht €${money.toLocaleString()} op`);
  if (respect > 0) notes.push(`Territorium leverde +${respect} aanzien`);
  if (heatDown > 0) notes.push(`Witwassen koelde ${Math.round(heatDown)} hitte af`);
  if (loyaltyRegen > 0) notes.push(`Werving hief de moraal (+${loyaltyRegen})`);

  return { money, heat, respect, loyaltyRegen, counts, notes };
}
