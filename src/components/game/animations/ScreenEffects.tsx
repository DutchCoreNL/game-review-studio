import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export type ScreenEffectType = 'shake' | 'blood-flash' | 'gold-flash' | null;

interface ScreenEffectsProps {
  effect: ScreenEffectType;
  onDone: () => void;
  children: React.ReactNode;
}

export function ScreenEffects({ effect, onDone, children }: ScreenEffectsProps) {
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (!effect) return;

    if (effect === 'shake') {
      setShaking(true);
      const t = setTimeout(() => { setShaking(false); onDone(); }, 500);
      return () => clearTimeout(t);
    }

    // Flash effects auto-clear
    const t = setTimeout(onDone, 400);
    return () => clearTimeout(t);
  }, [effect, onDone]);

  return (
    <div className={shaking ? 'shake' : ''} style={{ position: 'relative' }}>
      {children}

      <AnimatePresence>
        {effect === 'blood-flash' && (
          <motion.div
            key="blood"
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[9990] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, hsla(0,80%,30%,0.3) 0%, hsla(0,80%,20%,0.5) 100%)' }}
          />
        )}
        {effect === 'gold-flash' && (
          <motion.div
            key="gold"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9990] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, hsla(45,93%,50%,0.2) 0%, hsla(45,93%,40%,0.1) 100%)' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
