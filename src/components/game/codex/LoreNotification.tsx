import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { getEntryById } from '@/game/codex';
import { useEffect, useState } from 'react';

export function LoreNotification() {
  const { state } = useGame();
  const [visibleEntry, setVisibleEntry] = useState<{ id: string; title: string; icon: string } | null>(null);
  const codex = (state as any).codex;
  const lastUnlocked = (state as any)._lastCodexUnlock as string | undefined;

  useEffect(() => {
    if (lastUnlocked) {
      const entry = getEntryById(lastUnlocked);
      if (entry) {
        setVisibleEntry({ id: entry.id, title: entry.title, icon: entry.icon });
        const timer = setTimeout(() => setVisibleEntry(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [lastUnlocked]);

  return (
    <AnimatePresence>
      {visibleEntry && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[8000] pointer-events-none"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-gold/40 shadow-lg shadow-gold/10">
            <BookOpen size={14} className="text-gold" />
            <span className="text-[0.65rem] text-gold font-bold uppercase tracking-wider">Codex Ontgrendeld</span>
            <span className="text-sm">{visibleEntry.icon}</span>
            <span className="text-xs text-foreground">{visibleEntry.title}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
