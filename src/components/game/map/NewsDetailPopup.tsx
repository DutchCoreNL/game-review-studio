import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { NewsItem } from '@/game/newsGenerator';
import { GameBadge } from '../ui/GameBadge';

interface NewsDetailPopupProps {
  item: NewsItem | null;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, { label: string; variant: 'blood' | 'gold' | 'emerald' | 'purple' | 'muted' | 'ice' }> = {
  player: { label: 'SPELER', variant: 'gold' },
  faction: { label: 'FACTIE', variant: 'blood' },
  market: { label: 'MARKT', variant: 'emerald' },
  weather: { label: 'WEER', variant: 'ice' },
  heat: { label: 'POLITIE', variant: 'blood' },
  crew: { label: 'CREW', variant: 'purple' },
  corruption: { label: 'CORRUPTIE', variant: 'purple' },
  vehicle: { label: 'VERKEER', variant: 'gold' },
  karma: { label: 'REPUTATIE', variant: 'emerald' },
  flavor: { label: 'NOXHAVEN', variant: 'muted' },
};

export function NewsDetailPopup({ item, onClose }: NewsDetailPopupProps) {
  const cat = item ? (CATEGORY_LABELS[item.category] || CATEGORY_LABELS.flavor) : CATEGORY_LABELS.flavor;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          key={item.text}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="game-card border-l-[3px] border-l-blood mb-3 relative"
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={12} />
          </button>

          <div className="flex items-start gap-2">
            <span className="text-lg mt-0.5">{item.icon}</span>
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5 mb-1">
                <GameBadge variant={cat.variant} size="xs">{cat.label}</GameBadge>
                {item.urgency === 'high' && <GameBadge variant="blood" size="xs">URGENT</GameBadge>}
              </div>
              <p className="text-[0.6rem] font-bold leading-tight mb-1">{item.text}</p>
              {item.detail && (
                <p className="text-[0.5rem] text-muted-foreground leading-relaxed">{item.detail}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
