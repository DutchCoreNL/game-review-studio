import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, TrendingUp, Coins, AlertTriangle } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import {
  getLegacy, legacyIncomeMult, legacyStartCash, computeLegacyGain, canRetire,
  RETIRE_MIN_RESPECT, LEGACY_INCOME_PER_POINT,
} from '@/game/legacy';
import { STORY_ARC_IMAGES, ACHIEVEMENT_IMAGES } from '@/assets/items';
import { GameButton } from './ui/GameButton';
import { StatBar } from './ui/StatBar';

/**
 * DE OPVOLGER — het einde van een run.
 *
 * Handing the empire to a successor is the longest arc the game has: everything you built
 * is wound up and the next generation starts richer for it. It looked like four grey boxes
 * and a red button.
 *
 * It reads as a dynasty now. The head of the screen is the seat of the family, lit and
 * drifting, with the generation numeral over it. Below that is the line itself — a chain
 * of medallions, one per generation, minted for the ones you have completed and hollow for
 * the one you are working towards — which is the first time the prestige loop has been
 * visible at all rather than implied by a number. Retiring is presented as a handover with
 * the three things that carry across held up one at a time, and the button is the
 * ceremony.
 */

/** Medallions for the generations, from the prestige badge set. */
const GEN_BADGE = [
  ACHIEVEMENT_IMAGES.prestige_1, ACHIEVEMENT_IMAGES.prestige_2, ACHIEVEMENT_IMAGES.prestige_3,
  ACHIEVEMENT_IMAGES.prestige_4, ACHIEVEMENT_IMAGES.prestige_5,
];

