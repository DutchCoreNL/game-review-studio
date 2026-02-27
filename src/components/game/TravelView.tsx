import { useState, useEffect, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useTravel } from '@/hooks/useTravel';
import {
  DESTINATIONS, TravelDestination, TravelGood,
  calculateTravelTime, calculateCustomsRisk, formatTravelTime, formatCountdown,
} from '@/game/travel';
import { ViewWrapper } from './ui/ViewWrapper';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Clock, ShieldAlert, Package, ArrowLeft, MapPin,
  AlertTriangle, CheckCircle2, Anchor, ChevronRight,
} from 'lucide-react';

// ─── Destination Card ───
function DestinationCard({ dest, level, onSelect }: {
  dest: TravelDestination; level: number; onSelect: () => void;
}) {
  const locked = level < dest.reqLevel;
  const dangerColor = dest.dangerLevel === 'high' ? 'text-blood' : dest.dangerLevel === 'medium' ? 'text-gold' : 'text-emerald-400';

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={locked ? undefined : onSelect}
      disabled={locked}
      className={`w-full text-left rounded-lg border p-4 transition-all ${
        locked ? 'border-border/20 opacity-40 cursor-not-allowed' : 'border-border hover:border-gold/30 hover:bg-gold/5 cursor-pointer'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{dest.flag}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-foreground">{dest.name}</h3>
            <span className="text-[0.55rem] text-muted-foreground">{dest.country}</span>
            {locked && <span className="text-[0.5rem] text-blood ml-auto">Lv.{dest.reqLevel}</span>}
          </div>
          <p className="text-[0.6rem] text-muted-foreground mt-0.5 line-clamp-2">{dest.description}</p>
          <div className="flex items-center gap-4 mt-2 text-[0.6rem]">
            <span className="flex items-center gap-1 text-muted-foreground"><Clock size={10} /> {formatTravelTime(dest.travelMinutes)}</span>
            <span className={`flex items-center gap-1 ${dangerColor}`}>
              <ShieldAlert size={10} /> {dest.dangerLevel === 'high' ? 'Hoog risico' : dest.dangerLevel === 'medium' ? 'Gemiddeld' : 'Laag risico'}
            </span>
            <span className="text-muted-foreground">{dest.goods.length} goederen</span>
          </div>
        </div>
        {!locked && <ChevronRight size={16} className="text-muted-foreground mt-1" />}
      </div>
    </motion.button>
  );
}

// ─── Active Travel Banner ───
function TravelBanner({ travel, hasArrived, onArrive, onCancel, destination }: {
  travel: any; hasArrived: boolean; onArrive: () => void; onCancel: () => void; destination?: TravelDestination;
}) {
  const [countdown, setCountdown] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const start = new Date(travel.departed_at).getTime();
      const end = new Date(travel.arrives_at).getTime();
      const now = Date.now();
      const pct = Math.min(100, ((now - start) / (end - start)) * 100);
      setProgress(pct);
      setCountdown(formatCountdown(travel.arrives_at));
    };
    update();
    const iv = setInterval(update, 3000);
    return () => clearInterval(iv);
  }, [travel]);

  const isReturning = travel.status === 'returning';
  const label = isReturning ? 'Terugreis naar Noxhaven' : `Reis naar ${destination?.name || travel.destination}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg border border-gold/30 bg-gold/5 p-4 mb-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Plane size={18} className="text-gold" />
        <div className="flex-1">
          <p className="text-xs font-bold text-gold">{label}</p>
          <p className="text-[0.6rem] text-muted-foreground">
            {hasArrived ? (isReturning ? 'Terug in Noxhaven!' : 'Aangekomen!') : countdown}
          </p>
        </div>
      </div>
      <Progress value={progress} className="h-2 bg-muted mb-2" />
      <div className="flex gap-2">
        {hasArrived && (
          <GameButton size="sm" onClick={onArrive} className="flex-1">
            <CheckCircle2 size={14} /> {isReturning ? 'Thuiskomen' : 'Uitstappen'}
          </GameButton>
        )}
        {!hasArrived && travel.status === 'traveling' && (
          <GameButton size="sm" variant="muted" onClick={onCancel}>
            Annuleren
          </GameButton>
        )}
      </div>
    </motion.div>
  );
}

