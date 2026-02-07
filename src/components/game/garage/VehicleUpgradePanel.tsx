import { useGame } from '@/contexts/GameContext';
import { VEHICLES, VEHICLE_UPGRADES } from '@/game/constants';
import { VehicleUpgradeType } from '@/game/types';
import { GameButton } from '../ui/GameButton';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Check, Lock } from 'lucide-react';
import { useState } from 'react';

export function VehicleUpgradePanel() {
  const { state, dispatch, showToast } = useGame();
  const [upgrading, setUpgrading] = useState<VehicleUpgradeType | null>(null);

  const activeVehicle = VEHICLES.find(v => v.id === state.activeVehicle);
  const activeObj = state.ownedVehicles.find(v => v.id === state.activeVehicle);

  if (!activeVehicle || !activeObj) return null;

  const upgrades = activeObj.upgrades || {};

  const handleUpgrade = (type: VehicleUpgradeType) => {
    const def = VEHICLE_UPGRADES[type];
    const currentLevel = upgrades[type] || 0;
    if (currentLevel >= def.maxLevel) return;
    const cost = def.costs[currentLevel];
    if (state.money < cost) return;

    setUpgrading(type);
    setTimeout(() => {
      dispatch({ type: 'UPGRADE_VEHICLE', vehicleId: state.activeVehicle, upgradeType: type });
      showToast(`${def.name} verbeterd naar level ${currentLevel + 1}!`);
      setTimeout(() => setUpgrading(null), 400);
    }, 800);
  };

  const upgradeTypes: VehicleUpgradeType[] = ['armor', 'speed', 'storage'];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-1">
        <ArrowUp size={10} className="text-gold" />
        <span className="text-[0.55rem] font-bold text-muted-foreground uppercase tracking-wider">Voertuig Upgrades</span>
      </div>

      {upgradeTypes.map(type => {
        const def = VEHICLE_UPGRADES[type];
        const currentLevel = upgrades[type] || 0;
        const isMaxed = currentLevel >= def.maxLevel;
        const nextCost = !isMaxed ? def.costs[currentLevel] : 0;
        const canAfford = state.money >= nextCost;
        const isUpgrading = upgrading === type;

        // Calculate current total bonus
        const currentBonus = def.bonuses.slice(0, currentLevel).reduce((a, b) => a + b, 0);
        const nextBonus = !isMaxed ? currentBonus + def.bonuses[currentLevel] : currentBonus;

        return (
          <motion.div
            key={type}
            className={`rounded border px-2.5 py-2 transition-all ${
              isUpgrading
                ? 'border-gold/50 bg-gold/5'
                : 'border-border bg-background/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {/* Icon & name */}
              <span className="text-sm">{def.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[0.65rem] font-bold">{def.name}</span>
                  {/* Level dots */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: def.maxLevel }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full border transition-all ${
                          i < currentLevel
                            ? 'bg-gold border-gold/60'
                            : 'bg-muted border-border'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[0.5rem] text-muted-foreground">{def.desc}</p>
                {/* Current stats */}
                {currentLevel > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[0.5rem] text-gold font-semibold">
                      +{currentBonus} {def.unit}
                    </span>
                    {!isMaxed && (
                      <span className="text-[0.5rem] text-muted-foreground">
                        → +{nextBonus} {def.unit}
                      </span>
                    )}
                  </div>
                )}
                {currentLevel === 0 && !isMaxed && (
                  <span className="text-[0.5rem] text-muted-foreground">
                    Volgende: +{def.bonuses[0]} {def.unit}
                  </span>
                )}
              </div>

              {/* Action */}
              <AnimatePresence mode="wait">
                {isUpgrading ? (
                  <motion.div
                    key="upgrading"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, rotate: [0, 10, -10, 0] }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="w-16 flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.4, repeat: 1 }}
                    >
                      <ArrowUp size={16} className="text-gold" />
                    </motion.div>
                  </motion.div>
                ) : isMaxed ? (
                  <motion.div
                    key="maxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-0.5 text-emerald"
                  >
                    <Check size={10} />
                    <span className="text-[0.5rem] font-bold">MAX</span>
                  </motion.div>
                ) : (
                  <motion.div key="buy" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <GameButton
                      variant="gold"
                      size="sm"
                      disabled={!canAfford}
                      onClick={() => handleUpgrade(type)}
                    >
                      €{nextCost.toLocaleString()}
                    </GameButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
