import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HardDrive, X, Check } from 'lucide-react';

// The game is fully local — this header indicator now just reflects local save status instead
// of a cloud connection. Kept as a small popover so the header layout stays intact.
export function WifiPopup() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="flex items-center gap-0.5 text-emerald hover:opacity-80 transition-opacity"
        aria-label="Opslagstatus"
      >
        <HardDrive size={8} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 z-50 w-48 rounded border border-border bg-popover px-3 py-2.5 shadow-lg"
          >
            <div className="absolute -top-1 right-2 w-2 h-2 rotate-45 border-l border-t border-border bg-popover" />
            <div className="relative z-10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[0.55rem] font-bold uppercase tracking-wider text-emerald">Lokaal spel</span>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={10} />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[0.5rem] text-muted-foreground">
                <Check size={9} className="text-emerald flex-shrink-0" />
                <span>Voortgang wordt automatisch lokaal opgeslagen</span>
              </div>
              <p className="text-[0.45rem] text-muted-foreground/70 leading-relaxed">
                Dit is een offline spel — je save staat veilig in deze browser.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
