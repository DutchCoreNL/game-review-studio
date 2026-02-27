import { ShoppingBag, Droplets, ShieldCheck, BarChart3, Gavel, TrendingUp, ScrollText, VolumeX } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, GOODS } from '@/game/constants';
import { getPlayerStat } from '@/game/engine';
import { GoodId, DistrictId } from '@/game/types';
import { MarketPanel } from './trade/MarketPanel';
import { LaunderingPanel } from './trade/LaunderingPanel';
import { GearPanel } from './trade/GearPanel';
import { MarketAnalysisPanel } from './trade/MarketAnalysisPanel';
import { AuctionPanel } from './trade/AuctionPanel';
import { StockMarketPanel } from './trade/StockMarketPanel';
import { TradeLogPanel } from './trade/TradeLogPanel';
import { SubTabBar, SubTab } from './ui/SubTabBar';
import { ViewWrapper } from './ui/ViewWrapper';
import { useMuteStatus } from '@/hooks/useMuteStatus';
import tradeBg from '@/assets/trade-bg.jpg';

type TradeSubTab = 'market' | 'analysis' | 'auction' | 'launder' | 'gear' | 'stocks' | 'log';

export function TradeView() {
  const [subTab, setSubTab] = useState<TradeSubTab>('market');
  const { state } = useGame();
  const { isMuted, reason, expiresAt } = useMuteStatus();

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

  const tabs: SubTab<TradeSubTab>[] = [
    { id: 'market', label: 'MARKT', icon: <ShoppingBag size={11} /> },
    { id: 'analysis', label: 'ANALYSE', icon: <BarChart3 size={11} />, badge: hasProfitableRoute },
    { id: 'auction', label: 'VEILING', icon: <Gavel size={11} />, badge: (state.auctionItems?.length || 0) },
    { id: 'stocks', label: 'BEURS', icon: <TrendingUp size={11} />, badge: !!state.pendingInsiderTip },
    { id: 'launder', label: 'WITWAS', icon: <Droplets size={11} /> },
    { id: 'gear', label: 'GEAR', icon: <ShieldCheck size={11} /> },
    { id: 'log', label: 'LOG', icon: <ScrollText size={11} />, badge: (state.tradeLog?.length || 0) },
  ];

  return (
    <ViewWrapper bg={tradeBg}>
      {isMuted && (
        <div className="bg-ice/10 border border-ice/30 rounded p-3 mb-3 flex items-start gap-2">
          <VolumeX size={14} className="text-ice shrink-0 mt-0.5" />
          <div>
            <p className="text-[0.6rem] font-bold text-ice">🔇 Je bent gemute — Handel is geblokkeerd</p>
            {reason && <p className="text-[0.5rem] text-muted-foreground mt-0.5">"{reason}"</p>}
            {expiresAt && <p className="text-[0.45rem] text-muted-foreground mt-0.5">Verloopt: {new Date(expiresAt).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>}
          </div>
        </div>
      )}

      {isMuted ? (
        <div className="text-center py-12 text-muted-foreground text-xs">
          Handel is tijdelijk uitgeschakeld vanwege een mute-sanctie.
        </div>
      ) : (
        <>
          <SubTabBar tabs={tabs} active={subTab} onChange={(id) => setSubTab(id as TradeSubTab)} />
          {subTab === 'market' && <MarketPanel />}
          {subTab === 'analysis' && <MarketAnalysisPanel />}
          {subTab === 'auction' && <AuctionPanel />}
          {subTab === 'stocks' && <StockMarketPanel />}
          {subTab === 'launder' && <LaunderingPanel />}
          {subTab === 'gear' && <GearPanel />}
          {subTab === 'log' && <TradeLogPanel />}
        </>
      )}
    </ViewWrapper>
  );
}
