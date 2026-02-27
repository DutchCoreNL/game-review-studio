import { useGame } from '@/contexts/GameContext';
import { GameView } from '@/game/types';
import { Map, Package, Crosshair, Crown, User, LucideIcon, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { playNavClick } from '@/game/sounds/uiSounds';
import { useMemo } from 'react';
import { useAdmin } from '@/hooks/useAdmin';

const NAV_ITEMS: { id: GameView; label: string; icon: LucideIcon }[] = [
  { id: 'city', label: 'KAART', icon: Map },
  { id: 'trade', label: 'HANDEL', icon: Package },
  { id: 'ops', label: 'MISSIES', icon: Crosshair },
  { id: 'empire', label: 'IMPERIUM', icon: Crown },
  { id: 'profile', label: 'PROFIEL', icon: User },
];

export function GameNav() {
  const { view, setView, state } = useGame();
  const { isAdmin } = useAdmin();

  const navItems = useMemo(() => {
    const items = [...NAV_ITEMS];
    if (isAdmin) items.push({ id: 'admin', label: 'ADMIN', icon: Shield });
    return items;
  }, [isAdmin]);

  // Compute badge counts per tab
  const badges = useMemo(() => {
    const b: Partial<Record<GameView, number>> = {};

    // OPS: active contracts + hit contracts
    const opsCount = (state.activeContracts?.length || 0) + (state.hitContracts?.length || 0);
    if (opsCount > 0) b.ops = opsCount;

    // EMPIRE: crew members injured (hp < 100) or pending car orders past deadline
    const injuredCrew = state.crew?.filter(c => c.hp < 100).length || 0;
    const pendingOrders = state.carOrders?.filter(o => state.day >= o.deadline).length || 0;
    const empireCount = injuredCrew + pendingOrders;
    if (empireCount > 0) b.empire = empireCount;

    // TRADE: district with demand spike (districtDemands has a non-null entry)
    const demandCount = state.districtDemands
      ? Object.values(state.districtDemands).filter(Boolean).length
      : 0;
    if (demandCount > 0) b.trade = demandCount;

    // CITY: pending street events or night report
    const cityCount = (state.pendingStreetEvent ? 1 : 0) + (state.nightReport ? 1 : 0);
    if (cityCount > 0) b.city = cityCount;

    return b;
  }, [state.activeContracts, state.hitContracts, state.crew, state.carOrders, state.day, state.districtDemands, state.pendingStreetEvent, state.nightReport]);

  return (
    <nav className="flex-shrink-0 h-[64px] pb-[max(4px,env(safe-area-inset-bottom))] bg-[hsl(0,0%,3%)]/98 border-t border-border flex justify-around items-center z-50 backdrop-blur-md">
      {navItems.map(item => {
        const isActive = view === item.id;
        const Icon = item.icon;
        const badge = badges[item.id];
        return (
          <button
            key={item.id}
            onClick={() => { playNavClick(); setView(item.id); }}
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
