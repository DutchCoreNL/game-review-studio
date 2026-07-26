import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { Users, Hand, Zap } from 'lucide-react';
import { DISTRICTS } from '@/game/constants';
import { DISTRICT_IMAGES } from '@/assets/items';
import type { ScoreJob } from '@/game/score';
import {
  resolveTap, decayMomentum, momentumTier, MOMENTUM_MAX, returnMomentum,
  streakPayoutMultiplier, type TapResult,
} from '@/game/momentum';
import { playHitSound, playHeavyHitSound } from '@/game/sounds';

/**
 * The scene you actually work. Everything here exists to make a tap *land*:
 * momentum you can feel climbing, crits that punch, a shake on impact, and crew
 * silhouettes so the idle half of the loop is visibly happening rather than
 * merely being described by a number.
 */

interface Hit { id: number; x: number; y: number; value: number; crit: boolean }

const ACCENT_BAR: Record<string, string> = {
  muted: 'from-muted-foreground/60 to-muted-foreground/40',
  gold: 'from-gold to-gold/70',
  blood: 'from-gold via-blood to-blood',
};
const ACCENT_TEXT: Record<string, string> = {
  muted: 'text-muted-foreground', gold: 'text-gold', blood: 'text-blood',
};

export function JobScene({ job, basePower, crewRate, crewNames, streak, minutesAway, onWork }: {
  job: ScoreJob;
  basePower: number;
  crewRate: number;
  crewNames: string[];
  /** Jobs finished in this run — drives the payout bonus shown on the scene. */
  streak: number;
  /** Minutes since the last tick, used for the returning-player head start. */
  minutesAway: number;
  onWork: (amount: number) => void;
}) {
  const [hits, setHits] = useState<Hit[]>([]);
  const hitId = useRef(0);
  const [momentum, setMomentum] = useState(() => returnMomentum(minutesAway));
  const [greeted, setGreeted] = useState(() => returnMomentum(minutesAway) > 0);
  const shake = useAnimationControls();
  const lastTap = useRef(0);

  // Momentum bleeds away whenever you stop, so a burst of work is worth more than
  // the same taps spread thin. The returning head start is held until your first tap
  // — at the normal decay rate a 70-point kick-off is gone in five seconds, so it
  // would evaporate while you were still reading the banner.
  const [started, setStarted] = useState(() => returnMomentum(minutesAway) <= 0);
  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => {
      setMomentum(m => (m <= 0 ? 0 : decayMomentum(m, 0.2)));
    }, 200);
    return () => clearInterval(id);
  }, [started]);

  useEffect(() => {
    if (!greeted) return;
    const t = setTimeout(() => setGreeted(false), 3200);
    return () => clearTimeout(t);
  }, [greeted]);

  const tier = momentumTier(momentum);
  const streakMult = streakPayoutMultiplier(streak);
  const pct = Math.min(100, (job.progress / job.required) * 100);
  const nearlyDone = pct > 85;

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const res: TapResult = resolveTap(basePower, momentum);
    setMomentum(res.momentum);
    onWork(res.amount);

    hitId.current++;
    const id = hitId.current;
    setHits(h => [...h, { id, x, y, value: res.amount, crit: res.crit }]);
    setTimeout(() => setHits(h => h.filter(p => p.id !== id)), 800);

    // Impact: a crit kicks harder than a normal hit.
    shake.start({
      x: res.crit ? [0, -5, 5, -3, 0] : [0, -2, 2, 0],
      transition: { duration: res.crit ? 0.32 : 0.16 },
    });
    if (res.crit) playHeavyHitSound(); else playHitSound();
    lastTap.current = Date.now();
    if (!started) setStarted(true);
  };

  return (
    <motion.div animate={shake} className="space-y-2">
      <div
        onClick={handleTap}
        className={`relative rounded-xl overflow-hidden border cursor-pointer select-none transition-colors ${
          tier.accent === 'blood' ? 'border-blood/60' : tier.accent === 'gold' ? 'border-gold/50' : 'border-border/60'
        }`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <img src={DISTRICT_IMAGES[job.district]} alt="" className="w-full h-48 object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Momentum glow washes the scene as you climb the tiers */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: momentum / MOMENTUM_MAX * 0.35 }}
          style={{ background: tier.accent === 'blood'
            ? 'radial-gradient(circle at 50% 60%, hsl(var(--blood)/0.5), transparent 70%)'
            : 'radial-gradient(circle at 50% 60%, hsl(var(--gold)/0.4), transparent 70%)' }}
        />

        {/* Job identity */}
        <div className="absolute top-3 left-3 right-3">
          <div className="text-[0.45rem] text-muted-foreground uppercase tracking-widest">
            {DISTRICTS[job.district]?.name || job.district}
          </div>
          <div className="text-sm font-display text-foreground uppercase tracking-wide">{job.name}</div>
          <p className="text-[0.5rem] text-muted-foreground leading-snug mt-0.5 max-w-[80%]">{job.flavor}</p>
        </div>

        {/* Crew silhouettes — the idle half, made visible */}
        {crewNames.length > 0 && (
          <div className="absolute bottom-14 left-3 flex items-end gap-1">
            {crewNames.slice(0, 6).map((n, i) => (
              <motion.div
                key={n + i}
                title={n}
                className="w-1.5 rounded-t-full bg-emerald/70"
                animate={{ height: [7, 11, 7] }}
                transition={{ duration: 0.9 + i * 0.14, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
              />
            ))}
            <span className="text-[0.4rem] text-emerald/80 ml-1 mb-0.5">{crewNames.length} bezig</span>
          </div>
        )}

        {/* Tap invitation, which fades out once you are actually going */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          animate={{ opacity: momentum > 20 ? 0 : [0.25, 0.6, 0.25], scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Hand size={30} className="text-gold/70" />
        </motion.div>

        {/* A returning player gets a running start rather than opening from cold. */}
        <AnimatePresence>
          {greeted && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-center pointer-events-none"
            >
              <span className="rounded-full bg-gold/15 border border-gold/40 px-3 py-1 text-[0.5rem] font-bold text-gold">
                Je crew hield het warm — je begint op gang
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating numbers */}
        <AnimatePresence>
          {hits.map(h => (
            <motion.div key={h.id}
              initial={{ opacity: 1, y: 0, scale: h.crit ? 1.9 : 1.2 }}
              animate={{ opacity: 0, y: h.crit ? -62 : -44, scale: h.crit ? 1.2 : 0.9 }}
              transition={{ duration: h.crit ? 0.9 : 0.7 }}
              className={`absolute font-bold pointer-events-none ${h.crit ? 'text-blood text-lg' : 'text-gold text-sm'}`}
              style={{ left: h.x - 10, top: h.y - 12, textShadow: '0 0 10px currentColor' }}>
              {h.crit ? `✦ ${h.value}` : `+${h.value}`}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Progress + momentum */}
        <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
          {/* Momentum bar */}
          <div className="flex items-center gap-1.5">
            <Zap size={9} className={ACCENT_TEXT[tier.accent]} />
            <div className="relative flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
              <motion.div className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${ACCENT_BAR[tier.accent]}`}
                animate={{ width: `${momentum}%` }} transition={{ duration: 0.15 }} />
            </div>
            <motion.span
              key={tier.label}
              initial={{ scale: 1.4 }} animate={{ scale: 1 }}
              className={`text-[0.45rem] font-bold ${ACCENT_TEXT[tier.accent]} min-w-[52px] text-right`}>
              {tier.label} ×{tier.mult}
            </motion.span>
          </div>

          <div className="flex justify-between text-[0.45rem]">
            <span className="text-muted-foreground">
              <Users size={8} className="inline mb-px" /> crew {crewRate.toFixed(1)}/sec · tik +{basePower}
            </span>
            <span className="flex items-center gap-1.5">
              {streak > 0 && (
                <span className="text-emerald font-bold" title={`${streak} klussen op een rij`}>
                  🔥{streak} ·  +{Math.round((streakMult - 1) * 100)}% buit
                </span>
              )}
              <span className="text-gold font-bold">{Math.floor(job.progress)}/{job.required}</span>
            </span>
          </div>

          {/* Progress bar, which pulses when the score is nearly in */}
          <motion.div className="h-2.5 rounded-full bg-muted/60 overflow-hidden border border-border/40"
            animate={nearlyDone ? { boxShadow: ['0 0 0px hsl(var(--gold)/0)', '0 0 12px hsl(var(--gold)/0.7)', '0 0 0px hsl(var(--gold)/0)'] } : {}}
            transition={{ duration: 0.9, repeat: Infinity }}>
            <motion.div className="h-full bg-gradient-to-r from-gold via-gold to-blood"
              animate={{ width: `${pct}%` }} transition={{ duration: 0.18 }} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
