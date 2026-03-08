import { motion } from 'framer-motion';

interface TrafficLayerProps {
  roads: string[];
  vehicleHeat: number;
}

export function TrafficLayer({ roads, vehicleHeat }: TrafficLayerProps) {
  return (
    <g pointerEvents="none">
      {/* Headlights — warm dots moving forward on main roads */}
      {roads.slice(0, 16).flatMap((d, i) => {
        const isBusy = [0, 1, 4, 7, 11].includes(i);
        const count = isBusy ? 3 : i < 10 ? 2 : 1;
        return Array.from({ length: count }, (_, j) => (
          <motion.circle key={`hl-${i}-${j}`} r={0.7 + (i % 3) * 0.15}
            fill="hsla(45, 65%, 58%, 0.45)" opacity={0.25 + j * 0.05}
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 4 + i * 0.6 + j * 2.5 + Math.random() * 2, repeat: Infinity, ease: 'linear', delay: j * 2.8 + i * 0.3 }}
            style={{ offsetPath: `path("${d}")` }} />
        ));
      })}
      {/* Taillights — red/amber returning */}
      {roads.slice(0, 12).flatMap((d, i) => {
        const count = [0, 1, 7].includes(i) ? 3 : 2;
        return Array.from({ length: count }, (_, j) => (
          <motion.circle key={`tl-${i}-${j}`} r={0.55 + (i % 2) * 0.15}
            fill={j % 2 === 0 ? 'hsla(0, 60%, 48%, 0.35)' : 'hsla(20, 70%, 50%, 0.3)'}
            opacity="0.22"
            animate={{ offsetDistance: ['100%', '0%'] }}
            transition={{ duration: 5 + i * 1.1 + j * 2 + Math.random() * 1.5, repeat: Infinity, ease: 'linear', delay: j * 3.5 + i * 0.6 + 1.5 }}
            style={{ offsetPath: `path("${d}")` }} />
        ));
      })}
      {/* Roundabout traffic */}
      {[0, 1, 2, 3, 4].map(i => (
        <motion.circle key={`rnd-${i}`} r={0.65 + (i % 2) * 0.2}
          fill={i % 3 === 0 ? 'hsla(280, 55%, 55%, 0.4)' : i % 3 === 1 ? 'hsla(320, 50%, 50%, 0.35)' : 'hsla(45, 60%, 55%, 0.35)'}
          opacity="0.35"
          animate={{ offsetDistance: ['0%', '100%'] }}
          transition={{ duration: 2 + i * 0.4, repeat: Infinity, ease: 'linear', delay: i * 0.7 }}
          style={{ offsetPath: `path("${roads[4]}")` }} />
      ))}
      {/* Buses */}
      {[0, 1, 7, 8].map((ri, i) => (
        <motion.rect key={`bus-${i}`} x="-1.8" y="-0.7" width="3.6" height="1.4" rx="0.4"
          fill="hsla(200, 45%, 42%, 0.22)"
          animate={{ offsetDistance: ['0%', '100%'] }}
          transition={{ duration: 14 + i * 3, repeat: Infinity, ease: 'linear', delay: i * 5 + 2 }}
          style={{ offsetPath: `path("${roads[ri]}")` }} />
      ))}
      {/* Motorcycles */}
      {roads.slice(0, 8).map((d, i) => (
        <motion.circle key={`moto-${i}`} r="0.45"
          fill="hsla(45, 85%, 62%, 0.55)"
          animate={{ offsetDistance: ['0%', '100%'] }}
          transition={{ duration: 1.8 + i * 0.4, repeat: Infinity, ease: 'linear', delay: i * 2.2 + 4 }}
          style={{ offsetPath: `path("${d}")` }} />
      ))}
      {/* Coastal traffic */}
      {[0, 1, 2].map(i => (
        <motion.circle key={`coast-${i}`} r="0.65"
          fill="hsla(210, 40%, 50%, 0.3)" opacity="0.25"
          animate={{ offsetDistance: i % 2 === 0 ? ['0%', '100%'] : ['100%', '0%'] }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'linear', delay: i * 2.5 }}
          style={{ offsetPath: `path("${roads[9]}")` }} />
      ))}
      {/* Factory district loop */}
      {[0, 1].map(i => (
        <motion.circle key={`fac-${i}`} r="0.55"
          fill="hsla(30, 50%, 45%, 0.3)" opacity="0.3"
          animate={{ offsetDistance: ['0%', '100%'] }}
          transition={{ duration: 3.5 + i * 1.2, repeat: Infinity, ease: 'linear', delay: i * 2 }}
          style={{ offsetPath: `path("${roads[10]}")` }} />
      ))}
      {/* Lowrise residential loop */}
      {[0, 1].map(i => (
        <motion.circle key={`res-${i}`} r="0.55"
          fill="hsla(45, 50%, 50%, 0.3)" opacity="0.25"
          animate={{ offsetDistance: i === 0 ? ['0%', '100%'] : ['100%', '0%'] }}
          transition={{ duration: 4.5 + i * 1.5, repeat: Infinity, ease: 'linear', delay: i * 2.5 }}
          style={{ offsetPath: `path("${roads[14]}")` }} />
      ))}
      {/* Crown Heights internal */}
      {[0, 1].map(i => (
        <motion.circle key={`crown-${i}`} r="0.5"
          fill="hsla(220, 40%, 55%, 0.35)" opacity="0.3"
          animate={{ offsetDistance: i === 0 ? ['0%', '100%'] : ['100%', '0%'] }}
          transition={{ duration: 5 + i * 2, repeat: Infinity, ease: 'linear', delay: i * 3 }}
          style={{ offsetPath: `path("${roads[18]}")` }} />
      ))}
      {/* Emergency vehicle — reacts to vehicle heat */}
      {vehicleHeat > 40 && (
        <motion.circle r="1.3" opacity="0.5"
          animate={{ offsetDistance: ['0%', '100%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          style={{ offsetPath: `path("${roads[Math.floor(vehicleHeat / 25) % roads.length]}")` }}>
          <animate attributeName="fill" values="hsla(220,80%,50%,0.8);hsla(0,80%,50%,0.8)" dur="0.4s" repeatCount="indefinite" />
        </motion.circle>
      )}
    </g>
  );
}
