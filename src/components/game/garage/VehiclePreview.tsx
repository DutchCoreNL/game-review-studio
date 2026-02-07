import { motion } from 'framer-motion';
import { VehicleUpgradeType } from '@/game/types';

interface VehiclePreviewProps {
  vehicleId: string;
  vehicleName: string;
  upgrades: Partial<Record<VehicleUpgradeType, number>>;
  heatLevel: 'safe' | 'warning' | 'critical';
}

// Vehicle silhouette configs per vehicle type
const VEHICLE_PROFILES: Record<string, {
  bodyPath: string;
  wheelY: number;
  wheelR: number;
  width: number;
  height: number;
  roofLine: string;
  windowPath: string;
}> = {
  toyohata: {
    bodyPath: 'M30,55 Q30,42 45,38 L60,35 Q75,30 95,30 L130,30 Q145,30 155,35 L170,38 Q185,42 185,55 L185,60 L30,60 Z',
    roofLine: 'M65,30 Q75,18 95,16 L120,16 Q140,18 150,30',
    windowPath: 'M70,29 Q78,20 95,18 L118,18 Q135,20 143,29 Z',
    wheelY: 60,
    wheelR: 9,
    width: 215,
    height: 80,
  },
  forgedyer: {
    bodyPath: 'M20,50 Q20,38 35,34 L50,30 Q60,26 80,24 L150,24 Q170,24 180,28 L195,32 Q210,38 210,50 L210,58 L20,58 Z',
    roofLine: 'M55,24 Q60,12 80,10 L140,10 Q160,12 165,24',
    windowPath: 'M60,23 Q64,14 80,12 L138,12 Q154,14 158,23 Z',
    wheelY: 58,
    wheelR: 11,
    width: 230,
    height: 80,
  },
  bavamotor: {
    bodyPath: 'M25,52 Q25,40 40,36 L58,32 Q72,26 92,25 L135,25 Q155,26 165,32 L180,36 Q195,40 195,52 L195,58 L25,58 Z',
    roofLine: 'M65,25 Q72,14 92,12 L128,12 Q148,14 155,25',
    windowPath: 'M70,24 Q76,16 92,14 L126,14 Q142,16 148,24 Z',
    wheelY: 58,
    wheelR: 9,
    width: 220,
    height: 78,
  },
  meridiolux: {
    bodyPath: 'M22,52 Q22,38 40,33 L60,28 Q78,22 100,22 L145,22 Q168,22 178,28 L195,33 Q212,38 212,52 L212,58 L22,58 Z',
    roofLine: 'M65,22 Q75,10 100,8 L138,8 Q162,10 172,22',
    windowPath: 'M70,21 Q78,12 100,10 L136,10 Q158,12 166,21 Z',
    wheelY: 58,
    wheelR: 10,
    width: 234,
    height: 78,
  },
  lupoghini: {
    bodyPath: 'M18,54 Q18,44 35,40 L55,36 Q75,30 100,28 L150,28 Q175,28 188,34 L200,38 Q215,44 215,54 L215,58 L18,58 Z',
    roofLine: 'M75,28 Q85,18 105,16 L140,17 Q158,19 165,28',
    windowPath: 'M80,27 Q88,20 105,18 L138,19 Q153,21 158,27 Z',
    wheelY: 58,
    wheelR: 9,
    width: 233,
    height: 76,
  },
  royaleryce: {
    bodyPath: 'M15,50 Q15,36 35,30 L58,26 Q80,20 105,18 L155,18 Q180,20 195,26 L215,30 Q235,36 235,50 L235,58 L15,58 Z',
    roofLine: 'M65,18 Q78,6 105,4 L148,4 Q175,6 188,18',
    windowPath: 'M70,17 Q82,8 105,6 L146,6 Q169,8 181,17 Z',
    wheelY: 58,
    wheelR: 11,
    width: 250,
    height: 78,
  },
};

const HEAT_COLORS = {
  safe: 'hsl(var(--emerald))',
  warning: 'hsl(var(--gold))',
  critical: 'hsl(var(--blood))',
};

const HEAT_GLOW = {
  safe: 'none',
  warning: '0 0 8px hsl(var(--gold) / 0.3)',
  critical: '0 0 12px hsl(var(--blood) / 0.4)',
};

