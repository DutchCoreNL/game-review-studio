import { useGame } from '@/contexts/GameContext';
import { SOLO_OPERATIONS, FAMILIES } from '@/game/constants';
import { performSoloOp, executeContract, healCrew } from '@/game/engine';
import { GameState, ActiveContract } from '@/game/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Crosshair, Users, UserPlus, Lock, Truck, Swords, Eye, Cpu, ChevronDown, ChevronUp, Heart, Star, Shield, Zap, Trash2, Activity } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

const CONTRACT_ICONS: Record<string, React.ReactNode> = { delivery: <Truck size={16} />, combat: <Swords size={16} />, stealth: <Eye size={16} />, tech: <Cpu size={16} /> };
const CONTRACT_COLORS: Record<string, string> = { delivery: 'text-gold', combat: 'text-blood', stealth: 'text-game-purple', tech: 'text-ice' };
const CONTRACT_BORDER: Record<string, string> = { delivery: 'border-l-[hsl(var(--gold))]', combat: 'border-l-[hsl(var(--blood))]', stealth: 'border-l-[hsl(var(--purple))]', tech: 'border-l-[hsl(var(--ice))]' };
const BEST_ROLE: Record<string, string> = { delivery: 'Chauffeur', combat: 'Enforcer', stealth: 'Smokkelaar', tech: 'Hacker' };

