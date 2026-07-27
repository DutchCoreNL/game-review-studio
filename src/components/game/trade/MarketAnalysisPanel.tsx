import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, MapPin, ArrowRight, Leaf, Navigation, Bell, BellRing, Plus, Trash2,
  ChevronDown, ChevronUp, Plane, Package, Fuel, Zap, Boxes, Ban, Flame,
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, GOODS, GOOD_CATEGORIES, GOOD_SPOILAGE } from '@/game/constants';
import { GOOD_IMAGES } from '@/assets/items';
import type { GoodId, DistrictId, MarketAlert } from '@/game/types';
import { buyPrice, sellPrice, bestRoutes, stashFree, tradeHeat, type TradeRoute } from '@/game/market';
import { travelCost, travelBlockedReason, TRAVEL_ENERGY } from '@/game/cityTravel';
import { SectionHeader } from '../ui/SectionHeader';
import { GameBadge } from '../ui/GameBadge';
import { GameButton } from '../ui/GameButton';
import { PriceHistoryChart } from './PriceHistoryChart';
import { ConfirmDialog } from '../ConfirmDialog';

/**
 * ANALYSE — waar is welke waar het duurst?
 *
 * The screen answers a real question and was answering it with numbers nobody could get.
 *
 *   - Every route on it was priced with a fourth private copy of the sell formula:
 *     `duurste × 0.85 × (1 + charme)`. It left out the organisation's turf bonus, and
 *     priced the buy side at the bare listed price with no heat surcharge — so the hotter
 *     you were, the more the quoted profit overshot what you could actually bank. The
 *     market header had a fifth copy that dropped charm as well. Routes now come from
 *     src/game/market.ts, the same two functions a real purchase and a real sale go
 *     through, and they are sized by what your stash and your capital allow instead of
 *     being quoted per anonymous unit.
 *   - "Reiskosten: €50" was flat. The trip costs €50 minus €8 per point of vehicle speed
 *     upgrade, and nothing at all with a Chauffeur, a racer, on turf you own, or in a
 *     storm. It also costs 5 energy and sits behind a 30-second cooldown, and every one of
 *     those refusals was silent — the dialog fired "Aangekomen in X" whether or not you
 *     had moved.
 *   - The good detail advertised a "Factie korting: -30% inkoop". No such discount exists
 *     anywhere in the engine. What faction standing really does is bend tomorrow's prices:
 *     cartel goods land 40% cheaper in Havens once the Cartel likes you.
 *   - It printed "Base prijs", the unmodified constant a price is generated from — a
 *     number you can never pay and cannot act on.
 *   - The Slim Alarm's own bug is documented in engine.ts; the copy here now describes
 *     what it does rather than what it was meant to do.
 */

const DISTRICT_IDS = Object.keys(DISTRICTS) as DistrictId[];

