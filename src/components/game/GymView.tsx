import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ViewWrapper } from './ui/ViewWrapper';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Shield, Zap, Target, Lock, Star } from 'lucide-react';
import { gameApi } from '@/lib/gameApi';
import { toast } from 'sonner';
import gymBg from '@/assets/gym-bg.jpg';

interface GymDef {
  id: string;
  name: string;
  district: string;
  focus: string;
  focusStat: string;
  tier: number;
  costPerMonth: number;
  gainMultiplier: number;
  icon: string;
  reqLevel: number;
}

const GYMS: GymDef[] = [
  { id: 'lowrise_gym', name: "Rusty Iron Gym", district: 'low', focus: 'Strength', focusStat: 'strength', tier: 1, costPerMonth: 0, gainMultiplier: 1.0, icon: '🏋️', reqLevel: 1 },
  { id: 'port_gym', name: "Dockside Fitness", district: 'port', focus: 'Defense', focusStat: 'defense', tier: 1, costPerMonth: 500, gainMultiplier: 1.1, icon: '🛡️', reqLevel: 3 },
  { id: 'iron_gym', name: "Iron Borough Athletics", district: 'iron', focus: 'Speed', focusStat: 'speed', tier: 2, costPerMonth: 2000, gainMultiplier: 1.25, icon: '⚡', reqLevel: 5 },
  { id: 'neon_gym', name: "Neon Elite Training", district: 'neon', focus: 'Dexterity', focusStat: 'dexterity', tier: 3, costPerMonth: 5000, gainMultiplier: 1.5, icon: '🎯', reqLevel: 8 },
  { id: 'crown_gym', name: "Crown Heights Academy", district: 'crown', focus: 'All Stats', focusStat: 'all', tier: 4, costPerMonth: 12000, gainMultiplier: 2.0, icon: '👑', reqLevel: 12 },
];

const ENERGY_COST = 5;

function TierStars({ tier }: { tier: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <Star key={i} size={8} className={i < tier ? 'text-gold fill-gold' : 'text-muted-foreground/30'} />
      ))}
    </div>
  );
}

