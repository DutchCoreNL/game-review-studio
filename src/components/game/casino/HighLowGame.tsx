import { useState } from 'react';
import { PlayingCard } from '@/game/types';
import { GameButton } from '../ui/GameButton';
import { CardDisplay } from './CardDisplay';
import { BetControls } from './BetControls';
import { CasinoSessionStats } from './casinoUtils';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Banknote } from 'lucide-react';
import { CASINO_GAME_IMAGES } from '@/assets/items/index';
import { playCardFlip, playStreakUp, playCashOut, playLoss } from '@/game/sounds/casinoSounds';
import { gameApi } from '@/lib/gameApi';

const MULTIPLIER_LADDER = [
  { round: 1, mult: 1.3 },
  { round: 2, mult: 1.8 },
  { round: 3, mult: 2.5 },
  { round: 4, mult: 4 },
  { round: 5, mult: 7 },
  { round: 6, mult: 12 },
];

interface HighLowGameProps {
  dispatch: (action: any) => void;
  showToast: (msg: string, isError?: boolean) => void;
  money: number;
  state: { ownedDistricts: string[]; districtRep: Record<string, number> };
  onResult: (won: boolean | null, amount: number) => void;
}

export function HighLowGame({ dispatch, showToast, money, state, onResult }: HighLowGameProps) {
  const [bet, setBet] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [currentCard, setCurrentCard] = useState<PlayingCard | null>(null);
  const [round, setRound] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [result, setResult] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const createLocalDeck = (): PlayingCard => {
    const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const SUITS: ('spade'|'heart'|'diamond'|'club')[] = ['spade', 'heart', 'diamond', 'club'];
    return { rank: RANKS[Math.floor(Math.random() * RANKS.length)], suit: SUITS[Math.floor(Math.random() * 4)] };
  };

  const getCurrentMultiplier = () => {
    if (round <= 0) return 1;
    return MULTIPLIER_LADDER[Math.min(round - 1, MULTIPLIER_LADDER.length - 1)].mult;
  };

  const startGame = () => {
    if (bet > money || bet < 10) return showToast('Ongeldige inzet', true);
    setCurrentBet(bet);
    setCurrentCard(createLocalDeck());
    setRound(0);
    setPlaying(true);
    setResult('');
    setGuesses([]);
  };

  const guess = (higher: boolean) => {
    const newGuesses = [...guesses, higher ? 'higher' : 'lower'];
    setGuesses(newGuesses);
    playCardFlip();

    // Optimistic: show next round visually
    setRound(prev => prev + 1);
    setCurrentCard(createLocalDeck());
    playStreakUp();

    dispatch({ type: 'TRACK_HIGHLOW_ROUND', round: newGuesses.length });

    if (newGuesses.length >= 6) {
      // Max rounds - auto submit
      submitToServer(newGuesses);
    }
  };

  const cashOut = () => {
    if (guesses.length <= 0) return;
    submitToServer(guesses);
  };

  const submitToServer = async (finalGuesses: string[]) => {
    setPlaying(false);
    setLoading(true);

    try {
      const res = await gameApi.casinoPlay('highlow', currentBet, { guesses: finalGuesses });
      if (!res.success) {
        showToast(res.message, true);
        setLoading(false);
        return;
      }

      const data = res.data!;
      if (data.lost) {
        setResult(`FOUT! Verloren na ronde ${data.round}.`);
        setResultColor('text-blood');
        onResult(false, data.netResult);
        playLoss();
      } else if (data.netResult > 0) {
        setResult(`GECASHED! +€${data.netResult.toLocaleString()} (${data.mult}x)`);
        setResultColor('text-emerald');
        onResult(true, data.netResult);
        playCashOut();
      } else {
        setResult('Geen winst.');
        setResultColor('text-foreground');
        onResult(null, 0);
      }

      if (data.newMoney !== undefined) dispatch({ type: 'SET_MONEY', amount: data.newMoney });
    } catch {
      showToast('Server fout.', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card overflow-hidden">
      <div className="relative h-24 overflow-hidden">
        <img src={CASINO_GAME_IMAGES.highlow} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        <h3 className="absolute bottom-2 left-0 right-0 text-center text-gold font-bold text-lg font-display gold-text-glow">HIGH-LOW</h3>
      </div>
      <div className="p-4 pt-2">

      {/* Multiplier Ladder */}
      {playing && (
        <div className="flex justify-center gap-1 mb-4">
          {MULTIPLIER_LADDER.map((entry, i) => (
            <div
              key={i}
              className={`px-2 py-1 rounded text-[0.5rem] font-bold transition-all ${
                i < round
                  ? 'bg-emerald/20 text-emerald border border-emerald/30'
                  : i === round
                  ? 'bg-gold/20 text-gold border border-gold animate-pulse'
                  : 'bg-muted text-muted-foreground border border-border'
              }`}
            >
              {entry.mult}x
            </div>
          ))}
        </div>
      )}

      {/* Card */}
      {playing && currentCard && (
        <div className="flex justify-center items-center gap-4 mb-4">
          <div className="text-center">
            <p className="text-[0.5rem] text-muted-foreground mb-1">HUIDIGE</p>
            <CardDisplay card={currentCard} large />
          </div>
          <div className="text-center">
            <p className="text-[0.5rem] text-muted-foreground mb-1">VOLGENDE</p>
            <CardDisplay card={null} hidden large />
          </div>
        </div>
      )}

      {playing && (
        <p className="text-center text-[0.45rem] text-muted-foreground mb-2 italic">
          Gelijke waarde = verlies
        </p>
      )}

      {!playing && !loading ? (
        <div className="space-y-3">
          <BetControls bet={bet} setBet={setBet} money={money} />
          <GameButton variant="blood" fullWidth onClick={startGame}>START (€{bet})</GameButton>
        </div>
      ) : playing ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <GameButton variant="blood" onClick={() => guess(true)} icon={<ArrowUp size={14} />}>
              HOGER
            </GameButton>
            <GameButton variant="muted" onClick={() => guess(false)} icon={<ArrowDown size={14} />}>
              LAGER
            </GameButton>
          </div>
          {round > 0 && (
            <GameButton variant="gold" fullWidth glow onClick={cashOut} icon={<Banknote size={14} />}>
              CASH OUT ({getCurrentMultiplier()}x = €{Math.floor(currentBet * getCurrentMultiplier()).toLocaleString()})
            </GameButton>
          )}
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground animate-pulse">Server verifieert...</p>
      )}

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
