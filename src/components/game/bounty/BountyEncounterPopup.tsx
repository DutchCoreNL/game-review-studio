import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { GameButton } from '../ui/GameButton';
import { Swords, Wind, DollarSign, Skull } from 'lucide-react';

export function BountyEncounterPopup() {
  const { state, dispatch } = useGame();
  const encounter = state.pendingBountyEncounter;

  if (!encounter) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-[400px] game-card border-blood/30 bg-card"
      >
        {/* Header */}
        <div className="text-center mb-3">
          <div className="w-12 h-12 mx-auto bg-blood/20 rounded-full flex items-center justify-center mb-2">
            <Skull size={24} className="text-blood" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-wider text-blood">Premiejager!</h3>
          <p className="text-[0.55rem] text-muted-foreground mt-1">
            <span className="font-bold text-foreground">{encounter.hunterName}</span> heeft je gevonden!
          </p>
          <p className="text-[0.5rem] text-blood mt-0.5">
            Premie: €{encounter.bountyReward.toLocaleString()} • Kracht: {encounter.hunterPower}
          </p>
        </div>

        {/* Choices */}
        <div className="space-y-2">
          <GameButton variant="blood" fullWidth icon={<Swords size={14} />}
            onClick={() => dispatch({ type: 'RESOLVE_BOUNTY_ENCOUNTER', choice: 'fight' })}>
            VECHTEN — Versla de jager (Muscle)
          </GameButton>
          <GameButton variant="gold" fullWidth icon={<Wind size={14} />}
            onClick={() => dispatch({ type: 'RESOLVE_BOUNTY_ENCOUNTER', choice: 'flee' })}>
            VLUCHTEN — Probeer te ontsnappen (Brains)
          </GameButton>
          <GameButton variant="gold" fullWidth icon={<DollarSign size={14} />}
            onClick={() => dispatch({ type: 'RESOLVE_BOUNTY_ENCOUNTER', choice: 'bribe' })}>
            OMKOPEN — €{Math.floor(encounter.bountyReward * 0.4).toLocaleString()} (Charm)
          </GameButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
