import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Crown, Star, Users, MapPin, Coins, Calendar, Skull, Shield, Flame } from 'lucide-react';
import { PrestigeBadge } from './ui/PrestigeBadge';
import { GameBadge } from './ui/GameBadge';
import { motion } from 'framer-motion';
import { SectionHeader } from './ui/SectionHeader';
import { SubTabBar } from './ui/SubTabBar';
import { PlayerDetailPopup } from './PlayerDetailPopup';

type SortField = 'rep' | 'cash' | 'day' | 'districts_owned';
type LeaderboardTab = 'global' | 'legends';

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
  prestige_level?: number;
  is_hardcore?: boolean;
}

export function LeaderboardView() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>('rep');
  const [tab, setTab] = useState<LeaderboardTab>('global');
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardEntry | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy, tab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const TARGET_COUNT = 50;

    let query = supabase
      .from('leaderboard_entries')
      .select('*')
      .order(sortBy, { ascending: false })
      .limit(TARGET_COUNT);

    if (tab === 'legends') {
      // Hall of Legends: players who reached endgame (level >= 15 and high rep)
      query = query.gte('level', 15).order('rep', { ascending: false });
    }

    const { data: realData } = await query;
    const realEntries = (realData as LeaderboardEntry[]) || [];

    // Fill with bots only for global tab
    if (tab === 'global') {
      const botsNeeded = Math.max(0, TARGET_COUNT - realEntries.length);
      if (botsNeeded > 0) {
        const { data: bots } = await supabase
          .from('bot_players')
          .select('*')
          .eq('is_active', true)
          .limit(botsNeeded);

        if (bots && bots.length > 0) {
          const botEntries: LeaderboardEntry[] = bots.map((b: any) => ({
            id: b.id,
            user_id: `bot_${b.id}`,
            username: b.username,
            rep: b.rep,
            cash: b.cash,
            day: b.day,
            level: b.level,
            districts_owned: b.districts_owned,
            crew_size: b.crew_size,
            karma: b.karma,
            backstory: b.backstory,
            updated_at: b.created_at,
            prestige_level: b.prestige_level || 0,
          }));
          realEntries.push(...botEntries);
        }
      }
    }

    realEntries.sort((a, b) => {
      const valA = sortBy === 'cash' ? Number(a[sortBy]) : a[sortBy];
      const valB = sortBy === 'cash' ? Number(b[sortBy]) : b[sortBy];
      return (valB as number) - (valA as number);
    });

    setEntries(realEntries.slice(0, TARGET_COUNT));
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
      {/* Tab bar */}
      <SubTabBar
        tabs={[
          { id: 'global', label: 'Globaal', icon: <Trophy size={10} /> },
          { id: 'legends', label: 'Hall of Legends', icon: <Flame size={10} /> },
        ]}
        active={tab}
        onChange={(t) => setTab(t as LeaderboardTab)}
      />

      {/* Tab header */}
      {tab === 'legends' ? (
        <div className="game-card border-2 border-blood bg-blood/5 mb-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame size={14} className="text-blood" />
            <h3 className="font-display text-sm font-black text-blood uppercase tracking-widest">Hall of Legends</h3>
            <Flame size={14} className="text-blood" />
          </div>
          <p className="text-[0.5rem] text-muted-foreground">Spelers die het eindspel bereikten — één leven, geen tweede kans.</p>
        </div>
      ) : (
        <SectionHeader title="Online Ranking" icon={<Trophy size={12} />} />
      )}

      {/* Sort pills */}
      <div className="flex gap-1.5 mb-3">
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setSortBy(opt.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[0.55rem] font-bold uppercase tracking-wider transition-all ${
              sortBy === opt.id
                ? tab === 'legends'
                  ? 'bg-blood/15 border border-blood text-blood'
                  : 'bg-gold/15 border border-gold text-gold'
                : 'bg-muted border border-border text-muted-foreground'
            }`}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>

      {/* My position */}
      {myEntry && myRank && (
        <div className={`game-card border-l-[3px] mb-3 ${tab === 'legends' ? 'border-l-blood' : 'border-l-gold'}`}>
          <div className="flex items-center gap-2 text-xs">
            <span className={`font-bold ${tab === 'legends' ? 'text-blood' : 'text-gold'}`}>#{myRank}</span>
            <Crown size={12} className={tab === 'legends' ? 'text-blood' : 'text-gold'} />
            <span className="font-bold">{myEntry.username}</span>
            <span className="text-muted-foreground ml-auto">REP {myEntry.rep}</span>
          </div>
        </div>
      )}

      {/* Leaderboard list */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-xs font-ui">Laden...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          {tab === 'legends' ? (
            <>
              <Flame size={24} className="mx-auto text-blood/40 mb-2" />
              <p className="text-xs text-muted-foreground">Nog geen legendes. Wees de eerste die het eindspel haalt.</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Nog geen spelers op het leaderboard. Wees de eerste!</p>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry, i) => {
            const rank = i + 1;
            const isMe = entry.user_id === currentUserId;
            const isLegend = tab === 'legends';

            return (
              <motion.button
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelectedPlayer(entry)}
                className={`w-full game-card flex items-center gap-2 text-left transition-all hover:border-gold/40 ${
                  isMe ? 'border-gold/50 bg-gold/5' : ''
                } ${isLegend && rank <= 3 ? 'border-blood/40 bg-blood/5' : ''}`}
              >
                {/* Rank */}
                <span className={`w-7 text-center font-bold text-xs ${
                  isLegend
                    ? rank === 1 ? 'text-blood' : rank <= 3 ? 'text-blood/70' : 'text-muted-foreground'
                    : rank === 1 ? 'text-gold' : rank === 2 ? 'text-foreground' : rank === 3 ? 'text-amber-600' : 'text-muted-foreground'
                }`}>
                  {isLegend
                    ? rank <= 3 ? ['💀', '⚔️', '🔥'][rank - 1] : `#${rank}`
                    : rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`
                  }
                </span>

                {/* Name + level */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold truncate ${isMe ? 'text-gold' : isLegend ? 'text-blood' : ''}`}>{entry.username}</span>
                    {entry.is_hardcore && <Skull size={10} className="text-blood" />}
                    {(entry.prestige_level || 0) > 0 && <PrestigeBadge level={entry.prestige_level!} />}
                    <span className="text-[0.5rem] text-muted-foreground">Lv.{entry.level}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[0.5rem] text-muted-foreground">
                    <span>Dag {entry.day}</span>
                    {entry.districts_owned > 0 && <span>🏠{entry.districts_owned}</span>}
                    {entry.crew_size > 0 && <span>👥{entry.crew_size}</span>}
                    {isLegend && <GameBadge variant="blood" size="xs">LEGENDE</GameBadge>}
                  </div>
                </div>

                {/* Sort value */}
                <div className="text-right">
                  <span className={`text-xs font-bold ${isLegend ? 'text-blood' : 'text-gold'}`}>
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
          userId={selectedPlayer.user_id}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
