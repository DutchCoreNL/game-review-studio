import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useEducation } from '@/hooks/useEducation';
import { COURSES, formatDuration, formatTimeRemaining, Course } from '@/game/education';
import { ViewWrapper } from './ui/ViewWrapper';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Clock, CheckCircle2, BookOpen, Lock } from 'lucide-react';

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
  const locked = level < course.reqLevel;

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
        setTimeLeft('Klaar!');
        setProgress(100);
      } else {
        setTimeLeft(formatTimeRemaining(activeCourse.completed_at!));
      }
    };
    update();
    const iv = setInterval(update, 5000);
    return () => clearInterval(iv);
  }, [active, activeCourse]);

  const isReady = active && timeLeft === 'Klaar!';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-lg border p-4 transition-all ${
        completed
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : active
          ? 'border-gold/30 bg-gold/5'
          : locked
          ? 'border-border/30 bg-muted/5 opacity-60'
          : 'border-border bg-card hover:border-gold/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{course.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-foreground">{course.name}</h3>
            {completed && <CheckCircle2 size={14} className="text-emerald-400" />}
            {locked && <Lock size={12} className="text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{course.description}</p>
          <div className="flex items-center gap-3 mt-2 text-[0.65rem]">
            <span className="text-gold font-semibold">{course.perk}</span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock size={10} /> {formatDuration(course.durationMinutes)}
            </span>
            {locked && (
              <span className="text-blood">Level {course.reqLevel} vereist</span>
            )}
          </div>

          {active && (
            <div className="mt-3 space-y-1.5">
              <Progress value={progress} className="h-2 bg-muted" />
              <div className="flex items-center justify-between text-[0.6rem]">
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
                <span className={isReady ? 'text-emerald-400 font-bold' : 'text-gold'}>{timeLeft}</span>
              </div>
              {isReady && (
                <GameButton size="sm" onClick={() => onComplete(activeCourse.id)} className="w-full mt-1">
                  <CheckCircle2 size={14} /> Afronden
                </GameButton>
              )}
            </div>
          )}

          {!completed && !active && !locked && (
            <GameButton
              size="sm"
              variant="gold"
              onClick={() => onEnroll(course.id, course.durationMinutes)}
              className="mt-2"
            >
              <BookOpen size={14} /> Inschrijven
            </GameButton>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function EducationView() {
  const { state } = useGame();
  const { activeCourse, completedCourseIds, loading, enrollCourse, completeCourse } = useEducation();
  const [toast, setToast] = useState<string | null>(null);

  const handleEnroll = async (courseId: string, dur: number) => {
    const hasActive = !!activeCourse;
    if (hasActive) {
      setToast('Je volgt al een cursus!');
      return;
    }
    const res = await enrollCourse(courseId, dur);
    setToast(res.message);
  };

  const handleComplete = async (eduId: string) => {
    await completeCourse(eduId);
    setToast('Cursus afgerond! Perk ontgrendeld.');
  };

  const categories = [
    { key: 'crime', label: 'Misdaad', icon: '🔫' },
    { key: 'trade', label: 'Handel', icon: '💰' },
    { key: 'combat', label: 'Gevecht', icon: '⚔️' },
    { key: 'tech', label: 'Technologie', icon: '💻' },
    { key: 'social', label: 'Sociaal', icon: '🤝' },
  ];

  return (
    <ViewWrapper>
      <SectionHeader title="Educatie" />

      {/* Active course banner */}
      {activeCourse && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 p-3 rounded-lg bg-gold/10 border border-gold/20 flex items-center gap-3"
        >
          <GraduationCap size={20} className="text-gold" />
          <div className="flex-1">
            <p className="text-xs font-bold text-gold">Actieve cursus</p>
            <p className="text-[0.65rem] text-muted-foreground">
              {COURSES.find(c => c.id === activeCourse.course_id)?.name || activeCourse.course_id}
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 rounded-lg bg-card border border-border p-3 text-center">
          <p className="text-lg font-bold text-foreground">{completedCourseIds.length}</p>
          <p className="text-[0.6rem] text-muted-foreground uppercase tracking-wider">Afgerond</p>
        </div>
        <div className="flex-1 rounded-lg bg-card border border-border p-3 text-center">
          <p className="text-lg font-bold text-foreground">{COURSES.length - completedCourseIds.length}</p>
          <p className="text-[0.6rem] text-muted-foreground uppercase tracking-wider">Beschikbaar</p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground text-sm py-8">Laden...</p>
      ) : (
        <div className="space-y-6">
          {categories.map(cat => {
            const catCourses = COURSES.filter(c => c.category === cat.key);
            if (catCourses.length === 0) return null;
            return (
              <div key={cat.key}>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span>{cat.icon}</span> {cat.label}
                </h2>
                <div className="space-y-2">
                  {catCourses.map(course => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      completed={completedCourseIds.includes(course.id)}
                      active={activeCourse?.course_id === course.id}
                      activeCourse={activeCourse}
                      onEnroll={handleEnroll}
                      onComplete={handleComplete}
                      level={state.player.level}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onAnimationComplete={() => setTimeout(() => setToast(null), 2000)}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card border border-border px-4 py-2 rounded-lg text-xs font-semibold shadow-lg z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </ViewWrapper>
  );
}
