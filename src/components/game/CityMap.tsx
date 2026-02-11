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
// === MAIN ROADS — traced precisely on the isometric background ===
const ROADS = [
  // R0: Main highway from harbor (top-left) diagonally to central roundabout
  'M 45,128 Q 70,135 95,145 Q 130,158 160,168 Q 180,174 198,175',
  // R1: Highway continuation from roundabout to Crown Heights (top-right)
  'M 202,172 Q 230,155 255,140 Q 280,120 305,105 Q 320,95 340,82',
  // R2: Northern ridge road — Port area to Villa hilltop
  'M 55,145 Q 80,120 110,105 Q 140,90 170,75 Q 190,65 200,55',
  // R3: Villa hilltop to Crown Heights along the ridge
  'M 200,55 Q 230,60 255,68 Q 280,78 305,88 Q 325,96 345,78',
  // R4: Neon roundabout — circular traffic loop at center
  'M 185,168 Q 192,160 200,158 Q 208,160 215,168 Q 210,178 200,182 Q 190,178 185,168',
  // R5: Roundabout south-west to Iron Borough (factories)
  'M 192,180 Q 170,195 148,208 Q 125,218 100,228 Q 85,235 72,240',
  // R6: Roundabout south-east to Lowrise (residential)
  'M 208,180 Q 230,192 255,205 Q 278,215 300,222 Q 315,228 330,232',
  // R7: Eastern expressway — Crown Heights south to Lowrise
  'M 345,85 Q 352,110 356,140 Q 355,170 348,200 Q 340,220 330,235',
  // R8: Southern cross-road — Iron Borough east to Lowrise
  'M 75,245 Q 120,252 165,255 Q 210,254 255,248 Q 300,240 330,235',
  // R9: Western coastal road — along the harbor/water edge
  'M 35,130 Q 38,155 40,180 Q 42,205 48,228 Q 52,240 60,250',
  // R10: Iron Borough internal — factory district loop
  'M 65,225 Q 78,215 90,210 Q 105,208 115,215 Q 110,228 95,235 Q 78,238 65,232',
  // R11: Crown-Neon connector — diagonal shortcut mid-east
  'M 310,100 Q 290,120 270,140 Q 250,155 230,168',
  // R12: Central spine — Villa straight south to roundabout
  'M 200,60 Q 200,90 200,120 Q 200,140 200,158',
  // R13: Port inner harbor road
  'M 48,140 Q 55,155 60,170 Q 62,185 58,200',
  // R14: Lowrise residential loop
  'M 315,218 Q 330,222 340,230 Q 345,240 338,248 Q 325,250 315,242',
  // R15: Secondary connector Port to Iron via west
  'M 52,160 Q 55,185 60,210 Q 65,225 72,238',
];

