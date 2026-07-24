import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, TrendingUp, Coins, AlertTriangle, Users } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import {
  getLegacy, legacyIncomeMult, legacyStartCash, computeLegacyGain, canRetire,
  RETIRE_MIN_RESPECT, LEGACY_INCOME_PER_POINT,
} from '@/game/legacy';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';

export function LegacyView() {
  const { state, dispatch, showToast } = useGame();
  const legacy = getLegacy(state);
  const gain = computeLegacyGain(state);
  const eligible = canRetire(state);
  const respect = state.org?.respect || 0;
  const mult = legacyIncomeMult(state);
  const [confirming, setConfirming] = useState(false);

  const projectedPoints = legacy.points + gain;
  const projectedMult = 1 + projectedPoints * LEGACY_INCOME_PER_POINT;

  return (
    <div className="space-y-3">
      <SectionHeader title="De Opvolger" icon={<Crown size={12} />} />

      {/* Dynasty standing */}
      <div className="game-card border-l-[3px] border-l-gold">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm text-gold uppercase tracking-wide">Generatie {legacy.generation + 1}</h3>
              <GameBadge variant="gold" size="xs">{legacy.points} erfenis</GameBadge>
            </div>
            <p className="text-[0.55rem] text-muted-foreground mt-0.5">
              {legacy.generation === 0 ? 'De grondlegger van de dynastie.' : `${legacy.generation}e opvolger aan de macht.`}
            </p>
          </div>
          <Sparkles size={22} className="text-gold" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[0.5rem] text-muted-foreground uppercase tracking-wider mb-0.5">
              <TrendingUp size={9} className="text-emerald" /> Inkomen
            </div>
            <div className="text-sm font-bold text-emerald">×{mult.toFixed(2)}</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[0.5rem] text-muted-foreground uppercase tracking-wider mb-0.5">
              <Coins size={9} className="text-gold" /> Startkapitaal
            </div>
            <div className="text-sm font-bold text-gold">€{legacyStartCash(legacy.points).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="game-card">
        <p className="text-[0.55rem] text-muted-foreground leading-relaxed">
          Ga met pensioen en geef het imperium door aan je opvolger. Je begint opnieuw — verse crew,
          kas en level — maar je opvolger erft <span className="text-gold font-bold">erfenispunten</span>.
          Elk punt geeft permanent <span className="text-emerald font-bold">+{Math.round(LEGACY_INCOME_PER_POINT * 100)}% inkomen</span> en
          meer startkapitaal, zodat elke generatie sneller stijgt dan de vorige.
        </p>
      </div>

      {/* Retire */}
      <div className="game-card border-l-[3px] border-l-blood">
        <SectionHeader title="Pensioen nemen" icon={<Users size={12} />} />
        <div className="flex items-center justify-between my-2">
          <span className="text-[0.6rem] text-muted-foreground">Erfenis bij pensioen nu</span>
          <span className={`text-sm font-bold ${gain > 0 ? 'text-gold' : 'text-muted-foreground'}`}>+{gain}</span>
        </div>
        {gain > 0 && (
          <div className="flex items-center justify-between mb-2 text-[0.55rem]">
            <span className="text-muted-foreground">Nieuw inkomen na pensioen</span>
            <span className="text-emerald font-bold">×{projectedMult.toFixed(2)}</span>
          </div>
        )}

        {!eligible ? (
          <div className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <AlertTriangle size={13} className="text-gold mt-0.5 shrink-0" />
            <span className="text-[0.55rem] text-muted-foreground leading-snug">
              Je organisatie heeft minstens <b>{RETIRE_MIN_RESPECT} aanzien</b> nodig om iets na te laten.
              {' '}Nu: <b>{respect}</b>. Bouw je imperium verder uit.
            </span>
          </div>
        ) : !confirming ? (
          <GameButton variant="blood" size="lg" fullWidth glow onClick={() => setConfirming(true)}>
            Met pensioen gaan
          </GameButton>
        ) : (
          <div className="space-y-2">
            <p className="text-[0.55rem] text-blood text-center font-bold">
              Weet je het zeker? Je huidige imperium, crew en voortgang gaan verloren.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <GameButton variant="muted" size="sm" onClick={() => setConfirming(false)}>Annuleren</GameButton>
              <GameButton variant="blood" size="sm" glow
                onClick={() => {
                  dispatch({ type: 'RETIRE_SUCCESSOR' });
                  showToast(`Generatie ${legacy.generation + 2} neemt over! +${gain} erfenis.`);
                  setConfirming(false);
                }}>
                Doorgeven
              </GameButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
