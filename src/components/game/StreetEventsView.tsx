import { useGame } from '@/contexts/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Trash2, Eye } from 'lucide-react';
import { DISTRICTS } from '@/game/constants';

export function StreetEventsView() {
  const { state, dispatch } = useGame();
  const queue = state.streetEventQueue || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg text-foreground uppercase tracking-widest">Straatgebeurtenissen</h2>
        <p className="text-[0.65rem] text-muted-foreground mt-1">
          Events die je onderweg bent tegengekomen. Open ze wanneer je wilt.
        </p>
      </div>

      {queue.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-xs">
          <p className="text-2xl mb-2">🌙</p>
          <p>Geen openstaande gebeurtenissen.</p>
          <p className="mt-1 text-[0.6rem]">Reis door de stad of voer acties uit om events te triggeren.</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {queue.map((event: any, index: number) => {
            const districtName = event.district ? DISTRICTS[event.district]?.name || event.district : 'Onbekend';
            return (
              <motion.div
                key={event.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                layout
                className="bg-card border border-border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{event.icon || '⚡'}</span>
                      <h3 className="text-sm font-bold text-foreground truncate">{event.title || 'Straatgebeurtenis'}</h3>
                    </div>
                    <p className="text-[0.65rem] text-muted-foreground line-clamp-2">{event.desc || event.text || ''}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[0.6rem] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin size={10} />
                    {districtName}
                  </span>
                  {event.urgency && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[0.5rem] font-bold uppercase tracking-wider ${
                      event.urgency === 'high' ? 'bg-blood/20 text-blood' :
                      event.urgency === 'medium' ? 'bg-gold/20 text-gold' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {event.urgency === 'high' ? 'Urgent' : event.urgency === 'medium' ? 'Belangrijk' : 'Normaal'}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => dispatch({ type: 'OPEN_QUEUED_EVENT', index } as any)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-gold/30 bg-gold/10 text-gold text-[0.65rem] font-bold uppercase tracking-wider hover:bg-gold/20 transition-colors"
                  >
                    <Eye size={12} />
                    Openen
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'DISMISS_QUEUED_EVENT', index } as any)}
                    className="flex items-center justify-center px-3 py-2 rounded border border-border bg-muted/30 text-muted-foreground text-[0.65rem] hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Verwijderen"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}
