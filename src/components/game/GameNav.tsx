import { useGame } from '@/contexts/GameContext';
import { GameView } from '@/game/types';
import { Map, Building2, Package, Users, Crosshair, Dices, User, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS: { id: GameView; label: string; icon: LucideIcon }[] = [
  { id: 'city', label: 'KAART', icon: Map },
  { id: 'assets', label: 'BEZIT', icon: Building2 },
  { id: 'business', label: 'HANDEL', icon: Package },
  { id: 'families', label: 'BAZEN', icon: Users },
  { id: 'ops', label: 'MISSIES', icon: Crosshair },
  { id: 'casino', label: 'CASINO', icon: Dices },
  { id: 'profile', label: 'IK', icon: User },
];

export function GameNav() {
  const { view, setView } = useGame();

  return (
    <nav className="absolute bottom-0 left-0 right-0 h-[65px] pb-[max(5px,env(safe-area-inset-bottom))] bg-[hsl(0,0%,4%)]/98 border-t border-border flex justify-around items-center z-50 backdrop-blur-sm">
      {NAV_ITEMS.map(item => {
        const isActive = view === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center gap-1 text-[0.55rem] font-semibold transition-colors duration-200 px-1 py-2 min-w-[50px] relative ${
              isActive ? 'text-gold' : 'text-muted-foreground'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gold rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon size={18} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
