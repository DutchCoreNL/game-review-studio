import { useGame } from '@/contexts/GameContext';
import { getRankTitle, getActiveVehicleHeat } from '@/game/engine';
import { WEATHER_EFFECTS } from '@/game/constants';
import { ENDGAME_PHASES } from '@/game/endgame';
import { WeatherType } from '@/game/types';
import { getKarmaAlignment, getKarmaLabel } from '@/game/karma';
import { AnimatedCounter } from './animations/AnimatedCounter';
import { RewardPopup } from './animations/RewardPopup';
import { motion } from 'framer-motion';
import { Flame, Skull, Sun, CloudRain, CloudFog, Thermometer, CloudLightning, Phone, Car, EyeOff, Shield, Zap, Crosshair, Star, TrendingUp } from 'lucide-react';

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

function getHeatColor(value: number): string {
  if (value > 70) return 'text-blood';
  if (value > 50) return 'text-gold';
  return 'text-emerald';
}

function HeatMiniBar({ value, icon }: { value: number; icon: React.ReactNode }) {
  const color = value > 70 ? 'bg-blood' : value > 50 ? 'bg-gold' : 'bg-emerald';
  return (
    <div className="flex items-center gap-1 min-w-0">
      <span className={getHeatColor(value)}>{icon}</span>
      <div className="relative w-10 h-1 rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className={`font-bold text-[0.5rem] tabular-nums ${getHeatColor(value)} ${value > 70 ? 'animate-pulse' : ''}`}>
        {value}
      </span>
    </div>
  );
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

  return (
    <header className="flex-none border-b border-border bg-gradient-to-b from-[hsl(0,0%,6%)] to-card px-3 pt-2 pb-1.5">
      {/* Top row: Title + Day/Weather + Money */}
      <div className="flex justify-between items-start mb-1.5">
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
          {/* Phone button */}
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

      {/* Resource strip: 2-row grid for clarity */}
      <div className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-3 gap-y-0.5 text-[0.55rem]">
        {/* Row 1: REP, LVL, Heat bars, Ammo */}
        <div className="flex items-center gap-1" title={`Reputatie: ${state.rep}`}>
          <TrendingUp size={9} className="text-gold" />
          <span className="font-bold text-gold tabular-nums">{state.rep}</span>
        </div>

        <div className="flex items-center gap-1 relative" title={`Level ${state.player.level}`}>
          <Star size={9} className="text-gold" />
          <span className="font-bold text-gold tabular-nums">{state.player.level}</span>
          {state.player.skillPoints > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-2.5 w-3 h-3 bg-gold text-secondary-foreground rounded-full text-[0.35rem] font-bold flex items-center justify-center"
            >
              {state.player.skillPoints}
            </motion.span>
          )}
        </div>

        {/* Heat bars grouped */}
        <div className="flex items-center gap-2 justify-center">
          <HeatMiniBar value={vehicleHeat} icon={<Car size={8} />} />
          <HeatMiniBar value={personalHeat} icon={<Flame size={8} />} />
        </div>

        {/* Ammo */}
        <div className="flex items-center gap-1 justify-end" title={`Munitie: ${state.ammo || 0}/99`}>
          <Crosshair size={9} className={(state.ammo || 0) <= 3 ? 'text-blood' : 'text-muted-foreground'} />
          <span className={`font-bold tabular-nums ${(state.ammo || 0) <= 3 ? 'text-blood animate-pulse' : (state.ammo || 0) <= 10 ? 'text-gold' : 'text-foreground'}`}>
            {state.ammo || 0}
          </span>
        </div>

        {/* Row 2: Karma, Hiding, Debt — only shown when relevant */}
        <div className="col-span-4 flex items-center gap-3 mt-0.5">
          {/* Karma mini */}
          <KarmaChip karma={karma} alignment={karmaAlign} label={karmaLbl} />

          {/* Hiding indicator */}
          {isHiding && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-0.5 text-ice"
              title={`Ondergedoken: ${state.hidingDays} dag(en)`}
            >
              <EyeOff size={9} />
              <span className="font-bold text-[0.5rem]">{state.hidingDays}d</span>
            </motion.div>
          )}

          {/* Debt — only show if > 0 */}
          {state.debt > 0 && (
            <div className="flex items-center gap-0.5" title={`Schuld: €${state.debt.toLocaleString()}`}>
              {state.debt > 100000 && <Skull size={8} className="text-blood" />}
              <span className="text-muted-foreground font-bold tracking-wider">SCHULD</span>
              <span className={`font-bold tabular-nums ${state.debt > 100000 ? 'text-blood' : 'text-muted-foreground'}`}>
                €{(state.debt / 1000).toFixed(0)}k
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
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

  // Normalized position for the tiny bar (0 = left/meedogenloos, 100 = right/eerbaar)
  const barPos = Math.round(((karma + 100) / 200) * 100);

  return (
    <div className="flex items-center gap-1" title={`Karma: ${karma} — ${label}`}>
      {Icon && <Icon size={8} className={color} />}
      {isNeutraal && <span className="text-[0.5rem]">⚖️</span>}
      {/* Mini karma bar */}
      <div className="relative w-7 h-1 rounded-full bg-muted/40 overflow-hidden">
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
          style={{ left: `${Math.max(0, Math.min(100, barPos) - 5)}%` }}
          animate={{ left: `${Math.max(0, Math.min(100, barPos) - 5)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className={`font-bold text-[0.45rem] ${color}`}>
        {label.slice(0, 4).toUpperCase()}
      </span>
    </div>
  );
}
