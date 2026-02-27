import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { gameApi } from '@/lib/gameApi';

export interface FactionState {
  faction_id: string;
  status: string;
  boss_hp: number;
  boss_max_hp: number;
  conquest_phase: string;
  conquest_progress: number;
  conquered_by: string | null;
  conquered_at: string | null;
  vassal_owner_id: string | null;
  global_relation: number;
  last_attack_by: string | null;
  last_attack_at: string | null;
  reset_at: string | null;
  total_damage_dealt: Record<string, number>;
  gang_damage: Record<string, Record<string, number>>;
  conquest_reward_claimed: string[];
}

export function useFactionState() {
  const [factions, setFactions] = useState<Record<string, FactionState>>({});
  const [loading, setLoading] = useState(true);
  const [usernameMap, setUsernameMap] = useState<Record<string, string>>({});

  const fetchFactions = useCallback(async () => {
    const res = await gameApi.getFactionState();
    if (res.success && res.data?.factions) {
      setFactions(res.data.factions);
    }
    setLoading(false);
  }, []);

  // Collect all unique user IDs from damage leaderboards
  const allDamageUserIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(factions).forEach(f => {
      if (f.total_damage_dealt) {
        Object.keys(f.total_damage_dealt).forEach(uid => ids.add(uid));
      }
    });
    return Array.from(ids);
  }, [factions]);

  // Fetch usernames for damage dealer UUIDs
  useEffect(() => {
    const missing = allDamageUserIds.filter(id => !usernameMap[id]);
    if (missing.length === 0) return;

    supabase
      .from('profiles')
      .select('id, username')
      .in('id', missing)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setUsernameMap(prev => {
            const next = { ...prev };
            data.forEach(p => { next[p.id] = p.username; });
            return next;
          });
        }
      });
  }, [allDamageUserIds]);

  useEffect(() => {
    fetchFactions();

    const channel = supabase
      .channel('faction-relations-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'faction_relations',
      }, (payload) => {
        const row = payload.new as any;
        if (row?.faction_id) {
          setFactions(prev => ({ ...prev, [row.faction_id]: row }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchFactions]);

  const attackFaction = useCallback(async (factionId: string, phase: string) => {
    const res = await gameApi.attackFaction(factionId, phase);
    return res;
  }, []);

  return { factions, loading, attackFaction, refetch: fetchFactions, usernameMap };
}