function StatBoostOverlay({ gain, color }: { gain: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -40, scale: 1.5 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 pointer-events-none z-20 font-display font-bold text-xl ${color}`}
    >
      +{gain}
    </motion.div>
  );
}

export function GymView() {
  const { state } = useGame();
  const { t } = useLanguage();
  const [training, setTraining] = useState(false);
  const [selectedGym, setSelectedGym] = useState<string>(
    GYMS.find(g => g.district === state.loc)?.id || GYMS[0].id
  );
  const [lastResult, setLastResult] = useState<{ stat: string; gain: number; message: string } | null>(null);
  const [boostAnim, setBoostAnim] = useState<{ stat: string; gain: number } | null>(null);

  const STATS = [
    { id: 'strength', label: t.gym.strength, icon: Dumbbell, color: 'text-blood', bgColor: 'bg-blood', desc: t.gym.strengthDesc },
    { id: 'defense', label: t.gym.defense, icon: Shield, color: 'text-ice', bgColor: 'bg-ice', desc: t.gym.defenseDesc },
    { id: 'speed', label: t.gym.speed, icon: Zap, color: 'text-gold', bgColor: 'bg-gold', desc: t.gym.speedDesc },
    { id: 'dexterity', label: t.gym.dexterity, icon: Target, color: 'text-emerald', bgColor: 'bg-emerald-500', desc: t.gym.dexterityDesc },
  ];

  const gymStats: Record<string, number> = (state as any).gymStats || { strength: 1, defense: 1, speed: 1, dexterity: 1 };
  const currentGym = GYMS.find(g => g.id === selectedGym) || GYMS[0];
  const inCorrectDistrict = state.loc === currentGym.district;
  const hasLevel = state.player.level >= currentGym.reqLevel;
  const hasEnergy = state.energy >= ENERGY_COST;

  const handleTrain = async (statId: string) => {
    if (training || !hasEnergy || !inCorrectDistrict || !hasLevel) return;
    setTraining(true);
    setLastResult(null);
    setBoostAnim(null);
    try {
      const res = await gameApi.gymTrain(statId, selectedGym);
      if (res.success) {
        const gain = res.data?.gain || 0;
        setLastResult({ stat: statId, gain, message: res.message });
        setBoostAnim({ stat: statId, gain });
        toast.success(res.message);
        setTimeout(() => setBoostAnim(null), 1500);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(t.gym.connectionError);
    } finally {
      setTraining(false);
    }
  };

  return (
    <ViewWrapper bg={gymBg}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-blood/15 border border-blood/40 flex items-center justify-center">
          <Dumbbell size={18} className="text-blood" />
        </div>
        <div>
          <h2 className="font-display text-lg text-blood uppercase tracking-widest font-bold">{t.gym.title}</h2>
          <p className="text-[0.55rem] text-muted-foreground">{t.gym.subtitle} — {ENERGY_COST} {t.common.energy.toLowerCase()}</p>
        </div>
      </div>

      <SectionHeader title={t.gym.locations} subtitle="Kies een trainingslocatie in Noxhaven" icon={<Dumbbell size={12} />} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        {GYMS.map(gym => {
          const isSelected = selectedGym === gym.id;
          const locked = state.player.level < gym.reqLevel;
          const isLocal = state.loc === gym.district;
          return (
            <button key={gym.id} onClick={() => !locked && setSelectedGym(gym.id)}
              className={`relative p-3 rounded-lg border text-left transition-all ${
                isSelected ? 'bg-gold/10 border-gold/40 text-gold shadow-[0_0_12px_hsl(var(--gold)/0.15)]' : locked ? 'bg-muted/5 border-border/30 text-muted-foreground/50 cursor-not-allowed' : 'bg-card border-border hover:border-muted-foreground/40 text-foreground'
              }`}>
              {locked && <Lock size={12} className="absolute top-2 right-2 text-muted-foreground/50" />}
              <div className="flex items-center justify-between mb-1">
                <TierStars tier={gym.tier} />
                {isLocal && !locked && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title={t.onlinePlayers.here} />}
              </div>
              <div className="text-[0.65rem] font-bold uppercase tracking-wider">{gym.name}</div>
              <div className="text-[0.55rem] text-muted-foreground mt-0.5">
                {locked ? `Lvl ${gym.reqLevel} ${t.education.levelRequired}` : `${gym.focus} • x${gym.gainMultiplier}`}
              </div>
              {gym.costPerMonth > 0 && !locked && (
                <div className="text-[0.5rem] text-muted-foreground mt-1">€{gym.costPerMonth.toLocaleString()}/mo</div>
              )}
            </button>
          );
        })}
      </div>

      <div className="game-card mb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-bold text-foreground flex items-center gap-2">
              {currentGym.name}
              <TierStars tier={currentGym.tier} />
            </div>
            <div className="text-xs text-muted-foreground">
              {t.gym.focus}: {currentGym.focus} • {t.gym.multiplier}: x{currentGym.gainMultiplier}
            </div>
          </div>
          {!inCorrectDistrict && (
            <GameBadge variant="blood" size="xs">{t.gym.travelTo} {currentGym.district}</GameBadge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {STATS.map(stat => {
            const value = gymStats[stat.id] || 1;
            const isFocus = currentGym.focusStat === stat.id || currentGym.focusStat === 'all';
            const StatIcon = stat.icon;
            const pct = Math.min(100, (value / 100) * 100);
            return (
              <motion.div key={stat.id} className={`relative p-3 rounded-lg border transition-all overflow-hidden ${isFocus ? 'border-gold/30 bg-gold/5' : 'border-border bg-card'}`} whileHover={{ scale: 1.02 }}>
                {isFocus && (
                  <div className="absolute top-1.5 right-1.5 flex gap-0.5">
                    <Star size={10} className="text-gold fill-gold" />
                  </div>
                )}
                <AnimatePresence>
                  {boostAnim?.stat === stat.id && (
                    <StatBoostOverlay gain={boostAnim.gain} color={stat.color} />
                  )}
                </AnimatePresence>
                <div className="flex items-center gap-2 mb-2">
                  <StatIcon size={16} className={stat.color} />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">{stat.label}</span>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-xl font-display font-bold ${stat.color}`}>{value}</span>
                  {lastResult?.stat === stat.id && (
                    <motion.span initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-emerald-400 font-bold">+{lastResult.gain}</motion.span>
                  )}
                </div>
                <p className="text-[0.5rem] text-muted-foreground mb-2">{stat.desc}</p>
                <div className="h-2 bg-muted/20 rounded-full overflow-hidden mb-2 relative">
                  <motion.div
                    className={`h-full rounded-full ${stat.bgColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>
                <div className="text-[0.45rem] text-muted-foreground mb-2 text-right">{value}/100</div>
                <GameButton size="sm" variant={isFocus ? 'gold' : 'muted'} fullWidth disabled={training || !hasEnergy || !inCorrectDistrict || !hasLevel}
                  onClick={() => handleTrain(stat.id)}>
                  {training ? '...' : `${t.gym.train} (${ENERGY_COST}⚡)`}
                </GameButton>
              </motion.div>
            );
          })}
        </div>
      </div>

      {!hasEnergy && (
        <div className="game-card text-center text-xs text-blood border-l-[3px] border-l-blood">
          ⚡ {t.gym.notEnoughEnergy}
        </div>
      )}

      {lastResult && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="game-card text-center border-l-[3px] border-l-emerald">
          <p className="text-xs text-emerald font-semibold">{lastResult.message}</p>
        </motion.div>
      )}
    </ViewWrapper>
  );
}
