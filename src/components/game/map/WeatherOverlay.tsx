import { WeatherType } from '@/game/types';
import { motion } from 'framer-motion';

interface WeatherOverlayProps {
  weather: WeatherType;
}

export function WeatherOverlay({ weather }: WeatherOverlayProps) {
  switch (weather) {
    case 'rain':
      return <RainOverlay />;
    case 'fog':
      return <FogOverlay />;
    case 'heatwave':
      return <HeatwaveOverlay />;
    case 'storm':
      return <StormOverlay />;
    default:
      return null;
  }
}

function RainOverlay() {
  const lines = Array.from({ length: 40 }, (_, i) => ({
    x: (i * 10.5) % 400,
    delay: Math.random() * 2,
    dur: 0.35 + Math.random() * 0.25,
    len: 8 + Math.random() * 6,
  }));

  // Roof reflection positions (building tops)
  const reflections = [
    { cx: 95, cy: 62, rx: 9, ry: 1.5 },
    { cx: 122, cy: 58, rx: 7, ry: 1.2 },
    { cx: 247, cy: 40, rx: 7, ry: 1 },
    { cx: 262, cy: 48, rx: 6, ry: 1 },
    { cx: 170, cy: 168, rx: 11, ry: 1.5 },
    { cx: 194, cy: 172, rx: 9, ry: 1.2 },
    { cx: 292, cy: 172, rx: 7, ry: 1 },
    { cx: 323, cy: 170, rx: 8, ry: 1.2 },
  ];

  return (
    <g opacity="0.35" pointerEvents="none">
      {lines.map((l, i) => (
        <motion.line
          key={`rain-${i}`}
          x1={l.x} y1={-10} x2={l.x - 4} y2={l.len}
          stroke="hsla(210, 60%, 60%, 0.5)"
          strokeWidth="0.8"
          strokeLinecap="round"
          animate={{ y1: [-10, 300], y2: [l.len - 10, 300 + l.len] }}
          transition={{ duration: l.dur, repeat: Infinity, ease: 'linear', delay: l.delay }}
        />
      ))}
      
      {/* Roof reflections - wet surfaces */}
      {reflections.map((r, i) => (
        <motion.ellipse key={`roof-ref-${i}`}
          cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry}
          fill="hsla(210, 50%, 50%, 0.08)"
          animate={{ opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      
      {/* Puddles on ground */}
      <motion.ellipse cx="100" cy="270" rx="15" ry="3" fill="hsla(210, 50%, 40%, 0.08)"
        animate={{ rx: [15, 16, 15], opacity: [0.08, 0.12, 0.08] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.ellipse cx="250" cy="260" rx="12" ry="2.5" fill="hsla(210, 50%, 40%, 0.06)"
        animate={{ rx: [12, 13, 12], opacity: [0.06, 0.1, 0.06] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
      <motion.ellipse cx="340" cy="275" rx="10" ry="2" fill="hsla(210, 50%, 40%, 0.07)"
        animate={{ rx: [10, 11, 10], opacity: [0.07, 0.11, 0.07] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
      <ellipse cx="170" cy="265" rx="8" ry="1.8" fill="hsla(210, 50%, 40%, 0.05)" />
      
      {/* Rain splash effects */}
      {[80, 160, 280, 350].map((x, i) => (
        <motion.circle key={`splash-${i}`} cx={x} cy={268 + i * 3} r="0.5"
          fill="hsla(210, 60%, 60%, 0.2)"
          animate={{ r: [0.5, 2, 0.5], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.3 + Math.random() }}
        />
      ))}
    </g>
  );
}

function FogOverlay() {
  return (
    <g pointerEvents="none">
      {/* Multiple organic fog layers */}
      <motion.ellipse cx="100" cy="120" rx="120" ry="35"
        fill="hsla(0, 0%, 80%, 0.03)"
        animate={{ cx: [100, 130, 100], ry: [35, 40, 35], opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.ellipse cx="280" cy="170" rx="100" ry="45"
        fill="hsla(0, 0%, 80%, 0.04)"
        animate={{ cx: [280, 260, 280], ry: [45, 50, 45], opacity: [0.04, 0.07, 0.04] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      <motion.ellipse cx="200" cy="80" rx="150" ry="30"
        fill="hsla(0, 0%, 80%, 0.025)"
        animate={{ cx: [200, 220, 200], opacity: [0.025, 0.05, 0.025] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />
      <motion.ellipse cx="60" cy="230" rx="80" ry="25"
        fill="hsla(0, 0%, 80%, 0.035)"
        animate={{ cx: [60, 80, 60], opacity: [0.035, 0.06, 0.035] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.ellipse cx="350" cy="100" rx="60" ry="20"
        fill="hsla(0, 0%, 80%, 0.03)"
        animate={{ cx: [350, 340, 350], opacity: [0.03, 0.055, 0.03] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />
      
      {/* Low ground fog — denser */}
      <motion.rect
        x="0" y="240" width="400" height="50"
        fill="hsla(0, 0%, 80%, 0.04)"
        animate={{ y: [240, 235, 240], opacity: [0.04, 0.07, 0.04] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Fog text */}
      <text x="200" y="15" textAnchor="middle" fill="hsla(0, 0%, 60%, 0.25)" fontSize="6" fontWeight="bold" letterSpacing="3">
        MIST
      </text>
    </g>
  );
}

function HeatwaveOverlay() {
  return (
    <g pointerEvents="none">
      {/* Red/orange glow */}
      <rect x="0" y="0" width="400" height="290" fill="hsla(0, 80%, 40%, 0.04)" />
      
      {/* Heat shimmer lines */}
      {[60, 120, 180, 230].map((y, i) => (
        <motion.path
          key={`heat-${i}`}
          d={`M 0,${y} Q 100,${y - 3} 200,${y} Q 300,${y + 3} 400,${y}`}
          fill="none"
          stroke="hsla(30, 80%, 50%, 0.06)"
          strokeWidth="2"
          animate={{ d: [
            `M 0,${y} Q 100,${y - 3} 200,${y} Q 300,${y + 3} 400,${y}`,
            `M 0,${y} Q 100,${y + 3} 200,${y} Q 300,${y - 3} 400,${y}`,
            `M 0,${y} Q 100,${y - 3} 200,${y} Q 300,${y + 3} 400,${y}`,
          ]}}
          transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      
      {/* Extra steam from factories in heat */}
      <motion.circle cx="166" cy="148" r="3" fill="hsla(30, 50%, 50%, 0.1)"
        animate={{ cy: [148, 138, 128], r: [3, 5, 7], opacity: [0.12, 0.06, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }} />
      <motion.circle cx="191" cy="152" r="2.5" fill="hsla(30, 50%, 50%, 0.08)"
        animate={{ cy: [152, 142, 132], r: [2.5, 4, 6], opacity: [0.1, 0.05, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeOut', delay: 1.5 }} />
      
      {/* Warning text */}
      <motion.text x="200" y="15" textAnchor="middle" fill="hsla(0, 80%, 50%, 0.3)" fontSize="6" fontWeight="bold" letterSpacing="3"
        animate={{ opacity: [0.3, 0.15, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}>
        HITTEGOLF
      </motion.text>
    </g>
  );
}

function StormOverlay() {
  return (
    <g pointerEvents="none">
      {/* Dark overlay */}
      <rect x="0" y="0" width="400" height="290" fill="hsla(240, 20%, 10%, 0.12)" />
      
      {/* Heavy rain */}
      {Array.from({ length: 30 }, (_, i) => (
        <motion.line
          key={`storm-rain-${i}`}
          x1={(i * 14) % 400} y1={-10} x2={(i * 14) % 400 - 8} y2={18}
          stroke="hsla(210, 60%, 60%, 0.4)"
          strokeWidth="1"
          strokeLinecap="round"
          animate={{ y1: [-10, 300], y2: [18, 318] }}
          transition={{ duration: 0.25, repeat: Infinity, ease: 'linear', delay: Math.random() * 0.5 }}
        />
      ))}
      
      {/* Wet building roofs */}
      {[
        { x: 85, y: 62, w: 50, h: 1.5 },
        { x: 240, y: 40, w: 70, h: 1.5 },
        { x: 160, y: 168, w: 70, h: 1.5 },
        { x: 285, y: 170, w: 75, h: 1.5 },
      ].map((r, i) => (
        <motion.rect key={`wet-${i}`}
          x={r.x} y={r.y} width={r.w} height={r.h}
          fill="hsla(210, 50%, 50%, 0.1)"
          animate={{ opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      
      {/* Lightning flash */}
      <motion.rect
        x="0" y="0" width="400" height="290"
        fill="hsla(0, 0%, 100%, 0.15)"
        animate={{ opacity: [0, 0, 0, 0, 0, 0.15, 0, 0.08, 0, 0, 0, 0, 0, 0, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      
      {/* Lightning bolt */}
      <motion.path
        d="M 180,0 L 175,40 L 185,42 L 170,80"
        fill="none"
        stroke="hsla(50, 100%, 70%, 0.6)"
        strokeWidth="1.5"
        animate={{ opacity: [0, 0, 0, 0, 0.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      
      {/* Second lightning bolt */}
      <motion.path
        d="M 310,0 L 305,30 L 315,32 L 298,65"
        fill="none"
        stroke="hsla(50, 100%, 70%, 0.4)"
        strokeWidth="1"
        animate={{ opacity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.4, 0, 0.2, 0, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      
      {/* Warning text */}
      <motion.text x="200" y="15" textAnchor="middle" fill="hsla(270, 60%, 60%, 0.35)" fontSize="6" fontWeight="bold" letterSpacing="3"
        animate={{ opacity: [0.35, 0.15, 0.35] }}
        transition={{ duration: 2.5, repeat: Infinity }}>
        STORM
      </motion.text>
    </g>
  );
}
