import { motion } from 'framer-motion';
import { Check, Lock, Wrench } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import {
  EQUIPMENT, ownedTier, nextTier, canBuyTier, activeValue, type EquipSlot,
} from '@/game/equipment';
import { tapPower, crewWorkPerSecond, stashCapacity } from '@/game/score';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { StatBar } from './ui/StatBar';

const ACCENT_TEXT: Record<string, string> = {
  gold: 'text-gold', blood: 'text-blood', emerald: 'text-emerald', purple: 'text-game-purple',
};
const ACCENT_BORDER: Record<string, string> = {
  gold: 'border-l-gold', blood: 'border-l-blood', emerald: 'border-l-emerald', purple: 'border-l-game-purple',
};

/** How a track's effect reads at the tier you own. */
function effectLabel(slot: EquipSlot, value: number): string {
  switch (slot) {
    case 'gereedschap': return value > 0 ? `+${value} per tik` : 'geen bonus';
    case 'voertuig': return value > 0 ? `+${Math.round(value * 100)}% crewsnelheid` : 'geen bonus';
    case 'opslag': return value > 0 ? `+${value} voorraadplekken` : 'geen bonus';
    case 'netwerk': return value > 0 ? `−${value} hitte & aandacht per dag` : 'geen bonus';
  }
}

export function EquipmentView() {
  const { state, dispatch, showToast } = useGame();
  const respect = state.org?.respect || 0;

  // Live read-out of what the gear currently buys you.
  const crewRate = state.activeJob ? crewWorkPerSecond(state, state.activeJob.district) : 0;

  return (
    <div className="space-y-3">
      <SectionHeader title="Uitrusting" icon={<Wrench size={12} />} />

      {/* What you are right now */}
      <div className="game-card p-2.5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[0.45rem] text-muted-foreground uppercase tracking-wider">Per tik</div>
            <div className="text-sm font-bold text-gold">+{tapPower(state)}</div>
          </div>
          <div>
            <div className="text-[0.45rem] text-muted-foreground uppercase tracking-wider">Crew</div>
            <div className="text-sm font-bold text-blood">{crewRate.toFixed(1)}/s</div>
          </div>
          <div>
            <div className="text-[0.45rem] text-muted-foreground uppercase tracking-wider">Voorraad</div>
            <div className="text-sm font-bold text-emerald">{stashCapacity(state)}</div>
          </div>
        </div>
      </div>

      {EQUIPMENT.map(track => {
        const owned = ownedTier(state, track.id);
        const next = nextTier(state, track.id);
        const affordable = canBuyTier(state, track.id);
        const current = activeValue(state, track.id);
        const maxed = !next;
        const lockedByRespect = !!next && respect < next.minRespect;

        return (
          <div key={track.id} className={`game-card border-l-[3px] ${ACCENT_BORDER[track.accent]}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{track.icon}</span>
                  <span className="text-xs font-bold">{track.name}</span>
                  <span className="text-[0.4rem] text-muted-foreground uppercase tracking-wider">
                    {owned}/{track.tiers.length}
                  </span>
                </div>
                <p className="text-[0.5rem] text-muted-foreground mt-0.5">{track.effect}</p>
                <p className={`text-[0.5rem] font-bold mt-0.5 ${ACCENT_TEXT[track.accent]}`}>
                  Nu: {effectLabel(track.id, current)}
                </p>
              </div>
              {owned > 0 && (
                <div className="shrink-0 text-right">
                  <div className="text-[0.45rem] text-muted-foreground">{track.tiers[owned - 1].name}</div>
                </div>
              )}
            </div>

            {/* Tier pips */}
            <div className="flex gap-1 mt-2">
              {track.tiers.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${
                  i < owned ? (track.accent === 'gold' ? 'bg-gold' : track.accent === 'blood' ? 'bg-blood' : track.accent === 'emerald' ? 'bg-emerald' : 'bg-game-purple') : 'bg-muted'
                }`} />
              ))}
            </div>

            {/* Next tier */}
            {maxed ? (
              <div className="mt-2 flex items-center justify-center gap-1.5 py-1.5 rounded bg-muted/30">
                <Check size={11} className="text-emerald" />
                <span className="text-[0.55rem] font-bold text-emerald">Volledig uitgerust</span>
              </div>
            ) : (
              <div className="mt-2 rounded-lg border border-border/50 p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[0.6rem] font-bold text-foreground">{next!.name}</div>
                    <p className="text-[0.45rem] text-muted-foreground leading-snug mt-0.5">{next!.flavor}</p>
                    <p className={`text-[0.45rem] mt-0.5 ${ACCENT_TEXT[track.accent]}`}>
                      → {effectLabel(track.id, next!.value)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {lockedByRespect ? (
                      <div className="text-[0.45rem] text-muted-foreground text-right flex items-center gap-1">
                        <Lock size={9} /> {next!.minRespect} aanzien
                      </div>
                    ) : (
                      <GameButton variant={affordable ? 'gold' : 'muted'} size="sm" disabled={!affordable}
                        onClick={() => { dispatch({ type: 'BUY_EQUIPMENT', slot: track.id }); showToast(`${next!.name} aangeschaft!`); }}>
                        €{next!.cost >= 1000 ? `${Math.round(next!.cost / 1000)}k` : next!.cost}
                      </GameButton>
                    )}
                  </div>
                </div>
                {lockedByRespect && (
                  <div className="mt-1.5">
                    <StatBar value={respect} max={next!.minRespect} color="gold" height="sm" />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <p className="text-[0.45rem] text-muted-foreground text-center leading-snug">
        Uitrusting koop je van schoon geld. Was je zwarte geld wit in de Handel-tab.
      </p>
    </div>
  );
}
