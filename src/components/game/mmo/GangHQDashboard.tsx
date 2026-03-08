import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Coins, Swords, MapPin, Wifi, Shield, Target, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SectionHeader } from '../ui/SectionHeader';
import { Progress } from '@/components/ui/progress';

const DISTRICT_NAMES: Record<string, string> = {
  low: 'Lowrise', port: 'Port Nero', iron: 'Iron Borough', neon: 'Neon Strip', crown: 'Crown Heights',
};

interface MemberStatus {
  user_id: string;
  username: string;
  role: string;
  is_online: boolean;
  district_id: string;
  level: number;
}

interface Props {
  gangId: string;
  gangName: string;
  gangTag: string;
  treasury: number;
  level: number;
  xp: number;
}

export function GangHQDashboard({ gangId, gangName, gangTag, treasury, level, xp }: Props) {
  const [memberStatuses, setMemberStatuses] = useState<MemberStatus[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [activeWars, setActiveWars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    
    // Fetch members with online status
    const { data: members } = await supabase
      .from('gang_members')
      .select('user_id, role')
      .eq('gang_id', gangId);

    if (members && members.length > 0) {
      const userIds = members.map(m => m.user_id);
      const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: onlineData } = await supabase
        .from('player_online_status')
        .select('user_id, username, district_id, level, is_online, last_seen_at')
        .in('user_id', userIds);

      const onlineMap: Record<string, any> = {};
      (onlineData || []).forEach(o => { onlineMap[o.user_id] = o; });

      const statuses: MemberStatus[] = members.map(m => {
        const online = onlineMap[m.user_id];
        return {
          user_id: m.user_id,
          username: online?.username || 'Onbekend',
          role: m.role,
          is_online: online ? (online.is_online && online.last_seen_at >= cutoff) : false,
          district_id: online?.district_id || 'low',
          level: online?.level || 1,
        };
      }).sort((a, b) => (b.is_online ? 1 : 0) - (a.is_online ? 1 : 0));

      setMemberStatuses(statuses);
    }

    // Territories
    const { data: terr } = await supabase
      .from('gang_territories')
      .select('*')
      .eq('gang_id', gangId);
    setTerritories(terr || []);

    // Active wars
    const { data: wars } = await supabase
      .from('gang_wars')
      .select('*')
      .eq('status', 'active')
      .or(`attacker_gang_id.eq.${gangId},defender_gang_id.eq.${gangId}`);
    setActiveWars(wars || []);

    setLoading(false);
  }, [gangId]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-gold" /></div>;

  const onlineCount = memberStatuses.filter(m => m.is_online).length;
  const totalInfluence = territories.reduce((sum, t) => sum + (t.total_influence || 0), 0);
  const xpNeeded = level * 500;

  return (
    <div className="space-y-3">
      <SectionHeader title="Gang HQ" icon={<Building2 size={12} />} badge={`[${gangTag}]`} badgeColor="gold" />

      {/* Quick stats row */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { icon: <Users size={10} />, label: 'Online', value: `${onlineCount}/${memberStatuses.length}`, color: 'text-emerald' },
          { icon: <Coins size={10} />, label: 'Treasury', value: `€${treasury.toLocaleString()}`, color: 'text-gold' },
          { icon: <MapPin size={10} />, label: 'Gebieden', value: `${territories.length}`, color: 'text-blood' },
          { icon: <Swords size={10} />, label: 'Oorlogen', value: `${activeWars.length}`, color: 'text-blood' },
        ].map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="text-center py-2 rounded bg-card/60 border border-border/50"
          >
            <div className={`flex justify-center mb-0.5 ${s.color}`}>{s.icon}</div>
            <div className={`text-[0.55rem] font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[0.35rem] text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* XP Progress */}
      <div className="px-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[0.4rem] text-muted-foreground">Gang Lv.{level} → Lv.{level + 1}</span>
          <span className="text-[0.4rem] font-bold text-gold">{xp}/{xpNeeded} XP</span>
        </div>
        <Progress value={(xp / xpNeeded) * 100} className="h-1 [&>div]:bg-gold" />
      </div>

      {/* Member Status List */}
      <div>
        <span className="text-[0.45rem] text-muted-foreground uppercase tracking-wider font-bold">Leden Status</span>
        <div className="space-y-0.5 mt-1 max-h-32 overflow-y-auto scrollbar-hide">
          {memberStatuses.map(m => (
            <div key={m.user_id} className="flex items-center gap-1.5 px-1.5 py-1 rounded bg-card/30">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.is_online ? 'bg-emerald animate-pulse' : 'bg-muted-foreground/30'}`} />
              <span className="text-[0.5rem] font-bold text-foreground flex-1 truncate">{m.username}</span>
              <span className="text-[0.35rem] text-gold uppercase">{m.role}</span>
              {m.is_online && (
                <span className="text-[0.35rem] text-muted-foreground">
                  {DISTRICT_NAMES[m.district_id]?.split(' ')[0] || m.district_id}
                </span>
              )}
              <span className="text-[0.35rem] text-muted-foreground">Lv.{m.level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Territory overview */}
      {territories.length > 0 && (
        <div>
          <span className="text-[0.45rem] text-muted-foreground uppercase tracking-wider font-bold">Territoria</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {territories.map(t => (
              <div key={t.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blood/10 border border-blood/30">
                <MapPin size={7} className="text-blood" />
                <span className="text-[0.45rem] font-bold text-blood">{DISTRICT_NAMES[t.district_id] || t.district_id}</span>
                {t.defense_level > 0 && (
                  <span className="text-[0.35rem] text-muted-foreground">🛡️{t.defense_level}</span>
                )}
                <span className="text-[0.35rem] text-muted-foreground">⚡{t.total_influence}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[0.4rem] text-muted-foreground">
            <Shield size={7} />
            <span>Totale Invloed: <span className="text-gold font-bold">{totalInfluence}</span></span>
          </div>
        </div>
      )}

      {/* Active Wars */}
      {activeWars.length > 0 && (
        <div>
          <span className="text-[0.45rem] text-muted-foreground uppercase tracking-wider font-bold flex items-center gap-1">
            <Swords size={8} className="text-blood" /> Actieve Oorlogen
          </span>
          <div className="space-y-1 mt-1">
            {activeWars.map(w => {
              const isAttacker = w.attacker_gang_id === gangId;
              const score = isAttacker ? w.attacker_score : w.defender_score;
              const enemyScore = isAttacker ? w.defender_score : w.attacker_score;
              const timeLeft = Math.max(0, Math.floor((new Date(w.ends_at).getTime() - Date.now()) / 3600000));
              
              return (
                <div key={w.id} className="flex items-center justify-between px-2 py-1 rounded bg-blood/5 border border-blood/20">
                  <div>
                    <span className="text-[0.45rem] font-bold text-blood">
                      {isAttacker ? '⚔️ Aanval' : '🛡️ Verdediging'}
                    </span>
                    {w.district_id && (
                      <span className="text-[0.35rem] text-muted-foreground ml-1">
                        {DISTRICT_NAMES[w.district_id]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[0.4rem]">
                    <span className="text-emerald font-bold">{score}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="text-blood font-bold">{enemyScore}</span>
                    <span className="text-muted-foreground">{timeLeft}u</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
