import { useState } from 'react';
import { GameButton } from '../ui/GameButton';
import { BetControls } from './BetControls';
import { getTotalVipBonus, applyVipToWinnings, CasinoSessionStats } from './casinoUtils';
import { motion } from 'framer-motion';
import { CASINO_GAME_IMAGES } from '@/assets/items/index';

type RouletteBet = 'red' | 'black' | 'green' | 'even' | 'odd' | 'low' | 'high';

interface RouletteGameProps {
  dispatch: (action: any) => void;
  showToast: (msg: string, isError?: boolean) => void;
  money: number;
  state: { ownedDistricts: string[]; districtRep: Record<string, number> };
  onResult: (won: boolean | null, amount: number) => void;
}

const RED_NUMS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

export function RouletteGame({ dispatch, showToast, money, state, onResult }: RouletteGameProps) {
  const [bet, setBet] = useState(100);
  const [result, setResult] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [wheelNum, setWheelNum] = useState<number | null>(null);
  const [wheelColor, setWheelColor] = useState('');
  const [history, setHistory] = useState<{ num: number; color: string }[]>([]);

  const vipBonus = getTotalVipBonus(state);

  const getNumColor = (num: number) => num === 0 ? 'green' : RED_NUMS.includes(num) ? 'red' : 'black';

  const spin = (choice: RouletteBet) => {
    if (bet > money || bet < 10) return showToast('Niet genoeg geld!', true);
    dispatch({ type: 'CASINO_BET', amount: bet });
    setSpinning(true); setResult('');
    const currentBet = bet;
    let counter = 0;
    const interval = setInterval(() => {
      const num = Math.floor(Math.random() * 37);
      const color = getNumColor(num);
      setWheelNum(num); setWheelColor(color); counter++;
      if (counter > 20) {
        clearInterval(interval);
        setSpinning(false);
        resolve(num, color, choice, currentBet);
      }
    }, 80);
  };

  const resolve = (num: number, color: string, choice: RouletteBet, activeBet: number) => {
    setHistory(prev => [{ num, color }, ...prev].slice(0, 5));

    let won = false, mult = 0;
    if (choice === 'red' && color === 'red') { won = true; mult = 2; }
    else if (choice === 'black' && color === 'black') { won = true; mult = 2; }
    else if (choice === 'green' && num === 0) { won = true; mult = 14; }
    else if (choice === 'even' && num > 0 && num % 2 === 0) { won = true; mult = 2; }
    else if (choice === 'odd' && num % 2 === 1) { won = true; mult = 2; }
    else if (choice === 'low' && num >= 1 && num <= 18) { won = true; mult = 2; }
    else if (choice === 'high' && num >= 19 && num <= 36) { won = true; mult = 2; }

    if (won) {
      const basePayout = Math.floor(activeBet * mult);
      // Apply VIP bonus to net profit only
      const winAmount = applyVipToWinnings(basePayout, activeBet, vipBonus);
      dispatch({ type: 'CASINO_WIN', amount: winAmount });
      setResult(`GEWONNEN! +€${winAmount}`);
      setResultColor('text-emerald');
      onResult(true, winAmount - activeBet);
    } else {
      setResult('VERLOREN');
      setResultColor('text-blood');
      onResult(false, -activeBet);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card overflow-hidden">
      <div className="relative h-24 overflow-hidden">
        <img src={CASINO_GAME_IMAGES.roulette} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        <h3 className="absolute bottom-2 left-0 right-0 text-center text-gold font-bold text-lg font-display gold-text-glow">ROULETTE</h3>
      </div>
      <div className="p-4 pt-2">

      {/* Wheel */}
      <div className="flex justify-center mb-3">
        <motion.div
          className={`w-20 h-20 rounded-full border-4 border-border flex items-center justify-center text-2xl font-bold ${
            wheelColor === 'red' ? 'bg-blood' : wheelColor === 'green' ? 'bg-emerald' : 'bg-muted'
          }`}
          animate={spinning ? { rotate: 360 } : {}}
          transition={spinning ? { repeat: Infinity, duration: 0.3 } : {}}
        >
          {wheelNum !== null ? wheelNum : '?'}
        </motion.div>
      </div>

      {/* History strip */}
      {history.length > 0 && (
        <div className="flex justify-center gap-1 mb-3">
          {history.map((h, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full text-[0.5rem] font-bold flex items-center justify-center ${
                h.color === 'red' ? 'bg-blood text-primary-foreground' :
                h.color === 'green' ? 'bg-emerald text-primary-foreground' :
                'bg-muted text-foreground border border-border'
              }`}
            >
              {h.num}
            </div>
          ))}
        </div>
      )}

      <BetControls bet={bet} setBet={setBet} money={money} disabled={spinning} />

      {/* Primary bets */}
      <div className="flex gap-2 mt-3">
        <button disabled={spinning} onClick={() => spin('red')}
          className="flex-1 py-3 rounded bg-blood text-primary-foreground font-bold text-xs disabled:opacity-50">
          ROOD
        </button>
        <button disabled={spinning} onClick={() => spin('green')}
          className="flex-1 py-3 rounded bg-emerald text-primary-foreground font-bold text-xs border border-gold disabled:opacity-50">
          0 (x14)
        </button>
        <button disabled={spinning} onClick={() => spin('black')}
          className="flex-1 py-3 rounded bg-muted text-foreground font-bold text-xs border border-border disabled:opacity-50">
          ZWART
        </button>
      </div>

      {/* Secondary bets */}
      <div className="flex gap-2 mt-2">
        <button disabled={spinning} onClick={() => spin('even')}
          className="flex-1 py-2 rounded bg-muted/50 border border-border text-foreground font-bold text-[0.55rem] disabled:opacity-50">
          EVEN
        </button>
        <button disabled={spinning} onClick={() => spin('odd')}
          className="flex-1 py-2 rounded bg-muted/50 border border-border text-foreground font-bold text-[0.55rem] disabled:opacity-50">
          ONEVEN
        </button>
        <button disabled={spinning} onClick={() => spin('low')}
          className="flex-1 py-2 rounded bg-muted/50 border border-border text-foreground font-bold text-[0.55rem] disabled:opacity-50">
          1-18
        </button>
        <button disabled={spinning} onClick={() => spin('high')}
          className="flex-1 py-2 rounded bg-muted/50 border border-border text-foreground font-bold text-[0.55rem] disabled:opacity-50">
          19-36
        </button>
      </div>

      {result && (
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
