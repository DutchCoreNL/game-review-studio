import { useState } from 'react';
import { motion } from 'framer-motion';
import { Banknote, AlertTriangle, Droplets, ArrowDown, Lock, Users, Network, Flame } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import {
  getWashCapacity, WASH_KEEP_RATE, WASH_BASE_CAPACITY, WASH_PER_LAUNDERER, WASH_PER_NETWORK_TIER,
} from '@/game/engine';
import { RACKET_BY_ID } from '@/game/rackets';
import { LAUNDER_METHODS, isMethodUnlocked, getMethodCapacity } from '@/game/launderMethods';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { StatBar } from '../ui/StatBar';

/**
 * WITWASSEN — waar zwart geld geld wordt.
 *
 * Klussen pay in dirty cash and nothing in the game spends dirty cash, so this screen is
 * the neck of the whole economy. It was telling three untruths and offering two doors
 * that could never open:
 *
 *   - It quoted a "Heat impact: +N" and warned that large washes draw attention. The
 *     reducer adds no heat at all for a standard wash — removed deliberately, because the
 *     Witwasserij racket exists to cool you down and charging heat for using it
 *     contradicted the point. The launderers' cut is the cost.
 *   - It applied a 98% rate if you owned the Neon Strip. District ownership is retired
 *     and nothing populates `ownedDistricts`, so that branch was dead.
 *   - "Casino Witwas" needed that same district and "Vastgoed Shell Companies" needed a
 *     penthouse from a property screen that is not in the menu. Both were permanently
 *     locked rows advertising a way out that did not exist.
 *   - The "Dekmantels" section listed front businesses you cannot buy and told you to get
 *     them from a tab that has no such panel.
 *
 * What is left is the real decision: the slow clean pipe, which you widen by putting crew
 * on laundering rackets and deepening your Netwerk, or the crypto mixer — a much bigger
 * pipe, a worse rate, and heat that now actually lands on you.
 */
