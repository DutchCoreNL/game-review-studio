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
import {
  Map, Dices, Heart, Home, Building2, Wrench,
  Crosshair, FileText, Target, Skull, Swords, Award, Calendar,
  ShoppingBag, BarChart3, Gavel, TrendingUp, Droplets, ShieldCheck,
  Users, Handshake, Crown as CrownIcon,
  Car, Store, MapPin, Hammer,
  Star, Shield, Smartphone, Trophy, Mail, Settings, Sword,
  ShieldAlert, LucideIcon, BookOpen, Sparkles, GraduationCap, Plane, MessageCircle, Waypoints,
  Package, Flame,
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
  const { t } = useLanguage();

  const categories = useMemo<SidebarCategory[]>(() => {
    const cats: SidebarCategory[] = [
      {
        label: t.sidebar.city, icon: '🗺',
        items: [
          { id: 'city', label: t.sidebar.map, icon: Map },
          { id: 'travel', label: t.sidebar.travel, icon: Plane },
          { id: 'chat', label: t.sidebar.chat, icon: MessageCircle },
          { id: 'casino', label: t.sidebar.casino, icon: Dices },
          { id: 'hospital', label: t.sidebar.hospital, icon: Heart },
          { id: 'safehouse', label: t.sidebar.safehouse, icon: Home },
          { id: 'villa', label: t.sidebar.villa, icon: Building2 },
          { id: 'chopshop', label: t.sidebar.chopShop, icon: Wrench },
        ],
      },
      {
        label: t.sidebar.actions, icon: '⚔',
        items: [
          { id: 'campaign', label: t.sidebar.campaign, icon: BookOpen },
          { id: 'ops', label: t.sidebar.operations, icon: Crosshair, badge: (state.activeContracts?.length || 0) + (state.hitContracts?.length || 0) },
          { id: 'contracts', label: t.sidebar.contracts, icon: FileText },
          { id: 'heists', label: t.sidebar.heists, icon: Target },
          { id: 'bounties', label: t.sidebar.bounties, icon: Skull },
          { id: 'pvp', label: t.sidebar.pvp, icon: Swords },
          { id: 'challenges', label: t.sidebar.daily, icon: Calendar },
          { id: 'hits', label: t.sidebar.hits, icon: Award },
          { id: 'wanted', label: t.sidebar.mostWanted, icon: ShieldAlert },
          { id: 'raids', label: t.sidebar.raids, icon: Flame, badge: state.activeDungeon ? 1 : 0 },
        ],
      },
      {
        label: t.sidebar.trade, icon: '💰',
        items: [
          { id: 'market', label: t.sidebar.market, icon: ShoppingBag },
          { id: 'analysis', label: t.sidebar.analysis, icon: BarChart3 },
          { id: 'auction', label: t.sidebar.auction, icon: Gavel, badge: state.auctionItems?.length || 0 },
          { id: 'stocks', label: t.sidebar.stocks, icon: TrendingUp, badge: !!state.pendingInsiderTip },
          { id: 'launder', label: t.sidebar.launder, icon: Droplets },
          { id: 'gear', label: t.sidebar.gear, icon: ShieldCheck },
          { id: 'black-market', label: t.sidebar.blackMarket, icon: Skull },
          { id: 'salvage', label: t.sidebar.salvage, icon: Hammer },
          { id: 'loot-boxes', label: t.sidebar.lootBoxes, icon: Package },
        ],
      },
      {
        label: t.sidebar.crewWar, icon: '👥',
        items: [
          { id: 'crew', label: t.sidebar.crew, icon: Users, badge: state.crew?.filter(c => c.hp < 100).length || 0 },
          { id: 'families', label: t.sidebar.factions, icon: Users },
          { id: 'gang', label: t.sidebar.gang, icon: Skull },
          { id: 'organized-crimes', label: t.sidebar.organizedCrime, icon: Waypoints },
          { id: 'war', label: t.sidebar.war, icon: Swords },
          { id: 'corruption', label: t.sidebar.corruption, icon: Handshake },
        ],
      },
      {
        label: t.sidebar.imperium, icon: '🏛',
        items: [
          { id: 'business', label: t.sidebar.business, icon: Store },
          { id: 'garage', label: t.sidebar.garage, icon: Car, badge: state.carOrders?.filter(o => state.day >= o.deadline).length || 0 },
          { id: 'districts', label: t.sidebar.districts, icon: MapPin },
          { id: 'properties', label: t.sidebar.properties, icon: Home },
        ],
      },
      {
        label: t.sidebar.profile, icon: '👤',
        items: [
          { id: 'profile', label: t.sidebar.statsSkills, icon: BarChart3 },
          { id: 'merit', label: t.sidebar.meritPoints, icon: Sparkles },
          { id: 'gym', label: t.sidebar.gym, icon: Award },
          { id: 'jobs', label: t.sidebar.jobs, icon: Star },
          { id: 'education', label: t.sidebar.education, icon: GraduationCap },
          { id: 'loadout', label: t.sidebar.loadout, icon: Shield },
          { id: 'weapons', label: t.sidebar.weaponArsenal, icon: Sword, badge: state.weaponInventory?.length || 0 },
          { id: 'armor-arsenal', label: t.sidebar.armorArsenal, icon: Shield, badge: state.armorInventory?.length || 0 },
          { id: 'gadget-arsenal', label: t.sidebar.gadgetArsenal, icon: Smartphone, badge: state.gadgetInventory?.length || 0 },
          { id: 'contacts', label: t.sidebar.npcRelations, icon: Users },
          { id: 'reputation', label: t.sidebar.reputation, icon: Star },
          { id: 'arcs', label: t.sidebar.storyArcs, icon: Target },
          { id: 'codex', label: t.sidebar.codex, icon: BookOpen },
          { id: 'trophies', label: t.sidebar.trophies, icon: Trophy },
          { id: 'leaderboard', label: t.sidebar.leaderboard, icon: CrownIcon },
          { id: 'messages', label: t.sidebar.messages, icon: Mail, badge: state.phone?.unread || 0 },
          { id: 'settings', label: t.sidebar.settings, icon: Settings },
        ],
      },
    ];

    if (isAdmin) {
      cats.push({
        label: t.sidebar.admin, icon: '🛡',
        items: [{ id: 'admin', label: t.sidebar.adminPanel, icon: ShieldAlert }],
      });
    }

    return cats;
  }, [isAdmin, t, state.activeContracts, state.hitContracts, state.crew, state.carOrders, state.day, state.auctionItems, state.pendingInsiderTip, state.phone?.unread]);

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
