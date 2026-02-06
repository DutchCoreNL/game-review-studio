import { useGame } from '@/contexts/GameContext';
import { SOLO_OPERATIONS, FAMILIES } from '@/game/constants';
import { GameState, ActiveContract, ActiveMission } from '@/game/types';
import { generateMissionEncounters } from '@/game/missions';
import { calculateOperationRewardRange, rollActualReward } from '@/game/operationRewards';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { StatBar } from './ui/StatBar';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Crosshair, Users, UserPlus, Lock, Truck, Swords, Eye, Cpu, ChevronDown, ChevronUp, Heart, Star, Trash2, Activity, Sparkles, TrendingUp } from 'lucide-react';
import { CREW_SPECIALIZATIONS } from '@/game/constants';
import { ConfirmDialog } from './ConfirmDialog';

const CONTRACT_ICONS: Record<string, React.ReactNode> = { delivery: <Truck size={16} />, combat: <Swords size={16} />, stealth: <Eye size={16} />, tech: <Cpu size={16} /> };
const CONTRACT_COLORS: Record<string, string> = { delivery: 'text-gold', combat: 'text-blood', stealth: 'text-game-purple', tech: 'text-ice' };
const CONTRACT_BORDER: Record<string, string> = { delivery: 'border-l-gold', combat: 'border-l-blood', stealth: 'border-l-game-purple', tech: 'border-l-ice' };
const BEST_ROLE: Record<string, string> = { delivery: 'Chauffeur', combat: 'Enforcer', stealth: 'Smokkelaar', tech: 'Hacker' };

type OpsSubTab = 'solo' | 'contracts' | 'crew';

