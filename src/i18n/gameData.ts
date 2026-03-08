/**
 * Game Data Translations — English translations for game constants
 * Dutch is the default language in data files; this provides EN overrides keyed by ID.
 */

import { Language } from './types';

type TextMap = Record<string, Record<string, string>>;

// ===== DISTRICTS =====
const DISTRICTS_EN: TextMap = {
  port: { name: 'Port Nero', perk: '+10% Baggage & Smuggler Efficiency' },
  crown: { name: 'Crown Heights', perk: '-20% Heat Daily & Hacker Efficiency' },
  iron: { name: 'Iron Borough', perk: '-20% Crew Healing Cost' },
  low: { name: 'Lowrise', perk: 'Cheaper Solo Ops' },
  neon: { name: 'Neon Strip', perk: '+10% Casino Winnings & Launder Bonus' },
};

// ===== GOODS =====
const GOODS_EN: TextMap = {
  drugs: { name: 'Synthetica' },
  weapons: { name: 'Heavy Weapons' },
  tech: { name: 'Black Data' },
  luxury: { name: 'Stolen Art' },
  meds: { name: 'Medical Supplies' },
  explosives: { name: 'Explosives' },
  crypto: { name: 'Crypto Wallets' },
  chemicals: { name: 'Precursors' },
  electronics: { name: 'Stolen Chips' },
};

// ===== GOOD CATEGORIES =====
const GOOD_CATEGORIES_EN: TextMap = {
  drugs: { label: 'Drugs' },
  weapons: { label: 'Weapons' },
  tech: { label: 'Tech' },
  luxury: { label: 'Luxury' },
  meds: { label: 'Medical' },
  explosives: { label: 'Explosives' },
  crypto: { label: 'Crypto' },
  chemicals: { label: 'Chemical' },
  electronics: { label: 'Electronics' },
};

// ===== FAMILIES =====
const FAMILIES_EN: TextMap = {
  cartel: { name: 'Rojo Cartel', contact: 'El Serpiente', desc: 'Controls the port and drug trade.' },
  syndicate: { name: 'Blue Lotus', contact: 'Mr. Wu', desc: 'High-tech espionage from Crown Heights.' },
  bikers: { name: 'Iron Skulls', contact: 'Hammer', desc: 'Arms dealers in Iron Borough.' },
};

// ===== VEHICLES =====
const VEHICLES_EN: TextMap = {
  toyohata: { desc: 'A reliable Japanese classic.' },
  forgedyer: { desc: 'The workhorse of the harbor.' },
  bavamotor: { desc: 'German precision. Fast enough for anything.' },
  meridiolux: { desc: 'Status on wheels. Huge charm bonus.' },
  lupoghini: { desc: 'Pure arrogance. King of the strip.' },
  royaleryce: { desc: 'The ultimate symbol of power.' },
  noxreaper: { desc: 'Built in the shadows of Noxhaven. Unmatched in speed.' },
  obsidiancruiser: { desc: 'Armored luxury. A rolling vault for the real kingpin.' },
  phantomgt: { desc: 'Ghostly fast, invisible to radar. Legendary.' },
};

// ===== SOLO OPERATIONS =====
const SOLO_OPS_EN: TextMap = {
  pickpocket: { name: 'Pickpocketing', desc: 'Pickpocketing at the subway.' },
  atm_skimming: { name: 'ATM Skimming', desc: 'Place skimmers on an ATM.' },
  car_theft: { name: 'Car Theft', desc: 'Steal a luxury car for export.' },
  store_robbery: { name: 'Jeweler Robbery', desc: 'Armed robbery in broad daylight.' },
  crypto_heist: { name: 'Crypto Heist', desc: 'Hack a cold storage wallet.' },
};

