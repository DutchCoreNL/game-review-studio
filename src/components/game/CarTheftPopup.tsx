import { useGame } from '@/contexts/GameContext';
import { STEALABLE_CARS } from '@/game/constants';
import { GameButton } from './ui/GameButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, AlertTriangle, Shield, Zap } from 'lucide-react';
import * as Engine from '@/game/engine';

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

export function CarTheftPopup() {
  const { state, dispatch, showToast } = useGame();

  if (!state.pendingCarTheft) return null;

  const carDef = STEALABLE_CARS.find(c => c.id === state.pendingCarTheft!.carTypeId);
  if (!carDef) return null;

  const rarity = RARITY_COLORS[carDef.rarity];
  const brains = Engine.getPlayerStat(state, 'brains');
  const muscle = Engine.getPlayerStat(state, 'muscle');
  const statBonus = Math.floor((brains + muscle) / 2);
  const successChance = Math.min(95, Math.max(20, 100 - carDef.stealDifficulty + statBonus * 2));

  const handleSteal = () => {
    dispatch({ type: 'ATTEMPT_CAR_THEFT' });
  };

  const handleIgnore = () => {
    dispatch({ type: 'DISMISS_CAR_THEFT' });
    showToast('Je loopt door...', false);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="theft-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 z-[9000] backdrop-blur-sm"
        onClick={handleIgnore}
      />
      <motion.div
        key="theft-popup"
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-[9001] max-w-[500px] mx-auto"
      >
        <div className="game-card border-t-[3px] border-t-gold p-4 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              className={`w-12 h-12 rounded-lg ${rarity.bg} border ${rarity.border} flex items-center justify-center`}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-2xl">🚗</span>
            </motion.div>
            <div>
              <h3 className="font-bold text-sm font-display tracking-wider">AUTO GESPOT!</h3>
              <p className="text-[0.55rem] text-muted-foreground">
                Een onbeheerde auto op straat in {state.pendingCarTheft.district === 'crown' ? 'Crown Heights' : state.pendingCarTheft.district === 'neon' ? 'Neon Strip' : state.pendingCarTheft.district === 'iron' ? 'Iron Borough' : state.pendingCarTheft.district === 'low' ? 'Lowrise' : 'Port Nero'}
              </p>
            </div>
          </div>

          {/* Car info */}
          <div className={`${rarity.bg} border ${rarity.border} rounded-lg p-3 mb-3`}>
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="text-xs font-bold">{carDef.name}</span>
                <span className="text-[0.5rem] text-muted-foreground ml-1.5">{carDef.brand}</span>
              </div>
              <span className={`text-[0.45rem] font-bold px-1.5 py-0.5 rounded ${rarity.bg} ${rarity.text} border ${rarity.border}`}>
                {RARITY_LABELS[carDef.rarity]}
              </span>
            </div>
            <p className="text-[0.5rem] text-muted-foreground italic mb-2">"{carDef.desc}"</p>

            <div className="grid grid-cols-3 gap-1.5 text-[0.5rem]">
              <div className="bg-background/50 rounded px-2 py-1.5 text-center">
                <div className="text-muted-foreground">Waarde</div>
                <div className="font-bold text-gold">€{carDef.baseValue.toLocaleString()}</div>
              </div>
              <div className="bg-background/50 rounded px-2 py-1.5 text-center">
                <div className="text-muted-foreground">Succes</div>
                <div className={`font-bold ${successChance > 60 ? 'text-emerald' : successChance > 35 ? 'text-gold' : 'text-blood'}`}>
                  {successChance}%
                </div>
              </div>
              <div className="bg-background/50 rounded px-2 py-1.5 text-center">
                <div className="text-muted-foreground">Heat</div>
                <div className="font-bold text-blood">+{carDef.heatGain}</div>
              </div>
            </div>
          </div>

          {/* Risk assessment */}
          <div className="flex items-start gap-1.5 mb-3 text-[0.5rem] text-muted-foreground bg-muted/30 rounded px-2.5 py-2 border border-border">
            <AlertTriangle size={10} className="mt-0.5 flex-shrink-0 text-gold" />
            <span>
              {successChance > 70 
                ? 'Lage beveiliging. Dit zou makkelijk moeten zijn.'
                : successChance > 45 
                  ? 'Matig beveiligd. Risico op alarm.'
                  : 'Zware beveiliging! Groot risico op politie.'}
            </span>
          </div>

          {/* Stat info */}
          <div className="flex gap-2 mb-3 text-[0.45rem]">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Shield size={9} /> Muscle: {muscle}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Zap size={9} /> Brains: {brains}
            </div>
            <div className="text-muted-foreground">= +{statBonus * 2}% kans</div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <GameButton variant="gold" size="lg" fullWidth glow icon={<Car size={14} />}
              onClick={handleSteal}>
              STEEL DE AUTO
            </GameButton>
            <GameButton variant="muted" size="lg" className="px-6"
              onClick={handleIgnore}>
              LOOP DOOR
            </GameButton>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
