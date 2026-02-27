import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, GOODS, GOOD_CATEGORIES, GOOD_SPOILAGE } from '@/game/constants';
import { playCoinSound, playPurchaseSound, playNegativeSound } from '@/game/sounds';
import { GoodId, TradeMode } from '@/game/types';
import { getPlayerStat, getBestTradeRoute } from '@/game/engine';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { StatBar } from '../ui/StatBar';
import { PriceSparkline } from './PriceSparkline';
import { TradeRewardFloater } from '../animations/RewardPopup';
import { ConfirmDialog } from '../ConfirmDialog';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRightLeft, Pipette, Shield, Cpu, Gem, Pill, Lightbulb, ArrowRight, Leaf, Info, ChevronDown, PackageOpen, Wifi, RefreshCw, AlertTriangle, Bell } from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { GOOD_IMAGES } from '@/assets/items';
import { AnimatePresence } from 'framer-motion';
import { gameApi } from '@/lib/gameApi';
import { supabase } from '@/integrations/supabase/client';

const QUANTITIES = [1, 5, 10, 0];
const QUANTITY_LABELS = ['1x', '5x', '10x', 'MAX'];

const GOOD_ICONS: Record<string, React.ReactNode> = {
  drugs: <Pipette size={14} />,
  weapons: <Shield size={14} />,
  tech: <Cpu size={14} />,
  luxury: <Gem size={14} />,
  meds: <Pill size={14} />,
};

/** Calculate heat surcharge info from state */
function getHeatSurcharge(state: { ownedVehicles: any[]; activeVehicle: string | null; personalHeat?: number }) {
  const activeVehicle = state.ownedVehicles.find(v => v.id === state.activeVehicle);
  const vHeat = activeVehicle?.vehicleHeat ?? 0;
  const pHeat = state.personalHeat ?? 0;
  const avgHeat = Math.round((vHeat + pHeat) / 2);
  const surchargePercent = avgHeat > 50 ? Math.min(40, Math.floor((avgHeat - 50) * 0.8)) : 0;
  const surchargeMultiplier = avgHeat > 50 ? 1 + Math.min(0.4, (avgHeat - 50) * 0.008) : 1;
  return { vHeat, pHeat, avgHeat, surchargePercent, surchargeMultiplier };
}

interface ServerMarketData {
  price: number;
  trend: string;
  buyVol: number;
  sellVol: number;
}

