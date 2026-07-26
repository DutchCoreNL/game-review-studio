import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Crosshair, Skull, DollarSign, Zap, Flame } from 'lucide-react';
import { GameButton } from '../ui/GameButton';
import { BetControls } from './BetControls';
import { SessionStatsBar } from './SessionStatsBar';
import { WinCelebration } from './WinCelebration';
import { CasinoSessionStats } from './casinoUtils';
import { playCoinSound, playNegativeSound, playDramaticReveal } from '@/game/sounds';
import { MINIGAME_IMAGES } from '@/assets/items/index';

interface Props {
  dispatch: (action: any) => void;
  showToast: (msg: string, isError?: boolean) => void;
  money: number;
  state: any;
  sessionStats?: CasinoSessionStats;
  onResult: (won: boolean | null, amount: number, heat?: number) => void;
}

/**
 * RUSSISCH ROULETTE — het achterkamertje.
 *
 * Two things were broken here, and one was dishonest.
 *
 *   1. Cash out re-rolled the entire game. It asked the engine to play `round` rounds
 *      again from scratch, so banking three survived pulls could kill you on pulls you
 *      had already survived. The pot was never safe.
 *   2. It settled money twice: once through onResult and once through a SET_MONEY write
 *      of a server-era `newMoney` field the local engine never returns.
 *   3. It advertised "X% dood" and then only ever took your stake. Nothing in the game
 *      could kill you, so the whole premise was a bluff.
 *
 * Now: each pull is one chamber, resolved here and banked in component state, so cashing
 * out is exactly that — walking away with what you have survived to. And the gun is real
 * in the only way this game can make it real: when it goes off, a shot has been fired in
 * a back room off the Strip, and the police hear about it. You lose the pot and you take
 * heat, which is the currency that actually hurts in Noxhaven.
 */

const MULTIPLIERS = [1.5, 2.5, 4, 7, 12];
const CHAMBERS = 6;
/** Heat from a gunshot in a room full of witnesses. */
const BANG_HEAT = 12;

type Phase = 'betting' | 'playing' | 'result';

