import { District, Vehicle, Good, Family, SoloOperation, ContractTemplate, HQUpgrade, GearItem, Business, Achievement, DistrictId, GoodId, FamilyId, FactionActionType, RandomEvent, WeatherType, NemesisState, DistrictDefense, DistrictHQUpgradeDef, DistrictHQUpgradeId, CrewRole, VehicleUpgradeType, StealableCarDef, ChopShopUpgrade, ChopShopUpgradeId, SafehouseUpgradeDef, SafehouseUpgradeId, CorruptContactDef, AmmoPack } from './types'; // HQUpgrade kept for backwards compat

// ========== AMMO PACKS ==========

export const AMMO_PACKS: AmmoPack[] = [
  { id: 'ammo_small', name: '6 Kogels', amount: 6, cost: 500, icon: '🔫' },
  { id: 'ammo_medium', name: '12 Kogels', amount: 12, cost: 900, icon: '🔫' },
  { id: 'ammo_large', name: '30 Kogels', amount: 30, cost: 2000, icon: '💣' },
];

// ========== CRUSHER AMMO REWARDS ==========

import { StolenCarRarity } from './types';

export const CRUSHER_AMMO_REWARDS: Record<StolenCarRarity, [number, number]> = {
  common: [3, 5],
  uncommon: [5, 8],
  rare: [8, 12],
  exotic: [12, 18],
};

export const AMMO_FACTORY_DAILY_PRODUCTION = 3;

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

/** @deprecated HQ upgrades migrated to villa modules — kept empty for backwards compat */
export const HQ_UPGRADES: HQUpgrade[] = [];

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
  { id: 'autogarage', name: 'Tony\'s Autogarage', cost: 15000, income: 500, clean: 400, desc: 'Garagebedrijf en chop shop.' },
  { id: 'ammo_factory', name: 'Kogelfabriek', cost: 35000, income: 0, clean: 0, desc: 'Produceert dagelijks 3 kogels.' },
];

export const REKAT_COSTS: Record<string, number> = {
  toyohata: 2000,
  forgedyer: 4000,
  bavamotor: 6000,
  meridiolux: 10000,
  lupoghini: 12000,
  royaleryce: 15000,
};

export const VEHICLE_UPGRADES: Record<VehicleUpgradeType, {
  name: string;
  icon: string;
  maxLevel: number;
  costs: number[];
  bonuses: number[];
  desc: string;
  unit: string;
}> = {
  armor: {
    name: 'Pantser',
    icon: '🛡️',
    maxLevel: 3,
    costs: [3000, 8000, 18000],
    bonuses: [1, 2, 4],
    desc: 'Vermindert schade bij checkpoints en combat.',
    unit: 'armor',
  },
  speed: {
    name: 'Motor',
    icon: '⚡',
    maxLevel: 3,
    costs: [4000, 10000, 22000],
    bonuses: [1, 2, 3],
    desc: 'Lagere reiskosten, minder checkpoints & onderschepping.',
    unit: 'speed',
  },
  storage: {
    name: 'Opslag',
    icon: '📦',
    maxLevel: 3,
    costs: [2500, 7000, 15000],
    bonuses: [3, 5, 8],
    desc: 'Meer bagage-ruimte voor handel.',
    unit: 'slots',
  },
};

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
  { id: 'drug_lord', name: 'Drug Lord', desc: 'Bezit het Synthetica Lab (villa)', icon: 'Pipette', condition: (s) => s.villa?.modules.includes('synthetica_lab') || s.hqUpgrades.includes('lab') },
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
  { id: 'jackpot', name: 'Jackpot!', desc: 'Win 50x bij slots', icon: 'Dices', condition: (s) => s.stats.casinoWon >= 50000 },
  { id: 'card_counter', name: 'Kaartenteller', desc: 'Win 5 blackjack op rij', icon: 'Spade', condition: (s) => (s.stats.blackjackStreak || 0) >= 5 },
  { id: 'poker_face', name: 'Poker Face', desc: 'Bereik 5x multiplier bij High-Low', icon: 'CircleDot', condition: (s) => (s.stats.highLowMaxRound || 0) >= 5 },
];

