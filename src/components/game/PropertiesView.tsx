import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { PROPERTIES, getCurrentProperty, getNextProperty, canAffordProperty, Property } from '@/game/properties';
import { ViewWrapper } from './ui/ViewWrapper';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { StatBar } from './ui/StatBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ArrowUp, Lock, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import propertiesBg from '@/assets/properties-bg.jpg';

export function PropertiesView() {
  const { state, dispatch } = useGame();
  const [toast, setToast] = useState<string | null>(null);

  const currentProp = getCurrentProperty(state.propertyId);
  const nextProp = getNextProperty(state.propertyId || 'kraakpand');

  const handleBuy = (prop: Property) => {
    dispatch({ type: 'BUY_PROPERTY', propertyId: prop.id });
    setToast(`🏠 Verhuisd naar ${prop.name}!`);
  };

  return (
    <ViewWrapper bg={propertiesBg}>
      {/* Cinematic header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
          <Home size={18} className="text-gold" />
        </div>
        <div>
          <h2 className="font-display text-lg text-gold uppercase tracking-widest font-bold">Vastgoed</h2>
          <p className="text-[0.55rem] text-muted-foreground">Upgrade je woning voor betere stats en passief inkomen</p>
        </div>
      </div>

      {/* Current property */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="game-card border-l-[3px] border-l-gold mb-4"
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{currentProp.icon}</span>
          <div>
            <p className="text-[0.45rem] text-muted-foreground uppercase tracking-wider">Huidige woning</p>
            <h2 className="text-lg font-bold text-foreground">{currentProp.name}</h2>
          </div>
          <div className="ml-auto">
            <GameBadge variant="gold" size="xs">Tier {currentProp.tier}</GameBadge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{currentProp.description}</p>
        {Object.keys(currentProp.bonuses).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {currentProp.bonuses.maxEnergy && <BonusTag label={`+${currentProp.bonuses.maxEnergy} Max Energy`} />}
            {currentProp.bonuses.maxHp && <BonusTag label={`+${currentProp.bonuses.maxHp} Max HP`} />}
            {currentProp.bonuses.passiveIncome && <BonusTag label={`€${currentProp.bonuses.passiveIncome}/dag inkomen`} />}
            {currentProp.bonuses.heatReduction && <BonusTag label={`-${currentProp.bonuses.heatReduction}% heat`} />}
            {currentProp.bonuses.storageSlots && <BonusTag label={`+${currentProp.bonuses.storageSlots} opslag`} />}
          </div>
        )}
      </motion.div>

      {/* Property tier progress */}
      <SectionHeader title="Woningen" icon={<Home size={12} />} />
      <div className="space-y-2 mb-6">
        {PROPERTIES.map((prop, i) => {
          const owned = prop.tier <= currentProp.tier;
          const isNext = prop.tier === currentProp.tier + 1;
          const canBuy = isNext && canAffordProperty(prop, state.money, state.player.level, state.rep);

          return (
            <motion.div
              key={prop.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`game-card border-l-[3px] ${
                owned ? 'border-l-emerald' :
                isNext ? 'border-l-gold' :
                'border-l-border opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{prop.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{prop.name}</span>
                    {owned && <CheckCircle2 size={12} className="text-emerald" />}
                    {!owned && !isNext && <Lock size={12} className="text-muted-foreground" />}
                  </div>
                  <div className="flex items-center gap-3 text-[0.6rem] text-muted-foreground mt-0.5">
                    {prop.cost > 0 && <span>€{prop.cost.toLocaleString()}</span>}
                    <span>Lv.{prop.reqLevel}</span>
                    {prop.reqRep > 0 && <span>Rep {prop.reqRep}</span>}
                  </div>
                </div>
                {isNext && canBuy && (
                  <GameButton size="sm" variant="gold" onClick={() => handleBuy(prop)}>
                    <ArrowUp size={14} /> Kopen
                  </GameButton>
                )}
                {isNext && !canBuy && (
                  <span className="text-[0.6rem] text-muted-foreground whitespace-nowrap">Niet beschikbaar</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Next upgrade CTA */}
      {nextProp && (
        <div className="game-card border-l-[3px] border-l-gold">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-gold" />
            <h3 className="text-sm font-bold text-foreground">Volgende: {nextProp.name}</h3>
          </div>
          <div className="space-y-1 text-[0.65rem] text-muted-foreground mb-3">
            <p>Kosten: <span className={state.money >= nextProp.cost ? 'text-emerald' : 'text-blood'}>€{nextProp.cost.toLocaleString()}</span></p>
            <p>Level: <span className={state.player.level >= nextProp.reqLevel ? 'text-emerald' : 'text-blood'}>{nextProp.reqLevel} (huidig: {state.player.level})</span></p>
            <p>Rep: <span className={state.rep >= nextProp.reqRep ? 'text-emerald' : 'text-blood'}>{nextProp.reqRep} (huidig: {state.rep})</span></p>
          </div>
          {nextProp.bonuses && Object.keys(nextProp.bonuses).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {nextProp.bonuses.maxEnergy && <BonusTag label={`+${nextProp.bonuses.maxEnergy} Energy`} />}
              {nextProp.bonuses.maxHp && <BonusTag label={`+${nextProp.bonuses.maxHp} HP`} />}
              {nextProp.bonuses.passiveIncome && <BonusTag label={`€${nextProp.bonuses.passiveIncome}/dag`} />}
              {nextProp.bonuses.heatReduction && <BonusTag label={`-${nextProp.bonuses.heatReduction}% heat`} />}
              {nextProp.bonuses.storageSlots && <BonusTag label={`+${nextProp.bonuses.storageSlots} opslag`} />}
            </div>
          )}
          {canAffordProperty(nextProp, state.money, state.player.level, state.rep) && (
            <GameButton variant="gold" fullWidth onClick={() => handleBuy(nextProp)}>
              <Sparkles size={14} /> Upgrade naar {nextProp.name} — €{nextProp.cost.toLocaleString()}
            </GameButton>
          )}
        </div>
      )}

      {!nextProp && (
        <div className="game-card text-center py-6">
          <span className="text-2xl">🏰</span>
          <p className="text-sm font-bold text-gold mt-2">Maximaal niveau bereikt!</p>
          <p className="text-xs text-muted-foreground">Je woont in de ultieme villa.</p>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onAnimationComplete={() => setTimeout(() => setToast(null), 2000)}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card border border-border px-4 py-2 rounded-lg text-xs font-semibold shadow-lg z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </ViewWrapper>
  );
}

function BonusTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 text-gold text-[0.55rem] font-semibold border border-gold/20">
      {label}
    </span>
  );
}
