import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { BOUNTY_TARGETS, BountyTarget } from '@/game/bounties';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { InfoRow } from '../ui/InfoRow';
import { Target, Crosshair, Clock, DollarSign, Shield, Skull, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function BountyBoardPanel() {
  const { state, dispatch, showToast } = useGame();
  const [tab, setTab] = useState<'board' | 'active' | 'on_me'>('board');

  const activeBounties = state.activeBounties || [];
  const placedBounties = state.placedBounties || [];
  const board = state.bountyBoard || [];

  return (
    <div className="space-y-3">
      {/* Sub-tabs */}
      <div className="flex gap-1.5">
        {([
          { id: 'board' as const, label: 'PREMIE BORD', badge: board.length },
          { id: 'active' as const, label: 'GEPLAATST', badge: placedBounties.length },
          { id: 'on_me' as const, label: 'OP MIJ', badge: activeBounties.length },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 rounded text-[0.5rem] font-bold uppercase tracking-wider transition-all ${
              tab === t.id
                ? 'bg-blood/15 border border-blood text-blood'
                : 'bg-muted border border-border text-muted-foreground'
            }`}
          >
            {t.label}
            {t.badge > 0 && (
              <span className="ml-1 w-4 h-4 bg-blood text-primary-foreground rounded-full text-[0.4rem] font-bold inline-flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bounty Board */}
      {tab === 'board' && (
        <>
          <SectionHeader title="Premie Bord" icon={<Target size={12} />} />
          <p className="text-[0.5rem] text-muted-foreground">Plaats een premie op een NPC-doelwit. Premiejagers doen het vuile werk.</p>
          {board.length === 0 ? (
            <div className="game-card text-center py-4">
              <Target size={20} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Geen doelwitten beschikbaar. Kom morgen terug.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {board.map(target => (
                <BountyTargetCard key={target.id} target={target} onPlace={() => {
                  if (state.money < target.cost) {
                    showToast('Niet genoeg geld!', true);
                    return;
                  }
                  dispatch({ type: 'PLACE_BOUNTY', targetId: target.id });
                  showToast(`Premie geplaatst op ${target.name}!`);
                }} canAfford={state.money >= target.cost} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Active (placed by player) */}
      {tab === 'active' && (
        <>
          <SectionHeader title="Geplaatste Premies" icon={<Crosshair size={12} />} />
          {placedBounties.length === 0 ? (
            <div className="game-card text-center py-4">
              <p className="text-xs text-muted-foreground">Geen actieve premies. Plaats er een via het Premie Bord.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {placedBounties.map(b => (
                <div key={b.id} className="game-card border-l-[3px] border-l-gold">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.6rem] font-bold">{b.targetName}</p>
                      <p className="text-[0.45rem] text-muted-foreground flex items-center gap-1">
                        <Clock size={8} /> Verloopt dag {b.deadline} • €{b.reward.toLocaleString()} premie
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        dispatch({ type: 'CANCEL_BOUNTY', bountyId: b.id });
                        showToast('Premie geannuleerd (50% terugbetaald)');
                      }}
                      className="text-[0.45rem] text-blood hover:text-blood/80 flex items-center gap-0.5"
                    >
                      <X size={8} /> Annuleer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Bounties on player */}
      {tab === 'on_me' && (
        <>
          <SectionHeader title="Premies Op Mij" icon={<Skull size={12} />} />
          {activeBounties.length === 0 ? (
            <div className="game-card text-center py-4">
              <Shield size={20} className="text-emerald mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Geen premies op je hoofd. Hou je heat laag!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeBounties.map(b => (
                <div key={b.id} className="game-card border-l-[3px] border-l-blood">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.6rem] font-bold text-blood">€{b.reward.toLocaleString()} PREMIE</p>
                      <p className="text-[0.45rem] text-muted-foreground">
                        Geplaatst door: {b.placedBy} • Verloopt dag {b.deadline}
                      </p>
                    </div>
                    <GameBadge variant="blood" size="xs">ACTIEF</GameBadge>
                  </div>
                </div>
              ))}
              <p className="text-[0.45rem] text-blood/70 italic">⚠️ Premiejagers kunnen je op elk moment aanvallen!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BountyTargetCard({ target, onPlace, canAfford }: { target: BountyTarget; onPlace: () => void; canAfford: boolean }) {
  return (
    <div className="game-card border-l-[3px] border-l-blood">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-[0.6rem] font-bold">{target.name}</h4>
            <GameBadge variant="muted" size="xs">{target.title}</GameBadge>
          </div>
          <p className="text-[0.45rem] text-muted-foreground mt-0.5">{target.desc}</p>
          <div className="flex gap-3 mt-1.5">
            <span className="text-[0.45rem] text-gold font-semibold">+€{target.rewardMoney.toLocaleString()}</span>
            <span className="text-[0.45rem] text-ice font-semibold">+{target.rewardRep} rep</span>
            <span className="text-[0.45rem] text-muted-foreground">Kans: {target.difficulty}%/dag</span>
          </div>
        </div>
        <GameButton variant="blood" size="sm" disabled={!canAfford} onClick={onPlace} icon={<Target size={10} />}>
          €{target.cost.toLocaleString()}
        </GameButton>
      </div>
    </div>
  );
}
