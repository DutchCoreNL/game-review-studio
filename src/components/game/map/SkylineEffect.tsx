/**
 * SkylineEffect — Subtle skyline silhouette at the top of the map,
 * plus fog/haze gradient from bottom to top, compass and scale bar.
 */

import { motion } from 'framer-motion';

export function SkylineEffect() {
  return (
    <g pointerEvents="none">
      {/* Skyline silhouette along the top */}
      <path
        d={`
          M 0,18
          L 30,18 L 32,12 L 38,12 L 38,16 L 50,16 L 50,10 L 56,10 L 56,15
          L 80,15 L 82,8 L 86,8 L 86,14 L 100,14 L 100,18
          L 140,18 L 142,6 L 148,6 L 148,14 L 155,14 L 155,10 L 160,10 L 160,16
          L 200,16 L 200,4 L 206,4 L 206,8 L 210,8 L 210,2 L 215,2 L 215,6 L 218,6 L 218,12
          L 240,12 L 242,0 L 248,0 L 248,5 L 252,5 L 252,3 L 256,3 L 256,8 L 260,8 L 260,14
          L 280,14 L 280,8 L 284,8 L 284,12 L 290,12 L 290,16
          L 320,16 L 322,10 L 328,10 L 328,14 L 340,14 L 340,18
          L 360,18 L 360,12 L 366,12 L 366,16 L 380,16 L 380,18
          L 400,18 L 400,0 L 0,0 Z
        `}
        fill="hsla(220, 15%, 6%, 0.7)"
      />

      {/* Skyline window lights (tiny dots on the silhouette) */}
      {[
        [84, 10], [144, 8], [146, 11], [202, 6], [204, 10],
        [212, 4], [213, 7], [244, 2], [246, 6], [250, 5],
        [254, 5], [282, 10], [324, 12], [362, 14],
      ].map(([x, y], i) => (
        <rect key={`skw-${i}`} x={x} y={y} width="1" height="1"
          fill={`hsla(45, 70%, 50%, ${0.08 + (i % 3) * 0.04})`}
          rx="0.1"
        >
          {i % 4 === 0 && (
            <animate attributeName="opacity" values="0.06;0.15;0.04;0.1" dur={`${4 + i}s`} repeatCount="indefinite" />
          )}
        </rect>
      ))}

      {/* Fog/haze gradient from bottom */}
      <defs>
        <linearGradient id="city-fog-gradient" x1="0%" y1="100%" x2="0%" y2="60%">
          <stop offset="0%" stopColor="hsla(220, 15%, 5%, 0.35)" />
          <stop offset="100%" stopColor="hsla(220, 15%, 5%, 0)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="290" fill="url(#city-fog-gradient)" />

      {/* Atmospheric haze - subtle animated layer */}
      <motion.rect x="0" y="220" width="400" height="70" rx="0"
        fill="hsla(220, 20%, 10%, 0.08)"
        animate={{ opacity: [0.06, 0.12, 0.06] }}
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
        {/* N arrow */}
        <path d="M 0,-6 L 1.5,0 L 0,-1 L -1.5,0 Z" fill="hsla(0, 70%, 50%, 0.7)" />
        {/* S arrow */}
        <path d="M 0,6 L 1.5,0 L 0,1 L -1.5,0 Z" fill="hsla(0, 0%, 40%, 0.5)" />
        {/* Cardinal letters */}
        <text x="0" y="-8.5" textAnchor="middle" fontSize="2.5" fill="hsla(0, 70%, 55%, 0.8)" fontWeight="bold">N</text>
        <text x="8.5" y="1" textAnchor="middle" fontSize="2" fill="hsla(0, 0%, 50%, 0.5)">O</text>
        <text x="0" y="10" textAnchor="middle" fontSize="2" fill="hsla(0, 0%, 50%, 0.5)">Z</text>
        <text x="-8.5" y="1" textAnchor="middle" fontSize="2" fill="hsla(0, 0%, 50%, 0.5)">W</text>
      </g>

      {/* Scale bar (bottom-left) */}
      <g transform="translate(55, 278)">
        <line x1="0" y1="0" x2="30" y2="0" stroke="hsla(0, 0%, 45%, 0.4)" strokeWidth="0.8" />
        <line x1="0" y1="-2" x2="0" y2="2" stroke="hsla(0, 0%, 45%, 0.4)" strokeWidth="0.5" />
        <line x1="30" y1="-2" x2="30" y2="2" stroke="hsla(0, 0%, 45%, 0.4)" strokeWidth="0.5" />
        <text x="15" y="-3" textAnchor="middle" fontSize="2.5" fill="hsla(0, 0%, 40%, 0.5)" fontFamily="monospace">500m</text>
      </g>
    </g>
  );
}
