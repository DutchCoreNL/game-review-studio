/**
 * NPC Interactive Events System
 * Triggered during travel or end-of-turn when player is in NPC's home district.
 * Provides choice-based encounters that affect NPC relationship, money, heat, karma, etc.
 * Also implements missing NPC bonuses (e.g. Luna free crew at 80+).
 */

import type { GameState, NpcId, DistrictId, CrewRole } from './types';
import { NPC_DEFS, getNpcTier, modifyNpcRelation } from './npcs';
import { addPhoneMessage } from './newFeatures';

export interface NpcEventChoice {
  id: string;
  label: string;
  desc: string;
}

export interface NpcEvent {
  id: string;
  npcId: NpcId;
  npcName: string;
  message: string;
  choices: NpcEventChoice[];
  day: number;
}

export interface NpcEventResult {
  text: string;
  relationChange: number;
  moneyChange: number;
  heatChange: number;
  karmaChange: number;
  repChange: number;
  special?: string; // e.g. 'luna_free_crew'
}

interface NpcEventTemplate {
  id: string;
  minRelation: number;
  message: (npcName: string, district: string) => string;
  choices: NpcEventChoice[];
  resolve: (choiceId: string, state: GameState) => NpcEventResult;
}

const NPC_EVENT_TEMPLATES: Record<NpcId, NpcEventTemplate[]> = {
  rosa: [
    {
      id: 'rosa_rumor',
      minRelation: 0,
      message: () => `"Hé schat, ik heb iets gehoord. Een grote zending komt binnen via Port Nero. Wil je dat ik wat namen voor je check?"`,
      choices: [
        { id: 'accept', label: 'Graag', desc: 'Laat Rosa haar bronnen raadplegen' },
        { id: 'pay', label: 'Betaal haar', desc: 'Geef €1.000 voor extra detail' },
        { id: 'decline', label: 'Niet nodig', desc: 'Sla het aanbod af' },
      ],
      resolve: (choiceId) => {
        if (choiceId === 'accept') return { text: 'Rosa fluistert namen en tijden. Waardevolle info.', relationChange: 8, moneyChange: 0, heatChange: -3, karmaChange: 0, repChange: 5 };
        if (choiceId === 'pay') return { text: 'Rosa glundert. "Voor dat geld krijg je alles." Gedetailleerde intel.', relationChange: 15, moneyChange: -1000, heatChange: -8, karmaChange: 0, repChange: 10 };
        return { text: 'Rosa haalt haar schouders op. "Je weet me te vinden."', relationChange: -3, moneyChange: 0, heatChange: 0, karmaChange: 0, repChange: 0 };
      },
    },
    {
      id: 'rosa_trouble',
      minRelation: 30,
      message: () => `"Er zijn mannen in mijn bar geweest. Ze dreigden de boel kort en klein te slaan. Kun je... iets regelen?"`,
      choices: [
        { id: 'help', label: 'Ik regel het', desc: 'Bescherm Rosa\'s bar' },
        { id: 'money', label: 'Huur beveiliging', desc: 'Betaal €2.000 voor beveiligers' },
        { id: 'ignore', label: 'Niet mijn probleem', desc: 'Laat het gaan' },
      ],
      resolve: (choiceId) => {
        if (choiceId === 'help') return { text: 'Je hebt de mannen weggejaagd. Rosa is je dankbaar.', relationChange: 20, moneyChange: 0, heatChange: 5, karmaChange: 5, repChange: 15 };
        if (choiceId === 'money') return { text: 'De beveiliging is geregeld. Rosa voelt zich veilig.', relationChange: 15, moneyChange: -2000, heatChange: 0, karmaChange: 3, repChange: 5 };
        return { text: '"Ik dacht dat we vrienden waren." Rosa kijkt teleurgesteld.', relationChange: -15, moneyChange: 0, heatChange: 0, karmaChange: -3, repChange: -5 };
      },
    },
  ],

  marco: [
    {
      id: 'marco_lesson',
      minRelation: 0,
      message: () => `"Kom zitten, jongen. Ik wil je iets leren over hoe we het vroeger deden. Lessen die je niet in de straat leert."`,
      choices: [
        { id: 'listen', label: 'Luisteren', desc: 'Leer van Marco\'s ervaring' },
        { id: 'spar', label: 'Sparren', desc: 'Vraag om een trainingsgevecht' },
        { id: 'busy', label: 'Geen tijd', desc: 'Je hebt het druk' },
      ],
      resolve: (choiceId) => {
        if (choiceId === 'listen') return { text: 'Marco vertelt over oude tactieken. Je leert iets nieuws.', relationChange: 10, moneyChange: 0, heatChange: 0, karmaChange: 2, repChange: 5 };
        if (choiceId === 'spar') return { text: 'Marco is verrassend sterk. Je bent beter geworden na de training.', relationChange: 15, moneyChange: 0, heatChange: 0, karmaChange: 0, repChange: 10 };
        return { text: '"Altijd haast, nooit wijsheid." Marco schudt zijn hoofd.', relationChange: -5, moneyChange: 0, heatChange: 0, karmaChange: 0, repChange: 0 };
      },
    },
    {
      id: 'marco_weapon',
      minRelation: 40,
      message: () => `"Ik heb iets voor je bewaard. Uit mijn oude collectie. Maar het kost je een gunst — geen geld."`,
      choices: [
        { id: 'accept', label: 'Deal', desc: 'Accepteer de gunst' },
        { id: 'refuse', label: 'Geen gunsten', desc: 'Je wilt niet in het krijt staan' },
      ],
      resolve: (choiceId) => {
        if (choiceId === 'accept') return { text: 'Marco overhandigt een antiek wapen. "Gebruik het goed." +€3.000 waarde.', relationChange: 20, moneyChange: 3000, heatChange: 3, karmaChange: 0, repChange: 10 };
        return { text: '"Verstandig. Maar soms moet je vertrouwen."', relationChange: -5, moneyChange: 0, heatChange: 0, karmaChange: 0, repChange: 0 };
      },
    },
  ],

  yilmaz: [
    {
      id: 'yilmaz_warning',
      minRelation: 0,
      message: () => `"Ik wil je waarschuwen. Er is een inval gepland. Niet voor jou — maar als je nu goederen bij je hebt, zou ik ze verplaatsen."`,
      choices: [
        { id: 'thank', label: 'Bedanken', desc: 'Waardeer de tip' },
        { id: 'bribe', label: 'Tip geven', desc: 'Geef €1.500 als dank' },
        { id: 'suspicion', label: 'Waarom help je mij?', desc: 'Wantrouw zijn motief' },
      ],
      resolve: (choiceId) => {
        if (choiceId === 'thank') return { text: 'Yilmaz knikt. "Pas op jezelf." Je heat daalt.', relationChange: 8, moneyChange: 0, heatChange: -10, karmaChange: 0, repChange: 0 };
        if (choiceId === 'bribe') return { text: 'Yilmaz pakt het geld discreet. "Je hebt een vriend bij de politie."', relationChange: 15, moneyChange: -1500, heatChange: -15, karmaChange: -3, repChange: 5 };
        return { text: '"Geloof wat je wilt." Yilmaz loopt weg.', relationChange: -10, moneyChange: 0, heatChange: 0, karmaChange: 0, repChange: 0 };
      },
    },
    {
      id: 'yilmaz_deal',
      minRelation: 50,
      message: () => `"Ik heb een voorstel. Ik kijk de andere kant op bij je volgende deal. Maar ik wil dat je een rivaliserende bende uit Crown Heights wegjaagt."`,
      choices: [
        { id: 'deal', label: 'Akkoord', desc: 'Help Yilmaz, krijg bescherming' },
        { id: 'negotiate', label: 'Onderhandelen', desc: 'Vraag meer in ruil' },
        { id: 'refuse', label: 'Geen deal', desc: 'Je werkt niet voor de politie' },
      ],
      resolve: (choiceId) => {
        if (choiceId === 'deal') return { text: 'De bende is weg. Yilmaz houdt zijn woord — minder politie op je nek.', relationChange: 20, moneyChange: 0, heatChange: -20, karmaChange: -5, repChange: 15 };
        if (choiceId === 'negotiate') return { text: 'Yilmaz biedt extra bescherming. Een win-win situatie.', relationChange: 15, moneyChange: 2000, heatChange: -15, karmaChange: -3, repChange: 10 };
        return { text: '"Jammer. Ik had gehoopt op samenwerking." Yilmaz vertrekt.', relationChange: -10, moneyChange: 0, heatChange: 0, karmaChange: 5, repChange: 0 };
      },
    },
  ],

  luna: [
    {
      id: 'luna_info',
      minRelation: 0,
      message: () => `"Psst! Ik heb iets gezien bij de markt. Vreemde types met koffers. Volgens mij is het een deal. Wil je dat ik het uitzoek?"`,
      choices: [
        { id: 'scout', label: 'Uitzoeken', desc: 'Laat Luna de deal observeren' },
        { id: 'protect', label: 'Pas op jezelf', desc: 'Het is te gevaarlijk voor haar' },
        { id: 'join', label: 'Samen gaan', desc: 'Ga samen kijken' },
      ],
      resolve: (choiceId) => {
        if (choiceId === 'scout') return { text: 'Luna komt terug met details. Een waardevolle tip!', relationChange: 10, moneyChange: 1500, heatChange: 0, karmaChange: -2, repChange: 5 };
        if (choiceId === 'protect') return { text: 'Luna glimlacht. "Bedankt dat je om me geeft." Haar vertrouwen groeit.', relationChange: 15, moneyChange: 0, heatChange: 0, karmaChange: 8, repChange: 0 };
        if (choiceId === 'join') return { text: 'Samen ontdekken jullie een smokkelroute. Waardevolle intel!', relationChange: 20, moneyChange: 2000, heatChange: 3, karmaChange: 0, repChange: 10 };
        return { text: '', relationChange: 0, moneyChange: 0, heatChange: 0, karmaChange: 0, repChange: 0 };
      },
    },
    {
      id: 'luna_help',
      minRelation: 40,
      message: () => `"Er is een nieuw kindje op straat. Geen ouders, net als ik. Kun je helpen? Een paar honderd euro voor eten en kleren?"`,
      choices: [
        { id: 'help', label: 'Helpen', desc: 'Geef €500 voor het kind' },
        { id: 'big_help', label: 'Veel helpen', desc: 'Geef €2.000 voor onderdak' },
        { id: 'refuse', label: 'Kan niet', desc: 'Je hebt het geld niet over' },
      ],
      resolve: (choiceId) => {
        if (choiceId === 'help') return { text: 'Luna straalt. "Dankje. Je bent een goed mens, onder alles."', relationChange: 15, moneyChange: -500, heatChange: 0, karmaChange: 10, repChange: 5 };
        if (choiceId === 'big_help') return { text: 'Luna omhelst je. "Dit vergeet ik nooit." Het kind is veilig.', relationChange: 25, moneyChange: -2000, heatChange: 0, karmaChange: 15, repChange: 15 };
        return { text: 'Luna knikt begripvol, maar haar ogen zijn triest.', relationChange: -5, moneyChange: 0, heatChange: 0, karmaChange: -3, repChange: 0 };
      },
    },
  ],

  krow: [
    {
      id: 'krow_business',
      minRelation: 0,
      message: () => `"We moeten praten. Over business. Er is een markt die we allebei willen. Ik stel een tijdelijk partnerschap voor."`,
      choices: [
        { id: 'partner', label: 'Partnerschap', desc: 'Werk samen met Krow' },
        { id: 'dominate', label: 'Op mijn voorwaarden', desc: 'Eis de betere deal' },
        { id: 'refuse', label: 'Vergeet het', desc: 'Je werkt niet met rivalen' },
      ],
      resolve: (choiceId) => {
        if (choiceId === 'partner') return { text: 'Het partnerschap loont. Jullie verdelen de winst eerlijk.', relationChange: 15, moneyChange: 4000, heatChange: 0, karmaChange: 3, repChange: 10 };
        if (choiceId === 'dominate') return { text: 'Krow slikt zijn trots in. "Prima. Maar onthoud dit moment."', relationChange: -10, moneyChange: 6000, heatChange: 3, karmaChange: -5, repChange: 5 };
        return { text: '"Jammer. De volgende keer zijn we misschien vijanden." Krow vertrekt.', relationChange: -15, moneyChange: 0, heatChange: 0, karmaChange: 0, repChange: -5 };
      },
    },
    {
      id: 'krow_respect',
      minRelation: 50,
      message: () => `"Ik moet het toegeven — je hebt mijn respect verdiend. Er zijn weinig mensen in deze stad die ik respecteer. Laten we een wapenstilstand sluiten."`,
      choices: [
        { id: 'truce', label: 'Wapenstilstand', desc: 'Sluit vrede met Krow' },
        { id: 'ally', label: 'Bondgenootschap', desc: 'Stel een echt bondgenootschap voor' },
        { id: 'cold', label: 'Respect is genoeg', desc: 'Houd het bij afstand' },
      ],
      resolve: (choiceId) => {
        if (choiceId === 'truce') return { text: 'De wapenstilstand houdt. Krow is een man van zijn woord.', relationChange: 15, moneyChange: 0, heatChange: -5, karmaChange: 3, repChange: 10 };
        if (choiceId === 'ally') return { text: 'Krow steekt zijn hand uit. "Bondgenoten dan. Maar verraad me niet."', relationChange: 25, moneyChange: 0, heatChange: 0, karmaChange: 5, repChange: 25 };
        return { text: 'Krow knikt kort. "Begrepen. Maar mijn aanbod staat."', relationChange: 5, moneyChange: 0, heatChange: 0, karmaChange: 0, repChange: 0 };
      },
    },
  ],
};

