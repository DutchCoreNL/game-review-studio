import { useState, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { STOCKS, STOCK_IDS, StockId, getPortfolioValue, getPortfolioCost, ensureStockState } from '@/game/stocks';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { InfoRow } from '../ui/InfoRow';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Minus, Plus, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function StockMarketPanel() {
  const { state, dispatch, showToast } = useGame();
  const [selectedStock, setSelectedStock] = useState<StockId | null>(null);
  const [shares, setShares] = useState(1);

  // Ensure state is initialized
  useMemo(() => ensureStockState(state), []);

  const portfolioValue = useMemo(() => getPortfolioValue(state), [state.stockPrices, state.stockHoldings]);
  const portfolioCost = useMemo(() => getPortfolioCost(state), [state.stockHoldings]);
  const portfolioProfit = portfolioValue - portfolioCost;

  const tip = state.pendingInsiderTip;

  return (
    <div className="space-y-3">
      {/* Insider tip */}
      <AnimatePresence>
        {tip && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="game-card border-l-[3px] border-l-gold bg-gold/5"
          >
            <div className="flex items-start gap-2">
              <Lightbulb size={14} className="text-gold flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[0.55rem] font-bold text-gold">INSIDER TIP van {tip.source}</p>
                <p className="text-[0.5rem] text-muted-foreground mt-0.5">
                  {STOCKS.find(s => s.id === tip.stockId)?.name} gaat waarschijnlijk{' '}
                  <span className={tip.direction === 'up' ? 'text-emerald font-bold' : 'text-blood font-bold'}>
                    {tip.magnitude === 'groot' ? 'flink ' : ''}{tip.direction === 'up' ? 'stijgen 📈' : 'dalen 📉'}
                  </span>
                </p>
              </div>
              <button onClick={() => dispatch({ type: 'DISMISS_INSIDER_TIP' })} className="text-[0.5rem] text-muted-foreground hover:text-foreground">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portfolio overview */}
      {portfolioValue > 0 && (
        <div className="game-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.55rem] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><PieChart size={10} /> Portfolio</span>
            <span className="text-xs font-bold text-foreground">€{portfolioValue.toLocaleString()}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-[0.5rem] text-muted-foreground">Geïnvesteerd: €{portfolioCost.toLocaleString()}</span>
            <span className={`text-[0.5rem] font-bold ${portfolioProfit >= 0 ? 'text-emerald' : 'text-blood'}`}>
              {portfolioProfit >= 0 ? '+' : ''}€{portfolioProfit.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Active stock event */}
      {state.stockEvents && state.stockEvents.length > 0 && (
        <div className="game-card bg-ice/5 border-l-[3px] border-l-ice">
          <p className="text-[0.55rem] font-bold text-ice">{state.stockEvents[0].name}</p>
          <p className="text-[0.5rem] text-muted-foreground">{state.stockEvents[0].desc}</p>
        </div>
      )}

      {/* Stock list */}
      <SectionHeader title="Aandelenmarkt" icon={<TrendingUp size={12} />} />
      <div className="space-y-1.5">
        {STOCKS.map(stock => {
          const price = state.stockPrices?.[stock.id] || stock.basePrice;
          const history = state.stockHistory?.[stock.id] || [stock.basePrice];
          const prevPrice = history.length >= 2 ? history[history.length - 2] : stock.basePrice;
          const change = price - prevPrice;
          const changePct = prevPrice > 0 ? ((change / prevPrice) * 100).toFixed(1) : '0.0';
          const holding = state.stockHoldings?.[stock.id];
          const isSelected = selectedStock === stock.id;

          return (
            <div key={stock.id}>
              <button
                onClick={() => setSelectedStock(isSelected ? null : stock.id)}
                className={`w-full game-card transition-all ${isSelected ? 'border-gold/40' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{stock.icon}</span>
                    <div className="text-left">
                      <p className="text-[0.6rem] font-bold">{stock.name}</p>
                      <p className="text-[0.45rem] text-muted-foreground">{stock.sector} • Div: {(stock.dividendRate * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">€{price}</p>
                    <p className={`text-[0.5rem] font-semibold flex items-center justify-end gap-0.5 ${change >= 0 ? 'text-emerald' : 'text-blood'}`}>
                      {change >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                      {change >= 0 ? '+' : ''}{changePct}%
                    </p>
                  </div>
                </div>

                {/* Mini sparkline */}
                {history.length >= 2 && (
                  <StockSparkline data={history} color={stock.color} />
                )}

                {/* Holdings */}
                {holding && holding.shares > 0 && (
                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border/50">
                    <span className="text-[0.45rem] text-muted-foreground">{holding.shares} aandelen</span>
                    <span className={`text-[0.45rem] font-bold ${(price - holding.avgBuyPrice) >= 0 ? 'text-emerald' : 'text-blood'}`}>
                      {((price - holding.avgBuyPrice) * holding.shares) >= 0 ? '+' : ''}
                      €{((price - holding.avgBuyPrice) * holding.shares).toLocaleString()}
                    </span>
                  </div>
                )}
              </button>

              {/* Expanded trade panel */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="game-card mt-1 border-gold/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[0.5rem] text-muted-foreground">Aantal:</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setShares(Math.max(1, shares - 1))} className="w-5 h-5 rounded bg-muted flex items-center justify-center text-foreground"><Minus size={10} /></button>
                          <span className="text-xs font-bold w-8 text-center">{shares}</span>
                          <button onClick={() => setShares(shares + 1)} className="w-5 h-5 rounded bg-muted flex items-center justify-center text-foreground"><Plus size={10} /></button>
                          <button onClick={() => setShares(Math.max(1, Math.floor(state.money / price)))} className="text-[0.4rem] text-gold font-bold ml-1">MAX</button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <GameButton variant="gold" size="sm" fullWidth
                          disabled={state.money < price * shares}
                          icon={<DollarSign size={10} />}
                          onClick={() => {
                            dispatch({ type: 'BUY_STOCK', stockId: stock.id, shares });
                            showToast(`${shares}x ${stock.name} gekocht!`);
                          }}>
                          KOOP €{(price * shares).toLocaleString()}
                        </GameButton>
                        <GameButton variant="blood" size="sm" fullWidth
                          disabled={!holding || holding.shares < shares}
                          icon={<TrendingDown size={10} />}
                          onClick={() => {
                            dispatch({ type: 'SELL_STOCK', stockId: stock.id, shares });
                            showToast(`${shares}x ${stock.name} verkocht!`);
                          }}>
                          VERKOOP
                        </GameButton>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StockSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 200;
  const h = 24;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((val - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full mt-1" style={{ maxHeight: 28 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      <circle
        cx={(data.length - 1) / (data.length - 1) * w}
        cy={h - ((data[data.length - 1] - min) / range) * (h - 4) - 2}
        r="2"
        fill={color}
      />
    </svg>
  );
}
