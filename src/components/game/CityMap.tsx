import { DistrictId } from '@/game/types';
import { DISTRICTS } from '@/game/constants';
import { motion } from 'framer-motion';
import { Crown, MapPin, Anchor, Building2, Warehouse, Sparkles } from 'lucide-react';

interface CityMapProps {
  playerLocation: DistrictId;
  selectedDistrict: DistrictId | null;
  ownedDistricts: DistrictId[];
  districtDemands: Record<string, any>;
  onSelectDistrict: (id: DistrictId) => void;
}

// Road paths connecting districts (SVG path data)
const ROADS = [
  // Port → Iron (vertical left)
  'M 95,115 L 95,175 Q 95,185 105,185 L 185,185',
  // Port → Crown (horizontal top)
  'M 130,88 L 240,88 Q 250,88 250,95 L 250,100',
  // Crown → Neon (vertical right)
  'M 295,135 L 295,185 Q 295,195 305,195 L 310,195',
  // Iron → Neon (horizontal bottom)
  'M 230,200 L 310,200',
  // Low → Iron (horizontal)
  'M 115,245 L 185,220',
  // Low → Port (vertical)
  'M 85,225 L 85,120',
  // Iron → Crown (vertical center)
  'M 210,175 L 250,130',
  // Low → Neon (diagonal)
  'M 130,250 Q 200,250 310,215',
];

// Secondary/ambient roads for city feel
const AMBIENT_ROADS = [
  'M 50,150 L 170,150',
  'M 200,60 L 200,280',
  'M 40,200 L 160,200',
  'M 260,70 L 360,70',
  'M 330,100 L 330,260',
  'M 160,130 L 280,130',
  'M 120,170 L 120,260',
  'M 250,160 L 370,160',
  'M 60,100 L 160,100',
  'M 270,220 L 370,220',
];

// Building silhouettes per district zone
const DISTRICT_BUILDINGS: Record<DistrictId, { x: number; y: number; buildings: { w: number; h: number; ox: number }[] }> = {
  port: {
    x: 45, y: 55,
    buildings: [
      { w: 12, h: 30, ox: 0 },
      { w: 10, h: 22, ox: 14 },
      { w: 14, h: 38, ox: 26 },
      { w: 8, h: 18, ox: 42 },
      { w: 11, h: 28, ox: 52 },
      { w: 9, h: 15, ox: 65 },
      { w: 13, h: 33, ox: 76 },
    ]
  },
  crown: {
    x: 225, y: 55,
    buildings: [
      { w: 11, h: 45, ox: 0 },
      { w: 13, h: 52, ox: 13 },
      { w: 9, h: 35, ox: 28 },
      { w: 14, h: 58, ox: 39 },
      { w: 10, h: 40, ox: 55 },
      { w: 12, h: 48, ox: 67 },
      { w: 8, h: 30, ox: 81 },
    ]
  },
  iron: {
    x: 155, y: 155,
    buildings: [
      { w: 14, h: 25, ox: 0 },
      { w: 12, h: 20, ox: 16 },
      { w: 16, h: 30, ox: 30 },
      { w: 10, h: 18, ox: 48 },
      { w: 13, h: 27, ox: 60 },
      { w: 11, h: 22, ox: 75 },
    ]
  },
  low: {
    x: 40, y: 210,
    buildings: [
      { w: 10, h: 14, ox: 0 },
      { w: 12, h: 10, ox: 12 },
      { w: 8, h: 16, ox: 26 },
      { w: 14, h: 12, ox: 36 },
      { w: 9, h: 18, ox: 52 },
      { w: 11, h: 11, ox: 63 },
      { w: 10, h: 15, ox: 76 },
    ]
  },
  neon: {
    x: 280, y: 165,
    buildings: [
      { w: 11, h: 35, ox: 0 },
      { w: 9, h: 28, ox: 13 },
      { w: 13, h: 42, ox: 24 },
      { w: 10, h: 30, ox: 39 },
      { w: 12, h: 38, ox: 51 },
      { w: 8, h: 25, ox: 65 },
      { w: 14, h: 45, ox: 75 },
    ]
  }
};

// District label positions & icons
const DISTRICT_META: Record<DistrictId, { cx: number; cy: number; icon: React.ReactNode }> = {
  port: { cx: 85, cy: 88, icon: <Anchor size={12} /> },
  crown: { cx: 270, cy: 100, icon: <Building2 size={12} /> },
  iron: { cx: 195, cy: 195, icon: <Warehouse size={12} /> },
  low: { cx: 80, cy: 245, icon: <MapPin size={12} /> },
  neon: { cx: 325, cy: 200, icon: <Sparkles size={12} /> },
};

