import { useCallback, useRef, useState } from 'react';
import type { GameState } from '@/game/types';

// The game is fully local now. This hook used to intercept certain actions and route them to
// Supabase edge functions, merging authoritative server state back in. There is no server, so
// it degrades to a pure pass-through: every action goes straight to the local reducer, which
// already implements the full game. Cloud save/load become no-ops (the reducer autosaves to
// localStorage via Engine.saveGame elsewhere).

export interface ServerSyncState {
  loading: boolean;
  syncing: boolean;
  lastSync: Date | null;
  lastCloudSave: Date | null;
  cloudSaveVersion: number;
  error: string | null;
}

export function useServerSync(
  localDispatch: (action: any) => void,
  _showToast: (msg: string, isError?: boolean) => void,
) {
  const [syncState] = useState<ServerSyncState>({
    loading: false, syncing: false, lastSync: null, lastCloudSave: null, cloudSaveVersion: 0, error: null,
  });
  const stateRef = useRef<GameState | null>(null);

  const updateStateRef = useCallback((state: GameState) => {
    stateRef.current = state;
  }, []);

  // All dispatches are local — the reducer is authoritative.
  const serverDispatch = useCallback((action: any) => {
    localDispatch(action);
  }, [localDispatch]);

  const noop = useCallback(async () => {}, []);
  const loadFromCloud = useCallback(async () => false, []);

  return {
    serverDispatch,
    syncState,
    fetchServerState: noop,
    saveToCloud: noop,
    loadFromCloud,
    updateStateRef,
  };
}
