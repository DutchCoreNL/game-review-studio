export type DistrictId = 'port' | 'crown' | 'iron' | 'low' | 'neon';
export type GoodId = 'drugs' | 'weapons' | 'tech' | 'luxury' | 'meds';
export type FamilyId = 'cartel' | 'syndicate' | 'bikers';
export type CrewRole = 'Chauffeur' | 'Enforcer' | 'Hacker' | 'Smokkelaar';
export type StatId = 'muscle' | 'brains' | 'charm';
export type GearSlot = 'weapon' | 'armor' | 'gadget';
export type TradeMode = 'buy' | 'sell';
export type GameView = 'city' | 'trade' | 'ops' | 'empire' | 'profile' | 'admin';

// ========== VILLA TYPES ==========

export type VillaModuleId = 'kluis' | 'opslagkelder' | 'synthetica_lab' | 'wietplantage' | 'coke_lab' | 'crew_kwartieren' | 'wapenkamer' | 'commandocentrum' | 'helipad' | 'zwembad' | 'camera' | 'tunnel' | 'garage_uitbreiding' | 'server_room';

export interface VillaState {
  level: number; // 1-3
  modules: VillaModuleId[];
  prestigeModules: VillaModuleId[]; // golden prestige upgrades
  vaultMoney: number; // money stored safely
  storedGoods: Partial<Record<GoodId, number>>; // goods stored safely
  storedAmmo: number;
  helipadUsedToday: boolean;
  purchaseDay: number;
  lastPartyDay: number; // day when last party was thrown (cooldown)
}
export type CasinoGame = 'blackjack' | 'roulette' | 'slots' | 'highlow' | 'russian_roulette' | null;
export type CardSuit = 'spade' | 'heart' | 'diamond' | 'club';
export interface PlayingCard { rank: string; suit: CardSuit; }
export type FactionActionType = 'negotiate' | 'bribe' | 'intimidate' | 'sabotage' | 'gift' | 'intel';

// ========== FACTION CONQUEST PHASE TYPES ==========
export type ConquestPhase = 0 | 1 | 2 | 3; // 0=nothing, 1=outpost cleared, 2=defense broken, 3=boss accessible
export interface ConquestPhaseData {
  phase: ConquestPhase;
  lastPhaseDay: number; // day when last phase was completed (cooldown)
}

// ========== HITMAN SYSTEM TYPES ==========

export type HitTargetType = 'luitenant' | 'ambtenaar' | 'zakenman' | 'verrader' | 'vip';

export interface HitContract {
  id: string;
  targetName: string;
  targetType: HitTargetType;
  difficulty: number; // 0-100
  reward: number;
  repReward: number;
  heatGain: number;
  ammoCost: number; // 3-8
  factionEffect: { familyId: FamilyId; change: number } | null;
  district: DistrictId;
  desc: string;
  karmaEffect: number; // -5 to -15
  deadline: number; // day number when it expires
  xpReward: number;
}

export type AmmoType = '9mm' | '7.62mm' | 'shells';

export interface AmmoPack {
  id: string;
  name: string;
  amount: number;
  cost: number;
  icon: string;
}

// ========== NEW FEATURE TYPES ==========

export type WeatherType = 'clear' | 'rain' | 'fog' | 'heatwave' | 'storm';

// ========== SAFEHOUSE TYPES ==========

export type SafehouseUpgradeId = 'reinforced' | 'medbay' | 'vault' | 'garage' | 'comms';

export interface SafehouseUpgradeDef {
  id: SafehouseUpgradeId;
  name: string;
  cost: number;
  desc: string;
  icon: string;
}

export interface Safehouse {
  district: DistrictId;
  level: number; // 1-3
  upgrades: SafehouseUpgradeId[];
  purchaseDay: number;
}

// ========== CAR THEFT TYPES ==========

export type StolenCarRarity = 'common' | 'uncommon' | 'rare' | 'exotic';

export interface StealableCarDef {
  id: string;
  name: string;
  brand: string;
  rarity: StolenCarRarity;
  baseValue: number;
  stealDifficulty: number; // 0-100
  heatGain: number;
  districts: DistrictId[]; // where it can appear
  desc: string;
}

