import type { DistrictId, GameState } from './types';
import type { PlayerOrg } from './organization';
import { orgPower } from './organization';
import { DISTRICT_OWNER, RACKET_BY_ID, racketsInDistrict } from './rackets';
import { policeIncidentChance } from './heat';

/**
 * INCIDENTS — the moment-to-moment gameplay of the idle loop.
 *
 * Rackets generate money, but they also generate *attention*: El Serpiente notices
 * containers going missing in his harbour, the police notice the heat, and a crew
 * that never gets paid notices that too. When pressure crosses a line, an Incident
 * fires and the game stops being a number-watcher: you are handed a situation and
 * must choose, with real costs on every branch.
 *
 * Everything here is pure — templates and outcomes are data, the reducer applies
 * them — so the whole decision layer is unit-testable.
 */

export interface IncidentOutcome {
  /** Cash delta (negative costs you money). */
  money?: number;
  /** Police heat delta. */
  heat?: number;
  /** Organisation respect delta. */
  respect?: number;
  /** Change to the incident district's rival attention. */
  attention?: number;
  /** Loyalty delta applied to every crew member. */
  loyalty?: number;
  /** Chance (0..1) that one working crew member is hurt and sidelined. */
  injureChance?: number;
  /** Power delta applied to the rival gang behind the incident. */
  rivalPower?: number;
  /** Pull every crew member in the district off their racket (they go to ground). */
  pullOutOfDistrict?: boolean;
  /** Result text shown to the player. */
  message: string;
}

export interface IncidentChoice {
  id: string;
  label: string;
  /** Short cost/benefit hint shown under the button. */
  hint: string;
  /** Money required to pick this option at all. */
  costMoney?: number;
  /** When set, the choice is a gamble: success uses `outcome`, failure `failOutcome`. */
  successChance?: number;
  outcome: IncidentOutcome;
  failOutcome?: IncidentOutcome;
}

export type IncidentSeverity = 'laag' | 'gemiddeld' | 'hoog';

export interface ActiveIncident {
  id: string;
  kind: 'rivaal' | 'politie' | 'crew' | 'kans';
  title: string;
  body: string;
  icon: string;
  severity: IncidentSeverity;
  district: DistrictId | null;
  /** Family id behind this, when a rival is involved. */
  factionId?: string;
  day: number;
  choices: IncidentChoice[];
}

/** Attention at which a district's owner comes knocking. */
export const ATTENTION_INCIDENT_THRESHOLD = 55;
/**
 * @deprecated Police pressure is continuous now — see policeIncidentChance in
 * src/game/heat.ts. Kept only because the incident tests reference it as a
 * convenient "clearly hot" value.
 */
export const HEAT_INCIDENT_THRESHOLD = 65;
/** Loyalty below which a crew member starts making trouble. */
export const LOYALTY_TROUBLE_THRESHOLD = 35;

/** Attention bleeds off on its own as the streets forget. */
export const ATTENTION_DECAY_PER_DAY = 4;

const FACTION_FICTION: Record<string, { gang: string; boss: string; verb: string }> = {
  cartel: { gang: 'de Rojo Cartel', boss: 'El Serpiente', verb: 'liet je koeriers onderscheppen' },
  syndicate: { gang: 'de Blue Lotus', boss: 'Mr. Wu', verb: 'stuurde advocaten op je af' },
  bikers: { gang: 'de Iron Skulls', boss: 'Hammer', verb: 'reed je werkplaats binnen' },
};

const DISTRICT_NAME: Record<string, string> = {
  low: 'Lowrise', port: 'Port Nero', iron: 'Iron Borough', neon: 'Neon Strip', crown: 'Crown Heights',
};

function severityFor(value: number, mid: number, high: number): IncidentSeverity {
  return value >= high ? 'hoog' : value >= mid ? 'gemiddeld' : 'laag';
}

/** Total daily income your crew pulls out of one district (used to price payoffs). */
export function districtIncome(org: PlayerOrg | null | undefined, district: DistrictId): number {
  if (!org) return 0;
  const ids = new Set(racketsInDistrict(district).map(r => r.id));
  return org.members.reduce((sum, m) => {
    if (!m.assignment || !ids.has(m.assignment)) return sum;
    return sum + (RACKET_BY_ID[m.assignment]?.income || 0);
  }, 0);
}

// ========== TEMPLATES ==========

