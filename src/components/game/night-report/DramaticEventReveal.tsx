import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Zap, AlertTriangle, Sparkles } from 'lucide-react';
import { RandomEvent } from '@/game/types';
import { playDramaticReveal } from '@/game/sounds';

interface DramaticEventRevealProps {
  event: RandomEvent;
  delay?: number;
}

export function DramaticEventReveal({ event, delay = 0 }: DramaticEventRevealProps) {
  const [phase, setPhase] = useState<'hidden' | 'flash' | 'reveal' | 'text'>('hidden');

  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase('flash');
      playDramaticReveal();
    }, delay * 1000);
    const t2 = setTimeout(() => setPhase('reveal'), delay * 1000 + 400);
    const t3 = setTimeout(() => setPhase('text'), delay * 1000 + 900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [delay]);

  const isPositive = event.type === 'positive';
  const isNegative = event.type === 'negative';

  const borderColor = isPositive ? 'border-gold' : isNegative ? 'border-blood' : 'border-border';
  const bgColor = isPositive
    ? 'bg-[hsl(var(--gold)/0.08)]'
    : isNegative
    ? 'bg-[hsl(var(--blood)/0.08)]'
    : 'bg-muted/50';
  const glowClass = isPositive ? 'glow-gold' : isNegative ? 'glow-blood' : '';
  const titleColor = isPositive ? 'text-gold' : isNegative ? 'text-blood' : 'text-foreground';

  const Icon = isPositive ? Zap : isNegative ? AlertTriangle : Sparkles;
  const iconColor = isPositive ? 'text-gold' : isNegative ? 'text-blood' : 'text-muted-foreground';

  return (
    <AnimatePresence>
      {phase === 'hidden' && (
        <motion.div
          key="placeholder"
          className="bg-muted/20 rounded-lg p-3 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.span
            className="text-[0.6rem] text-muted-foreground uppercase tracking-widest"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            ● ● ●
          </motion.span>
        </motion.div>
      )}

      {phase === 'flash' && (
        <motion.div
          key="flash"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: [0, 1, 0], scale: [1.1, 1.05, 1] }}
          transition={{ duration: 0.4 }}
          className={`rounded-lg p-4 ${bgColor} ${borderColor} border ${glowClass}`}
        />
      )}

      {(phase === 'reveal' || phase === 'text') && (
        <motion.div
          key="content"
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={`border rounded-lg p-3 flex items-start gap-2 ${bgColor} ${borderColor} ${glowClass}`}
        >
          <motion.div
            className="flex-shrink-0 mt-0.5"
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
          >
            <Icon size={16} className={iconColor} />
          </motion.div>
          <div className="overflow-hidden">
            <motion.p
              className={`text-xs font-bold ${titleColor}`}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {event.title}
            </motion.p>
            {phase === 'text' && (
              <motion.p
                className="text-[0.6rem] text-muted-foreground mt-0.5"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                {event.description}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
