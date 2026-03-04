import { useState, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { GeneratedGear, GEAR_RARITY_LABEL, MAX_GEAR_INVENTORY, GearRarity, GearFrameId, GearType, ARMOR_FRAMES, GADGET_FRAMES } from '@/game/gearGenerator';
import { canFuseGear } from '@/game/gearUpgrade';
import { GearCard } from './GearCard';
import { GearCompare } from './GearCompare';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { ViewWrapper } from '../ui/ViewWrapper';
import { GameBadge } from '../ui/GameBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Smartphone, Filter, ArrowDownUp, Trash2, Merge, ShoppingBag } from 'lucide-react';
import profileBg from '@/assets/profile-bg.jpg';

type SortKey = 'defense' | 'rarity' | 'level' | 'name' | 'brains';

const RARITY_ORDER: Record<GearRarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };

interface GearInventoryProps {
  gearType: GearType;
}

export function GearInventory({ gearType }: GearInventoryProps) {
  const { state, dispatch, showToast } = useGame();
  const [selectedGear, setSelectedGear] = useState<GeneratedGear | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('rarity');
  const [filterFrame, setFilterFrame] = useState<GearFrameId | 'all'>('all');
  const [fusionMode, setFusionMode] = useState(false);
  const [fusionSelection, setFusionSelection] = useState<string[]>([]);
  const [bulkSellRarity, setBulkSellRarity] = useState<GearRarity | null>(null);

  const isArmor = gearType === 'armor';
  const gears: GeneratedGear[] = isArmor ? (state.armorInventory || []) : (state.gadgetInventory || []);
  const equippedGear = gears.find(g => g.equipped);
  const frames = isArmor ? ARMOR_FRAMES : GADGET_FRAMES;
  const title = isArmor ? 'Pantser Arsenaal' : 'Gadget Arsenaal';
  const icon = isArmor ? <Shield size={12} /> : <Smartphone size={12} />;

  const sortedGears = useMemo(() => {
    let filtered = filterFrame === 'all' ? [...gears] : gears.filter(g => g.frame === filterFrame);
    switch (sortBy) {
      case 'defense': return filtered.sort((a, b) => b.defense - a.defense);
      case 'brains': return filtered.sort((a, b) => b.brains - a.brains);
      case 'rarity': return filtered.sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]);
      case 'level': return filtered.sort((a, b) => b.level - a.level);
      case 'name': return filtered.sort((a, b) => a.name.localeCompare(b.name));
      default: return filtered;
    }
  }, [gears, sortBy, filterFrame]);

  const handleFusionToggle = (gearId: string) => {
    if (fusionSelection.includes(gearId)) {
      setFusionSelection(fusionSelection.filter(id => id !== gearId));
    } else if (fusionSelection.length < 3) {
      setFusionSelection([...fusionSelection, gearId]);
    }
  };

  const fusionGears = fusionSelection.map(id => gears.find(g => g.id === id)).filter(Boolean) as GeneratedGear[];
  const fusionCheck = fusionGears.length === 3 ? canFuseGear(fusionGears, state.money) : null;

  const executeFusion = () => {
    if (fusionCheck?.canFuse && fusionSelection.length === 3) {
      dispatch({ type: 'FUSE_GEAR', gearIds: fusionSelection as [string, string, string], gearType });
      showToast(`Fusie geslaagd! Nieuw ${fusionCheck.targetRarity} gear verkregen!`);
      setFusionSelection([]);
      setFusionMode(false);
    }
  };

  const handleBulkSell = (maxRarity: GearRarity) => {
    const toSell = gears.filter(g => !g.equipped && !g.locked && RARITY_ORDER[g.rarity] <= RARITY_ORDER[maxRarity]);
    if (toSell.length === 0) { showToast('Geen gear om te verkopen'); return; }
    const totalValue = toSell.reduce((s, g) => s + g.sellValue, 0);
    dispatch({ type: 'BULK_SELL_GEAR', maxRarity, gearType });
    showToast(`${toSell.length} gear verkocht voor €${totalValue.toLocaleString()}`);
    setBulkSellRarity(null);
  };

  if (selectedGear) {
    return (
      <ViewWrapper bg={profileBg}>
        <GearCompare
          gear={selectedGear}
          currentGear={equippedGear || null}
          gearType={gearType}
          onEquip={() => {
            dispatch({ type: 'EQUIP_GEAR', gearId: selectedGear.id, gearType });
            showToast(`${selectedGear.name} uitgerust!`);
            setSelectedGear(null);
          }}
          onSell={() => {
            if (selectedGear.locked) { showToast('Dit item is gelocked!'); return; }
            dispatch({ type: 'SELL_GEAR', gearId: selectedGear.id, gearType });
            showToast(`${selectedGear.name} verkocht voor €${selectedGear.sellValue.toLocaleString()}`);
            setSelectedGear(null);
          }}
          onUpgrade={() => {
            dispatch({ type: 'UPGRADE_GEAR', gearId: selectedGear.id, gearType });
            showToast(`${selectedGear.name} geüpgraded!`);
            const updated = gears.find(g => g.id === selectedGear.id);
            if (updated) setSelectedGear(updated);
          }}
          onBack={() => setSelectedGear(null)}
        />
      </ViewWrapper>
    );
  }

  return (
    <ViewWrapper bg={profileBg}>
      <SectionHeader title={title} icon={icon} />

      {equippedGear && (
        <div className="mb-3">
          <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground font-bold mb-1">
            Huidig {isArmor ? 'pantser' : 'gadget'}
          </div>
          <GearCard gear={equippedGear} onToggleLock={() => dispatch({ type: 'TOGGLE_GEAR_LOCK', gearId: equippedGear.id, gearType })} />
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.5rem] text-muted-foreground">{gears.length}/{MAX_GEAR_INVENTORY}</span>
        <div className="flex gap-1">
          <button
            onClick={() => {
              const keys: SortKey[] = ['rarity', 'defense', 'brains', 'level', 'name'];
              setSortBy(keys[(keys.indexOf(sortBy) + 1) % keys.length]);
            }}
            className="text-[0.45rem] flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowDownUp size={8} /> {sortBy}
          </button>
          <button
            onClick={() => {
              const allFrames: (GearFrameId | 'all')[] = ['all', ...frames.map(f => f.id)];
              setFilterFrame(allFrames[(allFrames.indexOf(filterFrame) + 1) % allFrames.length]);
            }}
            className="text-[0.45rem] flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Filter size={8} /> {filterFrame === 'all' ? 'Alle' : filterFrame}
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 mb-3">
        <GameButton variant={fusionMode ? 'gold' : 'muted'} size="sm" onClick={() => { setFusionMode(!fusionMode); setFusionSelection([]); }}>
          <Merge size={10} /> {fusionMode ? 'Stop Fusie' : 'Fusie'}
        </GameButton>
        {bulkSellRarity === null ? (
          <GameButton variant="muted" size="sm" onClick={() => setBulkSellRarity('common')}>
            <ShoppingBag size={10} /> Bulk Verkoop
          </GameButton>
        ) : (
          <div className="flex gap-1 items-center">
            <span className="text-[0.45rem] text-muted-foreground">Verkoop t/m:</span>
            {(['common', 'uncommon', 'rare'] as GearRarity[]).map(r => (
              <button key={r} onClick={() => handleBulkSell(r)} className="text-[0.45rem] px-1.5 py-0.5 rounded bg-muted hover:bg-blood/20 hover:text-blood transition-colors">
                {GEAR_RARITY_LABEL[r]}
              </button>
            ))}
            <button onClick={() => setBulkSellRarity(null)} className="text-[0.45rem] text-muted-foreground hover:text-foreground">✕</button>
          </div>
        )}
      </div>

      {fusionMode && (
        <div className="game-card p-2 mb-3 border border-gold/30 bg-gold/5">
          <p className="text-[0.5rem] text-gold font-semibold mb-1">🔥 Fusie Modus — Selecteer 3 items van dezelfde rarity</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[0.45rem] text-muted-foreground">Geselecteerd: {fusionSelection.length}/3</span>
            {fusionCheck && (fusionCheck.canFuse ? (
              <GameButton variant="gold" size="sm" onClick={executeFusion}>FUSEER (€{fusionCheck.cost.toLocaleString()})</GameButton>
            ) : (
              <span className="text-[0.45rem] text-blood">{fusionCheck.reason}</span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence>
          {sortedGears.map(gear => (
            <motion.div key={gear.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} layout>
              <GearCard
                gear={gear}
                compact
                highlight={gear.equipped || fusionSelection.includes(gear.id)}
                onClick={() => fusionMode ? handleFusionToggle(gear.id) : setSelectedGear(gear)}
                onToggleLock={() => dispatch({ type: 'TOGGLE_GEAR_LOCK', gearId: gear.id, gearType })}
                actions={!fusionMode ? (
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!gear.equipped && (
                      <GameButton variant="gold" size="sm" onClick={() => { dispatch({ type: 'EQUIP_GEAR', gearId: gear.id, gearType }); showToast(`${gear.name} uitgerust!`); }}>
                        DRAAG
                      </GameButton>
                    )}
                    {!gear.locked && !gear.equipped && (
                      <GameButton variant="muted" size="sm" onClick={() => { dispatch({ type: 'SELL_GEAR', gearId: gear.id, gearType }); showToast(`Verkocht voor €${gear.sellValue.toLocaleString()}`); }}>
                        <Trash2 size={10} />
                      </GameButton>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center shrink-0">
                    {fusionSelection.includes(gear.id) && <GameBadge variant="gold" size="xs">✓</GameBadge>}
                  </div>
                )}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {gears.length === 0 && (
        <p className="text-muted-foreground text-xs italic py-6 text-center">
          Geen {isArmor ? 'pantser' : 'gadgets'}. Vecht om procedurele gear te verdienen!
        </p>
      )}
    </ViewWrapper>
  );
}
