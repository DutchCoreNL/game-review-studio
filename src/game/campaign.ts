// ========== CAMPAIGN SYSTEM — CHAPTER-BASED STORY ==========

import { generateWeapon, type GeneratedWeapon, type WeaponRarity, type BrandId } from './weaponGenerator';
import { generateGear, type GeneratedGear, type GearRarity, type GearType } from './gearGenerator';

// ========== TYPES ==========

export type CampaignDifficulty = 'normal' | 'hard' | 'nightmare';
export type EncounterChoice = 'stealth' | 'standard' | 'aggressive';
export type EncounterType = 'combat' | 'trap' | 'npc' | 'exploration';

export interface CampaignMission {
  id: string;
  title: string;
  description: string;
  icon: string;
  energyCost: number;
  minLevel: number;
  encounters: number; // number of combat encounters
  rewards: {
    money: [number, number]; // [min, max]
    rep: number;
    xp: number;
  };
  weaponDropChance: number; // 0-1
  weaponRarityFloor: WeaponRarity;
  narrativeText: string[];
}

export interface CampaignBoss {
  id: string;
  name: string;
  title: string;
  icon: string;
  portrait: string;
  hp: number;
  damage: number;
  armor: number;
  speed: number;
  phases: BossPhase[];
  lootTable: BossLootEntry[];
  exclusiveBrand?: BrandId; // chapter-exclusive brand unlock
  dialogue: {
    intro: string;
    phase2: string;
    defeat: string;
    playerDefeat: string;
  };
}

export interface BossPhase {
  hpThreshold: number; // activate when boss HP drops below this %
  name: string;
  attackBonus: number;
  specialAttack: {
    name: string;
    icon: string;
    damage: number;
    effect: string;
    chance: number; // 0-1 probability per turn
  };
}

export interface BossLootEntry {
  type: 'weapon' | 'money' | 'accessory';
  chance: number;
  minRarity?: WeaponRarity;
  money?: number;
  accessoryName?: string;
  accessoryIcon?: string;
  accessoryEffect?: string;
}

export interface CampaignChapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  minLevel: number;
  missions: CampaignMission[];
  boss: CampaignBoss;
  completionReward: {
    title: string;
    description: string;
    icon: string;
    bonusType: 'crit' | 'damage' | 'defense' | 'income' | 'xp';
    bonusValue: number;
  };
}

export interface CampaignMissionProgress {
  missionId: string;
  completed: boolean;
  bestRating: string | null;
  completedAt: number | null; // day
}

export interface CampaignBossProgress {
  bossId: string;
  killCount: number;
  bestTime: number | null; // turns
  lastKillDay: number | null;
}

export interface CampaignChapterProgress {
  chapterId: string;
  unlocked: boolean;
  missions: CampaignMissionProgress[];
  boss: CampaignBossProgress;
  completed: boolean;
  completedAt: number | null;
  difficulty: CampaignDifficulty;
}

export interface CampaignState {
  chapters: CampaignChapterProgress[];
  activeBossFight: ActiveBossFight | null;
  activeCampaignMission: ActiveCampaignMission | null;
  totalBossKills: number;
  chapterBonuses: string[]; // collected chapter completion bonus IDs
}

export interface ActiveBossFight {
  chapterId: string;
  bossId: string;
  bossHP: number;
  bossMaxHP: number;
  playerHP: number;
  playerMaxHP: number;
  currentPhase: number;
  turn: number;
  log: BossFightLogEntry[];
  difficulty: CampaignDifficulty;
  loot: GeneratedWeapon | null;
  gearLoot: GeneratedGear | null;
  moneyLoot: number;
  accessoryLoot: { name: string; icon: string; effect: string } | null;
  finished: boolean;
  won: boolean;
  // Enhanced boss mechanics
  cooldowns: { heavy: number; dodge: number };
  rage: number; // 0-100
  rageMax: number;
  defendBuff: number; // turns of defend buff remaining
  phaseJustChanged: boolean;
}

export interface ActiveCampaignMission {
  chapterId: string;
  missionId: string;
  currentEncounter: number;
  totalEncounters: number;
  encounterTypes: EncounterType[];
  currentEncounterType: EncounterType;
  log: string[];
  rewards: { money: number; rep: number; xp: number };
  finished: boolean;
  success: boolean;
  droppedWeapon: GeneratedWeapon | null;
  droppedGear: GeneratedGear | null;
  // Tactical choices
  choices: EncounterChoice[];
  totalHeatGain: number;
  hpLost: number;
  rating: number; // 1-3 stars
}

export interface BossFightLogEntry {
  turn: number;
  text: string;
  type: 'player' | 'boss' | 'phase' | 'loot' | 'info';
  icon?: string;
}

// ========== CHAPTER DEFINITIONS ==========

