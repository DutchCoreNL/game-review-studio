import { useGame } from '@/contexts/GameContext';
import { VEHICLES, BUSINESSES, HQ_UPGRADES, REKAT_COSTS } from '@/game/constants';
import { motion } from 'framer-motion';
import { Car, Gauge, Shield, Gem, Wrench, Factory, Store, Flame } from 'lucide-react';

export function AssetsView() {
  const { state, dispatch, showToast } = useGame();

  const activeV = VEHICLES.find(v => v.id === state.activeVehicle);
  const activeObj = state.ownedVehicles.find(v => v.id === state.activeVehicle);
  const ownedIds = state.ownedVehicles.map(v => v.id);

  return (
    <div>
      {/* Active Vehicle */}
      <SectionHeader title="Car Dashboard" />
      {activeV && activeObj && (
        <motion.div
          className="game-card border-l-[3px] border-l-gold mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
              <Car size={20} className="text-gold" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{activeV.name}</h3>
              <p className="text-[0.6rem] text-muted-foreground">{activeV.desc}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            <StatBadge icon={<Car size={10} />} label="Store" value={activeV.storage} />
            <StatBadge icon={<Gauge size={10} />} label="Speed" value={activeV.speed} />
            <StatBadge icon={<Shield size={10} />} label="Armor" value={activeV.armor} />
            <StatBadge icon={<Gem size={10} />} label="Charm" value={activeV.charm} />
          </div>

          {/* Condition */}
          <div className="flex items-center gap-2 text-xs mb-2">
            <span className="text-muted-foreground">Conditie:</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${activeObj.condition > 50 ? 'bg-emerald' : 'bg-blood'}`}
                style={{ width: `${activeObj.condition}%` }}
              />
            </div>
            <span className="font-bold">{activeObj.condition}%</span>
          </div>

          {/* Vehicle Heat bar */}
          <div className="flex items-center gap-2 text-xs mb-2">
            <span className="text-muted-foreground flex items-center gap-1">
              <Flame size={10} className="text-blood" /> Heat:
            </span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${(activeObj.vehicleHeat || 0) > 70 ? 'bg-blood' : (activeObj.vehicleHeat || 0) > 50 ? 'bg-gold' : 'bg-emerald'}`}
                style={{ width: `${activeObj.vehicleHeat || 0}%` }}
              />
            </div>
            <span className={`font-bold ${(activeObj.vehicleHeat || 0) > 50 ? 'text-blood' : ''}`}>{activeObj.vehicleHeat || 0}%</span>
          </div>

          <div className="flex gap-2">
            {activeObj.condition < 100 && (
              <button
                onClick={() => {
                  dispatch({ type: 'REPAIR_VEHICLE' });
                  showToast('Auto gerepareerd!');
                }}
                className="flex-1 py-2 rounded text-xs font-bold bg-[hsl(var(--blood)/0.1)] border border-blood text-blood flex items-center justify-center gap-1.5"
              >
                <Wrench size={12} /> REPAREER (€{(100 - activeObj.condition) * 25})
              </button>
            )}
            {(activeObj.vehicleHeat || 0) > 0 && (
              <button
                onClick={() => {
                  dispatch({ type: 'REKAT_VEHICLE', vehicleId: state.activeVehicle });
                  showToast(`${activeV.name} omgekat! Heat → 0`);
                }}
                disabled={(activeObj.rekatCooldown || 0) > 0 || state.money < (REKAT_COSTS[state.activeVehicle] || 5000)}
                className="flex-1 py-2 rounded text-xs font-bold bg-[hsl(var(--gold)/0.1)] border border-gold text-gold disabled:opacity-30 flex items-center justify-center gap-1.5"
              >
                <Car size={12} /> OMKATTEN (€{(REKAT_COSTS[state.activeVehicle] || 5000).toLocaleString()})
                {(activeObj.rekatCooldown || 0) > 0 && (
                  <span className="text-muted-foreground text-[0.5rem] ml-0.5">({activeObj.rekatCooldown}d)</span>
                )}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Owned Vehicles */}
      {state.ownedVehicles.length > 1 && (
        <div className="space-y-2 mb-4">
          {state.ownedVehicles.filter(v => v.id !== state.activeVehicle).map(ov => {
            const vDef = VEHICLES.find(v => v.id === ov.id)!;
            return (
              <div key={ov.id} className="game-card flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-xs">{vDef.name}</h4>
                  <p className="text-[0.55rem] text-muted-foreground">
                    Conditie: {ov.condition}% | Heat: <span className={(ov.vehicleHeat || 0) > 50 ? 'text-blood font-bold' : ''}>{ov.vehicleHeat || 0}%</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    dispatch({ type: 'SET_VEHICLE', id: ov.id });
                    showToast(`${vDef.name} geselecteerd`);
                  }}
                  className="px-3 py-1.5 rounded text-[0.6rem] font-bold bg-[hsl(var(--gold)/0.1)] border border-gold text-gold"
                >
                  GEBRUIK
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Buy Vehicles */}
      <SectionHeader title="Chop Shop" />
      <div className="space-y-2 mb-4">
        {VEHICLES.filter(v => !ownedIds.includes(v.id)).map(v => (
          <div key={v.id} className="game-card">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-xs">{v.name}</h4>
                <p className="text-[0.55rem] text-muted-foreground">
                  Store: {v.storage} | Spd: {v.speed} | Arm: {v.armor} | Charm: {v.charm}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                dispatch({ type: 'BUY_VEHICLE', id: v.id });
                showToast(`${v.name} gekocht!`);
              }}
              disabled={state.money < v.cost}
              className="w-full mt-2 py-2 rounded text-xs font-bold bg-[hsl(var(--gold)/0.1)] border border-gold text-gold disabled:opacity-30"
            >
              KOOP €{v.cost.toLocaleString()}
            </button>
          </div>
        ))}
      </div>

      {/* Lab */}
      {state.hqUpgrades.includes('lab') && (
        <>
          <SectionHeader title="Synthetica Lab" />
          <div className="game-card border-l-[3px] border-l-[hsl(var(--purple))] mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Factory size={16} className="text-game-purple" />
                <div>
                  <h4 className="font-bold text-xs">Lab Actief</h4>
                  <p className="text-[0.55rem] text-muted-foreground">Chemicaliën: {state.lab.chemicals}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  dispatch({ type: 'BUY_CHEMICALS', amount: 10 });
                  showToast('Chemicaliën gekocht');
                }}
                className="px-3 py-1.5 rounded text-[0.6rem] font-bold bg-[hsl(var(--purple)/0.1)] border border-[hsl(var(--purple))] text-game-purple"
              >
                KOOP 10 (€500)
              </button>
            </div>
            <p className="text-[0.55rem] text-muted-foreground">
              Productie: max 20 Synthetica per nacht (bij dag afsluiten)
            </p>
          </div>
        </>
      )}

      {/* Businesses */}
      <SectionHeader title="Dekmantels" />
      <div className="space-y-2">
        {BUSINESSES.map(b => {
          const owned = state.ownedBusinesses.includes(b.id);
          return (
            <div key={b.id} className="game-card flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Store size={14} className={owned ? 'text-emerald' : 'text-muted-foreground'} />
                <div>
                  <h4 className="font-bold text-xs">{b.name}</h4>
                  <p className="text-[0.55rem] text-muted-foreground">{b.desc}</p>
                  <p className="text-[0.5rem] text-gold">+€{b.income}/dag | Wast €{b.clean}/dag</p>
                </div>
              </div>
              <button
                onClick={() => {
                  dispatch({ type: 'BUY_BUSINESS', id: b.id });
                  showToast(`${b.name} gekocht!`);
                }}
                disabled={owned || state.money < b.cost}
                className={`px-3 py-1.5 rounded text-[0.6rem] font-bold ${
                  owned ? 'bg-muted text-muted-foreground' : 'bg-[hsl(var(--gold)/0.1)] border border-gold text-gold disabled:opacity-30'
                }`}
              >
                {owned ? 'BEZIT' : `€${b.cost.toLocaleString()}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-muted/50 rounded p-1.5 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">{icon}</div>
      <div className="text-[0.45rem] text-muted-foreground uppercase">{label}</div>
      <div className="text-xs font-bold">{value}</div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3 pb-1 border-b border-border">
      <span className="text-gold text-[0.65rem] uppercase tracking-widest font-bold">{title}</span>
    </div>
  );
}
