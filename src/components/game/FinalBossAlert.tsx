import { useGame } from '@/contexts/GameContext';
import { canTriggerFinalBoss } from '@/game/endgame';
import { GameButton } from './ui/GameButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, AlertTriangle, Shield, Skull, Crown, Zap } from 'lucide-react';
import { useState } from 'react';

export function FinalBossAlert() {
  const { state, dispatch } = useGame();
  const [dismissed, setDismissed] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [introPhase, setIntroPhase] = useState(0);

  const canTrigger = canTriggerFinalBoss(state);
  if (!canTrigger || dismissed) return null;

  const INTRO_LINES = [
    { icon: '📡', text: 'Alle eenheden, dit is Commissaris Decker.', delay: 0 },
    { icon: '🚔', text: 'Operatie Gerechtigheid is nu actief.', delay: 1.2 },
    { icon: '🎯', text: `Doelwit: de zelfbenoemde heerser van Noxhaven.`, delay: 2.4 },
    { icon: '⚠️', text: '"Je hebt lang genoeg de baas gespeeld. Vanavond eindigt het."', delay: 3.6 },
    { icon: '🔥', text: 'Dit is je laatste gevecht. Er is geen weg terug.', delay: 5.0 },
  ];

  const handleStartBoss = () => {
    setShowIntro(true);
    setIntroPhase(0);
    // Auto-advance intro phases
    const timers: ReturnType<typeof setTimeout>[] = [];
    INTRO_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setIntroPhase(i + 1), (INTRO_LINES[i].delay + 0.8) * 1000));
    });
    // Show fight button after all lines
    timers.push(setTimeout(() => setIntroPhase(INTRO_LINES.length + 1), (INTRO_LINES[INTRO_LINES.length - 1].delay + 2) * 1000));
    return () => timers.forEach(clearTimeout);
  };

  const handleFight = () => {
    dispatch({ type: 'START_FINAL_BOSS' });
    setShowIntro(false);
    setDismissed(true);
  };

  // Full-screen dramatic intro
  if (showIntro) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[9998] bg-black/98 flex items-center justify-center p-6 backdrop-blur-md"
      >
        <div className="max-w-md w-full">
          {/* Radio static effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.02, 0.05, 0.02] }}
            transition={{ duration: 0.3, repeat: Infinity }}
            className="absolute inset-0 bg-white pointer-events-none"
          />

          {/* Warning header */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blood/20 border border-blood/50">
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                <AlertTriangle size={16} className="text-blood" />
              </motion.div>
              <span className="text-blood font-bold text-xs tracking-[0.3em] uppercase">
                NOODFREQUENTIE ONDERSCHEPT
              </span>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                <AlertTriangle size={16} className="text-blood" />
              </motion.div>
            </div>
          </motion.div>

          {/* Intro lines */}
          <div className="space-y-4 mb-8">
            {INTRO_LINES.map((line, i) => (
              <AnimatePresence key={i}>
                {introPhase > i && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-start gap-3"
                  >
                    <span className="text-lg flex-shrink-0">{line.icon}</span>
                    <p className={`text-sm ${i === 3 ? 'text-blood font-bold italic' : i === 4 ? 'text-gold font-bold' : 'text-muted-foreground'}`}>
                      {line.text}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </div>

          {/* Fight button */}
          <AnimatePresence>
            {introPhase > INTRO_LINES.length && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="space-y-3"
              >
                <GameButton
                  variant="blood"
                  size="lg"
                  fullWidth
                  glow
                  icon={<Swords size={16} />}
                  onClick={handleFight}
                >
                  CONFRONTEER COMMISSARIS DECKER
                </GameButton>
                <button
                  onClick={() => { setShowIntro(false); }}
                  className="w-full text-[0.55rem] text-muted-foreground py-2 hover:text-foreground transition-colors"
                >
                  Nog niet... (later)
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  // Alert bar on map
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3"
    >
      <div className="game-card border-2 border-blood relative overflow-hidden">
        {/* Pulsing background */}
        <motion.div
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-blood"
        />

        <div className="relative text-center py-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1, repeat: Infinity }}>
              <AlertTriangle size={18} className="text-blood" />
            </motion.div>
            <h3 className="font-display font-bold text-sm text-blood tracking-wider">
              OPERATIE GERECHTIGHEID
            </h3>
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 1, repeat: Infinity }}>
              <AlertTriangle size={18} className="text-blood" />
            </motion.div>
          </div>

          <p className="text-[0.55rem] text-muted-foreground mb-3 px-4">
            Commissaris Decker heeft een grootschalige operatie gelanceerd om jouw imperium neer te halen.
            Dit is je laatste gevecht — versla hem om Noxhaven definitief te claimen.
          </p>

          <div className="flex gap-3 justify-center mb-3 text-[0.5rem]">
            <div className="flex items-center gap-1 text-blood">
              <Skull size={10} />
              <span className="font-bold">NHPD SWAT</span>
            </div>
            <div className="flex items-center gap-1 text-gold">
              <Crown size={10} />
              <span className="font-bold">COMMISSARIS DECKER</span>
            </div>
            <div className="flex items-center gap-1 text-ice">
              <Shield size={10} />
              <span className="font-bold">2 FASES</span>
            </div>
          </div>

          <div className="flex gap-2 px-2">
            <GameButton
              variant="blood"
              size="lg"
              fullWidth
              glow
              icon={<Swords size={14} />}
              onClick={handleStartBoss}
            >
              CONFRONTEER DECKER
            </GameButton>
            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-2 rounded text-[0.55rem] font-bold text-muted-foreground bg-muted border border-border"
            >
              LATER
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
