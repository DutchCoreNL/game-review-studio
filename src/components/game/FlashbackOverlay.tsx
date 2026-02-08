import { useGame } from '@/contexts/GameContext';
import { TypewriterText } from './animations/TypewriterText';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import type { EnrichedFlashbackData, FlashbackScene } from '@/game/flashbacks';
import type { FlashbackData } from '@/game/types';

/** Check if flashback data has enriched scene data */
function isEnriched(fb: FlashbackData): fb is EnrichedFlashbackData {
  return 'scenes' in fb && Array.isArray((fb as any).scenes) && (fb as any).scenes.length > 0;
}

function SceneCard({ scene, index, isActive, onComplete }: {
  scene: FlashbackScene;
  index: number;
  isActive: boolean;
  onComplete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isActive ? 1 : 0.3, x: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="relative pl-4 border-l-2"
      style={{
        borderColor: scene.success
          ? 'hsl(var(--emerald, 142 71% 45%))' 
          : 'hsl(var(--blood, 0 72% 51%))',
      }}
    >
      {/* Scene marker */}
      <div
        className="absolute -left-[5px] top-0 w-2 h-2 rounded-full"
        style={{
          background: scene.success
            ? 'hsl(var(--emerald, 142 71% 45%))'
            : 'hsl(var(--blood, 0 72% 51%))',
        }}
      />

      {/* Choice label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0.4 }}
        className="text-[0.5rem] text-muted-foreground uppercase tracking-[0.15em] mb-1"
      >
        Stap {index + 1}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 0.9 : 0.3 }}
        className="text-[0.6rem] font-bold text-foreground/90 mb-1"
      >
        „{scene.choiceLabel}"
      </motion.p>

      {/* Outcome text with typewriter (only for active scene) */}
      {isActive ? (
        <TypewriterText
          text={scene.outcomeText}
          speed={25}
          className="text-[0.55rem] text-foreground/60 italic leading-relaxed block"
          onComplete={onComplete}
        />
      ) : (
        <p className="text-[0.55rem] text-foreground/20 italic leading-relaxed">
          {scene.outcomeText}
        </p>
      )}

      {/* Karma indicator */}
      {scene.karma !== 0 && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isActive ? 0.7 : 0.2, scale: 1 }}
          className={`inline-block mt-1 text-[0.45rem] ${
            scene.karma > 0 ? 'text-gold' : 'text-blood'
          }`}
        >
          {scene.karma > 0 ? '✦ Eerbaar' : '✦ Meedogenloos'}
        </motion.span>
      )}
    </motion.div>
  );
}

function EnrichedFlashback({ data, onDismiss }: { data: EnrichedFlashbackData; onDismiss: () => void }) {
  // Phases: 0 = intro, 1..N = scenes, N+1 = epilogue, N+2 = done
  const totalPhases = 1 + data.scenes.length + 1;
  const [phase, setPhase] = useState(0);

  const advance = useCallback(() => {
    setPhase(prev => Math.min(prev + 1, totalPhases));
  }, [totalPhases]);

  const allDone = phase >= totalPhases;
  const isIntro = phase === 0;
  const isEpilogue = phase === data.scenes.length + 1;
  const activeSceneIndex = phase - 1; // -1 means intro, 0+ means scene index

  return (
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      className="w-full max-w-sm relative"
    >
      {/* Arc icon */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-3"
      >
        <span className="text-3xl opacity-60">{data.arcIcon}</span>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.5 }}
        className="text-center font-display text-[0.5rem] text-muted-foreground uppercase tracking-[0.3em] mb-1"
      >
        {data.title}
      </motion.h2>

      {/* Success/failure badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.7 }}
        className="text-center mb-5"
      >
        <span className={`text-[0.45rem] uppercase tracking-[0.2em] ${
          data.success ? 'text-emerald' : 'text-blood'
        }`}>
          {data.success ? '— Voltooid —' : '— Gefaald —'}
        </span>
      </motion.div>

      {/* Content area */}
      <div className="min-h-[200px] max-h-[55vh] overflow-y-auto game-scroll pr-1">
        {/* Intro */}
        {isIntro && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <TypewriterText
              text={data.lines[0]}
              speed={35}
              className="text-xs text-foreground/70 italic leading-relaxed"
              onComplete={advance}
            />
          </motion.div>
        )}

        {/* Scenes timeline */}
        {phase >= 1 && (
          <div className="space-y-4 mb-4">
            {data.scenes.map((scene, i) => {
              if (i > activeSceneIndex && !isEpilogue && !allDone) return null;
              return (
                <SceneCard
                  key={i}
                  scene={scene}
                  index={i}
                  isActive={i === activeSceneIndex}
                  onComplete={advance}
                />
              );
            })}
          </div>
        )}

        {/* Epilogue */}
        {isEpilogue && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-4 pt-4 border-t border-muted/20"
          >
            <TypewriterText
              text={data.epilogue}
              speed={30}
              className="text-[0.6rem] text-foreground/60 leading-relaxed"
              onComplete={advance}
            />
          </motion.div>
        )}
      </div>

      {/* Continue button */}
      {allDone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          <button
            onClick={onDismiss}
            className="px-6 py-2 text-[0.55rem] text-muted-foreground/60 uppercase tracking-[0.2em] hover:text-foreground/80 transition-colors"
          >
            Doorgaan...
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

function SimpleFlashback({ data, onDismiss }: { data: FlashbackData; onDismiss: () => void }) {
  const [lineIndex, setLineIndex] = useState(0);
  const allLinesShown = lineIndex >= data.lines.length;

  const handleAdvance = useCallback(() => {
    if (lineIndex < data.lines.length) {
      setLineIndex(prev => prev + 1);
    }
  }, [lineIndex, data.lines.length]);

  return (
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      className="w-full max-w-sm relative"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-4"
      >
        <span className="text-3xl opacity-60">{data.icon}</span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.5 }}
        className="text-center font-display text-[0.5rem] text-muted-foreground uppercase tracking-[0.3em] mb-6"
      >
        {data.title}
      </motion.h2>

      <div className="space-y-4 min-h-[120px]">
        {data.lines.slice(0, lineIndex + 1).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: i === lineIndex ? 1 : 0.4, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {i === lineIndex ? (
              <TypewriterText
                text={line}
                speed={35}
                className="text-xs text-foreground/80 italic leading-relaxed"
                onComplete={handleAdvance}
              />
            ) : (
              <p className="text-xs text-foreground/30 italic leading-relaxed">{line}</p>
            )}
          </motion.div>
        ))}
      </div>

      {allLinesShown && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <button
            onClick={onDismiss}
            className="px-6 py-2 text-[0.55rem] text-muted-foreground/60 uppercase tracking-[0.2em] hover:text-foreground/80 transition-colors"
          >
            Doorgaan...
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

export function FlashbackOverlay() {
  const { state, dispatch } = useGame();
  const flashback = state.pendingFlashback;

  if (!flashback) return null;

  const handleDismiss = () => {
    dispatch({ type: 'DISMISS_FLASHBACK' });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 z-[10001] flex items-center justify-center p-6"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(15,10,5,0.98) 50%, rgba(0,0,0,0.95) 100%)',
        }}
      >
        {/* Film grain effect */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
          }}
        />

        {/* Letterbox bars */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-black" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-black" />

        {/* Vignette effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
          }}
        />

        {isEnriched(flashback) ? (
          <EnrichedFlashback data={flashback} onDismiss={handleDismiss} />
        ) : (
          <SimpleFlashback data={flashback} onDismiss={handleDismiss} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
