import { District, Vehicle, Good, Family, SoloOperation, ContractTemplate, HQUpgrade, GearItem, Business, Achievement, DistrictId, GoodId, FamilyId, FactionActionType, RandomEvent, WeatherType, NemesisState, DistrictDefense, DistrictHQUpgradeDef, DistrictHQUpgradeId, CrewRole, VehicleUpgradeType, StealableCarDef, ChopShopUpgrade, ChopShopUpgradeId, SafehouseUpgradeDef, SafehouseUpgradeId, CorruptContactDef, AmmoPack, StatId } from './types'; // HQUpgrade kept for backwards compat

// ========== AMMO PACKS (Universal) ==========

export const AMMO_PACKS: AmmoPack[] = [
  { id: 'ammo_small', name: '10 Kogels', amount: 10, cost: 500, icon: '🔫' },
  { id: 'ammo_medium', name: '25 Kogels', amount: 25, cost: 1100, icon: '🔫' },
  { id: 'ammo_large', name: '50 Kogels', amount: 50, cost: 2000, icon: '💣' },
  { id: 'ammo_crate', name: '100 Kogels', amount: 100, cost: 3500, icon: '📦' },
];

export const MAX_AMMO = 500;

// ========== SPECIAL AMMO ==========

import { SpecialAmmoDef, SpecialAmmoType } from './types';

export const SPECIAL_AMMO: SpecialAmmoDef[] = [
  {
    id: 'armor_piercing',
    name: 'Armor Piercing',
    desc: 'Negeert 50% van vijandelijke armor. +20% duurder.',
    icon: '🔩',
    costMult: 1.2,
    effects: { armorIgnore: 0.5 },
  },
  {
    id: 'hollowpoints',
    name: 'Hollowpoints',
    desc: '1.5x schade vs onbeschermde, -50% vs armor.',
    icon: '💥',
    costMult: 1.3,
    effects: { damageMult: 1.5, armorDamageMult: 0.5 },
  },
  {
    id: 'tracer',
    name: 'Tracer Rounds',
    desc: '+15% accuracy, onthult vijand locatie.',
    icon: '✨',
    costMult: 1.15,
    effects: { accuracyBonus: 15, revealLocation: true },
  },
];

export const SPECIAL_AMMO_PACKS: { id: SpecialAmmoType; amount: number; cost: number }[] = [
  { id: 'armor_piercing', amount: 20, cost: 3000 },
  { id: 'hollowpoints', amount: 20, cost: 3500 },
  { id: 'tracer', amount: 20, cost: 2500 },
];

// ========== CRUSHER AMMO REWARDS ==========

import { StolenCarRarity } from './types';

export const CRUSHER_AMMO_REWARDS: Record<StolenCarRarity, [number, number]> = {
  common: [5, 10],
  uncommon: [10, 18],
  rare: [18, 30],
  exotic: [30, 50],
};

export const AMMO_FACTORY_DAILY_PRODUCTION = 10;

export const AMMO_FACTORY_UPGRADES: { level: number; production: number; cost: number; label: string }[] = [
  { level: 1, production: 10, cost: 0, label: 'Basis' },
  { level: 2, production: 18, cost: 25000, label: 'Lvl 2' },
  { level: 3, production: 25, cost: 50000, label: 'Lvl 3' },
];

/** @deprecated Legacy ammo type labels — kept for migration/backwards compat */
export const AMMO_TYPE_LABELS: Record<import('./types').AmmoType, { label: string; icon: string }> = {
  '9mm': { label: 'Kogels', icon: '🔫' },
  '7.62mm': { label: 'Kogels', icon: '🔫' },
  'shells': { label: 'Kogels', icon: '🔫' },
};

export const DISTRICTS: Record<string, District> = {
  port: { name: 'Port Nero', cost: 12000, income: 450, cx: 100, cy: 90, mods: { drugs: 0.7, weapons: 0.6, tech: 1.3, luxury: 1.4, meds: 0.8, explosives: 0.5, crypto: 1.2, chemicals: 0.9, electronics: 1.1 }, perk: "+10% Bagage & Smokkelaar Efficiency" },
  crown: { name: 'Crown Heights', cost: 85000, income: 2800, cx: 265, cy: 85, mods: { drugs: 1.6, weapons: 1.4, tech: 0.6, luxury: 1.8, meds: 1.3, explosives: 1.5, crypto: 0.7, chemicals: 1.4, electronics: 0.8 }, perk: "-20% Heat Daily & Hacker Efficiency" },
  iron: { name: 'Iron Borough', cost: 25000, income: 900, cx: 215, cy: 200, mods: { drugs: 1.2, weapons: 0.5, tech: 0.8, luxury: 1.1, meds: 1.0, explosives: 0.6, crypto: 1.0, chemicals: 0.7, electronics: 1.3 }, perk: "-20% Crew Healing Cost" },
  low: { name: 'Lowrise', cost: 8000, income: 250, cx: 100, cy: 205, mods: { drugs: 0.5, weapons: 1.5, tech: 1.0, luxury: 0.7, meds: 1.4, explosives: 1.3, crypto: 0.9, chemicals: 1.2, electronics: 0.6 }, perk: "Goedkopere Solo Ops" },
  neon: { name: 'Neon Strip', cost: 45000, income: 1600, cx: 315, cy: 200, mods: { drugs: 1.4, weapons: 1.2, tech: 1.6, luxury: 0.9, meds: 0.6, explosives: 1.1, crypto: 1.5, chemicals: 0.8, electronics: 1.4 }, perk: "+10% Casino Winst & Witwas Bonus" }
};

export const VEHICLES: Vehicle[] = [
  { id: 'toyohata', name: 'Toyo-Hata Swift', cost: 0, storage: 5, speed: 1, armor: 0, charm: 1, desc: 'Een betrouwbare Japanse klassieker.' },
  { id: 'forgedyer', name: 'Forge-Dyer Heavy', cost: 9500, storage: 30, speed: -1, armor: 3, charm: -1, desc: 'Het werkpaard van de haven.' },
  { id: 'bavamotor', name: 'Bava-Motor Shadow', cost: 24000, storage: 12, speed: 4, armor: 1, charm: 3, desc: 'Duitse precisie. Snel genoeg voor alles.' },
  { id: 'meridiolux', name: 'Meridio-Lux Baron', cost: 48000, storage: 15, speed: 2, armor: 2, charm: 8, desc: 'Status op wielen. Enorme charm-bonus.' },
  { id: 'lupoghini', name: 'Lupo-Ghini Strike', cost: 135000, storage: 8, speed: 7, armor: 1, charm: 12, desc: 'Pure arrogantie. Koning van de strip.' },
  { id: 'royaleryce', name: 'Royale-Ryce Eternal', cost: 350000, storage: 20, speed: 3, armor: 5, charm: 20, desc: 'Het ultieme symbool van macht.' },
  // Prestige 2+ vehicles
  { id: 'noxreaper', name: 'Nox Reaper V12', cost: 500000, storage: 10, speed: 9, armor: 3, charm: 25, desc: 'Gebouwd in de schaduwen van Noxhaven. Ongeëvenaard op snelheid.', reqPrestige: 2 },
  { id: 'obsidiancruiser', name: 'Obsidian Cruiser', cost: 750000, storage: 35, speed: 4, armor: 8, charm: 18, desc: 'Gepantserde luxe. Een rijdende kluis voor de echte kingpin.', reqPrestige: 2 },
  // Prestige 3+ vehicles
  { id: 'phantomgt', name: 'Phantom GT Spectre', cost: 1200000, storage: 15, speed: 10, armor: 6, charm: 35, desc: 'Spookachtig snel, onzichtbaar voor radar. Legendarisch.', reqPrestige: 3 },
];

export const GOODS: Good[] = [
  { id: 'drugs', name: 'Synthetica', base: 200, icon: 'Pipette', faction: 'cartel' },
  { id: 'weapons', name: 'Zware Wapens', base: 1100, icon: 'Shield', faction: 'bikers' },
  { id: 'tech', name: 'Zwarte Data', base: 900, icon: 'Cpu', faction: 'syndicate' },
  { id: 'luxury', name: 'Geroofde Kunst', base: 2400, icon: 'Gem', faction: null },
  { id: 'meds', name: 'Medische Voorraad', base: 600, icon: 'Pill', faction: null },
  { id: 'explosives', name: 'Explosieven', base: 1800, icon: 'Bomb', faction: 'bikers' },
  { id: 'crypto', name: 'Crypto Wallets', base: 3200, icon: 'Bitcoin', faction: 'syndicate' },
  { id: 'chemicals', name: 'Precursoren', base: 450, icon: 'FlaskConical', faction: 'cartel' },
  { id: 'electronics', name: 'Gestolen Chips', base: 750, icon: 'CircuitBoard', faction: null },
];

// ========== MARKET EVENTS ==========
export type MarketEventId = 'drug_bust' | 'arms_deal' | 'data_leak' | 'art_forgery' | 'med_shortage' | 'port_blockade' | 'tech_boom' | 'luxury_auction' | 'cartel_war' | 'police_sweep';

export interface MarketEvent {
  id: MarketEventId;
  name: string;
  desc: string;
  effects: Partial<Record<GoodId, number>>; // multiplier per good
  duration: number; // days
}

export const MARKET_EVENTS: MarketEvent[] = [
  { id: 'drug_bust', name: '💊 Drugsbust', desc: 'Politie-inval bij groot lab — Synthetica schaars!', effects: { drugs: 2.2 }, duration: 2 },
  { id: 'arms_deal', name: '🔫 Wapenembargo', desc: 'Grenscontrole versterkt — wapenprijzen kelderen.', effects: { weapons: 0.5 }, duration: 2 },
  { id: 'data_leak', name: '💻 Data Lek', desc: 'Grote hack onthuld — zwarte data is waardeloos.', effects: { tech: 0.4 }, duration: 1 },
  { id: 'art_forgery', name: '🎨 Vervalsingen', desc: 'Markt overspoeld met vervalsingen — kunstprijzen dalen.', effects: { luxury: 0.5 }, duration: 2 },
  { id: 'med_shortage', name: '💉 Medicijntekort', desc: 'Ziekenhuis voorraad op — medische goederen in hoge vraag!', effects: { meds: 2.5 }, duration: 2 },
  { id: 'port_blockade', name: '🚢 Havenblokkade', desc: 'Smokkelroute geblokkeerd — alles duurder via de haven.', effects: { drugs: 1.5, weapons: 1.4, luxury: 1.3 }, duration: 1 },
  { id: 'tech_boom', name: '📡 Tech Hausse', desc: 'Vraag naar gehackte data explodeert!', effects: { tech: 2.0 }, duration: 2 },
  { id: 'luxury_auction', name: '👑 Geheime Veiling', desc: 'Rijke verzamelaars bieden mee — kunstprijzen stijgen!', effects: { luxury: 1.8 }, duration: 1 },
  { id: 'cartel_war', name: '⚔️ Karteloorlog', desc: 'Kartels bevechten elkaar — drugs & wapens volatiel.', effects: { drugs: 1.6, weapons: 1.8 }, duration: 2 },
  { id: 'police_sweep', name: '🚔 Grote Razzia', desc: 'Politie overal — alle zwarte markt prijzen dalen.', effects: { drugs: 0.6, weapons: 0.6, tech: 0.7, luxury: 0.6, meds: 0.8, explosives: 0.5, crypto: 0.9, chemicals: 0.7, electronics: 0.7 }, duration: 1 },
  { id: 'arms_deal' as MarketEventId, name: '💣 Explosievensmokkel', desc: 'Grote lading explosieven onderschept — prijzen stijgen!', effects: { explosives: 2.0 }, duration: 2 },
  { id: 'data_leak' as MarketEventId, name: '₿ Crypto Crash', desc: 'Witwas-ring opgerold — crypto wallets waardeloos.', effects: { crypto: 0.4 }, duration: 1 },
  { id: 'med_shortage' as MarketEventId, name: '🧪 Lab Explosie', desc: 'Groot clandestien lab ontploft — precursoren schaars!', effects: { chemicals: 2.3, drugs: 1.3 }, duration: 2 },
  { id: 'tech_boom' as MarketEventId, name: '📱 Chipstekort', desc: 'Globaal chiptekort — gestolen chips extreem waardevol!', effects: { electronics: 2.2, tech: 1.4 }, duration: 2 },
];

// Spoilage rates per good (fraction lost per night, 0 = no spoilage)
export const GOOD_SPOILAGE: Record<GoodId, number> = {
  drugs: 0.08,   // 8% per night
  weapons: 0,
  tech: 0,
  luxury: 0,
  meds: 0.05,    // 5% per night
  explosives: 0,
  crypto: 0,
  chemicals: 0.06, // 6% per night - unstable compounds
  electronics: 0,
};

export const GOOD_CATEGORIES: Record<string, { color: string; bgColor: string; borderColor: string; label: string }> = {
  drugs: { color: 'text-blood', bgColor: 'bg-blood/10', borderColor: 'border-l-blood', label: 'Drugs' },
  weapons: { color: 'text-gold', bgColor: 'bg-gold/10', borderColor: 'border-l-gold', label: 'Wapens' },
  tech: { color: 'text-ice', bgColor: 'bg-ice/10', borderColor: 'border-l-ice', label: 'Tech' },
  luxury: { color: 'text-game-purple', bgColor: 'bg-game-purple/10', borderColor: 'border-l-game-purple', label: 'Luxe' },
  meds: { color: 'text-emerald', bgColor: 'bg-emerald/10', borderColor: 'border-l-emerald', label: 'Medisch' },
  explosives: { color: 'text-orange-400', bgColor: 'bg-orange-400/10', borderColor: 'border-l-orange-400', label: 'Explosieven' },
  crypto: { color: 'text-amber-300', bgColor: 'bg-amber-300/10', borderColor: 'border-l-amber-300', label: 'Crypto' },
  chemicals: { color: 'text-teal-400', bgColor: 'bg-teal-400/10', borderColor: 'border-l-teal-400', label: 'Chemisch' },
  electronics: { color: 'text-violet-400', bgColor: 'bg-violet-400/10', borderColor: 'border-l-violet-400', label: 'Elektronica' },
};

export const FAMILIES: Record<string, Family> = {
  cartel: { id: 'cartel', name: 'Rojo Cartel', contact: 'El Serpiente', desc: 'Controleert de haven en drugshandel.', color: '#b91c1c', home: 'port' },
  syndicate: { id: 'syndicate', name: 'Blue Lotus', contact: 'Mr. Wu', desc: 'Hightech spionage vanuit Crown Heights.', color: '#2563eb', home: 'crown' },
  bikers: { id: 'bikers', name: 'Iron Skulls', contact: 'Hammer', desc: 'Wapenhandelaren in Iron Borough.', color: '#d97706', home: 'iron' }
};

