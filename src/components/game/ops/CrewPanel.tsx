import { useGame } from '@/contexts/GameContext';
import { CREW_SPECIALIZATIONS } from '@/game/constants';
import { PersonalityTrait } from '@/game/types';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { StatBar } from '../ui/StatBar';
import { ViewWrapper } from '../ui/ViewWrapper';
import { ConfirmDialog } from '../ConfirmDialog';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Users, UserPlus, Heart, Star, Trash2, Activity, Sparkles, ShieldAlert } from 'lucide-react';
import operationsBg from '@/assets/operations-bg.jpg';

const PERSONALITY_LABELS: Record<PersonalityTrait, string> = {
  loyaal: '🤝 Loyaal', hebzuchtig: '💰 Hebzuchtig', rustig: '🧘 Rustig', impulsief: '⚡ Impulsief',
  slim: '🧠 Slim', brutaal: '💪 Brutaal', charmant: '🎭 Charmant', paranoid: '👁️ Paranoid',
};

export function CrewPanel() {
  const { state, dispatch, showToast } = useGame();
  const [fireConfirm, setFireConfirm] = useState<number | null>(null);

  const ironDiscount = state.ownedDistricts.includes('iron');
  const costPerHp = ironDiscount ? 40 : 50;

  return (
    <ViewWrapper bg={operationsBg}>
      <SectionHeader title="Mijn Crew" icon={<Users size={12} />} badge={`${state.crew.length}/6`} />

      <div className="space-y-2 mb-3">
        {state.crew.map((c, i) => (
          <div key={i} className="game-card">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-muted rounded flex items-center justify-center relative">
                  <Users size={14} className="text-gold" />
                  <span className="absolute -bottom-0.5 -right-0.5 text-[0.4rem] bg-gold text-secondary-foreground rounded px-0.5 font-bold">{c.level}</span>
                </div>
                <div>
                  <h4 className="font-bold text-xs">
                    {c.name} <span className="text-muted-foreground font-normal text-[0.55rem]">({c.role})</span>
                    {state.crewPersonalities?.[i] && (
                      <span className="ml-1 text-[0.45rem] font-semibold text-ice bg-ice/10 px-1.5 py-0.5 rounded border border-ice/20">
                        {PERSONALITY_LABELS[state.crewPersonalities[i]] || state.crewPersonalities[i]}
                      </span>
                    )}
                  </h4>
                  {c.specialization ? (() => {
                    const spec = CREW_SPECIALIZATIONS.find(s => s.id === c.specialization);
                    return spec ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[0.5rem] font-bold text-game-purple bg-game-purple/10 px-1.5 py-0.5 rounded border border-game-purple/20 flex items-center gap-0.5">
                          <Sparkles size={8} className="flex-shrink-0" />{spec.name}
                        </span>
                        <span className="text-[0.45rem] text-muted-foreground italic">{spec.desc}</span>
                      </div>
                    ) : null;
                  })() : (
                    <div className="mt-0.5">
                      {[3, 5, 7, 9].some(lvl => c.level >= lvl) && c.level < 10 ? (
                        <span className="text-[0.45rem] text-gold/70 italic">Specialisatie beschikbaar bij level-up!</span>
                      ) : (
                        <span className="text-[0.45rem] text-muted-foreground italic">Spec unlock: Lvl {[3, 5, 7, 9].find(l => l > c.level) || 3}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1">
                      <Heart size={8} className={c.hp < 30 ? 'text-blood' : 'text-emerald'} />
                      <div className="w-12"><StatBar value={c.hp} max={100} height="sm" animate={false} /></div>
                      <span className="text-[0.5rem] text-muted-foreground">{c.hp}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Star size={8} className="text-gold" />
                      <span className="text-[0.5rem] text-muted-foreground">{c.xp}/{30 * c.level}</span>
                    </div>
                  </div>
                  {/* Loyalty bar */}
                  {(() => {
                    const loyalty = c.loyalty ?? 75;
                    const loyaltyColor = loyalty >= 80 ? 'bg-emerald' : loyalty >= 50 ? 'bg-gold' : loyalty >= 20 ? 'bg-orange-400' : 'bg-blood';
                    const loyaltyLabel = loyalty >= 80 ? 'Trouw' : loyalty >= 50 ? 'Neutraal' : loyalty >= 20 ? 'Onrustig' : 'Ontrouw';
                    const labelColor = loyalty >= 80 ? 'text-emerald' : loyalty >= 50 ? 'text-gold' : loyalty >= 20 ? 'text-orange-400' : 'text-blood';
                    return (
                      <div className="flex items-center gap-1.5 mt-1">
                        <ShieldAlert size={9} className={labelColor} />
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div className={`h-full rounded-full ${loyaltyColor}`} initial={{ width: 0 }} animate={{ width: `${loyalty}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
                        </div>
                        <span className={`text-[0.45rem] font-bold ${labelColor} min-w-[3rem] text-right`}>{loyaltyLabel} ({loyalty})</span>
                        {loyalty < 20 && <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="text-[0.5rem]">💀</motion.span>}
                        {loyalty < 50 && loyalty >= 20 && <span className="text-[0.5rem]" title="Risico op desertie">⚠️</span>}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {c.hp <= 0 ? (
                  <GameBadge variant="blood" size="xs">BUITEN WESTEN</GameBadge>
                ) : c.hp < 100 ? (
                  <button onClick={() => { dispatch({ type: 'HEAL_CREW', crewIndex: i }); const cost = (100 - c.hp) * costPerHp; if (state.money >= cost) showToast(`${c.name} genezen!`); else showToast('Niet genoeg geld', true); }}
                    className="text-[0.5rem] text-emerald font-bold bg-emerald/10 px-2 py-1 rounded border border-emerald flex items-center gap-0.5">
                    <Activity size={8} /> €{((100 - c.hp) * costPerHp).toLocaleString()}
                  </button>
                ) : (
                  <GameBadge variant="emerald" size="xs">GEREED</GameBadge>
                )}
                <button onClick={() => setFireConfirm(i)} className="text-[0.4rem] text-muted-foreground hover:text-blood transition-colors flex items-center gap-0.5">
                  <Trash2 size={7} /> Ontslaan
                </button>
              </div>
            </div>
          </div>
        ))}
        {state.crew.length === 0 && (
          <div className="game-card text-center py-6">
            <Users size={24} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-xs">Geen crew. Huur specialisten!</p>
          </div>
        )}
      </div>

      <GameButton variant="gold" fullWidth icon={<UserPlus size={14} />}
        disabled={state.crew.length >= 6 || state.money < 2500}
        onClick={() => { dispatch({ type: 'RECRUIT' }); if (state.crew.length < 6 && state.money >= 2500) showToast('Nieuw crewlid!'); else if (state.crew.length >= 6) showToast('Crew vol (max 6)', true); else showToast('Niet genoeg geld', true); }}>
        HUUR SPECIALIST (€2.500)
      </GameButton>

      <ConfirmDialog open={fireConfirm !== null} title="Crewlid Ontslaan"
        message={fireConfirm !== null && state.crew[fireConfirm] ? `Weet je zeker dat je ${state.crew[fireConfirm].name} wilt ontslaan?` : ''}
        confirmText="ONTSLAAN" variant="danger"
        onConfirm={() => { if (fireConfirm !== null) { const name = state.crew[fireConfirm]?.name; dispatch({ type: 'FIRE_CREW', crewIndex: fireConfirm }); showToast(`${name} ontslagen`); } setFireConfirm(null); }}
        onCancel={() => setFireConfirm(null)} />
    </ViewWrapper>
  );
}
