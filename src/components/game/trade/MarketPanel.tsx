import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, ArrowRightLeft, Info, ChevronDown, PackageOpen,
  Lock, Leaf, Flame, Route, Package,
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, GOODS, GOOD_CATEGORIES, GOOD_SPOILAGE } from '@/game/constants';
import { GOOD_IMAGES, DISTRICT_IMAGES } from '@/assets/items';
import { playCoinSound, playPurchaseSound, playNegativeSound } from '@/game/sounds';
import type { GoodId, DistrictId } from '@/game/types';
import { getBestTradeRoute } from '@/game/engine';
import { orgControlsDistrict } from '@/game/organization';
import { stashCapacity } from '@/game/score';
import { marketSurcharge } from '@/game/heat';
import {
  buyPrice, sellPrice, basePrice as listedPrice, stashFree, maxAffordable, unitProfit,
} from '@/game/market';
import { AutoFencePanel } from './AutoFencePanel';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { StatBar } from '../ui/StatBar';
import { PriceSparkline } from './PriceSparkline';
import { TradeRewardFloater } from '../animations/RewardPopup';
import { ConfirmDialog } from '../ConfirmDialog';

/**
 * DE MARKT.
 *
 * This screen was carrying a lot of things that were not true.
 *
 *   - Every price on it was computed here, separately from what the reducer charged.
 *     The heat surcharge banner in particular advertised a smooth curve to +40% while
 *     the engine applied a flat +20% above an average that included vehicle heat, which
 *     is always zero — so the number shouted at you was one you could never be charged.
 *     Prices now come from src/game/market.ts, which is also what the reducer calls.
 *   - Half the panel was plumbing for a market server that does not exist: a fetch of
 *     `get_market_prices` (an action the local API does not implement, so it always
 *     failed), a Supabase realtime subscription to a `market_prices` table that never
 *     changes, per-good buy/sell volumes that were always absent, price-alert banners
 *     that could never fire, and a "LIVE MARKT" indicator that could never light up.
 *   - Trading cost 2 invisible energy per trade and returned silently at zero, so after
 *     roughly fifty trades the market stopped working with no message.
 *
 * What is left is the thing the loop actually needs: you come here holding contraband a
 * klus paid you in, and you decide where and when to let it go.
 */

const QUANTITIES = [1, 5, 10, 0];
const QUANTITY_LABELS = ['1x', '5x', '10x', 'MAX'];