export function RussianRouletteGame({ showToast, money, sessionStats, onResult }: Props) {
  const [bet, setBet] = useState(100);
  const [phase, setPhase] = useState<Phase>('betting');
  /** Chambers survived so far this run. */
  const [round, setRound] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [cylinderAngle, setCylinderAngle] = useState(0);
  const [outcome, setOutcome] = useState<{ dead: boolean; banked: number } | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);

  const currentMultiplier = round > 0 ? MULTIPLIERS[Math.min(round - 1, MULTIPLIERS.length - 1)] : 0;
  /** What walking away right now is worth, net of the stake you already committed. */
  const potNet = round > 0 ? Math.floor(bet * currentMultiplier) - bet : 0;
  /** Chambers left, so the odds shown are the odds of this pull. */
  const chambersLeft = CHAMBERS - round;
  const deathChance = Math.round((1 / chambersLeft) * 100);

  const startGame = useCallback(() => {
    if (bet < 10 || bet > money) return;
    setPhase('playing');
    setRound(0);
    setOutcome(null);
    setShowWin(false);
  }, [bet, money]);

  const triggerWin = (amount: number) => {
    setWinAmount(amount);
    setShowWin(true);
    setTimeout(() => setShowWin(false), 2000);
  };

  /** One chamber. Resolved here so the rounds you have survived stay survived. */
  const pullTrigger = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    playDramaticReveal();
    setCylinderAngle(prev => prev + 720 + Math.random() * 360);

    setTimeout(() => {
      setSpinning(false);
      const dead = Math.random() < 1 / chambersLeft;

      if (dead) {
        setOutcome({ dead: true, banked: -bet });
        setPhase('result');
        playNegativeSound();
        onResult(false, -bet, BANG_HEAT);
        showToast(`💀 BANG! Je verliest €${bet.toLocaleString()} — en de politie hoorde het.`, true);
        return;
      }

      const survived = round + 1;
      setRound(survived);
      // Surviving the last chamber is a forced cash-out: there is nothing left to pull.
      if (survived >= MULTIPLIERS.length) {
        const net = Math.floor(bet * MULTIPLIERS[MULTIPLIERS.length - 1]) - bet;
        setOutcome({ dead: false, banked: net });
        setPhase('result');
        playCoinSound();
        onResult(true, net);
        triggerWin(net);
        showToast(`💰 Alle kamers gehaald — €${(net + bet).toLocaleString()}`);
      }
    }, 1500);
  }, [spinning, chambersLeft, round, bet, onResult, showToast]);

  /** Walk away with the pot. No further roll — that was the bug. */
  const cashOut = useCallback(() => {
    if (round <= 0 || spinning) return;
    setOutcome({ dead: false, banked: potNet });
    setPhase('result');
    playCoinSound();
    onResult(true, potNet);
    triggerWin(potNet);
    showToast(`💰 Cash out — €${(potNet + bet).toLocaleString()} (${currentMultiplier}x)`);
  }, [round, spinning, potNet, bet, currentMultiplier, onResult, showToast]);

  const reset = () => {
    setPhase('betting');
    setRound(0);
    setOutcome(null);
    setShowWin(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card overflow-hidden">
      {/* Cinematic header */}
      <div className="relative h-24 overflow-hidden">
        <img src={MINIGAME_IMAGES.russian_roulette} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        <h3 className="absolute bottom-2 left-0 right-0 text-center text-blood font-bold text-lg font-display">RUSSISCH ROULETTE</h3>
      </div>
      <div className="p-4 pt-2">
        {sessionStats && <SessionStatsBar stats={sessionStats} />}
        <WinCelebration amount={winAmount} show={showWin} />

        {phase === 'betting' && (
          <div className="space-y-3">
            <div className="text-center">
              <Crosshair size={28} className="text-blood mx-auto mb-2" />
              <p className="text-[0.55rem] text-muted-foreground mt-1">Zes kamers, één kogel. Hoeveel keer durf je?</p>
            </div>

            <div className="game-card p-3 space-y-2 text-[0.6rem]">
              {MULTIPLIERS.map((m, i) => (
                <div key={i} className="flex justify-between text-muted-foreground">
                  <span>Kamer {i + 1} <span className="opacity-60">· {Math.round((1 / (CHAMBERS - i)) * 100)}% kans</span></span>
                  <span className={`font-bold ${i === MULTIPLIERS.length - 1 ? 'text-blood' : 'text-gold'}`}>
                    {m}x {i === MULTIPLIERS.length - 1 ? '☠️' : ''}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-1.5 text-[0.5rem] text-blood bg-blood/10 border border-blood/20 rounded px-2 py-1.5">
              <Flame size={11} className="flex-shrink-0 mt-px" />
              <span>Als hij afgaat verlies je je inzet <span className="font-bold">en +{BANG_HEAT} hitte</span> — een schot in een achterkamer blijft niet stil.</span>
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
                  // Chambers you have already pulled are spent and read as empty.
                  const spent = i < round;
                  return (
                    <div
                      key={i}
                      className="absolute w-3.5 h-3.5 rounded-full"
                      style={{
                        transform: `rotate(${angle}deg) translateY(-36px)`,
                        background: spent ? 'hsl(var(--background))' : 'hsl(var(--muted))',
                        border: `1px solid ${spent ? 'hsl(var(--emerald)/0.5)' : 'hsl(var(--border))'}`,
                      }}
                    />
                  );
                })}
                <Crosshair size={24} className={spinning ? 'text-blood animate-pulse' : 'text-muted-foreground'} />
              </motion.div>

              <div className="mt-3 text-center">
                <p className="text-xs font-bold text-foreground">Kamer {round + 1} van {MULTIPLIERS.length}</p>
                <p className="text-[0.55rem] text-muted-foreground">
                  {chambersLeft} kamers over · <span className="text-blood font-bold">{deathChance}%</span> dat hij afgaat
                </p>
              </div>
            </div>

            <div className="game-card p-3 text-center">
              <p className="text-[0.55rem] text-muted-foreground">Inzet</p>
              <p className="text-sm font-bold text-gold">€{bet.toLocaleString()}</p>
              {round > 0 && (
                <>
                  <p className="text-[0.55rem] text-muted-foreground mt-1">Nu waard</p>
                  <p className="text-sm font-bold text-emerald">
                    €{(potNet + bet).toLocaleString()} <span className="text-[0.55rem]">({currentMultiplier}x)</span>
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {round > 0 && (
                <GameButton variant="gold" fullWidth onClick={cashOut} disabled={spinning} icon={<DollarSign size={14} />}>
                  STOPPEN €{(potNet + bet).toLocaleString()}
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
            {outcome?.dead ? (
              <>
                <Skull size={48} className="text-blood mx-auto" />
                <h3 className="font-display text-lg text-blood uppercase">BANG!</h3>
                <p className="text-sm text-muted-foreground">Je verliest €{bet.toLocaleString()}</p>
                <p className="text-[0.6rem] text-blood">+{BANG_HEAT} hitte — er is gebeld.</p>
              </>
            ) : (
              <>
                <DollarSign size={48} className="text-gold mx-auto" />
                <h3 className="font-display text-lg text-gold uppercase">Weggelopen</h3>
                <p className="text-sm text-emerald font-bold">
                  €{((outcome?.banked || 0) + bet).toLocaleString()} mee naar buiten
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
