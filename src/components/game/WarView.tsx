import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, FAMILIES, DISTRICT_HQ_UPGRADES } from '@/game/constants';
import { getDistrictDefenseLevel } from '@/game/newFeatures';
import { DistrictId, FamilyId } from '@/game/types';
import { supabase } from '@/integrations/supabase/client';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { StatBar } from './ui/StatBar';
import { ViewWrapper } from './ui/ViewWrapper';
import { SubTabBar } from './ui/SubTabBar';
import { Swords, Shield, History, AlertTriangle, Flame, Trophy, Clock, Users, Skull, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import warBg from '@/assets/items/event-war.jpg';

type WarTab = 'overview' | 'defense' | 'history';

interface GangWarRow {
  id: string;
  attacker_gang_id: string;
  defender_gang_id: string;
  attacker_score: number;
  defender_score: number;
  attacker_chain: number;
  defender_chain: number;
  attacker_last_hit_at: string | null;
  defender_last_hit_at: string | null;
  district_id: string | null;
  status: string;
  started_at: string;
  ends_at: string;
  ended_at: string | null;
  winner_gang_id: string | null;
}

interface GangInfo {
  id: string;
  name: string;
  tag: string;
}

export function WarView() {
  const { state, setView } = useGame();
  const [tab, setTab] = useState<WarTab>('overview');
  const [activeWars, setActiveWars] = useState<GangWarRow[]>([]);
  const [pastWars, setPastWars] = useState<GangWarRow[]>([]);
  const [gangs, setGangs] = useState<Record<string, GangInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWars();
  }, []);

  const fetchWars = async () => {
    setLoading(true);
    const [activeRes, pastRes, gangsRes] = await Promise.all([
      supabase.from('gang_wars').select('*').eq('status', 'active').order('started_at', { ascending: false }).limit(20),
      supabase.from('gang_wars').select('*').neq('status', 'active').order('ended_at', { ascending: false }).limit(30),
      supabase.from('gangs').select('id, name, tag').limit(100),
    ]);
    setActiveWars((activeRes.data || []) as GangWarRow[]);
    setPastWars((pastRes.data || []) as GangWarRow[]);
    const gangMap: Record<string, GangInfo> = {};
    (gangsRes.data || []).forEach((g: any) => { gangMap[g.id] = g; });
    setGangs(gangMap);
    setLoading(false);
  };

  const gangName = (id: string) => gangs[id]?.name || 'Onbekend';
  const gangTag = (id: string) => gangs[id]?.tag || '???';

  const warReportCount = (state as any).warResults?.length || 0;
  const pendingWar = state.pendingWarEvent;

  // District war threat level
  const allDistricts = (['port', 'crown', 'iron', 'low', 'neon'] as DistrictId[]);
  const ownedDistricts = allDistricts.filter(d => state.ownedDistricts?.includes(d) || state.districtDefenses[d]?.upgrades?.length > 0);

  return (
    <ViewWrapper bg={warBg}>
      <SubTabBar
        tabs={[
          { id: 'overview', label: 'Overzicht', icon: <Swords size={10} /> },
          { id: 'defense', label: 'Verdediging', icon: <Shield size={10} /> },
          { id: 'history', label: 'Geschiedenis', icon: <History size={10} /> },
        ]}
        active={tab}
        onChange={(t) => setTab(t as WarTab)}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {tab === 'overview' && <OverviewTab activeWars={activeWars} gangName={gangName} gangTag={gangTag} pendingWar={pendingWar} loading={loading} state={state} warReportCount={warReportCount} />}
          {tab === 'defense' && <DefenseTab state={state} ownedDistricts={ownedDistricts} allDistricts={allDistricts} setView={setView} />}
          {tab === 'history' && <HistoryTab pastWars={pastWars} gangName={gangName} gangTag={gangTag} loading={loading} />}
        </motion.div>
      </AnimatePresence>
    </ViewWrapper>
  );
}

