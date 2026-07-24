import { useEffect, useRef } from 'react';
import { useGame } from '@/contexts/GameContext';
import { GEAR } from '@/game/constants';
import { WEAPON_RARITY_COLORS } from '@/game/weaponGenerator';
import { GameButton } from './ui/GameButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Shield, Zap } from 'lucide-react';
import { playHitSound, playHeavyHitSound, playDefendSound, playVictorySound, playDefeatSound } from '@/game/sounds';
import {
  StanceSelector, DamagePopup, AnimatedHPBar, TurnIndicator, CombatAction, SkillGrid,
  ComboFinisher, ComboMeter, BuffChips, CombatLog, STANCE_ACTIVE_COLORS, useCombatDamagePopups,
} from './combat/CombatUI';
import { STANCE_MODIFIERS } from '@/game/combatSkills';

// ========== Fighter header card ==========

function FighterCard({ name, level, stats, align }: {
  name: string;
  level?: number;
  stats: { muscle: number; brains: number; charm: number };
  align: 'left' | 'right';
}) {
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <p className={`text-[0.6rem] font-bold ${align === 'right' ? 'text-blood' : 'text-foreground'}`}>{name}</p>
      {level != null && <p className="text-[0.45rem] text-muted-foreground">Lvl {level}</p>}
      <div className={`flex gap-1.5 mt-0.5 ${align === 'right' ? 'justify-end' : ''}`}>
        <span className="text-[0.4rem] text-blood font-bold">💪{stats.muscle}</span>
        <span className="text-[0.4rem] text-primary font-bold">🧠{stats.brains}</span>
        <span className="text-[0.4rem] text-gold font-bold">✨{stats.charm}</span>
      </div>
    </div>
  );
}

// ========== Main PvP Combat View ==========

