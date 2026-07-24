import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Users, Swords, TrendingUp, TrendingDown, Coins, Shield, ChevronUp, X, MapPin, Skull, Sparkles, Plus, Star, Briefcase, Zap, Clock } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { DISTRICTS } from '@/game/constants';
import { DistrictId } from '@/game/types';
import {
  ORG_FOUND_COST, ORG_FOUND_MIN_REP, ORG_UPGRADES,
  orgMaxMembers, orgPower, orgDailyIncome, orgDailyUpkeep, orgDailyRep,
  recruitCost, promoteCost, memberPower, memberUpkeep, nextRole, ROLE_LABEL,
  ORG_OPERATIONS, orgOperationSuccessChance, orgRank, nextOrgRank,
  orgRelation, ORG_PACT_MIN_RESPECT, orgPactCost, unlockedRankPerks, orgAllySupport,
} from '@/game/organization';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { StatBar } from './ui/StatBar';

function loyaltyColor(v: number): 'emerald' | 'gold' | 'blood' {
  return v >= 60 ? 'emerald' : v >= 30 ? 'gold' : 'blood';
}

export function OrganisatieView() {
  const { state, dispatch, showToast } = useGame();
  const org = state.org;

  const [name, setName] = useState('');
  const [tag, setTag] = useState('');

  if (!org) {
    const canFound = state.rep >= ORG_FOUND_MIN_REP && state.money >= ORG_FOUND_COST;
    return (
      <div className="space-y-3">
        <SectionHeader title="Eigen Organisatie" icon={<Crown size={12} />} />
        <div className="game-card text-center py-6 space-y-3">
          <Crown size={30} className="mx-auto text-gold opacity-70" />
          <div>
            <p className="text-sm font-bold text-foreground">Richt je eigen misdaadorganisatie op</p>
            <p className="text-[0.55rem] text-muted-foreground mt-1 max-w-[280px] mx-auto">
              Ronsel soldaten, betaal je loonlijst, koop upgrades en verover districten op de
              gangs van Noxhaven. Jouw naam op straat.
            </p>
          </div>
          <div className="space-y-2 max-w-[260px] mx-auto text-left">
            <div>
              <label className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">Naam</label>
              <input value={name} onChange={e => setName(e.target.value)} maxLength={28}
                placeholder="bijv. De Zwarte Hand"
                className="w-full bg-muted/30 border border-border rounded px-2 py-1.5 text-xs text-foreground" />
            </div>
            <div>
              <label className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">Tag (max 4)</label>
              <input value={tag} onChange={e => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))} maxLength={4}
                placeholder="ZH"
                className="w-full bg-muted/30 border border-border rounded px-2 py-1.5 text-xs text-foreground uppercase tracking-widest" />
            </div>
          </div>
          <div className="text-[0.55rem] space-y-0.5">
            <p className={state.money >= ORG_FOUND_COST ? 'text-emerald' : 'text-blood'}>
              Kosten: €{ORG_FOUND_COST.toLocaleString()} {state.money >= ORG_FOUND_COST ? '✓' : '✗'}
            </p>
            <p className={state.rep >= ORG_FOUND_MIN_REP ? 'text-emerald' : 'text-blood'}>
              Vereiste reputatie: {ORG_FOUND_MIN_REP} (jij: {state.rep}) {state.rep >= ORG_FOUND_MIN_REP ? '✓' : '✗'}
            </p>
          </div>
          <GameButton
            variant="gold" size="lg" glow={canFound && !!name.trim()}
            disabled={!canFound || !name.trim()}
            onClick={() => {
              dispatch({ type: 'FOUND_ORG', name: name.trim(), tag: tag.trim() });
              showToast(`Organisatie [${tag || 'ORG'}] ${name.trim()} opgericht!`);
            }}
          >
            <Crown size={12} /> Organisatie Oprichten
          </GameButton>
        </div>
      </div>
    );
  }

  return <OrgDashboard />;
}

