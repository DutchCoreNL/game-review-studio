import { useEffect, useRef, useState, useMemo } from 'react';
import { DistrictId } from '@/game/types';
import { cn } from '@/lib/utils';

export interface AvatarState {
  level: number;
  karma: number;
  district: DistrictId;
  weapon: string | null;
  armor: string | null;
  hasCybernetics: boolean;
}

interface Props {
  state: AvatarState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ── Palette ────────────────────────────────────────
const SKIN = '#d4a574';
const SKIN_SHADOW = '#b8895c';
const HAIR = '#1a1a2e';
const EYE = '#e0e0e0';
const PUPIL = '#ff4444';
const MOUTH = '#222';
const BOOT = '#1a1a1a';
const BOOT_HIGHLIGHT = '#2a2a2a';

const DISTRICT_PALETTE: Record<DistrictId, { bg1: string; bg2: string; accent: string }> = {
  port:  { bg1: '#0a1628', bg2: '#162640', accent: '#3b82f6' },
  crown: { bg1: '#1a0a28', bg2: '#2d1640', accent: '#a855f7' },
  iron:  { bg1: '#1a1410', bg2: '#302820', accent: '#f59e0b' },
  low:   { bg1: '#0a1a10', bg2: '#102a18', accent: '#22c55e' },
  neon:  { bg1: '#1a0a1e', bg2: '#2a1030', accent: '#ec4899' },
};

const TIER_CLOTHES: Record<string, { shirt: string; pants: string; detail: string }> = {
  rat:     { shirt: '#4a4a4a', pants: '#333333', detail: '#555555' },
  soldier: { shirt: '#2d2d5e', pants: '#1a1a3a', detail: '#4a4a8a' },
  boss:    { shirt: '#1a1a1a', pants: '#0d0d0d', detail: '#c9a84c' },
};

const ARMOR_COLORS: Record<string, { primary: string; secondary: string }> = {
  vest:        { primary: '#3a5a3a', secondary: '#4a6a4a' },
  suit:        { primary: '#1e1e3e', secondary: '#2e2e5e' },
  skull_armor: { primary: '#2a1a1a', secondary: '#4a2a2a' },
};

const WEAPON_SHAPES: Record<string, { color: string; type: 'pistol' | 'long' | 'blade' }> = {
  glock:        { color: '#555', type: 'pistol' },
  shotgun:      { color: '#6a4a2a', type: 'long' },
  ak47:         { color: '#4a3a2a', type: 'long' },
  sniper:       { color: '#3a3a4a', type: 'long' },
  cartel_blade: { color: '#c0c0c0', type: 'blade' },
};

// ── Pixel Grid Definitions (16×20) ────────────────
// Each row is 16 chars: '.' = transparent, letters = color keys
// This defines the base character shape

const BASE_BODY = [
  // Row 0-2: Hair/Head top
  '....HHHHHH......',
  '...HHHHHHHH.....',
  '..HHHHHHHHHH....',
  // Row 3-5: Face
  '..HSSSSSSSSH....',
  '..SEEsPPsEES....',
  '..SsSSMMSSsS....',
  // Row 6: Neck
  '....SsSsSs......',
  // Row 7-10: Torso
  '...CCCCCCCC.....',
  '..CCCCCCCCCC....',
  '..CCCDCCCDCC....',
  '..CCCCCCCCCC....',
  // Row 11-12: Belt/Waist
  '...CCCCCCCC.....',
  '...PPPPPPPP.....',
  // Row 13-16: Legs
  '...PPP..PPP.....',
  '...PPP..PPP.....',
  '...PPP..PPP.....',
  '...PPP..PPP.....',
  // Row 17-19: Boots
  '..BBBB..BBBB....',
  '..BBbB..BBbB....',
  '..BBBB..BBBB....',
];

const SIZE_MAP = {
  sm: { pixel: 3, width: 48, height: 60 },
  md: { pixel: 8, width: 128, height: 160 },
  lg: { pixel: 13, width: 208, height: 260 },
};

function buildColorMap(
  tier: string,
  armor: string | null,
  hasCybernetics: boolean
): Record<string, string> {
  const clothes = TIER_CLOTHES[tier] || TIER_CLOTHES.rat;
  const armorDef = armor && ARMOR_COLORS[armor];

  return {
    'H': HAIR,
    'S': SKIN,
    's': SKIN_SHADOW,
    'E': EYE,
    'P': hasCybernetics ? '#00ffff' : PUPIL,
    'M': MOUTH,
    'C': armorDef ? armorDef.primary : clothes.shirt,
    'D': armorDef ? armorDef.secondary : clothes.detail,
    'p': clothes.pants,
    'B': BOOT,
    'b': BOOT_HIGHLIGHT,
  };
}

// Replace pants 'P' in rows 12+ with 'p' for pants color
function resolveGrid(): string[] {
  return BASE_BODY.map((row, ri) => {
    if (ri >= 12) {
      return row.replace(/P/g, 'p');
    }
    return row;
  });
}

export function CharacterAvatar({ state, size = 'md', className }: Props) {
  const [glitch, setGlitch] = useState(false);
  const prevLevel = useRef(state.level);

  useEffect(() => {
    if (state.level !== prevLevel.current) {
      prevLevel.current = state.level;
      setGlitch(true);
      const t = setTimeout(() => setGlitch(false), 600);
      return () => clearTimeout(t);
    }
  }, [state.level]);

  const tier = state.level >= 30 ? 'boss' : state.level >= 10 ? 'soldier' : 'rat';
  const districtPal = DISTRICT_PALETTE[state.district];
  const dims = SIZE_MAP[size];
  const grid = useMemo(() => resolveGrid(), []);
  const colorMap = useMemo(
    () => buildColorMap(tier, state.armor, state.hasCybernetics),
    [tier, state.armor, state.hasCybernetics]
  );

  const weaponDef = state.weapon ? WEAPON_SHAPES[state.weapon] : null;

  // Karma glow
  const karmaGlow = state.karma < -20
    ? '0 0 15px rgba(220,38,38,0.5), 0 0 30px rgba(220,38,38,0.2)'
    : state.karma > 20
      ? '0 0 15px rgba(59,130,246,0.5), 0 0 30px rgba(234,179,8,0.2)'
      : 'none';

  const cyberGlow = state.hasCybernetics ? '0 0 8px rgba(0,255,255,0.3)' : '';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded border border-border flex-shrink-0',
        glitch && 'avatar-glitch',
        className
      )}
      style={{
        width: dims.width,
        height: dims.height,
        background: `linear-gradient(180deg, ${districtPal.bg1} 0%, ${districtPal.bg2} 100%)`,
        boxShadow: [karmaGlow, cyberGlow].filter(Boolean).join(', ') || undefined,
        imageRendering: 'pixelated',
      }}
    >
      {/* District accent line */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: dims.pixel * 2,
          background: `linear-gradient(90deg, transparent, ${districtPal.accent}40, transparent)`,
        }}
      />

      {/* Scanline effect for cybernetics */}
      {state.hasCybernetics && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent ${dims.pixel - 1}px, rgba(0,255,255,0.03) ${dims.pixel}px)`,
          }}
        />
      )}

      {/* Character pixels */}
      <svg
        viewBox="0 0 16 20"
        width={dims.width}
        height={dims.height}
        className="absolute inset-0"
        style={{ imageRendering: 'pixelated' }}
        shapeRendering="crispEdges"
      >
        {grid.map((row, y) =>
          row.split('').map((ch, x) => {
            if (ch === '.') return null;
            const color = colorMap[ch];
            if (!color) return null;
            return (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill={color}
              />
            );
          })
        )}

        {/* Weapon */}
        {weaponDef && (
          <>
            {weaponDef.type === 'pistol' && (
              <>
                <rect x={12} y={8} width={2} height={1} fill={weaponDef.color} />
                <rect x={13} y={9} width={1} height={2} fill={weaponDef.color} />
              </>
            )}
            {weaponDef.type === 'long' && (
              <>
                <rect x={12} y={6} width={1} height={6} fill={weaponDef.color} />
                <rect x={13} y={7} width={1} height={2} fill={weaponDef.color} />
              </>
            )}
            {weaponDef.type === 'blade' && (
              <>
                <rect x={12} y={5} width={1} height={7} fill={weaponDef.color} />
                <rect x={12} y={4} width={1} height={1} fill="#e0e0e0" />
                <rect x={12} y={3} width={1} height={1} fill="#ffffff" />
              </>
            )}
          </>
        )}

        {/* Boss tier crown */}
        {tier === 'boss' && (
          <>
            <rect x={5} y={0} width={1} height={1} fill="#c9a84c" />
            <rect x={7} y={0} width={1} height={1} fill="#c9a84c" />
            <rect x={9} y={0} width={1} height={1} fill="#c9a84c" />
            {/* Move head down conceptually - add crown base */}
          </>
        )}

        {/* Cybernetic eye glow */}
        {state.hasCybernetics && (
          <rect x={5} y={4} width={1} height={1} fill="#00ffff" opacity={0.8} />
        )}
      </svg>

      {/* Karma aura */}
      {state.karma < -20 && (
        <div
          className="absolute inset-0 z-[7] pointer-events-none rounded"
          style={{
            boxShadow: 'inset 0 0 20px rgba(220,38,38,0.3)',
            animation: 'pulseGlow 2.5s ease-in-out infinite',
          }}
        />
      )}
      {state.karma > 20 && (
        <div
          className="absolute inset-0 z-[7] pointer-events-none rounded"
          style={{
            boxShadow: 'inset 0 0 20px rgba(59,130,246,0.3)',
            animation: 'pulseGold 2.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Vignette */}
      <div
        className="absolute inset-0 z-[8] pointer-events-none rounded"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)' }}
      />
    </div>
  );
}