export function MarketAnalysisPanel() {
  const { state, dispatch, showToast, setTradeMode } = useGame();
  const [pendingTravelBuy, setPendingTravelBuy] = useState<TradeRoute | null>(null);
  const [selectedGood, setSelectedGood] = useState<GoodId | null>(null);
  const [boardMode, setBoardMode] = useState<'buy' | 'sell'>('buy');
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertGood, setAlertGood] = useState<GoodId>('drugs');
  const [alertDistrict, setAlertDistrict] = useState<DistrictId | 'any'>('any');
  const [alertCondition, setAlertCondition] = useState<'below' | 'above'>('below');
  const [alertThreshold, setAlertThreshold] = useState('');
  const [alertOneShot, setAlertOneShot] = useState(true);

  const routes = useMemo(() => bestRoutes(state), [state]);
  const free = stashFree(state);
  const alerts = state.marketAlerts || [];
  const triggered = state.triggeredAlerts || [];

  const addAlert = () => {
    const threshold = parseInt(alertThreshold);
    if (isNaN(threshold) || threshold <= 0) return showToast('Voer een geldig bedrag in.', true);
    if (alerts.length >= 10) return showToast('Max 10 alarmen.', true);

    const alert: MarketAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      goodId: alertGood,
      district: alertDistrict,
      condition: alertCondition,
      threshold,
      oneShot: alertOneShot,
    };
    dispatch({ type: 'ADD_MARKET_ALERT', alert });
    showToast('Markt alarm ingesteld.');
    setShowAlertForm(false);
    setAlertThreshold('');
  };

  const travelAndBuy = (route: TradeRoute) => {
    const blocked = travelBlockedReason(state, route.from);
    if (blocked) return showToast(blocked, true);
    dispatch({ type: 'TRAVEL', to: route.from });
    setTradeMode('buy');
    showToast(`Onderweg naar ${DISTRICTS[route.from].name} — inkoopmodus aan.`);
  };

  return (
    <>
      <SectionHeader title="Analyse" icon={<BarChart3 size={12} />} />

      {/* What the night turned up */}
      {triggered.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-card p-2.5 mb-3 border-l-[3px] border-l-gold"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <BellRing size={11} className="text-gold" />
              <span className="text-[0.5rem] font-bold text-gold uppercase tracking-widest">Vanochtend binnengekomen</span>
            </div>
            <button onClick={() => dispatch({ type: 'CLEAR_TRIGGERED_ALERTS' })} className="text-[0.45rem] text-muted-foreground hover:text-foreground">
              Verberg
            </button>
          </div>
          {triggered.map((t, i) => (
            <div key={i} className="text-[0.5rem] text-muted-foreground leading-relaxed">
              {t.route ? (
                <>
                  <span className="font-bold text-foreground">{t.goodName}</span> ligt in {t.route.from} voor €{t.actualPrice.toLocaleString()} —
                  kwijt in <span className="text-foreground">{t.route.to}</span>
                  <span className="text-emerald font-bold"> +€{t.route.perUnit.toLocaleString()}/stuk</span>
                </>
              ) : (
                <>
                  <span className="font-bold text-foreground">{t.goodName}</span> in {t.districtName}:
                  <span className={t.condition === 'below' ? ' text-emerald' : ' text-blood'}>
                    {' '}€{t.actualPrice.toLocaleString()} ({t.condition === 'below' ? '≤' : '≥'} €{t.threshold.toLocaleString()})
                  </span>
                </>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {state.activeMarketEvent && (
        <div className="text-gold text-[0.6rem] font-bold bg-gold/10 p-2 rounded-lg mb-3 border border-gold/20">
          {state.activeMarketEvent.name}
          <span className="block text-[0.45rem] font-normal text-gold/70 mt-0.5">
            {state.activeMarketEvent.desc} ({state.activeMarketEvent.daysLeft}d resterend)
          </span>
        </div>
      )}

      {/* ========== THE ANSWER: ROUTES ========== */}
      <SectionHeader title="Wat het rijden waard is" icon={<Navigation size={12} />} />

      {routes.length === 0 ? (
        <div className="game-card p-4 text-center">
          <Ban size={16} className="text-muted-foreground mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">Vandaag is er niks te halen.</p>
          <p className="text-[0.5rem] text-muted-foreground mt-1">
            De prijzen liggen te dicht bij elkaar om de rit en de helerscourtage terug te verdienen. Morgen staat het bord anders.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {routes.map((r, idx) => (
            <RouteCard
              key={r.good}
              route={r}
              rank={idx}
              free={free}
              here={state.loc}
              fare={travelCost(state, r.from)}
              blocked={travelBlockedReason(state, r.from)}
              onGo={() => setPendingTravelBuy(r)}
            />
          ))}
        </div>
      )}

      {/* ========== THE EVIDENCE: THE BOARD ========== */}
      <SectionHeader title="Het prijzenbord" icon={<BarChart3 size={12} />} />

      <div className="flex gap-1.5 mb-2">
        {(['buy', 'sell'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setBoardMode(mode)}
            className={`flex-1 py-1.5 rounded-lg text-[0.6rem] font-bold uppercase tracking-wider transition-all ${
              boardMode === mode
                ? mode === 'buy' ? 'bg-gold/15 border border-gold text-gold' : 'bg-emerald/15 border border-emerald text-emerald'
                : 'bg-muted/60 text-muted-foreground border border-border'
            }`}
          >
            {mode === 'buy' ? 'Wat je betaalt' : 'Wat je krijgt'}
          </button>
        ))}
      </div>

      <div className="game-card p-0 overflow-hidden mb-2 relative">
        {/* The board is wider than a phone; the fade says so. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-card to-transparent z-20" />
        <div className="overflow-x-auto">
          <table className="w-full text-[0.55rem] border-collapse">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left py-1.5 pl-1.5 pr-1 text-[0.45rem] text-muted-foreground font-bold uppercase tracking-widest sticky left-0 bg-card z-10">
                  Waar
                </th>
                {DISTRICT_IDS.map(did => (
                  <th key={did} className={`py-1.5 px-1 text-center ${state.loc === did ? 'bg-gold/10' : ''}`}>
                    <span className={`text-[0.45rem] font-bold uppercase tracking-wider ${state.loc === did ? 'text-gold' : 'text-muted-foreground'}`}>
                      {state.loc === did && <MapPin size={7} className="inline mr-0.5 -mt-0.5" />}
                      {DISTRICTS[did].name.split(' ')[0]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GOODS.map(g => {
                const gid = g.id as GoodId;
                const cat = GOOD_CATEGORIES[g.id];
                const isSelected = selectedGood === gid;
                const priced = DISTRICT_IDS.map(did => ({
                  did,
                  price: boardMode === 'buy' ? buyPrice(state, gid, did) : sellPrice(state, gid, did),
                }));
                const real = priced.filter(p => p.price > 0).map(p => p.price);
                const low = real.length ? Math.min(...real) : 0;
                const high = real.length ? Math.max(...real) : 0;

                return (
                  <tr
                    key={g.id}
                    onClick={() => setSelectedGood(isSelected ? null : gid)}
                    className={`border-t border-border/40 cursor-pointer transition-colors ${
                      isSelected ? 'bg-gold/5' : 'hover:bg-muted/25'
                    }`}
                  >
                    <td className="py-1.5 pl-1.5 pr-1 sticky left-0 bg-card z-10">
                      <div className="flex items-center gap-1.5">
                        {GOOD_IMAGES[g.id] ? (
                          <img src={GOOD_IMAGES[g.id]} alt="" className="w-5 h-5 rounded object-cover border border-border/60 shrink-0" />
                        ) : (
                          <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${cat.bgColor}`}>
                            <Package size={9} className={cat.color} />
                          </span>
                        )}
                        <span className={`font-bold whitespace-nowrap ${cat.color}`}>{g.name}</span>
                        {GOOD_SPOILAGE[gid] > 0 && <Leaf size={7} className="text-blood/60 shrink-0" />}
                      </div>
                    </td>
                    {priced.map(({ did, price }) => {
                      // Green is always "the good end of the deal": cheapest to buy,
                      // dearest to sell. The old board painted the raw low green in both.
                      const good = boardMode === 'buy' ? price === low : price === high;
                      const bad = boardMode === 'buy' ? price === high : price === low;
                      const demand = state.districtDemands?.[did] === g.id;
                      return (
                        <td key={did} className={`text-center py-1.5 px-1 tabular-nums ${state.loc === did ? 'bg-gold/[0.06]' : ''}`}>
                          <span className={`font-semibold ${good ? 'text-emerald' : bad ? 'text-blood' : 'text-foreground'}`}>
                            €{price.toLocaleString()}
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
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[0.45rem] text-muted-foreground mb-1">
        <span><span className="text-emerald font-bold">■</span> {boardMode === 'buy' ? 'Goedkoopst' : 'Beste heler'}</span>
        <span><span className="text-blood font-bold">■</span> {boardMode === 'buy' ? 'Duurst' : 'Slechtste heler'}</span>
        <span><span className="text-gold">★</span> Hoge vraag vandaag</span>
        <span><Leaf size={7} className="inline text-blood/60" /> Bederft</span>
      </div>
      <p className="text-[0.45rem] text-muted-foreground mb-4">
        {boardMode === 'buy'
          ? 'Inclusief je risico-opslag door hitte en je turfkorting. Dit is de prijs die je aan de kassa betaalt.'
          : 'Na de courtage van de heler, en met je charisma, je naam en je turf erbij. Dit is wat er in je zak komt.'}
        {' '}Tik een rij aan voor het verloop.
      </p>

      {/* Selected good detail */}
      <AnimatePresence>
        {selectedGood && (() => {
          const g = GOODS.find(go => go.id === selectedGood)!;
          const gid = selectedGood;
          const cat = GOOD_CATEGORIES[gid];
          const owned = state.inventory[gid] || 0;
          const avgCost = state.inventoryCosts[gid] || 0;
          const spoilRate = GOOD_SPOILAGE[gid];
          const hereSell = sellPrice(state, gid);
          const pressure = state.marketPressure?.[state.loc]?.[gid] || 0;

          return (
            <motion.div
              key={gid}
              className="game-card p-3 mb-4 border-l-[3px] border-l-gold"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                {GOOD_IMAGES[g.id] && (
                  <img src={GOOD_IMAGES[g.id]} alt="" className="w-9 h-9 rounded-lg object-cover border border-border/60" />
                )}
                <div className="min-w-0">
                  <h4 className={`font-bold text-xs ${cat.color}`}>{g.name}</h4>
                  <p className="text-[0.45rem] text-muted-foreground">{cat.label}</p>
                </div>
                <button
                  onClick={() => setSelectedGood(null)}
                  className="ml-auto text-[0.45rem] text-muted-foreground hover:text-foreground"
                >
                  Sluit
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[0.55rem] mb-3">
                <Fact label="In je voorraad" value={owned > 0 ? `${owned} stuks` : '—'} />
                <Fact label="Heler hier" value={hereSell > 0 ? `€${hereSell.toLocaleString()}` : 'wordt hier niet verhandeld'} />
                {owned > 0 && (
                  <>
                    <Fact label="Je betaalde gemiddeld" value={avgCost > 0 ? `€${avgCost.toLocaleString()}` : 'buit — gratis'} />
                    <Fact
                      label="Winst per stuk hier"
                      value={`${hereSell - avgCost >= 0 ? '+' : ''}€${(hereSell - avgCost).toLocaleString()}`}
                      tone={hereSell - avgCost >= 0 ? 'text-emerald' : 'text-blood'}
                    />
                  </>
                )}
                {spoilRate > 0 && (
                  <Fact
                    label="Bederf per nacht"
                    value={`−${Math.round(spoilRate * 100)}%`}
                    tone="text-blood"
                  />
                )}
                {Math.abs(pressure) > 0.05 && (
                  <Fact
                    label="Jouw druk op deze markt"
                    value={pressure > 0 ? `+${Math.round(pressure * 15)}% prijs` : `${Math.round(pressure * 15)}% prijs`}
                    tone={pressure > 0 ? 'text-blood' : 'text-emerald'}
                  />
                )}
              </div>

              {Math.abs(pressure) > 0.05 && (
                <p className="text-[0.45rem] text-muted-foreground mb-2.5 leading-snug">
                  Je hebt hier zoveel {g.name.toLowerCase()} {pressure > 0 ? 'opgekocht' : 'gedumpt'} dat de markt het merkt.
                  Dat zakt elke dag een stukje weg.
                </p>
              )}

              <span className="text-[0.45rem] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                Marktprijs per district
              </span>
              <PriceHistoryChart
                goodId={gid}
                priceHistory={state.priceHistory}
                currentPrices={state.prices}
              />
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ========== ALERTS ========== */}
      <SectionHeader title="Markt Alarmen" icon={<Bell size={12} />} />

      <div className="game-card p-2.5 mb-2 border-l-[3px] border-l-gold">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <BellRing size={13} className={state.smartAlarmEnabled ? 'text-gold' : 'text-muted-foreground'} />
            <div className="min-w-0">
              <span className="text-[0.65rem] font-bold text-foreground">Slim Alarm</span>
              <span className="block text-[0.45rem] text-muted-foreground leading-snug">
                Elke ochtend de beste routes van die dag in je nachtrapport, zodra er meer dan
                €{(state.smartAlarmThreshold || 1000).toLocaleString()} per stuk in zit.
              </span>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SMART_ALARM' })}
            aria-label="Slim alarm aan of uit"
            className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
              state.smartAlarmEnabled ? 'bg-gold' : 'bg-muted border border-border'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background shadow transition-transform ${
              state.smartAlarmEnabled ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
        </div>
        {state.smartAlarmEnabled && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[0.45rem] text-muted-foreground whitespace-nowrap">Vanaf</span>
            <input
              type="range"
              min={200}
              max={5000}
              step={100}
              value={state.smartAlarmThreshold || 1000}
              onChange={e => dispatch({ type: 'SET_SMART_ALARM_THRESHOLD', threshold: parseInt(e.target.value) })}
              className="flex-1 h-1.5 accent-gold bg-muted rounded-full appearance-none cursor-pointer"
            />
            <span className="text-[0.55rem] font-bold text-gold w-14 text-right tabular-nums">
              €{(state.smartAlarmThreshold || 1000).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {alerts.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {alerts.map(a => {
            const good = GOODS.find(g => g.id === a.goodId);
            const cat = GOOD_CATEGORIES[a.goodId];
            const distName = a.district === 'any' ? 'Alle districten' : DISTRICTS[a.district]?.name;
            return (
              <div key={a.id} className="game-card p-2 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Bell size={10} className="text-gold shrink-0" />
                  <div className="text-[0.55rem] min-w-0">
                    <span className={`font-bold ${cat?.color || ''}`}>{good?.name}</span>
                    <span className="text-muted-foreground"> {a.condition === 'below' ? '≤' : '≥'} €{a.threshold.toLocaleString()}</span>
                    <span className="text-muted-foreground block text-[0.45rem]">{distName} · {a.oneShot ? 'eenmalig' : 'herhalend'}</span>
                  </div>
                </div>
                <button
                  onClick={() => dispatch({ type: 'REMOVE_MARKET_ALERT', id: a.id })}
                  aria-label="Alarm verwijderen"
                  className="text-muted-foreground hover:text-blood transition-colors shrink-0 p-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {alerts.length === 0 && !showAlertForm && (
        <p className="text-[0.5rem] text-muted-foreground mb-2 leading-snug">
          Geen eigen alarmen. Zet er een als je op één specifieke prijs zit te wachten — je hoort het dan
          in het nachtrapport.
        </p>
      )}

      {!showAlertForm ? (
        <GameButton variant="gold" size="sm" onClick={() => setShowAlertForm(true)} disabled={alerts.length >= 10}>
          <Plus size={10} /> Alarm instellen
        </GameButton>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="game-card p-3 border-l-[3px] border-l-gold overflow-hidden"
        >
          <h4 className="text-[0.55rem] font-bold text-gold uppercase tracking-widest mb-2">Nieuw alarm</h4>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[0.45rem] text-muted-foreground font-bold uppercase tracking-wider">Waar</label>
              <select
                value={alertGood}
                onChange={e => setAlertGood(e.target.value as GoodId)}
                className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-[0.6rem] text-foreground mt-0.5"
              >
                {GOODS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[0.45rem] text-muted-foreground font-bold uppercase tracking-wider">District</label>
              <select
                value={alertDistrict}
                onChange={e => setAlertDistrict(e.target.value as DistrictId | 'any')}
                className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-[0.6rem] text-foreground mt-0.5"
              >
                <option value="any">Alle districten</option>
                {DISTRICT_IDS.map(did => <option key={did} value={did}>{DISTRICTS[did].name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[0.45rem] text-muted-foreground font-bold uppercase tracking-wider">Conditie</label>
              <div className="flex gap-1 mt-0.5">
                <button
                  onClick={() => setAlertCondition('below')}
                  className={`flex-1 py-1.5 rounded-lg text-[0.55rem] font-bold transition-all ${
                    alertCondition === 'below' ? 'bg-emerald/15 border border-emerald text-emerald' : 'bg-muted border border-border text-muted-foreground'
                  }`}
                >
                  <ChevronDown size={9} className="inline" /> Onder
                </button>
                <button
                  onClick={() => setAlertCondition('above')}
                  className={`flex-1 py-1.5 rounded-lg text-[0.55rem] font-bold transition-all ${
                    alertCondition === 'above' ? 'bg-blood/15 border border-blood text-blood' : 'bg-muted border border-border text-muted-foreground'
                  }`}
                >
                  <ChevronUp size={9} className="inline" /> Boven
                </button>
              </div>
            </div>

            <div>
              <label className="text-[0.45rem] text-muted-foreground font-bold uppercase tracking-wider">Marktprijs (€)</label>
              <input
                type="number"
                value={alertThreshold}
                onChange={e => setAlertThreshold(e.target.value)}
                placeholder="bijv. 500"
                className="w-full bg-muted border border-border rounded-lg px-2 py-1.5 text-[0.6rem] text-foreground mt-0.5"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2.5">
            <button
              onClick={() => setAlertOneShot(!alertOneShot)}
              className={`w-4 h-4 rounded border flex items-center justify-center text-[0.5rem] shrink-0 ${
                alertOneShot ? 'bg-gold/15 border-gold text-gold' : 'bg-muted border-border text-muted-foreground'
              }`}
            >
              {alertOneShot && '✓'}
            </button>
            <span className="text-[0.5rem] text-muted-foreground">Eenmalig — verdwijnt zodra hij afgaat</span>
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

      {/* Reis & Koop */}
      <ConfirmDialog
        open={!!pendingTravelBuy}
        title="Reis & koop"
        message={pendingTravelBuy
          ? `Naar ${DISTRICTS[pendingTravelBuy.from].name} voor ${GOODS.find(g => g.id === pendingTravelBuy.good)?.name}. `
            + `De rit kost ${travelCost(state, pendingTravelBuy.from) > 0 ? `€${travelCost(state, pendingTravelBuy.from)}` : 'niks'} `
            + `en ${TRAVEL_ENERGY} energie. Je kunt er ${pendingTravelBuy.units} stuks meenemen.`
          : ''}
        confirmText="RIJDEN"
        cancelText="LATER"
        variant="warning"
        onConfirm={() => { if (pendingTravelBuy) travelAndBuy(pendingTravelBuy); setPendingTravelBuy(null); }}
        onCancel={() => setPendingTravelBuy(null)}
      />
    </>
  );
}

/**
 * One run, priced end to end: what it costs there, what it fetches there, and what the
 * whole trip is worth given the space in your stash and the cash in your pocket.
 */
function RouteCard({ route, rank, free, here, fare, blocked, onGo }: {
  route: TradeRoute;
  rank: number;
  free: number;
  here: DistrictId;
  fare: number;
  blocked: string | null;
  onGo: () => void;
}) {
  const g = GOODS.find(go => go.id === route.good)!;
  const cat = GOOD_CATEGORIES[route.good];
  const atSource = here === route.from;
  // The fare comes off the whole run once, not off every unit — so a thin margin on a
  // full stash still beats a fat one on two crates.
  const net = route.total - (atSource ? 0 : fare);
  const heat = tradeHeat('buy', route.buy * route.units) + tradeHeat('sell', route.sell * route.units);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.04, duration: 0.25 }}
      className={`game-card p-2.5 border-l-[3px] ${cat.borderColor} ${rank === 0 ? 'ring-1 ring-gold/25' : ''}`}
    >
      <div className="flex items-start gap-2.5">
        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border/60">
          {GOOD_IMAGES[g.id]
            ? <img src={GOOD_IMAGES[g.id]} alt="" className="w-full h-full object-cover" />
            : <div className={`w-full h-full flex items-center justify-center ${cat.bgColor}`}><Package size={16} className={cat.color} /></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-card/70 to-transparent" />
          {rank === 0 && (
            <span className="absolute top-0 left-0 bg-gold text-secondary-foreground text-[0.35rem] font-black px-1 py-px rounded-br">
              BESTE
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className={`font-bold text-[0.7rem] ${cat.color} truncate`}>{g.name}</span>
            <span className="text-emerald font-black text-xs tabular-nums shrink-0">
              +€{route.perUnit.toLocaleString()}<span className="text-[0.45rem] font-normal text-muted-foreground">/stuk</span>
            </span>
          </div>

          {/* The run itself */}
          <div className="flex items-center gap-1 flex-wrap mt-1 text-[0.5rem]">
            <GameBadge variant="emerald" size="xs">{DISTRICTS[route.from].name}</GameBadge>
            <span className="text-muted-foreground tabular-nums">€{route.buy.toLocaleString()}</span>
            <ArrowRight size={9} className="text-gold mx-0.5" />
            <GameBadge variant="blood" size="xs">{DISTRICTS[route.to].name}</GameBadge>
            <span className="text-muted-foreground tabular-nums">€{route.sell.toLocaleString()}</span>
          </div>

          {/* What the run is actually worth to you today */}
          <div className="flex items-center flex-wrap gap-x-2.5 gap-y-0.5 mt-1.5 text-[0.45rem]">
            <span className="flex items-center gap-0.5 text-muted-foreground">
              <Boxes size={8} /> {route.units} stuks mee
              {route.units === 0 && <span className="text-blood ml-0.5">— {free === 0 ? 'voorraad vol' : 'te weinig geld'}</span>}
            </span>
            {route.units > 0 && (
              <>
                <span className={`font-bold ${net > 0 ? 'text-emerald' : 'text-blood'}`}>
                  hele rit {net > 0 ? '+' : ''}€{net.toLocaleString()}
                </span>
                {/* A run this size is the loudest thing you can do; price it in up front. */}
                <span className="flex items-center gap-0.5 text-blood">
                  <Flame size={8} /> +{heat} hitte
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Getting there */}
      {!atSource && (
        <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-2">
          <div className="flex items-center gap-2 text-[0.45rem] text-muted-foreground min-w-0">
            <span className="flex items-center gap-0.5"><Fuel size={8} /> {fare > 0 ? `€${fare}` : 'gratis'}</span>
            <span className="flex items-center gap-0.5"><Zap size={8} /> {TRAVEL_ENERGY}</span>
            {blocked && <span className="text-blood truncate">{blocked}</span>}
          </div>
          <div className="ml-auto shrink-0">
            <GameButton variant={blocked ? 'muted' : 'gold'} size="sm" disabled={!!blocked} onClick={onGo}>
              <Plane size={10} /> Rijden
            </GameButton>
          </div>
        </div>
      )}
      {atSource && (
        <p className="mt-2 pt-2 border-t border-border/40 text-[0.45rem] text-emerald">
          Je staat er al — koop in bij Markt.
        </p>
      )}
    </motion.div>
  );
}

function Fact({ label, value, tone = 'text-foreground' }: { label: string; value: string; tone?: string }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold tabular-nums text-right ${tone}`}>{value}</span>
    </>
  );
}
