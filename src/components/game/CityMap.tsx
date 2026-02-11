import { DistrictId, MapEvent, WeatherType, NemesisState, SmuggleRoute, Safehouse, VillaState } from '@/game/types';
import { DISTRICTS } from '@/game/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { WeatherOverlay } from './map/WeatherOverlay';
import { NemesisMarker } from './map/NemesisMarker';
import { CityAmbience } from './map/CityAmbience';
import { SkylineEffect, MapOverlayUI } from './map/SkylineEffect';
import cityMapBg from '@/assets/city-map-bg.png';

interface CityMapProps {
  playerLocation: DistrictId;
  selectedDistrict: DistrictId | null;
  ownedDistricts: DistrictId[];
  districtDemands: Record<string, any>;
  mapEvents: MapEvent[];
  heat: number;
  vehicleHeat: number;
  personalHeat: number;
  weather: WeatherType;
  nemesis: NemesisState | null;
  travelAnim: { from: DistrictId; to: DistrictId } | null;
  onSelectDistrict: (id: DistrictId) => void;
  smuggleRoutes?: SmuggleRoute[];
  districtRep?: Record<DistrictId, number>;
  onChopShopClick?: () => void;
  safehouses?: Safehouse[];
  onSafehouseClick?: () => void;
  villa?: VillaState | null;
  onVillaClick?: () => void;
}

// Road paths — repositioned to match the new background image
const ROADS = [
  'M 75,100 Q 75,160 78,200',                          // Port to Iron (left side vertical)
  'M 95,80 Q 160,50 200,45',                            // Port to Villa area
  'M 200,55 Q 260,55 310,70',                           // Villa to Crown
  'M 320,95 Q 310,140 280,170',                         // Crown to Neon area
  'M 230,175 Q 275,200 310,220',                        // Neon to Lowrise
  'M 100,220 Q 150,210 190,185',                        // Iron to Neon
  'M 320,100 Q 340,160 325,210',                        // Crown to Lowrise (right side)
  'M 90,220 Q 180,240 310,230',                         // Iron to Lowrise (bottom)
  'M 200,175 Q 200,130 200,80',                         // Neon to Villa (center vertical)
  'M 75,95 Q 140,85 200,80',                            // Port east along top
  'M 100,200 Q 140,175 190,170',                        // Iron to Neon shortcut
  'M 250,175 Q 290,170 320,160',                        // Neon east to Crown area
];

// Ambient background roads
const AMBIENT_ROADS = [
  'M 50,150 Q 110,148 170,150',
  'M 200,55 Q 198,170 200,280',
  'M 48,200 L 140,200',
  'M 260,65 Q 310,68 370,72',
  'M 330,95 Q 328,180 330,260',
  'M 160,128 Q 220,130 280,128',
  'M 120,165 Q 118,215 120,260',
  'M 250,158 Q 310,160 375,162',
  'M 55,95 Q 110,98 160,100',
  'M 270,218 Q 320,220 375,222',
];

// District label positions — repositioned for new background
const DISTRICT_META: Record<DistrictId, { cx: number; cy: number; labelW: number }> = {
  port:  { cx: 75,  cy: 80,  labelW: 52 },
  crown: { cx: 320, cy: 75,  labelW: 72 },
  iron:  { cx: 80,  cy: 220, labelW: 64 },
  low:   { cx: 320, cy: 225, labelW: 42 },
  neon:  { cx: 200, cy: 175, labelW: 56 },
};

// District zones for hit areas — repositioned
const DISTRICT_ZONES: Record<DistrictId, { x: number; y: number; w: number; h: number }> = {
  port:  { x: 30,  y: 50,  w: 100, h: 65 },
  crown: { x: 270, y: 40,  w: 110, h: 75 },
  iron:  { x: 30,  y: 185, w: 110, h: 65 },
  low:   { x: 275, y: 195, w: 100, h: 60 },
  neon:  { x: 155, y: 145, w: 100, h: 60 },
};

// ========== MAP EVENT MARKERS ==========

