import { useGame } from '@/contexts/GameContext';
import { useState, useMemo } from 'react';
import { generateBlackMarketStock, shouldRefreshStock, getBlackMarketItemName, getBlackMarketItemRarity, type BlackMarketItem } from '@/game/blackMarket';
import { CRATE_DEFS, type CrateTier } from '@/game/lootCrates';
import { GEAR_RARITY_COLORS, GEAR_RARITY_LABEL, GEAR_RARITY_BG } from '@/game/gearGenerator';
import { GameButton } from '@/components/game/ui/GameButton';
import { ViewWrapper } from '@/components/game/ui/ViewWrapper';
import { WEAPON_FRAME_IMAGES, GEAR_FRAME_IMAGES } from '@/assets/items/arsenal';
import { motion } from 'framer-motion';
import { ShoppingBag, Package, Sparkles, DollarSign, Banknote } from 'lucide-react';
import arsenalBg from '@/assets/arsenal-bg.jpg';

type Tab = 'shop' | 'crates';

export function BlackMarketView() {
  const { state, dispatch, showToast } = useGame();
  const [tab, setTab] = useState<Tab>('shop');

  const stock = useMemo(() => {
    if (!state.blackMarketStock || shouldRefreshStock(state.blackMarketStock, state.day)) {
      return null;
    }
    return state.blackMarketStock;
  }, [state.blackMarketStock, state.day]);

  const handleRefresh = () => dispatch({ type: 'REFRESH_BLACK_MARKET' });

  const handleBuy = (itemId: string, useDirty: boolean) => {
    dispatch({ type: 'BUY_BLACK_MARKET_ITEM', itemId, useDirtyMoney: useDirty });
    showToast('Item gekocht! Check je arsenaal.');
  };

  const handleOpenCrate = (tier: CrateTier) => {
    const def = CRATE_DEFS.find(c => c.id === tier)!;
    if (state.money < def.price) { showToast('Niet genoeg geld!', true); return; }
    dispatch({ type: 'OPEN_LOOT_CRATE', tier });
    showToast(`${def.name} geopend! Check je arsenaal.`);
  };

  return (
    <ViewWrapper bg={arsenalBg}>
      <div className="space-y-4 p-2 sm:p-4 max-w-2xl mx-auto">
        {/* Cinematic header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
            <ShoppingBag size={18} className="text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-foreground tracking-wide uppercase">Zwarte Markt</h2>
            <p className="text-xs text-muted-foreground">Roulerende voorraad & Loot Kisten</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <GameButton variant={tab === 'shop' ? 'gold' : 'muted'} size="sm" onClick={() => setTab('shop')}>
            <ShoppingBag size={12} /> Voorraad
          </GameButton>
          <GameButton variant={tab === 'crates' ? 'gold' : 'muted'} size="sm" onClick={() => setTab('crates')}>
            <Package size={12} /> Kisten
          </GameButton>
        </div>

        {/* Shop Tab */}
        {tab === 'shop' && (
          <div className="space-y-3">
            {!stock ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-muted-foreground text-sm">De dealer heeft nieuwe voorraad...</p>
                <GameButton variant="gold" onClick={handleRefresh}>
                  <Sparkles size={14} /> Bekijk Voorraad
                </GameButton>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Ververst op dag {stock.nextRefreshDay}</span>
                  <span>Pity: {state.pityCounter || 0}/10</span>
                </div>
                <div className="grid gap-2">
                  {stock.items.map((item) => {
                    const rarity = getBlackMarketItemRarity(item);
                    const name = getBlackMarketItemName(item);
                    const itemImg = item.weapon ? WEAPON_FRAME_IMAGES[item.weapon.frame] : item.gear ? GEAR_FRAME_IMAGES[item.gear.frame] : undefined;
                    const bgClass = GEAR_RARITY_BG[rarity as keyof typeof GEAR_RARITY_BG] || 'bg-muted/20 border-border';
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border rounded-lg p-3 ${bgClass} ${item.isFeatured ? 'ring-1 ring-gold/40' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {itemImg && <img src={itemImg} alt={name} className="w-8 h-8 object-contain rounded" />}
                              {item.isFeatured && <span className="text-[0.5rem] bg-gold/20 text-gold px-1.5 py-0.5 rounded font-bold">⭐ FEATURED</span>}
                              <span className={`text-[0.5rem] uppercase font-bold ${GEAR_RARITY_COLORS[rarity as keyof typeof GEAR_RARITY_COLORS] || 'text-muted-foreground'}`}>
                                {GEAR_RARITY_LABEL[rarity as keyof typeof GEAR_RARITY_LABEL] || rarity}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                            {item.weapon && (
                              <p className="text-[0.6rem] text-muted-foreground">DMG {item.weapon.damage} | ACC {item.weapon.accuracy} | Crit {item.weapon.critChance}%</p>
                            )}
                            {item.gear && (
                              <p className="text-[0.6rem] text-muted-foreground">DEF {item.gear.defense} | BRN {item.gear.brains} | CRM {item.gear.charm}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 items-end shrink-0">
                            {item.sold ? (
                              <span className="text-xs text-muted-foreground">Verkocht</span>
                            ) : (
                              <>
                                <GameButton size="sm" variant="gold" onClick={() => handleBuy(item.id, false)} disabled={state.money < item.price}>
                                  <DollarSign size={12} /> €{item.price.toLocaleString()}
                                </GameButton>
                                {state.dirtyMoney >= item.dirtyPrice && (
                                  <GameButton size="sm" variant="ghost" className="text-[0.6rem]" onClick={() => handleBuy(item.id, true)}>
                                    <Banknote size={12} /> €{item.dirtyPrice.toLocaleString()} dirty
                                  </GameButton>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Crates Tab */}
        {tab === 'crates' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Pity systeem: {state.pityCounter || 0}/10 kisten zonder epic — {(state.pityCounter || 0) >= 9 ? '⚡ Volgende is gegarandeerd Epic!' : `nog ${10 - (state.pityCounter || 0)}`}
            </p>
            <div className="grid gap-3">
              {CRATE_DEFS.map(crate => (
                <motion.div
                  key={crate.id}
                  whileHover={{ scale: 1.01 }}
                  className={`border rounded-lg p-4 ${crate.id === 'gold' ? 'border-gold/30 bg-gold/5' : crate.id === 'silver' ? 'border-slate-400/30 bg-slate-400/5' : 'border-amber-600/30 bg-amber-600/5'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{crate.icon}</span>
                        <span className={`font-bold ${crate.color}`}>{crate.name}</span>
                      </div>
                      <p className="text-[0.6rem] text-muted-foreground mt-1">
                        Pool: {crate.rarityPool.map(r => GEAR_RARITY_LABEL[r as keyof typeof GEAR_RARITY_LABEL] || r).join(', ')}
                      </p>
                    </div>
                    <GameButton size="sm" variant="gold" onClick={() => handleOpenCrate(crate.id)} disabled={state.money < crate.price}>
                      €{crate.price.toLocaleString()}
                    </GameButton>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-[0.6rem] text-muted-foreground text-center">
              Totaal geopend: {state.lootCratesPurchased || 0} kisten
            </p>
          </div>
        )}
      </div>
    </ViewWrapper>
  );
}
