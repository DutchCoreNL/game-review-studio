import { useGame } from '@/contexts/GameContext';
import { STORY_ARCS } from '@/game/storyArcs';
import { STORY_ARC_IMAGES } from '@/assets/items';
import { TypewriterText } from './animations/TypewriterText';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Zap, Brain, Heart, Lock, Flame, Shield, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const STAT_ICONS: Record<string, React.ReactNode> = {
  muscle: <Zap size={10} className="text-blood" />,
  brains: <Brain size={10} className="text-ice" />,
  charm: <Heart size={10} className="text-gold" />,
};

const KARMA_THRESHOLD = 20;

// Arc-theme ambient glow colors (semantic tokens)
const ARC_GLOW: Record<string, string> = {
  informant: 'shadow-[0_0_80px_-20px_hsl(var(--ice)/0.3)]',
  erfenis: 'shadow-[0_0_80px_-20px_hsl(var(--gold)/0.3)]',
  rivaal: 'shadow-[0_0_80px_-20px_hsl(var(--blood)/0.3)]',
  dubbelagent: 'shadow-[0_0_80px_-20px_hsl(var(--game-purple)/0.4)]',
  syndicaat: 'shadow-[0_0_80px_-20px_hsl(var(--blood)/0.4)]',
  tunnels: 'shadow-[0_0_80px_-20px_hsl(var(--emerald)/0.3)]',
  bloedgeld: 'shadow-[0_0_80px_-20px_hsl(var(--blood)/0.5)]',
  getuige: 'shadow-[0_0_80px_-20px_hsl(var(--gold)/0.4)]',
};

