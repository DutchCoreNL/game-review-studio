import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, GOODS, GEAR } from '@/game/constants';
import { GoodId } from '@/game/types';
import { getPlayerStat } from '@/game/engine';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRightLeft, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const QUANTITIES = [1, 5, 10, 0];
const QUANTITY_LABELS = ['1x', '5x', '10x', 'MAX'];

type TradeSubTab = 'market' | 'gear';

export function TradeView() {
  const { state, tradeMode, setTradeMode, dispatch, showToast } = useGame();
  const [quantity, setQuantity] = useState(1);
  const [subTab, setSubTab] = useState<TradeSubTab>('market');

  const invCount = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
  const totalCharm = getPlayerStat(state, 'charm');
  const charmBonus = Math.floor(((totalCharm * 0.02) + (state.rep / 5000)) * 100);
  const prices = state.prices[state.loc] || {};

  const handleTrade = (gid: GoodId) => {
    const actualQty = quantity === 0
      ? (tradeMode === 'buy' ? state.maxInv - invCount : (state.inventory[gid] || 0))
      : quantity;

    if (actualQty <= 0) {
      return showToast(tradeMode === 'buy' ? "Kofferbak vol." : "Niet op voorraad.", true);
    }

    dispatch({ type: 'TRADE', gid, mode: tradeMode, quantity: actualQty });
    const good = GOODS.find(g => g.id === gid);
    showToast(`${good?.name} ${tradeMode === 'buy' ? 'gekocht' : 'verkocht'}!`);
  };

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1.5 mb-4 mt-1">
        <button
          onClick={() => setSubTab('market')}
          className={`flex-1 py-2 rounded text-[0.6rem] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
            subTab === 'market' ? 'bg-gold/15 border border-gold text-gold' : 'bg-muted border border-border text-muted-foreground'
          }`}
        >
          <ShoppingBag size={12} /> MARKT
        </button>
        <button
          onClick={() => setSubTab('gear')}
          className={`flex-1 py-2 rounded text-[0.6rem] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
            subTab === 'gear' ? 'bg-gold/15 border border-gold text-gold' : 'bg-muted border border-border text-muted-foreground'
          }`}
        >
          <ShieldCheck size={12} /> ZWARTE MARKT
        </button>
      </div>

      {subTab === 'market' ? (
        <MarketPanel
          state={state}
          tradeMode={tradeMode}
          setTradeMode={setTradeMode}
          quantity={quantity}
          setQuantity={setQuantity}
          invCount={invCount}
          totalCharm={totalCharm}
          charmBonus={charmBonus}
          prices={prices}
          handleTrade={handleTrade}
        />
      ) : (
        <GearPanel />
      )}
    </div>
  );
}

