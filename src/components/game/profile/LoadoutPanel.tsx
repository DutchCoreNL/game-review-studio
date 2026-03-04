import { useGame } from '@/contexts/GameContext';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { ViewWrapper } from '../ui/ViewWrapper';
import { WeaponCard } from '../weapons/WeaponCard';
import { GearCard } from '../gear/GearCard';
import { motion } from 'framer-motion';
import { Sword, Shield, Smartphone } from 'lucide-react';
import profileBg from '@/assets/profile-bg.jpg';

export function LoadoutPanel() {
  const { state, dispatch, showToast, setView } = useGame();
  const equippedWeapon = state.weaponInventory?.find(w => w.equipped);
  const equippedArmor = state.armorInventory?.find(g => g.equipped);
  const equippedGadget = state.gadgetInventory?.find(g => g.equipped);

  return (
    <ViewWrapper bg={profileBg}>
      <SectionHeader title="Loadout" icon={<Shield size={12} />} />

      {/* Procedural weapon slot */}
      <div className="mb-4">
        <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground font-bold mb-1">Wapen</div>
        {equippedWeapon ? (
          <WeaponCard weapon={equippedWeapon} compact />
        ) : (
          <motion.button
            onClick={() => setView('weapons' as any)}
            className="w-full rounded flex items-center gap-3 p-3 transition-all border border-dashed border-border bg-muted/20 text-muted-foreground hover:border-gold/30 hover:text-gold"
            whileTap={{ scale: 0.98 }}
          >
            <Sword size={20} />
            <div className="text-left">
              <span className="text-xs font-semibold">Geen wapen uitgerust</span>
              <p className="text-[0.45rem] opacity-70">Ga naar het Wapenarsenaal</p>
            </div>
          </motion.button>
        )}
      </div>

      {/* Procedural armor slot */}
      <div className="mb-4">
        <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground font-bold mb-1">Pantser</div>
        {equippedArmor ? (
          <GearCard gear={equippedArmor} compact />
        ) : (
          <motion.button
            onClick={() => setView('armor-arsenal' as any)}
            className="w-full rounded flex items-center gap-3 p-3 transition-all border border-dashed border-border bg-muted/20 text-muted-foreground hover:border-ice/30 hover:text-ice"
            whileTap={{ scale: 0.98 }}
          >
            <Shield size={20} />
            <div className="text-left">
              <span className="text-xs font-semibold">Geen pantser uitgerust</span>
              <p className="text-[0.45rem] opacity-70">Ga naar het Pantser Arsenaal</p>
            </div>
          </motion.button>
        )}
      </div>

      {/* Procedural gadget slot */}
      <div className="mb-4">
        <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground font-bold mb-1">Gadget</div>
        {equippedGadget ? (
          <GearCard gear={equippedGadget} compact />
        ) : (
          <motion.button
            onClick={() => setView('gadget-arsenal' as any)}
            className="w-full rounded flex items-center gap-3 p-3 transition-all border border-dashed border-border bg-muted/20 text-muted-foreground hover:border-game-purple/30 hover:text-game-purple"
            whileTap={{ scale: 0.98 }}
          >
            <Smartphone size={20} />
            <div className="text-left">
              <span className="text-xs font-semibold">Geen gadget uitgerust</span>
              <p className="text-[0.45rem] opacity-70">Ga naar het Gadget Arsenaal</p>
            </div>
          </motion.button>
        )}
      </div>

      {/* Arsenal links */}
      <div className="space-y-2">
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
