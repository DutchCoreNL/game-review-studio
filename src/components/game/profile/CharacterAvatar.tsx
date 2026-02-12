import { useEffect, useRef, useState } from 'react';
import { DistrictId } from '@/game/types';
import { cn } from '@/lib/utils';

// District backgrounds
import bgPort from '@/assets/avatar/bg-port.png';
import bgCrown from '@/assets/avatar/bg-crown.png';
import bgIron from '@/assets/avatar/bg-iron.png';
import bgLow from '@/assets/avatar/bg-low.png';
import bgNeon from '@/assets/avatar/bg-neon.png';

// Body tiers (includes clothing)
import bodyRat from '@/assets/avatar/body-rat.png';
import bodySoldier from '@/assets/avatar/body-soldier.png';
import bodyBoss from '@/assets/avatar/body-boss.png';

// Armor variants (full character with armor)
import armorVest from '@/assets/avatar/armor-vest.png';
import armorSuit from '@/assets/avatar/armor-suit.png';
import armorSkull from '@/assets/avatar/armor-skull.png';

// Cybernetics
import cyberneticsImg from '@/assets/avatar/cybernetics.png';

// Weapons (character with weapon)
import weaponGlock from '@/assets/avatar/weapon-glock.png';
import weaponShotgun from '@/assets/avatar/weapon-shotgun.png';
import weaponAk47 from '@/assets/avatar/weapon-ak47.png';
import weaponSniper from '@/assets/avatar/weapon-sniper.png';
import weaponBlade from '@/assets/avatar/weapon-blade.png';

export interface AvatarState {
  level: number;
  karma: number;
  district: DistrictId;
  weapon: string | null;
  armor: string | null;
  hasCybernetics: boolean;
}

interface Props {
  state: AvatarState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DISTRICT_BG: Record<DistrictId, string> = {
  port: bgPort,
  crown: bgCrown,
  iron: bgIron,
  low: bgLow,
  neon: bgNeon,
};

const WEAPON_IMAGES: Record<string, string> = {
  glock: weaponGlock,
  shotgun: weaponShotgun,
  ak47: weaponAk47,
  sniper: weaponSniper,
  cartel_blade: weaponBlade,
};

const ARMOR_IMAGES: Record<string, string> = {
  vest: armorVest,
  suit: armorSuit,
  skull_armor: armorSkull,
};

const SIZE_MAP = {
  sm: 'w-12 h-16',
  md: 'w-[150px] h-[200px]',
  lg: 'w-[250px] h-[333px]',
};

export function CharacterAvatar({ state, size = 'md', className }: Props) {
  const [glitch, setGlitch] = useState(false);
  const prevLevel = useRef(state.level);

  useEffect(() => {
    if (state.level !== prevLevel.current) {
      prevLevel.current = state.level;
      setGlitch(true);
      const t = setTimeout(() => setGlitch(false), 600);
      return () => clearTimeout(t);
    }
  }, [state.level]);

  const tier = state.level >= 30 ? 'boss' : state.level >= 10 ? 'soldier' : 'rat';
  const bodyImage = tier === 'boss' ? bodyBoss : tier === 'soldier' ? bodySoldier : bodyRat;

  // Determine which character image to show (priority: armor > weapon > body tier)
  // We show the most specific image as the main character visual
  const hasArmor = state.armor && ARMOR_IMAGES[state.armor];
  const hasWeapon = state.weapon && WEAPON_IMAGES[state.weapon];

  return (
    <div className={cn(
      'relative overflow-hidden rounded border border-border',
      SIZE_MAP[size],
      glitch && 'avatar-glitch',
      className
    )}>
      {/* Z0 — District background */}
      <img
        src={DISTRICT_BG[state.district]}
        alt=""
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-[1]" />

      {/* Z2 — Body / Clothing tier */}
      <img
        src={bodyImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover z-[2] mix-blend-lighten opacity-90"
      />

      {/* Z3 — Armor (replaces body visual when equipped) */}
      {hasArmor && (
        <img
          src={ARMOR_IMAGES[state.armor!]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-[3] mix-blend-lighten opacity-80"
        />
      )}

      {/* Z4 — Cybernetics */}
      {state.hasCybernetics && (
        <img
          src={cyberneticsImg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-[4] mix-blend-lighten opacity-60"
        />
      )}

      {/* Z5 — Weapon */}
      {hasWeapon && (
        <img
          src={WEAPON_IMAGES[state.weapon!]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-[5] mix-blend-lighten opacity-70"
        />
      )}

      {/* Z7 — Karma overlay */}
      {state.karma < -20 && (
        <div className="absolute inset-0 z-[7] pointer-events-none rounded"
          style={{
            boxShadow: 'inset 0 0 40px hsl(0 72% 51% / 0.4), inset 0 0 80px hsl(25 90% 50% / 0.2)',
            animation: 'pulseGlow 2.5s ease-in-out infinite',
          }} />
      )}
      {state.karma > 20 && (
        <div className="absolute inset-0 z-[7] pointer-events-none rounded"
          style={{
            boxShadow: 'inset 0 0 40px hsl(217 91% 60% / 0.35), inset 0 0 80px hsl(45 93% 50% / 0.2)',
            animation: 'pulseGold 2.5s ease-in-out infinite',
          }} />
      )}

      {/* Vignette */}
      <div className="absolute inset-0 z-[8] pointer-events-none rounded"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
    </div>
  );
}
