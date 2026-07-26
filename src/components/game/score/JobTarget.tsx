import { motion } from 'framer-motion';
import type { TargetKind } from '@/game/score';

/**
 * THE THING UNDER YOUR HANDS.
 *
 * A filling progress bar is a number going up. A container door that cracks along the
 * seam, pops a rivet, loses its padlock and finally swings open on a glow is a job you
 * are doing. This is the difference between pressing a button and playing, so the whole
 * scene is built around it.
 *
 * Six kinds, matched to what the job fiction says you are actually breaking into (see
 * TargetKind in src/game/score.ts). Each reads its state from two numbers:
 *
 *   `pct`  0..100  — how far in you are, driving four visible stages
 *   `hit`  a counter that changes on every tap, driving the flinch and the sparks
 *
 * Everything is drawn, not photographed, for one reason: a photo cannot open. Drawing it
 * means the object can deform, leak light and swing wide as you work it.
 *
 * All animation is on transforms and opacity with explicit initial values — animating
 * raw SVG geometry attributes is what used to fill this game's console with rejected
 * frames.
 */

export type Stage = 0 | 1 | 2 | 3;

export function stageFor(pct: number): Stage {
  if (pct >= 99) return 3;
  if (pct >= 66) return 2;
  if (pct >= 30) return 1;
  return 0;
}

const GOLD = 'hsl(45 90% 60%)';
const GOLD_DIM = 'hsl(45 40% 38%)';
const STEEL = 'hsl(215 12% 26%)';
const STEEL_LIT = 'hsl(215 14% 38%)';
const DARK = 'hsl(220 18% 9%)';

/**
 * Any job saved before targets existed has no `kind`, and a job with no kind used to
 * render an empty plinth — a contact shadow with nothing standing on it. Fall back rather
 * than draw nothing.
 */
const KINDS: TargetKind[] = ['container', 'safe', 'crate', 'case', 'door', 'bag'];
export function resolveKind(kind: TargetKind | undefined): TargetKind {
  return kind && KINDS.includes(kind) ? kind : 'crate';
}

export function JobTarget({ kind: rawKind, pct, hit, crit }: {
  kind: TargetKind | undefined;
  pct: number;
  /** Increments on every tap; changing it replays the impact. */
  hit: number;
  /** Whether the last tap was a crit, so the flinch can land harder. */
  crit: boolean;
}) {
  const stage = stageFor(pct);
  const kind = resolveKind(rawKind);

  return (
    <motion.div
      className="relative"
      // The whole object flinches away from the blow, harder on a crit.
      key={undefined}
      animate={{
        scale: [1, crit ? 0.93 : 0.97, 1],
        rotate: [0, crit ? -1.6 : -0.6, 0],
      }}
      transition={{ duration: crit ? 0.3 : 0.16, ease: 'easeOut' }}
      style={{ transformOrigin: '50% 60%' }}
    >
      <svg viewBox="0 0 120 120" className="w-52 h-52 sm:w-60 sm:h-60 overflow-visible">
        {/* Light spilling out of whatever you have opened, growing with progress. */}
        <defs>
          <radialGradient id="jt-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(45 95% 65%)" stopOpacity="0.85" />
            <stop offset="60%" stopColor="hsl(35 90% 50%)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(35 90% 50%)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="jt-steel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={STEEL_LIT} />
            <stop offset="100%" stopColor={STEEL} />
          </linearGradient>
        </defs>

        <motion.circle
          cx={60} cy={62} r={46} fill="url(#jt-glow)"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: stage * 0.22, scale: 0.6 + stage * 0.16 }}
          transition={{ duration: 0.5 }}
          style={{ transformOrigin: '60px 62px' }}
        />

        {/* Contact shadow: without it the object floats above the scene. */}
        <ellipse cx={60} cy={96} rx={38} ry={5} fill="hsl(220 30% 3%)" opacity={0.55} />

        {kind === 'container' && <Container stage={stage} />}
        {kind === 'door' && <ShutterDoor stage={stage} />}
        {kind === 'safe' && <Safe stage={stage} pct={pct} />}
        {kind === 'crate' && <Crate stage={stage} />}
        {kind === 'case' && <Briefcase stage={stage} />}
        {kind === 'bag' && <Holdall stage={stage} />}

        <Sparks hit={hit} crit={crit} />
      </svg>
    </motion.div>
  );
}

