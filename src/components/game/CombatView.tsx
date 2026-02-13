import { useGame } from '@/contexts/GameContext';
import { FAMILIES, BOSS_DATA, COMBAT_ENVIRONMENTS, BOSS_COMBAT_OVERRIDES, CONQUEST_COMBAT_OVERRIDES, GEAR, AMMO_TYPE_LABELS } from '@/game/constants';
import { BOSS_PHASES, FINAL_BOSS_COMBAT_OVERRIDES } from '@/game/endgame';
import { FamilyId, DistrictId } from '@/game/types';
import { BOSS_IMAGES, DISTRICT_IMAGES } from '@/assets/items';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { StatBar } from './ui/StatBar';
import { GameBadge } from './ui/GameBadge';
import { TypewriterText } from './animations/TypewriterText';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Shield, Zap, MapPin, Heart, Skull, Crown, AlertTriangle, Crosshair } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { playHitSound, playHeavyHitSound, playDefendSound, playVictorySound, playDefeatSound } from '@/game/sounds';

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

// ========== Active Combat View ==========

function ActiveCombat() {
  const { state, dispatch } = useGame();
  const combat = state.activeCombat!;
  const prevFinished = useRef(false);

  useEffect(() => {
    if (combat?.finished && !prevFinished.current) {
      if (combat.won) playVictorySound(); else playDefeatSound();
    }
    prevFinished.current = combat?.finished ?? false;
  }, [combat?.finished, combat?.won]);

  const isBossFight = !!combat.bossPhase;
  const phaseData = combat.bossPhase ? BOSS_PHASES[combat.bossPhase - 1] : null;

  // Memoize env to prevent new object each render
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

  // Pick a scene phrase based on turn — stable reference
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
      <div className="space-y-3 mb-4">
        <AnimatedHPBar label="Jij" current={combat.playerHP} max={combat.playerMaxHP} color="emerald" flashColor="blood" />
        <AnimatedHPBar label={combat.targetName} current={combat.targetHP} max={combat.enemyMaxHP} color="blood" flashColor="gold" />
      </div>

      {/* Combat Log */}
      <div className="game-card mb-4 max-h-32 overflow-y-auto game-scroll p-3">
        {combat.logs.slice(-6).map((log, i) => (
          <motion.p
            key={`${combat.turn}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-[0.6rem] py-0.5 ${
              log.includes('verslagen') || log.includes('STUNNED') || log.includes('geslaagd')
                ? 'text-gold font-bold'
                : log.includes('mislukt') || log.includes('terug') || log.includes('✗')
                ? 'text-blood'
                : log.startsWith('Decker:') || log.startsWith('Voss:')
                ? 'text-ice font-semibold italic'
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
          {(() => {
            const equippedWeaponId = state.player.loadout.weapon;
            const equippedWeapon = equippedWeaponId ? (GEAR.find(g => g.id === equippedWeaponId) ?? null) : null;
            const isMeleeWeapon = equippedWeapon?.ammoType === null;
            if (isMeleeWeapon) {
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
              <div className={`text-center mb-2 text-[0.55rem] font-bold ${typeAmmo <= 3 ? 'text-blood' : 'text-muted-foreground'}`}>
                🔫 {typeLabel}: {typeAmmo} {equippedWeapon?.clipSize ? `| Clip: ${equippedWeapon.clipSize}` : ''} {typeAmmo === 0 && <span className="text-blood animate-pulse">— MELEE MODUS (50% schade)</span>}
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
        </>
      ) : (
        <CombatResult />
      )}
      </div>
    </div>
  );
}

// ========== Combat Result ==========

function CombatResult() {
  const { state, dispatch } = useGame();
  const combat = state.activeCombat!;

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
          {combat.won && !combat.bossPhase && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="text-xs text-gold mb-4">+€25.000 | +200 REP | +100 XP</motion.p>
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
  return state.activeCombat ? <ActiveCombat /> : <CombatMenu />;
}
