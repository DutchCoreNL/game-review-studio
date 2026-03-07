import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface DamageEntry {
  id: number;
  value: number;
  type: 'damage' | 'heal' | 'crit' | 'miss' | 'debuff' | 'combo';
  label?: string;
}

let nextId = 0;

export function useDamageNumbers() {
  const [entries, setEntries] = useState<DamageEntry[]>([]);

  const addDamage = (value: number, type: DamageEntry['type'], label?: string) => {
    const id = nextId++;
    setEntries(prev => [...prev, { id, value, type, label }]);
    setTimeout(() => setEntries(prev => prev.filter(e => e.id !== id)), 1200);
  };

  return { entries, addDamage };
}

export function DamageNumbers({ entries }: { entries: DamageEntry[] }) {
  const getColor = (type: DamageEntry['type']) => {
    switch (type) {
      case 'damage': return 'text-blood';
      case 'heal': return 'text-emerald';
      case 'crit': return 'text-gold font-black';
      case 'miss': return 'text-muted-foreground italic';
      case 'debuff': return 'text-purple-400';
      case 'combo': return 'text-amber-400 font-black';
    }
  };

  const getSize = (type: DamageEntry['type']) => {
    switch (type) {
      case 'crit': return 'text-xl';
      case 'combo': return 'text-lg';
      default: return 'text-sm';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      <AnimatePresence>
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 1, y: 0, x: Math.random() * 60 - 30 + 50 + '%', scale: 0.5 }}
            animate={{ opacity: 0, y: -60, scale: entry.type === 'crit' ? 1.5 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className={`absolute top-1/3 ${getColor(entry.type)} ${getSize(entry.type)} drop-shadow-lg`}
            style={{ left: `${30 + Math.random() * 40}%` }}
          >
            {entry.type === 'miss' ? 'MISS!' : entry.type === 'heal' ? `+${entry.value}` : entry.label || `-${entry.value}`}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