export const CAMPAIGN_CHAPTERS: CampaignChapter[] = [
  {
    id: 'ch1',
    number: 1,
    title: 'De Schaduwen van Noxhaven',
    subtitle: 'Waar alles begint',
    icon: '🌑',
    description: 'De straten van Noxhaven verbergen duistere geheimen. Een reeks mysterieuze verdwijningen leidt je naar een ondergronds netwerk dat de stad al jaren in zijn greep houdt.',
    minLevel: 1,
    missions: [
      {
        id: 'ch1_m1', title: 'De Informant', description: 'Zoek een informant die weet wat er in de haven gaande is.',
        icon: '🕵️', energyCost: 3, minLevel: 1, encounters: 2,
        rewards: { money: [2000, 5000], rep: 15, xp: 80 },
        weaponDropChance: 0.3, weaponRarityFloor: 'common',
        narrativeText: ['Een koude wind waait door de steegjes van Port Nero...', 'De informant treft je in een verlaten pakhuis.'],
      },
      {
        id: 'ch1_m2', title: 'Het Spoor', description: 'Volg de aanwijzingen naar een geheim laboratorium.',
        icon: '🔍', energyCost: 4, minLevel: 2, encounters: 3,
        rewards: { money: [4000, 8000], rep: 20, xp: 120 },
        weaponDropChance: 0.4, weaponRarityFloor: 'common',
        narrativeText: ['De aanwijzingen leiden je naar Iron Borough...', 'Een verlaten fabriek, maar niet zo verlaten als het lijkt.'],
      },
      {
        id: 'ch1_m3', title: 'De Confrontatie', description: 'Infiltreer het netwerk en vind de leider.',
        icon: '💥', energyCost: 5, minLevel: 3, encounters: 4,
        rewards: { money: [6000, 12000], rep: 30, xp: 180 },
        weaponDropChance: 0.5, weaponRarityFloor: 'uncommon',
        narrativeText: ['Het moment van de waarheid is aangebroken...', 'De leider wacht op je in de kelder.'],
      },
    ],
    boss: {
      id: 'boss_viktor', name: 'Viktor "De Slager" Kozlov', title: 'Onderwerelds Slachter',
      icon: '🪓', portrait: '🪓',
      hp: 200, damage: 18, armor: 8, speed: 5,
      phases: [
        { hpThreshold: 100, name: 'Koelbloedig', attackBonus: 0, specialAttack: { name: 'Bijlzwaai', icon: '🪓', damage: 25, effect: 'Zware slag die armor negeert', chance: 0.25 } },
        { hpThreshold: 50, name: 'Razernij', attackBonus: 8, specialAttack: { name: 'Executie', icon: '💀', damage: 40, effect: 'Dodelijke combo — kan stunnen', chance: 0.3 } },
      ],
      lootTable: [
        { type: 'weapon', chance: 1.0, minRarity: 'rare' },
        { type: 'money', chance: 1.0, money: 15000 },
        { type: 'accessory', chance: 0.3, accessoryName: "Kozlov's Slagersmes", accessoryIcon: '🔪', accessoryEffect: '+5% crit schade' },
      ],
      dialogue: {
        intro: '"Je had niet naar me moeten zoeken, vriend. Niemand verlaat dit pakhuis levend."',
        phase2: '"GENOEG! Nu laat ik je zien waarom ze me De Slager noemen!"',
        defeat: '"Nee... dit kan niet... ik was... onoverwinnelijk..."',
        playerDefeat: '"Weer eentje voor de vleesmolen. Jammer."',
      },
    },
    completionReward: {
      title: 'Schaduwkenner', description: '+5% kritieke trefkans permanent', icon: '🌑',
      bonusType: 'crit', bonusValue: 5,
    },
  },
  {
    id: 'ch2',
    number: 2,
    title: 'Het Syndicaat',
    subtitle: 'De vijand van mijn vijand',
    icon: '🕸️',
    description: 'Na de val van Kozlov komt een groter gevaar aan het licht: het Syndicaat, een organisatie die de hele onderwereld controleert vanuit de schaduwen.',
    minLevel: 5,
    missions: [
      {
        id: 'ch2_m1', title: 'Infiltratie', description: 'Werk je een weg naar binnen bij het Syndicaat.',
        icon: '🎭', energyCost: 4, minLevel: 5, encounters: 3,
        rewards: { money: [5000, 10000], rep: 25, xp: 150 },
        weaponDropChance: 0.4, weaponRarityFloor: 'uncommon',
        narrativeText: ['Een uitnodiging voor een exclusief pokertoernooi...', 'De perfecte dekmantel om binnen te komen.'],
      },
      {
        id: 'ch2_m2', title: 'Dubbelspel', description: 'Speel beide kanten tegen elkaar uit.',
        icon: '🃏', energyCost: 5, minLevel: 6, encounters: 3,
        rewards: { money: [8000, 15000], rep: 30, xp: 200 },
        weaponDropChance: 0.45, weaponRarityFloor: 'uncommon',
        narrativeText: ['Het Syndicaat vertrouwt je — maar hoelang nog?', 'Een gevaarlijk spel van loyaliteit en verraad.'],
      },
      {
        id: 'ch2_m3', title: 'Het Verraad', description: 'Ontmasker de verrader binnen je eigen kring.',
        icon: '🗡️', energyCost: 5, minLevel: 7, encounters: 4,
        rewards: { money: [10000, 18000], rep: 35, xp: 250 },
        weaponDropChance: 0.5, weaponRarityFloor: 'rare',
        narrativeText: ['Iemand dicht bij je werkt voor de vijand...', 'De waarheid komt altijd boven water.'],
      },
      {
        id: 'ch2_m4', title: 'De Ontmanteling', description: 'Vernietig de financiële basis van het Syndicaat.',
        icon: '💣', energyCost: 6, minLevel: 8, encounters: 5,
        rewards: { money: [12000, 22000], rep: 40, xp: 300 },
        weaponDropChance: 0.55, weaponRarityFloor: 'rare',
        narrativeText: ['Tijd om het Syndicaat waar het pijn doet te raken...', 'Hun geldstromen zijn hun zwakste punt.'],
      },
    ],
    boss: {
      id: 'boss_vasari', name: 'Don Vasari', title: 'Syndicaat Godfather',
      icon: '🎩', portrait: '🎩',
      hp: 350, damage: 22, armor: 12, speed: 6,
      phases: [
        { hpThreshold: 100, name: 'Elegant', attackBonus: 0, specialAttack: { name: 'Vergulde Kogel', icon: '✨', damage: 30, effect: 'Precisie-schot dat armor doorboort', chance: 0.2 } },
        { hpThreshold: 50, name: 'Wanhopig', attackBonus: 10, specialAttack: { name: 'Laatste Bevel', icon: '📞', damage: 45, effect: 'Roept versterking — extra schade', chance: 0.35 } },
      ],
      lootTable: [
        { type: 'weapon', chance: 1.0, minRarity: 'rare' },
        { type: 'money', chance: 1.0, money: 30000 },
        { type: 'accessory', chance: 0.4, accessoryName: "Vasari's Grip", accessoryIcon: '🧤', accessoryEffect: '+8% wapen accuracy' },
      ],
      exclusiveBrand: 'serpiente',
      dialogue: {
        intro: '"Ah, de beruchte nieuwkomer. Ik moet zeggen, je hebt lef. Maar lef alleen zal je niet redden."',
        phase2: '"Genoeg spelletjes! Guards — elimineer dit probleem!"',
        defeat: '"Dit... dit is niet hoe het verhaal zou eindigen... niet voor mij..."',
        playerDefeat: '"Begraving of crematie? Ik laat de keuze aan jou."',
      },
    },
    completionReward: {
      title: 'Syndicaat Breker', description: '+10% wapenhandel inkomsten', icon: '🕸️',
      bonusType: 'income', bonusValue: 10,
    },
  },
  {
    id: 'ch3',
    number: 3,
    title: 'Bloed & Eer',
    subtitle: 'De prijs van macht',
    icon: '⚔️',
    description: 'Met het Syndicaat verzwakt, rijzen nieuwe machten. De oude families van Noxhaven eisen hun territorium terug — en jij staat in de weg.',
    minLevel: 10,
    missions: [
      {
        id: 'ch3_m1', title: 'Bloedeed', description: 'Smeed een alliantie met een onverwachte bondgenoot.',
        icon: '🤝', energyCost: 5, minLevel: 10, encounters: 4,
        rewards: { money: [10000, 20000], rep: 35, xp: 280 },
        weaponDropChance: 0.5, weaponRarityFloor: 'rare',
        narrativeText: ['Een voorstel dat je niet kunt weigeren...', 'Maar vertrouwen is een luxe in Noxhaven.'],
      },
      {
        id: 'ch3_m2', title: 'De Familiefehde', description: 'Stop een oorlog tussen twee rivaliserende families.',
        icon: '🔥', energyCost: 6, minLevel: 11, encounters: 5,
        rewards: { money: [15000, 25000], rep: 40, xp: 350 },
        weaponDropChance: 0.55, weaponRarityFloor: 'rare',
        narrativeText: ['De straten kleuren rood...', 'Alleen jij kunt dit stoppen — of erger maken.'],
      },
      {
        id: 'ch3_m3', title: 'Eer onder Dieven', description: 'Een onmogelijke heist om je waarde te bewijzen.',
        icon: '💎', energyCost: 6, minLevel: 12, encounters: 5,
        rewards: { money: [18000, 30000], rep: 45, xp: 400 },
        weaponDropChance: 0.6, weaponRarityFloor: 'rare',
        narrativeText: ['De kluis van de Centrale Bank...', 'Onmogelijk? Dat woord ken je niet.'],
      },
      {
        id: 'ch3_m4', title: 'De Zuivering', description: 'Elimineer de verraders in je eigen organisatie.',
        icon: '🩸', energyCost: 7, minLevel: 13, encounters: 6,
        rewards: { money: [20000, 35000], rep: 50, xp: 450 },
        weaponDropChance: 0.65, weaponRarityFloor: 'rare',
        narrativeText: ['Verraad moet worden bestraft...', 'Maar wie kun je nog vertrouwen?'],
      },
    ],
    boss: {
      id: 'boss_carmela', name: 'Carmela "La Loba" Reyes', title: 'Koningin van de Straat',
      icon: '🐺', portrait: '🐺',
      hp: 500, damage: 28, armor: 15, speed: 8,
      phases: [
        { hpThreshold: 100, name: 'Berekend', attackBonus: 0, specialAttack: { name: 'Wolfsbeet', icon: '🐺', damage: 35, effect: 'Snelle combo — moeilijk te ontwijken', chance: 0.3 } },
        { hpThreshold: 50, name: 'Losgeslagen', attackBonus: 12, specialAttack: { name: 'Roedel Aanval', icon: '🐺🐺', damage: 55, effect: 'Meervoudige aanval met wolfsbende', chance: 0.35 } },
      ],
      lootTable: [
        { type: 'weapon', chance: 1.0, minRarity: 'epic' },
        { type: 'money', chance: 1.0, money: 50000 },
        { type: 'accessory', chance: 0.45, accessoryName: "La Loba's Ketting", accessoryIcon: '🐺', accessoryEffect: '+5% dodge kans' },
      ],
      exclusiveBrand: 'drakon',
      dialogue: {
        intro: '"Ze noemen me La Loba — de wolvin. En jij bent in mijn territorium, prooi."',
        phase2: '"Mijn roedel! Aan mij! Verscheur deze indringer!"',
        defeat: '"De wolvin... valt... maar haar roedel... zal je vinden..."',
        playerDefeat: '"De wolven eten vanavond goed."',
      },
    },
    completionReward: {
      title: 'Bloedbroeder', description: '+3 max schade op alle wapens', icon: '⚔️',
      bonusType: 'damage', bonusValue: 3,
    },
  },
  {
    id: 'ch4',
    number: 4,
    title: 'De Machtsgreep',
    subtitle: 'De kroon wacht',
    icon: '👑',
    description: 'De onderwereld is verzwakt door jouw acties. Nu is het moment om de ultieme macht te grijpen — maar de burgemeester heeft andere plannen.',
    minLevel: 15,
    missions: [
      {
        id: 'ch4_m1', title: 'Politieke Manoeuvres', description: 'Manipuleer de verkiezingen van Noxhaven.',
        icon: '🏛️', energyCost: 7, minLevel: 15, encounters: 5,
        rewards: { money: [20000, 40000], rep: 50, xp: 500 },
        weaponDropChance: 0.6, weaponRarityFloor: 'rare',
        narrativeText: ['Democratie is slechts een instrument...', 'En jij bent de meester-manipulator.'],
      },
      {
        id: 'ch4_m2', title: 'De Coup', description: 'Neem het stadhuis over — met geweld of diplomatie.',
        icon: '⚡', energyCost: 8, minLevel: 16, encounters: 6,
        rewards: { money: [30000, 50000], rep: 60, xp: 600 },
        weaponDropChance: 0.65, weaponRarityFloor: 'epic',
        narrativeText: ['Het is tijd. De stad zal van jou zijn.', 'Maar tegen welke prijs?'],
      },
      {
        id: 'ch4_m3', title: 'Het Laatste Verzet', description: 'Vernietig de laatste oppositie.',
        icon: '🔥', energyCost: 8, minLevel: 17, encounters: 7,
        rewards: { money: [35000, 60000], rep: 70, xp: 700 },
        weaponDropChance: 0.7, weaponRarityFloor: 'epic',
        narrativeText: ['Ze geven niet op. Maar jij ook niet.', 'De straten van Noxhaven beven.'],
      },
    ],
    boss: {
      id: 'boss_decker', name: 'Commissaris Decker', title: 'De Corrupte Arm der Wet',
      icon: '🛡️', portrait: '🛡️',
      hp: 700, damage: 35, armor: 20, speed: 7,
      phases: [
        { hpThreshold: 100, name: 'Autoriteit', attackBonus: 0, specialAttack: { name: 'Arrestatiebevel', icon: '📋', damage: 40, effect: 'Stuurt elite-eenheid — vermindert snelheid', chance: 0.25 } },
        { hpThreshold: 50, name: 'Desperaat', attackBonus: 15, specialAttack: { name: 'Noodverordening', icon: '🚨', damage: 65, effect: 'Volledige politie-inzet — massale schade', chance: 0.3 } },
      ],
      lootTable: [
        { type: 'weapon', chance: 1.0, minRarity: 'epic' },
        { type: 'money', chance: 1.0, money: 75000 },
        { type: 'accessory', chance: 0.5, accessoryName: "Decker's Badge", accessoryIcon: '🛡️', accessoryEffect: '-10% heat per gevecht' },
      ],
      exclusiveBrand: 'phantom',
      dialogue: {
        intro: '"Ik BEN de wet in deze stad. En jij bent het bewijs dat ik heb gefaald. Dat fout... corrigeer ik nu."',
        phase2: '"ALLE EENHEDEN! CODE ROOD! DIT SUBJECT MOET GENEUTRALISEERD WORDEN!"',
        defeat: '"De... de wet... verliest nooit... dit is... onmogelijk..."',
        playerDefeat: '"Opgesloten voor de rest van je leven. Dat is nog mild."',
      },
    },
    completionReward: {
      title: 'Machtsgrijper', description: '+15% verdediging permanent', icon: '👑',
      bonusType: 'defense', bonusValue: 15,
    },
  },
  {
    id: 'ch5',
    number: 5,
    title: 'Eindspel',
    subtitle: 'De kroning',
    icon: '💀',
    description: 'Achter alle facties, alle corruptie, staat één figuur: De Architect. De persoon die Noxhaven heeft gebouwd tot wat het is. Het is tijd voor de finale.',
    minLevel: 20,
    missions: [
      {
        id: 'ch5_m1', title: 'De Ontmaskering', description: 'Onthul de ware identiteit van De Architect.',
        icon: '🎭', energyCost: 8, minLevel: 20, encounters: 6,
        rewards: { money: [40000, 70000], rep: 80, xp: 800 },
        weaponDropChance: 0.7, weaponRarityFloor: 'epic',
        narrativeText: ['Alle puzzelstukjes vallen op hun plaats...', 'De waarheid is schokkender dan je dacht.'],
      },
      {
        id: 'ch5_m2', title: 'De Belegering', description: 'Bestorm het fort van De Architect.',
        icon: '🏰', energyCost: 10, minLevel: 22, encounters: 8,
        rewards: { money: [50000, 90000], rep: 100, xp: 1000 },
        weaponDropChance: 0.8, weaponRarityFloor: 'epic',
        narrativeText: ['Het fort op de klif boven Noxhaven...', 'De laatste barrière tussen jou en totale macht.'],
      },
    ],
    boss: {
      id: 'boss_architect', name: 'De Architect', title: 'Meester van Noxhaven',
      icon: '🏛️', portrait: '🏛️',
      hp: 1000, damage: 45, armor: 25, speed: 9,
      phases: [
        { hpThreshold: 100, name: 'Controle', attackBonus: 0, specialAttack: { name: 'Meesterplan', icon: '🧠', damage: 50, effect: 'Voorspelt je aanval — halveert volgende schade', chance: 0.3 } },
        { hpThreshold: 60, name: 'Chaos', attackBonus: 12, specialAttack: { name: 'Vallen Activeren', icon: '⚙️', damage: 60, effect: 'Verborgen vallen — kan niet ontwijken', chance: 0.35 } },
        { hpThreshold: 30, name: 'Wanhoop', attackBonus: 20, specialAttack: { name: 'Alles Vernietigen', icon: '💥', damage: 80, effect: 'Vernietigt het fort — massale AOE schade', chance: 0.4 } },
      ],
      lootTable: [
        { type: 'weapon', chance: 1.0, minRarity: 'legendary' },
        { type: 'money', chance: 1.0, money: 150000 },
        { type: 'accessory', chance: 0.6, accessoryName: "Architect's Signet", accessoryIcon: '💍', accessoryEffect: '+10% alle stats' },
      ],
      dialogue: {
        intro: '"Je hebt mijn stad kapotgemaakt. Elke factie, elk systeem — mijn creatie. En nu kom je voor MIJ? Dan laat ik je zien wat echte macht is."',
        phase2: '"Interessant. Je bent sterker dan ik dacht. Maar dit fort heeft meer verrassingen dan jij je kunt voorstellen."',
        defeat: '"De... Architect... valt... maar Noxhaven... zal altijd... van mij zijn..."',
        playerDefeat: '"Je was bijna goed genoeg. Bijna."',
      },
    },
    completionReward: {
      title: 'Meester van Noxhaven', description: '+20% XP permanent', icon: '💀',
      bonusType: 'xp', bonusValue: 20,
    },
  },
  {
    id: 'ch6',
    number: 6,
    title: 'Schaduw Protocol',
    subtitle: 'Niets is wat het lijkt',
    icon: '🔮',
    description: 'Een mysterieus signaal leidt je naar een verborgen netwerk dat al decennia vanuit de ondergrond opereert. Iemand manipuleert Noxhaven — en het is niet De Architect.',
    minLevel: 25,
    missions: [
      {
        id: 'ch6_m1', title: 'Het Signaal', description: 'Volg een gecodeerd signaal naar de bron.',
        icon: '📡', energyCost: 9, minLevel: 25, encounters: 6,
        rewards: { money: [50000, 80000], rep: 90, xp: 900 },
        weaponDropChance: 0.7, weaponRarityFloor: 'epic',
        narrativeText: ['Een versleuteld signaal op een vergeten frequentie...', 'De bron bevindt zich diep onder Iron Borough.'],
      },
      {
        id: 'ch6_m2', title: 'Ondergrondse Stad', description: 'Ontdek een verborgen stad onder Noxhaven.',
        icon: '🏚️', energyCost: 10, minLevel: 26, encounters: 7,
        rewards: { money: [60000, 100000], rep: 100, xp: 1000 },
        weaponDropChance: 0.75, weaponRarityFloor: 'epic',
        narrativeText: ['Onder de straten van Noxhaven ligt een tweede stad...', 'Hier wonen degenen die de wereld boven besturen.'],
      },
      {
        id: 'ch6_m3', title: 'De Raad der Schaduwen', description: 'Infiltreer de geheime raad die Noxhaven bestuurt.',
        icon: '🎭', energyCost: 10, minLevel: 27, encounters: 7,
        rewards: { money: [70000, 120000], rep: 110, xp: 1100 },
        weaponDropChance: 0.8, weaponRarityFloor: 'epic',
        narrativeText: ['Twaalf maskers. Twaalf stemmen. Eén oordeel.', 'Ze wisten dat je zou komen. Ze hebben erop gerekend.'],
      },
      {
        id: 'ch6_m4', title: 'Protocol Omega', description: 'Voorkom de activering van een stadsbrede lockdown.',
        icon: '⚠️', energyCost: 12, minLevel: 28, encounters: 8,
        rewards: { money: [80000, 140000], rep: 120, xp: 1200 },
        weaponDropChance: 0.85, weaponRarityFloor: 'legendary',
        narrativeText: ['Protocol Omega: totale controle over Noxhaven.', 'Je hebt 60 minuten. De klok tikt.'],
      },
    ],
    boss: {
      id: 'boss_oracle', name: 'Het Orakel', title: 'Stem van de Schaduwen',
      icon: '👁️', portrait: '👁️',
      hp: 1200, damage: 50, armor: 28, speed: 10,
      phases: [
        { hpThreshold: 100, name: 'Alwetend', attackBonus: 0, specialAttack: { name: 'Gedachtenlezen', icon: '🧠', damage: 55, effect: 'Voorspelt je aanval — counter voor dubbele schade', chance: 0.3 } },
        { hpThreshold: 60, name: 'Manipulatie', attackBonus: 15, specialAttack: { name: 'Schaduw Marionetten', icon: '🎭', damage: 65, effect: 'Stuurt schaduwklonen — kan niet onderscheiden', chance: 0.35 } },
        { hpThreshold: 25, name: 'Ontrafeling', attackBonus: 25, specialAttack: { name: 'Psychische Storm', icon: '🌀', damage: 90, effect: 'Overweldigende mentale aanval — negeert armor', chance: 0.4 } },
      ],
      lootTable: [
        { type: 'weapon', chance: 1.0, minRarity: 'legendary' },
        { type: 'money', chance: 1.0, money: 200000 },
        { type: 'accessory', chance: 0.55, accessoryName: "Orakel's Oog", accessoryIcon: '👁️', accessoryEffect: '+15% dodge, vijandelijke aanvallen zichtbaar' },
      ],
      dialogue: {
        intro: '"Ik heb elke stap van je voorspeld. Elke keuze, elke overwinning — mijn ontwerp. En nu sta je hier, precies waar ik je wil."',
        phase2: '"Fascineerend. Je breekt door mijn berekeningen. Laat me het speelveld... aanpassen."',
        defeat: '"Onmogelijk... de variabelen... kloppen niet... wie BEN je?"',
        playerDefeat: '"Voorspelbaar tot het einde. Slaap nu, pion."',
      },
    },
    completionReward: {
      title: 'Schaduwbreker', description: '+25% XP van alle bronnen', icon: '🔮',
      bonusType: 'xp', bonusValue: 25,
    },
  },
  {
    id: 'ch7',
    number: 7,
    title: 'Asche & Wedergeboorte',
    subtitle: 'De stad brandt',
    icon: '🔥',
    description: 'Noxhaven staat in brand — letterlijk en figuurlijk. Een burgeroorlog verscheurt de stad. Oude vijanden worden bondgenoten, en bondgenoten worden vijanden. Kies een kant, of heers over de as.',
    minLevel: 30,
    missions: [
      {
        id: 'ch7_m1', title: 'De Vonk', description: 'Onderzoek wie de burgeroorlog heeft ontketend.',
        icon: '🕯️', energyCost: 10, minLevel: 30, encounters: 7,
        rewards: { money: [80000, 130000], rep: 120, xp: 1200 },
        weaponDropChance: 0.8, weaponRarityFloor: 'epic',
        narrativeText: ['De explosie in Crown Heights was geen ongeluk...', 'Iemand wíl dat Noxhaven brandt.'],
      },
      {
        id: 'ch7_m2', title: 'Geen Mans Land', description: 'Doorkruis de verwoeste districten om overlevenden te vinden.',
        icon: '🏗️', energyCost: 12, minLevel: 31, encounters: 8,
        rewards: { money: [100000, 160000], rep: 130, xp: 1400 },
        weaponDropChance: 0.85, weaponRarityFloor: 'epic',
        narrativeText: ['De straten zijn slagvelden geworden.', 'Tussen de ruïnes vind je onverwachte bondgenoten.'],
      },
      {
        id: 'ch7_m3', title: 'Het Wapenstilstandsverdrag', description: 'Smeed een onmogelijke alliantie — of vernietig alle partijen.',
        icon: '🕊️', energyCost: 12, minLevel: 32, encounters: 8,
        rewards: { money: [120000, 180000], rep: 140, xp: 1500 },
        weaponDropChance: 0.85, weaponRarityFloor: 'legendary',
        narrativeText: ['Vrede of totale oorlog — de keuze is aan jou.', 'Maar elke keuze heeft een prijs.'],
      },
      {
        id: 'ch7_m4', title: 'De Wederopbouw', description: 'Neem de controle over de herbouw van Noxhaven.',
        icon: '🏗️', energyCost: 14, minLevel: 33, encounters: 9,
        rewards: { money: [140000, 200000], rep: 150, xp: 1600 },
        weaponDropChance: 0.9, weaponRarityFloor: 'legendary',
        narrativeText: ['Uit de as rijst een nieuw Noxhaven.', 'En jij bepaalt hoe het eruitziet.'],
      },
    ],
    boss: {
      id: 'boss_phoenix', name: 'De Feniks', title: 'Wedergeboren in Vuur',
      icon: '🔥', portrait: '🔥',
      hp: 1500, damage: 55, armor: 30, speed: 11,
      phases: [
        { hpThreshold: 100, name: 'Vuurstorm', attackBonus: 0, specialAttack: { name: 'Vuurzee', icon: '🔥', damage: 60, effect: 'Brandschade over meerdere beurten', chance: 0.3 } },
        { hpThreshold: 60, name: 'Helse Woede', attackBonus: 18, specialAttack: { name: 'Nova Burst', icon: '💥', damage: 75, effect: 'Explosieve schokgolf — vermindert armor', chance: 0.35 } },
        { hpThreshold: 30, name: 'Wedergeboorte', attackBonus: 25, specialAttack: { name: 'Herrijzenis', icon: '🔄', damage: 50, effect: 'Geneest 15% HP — moet snel verslagen worden', chance: 0.4 } },
      ],
      lootTable: [
        { type: 'weapon', chance: 1.0, minRarity: 'legendary' },
        { type: 'money', chance: 1.0, money: 250000 },
        { type: 'accessory', chance: 0.6, accessoryName: "Feniks Veer", accessoryIcon: '🪶', accessoryEffect: 'Eénmaal per gevecht: herleef met 25% HP' },
      ],
      dialogue: {
        intro: '"Ik heb deze stad in brand gestoken. Niet uit haat — uit liefde. Alleen vuur zuivert. En nu, oude vriend, zuiver ik jou."',
        phase2: '"Je denkt dat je wint? Ik WORD sterker van pijn! Elke slag voedt mijn vuur!"',
        defeat: '"Het vuur... dooft... maar de vonk... leeft... altijd..."',
        playerDefeat: '"Asche tot asche. Rust nu."',
      },
    },
    completionReward: {
      title: 'Feniksdoder', description: '+5 max schade, +10% crit schade', icon: '🔥',
      bonusType: 'damage', bonusValue: 5,
    },
  },
  {
    id: 'ch8',
    number: 8,
    title: 'De Erfenis van Noxhaven',
    subtitle: 'Het ware eindspel',
    icon: '⚜️',
    description: 'De laatste geheimen van Noxhaven worden onthuld. Diep onder de stad ligt de Kluis — een artefact uit het verleden dat de macht heeft om alles te veranderen. Maar de prijs is hoger dan je denkt.',
    minLevel: 35,
    missions: [
      {
        id: 'ch8_m1', title: 'De Sleutel', description: 'Vind de drie sleutelfragmenten verspreid over Noxhaven.',
        icon: '🗝️', energyCost: 12, minLevel: 35, encounters: 8,
        rewards: { money: [120000, 200000], rep: 150, xp: 1500 },
        weaponDropChance: 0.85, weaponRarityFloor: 'legendary',
        narrativeText: ['Drie fragmenten. Drie bewakers. Drie keuzes.', 'De sleutel tot alles ligt verspreid over de stad.'],
      },
      {
        id: 'ch8_m2', title: 'De Afdaling', description: 'Daal af naar de diepste gewelven onder Noxhaven.',
        icon: '⬇️', energyCost: 14, minLevel: 36, encounters: 9,
        rewards: { money: [150000, 250000], rep: 170, xp: 1800 },
        weaponDropChance: 0.9, weaponRarityFloor: 'legendary',
        narrativeText: ['Elke verdieping dieper onthult een ouder geheim.', 'De muren fluisteren namen van vergeten koningen.'],
      },
      {
        id: 'ch8_m3', title: 'De Laatste Keuze', description: 'Sta voor de Kluis en maak je definitieve keuze.',
        icon: '⚖️', energyCost: 15, minLevel: 38, encounters: 10,
        rewards: { money: [200000, 350000], rep: 200, xp: 2000 },
        weaponDropChance: 1.0, weaponRarityFloor: 'legendary',
        narrativeText: ['De Kluis staat open. De macht is van jou.', 'Maar macht zonder wijsheid is vernietiging.'],
      },
    ],
    boss: {
      id: 'boss_noxhaven', name: 'De Ziel van Noxhaven', title: 'De Eeuwige Bewaker',
      icon: '⚜️', portrait: '⚜️',
      hp: 2000, damage: 60, armor: 35, speed: 12,
      phases: [
        { hpThreshold: 100, name: 'Oordeel', attackBonus: 0, specialAttack: { name: 'Herinnering', icon: '💭', damage: 50, effect: 'Toont je grootste falen — vermindert aanval', chance: 0.25 } },
        { hpThreshold: 70, name: 'Beproeving', attackBonus: 15, specialAttack: { name: 'Tijdverbuiging', icon: '⏳', damage: 70, effect: 'Vertraagt tijd — je snelheid halveert', chance: 0.3 } },
        { hpThreshold: 40, name: 'Transformatie', attackBonus: 22, specialAttack: { name: 'Stadsziel', icon: '🏙️', damage: 85, effect: 'De hele stad vecht tegen je — massale schade', chance: 0.35 } },
        { hpThreshold: 15, name: 'Laatste Adem', attackBonus: 30, specialAttack: { name: 'Eeuwige Vloek', icon: '💀', damage: 100, effect: 'Alles of niets — kan instant doden', chance: 0.4 } },
      ],
      lootTable: [
        { type: 'weapon', chance: 1.0, minRarity: 'legendary' },
        { type: 'money', chance: 1.0, money: 500000 },
        { type: 'accessory', chance: 0.7, accessoryName: "Kroon van Noxhaven", accessoryIcon: '👑', accessoryEffect: '+15% alle stats, unieke titel' },
      ],
      dialogue: {
        intro: '"Ik ben Noxhaven. Elke steen, elke straat, elke ziel die hier heeft geleefd — ik ben hun echo. En jij? Jij bent slechts de laatste in een lange rij uitdagers."',
        phase2: '"Indrukwekkend. Geen sterveling heeft mijn tweede gedaante gezien in tweehonderd jaar."',
        defeat: '"Eindelijk... een waardige opvolger... Noxhaven... is nu... van jou..."',
        playerDefeat: '"De stad verwerpt je. Ga, en keer nooit terug."',
      },
    },
    completionReward: {
      title: 'Ware Heerser van Noxhaven', description: '+30% alle bonussen permanent', icon: '⚜️',
      bonusType: 'xp', bonusValue: 30,
    },
  },
];

