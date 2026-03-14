import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { invokeGameAction } from '@/lib/gameApi';
import type { GameState } from '@/game/types';

/** Server action types that should be routed to the edge function */
const SERVER_ACTIONS = new Set([
  'TRADE', 'TRAVEL', 'SOLO_OP', 'BUY_GEAR', 'EQUIP', 'UNEQUIP',
  'BUY_VEHICLE', 'SET_VEHICLE', 'WASH_MONEY', 'WASH_MONEY_AMOUNT',
  'BRIBE_POLICE', 'BUY_BUSINESS',
]);

/** Actions that modify economy — need full economic merge from server */
const ECONOMY_ACTIONS = new Set([
  'TRADE', 'BUY_GEAR', 'BUY_VEHICLE', 'WASH_MONEY', 'WASH_MONEY_AMOUNT',
  'BRIBE_POLICE', 'BUY_BUSINESS', 'SOLO_OP',
]);

/** Maps client dispatch action types to server action names + payload extractors */
const ACTION_MAP: Record<string, { action: string; payload: (a: any) => any }> = {
  TRADE: { action: 'trade', payload: (a) => ({ goodId: a.gid, mode: a.mode, quantity: a.quantity || 1 }) },
  TRAVEL: { action: 'travel', payload: (a) => ({ district: a.to }) },
  SOLO_OP: { action: 'solo_op', payload: (a) => ({ opId: a.opId }) },
  BUY_GEAR: { action: 'buy_gear', payload: (a) => ({ gearId: a.id }) },
  EQUIP: { action: 'equip_gear', payload: (a) => ({ gearId: a.id }) },
  UNEQUIP: { action: 'unequip_gear', payload: (a) => ({ slot: a.slot }) },
  BUY_VEHICLE: { action: 'buy_vehicle', payload: (a) => ({ vehicleId: a.id }) },
  SET_VEHICLE: { action: 'switch_vehicle', payload: (a) => ({ vehicleId: a.id }) },
  WASH_MONEY: { action: 'wash_money', payload: () => ({ amount: 5000 }) },
  WASH_MONEY_AMOUNT: { action: 'wash_money', payload: (a) => ({ amount: a.amount }) },
  BRIBE_POLICE: { action: 'bribe_police', payload: () => ({}) },
  BUY_BUSINESS: { action: 'buy_business', payload: (a) => ({ businessId: a.id }) },
};

export interface ServerSyncState {
  loading: boolean;
  syncing: boolean;
  lastSync: Date | null;
  lastCloudSave: Date | null;
  cloudSaveVersion: number;
  error: string | null;
}

const CLOUD_SAVE_INTERVAL = 2 * 60 * 1000; // 2 minutes

