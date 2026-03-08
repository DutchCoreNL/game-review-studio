import { CasinoSessionStats } from './casinoUtils';

interface SessionStatsBarProps {
  stats: CasinoSessionStats;
}

export function SessionStatsBar({ stats }: SessionStatsBarProps) {
  if (stats.sessionWins === 0 && stats.sessionLosses === 0) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-1.5 px-3 mb-2 rounded bg-muted/30 border border-border text-[0.55rem] font-bold">
      <span className="text-emerald">W:{stats.sessionWins}</span>
      <span className="text-blood">L:{stats.sessionLosses}</span>
      <span className={stats.sessionProfit >= 0 ? 'text-emerald' : 'text-blood'}>
        {stats.sessionProfit >= 0 ? '+' : ''}€{stats.sessionProfit.toLocaleString()}
      </span>
      {stats.currentStreak > 1 && <span className="text-gold">🔥{stats.currentStreak}</span>}
    </div>
  );
}
