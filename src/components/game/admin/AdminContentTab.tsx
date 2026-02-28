import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { SubTabBar } from '../ui/SubTabBar';
import { RefreshCw, Trash2, X, Target, Gavel, Globe, Route, MessageSquare, Plus } from 'lucide-react';

const DISTRICTS = ['low', 'port', 'neon', 'iron', 'crown'];
const DISTRICT_LABELS: Record<string, string> = { low: 'Lowtown', port: 'De Haven', neon: 'Neon Mile', iron: 'IJzerbuurt', crown: 'De Kroon' };

async function adminCall(action: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('admin-actions', { body: { action, ...extra } });
  if (error) throw error;
  return data;
}

type SubTab = 'bounties' | 'auctions' | 'raids' | 'routes' | 'chat';

interface Bounty { id: string; placer_id: string; target_id: string; amount: number; reason: string; status: string; expires_at: string; placer_name?: string; target_name?: string; }
interface Auction { id: string; item_name: string; item_type: string; seller_name: string; current_bid: number; bid_count: number; status: string; ends_at: string; }
interface WorldRaid { id: string; title: string; raid_type: string; boss_hp: number; boss_max_hp: number; status: string; total_participants: number; ends_at: string; }
interface SmuggleRoute { id: string; from_district: string; to_district: string; good_id: string; profit_multiplier: number; risk_level: number; status: string; capacity: number; used_capacity: number; expires_at: string; }
interface ChatMsg { id: string; username: string; message: string; channel: string; created_at: string; }

interface Props { showToast: (msg: string, isError?: boolean) => void; }