// ========== STATE HELPERS ==========

export function createInitialCampaignState(): CampaignState {
  return {
    chapters: CAMPAIGN_CHAPTERS.map((ch, i) => ({
      chapterId: ch.id,
      unlocked: i === 0, // only chapter 1 unlocked
      missions: ch.missions.map(m => ({
        missionId: m.id,
        completed: false,
        bestRating: null,
        completedAt: null,
      })),
      boss: {
        bossId: ch.boss.id,
        killCount: 0,
        bestTime: null,
        lastKillDay: null,
      },
      completed: false,
      completedAt: null,
      difficulty: 'normal' as CampaignDifficulty,
    })),
    activeBossFight: null,
    activeCampaignMission: null,
    totalBossKills: 0,
    chapterBonuses: [],
  };
}

export function getChapterDef(chapterId: string): CampaignChapter | undefined {
  return CAMPAIGN_CHAPTERS.find(c => c.id === chapterId);
}

export function getMissionDef(missionId: string): CampaignMission | undefined {
  for (const ch of CAMPAIGN_CHAPTERS) {
    const m = ch.missions.find(m => m.id === missionId);
    if (m) return m;
  }
  return undefined;
}

export function getBossDef(bossId: string): CampaignBoss | undefined {
  for (const ch of CAMPAIGN_CHAPTERS) {
    if (ch.boss.id === bossId) return ch.boss;
  }
  return undefined;
}

