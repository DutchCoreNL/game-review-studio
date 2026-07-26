import { useGame } from '@/contexts/GameContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { GameButton } from './ui/GameButton';
import { BackButton } from './ui/BackButton';
import { CityMap } from './CityMap';
import { DistrictPopup } from './DistrictPopup';
import { CasinoView } from './CasinoView';
import { SafehouseView } from './SafehouseView';
import { NemesisInfo } from './map/NemesisInfo';
import { MapMMOPanels } from './map/MapMMOPanels';

import { NewsTicker } from './map/NewsTicker';
import { BreakingNewsFlash } from './map/BreakingNewsFlash';
import { NewsDetailPopup } from './map/NewsDetailPopup';
import { useState, useRef, useEffect } from 'react';
import { useDailyDigest } from '@/hooks/useDailyDigest';
import { DailyDigestPopup } from './DailyDigestPopup';
import { Dices, Home, Moon, FileText } from 'lucide-react';
import { NightReport } from './NightReport';
import { DistrictId } from '@/game/types';
import { type NewsItem } from '@/game/newsGenerator';
import { HidingOverlay } from './HidingOverlay';
import { useDistrictData } from '@/hooks/useDistrictData';
import { useWorldState } from '@/hooks/useWorldState';
import { useRealtimeNews } from '@/hooks/useRealtimeNews';

export function MapView() {
  const { state, selectedDistrict, selectDistrict, dispatch, showToast } = useGame();
  const { t } = useLanguage();
  const [showCasino, setShowCasino] = useState(false);
  const [showSafehouse, setShowSafehouse] = useState(false);
  const [travelAnim, setTravelAnim] = useState<{ from: DistrictId; to: DistrictId } | null>(null);
  const travelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLoc = useRef(state.loc);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [showDigest, setShowDigest] = useState(false);
  const [showNightReport, setShowNightReport] = useState(false);
  const { digest, refetchLast } = useDailyDigest();
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

  // Sub-location views
  const subViews: { show: boolean; component: React.ReactNode; onClose: () => void }[] = [
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

  // The final-boss trigger (Commissaris Decker), the Iron Borough chop shop, the
  // Crown Heights hospital and the villa all used to hang here. Faction conquest,
  // vehicles and HP are retired, and the villa was a second progression system —
  // so these were buttons into rooms that no longer exist.
  if (!isHiding) {
    if ((state.loc === 'neon' || (state.districtRep?.crown >= 50))) {
      contextActions.push({ id: 'casino', icon: <Dices size={14} />, label: t.map.casino, variant: 'purple', onClick: () => {
        if (state.weather === 'storm') { showToast(t.map.stormClosed, true); return; }
        setShowCasino(true);
      }, className: state.weather === 'storm' ? 'opacity-50' : '' });
    }
    if (state.safehouses.some(sh => sh.district === state.loc)) {
      contextActions.push({ id: 'safe', icon: <Home size={14} />, label: t.map.safe, variant: 'emerald', onClick: () => setShowSafehouse(true) });
    }
  }

  const handleOpenDigest = () => {
    refetchLast();
    setShowDigest(true);
  };

  return (
    <div className="relative">
      <HidingOverlay />

      {showNightReport && state.nightReport && (
        <NightReport onClose={() => setShowNightReport(false)} />
      )}

      {showDigest && (
        <DailyDigestPopup forceOpen onClose={() => setShowDigest(false)} />
      )}

      <NewsTicker items={newsItems} onClickItem={setSelectedNews} />

      {/* Quick-open buttons below news ticker */}
      <div className="flex items-center gap-1.5 mb-3">
        {state.nightReport && (
          <button
            onClick={() => setShowNightReport(true)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-card/80 border border-blood/30 text-blood hover:bg-blood/10 transition-colors"
            title={t.map.openNightReport}
          >
            <FileText size={12} />
            <span className="text-[0.5rem] font-bold uppercase tracking-wider">{t.map.report}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blood animate-pulse" />
          </button>
        )}
        <button
          onClick={handleOpenDigest}
          className="flex items-center gap-1 px-2 py-1 rounded bg-card/80 border border-gold/30 text-gold hover:bg-gold/10 transition-colors"
            title={t.map.openDigest}
          >
            <Moon size={12} />
            <span className="text-[0.5rem] font-bold uppercase tracking-wider">{t.map.digest}</span>
          {digest && !digest.seen && (
            <span className="w-1.5 h-1.5 rounded-full bg-blood animate-pulse" />
          )}
        </button>
      </div>

      <BreakingNewsFlash item={breakingItem} onDone={clearBreaking} onRead={setSelectedNews} />
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
          safehouses={state.safehouses}
          onSafehouseClick={!isHiding ? () => setShowSafehouse(true) : undefined}
          districtData={districtData}
         />
      </div>

      {state.nemesis && <NemesisInfo />}
      
      <MapMMOPanels currentDistrict={state.loc} />

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
