import { useGame } from '@/contexts/GameContext';
import { FAMILIES, BOSS_DATA, COMBAT_ENVIRONMENTS, BOSS_COMBAT_OVERRIDES, CONQUEST_COMBAT_OVERRIDES, GEAR } from '@/game/constants';
import { WEAPON_RARITY_COLORS, WEAPON_RARITY_LABEL } from '@/game/weaponGenerator';
import { BOSS_PHASES, FINAL_BOSS_COMBAT_OVERRIDES } from '@/game/endgame';
import { FamilyId, DistrictId, CombatStance } from '@/game/types';
import { BOSS_IMAGES, DISTRICT_IMAGES } from '@/assets/items';
import { NemesisDefeatPopup } from './map/NemesisDefeatPopup';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { StatBar } from './ui/StatBar';
import { GameBadge } from './ui/GameBadge';
import { TypewriterText } from './animations/TypewriterText';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Shield, Zap, MapPin, Heart, Skull, Crown, AlertTriangle, Crosshair, Flame, Trophy, Star } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { playHitSound, playHeavyHitSound, playDefendSound, playVictorySound, playDefeatSound } from '@/game/sounds';
import { getAvailableSkills, isSkillOnCooldown, COMBO_THRESHOLD, BUFF_DEFS, STANCE_MODIFIERS } from '@/game/combatSkills';
import { RARITY_COLORS, RARITY_BG, getStreakLabel } from '@/game/combatLoot';

// ========== Stance Selector ==========

const STANCES: CombatStance[] = ['aggressive', 'balanced', 'defensive'];
const STANCE_COLORS: Record<CombatStance, string> = {
  aggressive: 'border-blood text-blood bg-blood/10',
  balanced: 'border-gold text-gold bg-gold/10',
  defensive: 'border-emerald text-emerald bg-emerald/10',
};
const STANCE_ACTIVE_COLORS: Record<CombatStance, string> = {
  aggressive: 'border-blood bg-blood text-primary-foreground',
  balanced: 'border-gold bg-gold text-background',
  defensive: 'border-emerald bg-emerald text-primary-foreground',
};

