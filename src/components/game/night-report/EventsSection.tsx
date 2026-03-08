import { Shield, Lock, UserMinus, Swords, Route, Skull, Car, Heart, Flame, CloudRain, Sun, CloudFog, Thermometer, CloudLightning, TrendingUp, BarChart3, BellRing, AlertTriangle, Gavel, Handshake, Target, Leaf, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedReportRow } from './AnimatedReportRow';
import { AnimatedResourceBar } from './AnimatedResourceBar';
import { AnimatedCounter } from '../animations/AnimatedCounter';
import { DramaticEventReveal } from './DramaticEventReveal';
import { VillaAttackPopup } from '../villa/VillaAttackPopup';
import { VEHICLES, GOODS, WEATHER_EFFECTS } from '@/game/constants';
import { MARKET_EVENT_IMAGES } from '@/assets/items/index';
import overlayPrison from '@/assets/items/overlay-prison.jpg';

interface EventsSectionProps {
  report: any;
  state: any;
  delays: {
    heat: number;
    crewHeal: number;
    vehicleDelays: number[];
    raid: number;
    prison: number;
    prisonStatus: number;
    prisonEvent: number;
    prisonDeserted: number;
    prisonReleased: number;
    smuggleDelays: number[];
    defenseDelays: number[];
    nemesis: number;
    villaAttack: number;
    weather: number;
    event: number;
  };
  next: (step?: number) => number;
}

