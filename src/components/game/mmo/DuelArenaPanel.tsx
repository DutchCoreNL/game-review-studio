import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Users, Clock, Zap, Shield, Trophy, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { gameApi } from '@/lib/gameApi';

const DISTRICT_NAMES: Record<string, string> = {
  low: 'Lowrise', port: 'Port Nero', iron: 'Iron Borough', neon: 'Neon Strip', crown: 'Crown Heights',
};

interface DuelSession {
  id: string;
  attacker_id: string;
  defender_id: string;
  attacker_name?: string;
  defender_name?: string;
  status: string;
  attacker_score: number;
  defender_score: number;
  turn: number;
  created_at: string;
  winner_id: string | null;
}

interface OnlinePlayer {
  user_id: string;
  username: string;
  level: number;
  district_id: string;
}

export function DuelArenaPanel({ currentDistrict }: { currentDistrict: string }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'challenge' | 'active' | 'history'>('challenge');
  const [nearbyPlayers, setNearbyPlayers] = useState<OnlinePlayer[]>([]);
  const [activeDuels, setActiveDuels] = useState<DuelSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [challenging, setChallenging] = useState<string | null>(null);

  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    // Get nearby players
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: online } = await supabase
      .from('player_online_status')
      .select('user_id, username, level, district_id')
      .eq('district_id', currentDistrict)
      .eq('is_online', true)
      .gte('last_seen_at', cutoff)
      .neq('user_id', user.id);
    
    setNearbyPlayers((online as OnlinePlayer[]) || []);

    // Get active duels involving this player
    const { data: duels } = await supabase
      .from('pvp_combat_sessions')
      .select('*')
      .eq('status', 'active')
      .or(`attacker_id.eq.${user.id},defender_id.eq.${user.id}`);
    
    setActiveDuels((duels as unknown as DuelSession[]) || []);
    setLoading(false);
  }, [user, currentDistrict]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime updates for active duels
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('duel-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pvp_combat_sessions' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchData]);

  const handleChallenge = async (targetId: string) => {
    setChallenging(targetId);
    const res = await gameApi.pvpCombatStart(targetId);
    showMsg(res.message);
    if (res.success) fetchData();
    setChallenging(null);
  };

  if (loading) return <div className="flex justify-center py-3"><Loader2 size={14} className="animate-spin text-gold" /></div>;

  return (
    <div>
      <SectionHeader title="Duel Arena" icon={<Swords size={12} />} badge={`${nearbyPlayers.length} tegenstanders`} badgeColor="blood" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-[0.5rem] text-gold bg-gold/10 rounded px-2 py-1 mb-2 text-center border border-gold/20">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 mb-2">
        {[
          { id: 'challenge' as const, label: 'Uitdagen', icon: <Zap size={8} /> },
          { id: 'active' as const, label: `Actief (${activeDuels.length})`, icon: <Swords size={8} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[0.45rem] font-bold uppercase transition-all ${
              tab === t.id ? 'bg-blood/15 border border-blood text-blood' : 'bg-muted border border-border text-muted-foreground'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Challenge Tab */}
      {tab === 'challenge' && (
        <div>
          {nearbyPlayers.length === 0 ? (
            <div className="text-center py-4">
              <Shield size={20} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-[0.5rem] text-muted-foreground">
                Geen spelers in de buurt in {DISTRICT_NAMES[currentDistrict]}.
              </p>
              <p className="text-[0.4rem] text-muted-foreground mt-1">
                Reis naar een drukker district om tegenstanders te vinden.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {nearbyPlayers.map(p => (
                <motion.div
                  key={p.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded bg-card/50 border border-border/50 hover:border-blood/30 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[0.55rem] font-bold text-foreground">{p.username}</span>
                    <span className="text-[0.4rem] text-muted-foreground ml-1.5">Lv.{p.level}</span>
                  </div>
                  <GameButton
                    variant="blood"
                    size="sm"
                    icon={<Swords size={8} />}
                    onClick={() => handleChallenge(p.user_id)}
                    disabled={challenging === p.user_id}
                    className="px-2"
                  >
                    {challenging === p.user_id ? '...' : 'Duel'}
                  </GameButton>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Duels Tab */}
      {tab === 'active' && (
        <div>
          {activeDuels.length === 0 ? (
            <div className="text-center py-4">
              <Swords size={20} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-[0.5rem] text-muted-foreground">Geen actieve duels.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeDuels.map(d => {
                const isAttacker = d.attacker_id === user?.id;
                const myScore = isAttacker ? d.attacker_score : d.defender_score;
                const theirScore = isAttacker ? d.defender_score : d.attacker_score;
                
                return (
                  <motion.div key={d.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="game-card border-l-[3px] border-l-blood"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[0.5rem] font-bold text-blood">
                        {isAttacker ? '⚔️ Aanval' : '🛡️ Verdediging'}
                      </span>
                      <span className="text-[0.4rem] text-muted-foreground">Beurt {d.turn}</span>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-center">
                        <span className="text-[0.5rem] font-bold text-emerald">{myScore}</span>
                        <p className="text-[0.35rem] text-muted-foreground">Jij</p>
                      </div>
                      <Swords size={12} className="text-blood" />
                      <div className="text-center">
                        <span className="text-[0.5rem] font-bold text-blood">{theirScore}</span>
                        <p className="text-[0.35rem] text-muted-foreground">Tegenstander</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
