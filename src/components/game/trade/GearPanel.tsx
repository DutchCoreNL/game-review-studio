import { useGame } from '@/contexts/GameContext';
import { GEAR, FAMILIES, AMMO_PACKS } from '@/game/constants';
import { GearSlot } from '@/game/types';
import { getDailyDeal } from '@/game/engine';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { StatBar } from '../ui/StatBar';
import { motion } from 'framer-motion';
import { ShieldCheck, Swords, Shield, Cpu, Zap, Lock, Sparkles, Crosshair } from 'lucide-react';
import { useState } from 'react';
import { GEAR_IMAGES } from '@/assets/items';

type GearFilter = 'all' | 'weapon' | 'armor' | 'gadget';

const FILTER_LABELS: Record<GearFilter, { label: string; icon: React.ReactNode }> = {
  all: { label: 'ALLES', icon: <ShieldCheck size={11} /> },
  weapon: { label: 'WAPENS', icon: <Swords size={11} /> },
  armor: { label: 'ARMOR', icon: <Shield size={11} /> },
  gadget: { label: 'GADGETS', icon: <Cpu size={11} /> },
};

const SLOT_ICONS: Record<string, React.ReactNode> = {
  weapon: <Swords size={14} />,
  armor: <Shield size={14} />,
  gadget: <Cpu size={14} />,
};

const STAT_COLORS: Record<string, 'blood' | 'gold' | 'emerald' | 'ice' | 'purple'> = {
  muscle: 'blood',
  brains: 'ice',
  charm: 'gold',
};

const STAT_LABELS: Record<string, string> = {
  muscle: 'Kracht',
  brains: 'Vernuft',
  charm: 'Charisma',
};

