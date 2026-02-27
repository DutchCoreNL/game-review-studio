import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { ConfirmDialog } from './ConfirmDialog';
import { SubTabBar } from './ui/SubTabBar';
import { useGame } from '@/contexts/GameContext';
import { Shield, Trash2, RotateCcw, Ban, RefreshCw, AlertTriangle, Filter, MessageCircleWarning, VolumeX, X, History, ScrollText, Pencil, Bot, Globe, Send, TrendingUp, User, MapPin, Shuffle, Plus, Search, Zap, CloudRain, Heart, DollarSign, Bomb, Newspaper, Swords, Clock, Calendar } from 'lucide-react';
import { WEEK_EVENTS } from '@/game/weekEvents';
import type { ActiveWeekEvent } from '@/game/weekEvents';
import { ViewWrapper } from './ui/ViewWrapper';

// ====== TYPES ======

interface LeaderboardEntry {
  id: string; user_id: string; username: string; rep: number; cash: number; day: number;
  level: number; districts_owned: number; crew_size: number; karma: number; updated_at: string;
}
interface Sanction { id: string; type: string; reason: string; active: boolean; expires_at: string | null; created_at: string; }
interface AdminLog { id: string; admin_id: string; action: string; target_user_id: string | null; target_username: string | null; details: Record<string, unknown> | null; created_at: string; }
interface BotPlayer { id: string; username: string; level: number; hp: number; max_hp: number; cash: number; rep: number; loc: string; is_active: boolean; karma: number; crew_size: number; districts_owned: number; day: number; backstory: string | null; }
interface MarketPrice { id: string; good_id: string; district_id: string; current_price: number; price_trend: string; buy_volume: number; sell_volume: number; }
interface WorldStats { total_players: number; active_states: number; total_cash: number; avg_level: number; district_counts: Record<string, number>; gangs: { id: string; name: string; tag: string; level: number; treasury: number; member_count: number }[]; active_wars: unknown[]; }

type TabId = 'players' | 'economy' | 'bots' | 'world' | 'messages' | 'logs';
type SuspicionReason = string;

const DISTRICTS = ['low', 'port', 'neon', 'iron', 'crown'];
const DISTRICT_LABELS: Record<string, string> = { low: 'Lowtown', port: 'De Haven', neon: 'Neon Mile', iron: 'IJzerbuurt', crown: 'De Kroon' };
const TREND_OPTIONS = ['rising', 'stable', 'falling', 'volatile'];

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

const ACTION_LABELS: Record<string, { label: string; icon: string; variant: 'blood' | 'gold' | 'purple' | 'muted' | 'emerald' }> = {
  delete_entry: { label: 'Verwijderd', icon: '🗑️', variant: 'blood' },
  reset_entry: { label: 'Gereset', icon: '🔄', variant: 'gold' },
  ban_player: { label: 'Gebanned', icon: '🚫', variant: 'blood' },
  warn_player: { label: 'Waarschuwing', icon: '⚠️', variant: 'gold' },
  mute_player: { label: 'Gemute', icon: '🔇', variant: 'purple' },
  revoke_sanction: { label: 'Sanctie ingetrokken', icon: '↩️', variant: 'muted' },
  edit_entry: { label: 'Aangepast', icon: '✏️', variant: 'emerald' },
  edit_player_state: { label: 'State gewijzigd', icon: '🎮', variant: 'emerald' },
  edit_market_price: { label: 'Prijs gewijzigd', icon: '💹', variant: 'gold' },
  bulk_update_prices: { label: 'Bulk prijzen', icon: '📊', variant: 'gold' },
  edit_bot: { label: 'Bot aangepast', icon: '🤖', variant: 'emerald' },
  delete_bot: { label: 'Bot verwijderd', icon: '🗑️', variant: 'blood' },
  create_bot: { label: 'Bot aangemaakt', icon: '➕', variant: 'emerald' },
  randomize_bot_locations: { label: 'Bots verplaatst', icon: '🔀', variant: 'purple' },
  send_message: { label: 'Bericht gestuurd', icon: '💬', variant: 'muted' },
  send_broadcast: { label: 'Broadcast', icon: '📢', variant: 'gold' },
  global_reset: { label: 'Globale Reset', icon: '💀', variant: 'blood' },
  force_world_tick: { label: 'World Tick', icon: '⚡', variant: 'purple' },
  clear_news: { label: 'Nieuws gewist', icon: '📰', variant: 'muted' },
  grant_cash: { label: 'Cash gegeven', icon: '💰', variant: 'emerald' },
  grant_xp: { label: 'XP gegeven', icon: '⭐', variant: 'emerald' },
  heal_all_players: { label: 'Alle geheald', icon: '💚', variant: 'emerald' },
  set_weather: { label: 'Weer gewijzigd', icon: '🌦️', variant: 'purple' },
  trigger_event: { label: 'Event getriggerd', icon: '📢', variant: 'gold' },
  activate_week_event: { label: 'Week event', icon: '📅', variant: 'gold' },
  deactivate_week_event: { label: 'Event gestopt', icon: '⏹️', variant: 'muted' },
};

// ====== HELPER: admin API call ======
async function adminCall(action: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('admin-actions', { body: { action, ...extra } });
  if (error) throw error;
  return data;
}

