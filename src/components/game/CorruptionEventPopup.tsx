import { useGame } from '@/contexts/GameContext';
import { CORRUPT_CONTACTS } from '@/game/constants';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, X } from 'lucide-react';
import { GameButton } from './ui/GameButton';

export function CorruptionEventPopup() {
  const { state, dispatch } = useGame();

  if (!state.pendingCorruptionEvent) return null;

  const event = state.pendingCorruptionEvent;
  const contact = state.corruptContacts.find(c => c.id === event.contactId);
  const def = contact ? CORRUPT_CONTACTS.find(d => d.id === contact.contactDefId) : null;

  const isBetrayal = event.type === 'betrayal';

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className={`w-full max-w-sm game-card border-2 ${isBetrayal ? 'border-blood' : 'border-gold'}`}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        {/* Header */}
        <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${isBetrayal ? 'border-blood/30' : 'border-gold/30'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isBetrayal ? 'bg-blood/20' : 'bg-gold/20'}`}>
            {isBetrayal ? <AlertTriangle size={16} className="text-blood" /> : <Shield size={16} className="text-gold" />}
          </div>
          <div>
            <h3 className={`font-bold text-sm ${isBetrayal ? 'text-blood' : 'text-gold'}`}>
              {isBetrayal ? '⚠️ VERRAAD!' : 'Corruptie Event'}
            </h3>
            {def && (
              <p className="text-[0.5rem] text-muted-foreground">
                {def.icon} {def.name} — {def.title}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <p className="text-[0.65rem] text-foreground leading-relaxed mb-4">
          {event.text}
        </p>

        {/* Dismiss */}
        <GameButton
          variant={isBetrayal ? 'blood' : 'gold'}
          size="sm"
          fullWidth
          onClick={() => dispatch({ type: 'DISMISS_CORRUPTION_EVENT' })}
        >
          BEGREPEN
        </GameButton>
      </motion.div>
    </motion.div>
  );
}
