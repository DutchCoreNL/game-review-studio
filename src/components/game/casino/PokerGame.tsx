import { useState, useCallback } from 'react';
import { PlayingCard } from '@/game/types';
import { GameButton } from '../ui/GameButton';
import { CardDisplay } from './CardDisplay';
import { BetControls } from './BetControls';
import { SessionStatsBar } from './SessionStatsBar';
import { WinCelebration } from './WinCelebration';
import { CasinoSessionStats } from './casinoUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { gameApi } from '@/lib/gameApi';
import { playCardDeal, playBlackjackWin, playLoss } from '@/game/sounds/casinoSounds';

interface PokerGameProps {
  dispatch: (action: any) => void;
  showToast: (msg: string, isError?: boolean) => void;
  money: number;
  state: { ownedDistricts: string[]; districtRep: Record<string, number> };
  sessionStats: CasinoSessionStats;
  onResult: (won: boolean | null, amount: number) => void;
}

type PokerPhase = 'idle' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

interface PokerState {
  playerHand: PlayingCard[];
  dealerHand: PlayingCard[];
  communityCards: PlayingCard[];
  phase: PokerPhase;
  pot: number;
  playerBet: number;
  dealerBet: number;
  result: string;
  playerHandName: string;
  dealerHandName: string;
  won: boolean | null;
  netResult: number;
  dealerFolded: boolean;
}

const INITIAL_POKER: PokerState = {
  playerHand: [],
  dealerHand: [],
  communityCards: [],
  phase: 'idle',
  pot: 0,
  playerBet: 0,
  dealerBet: 0,
  result: '',
  playerHandName: '',
  dealerHandName: '',
  won: null,
  netResult: 0,
  dealerFolded: false,
};