export const BET_PRESETS = [100, 500, 1000, 5000];

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

// ========== WEATHER DEFINITIONS ==========

export const WEATHER_EFFECTS: Record<WeatherType, { name: string; icon: string; desc: string }> = {
  clear: { name: 'Helder', icon: 'Sun', desc: 'Standaard condities.' },
  rain: { name: 'Regen', icon: 'CloudRain', desc: '-5 Heat/dag, -10% handelsvolume.' },
  fog: { name: 'Mist', icon: 'CloudFog', desc: '+15% smokkel succes, +10% missie kans.' },
  heatwave: { name: 'Hittegolf', icon: 'Thermometer', desc: '+3 Heat/dag, +20% prijzen.' },
  storm: { name: 'Storm', icon: 'CloudLightning', desc: 'Gratis reizen, +50% lab output.' },
};

// ========== CREW SPECIALIZATIONS ==========

export interface SpecializationDef {
  id: string;
  name: string;
  desc: string;
  role: CrewRole;
  path: 'A' | 'B';
}

export const CREW_SPECIALIZATIONS: SpecializationDef[] = [
  { id: 'brute', name: 'Brute', desc: '+50% gevechtsschade', role: 'Enforcer', path: 'A' },
  { id: 'bodyguard', name: 'Bodyguard', desc: '-30% schade aan crew', role: 'Enforcer', path: 'B' },
  { id: 'dataminer', name: 'Dataminer', desc: '+25% tech missie beloning', role: 'Hacker', path: 'A' },
  { id: 'phantom', name: 'Phantom', desc: '-20% heat op acties', role: 'Hacker', path: 'B' },
  { id: 'racer', name: 'Racer', desc: 'Gratis reizen + ontsnapping', role: 'Chauffeur', path: 'A' },
  { id: 'smuggler_wagon', name: 'Smokkelwagen', desc: '+50% opslagruimte', role: 'Chauffeur', path: 'B' },
  { id: 'ghost', name: 'Spook', desc: '+40% stealth missie succes', role: 'Smokkelaar', path: 'A' },
  { id: 'network', name: 'Netwerk', desc: '+10% handelswinst', role: 'Smokkelaar', path: 'B' },
];

export function getSpecsForRole(role: CrewRole): SpecializationDef[] {
  return CREW_SPECIALIZATIONS.filter(s => s.role === role);
}

// ========== NEMESIS NAMES ==========

export const NEMESIS_NAMES = [
  'Viktor "The Ghost" Petrov', 'Maria "La Sombra" Reyes', 'Dimitri "Ice" Volkov',
  'Chen "Snake Eyes" Wei', 'Marco "The Butcher" Rossi', 'Yuki "Razor" Tanaka',
  'Aleksei "Hammer" Kozlov', 'Isabella "Venom" Cruz', 'Jamal "Kingmaker" Stone',
];

// ========== DISTRICT REP PERKS ==========

export const DISTRICT_REP_PERKS: Record<DistrictId, { threshold: number; label: string; desc: string }[]> = {
  port: [
    { threshold: 25, label: 'Haven Connectie', desc: '-10% smokkelrisico' },
    { threshold: 50, label: 'Extra Opslag', desc: '+5 bagage' },
    { threshold: 75, label: 'Havencontracten', desc: '+€500/dag passief' },
  ],
  crown: [
    { threshold: 25, label: 'Markt Intel', desc: 'Prijstrends zichtbaar' },
    { threshold: 50, label: 'VIP Casino', desc: '+15% casino winst' },
    { threshold: 75, label: 'Penthouse', desc: '-10 Heat/dag extra' },
  ],
  iron: [
    { threshold: 25, label: 'Garage Deal', desc: '-25% crew healing' },
    { threshold: 50, label: 'Gratis Repair', desc: 'Gratis voertuig reparatie' },
    { threshold: 75, label: 'Productie Bonus', desc: '+50% lab output' },
  ],
  low: [
    { threshold: 25, label: 'Straatkennis', desc: '-15% solo op risico' },
    { threshold: 50, label: 'Informanten', desc: 'Extra map events info' },
    { threshold: 75, label: 'Ongrijpbaar', desc: 'Heat cap -20' },
  ],
  neon: [
    { threshold: 25, label: 'Casino Bonus', desc: '+10% casino winst' },
    { threshold: 50, label: 'Witwas Pro', desc: '+20% witwas rate' },
    { threshold: 75, label: 'VIP Netwerk', desc: '+3 Charm permanent' },
  ],
};