export type ChopShopUpgradeId = 'paint' | 'engine_tune' | 'interior' | 'bodykit' | 'nitro';

export interface ChopShopUpgrade {
  id: ChopShopUpgradeId;
  name: string;
  cost: number;
  valueBonus: number; // percentage increase
  desc: string;
}

export interface StolenCar {
  id: string;
  carTypeId: string;
  condition: number; // 0-100
  omgekat: boolean;
  upgrades: ChopShopUpgradeId[];
  stolenDay: number;
  stolenFrom: DistrictId;
  baseValue: number;
}

export interface CarOrder {
  id: string;
  carTypeId: string;
  clientName: string;
  bonusPercent: number; // extra % on top of value
  deadline: number; // day number
  desc: string;
}

export interface CarTheftEncounter {
  carTypeId: string;
  district: DistrictId;
}

export type NemesisArchetype = 'zakenman' | 'brute' | 'schaduw' | 'strateeg';

export interface NemesisState {
  name: string;
  power: number;
  location: DistrictId;
  hp: number;
  maxHp: number;
  cooldown: number;
  defeated: number;
  lastAction: string;
  // Successor system fields
  generation: number; // 1-5 (1 = original, 2+ = successors)
  alive: boolean;
  nextSpawnDay: number; // day when next successor appears
  defeatedNames: string[]; // names of defeated nemeses for flavor
  // Archetype & deep integration fields
  archetype: NemesisArchetype;
  claimedDistrict: DistrictId | null;
  alliedFaction: FamilyId | null;
  truceDaysLeft: number;
  lastReaction: string;
  negotiatedThisGen: boolean; // only 1x per generation
  scoutResult: string | null; // last scout intel, shown in night report
  // Rivaal Systeem 2.0 fields
  abilities: string[]; // unlocked abilities per generation
  revengeActive: string | null; // active revenge action type
  revengeDaysLeft: number; // days revenge is still active
  defeatChoice: 'execute' | 'exile' | 'recruit' | null; // last defeat choice
  tauntsShown: string[]; // which taunts already shown (no repeats)
  woundedRevengeUsed: boolean; // 1x revenge per combat cycle
  pendingDefeatChoice: boolean; // show defeat popup after combat
  informantArchetype: NemesisArchetype | null; // revealed archetype from recruit choice
}

export type DistrictHQUpgradeId = 'patrol' | 'walls' | 'surveillance' | 'turret' | 'command';

export interface DistrictHQUpgradeDef {
  id: DistrictHQUpgradeId;
  name: string;
  cost: number;
  defense: number;
  attackReduction: number; // percentage reduction of attack chance
  enablesSpionage: boolean;
  icon: string;
  desc: string;
}

export interface DistrictDefense {
  upgrades: DistrictHQUpgradeId[];
  fortLevel: number;
}

export type WarTactic = 'defend' | 'ambush' | 'negotiate';

export interface WarEvent {
  district: DistrictId;
  attackStrength: number;
  defenseLevel: number;
  attackerName: string;
}

export interface WarEventResult {
  won: boolean;
  tactic: WarTactic;
  loot: number;
  goodsLoot: { good: GoodId; amount: number } | null;
  details: string;
}

export interface SpionageIntel {
  district: DistrictId;
  attackChance: number; // predicted
  expiresDay: number;
}

