import { DistrictId, MapEvent, WeatherType, NemesisState, SmuggleRoute, Safehouse, VillaState } from '@/game/types';
import { DISTRICTS } from '@/game/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { WeatherOverlay } from './map/WeatherOverlay';
import { NemesisMarker } from './map/NemesisMarker';
import { CityAmbience } from './map/CityAmbience';
import { CityFabric } from './map/CityFabric';
import { Coastline } from './map/Coastline';
import { SkylineEffect, MapOverlayUI } from './map/SkylineEffect';

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

// ========== NEW LAYOUT ROADS ==========
const ROADS = [
  // Port to Crown (upper boulevard, curved over canal bridges)
  'M 130,80 Q 180,70 240,72 Q 270,74 290,78',
  // Port to Iron (south through bridge 1)
  'M 100,120 Q 95,135 90,148 Q 90,160 100,180 Q 105,195 110,210',
  // Crown to Neon (south through bridge 2)
  'M 300,110 Q 295,125 285,140 Q 280,155 265,170 Q 250,185 235,195',
  // Iron to Neon (east)
  'M 145,210 Q 170,205 195,200 Q 210,198 225,200',
  // Neon to Lowrise (east)
  'M 260,205 Q 285,215 310,225 Q 325,230 340,235',
  // Port to Iron (western coastal road)
  'M 75,110 Q 68,140 70,160 Q 72,180 80,200',
  // Crown to Lowrise (eastern route)
  'M 330,100 Q 345,130 350,160 Q 355,190 345,220',
  // Iron to Lowrise (southern route)
  'M 140,225 Q 180,240 220,245 Q 270,248 320,240',
  // Port east bypass
  'M 120,65 Q 150,60 180,65 Q 200,70 220,80',
  // Neon north connector
  'M 210,170 Q 220,160 230,155 Q 250,148 270,145',
  // Crown internal
  'M 280,60 Q 310,55 340,65 Q 355,75 360,90',
  // Iron internal
  'M 70,210 Q 85,215 100,220 Q 115,225 130,220',
];

const AMBIENT_ROADS = [
  'M 55,100 Q 100,98 150,100',
  'M 200,45 Q 198,100 200,135',
  'M 55,180 L 140,180',
  'M 260,50 Q 310,52 370,55',
  'M 350,80 Q 348,140 350,200',
  'M 160,110 Q 200,108 250,110',
  'M 130,170 Q 128,210 130,250',
  'M 250,165 Q 310,168 375,170',
  'M 60,70 Q 100,72 145,70',
  'M 280,225 Q 330,222 380,225',
  'M 80,55 Q 78,80 80,105',
  'M 160,50 Q 158,80 160,110',
  'M 320,60 Q 318,90 320,120',
  'M 60,55 Q 95,58 130,55',
  'M 200,220 Q 240,218 280,220',
  'M 250,190 Q 248,220 250,250',
  'M 360,150 Q 358,180 360,210',
  'M 110,160 Q 140,158 175,160',
];

// ========== NEW DISTRICT POSITIONS ==========
const DISTRICT_META: Record<DistrictId, { cx: number; cy: number; labelW: number }> = {
  port:  { cx: 100, cy: 80, labelW: 52 },
  crown: { cx: 310, cy: 75, labelW: 72 },
  iron:  { cx: 110, cy: 210, labelW: 64 },
  low:   { cx: 340, cy: 235, labelW: 42 },
  neon:  { cx: 230, cy: 200, labelW: 56 },
};

const DISTRICT_ZONES: Record<DistrictId, { x: number; y: number; w: number; h: number }> = {
  port:  { x: 52, y: 35, w: 115, h: 100 },
  crown: { x: 250, y: 30, w: 110, h: 105 },
  iron:  { x: 55, y: 162, w: 110, h: 75 },
  low:   { x: 290, y: 200, w: 100, h: 65 },
  neon:  { x: 170, y: 162, w: 120, h: 75 },
};

