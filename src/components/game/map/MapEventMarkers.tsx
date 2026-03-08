import { motion } from 'framer-motion';
import { MapEvent } from '@/game/types';

const ROADS_IMPORT_NOTE = 'Roads are passed as prop from CityMap';

interface MapEventMarkersProps {
  events: MapEvent[];
  vehicleHeat: number;
  roads: string[];
}

export function MapEventMarkers({ events, vehicleHeat, roads }: MapEventMarkersProps) {
  return (
    <g>
      {events.map((event, idx) => {
        const road = roads[event.roadIndex];
        if (!road) return null;

        const match = road.match(/M\s*([\d.]+),([\d.]+)/);
        const endMatch = road.match(/([\d.]+),([\d.]+)\s*$/);
        if (!match || !endMatch) return null;

        const sx = parseFloat(match[1]), sy = parseFloat(match[2]);
        const ex = parseFloat(endMatch[1]), ey = parseFloat(endMatch[2]);
        const t = event.position / 100;
        const x = sx + (ex - sx) * t;
        const y = sy + (ey - sy) * t;

        return (
          <motion.g
            key={event.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.08, type: 'spring', stiffness: 300, damping: 15 }}
          >
            <MapEventIcon event={event} x={x} y={y} vehicleHeat={vehicleHeat} />
          </motion.g>
        );
      })}
    </g>
  );
}

function MapEventIcon({ event, x, y, vehicleHeat }: { event: MapEvent; x: number; y: number; vehicleHeat?: number }) {
  const bounceTransition = { duration: 2, repeat: Infinity, ease: 'easeInOut' as const };
  const isHighVehicleHeat = (vehicleHeat ?? 0) > 50;

  switch (event.type) {
    case 'police_checkpoint':
      return (
        <motion.g animate={{ y: [y - 1, y + 1, y - 1] }} transition={bounceTransition}>
          <g transform={`translate(${x}, 0)`}>
            <motion.circle cy={0} r={isHighVehicleHeat ? 5 : 4}
              fill={isHighVehicleHeat ? 'hsla(0, 80%, 50%, 0.35)' : 'hsla(220, 80%, 50%, 0.3)'}
              animate={{ r: isHighVehicleHeat ? [5, 8, 5] : [4, 6, 4], opacity: [0.3, 0.15, 0.3] }}
              transition={{ duration: isHighVehicleHeat ? 0.8 : 1.2, repeat: Infinity }} />
            <circle cy={0} r="2.5" fill={isHighVehicleHeat ? 'hsla(0, 80%, 50%, 0.7)' : 'hsla(220, 80%, 50%, 0.6)'} />
            <motion.circle cy={0} r="1" fill="hsla(0, 80%, 50%, 0.8)"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: isHighVehicleHeat ? 0.4 : 0.8, repeat: Infinity }} />
            {isHighVehicleHeat && (
              <motion.text textAnchor="middle" y="-6" fontSize="5" fill="hsla(0, 80%, 60%, 0.9)"
                animate={{ opacity: [0.9, 0.5, 0.9] }}
                transition={{ duration: 1, repeat: Infinity }}>🚗</motion.text>
            )}
          </g>
        </motion.g>
      );
    case 'accident':
      return (
        <motion.g animate={{ y: [y - 1.5, y + 1.5, y - 1.5] }} transition={{ ...bounceTransition, delay: 0.3 }}>
          <g transform={`translate(${x}, 0)`}>
            <circle cy={0} r="3" fill="hsla(30, 90%, 50%, 0.4)" />
            <text textAnchor="middle" y="2.5" fontSize="4" fill="hsla(30, 90%, 60%, 0.9)">⚠</text>
          </g>
        </motion.g>
      );
    case 'street_fight':
      return (
        <motion.g animate={{ y: [y, y - 2, y], x: [x, x + 1, x - 1, x] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}>
          <g>
            <motion.circle r="3" fill="hsla(0, 80%, 45%, 0.4)"
              animate={{ r: [3, 5, 3], opacity: [0.4, 0.2, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity }} />
            <circle r="2" fill="hsla(0, 80%, 45%, 0.6)" />
          </g>
        </motion.g>
      );
    case 'black_market':
      return (
        <motion.g animate={{ y: [y - 1, y + 1, y - 1] }} transition={{ ...bounceTransition, delay: 0.5 }}>
          <g transform={`translate(${x}, 0)`}>
            <motion.circle cy={0} r="3" fill="hsla(45, 93%, 40%, 0.3)"
              animate={{ r: [3, 5, 3], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }} />
            <circle cy={0} r="2" fill="hsla(45, 93%, 40%, 0.5)" />
            <text textAnchor="middle" y="2" fontSize="3" fill="hsla(45, 93%, 60%, 0.9)">$</text>
          </g>
        </motion.g>
      );
    case 'drone':
      return (
        <motion.g animate={{ x: [x - 15, x + 15, x - 15], y: [y - 3, y + 3, y - 3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
          <circle r="2" fill="hsla(0, 0%, 60%, 0.5)" />
          <motion.circle r="1" fill="hsla(0, 80%, 50%, 0.6)"
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }} />
          <motion.line x1="-3" y1="3" x2="3" y2="3"
            stroke="hsla(0, 80%, 50%, 0.2)" strokeWidth="0.5"
            animate={{ opacity: [0.2, 0.5, 0.2], y1: [3, 6, 3], y2: [3, 6, 3] }}
            transition={{ duration: 1.5, repeat: Infinity }} />
        </motion.g>
      );
    case 'ambulance':
      return (
        <motion.g
          style={{ offsetPath: `path("${event.roadIndex < (vehicleHeat ?? 0) ? '' : ''}")` }}
          animate={{ offsetDistance: ['0%', '100%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}>
          <rect x="-3" y="-1.5" width="6" height="3" rx="1" fill="hsla(0, 0%, 90%, 0.6)" />
          <motion.circle r="1.5" fill="hsla(0, 80%, 50%, 0.7)"
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }} />
        </motion.g>
      );
    default:
      return null;
  }
}
