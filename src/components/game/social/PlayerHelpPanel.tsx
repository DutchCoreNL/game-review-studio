import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { gameApi } from '@/lib/gameApi';
import { GameButton } from '../ui/GameButton';
import { ConfirmDialog } from '../ConfirmDialog';
import { Lock, Heart, Users, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrisonerOrPatient {
  userId: string;
  username: string;
  level: number;
  until: string;
  type: 'prison' | 'hospital';
}

interface PlayerHelpPanelProps {
  type: 'prison' | 'hospital';
  onResult: (msg: string, isError?: boolean) => void;
}

export function PlayerHelpPanel({ type, onResult }: PlayerHelpPanelProps) {
  const { user } = useAuth();
  const [players, setPlayers] = useState<PrisonerOrPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<PrisonerOrPatient | null>(null);

  const fetchPlayers = async () => {
    if (!user) return;
    setLoading(true);
    const now = new Date().toISOString();
    const field = type === 'prison' ? 'prison_until' : 'hospital_until';

    const { data } = await supabase
      .from('player_state')
      .select(`user_id, level, ${field}`)
      .neq('user_id', user.id)
      .gt(field, now)
      .limit(10);

    if (data && data.length > 0) {
      const userIds = data.map((p: any) => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);
      const nameMap: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { nameMap[p.id] = p.username; });

      setPlayers(data.map((p: any) => ({
        userId: p.user_id,
        username: nameMap[p.user_id] || 'Onbekend',
        level: p.level || 1,
        until: p[field],
        type,
      })));
    } else {
      setPlayers([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPlayers(); }, [type]);

  const handleAction = async (target: PrisonerOrPatient) => {
    setActing(target.userId);
    try {
      const result = type === 'prison'
        ? await gameApi.bustPrison(target.userId)
        : await gameApi.revivePlayer(target.userId);
      onResult(result.message, !result.success);
      if (result.success) {
        setPlayers(prev => prev.filter(p => p.userId !== target.userId));
      }
    } catch (e: any) {
      onResult(e.message || 'Fout opgetreden', true);
    }
    setActing(null);
    setConfirmTarget(null);
  };

  const icon = type === 'prison' ? <Lock size={12} /> : <Heart size={12} />;
  const title = type === 'prison' ? 'Gevangenen Bevrijden' : 'Spelers Reviven';
  const actionLabel = type === 'prison' ? 'BEVRIJDEN' : 'REVIVE';
  const emptyText = type === 'prison' ? 'Geen gevangenen gevonden.' : 'Niemand in het ziekenhuis.';

  const timeLeft = (until: string) => {
    const ms = Math.max(0, new Date(until).getTime() - Date.now());
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}u ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
          {icon}
          <span>{title}</span>
        </div>
        <button onClick={fetchPlayers} className="text-[0.5rem] text-ice hover:text-foreground transition-colors flex items-center gap-1">
          <Search size={8} /> Ververs
        </button>
      </div>

      {loading ? (
        <div className="text-center py-3">
          <Loader2 size={14} className="animate-spin text-muted-foreground mx-auto" />
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-3 text-[0.55rem] text-muted-foreground flex items-center justify-center gap-1">
          <Users size={10} /> {emptyText}
        </div>
      ) : (
        <AnimatePresence>
          {players.map((p, i) => (
            <motion.div
              key={p.userId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ delay: i * 0.05 }}
              className="game-card flex items-center justify-between"
            >
              <div>
                <span className="text-[0.6rem] font-bold">{p.username}</span>
                <div className="flex items-center gap-2 text-[0.45rem] text-muted-foreground">
                  <span>Lvl {p.level}</span>
                  <span>• {timeLeft(p.until)} resterend</span>
                </div>
              </div>
              <GameButton
                variant={type === 'prison' ? 'blood' : 'emerald'}
                size="sm"
                icon={acting === p.userId ? <Loader2 size={10} className="animate-spin" /> : icon}
                onClick={() => setConfirmTarget(p)}
                disabled={acting !== null}
              >
                {actionLabel}
              </GameButton>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title={type === 'prison' ? 'Gevangene Bevrijden' : 'Speler Reviven'}
        message={
          type === 'prison'
            ? `Probeer ${confirmTarget?.username} uit de gevangenis te breken? Dit kost 20 energy + 15 nerve. Bij falen word je zelf gearresteerd!`
            : `Revive ${confirmTarget?.username} uit het ziekenhuis? Dit kost 15 energy + geld.`
        }
        confirmText={actionLabel}
        cancelText="ANNULEREN"
        variant="warning"
        onConfirm={() => confirmTarget && handleAction(confirmTarget)}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
