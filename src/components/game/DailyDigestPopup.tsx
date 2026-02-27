import { useDailyDigest } from '@/hooks/useDailyDigest';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, TrendingUp, Target, Swords, BarChart3, Sparkles, Shield } from 'lucide-react';
import { WEATHER_EFFECTS } from '@/game/constants';
import nightReportBg from '@/assets/night-report-bg.jpg';
import { useEffect, useRef } from 'react';

interface DailyDigestPopupProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function DailyDigestPopup({ forceOpen, onClose }: DailyDigestPopupProps = {}) {
  const { digest, markSeen } = useDailyDigest();
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only show when explicitly force-opened (clicked from sidebar/map button)
  const isVisible = forceOpen;

  useEffect(() => {
    if (digest && !forceOpen) {
      autoDismissRef.current = setTimeout(() => markSeen(), 15000);
    }
    return () => { if (autoDismissRef.current) clearTimeout(autoDismissRef.current); };
  }, [digest, forceOpen]);

  const handleDismiss = () => {
    if (!forceOpen && digest) markSeen();
    onClose?.();
  };

  if (!isVisible || !digest) return null;

  const { sections, weather, world_day } = digest.digest_data;
  const weatherName = WEATHER_EFFECTS[weather as keyof typeof WEATHER_EFFECTS]?.name || weather;

  let d = 0;
  const next = (step = 0.12) => { d += step; return d; };

  return (
    <AnimatePresence>
      <motion.div
        key="digest-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/90 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full max-w-md game-card border-t-[3px] border-t-gold shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative h-24 overflow-hidden flex-shrink-0">
            <img src={nightReportBg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
            <motion.div
              className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Moon size={20} className="text-gold" />
              <h2 className="font-display text-lg text-gold uppercase tracking-widest gold-text-glow">
                Dagelijks Digest — Dag {world_day}
              </h2>
            </motion.div>
          </div>

          <div className="p-5 overflow-y-auto game-scroll flex-1 space-y-3">
            {/* Weather */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: next() }}
              className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2"
            >
              <span className="text-xs text-muted-foreground">☁️ Weer vandaag</span>
              <span className="text-xs font-bold text-foreground">{weatherName}</span>
            </motion.div>

            {/* Income & Costs */}
            {sections.income?.available && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: next() }}
                className="border border-emerald/30 rounded-lg p-3 bg-[hsl(var(--emerald)/0.06)]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-emerald" />
                  <span className="text-xs font-bold text-emerald uppercase tracking-wider">Inkomen & Uitgaven</span>
                </div>
                <div className="space-y-1 text-[0.6rem]">
                  <p className="text-muted-foreground">Passief inkomen is verwerkt via je businesses, districten en villa.</p>
                  {sections.income.debt > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Schuld rente</span>
                      <span className="text-blood font-bold">-€{sections.income.debtInterest.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* PvP & Territory */}
            {sections.pvp && (sections.pvp.activeBountiesOnYou > 0 || sections.pvp.activeGangWars > 0) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: next() }}
                className="border border-blood/30 rounded-lg p-3 bg-[hsl(var(--blood)/0.06)]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Swords size={14} className="text-blood" />
                  <span className="text-xs font-bold text-blood uppercase tracking-wider">PvP & Territory</span>
                </div>
                <div className="space-y-1 text-[0.6rem]">
                  {sections.pvp.activeBountiesOnYou > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1"><Target size={10} /> Bounties op jou</span>
                      <span className="text-blood font-bold">{sections.pvp.activeBountiesOnYou}x (€{sections.pvp.totalBountyAmount.toLocaleString()})</span>
                    </div>
                  )}
                  {sections.pvp.activeGangWars > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1"><Shield size={10} /> Actieve gang wars</span>
                      <span className="text-blood font-bold">{sections.pvp.activeGangWars}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Market & Economy */}
            {sections.market?.highlights && sections.market.highlights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: next() }}
                className="border border-gold/30 rounded-lg p-3 bg-[hsl(var(--gold)/0.06)]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={14} className="text-gold" />
                  <span className="text-xs font-bold text-gold uppercase tracking-wider">Markt & Economie</span>
                </div>
                <div className="space-y-1.5">
                  {sections.market.highlights.map((h: string, i: number) => (
                    <p key={i} className="text-[0.6rem] text-muted-foreground">📰 {h}</p>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Cliffhanger */}
            {sections.cliffhanger && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: next(0.3), duration: 0.6 }}
                className="border rounded-lg p-3 bg-[hsl(var(--game-purple)/0.08)] border-game-purple/30"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">{sections.cliffhanger.icon}</span>
                  <span className="text-[0.6rem] font-bold text-game-purple uppercase tracking-widest">Morgen...</span>
                  <motion.span
                    className="text-game-purple/60 text-xs"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >...</motion.span>
                </div>
                <p className="text-[0.55rem] text-muted-foreground italic leading-relaxed">{sections.cliffhanger.text}</p>
              </motion.div>
            )}

            {/* Dismiss */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: d + 0.5 }}
              onClick={handleDismiss}
              className="w-full mt-3 py-3 rounded bg-gold text-secondary-foreground font-bold text-sm uppercase tracking-wider"
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
