import { useGame } from '@/contexts/GameContext';
import { GameButton } from './ui/GameButton';
import { CityMap } from './CityMap';
import { DistrictPopup } from './DistrictPopup';
import { ConfirmDialog } from './ConfirmDialog';
import { CasinoView } from './CasinoView';
import { ChopShopView } from './ChopShopView';
import { SafehouseView } from './SafehouseView';
import { VillaView } from './villa/VillaView';
import { NemesisInfo } from './map/NemesisInfo';
import { NewsTicker } from './map/NewsTicker';
import { NewsDetailPopup } from './map/NewsDetailPopup';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Moon, Dices, Wrench, Home, Building2, Swords } from 'lucide-react';
import { DistrictId } from '@/game/types';
import { type NewsItem } from '@/game/newsGenerator';
import { HidingOverlay } from './HidingOverlay';
import { canTriggerFinalBoss } from '@/game/endgame';

export function MapView() {
  const { state, selectedDistrict, selectDistrict, dispatch, showToast } = useGame();
  const [confirmEndTurn, setConfirmEndTurn] = useState(false);
  const [showCasino, setShowCasino] = useState(false);
  const [showChopShop, setShowChopShop] = useState(false);
  const [showSafehouse, setShowSafehouse] = useState(false);
  const [showVilla, setShowVilla] = useState(false);
  const [travelAnim, setTravelAnim] = useState<{ from: DistrictId; to: DistrictId } | null>(null);
  const travelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLoc = useRef(state.loc);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // Detect location changes and trigger travel animation
  useEffect(() => {
    if (prevLoc.current !== state.loc) {
      setTravelAnim({ from: prevLoc.current, to: state.loc });
      if (travelTimeout.current) clearTimeout(travelTimeout.current);
      travelTimeout.current = setTimeout(() => setTravelAnim(null), 1200);
      prevLoc.current = state.loc;
    }
  }, [state.loc]);

  const newsItems = state.dailyNews;

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

  if (showVilla) {
    return (
      <div>
        <VillaView />
        <button onClick={() => setShowVilla(false)}
          className="w-full mt-3 py-2 rounded text-xs font-semibold bg-muted border border-border text-muted-foreground">
          ← TERUG NAAR KAART
        </button>
      </div>
    );
  }

  if (showChopShop) {
    return (
      <div>
        <ChopShopView />
        <button onClick={() => setShowChopShop(false)}
          className="w-full mt-3 py-2 rounded text-xs font-semibold bg-muted border border-border text-muted-foreground">
          ← TERUG NAAR KAART
        </button>
      </div>
    );
  }

  if (showSafehouse) {
    return (
      <div>
        <SafehouseView />
        <button
          onClick={() => setShowSafehouse(false)}
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
      <NewsTicker items={newsItems} onClickItem={setSelectedNews} />

      {/* News detail popup */}
      <NewsDetailPopup item={selectedNews} onClose={() => setSelectedNews(null)} />

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
          onChopShopClick={!isHiding && state.loc === 'iron' ? () => setShowChopShop(true) : undefined}
          safehouses={state.safehouses}
          onSafehouseClick={!isHiding ? () => setShowSafehouse(true) : undefined}
          villa={state.villa}
          onVillaClick={!isHiding ? () => setShowVilla(true) : undefined}
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
        {!isHiding && (state.loc === 'neon' || (state.districtRep?.crown >= 50)) && (
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
            CHOP
          </GameButton>
        )}
        {!isHiding && state.safehouses.some(sh => sh.district === state.loc) && (
          <GameButton
            variant="emerald"
            size="lg"
            icon={<Home size={14} />}
            onClick={() => setShowSafehouse(true)}
            className="px-4"
          >
            SAFE
          </GameButton>
        )}
        {!isHiding && (state.villa || (state.player.level >= 8 && state.rep >= 300)) && (
          <GameButton
            variant="gold"
            size="lg"
            icon={<Building2 size={14} />}
            onClick={() => setShowVilla(true)}
            className="px-4"
          >
            VILLA
          </GameButton>
        )}
        {!isHiding && canTriggerFinalBoss(state) && !state.activeCombat && (
          <GameButton
            variant="blood"
            size="lg"
            glow
            icon={<Swords size={14} />}
            onClick={() => dispatch({ type: 'START_FINAL_BOSS' })}
            className="px-4"
          >
            DECKER
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
