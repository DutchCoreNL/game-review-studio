import { motion } from 'framer-motion';
import { DistrictId, SmuggleRoute } from '@/game/types';

interface CityAmbienceProps {
  roads: string[];
  smuggleRoutes: SmuggleRoute[];
  districtRep: Record<DistrictId, number>;
  ownedDistricts: DistrictId[];
  districtMeta: Record<DistrictId, { cx: number; cy: number }>;
}

const DISTRICT_CENTERS: Record<DistrictId, { cx: number; cy: number }> = {
  port: { cx: 100, cy: 80 },
  crown: { cx: 310, cy: 75 },
  iron: { cx: 110, cy: 210 },
  low: { cx: 340, cy: 235 },
  neon: { cx: 230, cy: 200 },
};

function CityGlow() {
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id="city-sky-glow" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="hsla(30, 40%, 18%, 0.1)" />
          <stop offset="60%" stopColor="hsla(270, 30%, 12%, 0.05)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="port-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsla(210, 55%, 28%, 0.14)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="neon-area-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsla(300, 65%, 42%, 0.1)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="crown-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsla(220, 45%, 28%, 0.08)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="iron-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsla(20, 50%, 22%, 0.08)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="low-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsla(40, 40%, 20%, 0.06)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="400" height="290" fill="url(#city-sky-glow)" />
      <ellipse cx="100" cy="80" rx="60" ry="50" fill="url(#port-glow)" />
      <ellipse cx="310" cy="75" rx="55" ry="45" fill="url(#crown-glow)" />
      <ellipse cx="110" cy="210" rx="50" ry="40" fill="url(#iron-glow)" />
      <ellipse cx="340" cy="235" rx="50" ry="35" fill="url(#low-glow)" />
      <motion.ellipse cx="230" cy="200" rx="60" ry="40" fill="url(#neon-area-glow)"
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      <rect x="0" y="0" width="400" height="290" fill="none"
        stroke="hsla(0, 0%, 0%, 0.5)" strokeWidth="24" />
    </g>
  );
}

function HarborActivity() {
  return (
    <g pointerEvents="none">
      {/* Container ship in port */}
      <motion.g
        animate={{ x: [15, 28, 15], y: [70, 73, 70] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M -6,0 L 6,0 L 5,3 L -5,3 Z" fill="hsla(200, 30%, 22%, 0.6)" />
        <rect x="-3" y="-2" width="6" height="2" fill="hsla(0, 40%, 28%, 0.5)" rx="0.3" />
        <rect x="-0.5" y="-4" width="1" height="2.5" fill="hsla(0, 0%, 30%, 0.5)" />
      </motion.g>

      {/* Bulk carrier */}
      <motion.g
        animate={{ x: [10, 22, 10], y: [105, 108, 105] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}>
        <path d="M -5,0 L 5,0 L 4,2.5 L -4,2.5 Z" fill="hsla(30, 25%, 20%, 0.5)" />
        <rect x="-0.3" y="-3" width="0.6" height="3" fill="hsla(0, 0%, 28%, 0.4)" />
      </motion.g>

      {/* Small boat in canal */}
      <motion.g
        animate={{ x: [120, 200, 120], y: [148, 150, 148] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 6 }}>
        <path d="M -3,0 L 3,0 L 2,1.5 L -2,1.5 Z" fill="hsla(30, 20%, 20%, 0.4)" />
      </motion.g>

      {/* Buoys */}
      <motion.circle cx="35" cy="55" r="1" fill="hsla(0, 70%, 45%, 0.35)"
        animate={{ y: [55, 57, 55] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.circle cx="30" cy="120" r="0.8" fill="hsla(120, 60%, 40%, 0.3)"
        animate={{ y: [120, 122, 120] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }} />

      {/* Lighthouse beacon */}
      <motion.circle cx="53" cy="45" r="2.5"
        fill="hsla(45, 80%, 50%, 0.12)"
        animate={{ opacity: [0.12, 0.4, 0.12], r: [2.5, 4, 2.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
    </g>
  );
}

function StreetLights({ roads }: { roads: string[] }) {
  const lights = roads.slice(0, 10).flatMap((road, ri) => {
    const match = road.match(/M\s*([\d.]+),([\d.]+)/);
    const endMatch = road.match(/([\d.]+),([\d.]+)\s*$/);
    if (!match || !endMatch) return [];
    const sx = parseFloat(match[1]), sy = parseFloat(match[2]);
    const ex = parseFloat(endMatch[1]), ey = parseFloat(endMatch[2]);
    return [0.25, 0.5, 0.75].filter(() => Math.random() > 0.35).map((t, li) => ({
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
          <rect x={l.x - 0.3} y={l.y - 4} width="0.6" height="4" fill="hsla(0, 0%, 22%, 0.35)" />
          <motion.circle cx={l.x} cy={l.y - 4} r="4"
            fill="hsla(45, 70%, 50%, 0.05)"
            animate={{ opacity: [0.05, 0.09, 0.05] }}
            transition={{ duration: l.flickerDur, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx={l.x} cy={l.y - 4} r="0.7" fill="hsla(45, 80%, 60%, 0.2)" />
        </g>
      ))}
    </g>
  );
}

function Pedestrians({ roads }: { roads: string[] }) {
  return (
    <g pointerEvents="none" opacity="0.35">
      {roads.slice(0, 6).map((road, i) => (
        <motion.circle key={`ped-${i}`} r="0.6"
          fill={i % 2 === 0 ? 'hsla(45, 40%, 60%, 0.5)' : 'hsla(0, 0%, 70%, 0.4)'}
          animate={{ offsetDistance: i % 2 === 0 ? ['10%', '90%'] : ['90%', '10%'] }}
          transition={{ duration: 8 + i * 2.5, repeat: Infinity, ease: 'linear', delay: i * 1.8 }}
          style={{ offsetPath: `path("${road}")` }} />
      ))}
    </g>
  );
}

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
            <motion.line x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy}
              stroke={`hsla(${hue}, 70%, 45%, 0.08)`} strokeWidth="6"
              animate={{ opacity: [0.08, 0.15, 0.08] }}
              transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.line x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy}
              stroke={`hsla(${hue}, 70%, 50%, 0.35)`} strokeWidth="1.2" strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, -16] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
            <motion.circle r="1.5" fill={`hsla(${hue}, 70%, 55%, 0.6)`}
              animate={{ cx: [from.cx, to.cx], cy: [from.cy, to.cy] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: 'linear' }} />
          </g>
        );
      })}
    </g>
  );
}

function OwnedDistrictGlow({ ownedDistricts }: { ownedDistricts: DistrictId[] }) {
  if (ownedDistricts.length === 0) return null;
  const zones: Record<DistrictId, { x: number; y: number; w: number; h: number }> = {
    port:  { x: 52, y: 35, w: 115, h: 100 },
    crown: { x: 250, y: 30, w: 110, h: 105 },
    iron:  { x: 55, y: 162, w: 110, h: 75 },
    low:   { x: 290, y: 200, w: 100, h: 65 },
    neon:  { x: 170, y: 162, w: 120, h: 75 },
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
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        );
      })}
    </g>
  );
}

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
                  transition={{ duration: 2 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }} />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

