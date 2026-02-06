import { District, Vehicle, Good, Family, SoloOperation, ContractTemplate, HQUpgrade, GearItem, Business, Achievement, DistrictId, GoodId, FamilyId, FactionActionType, RandomEvent } from './types';

export const DISTRICTS: Record<string, District> = {
  port: { name: 'Port Nero', cost: 12000, income: 450, cx: 100, cy: 90, mods: { drugs: 1.0, weapons: 0.6, tech: 1.2, luxury: 1.3, meds: 0.9 }, perk: "+10% Bagage & Smokkelaar Efficiency" },
  crown: { name: 'Crown Heights', cost: 85000, income: 2800, cx: 265, cy: 85, mods: { drugs: 1.8, weapons: 1.5, tech: 1.4, luxury: 2.5, meds: 1.2 }, perk: "-20% Heat Daily & Hacker Efficiency" },
  iron: { name: 'Iron Borough', cost: 25000, income: 900, cx: 215, cy: 200, mods: { drugs: 1.1, weapons: 1.1, tech: 0.7, luxury: 1.2, meds: 1.0 }, perk: "-20% Crew Healing Cost" },
  low: { name: 'Lowrise', cost: 8000, income: 250, cx: 100, cy: 205, mods: { drugs: 0.5, weapons: 1.3, tech: 1.0, luxury: 0.8, meds: 1.1 }, perk: "Goedkopere Solo Ops" },
  neon: { name: 'Neon Strip', cost: 45000, income: 1600, cx: 315, cy: 200, mods: { drugs: 1.4, weapons: 1.2, tech: 1.6, luxury: 1.5, meds: 0.8 }, perk: "+10% Casino Winst & Witwas Bonus" }
};

export const VEHICLES: Vehicle[] = [
  { id: 'toyohata', name: 'Toyo-Hata Swift', cost: 0, storage: 5, speed: 1, armor: 0, charm: 1, desc: 'Een betrouwbare Japanse klassieker.' },
  { id: 'forgedyer', name: 'Forge-Dyer Heavy', cost: 9500, storage: 30, speed: -1, armor: 3, charm: -1, desc: 'Het werkpaard van de haven.' },
  { id: 'bavamotor', name: 'Bava-Motor Shadow', cost: 24000, storage: 12, speed: 4, armor: 1, charm: 3, desc: 'Duitse precisie. Snel genoeg voor alles.' },
  { id: 'meridiolux', name: 'Meridio-Lux Baron', cost: 48000, storage: 15, speed: 2, armor: 2, charm: 8, desc: 'Status op wielen. Enorme charm-bonus.' },
  { id: 'lupoghini', name: 'Lupo-Ghini Strike', cost: 135000, storage: 8, speed: 7, armor: 1, charm: 12, desc: 'Pure arrogantie. Koning van de strip.' },
  { id: 'royaleryce', name: 'Royale-Ryce Eternal', cost: 350000, storage: 20, speed: 3, armor: 5, charm: 20, desc: 'Het ultieme symbool van macht.' }
];

export const GOODS: Good[] = [
  { id: 'drugs', name: 'Synthetica', base: 140, icon: 'Pipette', faction: 'cartel' },
  { id: 'weapons', name: 'Zware Wapens', base: 1400, icon: 'Shield', faction: 'bikers' },
  { id: 'tech', name: 'Zwarte Data', base: 800, icon: 'Cpu', faction: 'syndicate' },
  { id: 'luxury', name: 'Geroofde Kunst', base: 4500, icon: 'Gem', faction: null },
  { id: 'meds', name: 'Medische Voorraad', base: 550, icon: 'Pill', faction: null }
];

