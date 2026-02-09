import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { getRankTitle, getActiveVehicleHeat } from '@/game/engine';
import { WEATHER_EFFECTS } from '@/game/constants';
import { ENDGAME_PHASES } from '@/game/endgame';
import { WeatherType } from '@/game/types';
import { getKarmaAlignment, getKarmaLabel } from '@/game/karma';
import { AnimatedCounter } from './animations/AnimatedCounter';
import { RewardPopup } from './animations/RewardPopup';
import { ResourceTile } from './header/ResourceTile';
import { HeatTile } from './header/HeatTile';
import { KarmaChip } from './header/KarmaChip';
import { ResourcePopup } from './ResourcePopup';
import { motion } from 'framer-motion';
import { Skull, Sun, CloudRain, CloudFog, Thermometer, CloudLightning, Phone, EyeOff, Crosshair } from 'lucide-react';

type PopupType = 'rep' | 'heat' | 'debt' | 'level' | null;

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

export function GameHeader() {
  const { state, dispatch } = useGame();
  const [popup, setPopup] = useState<PopupType>(null);
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
        <ResourceTile
          label="REP"
          value={state.rep}
          color="text-gold"
          tooltip="Reputatie bepaalt je rang in de onderwereld."
          onTap={() => setPopup('rep')}
        />

        <div className="relative">
          <ResourceTile
            label="LVL"
            value={state.player.level}
            color="text-gold"
            tooltip="Je level stijgt door XP te verdienen."
            onTap={() => setPopup('level')}
          />
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

        <ResourceTile
          label="KOGELS"
          value={ammo}
          color={ammo <= 3 ? 'text-blood' : ammo <= 10 ? 'text-gold' : 'text-foreground'}
          icon={<Crosshair size={8} className={ammo <= 3 ? 'text-blood' : 'text-muted-foreground'} />}
          pulse={ammo <= 3}
          tooltip="Kogels zijn nodig voor gevechten en huurmoorden. Koop ze in de markt, sloop auto's in de crusher, of bouw een Kogelfabriek."
        />

        <HeatTile vehicleHeat={vehicleHeat} personalHeat={personalHeat} onTap={() => setPopup('heat')} />

        <KarmaChip karma={karma} alignment={karmaAlign} label={karmaLbl} />

        {state.debt > 0 && (
          <ResourceTile
            label="SCHULD"
            value={`€${(state.debt / 1000).toFixed(0)}k`}
            color={state.debt > 100000 ? 'text-blood' : 'text-muted-foreground'}
            icon={state.debt > 100000 ? <Skull size={8} className="text-blood" /> : undefined}
            tooltip="Je openstaande schuld."
            onTap={() => setPopup('debt')}
          />
        )}

        {isHiding && (
          <ResourceTile
            label="SCHUIL"
            value={`${state.hidingDays}d`}
            color="text-ice"
            icon={<EyeOff size={8} className="text-ice" />}
            tooltip="Je zit ondergedoken. Tijdens het schuilen daalt je heat, maar je kunt geen operaties uitvoeren."
          />
        )}
      </div>

      {/* Resource detail popup */}
      <ResourcePopup type={popup} onClose={() => setPopup(null)} />
    </header>
  );
}
