import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { gameApi } from '@/lib/gameApi';
import { motion } from 'framer-motion';
import { Handshake, Shield, Clock, TrendingUp } from 'lucide-react';
import { GameButton } from '../ui/GameButton';
import { SectionHeader } from '../ui/SectionHeader';

interface Alliance {
  id: string;
  gang_a_id: string;
  gang_b_id: string;
  status: string;
  expires_at: string;
  benefits: { shared_defense: boolean; trade_bonus: number };
  gang_a_name?: string;
  gang_b_name?: string;
}

interface Props {
  gangId?: string;
}

function daysLeft(endsAt: string): number {
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export function GangAlliancePanel({ gangId }: Props) {
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [toast, setToast] = useState('');

  const fetch = useCallback(async () => {
    if (!gangId) return;
    const res = await gameApi.getGangAlliances();
    if (res.success && res.data) {
      setAlliances(res.data.alliances || []);
    }
  }, [gangId]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('gang-alliances-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gang_alliances' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  const handleAccept = async (allianceId: string) => {
    const res = await gameApi.acceptAlliance(allianceId);
    setToast(res.message);
    setTimeout(() => setToast(''), 3000);
    fetch();
  };

  const handleBreak = async (allianceId: string) => {
    const res = await gameApi.breakAlliance(allianceId);
    setToast(res.message);
    setTimeout(() => setToast(''), 3000);
    fetch();
  };

  if (!gangId) return null;

  const active = alliances.filter(a => a.status === 'active');
  const pending = alliances.filter(a => a.status === 'pending');

  return (
    <div>
      <SectionHeader title="Allianties" icon={<Handshake size={12} />} badge={`${active.length}`} badgeColor="emerald" />

      {toast && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[0.5rem] text-gold bg-gold/10 rounded px-2 py-1 mb-2 text-center border border-gold/20">
          {toast}
        </motion.div>
      )}

      {/* Pending */}
      {pending.map(a => (
        <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="game-card border-l-[3px] border-l-gold mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gold">Verzoek: {a.gang_a_name || 'Gang'} ↔ {a.gang_b_name || 'Gang'}</span>
          </div>
          <div className="flex gap-2">
            <GameButton variant="emerald" size="sm" onClick={() => handleAccept(a.id)}>Accepteer</GameButton>
            <GameButton variant="muted" size="sm" onClick={() => handleBreak(a.id)}>Weiger</GameButton>
          </div>
        </motion.div>
      ))}

      {/* Active */}
      {active.length === 0 && pending.length === 0 ? (
        <p className="text-[0.5rem] text-muted-foreground text-center py-3">Geen actieve allianties.</p>
      ) : (
        active.map(a => {
          const partnerName = a.gang_a_id === gangId ? (a.gang_b_name || 'Geallieerde Gang') : (a.gang_a_name || 'Geallieerde Gang');
          const days = daysLeft(a.expires_at);
          
          return (
            <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="game-card mb-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Handshake size={12} className="text-emerald" />
                  <span className="text-xs font-bold">{partnerName}</span>
                </div>
                <span className="text-[0.4rem] text-muted-foreground flex items-center gap-0.5">
                  <Clock size={7} /> {days}d over
                </span>
              </div>
              <div className="flex items-center gap-3 text-[0.45rem] mb-2">
                {a.benefits.shared_defense && (
                  <span className="flex items-center gap-0.5 text-emerald"><Shield size={8} /> Gedeelde verdediging</span>
                )}
                {a.benefits.trade_bonus > 0 && (
                  <span className="flex items-center gap-0.5 text-gold"><TrendingUp size={8} /> +{Math.round(a.benefits.trade_bonus * 100)}% trade</span>
                )}
              </div>
              <GameButton variant="muted" size="sm" onClick={() => handleBreak(a.id)}>Alliantie Verbreken</GameButton>
            </motion.div>
          );
        })
      )}
    </div>
  );
}