// ===== SOLO OP DISTRICT DESCRIPTIONS =====
const SOLO_OP_DISTRICT_DESC_EN: Record<string, Record<string, string>> = {
  pickpocket: {
    neon: 'Rob drunk gamblers near the clubs on the Strip.',
    port: 'Pickpocket tipsy dockworkers after their shift.',
    crown: 'Steal from inattentive investors near the penthouse.',
    iron: 'Grab factory workers\' wages at the gate.',
    low: 'Rob dealers in the alleys of Lowrise.',
  },
  atm_skimming: {
    neon: 'Skim gambler ATMs next to the Velvet Room.',
    port: 'Place skimmers on the outdated harbor ATM.',
    crown: 'Hack the high-tech ATMs of Crown Heights.',
    iron: 'Skim the unguarded ATM at the factory gate.',
    low: 'Tap the welfare ATM in the phone booth.',
  },
  car_theft: {
    neon: 'Steal a Ferrari from a partying influencer.',
    port: 'Jack the Porsche of a harbor boss at Dock 7.',
    crown: 'Grab a Lamborghini at valet parking.',
    iron: 'Steal Hammer\'s armored Mercedes-AMG.',
    low: 'Jack a tuned Civic from the racing scene.',
  },
  store_robbery: {
    neon: 'Rob the luxury watch shop on the Strip.',
    port: 'Rob the smuggling office at Dock 9.',
    crown: 'Crack the exclusive jeweler with laser security.',
    iron: 'Rob the pawnbroker of Iron Borough.',
    low: 'Rob the gold dealer on the corner.',
  },
  crypto_heist: {
    neon: 'Hack the illegal exchange behind the club.',
    port: 'Crack the offshore server on a cargo ship.',
    crown: 'Break into a hedge fund\'s data center.',
    iron: 'Plunder the illegal mining farm in the factory.',
    low: 'Steal the wallet of a teenage crypto miner.',
  },
};

// ===== CONTRACT TEMPLATES =====
const CONTRACT_TEMPLATES_EN: Record<string, string> = {
  'Koeriersdienst': 'Courier Service',
  'Rivalen Intimideren': 'Rival Intimidation',
  'Inbraak': 'Burglary',
  'Datadiefstal': 'Data Theft',
  'Wapenlevering': 'Arms Delivery',
  'Bescherming Bieden': 'Protection Service',
  'Surveillance Missie': 'Surveillance Mission',
  'Safe Kraken': 'Safe Cracking',
  'Smokkelroute Openen': 'Open Smuggling Route',
  'Server Hack': 'Server Hack',
};

// ===== BUSINESSES =====
const BUSINESSES_EN: TextMap = {
  restaurant: { name: 'Ristorante Nero', desc: 'Laundromat for dirty money.' },
  club: { name: 'Club Paradiso', desc: 'Nightclub with dubious guests.' },
  autogarage: { name: 'Tony\'s Auto Garage', desc: 'Garage business and chop shop.' },
  ammo_factory: { name: 'Ammo Factory', desc: 'Produces 3 bullets daily.' },
  haven_import: { name: 'Harbor Warehouse Import/Export', desc: 'Legal import as a cover for contraband.' },
  goudhandel: { name: 'Gold Trade De Kroon', desc: 'Precious metals and jewels — perfect laundering operation.' },
  escort: { name: 'Neon Escort Agency', desc: 'Exclusive escort service with wealthy clients.' },
  bouwbedrijf: { name: 'Construction Co. Ironworks', desc: 'Contractor laundering large sums through fake invoices.' },
  cryptobeurs: { name: 'CryptoExchange NoxCoin', desc: 'Crypto platform — high yield, digital laundering.' },
  hotel: { name: 'Hotel Noxhaven Grand', desc: 'The crown jewel — luxury hotel with VIP guests and maximum coverage.' },
};

