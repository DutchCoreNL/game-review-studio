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
import { TradeView } from './TradeView';
import { ProfileView } from './ProfileView';
import { ImperiumView } from './ImperiumView';
import { OperationsView } from './OperationsView';
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

// Lazy-loaded standalone views
const AdminPanelView = React.lazy(() => import('./AdminPanel').then(m => ({ default: m.AdminPanel })));
const CasinoView = React.lazy(() => import('./CasinoView').then(m => ({ default: m.CasinoView })));
const SafehouseView = React.lazy(() => import('./SafehouseView').then(m => ({ default: m.SafehouseView })));
const VillaView = React.lazy(() => import('./villa/VillaView').then(m => ({ default: m.VillaView })));
const HospitalView = React.lazy(() => import('./HospitalView').then(m => ({ default: m.HospitalView })));
const ChopShopView = React.lazy(() => import('./ChopShopView').then(m => ({ default: m.ChopShopView })));
const GarageView = React.lazy(() => import('./garage/GarageView').then(m => ({ default: m.GarageView })));
const GangView = React.lazy(() => import('./GangView').then(m => ({ default: m.GangView })));
const HeistView = React.lazy(() => import('./heist/HeistView').then(m => ({ default: m.HeistView })));
const BountyBoardPanel = React.lazy(() => import('./bounty/BountyBoardPanel').then(m => ({ default: m.BountyBoardPanel })));
const DailyChallengesView = React.lazy(() => import('./DailyChallengesView').then(m => ({ default: m.DailyChallengesView })));
const HitsView = React.lazy(() => import('./HitsView').then(m => ({ default: m.HitsView })));
const MostWantedView = React.lazy(() => import('./MostWantedView').then(m => ({ default: m.MostWantedView })));
const PvPAttackView = React.lazy(() => import('./PvPAttackView').then(m => ({ default: m.PvPAttackView })));
const CorruptionView = React.lazy(() => import('./CorruptionView').then(m => ({ default: m.CorruptionView })));
const MessagesView = React.lazy(() => import('./MessagesView').then(m => ({ default: m.MessagesView })));
const LeaderboardView = React.lazy(() => import('./LeaderboardView').then(m => ({ default: m.LeaderboardView })));

// Lazy trade sub-panels
const MarketPanel = React.lazy(() => import('./trade/MarketPanel').then(m => ({ default: m.MarketPanel })));
const MarketAnalysisPanel = React.lazy(() => import('./trade/MarketAnalysisPanel').then(m => ({ default: m.MarketAnalysisPanel })));
const AuctionPanel = React.lazy(() => import('./trade/AuctionPanel').then(m => ({ default: m.AuctionPanel })));
const StockMarketPanel = React.lazy(() => import('./trade/StockMarketPanel').then(m => ({ default: m.StockMarketPanel })));
const LaunderingPanel = React.lazy(() => import('./trade/LaunderingPanel').then(m => ({ default: m.LaunderingPanel })));
const GearPanel = React.lazy(() => import('./trade/GearPanel').then(m => ({ default: m.GearPanel })));

// Lazy imperium sub-panels  
const DistrictDefensePanel = React.lazy(() => import('./imperium/DistrictDefensePanel').then(m => ({ default: m.DistrictDefensePanel })));
const DistrictLeaderboardPanel = React.lazy(() => import('./imperium/DistrictLeaderboardPanel').then(m => ({ default: m.DistrictLeaderboardPanel })));
const BusinessPanel = React.lazy(() => import('./imperium/BusinessPanel').then(m => ({ default: m.BusinessPanel })));
const FamiliesPanel = React.lazy(() => import('./imperium/FamiliesPanel').then(m => ({ default: m.FamiliesPanel })));

// Lazy ops sub-panels
const ContractsPanel = React.lazy(() => import('./ops/ContractsPanel').then(m => ({ default: m.ContractsPanel })));
const CrewPanel = React.lazy(() => import('./ops/CrewPanel').then(m => ({ default: m.CrewPanel })));

