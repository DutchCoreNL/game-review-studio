import { ShoppingBag, Droplets, ShieldCheck, BarChart3 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, GOODS } from '@/game/constants';
import { getPlayerStat } from '@/game/engine';
import { GoodId, DistrictId } from '@/game/types';
import { MarketPanel } from './trade/MarketPanel';
import { LaunderingPanel } from './trade/LaunderingPanel';
import { GearPanel } from './trade/GearPanel';
import { MarketAnalysisPanel } from './trade/MarketAnalysisPanel';
import tradeBg from '@/assets/trade-bg.jpg';

type TradeSubTab = 'market' | 'analysis' | 'launder' | 'gear';

export function TradeView() {
  const [subTab, setSubTab] = useState<TradeSubTab>('market');
  const { state } = useGame();

  const hasProfitableRoute = useMemo(() => {
    const totalCharm = getPlayerStat(state, 'charm');
    const charmBonus = (totalCharm * 0.02) + (state.rep / 5000);
    const distIds = Object.keys(DISTRICTS) as DistrictId[];
    return GOODS.some(g => {
      let cheapest = Infinity, expensive = 0;
      distIds.forEach(did => {
        const p = state.prices[did]?.[g.id] || 0;
        if (p < cheapest) cheapest = p;
        if (p > expensive) expensive = p;
      });
      const sellPrice = Math.floor(expensive * 0.85 * (1 + charmBonus));
      return (sellPrice - cheapest) > 500;
    });
  }, [state.prices, state.player, state.rep]);

  return (
    <div className="relative min-h-[70vh] -mx-3 -mt-2 px-3 pt-2">
      <img src={tradeBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30 pointer-events-none" />
      <div className="relative z-10">
      {/* Sub-tabs */}
      <div className="flex gap-1.5 mb-4 mt-1">
        {([
          { id: 'market' as TradeSubTab, label: 'MARKT', icon: <ShoppingBag size={11} />, badge: false },
          { id: 'analysis' as TradeSubTab, label: 'ANALYSE', icon: <BarChart3 size={11} />, badge: hasProfitableRoute },
          { id: 'launder' as TradeSubTab, label: 'WITWAS', icon: <Droplets size={11} />, badge: false },
          { id: 'gear' as TradeSubTab, label: 'GEAR', icon: <ShieldCheck size={11} />, badge: false },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`relative flex-1 py-2 rounded text-[0.55rem] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
              subTab === tab.id
                ? 'bg-gold/15 border border-gold text-gold'
                : 'bg-muted border border-border text-muted-foreground'
            }`}
          >
            {tab.icon} {tab.label}
            {tab.badge && subTab !== tab.id && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gold rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {subTab === 'market' && <MarketPanel />}
      {subTab === 'analysis' && <MarketAnalysisPanel />}
      {subTab === 'launder' && <LaunderingPanel />}
      {subTab === 'gear' && <GearPanel />}
      </div>
    </div>
  );
}
