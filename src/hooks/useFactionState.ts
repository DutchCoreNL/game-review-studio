import { useState, useEffect, useCallback } from 'react';
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
}

export function useFactionState() {
  const [factions, setFactions] = useState<Record<string, FactionState>>({});
  const [loading, setLoading] = useState(true);

  const fetchFactions = useCallback(async () => {
    const res = await gameApi.getFactionState();
    if (res.success && res.data?.factions) {
      setFactions(res.data.factions);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFactions();

    // Realtime subscription
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

  return { factions, loading, attackFaction, refetch: fetchFactions };
}
