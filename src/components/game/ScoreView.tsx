import { useEffect, useMemo } from 'react';
import { Lock, Droplets, Package } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, GOODS } from '@/game/constants';
import { DISTRICT_IMAGES, GOOD_IMAGES } from '@/assets/items';
import type { DistrictId, GoodId } from '@/game/types';
import {
  tapPower, crewWorkPerSecond, districtUnlocked, crewStrength, stashCapacity,
  DISTRICT_CREW_REQUIREMENT,
} from '@/game/score';
import { RACKET_BY_ID } from '@/game/rackets';
import { JobScene } from './score/JobScene';
import { LootBurst } from './score/LootBurst';
import { LockedUpPanel } from './score/LockedUpPanel';
import { GameButton } from './ui/GameButton';
import { playCoinSound } from '@/game/sounds';

const DISTRICT_ORDER: DistrictId[] = ['low', 'port', 'iron', 'neon', 'crown'] as DistrictId[];
const GOOD_NAME: Record<string, string> = GOODS.reduce((a, g) => { a[g.id] = g.name; return a; }, {} as Record<string, string>);

export function ScoreView() {
  const { state, dispatch, showToast, setView } = useGame();
  const job = state.activeJob;
  const reward = state.lastJobReward;

  // Clear the loot burst after it has been seen.
  useEffect(() => {
    if (!reward) return;
    playCoinSound();
    const t = setTimeout(() => dispatch({ type: 'SCORE_CLEAR_REWARD' }), 2600);
    return () => clearTimeout(t);
  }, [reward, dispatch]);

  const strength = crewStrength(state);
  const crewRate = job ? crewWorkPerSecond(state, job.district) : 0;
  const power = tapPower(state);

  // How long the player has been gone, for the returning head start. Read once on
  // mount so it reflects the gap you actually came back from.
  const minutesAway = useMemo(() => {
    const last = state.lastTickAt ? new Date(state.lastTickAt).getTime() : Date.now();
    return Math.max(0, Math.round((Date.now() - last) / 60000));
  }, []);

  const stash = useMemo(() => {
    const inv = state.inventory || {};
    return (Object.keys(inv) as GoodId[])
      .filter(g => (inv[g] || 0) > 0)
      .map(g => ({ id: g, qty: inv[g] || 0 }));
  }, [state.inventory]);
  const stashUsed = stash.reduce((s, x) => s + x.qty, 0);

  /** Crew actually assigned to a racket in a district. */
  const crewIn = (d: DistrictId) =>
    (state.org?.members || []).filter(m => m.assignment && !m.injuredUntilDay
      && RACKET_BY_ID[m.assignment]?.district === d);
  const crewHere = (d: DistrictId) => crewIn(d).length;
  const workingHere = job ? crewIn(job.district).map(m => m.name) : [];

  /** Stash + the two ways out of it. Shared by the working and locked-up views. */
  const stashCard = (locked: boolean) => (
    <div className="game-card p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[0.5rem] font-bold text-muted-foreground uppercase tracking-wider">
          Voorraad {stashUsed}/{stashCapacity(state)}
        </span>
        <span className="text-[0.55rem] font-bold text-dirty">
          €{Math.round(state.dirtyMoney || 0).toLocaleString()} zwart geld
        </span>
      </div>
      {stash.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {stash.map(item => (
            <div key={item.id} className="flex items-center gap-1 bg-muted/30 rounded px-1.5 py-1" title={GOOD_NAME[item.id]}>
              {GOOD_IMAGES[item.id]
                ? <img src={GOOD_IMAGES[item.id]} alt="" className="w-5 h-5 rounded object-cover" />
                : <Package size={12} />}
              <span className="text-[0.5rem] font-bold">{item.qty}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[0.5rem] text-muted-foreground mb-2">Nog geen buit. Werk een klus af.</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <GameButton variant="muted" size="sm" disabled={locked}
          onClick={() => setView('market')}>
          <Package size={11} /> Verkopen
        </GameButton>
        <GameButton variant="emerald" size="sm" disabled={(state.dirtyMoney || 0) <= 0}
          onClick={() => { dispatch({ type: 'WASH_MONEY' }); showToast('Geld witgewassen!'); }}>
          <Droplets size={11} /> Witwassen
        </GameButton>
      </div>
      {locked && (
        <p className="text-[0.42rem] text-muted-foreground mt-1.5">
          Je waar blijft liggen tot je buiten staat. Witwassen loopt door.
        </p>
      )}
    </div>
  );

  // ---- Inside: your hands are out of action, the empire is not ----
  if (state.prison) {
    return (
      <div className="space-y-3">
        <LockedUpPanel />
        {stashCard(true)}
      </div>
    );
  }

  // ---- No job running: pick where to work ----
  if (!job) {
    return (
      <div className="space-y-3">
        <div className="text-center py-2">
          <h2 className="font-display text-base text-gold uppercase tracking-widest">Waar ga je werken?</h2>
          <p className="text-[0.55rem] text-muted-foreground mt-1">
            Kies een district. Rijker gebied betaalt beter, maar vraagt een sterkere crew.
          </p>
        </div>
        <div className="space-y-2">
          {DISTRICT_ORDER.map(d => {
            const unlocked = districtUnlocked(state, d);
            const need = DISTRICT_CREW_REQUIREMENT[d] ?? 0;
            return (
              <button key={d} disabled={!unlocked}
                onClick={() => dispatch({ type: 'SCORE_START', district: d })}
                className={`w-full relative rounded-xl overflow-hidden border text-left ${
                  unlocked ? 'border-border/60 hover:border-gold/50' : 'border-border/30 opacity-60'
                }`}>
                <img src={DISTRICT_IMAGES[d]} alt="" className="w-full h-20 object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-between px-3">
                  <div>
                    <div className="text-xs font-bold text-foreground">{DISTRICTS[d]?.name || d}</div>
                    <div className="text-[0.45rem] mt-0.5">
                      {unlocked
                        ? (crewHere(d) > 0
                            ? <span className="text-emerald font-bold">👥 {crewHere(d)} crew hier · {crewWorkPerSecond(state, d).toFixed(1)}/sec</span>
                            : <span className="text-muted-foreground">Geen crew hier — je werkt alleen</span>)
                        : <span className="text-muted-foreground flex items-center gap-1"><Lock size={8} /> Crewkracht {need} nodig (nu {strength.toFixed(1)})</span>}
                    </div>
                  </div>
                  {unlocked && <span className="text-[0.5rem] font-bold text-gold uppercase tracking-wider">Beginnen →</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---- Working a job ----

  return (
    <div className="space-y-3">
      <JobScene
        job={job}
        basePower={power}
        crewRate={crewRate}
        crewNames={workingHere}
        streak={state.jobStreak || 0}
        minutesAway={minutesAway}
        heat={Math.round(state.personalHeat || 0)}
        onWork={(amount) => dispatch({ type: 'SCORE_WORK', amount })}
      />

      {/* The take. Rendered plainly rather than through AnimatePresence: an exiting
          card kept its slot in the layout, leaving a hole above the stash between
          jobs. The entrance is the part that sells it; the exit can be instant. */}
      {reward && (
        <LootBurst
          key={reward.jobName + reward.dirtyMoney}
          jobName={reward.jobName}
          goods={reward.goods}
          dirty={reward.dirtyMoney + reward.overflowMoney}
        />
      )}

      {/* Stash + laundering — the chain out of here */}
      {stashCard(false)}

      <div className="grid grid-cols-2 gap-2">
        <GameButton variant="ghost" size="sm"
          onClick={() => dispatch({ type: 'SCORE_START', district: job.district })}>
          Ander doelwit
        </GameButton>
        <GameButton variant="muted" size="sm"
          onClick={() => dispatch({ type: 'SCORE_ABANDON' })}>
          Ander district →
        </GameButton>
      </div>
      <p className="text-[0.42rem] text-muted-foreground text-center">
        Je werkt nu in {DISTRICTS[job.district]?.name || job.district}
        {crewHere(job.district) > 0
          ? ` · ${crewHere(job.district)} crew helpt mee`
          : ' · geen crew hier, alleen jouw handen'}
      </p>
    </div>
  );
}
