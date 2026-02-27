import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { ConfirmDialog } from './ConfirmDialog';
import { useGame } from '@/contexts/GameContext';
import { Shield, Trash2, RotateCcw, Ban, RefreshCw } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  rep: number;
  cash: number;
  day: number;
  level: number;
  districts_owned: number;
  crew_size: number;
  karma: number;
  updated_at: string;
}

export function AdminPanel() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { showToast } = useGame();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'reset' | 'ban'; entry: LeaderboardEntry } | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .order('rep', { ascending: false })
      .limit(100);
    setEntries((data as LeaderboardEntry[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchEntries();
  }, [isAdmin]);

  if (adminLoading) return <div className="text-center py-8 text-muted-foreground text-xs">Laden...</div>;
  if (!isAdmin) return null;

  const executeAction = async (type: string, entry: LeaderboardEntry) => {
    setActionLoading(entry.id);
    try {
      const actionMap: Record<string, object> = {
        delete: { action: 'delete_entry', entryId: entry.id },
        reset: { action: 'reset_entry', entryId: entry.id },
        ban: { action: 'ban_player', entryId: entry.id, userId: entry.user_id },
      };

      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: actionMap[type],
      });

      if (error) throw error;
      showToast(`✅ ${type === 'delete' ? 'Verwijderd' : type === 'reset' ? 'Gereset' : 'Gebanned'}: ${entry.username}`);
      fetchEntries();
    } catch (err: any) {
      showToast(`❌ Fout: ${err.message}`, true);
    }
    setActionLoading(null);
    setConfirmAction(null);
  };

  return (
    <div>
      <SectionHeader title="Admin Paneel" icon={<Shield size={12} />} badge="ADMIN" badgeColor="blood" />

      <div className="flex items-center justify-between mb-3">
        <p className="text-[0.55rem] text-muted-foreground">
          {entries.length} spelers op het leaderboard
        </p>
        <GameButton variant="muted" size="sm" icon={<RefreshCw size={10} />} onClick={fetchEntries}>
          REFRESH
        </GameButton>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-xs">Laden...</div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry, i) => (
            <div key={entry.id} className="game-card">
              <div className="flex items-center gap-2">
                <span className="text-[0.55rem] text-muted-foreground font-bold w-6">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold truncate">{entry.username}</span>
                    <span className="text-[0.45rem] text-muted-foreground">Lv.{entry.level}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[0.45rem] text-muted-foreground">
                    <span>REP {entry.rep}</span>
                    <span>€{entry.cash.toLocaleString()}</span>
                    <span>Dag {entry.day}</span>
                    <span>🏠{entry.districts_owned}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setConfirmAction({ type: 'reset', entry })}
                    disabled={!!actionLoading}
                    className="p-1.5 rounded bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors disabled:opacity-50"
                    title="Reset stats"
                  >
                    <RotateCcw size={10} />
                  </button>
                  <button
                    onClick={() => setConfirmAction({ type: 'delete', entry })}
                    disabled={!!actionLoading}
                    className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20 transition-colors disabled:opacity-50"
                    title="Verwijder entry"
                  >
                    <Trash2 size={10} />
                  </button>
                  <button
                    onClick={() => setConfirmAction({ type: 'ban', entry })}
                    disabled={!!actionLoading}
                    className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20 transition-colors disabled:opacity-50"
                    title="Ban speler"
                  >
                    <Ban size={10} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title={
          confirmAction?.type === 'delete' ? 'Entry Verwijderen' :
          confirmAction?.type === 'reset' ? 'Stats Resetten' : 'Speler Bannen'
        }
        message={
          confirmAction?.type === 'delete'
            ? `Weet je zeker dat je de leaderboard entry van "${confirmAction.entry.username}" wilt verwijderen?`
            : confirmAction?.type === 'reset'
            ? `Weet je zeker dat je alle stats van "${confirmAction?.entry.username}" wilt resetten naar 0?`
            : `Weet je zeker dat je "${confirmAction?.entry.username}" permanent wilt bannen? Dit kan niet ongedaan worden.`
        }
        confirmText={
          confirmAction?.type === 'ban' ? 'BAN PERMANENT' :
          confirmAction?.type === 'delete' ? 'VERWIJDER' : 'RESET'
        }
        variant="danger"
        onConfirm={() => confirmAction && executeAction(confirmAction.type, confirmAction.entry)}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
