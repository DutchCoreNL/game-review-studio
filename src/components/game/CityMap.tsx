import { DistrictId, MapEvent, WeatherType, NemesisState, SmuggleRoute } from '@/game/types';
import { DISTRICTS } from '@/game/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { WeatherOverlay } from './map/WeatherOverlay';
import { NemesisMarker } from './map/NemesisMarker';
import { CityAmbience } from './map/CityAmbience';

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
      {/* Water at left edge — extended with waves */}
      <rect x="30" y="55" width="12" height="65" fill="hsla(210, 50%, 15%, 0.6)" rx="1" />
      <motion.path d="M 30,65 Q 36,62 42,65 Q 36,68 30,65" fill="none" stroke="hsla(210, 60%, 35%, 0.4)" strokeWidth="0.7"
        animate={{ y: [0, 2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.path d="M 30,80 Q 36,77 42,80 Q 36,83 30,80" fill="none" stroke="hsla(210, 60%, 35%, 0.3)" strokeWidth="0.7"
        animate={{ y: [0, -1.5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
      <motion.path d="M 30,95 Q 36,92 42,95 Q 36,98 30,95" fill="none" stroke="hsla(210, 60%, 35%, 0.3)" strokeWidth="0.7"
        animate={{ y: [0, 1, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
      <motion.path d="M 30,110 Q 36,107 42,110 Q 36,113 30,110" fill="none" stroke="hsla(210, 60%, 35%, 0.2)" strokeWidth="0.6"
        animate={{ y: [0, 1.5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }} />
      
      {/* Dock/pier with texture */}
      <rect x="42" y="70" width="25" height="3" fill="hsla(30, 30%, 25%, 0.7)" />
      <rect x="42" y="85" width="20" height="3" fill="hsla(30, 30%, 25%, 0.6)" />
      <rect x="42" y="100" width="18" height="2.5" fill="hsla(30, 30%, 25%, 0.5)" />
      
      {/* Pier light beacon */}
      <rect x="66" y="67" width="1.5" height="5" fill="hsla(0, 0%, 30%, 0.6)" />
      <motion.circle cx="67" cy="66" r="2" fill="hsla(45, 80%, 50%, 0.2)"
        animate={{ opacity: [0.2, 0.5, 0.2], r: [2, 3, 2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      <circle cx="67" cy="66" r="0.8" fill="hsla(45, 80%, 60%, 0.4)" />
      
      {/* Ship silhouette */}
      <path d="M 33,72 L 39,68 L 39,76 Z" fill={accentColor} opacity="0.6" />
      <rect x="35" y="66" width="1" height="5" fill={accentColor} opacity="0.5" />
      
      {/* Containers — more variety */}
      <rect x="50" y="60" width="8" height="5" fill="hsla(0, 50%, 30%, 0.7)" rx="0.5" />
      <rect x="60" y="58" width="8" height="5" fill="hsla(200, 40%, 25%, 0.7)" rx="0.5" />
      <rect x="50" y="66" width="8" height="5" fill="hsla(40, 50%, 30%, 0.6)" rx="0.5" />
      <rect x="60" y="64" width="8" height="5" fill="hsla(120, 30%, 25%, 0.6)" rx="0.5" />
      <rect x="70" y="60" width="6" height="4" fill="hsla(30, 40%, 28%, 0.5)" rx="0.3" />
      <rect x="70" y="65" width="6" height="4" fill="hsla(180, 30%, 22%, 0.5)" rx="0.3" />
      
      {/* Moving crane arm */}
      <rect x="75" y="52" width="2" height="38" fill={baseColor} />
      <motion.g animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '76px 52px' }}>
        <rect x="70" y="52" width="15" height="2" fill={baseColor} />
        <line x1="85" y1="52" x2="85" y2="65" stroke={accentColor} strokeWidth="0.5" opacity="0.5" />
        {/* Hook */}
        <motion.rect x="84" y="63" width="2" height="3" fill="hsla(0, 0%, 40%, 0.5)" rx="0.3"
          animate={{ y: [63, 66, 63] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      </motion.g>
      
      {/* Warehouse buildings */}
      <rect x="95" y="62" width="18" height="14" fill={baseColor} rx="1" />
      <rect x="95" y="62" width="18" height="1" fill={accentColor} opacity="0.3" />
      <rect x="115" y="58" width="14" height="18" fill={baseColor} rx="1" />
      <rect x="115" y="58" width="14" height="1" fill={accentColor} opacity="0.3" />
      
      {/* Water reservoir on roof */}
      <rect x="119" y="55" width="6" height="3" fill="hsla(0, 0%, 18%, 0.8)" rx="0.5" />
      
      {/* Warehouse windows — animated flicker */}
      {[[98, 66], [104, 66], [98, 72], [118, 62], [125, 65], [118, 69]].map(([x, y], i) => (
        <rect key={`pw-${i}`} x={x} y={y} width="3" height="2" rx="0.2"
          fill={`hsla(45, 80%, 50%, ${0.06 + Math.random() * 0.1})`}>
          {i % 3 === 0 && (
            <animate attributeName="opacity" values="0.08;0.18;0.05;0.12" dur={`${3 + i}s`} repeatCount="indefinite" />
          )}
        </rect>
      ))}
    </g>
  );
}

function CrownHeightsLandmarks({ isOwned, isSelected }: { isOwned: boolean; isSelected: boolean }) {
  const baseColor = isOwned ? 'hsla(0, 20%, 14%, 0.85)' : 'hsla(220, 15%, 14%, 0.85)';
  const glassColor = isOwned ? 'hsla(0, 40%, 30%, 0.4)' : 'hsla(210, 40%, 30%, 0.4)';
  return (
    <g>
      {/* Park area with trees (dark silhouettes) */}
      {[[228, 95], [235, 100], [222, 100]].map(([x, y], i) => (
        <g key={`tree-${i}`}>
          <rect x={x - 0.5} y={y} width="1" height="4" fill="hsla(120, 20%, 12%, 0.6)" />
          <circle cx={x} cy={y - 1} r="2.5" fill="hsla(120, 30%, 15%, 0.5)" />
          <circle cx={x + 1} cy={y} r="2" fill="hsla(120, 25%, 12%, 0.4)" />
        </g>
      ))}
      
      {/* Tallest tower (penthouse) */}
      <rect x="240" y="40" width="14" height="62" fill={baseColor} rx="1" />
      <rect x="240" y="40" width="14" height="1" fill="hsla(210, 60%, 50%, 0.3)" />
      {/* Penthouse glass top */}
      <rect x="241" y="42" width="12" height="4" fill={glassColor} rx="0.5" />
      {/* Penthouse illumination */}
      <motion.rect x="241" y="42" width="12" height="4" rx="0.5"
        fill="hsla(45, 80%, 50%, 0.05)"
        animate={{ opacity: [0.03, 0.08, 0.03] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
      
      {/* Helipad on top */}
      <circle cx="247" cy="38" r="3.5" fill="none" stroke="hsla(0, 0%, 40%, 0.3)" strokeWidth="0.5" />
      <line x1="245" y1="38" x2="249" y2="38" stroke="hsla(0, 0%, 40%, 0.3)" strokeWidth="0.4" />
      <line x1="247" y1="36" x2="247" y2="40" stroke="hsla(0, 0%, 40%, 0.3)" strokeWidth="0.4" />
      {/* Rotating helipad light */}
      <motion.circle cx="247" cy="38" r="1" fill="hsla(120, 70%, 50%, 0.3)"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
      
      {/* Antenna */}
      <line x1="247" y1="32" x2="247" y2="35" stroke="hsla(0, 0%, 40%, 0.6)" strokeWidth="0.8" />
      <circle cx="247" cy="32" r="1" fill="hsla(0, 80%, 50%, 0.8)">
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>
      
      {/* Second tower */}
      <rect x="256" y="48" width="12" height="54" fill={baseColor} rx="1" />
      <rect x="256" y="48" width="12" height="1" fill="hsla(210, 60%, 50%, 0.25)" />
      {/* Antenna on second tower */}
      <line x1="262" y1="45" x2="262" y2="48" stroke="hsla(0, 0%, 35%, 0.5)" strokeWidth="0.6" />
      
      {/* Third tower */}
      <rect x="270" y="55" width="10" height="47" fill={baseColor} rx="1" />
      
      {/* Medium buildings */}
      <rect x="282" y="65" width="13" height="37" fill={baseColor} rx="1" />
      <rect x="297" y="70" width="11" height="32" fill={baseColor} rx="1" />
      
      {/* Smaller front buildings */}
      <rect x="225" y="68" width="13" height="34" fill={baseColor} rx="1" />
      
      {/* Windows (scattered lit) — enhanced with more flicker */}
      {[
        [243, 50], [243, 56], [249, 53], [249, 59], [243, 62], [249, 68],
        [243, 74], [249, 80], [243, 86],
        [259, 55], [265, 58], [259, 64], [265, 70], [259, 76], [265, 82],
        [273, 62], [273, 70], [277, 66], [273, 78], [277, 86],
        [285, 72], [291, 78], [285, 84], [291, 90],
        [228, 75], [234, 80], [228, 88], [234, 94],
        [300, 78], [305, 85], [300, 92],
      ].map(([x, y], i) => (
        <rect key={`cw-${i}`} x={x} y={y} width="2" height="2.5" rx="0.3"
          fill={`hsla(45, 80%, 50%, ${0.06 + Math.random() * 0.12})`}>
          {i % 3 === 0 && (
            <animate attributeName="opacity" values="0.05;0.2;0.03;0.15" dur={`${3 + Math.random() * 4}s`} repeatCount="indefinite" />
          )}
        </rect>
      ))}
    </g>
  );
}

function IronBoroughLandmarks({ isOwned, isSelected }: { isOwned: boolean; isSelected: boolean }) {
  const baseColor = isOwned ? 'hsla(0, 25%, 13%, 0.8)' : 'hsla(30, 15%, 12%, 0.8)';
  const metalColor = 'hsla(30, 20%, 30%, 0.6)';
  const rustColor = 'hsla(20, 50%, 20%, 0.3)';
  return (
    <g>
      {/* Rust ground texture accents */}
      <rect x="152" y="195" width="35" height="1" fill={rustColor} opacity="0.4" />
      <rect x="200" y="200" width="25" height="0.8" fill={rustColor} opacity="0.3" />
      
      {/* Rail tracks */}
      <line x1="148" y1="205" x2="245" y2="205" stroke="hsla(0, 0%, 25%, 0.4)" strokeWidth="1" />
      <line x1="148" y1="207" x2="245" y2="207" stroke="hsla(0, 0%, 25%, 0.4)" strokeWidth="1" />
      {/* Rail ties */}
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={`tie-${i}`} x={150 + i * 8} y="204" width="2" height="4" fill="hsla(30, 20%, 20%, 0.3)" rx="0.2" />
      ))}
      {/* Moving cargo wagon */}
      <motion.g
        animate={{ x: [0, 60, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
        <rect x="155" y="201" width="14" height="6" fill="hsla(0, 30%, 18%, 0.6)" rx="0.5" />
        <rect x="155" y="201" width="14" height="1" fill={metalColor} />
        <circle cx="158" cy="207.5" r="1" fill="hsla(0, 0%, 20%, 0.5)" />
        <circle cx="166" cy="207.5" r="1" fill="hsla(0, 0%, 20%, 0.5)" />
      </motion.g>
      
      {/* Factory 1 with chimney */}
      <rect x="160" y="168" width="22" height="22" fill={baseColor} rx="1" />
      <rect x="160" y="168" width="22" height="1.5" fill={metalColor} />
      <rect x="164" y="158" width="4" height="12" fill="hsla(0, 0%, 18%, 0.9)" />
      {/* Smoke — more layered */}
      <motion.circle cx="166" cy="155" r="2.5" fill="hsla(0, 0%, 40%, 0.2)"
        animate={{ cy: [155, 145, 135], r: [2.5, 4, 6], opacity: [0.25, 0.15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeOut' }} />
      <motion.circle cx="166" cy="155" r="2" fill="hsla(0, 0%, 45%, 0.15)"
        animate={{ cy: [157, 148, 140], r: [2, 3.5, 5], opacity: [0.2, 0.1, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeOut', delay: 1.5 }} />
      <motion.circle cx="167" cy="153" r="1.5" fill="hsla(0, 0%, 50%, 0.1)"
        animate={{ cy: [153, 143, 133], r: [1.5, 3, 4.5], opacity: [0.12, 0.06, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeOut', delay: 2.5 }} />
      
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

      {/* Chop Shop garage */}
      <rect x="195" y="192" width="20" height="10" fill="hsla(30, 18%, 14%, 0.85)" rx="1" />
      {/* Garage door */}
      <rect x="198" y="195" width="7" height="7" fill="hsla(0, 0%, 8%, 0.6)" rx="0.5" />
      <rect x="207" y="195" width="7" height="7" fill="hsla(0, 0%, 8%, 0.6)" rx="0.5" />
      {/* Garage door lines */}
      {[196.5, 198, 199.5].map((y, i) => (
        <line key={`gd1-${i}`} x1="198.5" y1={y} x2="204.5" y2={y} stroke="hsla(0, 0%, 15%, 0.3)" strokeWidth="0.3" />
      ))}
      {[196.5, 198, 199.5].map((y, i) => (
        <line key={`gd2-${i}`} x1="207.5" y1={y} x2="213.5" y2={y} stroke="hsla(0, 0%, 15%, 0.3)" strokeWidth="0.3" />
      ))}
      {/* Roof accent */}
      <rect x="195" y="191.5" width="20" height="1.5" fill={metalColor} />
      {/* Wrench sign on wall */}
      <g transform="translate(203, 193.5) scale(0.35)">
        <motion.g animate={{ rotate: [0, 15, 0, -15, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          <path d="M2,8 L6,4 L8,6 L4,10 Z" fill="hsla(40, 80%, 50%, 0.7)" />
          <path d="M7,3 L10,0 L12,2 L9,5 Z" fill="hsla(40, 80%, 50%, 0.7)" />
        </motion.g>
      </g>
      {/* Neon "CHOP" sign */}
      <motion.text
        x="205" y="190" textAnchor="middle" fontSize="3"
        fontWeight="bold" fontFamily="monospace"
        fill="hsla(40, 90%, 55%, 0.8)"
        animate={{ opacity: [0.6, 1, 0.6], fill: ['hsla(40, 90%, 55%, 0.6)', 'hsla(40, 90%, 60%, 1)', 'hsla(40, 90%, 55%, 0.6)'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        CHOP SHOP
      </motion.text>
      {/* Sign glow */}
      <motion.rect x="193" y="187" width="24" height="5" rx="1" fill="hsla(40, 80%, 50%, 0.04)"
        animate={{ opacity: [0.03, 0.08, 0.03] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Sparks from inside garage */}
      <motion.circle cx="201" cy="199" r="0.5" fill="hsla(40, 100%, 70%, 0.8)"
        animate={{ opacity: [0, 1, 0], cy: [199, 197], x: [0, 1.5] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3, ease: 'easeOut' }} />
      <motion.circle cx="202" cy="199" r="0.3" fill="hsla(30, 100%, 60%, 0.7)"
        animate={{ opacity: [0, 0.8, 0], cy: [199, 196.5], x: [0, -1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3, ease: 'easeOut', delay: 0.1 }} />
      
      {/* Factory windows with industrial glow */}
      {[[163, 173], [170, 178], [188, 178], [196, 182], [210, 184], [220, 184]].map(([x, y], i) => (
        <rect key={`iw-${i}`} x={x} y={y} width="3" height="2" rx="0.2"
          fill={`hsla(30, 60%, 40%, ${0.06 + i * 0.02})`}>
          {i % 2 === 0 && (
            <animate attributeName="opacity" values="0.06;0.14;0.04;0.1" dur={`${4 + i}s`} repeatCount="indefinite" />
          )}
        </rect>
      ))}
    </g>
  );
}

function LowriseLandmarks({ isOwned, isSelected }: { isOwned: boolean; isSelected: boolean }) {
  const baseColor = isOwned ? 'hsla(0, 20%, 12%, 0.75)' : 'hsla(0, 0%, 10%, 0.75)';
  return (
    <g>
      {/* Broken pavement texture */}
      <line x1="45" y1="226" x2="55" y2="226" stroke="hsla(0, 0%, 15%, 0.3)" strokeWidth="0.5" strokeDasharray="2 3" />
      <line x1="70" y1="242" x2="85" y2="242" stroke="hsla(0, 0%, 15%, 0.3)" strokeWidth="0.5" strokeDasharray="3 2" />
      <line x1="100" y1="248" x2="120" y2="248" stroke="hsla(0, 0%, 15%, 0.25)" strokeWidth="0.4" strokeDasharray="2 4" />
      
      {/* Low irregular buildings */}
      <rect x="42" y="228" width="12" height="12" fill={baseColor} rx="0.5" />
      <rect x="56" y="232" width="10" height="8" fill={baseColor} rx="0.5" />
      <rect x="68" y="226" width="8" height="14" fill={baseColor} rx="0.5" />
      <rect x="78" y="230" width="14" height="10" fill={baseColor} rx="0.5" />
      <rect x="94" y="234" width="9" height="6" fill={baseColor} rx="0.5" />
      <rect x="105" y="228" width="11" height="12" fill={baseColor} rx="0.5" />
      <rect x="118" y="232" width="8" height="8" fill={baseColor} rx="0.5" />
      
      {/* Trash / debris */}
      <rect x="60" y="241" width="3" height="2" fill="hsla(30, 20%, 18%, 0.4)" rx="0.3" />
      <rect x="90" y="241" width="2" height="1.5" fill="hsla(0, 0%, 15%, 0.35)" rx="0.2" />
      <rect x="112" y="241" width="2.5" height="2" fill="hsla(30, 15%, 16%, 0.35)" rx="0.3" />
      
      {/* Broken streetlamp — with flicker */}
      <rect x="53" y="220" width="1" height="10" fill="hsla(0, 0%, 25%, 0.5)" />
      <motion.circle cx="53" cy="219" r="1.5" fill="hsla(45, 60%, 40%, 0.08)"
        animate={{ opacity: [0.08, 0, 0.04, 0, 0.08] }}
        transition={{ duration: 3, repeat: Infinity }} />
      
      {/* Working streetlamp (dim, flickering) */}
      <rect x="100" y="222" width="1" height="10" fill="hsla(0, 0%, 25%, 0.5)" />
      <motion.circle cx="100" cy="221" r="3" fill="hsla(45, 70%, 50%, 0.06)"
        animate={{ opacity: [0.06, 0.12, 0.04, 0.1, 0.06] }}
        transition={{ duration: 4, repeat: Infinity }} />
      <circle cx="100" cy="221" r="1" fill="hsla(45, 70%, 50%, 0.15)">
        <animate attributeName="opacity" values="0.15;0.25;0.08;0.2" dur="4s" repeatCount="indefinite" />
      </circle>
      
      {/* Graffiti accents (colored marks on walls) */}
      <rect x="44" y="232" width="4" height="1.5" fill="hsla(0, 70%, 45%, 0.25)" rx="0.3" />
      <rect x="70" y="234" width="3" height="1" fill="hsla(200, 70%, 45%, 0.2)" rx="0.3" />
      <rect x="108" y="234" width="5" height="1" fill="hsla(120, 60%, 40%, 0.2)" rx="0.3" />
      <rect x="80" y="233" width="3" height="1.5" fill="hsla(45, 70%, 45%, 0.18)" rx="0.3" />
      
      {/* Scattered dim windows */}
      {[[45, 231], [57, 235], [71, 229], [82, 233], [96, 236], [107, 231], [120, 235]].map(([x, y], i) => (
        <rect key={`lw-${i}`} x={x} y={y} width="2" height="2" rx="0.2"
          fill={`hsla(45, 60%, 40%, ${0.04 + Math.random() * 0.06})`}>
          {i % 2 === 0 && (
            <animate attributeName="opacity" values="0.04;0.1;0.02;0.08" dur={`${5 + i}s`} repeatCount="indefinite" />
          )}
        </rect>
      ))}
    </g>
  );
}

function NeonStripLandmarks({ isOwned, isSelected }: { isOwned: boolean; isSelected: boolean }) {
  const baseColor = isOwned ? 'hsla(280, 25%, 14%, 0.8)' : 'hsla(270, 20%, 14%, 0.8)';
  return (
    <g>
      {/* Neon road reflections */}
      <motion.rect x="280" y="208" width="85" height="2" rx="1"
        fill="hsla(330, 80%, 50%, 0.04)"
        animate={{ opacity: [0.03, 0.08, 0.03] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.rect x="290" y="212" width="65" height="1.5" rx="0.5"
        fill="hsla(270, 70%, 50%, 0.03)"
        animate={{ opacity: [0.02, 0.06, 0.02] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
      
      {/* Club buildings */}
      <rect x="285" y="172" width="14" height="32" fill={baseColor} rx="1" />
      <rect x="301" y="178" width="12" height="26" fill={baseColor} rx="1" />
      <rect x="315" y="170" width="16" height="34" fill={baseColor} rx="1" />
      <rect x="333" y="176" width="13" height="28" fill={baseColor} rx="1" />
      <rect x="348" y="180" width="11" height="24" fill={baseColor} rx="1" />
      
      {/* Vertical neon sign 1 — pink */}
      <motion.g animate={{ opacity: [0.4, 0.8, 0.3, 0.7, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}>
        <rect x="286" y="178" width="3" height="14" rx="0.5"
          fill="hsla(330, 90%, 55%, 0.2)" stroke="hsla(330, 90%, 55%, 0.4)" strokeWidth="0.3" />
        {/* Neon text characters */}
        <text x="287.5" y="185" fontSize="3" fill="hsla(330, 90%, 65%, 0.5)" textAnchor="middle"
          style={{ writingMode: 'vertical-rl' as any }}>BAR</text>
      </motion.g>
      
      {/* Horizontal neon sign 2 */}
      <rect x="317" y="174" width="12" height="3" rx="0.5"
        fill="hsla(270, 80%, 55%, 0.3)" stroke="hsla(270, 80%, 55%, 0.5)" strokeWidth="0.3">
        <animate attributeName="opacity" values="0.5;0.9;0.4;0.8;0.6" dur="2.5s" repeatCount="indefinite" />
      </rect>
      
      {/* Vertical neon sign 3 — blue */}
      <motion.g animate={{ opacity: [0.3, 0.7, 0.5, 0.9, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}>
        <rect x="347" y="184" width="3" height="10" rx="0.5"
          fill="hsla(200, 90%, 55%, 0.2)" stroke="hsla(200, 90%, 55%, 0.35)" strokeWidth="0.3" />
      </motion.g>
      
      {/* Neon sign 4 — green */}
      <rect x="302" y="182" width="8" height="2.5" rx="0.5"
        fill="hsla(150, 80%, 45%, 0.2)" stroke="hsla(150, 80%, 45%, 0.35)" strokeWidth="0.3">
        <animate attributeName="opacity" values="0.3;0.6;0.2;0.5;0.4" dur="3.5s" repeatCount="indefinite" />
      </rect>
      
      {/* Club entrance glow */}
      <rect x="303" y="198" width="8" height="6" fill="hsla(330, 80%, 50%, 0.08)" rx="1" />
      
      {/* Disco floor reflections */}
      <motion.rect x="300" y="200" width="15" height="4" rx="1"
        fill="hsla(270, 70%, 50%, 0.04)"
        animate={{ opacity: [0.03, 0.08, 0.03] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
      
      {/* Neon glow overlay */}
      <rect x="280" y="165" width="85" height="45" rx="4"
        fill="url(#neon-gradient)" opacity="0.4" />
      
      {/* Flashing windows — more variety */}
      {[
        [289, 185, 330], [305, 190, 270], [320, 182, 200], [337, 188, 330], [351, 186, 270],
        [289, 192, 200], [320, 192, 330], [337, 195, 270],
        [305, 196, 150], [323, 188, 330], [340, 192, 200],
      ].map(([x, y, hue], i) => (
        <rect key={`nw-${i}`} x={x} y={y} width="2.5" height="2.5" rx="0.3"
          fill={`hsla(${hue}, 70%, 50%, 0.12)`}>
          <animate attributeName="opacity" values="0.08;0.22;0.05;0.18;0.1" dur={`${1.5 + i * 0.25}s`} repeatCount="indefinite" />
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
  // All event icons get a subtle bounce animation
  const bounceTransition = { duration: 2, repeat: Infinity, ease: 'easeInOut' as const };
  const isHighVehicleHeat = (vehicleHeat ?? 0) > 50;

  switch (event.type) {
    case 'police_checkpoint':
      return (
        <motion.g
          animate={{ y: [y - 1, y + 1, y - 1] }}
          transition={bounceTransition}
        >
          <g transform={`translate(${x}, 0)`}>
            {/* Checkpoint reacts to vehicle heat — larger/more intense when vehicle is hot */}
            <motion.circle cy={0} r={isHighVehicleHeat ? 5 : 4}
              fill={isHighVehicleHeat ? 'hsla(0, 80%, 50%, 0.35)' : 'hsla(220, 80%, 50%, 0.3)'}
              animate={{ r: isHighVehicleHeat ? [5, 8, 5] : [4, 6, 4], opacity: [0.3, 0.15, 0.3] }}
              transition={{ duration: isHighVehicleHeat ? 0.8 : 1.2, repeat: Infinity }} />
            <circle cy={0} r="2.5" fill={isHighVehicleHeat ? 'hsla(0, 80%, 50%, 0.7)' : 'hsla(220, 80%, 50%, 0.6)'} />
            <motion.circle cy={0} r="1" fill="hsla(0, 80%, 50%, 0.8)"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: isHighVehicleHeat ? 0.4 : 0.8, repeat: Infinity }} />
            {/* Vehicle heat warning icon */}
            {isHighVehicleHeat && (
              <motion.text textAnchor="middle" y="-6" fontSize="5" fill="hsla(0, 80%, 60%, 0.9)"
                animate={{ opacity: [0.9, 0.5, 0.9] }}
                transition={{ duration: 1, repeat: Infinity }}>
                🚗
              </motion.text>
            )}
          </g>
        </motion.g>
      );
    case 'accident':
      return (
        <motion.g
          animate={{ y: [y - 1.5, y + 1.5, y - 1.5] }}
          transition={{ ...bounceTransition, delay: 0.3 }}
        >
          <g transform={`translate(${x}, 0)`}>
            <circle cy={0} r="3" fill="hsla(30, 90%, 50%, 0.4)" />
            <text textAnchor="middle" y="2.5" fontSize="4" fill="hsla(30, 90%, 60%, 0.9)">⚠</text>
          </g>
        </motion.g>
      );
    case 'street_fight':
      return (
        <motion.g
          animate={{ y: [y, y - 2, y], x: [x, x + 1, x - 1, x] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
        >
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
        <motion.g
          animate={{ y: [y - 1, y + 1, y - 1] }}
          transition={{ ...bounceTransition, delay: 0.5 }}
        >
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
        <motion.g
          animate={{ x: [x - 15, x + 15, x - 15], y: [y - 3, y + 3, y - 3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
          <circle r="2" fill="hsla(0, 0%, 60%, 0.5)" />
          <motion.circle r="1" fill="hsla(0, 80%, 50%, 0.6)"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }} />
          {/* Scan line below drone */}
          <motion.line x1="-3" y1="3" x2="3" y2="3"
            stroke="hsla(0, 80%, 50%, 0.2)" strokeWidth="0.5"
            animate={{ opacity: [0.2, 0.5, 0.2], y1: [3, 6, 3], y2: [3, 6, 3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
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

  // Use vehicle heat for border color (blue = vehicle, red = personal)
  const isVehicleDominant = vehicleHeat > personalHeat;
  const borderHue = isVehicleDominant ? '220' : '0';

  return (
    <g pointerEvents="none">
      {/* Vignette edges — color shifts based on dominant heat source */}
      <rect x="0" y="0" width="400" height="290" rx="0"
        fill="none" stroke={`hsla(${borderHue}, 80%, 40%, ${opacity})`}
        strokeWidth={4 + intensity * 8} />

      {maxHeat > 60 && (
        <rect x="0" y="0" width="400" height="290"
          fill={`hsla(${borderHue}, 80%, 30%, ${0.02 + intensity * 0.05})`} />
      )}

      {/* Vehicle heat indicator — police cruiser on roads */}
      {vehicleHeat > 40 && (
        <motion.circle r="2" opacity={0.4 + (vehicleHeat / 100) * 0.4}
          animate={{ offsetDistance: ['0%', '100%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          style={{ offsetPath: `path("${ROADS[1]}")` }}>
          <animate attributeName="fill" values="hsla(220,80%,50%,0.9);hsla(0,80%,50%,0.9)" dur="0.3s" repeatCount="indefinite" />
        </motion.circle>
      )}

      {/* Personal heat indicator — surveillance drone */}
      {personalHeat > 50 && (
        <motion.g
          animate={{ x: [50, 350, 50], y: [40, 70, 40] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}>
          <circle r="1.5" fill="hsla(0, 0%, 60%, 0.5)" />
          <motion.circle r="1" fill="hsla(0, 80%, 50%, 0.6)"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }} />
          <motion.line x1="-2" y1="2.5" x2="2" y2="2.5"
            stroke="hsla(0, 80%, 50%, 0.15)" strokeWidth="0.4"
            animate={{ opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 1.5, repeat: Infinity }} />
        </motion.g>
      )}

      {maxHeat > 80 && (
        <>
          {/* Pulsing border */}
          <motion.rect x="0" y="0" width="400" height="290" rx="0"
            fill="none" stroke={`hsla(${borderHue}, 80%, 40%, 0.3)`} strokeWidth="3"
            animate={{ opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }} />

          {/* LOCKDOWN text */}
          <motion.text x="200" y="20" textAnchor="middle"
            fill="hsla(0, 80%, 50%, 0.4)" fontSize="8" fontWeight="bold"
            fontFamily="Inter, sans-serif" letterSpacing="4"
            animate={{ opacity: [0.4, 0.2, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}>
            {personalHeat > 80 ? 'GEZOCHT' : vehicleHeat > 80 ? 'VOERTUIG ALERT' : 'LOCKDOWN'}
          </motion.text>

          {/* Helicopter (personal heat driven) */}
          {personalHeat > 70 && (
            <motion.g
              animate={{ x: [0, 380, 0], y: [30, 60, 30] }}
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

  const startX = fromMeta.cx;
  const startY = fromMeta.cy - 18;
  const endX = toMeta.cx;
  const endY = toMeta.cy - 18;

  return (
    <g pointerEvents="none">
      {/* Trail line */}
      <motion.line
        x1={startX} y1={startY}
        x2={startX} y2={startY}
        stroke="hsla(45, 93%, 50%, 0.4)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        strokeLinecap="round"
        animate={{
          x2: endX,
          y2: endY,
        }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      {/* Moving dot */}
      <motion.g
        initial={{ x: startX, y: startY, scale: 1 }}
        animate={{ x: endX, y: endY, scale: [1, 1.3, 1] }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      >
        {/* Glow */}
        <motion.circle
          r="6" fill="none"
          stroke="hsla(45, 93%, 50%, 0.3)"
          strokeWidth="1"
          animate={{ r: [5, 8, 5], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        {/* Core dot */}
        <circle r="3" fill="hsl(45, 93%, 50%)" />
        <circle r="1.5" fill="hsl(45, 93%, 70%)" />
      </motion.g>

      {/* Arrival flash at destination */}
      <motion.circle
        cx={endX} cy={endY}
        r="3"
        fill="hsla(45, 93%, 50%, 0.5)"
        initial={{ r: 3, opacity: 0 }}
        animate={{ r: 20, opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.6, delay: 0.7 }}
      />
    </g>
  );
}

// ========== MAIN COMPONENT ==========

export function CityMap({ playerLocation, selectedDistrict, ownedDistricts, districtDemands, mapEvents, heat, vehicleHeat, personalHeat, weather, nemesis, travelAnim, onSelectDistrict, smuggleRoutes = [], districtRep }: CityMapProps) {
  const defaultDistrictRep: Record<DistrictId, number> = districtRep || { port: 30, crown: 50, iron: 40, low: 15, neon: 60 };
  
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

        {/* === CITY AMBIENCE LAYER (behind landmarks) === */}
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
              {/* Owned district pulse glow */}
              {isOwned && !isSelected && (
                <motion.circle
                  cx={meta.cx} cy={meta.cy} r="22"
                  fill="none"
                  stroke="hsla(0, 72%, 51%, 0.15)"
                  strokeWidth="1.5"
                  animate={{
                    r: [20, 26, 20],
                    opacity: [0.15, 0.05, 0.15],
                    strokeWidth: [1.5, 0.8, 1.5],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              {isOwned && !isSelected && (
                <motion.circle
                  cx={meta.cx} cy={meta.cy} r="15"
                  fill="hsla(0, 72%, 51%, 0.04)"
                  animate={{
                    r: [15, 18, 15],
                    opacity: [0.04, 0.01, 0.04],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                />
              )}
              {isSelected && (
                <circle cx={meta.cx} cy={meta.cy} r="20" fill="hsla(45, 93%, 40%, 0.08)" filter="url(#district-glow)" />
              )}
              <rect x={meta.cx - meta.labelW / 2} y={meta.cy - 8} width={meta.labelW} height="16" rx="3"
                fill={isSelected ? 'hsla(45, 93%, 40%, 0.2)' : 'hsla(0, 0%, 5%, 0.85)'}
                stroke={isSelected ? 'hsl(45 93% 40%)' : isOwned ? 'hsl(0 72% 51%)' : 'hsl(0 0% 20%)'}
                strokeWidth={isSelected ? '1.5' : '0.5'} />
              {/* Owned border pulse */}
              {isOwned && !isSelected && (
                <motion.rect
                  x={meta.cx - meta.labelW / 2} y={meta.cy - 8}
                  width={meta.labelW} height="16" rx="3"
                  fill="none"
                  stroke="hsl(0 72% 51%)"
                  strokeWidth="0.5"
                  animate={{
                    strokeOpacity: [0.5, 1, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
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
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <text x="0" y="3" textAnchor="middle" fill="white" fontSize="6">♛</text>
                </g>
              )}
              {hasDemand && (
                <motion.g
                  transform={`translate(${meta.cx - meta.labelW / 2 + 2}, ${meta.cy - 10})`}
                  animate={{ y: [0, -1.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
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

        {/* === TRAFFIC (enhanced variety) === */}
        {/* Regular cars */}
        {ROADS.map((d, i) => (
          <motion.circle key={`t1-${i}`} r="1.5" fill="hsl(45 50% 50%)" opacity="0.35"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 4 + i * 1.2, repeat: Infinity, ease: 'linear', delay: i * 0.6 }}
            style={{ offsetPath: `path("${d}")` }} />
        ))}
        {/* Opposing traffic (red taillights) */}
        {ROADS.slice(0, 5).map((d, i) => (
          <motion.circle key={`t2-${i}`} r="1" fill="hsl(0 60% 50%)" opacity="0.25"
            animate={{ offsetDistance: ['100%', '0%'] }}
            transition={{ duration: 5 + i * 1.5, repeat: Infinity, ease: 'linear', delay: i * 1.2 + 2 }}
            style={{ offsetPath: `path("${d}")` }} />
        ))}
        {/* Buses (larger, slower) */}
        {ROADS.slice(2, 5).map((d, i) => (
          <motion.rect key={`bus-${i}`} x="-2.5" y="-1" width="5" height="2" rx="0.5"
            fill="hsla(200, 50%, 40%, 0.3)"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 10 + i * 3, repeat: Infinity, ease: 'linear', delay: i * 4 + 3 }}
            style={{ offsetPath: `path("${d}")` }} />
        ))}
        {/* Motorcycles (small, fast) */}
        {ROADS.slice(0, 3).map((d, i) => (
          <motion.circle key={`moto-${i}`} r="0.8" fill="hsla(45, 80%, 55%, 0.5)"
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 2.5 + i * 0.8, repeat: Infinity, ease: 'linear', delay: i * 2 + 5 }}
            style={{ offsetPath: `path("${d}")` }} />
        ))}
        {/* Emergency vehicle (reacts to vehicle heat) */}
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
            <TravelAnimation
              from={travelAnim.from}
              to={travelAnim.to}
              districtMeta={DISTRICT_META}
            />
          )}
        </AnimatePresence>

        {/* === NEMESIS MARKER === */}
        {nemesis && <NemesisMarker nemesis={nemesis} districtMeta={DISTRICT_META} />}

        {/* === WEATHER OVERLAY === */}
        <WeatherOverlay weather={weather} />

        {/* === HEAT OVERLAY === */}
        <HeatOverlay heat={heat} vehicleHeat={vehicleHeat} personalHeat={personalHeat} />

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
        Tactical Overview v3.0
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