// ===== GEAR =====
const GEAR_EN: TextMap = {
  glock: { desc: '+2 Strength. Reliable.' },
  shotgun: { desc: '+4 Strength. Short range, devastating.' },
  ak47: { desc: '+5 Strength. Heavy firepower.' },
  sniper: { desc: '+7 Strength. Long-range precision. Small clip, devastating damage.' },
  vest: { desc: '+1 Strength & Defense.' },
  suit: { name: 'Italian Suit', desc: '+4 Charisma. Class.' },
  phone: { desc: '+1 Intellect.' },
  laptop: { desc: '+4 Intellect. Deep web.' },
  cartel_blade: { desc: '+8 Strength. Legendary blade of El Serpiente. No ammo needed.' },
  lotus_implant: { desc: '+7 Intellect, +2 Charisma.' },
  skull_armor: { desc: '+5 Strength. Unbreakable.' },
  voidcaster: { desc: '+12 Strength. Experimental prototype. Prestige-only.' },
  nox_exosuit: { desc: '+8 Strength, +3 Charisma. Armored exoskeleton of Noxhaven-tech.' },
  quantum_deck: { desc: '+10 Intellect, +1 Charisma. Crack any system. Prestige-only.' },
  obsidian_edge: { desc: '+15 Strength. Monomolecular knife. The ultimate silent killer.' },
};

// ===== AMMO =====
const AMMO_EN: TextMap = {
  ammo_small: { name: '10 Bullets' },
  ammo_medium: { name: '25 Bullets' },
  ammo_large: { name: '50 Bullets' },
  ammo_crate: { name: '100 Bullets' },
};

const AMMO_TYPE_LABELS_EN: Record<string, string> = {
  '9mm': 'Bullets',
  '7.62mm': 'Bullets',
  'shells': 'Bullets',
};

// ===== SPECIAL AMMO =====
const SPECIAL_AMMO_EN: TextMap = {
  armor_piercing: { desc: 'Ignores 50% of enemy armor. +20% more expensive.' },
  hollowpoints: { desc: '1.5x damage vs unarmored, -50% vs armor.' },
  tracer: { desc: '+15% accuracy, reveals enemy location.' },
};

// ===== PROPERTIES =====
const PROPERTIES_EN: TextMap = {
  kraakpand: { name: 'Squat', desc: 'An abandoned building in the slums. Better than the streets.' },
  appartement: { name: 'Apartment', desc: 'A modest flat with running water and a lock on the door.' },
  penthouse: { name: 'Penthouse', desc: 'Luxurious penthouse with a view of the city. Status and comfort.' },
  villa: { name: 'Villa', desc: 'A fortified villa with every luxury. The ultimate symbol of power.' },
};

// ===== EDUCATION / COURSES =====
const COURSES_EN: TextMap = {
  street_smarts: { name: 'Street Smarts', desc: 'Learn to read the streets and increase your chance of successful operations.', perk: '+5% crime success' },
  forensic_chemistry: { name: 'Forensic Chemistry', desc: 'Improve your knowledge of drug production for higher quality.', perk: '+15% drug quality' },
  financial_law: { name: 'Financial Law', desc: 'Learn to launder money more effectively with less loss.', perk: '-10% laundering costs' },
  weapons_training: { name: 'Weapons Training', desc: 'Intensive shooting training for more combat damage.', perk: '+10% combat damage' },
  cybersecurity: { name: 'Cybersecurity', desc: 'Learn to crack systems and increase your hacking success.', perk: '+10% hacking success' },
  first_aid: { name: 'First Aid', desc: 'Speed up your recovery after hospitalizations.', perk: '-20% recovery time' },
  negotiation: { name: 'Negotiation', desc: 'Smarter deals for more trading profit.', perk: '+10% trade profit' },
  lockpicking: { name: 'Lockpicking Masterclass', desc: 'Increase your chance of successful heists.', perk: '+15% heist success' },
  intimidation: { name: 'Intimidation Techniques', desc: 'Learn to break enemies faster in combat.', perk: '+8% PvP advantage' },
  smuggling_routes: { name: 'Smuggling Routes', desc: 'Learn secret routes to reduce customs risk.', perk: '-25% smuggling risk' },
};

