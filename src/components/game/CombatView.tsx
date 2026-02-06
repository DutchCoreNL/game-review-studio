import { useGame } from '@/contexts/GameContext';
import { FAMILIES, BOSS_DATA, COMBAT_ENVIRONMENTS } from '@/game/constants';
import { FamilyId } from '@/game/types';
import { motion } from 'framer-motion';
import { Swords, Shield, Zap, MapPin, Heart, Skull, Crown } from 'lucide-react';

export function CombatView() {
  const { state, dispatch, showToast } = useGame();
  const combat = state.activeCombat;

  if (!combat) {
    return <CombatMenu />;
  }

  const playerHpPct = Math.max(0, (combat.playerHP / combat.playerMaxHP) * 100);
  const enemyHpPct = Math.max(0, (combat.targetHP / combat.enemyMaxHP) * 100);
  const env = COMBAT_ENVIRONMENTS[state.loc];

  return (
    <div>
      <SectionHeader title="GEVECHT" />

      {/* HP Bars */}
      <div className="space-y-3 mb-5">
        <HpBar label="Jij" hp={combat.playerHP} maxHp={combat.playerMaxHP} pct={playerHpPct} color="bg-emerald" />
        <HpBar label={combat.targetName} hp={combat.targetHP} maxHp={combat.enemyMaxHP} pct={enemyHpPct} color="bg-blood" />
      </div>

      {/* Combat Log */}
      <div className="game-card mb-4 max-h-32 overflow-y-auto game-scroll p-3">
        {combat.logs.slice(-6).map((log, i) => (
          <motion.p
            key={`${combat.turn}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-[0.65rem] py-0.5 ${
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
          <ActionButton
            icon={<Swords size={14} />}
            label="AANVAL"
            sub="Betrouwbaar"
            onClick={() => dispatch({ type: 'COMBAT_ACTION', action: 'attack' })}
            color="bg-blood text-primary-foreground"
          />
          <ActionButton
            icon={<Zap size={14} />}
            label="ZWARE KLAP"
            sub="Krachtig, kan missen"
            onClick={() => dispatch({ type: 'COMBAT_ACTION', action: 'heavy' })}
            color="bg-[hsl(var(--gold)/0.15)] border border-gold text-gold"
          />
          <ActionButton
            icon={<Shield size={14} />}
            label="VERDEDIG"
            sub="Block + Heal"
            onClick={() => dispatch({ type: 'COMBAT_ACTION', action: 'defend' })}
            color="bg-muted border border-border text-foreground"
          />
          <ActionButton
            icon={<MapPin size={14} />}
            label={env?.actionName || 'OMGEVING'}
            sub={env?.desc || 'Stun kans'}
            onClick={() => dispatch({ type: 'COMBAT_ACTION', action: 'environment' })}
            color="bg-[hsl(var(--purple)/0.15)] border border-[hsl(var(--purple))] text-game-purple"
          />
        </div>
      ) : (
        <div className="text-center">
          <div className={`text-2xl font-bold mb-3 ${combat.won ? 'text-gold' : 'text-blood'}`}>
            {combat.won ? '🏆 OVERWINNING!' : '💀 VERSLAGEN'}
          </div>
          {combat.won && (
            <p className="text-xs text-gold mb-4">+€25.000 | +200 REP | +100 XP</p>
          )}
          <button
            onClick={() => dispatch({ type: 'END_COMBAT' })}
            className="w-full py-3 rounded bg-gold text-secondary-foreground font-bold text-sm uppercase tracking-wider"
          >
            DOORGAAN
          </button>
        </div>
      )}
    </div>
  );
}

function CombatMenu() {
  const { state, dispatch, showToast } = useGame();

  return (
    <div>
      <SectionHeader title="Factieleiders Uitdagen" />
      <p className="text-[0.6rem] text-muted-foreground mb-4">
        Daag factieleiders uit in hun eigen district. Versla ze alle drie om Kingpin te worden.
        Je moet in hun thuisdistrict zijn en een relatie {'<'} -20 hebben.
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
                    <span className="text-[0.5rem] px-1.5 py-0.5 rounded uppercase font-bold"
                      style={{ backgroundColor: fam.color + '30', color: fam.color }}>
                      {fam.name}
                    </span>
                  </div>
                  <p className="text-[0.55rem] text-muted-foreground mt-1">{boss.desc}</p>
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-[0.5rem] text-blood font-semibold flex items-center gap-0.5">
                      <Heart size={8} /> HP: {boss.hp}
                    </span>
                    <span className="text-[0.5rem] text-gold font-semibold flex items-center gap-0.5">
                      <Swords size={8} /> ATK: {boss.attack}
                    </span>
                    <span className="text-[0.5rem] text-muted-foreground">
                      Relatie: {rel}
                    </span>
                  </div>
                </div>
              </div>

              {defeated ? (
                <div className="mt-2 text-center py-1.5 rounded bg-muted text-[0.6rem] text-muted-foreground font-bold">
                  ✓ VERSLAGEN
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!isInDistrict) {
                      showToast(`Reis eerst naar ${fam.home === 'port' ? 'Port Nero' : fam.home === 'crown' ? 'Crown Heights' : 'Iron Borough'}`, true);
                      return;
                    }
                    if (rel > -20) {
                      showToast('Relatie moet onder -20 zijn om uit te dagen', true);
                      return;
                    }
                    dispatch({ type: 'START_COMBAT', familyId: fid });
                  }}
                  disabled={!canFight}
                  className={`w-full mt-2 py-2 rounded text-[0.6rem] font-bold uppercase tracking-wider transition-all ${
                    canFight
                      ? 'bg-blood text-primary-foreground glow-blood'
                      : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                  }`}
                >
                  {!isInDistrict ? `REIS NAAR ${fam.home.toUpperCase()}` : rel > -20 ? `RELATIE TE HOOG (${rel})` : 'UITDAGEN'}
                </button>
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
              <div
                key={fid}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                  state.leadersDefeated.includes(fid)
                    ? 'bg-gold text-secondary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {state.leadersDefeated.includes(fid) ? '👑' : '?'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HpBar({ label, hp, maxHp, pct, color }: { label: string; hp: number; maxHp: number; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[0.65rem] text-muted-foreground mb-1">
        <span className="font-bold text-foreground">{label}</span>
        <span>{hp}/{maxHp}</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

function ActionButton({ icon, label, sub, onClick, color }: {
  icon: React.ReactNode; label: string; sub: string; onClick: () => void; color: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`py-3 rounded ${color} font-bold text-xs flex flex-col items-center gap-0.5`}
      whileTap={{ scale: 0.95 }}
    >
      {icon}
      <span>{label}</span>
      <span className="text-[0.5rem] font-normal opacity-70">{sub}</span>
    </motion.button>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3 pb-1 border-b border-border">
      <span className="text-gold text-[0.65rem] uppercase tracking-widest font-bold">{title}</span>
    </div>
  );
}
