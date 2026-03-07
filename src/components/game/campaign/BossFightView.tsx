import { useGame } from '@/contexts/GameContext';
import { getChapterDef } from '@/game/campaign';
import { Button } from '@/components/ui/button';
import { Swords, Shield, Zap, Trophy, X, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { WeaponCard } from '../weapons/WeaponCard';

export function BossFightView() {
  const { state, dispatch } = useGame();
  const fight = state.campaign.activeBossFight!;
  const ch = getChapterDef(fight.chapterId)!;
  const boss = ch.boss;
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [fight.log.length]);

  const bossHPPercent = (fight.bossHP / fight.bossMaxHP) * 100;
  const playerHPPercent = (fight.playerHP / fight.playerMaxHP) * 100;
  const ragePercent = (fight.rage / fight.rageMax) * 100;
  const currentPhaseName = boss.phases[fight.currentPhase]?.name || 'Standaard';

  const handleAction = (action: 'attack' | 'heavy' | 'defend' | 'dodge') => {
    dispatch({ type: 'BOSS_FIGHT_ACTION', action });
  };

  const handleCollectLoot = () => {
    dispatch({ type: 'COLLECT_BOSS_LOOT' });
  };

  const handleLeave = () => {
    dispatch({ type: 'END_BOSS_FIGHT' });
  };

  return (
    <div className={`space-y-3 pb-4 ${fight.phaseJustChanged ? 'shake' : ''}`}>
      {/* Boss Header */}
      <div className="text-center p-3 bg-blood/10 border border-blood/30 rounded-lg">
        <div className="text-4xl mb-1">{boss.icon}</div>
        <h2 className="text-lg font-black text-blood">{boss.name}</h2>
        <p className="text-xs text-muted-foreground">{boss.title}</p>
        <p className="text-[10px] text-blood/70 mt-1">Fase: {currentPhaseName}</p>
      </div>

      {/* HP Bars */}
      <div className="space-y-2">
        {/* Boss HP */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
            <span>{boss.name}</span>
            <span>{fight.bossHP}/{fight.bossMaxHP}</span>
          </div>
          <div className="relative h-4 rounded-full bg-muted/30 overflow-hidden border border-blood/20">
            <motion.div
              className="h-full bg-gradient-to-r from-blood to-red-600"
              animate={{ width: `${bossHPPercent}%` }}
              transition={{ duration: 0.3 }}
            />
            {/* Phase markers */}
            {boss.phases.slice(1).map((phase, i) => (
              <div key={i} className="absolute top-0 h-full w-px bg-foreground/30" style={{ left: `${phase.hpThreshold}%` }} />
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
            <motion.div
              className="h-full bg-gradient-to-r from-emerald to-green-500"
              animate={{ width: `${playerHPPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Defend buff indicator */}
      {fight.defendBuff > 0 && (
        <div className="text-[10px] text-emerald bg-emerald/10 border border-emerald/30 rounded px-2 py-1 text-center">
          🛡️ Verdedigingsbuff actief ({fight.defendBuff} beurten) — +10% aanval
        </div>
      )}

      {/* Combat Log */}
      <div className="h-36 overflow-y-auto bg-muted/10 border border-border/40 rounded-lg p-2 text-xs space-y-1 game-scroll">
        {fight.log.map((entry, i) => (
          <div key={i} className={`flex items-start gap-1.5 ${
            entry.type === 'player' ? 'text-emerald' : 
            entry.type === 'boss' ? 'text-blood' : 
            entry.type === 'phase' ? 'text-amber-400 font-bold' :
            entry.type === 'loot' ? 'text-gold' :
            'text-muted-foreground'
          }`}>
            {entry.icon && <span className="text-xs flex-shrink-0">{entry.icon}</span>}
            <span>{entry.text}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Actions or Result */}
      {!fight.finished ? (
        <div className="grid grid-cols-4 gap-1.5">
          <Button onClick={() => handleAction('attack')} variant="secondary" className="text-xs h-10 flex-col gap-0 p-1">
            <Swords className="w-4 h-4" />
            <span className="text-[9px]">Aanval</span>
          </Button>
          <Button
            onClick={() => handleAction('heavy')}
            variant="default"
            className="text-xs h-10 flex-col gap-0 p-1"
            disabled={fight.cooldowns.heavy > 0}
          >
            <Zap className="w-4 h-4" />
            <span className="text-[9px]">
              {fight.cooldowns.heavy > 0 ? `(${fight.cooldowns.heavy})` : 'Zwaar'}
            </span>
          </Button>
          <Button onClick={() => handleAction('defend')} variant="outline" className="text-xs h-10 flex-col gap-0 p-1">
            <Shield className="w-4 h-4" />
            <span className="text-[9px]">Verdedig</span>
          </Button>
          <Button
            onClick={() => handleAction('dodge')}
            variant="outline"
            className="text-xs h-10 flex-col gap-0 p-1"
            disabled={fight.cooldowns.dodge > 0}
          >
            <Wind className="w-4 h-4" />
            <span className="text-[9px]">
              {fight.cooldowns.dodge > 0 ? `(${fight.cooldowns.dodge})` : 'Ontwijken'}
            </span>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {fight.won ? (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center p-3 bg-gold/10 border border-gold/30 rounded-lg"
              >
                <Trophy className="w-8 h-8 text-gold mx-auto mb-1" />
                <h3 className="text-lg font-black text-gold">OVERWINNING!</h3>
                <p className="text-xs text-muted-foreground">{boss.name} verslagen in {fight.turn} beurten</p>
              </motion.div>

              {/* Loot Display */}
              <div className="space-y-2">
                {fight.moneyLoot > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-muted/20 rounded border border-border/40">
                    <span>💰</span>
                    <span className="text-sm font-bold text-gold">€{fight.moneyLoot.toLocaleString()}</span>
                  </div>
                )}
                {fight.loot && <WeaponCard weapon={fight.loot} compact />}
                {fight.accessoryLoot && (
                  <div className="flex items-center gap-2 p-2 bg-game-purple/10 rounded border border-game-purple/30">
                    <span>{fight.accessoryLoot.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-game-purple">{fight.accessoryLoot.name}</p>
                      <p className="text-[10px] text-muted-foreground">{fight.accessoryLoot.effect}</p>
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={handleCollectLoot} className="w-full" size="sm">
                <Trophy className="w-4 h-4 mr-1" /> Verzamel Loot
              </Button>
            </>
          ) : (
            <div className="text-center p-3 bg-blood/10 border border-blood/30 rounded-lg">
              <X className="w-8 h-8 text-blood mx-auto mb-1" />
              <h3 className="text-lg font-black text-blood">VERSLAGEN</h3>
              <p className="text-xs text-muted-foreground">Probeer het opnieuw wanneer je sterker bent</p>
              <Button onClick={handleLeave} variant="outline" className="mt-3" size="sm">
                Terug naar Campagne
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
