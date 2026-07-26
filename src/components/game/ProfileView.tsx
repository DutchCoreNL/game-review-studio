import { useGame } from '@/contexts/GameContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getPlayerStat, getRankTitle } from '@/game/engine';
import { StatId } from '@/game/types';
import { BACKSTORIES } from '@/game/backstory';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { StatBar } from './ui/StatBar';
import { InfoRow } from './ui/InfoRow';
import { AnimatedXPBar } from './animations/RewardPopup';
import { SubTabBar, SubTab } from './ui/SubTabBar';
import { ViewWrapper } from './ui/ViewWrapper';
import { motion } from 'framer-motion';
import { Swords, Brain, Gem, Shield, BarChart3, Coins, Dices, Calendar, Skull, Hand, Home } from 'lucide-react';
import { PrestigeBadge } from './ui/PrestigeBadge';
import { ConfirmDialog } from './ConfirmDialog';
import { StatsOverviewPanel } from './profile/StatsOverviewPanel';
import { StatisticsCharts } from './profile/StatisticsCharts';
import { useState } from 'react';
import profileBg from '@/assets/profile-bg.jpg';
import { AdminPanel } from './AdminPanel';
import { useAdmin } from '@/hooks/useAdmin';

/**
 * Tabs that pointed at retired systems are gone: Loadout (weapon and gear arsenals),
 * Contacts (NPC relations), Arcs (story arcs, no longer auto-triggered), Online
 * (the MMO leaderboard), Imperium (villa + drug empire) and Districten — whose
 * DISTRICT_REP_PERKS were displayed but never applied anywhere, and described
 * smuggle risk, baggage, casino winnings and vehicle repairs. Trophies and
 * Instellingen have their own menu entries; duplicating them here was noise.
 */
type ProfileTab = 'stats' | 'admin';

