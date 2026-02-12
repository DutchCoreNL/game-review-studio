import { useGame } from '@/contexts/GameContext';
import { useCallback, useEffect } from 'react';
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
import { TutorialOverlay } from './TutorialOverlay';
import { NightReport } from './NightReport';
import { PhoneOverlay } from './PhoneOverlay';
import { CrewSpecPopup } from './CrewSpecPopup';
import { VictoryScreen } from './VictoryScreen';
import { StoryEventPopup } from './StoryEventPopup';
import { StoryArcEvent } from './StoryArcEvent';
import { CarTheftPopup } from './CarTheftPopup';
import { FinalBossAlert } from './FinalBossAlert';
import { CorruptionEventPopup } from './CorruptionEventPopup';
import { WarEventPopup } from './WarEventPopup';
import { BackstorySelection } from './BackstorySelection';
import { FlashbackOverlay } from './FlashbackOverlay';
import { PrisonOverlay } from './PrisonOverlay';
import { AchievementPopup } from './AchievementPopup';
import { ScreenEffects } from './animations/ScreenEffects';
import { motion, AnimatePresence } from 'framer-motion';

const views: Record<string, React.ComponentType> = {
  city: MapView,
  trade: TradeView,
  ops: OperationsView,
  empire: ImperiumView,
  profile: ProfileView,
};

export function GameLayout() {
  const { view, state, dispatch } = useGame();

  const ViewComponent = state.activeCombat ? CombatView : (views[view] || MapView);

  // Music scene management
  useEffect(() => {
    if (state.activeCombat) {
      setMusicScene('combat');
    } else {
      setMusicScene(view as 'city' | 'trade' | 'ops' | 'empire' | 'profile');
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
    if (state.pendingStreetEvent || state.pendingArcEvent || state.pendingCarTheft || state.pendingCorruptionEvent || state.pendingWarEvent) {
      playPopupOpen();
    }
  }, [state.pendingStreetEvent, state.pendingArcEvent, state.pendingCarTheft, state.pendingCorruptionEvent, state.pendingWarEvent]);

  const clearEffect = useCallback(() => {
    dispatch({ type: 'SET_SCREEN_EFFECT', effect: null });
  }, [dispatch]);

  return (
    <ScreenEffects effect={state.screenEffect} onDone={clearEffect}>
      <div className="noise-overlay vignette flex flex-col h-[100dvh] max-w-[600px] mx-auto bg-card border-x border-border relative overflow-hidden shadow-2xl w-full">
        <GameHeader />

        <main className="flex-1 overflow-y-auto pb-2 px-4 pt-2 game-scroll">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.activeCombat ? 'combat' : view}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <ViewComponent />
            </motion.div>
          </AnimatePresence>
        </main>

        <GameNav />
        <GameToast />

        {!state.tutorialDone && <TutorialOverlay />}
        {state.nightReport && <NightReport />}
        {state.activeMission && <MissionEncounterView />}
        {state.showPhone && <PhoneOverlay />}
        {state.pendingSpecChoice && <CrewSpecPopup />}
        {state.victoryData && <VictoryScreen />}
        {state.pendingStreetEvent && <StoryEventPopup />}
        {state.pendingArcEvent && <StoryArcEvent />}
        {state.pendingCarTheft && <CarTheftPopup />}
        {state.pendingCorruptionEvent && <CorruptionEventPopup />}
        {state.pendingFlashback && <FlashbackOverlay />}
        {state.prison && <PrisonOverlay />}
        {state.pendingWarEvent && <WarEventPopup />}
        <FinalBossAlert />
        <AchievementPopup />
        {state.backstory === null && state.tutorialDone && (
          <BackstorySelection onSelect={(id) => dispatch({ type: 'SELECT_BACKSTORY', backstoryId: id })} />
        )}
      </div>
    </ScreenEffects>
  );
}
