export type DistrictId = 'port' | 'crown' | 'iron' | 'low' | 'neon';
export type GoodId = 'drugs' | 'weapons' | 'tech' | 'luxury' | 'meds';
export type FamilyId = 'cartel' | 'syndicate' | 'bikers';
export type CrewRole = 'Chauffeur' | 'Enforcer' | 'Hacker' | 'Smokkelaar';
export type StatId = 'muscle' | 'brains' | 'charm';
export type GearSlot = 'weapon' | 'armor' | 'gadget';
export type TradeMode = 'buy' | 'sell';
export type GameView = 'city' | 'assets' | 'business' | 'families' | 'ops' | 'casino' | 'profile';
export type CasinoGame = 'blackjack' | 'roulette' | 'slots' | null;

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
}

export interface OwnedVehicle {
  id: string;
  condition: number;
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
  policeRaid: boolean;
  policeFine: number;
  crewHealing: number;
  vehicleDecay: { id: string; amount: number }[];
  randomEvent: RandomEvent | null;
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
}

export interface GameState {
  day: number;
  money: number;
  dirtyMoney: number;
  debt: number;
  rep: number;
  heat: number;
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
  achievements: string[];
  tutorialDone: boolean;
  lastLoginDay: string;
  dailyRewardClaimed: boolean;
  loginStreak: number;
  stats: GameStats;
  nightReport: NightReportData | null;
}
