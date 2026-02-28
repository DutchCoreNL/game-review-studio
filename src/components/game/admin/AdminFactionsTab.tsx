import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { RefreshCw, Pencil, X, Heart, Swords, Shield } from 'lucide-react';

async function adminCall(action: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('admin-actions', { body: { action, ...extra } });
  if (error) throw error;
  return data;
}

interface FactionRelation {
  id: string; faction_id: string; global_relation: number; boss_hp: number; boss_max_hp: number;
  conquest_progress: number; conquest_phase: string; status: string;
  conquered_by: string | null; vassal_owner_id: string | null;
}

const FACTION_LABELS: Record<string, string> = {
  yakuza: '🐉 Yakuza', cartel: '💀 Cartel', bratva: '🐻 Bratva', triad: '🔴 Triad', mafia: '🎩 Mafia',
};

interface Props { showToast: (msg: string, isError?: boolean) => void; }

export function AdminFactionsTab({ showToast }: Props) {
  const [factions, setFactions] = useState<FactionRelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [editFaction, setEditFaction] = useState<FactionRelation | null>(null);
  const [editVals, setEditVals] = useState<Record<string, unknown>>({});

  const fetchFactions = async () => {
    setLoading(true);
    try { const d = await adminCall('get_factions'); setFactions(d.factions || []); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
    setLoading(false);
  };

  useEffect(() => { fetchFactions(); }, []);

  return (
    <div className="mt-2 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[0.55rem] text-muted-foreground">{factions.length} facties</p>
        <div className="flex gap-1">
          <GameButton variant="emerald" size="sm" icon={<Heart size={10} />} onClick={async () => {
            try { await adminCall('reset_all_faction_bosses'); showToast('✅ Alle faction bosses gereset'); fetchFactions(); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
          }}>RESET BOSSES</GameButton>
          <GameButton variant="muted" size="sm" icon={<RefreshCw size={10} />} onClick={fetchFactions}>REFRESH</GameButton>
        </div>
      </div>

      {loading ? <div className="text-center py-8 text-muted-foreground text-xs">Laden...</div> : (
        <div className="space-y-1.5">
          {factions.map(f => {
            const hpPct = f.boss_max_hp > 0 ? Math.round((f.boss_hp / f.boss_max_hp) * 100) : 0;
            return (
              <div key={f.id} className="game-card">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">{FACTION_LABELS[f.faction_id] || f.faction_id}</span>
                    <GameBadge variant={f.status === 'active' ? 'emerald' : f.status === 'conquered' ? 'blood' : 'muted'} size="xs">{f.status}</GameBadge>
                  </div>
                  <button onClick={() => { setEditFaction(f); setEditVals({ global_relation: f.global_relation, boss_hp: f.boss_hp, boss_max_hp: f.boss_max_hp, conquest_progress: f.conquest_progress, conquest_phase: f.conquest_phase, status: f.status }); }} className="p-1.5 rounded bg-emerald/10 border border-emerald/30 text-emerald hover:bg-emerald/20 transition-colors"><Pencil size={10} /></button>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[0.45rem] text-muted-foreground">
                    <span>Relatie: {f.global_relation}</span>
                    <span>Conquest: {f.conquest_progress}% ({f.conquest_phase})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.45rem] text-muted-foreground">Boss HP:</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${hpPct > 50 ? 'bg-emerald' : hpPct > 20 ? 'bg-gold' : 'bg-blood'}`} style={{ width: `${hpPct}%` }} />
                    </div>
                    <span className="text-[0.45rem] font-bold">{f.boss_hp}/{f.boss_max_hp}</span>
                  </div>
                  {f.conquered_by && <span className="text-[0.4rem] text-blood">Veroverd door: {f.conquered_by}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Faction Popup */}
      {editFaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="game-card w-full max-w-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold">✏️ Factie: {FACTION_LABELS[editFaction.faction_id] || editFaction.faction_id}</h3>
              <button onClick={() => setEditFaction(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            {[
              { key: 'global_relation', label: 'Relatie (-100 tot 100)', type: 'number' },
              { key: 'boss_hp', label: 'Boss HP', type: 'number' },
              { key: 'boss_max_hp', label: 'Boss Max HP', type: 'number' },
              { key: 'conquest_progress', label: 'Conquest %', type: 'number' },
            ].map(f => (
              <div key={f.key} className="flex items-center gap-2">
                <label className="text-[0.5rem] text-muted-foreground w-28 shrink-0">{f.label}</label>
                <input type={f.type} value={String(editVals[f.key] ?? '')} onChange={e => setEditVals(v => ({ ...v, [f.key]: Number(e.target.value) }))} className="flex-1 bg-background border border-border rounded px-1.5 py-0.5 text-[0.5rem]" />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <label className="text-[0.5rem] text-muted-foreground w-28 shrink-0">Conquest Phase</label>
              <select value={String(editVals.conquest_phase || '')} onChange={e => setEditVals(v => ({ ...v, conquest_phase: e.target.value }))} className="flex-1 bg-background border border-border rounded px-1.5 py-0.5 text-[0.5rem]">
                {['none', 'infiltrating', 'weakening', 'assault', 'conquered'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[0.5rem] text-muted-foreground w-28 shrink-0">Status</label>
              <select value={String(editVals.status || '')} onChange={e => setEditVals(v => ({ ...v, status: e.target.value }))} className="flex-1 bg-background border border-border rounded px-1.5 py-0.5 text-[0.5rem]">
                {['active', 'conquered', 'vassal'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <GameButton variant="muted" size="sm" onClick={() => setEditFaction(null)} className="flex-1">ANNULEER</GameButton>
              <GameButton variant="emerald" size="sm" onClick={async () => {
                try { await adminCall('edit_faction', { factionId: editFaction.id, stats: editVals }); showToast('✅ Factie opgeslagen'); setEditFaction(null); fetchFactions(); } catch (e: any) { showToast(`❌ ${e.message}`, true); }
              }} className="flex-1">OPSLAAN</GameButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
