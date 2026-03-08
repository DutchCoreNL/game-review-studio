import { useGame } from '@/contexts/GameContext';
import { AMMO_PACKS, SPECIAL_AMMO, SPECIAL_AMMO_PACKS, MAX_AMMO } from '@/game/constants';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { StatBar } from '../ui/StatBar';
import { motion } from 'framer-motion';
import { ShieldCheck, Crosshair, Zap, Sword, Shield, Smartphone, ShoppingBag, Hammer } from 'lucide-react';
import { useState } from 'react';

export function GearPanel() {
  const { state, dispatch, showToast, setView } = useGame();
  const currentAmmo = state.ammo || 0;

  return (
    <div>
      {/* Universal Ammo Section */}
      <SectionHeader title="Munitie" icon={<Crosshair size={12} />} />

      {/* Ammo Counter */}
      <div className="game-card p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold">🔫 Kogels</span>
          <span className={`text-sm font-bold ${currentAmmo <= 10 ? 'text-blood' : currentAmmo <= 50 ? 'text-gold' : 'text-foreground'}`}>
            {currentAmmo}/{MAX_AMMO}
          </span>
        </div>
        <StatBar value={currentAmmo} max={MAX_AMMO} color={currentAmmo <= 10 ? 'blood' : currentAmmo <= 50 ? 'gold' : 'emerald'} height="sm" />
        {currentAmmo <= 10 && (
          <p className="text-[0.5rem] text-blood mt-1 animate-pulse">⚠️ Bijna geen munitie! Koop bij.</p>
        )}
      </div>

      {/* Buy ammo packs */}
      <div className="flex gap-2 mb-3">
        {AMMO_PACKS.map(pack => (
          <motion.button
            key={pack.id}
            onClick={() => {
              if (state.money >= pack.cost && currentAmmo < MAX_AMMO) {
                dispatch({ type: 'BUY_AMMO', packId: pack.id, ammoType: '9mm' });
                showToast(`+${pack.amount} kogels gekocht!`);
              } else if (currentAmmo >= MAX_AMMO) {
                showToast(`Ammo is vol (max ${MAX_AMMO})`, true);
              } else {
                showToast('Niet genoeg geld', true);
              }
            }}
            disabled={state.money < pack.cost || currentAmmo >= MAX_AMMO}
            className={`flex-1 game-card p-2.5 text-center transition-all ${
              state.money >= pack.cost && currentAmmo < MAX_AMMO
                ? 'border-gold/30 hover:border-gold cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-lg mb-0.5">{pack.icon}</div>
            <div className="text-[0.55rem] font-bold text-foreground">{pack.name}</div>
            <div className="text-[0.5rem] text-gold font-bold">€{pack.cost.toLocaleString()}</div>
          </motion.button>
        ))}
      </div>

      {/* Special Ammo */}
      {SPECIAL_AMMO.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap size={10} className="text-game-purple" />
            <span className="text-[0.5rem] font-bold text-game-purple uppercase tracking-wider">Speciale Munitie</span>
          </div>
          <div className="flex gap-2">
            {SPECIAL_AMMO.map(sa => {
              const owned = state.specialAmmo?.[sa.id] || 0;
              const isActive = state.activeSpecialAmmo === sa.id;
              const pack = SPECIAL_AMMO_PACKS.find(p => p.id === sa.id);
              return (
                <div key={sa.id} className={`flex-1 game-card p-2 text-center ${isActive ? 'border-game-purple' : ''}`}>
                  <div className="text-sm mb-0.5">{sa.icon}</div>
                  <div className="text-[0.5rem] font-bold">{sa.name}</div>
                  <div className="text-[0.45rem] text-muted-foreground mb-1">{owned}x</div>
                  <div className="flex gap-1">
                    {pack && (
                      <button
                        onClick={() => {
                          if (state.money >= pack.cost) {
                            dispatch({ type: 'BUY_SPECIAL_AMMO', specialType: sa.id, amount: pack.amount, cost: pack.cost });
                            showToast(`+${pack.amount} ${sa.name} gekocht!`);
                          } else {
                            showToast('Niet genoeg geld', true);
                          }
                        }}
                        disabled={state.money < pack.cost}
                        className="flex-1 text-[0.4rem] py-1 rounded bg-gold/10 border border-gold/30 text-gold font-bold disabled:opacity-30"
                      >
                        €{pack.cost.toLocaleString()}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        dispatch({ type: 'SET_SPECIAL_AMMO', specialType: isActive ? null : sa.id });
                        showToast(isActive ? 'Speciale munitie uitgeschakeld' : `${sa.name} geladen!`);
                      }}
                      disabled={owned <= 0 && !isActive}
                      className={`flex-1 text-[0.4rem] py-1 rounded font-bold ${
                        isActive ? 'bg-game-purple/20 border border-game-purple text-game-purple' : 'bg-muted border border-border text-muted-foreground disabled:opacity-30'
                      }`}
                    >
                      {isActive ? 'ACTIEF' : 'LAAD'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-[0.5rem] text-muted-foreground text-center mb-4">
        🔫 Universele kogels — Nodig voor gevechten, huurmoorden en PvP
      </div>

      {/* Arsenal Navigation */}
      <SectionHeader title="Arsenaal" icon={<ShieldCheck size={12} />} />

      <div className="space-y-2">
        <motion.button
          onClick={() => setView('weapons')}
          className="w-full game-card p-3 flex items-center gap-3 hover:border-blood/40 transition-all"
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded bg-blood/10 flex items-center justify-center flex-shrink-0">
            <Sword size={18} className="text-blood" />
          </div>
          <div className="flex-1 text-left">
            <h4 className="font-bold text-xs">Wapenarsenaal</h4>
            <p className="text-[0.5rem] text-muted-foreground">Bekijk, upgrade en equip je wapens</p>
          </div>
          <span className="text-[0.55rem] text-muted-foreground">{state.weaponInventory?.length || 0}/20</span>
        </motion.button>

        <motion.button
          onClick={() => setView('armor-arsenal')}
          className="w-full game-card p-3 flex items-center gap-3 hover:border-ice/40 transition-all"
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded bg-ice/10 flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-ice" />
          </div>
          <div className="flex-1 text-left">
            <h4 className="font-bold text-xs">Pantser Arsenaal</h4>
            <p className="text-[0.5rem] text-muted-foreground">Armor en beschermende uitrusting</p>
          </div>
          <span className="text-[0.55rem] text-muted-foreground">{state.armorInventory?.length || 0}/20</span>
        </motion.button>

        <motion.button
          onClick={() => setView('gadget-arsenal')}
          className="w-full game-card p-3 flex items-center gap-3 hover:border-game-purple/40 transition-all"
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded bg-game-purple/10 flex items-center justify-center flex-shrink-0">
            <Smartphone size={18} className="text-game-purple" />
          </div>
          <div className="flex-1 text-left">
            <h4 className="font-bold text-xs">Gadget Arsenaal</h4>
            <p className="text-[0.5rem] text-muted-foreground">Tech, hacking tools en gadgets</p>
          </div>
          <span className="text-[0.55rem] text-muted-foreground">{state.gadgetInventory?.length || 0}/20</span>
        </motion.button>

        <motion.button
          onClick={() => setView('black-market')}
          className="w-full game-card p-3 flex items-center gap-3 hover:border-gold/40 transition-all border-l-[3px] border-l-gold"
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded bg-gold/10 flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={18} className="text-gold" />
          </div>
          <div className="flex-1 text-left">
            <h4 className="font-bold text-xs text-gold">Zwarte Markt</h4>
            <p className="text-[0.5rem] text-muted-foreground">Koop procedurele wapens, armor & gadgets</p>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setView('salvage')}
          className="w-full game-card p-3 flex items-center gap-3 hover:border-emerald/40 transition-all"
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded bg-emerald/10 flex items-center justify-center flex-shrink-0">
            <Hammer size={18} className="text-emerald" />
          </div>
          <div className="flex-1 text-left">
            <h4 className="font-bold text-xs">Salvage & Craft</h4>
            <p className="text-[0.5rem] text-muted-foreground">Ontmantel gear voor scrap en craft nieuwe items</p>
          </div>
        </motion.button>
      </div>

      <p className="text-[0.5rem] text-muted-foreground text-center mt-4">
        ⚔️ Alle gear is procedureel gegenereerd — vind unieke combinaties!
      </p>
    </div>
  );
}
