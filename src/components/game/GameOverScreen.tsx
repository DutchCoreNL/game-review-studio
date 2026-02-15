import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { Skull, Calendar, DollarSign, Target, Trophy, RotateCcw } from 'lucide-react';
import { GameButton } from './ui/GameButton';
import { deleteGame } from '@/game/engine';
import { playNegativeSound } from '@/game/sounds';
import { useEffect, useRef } from 'react';
import { GAME_OVER_IMAGES } from '@/assets/items';

export function GameOverScreen() {
  const { state, dispatch } = useGame();
  const hasPlayedSound = useRef(false);

  useEffect(() => {
    if (!hasPlayedSound.current) {
      hasPlayedSound.current = true;
      playNegativeSound();
    }
  }, []);

  if (!state.gameOver) return null;

  const stats = [
    { icon: Calendar, label: 'Dagen gespeeld', value: state.stats.daysPlayed },
    { icon: DollarSign, label: 'Totaal verdiend', value: `€${state.stats.totalEarned.toLocaleString()}` },
    { icon: Target, label: 'Missies voltooid', value: state.stats.missionsCompleted },
    { icon: Trophy, label: 'Achievements', value: state.achievements.length },
  ];

  const handleRestart = () => {
    deleteGame();
    dispatch({ type: 'RESET' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center px-6 overflow-hidden"
    >
      {/* Background image */}
      <img src={GAME_OVER_IMAGES.bg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
      <div className="absolute inset-0 bg-background/80" />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 150, damping: 20 }}
        className="w-full max-w-xs text-center space-y-4"
      >
        {/* Skull icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          className="mx-auto w-20 h-20 rounded-full bg-blood/20 flex items-center justify-center border-2 border-blood/50"
        >
          <Skull size={40} className="text-blood" />
        </motion.div>

        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-blood">Game Over</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Je lichaam kon het niet meer aan. Na {state.hospitalizations} ziekenhuisopnames is het voorbij.
          </p>
        </div>

        {/* Stats */}
        <div className="bg-card border border-border rounded-lg p-3 space-y-2">
          <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-bold">Statistieken</p>
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="flex items-center justify-between text-[0.65rem]"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <stat.icon size={12} />
                <span>{stat.label}</span>
              </div>
              <span className="text-foreground font-bold">{stat.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Restart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <GameButton
            variant="blood"
            size="md"
            fullWidth
            icon={<RotateCcw size={14} />}
            onClick={handleRestart}
          >
            TERUG NAAR HOOFDMENU
          </GameButton>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
