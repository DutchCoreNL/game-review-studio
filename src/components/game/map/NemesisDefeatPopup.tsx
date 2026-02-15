import { useGame } from '@/contexts/GameContext';
import { NEMESIS_ARCHETYPES, NEMESIS_TAUNTS } from '@/game/constants';
import { GameButton } from '../ui/GameButton';
import { motion } from 'framer-motion';
import { Skull, Crown, Eye, Handshake, Flame, Shield } from 'lucide-react';

export function NemesisDefeatPopup() {
  const { state, dispatch } = useGame();
  const nem = state.nemesis;
  if (!nem?.pendingDefeatChoice) return null;

  const archDef = NEMESIS_ARCHETYPES.find(a => a.id === nem.archetype);
  const taunts = NEMESIS_TAUNTS[nem.archetype];
  const loseQuote = taunts?.onLose || '';

  const choices = [
    {
      id: 'execute' as const,
      icon: <Skull size={18} className="text-blood" />,
      title: 'EXECUTEER',
      desc: '+50 Rep, +15 Heat. Opvolger verschijnt sneller en is woedend.',
      color: 'blood' as const,
      details: '🔥 De straten sidderen van angst.',
    },
    {
      id: 'exile' as const,
      icon: <Shield size={18} className="text-muted-foreground" />,
      title: 'VERBAN',
      desc: 'Neutrale opvolger. Geen bonussen of straffen.',
      color: 'muted' as const,
      details: '🚪 Verdreven uit Noxhaven.',
    },
    {
      id: 'recruit' as const,
      icon: <Eye size={18} className="text-emerald" />,
      title: 'REKRUTEER ALS INFORMANT',
      desc: '-25 Rep. Onthult het archetype van de volgende rivaal.',
      color: 'emerald' as const,
      details: '🕵️ Insider informatie over de opvolger.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="game-card max-w-sm w-full border-blood/50 border-2">
        {/* Header */}
        <div className="text-center mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            className="text-3xl mb-2"
          >
            💀
          </motion.div>
          <h3 className="font-display text-lg font-bold text-gold">
            {nem.name} is verslagen!
          </h3>
          {archDef && (
            <p className="text-[0.6rem] text-muted-foreground mt-1">
              {archDef.icon} {archDef.name} — Generatie #{nem.generation}
            </p>
          )}
          {loseQuote && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[0.55rem] text-blood/70 italic mt-2 px-4"
            >
              "{loseQuote}"
            </motion.p>
          )}
        </div>

        {/* Choices */}
        <div className="space-y-2">
          {choices.map((choice, i) => (
            <motion.div
              key={choice.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <button
                onClick={() => dispatch({ type: 'NEMESIS_DEFEAT_CHOICE', choice: choice.id })}
                className={`w-full text-left p-3 rounded border transition-all hover:scale-[1.02] active:scale-95 ${
                  choice.color === 'blood'
                    ? 'border-blood/40 bg-blood/10 hover:bg-blood/20'
                    : choice.color === 'emerald'
                    ? 'border-emerald/40 bg-emerald/10 hover:bg-emerald/20'
                    : 'border-border bg-muted/50 hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  {choice.icon}
                  <div className="flex-1">
                    <div className="font-bold text-xs">{choice.title}</div>
                    <p className="text-[0.55rem] text-muted-foreground mt-0.5">{choice.desc}</p>
                    <p className="text-[0.5rem] text-foreground/60 mt-0.5 italic">{choice.details}</p>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
