import { useEffect, useRef, useState } from 'react';
import { DistrictId } from '@/game/types';
import { cn } from '@/lib/utils';

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

const DISTRICT_GRADIENTS: Record<DistrictId, string> = {
  port: 'from-blue-950 via-slate-900 to-cyan-950',
  crown: 'from-yellow-950 via-stone-900 to-amber-950',
  iron: 'from-stone-800 via-orange-950 to-gray-900',
  low: 'from-emerald-950 via-stone-900 to-green-950',
  neon: 'from-purple-950 via-fuchsia-950 to-pink-950',
};

const WEAPON_SHAPES: Record<string, { path: string; label: string }> = {
  glock: { path: 'M20 55 L30 52 L38 50 L38 55 L35 60 L30 65 L25 65 L20 60Z', label: '9mm' },
  shotgun: { path: 'M15 52 L42 48 L42 53 L38 58 L32 62 L25 62 L15 57Z', label: 'Shotgun' },
  ak47: { path: 'M10 50 L48 44 L48 49 L42 54 L35 58 L20 58 L10 55Z', label: 'AK-47' },
  sniper: { path: 'M5 50 L52 42 L52 47 L48 52 L40 55 L15 55 L5 53Z', label: 'SVD' },
  cartel_blade: { path: 'M30 35 L33 38 L35 55 L33 65 L30 68 L27 65 L25 55 L27 38Z', label: 'Blade' },
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
  const isSm = size === 'sm';

  return (
    <div className={cn(
      'relative overflow-hidden rounded border border-border',
      SIZE_MAP[size],
      glitch && 'avatar-glitch',
      className
    )}>
      {/* Z0 — District background */}
      <div className={cn('absolute inset-0 bg-gradient-to-b', DISTRICT_GRADIENTS[state.district])} />

      {/* Z1 — Body silhouette */}
      <svg className="absolute inset-0 w-full h-full z-[1]" viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet">
        <ellipse cx="30" cy="22" rx="9" ry="10" fill="hsl(30 20% 35%)" />
        <rect x="20" y="32" width="20" height="28" rx="3" fill="hsl(30 15% 30%)" />
        <rect x="18" y="60" width="9" height="18" rx="2" fill="hsl(30 15% 28%)" />
        <rect x="33" y="60" width="9" height="18" rx="2" fill="hsl(30 15% 28%)" />
      </svg>

      {/* Z2 — Cybernetics */}
      {state.hasCybernetics && (
        <svg className="absolute inset-0 w-full h-full z-[2]" viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet">
          <line x1="24" y1="18" x2="21" y2="26" stroke="hsl(217 91% 60%)" strokeWidth="0.6" opacity="0.9" />
          <line x1="36" y1="18" x2="39" y2="26" stroke="hsl(217 91% 60%)" strokeWidth="0.6" opacity="0.9" />
          <circle cx="24" cy="20" r="1.2" fill="hsl(217 91% 60%)" opacity="0.8" />
          <circle cx="36" cy="20" r="1.2" fill="hsl(217 91% 60%)" opacity="0.8" />
          <line x1="28" y1="34" x2="28" y2="45" stroke="hsl(160 84% 39%)" strokeWidth="0.5" opacity="0.6" />
          <line x1="32" y1="34" x2="32" y2="45" stroke="hsl(160 84% 39%)" strokeWidth="0.5" opacity="0.6" />
        </svg>
      )}

      {/* Z3 — Clothing (level-based) */}
      <svg className="absolute inset-0 w-full h-full z-[3]" viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet">
        {tier === 'rat' && (
          <>
            <rect x="21" y="33" width="18" height="26" rx="2" fill="hsl(30 10% 22%)" opacity="0.8" />
            <line x1="25" y1="36" x2="28" y2="42" stroke="hsl(30 10% 15%)" strokeWidth="0.5" />
            <line x1="35" y1="38" x2="33" y2="44" stroke="hsl(30 10% 15%)" strokeWidth="0.5" />
          </>
        )}
        {tier === 'soldier' && (
          <>
            <rect x="19" y="32" width="22" height="28" rx="3" fill="hsl(220 15% 18%)" opacity="0.9" />
            <line x1="30" y1="32" x2="30" y2="58" stroke="hsl(220 10% 25%)" strokeWidth="0.8" />
            <rect x="24" y="33" width="3" height="2" rx="0.5" fill="hsl(45 50% 40%)" opacity="0.7" />
          </>
        )}
        {tier === 'boss' && (
          <>
            <rect x="18" y="31" width="24" height="30" rx="3" fill="hsl(0 0% 10%)" opacity="0.95" />
            <line x1="30" y1="31" x2="30" y2="60" stroke="hsl(0 0% 15%)" strokeWidth="1" />
            <rect x="28" y="32" width="4" height="3" rx="1" fill="hsl(45 93% 40%)" />
            <rect x="24" y="32" width="3" height="2" rx="0.5" fill="hsl(45 93% 40%)" opacity="0.5" />
            <rect x="33" y="32" width="3" height="2" rx="0.5" fill="hsl(45 93% 40%)" opacity="0.5" />
          </>
        )}
      </svg>

      {/* Z4 — Armor overlay */}
      {state.armor && (
        <svg className="absolute inset-0 w-full h-full z-[4]" viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet">
          {state.armor === 'vest' && (
            <rect x="21" y="33" width="18" height="18" rx="2" fill="hsl(30 10% 25%)" stroke="hsl(45 30% 35%)" strokeWidth="0.5" opacity="0.7" />
          )}
          {state.armor === 'suit' && (
            <rect x="19" y="31" width="22" height="28" rx="3" fill="hsl(220 20% 12%)" stroke="hsl(45 93% 40%)" strokeWidth="0.4" opacity="0.6" />
          )}
          {state.armor === 'skull_armor' && (
            <>
              <rect x="20" y="32" width="20" height="24" rx="2" fill="hsl(0 0% 15%)" stroke="hsl(30 10% 40%)" strokeWidth="0.8" opacity="0.8" />
              <circle cx="30" cy="42" r="3" fill="none" stroke="hsl(0 72% 51%)" strokeWidth="0.6" opacity="0.6" />
            </>
          )}
        </svg>
      )}

      {/* Z5 — Headgear */}
      {(tier === 'boss' || state.hasCybernetics) && (
        <svg className="absolute inset-0 w-full h-full z-[5]" viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet">
          {state.hasCybernetics ? (
            <rect x="22" y="18" width="16" height="3" rx="1" fill="hsl(217 91% 60%)" opacity="0.7" />
          ) : (
            <rect x="21" y="13" width="18" height="4" rx="1" fill="hsl(0 0% 8%)" opacity="0.8" />
          )}
        </svg>
      )}

      {/* Z6 — Weapon */}
      {state.weapon && WEAPON_SHAPES[state.weapon] && (
        <svg className="absolute inset-0 w-full h-full z-[6]" viewBox="0 0 60 80" preserveAspectRatio="xMidYMid meet">
          <path d={WEAPON_SHAPES[state.weapon].path} fill="hsl(0 0% 25%)" stroke="hsl(0 0% 40%)" strokeWidth="0.5" opacity="0.85" />
          {!isSm && (
            <text x="30" y="75" textAnchor="middle" fill="hsl(45 93% 50%)" fontSize="4" fontWeight="bold" opacity="0.7">
              {WEAPON_SHAPES[state.weapon].label}
            </text>
          )}
        </svg>
      )}

      {/* Z7 — Karma overlay */}
      {state.karma < -20 && (
        <div className="absolute inset-0 z-[7] pointer-events-none rounded"
          style={{
            boxShadow: 'inset 0 0 30px hsl(0 72% 51% / 0.35), inset 0 0 60px hsl(25 90% 50% / 0.15)',
            animation: 'pulseGlow 2.5s ease-in-out infinite',
          }} />
      )}
      {state.karma > 20 && (
        <div className="absolute inset-0 z-[7] pointer-events-none rounded"
          style={{
            boxShadow: 'inset 0 0 30px hsl(217 91% 60% / 0.3), inset 0 0 60px hsl(45 93% 50% / 0.15)',
            animation: 'pulseGold 2.5s ease-in-out infinite',
          }} />
      )}
    </div>
  );
}
