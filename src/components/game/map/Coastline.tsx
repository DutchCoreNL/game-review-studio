/**
 * Coastline — Western waterfront with kade, bridge, and water reflections.
 * Rendered as the lowest layer of the map.
 */

import { motion } from 'framer-motion';

export function Coastline() {
  return (
    <g pointerEvents="none">
      {/* Deep water area (western edge) */}
      <path
        d="M 0,0 L 42,0 Q 48,30 45,60 Q 42,90 48,120 Q 50,150 44,180 Q 40,210 46,240 Q 48,260 42,290 L 0,290 Z"
        fill="hsla(210, 50%, 8%, 0.95)"
      />
      {/* Shallow water / transition */}
      <path
        d="M 42,0 Q 48,30 45,60 Q 42,90 48,120 Q 50,150 44,180 Q 40,210 46,240 Q 48,260 42,290"
        fill="none"
        stroke="hsla(210, 40%, 15%, 0.6)"
        strokeWidth="6"
      />
      {/* Kade / dock wall */}
      <path
        d="M 42,0 Q 48,30 45,60 Q 42,90 48,120 Q 50,150 44,180 Q 40,210 46,240 Q 48,260 42,290"
        fill="none"
        stroke="hsla(30, 20%, 18%, 0.7)"
        strokeWidth="2"
      />

      {/* Water surface reflections */}
      {[25, 55, 95, 135, 175, 215, 255].map((y, i) => (
        <motion.path
          key={`wr-${i}`}
          d={`M ${8 + i * 2},${y} Q ${20 + i},${y - 2} ${32 - i},${y}`}
          fill="none"
          stroke={`hsla(210, 50%, 25%, ${0.08 + i * 0.01})`}
          strokeWidth="0.5"
          animate={{ y: [0, 1.5, 0] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
        />
      ))}

      {/* Dock bollards along kade */}
      {[50, 80, 110, 170, 200, 230].map((y, i) => {
        const kx = 44 + (i % 2) * 2;
        return (
          <g key={`bollard-${i}`}>
            <circle cx={kx} cy={y} r="1" fill="hsla(30, 15%, 25%, 0.6)" />
          </g>
        );
      })}

      {/* === BRIDGE from Port Nero to Lowrise === */}
      <g>
        {/* Bridge roadway */}
        <rect x="30" y="195" width="22" height="4" fill="hsla(30, 15%, 15%, 0.8)" rx="0.5" />
        {/* Bridge railings */}
        <line x1="30" y1="195" x2="52" y2="195" stroke="hsla(0, 0%, 25%, 0.5)" strokeWidth="0.5" />
        <line x1="30" y1="199" x2="52" y2="199" stroke="hsla(0, 0%, 25%, 0.5)" strokeWidth="0.5" />
        {/* Bridge supports */}
        {[34, 40, 46].map((x, i) => (
          <rect key={`bsup-${i}`} x={x} y="195" width="1.5" height="8" fill="hsla(0, 0%, 18%, 0.6)" rx="0.2" />
        ))}
        {/* Bridge arches (under bridge, reflected in water) */}
        <path d="M 33,203 Q 37,208 41,203" fill="none" stroke="hsla(210, 30%, 18%, 0.3)" strokeWidth="0.5" />
        <path d="M 41,203 Q 45,208 49,203" fill="none" stroke="hsla(210, 30%, 18%, 0.3)" strokeWidth="0.5" />
      </g>

      {/* === RAILWAY TRACK crossing Iron Borough area === */}
      <g>
        <line x1="130" y1="210" x2="260" y2="210" stroke="hsla(0, 0%, 22%, 0.35)" strokeWidth="1" />
        <line x1="130" y1="212" x2="260" y2="212" stroke="hsla(0, 0%, 22%, 0.35)" strokeWidth="1" />
        {/* Rail ties */}
        {Array.from({ length: 16 }).map((_, i) => (
          <rect key={`rtie-${i}`} x={132 + i * 8} y="209" width="1.5" height="4" fill="hsla(25, 15%, 18%, 0.3)" rx="0.2" />
        ))}
      </g>
    </g>
  );
}
