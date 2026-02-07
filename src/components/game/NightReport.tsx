import { useGame } from '@/contexts/GameContext';
import { VEHICLES, DISTRICTS, GOODS, WEATHER_EFFECTS } from '@/game/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, TrendingUp, TrendingDown, Factory, Shield, Flame, Car, Sparkles, Heart, Route, Skull, CloudRain, Sun, CloudFog, Thermometer, CloudLightning, Volume2, VolumeX } from 'lucide-react';
import { AnimatedReportRow } from './night-report/AnimatedReportRow';
import { AnimatedResourceBar } from './night-report/AnimatedResourceBar';
import { DramaticEventReveal } from './night-report/DramaticEventReveal';
import { AnimatedCounter } from './animations/AnimatedCounter';
import { useEffect, useRef, useState } from 'react';
import { playCoinSound, playAlarmSound, playNegativeSound, playPositiveSound, isMuted, toggleMute } from '@/game/sounds';

export function NightReport() {
  const { state, dispatch } = useGame();
  const report = state.nightReport;
  const [muted, setMuted] = useState(isMuted());
  const soundsScheduledFor = useRef<number | null>(null);
  const soundTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup sound timers on unmount
  useEffect(() => {
    return () => soundTimers.current.forEach(clearTimeout);
  }, []);

  if (!report) return null;

  const totalIncome = report.districtIncome + report.businessIncome;
  const totalCosts = report.debtInterest + report.policeFine;

  // Staggered delay counter
  let d = 0;
  const next = (step = 0.12) => { d += step; return d; };

  // Schedule sounds once per report, synced with animation delays
  const soundEvents: Array<{ delay: number; sound: () => void }> = [];
  const scheduleSound = (delay: number, sound: () => void) => {
    soundEvents.push({ delay, sound });
  };

  // Income rows
  const districtDelay = report.districtIncome > 0 ? next() : d;
  if (report.districtIncome > 0) scheduleSound(districtDelay, playCoinSound);

  const businessDelay = report.businessIncome > 0 ? next() : d;
  if (report.businessIncome > 0) scheduleSound(businessDelay, playCoinSound);

  const washedDelay = report.totalWashed > 0 ? next() : d;
  if (report.totalWashed > 0) scheduleSound(washedDelay, playCoinSound);

  const labDelay = report.labYield > 0 ? next() : d;
  if (report.labYield > 0) scheduleSound(labDelay, playPositiveSound);

  // Costs
  const debtDelay = report.debtInterest > 0 ? next() : d;
  if (report.debtInterest > 0) scheduleSound(debtDelay, playNegativeSound);

  // Heat & crew healing bars
  const heatDelay = next();
  const crewHealDelay = report.crewHealing > 0 ? next() : d;

  // Vehicle decay
  const vehicleDelays = report.vehicleDecay.length > 0
    ? report.vehicleDecay.map(() => next())
    : [];

  // Police raid
  const raidDelay = report.policeRaid ? next(0.2) : d;
  if (report.policeRaid) scheduleSound(raidDelay, playAlarmSound);

  // Smuggle results
  const smuggleDelays = report.smuggleResults?.map((sr) => {
    const sd = next();
    scheduleSound(sd, sr.intercepted ? playNegativeSound : playPositiveSound);
    return sd;
  }) || [];

  // Defense results
  const defenseResults = report.defenseResults?.filter(dr => dr.attacked) || [];
  const defenseDelays = defenseResults.map((dr) => {
    const dd = next(0.2);
    scheduleSound(dd, dr.won ? playPositiveSound : playNegativeSound);
    return dd;
  });

  // Nemesis
  const nemesisDelay = report.nemesisAction ? next() : d;

  // Weather
  const weatherDelay = report.weatherChange ? next() : d;

  // Random event (dramatic sound handled in DramaticEventReveal)
  const eventDelay = report.randomEvent ? next(0.5) : d;

  // Net income sound
  const netDelay = d + 0.4;
  if (totalIncome > 0 || totalCosts > 0) {
    scheduleSound(netDelay, totalIncome - totalCosts >= 0 ? playCoinSound : playNegativeSound);
  }

  // Fire sound timers once per report day
  if (soundsScheduledFor.current !== report.day) {
    soundsScheduledFor.current = report.day;
    soundTimers.current.forEach(clearTimeout);
    soundTimers.current = soundEvents.map(({ delay, sound }) =>
      setTimeout(() => sound(), delay * 1000)
    );
  }

  const handleToggleMute = () => {
    toggleMute();
    setMuted(isMuted());
  };

  return (
    <AnimatePresence>
      <motion.div
        key="night-report-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/90 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full max-w-md game-card border-t-[3px] border-t-gold p-5 shadow-2xl max-h-[85vh] overflow-y-auto game-scroll"
        >
          {/* Header */}
          <motion.div
            className="flex items-center justify-center gap-2 mb-4 relative"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Moon size={20} className="text-gold" />
            <h2 className="font-display text-lg text-gold uppercase tracking-widest gold-text-glow">
              Nacht {report.day}
            </h2>
            <button
              onClick={handleToggleMute}
              className="absolute right-0 top-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={muted ? 'Geluid aan' : 'Geluid uit'}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </motion.div>

          <div className="space-y-2.5">
            {/* Income rows */}
            {report.districtIncome > 0 && (
              <AnimatedReportRow icon={<TrendingUp size={14} />} label="District Inkomen" value={report.districtIncome} prefix="€" positive color="text-emerald" delay={districtDelay} />
            )}
            {report.businessIncome > 0 && (
              <AnimatedReportRow icon={<Factory size={14} />} label="Bedrijf Inkomen" value={report.businessIncome} prefix="€" positive color="text-emerald" delay={businessDelay} />
            )}
            {report.totalWashed > 0 && (
              <AnimatedReportRow icon={<Sparkles size={14} />} label="Witgewassen" value={report.totalWashed} prefix="€" color="text-gold" delay={washedDelay} />
            )}
            {report.labYield > 0 && (
              <AnimatedReportRow icon={<Factory size={14} />} label="Lab Productie" value={report.labYield} prefix="" suffix=" Synthetica" positive color="text-game-purple" delay={labDelay} />
            )}

            {/* Costs */}
            {report.debtInterest > 0 && (
              <AnimatedReportRow icon={<TrendingDown size={14} />} label="Schuld Rente" value={report.debtInterest} prefix="€" positive color="text-blood" delay={debtDelay} />
            )}

            {/* Heat bar */}
            <AnimatedResourceBar
              icon={<Flame size={14} />}
              label={`Heat ${report.heatChange >= 0 ? '+' : ''}${report.heatChange}%`}
              value={Math.min(100, Math.max(0, (state.heat || 0)))}
              max={100}
              color={report.heatChange > 0 ? 'blood' : 'emerald'}
              delay={heatDelay}
            />

            {/* Crew healing */}
            {report.crewHealing > 0 && (
              <AnimatedResourceBar icon={<Heart size={14} />} label={`Crew Herstel +${report.crewHealing} HP`} value={report.crewHealing} max={Math.max(report.crewHealing, 30)} color="emerald" delay={crewHealDelay} />
            )}

            {/* Vehicle decay */}
            {report.vehicleDecay.length > 0 && report.vehicleDecay.map((v, i) => {
              const vDef = VEHICLES.find(ve => ve.id === v.id);
              return (
                <AnimatedReportRow key={v.id} icon={<Car size={14} />} label={`${vDef?.name || v.id} Slijtage`} value={v.amount} prefix="" suffix="%" positive={false} color="text-muted-foreground" delay={vehicleDelays[i]} />
              );
            })}

            {/* Police raid */}
            {report.policeRaid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: raidDelay, type: 'spring', stiffness: 400 }}
                className="bg-[hsl(var(--blood)/0.1)] border border-blood rounded-lg p-3 flex items-center gap-2 glow-blood"
              >
                <Shield size={16} className="text-blood flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blood">POLITIE INVAL!</p>
                  <p className="text-[0.6rem] text-muted-foreground">
                    Boete: €<AnimatedCounter value={report.policeFine} prefix="" duration={1000} />
                  </p>
                </div>
              </motion.div>
            )}

            {/* Smuggle route results */}
            {report.smuggleResults && report.smuggleResults.length > 0 && report.smuggleResults.map((sr, i) => {
              const goodName = GOODS.find(g => g.id === sr.good)?.name || sr.good;
              return (
                <AnimatedReportRow key={`sr-${i}`} icon={<Route size={14} />} label={sr.intercepted ? `Route onderschept! (${goodName})` : `Smokkel: ${goodName}`} value={Math.abs(sr.income)} prefix="€" positive={!sr.intercepted} color={sr.intercepted ? 'text-blood' : 'text-emerald'} delay={smuggleDelays[i]} />
              );
            })}

            {/* Defense results */}
            {defenseResults.map((dr, i) => (
              <motion.div
                key={`dr-${i}`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: defenseDelays[i], type: 'spring', stiffness: 350 }}
                className={`border rounded-lg p-3 flex items-center gap-2 ${
                  dr.won ? 'bg-[hsl(var(--gold)/0.08)] border-gold glow-gold' : 'bg-[hsl(var(--blood)/0.08)] border-blood glow-blood'
                }`}
              >
                <Shield size={16} className={dr.won ? 'text-gold' : 'text-blood'} />
                <div>
                  <p className={`text-xs font-bold ${dr.won ? 'text-gold' : 'text-blood'}`}>
                    {dr.won ? 'AANVAL AFGESLAGEN!' : 'DISTRICT VERLOREN!'}
                  </p>
                  <p className="text-[0.6rem] text-muted-foreground">{dr.details}</p>
                </div>
              </motion.div>
            ))}

            {/* Nemesis action */}
            {report.nemesisAction && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: nemesisDelay, duration: 0.35 }} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Skull size={14} />
                  <span>Nemesis</span>
                </div>
                <span className="text-xs font-bold text-blood">{report.nemesisAction}</span>
              </motion.div>
            )}

            {/* Weather change */}
            {report.weatherChange && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: weatherDelay, duration: 0.35 }} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {report.weatherChange === 'rain' ? <CloudRain size={14} /> : report.weatherChange === 'fog' ? <CloudFog size={14} /> : report.weatherChange === 'heatwave' ? <Thermometer size={14} /> : report.weatherChange === 'storm' ? <CloudLightning size={14} /> : <Sun size={14} />}
                  <span>Weer morgen</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground">
                  {WEATHER_EFFECTS[report.weatherChange]?.name || 'Helder'}
                </span>
              </motion.div>
            )}

            {/* Random event - DRAMATIC REVEAL */}
            {report.randomEvent && (
              <DramaticEventReveal event={report.randomEvent} delay={eventDelay} />
            )}
          </div>

          {/* Animated Summary */}
          {(totalIncome > 0 || totalCosts > 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: netDelay, duration: 0.5 }}
              className="mt-4 pt-3 border-t border-border"
            >
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Netto inkomen:</span>
                <span className={`font-bold money-earned ${totalIncome - totalCosts >= 0 ? 'text-emerald' : 'text-blood'}`}>
                  {totalIncome - totalCosts >= 0 ? '+' : '-'}€
                  <AnimatedCounter value={Math.abs(totalIncome - totalCosts)} duration={1200} prefix="" />
                </span>
              </div>
            </motion.div>
          )}

          {/* Dismiss */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: d + 0.7, duration: 0.3 }}
            onClick={() => dispatch({ type: 'DISMISS_NIGHT_REPORT' })}
            className="w-full mt-5 py-3 rounded bg-gold text-secondary-foreground font-bold text-sm uppercase tracking-wider"
            whileTap={{ scale: 0.97 }}
          >
            DOORGAAN
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
