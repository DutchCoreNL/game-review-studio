import { useGame } from '@/contexts/GameContext';
import { DAILY_REWARDS } from '@/game/constants';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';

export function DailyReward() {
  const { state, dispatch } = useGame();
  const streak = Math.min(state.loginStreak + 1, 7);
  const reward = DAILY_REWARDS[streak - 1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/90 z-[10000] flex items-center justify-center p-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm text-center game-card p-6 border-gold glow-gold"
      >
        <Gift size={40} className="text-gold mx-auto mb-4" />
        <h2 className="font-display text-lg text-gold uppercase tracking-widest mb-2">Dagelijkse Beloning</h2>
        <p className="text-muted-foreground text-sm mb-1">Dag {streak} streak!</p>
        <p className="text-2xl font-bold text-gold mb-6">{reward?.label || '€500'}</p>

        <div className="flex gap-1 mb-6 justify-center">
          {DAILY_REWARDS.map((r, i) => (
            <div key={i} className={`w-8 h-8 rounded flex items-center justify-center text-[0.5rem] font-bold ${
              i < streak ? 'bg-gold text-secondary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              D{i + 1}
            </div>
          ))}
        </div>

        <button
          onClick={() => dispatch({ type: 'CLAIM_DAILY_REWARD' })}
          className="w-full py-3 rounded bg-gold text-secondary-foreground font-bold text-sm uppercase tracking-wider pulse-gold"
        >
          CLAIM BELONING
        </button>
      </motion.div>
    </motion.div>
  );
}