export function canStartMission(state: CampaignState, chapterId: string, missionId: string, playerLevel: number): boolean {
  const chProgress = state.chapters.find(c => c.chapterId === chapterId);
  if (!chProgress || !chProgress.unlocked) return false;
  const chDef = getChapterDef(chapterId);
  if (!chDef) return false;
  const mDef = chDef.missions.find(m => m.id === missionId);
  if (!mDef) return false;
  // Must meet level requirement
  if (playerLevel < mDef.minLevel) return false;
  // All previous missions in chapter must be completed
  const mIndex = chDef.missions.findIndex(m => m.id === missionId);
  for (let i = 0; i < mIndex; i++) {
    const prev = chProgress.missions.find(p => p.missionId === chDef.missions[i].id);
    if (!prev || !prev.completed) return false;
  }
  return true;
}

export function canFightBoss(state: CampaignState, chapterId: string, playerLevel: number): boolean {
  const chProgress = state.chapters.find(c => c.chapterId === chapterId);
  if (!chProgress || !chProgress.unlocked) return false;
  const chDef = getChapterDef(chapterId);
  if (!chDef) return false;
  if (playerLevel < chDef.minLevel) return false;
  // All missions must be completed
  return chProgress.missions.every(m => m.completed);
}

// ========== BOSS FIGHT LOGIC ==========