export interface SabotageEffect {
  district: DistrictId;
  reductionPercent: number;
  expiresDay: number;
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

// ========== CORRUPTION NETWORK TYPES ==========

export type CorruptContactType = 'agent' | 'detective' | 'judge' | 'politician' | 'customs' | 'lawyer';

// ========== PRISON SYSTEM TYPES ==========

export interface PrisonEvent {
  id: string;
  title: string;
  desc: string;
  effect: 'brains_up' | 'muscle_up' | 'charm_up' | 'hp_loss' | 'rep_up' | 'day_reduce' | 'money_cost' | 'loyalty_up';
  value: number;
}

export interface PrisonState {
  daysRemaining: number;
  totalSentence: number;
  dayServed: number;
  moneyLost: number;
  dirtyMoneyLost: number;
  goodsLost: string[];
  escapeAttempted: boolean;
  events: PrisonEvent[];
}

export interface HospitalState {
  daysRemaining: number;
  totalDays: number;
  cost: number;
}

export interface CorruptContactDef {
  id: string;
  type: CorruptContactType;
  name: string;
  title: string;
  monthlyCost: number;
  recruitCost: number;
  betrayalRisk: number; // 0-100 base chance per month
  effects: {
    heatReduction?: number;
    raidProtection?: number; // percentage
    fineReduction?: number; // percentage
    tradeBonus?: number; // percentage
    intelBonus?: boolean;
    smuggleProtection?: number; // percentage
  };
  desc: string;
  icon: string;
  reqRep?: number;
  reqPoliceRel?: number;
}

export interface CorruptContact {
  id: string;
  contactDefId: string;
  recruitedDay: number;
  loyalty: number; // 0-100, higher = less likely to betray
  lastPaidDay: number;
  compromised: boolean; // true if they've been exposed
  active: boolean;
}

export interface CorruptionEvent {
  type: 'betrayal' | 'exposure' | 'demand' | 'bonus';
  contactId: string;
  text: string;
  effect: string;
}

// ========== DAILY CHALLENGES TYPES ==========

export type ChallengeCategory = 'trade' | 'combat' | 'empire' | 'social' | 'stealth' | 'wealth';

export interface DailyChallengeTemplate {
  id: string;
  name: string;
  desc: string;
  category: ChallengeCategory;
  icon: string;
  /** Function name to check progress — resolved at runtime */
  checkType: string;
  target: number;
  rewardMoney: number;
  rewardXp: number;
  rewardRep: number;
  bonusReward?: string; // special bonus description
  minDay: number; // minimum day to appear
  minLevel: number; // minimum player level
}

export interface ActiveChallenge {
  templateId: string;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  generatedDay: number;
}

// ========== NARRATIVE EXPANSION TYPES ==========

export type BackstoryId = 'weduwnaar' | 'bankier' | 'straatkind';
export type NpcId = 'rosa' | 'marco' | 'yilmaz' | 'luna' | 'krow';

export interface NpcRelation {
  value: number;
  met: boolean;
  lastInteractionDay: number;
  flags: string[];
}

export interface FlashbackData {
  title: string;
  lines: string[];
  icon: string;
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
  reqPrestige?: number; // minimum prestige level required
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

/** @deprecated HQ upgrades migrated to villa modules */
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
  reqPrestige?: number; // minimum prestige level required
  ammoType?: AmmoType | null; // null = melee, undefined = non-weapon
  clipSize?: number; // 0 = melee (unlimited)
}

export interface Business {
  id: string;
  name: string;
  cost: number;
  income: number;
  clean: number;
  desc: string;
  reqDistrict?: DistrictId;
  reqRep?: number;
  reqDay?: number;
  reqBusinessCount?: number;
}

export interface CrewMember {
  name: string;
  role: CrewRole;
  hp: number;
  xp: number;
  level: number;
  specialization: string | null;
  loyalty: number; // 0-100, below 20 = risk of defection
}

export type VehicleUpgradeType = 'armor' | 'speed' | 'storage';

// ========== RACING TYPES ==========
export type RaceType = 'street' | 'harbor' | 'neon_gp';

export interface RaceDef {
  id: RaceType;
  name: string;
  desc: string;
  minBet: number;
  maxBet: number;
  heatGain: number;
  reqDistrict?: DistrictId;
  reqDay?: number;
  icon: string;
}

export interface RaceNPC {
  name: string;
  vehicle: string;
  skill: number; // 1-10
}

// ========== UNIQUE VEHICLE TYPES ==========
export interface UniqueVehicle {
  id: string;
  name: string;
  storage: number;
  speed: number;
  armor: number;
  charm: number;
  desc: string;
  unlockCondition: string;
  unlockCheck: string; // key for runtime check
  icon: string;
}

// ========== DEALER TYPES ==========
export interface DealerDeal {
  vehicleId: string;
  discount: number; // 0.2 - 0.3
  expiresDay: number;
}

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
  bossPhase?: number; // 1 = SWAT, 2 = Decker
  conquestPhase?: 1 | 2; // faction conquest sub-boss phase
  // MMO combat skill/combo fields
  activeBuffs: CombatBuff[];
  skillCooldowns: Record<string, number>;
  comboCounter: number;
  lastAction: string | null;
}

