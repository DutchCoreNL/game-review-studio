import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, TrendingUp, TrendingDown, Minus, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SectionHeader } from '../ui/SectionHeader';

const DISTRICT_NAMES: Record<string, string> = {
  low: 'Lowrise', port: 'Port Nero', iron: 'Iron Borough', neon: 'Neon Strip', crown: 'Crown Heights',
};

const CATEGORY_CONFIG: Record<string, { icon: string; label: string; positive: string; negative: string }> = {
  violence: { icon: '⚔️', label: 'Geweld', positive: 'Gevreesd', negative: 'Zwak' },
  trade_trust: { icon: '🤝', label: 'Handel', positive: 'Vertrouwd', negative: 'Oplichter' },
  loyalty: { icon: '🛡️', label: 'Loyaal', positive: 'Trouw', negative: 'Verrader' },
  stealth: { icon: '🕵️', label: 'Stealth', positive: 'Spook', negative: 'Opvallend' },
  generosity: { icon: '💝', label: 'Genereus', positive: 'Held', negative: 'Gierig' },
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

function getOverallMood(echo: RepEcho): { emoji: string; label: string; color: string } {
  const avg = (echo.trade_trust + echo.loyalty + echo.generosity - echo.violence * 0.5) / 3;
  if (avg > 15) return { emoji: '😊', label: 'Gerespecteerd', color: 'text-emerald' };
  if (avg > 5) return { emoji: '😐', label: 'Neutraal', color: 'text-muted-foreground' };
  if (avg > -5) return { emoji: '😒', label: 'Op hoede', color: 'text-amber-400' };
  return { emoji: '😠', label: 'Vijandig', color: 'text-blood' };
}

function getDominantTrait(echo: RepEcho): { key: string; value: number } | null {
  const traits = ['violence', 'trade_trust', 'loyalty', 'stealth', 'generosity'] as const;
  let max = 0, maxKey = '';
  for (const t of traits) {
    const abs = Math.abs(echo[t]);
    if (abs > max) { max = abs; maxKey = t; }
  }
  return max > 5 ? { key: maxKey, value: echo[maxKey as keyof RepEcho] as number } : null;
}

interface Props {
  currentDistrict: string;
  compact?: boolean;
}

export function ReputationEchoIndicator({ currentDistrict, compact = false }: Props) {
  const { user } = useAuth();
  const [echoes, setEchoes] = useState<RepEcho[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('player_reputation_echo')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => { if (data) setEchoes(data as any[]); });
  }, [user]);

  const currentEcho = echoes.find(e => e.district_id === currentDistrict);

  if (compact) {
    if (!currentEcho || currentEcho.total_interactions < 3) return null;
    const mood = getOverallMood(currentEcho);
    const priceMod = Number(currentEcho.price_modifier);
    return (
      <motion.div 
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-1.5 text-[0.5rem]"
      >
        <Eye size={8} className="text-gold/60" />
        <span>{mood.emoji}</span>
        <span className={`font-bold ${mood.color}`}>{mood.label}</span>
        {priceMod !== 0 && (
          <span className={`flex items-center gap-0.5 ${priceMod > 0 ? 'text-blood' : 'text-emerald'}`}>
            <ShoppingCart size={7} />
            {priceMod > 0 ? '+' : ''}{(priceMod * 100).toFixed(0)}%
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <div>
      <SectionHeader title="Reputatie Echo" icon={<Eye size={12} />} badge="District" badgeColor="gold" />
      
      {echoes.length === 0 ? (
        <p className="text-[0.5rem] text-muted-foreground text-center py-3">
          Nog geen reputatie. Begin met handelen en operaties.
        </p>
      ) : (
        <div className="space-y-1.5">
          {echoes
            .filter(e => e.total_interactions >= 2)
            .sort((a, b) => (a.district_id === currentDistrict ? -1 : 1))
            .map(echo => {
              const mood = getOverallMood(echo);
              const dominant = getDominantTrait(echo);
              const isHere = echo.district_id === currentDistrict;
              const priceMod = Number(echo.price_modifier);

              return (
                <motion.div
                  key={echo.district_id}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border transition-colors ${
                    isHere 
                      ? 'bg-gold/5 border-gold/30' 
                      : 'bg-card/50 border-border/50'
                  }`}
                >
                  <span className="text-sm">{mood.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[0.5rem] font-bold ${isHere ? 'text-gold' : 'text-foreground'}`}>
                        {DISTRICT_NAMES[echo.district_id]}
                      </span>
                      <span className={`text-[0.4rem] font-bold ${mood.color}`}>{mood.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {dominant && (
                        <span className="text-[0.4rem] text-muted-foreground">
                          {CATEGORY_CONFIG[dominant.key]?.icon} {dominant.value > 0 
                            ? CATEGORY_CONFIG[dominant.key]?.positive 
                            : CATEGORY_CONFIG[dominant.key]?.negative}
                        </span>
                      )}
                      {priceMod !== 0 && (
                        <span className={`text-[0.4rem] font-bold ${priceMod > 0 ? 'text-blood' : 'text-emerald'}`}>
                          {priceMod > 0 ? '📈' : '📉'} {priceMod > 0 ? '+' : ''}{(priceMod * 100).toFixed(0)}% prijzen
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[0.35rem] text-muted-foreground">{echo.total_interactions} acties</span>
                </motion.div>
              );
            })}
        </div>
      )}
    </div>
  );
}