export function startBossFight(chapterId: string, playerHP: number, playerMaxHP: number, difficulty: CampaignDifficulty, playerLevel: number): ActiveBossFight {
  const ch = getChapterDef(chapterId)!;
  const boss = ch.boss;
  const diffMult = difficulty === 'nightmare' ? 1.8 : difficulty === 'hard' ? 1.4 : 1.0;
  const levelScale = 1 + (playerLevel - ch.minLevel) * 0.05;
  const scaledHP = Math.floor(boss.hp * diffMult * levelScale);

  return {
    chapterId,
    bossId: boss.id,
    bossHP: scaledHP,
    bossMaxHP: scaledHP,
    playerHP,
    playerMaxHP,
    currentPhase: 0,
    turn: 0,
    log: [
      { turn: 0, text: boss.dialogue.intro, type: 'boss', icon: boss.icon },
      { turn: 0, text: `${boss.name} verschijnt! [${boss.title}]`, type: 'info', icon: '⚔️' },
    ],
    difficulty,
    loot: null,
    gearLoot: null,
    moneyLoot: 0,
    accessoryLoot: null,
    finished: false,
    won: false,
  };
}

export function bossFightTurn(
  fight: ActiveBossFight,
  action: 'attack' | 'heavy' | 'defend',
  playerDamage: number,
  playerArmor: number
): ActiveBossFight {
  const ch = getChapterDef(fight.chapterId)!;
  const boss = ch.boss;
  const diffMult = fight.difficulty === 'nightmare' ? 1.8 : fight.difficulty === 'hard' ? 1.4 : 1.0;
  const turn = fight.turn + 1;
  const log: BossFightLogEntry[] = [];

  // Player action
  let pDmg = 0;
  let pDefending = false;
  if (action === 'attack') {
    pDmg = Math.max(1, playerDamage - Math.floor(boss.armor * 0.3));
    log.push({ turn, text: `Je valt aan voor ${pDmg} schade!`, type: 'player', icon: '⚔️' });
  } else if (action === 'heavy') {
    pDmg = Math.max(1, Math.floor(playerDamage * 1.5) - Math.floor(boss.armor * 0.2));
    const miss = Math.random() < 0.2;
    if (miss) {
      pDmg = 0;
      log.push({ turn, text: 'Je zware aanval mist!', type: 'player', icon: '💨' });
    } else {
      log.push({ turn, text: `Zware aanval! ${pDmg} schade!`, type: 'player', icon: '💥' });
    }
  } else {
    pDefending = true;
    log.push({ turn, text: 'Je neemt een verdedigende houding aan.', type: 'player', icon: '🛡️' });
  }

  let newBossHP = Math.max(0, fight.bossHP - pDmg);

  // Check phase transition
  const hpPercent = (newBossHP / fight.bossMaxHP) * 100;
  let currentPhase = fight.currentPhase;
  if (currentPhase < boss.phases.length - 1 && hpPercent <= boss.phases[currentPhase + 1].hpThreshold) {
    currentPhase++;
    const phaseName = boss.phases[currentPhase].name;
    log.push({ turn, text: `${boss.name} gaat over in fase: ${phaseName}!`, type: 'phase', icon: '⚠️' });
    if (currentPhase === 1) {
      log.push({ turn, text: boss.dialogue.phase2, type: 'boss', icon: boss.icon });
    }
  }

  // Boss dead?
  if (newBossHP <= 0) {
    log.push({ turn, text: boss.dialogue.defeat, type: 'boss', icon: '💀' });
    log.push({ turn, text: `${boss.name} is verslagen!`, type: 'info', icon: '🏆' });
    return { ...fight, bossHP: 0, turn, currentPhase, log: [...fight.log, ...log], finished: true, won: true };
  }

  // Boss attacks
  const phase = boss.phases[currentPhase];
  const baseDmg = Math.floor((boss.damage + phase.attackBonus) * diffMult);
  let bDmg: number;
  const useSpecial = Math.random() < phase.specialAttack.chance;

  if (useSpecial) {
    bDmg = Math.floor(phase.specialAttack.damage * diffMult);
    if (pDefending) bDmg = Math.floor(bDmg * 0.4);
    else bDmg = Math.max(1, bDmg - playerArmor);
    log.push({ turn, text: `${boss.name} gebruikt ${phase.specialAttack.name}! ${bDmg} schade! ${phase.specialAttack.effect}`, type: 'boss', icon: phase.specialAttack.icon });
  } else {
    bDmg = pDefending ? Math.floor(baseDmg * 0.4) : Math.max(1, baseDmg - playerArmor);
    log.push({ turn, text: `${boss.name} valt aan voor ${bDmg} schade!`, type: 'boss', icon: '👊' });
  }

  const newPlayerHP = Math.max(0, fight.playerHP - bDmg);

  // Player dead?
  if (newPlayerHP <= 0) {
    log.push({ turn, text: boss.dialogue.playerDefeat, type: 'boss', icon: '💀' });
    log.push({ turn, text: 'Je bent verslagen...', type: 'info', icon: '☠️' });
    return { ...fight, playerHP: 0, bossHP: newBossHP, turn, currentPhase, log: [...fight.log, ...log], finished: true, won: false };
  }

  return { ...fight, bossHP: newBossHP, playerHP: newPlayerHP, turn, currentPhase, log: [...fight.log, ...log] };
}

