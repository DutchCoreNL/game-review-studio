import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useServerSync } from '@/hooks/useServerSync';
import { produce } from 'immer';
import { GameState, GameView, TradeMode, GoodId, DistrictId, StatId, FamilyId, FactionActionType, ActiveMission, SmuggleRoute, ScreenEffectType, OwnedVehicle, VehicleUpgradeType, ChopShopUpgradeId, SafehouseUpgradeId, AmmoPack, PrisonState, DistrictHQUpgradeId, WarTactic, VillaModuleId } from '../game/types';
import { MERIT_NODES, canUnlockMeritNode } from '../game/meritSystem';
import { createInitialState, DISTRICTS, VEHICLES, GEAR, BUSINESSES, GOODS, ACHIEVEMENTS, NEMESIS_NAMES, NEMESIS_ARCHETYPES, NEMESIS_TAUNTS, REKAT_COSTS, VEHICLE_UPGRADES, STEALABLE_CARS, CHOP_SHOP_UPGRADES, OMKAT_COST, CAR_ORDER_CLIENTS, SAFEHOUSE_COSTS, SAFEHOUSE_UPGRADE_COSTS, SAFEHOUSE_UPGRADES, CORRUPT_CONTACTS, AMMO_PACKS, CRUSHER_AMMO_REWARDS, PRISON_ARREST_CHANCE_MISSION, PRISON_ARREST_CHANCE_HIGH_RISK, PRISON_ARREST_CHANCE_CARJACK, ARREST_HEAT_THRESHOLD, SOLO_OPERATIONS, DISTRICT_HQ_UPGRADES, UNIQUE_VEHICLES, RACES, AMMO_FACTORY_UPGRADES, HOSPITAL_STAY_DAYS, HOSPITAL_ADMISSION_COST_PER_MAXHP, HOSPITAL_REP_LOSS, MAX_HOSPITALIZATIONS } from '../game/constants';
import { canUpgradeLab, LAB_UPGRADE_COSTS, createDrugEmpireState, shouldShowDrugEmpire, sellNoxCrystal, canAssignDealer, getAvailableCrew, MAX_DEALERS, type ProductionLabId, type DrugTier } from '../game/drugEmpire';
import * as Engine from '../game/engine';
import { simulateWorldDay } from '../game/world/simulate';
import { generateWorld } from '../game/world/generateWorld';
import { WORLD_SIM_VERSION } from '../game/world/types';
import { JOBS, getJobSalary } from '../game/jobs';
import { SKILL_NODES, canUnlockSkill } from '../game/skillTree';
import {
  ORG_FOUND_COST, ORG_FOUND_MIN_REP, ORG_UPGRADES, orgMaxMembers, orgPower,
  orgDailyIncome, orgDailyUpkeep, orgDailyLoyaltyRegen, orgDailyRep,
  recruitCost, promoteCost, makeRecruit, nextRole, resolveOrgAttack,
  ORG_OPERATIONS, ORG_OP_COOLDOWN_MS, orgOperationSuccessChance,
  ORG_PACT_MIN_RESPECT, orgRelation, orgRank,
  orgPactCost, orgOperationRewardMult, orgDefenseAdvantage, orgAllySupport,
  type PlayerOrg, type OrgMember, type RacketId,
} from '../game/organization';
import { resolveRacketTick, RACKET_BY_ID } from '../game/rackets';
import { rollIncident, ATTENTION_DECAY_PER_DAY, type ActiveIncident, type IncidentOutcome } from '../game/incidents';
import { HEAT_BASE_DECAY } from '../game/heat';
import { tradeHeat } from '../game/market';
import { canTravel, travelCost, TRAVEL_ENERGY, TRAVEL_COOLDOWN_MS } from '../game/cityTravel';
import { bribeCost as prisonBribeCost, escapeChance, ESCAPE_FAIL_EXTRA_DAYS, ESCAPE_HEAT_PENALTY } from '../game/prison';
import { streakPayoutMultiplier } from '../game/momentum';
import { makeJob, rollJobReward, districtUnlocked, crewWorkPerSecond } from '../game/score';
import { BASE_STASH_SLOTS, WASH_KEEP_RATE } from '../game/engine';
import { nextTier, canBuyTier, equipHeatShield, type EquipSlot } from '../game/equipment';
import { autoFenceActive, autoFenceIncome, AUTO_FENCE_COST, AUTO_FENCE_HEAT, AUTO_FENCE_SEIZURE_CHANCE } from '../game/tradeNetwork';
import { canRetire, computeLegacyGain, legacyIncomeMult, legacyStartCash, getLegacy } from '../game/legacy';

/** Personal-heat level at which the idle empire gets raided by police. */
const HEAT_RAID_THRESHOLD = 92;

/**
 * What each origin gives you on day one: a crew name, a right hand with a fitting
 * temperament, and a first racket already earning. This is what makes the game
 * playable from the first second instead of gating the whole idle loop behind
 * money and respect a new player cannot have.
 */
const ORIGIN_START = {
  weduwnaar: {
    crewName: 'De Nabestaanden', tag: 'NAB', respect: 10,
    rightHand: 'Joris', trait: 'meedogenloos' as const, racket: 'low_protection',
    opening: 'Je begon klein: een handvol winkeliers in Lowrise die liever jou betalen. Joris staat naast je.',
  },
  bankier: {
    crewName: 'Het Kantoor', tag: 'KNT', respect: 10,
    rightHand: 'Miriam', trait: 'gladjanus' as const, racket: 'low_runners',
    opening: 'Je kent het systeem van binnenuit. Miriam regelt de koeriers terwijl jij de boeken doet.',
  },
  straatkind: {
    crewName: 'De Steeg', tag: 'STG', respect: 10,
    rightHand: 'Ayoub', trait: 'straatslim' as const, racket: 'low_runners',
    opening: 'De straten van Lowrise waren altijd al van jou. Ayoub loopt de routes die jullie als kind liepen.',
  },
} as const;
import * as MissionEngine from '../game/missions';
import { startNemesisCombat, addPhoneMessage, resolveWarEvent, performSpionage, performSabotage, negotiateNemesis, scoutNemesis, checkNemesisWoundedRevenge } from '../game/newFeatures';
import { createHeistPlan, performRecon, validateHeistPlan, startHeist as startHeistFn, executePhase, resolveComplication, HEIST_EQUIPMENT, HEIST_TEMPLATES } from '../game/heists';
import { calculateEndgamePhase, buildVictoryData, startFinalBoss, createBossPhase, canTriggerFinalBoss, createNewGamePlus, getPhaseUpMessage, getDeckDialogue, getEndgameEvent, createPrestigeReset } from '../game/endgame';
// Street events removed (not suitable for MMO)
import { checkArcTriggers, checkArcProgression, resolveArcChoice } from '../game/storyArcs';
import { generateDailyChallenges, updateChallengeProgress, getChallengeTemplate } from '../game/dailyChallenges';
import { rollNpcEncounter, applyNpcBonuses } from '../game/npcs';
import { applyMissingNpcBonuses } from '../game/npcEvents';
import { checkWeekEvent, processWeekEvent } from '../game/weekEvents';
import { applyBackstory } from '../game/backstory';
import { generateArcFlashback } from '../game/flashbacks';
import { generateHitContracts, executeHit } from '../game/hitman';
import * as bountyModule from '../game/bounties';
import * as stockModule from '../game/stocks';
// Crew events removed (not suitable for MMO)
import { checkCinematicTrigger, applyCinematicChoice, markCinematicSeen } from '../game/cinematics';
import { generateDailyNews } from '../game/newsGenerator';
import { checkCodexUnlocks } from '../game/codex';
import { upgradeWeapon, getUpgradeCost, swapAccessory, getAccessorySwapCost, canFuseWeapons, fuseWeapons, getWeaponsBelowRarity, getBulkSellValue } from '../game/weaponUpgrade';
import { upgradeGear, getGearUpgradeCost, swapGearMod, getGearModSwapCost, canFuseGear, fuseGear, getGearBelowRarity, getGearBulkSellValue } from '../game/gearUpgrade';
import { generateBlackMarketStock, shouldRefreshStock } from '../game/blackMarket';
import { openCrate, getCrateDef } from '../game/lootCrates';
import { openLootBox, getLootBoxDef, type LootBoxTier } from '../game/lootBoxes';
import { startDungeonRun, resolveDungeonRun, getDungeonTierDef, isDungeonComplete, type DungeonId, type DungeonTier } from '../game/dungeons';
import { canClaimDailyReward, shouldResetStreak, claimDailyReward } from '../game/dailyRewards';
import { getWeaponScrapValue, getGearScrapValue, CRAFT_RECIPES as SALVAGE_RECIPES, executeCraft } from '../game/salvage';
import { startCampaignMission, canStartMission, getMissionDef, advanceCampaignMission, startBossFight, canFightBoss, bossFightTurn, generateBossLoot } from '../game/campaign';
import { PROPERTIES, canAffordProperty, getCurrentProperty } from '../game/properties';
import { CRAFT_RECIPES as VILLA_CRAFT_RECIPES, canCraft as villaCanCraft } from '../game/crafting';
import { createPvPCombatState, pvpCombatTurn } from '../game/combatSkills';
import { weaponProfileFromProc, weaponProfileForLevel } from '../game/combat/damage';
import { handleCombatAction } from '../game/reducers/combatHandlers';
import { createInitialArmsNetwork, generateContact, getContactRecruitCost, processDelivery, getNetworkUpgradeCost, getWeeklyCapacity } from '../game/armsDealing';
import { createStashHouse, getStashUsed, getStashRemaining, getStashUpgradeCost, getStashPurchaseCost } from '../game/stashHouses';
import { LAUNDER_METHODS, isMethodUnlocked, getMethodCapacity } from '../game/launderMethods';
import { rollMarketModifier, processModifierTick, generateInsiderTip } from '../game/marketFluctuations';

export interface CatchUpReportData {
  ticksProcessed: number;
  minutesAway: number;
  daysAdvanced: number;
  energyRestored: number;
  nerveRestored: number;
  moneyEarned: number;
  heatDecayed: number;
  xpGained: number;
  levelUps: number;
  businessIncome: number;
  districtIncome: number;
  worldHeadlines?: string[]; // "while you were away" bot-world events
  orgHeadlines?: string[]; // "while you were away" organisation events
  /** Set when the ticks you missed ended with you in a cell. */
  arrested?: { days: number; moneyLost: number };
  /** Set when the ticks you missed served out a sentence you were already in. */
  released?: boolean;
}

interface XpBreakdownData {
  baseAmount: number;
  totalXp: number;
  multiplier: number;
  bonuses: { key: string; label: string; value: number }[];
  levelUps: number;
  newLevel: number;
  milestoneRewards?: { level: number; title: string; titleIcon: string; cash: number; rep: number; sp_bonus: number; desc: string }[];
  unlocks?: string[];
  restedConsumed?: number;
}

interface GameContextType {
  state: GameState;
  view: GameView;
  tradeMode: TradeMode;
  selectedDistrict: DistrictId | null;
  toast: string | null;
  toastError: boolean;
  xpBreakdown: XpBreakdownData | null;
  clearXpBreakdown: () => void;
  setView: (view: GameView) => void;
  setTradeMode: (mode: TradeMode) => void;
  selectDistrict: (id: DistrictId | null) => void;
  showToast: (msg: string, isError?: boolean) => void;
  dispatch: (action: GameAction) => void;
  onExitToMenu?: () => void;
}

type GameAction =
  | { type: 'SET_STATE'; state: GameState }
  | { type: 'TRADE'; gid: GoodId; mode: TradeMode; quantity?: number }
  | { type: 'TRAVEL'; to: DistrictId }
  | { type: 'BUY_DISTRICT'; id: DistrictId }
  | { type: 'SPEND_MONEY'; amount: number }
  | { type: 'TRAVEL_SELL_GOODS'; revenue: number }
  // END_TURN removed — MMO uses AUTO_TICK only
  | { type: 'DISMISS_NIGHT_REPORT' }
  | { type: 'RECRUIT' }
  | { type: 'HEAL_CREW'; crewIndex: number }
  | { type: 'FIRE_CREW'; crewIndex: number }
  | { type: 'UPGRADE_STAT'; stat: StatId }
  | { type: 'GYM_TRAIN'; gymStat: 'strength' | 'defense' | 'speed' | 'dexterity'; gymId: string }
  | { type: 'APPLY_JOB'; jobId: string }
  | { type: 'WORK_JOB' }
  | { type: 'QUIT_JOB' }
  | { type: 'BUY_GEAR'; id: string }
  | { type: 'EQUIP'; id: string }
  | { type: 'UNEQUIP'; slot: string }
  | { type: 'BUY_VEHICLE'; id: string; discountedCost?: number }
  | { type: 'SET_VEHICLE'; id: string }
  | { type: 'REPAIR_VEHICLE' }
  | { type: 'BUY_UPGRADE'; id: string }
  | { type: 'BUY_BUSINESS'; id: string }
  | { type: 'BRIBE_POLICE' }
  | { type: 'WASH_MONEY' }
  | { type: 'WASH_MONEY_AMOUNT'; amount: number }
  | { type: 'BUY_GEAR_DEAL'; id: string; price: number }
  | { type: 'SOLO_OP'; opId: string }
  | { type: 'EXECUTE_CONTRACT'; contractId: number; crewIndex: number }
  | { type: 'BUY_CHEMICALS'; amount: number }
  | { type: 'SET_TUTORIAL_DONE' }
  | { type: 'CLAIM_DAILY_REWARD' }
  | { type: 'CASINO_BET'; amount: number }
  | { type: 'CASINO_WIN'; amount: number }
  | { type: 'CASINO_RESULT'; amount: number; heat?: number }
  | { type: 'START_COMBAT'; familyId: FamilyId }
  | { type: 'START_NEMESIS_COMBAT' }
  | { type: 'COMBAT_ACTION'; action: 'attack' | 'heavy' | 'defend' | 'environment' | 'tactical' | 'skill' | 'combo_finisher'; skillId?: string }
  | { type: 'SET_COMBAT_STANCE'; stance: import('../game/types').CombatStance }
  | { type: 'END_COMBAT' }
  | { type: 'FACTION_ACTION'; familyId: FamilyId; actionType: FactionActionType }
  | { type: 'CONQUER_FACTION'; familyId: FamilyId }
  | { type: 'ANNEX_FACTION'; familyId: FamilyId }
  | { type: 'START_MISSION'; mission: ActiveMission }
  | { type: 'MISSION_CHOICE'; choiceId: string; forceResult?: 'success' | 'partial' | 'fail' }
  | { type: 'END_MISSION' }
  // New feature actions
  | { type: 'CREATE_ROUTE'; route: SmuggleRoute }
  | { type: 'DELETE_ROUTE'; routeId: string }
  | { type: 'BUY_DISTRICT_UPGRADE'; districtId: DistrictId; upgradeId: DistrictHQUpgradeId }
  | { type: 'RESOLVE_WAR_EVENT'; tactic: WarTactic }
  | { type: 'DISMISS_WAR_EVENT' }
  | { type: 'PERFORM_SPIONAGE'; districtId: DistrictId }
  | { type: 'PERFORM_SABOTAGE'; districtId: DistrictId }
  | { type: 'REQUEST_ALLIANCE_HELP'; familyId: FamilyId; districtId: DistrictId }
  | { type: 'SET_SPECIALIZATION'; crewIndex: number; specId: string }
  | { type: 'DISMISS_SPEC_CHOICE' }
  | { type: 'TOGGLE_PHONE' }
  | { type: 'READ_MESSAGE'; messageId: string }
  | { type: 'READ_ALL_MESSAGES' }
  | { type: 'TRACK_BLACKJACK_WIN' }
  | { type: 'RESET_BLACKJACK_STREAK' }
  | { type: 'TRACK_HIGHLOW_ROUND'; round: number }
  | { type: 'JACKPOT_ADD'; amount: number }
  | { type: 'JACKPOT_RESET' }
  | { type: 'SET_MONEY'; amount: number }
  | { type: 'START_FINAL_BOSS' }
  | { type: 'START_BOSS_PHASE_2' }
  | { type: 'RESOLVE_FINAL_BOSS' }
  | { type: 'NEW_GAME_PLUS' }
  | { type: 'PRESTIGE_RESET' }
  | { type: 'START_HARDCORE' }
  | { type: 'FREE_PLAY' }
  | { type: 'RESOLVE_STREET_EVENT'; choiceId: string; forceResult?: 'success' | 'partial' | 'fail' }
  | { type: 'DISMISS_STREET_EVENT' }
  | { type: 'OPEN_QUEUED_EVENT'; index: number }
  | { type: 'DISMISS_QUEUED_EVENT'; index: number }
  | { type: 'SET_SCREEN_EFFECT'; effect: ScreenEffectType }
  | { type: 'SET_WEEK_EVENT'; event: any }
  | { type: 'SYNC_WORLD_TIME'; timeOfDay: string; worldDay?: number }
  | { type: 'RESOLVE_ARC_EVENT'; arcId: string; choiceId: string }
  | { type: 'DISMISS_ARC_EVENT' }
  // Heat 2.0 actions
  | { type: 'REKAT_VEHICLE'; vehicleId: string }
  | { type: 'UPGRADE_VEHICLE'; vehicleId: string; upgradeType: VehicleUpgradeType }
  | { type: 'GO_INTO_HIDING'; days: number }
  | { type: 'CANCEL_HIDING' }
  // Car theft actions
  | { type: 'ATTEMPT_CAR_THEFT'; success: boolean }
  | { type: 'DISMISS_CAR_THEFT' }
  | { type: 'OMKAT_STOLEN_CAR'; carId: string }
  | { type: 'UPGRADE_STOLEN_CAR'; carId: string; upgradeId: ChopShopUpgradeId }
  | { type: 'SELL_STOLEN_CAR'; carId: string; orderId: string | null }
  | { type: 'USE_STOLEN_CAR'; carId: string }
  // Safehouse actions
  | { type: 'BUY_SAFEHOUSE'; district: DistrictId }
  | { type: 'UPGRADE_SAFEHOUSE'; district: DistrictId }
  | { type: 'INSTALL_SAFEHOUSE_UPGRADE'; district: DistrictId; upgradeId: SafehouseUpgradeId }
  // Corruption network actions
  | { type: 'RECRUIT_CONTACT'; contactDefId: string }
  | { type: 'FIRE_CONTACT'; contactId: string }
  | { type: 'DISMISS_CORRUPTION_EVENT' }
  // Daily challenges actions
  | { type: 'CLAIM_CHALLENGE_REWARD'; templateId: string }
  // Narrative expansion actions
  | { type: 'SELECT_BACKSTORY'; backstoryId: string }
  | { type: 'DISMISS_FLASHBACK' }
  // Hitman & Ammo actions
  | { type: 'BUY_AMMO'; packId: string; ammoType: import('../game/types').AmmoType }
  | { type: 'LOAD_AMMO_FROM_INVENTORY'; ammoType: import('../game/types').AmmoType; quantity: number }
  | { type: 'EXECUTE_HIT'; hitId: string }
  | { type: 'CRUSH_CAR'; carId: string }
  // Prison actions
  | { type: 'BRIBE_PRISON' }
  | { type: 'ATTEMPT_ESCAPE' }
  // Heist actions
  | { type: 'START_HEIST_PLANNING'; heistId: string }
  | { type: 'UPDATE_HEIST_PLAN'; plan: import('../game/heists').HeistPlan }
  | { type: 'PERFORM_RECON' }
  | { type: 'BUY_HEIST_EQUIP'; equipId: import('../game/heists').HeistEquipId }
  | { type: 'LAUNCH_HEIST' }
  | { type: 'ADVANCE_HEIST' }
  | { type: 'RESOLVE_HEIST_COMPLICATION'; choiceId: string; forceResult?: 'success' | 'fail' }
  | { type: 'FINISH_HEIST' }
  | { type: 'CANCEL_HEIST' }
  // Villa actions
  | { type: 'UPGRADE_AMMO_FACTORY' }
  | { type: 'BUY_SPECIAL_AMMO'; specialType: import('../game/types').SpecialAmmoType; amount: number; cost: number }
  | { type: 'SET_SPECIAL_AMMO'; specialType: import('../game/types').SpecialAmmoType | null }
  | { type: 'DISMISS_ACHIEVEMENT' }
  // Market alert actions
   | { type: 'ADD_MARKET_ALERT'; alert: import('@/game/types').MarketAlert }
  | { type: 'REMOVE_MARKET_ALERT'; id: string }
  | { type: 'CLEAR_TRIGGERED_ALERTS' }
  | { type: 'TOGGLE_SMART_ALARM' }
  | { type: 'SET_SMART_ALARM_THRESHOLD'; threshold: number }
  | { type: 'BID_AUCTION'; itemId: string; amount: number }
  | { type: 'NEGOTIATE_NEMESIS' }
  | { type: 'SCOUT_NEMESIS' }
  | { type: 'NEMESIS_DEFEAT_CHOICE'; choice: 'execute' | 'exile' | 'recruit' }
  | { type: 'FORM_ALLIANCE'; familyId: FamilyId }
  | { type: 'BREAK_ALLIANCE'; familyId: FamilyId }
  // Racing actions
  | { type: 'START_RACE'; raceType: import('../game/types').RaceType; bet: number; result: import('../game/racing').RaceResult }
  // Dealer actions
  | { type: 'SELL_VEHICLE'; vehicleId: string }
  | { type: 'TRADE_IN_VEHICLE'; oldVehicleId: string; newVehicleId: string }
  // Faction conquest actions
  | { type: 'START_CONQUEST_PHASE'; familyId: FamilyId; phase: 1 | 2 }
  | { type: 'DISMISS_CONQUEST_POPUP' }
  | { type: 'ACCEPT_CONQUEST_POPUP' }
  | { type: 'HEAL_PLAYER'; amount: number; cost: number }
  // Crew loyalty event actions
  | { type: 'RESOLVE_CREW_EVENT'; choiceId: string }
  | { type: 'DISMISS_CREW_EVENT' }
  | { type: 'RESOLVE_NPC_EVENT'; choiceId: string }
  | { type: 'DISMISS_NPC_EVENT' }
  // Bounty actions
  | { type: 'PLACE_BOUNTY'; targetId: string }
  | { type: 'RESOLVE_BOUNTY_ENCOUNTER'; choice: 'fight' | 'flee' | 'bribe' }
  | { type: 'DISMISS_BOUNTY_ENCOUNTER' }
  | { type: 'CANCEL_BOUNTY'; bountyId: string }
  // Stock actions
  | { type: 'BUY_STOCK'; stockId: string; shares: number }
  | { type: 'SELL_STOCK'; stockId: string; shares: number }
  | { type: 'DISMISS_INSIDER_TIP' }
  // Cinematic actions
  | { type: 'RESOLVE_CINEMATIC'; cinematicId: string; choiceId: string }
  | { type: 'DISMISS_CINEMATIC' }
  // Drug Empire actions
  | { type: 'UPGRADE_LAB'; labId: ProductionLabId; targetTier: 2 | 3 }
  | { type: 'SET_DRUG_TIER'; labId: ProductionLabId; tier: DrugTier }
  | { type: 'ASSIGN_DEALER'; district: DistrictId; crewName: string; product: GoodId }
  | { type: 'RECALL_DEALER'; district: DistrictId }
  | { type: 'SELL_NOXCRYSTAL'; amount: number }
  | { type: 'CRAFT_ITEM'; recipeId: string }
  | { type: 'MERGE_SERVER_STATE'; serverState: Partial<GameState> }
  | { type: 'ADD_CONTRACT'; contract: any }
  | { type: 'REMOVE_CONTRACT'; contractId: number; repPenalty?: number }
  | { type: 'SET_PRICES'; prices?: Record<string, Record<string, number>>; priceTrends?: Record<string, string> }
  | { type: 'AUTO_TICK'; isCatchUp?: boolean }
  | { type: 'SET_CATCH_UP_REPORT'; report: CatchUpReportData | null }
  | { type: 'RESET' }
  // PvP Turn-Based Combat
  | { type: 'START_PVP_COMBAT'; target: import('../game/types').PvPPlayerInfo }
  | { type: 'PVP_COMBAT_ACTION'; action: 'attack' | 'heavy' | 'defend' | 'skill' | 'combo_finisher'; skillId?: string }
  | { type: 'SET_PVP_STANCE'; stance: import('../game/types').CombatStance }
  | { type: 'END_PVP_COMBAT' }
  // Property actions
  | { type: 'BUY_PROPERTY'; propertyId: string }
  // Skill Tree actions
  | { type: 'SYNC_SKILLS'; skills: { skillId: string; level: number }[]; skillPoints: number }
  | { type: 'UNLOCK_SKILL'; skillId: string }
  | { type: 'PLACE_BOT_BOUNTY'; botId: string; amount: number }
  | { type: 'AUCTION_BID'; auctionId: string; amount: number }
  | { type: 'AUCTION_CLAIM'; auctionId: string }
  | { type: 'CREATE_AUCTION'; itemType: 'gear' | 'good' | 'vehicle'; itemId: string; startingPrice: number; quantity: number }
  | { type: 'BOT_TRADE'; botId: string; offerCash: number; offerGoods: Record<string, number>; requestCash: number; requestGoods: Record<string, number> }
  | { type: 'FOUND_ORG'; name: string; tag: string }
  | { type: 'ORG_RECRUIT' }
  | { type: 'ORG_PROMOTE'; memberId: string }
  | { type: 'ORG_DISMISS'; memberId: string }
  | { type: 'ORG_BUY_UPGRADE'; upgradeId: string }
  | { type: 'ORG_ATTACK_DISTRICT'; gangId: string }
  | { type: 'ORG_RUN_OPERATION'; operationId: string }
  | { type: 'ORG_SET_RELATION'; gangId: string; relation: 'ally' | 'enemy' | 'neutral' }
  | { type: 'BUY_EQUIPMENT'; slot: EquipSlot }
  | { type: 'SCORE_START'; district: DistrictId }
  | { type: 'SCORE_WORK'; amount: number }
  | { type: 'SCORE_CLEAR_REWARD' }
  | { type: 'SCORE_ABANDON' }
  | { type: 'RESOLVE_INCIDENT'; choiceId: string }
  | { type: 'CLEAR_INCIDENT_RESULT' }
  | { type: 'ORG_ASSIGN_RACKET'; memberId: string; racket: RacketId | null }
  | { type: 'ORG_ASSIGN_ALL'; racket: RacketId | null }
  | { type: 'BUY_AUTO_FENCE' }
  | { type: 'TOGGLE_AUTO_FENCE' }
  | { type: 'RETIRE_SUCCESSOR' }
  | { type: 'ORG_DISBAND' }
  // Merit Points actions
  | { type: 'UPGRADE_MERIT_NODE'; payload: { nodeId: string } }
  // Weapon inventory actions
  | { type: 'EQUIP_WEAPON'; weaponId: string }
  | { type: 'SELL_WEAPON'; weaponId: string }
  | { type: 'ADD_WEAPON'; weapon: import('../game/weaponGenerator').GeneratedWeapon }
  | { type: 'TOGGLE_WEAPON_LOCK'; weaponId: string }
  | { type: 'UPGRADE_WEAPON'; weaponId: string }
  | { type: 'SWAP_WEAPON_ACCESSORY'; weaponId: string; accessoryId: import('../game/weaponGenerator').AccessoryId }
  | { type: 'FUSE_WEAPONS'; weaponIds: [string, string, string] }
  | { type: 'BULK_SELL_WEAPONS'; maxRarity: import('../game/weaponGenerator').WeaponRarity }
  | { type: 'ADD_WEAPON_MASTERY_XP'; weaponId: string; xp: number }
  // Gear inventory actions
  | { type: 'EQUIP_GEAR'; gearId: string; gearType: 'armor' | 'gadget' }
  | { type: 'SELL_GEAR'; gearId: string; gearType: 'armor' | 'gadget' }
  | { type: 'ADD_GEAR'; gear: import('../game/gearGenerator').GeneratedGear }
  | { type: 'TOGGLE_GEAR_LOCK'; gearId: string; gearType: 'armor' | 'gadget' }
  | { type: 'UPGRADE_GEAR'; gearId: string; gearType: 'armor' | 'gadget' }
  | { type: 'SWAP_GEAR_MOD'; gearId: string; gearType: 'armor' | 'gadget'; modId: import('../game/gearGenerator').GearModId }
  | { type: 'FUSE_GEAR'; gearIds: [string, string, string]; gearType: 'armor' | 'gadget' }
  | { type: 'BULK_SELL_GEAR'; maxRarity: import('../game/gearGenerator').GearRarity; gearType: 'armor' | 'gadget' }
  // Black Market actions
  | { type: 'BUY_BLACK_MARKET_ITEM'; itemId: string; useDirtyMoney: boolean }
  | { type: 'REFRESH_BLACK_MARKET' }
  // Loot Crate actions
  | { type: 'OPEN_LOOT_CRATE'; tier: import('../game/lootCrates').CrateTier }
  // Loot Box actions
  | { type: 'OPEN_LOOT_BOX'; tier: LootBoxTier }
  // Dungeon / Raid actions
  | { type: 'START_DUNGEON'; dungeonId: DungeonId; tier: DungeonTier }
  | { type: 'COLLECT_DUNGEON' }
  // Daily Reward actions
  | { type: 'CLAIM_DAILY_LOGIN_REWARD' }
  // Salvage/Crafting actions
  | { type: 'SALVAGE_WEAPON'; weaponId: string }
  | { type: 'SALVAGE_GEAR'; gearId: string; gearType: 'armor' | 'gadget' }
  | { type: 'CRAFT_SALVAGE'; recipeId: string }
  // Campaign actions
  | { type: 'START_CAMPAIGN_MISSION'; chapterId: string; missionId: string }
  | { type: 'ADVANCE_CAMPAIGN_MISSION'; choice: import('../game/campaign').EncounterChoice }
  | { type: 'COLLECT_CAMPAIGN_MISSION_REWARDS' }
  | { type: 'END_CAMPAIGN_MISSION' }
  | { type: 'START_BOSS_FIGHT_CAMPAIGN'; chapterId: string }
  | { type: 'BOSS_FIGHT_ACTION'; action: 'attack' | 'heavy' | 'defend' | 'dodge' | 'item'; itemId?: string }
  | { type: 'COLLECT_BOSS_LOOT' }
  | { type: 'END_BOSS_FIGHT' }
  | { type: 'SET_CHAPTER_DIFFICULTY'; chapterId: string; difficulty: import('../game/campaign').CampaignDifficulty }
  | { type: 'CAMPAIGN_MISSION_PUSH' }
  | { type: 'CAMPAIGN_MISSION_REST' }
  // Enchantment actions
  | { type: 'ADD_ENCHANTMENT'; enchantment: import('../game/enchantments').EnchantmentItem }
  | { type: 'SOCKET_ENCHANTMENT_WEAPON'; weaponId: string; enchantmentItemId: string; cost: number }
  | { type: 'SOCKET_ENCHANTMENT_GEAR'; gearId: string; gearType: 'armor' | 'gadget'; enchantmentItemId: string; cost: number }
  | { type: 'SALVAGE_ENCHANTMENT'; enchantmentItemId: string }
  // Skin actions
  | { type: 'ADD_SKIN'; skin: import('../game/weaponSkins').SkinItem }
  | { type: 'APPLY_SKIN_WEAPON'; weaponId: string; skinItemId: string }
  | { type: 'APPLY_SKIN_GEAR'; gearId: string; gearType: 'armor' | 'gadget'; skinItemId: string }
  // Durability/Repair actions
  | { type: 'REPAIR_WEAPON'; weaponId: string; useScrap: boolean }
  | { type: 'REPAIR_GEAR'; gearId: string; gearType: 'armor' | 'gadget'; useScrap: boolean }
  // Blueprint actions
  | { type: 'ADD_BLUEPRINT'; blueprint: import('../game/blueprints').BlueprintItem }
  | { type: 'CRAFT_BLUEPRINT'; blueprintItemId: string }
  // Loadout Preset actions
  | { type: 'SAVE_LOADOUT_PRESET'; name: string }
  | { type: 'LOAD_LOADOUT_PRESET'; presetId: string }
  | { type: 'DELETE_LOADOUT_PRESET'; presetId: string }
  | { type: 'RENAME_LOADOUT_PRESET'; presetId: string; name: string }
  // Weapon Challenge actions
  | { type: 'UPDATE_WEAPON_CHALLENGE'; weaponId: string; challengeType: 'kill' | 'perfect_kill' }
  // Underworld Economy actions
  | { type: 'RECRUIT_ARMS_CONTACT'; district: import('../game/types').DistrictId }
  | { type: 'DELIVER_ARMS'; contactId: string; quantity: number }
  | { type: 'UPGRADE_ARMS_NETWORK' }
  | { type: 'BUY_STASH_HOUSE'; district: import('../game/types').DistrictId }
  | { type: 'UPGRADE_STASH_HOUSE'; stashId: string }
  | { type: 'DEPOSIT_STASH'; stashId: string; goodId: import('../game/types').GoodId; amount: number }
  | { type: 'WITHDRAW_STASH'; stashId: string; goodId: import('../game/types').GoodId; amount: number }
  | { type: 'UPGRADE_SMUGGLE_ROUTE'; routeId: string }
  | { type: 'SPECIALIZE_ROUTE'; routeId: string; goodId: import('../game/types').GoodId }
  | { type: 'ASSIGN_ROUTE_ESCORT'; routeId: string; crewName: string; crewRole: import('../game/types').CrewRole }
  | { type: 'REMOVE_ROUTE_ESCORT'; routeId: string }
  | { type: 'LAUNDER_METHOD'; methodId: string; amount: number }
  | { type: 'DISMISS_INSIDER_TIP_MARKET'; tipId: string }
  // Internal sync actions
  | { type: 'CLEAR_PENDING_XP' }
  | { type: 'SYNC_SERVER_XP'; data: { newXp: number; newLevel: number; newNextXp: number; newSP: number; streak: number; totalXp?: number; levelUps?: number; newMeritPoints?: number; newStatPoints?: number } };

