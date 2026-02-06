import { useGame } from '@/contexts/GameContext';
import { BUSINESSES } from '@/game/constants';
import { getWashCapacity } from '@/game/engine';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { StatBar } from '../ui/StatBar';
import { motion } from 'framer-motion';
import { Banknote, Store, AlertTriangle, Droplets, ArrowDown } from 'lucide-react';
import { useState } from 'react';

export function LaunderingPanel() {
  const { state, dispatch, showToast } = useGame();
  const [washAmount, setWashAmount] = useState(1000);
  const washCap = getWashCapacity(state);

  const cleanRate = state.ownedDistricts.includes('neon') ? 0.98 : 0.85;
  const expectedClean = Math.floor(Math.min(washAmount, state.dirtyMoney, washCap.remaining) * cleanRate);
  const expectedHeat = Math.max(1, Math.floor(Math.min(washAmount, state.dirtyMoney, washCap.remaining) / 500));

  const handleWash = () => {
    if (state.dirtyMoney <= 0) return showToast('Geen zwart geld beschikbaar.', true);
    if (washCap.remaining <= 0) return showToast('Dagelijkse wascapaciteit bereikt!', true);
    const actual = Math.min(washAmount, state.dirtyMoney, washCap.remaining);
    if (actual <= 0) return;
    dispatch({ type: 'WASH_MONEY_AMOUNT', amount: actual });
    showToast(`€${actual.toLocaleString()} witgewassen → €${Math.floor(actual * cleanRate).toLocaleString()} schoon`);
  };

  const handleWashAll = () => {
    if (state.dirtyMoney <= 0) return showToast('Geen zwart geld beschikbaar.', true);
    if (washCap.remaining <= 0) return showToast('Dagelijkse wascapaciteit bereikt!', true);
    const actual = Math.min(state.dirtyMoney, washCap.remaining);
    dispatch({ type: 'WASH_MONEY_AMOUNT', amount: actual });
    showToast(`€${actual.toLocaleString()} witgewassen!`);
  };

  return (
    <div>
      <SectionHeader title="Geld Witwassen" icon={<Droplets size={12} />} />

      {/* Money Overview */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <motion.div
          className="game-card p-3 text-center border-l-[3px] border-l-emerald"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Banknote size={16} className="text-emerald mx-auto mb-1" />
          <div className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">Schoon Geld</div>
          <div className="text-sm font-bold text-emerald">€{state.money.toLocaleString()}</div>
        </motion.div>
        <motion.div
          className="game-card p-3 text-center border-l-[3px] border-l-dirty"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Banknote size={16} className="text-dirty mx-auto mb-1" />
          <div className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">Zwart Geld</div>
          <div className="text-sm font-bold text-dirty">€{state.dirtyMoney.toLocaleString()}</div>
        </motion.div>
      </div>

      {/* Daily Capacity */}
      <div className="game-card p-3 mb-4">
        <div className="flex justify-between text-[0.6rem] mb-1.5">
          <span className="text-muted-foreground font-semibold uppercase tracking-wider">Dagelijkse Capaciteit</span>
          <span className="font-bold text-foreground">
            €{washCap.used.toLocaleString()} / €{washCap.total.toLocaleString()}
          </span>
        </div>
        <StatBar value={washCap.used} max={washCap.total} color={washCap.remaining <= 0 ? 'blood' : 'gold'} height="md" />
        <div className="text-[0.5rem] text-muted-foreground mt-1">
          Resterend: <span className="font-bold text-foreground">€{washCap.remaining.toLocaleString()}</span>
        </div>
      </div>

      {/* Manual Wash */}
      {state.dirtyMoney > 0 && washCap.remaining > 0 ? (
        <div className="game-card p-3 mb-4 border-l-[3px] border-l-gold">
          <h4 className="font-bold text-xs mb-2 flex items-center gap-1.5">
            <Droplets size={12} className="text-gold" /> Handmatig Wassen
          </h4>

          {/* Amount Input */}
          <div className="mb-3">
            <input
              type="range"
              min={100}
              max={Math.min(state.dirtyMoney, washCap.remaining)}
              step={100}
              value={Math.min(washAmount, state.dirtyMoney, washCap.remaining)}
              onChange={e => setWashAmount(parseInt(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-gold"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[0.5rem] text-muted-foreground">€100</span>
              <span className="text-[0.6rem] font-bold text-gold">€{Math.min(washAmount, state.dirtyMoney, washCap.remaining).toLocaleString()}</span>
              <span className="text-[0.5rem] text-muted-foreground">€{Math.min(state.dirtyMoney, washCap.remaining).toLocaleString()}</span>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-muted/50 rounded p-2.5 mb-3 space-y-1">
            <div className="flex justify-between text-[0.55rem]">
              <span className="text-muted-foreground">Zwart geld in:</span>
              <span className="text-dirty font-semibold">€{Math.min(washAmount, state.dirtyMoney, washCap.remaining).toLocaleString()}</span>
            </div>
            <div className="flex justify-center">
              <ArrowDown size={10} className="text-gold" />
            </div>
            <div className="flex justify-between text-[0.55rem]">
              <span className="text-muted-foreground">Schoon geld uit:</span>
              <span className="text-emerald font-bold">€{expectedClean.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[0.55rem]">
              <span className="text-muted-foreground">Commissie:</span>
              <span className="text-blood font-semibold">{Math.floor((1 - cleanRate) * 100)}%</span>
            </div>
            <div className="flex justify-between text-[0.55rem]">
              <span className="text-muted-foreground">Heat impact:</span>
              <span className="text-blood font-semibold">+{expectedHeat}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <GameButton variant="gold" size="sm" className="flex-1" onClick={handleWash}>
              WAS €{Math.min(washAmount, state.dirtyMoney, washCap.remaining).toLocaleString()}
            </GameButton>
            <GameButton variant="muted" size="sm" onClick={handleWashAll}>
              ALLES
            </GameButton>
          </div>

          {/* Heat Warning */}
          {washAmount > 3000 && (
            <div className="flex items-center gap-1.5 mt-2 text-[0.5rem] text-blood">
              <AlertTriangle size={10} />
              <span>Grote bedragen witwassen trekt aandacht!</span>
            </div>
          )}
        </div>
      ) : state.dirtyMoney <= 0 ? (
        <div className="game-card p-4 text-center mb-4">
          <p className="text-xs text-muted-foreground">Geen zwart geld om te wassen.</p>
          <p className="text-[0.5rem] text-muted-foreground mt-1">Verdien zwart geld via operaties en contracten.</p>
        </div>
      ) : (
        <div className="game-card p-4 text-center mb-4 border border-blood/20">
          <AlertTriangle size={16} className="text-blood mx-auto mb-1" />
          <p className="text-xs text-blood font-bold">Dagelijkse wascapaciteit bereikt!</p>
          <p className="text-[0.5rem] text-muted-foreground mt-1">Sluit de dag af om de capaciteit te resetten.</p>
        </div>
      )}

      {/* Business Wash Overview */}
      <SectionHeader title="Dekmantels" icon={<Store size={12} />} />
      {state.ownedBusinesses.length > 0 ? (
        <div className="space-y-2">
          {state.ownedBusinesses.map(bid => {
            const biz = BUSINESSES.find(b => b.id === bid);
            if (!biz) return null;
            return (
              <div key={bid} className="game-card flex items-center gap-2.5 p-2.5">
                <div className="w-8 h-8 rounded bg-emerald/10 flex items-center justify-center flex-shrink-0">
                  <Store size={14} className="text-emerald" />
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-xs">{biz.name}</h5>
                  <div className="flex gap-3 text-[0.5rem] text-muted-foreground">
                    <span>Inkomen: <span className="text-gold font-semibold">+€{biz.income}/dag</span></span>
                    <span>Wast: <span className="text-emerald font-semibold">€{biz.clean}/dag</span></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="game-card p-3 text-center">
          <p className="text-[0.6rem] text-muted-foreground">Geen dekmantels. Koop bedrijven in het Imperium tab.</p>
        </div>
      )}

      {state.ownedDistricts.includes('neon') && (
        <div className="mt-3 text-center text-[0.5rem] text-game-purple font-bold neon-text">
          ✧ NEON STRIP BONUS: +15% witwastarief ✧
        </div>
      )}
    </div>
  );
}
