import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { SubTabBar } from '../ui/SubTabBar';
import { X, Trash2, Package, Shirt, Car, Zap, Users, Building2, Home, Castle, Award, GraduationCap, Skull } from 'lucide-react';

async function adminCall(action: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('admin-actions', { body: { action, ...extra } });
  if (error) throw error;
  return data;
}

interface Props {
  entry: { user_id: string; username: string };
  detail: Record<string, any>;
  onClose: () => void;
  showToast: (msg: string, isError?: boolean) => void;
}

type DetailTab = 'inventory' | 'gear' | 'vehicles' | 'skills' | 'crew' | 'businesses' | 'safehouses' | 'villa' | 'titles' | 'education' | 'nemesis';

const DISTRICT_LABELS: Record<string, string> = { low: 'Lowtown', port: 'De Haven', neon: 'Neon Mile', iron: 'IJzerbuurt', crown: 'De Kroon' };

export function AdminPlayerDetailPopup({ entry, detail, onClose, showToast }: Props) {
  const [tab, setTab] = useState<DetailTab>('inventory');

  const deleteItem = async (table: string, itemId: string) => {
    try {
      await adminCall('delete_player_item', { table, itemId, userId: entry.user_id });
      showToast('✅ Item verwijderd');
      // We don't refetch — just remove from local state would need parent callback
    } catch (e: any) { showToast(`❌ ${e.message}`, true); }
  };

  const deleteVilla = async () => {
    try {
      await adminCall('delete_player_villa', { userId: entry.user_id });
      showToast('✅ Villa verwijderd');
    } catch (e: any) { showToast(`❌ ${e.message}`, true); }
  };

  const renderList = (items: any[], table: string, renderItem: (item: any) => React.ReactNode) => {
    if (!items || items.length === 0) return <p className="text-center py-4 text-muted-foreground text-[0.5rem]">Geen items</p>;
    return (
      <div className="space-y-1">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1.5">
            <div className="flex-1 min-w-0">{renderItem(item)}</div>
            <button onClick={() => deleteItem(table, item.id)} className="p-1 rounded bg-blood/10 border border-blood/30 text-blood hover:bg-blood/20 shrink-0 ml-1"><Trash2 size={8} /></button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="game-card w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold flex items-center gap-1.5">📦 Speler Detail: {entry.username}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
        </div>

        <SubTabBar
          tabs={[
            { id: 'inventory', label: 'INV', icon: <Package size={8} /> },
            { id: 'gear', label: 'GEAR', icon: <Shirt size={8} /> },
            { id: 'vehicles', label: 'AUTO', icon: <Car size={8} /> },
            { id: 'skills', label: 'SKILLS', icon: <Zap size={8} /> },
            { id: 'crew', label: 'CREW', icon: <Users size={8} /> },
            { id: 'businesses', label: 'BIZ', icon: <Building2 size={8} /> },
            { id: 'safehouses', label: 'SAFE', icon: <Home size={8} /> },
            { id: 'villa', label: 'VILLA', icon: <Castle size={8} /> },
            { id: 'titles', label: 'TITELS', icon: <Award size={8} /> },
            { id: 'education', label: 'EDU', icon: <GraduationCap size={8} /> },
            { id: 'nemesis', label: 'NEMESIS', icon: <Skull size={8} /> },
          ]}
          active={tab}
          onChange={(t) => setTab(t as DetailTab)}
        />

        {tab === 'inventory' && renderList(detail.inventory, 'player_inventory', (item) => (
          <div>
            <span className="text-[0.5rem] font-bold">{item.good_id}</span>
            <span className="text-[0.45rem] text-muted-foreground ml-1.5">x{item.quantity} (avg €{item.avg_cost})</span>
          </div>
        ))}

        {tab === 'gear' && renderList(detail.gear, 'player_gear', (item) => (
          <div>
            <span className="text-[0.5rem] font-bold">{item.gear_id}</span>
            <span className="text-[0.45rem] text-muted-foreground ml-1.5">{new Date(item.acquired_at).toLocaleDateString('nl-NL')}</span>
          </div>
        ))}

        {tab === 'vehicles' && renderList(detail.vehicles, 'player_vehicles', (item) => (
          <div>
            <span className="text-[0.5rem] font-bold">{item.vehicle_id}</span>
            <div className="flex gap-2 text-[0.45rem] text-muted-foreground">
              <span>Conditie: {item.condition}%</span>
              <span>Heat: {item.vehicle_heat}</span>
              {item.is_active && <GameBadge variant="emerald" size="xs">ACTIEF</GameBadge>}
            </div>
          </div>
        ))}

        {tab === 'skills' && renderList(detail.skills, 'player_skills', (item) => (
          <div className="flex items-center gap-2">
            <span className="text-[0.5rem] font-bold">{item.skill_id}</span>
            <span className="text-[0.45rem] text-muted-foreground">Lv.{item.level}</span>
          </div>
        ))}

        {tab === 'crew' && renderList(detail.crew, 'player_crew', (item) => (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[0.5rem] font-bold">{item.name}</span>
              <GameBadge variant="muted" size="xs">{item.role}</GameBadge>
              {item.specialization && <GameBadge variant="purple" size="xs">{item.specialization}</GameBadge>}
            </div>
            <div className="flex gap-2 text-[0.45rem] text-muted-foreground">
              <span>Lv.{item.level}</span>
              <span>HP {item.hp}</span>
              <span>Loyalty {item.loyalty}</span>
              <span>XP {item.xp}</span>
            </div>
          </div>
        ))}

        {tab === 'businesses' && renderList(detail.businesses, 'player_businesses', (item) => (
          <div>
            <span className="text-[0.5rem] font-bold">{item.business_id}</span>
            <span className="text-[0.45rem] text-muted-foreground ml-1.5">{new Date(item.acquired_at).toLocaleDateString('nl-NL')}</span>
          </div>
        ))}

        {tab === 'safehouses' && renderList(detail.safehouses, 'player_safehouses', (item) => (
          <div>
            <span className="text-[0.5rem] font-bold">{DISTRICT_LABELS[item.district_id] || item.district_id}</span>
            <span className="text-[0.45rem] text-muted-foreground ml-1.5">Lv.{item.level}</span>
          </div>
        ))}

        {tab === 'villa' && (
          detail.villa ? (
            <div className="game-card space-y-2">
              <div className="grid grid-cols-2 gap-1.5 text-[0.5rem]">
                <div><span className="text-muted-foreground">Level:</span> <span className="font-bold">{detail.villa.level}</span></div>
                <div><span className="text-muted-foreground">Vault:</span> <span className="font-bold">€{Number(detail.villa.vault_money).toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Ammo:</span> <span className="font-bold">{detail.villa.stored_ammo}</span></div>
                <div><span className="text-muted-foreground">Aankoop dag:</span> <span className="font-bold">{detail.villa.purchase_day}</span></div>
              </div>
              <GameButton variant="blood" size="sm" onClick={deleteVilla} className="w-full">VERWIJDER VILLA</GameButton>
            </div>
          ) : <p className="text-center py-4 text-muted-foreground text-[0.5rem]">Geen villa</p>
        )}

        {tab === 'titles' && renderList(detail.titles, 'player_titles', (item) => (
          <div className="flex items-center gap-1.5">
            <span>{item.title_icon}</span>
            <span className="text-[0.5rem] font-bold">{item.title_name}</span>
            {item.is_active && <GameBadge variant="gold" size="xs">ACTIEF</GameBadge>}
          </div>
        ))}

        {tab === 'education' && renderList(detail.education, 'player_education', (item) => (
          <div>
            <span className="text-[0.5rem] font-bold">{item.course_id}</span>
            <GameBadge variant={item.status === 'completed' ? 'emerald' : 'gold'} size="xs" className="ml-1.5">{item.status}</GameBadge>
          </div>
        ))}

        {tab === 'nemesis' && (
          !detail.nemesis || detail.nemesis.length === 0
            ? <p className="text-center py-4 text-muted-foreground text-[0.5rem]">Geen nemesis</p>
            : <div className="space-y-1">
              {detail.nemesis.map((n: any) => (
                <div key={n.id} className="bg-blood/5 border border-blood/30 rounded px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[0.5rem] font-bold">🎭 {n.nemesis_id}</span>
                    <GameBadge variant={n.status === 'active' ? 'blood' : 'muted'} size="xs">{n.status}</GameBadge>
                  </div>
                  <div className="text-[0.45rem] text-muted-foreground">
                    District: {DISTRICT_LABELS[n.district_id] || n.district_id} · Progress: {n.arc_progress}%
                  </div>
                </div>
              ))}
            </div>
        )}

        <div className="flex justify-end pt-1">
          <GameButton variant="muted" size="sm" onClick={onClose}>SLUITEN</GameButton>
        </div>
      </div>
    </div>
  );
}