function MapEventMarkers({ events, vehicleHeat }: { events: MapEvent[]; vehicleHeat: number }) {
  return (
    <g>
      {events.map((event, idx) => {
        const road = ROADS[event.roadIndex];
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
          style={{ offsetPath: `path("${ROADS[event.roadIndex]}")` }}
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

// ========== HEAT OVERLAY ==========

function HeatOverlay({ heat, vehicleHeat, personalHeat }: { heat: number; vehicleHeat: number; personalHeat: number }) {
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
          style={{ offsetPath: `path("${ROADS[1]}")` }}>
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

// ========== TRAVEL ANIMATION ==========

function TravelAnimation({ from, to, districtMeta }: {
  from: DistrictId; to: DistrictId;
  districtMeta: Record<DistrictId, { cx: number; cy: number }>;
}) {
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

// ========== MAIN COMPONENT ==========

export function CityMap({ playerLocation, selectedDistrict, ownedDistricts, districtDemands, mapEvents, heat, vehicleHeat, personalHeat, weather, nemesis, travelAnim, onSelectDistrict, smuggleRoutes = [], districtRep, onChopShopClick, safehouses = [], onSafehouseClick, villa, onVillaClick }: CityMapProps) {
  const defaultDistrictRep: Record<DistrictId, number> = districtRep || { port: 30, crown: 50, iron: 40, low: 15, neon: 60 };
  
  return (
    <div className="relative w-full aspect-[10/7] rounded-lg overflow-hidden border border-border shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]">
      {/* Background image */}
      <img
        src={cityMapBg}
        alt="Noxhaven City Map"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* SVG overlay for all interactive elements */}
      <svg viewBox="0 0 400 290" className="absolute inset-0 w-full h-full" style={{ background: 'transparent' }}>
        <defs>
          <filter id="road-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="district-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="player-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="neon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(270 76% 55%)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(330 76% 55%)" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* === LAYER: City Ambience (glows, activity, lights) === */}
        <CityAmbience
          roads={ROADS}
          smuggleRoutes={smuggleRoutes}
          districtRep={defaultDistrictRep}
          ownedDistricts={ownedDistricts}
          districtMeta={DISTRICT_META}
        />

        {/* === VILLA NOXHAVEN === */}
        <g onClick={(e) => { e.stopPropagation(); onVillaClick?.(); }}
          style={{ cursor: onVillaClick ? 'pointer' : 'default' }}>
          <rect x="180" y="25" width="40" height="35" fill="transparent" />
          {villa && (
            <motion.circle cx="200" cy="45" r="18"
              fill="none" stroke="hsla(45, 90%, 50%, 0.15)" strokeWidth="1"
              animate={{ r: [18, 22, 18], opacity: [0.15, 0.05, 0.15] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          )}
          <rect x="186" y="23" width="28" height="9" rx="2"
            fill={villa ? 'hsla(45, 30%, 8%, 0.9)' : 'hsla(0, 0%, 5%, 0.7)'}
            stroke={villa ? 'hsl(45 60% 40%)' : 'hsl(0 0% 20%)'}
            strokeWidth={villa ? '1' : '0.5'} />
          <text x="200" y="30" textAnchor="middle"
            fill={villa ? 'hsl(45 80% 55%)' : 'hsl(0 0% 40%)'}
            fontSize="5" fontWeight="bold" fontFamily="Inter, system-ui, sans-serif"
            style={{ textTransform: 'uppercase' }}>
            {villa ? 'VILLA' : '🔒 VILLA'}
          </text>
        </g>

        {/* === SAFEHOUSE MARKERS === */}
        {safehouses.map(sh => {
          const meta = DISTRICT_META[sh.district];
          if (!meta) return null;
          const sx = meta.cx + 18;
          const sy = meta.cy + 6;
          return (
            <g key={`sh-${sh.district}`}
              onClick={(e) => { e.stopPropagation(); onSafehouseClick?.(); }}
              style={{ cursor: onSafehouseClick ? 'pointer' : 'default' }}>
              <rect x={sx - 6} y={sy - 6} width="12" height="12" fill="transparent" />
              <motion.circle cx={sx} cy={sy} r="5"
                fill="hsla(145, 60%, 30%, 0.3)"
                animate={{ r: [5, 7, 5], opacity: [0.3, 0.15, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
              <circle cx={sx} cy={sy} r="4" fill="hsla(145, 50%, 15%, 0.8)" stroke="hsla(145, 60%, 40%, 0.5)" strokeWidth="0.5" />
              <text x={sx} y={sy + 2.5} textAnchor="middle" fontSize="5" fill="hsla(145, 60%, 55%, 0.9)">🏠</text>
              {sh.level >= 2 && (
                <>
                  <motion.circle cx={sx + 4} cy={sy - 4} r="2" fill="hsla(45, 90%, 50%, 0.8)"
                    animate={{ opacity: [0.8, 0.5, 0.8] }} transition={{ duration: 2, repeat: Infinity }} />
                  <text x={sx + 4} y={sy - 2.5} textAnchor="middle" fontSize="3" fill="hsl(0 0% 5%)" fontWeight="bold">{sh.level}</text>
                </>
              )}
            </g>
          );
        })}

        {/* === DISTRICT HITBOXES === */}
        {(Object.keys(DISTRICT_ZONES) as DistrictId[]).map(id => {
          const zone = DISTRICT_ZONES[id];
          const isSelected = selectedDistrict === id;
          return (
            <rect key={`hit-${id}`} x={zone.x} y={zone.y} width={zone.w} height={zone.h}
              fill={isSelected ? 'hsla(45, 93%, 40%, 0.05)' : 'transparent'}
              stroke={isSelected ? 'hsla(45, 93%, 40%, 0.2)' : 'transparent'}
              strokeWidth="1" rx="4"
              className="cursor-pointer" onClick={() => onSelectDistrict(id)} />
          );
        })}

        {/* === DISTRICT LABELS === */}
        {(Object.keys(DISTRICT_META) as DistrictId[]).map(id => {
          const meta = DISTRICT_META[id];
          const district = DISTRICTS[id];
          const isSelected = selectedDistrict === id;
          const isOwned = ownedDistricts.includes(id);
          const hasDemand = !!districtDemands[id];

          return (
            <g key={`label-${id}`} onClick={() => onSelectDistrict(id)} className="cursor-pointer">
              {isOwned && !isSelected && (
                <motion.circle cx={meta.cx} cy={meta.cy} r="22"
                  fill="none" stroke="hsla(0, 72%, 51%, 0.15)" strokeWidth="1.5"
                  animate={{ r: [20, 26, 20], opacity: [0.15, 0.05, 0.15], strokeWidth: [1.5, 0.8, 1.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
              )}
              {isOwned && !isSelected && (
                <motion.circle cx={meta.cx} cy={meta.cy} r="15"
                  fill="hsla(0, 72%, 51%, 0.04)"
                  animate={{ r: [15, 18, 15], opacity: [0.04, 0.01, 0.04] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
              )}
              {isSelected && (
                <circle cx={meta.cx} cy={meta.cy} r="20" fill="hsla(45, 93%, 40%, 0.08)" filter="url(#district-glow)" />
              )}
              <rect x={meta.cx - meta.labelW / 2} y={meta.cy - 8} width={meta.labelW} height="16" rx="3"
                fill={isSelected ? 'hsla(45, 93%, 40%, 0.2)' : 'hsla(0, 0%, 5%, 0.85)'}
                stroke={isSelected ? 'hsl(45 93% 40%)' : isOwned ? 'hsl(0 72% 51%)' : 'hsl(0 0% 20%)'}
                strokeWidth={isSelected ? '1.5' : '0.5'} />
              {isOwned && !isSelected && (
                <motion.rect x={meta.cx - meta.labelW / 2} y={meta.cy - 8}
                  width={meta.labelW} height="16" rx="3" fill="none"
                  stroke="hsl(0 72% 51%)" strokeWidth="0.5"
                  animate={{ strokeOpacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
              )}
              <text x={meta.cx} y={meta.cy + 3} textAnchor="middle"
                fill={isSelected ? 'hsl(45 93% 50%)' : isOwned ? 'hsl(0 72% 60%)' : 'hsl(0 0% 65%)'}
                fontSize="6.5" fontWeight="bold" fontFamily="Inter, system-ui, sans-serif" letterSpacing="0.3"
                style={{ textTransform: 'uppercase' }}>
                {district.name}
              </text>
              {isOwned && (
                <g transform={`translate(${meta.cx + meta.labelW / 2 - 2}, ${meta.cy - 10})`}>
                  <motion.circle r="5" fill="hsl(0 72% 51%)"
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
                  <text x="0" y="3" textAnchor="middle" fill="white" fontSize="6">♛</text>
                </g>
              )}
              {hasDemand && (
                <motion.g transform={`translate(${meta.cx - meta.labelW / 2 + 2}, ${meta.cy - 10})`}
                  animate={{ y: [0, -1.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
                  <circle r="4" fill="hsl(45 93% 40%)" opacity="0.9" />
                  <text x="0" y="3" textAnchor="middle" fill="hsl(0 0% 5%)" fontSize="5" fontWeight="bold">$</text>
                </motion.g>
              )}
            </g>
          );
        })}

        {/* === PLAYER MARKER === */}
        <g transform={`translate(${DISTRICT_META[playerLocation].cx}, ${DISTRICT_META[playerLocation].cy - 18})`}>
          <motion.circle cy="0" r="5" fill="none" stroke="hsl(45 93% 40%)" strokeWidth="1" opacity="0.6"
            animate={{ r: [5, 10, 5], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cy="0" r="4" fill="hsl(45 93% 40%)" filter="url(#player-glow)" />
          <circle cy="0" r="2" fill="hsl(45 93% 60%)" />
          <rect x="-8" y="-14" width="16" height="8" rx="2" fill="hsl(45 93% 40%)" />
          <text x="0" y="-8" textAnchor="middle" fill="hsl(0 0% 5%)" fontSize="5" fontWeight="bold" fontFamily="Inter, sans-serif">JIJ</text>
        </g>

        {/* === TRAFFIC === */}
        {ROADS.map((d, i) => (
          <motion.circle key={`t1-${i}`} r="1.5" fill="hsl(45 50% 50%)" opacity="0.35"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 4 + i * 1.2, repeat: Infinity, ease: 'linear', delay: i * 0.6 }}
            style={{ offsetPath: `path("${d}")` }} />
        ))}
        {ROADS.slice(0, 5).map((d, i) => (
          <motion.circle key={`t2-${i}`} r="1" fill="hsl(0 60% 50%)" opacity="0.25"
            animate={{ offsetDistance: ['100%', '0%'] }}
            transition={{ duration: 5 + i * 1.5, repeat: Infinity, ease: 'linear', delay: i * 1.2 + 2 }}
            style={{ offsetPath: `path("${d}")` }} />
        ))}
        {ROADS.slice(2, 5).map((d, i) => (
          <motion.rect key={`bus-${i}`} x="-2.5" y="-1" width="5" height="2" rx="0.5"
            fill="hsla(200, 50%, 40%, 0.3)"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 10 + i * 3, repeat: Infinity, ease: 'linear', delay: i * 4 + 3 }}
            style={{ offsetPath: `path("${d}")` }} />
        ))}
        {ROADS.slice(0, 3).map((d, i) => (
          <motion.circle key={`moto-${i}`} r="0.8" fill="hsla(45, 80%, 55%, 0.5)"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 2.5 + i * 0.8, repeat: Infinity, ease: 'linear', delay: i * 2 + 5 }}
            style={{ offsetPath: `path("${d}")` }} />
        ))}
        {vehicleHeat > 40 && (
          <motion.circle r="1.8" opacity="0.5"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ offsetPath: `path("${ROADS[Math.floor(vehicleHeat / 30) % ROADS.length]}")` }}>
            <animate attributeName="fill" values="hsla(220,80%,50%,0.8);hsla(0,80%,50%,0.8)" dur="0.4s" repeatCount="indefinite" />
          </motion.circle>
        )}

        {/* === MAP EVENTS === */}
        <MapEventMarkers events={mapEvents} vehicleHeat={vehicleHeat} />

        {/* === TRAVEL ANIMATION === */}
        <AnimatePresence>
          {travelAnim && (
            <TravelAnimation from={travelAnim.from} to={travelAnim.to} districtMeta={DISTRICT_META} />
          )}
        </AnimatePresence>

        {/* === NEMESIS MARKER === */}
        {nemesis && <NemesisMarker nemesis={nemesis} districtMeta={DISTRICT_META} />}

        {/* === WEATHER OVERLAY === */}
        <WeatherOverlay weather={weather} />

        {/* === HEAT OVERLAY === */}
        <HeatOverlay heat={heat} vehicleHeat={vehicleHeat} personalHeat={personalHeat} />

        {/* === SKYLINE & FOG === */}
        <SkylineEffect />

        {/* === MAP OVERLAY UI === */}
        <MapOverlayUI />

        {/* === SCANLINE === */}
        <motion.rect x="0" width="400" height="2" fill="hsla(45, 93%, 40%, 0.04)" pointerEvents="none"
          animate={{ y: [-10, 300] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} />
      </svg>

      {/* Corner decorations */}
      <div className="absolute top-2 left-2 text-[0.5rem] text-muted-foreground font-mono opacity-40 uppercase tracking-widest">
        Noxhaven City
      </div>
      <div className="absolute bottom-2 right-2 text-[0.45rem] text-muted-foreground font-mono opacity-30">
        v4.0
      </div>
      {Math.max(vehicleHeat, personalHeat) > 70 && (
        <div className="absolute top-2 right-2 text-[0.5rem] font-mono font-bold opacity-60 animate-pulse flex items-center gap-1">
          {vehicleHeat > 70 && <span className="text-ice">● 🚗</span>}
          {personalHeat > 70 && <span className="text-blood">● 🔥</span>}
          <span className="text-blood">HIGH ALERT</span>
        </div>
      )}
    </div>
  );
}
