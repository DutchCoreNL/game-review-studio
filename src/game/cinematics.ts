/**
 * Cinematic Moments System
 * Scripted setpieces at major confrontations with unique choices and consequences.
 * Inspired by Godfather, Scarface, Goodfellas.
 */

import type { GameState, DistrictId, StatId } from './types';

export interface CinematicChoice {
  id: string;
  label: string;
  icon: string;
  desc: string;
  effects: {
    money?: number;
    rep?: number;
    heat?: number;
    karma?: number;
    dirtyMoney?: number;
  };
  resultText: string;
}

export interface CinematicScene {
  text?: string;
  atmosphere?: string; // italic flavor text
  pauseMs?: number; // delay before next auto-advance
}

export interface CinematicMoment {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  category: 'milestone' | 'confrontation' | 'betrayal' | 'power';
  scenes: CinematicScene[];
  choices?: CinematicChoice[];
  /** If no choices, just a dramatic reveal */
  revealText?: string;
}

// ========== CINEMATIC DEFINITIONS ==========

export const CINEMATICS: CinematicMoment[] = [
  {
    id: 'first_blood',
    title: 'De Eerste Moord',
    subtitle: 'Er is geen weg terug',
    icon: '🩸',
    category: 'milestone',
    scenes: [
      { text: 'De steeg is donker. Regendruppels tikken op het asfalt als trage applaus.' },
      { text: 'Je handen trillen. Het pistool voelt zwaarder dan het zou moeten.' },
      { text: 'Hij kijkt je aan met ogen vol angst. "Alsjeblieft..." fluistert hij.' },
      { atmosphere: 'Een sirene in de verte. Het geluid van de stad die je geheim bewaart.' },
    ],
    choices: [
      {
        id: 'fb_cold',
        label: 'KOUD AFMAKEN',
        icon: '💀',
        desc: 'Geen getuigen. Geen spijt.',
        effects: { rep: 25, heat: 15, karma: -15 },
        resultText: 'Het schot weerklinkt door de steeg. Stilte. Je bent nu iemand anders geworden.',
      },
      {
        id: 'fb_spare',
        label: 'LAAT HEM GAAN',
        icon: '🕊️',
        desc: 'Je bent nog geen monster.',
        effects: { rep: -5, karma: 15 },
        resultText: 'Je laat het pistool zakken. Hij rent. Misschien vertelt hij het door. Misschien niet. Maar jij weet wie je bent.',
      },
      {
        id: 'fb_deal',
        label: 'MAAK EEN DEAL',
        icon: '🤝',
        desc: '"Je gaat voor me werken. Vanaf nu."',
        effects: { rep: 10, karma: 0, heat: 5 },
        resultText: '"O-oké... alles wat je wilt." Een nieuwe informant. Angst is een krachtig bindmiddel.',
      },
    ],
  },
  {
    id: 'first_district',
    title: 'De Overname',
    subtitle: 'Dit territorium is nu van jou',
    icon: '🏴',
    category: 'power',
    scenes: [
      { text: 'De sleutels van het district liggen op tafel. Figuurlijk, natuurlijk.' },
      { text: 'De vorige eigenaar zit tegenover je. Verslagen. Gebroken.' },
      { atmosphere: 'Buiten klinken voetstappen van je crew die positie innemen. Het district houdt zijn adem in.' },
    ],
    choices: [
      {
        id: 'fd_mercy',
        label: 'TOON GENADE',
        icon: '👑',
        desc: '"Je mag blijven. Onder mijn bescherming."',
        effects: { rep: 15, karma: 10, heat: 0 },
        resultText: 'Hij knikt langzaam. Een bondgenoot uit noodzaak. De straten fluisteren over je eergevoel.',
      },
      {
        id: 'fd_exile',
        label: 'VERBAN HEM',
        icon: '🚪',
        desc: '"Verdwijn. En laat je nooit meer zien."',
        effects: { rep: 20, karma: 0, heat: 5 },
        resultText: 'Hij staat op en loopt naar de deur. Zonder om te kijken. Het district is nu definitief van jou.',
      },
      {
        id: 'fd_example',
        label: 'MAAK EEN VOORBEELD',
        icon: '🔥',
        desc: '"Laat iedereen zien wat er gebeurt."',
        effects: { rep: 40, karma: -20, heat: 20 },
        resultText: 'Zijn schreeuw echoot door de straten. Niemand zal je gezag ooit meer in twijfel trekken.',
      },
    ],
  },
  {
    id: 'first_arrest',
    title: 'De Val',
    subtitle: 'Zelfs koningen vallen',
    icon: '⛓️',
    category: 'confrontation',
    scenes: [
      { text: 'De deur wordt ingebeukt. Zaklampstralen dansen door de kamer.' },
      { text: '"POLITIE! OP DE GROND! NU!"' },
      { text: 'Je heft langzaam je handen. Dit is niet het einde. Dit is een les.' },
      { atmosphere: 'Door het raam zie je de stad. Jouw stad. Ze wacht op je terugkeer.' },
    ],
    revealText: 'De handboeien klikken dicht. Maar in je hoofd begin je al te plannen. Ze hebben je lichaam, niet je geest.',
  },
  {
    id: 'crew_betrayal',
    title: 'Het Verraad',
    subtitle: 'De mes in je rug draagt een bekend gezicht',
    icon: '🗡️',
    category: 'betrayal',
    scenes: [
      { text: 'Je telefoon trilt. Een onbekend nummer. De foto die binnenkomt bevriest je bloed.' },
      { text: 'Je meest vertrouwde crewlid. Pratend met de vijand. Lachend.' },
      { atmosphere: 'De wereld kantelt. Alles wat je zeker wist, brokkelt af in seconden.' },
    ],
    choices: [
      {
        id: 'cb_confront',
        label: 'CONFRONTEER',
        icon: '😤',
        desc: '"Kijk me aan en zeg dat het niet waar is."',
        effects: { rep: 15, karma: 5, heat: 5 },
        resultText: 'Zijn ogen verraden hem voordat zijn mond dat doet. "Het is niet wat je denkt—" Maar je weet genoeg.',
      },
      {
        id: 'cb_eliminate',
        label: 'ELIMINEER STILLETJES',
        icon: '🔇',
        desc: 'Geen woorden. Geen waarschuwing.',
        effects: { rep: 25, karma: -20, heat: 10 },
        resultText: 'Twee dagen later vindt iemand zijn auto bij de haven. Leeg. De boodschap is duidelijk.',
      },
      {
        id: 'cb_use',
        label: 'GEBRUIK HET',
        icon: '🧠',
        desc: 'Laat hem denken dat je niets weet. Voed hem leugens.',
        effects: { rep: 5, karma: -5, heat: -10 },
        resultText: 'Je begint met het voeden van valse informatie. De verrader wordt je beste wapen tegen de vijand.',
      },
    ],
  },
  {
    id: 'nemesis_showdown',
    title: 'De Confrontatie',
    subtitle: 'Oog in oog met je lot',
    icon: '⚔️',
    category: 'confrontation',
    scenes: [
      { text: 'Het dak van het Noxhaven Grand Hotel. De wind rukt aan je kleren.' },
      { text: 'Hij staat daar. Silhouet tegen de stadslichten. Wachtend.' },
      { text: '"Je wist dat dit moment zou komen," zegt hij kalm. "We zijn hetzelfde, jij en ik."' },
      { atmosphere: 'Beneden draait de stad door. Onwetend van het drama dat zich hier afspeelt.' },
    ],
    revealText: '"Laten we dit afmaken." Hij trekt zijn wapen. Jij het jouwe. De stad kijkt toe.',
  },
  {
    id: 'godfather_moment',
    title: 'Het Aanbod',
    subtitle: 'Een aanbod dat ze niet kunnen weigeren',
    icon: '🎩',
    category: 'power',
    scenes: [
      { text: 'De lange tafel in het achterkamertje van Restaurant Vesuvio. Kaarslicht.' },
      { text: 'Vijf mannen zitten tegenover je. De machtigsten van Noxhaven.' },
      { text: 'Je schuift een map over tafel. "Hier staan de namen. De routes. De bedragen."' },
      { atmosphere: 'Het geluid van bestek op porselein in het restaurant. De geur van Cubaanse sigaren.' },
    ],
    choices: [
      {
        id: 'gm_alliance',
        label: 'BIED PARTNERSCHAP',
        icon: '🤝',
        desc: '"Samen zijn we onaantastbaar."',
        effects: { rep: 30, karma: 5, money: 5000 },
        resultText: 'Eén voor één leggen ze hun hand op de map. Een pact bezegeld. De stad heeft nieuwe heersers.',
      },
      {
        id: 'gm_demand',
        label: 'EIS ONDERWERPING',
        icon: '👊',
        desc: '"Buig of breek."',
        effects: { rep: 50, karma: -15, heat: 15, money: 10000 },
        resultText: 'Stilte. Dan staat de oudste op. "Je hebt lef, jochie." Hij knielt. De rest volgt.',
      },
      {
        id: 'gm_trap',
        label: 'HET IS EEN VAL',
        icon: '💣',
        desc: 'Je wist het al. De deuren gaan op slot.',
        effects: { rep: 35, karma: -25, heat: 25, money: 15000 },
        resultText: 'De lichten gaan uit. Schoten. Schreeuwn. Als het licht terugkomt, sta jij nog overeind. Alleen jij.',
      },
    ],
  },
  {
    id: 'rise_to_power',
    title: 'De Kroning',
    subtitle: 'Noxhaven buigt voor haar nieuwe koning',
    icon: '👑',
    category: 'power',
    scenes: [
      { text: 'Vanuit het penthouse zie je de hele stad. Elk licht is een leven dat nu onder jouw bescherming valt.' },
      { text: 'De telefoon rinkelt onophoudelijk. Felicitaties. Smeekbedes. Dreigmenten.' },
      { text: 'Je draait het glas whisky langzaam rond. De amberleurige vloeistof vangt het stadslicht.' },
      { atmosphere: 'Dit is het moment waar je je hele leven naartoe hebt gewerkt. Maar op de top is het koud.' },
    ],
    revealText: 'Je heft het glas. "Op Noxhaven." De stad glinstert onder je. Ze is van jou. Elke straat. Elke schaduw. Elke ziel.',
  },
  {
    id: 'scarface_moment',
    title: 'Zeg Hallo',
    subtitle: 'Tegen de wereld, alleen',
    icon: '🔥',
    category: 'confrontation',
    scenes: [
      { text: 'Ze komen van alle kanten. Tientallen. Gewapend tot de tanden.' },
      { text: 'Je villa is omsingeld. Je crew gevlucht of gevallen.' },
      { text: 'Je grijpt het zwaarste wapen dat je hebt. "Jullie willen oorlog? JULLIE KRIJGEN OORLOG!"' },
      { atmosphere: 'De nacht explodeert in vuur en staal. Dit is je Alamo. Je laatste stand.' },
    ],
    choices: [
      {
        id: 'sm_fight',
        label: 'VECHT TOT HET EINDE',
        icon: '💥',
        desc: '"Zeg hallo tegen mijn kleine vriend!"',
        effects: { rep: 60, karma: -30, heat: 30 },
        resultText: 'Je vecht als een bezetene. Kogels fluiten. Glas breekt. Maar je staat nog steeds. Bloedend, maar staand.',
      },
      {
        id: 'sm_escape',
        label: 'ONTSNAP VIA DE TUNNEL',
        icon: '🕳️',
        desc: 'Leven om een ander dag te vechten.',
        effects: { rep: -10, karma: 5, heat: -15 },
        resultText: 'Door de geheime tunnel onder de villa ontsnap je in de nacht. Je verliest alles behalve je leven.',
      },
    ],
  },
];