const GameContext = createContext<GameContextType | undefined>(undefined);

/** Helper: update challenge progress after an action */
function syncChallenges(s: GameState): void {
  if (!s.dailyChallenges || s.dailyChallenges.length === 0) return;
  s.dailyChallenges = updateChallengeProgress(s.dailyChallenges, s.dailyProgress, s.heat);
}

/** Energy/Nerve cost constants for MMO actions */
const ENERGY_COSTS: Record<string, number> = {
  TRADE: 2, TRAVEL: 5, SOLO_OP: 10, EXECUTE_CONTRACT: 15, START_COMBAT: 8,
  START_NEMESIS_COMBAT: 10, EXECUTE_HIT: 12, LAUNCH_HEIST: 20,
  ATTEMPT_CAR_THEFT: 8, START_RACE: 5, CRAFT_ITEM: 3,
};
const NERVE_COSTS: Record<string, number> = {
  SOLO_OP: 5, EXECUTE_HIT: 8, START_COMBAT: 10, START_NEMESIS_COMBAT: 15,
  LAUNCH_HEIST: 15, ATTEMPT_ESCAPE: 10, ATTEMPT_CAR_THEFT: 5, START_RACE: 3,
};

/** Check if a cooldown is active */
function isCooldownActive(until: string | null): boolean {
  if (!until) return false;
  return new Date(until).getTime() > Date.now();
}

