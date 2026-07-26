import { motion } from 'framer-motion';
import type { OrgMember } from '@/game/organization';
import { TRAIT_BY_ID } from '@/game/rackets';

/**
 * YOUR CREW, WITH FACES.
 *
 * These are the people you spend the entire game with — you recruit them, pay them,
 * promote them, watch their loyalty slide and get them hurt answering incidents — and
 * every one of them was a name in a row next to a generic icon.
 *
 * A photograph per trait was the obvious move and the wrong one: with a dozen crew you
 * would be looking at four faces repeated three times each, which reads worse than no
 * face at all. So each portrait is generated from the member's own id: the same person
 * always looks the same, and no two look alike. Head shape, headwear, coat colour,
 * stubble and one accessory come out of a hash, which gives well over a thousand
 * combinations from a handful of parts.
 *
 * The ring around the portrait is their loyalty, so the picture is also the readout: a
 * crew member about to walk out is visibly running out of ring.
 */

/** Small deterministic hash so a given id always produces the same face. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Pushed apart deliberately: at 40 pixels, neighbouring shades of grey are the same
// shade of grey, so each coat has to be its own colour.
const COAT = [
  'hsl(215 26% 32%)', 'hsl(355 34% 30%)', 'hsl(155 26% 27%)',
  'hsl(35 38% 32%)', 'hsl(265 24% 34%)', 'hsl(195 30% 26%)',
];
const SKIN = [
  'hsl(28 36% 66%)', 'hsl(26 34% 50%)', 'hsl(22 30% 38%)',
  'hsl(32 38% 76%)', 'hsl(18 26% 30%)', 'hsl(28 32% 58%)',
];
type Head = 'cap' | 'hood' | 'bare' | 'beanie' | 'slick';

/** Trait drives the rim light, so you can read a spook from a brawler at a glance. */
const TRAIT_RIM: Record<string, string> = {
  meedogenloos: 'hsl(0 75% 55%)',
  straatslim: 'hsl(45 90% 58%)',
  gladjanus: 'hsl(280 60% 62%)',
  spook: 'hsl(190 70% 60%)',
  roekeloos: 'hsl(25 90% 58%)',
};

