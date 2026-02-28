import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityItem {
  id: string;
  user_id: string;
  username: string;
  action_type: string;
  description: string;
  icon: string;
  district_id: string | null;
  target_name: string | null;
  data: Record<string, any>;
  created_at: string;
}

export function useActivityFeed(districtFilter?: string) {
  const [items, setItems] = useState<ActivityItem[]>([]);

  const fetch = useCallback(async () => {
    let q = supabase
      .from('activity_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (districtFilter) q = q.eq('district_id', districtFilter);
    const { data } = await q;
    if (data) setItems(data as unknown as ActivityItem[]);
  }, [districtFilter]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('activity-feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_feed' }, (payload) => {
        const newItem = payload.new as unknown as ActivityItem;
        if (districtFilter && newItem.district_id !== districtFilter) return;
        setItems(prev => [newItem, ...prev.slice(0, 29)]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, districtFilter]);

  return items;
}