export function MarketPanel() {
  const { state, tradeMode, setTradeMode, dispatch, showToast } = useGame();
  const [quantity, setQuantity] = useState(1);
  const [lastTrade, setLastTrade] = useState<{ gid: string; amount: number; mode: 'buy' | 'sell' } | null>(null);
  const [pendingTrade, setPendingTrade] = useState<{ gid: GoodId; qty: number; cost: number } | null>(null);
  const [pendingSellAll, setPendingSellAll] = useState<{ totalGains: number } | null>(null);
  const [expandedGood, setExpandedGood] = useState<string | null>(null);

  const locked = !!state.prison;
  const district = DISTRICTS[state.loc];
  const held = Object.values(state.inventory || {}).reduce((a, b) => a + (b || 0), 0);
  const capacity = stashCapacity(state);
  const free = stashFree(state);
  const surcharge = Math.round(marketSurcharge(state.personalHeat || 0) * 100);
  const onTurf = orgControlsDistrict(state.org, state.loc);

  /** What the fence would give you for everything you are holding, right here. */
  const sellAllTotal = useMemo(() => GOODS.reduce((sum, g) => {
    const owned = state.inventory?.[g.id as GoodId] || 0;
    return sum + (owned > 0 ? sellPrice(state, g.id as GoodId) * owned : 0);
  }, 0), [state]);

  const route = useMemo(() => getBestTradeRoute(state), [state]);

  const execute = useCallback((gid: GoodId, qty: number) => {
    if (qty <= 0) {
      playNegativeSound();
      return showToast(tradeMode === 'buy' ? 'Geen ruimte of geen geld.' : 'Niet op voorraad.', true);
    }
    const unit = tradeMode === 'buy' ? buyPrice(state, gid) : sellPrice(state, gid);
    dispatch({ type: 'TRADE', gid, mode: tradeMode, quantity: qty });
    if (tradeMode === 'sell') playCoinSound(); else playPurchaseSound();
    const good = GOODS.find(g => g.id === gid);
    showToast(`${qty}× ${good?.name} ${tradeMode === 'buy' ? 'gekocht' : 'verkocht'}`);
    setLastTrade({ gid, amount: unit * qty, mode: tradeMode });
    setTimeout(() => setLastTrade(null), 1200);
  }, [state, tradeMode, dispatch, showToast]);

  const handleTrade = useCallback((gid: GoodId) => {
    const owned = state.inventory?.[gid] || 0;
    const qty = quantity === 0
      ? (tradeMode === 'buy' ? maxAffordable(state, gid) : owned)
      : Math.min(quantity, tradeMode === 'buy' ? maxAffordable(state, gid) : owned);

    if (quantity === 0 && qty > 1) {
      const unit = tradeMode === 'buy' ? buyPrice(state, gid) : sellPrice(state, gid);
      if (unit * qty > 5000) {
        setPendingTrade({ gid, qty, cost: unit * qty });
        return;
      }
    }
    execute(gid, qty);
  }, [state, quantity, tradeMode, execute]);

  return (
    <>
      {locked && (
        <div className="mb-2 text-[0.5rem] text-blood bg-blood/10 border border-blood/20 rounded px-2 py-1.5 flex items-center justify-center gap-1.5">
          <Lock size={10} /> Je zit vast — niemand handelt met je tot je buiten staat.
        </div>
      )}

      <AutoFencePanel />

      {/* Where you are standing */}
      <div className="relative rounded-xl overflow-hidden border border-border/50 mb-2 h-16">
        <motion.img
          src={DISTRICT_IMAGES[state.loc]} alt=""
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.06, x: 0 }}
          animate={{ scale: [1.06, 1.13, 1.06], x: [0, -8, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          style={{ opacity: 0.5 }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/80 to-card/25" />
        <div className="absolute inset-0 flex items-center justify-between px-3">
          <div>
            <div className="flex items-center gap-1.5">
              <ArrowRightLeft size={11} className="text-gold" />
              <span className="font-display text-sm text-foreground uppercase tracking-wide">{district.name}</span>
              {onTurf && <GameBadge variant="emerald" size="xs">JOUW TURF</GameBadge>}
            </div>
            <div className="text-[0.45rem] text-muted-foreground mt-0.5">Zwarte markt · prijzen van vandaag</div>
          </div>
        </div>
      </div>

      {/* One honest strip: what fits, what it costs you to be hot, what your name is worth */}
      <div className="game-card p-2.5 mb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[0.5rem] uppercase tracking-widest text-muted-foreground">Voorraad</span>
          <span className="text-[0.55rem] font-bold tabular-nums">
            <span className={held >= capacity ? 'text-blood' : 'text-foreground'}>{held}</span>
            <span className="text-muted-foreground">/{capacity}</span>
            {held >= capacity && <span className="text-blood ml-1">VOL</span>}
          </span>
        </div>
        <StatBar value={held} max={capacity} color={held >= capacity ? 'blood' : 'gold'} height="sm" />
        <div className="flex items-center gap-3 mt-2 text-[0.45rem]">
          {surcharge > 0 ? (
            <span className="flex items-center gap-1 text-blood">
              <Flame size={9} /> +{surcharge}% inkoop door hitte
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald">
              <Flame size={9} /> Koel — normale inkoopprijzen
            </span>
          )}
          {onTurf && <span className="text-emerald">−12% inkoop · +10% verkoop</span>}
        </div>
      </div>

      {/* A route worth driving, named rather than reduced to a percentage */}
      {route && route.profit > 0 && (
        <div className="game-card p-2 mb-2 flex items-center gap-2">
          <Route size={13} className="text-gold shrink-0" />
          <div className="text-[0.5rem] leading-snug min-w-0">
            <span className="text-muted-foreground">Beste route nu: </span>
            <span className="text-foreground font-bold">{GOODS.find(g => g.id === route.good)?.name}</span>
            <span className="text-muted-foreground"> kopen in </span>
            <span className="text-foreground font-bold">{DISTRICTS[route.buyDistrict as DistrictId]?.name}</span>
            <span className="text-muted-foreground">, kwijt in </span>
            <span className="text-foreground font-bold">{DISTRICTS[route.sellDistrict as DistrictId]?.name}</span>
            <span className="text-emerald font-bold"> · +€{route.profit.toLocaleString()}/stuk</span>
          </div>
        </div>
      )}

      {state.activeMarketEvent && (
        <div className="text-gold text-[0.6rem] font-bold bg-gold/10 p-2 rounded-lg mb-2 border border-gold/20">
          {state.activeMarketEvent.name}
          <span className="block text-[0.45rem] font-normal text-gold/70 mt-0.5">
            {state.activeMarketEvent.desc} ({state.activeMarketEvent.daysLeft}d resterend)
          </span>
        </div>
      )}

      {/* Buy or sell */}
      <div className="flex gap-2 mb-2">
        {(['buy', 'sell'] as const).map(mode => (
          <button key={mode} onClick={() => setTradeMode(mode)}
            className={`relative flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all overflow-hidden ${
              tradeMode === mode
                ? mode === 'buy' ? 'bg-gold text-secondary-foreground' : 'bg-blood text-primary-foreground'
                : 'bg-muted/60 text-muted-foreground border border-border'
            }`}>
            {mode === 'buy' ? 'Inkoop' : 'Verkoop'}
            {mode === 'sell' && held > 0 && tradeMode !== 'sell' && (
              <span className="absolute top-1 right-1.5 text-[0.4rem] text-blood font-black">{held}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 mb-3">
        {QUANTITIES.map((q, i) => (
          <button key={q} onClick={() => setQuantity(q)}
            className={`flex-1 py-1.5 rounded-lg text-[0.6rem] font-bold uppercase tracking-wider transition-all ${
              quantity === q ? 'bg-gold/15 border border-gold text-gold' : 'bg-muted/60 text-muted-foreground border border-border'
            }`}>{QUANTITY_LABELS[i]}</button>
        ))}
      </div>

      {tradeMode === 'sell' && held > 0 && (
        <motion.button
          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => { if (!locked) setPendingSellAll({ totalGains: sellAllTotal }); }}
          disabled={locked}
          className="w-full mb-3 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider bg-blood/15 border border-blood text-blood hover:bg-blood/25 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <PackageOpen size={14} />
          Alles verkopen
          <span className="text-[0.5rem] opacity-80 font-normal">€{sellAllTotal.toLocaleString()}</span>
        </motion.button>
      )}

      {/* The goods */}
      <div className="space-y-2">
        {GOODS.map((g, idx) => {
          const gid = g.id as GoodId;
          const cat = GOOD_CATEGORIES[g.id];
          const listed = listedPrice(state, gid);
          const unit = tradeMode === 'buy' ? buyPrice(state, gid) : sellPrice(state, gid);
          const owned = state.inventory?.[gid] || 0;
          const trendUp = state.priceTrends?.[g.id] === 'up';
          const demand = state.districtDemands?.[state.loc] === g.id;
          const distMod = district.mods[gid];
          const spark = state.priceHistory?.[state.loc]?.[g.id] || [];
          const spoil = GOOD_SPOILAGE[gid] || 0;
          const profit = owned > 0 ? unitProfit(state, gid) : 0;

          const canBuy = maxAffordable(state, gid);
          const qty = quantity === 0
            ? (tradeMode === 'buy' ? canBuy : owned)
            : Math.min(quantity, tradeMode === 'buy' ? canBuy : owned);
          const disabled = locked || qty <= 0;
          const total = unit * qty;

          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.25 }}
              className={`game-card p-2.5 ${cat.borderColor} border-l-[3px] ${owned > 0 ? 'ring-1 ring-gold/15' : ''}`}
            >
              <div className="flex items-start gap-2.5">
                {/* The goods themselves, big enough to recognise */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-border/60">
                  {GOOD_IMAGES[g.id]
                    ? <img src={GOOD_IMAGES[g.id]} alt="" className="w-full h-full object-cover" />
                    : <div className={`w-full h-full flex items-center justify-center ${cat.bgColor}`}><Package size={18} className={cat.color} /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                  {owned > 0 && (
                    <span className="absolute bottom-0.5 right-1 text-[0.6rem] font-black text-foreground drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                      {owned}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[0.7rem] text-foreground truncate">{g.name}</span>
                    {trendUp
                      ? <TrendingUp size={10} className="text-blood shrink-0" />
                      : <TrendingDown size={10} className="text-emerald shrink-0" />}
                    {demand && <GameBadge variant="gold" size="xs">VRAAG</GameBadge>}
                  </div>

                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className={`text-sm font-black tabular-nums ${tradeMode === 'buy' ? 'text-gold' : 'text-emerald'}`}>
                      €{unit.toLocaleString()}
                    </span>
                    <span className="text-[0.45rem] text-muted-foreground">/stuk</span>
                    {spark.length >= 2 && <span className="ml-auto"><PriceSparkline data={[...spark, listed]} /></span>}
                  </div>

                  <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-[0.45rem]">
                    <span className={distMod < 0.9 ? 'text-emerald font-semibold' : distMod > 1.3 ? 'text-blood font-semibold' : 'text-muted-foreground'}>
                      {distMod < 0.9 ? '↓ Goedkoop hier' : distMod > 1.3 ? '↑ Duur hier' : '— Normaal'}
                    </span>
                    {tradeMode === 'sell' && owned > 0 && (
                      <span className={profit >= 0 ? 'text-emerald font-bold' : 'text-blood font-bold'}>
                        {profit >= 0 ? '+' : ''}€{profit.toLocaleString()} winst/stuk
                      </span>
                    )}
                    {spoil > 0 && owned > 0 && (
                      <span className="text-blood/80 flex items-center gap-0.5" title="Bederft in je voorraad">
                        <Leaf size={8} /> −{Math.round(spoil * 100)}%/nacht
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedGood(expandedGood === g.id ? null : g.id); }}
                      className={`ml-auto flex items-center gap-0.5 transition-colors ${expandedGood === g.id ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Info size={9} />
                      <ChevronDown size={8} className={`transition-transform ${expandedGood === g.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 relative shrink-0">
                  <GameButton
                    variant={tradeMode === 'sell' ? 'blood' : 'gold'}
                    size="sm"
                    disabled={disabled}
                    onClick={() => handleTrade(gid)}
                  >
                    {tradeMode === 'buy' ? 'Koop' : 'Verkoop'}
                    {qty > 1 && <span className="text-[0.45rem] opacity-70 ml-0.5">×{qty}</span>}
                  </GameButton>
                  {qty > 0 && (
                    <span className="text-[0.45rem] text-muted-foreground tabular-nums">
                      €{total.toLocaleString()}
                    </span>
                  )}
                  <TradeRewardFloater
                    show={lastTrade?.gid === g.id}
                    amount={lastTrade?.gid === g.id ? lastTrade.amount : 0}
                    type={lastTrade?.mode === 'buy' ? 'cost' : 'profit'}
                  />
                </div>
              </div>

              {/* Where this price comes from */}
              <AnimatePresence>
                {expandedGood === g.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 pt-2 border-t border-border/40 space-y-1">
                      <Factor label="Marktprijs hier" value={`€${listed.toLocaleString()}`} />
                      {tradeMode === 'buy' ? (
                        <>
                          {onTurf && <Factor label="Jouw turf" value="−12%" tone="text-emerald" />}
                          {surcharge > 0 && <Factor label="Risico-opslag door hitte" value={`+${surcharge}%`} tone="text-blood" />}
                        </>
                      ) : (
                        <>
                          <Factor label="Wat de heler afroomt" value="−15%" tone="text-blood" />
                          <Factor label="Charisma & naam" value={`+${Math.round(((state.player?.stats?.charm || 0) * 0.02 + (state.rep || 0) / 5000) * 100)}%`} tone="text-emerald" />
                          {onTurf && <Factor label="Jouw turf" value="+10%" tone="text-emerald" />}
                        </>
                      )}
                      <div className="flex justify-between text-[0.55rem] font-bold pt-1 border-t border-border/40">
                        <span>Wat je {tradeMode === 'buy' ? 'betaalt' : 'krijgt'}</span>
                        <span className={tradeMode === 'buy' ? 'text-gold' : 'text-emerald'}>€{unit.toLocaleString()}</span>
                      </div>
                      {spoil > 0 && (
                        <p className="text-[0.45rem] text-muted-foreground pt-0.5">
                          Bederfelijk: hier gaat elke nacht {Math.round(spoil * 100)}% van verloren. Niet op blijven zitten.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {tradeMode === 'buy' && free === 0 && (
        <p className="text-[0.5rem] text-blood text-center mt-3">
          Je voorraad zit vol. Verkoop iets of koop meer opslag bij Uitrusting.
        </p>
      )}

      <ConfirmDialog
        open={!!pendingTrade}
        title={tradeMode === 'buy' ? 'Alles inkopen' : 'Alles verkopen'}
        message={pendingTrade
          ? `${pendingTrade.qty}× ${GOODS.find(g => g.id === pendingTrade.gid)?.name} voor €${pendingTrade.cost.toLocaleString()}. Doorgaan?`
          : ''}
        confirmText="DOEN"
        cancelText="ANNULEREN"
        onConfirm={() => { if (pendingTrade) execute(pendingTrade.gid, pendingTrade.qty); setPendingTrade(null); }}
        onCancel={() => setPendingTrade(null)}
      />

      <ConfirmDialog
        open={!!pendingSellAll}
        title="Alles verkopen"
        message={`Je hele voorraad gaat de deur uit voor ongeveer €${pendingSellAll?.totalGains.toLocaleString()}. Doorgaan?`}
        confirmText="VERKOOP ALLES"
        cancelText="ANNULEREN"
        variant="warning"
        onConfirm={() => {
          GOODS.forEach(g => {
            const owned = state.inventory?.[g.id as GoodId] || 0;
            if (owned > 0) dispatch({ type: 'TRADE', gid: g.id as GoodId, mode: 'sell', quantity: owned });
          });
          playCoinSound();
          showToast(`Alles verkocht — €${pendingSellAll?.totalGains.toLocaleString()}`);
          setPendingSellAll(null);
        }}
        onCancel={() => setPendingSellAll(null)}
      />
    </>
  );
}

function Factor({ label, value, tone = 'text-muted-foreground' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex justify-between text-[0.5rem]">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-bold ${tone}`}>{value}</span>
    </div>
  );
}
