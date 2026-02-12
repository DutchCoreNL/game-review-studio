import { DISTRICTS } from '@/game/constants';
import { DistrictId } from '@/game/types';
import { useState } from 'react';

const DISTRICT_IDS = Object.keys(DISTRICTS) as DistrictId[];

const DISTRICT_COLORS: Record<DistrictId, string> = {
  port: 'hsl(var(--blood))',
  crown: 'hsl(var(--ice))',
  iron: 'hsl(var(--gold))',
  low: 'hsl(var(--emerald))',
  neon: 'hsl(var(--game-purple))',
};

interface PriceHistoryChartProps {
  goodId: string;
  priceHistory: Record<string, Record<string, number[]>>;
  currentPrices: Record<string, Record<string, number>>;
}

export function PriceHistoryChart({ goodId, priceHistory, currentPrices }: PriceHistoryChartProps) {
  const [hoveredDist, setHoveredDist] = useState<DistrictId | null>(null);

  // Gather all data series
  const series = DISTRICT_IDS.map(did => {
    const history = priceHistory?.[did]?.[goodId] || [];
    const current = currentPrices?.[did]?.[goodId] || 0;
    const data = [...history, current];
    return { dist: did, data, name: DISTRICTS[did].name, color: DISTRICT_COLORS[did] };
  });

  // Find global min/max across all districts
  const allValues = series.flatMap(s => s.data);
  if (allValues.length === 0) return <p className="text-[0.55rem] text-muted-foreground">Nog geen prijsdata beschikbaar.</p>;

  const maxLen = Math.max(...series.map(s => s.data.length));
  if (maxLen < 2) return <p className="text-[0.55rem] text-muted-foreground">Minimaal 2 dagen data nodig.</p>;

  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;

  const W = 280;
  const H = 100;
  const PAD_X = 30;
  const PAD_Y = 8;
  const chartW = W - PAD_X;
  const chartH = H - PAD_Y * 2;

  function toX(i: number, len: number) {
    return PAD_X + (i / (Math.max(len, maxLen) - 1)) * chartW;
  }
  function toY(val: number) {
    return PAD_Y + chartH - ((val - min) / range) * chartH;
  }

  // Y-axis labels
  const yLabels = [min, Math.floor((min + max) / 2), max];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 140 }}>
        {/* Grid lines */}
        {yLabels.map(v => (
          <g key={v}>
            <line x1={PAD_X} x2={W} y1={toY(v)} y2={toY(v)} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="2,2" />
            <text x={PAD_X - 3} y={toY(v) + 3} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize="6" fontFamily="monospace">
              €{v}
            </text>
          </g>
        ))}

        {/* Lines per district */}
        {series.map(s => {
          if (s.data.length < 2) return null;
          const points = s.data.map((v, i) => `${toX(i, s.data.length)},${toY(v)}`).join(' ');
          const isHovered = hoveredDist === s.dist;
          const opacity = hoveredDist === null ? 0.8 : isHovered ? 1 : 0.2;

          return (
            <g key={s.dist}>
              <polyline
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth={isHovered ? 2.5 : 1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={opacity}
              />
              {/* End dot */}
              <circle
                cx={toX(s.data.length - 1, s.data.length)}
                cy={toY(s.data[s.data.length - 1])}
                r={isHovered ? 3.5 : 2.5}
                fill={s.color}
                opacity={opacity}
              />
              {/* Current price label on hover */}
              {isHovered && (
                <text
                  x={toX(s.data.length - 1, s.data.length) + 4}
                  y={toY(s.data[s.data.length - 1]) - 4}
                  fill={s.color}
                  fontSize="7"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  €{s.data[s.data.length - 1]}
                </text>
              )}
            </g>
          );
        })}

        {/* X-axis labels */}
        {Array.from({ length: maxLen }).map((_, i) => {
          const dayLabel = maxLen - i;
          if (maxLen > 7 && i % 2 !== 0 && i !== maxLen - 1) return null;
          return (
            <text key={i} x={toX(i, maxLen)} y={H - 1} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="5.5" fontFamily="monospace">
              {i === maxLen - 1 ? 'Nu' : `-${dayLabel - 1}d`}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
        {series.map(s => (
          <button
            key={s.dist}
            onPointerEnter={() => setHoveredDist(s.dist)}
            onPointerLeave={() => setHoveredDist(null)}
            className={`flex items-center gap-1 text-[0.5rem] transition-opacity ${
              hoveredDist !== null && hoveredDist !== s.dist ? 'opacity-30' : 'opacity-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-muted-foreground">{s.name}</span>
            <span className="font-bold text-foreground">€{s.data[s.data.length - 1]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
