/**
 * CityFabric — Procedurally generated background city blocks
 * matching new district layout. Static for performance.
 */

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const ZONE_COLORS: Record<string, { base: string; accent: string; heightMod: number }> = {
  port:   { base: 'hsla(210, 30%, 10%,', accent: 'hsla(210, 35%, 14%,', heightMod: 0.8 },
  crown:  { base: 'hsla(220, 18%, 12%,', accent: 'hsla(220, 22%, 16%,', heightMod: 1.5 },
  iron:   { base: 'hsla(25, 22%, 9%,',   accent: 'hsla(30, 25%, 12%,',  heightMod: 0.9 },
  low:    { base: 'hsla(35, 10%, 8%,',   accent: 'hsla(35, 12%, 10%,',  heightMod: 0.5 },
  neon:   { base: 'hsla(280, 18%, 10%,', accent: 'hsla(290, 22%, 13%,', heightMod: 1.0 },
  neutral:{ base: 'hsla(0, 0%, 8%,',     accent: 'hsla(0, 0%, 10%,',    heightMod: 0.6 },
};

// New zone mapping based on updated layout
function getZone(x: number, y: number): string {
  if (x < 52) return 'water';
  // Canal zone
  if (y > 138 && y < 158) return 'water';
  // Upper city
  if (y < 140) {
    if (x < 170) return 'port';
    if (x > 240) return 'crown';
    return 'neutral';
  }
  // Lower city
  if (x < 160 && y > 158) return 'iron';
  if (x > 280 && y > 200) return 'low';
  if (x > 160 && x < 310 && y > 158) return 'neon';
  return 'neutral';
}

interface CityBlock {
  x: number; y: number; w: number; h: number; fill: string;
}

function generateCityBlocks(): CityBlock[] {
  const blocks: CityBlock[] = [];
  const rand = seededRandom(42);

  for (let gx = 54; gx < 395; gx += 8) {
    for (let gy = 8; gy < 282; gy += 7) {
      if (rand() < 0.22) continue;

      const zone = getZone(gx, gy);
      if (zone === 'water') continue;

      const colors = ZONE_COLORS[zone] || ZONE_COLORS.neutral;
      const w = 2.5 + rand() * 4.5;
      const h = 1.5 + rand() * 3.5 * colors.heightMod;
      const jx = (rand() - 0.5) * 2.5;
      const jy = (rand() - 0.5) * 2;
      const useAccent = rand() > 0.6;
      const op = 0.22 + rand() * 0.35;

      blocks.push({
        x: gx + jx, y: gy + jy, w, h,
        fill: (useAccent ? colors.accent : colors.base) + `${op})`,
      });
    }
  }
  return blocks;
}

const CITY_BLOCKS = generateCityBlocks();

function BackgroundStreets() {
  const streets: JSX.Element[] = [];
  const rand = seededRandom(99);

  for (let y = 18; y < 280; y += 11 + Math.floor(rand() * 5)) {
    // Skip canal zone
    if (y > 136 && y < 160) continue;
    const x1 = 54 + rand() * 25;
    const x2 = 360 + rand() * 35;
    streets.push(
      <line key={`bsh-${y}`} x1={x1} y1={y} x2={x2} y2={y}
        stroke="hsla(0, 0%, 7%, 0.5)" strokeWidth={0.3 + rand() * 0.3} />
    );
  }

  for (let x = 58; x < 390; x += 12 + Math.floor(rand() * 7)) {
    const y1 = 8 + rand() * 15;
    const y2 = 265 + rand() * 20;
    streets.push(
      <line key={`bsv-${x}`} x1={x} y1={y1} x2={x} y2={y2}
        stroke="hsla(0, 0%, 7%, 0.45)" strokeWidth={0.25 + rand() * 0.25} />
    );
  }

  return <g pointerEvents="none">{streets}</g>;
}

export function CityFabric() {
  return (
    <g pointerEvents="none">
      <BackgroundStreets />
      {CITY_BLOCKS.map((block, i) => (
        <rect
          key={`cb-${i}`}
          x={block.x} y={block.y}
          width={block.w} height={block.h}
          fill={block.fill}
          rx={0.3}
        />
      ))}
    </g>
  );
}
