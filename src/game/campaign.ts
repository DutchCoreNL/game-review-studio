// ========== CAMPAIGN SYSTEM — CHAPTER-BASED STORY ==========

import { generateWeapon, type GeneratedWeapon, type WeaponRarity, type BrandId } from './weaponGenerator';
import { generateGear, type GeneratedGear, type GearRarity, type GearType } from './gearGenerator';
import { getEncounterNarrative, getRandomEvent } from './campaignNarratives';

// ========== TYPES ==========

export type CampaignDifficulty = 'normal' | 'hard' | 'nightmare';
export type EncounterChoice = 'stealth' | 'standard' | 'aggressive';
export type EncounterType = 'combat' | 'trap' | 'npc' | 'exploration' | 'timed' | 'puzzle' | 'ambush';

export interface BonusObjective {
  id: string;
  description: string;
  check: 'no_aggressive' | 'all_stealth' | 'high_morale' | 'no_damage' | 'speed_run' | 'find_secret';
  rewardLabel: string;
}

export interface BossDebuff {
  type: 'slow' | 'poison' | 'blind' | 'weaken';
  name: string;
  icon: string;
  turnsLeft: number;
  effect: string; // description
}

export interface CombatItem {
  id: 'medkit' | 'flash' | 'adrenaline';
  name: string;
  icon: string;
  description: string;
}

export const COMBAT_ITEMS: CombatItem[] = [
  { id: 'medkit', name: 'Medkit', icon: '💊', description: 'Genees 25% van je max HP' },
  { id: 'flash', name: 'Flitsgranaat', icon: '💡', description: 'Boss mist volgende beurt' },
  { id: 'adrenaline', name: 'Adrenaline', icon: '💉', description: 'Dubbele schade voor 1 beurt' },
];

export interface CampaignMission {
  id: string;
  title: string;
  description: string;
  icon: string;
  energyCost: number;
  minLevel: number;
  encounters: number;
  rewards: {
    money: [number, number];
    rep: number;
    xp: number;
  };
  weaponDropChance: number;
  weaponRarityFloor: WeaponRarity;
  narrativeText: string[];
  bonusObjectives?: BonusObjective[];
  difficultyRating?: number; // 1-5 skulls
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
  exclusiveBrand?: BrandId;
  dialogue: {
    intro: string;
    phase2: string;
    defeat: string;
    playerDefeat: string;
  };
  counters?: BossCounter[];
}

export interface BossCounter {
  phase: number;
  action: 'attack' | 'heavy' | 'defend' | 'dodge';
  tell: string; // hint shown before counter
  counterDamage: number;
  counterText: string;
}

export interface BossPhase {
  hpThreshold: number;
  name: string;
  attackBonus: number;
  specialAttack: {
    name: string;
    icon: string;
    damage: number;
    effect: string;
    chance: number;
  };
  debuff?: { type: BossDebuff['type']; name: string; icon: string; turns: number; effect: string; chance: number };
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
  completedAt: number | null;
}

