/**
 * Backstory System — Persoonlijk Verleden & Herkomst
 * Bij het starten van een nieuw spel kiest de speler een achtergrondverhaal.
 * Dit beïnvloedt startbonussen, unieke dialoogopties en welke verhaalbogen beschikbaar worden.
 */

import type { BackstoryId, StatId, DistrictId } from './types';

export interface BackstoryDef {
  id: BackstoryId;
  name: string;
  subtitle: string;
  icon: string;
  desc: string;
  longDesc: string;
  statBonuses: Partial<Record<StatId, number>>;
  startBonuses: {
    money?: number;
    rep?: number;
    policeRel?: number;
    karma?: number;
    startDistrict?: DistrictId;
  };
  mmoPerk: {
    label: string;
    desc: string;
    icon: string;
  };
  exclusiveArcId: string; // ID of the exclusive story arc
  color: string; // theme color class
}

export const BACKSTORIES: BackstoryDef[] = [
  {
    id: 'weduwnaar',
    name: 'De Weduwnaar',
    subtitle: 'Wraak is een gerecht dat koud wordt geserveerd',
    icon: '💀',
    desc: 'Je partner is vermoord door de politie. Je wilt wraak.',
    longDesc: 'Een routinecontrole die escaleerde. Een waarschuwingsschot dat geen waarschuwing was. Ze namen alles van je — nu neem jij alles van hen. De straten van Noxhaven kennen je pijn, en ze zullen je woede leren kennen.',
    statBonuses: { muscle: 3 },
    startBonuses: { policeRel: -20, karma: -10, startDistrict: 'iron' },
    mmoPerk: {
      label: 'Bloedpact',
      desc: '+10% PvP-schade & +10 startrelatie met Bikers',
      icon: '⚔️',
    },
    exclusiveArcId: 'backstory_wraak',
    color: 'blood',
  },
  {
    id: 'bankier',
    name: 'De Gevallen Bankier',
    subtitle: 'Geld is de wortel van alle macht',
    icon: '💰',
    desc: 'Je verloor alles door een corrupte deal. Nu neem je het terug.',
    longDesc: 'Je was de jongste VP bij Van der Berg & Partners. Tot je ontdekte dat je collega\'s miljoenen wegsluisden — en jou als zondebok gebruikten. Alles verloren: carrière, huis, reputatie. Maar je kent het systeem van binnenuit. En dat is je grootste wapen.',
    statBonuses: { brains: 3 },
    startBonuses: { money: 5000, karma: 0, startDistrict: 'crown' },
    mmoPerk: {
      label: 'Insider Trading',
      desc: '-15% handelskosten op de gedeelde markt',
      icon: '📊',
    },
    exclusiveArcId: 'backstory_schuld',
    color: 'gold',
  },
  {
    id: 'straatkind',
    name: 'Het Straatkind',
    subtitle: 'De straat is mijn universiteit',
    icon: '🔥',
    desc: 'Opgegroeid in Lowrise, niks te verliezen. Alles te winnen.',
    longDesc: 'Geen ouders, geen huis, geen regels. De straten van Lowrise waren je wieg en je school. Je leerde praten voordat je leerde lezen — en je leerde vechten voordat je leerde praten. Nu ben je volwassen, en de stad die je groot maakte, zal van jou worden.',
    statBonuses: { charm: 3 },
    startBonuses: { rep: 30, karma: 5, startDistrict: 'low' },
    mmoPerk: {
      label: 'Straatnetwerk',
      desc: 'Extra crew-slot bij start & 20% snellere heat-reductie',
      icon: '🔗',
    },
    exclusiveArcId: 'backstory_loyaliteit',
    color: 'emerald',
  },
];

/** Apply backstory bonuses to a fresh game state */
export function applyBackstory(state: any, backstoryId: BackstoryId): void {
  const def = BACKSTORIES.find(b => b.id === backstoryId);
  if (!def) return;

  // Apply stat bonuses
  for (const [stat, bonus] of Object.entries(def.statBonuses)) {
    if (state.player?.stats?.[stat] !== undefined) {
      state.player.stats[stat] += bonus;
    }
  }

  // Apply start bonuses
  if (def.startBonuses.money) state.money += def.startBonuses.money;
  if (def.startBonuses.rep) state.rep += def.startBonuses.rep;
  if (def.startBonuses.policeRel) state.policeRel += def.startBonuses.policeRel;
  if (def.startBonuses.karma) state.karma = (state.karma || 0) + def.startBonuses.karma;
  if (def.startBonuses.startDistrict) state.loc = def.startBonuses.startDistrict;

  // Apply MMO perks
  if (backstoryId === 'weduwnaar') {
    // +10 Bikers faction relation
    if (state.familyRel) state.familyRel.bikers = (state.familyRel.bikers || 0) + 10;
    // PvP damage bonus tracked as a modifier flag
    if (!state.mmoPerkFlags) state.mmoPerkFlags = {};
    state.mmoPerkFlags.pvpDamageBonus = 0.10; // +10%
  } else if (backstoryId === 'bankier') {
    // Trade discount tracked as a modifier flag
    if (!state.mmoPerkFlags) state.mmoPerkFlags = {};
    state.mmoPerkFlags.tradeDiscount = 0.15; // -15%
  } else if (backstoryId === 'straatkind') {
    // Extra crew slot at start
    if (!state.mmoPerkFlags) state.mmoPerkFlags = {};
    state.mmoPerkFlags.heatReductionBonus = 0.20; // 20% faster
    // Add an extra empty crew slot capacity (crew system uses array length)
  }

  // Set backstory
  state.backstory = backstoryId;

  // Add key decision
  if (!state.keyDecisions) state.keyDecisions = [];
  state.keyDecisions.push(`backstory_${backstoryId}`);
}
