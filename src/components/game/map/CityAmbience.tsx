import { motion } from 'framer-motion';
import { DistrictId, SmuggleRoute } from '@/game/types';

interface CityAmbienceProps {
  roads: string[];
  smuggleRoutes: SmuggleRoute[];
  districtRep: Record<DistrictId, number>;
  ownedDistricts: DistrictId[];
  districtMeta: Record<DistrictId, { cx: number; cy: number }>;
}

// ========== DISTRICT CENTER POSITIONS ==========
const DISTRICT_CENTERS: Record<DistrictId, { cx: number; cy: number }> = {
  port: { cx: 85, cy: 88 },
  crown: { cx: 270, cy: 100 },
  iron: { cx: 195, cy: 195 },
  low: { cx: 80, cy: 245 },
  neon: { cx: 325, cy: 200 },
};

// ========== CITY GLOW ==========
function CityGlow() {
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id="city-sky-glow" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="hsla(30, 40%, 20%, 0.12)" />
          <stop offset="60%" stopColor="hsla(270, 30%, 15%, 0.06)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="port-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsla(210, 50%, 25%, 0.12)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="neon-area-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsla(300, 60%, 40%, 0.08)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="crown-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsla(220, 40%, 25%, 0.08)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="iron-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsla(25, 40%, 20%, 0.06)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="400" height="290" fill="url(#city-sky-glow)" />
      
      {/* District-specific ambient glows */}
      <ellipse cx="75" cy="85" rx="55" ry="45" fill="url(#port-glow)" />
      <ellipse cx="265" cy="95" rx="55" ry="45" fill="url(#crown-glow)" />
      <ellipse cx="195" cy="190" rx="45" ry="35" fill="url(#iron-glow)" />
      
      <motion.ellipse cx="325" cy="195" rx="55" ry="40" fill="url(#neon-area-glow)"
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      
      {/* Edge vignette for depth */}
      <rect x="0" y="0" width="400" height="290" fill="none"
        stroke="hsla(0, 0%, 0%, 0.5)" strokeWidth="24" />
    </g>
  );
}

