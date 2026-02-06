type BadgeVariant = 'blood' | 'gold' | 'emerald' | 'purple' | 'muted' | 'ice';

interface GameBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm';
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  blood: 'bg-blood/15 text-blood border-blood/25',
  gold: 'bg-gold/15 text-gold border-gold/25',
  emerald: 'bg-emerald/15 text-emerald border-emerald/25',
  purple: 'bg-game-purple/15 text-game-purple border-game-purple/25',
  ice: 'bg-ice/15 text-ice border-ice/25',
  muted: 'bg-muted text-muted-foreground border-border',
};

const SIZE_STYLES = {
  xs: 'text-[0.45rem] px-1 py-0.5',
  sm: 'text-[0.55rem] px-1.5 py-0.5',
};

export function GameBadge({ children, variant = 'muted', size = 'xs', className = '' }: GameBadgeProps) {
  return (
    <span className={`
      rounded border font-bold uppercase tracking-wider inline-flex items-center gap-0.5
      ${VARIANT_STYLES[variant]}
      ${SIZE_STYLES[size]}
      ${className}
    `}>
      {children}
    </span>
  );
}
