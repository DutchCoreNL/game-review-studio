import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { ConfirmDialog } from './ConfirmDialog';
import { SubTabBar } from './ui/SubTabBar';
import { useGame } from '@/contexts/GameContext';
import { Shield, Trash2, RotateCcw, Ban, RefreshCw, AlertTriangle, Filter, MessageCircleWarning, VolumeX, X, History, ScrollText } from 'lucide-react';

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

interface Sanction {
  id: string;
  type: string;
  reason: string;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  target_username: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

type SuspicionReason = string;

function detectSuspicion(entry: LeaderboardEntry): SuspicionReason[] {
  const reasons: SuspicionReason[] = [];
  const day = Math.max(entry.day, 1);
  if (entry.cash / day > 500_000) reasons.push(`€${Math.round(entry.cash / day).toLocaleString()}/dag`);
  if (entry.rep / day > 5000) reasons.push(`${Math.round(entry.rep / day)} REP/dag`);
  if (entry.level > day * 2 && entry.level > 5) reasons.push(`Lv.${entry.level} op dag ${day}`);
  if (entry.districts_owned > Math.min(entry.level + 1, 5)) reasons.push(`${entry.districts_owned} districten @ Lv.${entry.level}`);
  if (entry.crew_size > entry.level * 3 && entry.crew_size > 6) reasons.push(`${entry.crew_size} crew @ Lv.${entry.level}`);
  if (entry.cash > 10_000_000) reasons.push(`€${(entry.cash / 1_000_000).toFixed(1)}M cash`);
  return reasons;
}

const ACTION_LABELS: Record<string, { label: string; icon: string; variant: 'blood' | 'gold' | 'purple' | 'muted' }> = {
  delete_entry: { label: 'Verwijderd', icon: '🗑️', variant: 'blood' },
  reset_entry: { label: 'Gereset', icon: '🔄', variant: 'gold' },
  ban_player: { label: 'Gebanned', icon: '🚫', variant: 'blood' },
  warn_player: { label: 'Waarschuwing', icon: '⚠️', variant: 'gold' },
  mute_player: { label: 'Gemute', icon: '🔇', variant: 'purple' },
  revoke_sanction: { label: 'Sanctie ingetrokken', icon: '↩️', variant: 'muted' },
};

export function AdminPanel() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { showToast } = useGame();
  const [tab, setTab] = useState<'players' | 'logs'>('players');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'reset' | 'ban'; entry: LeaderboardEntry } | null>(null);
  const [filterSuspicious, setFilterSuspicious] = useState(false);
  const [sanctionPopup, setSanctionPopup] = useState<{ entry: LeaderboardEntry; mode: 'warn' | 'mute' } | null>(null);
  const [sanctionReason, setSanctionReason] = useState('');
  const [muteDuration, setMuteDuration] = useState(24);
  const [historyPopup, setHistoryPopup] = useState<{ entry: LeaderboardEntry; sanctions: Sanction[] } | null>(null);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    const { data } = await supabase.from('leaderboard_entries').select('*').order('rep', { ascending: false }).limit(100);
    setEntries((data as LeaderboardEntry[]) || []);
    setLoading(false);
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-actions', { body: { action: 'get_logs' } });
      if (error) throw error;
      setLogs(data.logs || []);
    } catch (err: any) {
      showToast(`❌ Fout: ${err.message}`, true);
    }
    setLogsLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchEntries();
  }, [isAdmin]);

  useEffect(() => {
    if (tab === 'logs' && logs.length === 0) fetchLogs();
  }, [tab]);

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
        delete: { action: 'delete_entry', entryId: entry.id, userId: entry.user_id, targetUsername: entry.username },
        reset: { action: 'reset_entry', entryId: entry.id, userId: entry.user_id, targetUsername: entry.username },
        ban: { action: 'ban_player', entryId: entry.id, userId: entry.user_id, targetUsername: entry.username },
      };
      const { error } = await supabase.functions.invoke('admin-actions', { body: actionMap[type] });
      if (error) throw error;
      showToast(`✅ ${type === 'delete' ? 'Verwijderd' : type === 'reset' ? 'Gereset' : 'Gebanned'}: ${entry.username}`);
      fetchEntries();
    } catch (err: any) {
      showToast(`❌ Fout: ${err.message}`, true);
    }
    setActionLoading(null);
    setConfirmAction(null);
  };

  const executeSanction = async () => {
    if (!sanctionPopup) return;
    setActionLoading(sanctionPopup.entry.id);
    try {
      const body: Record<string, unknown> = {
        action: sanctionPopup.mode === 'warn' ? 'warn_player' : 'mute_player',
        userId: sanctionPopup.entry.user_id,
        targetUsername: sanctionPopup.entry.username,
        reason: sanctionReason || undefined,
      };
      if (sanctionPopup.mode === 'mute') body.duration = muteDuration;
      const { error } = await supabase.functions.invoke('admin-actions', { body });
      if (error) throw error;
      showToast(`✅ ${sanctionPopup.mode === 'warn' ? 'Waarschuwing gestuurd' : `Gemute voor ${muteDuration}u`}: ${sanctionPopup.entry.username}`);
    } catch (err: any) {
      showToast(`❌ Fout: ${err.message}`, true);
    }
    setActionLoading(null);
    setSanctionPopup(null);
    setSanctionReason('');
    setMuteDuration(24);
  };

  const fetchSanctions = async (entry: LeaderboardEntry) => {
    setActionLoading(entry.id);
    try {
      const { data, error } = await supabase.functions.invoke('admin-actions', { body: { action: 'get_sanctions', userId: entry.user_id } });
      if (error) throw error;
      setHistoryPopup({ entry, sanctions: data.sanctions || [] });
    } catch (err: any) {
      showToast(`❌ Fout: ${err.message}`, true);
    }
    setActionLoading(null);
  };

  const revokeSanction = async (sanctionId: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-actions', { body: { action: 'revoke_sanction', entryId: sanctionId } });
      if (error) throw error;
      showToast('✅ Sanctie ingetrokken');
      if (historyPopup) fetchSanctions(historyPopup.entry);
    } catch (err: any) {
      showToast(`❌ Fout: ${err.message}`, true);
    }
  };

  return (
    <div>
      <SectionHeader title="Admin Paneel" icon={<Shield size={12} />} badge="ADMIN" badgeColor="blood" />

      <SubTabBar
        tabs={[
          { id: 'players', label: 'SPELERS', icon: <Shield size={10} /> },
          { id: 'logs', label: 'LOGBOEK', icon: <ScrollText size={10} /> },
        ]}
        active={tab}
        onChange={(t) => setTab(t as 'players' | 'logs')}
      />

      {tab === 'players' && (
        <>
          <div className="flex items-center justify-between mb-3 mt-2">
            <div className="flex items-center gap-2">
              <p className="text-[0.55rem] text-muted-foreground">{entries.length} spelers</p>
              {suspiciousCount > 0 && (
                <GameBadge variant="gold" size="xs"><AlertTriangle size={8} /> {suspiciousCount} verdacht</GameBadge>
              )}
            </div>
            <div className="flex gap-1">
              {suspiciousCount > 0 && (
                <GameButton variant={filterSuspicious ? 'gold' : 'muted'} size="sm" icon={<Filter size={10} />} onClick={() => setFilterSuspicious(!filterSuspicious)}>
                  {filterSuspicious ? 'ALLE' : 'VERDACHT'}
                </GameButton>
              )}
              <GameButton variant="muted" size="sm" icon={<RefreshCw size={10} />} onClick={fetchEntries}>REFRESH</GameButton>
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
                  <div key={entry.id} className={`game-card ${isSuspicious ? 'border-gold/40 bg-gold/5' : ''}`}>
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
                            {reasons.map((r, ri) => <GameBadge key={ri} variant="gold" size="xs">{r}</GameBadge>)}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        <button onClick={() => { setSanctionPopup({ entry, mode: 'warn' }); setSanctionReason(''); }} disabled={!!actionLoading}
                          className="p-1.5 rounded bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors disabled:opacity-50" title="Waarschuwing">
                          <MessageCircleWarning size={10} />
                        </button>
                        <button onClick={() => { setSanctionPopup({ entry, mode: 'mute' }); setSanctionReason(''); setMuteDuration(24); }} disabled={!!actionLoading}
                          className="p-1.5 rounded bg-ice/10 border border-ice/30 text-ice hover:bg-ice/20 transition-colors disabled:opacity-50" title="Mute">
                          <VolumeX size={10} />
                        </button>
                        <button onClick={() => fetchSanctions(entry)} disabled={!!actionLoading}
                          className="p-1.5 rounded bg-muted border border-border text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50" title="Geschiedenis">
                          <History size={10} />
                        </button>
                        <button onClick={() => setConfirmAction({ type: 'reset', entry })} disabled={!!actionLoading}
                          className="p-1.5 rounded bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors disabled:opacity-50" title="Reset stats">
                          <RotateCcw size={10} />
                        </button>
                        <button onClick={() => setConfirmAction({ type: 'delete', entry })} disabled={!!actionLoading}
                          className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20 transition-colors disabled:opacity-50" title="Verwijder">
                          <Trash2 size={10} />
                        </button>
                        <button onClick={() => setConfirmAction({ type: 'ban', entry })} disabled={!!actionLoading}
                          className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20 transition-colors disabled:opacity-50" title="Ban">
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
        </>
      )}

      {tab === 'logs' && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.55rem] text-muted-foreground">{logs.length} recente acties</p>
            <GameButton variant="muted" size="sm" icon={<RefreshCw size={10} />} onClick={fetchLogs}>REFRESH</GameButton>
          </div>
          {logsLoading ? (
            <div className="text-center py-8 text-muted-foreground text-xs">Laden...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">Nog geen admin-acties gelogd</div>
          ) : (
            <div className="space-y-1.5">
              {logs.map(log => {
                const info = ACTION_LABELS[log.action] || { label: log.action, icon: '📋', variant: 'muted' as const };
                const details = log.details as Record<string, unknown> | null;
                return (
                  <div key={log.id} className="game-card">
                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5">{info.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <GameBadge variant={info.variant} size="xs">{info.label}</GameBadge>
                          {log.target_username && (
                            <span className="text-xs font-bold">{log.target_username}</span>
                          )}
                        </div>
                        {details?.reason && (
                          <p className="text-[0.5rem] text-muted-foreground mt-0.5">"{String(details.reason)}"</p>
                        )}
                        {details?.duration && (
                          <span className="text-[0.45rem] text-muted-foreground">Duur: {String(details.duration)}u</span>
                        )}
                        <p className="text-[0.45rem] text-muted-foreground mt-0.5">
                          {new Date(log.created_at).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sanction popup */}
      {sanctionPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="game-card w-full max-w-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold flex items-center gap-1.5">
                {sanctionPopup.mode === 'warn' ? <><MessageCircleWarning size={12} className="text-gold" /> Waarschuwing</> : <><VolumeX size={12} className="text-ice" /> Mute</>}
              </h3>
              <button onClick={() => setSanctionPopup(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            <p className="text-[0.55rem] text-muted-foreground">Speler: <span className="text-foreground font-bold">{sanctionPopup.entry.username}</span></p>
            <textarea value={sanctionReason} onChange={e => setSanctionReason(e.target.value)} placeholder="Reden (optioneel)..."
              className="w-full bg-background border border-border rounded p-2 text-xs text-foreground placeholder:text-muted-foreground resize-none h-16" />
            {sanctionPopup.mode === 'mute' && (
              <div className="flex items-center gap-2">
                <span className="text-[0.55rem] text-muted-foreground">Duur:</span>
                {[1, 6, 24, 72, 168].map(h => (
                  <button key={h} onClick={() => setMuteDuration(h)}
                    className={`text-[0.5rem] px-1.5 py-0.5 rounded border font-bold transition-colors ${muteDuration === h ? 'bg-ice/20 border-ice/50 text-ice' : 'bg-muted border-border text-muted-foreground hover:text-foreground'}`}>
                    {h < 24 ? `${h}u` : `${h / 24}d`}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <GameButton variant="muted" size="sm" onClick={() => setSanctionPopup(null)} className="flex-1">ANNULEER</GameButton>
              <GameButton variant={sanctionPopup.mode === 'warn' ? 'gold' : 'purple'} size="sm" onClick={executeSanction} className="flex-1">
                {sanctionPopup.mode === 'warn' ? 'WAARSCHUW' : 'MUTE'}
              </GameButton>
            </div>
          </div>
        </div>
      )}

      {/* History popup */}
      {historyPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="game-card w-full max-w-xs space-y-3 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold flex items-center gap-1.5"><History size={12} /> Sancties: {historyPopup.entry.username}</h3>
              <button onClick={() => setHistoryPopup(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            {historyPopup.sanctions.length === 0 ? (
              <p className="text-[0.55rem] text-muted-foreground text-center py-4">Geen sancties gevonden</p>
            ) : (
              <div className="space-y-1.5">
                {historyPopup.sanctions.map(s => (
                  <div key={s.id} className={`p-2 rounded border text-[0.5rem] space-y-0.5 ${s.active ? 'border-gold/30 bg-gold/5' : 'border-border bg-muted/50 opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <GameBadge variant={s.type === 'warning' ? 'gold' : 'ice'} size="xs">{s.type === 'warning' ? '⚠️ Waarschuwing' : '🔇 Mute'}</GameBadge>
                      {s.active ? <button onClick={() => revokeSanction(s.id)} className="text-[0.45rem] text-blood hover:underline">Intrekken</button> : <span className="text-[0.45rem] text-muted-foreground">Inactief</span>}
                    </div>
                    {s.reason && <p className="text-muted-foreground">{s.reason}</p>}
                    <div className="flex gap-2 text-muted-foreground">
                      <span>{new Date(s.created_at).toLocaleDateString('nl-NL')}</span>
                      {s.expires_at && <span>Verloopt: {new Date(s.expires_at).toLocaleDateString('nl-NL')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.type === 'delete' ? 'Entry Verwijderen' : confirmAction?.type === 'reset' ? 'Stats Resetten' : 'Speler Bannen'}
        message={
          confirmAction?.type === 'delete'
            ? `Weet je zeker dat je de leaderboard entry van "${confirmAction.entry.username}" wilt verwijderen?`
            : confirmAction?.type === 'reset'
            ? `Weet je zeker dat je alle stats van "${confirmAction?.entry.username}" wilt resetten naar 0?`
            : `Weet je zeker dat je "${confirmAction?.entry.username}" permanent wilt bannen? Dit kan niet ongedaan worden.`
        }
        confirmText={confirmAction?.type === 'ban' ? 'BAN PERMANENT' : confirmAction?.type === 'delete' ? 'VERWIJDER' : 'RESET'}
        variant="danger"
        onConfirm={() => confirmAction && executeAction(confirmAction.type, confirmAction.entry)}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