// ========== HARBOR ACTIVITY ==========
function HarborActivity() {
  return (
    <g pointerEvents="none">
      {/* Boat 1 - slowly drifting along coastline */}
      <motion.g
        animate={{ x: [15, 25, 15], y: [100, 103, 100] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M -4,0 L 4,0 L 3,2 L -3,2 Z" fill="hsla(30, 30%, 25%, 0.6)" />
        <rect x="-0.5" y="-3" width="1" height="3" fill="hsla(0, 0%, 30%, 0.5)" />
      </motion.g>
      
      {/* Boat 2 - cargo vessel */}
      <motion.g
        animate={{ x: [10, 25, 10], y: [65, 68, 65] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}>
        <path d="M -5,0 L 5,0 L 4,2.5 L -4,2.5 Z" fill="hsla(200, 30%, 20%, 0.5)" />
        <rect x="-2" y="-1.5" width="4" height="1.5" fill="hsla(0, 40%, 25%, 0.4)" rx="0.3" />
      </motion.g>

      {/* Boat 3 - small fishing boat */}
      <motion.g
        animate={{ x: [20, 30, 20], y: [160, 165, 160] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 6 }}>
        <path d="M -3,0 L 3,0 L 2,1.5 L -2,1.5 Z" fill="hsla(30, 25%, 22%, 0.5)" />
        <rect x="-0.3" y="-2" width="0.6" height="2" fill="hsla(0, 0%, 28%, 0.4)" />
      </motion.g>

      {/* Buoys */}
      <motion.circle cx="30" cy="80" r="1" fill="hsla(0, 70%, 45%, 0.4)"
        animate={{ y: [80, 82, 80] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.circle cx="25" cy="140" r="0.8" fill="hsla(120, 60%, 40%, 0.35)"
        animate={{ y: [140, 142, 140] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }} />
      <motion.circle cx="28" cy="250" r="0.7" fill="hsla(0, 70%, 45%, 0.3)"
        animate={{ y: [250, 252, 250] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }} />
      
      {/* Lighthouse beacon on pier */}
      <motion.circle cx="46" cy="60" r="2.5"
        fill="hsla(45, 80%, 50%, 0.15)"
        animate={{ opacity: [0.15, 0.45, 0.15], r: [2.5, 4, 2.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
    </g>
  );
}

// ========== STREET LIGHTS ==========
function StreetLights({ roads }: { roads: string[] }) {
  const lights = roads.slice(0, 12).flatMap((road, ri) => {
    const match = road.match(/M\s*([\d.]+),([\d.]+)/);
    const endMatch = road.match(/([\d.]+),([\d.]+)\s*$/);
    if (!match || !endMatch) return [];
    
    const sx = parseFloat(match[1]), sy = parseFloat(match[2]);
    const ex = parseFloat(endMatch[1]), ey = parseFloat(endMatch[2]);
    
    return [0.25, 0.5, 0.75].filter(() => Math.random() > 0.3).map((t, li) => ({
      x: sx + (ex - sx) * t,
      y: sy + (ey - sy) * t,
      key: `sl-${ri}-${li}`,
      flickerDur: 3 + (ri * 0.7) + (li * 1.3),
    }));
  });

  return (
    <g pointerEvents="none">
      {lights.map(l => (
        <g key={l.key}>
          <rect x={l.x - 0.3} y={l.y - 4} width="0.6" height="4" fill="hsla(0, 0%, 25%, 0.4)" />
          <motion.circle cx={l.x} cy={l.y - 4} r="4"
            fill="hsla(45, 70%, 50%, 0.06)"
            animate={{ opacity: [0.06, 0.1, 0.06] }}
            transition={{ duration: l.flickerDur, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx={l.x} cy={l.y - 4} r="0.8" fill="hsla(45, 80%, 60%, 0.25)" />
        </g>
      ))}
    </g>
  );
}

// ========== PEDESTRIANS ==========
function Pedestrians({ roads }: { roads: string[] }) {
  const pedRoads = roads.slice(0, 8);
  
  return (
    <g pointerEvents="none" opacity="0.4">
      {pedRoads.map((road, i) => (
        <motion.circle key={`ped-${i}`} r="0.7"
          fill={i % 2 === 0 ? 'hsla(45, 40%, 60%, 0.5)' : 'hsla(0, 0%, 70%, 0.4)'}
          animate={{ offsetDistance: i % 2 === 0 ? ['10%', '90%'] : ['90%', '10%'] }}
          transition={{ duration: 8 + i * 2.5, repeat: Infinity, ease: 'linear', delay: i * 1.8 }}
          style={{ offsetPath: `path("${road}")` }} />
      ))}
    </g>
  );
}

// ========== SMUGGLE ROUTE LINES ==========
function SmuggleRouteLines({ routes, districtMeta }: { routes: SmuggleRoute[]; districtMeta: Record<DistrictId, { cx: number; cy: number }> }) {
  const activeRoutes = routes.filter(r => r.active);
  if (activeRoutes.length === 0) return null;

  return (
    <g pointerEvents="none">
      {activeRoutes.map((route, i) => {
        const from = districtMeta[route.from];
        const to = districtMeta[route.to];
        if (!from || !to) return null;

        const risk = Math.min(route.daysActive / 10, 1);
        const hue = 120 - risk * 120;

        return (
          <g key={route.id}>
            <motion.line
              x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy}
              stroke={`hsla(${hue}, 70%, 45%, 0.08)`} strokeWidth="6"
              animate={{ opacity: [0.08, 0.15, 0.08] }}
              transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.line
              x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy}
              stroke={`hsla(${hue}, 70%, 50%, 0.35)`} strokeWidth="1.2" strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, -16] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            <motion.circle r="1.5" fill={`hsla(${hue}, 70%, 55%, 0.6)`}
              animate={{ cx: [from.cx, to.cx], cy: [from.cy, to.cy] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: 'linear' }}
            />
          </g>
        );
      })}
    </g>
  );
}

// ========== OWNED DISTRICT TERRITORY GLOW ==========
function OwnedDistrictGlow({ ownedDistricts }: { ownedDistricts: DistrictId[] }) {
  if (ownedDistricts.length === 0) return null;

  const zones: Record<DistrictId, { x: number; y: number; w: number; h: number }> = {
    port: { x: 40, y: 50, w: 100, h: 70 },
    crown: { x: 220, y: 50, w: 100, h: 80 },
    iron: { x: 150, y: 155, w: 95, h: 60 },
    low: { x: 35, y: 210, w: 95, h: 55 },
    neon: { x: 275, y: 160, w: 100, h: 65 },
  };

  return (
    <g pointerEvents="none">
      {ownedDistricts.map(id => {
        const z = zones[id];
        return (
          <motion.rect key={`owned-glow-${id}`}
            x={z.x} y={z.y} width={z.w} height={z.h} rx="6"
            fill="hsla(0, 72%, 40%, 0.04)"
            stroke="hsla(0, 72%, 40%, 0.06)" strokeWidth="1"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        );
      })}
    </g>
  );
}

// ========== DISTRICT ACTIVITY LEVEL ==========
function DistrictActivity({ districtRep }: { districtRep: Record<DistrictId, number> }) {
  return (
    <g pointerEvents="none">
      {(Object.keys(districtRep) as DistrictId[]).map(id => {
        const rep = districtRep[id];
        if (rep < 20) return null;
        
        const center = DISTRICT_CENTERS[id];
        const intensity = Math.min(rep / 100, 1);
        const numLights = Math.floor(1 + intensity * 3);
        
        return (
          <g key={`activity-${id}`}>
            {Array.from({ length: numLights }).map((_, i) => {
              const angle = (i / numLights) * Math.PI * 2;
              const dist = 12 + i * 5;
              const lx = center.cx + Math.cos(angle) * dist;
              const ly = center.cy + Math.sin(angle) * dist;
              return (
                <motion.circle key={`act-${id}-${i}`}
                  cx={lx} cy={ly} r="0.8"
                  fill={`hsla(45, 70%, 55%, ${0.08 + intensity * 0.1})`}
                  animate={{ opacity: [0.05, 0.15 + intensity * 0.1, 0.05] }}
                  transition={{ duration: 2 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

// ========== INTERSECTION TRAFFIC LIGHTS ==========
function TrafficLights() {
  return (
    <g pointerEvents="none">
      {/* Traffic lights at major intersections */}
      {[
        { x: 195, y: 185 }, // Iron Borough central
        { x: 130, y: 88 },  // Port-Crown road
        { x: 250, y: 130 }, // Crown-Iron junction
        { x: 115, y: 200 }, // Low-Iron junction
      ].map((pos, i) => (
        <g key={`tl-${i}`}>
          <rect x={pos.x - 0.5} y={pos.y - 3} width="1" height="3" fill="hsla(0, 0%, 20%, 0.5)" />
          <motion.circle cx={pos.x} cy={pos.y - 3.5} r="1"
            animate={{
              fill: [
                'hsla(120, 70%, 45%, 0.6)',
                'hsla(120, 70%, 45%, 0.6)',
                'hsla(45, 90%, 50%, 0.6)',
                'hsla(0, 70%, 45%, 0.6)',
                'hsla(0, 70%, 45%, 0.6)',
              ]
            }}
            transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'linear' }}
          />
        </g>
      ))}
    </g>
  );
}

// ========== PARK DETAILS ==========
function ParkDetails() {
  return (
    <g pointerEvents="none">
      {/* Park benches in Crown Heights */}
      {[
        { x: 225, y: 105 },
        { x: 233, y: 108 },
      ].map((pos, i) => (
        <g key={`bench-${i}`}>
          <rect x={pos.x} y={pos.y} width="4" height="1.5" fill="hsla(25, 30%, 18%, 0.4)" rx="0.3" />
          <rect x={pos.x + 0.3} y={pos.y - 0.8} width="0.5" height="0.8" fill="hsla(25, 20%, 15%, 0.4)" />
          <rect x={pos.x + 3.2} y={pos.y - 0.8} width="0.5" height="0.8" fill="hsla(25, 20%, 15%, 0.4)" />
        </g>
      ))}

      {/* Park path */}
      <path d="M 220,102 Q 228,98 236,102 Q 240,106 235,110"
        fill="none" stroke="hsla(30, 15%, 16%, 0.3)" strokeWidth="1" strokeDasharray="2 2" />
    </g>
  );
}

// ========== MAIN EXPORT ==========
export function CityAmbience({ roads, smuggleRoutes, districtRep, ownedDistricts, districtMeta }: CityAmbienceProps) {
  return (
    <g>
      <CityGlow />
      <OwnedDistrictGlow ownedDistricts={ownedDistricts} />
      <DistrictActivity districtRep={districtRep} />
      <StreetLights roads={roads} />
      <TrafficLights />
      <ParkDetails />
      <Pedestrians roads={roads} />
      <HarborActivity />
      <SmuggleRouteLines routes={smuggleRoutes} districtMeta={districtMeta} />
    </g>
  );
}