export const SOLO_OPERATIONS: SoloOperation[] = [
  { id: 'pickpocket', name: "Zakkenrollen", level: 1, stat: 'charm', risk: 15, heat: 5, reward: 300, desc: "Zakkenrollen bij de metro." },
  { id: 'atm_skimming', name: "ATM Skimming", level: 3, stat: 'brains', risk: 25, heat: 10, reward: 1200, desc: "Plaats skimmers op een ATM." },
  { id: 'car_theft', name: "Auto Diefstal", level: 5, stat: 'brains', risk: 40, heat: 20, reward: 2500, desc: "Steel een luxe wagen voor export." },
  { id: 'store_robbery', name: "Juwelier Overval", level: 7, stat: 'muscle', risk: 55, heat: 35, reward: 5000, desc: "Gewapende overval op klaarlichte dag." },
  { id: 'crypto_heist', name: "Crypto Heist", level: 10, stat: 'brains', risk: 70, heat: 15, reward: 12000, desc: "Hack een cold storage wallet." }
];

export const SOLO_OP_DISTRICT_DESC: Record<string, Record<string, string>> = {
  pickpocket: {
    neon: 'Beroof dronken gokkers bij de clubs op de Strip.',
    port: 'Rol aangeschoten havenarbeiders na hun shift.',
    crown: 'Besteel onoplettende investeerders bij het penthouse.',
    iron: 'Grijp het weekgeld van fabrieksarbeiders bij het hek.',
    low: 'Beroof dealers in de steegjes van Lowrise.',
  },
  atm_skimming: {
    neon: 'Skim gokkers-ATMs naast de Velvet Room.',
    port: 'Plaats skimmers op de verouderde haven-ATM.',
    crown: 'Hack de high-tech ATMs van Crown Heights.',
    iron: 'Skim de onbewaakte ATM bij de fabriekspoort.',
    low: 'Tap de uitkerings-ATM in de telefooncel.',
  },
  car_theft: {
    neon: 'Steel een Ferrari van een feestende influencer.',
    port: 'Jack de Porsche van een havenbaas bij Dok 7.',
    crown: 'Grijp een Lamborghini bij de valet parking.',
    iron: 'Steel Hammers gepantserde Mercedes-AMG.',
    low: 'Jack een opgevoerde Civic uit de racescene.',
  },
  store_robbery: {
    neon: 'Overval de luxe horlogewinkel op de Strip.',
    port: 'Beroof het smokkelkantoor bij Dok 9.',
    crown: 'Kraak de exclusieve juwelier met laserbeveiliging.',
    iron: 'Overval de pandjesbaas van Iron Borough.',
    low: 'Beroof de goudhandelaar op de hoek.',
  },
  crypto_heist: {
    neon: 'Hack het illegale wisselkantoor achter de club.',
    port: 'Kraak de offshore server op een vrachtschip.',
    crown: 'Breek in bij het datacenter van een hedgefund.',
    iron: 'Plunder de illegale mining-farm in de fabriek.',
    low: 'Steel de wallet van een tiener-cryptominer.',
  },
};

export const SOLO_OP_BRIEFINGS: Record<string, Record<string, { targetDesc: string; locationDesc: string; intel: string }>> = {
  pickpocket: {
    port: {
      targetDesc: 'Aangeschoten havenarbeiders die net hun weekgeld in contanten hebben ontvangen bij de loonbalie van Dok 7.',
      locationDesc: 'De havenkade van Port Nero — olievlekken op het asfalt, roestige kranen, en arbeiders die na hun shift naar de kroeg strompelen.',
      intel: 'De loonuitbetaling is elke vrijdag om 18:00. De meeste arbeiders stoppen hun envelop in hun achterzak zonder te tellen. Makkelijke prooien.',
    },
    crown: {
      targetDesc: 'Welgestelde investeerders en bankiers die achteloos met hun portemonnee omgaan na zakenlunches.',
      locationDesc: 'De financiële boulevard van Crown Heights — marmeren gevels, privéchauffeurs, en mensen die te belangrijk zijn om op te letten.',
      intel: 'De beste kans is tussen 13:00 en 14:00, wanneer de bankiers terugkeren van hun driegangenlunch. Dure wijn maakt onvoorzichtig.',
    },
    iron: {
      targetDesc: 'Fabrieksvoormannen die hun weekgeld in dikke enveloppen bij zich dragen na de dagshift.',
      locationDesc: 'Het industrieterrein van Iron Borough — roet in de lucht, stampende machines, en arbeiders die te moe zijn om op te letten.',
      intel: 'De bewakingscamera\'s bij de fabriekshekken zijn al maanden kapot. Niemand repareert ze — te duur, zeggen ze.',
    },
    low: {
      targetDesc: 'Straatdealers en kleine criminelen die hun dagomzet in contanten bij zich dragen.',
      locationDesc: 'De achterafsteegjes van Lowrise — wasserettes, kapotte lantaarnpalen, en portieken waar altijd iemand staat.',
      intel: 'Dealers hier tellen hun geld in het openbaar — arrogantie of domheid, maakt niet uit. Pas op voor hun pistool in de broeksband.',
    },
    neon: {
      targetDesc: 'Dronken gokkers die de casino\'s verlaten met zakken vol chips en contant geld.',
      locationDesc: 'De Neon Strip — neonlichten, dreunende bassen, en wankelende figuren die niet meer weten hoeveel ze bij zich hebben.',
      intel: 'Na middernacht zijn de beste kansen: gokkers die net hebben gewonnen zijn euforisch en onoplettend. Verliezers zijn wanhopig en afgeleid.',
    },
  },
  atm_skimming: {
    port: {
      targetDesc: 'Verouderde geldautomaten bij het havenkantoor die nog op Windows XP draaien.',
      locationDesc: 'De verlaten kade bij Dok 12 — één TL-buis, geen bewaking, en software van tien jaar oud.',
      intel: 'De ATM\'s hier worden zelden gecontroleerd. Een skimmer kan dagen onontdekt blijven. Maar pas op voor de havenratten die in de schaduw leven.',
    },
    crown: {
      targetDesc: 'High-end geldautomaten met torenhoge transactielimieten in het financieel district.',
      locationDesc: 'Crown Heights Premier Banking — touchscreen ATM\'s met gezichtsherkenning, NFC, en een directe lijn naar privébeveiliging.',
      intel: 'De transactielimieten zijn tien keer hoger dan elders. Maar het beveiligingsbedrijf is binnen drie minuten ter plaatse. Precisie is alles.',
    },
    iron: {
      targetDesc: 'Industriële geldautomaten bij de staalfabriek die door honderden arbeiders per week worden gebruikt.',
      locationDesc: 'Het fabriekscomplex van Iron Borough — roestige hekken, bewakershuisjes, en ATM\'s die nooit worden geüpdatet.',
      intel: 'De arbeiders gebruiken dezelfde pincode als hun werknemersnummer. Het volume aan transacties maakt deze ATM een goudmijn voor skimming.',
    },
    low: {
      targetDesc: 'De enige werkende geldautomaat in vijf blokken, constant in gebruik door de hele buurt.',
      locationDesc: 'Een betonnen hokje aan de rand van Lowrise — graffiti op de muren, gebroken verlichting, maar altijd een rij.',
      intel: 'Iedereen in de buurt gebruikt deze ATM. Het volume is enorm maar de bedragen per transactie zijn klein. Kwantiteit boven kwaliteit.',
    },
    neon: {
      targetDesc: 'Casino-ATM\'s die door gokkers worden gebruikt om snel cash op te nemen voor de speeltafels.',
      locationDesc: 'Naast de Velvet Room op de Strip — elke vijf minuten een nieuwe kaart, honderden euro\'s per transactie.',
      intel: 'Gokkers letten niet op hun omgeving. Maar de uitsmijter van het casino staat tien meter verderop en hij mist niets.',
    },
  },
  car_theft: {
    port: {
      targetDesc: 'Een Porsche Cayenne van een havenbaas, geparkeerd bij Dok 7 met de motor nog warm.',
      locationDesc: 'Het containerterrein van Port Nero — zoeklichten, beveiligingshekken, maar ook dode hoeken en ontsnappingsroutes via het water.',
      intel: 'De havenbaas is binnen aan het onderhandelen. Zijn chauffeur drinkt koffie in de portiersloge. De sleutel zit soms nog in het contact.',
    },
    crown: {
      targetDesc: 'Een Lamborghini achtergelaten door de valet parking voor een penthouse in het financieel district.',
      locationDesc: 'Crown Heights residentieel — privébewaking, drone-surveillance, maar ook de arrogantie van de rijken die hun sleutel in het contact laten.',
      intel: 'De valet parking is de zwakste schakel. Twee minuten pauze voor een telefoontje — dat is je window. Maar de GPS-tracking activeert binnen seconden.',
    },
    iron: {
      targetDesc: 'Een gepantserde Mercedes-AMG van Hammer, de baas van de Iron Skulls, geparkeerd bij de staalfabriek.',
      locationDesc: 'De zijingang van het fabriekscomplex in Iron Borough — bewaakt door Skulls-leden, maar niet onmogelijk.',
      intel: 'Suïcidaal of briljant. De auto is €150.000 waard. Maar als de Iron Skulls je pakken, vind je jezelf terug op de bodem van de rivier.',
    },
    low: {
      targetDesc: 'Een opgevoerde Honda Civic Type R met custom turbo en nitrous, geparkeerd achter de kapper.',
      locationDesc: 'De achterstraten van Lowrise — onverlicht, onbewaakt, maar vol met ogen achter de gordijnen.',
      intel: 'Niet de duurste auto, maar de underground-racescene betaalt grof voor dit soort machines. En niemand komt klagen bij de politie.',
    },
    neon: {
      targetDesc: 'Een Ferrari 488 fout geparkeerd voor de VIP-ingang van de club, waarschuwingslichten nog aan.',
      locationDesc: 'De boulevard van de Neon Strip — drukte, neonlichten, en een influencer-eigenaar die uren aan het feesten is.',
      intel: 'Check zijn Instagram — als hij stories post, is hij nog binnen. Je hebt alle tijd. Maar de Strip heeft ogen overal.',
    },
  },
  store_robbery: {
    port: {
      targetDesc: 'Een smokkelaarskantoor bij de haven vol contant geld en ongeregistreerde goederen.',
      locationDesc: 'Dok 3, Port Nero — een vervallen kantoor achter de containers, bewaakt door één man met een walkietalkie.',
      intel: 'Het kantoor wordt gebruikt als tussenstation voor illegale handel. Cash wordt hier niet op de bank gezet maar in kluisjes bewaard. Minimale beveiliging, maximale buit.',
    },
    crown: {
      targetDesc: 'Een exclusieve juwelier met kogelvrij glas, laserbeveiliging en een directe lijn naar privébeveiliging.',
      locationDesc: 'De gouden mijl van Crown Heights — vitrines vol diamanten en platina, beveiligd als een fort.',
      intel: 'De buit is het dubbele waard van elke andere locatie. Maar de beveiliging is drie niveaus hoger. Één fout en je hebt een SWAT-team op je dak.',
    },
    iron: {
      targetDesc: 'Een pandjesbaas met vitrines vol gestolen goud en tweedehands sieraden in een grauwe winkelstraat.',
      locationDesc: 'Het handelsblok van Iron Borough — grijs beton, rolluiken, en een eigenaar die iedereen kent.',
      intel: 'Minimale beveiliging, maar de hele buurt kijkt mee. Iedereen kent iedereen hier. Snelheid is essentieel — binnen en buiten in drie minuten.',
    },
    low: {
      targetDesc: 'Een goudhandelaar met een simpele vitrine, een hangslot, en een veteraan-eigenaar met een shotgun onder de toonbank.',
      locationDesc: 'Een hoekpand in Lowrise — stoffig, rommelig, maar achter de toonbank liggen duizenden euro\'s aan goud.',
      intel: 'De eigenaar heeft dertig jaar ervaring met overvallers en een afgekorte shotgun binnen handbereik. Onderschat hem niet.',
    },
    neon: {
      targetDesc: 'Een luxe horlogewinkel op de Strip, vol met toeristen en dure collecties achter minimaal glas.',
      locationDesc: 'De Neon Strip — glanzend, modern, druk met toeristen die foto\'s maken en prijzen vergelijken.',
      intel: 'In de chaos van twintig rondlopende mensen valt één paar snelle handen niet op. Maar de Strip heeft overal camera\'s.',
    },
  },
  crypto_heist: {
    port: {
      targetDesc: 'Een illegale crypto-mijnbouwoperatie in een omgebouwd containerschip bij Dok 9.',
      locationDesc: 'De buitenste kade van Port Nero — een containerschip vol servers, gekoeld door zeelucht, bewaakt door twee man.',
      intel: 'Het schip draait op gestolen stroom van de haven. De beveiliging is fysiek, niet digitaal. Maar de wallets bevatten miljoenen aan Ethereum.',
    },
    crown: {
      targetDesc: 'De cold storage wallet van een hedgefund met drie lagen biometrische beveiliging.',
      locationDesc: 'Het penthouse van een financieel kantoor in Crown Heights — 23 verdiepingen, keycard-toegang, en een cybersecurity-team dat 24/7 monitort.',
      intel: 'De beloning is astronomisch, maar één fout en je wordt gevonden voordat je het gebouw uit bent. Het wachtwoord roteert elke 10 minuten.',
    },
    iron: {
      targetDesc: 'Een Bitcoin-wasserij verborgen in de kelder van een verlaten staalfabriek.',
      locationDesc: 'Het verlaten industriecomplex van Iron Borough — roestige machines, lege hallen, en ergens in de kelder een server die miljoenen verwerkt.',
      intel: 'De Iron Skulls runnen deze operatie. Fysieke beveiliging is zwaar, maar de digitale kant is amateuristisch. Hack de software, niet de deur.',
    },
    low: {
      targetDesc: 'Een darknet-marktplaats beheerd vanuit een appartement boven een wasserette.',
      locationDesc: 'Een anoniem flatgebouw in Lowrise — drie sloten op de deur, maar de WiFi is onbeveiligd en het netwerk lekt als een mandje.',
      intel: 'De beheerder is een eenling die zelden buiten komt. Zijn systeem is kwetsbaar via een bekende exploit. Maar hij heeft een alarmsysteem dat de hele buurt wakker maakt.',
    },
    neon: {
      targetDesc: 'Een illegaal crypto-wisselkantoor achter een club op de Strip, vol met hot wallets.',
      locationDesc: 'Achter de Velvet Room op de Neon Strip — twee bewakers bij de deur, één camera, en een paranoïde beheerder die zijn systeem dagelijks verandert.',
      intel: 'De walletbeheerder is een genie maar ook een gokker. Na een goede avond in het casino is hij afgeleid. Dat is je moment.',
    },
  },
};

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
  { id: 'glock', type: 'weapon', name: 'Glock 17', cost: 1500, stats: { muscle: 2 }, desc: '+2 Kracht. Betrouwbaar.', reqRep: null, ammoType: '9mm', clipSize: 8 },
  { id: 'shotgun', type: 'weapon', name: 'Sawn-Off Shotgun', cost: 3500, stats: { muscle: 4 }, desc: '+4 Kracht. Kort bereik, verwoestend.', reqRep: null, ammoType: 'shells', clipSize: 4 },
  { id: 'ak47', type: 'weapon', name: 'AK-47', cost: 4500, stats: { muscle: 5 }, desc: '+5 Kracht. Zwaar geschut.', reqRep: null, ammoType: '7.62mm', clipSize: 15 },
  { id: 'sniper', type: 'weapon', name: 'Dragunov SVD', cost: 9000, stats: { muscle: 7 }, desc: '+7 Kracht. Precisie op afstand. Kleine clip, verwoestende schade.', reqRep: { f: 'bikers', val: 40 }, ammoType: '7.62mm', clipSize: 5 },
  { id: 'vest', type: 'armor', name: 'Kevlar Vest', cost: 2500, stats: { muscle: 1 }, desc: '+1 Kracht & Defense.', reqRep: null },
  { id: 'suit', type: 'armor', name: 'Italiaans Pak', cost: 6000, stats: { charm: 4 }, desc: '+4 Charisma. Klasse.', reqRep: null },
  { id: 'phone', type: 'gadget', name: 'Burner Phone', cost: 1000, stats: { brains: 1 }, desc: '+1 Vernuft.', reqRep: null },
  { id: 'laptop', type: 'gadget', name: 'Hacker Laptop', cost: 5000, stats: { brains: 4 }, desc: '+4 Vernuft. Deep web.', reqRep: null },
  { id: 'cartel_blade', type: 'weapon', name: 'El Serpiente\'s Blade', cost: 12000, stats: { muscle: 8 }, desc: '+8 Kracht. Legendarisch zwaard van El Serpiente. Geen munitie nodig.', reqRep: { f: 'cartel', val: 60 }, ammoType: null, clipSize: 0 },
  { id: 'lotus_implant', type: 'gadget', name: 'Neural Implant', cost: 18000, stats: { brains: 7, charm: 2 }, desc: '+7 Vernuft, +2 Charisma.', reqRep: { f: 'syndicate', val: 60 } },
  { id: 'skull_armor', type: 'armor', name: 'Skull Plate Armor', cost: 15000, stats: { muscle: 5 }, desc: '+5 Kracht. Onbreekbaar.', reqRep: { f: 'bikers', val: 60 } },
  // Prestige 3+ Gear
  { id: 'voidcaster', type: 'weapon', name: 'Voidcaster Mk-III', cost: 45000, stats: { muscle: 12 }, desc: '+12 Kracht. Experimenteel prototype. Prestige-only.', reqRep: null, reqPrestige: 3, ammoType: '7.62mm', clipSize: 20 },
  { id: 'nox_exosuit', type: 'armor', name: 'Nox Exo-Suit', cost: 60000, stats: { muscle: 8, charm: 3 }, desc: '+8 Kracht, +3 Charisma. Gepantserd exoskelet van Noxhaven-tech.', reqRep: null, reqPrestige: 3 },
  { id: 'quantum_deck', type: 'gadget', name: 'Quantum Hacking Deck', cost: 55000, stats: { brains: 10, charm: 1 }, desc: '+10 Vernuft, +1 Charisma. Kraak elk systeem. Prestige-only.', reqRep: null, reqPrestige: 3 },
  { id: 'obsidian_edge', type: 'weapon', name: 'Obsidian Edge', cost: 75000, stats: { muscle: 15 }, desc: '+15 Kracht. Monomoleculair mes. De ultieme stille killer.', reqRep: null, reqPrestige: 4, ammoType: null, clipSize: 0 },
];

