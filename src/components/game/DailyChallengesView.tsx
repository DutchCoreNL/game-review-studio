import { useGame } from '@/contexts/GameContext';
import { getChallengeTemplate, CHALLENGE_CATEGORIES } from '@/game/dailyChallenges';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { StatBar } from './ui/StatBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Gift, Check, Clock, Trophy, Star } from 'lucide-react';

export function DailyChallengesView() {
  const { state, dispatch, showToast } = useGame();

  const challenges = state.dailyChallenges || [];
  const completedCount = challenges.filter(c => c.completed).length;
  const claimedCount = challenges.filter(c => c.claimed).length;
  const allClaimed = claimedCount === challenges.length && challenges.length > 0;
  const totalCompleted = state.challengesCompleted || 0;

  const handleClaim = (templateId: string) => {
    dispatch({ type: 'CLAIM_CHALLENGE_REWARD', templateId });
    const template = getChallengeTemplate(templateId);
    if (template) {
      showToast(`🎯 ${template.name} voltooid! +€${template.rewardMoney.toLocaleString()}`);
    }
  };

  return (
    <div>
      <SectionHeader title="Dagelijkse Uitdagingen" icon={<Target size={12} />} />

      {/* Progress summary */}
      <motion.div
        className="game-card border-l-[3px] border-l-gold mb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center">
              <Trophy size={14} className="text-gold" />
            </div>
            <div>
              <h4 className="font-bold text-xs">Dag {state.day} Uitdagingen</h4>
              <p className="text-[0.5rem] text-muted-foreground">
                {completedCount}/{challenges.length} voltooid | {totalCompleted} totaal
              </p>
            </div>
          </div>
          {allClaimed && (
            <span className="text-[0.5rem] font-bold text-emerald bg-emerald/10 px-2 py-1 rounded flex items-center gap-1">
              <Check size={10} /> KLAAR
            </span>
          )}
        </div>

        {/* Progress bar */}
        <StatBar
          value={completedCount}
          max={Math.max(1, challenges.length)}
          color="gold"
          label={`${completedCount}/${challenges.length}`}
          showLabel
        />
      </motion.div>

      {/* Challenges list */}
      {challenges.length === 0 ? (
        <div className="game-card text-center py-8">
          <Clock size={24} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            Sluit een dag af om uitdagingen te ontvangen!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {challenges.map((challenge, i) => {
              const template = getChallengeTemplate(challenge.templateId);
              if (!template) return null;
              const category = CHALLENGE_CATEGORIES[template.category];
              const progressPct = Math.min(100, (challenge.progress / challenge.target) * 100);

              return (
                <motion.div
                  key={challenge.templateId}
                  className={`game-card border-l-[3px] ${
                    challenge.claimed ? 'border-l-emerald opacity-60' : 
                    challenge.completed ? 'border-l-gold' : 'border-l-border'
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: challenge.claimed ? 0.6 : 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{template.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs">{template.name}</h4>
                          <span className={`text-[0.4rem] px-1.5 py-0.5 rounded font-bold uppercase ${category.bgColor} ${category.color}`}>
                            {category.label}
                          </span>
                        </div>
                        <p className="text-[0.5rem] text-muted-foreground">{template.desc}</p>
                      </div>
                    </div>
                    {challenge.claimed && (
                      <Check size={14} className="text-emerald flex-shrink-0" />
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[0.45rem] text-muted-foreground uppercase">Voortgang</span>
                      <span className={`text-[0.5rem] font-bold ${challenge.completed ? 'text-gold' : 'text-muted-foreground'}`}>
                        {template.checkType === 'low_heat' 
                          ? (challenge.completed ? 'Heat < 20 ✓' : `Heat: ${state.heat}`)
                          : template.checkType === 'earned' || template.checkType === 'washed' || template.checkType === 'casino_won'
                            ? `€${challenge.progress.toLocaleString()} / €${challenge.target.toLocaleString()}`
                            : `${challenge.progress} / ${challenge.target}`
                        }
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${challenge.completed ? 'bg-gold' : 'bg-muted-foreground/40'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  {/* Rewards */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2 text-[0.45rem]">
                      <span className="text-gold font-bold">€{template.rewardMoney.toLocaleString()}</span>
                      <span className="text-ice font-bold">+{template.rewardXp} XP</span>
                      <span className="text-game-purple font-bold">+{template.rewardRep} Rep</span>
                    </div>

                    {challenge.completed && !challenge.claimed && (
                      <GameButton
                        variant="gold"
                        size="sm"
                        icon={<Gift size={10} />}
                        onClick={() => handleClaim(challenge.templateId)}
                        glow
                      >
                        CLAIM
                      </GameButton>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 game-card border-l-[3px] border-l-ice">
        <div className="flex items-start gap-2">
          <Star size={12} className="text-ice flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-[0.6rem] text-ice mb-0.5">Tips</h4>
            <ul className="text-[0.5rem] text-muted-foreground space-y-0.5">
              <li>• Uitdagingen veranderen elke dag bij het afsluiten</li>
              <li>• Claim beloningen voordat de dag eindigt</li>
              <li>• Hogere levels ontgrendelen moeilijkere uitdagingen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
