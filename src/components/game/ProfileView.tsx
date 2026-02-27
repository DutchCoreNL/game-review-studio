import { useGame } from '@/contexts/GameContext';
import { getPlayerStat, getRankTitle } from '@/game/engine';
import { GEAR, ACHIEVEMENTS, DISTRICTS, DISTRICT_REP_PERKS } from '@/game/constants';
import { ACHIEVEMENT_IMAGES } from '@/assets/items';
import { ENDGAME_PHASES, getPhaseIndex } from '@/game/endgame';
import { StatId, DistrictId } from '@/game/types';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { StatBar } from './ui/StatBar';
import { InfoRow } from './ui/InfoRow';
import { AnimatedXPBar } from './animations/RewardPopup';
import { SubTabBar, SubTab } from './ui/SubTabBar';
import { ViewWrapper } from './ui/ViewWrapper';
import { motion } from 'framer-motion';
import { Swords, Brain, Gem, Sword, Shield, Smartphone, Trophy, BarChart3, Target, Coins, Dices, Calendar, Skull, Star, MapPin, Crown, Users, Home, Settings, Mail } from 'lucide-react';
import { PrestigeBadge } from './ui/PrestigeBadge';
import { ConfirmDialog } from './ConfirmDialog';
import { NpcRelationsPanel } from './profile/NpcRelationsPanel';
import { KarmaPanel } from './profile/KarmaPanel';
import { StoryArcsPanel } from './profile/StoryArcsPanel';
import { StatsOverviewPanel } from './profile/StatsOverviewPanel';
import { VillaSummaryPanel } from './profile/VillaSummaryPanel';
import { AudioSettingsPanel } from './profile/AudioSettingsPanel';
import { ReputationLeaderboard } from './profile/ReputationLeaderboard';
import { LeaderboardView } from './LeaderboardView';
import { StatisticsCharts } from './profile/StatisticsCharts';
import { useState } from 'react';
import { SkillTreePanel } from './profile/SkillTreePanel';
import profileBg from '@/assets/profile-bg.jpg';
import { DrugEmpireStatsPanel } from './profile/DrugEmpireStatsPanel';
import { LinkAccountPanel } from './profile/LinkAccountPanel';
import { AdminPanel } from './AdminPanel';
import { MessagesView } from './MessagesView';
import { useAdmin } from '@/hooks/useAdmin';

const STAT_INFO: { id: StatId; label: string; icon: React.ReactNode }[] = [
  { id: 'muscle', label: 'Kracht', icon: <Swords size={14} /> },
  { id: 'brains', label: 'Vernuft', icon: <Brain size={14} /> },
  { id: 'charm', label: 'Charisma', icon: <Gem size={14} /> },
];

const SLOT_ICONS: Record<string, React.ReactNode> = {
  weapon: <Sword size={20} />,
  armor: <Shield size={20} />,
  gadget: <Smartphone size={20} />,
};

type ProfileTab = 'stats' | 'skills' | 'loadout' | 'contacts' | 'districts' | 'arcs' | 'trophies' | 'leaderboard' | 'messages' | 'imperium' | 'settings' | 'admin';

