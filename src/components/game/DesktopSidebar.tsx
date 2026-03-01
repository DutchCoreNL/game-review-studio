import { useGame } from '@/contexts/GameContext';
import { GameView } from '@/game/types';
import {
  Map, Dices, Heart, Home, Building2, Wrench, Zap,
  Crosshair, FileText, Target, Skull, Swords, Award, Calendar,
  ShoppingBag, BarChart3, Gavel, TrendingUp, Droplets, ShieldCheck,
  Users, Handshake, Crown as CrownIcon,
  Car, Store, MapPin,
  Star, Shield, Trophy, Mail, Settings,
  ShieldAlert, LucideIcon, Phone, Newspaper, GraduationCap, Plane, MessageCircle, Waypoints,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { playNavClick } from '@/game/sounds/uiSounds';
import { useMemo, useState } from 'react';
import { DailyDigestPopup } from './DailyDigestPopup';
import { useAdmin } from '@/hooks/useAdmin';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useDailyDigest } from '@/hooks/useDailyDigest';

interface Category {
  label: string;
  icon: string;
  items: { id: GameView; label: string; icon: LucideIcon }[];
}

const CATEGORIES: Category[] = [
  {
    label: 'STAD', icon: '🗺',
    items: [
      { id: 'city', label: 'Kaart', icon: Map },
      { id: 'travel', label: 'Reizen', icon: Plane },
      { id: 'chat', label: 'Chat', icon: MessageCircle },
      { id: 'casino', label: 'Casino', icon: Dices },
      { id: 'hospital', label: 'Ziekenhuis', icon: Heart },
      { id: 'safehouse', label: 'Safehouse', icon: Home },
      { id: 'villa', label: 'Villa', icon: Building2 },
      { id: 'chopshop', label: 'Chop Shop', icon: Wrench },
      { id: 'street_events', label: 'Straat Events', icon: Zap },
    ],
  },
  {
    label: 'ACTIES', icon: '⚔',
    items: [
      { id: 'ops', label: 'Operaties', icon: Crosshair },
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
      { id: 'auction', label: 'Veiling', icon: Gavel },
      { id: 'stocks', label: 'Beurs', icon: TrendingUp },
      { id: 'launder', label: 'Witwassen', icon: Droplets },
      { id: 'gear', label: 'Gear', icon: ShieldCheck },
    ],
  },
  {
    label: 'CREW & OORLOG', icon: '👥',
    items: [
      { id: 'crew', label: 'Crew', icon: Users },
      { id: 'families', label: 'Facties', icon: Users },
      { id: 'gang', label: 'Gang', icon: Skull },
      { id: 'organized-crimes', label: 'Organized Crime', icon: Waypoints },
      { id: 'war', label: 'Oorlog', icon: Swords },
      { id: 'corruption', label: 'Corruptie', icon: Handshake },
    ],
  },
  {
    label: 'IMPERIUM', icon: '🏛',
    items: [
      { id: 'business', label: 'Business', icon: Store },
      { id: 'garage', label: 'Garage', icon: Car },
      { id: 'districts', label: 'Wijken', icon: MapPin },
      { id: 'properties', label: 'Vastgoed', icon: Home },
    ],
  },
  {
    label: 'PROFIEL', icon: '👤',
    items: [
      { id: 'profile', label: 'Stats & Skills', icon: BarChart3 },
      { id: 'gym', label: 'Gym', icon: Award },
      { id: 'jobs', label: 'Banen', icon: Star },
      { id: 'education', label: 'Educatie', icon: GraduationCap },
      { id: 'loadout', label: 'Loadout', icon: Shield },
      { id: 'contacts', label: 'NPC Relaties', icon: Users },
      { id: 'reputation', label: 'Reputatie', icon: Star },
      { id: 'arcs', label: 'Story Arcs', icon: Target },
      { id: 'trophies', label: 'Trofeeën', icon: Trophy },
      { id: 'leaderboard', label: 'Leaderboard', icon: CrownIcon },
      { id: 'messages', label: 'Berichten', icon: Mail },
      { id: 'settings', label: 'Instellingen', icon: Settings },
    ],
  },
];

// Map view to category label for auto-expand
function getCategoryForView(v: string): string | null {
  for (const cat of CATEGORIES) {
    if (cat.items.some(i => i.id === v)) return cat.label;
  }
  return null;
}

export function DesktopSidebar() {
  const { view, setView, state, dispatch } = useGame();
  const { isAdmin } = useAdmin();
  const { digest, refetchLast } = useDailyDigest();
  const [showDigest, setShowDigest] = useState(false);

  const allCategories = useMemo(() => {
    const cats = [...CATEGORIES];
    if (isAdmin) {
      cats.push({ label: 'ADMIN', icon: '🛡', items: [{ id: 'admin', label: 'Admin Panel', icon: ShieldAlert }] });
    }
    return cats;
  }, [isAdmin]);

  const activeCat = getCategoryForView(view);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(activeCat ? [activeCat] : ['STAD']));

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
        <p className="text-[0.6rem] text-muted-foreground mt-1 uppercase tracking-widest">📅 {new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</p>
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
                        <span>{item.label}</span>
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
            <span className="font-semibold tracking-wider text-gold">DIGEST</span>
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