export function EventsSection({ report, state, delays, next }: EventsSectionProps) {
  const defenseResults = report.defenseResults?.filter((dr: any) => dr.attacked) || [];

  return (
    <>
      {/* Vehicle Heat bar */}
      <AnimatedResourceBar
        icon={<Car size={14} />}
        label={`Auto Heat ${(report.vehicleHeatChange || 0) >= 0 ? '+' : ''}${report.vehicleHeatChange || 0}%`}
        value={Math.min(100, Math.max(0, (() => {
          const v = state.ownedVehicles.find((v: any) => v.id === state.activeVehicle);
          return v?.vehicleHeat || 0;
        })()))}
        max={100}
        color={(report.vehicleHeatChange || 0) > 0 ? 'blood' : 'emerald'}
        delay={delays.heat}
      />

      {/* Personal Heat bar */}
      <AnimatedResourceBar
        icon={<Flame size={14} />}
        label={`Pers. Heat ${(report.personalHeatChange || 0) >= 0 ? '+' : ''}${report.personalHeatChange || 0}%`}
        value={Math.min(100, Math.max(0, (state.personalHeat || 0)))}
        max={100}
        color={(report.personalHeatChange || 0) > 0 ? 'blood' : 'emerald'}
        delay={delays.heat + 0.12}
      />

      {/* Crew healing */}
      {report.crewHealing > 0 && (
        <AnimatedResourceBar icon={<Heart size={14} />} label={`Crew Herstel +${report.crewHealing} HP`} value={report.crewHealing} max={Math.max(report.crewHealing, 30)} color="emerald" delay={delays.crewHeal} />
      )}

      {/* Vehicle decay */}
      {report.vehicleDecay.length > 0 && report.vehicleDecay.map((v: any, i: number) => {
        const vDef = VEHICLES.find(ve => ve.id === v.id);
        return (
          <AnimatedReportRow key={v.id} icon={<Car size={14} />} label={`${vDef?.name || v.id} Slijtage`} value={v.amount} prefix="" suffix="%" positive={false} color="text-muted-foreground" delay={delays.vehicleDelays[i]} />
        );
      })}

      {/* Police raid */}
      {report.policeRaid && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delays.raid, type: 'spring', stiffness: 400 }}
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
          transition={{ delay: delays.prison, type: 'spring', stiffness: 400 }}
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

      {/* Prison daily status */}
      {report.prisonDayServed && !report.imprisoned && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delays.prisonStatus, duration: 0.35 }}
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
            {report.prisonDailyEvent && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delays.prisonEvent, duration: 0.3 }}
                className="bg-muted/30 rounded px-2 py-1.5 mb-1.5"
              >
                <p className="text-[0.6rem] font-bold text-foreground">{report.prisonDailyEvent.title}</p>
                <p className="text-[0.55rem] text-muted-foreground">{report.prisonDailyEvent.desc}</p>
              </motion.div>
            )}
            {report.prisonCrewDeserted && report.prisonCrewDeserted.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delays.prisonDeserted, duration: 0.3 }}
                className="flex items-center gap-1.5 text-[0.55rem] text-blood"
              >
                <UserMinus size={11} />
                <span><span className="font-bold">{report.prisonCrewDeserted.join(', ')}</span> heeft je crew verlaten!</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Prison release */}
      {report.prisonReleased && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delays.prisonReleased, type: 'spring', stiffness: 400 }}
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
                    {report.prisonSummary.events.map((evt: any, i: number) => (
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
      {report.smuggleResults && report.smuggleResults.length > 0 && report.smuggleResults.map((sr: any, i: number) => {
        const goodName = GOODS.find(g => g.id === sr.good)?.name || sr.good;
        return (
          <AnimatedReportRow key={`sr-${i}`} icon={<Route size={14} />} label={sr.intercepted ? `Route onderschept! (${goodName})` : `Smokkel: ${goodName}`} value={Math.abs(sr.income)} prefix="€" positive={!sr.intercepted} color={sr.intercepted ? 'text-blood' : 'text-emerald'} delay={delays.smuggleDelays[i]} />
        );
      })}

      {/* Defense results */}
      {defenseResults.map((dr: any, i: number) => (
        <motion.div
          key={`dr-${i}`}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delays.defenseDelays[i], type: 'spring', stiffness: 350 }}
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
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: delays.nemesis, duration: 0.35 }} className="flex flex-col gap-1 bg-muted/40 rounded-lg px-3 py-2">
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

      {/* Villa attack */}
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
          delay={delays.villaAttack}
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
          {report.crewDefections.map((def: any, i: number) => (
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
            {report.priceChanges.map((pc: any) => (
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
          {report.triggeredAlerts.map((t: any, i: number) => (
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
          {report.expiryWarnings.map((w: any, i: number) => (
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
          {report.spoilage.map((s: any, i: number) => (
            <p key={i} className="text-[0.55rem] text-muted-foreground">-{s.lost}x {s.good} verloren door bederf</p>
          ))}
        </motion.div>
      )}

      {/* Stock Market */}
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
        const bigMoves = report.stockChanges.filter((sc: any) => Math.abs(sc.change) >= 10);
        if (bigMoves.length === 0) return null;
        return (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: next(), duration: 0.35 }} className="bg-muted/40 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <BarChart3 size={14} />
              <span>Beurs Overzicht</span>
            </div>
            <div className="space-y-0.5">
              {bigMoves.map((sc: any) => (
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
      {report.bountyResults && report.bountyResults.length > 0 && report.bountyResults.map((br: any, i: number) => (
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
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: delays.weather, duration: 0.35 }} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {report.weatherChange === 'rain' ? <CloudRain size={14} /> : report.weatherChange === 'fog' ? <CloudFog size={14} /> : report.weatherChange === 'heatwave' ? <Thermometer size={14} /> : report.weatherChange === 'storm' ? <CloudLightning size={14} /> : <Sun size={14} />}
            <span>Weer morgen</span>
          </div>
          <span className="text-xs font-bold text-muted-foreground">
            {WEATHER_EFFECTS[report.weatherChange]?.name || 'Helder'}
          </span>
        </motion.div>
      )}

      {/* Random event */}
      {report.randomEvent && (
        <DramaticEventReveal event={report.randomEvent} delay={delays.event} />
      )}
    </>
  );
}
