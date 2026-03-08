import { Swords, Shield, Target, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface DigestSectionProps {
  digest: any;
  baseDelay: number;
}

export function DigestSection({ digest, baseDelay }: DigestSectionProps) {
  if (!digest) return null;

  const { sections } = digest.digest_data;

  return (
    <>
      {/* PvP & Territory */}
      {sections.pvp && (sections.pvp.activeBountiesOnYou > 0 || sections.pvp.activeGangWars > 0) && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: baseDelay }}
          className="border border-blood/30 rounded-lg p-3 bg-[hsl(var(--blood)/0.06)]"
        >
          <div className="flex items-center gap-2 mb-2">
            <Swords size={14} className="text-blood" />
            <span className="text-xs font-bold text-blood uppercase tracking-wider">PvP & Territory</span>
          </div>
          <div className="space-y-1 text-[0.6rem]">
            {sections.pvp.activeBountiesOnYou > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><Target size={10} /> Bounties op jou</span>
                <span className="text-blood font-bold">{sections.pvp.activeBountiesOnYou}x (€{sections.pvp.totalBountyAmount.toLocaleString()})</span>
              </div>
            )}
            {sections.pvp.activeGangWars > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><Shield size={10} /> Actieve gang wars</span>
                <span className="text-blood font-bold">{sections.pvp.activeGangWars}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Market & Economy */}
      {sections.market?.highlights && sections.market.highlights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: baseDelay + 0.12 }}
          className="border border-gold/30 rounded-lg p-3 bg-[hsl(var(--gold)/0.06)]"
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={14} className="text-gold" />
            <span className="text-xs font-bold text-gold uppercase tracking-wider">Markt & Economie</span>
          </div>
          <div className="space-y-1.5">
            {sections.market.highlights.map((h: string, i: number) => (
              <p key={i} className="text-[0.6rem] text-muted-foreground">📰 {h}</p>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cliffhanger */}
      {sections.cliffhanger && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: baseDelay + 0.3, duration: 0.6 }}
          className="border rounded-lg p-3 bg-[hsl(var(--game-purple)/0.08)] border-game-purple/30"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm">{sections.cliffhanger.icon}</span>
            <span className="text-[0.6rem] font-bold text-game-purple uppercase tracking-widest">Morgen...</span>
            <motion.span
              className="text-game-purple/60 text-xs"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >...</motion.span>
          </div>
          <p className="text-[0.55rem] text-muted-foreground italic leading-relaxed">{sections.cliffhanger.text}</p>
        </motion.div>
      )}
    </>
  );
}
