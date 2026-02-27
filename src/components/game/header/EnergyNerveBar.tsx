import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { Zap, Brain } from 'lucide-react';

function formatCountdown(targetIso: string | null): string | null {
  if (!targetIso) return null;
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (mins > 0) return `${mins}m${secs.toString().padStart(2, '0')}s`;
  return `${secs}s`;
}

export function EnergyNerveBar() {
  const { state } = useGame();
  const [, setTick] = useState(0);

  // Re-render every second for countdown timers
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const energyPct = (state.energy / state.maxEnergy) * 100;
  const nervePct = (state.nerve / state.maxNerve) * 100;
  const energyRegen = formatCountdown(state.energyRegenAt);
  const nerveRegen = formatCountdown(state.nerveRegenAt);

  return (
    <div className="flex items-center gap-1.5 w-full mt-1.5">
      {/* Energy bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <Zap size={8} className="text-gold flex-shrink-0" />
          <span className="text-[0.4rem] font-bold text-gold uppercase tracking-widest">Energy</span>
          <span className="text-[0.5rem] font-bold text-foreground tabular-nums ml-auto">
            {state.energy}/{state.maxEnergy}
          </span>
          {energyRegen && (
            <span className="text-[0.4rem] text-muted-foreground tabular-nums">+1 in {energyRegen}</span>
          )}
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gold/80 to-gold"
            initial={{ width: 0 }}
            animate={{ width: `${energyPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Separator */}
      <div className="w-px h-4 bg-border/40 flex-shrink-0" />

      {/* Nerve bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <Brain size={8} className="text-blood flex-shrink-0" />
          <span className="text-[0.4rem] font-bold text-blood uppercase tracking-widest">Nerve</span>
          <span className="text-[0.5rem] font-bold text-foreground tabular-nums ml-auto">
            {state.nerve}/{state.maxNerve}
          </span>
          {nerveRegen && (
            <span className="text-[0.4rem] text-muted-foreground tabular-nums">+1 in {nerveRegen}</span>
          )}
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blood/80 to-blood"
            initial={{ width: 0 }}
            animate={{ width: `${nervePct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}
