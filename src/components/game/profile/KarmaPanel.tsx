import { useGame } from '@/contexts/GameContext';
import { getKarmaAlignment, getKarmaLabel, getKarmaIcon, getActiveKarmaBonuses } from '@/game/karma';
import { SectionHeader } from '../ui/SectionHeader';
import { StatBar } from '../ui/StatBar';
import { motion } from 'framer-motion';
import { Scale, Flame, Shield } from 'lucide-react';

export function KarmaPanel() {
  const { state } = useGame();
  const karma = state.karma || 0;
  const alignment = getKarmaAlignment(karma);
  const label = getKarmaLabel(karma);
  const icon = getKarmaIcon(karma);
  const bonuses = getActiveKarmaBonuses(state);

  // Normalize karma to 0-100 for display (where 50 = neutral)
  const displayValue = Math.round((karma + 100) / 2); // -100→0, 0→50, +100→100

  const alignmentColor = alignment === 'meedogenloos' ? 'text-blood' : alignment === 'eerbaar' ? 'text-emerald' : 'text-muted-foreground';
  const barColor = alignment === 'meedogenloos' ? 'blood' : alignment === 'eerbaar' ? 'emerald' : 'gold';
  const AlignmentIcon = alignment === 'meedogenloos' ? Flame : alignment === 'eerbaar' ? Shield : Scale;

  return (
    <>
      <SectionHeader title="Karma" icon={<Scale size={12} />} />
      <div className="game-card mb-4">
        {/* Alignment header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <div>
              <h4 className={`font-bold text-sm ${alignmentColor}`}>{label}</h4>
              <p className="text-[0.45rem] text-muted-foreground uppercase tracking-wider">
                {alignment === 'meedogenloos' ? 'Pad van Angst' : alignment === 'eerbaar' ? 'Pad van Eer' : 'Onbeslist Pad'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <AlignmentIcon size={14} className={alignmentColor} />
            <span className={`text-sm font-bold ${alignmentColor}`}>{karma > 0 ? '+' : ''}{karma}</span>
          </div>
        </div>

        {/* Karma bar */}
        <div className="relative mb-2">
          <div className="flex justify-between text-[0.4rem] text-muted-foreground mb-0.5">
            <span>🩸 Meedogenloos</span>
            <span>⚖️ Neutraal</span>
            <span>✨ Eerbaar</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden relative">
            {/* Neutral zone indicator */}
            <div className="absolute left-[35%] right-[35%] top-0 bottom-0 bg-muted-foreground/10 border-x border-border" />
            {/* Karma indicator */}
            <motion.div
              className={`absolute top-0 bottom-0 w-1.5 rounded-full ${
                alignment === 'meedogenloos' ? 'bg-blood' : alignment === 'eerbaar' ? 'bg-emerald' : 'bg-gold'
              }`}
              style={{ left: `${Math.max(1, Math.min(98, displayValue))}%` }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            {/* Gradient fill */}
            {alignment === 'meedogenloos' && (
              <motion.div
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blood/60 to-blood/20 rounded-l-full"
                initial={{ width: 0 }}
                animate={{ width: `${displayValue}%` }}
                transition={{ duration: 0.5 }}
              />
            )}
            {alignment === 'eerbaar' && (
              <motion.div
                className="absolute top-0 bottom-0 right-0 bg-gradient-to-l from-emerald/60 to-emerald/20 rounded-r-full"
                initial={{ width: 0 }}
                animate={{ width: `${100 - displayValue}%` }}
                transition={{ duration: 0.5 }}
              />
            )}
          </div>
        </div>

        {/* Active bonuses */}
        {bonuses.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-[0.45rem] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Actieve Karma Bonussen
            </p>
            {bonuses.map((bonus, i) => (
              <motion.div
                key={bonus.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex justify-between items-center text-[0.5rem] px-2 py-1 rounded ${
                  alignment === 'meedogenloos' ? 'bg-blood/5 border border-blood/20' : 'bg-emerald/5 border border-emerald/20'
                }`}
              >
                <span className="text-foreground">{bonus.label}</span>
                <span className={`font-bold ${alignment === 'meedogenloos' ? 'text-blood' : 'text-emerald'}`}>
                  {bonus.value}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Neutral info */}
        {alignment === 'neutraal' && (
          <div className="mt-3 bg-muted/30 rounded p-2 border border-border">
            <p className="text-[0.45rem] text-muted-foreground leading-relaxed">
              Je karma is neutraal. Maak keuzes in verhaalbogen en events om richting 
              <span className="text-blood font-bold"> Meedogenloos</span> of 
              <span className="text-emerald font-bold"> Eerbaar</span> te verschuiven. 
              Beide paden bieden unieke gameplay-bonussen.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
