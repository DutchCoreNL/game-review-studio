import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, TrendingUp, TrendingDown, Flame, Shield, Users, ArrowRight, AlertTriangle } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import {
  orgDailyUpkeep, orgRank, nextOrgRank, ROLE_LABEL, memberPower, type RacketId,
} from '@/game/organization';
import {
  RACKETS, resolveRacketTick, racketMemberCount, idleMembers,
  afpersingIncome, territoriumRespect, witwassenCooling,
} from '@/game/rackets';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { StatBar } from './ui/StatBar';
import { GameBadge } from './ui/GameBadge';

const ACCENT_TEXT: Record<string, string> = {
  gold: 'text-gold', blood: 'text-blood', emerald: 'text-emerald', purple: 'text-game-purple',
};
const ACCENT_BORDER: Record<string, string> = {
  gold: 'border-gold/40', blood: 'border-blood/40', emerald: 'border-emerald/40', purple: 'border-game-purple/40',
};
const ACCENT_BG: Record<string, string> = {
  gold: 'bg-gold/10', blood: 'bg-blood/10', emerald: 'bg-emerald/10', purple: 'bg-game-purple/10',
};

function loyaltyColor(v: number): 'emerald' | 'gold' | 'blood' {
  return v >= 60 ? 'emerald' : v >= 30 ? 'gold' : 'blood';
}

/** Per-day output preview for a single member on a given racket. */
function memberPreview(racket: RacketId, m: { level: number; loyalty: number; role: any }): string {
  const full = { ...m, id: '', name: '', assignment: null } as any;
  switch (racket) {
    case 'afpersing': return `+€${afpersingIncome(full).toLocaleString()}`;
    case 'territorium': return `+${territoriumRespect(full)} aanzien`;
    case 'witwassen': return `−${witwassenCooling(full)} hitte`;
    case 'werving': return `+moraal`;
  }
}

