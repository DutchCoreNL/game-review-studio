import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { Lock, DollarSign, KeyRound, Clock, AlertTriangle, Package, Brain, Swords, Heart, Scale, Users, ShieldCheck, ChevronDown, ChevronUp, Dice1 } from 'lucide-react';
import { GameButton } from './ui/GameButton';
import { ConfirmDialog } from './ConfirmDialog';
import { useState, useEffect, useRef } from 'react';
import { PRISON_BRIBE_COST_PER_DAY, PRISON_ESCAPE_BASE_CHANCE, PRISON_LAWYER_BRIBE_DISCOUNT, CORRUPT_CONTACTS } from '@/game/constants';
import * as Engine from '@/game/engine';
import prisonBg from '@/assets/items/overlay-prison.jpg';
import { playCoinSound, playAlarmSound, playVictorySound, playNegativeSound, playDramaticReveal } from '@/game/sounds';
import { DiceGame } from './minigames/DiceGame';

export function PrisonOverlay() {
  const { state } = useGame();
  const prison = state.prison;

  if (!prison) return null;

  return <PrisonOverlayInner />;
}

function PrisonOverlayInner() {
  const { state, dispatch, showToast } = useGame();
  const prison = state.prison!;
  const [confirmBribe, setConfirmBribe] = useState(false);
  const [confirmEscape, setConfirmEscape] = useState(false);
  const [showEscapeBreakdown, setShowEscapeBreakdown] = useState(false);
  const [showDice, setShowDice] = useState(false);
  const [diceBet, setDiceBet] = useState(50);
  const hasPlayedAlarm = useRef(false);
  const [, setTick] = useState(0);

  // Re-render every second for countdown timer
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  // Play alarm on mount (arrest)
  useEffect(() => {
    if (!hasPlayedAlarm.current) {
      hasPlayedAlarm.current = true;
      playAlarmSound();
    }
  }, []);

  // Lawyer check
  const hasLawyer = state.corruptContacts?.some(c => {
    const def = CORRUPT_CONTACTS.find(cd => cd.id === c.contactDefId);
    return def?.type === 'lawyer' && c.active && !c.compromised;
  });

  const baseBribeCost = prison.daysRemaining * PRISON_BRIBE_COST_PER_DAY;
  const bribeCost = hasLawyer ? Math.floor(baseBribeCost * (1 - PRISON_LAWYER_BRIBE_DISCOUNT)) : baseBribeCost;
  const canAffordBribe = state.money >= bribeCost;

  // Progress
  const progressPct = prison.totalSentence > 0 ? (prison.dayServed / prison.totalSentence) * 100 : 0;

  // Realtime countdown: each game-day = tickIntervalMinutes (default 30min)
  const tickMs = (state.tickIntervalMinutes || 30) * 60 * 1000;
  const lastTick = state.lastTickAt ? new Date(state.lastTickAt).getTime() : Date.now();
  const releaseTime = lastTick + (prison.daysRemaining * tickMs);
  const msLeft = Math.max(0, releaseTime - Date.now());
  const hoursLeft = Math.floor(msLeft / 3600000);
  const minsLeft = Math.floor((msLeft % 3600000) / 60000);
  const secsLeft = Math.floor((msLeft % 60000) / 1000);
  const realtimeCountdown = hoursLeft > 0 
    ? `${hoursLeft}u ${minsLeft}m` 
    : minsLeft > 0 
      ? `${minsLeft}m ${secsLeft}s` 
      : `${secsLeft}s`;

  // Escape chance breakdown
  const baseChance = PRISON_ESCAPE_BASE_CHANCE;
  const brainsBonus = Engine.getPlayerStat(state, 'brains') * 0.03;
  const hackerBonus = state.crew.some(c => c.role === 'Hacker') ? 0.10 : 0;
  const hasTunnel = state.villa?.modules.includes('tunnel');
  const tunnelBonus = hasTunnel ? 0.25 : 0;
  const totalChance = baseChance + brainsBonus + hackerBonus + tunnelBonus;
  const escapePercent = Math.min(95, Math.round(totalChance * 100));

  // Crew loyalty warning
  const lowLoyaltyCrew = state.crew.filter(c => (c.loyalty || 75) < 30);

  // Recent events (last 3)
  const recentEvents = prison.events.slice(-3).reverse();

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(var(--background) / 0.8) 0%, hsl(var(--background) / 0.95) 100%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 20 }}
        className="absolute inset-0 z-40 flex items-center justify-center px-6 overflow-y-auto py-4"
      >
        <div className="w-full max-w-xs bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
          {/* Banner */}
          <div className="relative h-24 overflow-hidden">
            <img src={prisonBg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            <div className="absolute bottom-2 left-4 flex items-center gap-2">
              <Lock size={18} className="text-blood" />
              <span className="font-bold text-sm uppercase tracking-wider text-blood">Gevangenis</span>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-3 space-y-3">
            {/* Progress ring + countdown */}
            <div className="flex items-center justify-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                  <motion.circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke="hsl(var(--blood))"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                    animate={{ strokeDashoffset: (2 * Math.PI * 34) * (1 - progressPct / 100) }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-blood leading-none">{realtimeCountdown}</span>
                  <p className="text-[0.4rem] text-blood/70 uppercase tracking-wider mt-0.5">
                    ({prison.daysRemaining} {prison.daysRemaining === 1 ? 'dag' : 'dagen'})
                  </p>
                </div>
              </div>
              <div className="text-[0.6rem] text-muted-foreground space-y-1">
                <p>Dag <span className="text-foreground font-bold">{prison.dayServed}</span> van {prison.totalSentence}</p>
                {hasLawyer && (
                  <div className="flex items-center gap-1 text-gold">
                    <Scale size={10} />
                    <span>Advocaat actief</span>
                  </div>
                )}
              </div>
            </div>

            {/* Confiscation info */}
            <div className="space-y-1.5">
              {prison.moneyLost > 0 && (
                <div className="flex items-start gap-2 text-[0.6rem]">
                  <DollarSign size={11} className="text-blood mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Geld: <span className="text-blood font-bold">-€{prison.moneyLost.toLocaleString()}</span>
                  </span>
                </div>
              )}
              {prison.dirtyMoneyLost > 0 && (
                <div className="flex items-start gap-2 text-[0.6rem]">
                  <DollarSign size={11} className="text-blood mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Dirty: <span className="text-blood font-bold">-€{prison.dirtyMoneyLost.toLocaleString()}</span>
                  </span>
                </div>
              )}
              {prison.goodsLost.length > 0 && (
                <div className="flex items-start gap-2 text-[0.6rem]">
                  <Package size={11} className="text-blood mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Geconfisqueerd: <span className="text-blood font-bold">{prison.goodsLost.join(', ')}</span>
                  </span>
                </div>
              )}
              <div className="flex items-start gap-2 text-[0.6rem]">
                <Clock size={11} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Geen handel, reizen of missies. Inkomsten lopen door.
                </span>
              </div>
            </div>

            {/* Prison Events Log */}
            {recentEvents.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[0.55rem] uppercase tracking-wider text-muted-foreground font-bold">Recente voorvallen</p>
                {recentEvents.map((evt, i) => (
                  <motion.div
                    key={`${evt.id}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-muted/30 rounded px-2 py-1.5 text-[0.6rem]"
                  >
                    <p className="font-bold text-foreground">{evt.title}</p>
                    <p className="text-muted-foreground">{evt.desc}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Crew Loyalty Warning */}
            {lowLoyaltyCrew.length > 0 && (
              <div className="flex items-start gap-2 text-[0.6rem] bg-blood/10 border border-blood/20 rounded px-2 py-1.5">
                <Users size={12} className="text-blood mt-0.5 flex-shrink-0" />
                <span className="text-blood">
                  <span className="font-bold">{lowLoyaltyCrew.map(c => c.name).join(', ')}</span> {lowLoyaltyCrew.length === 1 ? 'overweegt' : 'overwegen'} te vertrekken!
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <GameButton
                variant="gold"
                size="md"
                fullWidth
                icon={<DollarSign size={14} />}
                onClick={() => setConfirmBribe(true)}
                disabled={!canAffordBribe}
              >
                OMKOPEN — €{bribeCost.toLocaleString()}
                {hasLawyer && <span className="text-[0.5rem] ml-1 opacity-70">(-30%)</span>}
              </GameButton>

              {!prison.escapeAttempted && (
                <div>
                  <GameButton
                    variant="blood"
                    size="md"
                    fullWidth
                    icon={<KeyRound size={14} />}
                    onClick={() => setConfirmEscape(true)}
                  >
                    ONTSNAPPEN — {escapePercent}% kans
                  </GameButton>
                  <button
                    onClick={() => setShowEscapeBreakdown(!showEscapeBreakdown)}
                    className="w-full flex items-center justify-center gap-1 text-[0.55rem] text-muted-foreground mt-1 hover:text-foreground transition-colors"
                  >
                    {showEscapeBreakdown ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    Kans breakdown
                  </button>
                  {showEscapeBreakdown && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="overflow-hidden mt-1 bg-muted/20 rounded px-2 py-1.5 space-y-0.5"
                    >
                      <div className="flex justify-between text-[0.55rem]">
                        <span className="text-muted-foreground">Basis</span>
                        <span className="text-foreground font-mono">{Math.round(baseChance * 100)}%</span>
                      </div>
                      <div className="flex justify-between text-[0.55rem]">
                        <span className="text-muted-foreground flex items-center gap-1"><Brain size={9} /> Vernuft</span>
                        <span className="text-ice font-mono">+{Math.round(brainsBonus * 100)}%</span>
                      </div>
                      {hackerBonus > 0 && (
                        <div className="flex justify-between text-[0.55rem]">
                          <span className="text-muted-foreground flex items-center gap-1"><ShieldCheck size={9} /> Hacker</span>
                          <span className="text-emerald font-mono">+{Math.round(hackerBonus * 100)}%</span>
                        </div>
                      )}
                      {tunnelBonus > 0 && (
                        <div className="flex justify-between text-[0.55rem]">
                          <span className="text-muted-foreground flex items-center gap-1"><KeyRound size={9} /> Villa Tunnel</span>
                          <span className="text-gold font-mono">+{Math.round(tunnelBonus * 100)}%</span>
                        </div>
                      )}
                      <div className="border-t border-border pt-0.5 flex justify-between text-[0.6rem] font-bold">
                        <span>Totaal</span>
                        <span className="text-blood">{escapePercent}%</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {prison.escapeAttempted && (
                <div className="flex items-center gap-2 text-[0.6rem] text-muted-foreground bg-muted/30 rounded px-3 py-2">
                  <AlertTriangle size={12} />
                  <span>Ontsnappingspoging mislukt — geen tweede kans</span>
                </div>
              )}

              <GameButton
                variant="purple"
                size="md"
                fullWidth
                icon={<Dice1 size={14} />}
                onClick={() => setShowDice(true)}
                disabled={state.money < 50}
              >
                DOBBELEN — €{diceBet.toLocaleString()}
              </GameButton>

              <GameButton
                variant="muted"
                size="md"
                fullWidth
                icon={<Clock size={14} />}
                onClick={() => dispatch({ type: 'AUTO_TICK' })}
              >
                WACHT DE DAG AF
              </GameButton>
            </div>
          </div>
        </div>
      </motion.div>

      <ConfirmDialog
        open={confirmBribe}
        title="Omkoping"
        message={`Dit kost €${bribeCost.toLocaleString()}${hasLawyer ? ' (30% advocaat-korting)' : ''}. Je wordt direct vrijgelaten, maar je heat wordt NIET gereset. Doorgaan?`}
        confirmText="BETAAL & VRIJLATEN"
        cancelText="ANNULEREN"
        variant="warning"
        onConfirm={() => {
          setConfirmBribe(false);
          dispatch({ type: 'BRIBE_PRISON' });
          playCoinSound();
          showToast('Vrijgekocht! Heat blijft actief.');
        }}
        onCancel={() => setConfirmBribe(false)}
      />

      <ConfirmDialog
        open={confirmEscape}
        title="Ontsnappingspoging"
        message={`Je hebt ${escapePercent}% kans om te ontsnappen. Bij succes: direct vrij, maar +15 heat. Bij falen: +2 extra dagen. Je krijgt maar één poging.`}
        confirmText="PROBEER TE ONTSNAPPEN"
        cancelText="TE RISKANT"
        variant="warning"
        onConfirm={() => {
          setConfirmEscape(false);
          playDramaticReveal();
          dispatch({ type: 'ATTEMPT_ESCAPE' });
          // Delayed result sound after dramatic reveal
          setTimeout(() => {
            if (!state.prison) playVictorySound();
            else playNegativeSound();
          }, 700);
        }}
        onCancel={() => setConfirmEscape(false)}
      />

      {showDice && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6">
          <div className="w-full max-w-xs bg-card border border-border rounded-lg p-4 shadow-2xl">
            <DiceGame
              bet={diceBet}
              isPrison
              onResult={(won, amount) => {
                if (won) {
                  dispatch({ type: 'CASINO_WIN', amount: diceBet * 2 });
                  showToast(`🎲 Gewonnen! +€${diceBet.toLocaleString()}`);
                } else {
                  dispatch({ type: 'CASINO_BET', amount: diceBet });
                  showToast('🎲 Verloren!', true);
                }
              }}
              onClose={() => setShowDice(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
