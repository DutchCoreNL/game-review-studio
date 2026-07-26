import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, TrendingUp, TrendingDown, Flame, Users, ArrowRight, AlertTriangle, Radio, Eye, BedDouble, Bandage } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { DISTRICTS } from '@/game/constants';
import { DISTRICT_IMAGES } from '@/assets/items';
import type { DistrictId } from '@/game/types';
import { orgDailyUpkeep, orgRank, nextOrgRank, ROLE_LABEL, type OrgMember } from '@/game/organization';
import {
  RACKETS, RACKET_BY_ID, resolveRacketTick, racketsInDistrict, membersOnRacket,
  restingMembers, memberIncome, TRAIT_BY_ID, DISTRICT_OWNER, traitFit,
} from '@/game/rackets';
import { autoFenceActive, autoFenceIncome } from '@/game/tradeNetwork';
import { canRetire, computeLegacyGain } from '@/game/legacy';
import { ATTENTION_INCIDENT_THRESHOLD } from '@/game/incidents';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { StatBar } from './ui/StatBar';
import { GameBadge } from './ui/GameBadge';

const FACTION_LABEL: Record<string, string> = {
  cartel: 'Rojo Cartel', syndicate: 'Blue Lotus', bikers: 'Iron Skulls',
};

const DISTRICT_ORDER: DistrictId[] = ['low', 'port', 'iron', 'neon', 'crown'] as DistrictId[];

function loyaltyColor(v: number): 'emerald' | 'gold' | 'blood' {
  return v >= 60 ? 'emerald' : v >= 30 ? 'gold' : 'blood';
}

