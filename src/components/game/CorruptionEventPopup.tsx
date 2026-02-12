import { useGame } from '@/contexts/GameContext';
import { CORRUPT_CONTACTS } from '@/game/constants';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, X } from 'lucide-react';
import { GameButton } from './ui/GameButton';
import { CONTACT_IMAGES } from '@/assets/items/index';
import corruptionBg from '@/assets/items/event-corruption.jpg';

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
        className={`w-full max-w-sm game-card border-2 ${isBetrayal ? 'border-blood' : 'border-gold'} overflow-hidden`}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        {/* Banner */}
        <div className="relative h-24 overflow-hidden">
          <img src={corruptionBg} alt="" className={`w-full h-full object-cover ${isBetrayal ? 'hue-rotate-[340deg]' : ''}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
          <div className="absolute bottom-2 left-4 flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${isBetrayal ? 'bg-blood/20 border border-blood/40' : 'bg-gold/20 border border-gold/40'}`}>
              {def && CONTACT_IMAGES[def.id] ? (
                <img src={CONTACT_IMAGES[def.id]} alt={def.name} className="w-full h-full object-cover" />
              ) : isBetrayal ? (
                <AlertTriangle size={16} className="text-blood" />
              ) : (
                <Shield size={16} className="text-gold" />
              )}
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
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-[0.65rem] text-foreground leading-relaxed mb-4">
            {event.text}
          </p>

          <GameButton
            variant={isBetrayal ? 'blood' : 'gold'}
            size="sm"
            fullWidth
            onClick={() => dispatch({ type: 'DISMISS_CORRUPTION_EVENT' })}
          >
            BEGREPEN
          </GameButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
