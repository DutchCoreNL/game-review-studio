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
  error: string | null;
}

export function useServerSync(
  localDispatch: (action: any) => void,
  showToast: (msg: string, isError?: boolean) => void,
) {
  const { user } = useAuth();
  const [syncState, setSyncState] = useState<ServerSyncState>({
    loading: false, syncing: false, lastSync: null, error: null,
  });
  const initialSyncDone = useRef(false);

  // Fetch server state on mount (if logged in)
  const fetchServerState = useCallback(async () => {
    if (!user) return;
    setSyncState(s => ({ ...s, loading: true, error: null }));
    try {
      const result = await invokeGameAction('get_state');
      if (result.success && result.data) {
        // Merge server fields into local state
        mergeServerState(localDispatch, result.data);
        setSyncState(s => ({ ...s, loading: false, lastSync: new Date() }));
      } else if (!result.success && result.message?.includes('Geen spelerstaat')) {
        // Init player on server
        const initResult = await invokeGameAction('init_player');
        if (initResult.success && initResult.data) {
          mergeServerState(localDispatch, initResult.data);
        }
        setSyncState(s => ({ ...s, loading: false, lastSync: new Date() }));
      } else {
        setSyncState(s => ({ ...s, loading: false, error: result.message }));
      }
    } catch (e: any) {
      setSyncState(s => ({ ...s, loading: false, error: e.message }));
    }
  }, [user, localDispatch]);

  useEffect(() => {
    if (user && !initialSyncDone.current) {
      initialSyncDone.current = true;
      fetchServerState();
    }
  }, [user, fetchServerState]);

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

    setSyncState(s => ({ ...s, syncing: true }));
    try {
      const result = await invokeGameAction(mapping.action as any, mapping.payload(action));
      if (result.success) {
        showToast(result.message);
        // Re-fetch full state from server to stay in sync
        const stateResult = await invokeGameAction('get_state');
        if (stateResult.success && stateResult.data) {
          mergeServerState(localDispatch, stateResult.data);
        }
      } else {
        showToast(result.message, true);
      }
    } catch (e: any) {
      showToast('Verbindingsfout met server.', true);
      // Fallback to local action
      localDispatch(action);
    }
    setSyncState(s => ({ ...s, syncing: false, lastSync: new Date() }));
  }, [user, localDispatch, showToast]);

  return { serverDispatch, syncState, fetchServerState };
}

/** Merge server get_state response into local GameState via MERGE_SERVER_STATE dispatch */
function mergeServerState(dispatch: (action: any) => void, data: Record<string, any>) {
  // get_state returns { playerState, inventory, gear, vehicles, districts, businesses, crew, villa, gangDistricts, allDistricts }
  const ps = data.playerState || data; // fallback to flat structure for backwards compat

  dispatch({
    type: 'MERGE_SERVER_STATE',
    serverState: {
      money: ps.money ?? undefined,
      dirtyMoney: ps.dirty_money ?? undefined,
      debt: ps.debt ?? undefined,
      rep: ps.rep ?? undefined,
      heat: ps.heat ?? undefined,
      personalHeat: ps.personal_heat ?? undefined,
      playerHP: ps.hp ?? undefined,
      playerMaxHP: ps.max_hp ?? undefined,
      karma: ps.karma ?? undefined,
      loc: ps.loc ?? undefined,
      policeRel: ps.police_rel ?? undefined,
      energy: ps.energy ?? 100,
      maxEnergy: ps.max_energy ?? 100,
      nerve: ps.nerve ?? 50,
      maxNerve: ps.max_nerve ?? 50,
      energyRegenAt: ps.energy_regen_at ?? null,
      nerveRegenAt: ps.nerve_regen_at ?? null,
      travelCooldownUntil: ps.travel_cooldown_until ?? null,
      crimeCooldownUntil: ps.crime_cooldown_until ?? null,
      attackCooldownUntil: ps.attack_cooldown_until ?? null,
      heistCooldownUntil: ps.heist_cooldown_until ?? null,
      day: ps.day ?? undefined,
      washUsedToday: ps.wash_used_today ?? undefined,
      endgamePhase: ps.endgame_phase ?? undefined,
      player: {
        level: ps.level ?? undefined,
        xp: ps.xp ?? undefined,
        nextXp: ps.next_xp ?? undefined,
        skillPoints: ps.skill_points ?? undefined,
        stats: ps.stats ?? undefined,
        loadout: ps.loadout ?? undefined,
      },
      // Sync districts: personal + gang territories combined
      allDistricts: data.allDistricts ?? undefined,
      gangDistricts: data.gangDistricts ?? undefined,
      serverSynced: true,
    },
  });
}
