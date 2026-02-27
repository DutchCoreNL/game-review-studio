import { useState, useRef } from 'react';
import { GameButton } from '../ui/GameButton';
import { BetControls } from './BetControls';
import { CasinoSessionStats } from './casinoUtils';
import { motion } from 'framer-motion';
import { CASINO_GAME_IMAGES } from '@/assets/items/index';
import { playSlotSpin, playSlotReelStop, playSlotWin, playSlotJackpot, playLoss } from '@/game/sounds/casinoSounds';
import { gameApi } from '@/lib/gameApi';

interface SlotsGameProps {
  dispatch: (action: any) => void;
  showToast: (msg: string, isError?: boolean) => void;
  money: number;
  state: { ownedDistricts: string[]; districtRep: Record<string, number>; casinoJackpot?: number };
  onResult: (won: boolean | null, amount: number) => void;
}

const BASE_SYMBOLS = ['🍒', '🍒', '🍋', '🍋', '🍇', '🍊', '🔔', '⭐', '🍀', '🎲', '💎', '7️⃣'];

export function SlotsGame({ dispatch, showToast, money, state, onResult }: SlotsGameProps) {
  const [bet, setBet] = useState(50);
  const [reels, setReels] = useState(['🍒', '🍒', '🍒']);
  const [spinning, setSpinning] = useState([false, false, false]);
  const [result, setResult] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [nearMiss, setNearMiss] = useState(false);

  const spinningRef = useRef([false, false, false]);
  const reelsRef = useRef(['🍒', '🍒', '🍒']);

  const jackpot = state.casinoJackpot || 10000;

  const spin = async () => {
    if (bet > money || bet < 10) return showToast('Niet genoeg geld!', true);
    setResult(''); setNearMiss(false);
    const newSpinning = [true, true, true];
    setSpinning(newSpinning);
    spinningRef.current = newSpinning;
    playSlotSpin();

    // Visual animation
    const animInterval = setInterval(() => {
      const animReels: string[] = [];
      for (let i = 0; i < 3; i++) {
        if (spinningRef.current[i]) {
          animReels[i] = BASE_SYMBOLS[Math.floor(Math.random() * BASE_SYMBOLS.length)];
        } else {
          animReels[i] = reelsRef.current[i];
        }
      }
      reelsRef.current = animReels;
      setReels(animReels);
    }, 80);

    // Server call
    try {
      const res = await gameApi.casinoPlay('slots', bet);

      clearInterval(animInterval);

      if (!res.success) {
        setSpinning([false, false, false]);
        spinningRef.current = [false, false, false];
        showToast(res.message, true);
        return;
      }

      const data = res.data!;
      const serverReels = data.reels || ['🍒', '🍒', '🍒'];

      // Sequential reel stop animation
      const stopReel = (index: number) => {
        reelsRef.current[index] = serverReels[index];
        spinningRef.current[index] = false;
        setReels(prev => { const next = [...prev]; next[index] = serverReels[index]; return next; });
        setSpinning(prev => { const next = [...prev]; next[index] = false; return next; });
        playSlotReelStop();
      };

      setTimeout(() => stopReel(0), 300);
      setTimeout(() => stopReel(1), 800);
      setTimeout(() => {
        stopReel(2);

        if (data.isJackpot) {
          setResult(`🎰 JACKPOT! +€${data.jackpotAmount?.toLocaleString()}`);
          setResultColor('text-emerald');
          onResult(true, data.netResult);
          playSlotJackpot();
          dispatch({ type: 'JACKPOT_RESET' });
        } else if (data.netResult > 0) {
          setResult(`WINNAAR! +€${data.netResult.toLocaleString()}`);
          setResultColor('text-emerald');
          onResult(true, data.netResult);
          playSlotWin();
        } else if (data.netResult === 0) {
          // Pair - small win but net 0 due to rounding
          setResult('Klein!');
          setResultColor('text-muted-foreground');
          onResult(null, 0);
        } else {
          setResult('Helaas...');
          setResultColor('text-muted-foreground');
          onResult(false, data.netResult);
          playLoss();
        }

        // Check near miss
        const [a, b, c] = serverReels;
        if ((a === b || b === c || a === c) && 
            ['7️⃣', '💎'].some(s => serverReels.filter(r => r === s).length === 2)) {
          setNearMiss(true);
        }

        if (data.newMoney !== undefined) dispatch({ type: 'SET_MONEY', amount: data.newMoney });
      }, 1300);
    } catch {
      clearInterval(animInterval);
      setSpinning([false, false, false]);
      spinningRef.current = [false, false, false];
      showToast('Server fout.', true);
    }
  };

  const isSpinning = spinning.some(s => s);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card overflow-hidden">
      <div className="relative h-24 overflow-hidden">
        <img src={CASINO_GAME_IMAGES.slots} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        <h3 className="absolute bottom-2 left-0 right-0 text-center text-gold font-bold text-lg font-display neon-text">NEON SLOTS</h3>
      </div>
      <div className="p-4 pt-1">

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
      </div>
    </motion.div>
  );
}
