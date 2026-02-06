import { motion } from 'framer-motion';

type ButtonVariant = 'blood' | 'gold' | 'muted' | 'emerald' | 'purple' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface GameButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  glow?: boolean;
  onClick?: () => void;
  className?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  blood: 'bg-blood text-primary-foreground border-blood',
  gold: 'bg-gold/10 border-gold text-gold hover:bg-gold/20',
  muted: 'bg-muted border-border text-muted-foreground hover:text-foreground',
  emerald: 'bg-emerald/10 border-emerald text-emerald hover:bg-emerald/20',
  purple: 'bg-game-purple/10 border-game-purple text-game-purple hover:bg-game-purple/20',
  ghost: 'bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-[0.6rem]',
  md: 'px-4 py-2.5 text-xs',
  lg: 'px-5 py-3 text-sm',
};

const GLOW_STYLES: Record<string, string> = {
  blood: 'glow-blood',
  gold: 'glow-gold',
  emerald: 'glow-emerald',
};

export function GameButton({
  children,
  variant = 'gold',
  size = 'md',
  icon,
  disabled,
  fullWidth,
  glow,
  onClick,
  className = '',
}: GameButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded border font-bold uppercase tracking-wider transition-all
        flex items-center justify-center gap-1.5
        disabled:opacity-30 disabled:cursor-not-allowed
        ${VARIANT_STYLES[variant]}
        ${SIZE_STYLES[size]}
        ${fullWidth ? 'w-full' : ''}
        ${glow && GLOW_STYLES[variant] ? GLOW_STYLES[variant] : ''}
        ${className}
      `}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
    >
      {icon}
      {children}
    </motion.button>
  );
}
