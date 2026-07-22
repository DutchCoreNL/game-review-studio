import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { deleteGame } from '@/game/engine';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load the display username from the profiles table whenever the logged-in user changes.
  useEffect(() => {
    if (!user) {
      setUsername(null);
      return;
    }
    let cancelled = false;
    supabase.from('profiles').select('username').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (!cancelled) setUsername(data?.username ?? null);
    });
    return () => { cancelled = true; };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    // The local save is a single unscoped localStorage slot shared by whoever is using this
    // browser (see engine.ts SAVE_KEY) — if we leave it behind, the next account to sign in
    // on this device can inherit this account's offline progress via the "Continue" button,
    // or have it pushed to their own cloud save by the newest-wins sync logic in
    // useServerSync's loadFromCloud (a local save with a higher day number than the next
    // account's actual cloud save gets treated as "newer" and gets uploaded to their row).
    deleteGame();
  };

  return { user, username, loading, signOut };
}