export function StoryArcEvent() {
  const { state, dispatch } = useGame();
  const [scenePhase, setScenePhase] = useState<'intro' | 'story' | 'choices'>('intro');
  const [introComplete, setIntroComplete] = useState(false);

  if (!state.pendingArcEvent) return null;

  const { arcId, stepIndex } = state.pendingArcEvent;
  const template = STORY_ARCS.find(a => a.id === arcId);
  if (!template) return null;

  const step = template.steps[stepIndex];
  if (!step) return null;

  const result = state.arcEventResult;
  const karma = state.karma || 0;

  const displayText = step.districtVariant?.[state.loc] || step.text;
  const activeArc = state.activeStoryArcs?.find(a => a.arcId === arcId);
  const stepsTotal = template.steps.length;
  const currentStepNum = (activeArc?.currentStep ?? stepIndex) + 1;
  const isClimax = stepIndex >= Math.max(2, stepsTotal - 2);
  const glowClass = ARC_GLOW[arcId] || '';

  const isChoiceLocked = (choice: typeof step.choices[0]) => {
    if (!choice.requiredKarma) return false;
    if (choice.requiredKarma === 'eerbaar' && karma < KARMA_THRESHOLD) return true;
    if (choice.requiredKarma === 'meedogenloos' && karma > -KARMA_THRESHOLD) return true;
    return false;
  };

  const getKarmaLabel = (req: 'eerbaar' | 'meedogenloos') =>
    req === 'eerbaar' ? 'Eerbaar' : 'Meedogenloos';

  const handleChoice = (choiceId: string) => {
    dispatch({ type: 'RESOLVE_ARC_EVENT', arcId, choiceId });
  };

  const handleDismiss = () => {
    dispatch({ type: 'DISMISS_ARC_EVENT' });
  };

  const handleIntroComplete = () => {
    setIntroComplete(true);
    setScenePhase('story');
  };

  // Split text into atmosphere line + main text for cinematic feel
  const atmosphereLine = step.phonePreview;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/95 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm"
      >
        {/* Letterbox bars for climactic steps */}
        {isClimax && (
          <>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 28 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="fixed top-0 left-0 right-0 bg-black z-[10001]"
            />
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 28 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="fixed bottom-0 left-0 right-0 bg-black z-[10001]"
            />
          </>
        )}

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`w-full max-w-md game-card border-t-[3px] border-t-game-purple max-h-[85vh] flex flex-col overflow-hidden ${glowClass}`}
        >
          {/* Banner image with cinematic fade */}
          {STORY_ARC_IMAGES[arcId] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2 }}
              className="relative h-32 overflow-hidden"
            >
              <img src={STORY_ARC_IMAGES[arcId]} alt={template.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
              {/* Ambient overlay based on arc theme */}
              <div className="absolute inset-0 bg-gradient-to-b from-game-purple/10 to-transparent mix-blend-overlay" />
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="text-lg"
                  >
                    {template.icon}
                  </motion.span>
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
            </motion.div>
          )}

          <div className="p-4 flex flex-col flex-1 overflow-hidden">
            {/* Header — only when no banner */}
            {!STORY_ARC_IMAGES[arcId] && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                    className="text-lg"
                  >
                    {template.icon}
                  </motion.span>
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
                <motion.div
                  key={i}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    i < stepIndex ? 'bg-game-purple' :
                    i === stepIndex ? 'bg-game-purple animate-pulse' :
                    'bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Story content */}
            <div className="flex-1 overflow-y-auto game-scroll mb-3">
              {!result ? (
                <>
                  {/* Atmosphere line (cinematic intro) */}
                  {atmosphereLine && scenePhase === 'intro' && !introComplete && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-3 px-2"
                    >
                      <TypewriterText
                        text={atmosphereLine}
                        speed={25}
                        className="text-[0.55rem] italic text-muted-foreground leading-relaxed"
                        onComplete={handleIntroComplete}
                      />
                    </motion.div>
                  )}

                  {/* Main story text */}
                  {(scenePhase !== 'intro' || introComplete || !atmosphereLine) && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-muted/30 rounded p-3 border border-border mb-3"
                    >
                      <TypewriterText
                        text={displayText}
                        speed={18}
                        className="text-[0.65rem] leading-relaxed text-foreground"
                        onComplete={() => setScenePhase('choices')}
                      />
                    </motion.div>
                  )}
                </>
              ) : (
                <ResultPanel result={result} />
              )}

              {/* Choices — show after story text completes */}
              {!result && (scenePhase === 'choices' || (!atmosphereLine && introComplete)) && (
                <ChoiceList
                  choices={step.choices}
                  isChoiceLocked={isChoiceLocked}
                  getKarmaLabel={getKarmaLabel}
                  onChoice={handleChoice}
                  isClimax={isClimax}
                />
              )}
            </div>

            {/* Dismiss button (only after result) */}
            {result && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={handleDismiss}
                className="w-full py-2.5 rounded bg-game-purple/20 border border-game-purple/30 text-game-purple text-[0.6rem] font-bold uppercase tracking-wider hover:bg-game-purple/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Doorgaan</span>
                <ChevronRight size={12} />
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ========== Sub-components ==========

function ResultPanel({ result }: { result: { success: boolean; text: string } }) {
  return (
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
  );
}

interface ChoiceListProps {
  choices: any[];
  isChoiceLocked: (c: any) => boolean;
  getKarmaLabel: (req: 'eerbaar' | 'meedogenloos') => string;
  onChoice: (id: string) => void;
  isClimax: boolean;
}

function ChoiceList({ choices, isChoiceLocked, getKarmaLabel, onChoice, isClimax }: ChoiceListProps) {
  return (
    <div className="space-y-2">
      {/* Atmosphere text before choices on climax */}
      {isClimax && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[0.5rem] italic text-muted-foreground text-center mb-2"
        >
          ✦ Een beslissend moment. Kies wijselijk. ✦
        </motion.p>
      )}

      {choices.map((choice, idx) => {
        const locked = isChoiceLocked(choice);
        const hasKarmaReq = !!choice.requiredKarma;

        return (
          <motion.button
            key={choice.id}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + idx * 0.12 }}
            onClick={() => !locked && onChoice(choice.id)}
            disabled={locked}
            className={`w-full text-left p-2.5 rounded border transition-all active:scale-[0.98] group ${
              locked
                ? 'border-muted/40 bg-muted/10 opacity-60 cursor-not-allowed'
                : hasKarmaReq
                  ? choice.requiredKarma === 'eerbaar'
                    ? 'border-gold/30 bg-gold/5 hover:border-gold/60 hover:bg-gold/10'
                    : 'border-blood/30 bg-blood/5 hover:border-blood/60 hover:bg-blood/10'
                  : isClimax
                    ? 'border-game-purple/40 bg-game-purple/5 hover:border-game-purple hover:bg-game-purple/10'
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
  );
}