export function useServerSync(
  localDispatch: (action: any) => void,
  showToast: (msg: string, isError?: boolean) => void,
) {
  const { user } = useAuth();
  const [syncState, setSyncState] = useState<ServerSyncState>({
    loading: false, syncing: false, lastSync: null, lastCloudSave: null, cloudSaveVersion: 0, error: null,
  });
  const initialSyncDone = useRef(false);
  const cloudSaveLoadedRef = useRef(false);
  const cloudSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const stateDirtyRef = useRef(false);

  // Keep a ref to the latest state — called on EVERY state change (not debounced)
  const updateStateRef = useCallback((state: GameState) => {
    stateRef.current = state;
    stateDirtyRef.current = true;
  }, []);

  // Fetch server state on mount (if logged in)
  const fetchServerState = useCallback(async () => {
    if (!user) return;
    setSyncState(s => ({ ...s, loading: true, error: null }));
    try {
      const result = await invokeGameAction('get_state');
      if (result.success && result.data) {
        mergeServerState(localDispatch, result.data, cloudSaveLoadedRef.current);
        setSyncState(s => ({ ...s, loading: false, lastSync: new Date() }));
      } else if (!result.success && result.message?.includes('Geen spelerstaat')) {
        const initResult = await invokeGameAction('init_player');
        if (initResult.success && initResult.data) {
          mergeServerState(localDispatch, initResult.data, cloudSaveLoadedRef.current);
        }
        setSyncState(s => ({ ...s, loading: false, lastSync: new Date() }));
      } else {
        setSyncState(s => ({ ...s, loading: false, error: result.message }));
      }
    } catch (e: any) {
      setSyncState(s => ({ ...s, loading: false, error: e.message }));
    }
  }, [user, localDispatch]);

  // ========== CLOUD SAVE ==========
  const saveToCloud = useCallback(async () => {
    if (!user || !stateRef.current) return;
    const state = stateRef.current;
    if (state.gameOver) return;
    
    setSyncState(s => ({ ...s, syncing: true }));
    try {
      const result = await invokeGameAction('save_state', { saveData: state, day: state.day });
      if (result.success) {
        stateDirtyRef.current = false;
        setSyncState(s => ({
          ...s, syncing: false, lastCloudSave: new Date(),
          cloudSaveVersion: result.data?.saveVersion || s.cloudSaveVersion + 1,
        }));
      } else {
        setSyncState(s => ({ ...s, syncing: false }));
      }
    } catch {
      setSyncState(s => ({ ...s, syncing: false }));
    }
  }, [user]);

  // ========== CLOUD LOAD (with conflict resolution: newest wins) ==========
  const loadFromCloud = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setSyncState(s => ({ ...s, loading: true }));
    try {
      const result = await invokeGameAction('load_state');
      if (result.success && result.data?.saveData) {
        const cloudState = result.data.saveData as GameState;
        const cloudDay = result.data.day || cloudState.day || 0;
        const cloudTime = result.data.lastSaveAt ? new Date(result.data.lastSaveAt).getTime() : 0;
        
        const localState = stateRef.current;
        const localDay = localState?.day || 0;
        const localSaveTime = localStorage.getItem('noxhaven_last_save_time');
        const localTime = localSaveTime ? parseInt(localSaveTime) : 0;

        const cloudIsNewer = cloudDay > localDay || (cloudDay === localDay && cloudTime > localTime);
        
        if (cloudIsNewer) {
          localDispatch({ type: 'SET_STATE', state: cloudState });
          cloudSaveLoadedRef.current = true;
          showToast('☁️ Cloud save geladen — welkom terug!');
          setSyncState(s => ({
            ...s, loading: false, lastCloudSave: new Date(cloudTime),
            cloudSaveVersion: result.data?.saveVersion || 0,
          }));
          return true;
        } else {
          setSyncState(s => ({ ...s, loading: false }));
          setTimeout(saveToCloud, 1000);
          return false;
        }
      }
      setSyncState(s => ({ ...s, loading: false }));
      return false;
    } catch {
      setSyncState(s => ({ ...s, loading: false }));
      return false;
    }
  }, [user, localDispatch, showToast, saveToCloud]);

  // Initial sync
  useEffect(() => {
    if (user && !initialSyncDone.current) {
      initialSyncDone.current = true;
      loadFromCloud().then(() => fetchServerState());
    }
  }, [user, loadFromCloud, fetchServerState]);

  // Auto-save to cloud every 2 minutes
  useEffect(() => {
    if (!user) {
      if (cloudSaveTimerRef.current) clearInterval(cloudSaveTimerRef.current);
      return;
    }
    cloudSaveTimerRef.current = setInterval(saveToCloud, CLOUD_SAVE_INTERVAL);
    return () => {
      if (cloudSaveTimerRef.current) clearInterval(cloudSaveTimerRef.current);
    };
  }, [user, saveToCloud]);

  // Server-aware dispatch: intercepts server actions
  const serverDispatch = useCallback(async (action: any) => {
    if (!user || !SERVER_ACTIONS.has(action.type)) {
      localDispatch(action);
      return;
    }

    const mapping = ACTION_MAP[action.type];
    if (!mapping) {
      localDispatch(action);
      return;
    }

    // Optimistic update: apply action locally FIRST so UI updates immediately
    localDispatch(action);

    setSyncState(s => ({ ...s, syncing: true }));
    try {
      const result = await invokeGameAction(mapping.action as any, mapping.payload(action));
      if (result.success) {
        if (result.message) showToast(result.message);
        // Fetch full state and merge — use full economic merge for economy actions
        const isEconAction = ECONOMY_ACTIONS.has(action.type);
        const stateResult = await invokeGameAction('get_state');
        if (stateResult.success && stateResult.data) {
          mergeServerState(localDispatch, stateResult.data, !isEconAction);
        }
        // Trigger immediate cloud save after economy actions to keep save_data in sync
        if (isEconAction) {
          setTimeout(saveToCloud, 500);
        }
      } else {
        showToast(result.message, true);
        // Server rejected — full revert: merge everything including economy
        const stateResult = await invokeGameAction('get_state');
        if (stateResult.success && stateResult.data) {
          mergeServerState(localDispatch, stateResult.data, false);
        }
      }
    } catch (e: any) {
      showToast('Verbindingsfout met server.', true);
    }
    setSyncState(s => ({ ...s, syncing: false, lastSync: new Date() }));
  }, [user, localDispatch, showToast, saveToCloud]);

  return { serverDispatch, syncState, fetchServerState, saveToCloud, loadFromCloud, updateStateRef };
}

