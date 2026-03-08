import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Target, Trophy, Crown, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SectionHeader } from '../ui/SectionHeader';

interface BountyHunter {
  claimed_by: string;
  claimCount: number;
  totalAmount: number;
  username: string;
}

export function BountyHunterLeaderboard() {
  const [hunters, setHunters] = useState<BountyHunter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    // Get claimed bounties from last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('player_bounties')
      .select('claimed_by, amount')
      .eq('status', 'claimed')
      .gte('claimed_at', weekAgo)
      .not('claimed_by', 'is', null);

    if (data && data.length > 0) {
      // Aggregate by claimer
      const map: Record<string, { total: number; count: number }> = {};
      data.forEach(b => {
        if (!b.claimed_by) return;
        if (!map[b.claimed_by]) map[b.claimed_by] = { total: 0, count: 0 };
        map[b.claimed_by].total += b.amount;
        map[b.claimed_by].count += 1;
      });

      // Fetch usernames
      const ids = Object.keys(map);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', ids);

      const profileMap: Record<string, string> = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p.username; });

      const list: BountyHunter[] = ids.map(id => ({
        claimed_by: id,
        claimCount: map[id].count,
        totalAmount: map[id].total,
        username: profileMap[id] || 'Onbekend',
      })).sort((a, b) => b.claimCount - a.claimCount || b.totalAmount - a.totalAmount);

      setHunters(list.slice(0, 10));
    } else {
      setHunters([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const RANK_STYLES = [
    { bg: 'bg-gold/15 border-gold/40', text: 'text-gold', icon: <Crown size={10} className="text-gold" /> },
    { bg: 'bg-muted/30 border-border', text: 'text-foreground', icon: <Trophy size={10} className="text-muted-foreground" /> },
    { bg: 'bg-amber-900/15 border-amber-700/30', text: 'text-amber-400', icon: <Trophy size={10} className="text-amber-600" /> },
  ];

  if (loading) return <div className="flex justify-center py-3"><Loader2 size={14} className="animate-spin text-gold" /></div>;
  if (hunters.length === 0) return null;

  return (
    <div>
      <SectionHeader title="Koppensnellers" icon={<Target size={12} />} badge="Wekelijks" badgeColor="blood" />
      <div className="space-y-1">
        {hunters.map((h, i) => {
          const style = RANK_STYLES[i] || { bg: 'bg-card/50 border-border/50', text: 'text-muted-foreground', icon: null };
          return (
            <motion.div
              key={h.claimed_by}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded border ${style.bg}`}
            >
              <span className={`text-[0.55rem] font-bold w-4 text-center ${style.text}`}>
                {i < 3 ? style.icon : `#${i + 1}`}
              </span>
              <div className="flex-1 min-w-0">
                <span className={`text-[0.55rem] font-bold ${i === 0 ? 'text-gold' : 'text-foreground'}`}>
                  {h.username}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[0.4rem]">
                <span className="text-blood font-bold">{h.claimCount} kills</span>
                <span className="text-emerald">€{h.totalAmount.toLocaleString()}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
      <p className="text-[0.35rem] text-muted-foreground text-center mt-1 flex items-center justify-center gap-1">
        <Clock size={7} /> Reset elke maandag
      </p>
    </div>
  );
}
