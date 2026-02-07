import { motion } from 'framer-motion';

interface AnimatedResourceBarProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  max: number;
  color: 'blood' | 'gold' | 'emerald' | 'purple' | 'ice';
  delay?: number;
}

const BAR_COLORS = {
  blood: 'bg-blood',
  gold: 'bg-gold',
  emerald: 'bg-emerald',
  purple: 'bg-game-purple',
  ice: 'bg-ice',
};

export function AnimatedResourceBar({
  label,
  icon,
  value,
  max,
  color,
  delay = 0,
}: AnimatedResourceBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="bg-muted/40 rounded-lg px-3 py-2"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className={`text-[0.6rem] font-bold text-${color === 'purple' ? 'game-purple' : color}`}>
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${BAR_COLORS[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: delay + 0.3, duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
