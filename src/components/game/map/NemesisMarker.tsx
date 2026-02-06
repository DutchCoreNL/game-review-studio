import { NemesisState, DistrictId } from '@/game/types';
import { motion } from 'framer-motion';

interface NemesisMarkerProps {
  nemesis: NemesisState;
  districtMeta: Record<DistrictId, { cx: number; cy: number }>;
}

export function NemesisMarker({ nemesis, districtMeta }: NemesisMarkerProps) {
  if (nemesis.cooldown > 0) return null;

  const meta = districtMeta[nemesis.location];
  if (!meta) return null;

  const x = meta.cx + 25;
  const y = meta.cy + 15;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Pulsing danger ring */}
      <motion.circle
        r="8"
        fill="none"
        stroke="hsla(0, 80%, 50%, 0.3)"
        strokeWidth="1"
        animate={{ r: [8, 14, 8], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Skull background */}
      <circle r="6" fill="hsla(0, 80%, 20%, 0.9)" stroke="hsla(0, 80%, 50%, 0.6)" strokeWidth="1" />
      {/* Skull icon */}
      <text
        x="0" y="3"
        textAnchor="middle"
        fontSize="7"
        fill="hsla(0, 80%, 60%, 0.9)"
      >
        💀
      </text>
      {/* Name label */}
      <rect x="-18" y="8" width="36" height="7" rx="2" fill="hsla(0, 0%, 5%, 0.9)" stroke="hsla(0, 80%, 50%, 0.4)" strokeWidth="0.5" />
      <text x="0" y="13.5" textAnchor="middle" fontSize="3.5" fill="hsla(0, 80%, 60%, 0.9)" fontWeight="bold">
        {nemesis.name.split(' ')[0]}
      </text>
    </g>
  );
}