export const GOOD_CATEGORIES: Record<string, { color: string; bgColor: string; borderColor: string; label: string }> = {
  drugs: { color: 'text-blood', bgColor: 'bg-blood/10', borderColor: 'border-l-blood', label: 'Drugs' },
  weapons: { color: 'text-gold', bgColor: 'bg-gold/10', borderColor: 'border-l-gold', label: 'Wapens' },
  tech: { color: 'text-ice', bgColor: 'bg-ice/10', borderColor: 'border-l-ice', label: 'Tech' },
  luxury: { color: 'text-game-purple', bgColor: 'bg-game-purple/10', borderColor: 'border-l-game-purple', label: 'Luxe' },
  meds: { color: 'text-emerald', bgColor: 'bg-emerald/10', borderColor: 'border-l-emerald', label: 'Medisch' },
};

export const FAMILIES: Record<string, Family> = {
  cartel: { id: 'cartel', name: 'Rojo Cartel', contact: 'El Serpiente', desc: 'Controleert de haven en drugshandel.', color: '#b91c1c', home: 'port' },
  syndicate: { id: 'syndicate', name: 'Blue Lotus', contact: 'Mr. Wu', desc: 'Hightech spionage vanuit Crown Heights.', color: '#2563eb', home: 'crown' },
  bikers: { id: 'bikers', name: 'Iron Skulls', contact: 'Hammer', desc: 'Wapenhandelaren in Iron Borough.', color: '#d97706', home: 'iron' }
};

export const SOLO_OPERATIONS: SoloOperation[] = [
  { id: 'pickpocket', name: "Zakkenrollen", level: 1, stat: 'charm', risk: 15, heat: 5, reward: 300, desc: "Zakkenrollen bij de metro." },
  { id: 'atm_skimming', name: "ATM Skimming", level: 3, stat: 'brains', risk: 25, heat: 10, reward: 1200, desc: "Plaats skimmers in Crown Heights." },
  { id: 'car_theft', name: "Auto Diefstal", level: 5, stat: 'brains', risk: 40, heat: 20, reward: 2500, desc: "Steel een luxe wagen voor export." },
  { id: 'store_robbery', name: "Juwelier Overval", level: 7, stat: 'muscle', risk: 55, heat: 35, reward: 5000, desc: "Gewapende overval op klaarlichte dag." },
  { id: 'crypto_heist', name: "Crypto Heist", level: 10, stat: 'brains', risk: 70, heat: 15, reward: 12000, desc: "Hack een cold storage wallet." }
];

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  { name: "Koeriersdienst", risk: 15, heat: 8, rewardBase: 1200, type: 'delivery' },
  { name: "Rivalen Intimideren", risk: 45, heat: 25, rewardBase: 3500, type: 'combat' },
  { name: "Inbraak", risk: 55, heat: 35, rewardBase: 5500, type: 'stealth' },
  { name: "Datadiefstal", risk: 40, heat: 12, rewardBase: 4000, type: 'tech' },
  { name: "Wapenlevering", risk: 35, heat: 20, rewardBase: 2800, type: 'delivery' },
  { name: "Bescherming Bieden", risk: 25, heat: 10, rewardBase: 2000, type: 'combat' },
  { name: "Surveillance Missie", risk: 30, heat: 8, rewardBase: 2500, type: 'tech' },
  { name: "Safe Kraken", risk: 65, heat: 40, rewardBase: 8000, type: 'stealth' },
  { name: "Smokkelroute Openen", risk: 50, heat: 30, rewardBase: 6000, type: 'delivery' },
  { name: "Server Hack", risk: 60, heat: 15, rewardBase: 7000, type: 'tech' },
];

export const HQ_UPGRADES: HQUpgrade[] = [
  { id: 'security', name: 'Versterkte Deuren', cost: 5000, desc: 'Vermindert kans op aanvallen met 20%.' },
  { id: 'garage', name: 'Grotere Garage', cost: 8000, desc: '+10 Bagage ruimte.' },
  { id: 'server', name: 'Encrypted Server', cost: 12000, desc: 'Sneller Heat verlies (-10 p/d).' },
  { id: 'lab', name: 'Synthetica Lab', cost: 15000, desc: 'Produceer je eigen drugs.' }
];

