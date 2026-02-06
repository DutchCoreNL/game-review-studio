import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, DISTRICT_FLAVOR, NEWS_ITEMS } from '@/game/constants';
import { DistrictId } from '@/game/types';
import { motion } from 'framer-motion';
import { CityMap } from './CityMap';

export function MapView() {
  const { state, selectedDistrict, selectDistrict, dispatch, showToast } = useGame();

  const newsText = NEWS_ITEMS[state.day % NEWS_ITEMS.length];

  const handleDistrictAction = () => {
    if (!selectedDistrict) return;
    if (state.loc === selectedDistrict) {
      if (!state.ownedDistricts.includes(selectedDistrict)) {
        dispatch({ type: 'BUY_DISTRICT', id: selectedDistrict });
        showToast(`${DISTRICTS[selectedDistrict].name} overgenomen!`);
      }
    } else {
      dispatch({ type: 'TRAVEL', to: selectedDistrict });
      showToast(`Aangekomen in ${DISTRICTS[selectedDistrict].name}`);
    }
  };

  const sel = selectedDistrict ? DISTRICTS[selectedDistrict] : null;
  const isHere = state.loc === selectedDistrict;
  const isOwned = selectedDistrict ? state.ownedDistricts.includes(selectedDistrict) : false;

  const hasChauffeur = state.crew.some(c => c.role === 'Chauffeur');
  const travelCost = (hasChauffeur || (selectedDistrict && state.ownedDistricts.includes(selectedDistrict))) ? 0 : 50;

  let btnText = 'SELECTEER DISTRICT';
  let btnDisabled = true;
  if (sel && selectedDistrict) {
    if (isHere && isOwned) {
      btnText = 'JOUW TERRITORIUM';
      btnDisabled = true;
    } else if (isHere) {
      btnText = `OVERNEMEN (€${sel.cost.toLocaleString()})`;
      btnDisabled = state.money < sel.cost;
    } else {
      btnText = travelCost > 0 ? `REIS HIERHEEN (€${travelCost})` : 'REIS (GRATIS)';
      btnDisabled = state.money < travelCost;
    }
  }

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

      {/* District Info */}
      {sel && selectedDistrict && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-card border-l-[3px] border-l-blood mb-3"
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <h3 className="font-bold text-sm text-foreground">{sel.name}</h3>
              <p className="text-[0.65rem] text-muted-foreground italic mt-1">
                "{DISTRICT_FLAVOR[selectedDistrict]?.[
                  state.heat > 80 ? 'high_heat' : isOwned ? 'owned' : 'neutral'
                ] || ''}"
              </p>
              <div className={`text-[0.55rem] mt-2 px-2 py-0.5 rounded inline-block font-semibold ${isOwned ? 'bg-[hsl(var(--blood)/0.15)] text-blood' : 'bg-muted text-muted-foreground'}`}>
                ♛ {sel.perk}
              </div>
            </div>
          </div>

          {state.districtDemands[selectedDistrict] && (
            <div className="mt-2 text-[0.65rem] text-gold font-semibold">
              📈 Hoge vraag: {state.districtDemands[selectedDistrict]} (+60%)
            </div>
          )}
        </motion.div>
      )}

      {/* Action Button */}
      <motion.button
        onClick={handleDistrictAction}
        disabled={btnDisabled}
        className={`w-full py-3.5 rounded font-bold text-sm uppercase tracking-wider transition-all ${
          btnDisabled
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : isHere && !isOwned
            ? 'bg-gold text-secondary-foreground glow-gold'
            : 'bg-blood text-primary-foreground glow-blood'
        }`}
        whileTap={!btnDisabled ? { scale: 0.97 } : undefined}
      >
        {btnText}
      </motion.button>

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
        className="w-full mt-3 py-3.5 rounded font-bold text-sm uppercase tracking-wider bg-blood text-primary-foreground glow-blood"
        whileTap={{ scale: 0.97 }}
      >
        DAG AFSLUITEN
      </motion.button>
    </div>
  );
}
