import { useGame } from '@/contexts/GameContext';
import { useState, useCallback } from 'react';
import { CasinoGame } from '@/game/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Spade, CircleDot, Gem } from 'lucide-react';

export function CasinoView() {
  const { state, dispatch, showToast } = useGame();
  const [activeGame, setActiveGame] = useState<CasinoGame>(null);

  return (
    <div>
      <SectionHeader title="THE VELVET ROOM" />
      <div className="text-center mb-4">
        {state.ownedDistricts.includes('neon') && (
          <p className="text-game-purple text-xs font-bold mb-1">NEON STRIP BONUS ACTIEF: Winstkansen verhoogd!</p>
        )}
        <p className="text-muted-foreground text-xs italic">"Het huis wint altijd... tenzij jij vals speelt."</p>
        <p className="text-gold text-sm font-bold mt-1">Beschikbaar: €{state.money.toLocaleString()}</p>
      </div>

      <AnimatePresence mode="wait">
        {!activeGame ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            <GameCard icon={<Spade size={28} />} name="BLACKJACK" sub="2x Uitbetaling" onClick={() => setActiveGame('blackjack')} />
            <GameCard icon={<CircleDot size={28} />} name="ROULETTE" sub="Tot 14x Uitbetaling" onClick={() => setActiveGame('roulette')} />
            <GameCard icon={<Gem size={28} />} name="SLOTS" sub="Jackpot: 50x" onClick={() => setActiveGame('slots')} />
          </motion.div>
        ) : activeGame === 'blackjack' ? (
          <BlackjackGame key="bj" state={state} dispatch={dispatch} showToast={showToast} />
        ) : activeGame === 'roulette' ? (
          <RouletteGame key="rl" state={state} dispatch={dispatch} showToast={showToast} />
        ) : (
          <SlotsGame key="sl" state={state} dispatch={dispatch} showToast={showToast} />
        )}
      </AnimatePresence>

      {activeGame && (
        <button
          onClick={() => setActiveGame(null)}
          className="w-full mt-4 py-2.5 rounded text-xs font-semibold bg-muted border border-border text-muted-foreground"
        >
          TERUG NAAR MENU
        </button>
      )}
    </div>
  );
}

function GameCard({ icon, name, sub, onClick }: { icon: React.ReactNode; name: string; sub: string; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="game-card-interactive flex flex-col items-center py-6 gap-2"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="text-gold">{icon}</div>
      <span className="font-bold text-sm">{name}</span>
      <span className="text-[0.6rem] text-muted-foreground">{sub}</span>
    </motion.button>
  );
}

