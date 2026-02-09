import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NewsItem } from '@/game/newsGenerator';

interface NewsTickerProps {
  items: NewsItem[];
  onClickItem?: (item: NewsItem) => void;
}

const URGENCY_STYLES: Record<string, string> = {
  high: 'text-blood',
  medium: 'text-gold',
  low: 'text-muted-foreground',
};

export function NewsTicker({ items, onClickItem }: NewsTickerProps) {
  const [index, setIndex] = useState(0);

  const advance = useCallback(() => {
    if (items.length > 1) {
      setIndex(prev => (prev + 1) % items.length);
    }
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(advance, 6000);
    return () => clearInterval(interval);
  }, [advance, items.length]);

  // Reset index when items change (new day)
  useEffect(() => {
    setIndex(0);
  }, [items]);

  if (items.length === 0) return null;

  const current = items[index % items.length];

  return (
    <div className="bg-background border border-border rounded overflow-hidden mb-3 flex items-center font-mono">
      {/* NEWS label */}
      <span className="text-blood font-bold text-[0.6rem] uppercase border-r border-border px-2 py-1.5 flex-shrink-0 bg-background z-10 relative">
        NEWS
      </span>

      {/* Rotating content */}
      <div
        className="flex-1 overflow-hidden ml-2 cursor-pointer min-h-[24px] flex items-center"
        onClick={() => onClickItem?.(current)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${index}-${current.text.slice(0, 20)}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1.5 w-full"
          >
            <span className="text-[0.65rem] flex-shrink-0">{current.icon}</span>
            <span className={`text-[0.6rem] whitespace-nowrap truncate ${URGENCY_STYLES[current.urgency] || URGENCY_STYLES.low}`}>
              {current.text}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="flex gap-0.5 px-2 flex-shrink-0">
          {items.map((_, i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full transition-colors ${
                i === index % items.length ? 'bg-blood' : 'bg-border'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
