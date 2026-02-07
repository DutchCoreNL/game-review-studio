import { useGame } from '@/contexts/GameContext';
import { STORY_ARCS } from '@/game/storyArcs';
import { TypewriterText } from './animations/TypewriterText';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Zap, Brain, Heart } from 'lucide-react';

const STAT_ICONS: Record<string, React.ReactNode> = {
  muscle: <Zap size={10} className="text-blood" />,
  brains: <Brain size={10} className="text-ice" />,
  charm: <Heart size={10} className="text-gold" />,
};

export function StoryArcEvent() {
  const { state, dispatch } = useGame();

  if (!state.pendingArcEvent) return null;

  const { arcId, stepIndex } = state.pendingArcEvent;
  const template = STORY_ARCS.find(a => a.id === arcId);
  if (!template) return null;

  const step = template.steps[stepIndex];
  if (!step) return null;

  const result = state.arcEventResult;

  // District variant text
  const displayText = step.districtVariant?.[state.loc] || step.text;

  // Find the active arc for progress display
  const activeArc = state.activeStoryArcs?.find(a => a.arcId === arcId);
  const stepsTotal = template.steps.length;
  const currentStepNum = (activeArc?.currentStep ?? stepIndex) + 1;

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
          className="w-full max-w-md game-card border-t-[3px] border-t-game-purple p-4 shadow-2xl max-h-[85vh] flex flex-col"
        >
          {/* Header */}
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
                {step.choices.map((choice, idx) => (
                  <motion.button
                    key={choice.id}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + idx * 0.15 }}
                    onClick={() => handleChoice(choice.id)}
                    className="w-full text-left p-2.5 rounded border border-border bg-muted/20 hover:border-game-purple hover:bg-game-purple/5 transition-all active:scale-[0.98] group"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[0.6rem] font-bold text-foreground group-hover:text-game-purple transition-colors">
                        {choice.label}
                      </span>
                      <div className="flex items-center gap-1">
                        {STAT_ICONS[choice.stat]}
                        <span className="text-[0.45rem] text-muted-foreground capitalize">{choice.stat}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[0.45rem] text-muted-foreground">
                      <span>Moeilijkheid: {choice.difficulty}%</span>
                      {choice.effects.money > 0 && <span className="text-emerald">+€{choice.effects.money.toLocaleString()}</span>}
                      {choice.effects.money < 0 && <span className="text-blood">€{choice.effects.money.toLocaleString()}</span>}
                      {choice.effects.dirtyMoney > 0 && <span className="text-dirty">+€{choice.effects.dirtyMoney.toLocaleString()} zwart</span>}
                      {choice.effects.heat > 0 && <span className="text-blood">+{choice.effects.heat} heat</span>}
                      {choice.effects.heat < 0 && <span className="text-emerald">{choice.effects.heat} heat</span>}
                    </div>
                  </motion.button>
                ))}
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
