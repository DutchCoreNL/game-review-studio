import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/contexts/GameContext';
import type { ActiveIncident } from '@/game/incidents';
import { DISTRICTS } from '@/game/constants';
import { GameButton } from './ui/GameButton';

const SEVERITY_STYLE: Record<string, { border: string; text: string; label: string }> = {
  laag: { border: 'border-t-emerald', text: 'text-emerald', label: 'Klein probleem' },
  gemiddeld: { border: 'border-t-gold', text: 'text-gold', label: 'Serieus' },
  hoog: { border: 'border-t-blood', text: 'text-blood', label: 'Urgent' },
};

/**
 * The decision moment. When the world reacts to your rackets — a rival, the police,
 * or your own crew — the game stops and asks what you do. Every option costs
 * something; there is no free way out.
 */
export function IncidentOverlay() {
  const { state, dispatch } = useGame();
  const incident = state.activeIncident as ActiveIncident | null | undefined;
  const result = state.lastIncidentResult;

  // Result card: what your decision led to.
  if (!incident && result) {
    return (
      <AnimatePresence>
        <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/85 z-[9998] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => dispatch({ type: 'CLEAR_INCIDENT_RESULT' })}>
          <motion.div initial={{ scale: 0.9, y: 15 }} animate={{ scale: 1, y: 0 }}
            className="w-full max-w-sm game-card border-t-[3px] border-t-gold p-4 text-center"
            onClick={e => e.stopPropagation()}>
            <div className="text-3xl mb-2">{result.icon}</div>
            <h3 className="font-display text-sm text-gold uppercase tracking-wider mb-2">{result.title}</h3>
            <p className="text-[0.6rem] text-foreground/85 leading-relaxed mb-4">{result.message}</p>
            <GameButton variant="gold" size="md" fullWidth onClick={() => dispatch({ type: 'CLEAR_INCIDENT_RESULT' })}>
              Verder
            </GameButton>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!incident) return null;

  const style = SEVERITY_STYLE[incident.severity] || SEVERITY_STYLE.gemiddeld;
  const districtName = incident.district ? (DISTRICTS[incident.district]?.name || incident.district) : null;

  return (
    <AnimatePresence>
      <motion.div key="incident" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/90 z-[9998] flex items-center justify-center p-4 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className={`w-full max-w-sm game-card border-t-[3px] ${style.border} overflow-hidden`}
        >
          {/* Header */}
          <div className="p-4 pb-3 text-center border-b border-border/40">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}
              className="text-4xl mb-1.5">
              {incident.icon}
            </motion.div>
            <div className={`text-[0.45rem] font-bold uppercase tracking-widest ${style.text} mb-1`}>
              {style.label}{districtName ? ` · ${districtName}` : ''}
            </div>
            <h2 className="font-display text-sm text-foreground uppercase tracking-wide">{incident.title}</h2>
          </div>

          {/* Fiction */}
          <div className="px-4 py-3">
            <p className="text-[0.62rem] text-foreground/85 leading-relaxed">{incident.body}</p>
          </div>

          {/* Choices */}
          <div className="px-3 pb-3 space-y-1.5">
            {incident.choices.map((c, i) => {
              const tooPoor = !!c.costMoney && state.money < c.costMoney;
              return (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  disabled={tooPoor}
                  onClick={() => dispatch({ type: 'RESOLVE_INCIDENT', choiceId: c.id })}
                  whileTap={tooPoor ? {} : { scale: 0.97 }}
                  className={`w-full text-left rounded-lg border px-3 py-2 transition-all ${
                    tooPoor
                      ? 'border-border/30 bg-muted/10 opacity-50 cursor-not-allowed'
                      : 'border-border/60 bg-muted/20 hover:border-gold/50 hover:bg-gold/5'
                  }`}
                >
                  <div className="text-[0.62rem] font-bold text-foreground">{c.label}</div>
                  <div className="text-[0.48rem] text-muted-foreground mt-0.5">
                    {tooPoor ? 'Je hebt niet genoeg geld' : c.hint}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
