import { useGame } from '@/contexts/GameContext';
import { VEHICLES, DISTRICTS, GOODS, WEATHER_EFFECTS, AMMO_TYPE_LABELS } from '@/game/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, TrendingUp, TrendingDown, Factory, Shield, Flame, Car, Sparkles, Heart, Route, Skull, CloudRain, Sun, CloudFog, Thermometer, CloudLightning, Volume2, VolumeX, Crosshair, Lock, Leaf, Diamond, FlaskConical, UserMinus, Swords, BellRing, AlertTriangle, Gavel, Handshake, Star, Target, BarChart3, Truck, Gem, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { VillaAttackPopup } from './villa/VillaAttackPopup';
import { AnimatedReportRow } from './night-report/AnimatedReportRow';
import { AnimatedResourceBar } from './night-report/AnimatedResourceBar';
import { DramaticEventReveal } from './night-report/DramaticEventReveal';
import { AnimatedCounter } from './animations/AnimatedCounter';
import { useEffect, useRef, useState } from 'react';
import { playCoinSound, playAlarmSound, playNegativeSound, playPositiveSound, isMuted, toggleMute } from '@/game/sounds';
import nightReportBg from '@/assets/night-report-bg.jpg';
import { DRUG_EMPIRE_IMAGES, MARKET_EVENT_IMAGES } from '@/assets/items/index';
import overlayPrison from '@/assets/items/overlay-prison.jpg';