export function generateBossLoot(
  chapterId: string,
  playerLevel: number,
  killCount: number,
  difficulty: CampaignDifficulty
): { weapon: GeneratedWeapon | null; gear: GeneratedGear | null; money: number; accessory: { name: string; icon: string; effect: string } | null } {
  const ch = getChapterDef(chapterId)!;
  const boss = ch.boss;
  const diffBonus = difficulty === 'nightmare' ? 2 : difficulty === 'hard' ? 1.5 : 1;

  let weapon: GeneratedWeapon | null = null;
  let gear: GeneratedGear | null = null;
  let money = 0;
  let accessory: { name: string; icon: string; effect: string } | null = null;

  for (const entry of boss.lootTable) {
    if (Math.random() > entry.chance) continue;
    if (entry.type === 'weapon') {
      // First kill = guaranteed rarity floor, repeat kills = chance for better
      const minRarity = entry.minRarity || 'rare';
      const rarityUpgrade = killCount > 0 && Math.random() < 0.2 * killCount;
      const rarity: WeaponRarity = rarityUpgrade ? 'legendary' : minRarity;
      weapon = generateWeapon(playerLevel, rarity);
    } else if (entry.type === 'money') {
      money = Math.floor((entry.money || 10000) * diffBonus);
    } else if (entry.type === 'accessory') {
      accessory = { name: entry.accessoryName!, icon: entry.accessoryIcon!, effect: entry.accessoryEffect! };
    }
  }

  // Boss also has a 40% chance to drop gear (scales with chapter number)
  if (Math.random() < 0.4 + ch.number * 0.05) {
    const gearType: GearType = Math.random() < 0.5 ? 'armor' : 'gadget';
    const minGearRarity = ch.number >= 4 ? 'epic' as const : ch.number >= 2 ? 'rare' as const : 'uncommon' as const;
    const gearRarityUpgrade = killCount > 0 && Math.random() < 0.15 * killCount;
    const gearRarity = gearRarityUpgrade ? 'legendary' as const : minGearRarity;
    gear = generateGear(playerLevel, gearType, gearRarity);
  }

  return { weapon, gear, money, accessory };
}

