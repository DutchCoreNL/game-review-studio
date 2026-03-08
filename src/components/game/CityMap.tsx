import { DistrictId, MapEvent, WeatherType, NemesisState, SmuggleRoute, Safehouse, VillaState } from '@/game/types';
import { TerritoryHeatmap } from './mmo/TerritoryHeatmap';
import { DISTRICTS } from '@/game/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { WeatherOverlay } from './map/WeatherOverlay';
import { TimeOfDayOverlay } from './map/TimeOfDayOverlay';
import { NemesisMarker } from './map/NemesisMarker';
import { CityAmbience } from './map/CityAmbience';
import { SkylineEffect, MapOverlayUI } from './map/SkylineEffect';
import { MapEventMarkers } from './map/MapEventMarkers';
import { HeatOverlay } from './map/HeatOverlay';
import { TravelAnimation } from './map/TravelAnimation';
import { TrafficLayer } from './map/TrafficLayer';
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
// ViewBox: 0 0 400 290.
export const ROADS = [
  'M 38,108 Q 58,118 82,130 Q 110,144 140,156 Q 165,164 188,170',
  'M 212,168 Q 238,152 260,138 Q 285,122 310,108 Q 328,98 350,85',
  'M 52,100 Q 72,90 95,78 Q 125,65 155,55 Q 175,48 200,42',
  'M 200,42 Q 225,48 250,58 Q 275,68 300,80 Q 325,90 348,82',
  'M 188,165 Q 195,158 200,155 Q 205,155 212,158 Q 218,165 215,172 Q 208,178 200,180 Q 192,178 188,172 Q 186,168 188,165',
  'M 190,176 Q 172,192 150,206 Q 128,218 108,228 Q 90,236 72,244',
  'M 210,176 Q 232,190 255,202 Q 278,214 298,222 Q 312,228 332,236',
  'M 352,88 Q 358,112 360,140 Q 358,168 352,196 Q 344,218 332,238',
  'M 74,248 Q 115,254 160,258 Q 205,258 250,254 Q 290,248 332,238',
  'M 32,72 Q 34,95 36,120 Q 38,148 40,178 Q 44,210 50,238 Q 55,252 62,262',
  'M 68,228 Q 82,218 98,212 Q 112,210 122,216 Q 118,228 104,236 Q 88,242 72,238 Q 66,234 68,228',
  'M 318,102 Q 298,118 275,135 Q 252,150 232,164',
  'M 200,45 Q 200,78 200,108 Q 200,132 200,155',
  'M 42,115 Q 50,132 55,150 Q 58,168 56,188 Q 52,200 48,208',
  'M 318,222 Q 334,226 342,234 Q 346,244 340,252 Q 330,256 318,248 Q 314,238 318,222',
  'M 48,148 Q 52,175 56,202 Q 62,222 70,240',
  'M 80,95 Q 108,108 138,125 Q 162,138 185,152',
  'M 215,175 Q 242,192 268,208 Q 290,218 310,226',
  'M 305,78 Q 320,82 335,92 Q 348,100 355,112 Q 352,125 340,118 Q 325,108 310,96 Q 305,86 305,78',
  'M 72,240 Q 65,225 58,208 Q 52,188 48,168 Q 44,148 42,128',
];

// Ambient background roads
const AMBIENT_ROADS = [
  'M 85,148 Q 135,152 185,155',
  'M 215,155 Q 265,148 315,140',
  'M 65,210 Q 110,215 155,218',
  'M 260,210 Q 300,215 340,218',
  'M 120,180 Q 160,178 200,175',
  'M 200,175 Q 240,178 280,180',
  'M 100,100 Q 102,150 105,200',
  'M 200,50 Q 198,150 200,250',
  'M 310,80 Q 312,150 315,220',
  'M 150,120 Q 148,170 150,220',
  'M 250,100 Q 252,160 255,220',
  'M 48,170 Q 50,200 55,230',
  'M 340,110 Q 345,160 340,210',
  'M 165,90 Q 168,130 170,170',
];

// District label positions
export const DISTRICT_META: Record<DistrictId, { cx: number; cy: number; labelW: number }> = {
  port:  { cx: 75,  cy: 80,  labelW: 52 },
  crown: { cx: 320, cy: 75,  labelW: 72 },
  iron:  { cx: 80,  cy: 220, labelW: 64 },
  low:   { cx: 320, cy: 225, labelW: 42 },
  neon:  { cx: 200, cy: 175, labelW: 56 },
};

// District zones for hit areas
const DISTRICT_ZONES: Record<DistrictId, { x: number; y: number; w: number; h: number }> = {
  port:  { x: 30,  y: 50,  w: 100, h: 65 },
  crown: { x: 270, y: 40,  w: 110, h: 75 },
  iron:  { x: 30,  y: 185, w: 110, h: 65 },
  low:   { x: 275, y: 195, w: 100, h: 60 },
  neon:  { x: 155, y: 145, w: 100, h: 60 },
};

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

        {/* === LAYER: City Ambience === */}
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

        {/* === MMO: TERRITORY HEATMAP === */}
        {districtData && <TerritoryHeatmap districtData={districtData} />}

        {/* === MMO: DANGER LEVEL OVERLAY === */}
        {districtData && (Object.keys(DISTRICT_ZONES) as DistrictId[]).map(id => {
          const danger = districtData.dangerLevels[id] || 0;
          if (danger < 10) return null;
          const zone = DISTRICT_ZONES[id];
          const intensity = Math.min(1, danger / 100);
          const hue = 120 - intensity * 120;
          return (
            <rect key={`danger-${id}`} x={zone.x} y={zone.y} width={zone.w} height={zone.h}
              fill={`hsla(${hue}, 70%, 40%, ${0.03 + intensity * 0.08})`}
              rx="4" pointerEvents="none" />
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
        <TrafficLayer roads={ROADS} vehicleHeat={vehicleHeat} />

        {/* === MAP EVENTS === */}
        <MapEventMarkers events={mapEvents} vehicleHeat={vehicleHeat} roads={ROADS} />

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
        <HeatOverlay heat={heat} vehicleHeat={vehicleHeat} personalHeat={personalHeat} roads={ROADS} />

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