// ========== PHONE MESSAGE TEMPLATES ==========

export const PHONE_CONTACTS: Record<string, { name: string; avatar: string }> = {
  informant: { name: 'Informant X', avatar: '🕵️' },
  nemesis: { name: 'Rivaal', avatar: '💀' },
  weather: { name: 'NoxWeer', avatar: '🌤️' },
  courier: { name: 'Koerier', avatar: '📦' },
  anonymous: { name: 'Anoniem', avatar: '❓' },
  police: { name: 'Bron NHPD', avatar: '👮' },
};

// ========== INITIAL STATE ==========

function createInitialNemesis(): NemesisState {
  return {
    name: NEMESIS_NAMES[Math.floor(Math.random() * NEMESIS_NAMES.length)],
    power: 10,
    location: 'crown',
    hp: 80,
    maxHp: 80,
    cooldown: 0,
    defeated: 0,
    lastAction: '',
    generation: 1,
    alive: true,
    nextSpawnDay: 0,
    defeatedNames: [],
  };
}

// ========== DISTRICT HQ UPGRADES ==========

export const DISTRICT_HQ_UPGRADES: DistrictHQUpgradeDef[] = [
  { id: 'patrol', name: 'Straatpatrouille', cost: 3000, defense: 15, attackReduction: 0, enablesSpionage: false, icon: '🚶', desc: '+15 verdediging' },
  { id: 'walls', name: 'Versterkte Muren', cost: 8000, defense: 25, attackReduction: 0, enablesSpionage: false, icon: '🧱', desc: '+25 verdediging' },
  { id: 'surveillance', name: 'Bewakingsnetwerk', cost: 12000, defense: 20, attackReduction: 10, enablesSpionage: false, icon: '📡', desc: '+20 verdediging, -10% aanvalskans' },
  { id: 'turret', name: 'Geschutstoren', cost: 20000, defense: 30, attackReduction: 0, enablesSpionage: false, icon: '🔫', desc: '+30 verdediging' },
  { id: 'command', name: 'Commandocentrum', cost: 35000, defense: 20, attackReduction: 0, enablesSpionage: true, icon: '🏛️', desc: '+20 verdediging, spionage' },
];

function createInitialDefenses(): Record<DistrictId, DistrictDefense> {
  const ids: DistrictId[] = ['port', 'crown', 'iron', 'low', 'neon'];
  const defenses: Record<string, DistrictDefense> = {};
  ids.forEach(id => {
    defenses[id] = { upgrades: [], fortLevel: 0 };
  });
  return defenses as Record<DistrictId, DistrictDefense>;
}