export function MarketPanel() {
  const { state, tradeMode, setTradeMode, dispatch, showToast } = useGame();
  const [quantity, setQuantity] = useState(1);
  const [lastTrade, setLastTrade] = useState<{ gid: string; amount: number; mode: TradeMode } | null>(null);
  const [pendingTrade, setPendingTrade] = useState<{ gid: GoodId; qty: number; cost: number } | null>(null);
  const [expandedGood, setExpandedGood] = useState<string | null>(null);
  const [pendingSellAll, setPendingSellAll] = useState<{ totalGains: number } | null>(null);
  const [serverPrices, setServerPrices] = useState<Record<string, Record<string, ServerMarketData>> | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState<{ gid: string; name: string; pct: number; direction: 'up' | 'down' }[]>([]);
  const prevPricesRef = useRef<Record<string, Record<string, number>>>({});

  // Fetch server prices on mount and when district changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPriceLoading(true);
      const res = await gameApi.getMarketPrices();
      if (!cancelled && res.success && res.data?.prices) {
        setServerPrices(res.data.prices as any);
      }
      setPriceLoading(false);
    })();
    return () => { cancelled = true; };
  }, [state.loc]);

  // Store initial prices for alert comparison
  useEffect(() => {
    if (serverPrices) {
      // Only store if we don't have previous prices yet for a district
      Object.entries(serverPrices).forEach(([distId, goods]) => {
        if (!prevPricesRef.current[distId]) {
          prevPricesRef.current[distId] = {};
        }
        Object.entries(goods).forEach(([gid, data]) => {
          if (prevPricesRef.current[distId][gid] === undefined) {
            prevPricesRef.current[distId][gid] = (data as ServerMarketData).price;
          }
        });
      });
    }
  }, [serverPrices]);

  // Realtime price updates with alert detection
  useEffect(() => {
    const channel = supabase
      .channel('market-prices-panel')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'market_prices',
      }, (payload) => {
        const row = payload.new as any;

        // Check for >20% price change in current district
        if (row.district_id === state.loc) {
          const prevPrice = prevPricesRef.current[row.district_id]?.[row.good_id];
          if (prevPrice && prevPrice > 0) {
            const pctChange = ((row.current_price - prevPrice) / prevPrice) * 100;
            if (Math.abs(pctChange) >= 20) {
              const good = GOODS.find(g => g.id === row.good_id);
              if (good) {
                const alert = {
                  gid: row.good_id,
                  name: good.name,
                  pct: Math.round(pctChange),
                  direction: pctChange > 0 ? 'up' as const : 'down' as const,
                };
                setPriceAlerts(prev => {
                  // Replace existing alert for same good or add new
                  const filtered = prev.filter(a => a.gid !== row.good_id);
                  return [...filtered, alert].slice(-5); // max 5 alerts
                });
                // Auto-dismiss after 15s
                setTimeout(() => {
                  setPriceAlerts(prev => prev.filter(a => a.gid !== row.good_id));
                }, 15000);
              }
            }
          }
        }

        // Update stored previous price
        if (!prevPricesRef.current[row.district_id]) prevPricesRef.current[row.district_id] = {};
        prevPricesRef.current[row.district_id][row.good_id] = row.current_price;

        setServerPrices(prev => {
          if (!prev) return prev;
          const updated = { ...prev };
          if (!updated[row.district_id]) updated[row.district_id] = {};
          updated[row.district_id] = {
            ...updated[row.district_id],
            [row.good_id]: {
              price: row.current_price,
              trend: row.price_trend,
              buyVol: row.buy_volume,
              sellVol: row.sell_volume,
            },
          };
          return updated;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [state.loc]);

  // Clear alerts on district change
  useEffect(() => {
    setPriceAlerts([]);
  }, [state.loc]);

  const invCount = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
  const totalCharm = getPlayerStat(state, 'charm');
  const charmBonus = Math.floor(((totalCharm * 0.02) + (state.rep / 5000)) * 100);

  // Use server prices if available, fallback to local
  const serverDistPrices = serverPrices?.[state.loc] || {};
  const getPrice = (gid: string): number => {
    return serverDistPrices[gid]?.price || state.prices[state.loc]?.[gid] || 0;
  };
  const getTrend = (gid: string): string => {
    return serverDistPrices[gid]?.trend || state.priceTrends[gid] || 'stable';
  };
  const getVolume = (gid: string): { buy: number; sell: number } | null => {
    const sd = serverDistPrices[gid];
    return sd ? { buy: sd.buyVol, sell: sd.sellVol } : null;
  };
  const isLive = !!serverPrices;

  const district = DISTRICTS[state.loc];
  const route = getBestTradeRoute(state);
  const heat = getHeatSurcharge(state);

  const executeTrade = useCallback((gid: GoodId, actualQty: number) => {
    const owned = state.inventory[gid] || 0;

    if (actualQty <= 0) {
      playNegativeSound();
      return showToast(tradeMode === 'buy' ? "Kofferbak vol." : "Niet op voorraad.", true);
    }

    dispatch({ type: 'TRADE', gid, mode: tradeMode, quantity: actualQty });
    const good = GOODS.find(g => g.id === gid);
    if (tradeMode === 'sell') playCoinSound(); else playPurchaseSound();
    showToast(`${good?.name} ${tradeMode === 'buy' ? 'gekocht' : 'verkocht'}!`);

    // Calculate trade amount for floater
    const basePrice = getPrice(gid);
    const chBonus = (totalCharm * 0.02) + (state.rep / 5000);
    const sellPrice = Math.floor(basePrice * 0.85 * (1 + chBonus));
    const buyPrice = basePrice;
    const tradeAmount = tradeMode === 'sell'
      ? sellPrice * Math.min(actualQty, owned)
      : buyPrice * Math.min(actualQty, Math.floor(state.money / buyPrice));

    setLastTrade({ gid, amount: tradeAmount, mode: tradeMode });
    setTimeout(() => setLastTrade(null), 1200);
  }, [state, tradeMode, dispatch, showToast, serverDistPrices, totalCharm]);

  const handleTrade = useCallback((gid: GoodId) => {
    const owned = state.inventory[gid] || 0;
    const actualQty = quantity === 0
      ? (tradeMode === 'buy' ? state.maxInv - invCount : owned)
      : quantity;

    // Confirm large MAX trades (>€5000)
    if (quantity === 0 && actualQty > 1) {
      const basePrice = getPrice(gid);
      const estimatedCost = tradeMode === 'buy'
        ? basePrice * Math.min(actualQty, Math.floor(state.money / basePrice))
        : Math.floor(basePrice * 0.85) * Math.min(actualQty, owned);

      if (estimatedCost > 5000) {
        setPendingTrade({ gid, qty: actualQty, cost: estimatedCost });
        return;
      }
    }

    executeTrade(gid, actualQty);
  }, [state, quantity, tradeMode, invCount, serverDistPrices, executeTrade]);

  const estimateSellAllGains = useCallback(() => {
    const chBonus = (totalCharm * 0.02) + (state.rep / 5000);
    let total = 0;
    GOODS.forEach(g => {
      const owned = state.inventory[g.id] || 0;
      if (owned > 0) {
        const basePrice = getPrice(g.id);
        const sellPrice = Math.floor(basePrice * 0.85 * (1 + chBonus));
        total += sellPrice * owned;
      }
    });
    return total;
  }, [state, serverDistPrices, totalCharm]);

  const confirmSellAll = useCallback(() => {
    GOODS.forEach(g => {
      const owned = state.inventory[g.id] || 0;
      if (owned > 0) {
        dispatch({ type: 'TRADE', gid: g.id, mode: 'sell', quantity: owned });
      }
    });
    playCoinSound();
    showToast(`Alles verkocht! +€${pendingSellAll?.totalGains.toLocaleString()}`);
    setPendingSellAll(null);
  }, [state, dispatch, showToast, pendingSellAll]);

  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <SectionHeader title={district.name} icon={<ArrowRightLeft size={12} />} />
        <div className="flex items-center gap-1.5 mt-2">
          {priceLoading ? (
            <RefreshCw size={10} className="text-muted-foreground animate-spin" />
          ) : isLive ? (
            <Wifi size={10} className="text-emerald" />
          ) : null}
          <span className="text-[0.45rem] text-muted-foreground uppercase tracking-wider">
            {isLive ? 'LIVE MARKT' : 'LOKAAL'}
          </span>
        </div>
      </div>

      {/* Active market event banner */}
      {state.activeMarketEvent && (
        <div className="text-gold text-xs font-bold bg-gold/10 p-2 rounded mb-3 border border-gold/20">
          {state.activeMarketEvent.name}
          <span className="block text-[0.5rem] font-normal text-gold/70 mt-0.5">
            {state.activeMarketEvent.desc} ({state.activeMarketEvent.daysLeft}d resterend)
          </span>
        </div>
      )}

      {/* Heat surcharge banner */}
      {heat.surchargePercent > 0 && (
        <div className="text-blood text-xs font-bold bg-blood/10 p-2 rounded mb-3 border border-blood/20">
          ⚠️ HEAT TOESLAG: +{heat.surchargePercent}% risico toeslag op inkoop!
          <span className="block text-[0.5rem] font-normal text-blood/70 mt-0.5">
            🚗 Voertuig: {heat.vHeat}% · 🔥 Persoonlijk: {heat.pHeat}% · Gem: {heat.avgHeat}%
          </span>
        </div>
      )}

      {/* Price alert banners */}
      <AnimatePresence>
        {priceAlerts.map(alert => (
          <motion.div
            key={alert.gid}
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className={`flex items-center gap-2 text-xs font-bold p-2 rounded mb-2 border ${
              alert.direction === 'up'
                ? 'bg-blood/10 border-blood/30 text-blood'
                : 'bg-emerald/10 border-emerald/30 text-emerald'
            }`}
          >
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: 2 }}>
              {alert.direction === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            </motion.div>
            <div className="flex-1">
              <span className="font-bold">{alert.name}</span>
              <span className="font-normal opacity-80"> {alert.direction === 'up' ? '+' : ''}{alert.pct}%</span>
              <span className="block text-[0.45rem] font-normal opacity-60">
                {alert.direction === 'up' ? '📈 Prijsstijging — overweeg verkoop!' : '📉 Prijsdaling — koopkans!'}
              </span>
            </div>
            <button onClick={() => setPriceAlerts(prev => prev.filter(a => a.gid !== alert.gid))}
              className="text-[0.5rem] opacity-50 hover:opacity-100">✕</button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Stats strip */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-[0.6rem] text-muted-foreground">
          BAGAGE: <span className="text-foreground font-bold">{invCount}</span>/{state.maxInv}
          {invCount >= state.maxInv && <span className="text-blood font-bold ml-1">(VOL)</span>}
        </div>
        <div className="text-[0.6rem] text-muted-foreground">
          MARGE: <span className="text-gold font-semibold">+{charmBonus}%</span>
        </div>
      </div>

      {/* Inventory bar */}
      <div className="mb-3">
        <StatBar value={invCount} max={state.maxInv} color={invCount >= state.maxInv ? 'blood' : 'gold'} height="sm" />
      </div>

      {/* Trade Mode Toggle */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => setTradeMode('buy')}
          className={`flex-1 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all ${
            tradeMode === 'buy' ? 'bg-gold text-secondary-foreground' : 'bg-muted text-muted-foreground border border-border'
          }`}>INKOOP</button>
        <button onClick={() => setTradeMode('sell')}
          className={`flex-1 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all ${
            tradeMode === 'sell' ? 'bg-blood text-primary-foreground' : 'bg-muted text-muted-foreground border border-border'
          }`}>VERKOOP</button>
      </div>

      {/* Quantity Selector */}
      <div className="flex gap-1.5 mb-4">
        {QUANTITIES.map((q, i) => (
          <button key={q} onClick={() => setQuantity(q)}
            className={`flex-1 py-1.5 rounded text-[0.6rem] font-bold uppercase tracking-wider transition-all ${
              quantity === q ? 'bg-gold/15 border border-gold text-gold' : 'bg-muted text-muted-foreground border border-border'
            }`}>{QUANTITY_LABELS[i]}</button>
        ))}
      </div>

      {/* Sell All Button */}
      {tradeMode === 'sell' && invCount > 0 && (
        <motion.button
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setPendingSellAll({ totalGains: estimateSellAllGains() })}
          className="w-full mb-4 py-2.5 rounded font-bold text-xs uppercase tracking-wider bg-blood/15 border border-blood text-blood hover:bg-blood/25 transition-all flex items-center justify-center gap-2"
        >
          <PackageOpen size={14} />
          VERKOOP ALLES
          <span className="text-[0.5rem] opacity-70 font-normal">(~€{estimateSellAllGains().toLocaleString()})</span>
        </motion.button>
      )}

      {/* Goods List */}
      <div className="space-y-2.5">
        {GOODS.map(g => {
          const cat = GOOD_CATEGORIES[g.id];
          const basePrice = getPrice(g.id);
          const trend = getTrend(g.id) === 'up';
          const volume = getVolume(g.id);
          const demand = state.districtDemands[state.loc] === g.id;
          const owned = state.inventory[g.id] || 0;
          const distMod = district.mods[g.id as GoodId];
          const sparkData = state.priceHistory?.[state.loc]?.[g.id] || [];

          let displayPrice = basePrice;
          let disabled = false;
          let profitInfo = '';
          let profitPositive = false;

          if (tradeMode === 'sell') {
            const chBonus = (totalCharm * 0.02) + (state.rep / 5000);
            displayPrice = Math.floor(basePrice * 0.85 * (1 + chBonus));
            if (owned <= 0) disabled = true;
            const avgCost = state.inventoryCosts[g.id] || 0;
            const profit = displayPrice - avgCost;
            if (owned > 0) {
              profitInfo = `${profit >= 0 ? '+' : ''}€${Math.floor(profit)}/stuk`;
              profitPositive = profit >= 0;
            }
          } else {
            if (g.faction && (state.familyRel[g.faction] || 0) > 50) displayPrice = Math.floor(displayPrice * 0.7);
            if (heat.surchargeMultiplier > 1) {
              displayPrice = Math.floor(displayPrice * heat.surchargeMultiplier);
            }
            if (invCount >= state.maxInv) disabled = true;
          }

          const effectiveQty = quantity === 0
            ? (tradeMode === 'buy' ? state.maxInv - invCount : owned)
            : quantity;
          const totalCost = displayPrice * Math.min(effectiveQty, tradeMode === 'buy' ? Math.floor(state.money / displayPrice) : owned);

          return (
            <motion.div
              key={g.id}
              className={`game-card p-3 ${cat.borderColor} border-l-[3px]`}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded overflow-hidden flex items-center justify-center flex-shrink-0 ${!GOOD_IMAGES[g.id] ? cat.bgColor : ''}`}>
                  {GOOD_IMAGES[g.id] ? (
                    <img src={GOOD_IMAGES[g.id]} alt={g.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className={cat.color}>{GOOD_ICONS[g.id]}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-xs text-foreground">{g.name}</span>
                    {trend ? (
                      <TrendingUp size={10} className="text-blood" />
                    ) : (
                      <TrendingDown size={10} className="text-emerald" />
                    )}
                    {demand && <GameBadge variant="gold" size="xs">VRAAG</GameBadge>}
                    {g.faction && (state.familyRel[g.faction] || 0) > 50 && tradeMode === 'buy' && (
                      <GameBadge variant="emerald" size="xs">-30%</GameBadge>
                    )}
                    {GOOD_SPOILAGE[g.id as GoodId] > 0 && owned > 0 && (
                      <span className="text-[0.45rem] text-blood/70 flex items-center gap-0.5" title="Bederfbaar goed">
                        <Leaf size={8} /> {Math.round(GOOD_SPOILAGE[g.id as GoodId] * 100)}%/nacht
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-[0.6rem] text-muted-foreground">
                      <span className="text-foreground font-semibold">€{displayPrice}</span>/stuk
                      <span className="mx-1">·</span>
                      Bezit: <span className="font-semibold">{owned}</span>
                    </div>
                    {sparkData.length >= 2 && <PriceSparkline data={[...sparkData, basePrice]} />}
                  </div>

                  {/* Volume indicator (server-side) */}
                  {volume && (
                    <div className="text-[0.45rem] text-muted-foreground/70 flex items-center gap-2">
                      <span>📊 Volume: {volume.buy + volume.sell}</span>
                      <span>B:{volume.buy}</span>
                      <span>V:{volume.sell}</span>
                    </div>
                  )}

                  {/* District modifier + info toggle */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[0.5rem] font-semibold ${distMod < 0.9 ? 'text-emerald' : distMod > 1.3 ? 'text-blood' : 'text-muted-foreground'}`}>
                      {distMod < 0.9 ? '↓ Goedkoop hier' : distMod > 1.3 ? '↑ Duur hier' : '— Normaal'}
                    </span>
                    {profitInfo && (
                      <span className={`text-[0.5rem] font-bold ${profitPositive ? 'text-emerald' : 'text-blood'}`}>
                        {profitInfo}
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedGood(expandedGood === g.id ? null : g.id); }}
                      className={`ml-auto text-[0.45rem] flex items-center gap-0.5 transition-colors ${expandedGood === g.id ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Info size={9} />
                      <ChevronDown size={8} className={`transition-transform ${expandedGood === g.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Action */}
                <div className="flex flex-col items-end gap-1 relative">
                  <GameButton
                    variant={tradeMode === 'sell' ? 'blood' : 'gold'}
                    size="sm"
                    disabled={disabled}
                    onClick={() => handleTrade(g.id)}
                  >
                    {tradeMode === 'buy' ? 'KOOP' : 'VERKOOP'}
                    {effectiveQty > 1 && !disabled && (
                      <span className="text-[0.45rem] opacity-70 ml-0.5">x{Math.min(effectiveQty, tradeMode === 'buy' ? Math.floor(state.money / displayPrice) : owned)}</span>
                    )}
                  </GameButton>
                  {effectiveQty > 1 && totalCost > 0 && (
                    <span className="text-[0.45rem] text-muted-foreground">
                      €{totalCost.toLocaleString()}
                    </span>
                  )}
                  <TradeRewardFloater
                    amount={lastTrade?.gid === g.id ? lastTrade.amount : 0}
                    show={lastTrade?.gid === g.id}
                    type={lastTrade?.mode === 'sell' ? 'profit' : 'cost'}
                  />
                </div>
              </div>

              {/* Price Factor Breakdown */}
              <AnimatePresence>
                {expandedGood === g.id && (() => {
                  const pressure = state.marketPressure?.[state.loc]?.[g.id] || 0;
                  const pressureMod = 1 + (pressure * 0.15);
                  const eventEffects = state.activeMarketEvent?.effects || {};
                  const eventMod = (eventEffects as Record<string, number>)[g.id] || 1.0;
                  const hasFactionDiscount = g.faction && (state.familyRel[g.faction] || 0) > 50;
                  const spoilRate = GOOD_SPOILAGE[g.id as GoodId];

                  const factors: { label: string; value: string; color: string }[] = [
                    { label: 'Basisprijs', value: `€${g.base}`, color: 'text-foreground' },
                    { label: `District mod (${district.name})`, value: `×${distMod.toFixed(1)}`, color: distMod < 0.9 ? 'text-emerald' : distMod > 1.3 ? 'text-blood' : 'text-foreground' },
                  ];

                  if (demand) factors.push({ label: 'Hoge vraag', value: '×1.6', color: 'text-gold' });

                  if (Math.abs(pressure) > 0.05) {
                    factors.push({
                      label: `Marktdruk (${pressure > 0 ? 'veel gekocht' : 'veel verkocht'})`,
                      value: `×${pressureMod.toFixed(2)}`,
                      color: pressure > 0 ? 'text-blood' : 'text-emerald',
                    });
                  }

                  if (eventMod !== 1.0) {
                    factors.push({
                      label: `Event: ${state.activeMarketEvent?.name || ''}`,
                      value: `×${eventMod.toFixed(1)}`,
                      color: eventMod > 1 ? 'text-blood' : 'text-emerald',
                    });
                  }

                  if (tradeMode === 'buy') {
                    if (hasFactionDiscount) factors.push({ label: 'Factie korting', value: '×0.7', color: 'text-emerald' });
                    if (heat.surchargeMultiplier > 1) factors.push({ label: `Heat toeslag (+${heat.surchargePercent}%)`, value: `×${heat.surchargeMultiplier.toFixed(2)}`, color: 'text-blood' });
                  } else {
                    factors.push({ label: 'Verkoopmarge', value: '×0.85', color: 'text-muted-foreground' });
                    if (charmBonus > 0) factors.push({ label: `Charisma & Rep bonus`, value: `+${charmBonus}%`, color: 'text-gold' });
                  }

                  if (spoilRate > 0) {
                    const hasStorage = state.villa?.modules.includes('opslagkelder');
                    factors.push({
                      label: `Bederf ${hasStorage ? '(½ met Opslagkelder)' : ''}`,
                      value: `-${Math.round((hasStorage ? spoilRate * 0.5 : spoilRate) * 100)}%/nacht`,
                      color: 'text-blood',
                    });
                  }

                  factors.push({
                    label: 'Eindprijs',
                    value: `€${displayPrice}`,
                    color: 'text-gold',
                  });

                  return (
                    <motion.div
                      key="breakdown"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                        <span className="text-[0.5rem] font-bold text-muted-foreground uppercase tracking-wider">Prijsfactoren</span>
                        {factors.map((f, i) => (
                          <div key={i} className={`flex justify-between text-[0.5rem] ${i === factors.length - 1 ? 'pt-1 border-t border-border/30 font-bold' : ''}`}>
                            <span className="text-muted-foreground">{f.label}</span>
                            <span className={`font-semibold ${f.color}`}>{f.value}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Trade Route Tip */}
      {route && route.profit > 0 && (
        <motion.div
          className="game-card mt-4 p-3 border-l-[3px] border-l-gold bg-gold/5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb size={12} className="text-gold" />
            <span className="text-[0.6rem] font-bold text-gold uppercase tracking-wider">Beste Route</span>
          </div>
          <div className="text-[0.6rem] space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-muted-foreground">Koop</span>
              <span className="font-bold text-foreground">{GOODS.find(g => g.id === route.good)?.name}</span>
              <span className="text-muted-foreground">in</span>
              <span className="font-semibold text-foreground">{DISTRICTS[route.buyDistrict]?.name}</span>
              <span className="text-emerald font-semibold">(€{route.buyPrice})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowRight size={10} className="text-gold" />
              <span className="text-muted-foreground">Verkoop in</span>
              <span className="font-semibold text-foreground">{DISTRICTS[route.sellDistrict]?.name}</span>
              <span className="text-blood font-semibold">(€{route.sellPrice})</span>
            </div>
          </div>
          <div className="text-[0.5rem] text-gold font-bold mt-1.5">
            Winst: +€{route.profit}/stuk
          </div>
        </motion.div>
      )}

      {/* MAX trade confirmation dialog */}
      {pendingTrade && (
        <ConfirmDialog
          open={true}
          title={tradeMode === 'buy' ? 'Grote inkoop bevestigen' : 'Grote verkoop bevestigen'}
          message={`Weet je zeker dat je ${pendingTrade.qty}x wilt ${tradeMode === 'buy' ? 'kopen' : 'verkopen'} voor ~€${pendingTrade.cost.toLocaleString()}?`}
          confirmText={tradeMode === 'buy' ? 'KOPEN' : 'VERKOPEN'}
          variant={tradeMode === 'sell' ? 'danger' : 'warning'}
          onConfirm={() => {
            executeTrade(pendingTrade.gid, pendingTrade.qty);
            setPendingTrade(null);
          }}
          onCancel={() => setPendingTrade(null)}
        />
      )}

      {/* Sell All confirmation dialog */}
      {pendingSellAll && (
        <ConfirmDialog
          open={true}
          title="Alles verkopen"
          message={`Weet je zeker dat je al je goederen wilt verkopen? Geschatte opbrengst: €${pendingSellAll.totalGains.toLocaleString()}`}
          confirmText="VERKOOP ALLES"
          variant="danger"
          onConfirm={confirmSellAll}
          onCancel={() => setPendingSellAll(null)}
        />
      )}
    </>
  );
}
