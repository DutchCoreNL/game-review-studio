import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { SubTabBar } from '../ui/SubTabBar';
import { RefreshCw, Trash2, X, Target, Gavel, Globe, Route, MessageSquare, Plus, Scale, ArrowLeftRight, ShoppingCart, Activity, Eye, Skull, Swords, Users } from 'lucide-react';

const DISTRICTS = ['low', 'port', 'neon', 'iron', 'crown'];
const DISTRICT_LABELS: Record<string, string> = { low: 'Lowtown', port: 'De Haven', neon: 'Neon Mile', iron: 'IJzerbuurt', crown: 'De Kroon' };

async function adminCall(action: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('admin-actions', { body: { action, ...extra } });
  if (error) throw error;
  return data;
}

type SubTab = 'bounties' | 'auctions' | 'raids' | 'routes' | 'chat' | 'tribunal' | 'trades' | 'listings' | 'activity' | 'undercover' | 'heists' | 'oc' | 'pvp' | 'moles';

interface Props { showToast: (msg: string, isError?: boolean) => void; }

export function AdminContentTab({ showToast }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('bounties');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showNewRaid, setShowNewRaid] = useState(false);
  const [raidForm, setRaidForm] = useState({ title: 'Politie Razzia', raid_type: 'police_raid', boss_hp: 500, district_id: 'low', duration_hours: 4 });

  const fetchData = async (tab: SubTab) => {
    setLoading(true);
    try {
      const actionMap: Record<SubTab, string> = {
        bounties: 'get_bounties', auctions: 'get_auctions', raids: 'get_world_raids',
        routes: 'get_smuggle_routes', chat: 'get_chat_messages', tribunal: 'get_tribunal_cases',
        trades: 'get_trade_offers', listings: 'get_market_listings', activity: 'get_activity_feed',
        undercover: 'get_undercover_missions', heists: 'get_heist_sessions', oc: 'get_organized_crimes',
        pvp: 'get_pvp_sessions', moles: 'get_gang_moles',
      };
      const dataKeyMap: Record<SubTab, string> = {
        bounties: 'bounties', auctions: 'auctions', raids: 'raids',
        routes: 'routes', chat: 'messages', tribunal: 'cases',
        trades: 'offers', listings: 'listings', activity: 'activities',
        undercover: 'missions', heists: 'sessions', oc: 'crimes',
        pvp: 'sessions', moles: 'moles',
      };
      const d = await adminCall(actionMap[tab]);
      setData(d[dataKeyMap[tab]] || []);
    } catch (e: any) { showToast(`❌ ${e.message}`, true); }
    setLoading(false);
  };

  useEffect(() => { fetchData(subTab); }, [subTab]);

  return (
    <div className="mt-2 space-y-3">
      <SubTabBar
        tabs={[
          { id: 'bounties', label: 'BOUNTIES', icon: <Target size={8} /> },
          { id: 'auctions', label: 'VEILINGEN', icon: <Gavel size={8} /> },
          { id: 'raids', label: 'RAIDS', icon: <Globe size={8} /> },
          { id: 'routes', label: 'ROUTES', icon: <Route size={8} /> },
          { id: 'chat', label: 'CHAT', icon: <MessageSquare size={8} /> },
          { id: 'tribunal', label: 'TRIBUNAL', icon: <Scale size={8} /> },
          { id: 'trades', label: 'TRADES', icon: <ArrowLeftRight size={8} /> },
          { id: 'listings', label: 'MARKT', icon: <ShoppingCart size={8} /> },
          { id: 'activity', label: 'ACTIVITEIT', icon: <Activity size={8} /> },
          { id: 'undercover', label: 'UNDERCOVER', icon: <Eye size={8} /> },
          { id: 'heists', label: 'HEISTS', icon: <Skull size={8} /> },
          { id: 'oc', label: 'OC', icon: <Users size={8} /> },
          { id: 'pvp', label: 'PVP', icon: <Swords size={8} /> },
          { id: 'moles', label: 'MOLLEN', icon: <Eye size={8} /> },
        ]}
        active={subTab}
        onChange={(t) => setSubTab(t as SubTab)}
      />

      <div className="flex justify-end gap-1">
        {subTab === 'activity' && (
          <GameButton variant="blood" size="sm" icon={<Trash2 size={10} />} onClick={async () => {
            try { await adminCall('clear_activity_feed'); showToast('✅ Activiteit gewist'); fetchData('activity'); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
          }}>WIS ALLES</GameButton>
        )}
        {subTab === 'chat' && (
          <GameButton variant="blood" size="sm" icon={<Trash2 size={10} />} onClick={async () => {
            try { await adminCall('clear_chat'); showToast('✅ Chat gewist'); fetchData('chat'); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
          }}>WIS CHAT</GameButton>
        )}
        {subTab === 'raids' && <GameButton variant="emerald" size="sm" icon={<Plus size={10} />} onClick={() => setShowNewRaid(true)}>NIEUWE RAID</GameButton>}
        <GameButton variant="muted" size="sm" icon={<RefreshCw size={10} />} onClick={() => fetchData(subTab)}>REFRESH</GameButton>
      </div>

      {/* New Raid Form */}
      {subTab === 'raids' && showNewRaid && (
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
            <div className="flex items-center gap-1"><label className="text-[0.45rem] text-muted-foreground shrink-0">Boss HP:</label><input type="number" value={raidForm.boss_hp} onChange={e => setRaidForm(p => ({ ...p, boss_hp: Number(e.target.value) }))} className="flex-1 bg-background border border-border rounded px-1 py-0.5 text-xs" /></div>
            <div className="flex items-center gap-1"><label className="text-[0.45rem] text-muted-foreground shrink-0">Duur (u):</label><input type="number" value={raidForm.duration_hours} onChange={e => setRaidForm(p => ({ ...p, duration_hours: Number(e.target.value) }))} className="flex-1 bg-background border border-border rounded px-1 py-0.5 text-xs" /></div>
          </div>
          <div className="flex gap-2">
            <GameButton variant="muted" size="sm" onClick={() => setShowNewRaid(false)}>ANNULEER</GameButton>
            <GameButton variant="emerald" size="sm" onClick={async () => {
              try { await adminCall('create_world_raid', raidForm); showToast('✅ Raid aangemaakt'); setShowNewRaid(false); fetchData('raids'); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
            }}>AANMAKEN</GameButton>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-8 text-muted-foreground text-xs">Laden...</div> : (
        <>
          {data.length === 0 && <p className="text-center py-6 text-muted-foreground text-xs">Geen items</p>}

          {/* BOUNTIES */}
          {subTab === 'bounties' && data.map((b: any) => (
            <div key={b.id} className="game-card flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><span className="text-xs font-bold">🎯 {b.target_name || b.target_id?.slice(0,8)}</span><GameBadge variant={b.status === 'active' ? 'blood' : 'muted'} size="xs">{b.status}</GameBadge></div>
                <div className="text-[0.45rem] text-muted-foreground">€{b.amount?.toLocaleString()} · {b.reason}</div>
              </div>
              <button onClick={async () => { try { await adminCall('delete_bounty', { bountyId: b.id }); showToast('✅ Verwijderd'); fetchData('bounties'); } catch (e: any) { showToast(`❌ ${e.message}`, true); } }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><Trash2 size={10} /></button>
            </div>
          ))}

          {/* AUCTIONS */}
          {subTab === 'auctions' && data.map((a: any) => (
            <div key={a.id} className="game-card flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><span className="text-xs font-bold">{a.item_name}</span><GameBadge variant={a.status === 'active' ? 'gold' : 'muted'} size="xs">{a.status}</GameBadge></div>
                <div className="text-[0.45rem] text-muted-foreground">Bod: €{a.current_bid?.toLocaleString()} ({a.bid_count} biedingen) · {a.seller_name}</div>
              </div>
              <button onClick={async () => { try { await adminCall('cancel_auction', { auctionId: a.id }); showToast('✅ Geannuleerd'); fetchData('auctions'); } catch (e: any) { showToast(`❌ ${e.message}`, true); } }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><X size={10} /></button>
            </div>
          ))}

          {/* RAIDS */}
          {subTab === 'raids' && data.map((r: any) => {
            const hpPct = r.boss_max_hp > 0 ? Math.round((r.boss_hp / r.boss_max_hp) * 100) : 0;
            return (
              <div key={r.id} className="game-card">
                <div className="flex items-center justify-between">
                  <div><span className="text-xs font-bold">{r.title}</span><GameBadge variant={r.status === 'active' ? 'blood' : 'muted'} size="xs" className="ml-1.5">{r.status}</GameBadge></div>
                  <button onClick={async () => { try { await adminCall('delete_world_raid', { raidId: r.id }); showToast('✅ Verwijderd'); fetchData('raids'); } catch (e: any) { showToast(`❌ ${e.message}`, true); } }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><Trash2 size={10} /></button>
                </div>
                <div className="flex items-center gap-2 mt-1"><div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${hpPct > 50 ? 'bg-emerald' : hpPct > 20 ? 'bg-gold' : 'bg-blood'}`} style={{ width: `${hpPct}%` }} /></div><span className="text-[0.45rem] font-bold">{r.boss_hp}/{r.boss_max_hp}</span><span className="text-[0.45rem] text-muted-foreground">👥 {r.total_participants}</span></div>
              </div>
            );
          })}

          {/* ROUTES */}
          {subTab === 'routes' && data.map((r: any) => (
            <div key={r.id} className="game-card flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><span className="text-xs font-bold">{DISTRICT_LABELS[r.from_district]} → {DISTRICT_LABELS[r.to_district]}</span><GameBadge variant={r.status === 'active' ? 'emerald' : 'muted'} size="xs">{r.status}</GameBadge></div>
                <div className="text-[0.45rem] text-muted-foreground">{r.good_id} · x{r.profit_multiplier} · ⚠️{r.risk_level} · {r.used_capacity}/{r.capacity}</div>
              </div>
              <button onClick={async () => { try { await adminCall('delete_smuggle_route', { routeId: r.id }); showToast('✅ Verwijderd'); fetchData('routes'); } catch (e: any) { showToast(`❌ ${e.message}`, true); } }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><Trash2 size={10} /></button>
            </div>
          ))}

          {/* CHAT */}
          {subTab === 'chat' && data.map((m: any) => (
            <div key={m.id} className="game-card flex items-center gap-2 text-[0.5rem]">
              <div className="flex-1 min-w-0"><span className="font-bold">{m.username}</span><span className="text-muted-foreground ml-1">({m.channel})</span><p className="text-muted-foreground truncate">{m.message}</p></div>
              <button onClick={async () => { try { await adminCall('delete_chat_message', { messageId: m.id }); showToast('✅ Verwijderd'); fetchData('chat'); } catch (e: any) { showToast(`❌ ${e.message}`, true); } }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><Trash2 size={10} /></button>
            </div>
          ))}

          {/* TRIBUNAL */}
          {subTab === 'tribunal' && data.map((c: any) => (
            <div key={c.id} className="game-card">
              <div className="flex items-center justify-between">
                <div><span className="text-xs font-bold">⚖️ {c.charge}</span><GameBadge variant={c.status === 'active' ? 'gold' : c.status === 'resolved' ? 'emerald' : 'muted'} size="xs" className="ml-1.5">{c.status}</GameBadge></div>
                <button onClick={async () => { try { await adminCall('delete_tribunal_case', { caseId: c.id }); showToast('✅ Verwijderd'); fetchData('tribunal'); } catch (e: any) { showToast(`❌ ${e.message}`, true); } }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><Trash2 size={10} /></button>
              </div>
              <div className="text-[0.45rem] text-muted-foreground mt-0.5">{c.accuser_name} → {c.accused_name} · Guilty: {c.votes_guilty} / Innocent: {c.votes_innocent}</div>
              {c.status === 'active' && (
                <div className="flex gap-1 mt-1">
                  <GameButton variant="blood" size="sm" onClick={async () => { try { await adminCall('resolve_tribunal_case', { caseId: c.id, verdict: 'guilty' }); showToast('✅ Schuldig'); fetchData('tribunal'); } catch (e: any) { showToast(`❌ ${e.message}`, true); } }}>SCHULDIG</GameButton>
                  <GameButton variant="emerald" size="sm" onClick={async () => { try { await adminCall('resolve_tribunal_case', { caseId: c.id, verdict: 'innocent' }); showToast('✅ Onschuldig'); fetchData('tribunal'); } catch (e: any) { showToast(`❌ ${e.message}`, true); } }}>ONSCHULDIG</GameButton>
                </div>
              )}
            </div>
          ))}

          {/* TRADE OFFERS */}
          {subTab === 'trades' && data.map((t: any) => (
            <div key={t.id} className="game-card flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><span className="text-xs font-bold">{t.sender_name} → {t.receiver_name}</span><GameBadge variant={t.status === 'pending' ? 'gold' : t.status === 'accepted' ? 'emerald' : 'muted'} size="xs">{t.status}</GameBadge></div>
                <div className="text-[0.45rem] text-muted-foreground">Bied: €{t.offer_cash?.toLocaleString()} · Vraag: €{t.request_cash?.toLocaleString()}</div>
              </div>
              {t.status === 'pending' && <button onClick={async () => { try { await adminCall('cancel_trade_offer', { offerId: t.id }); showToast('✅ Geannuleerd'); fetchData('trades'); } catch (e: any) { showToast(`❌ ${e.message}`, true); } }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><X size={10} /></button>}
            </div>
          ))}

          {/* MARKET LISTINGS */}
          {subTab === 'listings' && data.map((l: any) => (
            <div key={l.id} className="game-card flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><span className="text-xs font-bold">{l.good_id}</span><span className="text-[0.45rem] text-muted-foreground">{DISTRICT_LABELS[l.district_id]}</span><GameBadge variant={l.status === 'active' ? 'emerald' : 'muted'} size="xs">{l.status}</GameBadge></div>
                <div className="text-[0.45rem] text-muted-foreground">x{l.quantity} @ €{l.price_per_unit} · {l.seller_name}</div>
              </div>
              <button onClick={async () => { try { await adminCall('delete_market_listing', { listingId: l.id }); showToast('✅ Verwijderd'); fetchData('listings'); } catch (e: any) { showToast(`❌ ${e.message}`, true); } }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><Trash2 size={10} /></button>
            </div>
          ))}

          {/* ACTIVITY FEED */}
          {subTab === 'activity' && data.map((a: any) => (
            <div key={a.id} className="game-card text-[0.5rem]">
              <div className="flex items-center gap-1.5"><span>{a.icon}</span><span className="font-bold">{a.username}</span><span className="text-muted-foreground">{a.action_type}</span></div>
              <p className="text-muted-foreground">{a.description}</p>
            </div>
          ))}

          {/* UNDERCOVER MISSIONS */}
          {subTab === 'undercover' && data.map((m: any) => (
            <div key={m.id} className="game-card flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><span className="text-xs font-bold">🕵️ {m.username}</span><GameBadge variant={m.status === 'active' ? 'purple' : 'muted'} size="xs">{m.status}</GameBadge></div>
                <div className="text-[0.45rem] text-muted-foreground">Factie: {m.target_faction} · Cover: {m.cover_integrity}% · Missies: {m.missions_completed}</div>
              </div>
              {m.status === 'active' && <button onClick={async () => { try { await adminCall('cancel_undercover_mission', { missionId: m.id }); showToast('✅ Geannuleerd'); fetchData('undercover'); } catch (e: any) { showToast(`❌ ${e.message}`, true); } }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><X size={10} /></button>}
            </div>
          ))}

          {/* HEIST SESSIONS */}
          {subTab === 'heists' && data.map((h: any) => (
            <div key={h.id} className="game-card flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><span className="text-xs font-bold">🏦 {h.heist_id}</span><span className="text-[0.45rem] text-muted-foreground">{h.gang_name}</span><GameBadge variant={h.status === 'active' ? 'gold' : h.status === 'recruiting' ? 'emerald' : 'muted'} size="xs">{h.status}</GameBadge></div>
              </div>
              {['recruiting', 'active'].includes(h.status) && <button onClick={async () => { try { await adminCall('cancel_heist_session', { sessionId: h.id }); showToast('✅ Geannuleerd'); fetchData('heists'); } catch (e: any) { showToast(`❌ ${e.message}`, true); } }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><X size={10} /></button>}
            </div>
          ))}

          {/* ORGANIZED CRIMES */}
          {subTab === 'oc' && data.map((o: any) => (
            <div key={o.id} className="game-card flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><span className="text-xs font-bold">💣 {o.crime_id}</span><span className="text-[0.45rem] text-muted-foreground">{o.gang_name}</span><GameBadge variant={o.status === 'recruiting' ? 'emerald' : o.status === 'in_progress' ? 'gold' : 'muted'} size="xs">{o.status}</GameBadge></div>
              </div>
              {['recruiting', 'in_progress'].includes(o.status) && <button onClick={async () => { try { await adminCall('cancel_organized_crime', { crimeId: o.id }); showToast('✅ Geannuleerd'); fetchData('oc'); } catch (e: any) { showToast(`❌ ${e.message}`, true); } }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><X size={10} /></button>}
            </div>
          ))}

          {/* PVP SESSIONS */}
          {subTab === 'pvp' && data.map((s: any) => (
            <div key={s.id} className="game-card text-[0.5rem]">
              <div className="flex items-center gap-1.5"><span className="font-bold">⚔️ {s.attacker_name} vs {s.defender_name}</span><GameBadge variant={s.status === 'active' ? 'blood' : 'muted'} size="xs">{s.status}</GameBadge></div>
              <div className="text-muted-foreground">Turn {s.turn} · {s.winner_id ? `Winnaar: ${s.winner_id === s.attacker_id ? s.attacker_name : s.defender_name}` : 'Bezig...'}</div>
            </div>
          ))}

          {/* GANG MOLES */}
          {subTab === 'moles' && data.map((m: any) => (
            <div key={m.id} className="game-card flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><span className="text-xs font-bold">🕵️ {m.player_name}</span><GameBadge variant={m.status === 'active' ? 'purple' : 'muted'} size="xs">{m.status}</GameBadge></div>
                <div className="text-[0.45rem] text-muted-foreground">{m.player_gang_name} → {m.target_gang_name} · Cover: {m.cover_strength}%</div>
              </div>
              <button onClick={async () => { try { await adminCall('delete_gang_mole', { moleId: m.id }); showToast('✅ Verwijderd'); fetchData('moles'); } catch (e: any) { showToast(`❌ ${e.message}`, true); } }} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20"><Trash2 size={10} /></button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
