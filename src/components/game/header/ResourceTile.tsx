import { TappableTile } from './TappableTile';

interface ResourceTileProps {
  label: string;
  value: string | number;
  color: string;
  icon?: React.ReactNode;
  pulse?: boolean;
  tooltip: string;
  onTap?: () => void;
}

export function ResourceTile({ label, value, color, icon, pulse, tooltip, onTap }: ResourceTileProps) {
  return (
    <TappableTile tooltip={tooltip} onTap={onTap}>
      <div className={`flex flex-col items-center justify-center bg-muted/20 rounded px-2 py-1 border border-border/50 min-w-[2.5rem] ${pulse ? 'animate-pulse' : ''}`}>
        <span className="text-[0.4rem] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">{label}</span>
        <div className="flex items-center gap-0.5">
          {icon}
          <span className={`font-bold text-[0.65rem] tabular-nums leading-none ${color}`}>{value}</span>
        </div>
      </div>
    </TappableTile>
  );
}
