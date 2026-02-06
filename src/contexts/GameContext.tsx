import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { GameState, GameView, TradeMode, GoodId, DistrictId, StatId, FamilyId, FactionActionType, ActiveMission, SmuggleRoute } from '../game/types';
import { createInitialState, DISTRICTS, VEHICLES, GEAR, BUSINESSES, HQ_UPGRADES, ACHIEVEMENTS, NEMESIS_NAMES } from '../game/constants';
import * as Engine from '../game/engine';
import * as MissionEngine from '../game/missions';
import { startNemesisCombat, addPhoneMessage } from '../game/newFeatures';

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
  | { type: 'RESET' };

const GameContext = createContext<GameContextType | undefined>(undefined);

function gameReducer(state: GameState, action: GameAction): GameState {
  const s = JSON.parse(JSON.stringify(state)) as GameState;

  switch (action.type) {
    case 'SET_STATE':
      return action.state;

    case 'TRADE': {
      Engine.performTrade(s, action.gid, action.mode, action.quantity || 1);
      // District rep gain for trading
      s.districtRep[s.loc] = Math.min(100, (s.districtRep[s.loc] || 0) + 1);
      return s;
    }

    case 'TRAVEL': {
      const hasChauffeur = s.crew.some(c => c.role === 'Chauffeur');
      const hasRacer = s.crew.some(c => c.specialization === 'racer');
      const isOwned = s.ownedDistricts.includes(action.to);
      const isStorm = s.weather === 'storm';
      const cost = (hasChauffeur || hasRacer || isOwned || isStorm) ? 0 : 50;
      if (s.money < cost) return s;
      s.money -= cost;
      if (cost > 0) s.stats.totalSpent += cost;
      let travelHeat = 2;
      const activeV = VEHICLES.find(v => v.id === s.activeVehicle);
      if (activeV && activeV.speed >= 4) travelHeat = Math.floor(travelHeat * 0.5);
      // Phantom spec reduces heat
      if (s.crew.some(c => c.specialization === 'phantom')) travelHeat = Math.max(0, travelHeat - 1);
      s.heat += travelHeat;
      s.loc = action.to;
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
      return s;
    }

    case 'DISMISS_NIGHT_REPORT': {
      s.nightReport = null;
      return s;
    }

    case 'RECRUIT': {
      Engine.recruit(s);
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
      s.ownedVehicles.push({ id: action.id, condition: 100 });
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
      const cost = Math.max(1000, 3500 - (charm * 150));
      if (s.money < cost) return s;
      s.money -= cost;
      s.stats.totalSpent += cost;
      s.policeRel = Math.min(100, s.policeRel + 20);
      s.heat = Math.max(0, s.heat - 15);
      return s;
    }

    case 'WASH_MONEY': {
      if (s.dirtyMoney <= 0) return s;
      const amount = Math.min(s.dirtyMoney, 3000 + (s.ownedDistricts.length * 1000));
      s.dirtyMoney -= amount;
      let washed = amount;
      if (s.ownedDistricts.includes('neon')) washed = Math.floor(amount * 1.15);
      const clean = Math.floor(washed * 0.85);
      s.money += clean;
      s.stats.totalEarned += clean;
      s.heat += 8;
      Engine.gainXp(s, 5);
      return s;
    }

    case 'WASH_MONEY_AMOUNT': {
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
      s.heat += Math.max(1, Math.floor(washAmt / 500));
      Engine.gainXp(s, Math.max(1, Math.floor(washAmt / 200)));
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
      Engine.performSoloOp(s, action.opId);
      s.districtRep[s.loc] = Math.min(100, (s.districtRep[s.loc] || 0) + 5);
      Engine.checkAchievements(s);
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
      Engine.combatAction(s, action.action);
      Engine.checkAchievements(s);
      return s;
    }

    case 'END_COMBAT': {
      s.activeCombat = null;
      return s;
    }

    case 'FACTION_ACTION': {
      const result = Engine.performFactionAction(s, action.familyId, action.actionType);
      (s as any)._lastFactionResult = result;
      Engine.checkAchievements(s);
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

    case 'RESET':
      return createInitialState();

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
      if (!saved.stats) saved.stats = { totalEarned: 0, totalSpent: 0, casinoWon: 0, casinoLost: 0, missionsCompleted: 0, missionsFailed: 0, tradesCompleted: 0, daysPlayed: saved.day || 0 };
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

  const showToast = useCallback((msg: string, isError = false) => {
    setToast(msg);
    setToastError(isError);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const dispatch = useCallback((action: GameAction) => {
    rawDispatch(action);
  }, []);

  // Auto-save on state change + check for new achievements
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
