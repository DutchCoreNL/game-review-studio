import { useState, useEffect, useCallback, useRef } from 'react';
import { gameApi } from '@/lib/gameApi';
import { supabase } from '@/integrations/supabase/client';
import { DISTRICTS } from '@/game/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Shield, Users, ChevronDown, ChevronUp, Trophy, MapPin, Wifi } from 'lucide-react';
import { StatBar } from '../ui/StatBar';

interface GangRankEntry {
  gangId: string;
  name: string;
  tag: string;
  level: number;
  total: number;
  members: { userId: string; username: string; influence: number }[];
}

interface TopContributor {
  userId: string;
  username: string;
  gangName: string;
  gangTag: string;
  influence: number;
}

interface DistrictData {
  districtId: string;
  controller: {
    gangId: string;
    gangName: string;
    gangTag: string;
    gangLevel: number;
    totalInfluence: number;
    defenseLevel: number;
  } | null;
  gangRanking: GangRankEntry[];
  topContributors: TopContributor[];
  totalInfluence: number;
}

const DISTRICT_COLORS: Record<string, 'emerald' | 'gold' | 'purple' | 'ice' | 'blood'> = {
  low: 'emerald',
  iron: 'gold',
  neon: 'purple',
  port: 'ice',
  crown: 'blood',
};

export function DistrictLeaderboardPanel() {
  const [data, setData] = useState<DistrictData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showContributors, setShowContributors] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [flashDistrict, setFlashDistrict] = useState<string | null>(null);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    const res = await gameApi.getDistrictLeaderboard();
    if (res.success && res.data?.districts) {
      setData(res.data.districts);
    }
    setLoading(false);
  }, []);

  // Debounced refetch on realtime change
  const debouncedFetch = useCallback((districtId?: string) => {
    if (districtId) {
      setFlashDistrict(districtId);
      setTimeout(() => setFlashDistrict(null), 1500);
    }
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => fetchData(), 500);
  }, [fetchData]);

  // Initial fetch
  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('district-leaderboard-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'district_influence',
      }, (payload) => {
        const districtId = (payload.new as any)?.district_id || (payload.old as any)?.district_id;
        debouncedFetch(districtId);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gang_territories',
      }, (payload) => {
        const districtId = (payload.new as any)?.district_id || (payload.old as any)?.district_id;
        debouncedFetch(districtId);
      })
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [debouncedFetch]);
  if (loading) {
    return <div className="text-center text-muted-foreground text-xs py-8">Laden...</div>;
  }

  if (data.every(d => d.totalInfluence === 0)) {
    return (
      <div className="text-center text-muted-foreground text-xs py-8">
        <MapPin size={24} className="mx-auto mb-2 opacity-30" />
        Nog geen gang-invloed in districten. Claim territoria via je gang!
      </div>
    );
  }

  const maxInfluence = Math.max(...data.map(d => d.totalInfluence), 1);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[0.5rem] text-muted-foreground">
          Welke gangs domineren welke wijken? Toon invloed, verdediging en top contributors.
        </p>
        {isLive && (
          <span className="flex items-center gap-1 text-[0.45rem] text-emerald font-semibold flex-shrink-0">
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <Wifi size={8} />
            </motion.div>
            LIVE
          </span>
        )}
      </div>

      {data.map((district, i) => {
        const distDef = DISTRICTS[district.districtId];
        if (!distDef) return null;
        const isExpanded = expanded === district.districtId;
        const showingContribs = showContributors === district.districtId;
        const isFlashing = flashDistrict === district.districtId;

        return (
          <motion.div
            key={district.districtId}
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: 1, y: 0,
              boxShadow: isFlashing ? '0 0 15px hsl(var(--gold) / 0.4)' : '0 0 0px transparent',
            }}
            transition={{ delay: i * 0.05 }}
            className={`game-card transition-all ${isFlashing ? 'border-gold/50' : ''}`}
          >
            {/* District header */}
            <button
              onClick={() => setExpanded(isExpanded ? null : district.districtId)}
              className="w-full flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-${DISTRICT_COLORS[district.districtId] || 'muted'}/10`}>
                <MapPin size={16} className={`text-${DISTRICT_COLORS[district.districtId] || 'muted-foreground'}`} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs">{distDef.name}</span>
                  {district.controller && (
                    <span className="text-[0.4rem] bg-gold/10 text-gold px-1.5 rounded font-semibold flex items-center gap-0.5">
                      <Crown size={7} /> [{district.controller.gangTag}]
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[0.5rem] text-muted-foreground">
                  <span>{district.gangRanking.length} gang{district.gangRanking.length !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{district.totalInfluence} invloed</span>
                  {district.controller && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Shield size={7} /> Def {district.controller.defenseLevel}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-16">
                  <StatBar value={district.totalInfluence} max={maxInfluence} color={DISTRICT_COLORS[district.districtId] || 'gold'} height="sm" />
                </div>
                {isExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
              </div>
            </button>

            {/* Expanded details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    {/* Gang ranking */}
                    <div className="flex items-center gap-1 mb-1">
                      <Users size={10} className="text-muted-foreground" />
                      <span className="text-[0.5rem] text-muted-foreground uppercase font-bold tracking-wider">Gang Ranking</span>
                    </div>

                    {district.gangRanking.length === 0 ? (
                      <p className="text-[0.5rem] text-muted-foreground italic">Geen gangs actief in dit district.</p>
                    ) : (
                      district.gangRanking.map((gang, gi) => (
                        <div key={gang.gangId} className="bg-muted/30 rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-display font-bold text-xs ${gi === 0 ? 'text-gold' : gi === 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                              #{gi + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-[0.65rem] truncate">[{gang.tag}] {gang.name}</span>
                                <span className="text-[0.4rem] text-muted-foreground">Lv.{gang.level}</span>
                              </div>
                            </div>
                            <span className="text-[0.6rem] font-bold text-gold">{gang.total}</span>
                          </div>
                          <StatBar value={gang.total} max={district.gangRanking[0]?.total || 1} color={gi === 0 ? 'gold' : 'ice'} height="sm" />
                          {/* Top members */}
                          {gang.members.length > 0 && (
                            <div className="mt-1.5 space-y-0.5">
                              {gang.members.slice(0, 3).map((m, mi) => (
                                <div key={m.userId} className="flex items-center justify-between text-[0.45rem]">
                                  <span className="text-muted-foreground">
                                    {mi === 0 ? '👑' : mi === 1 ? '🥈' : '🥉'} {m.username}
                                  </span>
                                  <span className="font-semibold">{m.influence}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    {/* Top contributors toggle */}
                    {district.topContributors.length > 0 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowContributors(showingContribs ? null : district.districtId); }}
                          className="flex items-center gap-1 text-[0.5rem] text-gold font-semibold mt-1"
                        >
                          <Trophy size={9} />
                          Top Contributors
                          {showingContribs ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                        </button>
                        <AnimatePresence>
                          {showingContribs && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-1 mt-1">
                                {district.topContributors.map((c, ci) => (
                                  <div key={c.userId} className="flex items-center justify-between text-[0.5rem] px-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`font-bold ${ci === 0 ? 'text-gold' : 'text-muted-foreground'}`}>
                                        #{ci + 1}
                                      </span>
                                      <span className="font-semibold">{c.username}</span>
                                      <span className="text-[0.4rem] text-muted-foreground">[{c.gangTag}]</span>
                                    </div>
                                    <span className="font-bold text-gold">{c.influence}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
