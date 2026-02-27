import { useState, useEffect, useCallback, useRef } from 'react';
import { gameApi } from '@/lib/gameApi';
import { supabase } from '@/integrations/supabase/client';

export interface DistrictPlayerCount {
  district_id: string;
  count: number;
}

export interface DistrictEvent {
  id: string;
  district_id: string;
  event_type: string;
  title: string;
  description?: string;
  data?: Record<string, any>;
  created_at: string;
  expires_at: string;
}

export interface GangTerritoryInfo {
  district_id: string;
  gang_id: string;
  gang_name: string;
  gang_tag: string;
  total_influence: number;
  defense_level: number;
}

export interface DistrictTopPlayer {
  username: string;
  level: number;
  rep: number;
}

export interface DistrictData {
  playerCounts: Record<string, number>;
  events: DistrictEvent[];
  territories: GangTerritoryInfo[];
  dangerLevels: Record<string, number>;
  districtPlayers: Record<string, DistrictTopPlayer[]>;
}

const EMPTY: DistrictData = {
  playerCounts: {},
  events: [],
  territories: [],
  dangerLevels: {},
  districtPlayers: {},
};

export function useDistrictData(enabled: boolean) {
  const [data, setData] = useState<DistrictData>(EMPTY);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    const res = await gameApi.getDistrictData();
    if (res.success && res.data) {
      setData(res.data as unknown as DistrictData);
    }
  }, [enabled]);

  // Initial fetch + polling every 30s
  useEffect(() => {
    if (!enabled) return;
    fetch();
    intervalRef.current = setInterval(fetch, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetch, enabled]);

  // Realtime subscription for district_events
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel('district-events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'district_events' }, () => {
        // Refetch on any change
        fetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gang_territories' }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [enabled, fetch]);

  return data;
}
