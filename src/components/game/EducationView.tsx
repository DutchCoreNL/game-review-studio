import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useEducation } from '@/hooks/useEducation';
import { COURSES, formatDuration, formatTimeRemaining, Course } from '@/game/education';
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
      className={`game-card border-l-[3px] transition-all ${
        completed
          ? 'border-l-emerald'
          : active
          ? 'border-l-gold'
          : locked
          ? 'border-l-border opacity-60'
          : 'border-l-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{course.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-foreground">{course.name}</h3>
            {completed && <CheckCircle2 size={14} className="text-emerald" />}
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
                <span className={isReady ? 'text-emerald font-bold' : 'text-gold'}>{timeLeft}</span>
              </div>
              {isReady && (
                <GameButton size="sm" onClick={() => onComplete(activeCourse.id)} fullWidth>
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
    if (!!activeCourse) { setToast('Je volgt al een cursus!'); return; }
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
    <ViewWrapper bg={educationBg}>
      {/* Cinematic header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
          <GraduationCap size={18} className="text-gold" />
        </div>
        <div>
          <h2 className="font-display text-lg text-gold uppercase tracking-widest font-bold">Academie</h2>
          <p className="text-[0.55rem] text-muted-foreground">Ontgrendel permanente perks via cursussen</p>
        </div>
      </div>

      {/* Active course banner */}
      {activeCourse && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="game-card border-l-[3px] border-l-gold mb-3"
        >
          <div className="flex items-center gap-3">
            <GraduationCap size={20} className="text-gold" />
            <div className="flex-1">
              <p className="text-xs font-bold text-gold">Actieve cursus</p>
              <p className="text-[0.65rem] text-muted-foreground">
                {COURSES.find(c => c.id === activeCourse.course_id)?.name || activeCourse.course_id}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="game-card text-center">
          <p className="text-lg font-bold text-emerald">{completedCourseIds.length}</p>
          <p className="text-[0.5rem] text-muted-foreground uppercase">Afgerond</p>
        </div>
        <div className="game-card text-center">
          <p className="text-lg font-bold text-gold">{COURSES.length - completedCourseIds.length}</p>
          <p className="text-[0.5rem] text-muted-foreground uppercase">Beschikbaar</p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground text-sm py-8">Laden...</p>
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
