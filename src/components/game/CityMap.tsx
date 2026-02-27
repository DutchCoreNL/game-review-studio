import { DistrictId, MapEvent, WeatherType, NemesisState, SmuggleRoute, Safehouse, VillaState } from '@/game/types';
import { DISTRICTS } from '@/game/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { WeatherOverlay } from './map/WeatherOverlay';
import { TimeOfDayOverlay } from './map/TimeOfDayOverlay';
import { NemesisMarker } from './map/NemesisMarker';
import { CityAmbience } from './map/CityAmbience';
import { SkylineEffect, MapOverlayUI } from './map/SkylineEffect';
import cityMapBg from '@/assets/city-map-bg.png';
import type { DistrictData, DistrictEvent, GangTerritoryInfo } from '@/hooks/useDistrictData';
import type { TimeOfDay } from '@/hooks/useWorldState';

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
  timeOfDay?: TimeOfDay;
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
  districtData?: DistrictData;
}

// Road paths — precisely traced on the isometric background image
// ViewBox: 0 0 400 290. Roads follow isometric angles (~26.5°) matching the background.
// === MAIN ROADS ===
const ROADS = [
  // R0: Harbor boulevard — Port Nero docks east along waterfront to Neon approach
  'M 38,108 Q 58,118 82,130 Q 110,144 140,156 Q 165,164 188,170',
  // R1: Neon-to-Crown highway — from roundabout NE up to Crown Heights financial district
  'M 212,168 Q 238,152 260,138 Q 285,122 310,108 Q 328,98 350,85',
  // R2: Northern ridge — Port harbor north up to Villa hilltop
  'M 52,100 Q 72,90 95,78 Q 125,65 155,55 Q 175,48 200,42',
  // R3: Villa ridge east — hilltop along ridge to Crown Heights
  'M 200,42 Q 225,48 250,58 Q 275,68 300,80 Q 325,90 348,82',
  // R4: Neon Strip roundabout — circular loop at city center
  'M 188,165 Q 195,158 200,155 Q 205,155 212,158 Q 218,165 215,172 Q 208,178 200,180 Q 192,178 188,172 Q 186,168 188,165',
  // R5: Neon south-west — roundabout down to Iron Borough factories
  'M 190,176 Q 172,192 150,206 Q 128,218 108,228 Q 90,236 72,244',
  // R6: Neon south-east — roundabout down to Lowrise residential
  'M 210,176 Q 232,190 255,202 Q 278,214 298,222 Q 312,228 332,236',
  // R7: Eastern expressway — Crown Heights south along east edge to Lowrise
  'M 352,88 Q 358,112 360,140 Q 358,168 352,196 Q 344,218 332,238',
  // R8: Southern cross-road — Iron Borough east to Lowrise bottom edge
  'M 74,248 Q 115,254 160,258 Q 205,258 250,254 Q 290,248 332,238',
  // R9: Western coastal road — along harbor waterfront, north to south
  'M 32,72 Q 34,95 36,120 Q 38,148 40,178 Q 44,210 50,238 Q 55,252 62,262',
  // R10: Iron Borough loop — internal factory district circuit
  'M 68,228 Q 82,218 98,212 Q 112,210 122,216 Q 118,228 104,236 Q 88,242 72,238 Q 66,234 68,228',
  // R11: Crown-Neon diagonal shortcut — mid-eastern connector
  'M 318,102 Q 298,118 275,135 Q 252,150 232,164',
  // R12: Central spine — Villa hilltop straight south to roundabout
  'M 200,45 Q 200,78 200,108 Q 200,132 200,155',
  // R13: Port inner harbor road — small loop inside Port Nero docks
  'M 42,115 Q 50,132 55,150 Q 58,168 56,188 Q 52,200 48,208',
  // R14: Lowrise residential loop — small circuit in Lowrise
  'M 318,222 Q 334,226 342,234 Q 346,244 340,252 Q 330,256 318,248 Q 314,238 318,222',
  // R15: West connector — Port area south to Iron Borough via coastal path
  'M 48,148 Q 52,175 56,202 Q 62,222 70,240',
  // R16: Port-to-Neon northern approach — upper diagonal connector
  'M 80,95 Q 108,108 138,125 Q 162,138 185,152',
  // R17: Neon-to-Lowrise direct — shortcut bypassing expressway
  'M 215,175 Q 242,192 268,208 Q 290,218 310,226',
  // R18: Crown internal road — financial district inner loop
  'M 305,78 Q 320,82 335,92 Q 348,100 355,112 Q 352,125 340,118 Q 325,108 310,96 Q 305,86 305,78',
  // R19: Iron-to-Port connector — western industrial road
  'M 72,240 Q 65,225 58,208 Q 52,188 48,168 Q 44,148 42,128',
];

