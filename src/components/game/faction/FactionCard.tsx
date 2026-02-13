import { useGame } from '@/contexts/GameContext';
import { FAMILIES, FACTION_ACTIONS, FACTION_GIFTS, FACTION_REWARDS, DISTRICTS, FACTION_CONQUEST_PHASES, CONQUEST_PHASE_LABELS, BOSS_DATA } from '@/game/constants';
import { GOODS } from '@/game/constants';
import { getFactionStatus, getFactionPerks, getPlayerStat, getConquestPhase, canStartConquestPhase } from '@/game/engine';
import { FamilyId, FactionActionType } from '@/game/types';
import { GameBadge } from '../ui/GameBadge';
import { StatBar } from '../ui/StatBar';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Skull, Shield, Handshake, Banknote, Flame, Bomb, Gift, Eye, Lock, Crown, Percent, Swords, CheckCircle, Flag, Heart, Target, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  Handshake: <Handshake size={14} />,
  Banknote: <Banknote size={14} />,
  Flame: <Flame size={14} />,
  Bomb: <Bomb size={14} />,
  Gift: <Gift size={14} />,
  Eye: <Eye size={14} />,
};

const PERK_ICONS: Record<string, React.ReactNode> = {
  Shield: <Shield size={10} />,
  Percent: <Percent size={10} />,
  Swords: <Swords size={10} />,
  Crown: <Crown size={10} />,
};

interface FactionCardProps {
  familyId: FamilyId;
}

