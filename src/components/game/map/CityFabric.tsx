/**
 * CityFabric — Procedurally generated background city blocks
 * that fill the entire map, creating a realistic urban fabric.
 * All elements are static (no animations) for performance.
 */

import { DistrictId } from '@/game/types';

// Seeded pseudo-random for consistent renders
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// District color zones - each has a subtle tint
const ZONE_COLORS: Record<string, { base: string; accent: string; heightMod: number }> = {
  port: { base: 'hsla(210, 25%, 10%,', accent: 'hsla(210, 30%, 14%,', heightMod: 0.8 },
  crown: { base: 'hsla(220, 15%, 12%,', accent: 'hsla(220, 20%, 16%,', heightMod: 1.4 },
  iron: { base: 'hsla(25, 18%, 10%,', accent: 'hsla(30, 22%, 13%,', heightMod: 0.9 },
  low: { base: 'hsla(0, 5%, 8%,', accent: 'hsla(0, 8%, 10%,', heightMod: 0.6 },
  neon: { base: 'hsla(280, 15%, 11%,', accent: 'hsla(290, 20%, 14%,', heightMod: 1.0 },
  neutral: { base: 'hsla(0, 0%, 9%,', accent: 'hsla(0, 0%, 11%,', heightMod: 0.7 },
};

// Determine which zone a point belongs to
function getZone(x: number, y: number): string {
  if (x < 45) return 'water'; // coastline area
  if (x < 140 && y < 140) return 'port';
  if (x > 210 && y < 140) return 'crown';
  if (x > 140 && x < 250 && y > 145 && y < 220) return 'iron';
  if (x < 140 && y > 200) return 'low';
  if (x > 270 && y > 150) return 'neon';
  return 'neutral';
}

interface CityBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  opacity: number;
}

function generateCityBlocks(): CityBlock[] {
  const blocks: CityBlock[] = [];
  const rand = seededRandom(42);

  // Grid-based generation with variation
  for (let gx = 48; gx < 390; gx += 9) {
    for (let gy = 8; gy < 282; gy += 8) {
      // Skip some cells for streets/variation
      if (rand() < 0.25) continue;

      const zone = getZone(gx, gy);
      if (zone === 'water') continue;

      const colors = ZONE_COLORS[zone] || ZONE_COLORS.neutral;

      // Vary block size
      const w = 3 + rand() * 5;
      const h = 2 + rand() * 4 * colors.heightMod;
      const jitterX = (rand() - 0.5) * 3;
      const jitterY = (rand() - 0.5) * 2;

      const useAccent = rand() > 0.65;
      const baseOpacity = 0.25 + rand() * 0.35;

      blocks.push({
        x: gx + jitterX,
        y: gy + jitterY,
        w,
        h,
        fill: (useAccent ? colors.accent : colors.base) + `${baseOpacity})`,
        opacity: 1,
      });
    }
  }

  return blocks;
}

// Pre-generate blocks once (module-level, not per render)
const CITY_BLOCKS = generateCityBlocks();

// Background street grid between blocks
function BackgroundStreets() {
  const streets: JSX.Element[] = [];
  const rand = seededRandom(99);

  // Horizontal streets
  for (let y = 20; y < 280; y += 12 + Math.floor(rand() * 6)) {
    const x1 = 48 + rand() * 30;
    const x2 = 350 + rand() * 40;
    streets.push(
      <line key={`bsh-${y}`} x1={x1} y1={y} x2={x2} y2={y}
        stroke="hsla(0, 0%, 8%, 0.6)" strokeWidth={0.4 + rand() * 0.3} />
    );
  }

  // Vertical streets
  for (let x = 55; x < 385; x += 14 + Math.floor(rand() * 8)) {
    const y1 = 10 + rand() * 20;
    const y2 = 260 + rand() * 25;
    streets.push(
      <line key={`bsv-${x}`} x1={x} y1={y1} x2={x} y2={y2}
        stroke="hsla(0, 0%, 8%, 0.5)" strokeWidth={0.3 + rand() * 0.3} />
    );
  }

  return <g pointerEvents="none">{streets}</g>;
}

export function CityFabric() {
  return (
    <g pointerEvents="none">
      {/* Background street grid */}
      <BackgroundStreets />

      {/* City blocks */}
      {CITY_BLOCKS.map((block, i) => (
        <rect
          key={`cb-${i}`}
          x={block.x}
          y={block.y}
          width={block.w}
          height={block.h}
          fill={block.fill}
          rx={0.3}
        />
      ))}
    </g>
  );
}
