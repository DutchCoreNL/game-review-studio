import { useState, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { GeneratedWeapon, WEAPON_RARITY_LABEL, MAX_WEAPON_INVENTORY, WeaponRarity, FrameId, BrandId } from '@/game/weaponGenerator';
import { getUpgradeCost, canUpgradeWeapon, getAccessorySwapCost, getAvailableAccessories, canFuseWeapons, getMasteryProgress } from '@/game/weaponUpgrade';
import { WeaponCard } from './WeaponCard';
import { WeaponCompare } from './WeaponCompare';
import { GameButton } from '../ui/GameButton';
import { ViewWrapper } from '../ui/ViewWrapper';
import { GameBadge } from '../ui/GameBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Filter, ArrowDownUp, Trash2, Merge, ShoppingBag } from 'lucide-react';
import arsenalBg from '@/assets/arsenal-bg.jpg';

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

  if (selectedWeapon) {
    return (
      <ViewWrapper bg={arsenalBg}>
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
            showToast(`${selectedWeapon.name} geüpgraded!`);
            // Close detail view so list re-renders with fresh upgraded data
            setSelectedWeapon(null);
          }}
          onBack={() => setSelectedWeapon(null)}
        />
      </ViewWrapper>
    );
  }

  return (
    <ViewWrapper bg={arsenalBg}>
      {/* Cinematic header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
          <Sword size={18} className="text-gold" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-lg text-gold uppercase tracking-widest font-bold">Wapenarsenaal</h2>
          <p className="text-[0.55rem] text-muted-foreground">{weapons.length}/{MAX_WEAPON_INVENTORY} wapens • Sorteer op {sortBy === 'dps' ? 'DPS' : sortBy}</p>
        </div>
      </div>

      {/* Equipped weapon highlight */}
      {equippedWeapon && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-[0.5rem] uppercase tracking-wider text-gold/80 font-bold">Uitgerust</span>
          </div>
          <WeaponCard weapon={equippedWeapon} onToggleLock={() => {
            dispatch({ type: 'TOGGLE_WEAPON_LOCK', weaponId: equippedWeapon.id });
          }} />
        </div>
      )}

      {/* Controls bar */}
      <div className="game-card p-2 mb-3 flex items-center justify-between">
        <div className="flex gap-1">
          <button
            onClick={() => {
              const keys: SortKey[] = ['rarity', 'damage', 'level', 'name', 'dps'];
              const idx = keys.indexOf(sortBy);
              setSortBy(keys[(idx + 1) % keys.length]);
            }}
            className="text-[0.45rem] flex items-center gap-0.5 px-2 py-1 rounded bg-muted/50 text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors"
          >
            <ArrowDownUp size={8} /> {sortBy === 'dps' ? 'DPS' : sortBy}
          </button>
          <button
            onClick={() => {
              const frames: (FrameId | 'all')[] = ['all', 'pistol', 'smg', 'shotgun', 'rifle', 'blade', 'lmg', 'launcher'];
              const idx = frames.indexOf(filterFrame);
              setFilterFrame(frames[(idx + 1) % frames.length]);
            }}
            className="text-[0.45rem] flex items-center gap-0.5 px-2 py-1 rounded bg-muted/50 text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors"
          >
            <Filter size={8} /> {filterFrame === 'all' ? 'Alle' : filterFrame}
          </button>
        </div>
        <div className="flex gap-1">
          <GameButton
            variant={fusionMode ? 'gold' : 'muted'}
            size="sm"
            onClick={() => { setFusionMode(!fusionMode); setFusionSelection([]); }}
          >
            <Merge size={10} /> {fusionMode ? 'Stop' : 'Fusie'}
          </GameButton>
          {bulkSellRarity === null ? (
            <GameButton variant="muted" size="sm" onClick={() => setBulkSellRarity('common')}>
              <ShoppingBag size={10} /> Verkoop
            </GameButton>
          ) : (
            <div className="flex gap-1 items-center">
              <span className="text-[0.45rem] text-muted-foreground">t/m:</span>
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
      </div>

      {/* Fusion info */}
      {fusionMode && (
        <div className="game-card p-2.5 mb-3 border border-gold/30 bg-gold/5">
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
        <div className="game-card p-6 text-center">
          <Sword size={24} className="text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground text-xs italic">
            Geen wapens. Vecht om procedurele wapens te verdienen!
          </p>
        </div>
      )}
    </ViewWrapper>
  );
}