export const BUSINESSES: Business[] = [
  { id: 'restaurant', name: 'Ristorante Nero', cost: 10000, income: 400, clean: 300, desc: 'Wasstraat voor zwart geld.' },
  { id: 'club', name: 'Club Paradiso', cost: 25000, income: 800, clean: 600, desc: 'Nachtclub met dubieuze gasten.' },
  { id: 'autogarage', name: 'Tony\'s Autogarage', cost: 15000, income: 500, clean: 400, desc: 'Garagebedrijf en chop shop.' },
  { id: 'ammo_factory', name: 'Kogelfabriek', cost: 35000, income: 0, clean: 0, desc: 'Produceert dagelijks 3 kogels.' },
  // Endgame businesses
  { id: 'haven_import', name: 'Havenpakhuis Import/Export', cost: 50000, income: 1200, clean: 800, desc: 'Legale import als dekmantel voor smokkelwaar.', reqDistrict: 'port' },
  { id: 'goudhandel', name: 'Goudhandel De Kroon', cost: 75000, income: 1500, clean: 1200, desc: 'Edelmetaal en juwelen — perfecte witwasoperatie.', reqDistrict: 'crown' },
  { id: 'escort', name: 'Neon Escort Agency', cost: 60000, income: 1800, clean: 500, desc: 'Exclusieve escortservice met rijke klanten.', reqDistrict: 'neon', reqRep: 200 },
  { id: 'bouwbedrijf', name: 'Bouwbedrijf IJzerwerk', cost: 80000, income: 1000, clean: 1500, desc: 'Aannemersbedrijf dat grote sommen witwast via nepfacturen.', reqDistrict: 'iron' },
  { id: 'cryptobeurs', name: 'Cryptobeurs NoxCoin', cost: 100000, income: 2500, clean: 2000, desc: 'Cryptoplatform — hoge opbrengst, digitaal witwassen.', reqRep: 300, reqDay: 30 },
  { id: 'hotel', name: 'Hotel Noxhaven Grand', cost: 150000, income: 3000, clean: 2500, desc: 'Het kroonjuweel — luxehotel met VIP-gasten en maximale dekking.', reqRep: 400, reqBusinessCount: 3 },
];

// ========== RACING CONSTANTS ==========

import { RaceDef, RaceNPC, UniqueVehicle, DealerDeal } from './types';

export const RACES: RaceDef[] = [
  { id: 'street', name: 'Straatrace', desc: 'Illegale race door Lowrise. Snel geld, weinig risico.', minBet: 1000, maxBet: 5000, heatGain: 5, icon: '🏁' },
  { id: 'harbor', name: 'Havenrun', desc: 'Gevaarlijke race langs de kades van Port Nero.', minBet: 5000, maxBet: 15000, heatGain: 12, reqDistrict: 'port', icon: '⚓' },
  { id: 'neon_gp', name: 'Neon Grand Prix', desc: 'De ultieme illegale race op de Neon Strip.', minBet: 15000, maxBet: 50000, heatGain: 20, reqDistrict: 'neon', reqDay: 20, icon: '🏎️' },
];

export const RACE_NPCS: RaceNPC[] = [
  { name: 'Razor Eddie', vehicle: 'Getunede Supra', skill: 3 },
  { name: 'Nitro Nadia', vehicle: 'Zwarte Mustang', skill: 5 },
  { name: 'El Diablo', vehicle: 'Rode Ferrari', skill: 7 },
  { name: 'Ghost', vehicle: 'Witte Porsche', skill: 8 },
  { name: 'Iron Mike', vehicle: 'Gepantserde BMW', skill: 4 },
  { name: 'Silk', vehicle: 'Zilveren Mercedes', skill: 6 },
  { name: 'Turbo Tina', vehicle: 'Groene Lambo', skill: 9 },
];

// ========== UNIQUE VEHICLES ==========

export const UNIQUE_VEHICLES: UniqueVehicle[] = [
  { id: 'decker_phantom', name: "Decker's Phantom", storage: 15, speed: 3, armor: 4, charm: 25, desc: 'Het persoonlijke voertuig van Commissaris Decker. Legendarisch.', unlockCondition: 'Versla Decker (final boss)', unlockCheck: 'final_boss', icon: '👻' },
  { id: 'cartel_bulldozer', name: 'Cartel Bulldozer', storage: 40, speed: -2, armor: 5, charm: 5, desc: 'Een gepantserd monster van het kartel. Onverwoestbaar.', unlockCondition: 'Verover alle 3 facties', unlockCheck: 'all_factions', icon: '🦏' },
  { id: 'nemesis_trophy', name: 'Nemesis Trophy Car', storage: 10, speed: 6, armor: 2, charm: 10, desc: 'Gebouwd van de wrakken van je verslagen vijanden.', unlockCondition: 'Versla 3 nemesis-generaties', unlockCheck: 'nemesis_gen3', icon: '🏆' },
  { id: 'gouden_klassiek', name: 'Gouden Klassiek', storage: 20, speed: 3, armor: 3, charm: 15, desc: 'Een volledig vergulde klassieke auto. Ultiem statussymbool.', unlockCondition: 'Bezit alle 6 reguliere voertuigen', unlockCheck: 'all_vehicles', icon: '✨' },
];

// ========== DEALER CONSTANTS ==========

export const VEHICLE_SELL_RATIO = 0.55; // base sell percentage

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

export interface CombatEnvAction {
  label: string;
  desc: string;
  logs: string[];
}

export interface CombatEnvironment {
  name: string;
  scenePhrases: string[];
  actions: {
    attack: CombatEnvAction;
    heavy: CombatEnvAction;
    defend: CombatEnvAction;
    environment: CombatEnvAction;
    tactical: CombatEnvAction & { stat: StatId };
  };
  enemyAttackLogs: string[];
}

