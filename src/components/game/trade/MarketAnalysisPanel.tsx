import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, GOODS, GOOD_CATEGORIES, GOOD_SPOILAGE } from '@/game/constants';
import { GoodId, DistrictId, MarketAlert } from '@/game/types';
import { getPlayerStat } from '@/game/engine';
import { SectionHeader } from '../ui/SectionHeader';
import { GameBadge } from '../ui/GameBadge';
import { GameButton } from '../ui/GameButton';
import { PriceSparkline } from './PriceSparkline';
import { PriceHistoryChart } from './PriceHistoryChart';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, MapPin, TrendingUp, TrendingDown, ArrowRight, Leaf, Navigation, Bell, BellRing, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const DISTRICT_IDS = Object.keys(DISTRICTS) as DistrictId[];

export function MarketAnalysisPanel() {
  const { state, dispatch, showToast } = useGame();
  const [selectedGood, setSelectedGood] = useState<GoodId | null>(null);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertGood, setAlertGood] = useState<GoodId>('drugs');
  const [alertDistrict, setAlertDistrict] = useState<DistrictId | 'any'>('any');
  const [alertCondition, setAlertCondition] = useState<'below' | 'above'>('below');
  const [alertThreshold, setAlertThreshold] = useState('');
  const [alertOneShot, setAlertOneShot] = useState(true);
  const totalCharm = getPlayerStat(state, 'charm');
  const charmBonus = (totalCharm * 0.02) + (state.rep / 5000);

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

  const addAlert = () => {
    const threshold = parseInt(alertThreshold);
    if (isNaN(threshold) || threshold <= 0) return showToast('Voer een geldig bedrag in.', true);
    if ((state.marketAlerts?.length || 0) >= 10) return showToast('Max 10 alerts.', true);

    const alert: MarketAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      goodId: alertGood,
      district: alertDistrict,
      condition: alertCondition,
      threshold,
      oneShot: alertOneShot,
    };
    dispatch({ type: 'ADD_MARKET_ALERT', alert });
    showToast('Markt alarm ingesteld!');
    setShowAlertForm(false);
    setAlertThreshold('');
  };

  const alerts = state.marketAlerts || [];
  const triggered = state.triggeredAlerts || [];

  return (
    <>
      <SectionHeader title="Markt Analyse" icon={<BarChart3 size={12} />} />

      {/* Triggered alerts banner */}
      {triggered.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gold/10 border border-gold/30 rounded p-2.5 mb-3"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <BellRing size={12} className="text-gold animate-pulse" />
              <span className="text-[0.6rem] font-bold text-gold uppercase tracking-wider">Alarm Getriggerd!</span>
            </div>
            <button onClick={() => dispatch({ type: 'CLEAR_TRIGGERED_ALERTS' })} className="text-[0.5rem] text-muted-foreground hover:text-foreground">
              Verberg
            </button>
          </div>
          {triggered.map((t, i) => (
            <div key={i} className="text-[0.55rem] text-foreground mb-0.5">
              <span className="font-bold">{t.goodName}</span> in {t.districtName}:
              <span className={t.condition === 'below' ? ' text-emerald' : ' text-blood'}>
                {' '}€{t.actualPrice} ({t.condition === 'below' ? '≤' : '≥'} €{t.threshold})
              </span>
            </div>
          ))}
        </motion.div>
      )}

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

      {/* ========== MARKET ALERTS ========== */}
      <SectionHeader title="Markt Alarmen" icon={<Bell size={12} />} />

      {/* Active alerts list */}
      {alerts.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {alerts.map(a => {
            const good = GOODS.find(g => g.id === a.goodId);
            const cat = GOOD_CATEGORIES[a.goodId];
            const distName = a.district === 'any' ? 'Alle districten' : DISTRICTS[a.district]?.name;
            return (
              <div key={a.id} className="game-card p-2 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Bell size={10} className="text-gold flex-shrink-0" />
                  <div className="text-[0.55rem] min-w-0">
                    <span className={`font-bold ${cat?.color || ''}`}>{good?.name}</span>
                    <span className="text-muted-foreground"> {a.condition === 'below' ? '≤' : '≥'} €{a.threshold}</span>
                    <span className="text-muted-foreground block">{distName} · {a.oneShot ? 'Eenmalig' : 'Herhalend'}</span>
                  </div>
                </div>
                <button
                  onClick={() => dispatch({ type: 'REMOVE_MARKET_ALERT', id: a.id })}
                  className="text-muted-foreground hover:text-blood transition-colors flex-shrink-0 p-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {alerts.length === 0 && !showAlertForm && (
        <p className="text-[0.55rem] text-muted-foreground mb-3">
          Geen alarmen ingesteld. Stel een alarm in om een melding te krijgen wanneer een prijs een drempel bereikt.
        </p>
      )}

      {/* Add alert button / form */}
      {!showAlertForm ? (
        <GameButton
          variant="gold"
          size="sm"
          onClick={() => setShowAlertForm(true)}
          disabled={alerts.length >= 10}
        >
          <Plus size={10} /> Alarm Instellen
        </GameButton>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="game-card p-3 border-t-2 border-t-gold mb-3"
        >
          <h4 className="text-[0.6rem] font-bold text-gold uppercase tracking-wider mb-2">Nieuw Alarm</h4>

          <div className="grid grid-cols-2 gap-2 mb-2">
            {/* Good selector */}
            <div>
              <label className="text-[0.5rem] text-muted-foreground font-bold uppercase">Goed</label>
              <select
                value={alertGood}
                onChange={e => setAlertGood(e.target.value as GoodId)}
                className="w-full bg-muted border border-border rounded px-2 py-1.5 text-[0.6rem] text-foreground mt-0.5"
              >
                {GOODS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            {/* District selector */}
            <div>
              <label className="text-[0.5rem] text-muted-foreground font-bold uppercase">District</label>
              <select
                value={alertDistrict}
                onChange={e => setAlertDistrict(e.target.value as DistrictId | 'any')}
                className="w-full bg-muted border border-border rounded px-2 py-1.5 text-[0.6rem] text-foreground mt-0.5"
              >
                <option value="any">Alle districten</option>
                {DISTRICT_IDS.map(did => <option key={did} value={did}>{DISTRICTS[did].name}</option>)}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="text-[0.5rem] text-muted-foreground font-bold uppercase">Conditie</label>
              <div className="flex gap-1 mt-0.5">
                <button
                  onClick={() => setAlertCondition('below')}
                  className={`flex-1 py-1.5 rounded text-[0.55rem] font-bold transition-all ${
                    alertCondition === 'below' ? 'bg-emerald/15 border border-emerald text-emerald' : 'bg-muted border border-border text-muted-foreground'
                  }`}
                >
                  <ChevronDown size={9} className="inline" /> Onder
                </button>
                <button
                  onClick={() => setAlertCondition('above')}
                  className={`flex-1 py-1.5 rounded text-[0.55rem] font-bold transition-all ${
                    alertCondition === 'above' ? 'bg-blood/15 border border-blood text-blood' : 'bg-muted border border-border text-muted-foreground'
                  }`}
                >
                  <ChevronUp size={9} className="inline" /> Boven
                </button>
              </div>
            </div>

            {/* Threshold */}
            <div>
              <label className="text-[0.5rem] text-muted-foreground font-bold uppercase">Prijs (€)</label>
              <input
                type="number"
                value={alertThreshold}
                onChange={e => setAlertThreshold(e.target.value)}
                placeholder="bijv. 500"
                className="w-full bg-muted border border-border rounded px-2 py-1.5 text-[0.6rem] text-foreground mt-0.5"
              />
            </div>
          </div>

          {/* One-shot toggle */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setAlertOneShot(!alertOneShot)}
              className={`w-4 h-4 rounded border flex items-center justify-center text-[0.5rem] ${
                alertOneShot ? 'bg-gold/15 border-gold text-gold' : 'bg-muted border-border text-muted-foreground'
              }`}
            >
              {alertOneShot && '✓'}
            </button>
            <span className="text-[0.55rem] text-muted-foreground">Eenmalig (verwijder na trigger)</span>
          </div>

          <div className="flex gap-2">
            <GameButton variant="gold" size="sm" onClick={addAlert}>
              <Bell size={10} /> Instellen
            </GameButton>
            <GameButton variant="muted" size="sm" onClick={() => setShowAlertForm(false)}>
              Annuleer
            </GameButton>
          </div>
        </motion.div>
      )}

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
