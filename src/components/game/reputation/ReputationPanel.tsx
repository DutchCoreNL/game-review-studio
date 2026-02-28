import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eye, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SectionHeader } from '../ui/SectionHeader';
import { useAuth } from '@/hooks/useAuth';

const DISTRICT_NAMES: Record<string, string> = {
  low: 'Lowrise', port: 'Port Nero', iron: 'Iron Borough', neon: 'Neon Strip', crown: 'Crown Heights',
};

const CATEGORY_INFO: Record<string, { label: string; icon: string; desc: string }> = {
  violence: { label: 'Geweld', icon: '⚔️', desc: 'Hoe gewelddadig je bent in dit district' },
  trade_trust: { label: 'Handelaar', icon: '🤝', desc: 'Vertrouwen van handelaren' },
  loyalty: { label: 'Loyaliteit', icon: '🛡️', desc: 'Betrouwbaarheid en gang-trouw' },
  stealth: { label: 'Stealth', icon: '🕵️', desc: 'Hoe onopvallend je opereert' },
  generosity: { label: 'Vrijgevigheid', icon: '💝', desc: 'Hoe genereus je bent geweest' },
};

interface RepEcho {
  district_id: string;
  violence: number;
  trade_trust: number;
  loyalty: number;
  stealth: number;
  generosity: number;
  total_interactions: number;
  price_modifier: number;
}

export function ReputationPanel() {
  const { user } = useAuth();
  const [echoes, setEchoes] = useState<RepEcho[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRep = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('player_reputation_echo')
      .select('*')
      .eq('user_id', user.id);
    setEchoes((data as any[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchRep(); }, [fetchRep]);

  const getScoreColor = (score: number) => {
    if (score > 20) return 'text-emerald-400';
    if (score > 0) return 'text-emerald-300';
    if (score < -20) return 'text-blood';
    if (score < 0) return 'text-orange-400';
    return 'text-muted-foreground';
  };

  const getScoreIcon = (score: number) => {
    if (score > 10) return <TrendingUp size={8} className="text-emerald-400" />;
    if (score < -10) return <TrendingDown size={8} className="text-blood" />;
    return <Minus size={8} className="text-muted-foreground" />;
  };

  const getPriceLabel = (mod: number) => {
    if (mod > 0) return { text: `+${(mod * 100).toFixed(0)}% prijzen`, color: 'text-blood' };
    if (mod < 0) return { text: `${(mod * 100).toFixed(0)}% korting`, color: 'text-emerald-400' };
    return { text: 'Normaal', color: 'text-muted-foreground' };
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-gold" /></div>;

  return (
    <div className="space-y-4">
      <SectionHeader title="Reputatie Echo" icon={<Eye size={12} />} badge="🔮 Per District" badgeColor="gold" />

      <p className="text-[0.55rem] text-muted-foreground">
        Je acties laten een permanente schaduw achter in elk district. NPCs en handelaren herinneren zich alles.
      </p>

      {echoes.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground">
          <Eye size={24} className="mx-auto mb-2 opacity-30" />
          Nog geen reputatie opgebouwd. Begin met handelen, vechten en operaties in districten.
        </div>
      ) : (
        <div className="space-y-3">
          {echoes.sort((a, b) => b.total_interactions - a.total_interactions).map(echo => {
            const priceInfo = getPriceLabel(Number(echo.price_modifier));
            return (
              <motion.div key={echo.district_id}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className="game-card space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gold">{DISTRICT_NAMES[echo.district_id] || echo.district_id}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[0.45rem] font-bold ${priceInfo.color}`}>{priceInfo.text}</span>
                    <span className="text-[0.4rem] text-muted-foreground">{echo.total_interactions} acties</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1">
                  {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                    const score = echo[key as keyof RepEcho] as number;
                    return (
                      <div key={key} className="text-center">
                        <span className="text-sm">{info.icon}</span>
                        <div className={`text-[0.5rem] font-bold ${getScoreColor(score)} flex items-center justify-center gap-0.5`}>
                          {getScoreIcon(score)}
                          {score > 0 ? '+' : ''}{score}
                        </div>
                        <span className="text-[0.35rem] text-muted-foreground">{info.label}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
