import { useWorldRaids } from '@/hooks/useWorldRaids';
import { motion } from 'framer-motion';
import { Shield, Swords, Users, Clock, Zap } from 'lucide-react';
import { GameButton } from '../ui/GameButton';
import { SectionHeader } from '../ui/SectionHeader';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';

function timeLeft(endsAt: string): string {
  const diff = Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return h > 0 ? `${h}u ${m}m` : `${m}m`;
}

const DISTRICT_NAMES: Record<string, string> = {
  low: 'Lowrise', port: 'Port Nero', iron: 'Iron Borough', neon: 'Neon Strip', crown: 'Crown Heights',
};

export function WorldRaidPanel() {
  const { raids, loading, attackRaid } = useWorldRaids();
  const [attacking, setAttacking] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const activeRaids = raids.filter(r => r.status === 'active');

  const handleAttack = async (raidId: string) => {
    setAttacking(raidId);
    const res = await attackRaid(raidId);
    setToast(res.message);
    setTimeout(() => setToast(''), 3000);
    setAttacking(null);
  };

  if (loading || activeRaids.length === 0) return null;

  return (
    <div>
      <SectionHeader title="Wereld Raids" icon={<Shield size={12} />} badge={`${activeRaids.length}`} badgeColor="blood" />
      
      {toast && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[0.5rem] text-gold bg-gold/10 rounded px-2 py-1 mb-2 text-center border border-gold/20">
          {toast}
        </motion.div>
      )}

      <div className="space-y-2">
        {activeRaids.map(raid => {
          const hpPercent = Math.max(0, (raid.boss_hp / raid.boss_max_hp) * 100);
          const isLow = hpPercent < 25;
          
          return (
            <motion.div
              key={raid.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`game-card border-l-[3px] ${isLow ? 'border-l-blood' : 'border-l-gold'}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <h4 className="text-xs font-bold text-foreground">{raid.title}</h4>
                  <p className="text-[0.45rem] text-muted-foreground">{raid.description}</p>
                </div>
                {raid.district_id && (
                  <span className="text-[0.4rem] bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground">
                    {DISTRICT_NAMES[raid.district_id] || raid.district_id}
                  </span>
                )}
              </div>

              {/* Boss HP */}
              <div className="mb-1.5">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[0.45rem] text-muted-foreground">Boss HP</span>
                  <span className={`text-[0.45rem] font-bold ${isLow ? 'text-blood' : 'text-foreground'}`}>
                    {raid.boss_hp.toLocaleString()} / {raid.boss_max_hp.toLocaleString()}
                  </span>
                </div>
                <Progress value={hpPercent} className={`h-1.5 ${isLow ? '[&>div]:bg-blood' : '[&>div]:bg-gold'}`} />
              </div>

              {/* Info */}
              <div className="flex items-center justify-between text-[0.45rem] text-muted-foreground mb-2">
                <span className="flex items-center gap-0.5"><Users size={8} /> {raid.total_participants} deelnemers</span>
                <span className="flex items-center gap-0.5"><Clock size={8} /> {timeLeft(raid.ends_at)} over</span>
              </div>

              {/* Rewards */}
              <div className="flex items-center gap-2 text-[0.4rem] mb-2">
                <span className="text-emerald">💰 €{raid.reward_pool.cash.toLocaleString()}</span>
                <span className="text-gold">⭐ {raid.reward_pool.rep} Rep</span>
                <span className="text-purple-400">✨ {raid.reward_pool.xp} XP</span>
              </div>

              <GameButton
                variant="blood"
                size="sm"
                fullWidth
                icon={<Zap size={10} />}
                onClick={() => handleAttack(raid.id)}
                disabled={attacking === raid.id}
              >
                {attacking === raid.id ? 'Aanvallen...' : 'Aanvallen!'}
              </GameButton>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