// ===== BACKSTORIES =====
const BACKSTORIES_EN: TextMap = {
  weduwnaar: {
    name: 'The Widower',
    subtitle: 'Revenge is a dish best served cold',
    desc: 'Your partner was killed by the police. You want revenge.',
    longDesc: 'A routine check that escalated. A warning shot that was no warning. They took everything from you — now you take everything from them. The streets of Noxhaven know your pain, and they will learn your fury.',
    mmoPerkLabel: 'Blood Pact',
    mmoPerkDesc: '+10% PvP damage & +10 starting relation with Bikers',
  },
  bankier: {
    name: 'The Fallen Banker',
    subtitle: 'Money is the root of all power',
    desc: 'You lost everything through a corrupt deal. Now you take it back.',
    longDesc: 'You were the youngest VP at Van der Berg & Partners. Until you discovered your colleagues were siphoning millions — and using you as the scapegoat. Everything lost: career, home, reputation. But you know the system inside out. And that\'s your greatest weapon.',
    mmoPerkLabel: 'Insider Trading',
    mmoPerkDesc: '-15% trade costs on the shared market',
  },
  straatkind: {
    name: 'The Street Kid',
    subtitle: 'The street is my university',
    desc: 'Grew up in Lowrise, nothing to lose. Everything to gain.',
    longDesc: 'No parents, no home, no rules. The streets of Lowrise were your cradle and your school. You learned to talk before you learned to read — and you learned to fight before you learned to talk. Now you\'re grown, and the city that raised you will be yours.',
    mmoPerkLabel: 'Street Network',
    mmoPerkDesc: 'Extra crew slot at start & 20% faster heat reduction',
  },
};

// ===== MARKET EVENTS =====
const MARKET_EVENTS_EN: TextMap = {
  drug_bust: { name: '💊 Drug Bust', desc: 'Police raid on major lab — Synthetica scarce!' },
  arms_deal: { name: '🔫 Arms Embargo', desc: 'Border control strengthened — weapon prices plummet.' },
  data_leak: { name: '💻 Data Leak', desc: 'Major hack revealed — black data is worthless.' },
  art_forgery: { name: '🎨 Forgeries', desc: 'Market flooded with fakes — art prices drop.' },
  med_shortage: { name: '💉 Medicine Shortage', desc: 'Hospital supplies depleted — medical goods in high demand!' },
  port_blockade: { name: '🚢 Port Blockade', desc: 'Smuggling route blocked — everything more expensive via the harbor.' },
  tech_boom: { name: '📡 Tech Boom', desc: 'Demand for hacked data explodes!' },
  luxury_auction: { name: '👑 Secret Auction', desc: 'Wealthy collectors bidding — art prices rise!' },
  cartel_war: { name: '⚔️ Cartel War', desc: 'Cartels at war — drugs & weapons volatile.' },
  police_sweep: { name: '🚔 Major Raid', desc: 'Police everywhere — all black market prices drop.' },
};

// ===== RACES =====
const RACES_EN: TextMap = {
  street: { name: 'Street Race', desc: 'Illegal race through Lowrise. Quick money, low risk.' },
  harbor: { name: 'Harbor Run', desc: 'Dangerous race along the docks of Port Nero.' },
  neon_gp: { name: 'Neon Grand Prix', desc: 'The ultimate illegal race on the Neon Strip.' },
};

// ===== RACE NPCs =====
const RACE_NPCS_EN: Record<string, string> = {
  'Getunede Supra': 'Tuned Supra',
  'Zwarte Mustang': 'Black Mustang',
  'Rode Ferrari': 'Red Ferrari',
  'Witte Porsche': 'White Porsche',
  'Gepantserde BMW': 'Armored BMW',
  'Zilveren Mercedes': 'Silver Mercedes',
  'Groene Lambo': 'Green Lambo',
  'Matzwarte Venom GT': 'Matte Black Venom GT',
  'Paarse Pagani': 'Purple Pagani',
  'Titanium NSX': 'Titanium NSX',
};

