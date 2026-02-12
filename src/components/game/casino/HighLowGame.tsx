import { useState } from 'react';
import { PlayingCard } from '@/game/types';
import { GameButton } from '../ui/GameButton';
import { CardDisplay } from './CardDisplay';
import { BetControls } from './BetControls';
import { createDeck, getCardRankValue, getTotalVipBonus, applyVipToWinnings, CasinoSessionStats } from './casinoUtils';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Banknote } from 'lucide-react';
import { CASINO_GAME_IMAGES } from '@/assets/items/index';
import { playCardFlip, playStreakUp, playCashOut, playLoss } from '@/game/sounds/casinoSounds';

// Rebalanced multiplier ladder (lowered from 1.5/2/3/5/10/20)
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
  const [nextCard, setNextCard] = useState<PlayingCard | null>(null);
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [round, setRound] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [result, setResult] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [showNext, setShowNext] = useState(false);

  const vipBonus = getTotalVipBonus(state);

  const getCurrentMultiplier = () => {
    if (round <= 0) return 1;
    const entry = MULTIPLIER_LADDER[Math.min(round - 1, MULTIPLIER_LADDER.length - 1)];
    return entry.mult;
  };

  const startGame = () => {
    if (bet > money || bet < 10) return showToast('Ongeldige inzet', true);
    dispatch({ type: 'CASINO_BET', amount: bet });
    setCurrentBet(bet);
    const d = createDeck();
    const card = d.pop()!;
    setDeck(d);
    setCurrentCard(card);
    setNextCard(null);
    setRound(0);
    setPlaying(true);
    setResult('');
    setShowNext(false);
  };

  const guess = (higher: boolean) => {
    const d = [...deck];
    const next = d.pop()!;
    setDeck(d);
    setNextCard(next);
    setShowNext(true);
    playCardFlip();

    const currentVal = getCardRankValue(currentCard!.rank);
    const nextVal = getCardRankValue(next.rank);

    // Ties now count as a LOSS (push) to prevent exploitation
    const correct = higher
      ? nextVal > currentVal
      : nextVal < currentVal;

    setTimeout(() => {
      if (correct) {
        const newRound = round + 1;
        setRound(newRound);
        playStreakUp();
        setCurrentCard(next);
        setNextCard(null);
        setShowNext(false);

        // Track max round for achievement
        dispatch({ type: 'TRACK_HIGHLOW_ROUND', round: newRound });

        if (newRound >= 6) {
          // Max reached, auto cash out
          cashOut(newRound);
        }
      } else {
        // Lost!
        setPlaying(false);
        const isTie = nextVal === currentVal;
        setResult(isTie ? 'GELIJK! Verloren.' : 'FOUT! Alles verloren.');
        setResultColor('text-blood');
        onResult(false, -currentBet);
        playLoss();
      }
    }, 800);
  };

  const cashOut = (useRound?: number) => {
    const r = useRound || round;
    if (r <= 0) return;
    const mult = MULTIPLIER_LADDER[Math.min(r - 1, MULTIPLIER_LADDER.length - 1)].mult;
    const basePayout = Math.floor(currentBet * mult);
    const winAmount = applyVipToWinnings(basePayout, currentBet, vipBonus);
    dispatch({ type: 'CASINO_WIN', amount: winAmount });
    setPlaying(false);
    setResult(`GECASHED! +€${winAmount.toLocaleString()} (${mult}x)`);
    setResultColor('text-emerald');
    onResult(true, winAmount - currentBet);
    playCashOut();
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

      {/* Cards */}
      {playing && currentCard && (
        <div className="flex justify-center items-center gap-4 mb-4">
          <div className="text-center">
            <p className="text-[0.5rem] text-muted-foreground mb-1">HUIDIGE</p>
            <CardDisplay card={currentCard} large />
          </div>
          {showNext && nextCard && (
            <motion.div
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              className="text-center"
            >
              <p className="text-[0.5rem] text-muted-foreground mb-1">VOLGENDE</p>
              <CardDisplay card={nextCard} large />
            </motion.div>
          )}
          {!showNext && (
            <div className="text-center">
              <p className="text-[0.5rem] text-muted-foreground mb-1">VOLGENDE</p>
              <CardDisplay card={null} hidden large />
            </div>
          )}
        </div>
      )}

      {/* Tie warning */}
      {playing && !showNext && (
        <p className="text-center text-[0.45rem] text-muted-foreground mb-2 italic">
          Gelijke waarde = verlies
        </p>
      )}

      {!playing ? (
        <div className="space-y-3">
          <BetControls bet={bet} setBet={setBet} money={money} />
          <GameButton variant="blood" fullWidth onClick={startGame}>START (€{bet})</GameButton>
        </div>
      ) : !showNext ? (
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
            <GameButton variant="gold" fullWidth glow onClick={() => cashOut()} icon={<Banknote size={14} />}>
              CASH OUT ({getCurrentMultiplier()}x = €{Math.floor(currentBet * getCurrentMultiplier()).toLocaleString()})
            </GameButton>
          )}
        </div>
      ) : null}

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
