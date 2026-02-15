import { useGame } from '@/contexts/GameContext';
import { NPC_IMAGES } from '@/assets/items';
import { NpcEvent } from '@/game/npcEvents';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';
import { GameButton } from './ui/GameButton';

export function NpcEventPopup() {
  const { state, dispatch, showToast } = useGame();
  const event = (state as any).pendingNpcEvent as NpcEvent | null;

  if (!event) return null;

  const npcImage = NPC_IMAGES[event.npcId];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/90 z-[9000] flex items-center justify-center p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-sm game-card border-t-[3px] border-t-ice shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-ice flex-shrink-0">
              {npcImage ? (
                <img src={npcImage} alt={event.npcName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <MessageCircle size={20} className="text-ice" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-display text-sm text-ice uppercase tracking-widest">{event.npcName}</h3>
              <p className="text-[0.45rem] text-muted-foreground">Ontmoeting — Dag {event.day}</p>
            </div>
            <button
              onClick={() => dispatch({ type: 'DISMISS_NPC_EVENT' })}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>

          {/* Message */}
          <div className="bg-muted/30 rounded p-3 mb-3 border border-border">
            <p className="text-[0.65rem] leading-relaxed italic text-foreground">{event.message}</p>
          </div>

          {/* Choices */}
          <div className="space-y-2">
            {event.choices.map(choice => (
              <GameButton
                key={choice.id}
                variant="muted"
                size="sm"
                className="w-full text-left"
                onClick={() => dispatch({ type: 'RESOLVE_NPC_EVENT', choiceId: choice.id })}
              >
                <div>
                  <span className="font-bold text-[0.6rem]">{choice.label}</span>
                  <span className="text-[0.45rem] text-muted-foreground ml-2">{choice.desc}</span>
                </div>
              </GameButton>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
