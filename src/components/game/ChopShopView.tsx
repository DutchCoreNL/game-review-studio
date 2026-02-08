import { useGame } from '@/contexts/GameContext';
import { STEALABLE_CARS, CHOP_SHOP_UPGRADES, OMKAT_COST, CRUSHER_AMMO_REWARDS } from '@/game/constants';
import { StolenCar, ChopShopUpgradeId, StolenCarRarity } from '@/game/types';
import { GameButton } from './ui/GameButton';
import { SectionHeader } from './ui/SectionHeader';
import { StatBar } from './ui/StatBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Wrench, DollarSign, Paintbrush, ShieldCheck, Clock, ArrowLeft, Zap, Star, Package, Hammer, Crosshair } from 'lucide-react';
import { useState } from 'react';

const RARITY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  common: { text: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-border' },
  uncommon: { text: 'text-emerald', bg: 'bg-emerald/10', border: 'border-emerald/30' },
  rare: { text: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/30' },
  exotic: { text: 'text-game-purple', bg: 'bg-game-purple/10', border: 'border-game-purple/30' },
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Gewoon',
  uncommon: 'Ongewoon',
  rare: 'Zeldzaam',
  exotic: 'Exotisch',
};

function getCarValue(car: StolenCar): number {
  let value = car.baseValue;
  // Condition affects value
  value = Math.floor(value * (car.condition / 100));
  // Upgrades increase value
  car.upgrades.forEach(uid => {
    const upg = CHOP_SHOP_UPGRADES.find(u => u.id === uid);
    if (upg) value = Math.floor(value * (1 + upg.valueBonus / 100));
  });
  return value;
}

function getCrusherAmmo(car: StolenCar): { min: number; max: number; expected: number } {
  const carDef = STEALABLE_CARS.find(c => c.id === car.carTypeId);
  if (!carDef) return { min: 3, max: 5, expected: 4 };
  const [minAmmo, maxAmmo] = CRUSHER_AMMO_REWARDS[carDef.rarity as StolenCarRarity] || [3, 5];
  let bonusMin = 0;
  let bonusMax = 0;
  // Condition bonus
  if (car.condition >= 80) { bonusMin += 2; bonusMax += 2; }
  // Upgrade bonus
  bonusMin += car.upgrades.length;
  bonusMax += car.upgrades.length;
  return {
    min: minAmmo + bonusMin,
    max: maxAmmo + bonusMax,
    expected: Math.floor((minAmmo + maxAmmo) / 2) + bonusMin,
  };
}

function CrusherSection({ car, onBack }: { car: StolenCar; onBack: () => void }) {
  const { state, dispatch, showToast } = useGame();
  const carDef = STEALABLE_CARS.find(c => c.id === car.carTypeId);
  if (!carDef) return null;

  const ammoInfo = getCrusherAmmo(car);
  const currentAmmo = state.ammo || 0;
  const atMax = currentAmmo >= 99;

  const handleCrush = () => {
    dispatch({ type: 'CRUSH_CAR', carId: car.id });
    showToast(`${carDef.name} gesloopt! +~${ammoInfo.expected} kogels verkregen`);
    onBack();
  };

  return (
    <div className="game-card bg-blood/5 border border-blood/20 p-3 mt-3">
      <div className="flex items-center gap-2 mb-2">
        <Hammer size={14} className="text-blood" />
        <span className="text-xs font-bold uppercase tracking-wider">Crusher</span>
      </div>
      <p className="text-[0.5rem] text-muted-foreground mb-2">
        Sloop deze auto voor munitie. Geen omkatten vereist.
      </p>
      <div className="flex items-center justify-between bg-background/50 rounded px-2.5 py-1.5 mb-2 text-[0.55rem]">
        <span className="text-muted-foreground flex items-center gap-1">
          <Crosshair size={10} /> Verwacht
        </span>
        <span className="font-bold text-blood">~{ammoInfo.expected} kogels ({ammoInfo.min}-{ammoInfo.max})</span>
      </div>
      {car.condition >= 80 && (
        <div className="text-[0.45rem] text-emerald mb-1.5">✦ Conditie bonus: +2 kogels</div>
      )}
      {car.upgrades.length > 0 && (
        <div className="text-[0.45rem] text-ice mb-1.5">✦ Upgrade bonus: +{car.upgrades.length} kogels</div>
      )}
      <GameButton
        variant="blood"
        size="md"
        fullWidth
        icon={<Hammer size={12} />}
        disabled={atMax}
        onClick={handleCrush}
      >
        SLOPEN — ~{ammoInfo.expected} KOGELS
      </GameButton>
      {atMax && (
        <p className="text-[0.45rem] text-muted-foreground text-center mt-1">Munitie vol (99/99)</p>
      )}
    </div>
  );
}

function CarCard({ car, onSelect, isNew }: { car: StolenCar; onSelect: () => void; isNew: boolean }) {
  const carDef = STEALABLE_CARS.find(c => c.id === car.carTypeId);
  if (!carDef) return null;

  const rarity = RARITY_COLORS[carDef.rarity];
  const value = getCarValue(car);

  return (
    <motion.button
      onClick={onSelect}
      className={`w-full text-left game-card ${rarity.bg} p-3 border ${rarity.border} hover:brightness-110 transition-all relative overflow-hidden`}
      initial={isNew ? { opacity: 0, scale: 0.85, y: 20 } : { opacity: 0, x: -10 }}
      animate={isNew
        ? { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } }
        : { opacity: 1, x: 0 }
      }
      whileTap={{ scale: 0.98 }}
    >
      {/* New car glow effect */}
      {isNew && (
        <motion.div
          className="absolute inset-0 rounded pointer-events-none"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          style={{
            background: 'radial-gradient(ellipse at center, hsl(var(--gold) / 0.3), transparent 70%)',
          }}
        />
      )}
      {/* New badge */}
      {isNew && (
        <motion.span
          className="absolute top-1.5 right-1.5 text-[0.4rem] font-bold uppercase tracking-wider bg-gold/20 text-gold border border-gold/30 px-1.5 py-0.5 rounded"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
        >
          ✦ Nieuw
        </motion.span>
      )}
      <div className="flex items-center gap-2.5">
        <motion.div
          className={`w-9 h-9 rounded ${rarity.bg} border ${rarity.border} flex items-center justify-center text-lg`}
          animate={isNew ? { rotate: [0, -8, 8, -4, 0] } : {}}
          transition={isNew ? { delay: 0.2, duration: 0.5 } : {}}
        >
          🚗
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold truncate">{carDef.name}</span>
            <span className={`text-[0.45rem] font-bold px-1.5 py-0.5 rounded ${rarity.bg} ${rarity.text} border ${rarity.border}`}>
              {RARITY_LABELS[carDef.rarity]}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[0.55rem] text-muted-foreground mt-0.5">
            <span>{carDef.brand}</span>
            <span>•</span>
            <span className="text-gold font-semibold">€{value.toLocaleString()}</span>
          </div>
        </div>
        <div className="text-right">
          {car.omgekat ? (
            <span className="text-[0.5rem] font-bold text-emerald flex items-center gap-0.5">
              <ShieldCheck size={10} /> Clean
            </span>
          ) : (
            <span className="text-[0.5rem] font-bold text-blood flex items-center gap-0.5">
              <Clock size={10} /> Hot
            </span>
          )}
          <div className="text-[0.45rem] text-muted-foreground mt-0.5">
            {car.upgrades.length > 0 && `${car.upgrades.length} upgrades`}
          </div>
        </div>
      </div>
      <div className="mt-1.5">
        <StatBar value={car.condition} max={100} color={car.condition > 60 ? 'emerald' : car.condition > 30 ? 'gold' : 'blood'} height="sm" />
      </div>
    </motion.button>
  );
}