// ===== UNIQUE VEHICLES =====
const UNIQUE_VEHICLES_EN: TextMap = {
  decker_phantom: { desc: 'The personal vehicle of Commissioner Decker. Legendary.', unlockCondition: 'Defeat Decker (final boss)' },
  cartel_bulldozer: { desc: 'An armored monster from the cartel. Indestructible.', unlockCondition: 'Conquer all 3 factions' },
  nemesis_trophy: { desc: 'Built from the wrecks of your defeated enemies.', unlockCondition: 'Defeat 3 nemesis generations' },
  gouden_klassiek: { name: 'Golden Classic', desc: 'A fully gilded classic car. Ultimate status symbol.', unlockCondition: 'Own all 6 regular vehicles' },
};

// ===== VEHICLE UPGRADES =====
const VEHICLE_UPGRADES_EN: TextMap = {
  armor: { name: 'Armor', desc: 'Reduces damage at checkpoints and combat.' },
  speed: { name: 'Engine', desc: 'Lower travel costs, fewer checkpoints & interception.' },
  storage: { name: 'Storage', desc: 'More cargo space for trading.' },
};

// ===== BOSS DATA =====
const BOSS_DATA_EN: TextMap = {
  cartel: { desc: 'Leader of the Rojo Cartel. Ruthless.' },
  syndicate: { desc: 'Blue Lotus mastermind. Deadly precise.' },
  bikers: { desc: 'Iron Skulls president. A wall of steel.' },
};

// ===== CONQUEST PHASE LABELS =====
const CONQUEST_PHASE_LABELS_EN = [
  'Not Started',
  'Outpost Conquered',
  'Defense Breached',
  'Leader Accessible',
];

// ===== KARMA LABELS =====
const KARMA_LABELS_EN: Record<string, string> = {
  'Intimidatie succeskans': 'Intimidation success chance',
  'Reputatie gain': 'Reputation gain',
  'Intimidatie opbrengst': 'Intimidation yield',
  'Vijandige factie-schade': 'Hostile faction damage',
  'Crew healing': 'Crew healing',
  'Crew schade (bij falen)': 'Crew damage (on failure)',
  'Politie-inval kans': 'Police raid chance',
  'Extra heat decay/dag': 'Extra heat decay/day',
  'Diplomatie korting': 'Diplomacy discount',
  'Verkoopprijs bonus': 'Sell price bonus',
  'meedogenloos': 'ruthless',
  'eerbaar': 'honorable',
  'neutraal': 'neutral',
};

// ===== EDUCATION TIME =====
const EDUCATION_TIME_EN: Record<string, string> = {
  'Klaar!': 'Done!',
};

// ===== PLAYER TITLES =====
const PLAYER_TITLES_EN: TextMap = {
  street_rat: { name: 'Street Rat' },
  enforcer: { name: 'Enforcer' },
  drug_baron: { name: 'Drug Baron', req: 'Drug Empire Tier 3' },
  kingpin: { name: 'Kingpin', req: 'Own 3+ districts' },
  shadow: { name: 'Shadow', req: '100+ stealth operations' },
  tycoon: { name: 'Tycoon', req: '€1M+ earned' },
  warlord: { name: 'Warlord', req: '10 gang wars won' },
  legend: { name: 'Legend', req: 'Prestige Level 3+' },
  ghost: { name: 'Ghost', req: 'Disappear 10x from Most Wanted' },
  philanthropist: { name: 'Philanthropist', req: 'Karma 80+' },
};

// ===== CORRUPTION STRINGS =====
const CORRUPTION_EN: Record<string, string> = {
  'VERRAAD!': 'BETRAYAL!',
  'Corruptie Event': 'Corruption Event',
  'BEGREPEN': 'UNDERSTOOD',
  'Verraadrisico': 'Betrayal risk',
  'Laag': 'Low',
  'Gemiddeld': 'Medium',
  'Hoog': 'High',
};

