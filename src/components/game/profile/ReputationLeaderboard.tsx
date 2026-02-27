import { useGame } from '@/contexts/GameContext';
import { FAMILIES, DISTRICTS } from '@/game/constants';
import { FamilyId, RunRecord } from '@/game/types';
import { SectionHeader } from '../ui/SectionHeader';
import { Crown, Skull, Shield, TrendingUp, Trophy, Calendar, Target, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { InfoRow } from '../ui/InfoRow';
import { StatBar } from '../ui/StatBar';

interface LeaderboardEntry {
  rank: number;
  name: string;
  title: string;
  power: number;
  isPlayer: boolean;
  faction?: string;
  status: 'active' | 'defeated' | 'imprisoned';
}

const RANK_COLORS: Record<string, string> = {
  S: 'text-gold',
  A: 'text-emerald',
  B: 'text-sky-400',
  C: 'text-muted-foreground',
  D: 'text-blood',
};

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

  const playerPower = state.rep + state.player.level * 50 + (state.conqueredFactions?.length || 0) * 200;
  const playerEntry: LeaderboardEntry = {
    rank: 0,
    name: 'The Boss (Jij)',
    title: state.endgamePhase === 'noxhaven_baas' ? 'Kingpin' : state.endgamePhase === 'onderwerelds_koning' ? 'Crime Lord' : 'Opkomend Talent',
    power: playerPower,
    isPlayer: true,
    status: state.prison ? 'imprisoned' : 'active',
  };

  const all = [...npcs.filter(n => n.status === 'active'), playerEntry]
    .sort((a, b) => b.power - a.power)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const defeated = npcs.filter(n => n.status === 'defeated');
  const runHistory: RunRecord[] = state.runHistory || [];

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

      {/* NG+ Run History Leaderboard */}
      <SectionHeader title={`Run Geschiedenis (${runHistory.length})`} icon={<Trophy size={12} />} />
      {runHistory.length === 0 ? (
        <div className="game-card mb-4">
          <p className="text-muted-foreground text-xs italic text-center py-3">
            Nog geen voltooide runs. Voltooi het spel en start NG+ om je scores te vergelijken!
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {[...runHistory]
            .sort((a, b) => b.score - a.score)
            .map((run, i) => {
              const best = i === 0;
              return (
                <motion.div
                  key={run.timestamp}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`game-card border-l-[3px] ${best ? 'border-l-gold' : 'border-l-border'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-black ${RANK_COLORS[run.rank] || 'text-muted-foreground'}`}>
                        {run.rank}
                      </span>
                      <div>
                        <h4 className="font-bold text-xs">
                          {run.ngLevel === 0 ? 'Eerste Run' : `NG+${run.ngLevel}`}
                          {best && <span className="text-gold ml-1.5 text-[0.5rem]">⭐ BEST</span>}
                        </h4>
                        <p className="text-[0.45rem] text-muted-foreground">
                          {run.method} • Dag {run.day}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-gold">{run.score.toLocaleString()}</span>
                      <span className="block text-[0.4rem] text-muted-foreground uppercase">SCORE</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[0.5rem]">
                    <div className="bg-muted/30 rounded px-1.5 py-1 text-center">
                      <span className="block font-bold text-foreground">{run.factionsConquered}/3</span>
                      <span className="text-muted-foreground">Facties</span>
                    </div>
                    <div className="bg-muted/30 rounded px-1.5 py-1 text-center">
                      <span className="block font-bold text-foreground">{run.districtsOwned}/5</span>
                      <span className="text-muted-foreground">Districten</span>
                    </div>
                    <div className="bg-muted/30 rounded px-1.5 py-1 text-center">
                      <span className={`block font-bold ${run.nemesisDefeated ? 'text-emerald' : 'text-blood'}`}>
                        {run.nemesisDefeated ? '✓' : '✗'}
                      </span>
                      <span className="text-muted-foreground">Nemesis</span>
                    </div>
                    <div className="bg-muted/30 rounded px-1.5 py-1 text-center">
                      <span className="block font-bold text-foreground">€{(run.totalEarned / 1000).toFixed(0)}k</span>
                      <span className="text-muted-foreground">Verdiend</span>
                    </div>
                    <div className="bg-muted/30 rounded px-1.5 py-1 text-center">
                      <span className="block font-bold text-foreground">{run.achievementsUnlocked}</span>
                      <span className="text-muted-foreground">Trofeeën</span>
                    </div>
                    <div className="bg-muted/30 rounded px-1.5 py-1 text-center">
                      <span className={`block font-bold ${run.karma >= 0 ? 'text-emerald' : 'text-blood'}`}>
                        {run.karma >= 0 ? '+' : ''}{run.karma}
                      </span>
                      <span className="text-muted-foreground">Karma</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}

          {/* Summary stats across all runs */}
          {runHistory.length >= 2 && (
            <>
              <SectionHeader title="Totaal Over Alle Runs" icon={<TrendingUp size={12} />} />
              <div className="game-card">
                <div className="grid grid-cols-2 gap-2">
                  <InfoRow icon={<Trophy size={10} />} label="Beste Score" value={Math.max(...runHistory.map(r => r.score)).toLocaleString()} valueClass="text-gold" />
                  <InfoRow icon={<Target size={10} />} label="Runs Voltooid" value={`${runHistory.length}`} valueClass="text-emerald" />
                  <InfoRow icon={<Coins size={10} />} label="Totaal Verdiend" value={`€${(runHistory.reduce((s, r) => s + r.totalEarned, 0) / 1000).toFixed(0)}k`} valueClass="text-gold" />
                  <InfoRow icon={<Calendar size={10} />} label="Snelste Run" value={`Dag ${Math.min(...runHistory.map(r => r.day))}`} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
