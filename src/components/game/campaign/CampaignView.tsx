import { useGame } from '@/contexts/GameContext';
import { ViewWrapper } from '../ui/ViewWrapper';
import { CAMPAIGN_CHAPTERS, canStartMission, canFightBoss, getDifficultySkullRating } from '@/game/campaign';
import type { CampaignChapter, CampaignChapterProgress, CampaignDifficulty } from '@/game/campaign';
import { BOSS_TROPHIES } from '@/game/campaignRewards';
import { Lock, Swords, CheckCircle2, Star, Trophy, ChevronDown, ChevronRight, Zap, Skull, Target } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BossFightView } from './BossFightView';
import { CampaignMissionView } from './CampaignMissionView';
import { TrophyVitrine } from './ChapterMap';

const DIFFICULTY_LABELS: Record<CampaignDifficulty, string> = { normal: 'Normaal', hard: 'Moeilijk', nightmare: 'Nachtmerrie' };
const DIFFICULTY_COLORS: Record<CampaignDifficulty, string> = { normal: 'text-emerald', hard: 'text-amber-400', nightmare: 'text-blood' };
const DIFFICULTIES: CampaignDifficulty[] = ['normal', 'hard', 'nightmare'];

function DifficultySkullsDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Skull key={i} className={`w-3 h-3 ${i <= rating ? 'text-blood' : 'text-muted-foreground/20'}`} />
      ))}
    </div>
  );
}

