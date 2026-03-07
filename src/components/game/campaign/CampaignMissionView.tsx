import { useGame } from '@/contexts/GameContext';
import { getMissionDef, type EncounterChoice, type EncounterType, COMBAT_ITEMS } from '@/game/campaign';
import { MISSION_BRIEFINGS, ENCOUNTER_TYPE_CONFIG } from '@/game/campaignNarratives';
import { CHAPTER_DISTRICT_IMAGES } from '@/assets/items';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, X, Star, Target } from 'lucide-react';
import { WeaponCard } from '../weapons/WeaponCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { EncounterCard } from './EncounterCard';

const DEFAULT_CHOICE_INFO: Record<EncounterChoice, { label: string; desc: string; icon: string }> = {
  stealth: { label: 'Stealth', desc: 'Laag risico, minder loot', icon: '👁️' },
  standard: { label: 'Standaard', desc: 'Gebalanceerd', icon: '⚔️' },
  aggressive: { label: 'Agressief', desc: 'Hoog risico, meer loot + heat', icon: '🔥' },
};

function MoraleMeter({ morale }: { morale: number }) {
  const color = morale >= 70 ? 'bg-emerald' : morale <= 30 ? 'bg-blood' : 'bg-amber-400';
  const label = morale >= 70 ? 'Hoog' : morale <= 30 ? 'Laag' : 'Stabiel';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground">Moreel:</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <motion.div className={`h-full ${color}`} animate={{ width: `${morale}%` }} transition={{ duration: 0.3 }} />
      </div>
      <span className={`text-[10px] font-bold ${morale >= 70 ? 'text-emerald' : morale <= 30 ? 'text-blood' : 'text-amber-400'}`}>{label}</span>
    </div>
  );
}

