import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Brain, Star, Check, X, AlertTriangle, Zap, Shield, Flame } from 'lucide-react';
import { StatId } from '@/game/types';

interface Props {
  stat: StatId;
  statValue: number;
  difficulty: number;
  label: string;
  onComplete: (result: 'success' | 'partial' | 'fail') => void;
}

const STAT_CONFIG: Record<StatId, { icon: typeof Swords; label: string; color: string; bgColor: string; borderColor: string }> = {
  muscle: { icon: Swords, label: 'KRACHT', color: 'text-blood', bgColor: 'bg-blood/20', borderColor: 'border-blood' },
  brains: { icon: Brain, label: 'VERNUFT', color: 'text-ice', bgColor: 'bg-ice/20', borderColor: 'border-ice' },
  charm: { icon: Star, label: 'CHARISMA', color: 'text-gold', bgColor: 'bg-gold/20', borderColor: 'border-gold' },
};

const RESULT_CONFIG = {
  success: { icon: Check, color: 'text-emerald', bg: 'bg-emerald/20', border: 'border-emerald', label: 'GESLAAGD', glow: 'shadow-emerald/30' },
  partial: { icon: AlertTriangle, color: 'text-gold', bg: 'bg-gold/20', border: 'border-gold', label: 'DEELS GESLAAGD', glow: 'shadow-gold/30' },
  fail: { icon: X, color: 'text-blood', bg: 'bg-blood/20', border: 'border-blood', label: 'MISLUKT', glow: 'shadow-blood/30' },
};

export function StatCheckAnimation({ stat, statValue, difficulty, label, onComplete }: Props) {
  const [phase, setPhase] = useState<'charging' | 'rolling' | 'result'>('charging');
  const [displayValue, setDisplayValue] = useState(0);
  const [result, setResult] = useState<'success' | 'partial' | 'fail' | null>(null);
  const [rollTarget, setRollTarget] = useState(0);

  const config = STAT_CONFIG[stat];
  const StatIcon = config.icon;

  // Calculate success chance
  const successChance = Math.min(95, Math.max(5, 100 - difficulty + statValue * 5));
  const partialChance = Math.min(30, difficulty * 0.3);

  const resolveResult = useCallback(() => {
    const roll = Math.random() * 100;
    setRollTarget(Math.round(roll));
    if (roll < successChance) return 'success' as const;
    if (roll < successChance + partialChance) return 'partial' as const;
    return 'fail' as const;
  }, [successChance, partialChance]);

  useEffect(() => {
    // Phase 1: Charging (stat icon fills up)
    const chargingTimer = setTimeout(() => {
      setPhase('rolling');
    }, 800);

    return () => clearTimeout(chargingTimer);
  }, []);

  useEffect(() => {
    if (phase !== 'rolling') return;

    // Animate the rolling number
    let count = 0;
    const interval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 100));
      count++;
      if (count > 12) {
        clearInterval(interval);
        const res = resolveResult();
        setResult(res);
        setDisplayValue(rollTarget);
        setPhase('result');
        setTimeout(() => onComplete(res), 1200);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [phase, resolveResult, rollTarget, onComplete]);

  const resultConfig = result ? RESULT_CONFIG[result] : null;
  const ResultIcon = resultConfig?.icon || Check;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/90 backdrop-blur-md"
    >
      <div className="w-full max-w-xs px-6">
        {/* Action label */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-[0.6rem] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-4"
        >
          {label}
        </motion.p>

        {/* Main animation container */}
        <div className="relative">
          {/* Stat icon with pulse */}
          <motion.div
            className={`mx-auto w-20 h-20 rounded-2xl ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center mb-4`}
            animate={phase === 'charging' ? {
              scale: [1, 1.1, 1],
              borderColor: ['hsl(var(--border))', 'currentColor', 'hsl(var(--border))'],
            } : phase === 'rolling' ? {
              rotate: [0, -5, 5, -3, 3, 0],
              scale: [1, 1.05, 0.95, 1.05, 1],
            } : {}}
            transition={phase === 'charging' ? {
              duration: 0.8,
              repeat: 0,
            } : {
              duration: 0.4,
              repeat: phase === 'rolling' ? Infinity : 0,
            }}
          >
            <StatIcon size={32} className={config.color} />
          </motion.div>

          {/* Rolling number display */}
          <AnimatePresence mode="wait">
            {phase === 'rolling' && (
              <motion.div
                key="rolling"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center mb-4"
              >
                <motion.span
                  className="text-4xl font-black text-foreground font-mono tabular-nums"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.15, repeat: Infinity }}
                >
                  {displayValue}
                </motion.span>
                <p className="text-[0.5rem] text-muted-foreground mt-1">
                  {config.label} {statValue} vs Moeilijkheid {difficulty}
                </p>
              </motion.div>
            )}

            {phase === 'charging' && (
              <motion.div
                key="charging"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center mb-4"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap size={14} className={config.color} />
                  <span className={`text-sm font-bold ${config.color}`}>
                    {config.label}: {statValue}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden max-w-[200px] mx-auto">
                  <motion.div
                    className={`h-full rounded-full ${config.bgColor.replace('/20', '')}`}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-[0.5rem] text-muted-foreground mt-1.5">
                  Slagingskans: {Math.round(successChance)}%
                </p>
              </motion.div>
            )}

            {phase === 'result' && resultConfig && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="text-center mb-4"
              >
                <motion.div
                  className={`mx-auto w-14 h-14 rounded-full ${resultConfig.bg} border-2 ${resultConfig.border} flex items-center justify-center mb-2 shadow-lg ${resultConfig.glow}`}
                  initial={{ rotate: -180 }}
                  animate={{ rotate: 0 }}
                  transition={{ type: 'spring', damping: 12 }}
                >
                  <ResultIcon size={24} className={resultConfig.color} />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`text-lg font-black uppercase tracking-wider ${resultConfig.color}`}
                >
                  {resultConfig.label}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-[0.5rem] text-muted-foreground mt-1"
                >
                  Roll: {rollTarget} / Nodig: ≤{Math.round(successChance)}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stat bar comparison */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[0.5rem]">
              <span className="text-muted-foreground flex items-center gap-1">
                <Shield size={8} /> Jouw stat
              </span>
              <span className={`font-bold ${config.color}`}>{statValue}</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${config.color.replace('text-', 'bg-')}`}
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(100, statValue * 10)}%` }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
            </div>
            <div className="flex items-center justify-between text-[0.5rem]">
              <span className="text-muted-foreground flex items-center gap-1">
                <Flame size={8} /> Moeilijkheid
              </span>
              <span className="font-bold text-blood">{difficulty}%</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-blood"
                initial={{ width: '0%' }}
                animate={{ width: `${difficulty}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
