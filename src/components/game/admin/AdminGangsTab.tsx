import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { RefreshCw, Pencil, Trash2, X, Users, DollarSign, Swords, Handshake, Crown } from 'lucide-react';
import { ConfirmDialog } from '../ConfirmDialog';

const DISTRICTS = ['low', 'port', 'neon', 'iron', 'crown'];
const DISTRICT_LABELS: Record<string, string> = { low: 'Lowtown', port: 'De Haven', neon: 'Neon Mile', iron: 'IJzerbuurt', crown: 'De Kroon' };

async function adminCall(action: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('admin-actions', { body: { action, ...extra } });
  if (error) throw error;
  return data;
}

interface Gang {
  id: string; name: string; tag: string; level: number; xp: number; treasury: number;
  max_members: number; leader_id: string; description: string;
  member_count: number;
  members?: { user_id: string; role: string; contributed: number; username?: string }[];
}

interface Alliance {
  id: string; gang_a_id: string; gang_b_id: string; status: string;
  gang_a_name?: string; gang_b_name?: string; expires_at: string;
}

interface GangWar {
  id: string; attacker_gang_id: string; defender_gang_id: string; status: string;
  attacker_score: number; defender_score: number; ends_at: string;
  attacker_name?: string; defender_name?: string; district_id: string | null;
}

interface Props { showToast: (msg: string, isError?: boolean) => void; }

