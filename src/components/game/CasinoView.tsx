import { useGame } from '@/contexts/GameContext';
import { useState, useCallback } from 'react';
import { CasinoGame } from '@/game/types';
import { SectionHeader } from './ui/SectionHeader';
import { BlackjackGame } from './casino/BlackjackGame';
import { RouletteGame } from './casino/RouletteGame';
import { SlotsGame } from './casino/SlotsGame';
import { HighLowGame } from './casino/HighLowGame';
import { RussianRouletteGame } from './casino/RussianRouletteGame';
import { getVipBonus, INITIAL_SESSION_STATS, CasinoSessionStats } from './casino/casinoUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Spade, CircleDot, Gem, ArrowUpDown, CloudLightning, Star, TrendingUp, TrendingDown, Crosshair } from 'lucide-react';
import casinoBg from '@/assets/casino-bg.png';
import { CASINO_GAME_IMAGES } from '@/assets/items/index';

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
    <div className="relative min-h-[70vh] -mx-3 -mt-2 px-3 pt-2">
      {/* Background */}
      <img src={casinoBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
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
            <GameCard icon={<Spade size={28} />} name="BLACKJACK" sub="2x Uitbetaling + Double Down" onClick={() => setActiveGame('blackjack')} image={CASINO_GAME_IMAGES.blackjack} />
            <GameCard icon={<CircleDot size={28} />} name="ROULETTE" sub="Tot 14x, 7 inzetopties" onClick={() => setActiveGame('roulette')} image={CASINO_GAME_IMAGES.roulette} />
            <GameCard icon={<Gem size={28} />} name="SLOTS" sub="Progressive Jackpot" onClick={() => setActiveGame('slots')} image={CASINO_GAME_IMAGES.slots} />
            <GameCard icon={<ArrowUpDown size={28} />} name="HIGH-LOW" sub="Tot 20x, cash out!" onClick={() => setActiveGame('highlow')} color="game-purple" image={CASINO_GAME_IMAGES.highlow} />
            <GameCard icon={<Crosshair size={28} />} name="RUSSIAN ROULETTE" sub="Tot 12x, durf jij?" onClick={() => setActiveGame('russian_roulette')} color="blood" />
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
        ) : activeGame === 'highlow' ? (
          <HighLowGame key="hl" dispatch={dispatch} showToast={showToast} money={state.money}
            state={state} onResult={handleResult} />
        ) : (
          <RussianRouletteGame key="rr" dispatch={dispatch} showToast={showToast} money={state.money}
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
    </div>
  );
}

function GameCard({ icon, name, sub, onClick, color, image }: { icon: React.ReactNode; name: string; sub: string; onClick: () => void; color?: string; image?: string }) {
  return (
    <motion.button onClick={onClick}
      className="game-card-interactive flex flex-col items-center gap-0 bg-gradient-to-b from-card to-background overflow-hidden"
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
      {image && (
        <div className="relative w-full h-20 overflow-hidden">
          <img src={image} alt={name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
          <div className={`absolute bottom-1 left-0 right-0 flex justify-center ${color ? `text-${color}` : 'text-gold'} gold-text-glow`}>
            {icon}
          </div>
        </div>
      )}
      {!image && <div className={`py-4 ${color ? `text-${color}` : 'text-gold'} gold-text-glow`}>{icon}</div>}
      <div className="py-2 px-2">
        <span className="font-bold text-sm font-display tracking-wider block">{name}</span>
        <span className="text-[0.55rem] text-muted-foreground text-center block mt-0.5">{sub}</span>
      </div>
    </motion.button>
  );
}