// ===== SOCIAL / HELP PANEL =====
const SOCIAL_EN: Record<string, string> = {
  'Gevangenen Bevrijden': 'Break Prisoners Free',
  'Spelers Reviven': 'Revive Players',
  'BEVRIJDEN': 'BREAK FREE',
  'REVIVE': 'REVIVE',
  'Geen gevangenen gevonden.': 'No prisoners found.',
  'Niemand in het ziekenhuis.': 'No one in the hospital.',
  'Gevangene Bevrijden': 'Break Prisoner Free',
  'Speler Reviven': 'Revive Player',
  'Onbekend': 'Unknown',
};

// ===== STAT NAMES =====
const STAT_NAMES_EN: Record<string, string> = {
  'Kracht': 'Strength',
  'Vernuft': 'Intellect',
  'Charisma': 'Charisma',
};

// ========== MAIN LOOKUP FUNCTION ==========

/**
 * Get translated text for game data.
 * Falls back to the original Dutch text if no translation exists.
 */
export function getGameText(
  lang: Language,
  category: string,
  id: string,
  field: string,
  fallback: string
): string {
  if (lang === 'nl') return fallback;

  const map = EN_MAPS[category];
  if (!map) return fallback;

  const item = (map as any)[id];
  if (!item) return fallback;

  if (typeof item === 'string') return item;
  return item[field] || fallback;
}

/**
 * Simple string lookup (for labels, karma, etc.)
 */
export function getGameString(lang: Language, key: string, fallback?: string): string {
  if (lang === 'nl') return fallback || key;
  return ALL_STRINGS_EN[key] || fallback || key;
}

/**
 * Get conquest phase label
 */
export function getConquestPhaseLabel(lang: Language, index: number): string {
  if (lang === 'en') return CONQUEST_PHASE_LABELS_EN[index] || '';
  return '';  // Falls back to Dutch constants
}

/**
 * Get contract template name
 */
export function getContractName(lang: Language, dutchName: string): string {
  if (lang === 'nl') return dutchName;
  return CONTRACT_TEMPLATES_EN[dutchName] || dutchName;
}

/**
 * Get race NPC vehicle name
 */
export function getRaceNpcVehicle(lang: Language, dutchName: string): string {
  if (lang === 'nl') return dutchName;
  return RACE_NPCS_EN[dutchName] || dutchName;
}

/**
 * Get solo op district description
 */
export function getSoloOpDistrictDesc(lang: Language, opId: string, districtId: string, fallback: string): string {
  if (lang === 'nl') return fallback;
  return SOLO_OP_DISTRICT_DESC_EN[opId]?.[districtId] || fallback;
}

// Category-to-map lookup
const EN_MAPS: Record<string, TextMap> = {
  districts: DISTRICTS_EN,
  goods: GOODS_EN,
  goodCategories: GOOD_CATEGORIES_EN,
  families: FAMILIES_EN,
  vehicles: VEHICLES_EN,
  soloOps: SOLO_OPS_EN,
  businesses: BUSINESSES_EN,
  gear: GEAR_EN,
  ammo: AMMO_EN,
  specialAmmo: SPECIAL_AMMO_EN,
  properties: PROPERTIES_EN,
  courses: COURSES_EN,
  backstories: BACKSTORIES_EN,
  marketEvents: MARKET_EVENTS_EN,
  races: RACES_EN,
  uniqueVehicles: UNIQUE_VEHICLES_EN,
  vehicleUpgrades: VEHICLE_UPGRADES_EN,
  bossData: BOSS_DATA_EN,
  playerTitles: PLAYER_TITLES_EN,
};

// Flat string lookup (merges all simple string maps)
const ALL_STRINGS_EN: Record<string, string> = {
  ...KARMA_LABELS_EN,
  ...CORRUPTION_EN,
  ...SOCIAL_EN,
  ...STAT_NAMES_EN,
  ...AMMO_TYPE_LABELS_EN,
  ...EDUCATION_TIME_EN,
};