/** Merge server get_state response into local GameState via MERGE_SERVER_STATE dispatch.
 *  When skipEconomy is true (cloud save already loaded or non-economy action), we skip
 *  money/inventory/gear etc. to prevent overwriting recent local values. */
function mergeServerState(dispatch: (action: any) => void, data: Record<string, any>, skipEconomy = false) {
  const ps = data.playerState || data;

  // Build inventory map from server's player_inventory rows
  let inventoryData: Record<string, number> | undefined;
  let inventoryCostsData: Record<string, number> | undefined;
  if (!skipEconomy && Array.isArray(data.inventory)) {
    inventoryData = {};
    inventoryCostsData = {};
    for (const row of data.inventory) {
      inventoryData[row.good_id] = row.quantity;
      inventoryCostsData[row.good_id] = row.avg_cost || 0;
    }
  }

  // Build ownedGear from server's player_gear rows
  let ownedGearData: string[] | undefined;
  if (!skipEconomy && Array.isArray(data.gear)) {
    ownedGearData = data.gear.map((r: any) => r.gear_id);
  }

  dispatch({
    type: 'MERGE_SERVER_STATE',
    serverState: {
      // Economy fields: only merge if skipEconomy is false
      ...(skipEconomy ? {} : {
        money: ps.money ?? undefined,
        dirtyMoney: ps.dirty_money ?? undefined,
        debt: ps.debt ?? undefined,
        rep: ps.rep ?? undefined,
        karma: ps.karma ?? undefined,
        day: ps.day ?? undefined,
        washUsedToday: ps.wash_used_today ?? undefined,
        playerHP: ps.hp ?? undefined,
        playerMaxHP: ps.max_hp ?? undefined,
        endgamePhase: ps.endgame_phase ?? undefined,
        meritPoints: ps.merit_points ?? undefined,
        inventory: inventoryData,
        inventoryCosts: inventoryCostsData,
        ownedGear: ownedGearData,
        player: {
          level: ps.level ?? undefined,
          xp: ps.xp ?? undefined,
          nextXp: ps.next_xp ?? undefined,
          skillPoints: ps.skill_points ?? undefined,
          statPoints: ps.stat_points ?? undefined,
          stats: ps.stats ?? undefined,
          loadout: ps.loadout ?? undefined,
        },
      }),
      // Always merge these MMO/cooldown/location fields
      heat: ps.heat ?? undefined,
      personalHeat: ps.personal_heat ?? undefined,
      loc: ps.loc ?? undefined,
      policeRel: ps.police_rel ?? undefined,
      energy: ps.energy ?? undefined,
      maxEnergy: ps.max_energy ?? undefined,
      nerve: ps.nerve ?? undefined,
      maxNerve: ps.max_nerve ?? undefined,
      energyRegenAt: ps.energy_regen_at ?? null,
      nerveRegenAt: ps.nerve_regen_at ?? null,
      travelCooldownUntil: ps.travel_cooldown_until ?? null,
      crimeCooldownUntil: ps.crime_cooldown_until ?? null,
      attackCooldownUntil: ps.attack_cooldown_until ?? null,
      heistCooldownUntil: ps.heist_cooldown_until ?? null,
      allDistricts: data.allDistricts ?? undefined,
      gangDistricts: data.gangDistricts ?? undefined,
      serverSynced: true,
    },
  });
}
