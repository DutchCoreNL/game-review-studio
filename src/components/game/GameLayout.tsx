import { useGame } from '@/contexts/GameContext';
import React, { useCallback, useEffect, useRef } from 'react';
import { useWorldState } from '@/hooks/useWorldState';
import type { ActiveWeekEvent } from '@/game/weekEvents';
import { useAdmin } from '@/hooks/useAdmin';
import { setVolume } from '@/game/sounds';
import { setMusicScene, stopMusic, setMusicVolume } from '@/game/sounds/ambientMusic';
import { startAmbiance, stopAmbiance, setAmbianceVolume, setWeather } from '@/game/sounds/cityAmbiance';
import { playPopupOpen } from '@/game/sounds/uiSounds';
import { GameHeader } from './GameHeader';
import { GameNav } from './GameNav';
import { MapView } from './MapView';
import { TradeView } from './TradeView';
import { ProfileView } from './ProfileView';
import { ImperiumView } from './ImperiumView';
import { OperationsView } from './OperationsView';
import { CombatView } from './CombatView';
import { MissionEncounterView } from './MissionEncounterView';
import { GameToast } from './GameToast';
import { XpBreakdownPopup } from './XpBreakdownPopup';
import { TutorialOverlay } from './TutorialOverlay';
import { NightReport } from './NightReport';
import { PhoneOverlay } from './PhoneOverlay';
import { CrewSpecPopup } from './CrewSpecPopup';
import { CrewEventPopup } from './CrewEventPopup';
import { VictoryScreen } from './VictoryScreen';
import { StoryEventPopup } from './StoryEventPopup';
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
import { NpcEventPopup } from './NpcEventPopup';
import { WeekEventBanner } from './WeekEventBanner';
import { BountyEncounterPopup } from './bounty/BountyEncounterPopup';
import { NemesisDefeatPopup } from './map/NemesisDefeatPopup';
import { SanctionBanner } from './SanctionBanner';
import { DesktopSidebar } from './DesktopSidebar';
import { MaintenanceOverlay } from './MaintenanceOverlay';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPanelView = React.lazy(() => import('./AdminPanel').then(m => ({ default: m.AdminPanel })));

const views: Record<string, React.ComponentType> = {
  city: MapView,
  trade: TradeView,
  ops: OperationsView,
  empire: ImperiumView,
  profile: ProfileView,
  admin: AdminPanelView,
};

export function GameLayout() {
  const { view, state, dispatch, xpBreakdown, clearXpBreakdown } = useGame();

  const { isAdmin } = useAdmin();
  const worldState = useWorldState();

  const ViewComponent = state.activeCombat ? CombatView : (views[view] || MapView);

  // Music scene management
  useEffect(() => {
    if (state.activeCombat) {
      setMusicScene('combat');
    } else {
      const scene = view === 'admin' ? 'profile' : view;
      setMusicScene(scene as 'city' | 'trade' | 'ops' | 'empire' | 'profile');
    }
  }, [view, state.activeCombat]);

  // Weather-specific ambiance
  useEffect(() => {
    setWeather(state.weather);
  }, [state.weather]);
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
    if (state.pendingStreetEvent || state.pendingArcEvent || state.pendingCarTheft || state.pendingCorruptionEvent || state.pendingWarEvent || state.pendingConquestPopup || state.pendingBountyEncounter) {
      playPopupOpen();
    }
  }, [state.pendingStreetEvent, state.pendingArcEvent, state.pendingCarTheft, state.pendingCorruptionEvent, state.pendingWarEvent, state.pendingConquestPopup, state.pendingBountyEncounter]);

  // Sync world_state.active_event → local activeWeekEvent
  const prevActiveEventRef = useRef<string | null>(null);
  useEffect(() => {
    const serverEvent = worldState.activeEvent as unknown as ActiveWeekEvent | null;
    const serverEventId = serverEvent?.eventId ?? null;
    if (serverEventId !== prevActiveEventRef.current) {
      prevActiveEventRef.current = serverEventId;
      if (serverEvent && serverEvent.daysLeft > 0) {
        (state as any).activeWeekEvent = serverEvent;
      }
    }
  }, [worldState.activeEvent]);

  const clearEffect = useCallback(() => {
    dispatch({ type: 'SET_SCREEN_EFFECT', effect: null });
  }, [dispatch]);

  return (
    <ScreenEffects effect={state.screenEffect} onDone={clearEffect}>
      <div className="noise-overlay vignette flex h-[100dvh] w-full bg-background relative overflow-hidden">
        {/* Desktop sidebar - hidden on mobile */}
        <DesktopSidebar />

        {/* Main game column */}
        <div className="flex flex-col flex-1 max-w-[600px] lg:max-w-none mx-auto bg-card border-x border-border relative overflow-hidden shadow-2xl">
          <GameHeader />

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
            <GameNav />
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
              onClose={clearXpBreakdown}
            />
          )}

          {!state.tutorialDone && <TutorialOverlay />}
          {state.nightReport && <NightReport />}
          {state.activeMission && <MissionEncounterView />}
          {state.showPhone && <PhoneOverlay />}
          {state.pendingSpecChoice && <CrewSpecPopup />}
          {state.pendingCrewEvent && <CrewEventPopup />}
          {state.victoryData && <VictoryScreen />}
          {!state.prison && state.pendingStreetEvent && <StoryEventPopup />}
          {!state.prison && state.pendingArcEvent && <StoryArcEvent />}
          {!state.prison && state.pendingCarTheft && <CarTheftPopup />}
          {!state.prison && state.pendingCorruptionEvent && <CorruptionEventPopup />}
          {!state.prison && state.pendingFlashback && <FlashbackOverlay />}
          {state.prison && <PrisonOverlay />}
          {state.hospital && <HospitalStayOverlay />}
          {!state.prison && state.pendingWarEvent && <WarEventPopup />}
          {!state.prison && state.pendingConquestPopup && <ConquestPopup />}
          <FinalBossAlert />
          <AchievementPopup />
          {(state as any).pendingNpcEvent && <NpcEventPopup />}
          {state.pendingBountyEncounter && <BountyEncounterPopup />}
          {state.nemesis?.pendingDefeatChoice && <NemesisDefeatPopup />}
          {state.gameOver && <GameOverScreen />}
          {state.pendingCinematic && <CinematicOverlay />}
          {state.backstory === null && state.tutorialDone && (
            <BackstorySelection onSelect={(id) => dispatch({ type: 'SELECT_BACKSTORY', backstoryId: id })} />
          )}
          {worldState.maintenanceMode && !isAdmin && (
            <MaintenanceOverlay message={worldState.maintenanceMessage} />
          )}
        </div>
      </div>
    </ScreenEffects>
  );
}
