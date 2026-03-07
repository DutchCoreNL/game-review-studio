import { useGame } from '@/contexts/GameContext';
import { GameButton } from '../ui/GameButton';
import { ViewWrapper } from '../ui/ViewWrapper';
import { WeaponCard } from '../weapons/WeaponCard';
import { GearCard } from '../gear/GearCard';
import { motion } from 'framer-motion';
import { Sword, Shield, Smartphone, Crosshair } from 'lucide-react';
import arsenalBg from '@/assets/arsenal-bg.jpg';

export function LoadoutPanel() {
  const { state, dispatch, showToast, setView } = useGame();
  const equippedWeapon = state.weaponInventory?.find(w => w.equipped);
  const equippedArmor = state.armorInventory?.find(g => g.equipped);
  const equippedGadget = state.gadgetInventory?.find(g => g.equipped);

  const totalItems = (state.weaponInventory?.length || 0) + (state.armorInventory?.length || 0) + (state.gadgetInventory?.length || 0);

  return (
    <ViewWrapper bg={arsenalBg}>
      {/* Cinematic header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
          <Crosshair size={18} className="text-gold" />
        </div>
        <div>
          <h2 className="font-display text-lg text-gold uppercase tracking-widest font-bold">Loadout</h2>
          <p className="text-[0.55rem] text-muted-foreground">{totalItems} items in arsenaal</p>
        </div>
      </div>

      {/* Equipped slots */}
      <div className="space-y-3 mb-4">
        {/* Weapon slot */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sword size={10} className="text-gold" />
            <span className="text-[0.5rem] uppercase tracking-wider text-gold/80 font-bold">Wapen</span>
          </div>
          {equippedWeapon ? (
            <WeaponCard weapon={equippedWeapon} compact />
          ) : (
            <motion.button
              onClick={() => setView('weapons' as any)}
              className="w-full rounded-lg flex items-center gap-3 p-3 transition-all border border-dashed border-gold/20 bg-gold/5 text-muted-foreground hover:border-gold/40 hover:bg-gold/10"
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 rounded bg-gold/10 flex items-center justify-center">
                <Sword size={16} className="text-gold/50" />
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-gold/70">Geen wapen uitgerust</span>
                <p className="text-[0.45rem] text-muted-foreground">Ga naar het Wapenarsenaal</p>
              </div>
            </motion.button>
          )}
        </div>

        {/* Armor slot */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Shield size={10} className="text-ice" />
            <span className="text-[0.5rem] uppercase tracking-wider text-ice/80 font-bold">Pantser</span>
          </div>
          {equippedArmor ? (
            <GearCard gear={equippedArmor} compact />
          ) : (
            <motion.button
              onClick={() => setView('armor-arsenal' as any)}
              className="w-full rounded-lg flex items-center gap-3 p-3 transition-all border border-dashed border-ice/20 bg-ice/5 text-muted-foreground hover:border-ice/40 hover:bg-ice/10"
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 rounded bg-ice/10 flex items-center justify-center">
                <Shield size={16} className="text-ice/50" />
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-ice/70">Geen pantser uitgerust</span>
                <p className="text-[0.45rem] text-muted-foreground">Ga naar het Pantser Arsenaal</p>
              </div>
            </motion.button>
          )}
        </div>

        {/* Gadget slot */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Smartphone size={10} className="text-game-purple" />
            <span className="text-[0.5rem] uppercase tracking-wider text-game-purple/80 font-bold">Gadget</span>
          </div>
          {equippedGadget ? (
            <GearCard gear={equippedGadget} compact />
          ) : (
            <motion.button
              onClick={() => setView('gadget-arsenal' as any)}
              className="w-full rounded-lg flex items-center gap-3 p-3 transition-all border border-dashed border-game-purple/20 bg-game-purple/5 text-muted-foreground hover:border-game-purple/40 hover:bg-game-purple/10"
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 rounded bg-game-purple/10 flex items-center justify-center">
                <Smartphone size={16} className="text-game-purple/50" />
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-game-purple/70">Geen gadget uitgerust</span>
                <p className="text-[0.45rem] text-muted-foreground">Ga naar het Gadget Arsenaal</p>
              </div>
            </motion.button>
          )}
        </div>
      </div>

      {/* Arsenal navigation */}
      <div className="game-card p-3 space-y-2">
        <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground font-bold mb-1">Arsenaal</div>
        <GameButton variant="gold" size="sm" fullWidth onClick={() => setView('weapons' as any)}>
          <Sword size={12} /> Wapenarsenaal ({state.weaponInventory?.length || 0}/20)
        </GameButton>
        <GameButton variant="muted" size="sm" fullWidth onClick={() => setView('armor-arsenal' as any)}>
          <Shield size={12} /> Pantser Arsenaal ({state.armorInventory?.length || 0}/20)
        </GameButton>
        <GameButton variant="muted" size="sm" fullWidth onClick={() => setView('gadget-arsenal' as any)}>
          <Smartphone size={12} /> Gadget Arsenaal ({state.gadgetInventory?.length || 0}/20)
        </GameButton>
      </div>
    </ViewWrapper>
  );
}