/** Deduct energy/nerve and set regen timers */
function deductEnergy(s: GameState, amount: number): boolean {
  if (s.energy < amount) return false;
  s.energy -= amount;
  // Set regen timer if not already ticking
  if (!s.energyRegenAt || new Date(s.energyRegenAt).getTime() <= Date.now()) {
    s.energyRegenAt = new Date(Date.now() + 60000).toISOString(); // 1 min per energy
  }
  return true;
}
function deductNerve(s: GameState, amount: number): boolean {
  if (s.nerve < amount) return false;
  s.nerve -= amount;
  if (!s.nerveRegenAt || new Date(s.nerveRegenAt).getTime() <= Date.now()) {
    s.nerveRegenAt = new Date(Date.now() + 120000).toISOString(); // 2 min per nerve
  }
  return true;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  return produce(state, (s) => {

  switch (action.type) {
    case 'SET_STATE': {
      // Preserve critical progression fields if cloud save has them as null
      // but the current local state already has them set (prevents backstory re-selection)
      const loaded = action.state;
      if (loaded.backstory === null && s.backstory !== null) {
        loaded.backstory = s.backstory;
      }
      if (loaded.tutorialDone === false && s.tutorialDone === true) {
        loaded.tutorialDone = true;
      }
      // Migrate: add pendingAchievements if missing
      if (!loaded.pendingAchievements) loaded.pendingAchievements = [];
      // Migrate: add market dynamics fields
      if (!loaded.marketPressure) loaded.marketPressure = {};
      if (loaded.activeMarketEvent === undefined) loaded.activeMarketEvent = null;
      if (!loaded.marketAlerts) loaded.marketAlerts = [];
      if (!loaded.triggeredAlerts) loaded.triggeredAlerts = [];
      // Migrate: racing & dealer state
      if (loaded.raceUsedToday === undefined) loaded.raceUsedToday = false;
      if (!loaded.vehiclePriceModifiers) loaded.vehiclePriceModifiers = {};
      if (loaded.dealerDeal === undefined) loaded.dealerDeal = null;
      // Migrate: golden hour state
      if (loaded.goldenHour === undefined) loaded.goldenHour = null;
      // Migrate: ammo stock system
      if (!loaded.ammoStock) {
        loaded.ammoStock = { '9mm': loaded.ammo || 0, '7.62mm': 0, 'shells': 0 };
      }
      if (loaded.ammoFactoryLevel === undefined) loaded.ammoFactoryLevel = 1;
      // Migrate: hospital & game over state
      if (loaded.hospitalizations === undefined) loaded.hospitalizations = 0;
      if (loaded.hospital === undefined) loaded.hospital = null;
      if (loaded.gameOver === undefined) loaded.gameOver = false;
      // Migrate: mini-game state
      if (loaded.pendingMinigame === undefined) loaded.pendingMinigame = null;
      // Migrate: drug empire state
      if (loaded.drugEmpire === undefined) loaded.drugEmpire = null;
      // Migrate: trade log
      if (!loaded.tradeLog) loaded.tradeLog = [];
      // Migrate: craft log
      if (!loaded.craftLog) loaded.craftLog = [];
      // Migrate: force hardcoreMode true (universal permadeath)
      loaded.hardcoreMode = true;
      if (loaded.prestigeResetCount === undefined) loaded.prestigeResetCount = 0;
      // Migrate: merit points
      if (loaded.meritPoints === undefined) loaded.meritPoints = 0;
      if (!loaded.meritNodes) loaded.meritNodes = {};
      // Migrate: black market & acquisition state
      if (loaded.blackMarketStock === undefined) loaded.blackMarketStock = null;
      if (loaded.dailyRewardStreak === undefined) loaded.dailyRewardStreak = 0;
      if (loaded.lastDailyRewardClaim === undefined) loaded.lastDailyRewardClaim = null;
      if (loaded.scrapMaterials === undefined) loaded.scrapMaterials = 0;
      if (loaded.pityCounter === undefined) loaded.pityCounter = 0;
      if (loaded.lootCratesPurchased === undefined) loaded.lootCratesPurchased = 0;
      if (loaded.lootBoxPity === undefined) loaded.lootBoxPity = 0;
      if (loaded.lootBoxesOpened === undefined) loaded.lootBoxesOpened = 0;
      if (loaded.lastLootBoxResult === undefined) loaded.lastLootBoxResult = null;
      if (loaded.activeDungeon === undefined) loaded.activeDungeon = null;
      if (loaded.lastDungeonResult === undefined) loaded.lastDungeonResult = null;
      if (loaded.dungeonsCompleted === undefined) loaded.dungeonsCompleted = 0;
      return loaded;
    }

    case 'TRADE': {
      if ((s.hidingDays || 0) > 0 || s.prison || s.hospital) return s;
      // Trading used to cost 2 energy and return silently at zero. Energy is not shown
      // anywhere since the RPG layer was retired, so the market simply stopped working
      // after ~50 trades with no message and no way to find out why.
      // Wanted check before trade
      if (Engine.isWanted(s) && !s.prison) {
        if (Engine.checkWantedArrest(s)) {
          addPhoneMessage(s, 'NHPD', `Gearresteerd tijdens een handelsactie! Je was GEZOCHT. Straf: ${s.prison?.daysRemaining} dagen.`, 'threat');
          s.screenEffect = 'blood-flash';
          return s;
        }
      }
      const moneyBefore = s.money;
      const invBefore = s.inventory[action.gid] || 0;
      const avgCostBefore = s.inventoryCosts[action.gid] || 0;
      const tradeResult = Engine.performTrade(s, action.gid, action.mode, action.quantity || 1);
      // performTrade no-ops (no money/inventory change) when the trade can't go through, e.g.
      // selling with empty inventory or buying with a full trunk/no capital — previously the
      // heat/rep/daily-challenge side effects below still applied unconditionally, letting a
      // no-op trade farm heat-free "trades" for challenge completion.
      if (!tradeResult.success) return s;
      // Moving goods is noticed. This went to `addVehicleHeat`, which writes to the
      // retired `ownedVehicles` array — so trading generated no heat at all, and the
      // market's heat surcharge was a tax you could never cause. It was then a flat point
      // per transaction, so forty crates were as quiet as one.
      Engine.addPersonalHeat(s, tradeHeat(action.mode, Math.abs(s.money - moneyBefore)));
      Engine.recomputeHeat(s);
      // District rep gain for trading
      s.districtRep[s.loc] = Math.min(100, (s.districtRep[s.loc] || 0) + 1);
      // Track reward for popup animation on sell
      if (action.mode === 'sell') {
        const earned = s.money - moneyBefore;
        if (earned > 0) {
          s.lastRewardAmount = earned;
        }
      }
      // === Trade Log Entry ===
      const tradedQty = Math.abs((s.inventory[action.gid] || 0) - invBefore);
      if (tradedQty > 0) {
        const moneyDiff = Math.abs(s.money - moneyBefore);
        const pricePerUnit = Math.round(moneyDiff / tradedQty);
        if (!s.tradeLog) s.tradeLog = [];
        s.tradeLog.unshift({
          id: `${s.day}-${Date.now()}-${action.gid}`,
          day: s.day,
          goodId: action.gid,
          mode: action.mode,
          quantity: tradedQty,
          pricePerUnit,
          totalPrice: moneyDiff,
          district: s.loc,
          profitPerUnit: action.mode === 'sell' ? pricePerUnit - avgCostBefore : undefined,
        });
        // Keep max 50 entries
        if (s.tradeLog.length > 50) s.tradeLog = s.tradeLog.slice(0, 50);
      }
      // Daily challenge tracking — count the actual traded quantity, not the requested one,
      // since a partial fill (capped by trunk space or available capital) traded fewer.
      if (s.dailyProgress) {
        s.dailyProgress.trades += tradedQty;
        if (action.mode === 'sell') {
          const tradeEarned = s.money - moneyBefore;
          if (tradeEarned > 0) s.dailyProgress.earned += tradeEarned;
        }
      }
      syncChallenges(s);
      return s;
    }

    case 'TRAVEL': {
      // Every refusal below used to be silent, and the fare was charged in a different
      // order than it was checked: energy went out and the 30s cooldown was set before
      // anyone asked whether you could pay, so a trip you could not afford still cost you
      // both. canTravel() answers all of it up front, and the screens ask it too.
      if (!canTravel(s, action.to)) return s;
      const cost = travelCost(s, action.to);
      if (!deductEnergy(s, ENERGY_COSTS.TRAVEL || TRAVEL_ENERGY)) return s;
      s.travelCooldownUntil = new Date(Date.now() + TRAVEL_COOLDOWN_MS).toISOString();
      // Wanted check before travel
      if (Engine.isWanted(s) && !s.prison) {
        if (Engine.checkWantedArrest(s)) {
          addPhoneMessage(s, 'NHPD', `Gearresteerd tijdens reizen! Je was GEZOCHT. Straf: ${s.prison?.daysRemaining} dagen.`, 'threat');
          s.screenEffect = 'blood-flash';
          return s;
        }
      }
      s.money -= cost;
      if (cost > 0) s.stats.totalSpent += cost;
      const speedBonus = Engine.getVehicleUpgradeBonus(s, 'speed');
      let travelHeat = 2;
      const activeV = VEHICLES.find(v => v.id === s.activeVehicle);
      if (activeV && (activeV.speed + speedBonus) >= 4) travelHeat = Math.floor(travelHeat * 0.5);
      if (s.crew.some(c => c.specialization === 'phantom')) travelHeat = Math.max(0, travelHeat - 1);
      // Speed upgrade level 3: extra heat reduction
      if (speedBonus >= 6) travelHeat = Math.max(0, travelHeat - 1);
      // Heat 2.0: travel heat goes to vehicle
      Engine.addVehicleHeat(s, travelHeat);
      Engine.recomputeHeat(s);
      s.loc = action.to;
      // Track visited districts for codex
      if (!s.visitedDistricts) s.visitedDistricts = [];
      if (!s.visitedDistricts.includes(action.to)) s.visitedDistricts.push(action.to);
      // Street events removed (MMO)
      // Roll for car theft encounter (15% base chance, only if no street event)
      if (!s.pendingStreetEvent && !s.pendingCarTheft && s.stolenCars.length < 8) {
        const carTheftChance = 0.15 + (s.player.level * 0.01);
        if (Math.random() < carTheftChance) {
          // Find cars available in this district
          const availableCars = STEALABLE_CARS.filter(c => c.districts.includes(action.to));
          if (availableCars.length > 0) {
            // Weight by rarity: common 50%, uncommon 30%, rare 15%, exotic 5%
            const weights: Record<string, number> = { common: 50, uncommon: 30, rare: 15, exotic: 5 };
            const totalWeight = availableCars.reduce((sum, c) => sum + (weights[c.rarity] || 10), 0);
            let roll = Math.random() * totalWeight;
            let picked = availableCars[0];
            for (const car of availableCars) {
              roll -= weights[car.rarity] || 10;
              if (roll <= 0) { picked = car; break; }
            }
            s.pendingCarTheft = { carTypeId: picked.id, district: action.to };
          }
        }
      }
      // Daily challenge tracking
      if (s.dailyProgress) {
        s.dailyProgress.travels++;
      }
      syncChallenges(s);
      return s;
    }

    case 'BUY_DISTRICT': {
      // Legacy: individual district buying disabled in gang-based system
      // Districts are now controlled via gang influence on the server
      return s;
    }

    case 'SPEND_MONEY': {
      const amt = (action as any).amount || 0;
      if (s.money < amt) return s;
      s.money -= amt;
      s.stats.totalSpent += amt;
      return s;
    }

    case 'TRAVEL_SELL_GOODS': {
      // Liquidates goods bought abroad (useTravel.ts) at their sellPrice — this table isn't
      // part of state.inventory (the travel goods use their own exotic ids like 'swiss_gold',
      // not GoodId), so the round-trip profit is credited directly here instead.
      const revenue = action.revenue || 0;
      if (revenue > 0) {
        s.money += revenue;
        s.stats.totalEarned += revenue;
      }
      return s;
    }

    // END_TURN removed — all day progression now goes through AUTO_TICK
    // Legacy dispatches are caught here and redirected
    case 'END_TURN' as any:
      // Falls through to AUTO_TICK for backwards compatibility (prison/hospital wait buttons)

    case 'AUTO_TICK': {
      // Automatic day progression — the ONLY way days advance in MMO
      if (s.gameOver || s.victoryData) return s;
      
      // === ENERGY/NERVE REGENERATION ===
      const now = Date.now();
      // Regenerate energy (1 per minute)
      if (s.energy < s.maxEnergy) {
        const energyRegenTime = s.energyRegenAt ? new Date(s.energyRegenAt).getTime() : 0;
        if (now >= energyRegenTime) {
          const minutesPassed = energyRegenTime > 0 ? Math.floor((now - energyRegenTime) / 60000) + 1 : 1;
          const regenAmount = Math.min(minutesPassed, s.maxEnergy - s.energy);
          s.energy = Math.min(s.maxEnergy, s.energy + regenAmount);
          if (s.energy < s.maxEnergy) {
            s.energyRegenAt = new Date(now + 60000).toISOString();
          } else {
            s.energyRegenAt = null as any;
          }
        }
      }
      // Regenerate nerve (1 per 2 minutes)
      if (s.nerve < s.maxNerve) {
        const nerveRegenTime = s.nerveRegenAt ? new Date(s.nerveRegenAt).getTime() : 0;
        if (now >= nerveRegenTime) {
          const minutesPassed = nerveRegenTime > 0 ? Math.floor((now - nerveRegenTime) / 120000) + 1 : 1;
          const regenAmount = Math.min(minutesPassed, s.maxNerve - s.nerve);
          s.nerve = Math.min(s.maxNerve, s.nerve + regenAmount);
          if (s.nerve < s.maxNerve) {
            s.nerveRegenAt = new Date(now + 120000).toISOString();
          } else {
            s.nerveRegenAt = null as any;
          }
        }
      }
      
      // Coming back to a locked "INGEREKEND" screen with no explanation is the kind of
      // thing that reads as a bug. Note the transition so the welcome-back report can
      // tell you what happened while you were gone.
      const wasInside = !!s.prison;
      const isCatchUp = !!(action as { isCatchUp?: boolean }).isCatchUp;
      Engine.endTurn(s);
      if (!wasInside && s.prison) {
        // Only a catch-up can leave the flag for the welcome-back card; setting it on a
        // live tick would make a stale "Opgepakt" line surface in the next catch-up.
        if (isCatchUp) s._catchUpArrest = { days: s.prison.totalSentence, moneyLost: s.prison.moneyLost };
        else {
          s.screenEffect = 'blood-flash';
          addPhoneMessage(s, 'NHPD', `Inval geslaagd. Je zit vast: ${s.prison.totalSentence} ${s.prison.totalSentence === 1 ? 'dag' : 'dagen'}. Je crew draait door zonder je.`, 'threat');
        }
      } else if (wasInside && !s.prison) {
        if (isCatchUp) s._catchUpReleased = true;
      }
      Engine.checkAchievements(s);
      // Codex unlock check
      try {
        if (!s.codex) s.codex = { unlockedEntries: [], readEntries: [], newEntries: [] };
        const { newUnlocks } = checkCodexUnlocks(s);
        if (newUnlocks.length > 0) {
          s.codex.unlockedEntries = [...s.codex.unlockedEntries, ...newUnlocks];
          s.codex.newEntries = [...s.codex.newEntries, ...newUnlocks];
          s._lastCodexUnlock = newUnlocks[newUnlocks.length - 1];
        }
      } catch (_) {}
      const oldPhaseAT = s.endgamePhase;
      s.endgamePhase = calculateEndgamePhase(s);

      if (oldPhaseAT !== s.endgamePhase) {
        const msg = getPhaseUpMessage(oldPhaseAT, s.endgamePhase);
        if (msg) addPhoneMessage(s, 'system', msg, 'info');
        if (s.endgamePhase === 'onderwerelds_koning') {
          addPhoneMessage(s, 'Commissaris Decker', 'Ik weet wie je bent. Ik weet wat je hebt gedaan. Geniet van je laatste dagen van vrijheid.', 'threat');
          addPhoneMessage(s, 'anonymous', '⚠️ Operatie Gerechtigheid is geactiveerd. De NHPD mobiliseert al haar middelen.', 'warning');
        }
      }

      // Street events removed (MMO)

      // Endgame events used to unlock here once you had subjugated all three
      // factions. Faction conquest is retired, so that gate can never open — the
      // long game now ends at handing the empire to a successor.

      // Story arcs — now handled via Campaign menu, no longer auto-triggered
      // if (!s.prison) { checkArcTriggers(s); if (!s.pendingStreetEvent) checkArcProgression(s); }
      
      // Car orders and stolen-car upkeep used to run here. The garage and chop shop
      // are no longer part of the game, and this block was messaging the player daily
      // about cars they had no way to steal, chop or deliver.
      
      // Daily challenges
      if (s.challengeDay !== s.day) {
        s.dailyChallenges = generateDailyChallenges(s);
        s.challengeDay = s.day;
        s.dailyProgress = { trades: 0, earned: 0, washed: 0, solo_ops: 0, contracts: 0, travels: 0, bribes: 0, faction_actions: 0, recruits: 0, cars_stolen: 0, casino_won: 0, hits_completed: 0 };
      }
      syncChallenges(s);
      
      // NPC encounters (phone messages only, no popups)
      if (!s.pendingArcEvent) {
        const npcEnc = rollNpcEncounter(s);
        if (npcEnc) addPhoneMessage(s, npcEnc.npcId, npcEnc.message, 'info');
      }
      const npcBonuses = applyNpcBonuses(s);
      if (npcBonuses.extraHeatDecay > 0) { Engine.addPersonalHeat(s, -npcBonuses.extraHeatDecay); Engine.recomputeHeat(s); }
      applyMissingNpcBonuses(s);
      
      // Week events, hits, news
      const weekEvt = checkWeekEvent(s);
      if (weekEvt) (s as any).activeWeekEvent = weekEvt;
      processWeekEvent(s);
      // Hit contracts are no longer generated (the hitman board is retired), and the
      // daily ammo trickle went with it — there is nothing left to shoot.
      s.dailyNews = generateDailyNews(s);
      
      // The vehicle layer lived here: race cooldowns, daily price drift across the
      // dealership, discount offers and unique-vehicle unlocks. Vehicles cannot be
      // bought, raced or swapped any more, and the unlock checks hung off retired
      // progression (final boss, faction conquest, nemesis generations).
      // Cinematics
      if (!s.pendingCinematic) {
        if (s.prison) { const c = checkCinematicTrigger(s, 'arrested'); if (c) s.pendingCinematic = c; }
        if (!s.pendingCinematic && s.nightReport?.crewDefections && s.nightReport.crewDefections.length > 0) {
          const c = checkCinematicTrigger(s, 'crew_defected'); if (c) s.pendingCinematic = c;
        }
        if (!s.pendingCinematic) { const c = checkCinematicTrigger(s); if (c) s.pendingCinematic = c; }
      }
      
      // ========== LOCAL MMO WORLD SIMULATION ==========
      // Advance the bot population one day so the world keeps living around the player.
      if (s.world) {
        try {
          const stepSummary = simulateWorldDay(s.world, s.day, Date.now());
          s._lastWorldSummary = stepSummary;
          // During catch-up (multiple ticks at once), accumulate the notable world events so
          // the "while you were away" report can surface what changed in the world.
          if ((action as any).isCatchUp) {
            if (!s._catchUpWorldHeadlines) s._catchUpWorldHeadlines = [];
            for (const line of [...stepSummary.districtCaptures, ...stepSummary.warsResolved]) {
              if (s._catchUpWorldHeadlines.length < 6) s._catchUpWorldHeadlines.push(line);
            }
          }
        } catch (e) {
          console.error('World sim error:', e);
        }

        // Settle any player-listed auctions that have ended: pay out sales (5% house fee)
        // or return unsold items to the player, then drop them from the world.
        if (s.world.auctions?.some(a => a.sellerBotId === null && (a.status !== 'active' || s.day >= a.endsDay))) {
          const remaining: typeof s.world.auctions = [];
          for (const auc of s.world.auctions) {
            const ended = auc.status !== 'active' || s.day >= auc.endsDay;
            if (auc.sellerBotId === null && ended) {
              if (auc.topBidderId && auc.topBidderId !== 'player') {
                const proceeds = Math.floor(auc.currentBid * 0.95);
                s.money += proceeds;
                s.stats.totalEarned += proceeds;
                addPhoneMessage(s, 'system', `Veiling verkocht: ${auc.itemName} voor €${auc.currentBid.toLocaleString()} (netto €${proceeds.toLocaleString()}).`, 'opportunity');
              } else {
                if (auc.itemType === 'vehicle') {
                  if (!s.ownedVehicles.some(v => v.id === auc.itemId)) {
                    s.ownedVehicles.push({ id: auc.itemId, condition: 100, vehicleHeat: 0, rekatCooldown: 0 });
                  }
                } else if (!s.ownedGear.includes(auc.itemId)) {
                  s.ownedGear.push(auc.itemId);
                }
                addPhoneMessage(s, 'system', `Veiling verlopen: ${auc.itemName} kwam terug in je bezit.`, 'info');
              }
              continue; // settled — remove from the world
            }
            remaining.push(auc);
          }
          s.world.auctions = remaining;
        }
      }

      // ========== PLAYER ORGANIZATION ECONOMY ==========
      // Controlled districts pay out; soldiers must be paid. Missed payroll bleeds
      // loyalty, and a soldier who hits zero loyalty walks out.
      // Collect notable org events for the "while you were away" catch-up report.
      const isCatchUpTick = !!(action as { isCatchUp?: boolean }).isCatchUp;
      const orgLog = (line: string) => {
        if (!isCatchUpTick || !s.org) return;
        if (!s._catchUpOrgHeadlines) s._catchUpOrgHeadlines = [];
        if (s._catchUpOrgHeadlines.length < 6) s._catchUpOrgHeadlines.push(line);
      };
      const orgRankBefore = s.org ? orgRank(s.org).id : null;
      if (s.org) {
        const income = orgDailyIncome(s.org);
        const upkeep = orgDailyUpkeep(s.org);
        const regen = orgDailyLoyaltyRegen(s.org);
        if (income > 0) { s.money += income; s.stats.totalEarned += income; }
        // Territory earns passive reputation (your name spreads across your turf).
        const orgRep = orgDailyRep(s.org);
        if (orgRep > 0) s.rep += orgRep;
        if (s.money >= upkeep) {
          s.money -= upkeep;
          // Payroll met: loyalty holds and slowly recovers with any Erecode upgrade.
          for (const m of s.org.members) m.loyalty = Math.min(100, m.loyalty + regen);
        } else if (upkeep > 0) {
          // Can't make payroll — morale collapses.
          for (const m of s.org.members) m.loyalty = Math.max(0, m.loyalty - 15);
          addPhoneMessage(s, 'system', `Je kon de loonlijst van [${s.org.tag}] niet betalen. De loyaliteit daalt.`, 'warning');
        }
        const leavers = s.org.members.filter(m => m.loyalty <= 0);
        if (leavers.length > 0) {
          s.org.members = s.org.members.filter(m => m.loyalty > 0);
          addPhoneMessage(s, 'system', `${leavers.map(m => m.name).join(', ')} verliet de organisatie.`, 'threat');
          orgLog(`💔 ${leavers.map(m => m.name).join(', ')} verliet de organisatie`);
        }
      }

      // ========== RACKETS — your crew works Noxhaven ==========
      // Each member runs a racket in a specific district: it pays, it heats you up,
      // and it draws the attention of whoever considers that turf theirs. Members
      // left resting recover their loyalty instead.
      if (s.org && s.org.members.length > 0) {
        const rt = resolveRacketTick(s.org);
        if (rt.money > 0) {
          const g = Math.floor(rt.money * legacyIncomeMult(s));
          s.money += g; s.stats.totalEarned += g;
          if (isCatchUpTick) s._catchUpEarned = (s._catchUpEarned || 0) + g;
        }
        if (rt.respect > 0) s.org.respect += rt.respect;
        if (rt.loyaltyRegen > 0) {
          for (const m of s.org.members) {
            if (!m.assignment) m.loyalty = Math.min(100, m.loyalty + rt.loyaltyRegen);
          }
        }
        if (rt.heat !== 0) { Engine.addPersonalHeat(s, rt.heat); Engine.recomputeHeat(s); }
        // Your network quietly absorbs some heat and cools every district down.
        const shield = equipHeatShield(s);
        if (shield > 0) { Engine.addPersonalHeat(s, -shield); Engine.recomputeHeat(s); }
        for (const line of rt.notes) orgLog(`💼 ${line}`);

        // Rival attention builds where you work, and bleeds off everywhere else.
        if (!s.districtAttention) s.districtAttention = {};
        const att = s.districtAttention;
        for (const d of Object.keys(DISTRICTS) as import('@/game/types').DistrictId[]) {
          const added = rt.attention[d] || 0;
          const next = (att[d] || 0) + added - ATTENTION_DECAY_PER_DAY - equipHeatShield(s);
          att[d] = Math.max(0, Math.min(100, next));
        }

        // Injured crew recover over time.
        for (const m of s.org.members) {
          if (m.injuredUntilDay && s.day >= m.injuredUntilDay) m.injuredUntilDay = undefined;
        }
      }

      // ========== HEAT COOLS ON ITS OWN ==========
      // The streets forget. Without this, heat only ever came down through Netwerk
      // gear, laundering crew or a bribe — so a player without those watched it climb
      // forever with no way back, which is a trap rather than a tension.
      if ((s.personalHeat || 0) > 0) {
        Engine.addPersonalHeat(s, -HEAT_BASE_DECAY);
        Engine.recomputeHeat(s);
      }

      // ========== INCIDENTS — the world answers back ==========
      // Only one situation waits for you at a time; a pending decision blocks new ones.
      if (!s.activeIncident) {
        const incident = rollIncident(s, Math.random);
        if (incident) {
          s.activeIncident = incident;
          orgLog(`❗ ${incident.title}`);
          addPhoneMessage(s, 'system', incident.title, incident.kind === 'kans' ? 'opportunity' : 'threat');
        }
      }

      // ========== AUTO-FENCE — the passive contraband market ==========
      if (autoFenceActive(s)) {
        const seized = Math.random() < AUTO_FENCE_SEIZURE_CHANCE;
        if (seized) {
          Engine.addPersonalHeat(s, AUTO_FENCE_HEAT * 3);
          Engine.recomputeHeat(s);
          orgLog(`📦 Een smokkelzending werd onderschept`);
        } else {
          const profit = Math.floor(autoFenceIncome(s) * legacyIncomeMult(s));
          if (profit > 0) {
            s.money += profit;
            s.stats.totalEarned += profit;
            if (isCatchUpTick) s._catchUpEarned = (s._catchUpEarned || 0) + profit;
            orgLog(`📦 Auto-fence smokkelde €${profit.toLocaleString()} binnen`);
          }
          Engine.addPersonalHeat(s, AUTO_FENCE_HEAT);
          Engine.recomputeHeat(s);
        }
      }

      // ========== HEAT RAID — the idle risk ==========
      // Let the empire run too hot and the police kick the door in: you lose cash,
      // maybe a district, and the heat resets. This is the pressure you idle-manage
      // by keeping crew on the laundering racket.
      if ((s.personalHeat || 0) >= HEAT_RAID_THRESHOLD && s.policeRel < 60) {
        const lossPct = 0.2 + Math.random() * 0.2;
        const lost = Math.floor(s.money * lossPct);
        s.money = Math.max(0, s.money - lost);
        let districtLine = '';
        if (s.org && s.org.controlledDistricts.length > 0 && Math.random() < 0.4) {
          const dropped = s.org.controlledDistricts.pop()!;
          districtLine = ` en verloor ${DISTRICTS[dropped]?.name || dropped}`;
        }
        s.personalHeat = 35;
        Engine.recomputeHeat(s);
        addPhoneMessage(s, 'system', `🚔 INVAL! De politie viel binnen — je verloor €${lost.toLocaleString()}${districtLine}.`, 'threat');
        orgLog(`🚔 Politie-inval: −€${lost.toLocaleString()}${districtLine}`);
      }

      // ========== RIVAL GANGS FIGHT BACK ==========
      // The world reacts to your organization: each day a rival gang may try to
      // retake one of your districts. More territory = more heat = more attempts.
      if (s.org && s.world && s.org.controlledDistricts.length > 0) {
        // Allies keep the peace; sworn enemies press harder and more often.
        const candidates = s.world.gangs.filter(g => orgRelation(s.org, g.id) !== 'ally');
        const enemies = candidates.filter(g => orgRelation(s.org, g.id) === 'enemy');
        // Allies rush to your aid, lending a share of their strength to the defence.
        const allies = s.world.gangs.filter(g => orgRelation(s.org, g.id) === 'ally');
        const allySupport = orgAllySupport(allies.map(g => g.power));
        const attemptChance = 0.2 + s.org.controlledDistricts.length * 0.08 + enemies.length * 0.06;
        if (candidates.length > 0 && Math.random() < attemptChance) {
          const orgPow = orgPower(s.org);
          const contested = s.org.controlledDistricts[Math.floor(Math.random() * s.org.controlledDistricts.length)];
          // Enemies strike first; otherwise a landless gang hungry for turf, else the strongest.
          const landless = candidates.filter(g => !g.controlledDistrict);
          const pool = enemies.length > 0 ? enemies : (landless.length > 0 ? landless : candidates);
          const aggressor = pool.reduce((a, b) => (b.power > a.power ? b : a), pool[0]);
          if (aggressor) {
            const distName = DISTRICTS[contested]?.name || contested;
            // You defend with a rank-scaled home advantage, plus any allied backup.
            const gangWins = resolveOrgAttack(aggressor.power, orgPow * orgDefenseAdvantage(s.org) + allySupport, Math.random);
            if (gangWins) {
              s.org.controlledDistricts = s.org.controlledDistricts.filter(d => d !== contested);
              aggressor.controlledDistrict = contested as import('@/game/types').DistrictId;
              aggressor.power += 10;
              s.org.respect = Math.max(0, s.org.respect - 8);
              for (const m of s.org.members) m.loyalty = Math.max(0, m.loyalty - 6);
              addPhoneMessage(s, 'system', `${aggressor.name} heeft ${distName} heroverd op je organisatie!`, 'threat');
              orgLog(`🏴 ${aggressor.name} heroverde ${distName}`);
            } else {
              aggressor.power = Math.max(10, aggressor.power - 6);
              s.org.respect += 4;
              const backup = allySupport > 0 ? ` Bondgenoten stonden je bij (+${allySupport} kracht).` : '';
              addPhoneMessage(s, 'system', `Je bemanning sloeg een aanval van ${aggressor.name} op ${distName} af.${backup}`, 'opportunity');
              orgLog(`🛡️ Aanval van ${aggressor.name} op ${distName} afgeslagen${allySupport > 0 ? ' (met bondgenoten)' : ''}`);
            }
          }
        }
      }

      // Organisation rank-up during the away period.
      if (s.org && orgRankBefore && orgRank(s.org).id !== orgRankBefore) {
        orgLog(`⭐ Organisatie promoveerde tot ${orgRank(s.org).name}`);
      }

      // Update lastTickAt timestamp
      s.lastTickAt = new Date().toISOString();

      // Auto-dismiss night report after setting it (make it non-blocking)
      // The night report will auto-dismiss in 8 seconds via the NightReport component
      return s;
    }

    case 'DISMISS_NIGHT_REPORT': {
      s.nightReport = null;
      return s;
    }

    case 'SET_CATCH_UP_REPORT': {
      if (action.report) {
        // Fold in the world + organisation headlines the catch-up ticks accumulated.
        const headlines = s._catchUpWorldHeadlines || [];
        const orgHeadlines = s._catchUpOrgHeadlines || [];
        // The caller can only estimate earnings from a stale render, and it used to
        // add up front-business income only — which is unreachable content, so the
        // report showed €0 while your rackets and fence had earned thousands. The
        // ticks themselves tallied the real figure, so prefer that.
        const earned = s._catchUpEarned || 0;
        (s as any).catchUpReport = {
          ...action.report,
          moneyEarned: earned > 0 ? earned : action.report.moneyEarned,
          worldHeadlines: headlines,
          orgHeadlines,
          arrested: s._catchUpArrest || undefined,
          released: s._catchUpReleased || undefined,
        };
      } else {
        (s as any).catchUpReport = null;
      }
      s._catchUpWorldHeadlines = [];
      s._catchUpOrgHeadlines = [];
      s._catchUpEarned = 0;
      s._catchUpArrest = null;
      s._catchUpReleased = false;
      return s;
    }

    case 'RECRUIT': {
      Engine.recruit(s);
      // NG+ veteran crew bonus: first crew starts with +20 loyalty
      if (s._ngPlusExclusiveFlags?.veteranCrewBonus && s.crew.length > 0) {
        const newest = s.crew[s.crew.length - 1];
        if (newest.loyalty !== undefined) newest.loyalty = Math.min(100, (newest.loyalty || 50) + 20);
      }
      if (s.dailyProgress) { s.dailyProgress.recruits++; }
      syncChallenges(s);
      return s;
    }

    case 'HEAL_CREW': {
      Engine.healCrew(s, action.crewIndex);
      return s;
    }

    case 'FIRE_CREW': {
      // Remove crew from game
      Engine.fireCrew(s, action.crewIndex);
      return s;
    }

    case 'UPGRADE_STAT': {
      const statPts = s.player.statPoints || 0;
      if (statPts <= 0) return s;
      s.player.stats[action.stat]++;
      s.player.statPoints = statPts - 1;
      // Sync max HP when muscle changes
      if (action.stat === 'muscle') {
        const oldMax = s.playerMaxHP;
        Engine.syncPlayerMaxHP(s);
        const hpGain = s.playerMaxHP - oldMax;
        if (hpGain > 0) s.playerHP = Math.min(s.playerMaxHP, s.playerHP + hpGain);
      }
      return s;
    }

    case 'GYM_TRAIN': {
      // Local gym training — trains strength/defense/speed/dexterity (separate from the
      // muscle/brains/charm stat points) in exchange for energy. Gain scales with the gym's
      // multiplier and whether the chosen stat is that gym's focus.
      const GYM_ENERGY = 5;
      if ((s.energy || 0) < GYM_ENERGY) return s;
      if ((s.hidingDays || 0) > 0 || s.prison || s.hospital) return s;
      if (!s.gymStats) s.gymStats = { strength: 1, defense: 1, speed: 1, dexterity: 1 };
      const gymMults: Record<string, { mult: number; focus: string }> = {
        lowrise_gym: { mult: 1.0, focus: 'strength' },
        port_gym: { mult: 1.1, focus: 'defense' },
        iron_gym: { mult: 1.25, focus: 'speed' },
        neon_gym: { mult: 1.5, focus: 'dexterity' },
        crown_gym: { mult: 2.0, focus: 'all' },
      };
      const gym = gymMults[action.gymId] || { mult: 1.0, focus: 'all' };
      const isFocus = gym.focus === action.gymStat || gym.focus === 'all';
      const baseGain = isFocus ? 2 : 1;
      const gain = Math.max(1, Math.floor(baseGain * gym.mult * (0.8 + Math.random() * 0.4)));
      s.gymStats[action.gymStat] = (s.gymStats[action.gymStat] || 1) + gain;
      s.energy = Math.max(0, (s.energy || 0) - GYM_ENERGY);
      if (s.energy < s.maxEnergy && !s.energyRegenAt) s.energyRegenAt = new Date(Date.now() + 60000).toISOString();
      s._lastGymGain = { stat: action.gymStat, gain };
      return s;
    }

    case 'APPLY_JOB': {
      const jobDef = JOBS.find(j => j.id === action.jobId);
      if (!jobDef) return s;
      if (s.job) return s; // already employed
      if (s.player.level < jobDef.reqLevel) return s;
      if (jobDef.reqStat && (s.player.stats[jobDef.reqStat.stat] || 0) < jobDef.reqStat.value) return s;
      s.job = { currentJob: jobDef.id, daysWorked: 0, promotion: 0, lastWorkedDay: 0 };
      return s;
    }

    case 'WORK_JOB': {
      if (!s.job) return s;
      if (s.job.lastWorkedDay === s.day) return s; // already worked today
      const jobDef = JOBS.find(j => j.id === s.job!.currentJob);
      if (!jobDef) return s;
      const salary = getJobSalary(jobDef, s.job.promotion);
      s.money += salary;
      s.stats.totalEarned += salary;
      s.job.daysWorked += 1;
      s.job.promotion = Math.floor(s.job.daysWorked / 10);
      s.job.lastWorkedDay = s.day;
      s._lastJobPay = salary;
      return s;
    }

    case 'QUIT_JOB': {
      s.job = null;
      return s;
    }

    case 'BUY_GEAR': {
      const item = GEAR.find(g => g.id === action.id);
      if (!item || s.ownedGear.includes(action.id)) return s;
      let price = item.cost;
      if (s.heat > 50) price = Math.floor(price * 1.2);
      if (s.money < price) return s;
      s.money -= price;
      s.stats.totalSpent += price;
      s.ownedGear.push(action.id);
      Engine.checkAchievements(s);
      return s;
    }

    case 'EQUIP': {
      const item = GEAR.find(g => g.id === action.id);
      if (!item || !s.ownedGear.includes(action.id)) return s;
      s.player.loadout[item.type] = action.id;
      return s;
    }

    case 'UNEQUIP': {
      const slot = action.slot as 'weapon' | 'armor' | 'gadget';
      s.player.loadout[slot] = null;
      return s;
    }

    case 'BUY_VEHICLE': {
      const v = VEHICLES.find(v => v.id === action.id);
      if (!v) return s;
      const cost = action.discountedCost ?? v.cost;
      if (s.money < cost) return s;
      s.money -= cost;
      s.stats.totalSpent += cost;
      s.ownedVehicles.push({ id: action.id, condition: 100, vehicleHeat: 0, rekatCooldown: 0 });
      Engine.checkAchievements(s);
      return s;
    }

    case 'SET_VEHICLE': {
      if (s.ownedVehicles.some(v => v.id === action.id)) {
        s.activeVehicle = action.id;
        s.maxInv = Engine.recalcMaxInv(s);
      }
      return s;
    }

    case 'REPAIR_VEHICLE': {
      const activeObj = s.ownedVehicles.find(v => v.id === s.activeVehicle);
      if (!activeObj) return s;
      const cost = (100 - activeObj.condition) * 25;
      if (s.money < cost) return s;
      s.money -= cost;
      s.stats.totalSpent += cost;
      activeObj.condition = 100;
      return s;
    }

    case 'BUY_UPGRADE': {
      // Legacy — HQ upgrades migrated to villa modules, kept for save compat
      return s;
    }

    case 'BUY_BUSINESS': {
      const biz = BUSINESSES.find(b => b.id === action.id);
      if (!biz || s.ownedBusinesses.includes(action.id) || s.money < biz.cost) return s;
      // Validate endgame requirements
      if (biz.reqDistrict && !s.ownedDistricts.includes(biz.reqDistrict)) return s;
      if (biz.reqRep && s.rep < biz.reqRep) return s;
      if (biz.reqDay && s.day < biz.reqDay) return s;
      if (biz.reqBusinessCount && s.ownedBusinesses.length < biz.reqBusinessCount) return s;
      s.money -= biz.cost;
      s.stats.totalSpent += biz.cost;
      s.ownedBusinesses.push(action.id);
      return s;
    }

    case 'BRIBE_POLICE': {
      const charm = Engine.getPlayerStat(s, 'charm');
      const cost = Math.max(1500, 4000 - (charm * 150));
      if (s.money < cost) return s;
      s.money -= cost;
      s.stats.totalSpent += cost;
      s.policeRel = Math.min(100, s.policeRel + 15);
      // Heat 2.0: bribe only reduces personal heat, and less effectively
      Engine.addPersonalHeat(s, -10);
      Engine.recomputeHeat(s);
      if (s.dailyProgress) { s.dailyProgress.bribes++; }
      syncChallenges(s);
      return s;
    }

    case 'WASH_MONEY': {
      if ((s.hidingDays || 0) > 0) return s;
      if (s.dirtyMoney <= 0) return s;
      // Was previously capped at a flat 3000 + districts*1000 that ignored washUsedToday
      // entirely (district perk was also removed elsewhere, see getWashCapacity) — that let
      // this quick-wash button bypass the daily laundering limit WASH_MONEY_AMOUNT enforces,
      // by repeatedly washing the full cap multiple times per day.
      const washCap = Engine.getWashCapacity(s);
      const amount = Math.min(s.dirtyMoney, washCap.remaining);
      if (amount <= 0) return s;
      s.dirtyMoney -= amount;
      const clean = Math.floor(amount * WASH_KEEP_RATE);
      s.money += clean;
      s.stats.totalEarned += clean;
      s.washUsedToday = (s.washUsedToday || 0) + amount;
      // Laundering no longer adds heat. It used to, which directly contradicted the
      // Witwasserij racket — the whole point of putting crew on laundering is that it
      // *cools* you down. The 15% the launderers keep is the cost of the service.
      Engine.gainXp(s, Math.max(1, Math.floor(amount / 200)));
      if (s.dailyProgress) { s.dailyProgress.washed += amount; }
      syncChallenges(s);
      return s;
    }

    case 'WASH_MONEY_AMOUNT': {
      if ((s.hidingDays || 0) > 0) return s;
      if (s.dirtyMoney <= 0 || action.amount <= 0) return s;
      const washCap = Engine.getWashCapacity(s);
      const maxWash = Math.min(s.dirtyMoney, washCap.remaining);
      const washAmt = Math.min(action.amount, maxWash);
      if (washAmt <= 0) return s;
      s.dirtyMoney -= washAmt;
      // Laundering adds no heat — that contradicted the Witwasserij racket, whose
      // whole purpose is to cool you down. The launderers' cut is the cost. The old
      // Neon district bonus is gone with district ownership.
      const cleanAmt = Math.floor(washAmt * WASH_KEEP_RATE);
      s.money += cleanAmt;
      s.stats.totalEarned += cleanAmt;
      s.washUsedToday = (s.washUsedToday || 0) + washAmt;
      Engine.gainXp(s, Math.max(1, Math.floor(washAmt / 200)));
      if (s.dailyProgress) { s.dailyProgress.washed += washAmt; }
      syncChallenges(s);
      return s;
    }

    case 'BUY_GEAR_DEAL': {
      const dealItem = GEAR.find(g => g.id === action.id);
      if (!dealItem || s.ownedGear.includes(action.id)) return s;
      if (s.money < action.price) return s;
      s.money -= action.price;
      s.stats.totalSpent += action.price;
      s.ownedGear.push(action.id);
      return s;
    }

    case 'SOLO_OP': {
      if ((s.hidingDays || 0) > 0 || s.prison) return s;
      // Cooldown check
      if (isCooldownActive(s.crimeCooldownUntil)) return s;
      // Energy + Nerve cost
      if (!deductEnergy(s, ENERGY_COSTS.SOLO_OP || 10)) return s;
      if (!deductNerve(s, NERVE_COSTS.SOLO_OP || 5)) return s;
      // Set crime cooldown (60 seconds)
      s.crimeCooldownUntil = new Date(Date.now() + 60000).toISOString();
      const soloOpDef = SOLO_OPERATIONS.find(o => o.id === action.opId);
      const soloResult = Engine.performSoloOp(s, action.opId);
      // Store near-miss for toast display (transient)
      if (soloResult.nearMiss) (s as any)._nearMiss = soloResult.nearMiss;
      Engine.recomputeHeat(s);
      s.districtRep[s.loc] = Math.min(100, (s.districtRep[s.loc] || 0) + 5);
      Engine.checkAchievements(s);
      // Arrest chance on failed solo op
      if (!soloResult.success && soloOpDef) {
        const risk = soloOpDef.risk;
        let arrestChance = risk > 70 ? PRISON_ARREST_CHANCE_HIGH_RISK : PRISON_ARREST_CHANCE_MISSION;
        const charm = Engine.getPlayerStat(s, 'charm');
        arrestChance -= charm * 0.02;
        if (arrestChance > 0 && Math.random() < arrestChance && !s.prison) {
          const report: any = {};
          Engine.arrestPlayer(s, report);
          addPhoneMessage(s, 'NHPD', `Je bent gearresteerd na een mislukte operatie! Straf: ${s.prison?.daysRemaining} dagen.`, 'threat');
          s.screenEffect = 'blood-flash';
        }
      }
      // Street events removed (MMO)
      if (s.dailyProgress) { s.dailyProgress.solo_ops++; }
      syncChallenges(s);
      return s;
    }

    case 'EXECUTE_CONTRACT': {
      Engine.executeContract(s, action.contractId, action.crewIndex);
      Engine.checkAchievements(s);
      return s;
    }

    case 'BUY_CHEMICALS': {
      const cost = action.amount * 50;
      if (s.money < cost) return s;
      s.money -= cost;
      s.stats.totalSpent += cost;
      s.lab.chemicals += action.amount;
      return s;
    }

    case 'SET_TUTORIAL_DONE':
      s.tutorialDone = true;
      return s;

    case 'CLAIM_DAILY_REWARD': {
      s.dailyRewardClaimed = true;
      const today = new Date().toDateString();
      if (s.lastLoginDay === today) return s;
      s.lastLoginDay = today;
      const streak = Math.min(s.loginStreak + 1, 7);
      s.loginStreak = streak;
      const rewards = [500, 1000, 2000, 3000, 5000, 8000, 15000];
      const reward = rewards[streak - 1] || 500;
      s.money += reward;
      s.stats.totalEarned += reward;
      return s;
    }

    case 'CASINO_BET': {
      if (s.money < action.amount) return s;
      s.money -= action.amount;
      s.stats.casinoLost += action.amount;
      return s;
    }

    /**
     * One hand settled, as a delta.
     *
     * The casino used to write an absolute balance with SET_MONEY, computed from a ref
     * in the view. Three things were wrong with that: casinoWon/casinoLost never moved
     * (so the profile reported €0 won forever), the money never reached totalEarned or
     * totalSpent, and an absolute write racing a day tick could overwrite the racket
     * income that landed while you were mid-hand.
     */
    case 'CASINO_RESULT': {
      const delta = Math.round(action.amount || 0);
      if (delta > 0) {
        s.money += delta;
        s.stats.casinoWon += delta;
        s.stats.totalEarned += delta;
        if (s.dailyProgress) s.dailyProgress.casino_won += delta;
        syncChallenges(s);
      } else if (delta < 0) {
        const lost = Math.min(s.money, -delta);
        s.money -= lost;
        s.stats.casinoLost += lost;
        s.stats.totalSpent += lost;
      }
      // Some games carry more than money — a gunshot in a back room brings the police.
      if (action.heat) {
        Engine.addPersonalHeat(s, action.heat);
        Engine.recomputeHeat(s);
      }
      Engine.checkAchievements(s);
      return s;
    }

    case 'CASINO_WIN': {
      s.money += action.amount;
      s.stats.casinoWon += action.amount;
      if (s.dailyProgress) { s.dailyProgress.casino_won += action.amount; }
      syncChallenges(s);
      return s;
    }

    case 'TRACK_BLACKJACK_WIN': {
      s.stats.blackjackStreak = (s.stats.blackjackStreak || 0) + 1;
      return s;
    }

    case 'RESET_BLACKJACK_STREAK': {
      s.stats.blackjackStreak = 0;
      return s;
    }

    case 'TRACK_HIGHLOW_ROUND': {
      s.stats.highLowMaxRound = Math.max(s.stats.highLowMaxRound || 0, action.round);
      return s;
    }

    case 'JACKPOT_ADD': {
      s.casinoJackpot = (s.casinoJackpot || 10000) + action.amount;
      return s;
    }

    case 'JACKPOT_RESET': {
      s.casinoJackpot = 10000;
      return s;
    }

    case 'SET_MONEY': {
      s.money = action.amount;
      return s;
    }

    case 'START_COMBAT': {
      // Cooldown check
      if (isCooldownActive(s.attackCooldownUntil)) return s;
      // Energy + Nerve cost
      if (!deductEnergy(s, ENERGY_COSTS.START_COMBAT || 8)) return s;
      if (!deductNerve(s, NERVE_COSTS.START_COMBAT || 10)) return s;
      // Set attack cooldown (2 minutes)
      s.attackCooldownUntil = new Date(Date.now() + 120000).toISOString();
      const combat = Engine.startCombat(s, action.familyId);
      if (combat) s.activeCombat = combat;
      return s;
    }

    case 'START_NEMESIS_COMBAT': {
      const combat = startNemesisCombat(s);
      if (combat) s.activeCombat = combat;
      return s;
    }

    case 'NEGOTIATE_NEMESIS': {
      const result = negotiateNemesis(s);
      if (!result.success) return s; // toast handled in component
      return s;
    }

    case 'SCOUT_NEMESIS': {
      const result = scoutNemesis(s);
      if (!result.success) return s;
      return s;
    }

    case 'NEMESIS_DEFEAT_CHOICE': {
      const nem = s.nemesis;
      if (!nem) return s;
      nem.pendingDefeatChoice = false;
      nem.defeatChoice = action.choice;
      
      const archTaunts = NEMESIS_TAUNTS[nem.archetype];
      
      switch (action.choice) {
        case 'execute':
          s.rep += 50;
          Engine.splitHeat(s, 15, 0.7);
          // Next successor spawns faster and is angry
          nem.nextSpawnDay = Math.max(s.day + 1, nem.nextSpawnDay - 5);
          addPhoneMessage(s, 'anonymous', `Je hebt ${nem.name} geëxecuteerd. De straten sidderen. Maar zijn opvolger zal wraak willen...`, 'warning');
          break;
        case 'exile':
          addPhoneMessage(s, 'anonymous', `${nem.name} is verbannen uit Noxhaven. Een neutrale opvolger zal verschijnen.`, 'info');
          break;
        case 'recruit':
          s.rep -= 25;
          // Reveal next archetype
          const archetypes: import('../game/types').NemesisArchetype[] = ['zakenman', 'brute', 'schaduw', 'strateeg'];
          const nextArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];
          nem.informantArchetype = nextArchetype;
          const archDef = NEMESIS_ARCHETYPES.find(a => a.id === nextArchetype);
          addPhoneMessage(s, 'informant', `${nem.name} werkt nu als informant. De volgende rivaal wordt een ${archDef?.icon} ${archDef?.name}.`, 'opportunity');
          // Longer spawn delay (informant keeps things calm)
          nem.nextSpawnDay = Math.max(nem.nextSpawnDay, s.day + 15);
          break;
      }
      return s;
    }

    case 'COMBAT_ACTION': {
      if (!s.activeCombat) return s;
      handleCombatAction(s, action.action, action.skillId);
      return s;
    }

    case 'SET_COMBAT_STANCE': {
      if (s.activeCombat && !s.activeCombat.finished) {
        s.activeCombat.stance = action.stance;
      }
      return s;
    }

    case 'END_COMBAT': {
      // Persist remaining HP back to state
      if (s.activeCombat) {
        if (s.activeCombat.won) {
          // Won: keep remaining HP (min 1)
          s.playerHP = Math.max(1, s.activeCombat.playerHP);
        } else {
          // Only final boss combat is lethal (permadeath)
          const isFinalBoss = s.activeCombat.bossPhase !== undefined;
          if (isFinalBoss) {
            s.gameOver = true;
            s.playerHP = 0;
          } else {
            // Knocked out — recover with penalties (not permadeath)
            s.playerHP = Math.max(1, Math.floor((s.playerMaxHP || 100) * 0.25));
            const moneyLost = Math.floor(s.money * 0.15);
            s.money -= moneyLost;
            s.rep = Math.max(0, s.rep - 10);
            addPhoneMessage(s, 'anonymous',
              `Je bent knocked out door ${s.activeCombat.targetName}. Je verloor €${moneyLost.toLocaleString()} en wat reputatie terwijl je bewusteloos was.`,
              'warning'
            );
          }
          s.hospitalizations = (s.hospitalizations || 0) + 1;
        }
        // Check nemesis wounded revenge (player lost nemesis combat)
        if (s.activeCombat?.isNemesis && !s.activeCombat.won && s.nemesis?.alive) {
          // Sync nemesis HP from combat
          s.nemesis.hp = s.activeCombat.targetHP;
          checkNemesisWoundedRevenge(s);
        }
      }
      const wasFinalBoss = s._finalBossWon;
      delete s._finalBossWon;
      // Cinematic triggers on combat end
      if (s.activeCombat?.won) {
        const combatCinematic = checkCinematicTrigger(s, 'combat_won');
        if (combatCinematic) s.pendingCinematic = combatCinematic;
        // Mastery XP for equipped weapon
        const masteryWpn = s.weaponInventory?.find(w => w.equipped);
        if (masteryWpn) {
          const xpGain = 10 + Math.floor(s.player.level * 1.5);
          masteryWpn.masteryXp = (masteryWpn.masteryXp || 0) + xpGain;
        }
        // Mastery XP for equipped gear
        const gearXpGain = 8 + Math.floor(s.player.level * 1.2);
        const masteryArmor = s.armorInventory?.find(g => g.equipped);
        if (masteryArmor) masteryArmor.masteryXp = (masteryArmor.masteryXp || 0) + gearXpGain;
        const masteryGadget = s.gadgetInventory?.find(g => g.equipped);
        if (masteryGadget) masteryGadget.masteryXp = (masteryGadget.masteryXp || 0) + gearXpGain;
      }
      if (s.activeCombat?.isNemesis && s.activeCombat?.won) {
        const nemCinematic = checkCinematicTrigger(s, 'nemesis_combat_start');
        if (nemCinematic) s.pendingCinematic = nemCinematic;
      }
      s.activeCombat = null;
      if (wasFinalBoss) {
        // Trigger final boss resolution
        s.finalBossDefeated = true;
        s.endgamePhase = 'noxhaven_baas';
        s.rep += 500;
        s.money += 100000;
        s.stats.totalEarned += 100000;
        Engine.gainXp(s, 500);
        // Heat 2.0: reset both heat types
        s.heat = 0;
        s.personalHeat = 0;
        s.ownedVehicles.forEach(v => { v.vehicleHeat = 0; });
        // Full heal on final boss victory
        s.playerHP = s.playerMaxHP;
        s.victoryData = buildVictoryData(s);
        addPhoneMessage(s, 'anonymous', 'Commissaris Decker is verslagen. Noxhaven is van jou. De stad knielt.', 'opportunity');
      }
      return s;
    }

    case 'FACTION_ACTION': {
      const result = Engine.performFactionAction(s, action.familyId, action.actionType);
      s._lastFactionResult = result;
      Engine.checkAchievements(s);
      if (s.dailyProgress) { s.dailyProgress.faction_actions++; }
      syncChallenges(s);
      return s;
    }

    case 'CONQUER_FACTION': {
      Engine.conquerFaction(s, action.familyId);
      s.pendingConquestPopup = null;
      Engine.checkAchievements(s);
      return s;
    }

    case 'ANNEX_FACTION': {
      Engine.annexFaction(s, action.familyId);
      Engine.checkAchievements(s);
      return s;
    }

    case 'START_CONQUEST_PHASE': {
      const combat = Engine.startConquestPhase(s, action.familyId, action.phase);
      if (combat) s.activeCombat = combat;
      return s;
    }

    case 'DISMISS_CONQUEST_POPUP': {
      s.pendingConquestPopup = null;
      return s;
    }

    case 'HEAL_PLAYER': {
      if (s.money < action.cost) return s;
      s.money -= action.cost;
      s.stats.totalSpent += action.cost;
      s.playerHP = Math.min(s.playerMaxHP, s.playerHP + action.amount);
      return s;
    }

    case 'ACCEPT_CONQUEST_POPUP': {
      if (s.pendingConquestPopup) {
        Engine.conquerFaction(s, s.pendingConquestPopup);
        s.pendingConquestPopup = null;
        Engine.checkAchievements(s);
      }
      return s;
    }

    case 'START_MISSION': {
      s.activeMission = action.mission;
      return s;
    }

    case 'MISSION_CHOICE': {
      if (!s.activeMission) return s;
      const mission = s.activeMission;
      const result = MissionEngine.resolveMissionChoice(s, mission, action.choiceId, action.forceResult);

      const encounter = mission.encounters[mission.currentEncounter];
      const choice = encounter?.choices.find(c => c.id === action.choiceId);
      const prefix = result.result === 'success' ? '✓' : result.result === 'partial' ? '△' : '✗';
      mission.log.push(`${prefix} ${choice?.label || ''}: ${result.outcomeText}`);

      // Track choice results for timeline
      if (!mission.choiceResults) mission.choiceResults = [];
      mission.choiceResults.push(result.result);

      // Approach multipliers
      const approachRewardMult = mission.approach === 'cautious' ? 0.8 : mission.approach === 'aggressive' ? 1.3 : 1;
      const approachHeatMult = mission.approach === 'cautious' ? 0.7 : mission.approach === 'aggressive' ? 1.3 : 1;

      if (result.result === 'success') {
        mission.totalReward += Math.floor(result.effects.bonusReward * approachRewardMult);
        mission.totalHeat += Math.max(0, Math.floor(result.effects.heat * approachHeatMult));
        mission.totalCrewDamage += result.effects.crewDamage;
      } else if (result.result === 'partial') {
        mission.totalReward += Math.floor(result.effects.bonusReward * 0.5 * approachRewardMult);
        mission.totalHeat += Math.max(0, Math.floor((result.effects.heat + 2) * approachHeatMult));
        mission.totalCrewDamage += Math.floor(result.effects.crewDamage * 0.5);
      } else {
        mission.totalHeat += Math.max(0, Math.floor((result.effects.heat + 5) * approachHeatMult));
        mission.totalCrewDamage += result.effects.crewDamage + 5;
      }

      if (result.effects.relChange !== 0 && mission.type === 'contract' && mission.contractId !== undefined) {
        const contract = s.activeContracts.find(c => c.id === mission.contractId);
        if (contract) {
          const key = contract.employer;
          mission.totalRelChange[key] = (mission.totalRelChange[key] || 0) + result.effects.relChange;
        }
      }

      if (mission.currentEncounter < mission.encounters.length - 1) {
        mission.currentEncounter++;
      } else {
        const completion = MissionEngine.completeMission(s, mission);
        mission.finished = true;
        mission.success = completion.success;
      }

      return s;
    }

    case 'END_MISSION': {
      s.activeMission = null;
      Engine.checkAchievements(s);
      return s;
    }

    // ========== NEW FEATURE ACTIONS ==========

    case 'CREATE_ROUTE': {
      if (s.smuggleRoutes.length >= 3) return s;
      if (s.money < 5000) return s;
      s.money -= 5000;
      s.stats.totalSpent += 5000;
      s.smuggleRoutes.push(action.route);
      return s;
    }

    case 'DELETE_ROUTE': {
      s.smuggleRoutes = s.smuggleRoutes.filter(r => r.id !== action.routeId);
      return s;
    }

    case 'BUY_DISTRICT_UPGRADE': {
      const def = s.districtDefenses[action.districtId];
      if (!def || !s.ownedDistricts.includes(action.districtId)) return s;
      if (def.upgrades.includes(action.upgradeId)) return s;
      const upgDef = DISTRICT_HQ_UPGRADES.find(u => u.id === action.upgradeId);
      if (!upgDef || s.money < upgDef.cost) return s;
      s.money -= upgDef.cost;
      s.stats.totalSpent += upgDef.cost;
      def.upgrades.push(action.upgradeId);
      def.fortLevel += upgDef.defense;
      return s;
    }

    case 'RESOLVE_WAR_EVENT': {
      if (!s.pendingWarEvent) return s;
      const result = resolveWarEvent(s, action.tactic);
      if (result.won) {
        s.screenEffect = 'gold-flash';
        s.lastRewardAmount = result.loot;
      } else {
        s.screenEffect = 'blood-flash';
      }
      return s;
    }

    case 'DISMISS_WAR_EVENT': {
      s.pendingWarEvent = null;
      return s;
    }

    case 'PERFORM_SPIONAGE': {
      // Requires command center in any owned district
      const hasCommand = s.ownedDistricts.some(d => s.districtDefenses[d]?.upgrades.includes('command'));
      if (!hasCommand) return s;
      if (s.money < 2000) return s;
      // Check cooldown: can't spy on same district within 1 day
      if (s.spionageIntel.some(i => i.district === action.districtId)) return s;
      s.money -= 2000;
      s.stats.totalSpent += 2000;
      performSpionage(s, action.districtId);
      return s;
    }

    case 'PERFORM_SABOTAGE': {
      const hasCmd = s.ownedDistricts.some(d => s.districtDefenses[d]?.upgrades.includes('command'));
      if (!hasCmd) return s;
      if (s.money < 5000) return s;
      if ((s.sabotageEffects || []).some(e => e.district === action.districtId)) return s;
      s.money -= 5000;
      s.stats.totalSpent += 5000;
      performSabotage(s, action.districtId);
      return s;
    }

    case 'REQUEST_ALLIANCE_HELP': {
      const rel = s.familyRel[action.familyId] || 0;
      if (rel < 60) return s;
      const cooldown = s.allianceCooldowns?.[action.familyId] || 0;
      if (cooldown > s.day) return s;
      s.familyRel[action.familyId] = rel - 10;
      if (!s.allianceCooldowns) s.allianceCooldowns = { cartel: 0, syndicate: 0, bikers: 0 };
      s.allianceCooldowns[action.familyId] = s.day + 3;
      // Boost defense for the district
      const defB = s.districtDefenses[action.districtId];
      if (defB) defB.fortLevel += 25;
      return s;
    }

    case 'SET_SPECIALIZATION': {
      if (action.crewIndex < 0 || action.crewIndex >= s.crew.length) return s;
      s.crew[action.crewIndex].specialization = action.specId;
      s.pendingSpecChoice = null;
      // Recalc inv if smuggler wagon
      if (action.specId === 'smuggler_wagon') s.maxInv = Engine.recalcMaxInv(s);
      return s;
    }

    case 'DISMISS_SPEC_CHOICE': {
      s.pendingSpecChoice = null;
      return s;
    }

    case 'TOGGLE_PHONE': {
      s.showPhone = !s.showPhone;
      return s;
    }

    case 'READ_MESSAGE': {
      const msg = s.phone.messages.find(m => m.id === action.messageId);
      if (msg && !msg.read) {
        msg.read = true;
        s.phone.unread = Math.max(0, s.phone.unread - 1);
      }
      return s;
    }

    case 'READ_ALL_MESSAGES': {
      s.phone.messages.forEach(m => { m.read = true; });
      s.phone.unread = 0;
      return s;
    }

    case 'START_FINAL_BOSS': {
      const finalCombat = startFinalBoss(s);
      if (finalCombat) {
        s.activeCombat = finalCombat;
        s.screenEffect = 'shake';
      }
      return s;
    }

    case 'START_BOSS_PHASE_2': {
      const phase2 = createBossPhase(s, 2);
      s.activeCombat = phase2;
      s.screenEffect = 'blood-flash';
      return s;
    }

    case 'RESOLVE_FINAL_BOSS': {
      s.finalBossDefeated = true;
      s.endgamePhase = 'noxhaven_baas';
      s.rep += 500;
      s.money += 100000;
      s.stats.totalEarned += 100000;
      Engine.gainXp(s, 500);
      // Heat 2.0: reset both heat types
      s.heat = 0;
      s.personalHeat = 0;
      s.ownedVehicles.forEach(v => { v.vehicleHeat = 0; });
      // Build victory data
      s.victoryData = buildVictoryData(s);
      addPhoneMessage(s, 'anonymous', 'Commissaris Decker is verslagen. Noxhaven is van jou. De stad knielt.', 'opportunity');
      return s;
    }

    case 'NEW_GAME_PLUS': {
      const ngPlus = createNewGamePlus(s);
      // Carry over hardcore mode
      if (s.hardcoreMode) ngPlus.hardcoreMode = true;
      Engine.generatePrices(ngPlus);
      return ngPlus;
    }

    case 'PRESTIGE_RESET': {
      if (s.player.level < 15) return s; // Require level 15+
      const prestige = createPrestigeReset(s);
      Engine.generatePrices(prestige);
      prestige.dailyNews = generateDailyNews(prestige);
      return prestige;
    }

    case 'START_HARDCORE': {
      // Legacy action — just creates a new game (all games are permadeath now)
      const fresh = createInitialState();
      Engine.generatePrices(fresh);
      fresh.dailyNews = generateDailyNews(fresh);
      return fresh;
    }

    case 'FREE_PLAY': {
      s.freePlayMode = true;
      s.victoryData = null;
      return s;
    }

    // Street events removed (MMO)

    case 'SET_SCREEN_EFFECT': {
      s.screenEffect = action.effect;
      return s;
    }

    case 'SET_WEEK_EVENT': {
      (s as any).activeWeekEvent = action.event;
      return s;
    }

    case 'SYNC_WORLD_TIME': {
      s.worldTimeOfDay = (action.timeOfDay as 'dawn' | 'day' | 'dusk' | 'night') || 'day';
      // Sync player day with world_day (1 game day = 1 real day)
      if (action.worldDay && action.worldDay > 0) {
        s.day = action.worldDay;
      }
      return s;
    }

    // ========== CODEX ACTIONS ==========
    case 'CODEX_MARK_READ' as any: {
      if (!s.codex) s.codex = { unlockedEntries: [], readEntries: [], newEntries: [] };
      const entryId = (action as any).entryId;
      if (!s.codex.readEntries.includes(entryId)) s.codex.readEntries.push(entryId);
      s.codex.newEntries = s.codex.newEntries.filter((id: string) => id !== entryId);
      return s;
    }

    case 'CODEX_CHECK_UNLOCKS' as any: {
      if (!s.codex) s.codex = { unlockedEntries: [], readEntries: [], newEntries: [] };
      try {
        const { newUnlocks } = checkCodexUnlocks(s);
        if (newUnlocks.length > 0) {
          s.codex.unlockedEntries = [...s.codex.unlockedEntries, ...newUnlocks];
          s.codex.newEntries = [...s.codex.newEntries, ...newUnlocks];
          s._lastCodexUnlock = newUnlocks[newUnlocks.length - 1];
        }
      } catch (_) {}
      return s;
    }

    case 'RESOLVE_ARC_EVENT': {
      const arcResult = resolveArcChoice(s, action.arcId, action.choiceId);
      // Apply effects
      if (arcResult.success) {
        s.money += arcResult.effects.money;
        s.dirtyMoney += arcResult.effects.dirtyMoney;
        Engine.splitHeat(s, arcResult.effects.heat, 0.4);
        Engine.recomputeHeat(s);
        s.rep += arcResult.effects.rep;
        if (arcResult.effects.money > 0) s.stats.totalEarned += arcResult.effects.money;
        if (arcResult.effects.dirtyMoney > 0) s.stats.totalEarned += arcResult.effects.dirtyMoney;
        if (arcResult.effects.crewDamage > 0 && s.crew.length > 0) {
          const target = s.crew[Math.floor(Math.random() * s.crew.length)];
          target.hp = Math.max(1, target.hp - arcResult.effects.crewDamage);
        }
        if (arcResult.effects.money > 5000 || arcResult.effects.dirtyMoney > 5000) {
          s.screenEffect = 'gold-flash';
          s.lastRewardAmount = arcResult.effects.money + arcResult.effects.dirtyMoney;
        }
        // Karma tracking
        if (arcResult.effects.karma) {
          s.karma = Math.max(-100, Math.min(100, (s.karma || 0) + arcResult.effects.karma));
        }
        // Track key decision
        if (!s.keyDecisions) s.keyDecisions = [];
        s.keyDecisions.push(`arc_${action.arcId}_${action.choiceId}`);
      } else {
        // Track failed decision with fail marker
        if (!s.keyDecisions) s.keyDecisions = [];
        s.keyDecisions.push(`arc_${action.arcId}_${action.choiceId}`);
        s.keyDecisions.push(`arc_${action.arcId}_fail_${action.choiceId}`);
        s.money += arcResult.effects.money;
        Engine.splitHeat(s, arcResult.effects.heat, 0.3);
        Engine.recomputeHeat(s);
        s.rep += arcResult.effects.rep;
        if (arcResult.effects.crewDamage > 0 && s.crew.length > 0) {
          const target = s.crew[Math.floor(Math.random() * s.crew.length)];
          target.hp = Math.max(1, target.hp - arcResult.effects.crewDamage);
        }
        if (arcResult.effects.crewDamage > 10) {
          s.screenEffect = 'blood-flash';
        }
      }
      s.arcEventResult = { success: arcResult.success, text: arcResult.text };

      // Mark completed arc for flashback (triggered on DISMISS_ARC_EVENT)
      const completedArc = s.activeStoryArcs?.find(a => a.arcId === action.arcId && a.finished);
      if (completedArc) {
        s._completedArcFlashbackId = action.arcId;
      }

      return s;
    }

    case 'DISMISS_ARC_EVENT': {
      // Generate consequence flashback if an arc just completed
      const flashbackArcId = s._completedArcFlashbackId;
      if (flashbackArcId) {
        const flashback = generateArcFlashback(s, flashbackArcId);
        if (flashback) {
          s.pendingFlashback = flashback;
        }
        delete s._completedArcFlashbackId;
      }
      s.pendingArcEvent = null;
      s.arcEventResult = null;
      return s;
    }

    case 'SELECT_BACKSTORY': {
      applyBackstory(s, action.backstoryId as any);
      // Your origin *is* the founding of your outfit. Without this the idle game
      // is unreachable: a fresh player has €3.000 and 0 respect, while founding an
      // organisation costs €25.000 and 40 respect. You start with a name, one
      // loyal hand and a racket already running on your home streets.
      const seed = ORIGIN_START[action.backstoryId as keyof typeof ORIGIN_START];
      if (seed && !s.org) {
        const firstHand: OrgMember = {
          id: `om_start_${Date.now()}`,
          name: seed.rightHand,
          role: 'luitenant',
          level: Math.max(1, s.player.level),
          loyalty: 85,
          assignment: seed.racket,
          trait: seed.trait,
        };
        s.org = {
          name: seed.crewName,
          tag: seed.tag,
          members: [firstHand],
          controlledDistricts: [],
          respect: seed.respect,
          upgrades: [],
          foundedDay: s.day,
        };
        s.districtAttention = {};
        addPhoneMessage(s, 'system', seed.opening, 'opportunity');
      }
      return s;
    }

    case 'DISMISS_FLASHBACK': {
      s.pendingFlashback = null;
      return s;
    }

    // ========== CINEMATIC MOMENT ACTIONS ==========

    case 'RESOLVE_CINEMATIC': {
      if (s.pendingCinematic) {
        applyCinematicChoice(s, action.cinematicId, action.choiceId);
      }
      s.pendingCinematic = null;
      return s;
    }

    case 'DISMISS_CINEMATIC': {
      if (s.pendingCinematic) {
        markCinematicSeen(s, s.pendingCinematic.id);
      }
      s.pendingCinematic = null;
      return s;
    }

    // Crew/NPC event popups removed (MMO)

    // ========== HEAT 2.0 ACTIONS ==========

    case 'REKAT_VEHICLE': {
      const vehicle = s.ownedVehicles.find(v => v.id === action.vehicleId);
      if (!vehicle) return s;
      if ((vehicle.rekatCooldown || 0) > 0) return s;
      const cost = REKAT_COSTS[action.vehicleId] || 5000;
      if (s.money < cost) return s;
      s.money -= cost;
      s.stats.totalSpent += cost;
      vehicle.vehicleHeat = 0;
      vehicle.rekatCooldown = 3;
      Engine.recomputeHeat(s);
      return s;
    }

    case 'UPGRADE_VEHICLE': {
      const vehicle = s.ownedVehicles.find(v => v.id === action.vehicleId);
      if (!vehicle) return s;
      const upgradeDef = VEHICLE_UPGRADES[action.upgradeType];
      if (!upgradeDef) return s;
      if (!vehicle.upgrades) vehicle.upgrades = {};
      const currentLevel = vehicle.upgrades[action.upgradeType] || 0;
      if (currentLevel >= upgradeDef.maxLevel) return s;
      const cost = upgradeDef.costs[currentLevel];
      if (s.money < cost) return s;
      s.money -= cost;
      s.stats.totalSpent += cost;
      vehicle.upgrades[action.upgradeType] = currentLevel + 1;
      s.maxInv = Engine.recalcMaxInv(s);
      return s;
    }

    case 'GO_INTO_HIDING': {
      if ((s.hidingDays || 0) > 0) return s; // Already hiding
      const days = Math.max(1, Math.min(3, action.days));
      s.hidingDays = days;
      return s;
    }

    case 'CANCEL_HIDING': {
      s.hidingDays = 0;
      return s;
    }

    // ========== CAR THEFT ACTIONS ==========

    case 'ATTEMPT_CAR_THEFT': {
      if (!s.pendingCarTheft) return s;
      const carDef = STEALABLE_CARS.find(c => c.id === s.pendingCarTheft!.carTypeId);
      if (!carDef) { s.pendingCarTheft = null; return s; }

      if (action.success) {
        // Success!
        const condition = 60 + Math.floor(Math.random() * 40); // 60-100%
        const newCar: import('../game/types').StolenCar = {
          id: `stolen_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          carTypeId: carDef.id,
          condition,
          omgekat: false,
          upgrades: [],
          stolenDay: s.day,
          stolenFrom: s.pendingCarTheft!.district,
          baseValue: carDef.baseValue,
        };
        s.stolenCars.push(newCar);
        Engine.addVehicleHeat(s, carDef.heatGain);
        Engine.addPersonalHeat(s, Math.floor(carDef.heatGain * 0.5));
        Engine.recomputeHeat(s);
        Engine.gainXp(s, 15 + Math.floor(carDef.baseValue / 2000));
        s.districtRep[s.loc] = Math.min(100, (s.districtRep[s.loc] || 0) + 3);
        s.screenEffect = 'gold-flash';
        s.lastRewardAmount = carDef.baseValue;
        if (s.dailyProgress) { s.dailyProgress.cars_stolen++; }
      } else {
        // Failed — heat and possible damage
        Engine.addPersonalHeat(s, carDef.heatGain + 10);
        Engine.addVehicleHeat(s, 5);
        Engine.recomputeHeat(s);
        if (s.crew.length > 0 && Math.random() < 0.3) {
          const target = s.crew[Math.floor(Math.random() * s.crew.length)];
          target.hp = Math.max(1, target.hp - 10);
        }
        // Arrest chance on failed carjack with high heat
        if ((s.personalHeat || 0) > ARREST_HEAT_THRESHOLD && !s.prison) {
          if (Math.random() < PRISON_ARREST_CHANCE_CARJACK) {
            const report: any = {};
            Engine.arrestPlayer(s, report);
            addPhoneMessage(s, 'NHPD', `Gearresteerd tijdens een mislukte autodiefstal! Straf: ${s.prison?.daysRemaining} dagen.`, 'threat');
          }
        }
        s.screenEffect = 'blood-flash';
      }
      s.pendingCarTheft = null;
      syncChallenges(s);
      return s;
    }

    case 'DISMISS_CAR_THEFT': {
      s.pendingCarTheft = null;
      return s;
    }

    case 'OMKAT_STOLEN_CAR': {
      const car = s.stolenCars.find(c => c.id === action.carId);
      if (!car || car.omgekat || s.money < OMKAT_COST) return s;
      s.money -= OMKAT_COST;
      s.stats.totalSpent += OMKAT_COST;
      car.omgekat = true;
      return s;
    }

    case 'UPGRADE_STOLEN_CAR': {
      const car = s.stolenCars.find(c => c.id === action.carId);
      if (!car) return s;
      const upg = CHOP_SHOP_UPGRADES.find(u => u.id === action.upgradeId);
      if (!upg || car.upgrades.includes(action.upgradeId) || s.money < upg.cost) return s;
      s.money -= upg.cost;
      s.stats.totalSpent += upg.cost;
      car.upgrades.push(action.upgradeId);
      return s;
    }

    case 'SELL_STOLEN_CAR': {
      const car = s.stolenCars.find(c => c.id === action.carId);
      if (!car || !car.omgekat) return s;

      // Calculate value
      let value = car.baseValue * (car.condition / 100);
      car.upgrades.forEach((uid) => {
        const upg = CHOP_SHOP_UPGRADES.find(u => u.id === uid);
        if (upg) value *= (1 + upg.valueBonus / 100);
      });
      value = Math.floor(value);

      // Check for order bonus
      if (action.orderId) {
        const order = s.carOrders.find(o => o.id === action.orderId);
        if (order && order.carTypeId === car.carTypeId) {
          value = Math.floor(value * (1 + order.bonusPercent / 100));
          s.carOrders = s.carOrders.filter(o => o.id !== action.orderId);
        }
      }

      s.dirtyMoney += value;
      s.stats.totalEarned += value;
      s.stolenCars = s.stolenCars.filter(c => c.id !== action.carId);
      s.lastRewardAmount = value;
      s.screenEffect = 'gold-flash';
      Engine.gainXp(s, 20 + Math.floor(value / 3000));
      return s;
    }

    case 'USE_STOLEN_CAR': {
      const car = s.stolenCars.find(c => c.id === action.carId);
      if (!car || !car.omgekat) return s;
      const carDef = STEALABLE_CARS.find(c => c.id === car.carTypeId);
      if (!carDef) return s;

      // Map stolen car types to closest vehicle
      const vehicleMap: Record<string, string> = {
        'rusted_sedan': 'toyohata',
        'city_hatch': 'toyohata',
        'delivery_van': 'forgedyer',
        'sport_coupe': 'bavamotor',
        'suv_terrain': 'forgedyer',
        'luxury_sedan': 'meridiolux',
        'muscle_car': 'bavamotor',
        'exotic_sports': 'lupoghini',
        'armored_limo': 'royaleryce',
        'rare_classic': 'meridiolux',
      };
      const vehicleId = vehicleMap[car.carTypeId] || 'toyohata';

      // Add as owned vehicle if not already owned
      if (!s.ownedVehicles.some(v => v.id === vehicleId)) {
        s.ownedVehicles.push({ id: vehicleId, condition: car.condition, vehicleHeat: 0, rekatCooldown: 0 });
      }
      s.stolenCars = s.stolenCars.filter(c => c.id !== action.carId);
      return s;
    }

    // ========== SAFEHOUSE ACTIONS ==========

    case 'BUY_SAFEHOUSE': {
      const cost = SAFEHOUSE_COSTS[action.district];
      if (!cost || s.money < cost) return s;
      if (s.safehouses.some(sh => sh.district === action.district)) return s;
      if (!s.ownedDistricts.includes(action.district)) return s;
      s.money -= cost;
      s.stats.totalSpent += cost;
      s.safehouses.push({
        district: action.district,
        level: 1,
        upgrades: [],
        purchaseDay: s.day,
      });
      s.maxInv = Engine.recalcMaxInv(s);
      addPhoneMessage(s, 'anonymous', `Nieuw safehouse in ${DISTRICTS[action.district].name}. Een veilige haven in de storm.`, 'opportunity');
      return s;
    }

    case 'UPGRADE_SAFEHOUSE': {
      const sh = s.safehouses.find(h => h.district === action.district);
      if (!sh || sh.level >= 3) return s;
      const cost = SAFEHOUSE_UPGRADE_COSTS[sh.level + 1];
      if (!cost || s.money < cost) return s;
      s.money -= cost;
      s.stats.totalSpent += cost;
      sh.level++;
      s.maxInv = Engine.recalcMaxInv(s);
      return s;
    }

    case 'INSTALL_SAFEHOUSE_UPGRADE': {
      const sh = s.safehouses.find(h => h.district === action.district);
      if (!sh) return s;
      if (sh.upgrades.includes(action.upgradeId)) return s;
      const upg = SAFEHOUSE_UPGRADES.find(u => u.id === action.upgradeId);
      if (!upg || s.money < upg.cost) return s;
      s.money -= upg.cost;
      s.stats.totalSpent += upg.cost;
      sh.upgrades.push(action.upgradeId);
      return s;
    }

    // ========== CORRUPTION NETWORK ACTIONS ==========

    case 'RECRUIT_CONTACT': {
      const contactDef = CORRUPT_CONTACTS.find(c => c.id === action.contactDefId);
      if (!contactDef) return s;
      if (s.money < contactDef.recruitCost) return s;
      if (s.corruptContacts.some(c => c.contactDefId === action.contactDefId && c.active)) return s;
      if (s.rep < (contactDef.reqRep || 0)) return s;
      if (contactDef.reqPoliceRel && s.policeRel < contactDef.reqPoliceRel) return s;
      s.money -= contactDef.recruitCost;
      s.stats.totalSpent += contactDef.recruitCost;
      s.corruptContacts.push({
        id: `contact_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        contactDefId: action.contactDefId,
        recruitedDay: s.day,
        loyalty: 50,
        lastPaidDay: s.day,
        compromised: false,
        active: true,
      });
      addPhoneMessage(s, contactDef.name, `We hebben een deal. Ik verwacht maandelijks €${contactDef.monthlyCost.toLocaleString()}. Teleur me niet.`, 'info');
      return s;
    }

    case 'FIRE_CONTACT': {
      const contact = s.corruptContacts.find(c => c.id === action.contactId);
      if (!contact || !contact.active) return s;
      contact.active = false;
      const contactDef = CORRUPT_CONTACTS.find(c => c.id === contact.contactDefId);
      // Firing a contact has a chance to increase heat (they know too much)
      if (contactDef && Math.random() < 0.3) {
        Engine.addPersonalHeat(s, 10);
        Engine.recomputeHeat(s);
        addPhoneMessage(s, 'anonymous', `${contactDef.name} is niet blij met het beëindigen van jullie samenwerking. Wees voorzichtig.`, 'warning');
      }
      return s;
    }

    case 'DISMISS_CORRUPTION_EVENT': {
      s.pendingCorruptionEvent = null;
      return s;
    }
    // ========== DAILY CHALLENGES ACTIONS ==========

    case 'CLAIM_CHALLENGE_REWARD': {
      const challenge = s.dailyChallenges.find(c => c.templateId === action.templateId);
      if (!challenge || !challenge.completed || challenge.claimed) return s;
      const template = getChallengeTemplate(action.templateId);
      if (!template) return s;
      challenge.claimed = true;
      s.money += template.rewardMoney;
      s.stats.totalEarned += template.rewardMoney;
      s.rep += template.rewardRep;
      Engine.gainXp(s, template.rewardXp);
      s.challengesCompleted = (s.challengesCompleted || 0) + 1;
      s.lastRewardAmount = template.rewardMoney;
      s.screenEffect = 'gold-flash';
      return s;
    }

    // ========== HITMAN & AMMO ACTIONS ==========

    case 'BUY_AMMO': {
      const pack = AMMO_PACKS.find(p => p.id === action.packId);
      if (!pack || s.money < pack.cost) return s;
      if ((s.ammo || 0) >= 500) return s;
      s.money -= pack.cost;
      s.stats.totalSpent += pack.cost;
      s.ammo = Math.min(500, (s.ammo || 0) + pack.amount);
      // Sync legacy
      if (!s.ammoStock) s.ammoStock = { '9mm': 0, '7.62mm': 0, 'shells': 0 };
      s.ammoStock['9mm'] = s.ammo;
      return s;
    }

    case 'LOAD_AMMO_FROM_INVENTORY': {
      // Convert "weapons" goods from inventory into ammo (universal)
      const weaponsOwned = s.inventory.weapons || 0;
      if (weaponsOwned <= 0) return s;
      const qty = Math.min(action.quantity, weaponsOwned);
      const ammoPerWeapon = 6;
      const currentAmmo = s.ammo || 0;
      if (currentAmmo >= 500) return s;
      const maxCanLoad = Math.floor((500 - currentAmmo) / ammoPerWeapon);
      const actualQty = Math.min(qty, Math.max(1, maxCanLoad));
      if (actualQty <= 0) return s;
      s.inventory.weapons = weaponsOwned - actualQty;
      s.ammo = Math.min(500, currentAmmo + (actualQty * ammoPerWeapon));
      if (!s.ammoStock) s.ammoStock = { '9mm': 0, '7.62mm': 0, 'shells': 0 };
      s.ammoStock['9mm'] = s.ammo;
      return s;
    }

    case 'EXECUTE_HIT': {
      if ((s.hidingDays || 0) > 0 || s.prison) return s;
      const hitResult = executeHit(s, action.hitId);
      if (hitResult.success) {
        s.screenEffect = 'gold-flash';
        s.lastRewardAmount = hitResult.reward;
        if (s.dailyProgress) { s.dailyProgress.hits_completed++; }
        syncChallenges(s);
      } else if (hitResult.heatGain > 0) {
        s.screenEffect = 'blood-flash';
      }
      Engine.checkAchievements(s);
      return s;
    }

    case 'UPGRADE_AMMO_FACTORY': {
      if (!s.ownedBusinesses.includes('ammo_factory')) return s;
      if (!s.ammoFactoryLevel) s.ammoFactoryLevel = 1;
      const nextLevel = s.ammoFactoryLevel + 1;
      const upgrade = AMMO_FACTORY_UPGRADES.find(u => u.level === nextLevel);
      if (!upgrade || s.money < upgrade.cost) return s;
      if (!upgrade || s.money < upgrade.cost) return s;
      s.money -= upgrade.cost;
      s.stats.totalSpent += upgrade.cost;
      s.ammoFactoryLevel = nextLevel;
      return s;
    }

    case 'BUY_SPECIAL_AMMO': {
      if (s.money < action.cost) return s;
      s.money -= action.cost;
      s.stats.totalSpent += action.cost;
      if (!s.specialAmmo) s.specialAmmo = {};
      s.specialAmmo[action.specialType] = (s.specialAmmo[action.specialType] || 0) + action.amount;
      return s;
    }

    case 'SET_SPECIAL_AMMO': {
      if (action.specialType === null) {
        s.activeSpecialAmmo = null;
      } else {
        if (!s.specialAmmo || (s.specialAmmo[action.specialType] || 0) <= 0) return s;
        s.activeSpecialAmmo = action.specialType;
      }
      return s;
    }

    case 'CRUSH_CAR': {
      const car = s.stolenCars.find(c => c.id === action.carId);
      if (!car) return s;
      const carDef = STEALABLE_CARS.find(c => c.id === car.carTypeId);
      if (!carDef) return s;

      // Calculate ammo from rarity
      const [minAmmo, maxAmmo] = CRUSHER_AMMO_REWARDS[carDef.rarity] || [3, 5];
      let ammoGain = minAmmo + Math.floor(Math.random() * (maxAmmo - minAmmo + 1));

      // Condition bonus: +2 if 80%+
      if (car.condition >= 80) ammoGain += 2;

      // Upgrades: +1 per upgrade
      ammoGain += car.upgrades.length;

      // Apply to state (cap at 99) — crusher gives 9mm by default
      if (!s.ammoStock) s.ammoStock = { '9mm': s.ammo || 0, '7.62mm': 0, 'shells': 0 };
      const crushType = Engine.getActiveAmmoType(s);
      const oldCrushAmmo = s.ammoStock[crushType] || 0;
      s.ammoStock[crushType] = Math.min(99, oldCrushAmmo + ammoGain);
      const actualGain = s.ammoStock[crushType] - oldCrushAmmo;
      s.ammo = (s.ammoStock['9mm'] || 0) + (s.ammoStock['7.62mm'] || 0) + (s.ammoStock['shells'] || 0);

      // Remove car
      s.stolenCars = s.stolenCars.filter(c => c.id !== action.carId);

      // XP reward
      Engine.gainXp(s, 10);

      // Visual feedback
      s.screenEffect = 'gold-flash';
      s.lastRewardAmount = actualGain;

      return s;
    }

    // ========== PRISON ACTIONS ==========

    case 'BRIBE_PRISON': {
      if (!s.prison) return s;
      let cost = prisonBribeCost(s);
      // Lawyer discount
      const hasLawyer = s.corruptContacts?.some(c => {
        const def = CORRUPT_CONTACTS.find((cd: any) => cd.id === c.contactDefId);
        return def?.type === 'lawyer' && c.active && !c.compromised;
      });
      if (hasLawyer) cost = Math.floor(cost * (1 - 0.30));
      if (s.money < cost) return s;
      s.money -= cost;
      s.stats.totalSpent += cost;
      s.prison = null;
      // Deliberately no heat reset: the fast way out leaves you exactly as wanted as
      // you were, which is what makes sitting it out worth considering.
      addPhoneMessage(s, 'anonymous', 'Vrijgekocht. Je heat staat nog waar het stond — ze houden je in de gaten.', 'warning');
      return s;
    }

    case 'ATTEMPT_ESCAPE': {
      if (!s.prison || s.prison.escapeAttempted) return s;
      s.prison.escapeAttempted = true;
      if (Math.random() < escapeChance(s)) {
        Engine.addPersonalHeat(s, ESCAPE_HEAT_PENALTY);
        Engine.recomputeHeat(s);
        s.prison = null;
        s.screenEffect = 'gold-flash';
        addPhoneMessage(s, 'anonymous', `Je bent buiten. Maar je staat nu als voortvluchtige te boek. +${ESCAPE_HEAT_PENALTY} heat.`, 'warning');
      } else {
        s.prison.daysRemaining += ESCAPE_FAIL_EXTRA_DAYS;
        s.prison.totalSentence += ESCAPE_FAIL_EXTRA_DAYS;
        s.screenEffect = 'blood-flash';
        addPhoneMessage(s, 'NHPD', `Ze hadden je bij het hek. +${ESCAPE_FAIL_EXTRA_DAYS} dag${ESCAPE_FAIL_EXTRA_DAYS === 1 ? '' : 'en'} erbij.`, 'threat');
      }
      return s;
    }

    // ========== HEIST ACTIONS ==========

    case 'START_HEIST_PLANNING': {
      s.heistPlan = createHeistPlan(action.heistId);
      return s;
    }

    case 'UPDATE_HEIST_PLAN': {
      s.heistPlan = action.plan;
      return s;
    }

    case 'PERFORM_RECON': {
      if (!s.heistPlan || s.money < 2000) return s;
      s.money -= 2000;
      s.stats.totalSpent += 2000;
      s.heistPlan.reconDone = true;
      s.heistPlan.reconIntel = performRecon(s, s.heistPlan);
      return s;
    }

    case 'DISMISS_ACHIEVEMENT': {
      if (s.pendingAchievements && s.pendingAchievements.length > 0) {
        s.pendingAchievements = s.pendingAchievements.slice(1);
      }
      return s;
    }

    case 'UPGRADE_MERIT_NODE': {
      const { nodeId } = action.payload;
      const nodeDef = MERIT_NODES.find((n) => n.id === nodeId);
      if (!nodeDef) return s;
      const check = canUnlockMeritNode(s, nodeDef);
      if (!check.canUnlock) return s;
      const currentLevel = (s.meritNodes || {})[nodeId] || 0;
      s.meritPoints = (s.meritPoints || 0) - nodeDef.costPerLevel;
      s.meritNodes = { ...(s.meritNodes || {}), [nodeId]: currentLevel + 1 };
      return s;
    }

    // ========== WEAPON INVENTORY ACTIONS ==========
    case 'EQUIP_WEAPON': {
      if (!s.weaponInventory) return s;
      s.weaponInventory = s.weaponInventory.map(w => ({ ...w, equipped: w.id === action.weaponId }));
      s.player.loadout.weapon = null;
      return s;
    }

    case 'SELL_WEAPON': {
      if (!s.weaponInventory) return s;
      const wpnToSell = s.weaponInventory.find(w => w.id === action.weaponId);
      if (!wpnToSell || wpnToSell.equipped || wpnToSell.locked) return s;
      s.money += wpnToSell.sellValue;
      s.stats.totalEarned += wpnToSell.sellValue;
      s.weaponInventory = s.weaponInventory.filter(w => w.id !== action.weaponId);
      return s;
    }

    case 'ADD_WEAPON': {
      if (!s.weaponInventory) s.weaponInventory = [];
      if (s.weaponInventory.length >= 20) return s;
      s.weaponInventory.push(action.weapon);
      return s;
    }

    case 'TOGGLE_WEAPON_LOCK': {
      if (!s.weaponInventory) return s;
      s.weaponInventory = s.weaponInventory.map(w => w.id === action.weaponId ? { ...w, locked: !w.locked } : w);
      return s;
    }

    case 'UPGRADE_WEAPON': {
      if (!s.weaponInventory) return s;
      const wpnToUpgrade = s.weaponInventory.find(w => w.id === action.weaponId);
      if (!wpnToUpgrade || wpnToUpgrade.level >= 15) return s;
      const upgCost = getUpgradeCost(wpnToUpgrade);
      if (s.money < upgCost) return s;
      s.money -= upgCost;
      s.stats.totalSpent += upgCost;
      const upgraded = upgradeWeapon(wpnToUpgrade);
      s.weaponInventory = s.weaponInventory.map(w => w.id === action.weaponId ? { ...upgraded, equipped: w.equipped, locked: w.locked, masteryXp: w.masteryXp } : w);
      return s;
    }

    case 'SWAP_WEAPON_ACCESSORY': {
      if (!s.weaponInventory) return s;
      const swapCost = getAccessorySwapCost();
      if (s.money < swapCost) return s;
      const wpnToSwap = s.weaponInventory.find(w => w.id === action.weaponId);
      if (!wpnToSwap) return s;
      s.money -= swapCost;
      s.stats.totalSpent += swapCost;
      const swapped = swapAccessory(wpnToSwap, action.accessoryId);
      s.weaponInventory = s.weaponInventory.map(w => w.id === action.weaponId ? swapped : w);
      return s;
    }

    case 'FUSE_WEAPONS': {
      if (!s.weaponInventory) return s;
      const fuseWpns = action.weaponIds.map(id => s.weaponInventory!.find(w => w.id === id)).filter(Boolean) as import('../game/weaponGenerator').GeneratedWeapon[];
      const fuseCheck = canFuseWeapons(fuseWpns, s.money);
      if (!fuseCheck.canFuse) return s;
      s.money -= fuseCheck.cost;
      s.stats.totalSpent += fuseCheck.cost;
      const fusedWeapon = fuseWeapons(fuseWpns, s.player.level);
      s.weaponInventory = s.weaponInventory.filter(w => !action.weaponIds.includes(w.id));
      s.weaponInventory.push(fusedWeapon);
      return s;
    }

    case 'BULK_SELL_WEAPONS': {
      if (!s.weaponInventory) return s;
      const toSell = getWeaponsBelowRarity(s.weaponInventory, action.maxRarity);
      if (toSell.length === 0) return s;
      const totalValue = getBulkSellValue(toSell);
      const sellIds = new Set(toSell.map((w: any) => w.id));
      s.weaponInventory = s.weaponInventory.filter(w => !sellIds.has(w.id));
      s.money += totalValue;
      s.stats.totalEarned += totalValue;
      return s;
    }

    case 'ADD_WEAPON_MASTERY_XP': {
      if (!s.weaponInventory) return s;
      s.weaponInventory = s.weaponInventory.map(w => w.id === action.weaponId ? { ...w, masteryXp: (w.masteryXp || 0) + action.xp } : w);
      return s;
    }

    // ========== GEAR INVENTORY ACTIONS ==========
    case 'EQUIP_GEAR': {
      const inv = action.gearType === 'armor' ? s.armorInventory : s.gadgetInventory;
      if (!inv) return s;
      const updated = inv.map(g => ({ ...g, equipped: g.id === action.gearId }));
      if (action.gearType === 'armor') { s.armorInventory = updated; s.player.loadout.armor = null; }
      else { s.gadgetInventory = updated; s.player.loadout.gadget = null; }
      return s;
    }

    case 'SELL_GEAR': {
      const gInv = action.gearType === 'armor' ? s.armorInventory : s.gadgetInventory;
      if (!gInv) return s;
      const gToSell = gInv.find(g => g.id === action.gearId);
      if (!gToSell || gToSell.equipped || gToSell.locked) return s;
      s.money += gToSell.sellValue;
      s.stats.totalEarned += gToSell.sellValue;
      if (action.gearType === 'armor') s.armorInventory = gInv.filter(g => g.id !== action.gearId);
      else s.gadgetInventory = gInv.filter(g => g.id !== action.gearId);
      return s;
    }

    case 'ADD_GEAR': {
      const targetInv = action.gear.type === 'armor' ? 'armorInventory' : 'gadgetInventory';
      if (!s[targetInv]) (s as any)[targetInv] = [];
      if (s[targetInv].length >= 20) return s;
      s[targetInv].push(action.gear);
      return s;
    }

    case 'TOGGLE_GEAR_LOCK': {
      const gLockInv = action.gearType === 'armor' ? s.armorInventory : s.gadgetInventory;
      if (!gLockInv) return s;
      const updatedLock = gLockInv.map(g => g.id === action.gearId ? { ...g, locked: !g.locked } : g);
      if (action.gearType === 'armor') s.armorInventory = updatedLock;
      else s.gadgetInventory = updatedLock;
      return s;
    }

    case 'UPGRADE_GEAR': {
      const gUpgInv = action.gearType === 'armor' ? s.armorInventory : s.gadgetInventory;
      if (!gUpgInv) return s;
      const gToUpg = gUpgInv.find(g => g.id === action.gearId);
      if (!gToUpg || gToUpg.level >= 15) return s;
      const gUpgCost = getGearUpgradeCost(gToUpg);
      if (s.money < gUpgCost) return s;
      s.money -= gUpgCost;
      s.stats.totalSpent += gUpgCost;
      const upgradedGear = upgradeGear(gToUpg);
      const gUpgUpdated = gUpgInv.map(g => g.id === action.gearId ? { ...upgradedGear, equipped: g.equipped, locked: g.locked, masteryXp: g.masteryXp } : g);
      if (action.gearType === 'armor') s.armorInventory = gUpgUpdated;
      else s.gadgetInventory = gUpgUpdated;
      return s;
    }

    case 'SWAP_GEAR_MOD': {
      const gModInv = action.gearType === 'armor' ? s.armorInventory : s.gadgetInventory;
      if (!gModInv) return s;
      const modCost = getGearModSwapCost();
      if (s.money < modCost) return s;
      const gToMod = gModInv.find(g => g.id === action.gearId);
      if (!gToMod) return s;
      s.money -= modCost;
      s.stats.totalSpent += modCost;
      const modded = swapGearMod(gToMod, action.modId);
      const gModUpdated = gModInv.map(g => g.id === action.gearId ? modded : g);
      if (action.gearType === 'armor') s.armorInventory = gModUpdated;
      else s.gadgetInventory = gModUpdated;
      return s;
    }

    case 'FUSE_GEAR': {
      const gFuseInv = action.gearType === 'armor' ? s.armorInventory : s.gadgetInventory;
      if (!gFuseInv) return s;
      const fuseGs = action.gearIds.map(id => gFuseInv.find(g => g.id === id)).filter(Boolean) as import('../game/gearGenerator').GeneratedGear[];
      const gFuseCheck = canFuseGear(fuseGs, s.money);
      if (!gFuseCheck.canFuse) return s;
      s.money -= gFuseCheck.cost;
      s.stats.totalSpent += gFuseCheck.cost;
      const fusedGear = fuseGear(fuseGs, s.player.level);
      const remaining = gFuseInv.filter(g => !action.gearIds.includes(g.id));
      remaining.push(fusedGear);
      if (action.gearType === 'armor') s.armorInventory = remaining;
      else s.gadgetInventory = remaining;
      return s;
    }

    case 'BULK_SELL_GEAR': {
      const gBulkInv = action.gearType === 'armor' ? s.armorInventory : s.gadgetInventory;
      if (!gBulkInv) return s;
      const gToSellBulk = getGearBelowRarity(gBulkInv, action.maxRarity);
      if (gToSellBulk.length === 0) return s;
      const gBulkValue = getGearBulkSellValue(gToSellBulk);
      const gSellIds = new Set(gToSellBulk.map((g: any) => g.id));
      const gBulkRemaining = gBulkInv.filter(g => !gSellIds.has(g.id));
      if (action.gearType === 'armor') s.armorInventory = gBulkRemaining;
      else s.gadgetInventory = gBulkRemaining;
      s.money += gBulkValue;
      s.stats.totalEarned += gBulkValue;
      return s;
    }

    // ========== BLACK MARKET ACTIONS ==========
    case 'BUY_BLACK_MARKET_ITEM': {
      if (!s.blackMarketStock) return s;
      if (!s.blackMarketStock) return s;
      const bmItem = s.blackMarketStock.items.find((i: any) => i.id === action.itemId);
      if (!bmItem || bmItem.sold) return s;
      const cost = action.useDirtyMoney ? bmItem.dirtyPrice : bmItem.price;
      if (action.useDirtyMoney) {
        if (s.dirtyMoney < cost) return s;
        s.dirtyMoney -= cost;
      } else {
        if (s.money < cost) return s;
        s.money -= cost;
        s.stats.totalSpent += cost;
      }
      bmItem.sold = true;
      if (bmItem.weapon) {
        if (!s.weaponInventory) s.weaponInventory = [];
        s.weaponInventory.push(bmItem.weapon);
      }
      if (bmItem.gear) {
        const inv = bmItem.gear.type === 'armor' ? 'armorInventory' : 'gadgetInventory';
        if (!s[inv]) (s as any)[inv] = [];
        (s as any)[inv].push(bmItem.gear);
      }
      return s;
    }

    case 'REFRESH_BLACK_MARKET': {
      s.blackMarketStock = generateBlackMarketStock(s.player.level, s.day);
      return s;
    }

    // ========== UNDERWORLD ECONOMY ACTIONS ==========
    case 'RECRUIT_ARMS_CONTACT': {
      if (!s.armsNetwork) s.armsNetwork = createInitialArmsNetwork();
      const recruitCost = getContactRecruitCost(s.armsNetwork.networkLevel);
      if (s.money < recruitCost) return s;
      const maxContacts = s.armsNetwork.networkLevel + 2;
      if (s.armsNetwork.contacts.length >= maxContacts) return s;
      s.money -= recruitCost;
      s.stats.totalSpent += recruitCost;
      const newContact = generateContact(action.district, s.armsNetwork.contacts);
      s.armsNetwork.contacts.push(newContact);
      return s;
    }

    case 'DELIVER_ARMS': {
      if (!s.armsNetwork) return s;
      const contact = s.armsNetwork.contacts.find(c => c.id === action.contactId);
      if (!contact || contact.status !== 'active') return s;
      const result = processDelivery(contact, action.quantity, s.heat, s.personalHeat, s.armsNetwork.networkLevel, s.day);
      if (result.intercepted) {
        s.armsNetwork.interceptedShipments++;
        contact.trustLevel = Math.max(0, contact.trustLevel + result.trustGain);
        s.heat += result.heatGain;
      } else {
        s.money += result.revenue;
        s.stats.totalEarned += result.revenue;
        s.armsNetwork.totalRevenue += result.revenue;
        contact.totalDelivered += action.quantity;
        contact.totalEarned += result.revenue;
        contact.trustLevel = Math.min(100, contact.trustLevel + result.trustGain);
        contact.lastDeliveryDay = s.day;
        s.heat += result.heatGain;
      }
      return s;
    }

    case 'UPGRADE_ARMS_NETWORK': {
      if (!s.armsNetwork) return s;
      if (s.armsNetwork.networkLevel >= 5) return s;
      const upgCost = getNetworkUpgradeCost(s.armsNetwork.networkLevel);
      if (s.money < upgCost) return s;
      s.money -= upgCost;
      s.stats.totalSpent += upgCost;
      s.armsNetwork.networkLevel++;
      s.armsNetwork.weeklyCapacity = getWeeklyCapacity(s.armsNetwork.networkLevel);
      return s;
    }

    case 'BUY_STASH_HOUSE': {
      const hasSafehouse = s.safehouses.some(sh => sh.district === action.district);
      if (!hasSafehouse) return s;
      const existingStash = s.stashHouses.find(st => st.district === action.district && !st.discovered);
      if (existingStash) return s;
      const stashCost = getStashPurchaseCost(action.district);
      if (s.money < stashCost) return s;
      s.money -= stashCost;
      s.stats.totalSpent += stashCost;
      const shLevel = s.safehouses.find(sh => sh.district === action.district)?.level || 1;
      s.stashHouses.push(createStashHouse(action.district, shLevel, s.day));
      return s;
    }

    case 'UPGRADE_STASH_HOUSE': {
      const stash = s.stashHouses.find(st => st.id === action.stashId);
      if (!stash || stash.discovered || stash.level >= 3) return s;
      const stUpgCost = getStashUpgradeCost(stash.level);
      if (s.money < stUpgCost) return s;
      s.money -= stUpgCost;
      s.stats.totalSpent += stUpgCost;
      stash.level++;
      stash.capacity += 15;
      return s;
    }

    case 'DEPOSIT_STASH': {
      const stashDep = s.stashHouses.find(st => st.id === action.stashId);
      if (!stashDep || stashDep.discovered) return s;
      const remaining = stashDep.capacity - getStashUsed(stashDep);
      const qty = Math.min(action.amount, s.inventory[action.goodId] || 0, remaining);
      if (qty <= 0) return s;
      s.inventory[action.goodId] = (s.inventory[action.goodId] || 0) - qty;
      stashDep.storedGoods[action.goodId] = (stashDep.storedGoods[action.goodId] || 0) + qty;
      return s;
    }

    case 'WITHDRAW_STASH': {
      const stashWith = s.stashHouses.find(st => st.id === action.stashId);
      if (!stashWith || stashWith.discovered) return s;
      const stQty = Math.min(action.amount, stashWith.storedGoods[action.goodId] || 0);
      if (stQty <= 0) return s;
      stashWith.storedGoods[action.goodId] = (stashWith.storedGoods[action.goodId] || 0) - stQty;
      s.inventory[action.goodId] = (s.inventory[action.goodId] || 0) + stQty;
      return s;
    }

    case 'UPGRADE_SMUGGLE_ROUTE': {
      const route = s.smuggleRoutes.find(r => r.id === action.routeId);
      if (!route || route.level >= 3) return s;
      const routeUpgCost = 5000 + route.level * 8000;
      if (s.money < routeUpgCost) return s;
      s.money -= routeUpgCost;
      s.stats.totalSpent += routeUpgCost;
      route.level++;
      return s;
    }

    case 'SPECIALIZE_ROUTE': {
      const specRoute = s.smuggleRoutes.find(r => r.id === action.routeId);
      if (!specRoute) return s;
      if (s.money < 3000) return s;
      s.money -= 3000;
      s.stats.totalSpent += 3000;
      specRoute.specialization = action.goodId;
      return s;
    }

    case 'ASSIGN_ROUTE_ESCORT': {
      const escRoute = s.smuggleRoutes.find(r => r.id === action.routeId);
      if (!escRoute) return s;
      escRoute.escort = action.crewName;
      escRoute.escortRole = action.crewRole;
      return s;
    }

    case 'REMOVE_ROUTE_ESCORT': {
      const remRoute = s.smuggleRoutes.find(r => r.id === action.routeId);
      if (!remRoute) return s;
      remRoute.escort = null;
      remRoute.escortRole = null;
      return s;
    }

    case 'LAUNDER_METHOD': {
      const method = LAUNDER_METHODS.find(m => m.id === action.methodId);
      if (!method) return s;
      if (!isMethodUnlocked(method.id, s.ownedDistricts, s.player.level, s.propertyId)) return s;
      const cap = getMethodCapacity(method, s.ownedBusinesses, s.ownedDistricts.includes('neon'));
      const used = s.launderMethodsUsed[action.methodId] || 0;
      const remaining = cap - used;
      const actual = Math.min(action.amount, s.dirtyMoney, remaining);
      if (actual <= 0) return s;
      const cleanAmount = Math.floor(actual * method.cleanRate);
      const heatGain = Math.max(1, Math.floor(actual / 1000 * method.heatPerUnit));
      s.dirtyMoney -= actual;
      s.money += cleanAmount;
      s.stats.totalEarned += cleanAmount;
      // This wrote to `s.heat`, the derived field that recomputeHeat overwrites from
      // personal and vehicle heat on the next tick — so the "high risk" of a crypto mix
      // evaporated before it could cost anything. It lands on you now, which is what
      // makes the faster, dirtier pipe an actual choice.
      Engine.addPersonalHeat(s, heatGain);
      Engine.recomputeHeat(s);
      s.launderMethodsUsed[action.methodId] = used + actual;
      s.washUsedToday += actual;
      return s;
    }

    case 'DISMISS_INSIDER_TIP_MARKET': {
      s.insiderTips = (s.insiderTips || []).filter(t => t.id !== action.tipId);
      return s;
    }

    // ========== LOOT CRATE ACTIONS ==========
    case 'OPEN_LOOT_CRATE': {
      const crateDef = getCrateDef(action.tier);
      if (s.money < crateDef.price) return s;
      s.money -= crateDef.price;
      s.stats.totalSpent += crateDef.price;
      const { result, newPityCounter } = openCrate(action.tier, s.player.level, s.pityCounter || 0);
      s.pityCounter = newPityCounter;
      s.lootCratesPurchased = (s.lootCratesPurchased || 0) + 1;
      if (result.weapon) {
        if (!s.weaponInventory) s.weaponInventory = [];
        if (s.weaponInventory.length < 50) s.weaponInventory.push(result.weapon);
      }
      if (result.gear) {
        const inv = result.gear.type === 'armor' ? 'armorInventory' : 'gadgetInventory';
        if (!s[inv]) (s as any)[inv] = [];
        if ((s as any)[inv].length < 50) (s as any)[inv].push(result.gear);
      }
      return s;
    }

    // ========== LOOT BOX ACTIONS ==========
    case 'OPEN_LOOT_BOX': {
      const boxDef = getLootBoxDef(action.tier);
      if (s.money < boxDef.price) return s;
      s.money -= boxDef.price;
      s.stats.totalSpent += boxDef.price;
      const { result: lbResult, newPityCounter: newLBPity } = openLootBox(action.tier, s.player.level, s.lootBoxPity || 0);
      s.lootBoxPity = newLBPity;
      s.lootBoxesOpened = (s.lootBoxesOpened || 0) + 1;
      s.lastLootBoxResult = lbResult;
      for (const reward of lbResult.rewards) {
        if (reward.type === 'money') {
          s.money += reward.value;
          s.stats.totalEarned += reward.value;
        } else if (reward.type === 'ammo') {
          s.ammo = Math.min(500, (s.ammo || 0) + reward.value);
        } else if (reward.type === 'scrap') {
          s.scrapMaterials = (s.scrapMaterials || 0) + reward.value;
        } else if (reward.type === 'weapon' && reward.weapon) {
          if (!s.weaponInventory) s.weaponInventory = [];
          if (s.weaponInventory.length < 50) s.weaponInventory.push(reward.weapon);
        } else if (reward.type === 'armor' && reward.gear) {
          if (!s.armorInventory) s.armorInventory = [];
          if (s.armorInventory.length < 50) s.armorInventory.push(reward.gear);
        } else if (reward.type === 'gadget' && reward.gear) {
          if (!s.gadgetInventory) s.gadgetInventory = [];
          if (s.gadgetInventory.length < 50) s.gadgetInventory.push(reward.gear);
        }
      }
      return s;
    }

    // ========== DUNGEON / RAID ACTIONS ==========
    case 'START_DUNGEON': {
      const dungTierDef = getDungeonTierDef(action.tier);
      if (s.activeDungeon) return s;
      if ((s.player?.level || 1) < dungTierDef.minLevel) return s;
      if ((s.energy || 0) < dungTierDef.energyCost) return s;
      s.energy = (s.energy || 0) - dungTierDef.energyCost;
      s.activeDungeon = startDungeonRun(action.dungeonId, action.tier);
      s.lastDungeonResult = null;
      return s;
    }

    case 'COLLECT_DUNGEON': {
      if (!s.activeDungeon) return s;
      if (!isDungeonComplete(s.activeDungeon)) return s;
      const dungResult = resolveDungeonRun(s.activeDungeon, s.player?.level || 1, 0);
      s.lastDungeonResult = dungResult;
      s.activeDungeon = null;
      s.dungeonsCompleted = (s.dungeonsCompleted || 0) + 1;
      // Apply rewards
      s.money += dungResult.money;
      s.stats.totalEarned += dungResult.money;
      Engine.gainXp(s, dungResult.xp, 'dungeon');
      if (dungResult.scrap > 0) s.scrapMaterials = (s.scrapMaterials || 0) + dungResult.scrap;
      // Loot box rewards → auto-open and add items
      for (const boxTier of dungResult.lootBoxRewards) {
        const { result: lbResult, newPityCounter } = openLootBox(boxTier, s.player?.level || 1, s.lootBoxPity || 0);
        s.lootBoxPity = newPityCounter;
        s.lootBoxesOpened = (s.lootBoxesOpened || 0) + 1;
        for (const reward of lbResult.rewards) {
          if (reward.type === 'money') { s.money += reward.value; s.stats.totalEarned += reward.value; }
          else if (reward.type === 'ammo') { s.ammo = Math.min(500, (s.ammo || 0) + reward.value); }
          else if (reward.type === 'scrap') { s.scrapMaterials = (s.scrapMaterials || 0) + reward.value; }
          else if (reward.type === 'weapon' && reward.weapon) {
            if (!s.weaponInventory) s.weaponInventory = [];
            if (s.weaponInventory.length < 50) s.weaponInventory.push(reward.weapon);
          }
          else if (reward.type === 'armor' && reward.gear) {
            if (!s.armorInventory) s.armorInventory = [];
            if (s.armorInventory.length < 50) s.armorInventory.push(reward.gear);
          }
          else if (reward.type === 'gadget' && reward.gear) {
            if (!s.gadgetInventory) s.gadgetInventory = [];
            if (s.gadgetInventory.length < 50) s.gadgetInventory.push(reward.gear);
          }
        }
      }
      return s;
    }

    // ========== DAILY LOGIN REWARD ACTIONS ==========
    case 'CLAIM_DAILY_LOGIN_REWARD': {
      if (!canClaimDailyReward(s.lastDailyRewardClaim)) return s;
      let streak = s.dailyRewardStreak || 0;
      if (shouldResetStreak(s.lastDailyRewardClaim)) streak = 0;
      streak += 1;
      const result = claimDailyReward(streak, s.player.level);
      s.dailyRewardStreak = streak;
      s.lastDailyRewardClaim = new Date().toISOString();
      if (result.money) { s.money += Math.floor(result.money); s.stats.totalEarned += Math.floor(result.money); }
      if (result.ammo) { s.ammo = Math.min(500, (s.ammo || 0) + result.ammo); }
      if (result.weapon) {
        if (!s.weaponInventory) s.weaponInventory = [];
        if (s.weaponInventory.length < 50) s.weaponInventory.push(result.weapon);
      }
      if (result.gear) {
        const inv = result.gear.type === 'armor' ? 'armorInventory' : 'gadgetInventory';
        if (!s[inv]) (s as any)[inv] = [];
        if ((s as any)[inv].length < 50) (s as any)[inv].push(result.gear);
      }
      return s;
    }

    // ========== SALVAGE/CRAFTING ACTIONS ==========
    case 'SALVAGE_WEAPON': {
      if (!s.weaponInventory) return s;
      const wpn = s.weaponInventory.find(w => w.id === action.weaponId);
      if (!wpn || wpn.equipped || wpn.locked) return s;
      const scrap = getWeaponScrapValue(wpn);
      s.scrapMaterials = (s.scrapMaterials || 0) + scrap;
      s.weaponInventory = s.weaponInventory.filter(w => w.id !== action.weaponId);
      return s;
    }

    case 'SALVAGE_GEAR': {
      const gSalvInv = action.gearType === 'armor' ? s.armorInventory : s.gadgetInventory;
      if (!gSalvInv) return s;
      const gSalv = gSalvInv.find(g => g.id === action.gearId);
      if (!gSalv || gSalv.equipped || gSalv.locked) return s;
      const gScrap = getGearScrapValue(gSalv);
      s.scrapMaterials = (s.scrapMaterials || 0) + gScrap;
      if (action.gearType === 'armor') s.armorInventory = gSalvInv.filter(g => g.id !== action.gearId);
      else s.gadgetInventory = gSalvInv.filter(g => g.id !== action.gearId);
      return s;
    }

    case 'CRAFT_SALVAGE': {
      const recipe = SALVAGE_RECIPES.find((r: any) => r.id === action.recipeId);
      if (!recipe) return s;
      if ((s.scrapMaterials || 0) < recipe.scrapCost) return s;
      const craftResult = executeCraft(action.recipeId, s.player.level);
      if (!craftResult) return s;
      s.scrapMaterials = (s.scrapMaterials || 0) - recipe.scrapCost;
      if (craftResult.weapon) {
        if (!s.weaponInventory) s.weaponInventory = [];
        if (s.weaponInventory.length < 50) s.weaponInventory.push(craftResult.weapon);
      }
      if (craftResult.gear) {
        const inv = craftResult.gear.type === 'armor' ? 'armorInventory' : 'gadgetInventory';
        if (!s[inv]) (s as any)[inv] = [];
        if ((s as any)[inv].length < 50) (s as any)[inv].push(craftResult.gear);
      }
      return s;
    }

    // ========== ENCHANTMENT ACTIONS ==========
    case 'ADD_ENCHANTMENT': {
      if (!s.enchantmentInventory) s.enchantmentInventory = [];
      s.enchantmentInventory.push(action.enchantment);
      return s;
    }

    case 'SOCKET_ENCHANTMENT_WEAPON': {
      if (!s.weaponInventory || !s.enchantmentInventory) return s;
      const enchItem = s.enchantmentInventory.find((e: any) => e.id === action.enchantmentItemId);
      if (!enchItem) return s;
      const socketCostMoney = action.cost || 0;
      if (s.money < socketCostMoney) return s;
      s.money -= socketCostMoney;
      s.weaponInventory = s.weaponInventory.map(w => w.id === action.weaponId ? { ...w, enchantmentId: enchItem.enchantmentId } : w);
      s.enchantmentInventory = s.enchantmentInventory.filter((e: any) => e.id !== action.enchantmentItemId);
      return s;
    }

    case 'SOCKET_ENCHANTMENT_GEAR': {
      const enchInv = s.enchantmentInventory || [];
      const eItem = enchInv.find((e: any) => e.id === action.enchantmentItemId);
      if (!eItem) return s;
      const sCost = action.cost || 0;
      if (s.money < sCost) return s;
      s.money -= sCost;
      const gInvE = action.gearType === 'armor' ? s.armorInventory : s.gadgetInventory;
      if (!gInvE) return s;
      const gUpdated = gInvE.map(g => g.id === action.gearId ? { ...g, enchantmentId: eItem.enchantmentId } : g);
      if (action.gearType === 'armor') s.armorInventory = gUpdated;
      else s.gadgetInventory = gUpdated;
      s.enchantmentInventory = enchInv.filter((e: any) => e.id !== action.enchantmentItemId);
      return s;
    }

    case 'SALVAGE_ENCHANTMENT': {
      if (!s.enchantmentInventory) return s;
      const eSalv = s.enchantmentInventory.find((e: any) => e.id === action.enchantmentItemId);
      if (!eSalv) return s;
      const eScrapValues: Record<string, number> = { uncommon: 2, rare: 5, epic: 12, legendary: 30 };
      s.scrapMaterials = (s.scrapMaterials || 0) + (eScrapValues[eSalv.rarity] || 2);
      s.enchantmentInventory = s.enchantmentInventory.filter((e: any) => e.id !== action.enchantmentItemId);
      return s;
    }

    // ========== SKIN ACTIONS ==========
    case 'ADD_SKIN': {
      if (!s.skinInventory) s.skinInventory = [];
      s.skinInventory.push(action.skin);
      return s;
    }

    case 'APPLY_SKIN_WEAPON': {
      if (!s.weaponInventory || !s.skinInventory) return s;
      const skinItem = s.skinInventory.find((sk: any) => sk.id === action.skinItemId);
      if (!skinItem) return s;
      s.weaponInventory = s.weaponInventory.map(w => w.id === action.weaponId ? { ...w, skinId: skinItem.skinId } : w);
      s.skinInventory = s.skinInventory.filter((sk: any) => sk.id !== action.skinItemId);
      return s;
    }

    case 'APPLY_SKIN_GEAR': {
      const skInvG = s.skinInventory || [];
      const skItem = skInvG.find((sk: any) => sk.id === action.skinItemId);
      if (!skItem) return s;
      const skGInv = action.gearType === 'armor' ? s.armorInventory : s.gadgetInventory;
      if (!skGInv) return s;
      const skUpdated = skGInv.map(g => g.id === action.gearId ? { ...g, skinId: skItem.skinId } : g);
      if (action.gearType === 'armor') s.armorInventory = skUpdated;
      else s.gadgetInventory = skUpdated;
      s.skinInventory = skInvG.filter((sk: any) => sk.id !== action.skinItemId);
      return s;
    }

    // ========== DURABILITY / REPAIR ACTIONS ==========
    case 'REPAIR_WEAPON': {
      if (!s.weaponInventory) return s;
      const repWpn = s.weaponInventory.find(w => w.id === action.weaponId);
      if (!repWpn) return s;
      if (action.useScrap) {
        const scrapNeeded: Record<string, number> = { common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 15 };
        const cost = scrapNeeded[repWpn.rarity] || 4;
        if ((s.scrapMaterials || 0) < cost) return s;
        s.scrapMaterials = (s.scrapMaterials || 0) - cost;
      } else {
        const missing = 100 - (repWpn.durability || 100);
        const costPerPoint: Record<string, number> = { common: 20, uncommon: 40, rare: 80, epic: 150, legendary: 300 };
        const moneyCost = Math.ceil(missing * (costPerPoint[repWpn.rarity] || 80));
        if (s.money < moneyCost) return s;
        s.money -= moneyCost;
      }
      s.weaponInventory = s.weaponInventory.map(w => w.id === action.weaponId ? { ...w, durability: 100 } : w);
      return s;
    }

    case 'REPAIR_GEAR': {
      const repGInv = action.gearType === 'armor' ? s.armorInventory : s.gadgetInventory;
      if (!repGInv) return s;
      const repGear = repGInv.find(g => g.id === action.gearId);
      if (!repGear) return s;
      if (action.useScrap) {
        const gScrapNeeded: Record<string, number> = { common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 15 };
        const gCost = gScrapNeeded[repGear.rarity] || 4;
        if ((s.scrapMaterials || 0) < gCost) return s;
        s.scrapMaterials = (s.scrapMaterials || 0) - gCost;
      } else {
        const gMissing = 100 - (repGear.durability || 100);
        const gCostPerPoint: Record<string, number> = { common: 20, uncommon: 40, rare: 80, epic: 150, legendary: 300 };
        const gMoneyCost = Math.ceil(gMissing * (gCostPerPoint[repGear.rarity] || 80));
        if (s.money < gMoneyCost) return s;
        s.money -= gMoneyCost;
      }
      const repGUpdated = repGInv.map(g => g.id === action.gearId ? { ...g, durability: 100 } : g);
      if (action.gearType === 'armor') s.armorInventory = repGUpdated;
      else s.gadgetInventory = repGUpdated;
      return s;
    }

    // ========== BLUEPRINT ACTIONS ==========
    case 'ADD_BLUEPRINT': {
      if (!s.blueprintInventory) s.blueprintInventory = [];
      s.blueprintInventory.push(action.blueprint);
      return s;
    }

    case 'CRAFT_BLUEPRINT': {
      if (!s.blueprintInventory) return s;
      const bpItem = s.blueprintInventory.find((b: any) => b.id === action.blueprintItemId);
      if (!bpItem) return s;
      const { getBlueprintDef, craftFromBlueprint } = require('../game/blueprints');
      const bpDef = getBlueprintDef(bpItem.blueprintId);
      if (!bpDef) return s;
      if ((s.scrapMaterials || 0) < bpDef.scrapCost || s.money < bpDef.moneyCost) return s;
      s.scrapMaterials = (s.scrapMaterials || 0) - bpDef.scrapCost;
      s.money -= bpDef.moneyCost;
      s.stats.totalSpent += bpDef.moneyCost;
      const bpResult = craftFromBlueprint(bpDef, s.player.level);
      if (bpResult.type === 'weapon') {
        if (!s.weaponInventory) s.weaponInventory = [];
        s.weaponInventory.push(bpResult.item);
      } else {
        const bpInv = bpResult.type === 'armor' ? 'armorInventory' : 'gadgetInventory';
        if (!s[bpInv]) (s as any)[bpInv] = [];
        (s as any)[bpInv].push(bpResult.item);
      }
      // Remove used blueprint
      s.blueprintInventory = s.blueprintInventory.filter((b: any) => b.id !== action.blueprintItemId);
      return s;
    }

    // ========== LOADOUT PRESET ACTIONS ==========
    case 'SAVE_LOADOUT_PRESET': {
      if (!s.loadoutPresets) s.loadoutPresets = [];
      if (s.loadoutPresets.length >= 5) return s;
      const eqWpn = s.weaponInventory?.find(w => w.equipped);
      const eqArm = s.armorInventory?.find(g => g.equipped);
      const eqGad = s.gadgetInventory?.find(g => g.equipped);
      s.loadoutPresets.push({
        id: `preset_${Date.now()}`,
        name: action.name || `Loadout ${s.loadoutPresets.length + 1}`,
        weaponId: eqWpn?.id || null,
        armorId: eqArm?.id || null,
        gadgetId: eqGad?.id || null,
        createdDay: s.day,
      });
      return s;
    }

    case 'LOAD_LOADOUT_PRESET': {
      if (!s.loadoutPresets) return s;
      const preset = s.loadoutPresets.find((p: any) => p.id === action.presetId);
      if (!preset) return s;
      // Equip weapon
      if (preset.weaponId && s.weaponInventory) {
        s.weaponInventory = s.weaponInventory.map(w => ({ ...w, equipped: w.id === preset.weaponId }));
      }
      // Equip armor
      if (preset.armorId && s.armorInventory) {
        s.armorInventory = s.armorInventory.map(g => ({ ...g, equipped: g.id === preset.armorId }));
      }
      // Equip gadget
      if (preset.gadgetId && s.gadgetInventory) {
        s.gadgetInventory = s.gadgetInventory.map(g => ({ ...g, equipped: g.id === preset.gadgetId }));
      }
      return s;
    }

    case 'DELETE_LOADOUT_PRESET': {
      if (!s.loadoutPresets) return s;
      s.loadoutPresets = s.loadoutPresets.filter((p: any) => p.id !== action.presetId);
      return s;
    }

    case 'RENAME_LOADOUT_PRESET': {
      if (!s.loadoutPresets) return s;
      s.loadoutPresets = s.loadoutPresets.map((p: any) => p.id === action.presetId ? { ...p, name: action.name } : p);
      return s;
    }

    // ========== WEAPON CHALLENGE PROGRESS ==========
    case 'UPDATE_WEAPON_CHALLENGE': {
      if (!s.weaponInventory) return s;
      s.weaponInventory = s.weaponInventory.map(w => {
        if (w.id !== action.weaponId) return w;
        const { updateChallengeProgress: updateCP } = require('../game/weaponChallenges');
        const result = updateCP(w.challenges || [], action.challengeType);
        return { ...w, challenges: result.updated };
      });
      return s;
    }


    case 'START_CAMPAIGN_MISSION': {
      if (!s.campaign) return s;
      if (!s.campaign) return s;
      if (!canStartMission(s.campaign, action.chapterId, action.missionId, s.player.level)) return s;
      const mDef = getMissionDef(action.missionId);
      if (!mDef || s.energy < mDef.energyCost) return s;
      s.energy -= mDef.energyCost;
      s.campaign.activeCampaignMission = startCampaignMission(action.chapterId, action.missionId);
      return s;
    }

    case 'ADVANCE_CAMPAIGN_MISSION': {
      if (!s.campaign?.activeCampaignMission) return s;
      const playerPower = Engine.getPlayerStat(s, 'muscle') + Engine.getPlayerStat(s, 'brains');
      const adaptiveMod = (s.campaign.failCounts?.[s.campaign.activeCampaignMission.missionId] || 0) * 0.1;
      s.campaign.activeCampaignMission = advanceCampaignMission(s.campaign.activeCampaignMission, s.player.level, playerPower, action.choice, Math.min(0.3, adaptiveMod));
      return s;
    }

    case 'CAMPAIGN_MISSION_PUSH': {
      if (!s.campaign?.activeCampaignMission) return s;
      s.campaign.activeCampaignMission.carryOver.bonusLootMod *= 1.5;
      s.campaign.activeCampaignMission.riskRewardPending = false;
      return s;
    }

    case 'CAMPAIGN_MISSION_REST': {
      if (!s.campaign?.activeCampaignMission) return s;
      s.campaign.activeCampaignMission.morale = Math.min(100, s.campaign.activeCampaignMission.morale + 15);
      s.campaign.activeCampaignMission.carryOver.moraleBoosted = true;
      s.campaign.activeCampaignMission.riskRewardPending = false;
      return s;
    }

    case 'COLLECT_CAMPAIGN_MISSION_REWARDS': {
      if (!s.campaign?.activeCampaignMission) return s;
      const m = s.campaign.activeCampaignMission;
      if (!m.finished || !m.success) return s;
      const ratingMult = m.rating === 3 ? 1.5 : m.rating === 2 ? 1.2 : 1.0;
      const finalMoney = Math.floor(m.rewards.money * ratingMult);
      const finalRep = Math.floor(m.rewards.rep * ratingMult);
      const finalXp = Math.floor(m.rewards.xp * ratingMult);
      s.money += finalMoney;
      s.stats.totalEarned += finalMoney;
      s.rep += finalRep;
      Engine.gainXp(s, finalXp);
      s.heat = Math.min(100, s.heat + (m.totalHeatGain || 0));
      // Mark mission completed
      const chProgress = s.campaign.chapters.find(c => c.chapterId === m.chapterId);
      if (chProgress) {
        const mProgress = chProgress.missions.find(mp => mp.missionId === m.missionId);
        if (mProgress) {
          mProgress.completed = true;
          mProgress.completedAt = s.day;
          const ratingStr = '⭐'.repeat(m.rating || 1);
          if (!mProgress.bestRating || (m.rating || 1) > (mProgress.bestRating === '⭐⭐⭐' ? 3 : mProgress.bestRating === '⭐⭐' ? 2 : 1)) {
            mProgress.bestRating = ratingStr;
          }
        }
      }
      // Streak tracking
      if (!s.campaign.missionStreak) s.campaign.missionStreak = 0;
      if (m.rating >= 3) {
        s.campaign.missionStreak++;
      } else {
        s.campaign.missionStreak = 0;
      }
      // Track total encounters
      if (!s.campaign.totalEncountersCompleted) s.campaign.totalEncountersCompleted = 0;
      s.campaign.totalEncountersCompleted += m.totalEncounters;
      // Add dropped weapon
      if (m.droppedWeapon) {
        if (!s.weaponInventory) s.weaponInventory = [];
        if (s.weaponInventory.length < 20) s.weaponInventory.push(m.droppedWeapon);
      }
      // Add dropped gear
      if (m.droppedGear) {
        const gInv = m.droppedGear.type === 'armor' ? 'armorInventory' : 'gadgetInventory';
        if (!s[gInv]) (s as any)[gInv] = [];
        if ((s as any)[gInv].length < 20) (s as any)[gInv].push(m.droppedGear);
      }
      s.campaign.activeCampaignMission = null;
      return s;
    }

    case 'END_CAMPAIGN_MISSION': {
      if (s.campaign) s.campaign.activeCampaignMission = null;
      return s;
    }

    case 'START_BOSS_FIGHT_CAMPAIGN': {
      if (!s.campaign) return s;
      if (!s.campaign) return s;
      if (!canFightBoss(s.campaign, action.chapterId, s.player.level)) return s;
      const chProgress = s.campaign.chapters.find(c => c.chapterId === action.chapterId);
      const diff = chProgress?.difficulty || 'normal';
      s.campaign.activeBossFight = startBossFight(action.chapterId, s.playerHP, s.playerMaxHP, diff, s.player.level);
      return s;
    }

    case 'BOSS_FIGHT_ACTION': {
      if (!s.campaign?.activeBossFight) return s;
      const pDmg = Engine.getPlayerStat(s, 'muscle') + Math.floor(s.player.level * 2);
      const pArmor = Math.floor(Engine.getPlayerStat(s, 'brains') * 0.5);
      const pSpeed = Engine.getPlayerStat(s, 'brains') + Math.floor(s.player.level * 0.5);
      s.campaign.activeBossFight = bossFightTurn(s.campaign.activeBossFight, action.action, pDmg, pArmor, pSpeed, action.itemId);
      // Sync player HP back
      if (s.campaign.activeBossFight.finished && !s.campaign.activeBossFight.won) {
        s.playerHP = Math.max(1, Math.floor(s.playerMaxHP * 0.1));
      }
      // Generate loot if won
      if (s.campaign.activeBossFight.finished && s.campaign.activeBossFight.won) {
        const fight = s.campaign.activeBossFight;
        const chProgress = s.campaign.chapters.find(c => c.chapterId === fight.chapterId);
        const killCount = chProgress?.boss.killCount || 0;
        const diff = chProgress?.difficulty || 'normal';
        const loot = generateBossLoot(fight.chapterId, s.player.level, killCount, diff);
        s.campaign.activeBossFight.loot = loot.weapon;
        s.campaign.activeBossFight.gearLoot = loot.gear;
        s.campaign.activeBossFight.moneyLoot = loot.money;
        s.campaign.activeBossFight.accessoryLoot = loot.accessory;
      }
      return s;
    }

    case 'COLLECT_BOSS_LOOT': {
      if (!s.campaign?.activeBossFight?.won) return s;
      const fight = s.campaign.activeBossFight;
      // Add money
      s.money += fight.moneyLoot;
      s.stats.totalEarned += fight.moneyLoot;
      // Add weapon
      if (fight.loot) {
        if (!s.weaponInventory) s.weaponInventory = [];
        if (s.weaponInventory.length < 20) s.weaponInventory.push(fight.loot);
      }
      // Add gear loot
      if (fight.gearLoot) {
        const gInv = fight.gearLoot.type === 'armor' ? 'armorInventory' : 'gadgetInventory';
        if (!s[gInv]) (s as any)[gInv] = [];
        if ((s as any)[gInv].length < 20) (s as any)[gInv].push(fight.gearLoot);
      }
      // Add boss trophy
      if (!s.campaign.trophies) s.campaign.trophies = [];
      if (!s.campaign.trophies.includes(fight.bossId)) {
        s.campaign.trophies.push(fight.bossId);
      }
      // Update boss progress
      const chProgress = s.campaign.chapters.find(c => c.chapterId === fight.chapterId);
      if (chProgress) {
        chProgress.boss.killCount++;
        chProgress.boss.lastKillDay = s.day;
        if (!chProgress.boss.bestTime || fight.turn < chProgress.boss.bestTime) {
          chProgress.boss.bestTime = fight.turn;
        }
        s.campaign.totalBossKills++;
        // Check chapter completion
        const allMissionsDone = chProgress.missions.every(m => m.completed);
        if (allMissionsDone && chProgress.boss.killCount >= 1 && !chProgress.completed) {
          chProgress.completed = true;
          chProgress.completedAt = s.day;
          if (!s.campaign.chapterBonuses.includes(fight.chapterId)) {
            s.campaign.chapterBonuses.push(fight.chapterId);
          }
          const chIdx = s.campaign.chapters.findIndex(c => c.chapterId === fight.chapterId);
          if (chIdx >= 0 && chIdx < s.campaign.chapters.length - 1) {
            s.campaign.chapters[chIdx + 1].unlocked = true;
          }
        }
      }
      s.campaign.activeBossFight = null;
      return s;
    }

    case 'END_BOSS_FIGHT': {
      if (s.campaign) s.campaign.activeBossFight = null;
      return s;
    }

    case 'SET_CHAPTER_DIFFICULTY': {
      if (!s.campaign) return s;
      const chP = s.campaign.chapters.find(c => c.chapterId === action.chapterId);
      if (chP && chP.completed) {
        chP.difficulty = action.difficulty;
      }
      return s;
    }


    case 'BUY_HEIST_EQUIP': {
      if (!s.heistPlan) return s;
      const equip = HEIST_EQUIPMENT.find((e: any) => e.id === action.equipId);
      if (!equip || s.money < equip.cost) return s;
      if (s.heistPlan.equipment.includes(action.equipId)) return s;
      s.money -= equip.cost;
      s.stats.totalSpent += equip.cost;
      s.heistPlan.equipment.push(action.equipId);
      return s;
    }

    case 'LAUNCH_HEIST': {
      if (!s.heistPlan) return s;
      const validation = validateHeistPlan(s.heistPlan, s);
      if (!validation.valid) return s;
      s.activeHeist = startHeistFn(s, s.heistPlan);
      s.heistPlan = null;
      // Execute first phase
      executePhase(s, s.activeHeist);
      return s;
    }

    case 'ADVANCE_HEIST': {
      if (!s.activeHeist || s.activeHeist.finished || s.activeHeist.pendingComplication) return s;
      executePhase(s, s.activeHeist);
      return s;
    }

    case 'RESOLVE_HEIST_COMPLICATION': {
      if (!s.activeHeist || !s.activeHeist.pendingComplication) return s;
      resolveComplication(s, s.activeHeist, action.choiceId, action.forceResult);
      // If no more pending complication and not finished, auto-advance
      if (!s.activeHeist.pendingComplication && !s.activeHeist.finished) {
        executePhase(s, s.activeHeist);
      }
      return s;
    }

    case 'FINISH_HEIST': {
      if (!s.activeHeist) return s;
      const heist = s.activeHeist;
      const tmpl = HEIST_TEMPLATES.find((h: any) => h.id === heist.plan.heistId);
      // Apply rewards
      if (heist.success) {
        s.money += heist.totalReward;
        s.stats.totalEarned += heist.totalReward;
        s.rep += 25 + (tmpl?.tier || 1) * 10;
        s.screenEffect = 'gold-flash';
        s.lastRewardAmount = heist.totalReward;
        // Faction effect
        if (tmpl?.factionEffect) {
          s.familyRel[tmpl.factionEffect.familyId] = (s.familyRel[tmpl.factionEffect.familyId] || 0) + tmpl.factionEffect.change;
        }
        // District rep
        if (tmpl) {
          s.districtRep[tmpl.district] = Math.min(100, (s.districtRep[tmpl.district] || 0) + 10);
        }
      } else {
        s.money += Math.max(0, heist.totalReward);
        s.stats.totalEarned += Math.max(0, heist.totalReward);
        s.screenEffect = 'blood-flash';
      }
      // Apply heat
      Engine.splitHeat(s, Math.max(0, heist.totalHeat + (tmpl?.baseHeat || 0)), 0.4);
      Engine.recomputeHeat(s);
      // Crew damage
      if (heist.totalCrewDamage > 0) {
        Object.values(heist.plan.crewAssignments).forEach(idx => {
          if (idx !== null && s.crew[idx]) {
            s.crew[idx].hp = Math.max(1, s.crew[idx].hp - Math.floor(heist.totalCrewDamage / 3));
            s.crew[idx].xp += heist.success ? 15 : 5;
          }
        });
      }
      // Set cooldown
      if (!s.heistCooldowns) s.heistCooldowns = {};
      s.heistCooldowns[heist.plan.heistId] = s.day;
      // XP
      Engine.gainXp(s, heist.success ? 50 : 15);
      s.activeHeist = null;
      Engine.checkAchievements(s);
      return s;
    }

    case 'CANCEL_HEIST': {
      s.heistPlan = null;
      s.activeHeist = null;
      return s;
    }

    case 'BUY_PROPERTY': {
      const prop = PROPERTIES.find((p: any) => p.id === action.propertyId);
      if (!prop) return s;
      const current = getCurrentProperty(s.propertyId);
      if (prop.tier <= current.tier) return s; // can't downgrade
      if (prop.tier !== current.tier + 1) return s; // must be next tier
      if (!canAffordProperty(prop, s.money, s.player.level, s.rep)) return s;
      s.money -= prop.cost;
      s.stats.totalSpent += prop.cost;
      s.propertyId = prop.id;
      // Apply property bonuses
      if (prop.bonuses.maxEnergy) s.maxEnergy += prop.bonuses.maxEnergy;
      if (prop.bonuses.maxHp) { s.playerMaxHP += prop.bonuses.maxHp; s.playerHP = Math.min(s.playerHP, s.playerMaxHP); }
      if (prop.bonuses.storageSlots) s.maxInv = Engine.recalcMaxInv(s);
      addPhoneMessage(s, 'Makelaar', `🏠 Je bent verhuisd naar ${prop.name}! ${prop.description}`, 'info');
      Engine.checkAchievements(s);
      return s;
    }

    // BUY_VILLA, UPGRADE_VILLA, INSTALL_VILLA_MODULE and PRESTIGE_VILLA_MODULE lived
    // here. The villa is retired: a second progression system whose modules were drug
    // labs, a weapon room, a garage extension, a helipad and an escape tunnel — all
    // systems this game no longer has — and whose live parts (storage, a vault)
    // Uitrusting already owns.

    case 'CRAFT_ITEM': {
      if (!s.villa) return s;
      const recipe = VILLA_CRAFT_RECIPES.find((r: any) => r.id === action.recipeId);
      if (!recipe) return s;
      const check = villaCanCraft(s, recipe);
      if (!check.ok) return s;
      // Consume ingredients
      for (const ing of recipe.ingredients) {
        s.inventory[ing.goodId] = (s.inventory[ing.goodId] || 0) - ing.amount;
      }
      s.lab.chemicals -= recipe.chemCost;
      // Add crafted output with boosted cost basis
      const baseCost = GOODS.find((g: any) => g.id === recipe.output.goodId)?.base || 500;
      const craftedCost = Math.floor(baseCost * recipe.sellMultiplier);
      const existing = s.inventory[recipe.output.goodId] || 0;
      const existingCost = s.inventoryCosts[recipe.output.goodId] || 0;
      s.inventory[recipe.output.goodId] = existing + recipe.output.amount;
      s.inventoryCosts[recipe.output.goodId] = existing + recipe.output.amount > 0
        ? Math.floor(((existing * existingCost) + (recipe.output.amount * craftedCost)) / (existing + recipe.output.amount))
        : craftedCost;
      // Heat
      s.heat = Math.min(100, s.heat + recipe.heatGain);
      // Log
      if (!s.craftLog) s.craftLog = [];
      s.craftLog.unshift({
        id: `craft-${s.day}-${Date.now()}`,
        day: s.day,
        recipeId: recipe.id,
        recipeName: recipe.name,
        outputGoodId: recipe.output.goodId,
        outputAmount: recipe.output.amount,
        estimatedValue: craftedCost * recipe.output.amount,
      });
      if (s.craftLog.length > 30) s.craftLog = s.craftLog.slice(0, 30);
      // Daily progress for challenges
      if (s.dailyProgress) {
        s.dailyProgress.trades = (s.dailyProgress.trades || 0) + 1;
      }
      syncChallenges(s);
      return s;
    }

    // The villa vault, its goods and ammo storage, the helipad shortcut and throwing a
    // party went with it.

    case 'START_RACE': {
      if (s.raceUsedToday) return s;
      const raceDef = RACES.find(r => r.id === action.raceType);
      if (!raceDef) return s;
      if (s.money < action.bet) return s;
      s.raceUsedToday = true;
      const rr = action.result;
      if (rr.won) {
        const winnings = Math.floor(action.bet * rr.multiplier);
        s.money += winnings;
        s.stats.totalEarned += winnings;
        s.rep += rr.repGain;
        Engine.gainXp(s, rr.xpGain);
        s.screenEffect = 'gold-flash';
        s.lastRewardAmount = winnings;
      } else {
        s.money -= action.bet;
        s.stats.totalSpent += action.bet;
        // Damage vehicle on loss
        const activeOv = s.ownedVehicles.find(v => v.id === s.activeVehicle);
        if (activeOv && rr.conditionLoss > 0) {
          activeOv.condition = Math.max(10, activeOv.condition - rr.conditionLoss);
        }
      }
      // Heat
      Engine.addVehicleHeat(s, raceDef.heatGain);
      Engine.recomputeHeat(s);
      return s;
    }

    case 'SELL_VEHICLE': {
      const vIdx = s.ownedVehicles.findIndex(v => v.id === action.vehicleId);
      if (vIdx === -1 || s.ownedVehicles.length <= 1) return s;
      const vDef = VEHICLES.find(v => v.id === action.vehicleId);
      if (!vDef || vDef.cost === 0) return s;
      const ov = s.ownedVehicles[vIdx];
      const conditionMod = (ov.condition / 100) * 0.3 + 0.4;
      const upgradeBonus = ov.upgrades ? Object.values(ov.upgrades).reduce((sum, lvl) => sum + ((lvl as number) || 0) * 0.05, 0) : 0;
      const sellPrice = Math.floor(vDef.cost * (0.55 + upgradeBonus) * conditionMod);
      s.money += sellPrice;
      s.stats.totalEarned += sellPrice;
      s.ownedVehicles.splice(vIdx, 1);
      if (s.activeVehicle === action.vehicleId && s.ownedVehicles.length > 0) {
        s.activeVehicle = s.ownedVehicles[0].id;
        s.maxInv = Engine.recalcMaxInv(s);
      }
      return s;
    }

    case 'TRADE_IN_VEHICLE': {
      const oldIdx = s.ownedVehicles.findIndex(v => v.id === action.oldVehicleId);
      if (oldIdx === -1) return s;
      const oldDef = VEHICLES.find(v => v.id === action.oldVehicleId);
      const newDef = VEHICLES.find(v => v.id === action.newVehicleId);
      if (!oldDef || !newDef || oldDef.cost === 0) return s;
      const oldOv = s.ownedVehicles[oldIdx];
      const condMod = (oldOv.condition / 100) * 0.3 + 0.4;
      const upBonus = oldOv.upgrades ? Object.values(oldOv.upgrades).reduce((sum, lvl) => sum + ((lvl as number) || 0) * 0.05, 0) : 0;
      const tradeInPrice = Math.floor(oldDef.cost * (0.55 + upBonus + 0.10) * condMod); // +10% trade-in bonus
      const mod = s.vehiclePriceModifiers?.[action.newVehicleId] ?? 1;
      const newPrice = Math.floor(newDef.cost * mod);
      const netCost = newPrice - tradeInPrice;
      if (netCost > 0 && s.money < netCost) return s;
      s.money -= Math.max(0, netCost);
      if (netCost > 0) s.stats.totalSpent += netCost;
      if (netCost < 0) { s.money += Math.abs(netCost); s.stats.totalEarned += Math.abs(netCost); }
      s.ownedVehicles.splice(oldIdx, 1);
      s.ownedVehicles.push({ id: action.newVehicleId, condition: 100, vehicleHeat: 0, rekatCooldown: 0 });
      if (s.activeVehicle === action.oldVehicleId) {
        s.activeVehicle = action.newVehicleId;
        s.maxInv = Engine.recalcMaxInv(s);
      }
      return s;
    }

    // ========== BOUNTY ACTIONS ==========

    case 'PLACE_BOUNTY': {
      const target = bountyModule.BOUNTY_TARGETS.find(t => t.id === action.targetId);
      if (!target || s.money < target.cost) return s;
      s.money -= target.cost;
      s.stats.totalSpent += target.cost;
      if (!s.placedBounties) s.placedBounties = [];
      s.placedBounties.push({
        id: `placed_${s.day}_${action.targetId}`,
        targetName: target.name,
        targetType: 'npc',
        reward: target.cost,
        placedBy: 'Speler',
        deadline: s.day + 7,
        status: 'active',
        familyId: target.familyId,
        district: target.district,
      });
      // Remove from board
      s.bountyBoard = s.bountyBoard.filter(b => b.id !== action.targetId);
      return s;
    }

    case 'RESOLVE_BOUNTY_ENCOUNTER': {
      if (!s.pendingBountyEncounter) return s;
      bountyModule.resolveBountyEncounter(s, action.choice);
      s.pendingBountyEncounter = null;
      return s;
    }

    case 'DISMISS_BOUNTY_ENCOUNTER': {
      s.pendingBountyEncounter = null;
      return s;
    }

    case 'CANCEL_BOUNTY': {
      if (!s.placedBounties) return s;
      const bounty = s.placedBounties.find(b => b.id === action.bountyId);
      if (bounty) {
        bounty.status = 'expired';
        s.money += Math.floor(bounty.reward * 0.5); // refund half
        s.placedBounties = s.placedBounties.filter(b => b.id !== action.bountyId);
      }
      return s;
    }

    // ========== STOCK ACTIONS ==========

    case 'BUY_STOCK': {
      stockModule.buyStock(s, action.stockId as any, action.shares);
      return s;
    }

    case 'SELL_STOCK': {
      stockModule.sellStock(s, action.stockId as any, action.shares);
      return s;
    }

    case 'DISMISS_INSIDER_TIP': {
      s.pendingInsiderTip = null;
      return s;
    }

    // ========== DRUG EMPIRE ACTIONS ==========

    case 'UPGRADE_LAB': {
      if (!s.villa) return s;
      if (!s.drugEmpire) {
        if (shouldShowDrugEmpire(s)) s.drugEmpire = createDrugEmpireState();
        else return s;
      }
      if (!canUpgradeLab(s, action.labId, action.targetTier)) return s;
      const labCost = LAB_UPGRADE_COSTS[action.labId][action.targetTier];
      s.money -= labCost;
      s.stats.totalSpent += labCost;
      s.drugEmpire!.labTiers[action.labId] = action.targetTier;
      return s;
    }

    case 'SET_DRUG_TIER': {
      if (!s.drugEmpire) return s;
      const maxTier = s.drugEmpire.labTiers[action.labId];
      if (action.tier > maxTier) return s;
      s.drugEmpire.selectedQuality[action.labId] = action.tier;
      return s;
    }

    case 'ASSIGN_DEALER': {
      if (!s.drugEmpire) return s;
      if (!canAssignDealer(s, action.district)) return s;
      s.drugEmpire.dealers.push({
        district: action.district,
        crewName: action.crewName,
        marketShare: 5,
        daysActive: 0,
        product: action.product,
      });
      return s;
    }

    case 'RECALL_DEALER': {
      if (!s.drugEmpire) return s;
      s.drugEmpire.dealers = s.drugEmpire.dealers.filter(d => d.district !== action.district);
      return s;
    }

    case 'SELL_NOXCRYSTAL': {
      if (!s.drugEmpire || s.drugEmpire.noxCrystalStock < action.amount) return s;
      const noxValue = sellNoxCrystal(s, action.amount);
      if (noxValue > 0) s.lastRewardAmount = noxValue;
      return s;
    }

    case 'MERGE_SERVER_STATE': {
      const ss = (action as any).serverState;
      if (ss.money !== undefined) s.money = ss.money;
      if (ss.dirtyMoney !== undefined) s.dirtyMoney = ss.dirtyMoney;
      if (ss.debt !== undefined) s.debt = ss.debt;
      if (ss.rep !== undefined) s.rep = ss.rep;
      if (ss.heat !== undefined) s.heat = ss.heat;
      if (ss.personalHeat !== undefined) s.personalHeat = ss.personalHeat;
      if (ss.playerHP !== undefined) s.playerHP = ss.playerHP;
      if (ss.playerMaxHP !== undefined) s.playerMaxHP = ss.playerMaxHP;
      if (ss.karma !== undefined) s.karma = ss.karma;
      if (ss.loc !== undefined) s.loc = ss.loc;
      if (ss.policeRel !== undefined) s.policeRel = ss.policeRel;
      if (ss.day !== undefined) s.day = ss.day;
      if (ss.washUsedToday !== undefined) s.washUsedToday = ss.washUsedToday;
      if (ss.endgamePhase !== undefined) s.endgamePhase = ss.endgamePhase;
      // Inventory & gear: server-authoritative after economy actions
      if (ss.inventory !== undefined) s.inventory = ss.inventory;
      if (ss.inventoryCosts !== undefined) s.inventoryCosts = ss.inventoryCosts;
      if (ss.ownedGear !== undefined) s.ownedGear = ss.ownedGear;
      // Energy/nerve/cooldowns
      if (ss.energy !== undefined) s.energy = ss.energy;
      if (ss.maxEnergy !== undefined) s.maxEnergy = ss.maxEnergy;
      if (ss.nerve !== undefined) s.nerve = ss.nerve;
      if (ss.maxNerve !== undefined) s.maxNerve = ss.maxNerve;
      s.energyRegenAt = ss.energyRegenAt ?? s.energyRegenAt;
      s.nerveRegenAt = ss.nerveRegenAt ?? s.nerveRegenAt;
      s.travelCooldownUntil = ss.travelCooldownUntil ?? s.travelCooldownUntil;
      s.crimeCooldownUntil = ss.crimeCooldownUntil ?? s.crimeCooldownUntil;
      s.attackCooldownUntil = ss.attackCooldownUntil ?? s.attackCooldownUntil;
      s.heistCooldownUntil = ss.heistCooldownUntil ?? s.heistCooldownUntil;
      // Player sub-object
      if (ss.player) {
        if (ss.player.level !== undefined) s.player.level = ss.player.level;
        if (ss.player.xp !== undefined) s.player.xp = ss.player.xp;
        if (ss.player.nextXp !== undefined) s.player.nextXp = ss.player.nextXp;
        if (ss.player.skillPoints !== undefined) s.player.skillPoints = ss.player.skillPoints;
        if (ss.player.statPoints !== undefined) s.player.statPoints = ss.player.statPoints;
        if (ss.player.stats) s.player.stats = ss.player.stats;
        if (ss.player.loadout) s.player.loadout = ss.player.loadout;
      }
      if (ss.meritPoints !== undefined) s.meritPoints = ss.meritPoints;
      // Sync ownedDistricts from server (personal + gang territories combined)
      if (ss.allDistricts) {
        s.ownedDistricts = ss.allDistricts;
      }
      if (ss.gangDistricts) {
        s.gangDistricts = ss.gangDistricts;
      }
      s.serverSynced = true;
      return s;
    }

    // Targeted contract mutations (replaces dangerous SET_STATE patterns)
    case 'ADD_CONTRACT': {
      const contract = (action as any).contract;
      if (contract && !s.activeContracts.find((c: any) => c.id === contract.id)) {
        s.activeContracts.push(contract);
      }
      return s;
    }
    case 'REMOVE_CONTRACT': {
      const contractId = (action as any).contractId;
      const repPenalty = (action as any).repPenalty || 0;
      s.activeContracts = s.activeContracts.filter((c: any) => c.id !== contractId);
      if (repPenalty > 0) s.rep = Math.max(0, s.rep - repPenalty);
      return s;
    }
    case 'SET_PRICES': {
      const { prices, priceTrends } = action as any;
      if (prices) s.prices = prices;
      if (priceTrends) s.priceTrends = { ...s.priceTrends, ...priceTrends };
      return s;
    }

    case 'RESET': {
      const fresh = createInitialState();
      Engine.generatePrices(fresh);
      // Contracts generated server-side via gameApi.acceptContract()
      fresh.dailyNews = generateDailyNews(fresh);
      return fresh;
    }

    case 'RETIRE_SUCCESSOR': {
      if (!canRetire(s)) return s;
      const gain = computeLegacyGain(s);
      const prev = getLegacy(s);
      const nextLegacy = {
        generation: prev.generation + 1,
        points: prev.points + gain,
        totalEarned: prev.totalEarned + gain,
      };
      // A fresh successor takes over — new crew, cash and level — but inherits the
      // legacy points, which permanently boost income and starting cash.
      const fresh = createInitialState();
      Engine.generatePrices(fresh);
      fresh.dailyNews = generateDailyNews(fresh);
      fresh.legacy = nextLegacy;
      fresh.money = legacyStartCash(nextLegacy.points);
      fresh.backstory = s.backstory;      // same dynasty, same origin story
      fresh.tutorialDone = true;          // the successor knows the ropes
      return fresh;
    }

    case 'START_PVP_COMBAT': {
      const target = action.target;
      const attackerStats = {
        muscle: Engine.getPlayerStat(s, 'muscle'),
        brains: Engine.getPlayerStat(s, 'brains'),
        charm: Engine.getPlayerStat(s, 'charm'),
      };
      const pvpState = createPvPCombatState(
        'player', s.player.level >= 1 ? 'Jij' : 'Speler',
        s.player.level, s.playerHP, s.playerMaxHP, attackerStats, s.player.loadout,
        target.userId, target.username, target.level, target.hp, target.maxHp,
        target.stats || { muscle: Math.floor(target.level * 1.5) + 3, brains: Math.floor(target.level * 0.8), charm: Math.floor(target.level * 0.5) },
        target.loadout || { weapon: null, armor: null, gadget: null },
      );
      // MMO Perk: Weduwnaar PvP damage bonus
      if (s.mmoPerkFlags?.pvpDamageBonus) {
        pvpState.attackerPvpDamageBonus = s.mmoPerkFlags.pvpDamageBonus;
      }
      // Weapon profiles for the shared damage core — your equipped weapon now
      // matters in duels, and the opponent fights with kit that scales to level.
      pvpState.attackerWeapon = weaponProfileFromProc(s.weaponInventory?.find(w => w.equipped));
      pvpState.defenderWeapon = weaponProfileForLevel(target.level);
      s.activePvPCombat = pvpState;
      s.screenEffect = 'shake';
      return s;
    }

    case 'PVP_COMBAT_ACTION': {
      if (!s.activePvPCombat || s.activePvPCombat.finished) return s;

      // PvP ammo consumption: attack=1, heavy=2, combo_finisher=3, skill=1
      const pvpAmmoAction = action.action as string;
      const pvpAmmoCost = pvpAmmoAction === 'combo_finisher' ? 3 : pvpAmmoAction === 'heavy' ? 2 : pvpAmmoAction === 'defend' ? 0 : 1;
      if (pvpAmmoCost > 0) {
        Engine.ensureAmmoStock(s);
        const pvpAmmoType = Engine.getActiveAmmoType(s);
        const procWeapon = s.weaponInventory?.find(w => w.equipped);
        const legacyWeaponId = s.player.loadout.weapon;
        const legacyWeapon = legacyWeaponId ? GEAR.find(g => g.id === legacyWeaponId) : null;
        const isMelee = procWeapon ? procWeapon.frame === 'blade' : (legacyWeapon?.ammoType === null);
        if (!isMelee) {
          const pvpCurrentAmmo = s.ammoStock[pvpAmmoType] || 0;
          if (pvpCurrentAmmo >= pvpAmmoCost) {
            s.ammoStock[pvpAmmoType] = pvpCurrentAmmo - pvpAmmoCost;
            s.ammo = Engine.getTotalAmmo(s);
          }
          // No ammo = reduced damage handled by attackerPvpDamageBonus being absent
        }
      }

      const newCombat = pvpCombatTurn(s.activePvPCombat, action.action, action.skillId);
      s.activePvPCombat = newCombat;
      // Screen effects
      if (newCombat.finished && newCombat.won) s.screenEffect = 'gold-flash';
      else if (newCombat.finished && !newCombat.won) s.screenEffect = 'blood-flash';
      else if (action.action === 'heavy') s.screenEffect = 'shake';
      return s;
    }

    case 'SET_PVP_STANCE': {
      if (s.activePvPCombat && !s.activePvPCombat.finished) {
        s.activePvPCombat.stance = action.stance;
      }
      return s;
    }

    case 'END_PVP_COMBAT': {
      if (s.activePvPCombat) {
        // If the opponent was a world bot, update its record so the rivalry feels persistent.
        const oppId = s.activePvPCombat.defenderId;
        const bot = s.world?.bots.find(b => b.id === oppId);
        if (s.activePvPCombat.won) {
          s.rep += 15;
          // Steal a slice of the bot's actual wealth (more satisfying than a flat roll).
          const stolen = bot
            ? Math.max(500, Math.floor(bot.money * (0.08 + Math.random() * 0.12)))
            : Math.floor(Math.random() * 2000 + 500);
          s.money += stolen;
          s.stats.totalEarned += stolen;
          s.lastRewardAmount = stolen;
          Engine.gainXp(s, 50);
          if (bot) {
            bot.money = Math.max(0, bot.money - stolen);
            bot.losses = (bot.losses || 0) + 1;
            bot.killStreak = 0;
            bot.hp = Math.max(1, Math.floor((bot.maxHp || 100) * 0.25));
            bot.rivalry = Math.min(100, (bot.rivalry || 0) + 25); // they want revenge now
            bot.lastInteractedDay = s.day;
            bot.combatRating = Math.max(800, (bot.combatRating || 1000) - 15);
            // Claim a bounty the player placed on this bot, if any.
            const claimed = (s.placedBounties || []).find((b) => b.targetId === oppId && b.status === 'active');
            if (claimed) {
              s.money += claimed.reward;
              s.stats.totalEarned += claimed.reward;
              s.placedBounties = (s.placedBounties || []).filter((b) => b.id !== claimed.id);
              addPhoneMessage(s, 'system', `Premie geïnd: €${claimed.reward.toLocaleString()} voor het verslaan van ${bot.name}.`, 'opportunity');
            }
          }
        } else {
          // PvP knockout — recover with penalties
          s.playerHP = Math.max(1, Math.floor((s.playerMaxHP || 100) * 0.25));
          const pvpMoneyLost = Math.floor(s.money * 0.20);
          s.money -= pvpMoneyLost;
          s.rep = Math.max(0, s.rep - 15);
          s.hospitalizations = (s.hospitalizations || 0) + 1;
          if (bot) {
            bot.wins = (bot.wins || 0) + 1;
            bot.killStreak = (bot.killStreak || 0) + 1;
            bot.rivalry = Math.min(100, (bot.rivalry || 0) + 10);
            bot.combatRating = (bot.combatRating || 1000) + 15;
            bot.lastInteractedDay = s.day;
          }
        }
        s.activePvPCombat = null;
      }
      return s;
    }

    case 'SYNC_SKILLS': {
      s.unlockedSkills = action.skills;
      s.player.skillPoints = action.skillPoints;
      return s;
    }

    case 'UNLOCK_SKILL': {
      // Local skill unlock/upgrade — validates via the shared canUnlockSkill rules, spends
      // skill points, and adds/levels the node. Replaces the former server round-trip.
      const node = SKILL_NODES.find(n => n.id === action.skillId);
      if (!node) return s;
      if (!s.unlockedSkills) s.unlockedSkills = [];
      const check = canUnlockSkill(node, s.unlockedSkills, s.player.skillPoints, s.player.level, s.prestigeLevel || 0);
      if (!check.canUnlock) return s;
      s.player.skillPoints -= node.cost;
      const existing = s.unlockedSkills.find(sk => sk.skillId === node.id);
      if (existing) existing.level += 1;
      else s.unlockedSkills.push({ skillId: node.id, level: 1 });
      return s;
    }

    case 'PLACE_BOT_BOUNTY': {
      const bot = s.world?.bots.find(b => b.id === action.botId);
      if (!bot) return s;
      if (action.amount <= 0 || s.money < action.amount) return s;
      if (!s.placedBounties) s.placedBounties = [];
      if (s.placedBounties.some(b => b.targetId === action.botId && b.status === 'active')) return s; // one at a time
      s.money -= action.amount;
      s.stats.totalSpent += action.amount;
      s.placedBounties.push({
        id: `bounty_${Date.now()}_${action.botId}`,
        targetId: action.botId,
        targetName: bot.name,
        targetType: 'player',
        reward: action.amount,
        placedBy: 'Jij',
        deadline: s.day + 14,
        status: 'active',
      });
      // Placing a bounty makes them notice you — rivalry rises.
      bot.rivalry = Math.min(100, (bot.rivalry || 0) + 15);
      return s;
    }

    case 'AUCTION_BID': {
      const auc = s.world?.auctions?.find(a => a.id === action.auctionId);
      if (!auc || auc.status !== 'active') return s;
      if (action.amount <= auc.currentBid) return s;
      if (s.money < action.amount) return s;
      // Refund is implicit — money is only deducted on claim/win; here we just record the top bid.
      auc.currentBid = action.amount;
      auc.topBidderId = 'player';
      auc.topBidderName = 'Jij';
      auc.bidCount += 1;
      return s;
    }

    case 'AUCTION_CLAIM': {
      const auc = s.world?.auctions?.find(a => a.id === action.auctionId);
      if (!auc) return s;
      if (auc.status === 'active' && s.day < auc.endsDay) return s; // not over yet
      if (auc.topBidderId !== 'player') return s; // player didn't win
      if (s.money < auc.currentBid) return s;
      s.money -= auc.currentBid;
      s.stats.totalSpent += auc.currentBid;
      auc.status = 'sold';
      // Grant the item.
      if (auc.itemType === 'vehicle') {
        if (!s.ownedVehicles.some(v => v.id === auc.itemId)) {
          s.ownedVehicles.push({ id: auc.itemId, condition: 100, vehicleHeat: 0, rekatCooldown: 0 });
        }
      } else if (!s.ownedGear.includes(auc.itemId)) {
        s.ownedGear.push(auc.itemId);
      }
      addPhoneMessage(s, 'system', `Veiling gewonnen: ${auc.itemName} voor €${auc.currentBid.toLocaleString()}.`, 'opportunity');
      return s;
    }

    case 'CREATE_AUCTION': {
      if (!s.world) return s;
      if (!s.world.auctions) s.world.auctions = [];
      if (action.startingPrice < 500) return s;
      // Verify ownership and remove the item from the player (it's held in escrow by the house).
      let itemName = action.itemId;
      if (action.itemType === 'vehicle') {
        if (action.itemId === s.activeVehicle) return s; // can't auction the car you're driving
        const idx = s.ownedVehicles.findIndex(v => v.id === action.itemId);
        if (idx === -1) return s;
        s.ownedVehicles.splice(idx, 1);
        itemName = VEHICLES.find(v => v.id === action.itemId)?.name || action.itemId;
      } else {
        // Gear (weapon/armor/gadget).
        const idx = s.ownedGear.indexOf(action.itemId);
        if (idx === -1) return s;
        s.ownedGear.splice(idx, 1);
        itemName = GEAR.find(g => g.id === action.itemId)?.name || action.itemId;
      }
      const gearType = GEAR.find(g => g.id === action.itemId)?.type;
      s.world.auctions.unshift({
        id: `auc_player_${Date.now()}_${Math.floor(Math.random() * 1e5)}`,
        sellerBotId: null,
        sellerName: 'Jij',
        itemType: action.itemType === 'vehicle' ? 'vehicle' : (gearType || 'gear'),
        itemId: action.itemId,
        itemName,
        startingPrice: action.startingPrice,
        currentBid: action.startingPrice,
        topBidderId: null,
        topBidderName: null,
        bidCount: 0,
        endsDay: s.day + 2,
        status: 'active',
      });
      addPhoneMessage(s, 'system', `${itemName} staat nu in de veiling (startprijs €${action.startingPrice.toLocaleString()}).`, 'info');
      return s;
    }

    case 'BOT_TRADE': {
      const bot = s.world?.bots.find(b => b.id === action.botId);
      if (!bot) return s;
      // Verify the player can actually deliver what they're offering.
      if (s.money < action.offerCash) return s;
      for (const [gid, qty] of Object.entries(action.offerGoods)) {
        if ((s.inventory[gid as GoodId] || 0) < qty) return s;
      }
      // Apply the swap atomically.
      s.money += action.requestCash - action.offerCash;
      for (const [gid, qty] of Object.entries(action.offerGoods)) {
        s.inventory[gid as GoodId] = (s.inventory[gid as GoodId] || 0) - qty;
      }
      const invCount = Object.values(s.inventory).reduce((a, b) => a + (b || 0), 0);
      let capacity = s.maxInv - invCount;
      for (const [gid, qty] of Object.entries(action.requestGoods)) {
        const added = Math.min(qty, Math.max(0, capacity));
        s.inventory[gid as GoodId] = (s.inventory[gid as GoodId] || 0) + added;
        capacity -= added;
      }
      // A completed trade warms relations — rivalry cools a touch.
      bot.rivalry = Math.max(0, (bot.rivalry || 0) - 5);
      return s;
    }

    case 'FOUND_ORG': {
      if (s.org) return s;
      if (s.rep < ORG_FOUND_MIN_REP) return s;
      if (s.money < ORG_FOUND_COST) return s;
      const name = (action.name || '').trim().slice(0, 28) || 'Naamloze Crew';
      const tag = ((action.tag || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || 'ORG').slice(0, 4);
      s.money -= ORG_FOUND_COST;
      s.stats.totalSpent += ORG_FOUND_COST;
      const org: PlayerOrg = {
        name, tag, members: [], controlledDistricts: [], respect: 0, upgrades: [], foundedDay: s.day,
      };
      s.org = org;
      addPhoneMessage(s, 'system', `Je hebt de organisatie [${tag}] ${name} opgericht. Tijd om soldaten te ronselen.`, 'opportunity');
      return s;
    }

    case 'ORG_RECRUIT': {
      if (!s.org) return s;
      if (s.org.members.length >= orgMaxMembers(s.org)) return s;
      const cost = recruitCost(s.org, s.player.level);
      if (s.money < cost) return s;
      // Draw a believable name from the living world (fallback to a generic handle).
      const usedNames = new Set(s.org.members.map(m => m.name));
      const pool = (s.world?.bots || []).filter(b => !usedNames.has(b.name));
      const name = pool.length > 0
        ? pool[Math.floor(Math.random() * pool.length)].name
        : `Rekruut #${s.org.members.length + 1}`;
      s.money -= cost;
      s.stats.totalSpent += cost;
      const recruit: OrgMember = makeRecruit(name, s.player.level);
      s.org.members.push(recruit);
      s.org.respect += 2;
      return s;
    }

    case 'ORG_PROMOTE': {
      if (!s.org) return s;
      const m = s.org.members.find(x => x.id === action.memberId);
      if (!m) return s;
      const target = nextRole(m.role);
      if (!target) return s;
      const cost = promoteCost(m);
      if (s.money < cost) return s;
      s.money -= cost;
      s.stats.totalSpent += cost;
      m.role = target;
      m.loyalty = Math.min(100, m.loyalty + 10);
      s.org.respect += 3;
      return s;
    }

    case 'ORG_DISMISS': {
      if (!s.org) return s;
      s.org.members = s.org.members.filter(x => x.id !== action.memberId);
      return s;
    }

    case 'BUY_EQUIPMENT': {
      if (!canBuyTier(s, action.slot)) return s;
      const tier = nextTier(s, action.slot)!;
      s.money -= tier.cost;
      s.stats.totalSpent += tier.cost;
      if (!s.equipment) s.equipment = {};
      s.equipment[action.slot] = (s.equipment[action.slot] || 0) + 1;
      addPhoneMessage(s, 'system', `Aangeschaft: ${tier.name}.`, 'opportunity');
      return s;
    }

    case 'SCORE_START': {
      // Your hands are the one thing an arrest actually takes away.
      if (s.prison) return s;
      if (!districtUnlocked(s, action.district)) return s;
      s.activeJob = makeJob(action.district, s.jobStreak || 0);
      // Working a district is how you learn who owns it. Without this the codex
      // entries for El Serpiente, Mr. Wu and Hammer only unlocked by physically
      // travelling there on the map — which is not how this game is played.
      if (!s.visitedDistricts) s.visitedDistricts = [];
      if (!s.visitedDistricts.includes(action.district)) s.visitedDistricts.push(action.district);
      try {
        if (!s.codex) s.codex = { unlockedEntries: [], readEntries: [], newEntries: [] };
        const { newUnlocks } = checkCodexUnlocks(s);
        if (newUnlocks.length > 0) {
          s.codex.unlockedEntries = [...s.codex.unlockedEntries, ...newUnlocks];
          s.codex.newEntries = [...(s.codex.newEntries || []), ...newUnlocks];
        }
      } catch { /* codex is cosmetic; never let it break starting a job */ }
      return s;
    }

    case 'SCORE_WORK': {
      // Progress comes from your taps and from crew working that district.
      const job = s.activeJob;
      if (!job || s.prison) return s;
      job.progress += action.amount;
      if (job.progress < job.required) return s;

      // Finished: pay out contraband + dirty cash, then line up the next one.
      const reward = rollJobReward(s, job);
      if (!s.inventory) s.inventory = {};
      for (const [gid, qty] of Object.entries(reward.goods)) {
        s.inventory[gid as GoodId] = (s.inventory[gid as GoodId] || 0) + (qty || 0);
      }
      // Vernuft (brains) means you know what the goods are really worth, and a run of
      // finished jobs without walking away pays progressively better.
      const brains = s.player?.stats?.brains || 0;
      const streakMult = streakPayoutMultiplier(s.jobStreak || 0);
      const dirty = Math.round((reward.dirtyMoney + reward.overflowMoney) * (1 + brains * 0.02) * streakMult);
      s.dirtyMoney = (s.dirtyMoney || 0) + dirty;
      s.stats.totalEarned += dirty;
      s.stats.jobsCompleted = (s.stats.jobsCompleted || 0) + 1;
      // Working a district by hand is noticed there just like a racket is.
      if (!s.districtAttention) s.districtAttention = {};
      const d = job.district;
      s.districtAttention[d] = Math.min(100, (s.districtAttention[d] || 0) + job.tier);
      Engine.addPersonalHeat(s, Math.max(1, Math.round(job.tier / 2)));
      Engine.recomputeHeat(s);

      s.lastJobReward = {
        goods: reward.goods, dirtyMoney: reward.dirtyMoney,
        overflowMoney: reward.overflowMoney, jobName: job.name,
      };
      Engine.gainXp(s, 6 + job.tier * 5);
      s.jobStreak = (s.jobStreak || 0) + 1;
      s.activeJob = makeJob(d, s.jobStreak);
      return s;
    }

    case 'SCORE_ABANDON': {
      // Drop the current job and go back to the district picker. Progress on an
      // unfinished job is not banked, and the run ends here: walking away costs you
      // both the work so far and the streak bonus you had built up.
      s.activeJob = null;
      s.jobStreak = 0;
      return s;
    }

    case 'SCORE_CLEAR_REWARD': {
      s.lastJobReward = null;
      return s;
    }

    case 'RESOLVE_INCIDENT': {
      const inc = s.activeIncident as ActiveIncident | null | undefined;
      if (!inc) return s;
      const choice = inc.choices.find(c => c.id === action.choiceId);
      if (!choice) return s;
      if (choice.costMoney && s.money < choice.costMoney) return s;

      // A gamble resolves to one of two outcomes; everything else is certain.
      const succeeded = choice.successChance == null ? true : Math.random() < choice.successChance;
      if (choice.id === 'fight') s.stats.incidentsFought = (s.stats.incidentsFought || 0) + 1;
      const outcome: IncidentOutcome = succeeded ? choice.outcome : (choice.failOutcome || choice.outcome);

      if (outcome.money) {
        s.money = Math.max(0, s.money + outcome.money);
        if (outcome.money > 0) s.stats.totalEarned += outcome.money;
        else s.stats.totalSpent += Math.abs(outcome.money);
      }
      if (outcome.heat) { Engine.addPersonalHeat(s, outcome.heat); Engine.recomputeHeat(s); }
      if (outcome.respect && s.org) s.org.respect = Math.max(0, s.org.respect + outcome.respect);
      if (outcome.loyalty && s.org) {
        for (const m of s.org.members) m.loyalty = Math.max(0, Math.min(100, m.loyalty + outcome.loyalty));
      }
      if (outcome.attention && inc.district) {
        if (!s.districtAttention) s.districtAttention = {};
        const cur = s.districtAttention[inc.district] || 0;
        s.districtAttention[inc.district] = Math.max(0, Math.min(100, cur + outcome.attention));
      }
      if (outcome.rivalPower && inc.district && s.world) {
        const gang = s.world.gangs.find(g => g.controlledDistrict === inc.district);
        if (gang) gang.power = Math.max(10, gang.power + outcome.rivalPower);
      }
      if (outcome.injureChance && s.org) {
        const working = s.org.members.filter(m => m.assignment && !m.injuredUntilDay);
        if (working.length > 0 && Math.random() < outcome.injureChance) {
          const hurt = working[Math.floor(Math.random() * working.length)];
          hurt.injuredUntilDay = s.day + 2 + Math.floor(Math.random() * 3);
          hurt.assignment = null;
          addPhoneMessage(s, 'system', `${hurt.name} raakte gewond en ligt er een paar dagen uit.`, 'warning');
        }
      }
      if (outcome.pullOutOfDistrict && s.org) {
        // Everyone in the affected district (or everyone, for a force-wide order) goes quiet.
        for (const m of s.org.members) {
          if (!m.assignment) continue;
          const def = RACKET_BY_ID[m.assignment];
          if (!inc.district || (def && def.district === inc.district)) m.assignment = null;
        }
      }

      s.lastIncidentResult = { title: inc.title, message: outcome.message, icon: inc.icon };
      s.activeIncident = null;
      addPhoneMessage(s, 'system', outcome.message, succeeded ? 'info' : 'warning');
      return s;
    }

    case 'CLEAR_INCIDENT_RESULT': {
      s.lastIncidentResult = null;
      return s;
    }

    case 'ORG_ASSIGN_RACKET': {
      if (!s.org) return s;
      const m = s.org.members.find(x => x.id === action.memberId);
      if (m) m.assignment = action.racket;
      return s;
    }

    case 'ORG_ASSIGN_ALL': {
      if (!s.org) return s;
      for (const m of s.org.members) m.assignment = action.racket;
      return s;
    }

    case 'BUY_AUTO_FENCE': {
      if (s.autoFence?.owned) return s;
      if (s.money < AUTO_FENCE_COST) return s;
      s.money -= AUTO_FENCE_COST;
      s.stats.totalSpent += AUTO_FENCE_COST;
      s.autoFence = { owned: true, paused: false };
      addPhoneMessage(s, 'system', 'Je hebt een auto-fence opgezet. De smokkel loopt nu vanzelf door.', 'opportunity');
      return s;
    }

    case 'TOGGLE_AUTO_FENCE': {
      if (!s.autoFence?.owned) return s;
      s.autoFence.paused = !s.autoFence.paused;
      return s;
    }

    case 'ORG_BUY_UPGRADE': {
      if (!s.org) return s;
      if (s.org.upgrades.includes(action.upgradeId)) return s;
      const up = ORG_UPGRADES.find(u => u.id === action.upgradeId);
      if (!up || s.money < up.cost) return s;
      s.money -= up.cost;
      s.stats.totalSpent += up.cost;
      s.org.upgrades.push(up.id);
      addPhoneMessage(s, 'system', `Organisatie-upgrade gekocht: ${up.name}.`, 'info');
      return s;
    }

    case 'ORG_ATTACK_DISTRICT': {
      if (!s.org || !s.world) return s;
      if (s.org.members.length === 0) return s;
      const gang = s.world.gangs.find(g => g.id === action.gangId);
      if (!gang || !gang.controlledDistrict) return s;
      const district = gang.controlledDistrict;
      // Your other allies join the raid, lending a share of their strength.
      const attackAllies = s.world.gangs.filter(g => g.id !== gang.id && orgRelation(s.org, g.id) === 'ally');
      const attackAllySupport = orgAllySupport(attackAllies.map(g => g.power));
      // Attacking an ally is a betrayal — it ends the pact and costs you standing.
      if (orgRelation(s.org, gang.id) === 'ally') {
        if (!s.org.relations) s.org.relations = {};
        s.org.relations[gang.id] = 'enemy';
        s.org.respect = Math.max(0, s.org.respect - 10);
        addPhoneMessage(s, 'system', `Je verraadde je pact met ${gang.name}. Het bondgenootschap is verbroken.`, 'threat');
      }
      const won = resolveOrgAttack(orgPower(s.org) + attackAllySupport, gang.power, Math.random);
      if (won) {
        gang.controlledDistrict = null;
        gang.power = Math.max(10, Math.floor(gang.power * 0.7));
        if (!s.org.controlledDistricts.includes(district)) s.org.controlledDistricts.push(district);
        s.org.respect += 10;
        s.rep += 20;
        const loot = 5000 + Math.floor(Math.random() * 8000);
        s.money += loot;
        s.stats.totalEarned += loot;
        // The push cost the crew — spread some fatigue as loyalty loss.
        for (const m of s.org.members) m.loyalty = Math.max(0, m.loyalty - 4);
        const backup = attackAllySupport > 0 ? ` Bondgenoten vochten mee (+${attackAllySupport} kracht).` : '';
        addPhoneMessage(s, 'system', `${DISTRICTS[district]?.name || district} veroverd op ${gang.name}! Buit: €${loot.toLocaleString()}.${backup}`, 'opportunity');
      } else {
        gang.power += 8;
        s.org.respect = Math.max(0, s.org.respect - 3);
        // A failed raid wounds the crew: biggest loyalty hit, may lose the weakest soldier.
        for (const m of s.org.members) m.loyalty = Math.max(0, m.loyalty - 10);
        if (s.org.members.length > 0 && Math.random() < 0.35) {
          const weakest = [...s.org.members].sort((a, b) => a.loyalty - b.loyalty)[0];
          s.org.members = s.org.members.filter(m => m.id !== weakest.id);
          addPhoneMessage(s, 'system', `De aanval op ${DISTRICTS[district]?.name || district} mislukte. ${weakest.name} sneuvelde.`, 'threat');
        } else {
          addPhoneMessage(s, 'system', `De aanval op ${DISTRICTS[district]?.name || district} werd afgeslagen door ${gang.name}.`, 'warning');
        }
      }
      return s;
    }

    case 'ORG_RUN_OPERATION': {
      if (!s.org || s.org.members.length === 0) return s;
      const op = ORG_OPERATIONS.find(o => o.id === action.operationId);
      if (!op) return s;
      if (s.org.respect < op.minRespect) return s; // locked until enough respect
      // Cooldown + energy gates.
      if (s.org.opCooldownUntil && new Date(s.org.opCooldownUntil) > new Date()) return s;
      if (s.energy < op.energyCost) return s;
      s.energy = Math.max(0, s.energy - op.energyCost);
      s.org.opCooldownUntil = new Date(Date.now() + ORG_OP_COOLDOWN_MS).toISOString();

      const pow = orgPower(s.org);
      const success = Math.random() < orgOperationSuccessChance(pow, op);
      if (success) {
        const reward = Math.floor(op.baseReward * (0.8 + Math.random() * 0.6) * (1 + pow / 400) * orgOperationRewardMult(s.org));
        s.money += reward;
        s.stats.totalEarned += reward;
        s.rep += op.repReward;
        Engine.gainXp(s, 20 + op.repReward);
        s.org.respect += Math.ceil(op.repReward / 3);
        for (const m of s.org.members) m.loyalty = Math.min(100, m.loyalty + 2);
        addPhoneMessage(s, 'system', `Klus geslaagd: ${op.name}. Buit €${reward.toLocaleString()}, +${op.repReward} rep.`, 'opportunity');
      } else {
        // Failure: crew morale hit, and on a risky job someone may get hurt.
        for (const m of s.org.members) m.loyalty = Math.max(0, m.loyalty - Math.round(8 + op.risk * 20));
        if (s.org.members.length > 1 && Math.random() < op.risk) {
          const unlucky = s.org.members[Math.floor(Math.random() * s.org.members.length)];
          unlucky.loyalty = Math.max(0, unlucky.loyalty - 30);
          addPhoneMessage(s, 'system', `Klus mislukt: ${op.name}. ${unlucky.name} raakte gewond.`, 'threat');
        } else {
          addPhoneMessage(s, 'system', `Klus mislukt: ${op.name}. De crew komt met lege handen terug.`, 'warning');
        }
      }
      return s;
    }

    case 'ORG_SET_RELATION': {
      if (!s.org) return s;
      const gang = s.world?.gangs.find(g => g.id === action.gangId);
      if (!gang) return s;
      if (!s.org.relations) s.org.relations = {};
      if (action.relation === 'ally') {
        // Forming a pact costs money (discounted by rank) and a minimum standing.
        const pactCost = orgPactCost(s.org);
        if (s.org.respect < ORG_PACT_MIN_RESPECT || s.money < pactCost) return s;
        s.money -= pactCost;
        s.stats.totalSpent += pactCost;
        s.org.relations[action.gangId] = 'ally';
        addPhoneMessage(s, 'system', `Pact gesloten met ${gang.name}. Ze laten je territorium met rust.`, 'opportunity');
      } else if (action.relation === 'enemy') {
        s.org.relations[action.gangId] = 'enemy';
        gang.power += 5; // they mobilise against you
        addPhoneMessage(s, 'system', `Vete verklaard aan ${gang.name}. Verwacht tegenaanvallen.`, 'threat');
      } else {
        delete s.org.relations[action.gangId];
      }
      return s;
    }

    case 'ORG_DISBAND': {
      s.org = null;
      return s;
    }

    case 'ADD_MARKET_ALERT': {
      const alert = action.alert as import('@/game/types').MarketAlert;
      s.marketAlerts.push(alert);
      return s;
    }

    case 'REMOVE_MARKET_ALERT': {
      s.marketAlerts = s.marketAlerts.filter(a => a.id !== action.id);
      return s;
    }

    case 'CLEAR_TRIGGERED_ALERTS': {
      s.triggeredAlerts = [];
      return s;
    }

    case 'TOGGLE_SMART_ALARM': {
      s.smartAlarmEnabled = !s.smartAlarmEnabled;
      return s;
    }

    case 'SET_SMART_ALARM_THRESHOLD': {
      s.smartAlarmThreshold = action.threshold;
      return s;
    }

    case 'BID_AUCTION': {
      if (!s.auctionItems) return s;
      const itemIdx = s.auctionItems.findIndex(a => a.id === action.itemId);
      if (itemIdx === -1) return s;
      const item = s.auctionItems[itemIdx];
      if (action.amount <= item.currentBid || s.money < action.amount) return s;
      s.money -= action.amount;
      s.stats.totalSpent += action.amount;
      // Award the item
      if (item.rewardType === 'gear' && item.rewardId) {
        if (!s.ownedGear.includes(item.rewardId)) s.ownedGear.push(item.rewardId);
      } else if (item.rewardType === 'goods' && item.rewardGoodId) {
        const currentInv = Object.values(s.inventory).reduce((a, b) => a + (b || 0), 0);
        const space = s.maxInv - currentInv;
        const added = Math.min(item.rewardAmount || 1, space);
        s.inventory[item.rewardGoodId] = (s.inventory[item.rewardGoodId] || 0) + added;
      } else if (item.rewardType === 'rep') {
        s.rep += item.rewardAmount || 50;
      }
      s.auctionItems.splice(itemIdx, 1);
      return s;
    }

    case 'FORM_ALLIANCE': {
      const fid = action.familyId;
      const rel = s.familyRel[fid] || 0;
      if (rel < 30) return s; // Need minimum relation
      const cost = Math.max(5000, 15000 - rel * 100);
      if (s.money < cost) return s;
      s.money -= cost;
      s.stats.totalSpent += cost;
      if (!s.alliancePacts) s.alliancePacts = {};
      s.alliancePacts[fid] = {
        familyId: fid as FamilyId,
        active: true,
        expiresDay: s.day + 10,
        benefit: fid === 'cartel' ? '-15% Marktprijzen Drugs' : fid === 'syndicate' ? '+20% Hack Inkomsten' : '+15% Combat Bonus',
        costPerDay: Math.floor(cost / 10),
      };
      s.familyRel[fid] = Math.min(100, rel + 10);
      return s;
    }

    case 'BREAK_ALLIANCE': {
      if (!s.alliancePacts?.[action.familyId]) return s;
      delete s.alliancePacts[action.familyId];
      s.familyRel[action.familyId] = Math.max(-100, (s.familyRel[action.familyId] || 0) - 20);
      return s;
    }

    case 'CLEAR_PENDING_XP': {
      s._pendingXpGains = [];
      return s;
    }

    case 'SYNC_SERVER_XP': {
      s._pendingXpGains = [];
      s.player.xp = action.data.newXp;
      s.player.level = action.data.newLevel;
      s.player.nextXp = action.data.newNextXp;
      s.player.skillPoints = action.data.newSP;
      s.xpStreak = action.data.streak;
      // Sync merit points and stat points from server if provided
      if (action.data.newMeritPoints !== undefined) {
        s.meritPoints = action.data.newMeritPoints;
      }
      if (action.data.newStatPoints !== undefined) {
        s.player.statPoints = action.data.newStatPoints;
      }
      return s;
    }

    default:
      return s;
  }
  });
}