export const COMBAT_ENVIRONMENTS: Record<string, CombatEnvironment> = {
  port: {
    name: "Havenkade",
    scenePhrases: [
      "De zilte wind blaast over de verlaten kade. Containers torenen als stalen muren om je heen.",
      "Een scheepshoorn loeit in de verte terwijl je vijand achter een vorkheftruck duikt.",
      "Olie glanst op het natte beton. De geur van diesel en gevaar hangt in de lucht.",
      "Meeuwen krijsen boven het slagveld. Golven klotsen tegen de kademuur.",
      "Roest en zout. De containers trillen bij elke inslag.",
    ],
    actions: {
      attack: { label: "VUUR VANUIT DEKKING", desc: "Schiet vanachter een container", logs: [
        "Je vuurde vanuit dekking achter een roestige container — {dmg} schade!",
        "Kogels ketsen af op staal terwijl jij raak schiet — {dmg} schade!",
        "Je richt door een kier tussen containers en treft doel — {dmg} schade!",
      ]},
      heavy: { label: "KRAAN LATEN VALLEN", desc: "Riskant maar verwoestend", logs: [
        "Je kapt het kraankabel door — de lading dondert neer! {dmg} schade!",
        "Een containerhaak slingert als een moker naar je vijand — {dmg} schade!",
        "Je trapt een stapel vaten om die je vijand verpletteren — {dmg} schade!",
      ]},
      defend: { label: "DEKKING ACHTER CONTAINERS", desc: "Gebruik de havenkade als schild", logs: [
        "Je duit weg achter een zeecontainer en vangt adem. +{heal} HP.",
        "Het staal van de container absorbeert de kogels. Je herstelt. +{heal} HP.",
        "Je glijdt achter een vorkheftruck en likt je wonden. +{heal} HP.",
      ]},
      environment: { label: "HAAKKABEL SLINGEREN", desc: "Stun met havenwerktuigen", logs: [
        "Je slingert een haakkabel naar je vijand — STUNNED!",
        "Een zwaar anker slingert door de lucht en raakt doel — STUNNED!",
        "Je activeert een loskraan die je vijand onder debris begraaft — STUNNED!",
      ]},
      tactical: { label: "VLUCHTHAVEN", desc: "Spring in het water voor reset", stat: "brains", logs: [
        "Je sprint naar de kaderand en springt! Het ijskoude water wast het bloed weg...",
        "Een duik in de haven — je vijand verliest je uit het oog. Je hergroepeert.",
        "Het water sluit zich boven je hoofd. Even stilte. Dan klim je eruit, klaar voor meer.",
      ]},
    },
    enemyAttackLogs: [
      "{name} schiet vanuit een containerdeur! {dmg} schade!",
      "{name} gooit een brandbom over de kade! {dmg} schade!",
      "{name} vuurt blindelings door het staal! {dmg} schade!",
      "{name} slingert een kettinghaak naar je hoofd! {dmg} schade!",
    ],
  },
  crown: {
    name: "Penthouse",
    scenePhrases: [
      "Glazen wanden reflecteren de skyline. De geur van dure whiskey en angst vult de penthouse.",
      "Beveiligingscamera's zoemen. Ergens klinkt een alarm. De luxe verbergt dodelijk gevaar.",
      "Marmer kraakt onder je voeten. Kogelgaten verschijnen in schilderijen van miljoenen.",
      "De lift is geblokkeerd. De enige weg is erdoorheen. Of eruit — 40 verdiepingen naar beneden.",
      "Kristallen kroonluchters trillen bij elke explosie. Dit penthouse wordt een slagveld.",
    ],
    actions: {
      attack: { label: "PRECISIE SCHOT", desc: "Chirurgisch nauwkeurig", logs: [
        "Je schiet door de glazen wand — glasscherven regenen neer. {dmg} schade!",
        "Een enkel, precies schot weergalmt door de marmeren hal — {dmg} schade!",
        "Je vijand duikt achter een bank, maar je kogel vindt zijn weg — {dmg} schade!",
      ]},
      heavy: { label: "KROONLUCHTER NEERHALEN", desc: "Laat het plafond instorten", logs: [
        "De kristallen kroonluchter stort neer in een regen van glas! {dmg} schade!",
        "Je schiet de draagkabels door — tonnen kristal verpletteren alles! {dmg} schade!",
        "Een sculptuur ter waarde van miljoenen dient als projectiel — {dmg} schade!",
      ]},
      defend: { label: "VERSCHANS ACHTER BAR", desc: "Eiken bar als dekking", logs: [
        "Je duikt achter de marmeren bar. Flessen exploderen om je heen. +{heal} HP.",
        "De massief eiken bar houdt alles tegen. Je herstelt achter dure whiskey. +{heal} HP.",
        "Kogelvrij glas beschermt je terwijl je adem haalt. +{heal} HP.",
      ]},
      environment: { label: "BEVEILIGINGSSYSTEEM", desc: "Activeer lockdown", logs: [
        "Je hackt het security-paneel — stalen deuren sluiten je vijand in! STUNNED!",
        "Het sprinklersysteem activeert — je vijand glijdt uit op de natte marmervloer! STUNNED!",
        "Je triggert het alarmsysteem — oorverdovend lawaai desoriënteert je vijand! STUNNED!",
      ]},
      tactical: { label: "ALARM TRIGGEREN", desc: "Vijand raakt in paniek", stat: "brains", logs: [
        "Je activeert het stille alarm. Paniek flitst over het gezicht van je vijand...",
        "Beveiligingsprotocol OMEGA geactiveerd. Je vijand beseft dat de tijd dringt.",
        "Het gebouw gaat in lockdown. Jij kent de uitweg — je vijand niet.",
      ]},
    },
    enemyAttackLogs: [
      "{name} vuurt vanachter een pilaar van marmer! {dmg} schade!",
      "{name} smijt een glazen tafel naar je hoofd! {dmg} schade!",
      "{name} schiet door de spiegelmuur — overal reflecties! {dmg} schade!",
      "{name} activeert een verborgen wapen in het bureau! {dmg} schade!",
    ],
  },
  iron: {
    name: "Fabrieksvloer",
    scenePhrases: [
      "Gesmolten metaal sist in de goten. De hitte is ondraaglijk. Machines stampen onophoudelijk.",
      "Vonken spatten van lasapparaten. De lucht trilt van industrieel geweld.",
      "Stalen balken strekken zich uit als het skelet van een mechanisch monster.",
      "De geur van verbrand metaal en machineolie. Hier wordt niet gepraat — hier wordt gevochten.",
      "Transportbanden draaien door. De fabriek stopt voor niemand — ook niet voor een vuurgevecht.",
    ],
    actions: {
      attack: { label: "STALEN VUIST", desc: "Brute kracht met gereedschap", logs: [
        "Je grijpt een moersleutel en slaat toe als een smid — {dmg} schade!",
        "Een stalen pijp wordt je wapen. Het geluid van metaal op vlees — {dmg} schade!",
        "Je vuurt tussen de machines door — vonken en bloed! {dmg} schade!",
      ]},
      heavy: { label: "OVEN OPENGOOIEN", desc: "Gesmolten metaal als wapen", logs: [
        "Je opent de smeltoven — een golf van hitte en vloeibaar staal! {dmg} schade!",
        "Gesmolten metaal stroomt over de vloer naar je vijand! {dmg} schade!",
        "Je kantelt een gieterijpan — een regen van vonken en vuur! {dmg} schade!",
      ]},
      defend: { label: "SCHILD VAN STAAL", desc: "Gebruik een stalen plaat", logs: [
        "Je grijpt een stalen plaat als schild. Kogels ketsen af als regen. +{heal} HP.",
        "Achter de lopende band vind je even rust. Het metaal beschermt je. +{heal} HP.",
        "Je verschuilt je achter een stapel staalblokken. +{heal} HP.",
      ]},
      environment: { label: "MACHINE ACTIVEREN", desc: "Stuur machines op je vijand af", logs: [
        "Je activeert de hydraulische pers — je vijand moet wegspringen! STUNNED!",
        "De transportband sleurt je vijand mee tussen de tandwielen! STUNNED!",
        "Je schakelt de lasrobot in — een blauwe vlam zwaait wild rond! STUNNED!",
      ]},
      tactical: { label: "OVEN OPENEN", desc: "Brand-schade in de hele hal", stat: "muscle", logs: [
        "Je trapt de noodklep van de smeltoven open. De hele hal vult zich met verzengende hitte!",
        "Vloeibaar staal stroomt vrij. De fabrieksvloer wordt een hel op aarde.",
        "De temperatuur stijgt explosief. In deze hitte overleeft alleen de sterkste.",
      ]},
    },
    enemyAttackLogs: [
      "{name} slingert een kettingblok naar je ribben! {dmg} schade!",
      "{name} vuurt vanachter een stapel staalplaten! {dmg} schade!",
      "{name} duwt een kar vol metaal in je richting! {dmg} schade!",
      "{name} slaat met een smidshamer! {dmg} schade!",
    ],
  },
  low: {
    name: "Steegje",
    scenePhrases: [
      "Gebroken straatlantaarns flikkeren. De steeg stinkt naar afval en angst.",
      "Graffiti-muren sluiten je in. Ergens boven je kraakt een brandtrap.",
      "Ratten vluchten voor het geluid van schoten. Dit is hun territorium — en het jouwe.",
      "Waslijn boven je hoofd. Vuilnisbakken als dekking. Lowrise op z'n rauwst.",
      "Een sirene in de verte. Hier komt geen hulp. Hier los je het zelf op.",
    ],
    actions: {
      attack: { label: "STEEKPARTIJ", desc: "Snel en vuil", logs: [
        "Je springt uit de schaduw met een mes — snel en dodelijk! {dmg} schade!",
        "Een snelle steek tussen de ribben. Lowrise-stijl. {dmg} schade!",
        "Je gooit een gebroken fles — het glas vindt z'n doel! {dmg} schade!",
      ]},
      heavy: { label: "VUILNISBAK RAMMEN", desc: "Volledige kracht", logs: [
        "Je ramt een volle vuilnisbak tegen je vijand! {dmg} schade!",
        "Een baksteen van de muur dient als projectiel — raak! {dmg} schade!",
        "Je trapt een brandtrap los die op je vijand neerkomt! {dmg} schade!",
      ]},
      defend: { label: "VERDWIJN IN SCHADUWEN", desc: "De duisternis is je vriend", logs: [
        "Je smeltt weg in de schaduwen van de steeg. Even ademen. +{heal} HP.",
        "Achter een dumpster vind je een moment van rust. +{heal} HP.",
        "De duisternis omhelst je. Je vijand schiet op schaduwen. +{heal} HP.",
      ]},
      environment: { label: "VAL ZETTEN", desc: "Gebruik de steeg tegen ze", logs: [
        "Je trekt een waslijn strak — je vijand struikelt en valt! STUNNED!",
        "Een vuilnisbak rolt de steeg in en blokkeert je vijand! STUNNED!",
        "Je gooit een rat naar je vijand — pure paniek! STUNNED!",
      ]},
      tactical: { label: "VLUCHT VIA DAKEN", desc: "Ontsnap en herstel", stat: "charm", logs: [
        "Je klimt razendsnel de brandtrap op. De daken van Lowrise zijn jouw domein.",
        "Over de daken spring je van gebouw naar gebouw. Beneden hoer je gefrustreerd geschreeuw.",
        "Je verdwijnt via een dakraam. Even later duik je op achter je vijand.",
      ]},
    },
    enemyAttackLogs: [
      "{name} springt uit een portiek met een mes! {dmg} schade!",
      "{name} smijt een baksteen van het dak! {dmg} schade!",
      "{name} vuurt vanuit een raamkozijn! {dmg} schade!",
      "{name} schopt een brandende vuilnisbak naar je toe! {dmg} schade!",
    ],
  },
  neon: {
    name: "VIP Lounge",
    scenePhrases: [
      "Neonlicht pulseert in paars en roze. De bas dreunt door je borstkas. Chaos op de dansvloer.",
      "Gebroken cocktailglazen knarsen onder je schoenen. De DJ draait door alsof er niets aan de hand is.",
      "Stroboscooplicht maakt alles surreëel. Tussen de flitsen door zie je je vijand bewegen.",
      "De geur van parfum, zweet en cordiet. De Neon Strip verandert elke club in een arena.",
      "LED-schermen flikkeren. De menigte schreeuwt. Is het de muziek of het gevecht?",
    ],
    actions: {
      attack: { label: "SCHOT DOOR DE MENIGTE", desc: "Precisie in de chaos", logs: [
        "Je richt tussen de dansende lichamen door — een perfect schot! {dmg} schade!",
        "De stroboscoop flitst. Je vuurt. Raak. {dmg} schade!",
        "Door het neonlicht zie je je doel. Eén knal boven de muziek uit — {dmg} schade!",
      ]},
      heavy: { label: "SPEAKER LANCEREN", desc: "Geluidsgolven als wapen", logs: [
        "Je trapt een speaker van het podium — bas en bloed! {dmg} schade!",
        "De subwoofer wordt een projectiel van 50 kilo! {dmg} schade!",
        "Je smijt een lichtbak van het plafond — neon en vlammen! {dmg} schade!",
      ]},
      defend: { label: "MENIGTE ALS SCHILD", desc: "Verdwijn in de massa", logs: [
        "Je duikt de dansende menigte in. Even onzichtbaar. +{heal} HP.",
        "Achter de DJ-booth vind je dekking en een moment rust. +{heal} HP.",
        "Je glijdt achter de bar. Neonlicht verbergt je bewegingen. +{heal} HP.",
      ]},
      environment: { label: "ROOKMACHINE", desc: "Creëer chaos met rook en licht", logs: [
        "Je activeert alle rookmachines tegelijk — totale chaos! STUNNED!",
        "Stroboscoop op maximum. Je vijand is volledig gedesoriënteerd! STUNNED!",
        "Je gooit een drankfles tegen het lichtpaneel — vonken en duisternis! STUNNED!",
      ]},
      tactical: { label: "BLACKOUT", desc: "Lichten uit, bonus stun", stat: "brains", logs: [
        "Je vindt de stroomkast en trekt de hoofdschakelaar. Totale duisternis valt over de Strip.",
        "Blackout. De bas stopt. In de stilte hoor je alleen je eigen hartslag — en die van je vijand.",
        "Alle neon dooft tegelijk. In het donker ben jij de jager.",
      ]},
    },
    enemyAttackLogs: [
      "{name} vuurt door de rookwolken! {dmg} schade!",
      "{name} smijt een cocktailshaker naar je gezicht! {dmg} schade!",
      "{name} schiet vanachter de bar! {dmg} schade!",
      "{name} springt van het podium met een mes! {dmg} schade!",
    ],
  },
};

export const BOSS_DATA: Record<string, { name: string; hp: number; attack: number; desc: string }> = {
  cartel: { name: 'El Serpiente', hp: 120, attack: 18, desc: 'Leider van het Rojo Cartel. Meedogenloos.' },
  syndicate: { name: 'Mr. Wu', hp: 100, attack: 22, desc: 'Blue Lotus mastermind. Dodelijk precies.' },
  bikers: { name: 'Hammer', hp: 150, attack: 15, desc: 'Iron Skulls president. Een muur van staal.' },
};

// ========== FACTION CONQUEST PHASES ==========
export interface ConquestPhaseEnemy {
  name: string;
  hp: number;
  attack: number;
  introLines: string[];
  desc: string;
}

export const FACTION_CONQUEST_PHASES: Record<FamilyId, { phase1: ConquestPhaseEnemy; phase2: ConquestPhaseEnemy }> = {
  cartel: {
    phase1: {
      name: 'Capitán Fuego',
      hp: 60,
      attack: 12,
      introLines: [
        'Een getatoeëerde luitenant blokkeert de ingang van het Cartel-fort.',
        '"Je komt hier niet langs, gringo. El Serpiente verwacht je niet."',
      ],
      desc: 'Rechterhand van El Serpiente. Bewaakt de buitenposten van Port Nero.',
    },
    phase2: {
      name: 'De Cartel Elite Guard',
      hp: 85,
      attack: 16,
      introLines: [
        'Drie zwaar bewapende Cartel-soldaten vormen de laatste verdedigingslinie.',
        '"El Serpiente weet dat je komt. Dit wordt je graf."',
      ],
      desc: 'De elite beschermingseenheid van het Rojo Cartel.',
    },
  },
  syndicate: {
    phase1: {
      name: 'Ghost',
      hp: 50,
      attack: 14,
      introLines: [
        'Een slanke figuur in een zwart pak verschijnt uit de schaduwen.',
        '"Mr. Wu stuurt zijn groeten... en zijn kogels."',
      ],
      desc: 'Blue Lotus spion en saboteur. Onzichtbaar tot het te laat is.',
    },
    phase2: {
      name: 'De Jade Wachters',
      hp: 80,
      attack: 20,
      introLines: [
        'Twee zwaardvechters in ceremonieel pantser bewaken de troonzaal.',
        '"Alleen de waardigen mogen Mr. Wu\'s aanwezigheid betreden."',
      ],
      desc: 'Ceremoniële krijgers die de binnenste sanctum van Blue Lotus bewaken.',
    },
  },
  bikers: {
    phase1: {
      name: 'Chainsaw Pete',
      hp: 70,
      attack: 11,
      introLines: [
        'Een berg van een man met een kettingzaag blokkeert de weg naar het clubhuis.',
        '"Hammer zegt: niemand komt langs Pete. NIEMAND."',
      ],
      desc: 'Sergeant-at-Arms van de Iron Skulls. Meer spier dan verstand.',
    },
    phase2: {
      name: 'De Road Captains',
      hp: 90,
      attack: 14,
      introLines: [
        'Vier motoren blokkeren de oprit. De Road Captains stappen af.',
        '"Je hebt Pete verslagen. Respect. Maar dit is waar het stopt."',
      ],
      desc: 'De veteranen van de Iron Skulls. Samen onverslaanbaar — bijna.',
    },
  },
};

export const CONQUEST_PHASE_LABELS = [
  'Niet gestart',
  'Buitenpost Veroverd',
  'Verdediging Doorbroken',
  'Leider Bereikbaar',
] as const;

/** Minimum relation to start phase attacks (more hostile = more war) */
export const CONQUEST_PHASE_REL_REQ = -10;
/** Minimum sabotage actions needed before phase 1 */
export const CONQUEST_MIN_SABOTAGE = 2;
/** Days cooldown between conquest phases */
export const CONQUEST_PHASE_COOLDOWN = 1;

// ========== CONQUEST SUB-BOSS COMBAT OVERRIDES ==========

