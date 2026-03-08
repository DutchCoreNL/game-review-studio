interface SectionHeaderProps {
  title: string;
  subtitle?: string;
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

export function SectionHeader({ title, subtitle, icon, badge, badgeColor = 'gold' }: SectionHeaderProps) {
  return (
    <div className="mt-4 mb-2">
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-gold/80">{icon}</span>}
        <span className="text-[0.6rem] uppercase tracking-wider text-gold/80 font-bold">
          {title}
        </span>
        {badge && (
          <span className={`text-[0.4rem] px-1.5 py-0.5 rounded border font-bold uppercase ${BADGE_STYLES[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-[0.5rem] text-muted-foreground mt-0.5 ml-[calc(12px+0.375rem)]">{subtitle}</p>
      )}
      <div className="mt-1.5 h-px bg-gradient-to-r from-gold/30 via-gold/10 to-transparent" />
    </div>
  );
}
