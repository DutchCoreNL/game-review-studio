import { useGame } from '@/contexts/GameContext';
import { DISTRICTS } from '@/game/constants';
import { HitContract } from '@/game/types';
import { calculateHitSuccessChance, HIT_TYPE_LABELS } from '@/game/hitman';
import { getKarmaAlignment } from '@/game/karma';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { StatBar } from './ui/StatBar';
import { ConfirmDialog } from './ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, MapPin, Crosshair, AlertTriangle, Flame, Zap } from 'lucide-react';
import { useState } from 'react';

export function HitsView() {
  const { state, dispatch, showToast } = useGame();
  const [confirmHit, setConfirmHit] = useState<HitContract | null>(null);

  const hits = (state.hitContracts || []).filter(h => h.deadline >= state.day);
  const karma = state.karma || 0;
  const karmaAlign = getKarmaAlignment(karma);
  const isMeedogenloos = karmaAlign === 'meedogenloos';
  const isEerbaar = karmaAlign === 'eerbaar';

  const executeHitAction = (hit: HitContract) => {
    if ((state.ammo || 0) < hit.ammoCost) {
      showToast(`Niet genoeg munitie (${hit.ammoCost} nodig)`, true);
      return;
    }
    if (state.loc !== hit.district) {
      showToast(`Je moet in ${DISTRICTS[hit.district].name} zijn`, true);
      return;
    }
    dispatch({ type: 'EXECUTE_HIT', hitId: hit.id });
    setConfirmHit(null);
  };

  return (
    <div>
      <SectionHeader title="Huurmoorden" icon={<Skull size={12} />} badge={`${hits.length}`} badgeColor="blood" />
      <p className="text-[0.55rem] text-muted-foreground mb-3">
        Contractmoorden op doelwitten. Hoog risico, hoge beloning. Vereist munitie.
      </p>

      {isMeedogenloos && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="game-card p-2 mb-3 border-l-[3px] border-l-blood bg-blood/5"
        >
          <div className="flex items-center gap-1.5 text-[0.5rem] text-blood font-bold">
            <Zap size={10} /> MEEDOGENLOOS BONUS: +15% beloning op alle hits
          </div>
        </motion.div>
      )}

      {hits.length === 0 ? (
        <div className="game-card text-center py-6">
          <Skull size={24} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground italic">Geen actieve contracten. Wacht tot morgen.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {hits.map(hit => {
            const typeInfo = HIT_TYPE_LABELS[hit.targetType];
            const successChance = calculateHitSuccessChance(state, hit);
            const inDistrict = state.loc === hit.district;
            const hasAmmo = (state.ammo || 0) >= hit.ammoCost;
            const canExecute = inDistrict && hasAmmo;
            const daysLeft = hit.deadline - state.day;

            return (
              <motion.div
                key={hit.id}
                className={`game-card border-l-[3px] ${
                  hit.targetType === 'vip' ? 'border-l-game-purple' :
                  hit.targetType === 'verrader' ? 'border-l-blood' :
                  'border-l-gold'
                }`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm">{typeInfo.icon}</span>
                      <h4 className="font-bold text-xs">{hit.targetName}</h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GameBadge variant={hit.targetType === 'vip' ? 'purple' : hit.targetType === 'verrader' ? 'blood' : 'muted'} size="xs">
                        {typeInfo.label}
                      </GameBadge>
                      <span className="text-[0.45rem] text-muted-foreground flex items-center gap-0.5">
                        <MapPin size={7} /> {DISTRICTS[hit.district].name}
                        {inDistrict && <span className="text-emerald font-bold ml-0.5">✓</span>}
                      </span>
                      <span className="text-[0.45rem] text-muted-foreground">
                        ⏳ {daysLeft}d
                      </span>
                    </div>
                  </div>
                  <GameButton
                    variant={canExecute ? 'blood' : 'muted'}
                    size="sm"
                    disabled={!canExecute}
                    glow={canExecute}
                    onClick={() => setConfirmHit(hit)}
                  >
                    <Crosshair size={10} className="mr-0.5" />
                    HIT
                  </GameButton>
                </div>

                {/* Description */}
                <p className="text-[0.5rem] text-muted-foreground mb-2">{hit.desc}</p>

                {/* Success chance bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-[0.45rem] mb-0.5">
                    <span className="text-muted-foreground font-bold">SLAGINGSKANS</span>
                    <span className={`font-bold ${successChance >= 70 ? 'text-emerald' : successChance >= 40 ? 'text-gold' : 'text-blood'}`}>
                      {successChance}%
                    </span>
                  </div>
                  <StatBar
                    value={successChance}
                    max={100}
                    color={successChance >= 70 ? 'emerald' : successChance >= 40 ? 'gold' : 'blood'}
                    height="sm"
                  />
                </div>

                {/* Rewards & Costs */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[0.45rem]">
                  <span className="text-gold font-bold">💰 €{hit.reward.toLocaleString()}</span>
                  <span className="text-gold font-bold">⭐ +{hit.repReward} REP</span>
                  <span className="text-ice font-bold">✨ +{hit.xpReward} XP</span>
                  <span className={`font-bold ${hasAmmo ? 'text-muted-foreground' : 'text-blood'}`}>
                    🔫 {hit.ammoCost} kogels
                  </span>
                  <span className="text-blood font-bold">
                    <Flame size={8} className="inline" /> +{hit.heatGain}
                  </span>
                </div>

                {/* Karma & Faction warnings */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[0.45rem]">
                  <span className="text-blood flex items-center gap-0.5">
                    <AlertTriangle size={7} /> Karma {hit.karmaEffect}
                  </span>
                  {hit.factionEffect && (
                    <span className={hit.factionEffect.change > 0 ? 'text-emerald' : 'text-blood'}>
                      {hit.factionEffect.change > 0 ? '↑' : '↓'} {Math.abs(hit.factionEffect.change)} factierelatie
                    </span>
                  )}
                  {isEerbaar && (
                    <span className="text-gold flex items-center gap-0.5">
                      <AlertTriangle size={7} /> Beschadigt je eerbare reputatie!
                    </span>
                  )}
                </div>

                {/* Missing requirements */}
                {!inDistrict && (
                  <div className="mt-1.5 text-[0.45rem] text-blood flex items-center gap-0.5">
                    <MapPin size={7} /> Reis naar {DISTRICTS[hit.district].name}
                  </div>
                )}
                {!hasAmmo && (
                  <div className="mt-1 text-[0.45rem] text-blood flex items-center gap-0.5">
                    🔫 Niet genoeg munitie ({state.ammo || 0}/{hit.ammoCost})
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmHit !== null}
        title="Contractmoord Bevestigen"
        message={confirmHit ? `Wil je ${confirmHit.targetName} uitschakelen?\n\nKosten: ${confirmHit.ammoCost} kogels\nKans: ${calculateHitSuccessChance(state, confirmHit)}%\nKarma: ${confirmHit.karmaEffect}\n\nDit is een punt van geen terugkeer.` : ''}
        confirmText="ELIMINEREN"
        variant="danger"
        onConfirm={() => {
          if (confirmHit) executeHitAction(confirmHit);
        }}
        onCancel={() => setConfirmHit(null)}
      />
    </div>
  );
}