export const GEAR: GearItem[] = [
  { id: 'glock', type: 'weapon', name: 'Glock 17', cost: 1500, stats: { muscle: 2 }, desc: '+2 Kracht. Betrouwbaar.', reqRep: null },
  { id: 'ak47', type: 'weapon', name: 'AK-47', cost: 4500, stats: { muscle: 5 }, desc: '+5 Kracht. Zwaar geschut.', reqRep: null },
  { id: 'vest', type: 'armor', name: 'Kevlar Vest', cost: 2500, stats: { muscle: 1 }, desc: '+1 Kracht & Defense.', reqRep: null },
  { id: 'suit', type: 'armor', name: 'Italiaans Pak', cost: 6000, stats: { charm: 4 }, desc: '+4 Charisma. Klasse.', reqRep: null },
  { id: 'phone', type: 'gadget', name: 'Burner Phone', cost: 1000, stats: { brains: 1 }, desc: '+1 Vernuft.', reqRep: null },
  { id: 'laptop', type: 'gadget', name: 'Hacker Laptop', cost: 5000, stats: { brains: 4 }, desc: '+4 Vernuft. Deep web.', reqRep: null },
  { id: 'cartel_blade', type: 'weapon', name: 'El Serpiente\'s Blade', cost: 12000, stats: { muscle: 8 }, desc: '+8 Kracht. Legendarisch.', reqRep: { f: 'cartel', val: 60 } },
  { id: 'lotus_implant', type: 'gadget', name: 'Neural Implant', cost: 18000, stats: { brains: 7, charm: 2 }, desc: '+7 Vernuft, +2 Charisma.', reqRep: { f: 'syndicate', val: 60 } },
  { id: 'skull_armor', type: 'armor', name: 'Skull Plate Armor', cost: 15000, stats: { muscle: 5 }, desc: '+5 Kracht. Onbreekbaar.', reqRep: { f: 'bikers', val: 60 } }
];

export const BUSINESSES: Business[] = [
  { id: 'restaurant', name: 'Ristorante Nero', cost: 10000, income: 400, clean: 300, desc: 'Wasstraat voor zwart geld.' },
  { id: 'club', name: 'Club Paradiso', cost: 25000, income: 800, clean: 600, desc: 'Nachtclub met dubieuze gasten.' },
  { id: 'autogarage', name: 'Tony\'s Autogarage', cost: 15000, income: 500, clean: 400, desc: 'Garagebedrijf en chop shop.' }
];

export const COMBAT_ENVIRONMENTS: Record<string, { name: string; actionName: string; desc: string; log: string; type: string }> = {
  port: { name: "Havenkade", actionName: "HINDERLAAG", desc: "Container val", log: "Je lokt de vijand tussen de containers...", type: "ambush" },
  crown: { name: "Penthouse", actionName: "HACK SYSTEEM", desc: "Brains Stun", log: "Je hackt het beveiligingssysteem...", type: "tech" },
  iron: { name: "Fabrieksvloer", actionName: "BRUTE FORCE", desc: "Muscle DMG", log: "Je gooit een stalen balk...", type: "brutal" },
  low: { name: "Steegje", actionName: "VUIL SPEL", desc: "Charm Trick", log: "Je speelt een vies spelletje...", type: "dirty" },
  neon: { name: "VIP Lounge", actionName: "VERDWIJN", desc: "Ontvlucht Kans", log: "Je duikt de menigte in...", type: "cover" }
};

export const BOSS_DATA: Record<string, { name: string; hp: number; attack: number; desc: string }> = {
  cartel: { name: 'El Serpiente', hp: 120, attack: 18, desc: 'Leider van het Rojo Cartel. Meedogenloos.' },
  syndicate: { name: 'Mr. Wu', hp: 100, attack: 22, desc: 'Blue Lotus mastermind. Dodelijk precies.' },
  bikers: { name: 'Hammer', hp: 150, attack: 15, desc: 'Iron Skulls president. Een muur van staal.' },
};

