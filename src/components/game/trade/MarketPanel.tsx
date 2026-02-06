import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, GOODS, GOOD_CATEGORIES } from '@/game/constants';
import { GoodId, TradeMode } from '@/game/types';
import { getPlayerStat, getBestTradeRoute } from '@/game/engine';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { StatBar } from '../ui/StatBar';
import { PriceSparkline } from './PriceSparkline';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRightLeft, Pipette, Shield, Cpu, Gem, Pill, Lightbulb, ArrowRight } from 'lucide-react';
import { useState } from 'react';

const QUANTITIES = [1, 5, 10, 0];
const QUANTITY_LABELS = ['1x', '5x', '10x', 'MAX'];

const GOOD_ICONS: Record<string, React.ReactNode> = {
  drugs: <Pipette size={14} />,
  weapons: <Shield size={14} />,
  tech: <Cpu size={14} />,
  luxury: <Gem size={14} />,
  meds: <Pill size={14} />,
};

export function MarketPanel() {
  const { state, tradeMode, setTradeMode, dispatch, showToast } = useGame();
  const [quantity, setQuantity] = useState(1);

  const invCount = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
  const totalCharm = getPlayerStat(state, 'charm');
  const charmBonus = Math.floor(((totalCharm * 0.02) + (state.rep / 5000)) * 100);
  const prices = state.prices[state.loc] || {};
  const district = DISTRICTS[state.loc];
  const route = getBestTradeRoute(state);

  const handleTrade = (gid: GoodId) => {
    const owned = state.inventory[gid] || 0;
    const actualQty = quantity === 0
      ? (tradeMode === 'buy' ? state.maxInv - invCount : owned)
      : quantity;

    if (actualQty <= 0) {
      return showToast(tradeMode === 'buy' ? "Kofferbak vol." : "Niet op voorraad.", true);
    }

    dispatch({ type: 'TRADE', gid, mode: tradeMode, quantity: actualQty });
    const good = GOODS.find(g => g.id === gid);
    showToast(`${good?.name} ${tradeMode === 'buy' ? 'gekocht' : 'verkocht'}!`);
  };

  return (
    <>
      <SectionHeader title={district.name} icon={<ArrowRightLeft size={12} />} />

      {state.heat > 50 && (
        <div className="text-blood text-xs font-bold bg-blood/10 p-2 rounded mb-3 border border-blood/20">
          ⚠️ HIGH HEAT: +20% risico toeslag op inkoop!
        </div>
      )}

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

      {/* Goods List */}
      <div className="space-y-2.5">
        {GOODS.map(g => {
          const cat = GOOD_CATEGORIES[g.id];
          const basePrice = prices[g.id] || 0;
          const trend = state.priceTrends[g.id] === 'up';
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
            if (state.heat > 50) displayPrice = Math.floor(displayPrice * 1.2);
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
                <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 ${cat.bgColor}`}>
                  <span className={cat.color}>{GOOD_ICONS[g.id]}</span>
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
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-[0.6rem] text-muted-foreground">
                      <span className="text-foreground font-semibold">€{displayPrice}</span>/stuk
                      <span className="mx-1">·</span>
                      Bezit: <span className="font-semibold">{owned}</span>
                    </div>
                    {sparkData.length >= 2 && <PriceSparkline data={[...sparkData, basePrice]} />}
                  </div>

                  {/* District modifier */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[0.5rem] font-semibold ${distMod < 0.9 ? 'text-emerald' : distMod > 1.3 ? 'text-blood' : 'text-muted-foreground'}`}>
                      {distMod < 0.9 ? '↓ Goedkoop hier' : distMod > 1.3 ? '↑ Duur hier' : '— Normaal'}
                    </span>
                    {profitInfo && (
                      <span className={`text-[0.5rem] font-bold ${profitPositive ? 'text-emerald' : 'text-blood'}`}>
                        {profitInfo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div className="flex flex-col items-end gap-1">
                  <GameButton
                    variant={tradeMode === 'sell' ? 'blood' : 'gold'}
                    size="sm"
                    disabled={disabled}
                    onClick={() => handleTrade(g.id)}
                  >
                    {tradeMode === 'buy' ? 'KOOP' : 'SELL'}
                    {effectiveQty > 1 && !disabled && (
                      <span className="text-[0.45rem] opacity-70 ml-0.5">x{Math.min(effectiveQty, tradeMode === 'buy' ? Math.floor(state.money / displayPrice) : owned)}</span>
                    )}
                  </GameButton>
                  {effectiveQty > 1 && totalCost > 0 && (
                    <span className="text-[0.45rem] text-muted-foreground">
                      €{totalCost.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
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
          <div className="flex items-center gap-1.5 mb-1">
            <Lightbulb size={12} className="text-gold" />
            <span className="text-[0.6rem] font-bold text-gold uppercase tracking-wider">Beste Route</span>
          </div>
          <div className="flex items-center gap-1.5 text-[0.6rem]">
            <span className="text-muted-foreground">Koop</span>
            <span className="font-bold text-foreground">{GOODS.find(g => g.id === route.good)?.name}</span>
            <span className="text-muted-foreground">in</span>
            <span className="font-semibold text-foreground">{DISTRICTS[route.buyDistrict]?.name}</span>
            <span className="text-emerald font-semibold">(€{route.buyPrice})</span>
            <ArrowRight size={10} className="text-gold" />
            <span className="font-semibold text-foreground">{DISTRICTS[route.sellDistrict]?.name}</span>
            <span className="text-blood font-semibold">(€{route.sellPrice})</span>
          </div>
          <div className="text-[0.5rem] text-gold font-bold mt-1">
            Winst: +€{route.profit}/stuk
          </div>
        </motion.div>
      )}
    </>
  );
}
