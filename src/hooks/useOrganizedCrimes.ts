import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { OCRole } from '@/game/organizedCrimes';

export interface OCSession {
  id: string;
  gang_id: string;
  crime_id: string;
  status: 'recruiting' | 'in_progress' | 'completed' | 'failed';
  signups: Record<string, { role: OCRole; username: string; level: number }>;
  initiated_by: string;
  initiated_at: string | null;
  completes_at: string | null;
  result: any;
  created_at: string;
}

export function useOrganizedCrimes(gangId: string | null) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<OCSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!gangId) { setLoading(false); return; }
    const { data } = await supabase
      .from('organized_crimes')
      .select('*')
      .eq('gang_id', gangId)
      .in('status', ['recruiting', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setSessions(data as unknown as OCSession[]);
    setLoading(false);
  }, [gangId]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Realtime updates
  useEffect(() => {
    if (!gangId) return;
    const sub = supabase
      .channel(`oc-${gangId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'organized_crimes',
        filter: `gang_id=eq.${gangId}`,
      }, () => { fetchSessions(); })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [gangId, fetchSessions]);

  const createOC = useCallback(async (crimeId: string) => {
    if (!user || !gangId) return { success: false, message: 'Niet beschikbaar' };
    const { error } = await supabase.from('organized_crimes').insert({
      gang_id: gangId,
      crime_id: crimeId,
      initiated_by: user.id,
      signups: {},
      status: 'recruiting',
    } as any);
    if (error) return { success: false, message: error.message };
    await fetchSessions();
    return { success: true, message: 'Organized Crime gestart! Wacht op teamleden.' };
  }, [user, gangId, fetchSessions]);

  const signup = useCallback(async (sessionId: string, role: OCRole, username: string, level: number) => {
    if (!user) return { success: false, message: 'Niet ingelogd' };
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return { success: false, message: 'Sessie niet gevonden' };
    if (session.status !== 'recruiting') return { success: false, message: 'Niet meer beschikbaar' };

    // Check if role is taken
    const taken = Object.values(session.signups).some(s => s.role === role);
    if (taken) return { success: false, message: 'Rol is al bezet!' };

    // Check if user already signed up
    if (session.signups[user.id]) return { success: false, message: 'Je bent al aangemeld!' };

    const newSignups = { ...session.signups, [user.id]: { role, username, level } };
    await supabase.from('organized_crimes')
      .update({ signups: newSignups } as any)
      .eq('id', sessionId);
    await fetchSessions();
    return { success: true, message: `Aangemeld als ${role}!` };
  }, [user, sessions, fetchSessions]);

  const initiateOC = useCallback(async (sessionId: string, durationMinutes: number) => {
    if (!user) return { success: false, message: 'Niet ingelogd' };
    const completesAt = new Date(Date.now() + durationMinutes * 60000).toISOString();
    await supabase.from('organized_crimes')
      .update({
        status: 'in_progress',
        initiated_at: new Date().toISOString(),
        completes_at: completesAt,
      } as any)
      .eq('id', sessionId);
    await fetchSessions();
    return { success: true, message: 'OC gestart! Resultaat na afloop.' };
  }, [user, fetchSessions]);

  const completeOC = useCallback(async (sessionId: string, result: any) => {
    await supabase.from('organized_crimes')
      .update({
        status: result.success ? 'completed' : 'failed',
        result,
      } as any)
      .eq('id', sessionId);
    await fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, createOC, signup, initiateOC, completeOC, fetchSessions };
}