export interface CampaignBossProgress {
  bossId: string;
  killCount: number;
  bestTime: number | null;
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

export interface EncounterCarryOver {
  stealthCount: number;
  aggressiveCount: number;
  damageTaken: number;
  bonusLootMod: number; // from push/rest decisions
  moraleBoosted: boolean;
}

export interface CampaignState {
  chapters: CampaignChapterProgress[];
  activeBossFight: ActiveBossFight | null;
  activeCampaignMission: ActiveCampaignMission | null;
  totalBossKills: number;
  chapterBonuses: string[];
  trophies: string[];
  missionStreak: number;
  totalEncountersCompleted: number;
  pityCounter: number;
  failCounts: Record<string, number>; // missionId -> fail count for adaptive difficulty
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
  cooldowns: { heavy: number; dodge: number };
  rage: number;
  rageMax: number;
  defendBuff: number;
  phaseJustChanged: boolean;
  // Strategic depth
  debuffs: BossDebuff[];
  comboHistory: string[]; // last 3 actions
  comboCounter: number;
  itemsUsed: number;
  itemsMax: number;
  bossStunned: boolean;
  adrenalineActive: boolean;
  lastDamageDealt: number;
  lastDamageTaken: number;
  counterWarning: string | null;
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
  choices: EncounterChoice[];
  totalHeatGain: number;
  hpLost: number;
  rating: number;
  morale: number;
  lastRandomEvent: string | null;
  // Strategic depth
  carryOver: EncounterCarryOver;
  bonusObjectives: BonusObjective[];
  bonusObjectivesCompleted: string[];
  hiddenEncounterTriggered: boolean;
  isHiddenEncounter: boolean;
  riskRewardPending: boolean;
}

export interface BossFightLogEntry {
  turn: number;
  text: string;
  type: 'player' | 'boss' | 'phase' | 'loot' | 'info' | 'combo' | 'debuff' | 'item' | 'counter';
  icon?: string;
}

// ========== COMBO DEFINITIONS ==========

interface ComboDefinition {
  sequence: string[];
  name: string;
  icon: string;
  damageMultiplier: number;
  description: string;
}

const COMBOS: ComboDefinition[] = [
  { sequence: ['attack', 'attack', 'attack'], name: 'Drievoudige Slag', icon: '⚡', damageMultiplier: 1.5, description: '3x aanval = 50% bonus' },
  { sequence: ['attack', 'heavy', 'attack'], name: 'Executie Combo', icon: '💀', damageMultiplier: 2.0, description: 'Aanval→Zwaar→Aanval = 2x schade' },
  { sequence: ['defend', 'heavy'], name: 'Verdedigde Stoot', icon: '🛡️', damageMultiplier: 1.8, description: 'Verdedig→Zwaar = 80% bonus' },
  { sequence: ['dodge', 'attack', 'heavy'], name: 'Schaduw Aanval', icon: '👤', damageMultiplier: 2.2, description: 'Ontwijken→Aanval→Zwaar = 120% bonus' },
];

function checkCombo(history: string[]): ComboDefinition | null {
  for (const combo of COMBOS) {
    const len = combo.sequence.length;
    if (history.length >= len) {
      const recent = history.slice(-len);
      if (recent.every((a, i) => a === combo.sequence[i])) {
        return combo;
      }
    }
  }
  return null;
}

// ========== BOSS COUNTER DEFINITIONS ==========

const BOSS_COUNTERS: Record<string, BossCounter[]> = {
  boss_viktor: [
    { phase: 1, action: 'heavy', tell: '🪓 Kozlov draait zijn bijl langzaam...', counterDamage: 30, counterText: 'Kozlov countert je zware aanval met een bijlzwaai!' },
  ],
  boss_vasari: [
    { phase: 0, action: 'dodge', tell: '🎩 Vasari grijnst en richt zijn pistool...', counterDamage: 25, counterText: 'Vasari voorspelde je ontwijking en schiet precies daar!' },
    { phase: 1, action: 'heavy', tell: '📞 Vasari grijpt naar zijn telefoon...', counterDamage: 40, counterText: 'Vasari riep versterking terwijl jij je zware aanval opbouwde!' },
  ],
  boss_carmela: [
    { phase: 1, action: 'attack', tell: '🐺 De wolven cirkelen om je heen...', counterDamage: 35, counterText: 'La Loba fluit — haar roedel valt aan tijdens je aanval!' },
  ],
  boss_decker: [
    { phase: 0, action: 'aggressive' as any, tell: '📋 Decker bestudeert je bewegingen...', counterDamage: 45, counterText: 'Decker had je aanvalspatroon al geanalyseerd!' },
    { phase: 1, action: 'heavy', tell: '🚨 Je hoort sirenes naderen...', counterDamage: 50, counterText: 'Elite-eenheid overvalt je tijdens je zware aanval!' },
  ],
  boss_architect: [
    { phase: 0, action: 'heavy', tell: '🧠 De Architect lijkt je gedachten te lezen...', counterDamage: 40, counterText: 'De Architect voorspelde je zware aanval!' },
    { phase: 1, action: 'attack', tell: '⚙️ Je hoort mechanismen klikken onder je voeten...', counterDamage: 50, counterText: 'Vallen activeren wanneer je aanvalt!' },
    { phase: 2, action: 'dodge', tell: '💥 De muren beginnen te barsten...', counterDamage: 60, counterText: 'De Architect laat het plafond instorten — ontwijken onmogelijk!' },
  ],
  boss_oracle: [
    { phase: 0, action: 'attack', tell: '🧠 Het Orakel sluit haar ogen en glimlacht...', counterDamage: 45, counterText: 'Het Orakel las je aanval en countert met psychische energie!' },
    { phase: 1, action: 'heavy', tell: '🎭 Schaduwfiguren verschijnen om je heen...', counterDamage: 55, counterText: 'De marionetten blokkeren je zware aanval!' },
  ],
  boss_phoenix: [
    { phase: 1, action: 'defend', tell: '🔥 De vlammen laaien hoger op...', counterDamage: 50, counterText: 'De Feniks ontbrandt — je schild smelt!' },
    { phase: 2, action: 'attack', tell: '🔄 De Feniks gloeit intens...', counterDamage: 40, counterText: 'De Feniks absorbeert je aanval en herstelt HP!' },
  ],
  boss_noxhaven: [
    { phase: 0, action: 'heavy', tell: '💭 De stemmen fluisteren waarschuwingen...', counterDamage: 50, counterText: 'De Ziel voorspelt je zware aanval en slaat terug!' },
    { phase: 2, action: 'attack', tell: '🏙️ De stad zelf lijkt te trillen...', counterDamage: 70, counterText: 'Noxhaven vecht terug — de hele stad is je vijand!' },
    { phase: 3, action: 'dodge', tell: '💀 Een koude wind omhult je...', counterDamage: 80, counterText: 'De Eeuwige Vloek treft je — ontwijken is zinloos!' },
  ],
};

// ========== BONUS OBJECTIVES ==========

const MISSION_BONUS_OBJECTIVES: Record<string, BonusObjective[]> = {
  ch1_m1: [{ id: 'ch1_m1_stealth', description: 'Voltooi zonder agressief', check: 'no_aggressive', rewardLabel: '+2000 geld' }],
  ch1_m2: [{ id: 'ch1_m2_morale', description: 'Eindig met 70%+ moreel', check: 'high_morale', rewardLabel: '+50 XP' }],
  ch1_m3: [
    { id: 'ch1_m3_stealth', description: 'Alle encounters stealth', check: 'all_stealth', rewardLabel: '+5000 geld' },
    { id: 'ch1_m3_speed', description: 'Voltooi in minder dan 30 sec', check: 'speed_run', rewardLabel: '+100 XP' },
  ],
  ch2_m1: [{ id: 'ch2_m1_morale', description: 'Eindig met 80%+ moreel', check: 'high_morale', rewardLabel: '+3000 geld' }],
  ch2_m2: [{ id: 'ch2_m2_stealth', description: 'Geen agressieve keuzes', check: 'no_aggressive', rewardLabel: '+100 XP' }],
  ch2_m3: [{ id: 'ch2_m3_secret', description: 'Vind het geheime bewijs', check: 'find_secret', rewardLabel: '+8000 geld' }],
  ch2_m4: [{ id: 'ch2_m4_nodmg', description: 'Geen schade ontvangen', check: 'no_damage', rewardLabel: '+200 XP' }],
  ch3_m1: [{ id: 'ch3_m1_morale', description: 'Moreel boven 70%', check: 'high_morale', rewardLabel: '+5000 geld' }],
  ch3_m2: [{ id: 'ch3_m2_stealth', description: 'Alle encounters stealth', check: 'all_stealth', rewardLabel: '+10000 geld' }],
  ch3_m3: [{ id: 'ch3_m3_speed', description: 'Speedrun voltooiing', check: 'speed_run', rewardLabel: '+300 XP' }],
  ch3_m4: [{ id: 'ch3_m4_noagg', description: 'Zonder agressie', check: 'no_aggressive', rewardLabel: '+12000 geld' }],
  ch4_m1: [{ id: 'ch4_m1_morale', description: 'Hoog moreel behouden', check: 'high_morale', rewardLabel: '+10000 geld' }],
  ch4_m2: [{ id: 'ch4_m2_stealth', description: 'Stealth voltooiing', check: 'all_stealth', rewardLabel: '+500 XP' }],
  ch4_m3: [{ id: 'ch4_m3_nodmg', description: 'Zonder schade', check: 'no_damage', rewardLabel: '+20000 geld' }],
  ch5_m1: [{ id: 'ch5_m1_stealth', description: 'Volledige stealth', check: 'all_stealth', rewardLabel: '+800 XP' }],
  ch5_m2: [{ id: 'ch5_m2_morale', description: '90%+ moreel', check: 'high_morale', rewardLabel: '+50000 geld' }],
};

function checkBonusObjective(obj: BonusObjective, mission: ActiveCampaignMission): boolean {
  switch (obj.check) {
    case 'no_aggressive': return !mission.choices.includes('aggressive');
    case 'all_stealth': return mission.choices.every(c => c === 'stealth');
    case 'high_morale': return mission.morale >= 70;
    case 'no_damage': return mission.hpLost === 0;
    case 'speed_run': return true; // checked externally
    case 'find_secret': return Math.random() < 0.3; // luck-based
    default: return false;
  }
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
        icon: '🕵️', energyCost: 3, minLevel: 1, encounters: 2, difficultyRating: 1,
        rewards: { money: [2000, 5000], rep: 15, xp: 80 },
        weaponDropChance: 0.3, weaponRarityFloor: 'common',
        narrativeText: ['Een koude wind waait door de steegjes van Port Nero...', 'De informant treft je in een verlaten pakhuis.'],
        bonusObjectives: MISSION_BONUS_OBJECTIVES['ch1_m1'],
      },
      {
        id: 'ch1_m2', title: 'Het Spoor', description: 'Volg de aanwijzingen naar een geheim laboratorium.',
        icon: '🔍', energyCost: 4, minLevel: 2, encounters: 3, difficultyRating: 1,
        rewards: { money: [4000, 8000], rep: 20, xp: 120 },
        weaponDropChance: 0.4, weaponRarityFloor: 'common',
        narrativeText: ['De aanwijzingen leiden je naar Iron Borough...', 'Een verlaten fabriek, maar niet zo verlaten als het lijkt.'],
        bonusObjectives: MISSION_BONUS_OBJECTIVES['ch1_m2'],
      },
      {
        id: 'ch1_m3', title: 'De Confrontatie', description: 'Infiltreer het netwerk en vind de leider.',
        icon: '💥', energyCost: 5, minLevel: 3, encounters: 4, difficultyRating: 2,
        rewards: { money: [6000, 12000], rep: 30, xp: 180 },
        weaponDropChance: 0.5, weaponRarityFloor: 'uncommon',
        narrativeText: ['Het moment van de waarheid is aangebroken...', 'De leider wacht op je in de kelder.'],
        bonusObjectives: MISSION_BONUS_OBJECTIVES['ch1_m3'],
      },
    ],
    boss: {
      id: 'boss_viktor', name: 'Viktor "De Slager" Kozlov', title: 'Onderwerelds Slachter',
      icon: '🪓', portrait: '🪓',
      hp: 200, damage: 18, armor: 8, speed: 5,
      phases: [
        { hpThreshold: 100, name: 'Koelbloedig', attackBonus: 0, specialAttack: { name: 'Bijlzwaai', icon: '🪓', damage: 25, effect: 'Zware slag die armor negeert', chance: 0.25 } },
        {
          hpThreshold: 50, name: 'Razernij', attackBonus: 8,
          specialAttack: { name: 'Executie', icon: '💀', damage: 40, effect: 'Dodelijke combo — kan stunnen', chance: 0.3 },
          debuff: { type: 'weaken', name: 'Verzwakt', icon: '💔', turns: 2, effect: '-20% schade', chance: 0.3 },
        },
      ],
      lootTable: [
        { type: 'weapon', chance: 1.0, minRarity: 'rare' },
        { type: 'money', chance: 1.0, money: 15000 },
        { type: 'accessory', chance: 0.3, accessoryName: "Kozlov's Slagersmes", accessoryIcon: '🔪', accessoryEffect: '+5% crit schade' },
      ],
      counters: BOSS_COUNTERS['boss_viktor'],
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
        icon: '🎭', energyCost: 4, minLevel: 5, encounters: 3, difficultyRating: 2,
        rewards: { money: [5000, 10000], rep: 25, xp: 150 },
        weaponDropChance: 0.4, weaponRarityFloor: 'uncommon',
        narrativeText: ['Een uitnodiging voor een exclusief pokertoernooi...', 'De perfecte dekmantel om binnen te komen.'],
        bonusObjectives: MISSION_BONUS_OBJECTIVES['ch2_m1'],
      },
      {
        id: 'ch2_m2', title: 'Dubbelspel', description: 'Speel beide kanten tegen elkaar uit.',
        icon: '🃏', energyCost: 5, minLevel: 6, encounters: 3, difficultyRating: 2,
        rewards: { money: [8000, 15000], rep: 30, xp: 200 },
        weaponDropChance: 0.45, weaponRarityFloor: 'uncommon',
        narrativeText: ['Het Syndicaat vertrouwt je — maar hoelang nog?', 'Een gevaarlijk spel van loyaliteit en verraad.'],
        bonusObjectives: MISSION_BONUS_OBJECTIVES['ch2_m2'],
      },
      {
        id: 'ch2_m3', title: 'Het Verraad', description: 'Ontmasker de verrader binnen je eigen kring.',
        icon: '🗡️', energyCost: 5, minLevel: 7, encounters: 4, difficultyRating: 3,
        rewards: { money: [10000, 18000], rep: 35, xp: 250 },
        weaponDropChance: 0.5, weaponRarityFloor: 'rare',
        narrativeText: ['Iemand dicht bij je werkt voor de vijand...', 'De waarheid komt altijd boven water.'],
        bonusObjectives: MISSION_BONUS_OBJECTIVES['ch2_m3'],
      },
      {
        id: 'ch2_m4', title: 'De Ontmanteling', description: 'Vernietig de financiële basis van het Syndicaat.',
        icon: '💣', energyCost: 6, minLevel: 8, encounters: 5, difficultyRating: 3,
        rewards: { money: [12000, 22000], rep: 40, xp: 300 },
        weaponDropChance: 0.55, weaponRarityFloor: 'rare',
        narrativeText: ['Tijd om het Syndicaat waar het pijn doet te raken...', 'Hun geldstromen zijn hun zwakste punt.'],
        bonusObjectives: MISSION_BONUS_OBJECTIVES['ch2_m4'],
      },
    ],
    boss: {
      id: 'boss_vasari', name: 'Don Vasari', title: 'Syndicaat Godfather',
      icon: '🎩', portrait: '🎩',
      hp: 350, damage: 22, armor: 12, speed: 6,
      phases: [
        {
          hpThreshold: 100, name: 'Elegant', attackBonus: 0,
          specialAttack: { name: 'Vergulde Kogel', icon: '✨', damage: 30, effect: 'Precisie-schot dat armor doorboort', chance: 0.2 },
          debuff: { type: 'blind', name: 'Verblind', icon: '😵', turns: 1, effect: 'Aanvallen missen 50% vaker', chance: 0.2 },
        },
        { hpThreshold: 50, name: 'Wanhopig', attackBonus: 10, specialAttack: { name: 'Laatste Bevel', icon: '📞', damage: 45, effect: 'Roept versterking — extra schade', chance: 0.35 } },
      ],
      lootTable: [
        { type: 'weapon', chance: 1.0, minRarity: 'rare' },
        { type: 'money', chance: 1.0, money: 30000 },
        { type: 'accessory', chance: 0.4, accessoryName: "Vasari's Grip", accessoryIcon: '🧤', accessoryEffect: '+8% wapen accuracy' },
      ],
      exclusiveBrand: 'serpiente',
      counters: BOSS_COUNTERS['boss_vasari'],
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
        icon: '🤝', energyCost: 5, minLevel: 10, encounters: 4, difficultyRating: 2,
        rewards: { money: [10000, 20000], rep: 35, xp: 280 },
        weaponDropChance: 0.5, weaponRarityFloor: 'rare',
        narrativeText: ['Een voorstel dat je niet kunt weigeren...', 'Maar vertrouwen is een luxe in Noxhaven.'],
        bonusObjectives: MISSION_BONUS_OBJECTIVES['ch3_m1'],
      },
      {
        id: 'ch3_m2', title: 'De Familiefehde', description: 'Stop een oorlog tussen twee rivaliserende families.',
        icon: '🔥', energyCost: 6, minLevel: 11, encounters: 5, difficultyRating: 3,
        rewards: { money: [15000, 25000], rep: 40, xp: 350 },
        weaponDropChance: 0.55, weaponRarityFloor: 'rare',
        narrativeText: ['De straten kleuren rood...', 'Alleen jij kunt dit stoppen — of erger maken.'],
        bonusObjectives: MISSION_BONUS_OBJECTIVES['ch3_m2'],
      },
      {
        id: 'ch3_m3', title: 'Eer onder Dieven', description: 'Een onmogelijke heist om je waarde te bewijzen.',
        icon: '💎', energyCost: 6, minLevel: 12, encounters: 5, difficultyRating: 3,
        rewards: { money: [18000, 30000], rep: 45, xp: 400 },
        weaponDropChance: 0.6, weaponRarityFloor: 'rare',
        narrativeText: ['De kluis van de Centrale Bank...', 'Onmogelijk? Dat woord ken je niet.'],
        bonusObjectives: MISSION_BONUS_OBJECTIVES['ch3_m3'],
      },
      {
        id: 'ch3_m4', title: 'De Zuivering', description: 'Elimineer de verraders in je eigen organisatie.',
        icon: '🩸', energyCost: 7, minLevel: 13, encounters: 6, difficultyRating: 4,
        rewards: { money: [20000, 35000], rep: 50, xp: 450 },
        weaponDropChance: 0.65, weaponRarityFloor: 'rare',
        narrativeText: ['Verraad moet worden bestraft...', 'Maar wie kun je nog vertrouwen?'],
        bonusObjectives: MISSION_BONUS_OBJECTIVES['ch3_m4'],
      },
    ],
    boss: {
      id: 'boss_carmela', name: 'Carmela "La Loba" Reyes', title: 'Koningin van de Straat',
      icon: '🐺', portrait: '🐺',
      hp: 500, damage: 28, armor: 15, speed: 8,
      phases: [
        {
          hpThreshold: 100, name: 'Berekend', attackBonus: 0,
          specialAttack: { name: 'Wolfsbeet', icon: '🐺', damage: 35, effect: 'Snelle combo — moeilijk te ontwijken', chance: 0.3 },
          debuff: { type: 'slow', name: 'Vertraagd', icon: '🐌', turns: 2, effect: 'Ontwijkkans -30%', chance: 0.25 },
        },
        { hpThreshold: 50, name: 'Losgeslagen', attackBonus: 12, specialAttack: { name: 'Roedel Aanval', icon: '🐺🐺', damage: 55, effect: 'Meervoudige aanval met wolfsbende', chance: 0.35 } },
      ],
      lootTable: [
        { type: 'weapon', chance: 1.0, minRarity: 'epic' },
        { type: 'money', chance: 1.0, money: 50000 },
        { type: 'accessory', chance: 0.45, accessoryName: "La Loba's Ketting", accessoryIcon: '🐺', accessoryEffect: '+5% dodge kans' },
      ],
      exclusiveBrand: 'drakon',
      counters: BOSS_COUNTERS['boss_carmela'],
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
        icon: '🏛️', energyCost: 7, minLevel: 15, encounters: 5, difficultyRating: 3,
        rewards: { money: [20000, 40000], rep: 50, xp: 500 },
        weaponDropChance: 0.6, weaponRarityFloor: 'rare',
        narrativeText: ['Democratie is slechts een instrument...', 'En jij bent de meester-manipulator.'],
        bonusObjectives: MISSION_BONUS_OBJECTIVES['ch4_m1'],
      },
      {
        id: 'ch4_m2', title: 'De Coup', description: 'Neem het stadhuis over — met geweld of diplomatie.',
        icon: '⚡', energyCost: 8, minLevel: 16, encounters: 6, difficultyRating: 4,
        rewards: { money: [30000, 50000], rep: 60, xp: 600 },
        weaponDropChance: 0.65, weaponRarityFloor: 'epic',
        narrativeText: ['Het is tijd. De stad zal van jou zijn.', 'Maar tegen welke prijs?'],
        bonusObjectives: MISSION_BONUS_OBJECTIVES['ch4_m2'],
      },
      {
        id: 'ch4_m3', title: 'Het Laatste Verzet', description: 'Vernietig de laatste oppositie.',
        icon: '🔥', energyCost: 8, minLevel: 17, encounters: 7, difficultyRating: 4,
        rewards: { money: [35000, 60000], rep: 70, xp: 700 },
        weaponDropChance: 0.7, weaponRarityFloor: 'epic',
        narrativeText: ['Ze geven niet op. Maar jij ook niet.', 'De straten van Noxhaven beven.'],
        bonusObjectives: MISSION_BONUS_OBJECTIVES['ch4_m3'],
      },
    ],
    boss: {
      id: 'boss_decker', name: 'Commissaris Decker', title: 'De Corrupte Arm der Wet',
      icon: '🛡️', portrait: '🛡️',
      hp: 700, damage: 35, armor: 20, speed: 7,
      phases: [
        {
          hpThreshold: 100, name: 'Autoriteit', attackBonus: 0,
          specialAttack: { name: 'Arrestatiebevel', icon: '📋', damage: 40, effect: 'Stuurt elite-eenheid — vermindert snelheid', chance: 0.25 },
          debuff: { type: 'slow', name: 'In de tang', icon: '⛓️', turns: 2, effect: 'Ontwijkkans -30%', chance: 0.2 },
        },
        {
          hpThreshold: 50, name: 'Desperaat', attackBonus: 15,
          specialAttack: { name: 'Noodverordening', icon: '🚨', damage: 65, effect: 'Volledige politie-inzet — massale schade', chance: 0.3 },
          debuff: { type: 'weaken', name: 'Onder druk', icon: '😰', turns: 3, effect: '-25% schade', chance: 0.3 },
        },
      ],
      lootTable: [
        { type: 'weapon', chance: 1.0, minRarity: 'epic' },
        { type: 'money', chance: 1.0, money: 75000 },
        { type: 'accessory', chance: 0.5, accessoryName: "Decker's Badge", accessoryIcon: '🛡️', accessoryEffect: '-10% heat per gevecht' },
      ],
      exclusiveBrand: 'phantom',
      counters: BOSS_COUNTERS['boss_decker'],
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
        icon: '🎭', energyCost: 8, minLevel: 20, encounters: 6, difficultyRating: 4,
        rewards: { money: [40000, 70000], rep: 80, xp: 800 },
        weaponDropChance: 0.7, weaponRarityFloor: 'epic',
        narrativeText: ['Alle puzzelstukjes vallen op hun plaats...', 'De waarheid is schokkender dan je dacht.'],
        bonusObjectives: MISSION_BONUS_OBJECTIVES['ch5_m1'],
      },
      {
        id: 'ch5_m2', title: 'De Belegering', description: 'Bestorm het fort van De Architect.',
        icon: '🏰', energyCost: 10, minLevel: 22, encounters: 8, difficultyRating: 5,
        rewards: { money: [50000, 90000], rep: 100, xp: 1000 },
        weaponDropChance: 0.8, weaponRarityFloor: 'epic',
        narrativeText: ['Het fort op de klif boven Noxhaven...', 'De laatste barrière tussen jou en totale macht.'],
        bonusObjectives: MISSION_BONUS_OBJECTIVES['ch5_m2'],
      },
    ],
    boss: {
      id: 'boss_architect', name: 'De Architect', title: 'Meester van Noxhaven',
      icon: '🏛️', portrait: '🏛️',
      hp: 1000, damage: 45, armor: 25, speed: 9,
      phases: [
        {
          hpThreshold: 100, name: 'Controle', attackBonus: 0,
          specialAttack: { name: 'Meesterplan', icon: '🧠', damage: 50, effect: 'Voorspelt je aanval — halveert volgende schade', chance: 0.3 },
          debuff: { type: 'blind', name: 'Misleid', icon: '🌀', turns: 1, effect: 'Aanvallen missen 40% vaker', chance: 0.25 },
        },
        {
          hpThreshold: 60, name: 'Chaos', attackBonus: 12,
          specialAttack: { name: 'Vallen Activeren', icon: '⚙️', damage: 60, effect: 'Verborgen vallen — kan niet ontwijken', chance: 0.35 },
          debuff: { type: 'poison', name: 'Gifgas', icon: '☠️', turns: 3, effect: '5% HP per beurt', chance: 0.3 },
        },
        { hpThreshold: 30, name: 'Wanhoop', attackBonus: 20, specialAttack: { name: 'Alles Vernietigen', icon: '💥', damage: 80, effect: 'Vernietigt het fort — massale AOE schade', chance: 0.4 } },
      ],
      lootTable: [
        { type: 'weapon', chance: 1.0, minRarity: 'legendary' },
        { type: 'money', chance: 1.0, money: 150000 },
        { type: 'accessory', chance: 0.6, accessoryName: "Architect's Signet", accessoryIcon: '💍', accessoryEffect: '+10% alle stats' },
      ],
      counters: BOSS_COUNTERS['boss_architect'],
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
        icon: '📡', energyCost: 9, minLevel: 25, encounters: 6, difficultyRating: 4,
        rewards: { money: [50000, 80000], rep: 90, xp: 900 },
        weaponDropChance: 0.7, weaponRarityFloor: 'epic',
        narrativeText: ['Een versleuteld signaal op een vergeten frequentie...', 'De bron bevindt zich diep onder Iron Borough.'],
      },
      {
        id: 'ch6_m2', title: 'Ondergrondse Stad', description: 'Ontdek een verborgen stad onder Noxhaven.',
        icon: '🏚️', energyCost: 10, minLevel: 26, encounters: 7, difficultyRating: 4,
        rewards: { money: [60000, 100000], rep: 100, xp: 1000 },
        weaponDropChance: 0.75, weaponRarityFloor: 'epic',
        narrativeText: ['Onder de straten van Noxhaven ligt een tweede stad...', 'Hier wonen degenen die de wereld boven besturen.'],
      },
      {
        id: 'ch6_m3', title: 'De Raad der Schaduwen', description: 'Infiltreer de geheime raad die Noxhaven bestuurt.',
        icon: '🎭', energyCost: 10, minLevel: 27, encounters: 7, difficultyRating: 5,
        rewards: { money: [70000, 120000], rep: 110, xp: 1100 },
        weaponDropChance: 0.8, weaponRarityFloor: 'epic',
        narrativeText: ['Twaalf maskers. Twaalf stemmen. Eén oordeel.', 'Ze wisten dat je zou komen. Ze hebben erop gerekend.'],
      },
      {
        id: 'ch6_m4', title: 'Protocol Omega', description: 'Voorkom de activering van een stadsbrede lockdown.',
        icon: '⚠️', energyCost: 12, minLevel: 28, encounters: 8, difficultyRating: 5,
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
        {
          hpThreshold: 100, name: 'Alwetend', attackBonus: 0,
          specialAttack: { name: 'Gedachtenlezen', icon: '🧠', damage: 55, effect: 'Voorspelt je aanval — counter voor dubbele schade', chance: 0.3 },
          debuff: { type: 'blind', name: 'Mentale Mist', icon: '🌫️', turns: 2, effect: 'Aanvallen missen 40% vaker', chance: 0.25 },
        },
        {
          hpThreshold: 60, name: 'Manipulatie', attackBonus: 15,
          specialAttack: { name: 'Schaduw Marionetten', icon: '🎭', damage: 65, effect: 'Stuurt schaduwklonen — kan niet onderscheiden', chance: 0.35 },
        },
        {
          hpThreshold: 25, name: 'Ontrafeling', attackBonus: 25,
          specialAttack: { name: 'Psychische Storm', icon: '🌀', damage: 90, effect: 'Overweldigende mentale aanval — negeert armor', chance: 0.4 },
          debuff: { type: 'poison', name: 'Psychose', icon: '🤯', turns: 3, effect: '8% HP per beurt', chance: 0.35 },
        },
      ],
      lootTable: [
        { type: 'weapon', chance: 1.0, minRarity: 'legendary' },
        { type: 'money', chance: 1.0, money: 200000 },
        { type: 'accessory', chance: 0.55, accessoryName: "Orakel's Oog", accessoryIcon: '👁️', accessoryEffect: '+15% dodge, vijandelijke aanvallen zichtbaar' },
      ],
      counters: BOSS_COUNTERS['boss_oracle'],
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
    description: 'Noxhaven staat in brand — letterlijk en figuurlijk. Een burgeroorlog verscheurt de stad. Kies een kant, of heers over de as.',
    minLevel: 30,
    missions: [
      {
        id: 'ch7_m1', title: 'De Vonk', description: 'Onderzoek wie de burgeroorlog heeft ontketend.',
        icon: '🕯️', energyCost: 10, minLevel: 30, encounters: 7, difficultyRating: 4,
        rewards: { money: [80000, 130000], rep: 120, xp: 1200 },
        weaponDropChance: 0.8, weaponRarityFloor: 'epic',
        narrativeText: ['De explosie in Crown Heights was geen ongeluk...', 'Iemand wíl dat Noxhaven brandt.'],
      },
      {
        id: 'ch7_m2', title: 'Geen Mans Land', description: 'Doorkruis de verwoeste districten.',
        icon: '🏗️', energyCost: 12, minLevel: 31, encounters: 8, difficultyRating: 5,
        rewards: { money: [100000, 160000], rep: 130, xp: 1400 },
        weaponDropChance: 0.85, weaponRarityFloor: 'epic',
        narrativeText: ['De straten zijn slagvelden geworden.', 'Tussen de ruïnes vind je onverwachte bondgenoten.'],
      },
      {
        id: 'ch7_m3', title: 'Het Wapenstilstandsverdrag', description: 'Smeed een onmogelijke alliantie.',
        icon: '🕊️', energyCost: 12, minLevel: 32, encounters: 8, difficultyRating: 5,
        rewards: { money: [120000, 180000], rep: 140, xp: 1500 },
        weaponDropChance: 0.85, weaponRarityFloor: 'legendary',
        narrativeText: ['Vrede of totale oorlog — de keuze is aan jou.', 'Maar elke keuze heeft een prijs.'],
      },
      {
        id: 'ch7_m4', title: 'De Wederopbouw', description: 'Neem de controle over de herbouw.',
        icon: '🏗️', energyCost: 14, minLevel: 33, encounters: 9, difficultyRating: 5,
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
        {
          hpThreshold: 100, name: 'Vuurstorm', attackBonus: 0,
          specialAttack: { name: 'Vuurzee', icon: '🔥', damage: 60, effect: 'Brandschade over meerdere beurten', chance: 0.3 },
          debuff: { type: 'poison', name: 'Brandwonden', icon: '🔥', turns: 3, effect: '3% HP per beurt', chance: 0.3 },
        },
        { hpThreshold: 60, name: 'Helse Woede', attackBonus: 18, specialAttack: { name: 'Nova Burst', icon: '💥', damage: 75, effect: 'Explosieve schokgolf — vermindert armor', chance: 0.35 } },
        {
          hpThreshold: 30, name: 'Wedergeboorte', attackBonus: 25,
          specialAttack: { name: 'Herrijzenis', icon: '🔄', damage: 50, effect: 'Geneest 15% HP', chance: 0.4 },
        },
      ],
      lootTable: [
        { type: 'weapon', chance: 1.0, minRarity: 'legendary' },
        { type: 'money', chance: 1.0, money: 250000 },
        { type: 'accessory', chance: 0.6, accessoryName: "Feniks Veer", accessoryIcon: '🪶', accessoryEffect: 'Eénmaal per gevecht: herleef met 25% HP' },
      ],
      counters: BOSS_COUNTERS['boss_phoenix'],
      dialogue: {
        intro: '"Ik heb deze stad in brand gestoken. Niet uit haat — uit liefde. Alleen vuur zuivert."',
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
    description: 'De laatste geheimen van Noxhaven worden onthuld. Diep onder de stad ligt de Kluis — een artefact dat de macht heeft om alles te veranderen.',
    minLevel: 35,
    missions: [
      {
        id: 'ch8_m1', title: 'De Sleutel', description: 'Vind de drie sleutelfragmenten.',
        icon: '🗝️', energyCost: 12, minLevel: 35, encounters: 8, difficultyRating: 5,
        rewards: { money: [120000, 200000], rep: 150, xp: 1500 },
        weaponDropChance: 0.85, weaponRarityFloor: 'legendary',
        narrativeText: ['Drie fragmenten. Drie bewakers. Drie keuzes.', 'De sleutel tot alles ligt verspreid over de stad.'],
      },
      {
        id: 'ch8_m2', title: 'De Afdaling', description: 'Daal af naar de diepste gewelven.',
        icon: '⬇️', energyCost: 14, minLevel: 36, encounters: 9, difficultyRating: 5,
        rewards: { money: [150000, 250000], rep: 170, xp: 1800 },
        weaponDropChance: 0.9, weaponRarityFloor: 'legendary',
        narrativeText: ['Elke verdieping dieper onthult een ouder geheim.', 'De muren fluisteren namen van vergeten koningen.'],
      },
      {
        id: 'ch8_m3', title: 'De Laatste Keuze', description: 'Maak je definitieve keuze bij de Kluis.',
        icon: '⚖️', energyCost: 15, minLevel: 38, encounters: 10, difficultyRating: 5,
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
        {
          hpThreshold: 100, name: 'Oordeel', attackBonus: 0,
          specialAttack: { name: 'Herinnering', icon: '💭', damage: 50, effect: 'Toont je grootste falen — vermindert aanval', chance: 0.25 },
          debuff: { type: 'weaken', name: 'Twijfel', icon: '💭', turns: 2, effect: '-20% schade', chance: 0.2 },
        },
        {
          hpThreshold: 70, name: 'Beproeving', attackBonus: 15,
          specialAttack: { name: 'Tijdverbuiging', icon: '⏳', damage: 70, effect: 'Vertraagt tijd — je snelheid halveert', chance: 0.3 },
          debuff: { type: 'slow', name: 'Tijdvertraging', icon: '⏳', turns: 3, effect: 'Snelheid -50%', chance: 0.3 },
        },
        { hpThreshold: 40, name: 'Transformatie', attackBonus: 22, specialAttack: { name: 'Stadsziel', icon: '🏙️', damage: 85, effect: 'De hele stad vecht tegen je', chance: 0.35 } },
        { hpThreshold: 15, name: 'Laatste Adem', attackBonus: 30, specialAttack: { name: 'Eeuwige Vloek', icon: '💀', damage: 100, effect: 'Alles of niets — kan instant doden', chance: 0.4 } },
      ],
      lootTable: [
        { type: 'weapon', chance: 1.0, minRarity: 'legendary' },
        { type: 'money', chance: 1.0, money: 500000 },
        { type: 'accessory', chance: 0.7, accessoryName: "Kroon van Noxhaven", accessoryIcon: '👑', accessoryEffect: '+15% alle stats, unieke titel' },
      ],
      counters: BOSS_COUNTERS['boss_noxhaven'],
      dialogue: {
        intro: '"Ik ben Noxhaven. Elke steen, elke straat, elke ziel die hier heeft geleefd — ik ben hun echo."',
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
      unlocked: i === 0,
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
    trophies: [],
    missionStreak: 0,
    totalEncountersCompleted: 0,
    pityCounter: 0,
    failCounts: {},
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
  if (playerLevel < mDef.minLevel) return false;
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
    cooldowns: { heavy: 0, dodge: 0 },
    rage: 0,
    rageMax: 100,
    defendBuff: 0,
    phaseJustChanged: false,
    debuffs: [],
    comboHistory: [],
    comboCounter: 0,
    itemsUsed: 0,
    itemsMax: 2,
    bossStunned: false,
    adrenalineActive: false,
    lastDamageDealt: 0,
    lastDamageTaken: 0,
    counterWarning: null,
  };
}

export function bossFightTurn(
  fight: ActiveBossFight,
  action: 'attack' | 'heavy' | 'defend' | 'dodge' | 'item',
  playerDamage: number,
  playerArmor: number,
  playerSpeed: number = 0,
  itemId?: string
): ActiveBossFight {
  const ch = getChapterDef(fight.chapterId)!;
  const boss = ch.boss;
  const diffMult = fight.difficulty === 'nightmare' ? 1.8 : fight.difficulty === 'hard' ? 1.4 : 1.0;
  const turn = fight.turn + 1;
  const log: BossFightLogEntry[] = [];
  let newCooldowns = { ...fight.cooldowns };
  let newRage = fight.rage;
  let newDefendBuff = Math.max(0, fight.defendBuff - 1);
  let newDebuffs = fight.debuffs.map(d => ({ ...d, turnsLeft: d.turnsLeft - 1 })).filter(d => d.turnsLeft > 0);
  let newBossStunned = fight.bossStunned;
  let newAdrenaline = fight.adrenalineActive;
  let newItemsUsed = fight.itemsUsed;
  let newComboHistory = [...fight.comboHistory];
  let newComboCounter = fight.comboCounter;
  let newPlayerHP = fight.playerHP;
  let lastDmgDealt = 0;
  let lastDmgTaken = 0;

  // Decrease cooldowns
  if (newCooldowns.heavy > 0) newCooldowns.heavy--;
  if (newCooldowns.dodge > 0) newCooldowns.dodge--;

  // Apply poison debuff
  const poisonDebuff = newDebuffs.find(d => d.type === 'poison');
  if (poisonDebuff) {
    const poisonDmg = Math.floor(fight.playerMaxHP * 0.05);
    newPlayerHP = Math.max(1, newPlayerHP - poisonDmg);
    log.push({ turn, text: `${poisonDebuff.icon} ${poisonDebuff.name}: ${poisonDmg} schade!`, type: 'debuff', icon: poisonDebuff.icon });
  }

  // Debuff effects on player
  const isWeakened = newDebuffs.some(d => d.type === 'weaken');
  const isBlinded = newDebuffs.some(d => d.type === 'blind');
  const isSlowed = newDebuffs.some(d => d.type === 'slow');
  const weakenMod = isWeakened ? 0.8 : 1.0;
  const blindMissMod = isBlinded ? 0.4 : 0;
  const slowDodgeMod = isSlowed ? -0.3 : 0;

  // ITEM ACTION
  if (action === 'item' && itemId) {
    newItemsUsed++;
    if (itemId === 'medkit') {
      const healAmt = Math.floor(fight.playerMaxHP * 0.25);
      newPlayerHP = Math.min(fight.playerMaxHP, newPlayerHP + healAmt);
      log.push({ turn, text: `💊 Medkit gebruikt! +${healAmt} HP hersteld`, type: 'item', icon: '💊' });
    } else if (itemId === 'flash') {
      newBossStunned = true;
      log.push({ turn, text: '💡 Flitsgranaat! Boss is verdoofd voor 1 beurt!', type: 'item', icon: '💡' });
    } else if (itemId === 'adrenaline') {
      newAdrenaline = true;
      log.push({ turn, text: '💉 Adrenaline! Dubbele schade volgende aanval!', type: 'item', icon: '💉' });
    }
    // Boss still attacks after item use (unless stunned)
  }

  // COMBAT ACTIONS
  let pDmg = 0;
  let pDefending = false;
  let pDodging = false;

  if (action !== 'item') {
    newComboHistory.push(action);
    if (newComboHistory.length > 4) newComboHistory = newComboHistory.slice(-4);

    // Check for counter
    const counters = boss.counters || [];
    const activeCounter = counters.find(c => c.phase === fight.currentPhase && c.action === action);
    if (activeCounter && Math.random() < 0.4) {
      const counterDmg = Math.floor(activeCounter.counterDamage * diffMult);
      log.push({ turn, text: `⚡ COUNTER! ${activeCounter.counterText}`, type: 'counter', icon: '⚡' });
      newPlayerHP = Math.max(0, newPlayerHP - counterDmg);
      lastDmgTaken += counterDmg;
      if (newPlayerHP <= 0) {
        log.push({ turn, text: boss.dialogue.playerDefeat, type: 'boss', icon: '💀' });
        return { ...fight, playerHP: 0, turn, log: [...fight.log, ...log], finished: true, won: false, cooldowns: newCooldowns, debuffs: newDebuffs, comboHistory: newComboHistory, comboCounter: newComboCounter, itemsUsed: newItemsUsed, bossStunned: false, adrenalineActive: false, lastDamageDealt: 0, lastDamageTaken: counterDmg, counterWarning: null, rage: newRage, defendBuff: newDefendBuff, phaseJustChanged: false };
      }
      // Countered attack does half damage
      pDmg = 0;
    }

    // Check blind miss
    if (isBlinded && (action === 'attack' || action === 'heavy') && Math.random() < blindMissMod) {
      log.push({ turn, text: '😵 Verblind! Je aanval mist!', type: 'debuff', icon: '😵' });
      pDmg = 0;
    } else if (action === 'attack') {
      const defendBonus = fight.defendBuff > 0 ? 1.1 : 1.0;
      const adrBonus = newAdrenaline ? 2.0 : 1.0;
      pDmg = Math.max(1, Math.floor(playerDamage * defendBonus * weakenMod * adrBonus) - Math.floor(boss.armor * 0.3));
      log.push({ turn, text: `Je valt aan voor ${pDmg} schade!${newAdrenaline ? ' 💉 ADRENALINE!' : ''}`, type: 'player', icon: '⚔️' });
      newRage += 5;
      if (newAdrenaline) newAdrenaline = false;
    } else if (action === 'heavy') {
      const adrBonus = newAdrenaline ? 2.0 : 1.0;
      pDmg = Math.max(1, Math.floor(playerDamage * 1.5 * weakenMod * adrBonus) - Math.floor(boss.armor * 0.2));
      const miss = Math.random() < 0.2;
      if (miss) {
        pDmg = 0;
        log.push({ turn, text: 'Je zware aanval mist!', type: 'player', icon: '💨' });
      } else {
        log.push({ turn, text: `Zware aanval! ${pDmg} schade!${newAdrenaline ? ' 💉 ADRENALINE!' : ''}`, type: 'player', icon: '💥' });
      }
      newCooldowns.heavy = 2;
      newRage += 10;
      if (newAdrenaline) newAdrenaline = false;
    } else if (action === 'dodge') {
      pDodging = true;
      newCooldowns.dodge = 3;
      log.push({ turn, text: 'Je maakt een ontwijkende beweging!', type: 'player', icon: '💨' });
      newRage += 3;
    } else if (action === 'defend') {
      pDefending = true;
      newDefendBuff = 2;
      // Defend clears debuffs
      if (newDebuffs.length > 0) {
        log.push({ turn, text: `🛡️ Verdediging cleant ${newDebuffs.length} debuff(s)!`, type: 'player', icon: '🛡️' });
        newDebuffs = [];
      }
      log.push({ turn, text: 'Je neemt een verdedigende houding aan. (+10% aanval volgende beurt)', type: 'player', icon: '🛡️' });
      newRage += 3;
    }

    // Check combo
    const combo = checkCombo(newComboHistory);
    if (combo && pDmg > 0) {
      const comboBonusDmg = Math.floor(pDmg * (combo.damageMultiplier - 1));
      pDmg += comboBonusDmg;
      newComboCounter++;
      log.push({ turn, text: `${combo.icon} COMBO: ${combo.name}! +${comboBonusDmg} bonus schade!`, type: 'combo', icon: combo.icon });
      newComboHistory = []; // Reset after combo
    }
  }

  lastDmgDealt = pDmg;
  let newBossHP = Math.max(0, fight.bossHP - pDmg);

  // Check phase transition
  const hpPercent = (newBossHP / fight.bossMaxHP) * 100;
  let currentPhase = fight.currentPhase;
  let phaseJustChanged = false;
  if (currentPhase < boss.phases.length - 1 && hpPercent <= boss.phases[currentPhase + 1].hpThreshold) {
    currentPhase++;
    phaseJustChanged = true;
    const phaseName = boss.phases[currentPhase].name;
    log.push({ turn, text: `⚠️ ${boss.name} gaat over in fase: ${phaseName}!`, type: 'phase', icon: '⚠️' });
    if (currentPhase === 1) {
      log.push({ turn, text: boss.dialogue.phase2, type: 'boss', icon: boss.icon });
    }
    newRage += 20;
  }

  // Boss dead?
  if (newBossHP <= 0) {
    log.push({ turn, text: boss.dialogue.defeat, type: 'boss', icon: '💀' });
    log.push({ turn, text: `${boss.name} is verslagen!`, type: 'info', icon: '🏆' });
    return { ...fight, bossHP: 0, playerHP: newPlayerHP, turn, currentPhase, log: [...fight.log, ...log], finished: true, won: true, cooldowns: newCooldowns, rage: 0, defendBuff: 0, phaseJustChanged: false, debuffs: [], comboHistory: newComboHistory, comboCounter: newComboCounter, itemsUsed: newItemsUsed, bossStunned: false, adrenalineActive: false, lastDamageDealt: lastDmgDealt, lastDamageTaken: lastDmgTaken, counterWarning: null };
  }

  // Counter warning for next turn
  let counterWarning: string | null = null;
  const nextCounters = (boss.counters || []).filter(c => c.phase === currentPhase);
  if (nextCounters.length > 0 && Math.random() < 0.5) {
    const hint = nextCounters[Math.floor(Math.random() * nextCounters.length)];
    counterWarning = hint.tell;
  }

  // Boss stunned? Skip boss attack
  if (newBossStunned) {
    log.push({ turn, text: `${boss.name} is verdoofd en kan niet aanvallen!`, type: 'info', icon: '💫' });
    newBossStunned = false;
    return { ...fight, bossHP: newBossHP, playerHP: newPlayerHP, turn, currentPhase, log: [...fight.log, ...log], cooldowns: newCooldowns, rage: Math.min(fight.rageMax, newRage), defendBuff: newDefendBuff, phaseJustChanged, debuffs: newDebuffs, comboHistory: newComboHistory, comboCounter: newComboCounter, itemsUsed: newItemsUsed, bossStunned: false, adrenalineActive: newAdrenaline, lastDamageDealt: lastDmgDealt, lastDamageTaken: 0, counterWarning };
  }

  // Boss rage super attack
  let rageAttack = false;
  if (newRage >= fight.rageMax) {
    newRage = 0;
    rageAttack = true;
    const rageDmg = Math.floor(boss.damage * 2.5 * diffMult);
    const finalRageDmg = pDefending ? Math.floor(rageDmg * 0.4) : pDodging ? 0 : Math.max(1, rageDmg - playerArmor);
    if (pDodging && Math.random() < 0.6 + (playerSpeed + slowDodgeMod * 100) * 0.005) {
      log.push({ turn, text: `${boss.name} ontketent RAZERNIJ! Maar je ontwijkt het!`, type: 'boss', icon: '🔥' });
    } else if (pDodging) {
      const partialDmg = Math.floor(finalRageDmg * 0.3);
      log.push({ turn, text: `${boss.name} ontketent RAZERNIJ! Je ontwijkt deels — ${partialDmg} schade!`, type: 'boss', icon: '🔥' });
      newPlayerHP = Math.max(0, newPlayerHP - partialDmg);
      lastDmgTaken += partialDmg;
    } else {
      log.push({ turn, text: `${boss.name} ontketent RAZERNIJ! ${finalRageDmg} schade!`, type: 'boss', icon: '🔥' });
      newPlayerHP = Math.max(0, newPlayerHP - finalRageDmg);
      lastDmgTaken += finalRageDmg;
    }
    if (newPlayerHP <= 0) {
      log.push({ turn, text: boss.dialogue.playerDefeat, type: 'boss', icon: '💀' });
      return { ...fight, playerHP: 0, bossHP: newBossHP, turn, currentPhase, log: [...fight.log, ...log], finished: true, won: false, cooldowns: newCooldowns, rage: 0, defendBuff: newDefendBuff, phaseJustChanged, debuffs: newDebuffs, comboHistory: newComboHistory, comboCounter: newComboCounter, itemsUsed: newItemsUsed, bossStunned: false, adrenalineActive: false, lastDamageDealt: lastDmgDealt, lastDamageTaken: lastDmgTaken, counterWarning: null };
    }
  }

  // Boss normal attacks
  if (!rageAttack) {
    const phase = boss.phases[currentPhase];
    const baseDmg = Math.floor((boss.damage + phase.attackBonus) * diffMult);
    let bDmg: number;
    const useSpecial = Math.random() < phase.specialAttack.chance;

    if (pDodging) {
      const dodgeChance = 0.55 + (playerSpeed + slowDodgeMod * 100) * 0.005;
      if (Math.random() < dodgeChance) {
        log.push({ turn, text: `Je ontwijkt de aanval van ${boss.name}!`, type: 'player', icon: '💨' });

        // Still check debuff application on dodge
        if (phase.debuff && Math.random() < phase.debuff.chance) {
          newDebuffs.push({ type: phase.debuff.type, name: phase.debuff.name, icon: phase.debuff.icon, turnsLeft: phase.debuff.turns, effect: phase.debuff.effect });
          log.push({ turn, text: `${phase.debuff.icon} ${phase.debuff.name} toegepast! ${phase.debuff.effect} (${phase.debuff.turns} beurten)`, type: 'debuff', icon: phase.debuff.icon });
        }

        return { ...fight, bossHP: newBossHP, playerHP: newPlayerHP, turn, currentPhase, log: [...fight.log, ...log], cooldowns: newCooldowns, rage: Math.min(fight.rageMax, newRage), defendBuff: newDefendBuff, phaseJustChanged, debuffs: newDebuffs, comboHistory: newComboHistory, comboCounter: newComboCounter, itemsUsed: newItemsUsed, bossStunned: false, adrenalineActive: newAdrenaline, lastDamageDealt: lastDmgDealt, lastDamageTaken: 0, counterWarning };
      }
      log.push({ turn, text: 'Ontwijking deels gelukt!', type: 'info', icon: '💫' });
    }

    if (useSpecial) {
      bDmg = Math.floor(phase.specialAttack.damage * diffMult);
      if (pDefending) bDmg = Math.floor(bDmg * 0.4);
      else if (pDodging) bDmg = Math.floor(bDmg * 0.4);
      else bDmg = Math.max(1, bDmg - playerArmor);
      log.push({ turn, text: `${boss.name} gebruikt ${phase.specialAttack.name}! ${bDmg} schade! ${phase.specialAttack.effect}`, type: 'boss', icon: phase.specialAttack.icon });
    } else {
      bDmg = pDefending ? Math.floor(baseDmg * 0.4) : pDodging ? Math.floor(baseDmg * 0.4) : Math.max(1, baseDmg - playerArmor);
      log.push({ turn, text: `${boss.name} valt aan voor ${bDmg} schade!`, type: 'boss', icon: '👊' });
    }

    lastDmgTaken += bDmg;
    newPlayerHP = Math.max(0, newPlayerHP - bDmg);

    // Apply debuff
    if (phase.debuff && Math.random() < phase.debuff.chance && !newDebuffs.some(d => d.type === phase.debuff!.type)) {
      newDebuffs.push({ type: phase.debuff.type, name: phase.debuff.name, icon: phase.debuff.icon, turnsLeft: phase.debuff.turns, effect: phase.debuff.effect });
      log.push({ turn, text: `${phase.debuff.icon} ${phase.debuff.name} toegepast! ${phase.debuff.effect} (${phase.debuff.turns} beurten)`, type: 'debuff', icon: phase.debuff.icon });
    }

    // Nightmare: boss heals 5% every 5 turns
    if (fight.difficulty === 'nightmare' && turn % 5 === 0) {
      const healAmt = Math.floor(fight.bossMaxHP * 0.05);
      newBossHP = Math.min(fight.bossMaxHP, newBossHP + healAmt);
      log.push({ turn, text: `🩸 ${boss.name} herstelt ${healAmt} HP! (Nachtmerrie)`, type: 'boss', icon: '🩸' });
    }

    if (newPlayerHP <= 0) {
      log.push({ turn, text: boss.dialogue.playerDefeat, type: 'boss', icon: '💀' });
      log.push({ turn, text: 'Je bent verslagen...', type: 'info', icon: '☠️' });
      return { ...fight, playerHP: 0, bossHP: newBossHP, turn, currentPhase, log: [...fight.log, ...log], finished: true, won: false, cooldowns: newCooldowns, rage: Math.min(fight.rageMax, newRage), defendBuff: newDefendBuff, phaseJustChanged, debuffs: newDebuffs, comboHistory: newComboHistory, comboCounter: newComboCounter, itemsUsed: newItemsUsed, bossStunned: false, adrenalineActive: false, lastDamageDealt: lastDmgDealt, lastDamageTaken: lastDmgTaken, counterWarning: null };
    }
  }

  return { ...fight, bossHP: newBossHP, playerHP: newPlayerHP, turn, currentPhase, log: [...fight.log, ...log], cooldowns: newCooldowns, rage: Math.min(fight.rageMax, newRage), defendBuff: newDefendBuff, phaseJustChanged, debuffs: newDebuffs, comboHistory: newComboHistory, comboCounter: newComboCounter, itemsUsed: newItemsUsed, bossStunned: newBossStunned, adrenalineActive: newAdrenaline, lastDamageDealt: lastDmgDealt, lastDamageTaken: lastDmgTaken, counterWarning };
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
      const minRarity = entry.minRarity || 'rare';
      // Boss kill milestones: 1st = epic, 3rd = legendary, 5th = exclusive
      const milestoneRarity: WeaponRarity = killCount >= 4 ? 'legendary' : killCount >= 2 ? 'legendary' : killCount >= 0 ? 'epic' : minRarity;
      const rarity: WeaponRarity = milestoneRarity > minRarity ? milestoneRarity : minRarity;
      weapon = generateWeapon(playerLevel, rarity);
    } else if (entry.type === 'money') {
      money = Math.floor((entry.money || 10000) * diffBonus);
    } else if (entry.type === 'accessory') {
      accessory = { name: entry.accessoryName!, icon: entry.accessoryIcon!, effect: entry.accessoryEffect! };
    }
  }

  if (Math.random() < 0.4 + ch.number * 0.05) {
    const gearType: GearType = Math.random() < 0.5 ? 'armor' : 'gadget';
    const minGearRarity = ch.number >= 4 ? 'epic' as const : ch.number >= 2 ? 'rare' as const : 'uncommon' as const;
    const gearRarityUpgrade = killCount > 0 && Math.random() < 0.15 * killCount;
    const gearRarity = gearRarityUpgrade ? 'legendary' as const : minGearRarity;
    gear = generateGear(playerLevel, gearType, gearRarity);
  }

  return { weapon, gear, money, accessory };
}

