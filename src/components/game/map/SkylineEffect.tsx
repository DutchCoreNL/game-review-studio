/**
 * SkylineEffect — Mountain/hill silhouette background (right + top),
 * fog/haze gradient, compass and scale bar.
 */

import { motion } from 'framer-motion';

export function SkylineEffect() {
  return (
    <g pointerEvents="none">
      {/* === MOUNTAIN SILHOUETTE — right and top background === */}
      {/* Far mountains (behind Crown Heights) */}
      <path
        d={`
          M 220,0 L 240,0 L 250,20 L 265,5 L 280,18 L 295,0
          L 330,0 L 345,12 L 355,3 L 370,15 L 385,0 L 400,0
          L 400,45 Q 385,35 370,42 Q 355,30 340,38
          Q 325,28 310,35 Q 295,22 280,30 Q 265,18 250,28 Q 240,22 220,30 Z
        `}
        fill="hsla(220, 18%, 5%, 0.8)"
      />

      {/* Closer hills (right side, behind Neon/Lowrise) */}
      <path
        d={`
          M 340,100 Q 355,85 370,92 Q 385,78 400,88 L 400,130
          Q 385,120 370,125 Q 355,115 340,122 Z
        `}
        fill="hsla(220, 15%, 7%, 0.6)"
      />

      {/* Hill behind Crown Heights (villa hill) */}
      <path
        d={`
          M 260,50 Q 280,30 300,38 Q 320,28 340,45
          Q 330,55 310,52 Q 290,48 270,55 Z
        `}
        fill="hsla(120, 10%, 7%, 0.4)"
      />

      {/* Mountain snow caps (subtle) */}
      {[
        [265, 5, 8], [355, 3, 6], [295, 0, 5],
      ].map(([x, y, w], i) => (
        <path key={`snow-${i}`}
          d={`M ${x - w / 2},${y + 4} L ${x},${y} L ${x + w / 2},${y + 4}`}
          fill="hsla(210, 15%, 20%, 0.15)" />
      ))}

      {/* Distant city lights on mountains */}
      {[
        [360, 10], [375, 8], [380, 13], [345, 14], [258, 22],
        [275, 16], [290, 12], [350, 8],
      ].map(([x, y], i) => (
        <rect key={`ml-${i}`} x={x} y={y} width="1" height="0.8"
          fill={`hsla(45, 60%, 45%, ${0.04 + (i % 3) * 0.02})`}
          rx="0.1"
        >
          {i % 3 === 0 && (
            <animate attributeName="opacity" values="0.04;0.1;0.03;0.07" dur={`${5 + i}s`} repeatCount="indefinite" />
          )}
        </rect>
      ))}

      {/* Fog/haze gradient from bottom */}
      <defs>
        <linearGradient id="city-fog-gradient" x1="0%" y1="100%" x2="0%" y2="60%">
          <stop offset="0%" stopColor="hsla(220, 15%, 4%, 0.4)" />
          <stop offset="100%" stopColor="hsla(220, 15%, 4%, 0)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="290" fill="url(#city-fog-gradient)" />

      {/* Atmospheric haze - subtle animated layer */}
      <motion.rect x="0" y="230" width="400" height="60" rx="0"
        fill="hsla(220, 20%, 8%, 0.06)"
        animate={{ opacity: [0.04, 0.1, 0.04] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </g>
  );
}

export function MapOverlayUI() {
  return (
    <g pointerEvents="none">
      {/* Compass rose (top-right area) */}
      <g transform="translate(378, 26)">
        <circle r="8" fill="hsla(0, 0%, 5%, 0.7)" stroke="hsla(0, 0%, 25%, 0.4)" strokeWidth="0.5" />
        <path d="M 0,-6 L 1.5,0 L 0,-1 L -1.5,0 Z" fill="hsla(0, 70%, 50%, 0.7)" />
        <path d="M 0,6 L 1.5,0 L 0,1 L -1.5,0 Z" fill="hsla(0, 0%, 40%, 0.5)" />
        <text x="0" y="-8.5" textAnchor="middle" fontSize="2.5" fill="hsla(0, 70%, 55%, 0.8)" fontWeight="bold">N</text>
        <text x="8.5" y="1" textAnchor="middle" fontSize="2" fill="hsla(0, 0%, 50%, 0.5)">O</text>
        <text x="0" y="10" textAnchor="middle" fontSize="2" fill="hsla(0, 0%, 50%, 0.5)">Z</text>
        <text x="-8.5" y="1" textAnchor="middle" fontSize="2" fill="hsla(0, 0%, 50%, 0.5)">W</text>
      </g>

      {/* Scale bar (bottom-left) */}
      <g transform="translate(60, 278)">
        <line x1="0" y1="0" x2="30" y2="0" stroke="hsla(0, 0%, 45%, 0.4)" strokeWidth="0.8" />
        <line x1="0" y1="-2" x2="0" y2="2" stroke="hsla(0, 0%, 45%, 0.4)" strokeWidth="0.5" />
        <line x1="30" y1="-2" x2="30" y2="2" stroke="hsla(0, 0%, 45%, 0.4)" strokeWidth="0.5" />
        <text x="15" y="-3" textAnchor="middle" fontSize="2.5" fill="hsla(0, 0%, 40%, 0.5)" fontFamily="monospace">500m</text>
      </g>
    </g>
  );
}
