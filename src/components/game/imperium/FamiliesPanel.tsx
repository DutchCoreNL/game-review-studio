import { useGame } from '@/contexts/GameContext';
import { FAMILIES } from '@/game/constants';
import { FamilyId } from '@/game/types';
import { getPlayerStat } from '@/game/engine';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { FactionCard } from '../faction/FactionCard';
import { AlliancePactPanel } from './AlliancePactPanel';
import { Skull, Shield } from 'lucide-react';
import { ViewWrapper } from '../ui/ViewWrapper';
import imperiumBg from '@/assets/imperium-bg.jpg';

export function FamiliesPanel() {
  const { state, dispatch, showToast } = useGame();
  const charmStat = getPlayerStat(state, 'charm');
  const bribeCost = Math.max(1000, 3500 - (charmStat * 150));

  const conqueredCount = state.conqueredFactions?.length || 0;
  const totalFactions = Object.keys(FAMILIES).length;

  return (
    <ViewWrapper bg={imperiumBg}>
      <SectionHeader title="Onderwereld" icon={<Skull size={12} />} />

      {conqueredCount > 0 && (
        <div className="game-card border-l-[3px] border-l-gold mb-3">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-xs text-gold">Verovering Voortgang</h4>
              <p className="text-[0.55rem] text-muted-foreground">
                {conqueredCount}/{totalFactions} facties onderworpen
                {conqueredCount >= totalFactions && ' — 👑 ABSOLUTE MACHT!'}
              </p>
            </div>
            <div className="flex gap-1">
              {(Object.keys(FAMILIES) as FamilyId[]).map(fid => (
                <div key={fid} className={`w-6 h-6 rounded flex items-center justify-center text-[0.5rem] font-bold ${
                  state.conqueredFactions?.includes(fid) ? 'bg-gold text-secondary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {state.conqueredFactions?.includes(fid) ? '👑' : '?'}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-[0.6rem] text-muted-foreground mb-3">
        Versla leiders of bereik relatie 100 om facties te annexeren. Klik om te interacteren.
      </p>

      <div className="space-y-3 mb-4">
        {(Object.keys(FAMILIES) as FamilyId[]).map(fid => (
          <FactionCard key={fid} familyId={fid} />
        ))}
      </div>

      <AlliancePactPanel />

      <SectionHeader title="Corruptie" icon={<Shield size={12} />} />
      <div className="game-card border-l-[3px] border-l-police">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold text-xs">Politie Omkopen</h4>
            <p className="text-[0.55rem] text-muted-foreground">Relatie: {state.policeRel}/100</p>
          </div>
          <GameButton variant="muted" size="sm"
            onClick={() => { dispatch({ type: 'BRIBE_POLICE' }); showToast('Politie omgekocht! Heat -15'); }}>
            KOOP OM (€{bribeCost.toLocaleString()})
          </GameButton>
        </div>
      </div>
    </ViewWrapper>
  );
}
