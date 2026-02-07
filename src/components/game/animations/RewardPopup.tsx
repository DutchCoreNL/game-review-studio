import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface RewardPopupProps {
  amount: number;
  type?: 'money' | 'rep' | 'xp';
}

const TYPE_STYLES = {
  money: { prefix: '+€', color: 'text-gold', glow: 'gold-text-glow' },
  rep: { prefix: '+', color: 'text-gold', glow: 'gold-text-glow' },
  xp: { prefix: '+', color: 'text-ice', glow: '' },
};

export function RewardPopup({ amount, type = 'money' }: RewardPopupProps) {
  const [key, setKey] = useState(0);
  const style = TYPE_STYLES[type];

  useEffect(() => {
    if (amount !== 0) setKey(k => k + 1);
  }, [amount]);

  if (amount === 0) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={key}
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 0, y: -24 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className={`absolute -top-1 right-0 text-xs font-bold pointer-events-none ${style.color} ${style.glow}`}
      >
        {style.prefix}{amount.toLocaleString()}
      </motion.span>
    </AnimatePresence>
  );
}