// ========== CAMPAIGN MISSION COMBAT ==========

export function startCampaignMission(chapterId: string, missionId: string): ActiveCampaignMission {
  const mDef = getMissionDef(missionId)!;
  return {
    chapterId,
    missionId,
    currentEncounter: 0,
    totalEncounters: mDef.encounters,
    log: [mDef.narrativeText[0] || `Missie gestart: ${mDef.title}`],
    rewards: {
      money: mDef.rewards.money[0] + Math.floor(Math.random() * (mDef.rewards.money[1] - mDef.rewards.money[0])),
      rep: mDef.rewards.rep,
      xp: mDef.rewards.xp,
    },
    finished: false,
    success: false,
    droppedWeapon: null,
    droppedGear: null,
  };
}

export function advanceCampaignMission(mission: ActiveCampaignMission, playerLevel: number, playerPower: number): ActiveCampaignMission {
  const mDef = getMissionDef(mission.missionId)!;
  const encounter = mission.currentEncounter + 1;
  const difficulty = 40 + encounter * 10 + playerLevel * 2;
  const roll = Math.random() * 100 + playerPower * 0.5;
  const success = roll > difficulty * 0.6;

  const log = [...mission.log];
  if (success) {
    log.push(`Encounter ${encounter}/${mission.totalEncounters}: Succes! Je overwint de vijanden.`);
  } else {
    log.push(`Encounter ${encounter}/${mission.totalEncounters}: Mislukt! De missie is gefaald.`);
    return { ...mission, currentEncounter: encounter, log, finished: true, success: false };
  }

  if (encounter >= mission.totalEncounters) {
    // Mission complete — check weapon drop
    let droppedWeapon: GeneratedWeapon | null = null;
    let droppedGear: GeneratedGear | null = null;
    if (Math.random() < mDef.weaponDropChance) {
      droppedWeapon = generateWeapon(playerLevel, undefined, mDef.weaponRarityFloor === 'epic' ? 'epic' : mDef.weaponRarityFloor === 'rare' ? 'rare' : 'uncommon');
    }
    // 30% kans op gear drop (naast wapen)
    if (Math.random() < mDef.weaponDropChance * 0.6) {
      const gearType: GearType = Math.random() < 0.5 ? 'armor' : 'gadget';
      const gearRarity = mDef.weaponRarityFloor === 'epic' ? 'epic' as const : mDef.weaponRarityFloor === 'rare' ? 'rare' as const : 'uncommon' as const;
      droppedGear = generateGear(playerLevel, gearType, gearRarity);
    }
    if (mDef.narrativeText[1]) log.push(mDef.narrativeText[1]);
    log.push('Missie voltooid! 🎉');
    return { ...mission, currentEncounter: encounter, log, finished: true, success: true, droppedWeapon, droppedGear };
  }

  return { ...mission, currentEncounter: encounter, log };
}

// ========== CHAPTER BONUS HELPERS ==========

export function getCampaignBonuses(state: CampaignState): { crit: number; damage: number; defense: number; income: number; xp: number } {
  const bonuses = { crit: 0, damage: 0, defense: 0, income: 0, xp: 0 };
  for (const bonusId of state.chapterBonuses) {
    const ch = CAMPAIGN_CHAPTERS.find(c => c.id === bonusId);
    if (ch) {
      bonuses[ch.completionReward.bonusType] += ch.completionReward.bonusValue;
    }
  }
  return bonuses;
}
