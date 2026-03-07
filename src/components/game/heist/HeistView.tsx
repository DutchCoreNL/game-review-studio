import { useGame } from '@/contexts/GameContext';
import { HEIST_TEMPLATES, HEIST_ROLES, HEIST_EQUIPMENT, getAvailableHeists, getHeistCooldownRemaining, HeistRoleId, HeistEquipId } from '@/game/heists';
import { DISTRICTS } from '@/game/constants';
import { getPlayerStat } from '@/game/engine';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { StatBar } from '../ui/StatBar';
import { ViewWrapper } from '../ui/ViewWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Target, Users, Eye, ShoppingBag, Play, X, Lock, Clock, CheckCircle, Cpu, DollarSign, Flame, MapPin, Star } from 'lucide-react';
import heistBg from '@/assets/heist-bg.jpg';
import { HEIST_IMAGES } from '@/assets/items';
import { LockpickGame } from '../minigames/LockpickGame';
import { HackingGame } from '../minigames/HackingGame';

export function HeistView() {
  const { state, dispatch, showToast } = useGame();
  const [selectedHeist, setSelectedHeist] = useState<string | null>(null);
  const plan = state.heistPlan;
  const active = state.activeHeist;

  // If heist is active, show execution view
  if (active) return <HeistExecution />;
  // If planning, show planning board
  if (plan) return <HeistPlanning />;

  // Otherwise show available heists
  const available = getAvailableHeists(state);
  const locked = HEIST_TEMPLATES.filter(h => !available.find(a => a.id === h.id));

  return (
    <ViewWrapper bg={heistBg}>
      {/* Cinematic Header */}
      <div className="relative -mx-3 lg:-mx-4 -mt-2 mb-4 h-36 overflow-hidden">
        <img src={heistBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-gold/10 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-gold" />
            <span className="text-[0.5rem] uppercase tracking-[0.3em] text-gold/80 font-bold">Planningsbureau</span>
          </div>
          <h2 className="font-display text-xl uppercase tracking-wider text-foreground drop-shadow-lg">HEIST MISSIES</h2>
          <p className="text-[0.5rem] text-muted-foreground italic mt-0.5">Plan en voer grootschalige overvallen uit met je crew.</p>
        </div>
      </div>

      {state.crew.length < 3 && (
        <div className="game-card border-l-[3px] border-l-gold mb-3 p-2.5">
          <div className="flex items-center gap-2">
            <Users size={12} className="text-gold" />
            <p className="text-[0.55rem] text-gold font-semibold">⚠️ Je hebt minimaal 3 crewleden nodig voor een heist.</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {available.map(h => {
          const cooldown = getHeistCooldownRemaining(state, h.id);
          return (
            <motion.div key={h.id} className="game-card overflow-hidden" whileTap={{ scale: 0.98 }}>
              {/* Large banner image */}
              {HEIST_IMAGES[h.id] && (
                <div className="relative -mx-3 -mt-3 h-28 overflow-hidden">
                  <img src={HEIST_IMAGES[h.id]} alt={h.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                  {/* Tier badge */}
                  <div className="absolute top-2 left-2.5">
                    <span className="text-[0.45rem] font-bold uppercase tracking-wider bg-background/80 backdrop-blur-sm text-gold border border-gold/30 px-2 py-0.5 rounded">
                      Tier {h.tier}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2.5">
                    <GameButton variant="gold" size="sm" disabled={state.crew.length < 3 || cooldown > 0}
                      onClick={() => { dispatch({ type: 'START_HEIST_PLANNING', heistId: h.id }); showToast('Planning gestart!'); }}>
                      {cooldown > 0 ? <><Clock size={10} /> {cooldown}d</> : 'PLAN'}
                    </GameButton>
                  </div>
                  <div className="absolute bottom-2 left-2.5">
                    <h4 className="font-bold text-sm text-foreground drop-shadow-lg font-display tracking-wider">{h.name}</h4>
                    <p className="text-[0.45rem] text-muted-foreground drop-shadow">{h.desc}</p>
                  </div>
                </div>
              )}
              {/* Reward chips */}
              <div className="flex gap-2 flex-wrap mt-2.5 px-0.5">
                <div className="flex items-center gap-1 text-[0.5rem] font-bold text-gold bg-gold/10 px-2 py-1 rounded border border-gold/20">
                  <DollarSign size={10} /> €{h.basePayout.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-[0.5rem] font-bold text-blood bg-blood/10 px-2 py-1 rounded border border-blood/20">
                  <Flame size={10} /> +{h.baseHeat} Heat
                </div>
                <div className="flex items-center gap-1 text-[0.5rem] font-bold text-muted-foreground bg-muted/30 px-2 py-1 rounded border border-border">
                  <MapPin size={10} /> {DISTRICTS[h.district].name}
                </div>
              </div>
            </motion.div>
          );
        })}

        {locked.map(h => (
          <div key={h.id} className="game-card opacity-50 overflow-hidden">
            {HEIST_IMAGES[h.id] && (
              <div className="relative -mx-3 -mt-3 mb-2.5 h-20 overflow-hidden">
                <img src={HEIST_IMAGES[h.id]} alt={h.name} className="w-full h-full object-cover grayscale" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-background/80 backdrop-blur-sm rounded-full p-2">
                    <Lock size={16} className="text-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 px-0.5">
              <div>
                <h4 className="font-bold text-xs">{h.name}</h4>
                <p className="text-[0.45rem] text-muted-foreground">Vereist: Lvl {h.minLevel} | Rep {h.minRep}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ViewWrapper>
  );
}

function HeistPlanning() {
  const { state, dispatch, showToast } = useGame();
  const plan = state.heistPlan!;
  const template = HEIST_TEMPLATES.find(h => h.id === plan.heistId)!;

  const updatePlan = (updates: Partial<typeof plan>) => {
    dispatch({ type: 'UPDATE_HEIST_PLAN', plan: { ...plan, ...updates } });
  };

  const assignCrew = (role: HeistRoleId, crewIdx: number | null) => {
    const newAssignments = { ...plan.crewAssignments, [role]: crewIdx };
    updatePlan({ crewAssignments: newAssignments });
  };

  const allAssigned = Object.values(plan.crewAssignments).filter(v => v !== null).length === 3;
  const uniqueAssigned = new Set(Object.values(plan.crewAssignments).filter(v => v !== null)).size === Object.values(plan.crewAssignments).filter(v => v !== null).length;

  return (
    <div>
      {/* Planning Header */}
      {HEIST_IMAGES[template.id] && (
        <div className="relative -mx-3 -mt-2 mb-4 h-28 overflow-hidden rounded-b-lg">
          <img src={HEIST_IMAGES[template.id]} alt={template.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-3 left-4">
            <span className="text-[0.45rem] uppercase tracking-[0.2em] text-gold/80 font-bold">Planningsfase</span>
            <h3 className="font-bold text-lg font-display tracking-wider drop-shadow-lg">{template.name}</h3>
          </div>
          <div className="absolute top-3 right-3">
            <GameButton variant="muted" size="sm" onClick={() => dispatch({ type: 'CANCEL_HEIST' })}>
              <X size={12} /> Annuleer
            </GameButton>
          </div>
        </div>
      )}

      {/* Step 1: Recon */}
      <div className="game-card mb-3 overflow-hidden">
        <div className="h-0.5 bg-gold" />
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Eye size={12} className="text-gold" />
            </div>
            <div>
              <span className="text-[0.5rem] text-gold font-bold uppercase tracking-wider">Stap 1</span>
              <h4 className="text-xs font-bold">Verkenning</h4>
            </div>
          </div>
          {plan.reconDone ? (
            <div>
              <div className="flex items-center gap-1 mb-1"><CheckCircle size={12} className="text-emerald" /><span className="text-[0.55rem] font-bold text-emerald">Intel verzameld</span></div>
              <pre className="text-[0.45rem] text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded p-2">{plan.reconIntel}</pre>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.55rem]">Verken het doelwit</p>
                <p className="text-[0.45rem] text-muted-foreground">Verlaagt moeilijkheid met 10%. Kost €2.000.</p>
              </div>
              <GameButton variant="gold" size="sm" disabled={state.money < 2000}
                onClick={() => { dispatch({ type: 'PERFORM_RECON' }); showToast('Intel verzameld!'); }}>
                <Eye size={10} /> €2k
              </GameButton>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Crew Assignment */}
      <div className="game-card mb-3 overflow-hidden">
        <div className="h-0.5 bg-ice" />
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-ice/10 border border-ice/20 flex items-center justify-center">
              <Users size={12} className="text-ice" />
            </div>
            <div>
              <span className="text-[0.5rem] text-ice font-bold uppercase tracking-wider">Stap 2</span>
              <h4 className="text-xs font-bold">Crew Toewijzing</h4>
            </div>
          </div>
          <div className="space-y-2">
            {HEIST_ROLES.map(role => {
              const assignedIdx = plan.crewAssignments[role.id];
              return (
                <div key={role.id} className="bg-muted/30 rounded p-2.5 border border-border">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm">{role.icon}</span>
                    <span className="text-[0.55rem] font-bold">{role.name}</span>
                    <span className="text-[0.4rem] text-muted-foreground">({role.desc})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {state.crew.map((c, i) => {
                      const isAssigned = assignedIdx === i;
                      const isUsedElsewhere = Object.entries(plan.crewAssignments).some(([r, idx]) => r !== role.id && idx === i);
                      const isIdeal = c.role === role.idealRole;
                      return (
                        <button key={i} disabled={c.hp <= 0 || isUsedElsewhere}
                          onClick={() => assignCrew(role.id, isAssigned ? null : i)}
                          className={`text-[0.45rem] font-bold px-2 py-1 rounded border transition-all ${
                            isAssigned ? 'bg-gold/15 border-gold text-gold' :
                            isUsedElsewhere ? 'opacity-30 border-border' :
                            c.hp <= 0 ? 'opacity-30 border-border' :
                            'bg-muted border-border text-muted-foreground hover:border-gold/50'
                          }`}>
                          {c.name} {isIdeal && '⭐'} {isAssigned && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step 3: Equipment */}
      <div className="game-card mb-4 overflow-hidden">
        <div className="h-0.5 bg-game-purple" />
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-game-purple/10 border border-game-purple/20 flex items-center justify-center">
              <ShoppingBag size={12} className="text-game-purple" />
            </div>
            <div>
              <span className="text-[0.5rem] text-game-purple font-bold uppercase tracking-wider">Stap 3</span>
              <h4 className="text-xs font-bold">Uitrusting</h4>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {HEIST_EQUIPMENT.map(e => {
              const owned = plan.equipment.includes(e.id);
              return (
                <div key={e.id} className={`flex items-center gap-2 rounded px-2.5 py-2 border ${
                  owned ? 'bg-game-purple/10 border-game-purple/20' : 'bg-background/50 border-border'
                }`}>
                  <span className="text-sm">{e.icon}</span>
                  <div className="flex-1">
                    <span className="text-[0.55rem] font-bold">{e.name}</span>
                    <p className="text-[0.4rem] text-muted-foreground">{e.desc}</p>
                  </div>
                  <GameButton variant={owned ? 'muted' : 'gold'} size="sm" disabled={owned || state.money < e.cost}
                    onClick={() => { dispatch({ type: 'BUY_HEIST_EQUIP', equipId: e.id as HeistEquipId }); showToast(`${e.name} gekocht!`); }}>
                    {owned ? '✓' : `€${e.cost.toLocaleString()}`}
                  </GameButton>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Launch */}
      <GameButton variant="gold" fullWidth disabled={!allAssigned || !uniqueAssigned}
        icon={<Play size={14} />} glow={allAssigned && uniqueAssigned}
        onClick={() => { dispatch({ type: 'LAUNCH_HEIST' }); showToast('Heist gestart!'); }}>
        START HEIST
      </GameButton>
      {!allAssigned && <p className="text-[0.45rem] text-blood text-center mt-1">Wijs 3 crewleden toe aan rollen</p>}
      {allAssigned && !uniqueAssigned && <p className="text-[0.45rem] text-blood text-center mt-1">Elk crewlid mag maar één rol hebben</p>}
    </div>
  );
}

function HeistExecution() {
  const { state, dispatch, showToast } = useGame();
  const heist = state.activeHeist!;
  const template = HEIST_TEMPLATES.find(h => h.id === heist.plan.heistId)!;
  const complication = heist.pendingComplication;
  const [activeMinigame, setActiveMinigame] = useState<{ type: 'lockpick' | 'hacking'; choiceId: string } | null>(null);

  const getComplicationMinigame = (compType: string): 'lockpick' | 'hacking' | null => {
    if (compType === 'tech_fail') return 'hacking';
    if (compType === 'lockdown' || compType === 'alarm') return 'lockpick';
    return null;
  };

  const handleMinigameComplete = (success: boolean) => {
    if (!activeMinigame) return;
    const choiceId = activeMinigame.choiceId;
    setActiveMinigame(null);
    dispatch({ type: 'RESOLVE_HEIST_COMPLICATION', choiceId, forceResult: success ? 'success' : 'fail' });
  };

  return (
    <div>
      {/* Execution Header */}
      {HEIST_IMAGES[template.id] && (
        <div className="relative -mx-3 -mt-2 mb-4 h-24 overflow-hidden rounded-b-lg">
          <img src={HEIST_IMAGES[template.id]} alt={template.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-2 left-4">
            <h3 className="font-bold text-sm font-display tracking-wider drop-shadow-lg">{template.name}</h3>
            <p className="text-[0.45rem] text-muted-foreground">
              Fase {Math.min(heist.currentPhase + 1, template.phases.length)}/{template.phases.length}
              {heist.finished && (heist.success ? ' — GESLAAGD!' : ' — MISLUKT')}
            </p>
          </div>
        </div>
      )}

      {/* Phase progress as step bar */}
      <div className="flex gap-1 mb-3">
        {template.phases.map((p, i) => {
          const result = heist.phaseResults[i];
          return (
            <div key={i} className={`flex-1 py-1.5 rounded text-center text-[0.45rem] font-bold transition-colors ${
              result ? (result.success ? 'bg-emerald/20 text-emerald border border-emerald/30' : 'bg-blood/20 text-blood border border-blood/30') :
              i === heist.currentPhase ? 'bg-gold/20 text-gold border border-gold/30 animate-pulse' :
              'bg-muted border border-border text-muted-foreground'
            }`}>
              {p.name}
            </div>
          );
        })}
      </div>

      {/* Log */}
      <div className="game-card bg-muted/30 mb-3 max-h-48 overflow-y-auto game-scroll p-2.5">
        {heist.log.map((line, i) => (
          <p key={i} className={`text-[0.5rem] ${line.startsWith('   ✓') ? 'text-emerald' : line.startsWith('   ✗') ? 'text-blood' : line.startsWith('   ⚠') ? 'text-gold' : line.startsWith('   🛡') ? 'text-ice' : 'text-muted-foreground'}`}>
            {line}
          </p>
        ))}
      </div>

      {/* Complication choice */}
      {complication && (
        <motion.div className="game-card border-2 border-gold mb-3 overflow-hidden" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
          <div className="h-1 bg-gold" />
          <div className="p-3">
            <p className="text-[0.55rem] font-bold text-gold mb-2">⚠️ {complication.text}</p>
            <div className="space-y-1.5">
              {complication.choices.map(c => {
                const minigameType = getComplicationMinigame(complication.type);
                return (
                  <div key={c.id}>
                    <button onClick={() => dispatch({ type: 'RESOLVE_HEIST_COMPLICATION', choiceId: c.id })}
                      className="w-full text-left rounded bg-muted/50 hover:bg-muted border border-border hover:border-gold/50 transition-all p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{c.label}</span>
                        <GameBadge variant="muted" size="xs">{c.stat}</GameBadge>
                      </div>
                      <p className="text-[0.4rem] text-muted-foreground">Moeilijkheid: {c.difficulty}%</p>
                    </button>
                    {minigameType && (
                      <button
                        onClick={() => setActiveMinigame({ type: minigameType, choiceId: c.id })}
                        className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded border border-game-purple/40 bg-game-purple/10 hover:bg-game-purple/20 transition-colors text-game-purple"
                      >
                        {minigameType === 'lockpick' ? <Lock size={10} /> : <Cpu size={10} />}
                        <span className="text-[0.5rem] font-bold uppercase tracking-wider">
                          {minigameType === 'lockpick' ? '🔓 Lockpick' : '💻 Hack'}
                        </span>
                        <span className="text-[0.4rem] text-muted-foreground ml-1">— Succes = gegarandeerd ✓</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats as cards */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="game-card bg-gold/5 border border-gold/20 p-2.5 text-center">
          <DollarSign size={12} className="text-gold mx-auto mb-0.5" />
          <p className="text-[0.4rem] text-muted-foreground">Buit</p>
          <p className="text-sm font-bold text-gold">€{Math.max(0, heist.totalReward).toLocaleString()}</p>
        </div>
        <div className="game-card bg-blood/5 border border-blood/20 p-2.5 text-center">
          <Flame size={12} className="text-blood mx-auto mb-0.5" />
          <p className="text-[0.4rem] text-muted-foreground">Heat</p>
          <p className="text-sm font-bold text-blood">{heist.totalHeat}</p>
        </div>
        <div className="game-card bg-ice/5 border border-ice/20 p-2.5 text-center">
          <Users size={12} className="text-ice mx-auto mb-0.5" />
          <p className="text-[0.4rem] text-muted-foreground">Crew Schade</p>
          <p className="text-sm font-bold text-ice">{heist.totalCrewDamage}</p>
        </div>
      </div>

      {/* Actions */}
      {heist.finished ? (
        <GameButton variant={heist.success ? 'gold' : 'blood'} fullWidth glow={heist.success}
          onClick={() => { dispatch({ type: 'FINISH_HEIST' }); showToast(heist.success ? 'Heist voltooid!' : 'Heist mislukt...'); }}>
          {heist.success ? '🎉 BUIT OPHALEN' : '💀 AFSLUITEN'}
        </GameButton>
      ) : !complication ? (
        <GameButton variant="gold" fullWidth icon={<Play size={14} />} glow
          onClick={() => dispatch({ type: 'ADVANCE_HEIST' })}>
          VOLGENDE FASE
        </GameButton>
      ) : null}

      {/* Mini-game overlays */}
      {activeMinigame?.type === 'lockpick' && (
        <LockpickGame
          difficulty={Math.min(3, template.tier)}
          brainsBonus={getPlayerStat(state, 'brains')}
          onComplete={handleMinigameComplete}
        />
      )}
      {activeMinigame?.type === 'hacking' && (
        <HackingGame
          difficulty={Math.min(3, template.tier)}
          brainsBonus={getPlayerStat(state, 'brains')}
          hasHacker={state.crew.some(c => c.role === 'Hacker' && c.hp > 0)}
          onComplete={handleMinigameComplete}
        />
      )}
    </div>
  );
}
