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
  // Diagonal rain lines
  const lines = Array.from({ length: 30 }, (_, i) => ({
    x: (i * 14) % 400,
    delay: Math.random() * 2,
    dur: 0.4 + Math.random() * 0.3,
    len: 8 + Math.random() * 6,
  }));

  return (
    <g opacity="0.35">
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
      {/* Puddle effect */}
      <ellipse cx="100" cy="270" rx="15" ry="3" fill="hsla(210, 50%, 40%, 0.08)" />
      <ellipse cx="250" cy="260" rx="12" ry="2.5" fill="hsla(210, 50%, 40%, 0.06)" />
      <ellipse cx="340" cy="275" rx="10" ry="2" fill="hsla(210, 50%, 40%, 0.07)" />
    </g>
  );
}

function FogOverlay() {
  return (
    <g>
      {/* Fog layers */}
      <motion.rect
        x="0" y="100" width="400" height="80"
        fill="hsla(0, 0%, 80%, 0.04)"
        animate={{ y: [100, 110, 100], opacity: [0.04, 0.08, 0.04] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.rect
        x="0" y="160" width="400" height="100"
        fill="hsla(0, 0%, 80%, 0.06)"
        animate={{ y: [160, 150, 160], opacity: [0.06, 0.1, 0.06] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.rect
        x="0" y="50" width="400" height="60"
        fill="hsla(0, 0%, 80%, 0.03)"
        animate={{ y: [50, 60, 50], opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
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
    <g>
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
    <g>
      {/* Dark overlay */}
      <rect x="0" y="0" width="400" height="290" fill="hsla(240, 20%, 10%, 0.1)" />
      
      {/* Rain (heavier than normal) */}
      {Array.from({ length: 20 }, (_, i) => (
        <motion.line
          key={`storm-rain-${i}`}
          x1={(i * 20) % 400} y1={-10} x2={(i * 20) % 400 - 6} y2={14}
          stroke="hsla(210, 60%, 60%, 0.4)"
          strokeWidth="1"
          strokeLinecap="round"
          animate={{ y1: [-10, 300], y2: [14, 314] }}
          transition={{ duration: 0.3, repeat: Infinity, ease: 'linear', delay: Math.random() * 0.5 }}
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
      
      {/* Warning text */}
      <motion.text x="200" y="15" textAnchor="middle" fill="hsla(270, 60%, 60%, 0.35)" fontSize="6" fontWeight="bold" letterSpacing="3"
        animate={{ opacity: [0.35, 0.15, 0.35] }}
        transition={{ duration: 2.5, repeat: Infinity }}>
        STORM
      </motion.text>
    </g>
  );
}
