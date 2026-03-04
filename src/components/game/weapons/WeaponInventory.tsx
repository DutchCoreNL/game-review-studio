import { useState, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { GeneratedWeapon, WEAPON_RARITY_LABEL, MAX_WEAPON_INVENTORY, WeaponRarity, FrameId, BrandId } from '@/game/weaponGenerator';
import { getUpgradeCost, canUpgradeWeapon, getAccessorySwapCost, getAvailableAccessories, canFuseWeapons, getMasteryProgress } from '@/game/weaponUpgrade';
import { WeaponCard } from './WeaponCard';
import { WeaponCompare } from './WeaponCompare';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { ViewWrapper } from '../ui/ViewWrapper';
import { GameBadge } from '../ui/GameBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Filter, ArrowDownUp, Trash2, Merge, ShoppingBag } from 'lucide-react';
import profileBg from '@/assets/profile-bg.jpg';

type SortKey = 'damage' | 'rarity' | 'level' | 'name' | 'dps';

const RARITY_ORDER: Record<WeaponRarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };

export function WeaponInventory() {
  const { state, dispatch, showToast } = useGame();
  const [selectedWeapon, setSelectedWeapon] = useState<GeneratedWeapon | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('rarity');
  const [filterFrame, setFilterFrame] = useState<FrameId | 'all'>('all');
  const [fusionMode, setFusionMode] = useState(false);
  const [fusionSelection, setFusionSelection] = useState<string[]>([]);
  const [bulkSellRarity, setBulkSellRarity] = useState<WeaponRarity | null>(null);

  const weapons = state.weaponInventory || [];
  const equippedWeapon = weapons.find(w => w.equipped);

  const sortedWeapons = useMemo(() => {
    let filtered = filterFrame === 'all' ? [...weapons] : weapons.filter(w => w.frame === filterFrame);
    switch (sortBy) {
      case 'damage': return filtered.sort((a, b) => b.damage - a.damage);
      case 'rarity': return filtered.sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]);
      case 'level': return filtered.sort((a, b) => b.level - a.level);
      case 'name': return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'dps': return filtered.sort((a, b) => (b.damage * b.fireRate) - (a.damage * a.fireRate));
      default: return filtered;
    }
  }, [weapons, sortBy, filterFrame]);

  // Handle fusion selection
  const handleFusionToggle = (weaponId: string) => {
    if (fusionSelection.includes(weaponId)) {
      setFusionSelection(fusionSelection.filter(id => id !== weaponId));
    } else if (fusionSelection.length < 3) {
      setFusionSelection([...fusionSelection, weaponId]);
    }
  };

  const fusionWeapons = fusionSelection.map(id => weapons.find(w => w.id === id)).filter(Boolean) as GeneratedWeapon[];
  const fusionCheck = fusionWeapons.length === 3 ? canFuseWeapons(fusionWeapons, state.money) : null;

  const executeFusion = () => {
    if (fusionCheck?.canFuse && fusionSelection.length === 3) {
      dispatch({ type: 'FUSE_WEAPONS', weaponIds: fusionSelection as [string, string, string] });
      showToast(`Fusie geslaagd! Nieuw ${fusionCheck.targetRarity} wapen verkregen!`);
      setFusionSelection([]);
      setFusionMode(false);
    }
  };

  // Bulk sell
  const handleBulkSell = (maxRarity: WeaponRarity) => {
    const toSell = weapons.filter(w => !w.equipped && !w.locked && RARITY_ORDER[w.rarity] <= RARITY_ORDER[maxRarity]);
    if (toSell.length === 0) {
      showToast('Geen wapens om te verkopen');
      return;
    }
    const totalValue = toSell.reduce((s, w) => s + w.sellValue, 0);
    dispatch({ type: 'BULK_SELL_WEAPONS', maxRarity });
    showToast(`${toSell.length} wapens verkocht voor €${totalValue.toLocaleString()}`);
    setBulkSellRarity(null);
  };

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
            if (selectedWeapon.locked) {
              showToast('Dit wapen is gelocked!');
              return;
            }
            dispatch({ type: 'SELL_WEAPON', weaponId: selectedWeapon.id });
            showToast(`${selectedWeapon.name} verkocht voor €${selectedWeapon.sellValue.toLocaleString()}`);
            setSelectedWeapon(null);
          }}
          onUpgrade={() => {
            const check = canUpgradeWeapon(selectedWeapon, state.money);
            if (!check.canUpgrade) {
              showToast(check.reason || 'Kan niet upgraden');
              return;
            }
            dispatch({ type: 'UPGRADE_WEAPON', weaponId: selectedWeapon.id });
            showToast(`${selectedWeapon.name} geüpgraded naar level ${selectedWeapon.level + 1}!`);
            // Refresh the selected weapon
            const updated = (state.weaponInventory || []).find(w => w.id === selectedWeapon.id);
            if (updated) setSelectedWeapon(updated);
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
          <WeaponCard weapon={equippedWeapon} onToggleLock={() => {
            dispatch({ type: 'TOGGLE_WEAPON_LOCK', weaponId: equippedWeapon.id });
          }} />
        </div>
      )}

      {/* Capacity + Controls */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.5rem] text-muted-foreground">{weapons.length}/{MAX_WEAPON_INVENTORY} wapens</span>
        <div className="flex gap-1">
          {/* Sort */}
          <button
            onClick={() => {
              const keys: SortKey[] = ['rarity', 'damage', 'level', 'name', 'dps'];
              const idx = keys.indexOf(sortBy);
              setSortBy(keys[(idx + 1) % keys.length]);
            }}
            className="text-[0.45rem] flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowDownUp size={8} /> {sortBy === 'dps' ? 'DPS' : sortBy}
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

      {/* Action buttons */}
      <div className="flex gap-1.5 mb-3">
        <GameButton
          variant={fusionMode ? 'gold' : 'muted'}
          size="sm"
          onClick={() => { setFusionMode(!fusionMode); setFusionSelection([]); }}
        >
          <Merge size={10} /> {fusionMode ? 'Stop Fusie' : 'Fusie'}
        </GameButton>
        {bulkSellRarity === null ? (
          <GameButton variant="muted" size="sm" onClick={() => setBulkSellRarity('common')}>
            <ShoppingBag size={10} /> Bulk Verkoop
          </GameButton>
        ) : (
          <div className="flex gap-1 items-center">
            <span className="text-[0.45rem] text-muted-foreground">Verkoop t/m:</span>
            {(['common', 'uncommon', 'rare'] as WeaponRarity[]).map(r => (
              <button
                key={r}
                onClick={() => handleBulkSell(r)}
                className="text-[0.45rem] px-1.5 py-0.5 rounded bg-muted hover:bg-blood/20 hover:text-blood transition-colors"
              >
                {WEAPON_RARITY_LABEL[r]}
              </button>
            ))}
            <button onClick={() => setBulkSellRarity(null)} className="text-[0.45rem] text-muted-foreground hover:text-foreground">✕</button>
          </div>
        )}
      </div>

      {/* Fusion info */}
      {fusionMode && (
        <div className="game-card p-2 mb-3 border border-gold/30 bg-gold/5">
          <p className="text-[0.5rem] text-gold font-semibold mb-1">🔥 Fusie Modus — Selecteer 3 wapens van dezelfde rarity</p>
          <p className="text-[0.45rem] text-muted-foreground">Combineer 3 wapens → 1 wapen van hogere rarity</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[0.45rem] text-muted-foreground">Geselecteerd: {fusionSelection.length}/3</span>
            {fusionCheck && (
              fusionCheck.canFuse ? (
                <GameButton variant="gold" size="sm" onClick={executeFusion}>
                  FUSEER (€{fusionCheck.cost.toLocaleString()})
                </GameButton>
              ) : (
                <span className="text-[0.45rem] text-blood">{fusionCheck.reason}</span>
              )
            )}
          </div>
        </div>
      )}

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
                highlight={weapon.equipped || fusionSelection.includes(weapon.id)}
                onClick={() => fusionMode ? handleFusionToggle(weapon.id) : setSelectedWeapon(weapon)}
                onToggleLock={() => dispatch({ type: 'TOGGLE_WEAPON_LOCK', weaponId: weapon.id })}
                actions={
                  !fusionMode ? (
                    <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {!weapon.equipped && (
                        <GameButton variant="gold" size="sm" onClick={() => {
                          dispatch({ type: 'EQUIP_WEAPON', weaponId: weapon.id });
                          showToast(`${weapon.name} uitgerust!`);
                        }}>
                          DRAAG
                        </GameButton>
                      )}
                      {!weapon.locked && !weapon.equipped && (
                        <GameButton variant="muted" size="sm" onClick={() => {
                          dispatch({ type: 'SELL_WEAPON', weaponId: weapon.id });
                          showToast(`Verkocht voor €${weapon.sellValue.toLocaleString()}`);
                        }}>
                          <Trash2 size={10} />
                        </GameButton>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center shrink-0">
                      {fusionSelection.includes(weapon.id) && (
                        <GameBadge variant="gold" size="xs">✓</GameBadge>
                      )}
                    </div>
                  )
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
