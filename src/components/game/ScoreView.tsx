import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Users, Hand, Droplets, Package } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, GOODS } from '@/game/constants';
import { DISTRICT_IMAGES, GOOD_IMAGES } from '@/assets/items';
import type { DistrictId, GoodId } from '@/game/types';
import {
  tapPower, crewWorkPerSecond, districtUnlocked, crewStrength,
  DISTRICT_CREW_REQUIREMENT,
} from '@/game/score';
import { GameButton } from './ui/GameButton';
import { playHitSound, playCoinSound } from '@/game/sounds';

const DISTRICT_ORDER: DistrictId[] = ['low', 'port', 'iron', 'neon', 'crown'] as DistrictId[];
const GOOD_NAME: Record<string, string> = GOODS.reduce((a, g) => { a[g.id] = g.name; return a; }, {} as Record<string, string>);

/** A "+N" that floats up from where you tapped. */
interface Hit { id: number; x: number; y: number; value: number }

export function ScoreView() {
  const { state, dispatch, showToast, setView } = useGame();
  const job = state.activeJob;
  const [hits, setHits] = useState<Hit[]>([]);
  const hitId = useRef(0);
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

  const stash = useMemo(() => {
    const inv = state.inventory || {};
    return (Object.keys(inv) as GoodId[])
      .filter(g => (inv[g] || 0) > 0)
      .map(g => ({ id: g, qty: inv[g] || 0 }));
  }, [state.inventory]);
  const stashUsed = stash.reduce((s, x) => s + x.qty, 0);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!job) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    hitId.current++;
    setHits(h => [...h, { id: hitId.current, x, y, value: power }]);
    setTimeout(() => setHits(h => h.filter(p => p.id !== hitId.current)), 700);
    playHitSound();
    dispatch({ type: 'SCORE_WORK', amount: power });
  };

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
                    <div className="text-[0.45rem] text-muted-foreground mt-0.5">
                      {unlocked
                        ? <>Crew hier: {crewWorkPerSecond(state, d).toFixed(1)}/sec</>
                        : <span className="flex items-center gap-1"><Lock size={8} /> Crewkracht {need} nodig (nu {strength.toFixed(1)})</span>}
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
  const pct = Math.min(100, (job.progress / job.required) * 100);

  return (
    <div className="space-y-3">
      {/* The scene you actually tap */}
      <div
        onClick={handleTap}
        className="relative rounded-xl overflow-hidden border border-gold/30 cursor-pointer select-none active:border-gold/70"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <img src={DISTRICT_IMAGES[job.district]} alt="" className="w-full h-48 object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Job identity */}
        <div className="absolute top-3 left-3 right-3">
          <div className="text-[0.45rem] text-muted-foreground uppercase tracking-widest">
            {DISTRICTS[job.district]?.name || job.district}
          </div>
          <div className="text-sm font-display text-foreground uppercase tracking-wide">{job.name}</div>
          <p className="text-[0.5rem] text-muted-foreground leading-snug mt-0.5 max-w-[85%]">{job.flavor}</p>
        </div>

        {/* Tap hint */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          animate={{ opacity: [0.25, 0.6, 0.25], scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Hand size={30} className="text-gold/70" />
        </motion.div>

        {/* Floating +N per tap */}
        <AnimatePresence>
          {hits.map(h => (
            <motion.div key={h.id}
              initial={{ opacity: 1, y: 0, scale: 1.2 }}
              animate={{ opacity: 0, y: -44, scale: 0.9 }}
              transition={{ duration: 0.7 }}
              className="absolute font-bold text-sm text-gold pointer-events-none"
              style={{ left: h.x - 8, top: h.y - 10, textShadow: '0 0 8px currentColor' }}>
              +{h.value}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Progress */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex justify-between text-[0.45rem] mb-1">
            <span className="text-muted-foreground">
              <Users size={8} className="inline mb-px" /> crew {crewRate.toFixed(1)}/sec · tik +{power}
            </span>
            <span className="text-gold font-bold">{Math.floor(job.progress)}/{job.required}</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden border border-border/40">
            <motion.div className="h-full bg-gradient-to-r from-gold via-gold to-blood"
              animate={{ width: `${pct}%` }} transition={{ duration: 0.18 }} />
          </div>
        </div>
      </div>

      {/* Loot burst */}
      <AnimatePresence>
        {reward && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="game-card border-l-[3px] border-l-gold p-2.5"
          >
            <div className="text-[0.5rem] font-bold text-gold uppercase tracking-wider mb-1.5">
              {reward.jobName} — buit
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(reward.goods).map(([gid, qty]) => (
                <motion.div key={gid} initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="flex items-center gap-1 bg-muted/40 rounded px-1.5 py-1">
                  {GOOD_IMAGES[gid]
                    ? <img src={GOOD_IMAGES[gid]} alt="" className="w-5 h-5 rounded object-cover" />
                    : <Package size={12} className="text-muted-foreground" />}
                  <span className="text-[0.5rem] font-bold text-foreground">+{qty}</span>
                  <span className="text-[0.45rem] text-muted-foreground">{GOOD_NAME[gid] || gid}</span>
                </motion.div>
              ))}
              <span className="text-[0.55rem] font-bold text-dirty">
                +€{(reward.dirtyMoney + reward.overflowMoney).toLocaleString()} zwart
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stash + laundering — the chain out of here */}
      <div className="game-card p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[0.5rem] font-bold text-muted-foreground uppercase tracking-wider">
            Voorraad {stashUsed}/{state.maxInv || 15}
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
          <GameButton variant="muted" size="sm" onClick={() => setView('market')}>
            <Package size={11} /> Verkopen
          </GameButton>
          <GameButton variant="emerald" size="sm" disabled={(state.dirtyMoney || 0) <= 0}
            onClick={() => { dispatch({ type: 'WASH_MONEY' }); showToast('Geld witgewassen!'); }}>
            <Droplets size={11} /> Witwassen
          </GameButton>
        </div>
      </div>

      <GameButton variant="ghost" size="sm" fullWidth
        onClick={() => dispatch({ type: 'SCORE_START', district: job.district })}>
        Ander doelwit zoeken
      </GameButton>
    </div>
  );
}
