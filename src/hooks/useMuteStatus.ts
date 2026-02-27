import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MuteStatus {
  isMuted: boolean;
  reason: string | null;
  expiresAt: string | null;
  loading: boolean;
}

export function useMuteStatus(): MuteStatus {
  const [status, setStatus] = useState<MuteStatus>({ isMuted: false, reason: null, expiresAt: null, loading: true });

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatus(s => ({ ...s, loading: false })); return; }

      const { data } = await supabase
        .from('player_sanctions')
        .select('reason, expires_at')
        .eq('user_id', user.id)
        .eq('type', 'mute')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const mute = data[0];
        const now = new Date();
        if (!mute.expires_at || new Date(mute.expires_at) > now) {
          setStatus({ isMuted: true, reason: mute.reason, expiresAt: mute.expires_at, loading: false });
          return;
        }
      }
      setStatus({ isMuted: false, reason: null, expiresAt: null, loading: false });
    };
    check();
  }, []);

  return status;
}
