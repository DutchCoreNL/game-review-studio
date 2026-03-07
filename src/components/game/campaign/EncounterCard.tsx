import { motion } from 'framer-motion';
import type { EncounterType, EncounterChoice } from '@/game/campaign';
import { ENCOUNTER_TYPE_CONFIG } from '@/game/campaignNarratives';
import { AlertTriangle, Timer, Shield } from 'lucide-react';

const GRADIENT_MAP: Record<EncounterType, string> = {
  combat: 'from-blood/20 via-background to-background',
  trap: 'from-amber-500/20 via-background to-background',
  npc: 'from-emerald/20 via-background to-background',
  exploration: 'from-primary/20 via-background to-background',
  timed: 'from-amber-400/20 via-background to-background',
  puzzle: 'from-purple-500/20 via-background to-background',
  ambush: 'from-blood/30 via-blood/10 to-background',
};

const CHOICE_STYLES: Record<EncounterChoice, { border: string; bg: string; glow: string; iconBg: string }> = {
  stealth: { border: 'border-emerald/40', bg: 'bg-emerald/5 hover:bg-emerald/15', glow: 'shadow-emerald/20', iconBg: 'bg-emerald/20 border-emerald/40' },
  standard: { border: 'border-primary/40', bg: 'bg-primary/5 hover:bg-primary/15', glow: 'shadow-primary/20', iconBg: 'bg-primary/20 border-primary/40' },
  aggressive: { border: 'border-blood/40', bg: 'bg-blood/5 hover:bg-blood/15', glow: 'shadow-blood/20', iconBg: 'bg-blood/20 border-blood/40' },
};

interface EncounterCardProps {
  type: EncounterType;
  encounterNum: number;
  totalEncounters: number;
  timerValue?: number;
  morale: number;
  choices: { choice: EncounterChoice; label: string; desc: string; icon: string }[];
  onChoice: (choice: EncounterChoice) => void;
  riskRewardAvailable?: boolean;
  onPush?: () => void;
  onRest?: () => void;
  bonusObjective?: string;
}

export function EncounterCard({
  type,
  encounterNum,
  totalEncounters,
  timerValue,
  morale,
  choices,
  onChoice,
  riskRewardAvailable,
  onPush,
  onRest,
  bonusObjective,
}: EncounterCardProps) {
  const config = ENCOUNTER_TYPE_CONFIG[type];
  const gradient = GRADIENT_MAP[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
      className={`relative rounded-xl border border-border/60 overflow-hidden bg-gradient-to-b ${gradient}`}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-8 h-8 rounded-full bg-background/60 border border-border/40 flex items-center justify-center"
            animate={type === 'ambush' ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ repeat: type === 'ambush' ? Infinity : 0, duration: 0.5 }}
          >
            <span className="text-lg">{config.icon}</span>
          </motion.div>
          <div className="flex-1">
            <p className={`text-sm font-bold ${config.color}`}>
              {config.label}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Encounter {encounterNum}/{totalEncounters}
            </p>
          </div>
          {morale >= 70 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald/10 border border-emerald/30">
              <Shield className="w-3 h-3 text-emerald" />
              <span className="text-[9px] text-emerald font-bold">Hoog moreel</span>
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{config.description}</p>
      </div>

      {/* Timer bar for timed encounters */}
      {type === 'timed' && timerValue !== undefined && (
        <div className="px-3 pb-2">
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="text-amber-400 font-bold animate-pulse">
              <Timer className="w-3 h-3 inline mr-0.5" />TIJDSDRUK!
            </span>
            <motion.span
              className={`font-bold ${timerValue <= 3 ? 'text-blood' : 'text-amber-400'}`}
              animate={timerValue <= 3 ? { scale: [1, 1.3, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              {timerValue}s
            </motion.span>
          </div>
          <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${timerValue <= 3 ? 'bg-blood' : 'bg-amber-400'}`}
              animate={{ width: `${(timerValue / 10) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Ambush warning */}
      {type === 'ambush' && (
        <div className="mx-3 mb-2 flex items-center gap-1.5 p-2 rounded-lg bg-blood/10 border border-blood/30">
          <AlertTriangle className="w-3.5 h-3.5 text-blood" />
          <span className="text-[10px] text-blood font-bold">Stealth niet mogelijk bij hinderlaag!</span>
        </div>
      )}

      {/* Bonus objective */}
      {bonusObjective && (
        <div className="mx-3 mb-2 flex items-center gap-1.5 p-2 rounded-lg bg-gold/10 border border-gold/30">
          <span className="text-xs">🎯</span>
          <span className="text-[10px] text-gold font-semibold">Bonus: {bonusObjective}</span>
        </div>
      )}

      {/* ═══ CHOICE CARDS ═══ */}
      <div className={`px-3 pb-3 grid ${choices.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
        {choices.map(({ choice, label, desc, icon }) => {
          const style = CHOICE_STYLES[choice];
          return (
            <motion.button
              key={choice}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChoice(choice)}
              className={`p-3 rounded-lg border ${style.border} ${style.bg} text-left transition-all hover:shadow-lg ${style.glow}`}
            >
              <div className="flex items-start gap-2">
                <div className={`w-7 h-7 rounded-full border ${style.iconBg} flex items-center justify-center shrink-0`}>
                  <span className="text-sm">{icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">{label}</p>
                  <p className="text-[9px] text-muted-foreground leading-tight">{desc}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Risk/Reward option */}
      {riskRewardAvailable && (
        <div className="px-3 pb-3 border-t border-border/30 pt-2">
          <p className="text-[10px] text-muted-foreground text-center mb-1.5">Na deze encounter:</p>
          <div className="grid grid-cols-2 gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onPush}
              className="p-2 rounded-lg border border-blood/30 bg-blood/5 hover:bg-blood/15 text-left"
            >
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-blood/20 border border-blood/40 flex items-center justify-center shrink-0">
                  <span className="text-xs">🔥</span>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-blood">Doorpushen</p>
                  <p className="text-[8px] text-muted-foreground">+50% loot, geen rust</p>
                </div>
              </div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onRest}
              className="p-2 rounded-lg border border-emerald/30 bg-emerald/5 hover:bg-emerald/15 text-left"
            >
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald/20 border border-emerald/40 flex items-center justify-center shrink-0">
                  <span className="text-xs">🛏️</span>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-emerald">Rust nemen</p>
                  <p className="text-[8px] text-muted-foreground">+15 moreel, geen bonus</p>
                </div>
              </div>
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
