import { motion, AnimatePresence } from 'framer-motion';
import { GOODS } from '@/game/constants';
import { GOOD_IMAGES } from '@/assets/items';
import { Package } from 'lucide-react';
import type { GoodId } from '@/game/types';

const GOOD_NAME: Record<string, string> = GOODS.reduce((a, g) => { a[g.id] = g.name; return a; }, {} as Record<string, string>);

/**
 * The payoff moment. A finished job used to resolve into a small text row, which
 * made the most rewarding beat in the loop the least noticeable one. Now the take
 * lands: a flash across the card, coins thrown outward, and each item popping in
 * one after another so you can see what you got.
 */
export function LootBurst({ jobName, goods, dirty }: {
  jobName: string;
  goods: Partial<Record<GoodId, number>>;
  dirty: number;
}) {
  const entries = Object.entries(goods) as [GoodId, number][];
  // A handful of coins, thrown to pseudo-random angles seeded off the amount so the
  // burst looks organic but never re-randomises mid-animation.
  const coins = Array.from({ length: 9 }, (_, i) => {
    const angle = (i / 9) * Math.PI * 2 + (dirty % 7) * 0.3;
    return { id: i, dx: Math.cos(angle) * (34 + (i % 3) * 12), dy: Math.sin(angle) * (26 + (i % 4) * 9) };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="relative game-card border-l-[3px] border-l-gold p-2.5 overflow-hidden"
    >
      {/* Flash sweep across the card */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ x: '-120%' }} animate={{ x: '120%' }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{ background: 'linear-gradient(100deg, transparent, hsl(var(--gold)/0.22), transparent)' }}
      />

      {/* Coin burst from the centre */}
      <div className="absolute left-1/2 top-1/2 pointer-events-none">
        <AnimatePresence>
          {coins.map(c => (
            <motion.span
              key={c.id}
              initial={{ opacity: 1, x: 0, y: 0, scale: 0.7 }}
              animate={{ opacity: 0, x: c.dx, y: c.dy, scale: 1.1 }}
              transition={{ duration: 0.85, ease: 'easeOut', delay: c.id * 0.015 }}
              className="absolute text-[0.6rem]"
            >
              💰
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative">
        <div className="text-[0.5rem] font-bold text-gold uppercase tracking-wider mb-1.5">
          {jobName} — buit
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {entries.map(([gid, qty], i) => (
            <motion.div
              key={gid}
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1 + i * 0.11, type: 'spring', stiffness: 420, damping: 16 }}
              className="flex items-center gap-1 bg-muted/40 rounded px-1.5 py-1 border border-gold/20"
            >
              {GOOD_IMAGES[gid]
                ? <img src={GOOD_IMAGES[gid]} alt="" className="w-5 h-5 rounded object-cover" />
                : <Package size={12} className="text-muted-foreground" />}
              <span className="text-[0.5rem] font-bold text-foreground">+{qty}</span>
              <span className="text-[0.45rem] text-muted-foreground">{GOOD_NAME[gid] || gid}</span>
            </motion.div>
          ))}
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.1 + entries.length * 0.11, type: 'spring', stiffness: 400 }}
            className="text-[0.6rem] font-bold text-dirty"
          >
            +€{dirty.toLocaleString()} zwart
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
