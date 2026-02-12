import { useGame } from '@/contexts/GameContext';
import { VEHICLES } from '@/game/constants';
import { SectionHeader } from '../ui/SectionHeader';
import { StatBar } from '../ui/StatBar';
import { useState } from 'react';
import { GitCompareArrows, Car } from 'lucide-react';
import { VEHICLE_IMAGES } from '@/assets/items';

export function VehicleComparePanel() {
  const { state } = useGame();
  const owned = state.ownedVehicles;
  const [leftId, setLeftId] = useState(owned[0]?.id || '');
  const [rightId, setRightId] = useState(owned.length > 1 ? owned[1].id : owned[0]?.id || '');

  if (owned.length < 2) return null;

  const leftDef = VEHICLES.find(v => v.id === leftId);
  const rightDef = VEHICLES.find(v => v.id === rightId);
  if (!leftDef || !rightDef) return null;

  const leftObj = owned.find(v => v.id === leftId);
  const rightObj = owned.find(v => v.id === rightId);

  const stats = [
    { label: 'Opslag', key: 'storage' as const, max: 30 },
    { label: 'Snelheid', key: 'speed' as const, max: 8 },
    { label: 'Pantser', key: 'armor' as const, max: 6 },
    { label: 'Charm', key: 'charm' as const, max: 20 },
  ];

  return (
    <>
      <SectionHeader title="Vergelijk Voertuigen" icon={<GitCompareArrows size={12} />} />
      <div className="game-card mb-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <select value={leftId} onChange={e => setLeftId(e.target.value)}
            className="bg-muted border border-border rounded px-2 py-1.5 text-[0.6rem] text-foreground">
            {owned.map(v => {
              const def = VEHICLES.find(vd => vd.id === v.id);
              return <option key={v.id} value={v.id}>{def?.name}</option>;
            })}
          </select>
          <select value={rightId} onChange={e => setRightId(e.target.value)}
            className="bg-muted border border-border rounded px-2 py-1.5 text-[0.6rem] text-foreground">
            {owned.map(v => {
              const def = VEHICLES.find(vd => vd.id === v.id);
              return <option key={v.id} value={v.id}>{def?.name}</option>;
            })}
          </select>
        </div>

        {/* Vehicle images */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[{ def: leftDef, obj: leftObj }, { def: rightDef, obj: rightObj }].map(({ def, obj }, i) => (
            <div key={i} className="relative h-16 rounded overflow-hidden bg-muted">
              {VEHICLE_IMAGES[def.id] ? (
                <img src={VEHICLE_IMAGES[def.id]} alt={def.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Car size={20} className="text-muted-foreground" /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              <span className="absolute bottom-1 left-1.5 text-[0.5rem] font-bold text-foreground">{def.name}</span>
            </div>
          ))}
        </div>

        {/* Stat comparison */}
        {stats.map(s => {
          const lVal = leftDef[s.key];
          const rVal = rightDef[s.key];
          const better = lVal > rVal ? 'left' : rVal > lVal ? 'right' : 'equal';
          return (
            <div key={s.key} className="mb-2">
              <div className="flex items-center justify-between text-[0.5rem] mb-0.5">
                <span className={`font-bold ${better === 'left' ? 'text-emerald' : ''}`}>{lVal}</span>
                <span className="text-muted-foreground uppercase tracking-wider">{s.label}</span>
                <span className={`font-bold ${better === 'right' ? 'text-emerald' : ''}`}>{rVal}</span>
              </div>
              <div className="flex gap-1 h-1.5">
                <div className="flex-1 bg-muted rounded-full overflow-hidden flex justify-end">
                  <div className={`h-full rounded-full ${better === 'left' ? 'bg-emerald' : 'bg-muted-foreground/30'}`}
                    style={{ width: `${(lVal / s.max) * 100}%` }} />
                </div>
                <div className="flex-1 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${better === 'right' ? 'bg-emerald' : 'bg-muted-foreground/30'}`}
                    style={{ width: `${(rVal / s.max) * 100}%` }} />
                </div>
              </div>
            </div>
          );
        })}

        {/* Condition & heat */}
        <div className="grid grid-cols-2 gap-3 mt-3 text-[0.5rem]">
          {[leftObj, rightObj].map((obj, i) => (
            <div key={i} className="bg-muted/30 rounded p-1.5 text-center">
              <div className="text-muted-foreground">Conditie: <span className="font-bold text-foreground">{obj?.condition || 0}%</span></div>
              <div className="text-muted-foreground">Heat: <span className={`font-bold ${(obj?.vehicleHeat || 0) > 50 ? 'text-blood' : 'text-foreground'}`}>{obj?.vehicleHeat || 0}%</span></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
