import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { LOOT_BOX_DEFS, type LootBoxTier, type LootBoxResult } from '@/game/lootBoxes';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { LootBoxOpening } from './LootBoxOpening';
import lootboxBg from '@/assets/bg/lootbox-bg.jpg';

const RARITY_LABEL: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export function LootBoxView() {
  const { state, dispatch, showToast } = useGame();
  const [openingTier, setOpeningTier] = useState<LootBoxTier | null>(null);
  const [result, setResult] = useState<LootBoxResult | null>(null);
  const [phase, setPhase] = useState<'select' | 'opening' | 'reveal'>('select');

  const handleOpen = (tier: LootBoxTier) => {
    const def = LOOT_BOX_DEFS.find(b => b.id === tier)!;
    if (state.money < def.price) {
      showToast('Niet genoeg geld!');
      return;
    }
    setOpeningTier(tier);
    setPhase('opening');
    // Dispatch happens after animation completes
  };

  const handleAnimationComplete = () => {
    if (!openingTier) return;
    dispatch({ type: 'OPEN_LOOT_BOX', tier: openingTier });
    // Result is set via the last dispatched state - we read from a callback
    setPhase('reveal');
  };

  const handleClose = () => {
    setOpeningTier(null);
    setResult(null);
    setPhase('select');
  };

  return (
    <div className="relative min-h-full">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={lootboxBg} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 p-4 space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black tracking-wider text-foreground">
            📦 LOOT BOXES
          </h1>
          <p className="text-xs text-muted-foreground">
            Open kisten voor wapens, gear, geld en meer
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <span className="text-gold">💰 €{state.money?.toLocaleString()}</span>
            <span className="text-muted-foreground">
              Pity: {state.lootBoxPity || 0}/10 {(state.lootBoxPity || 0) >= 9 && '⚡'}
            </span>
          </div>
        </div>

        {/* Box Selection */}
        <AnimatePresence mode="wait">
          {phase === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 gap-3"
            >
              {LOOT_BOX_DEFS.map((def, i) => {
                const canAfford = (state.money || 0) >= def.price;
                return (
                  <motion.div
                    key={def.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <button
                      onClick={() => handleOpen(def.id)}
                      disabled={!canAfford}
                      className={`w-full p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 text-left group relative overflow-hidden
                        ${canAfford
                          ? 'border-border/50 hover:border-border hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                          : 'border-border/20 opacity-40 cursor-not-allowed'
                        }
                        bg-gradient-to-br ${def.bgGradient}
                      `}
                    >
                      {/* Glow effect on hover */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-xl"
                        style={{
                          background: `radial-gradient(circle at center, hsl(${def.glowColor} / 0.4), transparent 70%)`,
                        }}
                      />

                      <div className="relative z-10 space-y-2">
                        <div className="text-3xl">{def.icon}</div>
                        <div>
                          <p className={`text-sm font-bold ${def.color}`}>{def.name}</p>
                          <p className="text-[0.6rem] text-muted-foreground">
                            {def.minItems}-{def.maxItems} items
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gold">
                            €{def.price.toLocaleString()}
                          </span>
                          <span className="text-[0.5rem] text-muted-foreground">
                            min {RARITY_LABEL[def.guaranteedMinRarity]}
                          </span>
                        </div>
                      </div>

                      {/* Shimmer effect */}
                      {canAfford && (
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `linear-gradient(105deg, transparent 40%, hsl(${def.glowColor} / 0.08) 45%, hsl(${def.glowColor} / 0.15) 50%, hsl(${def.glowColor} / 0.08) 55%, transparent 60%)`,
                          }}
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                        />
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Opening Animation */}
        <AnimatePresence>
          {(phase === 'opening' || phase === 'reveal') && openingTier && (
            <LootBoxOpening
              tier={openingTier}
              phase={phase}
              onAnimationComplete={handleAnimationComplete}
              onClose={handleClose}
              lastResult={state.lastLootBoxResult || null}
            />
          )}
        </AnimatePresence>

        {/* Stats */}
        {phase === 'select' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-[0.6rem] text-muted-foreground space-y-1"
          >
            <p>Totaal geopend: {state.lootBoxesOpened || 0} kisten</p>
            <p className="text-[0.5rem]">
              Pity systeem: na 10 kisten zonder Epic+ krijg je gegarandeerd Epic
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
