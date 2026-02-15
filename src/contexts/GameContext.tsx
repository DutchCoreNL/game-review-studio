import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { GameState, GameView, TradeMode, GoodId, DistrictId, StatId, FamilyId, FactionActionType, ActiveMission, SmuggleRoute, ScreenEffectType, OwnedVehicle, VehicleUpgradeType, ChopShopUpgradeId, SafehouseUpgradeId, AmmoPack, PrisonState, DistrictHQUpgradeId, WarTactic, VillaModuleId } from '../game/types';
import { createInitialState, DISTRICTS, VEHICLES, GEAR, BUSINESSES, ACHIEVEMENTS, NEMESIS_NAMES, REKAT_COSTS, VEHICLE_UPGRADES, STEALABLE_CARS, CHOP_SHOP_UPGRADES, OMKAT_COST, CAR_ORDER_CLIENTS, SAFEHOUSE_COSTS, SAFEHOUSE_UPGRADE_COSTS, SAFEHOUSE_UPGRADES, CORRUPT_CONTACTS, AMMO_PACKS, CRUSHER_AMMO_REWARDS, PRISON_BRIBE_COST_PER_DAY, PRISON_ESCAPE_BASE_CHANCE, PRISON_ESCAPE_HEAT_PENALTY, PRISON_ESCAPE_FAIL_EXTRA_DAYS, PRISON_ARREST_CHANCE_MISSION, PRISON_ARREST_CHANCE_HIGH_RISK, PRISON_ARREST_CHANCE_CARJACK, ARREST_HEAT_THRESHOLD, SOLO_OPERATIONS, DISTRICT_HQ_UPGRADES, UNIQUE_VEHICLES, RACES, AMMO_FACTORY_UPGRADES, HOSPITAL_STAY_DAYS, HOSPITAL_ADMISSION_COST_PER_MAXHP, HOSPITAL_REP_LOSS, MAX_HOSPITALIZATIONS } from '../game/constants';
import { VILLA_COST, VILLA_REQ_LEVEL, VILLA_REQ_REP, VILLA_UPGRADE_COSTS, VILLA_MODULES, getVaultMax, getStorageMax, processVillaProduction } from '../game/villa';
import { canUpgradeLab, LAB_UPGRADE_COSTS, createDrugEmpireState, shouldShowDrugEmpire, sellNoxCrystal, canAssignDealer, getAvailableCrew, MAX_DEALERS, type ProductionLabId, type DrugTier } from '../game/drugEmpire';
import * as Engine from '../game/engine';
import * as MissionEngine from '../game/missions';
import { startNemesisCombat, addPhoneMessage, resolveWarEvent, performSpionage, performSabotage, negotiateNemesis, scoutNemesis } from '../game/newFeatures';
import { createHeistPlan, performRecon, validateHeistPlan, startHeist as startHeistFn, executePhase, resolveComplication, HEIST_EQUIPMENT, HEIST_TEMPLATES } from '../game/heists';
import { calculateEndgamePhase, buildVictoryData, startFinalBoss, createBossPhase, canTriggerFinalBoss, createNewGamePlus, getPhaseUpMessage, getDeckDialogue, getEndgameEvent } from '../game/endgame';
import { rollStreetEvent, resolveStreetChoice } from '../game/storyEvents';
import { checkArcTriggers, checkArcProgression, resolveArcChoice } from '../game/storyArcs';
import { generateDailyChallenges, updateChallengeProgress, getChallengeTemplate } from '../game/dailyChallenges';
import { rollNpcEncounter, applyNpcBonuses } from '../game/npcs';
import { rollNpcEvent, resolveNpcEvent, applyMissingNpcBonuses } from '../game/npcEvents';
import { checkWeekEvent, processWeekEvent } from '../game/weekEvents';
import { applyBackstory } from '../game/backstory';
import { generateArcFlashback } from '../game/flashbacks';
import { generateHitContracts, executeHit } from '../game/hitman';
import * as bountyModule from '../game/bounties';
import * as stockModule from '../game/stocks';
import { resolveCrewEvent } from '../game/crewEvents';
import { generateDailyNews } from '../game/newsGenerator';
import { checkCinematicTrigger, applyCinematicChoice, markCinematicSeen } from '../game/cinematics';

