import { useGame } from '@/contexts/GameContext';
import { getMissionDef, type EncounterChoice, type EncounterType } from '@/game/campaign';
import { MISSION_BRIEFINGS, ENCOUNTER_TYPE_CONFIG } from '@/game/campaignNarratives';
import { CHAPTER_DISTRICT_IMAGES } from '@/assets/items';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, X, Star, AlertTriangle } from 'lucide-react';
import { WeaponCard } from '../weapons/WeaponCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

const DEFAULT_CHOICE_INFO: Record<EncounterChoice, { label: string; desc: string; icon: string; color: string }> = {
  stealth: { label: 'Stealth', desc: 'Laag risico, minder loot', icon: '👁️', color: 'bg-emerald/10 border-emerald text-emerald hover:bg-emerald/20' },
  standard: { label: 'Standaard', desc: 'Gebalanceerd', icon: '⚔️', color: 'bg-primary/10 border-primary text-primary hover:bg-primary/20' },
  aggressive: { label: 'Agressief', desc: 'Hoog risico, meer loot + heat', icon: '🔥', color: 'bg-blood/10 border-blood text-blood hover:bg-blood/20' },
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

  const mission = state.campaign.activeCampaignMission!;
  const mDef = getMissionDef(mission.missionId)!;
  const briefing = MISSION_BRIEFINGS[mission.missionId];
  const chapterImage = CHAPTER_DISTRICT_IMAGES[mission.chapterId];
  const progress = (mission.currentEncounter / mission.totalEncounters) * 100;
  const encType = mission.currentEncounterType;
  const encConfig = ENCOUNTER_TYPE_CONFIG[encType];

  // Skip briefing if no data
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
      </div>

      {/* Encounter type indicators */}
      <div className="flex gap-1 justify-center">
        {mission.encounterTypes.map((t, i) => {
          const info = ENCOUNTER_TYPE_CONFIG[t];
          const done = i < mission.currentEncounter;
          const current = i === mission.currentEncounter && !mission.finished;
          return (
            <span
              key={i}
              className={`text-xs transition-all ${done ? 'opacity-30 scale-90' : current ? `${info.color} font-bold scale-110` : 'opacity-50'}`}
              title={info.label}
            >
              {info.icon}
            </span>
          );
        })}
      </div>

      {/* Morale */}
      <MoraleMeter morale={mission.morale} />

      {/* Log */}
      <div className="bg-muted/10 border border-border/40 rounded-lg p-3 space-y-1.5 max-h-28 overflow-y-auto game-scroll">
        {mission.log.map((entry, i) => (
          <motion.p
            key={i}
            initial={i === mission.log.length - 1 ? { opacity: 0, x: -10 } : false}
            animate={{ opacity: 1, x: 0 }}
            className={`text-xs ${entry.startsWith('🎲') ? 'text-gold font-semibold' : 'text-muted-foreground'}`}
          >
            {entry}
          </motion.p>
        ))}
      </div>

      {/* Actions / Result */}
      {!mission.finished ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={mission.currentEncounter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="p-3 rounded-lg border border-border/60 bg-card/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{encConfig.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${encConfig.color}`}>
                    {encConfig.label} — Encounter {mission.currentEncounter + 1}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{encConfig.description}</p>
                </div>
              </div>

              {/* Timer for timed encounters */}
              {encType === 'timed' && (
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-amber-400 font-bold animate-pulse">⏱️ TIJDSDRUK!</span>
                    <span className={`font-bold ${timerValue <= 3 ? 'text-blood animate-pulse' : 'text-amber-400'}`}>{timerValue}s</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                    <motion.div
                      className={`h-full ${timerValue <= 3 ? 'bg-blood' : 'bg-amber-400'}`}
                      animate={{ width: `${(timerValue / 10) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Ambush warning */}
              {encType === 'ambush' && (
                <div className="flex items-center gap-1.5 mb-2 p-1.5 rounded bg-blood/10 border border-blood/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-blood" />
                  <span className="text-[10px] text-blood font-bold">Stealth niet mogelijk bij hinderlaag!</span>
                </div>
              )}

              {/* Choice buttons */}
              <div className={`grid ${encType === 'ambush' ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                {(encType === 'ambush' ? ['standard', 'aggressive'] as EncounterChoice[] : ['stealth', 'standard', 'aggressive'] as EncounterChoice[]).map(choice => {
                  const info = getChoiceInfo(encType, choice);
                  return (
                    <motion.button
                      key={choice}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleChoice(choice)}
                      className={`p-2 rounded border text-center transition-all ${info.color}`}
                    >
                      <div className="flex justify-center mb-0.5 text-sm">{info.icon}</div>
                      <p className="text-xs font-bold">{info.label}</p>
                      <p className="text-[9px] opacity-70">{info.desc}</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
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
