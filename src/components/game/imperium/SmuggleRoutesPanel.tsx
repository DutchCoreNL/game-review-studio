import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, GOODS } from '@/game/constants';
import { DistrictId, GoodId, SmuggleRoute } from '@/game/types';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { Route, Trash2, Plus, AlertTriangle, Car } from 'lucide-react';
import { useState } from 'react';

export function SmuggleRoutesPanel() {
  const { state, dispatch, showToast } = useGame();
  const [creating, setCreating] = useState(false);
  const [newFrom, setNewFrom] = useState<DistrictId | ''>('');
  const [newTo, setNewTo] = useState<DistrictId | ''>('');
  const [newGood, setNewGood] = useState<GoodId | ''>('');

  const canCreate = state.ownedDistricts.length >= 2 && state.smuggleRoutes.length < 3;

  const handleCreate = () => {
    if (!newFrom || !newTo || !newGood || newFrom === newTo) {
      showToast('Vul alle velden correct in', true);
      return;
    }
    if (state.money < 5000) {
      showToast('Niet genoeg geld (€5.000)', true);
      return;
    }

    const route: SmuggleRoute = {
      id: `route-${Date.now()}`,
      from: newFrom,
      to: newTo,
      good: newGood,
      active: true,
      daysActive: 0,
    };

    dispatch({ type: 'CREATE_ROUTE', route });
    showToast('Smokkelroute actief!');
    setCreating(false);
    setNewFrom('');
    setNewTo('');
    setNewGood('');
  };

  const estimateIncome = (from: DistrictId, to: DistrictId, good: GoodId) => {
    const buyPrice = state.prices[from]?.[good] || GOODS.find(g => g.id === good)!.base;
    const sellPrice = state.prices[to]?.[good] || GOODS.find(g => g.id === good)!.base;
    return Math.max(100, Math.floor((sellPrice - buyPrice) * 0.6));
  };

  return (
    <div>
      <SectionHeader title="Smokkelroutes" icon={<Route size={12} />} badge={`${state.smuggleRoutes.length}/3`} />
      <p className="text-[0.55rem] text-muted-foreground mb-3">
        Passief inkomen via automatische handelsroutes. Risico op onderschepping!
      </p>

      {/* Active Routes */}
      <div className="space-y-2 mb-3">
        {state.smuggleRoutes.map(route => {
          const goodDef = GOODS.find(g => g.id === route.good);
          return (
            <motion.div
              key={route.id}
              className="game-card border-l-[3px] border-l-gold"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Route size={12} className="text-gold" />
                    <span className="font-bold text-xs">
                      {DISTRICTS[route.from].name} → {DISTRICTS[route.to].name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[0.5rem]">
                    <GameBadge variant="muted" size="xs">{goodDef?.name}</GameBadge>
                    <span className="text-gold font-semibold">
                      ~€{estimateIncome(route.from, route.to, route.good)}/dag
                    </span>
                    <span className="text-muted-foreground">{route.daysActive}d actief</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    dispatch({ type: 'DELETE_ROUTE', routeId: route.id });
                    showToast('Route verwijderd');
                  }}
                  className="text-muted-foreground hover:text-blood transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}

        {state.smuggleRoutes.length === 0 && !creating && (
          <div className="game-card text-center py-4">
            <Route size={20} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground italic">Geen actieve routes.</p>
          </div>
        )}
      </div>

      {/* Vehicle heat warning — smokkelroutes worden onderschept op basis van voertuig heat */}
      {(() => {
        const activeVehicle = state.ownedVehicles.find(v => v.id === state.activeVehicle);
        const vHeat = activeVehicle?.vehicleHeat ?? 0;
        const personalHeat = state.personalHeat ?? 0;
        const maxHeat = Math.max(vHeat, personalHeat);

        if (state.smuggleRoutes.length === 0) return null;

        return (
          <>
            {vHeat > 30 && (
              <div className="flex items-center gap-1.5 text-[0.55rem] text-ice bg-ice/8 rounded px-2.5 py-1.5 mb-2 border border-ice/15">
                <Car size={12} />
                <span>
                  <span className="font-bold">Voertuig Heat {vHeat}%</span> — {vHeat > 60 ? 'Zeer hoog onderscheppingsrisico!' : 'Verhoogd onderscheppingsrisico.'}
                  {' '}Overweeg omkatten.
                </span>
              </div>
            )}
            {personalHeat > 50 && (
              <div className="flex items-center gap-1.5 text-[0.55rem] text-blood bg-blood/8 rounded px-2.5 py-1.5 mb-2 border border-blood/15">
                <AlertTriangle size={12} />
                <span>
                  <span className="font-bold">Persoonlijke Heat {personalHeat}%</span> — Politie-invallen kunnen routes verstoren!
                </span>
              </div>
            )}
          </>
        );
      })()}

      {/* Create new route */}
      <AnimatePresence>
        {creating ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="game-card border-t-[2px] border-t-gold"
          >
            <h4 className="font-bold text-xs mb-3 text-gold">Nieuwe Route</h4>
            <div className="space-y-2 mb-3">
              <div>
                <label className="text-[0.5rem] text-muted-foreground uppercase tracking-wider font-bold">Van:</label>
                <select
                  value={newFrom}
                  onChange={e => setNewFrom(e.target.value as DistrictId)}
                  className="w-full py-1.5 px-2 bg-muted border border-border rounded text-xs text-foreground mt-0.5"
                >
                  <option value="">Kies district...</option>
                  {state.ownedDistricts.map(id => (
                    <option key={id} value={id}>{DISTRICTS[id].name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[0.5rem] text-muted-foreground uppercase tracking-wider font-bold">Naar:</label>
                <select
                  value={newTo}
                  onChange={e => setNewTo(e.target.value as DistrictId)}
                  className="w-full py-1.5 px-2 bg-muted border border-border rounded text-xs text-foreground mt-0.5"
                >
                  <option value="">Kies district...</option>
                  {(Object.keys(DISTRICTS) as DistrictId[]).filter(id => id !== newFrom).map(id => (
                    <option key={id} value={id}>{DISTRICTS[id].name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[0.5rem] text-muted-foreground uppercase tracking-wider font-bold">Goed:</label>
                <select
                  value={newGood}
                  onChange={e => setNewGood(e.target.value as GoodId)}
                  className="w-full py-1.5 px-2 bg-muted border border-border rounded text-xs text-foreground mt-0.5"
                >
                  <option value="">Kies goed...</option>
                  {GOODS.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              {newFrom && newTo && newGood && newFrom !== newTo && (
                <div className="text-[0.55rem] text-gold font-semibold bg-gold/8 rounded px-2 py-1.5">
                  Geschat inkomen: ~€{estimateIncome(newFrom as DistrictId, newTo as DistrictId, newGood as GoodId)}/dag
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCreating(false)} className="flex-1 py-2 rounded text-xs font-bold bg-muted border border-border text-muted-foreground">
                ANNULEER
              </button>
              <GameButton variant="gold" size="sm" fullWidth onClick={handleCreate}>
                START (€5.000)
              </GameButton>
            </div>
          </motion.div>
        ) : (
          canCreate && (
            <GameButton
              variant="gold"
              fullWidth
              icon={<Plus size={14} />}
              disabled={state.money < 5000 || state.ownedDistricts.length < 2}
              onClick={() => setCreating(true)}
            >
              {state.ownedDistricts.length < 2
                ? 'BEZIT 2+ DISTRICTEN'
                : 'NIEUWE ROUTE (€5.000)'}
            </GameButton>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
