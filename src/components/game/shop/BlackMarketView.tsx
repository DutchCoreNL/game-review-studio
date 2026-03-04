import { useGame } from '@/contexts/GameContext';
import { useState, useMemo } from 'react';
import { generateBlackMarketStock, shouldRefreshStock, getBlackMarketItemName, getBlackMarketItemRarity, type BlackMarketItem } from '@/game/blackMarket';
import { CRATE_DEFS, type CrateTier } from '@/game/lootCrates';
import { GEAR_RARITY_COLORS, GEAR_RARITY_LABEL, GEAR_RARITY_BG } from '@/game/gearGenerator';
import { Button } from '@/components/ui/button';
import { WEAPON_FRAME_IMAGES, GEAR_FRAME_IMAGES } from '@/assets/items/arsenal';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Package, Sparkles, DollarSign, Banknote } from 'lucide-react';

type Tab = 'shop' | 'crates';

export function BlackMarketView() {
  const { state, dispatch, showToast } = useGame();
  const [tab, setTab] = useState<Tab>('shop');
  const [lastCrateResult, setLastCrateResult] = useState<string | null>(null);

  // Auto-refresh stock if needed
  const stock = useMemo(() => {
    if (!state.blackMarketStock || shouldRefreshStock(state.blackMarketStock, state.day)) {
      return null; // needs refresh
    }
    return state.blackMarketStock;
  }, [state.blackMarketStock, state.day]);

  const handleRefresh = () => {
    dispatch({ type: 'REFRESH_BLACK_MARKET' });
  };

  const handleBuy = (itemId: string, useDirty: boolean) => {
    dispatch({ type: 'BUY_BLACK_MARKET_ITEM', itemId, useDirtyMoney: useDirty });
    showToast('Item gekocht! Check je arsenaal.');
  };

  const handleOpenCrate = (tier: CrateTier) => {
    const def = CRATE_DEFS.find(c => c.id === tier)!;
    if (state.money < def.price) {
      showToast('Niet genoeg geld!', true);
      return;
    }
    dispatch({ type: 'OPEN_LOOT_CRATE', tier });
    showToast(`${def.name} geopend! Check je arsenaal.`);
  };

  const rarityColor = (r: string) => {
    const colors: Record<string, string> = {
      common: 'text-muted-foreground', uncommon: 'text-emerald', rare: 'text-ice',
      epic: 'text-game-purple', legendary: 'text-gold',
    };
    return colors[r] || 'text-muted-foreground';
  };

  const rarityLabel = (r: string) => {
    const labels: Record<string, string> = {
      common: 'Gewoon', uncommon: 'Ongewoon', rare: 'Zeldzaam',
      epic: 'Episch', legendary: 'Legendarisch',
    };
    return labels[r] || r;
  };

  const rarityBg = (r: string) => {
    const bgs: Record<string, string> = {
      common: 'border-border bg-muted/20', uncommon: 'border-emerald/30 bg-emerald/5',
      rare: 'border-ice/30 bg-ice/5', epic: 'border-game-purple/30 bg-game-purple/5',
      legendary: 'border-gold/30 bg-gold/5',
    };
    return bgs[r] || 'border-border';
  };

  return (
    <div className="space-y-4 p-2 sm:p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">🏴‍☠️</span>
        <div>
          <h2 className="text-lg font-display font-bold text-foreground tracking-wide">ZWARTE MARKT</h2>
          <p className="text-xs text-muted-foreground">Roulerende voorraad & Loot Kisten</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button variant={tab === 'shop' ? 'default' : 'outline'} size="sm" onClick={() => setTab('shop')}>
          <ShoppingBag size={14} /> Voorraad
        </Button>
        <Button variant={tab === 'crates' ? 'default' : 'outline'} size="sm" onClick={() => setTab('crates')}>
          <Package size={14} /> Kisten
        </Button>
      </div>

      {/* Shop Tab */}
      {tab === 'shop' && (
        <div className="space-y-3">
          {!stock ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-muted-foreground text-sm">De dealer heeft nieuwe voorraad...</p>
              <Button onClick={handleRefresh}>
                <Sparkles size={14} /> Bekijk Voorraad
              </Button>
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
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-lg p-3 ${rarityBg(rarity)} ${item.isFeatured ? 'ring-1 ring-gold/40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {itemImg && <img src={itemImg} alt={name} className="w-8 h-8 object-contain rounded" />}
                            {item.isFeatured && <span className="text-[0.5rem] bg-gold/20 text-gold px-1.5 py-0.5 rounded font-bold">⭐ FEATURED</span>}
                            <span className={`text-[0.5rem] uppercase font-bold ${rarityColor(rarity)}`}>{rarityLabel(rarity)}</span>
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
                              <Button size="sm" variant="outline" onClick={() => handleBuy(item.id, false)} disabled={state.money < item.price}>
                                <DollarSign size={12} /> €{item.price.toLocaleString()}
                              </Button>
                              {state.dirtyMoney >= item.dirtyPrice && (
                                <Button size="sm" variant="ghost" className="text-[0.6rem] text-muted-foreground" onClick={() => handleBuy(item.id, true)}>
                                  <Banknote size={12} /> €{item.dirtyPrice.toLocaleString()} dirty
                                </Button>
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
                      Pool: {crate.rarityPool.map(r => rarityLabel(r)).join(', ')}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleOpenCrate(crate.id)} disabled={state.money < crate.price}>
                    €{crate.price.toLocaleString()}
                  </Button>
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
  );
}