/** A rival family reacts to you working their turf. */
function rivalIncident(state: GameState, district: DistrictId, attention: number): ActiveIncident | null {
  const factionId = DISTRICT_OWNER[district];
  if (!factionId) return null;
  const f = FACTION_FICTION[factionId];
  if (!f) return null;

  const org = state.org!;
  const power = orgPower(org);
  const rival = state.world?.gangs?.find(g => g.controlledDistrict === district);
  const rivalPower = rival?.power || 60;
  // Your odds of winning a straight fight over the turf.
  const winChance = Math.max(0.15, Math.min(0.9, power / (power + rivalPower)));
  const payoff = Math.max(6000, Math.round(districtIncome(org, district) * 2.5));
  const dName = DISTRICT_NAME[district] || district;

  return {
    id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    kind: 'rivaal',
    icon: '🩸',
    severity: severityFor(attention, 55, 80),
    district,
    factionId,
    day: state.day,
    title: `${f.boss} heeft je opgemerkt`,
    body: `Je verdient te goed in ${dName}. ${f.gang.charAt(0).toUpperCase() + f.gang.slice(1)} ${f.verb} en laat weten dat dit hun grond is. Wat doe je?`,
    choices: [
      {
        id: 'fight',
        label: 'Terugslaan',
        hint: `${Math.round(winChance * 100)}% kans · je crew loopt risico`,
        successChance: winChance,
        outcome: {
          respect: 25, attention: -45, rivalPower: -15, loyalty: 4,
          message: `Je crew sloeg terug en hield stand. ${f.boss} trekt zich terug uit ${dName} — voorlopig.`,
        },
        failOutcome: {
          respect: -10, attention: -15, loyalty: -12, injureChance: 0.8, money: -Math.round(payoff * 0.4),
          message: `De aanval liep mis. ${f.gang} nam een deel van je voorraad mee en je crew likt zijn wonden.`,
        },
      },
      {
        id: 'pay',
        label: `Afkopen · €${payoff.toLocaleString()}`,
        hint: 'Zeker weten rust, maar het kost je',
        costMoney: payoff,
        outcome: {
          money: -payoff, attention: -60, respect: -4,
          message: `Je betaalde ${f.boss} af. De rust keert terug in ${dName}, maar je crew vond het laf.`,
        },
      },
      {
        id: 'ignore',
        label: 'Negeren',
        hint: 'Kost niets nu — maar ze komen terug',
        outcome: {
          attention: -10, injureChance: 0.35, money: -Math.round(payoff * 0.3), loyalty: -5,
          message: `Je deed niets. ${f.gang} viel een van je operaties binnen en nam wat ze konden dragen.`,
        },
      },
    ],
  };
}

/** The police stop watching and start kicking in doors. */
function policeIncident(state: GameState, heat: number): ActiveIncident {
  const org = state.org!;
  const bribe = Math.max(8000, Math.round((state.money || 0) * 0.12));
  return {
    id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    kind: 'politie',
    icon: '🚔',
    severity: severityFor(heat, 65, 85),
    district: null,
    day: state.day,
    title: 'Inval op komst',
    body: `Je contact bij het bureau belt: er ligt een gerichte actie klaar tegen jouw organisatie. Je hebt één avond om iets te regelen.`,
    choices: [
      {
        id: 'bribe',
        label: `Omkopen · €${bribe.toLocaleString()}`,
        hint: 'Het dossier verdwijnt',
        costMoney: bribe,
        outcome: {
          money: -bribe, heat: -40,
          message: 'Het dossier is zoekgeraakt. Een dure vriendschap, maar hij werkt.',
        },
      },
      {
        id: 'layoff',
        label: 'Alles stilleggen',
        hint: 'Crew gaat plat · veel minder hitte',
        outcome: {
          heat: -55, loyalty: -8, pullOutOfDistrict: true,
          message: 'Je legde alles stil en stuurde de crew naar huis. De inval vond lege panden.',
        },
      },
      {
        id: 'ride',
        label: 'Uitzitten',
        hint: 'Gokken dat ze niets vinden',
        successChance: Math.max(0.2, 0.75 - heat / 200),
        outcome: {
          heat: -20, respect: 10,
          message: 'Ze vonden niets. Je naam op straat werd er alleen maar groter van.',
        },
        failOutcome: {
          money: -Math.round((state.money || 0) * 0.25), heat: -30, loyalty: -10, injureChance: 0.5,
          message: 'Ze vonden genoeg. Een kwart van je kas is in beslag genomen en er zijn arrestaties verricht.',
        },
      },
    ],
  };
}

