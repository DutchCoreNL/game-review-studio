import { motion } from 'framer-motion';
import type { TimeOfDay } from '@/hooks/useWorldState';

interface TimeOfDayOverlayProps {
  timeOfDay: TimeOfDay;
}

export function TimeOfDayOverlay({ timeOfDay }: TimeOfDayOverlayProps) {
  switch (timeOfDay) {
    case 'dawn':
      return <DawnOverlay />;
    case 'dusk':
      return <DuskOverlay />;
    case 'night':
      return <NightOverlay />;
    default:
      return null; // day = no overlay
  }
}

function DawnOverlay() {
  return (
    <g pointerEvents="none">
      {/* Warm orange-gold tint */}
      <rect x="0" y="0" width="400" height="290" fill="hsla(30, 80%, 50%, 0.06)" />
      {/* Horizon glow */}
      <motion.ellipse
        cx="200" cy="280" rx="250" ry="60"
        fill="hsla(25, 90%, 55%, 0.08)"
        animate={{ ry: [60, 70, 60], opacity: [0.08, 0.12, 0.08] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Soft golden light on rooftops */}
      {[
        { x: 85, y: 60, w: 50 },
        { x: 240, y: 38, w: 70 },
        { x: 160, y: 166, w: 70 },
        { x: 285, y: 168, w: 75 },
      ].map((r, i) => (
        <motion.rect key={`dawn-roof-${i}`}
          x={r.x} y={r.y} width={r.w} height={2}
          fill="hsla(35, 80%, 60%, 0.12)"
          animate={{ opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </g>
  );
}

function DuskOverlay() {
  return (
    <g pointerEvents="none">
      {/* Purple-pink gradient tint */}
      <rect x="0" y="0" width="400" height="145" fill="hsla(280, 40%, 30%, 0.06)" />
      <rect x="0" y="145" width="400" height="145" fill="hsla(320, 50%, 35%, 0.05)" />
      {/* Horizon glow — warm pink */}
      <motion.ellipse
        cx="200" cy="280" rx="250" ry="50"
        fill="hsla(340, 60%, 50%, 0.07)"
        animate={{ ry: [50, 55, 50], opacity: [0.07, 0.1, 0.07] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Early neon hints on Neon Mile */}
      {[
        { cx: 333, cy: 130, r: 12, color: 'hsla(290, 80%, 60%, 0.06)' },
        { cx: 355, cy: 145, r: 8, color: 'hsla(180, 80%, 60%, 0.05)' },
      ].map((n, i) => (
        <motion.circle key={`dusk-neon-${i}`}
          cx={n.cx} cy={n.cy} r={n.r}
          fill={n.color}
          animate={{ opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </g>
  );
}

function NightOverlay() {
  return (
    <g pointerEvents="none">
      {/* Dark blue overlay */}
      <rect x="0" y="0" width="400" height="290" fill="hsla(220, 50%, 8%, 0.18)" />
      {/* Stars */}
      {[
        { cx: 50, cy: 12 }, { cx: 130, cy: 8 }, { cx: 210, cy: 15 },
        { cx: 290, cy: 6 }, { cx: 350, cy: 18 }, { cx: 80, cy: 25 },
        { cx: 170, cy: 5 }, { cx: 380, cy: 10 },
      ].map((s, i) => (
        <motion.circle key={`star-${i}`}
          cx={s.cx} cy={s.cy} r={0.6}
          fill="hsla(0, 0%, 90%, 0.4)"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
        />
      ))}
      {/* Enhanced neon glows */}
      {[
        { cx: 333, cy: 130, r: 18, color: 'hsla(290, 80%, 60%, 0.1)' },
        { cx: 355, cy: 145, r: 12, color: 'hsla(180, 80%, 60%, 0.08)' },
        { cx: 345, cy: 120, r: 15, color: 'hsla(330, 80%, 60%, 0.07)' },
      ].map((n, i) => (
        <motion.circle key={`night-neon-${i}`}
          cx={n.cx} cy={n.cy} r={n.r}
          fill={n.color}
          animate={{ r: [n.r, n.r + 3, n.r], opacity: [0.08, 0.14, 0.08] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* Street lights */}
      {[
        { cx: 100, cy: 255 }, { cx: 180, cy: 250 },
        { cx: 260, cy: 248 }, { cx: 340, cy: 252 },
      ].map((l, i) => (
        <motion.circle key={`streetlight-${i}`}
          cx={l.cx} cy={l.cy} r={6}
          fill="hsla(45, 80%, 60%, 0.06)"
          animate={{ opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
        />
      ))}
    </g>
  );
}
