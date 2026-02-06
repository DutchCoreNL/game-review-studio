interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: 'blood' | 'gold' | 'emerald' | 'purple';
}

const BADGE_STYLES: Record<string, string> = {
  blood: 'bg-blood/20 text-blood border-blood/30',
  gold: 'bg-gold/20 text-gold border-gold/30',
  emerald: 'bg-emerald/20 text-emerald border-emerald/30',
  purple: 'bg-game-purple/20 text-game-purple border-game-purple/30',
};

export function SectionHeader({ title, icon, badge, badgeColor = 'gold' }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-3 pb-1.5 border-b border-border">
      {icon && <span className="text-gold">{icon}</span>}
      <span className="text-gold text-[0.65rem] uppercase tracking-[0.2em] font-bold font-display">
        {title}
      </span>
      {badge && (
        <span className={`text-[0.45rem] px-1.5 py-0.5 rounded border font-bold uppercase ${BADGE_STYLES[badgeColor]}`}>
          {badge}
        </span>
      )}
    </div>
  );
}
