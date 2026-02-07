import { useGame } from '@/contexts/GameContext';
import { NEWS_ITEMS } from '@/game/constants';
import { GameButton } from './ui/GameButton';
import { CityMap } from './CityMap';
import { DistrictPopup } from './DistrictPopup';
import { ConfirmDialog } from './ConfirmDialog';
import { CasinoView } from './CasinoView';
import { ChopShopView } from './ChopShopView';
import { NemesisInfo } from './map/NemesisInfo';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Moon, Dices, Wrench } from 'lucide-react';
import { DistrictId } from '@/game/types';
import { HidingOverlay } from './HidingOverlay';

export function MapView() {
  const { state, selectedDistrict, selectDistrict, dispatch, showToast } = useGame();
  const [confirmEndTurn, setConfirmEndTurn] = useState(false);
  const [showCasino, setShowCasino] = useState(false);
  const [showChopShop, setShowChopShop] = useState(false);
  const [travelAnim, setTravelAnim] = useState<{ from: DistrictId; to: DistrictId } | null>(null);
  const travelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLoc = useRef(state.loc);

  // Detect location changes and trigger travel animation
  useEffect(() => {
    if (prevLoc.current !== state.loc) {
      setTravelAnim({ from: prevLoc.current, to: state.loc });
      if (travelTimeout.current) clearTimeout(travelTimeout.current);
      travelTimeout.current = setTimeout(() => setTravelAnim(null), 1200);
      prevLoc.current = state.loc;
    }
  }, [state.loc]);

  const newsText = NEWS_ITEMS[state.day % NEWS_ITEMS.length];

  const handleEndTurn = () => {
    if (state.debt > 250000) {
      showToast('Schuld te hoog! (>€250k) Los eerst af.', true);
      return;
    }
    setConfirmEndTurn(true);
  };

  const confirmEnd = () => {
    setConfirmEndTurn(false);
    dispatch({ type: 'END_TURN' });
  };

  if (showChopShop) {
    return (
      <div>
        <ChopShopView />
        <button
          onClick={() => setShowChopShop(false)}
          className="w-full mt-3 py-2 rounded text-xs font-semibold bg-muted border border-border text-muted-foreground"
        >
          ← TERUG NAAR KAART
        </button>
      </div>
    );
  }

  if (showCasino) {
    return (
      <div>
        <CasinoView />
        <button
          onClick={() => setShowCasino(false)}
          className="w-full mt-3 py-2 rounded text-xs font-semibold bg-muted border border-border text-muted-foreground"
        >
          ← TERUG NAAR KAART
        </button>
      </div>
    );
  }

  const isHiding = (state.hidingDays || 0) > 0;

  return (
    <div className="relative">
      {/* Hiding overlay */}
      <HidingOverlay />

      {/* News ticker */}
      <div className="bg-background border border-border rounded overflow-hidden mb-3 flex items-center font-mono">
        <span className="text-blood font-bold text-[0.6rem] uppercase border-r border-border px-2 py-1.5 flex-shrink-0 bg-background z-10 relative">
          NEWS
        </span>
        <div className="flex-1 overflow-hidden ml-2">
          <span className="text-muted-foreground text-[0.65rem] whitespace-nowrap ticker-scroll inline-block">
            {newsText}
          </span>
        </div>
      </div>

      {/* City Map */}
      <div className="mb-3">
        <CityMap
          playerLocation={state.loc}
          selectedDistrict={selectedDistrict}
          ownedDistricts={state.ownedDistricts}
          districtDemands={state.districtDemands}
          mapEvents={state.mapEvents || []}
          heat={state.heat}
          vehicleHeat={state.ownedVehicles.find(v => v.id === state.activeVehicle)?.vehicleHeat ?? 0}
          personalHeat={state.personalHeat ?? 0}
          weather={state.weather}
          nemesis={state.nemesis}
          travelAnim={travelAnim}
          onSelectDistrict={selectDistrict}
          smuggleRoutes={state.smuggleRoutes || []}
          districtRep={state.districtRep}
        />
      </div>

      {/* Nemesis Info */}
      {state.nemesis && <NemesisInfo />}

      {/* District Popup */}
      {selectedDistrict && !isHiding && <DistrictPopup />}

      {/* Action buttons */}
      <div className="flex gap-2">
        <GameButton variant="blood" size="lg" fullWidth glow icon={<Moon size={14} />} onClick={handleEndTurn}>
          DAG AFSLUITEN
        </GameButton>
        {!isHiding && (
          <GameButton
            variant="purple"
            size="lg"
            icon={<Dices size={14} />}
            onClick={() => {
              if (state.weather === 'storm') {
                showToast('Casino gesloten wegens storm!', true);
                return;
              }
              setShowCasino(true);
            }}
            className={`px-4 ${state.weather === 'storm' ? 'opacity-50' : ''}`}
          >
            CASINO
          </GameButton>
        )}
        {!isHiding && state.loc === 'iron' && (
          <GameButton
            variant="gold"
            size="lg"
            icon={<Wrench size={14} />}
            onClick={() => setShowChopShop(true)}
            className="px-4"
          >
            CHOP SHOP
          </GameButton>
        )}
      </div>

      <ConfirmDialog
        open={confirmEndTurn}
        title="Dag Afsluiten"
        message={`Wil je dag ${state.day} afsluiten? Inkomen, rente (€${Math.floor(state.debt * 0.03).toLocaleString()}) en willekeurige events.`}
        confirmText="SLUIT AF"
        cancelText="ANNULEER"
        variant="warning"
        onConfirm={confirmEnd}
        onCancel={() => setConfirmEndTurn(false)}
      />
    </div>
  );
}
