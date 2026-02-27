import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { ConfirmDialog } from './ConfirmDialog';
import { useGame } from '@/contexts/GameContext';
import { Shield, Trash2, RotateCcw, Ban, RefreshCw, AlertTriangle, Filter } from 'lucide-react';

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

type SuspicionReason = string;

function detectSuspicion(entry: LeaderboardEntry): SuspicionReason[] {
  const reasons: SuspicionReason[] = [];
  const day = Math.max(entry.day, 1);

  // Cash per dag ratio — meer dan €500k/dag is verdacht
  if (entry.cash / day > 500_000) reasons.push(`€${Math.round(entry.cash / day).toLocaleString()}/dag`);

  // Rep per dag ratio — meer dan 5000/dag is verdacht
  if (entry.rep / day > 5000) reasons.push(`${Math.round(entry.rep / day)} REP/dag`);

  // Level te hoog voor aantal dagen
  if (entry.level > day * 2 && entry.level > 5) reasons.push(`Lv.${entry.level} op dag ${day}`);

  // Meer districten dan mogelijk op dat level
  if (entry.districts_owned > Math.min(entry.level + 1, 5)) reasons.push(`${entry.districts_owned} districten @ Lv.${entry.level}`);

  // Crew groter dan verwacht
  if (entry.crew_size > entry.level * 3 && entry.crew_size > 6) reasons.push(`${entry.crew_size} crew @ Lv.${entry.level}`);

  // Extreem hoog cash
  if (entry.cash > 10_000_000) reasons.push(`€${(entry.cash / 1_000_000).toFixed(1)}M cash`);

  return reasons;
}

export function AdminPanel() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { showToast } = useGame();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'reset' | 'ban'; entry: LeaderboardEntry } | null>(null);
  const [filterSuspicious, setFilterSuspicious] = useState(false);

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

  const suspicionMap = useMemo(() => {
    const map = new Map<string, SuspicionReason[]>();
    entries.forEach(e => {
      const reasons = detectSuspicion(e);
      if (reasons.length > 0) map.set(e.id, reasons);
    });
    return map;
  }, [entries]);

  const suspiciousCount = suspicionMap.size;

  const displayEntries = useMemo(() => {
    if (!filterSuspicious) return entries;
    return entries.filter(e => suspicionMap.has(e.id));
  }, [entries, filterSuspicious, suspicionMap]);

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
        <div className="flex items-center gap-2">
          <p className="text-[0.55rem] text-muted-foreground">
            {entries.length} spelers
          </p>
          {suspiciousCount > 0 && (
            <GameBadge variant="gold" size="xs">
              <AlertTriangle size={8} /> {suspiciousCount} verdacht
            </GameBadge>
          )}
        </div>
        <div className="flex gap-1">
          {suspiciousCount > 0 && (
            <GameButton
              variant={filterSuspicious ? 'gold' : 'muted'}
              size="sm"
              icon={<Filter size={10} />}
              onClick={() => setFilterSuspicious(!filterSuspicious)}
            >
              {filterSuspicious ? 'ALLE' : 'VERDACHT'}
            </GameButton>
          )}
          <GameButton variant="muted" size="sm" icon={<RefreshCw size={10} />} onClick={fetchEntries}>
            REFRESH
          </GameButton>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-xs">Laden...</div>
      ) : (
        <div className="space-y-1.5">
          {displayEntries.map((entry, i) => {
            const reasons = suspicionMap.get(entry.id);
            const isSuspicious = !!reasons;
            return (
              <div
                key={entry.id}
                className={`game-card ${isSuspicious ? 'border-gold/40 bg-gold/5' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[0.55rem] text-muted-foreground font-bold w-6">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {isSuspicious && <AlertTriangle size={10} className="text-gold shrink-0" />}
                      <span className="text-xs font-bold truncate">{entry.username}</span>
                      <span className="text-[0.45rem] text-muted-foreground">Lv.{entry.level}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[0.45rem] text-muted-foreground">
                      <span>REP {entry.rep}</span>
                      <span>€{entry.cash.toLocaleString()}</span>
                      <span>Dag {entry.day}</span>
                      <span>🏠{entry.districts_owned}</span>
                    </div>
                    {isSuspicious && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {reasons.map((r, ri) => (
                          <GameBadge key={ri} variant="gold" size="xs">{r}</GameBadge>
                        ))}
                      </div>
                    )}
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
            );
          })}
          {displayEntries.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-xs">
              {filterSuspicious ? 'Geen verdachte spelers gevonden 🎉' : 'Geen entries gevonden'}
            </div>
          )}
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