export const CONQUEST_COMBAT_OVERRIDES: Record<FamilyId, Record<1 | 2, BossCombatOverride>> = {
  cartel: {
    1: {
      introLines: [
        'Capitán Fuego staat wijdbeens voor de containerpoort. Twee gouden pistolen glinsteren.',
        '"Ik heb meer honden als jij begraven dan je kunt tellen, gringo."',
      ],
      scenePhrases: [
        'Rookgranaten walmen tussen de pallets. Fuego beweegt door de nevel als een geest — je hoort alleen zijn laarzen op het beton.',
        'Kogelgaten versieren de containers om je heen. Fuego lacht. Dit is zijn schietbaan.',
        'De geur van cordiet en hasj. Fuego\'s gouden tanden glinsteren in het maanlicht terwijl hij herlaadt.',
        'Ergens schreeuwt een nachtwaker. Fuego schiet achteloos in die richting. Stilte. "Waar waren we?"',
        'Ratten vluchten tussen de containers. Fuego trapt een leeg magazijn weg en trekt een nieuw.',
      ],
      enemyAttackLogs: [
        'Fuego vuurt met beide pistolen tegelijk — gouden hulzen rinkelen op de grond! {dmg} schade!',
        '"¡Fuego!" — hij steekt een molotovcocktail aan en slingert hem! {dmg} schade!',
        'Fuego duikt op achter een pallet en schiet je in de flank! {dmg} schade!',
        'Een snelle schop tegen je knie, gevolgd door een pistoolslag! {dmg} schade!',
      ],
      actions: {
        attack: { label: 'DOOR DE ROOK', desc: 'Schiet door de nevel', logs: [
          'Je vuurt door de rook — Fuego\'s schreeuw bevestigt een treffer! {dmg} schade!',
          'Je hoort zijn laarzen links — je draait en vuurt. Raak! {dmg} schade!',
          'Door de nevel zie je gouden glinstering. Je schiet. Fuego wankelt. {dmg} schade!',
        ]},
        heavy: { label: 'PALLET ONTPLOFFEN', desc: 'Schiet op de chemicaliën', logs: [
          'Je schiet op een drum met oplosmiddel — de explosie slingert Fuego weg! {dmg} schade!',
          'De pallet met vuurwerk explodeert als je er doorheen schiet — {dmg} schade!',
          'Je trapt een brandende oliedrum naar Fuego — BOEM! {dmg} schade!',
        ]},
        defend: { label: 'ACHTER CONTAINERS', desc: 'Gebruik de containers als dekking', logs: [
          'Je duikt achter een zeecontainer. Fuego\'s kogels ketsen af op het staal. +{heal} HP.',
          'De dikke containerwand absorbeert alles. Even ademen. +{heal} HP.',
          'Je rolt onder een trailer — Fuego\'s schoten missen op centimeters. +{heal} HP.',
        ]},
        environment: { label: 'KRAANLADING LOSSEN', desc: 'Laat een containerlading vallen', logs: [
          'Je haalt de vergrendeling van de kraan — dozen donderen op Fuego! STUNNED!',
          'Een netten vol contrabande slingert los en bedekt Fuego volledig! STUNNED!',
          'Je trekt aan de hijskabel — de pallet slingert en raakt Fuego vol! STUNNED!',
        ]},
        tactical: { label: 'SIGNAAL STOREN', desc: 'Blokkeer zijn radio', stat: 'brains', logs: [
          'Je hackt zijn walkietalkie. Fuego hoort vals alarm en draait zich om — opening!',
          'Statische ruis vult zijn oortje. Fuego grijpt verward naar zijn oor...',
          'Je stuurt een nepbericht via zijn kanaal. "Retreat!" Fuego aarzelt — dat is jouw moment.',
        ]},
      },
    },
    2: {
      introLines: [
        'Drie Elite Guards verschijnen uit de schaduwen, gewapend met gouden machetes en automatische wapens.',
        '"El Serpiente\'s laatste linie. Jullie sterven hier — samen."',
      ],
      scenePhrases: [
        'De Elite Guard beweegt als één organisme. Ze communiceren met handgebaren — militaire precisie in criminele verpakking.',
        'Achter hen glinstert de deur naar El Serpiente\'s troonzaal. Zo dichtbij, maar eerst moeten zij vallen.',
        'De geur van wierook en wapenpoetsolie. De Guard bidt niet — zij vechten.',
        'Patronen rinkelen op de marmeren vloer. De muren zijn versierd met kogelgaten en bloedvlekken.',
        'Eén guard dekt, de ander flankeert. Ze kennen elke truc. Bijna elke truc.',
      ],
      enemyAttackLogs: [
        'De guards openen tegelijk het vuur — een kruisvuur van lood! {dmg} schade!',
        'Een guard tackelt je terwijl een ander slaat met een gouden machete! {dmg} schade!',
        'Flashbang! Je bent verblind terwijl een guard je van achteren raakt! {dmg} schade!',
        '"¡Por El Serpiente!" Een guard springt van een balkon en trapt je neer! {dmg} schade!',
      ],
      actions: {
        attack: { label: 'ISOLEER ÉÉN', desc: 'Focus op één guard', logs: [
          'Je isoleert de voorste guard en vuurt — hij valt! De anderen aarzelen. {dmg} schade!',
          'Door precies te mikken schakel je de aanvoerder uit. Paniek in de rangen! {dmg} schade!',
          'Je lokt er één in een hinderlaag achter een pilaar — raak! {dmg} schade!',
        ]},
        heavy: { label: 'GRANAAT SLINGEREN', desc: 'Explosief antwoord', logs: [
          'Je slingert een granaat tussen de drie — de explosie versplintert hun formatie! {dmg} schade!',
          'Een rookgranaat gevolgd door blind vuur — je hoort ze schreeuwen! {dmg} schade!',
          'Je schiet op hun munitiekist — de secundaire explosie is verwoestend! {dmg} schade!',
        ]},
        defend: { label: 'TACTISCH TERUGTREKKEN', desc: 'Dwing ze in een smalle gang', logs: [
          'Je trekt terug naar een smalle doorgang — ze kunnen niet meer flaneren. +{heal} HP.',
          'Achter een omgevallen tafel hergroepeer je. Even ademen. +{heal} HP.',
          'Je gebruikt een spiegel om hun posities te checken zonder bloot te staan. +{heal} HP.',
        ]},
        environment: { label: 'LICHTEN DOVEN', desc: 'Schakel de verlichting uit', logs: [
          'Je schiet de zekeringkast aan flarden — totale duisternis! De guards botsen tegen elkaar! STUNNED!',
          'Noodverlichting flikkert. Je gooit een rookgranaat erbij — totale chaos! STUNNED!',
          'Je hackt het alarmsysteem — oorverdovende sirenes en stroboscopen! STUNNED!',
        ]},
        tactical: { label: 'VERDEEL EN HEERS', desc: 'Zet ze tegen elkaar op', stat: 'charm', logs: [
          '"Jullie baas heeft al een deal met mij!" De guards kijken elkaar wantrouwig aan...',
          'Je gooit een valse radiomelding de ruimte in. Eén guard twijfelt. Dat is genoeg.',
          '"Wie van jullie wordt de volgende Capitán?" Ze aarzelen — ambitie is hun zwakte.',
        ]},
      },
    },
  },
  syndicate: {
    1: {
      introLines: [
        'Ghost materialiseert uit het niets. Een mes in elke hand, ogen koud als kwik.',
        '"Je hebt me niet zien aankomen. Dat doen ze nooit."',
      ],
      scenePhrases: [
        'Ghost verplaatst zich door de schaduwen alsof hij er deel van uitmaakt. Je ziet alleen de glinstering van zijn messen.',
        'Hologramprojectoren creëren tientallen valse Ghost-silhouetten. Welke is echt?',
        'De lucht is ijskoud in deze serverruimte. Koelventilatoren brommen. Ghost ademt niet eens hoorbaar.',
        'Camerasystemen glitchen één voor één uit. Ghost wist zijn eigen sporen terwijl hij vecht.',
        'Een dun draadje bloed op de grond — het enige bewijs dat Ghost menselijk is.',
      ],
      enemyAttackLogs: [
        'Ghost verschijnt achter je en snijdt met een razormes! {dmg} schade!',
        'Een werpster flitst door de lucht — je voelt het pas als het bloed komt! {dmg} schade!',
        'Ghost verdwijnt en verschijnt naast je — een mes in je zij! {dmg} schade!',
        '"Boe." Ghost\'s fluistering is het laatste wat je hoort voor de klap. {dmg} schade!',
      ],
      actions: {
        attack: { label: 'SCHADUW DOORBREKEN', desc: 'Schiet waar hij verschijnt', logs: [
          'Je anticipeert zijn verschijning — als Ghost uit de schaduw stapt, schiet je raak! {dmg} schade!',
          'Door op de reflecties te letten vind je de echte Ghost. Raak! {dmg} schade!',
          'Je schiet op de schaduw die net iets te snel beweegt — Ghost sist van pijn! {dmg} schade!',
        ]},
        heavy: { label: 'SERVERRACK OMDUWEN', desc: 'Vernietig zijn dekking', logs: [
          'Je duwt een rij serverracks als dominostenen om — Ghost wordt bedolven! {dmg} schade!',
          'Een brandblusserschot in zijn gezicht, gevolgd door een trap — {dmg} schade!',
          'Je smijt een UPS-eenheid naar Ghost\'s positie — vonken en impact! {dmg} schade!',
        ]},
        defend: { label: 'THERMISCHE SCAN', desc: 'Gebruik warmte om hem te vinden', logs: [
          'Je activeert je telefoon\'s warmtedetectie — Ghost kan zich niet meer verstoppen. +{heal} HP.',
          'Door meel in de lucht te gooien zie je zijn silhouet. Even ademen. +{heal} HP.',
          'Je trapt een brandblusser aan — het schuim verraadt Ghost\'s voetstappen. +{heal} HP.',
        ]},
        environment: { label: 'EMP ONTLADING', desc: 'Schakel zijn camouflage uit', logs: [
          'Je kort de stroomkabels — een EMP-puls schakelt Ghost\'s stealth-tech uit! STUNNED!',
          'De noodverlichting floept aan — Ghost staat bevroren in het felle licht! STUNNED!',
          'Je overvolt de serverkoeling — ijskoude CO2 bevriest Ghost halverwege een sprint! STUNNED!',
        ]},
        tactical: { label: 'SPIEGELTRUC', desc: 'Gebruik reflecties tegen hem', stat: 'brains', logs: [
          'Je plaatst je telefoon als spiegel. Ghost valt zijn eigen reflectie aan — jouw kans!',
          'Met de glazen wanden als periscoop volg je Ghost zonder dat hij het weet.',
          'Je projecteert een hologram van jezelf. Ghost valt het aan — maar jij staat achter hem.',
        ]},
      },
    },
    2: {
      introLines: [
        'De Jade Wachters blokkeren de deur in ceremonieel gevechtstenue. Hun zwaarden gloeien blauw.',
        '"Duizend jaar traditie beschermt deze drempel. Jij bent het niet waard."',
      ],
      scenePhrases: [
        'De Jade Wachters bewegen in perfecte synchronisatie — een dodelijke dans gepolijst door decennia training.',
        'Wierook kringelt rond hun gevechtsstances. Elk gebaar is berekend, elk slaan is fataal.',
        'De troonzaal is een mix van oude traditie en ultramoderne tech. De Wachters zijn het beste van beide.',
        'Hun ceremoniële pantser absorbeert kogels als papier. Dit zijn geen gewone vechters.',
        'Kalligrafie op de muren vertelt verhalen van vorige indringers. Geen van hen overleefde.',
      ],
      enemyAttackLogs: [
        'Een Jade Wachter slingert zijn gloeiende zwaard in een perfecte boog! {dmg} schade!',
        'Beide Wachters vallen synchroon aan — links en rechts tegelijk! {dmg} schade!',
        'Een Wachter werpt sterren met dodelijke precisie! {dmg} schade!',
        '"Onwaardig!" Een kniestoot gevolgd door een zwaardslag! {dmg} schade!',
      ],
      actions: {
        attack: { label: 'PANTSER BREKEN', desc: 'Zoek de zwakke plekken', logs: [
          'Je schiet op de verbindingen van het ceremoniële pantser — het scheurt! {dmg} schade!',
          'Een gerichte trap op het kniegewricht — zelfs een Jade Wachter wankelt! {dmg} schade!',
          'Je vindt de naad tussen helm en borstplaat. Eén precies schot. {dmg} schade!',
        ]},
        heavy: { label: 'TROONZAAL SLOPEN', desc: 'Gebruik het meubilair als wapen', logs: [
          'Je slingert de jade troon naar de Wachters — het ding explodeert in scherven! {dmg} schade!',
          'Een gouden kandelaar als knuppel — de Wachters verwachtten geen brute kracht! {dmg} schade!',
          'Je trapt de ceremoniële vitrine om — glas en artefacten vliegen naar de Wachters! {dmg} schade!',
        ]},
        defend: { label: 'PILAARWALTZ', desc: 'Dans tussen de pilaren', logs: [
          'De pilaren van de troonzaal breken hun formatie. Je ademt even. +{heal} HP.',
          'Je glijdt achter een jade standbeeld — hun zwaarden raken alleen steen. +{heal} HP.',
          'Door in cirkels te bewegen blokkeren ze elkaars aanvalslijn. +{heal} HP.',
        ]},
        environment: { label: 'WIEROOKBOM', desc: 'Gebruik de wierookbranders', logs: [
          'Je trapt de gigantische wierookbrander om — verstikkende rook vult de zaal! STUNNED!',
          'De zijden ceremoniële gordijnen vallen als je ze doorsnijdt — de Wachters raken verstrikt! STUNNED!',
          'Je gooit ritueel poeder in het vuur — een verblindende groene vlam! STUNNED!',
        ]},
        tactical: { label: 'TRADITIE UITDAGEN', desc: 'Provoceer hun eer', stat: 'charm', logs: [
          '"Jullie meester heeft ons al een deal aangeboden." De Wachters kijken elkaar onzeker aan...',
          'Je buigt diep — een grove belediging in hun traditie. Woede vertroebelt hun focus.',
          '"Eén tegen twee? Dat is niet eerlijk... voor jullie." Hun trots laat hen aarzelen.',
        ]},
      },
    },
  },
  bikers: {
    1: {
      introLines: [
        'Chainsaw Pete start zijn kettingzaag. Het geluid snijdt door de nacht als een banshee.',
        '"NIEMAND! KOMT! LANGS! PETE!" Elk woord geaccentueerd met een zwaai van de zaag.',
      ],
      scenePhrases: [
        'De kettingzaag jankt en bloed spat op Pete\'s leren vest. Hij lacht. Dit is zijn avondje uit.',
        'Motorolie maakt de vloer glibberig. Pete stampvoet erdoorheen als een tank door modder.',
        'De muren trillen van de bastonen uit het clubhuis. Pete beweegt op het ritme van heavy metal.',
        'Kapotte bierflesjes knarsen onder Pete\'s staalneuzen. Hij draait zijn zaag op vol toerental.',
        'Posters van dode rivalen versieren de muren. Pete grijnst. "Jij wordt de volgende."',
      ],
      enemyAttackLogs: [
        'Pete slingert zijn kettingzaag horizontaal — het geluid alleen al bevriest je bloed! {dmg} schade!',
        'Een keiharde kopstoot — Pete\'s schedel is harder dan beton! {dmg} schade!',
        'Pete smijt een motorblok naar je hoofd! {dmg} schade!',
        '"ZAAG ZAAG ZAAG!" Pete hackt wild om zich heen! {dmg} schade!',
      ],
      actions: {
        attack: { label: 'ACHTER DE ZAAG', desc: 'Schiet als hij zwaait', logs: [
          'Pete\'s zwaai laat hem open — je schiet raak in zijn zij! {dmg} schade!',
          'De kettingzaag zit vast in een tafel. Je maakt gebruik van het moment! {dmg} schade!',
          'Je duikt onder de zaag en stampt op zijn voet — als hij bukt, sla je toe! {dmg} schade!',
        ]},
        heavy: { label: 'MOTOR RAMMEN', desc: 'Rij een motor tegen hem aan', logs: [
          'Je start een geparkeerde Harley en laat hem rollen — hij ramt Pete vol! {dmg} schade!',
          'Je trapt de stoelhijser om — Pete wordt geraakt door 200 kilo metaal! {dmg} schade!',
          'De jukebox vliegt door de lucht na je trap — Pete vangt hem met zijn gezicht! {dmg} schade!',
        ]},
        defend: { label: 'ACHTER DE BAR', desc: 'Gebruik de bar als barricade', logs: [
          'Je duikt achter de eikenhouten bar. Pete\'s zaag bijt in het hout maar stopt. +{heal} HP.',
          'Tussen de tapkranen door herpak je je adem. Pete snijdt door de bar heen. +{heal} HP.',
          'Je gooit barkrukken in zijn pad — het vertraagt hem net genoeg. +{heal} HP.',
        ]},
        environment: { label: 'BENZINE MORSEN', desc: 'Maak de vloer onbegaanbaar', logs: [
          'Je schiet een gat in de benzinetank van een motor — Pete glijdt uit in de plas! STUNNED!',
          'Je smijt een fles whiskey tegen Pete\'s zaag — vonken en vlammen! STUNNED!',
          'De biertap ontploft als je erin schiet — schuim en glas overspoelen Pete! STUNNED!',
        ]},
        tactical: { label: 'ZAAG BLOKKEREN', desc: 'Stop de ketting', stat: 'muscle', logs: [
          'Je gooit een kettingslot in de zaag — de ketting blokkeert en de motor sterft!',
          'Met een ijzeren pijp forceer je de zaag tot stilstand. Pete staat met een nutteloos stuk metaal.',
          'Je trapt een stalen plaat tussen de tanden. De zaag gilt en sterft. Pete\'s ogen worden groot.',
        ]},
      },
    },
    2: {
      introLines: [
        'De Road Captains stappen af hun motoren. Vier veteranen, elk met meer littekens dan herinneringen.',
        '"Pete was onze broeder. Jij hebt zijn zaag gestopt. Nu stoppen wij jou."',
      ],
      scenePhrases: [
        'De Road Captains omsingelen je in een perfecte V-formatie. Jaren op de weg hebben ze tot één eenheid gesmeed.',
        'Uitlaatgassen hangen als mist over de oprit. De motoren grommen als wolven die hun prooi omsingelen.',
        'Vier gezichten — vier oorlogen — vier legendes van de weg. Dit zijn geen amateurs.',
        'De Captains communiceren met handgebaren. Ze hebben dit eerder gedaan. Veel vaker.',
        'Het embleem van de Iron Skulls gloeit op hun ruggen. Voor hen is dit heilige grond.',
      ],
      enemyAttackLogs: [
        'Twee Captains tackelen je tegelijk van beide kanten! {dmg} schade!',
        'Een Captain slingert een ketting als een zweep — het raakt je vol! {dmg} schade!',
        '"Ride or die!" Een Captain ramt je met zijn motor! {dmg} schade!',
        'De Captains vormen een menselijke muur en beuken vooruit! {dmg} schade!',
      ],
      actions: {
        attack: { label: 'ZWAKSTE SCHAKEL', desc: 'Breek hun formatie', logs: [
          'Je richt op de jongste Captain — als hij valt, wankelt de formatie! {dmg} schade!',
          'Een precies schot op de voorste motor — benzine lekt. De Captain springt weg. {dmg} schade!',
          'Je forceert een opening en slaat de leider in zijn gezicht! {dmg} schade!',
        ]},
        heavy: { label: 'KETTIINGREACTIE', desc: 'Laat de motoren vallen als dominostenen', logs: [
          'Je duwt de eerste motor om — een kettingreactie van vallend staal! {dmg} schade!',
          'Je gooit een moersleutel in het wiel van de voorste motor — chaos! {dmg} schade!',
          'Een brandende lap in de tank van de dichtstbijzijnde motor — BOEM! {dmg} schade!',
        ]},
        defend: { label: 'CIRKEL BREKEN', desc: 'Doorbreek hun omsingeling', logs: [
          'Je sprint naar de smalste opening — twee Captains botsen tegen elkaar. +{heal} HP.',
          'Door laag te blijven ontwijk je hun zwaaien. Even hergroeperen. +{heal} HP.',
          'Je rolt onder een motor door — ze kunnen niet volgen in hun zware leren jassen. +{heal} HP.',
        ]},
        environment: { label: 'MOTOR STARTEN', desc: 'Gebruik hun eigen machines', logs: [
          'Je start een achtergelaten motor en ramt ermee door hun linie! STUNNED!',
          'De uitlaat van een draaiende motor spuit hete gassen — twee Captains deinzen terug! STUNNED!',
          'Je schopt een motor in zijn vrij — hij rolt de heuvel af naar de Captains! STUNNED!',
        ]},
        tactical: { label: 'BROEDERSCHAP TESTEN', desc: 'Zaai twijfel', stat: 'charm', logs: [
          '"Hammer heeft Pete laten vallen. Wie is de volgende?" De Captains wisselen onzekere blikken.',
          '"Jullie VP heeft me betaald om dit te doen." Een leugen — maar ze geloven het even.',
          '"Een echte Captain zou één-op-één vechten." Hun trots is hun achilleshiel.',
        ]},
      },
    },
  },
};

