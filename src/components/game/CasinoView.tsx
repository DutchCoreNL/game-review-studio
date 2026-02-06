import { useGame } from '@/contexts/GameContext';
import { useState, useCallback } from 'react';
import { CasinoGame } from '@/game/types';
import { SectionHeader } from './ui/SectionHeader';
import { BlackjackGame } from './casino/BlackjackGame';
import { RouletteGame } from './casino/RouletteGame';
import { SlotsGame } from './casino/SlotsGame';
import { HighLowGame } from './casino/HighLowGame';
import { getVipBonus, INITIAL_SESSION_STATS, CasinoSessionStats } from './casino/casinoUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Spade, CircleDot, Gem, ArrowUpDown, CloudLightning, Star, TrendingUp, TrendingDown } from 'lucide-react';

export function CasinoView() {
  const { state, dispatch, showToast } = useGame();
  const [activeGame, setActiveGame] = useState<CasinoGame>(null);
  const [sessionStats, setSessionStats] = useState<CasinoSessionStats>(INITIAL_SESSION_STATS);

  const isStorm = state.weather === 'storm';
  const vipBonuses = getVipBonus(state);

  const handleResult = useCallback((won: boolean | null, amount: number) => {
    setSessionStats(prev => {
      const next = { ...prev };
      next.sessionProfit += amount;
      if (won === true) {
        next.sessionWins++;
        next.currentStreak++;
        next.bestStreak = Math.max(next.bestStreak, next.currentStreak);
      } else if (won === false) {
        next.sessionLosses++;
        next.currentStreak = 0;
      }
      return next;
    });

    // Neon Strip rep gain on big wins
    if (won && amount > 1000) {
      dispatch({ type: 'TRADE', gid: 'drugs', mode: 'buy', quantity: 0 }); // trigger is implicit
    }
  }, [dispatch]);

  // Storm blocker
  if (isStorm) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CloudLightning size={48} className="text-game-purple mx-auto mb-4" />
          <h2 className="font-display text-xl text-foreground mb-2 uppercase tracking-wider">CASINO GESLOTEN</h2>
          <p className="text-muted-foreground text-sm mb-1">Wegens stormweer is The Velvet Room</p>
          <p className="text-muted-foreground text-sm">tijdelijk gesloten.</p>
          <p className="text-[0.55rem] text-muted-foreground mt-4 italic">"Zelfs het geluk schuilt voor de bliksem."</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="THE VELVET ROOM" icon={<Gem size={12} />} />

      {/* VIP Status */}
      {vipBonuses.length > 0 && !activeGame && (
        <div className="game-card border-l-[3px] border-l-game-purple mb-3 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Star size={10} className="text-game-purple" />
            <span className="text-[0.55rem] font-bold text-game-purple uppercase tracking-wider">VIP Status</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {vipBonuses.map((b, i) => (
              <span key={i} className="text-[0.45rem] font-semibold px-1.5 py-0.5 rounded bg-game-purple/10 text-game-purple border border-game-purple/20">
                +{b.bonus}% {b.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Session Stats */}
      {!activeGame && (sessionStats.sessionWins > 0 || sessionStats.sessionLosses > 0) && (
        <div className="flex gap-3 justify-center mb-3 text-[0.55rem]">
          <span className="text-emerald font-bold flex items-center gap-0.5">
            <TrendingUp size={10} /> {sessionStats.sessionWins}W
          </span>
          <span className="text-blood font-bold flex items-center gap-0.5">
            <TrendingDown size={10} /> {sessionStats.sessionLosses}L
          </span>
          <span className={`font-bold ${sessionStats.sessionProfit >= 0 ? 'text-emerald' : 'text-blood'}`}>
            {sessionStats.sessionProfit >= 0 ? '+' : ''}€{sessionStats.sessionProfit.toLocaleString()}
          </span>
          {sessionStats.bestStreak > 1 && (
            <span className="text-gold font-bold">🔥 Best: {sessionStats.bestStreak}</span>
          )}
        </div>
      )}

      <div className="text-center mb-4">
        <p className="text-muted-foreground text-[0.6rem] italic">"Het huis wint altijd... tenzij jij vals speelt."</p>
        <p className="text-gold text-sm font-bold mt-1">€{state.money.toLocaleString()}</p>
      </div>

      <AnimatePresence mode="wait">
        {!activeGame ? (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-3">
            <GameCard icon={<Spade size={28} />} name="BLACKJACK" sub="2x Uitbetaling + Double Down" onClick={() => setActiveGame('blackjack')} />
            <GameCard icon={<CircleDot size={28} />} name="ROULETTE" sub="Tot 14x, 7 inzetopties" onClick={() => setActiveGame('roulette')} />
            <GameCard icon={<Gem size={28} />} name="SLOTS" sub="Progressive Jackpot" onClick={() => setActiveGame('slots')} />
            <GameCard icon={<ArrowUpDown size={28} />} name="HIGH-LOW" sub="Tot 20x, cash out!" onClick={() => setActiveGame('highlow')} color="game-purple" />
          </motion.div>
        ) : activeGame === 'blackjack' ? (
          <BlackjackGame key="bj" dispatch={dispatch} showToast={showToast} money={state.money}
            state={state} sessionStats={sessionStats} onResult={handleResult} />
        ) : activeGame === 'roulette' ? (
          <RouletteGame key="rl" dispatch={dispatch} showToast={showToast} money={state.money}
            state={state} onResult={handleResult} />
        ) : activeGame === 'slots' ? (
          <SlotsGame key="sl" dispatch={dispatch} showToast={showToast} money={state.money}
            state={{ ...state, casinoJackpot: state.casinoJackpot }} onResult={handleResult} />
        ) : (
          <HighLowGame key="hl" dispatch={dispatch} showToast={showToast} money={state.money}
            state={state} onResult={handleResult} />
        )}
      </AnimatePresence>

      {activeGame && (
        <button onClick={() => setActiveGame(null)}
          className="w-full mt-4 py-2 rounded text-xs font-semibold bg-muted border border-border text-muted-foreground">
          TERUG NAAR MENU
        </button>
      )}
    </div>
  );
}

function GameCard({ icon, name, sub, onClick, color }: { icon: React.ReactNode; name: string; sub: string; onClick: () => void; color?: string }) {
  return (
    <motion.button onClick={onClick}
      className="game-card-interactive flex flex-col items-center py-6 gap-2 bg-gradient-to-b from-card to-background"
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
      <div className={`${color ? `text-${color}` : 'text-gold'} gold-text-glow`}>{icon}</div>
      <span className="font-bold text-sm font-display tracking-wider">{name}</span>
      <span className="text-[0.55rem] text-muted-foreground text-center px-2">{sub}</span>
    </motion.button>
  );
}
