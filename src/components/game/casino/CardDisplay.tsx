import { PlayingCard } from '@/game/types';
import { isRedSuit, getSuitSymbol } from './casinoUtils';
import { motion } from 'framer-motion';

interface CardDisplayProps {
  card: PlayingCard | null;
  hidden?: boolean;
  large?: boolean;
}

export function CardDisplay({ card, hidden = false, large = false }: CardDisplayProps) {
  const w = large ? 'w-14' : 'w-10';
  const h = large ? 'h-20' : 'h-14';
  const fontSize = large ? 'text-base' : 'text-xs';
  const suitSize = large ? 'text-lg' : 'text-sm';

  if (hidden || !card) {
    return (
      <div className={`${w} ${h} rounded-md border-2 border-blood/60 bg-gradient-to-br from-blood/40 to-blood/20 flex items-center justify-center shadow-md mx-0.5`}>
        <span className="text-blood/50 font-bold text-lg">?</span>
      </div>
    );
  }

  const red = isRedSuit(card.suit);
  const suitSym = getSuitSymbol(card.suit);

  return (
    <motion.div
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`${w} ${h} rounded-md border-2 ${
        red ? 'border-blood/50' : 'border-foreground/30'
      } bg-foreground/90 flex flex-col items-center justify-center shadow-md mx-0.5 relative`}
    >
      <span className={`font-bold font-mono ${fontSize} ${red ? 'text-blood' : 'text-background'}`}>
        {card.rank}
      </span>
      <span className={`${suitSize} leading-none ${red ? 'text-blood' : 'text-background'}`}>
        {suitSym}
      </span>
      {/* Corner indicator */}
      <span className={`absolute top-0.5 left-1 text-[0.4rem] font-bold ${red ? 'text-blood' : 'text-background'}`}>
        {card.rank}
      </span>
    </motion.div>
  );
}
