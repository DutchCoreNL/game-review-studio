import { motion } from 'framer-motion';
import { AnimatedCounter } from '../animations/AnimatedCounter';

interface AnimatedReportRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  positive?: boolean;
  color: string;
  delay?: number;
}

export function AnimatedReportRow({
  icon,
  label,
  value,
  prefix = '',
  suffix = '',
  positive,
  color,
  delay = 0,
}: AnimatedReportRowProps) {
  const sign = positive === true ? '+' : positive === false ? '-' : '';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`text-xs font-bold ${color}`}>
        {sign}{prefix}
        <AnimatedCounter value={Math.abs(value)} duration={800} prefix="" />
        {suffix}
      </span>
    </motion.div>
  );
}
