import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEducation } from '@/hooks/useEducation';
import { COURSES, formatDuration, formatTimeRemaining, Course } from '@/game/education';
import { getGameText } from '@/i18n/gameData';
import { ViewWrapper } from './ui/ViewWrapper';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { StatBar } from './ui/StatBar';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Clock, CheckCircle2, BookOpen, Lock } from 'lucide-react';
import educationBg from '@/assets/education-bg.jpg';

function CourseCard({ course, completed, active, activeCourse, onEnroll, onComplete, level }: {
  course: Course;
  completed: boolean;
  active: boolean;
  activeCourse: any;
  onEnroll: (id: string, dur: number) => void;
  onComplete: (id: string) => void;
  level: number;
}) {
  const [timeLeft, setTimeLeft] = useState('');
  const [progress, setProgress] = useState(0);
  const { t, lang } = useLanguage();
  const locked = level < course.reqLevel;

  const courseName = getGameText(lang, 'courses', course.id, 'name', course.name);
  const courseDesc = getGameText(lang, 'courses', course.id, 'desc', course.description);
  const coursePerk = getGameText(lang, 'courses', course.id, 'perk', course.perk);

  useEffect(() => {
    if (!active || !activeCourse) return;
    const update = () => {
      const end = new Date(activeCourse.completed_at!).getTime();
      const start = new Date(activeCourse.started_at).getTime();
      const now = Date.now();
      const total = end - start;
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / total) * 100);
      setProgress(pct);
      if (now >= end) {
        setTimeLeft(t.education.done);
        setProgress(100);
      } else {
        setTimeLeft(formatTimeRemaining(activeCourse.completed_at!));
      }
    };
    update();
    const iv = setInterval(update, 5000);
    return () => clearInterval(iv);
  }, [active, activeCourse, t.education.done]);

  const isReady = active && timeLeft === t.education.done;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`game-card border-l-[3px] transition-all ${
        completed ? 'border-l-emerald' : active ? 'border-l-gold' : locked ? 'border-l-border opacity-60' : 'border-l-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{course.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-foreground">{courseName}</h3>
            {completed && <CheckCircle2 size={14} className="text-emerald" />}
            {locked && <Lock size={12} className="text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{courseDesc}</p>
          <div className="flex items-center gap-3 mt-2 text-[0.65rem]">
            <span className="text-gold font-semibold">{coursePerk}</span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock size={10} /> {formatDuration(course.durationMinutes)}
            </span>
            {locked && (
              <span className="text-blood">Level {course.reqLevel} {t.education.levelRequired}</span>
            )}
          </div>

          {active && (
            <div className="mt-3 space-y-1.5">
              <Progress value={progress} className="h-2 bg-muted" />
              <div className="flex items-center justify-between text-[0.6rem]">
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
                <span className={isReady ? 'text-emerald font-bold' : 'text-gold'}>{timeLeft}</span>
              </div>
              {isReady && (
                <GameButton size="sm" onClick={() => onComplete(activeCourse.id)} fullWidth>
                  <CheckCircle2 size={14} /> {t.education.finish}
                </GameButton>
              )}
            </div>
          )}

          {!completed && !active && !locked && (
            <GameButton size="sm" variant="gold" onClick={() => onEnroll(course.id, course.durationMinutes)} className="mt-2">
              <BookOpen size={14} /> {t.education.enroll}
            </GameButton>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function EducationView() {
  const { state } = useGame();
  const { t } = useLanguage();
  const { activeCourse, completedCourseIds, loading, enrollCourse, completeCourse } = useEducation();
  const [toast, setToast] = useState<string | null>(null);

  const handleEnroll = async (courseId: string, dur: number) => {
    if (!!activeCourse) { setToast(t.education.alreadyEnrolled); return; }
    const res = await enrollCourse(courseId, dur);
    setToast(res.message);
  };

  const handleComplete = async (eduId: string) => {
    await completeCourse(eduId);
    setToast(t.education.courseCompleted);
  };

  const categories = [
    { key: 'crime', label: t.education.crime, icon: '🔫' },
    { key: 'trade', label: t.education.trade, icon: '💰' },
    { key: 'combat', label: t.education.combat, icon: '⚔️' },
    { key: 'tech', label: t.education.tech, icon: '💻' },
    { key: 'social', label: t.education.social, icon: '🤝' },
  ];

  return (
    <ViewWrapper bg={educationBg}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
          <GraduationCap size={18} className="text-gold" />
        </div>
        <div>
          <h2 className="font-display text-lg text-gold uppercase tracking-widest font-bold">{t.education.title}</h2>
          <p className="text-[0.55rem] text-muted-foreground">{t.education.subtitle}</p>
        </div>
      </div>

      {activeCourse && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="game-card border-l-[3px] border-l-gold mb-3">
          <div className="flex items-center gap-3">
            <GraduationCap size={20} className="text-gold" />
            <div className="flex-1">
              <p className="text-xs font-bold text-gold">{t.education.activeCourse}</p>
              <p className="text-[0.65rem] text-muted-foreground">
                {COURSES.find(c => c.id === activeCourse.course_id)?.name || activeCourse.course_id}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="game-card text-center">
          <p className="text-lg font-bold text-emerald">{completedCourseIds.length}</p>
          <p className="text-[0.5rem] text-muted-foreground uppercase">{t.education.completed}</p>
        </div>
        <div className="game-card text-center">
          <p className="text-lg font-bold text-gold">{COURSES.length - completedCourseIds.length}</p>
          <p className="text-[0.5rem] text-muted-foreground uppercase">{t.education.available}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 py-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-border bg-card animate-pulse space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded bg-muted/30 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-2/5 rounded bg-muted/30" />
                  <div className="h-3 w-4/5 rounded bg-muted/30" />
                  <div className="h-2.5 w-1/3 rounded bg-muted/30" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map(cat => {
            const catCourses = COURSES.filter(c => c.category === cat.key);
            if (catCourses.length === 0) return null;
            return (
              <div key={cat.key}>
                <SectionHeader title={cat.label} icon={<span>{cat.icon}</span>} />
                <div className="space-y-2">
                  {catCourses.map(course => (
                    <CourseCard key={course.id} course={course} completed={completedCourseIds.includes(course.id)} active={activeCourse?.course_id === course.id}
                      activeCourse={activeCourse} onEnroll={handleEnroll} onComplete={handleComplete} level={state.player.level} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            onAnimationComplete={() => setTimeout(() => setToast(null), 2000)}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card border border-border px-4 py-2 rounded-lg text-xs font-semibold shadow-lg z-50">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </ViewWrapper>
  );
}