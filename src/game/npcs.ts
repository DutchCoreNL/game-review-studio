/**
 * NPC Relationship System — Terugkerende personages die een relatie met de speler opbouwen.
 * Elke NPC heeft een relatiewaarde (0-100) die dialogen en beschikbare opties verandert.
 */

import type { GameState, DistrictId, NpcId } from './types';
import { addPhoneMessage } from './newFeatures';

// ========== NPC DEFINITIONS ==========

export interface NpcDef {
  id: NpcId;
  name: string;
  title: string;
  homeDistrict: DistrictId;
  icon: string;
  desc: string;
  /** Relationship thresholds for different tiers */
  tiers: { min: number; label: string; bonus: string }[];
}

export const NPC_DEFS: NpcDef[] = [
  {
    id: 'rosa',
    name: 'Rosa',
    title: 'Barvrouw — Neon Strip',
    homeDistrict: 'neon',
    icon: '🍸',
    desc: 'Rosa runt de populairste bar in Neon Strip. Ze hoort alles en zegt weinig — tenzij je haar vertrouwen wint.',
    tiers: [
      { min: 0, label: 'Vreemde', bonus: 'Geen' },
      { min: 20, label: 'Bekende', bonus: 'Markt-tips via telefoon' },
      { min: 50, label: 'Vriendin', bonus: '+5% casino winst' },
      { min: 80, label: 'Partner', bonus: '+10% witwas efficiency' },
    ],
  },
  {
    id: 'marco',
    name: 'Oude Marco',
    title: 'Gepensioneerde Mafioso — Lowrise',
    homeDistrict: 'low',
    icon: '👴',
    desc: 'Marco heeft alles gezien. Drie decennia in de onderwereld van Noxhaven. Nu deelt hij wijsheid — en soms wapens.',
    tiers: [
      { min: 0, label: 'Onbekende', bonus: 'Geen' },
      { min: 25, label: 'Leerling', bonus: '+1 Kracht passief' },
      { min: 55, label: 'Protégé', bonus: '+2 Kracht, -10% crew healing' },
      { min: 85, label: 'Opvolger', bonus: '+3 Kracht, gratis crew heal/dag' },
    ],
  },
  {
    id: 'yilmaz',
    name: 'Inspecteur Yilmaz',
    title: 'Eerlijke Agent — Hoofdbureau',
    homeDistrict: 'crown',
    icon: '🔍',
    desc: 'Yilmaz is een van de weinige eerlijke agenten. Respecteer hem en hij kijkt soms de andere kant op. Corrumpeer hem en je hebt een machtige bondgenoot.',
    tiers: [
      { min: 0, label: 'Verdachte', bonus: 'Geen' },
      { min: 30, label: 'Bekende', bonus: '-5% boetereductie' },
      { min: 60, label: 'Contact', bonus: '-15% politie-inval kans' },
      { min: 90, label: 'Bondgenoot', bonus: '-25% heat per dag' },
    ],
  },
  {
    id: 'luna',
    name: 'Luna',
    title: 'Straatkind / Informant',
    homeDistrict: 'low',
    icon: '🌙',
    desc: 'Luna groeit op in de straten van Noxhaven. Ze is slim, snel en kent elke schaduw. Naarmate het spel vordert, groeit ze uit tot een waardevolle bondgenoot.',
    tiers: [
      { min: 0, label: 'Straatkind', bonus: 'Geen' },
      { min: 20, label: 'Informant', bonus: 'Street event waarschuwingen' },
      { min: 50, label: 'Vertrouweling', bonus: '+10% solo op succes' },
      { min: 80, label: 'Crewlid', bonus: 'Gratis Hacker crewlid' },
    ],
  },
  {
    id: 'krow',
    name: 'Viktor Krow',
    title: 'De Rivaal',
    homeDistrict: 'neon',
    icon: '🦅',
    desc: 'Viktor Krow verschijnt in de Rivaal-verhaalboog. Na afloop blijft hij een terugkerend personage — bondgenoot of vijand.',
    tiers: [
      { min: 0, label: 'Vijand', bonus: 'Geen' },
      { min: 30, label: 'Concurrent', bonus: '-5% factie intimidatie kosten' },
      { min: 60, label: 'Respect', bonus: '+15% rep gain' },
      { min: 90, label: 'Bondgenoot', bonus: '+20% rep, +5% trade profit' },
    ],
  },
];

// ========== NPC HELPERS ==========

export function getNpcDef(npcId: NpcId): NpcDef | undefined {
  return NPC_DEFS.find(n => n.id === npcId);
}

export function getNpcTier(state: GameState, npcId: NpcId): NpcDef['tiers'][number] | null {
  const rel = state.npcRelations?.[npcId];
  if (!rel || !rel.met) return null;
  const def = getNpcDef(npcId);
  if (!def) return null;
  let currentTier = def.tiers[0];
  for (const tier of def.tiers) {
    if (rel.value >= tier.min) currentTier = tier;
  }
  return currentTier;
}

