import { useState } from 'react';
import { PlayingCard } from '@/game/types';
import { GameButton } from '../ui/GameButton';
import { CardDisplay } from './CardDisplay';
import { BetControls } from './BetControls';
import { CasinoSessionStats, getTotalVipBonus } from './casinoUtils';
import { motion } from 'framer-motion';
import { CASINO_GAME_IMAGES } from '@/assets/items/index';
import { playCardDeal, playBlackjackWin, playBlackjackBust, playBlackjackNatural } from '@/game/sounds/casinoSounds';
import { gameApi } from '@/lib/gameApi';

interface BlackjackGameProps {
  dispatch: (action: any) => void;
  showToast: (msg: string, isError?: boolean) => void;
  money: number;
  state: { ownedDistricts: string[]; districtRep: Record<string, number> };
  sessionStats: CasinoSessionStats;
  onResult: (won: boolean | null, amount: number) => void;
  onMoneyUpdate?: (newMoney: number) => void;
}

export function BlackjackGame({ dispatch, showToast, money, state, sessionStats, onResult, onMoneyUpdate }: BlackjackGameProps) {
  const [bet, setBet] = useState(100);
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [currentBet, setCurrentBet] = useState(0);
  const [canDoubleDown, setCanDoubleDown] = useState(false);
  const [resultShake, setResultShake] = useState(false);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  // Local deck for visual display only
  const [localDeck, setLocalDeck] = useState<PlayingCard[]>([]);

  const vipBonus = getTotalVipBonus(state);

  // Create a local deck for visual card display during play
  const createLocalDeck = (): PlayingCard[] => {
    const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const SUITS: ('spade'|'heart'|'diamond'|'club')[] = ['spade', 'heart', 'diamond', 'club'];
    const deck: PlayingCard[] = [];
    for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };

  const getBlackjackScore = (hand: PlayingCard[]): number => {
    let score = 0, aces = 0;
    for (const card of hand) {
      if (card.rank === 'A') { aces++; score += 11; }
      else if (['K','Q','J'].includes(card.rank)) score += 10;
      else score += parseInt(card.rank);
    }
    while (score > 21 && aces > 0) { score -= 10; aces--; }
    return score;
  };

  const deal = () => {
    if (bet > money || bet < 10) return showToast('Ongeldige inzet', true);
    const d = createLocalDeck();
    const ph = [d.pop()!, d.pop()!];
    const dh = [d.pop()!, d.pop()!];
    setLocalDeck(d);
    setPlayerHand(ph);
    setDealerHand(dh);
    setCurrentBet(bet);
    setPlaying(true);
    setResult('');
    setCanDoubleDown(true);
    setActions([]);
    playCardDeal();

    if (getBlackjackScore(ph) === 21) {
      // Natural blackjack - send stand immediately
      submitToServer(['stand'], bet);
    }
  };

  const hit = () => {
    setCanDoubleDown(false);
    const newDeck = [...localDeck];
    const newHand = [...playerHand, newDeck.pop()!];
    setLocalDeck(newDeck);
    setPlayerHand(newHand);
    playCardDeal();
    const newActions = [...actions, 'hit'];
    setActions(newActions);

    if (getBlackjackScore(newHand) > 21) {
      submitToServer(newActions, currentBet);
    }
  };

  const doubleDown = () => {
    if (currentBet > money) return showToast('Niet genoeg geld!', true);
    const newBet = currentBet * 2;
    setCurrentBet(newBet);
    setCanDoubleDown(false);
    const newDeck = [...localDeck];
    const newHand = [...playerHand, newDeck.pop()!];
    setLocalDeck(newDeck);
    setPlayerHand(newHand);
    submitToServer([...actions, 'double'], bet);
  };

  const stand = () => {
    submitToServer([...actions, 'stand'], currentBet);
  };

  const submitToServer = async (finalActions: string[], originalBet: number) => {
    setPlaying(false);
    setLoading(true);

    try {
      const res = await gameApi.casinoPlay('blackjack', originalBet, { actions: finalActions });
      if (!res.success) {
        showToast(res.message, true);
        setLoading(false);
        return;
      }

      const data = res.data!;
      // Show server-authoritative hands
      setPlayerHand(data.playerHand || playerHand);
      setDealerHand(data.dealerHand || dealerHand);

      if (data.won === true) {
        setResult(data.isBj ? '♠ BLACKJACK!' : 'Jij wint!');
        setResultColor('text-emerald');
        onResult(true, data.netResult);
        dispatch({ type: 'TRACK_BLACKJACK_WIN' });
        if (data.isBj) playBlackjackNatural(); else playBlackjackWin();
      } else if (data.won === false) {
        setResult(data.playerScore > 21 ? 'BUST! Meer dan 21.' : 'Dealer wint.');
        setResultColor('text-blood');
        setResultShake(true);
        setTimeout(() => setResultShake(false), 500);
        dispatch({ type: 'RESET_BLACKJACK_STREAK' });
        onResult(false, data.netResult);
        playBlackjackBust();
      } else {
        setResult('Gelijkspel.');
        setResultColor('text-foreground');
        onResult(null, 0);
      }

      // Sync money from server
      if (data.newMoney !== undefined) {
        dispatch({ type: 'SET_MONEY', amount: data.newMoney });
      }
    } catch (err) {
      showToast('Server fout bij casino.', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card overflow-hidden">
      <div className="relative h-24 overflow-hidden">
        <img src={CASINO_GAME_IMAGES.blackjack} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        <h3 className="absolute bottom-2 left-0 right-0 text-center text-gold font-bold text-lg font-display gold-text-glow">BLACKJACK</h3>
      </div>
      <div className="p-4 pt-2">
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

      {!playing && !loading ? (
        <div className="space-y-3">
          <BetControls bet={bet} setBet={setBet} money={money} />
          <GameButton variant="blood" fullWidth onClick={deal}>DEAL (€{bet})</GameButton>
        </div>
      ) : playing ? (
        <div className="grid grid-cols-3 gap-2">
          <GameButton variant="blood" onClick={hit}>HIT</GameButton>
          <GameButton variant="muted" onClick={stand}>STAND</GameButton>
          <GameButton
            variant="gold"
            onClick={doubleDown}
            disabled={!canDoubleDown || currentBet > money}
          >
            DOUBLE
          </GameButton>
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
