import { useGame } from '@/contexts/GameContext';
import { getRankTitle, getPlayerStat, getActiveVehicleHeat, getActiveAmmoType, getPlayerMaxHP, HOSPITAL_HEAL_COST_PER_HP } from '@/game/engine';
import { REKAT_COSTS, VEHICLES, AMMO_PACKS, AMMO_FACTORY_UPGRADES, AMMO_TYPE_LABELS } from '@/game/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Flame, Skull, Star, Shield, Swords, Brain, Gem, Car, EyeOff, Wrench, Crosshair, Heart, Zap, Factory } from 'lucide-react';
import { getKarmaAlignment, getKarmaLabel } from '@/game/karma';
import { AmmoType, StatId } from '@/game/types';
import { useState } from 'react';

type PopupType = 'rep' | 'heat' | 'debt' | 'level' | 'ammo' | 'karma' | 'hp' | null;

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
              {type === 'ammo' && <AmmoPanel />}
              {type === 'karma' && <KarmaPanel />}
              {type === 'hp' && <HpPanel onClose={onClose} />}
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

// ========== HEAT PANEL (Heat 2.0) ==========
function HeatPanel({ onClose }: { onClose: () => void }) {
  const { state, dispatch, showToast, setView } = useGame();
  const charm = getPlayerStat(state, 'charm');
  const bribeCost = Math.max(1500, 4000 - (charm * 150));
  const vehicleHeat = getActiveVehicleHeat(state);
  const personalHeat = state.personalHeat || 0;
  const isHiding = (state.hidingDays || 0) > 0;
  const activeVehicle = VEHICLES.find(v => v.id === state.activeVehicle);
  const activeObj = state.ownedVehicles.find(v => v.id === state.activeVehicle);
  const rekatCost = REKAT_COSTS[state.activeVehicle] || 5000;
  const canRekat = activeObj && (activeObj.rekatCooldown || 0) <= 0 && state.money >= rekatCost;

  // Decay info
  let vDecay = 8;
  if (state.hqUpgrades.includes('server')) vDecay += 3;
  let pDecay = 2;
  if (state.hqUpgrades.includes('safehouse')) pDecay = 4;
  if (state.hqUpgrades.includes('server')) pDecay += 3;
  if (state.crew.some(c => c.role === 'Hacker')) pDecay += 2;

  const vDanger = vehicleHeat > 70 ? 'KRITIEK' : vehicleHeat > 50 ? 'HOOG' : vehicleHeat > 25 ? 'MATIG' : 'LAAG';
  const pDanger = personalHeat > 70 ? 'KRITIEK' : personalHeat > 50 ? 'HOOG' : personalHeat > 25 ? 'MATIG' : 'LAAG';

  function getBarColor(val: number) {
    return val > 70 ? 'bg-blood' : val > 50 ? 'bg-gold' : 'bg-emerald';
  }

  function getDangerColor(val: number) {
    return val > 70 ? 'text-blood' : val > 50 ? 'text-gold' : val > 25 ? 'text-foreground' : 'text-emerald';
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Flame size={18} className="text-blood" />
        <h3 className="font-bold text-sm uppercase tracking-wider">Heat Level</h3>
      </div>

      {/* Hiding banner */}
      {isHiding && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[hsl(var(--ice)/0.1)] border border-ice rounded-lg p-3 mb-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <EyeOff size={16} className="text-ice" />
            <div>
              <p className="text-xs font-bold text-ice">ONDERGEDOKEN</p>
              <p className="text-[0.6rem] text-muted-foreground">Nog {state.hidingDays} dag(en) — geen acties mogelijk</p>
            </div>
          </div>
          <button
            onClick={() => {
              dispatch({ type: 'CANCEL_HIDING' });
              showToast('Onderduiken geannuleerd');
            }}
            className="px-2 py-1 rounded text-[0.6rem] font-bold bg-[hsl(var(--blood)/0.1)] border border-blood text-blood"
          >
            STOP
          </button>
        </motion.div>
      )}

      {/* Vehicle Heat */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Car size={14} className="text-gold" />
            <span className="text-xs font-bold">Voertuig Heat</span>
            {activeVehicle && <span className="text-[0.5rem] text-muted-foreground">({activeVehicle.name})</span>}
          </div>
          <span className={`text-xs font-bold ${getDangerColor(vehicleHeat)}`}>{vehicleHeat}% — {vDanger}</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-2">
          <motion.div
            className={`h-full rounded-full ${getBarColor(vehicleHeat)}`}
            initial={{ width: 0 }}
            animate={{ width: `${vehicleHeat}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex gap-2 text-[0.55rem]">
          <span className="text-emerald">Afname: -{vDecay}/dag</span>
          {vehicleHeat > 40 && <span className="text-gold">⚠ Checkpoint risico</span>}
          {vehicleHeat > 70 && <span className="text-blood">⚠ Smokkel onderschepping</span>}
        </div>

        {/* Omkatten button */}
        <button
          onClick={() => {
            dispatch({ type: 'REKAT_VEHICLE', vehicleId: state.activeVehicle });
            showToast(`${activeVehicle?.name || 'Voertuig'} omgekat! Heat → 0`);
          }}
          disabled={!canRekat || vehicleHeat === 0}
          className="w-full mt-2 py-2 rounded text-xs font-bold bg-[hsl(var(--gold)/0.1)] border border-gold text-gold disabled:opacity-30 flex items-center justify-center gap-1.5"
        >
          <Wrench size={12} /> OMKATTEN (€{rekatCost.toLocaleString()})
          {activeObj && (activeObj.rekatCooldown || 0) > 0 && (
            <span className="text-muted-foreground ml-1">({activeObj.rekatCooldown}d cooldown)</span>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-border my-3" />

      {/* Personal Heat */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Flame size={14} className="text-blood" />
            <span className="text-xs font-bold">Persoonlijke Heat</span>
          </div>
          <span className={`text-xs font-bold ${getDangerColor(personalHeat)}`}>{personalHeat}% — {pDanger}</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-2">
          <motion.div
            className={`h-full rounded-full ${getBarColor(personalHeat)}`}
            initial={{ width: 0 }}
            animate={{ width: `${personalHeat}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex gap-2 text-[0.55rem]">
          <span className="text-emerald">Afname: -{pDecay}/dag</span>
          {personalHeat > 60 && <span className="text-blood">⚠ Inval risico 30%/dag</span>}
          {!state.hqUpgrades.includes('safehouse') && <span className="text-muted-foreground">Safe house: 2× decay</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {/* Bribe (personal heat only) */}
        <button
          onClick={() => {
            if (state.money < bribeCost) {
              showToast('Niet genoeg geld!', true);
              return;
            }
            dispatch({ type: 'BRIBE_POLICE' });
            showToast('Politie omgekocht! Persoonlijke heat -10');
          }}
          disabled={state.money < bribeCost || personalHeat === 0}
          className="w-full py-2.5 rounded text-xs font-bold bg-[hsl(var(--blood)/0.1)] border border-blood text-blood disabled:opacity-30 flex items-center justify-center gap-1.5"
        >
          <Shield size={14} /> KOOP POLITIE OM — pers. heat -10 (€{bribeCost.toLocaleString()})
        </button>

        {/* Go into hiding */}
        {!isHiding && personalHeat > 0 && (
          <div>
            <p className="text-[0.6rem] text-muted-foreground mb-1.5 font-semibold">🏠 Onderduiken (geen acties, heat daalt flink):</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(days => {
                const heatReduction = days === 1 ? 15 : days === 2 ? 25 : 35;
                const safeBonus = state.hqUpgrades.includes('safehouse') ? 5 : 0;
                return (
                  <button
                    key={days}
                    onClick={() => {
                      dispatch({ type: 'GO_INTO_HIDING', days });
                      showToast(`Ondergedoken voor ${days} dag(en)! Pers. heat -${heatReduction + safeBonus}`);
                      onClose();
                    }}
                    className="py-2 rounded text-[0.6rem] font-bold bg-[hsl(var(--ice)/0.1)] border border-ice text-ice disabled:opacity-30"
                  >
                    {days} DAG
                    <br />
                    <span className="text-[0.5rem] text-emerald">-{heatReduction + safeBonus} heat</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* GEZOCHT warning at heat > 80 */}
      {(personalHeat > 80 || vehicleHeat > 80) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[hsl(var(--blood)/0.15)] border border-blood rounded-lg p-3 mt-4 mb-2"
        >
          <div className="flex items-center gap-2 mb-1">
            <Skull size={16} className="text-blood animate-pulse" />
            <span className="text-xs font-bold text-blood uppercase tracking-wider">GEZOCHT</span>
          </div>
          <p className="text-[0.65rem] text-blood/90 leading-relaxed">
            Je bent actief gezocht door de politie! Elke actie — handelen, reizen, operaties — draagt nu een hoog arrestatierisico.
            {personalHeat > 80 && ' Persoonlijke heat boven 80: kans op inval elke dag.'}
            {vehicleHeat > 80 && ' Voertuig heat boven 80: checkpoints blokkeren routes.'}
            {' '}Duik onder of koop de politie om om je heat te verlagen.
          </p>
        </motion.div>
      )}

      <p className="text-[0.6rem] text-muted-foreground mt-3 italic">
        Voertuig heat stijgt bij handel & reizen. Persoonlijke heat stijgt bij combat, witwassen & mislukte missies. Hoge heat = meer controles, boetes en invallen.
      </p>
    </div>
  );
}
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

// ========== AMMO PANEL ==========
function AmmoPanel() {
  const { state, dispatch, showToast } = useGame();
  const ammoStock = state.ammoStock || { '9mm': state.ammo || 0, '7.62mm': 0, 'shells': 0 };
  const activeType = getActiveAmmoType(state);
  const hasFactory = state.ownedBusinesses.includes('ammo_factory');
  const factoryLevel = state.ammoFactoryLevel || 1;
  const [selectedType, setSelectedType] = useState<AmmoType>(activeType);
  const ammoTypes: AmmoType[] = ['9mm', '7.62mm', 'shells'];

  const nextUpgrade = AMMO_FACTORY_UPGRADES.find(u => u.level === factoryLevel + 1);
  const currentUpgrade = AMMO_FACTORY_UPGRADES.find(u => u.level === factoryLevel);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Crosshair size={18} className="text-gold" />
        <h3 className="font-bold text-sm uppercase tracking-wider">Kogels</h3>
      </div>

      {/* Ammo Stock per Type */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {ammoTypes.map(type => {
          const info = AMMO_TYPE_LABELS[type];
          const stock = ammoStock[type] || 0;
          const isActive = type === activeType;
          const isSelected = type === selectedType;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`py-2.5 px-2 rounded text-center transition-all ${
                isSelected
                  ? 'bg-gold/15 border-2 border-gold text-gold'
                  : 'bg-muted/50 border border-border text-muted-foreground'
              }`}
            >
              <div className="text-lg mb-0.5">{info.icon}</div>
              <div className="text-[0.55rem] font-bold uppercase">{info.label}</div>
              <div className={`text-lg font-bold ${stock <= 3 ? 'text-blood' : stock <= 10 ? 'text-gold' : 'text-foreground'}`}>
                {stock}
              </div>
              <div className="text-[0.45rem] text-muted-foreground">/99</div>
              {isActive && <div className="text-[0.4rem] text-emerald font-bold mt-0.5">ACTIEF</div>}
            </button>
          );
        })}
      </div>

      {(ammoStock[activeType] || 0) <= 3 && (
        <div className="bg-[hsl(var(--blood)/0.1)] border border-blood rounded-lg p-2.5 mb-4 text-center">
          <p className="text-xs text-blood font-bold">⚠️ Bijna geen {AMMO_TYPE_LABELS[activeType].label} munitie!</p>
          <p className="text-[0.6rem] text-muted-foreground">Je wapen gebruikt {AMMO_TYPE_LABELS[activeType].label}. Koop bij.</p>
        </div>
      )}

      {/* Buy for selected type */}
      <div className="space-y-2 mb-4">
        <p className="text-[0.6rem] font-bold text-muted-foreground uppercase tracking-wider">
          Koop {AMMO_TYPE_LABELS[selectedType].label}
        </p>
        {AMMO_PACKS.map(pack => (
          <button
            key={pack.id}
            onClick={() => {
              if (state.money < pack.cost) {
                showToast('Niet genoeg geld!', true);
                return;
              }
              if ((ammoStock[selectedType] || 0) >= 99) {
                showToast(`${AMMO_TYPE_LABELS[selectedType].label} is vol!`, true);
                return;
              }
              dispatch({ type: 'BUY_AMMO', packId: pack.id, ammoType: selectedType });
              showToast(`${pack.name} ${AMMO_TYPE_LABELS[selectedType].label} gekocht!`);
            }}
            disabled={state.money < pack.cost || (ammoStock[selectedType] || 0) >= 99}
            className="w-full flex items-center justify-between py-2.5 px-3 rounded text-xs font-bold bg-muted/50 border border-border hover:border-gold disabled:opacity-30 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span>{AMMO_TYPE_LABELS[selectedType].icon}</span>
              <span>{pack.name} {AMMO_TYPE_LABELS[selectedType].label}</span>
            </span>
            <span className="text-gold">€{pack.cost.toLocaleString()}</span>
          </button>
        ))}
      </div>

      {/* Kogelfabriek section */}
      <div className="border-t border-border pt-3 mt-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Factory size={14} className="text-gold" />
          <span className="text-xs font-bold">Kogelfabriek</span>
          {hasFactory && <span className="text-[0.45rem] text-emerald font-bold">ACTIEF</span>}
        </div>

        {hasFactory ? (
          <div className="space-y-2">
            <div className="flex justify-between text-[0.6rem]">
              <span className="text-muted-foreground">Level</span>
              <span className="font-bold text-gold">{currentUpgrade?.label || `Lvl ${factoryLevel}`}</span>
            </div>
            <div className="flex justify-between text-[0.6rem]">
              <span className="text-muted-foreground">Productie</span>
              <span className="font-bold">{currentUpgrade?.production || 3}/dag ({AMMO_TYPE_LABELS[activeType].label})</span>
            </div>
            <p className="text-[0.5rem] text-muted-foreground">
              Produceert automatisch {AMMO_TYPE_LABELS[activeType].label} munitie (type van je wapen).
            </p>

            {nextUpgrade && (
              <button
                onClick={() => {
                  if (state.money < nextUpgrade.cost) {
                    showToast('Niet genoeg geld!', true);
                    return;
                  }
                  dispatch({ type: 'UPGRADE_AMMO_FACTORY' });
                  showToast(`Kogelfabriek upgraded naar ${nextUpgrade.label}! +${nextUpgrade.production}/dag`);
                }}
                disabled={state.money < nextUpgrade.cost}
                className="w-full py-2.5 rounded text-xs font-bold bg-[hsl(var(--gold)/0.1)] border border-gold text-gold disabled:opacity-30 flex items-center justify-center gap-1.5"
              >
                <Zap size={12} /> UPGRADE → {nextUpgrade.label} ({nextUpgrade.production}/dag) — €{nextUpgrade.cost.toLocaleString()}
              </button>
            )}

            {!nextUpgrade && (
              <div className="text-[0.55rem] text-emerald font-bold text-center py-1.5">
                ✓ Maximaal niveau bereikt
              </div>
            )}
          </div>
        ) : (
          <p className="text-[0.55rem] text-muted-foreground">
            Koop de Kogelfabriek via Imperium → Businesses om automatisch munitie te produceren.
          </p>
        )}
      </div>

      <div className="space-y-1.5 text-[0.6rem] text-muted-foreground mt-3">
        <p>🔫 Elk wapen gebruikt een specifiek munitietype.</p>
        <p>🚗 Sloop auto's in de Crusher voor extra kogels.</p>
      </div>
    </div>
  );
}

// ========== KARMA PANEL ==========
function KarmaPanel() {
  const { state } = useGame();
  const karma = state.karma || 0;
  const alignment = getKarmaAlignment(karma);
  const label = getKarmaLabel(karma);
  const barPos = Math.round(((karma + 100) / 200) * 100);

  const isMeedogenloos = alignment === 'meedogenloos';
  const isEerbaar = alignment === 'eerbaar';

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {isMeedogenloos ? <Zap size={18} className="text-blood" /> : isEerbaar ? <Shield size={18} className="text-gold" /> : <Heart size={18} className="text-muted-foreground" />}
        <h3 className="font-bold text-sm uppercase tracking-wider">Karma</h3>
      </div>

      <div className="text-center mb-4">
        <span className={`text-xl font-display tracking-widest ${isMeedogenloos ? 'text-blood' : isEerbaar ? 'text-gold' : 'text-muted-foreground'}`}>
          {label}
        </span>
        <p className="text-2xl font-bold mt-1">{karma}</p>
      </div>

      {/* Karma bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[0.6rem] text-muted-foreground mb-1">
          <span className="text-blood">Meedogenloos</span>
          <span>Neutraal</span>
          <span className="text-gold">Eerbaar</span>
        </div>
        <div className="relative h-3 rounded-full overflow-hidden"
          style={{ background: 'linear-gradient(90deg, hsl(0 72% 51% / 0.3), transparent 40%, transparent 60%, hsl(45 93% 47% / 0.3))' }}
        >
          <div className="absolute inset-0 bg-muted/30 rounded-full" />
          <motion.div
            className={`absolute top-0 h-full w-2 rounded-full ${isMeedogenloos ? 'bg-blood' : isEerbaar ? 'bg-gold' : 'bg-muted-foreground'}`}
            animate={{ left: `${Math.max(0, Math.min(95, barPos) - 2)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between text-[0.5rem] text-muted-foreground mt-0.5">
          <span>-100</span>
          <span>0</span>
          <span>+100</span>
        </div>
      </div>

      {/* Effects */}
      <div className="space-y-1.5 mb-3">
        <InfoRow label="Alignment" value={label} valueClass={isMeedogenloos ? 'text-blood' : isEerbaar ? 'text-gold' : undefined} />
        <InfoRow label="Karma score" value={String(karma)} />
      </div>

      <div className="space-y-1.5 text-[0.6rem] text-muted-foreground">
        <p className="font-semibold text-foreground text-xs mb-1">Wat beïnvloedt karma?</p>
        <p>⬆️ <span className="text-gold">Eerbaar:</span> Hulp bieden, vijanden sparen, eerlijk handelen</p>
        <p>⬇️ <span className="text-blood">Meedogenloos:</span> Huurmoorden, verraad, geweld tegen onschuldigen</p>
        <p className="mt-2 italic">Je alignment beïnvloedt NPC-relaties, beschikbare missies en speciale verhaallijnen.</p>
      </div>
    </div>
  );
}

// ========== HP PANEL ==========
function HpPanel({ onClose }: { onClose: () => void }) {
  const { state, dispatch, showToast, setView } = useGame();
  const hpPct = (state.playerHP / state.playerMaxHP) * 100;
  const missing = state.playerMaxHP - state.playerHP;
  const muscle = getPlayerStat(state, 'muscle');
  const hasCrewQuarters = state.villa?.modules.includes('crew_kwartieren');
  const regenPerNight = hasCrewQuarters ? 20 : 10;
  const isInCrown = state.loc === 'crown';

  const statusLabel = hpPct < 20 ? 'KRITIEK' : hpPct < 40 ? 'ZWAAR GEWOND' : hpPct < 60 ? 'GEWOND' : hpPct < 80 ? 'LICHT GEWOND' : 'GEZOND';
  const statusColor = hpPct < 30 ? 'text-blood' : hpPct < 60 ? 'text-gold' : 'text-emerald';
  const barColor = hpPct < 30 ? 'bg-blood' : hpPct < 60 ? 'bg-gold' : 'bg-emerald';

  const quickHealCost = Math.min(missing, 20) * HOSPITAL_HEAL_COST_PER_HP;
  const fullHealCost = Math.floor(missing * HOSPITAL_HEAL_COST_PER_HP * 0.8);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Heart size={18} className={statusColor} />
        <h3 className="font-bold text-sm uppercase tracking-wider">Gezondheid</h3>
      </div>

      {/* HP Display */}
      <div className="text-center mb-4">
        <span className={`text-3xl font-bold ${statusColor}`}>{state.playerHP}</span>
        <span className="text-lg text-muted-foreground">/{state.playerMaxHP}</span>
        <p className={`text-xs font-bold mt-1 ${statusColor}`}>{statusLabel}</p>
      </div>

      {/* HP Bar */}
      <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${hpPct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Stats breakdown */}
      <div className="space-y-1.5 mb-4">
        <InfoRow label="Basis HP" value="80" />
        <InfoRow label={`Level bonus (Lvl ${state.player.level})`} value={`+${state.player.level * 5}`} valueClass="text-gold" />
        <InfoRow label={`Kracht bonus (${muscle})`} value={`+${muscle * 3}`} valueClass="text-gold" />
        {hasCrewQuarters && <InfoRow label="Villa Crew Kwartieren" value="+20" valueClass="text-emerald" />}
        <InfoRow label="Totaal Max HP" value={String(state.playerMaxHP)} valueClass="font-bold" />
      </div>

      {/* Regen info */}
      <div className="bg-muted/30 rounded-lg p-3 mb-4">
        <p className="text-xs font-bold mb-1.5 flex items-center gap-1.5">
          <Zap size={12} className="text-emerald" /> Natuurlijk Herstel
        </p>
        <p className="text-[0.6rem] text-muted-foreground">
          +{regenPerNight} HP per nacht{hasCrewQuarters ? ' (verdubbeld door Crew Kwartieren)' : ''}
        </p>
        {!hasCrewQuarters && (
          <p className="text-[0.5rem] text-gold mt-1">💡 Villa Crew Kwartieren verdubbelt nachtelijk herstel naar 20 HP</p>
        )}
      </div>

      {/* Quick actions */}
      {missing > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-bold flex items-center gap-1.5">
            <Heart size={12} className="text-emerald" /> Snel Genezen
          </p>

          {isInCrown ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const amount = Math.min(20, missing);
                  const cost = amount * HOSPITAL_HEAL_COST_PER_HP;
                  if (state.money < cost) return showToast('Niet genoeg geld!', true);
                  dispatch({ type: 'HEAL_PLAYER', amount, cost });
                  showToast(`+${amount} HP hersteld`);
                }}
                disabled={state.money < quickHealCost || missing <= 0}
                className="py-2 rounded text-[0.6rem] font-bold bg-[hsl(var(--emerald)/0.1)] border border-emerald text-emerald disabled:opacity-30"
              >
                EERSTE HULP
                <br />
                <span className="text-[0.5rem]">+{Math.min(20, missing)} HP — €{quickHealCost.toLocaleString()}</span>
              </button>
              <button
                onClick={() => {
                  if (state.money < fullHealCost) return showToast('Niet genoeg geld!', true);
                  dispatch({ type: 'HEAL_PLAYER', amount: missing, cost: fullHealCost });
                  showToast(`Volledig genezen! +${missing} HP`);
                }}
                disabled={state.money < fullHealCost || missing <= 0}
                className="py-2 rounded text-[0.6rem] font-bold bg-[hsl(var(--emerald)/0.1)] border border-emerald text-emerald disabled:opacity-30"
              >
                VOLLEDIG HERSTEL
                <br />
                <span className="text-[0.5rem]">+{missing} HP — €{fullHealCost.toLocaleString()} (-20%)</span>
              </button>
            </div>
          ) : (
            <div className="bg-muted/30 rounded p-2.5 text-center">
              <p className="text-[0.6rem] text-muted-foreground">
                🏥 Reis naar <span className="text-gold font-bold">Crown Heights</span> om het ziekenhuis te bezoeken
              </p>
              <button
                onClick={() => {
                  dispatch({ type: 'TRAVEL', to: 'crown' as any });
                  showToast('Verplaatst naar Crown Heights');
                  onClose();
                }}
                className="mt-1.5 px-3 py-1.5 rounded text-[0.55rem] font-bold bg-[hsl(var(--gold)/0.1)] border border-gold text-gold"
              >
                REIS NAAR CROWN HEIGHTS
              </button>
            </div>
          )}
        </div>
      )}

      {/* Low HP warning */}
      {hpPct < 30 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[hsl(var(--blood)/0.15)] border border-blood rounded-lg p-3 mb-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <Skull size={14} className="text-blood animate-pulse" />
            <span className="text-xs font-bold text-blood uppercase tracking-wider">KRITIEK</span>
          </div>
          <p className="text-[0.6rem] text-blood/90 leading-relaxed">
            Je gezondheid is gevaarlijk laag! Gevechten starten met je huidige HP. 
            Als je verliest val je terug naar 10% van je max HP. Genees eerst!
          </p>
        </motion.div>
      )}

      <p className="text-[0.6rem] text-muted-foreground italic">
        Je start elk gevecht met je huidige HP. Schade blijft bestaan na het gevecht. 
        Verhoog je max HP door te levelen en Kracht te upgraden.
      </p>
    </div>
  );
}


function InfoRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-xs bg-muted/50 rounded px-2.5 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${valueClass || 'text-foreground'}`}>{value}</span>
    </div>
  );
}
