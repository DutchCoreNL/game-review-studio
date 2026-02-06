import { useGame } from '@/contexts/GameContext';
import { getRankTitle, getPlayerStat } from '@/game/engine';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Flame, Skull, Star, Shield, Swords, Brain, Gem } from 'lucide-react';
import { StatId } from '@/game/types';

type PopupType = 'rep' | 'heat' | 'debt' | 'level' | null;

interface ResourcePopupProps {
  type: PopupType;
  onClose: () => void;
}

export function ResourcePopup({ type, onClose }: ResourcePopupProps) {
  return (
    <AnimatePresence>
      {type && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/70 z-[9000] backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-4 right-4 top-[100px] z-[9001] max-w-[560px] mx-auto"
          >
            <div className="game-card border-t-[3px] border-t-gold p-4 shadow-xl">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
              {type === 'rep' && <RepPanel />}
              {type === 'heat' && <HeatPanel onClose={onClose} />}
              {type === 'debt' && <DebtPanel onClose={onClose} />}
              {type === 'level' && <LevelPanel />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ========== REP PANEL ==========
function RepPanel() {
  const { state } = useGame();
  const rank = getRankTitle(state.rep);

  const ranks = [
    { title: 'STRAATRAT', min: 0 },
    { title: 'ASSOCIATE', min: 50 },
    { title: 'SOLDAAT', min: 200 },
    { title: 'CAPO', min: 500 },
    { title: 'UNDERBOSS', min: 1000 },
    { title: 'CRIME LORD', min: 2000 },
    { title: 'KINGPIN', min: 5000 },
  ];

  const currentIdx = ranks.findIndex(r => r.title === rank);
  const nextRank = ranks[currentIdx + 1];
  const prevMin = ranks[currentIdx]?.min || 0;
  const nextMin = nextRank?.min || state.rep;
  const progress = nextRank
    ? Math.min(100, ((state.rep - prevMin) / (nextMin - prevMin)) * 100)
    : 100;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={18} className="text-gold" />
        <h3 className="font-bold text-sm uppercase tracking-wider">Reputatie</h3>
      </div>

      <div className="text-center mb-4">
        <span className="text-gold font-display text-xl tracking-widest">{rank}</span>
        <p className="text-2xl font-bold mt-1">{state.rep} REP</p>
      </div>

      {nextRank && (
        <div className="mb-4">
          <div className="flex justify-between text-[0.65rem] text-muted-foreground mb-1">
            <span>{rank}</span>
            <span>{nextRank.title}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gold rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-[0.6rem] text-muted-foreground mt-1 text-center">
            Nog {nextMin - state.rep} REP nodig voor {nextRank.title}
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        {ranks.map((r, i) => (
          <div key={r.title} className={`flex justify-between items-center text-xs px-2 py-1 rounded ${
            r.title === rank ? 'bg-[hsl(var(--gold)/0.1)] border border-gold text-gold font-bold' :
            state.rep >= r.min ? 'text-foreground' : 'text-muted-foreground opacity-50'
          }`}>
            <span>{r.title}</span>
            <span>{r.min}+ REP</span>
          </div>
        ))}
      </div>

      <p className="text-[0.6rem] text-muted-foreground mt-3 italic">
        Verdien REP door te handelen, operaties uit te voeren en districten te veroveren.
      </p>
    </div>
  );
}

// ========== HEAT PANEL ==========
function HeatPanel({ onClose }: { onClose: () => void }) {
  const { state, dispatch, showToast } = useGame();
  const charm = getPlayerStat(state, 'charm');
  const bribeCost = Math.max(1000, 3500 - (charm * 150));

  let heatDecay = 5;
  if (state.ownedDistricts.includes('crown')) heatDecay += Math.floor(heatDecay * 0.2);
  if (state.hqUpgrades.includes('server')) heatDecay += 10;
  if (state.crew.some(c => c.role === 'Hacker')) heatDecay += 3;

  const dangerLevel = state.heat > 70 ? 'KRITIEK' : state.heat > 50 ? 'HOOG' : state.heat > 25 ? 'MATIG' : 'LAAG';
  const dangerColor = state.heat > 70 ? 'text-blood' : state.heat > 50 ? 'text-gold' : state.heat > 25 ? 'text-foreground' : 'text-emerald';

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Flame size={18} className="text-blood" />
        <h3 className="font-bold text-sm uppercase tracking-wider">Heat Level</h3>
      </div>

      <div className="text-center mb-4">
        <span className={`text-3xl font-bold ${dangerColor}`}>{state.heat}%</span>
        <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${dangerColor}`}>{dangerLevel}</p>
      </div>

      <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
        <motion.div
          className={`h-full rounded-full ${state.heat > 70 ? 'bg-blood' : state.heat > 50 ? 'bg-gold' : 'bg-emerald'}`}
          initial={{ width: 0 }}
          animate={{ width: `${state.heat}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="space-y-2 mb-4">
        <InfoRow label="Dagelijkse afname" value={`-${heatDecay}%`} valueClass="text-emerald" />
        <InfoRow label="Politie relatie" value={`${state.policeRel}/100`} />
        {state.heat > 50 && (
          <InfoRow label="Markttoeslag" value="+20%" valueClass="text-blood" />
        )}
        {state.heat > 70 && (
          <InfoRow label="Inval risico" value="30%/dag" valueClass="text-blood" />
        )}
      </div>

      <button
        onClick={() => {
          if (state.money < bribeCost) {
            showToast('Niet genoeg geld!', true);
            return;
          }
          dispatch({ type: 'BRIBE_POLICE' });
          showToast('Politie omgekocht! Heat -15');
        }}
        disabled={state.money < bribeCost}
        className="w-full py-2.5 rounded text-xs font-bold bg-[hsl(var(--blood)/0.1)] border border-blood text-blood disabled:opacity-30 flex items-center justify-center gap-1.5"
      >
        <Shield size={14} /> KOOP POLITIE OM (€{bribeCost.toLocaleString()})
      </button>

      <p className="text-[0.6rem] text-muted-foreground mt-3 italic">
        Heat stijgt bij handel, operaties en reizen. Houd het laag om boetes en invallen te vermijden.
      </p>
    </div>
  );
}

// ========== DEBT PANEL ==========
function DebtPanel({ onClose }: { onClose: () => void }) {
  const { state, dispatch, showToast } = useGame();
  const dailyInterest = Math.floor(state.debt * 0.03);

  const payAmounts = [1000, 5000, 10000, 50000];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Skull size={18} className={state.debt > 100000 ? 'text-blood' : 'text-muted-foreground'} />
        <h3 className="font-bold text-sm uppercase tracking-wider">Schuld</h3>
      </div>

      <div className="text-center mb-4">
        <span className={`text-3xl font-bold ${state.debt > 100000 ? 'text-blood' : state.debt > 0 ? 'text-gold' : 'text-emerald'}`}>
          €{state.debt.toLocaleString()}
        </span>
        {state.debt > 0 && (
          <p className="text-xs text-blood mt-1">+€{dailyInterest.toLocaleString()} rente per dag (3%)</p>
        )}
        {state.debt === 0 && (
          <p className="text-xs text-emerald mt-1">Schuldenvrij! 🎉</p>
        )}
      </div>

      {state.debt > 0 && (
        <>
          <div className="space-y-2 mb-4">
            <InfoRow label="Schuld limiet" value="€250.000" valueClass={state.debt > 200000 ? 'text-blood' : undefined} />
            <InfoRow label="Dagelijkse rente" value={`€${dailyInterest.toLocaleString()}`} valueClass="text-blood" />
            <InfoRow label="Beschikbaar geld" value={`€${state.money.toLocaleString()}`} valueClass="text-gold" />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {payAmounts.map(amount => {
              const payable = Math.min(amount, state.money, state.debt);
              const disabled = state.money <= 0 || state.debt <= 0 || payable <= 0;
              return (
                <button
                  key={amount}
                  onClick={() => {
                    dispatch({ type: 'PAY_DEBT', amount: payable });
                    showToast(`€${payable.toLocaleString()} afgelost`);
                  }}
                  disabled={disabled}
                  className="py-2 rounded text-xs font-bold bg-[hsl(var(--blood)/0.1)] border border-blood text-blood disabled:opacity-30"
                >
                  €{amount.toLocaleString()}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              const payable = Math.min(state.money, state.debt);
              if (payable <= 0) return showToast('Niet genoeg geld!', true);
              dispatch({ type: 'PAY_DEBT', amount: payable });
              showToast(`€${payable.toLocaleString()} afgelost`);
            }}
            disabled={state.money <= 0 || state.debt <= 0}
            className="w-full py-2.5 rounded text-xs font-bold bg-blood text-primary-foreground disabled:opacity-30"
          >
            ALLES AFLOSSEN (€{Math.min(state.money, state.debt).toLocaleString()})
          </button>
        </>
      )}

      {state.debt > 200000 && (
        <p className="text-[0.6rem] text-blood mt-3 font-semibold">
          ⚠️ Schuld boven €200k! Bij €250k kun je geen dagen meer afsluiten.
        </p>
      )}
    </div>
  );
}

// ========== LEVEL PANEL ==========
function LevelPanel() {
  const { state, dispatch, showToast } = useGame();
  const xpPct = Math.min(100, (state.player.xp / state.player.nextXp) * 100);

  const STAT_INFO: { id: StatId; label: string; icon: React.ReactNode }[] = [
    { id: 'muscle', label: 'Kracht', icon: <Swords size={14} /> },
    { id: 'brains', label: 'Vernuft', icon: <Brain size={14} /> },
    { id: 'charm', label: 'Charisma', icon: <Gem size={14} /> },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Star size={18} className="text-gold" />
        <h3 className="font-bold text-sm uppercase tracking-wider">Level & Skills</h3>
      </div>

      <div className="text-center mb-4">
        <span className="text-3xl font-bold text-gold">Level {state.player.level}</span>
        {state.player.skillPoints > 0 && (
          <p className="text-xs text-gold mt-1 font-bold">{state.player.skillPoints} Skill Points beschikbaar!</p>
        )}
      </div>

      {/* XP Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[0.65rem] text-muted-foreground mb-1">
          <span>XP</span>
          <span>{state.player.xp} / {state.player.nextXp}</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blood rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Stats with upgrade buttons */}
      <div className="space-y-2.5">
        {STAT_INFO.map(s => {
          const base = state.player.stats[s.id];
          const total = getPlayerStat(state, s.id);
          const bonus = total - base;

          return (
            <div key={s.id} className="flex items-center gap-2">
              <div className="w-20 flex items-center gap-1.5 text-xs text-muted-foreground">
                {s.icon}
                <span>{s.label}</span>
              </div>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gold rounded-full"
                  animate={{ width: `${Math.min(100, (total / 15) * 100)}%` }}
                />
              </div>
              <span className="font-bold text-xs w-12 text-right">
                {base}
                {bonus > 0 && <span className="text-gold">+{bonus}</span>}
              </span>
              {state.player.skillPoints > 0 && (
                <button
                  onClick={() => {
                    dispatch({ type: 'UPGRADE_STAT', stat: s.id });
                    showToast(`${s.label} verhoogd!`);
                  }}
                  className="w-6 h-6 rounded bg-[hsl(var(--gold)/0.1)] border border-gold text-gold text-xs flex items-center justify-center hover:bg-[hsl(var(--gold)/0.2)] transition-colors"
                >
                  +
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[0.6rem] text-muted-foreground mt-4 italic">
        Verdien XP door te handelen, missies te voltooien en districten te veroveren. Elke level-up geeft 2 skill points.
      </p>
    </div>
  );
}

// ========== HELPERS ==========
function InfoRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-xs bg-muted/50 rounded px-2.5 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${valueClass || 'text-foreground'}`}>{value}</span>
    </div>
  );
}