// ========== BLACKJACK ==========
function BlackjackGame({ state, dispatch, showToast }: any) {
  const [bet, setBet] = useState(100);
  const [playerHand, setPlayerHand] = useState<string[]>([]);
  const [dealerHand, setDealerHand] = useState<string[]>([]);
  const [deck, setDeck] = useState<string[]>([]);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState('');
  const [resultColor, setResultColor] = useState('');

  const createDeck = () => {
    const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const d = [...ranks, ...ranks, ...ranks, ...ranks].sort(() => Math.random() - 0.5);
    return d;
  };

  const getScore = (hand: string[]) => {
    let score = 0, aces = 0;
    for (const card of hand) {
      if (card === 'A') { aces++; score += 11; }
      else if (['K','Q','J'].includes(card)) score += 10;
      else score += parseInt(card);
    }
    while (score > 21 && aces > 0) { score -= 10; aces--; }
    return score;
  };

  const deal = () => {
    if (bet > state.money || bet < 10) return showToast('Ongeldige inzet', true);
    dispatch({ type: 'SET_STATE', state: { ...state, money: state.money - bet } });
    const d = createDeck();
    const ph = [d.pop()!, d.pop()!];
    const dh = [d.pop()!, d.pop()!];
    setDeck(d);
    setPlayerHand(ph);
    setDealerHand(dh);
    setPlaying(true);
    setResult('');
    if (getScore(ph) === 21) stand(ph, dh, d);
  };

  const hit = () => {
    const newDeck = [...deck];
    const newHand = [...playerHand, newDeck.pop()!];
    setDeck(newDeck);
    setPlayerHand(newHand);
    if (getScore(newHand) > 21) endGame(false, 'BUST! Meer dan 21.', newHand);
  };

  const stand = (ph?: string[], dh?: string[], d?: string[]) => {
    const pHand = ph || playerHand;
    let dHand = [...(dh || dealerHand)];
    const dk = [...(d || deck)];
    while (getScore(dHand) < 17) dHand.push(dk.pop()!);
    setDealerHand(dHand);
    setDeck(dk);

    const ps = getScore(pHand);
    const ds = getScore(dHand);
    if (ds > 21) endGame(true, 'Dealer Busted! Jij wint!', pHand);
    else if (ps > ds) endGame(true, 'Jij wint!', pHand);
    else if (ps === ds) {
      dispatch({ type: 'SET_STATE', state: { ...state, money: state.money + bet } }); // push - note: money was already deducted
      endGame(null, 'Gelijkspel (Push).', pHand);
    }
    else endGame(false, 'Dealer wint.', pHand);
  };

  const endGame = (win: boolean | null, msg: string, hand: string[]) => {
    setPlaying(false);
    setResult(msg);
    if (win === true) {
      const isBj = getScore(hand) === 21 && hand.length === 2;
      let mult = isBj ? 2.5 : 2;
      if (state.ownedDistricts.includes('neon')) mult += 0.2;
      const winAmt = Math.floor(bet * mult);
      dispatch({ type: 'SET_STATE', state: { ...state, money: state.money + winAmt } });
      setResultColor('text-emerald');
    } else if (win === false) {
      setResultColor('text-blood');
    } else {
      setResultColor('text-foreground');
    }
  };

  const renderCard = (card: string, hidden = false) => (
    <span className={`inline-block w-9 h-12 rounded border-2 text-center leading-[48px] font-bold font-mono text-sm shadow mx-0.5 ${
      hidden ? 'bg-gradient-to-br from-blood to-[hsl(var(--blood-glow))] border-blood text-transparent' : 'bg-foreground/90 text-background border-foreground'
    }`}>
      {hidden ? '?' : card}
    </span>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card p-4">
      <h3 className="text-center text-gold font-bold text-lg mb-4">BLACKJACK</h3>

      {/* Dealer */}
      <div className="text-center mb-4">
        <p className="text-xs text-muted-foreground mb-1">Dealer {playing ? '(?)' : `(${getScore(dealerHand)})`}</p>
        <div>{playing ? (
          <>{renderCard(dealerHand[0])}{renderCard('', true)}</>
        ) : dealerHand.map((c, i) => <span key={i}>{renderCard(c)}</span>)}</div>
      </div>

      {/* Player */}
      <div className="text-center mb-4">
        <p className="text-xs text-muted-foreground mb-1">Jij ({getScore(playerHand)})</p>
        <div>{playerHand.map((c, i) => <span key={i}>{renderCard(c)}</span>)}</div>
      </div>

      {!playing ? (
        <div className="space-y-2">
          <input
            type="number"
            value={bet}
            onChange={e => setBet(Math.abs(parseInt(e.target.value) || 0))}
            className="w-full py-2 px-3 bg-muted border border-border rounded text-center text-foreground text-sm"
            min={10}
          />
          <button onClick={deal} className="w-full py-2.5 rounded bg-blood text-primary-foreground font-bold text-sm">
            DEAL (€{bet})
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={hit} className="py-2.5 rounded bg-blood text-primary-foreground font-bold text-sm">HIT</button>
          <button onClick={() => stand()} className="py-2.5 rounded bg-muted text-foreground font-bold text-sm border border-border">STAND</button>
        </div>
      )}

      {result && <p className={`text-center font-bold mt-3 text-sm ${resultColor}`}>{result}</p>}
    </motion.div>
  );
}

