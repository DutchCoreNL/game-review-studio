import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, Users, Flame, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SectionHeader } from '../ui/SectionHeader';
import { Progress } from '@/components/ui/progress';

interface SeasonInfo {
  season_number: number;
  season_ends_at: string;
}

interface GangScore {
  gang_id: string;
  gang_name: string;
  gang_tag: string;
  score: number;
}

const SEASON_THEMES: Record<number, { name: string; icon: string; desc: string; color: string }> = {
  1: { name: 'Eerste Bloed', icon: '🩸', desc: 'Wie domineert de stad als eerste?', color: 'text-blood' },
  2: { name: 'Gouden Tijdperk', icon: '👑', desc: 'Treasury en handel bepalen de winnaar.', color: 'text-gold' },
  3: { name: 'Schaduw Oorlog', icon: '🌑', desc: 'Stille operaties en spionage.', color: 'text-purple-400' },
  4: { name: 'Ijzeren Vuist', icon: '✊', desc: 'Brute kracht en territorium.', color: 'text-blood' },
};

function getSeasonTheme(n: number) {
  return SEASON_THEMES[((n - 1) % 4) + 1] || SEASON_THEMES[1];
}

function formatTimeLeft(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return 'Afgelopen';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return days > 0 ? `${days}d ${hours}u` : `${hours}u`;
}

function getSeasonProgress(endsAt: string): number {
  // Assume 30-day season
  const totalMs = 30 * 86400000;
  const remaining = Math.max(0, new Date(endsAt).getTime() - Date.now());
  return Math.min(100, ((totalMs - remaining) / totalMs) * 100);
}

export function SeasonEventPanel() {
  const [season, setSeason] = useState<SeasonInfo | null>(null);
  const [gangScores, setGangScores] = useState<GangScore[]>([]);

  useEffect(() => {
    // Fetch world_state for season info
    supabase.from('world_state' as any).select('season_number, season_ends_at')
      .eq('id', 1).single()
      .then(({ data }) => { if (data) setSeason(data as any); });

    // Build gang scoreboard from territories + wars
    Promise.all([
      supabase.from('gang_territories').select('gang_id, total_influence'),
      supabase.from('gangs').select('id, name, tag, treasury'),
    ]).then(([terrRes, gangRes]) => {
      const gangs = gangRes.data || [];
      const terrs = terrRes.data || [];

      // Aggregate scores
      const scoreMap: Record<string, number> = {};
      terrs.forEach(t => {
        scoreMap[t.gang_id] = (scoreMap[t.gang_id] || 0) + (t.total_influence || 0);
      });

      const scores: GangScore[] = gangs.map(g => ({
        gang_id: g.id,
        gang_name: g.name,
        gang_tag: g.tag,
        score: (scoreMap[g.id] || 0) + Math.floor((g.treasury || 0) / 10000),
      })).sort((a, b) => b.score - a.score).slice(0, 5);

      setGangScores(scores);
    });
  }, []);

  if (!season) return null;

  const theme = getSeasonTheme(season.season_number);
  const progress = getSeasonProgress(season.season_ends_at);
  const timeLeft = formatTimeLeft(season.season_ends_at);

  return (
    <div>
      <SectionHeader 
        title={`Seizoen ${season.season_number}`} 
        icon={<Trophy size={12} />} 
        badge={theme.name} 
        badgeColor="gold" 
      />

      {/* Season banner */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="game-card border-l-[3px] border-l-gold mb-2"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-lg">{theme.icon}</span>
          <div>
            <h4 className={`text-xs font-bold ${theme.color}`}>{theme.name}</h4>
            <p className="text-[0.45rem] text-muted-foreground">{theme.desc}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mb-1 text-[0.4rem]">
          <span className="text-muted-foreground flex items-center gap-0.5"><Clock size={7} /> {timeLeft} resterend</span>
          <span className="text-gold font-bold">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1 [&>div]:bg-gold" />
      </motion.div>

      {/* Gang Scoreboard */}
      {gangScores.length > 0 && (
        <div>
          <span className="text-[0.45rem] text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1">
            <Star size={8} className="text-gold" /> Seizoen Ranglijst
          </span>
          <div className="space-y-0.5 mt-1">
            {gangScores.map((g, i) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <motion.div
                  key={g.gang_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-2 px-2 py-1 rounded ${
                    i === 0 ? 'bg-gold/10 border border-gold/30' : 'bg-card/30'
                  }`}
                >
                  <span className="text-[0.5rem] w-4 text-center">
                    {i < 3 ? medals[i] : `#${i + 1}`}
                  </span>
                  <span className={`text-[0.5rem] font-bold flex-1 ${i === 0 ? 'text-gold' : 'text-foreground'}`}>
                    [{g.gang_tag}] {g.gang_name}
                  </span>
                  <span className="text-[0.45rem] text-gold font-bold flex items-center gap-0.5">
                    <Flame size={8} /> {g.score}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
