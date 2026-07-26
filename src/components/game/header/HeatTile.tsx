import { motion } from 'framer-motion';
import { Flame, AlertTriangle } from 'lucide-react';
import { TappableTile } from './TappableTile';
import { WANTED_HEAT_THRESHOLD } from '@/game/constants';

function getHeatBarColor(value: number): string {
  if (value > 70) return 'bg-blood';
  if (value > 50) return 'bg-gold';
  return 'bg-emerald';
}

function getHeatTextColor(value: number): string {
  if (value > 70) return 'text-blood';
  if (value > 50) return 'text-gold';
  return 'text-emerald';
}

interface HeatTileProps {
  personalHeat: number;
  /** Net heat change per day: the number that makes this manageable. */
  dailyDelta: number;
  bandLabel: string;
  onTap?: () => void;
}

export function HeatTile({ personalHeat, dailyDelta, bandLabel, onTap }: HeatTileProps) {
  const isWanted = personalHeat >= WANTED_HEAT_THRESHOLD;

  return (
    <TappableTile tooltip={`${bandLabel} — hitte verandert ${dailyDelta > 0 ? "+" : ""}${dailyDelta} per dag. Witwasserij-crew en je Netwerk koelen af.`} onTap={onTap}>
      {/* Matches the other tiles' surface, and when you are wanted the plate itself
          breathes red — the one number in the bar that should be able to shout. */}
      <motion.div
        className={`relative flex flex-col justify-center rounded-md px-2 py-1 border min-w-[4.5rem] overflow-hidden ${isWanted ? 'border-blood/80' : 'border-border/50'}`}
        style={{
          backgroundImage: isWanted
            ? 'linear-gradient(180deg, hsl(var(--blood) / 0.22), hsl(var(--blood) / 0.06))'
            : 'linear-gradient(180deg, hsl(0 0% 100% / 0.045), hsl(0 0% 0% / 0.18))',
          boxShadow: 'inset 0 1px 0 hsl(0 0% 100% / 0.05)',
        }}
        animate={isWanted ? { boxShadow: [
          'inset 0 1px 0 hsl(0 0% 100% / 0.05), 0 0 0px hsl(var(--blood) / 0)',
          'inset 0 1px 0 hsl(0 0% 100% / 0.05), 0 0 10px hsl(var(--blood) / 0.55)',
          'inset 0 1px 0 hsl(0 0% 100% / 0.05), 0 0 0px hsl(var(--blood) / 0)',
        ] } : {}}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-1">
          <span className="text-[0.4rem] font-bold text-muted-foreground uppercase tracking-widest leading-none">Heat</span>
          {isWanted && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="flex items-center gap-0.5 text-[0.35rem] font-black text-blood uppercase tracking-wider"
            >
              <AlertTriangle size={7} /> GEZOCHT
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <Flame size={7} className={getHeatTextColor(personalHeat)} />
          <div className="relative flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full ${getHeatBarColor(personalHeat)}`}
              initial={{ width: 0 }}
              animate={{ width: `${personalHeat}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className={`text-[0.45rem] font-bold tabular-nums ${getHeatTextColor(personalHeat)} ${personalHeat > 70 ? 'animate-pulse' : ''}`}>{personalHeat}</span>
        </div>
        {/* The rate, which is what actually lets you steer this. Cooling reads green,
            climbing reads warm, so a glance tells you which way you are heading. */}
        <div className="flex items-center justify-between gap-1 mt-0.5 leading-none">
          <span className="text-[0.35rem] text-muted-foreground/80 truncate">{bandLabel}</span>
          <span className={`text-[0.4rem] font-bold tabular-nums ${
            dailyDelta > 0 ? 'text-blood' : dailyDelta < 0 ? 'text-emerald' : 'text-muted-foreground'
          }`}>
            {dailyDelta > 0 ? '+' : ''}{dailyDelta}/dag
          </span>
        </div>
      </motion.div>
    </TappableTile>
  );
}