export function MissionsView() {
  const { state, dispatch, showToast } = useGame();
  const [expandedOps, setExpandedOps] = useState(true);
  const [expandedContracts, setExpandedContracts] = useState(true);
  const [expandedCrew, setExpandedCrew] = useState(true);
  const [selectedContract, setSelectedContract] = useState<number | null>(null);
  const [fireConfirm, setFireConfirm] = useState<number | null>(null);

  const handleExecuteContract = (contractId: number, crewIndex: number) => {
    const contract = state.activeContracts.find(c => c.id === contractId);
    const member = state.crew[crewIndex];
    if (!contract || !member) return;
    const stateCopy = JSON.parse(JSON.stringify(state)) as GameState;
    const result = executeContract(stateCopy, contractId, crewIndex);
    dispatch({ type: 'EXECUTE_CONTRACT', contractId, crewIndex });
    showToast(result.message, !result.success);
    setSelectedContract(null);
  };

  const ironDiscount = state.ownedDistricts.includes('iron');
  const costPerHp = ironDiscount ? 40 : 50;

  return (
    <div>
      {/* SOLO OPERATIONS */}
      <CollapsibleHeader title="Solo Operaties" expanded={expandedOps} onToggle={() => setExpandedOps(!expandedOps)} count={SOLO_OPERATIONS.filter(op => state.player.level >= op.level).length} total={SOLO_OPERATIONS.length} />
      <AnimatePresence>
        {expandedOps && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="text-[0.6rem] text-muted-foreground mb-2">Werk alleen. Hoog risico, maar geen crew nodig.</p>
            <div className="space-y-2 mb-4">
              {SOLO_OPERATIONS.map(op => {
                const locked = state.player.level < op.level;
                return (
                  <motion.div key={op.id} className={`game-card border-l-[3px] ${locked ? 'opacity-40 border-l-border' : 'border-l-gold'}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs">{op.name}</h4>
                          {locked && <Lock size={10} className="text-muted-foreground" />}
                          {!locked && <span className="text-[0.5rem] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase font-bold">Lvl {op.level}+</span>}
                        </div>
                        <p className="text-[0.55rem] text-muted-foreground">{op.desc}</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[0.5rem] text-blood font-semibold">⚡ Risico {op.risk}%</span>
                          <span className="text-[0.5rem] text-gold font-semibold">+€{op.reward.toLocaleString()}</span>
                          <span className="text-[0.5rem] text-muted-foreground">🔥 +{op.heat}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const result = performSoloOp(JSON.parse(JSON.stringify(state)) as GameState, op.id);
                          dispatch({ type: 'SOLO_OP', opId: op.id });
                          showToast(result.message, !result.success);
                        }}
                        disabled={locked}
                        className="px-3 py-2 rounded text-[0.6rem] font-bold bg-[hsl(var(--gold)/0.1)] border border-gold text-gold disabled:opacity-30 flex items-center gap-1"
                      >
                        <Crosshair size={12} /> GO
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DAILY CONTRACTS */}
      <CollapsibleHeader title="Dagelijkse Contracten" expanded={expandedContracts} onToggle={() => setExpandedContracts(!expandedContracts)} count={state.activeContracts.length} badge="NIEUW" />
      <AnimatePresence>
        {expandedContracts && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="text-[0.6rem] text-muted-foreground mb-2">Contracten veranderen elke nacht. Wijs een crewlid toe.</p>
            {state.activeContracts.length === 0 ? (
              <div className="game-card text-center py-6 mb-4">
                <p className="text-xs text-muted-foreground italic">Alle contracten voltooid vandaag.</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {state.activeContracts.map(contract => (
                  <ContractCard key={contract.id} contract={contract} crew={state.crew} isExpanded={selectedContract === contract.id} onToggle={() => setSelectedContract(selectedContract === contract.id ? null : contract.id)} onAssign={(crewIdx) => handleExecuteContract(contract.id, crewIdx)} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREW MANAGEMENT */}
      <CollapsibleHeader title="Mijn Crew" expanded={expandedCrew} onToggle={() => setExpandedCrew(!expandedCrew)} count={state.crew.length} total={6} />
      <AnimatePresence>
        {expandedCrew && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {[
                { role: 'Hacker', desc: 'Tech missies', icon: <Cpu size={10} />, color: 'text-ice' },
                { role: 'Enforcer', desc: 'Combat missies', icon: <Swords size={10} />, color: 'text-blood' },
                { role: 'Chauffeur', desc: 'Delivery missies', icon: <Truck size={10} />, color: 'text-gold' },
                { role: 'Smokkelaar', desc: 'Stealth missies', icon: <Eye size={10} />, color: 'text-game-purple' },
              ].map(r => (
                <div key={r.role} className="bg-muted/30 rounded px-2 py-1.5 flex items-center gap-1.5">
                  <span className={r.color}>{r.icon}</span>
                  <div>
                    <span className="text-[0.55rem] font-bold text-foreground">{r.role}</span>
                    <span className="text-[0.5rem] text-muted-foreground ml-1">{r.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-3">
              {state.crew.map((c, i) => (
                <div key={i} className="game-card">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center relative">
                        <Users size={14} className="text-gold" />
                        <span className="absolute -bottom-0.5 -right-0.5 text-[0.45rem] bg-gold text-secondary-foreground rounded px-0.5 font-bold">{c.level}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-xs">{c.name} <span className="text-muted-foreground font-normal text-[0.6rem]">({c.role})</span></h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1">
                            <Heart size={8} className={c.hp < 30 ? 'text-blood' : 'text-emerald'} />
                            <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${c.hp > 50 ? 'bg-emerald' : c.hp > 25 ? 'bg-gold' : 'bg-blood'}`} style={{ width: `${c.hp}%` }} />
                            </div>
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
                        <span className="text-[0.55rem] text-blood font-bold bg-[hsl(var(--blood)/0.1)] px-2 py-1 rounded">BUITEN WESTEN</span>
                      ) : c.hp < 100 ? (
                        <button
                          onClick={() => {
                            dispatch({ type: 'HEAL_CREW', crewIndex: i });
                            const cost = (100 - c.hp) * costPerHp;
                            if (state.money >= cost) showToast(`${c.name} genezen! (-€${cost})`);
                            else showToast('Niet genoeg geld', true);
                          }}
                          className="text-[0.5rem] text-emerald font-bold bg-[hsl(var(--emerald)/0.1)] px-2 py-1 rounded border border-emerald flex items-center gap-0.5"
                        >
                          <Activity size={8} /> GENEES €{((100 - c.hp) * costPerHp).toLocaleString()}
                        </button>
                      ) : (
                        <span className="text-[0.55rem] text-emerald font-semibold">GEREED</span>
                      )}
                      <button onClick={() => setFireConfirm(i)} className="text-[0.45rem] text-muted-foreground hover:text-blood transition-colors flex items-center gap-0.5">
                        <Trash2 size={8} /> Ontslaan
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

            <button
              onClick={() => {
                dispatch({ type: 'RECRUIT' });
                if (state.crew.length < 6 && state.money >= 2500) showToast('Nieuw crewlid gerekruteerd!');
                else if (state.crew.length >= 6) showToast('Crew limiet bereikt (max 6)', true);
                else showToast('Niet genoeg geld', true);
              }}
              disabled={state.crew.length >= 6 || state.money < 2500}
              className="w-full py-2.5 rounded text-xs font-bold bg-[hsl(var(--gold)/0.1)] border border-gold text-gold disabled:opacity-30 flex items-center justify-center gap-1.5"
            >
              <UserPlus size={14} /> HUUR SPECIALIST (€2.500)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={fireConfirm !== null}
        title="Crewlid Ontslaan"
        message={fireConfirm !== null && state.crew[fireConfirm] ? `Weet je zeker dat je ${state.crew[fireConfirm].name} wilt ontslaan? Dit kan niet ongedaan worden.` : ''}
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
            <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center ${color}`}>{icon}</div>
            <div>
              <h4 className="font-bold text-xs">{contract.name}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[0.5rem] px-1 py-0.5 rounded bg-muted uppercase font-bold text-muted-foreground">{contract.type}</span>
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
            <p className="text-[0.55rem] text-muted-foreground mb-2">
              Opdrachtgever: <span style={{ color: FAMILIES[contract.employer]?.color }}>{FAMILIES[contract.employer]?.name}</span> | Doelwit: <span style={{ color: FAMILIES[contract.target]?.color }}>{FAMILIES[contract.target]?.name}</span>
            </p>
            {crew.length === 0 ? (
              <p className="text-[0.6rem] text-muted-foreground italic">Geen crew beschikbaar.</p>
            ) : (
              <div className="space-y-1.5">
                {crew.map((c, i) => {
                  const isIdeal = c.role === bestRole;
                  const canAssign = c.hp > 0;
                  return (
                    <button key={i} onClick={() => canAssign && onAssign(i)} disabled={!canAssign}
                      className={`w-full flex items-center justify-between py-1.5 px-2 rounded text-xs transition-all ${canAssign ? 'hover:bg-muted/50' : 'opacity-40'}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{c.name}</span>
                        <span className="text-[0.5rem] text-muted-foreground">({c.role} Lvl {c.level})</span>
                        {isIdeal && <span className="text-[0.45rem] px-1 py-0.5 rounded bg-[hsl(var(--gold)/0.15)] text-gold font-bold">IDEAAL</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart size={8} className={c.hp < 30 ? 'text-blood' : 'text-emerald'} />
                        <span className="text-[0.55rem]">{c.hp}%</span>
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

function CollapsibleHeader({ title, expanded, onToggle, count, total, badge }: { title: string; expanded: boolean; onToggle: () => void; count?: number; total?: number; badge?: string }) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between mt-5 mb-3 pb-1 border-b border-border">
      <div className="flex items-center gap-2">
        <span className="text-gold text-[0.65rem] uppercase tracking-widest font-bold">{title}</span>
        {badge && <span className="text-[0.45rem] px-1.5 py-0.5 rounded bg-blood text-primary-foreground font-bold">{badge}</span>}
      </div>
      <div className="flex items-center gap-1.5">
        {count !== undefined && <span className="text-[0.55rem] text-muted-foreground">{count}{total ? `/${total}` : ''}</span>}
        {expanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
      </div>
    </button>
  );
}
