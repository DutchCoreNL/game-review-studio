import React from 'react';
import { motion } from 'framer-motion';

interface StatBarProps {
  value: number;
  max: number;
  color?: 'blood' | 'gold' | 'emerald' | 'purple' | 'ice' | 'auto';
  height?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
}

const COLOR_MAP = {
  blood: 'bg-blood',
  gold: 'bg-gold',
  emerald: 'bg-emerald',
  purple: 'bg-game-purple',
  ice: 'bg-ice',
};

const HEIGHT_MAP = {
  xs: 'h-0.5',
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export const StatBar = React.forwardRef<HTMLDivElement, StatBarProps>(
  function StatBar({ value, max, color = 'auto', height = 'md', showLabel = false, label, animate = true }, ref) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));

    let barColor: string;
    if (color === 'auto') {
      barColor = pct > 60 ? 'bg-emerald' : pct > 30 ? 'bg-gold' : 'bg-blood';
    } else {
      barColor = COLOR_MAP[color];
    }

    return (
      <div ref={ref}>
        {(showLabel || label) && (
          <div className="flex justify-between text-[0.6rem] text-muted-foreground mb-0.5">
            {label && <span>{label}</span>}
            {showLabel && <span className="font-bold">{value}/{max}</span>}
          </div>
        )}
        <div className={`${HEIGHT_MAP[height]} bg-muted rounded-full overflow-hidden`}>
          {animate ? (
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          ) : (
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          )}
        </div>
      </div>
    );
  }
);