export function PvPCombatView() {
  const { state, dispatch } = useGame();
  const combat = state.activePvPCombat;
  const prevFinished = useRef(false);

  const lastLog = combat?.logs[combat.logs.length - 1] || '';
  const damagePopups = useCombatDamagePopups(
    combat?.attackerHP ?? 0,
    combat?.defenderHP ?? 0,
    combat?.turn ?? 0,
    lastLog,
  );

  useEffect(() => {
    if (combat?.finished && !prevFinished.current) {
      if (combat.won) playVictorySound(); else playDefeatSound();
    }
    prevFinished.current = combat?.finished ?? false;
  }, [combat?.finished, combat?.won]);

  if (!combat) return null;

  const handleAction = (action: 'attack' | 'heavy' | 'defend' | 'combo_finisher', skillId?: string) => {
    dispatch({ type: 'PVP_COMBAT_ACTION', action, skillId });
  };

  const procWeapon = state.weaponInventory?.find(w => w.equipped);
  const legacyWeaponId = state.player.loadout.weapon;
  const legacyWeapon = legacyWeaponId ? (GEAR.find(g => g.id === legacyWeaponId) ?? null) : null;
  const isMeleeWeapon = procWeapon ? procWeapon.frame === 'blade' : (legacyWeapon?.ammoType === null);

  return (
    <div className="relative min-h-[70vh] -mx-3 -mt-2 px-3 pt-2">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-blood/5 pointer-events-none" />
      <div className="relative z-10">

        {/* ═══ DUEL HEADER ═══ */}
        <div className="relative rounded-xl overflow-hidden border border-border/40 mb-3 bg-gradient-to-br from-blood/15 via-card to-background p-3">
          <div className="flex items-center justify-between">
            <FighterCard name={combat.attackerName} level={combat.attackerLevel} stats={combat.attackerStats} align="left" />
            <div className="flex flex-col items-center px-2">
              <Swords size={16} className="text-blood" />
              <span className="text-[0.4rem] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Duel</span>
            </div>
            <FighterCard name={combat.defenderName} stats={combat.defenderStats} align="right" />
          </div>
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
            <AnimatedHPBar label={combat.attackerName} current={combat.attackerHP} max={combat.attackerMaxHP} color="emerald" flashColor="blood" />
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-[0.4rem] font-bold px-1.5 py-0.5 rounded-full border ${STANCE_ACTIVE_COLORS[combat.stance]}`}>
                {STANCE_MODIFIERS[combat.stance].icon} {STANCE_MODIFIERS[combat.stance].label}
              </span>
            </div>
          </div>

          {/* Opponent HP */}
          <div className="relative">
            <AnimatePresence>
              {damagePopups.filter(p => p.type === 'dealt' || p.type === 'crit').map(popup => (
                <div key={popup.id} className="absolute top-0 left-1/2 -translate-x-1/2 z-50">
                  <DamagePopup value={popup.value} type={popup.type} />
                </div>
              ))}
            </AnimatePresence>
            <AnimatedHPBar label={combat.defenderName} current={combat.defenderHP} max={combat.defenderMaxHP} color="blood" flashColor="gold" />
          </div>
        </div>

        {/* Combo meter + buffs */}
        <ComboMeter count={combat.attackerComboCounter} />
        <BuffChips buffs={combat.attackerBuffs} />

        {/* ═══ COMBAT LOG ═══ */}
        <CombatLog logs={combat.logs} turn={combat.turn} />

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

            {/* ═══ THREE CORE ACTIONS ═══ */}
            <div className="grid grid-cols-3 gap-1.5">
              <CombatAction
                icon={<Swords size={16} />}
                label="Aanval"
                sub="Betrouwbaar"
                variant="blood"
                onClick={() => { playHitSound(); handleAction('attack'); }}
              />
              <CombatAction
                icon={<Zap size={16} />}
                label="Zware Klap"
                sub="Krachtig"
                variant="gold"
                onClick={() => { playHeavyHitSound(); handleAction('heavy'); }}
              />
              <CombatAction
                icon={<Shield size={16} />}
                label="Verdedig"
                sub="Block + Heal"
                variant="ice"
                onClick={() => { playDefendSound(); handleAction('defend'); }}
              />
            </div>

            {/* ═══ MOMENTUM FINISHER ═══ */}
            <ComboFinisher
              count={combat.attackerComboCounter}
              onClick={() => { playHeavyHitSound(); handleAction('combo_finisher'); }}
            />

            {/* Stance Selector */}
            <div>
              <p className="text-[0.4rem] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 text-center">Houding</p>
              <StanceSelector
                current={combat.stance}
                onChange={(s) => dispatch({ type: 'SET_PVP_STANCE', stance: s })}
                disabled={combat.finished}
              />
            </div>

            {/* Skill Buttons */}
            <SkillGrid
              playerLevel={combat.attackerLevel}
              cooldowns={combat.attackerSkillCooldowns}
              finished={combat.finished}
              onUse={(skillId) => dispatch({ type: 'PVP_COMBAT_ACTION', action: 'skill', skillId })}
            />
          </div>
        ) : (
          <PvPResult />
        )}
      </div>
    </div>
  );
}

// ========== Combat Result ==========

function PvPResult() {
  const { state, dispatch } = useGame();
  const combat = state.activePvPCombat!;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
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
      <div className="game-card mb-4 p-3 text-left">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[0.55rem]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Schade gegeven</span>
            <span className="text-gold font-bold">{combat.damageDealt}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Schade ontvangen</span>
            <span className="text-blood font-bold">{combat.damageTaken}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Skills gebruikt</span>
            <span className="text-game-purple font-bold">{combat.skillsUsed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Combo's</span>
            <span className="text-gold font-bold">{combat.combosLanded}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Beurten</span>
            <span className="font-bold">{combat.turn}</span>
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
          className="text-[0.6rem] text-muted-foreground mb-3 bg-blood/10 border border-blood/20 rounded px-3 py-2">
          💢 Tegenstander had nog <span className="text-blood font-bold">{combat.defenderHP} HP</span> over
          {combat.defenderHP <= 10 ? ' — zo dichtbij!' : combat.defenderHP <= 25 ? '. Gebruik meer skills!' : '.'}
        </motion.p>
      )}

      <GameButton variant="gold" size="lg" fullWidth glow onClick={() => dispatch({ type: 'END_PVP_COMBAT' })}>
        DOORGAAN
      </GameButton>
    </motion.div>
  );
}
