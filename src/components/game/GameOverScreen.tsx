import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { Skull, Calendar, DollarSign, Target, Trophy, RotateCcw, Coins } from 'lucide-react';
import { GameButton } from './ui/GameButton';
import { deleteGame } from '@/game/engine';
import { playNegativeSound } from '@/game/sounds';
import { useEffect, useRef, useState } from 'react';
import { GAME_OVER_IMAGES } from '@/assets/items';
import { supabase } from '@/integrations/supabase/client';
import { DEATH_COFFER_PERCENT, DEATH_LEGACY_XP_BONUS, DEATH_LEGACY_XP_MAX } from '@/game/constants';

export function GameOverScreen() {
  const { state, dispatch } = useGame();
  const hasPlayedSound = useRef(false);
  const hasSavedLegacy = useRef(false);
  const [cofferSaved, setCofferSaved] = useState(0);
  const [legacyXpBonus, setLegacyXpBonus] = useState(0);

  useEffect(() => {
    if (!hasPlayedSound.current) {
      hasPlayedSound.current = true;
      playNegativeSound();
    }
  }, []);

  // Save death legacy to server
  useEffect(() => {
    if (!state.gameOver || hasSavedLegacy.current) return;
    hasSavedLegacy.current = true;

    const saveLegacy = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const cofferAmount = Math.floor(state.money * DEATH_COFFER_PERCENT);
      setCofferSaved(cofferAmount);

      // Fetch existing legacy
      const { data: existing } = await supabase
        .from('death_legacy')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const newXpBonus = Math.min(DEATH_LEGACY_XP_MAX, (existing.legacy_xp_bonus || 0) + DEATH_LEGACY_XP_BONUS);
        setLegacyXpBonus(newXpBonus);
        await supabase.from('death_legacy').update({
          coffer_cash: cofferAmount,
          legacy_xp_bonus: newXpBonus,
          death_count: (existing.death_count || 0) + 1,
          last_death_at: new Date().toISOString(),
        }).eq('user_id', user.id);
      } else {
        const newXpBonus = DEATH_LEGACY_XP_BONUS;
        setLegacyXpBonus(newXpBonus);
        await supabase.from('death_legacy').insert({
          user_id: user.id,
          coffer_cash: cofferAmount,
          legacy_xp_bonus: newXpBonus,
          death_count: 1,
          last_death_at: new Date().toISOString(),
        });
      }
    };
    saveLegacy();
  }, [state.gameOver, state.money]);

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
          <p className="text-[0.6rem] uppercase tracking-widest text-blood/70 font-bold mt-1">☠️ PERMADEATH</p>
          <p className="text-xs text-muted-foreground mt-1">
            De straten van Noxhaven zijn meedogenloos. Eén leven, geen tweede kans.
          </p>
        </div>

        {/* Death Legacy Info */}
        {(cofferSaved > 0 || legacyXpBonus > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-card border border-gold/30 rounded-lg p-3 space-y-1.5"
          >
            <p className="text-[0.6rem] uppercase tracking-wider text-gold font-bold">💀 Doodskist & Legacy</p>
            {cofferSaved > 0 && (
              <div className="flex items-center justify-between text-[0.6rem]">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Coins size={11} />
                  <span>Doodskist (10%)</span>
                </div>
                <span className="text-gold font-bold">€{cofferSaved.toLocaleString()}</span>
              </div>
            )}
            {legacyXpBonus > 0 && (
              <div className="flex items-center justify-between text-[0.6rem]">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Trophy size={11} />
                  <span>Legacy XP Bonus</span>
                </div>
                <span className="text-emerald font-bold">+{Math.round(legacyXpBonus * 100)}%</span>
              </div>
            )}
            <p className="text-[0.45rem] text-muted-foreground">
              Beschikbaar bij je volgende run.
            </p>
          </motion.div>
        )}

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
            OPNIEUW BEGINNEN
          </GameButton>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