export function PokerGame({ dispatch, showToast, money, state, sessionStats, onResult }: PokerGameProps) {
  const [bet, setBet] = useState(100);
  const [poker, setPoker] = useState<PokerState>(INITIAL_POKER);
  const [loading, setLoading] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);

  const deal = useCallback(async () => {
    if (bet > money || bet < 10) return showToast('Niet genoeg geld!', true);
    setLoading(true);
    playCardDeal();

    try {
      const res = await gameApi.casinoPlay('poker', bet, { action: 'deal' });
      if (!res.success) { showToast(res.message || 'Fout', true); setLoading(false); return; }
      const d = res.data;
      setPoker({
        playerHand: d.playerHand,
        dealerHand: [], // hidden until showdown
        communityCards: [],
        phase: 'preflop',
        pot: bet * 2, // both players ante
        playerBet: bet,
        dealerBet: bet,
        result: '',
        playerHandName: '',
        dealerHandName: '',
        won: null,
        netResult: 0,
        dealerFolded: false,
      });
      dispatch({ type: 'SYNC_MONEY', amount: d.newMoney });
    } catch {
      showToast('Server fout', true);
    }
    setLoading(false);
  }, [bet, money, dispatch, showToast]);

  const act = useCallback(async (action: 'check' | 'raise' | 'fold') => {
    if (action === 'fold') {
      // Player folds — lose bet
      setPoker(prev => ({
        ...prev,
        phase: 'showdown',
        result: 'Je hebt gefold. Dealer wint.',
        won: false,
        netResult: -prev.playerBet,
      }));
      onResult(false, -poker.playerBet);
      playLoss();
      return;
    }

    setLoading(true);
    const raiseAmount = action === 'raise' ? bet : 0;

    // Check if player can afford raise
    if (action === 'raise' && raiseAmount > money) {
      showToast('Niet genoeg geld om te raisen!', true);
      setLoading(false);
      return;
    }

    try {
      const res = await gameApi.casinoPlay('poker', raiseAmount, {
        action: 'continue',
        phase: poker.phase,
        playerHand: poker.playerHand,
        communityCards: poker.communityCards,
        pot: poker.pot,
        playerBet: poker.playerBet,
        isRaise: action === 'raise',
      });

      if (!res.success) { showToast(res.message || 'Fout', true); setLoading(false); return; }
      const d = res.data;

      if (d.dealerFolded) {
        setPoker(prev => ({
          ...prev,
          phase: 'showdown',
          pot: d.pot,
          result: '🏆 Dealer foldt! Jij wint de pot!',
          won: true,
          netResult: d.netResult,
          dealerFolded: true,
        }));
        onResult(true, d.netResult);
        playBlackjackWin();
        setWinAmount(d.netResult);
        setShowWin(true);
        setTimeout(() => setShowWin(false), 2000);
      } else if (d.phase === 'showdown') {
        setPoker(prev => ({
          ...prev,
          phase: 'showdown',
          communityCards: d.communityCards,
          dealerHand: d.dealerHand,
          pot: d.pot,
          playerBet: d.playerTotalBet || prev.playerBet,
          result: d.resultText,
          playerHandName: d.playerHandName,
          dealerHandName: d.dealerHandName,
          won: d.won,
          netResult: d.netResult,
          dealerFolded: false,
        }));
        onResult(d.won, d.netResult);
        if (d.won) {
          playBlackjackWin();
          setWinAmount(d.netResult);
          setShowWin(true);
          setTimeout(() => setShowWin(false), 2000);
        } else {
          playLoss();
        }
      } else {
        // Next phase
        playCardDeal();
        setPoker(prev => ({
          ...prev,
          phase: d.phase,
          communityCards: d.communityCards,
          pot: d.pot,
          playerBet: d.playerTotalBet || prev.playerBet,
        }));
      }

      if (d.newMoney !== undefined) {
        dispatch({ type: 'SYNC_MONEY', amount: d.newMoney });
      }
    } catch {
      showToast('Server fout', true);
    }
    setLoading(false);
  }, [poker, bet, money, dispatch, showToast, onResult]);

  const isPlaying = poker.phase !== 'idle' && poker.phase !== 'showdown';
  const isShowdown = poker.phase === 'showdown';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card overflow-hidden">
      {/* Header */}
      <div className="relative h-24 overflow-hidden bg-gradient-to-b from-emerald-900/60 to-card">
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        <h3 className="absolute bottom-2 left-0 right-0 text-center text-gold font-bold text-lg font-display gold-text-glow">
          TEXAS HOLD'EM
        </h3>
      </div>

      <div className="p-4 pt-2 space-y-3">
        <SessionStatsBar stats={sessionStats} />

        {showWin && <WinCelebration amount={winAmount} show={showWin} />}

        {/* Pot indicator */}
        {isPlaying && (
          <div className="text-center">
            <span className="text-xs text-muted-foreground">POT</span>
            <div className="text-gold font-bold text-lg font-display">€{poker.pot.toLocaleString()}</div>
            <span className="text-[0.55rem] text-muted-foreground uppercase tracking-wider">
              {poker.phase === 'preflop' ? 'Pre-Flop' : poker.phase === 'flop' ? 'Flop' : poker.phase === 'turn' ? 'Turn' : 'River'}
            </span>
          </div>
        )}

        {/* Community Cards */}
        {(isPlaying || isShowdown) && poker.communityCards.length > 0 && (
          <div className="text-center">
            <div className="text-[0.5rem] text-muted-foreground uppercase tracking-wider mb-1">Community Cards</div>
            <div className="flex justify-center gap-1">
              {poker.communityCards.map((card, i) => (
                <motion.div key={i} initial={{ scale: 0, rotateY: 180 }} animate={{ scale: 1, rotateY: 0 }} transition={{ delay: i * 0.15 }}>
                  <CardDisplay card={card} large />
                </motion.div>
              ))}
              {/* Placeholder cards for unrevealed community cards */}
              {Array.from({ length: 5 - poker.communityCards.length }).map((_, i) => (
                <CardDisplay key={`ph-${i}`} card={null} hidden large />
              ))}
            </div>
          </div>
        )}

        {/* Dealer Hand (only at showdown) */}
        {isShowdown && poker.dealerHand.length > 0 && !poker.dealerFolded && (
          <div className="text-center">
            <div className="text-[0.5rem] text-muted-foreground uppercase tracking-wider mb-1">
              Dealer {poker.dealerHandName && <span className="text-blood">— {poker.dealerHandName}</span>}
            </div>
            <div className="flex justify-center gap-1">
              {poker.dealerHand.map((card, i) => (
                <motion.div key={i} initial={{ rotateY: 180 }} animate={{ rotateY: 0 }} transition={{ delay: i * 0.1 }}>
                  <CardDisplay card={card} large />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Player Hand */}
        {(isPlaying || isShowdown) && poker.playerHand.length > 0 && (
          <div className="text-center">
            <div className="text-[0.5rem] text-muted-foreground uppercase tracking-wider mb-1">
              Jouw Hand {poker.playerHandName && <span className="text-gold">— {poker.playerHandName}</span>}
            </div>
            <div className="flex justify-center gap-1">
              {poker.playerHand.map((card, i) => (
                <CardDisplay key={i} card={card} large />
              ))}
            </div>
          </div>
        )}

        {/* Dealer hidden hand during play */}
        {isPlaying && (
          <div className="text-center">
            <div className="text-[0.5rem] text-muted-foreground uppercase tracking-wider mb-1">Dealer</div>
            <div className="flex justify-center gap-1">
              <CardDisplay card={null} hidden large />
              <CardDisplay card={null} hidden large />
            </div>
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {isShowdown && poker.result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-2">
              <div className={`font-bold text-sm ${poker.won ? 'text-gold' : poker.won === false ? 'text-blood' : 'text-muted-foreground'}`}>
                {poker.result}
              </div>
              {poker.netResult !== 0 && (
                <div className={`text-lg font-display font-bold mt-1 ${poker.netResult > 0 ? 'text-gold gold-text-glow' : 'text-blood'}`}>
                  {poker.netResult > 0 ? '+' : ''}€{poker.netResult.toLocaleString()}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        {isPlaying && (
          <div className="grid grid-cols-3 gap-2">
            <GameButton variant="muted" size="sm" onClick={() => act('check')} disabled={loading}>
              {poker.phase === 'preflop' ? 'CALL' : 'CHECK'}
            </GameButton>
            <GameButton variant="gold" size="sm" onClick={() => act('raise')} disabled={loading}>
              RAISE €{bet >= 1000 ? `${Math.floor(bet/1000)}k` : bet}
            </GameButton>
            <GameButton variant="blood" size="sm" onClick={() => act('fold')} disabled={loading}>
              FOLD
            </GameButton>
          </div>
        )}

        {/* Deal / Play Again */}
        {(poker.phase === 'idle' || isShowdown) && (
          <div className="space-y-2">
            <BetControls bet={bet} setBet={setBet} money={money} disabled={loading} />
            <GameButton variant="gold" size="lg" fullWidth glow onClick={deal} disabled={loading}>
              {isShowdown ? 'OPNIEUW SPELEN' : 'DEAL — TEXAS HOLD\'EM'}
            </GameButton>
          </div>
        )}
      </div>
    </motion.div>
  );
}