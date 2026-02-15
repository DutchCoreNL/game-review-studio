import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Skull, DollarSign, Zap } from 'lucide-react';
import { GameButton } from '../ui/GameButton';
import { BetControls } from './BetControls';
import { getTotalVipBonus, applyVipToWinnings } from './casinoUtils';
import { playCoinSound, playNegativeSound, playDramaticReveal } from '@/game/sounds';
import { MINIGAME_IMAGES } from '@/assets/items';

interface Props {
  dispatch: (action: any) => void;
  showToast: (msg: string, isError?: boolean) => void;
  money: number;
  state: any;
  onResult: (won: boolean | null, amount: number) => void;
}

const MULTIPLIERS = [1.5, 2.5, 4, 7, 12];
const CHAMBERS = 6;

type Phase = 'betting' | 'playing' | 'result';

export function RussianRouletteGame({ dispatch, showToast, money, state, onResult }: Props) {
  const [bet, setBet] = useState(100);
  const [phase, setPhase] = useState<Phase>('betting');
  const [round, setRound] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<'alive' | 'dead' | null>(null);
  const [cylinderAngle, setCylinderAngle] = useState(0);

  const vipBonus = getTotalVipBonus(state);
  const currentMultiplier = round > 0 ? MULTIPLIERS[Math.min(round - 1, MULTIPLIERS.length - 1)] : 1;
  const potentialWin = Math.floor(bet * currentMultiplier);

  const startGame = useCallback(() => {
    if (bet < 10 || bet > money) return;
    dispatch({ type: 'CASINO_BET', amount: bet });
    setPhase('playing');
    setRound(0);
    setResult(null);
  }, [bet, money, dispatch]);

  const pullTrigger = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    playDramaticReveal();
    setCylinderAngle(prev => prev + 720 + Math.random() * 360);

    const nextRound = round + 1;
    // Probability: 1/(CHAMBERS - round) — gets harder each round
    const chambersLeft = CHAMBERS - round;
    const isDead = Math.random() < (1 / chambersLeft);

    setTimeout(() => {
      setSpinning(false);
      setRound(nextRound);

      if (isDead) {
        setResult('dead');
        setPhase('result');
        playNegativeSound();
        dispatch({ type: 'CASINO_BET', amount: 0 }); // loss already deducted
        onResult(false, -bet);
        showToast(`💀 BANG! Je verliest €${bet.toLocaleString()}`, true);
      } else {
        setResult('alive');
        // Auto cash-out at max round
        if (nextRound >= MULTIPLIERS.length) {
          cashOut(nextRound);
        }
      }
    }, 1500);
  }, [spinning, round, bet, dispatch, onResult, showToast]);

  const cashOut = useCallback((atRound?: number) => {
    const r = atRound || round;
    const mult = MULTIPLIERS[Math.min(r - 1, MULTIPLIERS.length - 1)];
    let winnings = Math.floor(bet * mult);
    if (vipBonus > 0) {
      winnings = applyVipToWinnings(winnings, bet, vipBonus);
    }
    dispatch({ type: 'CASINO_WIN', amount: winnings });
    onResult(true, winnings - bet);
    playCoinSound();
    showToast(`💰 Cash out! €${winnings.toLocaleString()} (${mult}x)`);
    setPhase('result');
    setResult('alive');
  }, [round, bet, vipBonus, dispatch, onResult, showToast]);

  const reset = () => {
    setPhase('betting');
    setRound(0);
    setResult(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      {phase === 'betting' && (
        <div className="space-y-3">
          <div className="text-center">
            <Crosshair size={32} className="text-blood mx-auto mb-2" />
            <h3 className="font-display text-sm uppercase tracking-wider text-foreground">Russian Roulette</h3>
            <p className="text-[0.55rem] text-muted-foreground mt-1">6 kamers. 1 kogel. Hoeveel rondes durf je?</p>
          </div>

          <div className="game-card p-3 space-y-2 text-[0.6rem]">
            <div className="flex justify-between text-muted-foreground">
              <span>Ronde 1</span><span className="text-gold font-bold">1.5x</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Ronde 2</span><span className="text-gold font-bold">2.5x</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Ronde 3</span><span className="text-gold font-bold">4x</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Ronde 4</span><span className="text-gold font-bold">7x</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Ronde 5</span><span className="text-blood font-bold">12x ☠️</span>
            </div>
          </div>

          <BetControls bet={bet} setBet={setBet} money={money} />
          <GameButton variant="blood" fullWidth glow onClick={startGame} disabled={bet < 10 || bet > money} icon={<Skull size={14} />}>
            SPEEL — €{bet.toLocaleString()}
          </GameButton>
        </div>
      )}

      {phase === 'playing' && (
        <div className="space-y-4">
          {/* Cylinder visual */}
          <div className="flex flex-col items-center">
            <motion.div
              animate={{ rotate: cylinderAngle }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="relative w-28 h-28 rounded-full border-2 border-blood/40 bg-muted/30 flex items-center justify-center"
            >
              {Array.from({ length: CHAMBERS }).map((_, i) => {
                const angle = (i * 360) / CHAMBERS;
                const isFilled = i === 0; // visual hint — 1 bullet
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

          {/* Current stake info */}
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

          {/* Alive flash */}
          <AnimatePresence>
            {result === 'alive' && !spinning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-emerald font-bold text-sm"
              >
                ✓ KLIK — Overleeft! ({currentMultiplier}x)
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-2">
            {round > 0 && (
              <GameButton variant="gold" fullWidth onClick={() => cashOut()} disabled={spinning} icon={<DollarSign size={14} />}>
                CASH OUT €{potentialWin.toLocaleString()}
              </GameButton>
            )}
            <GameButton variant="blood" fullWidth onClick={pullTrigger} disabled={spinning} icon={<Zap size={14} />}>
              {spinning ? 'DRAAIT...' : 'TREK DE TREKKER'}
            </GameButton>
          </div>
        </div>
      )}

      {phase === 'result' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3">
          {result === 'dead' ? (
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
                €{potentialWin.toLocaleString()} gewonnen
              </p>
            </>
          )}
          <GameButton variant="muted" fullWidth onClick={reset}>OPNIEUW SPELEN</GameButton>
        </motion.div>
      )}
    </motion.div>
  );
}
