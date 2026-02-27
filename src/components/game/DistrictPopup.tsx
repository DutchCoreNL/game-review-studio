import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, DISTRICT_FLAVOR, DISTRICT_REP_PERKS, DISTRICT_HQ_UPGRADES } from '@/game/constants';
import { playCoinSound } from '@/game/sounds';
import { GameButton } from './ui/GameButton';
import { StatBar } from './ui/StatBar';
import { InfoRow } from './ui/InfoRow';
import { GameBadge } from './ui/GameBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Crown, Navigation, TrendingUp, Shield, Users, Star, Swords } from 'lucide-react';
import { DISTRICT_IMAGES } from '@/assets/items';
import { gameApi } from '@/lib/gameApi';

interface DistrictTerritory {
  districtId: string;
  gangId: string;
  gangName: string;
  gangTag: string;
  totalInfluence: number;
}

export function DistrictPopup() {
  const { state, selectedDistrict, selectDistrict, dispatch, showToast } = useGame();
  const [districtInfo, setDistrictInfo] = useState<{
    territories: DistrictTerritory[];
    myInfluence: Record<string, number>;
    gangInfluence: Record<string, number>;
    gangId: string | null;
  } | null>(null);
  const [donateAmount, setDonateAmount] = useState(5000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDistrict) {
      gameApi.getDistrictInfo().then(res => {
        if (res.success && res.data) setDistrictInfo(res.data as any);
      });
    }
  }, [selectedDistrict]);

  if (!selectedDistrict) return null;

  const sel = DISTRICTS[selectedDistrict];
  const isHere = state.loc === selectedDistrict;

  const hasChauffeur = state.crew.some(c => c.role === 'Chauffeur');
  const territory = districtInfo?.territories.find(t => t.districtId === selectedDistrict);
  const isGangOwned = territory && territory.gangId === districtInfo?.gangId;
  const isEnemyOwned = territory && territory.gangId !== districtInfo?.gangId;
  const myInfluence = districtInfo?.myInfluence?.[selectedDistrict] || 0;
  const gangInfluence = districtInfo?.gangInfluence?.[selectedDistrict] || 0;
  const inGang = !!districtInfo?.gangId;
  const CONTROL_THRESHOLD = 100;

  const travelCost = (hasChauffeur || isGangOwned) ? 0 : 50;

  const handleTravel = () => {
    if (!isHere) {
      dispatch({ type: 'TRAVEL', to: selectedDistrict });
      showToast(`Aangekomen in ${sel.name}`);
    }
    selectDistrict(null);
  };

  const handleContribute = async () => {
    if (!inGang || !isHere || loading) return;
    setLoading(true);
    const res = await gameApi.contributeInfluence(selectedDistrict, donateAmount);
    setLoading(false);
    if (res.success) {
      playCoinSound();
      showToast(res.message);
      // Refresh district info
      const info = await gameApi.getDistrictInfo();
      if (info.success && info.data) setDistrictInfo(info.data as any);
      // Sync money from server
      dispatch({ type: 'SPEND_MONEY', amount: Math.floor(donateAmount / 500) * 500 });
    } else {
      showToast(res.message, true);
    }
  };

  const activeVehicleHeat = state.ownedVehicles.find(v => v.id === state.activeVehicle)?.vehicleHeat ?? 0;
  const personalHeat = state.personalHeat ?? 0;
  const effectiveHeat = Math.max(activeVehicleHeat, personalHeat);
  const flavorKey = effectiveHeat > 80 ? 'high_heat' : isGangOwned ? 'owned' : 'neutral';
  const flavor = DISTRICT_FLAVOR[selectedDistrict]?.[flavorKey] || '';
  const demand = state.districtDemands[selectedDistrict];

  return (
    <AnimatePresence>
      <motion.div
        key="district-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/70 z-[9000] backdrop-blur-sm"
        onClick={() => selectDistrict(null)}
      />
      <motion.div
        key="district-popup"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed left-4 right-4 top-[100px] bottom-4 z-[9001] max-w-[560px] mx-auto flex flex-col"
      >
        <div className="game-card border-t-[3px] border-t-blood shadow-xl overflow-y-auto max-h-full game-scroll overflow-hidden">
          {/* District banner image */}
          {DISTRICT_IMAGES[selectedDistrict] && (
            <div className="relative -mx-4 -mt-4 mb-3 h-28 overflow-hidden">
              <img src={DISTRICT_IMAGES[selectedDistrict]} alt={sel.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            </div>
          )}
          <button
            onClick={() => selectDistrict(null)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2.5 mb-3">
            {isGangOwned ? (
              <div className="w-8 h-8 rounded bg-blood/15 flex items-center justify-center">
                <Crown size={16} className="text-blood" />
              </div>
            ) : isHere ? (
              <div className="w-8 h-8 rounded bg-gold/15 flex items-center justify-center">
                <MapPin size={16} className="text-gold" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                <Navigation size={16} className="text-muted-foreground" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-sm font-display tracking-wider">{sel.name}</h3>
              <div className="flex items-center gap-2 text-[0.55rem] text-muted-foreground">
                {isHere && <span className="text-gold font-semibold">📍 Je bent hier</span>}
                {territory ? (
                  <span className={isGangOwned ? "text-blood font-semibold" : "text-muted-foreground font-semibold"}>
                    {isGangOwned ? `♛ Jouw gang's territorium` : `⚔️ [${territory.gangTag}] ${territory.gangName}`}
                  </span>
                ) : (
                  <span>🏴 Ongecontroleerd</span>
                )}
              </div>
            </div>
          </div>

          {flavor && (
            <p className="text-[0.6rem] text-muted-foreground italic mb-3 pl-1 border-l-2 border-border ml-1">"{flavor}"</p>
          )}

          <div className="space-y-1.5 mb-3">
            <InfoRow label="Gang Inkomen" value={`€${sel.income}/dag`} valueClass="text-gold" />
            <InfoRow label="Controle drempel" value={`${CONTROL_THRESHOLD} invloed`} />
          </div>

          <div className={`text-[0.55rem] px-2.5 py-1.5 rounded mb-3 font-semibold ${
            isGangOwned ? 'bg-blood/10 text-blood' : 'bg-muted text-muted-foreground'
          }`}>
            ♛ {sel.perk}
          </div>

          {demand && (
            <div className="flex items-center gap-1.5 mb-3 text-[0.6rem] text-gold font-semibold bg-gold/8 rounded px-2.5 py-1.5">
              <TrendingUp size={12} /> Hoge vraag: {demand} (+60% prijs)
            </div>
          )}

          {/* Gang Influence Section */}
          {inGang && (
            <div className="mb-3 game-card bg-muted/30 p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Users size={10} className="text-gold" />
                <span className="text-[0.55rem] font-bold text-muted-foreground uppercase tracking-wider">Gang Invloed</span>
                <span className="text-[0.55rem] font-bold text-gold">{gangInfluence}/{CONTROL_THRESHOLD}</span>
              </div>
              <StatBar value={Math.min(gangInfluence, CONTROL_THRESHOLD)} max={CONTROL_THRESHOLD} color="gold" height="sm" />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[0.45rem] text-muted-foreground">Jouw bijdrage: {myInfluence}</span>
                {isEnemyOwned && territory && (
                  <span className="text-[0.45rem] text-blood font-semibold">
                    <Swords size={8} className="inline mr-0.5" />
                    Vijandelijk: {territory.totalInfluence}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* District Reputation */}
          {(() => {
            const rep = state.districtRep?.[selectedDistrict] || 0;
            const perks = DISTRICT_REP_PERKS[selectedDistrict] || [];
            return (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Star size={10} className="text-gold" />
                  <span className="text-[0.55rem] font-bold text-muted-foreground uppercase tracking-wider">District Reputatie</span>
                  <span className="text-[0.55rem] font-bold text-gold">{rep}/100</span>
                </div>
                <StatBar value={rep} max={100} color="gold" height="sm" />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {perks.map(p => (
                    <span key={p.threshold} className={`text-[0.45rem] font-semibold px-1.5 py-0.5 rounded border ${
                      rep >= p.threshold
                        ? 'bg-gold/10 text-gold border-gold/20'
                        : 'bg-muted/50 text-muted-foreground border-border opacity-50'
                    }`}>
                      {rep >= p.threshold ? '✓' : `${p.threshold}+`} {p.label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Influence Contribution (only when in gang & in district) */}
          {inGang && isHere && (
            <div className="mb-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[0.55rem] font-bold text-muted-foreground uppercase tracking-wider">💰 Investeer Invloed</span>
              </div>
              <div className="flex gap-1.5">
                {[2500, 5000, 10000, 25000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setDonateAmount(amt)}
                    className={`text-[0.5rem] px-2 py-1 rounded border font-semibold transition-colors ${
                      donateAmount === amt
                        ? 'bg-gold/15 text-gold border-gold/30'
                        : 'bg-muted/50 text-muted-foreground border-border hover:border-gold/20'
                    }`}
                  >
                    €{(amt / 1000).toFixed(amt >= 1000 ? 0 : 1)}k
                  </button>
                ))}
              </div>
              <GameButton
                variant="gold"
                size="sm"
                fullWidth
                disabled={state.money < donateAmount || loading}
                glow={state.money >= donateAmount}
                onClick={handleContribute}
              >
                {loading ? 'BEZIG...' : `INVESTEER €${donateAmount.toLocaleString()} → +${Math.floor(donateAmount / 500)} INVLOED`}
              </GameButton>
            </div>
          )}

          {/* No gang warning */}
          {!inGang && isHere && (
            <div className="mb-3 text-[0.55rem] text-muted-foreground bg-muted/30 rounded p-2.5 text-center">
              <Users size={14} className="mx-auto mb-1 text-muted-foreground/50" />
              Je moet in een gang zitten om invloed te kunnen bijdragen aan een district.
            </div>
          )}

          {/* Travel button (when not here) */}
          {!isHere && (
            <GameButton
              variant="blood"
              size="lg"
              fullWidth
              disabled={state.money < travelCost}
              glow={state.money >= travelCost}
              onClick={handleTravel}
            >
              {travelCost > 0 ? `REIS HIERHEEN — €${travelCost}` : 'REIS HIERHEEN (GRATIS)'}
            </GameButton>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