export const DISTRICT_FLAVOR: Record<string, { neutral: string; owned: string; high_heat: string }> = {
  port: { neutral: "Het ruikt naar zout, diesel en verraad.", owned: "De containers zijn nu van jou. Niemand beweegt zonder jouw toestemming.", high_heat: "De kustwacht patrouilleert. Elk schip wordt gecontroleerd." },
  crown: { neutral: "Glazen torens vol duistere geheimen.", owned: "Je kijkt neer op de stad. Letterlijk en figuurlijk.", high_heat: "Drones vliegen rond. Ze zoeken iemand... ze zoeken jou." },
  iron: { neutral: "Het geluid van metaal op metaal. Hier wordt gewerkt.", owned: "De fabrieken draaien. Jouw fabrieken.", high_heat: "Politiehonden bij elk kruispunt. De geur van angst." },
  low: { neutral: "Gebroken straatlantaarns en fluisterende schaduwen.", owned: "Zelfs de ratten werken voor jou nu.", high_heat: "Undercover agenten op elke hoek. Trust nobody." },
  neon: { neutral: "Neonlicht, muziek en verleidelijke beloftes.", owned: "Elke club, elk casino — van jou. De strip ademt jouw naam.", high_heat: "De politie doet invallen bij elke club. De muziek stopt even." }
};

export const NEWS_ITEMS = [
  "BREAKING: Mysterieuze explosie in Port Nero — politie onderzoekt...",
  "Crown Heights penthouse verkocht voor record bedrag...",
  "Iron Borough vakbond kondigt staking aan...",
  "Neon Strip: Nieuw casino opent deuren vanavond...",
  "WANTED: Onbekende figuur gezocht voor drugshandel...",
  "Lowrise bewoners klagen over toenemend geweld...",
  "Blue Lotus beschuldigd van cyber aanval op bank...",
  "Iron Skulls motorclub in verband met wapensmokkel...",
  "El Serpiente gezien in exclusief restaurant...",
];

