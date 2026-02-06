import { DistrictId, MapEvent, WeatherType, NemesisState } from '@/game/types';
import { DISTRICTS } from '@/game/constants';
import { motion } from 'framer-motion';
import { WeatherOverlay } from './map/WeatherOverlay';
import { NemesisMarker } from './map/NemesisMarker';

interface CityMapProps {
  playerLocation: DistrictId;
  selectedDistrict: DistrictId | null;
  ownedDistricts: DistrictId[];
  districtDemands: Record<string, any>;
  mapEvents: MapEvent[];
  heat: number;
  weather: WeatherType;
  nemesis: NemesisState | null;
  onSelectDistrict: (id: DistrictId) => void;
}

// Road paths connecting districts
const ROADS = [
  'M 95,115 L 95,175 Q 95,185 105,185 L 185,185',
  'M 130,88 L 240,88 Q 250,88 250,95 L 250,100',
  'M 295,135 L 295,185 Q 295,195 305,195 L 310,195',
  'M 230,200 L 310,200',
  'M 115,245 L 185,220',
  'M 85,225 L 85,120',
  'M 210,175 L 250,130',
  'M 130,250 Q 200,250 310,215',
];

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

// District label positions
const DISTRICT_META: Record<DistrictId, { cx: number; cy: number; labelW: number }> = {
  port: { cx: 85, cy: 88, labelW: 52 },
  crown: { cx: 270, cy: 100, labelW: 72 },
  iron: { cx: 195, cy: 195, labelW: 64 },
  low: { cx: 80, cy: 245, labelW: 42 },
  neon: { cx: 325, cy: 200, labelW: 56 },
};

// District zones for hit areas
const DISTRICT_ZONES: Record<DistrictId, { x: number; y: number; w: number; h: number }> = {
  port: { x: 40, y: 50, w: 100, h: 70 },
  crown: { x: 220, y: 50, w: 100, h: 80 },
  iron: { x: 150, y: 155, w: 95, h: 60 },
  low: { x: 35, y: 210, w: 95, h: 55 },
  neon: { x: 275, y: 160, w: 100, h: 65 },
};

// ========== DISTRICT LANDMARK RENDERERS ==========