export function ImperiumDashboard() {
  const { state, dispatch, setView } = useGame();
  const org = state.org;

  const tick = useMemo(() => resolveRacketTick(org), [org]);
  const upkeep = org ? orgDailyUpkeep(org) : 0;
  const netMoney = tick.money - upkeep;
  const heat = Math.round(state.personalHeat || 0);
  const raidRisk = heat >= 80;

  // ---- No organisation yet: point to the founding screen ----
  if (!org) {
    return (
      <div className="space-y-3">
        <SectionHeader title="Jouw Imperium" icon={<Crown size={12} />} />
        <div className="game-card text-center py-8 space-y-3">
          <div className="text-4xl">🏙️</div>
          <h3 className="font-display text-lg text-gold uppercase tracking-wider">Bouw je imperium</h3>
          <p className="text-[0.6rem] text-muted-foreground max-w-[16rem] mx-auto leading-relaxed">
            Richt je organisatie op en zet je crew aan het werk. Vanaf dat moment draait het
            imperium vanzelf door — dag en nacht, ook als je weg bent.
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
  const reserve = idleMembers(org);

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
            <span className="text-[0.5rem] text-muted-foreground">{org.members.length} leden · {org.controlledDistricts.length} turf</span>
          </div>
        </div>
        <Crown size={22} className="text-gold shrink-0" />
      </div>

      {/* ═══ THREE EMPIRE METERS ═══ */}
      <div className="grid grid-cols-3 gap-2">
        {/* Money / day */}
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

        {/* Heat */}
        <div className={`game-card p-2.5 text-center ${raidRisk ? 'border border-blood/50' : ''}`}>
          <div className="flex items-center justify-center gap-1 text-[0.5rem] text-muted-foreground uppercase tracking-wider mb-1">
            <Flame size={10} className={raidRisk ? 'text-blood animate-pulse' : 'text-gold'} /> Hitte
          </div>
          <div className={`text-sm font-bold ${raidRisk ? 'text-blood' : heat >= 50 ? 'text-gold' : 'text-emerald'}`}>{heat}</div>
          <div className="mt-1"><StatBar value={heat} max={100} color={raidRisk ? 'blood' : heat >= 50 ? 'gold' : 'emerald'} height="sm" /></div>
        </div>

        {/* Respect */}
        <div className="game-card p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[0.5rem] text-muted-foreground uppercase tracking-wider mb-1">
            <Crown size={10} className="text-gold" /> Aanzien
          </div>
          <div className="text-sm font-bold text-gold">{org.respect}</div>
          <div className="mt-1"><StatBar value={rankProgress} max={100} color="gold" height="sm" /></div>
        </div>
      </div>

      {/* Heat warning */}
      {raidRisk && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-blood/10 border border-blood/30 px-3 py-2">
          <AlertTriangle size={14} className="text-blood shrink-0" />
          <span className="text-[0.55rem] text-blood leading-snug">
            De hitte loopt gevaarlijk op — zet crew op <b>Witwassen</b> of koop de politie om, anders volgt een inval.
          </span>
        </motion.div>
      )}

      {/* ═══ RACKET ALLOCATION ═══ */}
      <div>
        <SectionHeader title="Rackets" icon={<Users size={12} />} badge={`${org.members.length - reserve.length}/${org.members.length} actief`} badgeColor="emerald" />
        <div className="grid grid-cols-2 gap-2">
          {RACKETS.map(r => {
            const count = racketMemberCount(org, r.id);
            const outputLine =
              r.id === 'afpersing' ? (tick.counts.afpersing > 0 ? `+€${tick.money.toLocaleString()}/dag` : 'geen inkomen')
              : r.id === 'territorium' ? (tick.counts.territorium > 0 ? `+${tick.respect} aanzien/dag` : 'geen expansie')
              : r.id === 'witwassen' ? (count > 0 ? 'koelt hitte af' : 'geen witwas')
              : (count > 0 ? '+crew-moraal' : 'geen werving');
            return (
              <div key={r.id} className={`game-card p-2.5 border ${count > 0 ? ACCENT_BORDER[r.accent] : 'border-border/40'} ${count > 0 ? ACCENT_BG[r.accent] : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="text-lg">{r.icon}</span>
                  <span className={`text-sm font-bold ${count > 0 ? ACCENT_TEXT[r.accent] : 'text-muted-foreground'}`}>{count}</span>
                </div>
                <div className={`text-[0.6rem] font-bold mt-1 ${count > 0 ? ACCENT_TEXT[r.accent] : 'text-foreground'}`}>{r.name}</div>
                <div className="text-[0.45rem] text-muted-foreground leading-tight mt-0.5">{outputLine}</div>
                {reserve.length > 0 && (
                  <button
                    onClick={() => dispatch({ type: 'ORG_ASSIGN_RACKET', memberId: reserve[0].id, racket: r.id })}
                    className={`mt-1.5 w-full text-[0.45rem] font-bold py-1 rounded border ${ACCENT_BORDER[r.accent]} ${ACCENT_TEXT[r.accent]} hover:${ACCENT_BG[r.accent]}`}>
                    + reserve inzetten
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ CREW ROSTER — assign each member ═══ */}
      <div>
        <SectionHeader title="Crew" icon={<Users size={12} />}
          badge={reserve.length > 0 ? `${reserve.length} in reserve` : 'volledig ingezet'} badgeColor={reserve.length > 0 ? 'gold' : 'emerald'} />
        <div className="space-y-1.5">
          {org.members.map(m => (
            <div key={m.id} className="game-card py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[0.65rem] font-bold truncate">{m.name}</span>
                    <span className="text-[0.4rem] text-muted-foreground uppercase">{ROLE_LABEL[m.role]}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex-1 max-w-[70px]"><StatBar value={m.loyalty} max={100} color={loyaltyColor(m.loyalty)} height="sm" /></div>
                    <span className="text-[0.4rem] text-muted-foreground">Lvl {m.level} · ⚔{memberPower(m)}</span>
                    {m.assignment && (
                      <span className="text-[0.4rem] text-muted-foreground ml-auto">{memberPreview(m.assignment, m)}</span>
                    )}
                  </div>
                </div>
                {/* Racket toggle buttons */}
                <div className="flex gap-1 shrink-0">
                  {RACKETS.map(r => {
                    const active = m.assignment === r.id;
                    return (
                      <button
                        key={r.id}
                        title={r.name}
                        onClick={() => dispatch({ type: 'ORG_ASSIGN_RACKET', memberId: m.id, racket: active ? null : r.id })}
                        className={`w-7 h-7 rounded flex items-center justify-center text-sm border transition-all ${
                          active ? `${ACCENT_BORDER[r.accent]} ${ACCENT_BG[r.accent]}` : 'border-border/40 opacity-40 hover:opacity-80'
                        }`}>
                        {r.icon}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          {org.members.length === 0 && (
            <div className="game-card text-center py-4 text-[0.55rem] text-muted-foreground">
              Geen crew. Ronsel soldaten in de <button className="text-gold underline" onClick={() => setView('gang')}>Organisatie</button>.
            </div>
          )}
        </div>

        {/* Quick assign-all */}
        {org.members.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {RACKETS.map(r => (
              <button key={r.id}
                onClick={() => dispatch({ type: 'ORG_ASSIGN_ALL', racket: r.id })}
                className={`text-[0.45rem] font-bold px-2 py-1 rounded border ${ACCENT_BORDER[r.accent]} ${ACCENT_TEXT[r.accent]}`}>
                Iedereen → {r.short}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Deep management link */}
      <GameButton variant="ghost" size="sm" fullWidth onClick={() => setView('gang')}>
        Organisatie beheren (ronselen, territorium, diplomatie) <ArrowRight size={12} />
      </GameButton>
    </div>
  );
}
