import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TravelState {
  id: string;
  destination: string;
  departed_at: string;
  arrives_at: string;
  purchased_goods: Record<string, number>;
  status: 'traveling' | 'abroad' | 'returning';
}

export function useTravel() {
  const { user } = useAuth();
  const [travel, setTravel] = useState<TravelState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTravel = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('player_travel')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) setTravel(data as unknown as TravelState);
    else setTravel(null);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTravel(); }, [fetchTravel]);

  // Refresh every 15s for countdown updates
  useEffect(() => {
    const iv = setInterval(fetchTravel, 15000);
    return () => clearInterval(iv);
  }, [fetchTravel]);

  const startTravel = useCallback(async (destination: string, travelMinutes: number) => {
    if (!user) return { success: false, message: 'Niet ingelogd' };
    const arrivesAt = new Date(Date.now() + travelMinutes * 60000).toISOString();
    const { error } = await supabase.from('player_travel').insert({
      user_id: user.id,
      destination,
      arrives_at: arrivesAt,
      status: 'traveling',
      purchased_goods: {},
    } as any);
    if (error) {
      if (error.code === '23505') return { success: false, message: 'Je bent al op reis!' };
      return { success: false, message: error.message };
    }
    await fetchTravel();
    return { success: true, message: 'Reis gestart!' };
  }, [user, fetchTravel]);

  const arriveAtDestination = useCallback(async () => {
    if (!user || !travel) return;
    await supabase.from('player_travel')
      .update({ status: 'abroad' } as any)
      .eq('id', travel.id)
      .eq('user_id', user.id);
    await fetchTravel();
  }, [user, travel, fetchTravel]);

  const buyGood = useCallback(async (goodId: string, quantity: number) => {
    if (!user || !travel) return { success: false, message: 'Niet op bestemming' };
    const currentGoods = { ...travel.purchased_goods };
    currentGoods[goodId] = (currentGoods[goodId] || 0) + quantity;
    await supabase.from('player_travel')
      .update({ purchased_goods: currentGoods } as any)
      .eq('id', travel.id)
      .eq('user_id', user.id);
    await fetchTravel();
    return { success: true, message: `${quantity}x gekocht!` };
  }, [user, travel, fetchTravel]);

  const startReturn = useCallback(async (travelMinutes: number) => {
    if (!user || !travel) return { success: false, message: 'Niet op bestemming' };
    const arrivesAt = new Date(Date.now() + travelMinutes * 60000).toISOString();
    await supabase.from('player_travel')
      .update({ status: 'returning', arrives_at: arrivesAt, departed_at: new Date().toISOString() } as any)
      .eq('id', travel.id)
      .eq('user_id', user.id);
    await fetchTravel();
    return { success: true, message: 'Terugreis gestart!' };
  }, [user, travel, fetchTravel]);

  const completeReturn = useCallback(async () => {
    if (!user || !travel) return { success: false, goods: {} as Record<string, number> };
    const goods = { ...travel.purchased_goods };
    await supabase.from('player_travel')
      .delete()
      .eq('id', travel.id)
      .eq('user_id', user.id);
    setTravel(null);
    return { success: true, goods };
  }, [user, travel]);

  const cancelTravel = useCallback(async () => {
    if (!user || !travel) return;
    await supabase.from('player_travel')
      .delete()
      .eq('id', travel.id)
      .eq('user_id', user.id);
    setTravel(null);
  }, [user, travel]);

  const hasArrived = travel && new Date(travel.arrives_at).getTime() <= Date.now();

  return { travel, loading, hasArrived, startTravel, arriveAtDestination, buyGood, startReturn, completeReturn, cancelTravel, fetchTravel };
}
