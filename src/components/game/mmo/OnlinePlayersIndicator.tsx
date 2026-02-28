import { useOnlinePlayers } from '@/hooks/useOnlinePlayers';
import { Users, Wifi } from 'lucide-react';

const DISTRICT_NAMES: Record<string, string> = {
  low: 'Lowrise', port: 'Port Nero', iron: 'Iron Borough', neon: 'Neon Strip', crown: 'Crown Heights',
};

interface Props {
  currentDistrict?: string;
  compact?: boolean;
}

export function OnlinePlayersIndicator({ currentDistrict, compact = false }: Props) {
  const { countByDistrict, total } = useOnlinePlayers();

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-[0.5rem] text-emerald">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
        <Wifi size={8} />
        <span className="font-bold">{total}</span>
        <span className="text-muted-foreground">online</span>
        {currentDistrict && countByDistrict[currentDistrict] && (
          <span className="text-muted-foreground">
            ({countByDistrict[currentDistrict]} hier)
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="game-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Users size={10} className="text-emerald" />
          <span className="text-[0.55rem] font-bold text-foreground uppercase tracking-wider">Online Spelers</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
          <span className="text-[0.5rem] font-bold text-emerald">{total}</span>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {Object.entries(DISTRICT_NAMES).map(([id, name]) => {
          const count = countByDistrict[id] || 0;
          const isHere = id === currentDistrict;
          return (
            <div key={id} className={`text-center py-1 rounded text-[0.4rem] ${isHere ? 'bg-emerald/20 border border-emerald/30' : 'bg-muted/20 border border-border/30'}`}>
              <div className={`font-bold ${count > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{count}</div>
              <div className="text-muted-foreground truncate">{name.split(' ')[0]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
