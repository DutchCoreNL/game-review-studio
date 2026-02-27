import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DigestData {
  id: string;
  world_day: number;
  digest_data: {
    world_day: number;
    weather: string;
    sections: {
      income?: { available: boolean; debt: number; debtInterest: number };
      pvp?: { activeBountiesOnYou: number; totalBountyAmount: number; activeGangWars: number };
      market?: { highlights: string[] };
      cliffhanger?: { text: string; icon: string };
    };
  };
  seen: boolean;
}

export function useDailyDigest() {
  const { user } = useAuth();
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchDigest = async () => {
      const { data, error } = await supabase
        .from('daily_digests')
        .select('*')
        .eq('user_id', user.id)
        .eq('seen', false)
        .order('world_day', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setDigest(data as unknown as DigestData);
      }
      setLoading(false);
    };

    fetchDigest();
  }, [user]);

  const markSeen = async () => {
    if (!digest) return;
    await supabase
      .from('daily_digests')
      .update({ seen: true })
      .eq('id', digest.id);
    setDigest(null);
  };

  return { digest, loading, markSeen };
}
