import { useGame } from '@/contexts/GameContext';
import { getRankTitle } from '@/game/engine';
import { motion } from 'framer-motion';
import { Flame, Skull } from 'lucide-react';

export function GameHeader() {
  const { state } = useGame();
  const rank = getRankTitle(state.rep);

  return (
    <header className="flex-none border-b border-border bg-gradient-to-b from-[hsl(0,0%,6%)] to-card px-4 py-2.5">
      {/* Top row: Title + Money */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="font-display text-lg text-blood uppercase tracking-[3px] font-bold blood-text-glow leading-none">
            Noxhaven
          </h1>
          <div className="text-[0.55rem] text-gold uppercase tracking-[0.15em] font-semibold mt-0.5 gold-text-glow">
            {rank} — Dag {state.day}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-foreground tracking-wide">
            €{state.money.toLocaleString()}
          </div>
          {state.dirtyMoney > 0 && (
            <div className="text-[0.55rem] text-dirty font-medium">
              💰 €{state.dirtyMoney.toLocaleString()} zwart
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: compact resource strip */}
      <div className="flex items-center gap-3 text-[0.6rem]">
        <ResourceChip label="REP" value={state.rep} color="text-gold" />
        <ResourceChip
          label="HEAT"
          value={`${state.heat}%`}
          color={state.heat > 50 ? 'text-blood' : 'text-muted-foreground'}
          icon={state.heat > 70 ? <Flame size={9} className="text-blood" /> : undefined}
          pulse={state.heat > 70}
        />
        <ResourceChip
          label="SCHULD"
          value={`€${(state.debt / 1000).toFixed(0)}k`}
          color={state.debt > 100000 ? 'text-blood' : 'text-muted-foreground'}
          icon={state.debt > 100000 ? <Skull size={9} className="text-blood" /> : undefined}
        />
        <ResourceChip
          label="LVL"
          value={state.player.level}
          color="text-gold"
          badge={state.player.skillPoints > 0 ? state.player.skillPoints : undefined}
        />
      </div>
    </header>
  );
}

function ResourceChip({ label, value, color, icon, pulse, badge }: {
  label: string;
  value: string | number;
  color: string;
  icon?: React.ReactNode;
  pulse?: boolean;
  badge?: number;
}) {
  return (
    <div className={`flex items-center gap-1 relative ${pulse ? 'animate-pulse' : ''}`}>
      {icon}
      <span className="text-muted-foreground font-bold tracking-wider">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
      {badge !== undefined && badge > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-gold text-secondary-foreground rounded-full text-[0.4rem] font-bold flex items-center justify-center"
        >
          {badge}
        </motion.span>
      )}
    </div>
  );
}