export function CampaignMissionView() {
  const { state, dispatch } = useGame();
  const [showBriefing, setShowBriefing] = useState(true);
  const [timerValue, setTimerValue] = useState(10);
  const [lastTimedEncounter, setLastTimedEncounter] = useState(-1);
  const [choiceFeedback, setChoiceFeedback] = useState<EncounterChoice | null>(null);

  const mission = state.campaign.activeCampaignMission!;
  const mDef = getMissionDef(mission.missionId)!;
  const briefing = MISSION_BRIEFINGS[mission.missionId];
  const chapterImage = CHAPTER_DISTRICT_IMAGES[mission.chapterId];
  const progress = (mission.currentEncounter / mission.totalEncounters) * 100;
  const encType = mission.currentEncounterType;

  useEffect(() => {
    if (showBriefing && !briefing) setShowBriefing(false);
  }, [showBriefing, briefing]);

  // Timer for timed encounters
  useEffect(() => {
    if (encType !== 'timed' || mission.finished || showBriefing) return;
    if (mission.currentEncounter === lastTimedEncounter) return;
    setLastTimedEncounter(mission.currentEncounter);
    setTimerValue(10);
    const interval = setInterval(() => {
      setTimerValue(v => {
        if (v <= 1) {
          clearInterval(interval);
          dispatch({ type: 'ADVANCE_CAMPAIGN_MISSION', choice: 'standard' });
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [encType, mission.currentEncounter, mission.finished, showBriefing, lastTimedEncounter, dispatch]);

  const handleChoice = useCallback((choice: EncounterChoice) => {
    setChoiceFeedback(choice);
    setTimeout(() => setChoiceFeedback(null), 600);
    dispatch({ type: 'ADVANCE_CAMPAIGN_MISSION', choice });
  }, [dispatch]);

  const getChoiceInfo = (type: EncounterType, choice: EncounterChoice) => {
    const config = ENCOUNTER_TYPE_CONFIG[type];
    const base = DEFAULT_CHOICE_INFO[choice];
    if (config.choiceLabels?.[choice]) {
      return { ...base, label: config.choiceLabels[choice].label, desc: config.choiceLabels[choice].desc };
    }
    return base;
  };

  // BRIEFING SCREEN
  if (showBriefing && briefing) {
    return (
      <div className="space-y-3 pb-4">
        {chapterImage && (
          <div className="relative h-28 rounded-lg overflow-hidden border border-primary/30">
            <img src={chapterImage} alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            <div className="absolute bottom-2 left-3 right-3">
              <h2 className="text-lg font-black text-foreground">{mDef.icon} {mDef.title}</h2>
              <p className="text-[10px] text-muted-foreground">{mDef.description}</p>
            </div>
          </div>
        )}
        <div className="p-3 bg-card/80 border border-border/40 rounded-lg space-y-2">
          <h3 className="text-sm font-bold text-foreground">📋 Briefing</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{briefing.text}</p>
          <div className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded">
            <p className="text-xs text-primary font-semibold">🎯 Doel: {briefing.objective}</p>
          </div>
          {mission.bonusObjectives.length > 0 && (
            <div className="mt-1 p-2 bg-gold/5 border border-gold/20 rounded space-y-1">
              <p className="text-[10px] font-bold text-gold flex items-center gap-1"><Target className="w-3 h-3" /> Bonus Doelen:</p>
              {mission.bonusObjectives.map(obj => (
                <p key={obj.id} className="text-[10px] text-muted-foreground">• {obj.description} → {obj.rewardLabel}</p>
              ))}
            </div>
          )}
          <div className="flex gap-2 text-[10px] text-muted-foreground mt-1">
            <span>⚡ {mDef.energyCost} energie</span>
            <span>🗡️ {mDef.encounters} encounters</span>
            <span>💰 €{mDef.rewards.money[0].toLocaleString()}-{mDef.rewards.money[1].toLocaleString()}</span>
          </div>
        </div>
        <Button onClick={() => setShowBriefing(false)} className="w-full" size="sm">
          ⚔️ Begin Missie
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {/* Choice feedback flash */}
      <AnimatePresence>
        {choiceFeedback && (
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={`fixed inset-0 z-[9990] pointer-events-none ${
              choiceFeedback === 'stealth' ? 'bg-emerald/15' :
              choiceFeedback === 'aggressive' ? 'bg-blood/20' : 'bg-primary/10'
            }`}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-2 p-2 bg-card/60 border border-border/40 rounded-lg">
        <span className="text-xl">{mDef.icon}</span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-foreground truncate">{mDef.title}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <Progress value={progress} className="h-1.5 flex-1" />
            <span className="text-[10px] text-muted-foreground">{mission.currentEncounter}/{mission.totalEncounters}</span>
          </div>
        </div>
        {mission.isHiddenEncounter && (
          <span className="text-[9px] text-purple-400 font-bold animate-pulse">🔮 VERBORGEN</span>
        )}
      </div>

      {/* Encounter progress path */}
      <div className="flex gap-0.5 justify-center items-center">
        {mission.encounterTypes.map((t, i) => {
          const info = ENCOUNTER_TYPE_CONFIG[t];
          const done = i < mission.currentEncounter;
          const current = i === mission.currentEncounter && !mission.finished;
          return (
            <div key={i} className="flex items-center">
              <motion.div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border transition-all ${
                  done ? 'bg-emerald/20 border-emerald/40 opacity-60' :
                  current ? `bg-card border-2 ${info.color.replace('text-', 'border-')} shadow-lg scale-110` :
                  'bg-muted/10 border-border/30 opacity-40'
                }`}
                animate={current ? { scale: [1, 1.1, 1] } : {}}
                transition={current ? { repeat: Infinity, duration: 2 } : {}}
              >
                {done ? '✓' : info.icon}
              </motion.div>
              {i < mission.encounterTypes.length - 1 && (
                <div className={`w-2 h-0.5 ${done ? 'bg-emerald/40' : 'bg-border/20'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Morale + carry-over info */}
      <MoraleMeter morale={mission.morale} />
      {mission.carryOver.bonusLootMod > 1 && (
        <p className="text-[9px] text-gold text-center font-bold">🔥 Loot bonus: +{Math.round((mission.carryOver.bonusLootMod - 1) * 100)}%</p>
      )}

      {/* Log */}
      <div className="bg-muted/10 border border-border/40 rounded-lg p-3 space-y-1.5 max-h-28 overflow-y-auto game-scroll">
        {mission.log.map((entry, i) => (
          <motion.p
            key={i}
            initial={i === mission.log.length - 1 ? { opacity: 0, x: -10 } : false}
            animate={{ opacity: 1, x: 0 }}
            className={`text-xs ${entry.startsWith('🎲') ? 'text-gold font-semibold' : entry.startsWith('🔮') ? 'text-purple-400 font-semibold' : entry.startsWith('🎯') ? 'text-gold' : 'text-muted-foreground'}`}
          >
            {entry}
          </motion.p>
        ))}
      </div>

      {/* Actions / Result */}
      {!mission.finished ? (
        <AnimatePresence mode="wait">
          <EncounterCard
            key={mission.currentEncounter}
            type={encType}
            encounterNum={mission.currentEncounter + 1}
            totalEncounters={mission.totalEncounters}
            timerValue={encType === 'timed' ? timerValue : undefined}
            morale={mission.morale}
            choices={(encType === 'ambush' ? ['standard', 'aggressive'] as EncounterChoice[] : ['stealth', 'standard', 'aggressive'] as EncounterChoice[]).map(choice => {
              const info = getChoiceInfo(encType, choice);
              return { choice, ...info };
            })}
            onChoice={handleChoice}
            bonusObjective={mission.bonusObjectives[0]?.description}
          />
        </AnimatePresence>
      ) : mission.success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-3"
        >
          <div className="text-center p-3 bg-gold/10 border border-gold/30 rounded-lg">
            <Trophy className="w-6 h-6 text-gold mx-auto mb-1" />
            <h3 className="font-bold text-gold">Missie Voltooid!</h3>
            <div className="flex justify-center gap-1 mt-1">
              {[1, 2, 3].map(s => (
                <motion.div
                  key={s}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: s * 0.2, type: 'spring', stiffness: 200 }}
                >
                  <Star className={`w-6 h-6 ${s <= mission.rating ? 'text-gold fill-gold' : 'text-muted-foreground/20'}`} />
                </motion.div>
              ))}
            </div>
            <div className="flex justify-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>💰 €{mission.rewards.money.toLocaleString()}</span>
              <span>⭐ {mission.rewards.rep} rep</span>
              <span>✨ {mission.rewards.xp} xp</span>
            </div>
            {mission.rating >= 2 && (
              <p className="text-[10px] text-gold mt-1">+{mission.rating === 3 ? '50' : '20'}% bonus beloningen!</p>
            )}
          </div>

          {/* Bonus objectives */}
          {mission.bonusObjectives.length > 0 && (
            <div className="p-2 bg-gold/5 border border-gold/20 rounded space-y-1">
              <p className="text-xs font-bold text-gold flex items-center gap-1"><Target className="w-3 h-3" /> Bonus Doelen</p>
              {mission.bonusObjectives.map(obj => {
                const completed = mission.bonusObjectivesCompleted.includes(obj.id);
                return (
                  <div key={obj.id} className={`flex items-center gap-2 text-[10px] ${completed ? 'text-gold' : 'text-muted-foreground/50'}`}>
                    <span>{completed ? '✅' : '❌'}</span>
                    <span>{obj.description}</span>
                    {completed && <span className="ml-auto font-bold">{obj.rewardLabel}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Debriefing */}
          <div className="p-2 bg-muted/10 border border-border/40 rounded text-[10px] text-muted-foreground space-y-1">
            <p className="font-bold text-foreground text-xs">📊 Debriefing</p>
            <div className="flex gap-3">
              <span>👁️ Stealth: {mission.choices.filter(c => c === 'stealth').length}</span>
              <span>⚔️ Standaard: {mission.choices.filter(c => c === 'standard').length}</span>
              <span>🔥 Agressief: {mission.choices.filter(c => c === 'aggressive').length}</span>
            </div>
            <p>Moreel: {mission.morale >= 70 ? '🟢 Hoog' : mission.morale <= 30 ? '🔴 Laag' : '🟡 Stabiel'} ({mission.morale}%)</p>
            {mission.totalHeatGain > 0 && <p>🌡️ Heat opgebouwd: +{mission.totalHeatGain}</p>}
            {mission.hiddenEncounterTriggered && <p className="text-purple-400">🔮 Verborgen encounter ontdekt!</p>}
            {mission.carryOver.bonusLootMod > 1 && <p className="text-gold">🔥 Loot bonus: +{Math.round((mission.carryOver.bonusLootMod - 1) * 100)}%</p>}
          </div>

          {mission.droppedWeapon && (
            <div>
              <p className="text-xs text-gold font-bold mb-1">🗡️ Wapen gevonden!</p>
              <WeaponCard weapon={mission.droppedWeapon} compact />
            </div>
          )}
          <Button onClick={() => dispatch({ type: 'COLLECT_CAMPAIGN_MISSION_REWARDS' })} className="w-full" size="sm">
            Verzamel Beloningen
          </Button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-3 bg-blood/10 border border-blood/30 rounded-lg">
          <X className="w-6 h-6 text-blood mx-auto mb-1" />
          <h3 className="font-bold text-blood">Missie Mislukt</h3>
          <p className="text-xs text-muted-foreground mt-1">Moreel: {mission.morale}% — Probeer het later opnieuw</p>
          <Button onClick={() => dispatch({ type: 'END_CAMPAIGN_MISSION' })} variant="outline" className="mt-2" size="sm">
            Terug
          </Button>
        </motion.div>
      )}
    </div>
  );
}
