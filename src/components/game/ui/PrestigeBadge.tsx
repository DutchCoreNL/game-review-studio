import { Crown, Shield, Zap, Flame, Skull } from 'lucide-react';

const PRESTIGE_CONFIG: Record<number, { label: string; icon: React.ReactNode; color: string }> = {
  1: { label: 'P1', icon: <Shield size={10} />, color: 'text-blue-400' },
  2: { label: 'P2', icon: <Zap size={10} />, color: 'text-purple-400' },
  3: { label: 'P3', icon: <Crown size={10} />, color: 'text-gold' },
  4: { label: 'P4', icon: <Flame size={10} />, color: 'text-orange-400' },
  5: { label: 'P5', icon: <Skull size={10} />, color: 'text-red-400' },
};

interface PrestigeBadgeProps {
  level: number;
  size?: 'sm' | 'md';
}

export function PrestigeBadge({ level, size = 'sm' }: PrestigeBadgeProps) {
  if (level <= 0) return null;
  const config = PRESTIGE_CONFIG[Math.min(level, 5)];
  const label = level > 5 ? `P${level}` : config.label;

  return (
    <span className={`inline-flex items-center gap-0.5 ${config.color} ${size === 'md' ? 'text-[0.6rem]' : 'text-[0.5rem]'} font-bold`}>
      {config.icon}
      <span>{label}</span>
    </span>
  );
}
