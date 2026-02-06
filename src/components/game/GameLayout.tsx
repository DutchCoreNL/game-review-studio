import { useGame } from '@/contexts/GameContext';
import { GameHeader } from './GameHeader';
import { GameNav } from './GameNav';
import { MapView } from './MapView';
import { TradeView } from './TradeView';
import { ProfileView } from './ProfileView';
import { ImperiumView } from './ImperiumView';
import { OperationsView } from './OperationsView';
import { CombatView } from './CombatView';
import { GameToast } from './GameToast';
import { TutorialOverlay } from './TutorialOverlay';
import { NightReport } from './NightReport';
import { motion, AnimatePresence } from 'framer-motion';

const views: Record<string, React.ComponentType> = {
  city: MapView,
  trade: TradeView,
  ops: OperationsView,
  empire: ImperiumView,
  profile: ProfileView,
};

export function GameLayout() {
  const { view, state } = useGame();

  // Show combat view if active combat
  const ViewComponent = state.activeCombat ? CombatView : (views[view] || MapView);

  return (
    <div className="noise-overlay vignette flex flex-col h-[100dvh] max-w-[600px] mx-auto bg-card border-x border-border relative overflow-hidden shadow-2xl w-full">
      <GameHeader />

      <main className="flex-1 overflow-y-auto pb-16 px-4 pt-2 game-scroll">
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
    </div>
  );
}