// ========== COMBAT SKILL TYPES ==========

export interface CombatSkill {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlockLevel: number;
  cooldownTurns: number;
  energyCost: number;
  effect: CombatSkillEffect;
}

export interface CombatSkillEffect {
  type: 'damage' | 'buff' | 'heal_and_buff' | 'multi_hit' | 'crit' | 'stun' | 'execute' | 'emergency_heal';
  value?: number;
  bonus?: string;
  buffId?: string;
  duration?: number;
  healAmount?: number;
  hits?: number;
  damagePerHit?: number;
  multiplier?: number;
  chance?: number;
  stat?: string;
  thresholdPct?: number;
  bonusDamage?: number;
}

export interface CombatBuff {
  id: string;
  name: string;
  duration: number;
  effect: string;
}

// ========== PVP TURN-BASED COMBAT STATE ==========

export interface PvPCombatState {
  attackerId: string;
  attackerName: string;
  attackerHP: number;
  attackerMaxHP: number;
  attackerLevel: number;
  attackerStats: { muscle: number; brains: number; charm: number };
  attackerLoadout: Record<string, string | null>;
  attackerBuffs: CombatBuff[];
  attackerSkillCooldowns: Record<string, number>;
  attackerComboCounter: number;
  defenderId: string;
  defenderName: string;
  defenderHP: number;
  defenderMaxHP: number;
  defenderLevel: number;
  defenderStats: { muscle: number; brains: number; charm: number };
  defenderLoadout: Record<string, string | null>;
  defenderBuffs: CombatBuff[];
  defenderComboCounter: number;
  turn: number;
  logs: string[];
  finished: boolean;
  won: boolean;
  lastAction: string | null;
  damageDealt: number;
  damageTaken: number;
  skillsUsed: number;
  combosLanded: number;
}

export interface PvPPlayerInfo {
  userId: string;
  username: string;
  level: number;
  hp: number;
  maxHp: number;
  stats?: { muscle: number; brains: number; charm: number };
  loadout?: Record<string, string | null>;
  backstory?: string;
  rep?: number;
  isBot?: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  condition: (state: GameState) => boolean;
  /** Returns { current, target } for progress display. If omitted, achievement is binary (0% or 100%). */
  progress?: (state: GameState) => { current: number; target: number };
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
  imprisoned?: boolean;
  prisonSentence?: number;
  prisonMoneyLost?: number;
  prisonDirtyMoneyLost?: number;
  prisonGoodsLost?: string[];
  crewHealing: number;
  vehicleDecay: { id: string; amount: number }[];
  randomEvent: RandomEvent | null;
  // New feature fields
  weatherChange?: WeatherType;
  smuggleResults?: { routeId: string; good: GoodId; income: number; intercepted: boolean }[];
  defenseResults?: { district: DistrictId; attacked: boolean; won: boolean; details: string; loot?: number; goodsLoot?: { good: GoodId; amount: number } | null }[];
  nemesisAction?: string;
  nemesisReaction?: string;
  nemesisScoutResult?: string;
  nemesisPrisonRevenge?: string;
  // Prison daily status
  prisonDayServed?: number;
  prisonDaysRemaining?: number;
  prisonDailyEvent?: PrisonEvent;
  prisonCrewDeserted?: string[];
  prisonReleased?: boolean;
  // Hospital status
  hospitalDayServed?: number;
  hospitalDaysRemaining?: number;
  hospitalReleased?: boolean;
  hospitalCost?: number;
  prisonSummary?: {
    totalDaysServed: number;
    totalSentence: number;
    moneyLost: number;
    dirtyMoneyLost: number;
    goodsLost: string[];
    events: PrisonEvent[];
    crewDeserted: string[];
    escapeFailed: boolean;
  };
  ammoFactoryProduction?: number;
  ammoFactoryType?: AmmoType; // which type was produced
  // Villa production
  villaWietProduced?: number;
  villaCokeProduced?: number;
  villaLabProduced?: number;
  villaVaultProtected?: number; // shown only on arrest
  villaAttack?: { won: boolean; nemesisName: string; damage: string; stolenMoney?: number; moduleDamaged?: string; defenseScore?: number; attackPower?: number; defenseBreakdown?: { label: string; value: number; icon: string }[] };
  // Drug Empire night report
  drugEmpireDealerIncome?: number;
  drugEmpireDealerDetails?: { district: string; income: number; crewName: string }[];
  drugEmpireNoxCrystal?: number;
  drugEmpireRiskEvent?: { type: string; title: string; desc: string };
  // Crew loyalty
  crewDefections?: { name: string; reason: string }[];
  // Safehouse raids
  safehouseRaid?: { district: DistrictId; attackerName: string; won: boolean; details: string; loot?: number };
  // Market dynamics
  marketEvent?: { name: string; desc: string } | null;
  spoilage?: { good: string; lost: number }[];
  // Market alerts
  triggeredAlerts?: TriggeredMarketAlert[];
  // Expiry warnings
  expiryWarnings?: ExpiryWarning[];
  // Engagement systems
  cliffhanger?: { text: string; icon: string };
  goldenHourBonus?: number;
  goldenHourStarted?: boolean;
  goldenHourEnded?: boolean;
  // Bounty & Stock night report
  bountyResults?: { targetName: string; success: boolean; rewardMoney: number; rewardRep: number }[];
  bountyEncounterReport?: string;
  stockChanges?: { stockId: string; oldPrice: number; newPrice: number; change: number }[];
  stockDividend?: number;
  stockEvent?: { name: string; desc: string } | null;
  // Goods price changes
  priceChanges?: { goodId: GoodId; goodName: string; oldPrice: number; newPrice: number; changePercent: number }[];
  // Crafting output
  craftingOutput?: { recipeName: string; icon: string; outputAmount: number; outputGood: string; estimatedValue: number }[];
}