export function createInitialState(): import('./types').GameState {
  return {
    day: 1,
    money: 3000,
    dirtyMoney: 0,
    debt: 2000,
    rep: 0,
    heat: 0,
    personalHeat: 0,
    hidingDays: 0,
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
    ownedVehicles: [{ id: 'toyohata', condition: 100, vehicleHeat: 0, rekatCooldown: 0 }],
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
      blackjackStreak: 0,
      highLowMaxRound: 0,
    },
    nightReport: null,
    priceHistory: {},
    washUsedToday: 0,
    factionCooldowns: { cartel: [], syndicate: [], bikers: [] },
    conqueredFactions: [],
    activeMission: null,
    mapEvents: [],
    // New feature state
    weather: 'clear',
    districtRep: { port: 0, crown: 0, iron: 0, low: 0, neon: 0 },
    nemesis: createInitialNemesis(),
    districtDefenses: createInitialDefenses(),
    pendingWarEvent: null,
    spionageIntel: [],
    sabotageEffects: [],
    allianceCooldowns: { cartel: 0, syndicate: 0, bikers: 0 },
    smuggleRoutes: [],
    phone: { messages: [], unread: 0 },
    showPhone: false,
    pendingSpecChoice: null,
    casinoJackpot: 10000,
    // Endgame state
    endgamePhase: 'straatdealer',
    victoryData: null,
    newGamePlusLevel: 0,
    finalBossDefeated: false,
    freePlayMode: false,
    // Safehouse state
    safehouses: [],
    // Car theft state
    stolenCars: [],
    carOrders: [],
    pendingCarTheft: null,
    // Corruption network state
    corruptContacts: [],
    pendingCorruptionEvent: null,
    // Daily challenges state
    dailyChallenges: [],
    challengeDay: 0,
    challengesCompleted: 0,
    dailyProgress: { trades: 0, earned: 0, washed: 0, solo_ops: 0, contracts: 0, travels: 0, bribes: 0, faction_actions: 0, recruits: 0, cars_stolen: 0, casino_won: 0, hits_completed: 0 },
    // Story & animation state
    pendingStreetEvent: null,
    streetEventResult: null,
    screenEffect: null,
    lastRewardAmount: 0,
    crewPersonalities: {},
    // Story arcs state
    activeStoryArcs: [],
    completedArcs: [],
    pendingArcEvent: null,
    arcEventResult: null,
    // Narrative expansion state
    backstory: null,
    karma: 0,
    npcRelations: {
      rosa: { value: 0, met: false, lastInteractionDay: 0, flags: [] },
      marco: { value: 0, met: false, lastInteractionDay: 0, flags: [] },
      yilmaz: { value: 0, met: false, lastInteractionDay: 0, flags: [] },
      luna: { value: 0, met: false, lastInteractionDay: 0, flags: [] },
      krow: { value: 0, met: false, lastInteractionDay: 0, flags: [] },
    },
    pendingFlashback: null,
    keyDecisions: [],
    // Hitman & Ammo state
    ammo: 12,
    hitContracts: [],
    // Prison state
    prison: null,
    // Heist state
    activeHeist: null,
    heistCooldowns: {},
    heistPlan: null,
    // News state
    dailyNews: [],
    // Villa state
    villa: null,
  };
}

// ========== PRISON CONSTANTS ==========

export const PRISON_SENTENCE_TABLE: { maxHeat: number; days: number }[] = [
  { maxHeat: 30, days: 1 },
  { maxHeat: 50, days: 2 },
  { maxHeat: 70, days: 3 },
  { maxHeat: 85, days: 5 },
  { maxHeat: 100, days: 7 },
];

export const PRISON_BRIBE_COST_PER_DAY = 5000;
export const PRISON_ESCAPE_BASE_CHANCE = 0.20;
export const PRISON_MONEY_CONFISCATION = 0.20;
export const PRISON_ARREST_CHANCE_RAID = 0.30;
export const PRISON_ARREST_CHANCE_MISSION = 0.15;
export const PRISON_ARREST_CHANCE_HIGH_RISK = 0.25;
export const PRISON_ESCAPE_HEAT_PENALTY = 15;
export const PRISON_ESCAPE_FAIL_EXTRA_DAYS = 2;

// ========== SAFEHOUSE CONSTANTS ==========

export const SAFEHOUSE_COSTS: Record<DistrictId, number> = {
  low: 8000,
  port: 15000,
  iron: 18000,
  neon: 35000,
  crown: 50000,
};

export const SAFEHOUSE_UPGRADE_COSTS: Record<number, number> = {
  2: 12000, // upgrade to level 2
  3: 30000, // upgrade to level 3
};

export const SAFEHOUSE_UPGRADES: SafehouseUpgradeDef[] = [
  { id: 'reinforced', name: 'Versterkte Muren', cost: 5000, desc: '-15% kans op politie-inval voor dit district.', icon: '🛡️' },
  { id: 'medbay', name: 'Medische Post', cost: 8000, desc: 'Crew geneest 2x sneller per nacht.', icon: '🏥' },
  { id: 'vault', name: 'Kluis', cost: 10000, desc: 'Beschermt €20.000 bij politie-invallen.', icon: '🔐' },
  { id: 'garage', name: 'Ondergrondse Garage', cost: 12000, desc: '-5 voertuig heat/nacht in dit district.', icon: '🅿️' },
  { id: 'comms', name: 'Communicatie Hub', cost: 7000, desc: 'Extra intel over marktprijzen en events.', icon: '📡' },
];

