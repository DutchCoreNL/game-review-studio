import { useGame } from '@/contexts/GameContext';
import { FAMILIES } from '@/game/constants';
import { FamilyId } from '@/game/types';
import { isFactionActive } from '@/game/engine';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { motion } from 'framer-motion';
import { Handshake, Clock, Shield, XCircle } from 'lucide-react';

export function AlliancePactPanel() {
  const { state, dispatch, showToast } = useGame();
  const pacts = state.alliancePacts || {};
  const factionIds = Object.keys(FAMILIES) as FamilyId[];

  return (
    <>
      <SectionHeader title="Alliantie Pacten" icon={<Handshake size={12} />} />
      <p className="text-[0.55rem] text-muted-foreground mb-3">
        Sluit tijdelijke pacten met facties voor wederzijdse voordelen. Vereist relatie ≥30.
      </p>

      <div className="space-y-2 mb-4">
        {factionIds.map(fid => {
          const fam = FAMILIES[fid];
          const rel = state.familyRel[fid] || 0;
          const active = isFactionActive(state, fid);
          const pact = pacts[fid];
          const hasPact = pact?.active;
          const daysLeft = hasPact ? pact.expiresDay - state.day : 0;
          const cost = Math.max(5000, 15000 - rel * 100);
          const canForm = active && rel >= 30 && state.money >= cost && !hasPact;

          return (
            <motion.div
              key={fid}
              className={`game-card border-l-[3px] ${hasPact ? 'border-l-emerald bg-emerald/5' : 'border-l-border'}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ borderLeftColor: hasPact ? undefined : fam.color }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs">{fam.name}</h4>
                  <span className="text-[0.45rem] px-1.5 py-0.5 rounded font-bold"
                    style={{ backgroundColor: fam.color + '20', color: fam.color }}>
                    REL: {rel}
                  </span>
                </div>
                {hasPact && (
                  <div className="flex items-center gap-1 text-[0.5rem] text-emerald font-bold">
                    <Shield size={10} />
                    <Clock size={9} /> {daysLeft}d
                  </div>
                )}
              </div>

              {!active && (
                <p className="text-[0.5rem] text-muted-foreground">Factie uitgeschakeld — geen pact mogelijk.</p>
              )}

              {active && hasPact && (
                <div className="mb-2">
                  <div className="text-[0.55rem] text-emerald font-semibold mb-1">
                    ✓ {pact.benefit}
                  </div>
                  <div className="text-[0.45rem] text-muted-foreground">
                    Kosten: €{pact.costPerDay}/dag · Verloopt dag {pact.expiresDay}
                  </div>
                  <GameButton
                    variant="blood"
                    size="sm"
                    className="mt-1.5"
                    icon={<XCircle size={10} />}
                    onClick={() => {
                      dispatch({ type: 'BREAK_ALLIANCE', familyId: fid });
                      showToast(`Alliantie met ${fam.name} verbroken! Relatie -20.`, true);
                    }}
                  >
                    VERBREEK PACT
                  </GameButton>
                </div>
              )}

              {active && !hasPact && (
                <div>
                  <p className="text-[0.5rem] text-muted-foreground mb-1.5">
                    {fid === 'cartel' ? '-15% Marktprijzen Drugs' : fid === 'syndicate' ? '+20% Hack Inkomsten' : '+15% Combat Bonus'}
                    {' · '}10 dagen · €{cost.toLocaleString()}
                  </p>
                  <GameButton
                    variant="gold"
                    size="sm"
                    fullWidth
                    icon={<Handshake size={10} />}
                    disabled={!canForm}
                    glow={canForm}
                    onClick={() => {
                      dispatch({ type: 'FORM_ALLIANCE', familyId: fid });
                      showToast(`Alliantie gesloten met ${fam.name}!`);
                    }}
                  >
                    {rel < 30 ? `RELATIE TE LAAG (${rel}/30)` : `SLUIT PACT — €${cost.toLocaleString()}`}
                  </GameButton>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