function TrafficLights() {
  return (
    <g pointerEvents="none">
      {[
        { x: 90, y: 148 },   // Bridge 1 (Port-Iron)
        { x: 280, y: 148 },  // Bridge 2 (Crown-Neon)
        { x: 190, y: 148 },  // Bridge 3 (central)
        { x: 170, y: 90 },   // Port-Crown road
      ].map((pos, i) => (
        <g key={`tl-${i}`}>
          <rect x={pos.x - 0.5} y={pos.y - 3} width="1" height="3" fill="hsla(0, 0%, 20%, 0.4)" />
          <motion.circle cx={pos.x} cy={pos.y - 3.5} r="1"
            animate={{
              fill: [
                'hsla(120, 70%, 45%, 0.6)', 'hsla(120, 70%, 45%, 0.6)',
                'hsla(45, 90%, 50%, 0.6)',
                'hsla(0, 70%, 45%, 0.6)', 'hsla(0, 70%, 45%, 0.6)',
              ]
            }}
            transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'linear' }} />
        </g>
      ))}
    </g>
  );
}

function ParkDetails() {
  return (
    <g pointerEvents="none">
      {/* Park area in Crown Heights */}
      {[{ x: 275, y: 88 }, { x: 282, y: 92 }].map((pos, i) => (
        <g key={`bench-${i}`}>
          <rect x={pos.x} y={pos.y} width="4" height="1.5" fill="hsla(25, 30%, 16%, 0.35)" rx="0.3" />
          <rect x={pos.x + 0.3} y={pos.y - 0.8} width="0.5" height="0.8" fill="hsla(25, 20%, 13%, 0.35)" />
          <rect x={pos.x + 3.2} y={pos.y - 0.8} width="0.5" height="0.8" fill="hsla(25, 20%, 13%, 0.35)" />
        </g>
      ))}
      <path d="M 270,85 Q 278,80 286,85 Q 290,90 285,94"
        fill="none" stroke="hsla(30, 15%, 14%, 0.25)" strokeWidth="1" strokeDasharray="2 2" />
    </g>
  );
}

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
