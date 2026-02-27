import { useGame } from '@/contexts/GameContext';
import { GOODS, DISTRICTS } from '@/game/constants';
import { SectionHeader } from '../ui/SectionHeader';
import { motion } from 'framer-motion';
import { ScrollText, TrendingUp, TrendingDown, ShoppingCart, Banknote, BarChart3 } from 'lucide-react';
import { GOOD_IMAGES } from '@/assets/items';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { useMemo } from 'react';

export function TradeLogPanel() {
  const { state } = useGame();
  const log = state.tradeLog || [];

  const totalProfit = log
    .filter(e => e.mode === 'sell' && e.profitPerUnit !== undefined)
    .reduce((sum, e) => sum + (e.profitPerUnit! * e.quantity), 0);

  const totalBought = log.filter(e => e.mode === 'buy').reduce((sum, e) => sum + e.totalPrice, 0);
  const totalSold = log.filter(e => e.mode === 'sell').reduce((sum, e) => sum + e.totalPrice, 0);

  // Daily profit/loss chart data
  const dailyProfitData = useMemo(() => {
    const dayMap: Record<number, number> = {};
    for (const entry of log) {
      if (entry.mode === 'sell' && entry.profitPerUnit !== undefined) {
        dayMap[entry.day] = (dayMap[entry.day] || 0) + entry.profitPerUnit * entry.quantity;
      }
      if (entry.mode === 'buy') {
        // buys don't count as loss until sold, skip
      }
    }
    return Object.entries(dayMap)
      .map(([day, profit]) => ({ day: `D${day}`, profit, fill: profit >= 0 ? 'hsl(var(--emerald))' : 'hsl(var(--blood))' }))
      .slice(-10);
  }, [log]);

  return (
    <>
      <SectionHeader title="Handelslogboek" icon={<ScrollText size={12} />} />

      {/* Daily profit chart */}
      {dailyProfitData.length > 1 && (
        <div className="game-card mb-4">
          <h4 className="text-[0.6rem] font-bold text-gold uppercase tracking-wider mb-2 flex items-center gap-1">
            <BarChart3 size={10} /> Dagelijkse Winst/Verlies (10d)
          </h4>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={dailyProfitData}>
              <XAxis dataKey="day" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={35} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Bar dataKey="profit" radius={[2, 2, 0, 0]}>
                {dailyProfitData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
              <Tooltip
                formatter={(v: number) => [`${v >= 0 ? '+' : ''}€${v.toLocaleString()}`, 'Winst']}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '4px', fontSize: '0.55rem' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary strip */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 game-card p-2 text-center">
          <div className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">Ingekocht</div>
          <div className="text-xs font-bold text-foreground">€{totalBought.toLocaleString()}</div>
        </div>
        <div className="flex-1 game-card p-2 text-center">
          <div className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">Verkocht</div>
          <div className="text-xs font-bold text-foreground">€{totalSold.toLocaleString()}</div>
        </div>
        <div className="flex-1 game-card p-2 text-center">
          <div className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">Winst</div>
          <div className={`text-xs font-bold ${totalProfit >= 0 ? 'text-emerald' : 'text-blood'}`}>
            {totalProfit >= 0 ? '+' : ''}€{totalProfit.toLocaleString()}
          </div>
        </div>
      </div>

      {log.length === 0 ? (
        <div className="text-center text-muted-foreground text-xs py-8 opacity-60">
          Nog geen transacties. Ga naar de markt om te handelen.
        </div>
      ) : (
        <div className="space-y-1.5">
          {log.map((entry, i) => {
            const good = GOODS.find(g => g.id === entry.goodId);
            const district = DISTRICTS[entry.district];
            const isSell = entry.mode === 'sell';
            const profit = isSell && entry.profitPerUnit !== undefined ? entry.profitPerUnit * entry.quantity : null;

            return (
              <motion.div
                key={entry.id}
                initial={i === 0 ? { opacity: 0, x: -10 } : false}
                animate={{ opacity: 1, x: 0 }}
                className={`game-card p-2.5 border-l-[3px] ${isSell ? 'border-l-emerald' : 'border-l-gold'}`}
              >
                <div className="flex items-center gap-2.5">
                  {/* Icon */}
                  <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                    {GOOD_IMAGES[entry.goodId] ? (
                      <img src={GOOD_IMAGES[entry.goodId]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      isSell ? <Banknote size={14} className="text-emerald" /> : <ShoppingCart size={14} className="text-gold" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[0.55rem] font-bold uppercase px-1 py-0.5 rounded ${isSell ? 'bg-emerald/15 text-emerald' : 'bg-gold/15 text-gold'}`}>
                        {isSell ? 'VERKOOP' : 'INKOOP'}
                      </span>
                      <span className="font-bold text-xs text-foreground">{good?.name}</span>
                      <span className="text-[0.5rem] text-muted-foreground">×{entry.quantity}</span>
                    </div>
                    <div className="text-[0.55rem] text-muted-foreground mt-0.5">
                      Dag {entry.day} · {district?.name} · €{entry.pricePerUnit}/stuk
                    </div>
                  </div>

                  {/* Amount + profit */}
                  <div className="text-right flex-shrink-0">
                    <div className={`text-xs font-bold ${isSell ? 'text-emerald' : 'text-foreground'}`}>
                      {isSell ? '+' : '-'}€{entry.totalPrice.toLocaleString()}
                    </div>
                    {profit !== null && (
                      <div className={`text-[0.5rem] font-semibold flex items-center justify-end gap-0.5 ${profit >= 0 ? 'text-emerald' : 'text-blood'}`}>
                        {profit >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                        {profit >= 0 ? '+' : ''}€{profit.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="text-[0.45rem] text-muted-foreground text-center mt-3 opacity-50">
        Laatste 50 transacties worden bijgehouden
      </div>
    </>
  );
}