function OrgDashboard() {
  const { state, dispatch, showToast } = useGame();
  const org = state.org!;
  const [confirmDisband, setConfirmDisband] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const opCooldownMs = org.opCooldownUntil ? new Date(org.opCooldownUntil).getTime() - now : 0;
  const onOpCooldown = opCooldownMs > 0;
  const rank = orgRank(org);
  const next = nextOrgRank(org);
  const rankProgress = next ? Math.min(100, Math.round(((org.respect - rank.minRespect) / (next.minRespect - rank.minRespect)) * 100)) : 100;
  const rankPerks = unlockedRankPerks(org);
  const pactCost = orgPactCost(org);

  const power = orgPower(org);
  const income = orgDailyIncome(org);
  const upkeep = orgDailyUpkeep(org);
  const net = income - upkeep;
  const repPerDay = orgDailyRep(org);
  const maxMembers = orgMaxMembers(org);
  const rCost = recruitCost(org, state.player.level);

  // Allies lend a share of their strength to your attacks and defence.
  const allies = useMemo(() =>
    (state.world?.gangs || []).filter(g => orgRelation(org, g.id) === 'ally'),
    [state.world?.gangs, org]);
  const allySupport = orgAllySupport(allies.map(g => g.power));

  // Rival gangs that still hold a district — your targets.
  const targets = useMemo(() =>
    (state.world?.gangs || [])
      .filter(g => g.controlledDistrict && !org.controlledDistricts.includes(g.controlledDistrict))
      .sort((a, b) => a.power - b.power),
    [state.world?.gangs, org.controlledDistricts]);

  return (
    <div className="space-y-3">
      {/* Header card */}
      <div className="game-card border-l-[3px] border-l-gold">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center flex-shrink-0">
              <Crown size={18} className="text-gold" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{org.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[0.5rem] font-bold text-gold bg-gold/10 px-1.5 rounded">[{org.tag}]</span>
                <span className="text-[0.5rem] font-bold text-ice bg-ice/10 px-1.5 rounded">{rank.name}</span>
              </div>
            </div>
          </div>
          <button onClick={() => setConfirmDisband(true)} className="text-muted-foreground hover:text-blood transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1.5 mt-3 text-center">
          <div className="bg-muted/20 rounded p-1.5">
            <Swords size={11} className="text-blood mx-auto" />
            <p className="text-xs font-bold text-foreground mt-0.5">{power}</p>
            <p className="text-[0.4rem] text-muted-foreground uppercase">Kracht</p>
          </div>
          <div className="bg-muted/20 rounded p-1.5">
            <Users size={11} className="text-ice mx-auto" />
            <p className="text-xs font-bold text-foreground mt-0.5">{org.members.length}/{maxMembers}</p>
            <p className="text-[0.4rem] text-muted-foreground uppercase">Leden</p>
          </div>
          <div className="bg-muted/20 rounded p-1.5">
            <MapPin size={11} className="text-emerald mx-auto" />
            <p className="text-xs font-bold text-foreground mt-0.5">{org.controlledDistricts.length}</p>
            <p className="text-[0.4rem] text-muted-foreground uppercase">Districten</p>
          </div>
          <div className="bg-muted/20 rounded p-1.5">
            <Sparkles size={11} className="text-gold mx-auto" />
            <p className="text-xs font-bold text-foreground mt-0.5">{org.respect}</p>
            <p className="text-[0.4rem] text-muted-foreground uppercase">Aanzien</p>
          </div>
        </div>
        {/* Daily balance */}
        <div className="flex items-center justify-between mt-2 text-[0.55rem] bg-muted/10 rounded px-2 py-1.5">
          <span className="text-emerald flex items-center gap-1"><Coins size={9} /> +€{income.toLocaleString()}</span>
          <span className="text-blood flex items-center gap-1"><TrendingDown size={9} /> -€{upkeep.toLocaleString()}</span>
          <span className={`font-bold flex items-center gap-1 ${net >= 0 ? 'text-emerald' : 'text-blood'}`}>
            {net >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />} netto €{net.toLocaleString()}/dag
          </span>
        </div>
        {repPerDay > 0 && (
          <div className="flex items-center justify-center gap-3 mt-1 text-[0.5rem] text-muted-foreground">
            <span className="flex items-center gap-1"><Star size={8} className="text-gold" /> +{repPerDay} rep/dag</span>
            <span className="flex items-center gap-1"><Sparkles size={8} className="text-emerald" /> +{org.controlledDistricts.length} loyaliteit/dag</span>
            <span className="text-muted-foreground/70">uit {org.controlledDistricts.length} district{org.controlledDistricts.length !== 1 ? 'en' : ''}</span>
          </div>
        )}
        {/* Rank progress */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-[0.45rem] text-muted-foreground mb-0.5">
            <span className="text-ice font-bold">{rank.name}</span>
            <span>{next ? `${org.respect}/${next.minRespect} aanzien → ${next.name}` : 'Max rang bereikt'}</span>
          </div>
          <StatBar value={rankProgress} max={100} color="ice" height="sm" />
          {rankPerks.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {rankPerks.map((p, i) => (
                <span key={i} className="text-[0.4rem] text-ice bg-ice/10 border border-ice/20 rounded px-1 py-0.5">✓ {p}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Roster */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <SectionHeader title={`Bemanning (${org.members.length}/${maxMembers})`} icon={<Users size={12} />} />
          <GameButton
            variant={org.members.length < maxMembers && state.money >= rCost ? 'purple' : 'muted'}
            size="sm"
            disabled={org.members.length >= maxMembers || state.money < rCost}
            onClick={() => {
              dispatch({ type: 'ORG_RECRUIT' });
              showToast('Nieuwe soldaat geronseld!');
            }}
          >
            <Plus size={10} /> Ronsel €{rCost.toLocaleString()}
          </GameButton>
        </div>
        {org.members.length === 0 ? (
          <div className="game-card text-center py-4 text-[0.55rem] text-muted-foreground">
            Nog geen soldaten. Ronsel je eerste soldaat om districten te kunnen aanvallen.
          </div>
        ) : (
          <div className="space-y-1.5">
            {org.members.map(m => {
              const target = nextRole(m.role);
              const pCost = promoteCost(m);
              return (
                <motion.div key={m.id} layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="game-card py-2">
                  <div className="flex items-center gap-2">
                    <Skull size={14} className="text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate">{m.name}</span>
                        <GameBadge variant={m.role === 'onderbaas' ? 'gold' : m.role === 'luitenant' ? 'ice' : 'muted'} size="xs">
                          {ROLE_LABEL[m.role]}
                        </GameBadge>
                        <span className="text-[0.45rem] text-muted-foreground">Lv.{m.level}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[0.45rem] text-muted-foreground w-8">Loyaal</span>
                        <StatBar value={m.loyalty} max={100} color={loyaltyColor(m.loyalty)} height="sm" />
                        <span className="text-[0.45rem] text-muted-foreground tabular-nums w-6">{m.loyalty}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[0.45rem] text-muted-foreground">
                        <span className="text-blood">⚔ {memberPower(m)}</span>
                        <span className="text-gold">€{memberUpkeep(m).toLocaleString()}/dag</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {target && (
                        <GameButton variant={state.money >= pCost ? 'gold' : 'muted'} size="sm"
                          disabled={state.money < pCost}
                          onClick={() => { dispatch({ type: 'ORG_PROMOTE', memberId: m.id }); showToast(`${m.name} gepromoveerd tot ${ROLE_LABEL[target]}.`); }}>
                          <ChevronUp size={9} /> €{(pCost / 1000).toFixed(0)}k
                        </GameButton>
                      )}
                      <GameButton variant="muted" size="sm"
                        onClick={() => { dispatch({ type: 'ORG_DISMISS', memberId: m.id }); showToast(`${m.name} ontslagen.`); }}>
                        <X size={9} />
                      </GameButton>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Crew operations */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <SectionHeader title="Crew Operaties" icon={<Briefcase size={12} />} />
          {onOpCooldown && (
            <span className="text-[0.5rem] text-blood flex items-center gap-1">
              <Clock size={9} /> {Math.ceil(opCooldownMs / 1000)}s
            </span>
          )}
        </div>
        {org.members.length === 0 ? (
          <div className="game-card text-center py-3 text-[0.55rem] text-muted-foreground">
            Ronsel eerst soldaten om ze op klussen te sturen.
          </div>
        ) : (
          <div className="space-y-1.5">
            {ORG_OPERATIONS.map(op => {
              const locked = org.respect < op.minRespect;
              const chance = Math.round(orgOperationSuccessChance(power, op) * 100);
              const canRun = !locked && !onOpCooldown && state.energy >= op.energyCost && org.members.length > 0;
              return (
                <div key={op.id} className={`game-card py-2 flex items-center gap-2 ${locked ? 'opacity-60' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold">{op.name}</p>
                    <p className="text-[0.45rem] text-muted-foreground">{op.desc}</p>
                    {locked ? (
                      <p className="text-[0.45rem] text-blood mt-0.5">🔒 Ontgrendelt bij {op.minRespect} aanzien</p>
                    ) : (
                      <div className="flex items-center gap-2 mt-0.5 text-[0.45rem]">
                        <span className="text-gold">💰 €{op.baseReward.toLocaleString()}</span>
                        <span className="text-ice">⭐ +{op.repReward}</span>
                        <span className="flex items-center gap-0.5 text-muted-foreground"><Zap size={7} className="text-gold" />{op.energyCost}</span>
                        <span className={chance >= 60 ? 'text-emerald' : chance >= 35 ? 'text-gold' : 'text-blood'}>{chance}% kans</span>
                      </div>
                    )}
                  </div>
                  <GameButton
                    variant={canRun ? 'gold' : 'muted'} size="sm" disabled={!canRun}
                    onClick={() => { dispatch({ type: 'ORG_RUN_OPERATION', operationId: op.id }); showToast(`${op.name} gestart...`); }}
                  >
                    {locked ? '🔒' : 'Stuur'}
                  </GameButton>
                </div>
              );
            })}
            {state.energy < ORG_OPERATIONS[0].energyCost && !onOpCooldown && (
              <p className="text-[0.45rem] text-blood text-center">Te weinig energy voor operaties.</p>
            )}
          </div>
        )}
      </div>

      {/* Territory */}
      <div>
        <SectionHeader title="Territorium" icon={<MapPin size={12} />} badge={`${org.controlledDistricts.length} bezit`} badgeColor="emerald" />
        {org.controlledDistricts.length > 0 && (
          <div className="flex flex-wrap gap-1 my-1.5">
            {org.controlledDistricts.map(d => (
              <span key={d} className="text-[0.5rem] font-bold text-emerald bg-emerald/10 border border-emerald/20 rounded px-1.5 py-0.5">
                🏴 {DISTRICTS[d]?.name || d}
              </span>
            ))}
          </div>
        )}
        {allySupport > 0 && (
          <div className="flex items-center gap-1.5 my-1.5 rounded-md bg-emerald/10 border border-emerald/20 px-2 py-1">
            <Shield size={11} className="text-emerald shrink-0" />
            <span className="text-[0.5rem] text-emerald leading-snug">
              {allies.length} bondgeno{allies.length === 1 ? 'ot' : 'ten'} steun{allies.length === 1 ? 't' : 'en'} je met <span className="font-bold">+{allySupport} kracht</span> bij aanval én verdediging.
            </span>
          </div>
        )}
        <p className="text-[0.5rem] text-muted-foreground mb-1.5">Val een rivaliserende gang aan om hun district te veroveren:</p>
        {targets.length === 0 ? (
          <div className="game-card text-center py-4 text-[0.55rem] text-muted-foreground">
            Geen gangs met districten om aan te vallen op dit moment.
          </div>
        ) : (
          <div className="space-y-1.5">
            {targets.map(g => {
              // Allies (other than this target) fight alongside you.
              const support = orgAllySupport(allies.filter(a => a.id !== g.id).map(a => a.power));
              const atkPow = power + support;
              const total = atkPow + g.power;
              const chance = total > 0 ? Math.max(5, Math.min(95, Math.round((atkPow / total) * 110 - 10))) : 50;
              const canAttack = org.members.length > 0;
              const rel = orgRelation(org, g.id);
              const canPact = org.respect >= ORG_PACT_MIN_RESPECT && state.money >= pactCost;
              return (
                <div key={g.id} className="game-card py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate">[{g.tag}] {g.name}</span>
                        {rel === 'ally' && <GameBadge variant="emerald" size="xs">🤝 Bondgenoot</GameBadge>}
                        {rel === 'enemy' && <GameBadge variant="blood" size="xs">⚔️ Vete</GameBadge>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[0.45rem]">
                        <span className="text-emerald">🏴 {DISTRICTS[g.controlledDistrict!]?.name || g.controlledDistrict}</span>
                        <span className="text-blood">⚔ {g.power}</span>
                        <span className={chance >= 55 ? 'text-emerald' : chance >= 35 ? 'text-gold' : 'text-blood'}>
                          {chance}% kans
                        </span>
                      </div>
                    </div>
                    <GameButton variant={canAttack ? 'blood' : 'muted'} size="sm" disabled={!canAttack}
                      onClick={() => { dispatch({ type: 'ORG_ATTACK_DISTRICT', gangId: g.id }); }}>
                      <Swords size={10} /> {rel === 'ally' ? 'Verraad' : 'Aanval'}
                    </GameButton>
                  </div>
                  {/* Diplomacy controls */}
                  <div className="flex gap-1 mt-1.5">
                    {rel === 'neutral' && (
                      <>
                        <GameButton variant={canPact ? 'emerald' : 'muted'} size="sm" disabled={!canPact}
                          onClick={() => { dispatch({ type: 'ORG_SET_RELATION', gangId: g.id, relation: 'ally' }); showToast(`Pact gesloten met ${g.name}.`); }}>
                          🤝 Pact €{(pactCost / 1000).toFixed(0)}k
                        </GameButton>
                        <GameButton variant="muted" size="sm"
                          onClick={() => { dispatch({ type: 'ORG_SET_RELATION', gangId: g.id, relation: 'enemy' }); showToast(`Vete verklaard aan ${g.name}.`, true); }}>
                          ⚔️ Vete
                        </GameButton>
                      </>
                    )}
                    {rel === 'ally' && (
                      <GameButton variant="muted" size="sm"
                        onClick={() => { dispatch({ type: 'ORG_SET_RELATION', gangId: g.id, relation: 'neutral' }); showToast(`Pact met ${g.name} beëindigd.`); }}>
                        Pact beëindigen
                      </GameButton>
                    )}
                    {rel === 'enemy' && (
                      <GameButton variant="muted" size="sm"
                        onClick={() => { dispatch({ type: 'ORG_SET_RELATION', gangId: g.id, relation: 'neutral' }); showToast(`Vrede gesloten met ${g.name}.`); }}>
                        Vrede sluiten
                      </GameButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upgrades */}
      <div>
        <SectionHeader title="Upgrades" icon={<Shield size={12} />} />
        <div className="space-y-1.5">
          {ORG_UPGRADES.map(u => {
            const owned = org.upgrades.includes(u.id);
            return (
              <div key={u.id} className={`game-card py-2 flex items-center gap-2 ${owned ? 'opacity-60' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">{u.name}</p>
                  <p className="text-[0.45rem] text-muted-foreground">{u.desc}</p>
                </div>
                {owned ? (
                  <GameBadge variant="emerald" size="xs">In bezit</GameBadge>
                ) : (
                  <GameButton variant={state.money >= u.cost ? 'gold' : 'muted'} size="sm"
                    disabled={state.money < u.cost}
                    onClick={() => { dispatch({ type: 'ORG_BUY_UPGRADE', upgradeId: u.id }); showToast(`${u.name} gekocht!`); }}>
                    €{(u.cost / 1000).toFixed(0)}k
                  </GameButton>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Disband confirm */}
      <AnimatePresence>
        {confirmDisband && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9000] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmDisband(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="game-card max-w-[300px] w-full text-center"
              onClick={e => e.stopPropagation()}>
              <p className="text-sm font-bold text-blood mb-1">Organisatie opheffen?</p>
              <p className="text-[0.55rem] text-muted-foreground mb-3">Je verliest al je soldaten, districten en upgrades. Dit kan niet ongedaan worden gemaakt.</p>
              <div className="flex gap-2">
                <GameButton variant="muted" size="sm" className="flex-1" onClick={() => setConfirmDisband(false)}>Annuleer</GameButton>
                <GameButton variant="blood" size="sm" className="flex-1"
                  onClick={() => { dispatch({ type: 'ORG_DISBAND' }); setConfirmDisband(false); showToast('Organisatie opgeheven.', true); }}>
                  Opheffen
                </GameButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
