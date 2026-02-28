import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { gameApi } from '@/lib/gameApi';

export interface WorldRaid {
  id: string;
  raid_type: string;
  title: string;
  description: string | null;
  district_id: string | null;
  boss_hp: number;
  boss_max_hp: number;
  participants: Record<string, number>;
  total_participants: number;
  reward_pool: { cash: number; rep: number; xp: number };
  status: string;
  started_at: string;
  ends_at: string;
  completed_at: string | null;
}

export function useWorldRaids() {
  const [raids, setRaids] = useState<WorldRaid[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('world_raids')
      .select('*')
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setRaids(data as unknown as WorldRaid[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('world-raids-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'world_raids' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const attackRaid = useCallback(async (raidId: string) => {
    return await gameApi.attackWorldRaid(raidId);
  }, []);

  return { raids, loading, attackRaid, refetch: fetch };
}
