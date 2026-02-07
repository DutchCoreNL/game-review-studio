export type DistrictId = 'port' | 'crown' | 'iron' | 'low' | 'neon';
export type GoodId = 'drugs' | 'weapons' | 'tech' | 'luxury' | 'meds';
export type FamilyId = 'cartel' | 'syndicate' | 'bikers';
export type CrewRole = 'Chauffeur' | 'Enforcer' | 'Hacker' | 'Smokkelaar';
export type StatId = 'muscle' | 'brains' | 'charm';
export type GearSlot = 'weapon' | 'armor' | 'gadget';
export type TradeMode = 'buy' | 'sell';
export type GameView = 'city' | 'trade' | 'ops' | 'empire' | 'profile';
export type CasinoGame = 'blackjack' | 'roulette' | 'slots' | 'highlow' | null;
export type CardSuit = 'spade' | 'heart' | 'diamond' | 'club';
export interface PlayingCard { rank: string; suit: CardSuit; }
export type FactionActionType = 'negotiate' | 'bribe' | 'intimidate' | 'sabotage' | 'gift' | 'intel';

// ========== NEW FEATURE TYPES ==========

export type WeatherType = 'clear' | 'rain' | 'fog' | 'heatwave' | 'storm';

export interface NemesisState {
  name: string;
  power: number;
  location: DistrictId;
  hp: number;
  maxHp: number;
  cooldown: number;
  defeated: number;
  lastAction: string;
}

export interface DistrictDefense {
  level: number;
  stationedCrew: number[];
  wallUpgrade: boolean;
  turretUpgrade: boolean;
}

export interface SmuggleRoute {
  id: string;
  from: DistrictId;
  to: DistrictId;
  good: GoodId;
  active: boolean;
  daysActive: number;
}

export interface PhoneMessage {
  id: string;
  from: string;
  avatar: string;
  text: string;
  day: number;
  read: boolean;
  type: 'info' | 'warning' | 'opportunity' | 'threat';
}

// ========== STORY & PERSONALITY TYPES ==========

export type PersonalityTrait = 'loyaal' | 'hebzuchtig' | 'rustig' | 'impulsief' | 'slim' | 'brutaal' | 'charmant' | 'paranoid';

export type ScreenEffectType = 'shake' | 'blood-flash' | 'gold-flash' | null;

export interface StreetEventResult {
  success: boolean;
  text: string;
}

// ========== EXISTING TYPES ==========

export interface District {
  name: string;
  cost: number;
  income: number;
  cx: number;
  cy: number;
  mods: Record<GoodId, number>;
  perk: string;
}

export interface Vehicle {
  id: string;
  name: string;
  cost: number;
  storage: number;
  speed: number;
  armor: number;
  charm: number;
  desc: string;
}

export interface Good {
  id: GoodId;
  name: string;
  base: number;
  icon: string;
  faction: FamilyId | null;
}

export interface Family {
  id: FamilyId;
  name: string;
  contact: string;
  desc: string;
  color: string;
  home: DistrictId;
}

export interface SoloOperation {
  id: string;
  name: string;
  level: number;
  stat: StatId;
  risk: number;
  heat: number;
  reward: number;
  desc: string;
}

export interface ContractTemplate {
  name: string;
  risk: number;
  heat: number;
  rewardBase: number;
  type: string;
}

export interface HQUpgrade {
  id: string;
  name: string;
  cost: number;
  desc: string;
}

export interface GearItem {
  id: string;
  type: GearSlot;
  name: string;
  cost: number;
  stats: Partial<Record<StatId, number>>;
  desc: string;
  reqRep: { f: FamilyId; val: number } | null;
}

export interface Business {
  id: string;
  name: string;
  cost: number;
  income: number;
  clean: number;
  desc: string;
}

export interface CrewMember {
  name: string;
  role: CrewRole;
  hp: number;
  xp: number;
  level: number;
  specialization: string | null;
}

export type VehicleUpgradeType = 'armor' | 'speed' | 'storage';

export interface VehicleUpgradeLevel {
  type: VehicleUpgradeType;
  level: number; // 0-3
}

export interface OwnedVehicle {
  id: string;
  condition: number;
  vehicleHeat: number;
  rekatCooldown: number;
  upgrades?: Partial<Record<VehicleUpgradeType, number>>; // level per upgrade type
}

export interface ActiveContract {
  id: number;
  name: string;
  type: string;
  employer: FamilyId;
  target: FamilyId;
  risk: number;
  heat: number;
  reward: number;
  xp: number;
}

export interface CombatState {
  idx: number;
  targetName: string;
  targetHP: number;
  enemyMaxHP: number;
  enemyAttack: number;
  playerHP: number;
  playerMaxHP: number;
  logs: string[];
  isBoss: boolean;
  familyId: FamilyId | null;
  stunned: boolean;
  turn: number;
  finished: boolean;
  won: boolean;
  isNemesis?: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  condition: (state: GameState) => boolean;
}

export interface PlayerState {
  level: number;
  xp: number;
  nextXp: number;
  skillPoints: number;
  stats: Record<StatId, number>;
  loadout: Record<GearSlot, string | null>;
}

