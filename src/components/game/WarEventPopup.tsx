import { useGame } from '@/contexts/GameContext';
import { DISTRICTS } from '@/game/constants';
import { GameButton } from './ui/GameButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Crosshair, Handshake, Swords, X } from 'lucide-react';
import { WarTactic } from '@/game/types';

export function WarEventPopup() {
  const { state, dispatch, showToast } = useGame();
  const war = state.pendingWarEvent;
  if (!war) return null;

  const district = DISTRICTS[war.district];

  const tactics: { id: WarTactic; label: string; stat: string; icon: React.ReactNode; desc: string; color: string }[] = [
    { id: 'defend', label: 'VERDEDIGEN', stat: 'Muscle', icon: <Shield size={16} />, desc: 'Standaard verdediging met brute kracht', color: 'text-ice' },
    { id: 'ambush', label: 'HINDERLAAG', stat: 'Brains', icon: <Crosshair size={16} />, desc: 'Risicovol maar hogere winkans + extra buit', color: 'text-gold' },
    { id: 'negotiate', label: 'ONDERHANDELEN', stat: 'Charm', icon: <Handshake size={16} />, desc: 'Betaal geld om de aanval af te kopen', color: 'text-emerald' },
  ];

  const handleTactic = (tactic: WarTactic) => {
    dispatch({ type: 'RESOLVE_WAR_EVENT', tactic });
    showToast(tactic === 'negotiate' ? 'Onderhandeling...' : tactic === 'ambush' ? 'Hinderlaag gezet!' : 'Verdediging ingezet!');
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="game-card border-2 border-blood w-full max-w-md"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <Swords size={20} className="text-blood" />
            <div className="flex-1">
              <h2 className="font-black text-sm text-blood uppercase tracking-wider">⚔️ Oorlog!</h2>
              <p className="text-[0.55rem] text-muted-foreground">{war.attackerName} valt {district?.name} aan!</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-blood/10 border border-blood/30 rounded p-2 text-center">
              <p className="text-[0.45rem] text-muted-foreground uppercase">Aanvalskracht</p>
              <p className="text-lg font-black text-blood">{war.attackStrength}</p>
            </div>
            <div className="bg-ice/10 border border-ice/30 rounded p-2 text-center">
              <p className="text-[0.45rem] text-muted-foreground uppercase">Verdediging</p>
              <p className="text-lg font-black text-ice">{war.defenseLevel}</p>
            </div>
          </div>

          {/* Tactics */}
          <p className="text-[0.55rem] font-bold text-muted-foreground uppercase tracking-wider mb-2">Kies je tactiek:</p>
          <div className="space-y-2">
            {tactics.map(t => (
              <button
                key={t.id}
                onClick={() => handleTactic(t.id)}
                className="w-full game-card bg-muted/50 hover:bg-muted border border-border hover:border-gold/50 transition-all flex items-center gap-3 p-3"
              >
                <div className={`${t.color}`}>{t.icon}</div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">{t.label}</span>
                    <span className="text-[0.45rem] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t.stat}</span>
                  </div>
                  <p className="text-[0.5rem] text-muted-foreground">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
