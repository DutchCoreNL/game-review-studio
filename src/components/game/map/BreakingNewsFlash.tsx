import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { NewsItem } from '@/game/newsGenerator';
import { playAlertTrigger } from '@/game/sounds/uiSounds';

interface BreakingNewsFlashProps {
  item: NewsItem | null;
  onDone: () => void;
  onRead?: (item: NewsItem) => void;
}

export function BreakingNewsFlash({ item, onDone, onRead }: BreakingNewsFlashProps) {
  useEffect(() => {
    if (item) {
      playAlertTrigger();
    }
  }, [item]);

  return (
    <>
      {/* Full-screen red flash overlay */}
      <AnimatePresence>
        {item && (
          <motion.div
            key="breaking-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0.15, 0.3, 0] }}
            transition={{ duration: 1.2, times: [0, 0.1, 0.3, 0.5, 1] }}
            className="fixed inset-0 z-[9980] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, hsla(0,80%,40%,0.5) 0%, hsla(0,80%,20%,0.3) 100%)' }}
          />
        )}
      </AnimatePresence>

      {/* Breaking banner */}
      <AnimatePresence>
        {item && (
          <motion.div
            key="breaking-banner"
            initial={{ opacity: 0, y: -30, scaleX: 0.8 }}
            animate={{ opacity: 1, y: 0, scaleX: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[9985] w-[90%] max-w-[500px]"
          >
            <div
              className="relative overflow-hidden rounded-lg border-2 border-blood bg-background/95 backdrop-blur-sm shadow-2xl cursor-pointer"
              onClick={() => { onRead?.(item); onDone(); }}
            >
              {/* Animated red scan line */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ backgroundPosition: '0% 0%' }}
                animate={{ backgroundPosition: ['0% 0%', '0% 100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{
                  background: 'linear-gradient(180deg, transparent 0%, hsla(0,80%,40%,0.08) 50%, transparent 100%)',
                  backgroundSize: '100% 200%',
                }}
              />

              <div className="flex items-center gap-2 px-3 py-2">
                {/* Pulsing BREAKING label */}
                <motion.span
                  className="text-[0.55rem] font-black uppercase tracking-widest text-blood bg-blood/10 px-2 py-0.5 rounded flex-shrink-0 border border-blood/30"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  BREAKING
                </motion.span>

                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="text-sm flex-shrink-0">{item.icon}</span>
                  <span className="text-xs font-bold text-blood truncate">{item.text}</span>
                </div>
                <span className="text-[0.4rem] text-muted-foreground ml-auto flex-shrink-0">TAP OM TE LEZEN</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