export function VehiclePreview({ vehicleId, vehicleName, upgrades, heatLevel }: VehiclePreviewProps) {
  const profile = VEHICLE_PROFILES[vehicleId] || VEHICLE_PROFILES.toyohata;
  const armorLevel = upgrades.armor || 0;
  const speedLevel = upgrades.speed || 0;
  const storageLevel = upgrades.storage || 0;

  const accentColor = HEAT_COLORS[heatLevel];
  const totalUpgrades = armorLevel + speedLevel + storageLevel;

  // Body color shifts with total upgrades
  const bodyFills = [
    'hsl(var(--muted-foreground) / 0.15)',  // stock
    'hsl(var(--muted-foreground) / 0.2)',   // 1-2 upgrades
    'hsl(var(--gold) / 0.08)',              // 3-5 upgrades  
    'hsl(var(--gold) / 0.15)',              // 6-8 upgrades
    'hsl(var(--gold) / 0.22)',              // 9 (maxed)
  ];
  const bodyFill = bodyFills[Math.min(Math.floor(totalUpgrades / 2), bodyFills.length - 1)];

  // Stripe color based on highest upgrade
  const stripeColor = armorLevel >= speedLevel && armorLevel >= storageLevel
    ? 'hsl(var(--ice) / 0.4)'
    : speedLevel >= storageLevel
      ? 'hsl(var(--blood) / 0.4)'
      : 'hsl(var(--gold) / 0.4)';

  const viewBox = `0 0 ${profile.width} ${profile.height}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-lg border border-border bg-background/60 overflow-hidden mb-2.5"
      style={{ filter: heatLevel !== 'safe' ? `drop-shadow(${HEAT_GLOW[heatLevel]})` : 'none' }}
    >
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />

      <svg viewBox={viewBox} className="w-full h-auto" style={{ maxHeight: 90 }}>
        {/* Ground line */}
        <line x1="0" y1={profile.wheelY + profile.wheelR} x2={profile.width} y2={profile.wheelY + profile.wheelR}
          stroke="hsl(var(--border))" strokeWidth="1" />

        {/* Shadow */}
        <ellipse cx={profile.width / 2} cy={profile.wheelY + profile.wheelR - 1}
          rx={profile.width * 0.35} ry="3"
          fill="hsl(var(--foreground) / 0.06)" />

        {/* Car body */}
        <motion.path
          d={profile.bodyPath}
          fill={bodyFill}
          stroke="hsl(var(--muted-foreground) / 0.3)"
          strokeWidth="1.2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8 }}
        />

        {/* Roof line */}
        <path
          d={profile.roofLine}
          fill="none"
          stroke="hsl(var(--muted-foreground) / 0.25)"
          strokeWidth="1.2"
        />

        {/* Window */}
        <path
          d={profile.windowPath}
          fill="hsl(var(--ice) / 0.08)"
          stroke="hsl(var(--ice) / 0.15)"
          strokeWidth="0.8"
        />

        {/* Racing stripe (speed upgrade) */}
        {speedLevel > 0 && (
          <motion.line
            x1={profile.width * 0.15} y1={profile.wheelY - 15}
            x2={profile.width * 0.85} y2={profile.wheelY - 15}
            stroke={stripeColor}
            strokeWidth={speedLevel}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        )}

        {/* Armor plates (armor upgrade) */}
        {armorLevel >= 1 && (
          <motion.rect
            x={profile.width * 0.18} y={profile.wheelY - 8}
            width={profile.width * 0.15} height="5" rx="1"
            fill="hsl(var(--ice) / 0.15)"
            stroke="hsl(var(--ice) / 0.3)"
            strokeWidth="0.6"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.2 }}
          />
        )}
        {armorLevel >= 2 && (
          <motion.rect
            x={profile.width * 0.65} y={profile.wheelY - 8}
            width={profile.width * 0.15} height="5" rx="1"
            fill="hsl(var(--ice) / 0.15)"
            stroke="hsl(var(--ice) / 0.3)"
            strokeWidth="0.6"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.35 }}
          />
        )}
        {armorLevel >= 3 && (
          <motion.path
            d={`M${profile.width * 0.35},${profile.wheelY - 10} L${profile.width * 0.65},${profile.wheelY - 10}`}
            fill="none"
            stroke="hsl(var(--ice) / 0.4)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          />
        )}

        {/* Storage box (storage upgrade) */}
        {storageLevel >= 1 && (
          <motion.rect
            x={profile.width * 0.38} y={profile.wheelY - 4}
            width={8 + storageLevel * 4} height="4" rx="0.5"
            fill="hsl(var(--gold) / 0.15)"
            stroke="hsl(var(--gold) / 0.3)"
            strokeWidth="0.6"
            initial={{ opacity: 0, y: profile.wheelY }}
            animate={{ opacity: 1, y: profile.wheelY - 4 }}
            transition={{ delay: 0.25 }}
          />
        )}

        {/* Headlights */}
        <circle cx={profile.width * 0.87} cy={profile.wheelY - 6} r="2.5"
          fill={accentColor} opacity="0.6" />
        <circle cx={profile.width * 0.87} cy={profile.wheelY - 6} r="1.2"
          fill="hsl(var(--foreground) / 0.8)" />

        {/* Taillights */}
        <circle cx={profile.width * 0.13} cy={profile.wheelY - 6} r="2"
          fill="hsl(var(--blood) / 0.5)" />

        {/* Wheels */}
        {[profile.width * 0.25, profile.width * 0.75].map((wx, i) => (
          <g key={i}>
            <circle cx={wx} cy={profile.wheelY} r={profile.wheelR}
              fill="hsl(var(--foreground) / 0.7)"
              stroke="hsl(var(--foreground) / 0.3)"
              strokeWidth="1" />
            <circle cx={wx} cy={profile.wheelY} r={profile.wheelR * 0.55}
              fill="hsl(var(--muted) / 0.8)"
              stroke="hsl(var(--muted-foreground) / 0.3)"
              strokeWidth="0.5" />
            {/* Rim spokes (speed upgrade shows sport rims) */}
            {speedLevel >= 2 && Array.from({ length: 5 }).map((_, s) => {
              const angle = (s * 72) * Math.PI / 180;
              const innerR = profile.wheelR * 0.2;
              const outerR = profile.wheelR * 0.5;
              return (
                <line key={s}
                  x1={wx + Math.cos(angle) * innerR}
                  y1={profile.wheelY + Math.sin(angle) * innerR}
                  x2={wx + Math.cos(angle) * outerR}
                  y2={profile.wheelY + Math.sin(angle) * outerR}
                  stroke="hsl(var(--gold) / 0.5)"
                  strokeWidth="0.8"
                />
              );
            })}
          </g>
        ))}

        {/* Speed lines (speed upgrade level 3) */}
        {speedLevel >= 3 && (
          <>
            {[0, 1, 2].map(i => (
              <motion.line
                key={`speed-${i}`}
                x1={profile.width * 0.03}
                y1={profile.wheelY - 18 + i * 8}
                x2={profile.width * 0.12}
                y2={profile.wheelY - 18 + i * 8}
                stroke="hsl(var(--muted-foreground) / 0.2)"
                strokeWidth="1"
                strokeLinecap="round"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: [0, 0.6, 0], x: [-5, 0, -5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </>
        )}
      </svg>

      {/* Vehicle name & tier badges */}
      <div className="absolute bottom-1.5 left-2.5 flex items-center gap-1.5">
        <span className="text-[0.5rem] font-bold text-muted-foreground uppercase tracking-wider">
          {vehicleName}
        </span>
        {totalUpgrades > 0 && (
          <span className="text-[0.45rem] font-bold px-1 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">
            +{totalUpgrades}
          </span>
        )}
      </div>

      {/* Upgrade indicators */}
      <div className="absolute bottom-1.5 right-2.5 flex gap-1">
        {armorLevel > 0 && (
          <span className="text-[0.45rem] px-1 py-0.5 rounded bg-ice/10 text-ice border border-ice/20">
            🛡️{armorLevel}
          </span>
        )}
        {speedLevel > 0 && (
          <span className="text-[0.45rem] px-1 py-0.5 rounded bg-blood/10 text-blood border border-blood/20">
            ⚡{speedLevel}
          </span>
        )}
        {storageLevel > 0 && (
          <span className="text-[0.45rem] px-1 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">
            📦{storageLevel}
          </span>
        )}
      </div>
    </motion.div>
  );
}