const NPC_EVENT_COOLDOWN = 4; // days between events per NPC

/** Roll for an NPC interactive event (called during travel/end-turn) */
export function rollNpcEvent(state: GameState): NpcEvent | null {
  if (state.prison || state.hospital) return null;
  // Don't overlap with other popups
  if (state.pendingStreetEvent || state.pendingArcEvent || state.pendingCrewEvent) return null;

  const npcsInDistrict = NPC_DEFS.filter(n => n.homeDistrict === state.loc);
  if (npcsInDistrict.length === 0) return null;

  for (const npc of npcsInDistrict) {
    const rel = state.npcRelations?.[npc.id];
    const relValue = rel?.value || 0;
    const lastEvent = (state as any).npcEventCooldowns?.[npc.id] || 0;
    if (state.day - lastEvent < NPC_EVENT_COOLDOWN) continue;

    // 12% base chance, higher if met
    let chance = rel?.met ? 0.15 : 0.05;
    if (Math.random() >= chance) continue;

    const templates = NPC_EVENT_TEMPLATES[npc.id] || [];
    const eligible = templates.filter(t => relValue >= t.minRelation);
    if (eligible.length === 0) continue;

    const template = eligible[Math.floor(Math.random() * eligible.length)];
    const districtName = { port: 'Port Nero', crown: 'Crown Heights', iron: 'Iron Borough', low: 'Lowrise', neon: 'Neon Strip' }[state.loc] || 'de stad';

    // Mark as met if not yet
    if (!rel?.met) {
      modifyNpcRelation(state, npc.id, 5);
    }

    return {
      id: `npc_${npc.id}_${template.id}_${state.day}`,
      npcId: npc.id,
      npcName: npc.name,
      message: template.message(npc.name, districtName),
      choices: template.choices,
      day: state.day,
    };
  }

  return null;
}