export interface NightReportData {
  day: number;
  districtIncome: number;
  businessIncome: number;
  totalWashed: number;
  debtInterest: number;
  labYield: number;
  heatChange: number;
  vehicleHeatChange: number;
  personalHeatChange: number;
  policeRaid: boolean;
  policeFine: number;
  crewHealing: number;
  vehicleDecay: { id: string; amount: number }[];
  randomEvent: RandomEvent | null;
  // New feature fields
  weatherChange?: WeatherType;
  smuggleResults?: { routeId: string; good: GoodId; income: number; intercepted: boolean }[];
  defenseResults?: { district: DistrictId; attacked: boolean; won: boolean; details: string }[];
  nemesisAction?: string;
}

export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
  effect: string;
}

export interface GameStats {
  totalEarned: number;
  totalSpent: number;
  casinoWon: number;
  casinoLost: number;
  missionsCompleted: number;
  missionsFailed: number;
  tradesCompleted: number;
  daysPlayed: number;
  blackjackStreak: number;
  highLowMaxRound: number;
}

// ========== MISSION ENCOUNTER SYSTEM ==========

export interface MissionChoice {
  id: string;
  label: string;
  stat: StatId;
  difficulty: number;
  outcomes: { success: string; partial: string; fail: string };
  effects: { heat: number; relChange: number; crewDamage: number; bonusReward: number };
}

export interface MissionEncounter {
  id: string;
  text: string;
  districtVariants: Partial<Record<DistrictId, string>>;
  choices: MissionChoice[];
}

export interface ActiveMission {
  type: 'solo' | 'contract';
  missionId: string;
  contractId?: number;
  crewIndex?: number;
  crewName?: string;
  currentEncounter: number;
  encounters: MissionEncounter[];
  totalReward: number;
  totalHeat: number;
  totalCrewDamage: number;
  totalRelChange: Record<string, number>;
  log: string[];
  baseReward: number;
  baseHeat: number;
  finished: boolean;
  success: boolean;
}

export type MapEventType = 'police_checkpoint' | 'accident' | 'street_fight' | 'black_market' | 'drone' | 'ambulance';

export interface MapEvent {
  id: string;
  type: MapEventType;
  roadIndex: number;
  position: number;
  label: string;
}

export type EndgamePhase = 'straatdealer' | 'wijkbaas' | 'districtheerser' | 'onderwerelds_koning' | 'noxhaven_baas';

export type VictoryRank = 'S' | 'A' | 'B' | 'C' | 'D';

export interface VictoryData {
  day: number;
  rank: VictoryRank;
  score: number;
  totalEarned: number;
  totalSpent: number;
  missionsCompleted: number;
  missionsFailed: number;
  factionsConquered: number;
  nemesisDefeated: number;
  achievementsUnlocked: number;
  casinoWon: number;
  casinoLost: number;
  districtsOwned: number;
  crewSize: number;
  method: string; // how they won (combat, diplomacy, mix)
}

export interface GameState {
  day: number;
  money: number;
  dirtyMoney: number;
  debt: number;
  rep: number;
  heat: number;
  personalHeat: number;
  hidingDays: number;
  loc: DistrictId;
  player: PlayerState;
  inventory: Partial<Record<GoodId, number>>;
  inventoryCosts: Partial<Record<GoodId, number>>;
  maxInv: number;
  crew: CrewMember[];
  ownedDistricts: DistrictId[];
  ownedVehicles: OwnedVehicle[];
  activeVehicle: string;
  ownedBusinesses: string[];
  ownedGear: string[];
  hqUpgrades: string[];
  familyRel: Record<string, number>;
  policeRel: number;
  leadersDefeated: FamilyId[];
  prices: Record<string, Record<string, number>>;
  priceTrends: Record<string, string>;
  districtDemands: Record<string, GoodId | null>;
  activeContracts: ActiveContract[];
  lab: { chemicals: number };
  activeCombat: CombatState | null;
  activeMission: ActiveMission | null;
  achievements: string[];
  tutorialDone: boolean;
  lastLoginDay: string;
  dailyRewardClaimed: boolean;
  loginStreak: number;
  stats: GameStats;
  nightReport: NightReportData | null;
  priceHistory: Record<string, Record<string, number[]>>;
  washUsedToday: number;
  factionCooldowns: Record<string, string[]>;
  conqueredFactions: FamilyId[];
  mapEvents: MapEvent[];

  // ========== NEW FEATURE STATE ==========
  weather: WeatherType;
  districtRep: Record<DistrictId, number>;
  nemesis: NemesisState;
  districtDefenses: Record<DistrictId, DistrictDefense>;
  smuggleRoutes: SmuggleRoute[];
  phone: { messages: PhoneMessage[]; unread: number };
  showPhone: boolean;
  pendingSpecChoice: { crewIndex: number; level: number } | null;
  casinoJackpot: number;

  // ========== ENDGAME STATE ==========
  endgamePhase: EndgamePhase;
  victoryData: VictoryData | null;
  newGamePlusLevel: number;
  finalBossDefeated: boolean;
  freePlayMode: boolean;

  // ========== STORY & ANIMATION STATE ==========
  pendingStreetEvent: any | null;
  streetEventResult: StreetEventResult | null;
  screenEffect: ScreenEffectType;
  lastRewardAmount: number;
  crewPersonalities: Record<number, PersonalityTrait>;

  // ========== STORY ARCS STATE ==========
  activeStoryArcs: import('../game/storyArcs').ActiveStoryArc[];
  completedArcs: string[];
  pendingArcEvent: { arcId: string; stepIndex: number } | null;
  arcEventResult: { success: boolean; text: string } | null;
}