function StanceSelector({ current, onChange, disabled }: {
  current: CombatStance;
  onChange: (s: CombatStance) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1.5 mb-3 justify-center">
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

// ========== Floating Damage Number ==========

interface DamagePopupData {
  id: number;
  value: number;
  type: 'dealt' | 'taken' | 'heal' | 'crit';
}

function DamagePopup({ value, type }: { value: number; type: 'dealt' | 'taken' | 'heal' | 'crit' }) {
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

// ========== Action Card (Categorized) ==========

function ActionCard({ icon, title, desc, borderColor, bgColor, onClick, glow }: {
  icon: React.ReactNode; title: string; desc: string; borderColor: string; bgColor: string; onClick: () => void; glow?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full p-2 rounded-lg border ${borderColor} ${bgColor} text-left transition-all group relative overflow-hidden ${glow ? 'shadow-lg shadow-gold/20 animate-pulse' : ''}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-background/60 border border-border/40 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[0.55rem] font-bold text-foreground leading-tight">{title}</p>
          <p className="text-[0.4rem] text-muted-foreground leading-tight">{desc}</p>
        </div>
      </div>
    </motion.button>
  );
}

// ========== Combat Action Button (legacy) ==========

function CombatAction({ icon, label, sub, onClick, variant }: {
  icon: React.ReactNode; label: string; sub: string; onClick: () => void; variant: string;
}) {
  const [impactPulse, setImpactPulse] = useState(false);

  const styles: Record<string, string> = {
    blood: 'bg-blood text-primary-foreground',
    gold: 'bg-gold/15 border border-gold text-gold',
    muted: 'bg-muted border border-border text-foreground',
    purple: 'bg-game-purple/15 border border-game-purple text-game-purple',
    ice: 'bg-ice/15 border border-ice text-ice',
  };

  const handleClick = () => {
    setImpactPulse(true);
    setTimeout(() => setImpactPulse(false), 200);
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`py-3 rounded ${styles[variant] || styles.muted} font-bold text-xs flex flex-col items-center gap-0.5 relative overflow-hidden`}
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

// ========== Animated HP Bar ==========

function AnimatedHPBar({ label, current, max, color, flashColor }: {
  label: string; current: number; max: number; color: 'blood' | 'gold' | 'emerald' | 'purple' | 'ice' | 'auto'; flashColor: string;
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

// ========== Skill Buttons ==========

function SkillButtons({ combat, dispatch, playerLevel }: {
  combat: { skillCooldowns: Record<string, number>; finished: boolean };
  dispatch: (action: any) => void;
  playerLevel: number;
}) {
  const skills = useMemo(() => getAvailableSkills(playerLevel), [playerLevel]);
  const activeSkills = skills.filter(s => s.effect.type !== 'emergency_heal');

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
          const onCooldown = isSkillOnCooldown(skill.id, combat.skillCooldowns);
          const cd = combat.skillCooldowns[skill.id] || 0;
          return (
            <motion.button
              key={skill.id}
              disabled={onCooldown || combat.finished}
              onClick={() => {
                if (!onCooldown) {
                  playHitSound();
                  dispatch({ type: 'COMBAT_ACTION', action: 'skill', skillId: skill.id });
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

// ========== Enhanced Combat Log Entry ==========

function CombatLogEntry({ log, index, turn }: { log: string; index: number; turn: number }) {
  const isCrit = log.includes('KRITIEK') || log.includes('COMBO FINISHER') || log.includes('EXECUTIE');
  const isVictory = log.includes('verslagen') || log.includes('STUNNED') || log.includes('geslaagd');
  const isDefeat = log.includes('mislukt') || log.includes('Je bent verslagen');
  const isEnemyAttack = log.includes('slaat terug') || log.includes('valt aan');
  const isHeal = log.includes('+') && log.includes('HP');
  const isBossDialogue = log.startsWith('Decker:') || log.startsWith('Voss:');

  // Add icon prefix based on log type
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

// ========== Turn Indicator ==========

function TurnIndicator({ turn }: { turn: number }) {
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

// ========== Streak Indicator ==========

function StreakIndicator({ streak }: { streak: number }) {
  const label = getStreakLabel(streak);
  if (!label || streak < 3) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-2 mb-2"
    >
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30">
        <Flame size={10} className="text-gold" />
        <span className="text-[0.55rem] font-bold text-gold">{label}</span>
        <span className="text-[0.5rem] text-gold/70">×{streak}</span>
      </div>
    </motion.div>
  );
}

// ========== Active Combat View ==========

function ActiveCombat() {
  const { state, dispatch } = useGame();
  const combat = state.activeCombat!;
  const prevFinished = useRef(false);
  const prevPlayerHP = useRef(combat.playerHP);
  const prevEnemyHP = useRef(combat.targetHP);
  const [damagePopups, setDamagePopups] = useState<DamagePopupData[]>([]);
  const popupIdRef = useRef(0);

  // Track damage popups
  useEffect(() => {
    const playerDelta = prevPlayerHP.current - combat.playerHP;
    const enemyDelta = prevEnemyHP.current - combat.targetHP;

    const newPopups: DamagePopupData[] = [];

    if (enemyDelta > 0) {
      const lastLog = combat.logs[combat.logs.length - 1] || '';
      const isCrit = lastLog.includes('KRITIEK') || lastLog.includes('COMBO FINISHER') || lastLog.includes('EXECUTIE');
      newPopups.push({
        id: popupIdRef.current++,
        value: enemyDelta,
        type: isCrit ? 'crit' : 'dealt',
      });
    }

    if (playerDelta > 0) {
      newPopups.push({
        id: popupIdRef.current++,
        value: playerDelta,
        type: 'taken',
      });
    }

    if (playerDelta < 0) {
      // Player healed
      newPopups.push({
        id: popupIdRef.current++,
        value: Math.abs(playerDelta),
        type: 'heal',
      });
    }

    if (newPopups.length > 0) {
      setDamagePopups(prev => [...prev, ...newPopups]);
      setTimeout(() => {
        setDamagePopups(prev => prev.filter(p => !newPopups.find(n => n.id === p.id)));
      }, 900);
    }

    prevPlayerHP.current = combat.playerHP;
    prevEnemyHP.current = combat.targetHP;
  }, [combat.playerHP, combat.targetHP, combat.turn]);

  useEffect(() => {
    if (combat?.finished && !prevFinished.current) {
      if (combat.won) playVictorySound(); else playDefeatSound();
    }
    prevFinished.current = combat?.finished ?? false;
  }, [combat?.finished, combat?.won]);

  const isBossFight = !!combat.bossPhase;
  const phaseData = combat.bossPhase ? BOSS_PHASES[combat.bossPhase - 1] : null;

  const env = useMemo(() => {
    const baseEnv = COMBAT_ENVIRONMENTS[state.loc];
    const factionBossOverride = combat.isBoss && combat.familyId ? BOSS_COMBAT_OVERRIDES[combat.familyId as FamilyId] : null;
    const conquestOverride = combat.conquestPhase && combat.familyId ? CONQUEST_COMBAT_OVERRIDES[combat.familyId as FamilyId]?.[combat.conquestPhase] : null;
    const finalBossOverride = combat.bossPhase ? FINAL_BOSS_COMBAT_OVERRIDES[combat.bossPhase] : null;
    const override = finalBossOverride || factionBossOverride || conquestOverride;
    return override && baseEnv
      ? { ...baseEnv, actions: override.actions, enemyAttackLogs: override.enemyAttackLogs, scenePhrases: override.scenePhrases }
      : baseEnv;
  }, [state.loc, combat.isBoss, combat.familyId, combat.bossPhase, combat.conquestPhase]);

  const scenePhrase = useMemo(() => {
    if (!env) return null;
    return env.scenePhrases[combat.turn % env.scenePhrases.length];
  }, [env, combat.turn]);

  const bgSrc = DISTRICT_IMAGES[state.loc] || DISTRICT_IMAGES.neon;

  const procWeapon = state.weaponInventory?.find(w => w.equipped);
  const legacyWeaponId = state.player.loadout.weapon;
  const legacyWeapon = legacyWeaponId ? (GEAR.find(g => g.id === legacyWeaponId) ?? null) : null;
  const isMeleeWeapon = procWeapon ? procWeapon.frame === 'blade' : (legacyWeapon?.ammoType === null);
  const weaponName = procWeapon?.name || legacyWeapon?.name || 'Vuisten';

  return (
    <div className="relative min-h-[70vh] -mx-3 -mt-2 px-3 pt-2">
      <img src={bgSrc} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40 pointer-events-none" />
      <div className="relative z-10">

      {/* ═══ CINEMATIC SCENE HEADER ═══ */}
      <div className="relative rounded-xl overflow-hidden border border-border/40 mb-3">
        <img src={bgSrc} alt="" className="w-full h-36 object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

        {/* Player info - bottom left */}
        <div className="absolute bottom-2 left-2.5">
          <p className="text-[0.6rem] font-bold text-foreground">Jij</p>
          <p className="text-[0.45rem] text-muted-foreground">Lvl {state.player.level} • {weaponName}</p>
          <div className="flex gap-1.5 mt-0.5">
            <span className="text-[0.4rem] text-blood font-bold">💪{state.player.stats.muscle}</span>
            <span className="text-[0.4rem] text-primary font-bold">🧠{state.player.stats.brains}</span>
            <span className="text-[0.4rem] text-gold font-bold">✨{state.player.stats.charm}</span>
          </div>
        </div>

        {/* Enemy info - bottom right */}
        <div className="absolute bottom-2 right-2.5 text-right">
          {(combat.isBoss || isBossFight) && BOSS_IMAGES[isBossFight ? (combat.bossPhase === 2 ? 'decker' : 'voss') : (combat.familyId || '')] && (
            <div className="w-10 h-10 rounded-full border-2 border-blood overflow-hidden shadow-lg shadow-blood/30 ml-auto mb-1">
              <img src={BOSS_IMAGES[isBossFight ? (combat.bossPhase === 2 ? 'decker' : 'voss') : (combat.familyId || '')]} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <p className="text-[0.6rem] font-bold text-blood">{combat.targetName}</p>
          <p className="text-[0.45rem] text-muted-foreground">HP {combat.targetHP}/{combat.enemyMaxHP}</p>
        </div>

        {/* Scene text overlay - top center */}
        {scenePhrase && (
          <div className="absolute top-2 left-3 right-3">
            <TypewriterText
              text={scenePhrase}
              speed={18}
              className="text-[0.5rem] italic text-muted-foreground/80 leading-relaxed"
              key={combat.turn}
            />
          </div>
        )}

        {/* Boss phase badge - top right */}
        {isBossFight && phaseData && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-blood/20 border border-blood/40">
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>
              <AlertTriangle size={8} className="text-blood" />
            </motion.div>
            <span className="text-[0.45rem] font-bold text-blood uppercase">{phaseData.title}</span>
          </div>
        )}

        {/* Streak badge - top left */}
        {(state.combatStreak || 0) >= 3 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/20 border border-gold/40">
            <Flame size={8} className="text-gold" />
            <span className="text-[0.45rem] font-bold text-gold">{getStreakLabel(state.combatStreak || 0)} ×{state.combatStreak}</span>
          </div>
        )}
      </div>

      {/* ═══ TURN INDICATOR ═══ */}
      <TurnIndicator turn={combat.turn} />

      {/* ═══ SIDE-BY-SIDE HP BARS ═══ */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Player HP */}
        <div className="relative">
          <AnimatePresence>
            {damagePopups.filter(p => p.type === 'taken' || p.type === 'heal').map(popup => (
              <div key={popup.id} className="absolute top-0 left-1/2 -translate-x-1/2 z-50">
                <DamagePopup value={popup.value} type={popup.type} />
              </div>
            ))}
          </AnimatePresence>
          <AnimatedHPBar label="Jij" current={combat.playerHP} max={combat.playerMaxHP} color="emerald" flashColor="blood" />
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-[0.4rem] font-bold px-1.5 py-0.5 rounded-full border ${STANCE_ACTIVE_COLORS[combat.stance]}`}>
              {STANCE_MODIFIERS[combat.stance].icon} {STANCE_MODIFIERS[combat.stance].label}
            </span>
          </div>
        </div>

        {/* Enemy HP */}
        <div className="relative">
          <AnimatePresence>
            {damagePopups.filter(p => p.type === 'dealt' || p.type === 'crit').map(popup => (
              <div key={popup.id} className="absolute top-0 left-1/2 -translate-x-1/2 z-50">
                <DamagePopup value={popup.value} type={popup.type} />
              </div>
            ))}
          </AnimatePresence>
          <AnimatedHPBar label={combat.targetName} current={combat.targetHP} max={combat.enemyMaxHP} color="blood" flashColor="gold" />
        </div>
      </div>

      {/* Combo meter inline */}
      {combat.comboCounter > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-0.5">
            <Flame size={9} className="text-gold" />
            <span className="text-[0.45rem] font-bold text-gold uppercase tracking-wider">
              Combo {combat.comboCounter}/{COMBO_THRESHOLD}
            </span>
          </div>
          <div className="relative h-1.5 bg-muted rounded overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold to-blood rounded"
              animate={{ width: `${Math.min(100, (combat.comboCounter / COMBO_THRESHOLD) * 100)}%` }}
              transition={{ type: 'spring', stiffness: 200 }}
            />
          </div>
        </div>
      )}

      {/* Active Buffs inline */}
      {combat.activeBuffs.length > 0 && (
        <div className="flex gap-1 mb-3 flex-wrap">
          {combat.activeBuffs.map((buff, i) => (
            <motion.div
              key={`${buff.id}-${i}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gold/10 border border-gold/30"
            >
              <span className="text-[0.45rem]">{BUFF_DEFS[buff.id]?.icon || '✨'}</span>
              <span className="text-[0.4rem] text-gold font-bold">{buff.duration}t</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* ═══ COMBAT LOG ═══ */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[0.45rem] font-bold text-muted-foreground uppercase tracking-widest">Gevechtslog</span>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        <div className="game-card max-h-28 overflow-y-auto game-scroll p-2.5 space-y-0.5">
          {combat.logs.slice(-6).map((log, i) => (
            <CombatLogEntry key={`${combat.turn}-${i}`} log={log} index={i} turn={combat.turn} />
          ))}
        </div>
      </div>

      {/* ═══ ACTIONS ═══ */}
      {!combat.finished ? (
        <div className="space-y-2">
          {/* Weapon info compact */}
          {procWeapon && (
            <div className="flex items-center justify-center gap-3 text-[0.45rem] text-muted-foreground">
              <span className={`font-bold ${WEAPON_RARITY_COLORS[procWeapon.rarity]}`}>{procWeapon.name}</span>
              <span>⚔️{procWeapon.damage}</span>
              <span>🎯{procWeapon.accuracy}</span>
              <span>💥{procWeapon.critChance}%</span>
              {!isMeleeWeapon && <span className={(state.ammo || 0) <= 10 ? 'text-blood font-bold' : ''}>🔫{state.ammo || 0}</span>}
            </div>
          )}

          {/* ═══ CATEGORIZED ACTION CARDS ═══ */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* DIRECTE ACTIE */}
            <div className="space-y-1.5">
              <p className="text-[0.4rem] font-bold text-blood uppercase tracking-widest flex items-center gap-1">
                <Swords size={7} /> Direct
              </p>
              <ActionCard
                icon={<Swords size={12} className="text-blood" />}
                title={env?.actions.attack.label || "Aanval"}
                desc={env?.actions.attack.desc || "Betrouwbaar"}
                borderColor="border-blood/40"
                bgColor="bg-blood/5 hover:bg-blood/15"
                onClick={() => { playHitSound(); dispatch({ type: 'COMBAT_ACTION', action: 'attack' }); }}
              />
              <ActionCard
                icon={<Zap size={12} className="text-gold" />}
                title={env?.actions.heavy.label || "Zware Klap"}
                desc={env?.actions.heavy.desc || "Krachtig"}
                borderColor="border-gold/40"
                bgColor="bg-gold/5 hover:bg-gold/15"
                onClick={() => { playHeavyHitSound(); dispatch({ type: 'COMBAT_ACTION', action: 'heavy' }); }}
              />
            </div>

            {/* TACTISCH */}
            <div className="space-y-1.5">
              <p className="text-[0.4rem] font-bold text-emerald uppercase tracking-widest flex items-center gap-1">
                <Shield size={7} /> Tactisch
              </p>
              <ActionCard
                icon={<Shield size={12} className="text-emerald" />}
                title={env?.actions.defend.label || "Verdedig"}
                desc={env?.actions.defend.desc || "Block + Heal"}
                borderColor="border-emerald/40"
                bgColor="bg-emerald/5 hover:bg-emerald/15"
                onClick={() => { playDefendSound(); dispatch({ type: 'COMBAT_ACTION', action: 'defend' }); }}
              />
              <ActionCard
                icon={<MapPin size={12} className="text-game-purple" />}
                title={env?.actions.environment.label || "Omgeving"}
                desc={env?.actions.environment.desc || "Stun kans"}
                borderColor="border-game-purple/40"
                bgColor="bg-game-purple/5 hover:bg-game-purple/15"
                onClick={() => { playHitSound(); dispatch({ type: 'COMBAT_ACTION', action: 'environment' }); }}
              />
            </div>
          </div>

          {/* STRATEGISCH row */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <p className="text-[0.4rem] font-bold text-ice uppercase tracking-widest flex items-center gap-1 mb-1.5">
                <Crosshair size={7} /> Strategisch
              </p>
              {env && (
                <ActionCard
                  icon={<Crosshair size={12} className="text-ice" />}
                  title={env.actions.tactical.label}
                  desc={`${env.actions.tactical.desc} (${env.actions.tactical.stat.toUpperCase()})`}
                  borderColor="border-ice/40"
                  bgColor="bg-ice/5 hover:bg-ice/15"
                  onClick={() => { playHitSound(); dispatch({ type: 'COMBAT_ACTION', action: 'tactical' }); }}
                />
              )}
            </div>

            {/* SPECIAAL */}
            <div>
              <p className="text-[0.4rem] font-bold text-gold uppercase tracking-widest flex items-center gap-1 mb-1.5">
                <Flame size={7} /> Speciaal
              </p>
              {combat.comboCounter >= COMBO_THRESHOLD ? (
                <ActionCard
                  icon={<Flame size={12} className="text-gold" />}
                  title="Combo Finisher"
                  desc="Massieve schade + stun"
                  borderColor="border-gold/40"
                  bgColor="bg-gold/10 hover:bg-gold/20"
                  glow
                  onClick={() => { playHeavyHitSound(); dispatch({ type: 'COMBAT_ACTION', action: 'combo_finisher' }); }}
                />
              ) : (
                <div className="p-2 rounded-lg border border-border/30 bg-muted/5 text-center opacity-40">
                  <Flame size={12} className="text-muted-foreground mx-auto mb-0.5" />
                  <p className="text-[0.45rem] text-muted-foreground">Combo nodig</p>
                  <p className="text-[0.4rem] text-muted-foreground/60">{combat.comboCounter}/{COMBO_THRESHOLD}</p>
                </div>
              )}
            </div>
          </div>

          {/* Stance Selector */}
          <div>
            <p className="text-[0.4rem] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 text-center">Houding</p>
            <StanceSelector
              current={combat.stance}
              onChange={(s) => dispatch({ type: 'SET_COMBAT_STANCE', stance: s })}
              disabled={combat.finished}
            />
          </div>

          {/* Skill Buttons */}
          <SkillButtons combat={combat} dispatch={dispatch} playerLevel={state.player.level} />
        </div>
      ) : (
        <CombatResult />
      )}
      </div>
    </div>
  );
}

// ========== Combat Result ==========

const RATING_COLORS: Record<string, string> = {
  S: 'text-gold',
  A: 'text-emerald',
  B: 'text-blue-400',
  C: 'text-muted-foreground',
  D: 'text-blood',
};

function CombatResult() {
  const { state, dispatch } = useGame();
  const combat = state.activeCombat!;
  const loot = state.lastCombatLoot;
  const stats = state.lastCombatStats;
  const rating = state.lastCombatRating;
  const [revealIndex, setRevealIndex] = useState(-1);

  // Animated loot reveal
  useEffect(() => {
    if (!loot || !combat.won) return;
    const items = loot.items;
    let i = 0;
    const interval = setInterval(() => {
      setRevealIndex(i);
      i++;
      if (i >= items.length) clearInterval(interval);
    }, 400);
    return () => clearInterval(interval);
  }, [loot, combat.won]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="text-center"
    >
      {combat.won && combat.bossPhase === 1 ? (
        <>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="text-xl font-bold font-display mb-3 text-gold gold-text-glow">
            ⚡ FASE 1 VOLTOOID
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-xs text-muted-foreground mb-2">
            SWAT-Commandant Voss is uitgeschakeld.
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-xs text-blood font-bold mb-4">
            Maar Commissaris Decker verschijnt persoonlijk...
          </motion.p>
          <GameButton variant="blood" size="lg" fullWidth glow onClick={() => dispatch({ type: 'START_BOSS_PHASE_2' })}>
            CONFRONTEER DECKER →
          </GameButton>
        </>
      ) : (
        <>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className={`text-2xl font-bold font-display mb-3 ${combat.won ? 'text-gold gold-text-glow' : 'text-blood blood-text-glow'}`}>
            {combat.won
              ? combat.bossPhase === 2 ? '🌆 NOXHAVEN IS VAN JOU!' : '🏆 OVERWINNING!'
              : '💀 VERSLAGEN'}
          </motion.div>

          {/* Combat Rating */}
          {combat.won && rating && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="mb-3"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border">
                <Star size={14} className={RATING_COLORS[rating] || 'text-muted-foreground'} />
                <span className={`text-3xl font-black font-display ${RATING_COLORS[rating]}`}>{rating}</span>
                <span className="text-[0.5rem] text-muted-foreground uppercase">Rating</span>
              </div>
            </motion.div>
          )}

          {/* Combat Stats */}
          {combat.won && stats && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-3 game-card p-3 text-left"
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[0.55rem]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Schade gegeven</span>
                  <span className="text-gold font-bold">{stats.damageDealt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Schade ontvangen</span>
                  <span className="text-blood font-bold">{stats.damageTaken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Beurten</span>
                  <span className="font-bold">{stats.turnsUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HP resterend</span>
                  <span className="text-emerald font-bold">{stats.playerHPPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Skills gebruikt</span>
                  <span className="text-game-purple font-bold">{stats.skillsUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Combo's</span>
                  <span className="text-gold font-bold">{stats.combosLanded}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Streak bonus */}
          {combat.won && loot && loot.streakBonus > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-2"
            >
              <span className="text-[0.55rem] font-bold text-gold">
                🔥 Streak Bonus: +{Math.round((loot.streakBonus - 1) * 100)}% loot
              </span>
            </motion.div>
          )}

          {/* Loot reveal */}
          {combat.won && loot && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-4 space-y-1.5"
            >
              <div className="text-[0.5rem] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Buit
              </div>
              {loot.items.map((item, i) => (
                <AnimatePresence key={item.id}>
                  {i <= revealIndex && (
                    <motion.div
                      initial={{ opacity: 0, x: -20, scale: 0.8 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded border ${RARITY_BG[item.rarity]}`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      <div className="flex-1 text-left">
                        <span className={`text-[0.6rem] font-bold ${RARITY_COLORS[item.rarity]}`}>{item.name}</span>
                        <span className="text-[0.45rem] text-muted-foreground ml-2">{item.desc}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </motion.div>
          )}

          {/* Near-miss feedback on defeat */}
          {!combat.won && combat.targetHP > 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="text-[0.6rem] text-muted-foreground mb-2 bg-blood/10 border border-blood/20 rounded px-3 py-2">
              💢 Vijand had nog <span className="text-blood font-bold">{combat.targetHP} HP</span> over
              {combat.targetHP <= 15
                ? ' — bijna! Sterkere wapens hadden het verschil gemaakt.'
                : combat.targetHP <= 30
                  ? '. Upgrade je gear of gebruik tactische acties.'
                  : '. Je hebt meer kracht of een beter wapen nodig.'}
            </motion.p>
          )}
          {combat.won && combat.bossPhase === 2 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="text-xs text-gold mb-4">+€100.000 | +500 REP | +500 XP | Heat gereset</motion.p>
          )}
          <GameButton variant="gold" size="lg" fullWidth glow onClick={() => dispatch({ type: 'END_COMBAT' })}>
            DOORGAAN
          </GameButton>
        </>
      )}
    </motion.div>
  );
}

// ========== Combat Menu ==========

function CombatMenu() {
  const { state, dispatch, showToast } = useGame();

  return (
    <div>
      <SectionHeader title="Factieleiders Uitdagen" icon={<Crown size={12} />} />
      <p className="text-[0.55rem] text-muted-foreground mb-4">
        Versla alle 3 leiders om Kingpin te worden. Je moet in hun district zijn met relatie {'<'} -20.
      </p>

      <div className="space-y-3">
        {(Object.keys(FAMILIES) as FamilyId[]).map(fid => {
          const fam = FAMILIES[fid];
          const boss = BOSS_DATA[fid];
          const defeated = state.leadersDefeated.includes(fid);
          const rel = state.familyRel[fid] || 0;
          const isInDistrict = state.loc === fam.home;
          const canFight = !defeated && isInDistrict && rel <= -20;

          return (
            <motion.div
              key={fid}
              className={`game-card border-l-[3px] ${defeated ? 'opacity-50' : ''}`}
              style={{ borderLeftColor: defeated ? '#444' : fam.color }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded bg-muted border border-border overflow-hidden shrink-0">
                    {BOSS_IMAGES[fid] ? (
                      <img src={BOSS_IMAGES[fid]} alt={boss.name} className={`w-full h-full object-cover ${defeated ? 'grayscale' : ''}`} />
                    ) : (
                      defeated ? <Skull size={14} className="text-muted-foreground w-full h-full flex items-center justify-center" /> : <Crown size={14} style={{ color: fam.color }} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs">{boss.name}</h4>
                      <GameBadge variant={defeated ? 'muted' : 'blood'}>{fam.name}</GameBadge>
                    </div>
                  <p className="text-[0.5rem] text-muted-foreground mt-1">{boss.desc}</p>
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-[0.5rem] text-blood font-semibold flex items-center gap-0.5"><Heart size={8} /> {boss.hp}</span>
                    <span className="text-[0.5rem] text-gold font-semibold flex items-center gap-0.5"><Swords size={8} /> {boss.attack}</span>
                    <span className="text-[0.5rem] text-muted-foreground">Rel: {rel}</span>
                  </div>
                  </div>
                </div>
              </div>

              {defeated ? (
                <div className="mt-2 text-center py-1.5 rounded bg-muted text-[0.55rem] text-muted-foreground font-bold">✓ VERSLAGEN</div>
              ) : (
                <GameButton variant={canFight ? 'blood' : 'muted'} size="sm" fullWidth disabled={!canFight}
                  glow={canFight} className="mt-2"
                  onClick={() => {
                    if (!isInDistrict) { showToast(`Reis eerst naar ${fam.home}`, true); return; }
                    if (rel > -20) { showToast('Relatie moet onder -20 zijn', true); return; }
                    dispatch({ type: 'START_COMBAT', familyId: fid });
                  }}>
                  {!isInDistrict ? `REIS NAAR ${fam.home.toUpperCase()}` : rel > -20 ? `REL TE HOOG (${rel})` : 'UITDAGEN'}
                </GameButton>
              )}
            </motion.div>
          );
        })}
      </div>

      {state.leadersDefeated.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gold font-bold">{state.leadersDefeated.length}/3 Leiders Verslagen</p>
          <div className="flex justify-center gap-1.5 mt-2">
            {(Object.keys(FAMILIES) as FamilyId[]).map(fid => (
              <div key={fid} className={`w-8 h-8 rounded flex items-center justify-center text-sm ${
                state.leadersDefeated.includes(fid) ? 'bg-gold text-secondary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {state.leadersDefeated.includes(fid) ? '👑' : '?'}
              </div>
            ))}
          </div>
        </div>
      )}

      {state.freePlayMode && (
        <div className="mt-4 game-card border-gold text-center">
          <p className="text-xs text-gold font-bold font-display">🌆 VRIJ SPELEN MODUS</p>
          <p className="text-[0.5rem] text-muted-foreground">Je hebt Noxhaven veroverd. Speel door zo lang je wilt.</p>
        </div>
      )}
    </div>
  );
}

// ========== Main Export ==========

export function CombatView() {
  const { state } = useGame();
  return (
    <>
      {state.activeCombat ? <ActiveCombat /> : <CombatMenu />}
      <NemesisDefeatPopup />
    </>
  );
}