export function NightReport() {
  const { state, dispatch } = useGame();
  const report = state.nightReport;
  const [muted, setMuted] = useState(isMuted());
  const soundsScheduledFor = useRef<number | null>(null);
  const soundTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss after 10 seconds (MMO realtime — no blocking)
  useEffect(() => {
    if (report) {
      autoDismissRef.current = setTimeout(() => {
        dispatch({ type: 'DISMISS_NIGHT_REPORT' });
      }, 10000);
    }
    return () => { if (autoDismissRef.current) clearTimeout(autoDismissRef.current); };
  }, [report, dispatch]);

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

  // Ammo factory
  const ammoFactoryDelay = report.ammoFactoryProduction && report.ammoFactoryProduction > 0 ? next() : d;
  if (report.ammoFactoryProduction && report.ammoFactoryProduction > 0) scheduleSound(ammoFactoryDelay, playPositiveSound);

  // Villa production
  const villaWietDelay = report.villaWietProduced && report.villaWietProduced > 0 ? next() : d;
  if (report.villaWietProduced && report.villaWietProduced > 0) scheduleSound(villaWietDelay, playPositiveSound);

  const villaCokeDelay = report.villaCokeProduced && report.villaCokeProduced > 0 ? next() : d;
  if (report.villaCokeProduced && report.villaCokeProduced > 0) scheduleSound(villaCokeDelay, playPositiveSound);

  const villaLabDelay = report.villaLabProduced && report.villaLabProduced > 0 ? next() : d;
   if (report.villaLabProduced && report.villaLabProduced > 0) scheduleSound(villaLabDelay, playPositiveSound);

  // Drug Empire dealer income
  const drugDealerDelay = report.drugEmpireDealerIncome && report.drugEmpireDealerIncome > 0 ? next() : d;
  if (report.drugEmpireDealerIncome && report.drugEmpireDealerIncome > 0) scheduleSound(drugDealerDelay, playCoinSound);

  // Drug Empire NoxCrystal
  const drugNoxDelay = report.drugEmpireNoxCrystal && report.drugEmpireNoxCrystal > 0 ? next() : d;
  if (report.drugEmpireNoxCrystal && report.drugEmpireNoxCrystal > 0) scheduleSound(drugNoxDelay, playPositiveSound);

  // Drug Empire risk event
  const drugRiskDelay = report.drugEmpireRiskEvent ? next(0.2) : d;
  if (report.drugEmpireRiskEvent) scheduleSound(drugRiskDelay, playAlarmSound);

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

  // Prison arrest (after raid)
  const prisonDelay = report.imprisoned ? next(0.3) : d;
  if (report.imprisoned) scheduleSound(prisonDelay, playAlarmSound);

  // Prison daily status (when already in prison, not new arrest)
  const prisonStatusDelay = (report.prisonDayServed && !report.imprisoned) ? next(0.15) : d;
  const prisonEventDelay = report.prisonDailyEvent ? next(0.15) : d;
  const prisonDesertedDelay = (report.prisonCrewDeserted && report.prisonCrewDeserted.length > 0) ? next(0.15) : d;
  if (report.prisonCrewDeserted && report.prisonCrewDeserted.length > 0) scheduleSound(prisonDesertedDelay, playNegativeSound);
  const prisonReleasedDelay = report.prisonReleased ? next(0.25) : d;
  if (report.prisonReleased) scheduleSound(prisonReleasedDelay, playCoinSound);

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

  // Villa attack
  const villaAttackDelay = report.villaAttack ? next(0.3) : d;
  if (report.villaAttack) scheduleSound(villaAttackDelay, report.villaAttack.won ? playPositiveSound : playAlarmSound);

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

            {/* Ammo factory production */}
            {report.ammoFactoryProduction && report.ammoFactoryProduction > 0 && (
              <AnimatedReportRow icon={<Crosshair size={14} />} label={`Kogelfabriek (${report.ammoFactoryType ? AMMO_TYPE_LABELS[report.ammoFactoryType]?.label : 'kogels'})`} value={report.ammoFactoryProduction} prefix="+" suffix={` ${report.ammoFactoryType ? AMMO_TYPE_LABELS[report.ammoFactoryType]?.label : 'kogels'}`} positive color="text-blood" delay={ammoFactoryDelay} />
            )}

            {/* Villa production */}
            {report.villaWietProduced && report.villaWietProduced > 0 && (
              <AnimatedReportRow icon={<Leaf size={14} />} label="Wietplantage" value={report.villaWietProduced} prefix="+" suffix=" drugs" positive color="text-emerald" delay={villaWietDelay} />
            )}
            {report.villaCokeProduced && report.villaCokeProduced > 0 && (
              <AnimatedReportRow icon={<Diamond size={14} />} label="Coke Lab" value={report.villaCokeProduced} prefix="+" suffix=" Puur Wit" positive color="text-game-purple" delay={villaCokeDelay} />
            )}
            {report.villaLabProduced && report.villaLabProduced > 0 && (
              <AnimatedReportRow icon={<FlaskConical size={14} />} label="Villa Lab" value={report.villaLabProduced} prefix="+" suffix=" Synthetica" positive color="text-blood" delay={villaLabDelay} />
            )}

            {/* Crafting output */}
            {report.craftingOutput && report.craftingOutput.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: villaLabDelay + 0.15, duration: 0.35 }}
                className="border border-game-purple/30 rounded-lg p-3 bg-[hsl(var(--game-purple)/0.06)]"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <FlaskConical size={14} className="text-game-purple" />
                  <span className="text-xs font-bold text-game-purple uppercase tracking-wider">Crafting Productie</span>
                </div>
                <div className="space-y-1">
                  {report.craftingOutput.map((craft, i) => (
                    <div key={i} className="flex justify-between text-[0.6rem]">
                      <span className="text-muted-foreground">{craft.icon} {craft.recipeName}</span>
                      <span className="text-game-purple font-bold">+{craft.outputAmount} {craft.outputGood} (≈€{craft.estimatedValue.toLocaleString()})</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Drug Empire: Dealer Income */}
            {report.drugEmpireDealerIncome && report.drugEmpireDealerIncome > 0 && (
              <AnimatedReportRow icon={<Truck size={14} />} label="Dealer Netwerk" value={report.drugEmpireDealerIncome} prefix="€" positive color="text-emerald" delay={drugDealerDelay} />
            )}

            {/* Drug Empire: NoxCrystal */}
            {report.drugEmpireNoxCrystal && report.drugEmpireNoxCrystal > 0 && (
              <AnimatedReportRow icon={<Gem size={14} />} label="NoxCrystal Geproduceerd" value={report.drugEmpireNoxCrystal} prefix="+" suffix=" kristallen" positive color="text-game-purple" delay={drugNoxDelay} />
            )}

            {/* Drug Empire: Risk Event with banner */}
            {report.drugEmpireRiskEvent && (() => {
              const riskType = report.drugEmpireRiskEvent.type;
              const isPositive = riskType === 'big_harvest';
              const borderClr = isPositive ? 'border-emerald' : 'border-blood';
              const titleClr = isPositive ? 'text-emerald' : 'text-blood';
              const riskImageMap: Record<string, string> = {
                lab_raid: DRUG_EMPIRE_IMAGES.lab_raid,
                dea_investigation: DRUG_EMPIRE_IMAGES.dea_investigation,
                contaminated_batch: DRUG_EMPIRE_IMAGES.contaminated,
                rival_sabotage: DRUG_EMPIRE_IMAGES.rival_sabotage,
                big_harvest: DRUG_EMPIRE_IMAGES.big_harvest,
              };
              const bannerImg = riskImageMap[riskType];
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: drugRiskDelay, type: 'spring', stiffness: 400 }}
                  className={`border ${borderClr} rounded-lg overflow-hidden`}
                >
                  {bannerImg && (
                    <div className="relative h-16 overflow-hidden">
                      <img src={bannerImg} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                    </div>
                  )}
                  <div className="p-3 flex items-center gap-2">
                    <AlertTriangle size={16} className={`${titleClr} flex-shrink-0`} />
                    <div>
                      <p className={`text-xs font-bold ${titleClr}`}>
                        {report.drugEmpireRiskEvent.title}
                      </p>
                      <p className="text-[0.6rem] text-muted-foreground">{report.drugEmpireRiskEvent.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {report.debtInterest > 0 && (
              <AnimatedReportRow icon={<TrendingDown size={14} />} label="Schuld Rente" value={report.debtInterest} prefix="€" positive color="text-blood" delay={debtDelay} />
            )}

            {/* Vehicle Heat bar */}
            <AnimatedResourceBar
              icon={<Car size={14} />}
              label={`Auto Heat ${(report.vehicleHeatChange || 0) >= 0 ? '+' : ''}${report.vehicleHeatChange || 0}%`}
              value={Math.min(100, Math.max(0, (() => {
                const v = state.ownedVehicles.find(v => v.id === state.activeVehicle);
                return v?.vehicleHeat || 0;
              })()))}
              max={100}
              color={(report.vehicleHeatChange || 0) > 0 ? 'blood' : 'emerald'}
              delay={heatDelay}
            />

            {/* Personal Heat bar */}
            <AnimatedResourceBar
              icon={<Flame size={14} />}
              label={`Pers. Heat ${(report.personalHeatChange || 0) >= 0 ? '+' : ''}${report.personalHeatChange || 0}%`}
              value={Math.min(100, Math.max(0, (state.personalHeat || 0)))}
              max={100}
              color={(report.personalHeatChange || 0) > 0 ? 'blood' : 'emerald'}
              delay={heatDelay + 0.12}
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
                className="border border-blood rounded-lg overflow-hidden glow-blood"
              >
                <div className="relative h-16 overflow-hidden">
                  <img src={MARKET_EVENT_IMAGES.police_sweep} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                </div>
                <div className="p-3 flex items-center gap-2">
                  <Shield size={16} className="text-blood flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-blood">POLITIE INVAL!</p>
                    <p className="text-[0.6rem] text-muted-foreground">
                      Boete: €<AnimatedCounter value={report.policeFine} prefix="" duration={1000} />
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Prison arrest */}
            {report.imprisoned && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: prisonDelay, type: 'spring', stiffness: 400 }}
                className="border-2 border-blood rounded-lg overflow-hidden glow-blood"
              >
                <div className="relative h-16 overflow-hidden">
                  <img src={overlayPrison} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock size={16} className="text-blood flex-shrink-0" />
                    <p className="text-xs font-bold text-blood uppercase">GEARRESTEERD!</p>
                  </div>
                  <div className="space-y-1 text-[0.6rem] text-muted-foreground">
                    <p>Straf: <span className="text-blood font-bold">{report.prisonSentence} {report.prisonSentence === 1 ? 'dag' : 'dagen'}</span></p>
                    {(report.prisonMoneyLost || 0) > 0 && (
                      <p>Geld in beslag genomen: <span className="text-blood font-bold">-€{report.prisonMoneyLost?.toLocaleString()}</span></p>
                    )}
                    {(report.prisonDirtyMoneyLost || 0) > 0 && (
                      <p>Dirty money verloren: <span className="text-blood font-bold">-€{report.prisonDirtyMoneyLost?.toLocaleString()}</span></p>
                    )}
                    {report.prisonGoodsLost && report.prisonGoodsLost.length > 0 && (
                      <p>Geconfisqueerd: <span className="text-blood font-bold">{report.prisonGoodsLost.join(', ')}</span></p>
                    )}
                    {(report.villaVaultProtected || 0) > 0 && (
                      <p className="text-emerald">🔐 Kluis beschermd: <span className="font-bold">€{report.villaVaultProtected?.toLocaleString()}</span></p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Prison daily status (ongoing imprisonment) */}
            {report.prisonDayServed && !report.imprisoned && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: prisonStatusDelay, duration: 0.35 }}
                className="border border-blood/30 rounded-lg overflow-hidden"
              >
                <div className="relative h-14 overflow-hidden">
                  <img src={overlayPrison} alt="" className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Lock size={14} className="text-blood" />
                    <p className="text-xs font-bold text-blood">GEVANGENIS — Dag {report.prisonDayServed}</p>
                    {report.prisonDaysRemaining !== undefined && report.prisonDaysRemaining > 0 && (
                      <span className="text-[0.5rem] text-muted-foreground ml-auto">{report.prisonDaysRemaining} {report.prisonDaysRemaining === 1 ? 'dag' : 'dagen'} over</span>
                    )}
                  </div>

                {/* Daily event */}
                {report.prisonDailyEvent && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: prisonEventDelay, duration: 0.3 }}
                    className="bg-muted/30 rounded px-2 py-1.5 mb-1.5"
                  >
                    <p className="text-[0.6rem] font-bold text-foreground">{report.prisonDailyEvent.title}</p>
                    <p className="text-[0.55rem] text-muted-foreground">{report.prisonDailyEvent.desc}</p>
                  </motion.div>
                )}

                {/* Crew deserted */}
                {report.prisonCrewDeserted && report.prisonCrewDeserted.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: prisonDesertedDelay, duration: 0.3 }}
                    className="flex items-center gap-1.5 text-[0.55rem] text-blood"
                  >
                    <UserMinus size={11} />
                    <span><span className="font-bold">{report.prisonCrewDeserted.join(', ')}</span> heeft je crew verlaten!</span>
                  </motion.div>
                )}
                </div>
              </motion.div>
            )}

            {/* Prison release + summary */}
            {report.prisonReleased && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: prisonReleasedDelay, type: 'spring', stiffness: 400 }}
                className="border-2 border-emerald rounded-lg overflow-hidden"
              >
                <div className="relative h-16 overflow-hidden">
                  <img src={overlayPrison} alt="" className="w-full h-full object-cover opacity-50 grayscale" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                  <div className="absolute inset-0 bg-emerald/10" />
                </div>
                <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-emerald flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald uppercase">VRIJGELATEN!</p>
                    <p className="text-[0.55rem] text-muted-foreground">Je hebt je straf uitgezeten. Alle heat is gereset naar 0.</p>
                  </div>
                </div>

                {report.prisonSummary && (
                  <div className="border-t border-emerald/20 pt-2 space-y-1.5">
                    <p className="text-[0.55rem] uppercase tracking-wider text-muted-foreground font-bold">Samenvatting gevangenisstraf</p>
                    <div className="grid grid-cols-2 gap-1 text-[0.55rem]">
                      <span className="text-muted-foreground">Dagen gezeten</span>
                      <span className="text-foreground font-bold text-right">{report.prisonSummary.totalDaysServed} / {report.prisonSummary.totalSentence}</span>
                    </div>
                    {report.prisonSummary.moneyLost > 0 && (
                      <div className="grid grid-cols-2 gap-1 text-[0.55rem]">
                        <span className="text-muted-foreground">Geld verloren</span>
                        <span className="text-blood font-bold text-right">-€{report.prisonSummary.moneyLost.toLocaleString()}</span>
                      </div>
                    )}
                    {report.prisonSummary.dirtyMoneyLost > 0 && (
                      <div className="grid grid-cols-2 gap-1 text-[0.55rem]">
                        <span className="text-muted-foreground">Dirty money verloren</span>
                        <span className="text-blood font-bold text-right">-€{report.prisonSummary.dirtyMoneyLost.toLocaleString()}</span>
                      </div>
                    )}
                    {report.prisonSummary.goodsLost.length > 0 && (
                      <div className="grid grid-cols-2 gap-1 text-[0.55rem]">
                        <span className="text-muted-foreground">Geconfisqueerd</span>
                        <span className="text-blood font-bold text-right">{report.prisonSummary.goodsLost.join(', ')}</span>
                      </div>
                    )}
                    {report.prisonSummary.escapeFailed && (
                      <div className="grid grid-cols-2 gap-1 text-[0.55rem]">
                        <span className="text-muted-foreground">Ontsnapping</span>
                        <span className="text-blood font-bold text-right">Mislukt</span>
                      </div>
                    )}
                    {report.prisonSummary.crewDeserted.length > 0 && (
                      <div className="grid grid-cols-2 gap-1 text-[0.55rem]">
                        <span className="text-muted-foreground">Crew vertrokken</span>
                        <span className="text-blood font-bold text-right">{report.prisonSummary.crewDeserted.join(', ')}</span>
                      </div>
                    )}
                    {report.prisonSummary.events.length > 0 && (
                      <div className="mt-1 space-y-1">
                        <p className="text-[0.5rem] uppercase tracking-wider text-muted-foreground">Voorvallen</p>
                        {report.prisonSummary.events.map((evt, i) => (
                          <div key={`ps-${i}`} className="bg-muted/30 rounded px-2 py-1 text-[0.5rem]">
                            <span className="font-bold text-foreground">{evt.title}</span>
                            <span className="text-muted-foreground ml-1">— {evt.desc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: nemesisDelay, duration: 0.35 }} className="flex flex-col gap-1 bg-muted/40 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Skull size={14} />
                    <span>Nemesis</span>
                  </div>
                  <span className="text-xs font-bold text-blood">{report.nemesisAction}</span>
                </div>
                {report.nemesisReaction && (
                  <p className="text-[0.5rem] text-blood/70 italic">⚡ {report.nemesisReaction}</p>
                )}
                {report.nemesisPrisonRevenge && (
                  <p className="text-[0.5rem] text-blood font-bold">🔒 {report.nemesisPrisonRevenge}</p>
                )}
                {report.nemesisScoutResult && (
                  <p className="text-[0.5rem] text-ice italic">🔍 {report.nemesisScoutResult}</p>
                )}
              </motion.div>
            )}

            {/* Villa attack by nemesis — animated battle popup */}
            {report.villaAttack && (
              <VillaAttackPopup
                won={report.villaAttack.won}
                nemesisName={report.villaAttack.nemesisName}
                damage={report.villaAttack.damage}
                stolenMoney={report.villaAttack.stolenMoney}
                moduleDamaged={report.villaAttack.moduleDamaged}
                defenseScore={report.villaAttack.defenseScore}
                attackPower={report.villaAttack.attackPower}
                defenseBreakdown={report.villaAttack.defenseBreakdown}
                delay={villaAttackDelay}
              />
            )}

            {/* Crew defections */}
            {report.crewDefections && report.crewDefections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: next(), type: 'spring', stiffness: 350 }}
                className="border rounded-lg p-3 bg-[hsl(var(--blood)/0.08)] border-blood"
              >
                <div className="flex items-center gap-2 mb-1">
                  <UserMinus size={14} className="text-blood" />
                  <span className="text-xs font-bold text-blood">CREW DESERTIE!</span>
                </div>
                {report.crewDefections.map((def, i) => (
                  <p key={i} className="text-[0.6rem] text-muted-foreground">
                    {def.name} heeft de crew verlaten — {def.reason}
                  </p>
                ))}
              </motion.div>
            )}

            {/* Safehouse raid */}
            {report.safehouseRaid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: next(), type: 'spring', stiffness: 350 }}
                className={`border rounded-lg p-3 ${
                  report.safehouseRaid.won
                    ? 'bg-[hsl(var(--gold)/0.08)] border-gold'
                    : 'bg-[hsl(var(--blood)/0.08)] border-blood'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Swords size={14} className={report.safehouseRaid.won ? 'text-gold' : 'text-blood'} />
                  <span className={`text-xs font-bold ${report.safehouseRaid.won ? 'text-gold' : 'text-blood'}`}>
                    {report.safehouseRaid.won ? 'SAFEHOUSE VERDEDIGD!' : 'SAFEHOUSE AANGEVALLEN!'}
                  </span>
                </div>
                <p className="text-[0.6rem] text-muted-foreground">{report.safehouseRaid.details}</p>
                {report.safehouseRaid.loot && report.safehouseRaid.loot > 0 && (
                  <p className="text-[0.55rem] text-emerald font-bold mt-0.5">+€{report.safehouseRaid.loot.toLocaleString()} buitgemaakt</p>
                )}
              </motion.div>
            )}
            {/* Market Event */}
            {report.marketEvent && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: next(), duration: 0.35 }} className="bg-gold/8 border border-gold/20 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gold mb-0.5">
                  <TrendingUp size={12} /> {report.marketEvent.name}
                </div>
                <p className="text-[0.55rem] text-muted-foreground">{report.marketEvent.desc}</p>
              </motion.div>
            )}

            {/* Goods Price Changes */}
            {report.priceChanges && report.priceChanges.length > 0 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: next(), duration: 0.35 }} className="bg-muted/40 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                  <BarChart3 size={14} />
                  <span className="font-bold uppercase tracking-wider text-[0.6rem]">Markt Prijsflash</span>
                </div>
                <div className="space-y-1">
                  {report.priceChanges.map(pc => (
                    <div key={pc.goodId} className="flex justify-between items-center text-[0.6rem]">
                      <span className="text-muted-foreground">{pc.goodName}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground/60">€{pc.oldPrice}</span>
                        <span className="text-muted-foreground/40">→</span>
                        <span className="text-foreground font-semibold">€{pc.newPrice}</span>
                        <span className={`font-bold flex items-center gap-0.5 ${pc.changePercent > 0 ? 'text-blood' : 'text-emerald'}`}>
                          {pc.changePercent > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                          {pc.changePercent > 0 ? '+' : ''}{pc.changePercent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Triggered Market Alerts */}
            {report.triggeredAlerts && report.triggeredAlerts.length > 0 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: next(), duration: 0.35 }} className="bg-gold/8 border border-gold/20 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gold mb-1">
                  <BellRing size={12} /> Markt Alarm
                </div>
                {report.triggeredAlerts.map((t, i) => (
                  <p key={i} className="text-[0.55rem] text-muted-foreground">
                    <span className="font-bold text-foreground">{t.goodName}</span> in {t.districtName}: €{t.actualPrice}
                    <span className={t.condition === 'below' ? ' text-emerald' : ' text-blood'}>
                      {' '}({t.condition === 'below' ? '≤' : '≥'} €{t.threshold})
                    </span>
                  </p>
                ))}
              </motion.div>
            )}

            {/* Expiry Warnings */}
            {report.expiryWarnings && report.expiryWarnings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: next(), type: 'spring', stiffness: 350 }}
                className="border rounded-lg p-3 bg-[hsl(var(--gold)/0.08)] border-gold/40"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle size={14} className="text-gold" />
                  <span className="text-xs font-bold text-gold">WAARSCHUWING</span>
                </div>
                {report.expiryWarnings.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-[0.6rem] text-muted-foreground mb-0.5">
                    {w.type === 'auction' ? <Gavel size={10} className="text-game-purple" /> : <Handshake size={10} className="text-emerald" />}
                    <span>
                      {w.type === 'auction'
                        ? `Veiling "${w.name}" sluit morgen!`
                        : `Alliantie met ${w.name} verloopt over ${w.daysLeft} ${w.daysLeft === 1 ? 'dag' : 'dagen'}!`}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            {report.spoilage && report.spoilage.length > 0 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: next(), duration: 0.35 }} className="bg-blood/8 border border-blood/20 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blood mb-0.5">
                  <Leaf size={12} /> Bederf
                </div>
                {report.spoilage.map((s, i) => (
                  <p key={i} className="text-[0.55rem] text-muted-foreground">-{s.lost}x {s.good} verloren door bederf</p>
                ))}
              </motion.div>
            )}

            {/* Stock Market Results */}
            {report.stockDividend && report.stockDividend > 0 && (
              <AnimatedReportRow icon={<BarChart3 size={14} />} label="Dividend Inkomen" value={report.stockDividend} prefix="€" positive color="text-emerald" delay={next()} />
            )}
            {report.stockEvent && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: next(), duration: 0.35 }} className="bg-[hsl(var(--gold)/0.08)] border border-gold/20 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gold mb-0.5">
                  <BarChart3 size={12} /> {report.stockEvent.name}
                </div>
                <p className="text-[0.55rem] text-muted-foreground">{report.stockEvent.desc}</p>
              </motion.div>
            )}
            {report.stockChanges && report.stockChanges.length > 0 && (() => {
              const bigMoves = report.stockChanges.filter(sc => Math.abs(sc.change) >= 10);
              if (bigMoves.length === 0) return null;
              return (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: next(), duration: 0.35 }} className="bg-muted/40 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <BarChart3 size={14} />
                    <span>Beurs Overzicht</span>
                  </div>
                  <div className="space-y-0.5">
                    {bigMoves.map(sc => (
                      <div key={sc.stockId} className="flex justify-between text-[0.6rem]">
                        <span className="text-muted-foreground">{sc.stockId.replace(/_/g, ' ')}</span>
                        <span className={`font-bold ${sc.change > 0 ? 'text-emerald' : 'text-blood'}`}>
                          {sc.change > 0 ? '+' : ''}€{sc.change}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })()}

            {/* Bounty Results */}
            {report.bountyEncounterReport && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: next(0.2), type: 'spring', stiffness: 350 }}
                className="border rounded-lg p-3 bg-[hsl(var(--blood)/0.08)] border-blood/40"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Target size={14} className="text-blood" />
                  <span className="text-xs font-bold text-blood">PREMIEJAGER!</span>
                </div>
                <p className="text-[0.6rem] text-muted-foreground">{report.bountyEncounterReport}</p>
              </motion.div>
            )}
            {report.bountyResults && report.bountyResults.length > 0 && report.bountyResults.map((br, i) => (
              <motion.div
                key={`br-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: next(), duration: 0.35 }}
                className={`border rounded-lg p-3 ${br.success ? 'bg-[hsl(var(--gold)/0.08)] border-gold/40' : 'bg-muted/40 border-border'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Target size={14} className={br.success ? 'text-gold' : 'text-muted-foreground'} />
                  <span className={`text-xs font-bold ${br.success ? 'text-gold' : 'text-muted-foreground'}`}>
                    {br.success ? 'PREMIE VOLTOOID!' : 'Premie Mislukt'}
                  </span>
                </div>
                <p className="text-[0.6rem] text-muted-foreground">
                  Doelwit: {br.targetName}
                  {br.success && <> — <span className="text-emerald font-bold">+€{br.rewardMoney.toLocaleString()}</span> <span className="text-gold font-bold">+{br.rewardRep} rep</span></>}
                </p>
              </motion.div>
            ))}

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

          {/* Golden Hour notification */}
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

          {/* Cliffhanger - "Morgen..." teaser */}
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
            onClick={() => dispatch({ type: 'DISMISS_NIGHT_REPORT' })}
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
