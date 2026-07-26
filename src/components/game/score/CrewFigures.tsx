import { motion } from 'framer-motion';

/**
 * YOUR CREW, ON SITE.
 *
 * The idle half of the loop used to be six coloured bars twitching in a corner with the
 * label "3 bezig". It was accurate and it read as nothing. These are silhouettes of
 * people, working: they lean into the job, shift their weight, and one of them keeps
 * watch at the edge of the scene. Nothing here is a game mechanic — the mechanic is the
 * per-second work rate — but seeing bodies doing it is what makes the number believable.
 *
 * Drawn small and dark so they sit behind the target without competing with it.
 */

export function CrewFigures({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const shown = names.slice(0, 5);

  return (
    <div className="absolute inset-x-0 bottom-[4.2rem] pointer-events-none">
      <div className="flex items-end justify-center gap-3">
        {shown.map((name, i) => (
          <Worker key={name + i} name={name} index={i} />
        ))}
      </div>
      {names.length > shown.length && (
        <p className="text-center text-[0.4rem] text-emerald/70 mt-0.5">
          +{names.length - shown.length} verder in het donker
        </p>
      )}
    </div>
  );
}

/** One silhouette, hauling. Each gets its own tempo so the group never marches in step. */
function Worker({ name, index }: { name: string; index: number }) {
  const period = 1.1 + index * 0.19;
  const flip = index % 2 === 1;

  return (
    <motion.div
      title={name}
      className="relative"
      animate={{ y: [0, -1.5, 0] }}
      transition={{ duration: period, repeat: Infinity, ease: 'easeInOut', delay: index * 0.13 }}
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
    >
      <svg width="15" height="30" viewBox="0 0 15 30" className="overflow-visible">
        {/* Leaning into the work */}
        <motion.g
          initial={{ rotate: -4 }}
          animate={{ rotate: [-4, 3, -4] }}
          transition={{ duration: period, repeat: Infinity, ease: 'easeInOut', delay: index * 0.13 }}
          style={{ transformOrigin: '7px 28px' }}
        >
          {/* Legs */}
          <path d="M6 20 L4 29 M9 20 L11 29" stroke="hsl(150 35% 16%)" strokeWidth="2.1" strokeLinecap="round" />
          {/* Torso */}
          <path d="M7.5 10 L7 20" stroke="hsl(150 32% 20%)" strokeWidth="4.6" strokeLinecap="round" />
          {/* Head */}
          <circle cx="7.5" cy="6.5" r="3.1" fill="hsl(150 30% 22%)" />
          {/* Arm doing the pulling */}
          <motion.path
            d="M8 12 L13 15"
            stroke="hsl(150 32% 20%)" strokeWidth="2.1" strokeLinecap="round"
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -26, 0] }}
            transition={{ duration: period * 0.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.09 }}
            style={{ transformOrigin: '8px 12px' }}
          />
        </motion.g>
        {/* Faint rim light so they read against a dark plate */}
        <circle cx="9" cy="5" r="3.1" fill="none" stroke="hsl(150 60% 45%)" strokeWidth="0.5" opacity="0.35" />
      </svg>
    </motion.div>
  );
}

/**
 * A lookout at the mouth of the scene, sweeping the street. Present whenever anyone is
 * on site: someone always watches the road.
 */
export function Lookout() {
  return (
    <div className="absolute right-2 bottom-[4.2rem] pointer-events-none">
      <motion.svg
        width="14" height="30" viewBox="0 0 15 30" className="overflow-visible"
        animate={{ rotate: [-7, 7, -7] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '7px 29px' }}
      >
        <path d="M6 20 L5 29 M9 20 L10 29" stroke="hsl(150 30% 14%)" strokeWidth="2.1" strokeLinecap="round" />
        <path d="M7.5 10 L7 20" stroke="hsl(150 28% 17%)" strokeWidth="4.6" strokeLinecap="round" />
        <circle cx="7.5" cy="6.5" r="3.1" fill="hsl(150 26% 19%)" />
        {/* Cigarette ember, because a lookout is always smoking */}
        <motion.circle
          cx="11" cy="7" r="0.8" fill="hsl(20 95% 60%)"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.25, 0.9, 0.25] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.svg>
    </div>
  );
}