// ========== ENCOUNTER TYPE GENERATION ==========

function generateEncounterTypes(count: number): EncounterType[] {
  const types: EncounterType[] = [];
  for (let i = 0; i < count; i++) {
    if (i === 0) { types.push('combat'); continue; }
    if (i === count - 1) { types.push('combat'); continue; }
    const r = Math.random();
    if (r < 0.35) types.push('combat');
    else if (r < 0.48) types.push('trap');
    else if (r < 0.60) types.push('npc');
    else if (r < 0.72) types.push('exploration');
    else if (r < 0.82) types.push('timed');
    else if (r < 0.92) types.push('puzzle');
    else types.push('ambush');
  }
  return types;
}

export function startCampaignMission(chapterId: string, missionId: string): ActiveCampaignMission {
  const mDef = getMissionDef(missionId)!;
  const encounterTypes = generateEncounterTypes(mDef.encounters);
  return {
    chapterId,
    missionId,
    currentEncounter: 0,
    totalEncounters: mDef.encounters,
    encounterTypes,
    currentEncounterType: encounterTypes[0],
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
    choices: [],
    totalHeatGain: 0,
    hpLost: 0,
    rating: 1,
    morale: 50,
    lastRandomEvent: null,
    carryOver: { stealthCount: 0, aggressiveCount: 0, damageTaken: 0, bonusLootMod: 1.0, moraleBoosted: false },
    bonusObjectives: mDef.bonusObjectives || [],
    bonusObjectivesCompleted: [],
    hiddenEncounterTriggered: false,
    isHiddenEncounter: false,
    riskRewardPending: false,
  };
}

