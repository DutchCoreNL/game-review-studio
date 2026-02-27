import { useGame } from '@/contexts/GameContext';
import { GameView } from '@/game/types';
import { useAdmin } from '@/hooks/useAdmin';
import { useMemo } from 'react';
import { playNavClick } from '@/game/sounds/uiSounds';
import { motion } from 'framer-motion';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Map, Dices, Heart, Home, Building2, Wrench,
  Crosshair, FileText, Target, Skull, Swords, Award, Calendar,
  ShoppingBag, BarChart3, Gavel, TrendingUp, Droplets, ShieldCheck,
  Users, Handshake, Crown as CrownIcon,
  Car, Store, MapPin,
  BarChart3 as Stats, Star, Shield, Smartphone, Trophy, Mail, Settings,
  ShieldAlert, LucideIcon,
} from 'lucide-react';

interface SidebarCategory {
  label: string;
  icon: string;
  items: { id: GameView; label: string; icon: LucideIcon; badge?: number | boolean }[];
}

interface GameSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GameSidebar({ open, onOpenChange }: GameSidebarProps) {
  const { view, setView, state } = useGame();
  const { isAdmin } = useAdmin();

  const categories = useMemo<SidebarCategory[]>(() => {
    const cats: SidebarCategory[] = [
      {
        label: 'STAD', icon: '🗺',
        items: [
          { id: 'city', label: 'Kaart', icon: Map },
          { id: 'casino', label: 'Casino', icon: Dices },
          { id: 'hospital', label: 'Ziekenhuis', icon: Heart },
          { id: 'safehouse', label: 'Safehouse', icon: Home },
          { id: 'villa', label: 'Villa', icon: Building2 },
          { id: 'chopshop', label: 'Chop Shop', icon: Wrench },
        ],
      },
      {
        label: 'ACTIES', icon: '⚔',
        items: [
          { id: 'ops', label: 'Operaties', icon: Crosshair, badge: (state.activeContracts?.length || 0) + (state.hitContracts?.length || 0) },
          { id: 'contracts', label: 'Contracten', icon: FileText },
          { id: 'heists', label: 'Heists', icon: Target },
          { id: 'bounties', label: 'Bounties', icon: Skull },
          { id: 'pvp', label: 'PvP', icon: Swords },
          { id: 'challenges', label: 'Dagelijks', icon: Calendar },
          { id: 'hits', label: 'Hits', icon: Award },
          { id: 'wanted', label: 'Most Wanted', icon: ShieldAlert },
        ],
      },
      {
        label: 'HANDEL', icon: '💰',
        items: [
          { id: 'market', label: 'Markt', icon: ShoppingBag },
          { id: 'analysis', label: 'Analyse', icon: BarChart3 },
          { id: 'auction', label: 'Veiling', icon: Gavel, badge: state.auctionItems?.length || 0 },
          { id: 'stocks', label: 'Beurs', icon: TrendingUp, badge: !!state.pendingInsiderTip },
          { id: 'launder', label: 'Witwassen', icon: Droplets },
          { id: 'gear', label: 'Gear', icon: ShieldCheck },
        ],
      },
      {
        label: 'CREW & OORLOG', icon: '👥',
        items: [
          { id: 'crew', label: 'Crew', icon: Users, badge: state.crew?.filter(c => c.hp < 100).length || 0 },
          { id: 'families', label: 'Facties', icon: Users },
          { id: 'gang', label: 'Gang', icon: Skull },
          { id: 'war', label: 'Oorlog', icon: Swords },
          { id: 'corruption', label: 'Corruptie', icon: Handshake },
        ],
      },
      {
        label: 'IMPERIUM', icon: '🏛',
        items: [
          { id: 'business', label: 'Business', icon: Store },
          { id: 'garage', label: 'Garage', icon: Car, badge: state.carOrders?.filter(o => state.day >= o.deadline).length || 0 },
          { id: 'districts', label: 'Wijken', icon: MapPin },
        ],
      },
      {
        label: 'PROFIEL', icon: '👤',
        items: [
          { id: 'profile', label: 'Stats & Skills', icon: Stats },
          { id: 'loadout', label: 'Loadout', icon: Shield },
          { id: 'contacts', label: 'NPC Relaties', icon: Users },
          { id: 'reputation', label: 'Reputatie', icon: Star },
          { id: 'arcs', label: 'Story Arcs', icon: Target },
          { id: 'trophies', label: 'Trofeeën', icon: Trophy },
          { id: 'leaderboard', label: 'Leaderboard', icon: CrownIcon },
          { id: 'messages', label: 'Berichten', icon: Mail, badge: state.phone?.unread || 0 },
          { id: 'settings', label: 'Instellingen', icon: Settings },
        ],
      },
    ];

    if (isAdmin) {
      cats.push({
        label: 'ADMIN', icon: '🛡',
        items: [{ id: 'admin', label: 'Admin Panel', icon: ShieldAlert }],
      });
    }

    return cats;
  }, [isAdmin, state.activeContracts, state.hitContracts, state.crew, state.carOrders, state.day, state.auctionItems, state.pendingInsiderTip, state.phone?.unread]);

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
          <p className="text-[0.6rem] text-muted-foreground uppercase tracking-widest">Dag {state.day}</p>
        </SheetHeader>

        <nav className="py-2">
          {categories.map((cat, ci) => (
            <div key={cat.label}>
              {ci > 0 && <div className="h-px bg-border/40 mx-4 my-1" />}
              <div className="px-4 py-2 flex items-center gap-2">
                <span className="text-sm">{cat.icon}</span>
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
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 1.5} />
                      <span>{item.label}</span>
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