export function ProfileView() {
  const { state, dispatch, showToast, setView, onExitToMenu } = useGame();
  const { t } = useLanguage();
  const [profileTab, setProfileTab] = useState<ProfileTab>('stats');
  const [confirmReset, setConfirmReset] = useState(false);
  const { isAdmin } = useAdmin();
  const xpPct = Math.min(100, (state.player.xp / state.player.nextXp) * 100);
  const rank = getRankTitle(state.rep);
  const stats = state.stats;

  // Each stat now feeds one pillar of the live loop, so spending a point is a real
  // choice: your own hands, what the goods fetch, or how hard the crew pulls.
  const STAT_INFO: { id: StatId; label: string; icon: React.ReactNode; effect: string }[] = [
    { id: 'muscle', label: t.profile.muscle, icon: <Swords size={14} />, effect: '+1 tikkracht per 2 punten' },
    { id: 'brains', label: t.profile.brains, icon: <Brain size={14} />, effect: '+2% buitopbrengst per punt' },
    { id: 'charm', label: t.profile.charm, icon: <Gem size={14} />, effect: '+2% crewsnelheid per punt' },
  ];

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
              <h3 className="font-bold text-sm font-display tracking-wider uppercase">{t.profile.theBoss}</h3>
              {state.newGamePlusLevel > 0 && <PrestigeBadge level={state.newGamePlusLevel} size="md" />}
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-[0.6rem] text-gold font-semibold">{rank} — {t.header.level} {state.player.level}</p>
            </div>
            <div className="mt-1.5">
              <AnimatedXPBar xp={state.player.xp} nextXp={state.player.nextXp} level={state.player.level} />
              <p className="text-[0.5rem] text-muted-foreground mt-0.5 text-right">
                {state.player.xp}/{state.player.nextXp} XP
                {(state.player.statPoints || 0) > 0 && <span className="text-emerald font-bold ml-1">({state.player.statPoints} StP)</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MMO Perk Badge */}
      {state.backstory && (() => {
        const bs = BACKSTORIES.find(b => b.id === state.backstory);
        if (!bs?.mmoPerk) return null;
        return (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="game-card border-l-[3px] border-l-purple-500 mb-4 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-full bg-purple-500/15 border border-purple-500/40 flex items-center justify-center text-lg flex-shrink-0">
              {bs.mmoPerk.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[0.55rem] font-bold uppercase tracking-wider text-purple-400">{t.profile.mmoPerk}</span>
                <span className="text-[0.5rem] text-muted-foreground">— {bs.name}</span>
              </div>
              <h4 className="font-bold text-xs">{bs.mmoPerk.label}</h4>
              <p className="text-[0.5rem] text-muted-foreground">{bs.mmoPerk.desc}</p>
            </div>
          </motion.div>
        );
      })()}

      {/* Sub-tabs — only worth showing when there is more than one */}
      {isAdmin && <SubTabBar
        tabs={[
          { id: 'stats', label: t.profile.stats, icon: <BarChart3 size={11} /> },
          ...(isAdmin ? [{ id: 'admin', label: 'ADMIN', icon: <Shield size={11} />, badge: true }] : []),
        ] as SubTab<string>[]}
        active={profileTab}
        onChange={(id) => setProfileTab(id as ProfileTab)}
      />}

      {profileTab === 'stats' && (
        <>
          {/* Skills */}
          <SectionHeader title={t.profile.properties} icon={<Swords size={12} />} />
          <div className="game-card mb-4 space-y-3">
            {STAT_INFO.map(s => {
              const base = state.player.stats[s.id];
              const total = getPlayerStat(state, s.id);
              const bonus = total - base;
              return (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <div className="w-16 flex flex-col gap-0.5 text-muted-foreground">
                    <span className="flex items-center gap-1.5">{s.icon}<span>{s.label}</span></span>
                    <span className="text-[0.4rem] leading-tight text-muted-foreground/70">{s.effect}</span>
                  </div>
                  <div className="flex-1"><StatBar value={total} max={15} color="gold" height="sm" animate={false} /></div>
                  <span className="font-bold w-10 text-right">{base}{bonus > 0 && <span className="text-gold">+{bonus}</span>}</span>
                  {(state.player.statPoints || 0) > 0 && (
                    <button onClick={() => { dispatch({ type: 'UPGRADE_STAT', stat: s.id }); showToast(`${s.label} ${t.profile.upgraded}`); }}
                      className="w-5 h-5 rounded bg-muted border border-emerald text-emerald text-xs flex items-center justify-center hover:bg-emerald/10">+</button>
                  )}
                </div>
              );
            })}
          </div>

          <StatsOverviewPanel />

          <SectionHeader title={t.profile.statistics} icon={<BarChart3 size={12} />} />
          <div className="game-card mb-4">
            <div className="grid grid-cols-2 gap-2">
              {/* Missions completed/failed used to sit here. Missions are retired, so both
                  counters were frozen at zero while the numbers the player actually
                  generates — klussen and incidents — went unreported. */}
              <InfoRow icon={<Coins size={10} />} label={t.profile.earned} value={`€${stats.totalEarned.toLocaleString()}`} valueClass="text-emerald" />
              <InfoRow icon={<Coins size={10} />} label={t.profile.spent} value={`€${stats.totalSpent.toLocaleString()}`} valueClass="text-blood" />
              <InfoRow icon={<Hand size={10} />} label="Klussen af" value={`${stats.jobsCompleted || 0}`} valueClass="text-gold" />
              <InfoRow icon={<Swords size={10} />} label="Incidenten aangepakt" value={`${stats.incidentsFought || 0}`} valueClass="text-blood" />
              <InfoRow icon={<BarChart3 size={10} />} label={t.profile.trades} value={`${stats.tradesCompleted}`} valueClass="text-gold" />
              <InfoRow icon={<Dices size={10} />} label={t.profile.casinoWon} value={`€${stats.casinoWon.toLocaleString()}`} valueClass="text-gold" />
              <InfoRow icon={<Dices size={10} />} label={t.profile.casinoLost} value={`€${stats.casinoLost.toLocaleString()}`} valueClass="text-blood" />
              <InfoRow icon={<Calendar size={10} />} label={t.profile.days} value={`${stats.daysPlayed}`} />
            </div>
          </div>

          <StatisticsCharts />
        </>
      )}

      {profileTab === 'admin' && isAdmin && <AdminPanel />}

      {/* Progressie, achievements en de rangenlijst stonden hier ook — regel voor regel
          dezelfde inhoud als het menu-item Mijlpalen. Eén plek is genoeg. */}

      <div className="flex gap-2 mt-4">
        {onExitToMenu && (
          <button onClick={onExitToMenu}
            className="flex-1 py-2 rounded text-xs font-semibold text-gold bg-gold/10 border border-gold/30 hover:bg-gold/20 transition-colors flex items-center justify-center gap-1.5">
            <Home size={12} /> {t.profile.mainMenu}
          </button>
        )}
        <button onClick={() => setConfirmReset(true)}
          className="flex-1 py-2 rounded text-xs font-semibold text-muted-foreground bg-muted border border-border hover:text-foreground transition-colors">
          {t.profile.startOver}
        </button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title={t.profile.gameReset}
        message={t.profile.gameResetMsg}
        confirmText={t.profile.resetAll}
        variant="danger"
        onConfirm={() => { setConfirmReset(false); dispatch({ type: 'RESET' }); showToast(t.profile.gameResetDone); }}
        onCancel={() => setConfirmReset(false)}
      />
    </ViewWrapper>
  );
}