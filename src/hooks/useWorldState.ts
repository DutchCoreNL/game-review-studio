import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WeatherType } from '@/game/types';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export interface WorldState {
  worldDay: number;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  nextCycleAt: string;
}

const DEFAULT_STATE: WorldState = {
  worldDay: 1,
  timeOfDay: 'day',
  weather: 'clear',
  nextCycleAt: new Date().toISOString(),
};

export function useWorldState() {
  const [worldState, setWorldState] = useState<WorldState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetch = async () => {
      const { data } = await supabase
        .from('world_state')
        .select('*')
        .eq('id', 1)
        .single();
      if (data) {
        setWorldState({
          worldDay: data.world_day,
          timeOfDay: data.time_of_day as TimeOfDay,
          weather: data.current_weather as WeatherType,
          nextCycleAt: data.next_cycle_at,
        });
      }
      setLoading(false);
    };
    fetch();

    // Realtime subscription
    const channel = supabase
      .channel('world-state-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'world_state',
      }, (payload) => {
        const d = payload.new as any;
        setWorldState({
          worldDay: d.world_day,
          timeOfDay: d.time_of_day as TimeOfDay,
          weather: d.current_weather as WeatherType,
          nextCycleAt: d.next_cycle_at,
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { ...worldState, loading };
}

// Time-of-day icons for UI
export const TIME_OF_DAY_ICONS: Record<TimeOfDay, string> = {
  dawn: '🌅',
  day: '☀️',
  dusk: '🌆',
  night: '🌙',
};

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  dawn: 'Dageraad',
  day: 'Dag',
  dusk: 'Schemering',
  night: 'Nacht',
};