export function GearPanel() {
  const { state, dispatch, showToast } = useGame();
  const [filter, setFilter] = useState<GearFilter>('all');
  const dailyDeal = getDailyDeal(state);

  const filteredGear = GEAR.filter(g => filter === 'all' || g.type === filter);

  const getEquippedStat = (slot: GearSlot, statKey: string): number => {
    const equippedId = state.player.loadout[slot];
    if (!equippedId) return 0;
    const item = GEAR.find(g => g.id === equippedId);
    return item?.stats[statKey as keyof typeof item.stats] || 0;
  };

  return (
    <div>
      {/* Ammo Purchase Section */}
      <SectionHeader title="Munitie" icon={<Crosshair size={12} />} />
      <div className="flex gap-2 mb-4">
        {AMMO_PACKS.map(pack => (
          <motion.button
            key={pack.id}
            onClick={() => {
              if (state.money >= pack.cost && (state.ammo || 0) < 99) {
                dispatch({ type: 'BUY_AMMO', packId: pack.id });
                showToast(`+${pack.amount} kogels gekocht!`);
              } else if ((state.ammo || 0) >= 99) {
                showToast('Munitie is vol (max 99)', true);
              } else {
                showToast('Niet genoeg geld', true);
              }
            }}
            disabled={state.money < pack.cost || (state.ammo || 0) >= 99}
            className={`flex-1 game-card p-2.5 text-center transition-all ${
              state.money >= pack.cost && (state.ammo || 0) < 99
                ? 'border-gold/30 hover:border-gold cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-lg mb-0.5">{pack.icon}</div>
            <div className="text-[0.55rem] font-bold text-foreground">{pack.name}</div>
            <div className="text-[0.5rem] text-gold font-bold">€{pack.cost.toLocaleString()}</div>
          </motion.button>
        ))}
      </div>
      <div className="text-[0.5rem] text-muted-foreground text-center mb-4">
        🔫 Munitie: <span className={(state.ammo || 0) <= 3 ? 'text-blood font-bold' : 'text-foreground font-bold'}>{state.ammo || 0}/99</span>
        {' '}— Nodig voor gevechten en huurmoorden
      </div>

      <SectionHeader title="Zwarte Markt" icon={<ShieldCheck size={12} />} />

      {/* Daily Deal */}
      {dailyDeal && (
        <motion.div
          className="game-card p-3 mb-4 border-l-[3px] border-l-gold bg-gradient-to-r from-gold/5 to-transparent"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={12} className="text-gold" />
            <span className="text-[0.6rem] font-bold text-gold uppercase tracking-wider">Deal van de Dag</span>
            <GameBadge variant="gold" size="xs">-{Math.floor(dailyDeal.discount * 100)}%</GameBadge>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-gold/10 flex items-center justify-center flex-shrink-0">
              {SLOT_ICONS[dailyDeal.item.type]}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-xs">{dailyDeal.item.name}</h4>
              <p className="text-[0.5rem] text-muted-foreground">{dailyDeal.item.desc}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[0.55rem] text-muted-foreground line-through">€{dailyDeal.item.cost.toLocaleString()}</span>
                <span className="text-xs font-bold text-gold">€{dailyDeal.discountedPrice.toLocaleString()}</span>
              </div>
            </div>
            <GameButton
              variant="gold"
              size="sm"
              glow
              disabled={state.ownedGear.includes(dailyDeal.item.id) || state.money < dailyDeal.discountedPrice}
              onClick={() => {
                dispatch({ type: 'BUY_GEAR_DEAL', id: dailyDeal.item.id, price: dailyDeal.discountedPrice });
                showToast(`${dailyDeal.item.name} gekocht met korting!`);
              }}
            >
              {state.ownedGear.includes(dailyDeal.item.id) ? 'BEZIT' : 'KOOP'}
            </GameButton>
          </div>
        </motion.div>
      )}

      {/* Category Filters */}
      <div className="flex gap-1 mb-4">
        {(Object.keys(FILTER_LABELS) as GearFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 rounded text-[0.5rem] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
              filter === f ? 'bg-gold/15 border border-gold text-gold' : 'bg-muted text-muted-foreground border border-border'
            }`}
          >
            {FILTER_LABELS[f].icon} {FILTER_LABELS[f].label}
          </button>
        ))}
      </div>

      {/* Gear List */}
      <div className="space-y-2.5">
        {filteredGear.map(item => {
          const owned = state.ownedGear.includes(item.id);
          const isDeal = dailyDeal?.item.id === item.id;
          const price = isDeal ? dailyDeal.discountedPrice : (state.heat > 50 ? Math.floor(item.cost * 1.2) : item.cost);
          const canBuy = !owned && state.money >= price;
          const reqMet = !item.reqRep || (state.familyRel[item.reqRep.f] || 0) >= item.reqRep.val;
          const isEquipped = Object.values(state.player.loadout).includes(item.id);

          return (
            <motion.div
              key={item.id}
              className={`game-card p-3 ${owned ? 'border-l-[3px] border-l-emerald' : !reqMet ? 'opacity-60' : ''}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: !reqMet ? 0.6 : 1, y: 0 }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded overflow-hidden flex items-center justify-center flex-shrink-0 ${
                  !GEAR_IMAGES[item.id] ? (owned ? 'bg-emerald/10' : 'bg-muted') : ''
                }`}>
                  {GEAR_IMAGES[item.id] ? (
                    <img src={GEAR_IMAGES[item.id]} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    !reqMet ? <Lock size={14} className="text-muted-foreground" /> : SLOT_ICONS[item.type]
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h4 className="font-bold text-xs">{item.name}</h4>
                    <GameBadge variant={owned ? 'emerald' : 'muted'} size="xs">
                      {item.type === 'weapon' ? 'WAPEN' : item.type === 'armor' ? 'ARMOR' : 'GADGET'}
                    </GameBadge>
                    {isEquipped && <GameBadge variant="gold" size="xs">ACTIEF</GameBadge>}
                    {isDeal && !owned && <GameBadge variant="gold" size="xs">DEAL</GameBadge>}
                  </div>
                  <p className="text-[0.5rem] text-muted-foreground mb-1.5">{item.desc}</p>

                  {/* Stat Bars */}
                  <div className="space-y-1">
                    {Object.entries(item.stats).map(([stat, val]) => {
                      const currentEquipped = getEquippedStat(item.type, stat);
                      const diff = (val || 0) - currentEquipped;
                      return (
                        <div key={stat} className="flex items-center gap-1.5">
                          <span className="text-[0.45rem] text-muted-foreground w-12 uppercase">{STAT_LABELS[stat] || stat}</span>
                          <div className="flex-1">
                            <StatBar value={val || 0} max={10} color={STAT_COLORS[stat] || 'gold'} height="xs" />
                          </div>
                          <span className="text-[0.5rem] font-bold w-6 text-right">+{val}</span>
                          {!owned && currentEquipped > 0 && (
                            <span className={`text-[0.45rem] font-bold ${diff > 0 ? 'text-emerald' : diff < 0 ? 'text-blood' : 'text-muted-foreground'}`}>
                              ({diff > 0 ? '+' : ''}{diff})
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Requirement */}
                  {item.reqRep && !reqMet && (
                    <div className="flex items-center gap-1 mt-1.5 text-[0.45rem] text-blood">
                      <Lock size={8} />
                      <span>Vereist: {FAMILIES[item.reqRep.f]?.name} relatie {item.reqRep.val}+</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end">
                  <GameButton
                    variant={owned ? 'muted' : 'gold'}
                    size="sm"
                    disabled={owned || !canBuy || !reqMet}
                    onClick={() => {
                      if (isDeal) {
                        dispatch({ type: 'BUY_GEAR_DEAL', id: item.id, price: dailyDeal!.discountedPrice });
                      } else {
                        dispatch({ type: 'BUY_GEAR', id: item.id });
                      }
                      showToast(`${item.name} gekocht!`);
                    }}
                  >
                    {owned ? 'BEZIT' : `€${price.toLocaleString()}`}
                  </GameButton>
                  {isDeal && !owned && (
                    <span className="text-[0.4rem] text-muted-foreground line-through mt-0.5">€{item.cost.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-[0.5rem] text-muted-foreground text-center mt-4">
        Equip gear via je Profiel tab.
      </p>
    </div>
  );
}
