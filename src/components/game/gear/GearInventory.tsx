import { useState, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { GeneratedGear, GEAR_RARITY_LABEL, MAX_GEAR_INVENTORY, GearRarity, GearFrameId, GearType, ARMOR_FRAMES, GADGET_FRAMES } from '@/game/gearGenerator';
import { canFuseGear } from '@/game/gearUpgrade';
import { GearCard } from './GearCard';
import { GearCompare } from './GearCompare';
import { GameButton } from '../ui/GameButton';
import { ViewWrapper } from '../ui/ViewWrapper';
import { GameBadge } from '../ui/GameBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Smartphone, Filter, ArrowDownUp, Trash2, Merge, ShoppingBag } from 'lucide-react';
import arsenalBg from '@/assets/arsenal-bg.jpg';

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
  const HeaderIcon = isArmor ? Shield : Smartphone;
  const accentColor = isArmor ? 'ice' : 'game-purple';

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
      <ViewWrapper bg={arsenalBg}>
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
    <ViewWrapper bg={arsenalBg}>
      {/* Cinematic header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full bg-${accentColor}/15 border border-${accentColor}/40 flex items-center justify-center`}>
          <HeaderIcon size={18} className={`text-${accentColor}`} />
        </div>
        <div className="flex-1">
          <h2 className={`font-display text-lg text-${accentColor} uppercase tracking-widest font-bold`}>{title}</h2>
          <p className="text-[0.55rem] text-muted-foreground">{gears.length}/{MAX_GEAR_INVENTORY} items • Sorteer op {sortBy}</p>
        </div>
      </div>

      {/* Equipped gear highlight */}
      {equippedGear && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className={`w-1.5 h-1.5 rounded-full bg-${accentColor}`} />
            <span className={`text-[0.5rem] uppercase tracking-wider text-${accentColor}/80 font-bold`}>Uitgerust</span>
          </div>
          <GearCard gear={equippedGear} onToggleLock={() => dispatch({ type: 'TOGGLE_GEAR_LOCK', gearId: equippedGear.id, gearType })} />
        </div>
      )}

      {/* Controls bar */}
      <div className="game-card p-2 mb-3 flex items-center justify-between">
        <div className="flex gap-1">
          <button
            onClick={() => {
              const keys: SortKey[] = ['rarity', 'defense', 'brains', 'level', 'name'];
              setSortBy(keys[(keys.indexOf(sortBy) + 1) % keys.length]);
            }}
            className={`text-[0.45rem] flex items-center gap-0.5 px-2 py-1 rounded bg-muted/50 text-muted-foreground hover:text-${accentColor} hover:bg-${accentColor}/10 transition-colors`}
          >
            <ArrowDownUp size={8} /> {sortBy}
          </button>
          <button
            onClick={() => {
              const allFrames: (GearFrameId | 'all')[] = ['all', ...frames.map(f => f.id)];
              setFilterFrame(allFrames[(allFrames.indexOf(filterFrame) + 1) % allFrames.length]);
            }}
            className={`text-[0.45rem] flex items-center gap-0.5 px-2 py-1 rounded bg-muted/50 text-muted-foreground hover:text-${accentColor} hover:bg-${accentColor}/10 transition-colors`}
          >
            <Filter size={8} /> {filterFrame === 'all' ? 'Alle' : filterFrame}
          </button>
        </div>
        <div className="flex gap-1">
          <GameButton variant={fusionMode ? 'gold' : 'muted'} size="sm" onClick={() => { setFusionMode(!fusionMode); setFusionSelection([]); }}>
            <Merge size={10} /> {fusionMode ? 'Stop' : 'Fusie'}
          </GameButton>
          {bulkSellRarity === null ? (
            <GameButton variant="muted" size="sm" onClick={() => setBulkSellRarity('common')}>
              <ShoppingBag size={10} /> Verkoop
            </GameButton>
          ) : (
            <div className="flex gap-1 items-center">
              <span className="text-[0.45rem] text-muted-foreground">t/m:</span>
              {(['common', 'uncommon', 'rare'] as GearRarity[]).map(r => (
                <button key={r} onClick={() => handleBulkSell(r)} className="text-[0.45rem] px-1.5 py-0.5 rounded bg-muted hover:bg-blood/20 hover:text-blood transition-colors">
                  {GEAR_RARITY_LABEL[r]}
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

      {/* Gear list */}
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
        <div className="game-card p-6 text-center">
          <HeaderIcon size={24} className="text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground text-xs italic">
            Geen {isArmor ? 'pantser' : 'gadgets'}. Vecht om procedurele gear te verdienen!
          </p>
        </div>
      )}
    </ViewWrapper>
  );
}
