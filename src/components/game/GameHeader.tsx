import { useGame } from '@/contexts/GameContext';
import { getRankTitle, getActiveVehicleHeat } from '@/game/engine';
import { WEATHER_EFFECTS } from '@/game/constants';
import { ENDGAME_PHASES } from '@/game/endgame';
import { WeatherType } from '@/game/types';
import { getKarmaAlignment, getKarmaLabel } from '@/game/karma';
import { AnimatedCounter } from './animations/AnimatedCounter';
import { RewardPopup } from './animations/RewardPopup';
import { motion } from 'framer-motion';
import { Flame, Skull, Sun, CloudRain, CloudFog, Thermometer, CloudLightning, Phone, Car, EyeOff, Shield, Zap, Crosshair } from 'lucide-react';

const WEATHER_ICONS: Record<WeatherType, React.ReactNode> = {
  clear: <Sun size={10} />,
  rain: <CloudRain size={10} />,
  fog: <CloudFog size={10} />,
  heatwave: <Thermometer size={10} />,
  storm: <CloudLightning size={10} />,
};

const WEATHER_COLORS: Record<WeatherType, string> = {
  clear: 'text-gold',
  rain: 'text-ice',
  fog: 'text-muted-foreground',
  heatwave: 'text-blood',
  storm: 'text-game-purple',
};

function getHeatBarColor(value: number): string {
  if (value > 70) return 'bg-blood';
  if (value > 50) return 'bg-gold';
  return 'bg-emerald';
}

function getHeatTextColor(value: number): string {
  if (value > 70) return 'text-blood';
  if (value > 50) return 'text-gold';
  return 'text-emerald';
}

