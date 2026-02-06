import { useGame } from '@/contexts/GameContext';
import { NEWS_ITEMS } from '@/game/constants';
import { motion } from 'framer-motion';
import { CityMap } from './CityMap';
import { DistrictPopup } from './DistrictPopup';

export function MapView() {
  const { state, selectedDistrict, selectDistrict, dispatch, showToast } = useGame();

  const newsText = NEWS_ITEMS[state.day % NEWS_ITEMS.length];

  return (
    <div>
      {/* News ticker */}
      <div className="bg-background border border-border rounded overflow-hidden mb-4 flex items-center font-mono">
        <span className="text-blood font-bold text-[0.65rem] uppercase border-r border-border px-2.5 py-1.5 flex-shrink-0 bg-background z-10 relative">
          NEWS
        </span>
        <div className="flex-1 overflow-hidden ml-2">
          <span className="text-muted-foreground text-xs whitespace-nowrap ticker-scroll inline-block">
            {newsText}
          </span>
        </div>
      </div>

      {/* City Map */}
      <div className="mb-4">
        <CityMap
          playerLocation={state.loc}
          selectedDistrict={selectedDistrict}
          ownedDistricts={state.ownedDistricts}
          districtDemands={state.districtDemands}
          onSelectDistrict={selectDistrict}
        />
      </div>

      {/* District Popup */}
      {selectedDistrict && <DistrictPopup />}

      {/* End Turn */}
      <motion.button
        onClick={() => {
          if (state.debt > 250000) {
            showToast('Schuld te hoog! (>€250k) Los eerst af.', true);
            return;
          }
          dispatch({ type: 'END_TURN' });
          showToast(`Dag ${state.day + 1} begint...`);
        }}
        className="w-full py-3.5 rounded font-bold text-sm uppercase tracking-wider bg-blood text-primary-foreground glow-blood"
        whileTap={{ scale: 0.97 }}
      >
        DAG AFSLUITEN
      </motion.button>
    </div>
  );
}
