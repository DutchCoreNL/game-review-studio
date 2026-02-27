import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizedCrimes } from '@/hooks/useOrganizedCrimes';
import { supabase } from '@/integrations/supabase/client';
import {
  ORGANIZED_CRIMES, OC_ROLES, OCRole, OrganizedCrime,
  calculateOCSuccess, formatOCDuration, formatOCCountdown,
} from '@/game/organizedCrimes';
import { ViewWrapper } from './ui/ViewWrapper';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, Shield, CheckCircle2, AlertTriangle,
  Plus, UserPlus, Play, Trophy,
} from 'lucide-react';

function OCSessionCard({ session, crime, userId, onSignup, onInitiate, onComplete }: {
  session: any;
  crime: OrganizedCrime;
  userId: string;
  onSignup: (sessionId: string, role: OCRole) => void;
  onInitiate: (sessionId: string) => void;
  onComplete: (sessionId: string) => void;
}) {
  const [countdown, setCountdown] = useState('');
  const [progress, setProgress] = useState(0);
  const signups = session.signups as Record<string, { role: OCRole; username: string; level: number }>;
  const signupCount = Object.keys(signups).length;
  const isRecruiting = session.status === 'recruiting';
  const isInProgress = session.status === 'in_progress';
  const userSignedUp = !!signups[userId];
  const isInitiator = session.initiated_by === userId;
  const canStart = signupCount >= crime.minMembers && isRecruiting;

  useEffect(() => {
    if (!isInProgress || !session.completes_at) return;
    const update = () => {
      const start = new Date(session.initiated_at).getTime();
      const end = new Date(session.completes_at).getTime();
      const now = Date.now();
      setProgress(Math.min(100, ((now - start) / (end - start)) * 100));
      setCountdown(formatOCCountdown(session.completes_at));
    };
    update();
    const iv = setInterval(update, 5000);
    return () => clearInterval(iv);
  }, [isInProgress, session]);

  const isReady = isInProgress && countdown === 'Klaar!';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-4 ${
        isInProgress ? 'border-gold/30 bg-gold/5' : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm text-foreground">{crime.name}</h3>
        <span className={`text-[0.5rem] px-2 py-0.5 rounded font-bold uppercase ${
          isRecruiting ? 'bg-primary/20 text-primary' : 'bg-gold/20 text-gold'
        }`}>
          {isRecruiting ? 'Recruteren' : isReady ? 'Klaar!' : 'Bezig'}
        </span>
      </div>

      {/* Role slots */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {crime.roles.map(roleSlot => {
          const filled = Object.entries(signups).find(([, s]) => s.role === roleSlot.role);
          const isMe = filled && filled[0] === userId;
          return (
            <div
              key={roleSlot.role}
              className={`rounded-md border p-2 text-center ${
                filled
                  ? isMe ? 'border-primary/40 bg-primary/10' : 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-border/50 bg-muted/10'
              }`}
            >
              <span className="text-lg">{roleSlot.icon}</span>
              <p className="text-[0.55rem] font-bold text-foreground">{roleSlot.label}</p>
              {filled ? (
                <p className="text-[0.5rem] text-emerald-400 truncate">{filled[1].username}</p>
              ) : isRecruiting && !userSignedUp ? (
                <button
                  onClick={() => onSignup(session.id, roleSlot.role)}
                  className="text-[0.5rem] text-primary hover:underline mt-0.5"
                >
                  Aanmelden
                </button>
              ) : (
                <p className="text-[0.5rem] text-muted-foreground">Open</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar for in-progress */}
      {isInProgress && (
        <div className="mb-3">
          <Progress value={progress} className="h-2 bg-muted" />
          <div className="flex justify-between text-[0.55rem] mt-1">
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
            <span className={isReady ? 'text-emerald-400 font-bold' : 'text-gold'}>{countdown}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {canStart && isInitiator && (
          <GameButton size="sm" onClick={() => onInitiate(session.id)} className="flex-1">
            <Play size={14} /> Starten ({signupCount}/{crime.minMembers})
          </GameButton>
        )}
        {isReady && (
          <GameButton size="sm" variant="gold" onClick={() => onComplete(session.id)} className="flex-1">
            <Trophy size={14} /> Resultaat bekijken
          </GameButton>
        )}
      </div>

      <div className="flex items-center gap-3 mt-2 text-[0.55rem] text-muted-foreground">
        <span className="flex items-center gap-1"><Users size={10} /> {signupCount}/{crime.minMembers}</span>
        <span className="flex items-center gap-1"><Clock size={10} /> {formatOCDuration(crime.durationMinutes)}</span>
        <span className="text-gold">€{crime.basePayout.toLocaleString()}</span>
      </div>
    </motion.div>
  );
}

export function OrganizedCrimesView() {
  const { user } = useAuth();
  const [gangId, setGangId] = useState<string | null>(null);
  const [gangLevel, setGangLevel] = useState(1);
  const [username, setUsername] = useState('Speler');
  const [playerLevel, setPlayerLevel] = useState(1);
  const { sessions, loading, createOC, signup, initiateOC, completeOC } = useOrganizedCrimes(gangId);
  const [toast, setToast] = useState<string | null>(null);
  const [resultPopup, setResultPopup] = useState<any>(null);

  // Fetch gang membership
  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('gang_members').select('gang_id').eq('user_id', user.id).single(),
      supabase.from('profiles').select('username').eq('id', user.id).single(),
      supabase.from('player_state').select('level').eq('user_id', user.id).single(),
    ]).then(([gangRes, profileRes, stateRes]) => {
      if (gangRes.data) {
        setGangId(gangRes.data.gang_id);
        supabase.from('gangs').select('level').eq('id', gangRes.data.gang_id).single()
          .then(({ data }) => { if (data) setGangLevel(data.level); });
      }
      if (profileRes.data) setUsername(profileRes.data.username);
      if (stateRes.data) setPlayerLevel(stateRes.data.level);
    });
  }, [user]);

  const handleCreate = async (crimeId: string) => {
    const res = await createOC(crimeId);
    setToast(res.message);
  };

  const handleSignup = async (sessionId: string, role: OCRole) => {
    const res = await signup(sessionId, role, username, playerLevel);
    setToast(res.message);
  };

  const handleInitiate = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    const crime = session ? ORGANIZED_CRIMES.find(c => c.id === session.crime_id) : null;
    if (!crime) return;
    const res = await initiateOC(sessionId, crime.durationMinutes);
    setToast(res.message);
  };

  const handleComplete = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    const crime = session ? ORGANIZED_CRIMES.find(c => c.id === session.crime_id) : null;
    if (!session || !crime) return;
    const result = calculateOCSuccess(session.signups);
    const payout = Math.floor(crime.basePayout * result.multiplier);
    const fullResult = { ...result, payout, repReward: result.success ? crime.repReward : 0, xpReward: result.success ? crime.xpReward : 0 };
    await completeOC(sessionId, fullResult);
    setResultPopup(fullResult);
  };

  if (!gangId) {
    return (
      <ViewWrapper>
        <SectionHeader title="Organized Crimes" />
        <div className="text-center py-12">
          <Users size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Je moet lid zijn van een gang om deel te nemen.</p>
        </div>
      </ViewWrapper>
    );
  }

  const activeSessions = sessions.filter(s => s.status === 'recruiting' || s.status === 'in_progress');
  const availableCrimes = ORGANIZED_CRIMES.filter(c => c.reqGangLevel <= gangLevel);

  return (
    <ViewWrapper>
      <SectionHeader title="Organized Crimes" />
      <p className="text-xs text-muted-foreground mb-4">
        Plan gang-brede misdaden. Elk lid kiest een rol. Minimaal 4 leden vereist.
      </p>

      {/* Active sessions */}
      {activeSessions.length > 0 && (
        <div className="space-y-3 mb-6">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Shield size={12} /> Actieve Operaties
          </h2>
          {activeSessions.map(session => {
            const crime = ORGANIZED_CRIMES.find(c => c.id === session.crime_id);
            if (!crime) return null;
            return (
              <OCSessionCard
                key={session.id}
                session={session}
                crime={crime}
                userId={user?.id || ''}
                onSignup={handleSignup}
                onInitiate={handleInitiate}
                onComplete={handleComplete}
              />
            );
          })}
        </div>
      )}

      {/* Available crimes to start */}
      <div>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
          <Plus size={12} /> Nieuwe OC Starten
        </h2>
        <div className="space-y-2">
          {availableCrimes.map(crime => {
            const diffColor = crime.difficulty === 'extreme' ? 'text-blood' : crime.difficulty === 'hard' ? 'text-gold' : 'text-emerald-400';
            return (
              <div key={crime.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-sm text-foreground">{crime.name}</h3>
                  <span className={`text-[0.5rem] font-bold uppercase ${diffColor}`}>{crime.difficulty}</span>
                </div>
                <p className="text-[0.55rem] text-muted-foreground mb-2">{crime.description}</p>
                <div className="flex items-center gap-3 text-[0.55rem] text-muted-foreground mb-2">
                  <span><Clock size={10} className="inline" /> {formatOCDuration(crime.durationMinutes)}</span>
                  <span className="text-gold">€{crime.basePayout.toLocaleString()}</span>
                  <span>+{crime.repReward} rep</span>
                  <span>+{crime.xpReward} XP</span>
                </div>
                <div className="flex gap-1 mb-2">
                  {crime.roles.map(r => (
                    <span key={r.role} className="text-[0.5rem] px-1.5 py-0.5 rounded bg-muted/20 border border-border/50">
                      {r.icon} {r.label}
                    </span>
                  ))}
                </div>
                <GameButton size="sm" variant="gold" onClick={() => handleCreate(crime.id)}>
                  <UserPlus size={14} /> Organiseren
                </GameButton>
              </div>
            );
          })}
          {availableCrimes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Geen OCs beschikbaar. Verhoog het gang level!
            </p>
          )}
        </div>
      </div>

      {/* Result popup */}
      <AnimatePresence>
        {resultPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setResultPopup(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <span className="text-4xl">{resultPopup.success ? '✅' : '❌'}</span>
                <h2 className="text-lg font-bold mt-2 text-foreground">
                  {resultPopup.success ? 'OC Geslaagd!' : 'OC Mislukt!'}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Slagingskans: {Math.round(resultPopup.successRate)}%
                </p>
                {resultPopup.success && (
                  <div className="mt-4 space-y-1 text-sm">
                    <p className="text-gold font-bold">€{resultPopup.payout.toLocaleString()}</p>
                    <p className="text-emerald-400">+{resultPopup.repReward} Rep</p>
                    <p className="text-primary">+{resultPopup.xpReward} XP</p>
                  </div>
                )}
                <GameButton onClick={() => setResultPopup(null)} className="mt-4 w-full">
                  Sluiten
                </GameButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onAnimationComplete={() => setTimeout(() => setToast(null), 2500)}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card border border-border px-4 py-2 rounded-lg text-xs font-semibold shadow-lg z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </ViewWrapper>
  );
}