/* ========== OVERVIEW TAB ========== */
function OverviewTab({ activeWars, gangName, gangTag, pendingWar, loading, state, warReportCount }: any) {
  return (
    <div className="space-y-3">
      {/* Pending war event alert */}
      {pendingWar && (
        <div className="game-card border-2 border-blood bg-blood/5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-blood" />
            <h4 className="font-black text-xs text-blood uppercase">⚔️ Actieve Aanval!</h4>
          </div>
          <p className="text-[0.55rem] text-muted-foreground">
            {pendingWar.attackerName} valt <span className="font-bold">{DISTRICTS[pendingWar.district]?.name}</span> aan met kracht {pendingWar.attackStrength}!
          </p>
          <p className="text-[0.45rem] text-muted-foreground mt-1">Ga naar de stad om te reageren op de aanval.</p>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="game-card text-center">
          <Swords size={14} className="mx-auto text-blood mb-1" />
          <p className="text-lg font-black text-blood">{activeWars.length}</p>
          <p className="text-[0.45rem] text-muted-foreground uppercase">Actieve Oorlogen</p>
        </div>
        <div className="game-card text-center">
          <Shield size={14} className="mx-auto text-ice mb-1" />
          <p className="text-lg font-black text-ice">{state.ownedDistricts?.length || 0}</p>
          <p className="text-[0.45rem] text-muted-foreground uppercase">Districten</p>
        </div>
        <div className="game-card text-center">
          <Trophy size={14} className="mx-auto text-gold mb-1" />
          <p className="text-lg font-black text-gold">{warReportCount}</p>
          <p className="text-[0.45rem] text-muted-foreground uppercase">Gewonnen</p>
        </div>
      </div>

      {/* Active gang wars */}
      <SectionHeader title="Actieve Gang Wars" icon={<Flame size={12} />} badge={`${activeWars.length}`} badgeColor="blood" />

      {loading ? (
        <div className="game-card text-center py-6">
          <p className="text-[0.55rem] text-muted-foreground animate-pulse">Laden...</p>
        </div>
      ) : activeWars.length === 0 ? (
        <div className="game-card text-center py-6">
          <Swords size={20} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-[0.55rem] text-muted-foreground">Geen actieve gang wars op dit moment.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeWars.map((war: GangWarRow) => {
            const timeLeft = Math.max(0, new Date(war.ends_at).getTime() - Date.now());
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
            const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            return (
              <div key={war.id} className="game-card border-l-[3px] border-l-blood">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Swords size={12} className="text-blood" />
                    <span className="text-[0.55rem] font-bold">[{gangTag(war.attacker_gang_id)}] vs [{gangTag(war.defender_gang_id)}]</span>
                  </div>
                  <div className="flex items-center gap-1 text-[0.45rem] text-muted-foreground">
                    <Clock size={8} />
                    <span>{hoursLeft}u {minsLeft}m</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[0.5rem] text-muted-foreground mb-1">
                  <span>{gangName(war.attacker_gang_id)}</span>
                  <span className="text-blood font-bold">⚔️</span>
                  <span>{gangName(war.defender_gang_id)}</span>
                </div>
                {war.district_id && (
                  <div className="flex items-center gap-1 text-[0.45rem] text-muted-foreground">
                    <MapPin size={8} />
                    <span>{DISTRICTS[war.district_id as DistrictId]?.name || war.district_id}</span>
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <div className="flex-1 bg-blood/10 rounded p-1.5 text-center">
                    <p className="text-[0.4rem] text-muted-foreground">Aanvaller</p>
                    <p className="text-sm font-black text-blood">{war.attacker_score}</p>
                    {(war.attacker_chain || 0) >= 2 && (
                      <p className="text-[0.4rem] text-gold font-bold">🔥 Chain x{war.attacker_chain}</p>
                    )}
                  </div>
                  <div className="flex-1 bg-ice/10 rounded p-1.5 text-center">
                    <p className="text-[0.4rem] text-muted-foreground">Verdediger</p>
                    <p className="text-sm font-black text-ice">{war.defender_score}</p>
                    {(war.defender_chain || 0) >= 2 && (
                      <p className="text-[0.4rem] text-gold font-bold">🔥 Chain x{war.defender_chain}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Faction threat levels */}
      <SectionHeader title="Factie Dreiging" icon={<Skull size={12} />} />
      <div className="space-y-1.5">
        {Object.entries(FAMILIES).map(([id, fam]) => {
          const rel = state.familyRel?.[id] || 0;
          const isHostile = rel < -20;
          const threatLevel = isHostile ? 'VIJANDIG' : rel < 0 ? 'GESPANNEN' : rel >= 50 ? 'BONDGENOOT' : 'NEUTRAAL';
          const threatColor = isHostile ? 'text-blood' : rel < 0 ? 'text-gold' : rel >= 50 ? 'text-emerald' : 'text-muted-foreground';

          return (
            <div key={id} className="game-card flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚔️</span>
                <div>
                  <span className="text-[0.55rem] font-bold">{fam.name}</span>
                  <p className="text-[0.4rem] text-muted-foreground">{fam.home && DISTRICTS[fam.home]?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <GameBadge variant={isHostile ? 'blood' : rel >= 50 ? 'emerald' : 'muted'} size="xs">
                  {threatLevel}
                </GameBadge>
                <p className={`text-[0.45rem] font-bold mt-0.5 ${threatColor}`}>{rel > 0 ? '+' : ''}{rel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ========== DEFENSE TAB ========== */
function DefenseTab({ state, ownedDistricts, allDistricts, setView }: any) {
  return (
    <div className="space-y-3">
      <SectionHeader title="District Verdediging" icon={<Shield size={12} />} />

      {ownedDistricts.length === 0 ? (
        <div className="game-card text-center py-6">
          <Shield size={20} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-[0.55rem] text-muted-foreground">Geen districten met verdediging.</p>
          <p className="text-[0.45rem] text-muted-foreground mt-1">Verover districten via gang influence of conquests.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ownedDistricts.map((distId: DistrictId) => {
            const def = state.districtDefenses[distId];
            if (!def) return null;
            const defLevel = getDistrictDefenseLevel(state, distId);
            const district = DISTRICTS[distId];
            const upgradeCount = def.upgrades?.length || 0;
            const maxUpgrades = DISTRICT_HQ_UPGRADES.length;

            return (
              <div key={distId} className="game-card border-l-[3px] border-l-ice">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-xs">{district.name}</h4>
                    <p className="text-[0.45rem] text-muted-foreground">{upgradeCount}/{maxUpgrades} upgrades</p>
                  </div>
                  <span className="text-sm font-black text-ice">{defLevel}</span>
                </div>
                <StatBar value={Math.min(defLevel, 120)} max={120} color="ice" height="sm" showLabel label="Verdediging" />
                {upgradeCount > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {def.upgrades.map((uid: string) => {
                      const u = DISTRICT_HQ_UPGRADES.find((u: any) => u.id === uid);
                      return u ? <GameBadge key={uid} variant="muted" size="xs">{u.icon} {u.name}</GameBadge> : null;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Undefended districts */}
      {allDistricts.filter((d: DistrictId) => !ownedDistricts.includes(d)).length > 0 && (
        <>
          <SectionHeader title="Onverdedigd" icon={<AlertTriangle size={12} />} />
          <div className="grid grid-cols-2 gap-1.5">
            {allDistricts.filter((d: DistrictId) => !ownedDistricts.includes(d)).map((distId: DistrictId) => (
              <div key={distId} className="game-card bg-muted/30 text-center py-2">
                <p className="text-[0.55rem] font-bold">{DISTRICTS[distId].name}</p>
                <p className="text-[0.4rem] text-muted-foreground">Geen verdediging</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ========== HISTORY TAB ========== */
function HistoryTab({ pastWars, gangName, gangTag, loading }: any) {
  if (loading) {
    return <div className="game-card text-center py-6"><p className="text-[0.55rem] text-muted-foreground animate-pulse">Laden...</p></div>;
  }

  if (pastWars.length === 0) {
    return (
      <div className="game-card text-center py-6">
        <History size={20} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-[0.55rem] text-muted-foreground">Nog geen oorlogsgeschiedenis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SectionHeader title="Oorlogsgeschiedenis" icon={<History size={12} />} badge={`${pastWars.length}`} />
      <div className="space-y-1.5">
        {pastWars.map((war: GangWarRow) => {
          const winnerName = war.winner_gang_id ? gangName(war.winner_gang_id) : 'Onbeslist';
          const endDate = war.ended_at ? new Date(war.ended_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : '—';

          return (
            <div key={war.id} className="game-card flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 text-[0.55rem] font-bold">
                  <span>[{gangTag(war.attacker_gang_id)}]</span>
                  <span className="text-muted-foreground">vs</span>
                  <span>[{gangTag(war.defender_gang_id)}]</span>
                </div>
                <p className="text-[0.4rem] text-muted-foreground">
                  {war.district_id && `${DISTRICTS[war.district_id as DistrictId]?.name || war.district_id} · `}
                  {endDate}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[0.5rem] font-bold text-gold flex items-center gap-0.5">
                  <Trophy size={8} /> {winnerName}
                </p>
                <p className="text-[0.4rem] text-muted-foreground">{war.attacker_score} — {war.defender_score}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
