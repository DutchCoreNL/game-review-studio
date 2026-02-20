import { motion } from 'framer-motion';
import { X, Star, Coins, Calendar, MapPin, Users, Brain, Skull } from 'lucide-react';
import { InfoRow } from './ui/InfoRow';

interface PlayerDetailProps {
  player: {
    username: string;
    rep: number;
    cash: number;
    day: number;
    level: number;
    districts_owned: number;
    crew_size: number;
    karma: number;
    backstory: string | null;
    updated_at: string;
  };
  onClose: () => void;
}

const BACKSTORY_LABELS: Record<string, string> = {
  weduwnaar: '💀 De Weduwnaar',
  bankier: '💰 De Bankier',
  straatkind: '🔪 Het Straatkind',
};

export function PlayerDetailPopup({ player, onClose }: PlayerDetailProps) {
  const karmaLabel = player.karma > 20 ? '😇 Goed' : player.karma < -20 ? '😈 Kwaad' : '😐 Neutraal';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        className="game-card w-full max-w-[340px] border-gold/40"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-gold tracking-wider">{player.username}</h2>
            <p className="text-[0.55rem] text-muted-foreground">
              Level {player.level} • {player.backstory ? BACKSTORY_LABELS[player.backstory] || player.backstory : 'Onbekend'}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <InfoRow icon={<Star size={10} />} label="Reputatie" value={`${player.rep}`} valueClass="text-gold" />
          <InfoRow icon={<Coins size={10} />} label="Vermogen" value={`€${player.cash.toLocaleString()}`} valueClass="text-emerald" />
          <InfoRow icon={<Calendar size={10} />} label="Dag" value={`${player.day}`} />
          <InfoRow icon={<MapPin size={10} />} label="Districten" value={`${player.districts_owned}`} valueClass="text-blood" />
          <InfoRow icon={<Users size={10} />} label="Crew" value={`${player.crew_size}`} />
          <InfoRow icon={<Brain size={10} />} label="Karma" value={karmaLabel} valueClass={player.karma > 20 ? 'text-emerald' : player.karma < -20 ? 'text-blood' : ''} />
        </div>

        <p className="text-[0.45rem] text-muted-foreground mt-3 text-right">
          Laatst bijgewerkt: {new Date(player.updated_at).toLocaleDateString('nl-NL')}
        </p>
      </motion.div>
    </div>
  );
}
