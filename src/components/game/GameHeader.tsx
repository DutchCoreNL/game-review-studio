import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { getRankTitle, getActiveVehicleHeat, getActiveAmmoType } from '@/game/engine';
import { WEATHER_EFFECTS, AMMO_TYPE_LABELS } from '@/game/constants';
import { ENDGAME_PHASES } from '@/game/endgame';
import { WeatherType } from '@/game/types';
import { getKarmaAlignment, getKarmaLabel } from '@/game/karma';
import { AnimatedCounter } from './animations/AnimatedCounter';
import { RewardPopup } from './animations/RewardPopup';
import { ResourceTile } from './header/ResourceTile';
import { HeatTile } from './header/HeatTile';
import { KarmaChip } from './header/KarmaChip';
import { ResourcePopup } from './ResourcePopup';
import { Progress } from '@/components/ui/progress';
import { EnergyNerveBar } from './header/EnergyNerveBar';
import { CooldownTimer } from './header/CooldownTimer';
import { motion } from 'framer-motion';
import { Skull, Sun, CloudRain, CloudFog, Thermometer, CloudLightning, Phone, Crosshair, Sparkles, Heart, MapPin, Swords } from 'lucide-react';
import { WifiPopup } from './header/WifiPopup';
import { useWorldState, TIME_OF_DAY_ICONS, TIME_OF_DAY_LABELS } from '@/hooks/useWorldState';

