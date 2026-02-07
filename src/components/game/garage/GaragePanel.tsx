import { useGame } from '@/contexts/GameContext';
import { VEHICLES, REKAT_COSTS } from '@/game/constants';
import { GameButton } from '../ui/GameButton';
import { StatBar } from '../ui/StatBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Wrench, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export function GaragePanel() {
  const { state, dispatch, showToast } = useGame();
  const [isOmkatting, setIsOmkatting] = useState(false);

  const activeVehicle = VEHICLES.find(v => v.id === state.activeVehicle);
  const activeObj = state.ownedVehicles.find(v => v.id === state.activeVehicle);

  if (!activeVehicle || !activeObj) return null;

  const vehicleHeat = activeObj.vehicleHeat || 0;
  const cooldown = activeObj.rekatCooldown || 0;
  const cost = REKAT_COSTS[state.activeVehicle] || 5000;
  const canAfford = state.money >= cost;
  const canRekat = cooldown <= 0 && canAfford && vehicleHeat > 0;

  const heatLevel = vehicleHeat > 70 ? 'critical' : vehicleHeat > 40 ? 'warning' : 'safe';
  const heatColors = {
    critical: 'text-blood',
    warning: 'text-gold',
    safe: 'text-emerald',
  };

  const handleOmkat = () => {
    if (!canRekat) return;
    setIsOmkatting(true);

    // Delay the dispatch to let the animation play
    setTimeout(() => {
      dispatch({ type: 'REKAT_VEHICLE', vehicleId: state.activeVehicle });
      showToast(`${activeVehicle.name} omgekat! Voertuig heat → 0`);
      setTimeout(() => setIsOmkatting(false), 600);
    }, 1800);
  };

  return (
    <div className="game-card bg-muted/30 p-3 mb-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded bg-gold/15 flex items-center justify-center">
          <Wrench size={14} className="text-gold" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider">Garage</h4>
          <p className="text-[0.5rem] text-muted-foreground">Omkatten & onderhoud</p>
        </div>
      </div>

      {/* Vehicle info */}
      <div className="flex items-center gap-2 mb-2 bg-background/50 rounded px-2.5 py-2 border border-border">
        <Car size={16} className={heatColors[heatLevel]} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[0.65rem] font-bold">{activeVehicle.name}</span>
            <span className={`text-[0.6rem] font-bold ${heatColors[heatLevel]}`}>
              {vehicleHeat}% heat
            </span>
          </div>
          <StatBar
            value={vehicleHeat}
            max={100}
            color={heatLevel === 'critical' ? 'blood' : heatLevel === 'warning' ? 'gold' : 'emerald'}
            height="sm"
          />
        </div>
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

      {/* Omkat animation area */}
      <AnimatePresence mode="wait">
        {isOmkatting ? (
          <motion.div
            key="omkat-anim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-24 rounded-lg border border-gold/30 bg-background/80 overflow-hidden mb-2.5 flex items-center justify-center"
          >
            {/* Sparks animation */}
            <div className="absolute inset-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-gold"
                  initial={{
                    x: '50%',
                    y: '50%',
                    opacity: 0,
                  }}
                  animate={{
                    x: `${20 + Math.random() * 60}%`,
                    y: `${10 + Math.random() * 80}%`,
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.5, 1, 0],
                  }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.15,
                    repeat: 2,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>

            {/* Wrench rotation */}
            <motion.div
              animate={{ rotate: [0, -30, 30, -20, 20, 0] }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            >
              <Wrench size={32} className="text-gold" />
            </motion.div>

            {/* Progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-gold"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.8, ease: 'linear' }}
            />

            {/* Status text */}
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
            {/* Cooldown dots */}
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full border ${
                    i < cooldown
                      ? 'bg-ice/30 border-ice/40'
                      : 'bg-muted border-border'
                  }`}
                />
              ))}
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

      {/* Action button */}
      <GameButton
        variant="gold"
        size="md"
        fullWidth
        icon={<Wrench size={13} />}
        disabled={!canRekat || isOmkatting}
        glow={canRekat && !isOmkatting}
        onClick={handleOmkat}
      >
        {isOmkatting
          ? 'BEZIG MET OMKATTEN...'
          : cooldown > 0
            ? `COOLDOWN (${cooldown}d)`
            : `OMKATTEN — €${cost.toLocaleString()}`}
      </GameButton>

      {!canAfford && cooldown <= 0 && vehicleHeat > 0 && (
        <p className="text-[0.5rem] text-blood text-center mt-1.5 font-semibold">
          Te weinig geld (€{cost.toLocaleString()} nodig)
        </p>
      )}
    </div>
  );
}