export function modifyNpcRelation(state: GameState, npcId: NpcId, amount: number): void {
  if (!state.npcRelations) return;
  if (!state.npcRelations[npcId]) {
    state.npcRelations[npcId] = { value: 50, met: true, lastInteractionDay: state.day, flags: [] };
  }
  const rel = state.npcRelations[npcId];
  rel.met = true;
  rel.value = Math.max(0, Math.min(100, rel.value + amount));
  rel.lastInteractionDay = state.day;
}

/** Apply passive NPC bonuses — called during endTurn */
export function applyNpcBonuses(state: GameState): { extraHeatDecay: number; crewHealBonus: number } {
  let extraHeatDecay = 0;
  let crewHealBonus = 0;

  // Yilmaz high tier: heat reduction
  const yilmazTier = getNpcTier(state, 'yilmaz');
  if (yilmazTier && yilmazTier.min >= 90) extraHeatDecay += 5;
  else if (yilmazTier && yilmazTier.min >= 60) extraHeatDecay += 2;

  // Marco high tier: crew healing
  const marcoTier = getNpcTier(state, 'marco');
  if (marcoTier && marcoTier.min >= 85) crewHealBonus += 10;
  else if (marcoTier && marcoTier.min >= 55) crewHealBonus += 5;

  return { extraHeatDecay, crewHealBonus };
}

/** Check if NPC encounters should trigger (called during end_turn/travel) */
export function rollNpcEncounter(state: GameState): { npcId: NpcId; message: string } | null {
  if (Math.random() > 0.08) return null; // 8% chance per day

  const npcsInDistrict = NPC_DEFS.filter(n => n.homeDistrict === state.loc);
  if (npcsInDistrict.length === 0) return null;

  const npc = npcsInDistrict[Math.floor(Math.random() * npcsInDistrict.length)];
  const rel = state.npcRelations?.[npc.id];
  const relValue = rel?.value || 0;

  // Generate contextual message based on relationship
  const messages: Record<NpcId, string[]> = {
    rosa: [
      '"Hé, jij daar. Drankje van het huis." Rosa schuift je een glas toe.',
      '"Er gaan geruchten over een grote deal vannacht. Dacht dat je het moest weten."',
      '"Je ziet er moe uit. Zware dag? Hier, op mijn kosten."',
    ],
    marco: [
      '"In mijn tijd deden we het anders. Maar jij... jij hebt potentieel."',
      '"Ik heb iets voor je achtergelaten. Bij de gebruikelijke plek."',
      '"Pas op voor de politie vandaag. Ik heb gehoord dat ze extra patrouilleren."',
    ],
    yilmaz: [
      '"Ik houd je in de gaten. Vergeet dat niet." Yilmaz loopt door.',
      '"Er is een inval gepland voor vanavond. Niet in jouw wijk. Maar toch."',
      '"Je hebt iets verdiend." Yilmaz legt discreet een envelop neer.',
    ],
    luna: [
      '"Psst! Ik heb iets gezien bij de markt. Vreemde types."',
      '"Er is een nieuw kindje op straat. Kun je helpen?"',
      '"Ik heb een kortere route gevonden. Scheelt je 10 minuten."',
    ],
    krow: [
      '"We moeten praten. Over business." Krow gebaart naar een stoel.',
      '"Ik heb gehoord dat je goed bezig bent. Indrukwekkend."',
      '"Er zijn nieuwe spelers in de stad. We moeten samenwerken."',
    ],
  };

  const npcMessages = messages[npc.id] || ['"..."'];
  const msg = npcMessages[Math.floor(Math.random() * npcMessages.length)];

  // Increase relationship slightly on encounter
  modifyNpcRelation(state, npc.id, 2);

  // Give small bonus based on relationship
  if (relValue >= 50) {
    if (npc.id === 'rosa') {
      state.money += 200;
      state.stats.totalEarned += 200;
    } else if (npc.id === 'marco' && relValue >= 55) {
      // Small crew healing
      state.crew.forEach(c => { if (c.hp < 100) c.hp = Math.min(100, c.hp + 3); });
    }
  }

  return { npcId: npc.id, message: `${npc.icon} ${npc.name}: ${msg}` };
}

/** Initialize default NPC relations */
export function createInitialNpcRelations(): Record<string, { value: number; met: boolean; lastInteractionDay: number; flags: string[] }> {
  return {
    rosa: { value: 0, met: false, lastInteractionDay: 0, flags: [] },
    marco: { value: 0, met: false, lastInteractionDay: 0, flags: [] },
    yilmaz: { value: 0, met: false, lastInteractionDay: 0, flags: [] },
    luna: { value: 0, met: false, lastInteractionDay: 0, flags: [] },
    krow: { value: 0, met: false, lastInteractionDay: 0, flags: [] },
  };
}
