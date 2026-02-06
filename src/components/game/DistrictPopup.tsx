import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, DISTRICT_FLAVOR } from '@/game/constants';
import { DistrictId } from '@/game/types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Crown, Navigation, TrendingUp } from 'lucide-react';

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
  let btnStyle = 'bg-muted text-muted-foreground';

  if (isHere && isOwned) {
    btnText = 'JOUW TERRITORIUM';
    btnDisabled = true;
    btnStyle = 'bg-muted text-muted-foreground';
  } else if (isHere && !isOwned) {
    btnText = `OVERNEMEN — €${sel.cost.toLocaleString()}`;
    btnDisabled = state.money < sel.cost;
    btnStyle = 'bg-gold text-secondary-foreground glow-gold';
  } else {
    btnText = travelCost > 0 ? `REIS HIERHEEN — €${travelCost}` : 'REIS HIERHEEN (GRATIS)';
    btnDisabled = state.money < travelCost;
    btnStyle = 'bg-blood text-primary-foreground glow-blood';
  }

  const flavorKey = state.heat > 80 ? 'high_heat' : isOwned ? 'owned' : 'neutral';
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

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-3">
            {isOwned ? (
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--blood)/0.15)] flex items-center justify-center">
                <Crown size={16} className="text-blood" />
              </div>
            ) : isHere ? (
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--gold)/0.15)] flex items-center justify-center">
                <MapPin size={16} className="text-gold" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Navigation size={16} className="text-muted-foreground" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-sm">{sel.name}</h3>
              <div className="flex items-center gap-2 text-[0.6rem] text-muted-foreground">
                {isHere && <span className="text-gold font-semibold">📍 Je bent hier</span>}
                {isOwned && <span className="text-blood font-semibold">♛ Jouw territorium</span>}
                {!isHere && !isOwned && <span>Onbekend terrein</span>}
              </div>
            </div>
          </div>

          {/* Flavor text */}
          {flavor && (
            <p className="text-[0.65rem] text-muted-foreground italic mb-3 pl-1 border-l-2 border-border ml-1">
              "{flavor}"
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-muted/50 rounded px-2.5 py-1.5 text-xs">
              <span className="text-muted-foreground">Inkomen:</span>{' '}
              <span className="font-bold text-gold">€{sel.income}/dag</span>
            </div>
            <div className="bg-muted/50 rounded px-2.5 py-1.5 text-xs">
              <span className="text-muted-foreground">Prijs:</span>{' '}
              <span className="font-bold">€{sel.cost.toLocaleString()}</span>
            </div>
          </div>

          {/* Perk */}
          <div className={`text-[0.6rem] px-2.5 py-1.5 rounded mb-3 font-semibold ${
            isOwned ? 'bg-[hsl(var(--blood)/0.1)] text-blood' : 'bg-muted text-muted-foreground'
          }`}>
            ♛ {sel.perk}
          </div>

          {/* Demand */}
          {demand && (
            <div className="flex items-center gap-1.5 mb-3 text-[0.65rem] text-gold font-semibold bg-[hsl(var(--gold)/0.08)] rounded px-2.5 py-1.5">
              <TrendingUp size={12} />
              Hoge vraag: {demand} (+60% prijs)
            </div>
          )}

          {/* Action Button */}
          <motion.button
            onClick={handleAction}
            disabled={btnDisabled}
            className={`w-full py-3 rounded font-bold text-sm uppercase tracking-wider transition-all ${
              btnDisabled ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60' : btnStyle
            }`}
            whileTap={!btnDisabled ? { scale: 0.97 } : undefined}
          >
            {btnText}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
