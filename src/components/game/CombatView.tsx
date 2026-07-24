import { useGame } from '@/contexts/GameContext';
import { FAMILIES, BOSS_DATA, COMBAT_ENVIRONMENTS, BOSS_COMBAT_OVERRIDES, CONQUEST_COMBAT_OVERRIDES, GEAR } from '@/game/constants';
import { WEAPON_RARITY_COLORS, WEAPON_RARITY_LABEL } from '@/game/weaponGenerator';
import { BOSS_PHASES, FINAL_BOSS_COMBAT_OVERRIDES } from '@/game/endgame';
import { FamilyId } from '@/game/types';
import { BOSS_IMAGES, DISTRICT_IMAGES } from '@/assets/items';
import { NemesisDefeatPopup } from './map/NemesisDefeatPopup';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { StatBar } from './ui/StatBar';
import { GameBadge } from './ui/GameBadge';
import { TypewriterText } from './animations/TypewriterText';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Shield, Zap, Heart, Skull, Crown, AlertTriangle, Flame, Star } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { playHitSound, playHeavyHitSound, playDefendSound, playVictorySound, playDefeatSound } from '@/game/sounds';
import { COMBO_THRESHOLD, BUFF_DEFS, STANCE_MODIFIERS } from '@/game/combatSkills';
import { RARITY_COLORS, RARITY_BG, getStreakLabel } from '@/game/combatLoot';
import {
  StanceSelector, DamagePopup, AnimatedHPBar, TurnIndicator, CombatAction, SkillGrid,
  ComboFinisher, CombatLog, STANCE_ACTIVE_COLORS, useCombatDamagePopups,
} from './combat/CombatUI';


// ========== Active Combat View ==========

function ActiveCombat() {
  const { state, dispatch } = useGame();
  const combat = state.activeCombat!;
  const prevFinished = useRef(false);
  const lastLog = combat.logs[combat.logs.length - 1] || '';
  const damagePopups = useCombatDamagePopups(combat.playerHP, combat.targetHP, combat.turn, lastLog);

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
              label={env?.actions.attack.label || "Aanval"}
              sub={env?.actions.attack.desc || "Betrouwbaar"}
              variant="blood"
              onClick={() => { playHitSound(); dispatch({ type: 'COMBAT_ACTION', action: 'attack' }); }}
            />
            <CombatAction
              icon={<Zap size={16} />}
              label={env?.actions.heavy.label || "Zware Klap"}
              sub={env?.actions.heavy.desc || "Krachtig"}
              variant="gold"
              onClick={() => { playHeavyHitSound(); dispatch({ type: 'COMBAT_ACTION', action: 'heavy' }); }}
            />
            <CombatAction
              icon={<Shield size={16} />}
              label={env?.actions.defend.label || "Verdedig"}
              sub={env?.actions.defend.desc || "Block + Heal"}
              variant="ice"
              onClick={() => { playDefendSound(); dispatch({ type: 'COMBAT_ACTION', action: 'defend' }); }}
            />
          </div>

          {/* ═══ MOMENTUM FINISHER ═══ */}
          <ComboFinisher
            count={combat.comboCounter}
            onClick={() => { playHeavyHitSound(); dispatch({ type: 'COMBAT_ACTION', action: 'combo_finisher' }); }}
          />

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
          <SkillGrid
            playerLevel={state.player.level}
            cooldowns={combat.skillCooldowns}
            finished={combat.finished}
            onUse={(skillId) => dispatch({ type: 'COMBAT_ACTION', action: 'skill', skillId })}
          />
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
