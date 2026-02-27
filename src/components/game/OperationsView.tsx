import { useGame } from '@/contexts/GameContext';
import { gameApi } from '@/lib/gameApi';
import { SOLO_OPERATIONS, FAMILIES, SOLO_OP_DISTRICT_DESC } from '@/game/constants';
import { GameState, ActiveContract, ActiveMission, SoloOperation } from '@/game/types';
import { generateMissionEncounters } from '@/game/missions';
import { calculateOperationRewardRange, rollActualReward } from '@/game/operationRewards';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { StatBar } from './ui/StatBar';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Crosshair, Users, UserPlus, Lock, Truck, Swords, Eye, Cpu, ChevronDown, ChevronUp, Heart, Star, Trash2, Activity, Sparkles, TrendingUp, Target, Skull, ShieldAlert } from 'lucide-react';
import { PersonalityTrait } from '@/game/types';
import { SubTabBar, SubTab } from './ui/SubTabBar';
import { ViewWrapper } from './ui/ViewWrapper';

const PERSONALITY_LABELS: Record<PersonalityTrait, string> = {
  loyaal: '🤝 Loyaal',
  hebzuchtig: '💰 Hebzuchtig',
  rustig: '🧘 Rustig',
  impulsief: '⚡ Impulsief',
  slim: '🧠 Slim',
  brutaal: '💪 Brutaal',
  charmant: '🎭 Charmant',
  paranoid: '👁️ Paranoid',
};
import { CREW_SPECIALIZATIONS } from '@/game/constants';
import { ConfirmDialog } from './ConfirmDialog';
import { DailyChallengesView } from './DailyChallengesView';
import { HitsView } from './HitsView';
import { HeistView } from './heist/HeistView';
import { MissionBriefing } from './MissionBriefing';
import { BountyBoardPanel } from './bounty/BountyBoardPanel';
import { MostWantedView } from './MostWantedView';
import { PvPAttackView } from './PvPAttackView';
import operationsBg from '@/assets/operations-bg.jpg';
import { SOLO_OP_IMAGES, CONTRACT_TYPE_IMAGES } from '@/assets/items';

const CONTRACT_ICONS: Record<string, React.ReactNode> = { delivery: <Truck size={16} />, combat: <Swords size={16} />, stealth: <Eye size={16} />, tech: <Cpu size={16} /> };
const CONTRACT_COLORS: Record<string, string> = { delivery: 'text-gold', combat: 'text-blood', stealth: 'text-game-purple', tech: 'text-ice' };
const CONTRACT_BORDER: Record<string, string> = { delivery: 'border-l-gold', combat: 'border-l-blood', stealth: 'border-l-game-purple', tech: 'border-l-ice' };
const BEST_ROLE: Record<string, string> = { delivery: 'Chauffeur', combat: 'Enforcer', stealth: 'Smokkelaar', tech: 'Hacker' };

type OpsSubTab = 'solo' | 'contracts' | 'crew' | 'hits' | 'heists' | 'bounties' | 'wanted' | 'challenges' | 'pvp';

