import { motion } from 'framer-motion';
import { DistrictId } from '@/game/types';

interface TravelAnimationProps {
  from: DistrictId;
  to: DistrictId;
  districtMeta: Record<DistrictId, { cx: number; cy: number }>;
}

export function TravelAnimation({ from, to, districtMeta }: TravelAnimationProps) {
  const fromMeta = districtMeta[from];
  const toMeta = districtMeta[to];
  if (!fromMeta || !toMeta) return null;

  const startX = fromMeta.cx, startY = fromMeta.cy - 18;
  const endX = toMeta.cx, endY = toMeta.cy - 18;

  return (
    <g pointerEvents="none">
      <motion.line x1={startX} y1={startY} x2={startX} y2={startY}
        stroke="hsla(45, 93%, 50%, 0.4)" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round"
        animate={{ x2: endX, y2: endY }} transition={{ duration: 0.6, ease: 'easeOut' }} />
      <motion.g initial={{ x: startX, y: startY, scale: 1 }}
        animate={{ x: endX, y: endY, scale: [1, 1.3, 1] }}
        exit={{ opacity: 0, scale: 0 }} transition={{ duration: 0.8, ease: 'easeInOut' }}>
        <motion.circle r="6" fill="none" stroke="hsla(45, 93%, 50%, 0.3)" strokeWidth="1"
          animate={{ r: [5, 8, 5], opacity: [0.3, 0.1, 0.3] }} transition={{ duration: 0.5, repeat: Infinity }} />
        <circle r="3" fill="hsl(45, 93%, 50%)" />
        <circle r="1.5" fill="hsl(45, 93%, 70%)" />
      </motion.g>
      <motion.circle cx={endX} cy={endY} r="3" fill="hsla(45, 93%, 50%, 0.5)"
        initial={{ r: 3, opacity: 0 }} animate={{ r: 20, opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.6, delay: 0.7 }} />
    </g>
  );
}