export function OperationsView() {
  const { state, dispatch, showToast } = useGame();
  const [subTab, setSubTab] = useState<OpsSubTab>('solo');
  const [selectedContract, setSelectedContract] = useState<number | null>(null);
  const [fireConfirm, setFireConfirm] = useState<number | null>(null);

  const startContractMission = (contractId: number, crewIndex: number) => {
    const contract = state.activeContracts.find(c => c.id === contractId);
    const member = state.crew[crewIndex];
    if (!contract || !member) return;

    const encounters = generateMissionEncounters('contract', contract.name, contract.type);
    const mission: ActiveMission = {
      type: 'contract',
      missionId: contract.name,
      contractId: contract.id,
      crewIndex,
      crewName: member.name,
      currentEncounter: 0,
      encounters,
      totalReward: 0,
      totalHeat: 0,
      totalCrewDamage: 0,
      totalRelChange: {},
      log: [],
      baseReward: contract.reward,
      baseHeat: contract.heat,
      finished: false,
      success: false,
    };
    dispatch({ type: 'START_MISSION', mission });
    setSelectedContract(null);
  };

  const ironDiscount = state.ownedDistricts.includes('iron');
  const costPerHp = ironDiscount ? 40 : 50;

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1.5 mb-4 mt-1">
        {([
          { id: 'solo' as OpsSubTab, label: 'SOLO OPS', icon: <Crosshair size={12} /> },
          { id: 'contracts' as OpsSubTab, label: 'CONTRACTEN', icon: <Swords size={12} />, badge: state.activeContracts.length },
          { id: 'crew' as OpsSubTab, label: 'CREW', icon: <Users size={12} />, badge: state.crew.length },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex-1 py-2 rounded text-[0.55rem] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 relative ${
              subTab === tab.id
                ? 'bg-gold/15 border border-gold text-gold'
                : 'bg-muted border border-border text-muted-foreground'
            }`}
          >
            {tab.icon} {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="w-4 h-4 bg-blood text-primary-foreground rounded-full text-[0.45rem] font-bold flex items-center justify-center ml-0.5">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {subTab === 'solo' && (
        <>
          <SectionHeader title="Solo Operaties" icon={<Crosshair size={12} />} />
          <p className="text-[0.55rem] text-muted-foreground mb-3">Werk alleen. Hoog risico, geen crew nodig.</p>
          <div className="space-y-2">
            {SOLO_OPERATIONS.map(op => {
              const locked = state.player.level < op.level;
              const rewardRange = !locked ? calculateOperationRewardRange(op, state) : null;
              return (
                <motion.div key={op.id} className={`game-card border-l-[3px] ${locked ? 'opacity-40 border-l-border' : 'border-l-gold'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs">{op.name}</h4>
                        {locked && <Lock size={10} className="text-muted-foreground" />}
                        {!locked && <GameBadge variant="muted" size="xs">Lvl {op.level}+</GameBadge>}
                      </div>
                      <p className="text-[0.5rem] text-muted-foreground">{op.desc}</p>
                      <div className="flex gap-3 mt-1 items-center">
                        <span className="text-[0.5rem] text-blood font-semibold">⚡ {op.risk}%</span>
                        {rewardRange ? (
                          <span className="text-[0.5rem] text-gold font-semibold">
                            €{rewardRange.min.toLocaleString()} - €{rewardRange.max.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[0.5rem] text-gold font-semibold">+€{op.reward.toLocaleString()}</span>
                        )}
                        <span className="text-[0.5rem] text-muted-foreground">🔥 +{op.heat}</span>
                      </div>
                      {rewardRange && rewardRange.bonuses.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rewardRange.bonuses.map((b, i) => (
                            <span key={i} className="text-[0.4rem] font-bold px-1 py-0.5 rounded bg-gold/10 text-gold border border-gold/20 flex items-center gap-0.5">
                              <TrendingUp size={7} /> {b.label} {b.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <GameButton variant="gold" size="sm" disabled={locked}
                      icon={<Crosshair size={12} />}
                      onClick={() => {
                        const range = calculateOperationRewardRange(op, state);
                        const actualReward = rollActualReward(range);
                        const encounters = generateMissionEncounters('solo', op.id);
                        const mission: ActiveMission = {
                          type: 'solo',
                          missionId: op.id,
                          currentEncounter: 0,
                          encounters,
                          totalReward: 0,
                          totalHeat: 0,
                          totalCrewDamage: 0,
                          totalRelChange: {},
                          log: [],
                          baseReward: actualReward,
                          baseHeat: op.heat,
                          finished: false,
                          success: false,
                        };
                        dispatch({ type: 'START_MISSION', mission });
                      }}>GO</GameButton>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {subTab === 'contracts' && (
        <>
          <SectionHeader title="Dagelijkse Contracten" icon={<Swords size={12} />} badge="NIEUW" badgeColor="blood" />
          <p className="text-[0.55rem] text-muted-foreground mb-3">Wijs een crewlid toe. Contracten veranderen elke nacht.</p>
          {state.activeContracts.length === 0 ? (
            <div className="game-card text-center py-6">
              <p className="text-xs text-muted-foreground italic">Alle contracten voltooid vandaag.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {state.activeContracts.map(contract => (
                <ContractCard key={contract.id} contract={contract} crew={state.crew}
                  isExpanded={selectedContract === contract.id}
                  onToggle={() => setSelectedContract(selectedContract === contract.id ? null : contract.id)}
                  onAssign={(crewIdx) => startContractMission(contract.id, crewIdx)} />
              ))}
            </div>
          )}
        </>
      )}

      {subTab === 'crew' && (
        <>
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
                        {c.specialization && (() => {
                          const spec = CREW_SPECIALIZATIONS.find(s => s.id === c.specialization);
                          return spec ? (
                            <span className="ml-1 text-[0.45rem] font-bold text-game-purple bg-game-purple/10 px-1 py-0.5 rounded border border-game-purple/20">
                              <Sparkles size={7} className="inline mr-0.5" />{spec.name}
                            </span>
                          ) : null;
                        })()}
                      </h4>
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
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {c.hp <= 0 ? (
                      <GameBadge variant="blood" size="xs">BUITEN WESTEN</GameBadge>
                    ) : c.hp < 100 ? (
                      <button
                        onClick={() => {
                          dispatch({ type: 'HEAL_CREW', crewIndex: i });
                          const cost = (100 - c.hp) * costPerHp;
                          if (state.money >= cost) showToast(`${c.name} genezen!`);
                          else showToast('Niet genoeg geld', true);
                        }}
                        className="text-[0.5rem] text-emerald font-bold bg-emerald/10 px-2 py-1 rounded border border-emerald flex items-center gap-0.5"
                      >
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

          <GameButton variant="gold" fullWidth
            icon={<UserPlus size={14} />}
            disabled={state.crew.length >= 6 || state.money < 2500}
            onClick={() => {
              dispatch({ type: 'RECRUIT' });
              if (state.crew.length < 6 && state.money >= 2500) showToast('Nieuw crewlid!');
              else if (state.crew.length >= 6) showToast('Crew vol (max 6)', true);
              else showToast('Niet genoeg geld', true);
            }}>
            HUUR SPECIALIST (€2.500)
          </GameButton>
        </>
      )}

      <ConfirmDialog
        open={fireConfirm !== null}
        title="Crewlid Ontslaan"
        message={fireConfirm !== null && state.crew[fireConfirm] ? `Weet je zeker dat je ${state.crew[fireConfirm].name} wilt ontslaan?` : ''}
        confirmText="ONTSLAAN"
        variant="danger"
        onConfirm={() => {
          if (fireConfirm !== null) {
            const name = state.crew[fireConfirm]?.name;
            dispatch({ type: 'FIRE_CREW', crewIndex: fireConfirm });
            showToast(`${name} ontslagen`);
          }
          setFireConfirm(null);
        }}
        onCancel={() => setFireConfirm(null)}
      />
    </div>
  );
}

function ContractCard({ contract, crew, isExpanded, onToggle, onAssign }: { contract: ActiveContract; crew: GameState['crew']; isExpanded: boolean; onToggle: () => void; onAssign: (crewIndex: number) => void }) {
  const bestRole = BEST_ROLE[contract.type] || '';
  const icon = CONTRACT_ICONS[contract.type] || <Crosshair size={16} />;
  const color = CONTRACT_COLORS[contract.type] || 'text-foreground';
  const borderClass = CONTRACT_BORDER[contract.type] || 'border-l-border';

  return (
    <motion.div className={`game-card border-l-[3px] ${borderClass}`} layout>
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded bg-muted flex items-center justify-center ${color}`}>{icon}</div>
            <div>
              <h4 className="font-bold text-xs">{contract.name}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <GameBadge variant="muted" size="xs">{contract.type}</GameBadge>
                <span className="text-[0.5rem] text-blood font-semibold">⚡{contract.risk}%</span>
                <span className="text-[0.5rem] text-gold font-semibold">€{contract.reward.toLocaleString()}</span>
              </div>
            </div>
          </div>
          {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2 pt-2 border-t border-border">
            <p className="text-[0.5rem] text-muted-foreground mb-2">
              Van: <span style={{ color: FAMILIES[contract.employer]?.color }}>{FAMILIES[contract.employer]?.name}</span> →
              <span style={{ color: FAMILIES[contract.target]?.color }}> {FAMILIES[contract.target]?.name}</span>
            </p>
            {crew.length === 0 ? (
              <p className="text-[0.55rem] text-muted-foreground italic">Geen crew beschikbaar.</p>
            ) : (
              <div className="space-y-1.5">
                {crew.map((c: any, i: number) => {
                  const isIdeal = c.role === bestRole;
                  const canAssign = c.hp > 0;
                  return (
                    <button key={i} onClick={() => canAssign && onAssign(i)} disabled={!canAssign}
                      className={`w-full flex items-center justify-between py-1.5 px-2 rounded text-xs transition-all ${canAssign ? 'hover:bg-muted/50' : 'opacity-40'}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{c.name}</span>
                        <span className="text-[0.45rem] text-muted-foreground">({c.role})</span>
                        {isIdeal && <GameBadge variant="gold" size="xs">IDEAAL</GameBadge>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart size={8} className={c.hp < 30 ? 'text-blood' : 'text-emerald'} />
                        <span className="text-[0.5rem]">{c.hp}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
