import { useGame } from '@/contexts/GameContext';
import { VEHICLES, DISTRICTS, GOODS, WEATHER_EFFECTS } from '@/game/constants';
import { NightReportData } from '@/game/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, TrendingUp, TrendingDown, Factory, Shield, Flame, Car, Zap, AlertTriangle, Sparkles, Heart, Route, Skull, CloudRain, Sun, CloudFog, Thermometer, CloudLightning } from 'lucide-react';

export function NightReport() {
  const { state, dispatch } = useGame();
  const report = state.nightReport;

  if (!report) return null;

  const totalIncome = report.districtIncome + report.businessIncome;
  const totalCosts = report.debtInterest + report.policeFine;

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
          <div className="flex items-center justify-center gap-2 mb-4">
            <Moon size={20} className="text-gold" />
            <h2 className="font-display text-lg text-gold uppercase tracking-widest">Nacht {report.day}</h2>
          </div>

          <div className="space-y-2.5">
            {/* Income */}
            {report.districtIncome > 0 && (
              <ReportRow icon={<TrendingUp size={14} />} label="District Inkomen" value={`+€${report.districtIncome.toLocaleString()}`} color="text-emerald" />
            )}
            {report.businessIncome > 0 && (
              <ReportRow icon={<Factory size={14} />} label="Bedrijf Inkomen" value={`+€${report.businessIncome.toLocaleString()}`} color="text-emerald" />
            )}
            {report.totalWashed > 0 && (
              <ReportRow icon={<Sparkles size={14} />} label="Witgewassen" value={`€${report.totalWashed.toLocaleString()}`} color="text-gold" />
            )}
            {report.labYield > 0 && (
              <ReportRow icon={<Factory size={14} />} label="Lab Productie" value={`+${report.labYield} Synthetica`} color="text-game-purple" />
            )}

            {/* Costs */}
            {report.debtInterest > 0 && (
              <ReportRow icon={<TrendingDown size={14} />} label="Schuld Rente" value={`+€${report.debtInterest.toLocaleString()}`} color="text-blood" />
            )}

            {/* Heat */}
            <ReportRow
              icon={<Flame size={14} />}
              label="Heat Verandering"
              value={`${report.heatChange >= 0 ? '+' : ''}${report.heatChange}%`}
              color={report.heatChange > 0 ? 'text-blood' : 'text-emerald'}
            />

            {/* Crew healing */}
            {report.crewHealing > 0 && (
              <ReportRow icon={<Heart size={14} />} label="Crew Herstel" value={`+${report.crewHealing} HP`} color="text-emerald" />
            )}

            {/* Vehicle decay */}
            {report.vehicleDecay.length > 0 && report.vehicleDecay.map(v => {
              const vDef = VEHICLES.find(ve => ve.id === v.id);
              return (
                <ReportRow
                  key={v.id}
                  icon={<Car size={14} />}
                  label={`${vDef?.name || v.id} Slijtage`}
                  value={`-${v.amount}%`}
                  color="text-muted-foreground"
                />
              );
            })}

            {/* Police raid */}
            {report.policeRaid && (
              <div className="bg-[hsl(var(--blood)/0.1)] border border-blood rounded-lg p-3 flex items-center gap-2">
                <Shield size={16} className="text-blood flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blood">POLITIE INVAL!</p>
                  <p className="text-[0.6rem] text-muted-foreground">Boete: €{report.policeFine.toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Smuggle route results */}
            {report.smuggleResults && report.smuggleResults.length > 0 && report.smuggleResults.map((sr, i) => {
              const goodName = GOODS.find(g => g.id === sr.good)?.name || sr.good;
              return (
                <ReportRow
                  key={`sr-${i}`}
                  icon={<Route size={14} />}
                  label={sr.intercepted ? `Route onderschept! (${goodName})` : `Smokkel: ${goodName}`}
                  value={sr.intercepted ? `-€${Math.abs(sr.income).toLocaleString()}` : `+€${sr.income.toLocaleString()}`}
                  color={sr.intercepted ? 'text-blood' : 'text-emerald'}
                />
              );
            })}

            {/* Defense results */}
            {report.defenseResults && report.defenseResults.filter(d => d.attacked).map((dr, i) => (
              <div key={`dr-${i}`} className={`border rounded-lg p-3 flex items-center gap-2 ${
                dr.won ? 'bg-[hsl(var(--gold)/0.08)] border-gold' : 'bg-[hsl(var(--blood)/0.08)] border-blood'
              }`}>
                <Shield size={16} className={dr.won ? 'text-gold' : 'text-blood'} />
                <div>
                  <p className={`text-xs font-bold ${dr.won ? 'text-gold' : 'text-blood'}`}>
                    {dr.won ? 'AANVAL AFGESLAGEN!' : 'DISTRICT VERLOREN!'}
                  </p>
                  <p className="text-[0.6rem] text-muted-foreground">{dr.details}</p>
                </div>
              </div>
            ))}

            {/* Nemesis action */}
            {report.nemesisAction && (
              <ReportRow icon={<Skull size={14} />} label="Nemesis" value={report.nemesisAction} color="text-blood" />
            )}

            {/* Weather change */}
            {report.weatherChange && (
              <ReportRow
                icon={report.weatherChange === 'rain' ? <CloudRain size={14} /> : report.weatherChange === 'fog' ? <CloudFog size={14} /> : report.weatherChange === 'heatwave' ? <Thermometer size={14} /> : report.weatherChange === 'storm' ? <CloudLightning size={14} /> : <Sun size={14} />}
                label="Weer morgen"
                value={WEATHER_EFFECTS[report.weatherChange]?.name || 'Helder'}
                color="text-muted-foreground"
              />
            )}

            {/* Random event */}
            {report.randomEvent && (
              <div className={`border rounded-lg p-3 flex items-start gap-2 ${
                report.randomEvent.type === 'positive'
                  ? 'bg-[hsl(var(--gold)/0.08)] border-gold'
                  : report.randomEvent.type === 'negative'
                  ? 'bg-[hsl(var(--blood)/0.08)] border-blood'
                  : 'bg-muted/50 border-border'
              }`}>
                <div className="flex-shrink-0 mt-0.5">
                  {report.randomEvent.type === 'positive' ? (
                    <Zap size={16} className="text-gold" />
                  ) : report.randomEvent.type === 'negative' ? (
                    <AlertTriangle size={16} className="text-blood" />
                  ) : (
                    <Sparkles size={16} className="text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className={`text-xs font-bold ${
                    report.randomEvent.type === 'positive' ? 'text-gold' :
                    report.randomEvent.type === 'negative' ? 'text-blood' : 'text-foreground'
                  }`}>{report.randomEvent.title}</p>
                  <p className="text-[0.6rem] text-muted-foreground mt-0.5">{report.randomEvent.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          {(totalIncome > 0 || totalCosts > 0) && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Netto inkomen:</span>
                <span className={`font-bold ${totalIncome - totalCosts >= 0 ? 'text-emerald' : 'text-blood'}`}>
                  {totalIncome - totalCosts >= 0 ? '+' : ''}€{(totalIncome - totalCosts).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Dismiss */}
          <motion.button
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

function ReportRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`text-xs font-bold ${color}`}>{value}</span>
    </div>
  );
}