// ====== MAIN COMPONENT ======
export function AdminPanel() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { showToast } = useGame();
  const [tab, setTab] = useState<TabId>('players');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // -- Players tab state --
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'reset' | 'ban'; entry: LeaderboardEntry } | null>(null);
  const [filterSuspicious, setFilterSuspicious] = useState(false);
  const [sanctionPopup, setSanctionPopup] = useState<{ entry: LeaderboardEntry; mode: 'warn' | 'mute' } | null>(null);
  const [sanctionReason, setSanctionReason] = useState('');
  const [muteDuration, setMuteDuration] = useState(24);
  const [historyPopup, setHistoryPopup] = useState<{ entry: LeaderboardEntry; sanctions: Sanction[] } | null>(null);
  const [editPopup, setEditPopup] = useState<LeaderboardEntry | null>(null);
  const [editStats, setEditStats] = useState<Record<string, number | string>>({});
  // Player state detail
  const [playerStatePopup, setPlayerStatePopup] = useState<{ entry: LeaderboardEntry; state: Record<string, unknown> | null } | null>(null);
  const [playerStateEdits, setPlayerStateEdits] = useState<Record<string, unknown>>({});

  // -- Economy tab state --
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [priceEditId, setPriceEditId] = useState<string | null>(null);
  const [priceEditVals, setPriceEditVals] = useState<{ current_price: number; price_trend: string }>({ current_price: 0, price_trend: 'stable' });
  const [multiplier, setMultiplier] = useState('1.0');

  // -- Bots tab state --
  const [bots, setBots] = useState<BotPlayer[]>([]);
  const [botsLoading, setBotsLoading] = useState(false);
  const [botEditId, setBotEditId] = useState<string | null>(null);
  const [botEditVals, setBotEditVals] = useState<Record<string, unknown>>({});
  const [showNewBot, setShowNewBot] = useState(false);
  const [newBotName, setNewBotName] = useState('');

  // -- World tab state --
  const [worldStats, setWorldStats] = useState<WorldStats | null>(null);
  const [worldLoading, setWorldLoading] = useState(false);
  const [confirmGlobalReset, setConfirmGlobalReset] = useState(false);
  const [maintenanceOn, setMaintenanceOn] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [eventForm, setEventForm] = useState({ title: '', description: '', district_id: 'low', duration: 60 });
  const [teleportPopup, setTeleportPopup] = useState<LeaderboardEntry | null>(null);
  const [teleportDistrict, setTeleportDistrict] = useState('low');
  const [grantTarget, setGrantTarget] = useState('');
  const [grantAmount, setGrantAmount] = useState(10000);
  const [grantType, setGrantType] = useState<'cash' | 'xp'>('cash');

  // -- Messages tab state --
  const [msgMode, setMsgMode] = useState<'single' | 'broadcast'>('broadcast');
  const [msgReceiver, setMsgReceiver] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSending, setMsgSending] = useState(false);

  // -- Logs tab state --
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ====== FETCH HELPERS ======
  const fetchEntries = async () => { setLoading(true); const { data } = await supabase.from('leaderboard_entries').select('*').order('rep', { ascending: false }).limit(100); setEntries((data as LeaderboardEntry[]) || []); setLoading(false); };
  const fetchLogs = async () => { setLogsLoading(true); try { const d = await adminCall('get_logs'); setLogs(d.logs || []); } catch (e: any) { showToast(`❌ ${e.message}`, true); } setLogsLoading(false); };
  const fetchPrices = async () => { setPricesLoading(true); try { const d = await adminCall('get_market_prices'); setPrices(d.prices || []); } catch (e: any) { showToast(`❌ ${e.message}`, true); } setPricesLoading(false); };
  const fetchBots = async () => { setBotsLoading(true); try { const d = await adminCall('get_bots'); setBots(d.bots || []); } catch (e: any) { showToast(`❌ ${e.message}`, true); } setBotsLoading(false); };
  const fetchWorldStats = async () => {
    setWorldLoading(true);
    try {
      const [d, m] = await Promise.all([adminCall('get_world_stats'), adminCall('get_maintenance')]);
      setWorldStats(d.stats);
      setMaintenanceOn(!!m.maintenance_mode);
      setMaintenanceMsg(m.maintenance_message || '');
    } catch (e: any) { showToast(`❌ ${e.message}`, true); }
    setWorldLoading(false);
  };

  useEffect(() => { if (isAdmin) fetchEntries(); }, [isAdmin]);
  useEffect(() => {
    if (tab === 'logs' && logs.length === 0) fetchLogs();
    if (tab === 'economy' && prices.length === 0) fetchPrices();
    if (tab === 'bots' && bots.length === 0) fetchBots();
    if (tab === 'world' && !worldStats) fetchWorldStats();
  }, [tab]);

  const suspicionMap = useMemo(() => { const m = new Map<string, SuspicionReason[]>(); entries.forEach(e => { const r = detectSuspicion(e); if (r.length > 0) m.set(e.id, r); }); return m; }, [entries]);
  const suspiciousCount = suspicionMap.size;
  const displayEntries = useMemo(() => filterSuspicious ? entries.filter(e => suspicionMap.has(e.id)) : entries, [entries, filterSuspicious, suspicionMap]);

  if (adminLoading) return <div className="text-center py-8 text-muted-foreground text-xs">Laden...</div>;
  if (!isAdmin) return null;

  // ====== PLAYER ACTIONS ======
  const executeAction = async (type: string, entry: LeaderboardEntry) => {
    setActionLoading(entry.id);
    try {
      const map: Record<string, object> = {
        delete: { action: 'delete_entry', entryId: entry.id, userId: entry.user_id, targetUsername: entry.username },
        reset: { action: 'reset_entry', entryId: entry.id, userId: entry.user_id, targetUsername: entry.username },
        ban: { action: 'ban_player', entryId: entry.id, userId: entry.user_id, targetUsername: entry.username },
      };
      const { error } = await supabase.functions.invoke('admin-actions', { body: map[type] });
      if (error) throw error;
      showToast(`✅ ${type === 'delete' ? 'Verwijderd' : type === 'reset' ? 'Gereset' : 'Gebanned'}: ${entry.username}`);
      fetchEntries();
    } catch (err: any) { showToast(`❌ ${err.message}`, true); }
    setActionLoading(null); setConfirmAction(null);
  };

  const executeSanction = async () => {
    if (!sanctionPopup) return;
    setActionLoading(sanctionPopup.entry.id);
    try {
      const b: Record<string, unknown> = { action: sanctionPopup.mode === 'warn' ? 'warn_player' : 'mute_player', userId: sanctionPopup.entry.user_id, targetUsername: sanctionPopup.entry.username, reason: sanctionReason || undefined };
      if (sanctionPopup.mode === 'mute') b.duration = muteDuration;
      const { error } = await supabase.functions.invoke('admin-actions', { body: b });
      if (error) throw error;
      showToast(`✅ ${sanctionPopup.mode === 'warn' ? 'Waarschuwing' : `Gemute ${muteDuration}u`}: ${sanctionPopup.entry.username}`);
    } catch (err: any) { showToast(`❌ ${err.message}`, true); }
    setActionLoading(null); setSanctionPopup(null); setSanctionReason(''); setMuteDuration(24);
  };

  const fetchSanctions = async (entry: LeaderboardEntry) => {
    setActionLoading(entry.id);
    try { const d = await adminCall('get_sanctions', { userId: entry.user_id }); setHistoryPopup({ entry, sanctions: d.sanctions || [] }); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
    setActionLoading(null);
  };

  const revokeSanction = async (sid: string) => {
    try { await adminCall('revoke_sanction', { entryId: sid }); showToast('✅ Sanctie ingetrokken'); if (historyPopup) fetchSanctions(historyPopup.entry); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
  };

  const openPlayerState = async (entry: LeaderboardEntry) => {
    setActionLoading(entry.id);
    try { const d = await adminCall('get_player_state', { userId: entry.user_id }); setPlayerStatePopup({ entry, state: d.player_state }); setPlayerStateEdits({}); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
    setActionLoading(null);
  };

  const savePlayerState = async () => {
    if (!playerStatePopup) return;
    try {
      await adminCall('edit_player_state', { userId: playerStatePopup.entry.user_id, targetUsername: playerStatePopup.entry.username, stats: playerStateEdits });
      showToast('✅ Player state opgeslagen');
      setPlayerStatePopup(null);
    } catch (e: any) { showToast(`❌ ${e.message}`, true); }
  };

  // ====== RENDER ======
  return (
    <ViewWrapper>
      <SectionHeader title="Admin Paneel" icon={<Shield size={12} />} badge="ADMIN" badgeColor="blood" />

      <SubTabBar
        tabs={[
          { id: 'players', label: 'SPELERS', icon: <User size={10} /> },
          { id: 'economy', label: 'ECONOMIE', icon: <TrendingUp size={10} /> },
          { id: 'bots', label: 'BOTS', icon: <Bot size={10} /> },
          { id: 'world', label: 'WERELD', icon: <Globe size={10} /> },
          { id: 'messages', label: 'BERICHTEN', icon: <Send size={10} /> },
          { id: 'logs', label: 'LOGBOEK', icon: <ScrollText size={10} /> },
        ]}
        active={tab}
        onChange={(t) => setTab(t as TabId)}
      />

      {/* ======== SPELERS TAB ======== */}
      {tab === 'players' && (
        <>
          <div className="flex items-center justify-between mb-3 mt-2">
            <div className="flex items-center gap-2">
              <p className="text-[0.55rem] text-muted-foreground">{entries.length} spelers</p>
              {suspiciousCount > 0 && <GameBadge variant="gold" size="xs"><AlertTriangle size={8} /> {suspiciousCount} verdacht</GameBadge>}
            </div>
            <div className="flex gap-1">
              {suspiciousCount > 0 && <GameButton variant={filterSuspicious ? 'gold' : 'muted'} size="sm" icon={<Filter size={10} />} onClick={() => setFilterSuspicious(!filterSuspicious)}>{filterSuspicious ? 'ALLE' : 'VERDACHT'}</GameButton>}
              <GameButton variant="muted" size="sm" icon={<RefreshCw size={10} />} onClick={fetchEntries}>REFRESH</GameButton>
            </div>
          </div>
          {loading ? <div className="text-center py-8 text-muted-foreground text-xs">Laden...</div> : (
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
                          <span>REP {entry.rep}</span><span>€{entry.cash.toLocaleString()}</span><span>Dag {entry.day}</span><span>🏠{entry.districts_owned}</span>
                        </div>
                        {isSuspicious && <div className="flex flex-wrap gap-1 mt-1">{reasons.map((r, ri) => <GameBadge key={ri} variant="gold" size="xs">{r}</GameBadge>)}</div>}
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        <button onClick={() => openPlayerState(entry)} disabled={!!actionLoading} className="p-1.5 rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50" title="Player State"><Search size={10} /></button>
                        <button onClick={() => { setEditPopup(entry); setEditStats({ username: entry.username, rep: entry.rep, cash: entry.cash, day: entry.day, level: entry.level, districts_owned: entry.districts_owned, crew_size: entry.crew_size, karma: entry.karma }); }} disabled={!!actionLoading} className="p-1.5 rounded bg-emerald/10 border border-emerald/30 text-emerald hover:bg-emerald/20 transition-colors disabled:opacity-50" title="Bewerk"><Pencil size={10} /></button>
                        <button onClick={() => { setSanctionPopup({ entry, mode: 'warn' }); setSanctionReason(''); }} disabled={!!actionLoading} className="p-1.5 rounded bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors disabled:opacity-50" title="Waarschuwing"><MessageCircleWarning size={10} /></button>
                        <button onClick={() => { setSanctionPopup({ entry, mode: 'mute' }); setSanctionReason(''); setMuteDuration(24); }} disabled={!!actionLoading} className="p-1.5 rounded bg-ice/10 border border-ice/30 text-ice hover:bg-ice/20 transition-colors disabled:opacity-50" title="Mute"><VolumeX size={10} /></button>
                        <button onClick={() => fetchSanctions(entry)} disabled={!!actionLoading} className="p-1.5 rounded bg-muted border border-border text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50" title="Geschiedenis"><History size={10} /></button>
                        <button onClick={() => setConfirmAction({ type: 'reset', entry })} disabled={!!actionLoading} className="p-1.5 rounded bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-colors disabled:opacity-50" title="Reset"><RotateCcw size={10} /></button>
                        <button onClick={() => setConfirmAction({ type: 'delete', entry })} disabled={!!actionLoading} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20 transition-colors disabled:opacity-50" title="Verwijder"><Trash2 size={10} /></button>
                        <button onClick={() => setConfirmAction({ type: 'ban', entry })} disabled={!!actionLoading} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20 transition-colors disabled:opacity-50" title="Ban"><Ban size={10} /></button>
                        <button onClick={() => { setTeleportPopup(entry); setTeleportDistrict('low'); }} disabled={!!actionLoading} className="p-1.5 rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50" title="Teleporteer"><MapPin size={10} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {displayEntries.length === 0 && <div className="text-center py-6 text-muted-foreground text-xs">{filterSuspicious ? 'Geen verdachte spelers 🎉' : 'Geen entries'}</div>}
            </div>
          )}
        </>
      )}

      {/* ======== ECONOMIE TAB ======== */}
      {tab === 'economy' && (
        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[0.55rem] text-muted-foreground">{prices.length} prijzen</p>
            <GameButton variant="muted" size="sm" icon={<RefreshCw size={10} />} onClick={fetchPrices}>REFRESH</GameButton>
          </div>

          {/* Bulk multiplier */}
          <div className="game-card">
            <p className="text-[0.5rem] font-bold text-muted-foreground mb-1.5">GLOBALE PRIJSMULTIPLICATOR</p>
            <div className="flex items-center gap-2">
              {['0.5', '0.75', '1.0', '1.25', '1.5', '2.0'].map(v => (
                <button key={v} onClick={() => setMultiplier(v)} className={`text-[0.5rem] px-2 py-1 rounded border font-bold ${multiplier === v ? 'bg-gold/20 border-gold/50 text-gold' : 'bg-muted border-border text-muted-foreground'}`}>x{v}</button>
              ))}
              <GameButton variant="gold" size="sm" onClick={async () => {
                try { await adminCall('bulk_update_prices', { multiplier: parseFloat(multiplier) }); showToast(`✅ Prijzen x${multiplier}`); fetchPrices(); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
              }}>TOEPASSEN</GameButton>
            </div>
          </div>

          {pricesLoading ? <div className="text-center py-8 text-muted-foreground text-xs">Laden...</div> : (
            <div className="space-y-1">
              {prices.map(p => (
                <div key={p.id} className="game-card flex items-center gap-2 text-[0.5rem]">
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs">{p.good_id}</span>
                    <span className="text-muted-foreground ml-1.5">{DISTRICT_LABELS[p.district_id] || p.district_id}</span>
                  </div>
                  {priceEditId === p.id ? (
                    <div className="flex items-center gap-1">
                      <input type="number" value={priceEditVals.current_price} onChange={e => setPriceEditVals(v => ({ ...v, current_price: Number(e.target.value) }))} className="w-16 bg-background border border-border rounded px-1 py-0.5 text-xs" />
                      <select value={priceEditVals.price_trend} onChange={e => setPriceEditVals(v => ({ ...v, price_trend: e.target.value }))} className="bg-background border border-border rounded px-1 py-0.5 text-xs">
                        {TREND_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <GameButton variant="emerald" size="sm" onClick={async () => {
                        try { await adminCall('edit_market_price', { priceId: p.id, ...priceEditVals }); showToast('✅ Prijs opgeslagen'); setPriceEditId(null); fetchPrices(); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                      }}>✓</GameButton>
                      <button onClick={() => setPriceEditId(null)} className="text-muted-foreground hover:text-foreground"><X size={10} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">€{p.current_price.toLocaleString()}</span>
                      <GameBadge variant={p.price_trend === 'rising' ? 'emerald' : p.price_trend === 'falling' ? 'blood' : p.price_trend === 'volatile' ? 'gold' : 'muted'} size="xs">{p.price_trend}</GameBadge>
                      <button onClick={() => { setPriceEditId(p.id); setPriceEditVals({ current_price: p.current_price, price_trend: p.price_trend }); }} className="text-muted-foreground hover:text-foreground"><Pencil size={10} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======== BOTS TAB ======== */}
      {tab === 'bots' && (
        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[0.55rem] text-muted-foreground">{bots.length} bots</p>
            <div className="flex gap-1">
              <GameButton variant="purple" size="sm" icon={<Shuffle size={10} />} onClick={async () => {
                try { await adminCall('randomize_bot_locations'); showToast('✅ Bot locaties gerandomized'); fetchBots(); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
              }}>SHUFFLE</GameButton>
              <GameButton variant="emerald" size="sm" icon={<Plus size={10} />} onClick={() => setShowNewBot(true)}>NIEUW</GameButton>
              <GameButton variant="muted" size="sm" icon={<RefreshCw size={10} />} onClick={fetchBots}>REFRESH</GameButton>
            </div>
          </div>

          {/* New bot form */}
          {showNewBot && (
            <div className="game-card space-y-2">
              <p className="text-[0.5rem] font-bold text-muted-foreground">NIEUWE BOT</p>
              <input value={newBotName} onChange={e => setNewBotName(e.target.value)} placeholder="Username..." className="w-full bg-background border border-border rounded px-2 py-1 text-xs" />
              <div className="flex gap-2">
                <GameButton variant="muted" size="sm" onClick={() => { setShowNewBot(false); setNewBotName(''); }}>ANNULEER</GameButton>
                <GameButton variant="emerald" size="sm" onClick={async () => {
                  if (!newBotName.trim()) return;
                  try { await adminCall('create_bot', { stats: { username: newBotName.trim() } }); showToast('✅ Bot aangemaakt'); setShowNewBot(false); setNewBotName(''); fetchBots(); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                }}>AANMAKEN</GameButton>
              </div>
            </div>
          )}

          {botsLoading ? <div className="text-center py-8 text-muted-foreground text-xs">Laden...</div> : (
            <div className="space-y-1">
              {bots.map(bot => (
                <div key={bot.id} className={`game-card ${!bot.is_active ? 'opacity-50' : ''}`}>
                  {botEditId === bot.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { key: 'username', label: 'Naam', type: 'text' },
                          { key: 'level', label: 'Level', type: 'number' },
                          { key: 'cash', label: 'Cash', type: 'number' },
                          { key: 'rep', label: 'REP', type: 'number' },
                          { key: 'hp', label: 'HP', type: 'number' },
                          { key: 'karma', label: 'Karma', type: 'number' },
                        ].map(f => (
                          <div key={f.key} className="flex items-center gap-1">
                            <label className="text-[0.45rem] text-muted-foreground w-10 shrink-0">{f.label}</label>
                            <input type={f.type} value={String(botEditVals[f.key] ?? '')} onChange={e => setBotEditVals(v => ({ ...v, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))} className="flex-1 bg-background border border-border rounded px-1.5 py-0.5 text-[0.5rem]" />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[0.45rem] text-muted-foreground">District:</label>
                        <select value={String(botEditVals.loc || bot.loc)} onChange={e => setBotEditVals(v => ({ ...v, loc: e.target.value }))} className="bg-background border border-border rounded px-1.5 py-0.5 text-[0.5rem]">
                          {DISTRICTS.map(d => <option key={d} value={d}>{DISTRICT_LABELS[d]}</option>)}
                        </select>
                        <label className="text-[0.45rem] text-muted-foreground ml-2">Actief:</label>
                        <input type="checkbox" checked={!!botEditVals.is_active} onChange={e => setBotEditVals(v => ({ ...v, is_active: e.target.checked }))} />
                      </div>
                      <div className="flex gap-2">
                        <GameButton variant="muted" size="sm" onClick={() => setBotEditId(null)}>ANNULEER</GameButton>
                        <GameButton variant="emerald" size="sm" onClick={async () => {
                          try { await adminCall('edit_bot', { botId: bot.id, stats: botEditVals }); showToast('✅ Bot opgeslagen'); setBotEditId(null); fetchBots(); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                        }}>OPSLAAN</GameButton>
                        <GameButton variant="blood" size="sm" onClick={async () => {
                          try { await adminCall('delete_bot', { botId: bot.id }); showToast('✅ Bot verwijderd'); setBotEditId(null); fetchBots(); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                        }}>VERWIJDER</GameButton>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate">{bot.username}</span>
                          <span className="text-[0.45rem] text-muted-foreground">Lv.{bot.level}</span>
                          {!bot.is_active && <GameBadge variant="muted" size="xs">INACTIEF</GameBadge>}
                        </div>
                        <div className="flex items-center gap-2 text-[0.45rem] text-muted-foreground">
                          <span>€{Number(bot.cash).toLocaleString()}</span><span>REP {bot.rep}</span><span><MapPin size={8} className="inline" /> {DISTRICT_LABELS[bot.loc]}</span>
                        </div>
                      </div>
                      <button onClick={() => { setBotEditId(bot.id); setBotEditVals({ username: bot.username, level: bot.level, cash: bot.cash, rep: bot.rep, hp: bot.hp, karma: bot.karma, loc: bot.loc, is_active: bot.is_active }); }} className="p-1.5 rounded bg-muted border border-border text-muted-foreground hover:text-foreground"><Pencil size={10} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======== WERELD TAB ======== */}
      {tab === 'world' && (
        <div className="mt-2 space-y-3">
          <div className="flex justify-end gap-1.5">
            <GameButton variant="muted" size="sm" icon={<RefreshCw size={10} />} onClick={fetchWorldStats}>REFRESH</GameButton>
          </div>

          {/* ====== ADMIN ACTIES ====== */}
          {/* Maintenance mode toggle */}
          <div className={`game-card ${maintenanceOn ? 'border-gold/50 bg-gold/5' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[0.5rem] font-bold text-muted-foreground">🔧 ONDERHOUDSMODUS</p>
              <button
                onClick={async () => {
                  const newState = !maintenanceOn;
                  try {
                    await adminCall('set_maintenance', { enabled: newState, message: maintenanceMsg || null });
                    setMaintenanceOn(newState);
                    showToast(newState ? '🔧 Onderhoudsmodus AAN' : '✅ Onderhoudsmodus UIT');
                  } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                }}
                className={`relative w-10 h-5 rounded-full transition-colors ${maintenanceOn ? 'bg-gold' : 'bg-muted'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform ${maintenanceOn ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <input
              value={maintenanceMsg}
              onChange={e => setMaintenanceMsg(e.target.value)}
              placeholder="Optioneel bericht voor spelers..."
              className="w-full bg-background border border-border rounded px-2 py-1 text-xs"
            />
            {maintenanceOn && (
              <p className="text-[0.45rem] text-gold mt-1.5">⚠️ Alle niet-admin spelers zien nu het onderhoudsscherm</p>
            )}
          </div>

          <div className="game-card border-blood/30">
            <p className="text-[0.5rem] font-bold text-blood mb-2">⚡ ADMIN ACTIES</p>
            <div className="grid grid-cols-2 gap-1.5">
              <GameButton variant="purple" size="sm" icon={<Zap size={10} />} onClick={async () => {
                setActionLoading('world_tick');
                try { const r = await adminCall('force_world_tick'); showToast(`✅ ${r.message}`); fetchWorldStats(); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                setActionLoading(null);
              }} disabled={actionLoading === 'world_tick'}>
                FORCE TICK
              </GameButton>
              <GameButton variant="emerald" size="sm" icon={<Heart size={10} />} onClick={async () => {
                setActionLoading('heal_all');
                try { const r = await adminCall('heal_all_players'); showToast(`✅ ${r.message}`); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                setActionLoading(null);
              }} disabled={actionLoading === 'heal_all'}>
                HEAL IEDEREEN
              </GameButton>
              <GameButton variant="muted" size="sm" icon={<Newspaper size={10} />} onClick={async () => {
                setActionLoading('clear_news');
                try { const r = await adminCall('clear_news'); showToast(`✅ ${r.message}`); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                setActionLoading(null);
              }} disabled={actionLoading === 'clear_news'}>
                WIS NIEUWS
              </GameButton>
              <GameButton variant="blood" size="sm" icon={<Bomb size={10} />} onClick={() => setConfirmGlobalReset(true)}>
                GLOBAL RESET
              </GameButton>
            </div>
          </div>

          {/* Week Event Activation */}
          <div className="game-card border-gold/30">
            <p className="text-[0.5rem] font-bold text-gold mb-2">📅 WEEK EVENT ACTIVEREN</p>
            <div className="space-y-1.5">
              {WEEK_EVENTS.map(evt => (
                <button
                  key={evt.id}
                  className="w-full text-left bg-muted/50 hover:bg-muted rounded px-2 py-1.5 transition-colors group"
                  onClick={async () => {
                    const eventData = {
                      eventId: evt.id,
                      name: evt.name,
                      icon: evt.icon,
                      desc: evt.desc,
                      startDay: 0,
                      daysLeft: evt.duration,
                      effects: evt.effects,
                      claimed: false,
                      durationDays: evt.duration,
                    };
                    try {
                      const r = await adminCall('activate_week_event', { eventData });
                      showToast(`✅ ${r.message}`);
                    } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{evt.icon}</span>
                    <span className="text-[0.55rem] font-bold group-hover:text-gold transition-colors">{evt.name}</span>
                    <span className="text-[0.4rem] text-muted-foreground ml-auto">{evt.duration}d</span>
                  </div>
                  <p className="text-[0.4rem] text-muted-foreground mt-0.5 line-clamp-1">{evt.desc}</p>
                </button>
              ))}
              <GameButton variant="muted" size="sm" icon={<X size={10} />} onClick={async () => {
                try { const r = await adminCall('deactivate_week_event'); showToast(`✅ ${r.message}`); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
              }}>
                DEACTIVEER HUIDIG EVENT
              </GameButton>
            </div>
          </div>

          {/* Weather control */}
          <div className="game-card">
            <p className="text-[0.5rem] font-bold text-muted-foreground mb-2">🌦️ WEER INSTELLEN</p>
            <div className="flex gap-1 flex-wrap">
              {['clear', 'rain', 'fog', 'heatwave', 'storm'].map(w => (
                <GameButton key={w} variant="muted" size="sm" onClick={async () => {
                  try { const r = await adminCall('set_weather', { weather: w }); showToast(`✅ ${r.message}`); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                }}>
                  {w === 'clear' ? '☀️' : w === 'rain' ? '🌧️' : w === 'fog' ? '🌫️' : w === 'heatwave' ? '🌡️' : '⛈️'} {w}
                </GameButton>
              ))}
            </div>
          </div>

          {/* Grant to player */}
          <div className="game-card">
            <p className="text-[0.5rem] font-bold text-muted-foreground mb-2">🎁 GEEF AAN SPELER</p>
            <div className="space-y-1.5">
              <input value={grantTarget} onChange={e => setGrantTarget(e.target.value)} placeholder="User ID..." className="w-full bg-background border border-border rounded px-2 py-1 text-xs" />
              <div className="flex gap-1.5">
                <select value={grantType} onChange={e => setGrantType(e.target.value as 'cash' | 'xp')} className="bg-background border border-border rounded px-2 py-1 text-xs">
                  <option value="cash">💰 Cash</option>
                  <option value="xp">⭐ XP</option>
                </select>
                <input type="number" value={grantAmount} onChange={e => setGrantAmount(Number(e.target.value))} className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs" />
                <GameButton variant="emerald" size="sm" onClick={async () => {
                  if (!grantTarget.trim()) { showToast('❌ Vul user ID in', true); return; }
                  try { const r = await adminCall(grantType === 'cash' ? 'grant_cash' : 'grant_xp', { userId: grantTarget.trim(), targetUsername: 'admin-grant', amount: grantAmount }); showToast(`✅ ${r.message}`); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                }}>GEEF</GameButton>
              </div>
            </div>
          </div>

          {/* Trigger custom event */}
          <div className="game-card">
            <p className="text-[0.5rem] font-bold text-muted-foreground mb-2">📢 TRIGGER EVENT</p>
            <div className="space-y-1.5">
              <input value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))} placeholder="Event titel..." className="w-full bg-background border border-border rounded px-2 py-1 text-xs" />
              <textarea value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))} placeholder="Beschrijving..." className="w-full bg-background border border-border rounded p-2 text-xs h-12 resize-none" />
              <div className="flex gap-1.5">
                <select value={eventForm.district_id} onChange={e => setEventForm(p => ({ ...p, district_id: e.target.value }))} className="bg-background border border-border rounded px-2 py-1 text-xs">
                  {DISTRICTS.map(d => <option key={d} value={d}>{DISTRICT_LABELS[d]}</option>)}
                  <option value="all">Alle districten</option>
                </select>
                <select value={eventForm.duration} onChange={e => setEventForm(p => ({ ...p, duration: Number(e.target.value) }))} className="bg-background border border-border rounded px-2 py-1 text-xs">
                  <option value={30}>30 min</option>
                  <option value={60}>1 uur</option>
                  <option value={180}>3 uur</option>
                  <option value={720}>12 uur</option>
                  <option value={1440}>24 uur</option>
                </select>
                <GameButton variant="gold" size="sm" icon={<Zap size={10} />} disabled={!eventForm.title.trim()} onClick={async () => {
                  try {
                    const r = await adminCall('trigger_event', { title: eventForm.title, description: eventForm.description, district_id: eventForm.district_id, duration_minutes: eventForm.duration });
                    showToast(`✅ ${r.message}`);
                    setEventForm({ title: '', description: '', district_id: 'low', duration: 60 });
                  } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                }}>TRIGGER</GameButton>
              </div>
            </div>
          </div>

          {worldLoading || !worldStats ? <div className="text-center py-8 text-muted-foreground text-xs">Laden...</div> : (
            <>
              {/* Server stats */}
              <div className="game-card">
                <p className="text-[0.5rem] font-bold text-muted-foreground mb-2">SERVER STATISTIEKEN</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Actieve spelers', value: worldStats.active_states },
                    { label: 'Leaderboard entries', value: worldStats.total_players },
                    { label: 'Totaal cash in omloop', value: `€${worldStats.total_cash.toLocaleString()}` },
                    { label: 'Gemiddeld level', value: worldStats.avg_level },
                  ].map(s => (
                    <div key={s.label} className="bg-muted/50 rounded px-2 py-1.5">
                      <p className="text-[0.45rem] text-muted-foreground">{s.label}</p>
                      <p className="text-xs font-bold">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* District counts */}
              <div className="game-card">
                <p className="text-[0.5rem] font-bold text-muted-foreground mb-2">SPELERS PER DISTRICT</p>
                <div className="space-y-1">
                  {DISTRICTS.map(d => (
                    <div key={d} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1">
                      <span className="text-[0.5rem] text-muted-foreground">{DISTRICT_LABELS[d]}</span>
                      <span className="text-xs font-bold">{worldStats.district_counts[d] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gangs */}
              <div className="game-card">
                <p className="text-[0.5rem] font-bold text-muted-foreground mb-2">GANGS ({worldStats.gangs.length})</p>
                {worldStats.gangs.length === 0 ? <p className="text-[0.5rem] text-muted-foreground">Geen gangs</p> : (
                  <div className="space-y-1">
                    {worldStats.gangs.map(g => (
                      <div key={g.id} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1">
                        <div>
                          <span className="text-xs font-bold">[{g.tag}] {g.name}</span>
                          <span className="text-[0.45rem] text-muted-foreground ml-1.5">Lv.{g.level}</span>
                        </div>
                        <div className="text-[0.45rem] text-muted-foreground flex gap-2">
                          <span>👥 {g.member_count}</span>
                          <span>💰 €{Number(g.treasury).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active wars */}
              <div className="game-card">
                <p className="text-[0.5rem] font-bold text-muted-foreground mb-2">ACTIEVE GANG WARS ({worldStats.active_wars.length})</p>
                {worldStats.active_wars.length === 0 ? <p className="text-[0.5rem] text-muted-foreground">Geen actieve oorlogen</p> : (
                  <div className="space-y-1">
                    {worldStats.active_wars.map((w: any) => (
                      <div key={w.id} className="bg-blood/10 border border-blood/30 rounded px-2 py-1 text-[0.5rem]">
                        <span className="font-bold">⚔️ War</span>
                        <span className="text-muted-foreground ml-1.5">Score: {w.attacker_score} vs {w.defender_score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Global Reset Confirm */}
          <ConfirmDialog
            open={confirmGlobalReset}
            title="⚠️ GLOBALE RESET"
            message="Dit wist ALLE spelerdata, gangs, inventaris, skills, voertuigen, villa's en berichten voor IEDEREEN. Het spel begint helemaal opnieuw. Dit kan NIET ongedaan worden!"
            confirmText="JA, RESET ALLES"
            variant="danger"
            onConfirm={async () => {
              setConfirmGlobalReset(false);
              setActionLoading('global_reset');
              try { const r = await adminCall('global_reset'); showToast(`✅ ${r.message}`); fetchWorldStats(); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
              setActionLoading(null);
            }}
            onCancel={() => setConfirmGlobalReset(false)}
          />
        </div>
      )}

      {/* ======== BERICHTEN TAB ======== */}
      {tab === 'messages' && (
        <div className="mt-2 space-y-3">
          <div className="flex gap-1.5">
            <GameButton variant={msgMode === 'broadcast' ? 'gold' : 'muted'} size="sm" onClick={() => setMsgMode('broadcast')}>📢 BROADCAST</GameButton>
            <GameButton variant={msgMode === 'single' ? 'gold' : 'muted'} size="sm" onClick={() => setMsgMode('single')}>💬 INDIVIDUEEL</GameButton>
          </div>

          <div className="game-card space-y-2">
            {msgMode === 'single' && (
              <div>
                <label className="text-[0.5rem] text-muted-foreground">Ontvanger (user_id):</label>
                <input value={msgReceiver} onChange={e => setMsgReceiver(e.target.value)} placeholder="UUID..." className="w-full bg-background border border-border rounded px-2 py-1 text-xs mt-0.5" />
              </div>
            )}
            <div>
              <label className="text-[0.5rem] text-muted-foreground">Onderwerp:</label>
              <input value={msgSubject} onChange={e => setMsgSubject(e.target.value)} placeholder="📢 Systeembericht" className="w-full bg-background border border-border rounded px-2 py-1 text-xs mt-0.5" />
            </div>
            <div>
              <label className="text-[0.5rem] text-muted-foreground">Bericht:</label>
              <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} placeholder="Typ je bericht..." className="w-full bg-background border border-border rounded p-2 text-xs h-20 resize-none mt-0.5" />
            </div>
            <GameButton variant="gold" size="sm" icon={<Send size={10} />} disabled={msgSending || !msgBody.trim()} onClick={async () => {
              setMsgSending(true);
              try {
                if (msgMode === 'broadcast') {
                  await adminCall('send_broadcast', { subject: msgSubject || undefined, messageBody: msgBody });
                  showToast('✅ Broadcast verzonden');
                } else {
                  if (!msgReceiver.trim()) { showToast('❌ Vul een ontvanger in', true); setMsgSending(false); return; }
                  await adminCall('send_message', { receiverId: msgReceiver.trim(), subject: msgSubject || undefined, messageBody: msgBody });
                  showToast('✅ Bericht verzonden');
                }
                setMsgBody(''); setMsgSubject(''); setMsgReceiver('');
              } catch (e: any) { showToast(`❌ ${e.message}`, true); }
              setMsgSending(false);
            }}>
              {msgMode === 'broadcast' ? 'VERZEND BROADCAST' : 'VERSTUUR'}
            </GameButton>
          </div>
        </div>
      )}

      {/* ======== LOGBOEK TAB ======== */}
      {tab === 'logs' && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.55rem] text-muted-foreground">{logs.length} recente acties</p>
            <GameButton variant="muted" size="sm" icon={<RefreshCw size={10} />} onClick={fetchLogs}>REFRESH</GameButton>
          </div>
          {logsLoading ? <div className="text-center py-8 text-muted-foreground text-xs">Laden...</div> : logs.length === 0 ? <div className="text-center py-8 text-muted-foreground text-xs">Nog geen admin-acties gelogd</div> : (
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
                          {log.target_username && <span className="text-xs font-bold">{log.target_username}</span>}
                        </div>
                        {details?.reason && <p className="text-[0.5rem] text-muted-foreground mt-0.5">"{String(details.reason)}"</p>}
                        {details?.duration && <span className="text-[0.45rem] text-muted-foreground">Duur: {String(details.duration)}u</span>}
                        <p className="text-[0.45rem] text-muted-foreground mt-0.5">{new Date(log.created_at).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======== POPUPS ======== */}

      {/* Player State Detail Popup */}
      {playerStatePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="game-card w-full max-w-sm space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold flex items-center gap-1.5"><User size={12} className="text-primary" /> Player State: {playerStatePopup.entry.username}</h3>
              <button onClick={() => setPlayerStatePopup(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            {!playerStatePopup.state ? <p className="text-[0.55rem] text-muted-foreground">Geen player state gevonden</p> : (
              <>
                <div className="space-y-1.5">
                  {([
                    { key: 'money', label: 'Cash (€)', type: 'number' },
                    { key: 'dirty_money', label: 'Dirty Money', type: 'number' },
                    { key: 'debt', label: 'Schuld', type: 'number' },
                    { key: 'hp', label: 'HP', type: 'number' },
                    { key: 'max_hp', label: 'Max HP', type: 'number' },
                    { key: 'energy', label: 'Energy', type: 'number' },
                    { key: 'max_energy', label: 'Max Energy', type: 'number' },
                    { key: 'nerve', label: 'Nerve', type: 'number' },
                    { key: 'max_nerve', label: 'Max Nerve', type: 'number' },
                    { key: 'heat', label: 'Heat', type: 'number' },
                    { key: 'personal_heat', label: 'Personal Heat', type: 'number' },
                    { key: 'karma', label: 'Karma', type: 'number' },
                    { key: 'rep', label: 'REP', type: 'number' },
                    { key: 'level', label: 'Level', type: 'number' },
                    { key: 'xp', label: 'XP', type: 'number' },
                    { key: 'day', label: 'Dag', type: 'number' },
                    { key: 'ammo', label: 'Ammo', type: 'number' },
                    { key: 'skill_points', label: 'Skill Points', type: 'number' },
                  ] as const).map(f => (
                    <div key={f.key} className="flex items-center gap-2">
                      <label className="text-[0.5rem] text-muted-foreground w-20 shrink-0">{f.label}</label>
                      <span className="text-[0.5rem] text-muted-foreground w-16">{String((playerStatePopup.state as any)[f.key])}</span>
                      <input type={f.type} placeholder="nieuw..." value={playerStateEdits[f.key] !== undefined ? String(playerStateEdits[f.key]) : ''} onChange={e => setPlayerStateEdits(prev => ({ ...prev, [f.key]: Number(e.target.value) }))} className="flex-1 bg-background border border-border rounded px-1.5 py-0.5 text-[0.5rem]" />
                    </div>
                  ))}
                  {/* Location */}
                  <div className="flex items-center gap-2">
                    <label className="text-[0.5rem] text-muted-foreground w-20 shrink-0">District</label>
                    <span className="text-[0.5rem] text-muted-foreground w-16">{DISTRICT_LABELS[(playerStatePopup.state as any).loc] || (playerStatePopup.state as any).loc}</span>
                    <select value={playerStateEdits.loc !== undefined ? String(playerStateEdits.loc) : ''} onChange={e => setPlayerStateEdits(prev => ({ ...prev, loc: e.target.value || undefined }))} className="flex-1 bg-background border border-border rounded px-1.5 py-0.5 text-[0.5rem]">
                      <option value="">— behoud —</option>
                      {DISTRICTS.map(d => <option key={d} value={d}>{DISTRICT_LABELS[d]}</option>)}
                    </select>
                  </div>
                  {/* Quick release buttons */}
                  <div className="flex gap-2 pt-1">
                    {(playerStatePopup.state as any).prison_until && (
                      <GameButton variant="gold" size="sm" onClick={() => setPlayerStateEdits(prev => ({ ...prev, prison_until: '', prison_reason: '' }))}>🔓 UIT GEVANGENIS</GameButton>
                    )}
                    {(playerStatePopup.state as any).hospital_until && (
                      <GameButton variant="emerald" size="sm" onClick={() => setPlayerStateEdits(prev => ({ ...prev, hospital_until: '' }))}>🏥 UIT ZIEKENHUIS</GameButton>
                    )}
                    {(playerStatePopup.state as any).hiding_until && (
                      <GameButton variant="muted" size="sm" onClick={() => setPlayerStateEdits(prev => ({ ...prev, hiding_until: '' }))}>👁 STOP HIDING</GameButton>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <GameButton variant="muted" size="sm" onClick={() => setPlayerStatePopup(null)} className="flex-1">SLUITEN</GameButton>
                  <GameButton variant="emerald" size="sm" onClick={savePlayerState} disabled={Object.keys(playerStateEdits).length === 0} className="flex-1">OPSLAAN</GameButton>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit leaderboard popup */}
      {editPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="game-card w-full max-w-xs space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold flex items-center gap-1.5"><Pencil size={12} className="text-emerald" /> Stats Bewerken</h3>
              <button onClick={() => setEditPopup(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            <p className="text-[0.55rem] text-muted-foreground">Speler: <span className="text-foreground font-bold">{editPopup.username}</span></p>
            <div className="space-y-2">
              {([
                { key: 'username', label: 'Naam', type: 'text' },
                { key: 'cash', label: 'Cash (€)', type: 'number' },
                { key: 'rep', label: 'REP', type: 'number' },
                { key: 'level', label: 'Level', type: 'number' },
                { key: 'day', label: 'Dag', type: 'number' },
                { key: 'districts_owned', label: 'Districten', type: 'number' },
                { key: 'crew_size', label: 'Crew', type: 'number' },
                { key: 'karma', label: 'Karma', type: 'number' },
              ] as const).map(field => (
                <div key={field.key} className="flex items-center gap-2">
                  <label className="text-[0.5rem] text-muted-foreground w-16 shrink-0">{field.label}</label>
                  <input type={field.type} value={editStats[field.key] ?? ''} onChange={e => setEditStats(prev => ({ ...prev, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))} className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs text-foreground" />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <GameButton variant="muted" size="sm" onClick={() => setEditPopup(null)} className="flex-1">ANNULEER</GameButton>
              <GameButton variant="emerald" size="sm" onClick={async () => {
                setActionLoading(editPopup.id);
                try {
                  const { error } = await supabase.functions.invoke('admin-actions', { body: { action: 'edit_entry', entryId: editPopup.id, userId: editPopup.user_id, targetUsername: editPopup.username, stats: editStats } });
                  if (error) throw error;
                  showToast(`✅ Stats aangepast: ${editPopup.username}`);
                  setEditPopup(null); fetchEntries();
                } catch (err: any) { showToast(`❌ ${err.message}`, true); }
                setActionLoading(null);
              }} className="flex-1">OPSLAAN</GameButton>
            </div>
          </div>
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
            <textarea value={sanctionReason} onChange={e => setSanctionReason(e.target.value)} placeholder="Reden (optioneel)..." className="w-full bg-background border border-border rounded p-2 text-xs text-foreground placeholder:text-muted-foreground resize-none h-16" />
            {sanctionPopup.mode === 'mute' && (
              <div className="flex items-center gap-2">
                <span className="text-[0.55rem] text-muted-foreground">Duur:</span>
                {[1, 6, 24, 72, 168].map(h => (
                  <button key={h} onClick={() => setMuteDuration(h)} className={`text-[0.5rem] px-1.5 py-0.5 rounded border font-bold transition-colors ${muteDuration === h ? 'bg-ice/20 border-ice/50 text-ice' : 'bg-muted border-border text-muted-foreground hover:text-foreground'}`}>
                    {h < 24 ? `${h}u` : `${h / 24}d`}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <GameButton variant="muted" size="sm" onClick={() => setSanctionPopup(null)} className="flex-1">ANNULEER</GameButton>
              <GameButton variant={sanctionPopup.mode === 'warn' ? 'gold' : 'purple'} size="sm" onClick={executeSanction} className="flex-1">{sanctionPopup.mode === 'warn' ? 'WAARSCHUW' : 'MUTE'}</GameButton>
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
            {historyPopup.sanctions.length === 0 ? <p className="text-[0.55rem] text-muted-foreground text-center py-4">Geen sancties</p> : (
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
          confirmAction?.type === 'delete' ? `Verwijder leaderboard entry van "${confirmAction.entry.username}"?`
            : confirmAction?.type === 'reset' ? `Reset alle stats van "${confirmAction?.entry.username}" naar 0?`
            : `Ban "${confirmAction?.entry.username}" permanent? Dit kan niet ongedaan worden.`
        }
        confirmText={confirmAction?.type === 'ban' ? 'BAN PERMANENT' : confirmAction?.type === 'delete' ? 'VERWIJDER' : 'RESET'}
        variant="danger"
        onConfirm={() => confirmAction && executeAction(confirmAction.type, confirmAction.entry)}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Teleport popup */}
      {teleportPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="game-card w-full max-w-xs space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold">📍 Teleporteer {teleportPopup.username}</p>
              <button onClick={() => setTeleportPopup(null)}><X size={14} /></button>
            </div>
            <select value={teleportDistrict} onChange={e => setTeleportDistrict(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs">
              {[['low','Lowtown'],['neon','Neon District'],['iron','Iron Quarter'],['port','Port Haven'],['crown','Crown Heights']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <GameButton variant="emerald" size="sm" className="w-full" onClick={async () => {
              try {
                await adminCall('teleport_player', { userId: teleportPopup.user_id, targetUsername: teleportPopup.username, district: teleportDistrict });
                showToast(`📍 ${teleportPopup.username} → ${teleportDistrict}`);
                setTeleportPopup(null);
              } catch (e: any) { showToast(`❌ ${e.message}`, true); }
            }}>TELEPORTEER</GameButton>
          </div>
        </div>
      )}
    </ViewWrapper>
  );
}