// ========== ROULETTE ==========
function RouletteGame({ state, dispatch, showToast }: any) {
  const [bet, setBet] = useState(100);
  const [result, setResult] = useState('');
  const [resultColor, setResultColor] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [wheelNum, setWheelNum] = useState<number | null>(null);
  const [wheelColor, setWheelColor] = useState('');

  const redNums = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

  const spin = (choice: 'red' | 'black' | 'green') => {
    if (bet > state.money) return showToast('Niet genoeg geld!', true);
    dispatch({ type: 'SET_STATE', state: { ...state, money: state.money - bet } });
    setSpinning(true);
    setResult('');

    let counter = 0;
    const interval = setInterval(() => {
      const num = Math.floor(Math.random() * 37);
      const color = num === 0 ? 'green' : redNums.includes(num) ? 'red' : 'black';
      setWheelNum(num);
      setWheelColor(color);
      counter++;
      if (counter > 20) {
        clearInterval(interval);
        setSpinning(false);
        resolve(num, color, choice);
      }
    }, 80);
  };

  const resolve = (num: number, color: string, choice: string) => {
    let won = false, mult = 0;
    if (choice === 'red' && color === 'red') { won = true; mult = 2; }
    else if (choice === 'black' && color === 'black') { won = true; mult = 2; }
    else if (choice === 'green' && num === 0) { won = true; mult = 14; }
    if (state.ownedDistricts.includes('neon')) mult += 0.5;

    if (won) {
      const winAmt = Math.floor(bet * mult);
      dispatch({ type: 'SET_STATE', state: { ...state, money: state.money + winAmt } });
      setResult(`GEWONNEN! +€${winAmt}`);
      setResultColor('text-emerald');
    } else {
      setResult('VERLOREN');
      setResultColor('text-blood');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card p-4">
      <h3 className="text-center text-gold font-bold text-lg mb-4">ROULETTE</h3>

      <div className="flex justify-center mb-5">
        <motion.div
          className={`w-20 h-20 rounded-full border-4 border-border flex items-center justify-center text-2xl font-bold ${
            wheelColor === 'red' ? 'bg-blood' : wheelColor === 'green' ? 'bg-emerald' : 'bg-muted'
          }`}
          animate={spinning ? { rotate: 360 } : {}}
          transition={spinning ? { repeat: Infinity, duration: 0.3 } : {}}
        >
          {wheelNum !== null ? wheelNum : '?'}
        </motion.div>
      </div>

      <input
        type="number"
        value={bet}
        onChange={e => setBet(Math.abs(parseInt(e.target.value) || 0))}
        className="w-full py-2 px-3 bg-muted border border-border rounded text-center text-foreground text-sm mb-3"
      />

      <div className="flex gap-2">
        <button disabled={spinning} onClick={() => spin('red')} className="flex-1 py-3 rounded bg-blood text-primary-foreground font-bold text-xs disabled:opacity-50">ROOD (x2)</button>
        <button disabled={spinning} onClick={() => spin('green')} className="flex-1 py-3 rounded bg-emerald text-primary-foreground font-bold text-xs border border-gold disabled:opacity-50">0 (x14)</button>
        <button disabled={spinning} onClick={() => spin('black')} className="flex-1 py-3 rounded bg-muted text-foreground font-bold text-xs border border-border disabled:opacity-50">ZWART (x2)</button>
      </div>

      {result && <p className={`text-center font-bold mt-3 text-sm ${resultColor}`}>{result}</p>}
    </motion.div>
  );
}

// ========== SLOTS ==========
function SlotsGame({ state, dispatch, showToast }: any) {
  const [bet, setBet] = useState(50);
  const [reels, setReels] = useState(['🍒', '🍒', '🍒']);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState('');
  const [resultColor, setResultColor] = useState('');

  const symbols = ['🍒', '🍒', '🍒', '🍋', '🍋', '🍇', '💎', '7️⃣'];

  const spin = () => {
    if (bet > state.money) return showToast('Niet genoeg geld!', true);
    dispatch({ type: 'SET_STATE', state: { ...state, money: state.money - bet } });
    setSpinning(true);
    setResult('');

    let counter = 0;
    let finalReels: string[] = [];
    const interval = setInterval(() => {
      const syms = state.ownedDistricts.includes('neon') ? [...symbols, '7️⃣', '💎'] : symbols;
      finalReels = [
        syms[Math.floor(Math.random() * syms.length)],
        syms[Math.floor(Math.random() * syms.length)],
        syms[Math.floor(Math.random() * syms.length)],
      ];
      setReels(finalReels);
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        setSpinning(false);
        resolve(finalReels);
      }
    }, 100);
  };

  const resolve = (res: string[]) => {
    const [a, b, c] = res;
    let win = 0;
    if (a === b && b === c) {
      if (a === '7️⃣') win = bet * 50;
      else if (a === '💎') win = bet * 30;
      else win = bet * 10;
    } else if (a === b || b === c || a === c) {
      win = Math.floor(bet * 1.5);
    }

    if (win > 0) {
      dispatch({ type: 'SET_STATE', state: { ...state, money: state.money + win } });
      setResult(`WINNAAR! +€${win}`);
      setResultColor('text-emerald');
    } else {
      setResult('Helaas...');
      setResultColor('text-muted-foreground');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card p-4">
      <h3 className="text-center text-gold font-bold text-lg mb-4">NEON SLOTS</h3>

      <div className="flex justify-center gap-2 mb-5">
        {reels.map((sym, i) => (
          <motion.div
            key={i}
            className="w-16 h-20 bg-background border-2 border-gold rounded-lg flex items-center justify-center text-3xl shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
            animate={spinning ? { y: [0, -5, 0, 5, 0] } : {}}
            transition={spinning ? { repeat: Infinity, duration: 0.15 } : {}}
          >
            {sym}
          </motion.div>
        ))}
      </div>

      <input
        type="number"
        value={bet}
        onChange={e => setBet(Math.abs(parseInt(e.target.value) || 0))}
        className="w-full py-2 px-3 bg-muted border border-border rounded text-center text-foreground text-sm mb-3"
      />

      <button
        disabled={spinning}
        onClick={spin}
        className="w-full py-2.5 rounded bg-[hsl(var(--gold)/0.15)] border border-gold text-gold font-bold text-sm disabled:opacity-50"
      >
        {spinning ? 'DRAAIT...' : 'DRAAIEN'}
      </button>

      {result && <p className={`text-center font-bold mt-3 text-sm ${resultColor}`}>{result}</p>}
    </motion.div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3 pb-1 border-b border-border">
      <span className="text-gold text-[0.65rem] uppercase tracking-widest font-bold">{title}</span>
    </div>
  );
}
