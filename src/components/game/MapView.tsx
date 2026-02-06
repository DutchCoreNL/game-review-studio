import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, DISTRICT_FLAVOR, NEWS_ITEMS } from '@/game/constants';
import { DistrictId } from '@/game/types';
import { motion } from 'framer-motion';
import { MapPin, Crown, Navigation } from 'lucide-react';

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

      {/* Map */}
      <div className="relative w-full aspect-[10/7] bg-background border border-border rounded-lg mb-4 overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]">
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none z-[1]" style={{
          backgroundSize: '30px 30px',
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)'
        }} />
        {/* Scanline */}
        <div className="absolute w-full h-[3px] bg-[hsl(var(--gold)/0.15)] pointer-events-none z-[2] scanline shadow-[0_0_10px_hsl(var(--gold)/0.3)]" />

        {/* Districts as interactive elements */}
        <div className="absolute inset-0 z-[5] p-3">
          {(Object.entries(DISTRICTS) as [DistrictId, typeof DISTRICTS[string]][]).map(([id, district]) => {
            const isSelected = selectedDistrict === id;
            const isPlayerHere = state.loc === id;
            const owned = state.ownedDistricts.includes(id);
            const demand = state.districtDemands[id];

            return (
              <motion.button
                key={id}
                onClick={() => selectDistrict(id)}
                className={`absolute w-[80px] h-[55px] rounded-lg border transition-all duration-300 flex flex-col items-center justify-center gap-0.5 text-center ${
                  isSelected
                    ? 'border-gold bg-[hsl(var(--gold)/0.1)] glow-gold z-10'
                    : owned
                    ? 'border-blood border-dashed bg-[hsl(var(--blood)/0.05)] hover:bg-[hsl(var(--blood)/0.1)]'
                    : 'border-border bg-muted/30 hover:border-muted-foreground hover:bg-muted/50'
                }`}
                style={{
                  left: `${(district.cx / 400) * 100}%`,
                  top: `${(district.cy / 300) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                whileTap={{ scale: 0.95 }}
              >
                {isPlayerHere && (
                  <motion.div
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-gold rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
                {owned && <Crown size={10} className="text-blood" />}
                <span className={`text-[0.5rem] font-bold uppercase tracking-wider ${isSelected ? 'text-gold' : 'text-muted-foreground'}`}>
                  {district.name.split(' ')[0]}
                </span>
                {demand && <span className="text-[0.45rem] text-gold">$</span>}
              </motion.button>
            );
          })}
        </div>
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