export function AdminGangsTab({ showToast }: Props) {
  const [gangs, setGangs] = useState<Gang[]>([]);
  const [loading, setLoading] = useState(false);
  const [editGang, setEditGang] = useState<Gang | null>(null);
  const [editVals, setEditVals] = useState<Record<string, unknown>>({});
  const [membersGang, setMembersGang] = useState<Gang | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Gang | null>(null);
  const [wars, setWars] = useState<GangWar[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [showWars, setShowWars] = useState(false);
  const [showAlliances, setShowAlliances] = useState(false);

  const fetchGangs = async () => {
    setLoading(true);
    try {
      const d = await adminCall('get_gangs_full');
      setGangs(d.gangs || []);
    } catch (e: any) { showToast(`❌ ${e.message}`, true); }
    setLoading(false);
  };

  const fetchWars = async () => {
    try { const d = await adminCall('get_gang_wars'); setWars(d.wars || []); setShowWars(true); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
  };

  const fetchAlliances = async () => {
    try { const d = await adminCall('get_alliances'); setAlliances(d.alliances || []); setShowAlliances(true); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
  };

  useEffect(() => { fetchGangs(); }, []);

  const fetchMembers = async (gang: Gang) => {
    try {
      const d = await adminCall('get_gang_members', { gangId: gang.id });
      setMembersGang({ ...gang, members: d.members || [] });
    } catch (e: any) { showToast(`❌ ${e.message}`, true); }
  };

  return (
    <div className="mt-2 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[0.55rem] text-muted-foreground">{gangs.length} gangs</p>
        <div className="flex gap-1">
          <GameButton variant="purple" size="sm" icon={<Swords size={10} />} onClick={fetchWars}>WARS</GameButton>
          <GameButton variant="muted" size="sm" icon={<Handshake size={10} />} onClick={fetchAlliances}>ALLIANTIES</GameButton>
          <GameButton variant="muted" size="sm" icon={<RefreshCw size={10} />} onClick={fetchGangs}>REFRESH</GameButton>
        </div>
      </div>

      {loading ? <div className="text-center py-8 text-muted-foreground text-xs">Laden...</div> : (
        <div className="space-y-1.5">
          {gangs.map(g => (
            <div key={g.id} className="game-card">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">[{g.tag}] {g.name}</span>
                    <span className="text-[0.45rem] text-muted-foreground">Lv.{g.level}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[0.45rem] text-muted-foreground">
                    <span>👥 {g.member_count}/{g.max_members}</span>
                    <span>💰 €{Number(g.treasury).toLocaleString()}</span>
                    <span>XP {g.xp}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => fetchMembers(g)} className="p-1.5 rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors" title="Leden"><Users size={10} /></button>
                  <button onClick={() => { setEditGang(g); setEditVals({ name: g.name, tag: g.tag, level: g.level, treasury: g.treasury, max_members: g.max_members, xp: g.xp, description: g.description }); }} className="p-1.5 rounded bg-emerald/10 border border-emerald/30 text-emerald hover:bg-emerald/20 transition-colors" title="Bewerk"><Pencil size={10} /></button>
                  <button onClick={() => setConfirmDelete(g)} className="p-1.5 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20 transition-colors" title="Verwijder"><Trash2 size={10} /></button>
                </div>
              </div>
            </div>
          ))}
          {gangs.length === 0 && <div className="text-center py-6 text-muted-foreground text-xs">Geen gangs</div>}
        </div>
      )}

      {/* Edit Gang Popup */}
      {editGang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="game-card w-full max-w-xs space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold">✏️ Gang Bewerken: [{editGang.tag}]</h3>
              <button onClick={() => setEditGang(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            {[
              { key: 'name', label: 'Naam', type: 'text' },
              { key: 'tag', label: 'Tag', type: 'text' },
              { key: 'level', label: 'Level', type: 'number' },
              { key: 'xp', label: 'XP', type: 'number' },
              { key: 'treasury', label: 'Treasury (€)', type: 'number' },
              { key: 'max_members', label: 'Max Leden', type: 'number' },
            ].map(f => (
              <div key={f.key} className="flex items-center gap-2">
                <label className="text-[0.5rem] text-muted-foreground w-20 shrink-0">{f.label}</label>
                <input type={f.type} value={String(editVals[f.key] ?? '')} onChange={e => setEditVals(v => ({ ...v, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))} className="flex-1 bg-background border border-border rounded px-1.5 py-0.5 text-[0.5rem]" />
              </div>
            ))}
            <textarea value={String(editVals.description || '')} onChange={e => setEditVals(v => ({ ...v, description: e.target.value }))} placeholder="Beschrijving..." className="w-full bg-background border border-border rounded p-2 text-xs h-12 resize-none" />
            <div className="flex gap-2">
              <GameButton variant="muted" size="sm" onClick={() => setEditGang(null)} className="flex-1">ANNULEER</GameButton>
              <GameButton variant="emerald" size="sm" onClick={async () => {
                try { await adminCall('edit_gang', { gangId: editGang.id, stats: editVals }); showToast('✅ Gang opgeslagen'); setEditGang(null); fetchGangs(); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
              }} className="flex-1">OPSLAAN</GameButton>
            </div>
          </div>
        </div>
      )}

      {/* Members Popup */}
      {membersGang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="game-card w-full max-w-sm space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold">👥 Leden: [{membersGang.tag}] {membersGang.name}</h3>
              <button onClick={() => setMembersGang(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            {(membersGang.members || []).length === 0 ? <p className="text-[0.55rem] text-muted-foreground text-center py-4">Geen leden</p> : (
              <div className="space-y-1">
                {(membersGang.members || []).map((m, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1.5">
                    <div>
                      <span className="text-xs font-bold">{m.username || m.user_id.slice(0, 8)}</span>
                      <GameBadge variant={m.role === 'leader' ? 'gold' : m.role === 'officer' ? 'purple' : 'muted'} size="xs" className="ml-1.5">{m.role}</GameBadge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[0.45rem] text-muted-foreground">€{Number(m.contributed).toLocaleString()}</span>
                      {m.role !== 'leader' && (
                        <div className="flex gap-1">
                          {m.role !== 'officer' && (
                            <button onClick={async () => {
                              try { await adminCall('promote_gang_member', { gangId: membersGang.id, userId: m.user_id, newRole: 'officer' }); showToast('✅ Gepromoveerd'); fetchMembers(membersGang); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                            }} className="text-[0.45rem] text-gold hover:underline" title="Promoveer"><Crown size={10} /></button>
                          )}
                          <button onClick={async () => {
                            try { await adminCall('kick_gang_member', { gangId: membersGang.id, userId: m.user_id }); showToast('✅ Gekickt'); fetchMembers(membersGang); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                          }} className="text-[0.45rem] text-blood hover:underline" title="Kick"><X size={10} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wars Popup */}
      {showWars && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="game-card w-full max-w-sm space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold">⚔️ Gang Wars ({wars.length})</h3>
              <button onClick={() => setShowWars(false)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            {wars.length === 0 ? <p className="text-[0.55rem] text-muted-foreground text-center py-4">Geen actieve wars</p> : (
              <div className="space-y-1.5">
                {wars.map(w => (
                  <div key={w.id} className="bg-blood/5 border border-blood/30 rounded px-2 py-1.5">
                    <div className="flex items-center justify-between text-[0.5rem]">
                      <span className="font-bold">{w.attacker_name || 'Aanvaller'} vs {w.defender_name || 'Verdediger'}</span>
                      <GameBadge variant={w.status === 'active' ? 'blood' : 'muted'} size="xs">{w.status}</GameBadge>
                    </div>
                    <div className="flex items-center justify-between text-[0.45rem] text-muted-foreground mt-0.5">
                      <span>Score: {w.attacker_score} - {w.defender_score}</span>
                      {w.district_id && <span>📍 {DISTRICT_LABELS[w.district_id] || w.district_id}</span>}
                    </div>
                    {w.status === 'active' && (
                      <GameButton variant="muted" size="sm" className="mt-1 w-full" onClick={async () => {
                        try { await adminCall('end_gang_war', { warId: w.id }); showToast('✅ War beëindigd'); fetchWars(); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                      }}>BEËINDIG WAR</GameButton>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alliances Popup */}
      {showAlliances && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="game-card w-full max-w-sm space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold">🤝 Allianties ({alliances.length})</h3>
              <button onClick={() => setShowAlliances(false)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            {alliances.length === 0 ? <p className="text-[0.55rem] text-muted-foreground text-center py-4">Geen allianties</p> : (
              <div className="space-y-1.5">
                {alliances.map(a => (
                  <div key={a.id} className="bg-ice/5 border border-ice/30 rounded px-2 py-1.5">
                    <div className="flex items-center justify-between text-[0.5rem]">
                      <span className="font-bold">{a.gang_a_name || a.gang_a_id.slice(0,8)} ↔ {a.gang_b_name || a.gang_b_id.slice(0,8)}</span>
                      <GameBadge variant={a.status === 'active' ? 'emerald' : a.status === 'pending' ? 'gold' : 'muted'} size="xs">{a.status}</GameBadge>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[0.45rem] text-muted-foreground">Verloopt: {new Date(a.expires_at).toLocaleDateString('nl-NL')}</span>
                      <GameButton variant="blood" size="sm" onClick={async () => {
                        try { await adminCall('delete_alliance', { allianceId: a.id }); showToast('✅ Alliantie verwijderd'); fetchAlliances(); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
                      }}>VERWIJDER</GameButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Gang Verwijderen"
        message={`Verwijder gang "${confirmDelete?.name}" en al haar leden, territoria en wars?`}
        confirmText="VERWIJDER GANG"
        variant="danger"
        onConfirm={async () => {
          if (!confirmDelete) return;
          try { await adminCall('delete_gang', { gangId: confirmDelete.id }); showToast('✅ Gang verwijderd'); setConfirmDelete(null); fetchGangs(); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