export function CrewPortrait({ member, size = 40, day = 0 }: {
  member: OrgMember;
  size?: number;
  /** Current game day, to tell an injured member from a working one. */
  day?: number;
}) {
  const h = hash(member.id || member.name);
  const coat = COAT[h % COAT.length];
  const skin = SKIN[(h >> 3) % SKIN.length];
  const head: Head = (['cap', 'hood', 'bare', 'beanie', 'slick'] as Head[])[(h >> 6) % 5];
  const stubble = ((h >> 9) % 3) === 0;
  const accessory = (h >> 11) % 4; // 0 none, 1 earring, 2 scar, 3 cigarette
  const rim = TRAIT_RIM[member.trait || ''] || 'hsl(45 40% 45%)';

  const injured = !!member.injuredUntilDay && member.injuredUntilDay > day;
  const resting = !member.assignment && !injured;

  // The loyalty ring: circumference minus the fraction they still hold.
  const r = 18;
  const circ = 2 * Math.PI * r;
  const loyalty = Math.max(0, Math.min(100, member.loyalty ?? 0));
  const ringColor = loyalty < 30 ? 'hsl(var(--blood))' : loyalty < 60 ? 'hsl(var(--gold))' : 'hsl(var(--emerald))';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={`${member.name} · loyaal ${loyalty}`}>
      <svg viewBox="0 0 40 40" width={size} height={size} className="overflow-visible">
        {/* Loyalty ring */}
        <circle cx={20} cy={20} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={2.2} opacity={0.5} />
        <motion.circle
          cx={20} cy={20} r={r} fill="none" stroke={ringColor} strokeWidth={2.2} strokeLinecap="round"
          initial={{ strokeDasharray: circ, strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - loyalty / 100) }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          transform="rotate(-90 20 20)"
        />

        {/* Portrait, clipped inside the ring */}
        <defs>
          <clipPath id={`cp-${member.id}`}>
            <circle cx={20} cy={20} r={15.5} />
          </clipPath>
        </defs>
        <g clipPath={`url(#cp-${member.id})`} opacity={injured ? 0.55 : resting ? 0.8 : 1}>
          {/* A backlight behind the head. Without it a dark figure on a dark plate has no
              outline at 40 pixels and every crew member reads as the same smudge. */}
          <circle cx={20} cy={20} r={15.5} fill="hsl(220 18% 13%)" />
          <ellipse cx={20} cy={13} rx={13} ry={11} fill={rim} opacity={0.16} />
          <ellipse cx={20} cy={26} rx={15} ry={12} fill="hsl(220 22% 7%)" opacity={0.8} />
          {/* Shoulders */}
          <path d="M6 38 q2 -11 14 -11 q12 0 14 11 z" fill={coat} />
          <path d="M20 27 v11" stroke="hsl(220 20% 8%)" strokeWidth={1} opacity={0.6} />
          {/* Neck + head */}
          <rect x={17} y={20} width={6} height={7} fill={skin} />
          <ellipse cx={20} cy={16} rx={7} ry={7.8} fill={skin} />
          {/* Stubble */}
          {stubble && <path d="M13.5 18 q6.5 7 13 0 q-1 5 -6.5 5 q-5.5 0 -6.5 -5 z" fill="hsl(220 12% 18%)" opacity={0.5} />}
          {/* Eyes: a dark band, because this is a silhouette not a face study */}
          <rect x={15.5} y={14.5} width={9} height={1.6} rx={0.8} fill="hsl(220 20% 10%)" opacity={0.8} />

          {/* Headwear */}
          {head === 'cap' && (
            <>
              <path d="M12.5 12 q0 -7 7.5 -7 q7.5 0 7.5 7 z" fill={coat} />
              <path d="M27 11.6 q5 0.4 5 2.2 q-5 0.6 -5 -2.2 z" fill="hsl(220 16% 18%)" />
            </>
          )}
          {head === 'hood' && (
            <path d="M10.5 22 q-1 -18 9.5 -18 q10.5 0 9.5 18 q-4 -9 -9.5 -9 q-5.5 0 -9.5 9 z" fill={coat} />
          )}
          {head === 'beanie' && (
            <>
              <path d="M12.8 11.5 q0 -6.5 7.2 -6.5 q7.2 0 7.2 6.5 z" fill={coat} />
              <rect x={12.6} y={11} width={14.8} height={2.4} rx={1.2} fill="hsl(220 14% 22%)" />
            </>
          )}
          {head === 'slick' && (
            <path d="M13 12 q1 -7 7 -7 q6 0 7 7 q-3 -3 -7 -3 q-4 0 -7 3 z" fill="hsl(220 14% 14%)" />
          )}
          {head === 'bare' && (
            <path d="M13.2 12.5 q1.5 -6 6.8 -6 q5.3 0 6.8 6 q-3.5 -2.5 -6.8 -2.5 q-3.3 0 -6.8 2.5 z" fill="hsl(28 18% 20%)" />
          )}

          {/* Accessory */}
          {accessory === 1 && <circle cx={27} cy={18} r={1.1} fill="hsl(45 90% 60%)" />}
          {accessory === 2 && <path d="M24.5 12.5 L26.5 18" stroke="hsl(0 50% 40%)" strokeWidth={0.9} strokeLinecap="round" />}
          {accessory === 3 && (
            <>
              <rect x={22} y={19.4} width={5} height={1.2} rx={0.6} fill="hsl(40 25% 82%)" />
              <motion.circle
                cx={27.4} cy={20} r={0.9} fill="hsl(20 95% 60%)"
                initial={{ opacity: 0.35 }}
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </>
          )}

          {/* Rim light in the trait's colour, from the left */}
          <path d="M13.6 10 q-3.4 5.6 -1.4 12.4" fill="none" stroke={rim} strokeWidth={1.7} opacity={0.85} strokeLinecap="round" />
          <path d="M26.6 11 q3 5 1.4 11" fill="none" stroke={rim} strokeWidth={0.9} opacity={0.35} strokeLinecap="round" />
        </g>

        {/* Bandage when they are laid up, so an injured crew member is unmistakable */}
        {injured && (
          <g>
            <path d="M9 13 L31 23" stroke="hsl(40 30% 85%)" strokeWidth={3} strokeLinecap="round" opacity={0.85} />
            <path d="M9 13 L31 23" stroke="hsl(0 60% 45%)" strokeWidth={0.9} strokeLinecap="round" opacity={0.7} />
          </g>
        )}
      </svg>

      {/* Trait mark, bottom-right, so the colour has a name attached */}
      {member.trait && (
        <span
          className="absolute -bottom-0.5 -right-0.5 text-[0.5rem] leading-none rounded-full bg-card border border-border/70 px-[2px]"
          title={TRAIT_BY_ID[member.trait]?.name}
        >
          {TRAIT_BY_ID[member.trait]?.icon}
        </span>
      )}
    </div>
  );
}
