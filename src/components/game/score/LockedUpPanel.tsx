import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, DollarSign, KeyRound, Package, ChevronDown, ChevronUp, Brain, Ghost, Wrench } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { GameButton } from '../ui/GameButton';
import { ConfirmDialog } from '../ConfirmDialog';
import { bribeCost, escapeOdds, minutesUntilRelease, ESCAPE_HEAT_PENALTY, ESCAPE_FAIL_EXTRA_DAYS } from '@/game/prison';
import { CORRUPT_CONTACTS } from '@/game/constants';
import { playCoinSound, playDramaticReveal } from '@/game/sounds';
import prisonBg from '@/assets/items/overlay-prison.jpg';

/**
 * INGEREKEND — what De Klus shows while you are inside.
 *
 * This replaced a full-screen modal that covered the entire game. A modal is the one
 * punishment an idle game cannot afford: it stops the loop, and the loop is the game.
 * So the sentence lives *here*, in the one place it actually applies — you cannot work
 * a klus with your own hands — while every other screen stays open and your crew keeps
 * earning in the districts.
 *
 * The countdown is in real minutes, derived from the tick length. The old overlay
 * multiplied game days by 24 hours and so promised "119u 48m" for a stay that runs on
 * the 30-minute tick.
 */

function useLiveClock() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);
}

