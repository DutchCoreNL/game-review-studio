import { useGame } from '@/contexts/GameContext';
import { TypewriterText } from './animations/TypewriterText';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import type { CinematicMoment, CinematicChoice } from '@/game/cinematics';
import { playDramaticReveal } from '@/game/sounds';
import { useEffect } from 'react';

const CATEGORY_COLORS: Record<string, string> = {
  milestone: 'text-blood',
  confrontation: 'text-gold',
  betrayal: 'text-blood',
  power: 'text-gold',
};

function ChoiceButton({ choice, index, onSelect }: {
  choice: CinematicChoice;
  index: number;
  onSelect: (id: string) => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15, type: 'spring', damping: 20 }}
      onClick={() => onSelect(choice.id)}
      className="w-full text-left p-3 border border-border/30 rounded bg-card/40 hover:bg-card/70 hover:border-gold/40 transition-all group"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg opacity-70 group-hover:opacity-100 transition-opacity">{choice.icon}</span>
        <div className="flex-1">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-foreground/90">{choice.label}</p>
          <p className="text-[0.5rem] text-muted-foreground mt-0.5">{choice.desc}</p>
          {/* Effect indicators */}
  <div className="flex gap-2 mt-1 flex-wrap">
            {choice.effects.rep && choice.effects.rep > 0 && (
              <span className="text-[0.45rem] text-emerald">+{choice.effects.rep} Rep</span>
            )}
            {choice.effects.rep && choice.effects.rep < 0 && (
              <span className="text-[0.45rem] text-blood">{choice.effects.rep} Rep</span>
            )}
            {choice.effects.karma && choice.effects.karma > 0 && (
              <span className="text-[0.45rem] text-gold">+{choice.effects.karma} Karma</span>
            )}
            {choice.effects.karma && choice.effects.karma < 0 && (
              <span className="text-[0.45rem] text-blood">{choice.effects.karma} Karma</span>
            )}
            {choice.effects.heat && choice.effects.heat > 0 && (
              <span className="text-[0.45rem] text-gold">+{choice.effects.heat} Heat</span>
            )}
            {choice.effects.money && choice.effects.money > 0 && (
              <span className="text-[0.45rem] text-emerald">+€{choice.effects.money.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export function CinematicOverlay() {
  const { state, dispatch } = useGame();
  const cinematic = state.pendingCinematic as CinematicMoment | null;

  const [sceneIndex, setSceneIndex] = useState(0);
  const [sceneTextDone, setSceneTextDone] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [result, setResult] = useState<{ text: string; choiceId: string } | null>(null);
  const [resultTextDone, setResultTextDone] = useState(false);

  useEffect(() => {
    if (cinematic) {
      playDramaticReveal();
      setSceneIndex(0);
      setSceneTextDone(false);
      setShowChoices(false);
      setResult(null);
      setResultTextDone(false);
    }
  }, [cinematic?.id]);

  if (!cinematic) return null;

  const currentScene = cinematic.scenes[sceneIndex];
  const isLastScene = sceneIndex >= cinematic.scenes.length - 1;
  const hasChoices = cinematic.choices && cinematic.choices.length > 0;

  const handleSceneComplete = () => {
    setSceneTextDone(true);
  };

  const handleAdvance = () => {
    if (!sceneTextDone) return;

    if (!isLastScene) {
      setSceneIndex(prev => prev + 1);
      setSceneTextDone(false);
    } else if (hasChoices) {
      setShowChoices(true);
    } else {
      // Reveal-only cinematic
      setShowChoices(true); // reuse to show reveal text
    }
  };

  const handleChoice = (choiceId: string) => {
    const choice = cinematic.choices?.find(c => c.id === choiceId);
    if (choice) {
      setResult({ text: choice.resultText, choiceId });
    }
  };

  const handleDismiss = () => {
    if (result) {
      dispatch({ type: 'RESOLVE_CINEMATIC', cinematicId: cinematic.id, choiceId: result.choiceId });
    } else {
      dispatch({ type: 'DISMISS_CINEMATIC' });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2 }}
        className="fixed inset-0 z-[10002] flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.97) 0%, rgba(10,5,2,0.99) 50%, rgba(0,0,0,0.97) 100%)',
        }}
      >
        {/* Film grain */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.7\' numOctaves=\'5\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.6\'/%3E%3C/svg%3E")',
          }}
        />

        {/* Cinematic letterbox bars */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 48 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-0 left-0 right-0 bg-black z-10"
        />
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 48 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute bottom-0 left-0 right-0 bg-black z-10"
        />

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
          }}
        />

        {/* Ambient glow based on category */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: cinematic.category === 'power'
              ? 'radial-gradient(ellipse at 50% 60%, hsl(45 100% 50% / 0.1) 0%, transparent 70%)'
              : cinematic.category === 'betrayal'
              ? 'radial-gradient(ellipse at 50% 60%, hsl(0 72% 51% / 0.1) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at 50% 60%, hsl(200 50% 50% / 0.08) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div className="relative z-20 w-full max-w-sm px-6">
          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.8, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="text-center mb-2"
          >
            <span className="text-4xl">{cinematic.icon}</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center font-bold text-sm uppercase tracking-[0.2em] text-foreground/90 mb-1"
          >
            {cinematic.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.9 }}
            className={`text-center text-[0.5rem] uppercase tracking-[0.3em] mb-6 ${CATEGORY_COLORS[cinematic.category]}`}
          >
            {cinematic.subtitle}
          </motion.p>

          {/* Scene text area */}
          {!showChoices && (
            <motion.div
              key={`scene-${sceneIndex}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="min-h-[100px] mb-6"
              onClick={handleAdvance}
            >
              {currentScene.atmosphere ? (
                <p className="text-[0.6rem] text-foreground/40 italic text-center leading-relaxed">
                  <TypewriterText text={currentScene.atmosphere} speed={30} onComplete={handleSceneComplete} />
                </p>
              ) : (
                <p className="text-xs text-foreground/80 text-center leading-relaxed">
                  <TypewriterText text={currentScene.text} speed={25} onComplete={handleSceneComplete} />
                </p>
              )}

              {/* Tap to continue */}
              {sceneTextDone && !isLastScene && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ delay: 0.5 }}
                  className="text-center text-[0.45rem] text-muted-foreground mt-4 uppercase tracking-widest"
                >
                  Tik om door te gaan...
                </motion.p>
              )}

              {sceneTextDone && isLastScene && !showChoices && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ delay: 0.5 }}
                  className="text-center text-[0.45rem] text-muted-foreground mt-4 uppercase tracking-widest cursor-pointer"
                  onClick={handleAdvance}
                >
                  {hasChoices ? 'Tik voor je keuze...' : 'Tik om door te gaan...'}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Choices or reveal */}
          {showChoices && !result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {hasChoices ? (
                <div className="space-y-2 mb-4">
                  {cinematic.choices!.map((choice, i) => (
                    <ChoiceButton key={choice.id} choice={choice} index={i} onSelect={handleChoice} />
                  ))}
                </div>
              ) : (
                /* Reveal text (no choices) */
                <div className="min-h-[60px] mb-6">
                  <p className="text-xs text-foreground/80 text-center leading-relaxed italic">
                    <TypewriterText text={cinematic.revealText || ''} speed={25} onComplete={() => setResultTextDone(true)} />
                  </p>
                  {resultTextDone && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-center mt-6"
                    >
                      <button
                        onClick={handleDismiss}
                        className="px-6 py-2 text-[0.55rem] text-muted-foreground/60 uppercase tracking-[0.2em] hover:text-foreground/80 transition-colors border border-border/20 rounded"
                      >
                        Doorgaan...
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Result text */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="min-h-[60px]"
            >
              <p className="text-xs text-foreground/80 text-center leading-relaxed">
                <TypewriterText text={result.text} speed={20} onComplete={() => setResultTextDone(true)} />
              </p>
              {resultTextDone && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center mt-6"
                >
                  <button
                    onClick={handleDismiss}
                    className="px-6 py-2 text-[0.55rem] text-muted-foreground/60 uppercase tracking-[0.2em] hover:text-foreground/80 transition-colors border border-border/20 rounded"
                  >
                    Doorgaan...
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