function CarDetail({ car, onBack }: { car: StolenCar; onBack: () => void }) {
  const { state, dispatch, showToast } = useGame();
  const carDef = STEALABLE_CARS.find(c => c.id === car.carTypeId);
  if (!carDef) return null;

  const rarity = RARITY_COLORS[carDef.rarity];
  const value = getCarValue(car);
  const canOmkat = !car.omgekat && state.money >= OMKAT_COST;

  // Check active orders for this car type
  const matchingOrder = state.carOrders.find(o => o.carTypeId === car.carTypeId && car.omgekat);
  const orderValue = matchingOrder ? Math.floor(value * (1 + matchingOrder.bonusPercent / 100)) : 0;

  const handleOmkat = () => {
    dispatch({ type: 'OMKAT_STOLEN_CAR', carId: car.id });
    showToast(`${carDef.name} omgekat! Kenteken gewist.`);
  };

  const handleUpgrade = (upgradeId: ChopShopUpgradeId) => {
    dispatch({ type: 'UPGRADE_STOLEN_CAR', carId: car.id, upgradeId });
    const upg = CHOP_SHOP_UPGRADES.find(u => u.id === upgradeId);
    showToast(`${upg?.name} geïnstalleerd op ${carDef.name}!`);
  };

  const handleSell = () => {
    dispatch({ type: 'SELL_STOLEN_CAR', carId: car.id, orderId: null });
    showToast(`${carDef.name} verkocht voor €${value.toLocaleString()}!`);
    onBack();
  };

  const handleSellOrder = () => {
    if (!matchingOrder) return;
    dispatch({ type: 'SELL_STOLEN_CAR', carId: car.id, orderId: matchingOrder.id });
    showToast(`${carDef.name} geleverd aan ${matchingOrder.clientName} voor €${orderValue.toLocaleString()}!`);
    onBack();
  };

  const handleUse = () => {
    dispatch({ type: 'USE_STOLEN_CAR', carId: car.id });
    showToast(`${carDef.name} toegevoegd aan je garage!`);
    onBack();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1 text-[0.6rem] text-muted-foreground mb-3 hover:text-foreground transition-colors">
        <ArrowLeft size={12} /> Terug naar overzicht
      </button>

      {/* Car header */}
      <div className={`game-card ${rarity.bg} border ${rarity.border} p-4 mb-3`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="text-3xl">🚗</div>
          <div>
            <h3 className="font-bold text-sm">{carDef.name}</h3>
            <div className="flex items-center gap-2 text-[0.55rem]">
              <span className="text-muted-foreground">{carDef.brand}</span>
              <span className={`font-bold px-1.5 py-0.5 rounded ${rarity.bg} ${rarity.text} border ${rarity.border}`}>
                {RARITY_LABELS[carDef.rarity]}
              </span>
            </div>
          </div>
        </div>
        <p className="text-[0.55rem] text-muted-foreground italic mb-2">"{carDef.desc}"</p>

        <div className="grid grid-cols-2 gap-2 text-[0.55rem]">
          <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1.5">
            <span className="text-muted-foreground">Waarde</span>
            <span className="font-bold text-gold">€{value.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1.5">
            <span className="text-muted-foreground">Conditie</span>
            <span className={`font-bold ${car.condition > 60 ? 'text-emerald' : car.condition > 30 ? 'text-gold' : 'text-blood'}`}>
              {car.condition}%
            </span>
          </div>
          <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1.5">
            <span className="text-muted-foreground">Status</span>
            <span className={`font-bold ${car.omgekat ? 'text-emerald' : 'text-blood'}`}>
              {car.omgekat ? '✓ Clean' : '✗ Hot'}
            </span>
          </div>
          <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1.5">
            <span className="text-muted-foreground">Gestolen</span>
            <span className="font-bold">Dag {car.stolenDay}</span>
          </div>
        </div>
      </div>

      {/* Omkatten */}
      {!car.omgekat && (
        <div className="game-card bg-muted/30 p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={14} className="text-gold" />
            <span className="text-xs font-bold">Omkatten</span>
          </div>
          <p className="text-[0.5rem] text-muted-foreground mb-2">
            Kenteken wissen en chassis nummer aanpassen. Noodzakelijk voor verkoop of eigen gebruik.
          </p>
          <GameButton variant="gold" size="md" fullWidth icon={<Wrench size={12} />}
            disabled={!canOmkat} glow={canOmkat} onClick={handleOmkat}>
            OMKATTEN — €{OMKAT_COST.toLocaleString()}
          </GameButton>
          {state.money < OMKAT_COST && (
            <p className="text-[0.45rem] text-blood text-center mt-1">Te weinig geld</p>
          )}
        </div>
      )}

      {/* Upgrades */}
      <div className="game-card bg-muted/30 p-3 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={14} className="text-ice" />
          <span className="text-xs font-bold">Tuning & Upgrades</span>
          <span className="text-[0.45rem] text-muted-foreground">Verhoogt verkoopwaarde</span>
        </div>
        <div className="space-y-1.5">
          {CHOP_SHOP_UPGRADES.map(upg => {
            const hasUpgrade = car.upgrades.includes(upg.id);
            const canAfford = state.money >= upg.cost;
            return (
              <div key={upg.id} className={`flex items-center gap-2 rounded px-2.5 py-2 border ${
                hasUpgrade ? 'bg-ice/10 border-ice/20' : 'bg-background/50 border-border'
              }`}>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[0.6rem] font-bold">{upg.name}</span>
                    {hasUpgrade && <span className="text-[0.45rem] text-ice font-bold">✓</span>}
                  </div>
                  <div className="text-[0.45rem] text-muted-foreground">{upg.desc} (+{upg.valueBonus}% waarde)</div>
                </div>
                {!hasUpgrade && (
                  <GameButton variant="muted" size="sm" disabled={!canAfford}
                    onClick={() => handleUpgrade(upg.id)}>
                    €{upg.cost.toLocaleString()}
                  </GameButton>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sell / Use actions */}
      <div className="space-y-2">
        {car.omgekat && (
          <>
            <GameButton variant="gold" size="lg" fullWidth glow icon={<DollarSign size={14} />}
              onClick={handleSell}>
              VERKOPEN — €{value.toLocaleString()}
            </GameButton>

            {matchingOrder && (
              <GameButton variant="blood" size="lg" fullWidth glow icon={<Star size={14} />}
                onClick={handleSellOrder}>
                OPDRACHT: {matchingOrder.clientName} — €{orderValue.toLocaleString()}
              </GameButton>
            )}

            <GameButton variant="muted" size="md" fullWidth icon={<Car size={13} />}
              onClick={handleUse}>
              ZELF GEBRUIKEN (naar garage)
            </GameButton>
          </>
        )}

        {!car.omgekat && (
          <div className="text-[0.5rem] text-muted-foreground text-center py-2 bg-muted/30 rounded border border-border">
            ⚠️ Eerst omkatten voordat je kunt verkopen of gebruiken
          </div>
        )}
      </div>

      {/* Crusher section - always available */}
      <CrusherSection car={car} onBack={onBack} />
    </motion.div>
  );
}

function OrdersPanel() {
  const { state } = useGame();
  if (state.carOrders.length === 0) {
    return (
      <div className="text-center py-4 text-[0.55rem] text-muted-foreground">
        <Package size={20} className="mx-auto mb-1 opacity-40" />
        <p>Geen actieve bestellingen.</p>
        <p className="text-[0.45rem] mt-0.5">Bestellingen verschijnen elke paar dagen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {state.carOrders.map(order => {
        const carDef = STEALABLE_CARS.find(c => c.id === order.carTypeId);
        if (!carDef) return null;
        const rarity = RARITY_COLORS[carDef.rarity];
        const daysLeft = order.deadline - state.day;
        const hasCar = state.stolenCars.some(sc => sc.carTypeId === order.carTypeId && sc.omgekat);
        const orderValue = Math.floor(carDef.baseValue * (1 + order.bonusPercent / 100));

        return (
          <div key={order.id} className={`game-card ${rarity.bg} border ${rarity.border} p-3`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{order.clientName.includes('Madame') ? '💎' : '🕶️'}</span>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[0.6rem] font-bold">{order.clientName}</span>
                  <span className={`text-[0.45rem] font-bold ${daysLeft <= 2 ? 'text-blood' : 'text-muted-foreground'}`}>
                    {daysLeft > 0 ? `${daysLeft}d over` : 'VERLOPEN'}
                  </span>
                </div>
                <p className="text-[0.5rem] text-muted-foreground">{order.desc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[0.55rem] mt-1.5">
              <span className={`font-bold ${rarity.text}`}>Gezocht: {carDef.name}</span>
              <span className="font-bold text-gold">€{orderValue.toLocaleString()} (+{order.bonusPercent}%)</span>
            </div>
            {hasCar && (
              <div className="text-[0.5rem] text-emerald font-bold mt-1">✓ Je hebt een geschikte auto!</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ChopShopView() {
  const { state } = useGame();
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [tab, setTab] = useState<'cars' | 'orders'>('cars');

  const selected = selectedCar ? state.stolenCars.find(c => c.id === selectedCar) : null;

  return (
    <div>
      <SectionHeader title="Chop Shop" icon={<Wrench size={16} />} badge="Iron Borough" />

      {/* Stats bar */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 game-card bg-muted/30 p-2 text-center">
          <div className="text-[0.5rem] text-muted-foreground">Gestolen</div>
          <div className="text-sm font-bold text-gold">{state.stolenCars.length}</div>
        </div>
        <div className="flex-1 game-card bg-muted/30 p-2 text-center">
          <div className="text-[0.5rem] text-muted-foreground">Clean</div>
          <div className="text-sm font-bold text-emerald">{state.stolenCars.filter(c => c.omgekat).length}</div>
        </div>
        <div className="flex-1 game-card bg-muted/30 p-2 text-center">
          <div className="text-[0.5rem] text-muted-foreground">Orders</div>
          <div className="text-sm font-bold text-ice">{state.carOrders.length}</div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selected ? (
          <CarDetail key="detail" car={selected} onBack={() => setSelectedCar(null)} />
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Tab switcher */}
            <div className="flex gap-1 mb-3">
              <button
                onClick={() => setTab('cars')}
                className={`flex-1 py-2 text-[0.6rem] font-bold uppercase tracking-wider rounded transition-all ${
                  tab === 'cars' ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-muted/30 text-muted-foreground border border-border'
                }`}
              >
                <Car size={12} className="inline mr-1" />Auto's ({state.stolenCars.length})
              </button>
              <button
                onClick={() => setTab('orders')}
                className={`flex-1 py-2 text-[0.6rem] font-bold uppercase tracking-wider rounded transition-all ${
                  tab === 'orders' ? 'bg-ice/15 text-ice border border-ice/30' : 'bg-muted/30 text-muted-foreground border border-border'
                }`}
              >
                <Package size={12} className="inline mr-1" />Orders ({state.carOrders.length})
              </button>
            </div>

            {tab === 'cars' ? (
              state.stolenCars.length === 0 ? (
                <div className="text-center py-8 text-[0.55rem] text-muted-foreground">
                  <Car size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="font-bold mb-1">Geen gestolen auto's</p>
                  <p>Reis tussen districten om auto's tegen te komen die je kunt stelen.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {state.stolenCars.map(car => (
                    <CarCard key={car.id} car={car} onSelect={() => setSelectedCar(car.id)} isNew={car.stolenDay === state.day} />
                  ))}
                </div>
              )
            ) : (
              <OrdersPanel />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