// ─── Abroad View (at destination) ───
function AbroadView({ destination, travel, onBuy, onReturn, heat, hasHelipad }: {
  destination: TravelDestination; travel: any; onBuy: (id: string, qty: number) => void;
  onReturn: () => void; heat: number; hasHelipad: boolean;
}) {
  const purchased = travel.purchased_goods as Record<string, number>;
  const totalIllegal = destination.goods
    .filter(g => g.illegal)
    .reduce((s, g) => s + (purchased[g.id] || 0), 0);
  const customsRisk = calculateCustomsRisk(destination, heat, totalIllegal);
  const returnTime = calculateTravelTime(destination, hasHelipad);

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-lg border border-gold/30 bg-gold/5 p-4"
      >
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">{destination.flag}</span>
          <div>
            <h2 className="text-lg font-bold text-foreground">{destination.name}</h2>
            <p className="text-[0.6rem] text-muted-foreground">{destination.country}</p>
          </div>
        </div>
      </motion.div>

      {/* Customs risk warning */}
      <div className={`rounded-lg border p-3 flex items-center gap-3 ${
        customsRisk > 60 ? 'border-blood/30 bg-blood/5' : customsRisk > 30 ? 'border-gold/30 bg-gold/5' : 'border-border bg-card'
      }`}>
        <ShieldAlert size={18} className={customsRisk > 60 ? 'text-blood' : customsRisk > 30 ? 'text-gold' : 'text-muted-foreground'} />
        <div className="flex-1">
          <p className="text-xs font-bold text-foreground">Douanerisico: {customsRisk}%</p>
          <p className="text-[0.55rem] text-muted-foreground">
            Gebaseerd op heat ({heat}) en illegale goederen ({totalIllegal})
          </p>
        </div>
      </div>

      {/* Goods market */}
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
          <Package size={12} /> Lokale Markt
        </h3>
        <div className="space-y-2">
          {destination.goods.map(good => {
            const owned = purchased[good.id] || 0;
            const canBuyMore = owned < good.maxQuantity;
            const profit = good.sellPrice - good.buyPrice;

            return (
              <div key={good.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{good.name}</span>
                    {good.illegal && (
                      <span className="text-[0.5rem] px-1.5 py-0.5 rounded bg-blood/20 text-blood font-bold">ILLEGAAL</span>
                    )}
                  </div>
                  <span className="text-[0.6rem] text-muted-foreground">{owned}/{good.maxQuantity}</span>
                </div>
                <div className="flex items-center gap-4 text-[0.6rem] mb-2">
                  <span className="text-muted-foreground">Koop: €{good.buyPrice.toLocaleString()}</span>
                  <span className="text-emerald-400">Verkoop: €{good.sellPrice.toLocaleString()}</span>
                  <span className="text-gold font-bold">+€{profit.toLocaleString()}/st</span>
                </div>
                <div className="flex gap-1">
                  {[1, 5].map(qty => (
                    <GameButton
                      key={qty}
                      size="sm"
                      variant="gold"
                      disabled={!canBuyMore || owned + qty > good.maxQuantity}
                      onClick={() => onBuy(good.id, Math.min(qty, good.maxQuantity - owned))}
                    >
                      Koop {qty}x
                    </GameButton>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Return button */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-bold text-foreground">Terug naar Noxhaven</p>
            <p className="text-[0.6rem] text-muted-foreground">
              Reistijd: {formatTravelTime(returnTime)} {hasHelipad && '(helipad bonus)'}
            </p>
          </div>
          {Object.keys(purchased).length > 0 && (
            <div className="text-right">
              <p className="text-[0.55rem] text-muted-foreground">Smokkelwaar</p>
              <p className="text-xs font-bold text-gold">
                {Object.values(purchased).reduce((s, v) => s + v, 0)} items
              </p>
            </div>
          )}
        </div>
        <GameButton onClick={onReturn} className="w-full">
          <ArrowLeft size={14} /> Terugkeren
        </GameButton>
        {customsRisk > 50 && (
          <p className="text-[0.5rem] text-blood mt-1 flex items-center gap-1">
            <AlertTriangle size={10} /> Hoog douanerisico! Overweeg illegale goederen te dumpen.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Travel View ───
export function TravelView() {
  const { state } = useGame();
  const { travel, loading, hasArrived, startTravel, arriveAtDestination, buyGood, startReturn, completeReturn, cancelTravel } = useTravel();
  const [toast, setToast] = useState<string | null>(null);
  const [selectedDest, setSelectedDest] = useState<string | null>(null);

  const hasHelipad = state.villa?.modules?.includes('helipad') ?? false;
  const currentDest = travel ? DESTINATIONS.find(d => d.id === travel.destination) : null;

  // If abroad, show the abroad view
  if (travel?.status === 'abroad' && currentDest) {
    return (
      <ViewWrapper>
        <SectionHeader title={`${currentDest.flag} ${currentDest.name}`} />
        <AbroadView
          destination={currentDest}
          travel={travel}
          onBuy={async (id, qty) => {
            const good = currentDest.goods.find(g => g.id === id);
            if (!good) return;
            const cost = good.buyPrice * qty;
            if (state.money < cost) { setToast('Niet genoeg geld!'); return; }
            const res = await buyGood(id, qty);
            setToast(res.message);
          }}
          onReturn={async () => {
            const time = calculateTravelTime(currentDest, hasHelipad);
            const res = await startReturn(time);
            setToast(res.message);
          }}
          heat={state.heat}
          hasHelipad={hasHelipad}
        />
        <Toast message={toast} onClear={() => setToast(null)} />
      </ViewWrapper>
    );
  }

  // If traveling/returning, show progress
  if (travel && (travel.status === 'traveling' || travel.status === 'returning')) {
    return (
      <ViewWrapper>
        <SectionHeader title="Reizen" />
        <TravelBanner
          travel={travel}
          hasArrived={!!hasArrived}
          destination={currentDest || undefined}
          onArrive={async () => {
            if (travel.status === 'returning') {
              // Customs check on return
              const dest = DESTINATIONS.find(d => d.id === travel.destination);
              const purchased = travel.purchased_goods as Record<string, number>;
              const totalIllegal = (dest?.goods || [])
                .filter(g => g.illegal)
                .reduce((s, g) => s + (purchased[g.id] || 0), 0);
              const risk = dest ? calculateCustomsRisk(dest, state.heat, totalIllegal) : 0;
              const caught = Math.random() * 100 < risk;

              if (caught && totalIllegal > 0) {
                // Customs seized illegal goods
                const legalGoods: Record<string, number> = {};
                if (dest) {
                  for (const [gId, qty] of Object.entries(purchased)) {
                    const good = dest.goods.find(g => g.id === gId);
                    if (good && !good.illegal) legalGoods[gId] = qty;
                  }
                }
                await completeReturn();
                setToast(`🚨 Douane! Illegale goederen in beslag genomen! ${Object.keys(legalGoods).length > 0 ? 'Legale goederen behouden.' : ''}`);
              } else {
                const result = await completeReturn();
                if (result.success) {
                  const totalItems = Object.values(result.goods).reduce((s, v) => s + v, 0);
                  setToast(`✅ Veilig thuisgekomen met ${totalItems} items!`);
                }
              }
            } else {
              await arriveAtDestination();
              setToast('Aangekomen op bestemming!');
            }
          }}
          onCancel={async () => {
            await cancelTravel();
            setToast('Reis geannuleerd.');
          }}
        />
        <div className="text-center py-8">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-4xl mb-3"
          >
            ✈️
          </motion.div>
          <p className="text-sm text-muted-foreground">
            {travel.status === 'returning' ? 'Op weg terug naar Noxhaven...' : `Op weg naar ${currentDest?.name || travel.destination}...`}
          </p>
        </div>
        <Toast message={toast} onClear={() => setToast(null)} />
      </ViewWrapper>
    );
  }

  // Destination selection with optional detail
  const detailDest = selectedDest ? DESTINATIONS.find(d => d.id === selectedDest) : null;

  return (
    <ViewWrapper>
      <SectionHeader title="Reizen" />
      <p className="text-xs text-muted-foreground mb-4">
        Reis naar buitenlandse steden, koop exclusieve goederen en smokkel ze terug naar Noxhaven.
        {hasHelipad && <span className="text-gold ml-1">🚁 Helipad: -50% reistijd!</span>}
      </p>

      {/* Destination detail */}
      <AnimatePresence mode="wait">
        {detailDest ? (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GameButton size="sm" variant="muted" onClick={() => setSelectedDest(null)} className="mb-3">
              <ArrowLeft size={14} /> Terug
            </GameButton>

            <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{detailDest.flag}</span>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{detailDest.name}</h2>
                  <p className="text-[0.6rem] text-muted-foreground">{detailDest.country}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{detailDest.description}</p>
              <div className="flex items-center gap-4 text-[0.6rem] mb-3">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock size={10} /> {formatTravelTime(calculateTravelTime(detailDest, hasHelipad))}
                  {hasHelipad && <span className="text-gold">(helipad)</span>}
                </span>
                <span className="text-muted-foreground">Douane: {detailDest.customsRiskBase}% basis</span>
              </div>

              {/* Goods preview */}
              <div className="space-y-1.5 mb-4">
                {detailDest.goods.map(g => (
                  <div key={g.id} className="flex items-center justify-between text-[0.6rem] py-1 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-semibold">{g.name}</span>
                      {g.illegal && <span className="text-blood text-[0.45rem] font-bold">⚠</span>}
                    </div>
                    <span className="text-emerald-400">+€{(g.sellPrice - g.buyPrice).toLocaleString()}/st</span>
                  </div>
                ))}
              </div>

              <GameButton
                onClick={async () => {
                  const time = calculateTravelTime(detailDest, hasHelipad);
                  const res = await startTravel(detailDest.id, time);
                  setToast(res.message);
                }}
                className="w-full"
              >
                <Plane size={14} /> Vertrekken ({formatTravelTime(calculateTravelTime(detailDest, hasHelipad))})
              </GameButton>
            </div>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="space-y-2">
              {DESTINATIONS.map(dest => (
                <DestinationCard
                  key={dest.id}
                  dest={dest}
                  level={state.player.level}
                  onSelect={() => setSelectedDest(dest.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast} onClear={() => setToast(null)} />
    </ViewWrapper>
  );
}

// ─── Toast ───
function Toast({ message, onClear }: { message: string | null; onClear: () => void }) {
  useEffect(() => {
    if (message) {
      const t = setTimeout(onClear, 3000);
      return () => clearTimeout(t);
    }
  }, [message, onClear]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card border border-border px-4 py-2 rounded-lg text-xs font-semibold shadow-lg z-50"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
