import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLootBoxDef, type LootBoxTier, type LootBoxResult, type LootBoxReward } from '@/game/lootBoxes';
import type { WeaponRarity } from '@/game/weaponGenerator';
import { Button } from '@/components/ui/button';

const RARITY_STYLES: Record<WeaponRarity, { color: string; glow: string; label: string }> = {
  common: { color: 'text-muted-foreground', glow: '0 0% 60%', label: 'COMMON' },
  uncommon: { color: 'text-emerald', glow: '160 60% 45%', label: 'UNCOMMON' },
  rare: { color: 'text-game-purple', glow: '270 60% 55%', label: 'RARE' },
  epic: { color: 'text-gold', glow: '45 90% 55%', label: 'EPIC' },
  legendary: { color: 'text-blood', glow: '0 70% 50%', label: 'LEGENDARY' },
};

interface LootBoxOpeningProps {
  tier: LootBoxTier;
  phase: 'opening' | 'reveal';
  onAnimationComplete: () => void;
  onClose: () => void;
  lastResult: LootBoxResult | null;
}

export function LootBoxOpening({ tier, phase, onAnimationComplete, onClose, lastResult }: LootBoxOpeningProps) {
  const def = getLootBoxDef(tier);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [allRevealed, setAllRevealed] = useState(false);

  // Opening animation timing
  useEffect(() => {
    if (phase === 'opening') {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Sequential reveal of items
  useEffect(() => {
    if (phase === 'reveal' && lastResult && revealIndex < lastResult.rewards.length) {
      const delay = revealIndex === -1 ? 300 : 600;
      const timer = setTimeout(() => {
        const next = revealIndex + 1;
        if (next < lastResult.rewards.length) {
          setRevealIndex(next);
        } else {
          setAllRevealed(true);
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [phase, revealIndex, lastResult]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
    >
      {/* Opening Animation Phase */}
      {phase === 'opening' && (
        <div className="relative flex items-center justify-center">
          {/* Pulsing glow rings */}
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2"
              style={{
                borderColor: `hsl(${def.glowColor} / ${0.4 - i * 0.1})`,
                width: 120 + i * 60,
                height: 120 + i * 60,
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* Central box icon */}
          <motion.div
            className="text-7xl relative z-10"
            initial={{ scale: 0.3, rotateY: 0 }}
            animate={{
              scale: [0.3, 1.2, 0.9, 1],
              rotateY: [0, 180, 360, 720],
            }}
            transition={{ duration: 2.2, ease: 'easeOut' }}
          >
            {def.icon}
          </motion.div>

          {/* Particle burst */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={`p${i}`}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{ background: `hsl(${def.glowColor})` }}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: Math.cos((i / 12) * Math.PI * 2) * 120,
                y: Math.sin((i / 12) * Math.PI * 2) * 120,
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{ duration: 1.2, delay: 1.0 + i * 0.05, ease: 'easeOut' }}
            />
          ))}

          {/* Flash */}
          <motion.div
            className="absolute inset-0 bg-white rounded-full"
            style={{ width: 300, height: 300, marginLeft: -150, marginTop: -150 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0, 3, 5] }}
            transition={{ duration: 0.6, delay: 1.8 }}
          />

          <motion.p
            className={`absolute -bottom-16 text-lg font-black tracking-widest ${def.color}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {def.name.toUpperCase()}
          </motion.p>
        </div>
      )}

      {/* Reveal Phase */}
      {phase === 'reveal' && lastResult && (
        <div className="w-full max-w-md px-4 space-y-4">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-1"
          >
            <p className={`text-sm font-bold ${def.color}`}>{def.icon} {def.name}</p>
            {lastResult.wasPity && (
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs text-gold font-bold"
              >
                ⚡ PITY GEACTIVEERD — Gegarandeerd Epic!
              </motion.p>
            )}
          </motion.div>

          {/* Reward cards */}
          <div className="space-y-2">
            {lastResult.rewards.map((reward, i) => (
              <AnimatePresence key={reward.id}>
                {i <= revealIndex && (
                  <RewardCard reward={reward} index={i} />
                )}
              </AnimatePresence>
            ))}
          </div>

          {/* Close button */}
          <AnimatePresence>
            {allRevealed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center pt-2"
              >
                <Button onClick={onClose} className="px-8">
                  Sluiten
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

function RewardCard({ reward, index }: { reward: LootBoxReward; index: number }) {
  const style = RARITY_STYLES[reward.rarity];

  return (
    <motion.div
      initial={{ opacity: 0, x: -40, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className="relative overflow-hidden"
    >
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border backdrop-blur-sm
          ${reward.rarity === 'legendary'
            ? 'border-blood/50 bg-blood/10'
            : reward.rarity === 'epic'
              ? 'border-gold/50 bg-gold/10'
              : reward.rarity === 'rare'
                ? 'border-game-purple/50 bg-game-purple/10'
                : reward.rarity === 'uncommon'
                  ? 'border-emerald/50 bg-emerald/10'
                  : 'border-border/50 bg-muted/20'
          }`}
      >
        {/* Icon */}
        <motion.div
          initial={{ rotateY: 180 }}
          animate={{ rotateY: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-2xl flex-shrink-0"
        >
          {reward.icon}
        </motion.div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold truncate ${style.color}`}>
              {reward.name}
            </span>
            <span className={`text-[0.5rem] font-bold uppercase px-1.5 py-0.5 rounded ${style.color} bg-current/10`}>
              {style.label}
            </span>
          </div>
          <p className="text-[0.6rem] text-muted-foreground">{reward.description}</p>
        </div>

        {/* Value */}
        {reward.type !== 'money' && (
          <span className="text-[0.6rem] text-muted-foreground flex-shrink-0">
            €{reward.value.toLocaleString()}
          </span>
        )}
      </div>

      {/* Rarity shimmer for epic+ */}
      {(reward.rarity === 'epic' || reward.rarity === 'legendary') && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            background: `linear-gradient(105deg, transparent 30%, hsl(${style.glow} / 0.1) 45%, hsl(${style.glow} / 0.2) 50%, hsl(${style.glow} / 0.1) 55%, transparent 70%)`,
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
      )}
    </motion.div>
  );
}
