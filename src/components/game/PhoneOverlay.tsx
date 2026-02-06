import { useGame } from '@/contexts/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, MailOpen } from 'lucide-react';

export function PhoneOverlay() {
  const { state, dispatch } = useGame();

  if (!state.showPhone) return null;

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
          className="w-full max-w-md game-card border-t-[3px] border-t-gold p-4 shadow-2xl max-h-[80vh] flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-gold" />
              <h2 className="font-display text-sm text-gold uppercase tracking-widest">Berichten</h2>
              {state.phone.unread > 0 && (
                <span className="w-5 h-5 bg-blood text-primary-foreground rounded-full text-[0.5rem] font-bold flex items-center justify-center">
                  {state.phone.unread}
                </span>
              )}
            </div>
            <button onClick={() => dispatch({ type: 'TOGGLE_PHONE' })} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto game-scroll space-y-2">
            {state.phone.messages.length === 0 ? (
              <div className="text-center py-8">
                <Mail size={24} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Geen berichten.</p>
              </div>
            ) : (
              state.phone.messages.map(msg => (
                <motion.button
                  key={msg.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => dispatch({ type: 'READ_MESSAGE', messageId: msg.id })}
                  className={`w-full text-left p-3 rounded border transition-all ${
                    !msg.read
                      ? 'bg-gold/5 border-gold/30'
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">{msg.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[0.6rem] font-bold">{msg.from}</span>
                        <span className="text-[0.45rem] text-muted-foreground">Dag {msg.day}</span>
                      </div>
                      <p className={`text-[0.55rem] leading-relaxed ${
                        msg.type === 'threat' ? 'text-blood' :
                        msg.type === 'warning' ? 'text-gold' :
                        msg.type === 'opportunity' ? 'text-emerald' :
                        'text-muted-foreground'
                      }`}>{msg.text}</p>
                    </div>
                    {!msg.read ? <Mail size={10} className="text-gold flex-shrink-0 mt-1" /> : <MailOpen size={10} className="text-muted-foreground flex-shrink-0 mt-1" />}
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
