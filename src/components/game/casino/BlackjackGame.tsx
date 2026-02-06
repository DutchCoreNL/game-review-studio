import { useState } from 'react';
import { PlayingCard } from '@/game/types';
import { GameButton } from '../ui/GameButton';
import { CardDisplay } from './CardDisplay';
import { BetControls } from './BetControls';
import { createDeck, getBlackjackScore, CasinoSessionStats, getTotalVipBonus, applyVipToWinnings } from './casinoUtils';
import { motion } from 'framer-motion';

interface BlackjackGameProps {
  dispatch: (action: any) => void;
  showToast: (msg: string, isError?: boolean) => void;
  money: number;
  state: { ownedDistricts: string[]; districtRep: Record<string, number> };
  sessionStats: CasinoSessionStats;
  onResult: (won: boolean | null, amount: number) => void;
}

export function BlackjackGame({ dispatch, showToast, money, state, sessionStats, onResult }: BlackjackGameProps) {
  const [bet, setBet] = useState(100);
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [currentBet, setCurrentBet] = useState(0);
  const [canDoubleDown, setCanDoubleDown] = useState(false);
  const [resultShake, setResultShake] = useState(false);

  const vipBonus = getTotalVipBonus(state);

  const deal = () => {
    if (bet > money || bet < 10) return showToast('Ongeldige inzet', true);
    dispatch({ type: 'CASINO_BET', amount: bet });
    setCurrentBet(bet);
    const d = createDeck();
    const ph = [d.pop()!, d.pop()!];
    const dh = [d.pop()!, d.pop()!];
    setDeck(d); setPlayerHand(ph); setDealerHand(dh);
    setPlaying(true); setResult(''); setCanDoubleDown(true);
    if (getBlackjackScore(ph) === 21) stand(ph, dh, d, bet);
  };

  const hit = () => {
    setCanDoubleDown(false);
    const newDeck = [...deck];
    const newHand = [...playerHand, newDeck.pop()!];
    setDeck(newDeck); setPlayerHand(newHand);
    if (getBlackjackScore(newHand) > 21) endGame(false, 'BUST! Meer dan 21.', newHand);
  };

  const doubleDown = () => {
    if (currentBet > money) return showToast('Niet genoeg geld!', true);
    dispatch({ type: 'CASINO_BET', amount: currentBet });
    const newBet = currentBet * 2;
    setCurrentBet(newBet);
    setCanDoubleDown(false);
    const newDeck = [...deck];
    const newHand = [...playerHand, newDeck.pop()!];
    setDeck(newDeck); setPlayerHand(newHand);
    if (getBlackjackScore(newHand) > 21) {
      endGame(false, 'BUST! Meer dan 21.', newHand, newBet);
    } else {
      stand(newHand, dealerHand, newDeck, newBet);
    }
  };

  const stand = (ph?: PlayingCard[], dh?: PlayingCard[], d?: PlayingCard[], activeBet?: number) => {
    const pHand = ph || playerHand;
    let dHand = [...(dh || dealerHand)];
    const dk = [...(d || deck)];
    const theBet = activeBet || currentBet;
    while (getBlackjackScore(dHand) < 17) dHand.push(dk.pop()!);
    setDealerHand(dHand); setDeck(dk);

    const ps = getBlackjackScore(pHand), ds = getBlackjackScore(dHand);
    if (ds > 21) endGame(true, 'Dealer Busted!', pHand, theBet);
    else if (ps > ds) endGame(true, 'Jij wint!', pHand, theBet);
    else if (ps === ds) { dispatch({ type: 'CASINO_WIN', amount: theBet }); endGame(null, 'Gelijkspel.', pHand, theBet); }
    else endGame(false, 'Dealer wint.', pHand, theBet);
  };

  const endGame = (win: boolean | null, msg: string, hand: PlayingCard[], theBet?: number) => {
    const activeBet = theBet || currentBet;
    setPlaying(false); setResult(msg); setCanDoubleDown(false);
    if (win === true) {
      const isBj = getBlackjackScore(hand) === 21 && hand.length === 2;
      const baseMult = isBj ? 2.5 : 2;
      const basePayout = Math.floor(activeBet * baseMult);
      // Apply VIP bonus to net profit only (preserves house edge)
      const winAmount = applyVipToWinnings(basePayout, activeBet, vipBonus);
      dispatch({ type: 'CASINO_WIN', amount: winAmount });
      dispatch({ type: 'TRACK_BLACKJACK_WIN' });
      setResultColor('text-emerald');
      onResult(true, winAmount - activeBet);
    } else if (win === false) {
      setResultColor('text-blood');
      setResultShake(true);
      setTimeout(() => setResultShake(false), 500);
      dispatch({ type: 'RESET_BLACKJACK_STREAK' });
      onResult(false, -activeBet);
    } else {
      setResultColor('text-foreground');
      onResult(null, 0);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card p-4">
      <h3 className="text-center text-gold font-bold text-lg font-display mb-1 gold-text-glow">BLACKJACK</h3>
      {sessionStats.currentStreak > 0 && (
        <p className="text-center text-[0.5rem] text-gold mb-2">🔥 Streak: {sessionStats.currentStreak}</p>
      )}

      {/* Dealer */}
      <div className="text-center mb-3">
        <p className="text-xs text-muted-foreground mb-1">Dealer {playing ? '(?)' : `(${getBlackjackScore(dealerHand)})`}</p>
        <div className="flex justify-center">
          {playing ? (
            <>
              <CardDisplay card={dealerHand[0]} />
              <CardDisplay card={null} hidden />
            </>
          ) : (
            dealerHand.map((c, i) => <CardDisplay key={i} card={c} />)
          )}
        </div>
      </div>

      {/* Player */}
      <motion.div
        className="text-center mb-4"
        animate={resultShake ? { x: [-4, 4, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs text-muted-foreground mb-1">Jij ({getBlackjackScore(playerHand)})</p>
        <div className="flex justify-center flex-wrap">
          {playerHand.map((c, i) => <CardDisplay key={i} card={c} />)}
        </div>
      </motion.div>

      {!playing ? (
        <div className="space-y-3">
          <BetControls bet={bet} setBet={setBet} money={money} />
          <GameButton variant="blood" fullWidth onClick={deal}>DEAL (€{bet})</GameButton>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <GameButton variant="blood" onClick={hit}>HIT</GameButton>
          <GameButton variant="muted" onClick={() => stand()}>STAND</GameButton>
          <GameButton
            variant="gold"
            onClick={doubleDown}
            disabled={!canDoubleDown || currentBet > money}
          >
            DOUBLE
          </GameButton>
        </div>
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
    </motion.div>
  );
}
