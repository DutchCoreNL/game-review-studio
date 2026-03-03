import { useGame } from '@/contexts/GameContext';
import { GEAR } from '@/game/constants';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { ViewWrapper } from '../ui/ViewWrapper';
import { WeaponCard } from '../weapons/WeaponCard';
import { motion } from 'framer-motion';
import { Sword, Shield, Smartphone } from 'lucide-react';
import profileBg from '@/assets/profile-bg.jpg';

const SLOT_ICONS: Record<string, React.ReactNode> = {
  weapon: <Sword size={20} />, armor: <Shield size={20} />, gadget: <Smartphone size={20} />,
};

export function LoadoutPanel() {
  const { state, dispatch, showToast, setView } = useGame();
  const equippedWeapon = state.weaponInventory?.find(w => w.equipped);

  return (
    <ViewWrapper bg={profileBg}>
      <SectionHeader title="Loadout" icon={<Shield size={12} />} />

      {/* Procedural weapon slot */}
      {equippedWeapon && (
        <div className="mb-3">
          <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground font-bold mb-1">Procedureel wapen</div>
          <WeaponCard weapon={equippedWeapon} compact />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        {(['weapon', 'armor', 'gadget'] as const).map(slot => {
          const gearId = state.player.loadout[slot];
          const item = gearId ? GEAR.find(g => g.id === gearId) : null;
          // Hide legacy weapon slot if procedural weapon equipped
          if (slot === 'weapon' && equippedWeapon && !gearId) return (
            <motion.button key={slot}
              onClick={() => setView('weapons' as any)}
              className="aspect-square rounded flex flex-col items-center justify-center text-center p-2 transition-all border border-dashed border-gold/30 bg-gold/5 text-gold"
              whileTap={{ scale: 0.95 }}>
              <Sword size={20} />
              <span className="text-[0.5rem] mt-1 uppercase tracking-wider font-semibold">Arsenaal</span>
            </motion.button>
          );
          return (
            <motion.button key={slot}
              onClick={() => { if (gearId) { dispatch({ type: 'UNEQUIP', slot }); showToast('Item uitgedaan'); } }}
              className={`aspect-square rounded flex flex-col items-center justify-center text-center p-2 transition-all ${
                item ? 'border border-gold bg-gold/5 text-foreground' : 'border border-dashed border-border bg-muted/30 text-muted-foreground'
              }`}
              whileTap={{ scale: 0.95 }}>
              {SLOT_ICONS[slot]}
              <span className="text-[0.5rem] mt-1 uppercase tracking-wider font-semibold">{item ? item.name : slot}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Weapon Inventory Link */}
      <GameButton variant="gold" size="sm" fullWidth className="mb-4" onClick={() => setView('weapons' as any)}>
        <Sword size={12} /> Wapenarsenaal ({state.weaponInventory?.length || 0}/20)
      </GameButton>

      <SectionHeader title="Kluis" />
      <div className="space-y-2 mb-4">
        {state.ownedGear.filter(id => !Object.values(state.player.loadout).includes(id)).map(id => {
          const item = GEAR.find(g => g.id === id);
          if (!item) return null;
          return (
            <div key={id} className="game-card flex justify-between items-center">
              <div>
                <h4 className="font-bold text-xs">{item.name}</h4>
                <p className="text-[0.5rem] text-muted-foreground">{item.desc}</p>
              </div>
              <GameButton variant="gold" size="sm" onClick={() => { dispatch({ type: 'EQUIP', id }); showToast(`${item.name} uitgerust`); }}>
                DRAAG
              </GameButton>
            </div>
          );
        })}
        {state.ownedGear.filter(id => !Object.values(state.player.loadout).includes(id)).length === 0 && (
          <p className="text-muted-foreground text-xs italic py-3">Kluis is leeg. Koop gear op de Zwarte Markt (Handel tab).</p>
        )}
      </div>
    </ViewWrapper>
  );
}
