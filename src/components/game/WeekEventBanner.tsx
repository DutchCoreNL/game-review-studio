import { useGame } from '@/contexts/GameContext';
import { ActiveWeekEvent } from '@/game/weekEvents';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

export function WeekEventBanner() {
  const { state } = useGame();
  const event = (state as any).activeWeekEvent as ActiveWeekEvent | null;

  if (!event || event.daysLeft <= 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="game-card border-l-[3px] border-l-gold bg-gold/5 mb-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{event.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[0.65rem] text-gold truncate">{event.name}</h4>
            <p className="text-[0.45rem] text-muted-foreground truncate">{event.desc}</p>
          </div>
          <div className="flex items-center gap-1 text-[0.5rem] text-gold font-bold shrink-0">
            <Clock size={10} />
            {event.daysLeft}d
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {event.effects.map((e, i) => (
            <span key={i} className="text-[0.4rem] bg-gold/10 text-gold px-1.5 py-0.5 rounded font-semibold">
              {e.desc}
            </span>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
