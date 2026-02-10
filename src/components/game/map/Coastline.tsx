/**
 * Coastline — Western waterfront, canal between upper/lower city,
 * and water reflections. Rendered as the lowest layer of the map.
 */

import { motion } from 'framer-motion';

export function Coastline() {
  return (
    <g pointerEvents="none">
      {/* === DEEP WATER — left edge (harbor/port area) === */}
      <path
        d="M 0,0 L 50,0 Q 55,40 52,80 Q 48,120 55,160 Q 52,180 50,200 Q 48,230 52,260 L 50,290 L 0,290 Z"
        fill="hsla(210, 50%, 6%, 0.95)"
      />
      {/* Shallow water transition */}
      <path
        d="M 50,0 Q 55,40 52,80 Q 48,120 55,160 Q 52,180 50,200 Q 48,230 52,260 L 50,290"
        fill="none"
        stroke="hsla(210, 40%, 12%, 0.5)"
        strokeWidth="5"
      />
      {/* Kade / dock wall */}
      <path
        d="M 50,0 Q 55,40 52,80 Q 48,120 55,160 Q 52,180 50,200 Q 48,230 52,260 L 50,290"
        fill="none"
        stroke="hsla(30, 20%, 16%, 0.6)"
        strokeWidth="1.5"
      />

      {/* === CANAL — horizontal waterway separating upper (Port/Crown) from lower (Iron/Neon/Low) === */}
      <path
        d="M 0,148 Q 60,145 120,150 Q 180,155 240,148 Q 300,142 350,150 Q 380,153 400,150"
        fill="none"
        stroke="hsla(210, 45%, 8%, 0.9)"
        strokeWidth="14"
      />
      {/* Canal edges */}
      <path
        d="M 0,141 Q 60,138 120,143 Q 180,148 240,141 Q 300,135 350,143 Q 380,146 400,143"
        fill="none"
        stroke="hsla(30, 15%, 14%, 0.5)"
        strokeWidth="1"
      />
      <path
        d="M 0,155 Q 60,152 120,157 Q 180,162 240,155 Q 300,149 350,157 Q 380,160 400,157"
        fill="none"
        stroke="hsla(30, 15%, 14%, 0.5)"
        strokeWidth="1"
      />

      {/* Canal water fill */}
      <path
        d="M 0,141 Q 60,138 120,143 Q 180,148 240,141 Q 300,135 350,143 Q 380,146 400,143
           L 400,157 Q 380,160 350,157 Q 300,149 240,155 Q 180,162 120,157 Q 60,152 0,155 Z"
        fill="hsla(210, 45%, 7%, 0.85)"
      />

      {/* Water surface reflections — coastline */}
      {[30, 60, 100, 140, 180, 220, 260].map((y, i) => (
        <motion.path
          key={`wr-${i}`}
          d={`M ${8 + i * 2},${y} Q ${22 + i},${y - 2} ${38 - i},${y}`}
          fill="none"
          stroke={`hsla(210, 50%, 22%, ${0.06 + i * 0.01})`}
          strokeWidth="0.5"
          animate={{ y: [0, 1.5, 0] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
        />
      ))}

      {/* Canal water reflections */}
      {[100, 160, 230, 310, 370].map((x, i) => (
        <motion.path
          key={`cr-${i}`}
          d={`M ${x},${147 + (i % 2) * 2} Q ${x + 10},${145 + (i % 2) * 2} ${x + 20},${147 + (i % 2) * 2}`}
          fill="none"
          stroke={`hsla(210, 40%, 20%, ${0.05 + i * 0.01})`}
          strokeWidth="0.4"
          animate={{ y: [0, 1, 0] }}
          transition={{ duration: 4 + i * 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 1.2 }}
        />
      ))}

      {/* Dock bollards along kade */}
      {[50, 80, 110, 170, 200, 230, 260].map((y, i) => {
        const kx = 52 + (i % 2) * 2;
        return (
          <circle key={`bollard-${i}`} cx={kx} cy={y} r="1" fill="hsla(30, 15%, 22%, 0.5)" />
        );
      })}

      {/* === BRIDGES over canal === */}
      {/* Bridge 1 — connecting Port to Iron */}
      <g>
        <rect x="80" y="140" width="4" height="18" fill="hsla(0, 0%, 15%, 0.6)" rx="0.3" />
        <rect x="95" y="140" width="4" height="18" fill="hsla(0, 0%, 15%, 0.6)" rx="0.3" />
        <rect x="78" y="140" width="24" height="3" fill="hsla(30, 15%, 14%, 0.8)" rx="0.5" />
        <line x1="78" y1="140" x2="102" y2="140" stroke="hsla(0, 0%, 25%, 0.4)" strokeWidth="0.5" />
        <line x1="78" y1="143" x2="102" y2="143" stroke="hsla(0, 0%, 25%, 0.4)" strokeWidth="0.5" />
      </g>

      {/* Bridge 2 — connecting Crown to Neon (larger bridge / snelweg) */}
      <g>
        <rect x="270" y="138" width="5" height="20" fill="hsla(0, 0%, 14%, 0.6)" rx="0.3" />
        <rect x="290" y="138" width="5" height="20" fill="hsla(0, 0%, 14%, 0.6)" rx="0.3" />
        <rect x="268" y="138" width="30" height="4" fill="hsla(30, 12%, 12%, 0.85)" rx="0.5" />
        <line x1="268" y1="138" x2="298" y2="138" stroke="hsla(45, 30%, 25%, 0.3)" strokeWidth="0.6" />
        <line x1="268" y1="142" x2="298" y2="142" stroke="hsla(45, 30%, 25%, 0.3)" strokeWidth="0.6" />
        {/* Bridge arches */}
        <path d="M 272,158 Q 278,163 284,158" fill="none" stroke="hsla(210, 25%, 15%, 0.25)" strokeWidth="0.5" />
        <path d="M 284,158 Q 290,163 296,158" fill="none" stroke="hsla(210, 25%, 15%, 0.25)" strokeWidth="0.5" />
      </g>

      {/* Bridge 3 — central/smaller bridge */}
      <g>
        <rect x="180" y="141" width="3" height="16" fill="hsla(0, 0%, 15%, 0.5)" rx="0.2" />
        <rect x="193" y="141" width="3" height="16" fill="hsla(0, 0%, 15%, 0.5)" rx="0.2" />
        <rect x="178" y="141" width="20" height="3" fill="hsla(30, 12%, 13%, 0.75)" rx="0.5" />
      </g>

      {/* === RAILWAY TRACK crossing Iron Borough === */}
      <g>
        <line x1="55" y1="215" x2="170" y2="215" stroke="hsla(0, 0%, 20%, 0.3)" strokeWidth="1" />
        <line x1="55" y1="217" x2="170" y2="217" stroke="hsla(0, 0%, 20%, 0.3)" strokeWidth="1" />
        {Array.from({ length: 14 }).map((_, i) => (
          <rect key={`rtie-${i}`} x={57 + i * 8} y="214" width="1.5" height="4" fill="hsla(25, 15%, 16%, 0.25)" rx="0.2" />
        ))}
      </g>
    </g>
  );
}