export function FactionCard({ familyId }: FactionCardProps) {
  const { state, dispatch, showToast, setView } = useGame();
  const [expanded, setExpanded] = useState(false);

  const fam = FAMILIES[familyId];
  const rel = state.familyRel[familyId] || 0;
  const dead = state.leadersDefeated.includes(familyId);
  const conquered = state.conqueredFactions?.includes(familyId);
  const status = conquered
    ? { label: 'VAZAL', color: 'text-gold' }
    : getFactionStatus(rel);
  const perks = getFactionPerks(rel);
  const cooldowns = state.factionCooldowns[familyId] || [];
  const hasCooldown = cooldowns.length > 0;

  const relBarPct = Math.max(0, Math.min(100, (rel + 100) / 2));
  const relBarColor = conquered ? 'gold' : rel >= 50 ? 'emerald' : rel >= 0 ? 'gold' : 'blood';

  // Conquest conditions
  const conquest = getConquestPhase(state, familyId);
  const canConquer = dead && !conquered;
  const canAnnex = !dead && !conquered && rel >= 100 && state.money >= 50000;
  // Boss challenge now requires conquest phase 2
  const canChallenge = !dead && !conquered && conquest.phase >= 2 && state.loc === fam.home;
  const isInDistrict = state.loc === fam.home;

  // Conquest phase checks
  const phase1Check = canStartConquestPhase(state, familyId, 1);
  const phase2Check = canStartConquestPhase(state, familyId, 2);
  const phaseEnemy1 = FACTION_CONQUEST_PHASES[familyId]?.phase1;
  const phaseEnemy2 = FACTION_CONQUEST_PHASES[familyId]?.phase2;

  const handleAction = (actionType: FactionActionType) => {
    const actionDef = FACTION_ACTIONS.find(a => a.id === actionType);
    if (!actionDef) return;

    if (dead && !conquered) { showToast('Neem deze factie eerst over!', true); return; }
    if (conquered) { showToast('Deze factie is al jouw vazal.', true); return; }
    if (hasCooldown) { showToast('Je hebt vandaag al een actie uitgevoerd bij deze factie.', true); return; }
    if (actionDef.requiresDistrict && state.loc !== fam.home) { showToast(`Reis eerst naar ${DISTRICTS[fam.home].name}`, true); return; }
    if (actionDef.minRelation !== null && rel < actionDef.minRelation) { showToast(`Relatie te laag (min: ${actionDef.minRelation})`, true); return; }

    if (actionType === 'gift') {
      const giftGood = FACTION_GIFTS[familyId];
      if ((state.inventory[giftGood] || 0) < 3) {
        const goodName = GOODS.find(g => g.id === giftGood)?.name || '';
        showToast(`Je hebt minimaal 3x ${goodName} nodig.`, true);
        return;
      }
    }

    dispatch({ type: 'FACTION_ACTION', familyId, actionType });

    const actionNames: Record<string, string> = {
      negotiate: 'Onderhandeling uitgevoerd!',
      bribe: 'Omkoping geslaagd!',
      intimidate: 'Intimidatie uitgevoerd!',
      sabotage: 'Sabotage uitgevoerd!',
      gift: 'Gift verzonden!',
      intel: 'Informatie gekocht!',
    };
    showToast(actionNames[actionType] || 'Actie uitgevoerd!');
  };

  const handleConquer = () => {
    dispatch({ type: 'CONQUER_FACTION', familyId });
    showToast(`${fam.name} is nu jouw vazal! 👑`);
  };

  const handleAnnex = () => {
    dispatch({ type: 'ANNEX_FACTION', familyId });
    showToast(`${fam.name} diplomatiek geannexeerd! 🤝`);
  };

  const handleChallenge = () => {
    dispatch({ type: 'START_COMBAT', familyId });
    setView('city'); // Combat view takes over automatically
  };

  const getActionCost = (actionType: FactionActionType): string => {
    const charm = getPlayerStat(state, 'charm');
    switch (actionType) {
      case 'negotiate': return `€${Math.max(500, 2000 - (charm * 100)).toLocaleString()}`;
      case 'bribe': return `€${(5000 + Math.floor(Math.abs(rel) * 30)).toLocaleString()}`;
      case 'sabotage': return '€1.000';
      case 'intel': return '€3.000';
      case 'gift': {
        const giftGood = FACTION_GIFTS[familyId];
        const goodName = GOODS.find(g => g.id === giftGood)?.name || '';
        return `3x ${goodName}`;
      }
      case 'intimidate': return 'Gratis';
      default: return '';
    }
  };

  const canDoAction = (actionType: FactionActionType): boolean => {
    if (dead || conquered) return false;
    if (hasCooldown) return false;
    const actionDef = FACTION_ACTIONS.find(a => a.id === actionType);
    if (!actionDef) return false;
    if (actionDef.requiresDistrict && state.loc !== fam.home) return false;
    if (actionDef.minRelation !== null && rel < actionDef.minRelation) return false;
    if (actionDef.maxRelation !== null && rel > actionDef.maxRelation) return false;

    const charm = getPlayerStat(state, 'charm');
    switch (actionType) {
      case 'negotiate': return state.money >= Math.max(500, 2000 - (charm * 100));
      case 'bribe': return state.money >= (5000 + Math.floor(Math.abs(rel) * 30));
      case 'sabotage': return state.money >= 1000;
      case 'intel': return state.money >= 3000;
      case 'gift': return (state.inventory[FACTION_GIFTS[familyId]] || 0) >= 3;
      case 'intimidate': return true;
      default: return false;
    }
  };

  const getActionBlockReason = (actionType: FactionActionType): string | null => {
    if (dead) return 'Leider dood';
    if (conquered) return 'Vazal';
    if (hasCooldown) return 'Morgen';
    const actionDef = FACTION_ACTIONS.find(a => a.id === actionType);
    if (!actionDef) return null;
    if (actionDef.requiresDistrict && state.loc !== fam.home) return `Ga naar ${DISTRICTS[fam.home].name}`;
    if (actionDef.minRelation !== null && rel < actionDef.minRelation) return `Relatie min ${actionDef.minRelation}`;
    return null;
  };

  return (
    <motion.div
      className={`game-card overflow-hidden transition-all`}
      style={{ borderLeft: `3px solid ${conquered ? 'hsl(var(--gold))' : dead ? '#444' : fam.color}` }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {conquered ? (
              <div className="w-5 h-5 rounded bg-gold/20 flex items-center justify-center">
                <Flag size={10} className="text-gold" />
              </div>
            ) : dead ? (
              <Skull size={14} className="text-muted-foreground" />
            ) : (
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: fam.color + '30' }}>
                <Crown size={10} style={{ color: fam.color }} />
              </div>
            )}
            <h4 className="font-bold text-xs">{fam.name}</h4>
            <GameBadge variant={conquered ? 'gold' : dead ? 'muted' : 'blood'} size="xs">
              {familyId.toUpperCase()}
            </GameBadge>
            <span className={`text-[0.5rem] font-bold ${status.color}`}>{status.label}</span>
          </div>
          <p className="text-[0.55rem] text-muted-foreground">{fam.contact} — {fam.desc}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[0.65rem] font-bold">{conquered ? '👑' : dead ? '💀' : rel}</span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} className="text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Relation bar */}
      {!conquered && (
        <div className="mt-2">
          <StatBar value={relBarPct} max={100} color={relBarColor} height="sm" />
          <div className="flex justify-between text-[0.45rem] text-muted-foreground mt-0.5">
            <span>-100</span>
            <span>0</span>
            <span>+100</span>
          </div>
        </div>
      )}

      {/* Conquered banner */}
      {conquered && (
        <div className="mt-2 py-2 px-3 rounded bg-gold/10 border border-gold/20 text-center">
          <p className="text-[0.55rem] font-bold text-gold uppercase tracking-wider">🏴 Vazalstaat — Onder jouw controle</p>
          <p className="text-[0.45rem] text-muted-foreground mt-0.5">+€1.000/dag passief inkomen | Permanente marktkorting | Thuisdistrict bezit</p>
        </div>
      )}

      {/* Active perks */}
      {(perks.length > 0 || conquered) && !conquered && (
        <div className="flex flex-wrap gap-1 mt-2">
          {perks.map(perk => (
            <span key={perk.label} className="inline-flex items-center gap-0.5 text-[0.45rem] font-semibold px-1.5 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">
              {PERK_ICONS[perk.icon] || <CheckCircle size={8} />}
              {perk.label}
            </span>
          ))}
        </div>
      )}

      {/* Expandable section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border mt-3 pt-3">

              {/* === CONQUERED STATE === */}
              {conquered && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[0.55rem]">
                    <CheckCircle size={12} className="text-gold" />
                    <span className="text-gold font-bold">Alle voordelen actief</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[0.5rem]">
                    <div className="bg-muted/50 rounded p-2 text-center">
                      <Banknote size={12} className="mx-auto text-gold mb-0.5" />
                      <span className="font-bold">+€1.000</span>
                      <p className="text-muted-foreground text-[0.4rem]">per dag</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2 text-center">
                      <Percent size={12} className="mx-auto text-emerald mb-0.5" />
                      <span className="font-bold">-30%</span>
                      <p className="text-muted-foreground text-[0.4rem]">marktprijzen</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2 text-center">
                      <Shield size={12} className="mx-auto text-ice mb-0.5" />
                      <span className="font-bold">Bescherming</span>
                      <p className="text-muted-foreground text-[0.4rem]">geen aanvallen</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2 text-center">
                      <Flag size={12} className="mx-auto text-blood mb-0.5" />
                      <span className="font-bold">{DISTRICTS[fam.home].name}</span>
                      <p className="text-muted-foreground text-[0.4rem]">thuisdistrict</p>
                    </div>
                  </div>
                </div>
              )}

              {/* === CONQUER AFTER DEFEAT === */}
              {canConquer && (
                <div className="mb-3">
                  <div className="bg-gold/5 border border-gold/30 rounded p-3 text-center">
                    <Skull size={20} className="mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs font-bold mb-1">Leider Verslagen</p>
                    <p className="text-[0.55rem] text-muted-foreground mb-3">
                      {fam.contact} is dood. Neem de factie over als vazal en krijg hun voordelen.
                    </p>
                    <motion.button
                      onClick={handleConquer}
                      className="w-full py-2.5 rounded text-xs font-bold bg-gold text-secondary-foreground"
                      whileTap={{ scale: 0.95 }}
                    >
                      <Flag size={12} className="inline mr-1.5" />
                      NEEM OVER ALS VAZAL
                    </motion.button>
                  </div>
                </div>
              )}

              {/* === DIPLOMATIC ANNEX === */}
              {!dead && !conquered && rel >= 80 && (
                <div className="mb-3">
                  <div className={`border rounded p-3 text-center ${
                    canAnnex ? 'bg-emerald/5 border-emerald/30' : 'bg-muted/30 border-border'
                  }`}>
                    <Heart size={16} className={`mx-auto mb-1 ${canAnnex ? 'text-emerald' : 'text-muted-foreground'}`} />
                    <p className="text-xs font-bold mb-1">Diplomatieke Annexatie</p>
                    <p className="text-[0.55rem] text-muted-foreground mb-2">
                      {rel >= 100
                        ? 'Relatie maximaal! Annex deze factie vreedzaam.'
                        : `Nog ${100 - rel} relatie nodig (huidig: ${rel}/100)`}
                    </p>
                    <motion.button
                      onClick={handleAnnex}
                      disabled={!canAnnex}
                      className={`w-full py-2.5 rounded text-xs font-bold ${
                        canAnnex
                          ? 'bg-emerald text-primary-foreground'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                      whileTap={canAnnex ? { scale: 0.95 } : {}}
                    >
                      <Handshake size={12} className="inline mr-1.5" />
                      {canAnnex ? 'ANNEXEER (€50.000)' : rel >= 100 ? 'NIET GENOEG GELD' : `RELATIE ${rel}/100`}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* === CONQUEST PROGRESS === */}
              {!dead && !conquered && rel <= -10 && (
                <div className="mb-3">
                  {/* Phase progress bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={12} className="text-blood" />
                    <p className="text-[0.5rem] font-bold text-blood uppercase tracking-wider">Veroveringsfasen</p>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3].map(p => (
                      <div key={p} className={`flex-1 h-1.5 rounded-full ${
                        conquest.phase >= p ? 'bg-blood' : 'bg-muted'
                      }`} />
                    ))}
                  </div>

                  {/* Phase 1: Outpost */}
                  {conquest.phase < 1 && (
                    <div className={`border rounded p-3 mb-2 ${phase1Check.canStart ? 'bg-blood/5 border-blood/30' : 'bg-muted/30 border-border'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldAlert size={14} className={phase1Check.canStart ? 'text-blood' : 'text-muted-foreground'} />
                        <p className="text-xs font-bold">Fase 1: Buitenpost Aanvallen</p>
                      </div>
                      <p className="text-[0.55rem] text-muted-foreground mb-2">
                        Versla {phaseEnemy1?.name} om toegang te krijgen tot de binnenste verdediging.
                      </p>
                      <motion.button
                        onClick={() => { dispatch({ type: 'START_CONQUEST_PHASE', familyId, phase: 1 }); setView('city'); }}
                        disabled={!phase1Check.canStart}
                        className={`w-full py-2 rounded text-xs font-bold ${
                          phase1Check.canStart ? 'bg-blood text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                        whileTap={phase1Check.canStart ? { scale: 0.95 } : {}}
                      >
                        <Swords size={12} className="inline mr-1.5" />
                        {phase1Check.canStart ? `AANVALLEN — ${phaseEnemy1?.name}` : phase1Check.reason}
                      </motion.button>
                    </div>
                  )}

                  {/* Phase 2: Defense */}
                  {conquest.phase === 1 && (
                    <div className={`border rounded p-3 mb-2 ${phase2Check.canStart ? 'bg-blood/5 border-blood/30' : 'bg-muted/30 border-border'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Shield size={14} className={phase2Check.canStart ? 'text-blood' : 'text-muted-foreground'} />
                        <p className="text-xs font-bold">Fase 2: Verdediging Doorbreken</p>
                      </div>
                      <p className="text-[0.55rem] text-muted-foreground mb-1">
                        ✓ Buitenpost veroverd! Versla nu {phaseEnemy2?.name}.
                      </p>
                      <p className="text-[0.5rem] text-emerald mb-2">
                        {phaseEnemy2?.desc}
                      </p>
                      <motion.button
                        onClick={() => { dispatch({ type: 'START_CONQUEST_PHASE', familyId, phase: 2 }); setView('city'); }}
                        disabled={!phase2Check.canStart}
                        className={`w-full py-2 rounded text-xs font-bold ${
                          phase2Check.canStart ? 'bg-blood text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                        whileTap={phase2Check.canStart ? { scale: 0.95 } : {}}
                      >
                        <Swords size={12} className="inline mr-1.5" />
                        {phase2Check.canStart ? `DOORBREKEN — ${phaseEnemy2?.name}` : phase2Check.reason}
                      </motion.button>
                    </div>
                  )}

                  {/* Phase 3: Boss Challenge */}
                  {conquest.phase >= 2 && (
                    <div className={`border rounded p-3 ${canChallenge ? 'bg-blood/5 border-blood/30' : 'bg-muted/30 border-border'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Crown size={14} className={canChallenge ? 'text-gold' : 'text-muted-foreground'} />
                        <p className="text-xs font-bold">Fase 3: Leider Uitdagen</p>
                      </div>
                      <p className="text-[0.55rem] text-muted-foreground mb-1">
                        ✓ Verdediging doorbroken! De weg naar {BOSS_DATA[familyId]?.name} is vrij.
                      </p>
                      <p className="text-[0.5rem] text-gold mb-2">
                        {BOSS_DATA[familyId]?.desc}
                      </p>
                      <motion.button
                        onClick={handleChallenge}
                        disabled={!canChallenge}
                        className={`w-full py-2.5 rounded text-xs font-bold ${
                          canChallenge ? 'bg-gradient-to-r from-blood to-gold text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                        whileTap={canChallenge ? { scale: 0.95 } : {}}
                      >
                        <Swords size={12} className="inline mr-1.5" />
                        {canChallenge ? `UITDAGEN — ${BOSS_DATA[familyId]?.name}` : `REIS NAAR ${DISTRICTS[fam.home].name.toUpperCase()}`}
                      </motion.button>
                    </div>
                  )}
                </div>
              )}

              {/* === ACTION GRID (only if not conquered) === */}
              {!conquered && !canConquer && (
                <>
                  <p className="text-[0.5rem] text-muted-foreground uppercase tracking-wider font-bold mb-2">
                    Acties {hasCooldown && <span className="text-gold ml-1">(cooldown — morgen weer)</span>}
                  </p>

                  <div className="grid grid-cols-3 gap-1.5">
                    {FACTION_ACTIONS.map(action => {
                      const canDo = canDoAction(action.id);
                      const blockReason = getActionBlockReason(action.id);
                      const cost = getActionCost(action.id);

                      return (
                        <motion.button
                          key={action.id}
                          onClick={() => canDo && handleAction(action.id)}
                          disabled={!canDo}
                          className={`relative py-2.5 px-1.5 rounded text-center transition-all ${
                            canDo
                              ? 'bg-muted/80 border border-border hover:border-gold/50 cursor-pointer'
                              : 'bg-muted/30 border border-transparent opacity-40 cursor-not-allowed'
                          }`}
                          whileTap={canDo ? { scale: 0.95 } : {}}
                        >
                          <div className="flex justify-center mb-1" style={{ color: canDo ? fam.color : undefined }}>
                            {ACTION_ICONS[action.icon] || <Handshake size={14} />}
                          </div>
                          <div className="text-[0.5rem] font-bold leading-tight">{action.name}</div>
                          <div className="text-[0.4rem] text-muted-foreground mt-0.5">{cost}</div>
                          {blockReason && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded">
                              <span className="text-[0.4rem] font-bold text-muted-foreground flex items-center gap-0.5">
                                <Lock size={8} /> {blockReason}
                              </span>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Upcoming rewards */}
              {!conquered && FACTION_REWARDS.filter(r => rel < r.minRel).length > 0 && (
                <div className="mt-3 pt-2 border-t border-border/50">
                  <p className="text-[0.45rem] text-muted-foreground uppercase tracking-wider font-bold mb-1.5">
                    Volgende Beloningen
                  </p>
                  <div className="space-y-1">
                    {FACTION_REWARDS.filter(r => rel < r.minRel).slice(0, 2).map(reward => (
                      <div key={reward.label} className="flex items-center gap-2 text-[0.5rem] text-muted-foreground">
                        <div className="w-4 h-4 rounded bg-muted flex items-center justify-center">
                          {PERK_ICONS[reward.icon] || <Lock size={8} />}
                        </div>
                        <span className="flex-1">{reward.desc}</span>
                        <span className="font-bold text-gold">REL {reward.minRel}+</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
