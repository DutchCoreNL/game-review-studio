import { useGame } from '@/contexts/GameContext';
import { HOSPITAL_HEAL_COST_PER_HP, HOSPITAL_FULL_HEAL_DISCOUNT } from '@/game/engine';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { StatBar } from './ui/StatBar';
import { motion } from 'framer-motion';
import { Heart, Syringe, Stethoscope, BadgeDollarSign, Activity } from 'lucide-react';
import { PlayerHelpPanel } from './social/PlayerHelpPanel';

const HEAL_OPTIONS = [
  { id: 'small', label: 'Eerste Hulp', amount: 20, icon: '🩹', desc: 'Wonden verzorgen', color: 'emerald' as const },
  { id: 'medium', label: 'Behandeling', amount: 50, icon: '💉', desc: 'Medische ingreep', color: 'gold' as const },
  { id: 'full', label: 'Volledig Herstel', amount: Infinity, icon: '🏥', desc: 'Alles genezen (20% korting)', color: 'ice' as const },
];

export function HospitalView() {
  const { state, dispatch, showToast } = useGame();
  const missing = state.playerMaxHP - state.playerHP;
  const hpPct = (state.playerHP / state.playerMaxHP) * 100;

  const getHealCost = (amount: number) => {
    if (amount >= missing) {
      return Math.floor(missing * HOSPITAL_HEAL_COST_PER_HP * HOSPITAL_FULL_HEAL_DISCOUNT);
    }
    return amount * HOSPITAL_HEAL_COST_PER_HP;
  };

  const handleHeal = (option: typeof HEAL_OPTIONS[0]) => {
    const actualAmount = option.amount === Infinity ? missing : Math.min(option.amount, missing);
    if (actualAmount <= 0) {
      showToast('Je bent al volledig genezen!', true);
      return;
    }
    const cost = getHealCost(option.amount === Infinity ? missing : option.amount);
    if (state.money < cost) {
      showToast(`Niet genoeg geld (€${cost.toLocaleString()} nodig)`, true);
      return;
    }
    dispatch({ type: 'HEAL_PLAYER', amount: actualAmount, cost });
    showToast(`+${actualAmount} HP hersteld voor €${cost.toLocaleString()}`);
  };

  const statusColor = hpPct < 30 ? 'blood' : hpPct < 60 ? 'gold' : 'emerald';
  const statusText = hpPct < 30 ? '⚠️ Kritiek! Ga niet vechten.' : hpPct < 60 ? '⚡ Gewond. Behandeling aanbevolen.' : 'Lichte verwondingen.';

  return (
    <div>
      {/* Cinematic Header */}
      <div className="relative -mx-3 -mt-2 mb-4 h-28 overflow-hidden rounded-b-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald/20 via-background to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope size={14} className="text-emerald" />
            <span className="text-[0.5rem] uppercase tracking-[0.3em] text-emerald/80 font-bold">Crown Heights</span>
          </div>
          <h2 className="font-display text-lg uppercase tracking-wider text-foreground">ZIEKENHUIS</h2>
          <p className="text-[0.5rem] text-muted-foreground italic mt-0.5">Geen vragen, geen registratie.</p>
        </div>
        <div className="absolute bottom-3 right-4">
          <div className="flex items-center gap-1.5">
            <Activity size={12} className={`text-${statusColor}`} />
            <span className={`text-sm font-bold text-${statusColor}`}>{state.playerHP}/{state.playerMaxHP}</span>
          </div>
        </div>
      </div>

      {/* HP Status Card */}
      <div className="game-card mb-4 border-l-[3px] border-l-emerald p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-10 h-10 rounded-full bg-${statusColor}/10 border border-${statusColor}/20 flex items-center justify-center`}>
            <Heart size={18} className={`text-${statusColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Gezondheid</span>
              <span className={`font-bold text-lg text-${statusColor}`}>
                {Math.round(hpPct)}%
              </span>
            </div>
            <StatBar value={state.playerHP} max={state.playerMaxHP} color={statusColor} height="lg" />
          </div>
        </div>
        {missing > 0 && (
          <p className="text-[0.5rem] text-muted-foreground mt-1">
            {missing} HP schade — {statusText}
          </p>
        )}
        {missing === 0 && (
          <p className="text-[0.5rem] text-emerald mt-1 font-semibold">✓ Volledig gezond</p>
        )}
      </div>

      {/* Heal Options as Cards */}
      <SectionHeader title="Behandelingen" icon={<Syringe size={12} />} />
      <div className="grid grid-cols-1 gap-2.5 mb-4">
        {HEAL_OPTIONS.map(option => {
          const actualAmount = option.amount === Infinity ? missing : Math.min(option.amount, missing);
          const cost = actualAmount > 0 ? getHealCost(option.amount === Infinity ? missing : option.amount) : 0;
          const canAfford = state.money >= cost;
          const isDisabled = actualAmount <= 0 || !canAfford;

          return (
            <motion.div
              key={option.id}
              className={`game-card overflow-hidden ${isDisabled ? 'opacity-50' : ''}`}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
            >
              <div className={`h-1 bg-${option.color}`} />
              <div className="p-3 flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg bg-${option.color}/10 border border-${option.color}/20 flex items-center justify-center flex-shrink-0`}>
                  <span className="text-2xl">{option.icon}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-xs">{option.label}</h4>
                  <p className="text-[0.5rem] text-muted-foreground">{option.desc}</p>
                  {actualAmount > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[0.5rem] font-bold text-${option.color}`}>+{actualAmount} HP</span>
                      {option.amount === Infinity && missing > 0 && (
                        <span className="text-[0.4rem] font-bold text-emerald bg-emerald/10 px-1 py-0.5 rounded">-20%</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {actualAmount > 0 ? (
                    <span className={`text-sm font-bold ${canAfford ? 'text-gold' : 'text-blood'}`}>
                      €{cost.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-[0.5rem] text-muted-foreground">—</span>
                  )}
                  <GameButton
                    variant={isDisabled ? 'muted' : 'emerald'}
                    size="sm"
                    disabled={isDisabled}
                    onClick={() => handleHeal(option)}
                  >
                    GENEES
                  </GameButton>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="game-card bg-muted/30 p-2.5 text-center">
          <BadgeDollarSign size={14} className="text-gold mx-auto mb-1" />
          <div className="text-[0.5rem] text-muted-foreground">Prijs per HP</div>
          <div className="text-xs font-bold text-gold">€{HOSPITAL_HEAL_COST_PER_HP}</div>
        </div>
        <div className="game-card bg-muted/30 p-2.5 text-center">
          <Heart size={14} className="text-emerald mx-auto mb-1" />
          <div className="text-[0.5rem] text-muted-foreground">Nacht Herstel</div>
          <div className="text-xs font-bold text-emerald">10 HP</div>
        </div>
      </div>

      {/* Revive other players */}
      <SectionHeader title="Spelers Helpen" icon={<Syringe size={12} />} />
      <PlayerHelpPanel
        type="hospital"
        onResult={(msg, isError) => showToast(msg, isError)}
      />
    </div>
  );
}
