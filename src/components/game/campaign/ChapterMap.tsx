import { motion } from 'framer-motion';
import type { CampaignChapter, CampaignChapterProgress } from '@/game/campaign';
import { Lock, CheckCircle2, Swords, Star, Trophy } from 'lucide-react';

interface ChapterMapProps {
  chapters: CampaignChapter[];
  progress: CampaignChapterProgress[];
  trophies: string[];
  onSelectChapter: (chapterId: string) => void;
  selectedChapter: string | null;
}

export function ChapterMap({ chapters, progress, trophies, onSelectChapter, selectedChapter }: ChapterMapProps) {
  return (
    <div className="relative py-4">
      {/* Vertical line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald/50 via-primary/30 to-muted/20" />

      <div className="space-y-1">
        {chapters.map((ch, i) => {
          const prog = progress.find(p => p.chapterId === ch.id);
          const isUnlocked = prog?.unlocked ?? false;
          const isCompleted = prog?.completed ?? false;
          const bossKills = prog?.boss.killCount ?? 0;
          const isSelected = selectedChapter === ch.id;
          const hasTrophy = trophies.includes(ch.boss.id);

          const completedMissions = prog?.missions.filter(m => m.completed).length ?? 0;
          const totalMissions = ch.missions.length;

          return (
            <motion.div key={ch.id} className="relative flex items-start gap-3 pl-2">
              {/* Node */}
              <motion.button
                onClick={() => isUnlocked && onSelectChapter(ch.id)}
                disabled={!isUnlocked}
                whileHover={isUnlocked ? { scale: 1.1 } : {}}
                whileTap={isUnlocked ? { scale: 0.95 } : {}}
                className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                  isCompleted
                    ? 'bg-gold/20 border-gold text-gold shadow-lg shadow-gold/20'
                    : isUnlocked
                    ? isSelected
                      ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20'
                      : 'bg-card border-primary/40 text-primary hover:border-primary'
                    : 'bg-muted/20 border-border/40 text-muted-foreground cursor-not-allowed'
                }`}
              >
                {!isUnlocked ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className="text-sm">{ch.icon}</span>
                )}
              </motion.button>

              {/* Chapter info */}
              <motion.button
                onClick={() => isUnlocked && onSelectChapter(ch.id)}
                disabled={!isUnlocked}
                className={`flex-1 text-left p-2 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-primary/10 border border-primary/30'
                    : isUnlocked
                    ? 'hover:bg-muted/20'
                    : 'opacity-40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-bold ${isCompleted ? 'text-gold' : isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Ch.{ch.number}: {ch.title}
                  </p>
                  {hasTrophy && <Trophy className="w-3 h-3 text-gold" />}
                </div>
                <p className="text-[10px] text-muted-foreground">{ch.subtitle}</p>
                {isUnlocked && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isCompleted ? 'bg-gold' : 'bg-primary'}`}
                        style={{ width: `${(completedMissions / totalMissions) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{completedMissions}/{totalMissions}</span>
                    {bossKills > 0 && <Swords className="w-3 h-3 text-blood" />}
                  </div>
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function TrophyVitrine({ trophies, bossNames }: { trophies: string[]; bossNames: Record<string, { name: string; icon: string }> }) {
  if (!trophies.length) return null;

  return (
    <div className="p-3 bg-gold/5 border border-gold/20 rounded-lg">
      <h3 className="text-xs font-bold text-gold mb-2 flex items-center gap-1.5">
        <Trophy className="w-3.5 h-3.5" /> Trofeeën Vitrine
      </h3>
      <div className="flex flex-wrap gap-2">
        {trophies.map(bossId => {
          const boss = bossNames[bossId];
          if (!boss) return null;
          return (
            <motion.div
              key={bossId}
              whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
              className="relative group"
            >
              <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-lg cursor-default">
                {boss.icon}
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-card border border-border rounded text-[9px] text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                {boss.name}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