function ChapterCard({ chapter, progress }: { chapter: CampaignChapter; progress: CampaignChapterProgress }) {
  const { state, dispatch } = useGame();
  const [open, setOpen] = useState(progress.unlocked && !progress.completed);
  const campaignState = state.campaign;

  const completedMissions = progress.missions.filter(m => m.completed).length;
  const totalMissions = chapter.missions.length;
  const allMissionsDone = completedMissions === totalMissions;
  const bossDefeated = progress.boss.killCount > 0;

  const totalStars = progress.missions.reduce((sum, m) => {
    if (!m.bestRating) return sum;
    return sum + m.bestRating.length;
  }, 0);
  const maxStars = totalMissions * 3;
  const perfectChapter = totalStars >= maxStars;

  if (!progress.unlocked) {
    return (
      <div className="border border-border/50 rounded-lg p-4 opacity-50 bg-muted/20">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <div>
            <h3 className="font-bold text-muted-foreground">{chapter.icon} Chapter {chapter.number}: {chapter.title}</h3>
            <p className="text-xs text-muted-foreground">Voltooi Chapter {chapter.number - 1} om te ontgrendelen</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${progress.completed ? 'border-gold/40 bg-gold/5' : 'border-primary/30 bg-card/80'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/20 transition-colors"
      >
        <span className="text-2xl">{chapter.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground text-sm">Chapter {chapter.number}: {chapter.title}</h3>
            {progress.completed && <CheckCircle2 className="w-4 h-4 text-gold" />}
          </div>
          <p className="text-xs text-muted-foreground">{chapter.subtitle}</p>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={(completedMissions / totalMissions) * 100} className="h-1.5 flex-1" />
            <span className="text-[10px] text-muted-foreground">{completedMissions}/{totalMissions}</span>
            {completedMissions > 0 && (
              <span className="text-[10px] text-gold">
                {'⭐'.repeat(Math.min(3, Math.floor(totalStars / totalMissions)))}
              </span>
            )}
            {bossDefeated && <Swords className="w-3 h-3 text-blood" />}
          </div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              <p className="text-xs text-muted-foreground italic mb-3">{chapter.description}</p>

              {/* Difficulty selector */}
              {progress.completed && (
                <div className="flex items-center gap-2 p-2 rounded bg-muted/20 border border-border/40 mb-2">
                  <span className="text-[10px] text-muted-foreground">Moeilijkheid:</span>
                  <div className="flex gap-1 flex-1">
                    {DIFFICULTIES.map(d => (
                      <button
                        key={d}
                        onClick={() => dispatch({ type: 'SET_CHAPTER_DIFFICULTY', chapterId: chapter.id, difficulty: d })}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                          progress.difficulty === d
                            ? `${DIFFICULTY_COLORS[d]} border-current bg-current/10 font-bold`
                            : 'text-muted-foreground border-border/40 hover:border-muted-foreground/40'
                        }`}
                      >
                        {DIFFICULTY_LABELS[d]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Missions */}
              {chapter.missions.map((mission, i) => {
                const mProgress = progress.missions[i] || { completed: false, bestRating: null, completedAt: null, missionId: mission.id };
                const canStart = canStartMission(campaignState, chapter.id, mission.id, state.player.level);
                const isLocked = !canStart && !mProgress.completed;
                const diffRating = getDifficultySkullRating(mission.minLevel, state.player.level);

                return (
                  <div key={mission.id} className={`flex items-center gap-3 p-2 rounded border ${mProgress.completed ? 'border-emerald/30 bg-emerald/5' : isLocked ? 'border-border/30 opacity-40' : 'border-primary/20 bg-primary/5'}`}>
                    <span className="text-lg">{mProgress.completed ? '✅' : mission.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-foreground">{mission.title}</p>
                        {mission.difficultyRating && <DifficultySkullsDisplay rating={diffRating} />}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{mission.description}</p>
                      <div className="flex gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        <span>⚡{mission.energyCost}</span>
                        <span>Lvl {mission.minLevel}+</span>
                        <span>💰€{mission.rewards.money[0].toLocaleString()}-{mission.rewards.money[1].toLocaleString()}</span>
                        {mission.bonusObjectives && mission.bonusObjectives.length > 0 && (
                          <span className="text-gold"><Target className="w-3 h-3 inline" /> {mission.bonusObjectives.length}</span>
                        )}
                      </div>
                    </div>
                    {canStart && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs h-7"
                        disabled={state.energy < mission.energyCost}
                        onClick={() => dispatch({ type: 'START_CAMPAIGN_MISSION', chapterId: chapter.id, missionId: mission.id })}
                      >
                        <Zap className="w-3 h-3 mr-1" /> {mProgress.completed ? 'Herspeel' : 'Start'}
                      </Button>
                    )}
                    {mProgress.completed && mProgress.bestRating && (
                      <div className="flex gap-0">
                        {[1, 2, 3].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= (mProgress.bestRating?.length || 0) ? 'text-gold fill-gold' : 'text-muted-foreground/20'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Perfect chapter bonus */}
              {perfectChapter && (
                <div className="p-2 rounded bg-gold/10 border border-gold/30 flex items-center gap-2">
                  <span className="text-lg">🌟</span>
                  <div>
                    <p className="text-xs font-bold text-gold">Perfect Chapter!</p>
                    <p className="text-[10px] text-muted-foreground">Alle missies met 3 sterren voltooid</p>
                  </div>
                </div>
              )}

              {/* Boss */}
              <div className={`mt-3 p-3 rounded-lg border-2 ${allMissionsDone ? 'border-blood/40 bg-blood/5' : 'border-border/30 opacity-40'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{chapter.boss.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-blood">{chapter.boss.name}</p>
                    <p className="text-xs text-muted-foreground">{chapter.boss.title}</p>
                    {progress.boss.killCount > 0 && (
                      <p className="text-[10px] text-gold mt-0.5">
                        <Trophy className="w-3 h-3 inline mr-1" />
                        {progress.boss.killCount}x verslagen
                        {progress.boss.bestTime && ` | Beste: ${progress.boss.bestTime} beurten`}
                      </p>
                    )}
                  </div>
                  {canFightBoss(campaignState, chapter.id, state.player.level) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs h-8"
                      onClick={() => dispatch({ type: 'START_BOSS_FIGHT_CAMPAIGN', chapterId: chapter.id })}
                    >
                      <Swords className="w-3 h-3 mr-1" />
                      {progress.boss.killCount > 0 ? 'Herfight' : 'Vecht!'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Chapter completion reward */}
              {progress.completed && (
                <div className="mt-2 p-2 rounded bg-gold/10 border border-gold/30 flex items-center gap-2">
                  <Star className="w-4 h-4 text-gold" />
                  <div>
                    <p className="text-xs font-bold text-gold">{chapter.completionReward.title}</p>
                    <p className="text-[10px] text-muted-foreground">{chapter.completionReward.description}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CampaignView() {
  const { state } = useGame();
  const campaignState = state.campaign;

  if (campaignState.activeBossFight) return <BossFightView />;
  if (campaignState.activeCampaignMission) return <CampaignMissionView />;

  const totalBossKills = campaignState.totalBossKills;
  const completedChapters = campaignState.chapters.filter(c => c.completed).length;

  // Build boss name map for trophy vitrine
  const bossNames: Record<string, { name: string; icon: string }> = {};
  CAMPAIGN_CHAPTERS.forEach(ch => { bossNames[ch.boss.id] = { name: ch.boss.name, icon: ch.boss.icon }; });

  return (
    <ViewWrapper>
      <div className="space-y-4 pb-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-black text-foreground tracking-tight">⚔️ CAMPAGNE</h1>
          <p className="text-xs text-muted-foreground">Speel het verhaal van Noxhaven op jouw tempo</p>
          <div className="flex justify-center gap-4 text-[10px] text-muted-foreground mt-1 flex-wrap">
            <span>📖 {completedChapters}/{CAMPAIGN_CHAPTERS.length} Chapters</span>
            <span>💀 {totalBossKills} Boss kills</span>
            {(campaignState.trophies?.length || 0) > 0 && <span className="text-gold">🏆 {campaignState.trophies!.length} Trofeeën</span>}
            {(campaignState.missionStreak || 0) >= 3 && <span className="text-gold font-bold">🔥 {campaignState.missionStreak}x Streak!</span>}
            {(campaignState.totalEncountersCompleted || 0) > 0 && <span>⚔️ {campaignState.totalEncountersCompleted} Encounters</span>}
          </div>
        </div>

        {/* Trophy Vitrine */}
        {campaignState.trophies && campaignState.trophies.length > 0 && (
          <TrophyVitrine trophies={campaignState.trophies} bossNames={bossNames} />
        )}

        {/* Chapters */}
        <div className="space-y-3">
          {CAMPAIGN_CHAPTERS.map((chapter) => {
            const progress = campaignState.chapters.find(c => c.chapterId === chapter.id);
            if (!progress) return null;
            return <ChapterCard key={chapter.id} chapter={chapter} progress={progress} />;
          })}
        </div>
      </div>
    </ViewWrapper>
  );
}
