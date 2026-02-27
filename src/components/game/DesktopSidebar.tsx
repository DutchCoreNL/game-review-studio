import { useGame } from '@/contexts/GameContext';
import { GameView } from '@/game/types';
import { Map, Package, Crosshair, Crown, User, LucideIcon, Phone, Shield } from 'lucide-react';
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

export function DesktopSidebar() {
  const { view, setView, state, dispatch } = useGame();
  const { isAdmin } = useAdmin();

  const navItems = useMemo(() => {
    const items = [...NAV_ITEMS];
    if (isAdmin) items.push({ id: 'admin', label: 'ADMIN', icon: Shield });
    return items;
  }, [isAdmin]);

  const badges = useMemo(() => {
    const b: Partial<Record<GameView, number>> = {};
    const opsCount = (state.activeContracts?.length || 0) + (state.hitContracts?.length || 0);
    if (opsCount > 0) b.ops = opsCount;
    const injuredCrew = state.crew?.filter(c => c.hp < 100).length || 0;
    const pendingOrders = state.carOrders?.filter(o => state.day >= o.deadline).length || 0;
    const empireCount = injuredCrew + pendingOrders;
    if (empireCount > 0) b.empire = empireCount;
    const demandCount = state.districtDemands ? Object.values(state.districtDemands).filter(Boolean).length : 0;
    if (demandCount > 0) b.trade = demandCount;
    const cityCount = (state.pendingStreetEvent ? 1 : 0) + (state.nightReport ? 1 : 0);
    if (cityCount > 0) b.city = cityCount;
    return b;
  }, [state.activeContracts, state.hitContracts, state.crew, state.carOrders, state.day, state.districtDemands, state.pendingStreetEvent, state.nightReport]);

  return (
    <aside className="hidden lg:flex flex-col w-[220px] flex-shrink-0 bg-[hsl(0,0%,3%)] border-r border-border h-[100dvh]">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <h1 className="font-display text-xl text-blood uppercase tracking-[4px] font-bold blood-text-glow leading-none">
          Noxhaven
        </h1>
        <p className="text-[0.6rem] text-muted-foreground mt-1 uppercase tracking-widest">Dag {state.day}</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map(item => {
          const isActive = view === item.id;
          const Icon = item.icon;
          const badge = badges[item.id];
          return (
            <button
              key={item.id}
              onClick={() => { playNavClick(); setView(item.id); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-semibold tracking-wider transition-all duration-200 relative group ${
                isActive
                  ? 'bg-gold/10 text-gold border border-gold/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gold rounded-r-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              <span>{item.label}</span>
              {badge && !isActive && (
                <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-blood text-[0.5rem] text-primary-foreground font-bold flex items-center justify-center px-1">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Phone shortcut */}
      <div className="px-3 pb-4 border-t border-border pt-3">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_PHONE' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-xs text-muted-foreground hover:text-gold hover:bg-muted/30 transition-all relative"
        >
          <Phone size={16} />
          <span className="font-semibold tracking-wider">BERICHTEN</span>
          {state.phone.unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto min-w-[18px] h-[18px] bg-blood text-primary-foreground rounded-full text-[0.5rem] font-bold flex items-center justify-center"
            >
              {state.phone.unread}
            </motion.span>
          )}
        </button>
      </div>
    </aside>
  );
}