/** Resolve an NPC event choice */
export function resolveNpcEvent(state: GameState, event: NpcEvent, choiceId: string): NpcEventResult {
  const templates = NPC_EVENT_TEMPLATES[event.npcId] || [];
  const templateId = event.id.split('_').slice(1, -1).join('_').replace(`${event.npcId}_`, '');
  const template = templates.find(t => event.id.includes(t.id));
  
  if (!template) {
    return { text: 'Er gebeurde niets.', relationChange: 0, moneyChange: 0, heatChange: 0, karmaChange: 0, repChange: 0 };
  }

  const result = template.resolve(choiceId, state);

  // Apply effects
  modifyNpcRelation(state, event.npcId, result.relationChange);
  if (result.moneyChange > 0) { state.money += result.moneyChange; state.stats.totalEarned += result.moneyChange; }
  if (result.moneyChange < 0) { state.money = Math.max(0, state.money + result.moneyChange); state.stats.totalSpent += Math.abs(result.moneyChange); }
  if (result.heatChange !== 0) { state.personalHeat = Math.max(0, Math.min(100, (state.personalHeat || 0) + result.heatChange)); }
  if (result.karmaChange !== 0) { state.karma = Math.max(-100, Math.min(100, state.karma + result.karmaChange)); }
  if (result.repChange !== 0) { state.rep = Math.max(0, state.rep + result.repChange); }

  // Set cooldown
  if (!(state as any).npcEventCooldowns) (state as any).npcEventCooldowns = {};
  (state as any).npcEventCooldowns[event.npcId] = state.day;

  return result;
}

