import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Skull, DollarSign, Zap } from 'lucide-react';
import { GameButton } from '../ui/GameButton';
import { BetControls } from './BetControls';
import { SessionStatsBar } from './SessionStatsBar';
import { WinCelebration } from './WinCelebration';
import { CasinoSessionStats } from './casinoUtils';
import { playCoinSound, playNegativeSound, playDramaticReveal } from '@/game/sounds';
import { MINIGAME_IMAGES } from '@/assets/items/index';
import { gameApi } from '@/lib/gameApi';

interface Props {
  dispatch: (action: any) => void;
  showToast: (msg: string, isError?: boolean) => void;
  money: number;
  state: any;
  sessionStats?: CasinoSessionStats;
  onResult: (won: boolean | null, amount: number) => void;
}

const MULTIPLIERS = [1.5, 2.5, 4, 7, 12];
const CHAMBERS = 6;

type Phase = 'betting' | 'playing' | 'result';

export function RussianRouletteGame({ dispatch, showToast, money, state, sessionStats, onResult }: Props) {
  const [bet, setBet] = useState(100);
  const [phase, setPhase] = useState<Phase>('betting');
  const [round, setRound] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [cylinderAngle, setCylinderAngle] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState<{ survived: number; dead: boolean; mult?: number; netResult?: number } | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);

  const currentMultiplier = round > 0 ? MULTIPLIERS[Math.min(round - 1, MULTIPLIERS.length - 1)] : 1;
  const potentialWin = Math.floor(bet * currentMultiplier);

  const startGame = useCallback(() => {
    if (bet < 10 || bet > money) return;
    setPhase('playing');
    setRound(0);
    setResultData(null);
    setShowWin(false);
  }, [bet, money]);

  const triggerWin = (amount: number) => {
    setWinAmount(amount);
    setShowWin(true);
    setTimeout(() => setShowWin(false), 2000);
  };

  const pullTrigger = useCallback(async () => {
    if (spinning || loading) return;
    setSpinning(true);
    playDramaticReveal();
    setCylinderAngle(prev => prev + 720 + Math.random() * 360);

    const targetRounds = round + 1;

    setTimeout(async () => {
      setSpinning(false);
      setLoading(true);

      try {
        const res = await gameApi.casinoPlay('russian_roulette', bet, { rounds: targetRounds });
        if (!res.success) {
          showToast(res.message, true);
          setLoading(false);
          return;
        }

        const data = res.data!;
        setResultData(data as any);

        if (data.dead) {
          setRound(data.survived);
          setPhase('result');
          playNegativeSound();
          onResult(false, data.netResult);
          showToast(`💀 BANG! Je verliest €${bet.toLocaleString()}`, true);
        } else {
          setRound(data.survived);
          if (data.survived >= MULTIPLIERS.length) {
            setPhase('result');
            playCoinSound();
            onResult(true, data.netResult);
            triggerWin(data.netResult);
            showToast(`💰 Cash out! €${(data.netResult + bet).toLocaleString()} (${data.mult}x)`);
          }
        }

        if (data.newMoney !== undefined) dispatch({ type: 'SET_MONEY', amount: data.newMoney });
      } catch {
        showToast('Server fout.', true);
      } finally {
        setLoading(false);
      }
    }, 1500);
  }, [spinning, loading, round, bet, dispatch, onResult, showToast]);

  const cashOut = useCallback(async () => {
    if (round <= 0 || loading) return;
    setLoading(true);

    try {
      const res = await gameApi.casinoPlay('russian_roulette', bet, { rounds: round });
      if (!res.success) {
        showToast(res.message, true);
        setLoading(false);
        return;
      }

      const data = res.data!;
      setResultData(data as any);

      if (!data.dead && data.netResult > 0) {
        setPhase('result');
        playCoinSound();
        onResult(true, data.netResult);
        triggerWin(data.netResult);
        showToast(`💰 Cash out! €${(data.netResult + bet).toLocaleString()} (${data.mult}x)`);
      } else if (data.dead) {
        setPhase('result');
        playNegativeSound();
        onResult(false, data.netResult);
      }

      if (data.newMoney !== undefined) dispatch({ type: 'SET_MONEY', amount: data.newMoney });
    } catch {
      showToast('Server fout.', true);
    } finally {
      setLoading(false);
    }
  }, [round, bet, loading, dispatch, onResult, showToast]);

  const reset = () => {
    setPhase('betting');
    setRound(0);
    setResultData(null);
    setShowWin(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card overflow-hidden">
      {/* Cinematic header */}
      <div className="relative h-24 overflow-hidden">
        <img src={MINIGAME_IMAGES.russian_roulette} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        <h3 className="absolute bottom-2 left-0 right-0 text-center text-blood font-bold text-lg font-display">RUSSIAN ROULETTE</h3>
      </div>
      <div className="p-4 pt-2">
        {sessionStats && <SessionStatsBar stats={sessionStats} />}
        <WinCelebration amount={winAmount} show={showWin} />

        {phase === 'betting' && (
          <div className="space-y-3">
            <div className="text-center">
              <Crosshair size={28} className="text-blood mx-auto mb-2" />
              <p className="text-[0.55rem] text-muted-foreground mt-1">6 kamers. 1 kogel. Hoeveel rondes durf je?</p>
            </div>

            <div className="game-card p-3 space-y-2 text-[0.6rem]">
              {MULTIPLIERS.map((m, i) => (
                <div key={i} className="flex justify-between text-muted-foreground">
                  <span>Ronde {i + 1}</span>
                  <span className={`font-bold ${i === MULTIPLIERS.length - 1 ? 'text-blood' : 'text-gold'}`}>
                    {m}x {i === MULTIPLIERS.length - 1 ? '☠️' : ''}
                  </span>
                </div>
              ))}
            </div>

            <BetControls bet={bet} setBet={setBet} money={money} />
            <GameButton variant="blood" fullWidth glow onClick={startGame} disabled={bet < 10 || bet > money} icon={<Skull size={14} />}>
              SPEEL — €{bet.toLocaleString()}
            </GameButton>
          </div>
        )}

        {phase === 'playing' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <motion.div
                animate={{ rotate: cylinderAngle }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="relative w-28 h-28 rounded-full border-2 border-blood/40 bg-muted/30 flex items-center justify-center"
              >
                {Array.from({ length: CHAMBERS }).map((_, i) => {
                  const angle = (i * 360) / CHAMBERS;
                  const isFilled = i === 0;
                  return (
                    <div
                      key={i}
                      className="absolute w-3.5 h-3.5 rounded-full"
                      style={{
                        transform: `rotate(${angle}deg) translateY(-36px)`,
                        background: isFilled ? 'hsl(var(--blood))' : 'hsl(var(--muted))',
                        border: '1px solid hsl(var(--border))',
                      }}
                    />
                  );
                })}
                <Crosshair size={24} className={`${spinning ? 'text-blood animate-pulse' : 'text-muted-foreground'}`} />
              </motion.div>

              <div className="mt-3 text-center">
                <p className="text-xs font-bold text-foreground">Ronde {round + 1} van {MULTIPLIERS.length}</p>
                <p className="text-[0.55rem] text-muted-foreground">
                  Kans: {Math.round((1 / (CHAMBERS - round)) * 100)}% dood
                </p>
              </div>
            </div>

            <div className="game-card p-3 text-center">
              <p className="text-[0.55rem] text-muted-foreground">Inzet</p>
              <p className="text-sm font-bold text-gold">€{bet.toLocaleString()}</p>
              {round > 0 && (
                <>
                  <p className="text-[0.55rem] text-muted-foreground mt-1">Huidige waarde</p>
                  <p className="text-sm font-bold text-emerald">€{potentialWin.toLocaleString()} ({currentMultiplier}x)</p>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {round > 0 && (
                <GameButton variant="gold" fullWidth onClick={cashOut} disabled={spinning || loading} icon={<DollarSign size={14} />}>
                  CASH OUT €{potentialWin.toLocaleString()}
                </GameButton>
              )}
              <GameButton variant="blood" fullWidth onClick={pullTrigger} disabled={spinning || loading} icon={<Zap size={14} />}>
                {spinning || loading ? 'DRAAIT...' : 'TREK DE TREKKER'}
              </GameButton>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3">
            {resultData?.dead ? (
              <>
                <Skull size={48} className="text-blood mx-auto" />
                <h3 className="font-display text-lg text-blood uppercase">BANG!</h3>
                <p className="text-sm text-muted-foreground">Je verliest €{bet.toLocaleString()}</p>
              </>
            ) : (
              <>
                <DollarSign size={48} className="text-gold mx-auto" />
                <h3 className="font-display text-lg text-gold uppercase">Overleefd!</h3>
                <p className="text-sm text-emerald font-bold">
                  €{((resultData?.netResult || 0) + bet).toLocaleString()} gewonnen
                </p>
              </>
            )}
            <GameButton variant="muted" fullWidth onClick={reset}>OPNIEUW SPELEN</GameButton>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
