import { useGame } from '@/contexts/GameContext';
import { getRankTitle } from '@/game/engine';
import { motion } from 'framer-motion';
import { Star, Flame, TrendingUp, Skull } from 'lucide-react';
import { useState } from 'react';
import { ResourcePopup } from './ResourcePopup';

type PopupType = 'rep' | 'heat' | 'debt' | 'level' | null;

export function GameHeader() {
  const { state } = useGame();
  const rank = getRankTitle(state.rep);
  const [activePopup, setActivePopup] = useState<PopupType>(null);

  const togglePopup = (type: PopupType) => {
    setActivePopup(prev => prev === type ? null : type);
  };

  return (
    <>
      <header className="flex-none border-b border-border bg-gradient-to-b from-[hsl(0,0%,7%)] to-card px-4 py-3">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h1 className="font-display text-xl text-blood uppercase tracking-[3px] font-bold drop-shadow-[0_0_10px_hsl(var(--blood)/0.3)]">
              Noxhaven
            </h1>
            <div className="text-[0.6rem] text-gold uppercase tracking-widest font-semibold mt-0.5">
              {rank} — Dag {state.day}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-foreground">
              €{state.money.toLocaleString()}
            </div>
            {state.dirtyMoney > 0 && (
              <div className="text-[0.6rem] text-dirty font-medium">
                💰 €{state.dirtyMoney.toLocaleString()} zwart
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <ResourceItem
            label="REP"
            value={state.rep}
            icon={<TrendingUp size={12} />}
            color="text-gold"
            onClick={() => togglePopup('rep')}
            active={activePopup === 'rep'}
          />
          <ResourceItem
            label="HEAT"
            value={`${state.heat}%`}
            icon={<Flame size={12} />}
            color={state.heat > 50 ? "text-blood" : "text-muted-foreground"}
            glow={state.heat > 70}
            onClick={() => togglePopup('heat')}
            active={activePopup === 'heat'}
          />
          <ResourceItem
            label="SCHULD"
            value={`€${(state.debt / 1000).toFixed(0)}k`}
            icon={<Skull size={12} />}
            color={state.debt > 100000 ? "text-blood" : "text-muted-foreground"}
            onClick={() => togglePopup('debt')}
            active={activePopup === 'debt'}
          />
          <ResourceItem
            label="LEVEL"
            value={state.player.level}
            icon={<Star size={12} />}
            color="text-gold"
            onClick={() => togglePopup('level')}
            active={activePopup === 'level'}
            badge={state.player.skillPoints > 0 ? state.player.skillPoints : undefined}
          />
        </div>
      </header>

      <ResourcePopup type={activePopup} onClose={() => setActivePopup(null)} />
    </>
  );
}

function ResourceItem({ label, value, icon, color, glow, onClick, active, badge }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  glow?: boolean;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`bg-muted/50 rounded p-1.5 flex flex-col items-center gap-0.5 border transition-all duration-200 relative ${
        active ? 'border-gold bg-[hsl(var(--gold)/0.08)]' : 'border-border hover:border-muted-foreground'
      } ${glow ? 'pulse-glow' : ''}`}
      whileTap={{ scale: 0.93 }}
    >
      {badge && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gold text-secondary-foreground rounded-full text-[0.5rem] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
      <span className="text-[0.45rem] text-muted-foreground font-extrabold tracking-wider uppercase">
        {label}
      </span>
      <div className={`flex items-center gap-1 ${color}`}>
        {icon}
        <span className="font-bold text-xs">{value}</span>
      </div>
    </motion.button>
  );
}