// Ambient background roads — faint urban grid for depth
const AMBIENT_ROADS = [
  'M 90,160 Q 140,158 190,160',
  'M 200,58 Q 198,140 200,250',
  'M 42,210 L 130,210',
  'M 255,72 Q 305,78 360,85',
  'M 340,90 Q 338,170 340,245',
  'M 130,120 Q 190,122 250,120',
  'M 105,170 Q 103,215 105,255',
  'M 245,155 Q 305,158 360,162',
  'M 48,140 Q 95,142 145,145',
  'M 280,220 Q 325,224 370,228',
  'M 155,185 Q 153,225 155,260',
  'M 55,180 Q 95,182 135,185',
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
        {/* Headlights — warm dots, 2 per main road at staggered delays */}
        {ROADS.slice(0, 12).flatMap((d, i) => [0, 1].map(j => (
          <motion.circle key={`hl-${i}-${j}`} r={0.8 + (i % 3) * 0.2}
            fill="hsla(45, 65%, 58%, 0.45)" opacity={0.3 + j * 0.05}
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 5 + i * 0.9 + j * 2, repeat: Infinity, ease: 'linear', delay: j * 3.5 + i * 0.4 }}
            style={{ offsetPath: `path("${d}")` }} />
        )))}
        {/* Taillights — red/amber returning, staggered */}
        {ROADS.slice(0, 8).flatMap((d, i) => [0, 1].map(j => (
          <motion.circle key={`tl-${i}-${j}`} r={0.6 + (i % 2) * 0.2}
            fill={j === 0 ? 'hsla(0, 60%, 48%, 0.35)' : 'hsla(20, 70%, 50%, 0.3)'}
            opacity="0.25"
            animate={{ offsetDistance: ['100%', '0%'] }}
            transition={{ duration: 6 + i * 1.2 + j * 2.5, repeat: Infinity, ease: 'linear', delay: j * 4 + i * 0.8 + 1 }}
            style={{ offsetPath: `path("${d}")` }} />
        )))}
        {/* Roundabout traffic — purple-tinted particles circling the Neon plaza */}
        {[0, 1, 2, 3].map(i => (
          <motion.circle key={`rnd-${i}`} r={0.7 + (i % 2) * 0.2}
            fill={i % 2 === 0 ? 'hsla(280, 55%, 55%, 0.4)' : 'hsla(320, 50%, 50%, 0.35)'}
            opacity="0.35"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, ease: 'linear', delay: i * 0.9 }}
            style={{ offsetPath: `path("${ROADS[4]}")` }} />
        ))}
        {/* Buses — slow rectangles on highway and boulevard */}
        {[0, 1, 7].map((ri, i) => (
          <motion.rect key={`bus-${i}`} x="-1.8" y="-0.7" width="3.6" height="1.4" rx="0.4"
            fill="hsla(200, 45%, 42%, 0.22)"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 14 + i * 4, repeat: Infinity, ease: 'linear', delay: i * 6 + 3 }}
            style={{ offsetPath: `path("${ROADS[ri]}")` }} />
        ))}
        {/* Motorcycles — tiny fast dots */}
        {ROADS.slice(0, 5).map((d, i) => (
          <motion.circle key={`moto-${i}`} r="0.5"
            fill="hsla(45, 85%, 62%, 0.55)"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: 'linear', delay: i * 2.8 + 5 }}
            style={{ offsetPath: `path("${d}")` }} />
        ))}
        {/* Coastal traffic — dim harbor-blue dots along western shore */}
        {[0, 1, 2].map(i => (
          <motion.circle key={`coast-${i}`} r="0.7"
            fill="hsla(210, 40%, 50%, 0.3)" opacity="0.25"
            animate={{ offsetDistance: i % 2 === 0 ? ['0%', '100%'] : ['100%', '0%'] }}
            transition={{ duration: 7 + i * 2.5, repeat: Infinity, ease: 'linear', delay: i * 3 }}
            style={{ offsetPath: `path("${ROADS[9]}")` }} />
        ))}
        {/* Factory district loop traffic */}
        {[0, 1].map(i => (
          <motion.circle key={`fac-${i}`} r="0.6"
            fill="hsla(30, 50%, 45%, 0.3)" opacity="0.3"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 4 + i * 1.5, repeat: Infinity, ease: 'linear', delay: i * 2.5 }}
            style={{ offsetPath: `path("${ROADS[10]}")` }} />
        ))}
        {/* Lowrise residential loop traffic */}
        {[0, 1].map(i => (
          <motion.circle key={`res-${i}`} r="0.6"
            fill="hsla(45, 50%, 50%, 0.3)" opacity="0.25"
            animate={{ offsetDistance: i === 0 ? ['0%', '100%'] : ['100%', '0%'] }}
            transition={{ duration: 5 + i * 2, repeat: Infinity, ease: 'linear', delay: i * 3 }}
            style={{ offsetPath: `path("${ROADS[14]}")` }} />
        ))}
        {/* Emergency vehicle — reacts to vehicle heat */}
        {vehicleHeat > 40 && (
          <motion.circle r="1.3" opacity="0.5"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ offsetPath: `path("${ROADS[Math.floor(vehicleHeat / 25) % ROADS.length]}")` }}>
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
