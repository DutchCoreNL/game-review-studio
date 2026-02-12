import { useGame } from '@/contexts/GameContext';
import { STORY_ARCS } from '@/game/storyArcs';
import { STORY_ARC_IMAGES } from '@/assets/items';
import { TypewriterText } from './animations/TypewriterText';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Zap, Brain, Heart, Lock, Flame, Shield } from 'lucide-react';

const STAT_ICONS: Record<string, React.ReactNode> = {
  muscle: <Zap size={10} className="text-blood" />,
  brains: <Brain size={10} className="text-ice" />,
  charm: <Heart size={10} className="text-gold" />,
};

const KARMA_THRESHOLD = 20;

export function StoryArcEvent() {
  const { state, dispatch } = useGame();

  if (!state.pendingArcEvent) return null;

  const { arcId, stepIndex } = state.pendingArcEvent;
  const template = STORY_ARCS.find(a => a.id === arcId);
  if (!template) return null;

  const step = template.steps[stepIndex];
  if (!step) return null;

  const result = state.arcEventResult;
  const karma = state.karma || 0;

  // District variant text
  const displayText = step.districtVariant?.[state.loc] || step.text;

  // Find the active arc for progress display
  const activeArc = state.activeStoryArcs?.find(a => a.arcId === arcId);
  const stepsTotal = template.steps.length;
  const currentStepNum = (activeArc?.currentStep ?? stepIndex) + 1;

  // Check karma eligibility for a choice
  const isChoiceLocked = (choice: typeof step.choices[0]) => {
    if (!choice.requiredKarma) return false;
    if (choice.requiredKarma === 'eerbaar' && karma < KARMA_THRESHOLD) return true;
    if (choice.requiredKarma === 'meedogenloos' && karma > -KARMA_THRESHOLD) return true;
    return false;
  };

  const getKarmaLabel = (req: 'eerbaar' | 'meedogenloos') => {
    return req === 'eerbaar' ? 'Eerbaar' : 'Meedogenloos';
  };

  const handleChoice = (choiceId: string) => {
    dispatch({ type: 'RESOLVE_ARC_EVENT', arcId, choiceId });
  };

  const handleDismiss = () => {
    dispatch({ type: 'DISMISS_ARC_EVENT' });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/95 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md game-card border-t-[3px] border-t-game-purple shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Banner image */}
          {STORY_ARC_IMAGES[arcId] && (
            <div className="relative -mx-0 h-28 overflow-hidden">
              <img src={STORY_ARC_IMAGES[arcId]} alt={template.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{template.icon}</span>
                  <div>
                    <h2 className="font-display text-sm text-game-purple uppercase tracking-widest drop-shadow-lg">{template.name}</h2>
                    <span className="text-[0.5rem] text-muted-foreground">Stap {currentStepNum}/{stepsTotal}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen size={12} className="text-game-purple" />
                  <span className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">Verhaalboog</span>
                </div>
              </div>
            </div>
          )}
          <div className="p-4 flex flex-col flex-1 overflow-hidden">
          {/* Header — only when no banner */}
          {!STORY_ARC_IMAGES[arcId] && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{template.icon}</span>
                <div>
                  <h2 className="font-display text-sm text-game-purple uppercase tracking-widest">{template.name}</h2>
                  <span className="text-[0.5rem] text-muted-foreground">Stap {currentStepNum}/{stepsTotal}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen size={12} className="text-game-purple" />
                <span className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">Verhaalboog</span>
              </div>
            </div>
          )}

          {/* Progress dots */}
          <div className="flex gap-1 mb-3">
            {template.steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i < stepIndex ? 'bg-game-purple' :
                  i === stepIndex ? 'bg-game-purple animate-pulse' :
                  'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Story text */}
          <div className="flex-1 overflow-y-auto game-scroll mb-3">
            {!result ? (
              <div className="bg-muted/30 rounded p-3 border border-border mb-3">
                <TypewriterText
                  text={displayText}
                  speed={20}
                  className="text-[0.65rem] leading-relaxed text-foreground"
                />
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded p-3 border mb-3 ${
                  result.success
                    ? 'bg-emerald/5 border-emerald/30'
                    : 'bg-blood/5 border-blood/30'
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs">{result.success ? '✓' : '✗'}</span>
                  <span className={`text-[0.6rem] font-bold ${result.success ? 'text-emerald' : 'text-blood'}`}>
                    {result.success ? 'GELUKT' : 'MISLUKT'}
                  </span>
                </div>
                <TypewriterText
                  text={result.text}
                  speed={15}
                  className={`text-[0.6rem] leading-relaxed ${result.success ? 'text-emerald' : 'text-blood'}`}
                />
              </motion.div>
            )}

            {/* Choices */}
            {!result && (
              <div className="space-y-2">
                {step.choices.map((choice, idx) => {
                  const locked = isChoiceLocked(choice);
                  const hasKarmaReq = !!choice.requiredKarma;

                  return (
                    <motion.button
                      key={choice.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + idx * 0.15 }}
                      onClick={() => !locked && handleChoice(choice.id)}
                      disabled={locked}
                      className={`w-full text-left p-2.5 rounded border transition-all active:scale-[0.98] group ${
                        locked
                          ? 'border-muted/40 bg-muted/10 opacity-60 cursor-not-allowed'
                          : hasKarmaReq
                            ? choice.requiredKarma === 'eerbaar'
                              ? 'border-gold/30 bg-gold/5 hover:border-gold/60 hover:bg-gold/10'
                              : 'border-blood/30 bg-blood/5 hover:border-blood/60 hover:bg-blood/10'
                            : 'border-border bg-muted/20 hover:border-game-purple hover:bg-game-purple/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          {locked && <Lock size={10} className="text-muted-foreground" />}
                          {!locked && hasKarmaReq && (
                            choice.requiredKarma === 'eerbaar'
                              ? <Shield size={10} className="text-gold" />
                              : <Flame size={10} className="text-blood" />
                          )}
                          <span className={`text-[0.6rem] font-bold transition-colors ${
                            locked
                              ? 'text-muted-foreground'
                              : hasKarmaReq
                                ? choice.requiredKarma === 'eerbaar'
                                  ? 'text-gold group-hover:text-gold'
                                  : 'text-blood group-hover:text-blood'
                                : 'text-foreground group-hover:text-game-purple'
                          }`}>
                            {choice.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {STAT_ICONS[choice.stat]}
                          <span className="text-[0.45rem] text-muted-foreground capitalize">{choice.stat}</span>
                        </div>
                      </div>

                      {/* Karma requirement badge */}
                      {hasKarmaReq && (
                        <div className="flex items-center gap-1 mb-0.5">
                          {locked ? (
                            <span className="text-[0.4rem] text-muted-foreground italic">
                              Vereist: {getKarmaLabel(choice.requiredKarma!)} alignment (karma {choice.requiredKarma === 'eerbaar' ? `> ${KARMA_THRESHOLD}` : `< -${KARMA_THRESHOLD}`})
                            </span>
                          ) : (
                            <span className={`text-[0.4rem] italic ${
                              choice.requiredKarma === 'eerbaar' ? 'text-gold/70' : 'text-blood/70'
                            }`}>
                              ✦ {getKarmaLabel(choice.requiredKarma!)} pad
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[0.45rem] text-muted-foreground">
                        <span>Moeilijkheid: {choice.difficulty}%</span>
                        {choice.effects.money > 0 && <span className="text-emerald">+€{choice.effects.money.toLocaleString()}</span>}
                        {choice.effects.money < 0 && <span className="text-blood">€{choice.effects.money.toLocaleString()}</span>}
                        {choice.effects.dirtyMoney > 0 && <span className="text-dirty">+€{choice.effects.dirtyMoney.toLocaleString()} zwart</span>}
                        {choice.effects.heat > 0 && <span className="text-blood">+{choice.effects.heat} heat</span>}
                        {choice.effects.heat < 0 && <span className="text-emerald">{choice.effects.heat} heat</span>}
                        {choice.effects.karma && choice.effects.karma > 0 && <span className="text-gold">+{choice.effects.karma} karma</span>}
                        {choice.effects.karma && choice.effects.karma < 0 && <span className="text-blood">{choice.effects.karma} karma</span>}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dismiss button (only after result) */}
          {result && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={handleDismiss}
              className="w-full py-2 rounded bg-game-purple/20 border border-game-purple/30 text-game-purple text-[0.6rem] font-bold uppercase tracking-wider hover:bg-game-purple/30 transition-all"
            >
              Doorgaan
            </motion.button>
          )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
