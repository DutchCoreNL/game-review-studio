import { NemesisState, DistrictId } from '@/game/types';
import { motion } from 'framer-motion';

interface NemesisMarkerProps {
  nemesis: NemesisState;
  districtMeta: Record<DistrictId, { cx: number; cy: number }>;
}

export function NemesisMarker({ nemesis, districtMeta }: NemesisMarkerProps) {
  if (!nemesis.alive || nemesis.cooldown > 0) return null;

  const meta = districtMeta[nemesis.location];
  if (!meta) return null;

  const x = meta.cx + 25;
  const y = meta.cy + 15;
  const powerScale = 0.5 + (nemesis.power / 100) * 0.5; // 0.5 - 1.0

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Outermost menacing glow — slow breathe */}
      <motion.circle
        r="18"
        fill="none"
        stroke="hsla(0, 80%, 40%, 0.12)"
        strokeWidth="0.8"
        animate={{
          r: [16, 22, 16],
          opacity: [0.12, 0.04, 0.12],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Mid glow ring — faster pulse */}
      <motion.circle
        r="12"
        fill="none"
        stroke="hsla(0, 80%, 50%, 0.2)"
        strokeWidth="1"
        animate={{
          r: [10, 15, 10],
          opacity: [0.2, 0.05, 0.2],
          strokeWidth: [1, 0.5, 1],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Inner pulsing danger ring */}
      <motion.circle
        r="8"
        fill="none"
        stroke="hsla(0, 80%, 50%, 0.35)"
        strokeWidth="1.2"
        animate={{
          r: [7, 10, 7],
          opacity: [0.35, 0.1, 0.35],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Red ambient glow fill */}
      <motion.circle
        r="10"
        fill="hsla(0, 80%, 40%, 0.06)"
        animate={{
          r: [10, 14, 10],
          opacity: [0.06, 0.02, 0.06],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Skull background — slight hover */}
      <motion.circle
        r={6 * powerScale + 1}
        fill="hsla(0, 80%, 15%, 0.95)"
        stroke="hsla(0, 80%, 50%, 0.7)"
        strokeWidth="1.2"
        animate={{
          y: [0, -1, 0, 1, 0],
          scale: [1, 1.05, 1, 0.98, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Skull icon */}
      <motion.text
        x="0" y="3.5"
        textAnchor="middle"
        fontSize={7 * powerScale + 1}
        fill="hsla(0, 80%, 60%, 0.95)"
        animate={{
          y: [3.5, 2.5, 3.5, 4.5, 3.5],
          opacity: [0.95, 1, 0.95, 0.9, 0.95],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        💀
      </motion.text>

      {/* Name label with glow */}
      <motion.rect
        x="-20" y="9"
        width="40" height="8"
        rx="2.5"
        fill="hsla(0, 0%, 3%, 0.95)"
        stroke="hsla(0, 80%, 50%, 0.5)"
        strokeWidth="0.6"
        animate={{
          stroke: [
            'hsla(0, 80%, 50%, 0.5)',
            'hsla(0, 80%, 50%, 0.8)',
            'hsla(0, 80%, 50%, 0.5)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <text
        x="0" y="14.8"
        textAnchor="middle"
        fontSize="4"
        fill="hsla(0, 80%, 60%, 0.95)"
        fontWeight="bold"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {nemesis.name.split(' ')[0]}
      </text>

      {/* Power indicator dots */}
      {nemesis.power > 30 && (
        <motion.circle
          cx="-14" cy="4"
          r="1.5"
          fill="hsla(0, 80%, 50%, 0.6)"
          animate={{ opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
      {nemesis.power > 60 && (
        <motion.circle
          cx="14" cy="4"
          r="1.5"
          fill="hsla(0, 80%, 50%, 0.6)"
          animate={{ opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
        />
      )}
      {nemesis.power > 80 && (
        <motion.circle
          cx="0" cy="-10"
          r="1.5"
          fill="hsla(0, 80%, 50%, 0.6)"
          animate={{ opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
        />
      )}
    </g>
  );
}
