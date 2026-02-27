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

  // Check if player is muted
  const { data: mutes } = await supabase
    .from('player_sanctions')
    .select('id, expires_at')
    .eq('user_id', session.user.id)
    .eq('type', 'mute')
    .eq('active', true)
    .limit(1);

  if (mutes && mutes.length > 0) {
    const mute = mutes[0];
    if (!mute.expires_at || new Date(mute.expires_at) > new Date()) {
      console.warn('Leaderboard sync blocked: player is muted');
      return;
    }
  }

  const { data: result, error } = await supabase.functions.invoke('sync-leaderboard', {
    body: data,
  });

  if (error) {
    console.error('Leaderboard sync failed:', error);
    throw error;
  }

  return result;
}
