import { useGame } from '@/contexts/GameContext';
import { getMissionDef, type EncounterChoice } from '@/game/campaign';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, X, Eye, Swords, Flame, Star } from 'lucide-react';
import { WeaponCard } from '../weapons/WeaponCard';
import { motion, AnimatePresence } from 'framer-motion';

const ENCOUNTER_TYPE_INFO = {
  combat: { icon: '⚔️', label: 'Gevecht', color: 'text-blood' },
  trap: { icon: '🪤', label: 'Val', color: 'text-amber-400' },
  npc: { icon: '🗣️', label: 'Ontmoeting', color: 'text-emerald' },
  exploration: { icon: '🔍', label: 'Verkenning', color: 'text-primary' },
};

const CHOICE_INFO: Record<EncounterChoice, { icon: React.ReactNode; label: string; desc: string; color: string }> = {
  stealth: { icon: <Eye className="w-4 h-4" />, label: 'Stealth', desc: 'Laag risico, minder loot', color: 'bg-emerald/10 border-emerald text-emerald hover:bg-emerald/20' },
  standard: { icon: <Swords className="w-4 h-4" />, label: 'Standaard', desc: 'Gebalanceerd', color: 'bg-primary/10 border-primary text-primary hover:bg-primary/20' },
  aggressive: { icon: <Flame className="w-4 h-4" />, label: 'Agressief', desc: 'Hoog risico, meer loot + heat', color: 'bg-blood/10 border-blood text-blood hover:bg-blood/20' },
};

export function CampaignMissionView() {
  const { state, dispatch } = useGame();
  const mission = state.campaign.activeCampaignMission!;
  const mDef = getMissionDef(mission.missionId)!;
  const progress = (mission.currentEncounter / mission.totalEncounters) * 100;
  const encType = mission.currentEncounterType;
  const encInfo = ENCOUNTER_TYPE_INFO[encType];

  const handleChoice = (choice: EncounterChoice) => {
    dispatch({ type: 'ADVANCE_CAMPAIGN_MISSION', choice });
  };

  return (
    <div className="space-y-3 pb-4">
      {/* Header */}
      <div className="text-center p-3 bg-primary/10 border border-primary/30 rounded-lg">
        <div className="text-3xl mb-1">{mDef.icon}</div>
        <h2 className="text-lg font-black text-foreground">{mDef.title}</h2>
        <p className="text-xs text-muted-foreground">{mDef.description}</p>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
          <span>Voortgang</span>
          <span>{mission.currentEncounter}/{mission.totalEncounters}</span>
        </div>
        <Progress value={progress} className="h-2" />
        {/* Encounter type indicators */}
        <div className="flex gap-1 mt-1 justify-center">
          {mission.encounterTypes.map((t, i) => {
            const info = ENCOUNTER_TYPE_INFO[t];
            const done = i < mission.currentEncounter;
            const current = i === mission.currentEncounter && !mission.finished;
            return (
              <span
                key={i}
                className={`text-xs ${done ? 'opacity-30' : current ? `${info.color} font-bold` : 'opacity-50'}`}
                title={info.label}
              >
                {info.icon}
              </span>
            );
          })}
        </div>
      </div>

      {/* Log */}
      <div className="bg-muted/10 border border-border/40 rounded-lg p-3 space-y-1.5 max-h-36 overflow-y-auto game-scroll">
        {mission.log.map((entry, i) => (
          <p key={i} className="text-xs text-muted-foreground">{entry}</p>
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
            {/* Current encounter card */}
            <div className={`p-3 rounded-lg border border-border/60 bg-card/50`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{encInfo.icon}</span>
                <div>
                  <p className={`text-sm font-bold ${encInfo.color}`}>
                    {encInfo.label} — Encounter {mission.currentEncounter + 1}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Kies je aanpak</p>
                </div>
              </div>

              {/* Choice buttons */}
              <div className="grid grid-cols-3 gap-2">
                {(['stealth', 'standard', 'aggressive'] as EncounterChoice[]).map(choice => {
                  const info = CHOICE_INFO[choice];
                  return (
                    <motion.button
                      key={choice}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleChoice(choice)}
                      className={`p-2 rounded border text-center transition-all ${info.color}`}
                    >
                      <div className="flex justify-center mb-1">{info.icon}</div>
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
        <div className="space-y-3">
          <div className="text-center p-3 bg-gold/10 border border-gold/30 rounded-lg">
            <Trophy className="w-6 h-6 text-gold mx-auto mb-1" />
            <h3 className="font-bold text-gold">Missie Voltooid!</h3>
            {/* Star rating */}
            <div className="flex justify-center gap-0.5 mt-1">
              {[1, 2, 3].map(s => (
                <Star key={s} className={`w-5 h-5 ${s <= mission.rating ? 'text-gold fill-gold' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
            <div className="flex justify-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>💰 €{mission.rewards.money.toLocaleString()}</span>
              <span>⭐ {mission.rewards.rep} rep</span>
              <span>✨ {mission.rewards.xp} xp</span>
            </div>
            {mission.rating >= 2 && (
              <p className="text-[10px] text-gold mt-1">
                +{mission.rating === 3 ? '50' : '20'}% bonus beloningen!
              </p>
            )}
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
        </div>
      ) : (
        <div className="text-center p-3 bg-blood/10 border border-blood/30 rounded-lg">
          <X className="w-6 h-6 text-blood mx-auto mb-1" />
          <h3 className="font-bold text-blood">Missie Mislukt</h3>
          <p className="text-xs text-muted-foreground mt-1">Probeer het later opnieuw</p>
          <Button onClick={() => dispatch({ type: 'END_CAMPAIGN_MISSION' })} variant="outline" className="mt-2" size="sm">
            Terug
          </Button>
        </div>
      )}
    </div>
  );
}