export interface ExpiryWarning {
  type: 'auction' | 'alliance';
  name: string;
  daysLeft: number;
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

export interface DailyProgressCounters {
  trades: number;
  earned: number;
  washed: number;
  solo_ops: number;
  contracts: number;
  travels: number;
  bribes: number;
  faction_actions: number;
  recruits: number;
  cars_stolen: number;
  casino_won: number;
  hits_completed: number;
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

export type MissionApproach = 'cautious' | 'standard' | 'aggressive';

export interface MissionEncounter {
  id: string;
  text: string;
  districtVariants: Partial<Record<DistrictId, string>>;
  choices: MissionChoice[];
  phase?: string;
  atmosphere?: string;
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
  approach?: MissionApproach;
  choiceResults?: ('success' | 'partial' | 'fail')[];
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
  playerHP: number;
  playerMaxHP: number;
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
  leaderDefeatedDay: Partial<Record<FamilyId, number>>; // day when leader was defeated
  factionConquest: Partial<Record<FamilyId, ConquestPhaseData>>; // multi-phase conquest progress
  pendingConquestPopup: FamilyId | null; // auto-popup after leader defeat
  prices: Record<string, Record<string, number>>;
  priceTrends: Record<string, string>;
  districtDemands: Record<string, GoodId | null>;
  // Market dynamics
  marketPressure: Record<string, Record<string, number>>; // district -> good -> pressure (-1 to +1)
  activeMarketEvent: { id: string; name: string; desc: string; effects: Partial<Record<GoodId, number>>; daysLeft: number } | null;
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
  pendingWarEvent: WarEvent | null;
  spionageIntel: SpionageIntel[];
  sabotageEffects: SabotageEffect[];
  allianceCooldowns: Record<FamilyId, number>; // day when usable again
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

  // ========== SAFEHOUSE STATE ==========
  safehouses: Safehouse[];

  // ========== CAR THEFT STATE ==========
  stolenCars: StolenCar[];
  carOrders: CarOrder[];
  pendingCarTheft: CarTheftEncounter | null;

