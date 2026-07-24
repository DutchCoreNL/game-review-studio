import { useGame, type CatchUpReportData } from '@/contexts/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Brain, TrendingDown, Calendar, ArrowRight, Coins, Building2, Globe, Crown } from 'lucide-react';
import { AnimatedReportRow } from './night-report/AnimatedReportRow';
import { useEffect, useRef } from 'react';

export function CatchUpReport() {
  const { state, dispatch } = useGame();
  const report = (state as any).catchUpReport as CatchUpReportData | null;
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (report) {
      autoDismissRef.current = setTimeout(() => {
        dispatch({ type: 'SET_CATCH_UP_REPORT', report: null });
      }, 8000);
    }
    return () => { if (autoDismissRef.current) clearTimeout(autoDismissRef.current); };
  }, [report, dispatch]);

  if (!report) return null;

  const handleDismiss = () => {
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    dispatch({ type: 'SET_CATCH_UP_REPORT', report: null });
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}u ${mins}m` : `${hours} uur`;
    }
    return `${minutes} min`;
  };

  let d = 0;
  const next = (step = 0.12) => { d += step; return d; };

  return (
    <AnimatePresence>
      <motion.div
        key="catchup-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full max-w-sm game-card border-t-[3px] border-t-primary shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header banner */}
          <div className="relative h-20 overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-transparent">
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
            <motion.div
              className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Clock size={18} className="text-primary" />
              <h2 className="font-display text-base text-primary uppercase tracking-widest">
                Welkom terug
              </h2>
            </motion.div>
          </div>

          <div className="p-4 space-y-2">
            {/* Duration away */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: next(), duration: 0.35 }}
              className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar size={14} />
                <span>Tijd afwezig</span>
              </div>
              <span className="text-xs font-bold text-foreground">
                {formatDuration(report.minutesAway)}
              </span>
            </motion.div>

            {/* Days advanced */}
            {report.daysAdvanced > 0 && (
              <AnimatedReportRow
                icon={<ArrowRight size={14} />}
                label="Dagen verstreken"
                value={report.daysAdvanced}
                suffix={report.daysAdvanced === 1 ? ' dag' : ' dagen'}
                color="text-foreground"
                delay={next()}
              />
            )}

            {/* Energy restored */}
            {report.energyRestored > 0 && (
              <AnimatedReportRow
                icon={<Zap size={14} />}
                label="Energie hersteld"
                value={report.energyRestored}
                prefix="+"
                positive
                color="text-emerald-400"
                delay={next()}
              />
            )}

            {/* Nerve restored */}
            {report.nerveRestored > 0 && (
              <AnimatedReportRow
                icon={<Brain size={14} />}
                label="Lef hersteld"
                value={report.nerveRestored}
                prefix="+"
                positive
                color="text-blue-400"
                delay={next()}
              />
            )}

            {/* Business income */}
            {report.businessIncome > 0 && (
              <AnimatedReportRow
                icon={<Building2 size={14} />}
                label="Bedrijf inkomen"
                value={report.businessIncome}
                prefix="+€"
                positive
                color="text-emerald-400"
                delay={next()}
              />
            )}

            {/* District income */}
            {report.districtIncome > 0 && (
              <AnimatedReportRow
                icon={<Coins size={14} />}
                label="District inkomen"
                value={report.districtIncome}
                prefix="+€"
                positive
                color="text-emerald-400"
                delay={next()}
              />
            )}

            {/* Total money earned */}
            {report.moneyEarned > 0 && (
              <AnimatedReportRow
                icon={<Coins size={14} />}
                label="Totaal verdiend"
                value={report.moneyEarned}
                prefix="+€"
                positive
                color="text-gold"
                delay={next()}
              />
            )}

            {/* Heat decayed */}
            {report.heatDecayed > 0 && (
              <AnimatedReportRow
                icon={<TrendingDown size={14} />}
                label="Heat afgenomen"
                value={report.heatDecayed}
                prefix="-"
                color="text-emerald-400"
                delay={next()}
              />
            )}

            {/* World headlines — what happened in Noxhaven while away */}
            {report.worldHeadlines && report.worldHeadlines.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: next(), duration: 0.35 }}
                className="mt-1 pt-2 border-t border-border/40"
              >
                <div className="flex items-center gap-2 mb-1.5 text-[0.6rem] uppercase tracking-wider text-muted-foreground font-bold">
                  <Globe size={12} className="text-primary" />
                  <span>In Noxhaven</span>
                </div>
                <div className="space-y-1">
                  {report.worldHeadlines.map((line, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: next(0.08), duration: 0.3 }}
                      className="text-[0.65rem] text-foreground/80 leading-snug"
                    >
                      • {line}
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Organisation headlines — what happened to your outfit while away */}
            {report.orgHeadlines && report.orgHeadlines.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: next(), duration: 0.35 }}
                className="mt-1 pt-2 border-t border-border/40"
              >
                <div className="flex items-center gap-2 mb-1.5 text-[0.6rem] uppercase tracking-wider text-muted-foreground font-bold">
                  <Crown size={12} className="text-gold" />
                  <span>Je Organisatie</span>
                </div>
                <div className="space-y-1">
                  {report.orgHeadlines.map((line, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: next(0.08), duration: 0.3 }}
                      className="text-[0.65rem] text-foreground/80 leading-snug"
                    >
                      • {line}
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Dismiss hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: d + 0.5 }}
              className="text-[0.6rem] text-center text-muted-foreground pt-1"
            >
              Tik om te sluiten
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
