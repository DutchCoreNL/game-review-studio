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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Get username from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (!profile) return;

  await supabase
    .from('leaderboard_entries')
    .upsert(
      {
        user_id: user.id,
        username: profile.username,
        ...data,
      },
      { onConflict: 'user_id' }
    );
}
