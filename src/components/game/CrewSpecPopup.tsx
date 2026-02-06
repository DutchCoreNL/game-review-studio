import { useGame } from '@/contexts/GameContext';
import { getSpecsForRole } from '@/game/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

export function CrewSpecPopup() {
  const { state, dispatch, showToast } = useGame();
  const pending = state.pendingSpecChoice;

  if (!pending) return null;

  const crew = state.crew[pending.crewIndex];
  if (!crew) return null;

  const specs = getSpecsForRole(crew.role);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/85 z-[10001] flex items-center justify-center p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm game-card border-t-[3px] border-t-gold p-5 shadow-2xl"
        >
          <div className="text-center mb-4">
            <Star size={24} className="text-gold mx-auto mb-2" />
            <h3 className="font-display text-sm text-gold uppercase tracking-wider">Specialisatie Keuze</h3>
            <p className="text-[0.6rem] text-muted-foreground mt-1">
              {crew.name} ({crew.role}) bereikt Level {pending.level}!
            </p>
          </div>

          <div className="space-y-2 mb-4">
            {specs.map(spec => (
              <motion.button
                key={spec.id}
                onClick={() => {
                  dispatch({ type: 'SET_SPECIALIZATION', crewIndex: pending.crewIndex, specId: spec.id });
                  showToast(`${crew.name} → ${spec.name}!`);
                }}
                className="w-full text-left game-card-interactive border-l-[3px] border-l-gold"
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs text-gold">{spec.name}</h4>
                    <p className="text-[0.5rem] text-muted-foreground">{spec.desc}</p>
                  </div>
                  <span className="text-[0.5rem] text-muted-foreground font-bold">PAD {spec.path}</span>
                </div>
              </motion.button>
            ))}
          </div>

          <button
            onClick={() => dispatch({ type: 'DISMISS_SPEC_CHOICE' })}
            className="w-full py-2 rounded text-xs font-semibold bg-muted border border-border text-muted-foreground"
          >
            LATER KIEZEN
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
