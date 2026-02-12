import { motion } from 'framer-motion';
import { Car, Flame, AlertTriangle } from 'lucide-react';
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
  vehicleHeat: number;
  personalHeat: number;
  onTap?: () => void;
}

export function HeatTile({ vehicleHeat, personalHeat, onTap }: HeatTileProps) {
  const isWanted = personalHeat >= WANTED_HEAT_THRESHOLD;

  return (
    <TappableTile tooltip="Heat bepaalt hoe hard de politie je zoekt." onTap={onTap}>
      <div className={`flex flex-col justify-center bg-muted/20 rounded px-2 py-1 border min-w-[4.5rem] ${isWanted ? 'border-blood/80 bg-blood/10' : 'border-border/50'}`}>
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
          <Car size={7} className={getHeatTextColor(vehicleHeat)} />
          <div className="relative flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full ${getHeatBarColor(vehicleHeat)}`}
              animate={{ width: `${vehicleHeat}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className={`text-[0.45rem] font-bold tabular-nums ${getHeatTextColor(vehicleHeat)}`}>{vehicleHeat}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <Flame size={7} className={getHeatTextColor(personalHeat)} />
          <div className="relative flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full ${getHeatBarColor(personalHeat)}`}
              animate={{ width: `${personalHeat}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className={`text-[0.45rem] font-bold tabular-nums ${getHeatTextColor(personalHeat)} ${personalHeat > 70 ? 'animate-pulse' : ''}`}>{personalHeat}</span>
        </div>
      </div>
    </TappableTile>
  );
}
