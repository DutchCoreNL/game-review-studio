import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { Users, Zap } from 'lucide-react';
import { DISTRICTS } from '@/game/constants';
import { DISTRICT_IMAGES } from '@/assets/items';
import type { ScoreJob } from '@/game/score';
import {
  resolveTap, decayMomentum, momentumTier, MOMENTUM_MAX, returnMomentum,
  streakPayoutMultiplier, type TapResult,
} from '@/game/momentum';
import { playHitSound, playHeavyHitSound } from '@/game/sounds';
import { HeatAtmosphere } from './HeatAtmosphere';
import { JobTarget, stageFor } from './JobTarget';
import { CrewFigures, Lookout } from './CrewFigures';

/**
 * THE SCENE YOU WORK.
 *
 * This used to be a 130-pixel letterbox: a dark district photo, a hand icon, a progress
 * bar, and a page of empty space beneath it — on the screen the player spends nearly all
 * their time. It described a job rather than being one.
 *
 * It is now a place you are standing in. Back to front:
 *
 *   1. the district, drifting slowly (a still photo reads as a menu background; a moving
 *      one reads as a camera)
 *   2. haze rolling through, lit from below
 *   3. your crew, as silhouettes hauling, with a lookout watching the road
 *   4. the target itself — the container, the safe, the case — which cracks, pops its
 *      rivets and swings open as you work it, and flinches on every tap
 *   5. sirens, searchlights and the closing dark when you are wanted (HeatAtmosphere)
 *   6. the HUD, kept to the bottom strip so it never covers the scene
 *
 * The bar still exists because you need to know how far in you are, but it is no longer
 * the thing you watch: the object opening is.
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

/** What the object is doing, in words, so the picture is never the only signal. */
const STAGE_NOTE = [
  'Nog dicht. Zet je schouders eronder.',
  'Het geeft mee — hou vol.',
  'Het staat open. Pak wat je kunt.',
  'Binnen. Alles eruit.',
];

