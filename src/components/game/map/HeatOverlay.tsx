import { motion } from 'framer-motion';

interface HeatOverlayProps {
  heat: number;
  vehicleHeat: number;
  personalHeat: number;
  roads: string[];
}

export function HeatOverlay({ heat, vehicleHeat, personalHeat, roads }: HeatOverlayProps) {
  const maxHeat = Math.max(heat, vehicleHeat, personalHeat);
  if (maxHeat < 30) return null;

  const intensity = Math.min(1, (maxHeat - 30) / 70);
  const opacity = 0.05 + intensity * 0.2;
  const isVehicleDominant = vehicleHeat > personalHeat;
  const borderHue = isVehicleDominant ? '220' : '0';

  return (
    <g pointerEvents="none">
      <rect x="0" y="0" width="400" height="290" rx="0"
        fill="none" stroke={`hsla(${borderHue}, 80%, 40%, ${opacity})`}
        strokeWidth={4 + intensity * 8} />
      {maxHeat > 60 && (
        <rect x="0" y="0" width="400" height="290"
          fill={`hsla(${borderHue}, 80%, 30%, ${0.02 + intensity * 0.05})`} />
      )}
      {vehicleHeat > 40 && (
        <motion.circle r="2" opacity={0.4 + (vehicleHeat / 100) * 0.4}
          animate={{ offsetDistance: ['0%', '100%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          style={{ offsetPath: `path("${roads[1]}")` }}>
          <animate attributeName="fill" values="hsla(220,80%,50%,0.9);hsla(0,80%,50%,0.9)" dur="0.3s" repeatCount="indefinite" />
        </motion.circle>
      )}
      {personalHeat > 50 && (
        <motion.g animate={{ x: [50, 350, 50], y: [40, 70, 40] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}>
          <circle r="1.5" fill="hsla(0, 0%, 60%, 0.5)" />
          <motion.circle r="1" fill="hsla(0, 80%, 50%, 0.6)"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }} />
          <motion.line x1="-2" y1="2.5" x2="2" y2="2.5"
            stroke="hsla(0, 80%, 50%, 0.15)" strokeWidth="0.4"
            animate={{ opacity: [0.15, 0.4, 0.15] }} transition={{ duration: 1.5, repeat: Infinity }} />
        </motion.g>
      )}
      {maxHeat > 80 && (
        <>
          <motion.rect x="0" y="0" width="400" height="290" rx="0"
            fill="none" stroke={`hsla(${borderHue}, 80%, 40%, 0.3)`} strokeWidth="3"
            animate={{ opacity: [0.3, 0.1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <motion.text x="200" y="20" textAnchor="middle"
            fill="hsla(0, 80%, 50%, 0.4)" fontSize="8" fontWeight="bold"
            fontFamily="Inter, sans-serif" letterSpacing="4"
            animate={{ opacity: [0.4, 0.2, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
            {personalHeat > 80 ? 'GEZOCHT' : vehicleHeat > 80 ? 'VOERTUIG ALERT' : 'LOCKDOWN'}
          </motion.text>
          {personalHeat > 70 && (
            <motion.g animate={{ x: [0, 380, 0], y: [30, 60, 30] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}>
              <circle r="2" fill="hsla(0, 0%, 70%, 0.4)" />
              <motion.circle r="5" fill="none" stroke="hsla(0, 0%, 60%, 0.15)" strokeWidth="0.5"
                animate={{ r: [5, 8, 5] }} transition={{ duration: 0.3, repeat: Infinity }} />
            </motion.g>
          )}
        </>
      )}
    </g>
  );
}
