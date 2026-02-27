import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GOODS, DISTRICTS } from '@/game/constants';
import { DistrictId, GoodId } from '@/game/types';
import { SectionHeader } from '../ui/SectionHeader';
import { Globe, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

const DISTRICT_IDS = Object.keys(DISTRICTS) as DistrictId[];

const DISTRICT_COLORS: Record<DistrictId, string> = {
  port: 'hsl(var(--blood))',
  crown: 'hsl(var(--ice))',
  iron: 'hsl(var(--gold))',
  low: 'hsl(var(--emerald))',
  neon: 'hsl(var(--game-purple))',
};

interface TradePoint {
  district_id: string;
  good_id: string;
  price: number;
  created_at: string;
}

export function GlobalMarketPanel() {
  const [history, setHistory] = useState<TradePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGood, setSelectedGood] = useState<GoodId>('drugs');

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const { data } = await supabase
        .from('market_trade_history')
        .select('district_id, good_id, price, created_at')
        .order('created_at', { ascending: true })
        .limit(1000);
      if (data) setHistory(data);
      setLoading(false);
    }
    fetchHistory();
  }, []);

  // Group data per good per district, aggregate by hour
  const chartData = buildChartData(history, selectedGood);

  return (
    <div>
      <SectionHeader title="Globaal Marktoverzicht" icon={<Globe size={12} />} />

      {/* Good selector */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {GOODS.map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedGood(g.id as GoodId)}
            className={`px-2.5 py-1 rounded text-[0.6rem] font-bold uppercase tracking-wider transition-all border ${
              selectedGood === g.id
                ? 'bg-gold/15 border-gold text-gold'
                : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-xs animate-pulse">Laden...</div>
      ) : chartData.points.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-xs">
          Nog geen handelsdata beschikbaar voor dit goed.
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GlobalChart data={chartData} />
          <StatsCards data={chartData} goodId={selectedGood} />
        </motion.div>
      )}
    </div>
  );
}

// ========== CHART ==========

interface ChartSeriesPoint { time: number; price: number }
interface ChartSeries { dist: DistrictId; name: string; color: string; points: ChartSeriesPoint[] }
interface ChartData { series: ChartSeries[]; points: ChartSeriesPoint[]; minPrice: number; maxPrice: number; minTime: number; maxTime: number }

function buildChartData(history: TradePoint[], goodId: GoodId): ChartData {
  const seriesMap: Record<string, ChartSeriesPoint[]> = {};
  DISTRICT_IDS.forEach(d => { seriesMap[d] = []; });

  history.filter(h => h.good_id === goodId).forEach(h => {
    const t = new Date(h.created_at).getTime();
    seriesMap[h.district_id]?.push({ time: t, price: h.price });
  });

  const allPoints: ChartSeriesPoint[] = [];
  const series: ChartSeries[] = DISTRICT_IDS.map(did => {
    const pts = seriesMap[did] || [];
    allPoints.push(...pts);
    return { dist: did, name: DISTRICTS[did].name, color: DISTRICT_COLORS[did], points: pts };
  });

  if (allPoints.length === 0) return { series, points: [], minPrice: 0, maxPrice: 0, minTime: 0, maxTime: 0 };

  const prices = allPoints.map(p => p.price);
  const times = allPoints.map(p => p.time);

  return {
    series,
    points: allPoints,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
  };
}

function GlobalChart({ data }: { data: ChartData }) {
  const [hovered, setHovered] = useState<DistrictId | null>(null);
  const { minPrice, maxPrice, minTime, maxTime, series } = data;
  const range = maxPrice - minPrice || 1;
  const timeRange = maxTime - minTime || 1;

  const W = 320;
  const H = 130;
  const PX = 32;
  const PY = 10;
  const cW = W - PX;
  const cH = H - PY * 2;

  const toX = (t: number) => PX + ((t - minTime) / timeRange) * cW;
  const toY = (p: number) => PY + cH - ((p - minPrice) / range) * cH;

  const yLabels = [minPrice, Math.floor((minPrice + maxPrice) / 2), maxPrice];

  return (
    <div className="game-card p-3 mb-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 180 }}>
        {/* Grid */}
        {yLabels.map(v => (
          <g key={v}>
            <line x1={PX} x2={W} y1={toY(v)} y2={toY(v)} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="2,2" />
            <text x={PX - 3} y={toY(v) + 3} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize="6" fontFamily="monospace">
              €{v}
            </text>
          </g>
        ))}

        {/* Lines */}
        {series.map(s => {
          if (s.points.length < 2) return null;
          const sorted = [...s.points].sort((a, b) => a.time - b.time);
          const pts = sorted.map(p => `${toX(p.time)},${toY(p.price)}`).join(' ');
          const isH = hovered === s.dist;
          const opacity = hovered === null ? 0.8 : isH ? 1 : 0.15;

          return (
            <g key={s.dist}>
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth={isH ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
              <circle cx={toX(sorted[sorted.length - 1].time)} cy={toY(sorted[sorted.length - 1].price)} r={isH ? 3.5 : 2} fill={s.color} opacity={opacity} />
              {isH && (
                <text x={toX(sorted[sorted.length - 1].time) + 4} y={toY(sorted[sorted.length - 1].price) - 4} fill={s.color} fontSize="7" fontWeight="bold" fontFamily="monospace">
                  €{sorted[sorted.length - 1].price}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {series.map(s => {
          const last = s.points.length > 0 ? s.points[s.points.length - 1].price : 0;
          return (
            <button
              key={s.dist}
              onPointerEnter={() => setHovered(s.dist)}
              onPointerLeave={() => setHovered(null)}
              className={`flex items-center gap-1 text-[0.5rem] transition-opacity ${
                hovered !== null && hovered !== s.dist ? 'opacity-30' : 'opacity-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-muted-foreground">{s.name}</span>
              {last > 0 && <span className="font-bold text-foreground">€{last}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ========== STATS CARDS ==========

function StatsCards({ data, goodId }: { data: ChartData; goodId: GoodId }) {
  const good = GOODS.find(g => g.id === goodId);

  const stats = data.series.map(s => {
    const prices = s.points.map(p => p.price);
    if (prices.length === 0) return { ...s, avg: 0, min: 0, max: 0, trend: 0, trades: 0 };
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const sorted = [...s.points].sort((a, b) => a.time - b.time);
    const trend = sorted.length >= 2 ? sorted[sorted.length - 1].price - sorted[0].price : 0;
    return { ...s, avg, min, max, trend, trades: prices.length };
  });

  return (
    <div>
      <SectionHeader title={`${good?.name || goodId} — Statistieken`} icon={<TrendingUp size={12} />} />
      <div className="grid grid-cols-1 gap-2">
        {stats.filter(s => s.trades > 0).map(s => (
          <div key={s.dist} className="game-card p-2.5 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-[0.6rem] font-bold text-foreground">{s.name}</div>
              <div className="flex gap-3 text-[0.5rem] text-muted-foreground mt-0.5">
                <span>Gem: <span className="text-foreground font-semibold">€{s.avg}</span></span>
                <span>Min: <span className="text-emerald font-semibold">€{s.min}</span></span>
                <span>Max: <span className="text-blood font-semibold">€{s.max}</span></span>
                <span>Trades: <span className="text-foreground font-semibold">{s.trades}</span></span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 text-[0.55rem] font-bold">
              {s.trend > 0 ? (
                <><TrendingUp size={10} className="text-blood" /><span className="text-blood">+€{s.trend}</span></>
              ) : s.trend < 0 ? (
                <><TrendingDown size={10} className="text-emerald" /><span className="text-emerald">€{s.trend}</span></>
              ) : (
                <><Minus size={10} className="text-muted-foreground" /><span className="text-muted-foreground">—</span></>
              )}
            </div>
          </div>
        ))}
        {stats.every(s => s.trades === 0) && (
          <p className="text-[0.55rem] text-muted-foreground text-center py-4">Geen handelsdata.</p>
        )}
      </div>
    </div>
  );
}
