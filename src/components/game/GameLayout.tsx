import { useGame } from '@/contexts/GameContext';
import { GameHeader } from './GameHeader';
import { GameNav } from './GameNav';
import { MapView } from './MapView';
import { MarketView } from './MarketView';
import { ProfileView } from './ProfileView';
import { AssetsView } from './AssetsView';
import { FamiliesView } from './FamiliesView';
import { MissionsView } from './MissionsView';
import { CasinoView } from './CasinoView';
import { CombatView } from './CombatView';
import { GameToast } from './GameToast';
import { TutorialOverlay } from './TutorialOverlay';
import { NightReport } from './NightReport';
import { motion, AnimatePresence } from 'framer-motion';

const views: Record<string, React.ComponentType> = {
  city: MapView,
  assets: AssetsView,
  business: MarketView,
  families: FamiliesView,
  ops: MissionsView,
  casino: CasinoView,
  profile: ProfileView,
};

export function GameLayout() {
  const { view, state } = useGame();

  // Show combat view if active combat
  const ViewComponent = state.activeCombat ? CombatView : (views[view] || MapView);

  return (
    <div className="flex flex-col h-[100dvh] max-w-[600px] mx-auto bg-card border-x border-border relative overflow-hidden shadow-2xl w-full">
      <GameHeader />

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-3 game-scroll">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.activeCombat ? 'combat' : view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ViewComponent />
          </motion.div>
        </AnimatePresence>
      </main>

      <GameNav />
      <GameToast />

      {!state.tutorialDone && <TutorialOverlay />}
      {state.nightReport && <NightReport />}
    </div>
  );
}