export function GameHeader() {
  const { state, dispatch } = useGame();
  const rank = getRankTitle(state.rep);
  const weatherDef = WEATHER_EFFECTS[state.weather];
  const phaseData = ENDGAME_PHASES.find(p => p.id === state.endgamePhase);
  const vehicleHeat = getActiveVehicleHeat(state);
  const personalHeat = state.personalHeat || 0;
  const isHiding = (state.hidingDays || 0) > 0;
  const karma = state.karma || 0;
  const karmaAlign = getKarmaAlignment(karma);
  const karmaLbl = getKarmaLabel(karma);
  const ammo = state.ammo || 0;

  return (
    <header className="flex-none border-b border-border bg-gradient-to-b from-[hsl(0,0%,6%)] to-card px-3 pt-2 pb-2">
      {/* Row 1: Title + Money */}
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0">
          <h1 className="font-display text-base text-blood uppercase tracking-[3px] font-bold blood-text-glow leading-none">
            Noxhaven
          </h1>
          <div className="flex items-center gap-1.5 text-[0.5rem] text-gold/80 uppercase tracking-wider font-semibold mt-0.5">
            <span>{phaseData?.icon || '🔫'}</span>
            <span className="truncate">{phaseData?.label || rank}</span>
            <span className="text-muted-foreground/40">·</span>
            <span>Dag {state.day}</span>
            <span className={`flex items-center gap-0.5 ${WEATHER_COLORS[state.weather]}`} title={weatherDef?.desc}>
              {WEATHER_ICONS[state.weather]}
            </span>
            {state.newGamePlusLevel > 0 && (
              <span className="text-game-purple text-[0.45rem] font-bold">NG+{state.newGamePlusLevel}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_PHONE' })}
            className="relative text-muted-foreground hover:text-gold transition-colors"
          >
            <Phone size={15} />
            {state.phone.unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-blood text-primary-foreground rounded-full text-[0.35rem] font-bold flex items-center justify-center"
              >
                {state.phone.unread}
              </motion.span>
            )}
          </button>
          <div className="text-right relative">
            <div className="text-sm font-bold text-foreground tracking-wide leading-none">
              <AnimatedCounter value={state.money} className={state.lastRewardAmount > 0 ? 'money-earned' : ''} />
            </div>
            <RewardPopup amount={state.lastRewardAmount} />
            {state.dirtyMoney > 0 && (
              <div className="text-[0.5rem] text-dirty font-medium leading-tight">
                💰 €{state.dirtyMoney.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Resource chips — labeled, compact tiles */}
      <div className="flex items-stretch gap-1.5 overflow-x-auto no-scrollbar">
        {/* REP */}
        <ResourceTile label="REP" value={state.rep} color="text-gold" />

        {/* LVL */}
        <div className="relative">
          <ResourceTile label="LVL" value={state.player.level} color="text-gold" />
          {state.player.skillPoints > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gold text-secondary-foreground rounded-full text-[0.35rem] font-bold flex items-center justify-center z-10"
            >
              +{state.player.skillPoints}
            </motion.span>
          )}
        </div>

        {/* AMMO */}
        <ResourceTile
          label="KOGELS"
          value={ammo}
          color={ammo <= 3 ? 'text-blood' : ammo <= 10 ? 'text-gold' : 'text-foreground'}
          icon={<Crosshair size={8} className={ammo <= 3 ? 'text-blood' : 'text-muted-foreground'} />}
          pulse={ammo <= 3}
        />

        {/* HEAT — combined with mini bars */}
        <div className="flex flex-col justify-center bg-muted/20 rounded px-2 py-1 border border-border/50 min-w-[4.5rem]">
          <span className="text-[0.4rem] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">Heat</span>
          <div className="flex items-center gap-1">
            <Car size={7} className={getHeatTextColor(vehicleHeat)} />
            <div className="relative flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-full ${getHeatBarColor(vehicleHeat)}`}
                animate={{ width: `${vehicleHeat}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className={`text-[0.45rem] font-bold tabular-nums ${getHeatTextColor(vehicleHeat)}`}>{vehicleHeat}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Flame size={7} className={getHeatTextColor(personalHeat)} />
            <div className="relative flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-full ${getHeatBarColor(personalHeat)}`}
                animate={{ width: `${personalHeat}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className={`text-[0.45rem] font-bold tabular-nums ${getHeatTextColor(personalHeat)} ${personalHeat > 70 ? 'animate-pulse' : ''}`}>{personalHeat}</span>
          </div>
        </div>

        {/* KARMA */}
        <KarmaChip karma={karma} alignment={karmaAlign} label={karmaLbl} />

        {/* SCHULD — only if > 0 */}
        {state.debt > 0 && (
          <ResourceTile
            label="SCHULD"
            value={`€${(state.debt / 1000).toFixed(0)}k`}
            color={state.debt > 100000 ? 'text-blood' : 'text-muted-foreground'}
            icon={state.debt > 100000 ? <Skull size={8} className="text-blood" /> : undefined}
          />
        )}

        {/* HIDING */}
        {isHiding && (
          <ResourceTile
            label="SCHUIL"
            value={`${state.hidingDays}d`}
            color="text-ice"
            icon={<EyeOff size={8} className="text-ice" />}
          />
        )}
      </div>
    </header>
  );
}

function ResourceTile({ label, value, color, icon, pulse }: {
  label: string;
  value: string | number;
  color: string;
  icon?: React.ReactNode;
  pulse?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center bg-muted/20 rounded px-2 py-1 border border-border/50 min-w-[2.5rem] ${pulse ? 'animate-pulse' : ''}`}>
      <span className="text-[0.4rem] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">{label}</span>
      <div className="flex items-center gap-0.5">
        {icon}
        <span className={`font-bold text-[0.65rem] tabular-nums leading-none ${color}`}>{value}</span>
      </div>
    </div>
  );
}

function KarmaChip({ karma, alignment, label }: {
  karma: number;
  alignment: 'meedogenloos' | 'neutraal' | 'eerbaar';
  label: string;
}) {
  const isMeedogenloos = alignment === 'meedogenloos';
  const isEerbaar = alignment === 'eerbaar';
  const isNeutraal = alignment === 'neutraal';

  const color = isMeedogenloos ? 'text-blood' : isEerbaar ? 'text-gold' : 'text-muted-foreground';
  const Icon = isMeedogenloos ? Zap : isEerbaar ? Shield : null;
  const barPos = Math.round(((karma + 100) / 200) * 100);

  return (
    <div
      className="flex flex-col items-center justify-center bg-muted/20 rounded px-2 py-1 border border-border/50 min-w-[3rem]"
      title={`Karma: ${karma} — ${label}`}
    >
      <span className="text-[0.4rem] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">Karma</span>
      <div className="flex items-center gap-1">
        {Icon && <Icon size={7} className={color} />}
        {isNeutraal && <span className="text-[0.45rem] leading-none">⚖️</span>}
        {/* Mini karma bar */}
        <div className="relative w-6 h-1 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, hsl(0 72% 51% / 0.3), transparent 40%, transparent 60%, hsl(45 93% 47% / 0.3))',
            }}
          />
          <motion.div
            className={`absolute top-0 h-full w-1 rounded-full ${
              isMeedogenloos ? 'bg-blood' : isEerbaar ? 'bg-gold' : 'bg-muted-foreground'
            }`}
            animate={{ left: `${Math.max(0, Math.min(95, barPos) - 5)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      <span className={`font-bold text-[0.4rem] leading-none mt-0.5 ${color}`}>
        {label.length > 6 ? label.slice(0, 5) + '.' : label}
      </span>
    </div>
  );
}
