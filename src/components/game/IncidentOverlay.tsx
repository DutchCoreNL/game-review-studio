import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/contexts/GameContext';
import type { ActiveIncident } from '@/game/incidents';
import { DISTRICTS } from '@/game/constants';
import { BOSS_IMAGES, MARKET_EVENT_IMAGES, CREW_ROLE_IMAGES, BOUNTY_IMAGES, HEIST_IMAGES, DISTRICT_IMAGES } from '@/assets/items';
import { GameButton } from './ui/GameButton';

const SEVERITY_STYLE: Record<string, { border: string; text: string; label: string }> = {
  laag: { border: 'border-t-emerald', text: 'text-emerald', label: 'Klein probleem' },
  gemiddeld: { border: 'border-t-gold', text: 'text-gold', label: 'Serieus' },
  hoog: { border: 'border-t-blood', text: 'text-blood', label: 'Urgent' },
};
/** How badly this is going, washed over the top of the portrait. */
const SEVERITY_WASH: Record<string, string> = {
  laag: 'hsl(var(--emerald)/0.35)',
  gemiddeld: 'hsl(var(--gold)/0.35)',
  hoog: 'hsl(var(--blood)/0.45)',
};

/**
 * Who is at the door, so the decision has a face.
 *
 * When El Serpiente comes for your harbour takings, that ought to be El Serpiente
 * looking at you — the asset library has had portraits of all three bosses sitting
 * unused this whole time. Falls back to the district when there is nobody specific.
 */
function incidentArt(incident: ActiveIncident): string | null {
  if (incident.kind === 'rivaal' && incident.factionId) return BOSS_IMAGES[incident.factionId] || null;
  if (incident.kind === 'politie') return MARKET_EVENT_IMAGES.police_sweep;
  if (incident.kind === 'premiejager') return BOUNTY_IMAGES.hunter;
  if (incident.kind === 'crew') return CREW_ROLE_IMAGES.Enforcer;
  if (incident.kind === 'kans') return HEIST_IMAGES.warehouse || null;
  return incident.district ? DISTRICT_IMAGES[incident.district] : null;
}

/**
 * The decision moment. When the world reacts to your rackets — a rival, the police,
 * or your own crew — the game stops and asks what you do. Every option costs
 * something; there is no free way out.
 *
 * This used to be a dialog box: an emoji, a heading, a paragraph and three text rows.
 * It is the most dramatic beat the game has, so it now opens on whoever is standing in
 * front of you, lit in the severity's colour and drifting slowly, with the stakes of each
 * option pulled out to the right where you can compare them.
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
  const art = incidentArt(incident);

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
          {/* Header: whoever is at the door */}
          <div className="relative h-44 overflow-hidden">
            {art ? (
              <motion.img
                src={art} alt=""
                // Tall enough for a portrait to be a portrait. A 128px header cropped
                // these faces to a mouth; a top-anchored crop cropped them to a hairline.
                className="absolute inset-0 w-full h-full object-cover object-center"
                initial={{ scale: 1.01, y: 0 }}
                animate={{ scale: [1.01, 1.07, 1.01], y: [0, -3, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                style={{ filter: 'brightness(0.85) contrast(1.05)' }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-muted/40 to-background" />
            )}
            {/* The severity bleeds in from the top, and the card fades up from the bottom */}
            <div className="absolute inset-0" style={{ background: `linear-gradient(to top, hsl(var(--card)) 8%, transparent 65%), radial-gradient(circle at 50% 0%, ${SEVERITY_WASH[incident.severity]}, transparent 65%)` }} />
            <motion.div
              className="absolute inset-x-0 top-0 h-0.5"
              style={{ background: SEVERITY_WASH[incident.severity] }}
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5 }}
            />
            <div className="absolute bottom-2 left-0 right-0 px-4 text-center">
              <div className={`text-[0.45rem] font-bold uppercase tracking-[0.22em] ${style.text} mb-0.5`}>
                {incident.icon} {style.label}{districtName ? ` · ${districtName}` : ''}
              </div>
              <h2 className="font-display text-base text-foreground uppercase tracking-wide leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                {incident.title}
              </h2>
            </div>
          </div>

          {/* Fiction */}
          <div className="px-4 pt-2 pb-3">
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
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[0.62rem] font-bold text-foreground">{c.label}</div>
                      <div className="text-[0.48rem] text-muted-foreground mt-0.5">
                        {tooPoor ? 'Je hebt niet genoeg geld' : c.hint}
                      </div>
                    </div>
                    {/* A gamble wears its odds on the outside, so options are comparable. */}
                    {c.successChance != null && (
                      <span className={`shrink-0 text-[0.55rem] font-black tabular-nums ${
                        c.successChance >= 0.6 ? 'text-emerald' : c.successChance >= 0.35 ? 'text-gold' : 'text-blood'
                      }`}>
                        {Math.round(c.successChance * 100)}%
                      </span>
                    )}
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
