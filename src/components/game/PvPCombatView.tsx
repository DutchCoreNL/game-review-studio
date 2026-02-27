import { useState, useEffect, useRef, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { PvPCombatState, CombatBuff } from '@/game/types';
import { COMBAT_SKILLS, COMBO_THRESHOLD, getAvailableSkills, isSkillOnCooldown, BUFF_DEFS } from '@/game/combatSkills';
import { GEAR, AMMO_TYPE_LABELS } from '@/game/constants';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { StatBar } from './ui/StatBar';
import { TypewriterText } from './animations/TypewriterText';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Shield, Zap, Heart, Skull, Trophy, Flame, Star, Crosshair } from 'lucide-react';
import { playHitSound, playHeavyHitSound, playDefendSound, playVictorySound, playDefeatSound } from '@/game/sounds';

// ========== Animated HP Bar ==========

function AnimatedHPBar({ label, current, max, color, flashColor }: {
  label: string; current: number; max: number; color: 'blood' | 'emerald'; flashColor: string;
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
        <span className="font-bold text-foreground">{label}</span>
        <motion.span
          key={current}
          initial={{ scale: 1.3, color: `hsl(var(--${flashColor}))` }}
          animate={{ scale: 1, color: 'hsl(var(--muted-foreground))' }}
          transition={{ duration: 0.4 }}
        >
          {current}/{max}
        </motion.span>
      </div>
      <StatBar value={current} max={max} color={color} height="lg" />
    </motion.div>
  );
}

// ========== Floating Damage Number ==========

function DamagePopup({ value, type }: { value: number; type: 'dealt' | 'taken' | 'heal' | 'crit' }) {
  const colorMap = { dealt: 'text-gold', taken: 'text-blood', heal: 'text-emerald', crit: 'text-gold' };
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: type === 'crit' ? 1.5 : 1 }}
      animate={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.8 }}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 font-bold text-sm ${colorMap[type]} pointer-events-none z-50`}
    >
      {type === 'heal' ? '+' : '-'}{value}
    </motion.div>
  );
}

// ========== Buff Indicator ==========

function BuffIndicators({ buffs }: { buffs: CombatBuff[] }) {
  if (buffs.length === 0) return null;
  return (
    <div className="flex gap-1 mt-1">
      {buffs.map((b, i) => (
        <motion.div
          key={`${b.id}-${i}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted border border-border text-[0.45rem]"
          title={BUFF_DEFS[b.id]?.effect || b.effect}
        >
          <span>{BUFF_DEFS[b.id]?.icon || '✨'}</span>
          <span className="text-muted-foreground">{b.duration}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ========== Combo Meter ==========

