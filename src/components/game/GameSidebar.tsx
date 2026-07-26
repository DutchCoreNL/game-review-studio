import { useGame } from '@/contexts/GameContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { GameView } from '@/game/types';
import { useAdmin } from '@/hooks/useAdmin';
import { useMemo } from 'react';
import { playNavClick } from '@/game/sounds/uiSounds';
import { motion } from 'framer-motion';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { buildNavGroups } from './navConfig';

interface GameSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GameSidebar({ open, onOpenChange }: GameSidebarProps) {
  const { view, setView, state } = useGame();
  const { isAdmin } = useAdmin();
  const { t } = useLanguage();

  const categories = useMemo(() => buildNavGroups(t, state, isAdmin), [isAdmin, t, state]);

  const handleSelect = (id: GameView) => {
    playNavClick();
    setView(id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 bg-[hsl(0,0%,4%)] border-r border-border overflow-y-auto">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="font-display text-lg text-blood uppercase tracking-[4px] font-bold blood-text-glow leading-none">
            Noxhaven
          </SheetTitle>
          <p className="text-[0.6rem] text-muted-foreground uppercase tracking-widest">📅 {new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</p>
        </SheetHeader>

        <nav className="py-2">
          {categories.map((cat, ci) => (
            <div key={cat.label}>
              {ci > 0 && <div className="h-px bg-border/40 mx-4 my-1" />}
              <div className="px-4 py-2 flex items-center gap-2">
                <span className="text-sm">{cat.emoji}</span>
                <span className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-widest">{cat.label}</span>
              </div>
              <div className="px-2 space-y-0.5">
                {cat.items.map(item => {
                  const isActive = view === item.id;
                  const Icon = item.icon;
                  const badge = typeof item.badge === 'number' ? (item.badge > 0 ? item.badge : null) : (item.badge ? true : null);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold tracking-wider transition-all duration-150 relative ${
                        isActive
                          ? 'bg-gold/10 text-gold border border-gold/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/20 border border-transparent'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-nav-indicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-gold rounded-r-full"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 1.5} className="shrink-0" />
                      <span className="flex flex-col items-start min-w-0">
                        <span>{item.label}</span>
                        {item.hint && (
                          <span className="text-[0.45rem] font-normal text-muted-foreground/70 normal-case tracking-normal leading-tight">
                            {item.hint}
                          </span>
                        )}
                      </span>
                      {badge !== null && !isActive && (
                        <span className="ml-auto min-w-[16px] h-[16px] rounded-full bg-blood text-[0.45rem] text-primary-foreground font-bold flex items-center justify-center px-0.5">
                          {typeof badge === 'number' ? (badge > 9 ? '9+' : badge) : '!'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