/** A crew member who has had enough. */
function crewIncident(state: GameState, memberName: string): ActiveIncident {
  const payout = Math.max(3000, (state.org?.members.length || 1) * 1800);
  return {
    id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    kind: 'crew',
    icon: '🥃',
    severity: 'gemiddeld',
    district: null,
    day: state.day,
    title: `${memberName} mort`,
    body: `${memberName} zit al weken op dezelfde klus en heeft in het café te veel gezegd over hoe weinig het oplevert. De rest luistert mee.`,
    choices: [
      {
        id: 'pay',
        label: `Uitbetalen · €${payout.toLocaleString()}`,
        hint: 'De hele crew knapt op',
        costMoney: payout,
        outcome: {
          money: -payout, loyalty: 22,
          message: `Je legde geld op tafel. ${memberName} houdt zijn mond en de crew werkt weer met plezier.`,
        },
      },
      {
        id: 'lean',
        label: 'Onder druk zetten',
        hint: 'Gratis · angst in plaats van loyaliteit',
        successChance: 0.6,
        outcome: {
          loyalty: 6, respect: 6,
          message: `Je maakte duidelijk hoe het werkt. ${memberName} kijkt wel uit, en de rest ook.`,
        },
        failOutcome: {
          loyalty: -15,
          message: `Het pakte verkeerd uit. ${memberName} vertelt nu overal dat je je eigen mensen bedreigt.`,
        },
      },
      {
        id: 'ignore',
        label: 'Laten waaien',
        hint: 'Risico dat het uitgroeit',
        outcome: {
          loyalty: -10,
          message: 'Je liet het lopen. Het gemopper is nu een gesprek dat iedereen voert.',
        },
      },
    ],
  };
}

/** A rare piece of luck: someone brings you a job. */
function opportunityIncident(state: GameState): ActiveIncident {
  const stake = Math.max(5000, Math.round((state.money || 0) * 0.15));
  const reward = stake * 4;
  return {
    id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    kind: 'kans',
    icon: '💎',
    severity: 'laag',
    district: null,
    day: state.day,
    title: 'Een tip uit de haven',
    body: 'Een oude bekende weet wanneer een ongemarkeerde lading binnenkomt. Hij wil vooraf betaald worden en garandeert niets.',
    choices: [
      {
        id: 'buy',
        label: `Inleggen · €${stake.toLocaleString()}`,
        hint: `65% kans op €${reward.toLocaleString()}`,
        costMoney: stake,
        successChance: 0.65,
        outcome: {
          money: reward - stake, heat: 6, respect: 8,
          message: `De lading was er precies zoals beloofd. €${reward.toLocaleString()} binnen.`,
        },
        failOutcome: {
          money: -stake, heat: 3,
          message: 'De kade was leeg. Je bent je inleg kwijt en je contact is onbereikbaar.',
        },
      },
      {
        id: 'pass',
        label: 'Laten lopen',
        hint: 'Geen risico',
        outcome: { message: 'Je liet het schieten. Misschien maar goed ook.' },
      },
    ],
  };
}

/**
 * Decides whether the world throws something at the player this tick, and what.
 * Returns null on a quiet day. Pressure sources are checked worst-first so the
 * most urgent situation is the one you are asked about.
 */
export function rollIncident(state: GameState, rand: () => number = Math.random): ActiveIncident | null {
  const org = state.org;
  if (!org || org.members.length === 0) return null;

  // 1. A rival whose district you have stirred up the most.
  const attention = state.districtAttention || {};
  const hottest = (Object.keys(attention) as DistrictId[])
    .filter(d => DISTRICT_OWNER[d] && (attention[d] || 0) >= ATTENTION_INCIDENT_THRESHOLD)
    .sort((a, b) => (attention[b] || 0) - (attention[a] || 0))[0];
  if (hottest && rand() < 0.75) {
    const inc = rivalIncident(state, hottest, attention[hottest] || 0);
    if (inc) return inc;
  }

  // 2. The police. Their interest scales with your heat rather than switching on at
  //    a threshold, so heat is a slope you manage instead of a line you hop over.
  const heat = state.personalHeat || 0;
  if (rand() < policeIncidentChance(heat)) {
    return policeIncident(state, heat);
  }

  // 3. An unhappy crew member.
  const unhappy = org.members.filter(m => m.loyalty < LOYALTY_TROUBLE_THRESHOLD);
  if (unhappy.length > 0 && rand() < 0.5) {
    const who = unhappy[Math.floor(rand() * unhappy.length)];
    return crewIncident(state, who.name);
  }

  // 4. Rarely, something good.
  if (rand() < 0.08) return opportunityIncident(state);

  return null;
}
