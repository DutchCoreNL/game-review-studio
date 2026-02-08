import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { GameState, GameView, TradeMode, GoodId, DistrictId, StatId, FamilyId, FactionActionType, ActiveMission, SmuggleRoute, ScreenEffectType, OwnedVehicle, VehicleUpgradeType, ChopShopUpgradeId, SafehouseUpgradeId } from '../game/types';
import { createInitialState, DISTRICTS, VEHICLES, GEAR, BUSINESSES, HQ_UPGRADES, ACHIEVEMENTS, NEMESIS_NAMES, REKAT_COSTS, VEHICLE_UPGRADES, STEALABLE_CARS, CHOP_SHOP_UPGRADES, OMKAT_COST, CAR_ORDER_CLIENTS, SAFEHOUSE_COSTS, SAFEHOUSE_UPGRADE_COSTS, SAFEHOUSE_UPGRADES, CORRUPT_CONTACTS } from '../game/constants';
import * as Engine from '../game/engine';
import * as MissionEngine from '../game/missions';
import { startNemesisCombat, addPhoneMessage } from '../game/newFeatures';
import { calculateEndgamePhase, buildVictoryData, startFinalBoss, createBossPhase, canTriggerFinalBoss, createNewGamePlus, getPhaseUpMessage, getDeckDialogue, getEndgameEvent } from '../game/endgame';
import { rollStreetEvent, resolveStreetChoice } from '../game/storyEvents';
import { checkArcTriggers, checkArcProgression, resolveArcChoice } from '../game/storyArcs';
import { generateDailyChallenges, updateChallengeProgress, getChallengeTemplate } from '../game/dailyChallenges';
import { rollNpcEncounter, applyNpcBonuses } from '../game/npcs';
import { applyBackstory } from '../game/backstory';
import { generateArcFlashback } from '../game/flashbacks';

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
  | { type: 'COMBAT_ACTION'; action: 'attack' | 'heavy' | 'defend' | 'environment' }
  | { type: 'END_COMBAT' }
  | { type: 'FACTION_ACTION'; familyId: FamilyId; actionType: FactionActionType }
  | { type: 'CONQUER_FACTION'; familyId: FamilyId }
  | { type: 'ANNEX_FACTION'; familyId: FamilyId }
  | { type: 'START_MISSION'; mission: ActiveMission }
  | { type: 'MISSION_CHOICE'; choiceId: string }
  | { type: 'END_MISSION' }
  // New feature actions
  | { type: 'CREATE_ROUTE'; route: SmuggleRoute }
  | { type: 'DELETE_ROUTE'; routeId: string }
  | { type: 'STATION_CREW'; districtId: DistrictId; crewIndex: number }
  | { type: 'UNSTATION_CREW'; districtId: DistrictId; crewIndex: number }
  | { type: 'UPGRADE_DEFENSE'; districtId: DistrictId; upgradeType: 'wall' | 'turret' }
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
  | { type: 'RESOLVE_STREET_EVENT'; choiceId: string }
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
    case 'SET_STATE':
      return action.state;

    case 'TRADE': {
      if ((s.hidingDays || 0) > 0) return s; // Can't trade while hiding
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
      if ((s.hidingDays || 0) > 0) return s; // Can't travel while hiding
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
        if (!(s as any).seenEndgameEvents) (s as any).seenEndgameEvents = [];
        const egEvent = getEndgameEvent(s);
        if (egEvent) {
          (s as any).seenEndgameEvents.push(egEvent.id);
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

      // Story arcs: check triggers and progression
      checkArcTriggers(s);
      if (!s.pendingStreetEvent) {
        checkArcProgression(s);
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
        s.dailyProgress = { trades: 0, earned: 0, washed: 0, solo_ops: 0, contracts: 0, travels: 0, bribes: 0, faction_actions: 0, recruits: 0, cars_stolen: 0, casino_won: 0 };
      }
      // Check low_heat challenge at end of turn
      syncChallenges(s);
      // NPC encounters
      if (!s.pendingStreetEvent && !s.pendingArcEvent) {
        const npcEnc = rollNpcEncounter(s);
        if (npcEnc) {
          addPhoneMessage(s, npcEnc.npcId, npcEnc.message, 'info');
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
      return s;
    }

    case 'DISMISS_NIGHT_REPORT': {
      s.nightReport = null;
      return s;
    }

    case 'RECRUIT': {
      Engine.recruit(s);
      if (s.dailyProgress) { s.dailyProgress.recruits++; }
      syncChallenges(s);
      return s;
    }

    case 'HEAL_CREW': {
      Engine.healCrew(s, action.crewIndex);
      return s;
    }

    case 'FIRE_CREW': {
      // Remove from any stationed positions
      Object.values(s.districtDefenses).forEach(def => {
        def.stationedCrew = def.stationedCrew.filter(ci => ci !== action.crewIndex);
        // Adjust indices for crew after the fired one
        def.stationedCrew = def.stationedCrew.map(ci => ci > action.crewIndex ? ci - 1 : ci);
      });
      Engine.fireCrew(s, action.crewIndex);
      return s;
    }

    case 'UPGRADE_STAT': {
      if (s.player.skillPoints <= 0) return s;
      s.player.stats[action.stat]++;
      s.player.skillPoints--;
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
      const upg = HQ_UPGRADES.find(u => u.id === action.id);
      if (!upg || s.hqUpgrades.includes(action.id) || s.money < upg.cost) return s;
      s.money -= upg.cost;
      s.stats.totalSpent += upg.cost;
      s.hqUpgrades.push(action.id);
      s.maxInv = Engine.recalcMaxInv(s);
      return s;
    }

    case 'BUY_BUSINESS': {
      const biz = BUSINESSES.find(b => b.id === action.id);
      if (!biz || s.ownedBusinesses.includes(action.id) || s.money < biz.cost) return s;
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
      if ((s.hidingDays || 0) > 0) return s;
      Engine.performSoloOp(s, action.opId);
      Engine.recomputeHeat(s);
      s.districtRep[s.loc] = Math.min(100, (s.districtRep[s.loc] || 0) + 5);
      Engine.checkAchievements(s);
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
        (s as any)._finalBossWon = true;
      }
      // Update endgame phase after combat
      s.endgamePhase = calculateEndgamePhase(s);
      return s;
    }

    case 'END_COMBAT': {
      const wasFinalBoss = (s as any)._finalBossWon;
      delete (s as any)._finalBossWon;
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
        s.victoryData = buildVictoryData(s);
        addPhoneMessage(s, 'anonymous', 'Commissaris Decker is verslagen. Noxhaven is van jou. De stad knielt.', 'opportunity');
      }
      return s;
    }

    case 'FACTION_ACTION': {
      const result = Engine.performFactionAction(s, action.familyId, action.actionType);
      (s as any)._lastFactionResult = result;
      Engine.checkAchievements(s);
      if (s.dailyProgress) { s.dailyProgress.faction_actions++; }
      syncChallenges(s);
      return s;
    }

    case 'CONQUER_FACTION': {
      Engine.conquerFaction(s, action.familyId);
      Engine.checkAchievements(s);
      return s;
    }

    case 'ANNEX_FACTION': {
      Engine.annexFaction(s, action.familyId);
      Engine.checkAchievements(s);
      return s;
    }

    case 'START_MISSION': {
      s.activeMission = action.mission;
      return s;
    }

    case 'MISSION_CHOICE': {
      if (!s.activeMission) return s;
      const mission = s.activeMission;
      const result = MissionEngine.resolveMissionChoice(s, mission, action.choiceId);

      const encounter = mission.encounters[mission.currentEncounter];
      const choice = encounter?.choices.find(c => c.id === action.choiceId);
      const prefix = result.result === 'success' ? '✓' : result.result === 'partial' ? '△' : '✗';
      mission.log.push(`${prefix} ${choice?.label || ''}: ${result.outcomeText}`);

      if (result.result === 'success') {
        mission.totalReward += result.effects.bonusReward;
        mission.totalHeat += Math.max(0, result.effects.heat);
        mission.totalCrewDamage += result.effects.crewDamage;
      } else if (result.result === 'partial') {
        mission.totalReward += Math.floor(result.effects.bonusReward * 0.5);
        mission.totalHeat += Math.max(0, result.effects.heat + 2);
        mission.totalCrewDamage += Math.floor(result.effects.crewDamage * 0.5);
      } else {
        mission.totalHeat += Math.max(0, result.effects.heat + 5);
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

    case 'STATION_CREW': {
      const def = s.districtDefenses[action.districtId];
      if (!def || def.stationedCrew.includes(action.crewIndex)) return s;
      if (!s.ownedDistricts.includes(action.districtId)) return s;
      def.stationedCrew.push(action.crewIndex);
      def.level = Math.min(100, def.level + 20);
      return s;
    }

    case 'UNSTATION_CREW': {
      const defU = s.districtDefenses[action.districtId];
      if (!defU) return s;
      defU.stationedCrew = defU.stationedCrew.filter(ci => ci !== action.crewIndex);
      defU.level = Math.max(0, defU.level - 20);
      return s;
    }

    case 'UPGRADE_DEFENSE': {
      const defD = s.districtDefenses[action.districtId];
      if (!defD || !s.ownedDistricts.includes(action.districtId)) return s;
      const cost = action.upgradeType === 'wall' ? 8000 : 12000;
      if (s.money < cost) return s;
      if (action.upgradeType === 'wall' && defD.wallUpgrade) return s;
      if (action.upgradeType === 'turret' && defD.turretUpgrade) return s;
      s.money -= cost;
      s.stats.totalSpent += cost;
      if (action.upgradeType === 'wall') { defD.wallUpgrade = true; defD.level += 30; }
      else { defD.turretUpgrade = true; defD.level += 20; }
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
      const result = resolveStreetChoice(s, s.pendingStreetEvent, action.choiceId);
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
        // Track key decision (also on failure, with fail marker)
        if (!s.keyDecisions) s.keyDecisions = [];
        s.keyDecisions.push(`arc_${action.arcId}_${action.choiceId}`);
        s.keyDecisions.push(`arc_${action.arcId}_fail_${action.choiceId}`);
      } else {
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
        (s as any)._completedArcFlashbackId = action.arcId;
      }

      return s;
    }

    case 'DISMISS_ARC_EVENT': {
      // Generate consequence flashback if an arc just completed
      const flashbackArcId = (s as any)._completedArcFlashbackId;
      if (flashbackArcId) {
        const flashback = generateArcFlashback(s, flashbackArcId);
        if (flashback) {
          s.pendingFlashback = flashback;
        }
        delete (s as any)._completedArcFlashbackId;
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
        const newCar = {
          id: `stolen_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          carTypeId: carDef.id,
          condition,
          omgekat: false,
          upgrades: [] as string[],
          stolenDay: s.day,
          stolenFrom: s.pendingCarTheft!.district,
          baseValue: carDef.baseValue,
        };
        s.stolenCars.push(newCar as any);
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
      if (!upg || car.upgrades.includes(action.upgradeId as any) || s.money < upg.cost) return s;
      s.money -= upg.cost;
      s.stats.totalSpent += upg.cost;
      car.upgrades.push(action.upgradeId as any);
      return s;
    }

    case 'SELL_STOLEN_CAR': {
      const car = s.stolenCars.find(c => c.id === action.carId);
      if (!car || !car.omgekat) return s;

      // Calculate value
      let value = car.baseValue * (car.condition / 100);
      car.upgrades.forEach((uid: any) => {
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

    case 'RESET': {
      const fresh = createInitialState();
      Engine.generatePrices(fresh);
      Engine.generateContracts(fresh);
      return fresh;
    }

    default:
      return s;
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
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
        };
      }
      if (!saved.districtDefenses) {
        saved.districtDefenses = {
          port: { level: 0, stationedCrew: [], wallUpgrade: false, turretUpgrade: false },
          crown: { level: 0, stationedCrew: [], wallUpgrade: false, turretUpgrade: false },
          iron: { level: 0, stationedCrew: [], wallUpgrade: false, turretUpgrade: false },
          low: { level: 0, stationedCrew: [], wallUpgrade: false, turretUpgrade: false },
          neon: { level: 0, stationedCrew: [], wallUpgrade: false, turretUpgrade: false },
        };
      }
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
      if (!saved.dailyProgress) saved.dailyProgress = { trades: 0, earned: 0, washed: 0, solo_ops: 0, contracts: 0, travels: 0, bribes: 0, faction_actions: 0, recruits: 0, cars_stolen: 0, casino_won: 0 };
      // Ensure crew have specialization field
      saved.crew?.forEach((c: any) => { if (c.specialization === undefined) c.specialization = null; });
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

  // Auto-save on state change + check for new achievements + phase-up
  useEffect(() => {
    Engine.saveGame(state);
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