export const RANDOM_EVENTS = [
  // Negative events
  { id: 'police_raid', title: 'Politie Inval!', description: 'De politie doet een inval in je operatie. Je verliest een deel van je voorraad.', type: 'negative' as const, minHeat: 40, effect: 'lose_inventory' },
  { id: 'faction_attack', title: 'Factie Aanval!', description: 'Een vijandige factie valt je operatie aan.', type: 'negative' as const, minHeat: 0, effect: 'crew_damage' },
  { id: 'tax_audit', title: 'Belastingcontrole', description: 'De belastingdienst neemt je schoon geld onder de loep.', type: 'negative' as const, minHeat: 20, effect: 'lose_money' },
  { id: 'vehicle_sabotage', title: 'Voertuig Gesaboteerd!', description: 'Iemand heeft aan je auto gezeten. Extra schade opgelopen.', type: 'negative' as const, minHeat: 30, effect: 'vehicle_damage' },
  // Positive events
  { id: 'tip_off', title: 'Insider Tip', description: 'Een informant geeft je waardevolle informatie over de markt.', type: 'positive' as const, minHeat: 0, effect: 'bonus_money' },
  { id: 'black_market_deal', title: 'Zwarte Markt Deal', description: 'Een anonieme koper biedt een premium voor je goederen.', type: 'positive' as const, minHeat: 0, effect: 'bonus_money' },
  { id: 'police_corruption', title: 'Corrupte Agent', description: 'Een agent biedt aan om bewijsmateriaal te laten verdwijnen.', type: 'positive' as const, minHeat: 30, effect: 'reduce_heat' },
  { id: 'crew_loyalty', title: 'Crew Loyaliteit', description: 'Je crew is extra gemotiveerd vandaag. Iedereen geneest.', type: 'positive' as const, minHeat: 0, effect: 'heal_crew' },
  // Neutral events
  { id: 'market_crash', title: 'Markt Crash', description: 'De prijzen op de zwarte markt zijn extreem volatiel vandaag.', type: 'neutral' as const, minHeat: 0, effect: 'price_shift' },
  { id: 'rival_turf_war', title: 'Rivalen Oorlog', description: 'Twee facties zijn in oorlog. De straten zijn gevaarlijk maar vol kansen.', type: 'neutral' as const, minHeat: 0, effect: 'faction_war' },
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_blood', name: 'First Blood', desc: 'Voltooi een solo operatie', icon: 'Swords', condition: (s) => s.rep >= 10 && s.player.level >= 1 },
  { id: 'drug_lord', name: 'Drug Lord', desc: 'Bezit het Synthetica Lab', icon: 'Pipette', condition: (s) => s.hqUpgrades.includes('lab') },
  { id: 'landlord', name: 'Vastgoed Baron', desc: 'Bezit 3 districten', icon: 'Building2', condition: (s) => s.ownedDistricts.length >= 3 },
  { id: 'millionaire', name: 'Miljonair', desc: 'Bezit €1.000.000', icon: 'BadgeDollarSign', condition: (s) => s.money >= 1000000 },
  { id: 'crew_boss', name: 'Crew Boss', desc: 'Huur 4 crewleden', icon: 'Users', condition: (s) => s.crew.length >= 4 },
  { id: 'kingpin', name: 'Kingpin', desc: 'Versla alle 3 factieleiders', icon: 'Crown', condition: (s) => s.leadersDefeated.length >= 3 },
  { id: 'high_roller', name: 'High Roller', desc: 'Bezit €50.000 aan cash', icon: 'Dices', condition: (s) => s.money >= 50000 },
  { id: 'clean_money', name: 'Witwasser', desc: 'Bezit een dekmantel', icon: 'Store', condition: (s) => s.ownedBusinesses.length > 0 },
  { id: 'car_collector', name: 'Auto Verzamelaar', desc: 'Bezit 3 voertuigen', icon: 'Car', condition: (s) => s.ownedVehicles.length >= 3 },
  { id: 'survivor', name: 'Overlever', desc: 'Overleef 30 dagen', icon: 'Clock', condition: (s) => s.day >= 30 },
  { id: 'combat_master', name: 'Vechtmachine', desc: 'Win een gevecht tegen een factieleider', icon: 'Swords', condition: (s) => s.leadersDefeated.length >= 1 },
  { id: 'trader', name: 'Handelaar', desc: 'Voltooi 50 transacties', icon: 'ArrowRightLeft', condition: (s) => (s.stats?.tradesCompleted || 0) >= 50 },
];

export const DAILY_REWARDS = [
  { day: 1, reward: 500, label: '€500' },
  { day: 2, reward: 1000, label: '€1.000' },
  { day: 3, reward: 2000, label: '€2.000' },
  { day: 4, reward: 3000, label: '€3.000' },
  { day: 5, reward: 5000, label: '€5.000' },
  { day: 6, reward: 8000, label: '€8.000' },
  { day: 7, reward: 15000, label: '€15.000' },
];

export const CREW_NAMES = [
  'Vinny', 'Pauly', 'Luca', 'Vito', 'Rico', 'Bones', 'Tank', 'Mouse', 'Snake', 'Ghost',
  'Razor', 'Ace', 'Slim', 'Duke', 'Blaze', 'Frost', 'Spike', 'Jinx', 'Raven', 'Wolf',
  'Shadow', 'Flash', 'Cobra', 'Diesel', 'Nova', 'Viper', 'Storm', 'Bullet', 'Hawk', 'Scar'
];
export const CREW_ROLES: string[] = ['Chauffeur', 'Enforcer', 'Hacker', 'Smokkelaar'];

// ========== FACTION INTERACTIONS ==========

export interface FactionActionDef {
  id: FactionActionType;
  name: string;
  icon: string;
  desc: string;
  baseCost: number;
  requiresDistrict: boolean;
  minRelation: number | null;
  maxRelation: number | null;
}

