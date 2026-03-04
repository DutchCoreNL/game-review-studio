import { useGame } from '@/contexts/GameContext';
import { getChapterDef } from '@/game/campaign';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Swords, Shield, Zap, Trophy, X } from 'lucide-react';
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
  const currentPhaseName = boss.phases[fight.currentPhase]?.name || 'Standaard';

  const handleAction = (action: 'attack' | 'heavy' | 'defend') => {
    dispatch({ type: 'BOSS_FIGHT_ACTION', action });
  };

  const handleCollectLoot = () => {
    dispatch({ type: 'COLLECT_BOSS_LOOT' });
  };

  const handleLeave = () => {
    dispatch({ type: 'END_BOSS_FIGHT' });
  };

  return (
    <div className="space-y-3 pb-4">
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

      {/* Combat Log */}
      <div className="h-40 overflow-y-auto bg-muted/10 border border-border/40 rounded-lg p-2 text-xs space-y-1 game-scroll">
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
        <div className="flex gap-2">
          <Button onClick={() => handleAction('attack')} variant="secondary" className="flex-1 text-xs h-10">
            <Swords className="w-4 h-4 mr-1" /> Aanval
          </Button>
          <Button onClick={() => handleAction('heavy')} variant="default" className="flex-1 text-xs h-10">
            <Zap className="w-4 h-4 mr-1" /> Zwaar
          </Button>
          <Button onClick={() => handleAction('defend')} variant="outline" className="flex-1 text-xs h-10">
            <Shield className="w-4 h-4 mr-1" /> Verdedig
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {fight.won ? (
            <>
              <div className="text-center p-3 bg-gold/10 border border-gold/30 rounded-lg">
                <Trophy className="w-8 h-8 text-gold mx-auto mb-1" />
                <h3 className="text-lg font-black text-gold">OVERWINNING!</h3>
                <p className="text-xs text-muted-foreground">{boss.name} verslagen in {fight.turn} beurten</p>
              </div>

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
