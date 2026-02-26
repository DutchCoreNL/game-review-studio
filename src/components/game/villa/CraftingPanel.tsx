import { useGame } from '@/contexts/GameContext';
import { CRAFT_RECIPES, canCraft, type CraftRecipe } from '@/game/crafting';
import { GOODS } from '@/game/constants';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Flame, ChevronDown, ChevronUp, TrendingUp, Clock } from 'lucide-react';

export function CraftingPanel() {
  const { state, dispatch, showToast } = useGame();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const villa = state.villa;
  if (!villa) return null;

  const availableRecipes = CRAFT_RECIPES.filter(r =>
    villa.level >= r.reqVillaLevel && villa.modules.includes(r.reqModule)
  );

  const lockedRecipes = CRAFT_RECIPES.filter(r =>
    villa.level < r.reqVillaLevel || !villa.modules.includes(r.reqModule)
  );

  const getGoodName = (id: string) => GOODS.find(g => g.id === id)?.name || id;

  function handleCraft(recipe: CraftRecipe) {
    const check = canCraft(state, recipe);
    if (!check.ok) {
      showToast(check.reason || 'Kan niet craften', true);
      return;
    }
    dispatch({ type: 'CRAFT_ITEM', recipeId: recipe.id });
    showToast(`${recipe.icon} ${recipe.name} gecraft! +${recipe.output.amount} ${getGoodName(recipe.output.goodId)}`);
  }

  return (
    <div className="space-y-3">
      <SectionHeader title="Crafting Lab" icon={<FlaskConical size={12} />} badge={`${availableRecipes.length} recepten`} />

      {availableRecipes.length === 0 && (
        <div className="game-card p-4 text-center">
          <p className="text-xs text-muted-foreground italic">
            Installeer productie-modules (Synthetica Lab, Coke Lab, Wietplantage) om recepten vrij te spelen.
          </p>
        </div>
      )}

      {/* Available recipes */}
      <div className="space-y-2">
        {availableRecipes.map(recipe => {
          const check = canCraft(state, recipe);
          const isExpanded = expandedId === recipe.id;
          const outputGood = GOODS.find(g => g.id === recipe.output.goodId);
          const baseValue = (outputGood?.base || 500) * recipe.sellMultiplier;

          return (
            <motion.div
              key={recipe.id}
              layout
              className="game-card overflow-hidden"
            >
              {/* Header */}
              <button
                className="w-full p-3 flex items-center justify-between text-left"
                onClick={() => setExpandedId(isExpanded ? null : recipe.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{recipe.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-foreground">{recipe.name}</p>
                    <p className="text-[0.55rem] text-muted-foreground">{recipe.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[0.55rem] font-bold text-gold">{recipe.sellMultiplier}×</span>
                  {isExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2 border-t border-border/30 pt-2">
                      {/* Ingredients */}
                      <div>
                        <p className="text-[0.55rem] text-muted-foreground uppercase font-bold mb-1">Ingrediënten</p>
                        <div className="space-y-0.5">
                          {recipe.ingredients.map(ing => {
                            const owned = state.inventory[ing.goodId] || 0;
                            const enough = owned >= ing.amount;
                            return (
                              <div key={ing.goodId} className="flex justify-between text-[0.6rem]">
                                <span className="text-muted-foreground">{getGoodName(ing.goodId)}</span>
                                <span className={enough ? 'text-emerald font-bold' : 'text-blood font-bold'}>
                                  {owned}/{ing.amount} {enough ? '✓' : '✗'}
                                </span>
                              </div>
                            );
                          })}
                          {recipe.chemCost > 0 && (
                            <div className="flex justify-between text-[0.6rem]">
                              <span className="text-muted-foreground">Chemicaliën</span>
                              <span className={state.lab.chemicals >= recipe.chemCost ? 'text-emerald font-bold' : 'text-blood font-bold'}>
                                {state.lab.chemicals}/{recipe.chemCost} {state.lab.chemicals >= recipe.chemCost ? '✓' : '✗'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Output */}
                      <div className="flex items-center justify-between bg-muted/30 rounded px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp size={10} className="text-gold" />
                          <span className="text-[0.6rem] text-muted-foreground">Output</span>
                        </div>
                        <span className="text-[0.6rem] font-bold text-gold">
                          {recipe.output.amount}× {getGoodName(recipe.output.goodId)} (~€{Math.floor(baseValue).toLocaleString()}/st)
                        </span>
                      </div>

                      {/* Heat warning */}
                      <div className="flex items-center gap-1 text-[0.55rem] text-blood/70">
                        <Flame size={10} />
                        <span>+{recipe.heatGain} heat</span>
                      </div>

                      {/* Craft button */}
                      <GameButton
                        variant={check.ok ? 'gold' : 'ghost'}
                        size="sm"
                        fullWidth
                        glow={check.ok}
                        disabled={!check.ok}
                        onClick={() => handleCraft(recipe)}
                      >
                        {check.ok ? `⚗️ CRAFT ${recipe.name.toUpperCase()}` : check.reason}
                      </GameButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Locked recipes */}
      {lockedRecipes.length > 0 && (
        <>
          <SectionHeader title="Vergrendeld" />
          <div className="space-y-1">
            {lockedRecipes.map(recipe => (
              <div key={recipe.id} className="game-card p-2 opacity-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{recipe.icon}</span>
                  <div>
                    <p className="text-[0.6rem] font-bold">{recipe.name}</p>
                    <p className="text-[0.5rem] text-muted-foreground">
                      Vereist: Villa Lvl {recipe.reqVillaLevel} + {recipe.reqModule}
                    </p>
                  </div>
                  <span className="ml-auto text-[0.55rem] font-bold text-gold">{recipe.sellMultiplier}×</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Craft log */}
      {state.craftLog && state.craftLog.length > 0 && (
        <>
          <SectionHeader title="Recent Gecrafted" icon={<Clock size={12} />} />
          <div className="game-card p-2 space-y-1">
            {state.craftLog.slice(0, 10).map(entry => (
              <div key={entry.id} className="flex justify-between text-[0.55rem]">
                <span className="text-muted-foreground">
                  Dag {entry.day} — {entry.recipeName}
                </span>
                <span className="font-bold text-gold">
                  +{entry.outputAmount} {getGoodName(entry.outputGoodId)} (~€{entry.estimatedValue.toLocaleString()})
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
