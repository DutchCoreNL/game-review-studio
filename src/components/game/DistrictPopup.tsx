import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, DISTRICT_FLAVOR, DISTRICT_REP_PERKS } from '@/game/constants';
import { GameButton } from './ui/GameButton';
import { StatBar } from './ui/StatBar';
import { InfoRow } from './ui/InfoRow';
import { GameBadge } from './ui/GameBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Crown, Navigation, TrendingUp, Shield, Users, Star } from 'lucide-react';
import { GaragePanel } from './garage/GaragePanel';

export function DistrictPopup() {
  const { state, selectedDistrict, selectDistrict, dispatch, showToast } = useGame();

  if (!selectedDistrict) return null;

  const sel = DISTRICTS[selectedDistrict];
  const isHere = state.loc === selectedDistrict;
  const isOwned = state.ownedDistricts.includes(selectedDistrict);

  const hasChauffeur = state.crew.some(c => c.role === 'Chauffeur');
  const travelCost = (hasChauffeur || isOwned) ? 0 : 50;

  const handleAction = () => {
    if (isHere && !isOwned) {
      dispatch({ type: 'BUY_DISTRICT', id: selectedDistrict });
      showToast(`${sel.name} overgenomen!`);
    } else if (!isHere) {
      dispatch({ type: 'TRAVEL', to: selectedDistrict });
      showToast(`Aangekomen in ${sel.name}`);
    }
    selectDistrict(null as any);
  };

  let btnText = '';
  let btnDisabled = true;
  let btnVariant: 'blood' | 'gold' | 'muted' = 'muted';

  if (isHere && isOwned) {
    btnText = 'JOUW TERRITORIUM';
    btnDisabled = true;
  } else if (isHere && !isOwned) {
    btnText = `OVERNEMEN — €${sel.cost.toLocaleString()}`;
    btnDisabled = state.money < sel.cost;
    btnVariant = 'gold';
  } else {
    btnText = travelCost > 0 ? `REIS HIERHEEN — €${travelCost}` : 'REIS HIERHEEN (GRATIS)';
    btnDisabled = state.money < travelCost;
    btnVariant = 'blood';
  }

  const activeVehicleHeat = state.ownedVehicles.find(v => v.id === state.activeVehicle)?.vehicleHeat ?? 0;
  const personalHeat = state.personalHeat ?? 0;
  const effectiveHeat = Math.max(activeVehicleHeat, personalHeat);
  const flavorKey = effectiveHeat > 80 ? 'high_heat' : isOwned ? 'owned' : 'neutral';
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
        onClick={() => selectDistrict(null as any)}
      />
      <motion.div
        key="district-popup"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed left-4 right-4 top-[120px] z-[9001] max-w-[560px] mx-auto"
      >
        <div className="game-card border-t-[3px] border-t-blood p-4 shadow-xl">
          <button
            onClick={() => selectDistrict(null as any)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2.5 mb-3">
            {isOwned ? (
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
                {isOwned && <span className="text-blood font-semibold">♛ Jouw territorium</span>}
                {!isHere && !isOwned && <span>Onbekend terrein</span>}
              </div>
            </div>
          </div>

          {flavor && (
            <p className="text-[0.6rem] text-muted-foreground italic mb-3 pl-1 border-l-2 border-border ml-1">"{flavor}"</p>
          )}

          <div className="space-y-1.5 mb-3">
            <InfoRow label="Inkomen" value={`€${sel.income}/dag`} valueClass="text-gold" />
            <InfoRow label="Prijs" value={`€${sel.cost.toLocaleString()}`} />
          </div>

          <div className={`text-[0.55rem] px-2.5 py-1.5 rounded mb-3 font-semibold ${
            isOwned ? 'bg-blood/10 text-blood' : 'bg-muted text-muted-foreground'
          }`}>
            ♛ {sel.perk}
          </div>

          {demand && (
            <div className="flex items-center gap-1.5 mb-3 text-[0.6rem] text-gold font-semibold bg-gold/8 rounded px-2.5 py-1.5">
              <TrendingUp size={12} /> Hoge vraag: {demand} (+60% prijs)
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

          {/* Defense Info (owned only) */}
          {isOwned && (() => {
            const def = state.districtDefenses?.[selectedDistrict];
            if (!def) return null;
            const defLevel = def.level + def.stationedCrew.length * 20 + (def.wallUpgrade ? 30 : 0) + (def.turretUpgrade ? 20 : 0);
            return (
              <div className="mb-3 game-card bg-muted/30 p-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Shield size={10} className="text-ice" />
                  <span className="text-[0.55rem] font-bold text-muted-foreground uppercase tracking-wider">Verdediging</span>
                  <span className="text-[0.55rem] font-bold text-ice">{defLevel}</span>
                </div>
                <StatBar value={Math.min(defLevel, 100)} max={100} color="ice" height="sm" />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {def.wallUpgrade && <GameBadge variant="muted" size="xs">🧱 Muur</GameBadge>}
                  {def.turretUpgrade && <GameBadge variant="muted" size="xs">🔫 Geschut</GameBadge>}
                  {def.stationedCrew.length > 0 && (
                    <GameBadge variant="muted" size="xs">
                      <Users size={8} className="inline mr-0.5" />{def.stationedCrew.length} Crew
                    </GameBadge>
                  )}
                </div>
                <div className="flex gap-1.5 mt-2">
                  {!def.wallUpgrade && (
                    <GameButton variant="muted" size="sm" disabled={state.money < 8000}
                      onClick={() => { dispatch({ type: 'UPGRADE_DEFENSE', districtId: selectedDistrict, upgradeType: 'wall' }); showToast('Muur geplaatst!'); }}>
                      🧱 €8k
                    </GameButton>
                  )}
                  {!def.turretUpgrade && (
                    <GameButton variant="muted" size="sm" disabled={state.money < 12000}
                      onClick={() => { dispatch({ type: 'UPGRADE_DEFENSE', districtId: selectedDistrict, upgradeType: 'turret' }); showToast('Geschut geplaatst!'); }}>
                      🔫 €12k
                    </GameButton>
                  )}
                </div>
                {state.crew.length > 0 && (
                  <div className="mt-2 border-t border-border pt-2">
                    <p className="text-[0.45rem] text-muted-foreground font-bold mb-1 uppercase tracking-wider">Stationeer Crew:</p>
                    <div className="flex flex-wrap gap-1">
                      {state.crew.map((c, i) => {
                        const isStationed = def.stationedCrew.includes(i);
                        return (
                          <button key={i}
                            onClick={() => {
                              if (isStationed) {
                                dispatch({ type: 'UNSTATION_CREW', districtId: selectedDistrict, crewIndex: i });
                                showToast(`${c.name} teruggetrokken`);
                              } else {
                                dispatch({ type: 'STATION_CREW', districtId: selectedDistrict, crewIndex: i });
                                showToast(`${c.name} gestationeerd`);
                              }
                            }}
                            className={`text-[0.45rem] font-bold px-2 py-1 rounded border transition-all ${
                              isStationed
                                ? 'bg-ice/15 border-ice text-ice'
                                : 'bg-muted border-border text-muted-foreground hover:border-ice/50'
                            }`}
                          >
                            {c.name} {isStationed ? '✓' : '+'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Garage (when at this district) */}
          {isHere && <GaragePanel />}

          <GameButton
            variant={btnVariant}
            size="lg"
            fullWidth
            disabled={btnDisabled}
            glow={!btnDisabled}
            onClick={handleAction}
          >
            {btnText}
          </GameButton>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
