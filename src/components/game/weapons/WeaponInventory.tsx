import { useState, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { GeneratedWeapon, WEAPON_RARITY_LABEL, MAX_WEAPON_INVENTORY, WeaponRarity, FrameId, BrandId } from '@/game/weaponGenerator';
import { WeaponCard } from './WeaponCard';
import { WeaponCompare } from './WeaponCompare';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { ViewWrapper } from '../ui/ViewWrapper';
import { GameBadge } from '../ui/GameBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Filter, ArrowDownUp, Trash2 } from 'lucide-react';
import profileBg from '@/assets/profile-bg.jpg';

type SortKey = 'damage' | 'rarity' | 'level' | 'name';

const RARITY_ORDER: Record<WeaponRarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };

export function WeaponInventory() {
  const { state, dispatch, showToast } = useGame();
  const [selectedWeapon, setSelectedWeapon] = useState<GeneratedWeapon | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('rarity');
  const [filterFrame, setFilterFrame] = useState<FrameId | 'all'>('all');

  const weapons = state.weaponInventory || [];
  const equippedWeapon = weapons.find(w => w.equipped);

  const sortedWeapons = useMemo(() => {
    let filtered = filterFrame === 'all' ? [...weapons] : weapons.filter(w => w.frame === filterFrame);
    switch (sortBy) {
      case 'damage': return filtered.sort((a, b) => b.damage - a.damage);
      case 'rarity': return filtered.sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]);
      case 'level': return filtered.sort((a, b) => b.level - a.level);
      case 'name': return filtered.sort((a, b) => a.name.localeCompare(b.name));
      default: return filtered;
    }
  }, [weapons, sortBy, filterFrame]);

  // Show compare view
  if (selectedWeapon) {
    return (
      <ViewWrapper bg={profileBg}>
        <WeaponCompare
          weapon={selectedWeapon}
          currentWeapon={equippedWeapon || null}
          onEquip={() => {
            dispatch({ type: 'EQUIP_WEAPON', weaponId: selectedWeapon.id });
            showToast(`${selectedWeapon.name} uitgerust!`);
            setSelectedWeapon(null);
          }}
          onSell={() => {
            dispatch({ type: 'SELL_WEAPON', weaponId: selectedWeapon.id });
            showToast(`${selectedWeapon.name} verkocht voor €${selectedWeapon.sellValue.toLocaleString()}`);
            setSelectedWeapon(null);
          }}
          onBack={() => setSelectedWeapon(null)}
        />
      </ViewWrapper>
    );
  }

  return (
    <ViewWrapper bg={profileBg}>
      <SectionHeader title="Wapenarsenaal" icon={<Sword size={12} />} />

      {/* Equipped weapon */}
      {equippedWeapon && (
        <div className="mb-3">
          <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground font-bold mb-1">Huidig wapen</div>
          <WeaponCard weapon={equippedWeapon} />
        </div>
      )}

      {/* Capacity */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.5rem] text-muted-foreground">{weapons.length}/{MAX_WEAPON_INVENTORY} wapens</span>
        <div className="flex gap-1">
          {/* Sort */}
          <button
            onClick={() => {
              const keys: SortKey[] = ['rarity', 'damage', 'level', 'name'];
              const idx = keys.indexOf(sortBy);
              setSortBy(keys[(idx + 1) % keys.length]);
            }}
            className="text-[0.45rem] flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowDownUp size={8} /> {sortBy}
          </button>
          {/* Frame filter */}
          <button
            onClick={() => {
              const frames: (FrameId | 'all')[] = ['all', 'pistol', 'smg', 'shotgun', 'rifle', 'blade', 'lmg', 'launcher'];
              const idx = frames.indexOf(filterFrame);
              setFilterFrame(frames[(idx + 1) % frames.length]);
            }}
            className="text-[0.45rem] flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Filter size={8} /> {filterFrame === 'all' ? 'Alle' : filterFrame}
          </button>
        </div>
      </div>

      {/* Weapon list */}
      <div className="space-y-2">
        <AnimatePresence>
          {sortedWeapons.map(weapon => (
            <motion.div
              key={weapon.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              layout
            >
              <WeaponCard
                weapon={weapon}
                compact
                highlight={weapon.equipped}
                onClick={() => setSelectedWeapon(weapon)}
                actions={
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!weapon.equipped && (
                      <GameButton variant="gold" size="sm" onClick={() => {
                        dispatch({ type: 'EQUIP_WEAPON', weaponId: weapon.id });
                        showToast(`${weapon.name} uitgerust!`);
                      }}>
                        DRAAG
                      </GameButton>
                    )}
                    <GameButton variant="muted" size="sm" onClick={() => {
                      dispatch({ type: 'SELL_WEAPON', weaponId: weapon.id });
                      showToast(`Verkocht voor €${weapon.sellValue.toLocaleString()}`);
                    }}>
                      <Trash2 size={10} />
                    </GameButton>
                  </div>
                }
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {weapons.length === 0 && (
        <p className="text-muted-foreground text-xs italic py-6 text-center">
          Geen wapens. Vecht om procedurele wapens te verdienen!
        </p>
      )}
    </ViewWrapper>
  );
}
