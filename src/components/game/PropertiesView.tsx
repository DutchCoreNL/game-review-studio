import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { PROPERTIES, getCurrentProperty, getNextProperty, canAffordProperty, Property } from '@/game/properties';
import { ViewWrapper } from './ui/ViewWrapper';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ArrowRight, Lock, CheckCircle2, TrendingUp } from 'lucide-react';

export function PropertiesView() {
  const { state, dispatch } = useGame();
  const [toast, setToast] = useState<string | null>(null);

  // Use villa existence as proxy for property ownership progression
  const currentPropId = state.villa ? 'villa' : 
    state.player.level >= 12 ? 'penthouse' :
    state.player.level >= 5 ? 'appartement' : 'kraakpand';
  
  const currentProp = getCurrentProperty(currentPropId);
  const nextProp = getNextProperty(currentPropId);

  return (
    <ViewWrapper>
      <SectionHeader title="Vastgoed" />
      
      <p className="text-xs text-muted-foreground mb-4">
        Upgrade je woning voor betere stats, passief inkomen en opslagcapaciteit.
      </p>

      {/* Current property */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-gold/30 bg-gold/5 p-4 mb-4"
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{currentProp.icon}</span>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Huidige woning</p>
            <h2 className="text-lg font-bold text-foreground">{currentProp.name}</h2>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{currentProp.description}</p>
        {Object.keys(currentProp.bonuses).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {currentProp.bonuses.maxEnergy && (
              <BonusTag label={`+${currentProp.bonuses.maxEnergy} Max Energy`} />
            )}
            {currentProp.bonuses.maxHp && (
              <BonusTag label={`+${currentProp.bonuses.maxHp} Max HP`} />
            )}
            {currentProp.bonuses.passiveIncome && (
              <BonusTag label={`€${currentProp.bonuses.passiveIncome}/dag inkomen`} />
            )}
            {currentProp.bonuses.heatReduction && (
              <BonusTag label={`-${currentProp.bonuses.heatReduction}% heat`} />
            )}
            {currentProp.bonuses.storageSlots && (
              <BonusTag label={`+${currentProp.bonuses.storageSlots} opslag`} />
            )}
          </div>
        )}
      </motion.div>

      {/* Property tier progress */}
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
              className={`rounded-lg border p-3 flex items-center gap-3 transition-all ${
                owned ? 'border-emerald-500/30 bg-emerald-500/5' :
                isNext ? 'border-gold/30 bg-card' :
                'border-border/20 bg-muted/5 opacity-50'
              }`}
            >
              <span className="text-xl">{prop.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{prop.name}</span>
                  {owned && <CheckCircle2 size={12} className="text-emerald-400" />}
                  {!owned && !isNext && <Lock size={12} className="text-muted-foreground" />}
                </div>
                <div className="flex items-center gap-3 text-[0.6rem] text-muted-foreground mt-0.5">
                  {prop.cost > 0 && <span>€{prop.cost.toLocaleString()}</span>}
                  <span>Lv.{prop.reqLevel}</span>
                  {prop.reqRep > 0 && <span>Rep {prop.reqRep}</span>}
                </div>
              </div>
              {isNext && (
                <div className="text-right">
                  {canBuy ? (
                    <span className="text-[0.6rem] text-gold font-bold">Beschikbaar</span>
                  ) : (
                    <span className="text-[0.6rem] text-muted-foreground">Niet beschikbaar</span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Next upgrade CTA */}
      {nextProp && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-gold" />
            <h3 className="text-sm font-bold text-foreground">Volgende upgrade: {nextProp.name}</h3>
          </div>
          <div className="space-y-1 text-[0.65rem] text-muted-foreground mb-3">
            <p>Kosten: <span className={state.money >= nextProp.cost ? 'text-emerald-400' : 'text-blood'}>€{nextProp.cost.toLocaleString()}</span></p>
            <p>Level: <span className={state.player.level >= nextProp.reqLevel ? 'text-emerald-400' : 'text-blood'}>{nextProp.reqLevel} (huidig: {state.player.level})</span></p>
            <p>Rep: <span className={state.rep >= nextProp.reqRep ? 'text-emerald-400' : 'text-blood'}>{nextProp.reqRep} (huidig: {state.rep})</span></p>
          </div>
          {nextProp.bonuses && Object.keys(nextProp.bonuses).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {nextProp.bonuses.maxEnergy && <BonusTag label={`+${nextProp.bonuses.maxEnergy} Energy`} />}
              {nextProp.bonuses.passiveIncome && <BonusTag label={`€${nextProp.bonuses.passiveIncome}/dag`} />}
              {nextProp.bonuses.heatReduction && <BonusTag label={`-${nextProp.bonuses.heatReduction}% heat`} />}
            </div>
          )}
        </div>
      )}

      {!nextProp && (
        <div className="text-center py-6">
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