function calculateMissionRating(choices: EncounterChoice[], totalEncounters: number, success: boolean, morale: number): number {
  if (!success) return 1;
  const aggressiveCount = choices.filter(c => c === 'aggressive').length;
  const stealthCount = choices.filter(c => c === 'stealth').length;
  const moraleBonus = morale >= 70 ? 1 : 0;
  if (aggressiveCount >= Math.ceil(totalEncounters * 0.6)) return 3;
  if (stealthCount >= Math.ceil(totalEncounters * 0.8)) return 3;
  if (moraleBonus && (aggressiveCount >= 2 || stealthCount >= 2)) return 3;
  if (aggressiveCount >= 1 || stealthCount >= 1) return 2;
  return 1;
}

export function advanceCampaignMission(mission: ActiveCampaignMission, playerLevel: number, playerPower: number, choice: EncounterChoice = 'standard', adaptiveDifficultyMod: number = 0): ActiveCampaignMission {
  const mDef = getMissionDef(mission.missionId)!;
  const encounter = mission.currentEncounter + 1;
  const encType = mission.encounterTypes[mission.currentEncounter] || 'combat';

  const effectiveChoice = encType === 'ambush' && choice === 'stealth' ? 'standard' : choice;

  // Update carry-over
  const newCarryOver = { ...mission.carryOver };
  if (effectiveChoice === 'stealth') newCarryOver.stealthCount++;
  if (effectiveChoice === 'aggressive') newCarryOver.aggressiveCount++;

  // Morale effects + carry-over effects
  let newMorale = mission.morale;
  if (effectiveChoice === 'stealth') newMorale = Math.min(100, newMorale + 8);
  else if (effectiveChoice === 'aggressive') newMorale = Math.max(0, newMorale - 5);
  else newMorale = Math.min(100, newMorale + 2);

  // Carry-over bonus: stealth in early encounters = easier later encounters
  const carryOverBonus = newCarryOver.stealthCount * 0.03 - newCarryOver.aggressiveCount * 0.02;

  const choiceMods = {
    stealth: { successMod: 0.15, lootMod: 0.7, heatMod: 0 },
    standard: { successMod: 0, lootMod: 1.0, heatMod: 2 },
    aggressive: { successMod: -0.1, lootMod: 1.5, heatMod: 5 },
  }[effectiveChoice];

  const moraleMod = newMorale >= 70 ? 0.1 : newMorale <= 30 ? -0.1 : 0;
  const difficulty = 40 + encounter * 10 + playerLevel * 2;
  const roll = Math.random() * 100 + playerPower * 0.5 + (choiceMods.successMod + moraleMod + carryOverBonus + adaptiveDifficultyMod) * 100;

  const typeModMap: Record<EncounterType, number> = {
    combat: 1.0, trap: 0.8, npc: 0.7, exploration: 0.6,
    timed: 0.9, puzzle: 0.75, ambush: 1.1,
  };
  const typeMod = typeModMap[encType] || 1.0;
  const success = roll > difficulty * 0.6 * typeMod;

  const log = [...mission.log];
  const narrative = getEncounterNarrative(encType, effectiveChoice);

  const typeLabels: Record<EncounterType, string> = {
    combat: '⚔️ Gevecht', trap: '🪤 Val', npc: '🗣️ Ontmoeting', exploration: '🔍 Verkenning',
    timed: '⏱️ Tijdsdruk', puzzle: '🧩 Puzzel', ambush: '💥 Hinderlaag',
  };
  const typeLabel = typeLabels[encType];

  const newChoices = [...mission.choices, effectiveChoice];
  let newHeatGain = mission.totalHeatGain + choiceMods.heatMod;

  // Random event (20% chance on success)
  let randomEvent: string | null = null;
  if (Math.random() < 0.2 && success) {
    const event = getRandomEvent();
    randomEvent = event.text;
    log.push(`🎲 ${event.text}`);
  }

  if (success) {
    log.push(`${typeLabel} ${encounter}/${mission.totalEncounters}: ${narrative}`);
  } else {
    log.push(`${typeLabel} ${encounter}/${mission.totalEncounters}: Mislukt! De missie is gefaald.`);
    return {
      ...mission, currentEncounter: encounter, log, finished: true, success: false,
      choices: newChoices, totalHeatGain: newHeatGain, rating: 1, morale: newMorale,
      lastRandomEvent: randomEvent, carryOver: newCarryOver,
    };
  }

  if (encounter >= mission.totalEncounters) {
    // Check for hidden encounter (15% chance)
    if (!mission.hiddenEncounterTriggered && Math.random() < 0.15) {
      log.push('🔮 Een verborgen doorgang opent zich... [Verborgen Encounter]');
      return {
        ...mission, currentEncounter: encounter - 1, log,
        choices: newChoices, totalHeatGain: newHeatGain, morale: newMorale,
        lastRandomEvent: randomEvent, carryOver: newCarryOver,
        hiddenEncounterTriggered: true, isHiddenEncounter: true,
        totalEncounters: mission.totalEncounters + 1,
        encounterTypes: [...mission.encounterTypes, 'exploration'],
        currentEncounterType: 'exploration',
      };
    }

    let droppedWeapon: GeneratedWeapon | null = null;
    let droppedGear: GeneratedGear | null = null;
    const rating = calculateMissionRating(newChoices, mission.totalEncounters, true, newMorale);
    const dropBonus = rating === 3 ? 1.3 : rating === 2 ? 1.1 : 1.0;
    const lootMod = newCarryOver.bonusLootMod;
    if (Math.random() < mDef.weaponDropChance * dropBonus * lootMod) {
      droppedWeapon = generateWeapon(playerLevel, undefined, mDef.weaponRarityFloor === 'epic' ? 'epic' : mDef.weaponRarityFloor === 'rare' ? 'rare' : 'uncommon');
    }
    if (Math.random() < mDef.weaponDropChance * 0.6 * dropBonus * lootMod) {
      const gearType: GearType = Math.random() < 0.5 ? 'armor' : 'gadget';
      const gearRarity = mDef.weaponRarityFloor === 'epic' ? 'epic' as const : mDef.weaponRarityFloor === 'rare' ? 'rare' as const : 'uncommon' as const;
      droppedGear = generateGear(playerLevel, gearType, gearRarity);
    }
    if (mDef.narrativeText[1]) log.push(mDef.narrativeText[1]);
    log.push(`Missie voltooid! ${'⭐'.repeat(rating)} Rating!`);

    // Check bonus objectives
    const completedBonuses = mission.bonusObjectives
      .filter(obj => checkBonusObjective(obj, { ...mission, choices: newChoices, morale: newMorale }))
      .map(obj => obj.id);

    if (completedBonuses.length > 0) {
      log.push(`🎯 Bonus doelen voltooid: ${completedBonuses.length}/${mission.bonusObjectives.length}!`);
    }

    return {
      ...mission, currentEncounter: encounter, log, finished: true, success: true,
      droppedWeapon, droppedGear, choices: newChoices, totalHeatGain: newHeatGain,
      rating, morale: newMorale, lastRandomEvent: randomEvent, carryOver: newCarryOver,
      bonusObjectivesCompleted: completedBonuses,
    };
  }

  const nextType = mission.encounterTypes[encounter] || 'combat';
  return {
    ...mission, currentEncounter: encounter, currentEncounterType: nextType, log,
    choices: newChoices, totalHeatGain: newHeatGain, morale: newMorale,
    lastRandomEvent: randomEvent, carryOver: newCarryOver,
  };
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

// ========== DIFFICULTY HELPERS ==========

export function getDifficultySkullRating(missionLevel: number, playerLevel: number): number {
  const diff = missionLevel - playerLevel;
  if (diff >= 5) return 5;
  if (diff >= 3) return 4;
  if (diff >= 1) return 3;
  if (diff >= -2) return 2;
  return 1;
}

export function getAdaptiveDifficultyMod(failCounts: Record<string, number>, missionId: string): number {
  const fails = failCounts[missionId] || 0;
  return Math.min(0.3, fails * 0.1); // Max 30% easier
}
