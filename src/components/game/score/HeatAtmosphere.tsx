import { motion } from 'framer-motion';
import { heatBand, HEAT_BANDS } from '@/game/heat';

/**
 * The city reacting to how wanted you are.
 *
 * Heat had names and consequences but no presence: at "Gezocht" the screen looked
 * exactly the same as at "Onopvallend", so the pressure was something you read
 * rather than something you felt. This layer puts the police in the scene — a faint
 * wash at the edges at first, then sirens beating harder, then a searchlight
 * sweeping the frame and the whole shot going darker and colder.
 *
 * The band is still *named* in the header tile; this is deliberately wordless so it
 * adds pressure rather than a second label saying the same thing.
 *
 * Purely atmospheric: it never intercepts pointers and reads nothing but the heat
 * value, so it can be dropped over any scene. Animations stick to opacity and
 * transforms with explicit initial values — animating raw SVG geometry attributes
 * is what filled the map screen's console with rejected frames.
 */

export function HeatAtmosphere({ heat }: { heat: number }) {
  const band = heatBand(heat);
  const level = HEAT_BANDS.indexOf(band); // 0 calm .. 3 hunted
  if (level <= 0) return null;

  // How far into "trouble" we are, for scaling the effects smoothly inside a band.
  const intensity = Math.min(1, Math.max(0, (heat - HEAT_BANDS[1].at) / (100 - HEAT_BANDS[1].at)));
  const hunted = level >= 3;
  const marked = level >= 2;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Siren wash from the edges: blue and red alternating, faster as it worsens. */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.10 + intensity * 0.30, 0] }}
        transition={{ duration: hunted ? 1.1 : marked ? 1.8 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'linear-gradient(90deg, hsl(215 90% 55% / 0.75), transparent 45%)' }}
      />
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.10 + intensity * 0.30, 0] }}
        transition={{
          duration: hunted ? 1.1 : marked ? 1.8 : 3.2,
          repeat: Infinity, ease: 'easeInOut',
          delay: (hunted ? 1.1 : marked ? 1.8 : 3.2) / 2,
        }}
        style={{ background: 'linear-gradient(270deg, hsl(0 85% 55% / 0.75), transparent 45%)' }}
      />

      {/* A searchlight crossing the frame once they are actively looking for you. */}
      {marked && (
        <motion.div
          className="absolute -inset-y-8 w-24"
          initial={{ x: '-30%', opacity: 0 }}
          animate={{ x: ['-30%', '130%'], opacity: [0, 0.5, 0] }}
          transition={{ duration: hunted ? 4 : 7, repeat: Infinity, ease: 'linear', repeatDelay: hunted ? 1 : 4 }}
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(45 100% 88% / 0.22), transparent)',
            filter: 'blur(6px)',
            transform: 'skewX(-12deg)',
          }}
        />
      )}

      {/* The night closes in when a raid is a matter of time. Kept light enough that
          the sirens still read through it and the scene stays legible — the header
          tile is what states the band in words, this only has to feel wrong. */}
      {hunted && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ duration: 1.2 }}
          style={{ background: 'radial-gradient(circle at 50% 45%, transparent 38%, hsl(220 40% 4% / 0.85) 100%)' }}
        />
      )}
    </div>
  );
}