export interface BossCombatOverride {
  introLines: string[];
  scenePhrases: string[];
  enemyAttackLogs: string[];
  actions: {
    attack: CombatEnvAction;
    heavy: CombatEnvAction;
    defend: CombatEnvAction;
    environment: CombatEnvAction;
    tactical: CombatEnvAction & { stat: StatId };
  };
}

export const BOSS_COMBAT_OVERRIDES: Record<FamilyId, BossCombatOverride> = {
  cartel: {
    introLines: [
      "El Serpiente grijnst terwijl hij een gouden machete trekt.",
      "\"Je had weg moeten blijven van de haven, amigo...\"",
    ],
    scenePhrases: [
      "Cocaïnestof dwarrelt tussen de containers. El Serpiente beweegt als een schaduw — snel, dodelijk, meedogenloos.",
      "Het maanlicht weerkaatst op zijn gouden tanden. Zijn mannen staan in een kring. Dit is zijn terrein.",
      "De geur van zeewater en bloed. El Serpiente likt langs zijn machete. \"Danzen we, gringo?\"",
      "Vuurvliegjes van sigaretten in de duisternis. El Serpiente fluistert commando's. Zijn reputatie is verdiend.",
      "De havenkranen staan stil. Vanavond draait alles om jullie twee. Winner takes all.",
    ],
    enemyAttackLogs: [
      "El Serpiente slingert zijn machete in een dodelijke boog! {dmg} schade!",
      "\"¡Muere!\" — El Serpiente vuurt twee pistolen tegelijk! {dmg} schade!",
      "El Serpiente werpt een mes met chirurgische precisie! {dmg} schade!",
      "El Serpiente grijpt je bij de keel en smijt je tegen een container! {dmg} schade!",
      "\"Te langzaam...\" El Serpiente's machete flitst door de lucht! {dmg} schade!",
    ],
    actions: {
      attack: { label: "KOGEL VOOR DE SLANG", desc: "Richt op El Serpiente", logs: [
        "Je vuurt op El Serpiente — hij duikt weg maar je schiet raak! {dmg} schade!",
        "Door de cocaïnenevel heen zie je hem bewegen. Je schiet. Raak! {dmg} schade!",
        "El Serpiente sist van pijn als je kogel zijn schouder raakt — {dmg} schade!",
      ]},
      heavy: { label: "CONTAINER LATEN VALLEN", desc: "Verpletter de Slang", logs: [
        "Je kapt het kraankabel — een container dondert op El Serpiente's positie! {dmg} schade!",
        "Je trapt een stapel olievaten om die El Serpiente onder zich begraven! {dmg} schade!",
        "Met brute kracht duw je een vorkheftruck richting de Slang — {dmg} schade!",
      ]},
      defend: { label: "ONTWIJKEN", desc: "Ontwijk de machete", logs: [
        "Je rolt weg achter een container — de machete vonkt op het staal. +{heal} HP.",
        "El Serpiente's aanval mist op millimeters. Je hergroepeert. +{heal} HP.",
        "Je vangt de macheteslag op met een stalen pijp en duwt hem terug. +{heal} HP.",
      ]},
      environment: { label: "KRAANHAAK SLINGEREN", desc: "Gebruik de haven tegen hem", logs: [
        "Je slingert de kraanhaak — El Serpiente wordt van zijn voeten geslagen! STUNNED!",
        "Een anker slingert door de nacht en raakt El Serpiente vol! STUNNED!",
        "Je activeert de noodsprinkler — diesel en water verblinden de Slang! STUNNED!",
      ]},
      tactical: { label: "SMOKKELROUTE", desc: "Gebruik geheime doorgang", stat: "brains", logs: [
        "Je kent de smokkelroutes beter dan hij. Via een verborgen luik duik je op achter hem...",
        "Door de ondergrondse tunnels herpositioneer je jezelf. El Serpiente zoekt je op de verkeerde plek.",
        "De smokkelaarsgang onder de kade — jij kent elk hoekje. De Slang niet.",
      ]},
    },
  },
  syndicate: {
    introLines: [
      "Mr. Wu zet zijn bril recht en sluit zijn laptop. \"Ik had je verwacht.\"",
      "Beveiligingslasers doven. De deur vergrendelt achter je. Er is geen weg terug.",
    ],
    scenePhrases: [
      "Hologrammen flikkeren op de glazen wanden. Mr. Wu staat kalm als een standbeeld — zijn ogen berekenen elke kans.",
      "Het penthouse ruikt naar groene thee en elektronica. Ergens zoemt een drone. Mr. Wu glimlacht koud.",
      "Schermen tonen live-feeds van heel Noxhaven. Mr. Wu kent elke beweging. Behalve deze.",
      "De lift is geblokkeerd. Bewakingsdrones cirkelen. Mr. Wu's stem klinkt door de speakers: \"Fascinerend.\"",
      "Blauw licht baadt het penthouse. Mr. Wu tikt op zijn horloge. \"Je hebt precies 3 minuten.\"",
    ],
    enemyAttackLogs: [
      "Mr. Wu activeert een verborgen taser in de vloer! {dmg} schade!",
      "Een bewakingsdrone vuurt een precisielaser! {dmg} schade!",
      "Mr. Wu gooit een EMP-granaat — je elektronica hapert! {dmg} schade!",
      "\"Voorspelbaar.\" Mr. Wu's bodyguard-robot slaat toe! {dmg} schade!",
      "Mr. Wu hackt je wapenapparatuur — het ontploft bijna in je handen! {dmg} schade!",
    ],
    actions: {
      attack: { label: "DOOR DE FIREWALL", desc: "Doorbreek zijn verdediging", logs: [
        "Je schiet door een hologram heen — Mr. Wu was niet waar hij leek, maar je vindt hem! {dmg} schade!",
        "Je negeert de digitale afleidingen en vuurt op de echte Wu — raak! {dmg} schade!",
        "Een kogel door zijn laptopscherm. Mr. Wu's ogen worden groot. {dmg} schade!",
      ]},
      heavy: { label: "SERVERRACK OMGOOIEN", desc: "Vernietig zijn systemen", logs: [
        "Je duwt een serverrack om — vonken, vuur en een schreeuw van Mr. Wu! {dmg} schade!",
        "Je smijt zijn quantum-computer door het panoramavenster! {dmg} schade!",
        "De noodstroomgenerator explodeert als je erin schiet — {dmg} schade!",
      ]},
      defend: { label: "DIGITALE CAMOUFLAGE", desc: "Gebruik de hologrammen als dekking", logs: [
        "Je duikt achter een holografische projectie. Wu vuurt op een illusie. +{heal} HP.",
        "De hologrammen verbergen je positie. Even ademen. +{heal} HP.",
        "Je hackt een scherm om je silhouet elders te projecteren. +{heal} HP.",
      ]},
      environment: { label: "SYSTEEM HACKEN", desc: "Gebruik zijn tech tegen hem", logs: [
        "Je hackt het sprinklersysteem — water en elektriciteit! Mr. Wu glijdt uit! STUNNED!",
        "Je activeert de nood-lockdown — stalen platen sluiten Mr. Wu in! STUNNED!",
        "Je overschrijft zijn drone-controle — zijn eigen drones vallen hem aan! STUNNED!",
      ]},
      tactical: { label: "VIRUS UPLOADEN", desc: "Schakel alle systemen uit", stat: "brains", logs: [
        "Je plugt een USB in zijn mainframe. Het virus verspreidt zich — alle schermen worden zwart.",
        "Code rolt over de schermen. Zijn beveiligingssysteem crasht. Mr. Wu staat er alleen voor.",
        "\"Impossible...\" fluistert Wu terwijl zijn digitale imperium om hem heen instort.",
      ]},
    },
  },
  bikers: {
    introLines: [
      "Hammer slaat met zijn vuist op de werkbank. Het metaal verbuigt.",
      "\"Tijd om te laten zien waarom ze me Hammer noemen.\"",
    ],
    scenePhrases: [
      "De fabrieksvloer trilt onder Hammer's zware stappen. Hij torent boven je uit — een berg van spieren en staal.",
      "Vonken spatten van de lasapparaten. Hammer grijpt een smidshamer zo groot als je torso. Hij grijnt.",
      "De geur van zweet en verbrand metaal. Hammer brult. De muren lijken te trillen van zijn woede.",
      "Machines stampen op het ritme van jullie gevecht. Hammer is niet snel — maar één klap is genoeg.",
      "Gesmolten staal sist in de goten. Hammer veegt bloed van zijn vuist. \"Is dat alles?\"",
    ],
    enemyAttackLogs: [
      "Hammer zwaait zijn smidshamer — de luchtdruk alleen al doet pijn! {dmg} schade!",
      "\"HIER KOMT IE!\" Hammer's vuist raakt je als een goederentrein! {dmg} schade!",
      "Hammer grijpt een stalen balk en slaat ermee als een honkbalknuppel! {dmg} schade!",
      "Hammer kopstoot je vol in het gezicht! {dmg} schade!",
      "Hammer tilt een aambeeld op en slingert het naar je toe! {dmg} schade!",
    ],
    actions: {
      attack: { label: "ZWAKKE PLEK RAKEN", desc: "Zoek een opening in zijn pantser", logs: [
        "Je vindt een opening tussen zijn platen — een precieze treffer! {dmg} schade!",
        "Terwijl Hammer zwaait duk je onder zijn arm en schiet — {dmg} schade!",
        "Je schiet op zijn knieschijf — zelfs Hammer wankelt! {dmg} schade!",
      ]},
      heavy: { label: "OVEN ONTPLOFFEN", desc: "Gebruik de smeltoven als wapen", logs: [
        "Je schiet het slot van de smeltoven — gesmolten metaal stroomt richting Hammer! {dmg} schade!",
        "Je activeert de hydraulische pers terwijl Hammer eronder staat — {dmg} schade!",
        "Een kettingreactie van explosies door de fabriek — Hammer vliegt door de lucht! {dmg} schade!",
      ]},
      defend: { label: "ACHTER MACHINES", desc: "Laat de fabriek je beschermen", logs: [
        "Je duikt achter een industriële pers. Hammer's vuist laat een deuk achter. +{heal} HP.",
        "De lopende band schuift je uit het bereik van zijn hamer. +{heal} HP.",
        "Je verschuilt je achter een stapel staalplaten — zelfs Hammer slaat daar niet doorheen. +{heal} HP.",
      ]},
      environment: { label: "LASAPPARAAT RICHTEN", desc: "Industrieel gereedschap als wapen", logs: [
        "Je richt het lasapparaat op Hammer — een verblindende vlam! STUNNED!",
        "De transportband sleurt Hammer mee tussen de tandwielen! STUNNED!",
        "Je opent een persluchtklep — de stoom verblind Hammer volledig! STUNNED!",
      ]},
      tactical: { label: "VLOER LATEN ZAKKEN", desc: "Open het vloerrooster", stat: "muscle", logs: [
        "Je trapt het vloerrooster open — Hammer zakt tot zijn middel in het gat!",
        "Met al je kracht trek je de noodhendel. De vloer klapt open onder Hammer's gewicht.",
        "Je lokt Hammer naar het zwakste punt van de vloer. Het staal buigt... en breekt.",
      ]},
    },
  },
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
  { id: 'first_blood', name: 'First Blood', desc: 'Voltooi een solo operatie', icon: 'Swords', condition: (s) => (s.stats?.missionsCompleted || 0) >= 1, progress: (s) => ({ current: Math.min(s.stats?.missionsCompleted || 0, 1), target: 1 }) },
  { id: 'drug_lord', name: 'Drug Lord', desc: 'Bezit het Synthetica Lab (villa)', icon: 'Pipette', condition: (s) => s.villa?.modules.includes('synthetica_lab') || s.hqUpgrades.includes('lab') },
  { id: 'landlord', name: 'Vastgoed Baron', desc: 'Bezit 3 districten', icon: 'Building2', condition: (s) => s.ownedDistricts.length >= 3, progress: (s) => ({ current: Math.min(s.ownedDistricts.length, 3), target: 3 }) },
  { id: 'millionaire', name: 'Miljonair', desc: 'Bezit €1.000.000', icon: 'BadgeDollarSign', condition: (s) => s.money >= 1000000, progress: (s) => ({ current: Math.min(s.money, 1000000), target: 1000000 }) },
  { id: 'crew_boss', name: 'Crew Boss', desc: 'Huur 4 crewleden', icon: 'Users', condition: (s) => s.crew.length >= 4, progress: (s) => ({ current: Math.min(s.crew.length, 4), target: 4 }) },
  { id: 'kingpin', name: 'Kingpin', desc: 'Versla alle 3 factieleiders', icon: 'Crown', condition: (s) => s.leadersDefeated.length >= 3, progress: (s) => ({ current: Math.min(s.leadersDefeated.length, 3), target: 3 }) },
  { id: 'high_roller', name: 'High Roller', desc: 'Bezit €50.000 aan cash', icon: 'Dices', condition: (s) => s.money >= 50000, progress: (s) => ({ current: Math.min(s.money, 50000), target: 50000 }) },
  { id: 'clean_money', name: 'Witwasser', desc: 'Bezit een dekmantel', icon: 'Store', condition: (s) => s.ownedBusinesses.length > 0, progress: (s) => ({ current: Math.min(s.ownedBusinesses.length, 1), target: 1 }) },
  { id: 'car_collector', name: 'Auto Verzamelaar', desc: 'Bezit 3 voertuigen', icon: 'Car', condition: (s) => s.ownedVehicles.length >= 3, progress: (s) => ({ current: Math.min(s.ownedVehicles.length, 3), target: 3 }) },
  { id: 'survivor', name: 'Overlever', desc: 'Overleef 30 dagen', icon: 'Clock', condition: (s) => s.day >= 30, progress: (s) => ({ current: Math.min(s.day, 30), target: 30 }) },
  { id: 'combat_master', name: 'Vechtmachine', desc: 'Win een gevecht tegen een factieleider', icon: 'Swords', condition: (s) => s.leadersDefeated.length >= 1, progress: (s) => ({ current: Math.min(s.leadersDefeated.length, 1), target: 1 }) },
  { id: 'trader', name: 'Handelaar', desc: 'Voltooi 50 transacties', icon: 'ArrowRightLeft', condition: (s) => (s.stats?.tradesCompleted || 0) >= 50, progress: (s) => ({ current: Math.min(s.stats?.tradesCompleted || 0, 50), target: 50 }) },
  { id: 'jackpot', name: 'Jackpot!', desc: 'Win €50.000 in casino', icon: 'Dices', condition: (s) => s.stats.casinoWon >= 50000, progress: (s) => ({ current: Math.min(s.stats.casinoWon || 0, 50000), target: 50000 }) },
  { id: 'card_counter', name: 'Kaartenteller', desc: 'Win 5 blackjack op rij', icon: 'Spade', condition: (s) => (s.stats.blackjackStreak || 0) >= 5, progress: (s) => ({ current: Math.min(s.stats.blackjackStreak || 0, 5), target: 5 }) },
  { id: 'poker_face', name: 'Poker Face', desc: 'Bereik 5x multiplier bij High-Low', icon: 'CircleDot', condition: (s) => (s.stats.highLowMaxRound || 0) >= 5, progress: (s) => ({ current: Math.min(s.stats.highLowMaxRound || 0, 5), target: 5 }) },
  { id: 'conquest_start', name: 'Oorlogsverklaring', desc: 'Breek de verdediging van een factie', icon: 'Shield', condition: (s) => Object.values(s.factionConquest || {}).some((p: any) => p?.phase >= 1) },
  { id: 'conquest_subboss', name: 'Sub-boss Killer', desc: 'Versla een factie sub-boss', icon: 'Skull', condition: (s) => Object.values(s.factionConquest || {}).some((p: any) => p?.phase >= 2) },
  { id: 'conqueror', name: 'Veroveraar', desc: 'Neem een factie over als vazal', icon: 'Flag', condition: (s) => (s.conqueredFactions || []).length >= 1, progress: (s) => ({ current: Math.min((s.conqueredFactions || []).length, 1), target: 1 }) },
  { id: 'total_domination', name: 'Totale Dominantie', desc: 'Alle 3 facties als vazal', icon: 'Crown', condition: (s) => (s.conqueredFactions || []).length >= 3, progress: (s) => ({ current: Math.min((s.conqueredFactions || []).length, 3), target: 3 }) },
  { id: 'villa_owner', name: 'Huiseigenaar', desc: 'Koop Villa Noxhaven', icon: 'Home', condition: (s) => !!s.villa },
  { id: 'villa_builder', name: 'Aannemer', desc: 'Installeer je eerste villa module', icon: 'Wrench', condition: (s) => (s.villa?.modules || []).length >= 1, progress: (s) => ({ current: Math.min((s.villa?.modules || []).length, 1), target: 1 }) },
  { id: 'villa_fortress', name: 'Fort Knox', desc: 'Installeer 5 villa modules', icon: 'Castle', condition: (s) => (s.villa?.modules || []).length >= 5, progress: (s) => ({ current: Math.min((s.villa?.modules || []).length, 5), target: 5 }) },
  { id: 'gear_collector', name: 'Wapenhandelaar', desc: 'Bezit 5 gear items', icon: 'Package', condition: (s) => (s.ownedGear || []).length >= 5, progress: (s) => ({ current: Math.min((s.ownedGear || []).length, 5), target: 5 }) },
  { id: 'heist_master', name: 'Veteraan', desc: 'Voltooi 10 missies', icon: 'Banknote', condition: (s) => (s.stats?.missionsCompleted || 0) >= 10, progress: (s) => ({ current: Math.min(s.stats?.missionsCompleted || 0, 10), target: 10 }) },
  { id: 'night_owl', name: 'Nachtuil', desc: 'Overleef 100 dagen', icon: 'Moon', condition: (s) => s.day >= 100, progress: (s) => ({ current: Math.min(s.day, 100), target: 100 }) },
  { id: 'debt_free', name: 'Schuldvrij', desc: 'Los al je schulden af', icon: 'CheckCircle', condition: (s) => s.debt === 0 && (s.stats?.totalEarned || 0) > 10000 },
  { id: 'hall_of_fame', name: 'Hall of Fame', desc: 'Voltooi 3+ NG+ runs met minimaal A-rank', icon: 'Trophy', condition: (s) => (s.runHistory || []).filter((r: any) => r.rank === 'S' || r.rank === 'A').length >= 3, progress: (s) => ({ current: Math.min((s.runHistory || []).filter((r: any) => r.rank === 'S' || r.rank === 'A').length, 3), target: 3 }) },
  // Drug Imperium achievements
  { id: 'first_dealer', name: 'Eerste Dealer', desc: 'Wijs je eerste dealer toe aan een district', icon: 'Users', condition: (s) => (s.drugEmpire?.dealers || []).length >= 1, progress: (s) => ({ current: Math.min((s.drugEmpire?.dealers || []).length, 1), target: 1 }) },
  { id: 'master_chemist', name: 'Meester Chemist', desc: 'Upgrade alle 3 labs naar Tier 3', icon: 'FlaskConical', condition: (s) => s.drugEmpire?.labTiers.wietplantage >= 3 && s.drugEmpire?.labTiers.coke_lab >= 3 && s.drugEmpire?.labTiers.synthetica_lab >= 3, progress: (s) => ({ current: [s.drugEmpire?.labTiers.wietplantage, s.drugEmpire?.labTiers.coke_lab, s.drugEmpire?.labTiers.synthetica_lab].filter(t => t && t >= 3).length, target: 3 }) },
  { id: 'noxcrystal_first', name: 'NoxCrystal Pionier', desc: 'Produceer je eerste NoxCrystal', icon: 'Gem', condition: (s) => (s.drugEmpire?.noxCrystalProduced || 0) >= 1, progress: (s) => ({ current: Math.min(s.drugEmpire?.noxCrystalProduced || 0, 1), target: 1 }) },
  { id: 'dealer_mogul', name: 'Dealer Mogul', desc: 'Verdien €100.000 via dealers', icon: 'TrendingUp', condition: (s) => (s.drugEmpire?.totalDealerIncome || 0) >= 100000, progress: (s) => ({ current: Math.min(s.drugEmpire?.totalDealerIncome || 0, 100000), target: 100000 }) },
  { id: 'dea_survivor', name: 'DEA Overlever', desc: 'Overleef een DEA onderzoek', icon: 'ShieldAlert', condition: (s) => (s.drugEmpire?.totalDeaInvestigations || 0) >= 1, progress: (s) => ({ current: Math.min(s.drugEmpire?.totalDeaInvestigations || 0, 1), target: 1 }) },
  // Prestige-only achievements
  { id: 'prestige_1', name: 'Herboren', desc: 'Bereik Prestige 1', icon: 'Shield', condition: (s) => (s.prestigeLevel || 0) >= 1, progress: (s) => ({ current: Math.min(s.prestigeLevel || 0, 1), target: 1 }) },
  { id: 'prestige_2', name: 'Veteraan Elite', desc: 'Bereik Prestige 2', icon: 'Zap', condition: (s) => (s.prestigeLevel || 0) >= 2, progress: (s) => ({ current: Math.min(s.prestigeLevel || 0, 2), target: 2 }) },
  { id: 'prestige_3', name: 'Legende', desc: 'Bereik Prestige 3 — Legendarische status', icon: 'Crown', condition: (s) => (s.prestigeLevel || 0) >= 3, progress: (s) => ({ current: Math.min(s.prestigeLevel || 0, 3), target: 3 }) },
  { id: 'prestige_4', name: 'Eeuwig', desc: 'Bereik Prestige 4 — De stad vergeet je nooit', icon: 'Flame', condition: (s) => (s.prestigeLevel || 0) >= 4, progress: (s) => ({ current: Math.min(s.prestigeLevel || 0, 4), target: 4 }) },
  { id: 'prestige_5', name: 'Onsterfelijk', desc: 'Bereik Prestige 5 — Godstatus in Noxhaven', icon: 'Skull', condition: (s) => (s.prestigeLevel || 0) >= 5, progress: (s) => ({ current: Math.min(s.prestigeLevel || 0, 5), target: 5 }) },
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

// ========== NEMESIS ARCHETYPES ==========

import { NemesisArchetype } from './types';

export interface NemesisArchetypeDef {
  id: NemesisArchetype;
  name: string;
  icon: string;
  desc: string;
  marketManipBonus: number; // multiplier on market manipulation chance
  attackBonus: number; // multiplier on villa/district attack chance
  heatManipBonus: number; // extra heat added to player per action
  allianceChance: number; // chance to form faction alliance
}

export const NEMESIS_ARCHETYPES: NemesisArchetypeDef[] = [
  { id: 'zakenman', name: 'De Zakenman', icon: '💼', desc: 'Manipuleert markten en koopt facties om.', marketManipBonus: 1.5, attackBonus: 0.8, heatManipBonus: 0, allianceChance: 0.3 },
  { id: 'brute', name: 'De Brute', icon: '👊', desc: 'Valt villa en districten aan, steelt goederen.', marketManipBonus: 0.5, attackBonus: 1.3, heatManipBonus: 0, allianceChance: 0.1 },
  { id: 'schaduw', name: 'De Schaduw', icon: '🌑', desc: 'Saboteert leveringen en vergroot je heat.', marketManipBonus: 1.0, attackBonus: 0.7, heatManipBonus: 5, allianceChance: 0.15 },
  { id: 'strateeg', name: 'De Strateeg', icon: '♟️', desc: 'Sluit allianties met facties en ondermijnt relaties.', marketManipBonus: 0.8, attackBonus: 0.9, heatManipBonus: 0, allianceChance: 0.5 },
];

export const NEMESIS_NEGOTIATE_COST_BASE = 15000;
export const NEMESIS_TRUCE_DAYS = 5;

// ========== NEMESIS TAUNTS PER ARCHETYPE ==========

export const NEMESIS_TAUNTS: Record<NemesisArchetype, {
  phone: string[];
  onDistrictBuy: string[];
  onArrest: string[];
  onWin: string;
  onLose: string;
}> = {
  zakenman: {
    phone: [
      'Geld regeert, vriend. En ik heb meer dan jij. — {name}',
      'Ik heb net je leverancier opgekocht. Succes ermee. — {name}',
      'Elke cent die je verdient, kost mij niets. — {name}',
      'Je denkt als een straatrat. Ik denk als een bank. — {name}',
      'Mijn accountant is gevaarlijker dan jouw crew. — {name}',
    ],
    onDistrictBuy: [
      'Leuk districtje. Ik bied het dubbele aan je buurman. — {name}',
      'Vastgoed? Schattig. Ik bezit de hypotheekbank. — {name}',
    ],
    onArrest: [
      'Mijn advocaten staan al klaar. Jij hebt een pro-deo. — {name}',
      'Geniet van je cel. Ik geniet van je klanten. — {name}',
    ],
    onWin: 'Dit was een zakelijke beslissing. Niets persoonlijks.',
    onLose: 'Je hebt me verslagen, maar mijn geld overleeft mij...',
  },
  brute: {
    phone: [
      'Ik ruik je bloed al. — {name}',
      'Je crew? Zwak. Je villa? Breekbaar. Jij? Dood. — {name}',
      'Ik heb je chauffeur zijn knieschijven beloofd. — {name}',
      'Slaap lekker. Of niet. — {name}',
      'Elke dag dat je leeft is een gunst van mij. — {name}',
    ],
    onDistrictBuy: [
      'Leuk huis. Zou jammer zijn als het... afbrandde. — {name}',
      'Meer grond om je in te begraven. — {name}',
    ],
    onArrest: [
      'Achter tralies? Perfect doelwit. — {name}',
      'De gevangenis beschermt je niet tegen mij. — {name}',
    ],
    onWin: 'Ik had je gewaarschuwd. Nu bloeden de straten.',
    onLose: 'Goed gevochten... maar mijn opvolger zal erger zijn.',
  },
  schaduw: {
    phone: [
      'Je weet niet eens dat ik er ben. — {name}',
      'Ik heb je telefoon al maanden afgeluisterd. — {name}',
      'De politie heeft net een interessante tip gekregen... — {name}',
      'Je denkt dat je veilig bent? Denk opnieuw. — {name}',
      'Ik ben overal en nergens. — {name}',
    ],
    onDistrictBuy: [
      'Mooi district. Mijn spionnen zitten er al. — {name}',
      'Ik weet de code van je kluis al. — {name}',
    ],
    onArrest: [
      'Wie denk je dat die tip heeft gestuurd? — {name}',
      'De politie is ook maar een werktuig. — {name}',
    ],
    onWin: 'Je zag me niet aankomen. Niemand ziet mij aankomen.',
    onLose: 'Ik verdwijn... maar mijn netwerk blijft.',
  },
  strateeg: {
    phone: [
      'Elke zet die je doet, heb ik drie beurten geleden voorspeld. — {name}',
      'Je facties vertrouwen je niet meer. Vraag je af waarom? — {name}',
      'Ik hoef je niet te doden. Ik laat je bondgenoten dat doen. — {name}',
      'Schaak. Niet schaken. — {name}',
      'Je bent een pion die denkt dat hij een koning is. — {name}',
    ],
    onDistrictBuy: [
      'Interessante zet. Maar ik heb al drie tegenzetten. — {name}',
      'Je breidt uit? Perfect. Meer flanken om aan te vallen. — {name}',
    ],
    onArrest: [
      'Terwijl jij vastzit, herpositioneer ik alles. — {name}',
      'Je afwezigheid is mijn beste bondgenoot. — {name}',
    ],
    onWin: 'Het was onvermijdelijk. Ik had alles berekend.',
    onLose: 'Mijn opvolger kent mijn strategie. En hij zal beter zijn.',
  },
};

// ========== NEMESIS GENERATION ABILITIES ==========

export const NEMESIS_GEN_ABILITIES: Record<number, string[]> = {
  1: [],
  2: ['crew_bribe'],
  3: ['crew_bribe', 'place_bounty'],
  4: ['crew_bribe', 'place_bounty', 'double_action', 'safehouse_sabotage'],
  5: ['crew_bribe', 'place_bounty', 'double_action', 'safehouse_sabotage', 'stat_boost'],
};

export const NEMESIS_ABILITY_LABELS: Record<string, { name: string; icon: string; desc: string }> = {
  crew_bribe: { name: 'Crew Omkoping', icon: '🤝', desc: 'Kans om een crewlid om te kopen' },
  place_bounty: { name: 'Bounty Plaatsen', icon: '🎯', desc: 'Plaatst een premie op de speler' },
  double_action: { name: 'Dubbele Actie', icon: '⚡', desc: 'Twee acties per dag' },
  safehouse_sabotage: { name: 'Safehouse Sabotage', icon: '💣', desc: 'Saboteert safehouses' },
  stat_boost: { name: 'Ultieme Macht', icon: '👑', desc: 'Versterkte stats' },
};

// ========== NEMESIS REVENGE ACTIONS ==========

export const NEMESIS_REVENGE_TYPES: Record<NemesisArchetype, { id: string; name: string; desc: string; duration: number }> = {
  zakenman: { id: 'market_crash', name: 'Marktcrash', desc: 'Alle marktprijzen gemanipuleerd', duration: 3 },
  brute: { id: 'hitmen', name: 'Huurmoordenaars', desc: 'Extra combat encounter', duration: 1 },
  schaduw: { id: 'heat_surge', name: 'Heat Surge', desc: 'Verdubbelde heat', duration: 2 },
  strateeg: { id: 'faction_sabotage', name: 'Factie Sabotage', desc: 'Alle factie-relaties -10', duration: 1 },
};

function getRandomArchetype(): NemesisArchetype {
  const types: NemesisArchetype[] = ['zakenman', 'brute', 'schaduw', 'strateeg'];
  return types[Math.floor(Math.random() * types.length)];
}

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
    archetype: getRandomArchetype(),
    claimedDistrict: null,
    alliedFaction: null,
    truceDaysLeft: 0,
    lastReaction: '',
    negotiatedThisGen: false,
    scoutResult: null,
    // Rivaal 2.0 fields
    abilities: [],
    revengeActive: null,
    revengeDaysLeft: 0,
    defeatChoice: null,
    tauntsShown: [],
    woundedRevengeUsed: false,
    pendingDefeatChoice: false,
    informantArchetype: null,
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
    playerHP: 100,
    playerMaxHP: 100,
    loc: 'low' as DistrictId,
    player: {
      level: 1,
      xp: 0,
      nextXp: 100,
      skillPoints: 0,
      statPoints: 2,
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
    leaderDefeatedDay: {},
    factionConquest: {},
    pendingConquestPopup: null,
    prices: {},
    priceTrends: {},
    districtDemands: {},
    marketPressure: {},
    activeMarketEvent: null,
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
    streetEventQueue: [],
    screenEffect: null,
    lastRewardAmount: 0,
    crewPersonalities: {},
    pendingCrewEvent: null,
    crewEventCooldowns: {},
    crewTrouwBonusGiven: {},
    crewUltimatumGiven: {},
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
    mmoPerkFlags: {},
    // Hitman & Ammo state (universal ammo system)
    ammo: 20,
    ammoStock: { '9mm': 20, '7.62mm': 0, 'shells': 0 }, // legacy compat
    ammoFactoryLevel: 1,
    specialAmmo: {},
    activeSpecialAmmo: null,
    hitContracts: [],
    // Prison state
    prison: null,
    // Hospital & game over state
    hospital: null,
    hospitalizations: 0,
    gameOver: false,
    // Heist state
    activeHeist: null,
    heistCooldowns: {},
    heistPlan: null,
    // News state
    dailyNews: [],
    // Villa state
    villa: null,
    // Property state
    propertyId: 'kraakpand',
    // Drug Empire state
    drugEmpire: null,
    // Achievement popup state
    pendingAchievements: [],
    // Cinematic moments state
    pendingCinematic: null,
    seenCinematics: [],
    seenEndgameEvents: [],
    // Market alerts
    marketAlerts: [],
    triggeredAlerts: [],
    // Racing state
    raceUsedToday: false,
    // Dealer state
    vehiclePriceModifiers: {},
    dealerDeal: null,
    // Golden hour state
    goldenHour: null,
    // Run history
    runHistory: [],
    // Bounty system state
    activeBounties: [],
    placedBounties: [],
    pendingBountyEncounter: null,
    bountyBoard: [],
    // Stock market state
    stockPrices: {},
    stockHistory: {},
    stockHoldings: {},
    pendingInsiderTip: null,
    stockEvents: [],
    pendingMinigame: null,
    // Trade log state
    tradeLog: [],
    craftLog: [],
    // PvP combat state
    activePvPCombat: null,
    // MMO server state
    energy: 100,
    maxEnergy: 100,
    nerve: 50,
    maxNerve: 50,
    energyRegenAt: null,
    nerveRegenAt: null,
    travelCooldownUntil: null,
    crimeCooldownUntil: null,
    attackCooldownUntil: null,
    heistCooldownUntil: null,
    serverSynced: false,
    lastTickAt: new Date().toISOString(),
    tickIntervalMinutes: 30,
    worldTimeOfDay: 'day',
    lastStreetEventAt: null,
    gangDistricts: [],
    gangId: null,
    // Skill Tree & Prestige
    unlockedSkills: [],
    prestigeLevel: 0,
    xpStreak: 0,
    // Merit Points
    meritPoints: 0,
    meritNodes: {},
    _pendingXpGains: [],
// Prestige Reset & Hardcore Mode (always true — universal permadeath)
    hardcoreMode: true,
    prestigeResetCount: 0,
  };
}

