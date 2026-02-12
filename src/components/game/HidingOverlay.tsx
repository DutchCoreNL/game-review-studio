import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { EyeOff, ShieldAlert, Clock, XCircle } from 'lucide-react';
import { GameButton } from './ui/GameButton';
import { ConfirmDialog } from './ConfirmDialog';
import { useState } from 'react';
import hidingBg from '@/assets/items/overlay-hiding.jpg';

export function HidingOverlay() {
  const { state, dispatch, showToast } = useGame();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const hidingDays = state.hidingDays || 0;

  if (hidingDays <= 0) return null;

  const hasSafeHouse = state.hqUpgrades.includes('safehouse');
  const decayPerDay = 15 + (hasSafeHouse ? 5 : 0);

  return (
    <>
      {/* Dim overlay across the entire map area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(var(--background) / 0.7) 0%, hsl(var(--background) / 0.92) 100%)',
        }}
      />

      {/* Central hiding panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 20 }}
        className="absolute inset-0 z-40 flex items-center justify-center px-6"
      >
        <div className="w-full max-w-xs bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
          {/* Banner */}
          <div className="relative h-28 overflow-hidden">
            <img src={hidingBg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            <div className="absolute bottom-2 left-4 flex items-center gap-2">
              <EyeOff size={18} className="text-ice" />
              <span className="font-bold text-sm uppercase tracking-wider text-ice">Ondergedoken</span>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-4 space-y-4">
            {/* Countdown */}
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-full border-2 border-ice/40 bg-ice/5 flex items-center justify-center"
              >
                <div className="text-center">
                  <span className="text-2xl font-black text-ice leading-none">{hidingDays}</span>
                  <p className="text-[0.5rem] text-ice/70 uppercase tracking-wider">
                    {hidingDays === 1 ? 'dag' : 'dagen'}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Info rows */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-[0.65rem]">
                <Clock size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Persoonlijke heat daalt met <span className="text-ice font-bold">-{decayPerDay}</span> per dag
                  {hasSafeHouse && <span className="text-emerald"> (Safe House bonus)</span>}
                </span>
              </div>
              <div className="flex items-start gap-2 text-[0.65rem]">
                <ShieldAlert size={12} className="text-blood mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Geen inkomen, handel of reizen. Vijanden kunnen je districten aanvallen.
                </span>
              </div>
            </div>

            {/* Day dots */}
            <div className="flex justify-center gap-2">
              {Array.from({ length: Math.min(hidingDays, 5) }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="w-3 h-3 rounded-full border border-ice/30 bg-ice/20"
                />
              ))}
            </div>

            {/* Cancel button */}
            <GameButton
              variant="blood"
              size="md"
              fullWidth
              icon={<XCircle size={14} />}
              onClick={() => setConfirmCancel(true)}
            >
              STOP ONDERDUIKEN
            </GameButton>
          </div>
        </div>
      </motion.div>

      <ConfirmDialog
        open={confirmCancel}
        title="Onderduiken Stoppen"
        message={`Je hebt nog ${hidingDays} dag(en) over. Als je nu stopt, krijg je geen verdere heat-reductie. Weet je het zeker?`}
        confirmText="STOP NU"
        cancelText="BLIJF SCHUILEN"
        variant="warning"
        onConfirm={() => {
          setConfirmCancel(false);
          dispatch({ type: 'CANCEL_HIDING' });
          showToast('Je bent weer op straat!');
        }}
        onCancel={() => setConfirmCancel(false)}
      />
    </>
  );
}
