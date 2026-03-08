import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { getDurabilityStatus } from '@/game/durability';

// ========== STAT BAR ==========
interface StatBarProps {
  label: string;
  value: number;
  max: number;
  icon: React.ReactNode;
  color: string;
}

export function ArsenalStatBar({ label, value, max, icon, color }: StatBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-1.5">
      <span className={`${color}`}>{icon}</span>
      <span className="text-[0.45rem] text-muted-foreground w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${color.replace('text-', 'bg-')}`}
        />
      </div>
      <span className="text-[0.5rem] font-bold w-5 text-right">{value}</span>
    </div>
  );
}

// ========== DURABILITY BAR ==========
export function DurabilityBar({ durability }: { durability: number }) {
  const status = getDurabilityStatus(durability);
  const pct = Math.min(100, durability);
  return (
    <div className="flex items-center gap-1.5">
      <Wrench size={8} className={status.color} />
      <span className="text-[0.45rem] text-muted-foreground w-12 shrink-0">Conditie</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          className={`h-full rounded-full ${
            durability >= 80 ? 'bg-emerald' : durability >= 50 ? 'bg-gold' : durability >= 25 ? 'bg-orange-400' : 'bg-blood'
          }`}
        />
      </div>
      <span className={`text-[0.5rem] font-bold w-5 text-right ${status.color}`}>{durability}%</span>
    </div>
  );
}

// ========== MASTERY BAR (WEAPON) ==========
interface WeaponMasteryBarProps {
  masteryXp: number;
  frame: string;
  getMasteryProgress: (xp: number) => { level: number; progress: number; nextXp: number };
  getMasteryTitle: (frame: string, level: number) => string | null;
}

export function WeaponMasteryBar({ masteryXp, frame, getMasteryProgress, getMasteryTitle }: WeaponMasteryBarProps) {
  const mastery = getMasteryProgress(masteryXp);
  if (mastery.level === 0 && masteryXp === 0) return null;
  const title = getMasteryTitle(frame, mastery.level);
  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1">
          <Star size={8} className="text-gold" />
          <span className="text-[0.45rem] text-gold font-semibold">Mastery {mastery.level}/5</span>
          {title && <span className="text-[0.4rem] text-gold/70 italic">"{title}"</span>}
        </div>
        <span className="text-[0.4rem] text-muted-foreground">{masteryXp}/{mastery.nextXp} XP</span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${mastery.progress * 100}%` }}
          className="h-full rounded-full bg-gold"
        />
      </div>
    </div>
  );
}

// ========== MASTERY BAR (GEAR) ==========
interface GearMasteryBarProps {
  masteryXp: number;
  frame: string;
  getMasteryProgress: (xp: number) => { level: number; progress: number; nextXp: number };
  getMasteryTitle: (frame: string, level: number) => string | null;
}

export function GearMasteryBar({ masteryXp, frame, getMasteryProgress, getMasteryTitle }: GearMasteryBarProps) {
  const mastery = getMasteryProgress(masteryXp);
  if (mastery.level === 0 && masteryXp === 0) return null;
  const title = getMasteryTitle(frame, mastery.level);
  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1">
          <Star size={8} className="text-gold" />
          <span className="text-[0.45rem] text-gold font-semibold">Mastery {mastery.level}/5</span>
          {title && <span className="text-[0.4rem] text-gold/70 italic">"{title}"</span>}
        </div>
        <span className="text-[0.4rem] text-muted-foreground">{masteryXp}/{mastery.nextXp} XP</span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${mastery.progress * 100}%` }}
          className="h-full rounded-full bg-gold"
        />
      </div>
    </div>
  );
}

// ========== COMPARISON STAT ==========
interface ComparisonStatProps {
  label: string;
  newVal: number;
  oldVal: number;
  icon: React.ReactNode;
  hideIfZero?: boolean;
}

export function ComparisonStat({ label, newVal, oldVal, icon, hideIfZero = false }: ComparisonStatProps) {
  if (hideIfZero && newVal === 0 && oldVal === 0) return null;
  const diff = newVal - oldVal;
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[0.5rem] text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[0.55rem] font-bold">{newVal}</span>
        {diff !== 0 && (
          <span className={`text-[0.5rem] font-bold flex items-center gap-0.5 ${diff > 0 ? 'text-emerald' : 'text-blood'}`}>
            {diff > 0 ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
            {Math.abs(diff)}
          </span>
        )}
      </div>
    </div>
  );
}
