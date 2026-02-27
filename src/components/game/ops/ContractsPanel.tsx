import { useGame } from '@/contexts/GameContext';
import { FAMILIES } from '@/game/constants';
import { gameApi } from '@/lib/gameApi';
import { ActiveContract, ActiveMission, GameState } from '@/game/types';
import { generateMissionEncounters } from '@/game/missions';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { ViewWrapper } from '../ui/ViewWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Crosshair, Swords, Truck, Eye, Cpu, ChevronDown, ChevronUp, Heart, Trash2, Sparkles } from 'lucide-react';
import operationsBg from '@/assets/operations-bg.jpg';
import { CONTRACT_TYPE_IMAGES } from '@/assets/items';

const CONTRACT_ICONS: Record<string, React.ReactNode> = { delivery: <Truck size={16} />, combat: <Swords size={16} />, stealth: <Eye size={16} />, tech: <Cpu size={16} /> };
const CONTRACT_COLORS: Record<string, string> = { delivery: 'text-gold', combat: 'text-blood', stealth: 'text-game-purple', tech: 'text-ice' };
const CONTRACT_BORDER: Record<string, string> = { delivery: 'border-l-gold', combat: 'border-l-blood', stealth: 'border-l-game-purple', tech: 'border-l-ice' };
const BEST_ROLE: Record<string, string> = { delivery: 'Chauffeur', combat: 'Enforcer', stealth: 'Smokkelaar', tech: 'Hacker' };

export function ContractsPanel() {
  const { state, dispatch, showToast } = useGame();
  const [selectedContract, setSelectedContract] = useState<number | null>(null);
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
      } else {
        showToast(res.message, true);
      }
    } catch {
      showToast('Verbindingsfout bij contract ophalen.', true);
    } finally {
      setAcceptingContract(false);
    }
  };

  const handleDropContract = async (contractId: number) => {
    const res = await gameApi.dropContract(contractId);
    if (res.success) {
      const updated = state.activeContracts.filter(c => c.id !== contractId);
      dispatch({ type: 'SET_STATE', state: { ...state, activeContracts: updated, rep: Math.max(0, state.rep - (res.data?.repPenalty || 0)) } } as any);
      showToast(res.message);
    } else {
      showToast(res.message, true);
    }
  };

  const startContractMission = (contractId: number, crewIndex: number) => {
    const contract = state.activeContracts.find(c => c.id === contractId);
    const member = state.crew[crewIndex];
    if (!contract || !member) return;
    const encounters = generateMissionEncounters('contract', contract.name, contract.type, state.loc);
    const mission: ActiveMission = {
      type: 'contract', missionId: contract.name, contractId: contract.id, crewIndex,
      crewName: member.name, currentEncounter: 0, encounters, totalReward: 0, totalHeat: 0,
      totalCrewDamage: 0, totalRelChange: {}, log: [], baseReward: contract.reward,
      baseHeat: contract.heat, finished: false, success: false,
    };
    dispatch({ type: 'START_MISSION', mission });
    setSelectedContract(null);
  };

  return (
    <ViewWrapper bg={operationsBg}>
      <SectionHeader title="Contracten" icon={<Swords size={12} />} badge={`${state.activeContracts.length}/5`} badgeColor="blood" />
      <p className="text-[0.55rem] text-muted-foreground mb-3">Zoek contracten via je netwerk. Max 5 actief. Kost 5 energy per zoekactie.</p>

      {state.activeContracts.length < 5 && (
        <GameButton variant="gold" size="sm" className="w-full mb-3" disabled={acceptingContract} onClick={handleAcceptContract}>
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
              onAssign={(crewIdx) => startContractMission(contract.id, crewIdx)}
              onDrop={() => handleDropContract(contract.id)} />
          ))}
        </div>
      )}
    </ViewWrapper>
  );
}

function ContractCard({ contract, crew, isExpanded, onToggle, onAssign, onDrop }: { contract: ActiveContract; crew: GameState['crew']; isExpanded: boolean; onToggle: () => void; onAssign: (crewIndex: number) => void; onDrop: () => void }) {
  const bestRole = BEST_ROLE[contract.type] || '';
  const icon = CONTRACT_ICONS[contract.type] || <Crosshair size={16} />;
  const color = CONTRACT_COLORS[contract.type] || 'text-foreground';
  const borderClass = CONTRACT_BORDER[contract.type] || 'border-l-border';

  return (
    <motion.div className={`game-card border-l-[3px] ${borderClass} overflow-hidden`} layout>
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
            <button onClick={onDrop} className="w-full mt-2 py-1.5 px-2 rounded text-[0.5rem] font-bold text-blood border border-blood/30 hover:bg-blood/10 transition-colors flex items-center justify-center gap-1">
              <Trash2 size={10} /> ANNULEER CONTRACT (rep penalty)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
