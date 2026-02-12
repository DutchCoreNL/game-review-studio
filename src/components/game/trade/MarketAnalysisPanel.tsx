import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, GOODS, GOOD_CATEGORIES, GOOD_SPOILAGE } from '@/game/constants';
import { GoodId, DistrictId } from '@/game/types';
import { getPlayerStat } from '@/game/engine';
import { SectionHeader } from '../ui/SectionHeader';
import { GameBadge } from '../ui/GameBadge';
import { PriceSparkline } from './PriceSparkline';
import { PriceHistoryChart } from './PriceHistoryChart';
import { motion } from 'framer-motion';
import { BarChart3, MapPin, TrendingUp, TrendingDown, ArrowRight, Leaf, Navigation } from 'lucide-react';
import { useState } from 'react';

const DISTRICT_IDS = Object.keys(DISTRICTS) as DistrictId[];

export function MarketAnalysisPanel() {
  const { state } = useGame();
  const [selectedGood, setSelectedGood] = useState<GoodId | null>(null);
  const totalCharm = getPlayerStat(state, 'charm');
  const charmBonus = (totalCharm * 0.02) + (state.rep / 5000);

  // Find best buy & sell for each good
  function getBestRoute(gid: GoodId) {
    let cheapest = { dist: '' as DistrictId, price: Infinity };
    let expensive = { dist: '' as DistrictId, price: 0 };

    DISTRICT_IDS.forEach(did => {
      const p = state.prices[did]?.[gid] || 0;
      if (p < cheapest.price) cheapest = { dist: did, price: p };
      if (p > expensive.price) expensive = { dist: did, price: p };
    });

    const sellPrice = Math.floor(expensive.price * 0.85 * (1 + charmBonus));
    const profit = sellPrice - cheapest.price;
    return { cheapest, expensive, sellPrice, profit };
  }

  return (
    <>
      <SectionHeader title="Markt Analyse" icon={<BarChart3 size={12} />} />

      {/* Active market event */}
      {state.activeMarketEvent && (
        <div className="text-gold text-xs font-bold bg-gold/10 p-2 rounded mb-3 border border-gold/20">
          {state.activeMarketEvent.name}
          <span className="block text-[0.5rem] font-normal text-gold/70 mt-0.5">
            {state.activeMarketEvent.desc} ({state.activeMarketEvent.daysLeft}d)
          </span>
        </div>
      )}

      {/* Price Matrix */}
      <div className="overflow-x-auto -mx-1 mb-4">
        <table className="w-full text-[0.55rem]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1.5 px-1 text-muted-foreground font-bold uppercase tracking-wider">Goed</th>
              {DISTRICT_IDS.map(did => (
                <th key={did} className="text-center py-1.5 px-1">
                  <span className={`font-bold uppercase tracking-wider ${state.loc === did ? 'text-gold' : 'text-muted-foreground'}`}>
                    {state.loc === did && <MapPin size={7} className="inline mr-0.5" />}
                    {DISTRICTS[did].name.split(' ')[0]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GOODS.map(g => {
              const cat = GOOD_CATEGORIES[g.id];
              const route = getBestRoute(g.id as GoodId);
              const isSelected = selectedGood === g.id;

              return (
                <tr
                  key={g.id}
                  onClick={() => setSelectedGood(isSelected ? null : g.id as GoodId)}
                  className={`border-b border-border/50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-gold/5' : 'hover:bg-muted/30'
                  }`}
                >
                  <td className="py-1.5 px-1">
                    <div className="flex items-center gap-1">
                      <span className={`font-bold ${cat.color}`}>{g.name}</span>
                      {GOOD_SPOILAGE[g.id as GoodId] > 0 && (
                        <Leaf size={7} className="text-blood/50" />
                      )}
                    </div>
                  </td>
                  {DISTRICT_IDS.map(did => {
                    const price = state.prices[did]?.[g.id] || 0;
                    const isCheapest = did === route.cheapest.dist;
                    const isMostExpensive = did === route.expensive.dist;
                    const demand = state.districtDemands[did] === g.id;

                    return (
                      <td key={did} className="text-center py-1.5 px-1">
                        <span className={`font-semibold ${
                          isCheapest ? 'text-emerald' :
                          isMostExpensive ? 'text-blood' :
                          'text-foreground'
                        }`}>
                          €{price}
                        </span>
                        {demand && <span className="text-gold ml-0.5">★</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 text-[0.5rem] text-muted-foreground mb-4">
        <span><span className="text-emerald font-bold">■</span> Laagste prijs</span>
        <span><span className="text-blood font-bold">■</span> Hoogste prijs</span>
        <span><span className="text-gold">★</span> Hoge vraag</span>
      </div>

      {/* Best Routes Overview */}
      <SectionHeader title="Beste Handelsroutes" icon={<Navigation size={12} />} />
      <div className="space-y-2">
        {GOODS.map(g => {
          const route = getBestRoute(g.id as GoodId);
          if (route.profit <= 0) return null;
          const cat = GOOD_CATEGORIES[g.id];
          const sparkData = state.priceHistory?.[route.cheapest.dist]?.[g.id] || [];

          return (
            <motion.div
              key={g.id}
              className={`game-card p-2.5 ${cat.borderColor} border-l-[3px]`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold text-xs ${cat.color}`}>{g.name}</span>
                <span className="text-emerald font-bold text-xs">+€{route.profit}/stuk</span>
              </div>
              <div className="flex items-center gap-1 text-[0.55rem] text-muted-foreground flex-wrap">
                <span>Koop in</span>
                <GameBadge variant="emerald" size="xs">{DISTRICTS[route.cheapest.dist].name}</GameBadge>
                <span className="font-semibold text-foreground">€{route.cheapest.price}</span>
                <ArrowRight size={8} className="text-gold mx-0.5" />
                <span>Verkoop in</span>
                <GameBadge variant="blood" size="xs">{DISTRICTS[route.expensive.dist].name}</GameBadge>
                <span className="font-semibold text-foreground">€{route.sellPrice}</span>
              </div>
              {sparkData.length >= 2 && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[0.45rem] text-muted-foreground">Trend:</span>
                  <PriceSparkline data={sparkData} width={60} height={16} />
                </div>
              )}
            </motion.div>
          );
        }).filter(Boolean)}

        {GOODS.every(g => getBestRoute(g.id as GoodId).profit <= 0) && (
          <p className="text-[0.6rem] text-muted-foreground text-center py-4">
            Geen winstgevende routes beschikbaar vandaag.
          </p>
        )}
      </div>

      {/* Selected good detail */}
      {selectedGood && (() => {
        const g = GOODS.find(go => go.id === selectedGood)!;
        const cat = GOOD_CATEGORIES[selectedGood];
        const owned = state.inventory[selectedGood] || 0;
        const avgCost = state.inventoryCosts[selectedGood] || 0;
        const spoilRate = GOOD_SPOILAGE[selectedGood];

        return (
          <motion.div
            className="game-card mt-4 p-3 border-t-2 border-t-gold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h4 className={`font-bold text-sm ${cat.color} mb-2`}>{g.name} — Detail</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[0.6rem]">
              <span className="text-muted-foreground">In bezit:</span>
              <span className="font-bold text-foreground">{owned}</span>
              {owned > 0 && (
                <>
                  <span className="text-muted-foreground">Gem. aankoopprijs:</span>
                  <span className="font-bold text-foreground">€{avgCost}</span>
                </>
              )}
              <span className="text-muted-foreground">Base prijs:</span>
              <span className="font-bold text-foreground">€{g.base}</span>
              {spoilRate > 0 && (
                <>
                  <span className="text-muted-foreground flex items-center gap-1"><Leaf size={8} className="text-blood" /> Bederf:</span>
                  <span className="font-bold text-blood">{Math.round(spoilRate * 100)}% per nacht</span>
                </>
              )}
              {g.faction && (
                <>
                  <span className="text-muted-foreground">Factie korting:</span>
                  <span className="font-bold text-foreground">
                    {(state.familyRel[g.faction] || 0) > 50 ? '-30% inkoop' : `Vereist: ${g.faction} rel > 50`}
                  </span>
                </>
              )}
            </div>

            {/* Price History Chart */}
            <div className="mt-3">
              <span className="text-[0.5rem] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Prijsverloop (alle districten)</span>
              <PriceHistoryChart
                goodId={selectedGood}
                priceHistory={state.priceHistory}
                currentPrices={state.prices}
              />
            </div>
          </motion.div>
        );
      })()}
    </>
  );
}
