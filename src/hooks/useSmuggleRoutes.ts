import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { gameApi } from '@/lib/gameApi';

export interface SmuggleRoute {
  id: string;
  from_district: string;
  to_district: string;
  good_id: string;
  profit_multiplier: number;
  risk_level: number;
  capacity: number;
  used_capacity: number;
  gang_id: string | null;
  status: string;
  expires_at: string;
}

export function useSmuggleRoutes() {
  const [routes, setRoutes] = useState<SmuggleRoute[]>([]);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('smuggle_routes')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (data) setRoutes(data as unknown as SmuggleRoute[]);
  }, []);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('smuggle-routes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'smuggle_routes' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const useRoute = useCallback(async (routeId: string, quantity: number) => {
    return await gameApi.useSmuggleRoute(routeId, quantity);
  }, []);

  const createRoute = useCallback(async (fromDistrict: string, toDistrict: string, goodId: string) => {
    return await gameApi.createSmuggleRoute(fromDistrict, toDistrict, goodId);
  }, []);

  return { routes, useRoute, createRoute, refetch: fetch };
}