// ========== TRIGGER SYSTEM ==========

interface CinematicTrigger {
  cinematicId: string;
  /** Returns true if this cinematic should trigger */
  check: (state: GameState, context?: string) => boolean;
}

const CINEMATIC_TRIGGERS: CinematicTrigger[] = [
  {
    cinematicId: 'first_blood',
    check: (s, ctx) => ctx === 'combat_won' && (s.stats?.missionsCompleted || 0) <= 1 && !s.seenCinematics?.includes('first_blood'),
  },
  {
    cinematicId: 'first_district',
    check: (s, ctx) => ctx === 'district_bought' && s.ownedDistricts.length === 1 && !s.seenCinematics?.includes('first_district'),
  },
  {
    cinematicId: 'first_arrest',
    check: (s, ctx) => ctx === 'arrested' && !s.seenCinematics?.includes('first_arrest'),
  },
  {
    cinematicId: 'crew_betrayal',
    check: (s, ctx) => ctx === 'crew_defected' && !s.seenCinematics?.includes('crew_betrayal'),
  },
  {
    cinematicId: 'nemesis_showdown',
    check: (s, ctx) => ctx === 'nemesis_combat_start' && (s.nemesis?.generation || 1) >= 3 && !s.seenCinematics?.includes('nemesis_showdown'),
  },
  {
    cinematicId: 'godfather_moment',
    check: (s) => (s.conqueredFactions?.length || 0) >= 2 && s.ownedDistricts.length >= 3 && !s.seenCinematics?.includes('godfather_moment'),
  },
  {
    cinematicId: 'rise_to_power',
    check: (s) => s.ownedDistricts.length >= 5 && !s.seenCinematics?.includes('rise_to_power'),
  },
  {
    cinematicId: 'scarface_moment',
    check: (s, ctx) => ctx === 'villa_attack_lost' && (s.villa?.level || 0) >= 2 && !s.seenCinematics?.includes('scarface_moment'),
  },
];

