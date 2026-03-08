import { useGame } from '@/contexts/GameContext';
import { useMemo, useState } from 'react';
import { CRAFT_RECIPES, getWeaponScrapValue, getGearScrapValue } from '@/game/salvage';
import { GEAR_RARITY_COLORS, GEAR_RARITY_LABEL, GEAR_RARITY_BG } from '@/game/gearGenerator';
import { WEAPON_RARITY_COLORS, WEAPON_RARITY_LABEL, WEAPON_RARITY_BG } from '@/game/weaponGenerator';
import { WEAPON_FRAME_IMAGES, GEAR_FRAME_IMAGES } from '@/assets/items/arsenal';
import { GameButton } from '@/components/game/ui/GameButton';
import { ViewWrapper } from '@/components/game/ui/ViewWrapper';
import { motion } from 'framer-motion';
import { Hammer, Wrench, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import arsenalBg from '@/assets/arsenal-bg.jpg';

type Tab = 'salvage' | 'craft';

export function SalvageView() {
  const { state, dispatch, showToast } = useGame();
  const [tab, setTab] = useState<Tab>('salvage');
  const [showWeapons, setShowWeapons] = useState(true);
  const [showArmor, setShowArmor] = useState(true);
  const [showGadgets, setShowGadgets] = useState(true);

  const scrap = state.scrapMaterials || 0;

  const salvageableWeapons = useMemo(() =>
    (state.weaponInventory || []).filter(w => !w.equipped && !w.locked),
    [state.weaponInventory]
  );
  const salvageableArmor = useMemo(() =>
    (state.armorInventory || []).filter(g => !g.equipped && !g.locked),
    [state.armorInventory]
  );
  const salvageableGadgets = useMemo(() =>
    (state.gadgetInventory || []).filter(g => !g.equipped && !g.locked),
    [state.gadgetInventory]
  );

  const handleSalvageWeapon = (id: string) => {
    dispatch({ type: 'SALVAGE_WEAPON', weaponId: id });
    showToast('Wapen ontmanteld!');
  };

  const handleSalvageGear = (id: string, gearType: 'armor' | 'gadget') => {
    dispatch({ type: 'SALVAGE_GEAR', gearId: id, gearType });
    showToast('Gear ontmanteld!');
  };

  const handleCraft = (recipeId: string) => {
    dispatch({ type: 'CRAFT_SALVAGE', recipeId });
    showToast('Item gecrafted! Check je arsenaal.');
  };

  return (
    <ViewWrapper bg={arsenalBg}>
      <div className="space-y-4 p-2 sm:p-4 max-w-2xl mx-auto">
        {/* Cinematic header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
            <Hammer size={18} className="text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-foreground tracking-wide uppercase">Salvage & Crafting</h2>
            <p className="text-xs text-muted-foreground">Ontmantel gear voor scrap, craft nieuw equipment</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-bold text-gold">{scrap}</p>
            <p className="text-[0.5rem] text-muted-foreground uppercase">Scrap</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <GameButton variant={tab === 'salvage' ? 'gold' : 'muted'} size="sm" onClick={() => setTab('salvage')}>
            <Hammer size={12} /> Ontmantelen
          </GameButton>
          <GameButton variant={tab === 'craft' ? 'gold' : 'muted'} size="sm" onClick={() => setTab('craft')}>
            <Wrench size={12} /> Crafting
          </GameButton>
        </div>

        {/* Salvage Tab */}
        {tab === 'salvage' && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Scrap waarden: Common=1, Uncommon=3, Rare=8, Epic=20, Legendary=50</p>
            </div>

            {/* Weapons */}
            <div>
              <button onClick={() => setShowWeapons(!showWeapons)} className="flex items-center gap-1 text-xs font-bold text-muted-foreground w-full py-1">
                {showWeapons ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                🗡️ Wapens ({salvageableWeapons.length})
              </button>
              {showWeapons && (
                <div className="grid gap-1.5 mt-1">
                  {salvageableWeapons.length === 0 && <p className="text-xs text-muted-foreground italic">Geen wapens om te ontmantelen</p>}
                  {salvageableWeapons.map(w => (
                    <div key={w.id} className={`flex items-center justify-between rounded px-3 py-2 border ${WEAPON_RARITY_BG[w.rarity]}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={WEAPON_FRAME_IMAGES[w.frame]} alt={w.name} className="w-8 h-8 object-contain rounded shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">{w.name}</p>
                          <span className={`text-[0.5rem] font-bold ${WEAPON_RARITY_COLORS[w.rarity]}`}>{WEAPON_RARITY_LABEL[w.rarity]}</span>
                        </div>
                      </div>
                      <GameButton variant="blood" size="sm" onClick={() => handleSalvageWeapon(w.id)}>
                        +{getWeaponScrapValue(w)} scrap
                      </GameButton>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Armor */}
            <div>
              <button onClick={() => setShowArmor(!showArmor)} className="flex items-center gap-1 text-xs font-bold text-muted-foreground w-full py-1">
                {showArmor ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                🛡️ Pantser ({salvageableArmor.length})
              </button>
              {showArmor && (
                <div className="grid gap-1.5 mt-1">
                  {salvageableArmor.length === 0 && <p className="text-xs text-muted-foreground italic">Geen pantser om te ontmantelen</p>}
                  {salvageableArmor.map(g => (
                    <div key={g.id} className={`flex items-center justify-between rounded px-3 py-2 border ${GEAR_RARITY_BG[g.rarity]}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={GEAR_FRAME_IMAGES[g.frame]} alt={g.name} className="w-8 h-8 object-contain rounded shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">{g.name}</p>
                          <span className={`text-[0.5rem] font-bold ${GEAR_RARITY_COLORS[g.rarity]}`}>{GEAR_RARITY_LABEL[g.rarity]}</span>
                        </div>
                      </div>
                      <GameButton variant="blood" size="sm" onClick={() => handleSalvageGear(g.id, 'armor')}>
                        +{getGearScrapValue(g)} scrap
                      </GameButton>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gadgets */}
            <div>
              <button onClick={() => setShowGadgets(!showGadgets)} className="flex items-center gap-1 text-xs font-bold text-muted-foreground w-full py-1">
                {showGadgets ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                📱 Gadgets ({salvageableGadgets.length})
              </button>
              {showGadgets && (
                <div className="grid gap-1.5 mt-1">
                  {salvageableGadgets.length === 0 && <p className="text-xs text-muted-foreground italic">Geen gadgets om te ontmantelen</p>}
                  {salvageableGadgets.map(g => (
                    <div key={g.id} className={`flex items-center justify-between rounded px-3 py-2 border ${GEAR_RARITY_BG[g.rarity]}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={GEAR_FRAME_IMAGES[g.frame]} alt={g.name} className="w-8 h-8 object-contain rounded shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">{g.name}</p>
                          <span className={`text-[0.5rem] font-bold ${GEAR_RARITY_COLORS[g.rarity]}`}>{GEAR_RARITY_LABEL[g.rarity]}</span>
                        </div>
                      </div>
                      <GameButton variant="blood" size="sm" onClick={() => handleSalvageGear(g.id, 'gadget')}>
                        +{getGearScrapValue(g)} scrap
                      </GameButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Craft Tab */}
        {tab === 'craft' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Gebruik scrap om nieuw equipment te fabriceren.</p>
            <div className="grid gap-2">
              {CRAFT_RECIPES.map(recipe => {
                const canAfford = scrap >= recipe.scrapCost;
                return (
                  <motion.div
                    key={recipe.id}
                    whileHover={{ scale: 1.01 }}
                    className={`border rounded-lg p-3 ${canAfford ? 'border-gold/20 bg-gold/5' : 'border-border bg-muted/10 opacity-60'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{recipe.icon}</span>
                          <span className="font-bold text-sm text-foreground">{recipe.name}</span>
                        </div>
                        <p className="text-[0.6rem] text-muted-foreground mt-0.5">{recipe.description}</p>
                      </div>
                      <GameButton size="sm" variant="gold" disabled={!canAfford} onClick={() => handleCraft(recipe.id)}>
                        <Sparkles size={12} /> {recipe.scrapCost} scrap
                      </GameButton>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ViewWrapper>
  );
}