export const SAFEHOUSE_PERKS: Record<number, string> = {
  1: '-3 persoonlijke heat/nacht',
  2: '-5 persoonlijke heat/nacht, +5 opslag',
  3: '-8 persoonlijke heat/nacht, +10 opslag, crew herstel bonus',
};

// ========== CAR THEFT CONSTANTS ==========

export const STEALABLE_CARS: StealableCarDef[] = [
  { id: 'rusted_sedan', name: 'Roest Sedan', brand: 'Volkmar', rarity: 'common', baseValue: 1500, stealDifficulty: 15, heatGain: 5, districts: ['low', 'iron'], desc: 'Oud en verroest, maar rijdt nog.' },
  { id: 'city_hatch', name: 'Stads Hatchback', brand: 'Fiat-Mora', rarity: 'common', baseValue: 3000, stealDifficulty: 20, heatGain: 8, districts: ['low', 'iron', 'port'], desc: 'Gewone stadsauto. Makkelijk te stelen.' },
  { id: 'delivery_van', name: 'Bestelbus', brand: 'Forge-Dyer', rarity: 'common', baseValue: 4500, stealDifficulty: 25, heatGain: 10, districts: ['port', 'iron'], desc: 'Perfect voor transport. Of smokkel.' },
  { id: 'sport_coupe', name: 'Sport Coupé', brand: 'Bava-Motor', rarity: 'uncommon', baseValue: 12000, stealDifficulty: 40, heatGain: 15, districts: ['crown', 'neon'], desc: 'Snelle tweezitter met alarm.' },
  { id: 'suv_terrain', name: 'SUV Terreinwagen', brand: 'Rangor', rarity: 'uncommon', baseValue: 18000, stealDifficulty: 45, heatGain: 18, districts: ['crown', 'iron'], desc: 'Zware SUV. Geparkeerd bij de country club.' },
  { id: 'luxury_sedan', name: 'Luxe Sedan', brand: 'Meridio-Lux', rarity: 'uncommon', baseValue: 28000, stealDifficulty: 55, heatGain: 22, districts: ['crown', 'neon'], desc: 'Leren interieur, GPS-tracking.' },
  { id: 'muscle_car', name: 'Muscle Car', brand: 'Amero-V8', rarity: 'rare', baseValue: 45000, stealDifficulty: 60, heatGain: 25, districts: ['neon', 'iron'], desc: 'Brullende V8. Valt op.' },
  { id: 'exotic_sports', name: 'Exotische Sportwagen', brand: 'Lupo-Ghini', rarity: 'rare', baseValue: 85000, stealDifficulty: 75, heatGain: 35, districts: ['crown', 'neon'], desc: 'Miljoenen waard. Zwaar beveiligd.' },
  { id: 'armored_limo', name: 'Gepantserde Limousine', brand: 'Royale-Ryce', rarity: 'exotic', baseValue: 120000, stealDifficulty: 85, heatGain: 40, districts: ['crown'], desc: 'VIP-limo met kogelvrij glas.' },
  { id: 'rare_classic', name: 'Zeldzame Klassieker', brand: 'Aston-Veil', rarity: 'exotic', baseValue: 200000, stealDifficulty: 90, heatGain: 30, districts: ['crown'], desc: 'Vintage collectorsitem. Onvervangbaar.' },
];

export const CHOP_SHOP_UPGRADES: ChopShopUpgrade[] = [
  { id: 'paint', name: 'Respray', cost: 500, valueBonus: 10, desc: 'Nieuwe lak en kleur.' },
  { id: 'engine_tune', name: 'Motor Tune', cost: 2000, valueBonus: 20, desc: 'Chip-tuning en uitlaat upgrade.' },
  { id: 'interior', name: 'Interieur', cost: 1500, valueBonus: 15, desc: 'Nieuw leer en dashboard.' },
  { id: 'bodykit', name: 'Bodykit', cost: 3000, valueBonus: 25, desc: 'Spoilers, skirts en velgen.' },
  { id: 'nitro', name: 'Nitro Systeem', cost: 5000, valueBonus: 30, desc: 'N2O injectie. Instant vermogen.' },
];

