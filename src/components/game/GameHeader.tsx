import { useGame } from '@/contexts/GameContext';
import { getRankTitle } from '@/game/engine';
import { WEATHER_EFFECTS } from '@/game/constants';
import { WeatherType } from '@/game/types';
import { motion } from 'framer-motion';
import { Flame, Skull, Sun, CloudRain, CloudFog, Thermometer, CloudLightning, Phone } from 'lucide-react';

const WEATHER_ICONS: Record<WeatherType, React.ReactNode> = {
  clear: <Sun size={11} />,
  rain: <CloudRain size={11} />,
  fog: <CloudFog size={11} />,
  heatwave: <Thermometer size={11} />,
  storm: <CloudLightning size={11} />,
};

const WEATHER_COLORS: Record<WeatherType, string> = {
  clear: 'text-gold',
  rain: 'text-ice',
  fog: 'text-muted-foreground',
  heatwave: 'text-blood',
  storm: 'text-game-purple',
};

export function GameHeader() {
  const { state, dispatch } = useGame();
  const rank = getRankTitle(state.rep);
  const weatherDef = WEATHER_EFFECTS[state.weather];

  return (
    <header className="flex-none border-b border-border bg-gradient-to-b from-[hsl(0,0%,6%)] to-card px-4 py-2.5">
      {/* Top row: Title + Money */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="font-display text-lg text-blood uppercase tracking-[3px] font-bold blood-text-glow leading-none">
            Noxhaven
          </h1>
          <div className="flex items-center gap-1.5 text-[0.55rem] text-gold uppercase tracking-[0.15em] font-semibold mt-0.5 gold-text-glow">
            <span>{rank} — Dag {state.day}</span>
            <span className={`flex items-center gap-0.5 ${WEATHER_COLORS[state.weather]}`} title={weatherDef?.desc}>
              {WEATHER_ICONS[state.weather]}
              <span className="text-[0.45rem]">{weatherDef?.name}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Phone button */}
          <button
            onClick={() => dispatch({ type: 'TOGGLE_PHONE' })}
            className="relative text-muted-foreground hover:text-gold transition-colors"
          >
            <Phone size={16} />
            {state.phone.unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blood text-primary-foreground rounded-full text-[0.4rem] font-bold flex items-center justify-center"
              >
                {state.phone.unread}
              </motion.span>
            )}
          </button>
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
