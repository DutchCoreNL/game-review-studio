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

function getHeatColor(value: number): string {
  if (value > 70) return 'text-blood';
  if (value > 50) return 'text-gold';
  return 'text-muted-foreground';
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
    <header className="flex-none border-b border-border bg-gradient-to-b from-[hsl(0,0%,6%)] to-card px-4 py-2.5">
      {/* Top row: Title + Money */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="font-display text-lg text-blood uppercase tracking-[3px] font-bold blood-text-glow leading-none">
            Noxhaven
          </h1>
          <div className="flex items-center gap-1.5 text-[0.55rem] text-gold uppercase tracking-[0.15em] font-semibold mt-0.5 gold-text-glow">
            <span>{phaseData?.icon || '🔫'}</span>
            <span>{phaseData?.label || rank} — Dag {state.day}</span>
            <span className={`flex items-center gap-0.5 ${WEATHER_COLORS[state.weather]}`} title={weatherDef?.desc}>
              {WEATHER_ICONS[state.weather]}
              <span className="text-[0.45rem]">{weatherDef?.name}</span>
            </span>
            {state.newGamePlusLevel > 0 && (
              <span className="text-game-purple text-[0.45rem] font-bold">NG+{state.newGamePlusLevel}</span>
            )}
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
          <div className="text-right relative">
            <div className="text-sm font-bold text-foreground tracking-wide">
              <AnimatedCounter value={state.money} className={state.lastRewardAmount > 0 ? 'money-earned' : ''} />
            </div>
            <RewardPopup amount={state.lastRewardAmount} />
            {state.dirtyMoney > 0 && (
              <div className="text-[0.55rem] text-dirty font-medium">
                💰 €{state.dirtyMoney.toLocaleString()} zwart
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: compact resource strip */}
      <div className="flex items-center gap-2.5 text-[0.6rem]">
        <ResourceChip label="REP" value={state.rep} color="text-gold" />

        {/* Ammo indicator */}
        <div className="flex items-center gap-1" title={`Munitie: ${state.ammo || 0}/99`}>
          <Crosshair size={9} className={(state.ammo || 0) <= 3 ? 'text-blood' : 'text-muted-foreground'} />
          <span className={`font-bold ${(state.ammo || 0) <= 3 ? 'text-blood animate-pulse' : (state.ammo || 0) <= 10 ? 'text-gold' : 'text-foreground'}`}>
            {state.ammo || 0}
          </span>
        </div>

        {/* Dual Heat Display */}
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground font-bold tracking-wider text-[0.6rem]">HEAT</span>
          <span className={`flex items-center gap-0.5 ${getHeatColor(vehicleHeat)}`} title="Voertuig Heat">
            <Car size={8} />
            <span className="font-bold">{vehicleHeat}%</span>
          </span>
          <span className="text-muted-foreground/40">|</span>
          <span className={`flex items-center gap-0.5 ${getHeatColor(personalHeat)} ${personalHeat > 70 ? 'animate-pulse' : ''}`} title="Persoonlijke Heat">
            <Flame size={8} />
            <span className="font-bold">{personalHeat}%</span>
          </span>
        </div>

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

        {/* Karma indicator */}
        <KarmaChip karma={karma} alignment={karmaAlign} label={karmaLbl} />
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
      <span className="text-muted-foreground font-bold tracking-wider text-[0.6rem]">
        {isNeutraal ? '⚖️' : ''}
      </span>
      {/* Mini karma bar */}
      <div className="relative w-8 h-1.5 rounded-full bg-muted/40 overflow-hidden">
        {/* Gradient background */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, hsl(0 72% 51% / 0.3), transparent 40%, transparent 60%, hsl(45 93% 47% / 0.3))',
          }}
        />
        {/* Indicator dot */}
        <motion.div
          className={`absolute top-0 h-full w-1.5 rounded-full ${
            isMeedogenloos ? 'bg-blood' : isEerbaar ? 'bg-gold' : 'bg-muted-foreground'
          }`}
          style={{ left: `${Math.max(0, Math.min(100, barPos) - 5)}%` }}
          animate={{ left: `${Math.max(0, Math.min(100, barPos) - 5)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className={`font-bold text-[0.5rem] ${color}`}>
        {label.slice(0, 4).toUpperCase()}
      </span>
    </div>
  );
}
