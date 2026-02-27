import { useGame } from '@/contexts/GameContext';
import { VEHICLES, VEHICLE_SELL_RATIO, UNIQUE_VEHICLES } from '@/game/constants';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { VEHICLE_IMAGES } from '@/assets/items';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Store, TrendingUp, TrendingDown, Tag, Car, ArrowRightLeft, Lock, Crown } from 'lucide-react';
import { GameBadge } from '../ui/GameBadge';
import { useState } from 'react';
import { ConfirmDialog } from '../ConfirmDialog';

export function DealerPanel() {
  const { state, dispatch, showToast } = useGame();
  const [confirmSell, setConfirmSell] = useState<string | null>(null);
  const [tradeInTarget, setTradeInTarget] = useState<string | null>(null);

  const getSellPrice = (vehicleId: string) => {
    const vDef = VEHICLES.find(v => v.id === vehicleId);
    const ownedV = state.ownedVehicles.find(v => v.id === vehicleId);
    if (!vDef || !ownedV) return 0;
    const conditionMod = (ownedV.condition / 100) * 0.3 + 0.4; // 40-70% range
    const upgradeBonus = ownedV.upgrades ? Object.values(ownedV.upgrades).reduce((sum, lvl) => sum + (lvl || 0) * 0.05, 0) : 0;
    return Math.floor(vDef.cost * (VEHICLE_SELL_RATIO + upgradeBonus) * conditionMod);
  };

  const getMarketPrice = (vehicleId: string) => {
    const vDef = VEHICLES.find(v => v.id === vehicleId);
    if (!vDef) return 0;
    const mod = state.vehiclePriceModifiers?.[vehicleId] ?? 1;
    return Math.floor(vDef.cost * mod);
  };

  const canSell = (vehicleId: string) => {
    // Can't sell last vehicle, can't sell active if it's the only one
    if (state.ownedVehicles.length <= 1) return false;
    return true;
  };

  const handleSell = (vehicleId: string) => {
    const price = getSellPrice(vehicleId);
    dispatch({ type: 'SELL_VEHICLE', vehicleId });
    showToast(`Voertuig verkocht voor €${price.toLocaleString()}!`);
    setConfirmSell(null);
  };

  const handleTradeIn = (oldId: string, newId: string) => {
    dispatch({ type: 'TRADE_IN_VEHICLE', oldVehicleId: oldId, newVehicleId: newId });
    const vNew = VEHICLES.find(v => v.id === newId);
    showToast(`Ingeruild voor ${vNew?.name}!`);
    setTradeInTarget(null);
  };

  const ownedIds = state.ownedVehicles.map(v => v.id);
  const notOwned = VEHICLES.filter(v => !ownedIds.includes(v.id) && v.cost > 0);
  const regularVehicles = notOwned.filter(v => !v.reqPrestige);
  const prestigeVehicles = notOwned.filter(v => v.reqPrestige);

  return (
    <div>
      <SectionHeader title="Dealerschap" icon={<Store size={12} />} />

      {/* Deal of the day */}
      {state.dealerDeal && state.dealerDeal.expiresDay > state.day && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="game-card border-l-[3px] border-l-emerald mb-3"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Tag size={12} className="text-emerald" />
            <span className="text-[0.6rem] font-bold text-emerald uppercase">Deal van de Dag</span>
            <span className="text-[0.45rem] text-muted-foreground ml-auto">
              Nog {state.dealerDeal.expiresDay - state.day} dag(en)
            </span>
          </div>
          {(() => {
            const dealV = VEHICLES.find(v => v.id === state.dealerDeal!.vehicleId);
            if (!dealV) return null;
            const discountedPrice = Math.floor(dealV.cost * (1 - state.dealerDeal!.discount));
            const alreadyOwned = ownedIds.includes(dealV.id);
            return (
              <div className="flex items-center gap-3">
                <div className="w-14 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                  {VEHICLE_IMAGES[dealV.id] ? (
                    <img src={VEHICLE_IMAGES[dealV.id]} alt={dealV.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Car size={16} className="text-muted-foreground" /></div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[0.6rem]">{dealV.name}</h4>
                  <div className="flex items-center gap-2 text-[0.5rem]">
                    <span className="line-through text-muted-foreground">€{dealV.cost.toLocaleString()}</span>
                    <span className="text-emerald font-bold">€{discountedPrice.toLocaleString()}</span>
                    <span className="text-emerald text-[0.4rem]">-{Math.round(state.dealerDeal!.discount * 100)}%</span>
                  </div>
                </div>
                <GameButton
                  variant="gold"
                  size="sm"
                  disabled={state.money < discountedPrice || alreadyOwned}
                  onClick={() => {
                    dispatch({ type: 'BUY_VEHICLE', id: dealV.id });
                    showToast(`${dealV.name} gekocht met ${Math.round(state.dealerDeal!.discount * 100)}% korting!`);
                  }}
                >
                  {alreadyOwned ? 'BEZIT' : 'KOOP'}
                </GameButton>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* Sell owned vehicles */}
      <SectionHeader title="Verkoop je Voertuigen" icon={<TrendingDown size={12} />} />
      <div className="space-y-2 mb-4">
        {state.ownedVehicles.map(ov => {
          const vDef = VEHICLES.find(v => v.id === ov.id);
          // Skip unique vehicles from sell list
          if (UNIQUE_VEHICLES.some(uv => uv.id === ov.id)) return null;
          if (!vDef || vDef.cost === 0) return null; // Can't sell starter car
          const sellPrice = getSellPrice(ov.id);
          const isActive = ov.id === state.activeVehicle;
          return (
            <div key={ov.id} className="game-card flex items-center gap-2">
              <div className="w-12 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                {VEHICLE_IMAGES[ov.id] ? (
                  <img src={VEHICLE_IMAGES[ov.id]} alt={vDef.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Car size={12} className="text-muted-foreground" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[0.6rem] truncate">
                  {vDef.name} {isActive && <span className="text-gold text-[0.45rem]">(ACTIEF)</span>}
                </h4>
                <p className="text-[0.45rem] text-muted-foreground">
                  Conditie: {ov.condition}% · Waarde: <span className="text-emerald font-bold">€{sellPrice.toLocaleString()}</span>
                </p>
              </div>
              <GameButton
                variant="blood"
                size="sm"
                disabled={!canSell(ov.id)}
                onClick={() => setConfirmSell(ov.id)}
              >
                VERKOOP
              </GameButton>
            </div>
          );
        })}
      </div>

      {/* Buy with dynamic prices */}
      {regularVehicles.length > 0 && (
        <>
          <SectionHeader title="Te Koop (Marktprijzen)" icon={<TrendingUp size={12} />} />
          <div className="space-y-2 mb-4">
            {regularVehicles.map(v => {
              const marketPrice = getMarketPrice(v.id);
              const mod = state.vehiclePriceModifiers?.[v.id] ?? 1;
              const trend = mod > 1.02 ? 'up' : mod < 0.98 ? 'down' : 'flat';
              return (
                <div key={v.id} className="game-card flex items-center gap-2">
                  <div className="w-12 h-8 rounded bg-muted overflow-hidden flex-shrink-0">
                    {VEHICLE_IMAGES[v.id] ? (
                      <img src={VEHICLE_IMAGES[v.id]} alt={v.name} className="w-full h-full object-cover grayscale" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Car size={12} className="text-muted-foreground" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[0.6rem] truncate">{v.name}</h4>
                    <div className="flex items-center gap-1.5 text-[0.45rem]">
                      <span className="font-bold">€{marketPrice.toLocaleString()}</span>
                      {trend === 'up' && <TrendingUp size={8} className="text-blood" />}
                      {trend === 'down' && <TrendingDown size={8} className="text-emerald" />}
                      {mod !== 1 && (
                        <span className={trend === 'up' ? 'text-blood' : 'text-emerald'}>
                          {mod > 1 ? '+' : ''}{Math.round((mod - 1) * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-[0.4rem] text-muted-foreground">
                      S:{v.storage} · Spd:{v.speed} · Arm:{v.armor} · Ch:{v.charm}
                    </p>
                    {state.money < marketPrice && (
                      <div className="mt-1">
                        <Progress value={Math.min(100, (state.money / marketPrice) * 100)} className="h-[3px] bg-muted/30" />
                        <p className="text-[0.35rem] text-muted-foreground mt-0.5">
                          {Math.round((state.money / marketPrice) * 100)}% — nog €{(marketPrice - state.money).toLocaleString()} nodig
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <GameButton
                      variant="gold"
                      size="sm"
                      disabled={state.money < marketPrice}
                      onClick={() => {
                        dispatch({ type: 'BUY_VEHICLE', id: v.id });
                        showToast(`${v.name} gekocht!`);
                      }}
                    >
                      KOOP
                    </GameButton>
                    {state.ownedVehicles.length > 0 && (
                      <GameButton
                        variant="muted"
                        size="sm"
                        onClick={() => setTradeInTarget(v.id)}
                      >
                        <ArrowRightLeft size={8} /> INRUIL
                      </GameButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Prestige vehicles */}
      {prestigeVehicles.length > 0 && (
        <>
          <SectionHeader title="Prestige Collectie" icon={<Crown size={12} />} />
          <div className="space-y-2 mb-4">
            {prestigeVehicles.map(v => {
              const marketPrice = getMarketPrice(v.id);
              const locked = (state.prestigeLevel || 0) < (v.reqPrestige || 0);
              return (
                <div key={v.id} className={`game-card flex items-center gap-2 ${locked ? 'opacity-60' : 'border-gold/30'}`}>
                  <div className="w-12 h-8 rounded bg-muted overflow-hidden flex-shrink-0 relative">
                    {VEHICLE_IMAGES[v.id] ? (
                      <img src={VEHICLE_IMAGES[v.id]} alt={v.name} className={`w-full h-full object-cover ${locked ? 'grayscale blur-[1px]' : ''}`} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Car size={12} className="text-muted-foreground" /></div>
                    )}
                    {locked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Lock size={10} className="text-gold" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-[0.6rem] truncate">{v.name}</h4>
                      <GameBadge variant="gold" size="xs"><Crown size={7} /> P{v.reqPrestige}+</GameBadge>
                    </div>
                    <div className="flex items-center gap-1.5 text-[0.45rem]">
                      <span className="font-bold text-gold">€{marketPrice.toLocaleString()}</span>
                    </div>
                    <p className="text-[0.4rem] text-muted-foreground">
                      S:{v.storage} · Spd:{v.speed} · Arm:{v.armor} · Ch:{v.charm}
                    </p>
                    <p className="text-[0.35rem] text-muted-foreground italic mt-0.5">{v.desc}</p>
                    {locked && (
                      <p className="text-[0.4rem] text-gold font-bold mt-1">🔒 Prestige {v.reqPrestige} vereist (huidig: {state.prestigeLevel || 0})</p>
                    )}
                  </div>
                  <GameButton
                    variant="gold"
                    size="sm"
                    disabled={locked || state.money < marketPrice}
                    onClick={() => {
                      dispatch({ type: 'BUY_VEHICLE', id: v.id });
                      showToast(`${v.name} gekocht! 🏆`);
                    }}
                  >
                    {locked ? <Lock size={10} /> : 'KOOP'}
                  </GameButton>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Confirm sell dialog */}
      {confirmSell && (
        <ConfirmDialog
          open={true}
          title="Voertuig Verkopen"
          message={`Weet je zeker dat je ${VEHICLES.find(v => v.id === confirmSell)?.name} wilt verkopen voor €${getSellPrice(confirmSell).toLocaleString()}?`}
          onConfirm={() => handleSell(confirmSell)}
          onCancel={() => setConfirmSell(null)}
        />
      )}

      {/* Trade-in modal */}
      {tradeInTarget && (
        <ConfirmDialog
          open={true}
          title="Inruilen"
          message={`Kies een voertuig om in te ruilen voor ${VEHICLES.find(v => v.id === tradeInTarget)?.name}. Je krijgt 10% extra boven de normale verkoopprijs.`}
          onConfirm={() => {
            // Trade in active vehicle by default
            const tradeCandidate = state.ownedVehicles.find(v => v.id !== 'toyohata' && VEHICLES.find(vd => vd.id === v.id)?.cost! > 0);
            if (tradeCandidate) {
              handleTradeIn(tradeCandidate.id, tradeInTarget);
            }
          }}
          onCancel={() => setTradeInTarget(null)}
        />
      )}
    </div>
  );
}
