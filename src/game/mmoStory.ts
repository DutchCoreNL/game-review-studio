/**
 * Backstory Crossover Events — Special events when players with different backstories
 * meet in the same district. Each pair has unique interactions.
 */

export interface BackstoryCrossover {
  id: string;
  pair: [string, string]; // backstory IDs
  title: string;
  description: string;
  district?: string;
  effects: {
    moneyBoth: number;
    repBoth: number;
    heatBoth: number;
    karmaBoth: number;
  };
}

export const BACKSTORY_CROSSOVERS: BackstoryCrossover[] = [
  {
    id: 'weduwnaar_bankier',
    pair: ['weduwnaar', 'bankier'],
    title: 'Gedeelde Vijanden',
    description: 'Jullie herkennen elkaars verhaal. De Weduwnaar verloor alles door dezelfde financiële samenzwering die de Bankier probeerde te onthullen. Samen bezitten jullie de puzzelstukken om de waarheid boven water te krijgen. Werk samen — of gebruik de info tegen elkaar.',
    effects: { moneyBoth: 5000, repBoth: 30, heatBoth: 5, karmaBoth: 0 },
  },
  {
    id: 'bankier_straatkind',
    pair: ['bankier', 'straatkind'],
    title: 'Twee Werelden',
    description: 'De Bankier heeft de connecties; het Straatkind kent de straat. Een onwaarschijnlijk duo, maar samen openen jullie deuren die voor anderen gesloten blijven. De Bankier kent een zwitsers rekeningnummer; het Straatkind weet hoe je ongezien door de stad beweegt.',
    effects: { moneyBoth: 8000, repBoth: 20, heatBoth: -5, karmaBoth: 5 },
  },
  {
    id: 'straatkind_weduwnaar',
    pair: ['straatkind', 'weduwnaar'],
    title: 'Verborgen Plekken',
    description: 'Het Straatkind kent geheime tunnels en vergeten kelders. De Weduwnaar heeft een lijst met namen van degenen die zijn partner vermoordden. In de verborgen plekken van de stad vinden jullie bewijs dat hen allemaal kan laten vallen.',
    effects: { moneyBoth: 3000, repBoth: 40, heatBoth: 10, karmaBoth: -5 },
  },
];

/** NPC Collective Mood states */
export type NpcMoodStatus = 'hostile' | 'wary' | 'neutral' | 'friendly' | 'legendary';

export interface NpcMoodEffect {
  status: NpcMoodStatus;
  minScore: number;
  districtBonus?: string;
  description: string;
}

export const NPC_MOOD_THRESHOLDS: NpcMoodEffect[] = [
  { status: 'hostile', minScore: -100, description: 'NPC is vijandig — events geblokkeerd, prijzen +20%' },
  { status: 'wary', minScore: -30, description: 'NPC is op zijn hoede — beperkte interactie' },
  { status: 'neutral', minScore: -10, description: 'NPC is neutraal — standaard interactie' },
  { status: 'friendly', minScore: 30, description: 'NPC is vriendelijk — district bonussen actief', districtBonus: 'trade_discount_5' },
  { status: 'legendary', minScore: 80, description: 'NPC is legendarisch — unieke quest beschikbaar', districtBonus: 'legendary_quest' },
];

export function getMoodStatus(score: number): NpcMoodStatus {
  if (score >= 80) return 'legendary';
  if (score >= 30) return 'friendly';
  if (score >= -10) return 'neutral';
  if (score >= -30) return 'wary';
  return 'hostile';
}

/** Arc choice → news broadcast templates */
export const ARC_NEWS_TEMPLATES: Record<string, Record<string, (playerName: string, district: string, success: boolean) => { text: string; icon: string; detail: string }>> = {
  informant: {
    inf_3a: (name, dist, ok) => ({
      text: ok ? `Geruchten over corrupte agent ontmaskerd in ${dist} — iemand heeft bewijs` : `Poging tot chantage mislukt in ${dist}`,
      icon: ok ? '🕵️' : '❌',
      detail: ok ? `Een onbekende speler heeft Agent De Vries onder druk gezet. Dit opent mogelijkheden voor iedereen in het district.` : `De corruptie in ${dist} blijft verborgen.`,
    }),
    inf_3b: (name, dist, ok) => ({
      text: ok ? `Gewapende confrontatie bij politiekantoor in ${dist} — agent neergehaald` : `Schietpartij gemeld bij politiekantoor ${dist}`,
      icon: '💥',
      detail: ok ? `Een dappere crimineel heeft Agent De Vries geconfronteerd en gewonnen.` : `Een mislukte confrontatie veroorzaakte chaos.`,
    }),
    inf_3c: (name, dist, ok) => ({
      text: ok ? `Corrupte agent gearresteerd in ${dist} na anonieme tip` : `Anonieme tip leidt nergens toe in ${dist}`,
      icon: ok ? '👮' : '📋',
      detail: ok ? `Inspecteur Bakker heeft Agent De Vries gearresteerd. De onderwereld profiteert.` : `De informatie was niet overtuigend genoeg.`,
    }),
  },
  erfenis: {
    erf_4a: (name, dist, ok) => ({
      text: ok ? `Legendarisch Vasari-fortuin gevonden! Schatjager scoort miljoenen` : `Zoektocht naar Vasari-fortuin eindigt in teleurstelling`,
      icon: ok ? '💎' : '🗝️',
      detail: ok ? `Het mythische fortuin van Don Vasari is na decennia eindelijk boven water gekomen.` : `De kluis bleef gesloten. Het fortuin wacht op de volgende zoeker.`,
    }),
  },
  rivaal: {
    riv_4a: (name, dist, ok) => ({
      text: ok ? `Rivaal verslagen in episch duel — nieuwe machtsbalans in Noxhaven` : `Rivaal ontsnapt na confrontatie — de strijd gaat door`,
      icon: ok ? '⚔️' : '🏃',
      detail: ok ? `Een langlopende rivaliteit is beslecht. De overwinnaar claimt de troon.` : `De rivaal leeft nog. Wraak is slechts een kwestie van tijd.`,
    }),
  },
};