export const CAR_ORDER_CLIENTS = [
  { name: 'Viktor K.', emoji: '🕶️' },
  { name: 'Madame Chen', emoji: '💎' },
  { name: 'El Gordo', emoji: '🎩' },
  { name: 'Yuki R.', emoji: '🏎️' },
  { name: 'Mr. Black', emoji: '🖤' },
  { name: 'De Kolonel', emoji: '🎖️' },
];

export const OMKAT_COST = 2500;
export const OMKAT_DAYS = 1; // days before car is "clean"

// ========== CORRUPTION NETWORK CONSTANTS ==========

export const CORRUPT_CONTACTS: CorruptContactDef[] = [
  {
    id: 'beat_cop', type: 'agent', name: 'Agent Brouwer', title: 'Wijkagent',
    monthlyCost: 1500, recruitCost: 5000, betrayalRisk: 5,
    effects: { heatReduction: 3, raidProtection: 15 },
    desc: 'Kijkt de andere kant op bij kleine overtredingen.',
    icon: '👮', reqRep: 50,
  },
  {
    id: 'vice_detective', type: 'detective', name: 'Inspecteur De Vries', title: 'Rechercheur Zeden',
    monthlyCost: 4000, recruitCost: 15000, betrayalRisk: 10,
    effects: { heatReduction: 5, raidProtection: 25, intelBonus: true },
    desc: 'Lekt informatie over geplande invallen en onderzoeken.',
    icon: '🕵️', reqRep: 150, reqPoliceRel: 30,
  },
  {
    id: 'customs_officer', type: 'customs', name: 'Douanier Bakker', title: 'Hoofd Douane',
    monthlyCost: 3000, recruitCost: 12000, betrayalRisk: 8,
    effects: { smuggleProtection: 40, tradeBonus: 10 },
    desc: 'Faciliteert smokkelroutes en kijkt niet in containers.',
    icon: '🛃', reqRep: 100,
  },
  {
    id: 'district_judge', type: 'judge', name: 'Rechter Van Dijk', title: 'Strafrechter',
    monthlyCost: 6000, recruitCost: 25000, betrayalRisk: 15,
    effects: { fineReduction: 50, raidProtection: 10 },
    desc: 'Verlaagt straffen en laat zaken seponeren.',
    icon: '⚖️', reqRep: 200, reqPoliceRel: 40,
  },
  {
    id: 'city_councilor', type: 'politician', name: 'Wethouder Jansen', title: 'Wethouder Veiligheid',
    monthlyCost: 8000, recruitCost: 40000, betrayalRisk: 20,
    effects: { heatReduction: 8, raidProtection: 35, fineReduction: 30, tradeBonus: 5 },
    desc: 'De machtigste pion. Beïnvloedt politiebeleid en wetgeving.',
    icon: '🏛️', reqRep: 350, reqPoliceRel: 50,
  },
  {
    id: 'harbor_master', type: 'customs', name: 'Havenmeester Krol', title: 'Directeur Havenbeheer',
    monthlyCost: 5000, recruitCost: 20000, betrayalRisk: 12,
    effects: { smuggleProtection: 60, tradeBonus: 15 },
    desc: 'Controleert alles wat de haven in en uit gaat.',
    icon: '⚓', reqRep: 250,
  },
  {
    id: 'defense_lawyer', type: 'lawyer', name: 'Mr. Vermeer', title: 'Strafpleiter',
    monthlyCost: 5000, recruitCost: 18000, betrayalRisk: 8,
    effects: { fineReduction: 30, raidProtection: 5 },
    desc: 'Halveert je kans op arrestatie. De beste advocaat van Noxhaven.',
    icon: '👔', reqRep: 120,
  },
];

export const CORRUPTION_BETRAYAL_EVENTS = [
  'heeft anoniem bewijs overgedragen aan Interne Zaken.',
  'is gearresteerd en heeft een deal gemaakt met de officier van justitie.',
  'is geflipped door een rivaliserende organisatie.',
  'heeft een opname gemaakt van jullie laatste ontmoeting.',
  'is benaderd door een undercoveragent en heeft meegewerkt.',
];
