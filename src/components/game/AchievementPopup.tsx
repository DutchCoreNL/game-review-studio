import { useGame } from '@/contexts/GameContext';
import { ACHIEVEMENTS } from '@/game/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { ACHIEVEMENT_IMAGES } from '@/assets/items';
import { useEffect, useRef } from 'react';
import { playAchievementSound } from '@/game/sounds';

export function AchievementPopup() {
  const { state, dispatch } = useGame();
  const pending = state.pendingAchievements || [];
  const currentId = pending[0];
  const achievement = currentId ? ACHIEVEMENTS.find(a => a.id === currentId) : null;
  const lastPlayedId = useRef<string | null>(null);

  useEffect(() => {
    if (currentId && currentId !== lastPlayedId.current) {
      lastPlayedId.current = currentId;
      playAchievementSound();
    }
  }, [currentId]);

  const dismiss = () => {
    dispatch({ type: 'DISMISS_ACHIEVEMENT' });
  };

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          key={currentId}
          initial={{ opacity: 0, y: 60, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={dismiss}
        >
          <div className="absolute inset-0 bg-black/60" />
          <motion.div
            className="relative bg-card border-2 border-gold rounded-lg p-6 max-w-xs w-full text-center shadow-2xl"
            initial={{ rotateX: 15 }}
            animate={{ rotateX: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
              className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden border-2 border-gold"
            >
              {ACHIEVEMENT_IMAGES[currentId!] ? (
                <img src={ACHIEVEMENT_IMAGES[currentId!]} alt={achievement.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gold/15 flex items-center justify-center">
                  <Trophy size={28} className="text-gold" />
                </div>
              )}
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[0.6rem] uppercase tracking-widest text-gold font-bold mb-1"
            >
              Achievement Ontgrendeld!
            </motion.p>
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="font-display text-lg font-bold tracking-wider mb-1"
            >
              {achievement.name}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs text-muted-foreground"
            >
              {achievement.desc}
            </motion.p>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={dismiss}
              className="mt-4 px-6 py-2 rounded bg-gold/15 border border-gold text-gold text-xs font-bold uppercase tracking-wider hover:bg-gold/25 transition-colors"
            >
              COOL
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