/* ---------------------------------------------------------------- sparks */

/** A burst of chips and sparks off the point of impact. */
function Sparks({ hit, crit }: { hit: number; crit: boolean }) {
  const n = crit ? 10 : 6;
  return (
    <g key={hit}>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + (hit % 7) * 0.3;
        const dist = (crit ? 34 : 22) + (i % 3) * 6;
        return (
          <motion.circle
            key={i}
            cx={60} cy={58} r={crit ? 1.9 : 1.3}
            fill={i % 3 === 0 ? 'hsl(20 95% 60%)' : GOLD}
            initial={{ opacity: 0.95, x: 0, y: 0 }}
            animate={{ opacity: 0, x: Math.cos(a) * dist, y: Math.sin(a) * dist + 10 }}
            transition={{ duration: crit ? 0.55 : 0.38, ease: 'easeOut' }}
          />
        );
      })}
      {/* Shock ring */}
      <motion.circle
        cx={60} cy={58} r={6} fill="none" stroke={GOLD} strokeWidth={1.4}
        initial={{ opacity: 0.7, scale: 0.4 }}
        animate={{ opacity: 0, scale: crit ? 3.4 : 2.2 }}
        transition={{ duration: crit ? 0.5 : 0.32, ease: 'easeOut' }}
        style={{ transformOrigin: '60px 58px' }}
      />
    </g>
  );
}