/** Check if a cinematic should trigger given a context event */
export function checkCinematicTrigger(state: GameState, context?: string): CinematicMoment | null {
  // Don't trigger during prison or hospital
  if (state.prison || state.hospital) return null;
  // Don't trigger if another cinematic is pending
  if (state.pendingCinematic) return null;

  for (const trigger of CINEMATIC_TRIGGERS) {
    if (trigger.check(state, context)) {
      const cinematic = CINEMATICS.find(c => c.id === trigger.cinematicId);
      if (cinematic) return cinematic;
    }
  }
  return null;
}

/** Apply cinematic choice effects to game state */
export function applyCinematicChoice(state: GameState, cinematicId: string, choiceId: string): void {
  const cinematic = CINEMATICS.find(c => c.id === cinematicId);
  if (!cinematic?.choices) return;
  
  const choice = cinematic.choices.find(c => c.id === choiceId);
  if (!choice) return;

  if (choice.effects.money) state.money += choice.effects.money;
  if (choice.effects.rep) state.rep += choice.effects.rep;
  if (choice.effects.heat) {
    state.personalHeat = Math.max(0, Math.min(100, (state.personalHeat || 0) + choice.effects.heat));
    state.heat = Math.max(0, Math.min(100, state.heat + choice.effects.heat));
  }
  if (choice.effects.karma) state.karma = Math.max(-100, Math.min(100, (state.karma || 0) + choice.effects.karma));
  if (choice.effects.dirtyMoney) state.dirtyMoney += choice.effects.dirtyMoney;

  // Mark as seen
  if (!state.seenCinematics) state.seenCinematics = [];
  if (!state.seenCinematics.includes(cinematicId)) {
    state.seenCinematics.push(cinematicId);
  }

  // Track as key decision
  if (!state.keyDecisions) state.keyDecisions = [];
  state.keyDecisions.push(`cinematic_${cinematicId}_${choiceId}`);
}

/** Mark a reveal-only cinematic as seen */
export function markCinematicSeen(state: GameState, cinematicId: string): void {
  if (!state.seenCinematics) state.seenCinematics = [];
  if (!state.seenCinematics.includes(cinematicId)) {
    state.seenCinematics.push(cinematicId);
  }
}
