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

// ========== Combat Action Button ==========

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

  return (
    <div className="relative min-h-[70vh] -mx-3 -mt-2 px-3 pt-2">
      <img src={bgSrc} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30 pointer-events-none" />
      <div className="relative z-10">
      {/* Streak indicator */}
      <StreakIndicator streak={state.combatStreak || 0} />

      {/* Boss phase indicator */}
      {isBossFight && phaseData && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-blood/10 border border-blood/30">
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>
              <AlertTriangle size={10} className="text-blood" />
            </motion.div>
            <span className="text-[0.55rem] font-bold text-blood tracking-wider uppercase">
              {phaseData.title}
            </span>
            {combat.bossPhase === 1 && (
              <span className="text-[0.45rem] text-muted-foreground">→ Fase 2 volgt</span>
            )}
          </div>
        </motion.div>
      )}

      <SectionHeader title={isBossFight ? "EINDBAAS GEVECHT" : "GEVECHT"} icon={<Swords size={12} />} />

      {/* Turn indicator */}
      <TurnIndicator turn={combat.turn} />

      {/* Scene description with typewriter */}
      {scenePhrase && (
        <motion.div
          key={combat.turn}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="game-card mb-3 p-2.5 border-l-2 border-gold/40"
        >
          <TypewriterText
            text={scenePhrase}
            speed={18}
            className="text-[0.55rem] italic text-muted-foreground leading-relaxed"
          />
        </motion.div>
      )}

      {/* Enemy portrait + HP Bars */}
      <div className="relative">
        {(combat.isBoss || isBossFight) && (
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full border-2 border-blood overflow-hidden shadow-lg shadow-blood/30">
              <img
                src={isBossFight
                  ? (combat.bossPhase === 2 ? BOSS_IMAGES.decker : BOSS_IMAGES.voss)
                  : BOSS_IMAGES[combat.familyId || '']
                }
                alt={combat.targetName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Floating damage popups on enemy */}
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

        <div className="h-2" />

        {/* Floating damage popups on player */}
        <div className="relative">
          <AnimatePresence>
            {damagePopups.filter(p => p.type === 'taken' || p.type === 'heal').map(popup => (
              <div key={popup.id} className="absolute top-0 left-1/2 -translate-x-1/2 z-50">
                <DamagePopup value={popup.value} type={popup.type} />
              </div>
            ))}
          </AnimatePresence>
          <AnimatedHPBar label="Jij" current={combat.playerHP} max={combat.playerMaxHP} color="emerald" flashColor="blood" />
        </div>
      </div>

      {/* Enhanced Combat Log */}
      <div className="game-card mb-4 max-h-32 overflow-y-auto game-scroll p-3 mt-3">
        {combat.logs.slice(-6).map((log, i) => (
          <CombatLogEntry key={`${combat.turn}-${i}`} log={log} index={i} turn={combat.turn} />
        ))}
      </div>

      {/* Actions */}
      {!combat.finished ? (
        <>
          {/* Stance Selector */}
          <StanceSelector
            current={combat.stance}
            onChange={(s) => dispatch({ type: 'SET_COMBAT_STANCE', stance: s })}
            disabled={combat.finished}
          />
          {(() => {
            const procWeapon = state.weaponInventory?.find(w => w.equipped);
            const legacyWeaponId = state.player.loadout.weapon;
            const legacyWeapon = legacyWeaponId ? (GEAR.find(g => g.id === legacyWeaponId) ?? null) : null;
            const isMeleeWeapon = procWeapon ? procWeapon.frame === 'blade' : (legacyWeapon?.ammoType === null);
            
            if (procWeapon) {
              return (
                <div className="text-center mb-2 space-y-0.5">
                  <div className={`text-[0.55rem] font-bold ${WEAPON_RARITY_COLORS[procWeapon.rarity]}`}>
                    {procWeapon.name} ({WEAPON_RARITY_LABEL[procWeapon.rarity]})
                  </div>
                  <div className="text-[0.45rem] text-muted-foreground flex items-center justify-center gap-2">
                    <span>⚔️ {procWeapon.damage} DMG</span>
                    <span>🎯 {procWeapon.accuracy} ACC</span>
                    <span>💥 {procWeapon.critChance}% CRIT</span>
                    {procWeapon.specialEffect && <span>{procWeapon.specialEffect}</span>}
                  </div>
                  {!isMeleeWeapon && (
                    <div className={`text-[0.5rem] font-bold ${(state.ammo || 0) <= 10 ? 'text-blood' : 'text-muted-foreground'}`}>
                      🔫 Kogels: {state.ammo || 0}/500 {(state.ammo || 0) === 0 && <span className="text-blood animate-pulse">— MELEE MODUS (50%)</span>}
                    </div>
                  )}
                </div>
              );
            }
            
            if (isMeleeWeapon) {
              return (
                <div className="text-center mb-2 text-[0.55rem] font-bold text-gold">
                  ⚔️ {legacyWeapon?.name || 'Melee'} — Geen munitie nodig
                </div>
              );
            }
            const totalAmmo = state.ammo || 0;
            return (
              <div className={`text-center mb-2 text-[0.55rem] font-bold ${totalAmmo <= 10 ? 'text-blood' : 'text-muted-foreground'}`}>
                🔫 Kogels: {totalAmmo}/500 {legacyWeapon?.clipSize ? `| Clip: ${legacyWeapon.clipSize}` : ''} {state.activeSpecialAmmo ? `| ${state.activeSpecialAmmo === 'armor_piercing' ? '🔩 AP' : state.activeSpecialAmmo === 'hollowpoints' ? '💥 HP' : '✨ Tracer'}` : ''} {totalAmmo === 0 && <span className="text-blood animate-pulse">— MELEE MODUS (50% schade)</span>}
              </div>
            );
          })()}
          <div className="grid grid-cols-2 gap-2">
            <CombatAction
              icon={<Swords size={14} />}
              label={env?.actions.attack.label || "AANVAL"}
              sub={env?.actions.attack.desc || `Betrouwbaar${((state.ammo || 0) > 0) ? ' (-1 🔫)' : ' (melee)'}`}
              onClick={() => { playHitSound(); dispatch({ type: 'COMBAT_ACTION', action: 'attack' }); }}
              variant="blood"
            />
            <CombatAction
              icon={<Zap size={14} />}
              label={env?.actions.heavy.label || "ZWARE KLAP"}
              sub={env?.actions.heavy.desc || `Krachtig`}
              onClick={() => { playHeavyHitSound(); dispatch({ type: 'COMBAT_ACTION', action: 'heavy' }); }}
              variant="gold"
            />
            <CombatAction
              icon={<Shield size={14} />}
              label={env?.actions.defend.label || "VERDEDIG"}
              sub={env?.actions.defend.desc || "Block + Heal"}
              onClick={() => { playDefendSound(); dispatch({ type: 'COMBAT_ACTION', action: 'defend' }); }}
              variant="muted"
            />
            <CombatAction
              icon={<MapPin size={14} />}
              label={env?.actions.environment.label || "OMGEVING"}
              sub={env?.actions.environment.desc || "Stun kans"}
              onClick={() => { playHitSound(); dispatch({ type: 'COMBAT_ACTION', action: 'environment' }); }}
              variant="purple"
            />
          </div>
          {/* 5th tactical button - full width */}
          {env && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2"
            >
              <CombatAction
                icon={<Crosshair size={14} />}
                label={env.actions.tactical.label}
                sub={`${env.actions.tactical.desc} (${env.actions.tactical.stat.toUpperCase()} check)`}
                onClick={() => { playHitSound(); dispatch({ type: 'COMBAT_ACTION', action: 'tactical' }); }}
                variant="ice"
              />
            </motion.div>
          )}

          {/* Combo Meter */}
          {combat.comboCounter > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <Flame size={10} className="text-gold" />
                <span className="text-[0.5rem] font-bold text-gold uppercase tracking-wider">
                  Combo {combat.comboCounter}/{COMBO_THRESHOLD}
                </span>
              </div>
              <div className="relative h-2 bg-muted rounded overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold to-blood rounded"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (combat.comboCounter / COMBO_THRESHOLD) * 100)}%` }}
                  transition={{ type: 'spring', stiffness: 200 }}
                />
              </div>
              {combat.comboCounter >= COMBO_THRESHOLD && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-2"
                >
                  <CombatAction
                    icon={<Flame size={14} />}
                    label="COMBO FINISHER"
                    sub="Massieve schade + stun kans"
                    onClick={() => { playHeavyHitSound(); dispatch({ type: 'COMBAT_ACTION', action: 'combo_finisher' }); }}
                    variant="gold"
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Active Buffs */}
          {combat.activeBuffs.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {combat.activeBuffs.map((buff, i) => (
                <motion.div
                  key={`${buff.id}-${i}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gold/10 border border-gold/30"
                >
                  <span className="text-[0.5rem]">{BUFF_DEFS[buff.id]?.icon || '✨'}</span>
                  <span className="text-[0.45rem] text-gold font-bold">{buff.duration}t</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Skill Buttons */}
          <SkillButtons combat={combat} dispatch={dispatch} playerLevel={state.player.level} />
        </>
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
