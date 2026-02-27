import { supabase } from '@/integrations/supabase/client';

interface SyncData {
  rep: number;
  cash: number;
  day: number;
  level: number;
  districts_owned: number;
  crew_size: number;
  karma: number;
  backstory: string | null;
}

export async function syncLeaderboard(data: SyncData) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data: result, error } = await supabase.functions.invoke('sync-leaderboard', {
    body: data,
  });

  if (error) {
    console.error('Leaderboard sync failed:', error);
    throw error;
  }

  return result;
}
