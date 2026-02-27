import { useGame } from '@/contexts/GameContext';
import { GameButton } from './ui/GameButton';
import { BackButton } from './ui/BackButton';
import { CityMap } from './CityMap';
import { DistrictPopup } from './DistrictPopup';
import { CasinoView } from './CasinoView';
import { ChopShopView } from './ChopShopView';
import { SafehouseView } from './SafehouseView';
import { VillaView } from './villa/VillaView';
import { HospitalView } from './HospitalView';
import { NemesisInfo } from './map/NemesisInfo';
import { NewsTicker } from './map/NewsTicker';
import { BreakingNewsFlash } from './map/BreakingNewsFlash';
import { NewsDetailPopup } from './map/NewsDetailPopup';
import { useState, useRef, useEffect } from 'react';
import { Dices, Wrench, Home, Building2, Swords, Heart } from 'lucide-react';
import { DistrictId } from '@/game/types';
import { type NewsItem } from '@/game/newsGenerator';
import { HidingOverlay } from './HidingOverlay';
import { canTriggerFinalBoss } from '@/game/endgame';
import { useDistrictData } from '@/hooks/useDistrictData';
import { useWorldState } from '@/hooks/useWorldState';
import { useRealtimeNews } from '@/hooks/useRealtimeNews';

export function MapView() {
  const { state, selectedDistrict, selectDistrict, dispatch, showToast } = useGame();
  const [showCasino, setShowCasino] = useState(false);
  const [showChopShop, setShowChopShop] = useState(false);
  const [showSafehouse, setShowSafehouse] = useState(false);
  const [showVilla, setShowVilla] = useState(false);
  const [showHospital, setShowHospital] = useState(false);
  const [travelAnim, setTravelAnim] = useState<{ from: DistrictId; to: DistrictId } | null>(null);
  const travelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLoc = useRef(state.loc);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const districtData = useDistrictData(true);
  const worldState = useWorldState();

  // Detect location changes and trigger travel animation
  useEffect(() => {
    if (prevLoc.current !== state.loc) {
      setTravelAnim({ from: prevLoc.current, to: state.loc });
      if (travelTimeout.current) clearTimeout(travelTimeout.current);
      travelTimeout.current = setTimeout(() => setTravelAnim(null), 1200);
      prevLoc.current = state.loc;
    }
  }, [state.loc]);

  const { items: newsItems, breakingItem, clearBreaking } = useRealtimeNews(state.dailyNews);

  // Auto-tick is now handled by GameContext — no manual end-turn needed

  // Sub-location views
  const subViews: { show: boolean; component: React.ReactNode; onClose: () => void }[] = [
    { show: showVilla, component: <VillaView />, onClose: () => setShowVilla(false) },
    { show: showHospital, component: <HospitalView />, onClose: () => setShowHospital(false) },
    { show: showChopShop, component: <ChopShopView />, onClose: () => setShowChopShop(false) },
    { show: showSafehouse, component: <SafehouseView />, onClose: () => setShowSafehouse(false) },
    { show: showCasino, component: <CasinoView />, onClose: () => setShowCasino(false) },
  ];

  const activeSubView = subViews.find(sv => sv.show);
  if (activeSubView) {
    return (
      <div>
        {activeSubView.component}
        <BackButton onClick={activeSubView.onClose} />
      </div>
    );
  }

  const isHiding = (state.hidingDays || 0) > 0;

  // Build contextual action buttons
  const contextActions: { id: string; icon: React.ReactNode; label: string; variant: string; onClick: () => void; className?: string }[] = [];

  if (!isHiding) {
    if (canTriggerFinalBoss(state) && !state.activeCombat) {
      contextActions.push({ id: 'decker', icon: <Swords size={14} />, label: 'DECKER', variant: 'blood', onClick: () => dispatch({ type: 'START_FINAL_BOSS' }), className: 'glow-blood' });
    }
    if ((state.loc === 'neon' || (state.districtRep?.crown >= 50))) {
      contextActions.push({ id: 'casino', icon: <Dices size={14} />, label: 'CASINO', variant: 'purple', onClick: () => {
        if (state.weather === 'storm') { showToast('Casino gesloten wegens storm!', true); return; }
        setShowCasino(true);
      }, className: state.weather === 'storm' ? 'opacity-50' : '' });
    }
    if (state.loc === 'iron') {
      contextActions.push({ id: 'chop', icon: <Wrench size={14} />, label: 'CHOP', variant: 'gold', onClick: () => setShowChopShop(true) });
    }
    if (state.loc === 'crown' && state.playerHP < state.playerMaxHP) {
      contextActions.push({ id: 'hospital', icon: <Heart size={14} />, label: 'ZSHS', variant: 'emerald', onClick: () => setShowHospital(true) });
    }
    if (state.safehouses.some(sh => sh.district === state.loc)) {
      contextActions.push({ id: 'safe', icon: <Home size={14} />, label: 'SAFE', variant: 'emerald', onClick: () => setShowSafehouse(true) });
    }
    if (state.villa || (state.player.level >= 8 && state.rep >= 300)) {
      contextActions.push({ id: 'villa', icon: <Building2 size={14} />, label: 'VILLA', variant: 'gold', onClick: () => setShowVilla(true) });
    }
  }

  return (
    <div className="relative">
      <HidingOverlay />
      <NewsTicker items={newsItems} onClickItem={setSelectedNews} />
      <BreakingNewsFlash item={breakingItem} onDone={clearBreaking} />
      <NewsDetailPopup item={selectedNews} onClose={() => setSelectedNews(null)} />

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
          weather={worldState.weather}
          timeOfDay={worldState.timeOfDay}
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
           districtData={districtData}
         />
      </div>

      {state.nemesis && <NemesisInfo />}
      {selectedDistrict && !isHiding && <DistrictPopup districtData={districtData} />}

      {/* Contextual action bar */}
      {contextActions.length > 0 && (
        <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide pb-1">
          {contextActions.map(action => (
            <GameButton
              key={action.id}
              variant={action.variant as any}
              size="sm"
              icon={action.icon}
              onClick={action.onClick}
              className={`flex-shrink-0 px-3 ${action.className || ''}`}
              glow={action.id === 'decker'}
            >
              {action.label}
            </GameButton>
          ))}
        </div>
      )}
    </div>
  );
}
