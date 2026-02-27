import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, User, Clock, X, RefreshCw, Cloud, CloudUpload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGame } from '@/contexts/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { syncLeaderboard } from '@/lib/syncLeaderboard';
import { toast } from '@/hooks/use-toast';
import { useMuteStatus } from '@/hooks/useMuteStatus';
import { gameApi } from '@/lib/gameApi';

export function WifiPopup() {
  const { user } = useAuth();
  const { state } = useGame();
  const [open, setOpen] = useState(false);
  const { isMuted } = useMuteStatus();
  const [username, setUsername] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [cloudSaving, setCloudSaving] = useState(false);
  const [lastCloudSave, setLastCloudSave] = useState<string | null>(null);

  const fetchInfo = () => {
    if (!user) return;
    Promise.all([
      supabase.from('profiles').select('username').eq('id', user.id).single(),
      supabase.from('leaderboard_entries').select('updated_at').eq('user_id', user.id).single(),
      supabase.from('player_state').select('last_save_at, save_version').eq('user_id', user.id).single(),
    ]).then(([profileRes, lbRes, saveRes]) => {
      if (profileRes.data) setUsername(profileRes.data.username);
      if (lbRes.data) setLastSync(lbRes.data.updated_at);
      if (saveRes.data?.last_save_at) setLastCloudSave(saveRes.data.last_save_at);
    });
  };

  useEffect(() => {
    if (open && user) fetchInfo();
  }, [user, open]);

  const handleSync = async () => {
    setSyncing(true);
    if (isMuted) {
      toast({ title: '🔇 Gemute', description: 'Leaderboard sync is geblokkeerd zolang je gemute bent.', variant: 'destructive' });
      setSyncing(false);
      return;
    }
    try {
      await syncLeaderboard({
        rep: state.rep,
        cash: state.money,
        day: state.day,
        level: state.player.level,
        districts_owned: state.ownedDistricts.length,
        crew_size: state.crew.length,
        karma: state.karma || 0,
        backstory: state.backstory || null,
        prestige_level: state.prestigeLevel || 0,
        is_hardcore: state.hardcoreMode || false,
      });
      const { data } = await supabase.from('leaderboard_entries').select('updated_at').eq('user_id', user!.id).maybeSingle();
      if (data) setLastSync(data.updated_at);
      toast({ title: '✅ Gesynchroniseerd', description: 'Je stats zijn bijgewerkt op het leaderboard.' });
    } catch {
      toast({ title: '❌ Sync mislukt', description: 'Er ging iets mis. Probeer het later opnieuw.', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const handleCloudSave = async () => {
    if (!user) return;
    setCloudSaving(true);
    try {
      const result = await gameApi.saveState(state, state.day);
      if (result.success) {
        setLastCloudSave(new Date().toISOString());
        toast({ title: '☁️ Cloud Save', description: 'Je voortgang is opgeslagen in de cloud.' });
      } else {
        toast({ title: '❌ Save mislukt', description: result.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: '❌ Save mislukt', description: 'Verbindingsfout.', variant: 'destructive' });
    } finally {
      setCloudSaving(false);
    }
  };

  const syncLabel = lastSync
    ? new Date(lastSync).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
    : 'Nog niet gesynchroniseerd';

  const cloudSaveLabel = lastCloudSave
    ? new Date(lastCloudSave).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
    : 'Nooit';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className={`flex items-center gap-0.5 ${user ? 'text-emerald' : 'text-muted-foreground/40'} hover:opacity-80 transition-opacity`}
      >
        {user ? <Wifi size={8} /> : <WifiOff size={8} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 z-50 w-48 rounded border border-border bg-popover px-3 py-2.5 shadow-lg"
          >
            <div className="absolute -top-1 right-2 w-2 h-2 rotate-45 border-l border-t border-border bg-popover" />

            <div className="relative z-10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`text-[0.55rem] font-bold uppercase tracking-wider ${user ? 'text-emerald' : 'text-muted-foreground'}`}>
                  {user ? 'Online' : 'Offline'}
                </span>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={10} />
                </button>
              </div>

              {user ? (
                <>
                  <div className="flex items-center gap-1.5 text-[0.55rem] text-foreground">
                    <User size={9} className="text-gold flex-shrink-0" />
                    <span className="truncate font-medium">{username || '...'}</span>
                  </div>

                  {/* Cloud Save Status */}
                  <div className="flex items-center gap-1.5 text-[0.5rem] text-muted-foreground">
                    <Cloud size={9} className="text-ice flex-shrink-0" />
                    <span>Cloud save: {cloudSaveLabel}</span>
                  </div>
                  <div className="text-[0.45rem] text-muted-foreground/70 pl-[18px]">
                    Auto-save elke 2 min
                  </div>

                  <div className="flex items-center gap-1.5 text-[0.5rem] text-muted-foreground">
                    <Clock size={9} className="flex-shrink-0" />
                    <span>Leaderboard: {syncLabel}</span>
                  </div>

                  <div className="flex gap-1.5 mt-1">
                    <button
                      onClick={handleCloudSave}
                      disabled={cloudSaving}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[0.5rem] font-bold bg-ice/15 border border-ice/30 text-ice hover:bg-ice/25 transition-colors disabled:opacity-50"
                    >
                      <CloudUpload size={9} className={cloudSaving ? 'animate-pulse' : ''} />
                      {cloudSaving ? 'SAVING...' : 'SAVE NU'}
                    </button>
                    <button
                      onClick={handleSync}
                      disabled={syncing}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[0.5rem] font-bold bg-emerald/15 border border-emerald/30 text-emerald hover:bg-emerald/25 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={9} className={syncing ? 'animate-spin' : ''} />
                      {syncing ? 'SYNC...' : 'SYNC'}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-[0.5rem] text-muted-foreground leading-relaxed">
                  Log in om je voortgang op te slaan in de cloud en te synchroniseren over apparaten.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
