import { useGame } from '@/contexts/GameContext';
import { HOSPITAL_HEAL_COST_PER_HP, HOSPITAL_FULL_HEAL_DISCOUNT } from '@/game/engine';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { StatBar } from './ui/StatBar';
import { motion } from 'framer-motion';
import { Heart, Syringe, Stethoscope, BadgeDollarSign } from 'lucide-react';
import { PlayerHelpPanel } from './social/PlayerHelpPanel';

const HEAL_OPTIONS = [
  { id: 'small', label: 'Eerste Hulp', amount: 20, icon: '🩹', desc: 'Wonden verzorgen' },
  { id: 'medium', label: 'Behandeling', amount: 50, icon: '💉', desc: 'Medische ingreep' },
  { id: 'full', label: 'Volledig Herstel', amount: Infinity, icon: '🏥', desc: 'Alles genezen (20% korting)' },
];

export function HospitalView() {
  const { state, dispatch, showToast } = useGame();
  const missing = state.playerMaxHP - state.playerHP;
  const hpPct = (state.playerHP / state.playerMaxHP) * 100;

  const getHealCost = (amount: number) => {
    if (amount >= missing) {
      // Full heal discount
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

  return (
    <div>
      <SectionHeader title="Crown Heights Ziekenhuis" icon={<Stethoscope size={12} />} />
      <p className="text-[0.55rem] text-muted-foreground mb-4">
        Het beste ondergrondse ziekenhuis van Noxhaven. Geen vragen, geen registratie.
      </p>

      {/* HP Status */}
      <div className="game-card mb-4 border-l-[3px] border-l-emerald">
        <div className="flex items-center gap-2 mb-2">
          <Heart size={14} className={hpPct < 30 ? 'text-blood' : hpPct < 60 ? 'text-gold' : 'text-emerald'} />
          <span className="font-bold text-sm">Gezondheid</span>
          <span className={`ml-auto font-bold text-sm ${hpPct < 30 ? 'text-blood' : hpPct < 60 ? 'text-gold' : 'text-emerald'}`}>
            {state.playerHP}/{state.playerMaxHP}
          </span>
        </div>
        <StatBar value={state.playerHP} max={state.playerMaxHP} color={hpPct < 30 ? 'blood' : hpPct < 60 ? 'gold' : 'emerald'} height="lg" />
        {missing > 0 && (
          <p className="text-[0.5rem] text-muted-foreground mt-1.5">
            {missing} HP schade — {hpPct < 30 ? '⚠️ Kritiek! Ga niet vechten.' : hpPct < 60 ? '⚡ Gewond. Behandeling aanbevolen.' : 'Lichte verwondingen.'}
          </p>
        )}
        {missing === 0 && (
          <p className="text-[0.5rem] text-emerald mt-1.5 font-semibold">✓ Volledig gezond</p>
        )}
      </div>

      {/* Heal Options */}
      <SectionHeader title="Behandelingen" icon={<Syringe size={12} />} />
      <div className="space-y-2 mb-4">
        {HEAL_OPTIONS.map(option => {
          const actualAmount = option.amount === Infinity ? missing : Math.min(option.amount, missing);
          const cost = actualAmount > 0 ? getHealCost(option.amount === Infinity ? missing : option.amount) : 0;
          const canAfford = state.money >= cost;
          const isDisabled = actualAmount <= 0 || !canAfford;

          return (
            <motion.div
              key={option.id}
              className={`game-card flex items-center gap-3 ${isDisabled ? 'opacity-50' : ''}`}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
            >
              <span className="text-xl">{option.icon}</span>
              <div className="flex-1">
                <h4 className="font-bold text-xs">{option.label}</h4>
                <p className="text-[0.5rem] text-muted-foreground">{option.desc}</p>
                {actualAmount > 0 && (
                  <p className="text-[0.45rem] text-emerald font-semibold">+{actualAmount} HP</p>
                )}
              </div>
              <div className="text-right">
                {actualAmount > 0 ? (
                  <>
                    <p className={`text-[0.55rem] font-bold ${canAfford ? 'text-gold' : 'text-blood'}`}>
                      €{cost.toLocaleString()}
                    </p>
                    {option.amount === Infinity && missing > 0 && (
                      <p className="text-[0.4rem] text-emerald">-20%</p>
                    )}
                  </>
                ) : (
                  <p className="text-[0.5rem] text-muted-foreground">—</p>
                )}
              </div>
              <GameButton
                variant={isDisabled ? 'muted' : 'emerald'}
                size="sm"
                disabled={isDisabled}
                onClick={() => handleHeal(option)}
              >
                GENEES
              </GameButton>
            </motion.div>
          );
        })}
      </div>

      {/* Info */}
      <div className="game-card text-[0.5rem] text-muted-foreground space-y-1">
        <div className="flex items-center gap-1.5">
          <BadgeDollarSign size={10} />
          <span>Prijs: €{HOSPITAL_HEAL_COST_PER_HP}/HP (volledig herstel: 20% korting)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Heart size={10} />
          <span>Natuurlijk herstel: 10 HP/nacht (20 met Villa Crew Kwartieren)</span>
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