function formatWait(minutes: number): string {
  const total = Math.max(0, Math.round(minutes * 60));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}u ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function LockedUpPanel() {
  const { state, dispatch, showToast } = useGame();
  const prison = state.prison;
  useLiveClock();
  const [confirmBribe, setConfirmBribe] = useState(false);
  const [confirmEscape, setConfirmEscape] = useState(false);
  const [showOdds, setShowOdds] = useState(false);

  if (!prison) return null;

  const hasLawyer = state.corruptContacts?.some(c => {
    const def = CORRUPT_CONTACTS.find(cd => cd.id === c.contactDefId);
    return def?.type === 'lawyer' && c.active && !c.compromised;
  });
  const rawCost = bribeCost(state);
  const cost = hasLawyer ? Math.floor(rawCost * 0.7) : rawCost;
  const canAfford = state.money >= cost;

  const odds = escapeOdds(state);
  const escapePct = Math.round(odds.total * 100);
  const servedPct = prison.totalSentence > 0 ? (prison.dayServed / prison.totalSentence) * 100 : 0;
  const lastEvent = prison.events[prison.events.length - 1];

  return (
    <div className="space-y-3">
      {/* The cell */}
      <div className="game-card overflow-hidden">
        <div className="relative h-24">
          <img src={prisonBg} alt="" className="w-full h-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          {/* Bars sliding across, so the screen itself feels shut. */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{
              background: 'repeating-linear-gradient(90deg, hsl(220 10% 6% / 0.85) 0 6px, transparent 6px 34px)',
            }}
          />
          <div className="absolute bottom-2 left-3 flex items-center gap-2">
            <Lock size={16} className="text-blood" />
            <span className="font-display text-sm uppercase tracking-widest text-blood">Ingerekend</span>
          </div>
        </div>

        <div className="p-3 space-y-2.5">
          {/* Time left, in the units the game actually runs on. */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[0.45rem] uppercase tracking-widest text-muted-foreground">Nog vast</p>
              <p className="font-display text-2xl text-blood leading-none">{formatWait(minutesUntilRelease(state))}</p>
            </div>
            <p className="text-[0.5rem] text-muted-foreground">
              dag <span className="text-foreground font-bold">{prison.dayServed}</span> van {prison.totalSentence}
            </p>
          </div>
          <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blood rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${servedPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          {/* What is still earning, and what is not. This is the part that keeps an
              arrest from feeling like the game was switched off. */}
          <div className="text-[0.5rem] leading-relaxed space-y-0.5 pt-0.5">
            <p className="text-emerald">✓ Je crew draait de rackets door — inkomsten blijven binnenkomen.</p>
            <p className="text-emerald">✓ Witwassen loopt via je vaste man.</p>
            <p className="text-muted-foreground">✗ Zelf klussen draaien kan niet. Je handen zitten binnen.</p>
            <p className="text-muted-foreground">✗ Geen handel op de markt.</p>
          </div>

          {/* The bill */}
          {(prison.moneyLost > 0 || prison.dirtyMoneyLost > 0 || prison.goodsLost.length > 0) && (
            <div className="border-t border-border/50 pt-2 space-y-1">
              <p className="text-[0.45rem] uppercase tracking-widest text-muted-foreground">In beslag genomen</p>
              {prison.moneyLost > 0 && (
                <p className="text-[0.5rem] flex items-center gap-1.5">
                  <DollarSign size={9} className="text-blood" />
                  <span className="text-muted-foreground">Geld</span>
                  <span className="text-blood font-bold ml-auto">−€{prison.moneyLost.toLocaleString()}</span>
                </p>
              )}
              {prison.dirtyMoneyLost > 0 && (
                <p className="text-[0.5rem] flex items-center gap-1.5">
                  <DollarSign size={9} className="text-blood" />
                  <span className="text-muted-foreground">Zwart geld</span>
                  <span className="text-blood font-bold ml-auto">−€{prison.dirtyMoneyLost.toLocaleString()}</span>
                </p>
              )}
              {prison.goodsLost.length > 0 && (
                <p className="text-[0.5rem] flex items-center gap-1.5">
                  <Package size={9} className="text-blood" />
                  <span className="text-muted-foreground">Waar</span>
                  <span className="text-blood font-bold ml-auto text-right">{prison.goodsLost.join(', ')}</span>
                </p>
              )}
            </div>
          )}

          {/* Last thing that happened inside */}
          {lastEvent && (
            <motion.div
              key={`${lastEvent.id}-${prison.dayServed}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-muted/30 rounded px-2 py-1.5"
            >
              <p className="text-[0.5rem] font-bold text-foreground">{lastEvent.title}</p>
              <p className="text-[0.45rem] text-muted-foreground">{lastEvent.desc}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* The two ways out that are not waiting */}
      <div className="game-card p-2.5 space-y-2">
        <p className="text-[0.45rem] uppercase tracking-widest text-muted-foreground">Eruit komen</p>

        <GameButton variant="gold" size="sm" fullWidth disabled={!canAfford}
          onClick={() => setConfirmBribe(true)}>
          <DollarSign size={11} /> Vrijkopen — €{cost.toLocaleString()}
          {hasLawyer && <span className="text-[0.45rem] ml-1 opacity-70">(−30%)</span>}
        </GameButton>

        {!prison.escapeAttempted ? (
          <div>
            <GameButton variant="blood" size="sm" fullWidth onClick={() => setConfirmEscape(true)}>
              <KeyRound size={11} /> Uitbreken — {escapePct}% kans
            </GameButton>
            <button onClick={() => setShowOdds(!showOdds)}
              className="w-full flex items-center justify-center gap-1 text-[0.45rem] text-muted-foreground mt-1 hover:text-foreground transition-colors">
              {showOdds ? <ChevronUp size={9} /> : <ChevronDown size={9} />} Waar komt die kans vandaan?
            </button>
            {showOdds && (
              <div className="mt-1 bg-muted/20 rounded px-2 py-1.5 space-y-0.5">
                <Odd label="Basis" value={odds.base} />
                <Odd label="Vernuft" value={odds.brains} icon={<Brain size={8} />} />
                <Odd label="Spook in je crew" value={odds.ghost} icon={<Ghost size={8} />} />
                <Odd label="Gereedschap" value={odds.gear} icon={<Wrench size={8} />} />
                <div className="border-t border-border pt-0.5 flex justify-between text-[0.5rem] font-bold">
                  <span>Totaal</span><span className="text-blood">{escapePct}%</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[0.5rem] text-muted-foreground bg-muted/30 rounded px-2 py-1.5">
            Je hebt het al geprobeerd. Ze kijken nu naar je. Geen tweede kans.
          </p>
        )}

        <p className="text-[0.45rem] text-muted-foreground leading-relaxed pt-0.5">
          Uitzitten is de enige weg naar buiten die je <span className="text-emerald font-bold">schoon</span> aflevert —
          je heat gaat dan naar 0. Vrijkopen en uitbreken laten je even heet als je nu bent.
        </p>
      </div>

      <ConfirmDialog
        open={confirmBribe}
        title="Vrijkopen"
        message={`Dit kost €${cost.toLocaleString()}${hasLawyer ? ' (30% advocaatkorting)' : ''}. Je staat direct buiten, maar je heat blijft staan waar het staat — en met die heat pakken ze je opnieuw.`}
        confirmText="BETALEN"
        cancelText="ANNULEREN"
        variant="warning"
        onConfirm={() => {
          setConfirmBribe(false);
          dispatch({ type: 'BRIBE_PRISON' });
          playCoinSound();
          showToast('Vrijgekocht — je heat staat nog.');
        }}
        onCancel={() => setConfirmBribe(false)}
      />

      <ConfirmDialog
        open={confirmEscape}
        title="Uitbreken"
        message={`${escapePct}% kans. Lukt het: direct buiten, +${ESCAPE_HEAT_PENALTY} heat. Lukt het niet: ${ESCAPE_FAIL_EXTRA_DAYS} dag${ESCAPE_FAIL_EXTRA_DAYS === 1 ? '' : 'en'} erbij. Je krijgt één poging.`}
        confirmText="GAAN"
        cancelText="TE RISKANT"
        variant="warning"
        onConfirm={() => {
          setConfirmEscape(false);
          playDramaticReveal();
          dispatch({ type: 'ATTEMPT_ESCAPE' });
        }}
        onCancel={() => setConfirmEscape(false)}
      />
    </div>
  );
}

function Odd({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  if (value <= 0) return null;
  return (
    <div className="flex justify-between text-[0.45rem]">
      <span className="text-muted-foreground flex items-center gap-1">{icon}{label}</span>
      <span className="text-foreground font-mono">+{Math.round(value * 100)}%</span>
    </div>
  );
}