export function AdminContentTab({ showToast }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('bounties');
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [raids, setRaids] = useState<WorldRaid[]>([]);
  const [routes, setRoutes] = useState<SmuggleRoute[]>([]);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);

  // New raid form
  const [showNewRaid, setShowNewRaid] = useState(false);
  const [raidForm, setRaidForm] = useState({ title: 'Politie Razzia', raid_type: 'police_raid', boss_hp: 500, district_id: 'low', duration_hours: 4 });

  const fetch = async (tab: SubTab) => {
    setLoading(true);
    try {
      if (tab === 'bounties') { const d = await adminCall('get_bounties'); setBounties(d.bounties || []); }
      if (tab === 'auctions') { const d = await adminCall('get_auctions'); setAuctions(d.auctions || []); }
      if (tab === 'raids') { const d = await adminCall('get_world_raids'); setRaids(d.raids || []); }
      if (tab === 'routes') { const d = await adminCall('get_smuggle_routes'); setRoutes(d.routes || []); }
      if (tab === 'chat') { const d = await adminCall('get_chat_messages'); setChatMsgs(d.messages || []); }
    } catch (e: any) { showToast(`❌ ${e.message}`, true); }
    setLoading(false);
  };

  useEffect(() => { fetch(subTab); }, [subTab]);

  return (
    <div className="mt-2 space-y-3">
      <SubTabBar
        tabs={[
          { id: 'bounties', label: 'BOUNTIES', icon: <Target size={10} /> },
          { id: 'auctions', label: 'VEILINGEN', icon: <Gavel size={10} /> },
          { id: 'raids', label: 'RAIDS', icon: <Globe size={10} /> },
          { id: 'routes', label: 'ROUTES', icon: <Route size={10} /> },
          { id: 'chat', label: 'CHAT', icon: <MessageSquare size={10} /> },
        ]}
        active={subTab}
        onChange={(t) => setSubTab(t as SubTab)}
      />

      <div className="flex justify-end">
        <GameButton variant="muted" size="sm" icon={<RefreshCw size={10} />} onClick={() => fetch(subTab)}>REFRESH</GameButton>
      </div>

      {loading ? <div className="text-center py-8 text-muted-foreground text-xs">Laden...</div> : (
        <>
          {/* BOUNTIES */}
          {subTab === 'bounties' && (
            <div className="space-y-1.5">
              {bounties.length === 0 ? <p className="text-center py-6 text-muted-foreground text-xs">Geen bounties</p> : bounties.map(b => (
                <div key={b.id} className="game-card flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold">🎯 {b.target_name || b.target_id.slice(0,8)}</span>
                      <GameBadge variant={b.status === 'active' ? 'blood' : 'muted'} size="xs">{b.status}</GameBadge>
                    </div>
                    <div className="text-[0.45rem] text-muted-foreground">€{b.amount.toLocaleString()} · {b.reason} · Verloopt: {new Date(b.expires_at).toLocaleDateString('nl-NL')}</div>
                  </div>
                  <button onClick={async () => {
                    try { await adminCall('delete_bounty', { bountyId: b.id }); showToast('✅ Bounty verwijderd'); fetch('bounties'); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                  }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><Trash2 size={10} /></button>
                </div>
              ))}
            </div>
          )}

          {/* AUCTIONS */}
          {subTab === 'auctions' && (
            <div className="space-y-1.5">
              {auctions.length === 0 ? <p className="text-center py-6 text-muted-foreground text-xs">Geen veilingen</p> : auctions.map(a => (
                <div key={a.id} className="game-card flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold">{a.item_name}</span>
                      <span className="text-[0.45rem] text-muted-foreground">{a.item_type}</span>
                      <GameBadge variant={a.status === 'active' ? 'gold' : 'muted'} size="xs">{a.status}</GameBadge>
                    </div>
                    <div className="text-[0.45rem] text-muted-foreground">Bod: €{a.current_bid.toLocaleString()} ({a.bid_count} biedingen) · Verkoper: {a.seller_name}</div>
                  </div>
                  <button onClick={async () => {
                    try { await adminCall('cancel_auction', { auctionId: a.id }); showToast('✅ Veiling geannuleerd'); fetch('auctions'); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                  }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><X size={10} /></button>
                </div>
              ))}
            </div>
          )}

          {/* RAIDS */}
          {subTab === 'raids' && (
            <div className="space-y-3">
              <GameButton variant="emerald" size="sm" icon={<Plus size={10} />} onClick={() => setShowNewRaid(true)}>NIEUWE RAID</GameButton>

              {showNewRaid && (
                <div className="game-card space-y-2">
                  <p className="text-[0.5rem] font-bold text-muted-foreground">NIEUWE WORLD RAID</p>
                  <input value={raidForm.title} onChange={e => setRaidForm(p => ({ ...p, title: e.target.value }))} placeholder="Titel..." className="w-full bg-background border border-border rounded px-2 py-1 text-xs" />
                  <div className="grid grid-cols-2 gap-1.5">
                    <select value={raidForm.raid_type} onChange={e => setRaidForm(p => ({ ...p, raid_type: e.target.value }))} className="bg-background border border-border rounded px-2 py-1 text-xs">
                      {['police_raid', 'military_sweep', 'rival_invasion', 'monster_hunt'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={raidForm.district_id} onChange={e => setRaidForm(p => ({ ...p, district_id: e.target.value }))} className="bg-background border border-border rounded px-2 py-1 text-xs">
                      {DISTRICTS.map(d => <option key={d} value={d}>{DISTRICT_LABELS[d]}</option>)}
                    </select>
                    <div className="flex items-center gap-1">
                      <label className="text-[0.45rem] text-muted-foreground shrink-0">Boss HP:</label>
                      <input type="number" value={raidForm.boss_hp} onChange={e => setRaidForm(p => ({ ...p, boss_hp: Number(e.target.value) }))} className="flex-1 bg-background border border-border rounded px-1 py-0.5 text-xs" />
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-[0.45rem] text-muted-foreground shrink-0">Duur (u):</label>
                      <input type="number" value={raidForm.duration_hours} onChange={e => setRaidForm(p => ({ ...p, duration_hours: Number(e.target.value) }))} className="flex-1 bg-background border border-border rounded px-1 py-0.5 text-xs" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <GameButton variant="muted" size="sm" onClick={() => setShowNewRaid(false)}>ANNULEER</GameButton>
                    <GameButton variant="emerald" size="sm" onClick={async () => {
                      try { await adminCall('create_world_raid', raidForm); showToast('✅ Raid aangemaakt'); setShowNewRaid(false); fetch('raids'); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                    }}>AANMAKEN</GameButton>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                {raids.length === 0 ? <p className="text-center py-6 text-muted-foreground text-xs">Geen raids</p> : raids.map(r => {
                  const hpPct = r.boss_max_hp > 0 ? Math.round((r.boss_hp / r.boss_max_hp) * 100) : 0;
                  return (
                    <div key={r.id} className="game-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold">{r.title}</span>
                          <GameBadge variant={r.status === 'active' ? 'blood' : 'muted'} size="xs" className="ml-1.5">{r.status}</GameBadge>
                        </div>
                        <button onClick={async () => {
                          try { await adminCall('delete_world_raid', { raidId: r.id }); showToast('✅ Raid verwijderd'); fetch('raids'); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                        }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><Trash2 size={10} /></button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${hpPct > 50 ? 'bg-emerald' : hpPct > 20 ? 'bg-gold' : 'bg-blood'}`} style={{ width: `${hpPct}%` }} />
                        </div>
                        <span className="text-[0.45rem] font-bold">{r.boss_hp}/{r.boss_max_hp}</span>
                        <span className="text-[0.45rem] text-muted-foreground">👥 {r.total_participants}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SMUGGLE ROUTES */}
          {subTab === 'routes' && (
            <div className="space-y-1.5">
              {routes.length === 0 ? <p className="text-center py-6 text-muted-foreground text-xs">Geen smokkelroutes</p> : routes.map(r => (
                <div key={r.id} className="game-card flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold">{DISTRICT_LABELS[r.from_district]} → {DISTRICT_LABELS[r.to_district]}</span>
                      <GameBadge variant={r.status === 'active' ? 'emerald' : 'muted'} size="xs">{r.status}</GameBadge>
                    </div>
                    <div className="text-[0.45rem] text-muted-foreground">
                      {r.good_id} · x{r.profit_multiplier} winst · ⚠️{r.risk_level} risico · {r.used_capacity}/{r.capacity} gebruikt
                    </div>
                  </div>
                  <button onClick={async () => {
                    try { await adminCall('delete_smuggle_route', { routeId: r.id }); showToast('✅ Route verwijderd'); fetch('routes'); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                  }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><Trash2 size={10} /></button>
                </div>
              ))}
            </div>
          )}

          {/* CHAT MODERATION */}
          {subTab === 'chat' && (
            <div className="space-y-2">
              <GameButton variant="blood" size="sm" icon={<Trash2 size={10} />} onClick={async () => {
                try { await adminCall('clear_chat'); showToast('✅ Chat gewist'); fetch('chat'); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
              }}>WIS ALLE CHAT</GameButton>
              <div className="space-y-1">
                {chatMsgs.length === 0 ? <p className="text-center py-6 text-muted-foreground text-xs">Geen berichten</p> : chatMsgs.map(m => (
                  <div key={m.id} className="game-card flex items-center gap-2 text-[0.5rem]">
                    <div className="flex-1 min-w-0">
                      <span className="font-bold">{m.username}</span>
                      <span className="text-muted-foreground ml-1">({m.channel})</span>
                      <p className="text-muted-foreground truncate">{m.message}</p>
                      <span className="text-[0.4rem] text-muted-foreground">{new Date(m.created_at).toLocaleString('nl-NL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                    </div>
                    <button onClick={async () => {
                      try { await adminCall('delete_chat_message', { messageId: m.id }); showToast('✅ Bericht verwijderd'); fetch('chat'); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                    }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><Trash2 size={10} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