interface GameContextType {
  state: GameState;
  view: GameView;
  tradeMode: TradeMode;
  selectedDistrict: DistrictId | null;
  toast: string | null;
  toastError: boolean;
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
  | { type: 'END_TURN' }
  | { type: 'DISMISS_NIGHT_REPORT' }
  | { type: 'RECRUIT' }
  | { type: 'HEAL_CREW'; crewIndex: number }
  | { type: 'FIRE_CREW'; crewIndex: number }
  | { type: 'UPGRADE_STAT'; stat: StatId }
  | { type: 'BUY_GEAR'; id: string }
  | { type: 'EQUIP'; id: string }
  | { type: 'UNEQUIP'; slot: string }
  | { type: 'BUY_VEHICLE'; id: string }
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
  | { type: 'PAY_DEBT'; amount: number }
  | { type: 'SET_TUTORIAL_DONE' }
  | { type: 'CLAIM_DAILY_REWARD' }
  | { type: 'CASINO_BET'; amount: number }
  | { type: 'CASINO_WIN'; amount: number }
  | { type: 'START_COMBAT'; familyId: FamilyId }
  | { type: 'START_NEMESIS_COMBAT' }
  | { type: 'COMBAT_ACTION'; action: 'attack' | 'heavy' | 'defend' | 'environment' | 'tactical' }
  | { type: 'END_COMBAT' }
  | { type: 'FACTION_ACTION'; familyId: FamilyId; actionType: FactionActionType }
  | { type: 'CONQUER_FACTION'; familyId: FamilyId }
  | { type: 'ANNEX_FACTION'; familyId: FamilyId }
  | { type: 'START_MISSION'; mission: ActiveMission }
  | { type: 'MISSION_CHOICE'; choiceId: string; forceResult?: 'success' | 'fail' }
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
  | { type: 'TRACK_BLACKJACK_WIN' }
  | { type: 'RESET_BLACKJACK_STREAK' }
  | { type: 'TRACK_HIGHLOW_ROUND'; round: number }
  | { type: 'JACKPOT_ADD'; amount: number }
  | { type: 'JACKPOT_RESET' }
  | { type: 'START_FINAL_BOSS' }
  | { type: 'START_BOSS_PHASE_2' }
  | { type: 'RESOLVE_FINAL_BOSS' }
  | { type: 'NEW_GAME_PLUS' }
  | { type: 'FREE_PLAY' }
  | { type: 'RESOLVE_STREET_EVENT'; choiceId: string; forceResult?: 'success' | 'fail' }
  | { type: 'DISMISS_STREET_EVENT' }
  | { type: 'SET_SCREEN_EFFECT'; effect: ScreenEffectType }
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
  | { type: 'BUY_VILLA' }
  | { type: 'UPGRADE_VILLA' }
  | { type: 'INSTALL_VILLA_MODULE'; moduleId: VillaModuleId }
  | { type: 'DEPOSIT_VILLA_MONEY'; amount: number }
  | { type: 'WITHDRAW_VILLA_MONEY'; amount: number }
  | { type: 'DEPOSIT_VILLA_GOODS'; goodId: GoodId; amount: number }
  | { type: 'WITHDRAW_VILLA_GOODS'; goodId: GoodId; amount: number }
  | { type: 'DEPOSIT_VILLA_AMMO'; amount: number }
  | { type: 'WITHDRAW_VILLA_AMMO'; amount: number }
  | { type: 'VILLA_HELIPAD_TRAVEL'; to: DistrictId }
  | { type: 'VILLA_THROW_PARTY' }
  | { type: 'PRESTIGE_VILLA_MODULE'; moduleId: VillaModuleId }
  | { type: 'UPGRADE_AMMO_FACTORY' }
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
  | { type: 'RESET' };

const GameContext = createContext<GameContextType | undefined>(undefined);

/** Helper: update challenge progress after an action */
function syncChallenges(s: GameState): void {
  if (!s.dailyChallenges || s.dailyChallenges.length === 0) return;
  s.dailyChallenges = updateChallengeProgress(s.dailyChallenges, s.dailyProgress, s.heat);
}

function gameReducer(state: GameState, action: GameAction): GameState {
  const s = JSON.parse(JSON.stringify(state)) as GameState;

  switch (action.type) {
    case 'SET_STATE': {
      // Migrate old HQ upgrades to villa modules
      const loaded = action.state;
      if (loaded.villa && loaded.hqUpgrades) {
        if (loaded.hqUpgrades.includes('garage') && !loaded.villa.modules.includes('garage_uitbreiding')) {
          loaded.villa.modules.push('garage_uitbreiding');
        }
        if (loaded.hqUpgrades.includes('server') && !loaded.villa.modules.includes('server_room')) {
          loaded.villa.modules.push('server_room');
        }
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
      return loaded;
    }

    case 'TRADE': {
      if ((s.hidingDays || 0) > 0 || s.prison || s.hospital) return s; // Can't trade while hiding, in prison or hospital
      // Wanted check before trade
      if (Engine.isWanted(s) && !s.prison) {
        if (Engine.checkWantedArrest(s)) {
          addPhoneMessage(s, 'NHPD', `Gearresteerd tijdens een handelsactie! Je was GEZOCHT. Straf: ${s.prison?.daysRemaining} dagen.`, 'threat');
          s.screenEffect = 'blood-flash';
          return s;
        }
      }
      const moneyBefore = s.money;
      Engine.performTrade(s, action.gid, action.mode, action.quantity || 1);
      // Heat 2.0: trade heat goes to vehicle (transport of goods)
      const tradeHeat = action.mode === 'buy' ? 1 : 2;
      Engine.addVehicleHeat(s, tradeHeat);
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
      // Daily challenge tracking
      if (s.dailyProgress) {
        s.dailyProgress.trades += action.quantity || 1;
        if (action.mode === 'sell') {
          const tradeEarned = s.money - moneyBefore;
          if (tradeEarned > 0) s.dailyProgress.earned += tradeEarned;
        }
      }
      syncChallenges(s);
      return s;
    }

    case 'TRAVEL': {
      if ((s.hidingDays || 0) > 0 || s.prison || s.hospital) return s; // Can't travel while hiding, in prison or hospital
      // Wanted check before travel
      if (Engine.isWanted(s) && !s.prison) {
        if (Engine.checkWantedArrest(s)) {
          addPhoneMessage(s, 'NHPD', `Gearresteerd tijdens reizen! Je was GEZOCHT. Straf: ${s.prison?.daysRemaining} dagen.`, 'threat');
          s.screenEffect = 'blood-flash';
          return s;
        }
      }
      const hasChauffeur = s.crew.some(c => c.role === 'Chauffeur');
      const hasRacer = s.crew.some(c => c.specialization === 'racer');
      const isOwned = s.ownedDistricts.includes(action.to);
      const isStorm = s.weather === 'storm';
      const speedBonus = Engine.getVehicleUpgradeBonus(s, 'speed');
      // Speed upgrade reduces travel cost: -15/€ per bonus point (max 6 at level 3)
      let baseCost = 50;
      if (speedBonus > 0) baseCost = Math.max(0, baseCost - speedBonus * 8);
      const cost = (hasChauffeur || hasRacer || isOwned || isStorm) ? 0 : baseCost;
      if (s.money < cost) return s;
      s.money -= cost;
      if (cost > 0) s.stats.totalSpent += cost;
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
      // Roll for street event
      const travelEvent = rollStreetEvent(s, 'travel');
      if (travelEvent) {
        s.pendingStreetEvent = travelEvent;
        s.streetEventResult = null;
      }
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
      const d = DISTRICTS[action.id];
      if (!d || s.money < d.cost || s.loc !== action.id) return s;
      s.money -= d.cost;
      s.stats.totalSpent += d.cost;
      s.ownedDistricts.push(action.id);
      Engine.gainXp(s, 50);
      s.maxInv = Engine.recalcMaxInv(s);
      // Cinematic trigger: first district
      const distCinematic = checkCinematicTrigger(s, 'district_bought');
      if (distCinematic) s.pendingCinematic = distCinematic;
      return s;
    }

    case 'END_TURN': {
      if (s.debt > 250000) return s;
      Engine.endTurn(s);
      Engine.checkAchievements(s);
      const oldPhase = s.endgamePhase;
      s.endgamePhase = calculateEndgamePhase(s);

      // Endgame phase change notifications
      if (oldPhase !== s.endgamePhase) {
        const msg = getPhaseUpMessage(oldPhase, s.endgamePhase);
        if (msg) {
          addPhoneMessage(s, 'system', msg, 'info');
        }
        // Special messages when reaching onderwerelds_koning
        if (s.endgamePhase === 'onderwerelds_koning') {
          addPhoneMessage(s, 'Commissaris Decker', 'Ik weet wie je bent. Ik weet wat je hebt gedaan. Geniet van je laatste dagen van vrijheid.', 'threat');
          addPhoneMessage(s, 'anonymous', '⚠️ Operatie Gerechtigheid is geactiveerd. De NHPD mobiliseert al haar middelen.', 'warning');
        }
      }

      // Roll for street event
      const endTurnEvent = rollStreetEvent(s, 'end_turn');
      if (endTurnEvent) {
        s.pendingStreetEvent = endTurnEvent;
        s.streetEventResult = null;
      }

      // Endgame events: random events when all factions conquered
      if ((s.conqueredFactions?.length || 0) >= 3 && !s.finalBossDefeated) {
        // Initialize seen events tracker
        if (!s.seenEndgameEvents) s.seenEndgameEvents = [];
        const egEvent = getEndgameEvent(s);
        if (egEvent) {
          s.seenEndgameEvents.push(egEvent.id);
          // Apply event effects
          if (egEvent.reward.money) {
            if (egEvent.reward.money > 0) {
              s.money += egEvent.reward.money;
              s.stats.totalEarned += egEvent.reward.money;
            } else {
              const cost = Math.abs(egEvent.reward.money);
              if (s.money >= cost) {
                s.money -= cost;
                s.stats.totalSpent += cost;
              }
            }
          }
          if (egEvent.reward.rep) s.rep += egEvent.reward.rep;
          if (egEvent.reward.xp) Engine.gainXp(s, egEvent.reward.xp);
          if (egEvent.reward.heat) Engine.splitHeat(s, egEvent.reward.heat, 0.5);
          addPhoneMessage(s, 'NHPD', `${egEvent.icon} ${egEvent.title}: ${egEvent.desc}`, egEvent.reward.heat ? 'threat' : 'opportunity');
        }
      }

      // Story arcs: check triggers and progression (skip while in prison)
      if (!s.prison) {
        checkArcTriggers(s);
        if (!s.pendingStreetEvent) {
          checkArcProgression(s);
        }
      }
      // Car orders: generate new orders every 3 days, max 3 active
      if (s.day % 3 === 0 && s.carOrders.length < 3 && s.stolenCars.length > 0 || s.day % 5 === 0 && s.carOrders.length < 3) {
        // Remove expired orders
        s.carOrders = s.carOrders.filter(o => o.deadline >= s.day);
        // Add new order
        const randomCar = STEALABLE_CARS[Math.floor(Math.random() * STEALABLE_CARS.length)];
        const client = CAR_ORDER_CLIENTS[Math.floor(Math.random() * CAR_ORDER_CLIENTS.length)];
        const bonusPercent = 20 + Math.floor(Math.random() * 60); // 20-80% bonus
        const newOrderClient = `${client.emoji} ${client.name}`;
        s.carOrders.push({
          id: `order_${s.day}_${Math.floor(Math.random() * 1000)}`,
          carTypeId: randomCar.id,
          clientName: newOrderClient,
          bonusPercent,
          deadline: s.day + 5 + Math.floor(Math.random() * 5),
          desc: `Zoekt een ${randomCar.name}. Betaalt ${bonusPercent}% extra.`,
        });
        // Send phone notification about the new order
        addPhoneMessage(s, newOrderClient, `Ik zoek een ${randomCar.name}. Ik betaal ${bonusPercent}% extra boven marktwaarde. Lever binnen ${5 + Math.floor(Math.random() * 5)} dagen.`, 'opportunity');
      }
      // Decay stolen car condition slightly
      s.stolenCars.forEach(car => {
        if (!car.omgekat) car.condition = Math.max(20, car.condition - 1);
      });
      // Daily challenges: generate new ones if day changed, reset daily progress
      if (s.challengeDay !== s.day) {
        s.dailyChallenges = generateDailyChallenges(s);
        s.challengeDay = s.day;
        s.dailyProgress = { trades: 0, earned: 0, washed: 0, solo_ops: 0, contracts: 0, travels: 0, bribes: 0, faction_actions: 0, recruits: 0, cars_stolen: 0, casino_won: 0, hits_completed: 0 };
      }
      // Check low_heat challenge at end of turn
      syncChallenges(s);
      // NPC encounters
      if (!s.pendingStreetEvent && !s.pendingArcEvent) {
        const npcEnc = rollNpcEncounter(s);
        if (npcEnc) {
          addPhoneMessage(s, npcEnc.npcId, npcEnc.message, 'info');
        }
        // NPC interactive events
        if (!(s as any).pendingNpcEvent) {
          const npcEvt = rollNpcEvent(s);
          if (npcEvt) {
            (s as any).pendingNpcEvent = npcEvt;
          }
        }
      }
      // NPC passive bonuses
      const npcBonuses = applyNpcBonuses(s);
      if (npcBonuses.extraHeatDecay > 0) {
        Engine.addPersonalHeat(s, -npcBonuses.extraHeatDecay);
        Engine.recomputeHeat(s);
      }
      if (npcBonuses.crewHealBonus > 0) {
        s.crew.forEach(c => { if (c.hp < 100 && c.hp > 0) c.hp = Math.min(100, c.hp + npcBonuses.crewHealBonus); });
      }
      // Apply missing NPC bonuses (Luna free crew, etc.)
      applyMissingNpcBonuses(s);
      // Week events
      const weekEvt = checkWeekEvent(s);
      if (weekEvt) (s as any).activeWeekEvent = weekEvt;
      processWeekEvent(s);
      // Generate hit contracts
      s.hitContracts = generateHitContracts(s);
      // Generate daily news
      s.dailyNews = generateDailyNews(s);
      // Small chance to find ammo after successful missions/operations
      if (Math.random() < 0.2) {
        const foundAmmo = 2 + Math.floor(Math.random() * 4);
        s.ammo = Math.min(99, (s.ammo || 0) + foundAmmo);
      }
      // === RACING: Reset daily cooldown ===
      s.raceUsedToday = false;
      // === DEALER: Fluctuate vehicle prices ===
      if (!s.vehiclePriceModifiers) s.vehiclePriceModifiers = {};
      for (const v of VEHICLES) {
        const current = s.vehiclePriceModifiers[v.id] ?? 1;
        const change = -0.10 + Math.random() * 0.25; // -10% to +15%
        s.vehiclePriceModifiers[v.id] = Math.max(0.7, Math.min(1.3, current + change * 0.3));
      }
      // === DEALER: Generate deal every 5 days ===
      if (s.day % 5 === 0) {
        const ownedIds = s.ownedVehicles.map(v => v.id);
        const candidates = VEHICLES.filter(v => !ownedIds.includes(v.id) && v.cost > 0);
        if (candidates.length > 0) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          s.dealerDeal = {
            vehicleId: pick.id,
            discount: 0.2 + Math.random() * 0.1, // 20-30%
            expiresDay: s.day + 1,
          };
          addPhoneMessage(s, '🏪 Dealer', `Speciale aanbieding: ${pick.name} met ${Math.round((0.2 + Math.random() * 0.1) * 100)}% korting! Alleen vandaag.`, 'opportunity');
        }
      }
      // === UNIQUE VEHICLES: Check unlock conditions ===
      const checkUniqueUnlock = (checkId: string): boolean => {
        switch (checkId) {
          case 'final_boss': return s.finalBossDefeated;
          case 'all_factions': return (s.conqueredFactions?.length || 0) >= 3;
          case 'nemesis_gen3': return (s.nemesis?.generation || 1) > 3;
          case 'all_vehicles': return VEHICLES.every(v => s.ownedVehicles.some(ov => ov.id === v.id));
          default: return false;
        }
      };
      for (const uv of UNIQUE_VEHICLES) {
        if (!s.ownedVehicles.some(ov => ov.id === uv.id) && checkUniqueUnlock(uv.unlockCheck)) {
          s.ownedVehicles.push({ id: uv.id, condition: 100, vehicleHeat: 0, rekatCooldown: 0 });
          addPhoneMessage(s, '🏆 UNIEK', `Je hebt ${uv.name} ontgrendeld! ${uv.desc}`, 'opportunity');
        }
      }
      // === CINEMATIC TRIGGERS at end of turn ===
      if (!s.pendingCinematic) {
        // Check arrest cinematic
        if (s.prison) {
          const arrestCinematic = checkCinematicTrigger(s, 'arrested');
          if (arrestCinematic) s.pendingCinematic = arrestCinematic;
        }
        // Check crew defection cinematic
        if (s.nightReport?.crewDefections && s.nightReport.crewDefections.length > 0) {
          const betrayalCinematic = checkCinematicTrigger(s, 'crew_defected');
          if (betrayalCinematic) s.pendingCinematic = betrayalCinematic;
        }
        // Check milestone cinematics (godfather, rise_to_power)
        if (!s.pendingCinematic) {
          const endCinematic = checkCinematicTrigger(s);
          if (endCinematic) s.pendingCinematic = endCinematic;
        }
      }
      return s;
    }

    case 'DISMISS_NIGHT_REPORT': {
      s.nightReport = null;
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
      if (s.player.skillPoints <= 0) return s;
      s.player.stats[action.stat]++;
      s.player.skillPoints--;
      // Sync max HP when muscle changes
      if (action.stat === 'muscle') {
        const oldMax = s.playerMaxHP;
        Engine.syncPlayerMaxHP(s);
        const hpGain = s.playerMaxHP - oldMax;
        if (hpGain > 0) s.playerHP = Math.min(s.playerMaxHP, s.playerHP + hpGain);
      }
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
      if (!v || s.money < v.cost) return s;
      s.money -= v.cost;
      s.stats.totalSpent += v.cost;
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
      const amount = Math.min(s.dirtyMoney, 3000 + (s.ownedDistricts.length * 1000));
      s.dirtyMoney -= amount;
      let washed = amount;
      if (s.ownedDistricts.includes('neon')) washed = Math.floor(amount * 1.15);
      const clean = Math.floor(washed * 0.85);
      s.money += clean;
      s.stats.totalEarned += clean;
      // Heat 2.0: washing generates personal heat (financial crime)
      Engine.addPersonalHeat(s, 8);
      Engine.recomputeHeat(s);
      Engine.gainXp(s, 5);
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
      let washedAmt = washAmt;
      if (s.ownedDistricts.includes('neon')) washedAmt = Math.floor(washAmt * 1.15);
      const cleanAmt = Math.floor(washedAmt * 0.85);
      s.money += cleanAmt;
      s.stats.totalEarned += cleanAmt;
      s.washUsedToday = (s.washUsedToday || 0) + washAmt;
      // Heat 2.0: washing generates personal heat
      Engine.addPersonalHeat(s, Math.max(1, Math.floor(washAmt / 500)));
      Engine.recomputeHeat(s);
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
      const soloEvent = rollStreetEvent(s, 'solo_op');
      if (soloEvent) {
        s.pendingStreetEvent = soloEvent;
        s.streetEventResult = null;
      }
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

    case 'PAY_DEBT': {
      if (action.amount < 0 || s.money < action.amount || s.debt <= 0) return s;
      const amt = Math.min(action.amount, s.debt);
      s.money -= amt;
      s.debt -= amt;
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

    case 'START_COMBAT': {
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
      
      const { NEMESIS_TAUNTS } = require('../game/constants');
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
          const { NEMESIS_ARCHETYPES: ARCH } = require('../game/constants');
          const archDef = ARCH.find((a: any) => a.id === nextArchetype);
          addPhoneMessage(s, 'informant', `${nem.name} werkt nu als informant. De volgende rivaal wordt een ${archDef?.icon} ${archDef?.name}.`, 'opportunity');
          // Longer spawn delay (informant keeps things calm)
          nem.nextSpawnDay = Math.max(nem.nextSpawnDay, s.day + 15);
          break;
      }
      return s;
    }

    case 'COMBAT_ACTION': {
      if (!s.activeCombat) return s;
      const hpBefore = s.activeCombat.playerHP;
      const enemyHpBefore = s.activeCombat.targetHP;
      Engine.combatAction(s, action.action);
      Engine.checkAchievements(s);

      // Add boss dialogue if applicable
      if (s.activeCombat && s.activeCombat.bossPhase) {
        const dialogue = getDeckDialogue(s.activeCombat);
        if (dialogue) {
          s.activeCombat.logs.push(dialogue);
        }
      }

      // Trigger screen effects based on combat outcome
      if (s.activeCombat) {
        const playerTookDamage = s.activeCombat.playerHP < hpBefore;
        const dealtHeavyDamage = (enemyHpBefore - s.activeCombat.targetHP) > 15;
        const enemyDefeated = s.activeCombat.finished && s.activeCombat.won;
        const playerDefeated = s.activeCombat.finished && !s.activeCombat.won;

        if (enemyDefeated) {
          s.screenEffect = 'gold-flash';
        } else if (playerDefeated) {
          s.screenEffect = 'blood-flash';
        } else if (action.action === 'heavy' && dealtHeavyDamage) {
          s.screenEffect = 'shake';
        } else if (playerTookDamage && (hpBefore - s.activeCombat.playerHP) > 10) {
          s.screenEffect = 'blood-flash';
        }
      }

      // Check if this was the final boss phase 2 and it was won
      if (s.activeCombat?.finished && s.activeCombat?.won && s.activeCombat?.bossPhase === 2) {
        s._finalBossWon = true;
      }
      // Update endgame phase after combat
      s.endgamePhase = calculateEndgamePhase(s);
      return s;
    }

    case 'END_COMBAT': {
      // Persist remaining HP back to state
      if (s.activeCombat) {
        if (s.activeCombat.won) {
          // Won: keep remaining HP (min 1)
          s.playerHP = Math.max(1, s.activeCombat.playerHP);
        } else {
          // Last Stand: 15% chance to survive with 1 HP
          const lastStandRoll = Math.random();
          if (lastStandRoll < 0.15) {
            s.playerHP = 1;
            addPhoneMessage(s, '⚡ Last Stand', 'Je weigerde te vallen. Met pure wilskracht overleef je het gevecht met 1 HP!', 'warning');
          } else {
          // Lost: hospitalization system
          const maxHP = s.playerMaxHP;
          const hospitalCost = maxHP * HOSPITAL_ADMISSION_COST_PER_MAXHP;
          s.hospitalizations = (s.hospitalizations || 0) + 1;

          if (s.hospitalizations >= MAX_HOSPITALIZATIONS) {
            // Game Over
            s.gameOver = true;
            s.playerHP = 0;
          } else {
            // Admit to hospital
            s.hospital = {
              daysRemaining: HOSPITAL_STAY_DAYS,
              totalDays: HOSPITAL_STAY_DAYS,
              cost: hospitalCost,
            };
            s.money = Math.max(0, s.money - hospitalCost);
            s.stats.totalSpent += Math.min(s.money + hospitalCost, hospitalCost);
            s.rep = Math.max(0, s.rep - HOSPITAL_REP_LOSS);
            s.playerHP = 1; // barely alive during hospital stay
            addPhoneMessage(s, 'Crown Heights Ziekenhuis', `Je bent opgenomen na een verloren gevecht. Kosten: €${hospitalCost.toLocaleString()}. Hersteltijd: ${HOSPITAL_STAY_DAYS} dagen. (Opname ${s.hospitalizations}/${MAX_HOSPITALIZATIONS})`, 'warning');
          }
          } // end else (not last stand)
        }
        // Check nemesis wounded revenge (player lost nemesis combat)
        if (s.activeCombat?.isNemesis && !s.activeCombat.won && s.nemesis?.alive) {
          // Sync nemesis HP from combat
          s.nemesis.hp = s.activeCombat.targetHP;
          const { checkNemesisWoundedRevenge } = require('../game/newFeatures');
          checkNemesisWoundedRevenge(s);
        }
      }
      const wasFinalBoss = s._finalBossWon;
      delete s._finalBossWon;
      // Cinematic triggers on combat end
      if (s.activeCombat?.won) {
        const combatCinematic = checkCinematicTrigger(s, 'combat_won');
        if (combatCinematic) s.pendingCinematic = combatCinematic;
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
      Engine.generatePrices(ngPlus);
      Engine.generateContracts(ngPlus);
      return ngPlus;
    }

    case 'FREE_PLAY': {
      s.freePlayMode = true;
      s.victoryData = null;
      return s;
    }

    case 'RESOLVE_STREET_EVENT': {
      if (!s.pendingStreetEvent) return s;
      const result = resolveStreetChoice(s, s.pendingStreetEvent, action.choiceId, action.forceResult);
      // Apply effects
      if (result.success) {
        s.money += result.effects.money;
        s.dirtyMoney += result.effects.dirtyMoney;
        // Heat 2.0: street events split heat
        Engine.splitHeat(s, result.effects.heat, 0.5);
        Engine.recomputeHeat(s);
        s.rep += result.effects.rep;
        if (result.effects.money > 0) s.stats.totalEarned += result.effects.money;
        if (result.effects.dirtyMoney > 0) s.stats.totalEarned += result.effects.dirtyMoney;
        if (result.effects.crewDamage > 0 && s.crew.length > 0) {
          const target = s.crew[Math.floor(Math.random() * s.crew.length)];
          target.hp = Math.max(1, target.hp - result.effects.crewDamage);
        }
        // Set screen effect
        if (result.effects.money > 2000 || result.effects.dirtyMoney > 3000) {
          s.screenEffect = 'gold-flash';
          s.lastRewardAmount = result.effects.money + result.effects.dirtyMoney;
        }
      } else {
        s.money += result.effects.money; // negative on fail
        // Heat 2.0: failed events add more personal heat
        Engine.splitHeat(s, result.effects.heat, 0.3);
        Engine.recomputeHeat(s);
        s.rep += result.effects.rep;
        if (result.effects.crewDamage > 0 && s.crew.length > 0) {
          const target = s.crew[Math.floor(Math.random() * s.crew.length)];
          target.hp = Math.max(1, target.hp - result.effects.crewDamage);
        }
        if (result.effects.crewDamage > 10) {
          s.screenEffect = 'blood-flash';
        }
      }
      s.streetEventResult = { success: result.success, text: result.text };
      return s;
    }

    case 'DISMISS_STREET_EVENT': {
      s.pendingStreetEvent = null;
      s.streetEventResult = null;
      return s;
    }

    case 'SET_SCREEN_EFFECT': {
      s.screenEffect = action.effect;
      return s;
    }

    case 'RESOLVE_ARC_EVENT': {
      if (!s.pendingArcEvent) return s;
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

    // ========== CREW LOYALTY EVENT ACTIONS ==========

    case 'RESOLVE_CREW_EVENT': {
      if (!s.pendingCrewEvent) return s;
      resolveCrewEvent(s, s.pendingCrewEvent, action.choiceId);
      s.pendingCrewEvent = null;
      return s;
    }

    case 'DISMISS_CREW_EVENT': {
      if (s.pendingCrewEvent) {
        const member = s.crew[s.pendingCrewEvent.crewIndex];
        if (member) {
          member.loyalty = Math.max(0, member.loyalty - 5);
        }
        if (!s.crewEventCooldowns) s.crewEventCooldowns = {};
        s.crewEventCooldowns[s.pendingCrewEvent.crewIndex] = s.day;
      }
      s.pendingCrewEvent = null;
      return s;
    }

    case 'RESOLVE_NPC_EVENT': {
      const npcEvt = (s as any).pendingNpcEvent;
      if (!npcEvt) return s;
      const npcResult = resolveNpcEvent(s, npcEvt, action.choiceId);
      if (npcResult.moneyChange > 0) {
        s.screenEffect = 'gold-flash';
        s.lastRewardAmount = npcResult.moneyChange;
      }
      (s as any).pendingNpcEvent = null;
      return s;
    }

    case 'DISMISS_NPC_EVENT': {
      (s as any).pendingNpcEvent = null;
      return s;
    }

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
      if (!s.ammoStock) s.ammoStock = { '9mm': s.ammo || 0, '7.62mm': 0, 'shells': 0 };
      const aType = action.ammoType;
      if ((s.ammoStock[aType] || 0) >= 99) return s;
      s.money -= pack.cost;
      s.stats.totalSpent += pack.cost;
      s.ammoStock[aType] = Math.min(99, (s.ammoStock[aType] || 0) + pack.amount);
      s.ammo = (s.ammoStock['9mm'] || 0) + (s.ammoStock['7.62mm'] || 0) + (s.ammoStock['shells'] || 0);
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
      let bribeCost = s.prison.daysRemaining * PRISON_BRIBE_COST_PER_DAY;
      // Lawyer discount
      const hasLawyer = s.corruptContacts?.some(c => {
        const def = CORRUPT_CONTACTS.find((cd: any) => cd.id === c.contactDefId);
        return def?.type === 'lawyer' && c.active && !c.compromised;
      });
      if (hasLawyer) bribeCost = Math.floor(bribeCost * (1 - 0.30));
      if (s.money < bribeCost) return s;
      s.money -= bribeCost;
      s.stats.totalSpent += bribeCost;
      s.prison = null;
      addPhoneMessage(s, 'anonymous', 'Vrijgekocht. Je heat is niet gereset — ze houden je in de gaten.', 'warning');
      return s;
    }

    case 'ATTEMPT_ESCAPE': {
      if (!s.prison || s.prison.escapeAttempted) return s;
      s.prison.escapeAttempted = true;
      let chance = PRISON_ESCAPE_BASE_CHANCE;
      chance += Engine.getPlayerStat(s, 'brains') * 0.03;
      if (s.crew.some(c => c.role === 'Hacker')) chance += 0.10;
      // Villa tunnel escape bonus
      if (s.villa?.modules.includes('tunnel')) chance += 0.25;
      if (Math.random() < chance) {
        // Success
        Engine.addPersonalHeat(s, PRISON_ESCAPE_HEAT_PENALTY);
        Engine.recomputeHeat(s);
        s.prison = null;
        s.screenEffect = 'gold-flash';
        addPhoneMessage(s, 'anonymous', s.villa?.modules.includes('tunnel')
          ? 'Je ontsnapte via de ondergrondse tunnel onder je villa. Slim. +15 heat.'
          : 'Ontsnapping geslaagd! Maar je bent nu een voortvluchtige. +15 heat.', 'warning');
      } else {
        // Fail
        s.prison.daysRemaining += PRISON_ESCAPE_FAIL_EXTRA_DAYS;
        s.prison.totalSentence += PRISON_ESCAPE_FAIL_EXTRA_DAYS;
        s.screenEffect = 'blood-flash';
        addPhoneMessage(s, 'NHPD', `Ontsnappingspoging mislukt! +${PRISON_ESCAPE_FAIL_EXTRA_DAYS} extra dagen straf.`, 'threat');
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

    // ========== VILLA ACTIONS ==========

    case 'BUY_VILLA': {
      if (s.villa) return s;
      if (s.money < VILLA_COST) return s;
      if (s.player.level < VILLA_REQ_LEVEL || s.rep < VILLA_REQ_REP) return s;
      s.money -= VILLA_COST;
      s.stats.totalSpent += VILLA_COST;
      s.villa = {
        level: 1,
        modules: [],
        prestigeModules: [],
        vaultMoney: 0,
        storedGoods: {},
        storedAmmo: 0,
        helipadUsedToday: false,
        purchaseDay: s.day,
        lastPartyDay: 0,
      };
      addPhoneMessage(s, 'Makelaar', '🏛️ Villa Noxhaven is nu van jou. Welkom thuis, baas.', 'info');
      Engine.checkAchievements(s);
      return s;
    }

    case 'UPGRADE_VILLA': {
      if (!s.villa || s.villa.level >= 3) return s;
      const nextLevel = s.villa.level + 1;
      const cost = VILLA_UPGRADE_COSTS[nextLevel];
      if (!cost || s.money < cost) return s;
      s.money -= cost;
      s.stats.totalSpent += cost;
      s.villa.level = nextLevel;
      return s;
    }

    case 'INSTALL_VILLA_MODULE': {
      if (!s.villa) return s;
      const modDef = VILLA_MODULES.find(m => m.id === action.moduleId);
      if (!modDef) return s;
      if (s.villa.modules.includes(action.moduleId)) return s;
      if (s.villa.level < modDef.reqLevel) return s;
      if (s.money < modDef.cost) return s;
      s.money -= modDef.cost;
      s.stats.totalSpent += modDef.cost;
      s.villa.modules.push(action.moduleId);
      s.maxInv = Engine.recalcMaxInv(s);
      Engine.checkAchievements(s);
      return s;
    }

    case 'PRESTIGE_VILLA_MODULE': {
      if (!s.villa) return s;
      if (s.villa.level < 3) return s; // prestige requires villa level 3
      if (!s.villa.modules.includes(action.moduleId)) return s; // must be installed
      if (!s.villa.prestigeModules) s.villa.prestigeModules = [];
      if (s.villa.prestigeModules.includes(action.moduleId)) return s;
      const PRESTIGE_COSTS: Record<string, number> = {
        kluis: 50000, opslagkelder: 40000, wietplantage: 60000, coke_lab: 100000,
        synthetica_lab: 30000, crew_kwartieren: 40000, wapenkamer: 30000, commandocentrum: 80000,
        camera: 90000, server_room: 50000, zwembad: 70000, helipad: 120000, tunnel: 100000, garage_uitbreiding: 30000,
      };
      const cost = PRESTIGE_COSTS[action.moduleId] || 50000;
      if (s.money < cost) return s;
      s.money -= cost;
      s.stats.totalSpent += cost;
      s.villa.prestigeModules.push(action.moduleId);
      s.maxInv = Engine.recalcMaxInv(s);
      return s;
    }

    case 'DEPOSIT_VILLA_MONEY': {
      if (!s.villa || !s.villa.modules.includes('kluis')) return s;
      const hasPrestigeKluis = s.villa.prestigeModules?.includes('kluis') || false;
      const max = getVaultMax(s.villa.level, hasPrestigeKluis);
      const space = max - s.villa.vaultMoney;
      const amt = Math.min(action.amount, s.money, space);
      if (amt <= 0) return s;
      s.money -= amt;
      s.villa.vaultMoney += amt;
      return s;
    }

    case 'WITHDRAW_VILLA_MONEY': {
      if (!s.villa) return s;
      const wAmt = Math.min(action.amount, s.villa.vaultMoney);
      if (wAmt <= 0) return s;
      s.villa.vaultMoney -= wAmt;
      s.money += wAmt;
      return s;
    }

    case 'DEPOSIT_VILLA_GOODS': {
      if (!s.villa || !s.villa.modules.includes('opslagkelder')) return s;
      const hasPrestigeOpslag = s.villa.prestigeModules?.includes('opslagkelder') || false;
      const maxStorage = getStorageMax(s.villa.level, hasPrestigeOpslag);
      const currentStored = Object.values(s.villa.storedGoods).reduce((a, b) => a + (b || 0), 0);
      const storageSpace = maxStorage - currentStored;
      const playerHas = s.inventory[action.goodId] || 0;
      const dAmt = Math.min(action.amount, playerHas, storageSpace);
      if (dAmt <= 0) return s;
      s.inventory[action.goodId] = playerHas - dAmt;
      s.villa.storedGoods[action.goodId] = (s.villa.storedGoods[action.goodId] || 0) + dAmt;
      return s;
    }

    case 'WITHDRAW_VILLA_GOODS': {
      if (!s.villa) return s;
      const stored = s.villa.storedGoods[action.goodId] || 0;
      const currentInvCount = Object.values(s.inventory).reduce((a, b) => a + (b || 0), 0);
      const invSpace = s.maxInv - currentInvCount;
      const wgAmt = Math.min(action.amount, stored, invSpace);
      if (wgAmt <= 0) return s;
      s.villa.storedGoods[action.goodId] = stored - wgAmt;
      s.inventory[action.goodId] = (s.inventory[action.goodId] || 0) + wgAmt;
      return s;
    }

    case 'DEPOSIT_VILLA_AMMO': {
      if (!s.villa || !s.villa.modules.includes('wapenkamer')) return s;
      const aAmt = Math.min(action.amount, s.ammo || 0);
      if (aAmt <= 0) return s;
      s.ammo -= aAmt;
      s.villa.storedAmmo += aAmt;
      return s;
    }

    case 'WITHDRAW_VILLA_AMMO': {
      if (!s.villa) return s;
      const waAmt = Math.min(action.amount, s.villa.storedAmmo);
      if (waAmt <= 0) return s;
      s.villa.storedAmmo -= waAmt;
      s.ammo = (s.ammo || 0) + waAmt;
      return s;
    }

    case 'VILLA_HELIPAD_TRAVEL': {
      if (!s.villa || !s.villa.modules.includes('helipad') || s.villa.helipadUsedToday) return s;
      if ((s.hidingDays || 0) > 0 || s.prison) return s;
      s.villa.helipadUsedToday = true;
      s.loc = action.to;
      return s;
    }

    case 'VILLA_THROW_PARTY': {
      if (!s.villa || !s.villa.modules.includes('zwembad')) return s;
      const partyCost = [0, 15000, 25000, 40000][s.villa.level] || 15000;
      const cooldownDays = 5;
      if (s.money < partyCost) return s;
      if (s.day - (s.villa.lastPartyDay || 0) < cooldownDays) return s;

      s.money -= partyCost;
      s.stats.totalSpent += partyCost;
      s.villa.lastPartyDay = s.day;

      // Boost all faction relations (+8/+12/+18 based on villa level)
      const relBoost = [0, 8, 12, 18][s.villa.level] || 8;
      const factions = ['cartel', 'syndicate', 'bikers'] as const;
      factions.forEach(fid => {
        s.familyRel[fid] = Math.min(100, (s.familyRel[fid] || 0) + relBoost);
      });

      // Rep boost (+15/+25/+40)
      const repBoost = [0, 15, 25, 40][s.villa.level] || 15;
      s.rep += repBoost;

      // Karma shift: parties are neutral-to-positive
      s.karma = Math.min(100, (s.karma || 0) + 3);

      // Crew morale: heal all crew slightly
      s.crew.forEach(c => {
        if (c.hp > 0 && c.hp < 100) c.hp = Math.min(100, c.hp + 10);
      });

      addPhoneMessage(s, 'anonymous', `Legendarisch feest bij Villa Noxhaven! Iedereen praat erover. +${relBoost} factie-relaties, +${repBoost} rep.`, 'info');
      return s;
    }

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

    case 'RESET': {
      const fresh = createInitialState();
      Engine.generatePrices(fresh);
      Engine.generateContracts(fresh);
      fresh.dailyNews = generateDailyNews(fresh);
      return fresh;
    }

    case 'ADD_MARKET_ALERT': {
      const alert = action.alert as import('@/game/types').MarketAlert;
      return { ...s, marketAlerts: [...s.marketAlerts, alert] };
    }

    case 'REMOVE_MARKET_ALERT': {
      return { ...s, marketAlerts: s.marketAlerts.filter(a => a.id !== action.id) };
    }

    case 'CLEAR_TRIGGERED_ALERTS': {
      return { ...s, triggeredAlerts: [] };
    }

    case 'TOGGLE_SMART_ALARM': {
      return { ...s, smartAlarmEnabled: !s.smartAlarmEnabled };
    }

    case 'SET_SMART_ALARM_THRESHOLD': {
      return { ...s, smartAlarmThreshold: action.threshold };
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

    default:
      return s;
  }
}

export function GameProvider({ children, onExitToMenu }: { children: React.ReactNode; onExitToMenu?: () => void }) {
  const [state, rawDispatch] = useReducer(gameReducer, null, () => {
    const saved = Engine.loadGame();
    if (saved) {
      // Ensure new fields exist
      if (!saved.achievements) saved.achievements = [];
      if (saved.tutorialDone === undefined) saved.tutorialDone = false;
      if (!saved.lastLoginDay) saved.lastLoginDay = '';
      if (saved.loginStreak === undefined) saved.loginStreak = 0;
      if (!saved.stats) saved.stats = { totalEarned: 0, totalSpent: 0, casinoWon: 0, casinoLost: 0, missionsCompleted: 0, missionsFailed: 0, tradesCompleted: 0, daysPlayed: saved.day || 0, blackjackStreak: 0, highLowMaxRound: 0 };
      if (saved.stats.blackjackStreak === undefined) saved.stats.blackjackStreak = 0;
      if (saved.stats.highLowMaxRound === undefined) saved.stats.highLowMaxRound = 0;
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
      if (saved.villa === undefined) saved.villa = null;
      if (saved.villa) {
        if (saved.villa.storedAmmo === undefined) saved.villa.storedAmmo = 0;
        if (saved.villa.helipadUsedToday === undefined) saved.villa.helipadUsedToday = false;
        if (!saved.villa.storedGoods) saved.villa.storedGoods = {};
        if (saved.villa.lastPartyDay === undefined) saved.villa.lastPartyDay = 0;
        if (!saved.villa.prestigeModules) saved.villa.prestigeModules = [];
      }
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
      return saved;
    }
    const fresh = createInitialState();
    Engine.generatePrices(fresh);
    Engine.generateContracts(fresh);
    fresh.dailyNews = generateDailyNews(fresh);
    return fresh;
  });

  const [view, setView] = React.useState<GameView>('city');
  const [tradeMode, setTradeMode] = React.useState<TradeMode>('buy');
  const [selectedDistrict, setSelectedDistrict] = React.useState<DistrictId | null>(state.loc);
  const [toast, setToast] = React.useState<string | null>(null);
  const [toastError, setToastError] = React.useState(false);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevAchievementsRef = useRef<string[]>(state.achievements);
  const prevPhaseRef = useRef(state.endgamePhase);

  const showToast = useCallback((msg: string, isError = false) => {
    setToast(msg);
    setToastError(isError);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const dispatch = useCallback((action: GameAction) => {
    rawDispatch(action);
  }, []);

  // Auto-save on state change (debounced) + check for new achievements + phase-up
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Debounced save — 2 seconds
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => Engine.saveGame(state), 2000);

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

  // Generate prices if empty
  useEffect(() => {
    if (!state.prices || Object.keys(state.prices).length === 0) {
      const s = { ...state };
      Engine.generatePrices(s);
      Engine.generateContracts(s);
      rawDispatch({ type: 'SET_STATE', state: s });
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
