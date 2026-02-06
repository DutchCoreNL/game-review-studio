import { useState, useRef } from 'react';
import { GameButton } from '../ui/GameButton';
import { BetControls } from './BetControls';
import { getTotalVipBonus, CasinoSessionStats } from './casinoUtils';
import { motion } from 'framer-motion';

interface SlotsGameProps {
  dispatch: (action: any) => void;
  showToast: (msg: string, isError?: boolean) => void;
  money: number;
  state: { ownedDistricts: string[]; districtRep: Record<string, number> };
  onResult: (won: boolean | null, amount: number) => void;
}

const BASE_SYMBOLS = ['🍒', '🍒', '🍒', '🍋', '🍋', '🍇', '💎', '7️⃣'];

export function SlotsGame({ dispatch, showToast, money, state, onResult }: SlotsGameProps) {
  const [bet, setBet] = useState(50);
  const [reels, setReels] = useState(['🍒', '🍒', '🍒']);
  const [spinning, setSpinning] = useState([false, false, false]);
  const [result, setResult] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [jackpot, setJackpot] = useState(10000);
  const [nearMiss, setNearMiss] = useState(false);

  const vipBonus = getTotalVipBonus(state);
  const hasNeon = state.ownedDistricts.includes('neon');
  const symbols = hasNeon ? [...BASE_SYMBOLS, '7️⃣', '💎'] : BASE_SYMBOLS;

  const spin = () => {
    if (bet > money || bet < 10) return showToast('Niet genoeg geld!', true);
    dispatch({ type: 'CASINO_BET', amount: bet });
    setResult(''); setNearMiss(false);
    setSpinning([true, true, true]);

    // Add to jackpot
    setJackpot(prev => prev + Math.floor(bet * 0.05));

    const currentBet = bet;
    const finalReels: string[] = [];

    // Sequential reel stops
    const stopReel = (index: number) => {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      finalReels[index] = sym;
      setReels(prev => {
        const next = [...prev];
        next[index] = sym;
        return next;
      });
      setSpinning(prev => {
        const next = [...prev];
        next[index] = false;
        return next;
      });
    };

    // Reel animation intervals
    let counter = 0;
    const animInterval = setInterval(() => {
      const animReels = [...reels];
      for (let i = 0; i < 3; i++) {
        if (spinning[i] || counter < 15) {
          animReels[i] = symbols[Math.floor(Math.random() * symbols.length)];
        }
      }
      setReels(animReels);
      counter++;
    }, 80);

    // Stop reels sequentially
    setTimeout(() => stopReel(0), 800);
    setTimeout(() => stopReel(1), 1400);
    setTimeout(() => {
      stopReel(2);
      clearInterval(animInterval);
      setSpinning([false, false, false]);
      // Need to wait for state to settle
      setTimeout(() => resolve(finalReels, currentBet), 100);
    }, 2000);
  };

  const resolve = (res: string[], activeBet: number) => {
    const [a, b, c] = res;
    setReels(res);
    let win = 0;

    if (a === b && b === c) {
      if (a === '7️⃣') {
        // JACKPOT!
        win = jackpot;
        setJackpot(10000);
        setResult(`🎰 JACKPOT! +€${win.toLocaleString()}`);
      } else if (a === '💎') {
        win = activeBet * 30;
        setResult(`💎 DIAMANT! +€${win.toLocaleString()}`);
      } else {
        win = activeBet * 10;
        setResult(`WINNAAR! +€${win.toLocaleString()}`);
      }
    } else if (a === b || b === c || a === c) {
      win = Math.floor(activeBet * 1.5);
      setResult(`Klein! +€${win}`);

      // Near miss: 2 of 3 are high value
      if ((a === '7️⃣' && b === '7️⃣') || (b === '7️⃣' && c === '7️⃣') || (a === '7️⃣' && c === '7️⃣') ||
          (a === '💎' && b === '💎') || (b === '💎' && c === '💎') || (a === '💎' && c === '💎')) {
        setNearMiss(true);
      }
    } else {
      setResult('Helaas...');
    }

    if (win > 0) {
      const bonusWin = Math.floor(win * (1 + vipBonus / 100));
      dispatch({ type: 'CASINO_WIN', amount: bonusWin });
      setResultColor('text-emerald');
      onResult(true, bonusWin - activeBet);
    } else {
      setResultColor('text-muted-foreground');
      onResult(false, -activeBet);
    }
  };

  const isSpinning = spinning.some(s => s);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card p-4">
      <h3 className="text-center text-gold font-bold text-lg font-display mb-1 neon-text">NEON SLOTS</h3>

      {/* Progressive Jackpot */}
      <div className="text-center mb-3">
        <motion.div
          className="inline-block px-3 py-1 rounded-full bg-gold/10 border border-gold/30"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">Jackpot </span>
          <span className="text-sm font-bold text-gold">€{jackpot.toLocaleString()}</span>
        </motion.div>
      </div>

      {/* Reels */}
      <div className="flex justify-center gap-2 mb-4">
        {reels.map((sym, i) => (
          <motion.div
            key={i}
            className="w-16 h-20 bg-background border-2 border-gold rounded flex items-center justify-center text-3xl shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
            animate={spinning[i] ? { y: [0, -5, 0, 5, 0] } : {}}
            transition={spinning[i] ? { repeat: Infinity, duration: 0.15 } : {}}
          >
            {sym}
          </motion.div>
        ))}
      </div>

      {/* Near miss */}
      {nearMiss && (
        <motion.p
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-gold font-bold text-xs mb-2"
        >
          BIJNA! 🔥
        </motion.p>
      )}

      <BetControls bet={bet} setBet={setBet} money={money} disabled={isSpinning} />

      <GameButton variant="gold" fullWidth disabled={isSpinning} onClick={spin} className="mt-3">
        {isSpinning ? 'DRAAIT...' : 'DRAAIEN'}
      </GameButton>

      {result && !isSpinning && (
        <motion.p
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-center font-bold mt-3 text-sm ${resultColor}`}
        >
          {result}
        </motion.p>
      )}
    </motion.div>
  );
}
