import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

interface FloatingReward {
  id: number;
  text: string;
  color: string;
  glow: string;
}

let rewardIdCounter = 0;

interface RewardPopupProps {
  amount: number;
  type?: 'money' | 'rep' | 'xp' | 'heat';
}

const TYPE_STYLES = {
  money: { prefix: '+€', color: 'text-gold', glow: 'gold-text-glow' },
  rep: { prefix: '+', suffix: ' REP', color: 'text-gold', glow: 'gold-text-glow' },
  xp: { prefix: '+', suffix: ' XP', color: 'text-ice', glow: '' },
  heat: { prefix: '+', suffix: ' HEAT', color: 'text-blood', glow: '' },
};

export function RewardPopup({ amount, type = 'money' }: RewardPopupProps) {
  const [floaters, setFloaters] = useState<FloatingReward[]>([]);
  const prevAmount = useRef(amount);

  useEffect(() => {
    if (amount !== 0 && amount !== prevAmount.current) {
      const style = TYPE_STYLES[type];
      const suffix = (style as any).suffix || '';
      const newFloater: FloatingReward = {
        id: ++rewardIdCounter,
        text: `${style.prefix}${Math.abs(amount).toLocaleString()}${suffix}`,
        color: style.color,
        glow: style.glow,
      };
      setFloaters(prev => [...prev.slice(-3), newFloater]);

      // Auto-remove after animation
      setTimeout(() => {
        setFloaters(prev => prev.filter(f => f.id !== newFloater.id));
      }, 1500);
    }
    prevAmount.current = amount;
  }, [amount, type]);

  return (
    <div className="absolute -top-1 right-0 pointer-events-none">
      <AnimatePresence>
        {floaters.map((f, i) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -(24 + i * 16), scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
            className={`absolute right-0 text-xs font-bold whitespace-nowrap ${f.color} ${f.glow}`}
            style={{ bottom: 0 }}
          >
            <span className="reward-shimmer">{f.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ========== Trade Floating Reward ==========
// Standalone component for in-line trade popups

interface TradeRewardFloaterProps {
  amount: number;
  show: boolean;
  type?: 'profit' | 'cost';
}

export function TradeRewardFloater({ amount, show, type = 'profit' }: TradeRewardFloaterProps) {
  return (
    <AnimatePresence>
      {show && amount !== 0 && (
        <motion.span
          initial={{ opacity: 1, y: 0, scale: 0.8 }}
          animate={{ opacity: 0, y: -20, scale: 1.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: 'easeOut' }}
          className={`absolute -top-2 right-0 text-[0.6rem] font-bold pointer-events-none whitespace-nowrap ${
            type === 'profit' ? 'text-gold gold-text-glow' : 'text-blood'
          }`}
        >
          <span className="reward-shimmer">
            {type === 'profit' ? '+' : '-'}€{Math.abs(amount).toLocaleString()}
          </span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// ========== XP Bar with Level-Up Animation ==========

interface AnimatedXPBarProps {
  xp: number;
  nextXp: number;
  level: number;
}

export function AnimatedXPBar({ xp, nextXp, level }: AnimatedXPBarProps) {
  const [flash, setFlash] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevel = useRef(level);
  const pct = Math.min(100, (xp / nextXp) * 100);

  useEffect(() => {
    if (level > prevLevel.current) {
      setFlash(true);
      setShowLevelUp(true);
      const t1 = setTimeout(() => setFlash(false), 600);
      const t2 = setTimeout(() => setShowLevelUp(false), 2000);
      prevLevel.current = level;
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    prevLevel.current = level;
  }, [level]);

  return (
    <div className="relative">
      <div className={`h-2 bg-muted rounded-full overflow-hidden relative ${flash ? 'xp-bar-flash' : ''}`}>
        <motion.div
          className="h-full rounded-full bg-blood relative overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Shimmer overlay on the fill */}
          <div className="absolute inset-0 xp-shimmer" />
        </motion.div>
      </div>

      {/* Level-up popup */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="absolute left-1/2 -translate-x-1/2 -top-2 text-gold gold-text-glow font-bold text-xs whitespace-nowrap pointer-events-none"
          >
            ⬆ LEVEL {level}!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