export const FACTION_ACTIONS: FactionActionDef[] = [
  { id: 'negotiate', name: 'Onderhandelen', icon: 'Handshake', desc: 'Diplomatiek relatie verbeteren', baseCost: 2000, requiresDistrict: true, minRelation: -50, maxRelation: null },
  { id: 'bribe', name: 'Omkopen', icon: 'Banknote', desc: 'Relatie kopen met geld', baseCost: 5000, requiresDistrict: false, minRelation: null, maxRelation: null },
  { id: 'intimidate', name: 'Intimideren', icon: 'Flame', desc: 'Angst zaaien, rep winnen', baseCost: 0, requiresDistrict: true, minRelation: null, maxRelation: null },
  { id: 'sabotage', name: 'Saboteren', icon: 'Bomb', desc: 'Hun operaties beschadigen', baseCost: 1000, requiresDistrict: true, minRelation: null, maxRelation: null },
  { id: 'gift', name: 'Gift Sturen', icon: 'Gift', desc: 'Handelswaar als cadeau', baseCost: 0, requiresDistrict: false, minRelation: null, maxRelation: null },
  { id: 'intel', name: 'Info Kopen', icon: 'Eye', desc: 'Handelsroutes onthullen', baseCost: 3000, requiresDistrict: false, minRelation: 20, maxRelation: null },
];

export const FACTION_GIFTS: Record<FamilyId, GoodId> = {
  cartel: 'drugs',
  syndicate: 'tech',
  bikers: 'weapons',
};

export const FACTION_REWARDS: { minRel: number; label: string; desc: string; icon: string }[] = [
  { minRel: 30, label: 'Bescherming', desc: 'Minder negatieve events', icon: 'Shield' },
  { minRel: 50, label: 'Marktkorting', desc: '-30% op hun goederen', icon: 'Percent' },
  { minRel: 60, label: 'Exclusieve Gear', desc: 'Factie-items ontgrendeld', icon: 'Swords' },
  { minRel: 80, label: 'Beschermingsgeld', desc: '+€500/dag passief inkomen', icon: 'Crown' },
];

export function createInitialState(): import('./types').GameState {
  return {
    day: 1,
    money: 3000,
    dirtyMoney: 0,
    debt: 2000,
    rep: 0,
    heat: 0,
    loc: 'low' as DistrictId,
    player: {
      level: 1,
      xp: 0,
      nextXp: 100,
      skillPoints: 2,
      stats: { muscle: 1, brains: 1, charm: 1 },
      loadout: { weapon: null, armor: null, gadget: null },
    },
    inventory: {},
    inventoryCosts: {},
    maxInv: 15,
    crew: [],
    ownedDistricts: [],
    ownedVehicles: [{ id: 'toyohata', condition: 100 }],
    activeVehicle: 'toyohata',
    ownedBusinesses: [],
    ownedGear: [],
    hqUpgrades: [],
    familyRel: { cartel: 0, syndicate: 0, bikers: 0 },
    policeRel: 20,
    leadersDefeated: [],
    prices: {},
    priceTrends: {},
    districtDemands: {},
    activeContracts: [],
    lab: { chemicals: 0 },
    activeCombat: null,
    achievements: [],
    tutorialDone: false,
    lastLoginDay: '',
    dailyRewardClaimed: false,
    loginStreak: 0,
    stats: {
      totalEarned: 0,
      totalSpent: 0,
      casinoWon: 0,
      casinoLost: 0,
      missionsCompleted: 0,
      missionsFailed: 0,
      tradesCompleted: 0,
      daysPlayed: 0,
    },
    nightReport: null,
    priceHistory: {},
    washUsedToday: 0,
    factionCooldowns: { cartel: [], syndicate: [], bikers: [] },
    conqueredFactions: [],
    activeMission: null,
    mapEvents: [],
  };
}