/** Rivets that pop off one by one as the thing gives way. */
function Rivets({ stage, points }: { stage: Stage; points: [number, number][] }) {
  return (
    <>
      {points.map(([x, y], i) => {
        const gone = i < stage;
        return (
          <motion.circle
            key={i} cx={x} cy={y} r={1.6}
            fill={gone ? 'transparent' : GOLD_DIM}
            initial={{ opacity: 1, y: 0 }}
            animate={gone ? { opacity: 0, y: 14 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeIn' }}
          />
        );
      })}
    </>
  );
}

/** The crack that opens along a seam. */
function Seam({ stage, x1, y1, x2, y2 }: { stage: Stage; x1: number; y1: number; x2: number; y2: number }) {
  return (
    <motion.line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="hsl(45 95% 65%)" strokeLinecap="round"
      initial={{ opacity: 0, strokeWidth: 0.5 }}
      animate={{ opacity: stage === 0 ? 0 : 0.35 + stage * 0.22, strokeWidth: 0.5 + stage * 1.1 }}
      transition={{ duration: 0.45 }}
    />
  );
}

/* ------------------------------------------------------------- the kinds */

function Container({ stage }: { stage: Stage }) {
  const open = stage >= 2;
  return (
    <g>
      {/* Body */}
      <rect x={22} y={30} width={76} height={62} rx={2} fill="url(#jt-steel)" stroke={GOLD_DIM} strokeWidth={1} />
      {/* Corrugation */}
      {[30, 38, 46, 54, 62, 70, 78, 86].map(x => (
        <line key={x} x1={x} y1={32} x2={x} y2={90} stroke={DARK} strokeWidth={1.2} opacity={0.5} />
      ))}
      {/* Right door swings out as you get in. Hinged at its right edge and narrowed,
          which is what a door swinging towards you looks like from here. */}
      <motion.g
        initial={{ scaleX: 1, skewY: 0 }}
        animate={{ scaleX: open ? (stage === 3 ? 0.24 : 0.66) : 1, skewY: open ? -3 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformOrigin: '98px 61px' }}
      >
        <rect x={60} y={30} width={38} height={62} rx={2} fill="url(#jt-steel)" stroke={GOLD_DIM} strokeWidth={1} />
        {[66, 74, 82, 90].map(x => (
          <line key={x} x1={x} y1={32} x2={x} y2={90} stroke={DARK} strokeWidth={1.2} opacity={0.5} />
        ))}
        {/* Locking bars */}
        <rect x={63} y={32} width={2} height={58} fill={GOLD_DIM} />
        <rect x={70} y={32} width={2} height={58} fill={GOLD_DIM} />
      </motion.g>
      {/* Dark interior revealed behind the door — with the load stacked inside, because
          an open container that is empty is a worse reward than a closed one. */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: open ? 1 : 0 }} transition={{ duration: 0.4 }}>
        <rect x={60} y={31} width={37} height={60} fill={DARK} />
        <rect x={64} y={70} width={14} height={19} rx={1} fill="hsl(215 14% 30%)" />
        <rect x={80} y={62} width={13} height={27} rx={1} fill="hsl(215 14% 24%)" />
        <rect x={64} y={52} width={12} height={16} rx={1} fill="hsl(30 30% 30%)" />
        {/* A glint off something worth taking */}
        <motion.circle
          cx={86} cy={68} r={1.6} fill="hsl(45 100% 78%)"
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.g>
      <Seam stage={stage} x1={60} y1={30} x2={60} y2={92} />
      <Rivets stage={stage} points={[[26, 36], [26, 61], [26, 86]]} />
      {/* Padlock on the handle, cut off at stage 2 */}
      <motion.g initial={{ opacity: 1, y: 0, rotate: 0 }}
        animate={stage >= 2 ? { opacity: 0, y: 18, rotate: 40 } : { opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.4 }} style={{ transformOrigin: '58px 61px' }}>
        <rect x={54} y={57} width={9} height={8} rx={1.5} fill={GOLD} />
        <path d="M56.5 57 v-3 a2 2 0 0 1 4 0 v3" fill="none" stroke={GOLD} strokeWidth={1.3} />
      </motion.g>
      {/* Number stencilled on the side */}
      <text x={40} y={48} fontSize={7} fill={GOLD_DIM} fontFamily="monospace" opacity={0.8}>4471</text>
    </g>
  );
}

function ShutterDoor({ stage }: { stage: Stage }) {
  // The roller shutter rides up as you lever it.
  const lift = [0, 12, 30, 50][stage];
  return (
    <g>
      {/* Doorway */}
      <rect x={24} y={26} width={72} height={68} rx={2} fill={DARK} stroke={GOLD_DIM} strokeWidth={1} />
      {/* What is inside, revealed from the bottom up */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: stage >= 1 ? 1 : 0 }} transition={{ duration: 0.4 }}>
        <rect x={34} y={72} width={16} height={20} fill={STEEL} />
        <rect x={54} y={64} width={14} height={28} fill={STEEL_LIT} />
        <rect x={72} y={76} width={16} height={16} fill={STEEL} />
      </motion.g>
      {/* Shutter */}
      <motion.g initial={{ y: 0 }} animate={{ y: -lift }} transition={{ duration: 0.6, ease: 'easeOut' }}>
        <rect x={26} y={28} width={68} height={64} fill="url(#jt-steel)" />
        {[32, 38, 44, 50, 56, 62, 68, 74, 80, 86].map(y => (
          <line key={y} x1={26} y1={y} x2={94} y2={y} stroke={DARK} strokeWidth={1.3} opacity={0.55} />
        ))}
        <rect x={26} y={88} width={68} height={4} fill={GOLD_DIM} />
      </motion.g>
      <Seam stage={stage} x1={26} y1={92 - lift} x2={94} y2={92 - lift} />
      <Rivets stage={stage} points={[[29, 32], [60, 32], [91, 32]]} />
    </g>
  );
}

