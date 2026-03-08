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
    <div className="flex items-center gap-1.5 mt-4 mb-2">
      {icon && <span className="text-gold/80">{icon}</span>}
      <span className="text-[0.5rem] uppercase tracking-wider text-gold/80 font-bold">
        {title}
      </span>
      {badge && (
        <span className={`text-[0.4rem] px-1.5 py-0.5 rounded border font-bold uppercase ${BADGE_STYLES[badgeColor]}`}>
          {badge}
        </span>
      )}
    </div>
  );
}
