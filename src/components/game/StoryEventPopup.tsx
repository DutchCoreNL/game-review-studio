import { useGame } from '@/contexts/GameContext';
import { getEventText } from '@/game/storyEvents';
import { getPlayerStat } from '@/game/engine';
import { StatId } from '@/game/types';
import { TypewriterText } from './animations/TypewriterText';
import { GameButton } from './ui/GameButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Brain, Star, Flame, AlertTriangle, Dices, Cpu, Heart, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { playDramaticReveal } from '@/game/sounds';
import streetEventBg from '@/assets/street-event-bg.jpg';
import { ArmWrestleGame } from './minigames/ArmWrestleGame';
import { DiceGame } from './minigames/DiceGame';

const STAT_ICONS: Record<StatId, React.ReactNode> = {
  muscle: <Swords size={11} />,
  brains: <Brain size={11} />,
  charm: <Star size={11} />,
};

const STAT_COLORS: Record<StatId, string> = {
  muscle: 'text-blood',
  brains: 'text-ice',
  charm: 'text-gold',
};

const STAT_LABELS: Record<StatId, string> = {
  muscle: 'KRACHT',
  brains: 'VERNUFT',
  charm: 'CHARISMA',
};

export function StoryEventPopup() {
  const { state, dispatch } = useGame();
  const event = state.pendingStreetEvent;
  const [result, setResult] = useState<{ success: boolean; text: string } | null>(null);
  const [textDone, setTextDone] = useState(false);
  const [activeMinigame, setActiveMinigame] = useState<{ type: 'arm_wrestle' | 'dice'; choiceId: string } | null>(null);

  useEffect(() => {
    if (event) playDramaticReveal();
  }, [event?.id]);

  if (!event) return null;

  const text = getEventText(event, state.loc);

  const handleChoice = (choiceId: string, forceResult?: 'success' | 'fail') => {
    dispatch({ type: 'RESOLVE_STREET_EVENT', choiceId, forceResult });
  };

  const handleMinigameComplete = (success: boolean) => {
    if (!activeMinigame) return;
    const choiceId = activeMinigame.choiceId;
    setActiveMinigame(null);
    handleChoice(choiceId, success ? 'success' : 'fail');
  };

  // Determine bet amount from choice effects for dice game
  const getMinigameBet = (): number => {
    if (!activeMinigame) return 300;
    const choice = event.choices.find(c => c.id === activeMinigame.choiceId);
    return choice ? Math.abs(choice.effects.money) || 300 : 300;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10001] bg-black/80 flex items-center justify-center px-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="w-full max-w-md game-panel border-l-[3px] border-l-gold overflow-hidden"
        >
          {/* Banner */}
          <div className="relative h-24 overflow-hidden">
            <img src={streetEventBg} alt="Straatscène" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
            <div className="absolute bottom-2 left-4 flex items-center gap-2">
              <AlertTriangle size={14} className="text-gold" />
              <span className="text-[0.6rem] font-bold text-gold uppercase tracking-widest">Straatgebeurtenis</span>
            </div>
          </div>

          {/* Story text */}
          <div className="px-4 py-4">
            <p className="text-sm text-foreground leading-relaxed font-light min-h-[60px]">
              <TypewriterText text={text} speed={20} onComplete={() => setTextDone(true)} />
            </p>
          </div>

          {/* Choices */}
          {textDone && !result && !state.streetEventResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 pb-4 space-y-2"
            >
              {event.choices.map((choice, idx) => {
                const statVal = getPlayerStat(state, choice.stat);
                const chance = Math.min(95, 100 - choice.difficulty + (statVal * 5));

                return (
                  <motion.div
                    key={choice.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <button
                      onClick={() => {
                        if (choice.minigame) {
                          setActiveMinigame({ type: choice.minigame, choiceId: choice.id });
                        } else {
                          handleChoice(choice.id);
                        }
                      }}
                      className="w-full game-card-interactive p-3 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                            {choice.label}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`flex items-center gap-1 text-[0.55rem] font-bold ${STAT_COLORS[choice.stat]}`}>
                              {STAT_ICONS[choice.stat]}
                              {STAT_LABELS[choice.stat]} ({statVal})
                            </span>
                            {choice.minigame ? (
                              <span className="text-[0.5rem] font-bold text-game-purple flex items-center gap-0.5">
                                {choice.minigame === 'arm_wrestle' ? '💪' : '🎲'} MINI-GAME
                              </span>
                            ) : (
                              <span className={`text-[0.5rem] font-bold ${chance > 70 ? 'text-emerald' : chance > 40 ? 'text-gold' : 'text-blood'}`}>
                                {chance}%
                              </span>
                            )}
                            {choice.effects.heat > 5 && (
                              <span className="text-[0.5rem] text-blood flex items-center gap-0.5">
                                <Flame size={8} /> +{choice.effects.heat}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Result */}
          {state.streetEventResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 pb-4"
            >
              <div className={`game-card border-l-[3px] p-3 mb-3 ${
                state.streetEventResult.success ? 'border-l-emerald' : 'border-l-blood'
              }`}>
                <p className="text-sm text-foreground leading-relaxed font-light">
                  <TypewriterText text={state.streetEventResult.text} speed={15} />
                </p>
              </div>
              <GameButton
                variant={state.streetEventResult.success ? 'gold' : 'muted'}
                size="sm"
                fullWidth
                onClick={() => dispatch({ type: 'DISMISS_STREET_EVENT' })}
              >
                DOORGAAN
              </GameButton>
            </motion.div>
          )}
        </motion.div>

        {/* Mini-game overlays */}
        {activeMinigame?.type === 'arm_wrestle' && (
          <ArmWrestleGame
            playerMuscle={getPlayerStat(state, 'muscle')}
            opponentStrength={Math.min(10, 3 + Math.floor(state.day / 10))}
            opponentName="Havenarbeider"
            onResult={(won) => handleMinigameComplete(won)}
          />
        )}
        {activeMinigame?.type === 'dice' && (
          <DiceGame
            bet={getMinigameBet()}
            isPrison={false}
            onResult={(won) => handleMinigameComplete(won)}
            onClose={() => { setActiveMinigame(null); }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