export function CityMap({ playerLocation, selectedDistrict, ownedDistricts, districtDemands, onSelectDistrict }: CityMapProps) {
  return (
    <div className="relative w-full aspect-[10/7] rounded-lg overflow-hidden border border-border shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]">
      <svg
        viewBox="0 0 400 290"
        className="w-full h-full"
        style={{ background: 'hsl(0 0% 3%)' }}
      >
        <defs>
          {/* Road glow filter */}
          <filter id="road-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Selected district glow */}
          <filter id="district-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Player marker glow */}
          <filter id="player-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Building window pattern */}
          <pattern id="windows" x="0" y="0" width="4" height="5" patternUnits="userSpaceOnUse">
            <rect x="1" y="1" width="1.5" height="2" fill="hsla(45, 93%, 40%, 0.15)" rx="0.2" />
          </pattern>

          {/* Neon glow gradient */}
          <linearGradient id="neon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(270 76% 55%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(330 76% 55%)" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* === GRID PATTERN (subtle city blocks) === */}
        <g opacity="0.06">
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`vg-${i}`} x1={i * 30} y1="0" x2={i * 30} y2="290" stroke="white" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`hg-${i}`} x1="0" y1={i * 30} x2="400" y2={i * 30} stroke="white" strokeWidth="0.5" />
          ))}
        </g>

        {/* === AMBIENT ROADS (thin, dim) === */}
        <g>
          {AMBIENT_ROADS.map((d, i) => (
            <path key={`ar-${i}`} d={d} fill="none" stroke="hsl(0 0% 15%)" strokeWidth="3" strokeLinecap="round" />
          ))}
        </g>

        {/* === MAIN ROADS (connecting districts) === */}
        <g filter="url(#road-glow)">
          {ROADS.map((d, i) => (
            <path key={`road-${i}`} d={d} fill="none" stroke="hsl(45 30% 18%)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {/* Road center dashes */}
          {ROADS.map((d, i) => (
            <path key={`dash-${i}`} d={d} fill="none" stroke="hsl(45 50% 30%)" strokeWidth="0.5" strokeDasharray="4 6" strokeLinecap="round" />
          ))}
        </g>

        {/* === DISTRICT BUILDING SILHOUETTES === */}
        {(Object.entries(DISTRICT_BUILDINGS) as [DistrictId, typeof DISTRICT_BUILDINGS[DistrictId]][]).map(([id, zone]) => {
          const isSelected = selectedDistrict === id;
          const isOwned = ownedDistricts.includes(id);
          const isNeon = id === 'neon';

          return (
            <g key={`buildings-${id}`}>
              {/* District zone background */}
              <rect
                x={zone.x - 5}
                y={zone.y - 5}
                width={zone.buildings.reduce((max, b) => Math.max(max, b.ox + b.w), 0) + 10}
                height={Math.max(...zone.buildings.map(b => b.h)) + 10}
                rx="4"
                fill={isSelected ? 'hsla(45, 93%, 40%, 0.06)' : isOwned ? 'hsla(0, 72%, 51%, 0.04)' : 'hsla(0, 0%, 100%, 0.015)'}
                stroke={isSelected ? 'hsla(45, 93%, 40%, 0.25)' : 'transparent'}
                strokeWidth="1"
              />

              {/* Buildings */}
              {zone.buildings.map((b, bi) => {
                const bx = zone.x + b.ox;
                const by = zone.y + (Math.max(...zone.buildings.map(bb => bb.h)) - b.h);
                const fillColor = isNeon
                  ? `hsla(270, 50%, ${20 + bi * 3}%, ${0.6 + bi * 0.05})`
                  : isOwned
                  ? `hsla(0, 30%, ${10 + bi * 2}%, 0.7)`
                  : `hsla(0, 0%, ${8 + bi * 2}%, 0.8)`;

                return (
                  <g key={`b-${id}-${bi}`}>
                    <rect
                      x={bx}
                      y={by}
                      width={b.w}
                      height={b.h}
                      fill={fillColor}
                      rx="1"
                    />
                    {/* Windows */}
                    <rect
                      x={bx}
                      y={by}
                      width={b.w}
                      height={b.h}
                      fill="url(#windows)"
                      rx="1"
                    />
                    {/* Building top highlight */}
                    <rect
                      x={bx}
                      y={by}
                      width={b.w}
                      height="1"
                      fill={isNeon ? 'hsla(270, 76%, 55%, 0.4)' : isOwned ? 'hsla(0, 72%, 51%, 0.3)' : 'hsla(0, 0%, 40%, 0.3)'}
                    />
                  </g>
                );
              })}

              {/* Neon glow overlay */}
              {isNeon && (
                <rect
                  x={zone.x - 5}
                  y={zone.y - 5}
                  width={zone.buildings.reduce((max, b) => Math.max(max, b.ox + b.w), 0) + 10}
                  height={Math.max(...zone.buildings.map(b => b.h)) + 10}
                  rx="4"
                  fill="url(#neon-gradient)"
                />
              )}
            </g>
          );
        })}

        {/* === DISTRICT HITBOXES (clickable) === */}
        {(Object.keys(DISTRICT_META) as DistrictId[]).map(id => {
          const meta = DISTRICT_META[id];
          const zone = DISTRICT_BUILDINGS[id];
          const isSelected = selectedDistrict === id;
          const w = zone.buildings.reduce((max, b) => Math.max(max, b.ox + b.w), 0) + 10;
          const h = Math.max(...zone.buildings.map(b => b.h)) + 10;

          return (
            <rect
              key={`hit-${id}`}
              x={zone.x - 5}
              y={zone.y - 5}
              width={w}
              height={h}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => onSelectDistrict(id)}
              rx="4"
            />
          );
        })}

        {/* === DISTRICT LABELS === */}
        {(Object.keys(DISTRICT_META) as DistrictId[]).map(id => {
          const meta = DISTRICT_META[id];
          const district = DISTRICTS[id];
          const isSelected = selectedDistrict === id;
          const isOwned = ownedDistricts.includes(id);
          const isPlayerHere = playerLocation === id;
          const hasDemand = !!districtDemands[id];

          return (
            <g key={`label-${id}`} onClick={() => onSelectDistrict(id)} className="cursor-pointer">
              {/* Selected indicator glow */}
              {isSelected && (
                <circle
                  cx={meta.cx}
                  cy={meta.cy}
                  r="20"
                  fill="hsla(45, 93%, 40%, 0.08)"
                  filter="url(#district-glow)"
                />
              )}

              {/* Label background */}
              <rect
                x={meta.cx - 32}
                y={meta.cy - 8}
                width="64"
                height="16"
                rx="3"
                fill={isSelected ? 'hsla(45, 93%, 40%, 0.2)' : 'hsla(0, 0%, 5%, 0.85)'}
                stroke={isSelected ? 'hsl(45 93% 40%)' : isOwned ? 'hsl(0 72% 51%)' : 'hsl(0 0% 20%)'}
                strokeWidth={isSelected ? '1.5' : '0.5'}
              />

              {/* District name */}
              <text
                x={meta.cx}
                y={meta.cy + 3}
                textAnchor="middle"
                fill={isSelected ? 'hsl(45 93% 50%)' : isOwned ? 'hsl(0 72% 60%)' : 'hsl(0 0% 65%)'}
                fontSize="7"
                fontWeight="bold"
                fontFamily="Inter, system-ui, sans-serif"
                letterSpacing="0.5"
                style={{ textTransform: 'uppercase' }}
              >
                {district.name.length > 10 ? district.name.split(' ')[0] : district.name}
              </text>

              {/* Owned crown */}
              {isOwned && (
                <g transform={`translate(${meta.cx + 26}, ${meta.cy - 10})`}>
                  <circle r="5" fill="hsl(0 72% 51%)" opacity="0.8" />
                  <text x="0" y="3" textAnchor="middle" fill="white" fontSize="6">♛</text>
                </g>
              )}

              {/* Demand indicator */}
              {hasDemand && (
                <g transform={`translate(${meta.cx - 28}, ${meta.cy - 10})`}>
                  <circle r="4" fill="hsl(45 93% 40%)" opacity="0.9" />
                  <text x="0" y="3" textAnchor="middle" fill="hsl(0 0% 5%)" fontSize="5" fontWeight="bold">$</text>
                </g>
              )}
            </g>
          );
        })}

        {/* === PLAYER MARKER === */}
        <g transform={`translate(${DISTRICT_META[playerLocation].cx}, ${DISTRICT_META[playerLocation].cy - 18})`}>
          {/* Pulse ring */}
          <motion.circle
            cy="0"
            r="5"
            fill="none"
            stroke="hsl(45 93% 40%)"
            strokeWidth="1"
            opacity="0.6"
            animate={{ r: [5, 10, 5], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Marker dot */}
          <circle cy="0" r="4" fill="hsl(45 93% 40%)" filter="url(#player-glow)" />
          <circle cy="0" r="2" fill="hsl(45 93% 60%)" />
          {/* "YOU" label */}
          <rect x="-8" y="-14" width="16" height="8" rx="2" fill="hsl(45 93% 40%)" />
          <text x="0" y="-8" textAnchor="middle" fill="hsl(0 0% 5%)" fontSize="5" fontWeight="bold" fontFamily="Inter, sans-serif">JIJ</text>
        </g>

        {/* === ANIMATED TRAFFIC DOTS === */}
        {ROADS.slice(0, 4).map((d, i) => (
          <motion.circle
            key={`traffic-${i}`}
            r="1.5"
            fill="hsl(45 50% 50%)"
            opacity="0.4"
            animate={{
              offsetDistance: ['0%', '100%'],
            }}
            transition={{
              duration: 4 + i * 1.5,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.8,
            }}
            style={{ offsetPath: `path("${d}")` }}
          />
        ))}

        {/* === SCANLINE EFFECT === */}
        <motion.rect
          x="0"
          width="400"
          height="2"
          fill="hsla(45, 93%, 40%, 0.06)"
          animate={{ y: [-10, 300] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
      </svg>

      {/* Corner decorations */}
      <div className="absolute top-2 left-2 text-[0.5rem] text-muted-foreground font-mono opacity-40 uppercase tracking-widest">
        Noxhaven City
      </div>
      <div className="absolute bottom-2 right-2 text-[0.45rem] text-muted-foreground font-mono opacity-30">
        Tactical Overview v2.0
      </div>
    </div>
  );
}
