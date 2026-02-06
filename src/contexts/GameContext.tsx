import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { GameState, GameView, TradeMode, GoodId, DistrictId, StatId, FamilyId, FactionActionType } from '../game/types';
import { createInitialState, DISTRICTS, VEHICLES, GEAR, BUSINESSES, HQ_UPGRADES, ACHIEVEMENTS } from '../game/constants';
import * as Engine from '../game/engine';

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
  | { type: 'COMBAT_ACTION'; action: 'attack' | 'heavy' | 'defend' | 'environment' }
  | { type: 'END_COMBAT' }
  | { type: 'FACTION_ACTION'; familyId: FamilyId; actionType: FactionActionType }
  | { type: 'CONQUER_FACTION'; familyId: FamilyId }
  | { type: 'ANNEX_FACTION'; familyId: FamilyId }
  | { type: 'RESET' };

const GameContext = createContext<GameContextType | undefined>(undefined);

function gameReducer(state: GameState, action: GameAction): GameState {
  const s = JSON.parse(JSON.stringify(state)) as GameState;

  switch (action.type) {
    case 'SET_STATE':
      return action.state;

    case 'TRADE': {
      Engine.performTrade(s, action.gid, action.mode, action.quantity || 1);
      return s;
    }

    case 'TRAVEL': {
      const hasChauffeur = s.crew.some(c => c.role === 'Chauffeur');
      const isOwned = s.ownedDistricts.includes(action.to);
      const cost = (hasChauffeur || isOwned) ? 0 : 50;
      if (s.money < cost) return s;
      s.money -= cost;
      if (cost > 0) s.stats.totalSpent += cost;
      let travelHeat = 2;
      const activeV = VEHICLES.find(v => v.id === s.activeVehicle);
      if (activeV && activeV.speed >= 4) travelHeat = Math.floor(travelHeat * 0.5);
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
      // Check achievements after end turn
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
    // Check for newly added achievements (compare with previous)
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
