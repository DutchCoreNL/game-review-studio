import { useGame } from '@/contexts/GameContext';
import { TypewriterText } from './animations/TypewriterText';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export function FlashbackOverlay() {
  const { state, dispatch } = useGame();
  const [lineIndex, setLineIndex] = useState(0);
  const flashback = state.pendingFlashback;

  if (!flashback) return null;

  const allLinesShown = lineIndex >= flashback.lines.length;

  const handleAdvance = () => {
    if (lineIndex < flashback.lines.length) {
      setLineIndex(prev => prev + 1);
    }
  };

  const handleDismiss = () => {
    setLineIndex(0);
    dispatch({ type: 'DISMISS_FLASHBACK' });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 z-[10001] flex items-center justify-center p-6"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(15,10,5,0.98) 50%, rgba(0,0,0,0.95) 100%)',
        }}
      >
        {/* Film grain effect */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
          }}
        />

        {/* Letterbox bars */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-black" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-black" />

        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="w-full max-w-sm relative"
        >
          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-4"
          >
            <span className="text-3xl opacity-60">{flashback.icon}</span>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.5 }}
            className="text-center font-display text-[0.5rem] text-muted-foreground uppercase tracking-[0.3em] mb-6"
          >
            {flashback.title}
          </motion.h2>

          {/* Flashback lines */}
          <div className="space-y-4 min-h-[120px]">
            {flashback.lines.slice(0, lineIndex + 1).map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: i === lineIndex ? 1 : 0.4, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                {i === lineIndex ? (
                  <TypewriterText
                    text={line}
                    speed={35}
                    className="text-xs text-foreground/80 italic leading-relaxed"
                    onComplete={handleAdvance}
                  />
                ) : (
                  <p className="text-xs text-foreground/30 italic leading-relaxed">{line}</p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Continue button */}
          {allLinesShown && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center mt-8"
            >
              <button
                onClick={handleDismiss}
                className="px-6 py-2 text-[0.55rem] text-muted-foreground/60 uppercase tracking-[0.2em] hover:text-foreground/80 transition-colors"
              >
                Doorgaan...
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