export function GameProvider({ children, onExitToMenu }: { children: React.ReactNode; onExitToMenu?: () => void }) {
  const [state, rawDispatch] = useReducer(gameReducer, null, () => {
    const saved = Engine.loadGame();
    if (saved) {
      // Set session start timestamp for street event grace period
      (saved as any)._sessionStartedAt = Date.now();
      // Ensure new fields exist
      if (!saved.achievements) saved.achievements = [];
      if (saved.tutorialDone === undefined) saved.tutorialDone = false;
      if (!saved.lastLoginDay) saved.lastLoginDay = '';
      if (saved.loginStreak === undefined) saved.loginStreak = 0;
      if (!saved.stats) saved.stats = { totalEarned: 0, totalSpent: 0, casinoWon: 0, casinoLost: 0, missionsCompleted: 0, missionsFailed: 0, tradesCompleted: 0, daysPlayed: saved.day || 0, blackjackStreak: 0, highLowMaxRound: 0, combatsWon: 0, bestKillStreak: 0, pvpWins: 0, bountiesClaimed: 0 };
      if (saved.stats.blackjackStreak === undefined) saved.stats.blackjackStreak = 0;
      if (saved.stats.highLowMaxRound === undefined) saved.stats.highLowMaxRound = 0;
      if (saved.stats.combatsWon === undefined) saved.stats.combatsWon = 0;
      if (saved.stats.bestKillStreak === undefined) saved.stats.bestKillStreak = 0;
      if (saved.stats.pvpWins === undefined) saved.stats.pvpWins = 0;
      if (saved.stats.bountiesClaimed === undefined) saved.stats.bountiesClaimed = 0;
      if (saved.casinoJackpot === undefined) saved.casinoJackpot = 10000;
      // Player HP migration
      if (saved.playerHP === undefined || saved.playerMaxHP === undefined) {
        const maxHP = 80 + ((saved.player?.level || 1) * 5) + ((saved.player?.stats?.muscle || 1) * 3);
        saved.playerMaxHP = maxHP;
        saved.playerHP = maxHP;
      }
      if (saved.nightReport === undefined) saved.nightReport = null;
      if (!saved.priceHistory) saved.priceHistory = {};
      if (saved.washUsedToday === undefined) saved.washUsedToday = 0;
      if (!saved.factionCooldowns) saved.factionCooldowns = { cartel: [], syndicate: [], bikers: [] };
      if (!saved.conqueredFactions) saved.conqueredFactions = [];
      if (saved.activeMission === undefined) saved.activeMission = null;
      if (!saved.mapEvents) saved.mapEvents = [];
      // New feature migrations
      if (!saved.weather) saved.weather = 'clear';
      if (!saved.districtRep) saved.districtRep = { port: 0, crown: 0, iron: 0, low: 0, neon: 0 };
      if (!saved.nemesis) {
        saved.nemesis = {
          name: NEMESIS_NAMES[Math.floor(Math.random() * NEMESIS_NAMES.length)],
          power: 10, location: 'crown', hp: 80, maxHp: 80, cooldown: 0, defeated: 0, lastAction: '',
          generation: 1, alive: true, nextSpawnDay: 0, defeatedNames: [],
          archetype: (['zakenman', 'brute', 'schaduw', 'strateeg'] as const)[Math.floor(Math.random() * 4)],
          claimedDistrict: null, alliedFaction: null, truceDaysLeft: 0, lastReaction: '',
          negotiatedThisGen: false, scoutResult: null,
          abilities: [], revengeActive: null, revengeDaysLeft: 0, defeatChoice: null,
          tauntsShown: [], woundedRevengeUsed: false, pendingDefeatChoice: false, informantArchetype: null,
        };
      }
      // Migrate existing nemesis saves to new successor system
      if (saved.nemesis.generation === undefined) saved.nemesis.generation = 1;
      if (saved.nemesis.alive === undefined) saved.nemesis.alive = saved.nemesis.cooldown === 0;
      if (saved.nemesis.nextSpawnDay === undefined) saved.nemesis.nextSpawnDay = 0;
      if (saved.nemesis.defeatedNames === undefined) saved.nemesis.defeatedNames = [];
      // Migrate nemesis to archetype system
      if (!saved.nemesis.archetype) saved.nemesis.archetype = (['zakenman', 'brute', 'schaduw', 'strateeg'] as const)[Math.floor(Math.random() * 4)];
      if (saved.nemesis.claimedDistrict === undefined) saved.nemesis.claimedDistrict = null;
      if (saved.nemesis.alliedFaction === undefined) saved.nemesis.alliedFaction = null;
      if (saved.nemesis.truceDaysLeft === undefined) saved.nemesis.truceDaysLeft = 0;
      if (saved.nemesis.lastReaction === undefined) saved.nemesis.lastReaction = '';
      if (saved.nemesis.negotiatedThisGen === undefined) saved.nemesis.negotiatedThisGen = false;
      if (saved.nemesis.scoutResult === undefined) saved.nemesis.scoutResult = null;
      // Migrate nemesis 2.0 fields
      if (!saved.nemesis.abilities) saved.nemesis.abilities = [];
      if (saved.nemesis.revengeActive === undefined) saved.nemesis.revengeActive = null;
      if (saved.nemesis.revengeDaysLeft === undefined) saved.nemesis.revengeDaysLeft = 0;
      if (saved.nemesis.defeatChoice === undefined) saved.nemesis.defeatChoice = null;
      if (!saved.nemesis.tauntsShown) saved.nemesis.tauntsShown = [];
      if (saved.nemesis.woundedRevengeUsed === undefined) saved.nemesis.woundedRevengeUsed = false;
      if (saved.nemesis.pendingDefeatChoice === undefined) saved.nemesis.pendingDefeatChoice = false;
      if (saved.nemesis.informantArchetype === undefined) saved.nemesis.informantArchetype = null;
      if (!saved.districtDefenses) {
        saved.districtDefenses = {
          port: { upgrades: [], fortLevel: 0 },
          crown: { upgrades: [], fortLevel: 0 },
          iron: { upgrades: [], fortLevel: 0 },
          low: { upgrades: [], fortLevel: 0 },
          neon: { upgrades: [], fortLevel: 0 },
        };
      } else {
        // Migrate old format
        Object.keys(saved.districtDefenses).forEach((k: string) => {
          const d = saved.districtDefenses[k];
          if ('stationedCrew' in d) {
            saved.districtDefenses[k] = { upgrades: [], fortLevel: d.level || 0 };
          }
          if (!d.upgrades) d.upgrades = [];
          if (d.fortLevel === undefined) d.fortLevel = 0;
        });
      }
      if (!saved.pendingWarEvent) saved.pendingWarEvent = null;
      if (!saved.spionageIntel) saved.spionageIntel = [];
      if (!saved.sabotageEffects) saved.sabotageEffects = [];
      if (!saved.allianceCooldowns) saved.allianceCooldowns = { cartel: 0, syndicate: 0, bikers: 0 };
      if (!saved.smuggleRoutes) saved.smuggleRoutes = [];
      if (!saved.phone) saved.phone = { messages: [], unread: 0 };
      if (saved.showPhone === undefined) saved.showPhone = false;
      if (saved.pendingSpecChoice === undefined) saved.pendingSpecChoice = null;
      // Heat 2.0 migrations
      if (saved.personalHeat === undefined) {
        // Migrate: 30% of existing heat goes to personal, 70% to active vehicle
        const oldHeat = saved.heat || 0;
        saved.personalHeat = Math.round(oldHeat * 0.3);
        const activeVehicle = saved.ownedVehicles?.find((v: any) => v.id === saved.activeVehicle);
        if (activeVehicle) {
          activeVehicle.vehicleHeat = Math.round(oldHeat * 0.7);
        }
      }
      if (saved.hidingDays === undefined) saved.hidingDays = 0;
      // Ensure all vehicles have Heat 2.0 fields
      saved.ownedVehicles?.forEach((v: any) => {
        if (v.vehicleHeat === undefined) v.vehicleHeat = 0;
        if (v.rekatCooldown === undefined) v.rekatCooldown = 0;
        if (v.upgrades === undefined) v.upgrades = {};
      });
      // Endgame migrations
      if (!saved.endgamePhase) saved.endgamePhase = calculateEndgamePhase(saved);
      if (saved.victoryData === undefined) saved.victoryData = null;
      if (saved.newGamePlusLevel === undefined) saved.newGamePlusLevel = 0;
      if (saved.finalBossDefeated === undefined) saved.finalBossDefeated = false;
      if (saved.freePlayMode === undefined) saved.freePlayMode = false;
      // Story & animation migrations
      if (saved.pendingStreetEvent === undefined) saved.pendingStreetEvent = null;
      if (saved.streetEventResult === undefined) saved.streetEventResult = null;
      if (!saved.streetEventQueue) saved.streetEventQueue = [];
      // Login cooldown: clear stale pending event & push to queue, reset cooldown
      if (saved.pendingStreetEvent) {
        const eventAge = saved.lastStreetEventAt ? Date.now() - new Date(saved.lastStreetEventAt).getTime() : Infinity;
        if (eventAge > 30 * 60 * 1000) {
          // Old event — discard
          saved.pendingStreetEvent = null;
          saved.streetEventResult = null;
        } else {
          // Move to queue
          saved.streetEventQueue = [...saved.streetEventQueue, saved.pendingStreetEvent].slice(-5);
          saved.pendingStreetEvent = null;
          saved.streetEventResult = null;
        }
      }
      saved.lastStreetEventAt = new Date().toISOString(); // prevent immediate new events
      if (saved.screenEffect === undefined) saved.screenEffect = null;
      if (saved.lastRewardAmount === undefined) saved.lastRewardAmount = 0;
      if (!saved.crewPersonalities) saved.crewPersonalities = {};
      // Story arcs migrations
      if (!saved.activeStoryArcs) saved.activeStoryArcs = [];
      if (!saved.completedArcs) saved.completedArcs = [];
      if (saved.pendingArcEvent === undefined) saved.pendingArcEvent = null;
      if (saved.arcEventResult === undefined) saved.arcEventResult = null;
      // Car theft migrations
      if (!saved.stolenCars) saved.stolenCars = [];
      if (!saved.carOrders) saved.carOrders = [];
      if (saved.pendingCarTheft === undefined) saved.pendingCarTheft = null;
      // Safehouse migrations
      if (!saved.safehouses) saved.safehouses = [];
      // Corruption network migrations
      if (!saved.corruptContacts) saved.corruptContacts = [];
      if (saved.pendingCorruptionEvent === undefined) saved.pendingCorruptionEvent = null;
      // Daily challenges migrations
      if (!saved.dailyChallenges) saved.dailyChallenges = [];
      if (saved.challengeDay === undefined) saved.challengeDay = 0;
      if (saved.challengesCompleted === undefined) saved.challengesCompleted = 0;
      if (!saved.dailyProgress) saved.dailyProgress = { trades: 0, earned: 0, washed: 0, solo_ops: 0, contracts: 0, travels: 0, bribes: 0, faction_actions: 0, recruits: 0, cars_stolen: 0, casino_won: 0, hits_completed: 0 };
      // Hitman & Ammo migrations
      if (saved.ammo === undefined) saved.ammo = 12;
      if (!saved.hitContracts) saved.hitContracts = [];
      if (saved.dailyProgress && saved.dailyProgress.hits_completed === undefined) saved.dailyProgress.hits_completed = 0;
      // Prison migration
      if (saved.prison === undefined) saved.prison = null;
      // Heist migration
      if (saved.activeHeist === undefined) saved.activeHeist = null;
      if (!saved.heistCooldowns) saved.heistCooldowns = {};
      if (saved.heistPlan === undefined) saved.heistPlan = null;
      // News migration
      if (!saved.dailyNews) saved.dailyNews = [];
      // Villa migration
      // The villa is retired. A save that still has one would otherwise keep producing
      // and protecting money with no screen to see it on, so close it out and hand back
      // what was inside — the vault money and the goods in storage.
      if (saved.villa) {
        saved.money = (saved.money || 0) + (saved.villa.vaultMoney || 0);
        for (const [gid, qty] of Object.entries(saved.villa.storedGoods || {})) {
          if (!saved.inventory) saved.inventory = {};
          saved.inventory[gid] = (saved.inventory[gid] || 0) + (Number(qty) || 0);
        }
      }
      saved.villa = null;
      // Jobs predate the drawn targets; without a kind the scene has nothing to open.
      if (saved.activeJob && !saved.activeJob.target) saved.activeJob.target = 'crate';
      // Ensure crew have specialization field
      saved.crew?.forEach((c: any) => { if (c.specialization === undefined) c.specialization = null; if (c.loyalty === undefined) c.loyalty = 75; });
      // Narrative expansion migrations
      if (saved.backstory === undefined) saved.backstory = null;
      // Crew events migration
      if (saved.pendingCrewEvent === undefined) saved.pendingCrewEvent = null;
      if (!saved.crewEventCooldowns) saved.crewEventCooldowns = {};
      if (!saved.crewTrouwBonusGiven) saved.crewTrouwBonusGiven = {};
      if (!saved.crewUltimatumGiven) saved.crewUltimatumGiven = {};
      if (saved.karma === undefined) saved.karma = 0;
      if (!saved.npcRelations) saved.npcRelations = {};
      if (!saved.keyDecisions) saved.keyDecisions = [];
      if (saved.pendingFlashback === undefined) saved.pendingFlashback = null;
      // Endgame event tracking migration
      if (!saved.seenEndgameEvents) saved.seenEndgameEvents = [];
      // Achievement popup migration
      if (!saved.pendingAchievements) saved.pendingAchievements = [];
      // Bounty & Stock market migrations
      if (!saved.activeBounties) saved.activeBounties = [];
      if (!saved.placedBounties) saved.placedBounties = [];
      if (saved.pendingBountyEncounter === undefined) saved.pendingBountyEncounter = null;
      if (!saved.bountyBoard) saved.bountyBoard = [];
      if (!saved.stockPrices) saved.stockPrices = {};
      if (!saved.stockHistory) saved.stockHistory = {};
      if (!saved.stockHoldings) saved.stockHoldings = {};
      if (saved.pendingInsiderTip === undefined) saved.pendingInsiderTip = null;
      if (!saved.stockEvents) saved.stockEvents = [];
      const today = new Date().toDateString();
      if (saved.lastLoginDay !== today) {
        saved.dailyRewardClaimed = false;
      }
      if (saved.dailyRewardClaimed === undefined) saved.dailyRewardClaimed = false;
      // MMO state migration
      if (saved.energy === undefined) saved.energy = 100;
      if (saved.maxEnergy === undefined) saved.maxEnergy = 100;
      if (saved.nerve === undefined) saved.nerve = 50;
      if (saved.maxNerve === undefined) saved.maxNerve = 50;
      if (saved.energyRegenAt === undefined) saved.energyRegenAt = null;
      if (saved.nerveRegenAt === undefined) saved.nerveRegenAt = null;
      if (saved.travelCooldownUntil === undefined) saved.travelCooldownUntil = null;
      if (saved.crimeCooldownUntil === undefined) saved.crimeCooldownUntil = null;
      if (saved.attackCooldownUntil === undefined) saved.attackCooldownUntil = null;
      if (saved.heistCooldownUntil === undefined) saved.heistCooldownUntil = null;
      if (saved.lastTickAt === undefined) saved.lastTickAt = new Date().toISOString();
      // Repair stashes shrunk by the old vehicle-driven capacity: the free starter
      // van set maxInv to 5, below the base of 15, and vehicles can no longer be
      // changed. Anything at or under the base is lifted back to it.
      if (!saved.maxInv || saved.maxInv < BASE_STASH_SLOTS) saved.maxInv = BASE_STASH_SLOTS;
      if (saved.tickIntervalMinutes === undefined) saved.tickIntervalMinutes = 30;
      if (saved.serverSynced === undefined) saved.serverSynced = false;
      // Gang territory migration
      if (!saved.gangDistricts) saved.gangDistricts = [];
      if (saved.gangId === undefined) saved.gangId = null;
      // Hardcore & prestige reset migration
      if (saved.hardcoreMode === undefined) saved.hardcoreMode = false;
      if (saved.prestigeResetCount === undefined) saved.prestigeResetCount = 0;
      // Underworld Economy migrations
      if (saved.armsNetwork === undefined) saved.armsNetwork = null;
      if (!saved.stashHouses) saved.stashHouses = [];
      if (!saved.marketPriceModifiers) saved.marketPriceModifiers = [];
      if (!saved.insiderTips) saved.insiderTips = [];
      if (!saved.launderMethodsUsed) saved.launderMethodsUsed = {};
      // Migrate old smuggle routes
      saved.smuggleRoutes?.forEach((r: any) => {
        if (r.level === undefined) r.level = 1;
        if (r.specialization === undefined) r.specialization = null;
        if (r.escort === undefined) r.escort = null;
        if (r.escortRole === undefined) r.escortRole = null;
      });
      // Local MMO world simulation migration — generate a fresh bot world for saves that
      // predate it, or rebuild if the schema version changed. The world day is derived from
      // the real calendar (see useWorldState), so seed auctions against that, not saved.day
      // (which may still be its fresh-game default when this runs).
      if (!saved.world || saved.world.version !== WORLD_SIM_VERSION) {
        const worldRef = new Date('2025-01-01T06:00:00').getTime();
        const worldDay = Math.floor((Date.now() - worldRef) / (24 * 60 * 60 * 1000)) + 1;
        saved.world = generateWorld((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0, saved.player?.level || 1, Math.max(saved.day || 1, worldDay));
      }
      // Gym & jobs migration
      if (!saved.gymStats) saved.gymStats = { strength: 1, defense: 1, speed: 1, dexterity: 1 };
      if (saved.job === undefined) saved.job = null;
      // Player organization migration
      if (saved.org === undefined) saved.org = null;
      return saved;
    }
    const fresh = createInitialState();
    Engine.generatePrices(fresh);
    fresh.dailyNews = generateDailyNews(fresh);
    // Check if hardcore mode was requested from main menu
    const startHardcore = localStorage.getItem('noxhaven_start_hardcore');
    if (startHardcore) {
      fresh.hardcoreMode = true;
      localStorage.removeItem('noxhaven_start_hardcore');
    }
    return fresh;
  });

  const [view, setView] = React.useState<GameView>('klus');
  const [tradeMode, setTradeMode] = React.useState<TradeMode>('buy');
  const [selectedDistrict, setSelectedDistrict] = React.useState<DistrictId | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [toastError, setToastError] = React.useState(false);
  const [xpBreakdown, setXpBreakdown] = React.useState<XpBreakdownData | null>(null);
  const clearXpBreakdown = useCallback(() => setXpBreakdown(null), []);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevAchievementsRef = useRef<string[]>(state.achievements);
  const prevPhaseRef = useRef(state.endgamePhase);

  const showToast = useCallback((msg: string, isError = false) => {
    setToast(msg);
    setToastError(isError);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // Server sync — intercepts server-side actions when logged in
  const { serverDispatch, syncState, saveToCloud, loadFromCloud, updateStateRef } = useServerSync(rawDispatch, showToast);

  const dispatch = useCallback((action: GameAction) => {
    serverDispatch(action);
  }, [serverDispatch]);

  // Update stateRef IMMEDIATELY on every state change (no debounce) for cloud save accuracy
  useEffect(() => {
    updateStateRef(state);
  }, [state, updateStateRef]);

  // Auto-save on state change (debounced) + check for new achievements + phase-up
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Debounced save — 2 seconds
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      Engine.saveGame(state);
      localStorage.setItem('noxhaven_last_save_time', Date.now().toString());
    }, 2000);

    const prev = prevAchievementsRef.current;
    const newOnes = state.achievements.filter(a => !prev.includes(a));
    if (newOnes.length > 0) {
      const achievement = ACHIEVEMENTS.find(a => a.id === newOnes[0]);
      if (achievement) {
        showToast(`🏆 ${achievement.name}: ${achievement.desc}`);
      }
    }
    prevAchievementsRef.current = [...state.achievements];

    // Check phase progression
    const phaseMsg = getPhaseUpMessage(prevPhaseRef.current, state.endgamePhase);
    if (phaseMsg) {
      setTimeout(() => showToast(phaseMsg), 500);
    }
    prevPhaseRef.current = state.endgamePhase;

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [state, showToast]);

  // ========== JOB TICKER (real time) ==========
  // The rest of the game moves in 30-minute day ticks, but the job you are
  // working has to feel alive: crew assigned in that district push the bar
  // forward every second, whether or not your hands are on it.
  const jobStateRef = useRef(state);
  jobStateRef.current = state;
  useEffect(() => {
    const id = setInterval(() => {
      const s = jobStateRef.current;
      if (!s?.activeJob || s.gameOver) return;
      const work = crewWorkPerSecond(s, s.activeJob.district);
      if (work > 0) dispatch({ type: 'SCORE_WORK', amount: work });
    }, 1000);
    return () => clearInterval(id);
  }, [dispatch]);

  // ========== AUTO-TICK SYSTEM (replaces manual END_TURN) ==========
  // Every tickIntervalMinutes (default 30 min) of real time = 1 game day
  const autoTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const checkTick = () => {
      const lastTick = state.lastTickAt ? new Date(state.lastTickAt).getTime() : Date.now();
      const interval = (state.tickIntervalMinutes || 30) * 60 * 1000;
      const now = Date.now();
      const ticksPassed = Math.floor((now - lastTick) / interval);
      
      if (ticksPassed > 0 && !state.gameOver && !state.victoryData) {
        const ticksToProcess = Math.min(ticksPassed, 5);
        const isCatchUp = ticksPassed > 1;
        
        // Snapshot key values before catch-up for the report
        const preDay = state.day;
        const preMoney = state.money;
        const preEnergy = state.energy;
        const preNerve = state.nerve;
        const preHeat = state.heat;
        const preXp = state.player?.xp || 0;
        const preLevel = state.player?.level || 1;
        
        for (let i = 0; i < ticksToProcess; i++) {
          dispatch({ type: 'AUTO_TICK', isCatchUp });
        }
        
        // Show catch-up report if multiple ticks were processed
        if (isCatchUp) {
          const minutesAway = Math.round((ticksPassed * (state.tickIntervalMinutes || 30)));
          
          // Estimate income per tick from businesses
          const bizIncome = (state.ownedBusinesses || []).reduce((s: number, bid: string) => {
            const biz = BUSINESSES.find((b) => b.id === bid);
            return s + (biz?.income || 0);
          }, 0);
          const totalBizIncome = bizIncome * ticksToProcess;
          const totalDistIncome = 0; // MMO: district income removed
          
          dispatch({
            type: 'SET_CATCH_UP_REPORT',
            report: {
              ticksProcessed: ticksToProcess,
              minutesAway,
              daysAdvanced: ticksToProcess,
              energyRestored: Math.max(0, (state.maxEnergy || 100) - preEnergy),
              nerveRestored: Math.max(0, (state.maxNerve || 50) - preNerve),
              moneyEarned: totalBizIncome + totalDistIncome,
              heatDecayed: Math.max(0, preHeat - (state.heat || 0)),
              xpGained: 0,
              levelUps: 0,
              businessIncome: totalBizIncome,
              districtIncome: totalDistIncome,
            }
          });
        }
      }
    };

    // Check immediately on mount
    checkTick();
    // Then check every 60 seconds
    autoTickRef.current = setInterval(checkTick, 60000);
    return () => { if (autoTickRef.current) clearInterval(autoTickRef.current); };
  }, [state.lastTickAt, state.tickIntervalMinutes, state.gameOver, state.victoryData, dispatch]);

  // ========== SERVER-SIDE XP FLUSH ==========
  // Flush pending XP gains to server for authoritative calculation
  const xpFlushRef = useRef(false);
  useEffect(() => {
    const pending = state._pendingXpGains;
    if (!pending || pending.length === 0 || xpFlushRef.current) return;

    xpFlushRef.current = true;
    // Batch all pending gains into one server call (sum amounts)
    const totalAmount = pending.reduce((sum, g) => sum + g.amount, 0);
    const sources = [...new Set(pending.map(g => g.source))].join(',');

    // Clear pending immediately to prevent re-firing — use dedicated action to avoid stale state
    rawDispatch({ type: 'CLEAR_PENDING_XP' as any });

    (async () => {
      try {
        const { gameApi } = await import('@/lib/gameApi');
        const res = await gameApi.gainXp(totalAmount, sources);
        if (res.success && res.data) {
          // Sync only the authoritative XP/level fields — never overwrite full state
          rawDispatch({ type: 'SYNC_SERVER_XP', data: res.data as any });
          // Show XP breakdown popup with bonus details
          if (res.data.totalXp > 0) {
            // Collect unlocks for all levels gained
            const unlocks: string[] = [];
            if (res.data.levelUps > 0) {
              const { LEVEL_GATES } = await import('@/game/skillTree');
              const oldLevel = res.data.newLevel - res.data.levelUps;
              for (const gate of LEVEL_GATES) {
                if (gate.level > oldLevel && gate.level <= res.data.newLevel) {
                  unlocks.push(...gate.unlocks);
                }
              }
            }
            setXpBreakdown({
              baseAmount: res.data.baseAmount,
              totalXp: res.data.xpGained ?? res.data.totalXp,
              multiplier: res.data.multiplier,
              bonuses: res.data.bonuses || [],
              levelUps: res.data.levelUps,
              newLevel: res.data.newLevel,
              milestoneRewards: res.data.milestoneRewards || [],
              unlocks: unlocks.length > 0 ? unlocks : undefined,
              restedConsumed: res.data.restedConsumed || 0,
            });
            // Auto-dismiss after longer if level-up (6s) or normal (4s)
            setTimeout(() => setXpBreakdown(null), res.data.levelUps > 0 ? 6000 : 4000);
          }
          if (res.data.levelUps > 0) {
            const milestoneMsg = (res.data.milestoneRewards || []).map((m: any) => `${m.titleIcon} ${m.title}`).join(', ');
            showToast(`⬆️ Level ${res.data.newLevel}! +${res.data.levelUps * 2} SP | +${res.data.levelUps} ⭐ Merit${milestoneMsg ? ` | ${milestoneMsg}` : ''}`);
          }
        }
      } catch {
        // Silent fail — optimistic local values remain
      }
      xpFlushRef.current = false;
    })();
  }, [state._pendingXpGains?.length]);

  // Generate prices from server if empty (fallback to client-side)
  useEffect(() => {
    if (!state.prices || Object.keys(state.prices).length === 0) {
      // Try to load from server first; fallback to local generation
      (async () => {
        try {
          const res = await import('@/lib/gameApi').then(m => m.gameApi.getMarketPrices());
          if (res.success && res.data?.prices) {
            const prices: Record<string, Record<string, number>> = {};
            const trends: Record<string, string> = {};
            Object.entries(res.data.prices as Record<string, Record<string, any>>).forEach(([distId, goods]) => {
              prices[distId] = {};
              Object.entries(goods).forEach(([gid, data]: [string, any]) => {
                prices[distId][gid] = data.price || data.current_price || 0;
                trends[gid] = data.trend || data.price_trend || 'stable';
              });
            });
            // Use targeted SET_PRICES instead of full SET_STATE to avoid overwriting economy
            rawDispatch({ type: 'SET_PRICES', prices, priceTrends: trends } as any);
            return;
          }
        } catch {}
        // Fallback: generate locally
        const s = { ...state };
        Engine.generatePrices(s);
        rawDispatch({ type: 'SET_PRICES', prices: s.prices, priceTrends: s.priceTrends } as any);
      })();
    }
  }, []);

  return (
    <GameContext.Provider value={{
      state,
      view,
      tradeMode,
      selectedDistrict,
      toast,
      toastError,
      xpBreakdown,
      clearXpBreakdown,
      setView,
      setTradeMode,
      selectDistrict: setSelectedDistrict,
      showToast,
      dispatch,
      onExitToMenu,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