function PortNeroLandmarks({ isOwned, isSelected }: { isOwned: boolean; isSelected: boolean }) {
  const baseColor = isOwned ? 'hsla(0, 30%, 15%, 0.8)' : 'hsla(200, 20%, 12%, 0.8)';
  const accentColor = isOwned ? 'hsl(0, 72%, 51%)' : 'hsl(200, 40%, 35%)';
  return (
    <g>
      {/* Water at left edge */}
      <rect x="30" y="55" width="12" height="60" fill="hsla(210, 50%, 15%, 0.6)" rx="1" />
      <motion.path d="M 30,65 Q 36,62 42,65 Q 36,68 30,65" fill="none" stroke="hsla(210, 60%, 35%, 0.4)" strokeWidth="0.7"
        animate={{ y: [0, 2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.path d="M 30,80 Q 36,77 42,80 Q 36,83 30,80" fill="none" stroke="hsla(210, 60%, 35%, 0.3)" strokeWidth="0.7"
        animate={{ y: [0, -1.5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
      <motion.path d="M 30,95 Q 36,92 42,95 Q 36,98 30,95" fill="none" stroke="hsla(210, 60%, 35%, 0.3)" strokeWidth="0.7"
        animate={{ y: [0, 1, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
      
      {/* Dock/pier */}
      <rect x="42" y="70" width="25" height="3" fill="hsla(30, 30%, 25%, 0.7)" />
      <rect x="42" y="85" width="20" height="3" fill="hsla(30, 30%, 25%, 0.6)" />
      
      {/* Ship silhouette */}
      <path d="M 33,72 L 39,68 L 39,76 Z" fill={accentColor} opacity="0.6" />
      <rect x="35" y="66" width="1" height="5" fill={accentColor} opacity="0.5" />
      
      {/* Containers */}
      <rect x="50" y="60" width="8" height="5" fill="hsla(0, 50%, 30%, 0.7)" rx="0.5" />
      <rect x="60" y="58" width="8" height="5" fill="hsla(200, 40%, 25%, 0.7)" rx="0.5" />
      <rect x="50" y="66" width="8" height="5" fill="hsla(40, 50%, 30%, 0.6)" rx="0.5" />
      <rect x="60" y="64" width="8" height="5" fill="hsla(120, 30%, 25%, 0.6)" rx="0.5" />
      
      {/* Crane */}
      <rect x="75" y="52" width="2" height="38" fill={baseColor} />
      <rect x="70" y="52" width="15" height="2" fill={baseColor} />
      <line x1="85" y1="52" x2="85" y2="65" stroke={accentColor} strokeWidth="0.5" opacity="0.5" />
      
      {/* Warehouse buildings */}
      <rect x="95" y="62" width="18" height="14" fill={baseColor} rx="1" />
      <rect x="95" y="62" width="18" height="1" fill={accentColor} opacity="0.3" />
      <rect x="115" y="58" width="14" height="18" fill={baseColor} rx="1" />
      <rect x="115" y="58" width="14" height="1" fill={accentColor} opacity="0.3" />
      
      {/* Warehouse windows */}
      <rect x="98" y="66" width="3" height="2" fill="hsla(45, 80%, 50%, 0.12)" />
      <rect x="104" y="66" width="3" height="2" fill="hsla(45, 80%, 50%, 0.08)" />
      <rect x="118" y="62" width="3" height="2" fill="hsla(45, 80%, 50%, 0.1)" />
    </g>
  );
}

function CrownHeightsLandmarks({ isOwned, isSelected }: { isOwned: boolean; isSelected: boolean }) {
  const baseColor = isOwned ? 'hsla(0, 20%, 14%, 0.85)' : 'hsla(220, 15%, 14%, 0.85)';
  const glassColor = isOwned ? 'hsla(0, 40%, 30%, 0.4)' : 'hsla(210, 40%, 30%, 0.4)';
  return (
    <g>
      {/* Tallest tower (penthouse) */}
      <rect x="240" y="40" width="14" height="62" fill={baseColor} rx="1" />
      <rect x="240" y="40" width="14" height="1" fill="hsla(210, 60%, 50%, 0.3)" />
      {/* Penthouse glass top */}
      <rect x="241" y="42" width="12" height="4" fill={glassColor} rx="0.5" />
      {/* Antenna */}
      <line x1="247" y1="35" x2="247" y2="40" stroke="hsla(0, 0%, 40%, 0.6)" strokeWidth="0.8" />
      <circle cx="247" cy="35" r="1" fill="hsla(0, 80%, 50%, 0.8)">
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>
      
      {/* Second tower */}
      <rect x="256" y="48" width="12" height="54" fill={baseColor} rx="1" />
      <rect x="256" y="48" width="12" height="1" fill="hsla(210, 60%, 50%, 0.25)" />
      
      {/* Third tower */}
      <rect x="270" y="55" width="10" height="47" fill={baseColor} rx="1" />
      
      {/* Medium buildings */}
      <rect x="282" y="65" width="13" height="37" fill={baseColor} rx="1" />
      <rect x="297" y="70" width="11" height="32" fill={baseColor} rx="1" />
      
      {/* Smaller front buildings */}
      <rect x="225" y="68" width="13" height="34" fill={baseColor} rx="1" />
      
      {/* Windows (scattered lit) */}
      {[
        [243, 50], [243, 56], [249, 53], [249, 59], [243, 62], [249, 68],
        [259, 55], [265, 58], [259, 64], [265, 70],
        [273, 62], [273, 70], [277, 66],
        [285, 72], [291, 78], [285, 84],
        [228, 75], [234, 80],
      ].map(([x, y], i) => (
        <rect key={`cw-${i}`} x={x} y={y} width="2" height="2.5" rx="0.3"
          fill={`hsla(45, 80%, 50%, ${0.06 + Math.random() * 0.12})`}>
          {Math.random() > 0.7 && (
            <animate attributeName="opacity" values="0.1;0.2;0.05;0.15" dur={`${3 + Math.random() * 4}s`} repeatCount="indefinite" />
          )}
        </rect>
      ))}
    </g>
  );
}

function IronBoroughLandmarks({ isOwned, isSelected }: { isOwned: boolean; isSelected: boolean }) {
  const baseColor = isOwned ? 'hsla(0, 25%, 13%, 0.8)' : 'hsla(30, 15%, 12%, 0.8)';
  const metalColor = 'hsla(30, 20%, 30%, 0.6)';
  return (
    <g>
      {/* Factory 1 with chimney */}
      <rect x="160" y="168" width="22" height="22" fill={baseColor} rx="1" />
      <rect x="160" y="168" width="22" height="1.5" fill={metalColor} />
      <rect x="164" y="158" width="4" height="12" fill="hsla(0, 0%, 18%, 0.9)" />
      {/* Smoke */}
      <motion.circle cx="166" cy="155" r="2.5" fill="hsla(0, 0%, 40%, 0.2)"
        animate={{ cy: [155, 145, 135], r: [2.5, 4, 6], opacity: [0.25, 0.15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeOut' }} />
      <motion.circle cx="166" cy="155" r="2" fill="hsla(0, 0%, 45%, 0.15)"
        animate={{ cy: [157, 148, 140], r: [2, 3.5, 5], opacity: [0.2, 0.1, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeOut', delay: 1.5 }} />
      
      {/* Factory 2 */}
      <rect x="185" y="172" width="18" height="18" fill={baseColor} rx="1" />
      <rect x="185" y="172" width="18" height="1.5" fill={metalColor} />
      <rect x="189" y="162" width="3.5" height="12" fill="hsla(0, 0%, 18%, 0.9)" />
      <motion.circle cx="191" cy="159" r="2" fill="hsla(0, 0%, 40%, 0.18)"
        animate={{ cy: [159, 150, 142], r: [2, 3, 5], opacity: [0.2, 0.1, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeOut', delay: 0.8 }} />
      
      {/* Saw-tooth roof factory */}
      <path d="M 206,180 L 210,172 L 214,180 L 218,172 L 222,180 L 226,172 L 230,180 Z" fill={baseColor} />
      <rect x="206" y="180" width="24" height="10" fill={baseColor} />
      
      {/* Construction crane */}
      <rect x="233" y="165" width="2" height="25" fill={metalColor} />
      <rect x="225" y="165" width="18" height="1.5" fill={metalColor} />
      <line x1="225" y1="165" x2="225" y2="175" stroke="hsla(40, 30%, 30%, 0.4)" strokeWidth="0.5" />
      
      {/* Small structures */}
      <rect x="155" y="192" width="10" height="8" fill={baseColor} rx="0.5" />
      <rect x="168" y="194" width="8" height="6" fill={baseColor} rx="0.5" />
    </g>
  );
}

function LowriseLandmarks({ isOwned, isSelected }: { isOwned: boolean; isSelected: boolean }) {
  const baseColor = isOwned ? 'hsla(0, 20%, 12%, 0.75)' : 'hsla(0, 0%, 10%, 0.75)';
  return (
    <g>
      {/* Low irregular buildings */}
      <rect x="42" y="228" width="12" height="12" fill={baseColor} rx="0.5" />
      <rect x="56" y="232" width="10" height="8" fill={baseColor} rx="0.5" />
      <rect x="68" y="226" width="8" height="14" fill={baseColor} rx="0.5" />
      <rect x="78" y="230" width="14" height="10" fill={baseColor} rx="0.5" />
      <rect x="94" y="234" width="9" height="6" fill={baseColor} rx="0.5" />
      <rect x="105" y="228" width="11" height="12" fill={baseColor} rx="0.5" />
      <rect x="118" y="232" width="8" height="8" fill={baseColor} rx="0.5" />
      
      {/* Broken streetlamp */}
      <rect x="53" y="220" width="1" height="10" fill="hsla(0, 0%, 25%, 0.5)" />
      <circle cx="53" cy="219" r="1.5" fill="hsla(45, 60%, 40%, 0.1)" />
      
      {/* Working streetlamp (dim) */}
      <rect x="100" y="222" width="1" height="10" fill="hsla(0, 0%, 25%, 0.5)" />
      <circle cx="100" cy="221" r="2" fill="hsla(45, 70%, 50%, 0.08)">
        <animate attributeName="opacity" values="0.08;0.15;0.06;0.12" dur="4s" repeatCount="indefinite" />
      </circle>
      
      {/* Graffiti accents (colored marks on walls) */}
      <rect x="44" y="232" width="4" height="1.5" fill="hsla(0, 70%, 45%, 0.25)" rx="0.3" />
      <rect x="70" y="234" width="3" height="1" fill="hsla(200, 70%, 45%, 0.2)" rx="0.3" />
      <rect x="108" y="234" width="5" height="1" fill="hsla(120, 60%, 40%, 0.2)" rx="0.3" />
      
      {/* Scattered dim windows */}
      <rect x="45" y="231" width="2" height="2" fill="hsla(45, 60%, 40%, 0.06)" />
      <rect x="71" y="229" width="2" height="2" fill="hsla(45, 60%, 40%, 0.08)" />
      <rect x="82" y="233" width="2" height="2" fill="hsla(45, 60%, 40%, 0.05)" />
      <rect x="107" y="231" width="2" height="2" fill="hsla(45, 60%, 40%, 0.1)" />
    </g>
  );
}

function NeonStripLandmarks({ isOwned, isSelected }: { isOwned: boolean; isSelected: boolean }) {
  const baseColor = isOwned ? 'hsla(280, 25%, 14%, 0.8)' : 'hsla(270, 20%, 14%, 0.8)';
  return (
    <g>
      {/* Club buildings */}
      <rect x="285" y="172" width="14" height="32" fill={baseColor} rx="1" />
      <rect x="301" y="178" width="12" height="26" fill={baseColor} rx="1" />
      <rect x="315" y="170" width="16" height="34" fill={baseColor} rx="1" />
      <rect x="333" y="176" width="13" height="28" fill={baseColor} rx="1" />
      <rect x="348" y="180" width="11" height="24" fill={baseColor} rx="1" />
      
      {/* Neon sign 1 - flickering */}
      <rect x="287" y="176" width="10" height="3" rx="0.5"
        fill="hsla(330, 90%, 55%, 0.3)" stroke="hsla(330, 90%, 55%, 0.5)" strokeWidth="0.3">
        <animate attributeName="opacity" values="0.4;0.8;0.3;0.7;0.5" dur="2s" repeatCount="indefinite" />
      </rect>
      
      {/* Neon sign 2 */}
      <rect x="317" y="174" width="12" height="3" rx="0.5"
        fill="hsla(270, 80%, 55%, 0.3)" stroke="hsla(270, 80%, 55%, 0.5)" strokeWidth="0.3">
        <animate attributeName="opacity" values="0.5;0.9;0.4;0.8;0.6" dur="2.5s" repeatCount="indefinite" />
      </rect>
      
      {/* Neon sign 3 - blue */}
      <rect x="335" y="180" width="9" height="3" rx="0.5"
        fill="hsla(200, 90%, 55%, 0.25)" stroke="hsla(200, 90%, 55%, 0.4)" strokeWidth="0.3">
        <animate attributeName="opacity" values="0.3;0.7;0.5;0.9;0.4" dur="3s" repeatCount="indefinite" />
      </rect>
      
      {/* Club entrance glow */}
      <rect x="303" y="198" width="8" height="6" fill="hsla(330, 80%, 50%, 0.08)" rx="1" />
      
      {/* Neon glow overlay */}
      <rect x="280" y="165" width="85" height="45" rx="4"
        fill="url(#neon-gradient)" opacity="0.4" />
      
      {/* Flashing windows */}
      {[
        [289, 185, 330], [305, 190, 270], [320, 182, 200], [337, 188, 330], [351, 186, 270],
        [289, 192, 200], [320, 192, 330], [337, 195, 270],
      ].map(([x, y, hue], i) => (
        <rect key={`nw-${i}`} x={x} y={y} width="2.5" height="2.5" rx="0.3"
          fill={`hsla(${hue}, 70%, 50%, 0.12)`}>
          <animate attributeName="opacity" values="0.08;0.2;0.05;0.15;0.1" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
        </rect>
      ))}
    </g>
  );
}

// ========== MAP EVENT MARKERS ==========

function MapEventMarkers({ events }: { events: MapEvent[] }) {
  return (
    <g>
      {events.map(event => {
        const road = ROADS[event.roadIndex];
        if (!road) return null;

        // Approximate position on road using the start/end approach
        const match = road.match(/M\s*([\d.]+),([\d.]+)/);
        const endMatch = road.match(/([\d.]+),([\d.]+)\s*$/);
        if (!match || !endMatch) return null;

        const sx = parseFloat(match[1]), sy = parseFloat(match[2]);
        const ex = parseFloat(endMatch[1]), ey = parseFloat(endMatch[2]);
        const t = event.position / 100;
        const x = sx + (ex - sx) * t;
        const y = sy + (ey - sy) * t;

        return <MapEventIcon key={event.id} event={event} x={x} y={y} />;
      })}
    </g>
  );
}

function MapEventIcon({ event, x, y }: { event: MapEvent; x: number; y: number }) {
  switch (event.type) {
    case 'police_checkpoint':
      return (
        <g transform={`translate(${x}, ${y})`}>
          <motion.circle r="4" fill="hsla(220, 80%, 50%, 0.3)"
            animate={{ r: [4, 6, 4], opacity: [0.3, 0.15, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }} />
          <circle r="2.5" fill="hsla(220, 80%, 50%, 0.6)" />
          <motion.circle r="1" fill="hsla(0, 80%, 50%, 0.8)"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }} />
        </g>
      );
    case 'accident':
      return (
        <g transform={`translate(${x}, ${y})`}>
          <circle r="3" fill="hsla(30, 90%, 50%, 0.4)" />
          <text textAnchor="middle" y="2.5" fontSize="4" fill="hsla(30, 90%, 60%, 0.9)">⚠</text>
        </g>
      );
    case 'street_fight':
      return (
        <g transform={`translate(${x}, ${y})`}>
          <motion.circle r="3" fill="hsla(0, 80%, 45%, 0.4)"
            animate={{ r: [3, 5, 3], opacity: [0.4, 0.2, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity }} />
          <circle r="2" fill="hsla(0, 80%, 45%, 0.6)" />
        </g>
      );
    case 'black_market':
      return (
        <g transform={`translate(${x}, ${y})`}>
          <motion.circle r="3" fill="hsla(45, 93%, 40%, 0.3)"
            animate={{ r: [3, 5, 3], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }} />
          <circle r="2" fill="hsla(45, 93%, 40%, 0.5)" />
          <text textAnchor="middle" y="2" fontSize="3" fill="hsla(45, 93%, 60%, 0.9)">$</text>
        </g>
      );
    case 'drone':
      return (
        <motion.g
          animate={{ x: [x - 15, x + 15, x - 15], y: [y - 3, y + 3, y - 3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
          <circle r="2" fill="hsla(0, 0%, 60%, 0.5)" />
          <motion.circle r="1" fill="hsla(0, 80%, 50%, 0.6)"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }} />
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
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }} />
        </motion.g>
      );
    default:
      return null;
  }
}

// ========== HEAT OVERLAY ==========

function HeatOverlay({ heat }: { heat: number }) {
  if (heat < 30) return null;

  const intensity = Math.min(1, (heat - 30) / 70);
  const opacity = 0.05 + intensity * 0.2;

  return (
    <g>
      {/* Red vignette edges */}
      <rect x="0" y="0" width="400" height="290" rx="0"
        fill="none" stroke={`hsla(0, 80%, 40%, ${opacity})`}
        strokeWidth={4 + intensity * 8} />

      {heat > 60 && (
        <rect x="0" y="0" width="400" height="290"
          fill={`hsla(0, 80%, 30%, ${0.02 + intensity * 0.05})`} />
      )}

      {heat > 80 && (
        <>
          {/* Pulsing red border */}
          <motion.rect x="0" y="0" width="400" height="290" rx="0"
            fill="none" stroke="hsla(0, 80%, 40%, 0.3)" strokeWidth="3"
            animate={{ opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }} />

          {/* LOCKDOWN text */}
          <motion.text x="200" y="20" textAnchor="middle"
            fill="hsla(0, 80%, 50%, 0.4)" fontSize="8" fontWeight="bold"
            fontFamily="Inter, sans-serif" letterSpacing="4"
            animate={{ opacity: [0.4, 0.2, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}>
            LOCKDOWN
          </motion.text>

          {/* Helicopter */}
          <motion.g
            animate={{ x: [0, 380, 0], y: [30, 60, 30] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}>
            <circle r="2" fill="hsla(0, 0%, 70%, 0.4)" />
            <motion.circle r="5" fill="none" stroke="hsla(0, 0%, 60%, 0.15)" strokeWidth="0.5"
              animate={{ r: [5, 8, 5] }}
              transition={{ duration: 0.3, repeat: Infinity }} />
          </motion.g>
        </>
      )}
    </g>
  );
}

// ========== MAIN COMPONENT ==========

export function CityMap({ playerLocation, selectedDistrict, ownedDistricts, districtDemands, mapEvents, heat, weather, nemesis, onSelectDistrict }: CityMapProps) {
  return (
    <div className="relative w-full aspect-[10/7] rounded-lg overflow-hidden border border-border shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]">
      <svg viewBox="0 0 400 290" className="w-full h-full" style={{ background: 'hsl(0 0% 3%)' }}>
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

        {/* Grid pattern */}
        <g opacity="0.05">
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`vg-${i}`} x1={i * 30} y1="0" x2={i * 30} y2="290" stroke="white" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`hg-${i}`} x1="0" y1={i * 30} x2="400" y2={i * 30} stroke="white" strokeWidth="0.5" />
          ))}
        </g>

        {/* Ambient roads */}
        <g>
          {AMBIENT_ROADS.map((d, i) => (
            <path key={`ar-${i}`} d={d} fill="none" stroke="hsl(0 0% 13%)" strokeWidth="3" strokeLinecap="round" />
          ))}
        </g>

        {/* Main roads */}
        <g filter="url(#road-glow)">
          {ROADS.map((d, i) => (
            <path key={`road-${i}`} d={d} fill="none" stroke="hsl(45 30% 18%)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {ROADS.map((d, i) => (
            <path key={`dash-${i}`} d={d} fill="none" stroke="hsl(45 50% 30%)" strokeWidth="0.5" strokeDasharray="4 6" strokeLinecap="round" />
          ))}
        </g>

        {/* === DISTRICT LANDMARKS === */}
        <PortNeroLandmarks isOwned={ownedDistricts.includes('port')} isSelected={selectedDistrict === 'port'} />
        <CrownHeightsLandmarks isOwned={ownedDistricts.includes('crown')} isSelected={selectedDistrict === 'crown'} />
        <IronBoroughLandmarks isOwned={ownedDistricts.includes('iron')} isSelected={selectedDistrict === 'iron'} />
        <LowriseLandmarks isOwned={ownedDistricts.includes('low')} isSelected={selectedDistrict === 'low'} />
        <NeonStripLandmarks isOwned={ownedDistricts.includes('neon')} isSelected={selectedDistrict === 'neon'} />

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
              {isSelected && (
                <circle cx={meta.cx} cy={meta.cy} r="20" fill="hsla(45, 93%, 40%, 0.08)" filter="url(#district-glow)" />
              )}
              <rect x={meta.cx - meta.labelW / 2} y={meta.cy - 8} width={meta.labelW} height="16" rx="3"
                fill={isSelected ? 'hsla(45, 93%, 40%, 0.2)' : 'hsla(0, 0%, 5%, 0.85)'}
                stroke={isSelected ? 'hsl(45 93% 40%)' : isOwned ? 'hsl(0 72% 51%)' : 'hsl(0 0% 20%)'}
                strokeWidth={isSelected ? '1.5' : '0.5'} />
              <text x={meta.cx} y={meta.cy + 3} textAnchor="middle"
                fill={isSelected ? 'hsl(45 93% 50%)' : isOwned ? 'hsl(0 72% 60%)' : 'hsl(0 0% 65%)'}
                fontSize="6.5" fontWeight="bold" fontFamily="Inter, system-ui, sans-serif" letterSpacing="0.3"
                style={{ textTransform: 'uppercase' }}>
                {district.name}
              </text>
              {isOwned && (
                <g transform={`translate(${meta.cx + meta.labelW / 2 - 2}, ${meta.cy - 10})`}>
                  <circle r="5" fill="hsl(0 72% 51%)" opacity="0.8" />
                  <text x="0" y="3" textAnchor="middle" fill="white" fontSize="6">♛</text>
                </g>
              )}
              {hasDemand && (
                <g transform={`translate(${meta.cx - meta.labelW / 2 + 2}, ${meta.cy - 10})`}>
                  <circle r="4" fill="hsl(45 93% 40%)" opacity="0.9" />
                  <text x="0" y="3" textAnchor="middle" fill="hsl(0 0% 5%)" fontSize="5" fontWeight="bold">$</text>
                </g>
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

        {/* === TRAFFIC (more vehicles) === */}
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
        {/* Emergency vehicle (if high heat) */}
        {heat > 50 && (
          <motion.circle r="1.8" opacity="0.5"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ offsetPath: `path("${ROADS[Math.floor(heat / 30) % ROADS.length]}")` }}>
            <animate attributeName="fill" values="hsla(220,80%,50%,0.8);hsla(0,80%,50%,0.8)" dur="0.4s" repeatCount="indefinite" />
          </motion.circle>
        )}

        {/* === MAP EVENTS === */}
        <MapEventMarkers events={mapEvents} />

        {/* === NEMESIS MARKER === */}
        {nemesis && <NemesisMarker nemesis={nemesis} districtMeta={DISTRICT_META} />}

        {/* === WEATHER OVERLAY === */}
        <WeatherOverlay weather={weather} />

        {/* === HEAT OVERLAY === */}
        <HeatOverlay heat={heat} />

        {/* === SCANLINE === */}
        <motion.rect x="0" width="400" height="2" fill="hsla(45, 93%, 40%, 0.04)"
          animate={{ y: [-10, 300] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} />
      </svg>

      {/* Corner decorations */}
      <div className="absolute top-2 left-2 text-[0.5rem] text-muted-foreground font-mono opacity-40 uppercase tracking-widest">
        Noxhaven City
      </div>
      <div className="absolute bottom-2 right-2 text-[0.45rem] text-muted-foreground font-mono opacity-30">
        Tactical Overview v3.0
      </div>
      {heat > 70 && (
        <div className="absolute top-2 right-2 text-[0.5rem] text-blood font-mono font-bold opacity-60 animate-pulse">
          ● HIGH ALERT
        </div>
      )}
    </div>
  );
}
