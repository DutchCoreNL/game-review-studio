import { useGame } from '@/contexts/GameContext';
import { getChapterDef, COMBAT_ITEMS } from '@/game/campaign';
import { CAMPAIGN_BOSS_IMAGES } from '@/assets/items';
import { BOSS_TAUNTS } from '@/game/campaignNarratives';
import { Button } from '@/components/ui/button';
import { Swords, Shield, Zap, Trophy, X, Wind, Pill } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { WeaponCard } from '../weapons/WeaponCard';
import { TypewriterText } from '../animations/TypewriterText';
import { DamageNumbers, useDamageNumbers } from './DamageNumber';

export function BossFightView() {
  const { state, dispatch } = useGame();
  const fight = state.campaign.activeBossFight!;
  const ch = getChapterDef(fight.chapterId)!;
  const boss = ch.boss;
  const logEndRef = useRef<HTMLDivElement>(null);
  const bossImage = CAMPAIGN_BOSS_IMAGES[fight.bossId];
  const { entries: dmgEntries, addDamage } = useDamageNumbers();

  const [showTaunt, setShowTaunt] = useState<string | null>(null);
  const [phaseFlash, setPhaseFlash] = useState(false);
  const [lastTauntTurn, setLastTauntTurn] = useState(0);
  const [showItemMenu, setShowItemMenu] = useState(false);
  const [bossShake, setBossShake] = useState(false);
  const [prevTurn, setPrevTurn] = useState(fight.turn);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [fight.log.length]);

  // Track damage numbers
  useEffect(() => {
    if (fight.turn > prevTurn) {
      if (fight.lastDamageDealt > 0) {
        addDamage(fight.lastDamageDealt, fight.comboCounter > 0 ? 'combo' : 'damage');
        setBossShake(true);
        setTimeout(() => setBossShake(false), 300);
      }
      if (fight.lastDamageTaken > 0) {
        addDamage(fight.lastDamageTaken, 'damage');
      }
      setPrevTurn(fight.turn);
    }
  }, [fight.turn, fight.lastDamageDealt, fight.lastDamageTaken, prevTurn, addDamage, fight.comboCounter]);

  // Boss taunt every 3 turns
  useEffect(() => {
    if (fight.turn > 0 && fight.turn % 3 === 0 && fight.turn !== lastTauntTurn && !fight.finished) {
      const taunts = BOSS_TAUNTS[fight.bossId];
      if (taunts?.length) {
        setShowTaunt(taunts[Math.floor(Math.random() * taunts.length)]);
        setLastTauntTurn(fight.turn);
        const t = setTimeout(() => setShowTaunt(null), 3500);
        return () => clearTimeout(t);
      }
    }
  }, [fight.turn, fight.finished, fight.bossId, lastTauntTurn]);

  // Phase transition flash
  useEffect(() => {
    if (fight.phaseJustChanged) {
      setPhaseFlash(true);
      const t = setTimeout(() => setPhaseFlash(false), 800);
      return () => clearTimeout(t);
    }
  }, [fight.phaseJustChanged, fight.turn]);

  const bossHPPercent = (fight.bossHP / fight.bossMaxHP) * 100;
  const playerHPPercent = (fight.playerHP / fight.playerMaxHP) * 100;
  const ragePercent = (fight.rage / fight.rageMax) * 100;
  const currentPhaseName = boss.phases[fight.currentPhase]?.name || 'Standaard';

  const handleAction = (action: 'attack' | 'heavy' | 'defend' | 'dodge' | 'item', itemId?: string) => {
    dispatch({ type: 'BOSS_FIGHT_ACTION', action, itemId });
    setShowItemMenu(false);
  };

  return (
    <div className="space-y-3 pb-4">
      {/* Phase transition flash */}
      <AnimatePresence>
        {phaseFlash && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[9999] pointer-events-none bg-blood/30"
          />
        )}
      </AnimatePresence>

      {/* Boss Portrait Banner */}
      <div className="relative">
        <DamageNumbers entries={dmgEntries} />
        {bossImage ? (
          <div className="relative h-28 rounded-lg overflow-hidden border border-blood/40">
            <motion.img
              src={bossImage}
              alt={boss.name}
              className="w-full h-full object-cover"
              style={{ opacity: 0.35 }}
              animate={bossShake ? { x: [-3, 3, -2, 2, 0] } : fight.phaseJustChanged ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: bossShake ? 0.3 : 0.5 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute bottom-2 left-3">
              <h2 className="text-lg font-black text-blood drop-shadow-lg">{boss.name}</h2>
              <p className="text-xs text-muted-foreground">{boss.title}</p>
              <p className="text-[10px] text-blood/70">Fase: {currentPhaseName}</p>
            </div>
            <div className="absolute top-2 right-2 text-3xl drop-shadow-lg">
              <motion.span animate={bossShake ? { rotate: [-5, 5, 0] } : {}}>{boss.icon}</motion.span>
            </div>
          </div>
        ) : (
          <div className="text-center p-3 bg-blood/10 border border-blood/30 rounded-lg">
            <motion.div className="text-4xl mb-1" animate={bossShake ? { x: [-3, 3, 0] } : {}}>{boss.icon}</motion.div>
            <h2 className="text-lg font-black text-blood">{boss.name}</h2>
            <p className="text-xs text-muted-foreground">{boss.title}</p>
            <p className="text-[10px] text-blood/70 mt-1">Fase: {currentPhaseName}</p>
          </div>
        )}
      </div>

      {/* Boss Taunt */}
      <AnimatePresence>
        {showTaunt && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-2 bg-blood/10 border border-blood/30 rounded-lg">
            <p className="text-xs text-blood italic">
              <span className="text-sm mr-1">{boss.icon}</span>
              <TypewriterText text={showTaunt} speed={20} />
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Counter Warning */}
      <AnimatePresence>
        {fight.counterWarning && !fight.finished && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-[10px] text-amber-400 font-bold animate-pulse">⚡ {fight.counterWarning}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debuffs */}
      {fight.debuffs.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {fight.debuffs.map((d, i) => (
            <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[9px] text-purple-400">
              <span>{d.icon}</span>
              <span className="font-bold">{d.name}</span>
              <span className="opacity-70">({d.turnsLeft}t)</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* HP Bars */}
      <div className="space-y-2">
        {/* Boss HP with segments */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
            <span>{boss.name}</span>
            <span>{fight.bossHP}/{fight.bossMaxHP}</span>
          </div>
          <div className="relative h-4 rounded-full bg-muted/30 overflow-hidden border border-blood/20">
            <motion.div className="h-full bg-gradient-to-r from-blood to-red-600" animate={{ width: `${bossHPPercent}%` }} transition={{ duration: 0.3 }} />
            {/* Phase markers */}
            {boss.phases.slice(1).map((phase, i) => (
              <div key={i} className="absolute top-0 h-full w-px bg-foreground/30" style={{ left: `${phase.hpThreshold}%` }} />
            ))}
            {/* 10% segment markers */}
            {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(pct => (
              <div key={pct} className="absolute top-0 h-full w-px bg-foreground/10" style={{ left: `${pct}%` }} />
            ))}
          </div>
        </div>

        {/* Rage Meter */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
            <span className="text-amber-400">🔥 Razernij</span>
            <span className={ragePercent >= 80 ? 'text-blood font-bold animate-pulse' : ''}>{Math.floor(fight.rage)}/{fight.rageMax}</span>
          </div>
          <div className="h-2 rounded-full bg-muted/30 overflow-hidden border border-amber-400/20">
            <motion.div
              className={`h-full ${ragePercent >= 80 ? 'bg-gradient-to-r from-amber-500 to-blood' : 'bg-gradient-to-r from-amber-600 to-amber-400'}`}
              animate={{ width: `${ragePercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {ragePercent >= 80 && (
            <p className="text-[9px] text-blood font-bold mt-0.5 animate-pulse">⚠️ Razernij bijna vol — super-aanval dreigt!</p>
          )}
        </div>

        {/* Player HP */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
            <span>Jij</span>
            <span>{fight.playerHP}/{fight.playerMaxHP}</span>
          </div>
          <div className="h-3 rounded-full bg-muted/30 overflow-hidden border border-emerald/20">
            <motion.div className="h-full bg-gradient-to-r from-emerald to-green-500" animate={{ width: `${playerHPPercent}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
      </div>

      {/* Combo counter */}
      {fight.comboCounter > 0 && (
        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}
          className="text-center text-[10px] text-amber-400 font-bold">
          ⚡ {fight.comboCounter}x Combo's uitgevoerd!
        </motion.div>
      )}

      {/* Defend buff & active effects */}
      <div className="flex flex-wrap gap-1">
        {fight.defendBuff > 0 && (
          <div className="text-[10px] text-emerald bg-emerald/10 border border-emerald/30 rounded px-2 py-0.5">
            🛡️ Verdediging ({fight.defendBuff}t)
          </div>
        )}
        {fight.adrenalineActive && (
          <div className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded px-2 py-0.5 animate-pulse">
            💉 Adrenaline actief!
          </div>
        )}
        {fight.bossStunned && (
          <div className="text-[10px] text-purple-400 bg-purple-400/10 border border-purple-400/30 rounded px-2 py-0.5">
            💫 Boss verdoofd
          </div>
        )}
      </div>

      {/* Combat Log */}
      <div className="h-32 overflow-y-auto bg-muted/10 border border-border/40 rounded-lg p-2 text-xs space-y-1 game-scroll">
        {fight.log.map((entry, i) => (
          <motion.div
            key={i}
            initial={i >= fight.log.length - 2 ? { opacity: 0, x: entry.type === 'player' ? -10 : 10 } : false}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-start gap-1.5 ${
              entry.type === 'player' ? 'text-emerald' :
              entry.type === 'boss' ? 'text-blood' :
              entry.type === 'phase' ? 'text-amber-400 font-bold' :
              entry.type === 'loot' ? 'text-gold' :
              entry.type === 'combo' ? 'text-amber-400 font-bold' :
              entry.type === 'debuff' ? 'text-purple-400' :
              entry.type === 'item' ? 'text-emerald font-semibold' :
              entry.type === 'counter' ? 'text-blood font-bold' :
              'text-muted-foreground'
            }`}
          >
            {entry.icon && <span className="text-xs flex-shrink-0">{entry.icon}</span>}
            <span>{entry.text}</span>
          </motion.div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Actions or Result */}
      {!fight.finished ? (
        <div className="space-y-2">
          <div className="text-center text-[10px] text-muted-foreground">Beurt {fight.turn + 1}</div>

          {/* Item menu */}
          <AnimatePresence>
            {showItemMenu && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="grid grid-cols-3 gap-1.5 p-2 bg-card border border-border/60 rounded-lg">
                {COMBAT_ITEMS.map(item => (
                  <Button key={item.id} variant="outline" className="text-[9px] h-12 flex-col gap-0 p-1"
                    onClick={() => handleAction('item', item.id)}>
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.name}</span>
                  </Button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-5 gap-1">
            <Button onClick={() => handleAction('attack')} variant="secondary" className="text-xs h-10 flex-col gap-0 p-1">
              <Swords className="w-4 h-4" />
              <span className="text-[9px]">Aanval</span>
            </Button>
            <Button onClick={() => handleAction('heavy')} variant="default" className="text-xs h-10 flex-col gap-0 p-1" disabled={fight.cooldowns.heavy > 0}>
              <Zap className="w-4 h-4" />
              <span className="text-[9px]">{fight.cooldowns.heavy > 0 ? `(${fight.cooldowns.heavy})` : 'Zwaar'}</span>
            </Button>
            <Button onClick={() => handleAction('defend')} variant="outline" className="text-xs h-10 flex-col gap-0 p-1">
              <Shield className="w-4 h-4" />
              <span className="text-[9px]">Verdedig</span>
            </Button>
            <Button onClick={() => handleAction('dodge')} variant="outline" className="text-xs h-10 flex-col gap-0 p-1" disabled={fight.cooldowns.dodge > 0}>
              <Wind className="w-4 h-4" />
              <span className="text-[9px]">{fight.cooldowns.dodge > 0 ? `(${fight.cooldowns.dodge})` : 'Ontwijk'}</span>
            </Button>
            <Button onClick={() => setShowItemMenu(!showItemMenu)} variant="outline" className="text-xs h-10 flex-col gap-0 p-1"
              disabled={fight.itemsUsed >= fight.itemsMax}>
              <Pill className="w-4 h-4" />
              <span className="text-[9px]">{fight.itemsUsed >= fight.itemsMax ? `(${fight.itemsUsed}/${fight.itemsMax})` : 'Item'}</span>
            </Button>
          </div>

          {/* Combo hints */}
          <div className="text-[9px] text-muted-foreground/60 text-center">
            Combo's: Aanval×3 | Aanval→Zwaar→Aanval | Verdedig→Zwaar
          </div>
        </div>
      ) : fight.won ? (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-3">
          <motion.div initial={{ opacity: 0.4 }} animate={{ opacity: 0 }} transition={{ duration: 1.5 }}
            className="fixed inset-0 z-[9990] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, hsla(45,93%,50%,0.3) 0%, transparent 100%)' }}
          />
          <div className="text-center p-3 bg-gold/10 border border-gold/30 rounded-lg">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
              <Trophy className="w-8 h-8 text-gold mx-auto mb-1" />
            </motion.div>
            <h3 className="text-lg font-black text-gold">OVERWINNING!</h3>
            <p className="text-xs text-muted-foreground">{boss.name} verslagen in {fight.turn} beurten</p>
            {fight.comboCounter > 0 && <p className="text-[10px] text-amber-400 mt-0.5">⚡ {fight.comboCounter} combo's uitgevoerd</p>}
          </div>

          <div className="space-y-2">
            {fight.moneyLoot > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted/20 rounded border border-border/40">
                <span>💰</span>
                <span className="text-sm font-bold text-gold">€{fight.moneyLoot.toLocaleString()}</span>
              </div>
            )}
            {fight.loot && <WeaponCard weapon={fight.loot} compact />}
            {fight.accessoryLoot && (
              <div className="flex items-center gap-2 p-2 bg-purple-500/10 rounded border border-purple-500/30">
                <span>{fight.accessoryLoot.icon}</span>
                <div>
                  <p className="text-xs font-bold text-purple-400">{fight.accessoryLoot.name}</p>
                  <p className="text-[10px] text-muted-foreground">{fight.accessoryLoot.effect}</p>
                </div>
              </div>
            )}
          </div>

          <Button onClick={() => dispatch({ type: 'COLLECT_BOSS_LOOT' })} className="w-full" size="sm">
            <Trophy className="w-4 h-4 mr-1" /> Verzamel Loot
          </Button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div initial={{ opacity: 0.5 }} animate={{ opacity: 0 }} transition={{ duration: 1.5 }}
            className="fixed inset-0 z-[9990] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, hsla(0,80%,30%,0.4) 0%, transparent 100%)' }}
          />
          <div className="text-center p-3 bg-blood/10 border border-blood/30 rounded-lg">
            <X className="w-8 h-8 text-blood mx-auto mb-1" />
            <h3 className="text-lg font-black text-blood">VERSLAGEN</h3>
            <p className="text-xs text-muted-foreground">Probeer het opnieuw wanneer je sterker bent</p>
            <Button onClick={() => dispatch({ type: 'END_BOSS_FIGHT' })} variant="outline" className="mt-3" size="sm">
              Terug naar Campagne
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