export function LegacyView() {
  const { state, dispatch, showToast } = useGame();
  const legacy = getLegacy(state);
  const gain = computeLegacyGain(state);
  const eligible = canRetire(state);
  const respect = state.org?.respect || 0;
  const mult = legacyIncomeMult(state);
  const [confirming, setConfirming] = useState(false);

  const projectedPoints = legacy.points + gain;
  const projectedMult = 1 + projectedPoints * LEGACY_INCOME_PER_POINT;
  const gen = legacy.generation + 1;

  return (
    <div className="space-y-3">
      {/* ---- The seat of the family ---- */}
      <div className="relative rounded-xl overflow-hidden border border-gold/30">
        <motion.img
          src={STORY_ARC_IMAGES.erfenis} alt=""
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.06, y: 0 }}
          animate={{ scale: [1.06, 1.14, 1.06], y: [0, -6, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'brightness(0.95) contrast(1.05)', opacity: 0.75 }}
        />
        {/* Kept light enough that the room behind the crest is actually visible; the
            first pass buried it under two layers of card colour. */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/55 to-transparent" />
        {/* Candlelight, because a dynasty should look warm and old */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 85%, hsl(38 90% 55% / 0.25), transparent 65%)' }}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative px-4 pt-5 pb-3.5">
          <div className="flex items-center gap-3">
            <motion.div
              className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-gold/60 shrink-0"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <img src={GEN_BADGE[Math.min(gen, GEN_BADGE.length) - 1]} alt=""
                className="w-full h-full object-cover" style={{ filter: 'brightness(1.25)' }} />
              <motion.div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(120deg, transparent 42%, hsl(45 100% 85% / 0.45) 50%, transparent 58%)' }}
                initial={{ x: '-130%' }}
                animate={{ x: ['-130%', '130%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
              />
            </motion.div>
            <div className="min-w-0">
              <div className="text-[0.45rem] text-gold/80 uppercase tracking-[0.3em]">Generatie</div>
              <div className="font-display text-2xl text-gold leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                {gen}
              </div>
              <p className="text-[0.5rem] text-muted-foreground mt-1">
                {legacy.generation === 0
                  ? 'De grondlegger. Er is nog niets om na te laten.'
                  : `${legacy.generation}e opvolger aan de macht — ${legacy.points} erfenis geërfd.`}
              </p>
            </div>
          </div>

          {/* What the name is currently worth */}
          <div className="grid grid-cols-2 gap-2 mt-3.5">
            <Inherited icon={<TrendingUp size={9} className="text-emerald" />} label="Inkomen"
              value={`×${mult.toFixed(2)}`} tone="text-emerald" />
            <Inherited icon={<Coins size={9} className="text-gold" />} label="Startkapitaal"
              value={`€${legacyStartCash(legacy.points).toLocaleString()}`} tone="text-gold" />
          </div>
        </div>
      </div>

      {/* ---- The line ---- */}
      <div className="game-card p-3">
        <p className="text-[0.45rem] uppercase tracking-[0.22em] text-muted-foreground mb-2.5">De lijn</p>
        <div className="flex items-center gap-1">
          {GEN_BADGE.map((badge, i) => {
            const done = i < legacy.generation;
            const current = i === legacy.generation;
            return (
              <div key={i} className="flex items-center gap-1 min-w-0">
                <motion.div
                  className={`relative w-8 h-8 rounded-full overflow-hidden border-2 shrink-0 ${
                    done ? 'border-gold' : current ? 'border-gold/60' : 'border-border/50'
                  }`}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 320, damping: 18 }}
                  title={`Generatie ${i + 1}`}
                >
                  <img src={badge} alt="" className="w-full h-full object-cover"
                    style={{ filter: done ? 'brightness(1.3)' : current ? 'brightness(1.05)' : 'grayscale(1) brightness(0.5)' }} />
                  {current && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ boxShadow: 'inset 0 0 8px hsl(45 100% 65% / 0.7)' }}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 0.9, 0.3] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                </motion.div>
                {i < GEN_BADGE.length - 1 && (
                  <div className={`h-px flex-1 min-w-[6px] ${i < legacy.generation ? 'bg-gold/60' : 'bg-border/50'}`} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[0.45rem] text-muted-foreground leading-relaxed mt-2.5">
          Elke generatie erft <span className="text-gold font-bold">erfenispunten</span> van de vorige. Elk punt
          geeft permanent <span className="text-emerald font-bold">+{Math.round(LEGACY_INCOME_PER_POINT * 100)}% inkomen</span> en
          meer startkapitaal, dus elke opvolger klimt sneller dan zijn voorganger.
        </p>
      </div>

      {/* ---- The handover ---- */}
      <div className={`game-card p-3 border-l-[3px] ${eligible ? 'border-l-blood' : 'border-l-border'}`}>
        <p className="text-[0.45rem] uppercase tracking-[0.22em] text-muted-foreground mb-2">Doorgeven</p>

        {!eligible ? (
          <>
            <div className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2 mb-2">
              <AlertTriangle size={13} className="text-gold mt-0.5 shrink-0" />
              <span className="text-[0.55rem] text-muted-foreground leading-snug">
                Je organisatie heeft minstens <b className="text-foreground">{RETIRE_MIN_RESPECT} aanzien</b> nodig
                voordat er iets is om na te laten.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StatBar value={respect} max={RETIRE_MIN_RESPECT} color="gold" height="sm" />
              <span className="text-[0.5rem] text-muted-foreground tabular-nums shrink-0">
                {respect}/{RETIRE_MIN_RESPECT}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* The three things that survive you, held up one at a time */}
            <div className="space-y-1.5 mb-3">
              <Carried delay={0} label="Erfenis die je nalaat" value={`+${gain}`} tone="text-gold" />
              <Carried delay={0.12} label="Inkomen voor je opvolger" value={`×${projectedMult.toFixed(2)}`} tone="text-emerald" />
              <Carried delay={0.24} label="Startkapitaal" value={`€${legacyStartCash(projectedPoints).toLocaleString()}`} tone="text-gold" />
            </div>

            {!confirming ? (
              <GameButton variant="blood" size="lg" fullWidth glow onClick={() => setConfirming(true)}>
                <Crown size={14} /> Met pensioen gaan
              </GameButton>
            ) : (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <p className="text-[0.55rem] text-blood text-center font-bold leading-snug">
                  Je crew, je kas, je districten en je level gaan hiermee weg.<br />
                  Alleen de naam blijft.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <GameButton variant="muted" size="sm" onClick={() => setConfirming(false)}>Nog niet</GameButton>
                  <GameButton variant="blood" size="sm" glow
                    onClick={() => {
                      dispatch({ type: 'RETIRE_SUCCESSOR' });
                      showToast(`Generatie ${gen + 1} neemt over! +${gain} erfenis.`);
                      setConfirming(false);
                    }}>
                    Doorgeven
                  </GameButton>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Inherited({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="bg-background/50 backdrop-blur-sm rounded-lg p-2 text-center border border-border/40">
      <div className="flex items-center justify-center gap-1 text-[0.45rem] text-muted-foreground uppercase tracking-wider mb-0.5">
        {icon} {label}
      </div>
      <div className={`text-sm font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function Carried({ label, value, tone, delay }: { label: string; value: string; tone: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center justify-between gap-2 rounded-lg bg-muted/25 px-2.5 py-1.5"
    >
      <span className="text-[0.55rem] text-muted-foreground">{label}</span>
      <span className={`text-[0.7rem] font-black tabular-nums ${tone}`}>{value}</span>
    </motion.div>
  );
}
