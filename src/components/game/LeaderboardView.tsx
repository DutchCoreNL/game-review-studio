import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Crown, Star, Users, MapPin, Coins, Calendar, ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionHeader } from './ui/SectionHeader';
import { PlayerDetailPopup } from './PlayerDetailPopup';

type SortField = 'rep' | 'cash' | 'day' | 'districts_owned';

interface LeaderboardEntry {
  id: string;
  user_id: string;
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
}

export function LeaderboardView() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>('rep');
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardEntry | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
    fetchLeaderboard();
  }, [sortBy]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .order(sortBy, { ascending: false })
      .limit(50);
    setEntries((data as LeaderboardEntry[]) || []);
    setLoading(false);
  };

  const SORT_OPTIONS: { id: SortField; label: string; icon: React.ReactNode }[] = [
    { id: 'rep', label: 'REP', icon: <Star size={10} /> },
    { id: 'cash', label: 'CASH', icon: <Coins size={10} /> },
    { id: 'day', label: 'DAGEN', icon: <Calendar size={10} /> },
    { id: 'districts_owned', label: 'LAND', icon: <MapPin size={10} /> },
  ];

  const myEntry = entries.find(e => e.user_id === currentUserId);
  const myRank = myEntry ? entries.indexOf(myEntry) + 1 : null;

  return (
    <div>
      <SectionHeader title="Online Ranking" icon={<Trophy size={12} />} />

      {/* Sort pills */}
      <div className="flex gap-1.5 mb-3">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setSortBy(opt.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[0.55rem] font-bold uppercase tracking-wider transition-all ${
              sortBy === opt.id ? 'bg-gold/15 border border-gold text-gold' : 'bg-muted border border-border text-muted-foreground'
            }`}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>

      {/* My position */}
      {myEntry && myRank && (
        <div className="game-card border-l-[3px] border-l-gold mb-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gold font-bold">#{myRank}</span>
            <Crown size={12} className="text-gold" />
            <span className="font-bold">{myEntry.username}</span>
            <span className="text-muted-foreground ml-auto">REP {myEntry.rep}</span>
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-xs font-ui">Laden...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-xs font-ui">
          Nog geen spelers op het leaderboard. Wees de eerste!
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry, i) => {
            const rank = i + 1;
            const isMe = entry.user_id === currentUserId;
            return (
              <motion.button
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelectedPlayer(entry)}
                className={`w-full game-card flex items-center gap-2 text-left transition-all hover:border-gold/40 ${
                  isMe ? 'border-gold/50 bg-gold/5' : ''
                }`}
              >
                {/* Rank */}
                <span className={`w-7 text-center font-bold text-xs ${
                  rank === 1 ? 'text-gold' : rank === 2 ? 'text-foreground' : rank === 3 ? 'text-amber-600' : 'text-muted-foreground'
                }`}>
                  {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`}
                </span>

                {/* Name + level */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold truncate ${isMe ? 'text-gold' : ''}`}>{entry.username}</span>
                    <span className="text-[0.5rem] text-muted-foreground">Lv.{entry.level}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[0.5rem] text-muted-foreground">
                    <span>Dag {entry.day}</span>
                    {entry.districts_owned > 0 && <span>🏠{entry.districts_owned}</span>}
                    {entry.crew_size > 0 && <span>👥{entry.crew_size}</span>}
                  </div>
                </div>

                {/* Sort value */}
                <div className="text-right">
                  <span className="text-xs font-bold text-gold">
                    {sortBy === 'cash' ? `€${entry.cash.toLocaleString()}` : entry[sortBy]}
                  </span>
                  <p className="text-[0.45rem] text-muted-foreground uppercase">{sortBy}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {selectedPlayer && (
        <PlayerDetailPopup
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
