import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Shield, AlertTriangle, Clock, DollarSign, Users, Swords, MapPin, Loader2 } from 'lucide-react';
import { gameApi } from '@/lib/gameApi';
import { ConfirmDialog } from '../ConfirmDialog';

interface Mole {
  id: string;
  target_gang_id: string;
  target_gang_name: string;
  target_gang_tag: string;
  status: 'active' | 'extracted' | 'discovered';
  cover_strength: number;
  intel_reports: IntelReport[];
  planted_at: string;
  discovered_at: string | null;
  discovery_consequence: string | null;
}

interface IntelReport {
  timestamp: string;
  treasury: number;
  level: number;
  memberCount: number;
  activeWars: number;
  warTargets: string[];
  territories: { district: string; defense: number }[];
}

interface MolePanelProps {
  gangs: { id: string; name: string; tag: string }[];
  playerGangId: string | null;
}

const DISTRICT_NAMES: Record<string, string> = {
  low: 'Lowrise', port: 'Port Nero', iron: 'Iron Borough', neon: 'Neon Strip', crown: 'Crown Heights'
};

export function MolePanel({ gangs, playerGangId }: MolePanelProps) {
  const [moles, setMoles] = useState<Mole[]>([]);
  const [loading, setLoading] = useState(true);
  const [planting, setPlanting] = useState(false);
  const [selectedGang, setSelectedGang] = useState<string | null>(null);
  const [confirmPlant, setConfirmPlant] = useState(false);
  const [confirmExtract, setConfirmExtract] = useState<string | null>(null);
  const [expandedMole, setExpandedMole] = useState<string | null>(null);

  const fetchMoles = async () => {
    const res = await gameApi.getMoles();
    if (res.success && res.data?.moles) {
      setMoles(res.data.moles);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMoles(); }, []);

  const handlePlant = async () => {
    if (!selectedGang) return;
    setPlanting(true);
    const res = await gameApi.plantMole(selectedGang);
    if (res.success) {
      await fetchMoles();
      setSelectedGang(null);
    }
    setPlanting(false);
    setConfirmPlant(false);
  };

  const handleExtract = async (moleId: string) => {
    const res = await gameApi.extractMole(moleId);
    if (res.success) {
      await fetchMoles();
    }
    setConfirmExtract(null);
  };

  const activeMoles = moles.filter(m => m.status === 'active');
  const pastMoles = moles.filter(m => m.status !== 'active');
  const availableGangs = gangs.filter(g => 
    g.id !== playerGangId && !activeMoles.some(m => m.target_gang_id === g.id)
  );

  const getCoverColor = (cover: number) => {
    if (cover > 70) return 'text-emerald-400';
    if (cover > 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getCoverLabel = (cover: number) => {
    if (cover > 70) return 'Veilig';
    if (cover > 40) return 'Risicovol';
    return 'Gevaarlijk';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Eye size={18} className="text-primary" />
        <h3 className="font-bold text-sm uppercase tracking-wider">Informanten & Mollen</h3>
        <span className="ml-auto text-xs text-muted-foreground">{activeMoles.length}/2 actief</span>
      </div>

      {/* Plant new mole */}
      {activeMoles.length < 2 && playerGangId && (
        <div className="game-card p-3 border-l-2 border-l-primary/50">
          <p className="text-xs text-muted-foreground mb-2">
            Plant een mol in een rivaliserende gang om geheime intel te verzamelen.
            <br />
            <span className="text-primary">Kosten: €5.000 + 20 energy</span>
          </p>
          <div className="flex gap-2">
            <select
              value={selectedGang || ''}
              onChange={e => setSelectedGang(e.target.value || null)}
              className="flex-1 bg-muted border border-border rounded px-2 py-1.5 text-xs"
            >
              <option value="">Kies een gang...</option>
              {availableGangs.map(g => (
                <option key={g.id} value={g.id}>[{g.tag}] {g.name}</option>
              ))}
            </select>
            <button
              onClick={() => setConfirmPlant(true)}
              disabled={!selectedGang || planting}
              className="px-3 py-1.5 rounded text-xs font-bold bg-primary text-primary-foreground disabled:opacity-50"
            >
              {planting ? <Loader2 size={12} className="animate-spin" /> : '🕵️ Plant Mol'}
            </button>
          </div>
        </div>
      )}

      {/* Active moles */}
      <AnimatePresence>
        {activeMoles.map(mole => {
          const latestIntel = mole.intel_reports?.[mole.intel_reports.length - 1];
          const daysActive = Math.floor((Date.now() - new Date(mole.planted_at).getTime()) / (1000 * 60 * 60 * 24));
          const isExpanded = expandedMole === mole.id;

          return (
            <motion.div
              key={mole.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="game-card p-3 border-l-2 border-l-emerald-500/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-emerald-400" />
                  <span className="text-xs font-bold">[{mole.target_gang_tag}] {mole.target_gang_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 text-xs ${getCoverColor(mole.cover_strength)}`}>
                    <Shield size={12} />
                    {mole.cover_strength}% — {getCoverLabel(mole.cover_strength)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1"><Clock size={10} /> {daysActive}d actief</span>
                <span className="flex items-center gap-1">📊 {mole.intel_reports?.length || 0} rapporten</span>
              </div>

              {/* Cover strength bar */}
              <div className="w-full h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    mole.cover_strength > 70 ? 'bg-emerald-500' : mole.cover_strength > 40 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${mole.cover_strength}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Latest intel summary */}
              {latestIntel && (
                <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                  <div className="bg-muted/50 rounded p-1.5 text-center">
                    <DollarSign size={10} className="mx-auto mb-0.5 text-gold" />
                    <span className="font-mono">€{latestIntel.treasury.toLocaleString()}</span>
                  </div>
                  <div className="bg-muted/50 rounded p-1.5 text-center">
                    <Users size={10} className="mx-auto mb-0.5" />
                    <span>{latestIntel.memberCount} leden</span>
                  </div>
                  <div className="bg-muted/50 rounded p-1.5 text-center">
                    <Swords size={10} className="mx-auto mb-0.5 text-blood" />
                    <span>{latestIntel.activeWars} oorlogen</span>
                  </div>
                  <div className="bg-muted/50 rounded p-1.5 text-center">
                    <MapPin size={10} className="mx-auto mb-0.5" />
                    <span>{latestIntel.territories?.length || 0} gebieden</span>
                  </div>
                </div>
              )}

              {/* Expanded intel history */}
              <button
                onClick={() => setExpandedMole(isExpanded ? null : mole.id)}
                className="text-xs text-primary/80 hover:text-primary mb-2"
              >
                {isExpanded ? '▾ Verberg historie' : '▸ Toon intel-historie'}
              </button>

              <AnimatePresence>
                {isExpanded && mole.intel_reports?.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {[...mole.intel_reports].reverse().map((report, i) => (
                        <div key={i} className="text-xs bg-muted/30 rounded p-2 flex justify-between">
                          <span className="text-muted-foreground">
                            {new Date(report.timestamp).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>
                            💰€{report.treasury.toLocaleString()} | 👥{report.memberCount} | ⚔️{report.activeWars} oorlogen
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setConfirmExtract(mole.id)}
                  className="flex-1 py-1.5 rounded text-xs font-bold bg-muted border border-border text-muted-foreground hover:bg-accent"
                >
                  <EyeOff size={12} className="inline mr-1" />
                  Extraheer Mol
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Discovered/extracted moles */}
      {pastMoles.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs text-muted-foreground uppercase mb-2">Afgesloten</h4>
          {pastMoles.slice(0, 3).map(mole => (
            <div key={mole.id} className={`game-card p-2 mb-1 border-l-2 ${
              mole.status === 'discovered' ? 'border-l-red-500/50 opacity-60' : 'border-l-muted opacity-60'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span>
                  {mole.status === 'discovered' ? '🔴' : '✅'} [{mole.target_gang_tag}] {mole.target_gang_name}
                </span>
                <span className="text-muted-foreground">
                  {mole.status === 'discovered' ? 'Ontdekt' : 'Geëxtraheerd'} — {mole.intel_reports?.length || 0} rapporten
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeMoles.length === 0 && pastMoles.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Je hebt nog geen mollen geplaatst. Infiltreer een rivaliserende gang!
        </p>
      )}

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmPlant}
        title="Mol planten"
        message={`Wil je een mol infiltreren bij deze gang? Dit kost €5.000 en 20 energy. De mol verzamelt dagelijks intel maar kan ontdekt worden.`}
        confirmText="PLANT MOL"
        variant="warning"
        onConfirm={handlePlant}
        onCancel={() => setConfirmPlant(false)}
      />
      <ConfirmDialog
        open={!!confirmExtract}
        title="Mol extraheren"
        message="Wil je deze mol veilig terugtrekken? Je behoudt alle verzamelde intel maar verliest de actieve informatiestroom."
        confirmText="EXTRAHEER"
        variant="default"
        onConfirm={() => confirmExtract && handleExtract(confirmExtract)}
        onCancel={() => setConfirmExtract(null)}
      />
    </div>
  );
}
