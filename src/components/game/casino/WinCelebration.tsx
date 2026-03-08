import { motion, AnimatePresence } from 'framer-motion';

interface WinCelebrationProps {
  amount: number;
  show: boolean;
}

const COINS = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  x: -60 + Math.random() * 120,
  delay: Math.random() * 0.3,
}));

export function WinCelebration({ amount, show }: WinCelebrationProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="relative flex justify-center pointer-events-none h-0 overflow-visible">
          {COINS.map(coin => (
            <motion.span
              key={coin.id}
              className="absolute text-lg"
              initial={{ y: 0, x: coin.x, opacity: 1, scale: 0.5 }}
              animate={{ y: -60, opacity: 0, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, delay: coin.delay, ease: 'easeOut' }}
            >
              🪙
            </motion.span>
          ))}
          <motion.span
            className="absolute text-emerald font-bold text-sm font-display"
            initial={{ y: 0, opacity: 0, scale: 0.8 }}
            animate={{ y: -30, opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            +€{amount.toLocaleString()}
          </motion.span>
        </div>
      )}
    </AnimatePresence>
  );
}
