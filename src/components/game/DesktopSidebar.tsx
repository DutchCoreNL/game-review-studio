import { useGame } from '@/contexts/GameContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { GameView } from '@/game/types';
import {
  Map, Dices, Heart, Home, Building2, Wrench, Zap,
  Crosshair, FileText, Target, Skull, Swords, Award, Calendar,
  ShoppingBag, BarChart3, Gavel, TrendingUp, Droplets, ShieldCheck,
  Users, Handshake, Crown as CrownIcon,
  Car, Store, MapPin,
  Star, Shield, Trophy, Mail, Settings, Sparkles, BookOpen, Sword, Smartphone,
  ShieldAlert, LucideIcon, Phone, Newspaper, GraduationCap, Plane, MessageCircle, Waypoints,
  Package, Flame,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { playNavClick } from '@/game/sounds/uiSounds';
import { useMemo, useState } from 'react';
import { DailyDigestPopup } from './DailyDigestPopup';
import { useAdmin } from '@/hooks/useAdmin';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useDailyDigest } from '@/hooks/useDailyDigest';
import { formatGameDate } from '@/lib/gameDate';
import { useWorldState, TIME_OF_DAY_ICONS } from '@/hooks/useWorldState';

interface Category {
  label: string;
  icon: string;
  items: { id: GameView; label: string; icon: LucideIcon }[];
}

// Map view to category label for auto-expand
function getCategoryForView(v: string, cats: Category[]): string | null {
  for (const cat of cats) {
    if (cat.items.some(i => i.id === v)) return cat.label;
  }
  return null;
}

