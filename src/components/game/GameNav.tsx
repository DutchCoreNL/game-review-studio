import { useGame } from '@/contexts/GameContext';
import { GameView } from '@/game/types';
import { Map, Package, Crosshair, Crown, User, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS: { id: GameView; label: string; icon: LucideIcon }[] = [
  { id: 'city', label: 'KAART', icon: Map },
  { id: 'trade', label: 'HANDEL', icon: Package },
  { id: 'ops', label: 'MISSIES', icon: Crosshair },
  { id: 'empire', label: 'IMPERIUM', icon: Crown },
  { id: 'profile', label: 'PROFIEL', icon: User },
];

export function GameNav() {
  const { view, setView } = useGame();

  return (
    <nav className="absolute bottom-0 left-0 right-0 h-[60px] pb-[max(4px,env(safe-area-inset-bottom))] bg-[hsl(0,0%,3%)]/98 border-t border-border flex justify-around items-center z-50 backdrop-blur-md">
      {NAV_ITEMS.map(item => {
        const isActive = view === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center gap-0.5 text-[0.55rem] font-semibold transition-all duration-200 px-3 py-1.5 min-w-[56px] relative ${
              isActive ? 'text-gold' : 'text-muted-foreground'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gold rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
            <span className="tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
