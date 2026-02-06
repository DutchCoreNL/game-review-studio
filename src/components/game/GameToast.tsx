import { useGame } from '@/contexts/GameContext';
import { AnimatePresence, motion } from 'framer-motion';

export function GameToast() {
  const { toast, toastError } = useGame();

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-lg text-sm font-semibold shadow-xl backdrop-blur-sm border max-w-[90%] text-center ${
            toastError
              ? 'bg-[hsl(var(--blood)/0.9)] border-blood text-primary-foreground'
              : 'bg-[hsl(var(--gold)/0.9)] border-gold text-secondary-foreground'
          }`}
        >
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