export function DesktopSidebar() {
  const { view, setView, state, dispatch } = useGame();
  const { isAdmin } = useAdmin();
  const { t } = useLanguage();
  const { digest, refetchLast } = useDailyDigest();
  const worldState = useWorldState();
  const [showDigest, setShowDigest] = useState(false);

  const allCategories = useMemo<Category[]>(() => {
    const cats: Category[] = [
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
          { id: 'ops', label: t.sidebar.operations, icon: Crosshair },
          { id: 'contracts', label: t.sidebar.contracts, icon: FileText },
          { id: 'heists', label: t.sidebar.heists, icon: Target },
          { id: 'bounties', label: t.sidebar.bounties, icon: Skull },
          { id: 'pvp', label: t.sidebar.pvp, icon: Swords },
          { id: 'challenges', label: t.sidebar.daily, icon: Calendar },
          { id: 'hits', label: t.sidebar.hits, icon: Award },
          { id: 'wanted', label: t.sidebar.mostWanted, icon: ShieldAlert },
          { id: 'raids', label: t.sidebar.raids, icon: Flame },
        ],
      },
      {
        label: t.sidebar.trade, icon: '💰',
        items: [
          { id: 'market', label: t.sidebar.market, icon: ShoppingBag },
          { id: 'analysis', label: t.sidebar.analysis, icon: BarChart3 },
          { id: 'auction', label: t.sidebar.auction, icon: Gavel },
          { id: 'stocks', label: t.sidebar.stocks, icon: TrendingUp },
          { id: 'launder', label: t.sidebar.launder, icon: Droplets },
          { id: 'gear', label: t.sidebar.gear, icon: ShieldCheck },
          { id: 'black-market', label: t.sidebar.blackMarket, icon: Skull },
          { id: 'salvage', label: t.sidebar.salvage, icon: Wrench },
          { id: 'loot-boxes', label: t.sidebar.lootBoxes, icon: Package },
        ],
      },
      {
        label: t.sidebar.crewWar, icon: '👥',
        items: [
          { id: 'crew', label: t.sidebar.crew, icon: Users },
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
          { id: 'garage', label: t.sidebar.garage, icon: Car },
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
          { id: 'weapons', label: t.sidebar.weaponArsenal, icon: Sword },
          { id: 'armor-arsenal', label: t.sidebar.armorArsenal, icon: Shield },
          { id: 'gadget-arsenal', label: t.sidebar.gadgetArsenal, icon: Smartphone },
          { id: 'contacts', label: t.sidebar.npcRelations, icon: Users },
          { id: 'reputation', label: t.sidebar.reputation, icon: Star },
          { id: 'arcs', label: t.sidebar.storyArcs, icon: Target },
          { id: 'codex', label: t.sidebar.codex, icon: BookOpen },
          { id: 'trophies', label: t.sidebar.trophies, icon: Trophy },
          { id: 'leaderboard', label: t.sidebar.leaderboard, icon: CrownIcon },
          { id: 'messages', label: t.sidebar.messages, icon: Mail },
          { id: 'settings', label: t.sidebar.settings, icon: Settings },
        ],
      },
    ];
    if (isAdmin) {
      cats.push({ label: t.sidebar.admin, icon: '🛡', items: [{ id: 'admin', label: t.sidebar.adminPanel, icon: ShieldAlert }] });
    }
    return cats;
  }, [isAdmin, t]);

  const activeCat = getCategoryForView(view, allCategories);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(activeCat ? [activeCat] : [allCategories[0]?.label]));

  const toggleCat = (label: string) => {
    setOpenCats(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  // Auto-open active category
  useMemo(() => {
    if (activeCat && !openCats.has(activeCat)) {
      setOpenCats(prev => new Set([...prev, activeCat]));
    }
  }, [activeCat]);

  return (
    <aside className="hidden lg:flex flex-col w-[220px] flex-shrink-0 bg-[hsl(0,0%,3%)] border-r border-border h-[100dvh]">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <h1 className="font-display text-xl text-blood uppercase tracking-[4px] font-bold blood-text-glow leading-none">
          Noxhaven
        </h1>
        <p className="text-[0.6rem] text-muted-foreground mt-1 uppercase tracking-widest">{TIME_OF_DAY_ICONS[worldState.timeOfDay]} 📅 {formatGameDate()}</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto game-scroll">
        {allCategories.map(cat => {
          const isOpen = openCats.has(cat.label);
          return (
            <div key={cat.label}>
              <button
                onClick={() => toggleCat(cat.label)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-[0.55rem] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
              >
                <span className="text-xs">{cat.icon}</span>
                <span className="flex-1 text-left">{cat.label}</span>
                {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              {isOpen && (
                <div className="space-y-0.5 mb-1">
                  {cat.items.map(item => {
                    const isActive = view === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { playNavClick(); setView(item.id); }}
                        className={`w-full flex items-center gap-2.5 pl-7 pr-2 py-1.5 rounded text-[0.65rem] font-semibold tracking-wider transition-all duration-150 relative ${
                          isActive
                            ? 'bg-gold/10 text-gold border border-gold/20'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/20 border border-transparent'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="desktop-sidebar-indicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-gold rounded-r-full"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <Icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />
                        <span className="flex-1">{item.label}</span>
                        {item.id === 'merit' && (state.meritPoints || 0) > 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-yellow-500/20 text-yellow-400 rounded-full">
                            {state.meritPoints}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Phone shortcut */}
      <div className="px-3 pb-4 border-t border-border pt-3 space-y-1">
        {digest && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => { refetchLast(); setShowDigest(true); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded text-xs bg-gold/10 border border-gold/20 hover:bg-gold/20 transition-all cursor-pointer"
          >
            <Newspaper size={16} className="text-gold" />
            <span className="font-semibold tracking-wider text-gold">{t.sidebar.digest}</span>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="ml-auto min-w-[18px] h-[18px] bg-gold text-secondary-foreground rounded-full text-[0.5rem] font-bold flex items-center justify-center"
            >
              !
            </motion.span>
          </motion.button>
        )}
        {showDigest && (
          <DailyDigestPopup forceOpen onClose={() => setShowDigest(false)} />
        )}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_PHONE' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-xs text-muted-foreground hover:text-gold hover:bg-muted/30 transition-all relative"
        >
          <Phone size={16} />
          <span className="font-semibold tracking-wider">{t.sidebar.messages}</span>
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