type PopupType = 'rep' | 'heat' | 'debt' | 'level' | 'ammo' | 'karma' | 'hp' | null;

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
  const worldState = useWorldState();
  const [popup, setPopup] = useState<PopupType>(null);
  const [nextPhaseCountdown, setNextPhaseCountdown] = useState<string>('');
  
  // Countdown to next world phase (from world_state.next_cycle_at)
  useEffect(() => {
    const update = () => {
      if (!worldState.nextCycleAt) { setNextPhaseCountdown('--:--'); return; }
      const diff = new Date(worldState.nextCycleAt).getTime() - Date.now();
      if (diff <= 0) {
        setNextPhaseCountdown('nu');
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setNextPhaseCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [worldState.nextCycleAt]);

  const rank = getRankTitle(state.rep);
  const activeWeather = worldState.loading ? state.weather : worldState.weather;
  const weatherDef = WEATHER_EFFECTS[activeWeather];
  const phaseData = ENDGAME_PHASES.find(p => p.id === state.endgamePhase);
  const vehicleHeat = getActiveVehicleHeat(state);
  const personalHeat = state.personalHeat || 0;
  const isHiding = (state.hidingDays || 0) > 0;
  const karma = state.karma || 0;
  const karmaAlign = getKarmaAlignment(karma);
  const karmaLbl = getKarmaLabel(karma);
  const activeAmmoType = getActiveAmmoType(state);
  const ammoStock = state.ammoStock || { '9mm': state.ammo || 0, '7.62mm': 0, 'shells': 0 };
  const ammo = ammoStock[activeAmmoType] || 0;
  const ammoLabel = AMMO_TYPE_LABELS[activeAmmoType]?.label || 'KOGELS';
  const xpPct = state.player.nextXp > 0 ? (state.player.xp / state.player.nextXp) * 100 : 0;
  const isGoldenHour = !!state.goldenHour;

  return (
    <header className={`flex-none border-b border-border bg-gradient-to-b from-[hsl(0,0%,6%)] to-card px-3 pt-2 pb-2 ${isGoldenHour ? 'ring-1 ring-gold/40 shadow-[0_0_15px_hsl(var(--gold)/0.15)]' : ''}`}>
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
            <span title={TIME_OF_DAY_LABELS[worldState.timeOfDay]}>
              {TIME_OF_DAY_ICONS[worldState.timeOfDay]}
            </span>
            <span>Dag {worldState.loading ? state.day : worldState.worldDay}</span>
            <span className="text-muted-foreground/60 tabular-nums" title={`Volgende fase: ${TIME_OF_DAY_LABELS[worldState.timeOfDay]}`}>⏱{nextPhaseCountdown}</span>
            <span className={`flex items-center gap-0.5 ${WEATHER_COLORS[activeWeather]}`} title={weatherDef?.desc}>
              {WEATHER_ICONS[activeWeather]}
            </span>
            {state.newGamePlusLevel > 0 && (
              <span className="text-game-purple text-[0.45rem] font-bold">NG+{state.newGamePlusLevel}</span>
            )}
            <WifiPopup />
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

      {/* Row 2: Resource chips — grouped with separator */}
      <div className="flex items-stretch gap-1 overflow-x-auto no-scrollbar">
        {/* Player stats group */}
        <ResourceTile label="HP" value={`${state.playerHP}/${state.playerMaxHP}`}
          color={state.playerHP < state.playerMaxHP * 0.3 ? 'text-blood' : state.playerHP < state.playerMaxHP * 0.6 ? 'text-gold' : 'text-emerald'}
          icon={<Heart size={8} className={state.playerHP < state.playerMaxHP * 0.3 ? 'text-blood' : 'text-emerald'} />}
          pulse={state.playerHP < state.playerMaxHP * 0.3}
          tooltip="Jouw gezondheid. Genees bij het ziekenhuis in Crown Heights."
          onTap={() => setPopup('hp')}
        />

        <div className="relative">
          <ResourceTile label="LVL" value={state.player.level} color="text-gold"
            tooltip="Je level stijgt door XP te verdienen." onTap={() => setPopup('level')} />
          <div className="absolute -bottom-0.5 left-1 right-1">
            <Progress value={xpPct} className="h-[2px] bg-muted/30" />
          </div>
          {state.player.skillPoints > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gold text-secondary-foreground rounded-full text-[0.35rem] font-bold flex items-center justify-center z-10">
              +{state.player.skillPoints}
            </motion.span>
          )}
        </div>

        <ResourceTile label="REP" value={state.rep} color="text-gold"
          tooltip="Reputatie bepaalt je rang in de onderwereld." onTap={() => setPopup('rep')} />

        {/* Separator */}
        <div className="w-px bg-border/50 my-1 flex-shrink-0" />

        {/* Risk stats group */}
        <HeatTile vehicleHeat={vehicleHeat} personalHeat={personalHeat} onTap={() => setPopup('heat')} />

        <KarmaChip karma={karma} alignment={karmaAlign} label={karmaLbl} onTap={() => setPopup('karma')} />

        <ResourceTile label={ammoLabel} value={ammo}
          color={ammo <= 3 ? 'text-blood' : ammo <= 10 ? 'text-gold' : 'text-foreground'}
          icon={<Crosshair size={8} className={ammo <= 3 ? 'text-blood' : 'text-muted-foreground'} />}
          pulse={ammo <= 3}
          tooltip={`${ammoLabel} munitie voor je actieve wapen.`}
          onTap={() => setPopup('ammo')}
        />

        {/* Compact conditional tiles */}
        {state.debt > 0 && (
          <ResourceTile
            label={state.debt > 100000 ? '💀' : '€'}
            value={`${(state.debt / 1000).toFixed(0)}k`}
            color={state.debt > 100000 ? 'text-blood' : 'text-muted-foreground'}
            tooltip="Je openstaande schuld."
            onTap={() => setPopup('debt')}
          />
        )}

        {isHiding && (
          <ResourceTile label="" value={`🫥${state.hidingDays}d`} color="text-ice"
            tooltip="Je zit ondergedoken." />
        )}

        {isGoldenHour && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="flex items-center gap-0.5 px-1.5 py-1 rounded bg-gold/15 border border-gold/40 text-gold flex-shrink-0">
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>
              <Sparkles size={8} />
            </motion.div>
            <span className="text-[0.45rem] font-bold">{state.goldenHour!.turnsLeft}</span>
          </motion.div>
        )}
      </div>

      {/* Row 3: Energy & Nerve bars */}
      <EnergyNerveBar />

      {/* Row 4: Active cooldowns */}
      <div className="flex items-center gap-1 mt-1 overflow-x-auto no-scrollbar">
        <CooldownTimer label="Reis" until={state.travelCooldownUntil} icon={<MapPin size={7} />} />
        <CooldownTimer label="Crime" until={state.crimeCooldownUntil} icon={<Crosshair size={7} />} />
        <CooldownTimer label="Aanval" until={state.attackCooldownUntil} icon={<Swords size={7} />} />
        <CooldownTimer label="Heist" until={state.heistCooldownUntil} icon={<Crosshair size={7} />} />
      </div>

      {/* Resource detail popup */}
      <ResourcePopup type={popup} onClose={() => setPopup(null)} />
    </header>
  );
}