  // ========== STORY & ANIMATION STATE ==========
  pendingStreetEvent: any | null;
  streetEventResult: StreetEventResult | null;
  screenEffect: ScreenEffectType;
  lastRewardAmount: number;
  crewPersonalities: Record<number, PersonalityTrait>;
  pendingCrewEvent: import('./crewEvents').CrewLoyaltyEvent | null;
  crewEventCooldowns: Record<number, number>; // crewIndex -> last event day
  crewTrouwBonusGiven: Record<number, boolean>;
  crewUltimatumGiven: Record<number, boolean>;

  // ========== STORY ARCS STATE ==========
  activeStoryArcs: import('../game/storyArcs').ActiveStoryArc[];
  completedArcs: string[];
  pendingArcEvent: { arcId: string; stepIndex: number } | null;
  arcEventResult: { success: boolean; text: string } | null;

  // ========== CORRUPTION NETWORK STATE ==========
  corruptContacts: CorruptContact[];
  pendingCorruptionEvent: CorruptionEvent | null;

  // ========== DAILY CHALLENGES STATE ==========
  dailyChallenges: ActiveChallenge[];
  challengeDay: number;
  challengesCompleted: number;
  dailyProgress: DailyProgressCounters;

  // ========== NARRATIVE EXPANSION STATE ==========
  backstory: BackstoryId | null;
  karma: number; // -100 (meedogenloos) to +100 (eerbaar)
  npcRelations: Record<string, NpcRelation>;
  pendingFlashback: FlashbackData | null;
  keyDecisions: string[];

  // ========== HITMAN & AMMO STATE ==========
  ammo: number; // legacy — kept for backward compat, equals total of ammoStock
  ammoStock: Record<AmmoType, number>; // per-type ammo stock
  ammoFactoryLevel: number; // 1-3
  hitContracts: HitContract[];

  // ========== PRISON STATE ==========
  prison: PrisonState | null;

  // ========== HOSPITAL & GAME OVER STATE ==========
  hospital: HospitalState | null;
  hospitalizations: number;
  gameOver: boolean;

  // ========== HEIST STATE ==========
  activeHeist: import('../game/heists').ActiveHeist | null;
  heistCooldowns: Record<string, number>;
  heistPlan: import('../game/heists').HeistPlan | null;

  // ========== NEWS STATE ==========
  dailyNews: import('../game/newsGenerator').NewsItem[];

  // ========== VILLA STATE ==========
  villa: VillaState | null;

  // ========== DRUG EMPIRE STATE ==========
  drugEmpire: import('./drugEmpire').DrugEmpireState | null;

  // ========== ACHIEVEMENT POPUP STATE ==========
  pendingAchievements: string[];

  // ========== CINEMATIC MOMENTS STATE ==========
  pendingCinematic: import('../game/cinematics').CinematicMoment | null;
  seenCinematics: string[];

  // ========== ENDGAME EVENT TRACKING ==========
  seenEndgameEvents: string[];

  // ========== MARKET ALERTS STATE ==========
  marketAlerts: MarketAlert[];
  triggeredAlerts: TriggeredMarketAlert[];
  smartAlarmEnabled?: boolean;
  smartAlarmThreshold?: number; // configurable, default 1000

  // ========== RACING STATE ==========
  raceUsedToday: boolean;

  // ========== DEALER STATE ==========
  vehiclePriceModifiers: Record<string, number>; // vehicleId -> multiplier (0.9 - 1.15)
  dealerDeal: DealerDeal | null;

  // ========== GOLDEN HOUR STATE ==========
  goldenHour: { turnsLeft: number } | null;

  // ========== AUCTION STATE ==========
  auctionItems?: AuctionItem[];

  // ========== ALLIANCE PACT STATE ==========
  alliancePacts?: Record<string, AlliancePact>;

  // ========== STATISTICS HISTORY ==========
  incomeHistory?: number[];

  // ========== NG+ STATE ==========
  _ngPlusDifficultyScale?: number; // combat scaling multiplier
  _ngPlusExclusiveFlags?: {
    nemesisRevengeAvailable: boolean;
    eliteContractsEnabled: boolean;
    legendaryHeistsEnabled: boolean;
    veteranCrewBonus: boolean;
  };

  // ========== RUN HISTORY (NG+ Leaderboard) ==========
  runHistory: RunRecord[];

