import { useGame } from '@/contexts/GameContext';
import { GameButton } from '../ui/GameButton';
import { ViewWrapper } from '../ui/ViewWrapper';
import { WeaponCard } from '../weapons/WeaponCard';
import { GearCard } from '../gear/GearCard';
import { motion } from 'framer-motion';
import { Sword, Shield, Smartphone, Crosshair, Save, Play, Trash2, Pencil, Sparkles } from 'lucide-react';
import { MAX_WEAPON_INVENTORY } from '@/game/weaponGenerator';
import { MAX_GEAR_INVENTORY } from '@/game/gearGenerator';
import { GameView } from '@/game/types';
import { detectSetBonuses } from '@/game/arsenalSets';
import { GameBadge } from '../ui/GameBadge';
import arsenalBg from '@/assets/arsenal-bg.jpg';
import { useState } from 'react';

function SetBonusDisplay({ equippedWeapon, equippedArmor, equippedGadget }: {
  equippedWeapon: any; equippedArmor: any; equippedGadget: any;
}) {
  const bonuses = detectSetBonuses(equippedWeapon, equippedArmor, equippedGadget);
  if (bonuses.length === 0) return null;

  return (
    <div className="game-card p-2.5 mb-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sparkles size={10} className="text-gold" />
        <span className="text-[0.5rem] uppercase tracking-wider text-gold font-bold">Set Bonussen</span>
      </div>
      {bonuses.map(bonus => (
        <div key={bonus.def.familyId} className="flex items-center justify-between py-1 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{bonus.def.icon}</span>
            <span className={`text-[0.5rem] font-bold ${bonus.def.color}`}>{bonus.def.name}</span>
            <GameBadge variant="gold" size="xs">{bonus.matchedPieces}/3</GameBadge>
          </div>
          {bonus.activeTier && (
            <span className="text-[0.4rem] text-gold/80">{bonus.activeTier.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function LoadoutPresets() {
  const { state, dispatch, showToast } = useGame();
  const presets = state.loadoutPresets || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleSave = () => {
    if (presets.length >= 5) {
      showToast('Maximum 5 presets bereikt', 'error');
      return;
    }
    dispatch({ type: 'SAVE_LOADOUT_PRESET', name: `Loadout ${presets.length + 1}` });
    showToast('Loadout opgeslagen!', 'success');
  };

  const handleLoad = (presetId: string) => {
    dispatch({ type: 'LOAD_LOADOUT_PRESET', presetId });
    showToast('Loadout geladen!', 'success');
  };

  const handleDelete = (presetId: string) => {
    dispatch({ type: 'DELETE_LOADOUT_PRESET', presetId });
  };

  const handleRename = (presetId: string) => {
    if (editName.trim()) {
      dispatch({ type: 'RENAME_LOADOUT_PRESET', presetId, name: editName.trim() });
      setEditingId(null);
    }
  };

  return (
    <div className="game-card p-2.5 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Save size={10} className="text-ice" />
          <span className="text-[0.5rem] uppercase tracking-wider text-ice font-bold">Presets</span>
        </div>
        <GameButton variant="muted" size="sm" onClick={handleSave} disabled={presets.length >= 5}>
          <Save size={10} /> Opslaan
        </GameButton>
      </div>
      {presets.length === 0 && (
        <p className="text-[0.45rem] text-muted-foreground italic">Geen presets opgeslagen</p>
      )}
      <div className="space-y-1">
        {presets.map((preset: any) => (
          <div key={preset.id} className="flex items-center gap-1.5 py-1 border-t border-border/50">
            {editingId === preset.id ? (
              <input
                className="flex-1 text-[0.5rem] bg-muted/50 rounded px-1.5 py-0.5 border border-border"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRename(preset.id)}
                onBlur={() => handleRename(preset.id)}
                autoFocus
              />
            ) : (
              <span className="flex-1 text-[0.5rem] font-semibold truncate">{preset.name}</span>
            )}
            <button onClick={() => handleLoad(preset.id)} className="p-0.5 rounded hover:bg-muted/50">
              <Play size={8} className="text-emerald" />
            </button>
            <button onClick={() => { setEditingId(preset.id); setEditName(preset.name); }} className="p-0.5 rounded hover:bg-muted/50">
              <Pencil size={8} className="text-muted-foreground" />
            </button>
            <button onClick={() => handleDelete(preset.id)} className="p-0.5 rounded hover:bg-muted/50">
              <Trash2 size={8} className="text-blood" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

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

      {/* Set Bonus Display */}
      <SetBonusDisplay equippedWeapon={equippedWeapon} equippedArmor={equippedArmor} equippedGadget={equippedGadget} />

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
              onClick={() => setView('weapons' as GameView)}
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
              onClick={() => setView('armor-arsenal' as GameView)}
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
              onClick={() => setView('gadget-arsenal' as GameView)}
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

      {/* Loadout Presets */}
      <LoadoutPresets />

      {/* Arsenal navigation */}
      <div className="game-card p-3 space-y-2">
        <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground font-bold mb-1">Arsenaal</div>
        <GameButton variant="gold" size="sm" fullWidth onClick={() => setView('weapons')}>
          <Sword size={12} /> Wapenarsenaal ({state.weaponInventory?.length || 0}/{MAX_WEAPON_INVENTORY})
        </GameButton>
        <GameButton variant="muted" size="sm" fullWidth onClick={() => setView('armor-arsenal')}>
          <Shield size={12} /> Pantser Arsenaal ({state.armorInventory?.length || 0}/{MAX_GEAR_INVENTORY})
        </GameButton>
        <GameButton variant="muted" size="sm" fullWidth onClick={() => setView('gadget-arsenal')}>
          <Smartphone size={12} /> Gadget Arsenaal ({state.gadgetInventory?.length || 0}/{MAX_GEAR_INVENTORY})
        </GameButton>
      </div>
    </ViewWrapper>
  );
}