export function LaunderingPanel() {
  const { state, dispatch, showToast } = useGame();
  const [washAmount, setWashAmount] = useState(1000);

  const cap = getWashCapacity(state);
  const dirty = state.dirtyMoney || 0;
  const amount = Math.min(washAmount, dirty, cap.remaining);
  const clean = Math.floor(amount * WASH_KEEP_RATE);
  const cut = Math.round((1 - WASH_KEEP_RATE) * 100);

  // Where the pipe comes from, so widening it is an obvious thing to go and do.
  const launderers = (state.org?.members || []).filter(m =>
    m.assignment && !m.injuredUntilDay && RACKET_BY_ID[m.assignment]?.kind === 'schoon').length;
  const netwerkTier = state.equipment?.netwerk || 0;

  const wash = (amt: number) => {
    if (dirty <= 0) return showToast('Geen zwart geld om te wassen.', true);
    if (cap.remaining <= 0) return showToast('Je pijp zit vol voor vandaag.', true);
    const actual = Math.min(amt, dirty, cap.remaining);
    if (actual <= 0) return;
    dispatch({ type: 'WASH_MONEY_AMOUNT', amount: actual });
    showToast(`€${actual.toLocaleString()} gewassen → €${Math.floor(actual * WASH_KEEP_RATE).toLocaleString()} schoon`);
  };

  return (
    <div className="space-y-3">
      <SectionHeader title="Witwassen" icon={<Droplets size={12} />} />

      {/* The two piles */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div className="game-card p-3 text-center border-l-[3px] border-l-dirty"
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Banknote size={16} className="text-dirty mx-auto mb-1" />
          <div className="text-[0.45rem] text-muted-foreground uppercase tracking-widest">Zwart</div>
          <div className="text-sm font-black text-dirty tabular-nums">€{dirty.toLocaleString()}</div>
        </motion.div>
        <motion.div className="game-card p-3 text-center border-l-[3px] border-l-emerald"
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
          <Banknote size={16} className="text-emerald mx-auto mb-1" />
          <div className="text-[0.45rem] text-muted-foreground uppercase tracking-widest">Schoon</div>
          <div className="text-sm font-black text-emerald tabular-nums">€{(state.money || 0).toLocaleString()}</div>
        </motion.div>
      </div>

      {/* The pipe, and what widens it */}
      <div className="game-card p-3">
        <div className="flex justify-between text-[0.5rem] mb-1.5">
          <span className="text-muted-foreground uppercase tracking-widest">Vandaag door de wasserij</span>
          <span className="font-bold tabular-nums">
            €{cap.used.toLocaleString()}<span className="text-muted-foreground">/€{cap.total.toLocaleString()}</span>
          </span>
        </div>
        <StatBar value={cap.used} max={cap.total} color={cap.remaining <= 0 ? 'blood' : 'gold'} height="md" />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[0.45rem]">
          <span className="text-muted-foreground">Basis €{WASH_BASE_CAPACITY.toLocaleString()}</span>
          <span className={`flex items-center gap-1 ${launderers > 0 ? 'text-emerald' : 'text-muted-foreground'}`}>
            <Users size={8} /> {launderers} op witwasrackets · +€{(launderers * WASH_PER_LAUNDERER).toLocaleString()}
          </span>
          <span className={`flex items-center gap-1 ${netwerkTier > 0 ? 'text-game-purple' : 'text-muted-foreground'}`}>
            <Network size={8} /> Netwerk {netwerkTier} · +€{(netwerkTier * WASH_PER_NETWORK_TIER).toLocaleString()}
          </span>
        </div>
      </div>

      {/* The wash itself */}
      {dirty > 0 && cap.remaining > 0 ? (
        <div className="game-card p-3 border-l-[3px] border-l-gold">
          <h4 className="font-bold text-xs mb-2.5 flex items-center gap-1.5">
            <Droplets size={12} className="text-gold" /> Door de wasserij
          </h4>

          <input
            type="range"
            min={100}
            max={Math.max(100, Math.min(dirty, cap.remaining))}
            step={100}
            value={amount}
            onChange={e => setWashAmount(parseInt(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-gold"
          />
          <div className="flex justify-between mt-1 mb-2.5">
            <span className="text-[0.45rem] text-muted-foreground">€100</span>
            <span className="text-[0.65rem] font-black text-gold tabular-nums">€{amount.toLocaleString()}</span>
            <span className="text-[0.45rem] text-muted-foreground">€{Math.min(dirty, cap.remaining).toLocaleString()}</span>
          </div>

          {/* In, cut, out */}
          <div className="rounded-lg bg-muted/40 p-2.5 space-y-1.5 mb-2.5">
            <Row label="Zwart geld erin" value={`€${amount.toLocaleString()}`} tone="text-dirty" />
            <div className="flex justify-center"><ArrowDown size={10} className="text-gold" /></div>
            <Row label={`De wassers houden ${cut}%`} value={`−€${(amount - clean).toLocaleString()}`} tone="text-blood" />
            <div className="pt-1.5 border-t border-border/50">
              <Row label="Schoon eruit" value={`€${clean.toLocaleString()}`} tone="text-emerald" bold />
            </div>
          </div>

          <div className="flex gap-2">
            <GameButton variant="gold" size="sm" className="flex-1" onClick={() => wash(amount)}>
              Was €{amount.toLocaleString()}
            </GameButton>
            <GameButton variant="muted" size="sm" onClick={() => wash(Math.min(dirty, cap.remaining))}>
              Alles
            </GameButton>
          </div>

          <p className="text-[0.45rem] text-muted-foreground mt-2 leading-snug">
            De wasserij kost je geen hitte — daar is ze voor. Zet meer crew op witwasrackets
            om de pijp te verbreden.
          </p>
        </div>
      ) : dirty <= 0 ? (
        <div className="game-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Geen zwart geld om te wassen.</p>
          <p className="text-[0.5rem] text-muted-foreground mt-1">
            Klussen en je rackets betalen in zwart geld. Hier wordt het bruikbaar.
          </p>
        </div>
      ) : (
        <div className="game-card p-4 text-center border border-blood/25">
          <AlertTriangle size={16} className="text-blood mx-auto mb-1" />
          <p className="text-xs text-blood font-bold">De pijp zit vol voor vandaag.</p>
          <p className="text-[0.5rem] text-muted-foreground mt-1">
            Morgen kan er weer €{cap.total.toLocaleString()} doorheen — of gebruik de mixer hieronder.
          </p>
        </div>
      )}

      {/* The fast, dirty alternative */}
      <SectionHeader title="Andere wegen" icon={<Droplets size={12} />} />
      {LAUNDER_METHODS.filter(m => m.id === 'crypto').map(method => {
        const unlocked = isMethodUnlocked(method.id, state.ownedDistricts, state.player.level, state.propertyId);
        const methodCap = getMethodCapacity(method, state.ownedBusinesses, false);
        const used = state.launderMethodsUsed?.[method.id] || 0;
        const remaining = Math.max(0, methodCap - used);
        const amt = Math.min(dirty, remaining);
        const heatCost = amt > 0 ? Math.max(1, Math.floor((amt / 1000) * method.heatPerUnit)) : 0;

        return (
          <div key={method.id} className={`game-card p-3 ${unlocked ? 'border-l-[3px] border-l-game-purple' : 'opacity-60'}`}>
            <div className="flex items-start gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-game-purple/10 border border-game-purple/30 flex items-center justify-center shrink-0 text-lg">
                {method.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs">{method.name}</span>
                  <span className="text-[0.4rem] font-bold text-blood uppercase tracking-wider">hoog risico</span>
                </div>
                <p className="text-[0.5rem] text-muted-foreground mt-0.5">
                  Grotere pijp, slechtere koers, en het trekt aandacht.
                </p>
                {unlocked && (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[0.45rem]">
                    <span>Koers <span className="text-blood font-bold">{Math.round(method.cleanRate * 100)}%</span></span>
                    <span>Ruimte <span className="text-foreground font-bold">€{remaining.toLocaleString()}</span></span>
                    {heatCost > 0 && (
                      <span className="text-blood flex items-center gap-0.5"><Flame size={8} /> +{heatCost} hitte</span>
                    )}
                  </div>
                )}
              </div>
              <div className="shrink-0">
                {!unlocked ? (
                  <div className="flex items-center gap-1 text-[0.45rem] text-muted-foreground">
                    <Lock size={10} /> {method.unlockCondition}
                  </div>
                ) : remaining > 0 && dirty > 0 ? (
                  <GameButton size="sm" variant="purple" onClick={() => {
                    dispatch({ type: 'LAUNDER_METHOD', methodId: method.id, amount: amt });
                    showToast(`€${amt.toLocaleString()} door de mixer — +${heatCost} hitte`);
                  }}>
                    Mixen
                  </GameButton>
                ) : (
                  <span className="text-[0.45rem] text-muted-foreground">Vol</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, value, tone, bold }: { label: string; value: string; tone: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-[0.55rem]">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${tone} ${bold ? 'font-black text-[0.7rem]' : 'font-semibold'}`}>{value}</span>
    </div>
  );
}