export function ProfileView() {
  const { state, dispatch, showToast, setView, onExitToMenu } = useGame();
  const [profileTab, setProfileTab] = useState<ProfileTab>('stats');
  const [confirmReset, setConfirmReset] = useState(false);
  const { isAdmin } = useAdmin();
  const xpPct = Math.min(100, (state.player.xp / state.player.nextXp) * 100);
  const rank = getRankTitle(state.rep);
  const stats = state.stats;

  return (
    <ViewWrapper bg={profileBg}>
      {/* Boss Card */}
      <div className="game-card border-l-[3px] border-l-gold mb-4 mt-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
            <Skull size={18} className="text-gold" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm font-display tracking-wider uppercase">The Boss</h3>
              {state.newGamePlusLevel > 0 && <PrestigeBadge level={state.newGamePlusLevel} size="md" />}
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-[0.6rem] text-gold font-semibold">{rank} — Level {state.player.level}</p>
            </div>
            <div className="mt-1.5">
              <AnimatedXPBar xp={state.player.xp} nextXp={state.player.nextXp} level={state.player.level} />
              <p className="text-[0.5rem] text-muted-foreground mt-0.5 text-right">
                {state.player.xp}/{state.player.nextXp} XP
                {state.player.skillPoints > 0 && <span className="text-gold font-bold ml-1">({state.player.skillPoints} SP)</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tabs — consolidated 12→9 */}
      <SubTabBar
        tabs={[
          { id: 'stats', label: 'STATS', icon: <BarChart3 size={11} /> },
          { id: 'skills', label: 'SKILLS', icon: <Star size={11} /> },
          { id: 'loadout', label: 'LOADOUT', icon: <Shield size={11} /> },
          { id: 'contacts', label: 'NPC\'S', icon: <Users size={11} /> },
          { id: 'districts', label: 'REPUTATIE', icon: <MapPin size={11} /> },
          { id: 'arcs', label: 'BOGEN', icon: <Target size={11} /> },
          { id: 'trophies', label: 'TROFEEËN', icon: <Trophy size={11} /> },
          { id: 'leaderboard', label: 'ONLINE', icon: <Crown size={11} /> },
          { id: 'messages', label: 'MAIL', icon: <Mail size={11} /> },
          { id: 'imperium', label: 'IMPERIUM', icon: <Skull size={11} /> },
          { id: 'settings', label: '⚙️', icon: <Settings size={11} /> },
          ...(isAdmin ? [{ id: 'admin', label: 'ADMIN', icon: <Shield size={11} />, badge: true }] : []),
        ] as SubTab<string>[]}
        active={profileTab}
        onChange={(id) => setProfileTab(id as ProfileTab)}
      />

      {profileTab === 'stats' && (
        <>
          {/* Skills */}
          <SectionHeader title="Eigenschappen" icon={<Swords size={12} />} />
          <div className="game-card mb-4 space-y-3">
            {STAT_INFO.map(s => {
              const base = state.player.stats[s.id];
              const total = getPlayerStat(state, s.id);
              const bonus = total - base;
              return (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <div className="w-16 flex items-center gap-1.5 text-muted-foreground">{s.icon}<span>{s.label}</span></div>
                  <div className="flex-1"><StatBar value={total} max={15} color="gold" height="sm" animate={false} /></div>
                  <span className="font-bold w-10 text-right">{base}{bonus > 0 && <span className="text-gold">+{bonus}</span>}</span>
                  {state.player.skillPoints > 0 && (
                    <button onClick={() => { dispatch({ type: 'UPGRADE_STAT', stat: s.id }); showToast(`${s.label} verhoogd!`); }}
                      className="w-5 h-5 rounded bg-muted border border-gold text-gold text-xs flex items-center justify-center hover:bg-gold/10">+</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Karma */}
          <KarmaPanel />

          {/* Statistics Overview */}
          <StatsOverviewPanel />

          {/* Legacy Statistics */}
          <SectionHeader title="Statistieken" icon={<BarChart3 size={12} />} />
          <div className="game-card mb-4">
            <div className="grid grid-cols-2 gap-2">
              <InfoRow icon={<Coins size={10} />} label="Verdiend" value={`€${stats.totalEarned.toLocaleString()}`} valueClass="text-emerald" />
              <InfoRow icon={<Coins size={10} />} label="Uitgegeven" value={`€${stats.totalSpent.toLocaleString()}`} valueClass="text-blood" />
              <InfoRow icon={<Dices size={10} />} label="Casino +" value={`€${stats.casinoWon.toLocaleString()}`} valueClass="text-gold" />
              <InfoRow icon={<Dices size={10} />} label="Casino -" value={`€${stats.casinoLost.toLocaleString()}`} valueClass="text-blood" />
              <InfoRow icon={<Target size={10} />} label="Missies ✓" value={`${stats.missionsCompleted}`} valueClass="text-emerald" />
              <InfoRow icon={<Target size={10} />} label="Missies ✗" value={`${stats.missionsFailed}`} valueClass="text-blood" />
              <InfoRow icon={<BarChart3 size={10} />} label="Trades" value={`${stats.tradesCompleted}`} valueClass="text-gold" />
              <InfoRow icon={<Calendar size={10} />} label="Dagen" value={`${stats.daysPlayed}`} />
            </div>
          </div>

          {/* Debt */}
          {state.debt > 0 && (
            <>
              <SectionHeader title="Schuld" icon={<Skull size={12} />} />
              <div className="game-card border-l-[3px] border-l-blood mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-blood">€{state.debt.toLocaleString()}</h4>
                    <p className="text-[0.55rem] text-muted-foreground">3% rente per dag</p>
                  </div>
                  <GameButton variant="blood" size="sm"
                    onClick={() => { const amt = Math.min(5000, state.money, state.debt); dispatch({ type: 'PAY_DEBT', amount: amt }); showToast(`€${amt.toLocaleString()} afgelost`); }}>
                    AFLOSSEN
                  </GameButton>
                </div>
              </div>
            </>
          )}

          {/* Casino Quick Link */}
          <SectionHeader title="Casino" icon={<Dices size={12} />} />
          <div className="game-card mb-4 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs">The Velvet Room</h4>
              <p className="text-[0.5rem] text-muted-foreground">Blackjack, Roulette, Slots & High-Low</p>
              <p className="text-[0.45rem] text-gold">Casino €{state.stats.casinoWon.toLocaleString()} gewonnen</p>
            </div>
            <GameButton variant="purple" size="sm" onClick={() => setView('city')}>
              OPEN KAART
            </GameButton>
          </div>
          {/* Charts inline */}
          <StatisticsCharts />
        </>
      )}

      {profileTab === 'loadout' && (
        <>
          <SectionHeader title="Loadout" icon={<Shield size={12} />} />
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(['weapon', 'armor', 'gadget'] as const).map(slot => {
              const gearId = state.player.loadout[slot];
              const item = gearId ? GEAR.find(g => g.id === gearId) : null;
              return (
                <motion.button key={slot}
                  onClick={() => { if (gearId) { dispatch({ type: 'UNEQUIP', slot }); showToast('Item uitgedaan'); } }}
                  className={`aspect-square rounded flex flex-col items-center justify-center text-center p-2 transition-all ${
                    item ? 'border border-gold bg-gold/5 text-foreground' : 'border border-dashed border-border bg-muted/30 text-muted-foreground'
                  }`}
                  whileTap={{ scale: 0.95 }}>
                  {SLOT_ICONS[slot]}
                  <span className="text-[0.5rem] mt-1 uppercase tracking-wider font-semibold">{item ? item.name : slot}</span>
                </motion.button>
              );
            })}
          </div>

          <SectionHeader title="Kluis" />
          <div className="space-y-2 mb-4">
            {state.ownedGear.filter(id => !Object.values(state.player.loadout).includes(id)).map(id => {
              const item = GEAR.find(g => g.id === id);
              if (!item) return null;
              return (
                <div key={id} className="game-card flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs">{item.name}</h4>
                    <p className="text-[0.5rem] text-muted-foreground">{item.desc}</p>
                  </div>
                  <GameButton variant="gold" size="sm" onClick={() => { dispatch({ type: 'EQUIP', id }); showToast(`${item.name} uitgerust`); }}>
                    DRAAG
                  </GameButton>
                </div>
              );
            })}
            {state.ownedGear.filter(id => !Object.values(state.player.loadout).includes(id)).length === 0 && (
              <p className="text-muted-foreground text-xs italic py-3">Kluis is leeg. Koop gear op de Zwarte Markt (Handel tab).</p>
            )}
          </div>
        </>
      )}

      {profileTab === 'skills' && <SkillTreePanel />}

      {profileTab === 'contacts' && <NpcRelationsPanel />}

      {profileTab === 'arcs' && <StoryArcsPanel />}

      {profileTab === 'leaderboard' && <LeaderboardView />}

      {profileTab === 'messages' && <MessagesView />}

      {profileTab === 'imperium' && (
        <>
          <VillaSummaryPanel />
          <div className="mt-4">
            <DrugEmpireStatsPanel />
          </div>
        </>
      )}

      {profileTab === 'settings' && <AudioSettingsPanel />}

      {profileTab === 'admin' && isAdmin && <AdminPanel />}

      {profileTab === 'districts' && (
        <>
          <SectionHeader title="District Reputatie" icon={<MapPin size={12} />} />
          <div className="space-y-2 mb-4">
            {(Object.keys(DISTRICTS) as DistrictId[]).map(id => {
              const rep = state.districtRep?.[id] || 0;
              const isOwned = state.ownedDistricts.includes(id);
              const perks = DISTRICT_REP_PERKS[id] || [];

              return (
                <div key={id} className={`game-card border-l-[3px] ${isOwned ? 'border-l-blood' : 'border-l-border'}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {isOwned && <Crown size={10} className="text-blood" />}
                      <h4 className="font-bold text-xs">{DISTRICTS[id].name}</h4>
                    </div>
                    <span className="text-[0.55rem] font-bold text-gold">{rep}/100</span>
                  </div>
                  <StatBar value={rep} max={100} color="gold" height="sm" />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {perks.map(p => (
                      <span key={p.threshold} className={`text-[0.4rem] font-semibold px-1 py-0.5 rounded ${
                        rep >= p.threshold
                          ? 'bg-gold/10 text-gold'
                          : 'bg-muted/50 text-muted-foreground opacity-40'
                      }`}>
                        {rep >= p.threshold ? '✓' : `${p.threshold}+`} {p.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {profileTab === 'trophies' && (
        <>
          {/* Progression Timeline */}
          <SectionHeader title="Progressie" icon={<Crown size={12} />} />
          <div className="game-card mb-4">
            <div className="space-y-2">
              {ENDGAME_PHASES.map((phase, i) => {
                const currentIdx = getPhaseIndex(state.endgamePhase);
                const isCompleted = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={phase.id} className={`flex items-center gap-2 text-xs rounded p-1.5 ${
                    isCurrent ? 'bg-gold/10 border border-gold' : isCompleted ? 'opacity-70' : 'opacity-30'
                  }`}>
                    <span className="text-base">{phase.icon}</span>
                    <div className="flex-1">
                      <span className={`font-bold ${isCurrent ? 'text-gold' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {phase.label}
                      </span>
                      <p className="text-[0.45rem] text-muted-foreground">{phase.desc}</p>
                    </div>
                    {isCompleted && <span className="text-emerald text-xs font-bold">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <SectionHeader title={`Achievements (${state.achievements.length}/${ACHIEVEMENTS.length})`} icon={<Trophy size={12} />} />
          <div className="grid grid-cols-1 gap-2 mb-4">
            {ACHIEVEMENTS.map(a => {
              const unlocked = state.achievements.includes(a.id);
              const prog = !unlocked && a.progress ? a.progress(state) : null;
              const pct = prog ? Math.floor((prog.current / prog.target) * 100) : (unlocked ? 100 : 0);
              const imgSrc = ACHIEVEMENT_IMAGES[a.id];
              return (
                <div key={a.id} className={`game-card flex items-center gap-2.5 ${unlocked ? 'border-gold/60' : 'border-border'}`}>
                  <div className={`w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0 ${unlocked ? 'border-gold' : 'border-muted'}`}>
                    {imgSrc ? (
                      <img src={imgSrc} alt={a.name} className={`w-full h-full object-cover ${unlocked ? '' : 'grayscale opacity-50'}`} />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${unlocked ? 'bg-gold/15' : 'bg-muted'}`}>
                        <Trophy size={14} className={unlocked ? 'text-gold' : 'text-muted-foreground'} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[0.6rem] font-bold truncate ${unlocked ? 'text-gold' : ''}`}>{a.name}</span>
                      {unlocked && <span className="text-[0.45rem] text-gold">✓</span>}
                    </div>
                    <div className="text-[0.45rem] text-muted-foreground truncate">{a.desc}</div>
                    {/* Progress bar */}
                    {!unlocked && prog && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold/60 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[0.4rem] text-muted-foreground font-bold whitespace-nowrap">
                          {prog.target >= 10000 ? `€${(prog.current / 1000).toFixed(0)}k/€${(prog.target / 1000).toFixed(0)}k` : `${prog.current}/${prog.target}`}
                        </span>
                      </div>
                    )}
                    {unlocked && (
                      <div className="mt-0.5">
                        <div className="h-1.5 bg-gold/20 rounded-full overflow-hidden">
                          <div className="h-full bg-gold rounded-full w-full" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <SectionHeader title="Reputatie Rang" />
          <div className="space-y-1.5 mb-4">
            {[
              { title: 'STRAATRAT', min: 0 },
              { title: 'ASSOCIATE', min: 50 },
              { title: 'SOLDAAT', min: 200 },
              { title: 'CAPO', min: 500 },
              { title: 'UNDERBOSS', min: 1000 },
              { title: 'CRIME LORD', min: 2000 },
              { title: 'KINGPIN', min: 5000 },
            ].map(r => (
              <div key={r.title} className={`flex justify-between items-center text-xs px-2 py-1 rounded ${
                r.title === rank ? 'bg-gold/10 border border-gold text-gold font-bold' :
                state.rep >= r.min ? 'text-foreground' : 'text-muted-foreground opacity-50'
              }`}>
                <span>{r.title}</span>
                <span>{r.min}+ REP</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Link Account for anonymous users */}
      <LinkAccountPanel />

      {/* Menu & Reset */}
      <div className="flex gap-2 mt-4">
        {onExitToMenu && (
          <button onClick={onExitToMenu}
            className="flex-1 py-2 rounded text-xs font-semibold text-gold bg-gold/10 border border-gold/30 hover:bg-gold/20 transition-colors flex items-center justify-center gap-1.5">
            <Home size={12} /> HOOFDMENU
          </button>
        )}
        <button onClick={() => setConfirmReset(true)}
          className="flex-1 py-2 rounded text-xs font-semibold text-muted-foreground bg-muted border border-border hover:text-foreground transition-colors">
          OPNIEUW BEGINNEN
        </button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Game Resetten"
        message="Weet je zeker dat je opnieuw wilt beginnen? AL je voortgang gaat verloren."
        confirmText="RESET ALLES"
        variant="danger"
        onConfirm={() => { setConfirmReset(false); dispatch({ type: 'RESET' }); showToast('Spel gereset'); }}
        onCancel={() => setConfirmReset(false)}
      />
    </ViewWrapper>
  );
}
