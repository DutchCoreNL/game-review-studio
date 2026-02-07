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
      {/* Sky glow above city */}
      <defs>
        <radialGradient id="city-sky-glow" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="hsla(30, 40%, 20%, 0.12)" />
          <stop offset="60%" stopColor="hsla(270, 30%, 15%, 0.06)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="port-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsla(210, 50%, 25%, 0.1)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="neon-area-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsla(300, 60%, 40%, 0.06)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="400" height="290" fill="url(#city-sky-glow)" />
      
      {/* Port Nero water glow */}
      <ellipse cx="60" cy="85" rx="50" ry="40" fill="url(#port-glow)" />
      
      {/* Neon Strip ambient glow */}
      <motion.ellipse cx="325" cy="195" rx="55" ry="40" fill="url(#neon-area-glow)"
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      
      {/* Edge vignette for depth */}
      <rect x="0" y="0" width="400" height="290" fill="none"
        stroke="hsla(0, 0%, 0%, 0.4)" strokeWidth="20" />
    </g>
  );
}

// ========== RIVER / WATERWAY ==========
function RiverWaterway() {
  return (
    <g pointerEvents="none">
      {/* Main waterway from port area southward */}
      <path d="M 30,120 Q 25,160 35,200 Q 45,240 30,280"
        fill="none" stroke="hsla(210, 50%, 18%, 0.5)" strokeWidth="8" strokeLinecap="round" />
      <path d="M 30,120 Q 25,160 35,200 Q 45,240 30,280"
        fill="none" stroke="hsla(210, 60%, 25%, 0.2)" strokeWidth="4" strokeLinecap="round" />
      
      {/* Water ripples */}
      <motion.path d="M 27,140 Q 32,137 37,140" fill="none" stroke="hsla(210, 60%, 40%, 0.15)" strokeWidth="0.6"
        animate={{ y: [0, 3, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.path d="M 30,180 Q 35,177 40,180" fill="none" stroke="hsla(210, 60%, 40%, 0.12)" strokeWidth="0.6"
        animate={{ y: [0, -2, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
      <motion.path d="M 28,220 Q 33,217 38,220" fill="none" stroke="hsla(210, 60%, 40%, 0.1)" strokeWidth="0.6"
        animate={{ y: [0, 2, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
      <motion.path d="M 32,260 Q 37,257 42,260" fill="none" stroke="hsla(210, 60%, 40%, 0.08)" strokeWidth="0.6"
        animate={{ y: [0, -1.5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
    </g>
  );
}

// ========== STREET LIGHTS ==========
function StreetLights({ roads }: { roads: string[] }) {
  // Place lights at intervals along roads
  const lights = roads.slice(0, 8).flatMap((road, ri) => {
    const match = road.match(/M\s*([\d.]+),([\d.]+)/);
    const endMatch = road.match(/([\d.]+),([\d.]+)\s*$/);
    if (!match || !endMatch) return [];
    
    const sx = parseFloat(match[1]), sy = parseFloat(match[2]);
    const ex = parseFloat(endMatch[1]), ey = parseFloat(endMatch[2]);
    
    return [0.25, 0.75].map((t, li) => ({
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
          {/* Pole */}
          <rect x={l.x - 0.3} y={l.y - 4} width="0.6" height="4" fill="hsla(0, 0%, 25%, 0.4)" />
          {/* Light glow */}
          <motion.circle cx={l.x} cy={l.y - 4} r="4"
            fill="hsla(45, 70%, 50%, 0.06)"
            animate={{ opacity: [0.06, 0.1, 0.06] }}
            transition={{ duration: l.flickerDur, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Bulb */}
          <circle cx={l.x} cy={l.y - 4} r="0.8" fill="hsla(45, 80%, 60%, 0.25)" />
        </g>
      ))}
    </g>
  );
}

// ========== PEDESTRIANS ==========
function Pedestrians({ roads }: { roads: string[] }) {
  // Subtle small dots walking along some roads
  const pedRoads = roads.slice(0, 6);
  
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

// ========== HARBOR ACTIVITY ==========
function HarborActivity() {
  return (
    <g pointerEvents="none">
      {/* Boat 1 - slowly drifting */}
      <motion.g
        animate={{ x: [25, 35, 25], y: [100, 103, 100] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M -4,0 L 4,0 L 3,2 L -3,2 Z" fill="hsla(30, 30%, 25%, 0.6)" />
        <rect x="-0.5" y="-3" width="1" height="3" fill="hsla(0, 0%, 30%, 0.5)" />
      </motion.g>
      
      {/* Boat 2 - cargo vessel */}
      <motion.g
        animate={{ x: [20, 30, 20], y: [75, 78, 75] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}>
        <path d="M -5,0 L 5,0 L 4,2.5 L -4,2.5 Z" fill="hsla(200, 30%, 20%, 0.5)" />
        <rect x="-2" y="-1.5" width="4" height="1.5" fill="hsla(0, 40%, 25%, 0.4)" rx="0.3" />
      </motion.g>

      {/* Buoys */}
      <motion.circle cx="38" cy="88" r="1" fill="hsla(0, 70%, 45%, 0.4)"
        animate={{ y: [88, 90, 88] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.circle cx="35" cy="105" r="0.8" fill="hsla(120, 60%, 40%, 0.35)"
        animate={{ y: [105, 107, 105] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }} />
      
      {/* Lighthouse beacon on pier */}
      <motion.circle cx="42" cy="65" r="2"
        fill="hsla(45, 80%, 50%, 0.15)"
        animate={{ opacity: [0.15, 0.4, 0.15], r: [2, 3.5, 2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
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

        // Risk color based on days active (longer = more risky)
        const risk = Math.min(route.daysActive / 10, 1);
        const hue = 120 - risk * 120; // green to red

        return (
          <g key={route.id}>
            {/* Route glow */}
            <motion.line
              x1={from.cx} y1={from.cy}
              x2={to.cx} y2={to.cy}
              stroke={`hsla(${hue}, 70%, 45%, 0.08)`}
              strokeWidth="6"
              animate={{ opacity: [0.08, 0.15, 0.08] }}
              transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Route line */}
            <motion.line
              x1={from.cx} y1={from.cy}
              x2={to.cx} y2={to.cy}
              stroke={`hsla(${hue}, 70%, 50%, 0.35)`}
              strokeWidth="1.2"
              strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, -16] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            {/* Moving package dot */}
            <motion.circle r="1.5" fill={`hsla(${hue}, 70%, 55%, 0.6)`}
              animate={{
                cx: [from.cx, to.cx],
                cy: [from.cy, to.cy],
              }}
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
            x={z.x} y={z.y} width={z.w} height={z.h}
            rx="6"
            fill="hsla(0, 72%, 40%, 0.04)"
            stroke="hsla(0, 72%, 40%, 0.06)"
            strokeWidth="1"
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
  // More activity (flickering lights / movement) in higher-rep districts
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

// ========== MAIN EXPORT ==========
export function CityAmbience({ roads, smuggleRoutes, districtRep, ownedDistricts, districtMeta }: CityAmbienceProps) {
  return (
    <g>
      <CityGlow />
      <RiverWaterway />
      <OwnedDistrictGlow ownedDistricts={ownedDistricts} />
      <DistrictActivity districtRep={districtRep} />
      <StreetLights roads={roads} />
      <Pedestrians roads={roads} />
      <HarborActivity />
      <SmuggleRouteLines routes={smuggleRoutes} districtMeta={districtMeta} />
    </g>
  );
}
