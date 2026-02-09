import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TappableTileProps {
  tooltip: string;
  onTap?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function TappableTile({ tooltip, onTap, children, className = '' }: TappableTileProps) {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (onTap) {
      onTap();
    } else {
      setOpen(prev => !prev);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        onBlur={() => setOpen(false)}
        className="w-full text-left focus:outline-none"
      >
        {children}
      </button>
      <AnimatePresence>
        {!onTap && open && (
          <motion.div
            initial={{ opacity: 0, y: -2, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -2, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-50 w-max max-w-[11rem] rounded border border-border bg-popover px-2.5 py-1.5 shadow-lg"
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-l border-t border-border bg-popover" />
            <p className="text-[0.55rem] text-popover-foreground leading-relaxed relative z-10">
              {tooltip}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
