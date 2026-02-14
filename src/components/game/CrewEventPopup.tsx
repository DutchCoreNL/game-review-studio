import { useGame } from '@/contexts/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, MessageCircle } from 'lucide-react';
import { getLoyaltyLabel } from '@/game/crewLoyalty';

export function CrewEventPopup() {
  const { state, dispatch } = useGame();
  const event = state.pendingCrewEvent;
  if (!event) return null;

  const member = state.crew[event.crewIndex];
  const loyaltyInfo = member ? getLoyaltyLabel(member.loyalty) : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/90 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md game-card border-t-[3px] border-t-gold p-4 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-gold" />
              <h2 className="font-display text-sm text-gold uppercase tracking-widest">Crew Verzoek</h2>
            </div>
            <button
              onClick={() => dispatch({ type: 'DISMISS_CREW_EVENT' })}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>

          {/* Crew member info */}
          <div className="flex items-center gap-3 mb-3 p-2 rounded bg-muted/30 border border-border">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Users size={14} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold">{event.crewName}</div>
              <div className="flex items-center gap-2 text-[0.6rem]">
                <span className="text-muted-foreground">{member?.role}</span>
                {loyaltyInfo && (
                  <span className={loyaltyInfo.color}>● {loyaltyInfo.text} ({member?.loyalty})</span>
                )}
                <span className="text-muted-foreground italic capitalize">{event.personality}</span>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="mb-4 p-3 rounded bg-muted/20 border border-border">
            <p className="text-xs leading-relaxed text-foreground">{event.message}</p>
          </div>

          {/* Choices */}
          <div className="space-y-2">
            {event.choices.map(choice => (
              <motion.button
                key={choice.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => dispatch({ type: 'RESOLVE_CREW_EVENT', choiceId: choice.id })}
                className="w-full text-left p-3 rounded border border-border bg-muted/10 hover:bg-gold/10 hover:border-gold/40 transition-all"
              >
                <div className="text-xs font-bold text-gold">{choice.label}</div>
                <div className="text-[0.6rem] text-muted-foreground">{choice.desc}</div>
              </motion.button>
            ))}
          </div>

          {/* Ignore hint */}
          <p className="text-[0.5rem] text-muted-foreground mt-3 text-center">
            Negeren (✕) geeft een klein loyaliteitsverlies
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
