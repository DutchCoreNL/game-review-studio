import { useGame } from '@/contexts/GameContext';
import { getMissionDef } from '@/game/campaign';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, Trophy, X } from 'lucide-react';
import { WeaponCard } from '../weapons/WeaponCard';

export function CampaignMissionView() {
  const { state, dispatch } = useGame();
  const mission = state.campaign.activeCampaignMission!;
  const mDef = getMissionDef(mission.missionId)!;
  const progress = (mission.currentEncounter / mission.totalEncounters) * 100;

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
      </div>

      {/* Log */}
      <div className="bg-muted/10 border border-border/40 rounded-lg p-3 space-y-1.5 max-h-48 overflow-y-auto game-scroll">
        {mission.log.map((entry, i) => (
          <p key={i} className="text-xs text-muted-foreground">{entry}</p>
        ))}
      </div>

      {/* Actions / Result */}
      {!mission.finished ? (
        <Button onClick={() => dispatch({ type: 'ADVANCE_CAMPAIGN_MISSION' })} className="w-full" size="sm">
          <ChevronRight className="w-4 h-4 mr-1" />
          Volgende Encounter ({mission.currentEncounter + 1}/{mission.totalEncounters})
        </Button>
      ) : mission.success ? (
        <div className="space-y-3">
          <div className="text-center p-3 bg-gold/10 border border-gold/30 rounded-lg">
            <Trophy className="w-6 h-6 text-gold mx-auto mb-1" />
            <h3 className="font-bold text-gold">Missie Voltooid!</h3>
            <div className="flex justify-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>💰 €{mission.rewards.money.toLocaleString()}</span>
              <span>⭐ {mission.rewards.rep} rep</span>
              <span>✨ {mission.rewards.xp} xp</span>
            </div>
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
