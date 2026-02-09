import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Skull, Swords, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

interface VillaAttackProps {
  won: boolean;
  nemesisName: string;
  damage: string;
  stolenMoney?: number;
  moduleDamaged?: string;
  defenseScore?: number;
  attackPower?: number;
  defenseBreakdown?: { label: string; value: number; icon: string }[];
  delay: number;
}

type BattlePhase = 'idle' | 'alert' | 'buildup' | 'clash' | 'result';

export function VillaAttackPopup({
  won, nemesisName, damage, stolenMoney, moduleDamaged,
  defenseScore = 0, attackPower = 0, defenseBreakdown = [], delay,
}: VillaAttackProps) {
  const [phase, setPhase] = useState<BattlePhase>('idle');
  const maxScore = Math.max(defenseScore, attackPower, 1);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('alert'), delay * 1000),
      setTimeout(() => setPhase('buildup'), (delay + 0.6) * 1000),
      setTimeout(() => setPhase('clash'), (delay + 1.8) * 1000),
      setTimeout(() => setPhase('result'), (delay + 2.6) * 1000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [delay]);

  if (phase === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`border-2 rounded-lg overflow-hidden ${
          phase === 'result'
            ? won ? 'border-gold glow-gold' : 'border-blood glow-blood'
            : 'border-orange-400'
        }`}
      >
        {/* Alert header */}
        <motion.div
          className={`px-3 py-2 flex items-center gap-2 ${
            phase === 'result'
              ? won ? 'bg-[hsl(var(--gold)/0.15)]' : 'bg-[hsl(var(--blood)/0.2)]'
              : 'bg-orange-500/15'
          }`}
          animate={phase === 'alert' || phase === 'buildup' ? { opacity: [1, 0.6, 1] } : {}}
          transition={{ repeat: phase === 'clash' ? 0 : Infinity, duration: 0.6 }}
        >
          {phase === 'result' ? (
            won ? <Shield size={16} className="text-gold" /> : <Skull size={16} className="text-blood" />
          ) : (
            <Swords size={16} className="text-orange-400" />
          )}
          <p className={`text-xs font-bold uppercase tracking-wider ${
            phase === 'result'
              ? won ? 'text-gold' : 'text-blood'
              : 'text-orange-400'
          }`}>
            {phase === 'alert' && `⚠️ ${nemesisName} VALT AAN!`}
            {phase === 'buildup' && '🏛️ VERDEDIGING ACTIEF...'}
            {phase === 'clash' && '⚔️ GEVECHT BEZIG...'}
            {phase === 'result' && (won ? '🏛️ VILLA VERDEDIGD!' : '🏛️ VILLA DOORBROKEN!')}
          </p>
        </motion.div>

        <div className="p-3 space-y-2.5 bg-background/80">
          {/* Score bars — show during buildup/clash/result */}
          {(phase === 'buildup' || phase === 'clash' || phase === 'result') && (
            <div className="space-y-2">
              {/* Defense bar */}
              <div>
                <div className="flex justify-between text-[0.55rem] mb-0.5">
                  <span className="text-gold font-bold flex items-center gap-1">
                    <Shield size={10} /> VERDEDIGING
                  </span>
                  <motion.span
                    className="font-bold text-gold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {defenseScore}
                  </motion.span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-gold/70 to-gold rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(defenseScore / maxScore) * 100}%` }}
                    transition={{ duration: 1.0, ease: 'easeOut', delay: 0.1 }}
                  />
                </div>
              </div>

              {/* Attack bar */}
              <div>
                <div className="flex justify-between text-[0.55rem] mb-0.5">
                  <span className="text-blood font-bold flex items-center gap-1">
                    <Skull size={10} /> AANVAL ({nemesisName})
                  </span>
                  <motion.span
                    className="font-bold text-blood"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {attackPower}
                  </motion.span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blood/70 to-blood rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(attackPower / maxScore) * 100}%` }}
                    transition={{ duration: 1.0, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Clash animation */}
          {phase === 'clash' && (
            <motion.div
              className="flex items-center justify-center py-2"
              animate={{ scale: [1, 1.15, 1], rotate: [0, -2, 2, 0] }}
              transition={{ repeat: Infinity, duration: 0.4 }}
            >
              <Zap size={24} className="text-orange-400" />
            </motion.div>
          )}

          {/* Defense breakdown — show in result */}
          {phase === 'result' && defenseBreakdown.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="space-y-1 bg-muted/30 rounded p-2"
            >
              <p className="text-[0.5rem] font-bold text-muted-foreground uppercase tracking-wider mb-1">Verdedigingsopbouw</p>
              {defenseBreakdown.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center justify-between text-[0.55rem]"
                >
                  <span className="text-muted-foreground">{item.icon} {item.label}</span>
                  <span className="text-gold font-bold">+{item.value}</span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Result details */}
          {phase === 'result' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-1"
            >
              {won ? (
                <p className="text-[0.6rem] text-emerald font-semibold">
                  ✅ Je verdediging ({defenseScore}) sloeg de aanval ({attackPower}) af!
                </p>
              ) : (
                <div className="space-y-0.5">
                  {stolenMoney && stolenMoney > 0 && (
                    <p className="text-[0.6rem] text-blood font-bold">💰 €{stolenMoney.toLocaleString()} gestolen uit kluis</p>
                  )}
                  {moduleDamaged && (
                    <p className="text-[0.6rem] text-blood font-bold">🔧 {moduleDamaged} vernietigd!</p>
                  )}
                  <p className="text-[0.6rem] text-blood">{damage}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