  // ========== BOUNTY SYSTEM STATE ==========
  activeBounties: import('../game/bounties').BountyContract[];
  placedBounties: import('../game/bounties').BountyContract[];
  pendingBountyEncounter: import('../game/bounties').BountyEncounter | null;
  bountyBoard: import('../game/bounties').BountyTarget[];

  // ========== STOCK MARKET STATE ==========
  stockPrices: Record<string, number>;
  stockHistory: Record<string, number[]>;
  stockHoldings: Record<string, import('../game/stocks').StockHolding>;
  pendingInsiderTip: import('../game/stocks').InsiderTip | null;
  stockEvents: import('../game/stocks').StockEvent[];

  // ========== TRADE LOG STATE ==========
  tradeLog: TradeLogEntry[];

  // ========== CRAFTING LOG STATE ==========
  craftLog: import('../game/crafting').CraftLogEntry[];

  // ========== MINI-GAME STATE ==========
  pendingMinigame: {
    type: 'lockpick' | 'dice' | 'hacking' | 'arm_wrestle';
    difficulty: number;
    context: string;
    rewards: { money?: number; rep?: number; heat?: number };
  } | null;

  // ========== PVP TURN-BASED COMBAT STATE ==========
  activePvPCombat: PvPCombatState | null;

  // ========== MMO SERVER STATE ==========
  energy: number;
  maxEnergy: number;
  nerve: number;
  maxNerve: number;
  energyRegenAt: string | null;
  nerveRegenAt: string | null;
  travelCooldownUntil: string | null;
  crimeCooldownUntil: string | null;
  attackCooldownUntil: string | null;
  heistCooldownUntil: string | null;
  serverSynced: boolean; // whether state is synced with server
  lastTickAt: string | null; // ISO timestamp of last auto-tick (replaces turn-based day system)
  tickIntervalMinutes: number; // how many real minutes = 1 game day (default 30)

  // ========== GANG TERRITORY STATE ==========
  gangDistricts: string[]; // districts owned by player's gang (derived from server)
  gangId: string | null; // player's current gang ID

  // ========== SKILL TREE & PRESTIGE STATE ==========
  unlockedSkills: { skillId: string; level: number }[];
  prestigeLevel: number;
  xpStreak: number; // consecutive actions without hospitalization

  // ========== REDUCER META (transient, not persisted) ==========
  _finalBossWon?: boolean;
  _lastFactionResult?: any;
  _completedArcFlashbackId?: string;
  _pendingXpGains: { amount: number; source: string }[]; // queued for server-side processing
}

// ========== MARKET ALERT TYPES ==========
export interface MarketAlert {
  id: string;
  goodId: GoodId;
  district: DistrictId | 'any';
  condition: 'below' | 'above';
  threshold: number;
  oneShot: boolean; // remove after triggering
}

export interface TriggeredMarketAlert {
  goodName: string;
  districtName: string;
  condition: 'below' | 'above';
  threshold: number;
  actualPrice: number;
}

// ========== AUCTION TYPES ==========
export interface AuctionItem {
  id: string;
  name: string;
  desc: string;
  basePrice: number;
  currentBid: number;
  npcBidder: string;
  expiresDay: number;
  rewardType: 'gear' | 'goods' | 'money' | 'rep';
  rewardId?: string;
  rewardGoodId?: GoodId;
  rewardAmount?: number;
}

// ========== ALLIANCE PACT TYPES ==========
export interface AlliancePact {
  familyId: FamilyId;
  active: boolean;
  expiresDay: number;
  benefit: string;
  costPerDay: number;
}

// ========== RUN RECORD (NG+ Leaderboard) ==========
// ========== TRADE LOG TYPES ==========
export interface TradeLogEntry {
  id: string;
  day: number;
  goodId: GoodId;
  mode: 'buy' | 'sell';
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  district: DistrictId;
  profitPerUnit?: number; // only for sell: sellPrice - avgCost
}

export interface RunRecord {
  ngLevel: number;
  day: number;
  score: number;
  rank: string; // S, A, B, C, D
  method: string;
  factionsConquered: number;
  districtsOwned: number;
  achievementsUnlocked: number;
  totalEarned: number;
  nemesisDefeated: boolean;
  crewSize: number;
  karma: number;
  timestamp: number; // Date.now()
}
