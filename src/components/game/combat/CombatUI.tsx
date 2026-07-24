import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Zap, Flame } from 'lucide-react';
import { StatBar } from '../ui/StatBar';
import { CombatStance } from '@/game/types';
import { STANCE_MODIFIERS, BUFF_DEFS, getAvailableSkills, isSkillOnCooldown, COMBO_THRESHOLD } from '@/game/combatSkills';
import { playHitSound } from '@/game/sounds';

/**
 * Shared combat UI kit.
 *
 * Both the PvE (`CombatView`) and PvP (`PvPCombatView`) screens are driven by the
 * same tested damage core (`src/game/combat/damage.ts`); this module gives them the
 * same *look and feel* too. Every primitive here is purely presentational and
 * callback-driven — it never dispatches — so the two views stay identical for the
 * player while each keeps its own state wiring (COMBAT_ACTION vs PVP_COMBAT_ACTION).
 */

// ========== Stance ==========

export const STANCE_COLORS: Record<CombatStance, string> = {
  aggressive: 'border-blood text-blood bg-blood/10',
  balanced: 'border-gold text-gold bg-gold/10',
  defensive: 'border-emerald text-emerald bg-emerald/10',
};
export const STANCE_ACTIVE_COLORS: Record<CombatStance, string> = {
  aggressive: 'border-blood bg-blood text-primary-foreground',
  balanced: 'border-gold bg-gold text-background',
  defensive: 'border-emerald bg-emerald text-primary-foreground',
};
const STANCES: CombatStance[] = ['aggressive', 'balanced', 'defensive'];