// Lazy profile sub-panels
const SkillTreePanel = React.lazy(() => import('./profile/SkillTreePanel').then(m => ({ default: m.SkillTreePanel })));
const NpcRelationsPanel = React.lazy(() => import('./profile/NpcRelationsPanel').then(m => ({ default: m.NpcRelationsPanel })));
const StoryArcsPanel = React.lazy(() => import('./profile/StoryArcsPanel').then(m => ({ default: m.StoryArcsPanel })));
const ReputationLeaderboard = React.lazy(() => import('./profile/ReputationLeaderboard').then(m => ({ default: m.ReputationLeaderboard })));
const DrugEmpireStatsPanel = React.lazy(() => import('./profile/DrugEmpireStatsPanel').then(m => ({ default: m.DrugEmpireStatsPanel })));
const AudioSettingsPanel = React.lazy(() => import('./profile/AudioSettingsPanel').then(m => ({ default: m.AudioSettingsPanel })));
const LoadoutPanel = React.lazy(() => import('./profile/LoadoutPanel').then(m => ({ default: m.LoadoutPanel })));
const TrophiesPanel = React.lazy(() => import('./profile/TrophiesPanel').then(m => ({ default: m.TrophiesPanel })));
const EducationView = React.lazy(() => import('./EducationView').then(m => ({ default: m.EducationView })));
const GymViewLazy = React.lazy(() => import('./GymView').then(m => ({ default: m.GymView })));
const JobsViewLazy = React.lazy(() => import('./JobsView').then(m => ({ default: m.JobsView })));
const PropertiesView = React.lazy(() => import('./PropertiesView').then(m => ({ default: m.PropertiesView })));
const TravelViewLazy = React.lazy(() => import('./TravelView').then(m => ({ default: m.TravelView })));
const ChatViewLazy = React.lazy(() => import('./ChatView').then(m => ({ default: m.ChatView })));
const OCViewLazy = React.lazy(() => import('./OrganizedCrimesView').then(m => ({ default: m.OrganizedCrimesView })));

const MeritPointsViewLazy = React.lazy(() => import('./MeritPointsView').then(m => ({ default: m.MeritPointsView })));
const WarViewLazy = React.lazy(() => import('./WarView').then(m => ({ default: m.WarView })));
const WeaponInventoryLazy = React.lazy(() => import('./weapons/WeaponInventory').then(m => ({ default: m.WeaponInventory })));
const CampaignViewLazy = React.lazy(() => import('./campaign/CampaignView').then(m => ({ default: m.CampaignView })));
const CodexViewLazy = React.lazy(() => import('./codex/CodexView').then(m => ({ default: m.CodexView })));
const ArmorInventoryLazy = React.lazy(() => import('./gear/GearInventory').then(m => ({ default: () => m.GearInventory({ gearType: 'armor' }) })));
const GadgetInventoryLazy = React.lazy(() => import('./gear/GearInventory').then(m => ({ default: () => m.GearInventory({ gearType: 'gadget' }) })));
const BlackMarketViewLazy = React.lazy(() => import('./shop/BlackMarketView').then(m => ({ default: m.BlackMarketView })));
const SalvageViewLazy = React.lazy(() => import('./crafting/SalvageView').then(m => ({ default: m.SalvageView })));
// View mapping — each sidebar entry maps to a component
const views: Record<string, React.ComponentType> = {
  // Stad
  city: MapView,
  casino: CasinoView,
  hospital: HospitalView,
  safehouse: SafehouseView,
  villa: VillaView,
  chopshop: ChopShopView,
  // Acties
  ops: OperationsView,
  contracts: ContractsPanel,
  heists: HeistView,
  bounties: BountyBoardPanel,
  pvp: PvPAttackView,
  challenges: DailyChallengesView,
  hits: HitsView,
  wanted: MostWantedView,
  crew: CrewPanel,
  // Handel
  trade: TradeView,
  market: MarketPanel,
  analysis: MarketAnalysisPanel,
  auction: AuctionPanel,
  stocks: StockMarketPanel,
  launder: LaunderingPanel,
  gear: GearPanel,
  // Crew & Oorlog
  families: FamiliesPanel,
  gang: GangView,
  war: WarViewLazy,
  corruption: CorruptionView,
  // Imperium
  empire: ImperiumView,
  business: BusinessPanel,
  garage: GarageView,
  districts: DistrictLeaderboardPanel,
  // Profiel
  profile: ProfileView,
  skills: SkillTreePanel,
  loadout: LoadoutPanel,
  contacts: NpcRelationsPanel,
  reputation: ReputationLeaderboard,
  arcs: StoryArcsPanel,
  trophies: TrophiesPanel,
  leaderboard: LeaderboardView,
  messages: MessagesView,
  'imperium-stats': DrugEmpireStatsPanel,
  settings: AudioSettingsPanel,
  education: EducationView,
  gym: GymViewLazy,
  jobs: JobsViewLazy,
  properties: PropertiesView,
  travel: TravelViewLazy,
  chat: ChatViewLazy,
  'organized-crimes': OCViewLazy,
  
  merit: MeritPointsViewLazy,
  weapons: WeaponInventoryLazy,
  campaign: CampaignViewLazy,
  codex: CodexViewLazy,
  'armor-arsenal': ArmorInventoryLazy,
  'gadget-arsenal': GadgetInventoryLazy,
  'black-market': BlackMarketViewLazy,
  'salvage': SalvageViewLazy,
  // Admin
  admin: AdminPanelView,
};