/** Apply active NPC tier bonuses that weren't implemented yet */
export function applyMissingNpcBonuses(state: GameState): void {
  // Rosa tier 50+: +5% casino winst (handled in casino logic)
  // Rosa tier 80+: +10% witwas efficiency (handled in wash logic)
  
  // Luna tier 80+: Grant free Hacker crew member (once)
  const lunaTier = getNpcTier(state, 'luna');
  if (lunaTier && lunaTier.min >= 80) {
    const lunaGranted = state.npcRelations?.luna?.flags?.includes('crew_granted');
    if (!lunaGranted && state.crew.length < 6) {
      state.crew.push({
        name: 'Luna',
        role: 'Hacker' as CrewRole,
        hp: 100,
        xp: 0,
        level: 3,
        specialization: null,
        loyalty: 90,
      });
      if (!state.npcRelations.luna.flags) state.npcRelations.luna.flags = [];
      state.npcRelations.luna.flags.push('crew_granted');
      addPhoneMessage(state, 'Luna', '"Ik ben klaar om mee te vechten. Je hebt bewezen dat je me vertrouwt. Ik ben je Hacker." 🌙', 'opportunity');
    }
  }

  // Krow tier 90+: +20% rep, +5% trade profit (passive, applied in trade/rep calcs)
  // Marco tier 85+: free crew heal/day (applied in crew healing)
}

/** Get Rosa's casino bonus multiplier based on tier */
export function getRosaCasinoBonus(state: GameState): number {
  const rosaTier = getNpcTier(state, 'rosa');
  if (rosaTier && rosaTier.min >= 50) return 0.05; // +5%
  return 0;
}

/** Get Rosa's laundering efficiency bonus */
export function getRosaLaunderingBonus(state: GameState): number {
  const rosaTier = getNpcTier(state, 'rosa');
  if (rosaTier && rosaTier.min >= 80) return 0.10; // +10%
  return 0;
}

/** Get Krow's trade profit bonus */
export function getKrowTradeBonus(state: GameState): number {
  const krowTier = getNpcTier(state, 'krow');
  if (krowTier && krowTier.min >= 90) return 0.05; // +5%
  if (krowTier && krowTier.min >= 60) return 0.02; // +2%
  return 0;
}

/** Get Krow's rep gain multiplier */
export function getKrowRepBonus(state: GameState): number {
  const krowTier = getNpcTier(state, 'krow');
  if (krowTier && krowTier.min >= 90) return 0.20; // +20%
  if (krowTier && krowTier.min >= 60) return 0.15; // +15%
  return 0;
}
