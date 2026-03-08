import { useGame } from '@/contexts/GameContext';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWorldState } from '@/hooks/useWorldState';
import type { ActiveWeekEvent } from '@/game/weekEvents';
import { useAdmin } from '@/hooks/useAdmin';
import { setVolume } from '@/game/sounds';
import { setMusicScene, stopMusic, setMusicVolume } from '@/game/sounds/ambientMusic';
import { startAmbiance, stopAmbiance, setAmbianceVolume, setWeather } from '@/game/sounds/cityAmbiance';
import { playPopupOpen } from '@/game/sounds/uiSounds';
import { GameHeader } from './GameHeader';
import { GameNav } from './GameNav';
import { GameSidebar } from './GameSidebar';
import { MapView } from './MapView';
import { CombatView } from './CombatView';
import { MissionEncounterView } from './MissionEncounterView';
import { GameToast } from './GameToast';
import { XpBreakdownPopup } from './XpBreakdownPopup';
import { TutorialOverlay } from './TutorialOverlay';
import { LoreNotification } from './codex/LoreNotification';
import { DailyRewardPopup } from './DailyRewardPopup';

import { PhoneOverlay } from './PhoneOverlay';
import { CrewSpecPopup } from './CrewSpecPopup';
import { VictoryScreen } from './VictoryScreen';
import { StoryArcEvent } from './StoryArcEvent';
import { CarTheftPopup } from './CarTheftPopup';
import { FinalBossAlert } from './FinalBossAlert';
import { CorruptionEventPopup } from './CorruptionEventPopup';
import { WarEventPopup } from './WarEventPopup';
import { ConquestPopup } from './ConquestPopup';
import { BackstorySelection } from './BackstorySelection';
import { FlashbackOverlay } from './FlashbackOverlay';
import { PrisonOverlay } from './PrisonOverlay';
import { HospitalStayOverlay } from './HospitalStayOverlay';
import { GameOverScreen } from './GameOverScreen';
import { AchievementPopup } from './AchievementPopup';
import { CinematicOverlay } from './CinematicOverlay';
import { ScreenEffects } from './animations/ScreenEffects';

import { WeekEventBanner } from './WeekEventBanner';
import { BountyEncounterPopup } from './bounty/BountyEncounterPopup';
import { NemesisDefeatPopup } from './map/NemesisDefeatPopup';
import { SanctionBanner } from './SanctionBanner';
import { DesktopSidebar } from './DesktopSidebar';
import { MaintenanceOverlay } from './MaintenanceOverlay';
import { motion, AnimatePresence } from 'framer-motion';

import { views, getMusicScene } from './viewRegistry';