export function StanceSelector({ current, onChange, disabled }: {
  current: CombatStance;
  onChange: (s: CombatStance) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1.5 justify-center">
      {STANCES.map(s => {
        const mod = STANCE_MODIFIERS[s];
        const isActive = current === s;
        return (
          <motion.button
            key={s}
            onClick={() => !disabled && onChange(s)}
            disabled={disabled}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded border text-[0.5rem] font-bold transition-all ${
              isActive ? STANCE_ACTIVE_COLORS[s] : `${STANCE_COLORS[s]} opacity-60 hover:opacity-100`
            } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
            whileTap={disabled ? {} : { scale: 0.95 }}
            title={mod.desc}
          >
            <span>{mod.icon}</span>
            <span className="uppercase tracking-wider">{mod.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ========== Floating damage numbers ==========

export interface DamagePopupData {
  id: number;
  value: number;
  type: 'dealt' | 'taken' | 'heal' | 'crit';
}

export function DamagePopup({ value, type }: { value: number; type: DamagePopupData['type'] }) {
  const colorMap = { dealt: 'text-gold', taken: 'text-blood', heal: 'text-emerald', crit: 'text-gold' };
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: type === 'crit' ? 1.8 : 1.2 }}
      animate={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.9 }}
      className={`absolute font-bold text-sm ${colorMap[type]} pointer-events-none z-50`}
      style={{ textShadow: '0 0 8px currentColor' }}
    >
      {type === 'heal' ? '+' : type === 'crit' ? '💥 ' : '-'}{value}
    </motion.div>
  );
}

/**
 * Watches a fighter's HP and the enemy's HP and emits floating "-X / +X / crit"
 * popups. Keyed on `turn` so a same-value hit two turns running still fires.
 * `lastLog` lets a crit line upgrade the popup styling.
 */
export function useCombatDamagePopups(selfHP: number, enemyHP: number, turn: number, lastLog: string) {
  const prevSelf = useRef(selfHP);
  const prevEnemy = useRef(enemyHP);
  const [popups, setPopups] = useState<DamagePopupData[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const selfDelta = prevSelf.current - selfHP;
    const enemyDelta = prevEnemy.current - enemyHP;
    const next: DamagePopupData[] = [];

    if (enemyDelta > 0) {
      const isCrit = /KRITIEK|COMBO FINISHER|EXECUTIE/.test(lastLog);
      next.push({ id: idRef.current++, value: enemyDelta, type: isCrit ? 'crit' : 'dealt' });
    }
    if (selfDelta > 0) next.push({ id: idRef.current++, value: selfDelta, type: 'taken' });
    if (selfDelta < 0) next.push({ id: idRef.current++, value: Math.abs(selfDelta), type: 'heal' });

    if (next.length > 0) {
      setPopups(prev => [...prev, ...next]);
      setTimeout(() => setPopups(prev => prev.filter(p => !next.find(n => n.id === p.id))), 900);
    }
    prevSelf.current = selfHP;
    prevEnemy.current = enemyHP;
  }, [selfHP, enemyHP, turn]);

  return popups;
}

// ========== Animated HP bar ==========

export function AnimatedHPBar({ label, current, max, color, flashColor }: {
  label: string; current: number; max: number;
  color: 'blood' | 'gold' | 'emerald' | 'purple' | 'ice' | 'auto'; flashColor: string;
}) {
  const [flash, setFlash] = useState(false);
  const prevHP = useRef(current);

  useEffect(() => {
    if (current < prevHP.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 300);
      prevHP.current = current;
      return () => clearTimeout(t);
    }
    prevHP.current = current;
  }, [current]);

  return (
    <motion.div animate={flash ? { x: [-2, 2, -2, 2, 0] } : {}} transition={{ duration: 0.3 }}>
      <div className="flex justify-between text-[0.6rem] text-muted-foreground mb-1">
        <span className="font-bold text-foreground truncate">{label}</span>
        <motion.span
          key={current}
          initial={{ scale: 1.3, color: `hsl(var(--${flashColor}))` }}
          animate={{ scale: 1, color: 'hsl(var(--muted-foreground))' }}
          transition={{ duration: 0.4 }}
        >
          {current}/{max}
        </motion.span>
      </div>
      <div className="relative">
        <StatBar value={current} max={max} color={color} height="lg" />
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 rounded"
              style={{ background: `hsl(var(--${flashColor}) / 0.4)` }}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ========== Turn indicator ==========

export function TurnIndicator({ turn }: { turn: number }) {
  return (
    <motion.div
      key={turn}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex items-center justify-center gap-2 mb-3"
    >
      <div className="h-px flex-1 bg-border" />
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted border border-border">
        <Swords size={8} className="text-muted-foreground" />
        <span className="text-[0.5rem] font-bold text-muted-foreground uppercase tracking-wider">
          Beurt {turn}
        </span>
      </div>
      <div className="h-px flex-1 bg-border" />
    </motion.div>
  );
}

// ========== Combo meter (inline) ==========

export function ComboMeter({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-0.5">
        <Flame size={9} className="text-gold" />
        <span className="text-[0.45rem] font-bold text-gold uppercase tracking-wider">
          Combo {count}/{COMBO_THRESHOLD}
        </span>
      </div>
      <div className="relative h-1.5 bg-muted rounded overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold to-blood rounded"
          animate={{ width: `${Math.min(100, (count / COMBO_THRESHOLD) * 100)}%` }}
          transition={{ type: 'spring', stiffness: 200 }}
        />
      </div>
    </div>
  );
}

// ========== Buff chips ==========

export function BuffChips({ buffs }: { buffs: { id: string; duration: number }[] }) {
  if (buffs.length === 0) return null;
  return (
    <div className="flex gap-1 mb-3 flex-wrap">
      {buffs.map((buff, i) => (
        <motion.div
          key={`${buff.id}-${i}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gold/10 border border-gold/30"
          title={BUFF_DEFS[buff.id]?.effect}
        >
          <span className="text-[0.45rem]">{BUFF_DEFS[buff.id]?.icon || '✨'}</span>
          <span className="text-[0.4rem] text-gold font-bold">{buff.duration}t</span>
        </motion.div>
      ))}
    </div>
  );
}

// ========== Core action card ==========

const ACTION_STYLES: Record<string, string> = {
  blood: 'bg-blood text-primary-foreground',
  gold: 'bg-gold/15 border border-gold text-gold',
  muted: 'bg-muted border border-border text-foreground',
  purple: 'bg-game-purple/15 border border-game-purple text-game-purple',
  ice: 'bg-ice/15 border border-ice text-ice',
};

export function CombatAction({ icon, label, sub, onClick, variant }: {
  icon: React.ReactNode; label: string; sub: string; onClick: () => void; variant: string;
}) {
  const [impactPulse, setImpactPulse] = useState(false);
  const handleClick = () => {
    setImpactPulse(true);
    setTimeout(() => setImpactPulse(false), 200);
    onClick();
  };
  return (
    <motion.button
      onClick={handleClick}
      className={`py-3 rounded ${ACTION_STYLES[variant] || ACTION_STYLES.muted} font-bold text-xs flex flex-col items-center gap-0.5 relative overflow-hidden`}
      whileTap={{ scale: 0.92 }}
    >
      <AnimatePresence>
        {impactPulse && (
          <motion.div
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 rounded-full bg-white/20"
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%' }}
          />
        )}
      </AnimatePresence>
      {icon}
      <span className="text-[0.55rem] leading-tight text-center px-1">{label}</span>
      <span className="text-[0.45rem] font-normal opacity-70">{sub}</span>
    </motion.button>
  );
}

// ========== Momentum / combo finisher ==========

export function ComboFinisher({ count, onClick }: { count: number; onClick: () => void }) {
  if (count >= COMBO_THRESHOLD) {
    return (
      <motion.button
        onClick={onClick}
        className="w-full py-2.5 rounded-lg border border-gold bg-gold/15 text-gold font-bold text-xs flex items-center justify-center gap-2"
        whileTap={{ scale: 0.97 }}
        animate={{ boxShadow: ['0 0 0px hsl(var(--gold)/0)', '0 0 14px hsl(var(--gold)/0.55)', '0 0 0px hsl(var(--gold)/0)'] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      >
        <Flame size={14} /> Momentum Finisher — massieve schade + stun
      </motion.button>
    );
  }
  return (
    <div className="w-full py-2 rounded-lg border border-border/30 bg-muted/5 text-center">
      <p className="text-[0.5rem] text-muted-foreground flex items-center justify-center gap-1">
        <Flame size={10} /> Momentum {count}/{COMBO_THRESHOLD} — vul de meter met aanvallen
      </p>
    </div>
  );
}

// ========== Skill grid ==========

export function SkillGrid({ playerLevel, cooldowns, finished, onUse }: {
  playerLevel: number;
  cooldowns: Record<string, number>;
  finished: boolean;
  onUse: (skillId: string) => void;
}) {
  const activeSkills = useMemo(
    () => getAvailableSkills(playerLevel).filter(s => s.effect.type !== 'emergency_heal'),
    [playerLevel],
  );
  if (activeSkills.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-3"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Zap size={9} className="text-game-purple" />
        <span className="text-[0.5rem] font-bold text-game-purple uppercase tracking-wider">Skills</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {activeSkills.map(skill => {
          const onCooldown = isSkillOnCooldown(skill.id, cooldowns);
          const cd = cooldowns[skill.id] || 0;
          return (
            <motion.button
              key={skill.id}
              disabled={onCooldown || finished}
              onClick={() => {
                if (!onCooldown) {
                  playHitSound();
                  onUse(skill.id);
                }
              }}
              className={`relative py-2 px-2 rounded text-[0.5rem] font-bold flex flex-col items-center gap-0.5 transition-all ${
                onCooldown
                  ? 'bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed'
                  : 'bg-game-purple/15 border border-game-purple/40 text-game-purple hover:bg-game-purple/25'
              }`}
              whileTap={onCooldown ? {} : { scale: 0.92 }}
            >
              <span className="text-sm">{skill.icon}</span>
              <span className="leading-tight text-center">{skill.name}</span>
              {onCooldown && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded">
                  <span className="text-[0.6rem] font-bold text-muted-foreground">{cd}🔄</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ========== Combat log ==========

export function CombatLogEntry({ log, index, turn }: { log: string; index: number; turn: number }) {
  const isCrit = log.includes('KRITIEK') || log.includes('COMBO FINISHER') || log.includes('EXECUTIE');
  const isVictory = log.includes('verslagen') || log.includes('STUNNED') || log.includes('geslaagd');
  const isDefeat = log.includes('mislukt') || log.includes('Je bent verslagen');
  const isEnemyAttack = log.includes('slaat terug') || log.includes('valt aan');
  const isHeal = log.includes('+') && log.includes('HP');
  const isBossDialogue = log.startsWith('Decker:') || log.startsWith('Voss:');

  let icon = '';
  if (isCrit) icon = '💥 ';
  else if (isVictory) icon = '🏆 ';
  else if (isHeal) icon = '💚 ';
  else if (isEnemyAttack) icon = '🩸 ';
  else if (isDefeat) icon = '💀 ';
  else if (log.includes('🛡️') || log.includes('Verdedig')) icon = '';
  else if (!log.startsWith('🫁') && !log.startsWith('🔥') && !log.startsWith('💫') && !isBossDialogue) icon = '⚔️ ';

  const className = isCrit
    ? 'text-gold font-bold text-[0.65rem]'
    : isVictory
    ? 'text-gold font-bold'
    : isDefeat || isEnemyAttack
    ? 'text-blood'
    : isBossDialogue
    ? 'text-ice font-semibold italic'
    : isHeal
    ? 'text-emerald'
    : 'text-muted-foreground';

  return (
    <motion.p
      key={`${turn}-${index}`}
      initial={{ opacity: 0, x: isEnemyAttack ? 10 : -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`text-[0.6rem] py-0.5 ${className} ${isEnemyAttack ? 'border-l-2 border-blood/30 pl-2 ml-1' : ''}`}
    >
      {icon}{log}
    </motion.p>
  );
}

/** The full "Gevechtslog" card with heading. Shows the last `count` lines. */
export function CombatLog({ logs, turn, count = 6 }: { logs: string[]; turn: number; count?: number }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="h-px flex-1 bg-border/40" />
        <span className="text-[0.45rem] font-bold text-muted-foreground uppercase tracking-widest">Gevechtslog</span>
        <div className="h-px flex-1 bg-border/40" />
      </div>
      <div className="game-card max-h-28 overflow-y-auto game-scroll p-2.5 space-y-0.5">
        {logs.slice(-count).map((log, i) => (
          <CombatLogEntry key={`${turn}-${i}`} log={log} index={i} turn={turn} />
        ))}
      </div>
    </div>
  );
}
