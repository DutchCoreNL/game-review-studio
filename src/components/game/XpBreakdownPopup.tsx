import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

export interface XpBonus {
  key: string;
  label: string;
  value: number;
}

interface XpBreakdownPopupProps {
  show: boolean;
  baseAmount: number;
  totalXp: number;
  multiplier: number;
  bonuses: XpBonus[];
  levelUps: number;
  newLevel: number;
  onClose: () => void;
}

export function XpBreakdownPopup({
  show, baseAmount, totalXp, multiplier, bonuses, levelUps, newLevel, onClose,
}: XpBreakdownPopupProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-xs"
        >
          <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-accent/10">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-ice" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">XP Verdiend</span>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Total */}
            <div className="px-3 pt-2 pb-1 text-center">
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="text-lg font-bold text-ice"
              >
                +{totalXp} XP
              </motion.div>
              {multiplier > 1 && (
                <div className="text-[0.6rem] text-muted-foreground">
                  Basis {baseAmount} × {multiplier.toFixed(2)}
                </div>
              )}
            </div>

            {/* Bonus breakdown */}
            {bonuses.length > 0 && (
              <div className="px-3 pb-2 space-y-0.5">
                {bonuses.map((b, i) => (
                  <motion.div
                    key={b.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="flex items-center justify-between text-[0.6rem]"
                  >
                    <span className="text-muted-foreground truncate">{b.label}</span>
                    <span className={`font-bold ${b.value >= 0.5 ? 'text-gold' : 'text-emerald'}`}>
                      +{Math.round(b.value * 100)}%
                    </span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Level up */}
            {levelUps > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="px-3 py-1.5 bg-gold/10 border-t border-gold/20 text-center"
              >
                <span className="text-xs font-bold text-gold gold-text-glow">
                  ⬆ LEVEL {newLevel}! +{levelUps * 2} SP
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