export function OperationsView() {
  const { state, dispatch, showToast } = useGame();
  const [subTab, setSubTab] = useState<OpsSubTab>('solo');
  const [selectedContract, setSelectedContract] = useState<number | null>(null);
  const [fireConfirm, setFireConfirm] = useState<number | null>(null);
  const [briefingOp, setBriefingOp] = useState<SoloOperation | null>(null);
  const [acceptingContract, setAcceptingContract] = useState(false);

  const handleAcceptContract = async () => {
    if (acceptingContract) return;
    setAcceptingContract(true);
    try {
      const res = await gameApi.acceptContract();
      if (res.success && res.data?.contract) {
        const newContracts = [...state.activeContracts, res.data.contract];
        dispatch({ type: 'SET_STATE', state: { ...state, activeContracts: newContracts } } as any);
        showToast(res.message);
        // Sync energy from server
        if (res.data.saveData) {
          // saveData is already merged server-side
        }
      } else {
        showToast(res.message, true);
      }
    } catch {
      showToast('Verbindingsfout bij contract ophalen.', true);
    } finally {
      setAcceptingContract(false);
    }
  };

  const startContractMission = (contractId: number, crewIndex: number) => {
    const contract = state.activeContracts.find(c => c.id === contractId);
    const member = state.crew[crewIndex];
    if (!contract || !member) return;

    const encounters = generateMissionEncounters('contract', contract.name, contract.type, state.loc);
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

  const tabs: SubTab<string>[] = [
    { id: 'solo', label: 'SOLO', icon: <Crosshair size={12} /> },
    { id: 'contracts', label: 'CONTRACT', icon: <Swords size={12} />, badge: state.activeContracts.length },
    { id: 'heists', label: 'HEIST', icon: <Target size={12} /> },
    { id: 'hits', label: 'HITS', icon: <Skull size={12} />, badge: (state.hitContracts || []).filter(h => h.deadline >= state.day).length },
    { id: 'bounties', label: 'PREMIES', icon: <ShieldAlert size={12} />, badge: (state.activeBounties || []).length + (state.placedBounties || []).length },
    { id: 'wanted', label: 'WANTED', icon: <Target size={12} /> },
    { id: 'crew', label: 'CREW', icon: <Users size={12} />, badge: state.crew.length },
    { id: 'challenges', label: 'DOEL', icon: <Target size={12} />, badge: state.dailyChallenges?.filter(c => c.completed && !c.claimed).length || 0 },
    { id: 'pvp', label: 'PVP', icon: <Swords size={12} /> },
  ];

  return (
    <ViewWrapper bg={operationsBg}>
      <SubTabBar tabs={tabs} active={subTab} onChange={(id) => setSubTab(id as OpsSubTab)} />

      {subTab === 'solo' && (
        <>
          <SectionHeader title="Solo Operaties" icon={<Crosshair size={12} />} />
          <p className="text-[0.55rem] text-muted-foreground mb-3">Werk alleen. Hoog risico, geen crew nodig.</p>
          <div className="space-y-2">
            {SOLO_OPERATIONS.map(op => {
              const locked = state.player.level < op.level;
              const rewardRange = !locked ? calculateOperationRewardRange(op, state) : null;
              return (
                <motion.div key={op.id} className={`game-card border-l-[3px] ${locked ? 'opacity-40 border-l-border' : 'border-l-gold'} overflow-hidden`}>
                  {/* Operation image banner */}
                  {SOLO_OP_IMAGES[op.id] && (
                    <div className="relative -mx-3 -mt-3 mb-2.5 h-20 overflow-hidden">
                      <img src={SOLO_OP_IMAGES[op.id]} alt={op.name} className={`w-full h-full object-cover ${locked ? 'grayscale' : ''}`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                      <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-end justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-foreground drop-shadow-lg">{op.name}</h4>
                            {locked && <Lock size={10} className="text-muted-foreground" />}
                            {!locked && <GameBadge variant="muted" size="xs">Lvl {op.level}+</GameBadge>}
                          </div>
                          <p className="text-[0.5rem] text-muted-foreground drop-shadow">{SOLO_OP_DISTRICT_DESC[op.id]?.[state.loc] || op.desc}</p>
                        </div>
                        <GameButton variant="gold" size="sm" disabled={locked}
                          icon={<Crosshair size={12} />}
                          onClick={() => setBriefingOp(op)}>GO</GameButton>
                      </div>
                    </div>
                  )}
                  {/* Stats row */}
                  <div className="flex gap-3 items-center">
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
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {subTab === 'contracts' && (
        <>
          <SectionHeader title="Contracten" icon={<Swords size={12} />} badge={`${state.activeContracts.length}/5`} badgeColor="blood" />
          <p className="text-[0.55rem] text-muted-foreground mb-3">Zoek contracten via je netwerk. Max 5 actief. Kost 5 energy per zoekactie.</p>

          {/* Accept new contract button */}
          {state.activeContracts.length < 5 && (
            <GameButton
              variant="gold"
              size="sm"
              className="w-full mb-3"
              disabled={acceptingContract}
              onClick={handleAcceptContract}
            >
              <Sparkles size={12} className="mr-1" />
              {acceptingContract ? 'Zoeken...' : 'Nieuw Contract Zoeken'}
            </GameButton>
          )}

          {state.activeContracts.length === 0 ? (
            <div className="game-card text-center py-6">
              <p className="text-xs text-muted-foreground italic">Geen actieve contracten. Zoek een nieuw contract hierboven.</p>
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
                        {state.crewPersonalities?.[i] && (
                          <span className="ml-1 text-[0.45rem] font-semibold text-ice bg-ice/10 px-1.5 py-0.5 rounded border border-ice/20">
                            {PERSONALITY_LABELS[state.crewPersonalities[i]] || state.crewPersonalities[i]}
                          </span>
                        )}
                      </h4>
                      {/* Specialization info */}
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
                            <span className="text-[0.45rem] text-gold/70 italic">
                              Specialisatie beschikbaar bij level-up!
                            </span>
                          ) : (
                            <span className="text-[0.45rem] text-muted-foreground italic">
                              Spec unlock: Lvl {[3, 5, 7, 9].find(l => l > c.level) || 3}
                            </span>
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
                              <motion.div
                                className={`h-full rounded-full ${loyaltyColor}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${loyalty}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                              />
                            </div>
                            <span className={`text-[0.45rem] font-bold ${labelColor} min-w-[3rem] text-right`}>
                              {loyaltyLabel} ({loyalty})
                            </span>
                            {loyalty < 20 && (
                              <motion.span
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="text-[0.5rem]"
                              >💀</motion.span>
                            )}
                            {loyalty < 50 && loyalty >= 20 && (
                              <span className="text-[0.5rem]" title="Risico op desertie">⚠️</span>
                            )}
                          </div>
                        );
                      })()}
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

      {subTab === 'hits' && <HitsView />}

      {subTab === 'heists' && <HeistView />}

      {subTab === 'bounties' && <BountyBoardPanel />}

      {subTab === 'wanted' && <MostWantedView />}

      {subTab === 'challenges' && <DailyChallengesView />}

      {subTab === 'pvp' && <PvPAttackView />}

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

      {/* Mission Briefing overlay */}
      <AnimatePresence>
        {briefingOp && (
          <MissionBriefing
            operation={briefingOp}
            onClose={() => setBriefingOp(null)}
          />
        )}
      </AnimatePresence>
    </ViewWrapper>
  );
}

function ContractCard({ contract, crew, isExpanded, onToggle, onAssign }: { contract: ActiveContract; crew: GameState['crew']; isExpanded: boolean; onToggle: () => void; onAssign: (crewIndex: number) => void }) {
  const bestRole = BEST_ROLE[contract.type] || '';
  const icon = CONTRACT_ICONS[contract.type] || <Crosshair size={16} />;
  const color = CONTRACT_COLORS[contract.type] || 'text-foreground';
  const borderClass = CONTRACT_BORDER[contract.type] || 'border-l-border';

  return (
    <motion.div className={`game-card border-l-[3px] ${borderClass} overflow-hidden`} layout>
      {/* Contract type banner */}
      {CONTRACT_TYPE_IMAGES[contract.type] && (
        <div className="relative -mx-3 -mt-3 mb-2.5 h-16 overflow-hidden">
          <img src={CONTRACT_TYPE_IMAGES[contract.type]} alt={contract.type} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        </div>
      )}
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
