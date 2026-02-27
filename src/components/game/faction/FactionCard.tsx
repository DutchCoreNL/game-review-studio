import { useGame } from '@/contexts/GameContext';
import { FAMILIES, FACTION_ACTIONS, FACTION_GIFTS, FACTION_REWARDS, DISTRICTS, FACTION_CONQUEST_PHASES, CONQUEST_PHASE_LABELS, BOSS_DATA } from '@/game/constants';
import { GOODS } from '@/game/constants';
import { getFactionStatus, getFactionPerks, getPlayerStat } from '@/game/engine';
import { FamilyId, FactionActionType } from '@/game/types';
import { GameBadge } from '../ui/GameBadge';
import { StatBar } from '../ui/StatBar';
import { CooldownTimer } from '../header/CooldownTimer';
import { useFactionState } from '@/hooks/useFactionState';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Skull, Shield, Handshake, Banknote, Flame, Bomb, Gift, Eye, Lock, Crown, Percent, Swords, CheckCircle, Flag, Heart, Target, ShieldAlert, Users, Trophy, Timer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlayerDetailPopup } from '../PlayerDetailPopup';

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

function GangDamageLeaderboard({ gangDamage, totalDamage }: { gangDamage: Record<string, Record<string, number>>; totalDamage: number }) {
  const [gangNames, setGangNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const ids = Object.keys(gangDamage);
    if (ids.length === 0) return;
    supabase.from('gangs').select('id, name, tag').in('id', ids).then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(g => { map[g.id] = `[${g.tag}] ${g.name}`; });
        setGangNames(map);
      }
    });
  }, [gangDamage]);

  const sorted = Object.entries(gangDamage)
    .map(([gid, members]) => ({
      gid,
      total: Object.values(members).reduce((a, b) => a + b, 0),
      memberCount: Object.keys(members).length,
    }))
    .sort((a, b) => b.total - a.total);

  if (sorted.length === 0) return null;

  return (
    <div className="mt-2 pt-2 border-t border-border/50">
      <div className="flex items-center gap-1 mb-1.5">
        <Users size={10} className="text-ice" />
        <span className="text-[0.45rem] font-bold uppercase tracking-wider text-ice">Gang Allianties</span>
      </div>
      <div className="space-y-1">
        {sorted.slice(0, 5).map((g, i) => {
          const pct = totalDamage > 0 ? Math.round((g.total / totalDamage) * 100) : 0;
          return (
            <div key={g.gid} className="flex items-center gap-2 text-[0.5rem]">
              <span className={`w-4 text-center font-bold ${i === 0 ? 'text-ice' : 'text-muted-foreground/60'}`}>
                {i === 0 ? '⚔️' : `#${i + 1}`}
              </span>
              <span className="flex-1 truncate font-semibold">{gangNames[g.gid] || g.gid.slice(0, 8)}</span>
              <span className="text-muted-foreground">{g.memberCount}👤</span>
              <span className="font-bold">{g.total} dmg</span>
              <span className="text-ice text-[0.4rem]">({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FactionCard({ familyId }: FactionCardProps) {
  const { state, dispatch, showToast, setView } = useGame();
  const { factions, usernameMap, attackFaction } = useFactionState();
  const [expanded, setExpanded] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);
  
  // Get MMO faction state from server (authoritative)
  const mmoFaction = factions[familyId];

  const fam = FAMILIES[familyId];
  const rel = state.familyRel[familyId] || 0;
  
  // === SERVER-AUTHORITATIVE: use mmoFaction for dead/conquered/phase ===
  const dead = mmoFaction?.boss_hp === 0 && mmoFaction?.status !== 'vassal';
  const conquered = mmoFaction?.status === 'vassal';
  const isMyVassal = conquered && mmoFaction?.conquered_by === currentUserId;
  const status = conquered
    ? { label: isMyVassal ? 'JOUW VAZAL' : 'VAZAL', color: 'text-gold' }
    : dead ? { label: 'VERSLAGEN', color: 'text-muted-foreground' }
    : getFactionStatus(rel);
  const perks = conquered ? [] : getFactionPerks(rel);
  const cooldowns = state.factionCooldowns[familyId] || [];
  const hasCooldown = cooldowns.length > 0;

  const relBarPct = Math.max(0, Math.min(100, (rel + 100) / 2));
  const relBarColor = conquered ? 'gold' : rel >= 50 ? 'emerald' : rel >= 0 ? 'gold' : 'blood';

  // === SERVER-AUTHORITATIVE: conquest phases from mmoFaction ===
  const serverPhase = mmoFaction?.conquest_phase || 'none';
  const serverPhaseIdx = ['none', 'defense', 'subboss', 'leader', 'conquered'].indexOf(serverPhase);
  const canConquer = false; // No longer local — server handles conquest via attack_faction
  const canAnnex = !dead && !conquered && rel >= 100 && state.money >= 50000;
  const canChallenge = !dead && !conquered && serverPhaseIdx >= 2 && state.loc === fam.home;
  const isInDistrict = state.loc === fam.home;

  // Conquest phase checks — now driven by server state
  const canAttackPhase = (phase: string) => {
    if (conquered || (ps.energy || 0) < 15 || (ps.nerve || 0) < 10) return false;
    if (phase === 'defense') return serverPhase === 'none' || serverPhase === 'defense';
    if (phase === 'subboss') return serverPhase === 'subboss';
    if (phase === 'leader') return serverPhase === 'leader';
    return false;
  };
  const ps = state; // alias for readability
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

  // Conquest now handled server-side via attack_faction phase=leader

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
    <>
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

      {/* Conquered banner with countdown */}
      {conquered && (
        <div className="mt-2 py-2 px-3 rounded bg-gold/10 border border-gold/20">
          <p className="text-[0.55rem] font-bold text-gold uppercase tracking-wider text-center">
            🏴 {isMyVassal ? 'Jouw Vazal' : `Vazal van ${usernameMap[mmoFaction?.conquered_by || ''] || 'iemand'}`}
          </p>
          <p className="text-[0.45rem] text-muted-foreground mt-0.5 text-center">
            {isMyVassal ? '+€1.000/dag passief inkomen | Marktkorting | Thuisdistrict bezit' : 'Veroverd door een andere speler — wacht op reset'}
          </p>
          {mmoFaction?.reset_at && (
            <div className="mt-1.5 flex justify-center">
              <CooldownTimer label="Reset" until={mmoFaction.reset_at} icon={<Timer size={7} />} />
            </div>
          )}
        </div>
      )}

      {/* MMO Boss HP Bar (when not conquered) */}
      {!conquered && mmoFaction && mmoFaction.boss_hp < mmoFaction.boss_max_hp && (
        <div className="mt-2 bg-muted/30 rounded p-2 border border-border/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[0.45rem] font-bold text-blood uppercase tracking-wider">
              <Skull size={8} className="inline mr-0.5" /> Boss HP
            </span>
            <span className="text-[0.5rem] font-bold">{mmoFaction.boss_hp}/{mmoFaction.boss_max_hp}</span>
          </div>
          <StatBar value={mmoFaction.boss_hp} max={mmoFaction.boss_max_hp} color="blood" height="sm" />
          {mmoFaction.total_damage_dealt && Object.keys(mmoFaction.total_damage_dealt).length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Users size={8} className="text-muted-foreground" />
              <span className="text-[0.4rem] text-muted-foreground">
                {Object.keys(mmoFaction.total_damage_dealt).length} spelers · {Object.keys(mmoFaction.gang_damage || {}).length} gangs
              </span>
            </div>
          )}
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
                    <span className="text-gold font-bold">Tijdelijke controle actief</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[0.5rem]">
                    <div className="bg-muted/50 rounded p-2 text-center">
                      <Banknote size={12} className="mx-auto text-gold mb-0.5" />
                      <span className="font-bold">+€1.000</span>
                      <p className="text-muted-foreground text-[0.4rem]">per dag (48h)</p>
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

                  {/* Damage Leaderboard */}
                  {mmoFaction?.total_damage_dealt && Object.keys(mmoFaction.total_damage_dealt).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Trophy size={10} className="text-gold" />
                        <span className="text-[0.45rem] font-bold uppercase tracking-wider text-gold">Top Aanvallers</span>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(mmoFaction.total_damage_dealt)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .slice(0, 5)
                          .map(([uid, dmg], i) => (
                            <div key={uid} className="flex items-center gap-2 text-[0.5rem]">
                              <span className={`w-4 text-center font-bold ${i === 0 ? 'text-gold' : i === 1 ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedPlayerId(uid); }}
                                className="flex-1 truncate text-left text-gold/80 hover:text-gold hover:underline transition-colors cursor-pointer"
                              >
                                {usernameMap[uid] || uid.slice(0, 8) + '...'}
                              </button>
                              <span className="font-bold">{dmg as number} dmg</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Gang Alliance Leaderboard */}
                  {mmoFaction?.gang_damage && Object.keys(mmoFaction.gang_damage).length > 0 && (
                    <GangDamageLeaderboard gangDamage={mmoFaction.gang_damage} totalDamage={Object.values(mmoFaction.total_damage_dealt || {}).reduce((a, b) => a + (b as number), 0)} />
                  )}
                </div>
              )}

              {/* Conquer now handled server-side */}

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

              {/* === MMO CONQUEST PROGRESS (server-driven) === */}
              {!conquered && mmoFaction && (
                <div className="mb-3">
                  {/* Phase progress bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={12} className="text-blood" />
                    <p className="text-[0.5rem] font-bold text-blood uppercase tracking-wider">
                      World Boss — Veroveringsfasen
                    </p>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {['defense', 'subboss', 'leader'].map((p, i) => (
                      <div key={p} className={`flex-1 h-1.5 rounded-full ${
                        serverPhaseIdx > i ? 'bg-blood' : serverPhase === p ? 'bg-blood/50 animate-pulse' : 'bg-muted'
                      }`} />
                    ))}
                  </div>

                  {/* Current active phase attack button */}
                  {serverPhase !== 'none' && serverPhase !== 'conquered' && (
                    <div className={`border rounded p-3 mb-2 ${isInDistrict ? 'bg-blood/5 border-blood/30' : 'bg-muted/30 border-border'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Swords size={14} className={isInDistrict ? 'text-blood' : 'text-muted-foreground'} />
                        <p className="text-xs font-bold">
                          {serverPhase === 'defense' ? 'Fase 1: Verdediging Aanvallen' :
                           serverPhase === 'subboss' ? 'Fase 2: Sub-Boss Bestormen' :
                           'Fase 3: Leider Uitdagen'}
                        </p>
                      </div>
                      <p className="text-[0.55rem] text-muted-foreground mb-2">
                        Boss HP: {mmoFaction.boss_hp}/{mmoFaction.boss_max_hp} — 
                        {Object.keys(mmoFaction.total_damage_dealt || {}).length} spelers vallen aan
                      </p>
                      <motion.button
                        onClick={async () => {
                          const res = await attackFaction(familyId, serverPhase);
                          if (res.success) {
                            showToast(res.message);
                          } else {
                            showToast(res.message, true);
                          }
                        }}
                        disabled={!isInDistrict || (ps.energy || 0) < 15 || (ps.nerve || 0) < 10}
                        className={`w-full py-2 rounded text-xs font-bold ${
                          isInDistrict && (ps.energy || 0) >= 15 && (ps.nerve || 0) >= 10
                            ? serverPhase === 'leader' ? 'bg-gradient-to-r from-blood to-gold text-primary-foreground' : 'bg-blood text-primary-foreground'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                        whileTap={isInDistrict ? { scale: 0.95 } : {}}
                      >
                        <Swords size={12} className="inline mr-1.5" />
                        {!isInDistrict ? `REIS NAAR ${DISTRICTS[fam.home].name.toUpperCase()}`
                          : (ps.energy || 0) < 15 ? 'TE WEINIG ENERGIE'
                          : (ps.nerve || 0) < 10 ? 'TE WEINIG LEF'
                          : `AANVALLEN (⚡15 💀10)`}
                      </motion.button>
                    </div>
                  )}

                  {/* Start first attack if phase is none */}
                  {serverPhase === 'none' && (
                    <div className={`border rounded p-3 mb-2 ${isInDistrict ? 'bg-blood/5 border-blood/30' : 'bg-muted/30 border-border'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldAlert size={14} className={isInDistrict ? 'text-blood' : 'text-muted-foreground'} />
                        <p className="text-xs font-bold">Start Aanval op {fam.name}</p>
                      </div>
                      <p className="text-[0.55rem] text-muted-foreground mb-2">
                        Val de verdediging aan samen met andere spelers. Boss HP schaalt met het aantal aanvallers.
                      </p>
                      <motion.button
                        onClick={async () => {
                          const res = await attackFaction(familyId, 'defense');
                          if (res.success) {
                            showToast(res.message);
                          } else {
                            showToast(res.message, true);
                          }
                        }}
                        disabled={!isInDistrict || (ps.energy || 0) < 15 || (ps.nerve || 0) < 10}
                        className={`w-full py-2 rounded text-xs font-bold ${
                          isInDistrict && (ps.energy || 0) >= 15 && (ps.nerve || 0) >= 10
                            ? 'bg-blood text-primary-foreground'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                        whileTap={isInDistrict ? { scale: 0.95 } : {}}
                      >
                        <Swords size={12} className="inline mr-1.5" />
                        {!isInDistrict ? `REIS NAAR ${DISTRICTS[fam.home].name.toUpperCase()}`
                          : `AANVAL STARTEN (⚡15 💀10)`}
                      </motion.button>
                    </div>
                  )}

                  {/* Gang Alliance during active combat */}
                  {mmoFaction?.gang_damage && Object.keys(mmoFaction.gang_damage).length > 0 && serverPhase !== 'none' && (
                    <GangDamageLeaderboard gangDamage={mmoFaction.gang_damage} totalDamage={Object.values(mmoFaction.total_damage_dealt || {}).reduce((a, b) => a + (b as number), 0)} />
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

    {selectedPlayerId && (
      <PlayerDetailPopup
        userId={selectedPlayerId}
        onClose={() => setSelectedPlayerId(null)}
      />
    )}
    </>
  );
}
