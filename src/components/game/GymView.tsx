import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { Dumbbell, Shield, Zap, Target, Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gameApi } from '@/lib/gameApi';
import { toast } from 'sonner';

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
  { id: 'crown_gym', name: "Crown Heights Academy", district: 'crown', focus: 'Alle Stats', focusStat: 'all', tier: 4, costPerMonth: 12000, gainMultiplier: 2.0, icon: '👑', reqLevel: 12 },
];

const STATS = [
  { id: 'strength', label: 'Kracht', icon: Dumbbell, color: 'text-blood', desc: 'Verhoogt fysieke aanvalsschade' },
  { id: 'defense', label: 'Verdediging', icon: Shield, color: 'text-ice', desc: 'Vermindert ontvangen schade' },
  { id: 'speed', label: 'Snelheid', icon: Zap, color: 'text-gold', desc: 'Verbetert ontwijkingskans & initiatie' },
  { id: 'dexterity', label: 'Behendigheid', icon: Target, color: 'text-emerald', desc: 'Verhoogt nauwkeurigheid & crit kans' },
];

const ENERGY_COST = 5;

export function GymView() {
  const { state } = useGame();
  const [training, setTraining] = useState(false);
  const [selectedGym, setSelectedGym] = useState<string>(
    GYMS.find(g => g.district === state.loc)?.id || GYMS[0].id
  );
  const [lastResult, setLastResult] = useState<{ stat: string; gain: number; message: string } | null>(null);

  const gymStats: Record<string, number> = (state as any).gymStats || { strength: 1, defense: 1, speed: 1, dexterity: 1 };
  const currentGym = GYMS.find(g => g.id === selectedGym) || GYMS[0];
  const inCorrectDistrict = state.loc === currentGym.district;
  const hasLevel = state.player.level >= currentGym.reqLevel;
  const hasEnergy = state.energy >= ENERGY_COST;

  const handleTrain = async (statId: string) => {
    if (training || !hasEnergy || !inCorrectDistrict || !hasLevel) return;
    setTraining(true);
    setLastResult(null);
    try {
      const res = await gameApi.gymTrain(statId, selectedGym);
      if (res.success) {
        setLastResult({ stat: statId, gain: res.data?.gain || 0, message: res.message });
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Verbindingsfout');
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Dumbbell className="text-gold" size={24} />
        <div>
          <h2 className="font-display text-lg text-foreground uppercase tracking-widest">Gym</h2>
          <p className="text-xs text-muted-foreground">Train je stats — kost {ENERGY_COST} energy per sessie</p>
        </div>
      </div>

      {/* Gym selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {GYMS.map(gym => {
          const isSelected = selectedGym === gym.id;
          const locked = state.player.level < gym.reqLevel;
          const isLocal = state.loc === gym.district;
          return (
            <button
              key={gym.id}
              onClick={() => !locked && setSelectedGym(gym.id)}
              className={`relative p-3 rounded-lg border text-left transition-all ${
                isSelected 
                  ? 'bg-gold/10 border-gold/40 text-gold' 
                  : locked 
                    ? 'bg-muted/5 border-border/30 text-muted-foreground/50 cursor-not-allowed'
                    : 'bg-card border-border hover:border-muted-foreground/40 text-foreground'
              }`}
            >
              {locked && <Lock size={12} className="absolute top-2 right-2 text-muted-foreground/50" />}
              <div className="text-lg mb-1">{gym.icon}</div>
              <div className="text-[0.65rem] font-bold uppercase tracking-wider">{gym.name}</div>
              <div className="text-[0.55rem] text-muted-foreground mt-0.5">
                {locked ? `Lvl ${gym.reqLevel} vereist` : `${gym.focus} • x${gym.gainMultiplier}`}
              </div>
              {isLocal && !locked && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" title="Je bent hier" />
              )}
              {gym.costPerMonth > 0 && !locked && (
                <div className="text-[0.5rem] text-muted-foreground mt-1">€{gym.costPerMonth.toLocaleString()}/maand</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Current gym info */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-bold text-foreground">{currentGym.icon} {currentGym.name}</div>
            <div className="text-xs text-muted-foreground">
              Focus: {currentGym.focus} • Multiplier: x{currentGym.gainMultiplier}
            </div>
          </div>
          {!inCorrectDistrict && (
            <div className="text-[0.6rem] text-blood bg-blood/10 px-2 py-1 rounded font-semibold">
              Reis naar {currentGym.district}
            </div>
          )}
        </div>

        {/* Stat training buttons */}
        <div className="grid grid-cols-2 gap-3">
          {STATS.map(stat => {
            const value = gymStats[stat.id] || 1;
            const isFocus = currentGym.focusStat === stat.id || currentGym.focusStat === 'all';
            const StatIcon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                className={`relative p-3 rounded-lg border transition-all ${
                  isFocus ? 'border-gold/30 bg-gold/5' : 'border-border bg-card'
                }`}
                whileHover={{ scale: 1.02 }}
              >
                {isFocus && (
                  <Crown size={10} className="absolute top-1.5 right-1.5 text-gold" />
                )}
                <div className="flex items-center gap-2 mb-2">
                  <StatIcon size={16} className={stat.color} />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">{stat.label}</span>
                </div>
                
                {/* Stat value */}
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-xl font-display font-bold ${stat.color}`}>{value}</span>
                  {lastResult?.stat === stat.id && (
                    <motion.span
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-emerald-400 font-bold"
                    >
                      +{lastResult.gain}
                    </motion.span>
                  )}
                </div>
                <p className="text-[0.5rem] text-muted-foreground mb-2">{stat.desc}</p>
                
                {/* Progress bar */}
                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden mb-2">
                  <motion.div
                    className={`h-full rounded-full ${
                      stat.id === 'strength' ? 'bg-blood' :
                      stat.id === 'defense' ? 'bg-ice' :
                      stat.id === 'speed' ? 'bg-gold' : 'bg-emerald-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (value / 100) * 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                
                <Button
                  size="sm"
                  variant={isFocus ? "default" : "outline"}
                  className="w-full text-[0.6rem] h-7"
                  disabled={training || !hasEnergy || !inCorrectDistrict || !hasLevel}
                  onClick={() => handleTrain(stat.id)}
                >
                  {training ? '...' : `Train (${ENERGY_COST}⚡)`}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Status messages */}
      {!hasEnergy && (
        <div className="text-xs text-blood bg-blood/10 border border-blood/20 rounded-lg p-3 text-center">
          ⚡ Niet genoeg energy om te trainen
        </div>
      )}

      {lastResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center"
        >
          <p className="text-xs text-emerald-400 font-semibold">{lastResult.message}</p>
        </motion.div>
      )}
    </div>
  );
}
