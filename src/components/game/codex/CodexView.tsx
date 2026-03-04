import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { ViewWrapper } from '../ui/ViewWrapper';
import { 
  CODEX_ENTRIES, CODEX_CATEGORY_INFO, 
  type CodexCategory, type CodexEntry, 
  getUnlockedEntriesByCategory 
} from '@/game/codex';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Lock, ChevronRight, ArrowLeft, Sparkles } from 'lucide-react';

const CATEGORIES: CodexCategory[] = ['districts', 'characters', 'factions', 'history', 'secrets'];

function EntryContent({ entry, onBack }: { entry: CodexEntry; onBack: () => void }) {
  const { dispatch } = useGame();

  // Mark as read
  if (dispatch) {
    // Fire-and-forget
    setTimeout(() => dispatch({ type: 'CODEX_MARK_READ', entryId: entry.id } as any), 100);
  }

  const paragraphs = entry.content.split('\n\n');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[0.65rem] text-muted-foreground hover:text-foreground mb-3 transition-colors"
      >
        <ArrowLeft size={12} /> Terug
      </button>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{entry.icon}</span>
        <div>
          <h2 className="font-display text-base text-foreground uppercase tracking-widest">{entry.title}</h2>
          <span className="text-[0.55rem] text-muted-foreground uppercase tracking-wider">
            {CODEX_CATEGORY_INFO[entry.category].label}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {paragraphs.map((p, i) => {
          // Handle bold text with **
          const parts = p.split(/(\*\*[^*]+\*\*)/g);
          return (
            <p key={i} className="text-[0.7rem] leading-relaxed text-foreground/90">
              {parts.map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={j} className="text-foreground font-bold">{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('- ')) {
                  return <span key={j} className="block ml-3 text-muted-foreground">{part}</span>;
                }
                return <span key={j}>{part}</span>;
              })}
            </p>
          );
        })}
      </div>

      {entry.relatedEntries && entry.relatedEntries.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <span className="text-[0.55rem] text-muted-foreground uppercase tracking-wider">Gerelateerd</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {entry.relatedEntries.map(relId => {
              const rel = CODEX_ENTRIES.find(e => e.id === relId);
              if (!rel) return null;
              return (
                <span key={relId} className="text-[0.6rem] px-2 py-0.5 rounded-full bg-muted/30 border border-border text-muted-foreground">
                  {rel.icon} {rel.title}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function CodexView() {
  const { state } = useGame();
  const [activeCategory, setActiveCategory] = useState<CodexCategory>('districts');
  const [selectedEntry, setSelectedEntry] = useState<CodexEntry | null>(null);
  
  const codex = (state as any).codex || { unlockedEntries: [], readEntries: [], newEntries: [] };
  
  const unlockedInCategory = getUnlockedEntriesByCategory(codex, activeCategory);
  const totalInCategory = CODEX_ENTRIES.filter(e => e.category === activeCategory).length;
  const lockedCount = totalInCategory - unlockedInCategory.length;

  const totalUnlocked = codex.unlockedEntries?.length || 0;
  const totalEntries = CODEX_ENTRIES.length;
  const newCount = codex.newEntries?.length || 0;

  if (selectedEntry) {
    return (
      <ViewWrapper>
        <h2 className="font-display text-sm text-gold uppercase tracking-widest mb-3">📖 Codex</h2>
        <EntryContent entry={selectedEntry} onBack={() => setSelectedEntry(null)} />
      </ViewWrapper>
    );
  }

  return (
    <ViewWrapper>
      {/* Header stats */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-gold" />
          <span className="text-[0.6rem] text-muted-foreground">
            {totalUnlocked}/{totalEntries} ontgrendeld
          </span>
          {newCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-gold/20 text-gold text-[0.5rem] font-bold animate-pulse">
              {newCount} nieuw
            </span>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORIES.map(cat => {
          const info = CODEX_CATEGORY_INFO[cat];
          const unlockedCount = getUnlockedEntriesByCategory(codex, cat).length;
          const hasNew = CODEX_ENTRIES.some(e => e.category === cat && codex.newEntries?.includes(e.id));
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[0.6rem] font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-gold/15 border-gold/40 text-gold'
                  : 'bg-card/50 border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
              }`}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
              {hasNew && <Sparkles size={8} className="text-gold" />}
              <span className="text-[0.45rem] opacity-60">{unlockedCount}</span>
            </button>
          );
        })}
      </div>

      {/* Entry list */}
      <div className="space-y-1.5">
        {unlockedInCategory.map(entry => {
          const isNew = codex.newEntries?.includes(entry.id);
          const isRead = codex.readEntries?.includes(entry.id);
          return (
            <motion.button
              key={entry.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedEntry(entry)}
              className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-all ${
                isNew
                  ? 'bg-gold/5 border-gold/30 hover:bg-gold/10'
                  : isRead
                  ? 'bg-card/30 border-border/50 hover:bg-card/60'
                  : 'bg-card/50 border-border hover:bg-card/80'
              }`}
            >
              <span className="text-xl flex-shrink-0">{entry.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-foreground truncate">{entry.title}</div>
                <div className="text-[0.55rem] text-muted-foreground truncate">
                  {entry.content.substring(0, 80).replace(/\*\*/g, '')}...
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isNew && <Sparkles size={10} className="text-gold" />}
                <ChevronRight size={12} className="text-muted-foreground" />
              </div>
            </motion.button>
          );
        })}

        {/* Locked entries indicator */}
        {lockedCount > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border/50 text-muted-foreground">
            <Lock size={12} />
            <span className="text-[0.6rem]">
              {lockedCount} verborgen {lockedCount === 1 ? 'item' : 'items'} — ontdek meer van Noxhaven om te ontgrendelen
            </span>
          </div>
        )}
      </div>
    </ViewWrapper>
  );
}
