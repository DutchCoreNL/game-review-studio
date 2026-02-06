import { useGame } from '@/contexts/GameContext';
import { GOODS, GEAR, DISTRICTS } from '@/game/constants';
import { GoodId } from '@/game/types';
import { getPlayerStat } from '@/game/engine';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

export function MarketView() {
  const { state, tradeMode, setTradeMode, dispatch, showToast } = useGame();

  const invCount = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
  const totalCharm = getPlayerStat(state, 'charm');
  const charmBonus = Math.floor(((totalCharm * 0.02) + (state.rep / 5000)) * 100);
  const prices = state.prices[state.loc] || {};

  const handleTrade = (gid: GoodId) => {
    const invCount = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
    if (tradeMode === 'buy' && invCount >= state.maxInv) {
      return showToast("Kofferbak vol.", true);
    }
    const prevMoney = state.money;
    dispatch({ type: 'TRADE', gid, mode: tradeMode });
    if (tradeMode === 'buy') {
      showToast(`${GOODS.find(g => g.id === gid)?.name} gekocht!`);
    } else {
      if ((state.inventory[gid] || 0) <= 0) {
        return showToast("Niet op voorraad.", true);
      }
      showToast(`${GOODS.find(g => g.id === gid)?.name} verkocht!`);
    }
  };

  return (
    <div>
      <SectionHeader title={`Lokale Markt: ${DISTRICTS[state.loc].name}`} />

      {state.heat > 50 && (
        <div className="text-blood text-xs font-bold bg-[hsl(var(--blood)/0.1)] p-2 rounded mb-3 border border-blood/20">
          ⚠️ HIGH HEAT ({'>'}50%): Markt rekent 20% risico toeslag!
        </div>
      )}

      <div className="flex justify-between text-[0.65rem] text-muted-foreground mb-3">
        <span>BAGAGE: <span className="text-foreground font-bold">{invCount}</span> / {state.maxInv}
          {invCount >= state.maxInv && <span className="text-blood font-bold ml-1">(VOL)</span>}
        </span>
        <span>MARGE: <span className="text-gold font-semibold">{charmBonus}%</span></span>
      </div>

      {/* Trade Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTradeMode('buy')}
          className={`flex-1 py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-all ${
            tradeMode === 'buy' ? 'bg-gold text-secondary-foreground' : 'bg-muted text-muted-foreground border border-border'
          }`}
        >
          INKOOP
        </button>
        <button
          onClick={() => setTradeMode('sell')}
          className={`flex-1 py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-all ${
            tradeMode === 'sell' ? 'bg-gold text-secondary-foreground' : 'bg-muted text-muted-foreground border border-border'
          }`}
        >
          VERKOOP
        </button>
      </div>

      {/* Goods List */}
      <div className="space-y-2 mb-6">
        {GOODS.map(g => {
          const basePrice = prices[g.id] || 0;
          const trend = state.priceTrends[g.id] === 'up';
          const demand = state.districtDemands[state.loc] === g.id;
          const owned = state.inventory[g.id] || 0;

          let displayPrice = basePrice;
          let disabled = false;
          let profitInfo = '';

          if (tradeMode === 'sell') {
            const chBonus = (totalCharm * 0.02) + (state.rep / 5000);
            displayPrice = Math.floor(basePrice * 0.85 * (1 + chBonus));
            if (owned <= 0) disabled = true;
            const avgCost = state.inventoryCosts[g.id] || 0;
            const profit = displayPrice - avgCost;
            if (owned > 0) {
              profitInfo = `${profit >= 0 ? '+' : ''}€${Math.floor(profit)}`;
            }
          } else {
            if (g.faction && (state.familyRel[g.faction] || 0) > 50) {
              displayPrice = Math.floor(displayPrice * 0.7);
            }
            if (state.heat > 50) displayPrice = Math.floor(displayPrice * 1.2);
            if (invCount >= state.maxInv) disabled = true;
          }

          return (
            <motion.div
              key={g.id}
              className="game-card flex items-center gap-3"
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-gold text-sm">
                <ArrowRightLeft size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-foreground">{g.name}</span>
                  {trend ? (
                    <span className="text-blood text-[0.6rem] flex items-center"><TrendingUp size={10} />↑</span>
                  ) : (
                    <span className="text-emerald text-[0.6rem] flex items-center"><TrendingDown size={10} />↓</span>
                  )}
                  {demand && (
                    <span className="text-[0.5rem] text-gold border border-gold px-1 rounded uppercase font-bold">VRAAG</span>
                  )}
                </div>
                <div className="text-[0.65rem] text-muted-foreground">
                  {tradeMode === 'buy' ? 'Inkoop' : 'Verkoop'}: €{displayPrice} | Bezit: {owned}
                  {profitInfo && (
                    <span className={`ml-1 font-bold ${profitInfo.startsWith('+') ? 'text-emerald' : 'text-blood'}`}>
                      ({profitInfo})
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleTrade(g.id)}
                disabled={disabled}
                className={`px-3 py-1.5 rounded text-[0.65rem] font-bold uppercase transition-all ${
                  disabled
                    ? 'bg-muted text-muted-foreground opacity-30'
                    : 'bg-[hsl(var(--gold)/0.1)] border border-gold text-gold hover:bg-[hsl(var(--gold)/0.2)]'
                }`}
              >
                {tradeMode === 'buy' ? 'KOOP' : 'VERKOOP'}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Wash Money */}
      <SectionHeader title="Witwas Operaties" />
      <div className="game-card border-l-[3px] border-l-emerald mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold text-sm">Geld Witwassen</h4>
            <p className="text-[0.65rem] text-muted-foreground">Zet zwart geld om in schoon geld (15% fee)</p>
          </div>
          <button
            onClick={() => {
              dispatch({ type: 'WASH_MONEY' });
              showToast('Geld witgewassen');
            }}
            className="px-3 py-1.5 rounded text-[0.65rem] font-bold bg-[hsl(var(--gold)/0.1)] border border-gold text-gold"
          >
            WITWAS
          </button>
        </div>
      </div>

      {/* Gear Shop */}
      <SectionHeader title="Zwarte Markt (Gear)" />
      <div className="space-y-2">
        {GEAR.filter(g => {
          if (state.ownedGear.includes(g.id)) return false;
          if (g.reqRep) {
            const currentRep = state.familyRel[g.reqRep.f] || 0;
            if (currentRep < g.reqRep.val) return false;
          }
          return true;
        }).map(g => {
          let price = g.cost;
          if (state.heat > 50) price = Math.floor(price * 1.2);
          return (
            <div key={g.id} className="game-card flex justify-between items-center">
              <div>
                <h4 className="font-bold text-xs">{g.name}</h4>
                <p className="text-[0.6rem] text-muted-foreground">{g.desc}</p>
              </div>
              <button
                onClick={() => {
                  dispatch({ type: 'BUY_GEAR', id: g.id });
                  showToast(`${g.name} gekocht!`);
                }}
                className="px-3 py-1.5 rounded text-[0.65rem] font-bold bg-[hsl(var(--gold)/0.1)] border border-gold text-gold whitespace-nowrap"
              >
                €{price.toLocaleString()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3 pb-1 border-b border-border">
      <span className="text-gold text-[0.65rem] uppercase tracking-widest font-bold">{title}</span>
    </div>
  );
}
