import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { Heart, Clock, DollarSign, AlertTriangle, Skull } from 'lucide-react';
import { useState } from 'react';
import { GameButton } from './ui/GameButton';
import { HOSPITAL_STAY_DAYS, MAX_HOSPITALIZATIONS } from '@/game/constants';
import { playNegativeSound } from '@/game/sounds';
import { useEffect, useRef } from 'react';

export function HospitalStayOverlay() {
  const { state } = useGame();
  if (!state.hospital) return null;
  return <HospitalInner />;
}

function HospitalInner() {
  const { state, dispatch } = useGame();
  const hospital = state.hospital!;
  const hasPlayedSound = useRef(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!hasPlayedSound.current) {
      hasPlayedSound.current = true;
      playNegativeSound();
    }
  }, []);

  // Re-render every second for countdown
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const progressPct = hospital.totalDays > 0
    ? ((hospital.totalDays - hospital.daysRemaining) / hospital.totalDays) * 100
    : 0;

  // Realtime countdown
  const tickMs = (state.tickIntervalMinutes || 30) * 60 * 1000;
  const lastTick = state.lastTickAt ? new Date(state.lastTickAt).getTime() : Date.now();
  const releaseTime = lastTick + (hospital.daysRemaining * tickMs);
  const msLeft = Math.max(0, releaseTime - Date.now());
  const hoursLeft = Math.floor(msLeft / 3600000);
  const minsLeft = Math.floor((msLeft % 3600000) / 60000);
  const secsLeft = Math.floor((msLeft % 60000) / 1000);
  const realtimeCountdown = hoursLeft > 0 
    ? `${hoursLeft}u ${minsLeft}m` 
    : minsLeft > 0 
      ? `${minsLeft}m ${secsLeft}s` 
      : `${secsLeft}s`;

  const hospitalizationsLeft = MAX_HOSPITALIZATIONS - (state.hospitalizations || 0);


  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(var(--background) / 0.85) 0%, hsl(var(--background) / 0.95) 100%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 20 }}
        className="absolute inset-0 z-40 flex items-center justify-center px-6 overflow-y-auto py-4"
      >
        <div className="w-full max-w-xs bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
          {/* Banner */}
          <div className="relative h-20 overflow-hidden bg-gradient-to-br from-blood/30 via-background to-blood/10">
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            <div className="absolute bottom-2 left-4 flex items-center gap-2">
              <Heart size={18} className="text-blood" />
              <span className="font-bold text-sm uppercase tracking-wider text-blood">Ziekenhuis</span>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-3 space-y-3">
            {/* Progress ring + countdown */}
            <div className="flex items-center justify-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                  <motion.circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke="hsl(var(--blood))"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                    animate={{ strokeDashoffset: (2 * Math.PI * 34) * (1 - progressPct / 100) }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-blood leading-none">{realtimeCountdown}</span>
                  <p className="text-[0.4rem] text-blood/70 uppercase tracking-wider mt-0.5">
                    ({hospital.daysRemaining} {hospital.daysRemaining === 1 ? 'dag' : 'dagen'})
                  </p>
                </div>
              </div>
              <div className="text-[0.6rem] text-muted-foreground space-y-1">
                <p>Dag <span className="text-foreground font-bold">{hospital.totalDays - hospital.daysRemaining}</span> van {hospital.totalDays}</p>
                <div className="flex items-center gap-1 text-blood">
                  <Skull size={10} />
                  <span>Opname {state.hospitalizations}/{MAX_HOSPITALIZATIONS}</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 text-[0.6rem]">
                <DollarSign size={11} className="text-blood mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Kosten: <span className="text-blood font-bold">€{hospital.cost.toLocaleString()}</span>
                </span>
              </div>
              <div className="flex items-start gap-2 text-[0.6rem]">
                <Heart size={11} className="text-emerald mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Na ontslag: <span className="text-emerald font-bold">50% HP hersteld</span>
                </span>
              </div>
              <div className="flex items-start gap-2 text-[0.6rem]">
                <Clock size={11} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Geen handel, reizen of missies mogelijk.
                </span>
              </div>
            </div>

            {/* Warning */}
            {hospitalizationsLeft <= 1 && (
              <div className="flex items-start gap-2 text-[0.6rem] bg-blood/10 border border-blood/20 rounded px-2 py-1.5">
                <AlertTriangle size={12} className="text-blood mt-0.5 flex-shrink-0" />
                <span className="text-blood">
                  <span className="font-bold">Laatste kans!</span> Nog één ziekenhuisopname = Game Over.
                </span>
              </div>
            )}

            {/* Wait action */}
            <GameButton
              variant="muted"
              size="md"
              fullWidth
              icon={<Clock size={14} />}
              onClick={() => dispatch({ type: 'AUTO_TICK' })}
            >
              WACHT DE DAG AF
            </GameButton>
          </div>
        </div>
      </motion.div>
    </>
  );
}
