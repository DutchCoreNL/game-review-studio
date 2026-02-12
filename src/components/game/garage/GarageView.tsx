import { useGame } from '@/contexts/GameContext';
import { VEHICLES, REKAT_COSTS, UNIQUE_VEHICLES } from '@/game/constants';
import { GameButton } from '../ui/GameButton';
import { StatBar } from '../ui/StatBar';
import { SectionHeader } from '../ui/SectionHeader';
import { VehicleUpgradePanel } from './VehicleUpgradePanel';
import { VehiclePreview } from './VehiclePreview';
import { VehicleComparePanel } from './VehicleComparePanel';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Wrench, Clock, ShieldCheck, AlertTriangle, Gauge, Shield, Gem, Flame, Check, Lock, Trophy } from 'lucide-react';
import { useState } from 'react';
import { VEHICLE_IMAGES } from '@/assets/items';

export function GarageView() {
  const { state, dispatch, showToast } = useGame();
  const [isOmkatting, setIsOmkatting] = useState(false);

  const activeVehicle = VEHICLES.find(v => v.id === state.activeVehicle);
  const activeObj = state.ownedVehicles.find(v => v.id === state.activeVehicle);
  const ownedIds = state.ownedVehicles.map(v => v.id);

  if (!activeVehicle || !activeObj) return null;

  const vehicleHeat = activeObj.vehicleHeat || 0;
  const cooldown = activeObj.rekatCooldown || 0;
  const cost = REKAT_COSTS[state.activeVehicle] || 5000;
  const canAfford = state.money >= cost;
  const canRekat = cooldown <= 0 && canAfford && vehicleHeat > 0;
  const heatLevel = vehicleHeat > 70 ? 'critical' : vehicleHeat > 40 ? 'warning' : 'safe';

  const handleOmkat = () => {
    if (!canRekat) return;
    setIsOmkatting(true);
    setTimeout(() => {
      dispatch({ type: 'REKAT_VEHICLE', vehicleId: state.activeVehicle });
      showToast(`${activeVehicle.name} omgekat! Voertuig heat → 0`);
      setTimeout(() => setIsOmkatting(false), 600);
    }, 1800);
  };

  return (
    <div>
      {/* ===== A. ACTIEF VOERTUIG ===== */}
      <SectionHeader title="Actief Voertuig" icon={<Car size={12} />} />
      <motion.div
        className="game-card border-l-[3px] border-l-gold mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Large Vehicle Preview */}
        <VehiclePreview
          vehicleId={state.activeVehicle}
          vehicleName={activeVehicle.name}
          upgrades={activeObj.upgrades || {}}
          heatLevel={heatLevel}
        />

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <MiniStat icon={<Car size={10} />} label="Opslag" value={activeVehicle.storage} />
          <MiniStat icon={<Gauge size={10} />} label="Snelheid" value={activeVehicle.speed} />
          <MiniStat icon={<Shield size={10} />} label="Pantser" value={activeVehicle.armor} />
          <MiniStat icon={<Gem size={10} />} label="Charm" value={activeVehicle.charm} />
        </div>

        {/* Condition bar */}
        <StatBar
          value={activeObj.condition}
          max={100}
          color={activeObj.condition > 50 ? 'emerald' : 'blood'}
          label="Conditie"
          showLabel
        />

        {/* Heat bar */}
        <div className="flex items-center gap-2 text-xs mt-2 mb-2">
          <span className="text-muted-foreground flex items-center gap-1">
            <Flame size={10} className="text-blood" /> Heat:
          </span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${vehicleHeat > 70 ? 'bg-blood' : vehicleHeat > 40 ? 'bg-gold' : 'bg-emerald'}`}
              style={{ width: `${vehicleHeat}%` }}
            />
          </div>
          <span className={`font-bold ${vehicleHeat > 50 ? 'text-blood' : ''}`}>{vehicleHeat}%</span>
        </div>

        {/* Heat warning */}
        {heatLevel !== 'safe' && (
          <div className={`flex items-start gap-1.5 mb-2.5 text-[0.55rem] rounded px-2 py-1.5 ${
            heatLevel === 'critical'
              ? 'bg-blood/10 text-blood border border-blood/20'
              : 'bg-gold/10 text-gold border border-gold/20'
          }`}>
            <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
            <span>
              {heatLevel === 'critical'
                ? 'Kritiek! Hoge kans op checkpoints en onderschepping.'
                : 'Verhoogd risico op checkpoints bij transport.'}
            </span>
          </div>
        )}

        {/* Omkat animation / cooldown / clean status */}
        <AnimatePresence mode="wait">
          {isOmkatting ? (
            <motion.div
              key="omkat-anim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative h-24 rounded-lg border border-gold/30 bg-background/80 overflow-hidden mb-2.5 flex items-center justify-center"
            >
              <div className="absolute inset-0">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-gold"
                    initial={{ x: '50%', y: '50%', opacity: 0 }}
                    animate={{
                      x: `${20 + Math.random() * 60}%`,
                      y: `${10 + Math.random() * 80}%`,
                      opacity: [0, 1, 1, 0],
                      scale: [0, 1.5, 1, 0],
                    }}
                    transition={{ duration: 0.8, delay: i * 0.15, repeat: 2, ease: 'easeOut' }}
                  />
                ))}
              </div>
              <motion.div animate={{ rotate: [0, -30, 30, -20, 20, 0] }} transition={{ duration: 1.5, ease: 'easeInOut' }}>
                <Wrench size={32} className="text-gold" />
              </motion.div>
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-gold"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.8, ease: 'linear' }}
              />
              <motion.span
                className="absolute bottom-2.5 text-[0.55rem] font-bold text-gold uppercase tracking-wider"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                Kenteken wijzigen...
              </motion.span>
            </motion.div>
          ) : cooldown > 0 ? (
            <motion.div
              key="cooldown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-3 mb-2.5"
            >
              <Clock size={16} className="text-muted-foreground" />
              <div className="flex-1">
                <p className="text-[0.65rem] font-bold text-muted-foreground">Cooldown actief</p>
                <p className="text-[0.5rem] text-muted-foreground">
                  Nog <span className="text-ice font-bold">{cooldown}</span> dag{cooldown !== 1 ? 'en' : ''} voordat je opnieuw kunt omkatten
                </p>
              </div>
            </motion.div>
          ) : vehicleHeat === 0 ? (
            <motion.div
              key="clean"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 rounded-lg border border-emerald/20 bg-emerald/5 px-3 py-3 mb-2.5"
            >
              <ShieldCheck size={16} className="text-emerald" />
              <p className="text-[0.6rem] font-semibold text-emerald">
                Voertuig is schoon — geen omkatten nodig.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex gap-2">
          {activeObj.condition < 100 && (
            <GameButton
              variant="blood"
              size="sm"
              fullWidth
              icon={<Wrench size={12} />}
              onClick={() => { dispatch({ type: 'REPAIR_VEHICLE' }); showToast('Auto gerepareerd!'); }}
            >
              REPAREER (€{(100 - activeObj.condition) * 25})
            </GameButton>
          )}
          <GameButton
            variant="gold"
            size="sm"
            fullWidth
            icon={<Wrench size={13} />}
            disabled={!canRekat || isOmkatting}
            glow={canRekat && !isOmkatting}
            onClick={handleOmkat}
          >
            {isOmkatting
              ? 'BEZIG...'
              : cooldown > 0
                ? `COOLDOWN (${cooldown}d)`
                : `OMKATTEN — €${cost.toLocaleString()}`}
          </GameButton>
        </div>
        {!canAfford && cooldown <= 0 && vehicleHeat > 0 && (
          <p className="text-[0.5rem] text-blood text-center mt-1.5 font-semibold">
            Te weinig geld (€{cost.toLocaleString()} nodig)
          </p>
        )}
      </motion.div>

      {/* ===== B. VERGELIJK ===== */}
      <VehicleComparePanel />

      {/* ===== C. UPGRADES ===== */}
      <SectionHeader title="Voertuig Upgrades" icon={<Wrench size={12} />} />
      <div className="game-card mb-4">
        <VehicleUpgradePanel />
      </div>

      {/* ===== C. VOERTUIGCOLLECTIE ===== */}
      <SectionHeader title="Voertuigcollectie" icon={<Car size={12} />} />

      {/* Owned vehicles */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {state.ownedVehicles.map(ov => {
          const vDef = VEHICLES.find(v => v.id === ov.id)!;
          const isActive = ov.id === state.activeVehicle;
          return (
            <motion.div
              key={ov.id}
              className={`game-card p-0 overflow-hidden ${
                isActive ? 'ring-2 ring-gold border-gold' : ''
              }`}
              whileTap={{ scale: 0.97 }}
            >
              <div className="relative h-20 bg-muted">
                {VEHICLE_IMAGES[ov.id] ? (
                  <img src={VEHICLE_IMAGES[ov.id]} alt={vDef.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car size={24} className="text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 bg-gold text-secondary-foreground text-[0.45rem] font-bold px-1.5 py-0.5 rounded">
                    ACTIEF
                  </div>
                )}
              </div>
              <div className="p-2">
                <h4 className="font-bold text-[0.65rem] truncate">{vDef.name}</h4>
                <p className="text-[0.5rem] text-muted-foreground">
                  Conditie: {ov.condition}% · Heat: <span className={(ov.vehicleHeat || 0) > 50 ? 'text-blood font-bold' : ''}>{ov.vehicleHeat || 0}%</span>
                </p>
                {!isActive && (
                  <GameButton
                    variant="gold"
                    size="sm"
                    fullWidth
                    className="mt-1.5"
                    onClick={() => { dispatch({ type: 'SET_VEHICLE', id: ov.id }); showToast(`${vDef.name} geselecteerd`); }}
                  >
                    GEBRUIK
                  </GameButton>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Vehicles to buy */}
      {VEHICLES.filter(v => !ownedIds.includes(v.id)).length > 0 && (
        <>
          <SectionHeader title="Te Koop" icon={<Car size={12} />} />
          <div className="grid grid-cols-2 gap-2 mb-4">
            {VEHICLES.filter(v => !ownedIds.includes(v.id)).map(v => (
              <motion.div
                key={v.id}
                className="game-card p-0 overflow-hidden opacity-80"
              >
                <div className="relative h-20 bg-muted">
                  {VEHICLE_IMAGES[v.id] ? (
                    <img src={VEHICLE_IMAGES[v.id]} alt={v.name} className="w-full h-full object-cover grayscale" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car size={24} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                  <div className="absolute top-1.5 right-1.5 bg-muted text-muted-foreground text-[0.45rem] font-bold px-1.5 py-0.5 rounded border border-border">
                    €{v.cost.toLocaleString()}
                  </div>
                </div>
                <div className="p-2">
                  <h4 className="font-bold text-[0.65rem] truncate">{v.name}</h4>
                  <p className="text-[0.45rem] text-muted-foreground mb-1.5">
                    S:{v.storage} · Spd:{v.speed} · Arm:{v.armor} · Ch:{v.charm}
                  </p>
                  <GameButton
                    variant="gold"
                    size="sm"
                    fullWidth
                    disabled={state.money < v.cost}
                    onClick={() => { dispatch({ type: 'BUY_VEHICLE', id: v.id }); showToast(`${v.name} gekocht!`); }}
                  >
                    KOOP
                  </GameButton>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* ===== D. UNIEKE VOERTUIGEN ===== */}
      <SectionHeader title="Unieke Voertuigen" icon={<Trophy size={12} />} badge={`${UNIQUE_VEHICLES.filter(uv => state.ownedVehicles.some(ov => ov.id === uv.id)).length}/${UNIQUE_VEHICLES.length}`} badgeColor="gold" />
      <div className="grid grid-cols-2 gap-2 mb-4">
        {UNIQUE_VEHICLES.map(uv => {
          const owned = state.ownedVehicles.some(ov => ov.id === uv.id);
          return (
            <motion.div
              key={uv.id}
              className={`game-card p-0 overflow-hidden ${owned ? 'ring-2 ring-gold border-gold' : 'opacity-60'}`}
            >
              <div className={`relative h-20 ${owned ? 'bg-gold/10' : 'bg-muted'}`}>
                {VEHICLE_IMAGES[uv.id] ? (
                  <img src={VEHICLE_IMAGES[uv.id]} alt={uv.name} className={`w-full h-full object-cover ${owned ? '' : 'grayscale brightness-50'}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {owned ? (
                      <span className="text-2xl">{uv.icon}</span>
                    ) : (
                      <Lock size={24} className="text-muted-foreground/30" />
                    )}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                {owned && (
                  <div className="absolute top-1.5 right-1.5 bg-gold text-secondary-foreground text-[0.45rem] font-bold px-1.5 py-0.5 rounded">
                    👑 UNIEK
                  </div>
                )}
              </div>
              <div className="p-2">
                <h4 className="font-bold text-[0.65rem] truncate">{owned ? uv.name : '???'}</h4>
                {owned ? (
                  <>
                    <p className="text-[0.45rem] text-muted-foreground mb-1">{uv.desc}</p>
                    <p className="text-[0.4rem] text-gold">
                      S:{uv.storage} · Spd:{uv.speed > 0 ? '+' : ''}{uv.speed} · Arm:+{uv.armor} · Ch:+{uv.charm}
                    </p>
                    <GameButton
                      variant="gold"
                      size="sm"
                      fullWidth
                      className="mt-1.5"
                      disabled={state.activeVehicle === uv.id}
                      onClick={() => { dispatch({ type: 'SET_VEHICLE', id: uv.id }); showToast(`${uv.name} geselecteerd`); }}
                    >
                      {state.activeVehicle === uv.id ? 'ACTIEF' : 'GEBRUIK'}
                    </GameButton>
                  </>
                ) : (
                  <p className="text-[0.45rem] text-blood">🔒 {uv.unlockCondition}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-muted/50 rounded p-1.5 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">{icon}</div>
      <div className="text-[0.45rem] text-muted-foreground uppercase">{label}</div>
      <div className="text-xs font-bold">{value}</div>
    </div>
  );
}
