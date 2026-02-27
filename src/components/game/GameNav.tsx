import { useGame } from '@/contexts/GameContext';
import { GameView } from '@/game/types';
import { Map, Crosshair, ShoppingBag, Building2, Menu, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { playNavClick } from '@/game/sounds/uiSounds';
import { useMemo } from 'react';

const NAV_ITEMS: { id: GameView | 'menu'; label: string; icon: LucideIcon }[] = [
  { id: 'city', label: 'KAART', icon: Map },
  { id: 'ops', label: 'ACTIES', icon: Crosshair },
  { id: 'market', label: 'HANDEL', icon: ShoppingBag },
  { id: 'garage', label: 'IMPERIUM', icon: Building2 },
  { id: 'menu', label: 'MENU', icon: Menu },
];

interface GameNavProps {
  onMenuOpen: () => void;
}

export function GameNav({ onMenuOpen }: GameNavProps) {
  const { view, setView, state } = useGame();

  const badges = useMemo(() => {
    const b: Partial<Record<string, number>> = {};
    const opsCount = (state.activeContracts?.length || 0) + (state.hitContracts?.length || 0);
    if (opsCount > 0) b.ops = opsCount;
    const demandCount = state.districtDemands ? Object.values(state.districtDemands).filter(Boolean).length : 0;
    if (demandCount > 0) b.market = demandCount;
    const cityCount = (state.pendingStreetEvent ? 1 : 0) + (state.nightReport ? 1 : 0);
    if (cityCount > 0) b.city = cityCount;
    return b;
  }, [state.activeContracts, state.hitContracts, state.districtDemands, state.pendingStreetEvent, state.nightReport]);

  // Check if current view belongs to a nav group
  const isInGroup = (navId: string): boolean => {
    if (navId === 'city') return ['city', 'casino', 'hospital', 'safehouse', 'villa', 'chopshop'].includes(view);
    if (navId === 'ops') return ['ops', 'contracts', 'heists', 'bounties', 'pvp', 'challenges', 'hits', 'wanted', 'crew'].includes(view);
    if (navId === 'market') return ['market', 'trade', 'analysis', 'auction', 'stocks', 'launder', 'gear'].includes(view);
    if (navId === 'garage') return ['garage', 'business', 'districts', 'families', 'gang', 'war', 'corruption', 'empire'].includes(view);
    return false;
  };

  return (
    <nav className="flex-shrink-0 h-[64px] pb-[max(4px,env(safe-area-inset-bottom))] bg-[hsl(0,0%,3%)]/98 border-t border-border flex justify-around items-center z-50 backdrop-blur-md">
      {NAV_ITEMS.map(item => {
        const isMenu = item.id === 'menu';
        const isActive = !isMenu && isInGroup(item.id);
        const Icon = item.icon;
        const badge = !isMenu ? badges[item.id] : undefined;
        return (
          <button
            key={item.id}
            onClick={() => {
              playNavClick();
              if (isMenu) {
                onMenuOpen();
              } else {
                setView(item.id as GameView);
              }
            }}
            className={`flex flex-col items-center gap-0.5 text-[0.6rem] font-semibold transition-all duration-200 px-4 py-2 min-w-[60px] min-h-[44px] relative ${
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
            <div className="relative">
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              {badge && !isActive && (
                <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] rounded-full bg-blood text-[0.45rem] text-primary-foreground font-bold flex items-center justify-center px-0.5 leading-none">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className="tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
