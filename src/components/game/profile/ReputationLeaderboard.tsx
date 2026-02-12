import { useGame } from '@/contexts/GameContext';
import { FAMILIES, DISTRICTS } from '@/game/constants';
import { FamilyId } from '@/game/types';
import { SectionHeader } from '../ui/SectionHeader';
import { Crown, Skull, Shield, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  rank: number;
  name: string;
  title: string;
  power: number;
  isPlayer: boolean;
  faction?: string;
  status: 'active' | 'defeated' | 'imprisoned';
}

export function ReputationLeaderboard() {
  const { state } = useGame();

  // Generate NPC criminals based on game state
  const npcs: LeaderboardEntry[] = [
    { rank: 0, name: 'El Serpiente', title: 'Kartel Baas', power: Math.max(0, 800 - state.day * 5), isPlayer: false, faction: 'cartel', status: state.leadersDefeated.includes('cartel') ? 'defeated' : 'active' },
    { rank: 0, name: 'Mr. Wu', title: 'Syndicaat Leider', power: Math.max(0, 900 - state.day * 4), isPlayer: false, faction: 'syndicate', status: state.leadersDefeated.includes('syndicate') ? 'defeated' : 'active' },
    { rank: 0, name: 'Hammer', title: 'Biker Kapitein', power: Math.max(0, 700 - state.day * 6), isPlayer: false, faction: 'bikers', status: state.leadersDefeated.includes('bikers') ? 'defeated' : 'active' },
    { rank: 0, name: state.nemesis.name, title: 'Nemesis', power: state.nemesis.alive ? state.nemesis.power : 0, isPlayer: false, status: state.nemesis.alive ? 'active' : 'defeated' },
    { rank: 0, name: 'Viktor Krow', title: 'Wapenhandelaar', power: 300 + state.day * 3, isPlayer: false, status: 'active' },
    { rank: 0, name: 'Rosa Delgado', title: 'Informant', power: 200 + state.day * 2, isPlayer: false, status: 'active' },
  ];

  // Player entry
  const playerPower = state.rep + state.player.level * 50 + state.ownedDistricts.length * 100 + (state.conqueredFactions?.length || 0) * 200;
  const playerEntry: LeaderboardEntry = {
    rank: 0,
    name: 'The Boss (Jij)',
    title: state.endgamePhase === 'noxhaven_baas' ? 'Kingpin' : state.endgamePhase === 'onderwerelds_koning' ? 'Crime Lord' : 'Opkomend Talent',
    power: playerPower,
    isPlayer: true,
    status: state.prison ? 'imprisoned' : 'active',
  };

  // Combine, sort, assign ranks
  const all = [...npcs.filter(n => n.status === 'active'), playerEntry]
    .sort((a, b) => b.power - a.power)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  // Also show defeated at the bottom
  const defeated = npcs.filter(n => n.status === 'defeated');

  return (
    <>
      <SectionHeader title="Most Wanted" icon={<Crown size={12} />} badge={`#${all.find(e => e.isPlayer)?.rank || '?'}`} />
      <div className="game-card mb-4">
        <div className="space-y-1.5">
          {all.map((entry, i) => (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs ${
                entry.isPlayer ? 'bg-gold/10 border border-gold' : 'bg-muted/30'
              }`}
            >
              <span className={`w-5 text-center font-bold text-[0.7rem] ${
                entry.rank === 1 ? 'text-gold' : entry.rank === 2 ? 'text-muted-foreground' : entry.rank === 3 ? 'text-orange-400' : 'text-muted-foreground'
              }`}>
                {entry.rank === 1 ? '👑' : `#${entry.rank}`}
              </span>
              <div className="flex-1 min-w-0">
                <span className={`font-bold text-[0.6rem] ${entry.isPlayer ? 'text-gold' : ''}`}>{entry.name}</span>
                <span className="block text-[0.45rem] text-muted-foreground">{entry.title}</span>
              </div>
              <div className="text-right">
                <span className="text-[0.55rem] font-bold">{entry.power}</span>
                <span className="block text-[0.4rem] text-muted-foreground">POWER</span>
              </div>
            </motion.div>
          ))}
        </div>

        {defeated.length > 0 && (
          <div className="mt-3 pt-2 border-t border-border">
            <span className="text-[0.5rem] text-muted-foreground uppercase tracking-wider font-bold">Uitgeschakeld</span>
            {defeated.map(d => (
              <div key={d.name} className="flex items-center gap-2 px-2 py-1 text-[0.5rem] text-muted-foreground opacity-50 mt-1">
                <Skull size={10} />
                <span>{d.name}</span>
                <span className="text-blood ml-auto">☠ Verslagen</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
