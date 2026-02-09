import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { Lock, DollarSign, KeyRound, Clock, AlertTriangle, Package } from 'lucide-react';
import { GameButton } from './ui/GameButton';
import { ConfirmDialog } from './ConfirmDialog';
import { useState } from 'react';
import { PRISON_BRIBE_COST_PER_DAY, PRISON_ESCAPE_BASE_CHANCE } from '@/game/constants';
import * as Engine from '@/game/engine';

export function PrisonOverlay() {
  const { state, dispatch, showToast } = useGame();
  const [confirmBribe, setConfirmBribe] = useState(false);
  const [confirmEscape, setConfirmEscape] = useState(false);
  const prison = state.prison;

  if (!prison) return null;

  const bribeCost = prison.daysRemaining * PRISON_BRIBE_COST_PER_DAY;
  const canAffordBribe = state.money >= bribeCost;

  // Calculate escape chance
  let escapeChance = PRISON_ESCAPE_BASE_CHANCE;
  escapeChance += Engine.getPlayerStat(state, 'brains') * 0.03;
  if (state.crew.some(c => c.role === 'Hacker')) escapeChance += 0.10;
  const hasTunnel = state.villa?.modules.includes('tunnel');
  if (hasTunnel) escapeChance += 0.25;
  const escapePercent = Math.min(95, Math.round(escapeChance * 100));

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
        className="absolute inset-0 z-40 flex items-center justify-center px-6"
      >
        <div className="w-full max-w-xs bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-blood/10 border-b border-blood/20 px-4 py-3 flex items-center gap-2">
            <Lock size={18} className="text-blood" />
            <span className="font-bold text-sm uppercase tracking-wider text-blood">Gevangenis</span>
          </div>

          {/* Body */}
          <div className="px-4 py-4 space-y-4">
            {/* Countdown */}
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-full border-2 border-blood/40 bg-blood/5 flex items-center justify-center"
              >
                <div className="text-center">
                  <span className="text-2xl font-black text-blood leading-none">{prison.daysRemaining}</span>
                  <p className="text-[0.5rem] text-blood/70 uppercase tracking-wider">
                    {prison.daysRemaining === 1 ? 'dag' : 'dagen'}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Confiscation info */}
            <div className="space-y-2">
              {prison.moneyLost > 0 && (
                <div className="flex items-start gap-2 text-[0.65rem]">
                  <DollarSign size={12} className="text-blood mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Geld in beslag genomen: <span className="text-blood font-bold">-€{prison.moneyLost.toLocaleString()}</span>
                  </span>
                </div>
              )}
              {prison.dirtyMoneyLost > 0 && (
                <div className="flex items-start gap-2 text-[0.65rem]">
                  <DollarSign size={12} className="text-blood mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Dirty money verloren: <span className="text-blood font-bold">-€{prison.dirtyMoneyLost.toLocaleString()}</span>
                  </span>
                </div>
              )}
              {prison.goodsLost.length > 0 && (
                <div className="flex items-start gap-2 text-[0.65rem]">
                  <Package size={12} className="text-blood mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Geconfisqueerd: <span className="text-blood font-bold">{prison.goodsLost.join(', ')}</span>
                  </span>
                </div>
              )}
              <div className="flex items-start gap-2 text-[0.65rem]">
                <Clock size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Geen handel, reizen of missies mogelijk. Business-inkomsten lopen door.
                </span>
              </div>
            </div>

            {/* Day dots */}
            <div className="flex justify-center gap-2">
              {Array.from({ length: Math.min(prison.daysRemaining, 7) }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="w-3 h-3 rounded-full border border-blood/30 bg-blood/20"
                />
              ))}
            </div>

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
              </GameButton>

              {!prison.escapeAttempted && (
                <GameButton
                  variant="blood"
                  size="md"
                  fullWidth
                  icon={<KeyRound size={14} />}
                  onClick={() => setConfirmEscape(true)}
                >
                  ONTSNAPPEN — {escapePercent}% kans
                </GameButton>
              )}

              {prison.escapeAttempted && (
                <div className="flex items-center gap-2 text-[0.6rem] text-muted-foreground bg-muted/30 rounded px-3 py-2">
                  <AlertTriangle size={12} />
                  <span>Ontsnappingspoging mislukt — geen tweede kans</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <ConfirmDialog
        open={confirmBribe}
        title="Omkoping"
        message={`Dit kost €${bribeCost.toLocaleString()}. Je wordt direct vrijgelaten, maar je heat wordt NIET gereset. Doorgaan?`}
        confirmText="BETAAL & VRIJLATEN"
        cancelText="ANNULEREN"
        variant="warning"
        onConfirm={() => {
          setConfirmBribe(false);
          dispatch({ type: 'BRIBE_PRISON' });
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
          dispatch({ type: 'ATTEMPT_ESCAPE' });
        }}
        onCancel={() => setConfirmEscape(false)}
      />
    </>
  );
}
