import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X, Unlock, Trophy, Moon } from 'lucide-react';

export interface XpBonus {
  key: string;
  label: string;
  value: number;
}

interface MilestoneReward {
  level: number;
  title: string;
  titleIcon: string;
  cash: number;
  rep: number;
  sp_bonus: number;
  desc: string;
}

interface XpBreakdownPopupProps {
  show: boolean;
  baseAmount: number;
  totalXp: number;
  multiplier: number;
  bonuses: XpBonus[];
  levelUps: number;
  newLevel: number;
  milestoneRewards?: MilestoneReward[];
  unlocks?: string[];
  restedConsumed?: number;
  onClose: () => void;
}

export function XpBreakdownPopup({
  show, baseAmount, totalXp, multiplier, bonuses, levelUps, newLevel, milestoneRewards, unlocks, restedConsumed, onClose,
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
                    <span className={`font-bold ${b.key === 'rested' ? 'text-ice' : b.value >= 0.5 ? 'text-gold' : 'text-emerald'}`}>
                      {b.key === 'rested' ? `+${Math.round(b.value * 0.5)} XP` : `+${Math.round(b.value * 100)}%`}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Rested XP consumed */}
            {restedConsumed && restedConsumed > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="px-3 pb-1 flex items-center gap-1 text-[0.6rem] text-ice/80"
              >
                <Moon size={10} />
                <span>{restedConsumed} rested XP verbruikt</span>
              </motion.div>
            )}

            {/* Level up */}
            {levelUps > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="px-3 py-1.5 bg-gold/10 border-t border-gold/20"
              >
                <div className="text-center">
                  <span className="text-xs font-bold text-gold gold-text-glow">
                    ⬆ LEVEL {newLevel}! +{levelUps * 2} SP +{levelUps} ⭐ Merit
                  </span>
                </div>

                {/* Unlocks */}
                {unlocks && unlocks.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="mt-1 space-y-0.5"
                  >
                    <div className="flex items-center gap-1 text-[0.55rem] text-gold/70 uppercase font-semibold">
                      <Unlock size={9} />
                      <span>Nieuw ontgrendeld</span>
                    </div>
                    {unlocks.map((u, i) => (
                      <div key={i} className="text-[0.6rem] text-gold/90 pl-3">
                        🔓 {u}
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Milestone rewards */}
                {milestoneRewards && milestoneRewards.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="mt-1.5 space-y-1"
                  >
                    {milestoneRewards.map((m) => (
                      <div key={m.level} className="bg-gold/10 rounded px-2 py-1 border border-gold/20">
                        <div className="flex items-center gap-1">
                          <Trophy size={10} className="text-gold" />
                          <span className="text-[0.65rem] font-bold text-gold">
                            {m.titleIcon} {m.title}
                          </span>
                        </div>
                        <div className="text-[0.55rem] text-muted-foreground mt-0.5">
                          {m.desc} • +€{m.cash.toLocaleString()} • +{m.rep} rep • +{m.sp_bonus} SP
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
