import { useGame } from '@/contexts/GameContext';
import { canClaimDailyReward, shouldResetStreak, DAILY_REWARD_CYCLE } from '@/game/dailyRewards';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Check, Lock } from 'lucide-react';
import { useState } from 'react';

export function DailyRewardPopup() {
  const { state, dispatch, showToast } = useGame();
  const [claimed, setClaimed] = useState(false);
  const [visible, setVisible] = useState(true);

  const canClaim = canClaimDailyReward(state.lastDailyRewardClaim ?? null);
  if (!canClaim || !visible) return null;

  const wouldReset = shouldResetStreak(state.lastDailyRewardClaim ?? null);
  const currentStreak = wouldReset ? 0 : (state.dailyRewardStreak || 0);
  const nextDay = ((currentStreak) % 7) + 1; // 1-7

  const handleClaim = () => {
    dispatch({ type: 'CLAIM_DAILY_LOGIN_REWARD' });
    setClaimed(true);
    showToast(`Dag ${nextDay} beloning ontvangen!`);
    setTimeout(() => setVisible(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={() => setVisible(false)}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          className="bg-card border border-border rounded-xl p-5 max-w-sm w-full shadow-xl space-y-4"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
        >
          <div className="text-center space-y-1">
            <Gift className="mx-auto text-gold" size={32} />
            <h3 className="font-display text-lg font-bold text-foreground">Dagelijkse Beloning</h3>
            <p className="text-xs text-muted-foreground">
              Streak: {currentStreak} {wouldReset && currentStreak > 0 ? '(reset!)' : ''} dagen
            </p>
          </div>

          {/* 7-day cycle display */}
          <div className="grid grid-cols-7 gap-1">
            {DAILY_REWARD_CYCLE.map((reward, i) => {
              const dayNum = i + 1;
              const isPast = dayNum <= currentStreak;
              const isCurrent = dayNum === nextDay;
              return (
                <div
                  key={dayNum}
                  className={`flex flex-col items-center py-2 px-1 rounded text-center ${
                    isCurrent ? 'bg-gold/15 border border-gold/40 ring-1 ring-gold/30' :
                    isPast ? 'bg-muted/30 opacity-60' : 'bg-muted/10'
                  }`}
                >
                  <span className="text-lg">{reward.icon}</span>
                  <span className="text-[0.5rem] font-bold text-muted-foreground">D{dayNum}</span>
                  <span className="text-[0.45rem] text-muted-foreground truncate w-full">{reward.label}</span>
                  {isPast && <Check size={10} className="text-emerald mt-0.5" />}
                </div>
              );
            })}
          </div>

          {!claimed ? (
            <Button className="w-full" onClick={handleClaim}>
              <Gift size={14} /> Claim Dag {nextDay} Beloning
            </Button>
          ) : (
            <div className="text-center text-sm text-emerald font-bold">
              ✓ Ontvangen!
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
