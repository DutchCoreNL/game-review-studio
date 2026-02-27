import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PlayerCourse {
  id: string;
  course_id: string;
  started_at: string;
  completed_at: string | null;
  status: 'in_progress' | 'completed';
}

export function useEducation() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<PlayerCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const fetchCourses = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('player_education')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setCourses(data as unknown as PlayerCourse[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // Auto-refresh every 30s to check completion
  useEffect(() => {
    const iv = setInterval(fetchCourses, 30000);
    return () => clearInterval(iv);
  }, [fetchCourses]);

  const enrollCourse = useCallback(async (courseId: string, durationMinutes: number) => {
    if (!user || enrolling) return { success: false, message: 'Niet beschikbaar' };
    setEnrolling(true);
    try {
      const completedAt = new Date(Date.now() + durationMinutes * 60000).toISOString();
      const { error } = await supabase.from('player_education').insert({
        user_id: user.id,
        course_id: courseId,
        completed_at: completedAt,
        status: 'in_progress',
      } as any);
      if (error) {
        if (error.code === '23505') return { success: false, message: 'Je volgt al een cursus!' };
        return { success: false, message: error.message };
      }
      await fetchCourses();
      return { success: true, message: 'Ingeschreven!' };
    } finally {
      setEnrolling(false);
    }
  }, [user, enrolling, fetchCourses]);

  const completeCourse = useCallback(async (educationId: string) => {
    if (!user) return;
    await supabase
      .from('player_education')
      .update({ status: 'completed' } as any)
      .eq('id', educationId)
      .eq('user_id', user.id);
    await fetchCourses();
  }, [user, fetchCourses]);

  const activeCourse = courses.find(c => c.status === 'in_progress') || null;
  const completedCourseIds = courses.filter(c => c.status === 'completed').map(c => c.course_id);

  return { courses, activeCourse, completedCourseIds, loading, enrolling, enrollCourse, completeCourse, fetchCourses };
}