// ========== PORT NERO LANDMARKS ==========
function PortNeroLandmarks({ isOwned, isSelected }: { isOwned: boolean; isSelected: boolean }) {
  const baseColor = isOwned ? 'hsla(0, 30%, 15%, 0.8)' : 'hsla(200, 20%, 12%, 0.8)';
  const accentColor = isOwned ? 'hsl(0, 72%, 51%)' : 'hsl(200, 40%, 35%)';
  return (
    <g>
      {/* Piers/docks */}
      <rect x="52" y="55" width="28" height="3" fill="hsla(30, 30%, 22%, 0.7)" />
      <rect x="52" y="72" width="22" height="3" fill="hsla(30, 30%, 22%, 0.6)" />
      <rect x="52" y="95" width="25" height="2.5" fill="hsla(30, 30%, 22%, 0.5)" />
      <rect x="52" y="110" width="20" height="2.5" fill="hsla(30, 30%, 22%, 0.5)" />

      {/* Pier light */}
      <rect x="78" y="52" width="1.5" height="5" fill="hsla(0, 0%, 28%, 0.5)" />
      <motion.circle cx="79" cy="51" r="2" fill="hsla(45, 80%, 50%, 0.15)"
        animate={{ opacity: [0.15, 0.4, 0.15], r: [2, 3, 2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      <circle cx="79" cy="51" r="0.7" fill="hsla(45, 80%, 60%, 0.35)" />

      {/* Container ship silhouette */}
      <path d="M 55,58 L 65,54 L 65,62 Z" fill={accentColor} opacity="0.5" />
      <rect x="58" y="52" width="1" height="5" fill={accentColor} opacity="0.4" />

      {/* Containers — colored stacks */}
      <rect x="65" y="45" width="9" height="5" fill="hsla(0, 50%, 30%, 0.7)" rx="0.4" />
      <rect x="76" y="43" width="9" height="5" fill="hsla(200, 45%, 28%, 0.7)" rx="0.4" />
      <rect x="65" y="51" width="9" height="5" fill="hsla(40, 50%, 28%, 0.6)" rx="0.4" />
      <rect x="76" y="49" width="9" height="5" fill="hsla(120, 35%, 25%, 0.6)" rx="0.4" />
      <rect x="87" y="45" width="7" height="4" fill="hsla(30, 40%, 26%, 0.5)" rx="0.3" />
      <rect x="87" y="50" width="7" height="4" fill="hsla(180, 35%, 22%, 0.5)" rx="0.3" />

      {/* Crane 1 — with moving arm */}
      <rect x="95" y="38" width="2" height="42" fill={baseColor} />
      <motion.g animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '96px 38px' }}>
        <rect x="88" y="38" width="18" height="2" fill={baseColor} />
        <line x1="106" y1="38" x2="106" y2="52" stroke={accentColor} strokeWidth="0.5" opacity="0.5" />
        <motion.rect x="105" y="50" width="2" height="3" fill="hsla(0, 0%, 38%, 0.5)" rx="0.3"
          animate={{ y: [50, 54, 50] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      </motion.g>

      {/* Crane 2 — smaller */}
      <rect x="120" y="45" width="2" height="35" fill={baseColor} />
      <motion.g animate={{ rotate: [4, -4, 4] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{ transformOrigin: '121px 45px' }}>
        <rect x="114" y="45" width="14" height="1.5" fill={baseColor} />
        <line x1="128" y1="45" x2="128" y2="56" stroke={accentColor} strokeWidth="0.4" opacity="0.4" />
      </motion.g>

      {/* Warehouse buildings */}
      <rect x="105" y="62" width="20" height="16" fill={baseColor} rx="1" />
      <rect x="105" y="62" width="20" height="1" fill={accentColor} opacity="0.3" />
      <rect x="128" y="58" width="16" height="20" fill={baseColor} rx="1" />
      <rect x="128" y="58" width="16" height="1" fill={accentColor} opacity="0.3" />
      <rect x="148" y="65" width="12" height="14" fill={baseColor} rx="1" />

      {/* Water reservoir */}
      <rect x="132" y="55" width="6" height="3" fill="hsla(0, 0%, 16%, 0.7)" rx="0.5" />

      {/* Warehouse windows */}
      {[[108, 66], [115, 66], [108, 73], [131, 62], [139, 65], [131, 70], [151, 69]].map(([x, y], i) => (
        <rect key={`pw-${i}`} x={x} y={y} width="3" height="2" rx="0.2"
          fill={`hsla(45, 80%, 50%, ${0.05 + Math.random() * 0.08})`}>
          {i % 3 === 0 && (
            <animate attributeName="opacity" values="0.06;0.16;0.04;0.1" dur={`${3 + i}s`} repeatCount="indefinite" />
          )}
        </rect>
      ))}
    </g>
  );
}

// ========== CROWN HEIGHTS LANDMARKS ==========
function CrownHeightsLandmarks({ isOwned, isSelected }: { isOwned: boolean; isSelected: boolean }) {
  const baseColor = isOwned ? 'hsla(0, 20%, 14%, 0.85)' : 'hsla(220, 15%, 14%, 0.85)';
  const glassColor = isOwned ? 'hsla(0, 40%, 30%, 0.4)' : 'hsla(210, 40%, 30%, 0.4)';
  return (
    <g>
      {/* Park trees */}
      {[[278, 80], [285, 85], [272, 85]].map(([x, y], i) => (
        <g key={`tree-${i}`}>
          <rect x={x - 0.5} y={y} width="1" height="4" fill="hsla(120, 20%, 10%, 0.5)" />
          <circle cx={x} cy={y - 1} r="2.5" fill="hsla(120, 30%, 13%, 0.45)" />
          <circle cx={x + 1} cy={y} r="2" fill="hsla(120, 25%, 10%, 0.35)" />
        </g>
      ))}

      {/* Tallest tower */}
      <rect x="290" y="28" width="14" height="72" fill={baseColor} rx="1" />
      <rect x="290" y="28" width="14" height="1" fill="hsla(210, 60%, 50%, 0.3)" />
      <rect x="291" y="30" width="12" height="4" fill={glassColor} rx="0.5" />
      <motion.rect x="291" y="30" width="12" height="4" rx="0.5"
        fill="hsla(45, 80%, 50%, 0.04)"
        animate={{ opacity: [0.03, 0.07, 0.03] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />

      {/* Helipad */}
      <circle cx="297" cy="26" r="3.5" fill="none" stroke="hsla(0, 0%, 38%, 0.3)" strokeWidth="0.5" />
      <line x1="295" y1="26" x2="299" y2="26" stroke="hsla(0, 0%, 38%, 0.3)" strokeWidth="0.4" />
      <line x1="297" y1="24" x2="297" y2="28" stroke="hsla(0, 0%, 38%, 0.3)" strokeWidth="0.4" />
      <motion.circle cx="297" cy="26" r="1" fill="hsla(120, 70%, 50%, 0.25)"
        animate={{ opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />

      {/* Antenna */}
      <line x1="297" y1="20" x2="297" y2="24" stroke="hsla(0, 0%, 38%, 0.5)" strokeWidth="0.8" />
      <circle cx="297" cy="20" r="1" fill="hsla(0, 80%, 50%, 0.75)">
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Second tower */}
      <rect x="306" y="38" width="12" height="62" fill={baseColor} rx="1" />
      <rect x="306" y="38" width="12" height="1" fill="hsla(210, 60%, 50%, 0.22)" />
      <line x1="312" y1="35" x2="312" y2="38" stroke="hsla(0, 0%, 32%, 0.45)" strokeWidth="0.6" />

      {/* Third tower */}
      <rect x="320" y="45" width="10" height="55" fill={baseColor} rx="1" />

      {/* Medium buildings */}
      <rect x="332" y="55" width="13" height="45" fill={baseColor} rx="1" />
      <rect x="347" y="60" width="11" height="40" fill={baseColor} rx="1" />

      {/* Smaller front building */}
      <rect x="270" y="58" width="13" height="40" fill={baseColor} rx="1" />

      {/* Windows */}
      {[
        [293, 38], [293, 45], [300, 42], [300, 50], [293, 52], [300, 58],
        [293, 65], [300, 72], [293, 78],
        [309, 45], [315, 48], [309, 55], [315, 62], [309, 68], [315, 75],
        [323, 52], [323, 60], [327, 56], [323, 70], [327, 78],
        [335, 62], [341, 68], [335, 75], [341, 82],
        [273, 65], [279, 72], [273, 80], [279, 88],
        [350, 68], [355, 75], [350, 82],
      ].map(([x, y], i) => (
        <rect key={`cw-${i}`} x={x} y={y} width="2" height="2.5" rx="0.3"
          fill={`hsla(45, 80%, 50%, ${0.05 + Math.random() * 0.1})`}>
          {i % 3 === 0 && (
            <animate attributeName="opacity" values="0.04;0.18;0.03;0.13" dur={`${3 + Math.random() * 4}s`} repeatCount="indefinite" />
          )}
        </rect>
      ))}
    </g>
  );
}

// ========== IRON BOROUGH LANDMARKS ==========
function IronBoroughLandmarks({ isOwned, isSelected, onChopShopClick }: { isOwned: boolean; isSelected: boolean; onChopShopClick?: () => void }) {
  const baseColor = isOwned ? 'hsla(0, 25%, 13%, 0.8)' : 'hsla(30, 15%, 12%, 0.8)';
  const metalColor = 'hsla(30, 20%, 28%, 0.55)';
  const rustColor = 'hsla(20, 50%, 18%, 0.25)';
  return (
    <g>
      {/* Rust texture */}
      <rect x="62" y="200" width="30" height="1" fill={rustColor} opacity="0.4" />
      <rect x="100" y="205" width="20" height="0.8" fill={rustColor} opacity="0.3" />

      {/* Factory 1 with chimney + smoke */}
      <rect x="65" y="178" width="24" height="24" fill={baseColor} rx="1" />
      <rect x="65" y="178" width="24" height="1.5" fill={metalColor} />
      <rect x="70" y="168" width="4" height="12" fill="hsla(0, 0%, 16%, 0.85)" />
      <motion.circle cx="72" cy="165" r="2.5" fill="hsla(0, 0%, 38%, 0.18)"
        animate={{ cy: [165, 155, 145], r: [2.5, 4, 6], opacity: [0.22, 0.12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeOut' }} />
      <motion.circle cx="72" cy="167" r="2" fill="hsla(0, 0%, 42%, 0.12)"
        animate={{ cy: [167, 158, 150], r: [2, 3.5, 5], opacity: [0.18, 0.08, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeOut', delay: 1.5 }} />

      {/* Factory 2 */}
      <rect x="92" y="182" width="20" height="20" fill={baseColor} rx="1" />
      <rect x="92" y="182" width="20" height="1.5" fill={metalColor} />
      <rect x="97" y="172" width="3.5" height="12" fill="hsla(0, 0%, 16%, 0.85)" />
      <motion.circle cx="99" cy="169" r="2" fill="hsla(0, 0%, 38%, 0.15)"
        animate={{ cy: [169, 160, 152], r: [2, 3, 5], opacity: [0.18, 0.08, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeOut', delay: 0.8 }} />

      {/* Furnace glow */}
      <motion.rect x="68" y="195" width="8" height="4" rx="1"
        fill="hsla(20, 80%, 35%, 0.15)"
        animate={{ opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />

      {/* Saw-tooth roof factory */}
      <path d="M 115,190 L 119,182 L 123,190 L 127,182 L 131,190 L 135,182 L 139,190 Z" fill={baseColor} />
      <rect x="115" y="190" width="24" height="12" fill={baseColor} />

      {/* Storage tanks */}
      <circle cx="150" cy="195" r="5" fill="hsla(0, 0%, 12%, 0.6)" stroke="hsla(0, 0%, 18%, 0.3)" strokeWidth="0.5" />
      <circle cx="158" cy="198" r="4" fill="hsla(0, 0%, 10%, 0.5)" stroke="hsla(0, 0%, 15%, 0.3)" strokeWidth="0.5" />

      {/* Pipelines */}
      <line x1="145" y1="195" x2="155" y2="195" stroke={metalColor} strokeWidth="1" />
      <line x1="150" y1="190" x2="150" y2="200" stroke={metalColor} strokeWidth="0.8" />

      {/* Cargo wagon on rail */}
      <motion.g
        animate={{ x: [0, 80, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}>
        <rect x="65" y="211" width="14" height="6" fill="hsla(0, 30%, 16%, 0.55)" rx="0.5" />
        <rect x="65" y="211" width="14" height="1" fill={metalColor} />
        <circle cx="68" cy="217.5" r="1" fill="hsla(0, 0%, 18%, 0.45)" />
        <circle cx="76" cy="217.5" r="1" fill="hsla(0, 0%, 18%, 0.45)" />
      </motion.g>

      {/* Small structures */}
      <rect x="60" y="198" width="10" height="8" fill={baseColor} rx="0.5" />

      {/* Chop Shop */}
      <g
        onClick={(e) => { e.stopPropagation(); onChopShopClick?.(); }}
        style={{ cursor: onChopShopClick ? 'pointer' : 'default' }}
        className="chop-shop-landmark"
      >
        <rect x="120" y="195" width="28" height="18" fill="transparent" />
        <rect x="124" y="202" width="20" height="10" fill="hsla(30, 18%, 14%, 0.85)" rx="1" />
        <rect x="127" y="205" width="7" height="7" fill="hsla(0, 0%, 8%, 0.6)" rx="0.5" />
        <rect x="136" y="205" width="7" height="7" fill="hsla(0, 0%, 8%, 0.6)" rx="0.5" />
        {[206.5, 208, 209.5].map((y, i) => (
          <line key={`gd1-${i}`} x1="127.5" y1={y} x2="133.5" y2={y} stroke="hsla(0, 0%, 15%, 0.3)" strokeWidth="0.3" />
        ))}
        {[206.5, 208, 209.5].map((y, i) => (
          <line key={`gd2-${i}`} x1="136.5" y1={y} x2="142.5" y2={y} stroke="hsla(0, 0%, 15%, 0.3)" strokeWidth="0.3" />
        ))}
        <rect x="124" y="201.5" width="20" height="1.5" fill={metalColor} />
        <g transform="translate(132, 203.5) scale(0.35)">
          <motion.g animate={{ rotate: [0, 15, 0, -15, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <path d="M2,8 L6,4 L8,6 L4,10 Z" fill="hsla(40, 80%, 50%, 0.7)" />
            <path d="M7,3 L10,0 L12,2 L9,5 Z" fill="hsla(40, 80%, 50%, 0.7)" />
          </motion.g>
        </g>
        <motion.text x="134" y="200" textAnchor="middle" fontSize="3"
          fontWeight="bold" fontFamily="monospace"
          fill="hsla(40, 90%, 55%, 0.8)"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          CHOP SHOP
        </motion.text>
        <motion.rect x="122" y="197" width="24" height="5" rx="1" fill="hsla(40, 80%, 50%, 0.04)"
          animate={{ opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.circle cx="130" cy="209" r="0.5" fill="hsla(40, 100%, 70%, 0.8)"
          animate={{ opacity: [0, 1, 0], cy: [209, 207], x: [0, 1.5] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3, ease: 'easeOut' }} />
      </g>

      {/* Factory windows */}
      {[[68, 183], [76, 188], [95, 188], [105, 192], [118, 194], [128, 194]].map(([x, y], i) => (
        <rect key={`iw-${i}`} x={x} y={y} width="3" height="2" rx="0.2"
          fill={`hsla(30, 60%, 38%, ${0.05 + i * 0.02})`}>
          {i % 2 === 0 && (
            <animate attributeName="opacity" values="0.05;0.12;0.03;0.08" dur={`${4 + i}s`} repeatCount="indefinite" />
          )}
        </rect>
      ))}
    </g>
  );
}

// ========== LOWRISE LANDMARKS ==========
function LowriseLandmarks({ isOwned, isSelected }: { isOwned: boolean; isSelected: boolean }) {
  const baseColor = isOwned ? 'hsla(0, 20%, 12%, 0.75)' : 'hsla(0, 0%, 10%, 0.75)';
  return (
    <g>
      {/* Broken pavement */}
      <line x1="295" y1="228" x2="310" y2="228" stroke="hsla(0, 0%, 13%, 0.25)" strokeWidth="0.5" strokeDasharray="2 3" />
      <line x1="320" y1="245" x2="340" y2="245" stroke="hsla(0, 0%, 13%, 0.25)" strokeWidth="0.5" strokeDasharray="3 2" />
      <line x1="350" y1="250" x2="375" y2="250" stroke="hsla(0, 0%, 13%, 0.2)" strokeWidth="0.4" strokeDasharray="2 4" />

      {/* Low buildings */}
      <rect x="295" y="220" width="12" height="12" fill={baseColor} rx="0.5" />
      <rect x="310" y="224" width="10" height="8" fill={baseColor} rx="0.5" />
      <rect x="322" y="218" width="8" height="14" fill={baseColor} rx="0.5" />
      <rect x="332" y="222" width="14" height="10" fill={baseColor} rx="0.5" />
      <rect x="348" y="226" width="9" height="6" fill={baseColor} rx="0.5" />
      <rect x="359" y="220" width="11" height="12" fill={baseColor} rx="0.5" />
      <rect x="372" y="224" width="8" height="8" fill={baseColor} rx="0.5" />
      <rect x="305" y="245" width="14" height="10" fill={baseColor} rx="0.5" />
      <rect x="322" y="248" width="10" height="8" fill={baseColor} rx="0.5" />
      <rect x="340" y="244" width="12" height="10" fill={baseColor} rx="0.5" />

      {/* Debris */}
      <rect x="315" y="234" width="3" height="2" fill="hsla(30, 20%, 16%, 0.35)" rx="0.3" />
      <rect x="345" y="234" width="2" height="1.5" fill="hsla(0, 0%, 13%, 0.3)" rx="0.2" />

      {/* Broken streetlamp */}
      <rect x="305" y="212" width="1" height="10" fill="hsla(0, 0%, 22%, 0.45)" />
      <motion.circle cx="305" cy="211" r="1.5" fill="hsla(45, 60%, 40%, 0.06)"
        animate={{ opacity: [0.06, 0, 0.03, 0, 0.06] }}
        transition={{ duration: 3, repeat: Infinity }} />

      {/* Dim working streetlamp */}
      <rect x="355" y="214" width="1" height="10" fill="hsla(0, 0%, 22%, 0.45)" />
      <motion.circle cx="355" cy="213" r="3" fill="hsla(45, 70%, 50%, 0.05)"
        animate={{ opacity: [0.05, 0.1, 0.03, 0.08, 0.05] }}
        transition={{ duration: 4, repeat: Infinity }} />
      <circle cx="355" cy="213" r="1" fill="hsla(45, 70%, 50%, 0.12)">
        <animate attributeName="opacity" values="0.12;0.22;0.06;0.18" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Graffiti */}
      <rect x="298" y="224" width="4" height="1.5" fill="hsla(0, 70%, 45%, 0.22)" rx="0.3" />
      <rect x="324" y="226" width="3" height="1" fill="hsla(200, 70%, 45%, 0.18)" rx="0.3" />
      <rect x="362" y="226" width="5" height="1" fill="hsla(120, 60%, 40%, 0.18)" rx="0.3" />
      <rect x="334" y="225" width="3" height="1.5" fill="hsla(45, 70%, 45%, 0.15)" rx="0.3" />

      {/* Windows */}
      {[[298, 223], [313, 227], [325, 221], [335, 225], [350, 228], [362, 223], [374, 227], [308, 248], [343, 247]].map(([x, y], i) => (
        <rect key={`lw-${i}`} x={x} y={y} width="2" height="2" rx="0.2"
          fill={`hsla(45, 60%, 40%, ${0.03 + Math.random() * 0.05})`}>
          {i % 2 === 0 && (
            <animate attributeName="opacity" values="0.03;0.08;0.02;0.06" dur={`${5 + i}s`} repeatCount="indefinite" />
          )}
        </rect>
      ))}
    </g>
  );
}

// ========== NEON STRIP LANDMARKS ==========
function NeonStripLandmarks({ isOwned, isSelected }: { isOwned: boolean; isSelected: boolean }) {
  const baseColor = isOwned ? 'hsla(280, 25%, 14%, 0.8)' : 'hsla(270, 20%, 14%, 0.8)';
  return (
    <g>
      {/* Wet road reflections */}
      <motion.rect x="185" y="215" width="85" height="2" rx="1"
        fill="hsla(330, 80%, 50%, 0.04)"
        animate={{ opacity: [0.03, 0.07, 0.03] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.rect x="195" y="219" width="65" height="1.5" rx="0.5"
        fill="hsla(270, 70%, 50%, 0.03)"
        animate={{ opacity: [0.02, 0.05, 0.02] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />

      {/* Club buildings */}
      <rect x="190" y="175" width="14" height="35" fill={baseColor} rx="1" />
      <rect x="206" y="180" width="12" height="30" fill={baseColor} rx="1" />
      <rect x="220" y="172" width="16" height="38" fill={baseColor} rx="1" />
      <rect x="238" y="178" width="13" height="32" fill={baseColor} rx="1" />
      <rect x="253" y="182" width="11" height="28" fill={baseColor} rx="1" />
      <rect x="266" y="176" width="12" height="34" fill={baseColor} rx="1" />

      {/* Neon sign — BAR (pink) */}
      <motion.g animate={{ opacity: [0.4, 0.8, 0.3, 0.7, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}>
        <rect x="191" y="182" width="3" height="14" rx="0.5"
          fill="hsla(330, 90%, 55%, 0.2)" stroke="hsla(330, 90%, 55%, 0.4)" strokeWidth="0.3" />
        <text x="192.5" y="190" fontSize="3" fill="hsla(330, 90%, 65%, 0.5)" textAnchor="middle"
          style={{ writingMode: 'vertical-rl' as any }}>BAR</text>
      </motion.g>

      {/* Neon sign — CLUB */}
      <rect x="222" y="176" width="12" height="3" rx="0.5"
        fill="hsla(270, 80%, 55%, 0.3)" stroke="hsla(270, 80%, 55%, 0.5)" strokeWidth="0.3">
        <animate attributeName="opacity" values="0.5;0.9;0.4;0.8;0.6" dur="2.5s" repeatCount="indefinite" />
      </rect>

      {/* Neon sign — blue vertical */}
      <motion.g animate={{ opacity: [0.3, 0.7, 0.5, 0.9, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}>
        <rect x="252" y="188" width="3" height="10" rx="0.5"
          fill="hsla(200, 90%, 55%, 0.2)" stroke="hsla(200, 90%, 55%, 0.35)" strokeWidth="0.3" />
      </motion.g>

      {/* CASINO sign */}
      <rect x="207" y="184" width="8" height="2.5" rx="0.5"
        fill="hsla(45, 90%, 50%, 0.25)" stroke="hsla(45, 90%, 50%, 0.4)" strokeWidth="0.3">
        <animate attributeName="opacity" values="0.4;0.8;0.3;0.7;0.5" dur="3s" repeatCount="indefinite" />
      </rect>

      {/* Club entrance glow */}
      <rect x="208" y="204" width="8" height="6" fill="hsla(330, 80%, 50%, 0.07)" rx="1" />

      {/* Disco reflections */}
      <motion.rect x="205" y="206" width="15" height="4" rx="1"
        fill="hsla(270, 70%, 50%, 0.03)"
        animate={{ opacity: [0.03, 0.07, 0.03] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />

      {/* Neon glow overlay */}
      <rect x="185" y="168" width="95" height="48" rx="4"
        fill="url(#neon-gradient)" opacity="0.35" />

      {/* Windows */}
      {[
        [194, 190, 330], [210, 195, 270], [225, 185, 200], [242, 192, 330], [256, 190, 270],
        [194, 197, 200], [225, 197, 330], [242, 200, 270],
        [210, 200, 150], [228, 192, 330], [245, 197, 200],
        [269, 185, 330], [269, 195, 270],
      ].map(([x, y, hue], i) => (
        <rect key={`nw-${i}`} x={x} y={y} width="2.5" height="2.5" rx="0.3"
          fill={`hsla(${hue}, 70%, 50%, 0.1)`}>
          <animate attributeName="opacity" values="0.07;0.2;0.04;0.16;0.08" dur={`${1.5 + i * 0.25}s`} repeatCount="indefinite" />
        </rect>
      ))}
    </g>
  );
}

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
          <motion.g key={event.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.08, type: 'spring', stiffness: 300, damping: 15 }}>
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
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }} />
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
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }} />
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
          style={{ offsetPath: `path("${ROADS[0]}")` }}>
          <animate attributeName="fill" values="hsla(220,80%,50%,0.9);hsla(0,80%,50%,0.9)" dur="0.3s" repeatCount="indefinite" />
        </motion.circle>
      )}
      {personalHeat > 50 && (
        <motion.g animate={{ x: [50, 350, 50], y: [40, 70, 40] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}>
          <circle r="1.5" fill="hsla(0, 0%, 60%, 0.5)" />
          <motion.circle r="1" fill="hsla(0, 80%, 50%, 0.6)"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }} />
        </motion.g>
      )}
      {maxHeat > 80 && (
        <>
          <motion.rect x="0" y="0" width="400" height="290" rx="0"
            fill="none" stroke={`hsla(${borderHue}, 80%, 40%, 0.3)`} strokeWidth="3"
            animate={{ opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }} />
          <motion.text x="200" y="20" textAnchor="middle"
            fill="hsla(0, 80%, 50%, 0.4)" fontSize="8" fontWeight="bold"
            fontFamily="Inter, sans-serif" letterSpacing="4"
            animate={{ opacity: [0.4, 0.2, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}>
            {personalHeat > 80 ? 'GEZOCHT' : vehicleHeat > 80 ? 'VOERTUIG ALERT' : 'LOCKDOWN'}
          </motion.text>
          {personalHeat > 70 && (
            <motion.g animate={{ x: [0, 380, 0], y: [30, 60, 30] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}>
              <circle r="2" fill="hsla(0, 0%, 70%, 0.4)" />
              <motion.circle r="5" fill="none" stroke="hsla(0, 0%, 60%, 0.15)" strokeWidth="0.5"
                animate={{ r: [5, 8, 5] }}
                transition={{ duration: 0.3, repeat: Infinity }} />
            </motion.g>
          )}
        </>
      )}
    </g>
  );
}

// ========== TRAVEL ANIMATION ==========
function TravelAnimation({ from, to, districtMeta }: {
  from: DistrictId;
  to: DistrictId;
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
        animate={{ x2: endX, y2: endY }}
        transition={{ duration: 0.6, ease: 'easeOut' }} />
      <motion.g initial={{ x: startX, y: startY, scale: 1 }}
        animate={{ x: endX, y: endY, scale: [1, 1.3, 1] }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}>
        <motion.circle r="6" fill="none" stroke="hsla(45, 93%, 50%, 0.3)" strokeWidth="1"
          animate={{ r: [5, 8, 5], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 0.5, repeat: Infinity }} />
        <circle r="3" fill="hsl(45, 93%, 50%)" />
        <circle r="1.5" fill="hsl(45, 93%, 70%)" />
      </motion.g>
      <motion.circle cx={endX} cy={endY} r="3"
        fill="hsla(45, 93%, 50%, 0.5)"
        initial={{ r: 3, opacity: 0 }}
        animate={{ r: 20, opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.6, delay: 0.7 }} />
    </g>
  );
}

// ========== MAIN COMPONENT ==========
export function CityMap({ playerLocation, selectedDistrict, ownedDistricts, districtDemands, mapEvents, heat, vehicleHeat, personalHeat, weather, nemesis, travelAnim, onSelectDistrict, smuggleRoutes = [], districtRep, onChopShopClick, safehouses = [], onSafehouseClick, villa, onVillaClick }: CityMapProps) {
  const defaultDistrictRep: Record<DistrictId, number> = districtRep || { port: 30, crown: 50, iron: 40, low: 15, neon: 60 };

  return (
    <div className="relative w-full aspect-[10/7] rounded-lg overflow-hidden border border-border shadow-[inset_0_0_60px_rgba(0,0,0,0.9)]">
      <svg viewBox="0 0 400 290" className="w-full h-full" style={{ background: 'hsl(220 12% 3%)' }}>
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

        {/* === LAYER 1: Water / Coastline / Canal === */}
        <Coastline />

        {/* === LAYER 2: City Fabric === */}
        <CityFabric />

        {/* === LAYER 3: City Ambience === */}
        <CityAmbience
          roads={ROADS}
          smuggleRoutes={smuggleRoutes}
          districtRep={defaultDistrictRep}
          ownedDistricts={ownedDistricts}
          districtMeta={DISTRICT_META}
        />

        {/* Ambient roads */}
        <g>
          {AMBIENT_ROADS.map((d, i) => (
            <path key={`ar-${i}`} d={d} fill="none" stroke="hsla(0, 0%, 12%, 0.45)" strokeWidth="2.5" strokeLinecap="round" />
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
        <IronBoroughLandmarks isOwned={ownedDistricts.includes('iron')} isSelected={selectedDistrict === 'iron'} onChopShopClick={onChopShopClick} />
        <LowriseLandmarks isOwned={ownedDistricts.includes('low')} isSelected={selectedDistrict === 'low'} />
        <NeonStripLandmarks isOwned={ownedDistricts.includes('neon')} isSelected={selectedDistrict === 'neon'} />

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
                    animate={{ opacity: [0.8, 0.5, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }} />
                  <text x={sx + 4} y={sy - 2.5} textAnchor="middle" fontSize="3" fill="hsl(0 0% 5%)" fontWeight="bold">{sh.level}</text>
                </>
              )}
            </g>
          );
        })}

        {/* === VILLA NOXHAVEN — on Crown Heights hill === */}
        <path d="M 280,78 Q 295,55 310,45" fill="none" stroke="hsl(45 30% 18%)" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        <path d="M 280,78 Q 295,55 310,45" fill="none" stroke="hsl(45 50% 30%)" strokeWidth="0.4" strokeDasharray="3 5" strokeLinecap="round" opacity="0.4" />

        <g onClick={(e) => { e.stopPropagation(); onVillaClick?.(); }}
          style={{ cursor: onVillaClick ? 'pointer' : 'default' }}>
          <rect x="295" y="15" width="40" height="35" fill="transparent" />
          <ellipse cx="315" cy="45" rx="20" ry="5" fill="hsla(120, 15%, 8%, 0.45)" />
          {villa && (
            <motion.circle cx="315" cy="35" r="16"
              fill="none" stroke="hsla(45, 90%, 50%, 0.12)" strokeWidth="1"
              animate={{ r: [16, 20, 16], opacity: [0.12, 0.04, 0.12] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          )}
          <rect x="302" y="25" width="26" height="16" fill={villa ? 'hsla(45, 20%, 14%, 0.9)' : 'hsla(0, 0%, 12%, 0.6)'} rx="1" />
          <rect x="302" y="25" width="26" height="1.5" fill={villa ? 'hsla(45, 60%, 40%, 0.4)' : 'hsla(0, 0%, 20%, 0.3)'} />
          <rect x="304" y="29" width="1.5" height="10" fill={villa ? 'hsla(45, 30%, 30%, 0.5)' : 'hsla(0, 0%, 18%, 0.35)'} />
          <rect x="308" y="29" width="1.5" height="10" fill={villa ? 'hsla(45, 30%, 30%, 0.5)' : 'hsla(0, 0%, 18%, 0.35)'} />
          <rect x="321" y="29" width="1.5" height="10" fill={villa ? 'hsla(45, 30%, 30%, 0.5)' : 'hsla(0, 0%, 18%, 0.35)'} />
          <rect x="325" y="29" width="1.5" height="10" fill={villa ? 'hsla(45, 30%, 30%, 0.5)' : 'hsla(0, 0%, 18%, 0.35)'} />
          {villa && [[306, 31], [312, 31], [318, 31], [324, 31], [306, 36], [318, 36]].map(([x, y], i) => (
            <rect key={`vw-${i}`} x={x} y={y} width="2.5" height="2" rx="0.2"
              fill={`hsla(45, 80%, 50%, ${0.07 + Math.random() * 0.08})`}>
              {i % 2 === 0 && <animate attributeName="opacity" values="0.07;0.18;0.05;0.13" dur={`${3 + i}s`} repeatCount="indefinite" />}
            </rect>
          ))}
          {villa && (
            <>
              <rect x="330" y="32" width="7" height="4.5" fill="hsla(210, 60%, 28%, 0.45)" rx="1" />
              <motion.rect x="330" y="32" width="7" height="4.5" rx="1"
                fill="hsla(210, 60%, 42%, 0.12)"
                animate={{ opacity: [0.08, 0.16, 0.08] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
            </>
          )}
          {villa && [[298, 38], [340, 28], [297, 28]].map(([x, y], i) => (
            <g key={`vt-${i}`}>
              <rect x={x - 0.3} y={y} width="0.6" height="3" fill="hsla(120, 20%, 12%, 0.4)" />
              <circle cx={x} cy={y - 0.5} r="2" fill="hsla(120, 30%, 12%, 0.35)" />
            </g>
          ))}
          <path d="M 315,41 Q 315,46 308,50" fill="none" stroke="hsla(30, 15%, 18%, 0.35)" strokeWidth="2" strokeLinecap="round" />
          <rect x="301" y="15" width="28" height="9" rx="2"
            fill={villa ? 'hsla(45, 30%, 8%, 0.9)' : 'hsla(0, 0%, 5%, 0.7)'}
            stroke={villa ? 'hsl(45 60% 40%)' : 'hsl(0 0% 20%)'}
            strokeWidth={villa ? '1' : '0.5'} />
          <text x="315" y="22" textAnchor="middle"
            fill={villa ? 'hsl(45 80% 55%)' : 'hsl(0 0% 40%)'}
            fontSize="5" fontWeight="bold" fontFamily="Inter, system-ui, sans-serif"
            style={{ textTransform: 'uppercase' }}>
            {villa ? 'VILLA' : '🔒 VILLA'}
          </text>
        </g>

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
                  width={meta.labelW} height="16" rx="3"
                  fill="none" stroke="hsl(0 72% 51%)" strokeWidth="0.5"
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

        {/* === SKYLINE & MOUNTAINS === */}
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
        v5.0
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
