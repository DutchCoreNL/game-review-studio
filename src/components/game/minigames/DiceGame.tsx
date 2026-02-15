import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, DollarSign } from 'lucide-react';
import { GameButton } from '../ui/GameButton';
import { playCoinSound, playNegativeSound } from '@/game/sounds';
import { MINIGAME_IMAGES } from '@/assets/items';

interface Props {
  bet: number;
  isPrison?: boolean; // prison mode: sigaretten instead of money
  onResult: (won: boolean, amount: number) => void;
  onClose: () => void;
}

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

type Phase = 'comeOut' | 'point' | 'result';

export function DiceGame({ bet, isPrison, onResult, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('comeOut');
  const [die1, setDie1] = useState(1);
  const [die2, setDie2] = useState(1);
  const [point, setPoint] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [won, setWon] = useState<boolean | null>(null);
  const [message, setMessage] = useState('Gooi de dobbelstenen!');

  const rollDice = useCallback(() => {
    if (rolling) return;
    setRolling(true);

    // Animate random values
    let count = 0;
    const interval = setInterval(() => {
      setDie1(1 + Math.floor(Math.random() * 6));
      setDie2(1 + Math.floor(Math.random() * 6));
      count++;
      if (count > 8) {
        clearInterval(interval);
        const d1 = 1 + Math.floor(Math.random() * 6);
        const d2 = 1 + Math.floor(Math.random() * 6);
        setDie1(d1);
        setDie2(d2);
        setRolling(false);
        resolveRoll(d1, d2);
      }
    }, 80);
  }, [rolling, phase, point]);

  const resolveRoll = (d1: number, d2: number) => {
    const total = d1 + d2;

    if (phase === 'comeOut') {
      if (total === 7 || total === 11) {
        setWon(true);
        setMessage(`${total}! NATURAL — Je wint!`);
        setPhase('result');
        playCoinSound();
        onResult(true, bet);
      } else if (total === 2 || total === 3 || total === 12) {
        setWon(false);
        setMessage(`${total}! CRAPS — Je verliest!`);
        setPhase('result');
        playNegativeSound();
        onResult(false, -bet);
      } else {
        setPoint(total);
        setMessage(`Je punt is ${total}. Gooi opnieuw!`);
        setPhase('point');
      }
    } else if (phase === 'point') {
      if (total === point) {
        setWon(true);
        setMessage(`${total}! Punt geraakt — Je wint!`);
        setPhase('result');
        playCoinSound();
        onResult(true, bet);
      } else if (total === 7) {
        setWon(false);
        setMessage('7! Seven out — Je verliest!');
        setPhase('result');
        playNegativeSound();
        onResult(false, -bet);
      } else {
        setMessage(`${total} — Gooi opnieuw voor ${point}!`);
      }
    }
  };

  const reset = () => {
    setPhase('comeOut');
    setDie1(1);
    setDie2(1);
    setPoint(null);
    setWon(null);
    setMessage('Gooi de dobbelstenen!');
  };

  const Die1Icon = DICE_ICONS[die1 - 1];
  const Die2Icon = DICE_ICONS[die2 - 1];
  const currency = isPrison ? '🚬' : '€';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="text-center">
        <h3 className="font-display text-sm uppercase tracking-wider text-foreground">
          {isPrison ? 'Gevangenisdobbelen' : 'Straatcraps'}
        </h3>
        <p className="text-[0.55rem] text-muted-foreground mt-1">
          Inzet: {currency}{bet.toLocaleString()}
          {point && <span className="text-gold ml-2">Punt: {point}</span>}
        </p>
      </div>

      {/* Dice display */}
      <div className="flex justify-center gap-6">
        <motion.div
          animate={rolling ? { rotate: [0, 360], scale: [1, 1.2, 1] } : undefined}
          transition={{ duration: 0.3, repeat: rolling ? Infinity : 0 }}
          className="w-16 h-16 bg-muted border border-border rounded-lg flex items-center justify-center"
        >
          <Die1Icon size={36} className={won === true ? 'text-emerald' : won === false ? 'text-blood' : 'text-foreground'} />
        </motion.div>
        <motion.div
          animate={rolling ? { rotate: [0, -360], scale: [1, 1.2, 1] } : undefined}
          transition={{ duration: 0.3, repeat: rolling ? Infinity : 0 }}
          className="w-16 h-16 bg-muted border border-border rounded-lg flex items-center justify-center"
        >
          <Die2Icon size={36} className={won === true ? 'text-emerald' : won === false ? 'text-blood' : 'text-foreground'} />
        </motion.div>
      </div>

      {/* Total */}
      <div className="text-center">
        <span className="text-2xl font-black text-foreground">{die1 + die2}</span>
      </div>

      {/* Message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center text-xs font-bold ${
            won === true ? 'text-emerald' : won === false ? 'text-blood' : 'text-muted-foreground'
          }`}
        >
          {message}
        </motion.p>
      </AnimatePresence>

      {/* Actions */}
      {phase !== 'result' ? (
        <div className="flex gap-2">
          <GameButton variant="gold" fullWidth glow onClick={rollDice} disabled={rolling}>
            {rolling ? 'ROLT...' : 'GOOI!'}
          </GameButton>
          <GameButton variant="muted" onClick={onClose}>STOP</GameButton>
        </div>
      ) : (
        <div className="flex gap-2">
          <GameButton variant="gold" fullWidth onClick={reset} icon={<DollarSign size={12} />}>
            OPNIEUW
          </GameButton>
          <GameButton variant="muted" fullWidth onClick={onClose}>KLAAR</GameButton>
        </div>
      )}
    </motion.div>
  );
}
