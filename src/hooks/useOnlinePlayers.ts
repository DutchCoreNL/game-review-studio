import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface OnlinePlayer {
  user_id: string;
  username: string;
  district_id: string;
  level: number;
  last_seen_at: string;
}

export function useOnlinePlayers() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [countByDistrict, setCountByDistrict] = useState<Record<string, number>>({});

  const fetch = useCallback(async () => {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('player_online_status')
      .select('*')
      .gte('last_seen_at', cutoff)
      .eq('is_online', true);
    if (data) {
      setPlayers(data as unknown as OnlinePlayer[]);
      const counts: Record<string, number> = {};
      (data as any[]).forEach(p => { counts[p.district_id] = (counts[p.district_id] || 0) + 1; });
      setCountByDistrict(counts);
    }
  }, []);

  // Heartbeat: update own online status every 60s
  useEffect(() => {
    if (!user) return;
    const updateStatus = async () => {
      const { data: ps } = await supabase.from('player_state').select('loc, level').eq('user_id', user.id).maybeSingle();
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
      if (ps) {
        await supabase.from('player_online_status').upsert({
          user_id: user.id,
          username: profile?.username || 'Onbekend',
          district_id: ps.loc || 'low',
          level: ps.level || 1,
          last_seen_at: new Date().toISOString(),
          is_online: true,
        }, { onConflict: 'user_id' });
      }
    };
    updateStatus();
    const interval = setInterval(updateStatus, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30_000);
    const channel = supabase
      .channel('online-players-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_online_status' }, () => fetch())
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [fetch]);

  return { players, countByDistrict, total: players.length };
}