// Ambient background roads — faint urban grid lines for depth and atmosphere
const AMBIENT_ROADS = [
  // Horizontal grid lines following isometric angles
  'M 85,148 Q 135,152 185,155',           // Port-to-Neon mid connector
  'M 215,155 Q 265,148 315,140',           // Neon-to-Crown mid connector
  'M 65,210 Q 110,215 155,218',            // Iron Borough horizontal
  'M 260,210 Q 300,215 340,218',           // Lowrise horizontal
  'M 120,180 Q 160,178 200,175',           // Neon approach west
  'M 200,175 Q 240,178 280,180',           // Neon approach east
  // Vertical grid lines
  'M 100,100 Q 102,150 105,200',           // Port vertical spine
  'M 200,50 Q 198,150 200,250',            // Central vertical spine
  'M 310,80 Q 312,150 315,220',            // Crown-Lowrise vertical
  'M 150,120 Q 148,170 150,220',           // West-central vertical
  'M 250,100 Q 252,160 255,220',           // East-central vertical
  'M 48,170 Q 50,200 55,230',              // Coastal south section
  'M 340,110 Q 345,160 340,210',           // Eastern edge vertical
  'M 165,90 Q 168,130 170,170',            // Villa approach south
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

export function CityMap({ playerLocation, selectedDistrict, ownedDistricts, districtDemands, mapEvents, heat, vehicleHeat, personalHeat, weather, timeOfDay, nemesis, travelAnim, onSelectDistrict, smuggleRoutes = [], districtRep, onChopShopClick, safehouses = [], onSafehouseClick, villa, onVillaClick, districtData }: CityMapProps) {
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

          // Perk text — shortened for map display
          const perkShort: Record<DistrictId, string> = {
            port: '+10% Smokkel',
            crown: '-20% Heat/dag',
            iron: '-20% Heal kosten',
            low: 'Goedkopere Ops',
            neon: '+10% Casino',
          };

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
              {/* Perk label for owned districts */}
              {isOwned && (
                <g>
                  <rect x={meta.cx - meta.labelW / 2 - 2} y={meta.cy + 10} width={meta.labelW + 4} height="10" rx="2"
                    fill="hsla(0, 0%, 5%, 0.85)"
                    stroke="hsla(45, 93%, 40%, 0.25)" strokeWidth="0.5" />
                  <text x={meta.cx} y={meta.cy + 17} textAnchor="middle"
                    fill="hsla(45, 93%, 55%, 0.85)"
                    fontSize="4" fontWeight="600" fontFamily="Inter, system-ui, sans-serif"
                    letterSpacing="0.2">
                    {perkShort[id]}
                  </text>
                </g>
              )}
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

        {/* === MMO: DANGER LEVEL OVERLAY === */}
        {districtData && (Object.keys(DISTRICT_ZONES) as DistrictId[]).map(id => {
          const danger = districtData.dangerLevels[id] || 0;
          if (danger < 10) return null;
          const zone = DISTRICT_ZONES[id];
          const intensity = Math.min(1, danger / 100);
          const hue = 120 - intensity * 120; // green(120) → red(0)
          return (
            <rect key={`danger-${id}`} x={zone.x} y={zone.y} width={zone.w} height={zone.h}
              fill={`hsla(${hue}, 70%, 40%, ${0.03 + intensity * 0.08})`}
              rx="4" pointerEvents="none" />
          );
        })}

        {/* === MMO: GANG TERRITORY BORDERS === */}
        {districtData?.territories.map(t => {
          const zone = DISTRICT_ZONES[t.district_id as DistrictId];
          if (!zone) return null;
          // Generate a deterministic hue from gang_tag
          const tagHash = t.gang_tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
          const gangHue = tagHash % 360;
          return (
            <g key={`gang-${t.district_id}`} pointerEvents="none">
              <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h}
                fill="none" stroke={`hsla(${gangHue}, 70%, 50%, 0.4)`}
                strokeWidth="1.5" strokeDasharray="4 2" rx="4" />
            </g>
          );
        })}

        {/* === MMO: PLAYER COUNT BADGES === */}
        {districtData && (Object.keys(DISTRICT_META) as DistrictId[]).map(id => {
          const count = districtData.playerCounts[id] || 0;
          if (count <= 0) return null;
          const meta = DISTRICT_META[id];
          const bx = meta.cx + meta.labelW / 2 + 6;
          const by = meta.cy - 2;
          return (
            <g key={`pcount-${id}`} pointerEvents="none">
              <rect x={bx - 8} y={by - 5} width="16" height="10" rx="3"
                fill="hsla(0, 0%, 5%, 0.85)" stroke="hsla(200, 60%, 50%, 0.4)" strokeWidth="0.5" />
              <text x={bx} y={by + 2.5} textAnchor="middle"
                fill="hsla(200, 60%, 65%, 0.9)" fontSize="4.5" fontWeight="bold"
                fontFamily="Inter, system-ui, sans-serif">
                👥{count}
              </text>
            </g>
          );
        })}

        {/* === MMO: GANG TAG ON DISTRICTS === */}
        {districtData?.territories.map(t => {
          const meta = DISTRICT_META[t.district_id as DistrictId];
          if (!meta) return null;
          const tagHash = t.gang_tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
          const gangHue = tagHash % 360;
          return (
            <g key={`gtag-${t.district_id}`} pointerEvents="none">
              <rect x={meta.cx - meta.labelW / 2} y={meta.cy + 9} width={meta.labelW} height="8" rx="2"
                fill="hsla(0, 0%, 5%, 0.85)" stroke={`hsla(${gangHue}, 60%, 45%, 0.4)`} strokeWidth="0.5" />
              <text x={meta.cx} y={meta.cy + 15} textAnchor="middle"
                fill={`hsla(${gangHue}, 60%, 60%, 0.9)`} fontSize="4" fontWeight="bold"
                fontFamily="Inter, system-ui, sans-serif">
                [{t.gang_tag}]
              </text>
            </g>
          );
        })}

        {/* === MMO: DISTRICT EVENT MARKERS === */}
        {districtData?.events.map((ev, idx) => {
          const meta = DISTRICT_META[ev.district_id as DistrictId];
          if (!meta) return null;
          // Offset markers slightly so they don't overlap
          const angle = (idx * 72) * Math.PI / 180;
          const ex = meta.cx + Math.cos(angle) * 16;
          const ey = meta.cy + Math.sin(angle) * 12;
          const eventIcons: Record<string, string> = {
            gang_war: '⚔️', police_raid: '🚨', market_crash: '📉',
            bounty_hunt: '🎯', territory_captured: '🏴', drug_bust: '💊',
          };
          const icon = eventIcons[ev.event_type] || '❗';
          return (
            <motion.g key={`ev-${ev.id}`}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>
              <circle cx={ex} cy={ey} r="5" fill="hsla(0, 0%, 5%, 0.8)"
                stroke="hsla(0, 70%, 50%, 0.5)" strokeWidth="0.5" />
              <text x={ex} y={ey + 2.5} textAnchor="middle" fontSize="5">{icon}</text>
            </motion.g>
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
        {/* Headlights — warm dots moving forward on main roads, density varies by road importance */}
        {ROADS.slice(0, 16).flatMap((d, i) => {
          // Busy roads (R0,R1,R4,R7) get 3-4 vehicles; quiet roads get 1-2
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
        {/* Taillights — red/amber returning (oncoming traffic), offset laterally for realism */}
        {ROADS.slice(0, 12).flatMap((d, i) => {
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
        {/* Roundabout traffic — purple-tinted particles circling the Neon plaza */}
        {[0, 1, 2, 3, 4].map(i => (
          <motion.circle key={`rnd-${i}`} r={0.65 + (i % 2) * 0.2}
            fill={i % 3 === 0 ? 'hsla(280, 55%, 55%, 0.4)' : i % 3 === 1 ? 'hsla(320, 50%, 50%, 0.35)' : 'hsla(45, 60%, 55%, 0.35)'}
            opacity="0.35"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 2 + i * 0.4, repeat: Infinity, ease: 'linear', delay: i * 0.7 }}
            style={{ offsetPath: `path("${ROADS[4]}")` }} />
        ))}
        {/* Buses — slow rectangles on highways and boulevards */}
        {[0, 1, 7, 8].map((ri, i) => (
          <motion.rect key={`bus-${i}`} x="-1.8" y="-0.7" width="3.6" height="1.4" rx="0.4"
            fill="hsla(200, 45%, 42%, 0.22)"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 14 + i * 3, repeat: Infinity, ease: 'linear', delay: i * 5 + 2 }}
            style={{ offsetPath: `path("${ROADS[ri]}")` }} />
        ))}
        {/* Motorcycles — tiny fast dots on main roads */}
        {ROADS.slice(0, 8).map((d, i) => (
          <motion.circle key={`moto-${i}`} r="0.45"
            fill="hsla(45, 85%, 62%, 0.55)"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 1.8 + i * 0.4, repeat: Infinity, ease: 'linear', delay: i * 2.2 + 4 }}
            style={{ offsetPath: `path("${d}")` }} />
        ))}
        {/* Coastal traffic — dim harbor-blue dots along western shore */}
        {[0, 1, 2].map(i => (
          <motion.circle key={`coast-${i}`} r="0.65"
            fill="hsla(210, 40%, 50%, 0.3)" opacity="0.25"
            animate={{ offsetDistance: i % 2 === 0 ? ['0%', '100%'] : ['100%', '0%'] }}
            transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'linear', delay: i * 2.5 }}
            style={{ offsetPath: `path("${ROADS[9]}")` }} />
        ))}
        {/* Factory district loop traffic */}
        {[0, 1].map(i => (
          <motion.circle key={`fac-${i}`} r="0.55"
            fill="hsla(30, 50%, 45%, 0.3)" opacity="0.3"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 3.5 + i * 1.2, repeat: Infinity, ease: 'linear', delay: i * 2 }}
            style={{ offsetPath: `path("${ROADS[10]}")` }} />
        ))}
        {/* Lowrise residential loop traffic */}
        {[0, 1].map(i => (
          <motion.circle key={`res-${i}`} r="0.55"
            fill="hsla(45, 50%, 50%, 0.3)" opacity="0.25"
            animate={{ offsetDistance: i === 0 ? ['0%', '100%'] : ['100%', '0%'] }}
            transition={{ duration: 4.5 + i * 1.5, repeat: Infinity, ease: 'linear', delay: i * 2.5 }}
            style={{ offsetPath: `path("${ROADS[14]}")` }} />
        ))}
        {/* Crown Heights internal traffic */}
        {[0, 1].map(i => (
          <motion.circle key={`crown-${i}`} r="0.5"
            fill="hsla(220, 40%, 55%, 0.35)" opacity="0.3"
            animate={{ offsetDistance: i === 0 ? ['0%', '100%'] : ['100%', '0%'] }}
            transition={{ duration: 5 + i * 2, repeat: Infinity, ease: 'linear', delay: i * 3 }}
            style={{ offsetPath: `path("${ROADS[18]}")` }} />
        ))}
        {/* Emergency vehicle — reacts to vehicle heat */}
        {vehicleHeat > 40 && (
          <motion.circle r="1.3" opacity="0.5"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
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
        {/* === TIME OF DAY OVERLAY === */}
        <TimeOfDayOverlay timeOfDay={timeOfDay || 'day'} />

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
