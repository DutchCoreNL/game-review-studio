import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Shield, AlertTriangle, Loader2, Target, CheckCircle, XCircle } from 'lucide-react';
import { gameApi } from '@/lib/gameApi';
import { GameButton } from '../ui/GameButton';
import { SectionHeader } from '../ui/SectionHeader';
import { Progress } from '@/components/ui/progress';

const FACTIONS = [
  { id: 'cartel', name: 'Het Kartel', icon: '🌿', desc: 'Drugsimperium met ijzeren hand' },
  { id: 'bikers', name: 'De Bikers', icon: '🏍️', desc: 'Wapenhandel en geweld' },
  { id: 'syndicate', name: 'Het Syndicaat', icon: '🏢', desc: 'High-tech criminaliteit' },
];

interface UndercoverMission {
  id: string;
  target_faction: string;
  cover_identity: string;
  cover_integrity: number;
  days_active: number;
  intel_gathered: any[];
  missions_completed: number;
  status: string;
  started_at: string;
}

export function UndercoverPanel() {
  const [missions, setMissions] = useState<UndercoverMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState('');

  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchMissions = useCallback(async () => {
    setLoading(true);
    const res = await gameApi.getUndercoverMissions();
    if (res.success && res.data) {
      setMissions(res.data.missions || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  const startMission = async (factionId: string) => {
    setActing(true);
    const res = await gameApi.startUndercover(factionId);
    showMsg(res.message);
    if (res.success) fetchMissions();
    setActing(false);
  };

  const doMission = async (missionId: string) => {
    setActing(true);
    const res = await gameApi.undercoverAction(missionId, 'mission');
    showMsg(res.message);
    if (res.success) fetchMissions();
    setActing(false);
  };

  const extract = async (missionId: string) => {
    setActing(true);
    const res = await gameApi.undercoverAction(missionId, 'extract');
    showMsg(res.message);
    if (res.success) fetchMissions();
    setActing(false);
  };

  const activeMission = missions.find(m => m.status === 'active');
  const pastMissions = missions.filter(m => m.status !== 'active');

  if (loading) return <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-gold" /></div>;

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] bg-background border border-gold/40 rounded px-3 py-1.5 text-xs text-gold shadow-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <SectionHeader title="Undercover Infiltratie" icon={<EyeOff size={12} />} badge="🕵️ Geheim" badgeColor="gold" />

      <p className="text-[0.55rem] text-muted-foreground">
        Infiltreer een rivaliserende factie met een valse identiteit. Voer hun missies uit, verzamel intel, en extraheer wanneer je klaar bent. Pas op: ontmaskering = bounty + vijanden.
      </p>

      {/* Active mission */}
      {activeMission ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="game-card border-gold/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff size={14} className="text-gold" />
              <span className="text-xs font-bold text-gold">
                {FACTIONS.find(f => f.id === activeMission.target_faction)?.name || activeMission.target_faction}
              </span>
            </div>
            <span className="text-[0.45rem] text-muted-foreground">Dag {activeMission.days_active}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[0.5rem] text-muted-foreground">
            <Shield size={9} /> Identiteit: <span className="text-foreground font-medium">{activeMission.cover_identity}</span>
          </div>

          {/* Cover Integrity */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[0.45rem] text-muted-foreground uppercase tracking-wider">Dekmantel Integriteit</span>
              <span className={`text-[0.5rem] font-bold ${activeMission.cover_integrity > 60 ? 'text-emerald-400' : activeMission.cover_integrity > 30 ? 'text-orange-400' : 'text-blood'}`}>
                {activeMission.cover_integrity}%
              </span>
            </div>
            <Progress value={activeMission.cover_integrity} className="h-1.5 bg-muted/30" />
            {activeMission.cover_integrity < 30 && (
              <div className="flex items-center gap-1 mt-1 text-[0.45rem] text-blood">
                <AlertTriangle size={8} /> Dekmantel in gevaar! Overweeg extractie.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[0.5rem]">
            <div className="game-card bg-muted/10 text-center">
              <Target size={10} className="mx-auto text-gold mb-0.5" />
              <span className="font-bold">{activeMission.missions_completed}</span>
              <span className="text-muted-foreground"> missies</span>
            </div>
            <div className="game-card bg-muted/10 text-center">
              <Eye size={10} className="mx-auto text-gold mb-0.5" />
              <span className="font-bold">{activeMission.intel_gathered?.length || 0}</span>
              <span className="text-muted-foreground"> intel</span>
            </div>
          </div>

          {/* Intel log */}
          {activeMission.intel_gathered && activeMission.intel_gathered.length > 0 && (
            <div className="max-h-24 overflow-y-auto space-y-1">
              {(activeMission.intel_gathered as any[]).slice(-5).map((intel: any, i: number) => (
                <div key={i} className="text-[0.45rem] text-muted-foreground flex items-start gap-1">
                  <span className="text-gold">📋</span> {intel.text || JSON.stringify(intel)}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <GameButton onClick={() => doMission(activeMission.id)} disabled={acting} variant="gold" size="sm" fullWidth>
              <Target size={10} /> Missie Uitvoeren
            </GameButton>
            <GameButton onClick={() => extract(activeMission.id)} disabled={acting}
              variant={activeMission.missions_completed >= 3 ? 'gold' : 'muted'} size="sm" fullWidth>
              <Shield size={10} /> Extraheer
            </GameButton>
          </div>
          {activeMission.missions_completed < 3 && (
            <p className="text-[0.4rem] text-muted-foreground text-center">Min. 3 missies nodig voor volledige extractie-bonus</p>
          )}
        </motion.div>
      ) : (
        <div>
          <span className="text-[0.5rem] text-muted-foreground uppercase tracking-wider font-bold">Kies een factie om te infiltreren:</span>
          <div className="space-y-2 mt-2">
            {FACTIONS.map(faction => (
              <motion.div key={faction.id} whileHover={{ scale: 1.01 }}
                className="game-card flex items-center justify-between hover:border-gold/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{faction.icon}</span>
                  <div>
                    <span className="text-xs font-bold">{faction.name}</span>
                    <p className="text-[0.45rem] text-muted-foreground">{faction.desc}</p>
                  </div>
                </div>
                <GameButton onClick={() => startMission(faction.id)} disabled={acting} variant="gold" size="sm">
                  <EyeOff size={10} /> Infiltreer
                </GameButton>
              </motion.div>
            ))}
          </div>
          <p className="text-[0.45rem] text-muted-foreground mt-2">Kost: €10.000 + 30 energy • Min. Level 15</p>
        </div>
      )}

      {/* Past missions */}
      {pastMissions.length > 0 && (
        <div>
          <SectionHeader title="Afgeronde Missies" icon={<CheckCircle size={12} />} badge={`${pastMissions.length}`} badgeColor="purple" />
          <div className="space-y-1">
            {pastMissions.slice(0, 5).map(m => (
              <div key={m.id} className="game-card opacity-70 flex items-center justify-between">
                <div>
                  <span className="text-[0.5rem] font-bold">
                    {FACTIONS.find(f => f.id === m.target_faction)?.icon} {FACTIONS.find(f => f.id === m.target_faction)?.name}
                  </span>
                  <span className="text-[0.4rem] text-muted-foreground ml-2">{m.days_active} dagen</span>
                </div>
                {m.status === 'extracted' ? (
                  <CheckCircle size={10} className="text-emerald-400" />
                ) : (
                  <XCircle size={10} className="text-blood" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
