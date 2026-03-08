import { useGame } from '@/contexts/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { AnimatedCounter } from './animations/AnimatedCounter';
import { useEffect, useRef, useState } from 'react';
import { playCoinSound, playAlarmSound, playNegativeSound, playPositiveSound, isMuted, toggleMute } from '@/game/sounds';
import nightReportBg from '@/assets/night-report-bg.jpg';
import { useDailyDigest } from '@/hooks/useDailyDigest';
import { IncomeSection } from './night-report/IncomeSection';
import { DrugEmpireSection } from './night-report/DrugEmpireSection';
import { EventsSection } from './night-report/EventsSection';
import { DigestSection } from './night-report/DigestSection';
import { AnimatedReportRow } from './night-report/AnimatedReportRow';

export function NightReport({ onClose }: { onClose?: () => void }) {
  const { state, dispatch } = useGame();
  const report = state.nightReport;
  const [muted, setMuted] = useState(isMuted());
  const soundsScheduledFor = useRef<number | null>(null);
  const soundTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { digest, markSeen } = useDailyDigest();

  useEffect(() => {
    if (report) {
      autoDismissRef.current = setTimeout(() => { handleDismiss(); }, 12000);
    }
    return () => { if (autoDismissRef.current) clearTimeout(autoDismissRef.current); };
  }, [report]);

  const handleDismiss = () => {
    if (digest) markSeen();
    dispatch({ type: 'DISMISS_NIGHT_REPORT' });
    onClose?.();
  };

  useEffect(() => {
    return () => soundTimers.current.forEach(clearTimeout);
  }, []);

  if (!report) return null;

  const totalIncome = report.districtIncome + report.businessIncome;
  const totalCosts = report.policeFine;

  // Staggered delay counter
  let d = 0;
  const next = (step = 0.12) => { d += step; return d; };

  const soundEvents: Array<{ delay: number; sound: () => void }> = [];
  const scheduleSound = (delay: number, sound: () => void) => {
    soundEvents.push({ delay, sound });
  };

  // Calculate all delays
  const districtDelay = report.districtIncome > 0 ? next() : d;
  if (report.districtIncome > 0) scheduleSound(districtDelay, playCoinSound);

  const businessDelay = report.businessIncome > 0 ? next() : d;
  if (report.businessIncome > 0) scheduleSound(businessDelay, playCoinSound);

  const washedDelay = report.totalWashed > 0 ? next() : d;
  if (report.totalWashed > 0) scheduleSound(washedDelay, playCoinSound);

  const labDelay = report.labYield > 0 ? next() : d;
  if (report.labYield > 0) scheduleSound(labDelay, playPositiveSound);

  const ammoFactoryDelay = report.ammoFactoryProduction && report.ammoFactoryProduction > 0 ? next() : d;
  if (report.ammoFactoryProduction && report.ammoFactoryProduction > 0) scheduleSound(ammoFactoryDelay, playPositiveSound);

  const villaWietDelay = report.villaWietProduced && report.villaWietProduced > 0 ? next() : d;
  if (report.villaWietProduced && report.villaWietProduced > 0) scheduleSound(villaWietDelay, playPositiveSound);

  const villaCokeDelay = report.villaCokeProduced && report.villaCokeProduced > 0 ? next() : d;
  if (report.villaCokeProduced && report.villaCokeProduced > 0) scheduleSound(villaCokeDelay, playPositiveSound);

  const villaLabDelay = report.villaLabProduced && report.villaLabProduced > 0 ? next() : d;
  if (report.villaLabProduced && report.villaLabProduced > 0) scheduleSound(villaLabDelay, playPositiveSound);

  const drugDealerDelay = report.drugEmpireDealerIncome && report.drugEmpireDealerIncome > 0 ? next() : d;
  if (report.drugEmpireDealerIncome && report.drugEmpireDealerIncome > 0) scheduleSound(drugDealerDelay, playCoinSound);

  const drugNoxDelay = report.drugEmpireNoxCrystal && report.drugEmpireNoxCrystal > 0 ? next() : d;
  if (report.drugEmpireNoxCrystal && report.drugEmpireNoxCrystal > 0) scheduleSound(drugNoxDelay, playPositiveSound);

  const drugRiskDelay = report.drugEmpireRiskEvent ? next(0.2) : d;
  if (report.drugEmpireRiskEvent) scheduleSound(drugRiskDelay, playAlarmSound);

  const heatDelay = next();
  const crewHealDelay = report.crewHealing > 0 ? next() : d;

  const vehicleDelays = report.vehicleDecay.length > 0 ? report.vehicleDecay.map(() => next()) : [];

  const raidDelay = report.policeRaid ? next(0.2) : d;
  if (report.policeRaid) scheduleSound(raidDelay, playAlarmSound);

  const prisonDelay = report.imprisoned ? next(0.3) : d;
  if (report.imprisoned) scheduleSound(prisonDelay, playAlarmSound);

  const prisonStatusDelay = (report.prisonDayServed && !report.imprisoned) ? next(0.15) : d;
  const prisonEventDelay = report.prisonDailyEvent ? next(0.15) : d;
  const prisonDesertedDelay = (report.prisonCrewDeserted && report.prisonCrewDeserted.length > 0) ? next(0.15) : d;
  if (report.prisonCrewDeserted && report.prisonCrewDeserted.length > 0) scheduleSound(prisonDesertedDelay, playNegativeSound);
  const prisonReleasedDelay = report.prisonReleased ? next(0.25) : d;
  if (report.prisonReleased) scheduleSound(prisonReleasedDelay, playCoinSound);

  const smuggleDelays = report.smuggleResults?.map((sr: any) => {
    const sd = next();
    scheduleSound(sd, sr.intercepted ? playNegativeSound : playPositiveSound);
    return sd;
  }) || [];

  const defenseResults = report.defenseResults?.filter((dr: any) => dr.attacked) || [];
  const defenseDelays = defenseResults.map((dr: any) => {
    const dd = next(0.2);
    scheduleSound(dd, dr.won ? playPositiveSound : playNegativeSound);
    return dd;
  });

  const nemesisDelay = report.nemesisAction ? next() : d;
  const villaAttackDelay = report.villaAttack ? next(0.3) : d;
  if (report.villaAttack) scheduleSound(villaAttackDelay, report.villaAttack.won ? playPositiveSound : playAlarmSound);

  const weatherDelay = report.weatherChange ? next() : d;
  const eventDelay = report.randomEvent ? next(0.5) : d;

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
          className="w-full max-w-md game-card border-t-[3px] border-t-gold shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Night skyline banner */}
          <div className="relative h-24 overflow-hidden flex-shrink-0">
            <img src={nightReportBg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
            <motion.div
              className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2"
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
                className="absolute right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={muted ? 'Geluid aan' : 'Geluid uit'}
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </motion.div>
          </div>

          <div className="p-5 overflow-y-auto game-scroll flex-1">
            <div className="space-y-2.5">
              <IncomeSection
                report={report}
                delays={{
                  district: districtDelay,
                  business: businessDelay,
                  washed: washedDelay,
                  lab: labDelay,
                  ammoFactory: ammoFactoryDelay,
                  villaWiet: villaWietDelay,
                  villaCoke: villaCokeDelay,
                  villaLab: villaLabDelay,
                  drugDealer: drugDealerDelay,
                  drugNox: drugNoxDelay,
                }}
              />

              <DrugEmpireSection report={report} drugRiskDelay={drugRiskDelay} />

              <EventsSection
                report={report}
                state={state}
                delays={{
                  heat: heatDelay,
                  crewHeal: crewHealDelay,
                  vehicleDelays,
                  raid: raidDelay,
                  prison: prisonDelay,
                  prisonStatus: prisonStatusDelay,
                  prisonEvent: prisonEventDelay,
                  prisonDeserted: prisonDesertedDelay,
                  prisonReleased: prisonReleasedDelay,
                  smuggleDelays,
                  defenseDelays,
                  nemesis: nemesisDelay,
                  villaAttack: villaAttackDelay,
                  weather: weatherDelay,
                  event: eventDelay,
                }}
                next={next}
              />
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

            {/* Golden Hour */}
            {report.goldenHourStarted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: d + 0.5, type: 'spring', stiffness: 350 }}
                className="border rounded-lg p-3 bg-[hsl(var(--gold)/0.12)] border-gold/50 shadow-[0_0_20px_hsl(var(--gold)/0.1)]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>✨</motion.span>
                  <span className="text-xs font-bold text-gold uppercase tracking-wider">Gouden Uur Begonnen!</span>
                </div>
                <p className="text-[0.55rem] text-muted-foreground">Alle inkomsten x2 voor 3 beurten — maar heat stijgt ook sneller!</p>
              </motion.div>
            )}
            {report.goldenHourEnded && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: d + 0.5, duration: 0.35 }}
                className="flex items-center gap-2 bg-gold/8 border border-gold/20 rounded-lg px-3 py-2"
              >
                <span>🌟</span>
                <span className="text-[0.6rem] text-gold font-bold">Gouden Uur voorbij</span>
                {report.goldenHourBonus && report.goldenHourBonus > 0 && (
                  <span className="text-[0.55rem] text-emerald ml-auto font-bold">+€{report.goldenHourBonus.toLocaleString()} bonus</span>
                )}
              </motion.div>
            )}
            {report.goldenHourBonus && report.goldenHourBonus > 0 && !report.goldenHourEnded && (
              <AnimatedReportRow icon={<Sparkles size={14} />} label="Gouden Uur Bonus" value={report.goldenHourBonus} prefix="€" positive color="text-gold" delay={d + 0.4} />
            )}

            {/* Digest sections */}
            <DigestSection digest={digest} baseDelay={d + 0.5} />

            {/* Local cliffhanger */}
            {report.cliffhanger && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: d + 0.8, duration: 0.6 }}
                className="border rounded-lg p-3 bg-[hsl(var(--game-purple)/0.08)] border-game-purple/30 relative overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">{report.cliffhanger.icon}</span>
                  <span className="text-[0.6rem] font-bold text-game-purple uppercase tracking-widest">Morgen...</span>
                  <motion.span
                    className="text-game-purple/60 text-xs"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >...</motion.span>
                </div>
                <p className="text-[0.55rem] text-muted-foreground italic leading-relaxed">{report.cliffhanger.text}</p>
              </motion.div>
            )}

            {/* Dismiss */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: d + 1.0, duration: 0.3 }}
              onClick={handleDismiss}
              className="w-full mt-5 py-3 rounded bg-gold text-secondary-foreground font-bold text-sm uppercase tracking-wider"
              whileTap={{ scale: 0.97 }}
            >
              DOORGAAN
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
