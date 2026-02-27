import { useGame } from '@/contexts/GameContext';
import { BUSINESSES, DISTRICTS } from '@/game/constants';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { SmuggleRoutesPanel } from './SmuggleRoutesPanel';
import { Store, Factory } from 'lucide-react';
import { ViewWrapper } from '../ui/ViewWrapper';
import imperiumBg from '@/assets/imperium-bg.jpg';

export function BusinessPanel() {
  const { state, dispatch, showToast } = useGame();

  const getRequirements = (b: typeof BUSINESSES[0]) => {
    const reqs: string[] = [];
    if (b.reqDistrict) {
      const dName = DISTRICTS[b.reqDistrict]?.name || b.reqDistrict;
      reqs.push(`📍 ${dName}`);
    }
    if (b.reqRep) reqs.push(`⭐ Rep ${b.reqRep}`);
    if (b.reqDay) reqs.push(`📅 Dag ${b.reqDay}+`);
    if (b.reqBusinessCount) reqs.push(`🏪 ${b.reqBusinessCount}+ bedrijven`);
    return reqs;
  };

  const isUnlocked = (b: typeof BUSINESSES[0]) => {
    // reqDistrict removed (MMO: gang influence only)
    if (b.reqRep && state.rep < b.reqRep) return false;
    if (b.reqDay && state.day < b.reqDay) return false;
    if (b.reqBusinessCount && state.ownedBusinesses.length < b.reqBusinessCount) return false;
    return true;
  };

  const sorted = [...BUSINESSES].sort((a, b) => {
    const aOwned = state.ownedBusinesses.includes(a.id) ? 0 : 1;
    const bOwned = state.ownedBusinesses.includes(b.id) ? 0 : 1;
    if (aOwned !== bOwned) return aOwned - bOwned;
    const aUnlocked = isUnlocked(a) ? 0 : 1;
    const bUnlocked = isUnlocked(b) ? 0 : 1;
    return aUnlocked - bUnlocked;
  });

  return (
    <ViewWrapper bg={imperiumBg}>
      <div className="mb-4">
        <SmuggleRoutesPanel />
      </div>

      {state.hqUpgrades.includes('lab') && !state.villa?.modules.includes('synthetica_lab') && (
        <>
          <SectionHeader title="Synthetica Lab (Legacy)" icon={<Factory size={12} />} />
          <div className="game-card border-l-[3px] border-l-game-purple mb-4">
            <p className="text-[0.5rem] text-muted-foreground">
              ⚠️ Dit lab wordt vervangen door de villa-module. Koop het Synthetica Lab in je villa voor verbeterde productie.
            </p>
          </div>
        </>
      )}

      <SectionHeader title="Dekmantels" icon={<Store size={12} />} />
      <div className="space-y-2 mb-4">
        {sorted.map(b => {
          const owned = state.ownedBusinesses.includes(b.id);
          const unlocked = isUnlocked(b);
          const reqs = getRequirements(b);
          const locked = !owned && !unlocked;
          return (
            <div key={b.id} className={`game-card flex justify-between items-center ${locked ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-2">
                <Store size={14} className={owned ? 'text-emerald' : locked ? 'text-muted-foreground/50' : 'text-muted-foreground'} />
                <div>
                  <h4 className="font-bold text-xs">{b.name}</h4>
                  <p className="text-[0.5rem] text-muted-foreground">{b.desc}</p>
                  <p className="text-[0.45rem] text-gold">+€{b.income}/dag | Wast €{b.clean}/dag</p>
                  {locked && reqs.length > 0 && (
                    <p className="text-[0.45rem] text-blood mt-0.5">🔒 {reqs.join(' · ')}</p>
                  )}
                </div>
              </div>
              <GameButton variant={owned ? 'muted' : locked ? 'muted' : 'gold'} size="sm" disabled={owned || locked || state.money < b.cost}
                onClick={() => { dispatch({ type: 'BUY_BUSINESS', id: b.id }); showToast(`${b.name} gekocht!`); }}>
                {owned ? 'BEZIT' : locked ? '🔒' : `€${b.cost.toLocaleString()}`}
              </GameButton>
            </div>
          );
        })}
      </div>

      {state.dirtyMoney > 0 && (
        <>
          <SectionHeader title="Witwassen" />
          <div className="game-card border-l-[3px] border-l-dirty">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-xs">Zwart Geld</h4>
                <p className="text-[0.55rem] text-dirty">€{state.dirtyMoney.toLocaleString()} beschikbaar</p>
              </div>
              <GameButton variant="gold" size="sm"
                onClick={() => { dispatch({ type: 'WASH_MONEY' }); showToast('Geld witgewassen!'); }}>
                WASSEN
              </GameButton>
            </div>
          </div>
        </>
      )}
    </ViewWrapper>
  );
}