function Safe({ stage, pct }: { stage: Stage; pct: number }) {
  const open = stage >= 3;
  return (
    <g>
      <rect x={24} y={28} width={72} height={68} rx={4} fill="url(#jt-steel)" stroke={GOLD_DIM} strokeWidth={1.2} />
      <rect x={30} y={34} width={60} height={56} rx={3} fill={DARK} opacity={0.5} />
      {/* Cash inside */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: stage >= 2 ? 1 : 0 }} transition={{ duration: 0.4 }}>
        <rect x={38} y={48} width={20} height={9} rx={1} fill="hsl(140 40% 40%)" />
        <rect x={40} y={60} width={20} height={9} rx={1} fill="hsl(140 40% 46%)" />
        <rect x={62} y={54} width={18} height={9} rx={1} fill="hsl(140 35% 36%)" />
      </motion.g>
      {/* Door, hinged left, swings wide only when it is done */}
      <motion.g
        initial={{ scaleX: 1, skewY: 0 }}
        animate={{ scaleX: open ? 0.2 : stage === 2 ? 0.82 : 1, skewY: open ? 4 : 0 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
        style={{ transformOrigin: '30px 62px' }}
      >
        <rect x={30} y={34} width={60} height={56} rx={3} fill="url(#jt-steel)" stroke={GOLD_DIM} strokeWidth={1} />
        {/* Dial, spinning as you work the numbers */}
        <motion.g
          animate={{ rotate: pct * 7.2 }}
          transition={{ type: 'spring', stiffness: 90, damping: 12 }}
          style={{ transformOrigin: '66px 62px' }}
        >
          <circle cx={66} cy={62} r={11} fill={DARK} stroke={GOLD} strokeWidth={1.3} />
          <line x1={66} y1={62} x2={66} y2={53} stroke={GOLD} strokeWidth={1.6} strokeLinecap="round" />
          {[0, 60, 120, 180, 240, 300].map(d => {
            const r = (d * Math.PI) / 180;
            return <circle key={d} cx={66 + Math.cos(r) * 8.4} cy={62 + Math.sin(r) * 8.4} r={0.7} fill={GOLD_DIM} />;
          })}
        </motion.g>
        <rect x={38} y={57} width={6} height={10} rx={1.5} fill={GOLD_DIM} />
      </motion.g>
      <Rivets stage={stage} points={[[28, 32], [92, 32], [28, 92]]} />
    </g>
  );
}

function Crate({ stage }: { stage: Stage }) {
  const lidLift = [0, 4, 12, 26][stage];
  const lidTilt = [0, -4, -12, -26][stage];
  return (
    <g>
      {/* Box */}
      <rect x={24} y={46} width={72} height={46} rx={2} fill="url(#jt-steel)" stroke={GOLD_DIM} strokeWidth={1} />
      <line x1={24} y1={62} x2={96} y2={62} stroke={DARK} strokeWidth={1.4} opacity={0.6} />
      <line x1={60} y1={46} x2={60} y2={92} stroke={DARK} strokeWidth={1.4} opacity={0.6} />
      {/* Contents */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: stage >= 2 ? 1 : 0 }} transition={{ duration: 0.4 }}>
        <rect x={34} y={50} width={26} height={6} rx={2} fill="hsl(215 15% 45%)" />
        <rect x={62} y={50} width={22} height={6} rx={2} fill="hsl(215 15% 38%)" />
      </motion.g>
      {/* Lid prising off */}
      <motion.g
        initial={{ y: 0, rotate: 0 }}
        animate={{ y: -lidLift, rotate: lidTilt }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        style={{ transformOrigin: '96px 46px' }}
      >
        <rect x={20} y={38} width={80} height={10} rx={2} fill="url(#jt-steel)" stroke={GOLD_DIM} strokeWidth={1} />
        <rect x={20} y={38} width={80} height={2} fill={GOLD_DIM} opacity={0.7} />
      </motion.g>
      <Seam stage={stage} x1={22} y1={48} x2={98} y2={48} />
      {/* Crowbar wedged in, deeper as you go */}
      <motion.g initial={{ opacity: 0, rotate: 0 }}
        animate={{ opacity: stage === 0 ? 0 : 1, rotate: -6 - stage * 7 }}
        transition={{ duration: 0.4 }} style={{ transformOrigin: '26px 46px' }}>
        <rect x={12} y={42} width={22} height={2.6} rx={1.3} fill="hsl(15 30% 45%)" />
      </motion.g>
      <Rivets stage={stage} points={[[28, 52], [92, 52], [28, 86]]} />
    </g>
  );
}

function Briefcase({ stage }: { stage: Stage }) {
  const open = stage >= 2;
  return (
    <g>
      {/* Bottom half */}
      <rect x={24} y={58} width={72} height={34} rx={3} fill="url(#jt-steel)" stroke={GOLD_DIM} strokeWidth={1} />
      {/* Contents: drives and cash */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: open ? 1 : 0 }} transition={{ duration: 0.4 }}>
        <rect x={32} y={64} width={16} height={11} rx={1.5} fill="hsl(190 60% 40%)" />
        <rect x={52} y={64} width={16} height={11} rx={1.5} fill="hsl(190 55% 32%)" />
        <rect x={72} y={64} width={14} height={11} rx={1.5} fill="hsl(140 40% 40%)" />
        <motion.circle cx={40} cy={69} r={1.6} fill="hsl(140 80% 60%)"
          initial={{ opacity: 0.3 }} animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }} />
      </motion.g>
      {/* Lid */}
      <motion.g
        initial={{ rotate: 0 }}
        animate={{ rotate: open ? (stage === 3 ? -112 : -34) : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformOrigin: '24px 58px' }}
      >
        <rect x={24} y={30} width={72} height={30} rx={3} fill="url(#jt-steel)" stroke={GOLD_DIM} strokeWidth={1} />
        <rect x={50} y={26} width={20} height={5} rx={2.5} fill="none" stroke={GOLD_DIM} strokeWidth={1.4} />
      </motion.g>
      {/* Two latches, popping one at a time */}
      {[[40, 58], [80, 58]].map(([x, y], i) => (
        <motion.rect key={i} x={x} y={y - 2} width={8} height={5} rx={1} fill={GOLD}
          initial={{ opacity: 1, y: 0, rotate: 0 }}
          animate={stage > i ? { opacity: 0, y: 16, rotate: 60 } : { opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.4 }} style={{ transformOrigin: `${x + 4}px ${y}px` }} />
      ))}
      <Seam stage={stage} x1={26} y1={59} x2={94} y2={59} />
    </g>
  );
}