export function GameLayout() {
  const { view, state, dispatch, xpBreakdown, clearXpBreakdown } = useGame();
  const { isAdmin } = useAdmin();
  const worldState = useWorldState();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tutorialInitiallyDoneRef = useRef(state.tutorialDone);
  const [forceTutorialOverlay, setForceTutorialOverlay] = useState(() => !state.tutorialDone);

  const ViewComponent = state.activeCombat ? CombatView : (views[view] || MapView);

  useEffect(() => {
    if (state.tutorialDone) {
      setForceTutorialOverlay(false);
    } else {
      const completedInSession = typeof window !== 'undefined' && sessionStorage.getItem('noxhaven_tutorial_completed') === '1';
      if (!completedInSession) {
        setForceTutorialOverlay(true);
      }
    }
  }, [state.tutorialDone]);

  // Music scene management
  useEffect(() => {
    if (state.activeCombat) {
      setMusicScene('combat');
    } else {
      setMusicScene(getMusicScene(view));
    }
  }, [view, state.activeCombat]);

  // Weather-specific ambiance
  useEffect(() => {
    setWeather(state.weather);
  }, [state.weather]);

  // Sync player day with world_day
  useEffect(() => {
    if (!worldState.loading && worldState.worldDay > 0 && state.day !== worldState.worldDay) {
      dispatch({ type: 'SYNC_WORLD_TIME', timeOfDay: worldState.timeOfDay, worldDay: worldState.worldDay });
    }
  }, [worldState.worldDay, worldState.loading]);

  // Load saved audio prefs & start ambiance on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('noxhaven_audio_prefs');
      if (raw) {
        const p = JSON.parse(raw);
        if (p.master != null) setVolume(p.master);
        if (p.music != null) setMusicVolume(p.music);
        if (p.ambiance != null) setAmbianceVolume(p.ambiance);
      }
    } catch {}
    startAmbiance();
    return () => { stopAmbiance(); stopMusic(); };
  }, []);

  // Popup open sounds
  useEffect(() => {
    if (state.pendingArcEvent || state.pendingCarTheft || state.pendingCorruptionEvent || state.pendingWarEvent || state.pendingConquestPopup || state.pendingBountyEncounter) {
      playPopupOpen();
    }
  }, [state.pendingArcEvent, state.pendingCarTheft, state.pendingCorruptionEvent, state.pendingWarEvent, state.pendingConquestPopup, state.pendingBountyEncounter]);

  // Sync world_state.active_event → local activeWeekEvent
  const prevActiveEventRef = useRef<string | null>(null);
  useEffect(() => {
    const serverEvent = worldState.activeEvent as unknown as ActiveWeekEvent | null;
    const serverEventId = serverEvent?.eventId ?? null;
    if (serverEventId !== prevActiveEventRef.current) {
      prevActiveEventRef.current = serverEventId;
      if (serverEvent && serverEvent.daysLeft > 0) {
        dispatch({ type: 'SET_WEEK_EVENT', event: serverEvent });
      }
    }
  }, [worldState.activeEvent]);

  const clearEffect = useCallback(() => {
    dispatch({ type: 'SET_SCREEN_EFFECT', effect: null });
  }, [dispatch]);

  const hasCriticalOverlay = Boolean(
    state.gameOver ||
    state.prison ||
    state.hospital ||
    state.activeMission ||
    state.pendingCinematic ||
    state.victoryData
  );

  const activeEventPopup = (() => {
    if (state.pendingSpecChoice) return <CrewSpecPopup />;
    if (state.pendingArcEvent) return <StoryArcEvent />;
    if (state.pendingBountyEncounter) return <BountyEncounterPopup />;
    if (state.pendingConquestPopup) return <ConquestPopup />;
    if (state.pendingWarEvent) return <WarEventPopup />;
    if (state.pendingCorruptionEvent) return <CorruptionEventPopup />;
    if (state.pendingCarTheft) return <CarTheftPopup />;
    if (state.pendingFlashback) return <FlashbackOverlay />;
    if (state.nemesis?.pendingDefeatChoice) return <NemesisDefeatPopup />;
    if (state.showPhone) return <PhoneOverlay />;
    return null;
  })();

  return (
    <ScreenEffects effect={state.screenEffect} onDone={clearEffect}>
      <div className="noise-overlay vignette flex h-[100dvh] w-full bg-background relative overflow-hidden">
        {/* Desktop sidebar */}
        <DesktopSidebar />

        {/* Mobile sidebar popup */}
        <GameSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

        {/* Main game column */}
        <div className="flex flex-col flex-1 max-w-[600px] lg:max-w-none mx-auto bg-card border-x border-border relative overflow-hidden shadow-2xl">
          <GameHeader onMenuOpen={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto pb-2 px-4 lg:px-6 pt-2 game-scroll">
            <SanctionBanner />
            <WeekEventBanner />
            <AnimatePresence mode="wait">
              <motion.div
                key={state.activeCombat ? 'combat' : view}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="lg:max-w-[900px] lg:mx-auto"
              >
                <React.Suspense fallback={<div className="flex items-center justify-center h-32 text-muted-foreground text-xs">Laden...</div>}>
                  <ViewComponent />
                </React.Suspense>
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Bottom nav - mobile only */}
          <div className="lg:hidden">
            <GameNav onMenuOpen={() => setSidebarOpen(true)} />
          </div>
          <GameToast />
          {xpBreakdown && (
            <XpBreakdownPopup
              show={!!xpBreakdown}
              baseAmount={xpBreakdown.baseAmount}
              totalXp={xpBreakdown.totalXp}
              multiplier={xpBreakdown.multiplier}
              bonuses={xpBreakdown.bonuses}
              levelUps={xpBreakdown.levelUps}
              newLevel={xpBreakdown.newLevel}
              milestoneRewards={xpBreakdown.milestoneRewards}
              unlocks={xpBreakdown.unlocks}
              restedConsumed={xpBreakdown.restedConsumed}
              onClose={clearXpBreakdown}
            />
          )}

          {/* === OVERLAY PRIORITY SYSTEM === */}
          {worldState.maintenanceMode && !isAdmin ? (
            <MaintenanceOverlay message={worldState.maintenanceMessage} />
          ) : forceTutorialOverlay ? (
            <TutorialOverlay />
          ) : state.backstory === null ? (
            <BackstorySelection onSelect={(id) => dispatch({ type: 'SELECT_BACKSTORY', backstoryId: id })} />
          ) : (
            <>
              {state.gameOver && <GameOverScreen />}
              {state.prison && <PrisonOverlay />}
              {state.hospital && <HospitalStayOverlay />}
              {state.pendingCinematic && <CinematicOverlay />}
              {state.activeMission && <MissionEncounterView />}
              {state.victoryData && <VictoryScreen />}

              {!hasCriticalOverlay && (
                <>
                  {activeEventPopup}
                  {!activeEventPopup && (
                    <>
                      <DailyRewardPopup />
                      <LoreNotification />
                      <FinalBossAlert />
                      <AchievementPopup />
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </ScreenEffects>
  );
}
