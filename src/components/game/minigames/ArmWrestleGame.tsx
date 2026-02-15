import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Swords, Trophy, X } from 'lucide-react';
import { GameButton } from '../ui/GameButton';
import { playVictorySound, playNegativeSound } from '@/game/sounds';
import { MINIGAME_IMAGES } from '@/assets/items';

interface Props {
  opponentName: string;
  opponentStrength: number; // 1-10
  playerMuscle: number; // player's muscle stat
  onResult: (won: boolean) => void;
}

const WIN_THRESHOLD = 80;
const LOSE_THRESHOLD = -80;
const DECAY_RATE = 0.15; // NPC pushes back per tick
const TAP_POWER_BASE = 3;

export function ArmWrestleGame({ opponentName, opponentStrength, playerMuscle, onResult }: Props) {
  const [position, setPosition] = useState(0); // -100 (lose) to +100 (win)
  const [phase, setPhase] = useState<'ready' | 'playing' | 'result'>('ready');
  const [won, setWon] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();
  const gameTimeRef = useRef(0);

  // Muscle advantage: each point difference = ±0.5 tap power
  const muscleDiff = playerMuscle - opponentStrength;
  const tapPower = TAP_POWER_BASE + muscleDiff * 0.5;
  const npcPush = DECAY_RATE * (opponentStrength / 5); // stronger = pushes faster

  const startGame = () => {
    setPhase('playing');
    setPosition(0);
    setTapCount(0);
    gameTimeRef.current = 0;
  };

  // NPC pushes back continuously
  useEffect(() => {
    if (phase !== 'playing') return;
    intervalRef.current = setInterval(() => {
      gameTimeRef.current += 50;
      setPosition(prev => {
        const next = prev - npcPush;
        if (next <= LOSE_THRESHOLD) {
          clearInterval(intervalRef.current);
          setPhase('result');
          setWon(false);
          playNegativeSound();
          setTimeout(() => onResult(false), 500);
          return LOSE_THRESHOLD;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(intervalRef.current);
  }, [phase, npcPush, onResult]);

  const tap = useCallback(() => {
    if (phase !== 'playing') return;
    setTapCount(prev => prev + 1);
    setPosition(prev => {
      const next = prev + tapPower;
      if (next >= WIN_THRESHOLD) {
        clearInterval(intervalRef.current);
        setPhase('result');
        setWon(true);
        playVictorySound();
        setTimeout(() => onResult(true), 500);
        return WIN_THRESHOLD;
      }
      return Math.min(WIN_THRESHOLD, next);
    });
  }, [phase, tapPower, onResult]);

  // Map position (-80 to 80) to visual percentage (0 to 100)
  const visualPct = ((position - LOSE_THRESHOLD) / (WIN_THRESHOLD - LOSE_THRESHOLD)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6"
    >
      <div className="w-full max-w-xs bg-card border border-border rounded-lg p-4 space-y-4 shadow-2xl">
        <div className="text-center">
          <Swords size={24} className="text-blood mx-auto mb-1" />
          <h3 className="font-display text-sm uppercase tracking-wider">Arm Wrestle</h3>
          <p className="text-[0.55rem] text-muted-foreground mt-1">
            vs <span className="text-foreground font-bold">{opponentName}</span>
            <span className="text-blood ml-1">(Kracht: {opponentStrength})</span>
          </p>
        </div>

        {phase === 'ready' && (
          <div className="space-y-3">
            <div className="game-card p-3 text-[0.6rem] space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jouw Muscle</span>
                <span className="text-foreground font-bold">{playerMuscle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tegenstander</span>
                <span className="text-blood font-bold">{opponentStrength}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voordeel</span>
                <span className={muscleDiff >= 0 ? 'text-emerald font-bold' : 'text-blood font-bold'}>
                  {muscleDiff >= 0 ? '+' : ''}{muscleDiff}
                </span>
              </div>
            </div>
            <p className="text-[0.5rem] text-center text-muted-foreground italic">
              Tap zo snel mogelijk om je arm naar rechts te duwen!
            </p>
            <GameButton variant="blood" fullWidth glow onClick={startGame} icon={<Swords size={14} />}>
              START!
            </GameButton>
          </div>
        )}

        {phase === 'playing' && (
          <div className="space-y-4">
            {/* Player labels */}
            <div className="flex justify-between text-[0.55rem] font-bold">
              <span className="text-blood">{opponentName}</span>
              <span className="text-emerald">JIJ</span>
            </div>

            {/* Arm wrestle bar */}
            <div className="relative h-6 bg-muted rounded-full overflow-hidden border border-border">
              <div className="absolute inset-0 flex">
                <div className="w-1/2 bg-blood/10" />
                <div className="w-1/2 bg-emerald/10" />
              </div>
              <motion.div
                className="absolute top-0 bottom-0 w-4 bg-gold rounded-full border-2 border-gold shadow-lg"
                style={{ left: `calc(${visualPct}% - 8px)` }}
                animate={{ left: `calc(${visualPct}% - 8px)` }}
                transition={{ duration: 0.05 }}
              />
              {/* Center line */}
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-border" />
            </div>

            {/* Tap button */}
            <motion.button
              onClick={tap}
              whileTap={{ scale: 0.95 }}
              className="w-full py-8 rounded-lg bg-blood border-2 border-blood text-primary-foreground font-black text-xl uppercase tracking-wider active:bg-blood/80 transition-colors select-none"
            >
              TAP! 💪
            </motion.button>

            <p className="text-center text-[0.5rem] text-muted-foreground">
              Taps: {tapCount}
            </p>
          </div>
        )}

        {phase === 'result' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3">
            {won ? (
              <>
                <Trophy size={36} className="text-gold mx-auto" />
                <h3 className="font-display text-lg text-gold uppercase">GEWONNEN!</h3>
                <p className="text-[0.6rem] text-muted-foreground">
                  {opponentName} is verslagen in {tapCount} taps.
                </p>
              </>
            ) : (
              <>
                <X size={36} className="text-blood mx-auto" />
                <h3 className="font-display text-lg text-blood uppercase">VERLOREN</h3>
                <p className="text-[0.6rem] text-muted-foreground">
                  {opponentName} was te sterk.
                </p>
              </>
            )}
            <GameButton variant="muted" fullWidth onClick={() => onResult(won)}>
              SLUITEN
            </GameButton>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
