import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TappableTile } from './TappableTile';

interface ResourceTileProps {
  label: string;
  value: string | number;
  color: string;
  icon?: React.ReactNode;
  pulse?: boolean;
  tooltip: string;
  onTap?: () => void;
}

/**
 * A number in the header bar.
 *
 * These sit above every screen in the game and were flat little boxes: a muted fill, a
 * hairline border, a label and a value. Two changes, both cheap:
 *
 * 1. The plate has a surface — a faint gradient and a highlight along the top edge, the
 *    same treatment the cards got, so the bar reads as machined rather than printed.
 * 2. It reacts when the number moves. In an idle game most of what happens, happens
 *    while you are looking at some other screen; a tile that flashes when your stash
 *    fills or your respect lands is the difference between a HUD you read and a HUD that
 *    tells you things.
 */
export function ResourceTile({ label, value, color, icon, pulse, tooltip, onTap }: ResourceTileProps) {
  const flash = useFlashOnChange(value);

  return (
    <TappableTile tooltip={tooltip} onTap={onTap}>
      <motion.div
        className={`relative flex flex-col items-center justify-center rounded-md px-2 py-1 border border-border/50 min-w-[2.5rem] overflow-hidden ${pulse ? 'animate-pulse' : ''}`}
        style={{
          backgroundImage: 'linear-gradient(180deg, hsl(0 0% 100% / 0.045), hsl(0 0% 0% / 0.18))',
          boxShadow: 'inset 0 1px 0 hsl(0 0% 100% / 0.05)',
        }}
        animate={flash ? { scale: [1, 1.07, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {/* The change itself, washing across the plate in the tile's own colour. */}
        {flash > 0 && (
          <motion.span
            key={flash}
            className={`absolute inset-0 pointer-events-none ${color}`}
            initial={{ opacity: 0.28 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ background: 'currentColor' }}
          />
        )}
        <span className="relative text-[0.4rem] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">{label}</span>
        <div className="relative flex items-center gap-0.5">
          {icon}
          <span className={`font-bold text-[0.65rem] tabular-nums leading-none ${color}`}>{value}</span>
        </div>
      </motion.div>
    </TappableTile>
  );
}

/**
 * Returns a token that changes whenever the value does, so an animation can be replayed.
 * Skips the first render: arriving on a screen is not a change.
 */
export function useFlashOnChange(value: unknown): number {
  const previous = useRef(value);
  const [token, setToken] = useState(0);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    setToken(t => t + 1);
    const id = setTimeout(() => setToken(0), 650);
    return () => clearTimeout(id);
  }, [value]);

  return token;
}