// Map view to music scene
function getMusicScene(v: string): 'city' | 'trade' | 'ops' | 'empire' | 'profile' {
  if (['city', 'casino', 'hospital', 'safehouse', 'villa', 'chopshop', 'travel', 'chat'].includes(v)) return 'city';
  if (['ops', 'contracts', 'heists', 'bounties', 'pvp', 'challenges', 'hits', 'wanted', 'crew', 'campaign'].includes(v)) return 'ops';
  if (['trade', 'market', 'analysis', 'auction', 'stocks', 'launder', 'gear', 'black-market', 'salvage'].includes(v)) return 'trade';
  if (['families', 'gang', 'war', 'corruption', 'empire', 'business', 'garage', 'districts', 'education', 'properties', 'gym', 'jobs'].includes(v)) return 'empire';
  return 'profile';
}

export function GameLayout() {
  const { view, state, dispatch, xpBreakdown, clearXpBreakdown } = useGame();
  const { isAdmin } = useAdmin();
  const worldState = useWorldState();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const ViewComponent = state.activeCombat ? CombatView : (views[view] || MapView);

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

  // Sync world time of day → game state for phase-based events
  useEffect(() => {
    if (worldState.timeOfDay && worldState.timeOfDay !== state.worldTimeOfDay) {
      dispatch({ type: 'SYNC_WORLD_TIME' as any, timeOfDay: worldState.timeOfDay } as any);
    }
  }, [worldState.timeOfDay]);

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

          {/* === OVERLAY PRIORITY SYSTEM ===
               Priority 1: Maintenance (blocks everything)
               Priority 2: Tutorial (blocks all game popups)
               Priority 3: Backstory selection (blocks gameplay popups)
               Priority 4: Game-critical overlays (prison, hospital, game over, cinematic)
               Priority 5: Event popups & notifications
          */}
          {worldState.maintenanceMode && !isAdmin ? (
            <MaintenanceOverlay message={worldState.maintenanceMessage} />
          ) : !state.tutorialDone ? (
            <TutorialOverlay />
          ) : state.backstory === null ? (
            <BackstorySelection onSelect={(id) => dispatch({ type: 'SELECT_BACKSTORY', backstoryId: id })} />
          ) : (
            <>
              {/* Priority 4: Game-critical states */}
              {state.gameOver && <GameOverScreen />}
              {state.prison && <PrisonOverlay />}
              {state.hospital && <HospitalStayOverlay />}
              {state.pendingCinematic && <CinematicOverlay />}
              {state.activeMission && <MissionEncounterView />}
              {state.victoryData && <VictoryScreen />}

              {/* Priority 5: Event popups (only when no critical overlay is active) */}
              {!state.gameOver && !state.prison && !state.hospital && !state.activeMission && !state.pendingCinematic && (
                <>
                  <DailyRewardPopup />
                  <LoreNotification />
                  {state.showPhone && <PhoneOverlay />}
                  {state.pendingSpecChoice && <CrewSpecPopup />}
                  {state.pendingArcEvent && <StoryArcEvent />}
                  {state.pendingCarTheft && <CarTheftPopup />}
                  {state.pendingCorruptionEvent && <CorruptionEventPopup />}
                  {state.pendingFlashback && <FlashbackOverlay />}
                  {state.pendingWarEvent && <WarEventPopup />}
                  {state.pendingConquestPopup && <ConquestPopup />}
                  {state.pendingBountyEncounter && <BountyEncounterPopup />}
                  {state.nemesis?.pendingDefeatChoice && <NemesisDefeatPopup />}
                  <FinalBossAlert />
                  <AchievementPopup />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </ScreenEffects>
  );
}