export function JobScene({ job, basePower, crewRate, crewNames, streak, minutesAway, heat, onWork }: {
  job: ScoreJob;
  basePower: number;
  crewRate: number;
  crewNames: string[];
  /** Jobs finished in this run — drives the payout bonus shown on the scene. */
  streak: number;
  /** Minutes since the last tick, used for the returning-player head start. */
  minutesAway: number;
  /** Personal heat, so the city can visibly react to how wanted you are. */
  heat: number;
  onWork: (amount: number) => void;
}) {
  const [hits, setHits] = useState<Hit[]>([]);
  const hitId = useRef(0);
  const [momentum, setMomentum] = useState(() => returnMomentum(minutesAway));
  const [greeted, setGreeted] = useState(() => returnMomentum(minutesAway) > 0);
  const shake = useAnimationControls();
  // Bumped on every tap so the target can replay its flinch and its sparks.
  const [impact, setImpact] = useState({ n: 0, crit: false });

  // Momentum bleeds away whenever you stop, so a burst of work is worth more than the
  // same taps spread thin. The returning head start is held until your first tap — at
  // the normal decay rate a 70-point kick-off is gone in five seconds, so it would
  // evaporate while you were still reading the banner.
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
  const stage = stageFor(pct);
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
    setImpact(p => ({ n: p.n + 1, crit: res.crit }));

    // Impact: a crit kicks harder than a normal hit.
    shake.start({
      x: res.crit ? [0, -6, 6, -3, 0] : [0, -2, 2, 0],
      y: res.crit ? [0, 3, -2, 0] : [0, 1, 0],
      transition: { duration: res.crit ? 0.32 : 0.16 },
    });
    if (res.crit) playHeavyHitSound(); else playHitSound();
    if (!started) setStarted(true);
  };

  return (
    <motion.div animate={shake}>
      <div
        onClick={handleTap}
        className={`relative rounded-xl overflow-hidden border cursor-pointer select-none transition-colors ${
          tier.accent === 'blood' ? 'border-blood/60' : tier.accent === 'gold' ? 'border-gold/50' : 'border-border/60'
        }`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {/* ---- 1. the district, drifting ---- */}
        {/* Sized against the viewport rather than fixed: the scene is the game, and on a
            tall phone a fixed 22rem left a third of the screen empty below it. */}
        <div className="relative h-[clamp(20rem,48vh,34rem)] overflow-hidden">
          <motion.img
            src={DISTRICT_IMAGES[job.district]} alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-45"
            initial={{ scale: 1.08, x: 0, y: 0 }}
            animate={{ scale: [1.08, 1.16, 1.08], x: [0, -10, 0], y: [0, 6, 0] }}
            transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Ground the scene: dark at the bottom, so figures read as standing on it */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/10" />

          {/* ---- 2. haze rolling through, lit from below ---- */}
          <Haze />

          {/* Momentum glow washes the scene as you climb the tiers */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: (momentum / MOMENTUM_MAX) * 0.4 }}
            style={{ background: tier.accent === 'blood'
              ? 'radial-gradient(circle at 50% 58%, hsl(var(--blood)/0.55), transparent 68%)'
              : 'radial-gradient(circle at 50% 58%, hsl(var(--gold)/0.45), transparent 68%)' }}
          />

          {/* ---- 3. crew on site ---- */}
          <CrewFigures names={crewNames} />
          {crewNames.length > 0 && <Lookout />}

          {/* ---- 4. the target ---- */}
          {/* Centred in the space above the crew rather than pinned to a fixed offset:
              with the scene now sized to the viewport, a fixed top left the target
              floating well clear of the people working it. */}
          <div className="absolute inset-x-0 top-[3.5rem] bottom-[5.5rem] flex flex-col items-center justify-center pointer-events-none">
            <JobTarget kind={job.target} pct={pct} hit={impact.n} crit={impact.crit} />
            <motion.p
              key={stage}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className={`text-[0.5rem] mt-1 font-semibold ${stage >= 2 ? 'text-gold' : 'text-muted-foreground'}`}
            >
              {STAGE_NOTE[stage]}
            </motion.p>
          </div>

          {/* ---- 5. the city reacting to your heat ---- */}
          <HeatAtmosphere heat={heat} />

          {/* Job identity, top-left over the scene */}
          <div className="absolute top-3 left-3 right-3 pointer-events-none">
            <div className="text-[0.45rem] text-gold/80 uppercase tracking-[0.25em]">
              {DISTRICTS[job.district]?.name || job.district}
            </div>
            <div className="text-base font-display text-foreground uppercase tracking-wide leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              {job.name}
            </div>
            <p className="text-[0.5rem] text-muted-foreground leading-snug mt-0.5 max-w-[85%]">{job.flavor}</p>
          </div>

          {/* A returning player gets a running start rather than opening from cold. */}
          <AnimatePresence>
            {greeted && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute top-20 left-0 right-0 flex justify-center pointer-events-none"
              >
                <span className="rounded-full bg-gold/15 border border-gold/40 px-3 py-1 text-[0.5rem] font-bold text-gold backdrop-blur-sm">
                  Je crew hield het warm — je begint op gang
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating numbers, at the point of contact */}
          <AnimatePresence>
            {hits.map(h => (
              <motion.div key={h.id}
                initial={{ opacity: 1, y: 0, scale: h.crit ? 1.9 : 1.2 }}
                animate={{ opacity: 0, y: h.crit ? -70 : -50, scale: h.crit ? 1.2 : 0.9 }}
                transition={{ duration: h.crit ? 0.9 : 0.7 }}
                className={`absolute font-bold pointer-events-none ${h.crit ? 'text-blood text-xl' : 'text-gold text-base'}`}
                style={{ left: h.x - 10, top: h.y - 12, textShadow: '0 0 12px currentColor' }}>
                {h.crit ? `✦ ${h.value}` : `+${h.value}`}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Tap invitation. Rendered only while it is true — animating opacity to 0 on a
              repeating keyframe left it visible on screens that were already underway. */}
          {momentum <= 15 && pct <= 5 && (
            <motion.div
              className="absolute inset-x-0 bottom-2 flex justify-center pointer-events-none"
              initial={{ opacity: 0.35 }}
              animate={{ opacity: [0.35, 0.9, 0.35] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              <span className="text-[0.5rem] font-bold uppercase tracking-[0.2em] text-gold">Tik om te forceren</span>
            </motion.div>
          )}
        </div>

        {/* ---- 6. HUD strip ---- */}
        <div className="relative bg-background/80 backdrop-blur-sm border-t border-border/50 p-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Zap size={9} className={ACCENT_TEXT[tier.accent]} />
            <div className="relative flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
              <motion.div className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${ACCENT_BAR[tier.accent]}`}
                initial={{ width: 0 }}
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
                  🔥{streak} · +{Math.round((streakMult - 1) * 100)}% buit
                </span>
              )}
              <span className="text-gold font-bold">{Math.floor(job.progress)}/{job.required}</span>
            </span>
          </div>

          <motion.div className="h-2.5 rounded-full bg-muted/60 overflow-hidden border border-border/40"
            animate={nearlyDone ? { boxShadow: ['0 0 0px hsl(var(--gold)/0)', '0 0 14px hsl(var(--gold)/0.75)', '0 0 0px hsl(var(--gold)/0)'] } : {}}
            transition={{ duration: 0.9, repeat: Infinity }}>
            <motion.div className="h-full bg-gradient-to-r from-gold via-gold to-blood"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }} transition={{ duration: 0.18 }} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Haze drifting across the scene. Three slow layers at different speeds and opacities;
 * the parallax between them is what stops the backdrop reading as a flat image.
 */
function Haze() {
  const layers = [
    { top: '38%', h: '46%', dur: 26, from: -22, to: 22, o: 0.10 },
    { top: '54%', h: '40%', dur: 19, from: 18, to: -18, o: 0.13 },
    { top: '68%', h: '32%', dur: 14, from: -14, to: 14, o: 0.09 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {layers.map((l, i) => (
        <motion.div
          key={i}
          className="absolute inset-x-[-20%]"
          style={{
            top: l.top, height: l.h,
            background: 'radial-gradient(ellipse at 50% 100%, hsl(210 25% 60% / 0.5), transparent 70%)',
            filter: 'blur(9px)',
          }}
          initial={{ x: l.from, opacity: l.o }}
          animate={{ x: [l.from, l.to, l.from], opacity: [l.o, l.o * 1.7, l.o] }}
          transition={{ duration: l.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
