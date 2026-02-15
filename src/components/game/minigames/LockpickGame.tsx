import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, X } from 'lucide-react';
import { GameButton } from '../ui/GameButton';

interface Props {
  difficulty: number; // 1-5 pins
  brainsBonus: number; // widens sweet spot
  onComplete: (success: boolean) => void;
}

const PIN_WIDTH = 60;
const BASE_SWEET_SPOT = 18; // percentage of track that's "green"

export function LockpickGame({ difficulty, brainsBonus, onComplete }: Props) {
  const numPins = Math.min(5, Math.max(3, difficulty));
  const sweetSpotSize = BASE_SWEET_SPOT + brainsBonus * 3; // brains widens green zone

  const [currentPin, setCurrentPin] = useState(0);
  const [pinsSet, setPinsSet] = useState<boolean[]>(Array(numPins).fill(false));
  const [markerPos, setMarkerPos] = useState(0);
  const [direction, setDirection] = useState(1);
  const [failed, setFailed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Each pin has a random sweet spot center
  const sweetSpots = useRef<number[]>(
    Array.from({ length: numPins }, () => 20 + Math.random() * 60)
  );

  // Animate marker
  useEffect(() => {
    if (completed || failed) return;
    const speed = 0.06 + difficulty * 0.015; // faster with difficulty

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      setMarkerPos(prev => {
        let next = prev + direction * speed * delta * 0.1;
        if (next >= 100) { next = 100; setDirection(-1); }
        if (next <= 0) { next = 0; setDirection(1); }
        return next;
      });

      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [direction, difficulty, completed, failed]);

  const trySetPin = useCallback(() => {
    if (completed || failed) return;
    const center = sweetSpots.current[currentPin];
    const halfZone = sweetSpotSize / 2;
    const inZone = markerPos >= center - halfZone && markerPos <= center + halfZone;

    if (inZone) {
      const next = [...pinsSet];
      next[currentPin] = true;
      setPinsSet(next);

      if (currentPin + 1 >= numPins) {
        setCompleted(true);
        cancelAnimationFrame(animRef.current);
        setTimeout(() => onComplete(true), 800);
      } else {
        setCurrentPin(prev => prev + 1);
      }
    } else {
      // Miss — reset current pin (give another try, but add wobble)
      setFailed(true);
      setTimeout(() => setFailed(false), 300);
    }
  }, [markerPos, currentPin, pinsSet, numPins, sweetSpotSize, completed, failed, onComplete]);

  const cancel = () => {
    cancelAnimationFrame(animRef.current);
    onComplete(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6"
    >
      <div className="w-full max-w-xs bg-card border border-border rounded-lg p-4 space-y-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-gold" />
          <h3 className="font-display text-sm uppercase tracking-wider">Lockpick</h3>
          <span className="ml-auto text-[0.55rem] text-muted-foreground">
            Pin {currentPin + 1}/{numPins}
          </span>
        </div>

        {/* Pin indicators */}
        <div className="flex justify-center gap-2">
          {pinsSet.map((set, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[0.6rem] font-bold transition-all ${
                set ? 'border-emerald bg-emerald/20 text-emerald' :
                i === currentPin ? 'border-gold bg-gold/10 text-gold animate-pulse' :
                'border-border bg-muted text-muted-foreground'
              }`}
            >
              {set ? <Check size={12} /> : i + 1}
            </div>
          ))}
        </div>

        {/* Lock track */}
        <div className="relative h-10 bg-muted rounded-full overflow-hidden border border-border">
          {/* Sweet spot */}
          <div
            className="absolute top-0 h-full bg-emerald/20 border-x border-emerald/40"
            style={{
              left: `${sweetSpots.current[currentPin] - sweetSpotSize / 2}%`,
              width: `${sweetSpotSize}%`,
            }}
          />
          {/* Marker */}
          <motion.div
            className={`absolute top-0.5 bottom-0.5 w-1.5 rounded-full ${failed ? 'bg-blood' : 'bg-gold'}`}
            style={{ left: `${markerPos}%` }}
            animate={failed ? { x: [0, -4, 4, -2, 0] } : undefined}
            transition={{ duration: 0.2 }}
          />
        </div>

        {!completed && (
          <div className="flex gap-2">
            <GameButton variant="gold" fullWidth glow onClick={trySetPin} icon={<Lock size={12} />}>
              ZET PIN
            </GameButton>
            <GameButton variant="muted" onClick={cancel} icon={<X size={12} />}>
              SKIP
            </GameButton>
          </div>
        )}

        {completed && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-emerald font-bold text-sm"
          >
            <Check size={24} className="mx-auto mb-1" />
            SLOT GEKRAAKT!
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
