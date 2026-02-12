import { GameState, GoodId } from './types';
import { GOODS, DISTRICTS, VEHICLES } from './constants';

interface CliffhangerOption {
  condition: (s: GameState) => boolean;
  text: string;
  icon: string;
}

const CLIFFHANGERS: CliffhangerOption[] = [
  {
    condition: (s) => Object.values(s.inventory).reduce((a, b) => a + (b || 0), 0) >= 5,
    text: 'Een mysterieuze koper arriveert morgen in de haven...',
    icon: '🕵️',
  },
  {
    condition: (s) => s.nemesis.alive && s.nemesis.cooldown <= 1,
    text: `Je Nemesis is gezien in de buurt. Hij plant iets...`,
    icon: '💀',
  },
  {
    condition: (s) => (s.personalHeat || 0) > 60,
    text: 'De politie plant een grote operatie. Wees voorbereid...',
    icon: '🚔',
  },
  {
    condition: (s) => s.auctionItems !== undefined && s.auctionItems.length > 0 && s.auctionItems.some(a => a.expiresDay - s.day <= 1),
    text: 'Een veiling sluit morgen. Laatste kans om te bieden...',
    icon: '🔨',
  },
  {
    condition: (s) => s.money >= 20000 && s.ownedVehicles.length < VEHICLES.length,
    text: 'Geruchten over een zeldzame deal bij het dealerschap...',
    icon: '🚗',
  },
  {
    condition: (s) => (s.familyRel.cartel || 0) < -30 || (s.familyRel.syndicate || 0) < -30 || (s.familyRel.bikers || 0) < -30,
    text: 'Een factie is woedend. Er wordt gesproken over wraak...',
    icon: '⚔️',
  },
  {
    condition: (s) => s.dirtyMoney > 10000,
    text: 'Een witwasser biedt morgen een eenmalige korting aan...',
    icon: '💰',
  },
  {
    condition: (s) => s.crew.some(c => (c.loyalty ?? 75) < 30),
    text: 'Een crewlid fluistert achter je rug. Loyaliteit wankelt...',
    icon: '🗡️',
  },
  {
    condition: (s) => s.day > 10 && s.ownedDistricts.length < 3,
    text: 'Een district is kwetsbaar. De machtsbalans verschuift...',
    icon: '🏙️',
  },
  {
    condition: (s) => s.activeMarketEvent !== null,
    text: 'De markt is in beroering. Morgen kan alles veranderen...',
    icon: '📈',
  },
];

const GENERIC_CLIFFHANGERS = [
  { text: 'Een onbekend nummer belt je morgenochtend...', icon: '📱' },
  { text: 'Er hangt iets in de lucht. Morgen wordt anders...', icon: '🌙' },
  { text: 'De straat praat. Iemand heeft plannen met jou...', icon: '👁️' },
  { text: 'Een oud contact duikt morgen weer op...', icon: '🤝' },
];

export function generateCliffhanger(state: GameState): { text: string; icon: string } {
  // Filter eligible contextual cliffhangers
  const eligible = CLIFFHANGERS.filter(c => c.condition(state));
  
  if (eligible.length > 0) {
    const pick = eligible[Math.floor(Math.random() * eligible.length)];
    return { text: pick.text, icon: pick.icon };
  }
  
  // Fallback to generic
  const generic = GENERIC_CLIFFHANGERS[Math.floor(Math.random() * GENERIC_CLIFFHANGERS.length)];
  return { text: generic.text, icon: generic.icon };
}
