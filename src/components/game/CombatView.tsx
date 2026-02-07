import { useGame } from '@/contexts/GameContext';
import { FAMILIES, BOSS_DATA, COMBAT_ENVIRONMENTS } from '@/game/constants';
import { canTriggerFinalBoss, ENDGAME_PHASES } from '@/game/endgame';
import { FamilyId } from '@/game/types';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { StatBar } from './ui/StatBar';
import { GameBadge } from './ui/GameBadge';
import { motion } from 'framer-motion';
import { Swords, Shield, Zap, MapPin, Heart, Skull, Crown, AlertTriangle } from 'lucide-react';

export function CombatView() {
  const { state, dispatch, showToast } = useGame();
  const combat = state.activeCombat;

  if (!combat) {
    return <CombatMenu />;
  }

  const env = COMBAT_ENVIRONMENTS[state.loc];

  return (
    <div>
      <SectionHeader title="GEVECHT" icon={<Swords size={12} />} />

      {/* HP Bars */}
      <div className="space-y-3 mb-5">
        <div>
          <div className="flex justify-between text-[0.6rem] text-muted-foreground mb-1">
            <span className="font-bold text-foreground">Jij</span>
            <span>{combat.playerHP}/{combat.playerMaxHP}</span>
          </div>
          <StatBar value={combat.playerHP} max={combat.playerMaxHP} color="emerald" height="lg" />
        </div>
        <div>
          <div className="flex justify-between text-[0.6rem] text-muted-foreground mb-1">
            <span className="font-bold text-foreground">{combat.targetName}</span>
            <span>{combat.targetHP}/{combat.enemyMaxHP}</span>
          </div>
          <StatBar value={combat.targetHP} max={combat.enemyMaxHP} color="blood" height="lg" />
        </div>
      </div>

      {/* Combat Log */}
      <div className="game-card mb-4 max-h-32 overflow-y-auto game-scroll p-3">
        {combat.logs.slice(-6).map((log, i) => (
          <motion.p
            key={`${combat.turn}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-[0.6rem] py-0.5 ${
              log.includes('verslagen') || log.includes('STUNNED') || log.includes('ZWARE')
                ? 'text-gold font-bold'
                : log.includes('mislukt') || log.includes('terug')
                ? 'text-blood'
                : 'text-muted-foreground'
            }`}
          >
            {log}
          </motion.p>
        ))}
      </div>

      {/* Actions */}
      {!combat.finished ? (
        <div className="grid grid-cols-2 gap-2">
          <CombatAction icon={<Swords size={14} />} label="AANVAL" sub="Betrouwbaar"
            onClick={() => dispatch({ type: 'COMBAT_ACTION', action: 'attack' })} variant="blood" />
          <CombatAction icon={<Zap size={14} />} label="ZWARE KLAP" sub="Krachtig, kan missen"
            onClick={() => dispatch({ type: 'COMBAT_ACTION', action: 'heavy' })} variant="gold" />
          <CombatAction icon={<Shield size={14} />} label="VERDEDIG" sub="Block + Heal"
            onClick={() => dispatch({ type: 'COMBAT_ACTION', action: 'defend' })} variant="muted" />
          <CombatAction icon={<MapPin size={14} />} label={env?.actionName || 'OMGEVING'} sub={env?.desc || 'Stun kans'}
            onClick={() => dispatch({ type: 'COMBAT_ACTION', action: 'environment' })} variant="purple" />
        </div>
      ) : (
        <div className="text-center">
          <div className={`text-2xl font-bold font-display mb-3 ${combat.won ? 'text-gold gold-text-glow' : 'text-blood blood-text-glow'}`}>
            {combat.won
              ? combat.targetName === 'Commissaris Decker' ? '🌆 NOXHAVEN IS VAN JOU!' : '🏆 OVERWINNING!'
              : '💀 VERSLAGEN'}
          </div>
          {combat.won && combat.targetName === 'Commissaris Decker' && (
            <p className="text-xs text-gold mb-4">+€100.000 | +500 REP | +500 XP | Heat gereset</p>
          )}
          {combat.won && combat.targetName !== 'Commissaris Decker' && (
            <p className="text-xs text-gold mb-4">+€25.000 | +200 REP | +100 XP</p>
          )}
          <GameButton variant="gold" size="lg" fullWidth glow onClick={() => dispatch({ type: 'END_COMBAT' })}>
            DOORGAAN
          </GameButton>
        </div>
      )}
    </div>
  );
}

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
                <div>
                  <div className="flex items-center gap-2">
                    {defeated ? <Skull size={14} className="text-muted-foreground" /> : <Crown size={14} style={{ color: fam.color }} />}
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

      {/* Final Boss Trigger */}
      {canTriggerFinalBoss(state) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 game-card border-2 border-blood pulse-glow"
        >
          <div className="text-center">
            <AlertTriangle size={24} className="text-blood mx-auto mb-2" />
            <h3 className="font-display font-bold text-sm text-blood blood-text-glow tracking-wider mb-1">
              ⚠️ OPERATIE GERECHTIGHEID ⚠️
            </h3>
            <p className="text-[0.55rem] text-muted-foreground mb-3">
              Je hebt alle facties veroverd en je rivaal verslagen. Commissaris Decker van de NHPD komt persoonlijk
              afrekenen. Dit is je laatste gevecht — versla hem om Noxhaven definitief te claimen.
            </p>
            <GameButton
              variant="blood"
              size="lg"
              fullWidth
              glow
              icon={<Swords size={14} />}
              onClick={() => dispatch({ type: 'START_FINAL_BOSS' })}
            >
              CONFRONTEER COMMISSARIS DECKER
            </GameButton>
          </div>
        </motion.div>
      )}

      {/* Free Play indicator */}
      {state.freePlayMode && (
        <div className="mt-4 game-card border-gold text-center">
          <p className="text-xs text-gold font-bold font-display">🌆 VRIJ SPELEN MODUS</p>
          <p className="text-[0.5rem] text-muted-foreground">Je hebt Noxhaven veroverd. Speel door zo lang je wilt.</p>
        </div>
      )}
    </div>
  );
}

function CombatAction({ icon, label, sub, onClick, variant }: {
  icon: React.ReactNode; label: string; sub: string; onClick: () => void; variant: string;
}) {
  const styles: Record<string, string> = {
    blood: 'bg-blood text-primary-foreground',
    gold: 'bg-gold/15 border border-gold text-gold',
    muted: 'bg-muted border border-border text-foreground',
    purple: 'bg-game-purple/15 border border-game-purple text-game-purple',
  };

  return (
    <motion.button onClick={onClick}
      className={`py-3 rounded ${styles[variant] || styles.muted} font-bold text-xs flex flex-col items-center gap-0.5`}
      whileTap={{ scale: 0.95 }}>
      {icon}
      <span>{label}</span>
      <span className="text-[0.45rem] font-normal opacity-70">{sub}</span>
    </motion.button>
  );
}