function MarketPanel({ state, tradeMode, setTradeMode, quantity, setQuantity, invCount, totalCharm, charmBonus, prices, handleTrade }: any) {
  return (
    <>
      <SectionHeader title={`${DISTRICTS[state.loc].name}`} icon={<ArrowRightLeft size={12} />} />

      {state.heat > 50 && (
        <div className="text-blood text-xs font-bold bg-blood/10 p-2 rounded mb-3 border border-blood/20">
          ⚠️ HIGH HEAT: +20% risico toeslag!
        </div>
      )}

      <div className="flex justify-between text-[0.6rem] text-muted-foreground mb-3">
        <span>BAGAGE: <span className="text-foreground font-bold">{invCount}</span>/{state.maxInv}
          {invCount >= state.maxInv && <span className="text-blood font-bold ml-1">(VOL)</span>}
        </span>
        <span>MARGE: <span className="text-gold font-semibold">{charmBonus}%</span></span>
      </div>

      {/* Trade Mode Toggle */}
      <div className="flex gap-2 mb-3">
        <button onClick={() => setTradeMode('buy')}
          className={`flex-1 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all ${
            tradeMode === 'buy' ? 'bg-gold text-secondary-foreground' : 'bg-muted text-muted-foreground border border-border'
          }`}>INKOOP</button>
        <button onClick={() => setTradeMode('sell')}
          className={`flex-1 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all ${
            tradeMode === 'sell' ? 'bg-gold text-secondary-foreground' : 'bg-muted text-muted-foreground border border-border'
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
      <div className="space-y-2">
        {GOODS.map(g => {
          const basePrice = prices[g.id] || 0;
          const trend = state.priceTrends[g.id] === 'up';
          const demand = state.districtDemands[state.loc] === g.id;
          const owned = state.inventory[g.id] || 0;
          const factionColor = g.faction === 'cartel' ? 'border-l-blood' : g.faction === 'syndicate' ? 'border-l-ice' : g.faction === 'bikers' ? 'border-l-gold' : 'border-l-border';

          let displayPrice = basePrice;
          let disabled = false;
          let profitInfo = '';

          if (tradeMode === 'sell') {
            const chBonus = (totalCharm * 0.02) + (state.rep / 5000);
            displayPrice = Math.floor(basePrice * 0.85 * (1 + chBonus));
            if (owned <= 0) disabled = true;
            const avgCost = state.inventoryCosts[g.id] || 0;
            const profit = displayPrice - avgCost;
            if (owned > 0) profitInfo = `${profit >= 0 ? '+' : ''}€${Math.floor(profit)}`;
          } else {
            if (g.faction && (state.familyRel[g.faction] || 0) > 50) displayPrice = Math.floor(displayPrice * 0.7);
            if (state.heat > 50) displayPrice = Math.floor(displayPrice * 1.2);
            if (invCount >= state.maxInv) disabled = true;
          }

          const effectiveQty = quantity === 0
            ? (tradeMode === 'buy' ? state.maxInv - invCount : owned)
            : quantity;

          return (
            <motion.div key={g.id} className={`game-card flex items-center gap-3 border-l-[3px] ${factionColor}`} whileTap={{ scale: 0.98 }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-foreground">{g.name}</span>
                  {trend ? (
                    <span className="text-blood text-[0.55rem] flex items-center"><TrendingUp size={9} /></span>
                  ) : (
                    <span className="text-emerald text-[0.55rem] flex items-center"><TrendingDown size={9} /></span>
                  )}
                  {demand && <GameBadge variant="gold" size="xs">VRAAG</GameBadge>}
                </div>
                <div className="text-[0.6rem] text-muted-foreground">
                  €{displayPrice}/stuk | Bezit: {owned}
                  {profitInfo && (
                    <span className={`ml-1 font-bold ${profitInfo.startsWith('+') ? 'text-emerald' : 'text-blood'}`}>({profitInfo})</span>
                  )}
                </div>
              </div>
              <GameButton variant="gold" size="sm" disabled={disabled} onClick={() => handleTrade(g.id)}>
                {tradeMode === 'buy' ? 'KOOP' : 'VERKOOP'}
                {effectiveQty > 1 && !disabled && (
                  <span className="text-[0.5rem] opacity-70 ml-0.5">x{effectiveQty}</span>
                )}
              </GameButton>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

function GearPanel() {
  const { state, dispatch, showToast } = useGame();

  return (
    <>
      <SectionHeader title="Zwarte Markt Gear" icon={<ShieldCheck size={12} />} />
      <p className="text-[0.6rem] text-muted-foreground mb-3">Uitrusting voor de Boss. Equip via je Profiel.</p>
      <div className="space-y-2">
        {GEAR.map(item => {
          const owned = state.ownedGear.includes(item.id);
          const canBuy = !owned && state.money >= item.cost;
          const reqMet = !item.reqRep || (state.familyRel[item.reqRep.f] || 0) >= item.reqRep.val;

          return (
            <div key={item.id} className="game-card">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-xs">{item.name}</h4>
                    <GameBadge variant="muted" size="xs">{item.type}</GameBadge>
                  </div>
                  <p className="text-[0.5rem] text-muted-foreground">{item.desc}</p>
                  <div className="flex gap-2 mt-1">
                    {Object.entries(item.stats).map(([stat, val]) => (
                      <span key={stat} className="text-[0.5rem] text-gold font-semibold">+{val} {stat}</span>
                    ))}
                  </div>
                  {item.reqRep && !reqMet && (
                    <p className="text-[0.45rem] text-blood mt-0.5">Vereist: {item.reqRep.f} relatie {item.reqRep.val}+</p>
                  )}
                </div>
                <GameButton
                  variant={owned ? 'muted' : 'gold'}
                  size="sm"
                  disabled={owned || !canBuy || !reqMet}
                  onClick={() => { dispatch({ type: 'BUY_GEAR', id: item.id }); showToast(`${item.name} gekocht!`); }}
                >
                  {owned ? 'BEZIT' : `€${item.cost.toLocaleString()}`}
                </GameButton>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