// ========== HOSPITAL CONSTANTS ==========
export const HOSPITAL_STAY_DAYS = 3;
export const HOSPITAL_ADMISSION_COST_PER_MAXHP = 10;
export const HOSPITAL_REP_LOSS = 50;
/** @deprecated Universal permadeath — death = game over for everyone */
export const MAX_HOSPITALIZATIONS = 1;

// ========== DEATH LEGACY CONSTANTS ==========
export const DEATH_COFFER_PERCENT = 0.10; // 10% of money saved
export const DEATH_LEGACY_XP_BONUS = 0.02; // +2% per death
export const DEATH_LEGACY_XP_MAX = 0.20; // max +20%

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
export const PRISON_ARREST_CHANCE_CARJACK = 0.20;
export const PRISON_ESCAPE_HEAT_PENALTY = 15;
export const PRISON_ESCAPE_FAIL_EXTRA_DAYS = 2;

// ========== WANTED & RAID BALANCE ==========
export const POLICE_RAID_HEAT_THRESHOLD = 45;
export const WANTED_HEAT_THRESHOLD = 80;
export const WANTED_ARREST_CHANCE = 0.10;
export const ARREST_HEAT_THRESHOLD = 40;
export const BETRAYAL_ARREST_CHANCE = 0.40;
export const PRISON_LAWYER_SENTENCE_REDUCTION = 1;
export const PRISON_LAWYER_BRIBE_DISCOUNT = 0.30; // 30% korting
export const PRISON_CREW_LOYALTY_PENALTY = 5; // per dag
export const PRISON_CREW_DESERT_THRESHOLD = 4; // dagen voordat crew kan vertrekken