function ComboMeter({ count, threshold }: { count: number; threshold: number }) {
  const pct = Math.min(100, (count / threshold) * 100);
  const full = count >= threshold;
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-[0.5rem] mb-1">
        <span className="flex items-center gap-1 font-bold text-muted-foreground">
          <Flame size={8} className={full ? 'text-gold' : 'text-muted-foreground'} />
          COMBO
        </span>
        <span className={`font-bold ${full ? 'text-gold animate-pulse' : 'text-muted-foreground'}`}>
          {count}/{threshold}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${full ? 'bg-gold' : 'bg-gold/40'}`}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 200 }}
        />
      </div>
    </div>
  );
}

// ========== Skill Button ==========

function SkillButton({ skill, cooldown, onClick, disabled }: {
  skill: typeof COMBAT_SKILLS[0];
  cooldown: number;
  onClick: () => void;
  disabled: boolean;
}) {
  const onCd = cooldown > 0;
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || onCd}
      className={`relative py-2 px-2 rounded border text-[0.5rem] font-bold flex flex-col items-center gap-0.5
        ${onCd ? 'bg-muted/50 border-border text-muted-foreground opacity-50' : 'bg-game-purple/15 border-game-purple text-game-purple'}
      `}
      whileTap={!onCd && !disabled ? { scale: 0.92 } : {}}
    >
      <span className="text-sm">{skill.icon}</span>
      <span className="leading-tight text-center">{skill.name}</span>
      {onCd && (
        <div className="absolute inset-0 bg-background/60 rounded flex items-center justify-center">
          <span className="text-xs font-bold text-muted-foreground">{cooldown}</span>
        </div>
      )}
    </motion.button>
  );
}

// ========== Main PvP Combat View ==========

export function PvPCombatView() {
  const { state, dispatch } = useGame();
  const combat = state.activePvPCombat;
  const [lastDamage, setLastDamage] = useState<{ value: number; type: 'dealt' | 'taken' | 'heal' | 'crit'; key: number } | null>(null);
  const damageKey = useRef(0);
  const prevFinished = useRef(false);

  useEffect(() => {
    if (combat?.finished && !prevFinished.current) {
      if (combat.won) playVictorySound(); else playDefeatSound();
    }
    prevFinished.current = combat?.finished ?? false;
  }, [combat?.finished, combat?.won]);

  if (!combat) return null;

  const availableSkills = getAvailableSkills(combat.attackerLevel);
  const comboReady = combat.attackerComboCounter >= COMBO_THRESHOLD;

  const handleAction = (action: 'attack' | 'heavy' | 'defend' | 'combo_finisher', skillId?: string) => {
    const hpBefore = combat.attackerHP;
    const enemyHpBefore = combat.defenderHP;

    dispatch({ type: 'PVP_COMBAT_ACTION', action, skillId });

    // Show damage popup after state update
    setTimeout(() => {
      const newCombat = state.activePvPCombat;
      if (!newCombat) return;
      const dmgDealt = enemyHpBefore - newCombat.defenderHP;
      const dmgTaken = hpBefore - newCombat.attackerHP;
      if (dmgDealt > 0) {
        damageKey.current++;
        setLastDamage({ value: dmgDealt, type: dmgDealt > 20 ? 'crit' : 'dealt', key: damageKey.current });
      } else if (dmgTaken > 0) {
        damageKey.current++;
        setLastDamage({ value: dmgTaken, type: 'taken', key: damageKey.current });
      }
    }, 50);
  };

  return (
    <div className="relative min-h-[70vh] -mx-3 -mt-2 px-3 pt-2">
      <div className="absolute inset-0 bg-gradient-to-b from-blood/5 via-background to-background pointer-events-none" />
      <div className="relative z-10">
        {/* Turn indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={combat.turn}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center mb-2"
          >
            <span className="text-[0.5rem] font-bold text-muted-foreground tracking-widest uppercase">
              BEURT {combat.turn}
            </span>
          </motion.div>
        </AnimatePresence>

        <SectionHeader title="PVP GEVECHT" icon={<Swords size={12} />} />

        {/* HP Bars with buff indicators */}
        <div className="space-y-2 mb-3 relative">
          <AnimatedHPBar label={combat.attackerName} current={combat.attackerHP} max={combat.attackerMaxHP} color="emerald" flashColor="blood" />
          <BuffIndicators buffs={combat.attackerBuffs} />
          <AnimatedHPBar label={combat.defenderName} current={combat.defenderHP} max={combat.defenderMaxHP} color="blood" flashColor="gold" />
          <BuffIndicators buffs={combat.defenderBuffs} />

          {/* Floating damage */}
          <AnimatePresence>
            {lastDamage && (
              <DamagePopup key={lastDamage.key} value={lastDamage.value} type={lastDamage.type} />
            )}
          </AnimatePresence>
        </div>

        {/* Combo meter */}
        <ComboMeter count={combat.attackerComboCounter} threshold={COMBO_THRESHOLD} />

        {/* Gear comparison row */}
        <div className="flex justify-between text-[0.45rem] text-muted-foreground mb-3 px-1">
          <div className="flex gap-2">
            <span>💪 {combat.attackerStats.muscle}</span>
            <span>🧠 {combat.attackerStats.brains}</span>
            <span>✨ {combat.attackerStats.charm}</span>
          </div>
          <div className="flex gap-2">
            <span>💪 {combat.defenderStats.muscle}</span>
            <span>🧠 {combat.defenderStats.brains}</span>
            <span>✨ {combat.defenderStats.charm}</span>
          </div>
        </div>

        {/* Ammo indicator */}
        {(() => {
          const equippedWeaponId = state.player.loadout.weapon;
          const equippedWeapon = equippedWeaponId ? (GEAR.find(g => g.id === equippedWeaponId) ?? null) : null;
          const isMelee = equippedWeapon?.ammoType === null;
          if (isMelee) {
            return (
              <div className="text-center mb-2 text-[0.55rem] font-bold text-gold">
                ⚔️ {equippedWeapon?.name || 'Melee'} — Geen munitie nodig
              </div>
            );
          }
          const ammoType = equippedWeapon?.ammoType || '9mm';
          const ammoStock = state.ammoStock || { '9mm': state.ammo || 0, '7.62mm': 0, 'shells': 0 };
          const typeAmmo = ammoStock[ammoType] || 0;
          const typeLabel = AMMO_TYPE_LABELS[ammoType]?.label || ammoType;
          return (
            <div className={`flex items-center justify-center gap-2 mb-2 px-3 py-1.5 rounded ${typeAmmo <= 3 ? 'bg-blood/10 border border-blood/20' : 'bg-muted/50 border border-border'}`}>
              <Crosshair size={10} className={typeAmmo <= 3 ? 'text-blood' : 'text-muted-foreground'} />
              <span className={`text-[0.55rem] font-bold ${typeAmmo <= 3 ? 'text-blood' : 'text-muted-foreground'}`}>
                {typeLabel}: {typeAmmo}
                {equippedWeapon?.clipSize ? ` | Clip: ${equippedWeapon.clipSize}` : ''}
                {typeAmmo === 0 && <span className="text-blood animate-pulse ml-1">— MELEE MODUS (50%)</span>}
              </span>
            </div>
          );
        })()}

        {/* Combat Log */}
        <div className="game-card mb-3 max-h-28 overflow-y-auto game-scroll p-2">
          {combat.logs.slice(-8).map((log, i) => (
            <motion.p
              key={`${combat.turn}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-[0.55rem] py-0.5 ${
                log.includes('verslagen') || log.includes('STUNNED') || log.includes('KRITIEK') || log.includes('COMBO')
                  ? 'text-gold font-bold'
                  : log.includes('mislukt') || log.includes('mist')
                  ? 'text-blood'
                  : log.includes('hersteld') || log.includes('Laatste Adem')
                  ? 'text-emerald'
                  : 'text-muted-foreground'
              }`}
            >
              {log}
            </motion.p>
          ))}
        </div>

        {/* Actions */}
        {!combat.finished ? (
          <>
            {/* Base actions */}
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <motion.button
                onClick={() => { playHitSound(); handleAction('attack'); }}
                className="py-2.5 rounded bg-blood text-primary-foreground font-bold text-[0.55rem] flex flex-col items-center gap-0.5"
                whileTap={{ scale: 0.92 }}
              >
                <Swords size={14} />
                <span>AANVAL</span>
              </motion.button>
              <motion.button
                onClick={() => { playHeavyHitSound(); handleAction('heavy'); }}
                className="py-2.5 rounded bg-gold/15 border border-gold text-gold font-bold text-[0.55rem] flex flex-col items-center gap-0.5"
                whileTap={{ scale: 0.92 }}
              >
                <Zap size={14} />
                <span>ZWAAR</span>
              </motion.button>
              <motion.button
                onClick={() => { playDefendSound(); handleAction('defend'); }}
                className="py-2.5 rounded bg-muted border border-border text-foreground font-bold text-[0.55rem] flex flex-col items-center gap-0.5"
                whileTap={{ scale: 0.92 }}
              >
                <Shield size={14} />
                <span>VERDEDIG</span>
              </motion.button>
            </div>

            {/* Combo finisher */}
            <AnimatePresence>
              {comboReady && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-2"
                >
                  <motion.button
                    onClick={() => { playHeavyHitSound(); handleAction('combo_finisher'); }}
                    className="w-full py-2.5 rounded bg-gradient-to-r from-gold to-gold/70 text-background font-bold text-xs flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.95 }}
                    animate={{ boxShadow: ['0 0 10px hsl(var(--gold)/0.3)', '0 0 20px hsl(var(--gold)/0.5)', '0 0 10px hsl(var(--gold)/0.3)'] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Flame size={14} />
                    COMBO FINISHER
                    <Flame size={14} />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Skills */}
            {availableSkills.length > 0 && (
              <div className="grid grid-cols-4 gap-1">
                {availableSkills.map(skill => (
                  <SkillButton
                    key={skill.id}
                    skill={skill}
                    cooldown={combat.attackerSkillCooldowns[skill.id] || 0}
                    disabled={combat.finished}
                    onClick={() => {
                      playHitSound();
                      dispatch({ type: 'PVP_COMBAT_ACTION', action: 'skill', skillId: skill.id });
                    }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Combat Result */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              className={`text-2xl font-bold font-display mb-3 ${combat.won ? 'text-gold gold-text-glow' : 'text-blood blood-text-glow'}`}
            >
              {combat.won ? '🏆 OVERWINNING!' : '💀 VERSLAGEN'}
            </motion.div>

            {/* Stats summary */}
            <div className="game-card mb-4 text-left">
              <div className="grid grid-cols-2 gap-2 text-[0.55rem]">
                <div>
                  <span className="text-muted-foreground">Schade Gegeven:</span>
                  <span className="text-gold font-bold ml-1">{combat.damageDealt}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Schade Ontvangen:</span>
                  <span className="text-blood font-bold ml-1">{combat.damageTaken}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Skills Gebruikt:</span>
                  <span className="text-game-purple font-bold ml-1">{combat.skillsUsed}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Combo's:</span>
                  <span className="text-gold font-bold ml-1">{combat.combosLanded}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Beurten:</span>
                  <span className="font-bold ml-1">{combat.turn}</span>
                </div>
              </div>
            </div>

            {combat.won && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="text-xs text-gold mb-4">+XP | +REP | Geld gestolen!</motion.p>
            )}

            {/* Near-miss feedback */}
            {!combat.won && combat.defenderHP > 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="text-[0.55rem] text-muted-foreground mb-3 bg-blood/10 border border-blood/20 rounded px-3 py-2">
                💢 Vijand had nog <span className="text-blood font-bold">{combat.defenderHP} HP</span> over
                {combat.defenderHP <= 10 ? ' — zo dichtbij!' : combat.defenderHP <= 25 ? '. Gebruik meer skills!' : '.'}
              </motion.p>
            )}

            <GameButton variant="gold" size="lg" fullWidth glow onClick={() => dispatch({ type: 'END_PVP_COMBAT' })}>
              DOORGAAN
            </GameButton>
          </motion.div>
        )}
      </div>
    </div>
  );
}