/** One district card: its rackets, who works them, and how hot the owner is getting. */
function DistrictCard({ district, expanded, onToggle }: {
  district: DistrictId; expanded: boolean; onToggle: () => void;
}) {
  const { state, dispatch } = useGame();
  const org = state.org!;
  const info = DISTRICTS[district];
  const rackets = racketsInDistrict(district);
  const owner = DISTRICT_OWNER[district];
  const attention = state.districtAttention?.[district] || 0;
  const workers = org.members.filter(m => m.assignment && RACKET_BY_ID[m.assignment]?.district === district);
  const income = workers.reduce((s, m) => s + memberIncome(m, RACKET_BY_ID[m.assignment!]), 0);
  const resting = restingMembers(org).filter(m => !m.injuredUntilDay);
  const alarmed = attention >= ATTENTION_INCIDENT_THRESHOLD;

  return (
    <div className={`game-card p-0 overflow-hidden relative ${alarmed ? 'border border-blood/40' : ''}`}>
      {/* The district itself, behind the numbers. Five plain rows of text read as a
          spreadsheet; the same rows over Port Nero and Crown Heights read as a city. */}
      <div className="absolute inset-0 pointer-events-none">
        <img src={DISTRICT_IMAGES[district]} alt="" className="w-full h-full object-cover opacity-[0.18]" />
        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/85 to-card/40" />
        {/* Working a district makes it glow; an alarmed one bleeds red at the edge. */}
        {workers.length > 0 && (
          <motion.div
            className="absolute inset-y-0 left-0 w-1"
            style={{ background: alarmed ? 'hsl(var(--blood))' : 'hsl(var(--emerald))' }}
            initial={{ opacity: 0.35 }}
            animate={{ opacity: [0.35, 0.9, 0.35] }}
            transition={{ duration: alarmed ? 1.1 : 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>
      <button onClick={onToggle} className="relative w-full text-left p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground truncate">{info?.name || district}</span>
              {owner && <span className="text-[0.4rem] text-muted-foreground uppercase tracking-wide">{FACTION_LABEL[owner]}</span>}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[0.45rem]">
              <span className="text-emerald">👥 {workers.length} aan het werk</span>
              {income > 0 && <span className="text-gold">+€{income.toLocaleString()}/dag</span>}
            </div>
          </div>
          <div className="shrink-0 w-14">
            <div className="flex items-center justify-end gap-1 text-[0.4rem] mb-0.5">
              <Eye size={8} className={alarmed ? 'text-blood' : 'text-muted-foreground'} />
              <span className={alarmed ? 'text-blood font-bold' : 'text-muted-foreground'}>{Math.round(attention)}</span>
            </div>
            <StatBar value={attention} max={100} color={alarmed ? 'blood' : attention > 30 ? 'gold' : 'emerald'} height="sm" />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="relative border-t border-border/40 bg-card/70 backdrop-blur-sm">
            <div className="p-2.5 space-y-2">
              {rackets.map(r => {
                const locked = org.respect < r.minRespect;
                const on = membersOnRacket(org, r.id);
                return (
                  <div key={r.id} className={`rounded-lg border p-2 ${locked ? 'border-border/30 opacity-50' : 'border-border/60'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{r.icon}</span>
                          <span className="text-[0.6rem] font-bold">{r.name}</span>
                          {on.length > 0 && <GameBadge variant="emerald" size="xs">{on.length}</GameBadge>}
                        </div>
                        <p className="text-[0.45rem] text-muted-foreground leading-snug mt-0.5">{r.flavor}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1 text-[0.4rem]">
                          {r.income > 0 && <span className="text-gold">€{r.income.toLocaleString()}/man</span>}
                          {r.heat > 0 && <span className="text-blood">🔥+{r.heat}</span>}
                          {r.heat < 0 && <span className="text-emerald">🧼{r.heat}</span>}
                          {r.attention > 0 && <span className="text-muted-foreground">👁+{r.attention}</span>}
                          {r.respect > 0 && <span className="text-gold">👑+{r.respect}</span>}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col gap-1">
                        {locked ? (
                          <span className="text-[0.4rem] text-muted-foreground">🔒 {r.minRespect} aanzien</span>
                        ) : (
                          <>
                            <button
                              disabled={resting.length === 0}
                              onClick={() => resting[0] && dispatch({ type: 'ORG_ASSIGN_RACKET', memberId: resting[0].id, racket: r.id })}
                              className={`text-[0.45rem] font-bold px-2 py-1 rounded border ${
                                resting.length > 0 ? 'border-emerald/50 text-emerald' : 'border-border/40 text-muted-foreground opacity-50'
                              }`}>
                              + inzetten
                            </button>
                            {on.length > 0 && (
                              <button
                                onClick={() => dispatch({ type: 'ORG_ASSIGN_RACKET', memberId: on[0].id, racket: null })}
                                className="text-[0.45rem] font-bold px-2 py-1 rounded border border-border/50 text-muted-foreground">
                                − terugtrekken
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {on.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-border/30">
                        {on.map(m => (
                          <span key={m.id} className="text-[0.4rem] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">
                            {m.trait ? TRAIT_BY_ID[m.trait].icon : '•'} {m.name}
                            {traitFit(m, r.kind) > 1 && <span className="text-emerald"> ↑</span>}
                            {traitFit(m, r.kind) < 1 && <span className="text-blood"> ↓</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CrewRow({ m }: { m: OrgMember }) {
  const trait = m.trait ? TRAIT_BY_ID[m.trait] : null;
  const def = m.assignment ? RACKET_BY_ID[m.assignment] : null;
  const injured = !!m.injuredUntilDay;
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0">
      <span className="text-sm shrink-0" title={trait?.desc}>{injured ? '🤕' : trait?.icon || '•'}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[0.6rem] font-bold truncate">{m.name}</span>
          <span className="text-[0.4rem] text-muted-foreground uppercase">{ROLE_LABEL[m.role]}</span>
          {trait && <span className="text-[0.4rem] text-game-purple">{trait.name}</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="w-14"><StatBar value={m.loyalty} max={100} color={loyaltyColor(m.loyalty)} height="sm" /></div>
          <span className="text-[0.4rem] text-muted-foreground">
            {injured ? <span className="text-blood">gewond</span>
              : def ? <>{def.icon} {def.name}</>
              : <span className="text-muted-foreground">rust · +loyaliteit</span>}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ImperiumDashboard() {
  const { state, dispatch, setView } = useGame();
  const org = state.org;
  const [openDistrict, setOpenDistrict] = useState<DistrictId | null>(null);

  const tick = useMemo(() => resolveRacketTick(org), [org]);
  const upkeep = org ? orgDailyUpkeep(org) : 0;
  const fenceIncome = autoFenceActive(state) ? autoFenceIncome(state) : 0;
  const netMoney = tick.money - upkeep + fenceIncome;
  const heat = Math.round(state.personalHeat || 0);
  const raidRisk = heat >= 65;

  if (!org) {
    return (
      <div className="space-y-3">
        <SectionHeader title="Jouw Imperium" icon={<Crown size={12} />} />
        <div className="game-card text-center py-8 space-y-3">
          <div className="text-4xl">🏙️</div>
          <h3 className="font-display text-lg text-gold uppercase tracking-wider">Bouw je imperium</h3>
          <p className="text-[0.6rem] text-muted-foreground max-w-[16rem] mx-auto leading-relaxed">
            Richt je organisatie op en zet je crew aan het werk in de districten van Noxhaven.
            Vanaf dat moment draait alles door — ook als je weg bent.
          </p>
          <GameButton variant="gold" size="lg" glow onClick={() => setView('gang')}>
            Organisatie oprichten <ArrowRight size={14} />
          </GameButton>
        </div>
      </div>
    );
  }

  const rank = orgRank(org);
  const next = nextOrgRank(org);
  const rankProgress = next
    ? Math.min(100, Math.round(((org.respect - rank.minRespect) / (next.minRespect - rank.minRespect)) * 100))
    : 100;
  const resting = restingMembers(org);
  const injured = org.members.filter(m => m.injuredUntilDay);

  return (
    <div className="space-y-3">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-base text-foreground uppercase tracking-wide truncate">
            [{org.tag}] {org.name}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <GameBadge variant="gold" size="xs">{rank.name}</GameBadge>
            <span className="text-[0.5rem] text-muted-foreground">{org.members.length} leden · {tick.activeCount} aan het werk</span>
          </div>
        </div>
        <Crown size={22} className="text-gold shrink-0" />
      </div>

      {/* ═══ METERS ═══ */}
      <div className="grid grid-cols-3 gap-2">
        <div className="game-card p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[0.5rem] text-muted-foreground uppercase tracking-wider mb-1">
            {netMoney >= 0 ? <TrendingUp size={10} className="text-emerald" /> : <TrendingDown size={10} className="text-blood" />}
            Per dag
          </div>
          <div className={`text-sm font-bold ${netMoney >= 0 ? 'text-emerald' : 'text-blood'}`}>
            {netMoney >= 0 ? '+' : '−'}€{Math.abs(netMoney).toLocaleString()}
          </div>
          <div className="text-[0.45rem] text-muted-foreground mt-0.5">€{Math.round(state.money).toLocaleString()} kas</div>
        </div>
        <div className={`game-card p-2.5 text-center ${raidRisk ? 'border border-blood/50' : ''}`}>
          <div className="flex items-center justify-center gap-1 text-[0.5rem] text-muted-foreground uppercase tracking-wider mb-1">
            <Flame size={10} className={raidRisk ? 'text-blood animate-pulse' : 'text-gold'} /> Hitte
          </div>
          <div className={`text-sm font-bold ${raidRisk ? 'text-blood' : heat >= 40 ? 'text-gold' : 'text-emerald'}`}>{heat}</div>
          <div className="mt-1"><StatBar value={heat} max={100} color={raidRisk ? 'blood' : heat >= 40 ? 'gold' : 'emerald'} height="sm" /></div>
        </div>
        <div className="game-card p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[0.5rem] text-muted-foreground uppercase tracking-wider mb-1">
            <Crown size={10} className="text-gold" /> Aanzien
          </div>
          <div className="text-sm font-bold text-gold">{org.respect}</div>
          <div className="mt-1"><StatBar value={rankProgress} max={100} color="gold" height="sm" /></div>
        </div>
      </div>

      {raidRisk && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-blood/10 border border-blood/30 px-3 py-2">
          <AlertTriangle size={14} className="text-blood shrink-0" />
          <span className="text-[0.55rem] text-blood leading-snug">
            De politie zit dicht op je. Zet mensen op <b>Witwasserij</b> (Neon Strip) om af te koelen.
          </span>
        </motion.div>
      )}

      {canRetire(state) && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setView('opvolger')}
          className="w-full flex items-center gap-2 rounded-lg bg-gold/10 border border-gold/30 px-3 py-2 text-left">
          <Crown size={14} className="text-gold shrink-0" />
          <span className="text-[0.55rem] text-gold leading-snug flex-1">
            Je imperium is groot genoeg om door te geven — <b>+{computeLegacyGain(state)} erfenis</b>.
          </span>
          <ArrowRight size={12} className="text-gold shrink-0" />
        </motion.button>
      )}

      {/* ═══ DISTRICTS — where the work happens ═══ */}
      <div>
        <SectionHeader title="Districten" icon={<Radio size={12} />}
          badge={resting.length > 0 ? `${resting.length} vrij` : 'iedereen bezig'}
          badgeColor={resting.length > 0 ? 'gold' : 'emerald'} />
        <div className="space-y-1.5">
          {DISTRICT_ORDER.map(d => (
            <DistrictCard key={d} district={d} expanded={openDistrict === d}
              onToggle={() => setOpenDistrict(openDistrict === d ? null : d)} />
          ))}
        </div>
      </div>

      {/* ═══ CREW ═══ */}
      <div>
        <SectionHeader title="Crew" icon={<Users size={12} />}
          badge={injured.length > 0 ? `${injured.length} gewond` : `${org.members.length} man`}
          badgeColor={injured.length > 0 ? 'blood' : 'emerald'} />
        <div className="game-card py-1 px-2.5">
          {org.members.map(m => <CrewRow key={m.id} m={m} />)}
          {org.members.length === 0 && (
            <div className="text-center py-3 text-[0.55rem] text-muted-foreground">
              Geen crew. Ronsel mensen in de <button className="text-gold underline" onClick={() => setView('gang')}>Organisatie</button>.
            </div>
          )}
        </div>
        {resting.length > 0 && (
          <p className="text-[0.45rem] text-muted-foreground mt-1 flex items-center gap-1">
            <BedDouble size={9} /> Rustende crew wint elke dag loyaliteit terug.
          </p>
        )}
      </div>

      <GameButton variant="ghost" size="sm" fullWidth onClick={() => setView('gang')}>
        Organisatie beheren (ronselen, upgrades, diplomatie) <ArrowRight size={12} />
      </GameButton>
    </div>
  );
}