import type { PrisonEvent } from './types';

export const PRISON_EVENTS: PrisonEvent[] = [
  { id: 'cellmate_intel', title: 'Celgenoot deelt intel', desc: 'Een oude rot vertelt je over beveiligingssystemen.', effect: 'brains_up', value: 1 },
  { id: 'yard_fight', title: 'Gevecht op de binnenplaats', desc: 'Je moest jezelf verdedigen. Pijnlijk, maar je bent sterker.', effect: 'muscle_up', value: 1 },
  { id: 'guard_deal', title: 'Corrupte bewaker', desc: 'Een bewaker biedt aan je straf te verkorten — voor een prijs.', effect: 'day_reduce', value: 1 },
  { id: 'prison_respect', title: 'Respect verdiend', desc: 'Je reputatie bereikt zelfs de gevangenis.', effect: 'rep_up', value: 10 },
  { id: 'infirmary', title: 'Ziekenboeg bezoek', desc: 'Slechte hygiëne heeft zijn tol geëist.', effect: 'hp_loss', value: 15 },
  { id: 'smooth_talker', title: 'Gesprek met advocaat', desc: 'Je wint vertrouwen met gladde praatjes.', effect: 'charm_up', value: 1 },
  { id: 'crew_letter', title: 'Brief van je crew', desc: 'Je crew stuurt een bericht — moraal stijgt.', effect: 'loyalty_up', value: 10 },
  { id: 'bribe_guard', title: 'Bewaker omkopen', desc: 'Je betaalt een bewaker voor privileges.', effect: 'money_cost', value: 500 },
];

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
