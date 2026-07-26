import { useState, useEffect, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getRankTitle, getActiveVehicleHeat, getActiveAmmoType } from '@/game/engine';
import { WEATHER_EFFECTS, AMMO_TYPE_LABELS } from '@/game/constants';
import { ENDGAME_PHASES } from '@/game/endgame';
import { WeatherType } from '@/game/types';
import { ActiveWeekEvent } from '@/game/weekEvents';
import { getKarmaAlignment, getKarmaLabel } from '@/game/karma';
import { AnimatedCounter } from './animations/AnimatedCounter';
import { RewardPopup } from './animations/RewardPopup';
import { ResourceTile } from './header/ResourceTile';
import { tapPower, stashCapacity } from '@/game/score';
import { dailyHeatDelta, heatBand } from '@/game/heat';
import { HeatTile } from './header/HeatTile';
import { KarmaChip } from './header/KarmaChip';
import { ResourcePopup } from './ResourcePopup';
import { Progress } from '@/components/ui/progress';
import { EnergyNerveBar } from './header/EnergyNerveBar';
import { CooldownTimer } from './header/CooldownTimer';
import { motion } from 'framer-motion';
import { Skull, Sun, CloudRain, CloudFog, Thermometer, CloudLightning, Phone, Crosshair, Sparkles, Heart, MapPin, Swords, Clock, Menu } from 'lucide-react';
import { WifiPopup } from './header/WifiPopup';
import { formatGameDate } from '@/lib/gameDate';
import { useWorldState, TIME_OF_DAY_ICONS, TIME_OF_DAY_LABELS } from '@/hooks/useWorldState';

type PopupType = 'rep' | 'heat' | 'level' | null;

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

interface GameHeaderProps {
  onMenuOpen?: () => void;
}

