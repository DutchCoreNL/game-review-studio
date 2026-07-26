import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GOODS } from '@/game/constants';
import { GOOD_IMAGES } from '@/assets/items';
import { Package } from 'lucide-react';
import type { GoodId } from '@/game/types';

const GOOD = GOODS.reduce((a, g) => { a[g.id] = g; return a; }, {} as Record<string, typeof GOODS[number]>);

/**
 * THE PAYOFF.
 *
 * Everything in this game points here: you work a target open, and this is what was
 * inside. It used to be a small text row with 20-pixel thumbnails, which made the most
 * rewarding beat in the loop the least noticeable thing on screen.
 *
 * Now it lands. The card flashes, coins are thrown out of it, the goods drop in one after
 * another on plates sized to be looked at, and the dirty cash counts up rather than simply
 * appearing — a number that rolls reads as money arriving, a number that blinks reads as a
 * label changing. Better contraband gets a warmer frame, so a crate of stolen art is
 * visibly a better night than a box of medical supplies.
 */

/** Frame colour by what the goods are worth, so value is legible at a glance. */
function rarity(gid: GoodId): { ring: string; glow: string; label: string } {
  const base = GOOD[gid]?.base || 0;
  if (base >= 2000) return { ring: 'border-gold', glow: 'hsl(var(--gold)/0.45)', label: 'text-gold' };
  if (base >= 900) return { ring: 'border-game-purple/70', glow: 'hsl(var(--game-purple)/0.4)', label: 'text-game-purple' };
  if (base >= 500) return { ring: 'border-ice/60', glow: 'hsl(var(--ice)/0.35)', label: 'text-ice' };
  return { ring: 'border-border', glow: 'transparent', label: 'text-muted-foreground' };
}

/** Rolls a number up to its value. Money arriving should look like money arriving. */
function useCountUp(target: number, ms = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (target <= 0) { setN(0); return; }
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      // Ease out, so it sprints then settles.
      setN(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

export function LootBurst({ jobName, goods, dirty, streak = 0 }: {
  jobName: string;
  goods: Partial<Record<GoodId, number>>;
  dirty: number;
  /** Jobs finished in a row, acknowledged here because this is where it pays. */
  streak?: number;
}) {
  const entries = Object.entries(goods) as [GoodId, number][];
  const cash = useCountUp(dirty);

  // Coins thrown to pseudo-random angles seeded off the amount, so the burst looks
  // organic but never re-randomises mid-animation.
  const coins = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2 + (dirty % 7) * 0.3;
    return { id: i, dx: Math.cos(angle) * (48 + (i % 3) * 16), dy: Math.sin(angle) * (34 + (i % 4) * 12) };
  });

  const best = entries.reduce((b, [gid]) => Math.max(b, GOOD[gid]?.base || 0), 0);
  const bigScore = best >= 2000;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`relative game-card border-l-[3px] p-3 overflow-hidden ${bigScore ? 'border-l-gold' : 'border-l-emerald'}`}
    >
      {/* Two sweeps: a fast bright one, then a slow warm one behind it. */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ x: '-130%' }} animate={{ x: '130%' }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
        style={{ background: 'linear-gradient(100deg, transparent, hsl(45 100% 85% / 0.3), transparent)' }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0.55 }} animate={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        style={{ background: bigScore
          ? 'radial-gradient(circle at 50% 40%, hsl(var(--gold)/0.35), transparent 70%)'
          : 'radial-gradient(circle at 50% 40%, hsl(var(--emerald)/0.28), transparent 70%)' }}
      />

      {/* Coin burst from the centre of the card */}
      <div className="absolute left-1/2 top-1/2 pointer-events-none">
        {coins.map(c => (
          <motion.span
            key={c.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0.6, rotate: 0 }}
            animate={{ opacity: 0, x: c.dx, y: c.dy, scale: 1.15, rotate: c.dx > 0 ? 90 : -90 }}
            transition={{ duration: 0.95, ease: 'easeOut', delay: c.id * 0.012 }}
            className="absolute text-[0.65rem]"
          >
            💰
          </motion.span>
        ))}
      </div>

      <div className="relative">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <span className="text-[0.5rem] font-bold text-gold uppercase tracking-[0.18em]">
            {jobName} — binnen
          </span>
          {streak > 1 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 400 }}
              className="text-[0.5rem] font-bold text-emerald"
            >
              🔥 {streak} op een rij
            </motion.span>
          )}
        </div>

        {/* The goods, on plates worth looking at */}
        <div className="flex flex-wrap items-stretch gap-2">
          {entries.map(([gid, qty], i) => {
            const r = rarity(gid);
            return (
              <motion.div
                key={gid}
                initial={{ scale: 0, rotate: -14, y: 10 }}
                animate={{ scale: 1, rotate: 0, y: 0 }}
                transition={{ delay: 0.12 + i * 0.14, type: 'spring', stiffness: 380, damping: 15 }}
                className={`relative w-[4.6rem] rounded-lg border ${r.ring} bg-muted/30 overflow-hidden`}
                style={{ boxShadow: `0 0 14px ${r.glow}` }}
              >
                <div className="relative h-12">
                  {GOOD_IMAGES[gid]
                    ? <img src={GOOD_IMAGES[gid]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Package size={18} className="text-muted-foreground" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  <span className="absolute bottom-0.5 right-1 text-[0.65rem] font-black text-foreground drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                    +{qty}
                  </span>
                </div>
                <div className={`px-1 py-0.5 text-[0.4rem] leading-tight text-center truncate ${r.label}`}>
                  {GOOD[gid]?.name || gid}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* The cash, rolling in */}
        {dirty > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + entries.length * 0.14 }}
            className="mt-2 flex items-baseline gap-1.5"
          >
            <span className="text-base font-black text-dirty tabular-nums">
              +€{cash.toLocaleString()}
            </span>
            <span className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">zwart geld</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
