import { motion } from 'framer-motion';
import { Shield, Zap } from 'lucide-react';
import { TappableTile } from './TappableTile';

interface KarmaChipProps {
  karma: number;
  alignment: 'meedogenloos' | 'neutraal' | 'eerbaar';
  label: string;
}

export function KarmaChip({ karma, alignment, label }: KarmaChipProps) {
  const isMeedogenloos = alignment === 'meedogenloos';
  const isEerbaar = alignment === 'eerbaar';
  const isNeutraal = alignment === 'neutraal';

  const color = isMeedogenloos ? 'text-blood' : isEerbaar ? 'text-gold' : 'text-muted-foreground';
  const Icon = isMeedogenloos ? Zap : isEerbaar ? Shield : null;
  const barPos = Math.round(((karma + 100) / 200) * 100);

  return (
    <TappableTile tooltip={`Karma: ${karma}. Je bent ${label}. Eerbare keuzes verhogen karma, meedogenloze keuzes verlagen het. Je alignment beïnvloedt beschikbare missies en NPC-reacties.`}>
      <div className="flex flex-col items-center justify-center bg-muted/20 rounded px-2 py-1 border border-border/50 min-w-[3rem]">
        <span className="text-[0.4rem] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">Karma</span>
        <div className="flex items-center gap-1">
          {Icon && <Icon size={7} className={color} />}
          {isNeutraal && <span className="text-[0.45rem] leading-none">⚖️</span>}
          <div className="relative w-6 h-1 rounded-full bg-muted/40 overflow-hidden">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, hsl(0 72% 51% / 0.3), transparent 40%, transparent 60%, hsl(45 93% 47% / 0.3))',
              }}
            />
            <motion.div
              className={`absolute top-0 h-full w-1 rounded-full ${
                isMeedogenloos ? 'bg-blood' : isEerbaar ? 'bg-gold' : 'bg-muted-foreground'
              }`}
              animate={{ left: `${Math.max(0, Math.min(95, barPos) - 5)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        <span className={`font-bold text-[0.4rem] leading-none mt-0.5 ${color}`}>
          {label.length > 6 ? label.slice(0, 5) + '.' : label}
        </span>
      </div>
    </TappableTile>
  );
}