export function GameHeader({ onMenuOpen }: GameHeaderProps) {
  const { state, dispatch } = useGame();
  const { t } = useLanguage();
  const worldState = useWorldState();
  const [popup, setPopup] = useState<PopupType>(null);
  const [nextPhaseCountdown, setNextPhaseCountdown] = useState<string>('');
  
  // Countdown to next world phase (real-time: 6h phases)
  useEffect(() => {
    const update = () => {
      if (!worldState.nextCycleAt) { setNextPhaseCountdown('--:--'); return; }
      const diff = new Date(worldState.nextCycleAt).getTime() - Date.now();
      if (diff <= 0) {
        setNextPhaseCountdown(t.header.now);
      } else {
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        if (hours > 0) {
          setNextPhaseCountdown(`${hours}h ${mins}m`);
        } else {
          const secs = Math.floor((diff % 60000) / 1000);
          setNextPhaseCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
        }
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
  const stashUsed = Object.values(state.inventory || {}).reduce((a: number, b) => a + (Number(b) || 0), 0);
  const heatDelta = dailyHeatDelta(state);
  const heatBandLabel = heatBand(personalHeat).label;
  const isGoldenHour = !!state.goldenHour;

  // Week event with XP bonus detection
  const weekEvent = (state as any).activeWeekEvent as ActiveWeekEvent | null;
  const hasActiveEvent = weekEvent && weekEvent.daysLeft > 0;

  // Determine banner color based on event type
  const eventBannerStyle = useMemo(() => {
    if (!hasActiveEvent) return null;
    const hasHeatFreeze = weekEvent.effects.some(e => e.type === 'heat_freeze');
    const hasCombat = weekEvent.effects.some(e => e.type === 'combat_bonus');
    const hasTrade = weekEvent.effects.some(e => e.type === 'trade_bonus' && e.value >= 50);
    if (hasHeatFreeze) return { bg: 'from-ice/20 via-ice/10 to-ice/20', border: 'border-ice/30', text: 'text-ice' };
    if (hasCombat) return { bg: 'from-blood/20 via-blood/10 to-blood/20', border: 'border-blood/30', text: 'text-blood' };
    if (hasTrade) return { bg: 'from-emerald/20 via-emerald/10 to-emerald/20', border: 'border-emerald/30', text: 'text-emerald' };
    return { bg: 'from-gold/20 via-gold/10 to-gold/20', border: 'border-gold/30', text: 'text-gold' };
  }, [hasActiveEvent, weekEvent]);

  return (
    <header className={`flex-none border-b border-border bg-gradient-to-b from-[hsl(0,0%,6%)] to-card px-3 pt-2 pb-2 ${isGoldenHour ? 'ring-1 ring-gold/40 shadow-[0_0_15px_hsl(var(--gold)/0.15)]' : ''}`}>
      {/* Week Event XP Banner */}
      {hasActiveEvent && eventBannerStyle && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-between -mx-3 -mt-2 mb-2 px-3 py-1.5 bg-gradient-to-r ${eventBannerStyle.bg} border-b ${eventBannerStyle.border}`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm">{weekEvent!.icon}</span>
            <span className={`text-[0.55rem] font-bold ${eventBannerStyle.text} uppercase tracking-wider truncate`}>{weekEvent!.name}</span>
            <Sparkles size={10} className={`${eventBannerStyle.text} flex-shrink-0`} />
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Clock size={9} className={`${eventBannerStyle.text} opacity-70`} />
            <span className={`text-[0.5rem] font-bold ${eventBannerStyle.text} tabular-nums`}>{weekEvent!.daysLeft}d over</span>
          </div>
        </motion.div>
      )}
      {/* Row 1: Title + Money */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-2 min-w-0">
          {onMenuOpen && (
            <button onClick={onMenuOpen} className="mt-0.5 text-muted-foreground hover:text-gold transition-colors lg:hidden flex-shrink-0">
              <Menu size={18} />
            </button>
          )}
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
            <span>📅 {formatGameDate()}</span>
            <span className="text-muted-foreground/60 tabular-nums" title={`${t.header.nextPhase}: ${TIME_OF_DAY_LABELS[worldState.timeOfDay]}`}>⏱{nextPhaseCountdown}</span>
            <span className={`flex items-center gap-0.5 ${WEATHER_COLORS[activeWeather]}`} title={weatherDef?.desc}>
              {WEATHER_ICONS[activeWeather]}
            </span>
            {state.newGamePlusLevel > 0 && (
              <span className="text-game-purple text-[0.45rem] font-bold">NG+{state.newGamePlusLevel}</span>
            )}
          </div>
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

      {/* Row 2: the five numbers this game is actually played on.
          HP / karma / ammo / energy / nerve and the travel-crime-attack-heist
          cooldowns belonged to the retired RPG systems and only added noise. */}
      <div className="flex items-stretch gap-1 overflow-x-auto no-scrollbar">
        {/* Level — drives how much every tap is worth */}
        <div className="relative">
          <ResourceTile label="LVL" value={state.player.level} color="text-gold"
            tooltip={`Elk level maakt je tik krachtiger. Nu +${tapPower(state)} per tik.`}
            onTap={() => setPopup('level')} />
          <div className="absolute -bottom-0.5 left-1 right-1">
            <Progress value={xpPct} className="h-[2px] bg-muted/30" />
          </div>
        </div>

        {/* Respect — gates rackets and equipment */}
        <ResourceTile label="AANZIEN" value={state.org?.respect ?? 0} color="text-gold"
          tooltip="Aanzien ontgrendelt rijkere rackets en betere uitrusting." />

        <div className="w-px bg-border/50 my-1 flex-shrink-0" />

        {/* Heat — the pressure you manage */}
        <HeatTile personalHeat={personalHeat} dailyDelta={heatDelta} bandLabel={heatBandLabel} onTap={() => setPopup('heat')} />

        {/* Dirty money — your cue to launder */}
        <ResourceTile label="ZWART" value={`€${Math.round(state.dirtyMoney || 0).toLocaleString()}`}
          color={(state.dirtyMoney || 0) > 0 ? 'text-dirty' : 'text-muted-foreground'}
          tooltip="Zwart geld moet je witwassen voordat je het kunt uitgeven." />

        {/* Stash — your cue to sell */}
        <ResourceTile label="VOORRAAD" value={`${stashUsed}/${stashCapacity(state)}`}
          color={stashUsed >= stashCapacity(state) ? 'text-blood' : stashUsed > stashCapacity(state) * 0.75 ? 'text-gold' : 'text-emerald'}
          pulse={stashUsed >= stashCapacity(state)}
          tooltip="Volle voorraad? Dan wordt nieuwe buit meteen doorverkocht." />

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

      {/* Resource detail popup */}
      <ResourcePopup type={popup} onClose={() => setPopup(null)} />
    </header>
  );
}
