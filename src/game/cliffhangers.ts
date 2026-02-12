import { GameState, DistrictId } from './types';
import { DISTRICTS, VEHICLES } from './constants';
import { NPC_DEFS, getNpcTier } from './npcs';

interface CliffhangerOption {
  condition: (s: GameState) => boolean;
  generate: (s: GameState) => { text: string; icon: string };
}

/** Pick a random element from an array */
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Get the display name for a district id */
function districtName(id: string): string {
  const d = DISTRICTS[id];
  return d?.name ?? id;
}

/** Get a random unowned district name */
function randomUnownedDistrict(s: GameState): string {
  const allIds = Object.keys(DISTRICTS) as DistrictId[];
  const unowned = allIds.filter(id => !s.ownedDistricts.includes(id));
  if (unowned.length === 0) return 'een district';
  return DISTRICTS[pick(unowned)].name;
}

/** Get the angriest faction name */
function angriestFaction(s: GameState): string {
  const factions: { id: string; name: string }[] = [
    { id: 'cartel', name: 'Het Kartel' },
    { id: 'syndicate', name: 'Het Syndicaat' },
    { id: 'bikers', name: 'De Bikers' },
  ];
  let worst = factions[0];
  let worstVal = s.familyRel[worst.id] || 0;
  for (const f of factions) {
    const val = s.familyRel[f.id] || 0;
    if (val < worstVal) { worst = f; worstVal = val; }
  }
  return worst.name;
}

/** Get name of a low-loyalty crew member */
function disloyalCrew(s: GameState): string {
  const low = s.crew.filter(c => (c.loyalty ?? 75) < 30);
  return low.length > 0 ? pick(low).name : 'Een crewlid';
}

/** Get a high-relation NPC name for positive teasers */
function friendlyNpc(s: GameState): { name: string; icon: string } | null {
  for (const npc of NPC_DEFS) {
    const tier = getNpcTier(s, npc.id);
    if (tier && tier.min >= 50) return { name: npc.name, icon: npc.icon };
  }
  return null;
}

const CLIFFHANGERS: CliffhangerOption[] = [
  {
    condition: (s) => Object.values(s.inventory).reduce((a, b) => a + (b || 0), 0) >= 5,
    generate: (s) => ({
      text: `Een mysterieuze koper arriveert morgen in ${districtName('port')}. Hij zoekt precies wat jij hebt...`,
      icon: '🕵️',
    }),
  },
  {
    condition: (s) => s.nemesis.alive && s.nemesis.cooldown <= 1,
    generate: (s) => ({
      text: `Je Nemesis is gezien in ${districtName(s.loc)}. Hij plant iets...`,
      icon: '💀',
    }),
  },
  {
    condition: (s) => (s.personalHeat || 0) > 60,
    generate: (s) => {
      const npc = getNpcTier(s, 'yilmaz');
      const hint = npc && npc.min >= 30
        ? ' Yilmaz probeerde je te waarschuwen...'
        : '';
      return {
        text: `De politie plant een grote operatie in ${districtName(s.loc)}.${hint}`,
        icon: '🚔',
      };
    },
  },
  {
    condition: (s) => s.auctionItems !== undefined && s.auctionItems.length > 0 && s.auctionItems.some(a => a.expiresDay - s.day <= 1),
    generate: () => ({
      text: 'Een veiling sluit morgen. Laatste kans om te bieden...',
      icon: '🔨',
    }),
  },
  {
    condition: (s) => s.money >= 20000 && s.ownedVehicles.length < VEHICLES.length,
    generate: () => ({
      text: 'Geruchten over een zeldzame deal bij het dealerschap in Neon Strip...',
      icon: '🚗',
    }),
  },
  {
    condition: (s) => (s.familyRel.cartel || 0) < -30 || (s.familyRel.syndicate || 0) < -30 || (s.familyRel.bikers || 0) < -30,
    generate: (s) => ({
      text: `${angriestFaction(s)} is woedend. Er wordt gesproken over wraak...`,
      icon: '⚔️',
    }),
  },
  {
    condition: (s) => s.dirtyMoney > 10000,
    generate: (s) => {
      const rosa = getNpcTier(s, 'rosa');
      const hint = rosa && rosa.min >= 50
        ? ' Rosa kent iemand die kan helpen...'
        : '';
      return {
        text: `Een witwasser biedt morgen een eenmalige korting aan.${hint}`,
        icon: '💰',
      };
    },
  },
  {
    condition: (s) => s.crew.some(c => (c.loyalty ?? 75) < 30),
    generate: (s) => ({
      text: `${disloyalCrew(s)} fluistert achter je rug. Loyaliteit wankelt...`,
      icon: '🗡️',
    }),
  },
  {
    condition: (s) => s.day > 10 && s.ownedDistricts.length < 3,
    generate: (s) => ({
      text: `${randomUnownedDistrict(s)} is kwetsbaar. De machtsbalans verschuift...`,
      icon: '🏙️',
    }),
  },
  {
    condition: (s) => s.activeMarketEvent !== null,
    generate: () => ({
      text: 'De markt is in beroering. Morgen kan alles veranderen...',
      icon: '📈',
    }),
  },
  {
    condition: (s) => {
      const npc = friendlyNpc(s);
      return npc !== null;
    },
    generate: (s) => {
      const npc = friendlyNpc(s)!;
      return {
        text: `${npc.name} heeft morgen een voorstel voor je. Het klinkt belangrijk...`,
        icon: npc.icon,
      };
    },
  },
  {
    condition: (s) => {
      const luna = getNpcTier(s, 'luna');
      return luna !== null && luna.min >= 20;
    },
    generate: () => ({
      text: 'Luna heeft iets gezien in de steegjes van Lowrise. Ze wil je spreken...',
      icon: '🌙',
    }),
  },
  {
    condition: (s) => {
      const marco = getNpcTier(s, 'marco');
      return marco !== null && marco.min >= 25;
    },
    generate: () => ({
      text: 'Oude Marco heeft een verhaal uit het verleden. En een waarschuwing...',
      icon: '👴',
    }),
  },
];

const GENERIC_CLIFFHANGERS: ((s: GameState) => { text: string; icon: string })[] = [
  (s) => ({ text: `Een onbekend nummer belt je morgenochtend vanuit ${districtName(s.loc)}...`, icon: '📱' }),
  () => ({ text: 'Er hangt iets in de lucht. Morgen wordt anders...', icon: '🌙' }),
  (s) => ({ text: `De straat praat in ${districtName(s.loc)}. Iemand heeft plannen met jou...`, icon: '👁️' }),
  () => ({ text: 'Een oud contact duikt morgen weer op...', icon: '🤝' }),
  (s) => {
    const krow = getNpcTier(s, 'krow');
    if (krow && krow.min >= 30) return { text: 'Viktor Krow wil praten. Over business...', icon: '🦅' };
    return { text: 'Iemand volgt je al de hele dag. Morgen confronteer je hem...', icon: '👁️' };
  },
];

export function generateCliffhanger(state: GameState): { text: string; icon: string } {
  const eligible = CLIFFHANGERS.filter(c => c.condition(state));

  if (eligible.length > 0) {
    return pick(eligible).generate(state);
  }

  return pick(GENERIC_CLIFFHANGERS)(state);
}
