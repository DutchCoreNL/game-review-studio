import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

interface CooldownTimerProps {
  label: string;
  until: string | null;
  icon?: React.ReactNode;
}

export function CooldownTimer({ label, until, icon }: CooldownTimerProps) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!until) { setRemaining(0); return; }
    const update = () => {
      const diff = new Date(until).getTime() - Date.now();
      setRemaining(Math.max(0, Math.ceil(diff / 1000)));
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [until]);

  if (remaining <= 0) return null;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted/30 border border-border/50 text-muted-foreground flex-shrink-0"
      >
        {icon || <Clock size={7} />}
        <span className="text-[0.4rem] font-bold uppercase tracking-wider">{label}</span>
        <span className="text-[0.5rem] font-bold tabular-nums text-foreground">{display}</span>
      </motion.div>
    </AnimatePresence>
  );
}