function Holdall({ stage }: { stage: Stage }) {
  // A duffel: the zip runs open and the contents push out.
  const zip = [0, 22, 46, 66][stage];
  return (
    <g>
      <path d="M22 60 q0 -16 14 -16 h48 q14 0 14 16 v22 q0 8 -8 8 h-60 q-8 0 -8 -8 z"
        fill="url(#jt-steel)" stroke={GOLD_DIM} strokeWidth={1} />
      {/* Handles */}
      <path d="M46 44 q14 -12 28 0" fill="none" stroke={GOLD_DIM} strokeWidth={2} strokeLinecap="round" />
      {/* Contents bulging out of the opening */}
      <motion.g initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: stage >= 1 ? 1 : 0, scale: 0.7 + stage * 0.12 }}
        transition={{ duration: 0.4 }} style={{ transformOrigin: '60px 56px' }}>
        <rect x={46} y={48} width={14} height={9} rx={2} fill="hsl(140 40% 42%)" />
        <rect x={62} y={50} width={12} height={8} rx={2} fill="hsl(280 40% 45%)" />
      </motion.g>
      {/* Zip line opening from the left */}
      <line x1={26} y1={56} x2={94} y2={56} stroke={DARK} strokeWidth={2} opacity={0.7} />
      <motion.line
        x1={26} y1={56} x2={26} y2={56}
        stroke="hsl(45 95% 65%)" strokeWidth={2.4} strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ opacity: stage === 0 ? 0 : 0.9 }}
        transition={{ duration: 0.3 }}
      />
      <motion.rect
        y={53} width={4} height={6} rx={1} fill={GOLD}
        initial={{ x: 26 }} animate={{ x: 26 + zip }} transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      <Seam stage={stage} x1={26} y1={56} x2={26 + zip} y2={56} />
    </g>
  );
}
