import { motion } from 'framer-motion';
import type { EquipSlot } from '@/game/equipment';
import { CAR_TIER_IMAGES, NETWORK_TIER_IMAGES } from '@/assets/items';

/**
 * WHAT YOU JUST BOUGHT, AS A PICTURE.
 *
 * Uitrusting was twenty purchases described entirely in words, fronted by four emoji.
 * The chain from a rusted crowbar to a thermic lance is one of the most satisfying
 * progressions in the game and none of it was visible.
 *
 * Two tracks get photographs, because the asset library already holds a progression that
 * fits exactly: Voertuig walks a battered van up to a convoy, and Netwerk walks a beat
 * cop up to the mayor. The other two get drawn line-art in the same vocabulary as the job
 * targets — gold on steel — because there is no photograph of "a cellar box that becomes
 * a free-port depot", and drawing it means the icon can grow with the tier.
 *
 * `tier` is 1-based; 0 means you own nothing on this track yet and the plate reads empty.
 */

const GOLD = 'hsl(45 90% 60%)';
const GOLD_DIM = 'hsl(45 45% 40%)';
const STEEL = 'hsl(215 13% 30%)';
const DARK = 'hsl(220 18% 10%)';

export function TierIcon({ slot, tier, owned }: {
  slot: EquipSlot;
  /** 1-based tier to draw. */
  tier: number;
  /** Whether this is gear you already have, or a preview of the next step. */
  owned: boolean;
}) {
  const photo = slot === 'voertuig' ? CAR_TIER_IMAGES[tier] : slot === 'netwerk' ? NETWORK_TIER_IMAGES[tier] : null;

  return (
    <div className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border ${
      owned ? 'border-gold/40' : 'border-border/60'
    }`}>
      {photo ? (
        <>
          {/* These are night photographs, so they need lifting to read at 48px. Gear you
              do not own yet is drained rather than hidden — you still have to see it. */}
          <img src={photo} alt="" className="w-full h-full object-cover"
            style={{ filter: owned ? 'brightness(1.5) contrast(1.1)' : 'brightness(1.15) grayscale(0.85)', opacity: owned ? 1 : 0.65 }} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/55 to-transparent" />
        </>
      ) : (
        <div className={`w-full h-full flex items-center justify-center bg-card ${owned ? '' : 'opacity-60'}`}>
          <svg viewBox="0 0 40 40" className="w-9 h-9">
            {slot === 'gereedschap' && <ToolGlyph tier={tier} />}
            {slot === 'opslag' && <StorageGlyph tier={tier} />}
          </svg>
        </div>
      )}
      {/* A faint sheen on gear you own, so the owned plate reads as live. */}
      {owned && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(115deg, transparent 40%, hsl(45 100% 80% / 0.25) 50%, transparent 60%)' }}
          initial={{ x: '-120%' }}
          animate={{ x: ['-120%', '120%'] }}
          transition={{ duration: 3.4, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
}

/** Koevoet → Slotenset → Snijbrander → Thermische lans → Doorbraakteam. */
function ToolGlyph({ tier }: { tier: number }) {
  if (tier <= 1) {
    // Crowbar: a bent bar.
    return (
      <g stroke={GOLD} strokeWidth={2.6} strokeLinecap="round" fill="none">
        <path d="M12 32 L26 12" />
        <path d="M26 12 q4 -4 7 -1" />
      </g>
    );
  }
  if (tier === 2) {
    // Lockpick set: picks fanned out of a wallet.
    return (
      <g fill="none" strokeLinecap="round">
        <rect x={8} y={24} width={24} height={9} rx={2} fill={STEEL} stroke={GOLD_DIM} strokeWidth={1.2} />
        <path d="M14 24 L11 9 M20 24 L20 8 M26 24 L29 10" stroke={GOLD} strokeWidth={1.7} />
        <path d="M11 9 l2 2 M20 8 l2 2 M29 10 l-2 2" stroke={GOLD} strokeWidth={1.7} />
      </g>
    );
  }
  if (tier === 3) {
    // Cutting torch with a flame.
    return (
      <g>
        <rect x={7} y={20} width={9} height={14} rx={2} fill={STEEL} stroke={GOLD_DIM} strokeWidth={1} />
        <path d="M16 24 L27 19" stroke={GOLD_DIM} strokeWidth={2.4} strokeLinecap="round" />
        <motion.path
          d="M27 19 q6 -1 9 -5 q-2 6 -9 7 z" fill={GOLD}
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.12, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '27px 19px' }}
        />
      </g>
    );
  }
  if (tier === 4) {
    // Thermic lance: a long rod throwing a hot spray.
    return (
      <g>
        <rect x={5} y={17} width={7} height={16} rx={2} fill={STEEL} stroke={GOLD_DIM} strokeWidth={1} />
        <path d="M12 22 L30 16" stroke="hsl(215 14% 45%)" strokeWidth={3} strokeLinecap="round" />
        {[0, 1, 2, 3].map(i => (
          <motion.circle key={i} cx={31} cy={16} r={1.5} fill="hsl(25 100% 62%)"
            initial={{ opacity: 0.9, x: 0, y: 0 }}
            animate={{ opacity: 0, x: 7 + i * 2, y: -4 + i * 3.4 }}
            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.16, ease: 'easeOut' }} />
        ))}
      </g>
    );
  }
  // Breach team: three figures moving in.
  return (
    <g fill={GOLD_DIM}>
      {[9, 19, 29].map((x, i) => (
        <motion.g key={x}
          initial={{ y: 0 }}
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}>
          <circle cx={x} cy={13} r={3} />
          <rect x={x - 3} y={17} width={6} height={12} rx={2} />
        </motion.g>
      ))}
      <rect x={5} y={31} width={30} height={2} rx={1} fill={GOLD} opacity={0.6} />
    </g>
  );
}

/** Kelderbox → Garagebox → Loods → Koelhuis → Vrijhaven-depot. */
function StorageGlyph({ tier }: { tier: number }) {
  if (tier <= 1) {
    // A cellar hatch in the floor.
    return (
      <g>
        <rect x={8} y={16} width={24} height={16} rx={2} fill={STEEL} stroke={GOLD_DIM} strokeWidth={1.2} />
        <line x1={20} y1={16} x2={20} y2={32} stroke={DARK} strokeWidth={1.4} />
        <circle cx={16} cy={24} r={1.6} fill={GOLD} />
      </g>
    );
  }
  if (tier === 2) {
    // Garage with a roller shutter.
    return (
      <g>
        <path d="M6 18 L20 9 L34 18 V33 H6 Z" fill={STEEL} stroke={GOLD_DIM} strokeWidth={1.2} />
        <rect x={11} y={20} width={18} height={13} fill={DARK} />
        {[23, 26, 29, 32].map(y => <line key={y} x1={11} y1={y} x2={29} y2={y} stroke={GOLD_DIM} strokeWidth={0.9} opacity={0.7} />)}
      </g>
    );
  }
  if (tier === 3) {
    // A warehouse: sawtooth roof.
    return (
      <g>
        <path d="M5 16 l6 -6 l6 6 l6 -6 l6 6 l6 -6 v23 H5 Z" fill={STEEL} stroke={GOLD_DIM} strokeWidth={1.1} />
        <rect x={15} y={24} width={10} height={9} fill={DARK} />
      </g>
    );
  }
  if (tier === 4) {
    // Cold store: a chilled unit with frost.
    return (
      <g>
        <rect x={8} y={11} width={24} height={22} rx={2} fill={STEEL} stroke={GOLD_DIM} strokeWidth={1.2} />
        <line x1={20} y1={11} x2={20} y2={33} stroke={DARK} strokeWidth={1.4} />
        {[0, 1, 2].map(i => (
          <motion.path key={i}
            d={`M${11 + i * 9} 16 v4 M${9 + i * 9} 18 h4`}
            stroke="hsl(190 80% 70%)" strokeWidth={1} strokeLinecap="round"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.85, 0.3] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }} />
        ))}
      </g>
    );
  }
  // Free-port depot: stacked containers behind a gantry.
  return (
    <g>
      <rect x={5} y={20} width={13} height={7} rx={1} fill={STEEL} stroke={GOLD_DIM} strokeWidth={0.8} />
      <rect x={20} y={20} width={13} height={7} rx={1} fill="hsl(215 13% 24%)" stroke={GOLD_DIM} strokeWidth={0.8} />
      <rect x={5} y={28} width={13} height={7} rx={1} fill="hsl(215 13% 24%)" stroke={GOLD_DIM} strokeWidth={0.8} />
      <rect x={20} y={28} width={13} height={7} rx={1} fill={STEEL} stroke={GOLD_DIM} strokeWidth={0.8} />
      <path d="M7 18 V7 H33 V18" fill="none" stroke={GOLD} strokeWidth={1.4} />
      <motion.rect
        y={8} width={4} height={4} rx={1} fill={GOLD}
        initial={{ x: 9 }} animate={{ x: [9, 27, 9] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
    </g>
  );
}
