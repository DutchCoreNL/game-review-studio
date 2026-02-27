import { useGame } from '@/contexts/GameContext';
import { BUSINESSES, FAMILIES, DISTRICTS } from '@/game/constants';
import { FamilyId } from '@/game/types';
import { getPlayerStat } from '@/game/engine';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { StatBar } from './ui/StatBar';
import { GameBadge } from './ui/GameBadge';
import { FactionCard } from './faction/FactionCard';
import { SmuggleRoutesPanel } from './imperium/SmuggleRoutesPanel';
import { DistrictDefensePanel } from './imperium/DistrictDefensePanel';
import { CorruptionView } from './CorruptionView';
import { AlliancePactPanel } from './imperium/AlliancePactPanel';
import { Car, Factory, Store, Users, Skull, Handshake, Swords, Shield } from 'lucide-react';
import { GangView } from './GangView';
import { useState } from 'react';
import { SubTabBar, SubTab } from './ui/SubTabBar';
import { ViewWrapper } from './ui/ViewWrapper';
import imperiumBg from '@/assets/imperium-bg.jpg';
import { GarageView } from './garage/GarageView';

type ImperiumSubTab = 'garage' | 'business' | 'families' | 'war' | 'corruption' | 'gang';

export function ImperiumView() {
  const { state, dispatch, showToast } = useGame();
  const [subTab, setSubTab] = useState<ImperiumSubTab>('garage');

  const tabs: SubTab<ImperiumSubTab>[] = [
    { id: 'garage', label: 'GARAGE', icon: <Car size={12} /> },
    { id: 'business', label: 'BUSINESS', icon: <Store size={12} /> },
    { id: 'families', label: 'FACTIES', icon: <Users size={12} /> },
    { id: 'gang', label: 'GANG', icon: <Skull size={12} /> },
    { id: 'war', label: 'OORLOG', icon: <Swords size={12} /> },
    { id: 'corruption', label: 'CORRUPTIE', icon: <Handshake size={12} /> },
  ];

  return (
    <ViewWrapper bg={imperiumBg}>
      <SubTabBar tabs={tabs} active={subTab} onChange={(id) => setSubTab(id as ImperiumSubTab)} />

      {subTab === 'garage' && <GarageView />}
      {subTab === 'gang' && <GangView />}
      {subTab === 'business' && <BusinessPanel />}
      {subTab === 'war' && <DistrictDefensePanel />}
      {subTab === 'families' && <FamiliesPanel />}
      {subTab === 'corruption' && <CorruptionView />}
    </ViewWrapper>
  );
}

function BusinessPanel() {
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
    if (b.reqDistrict && !state.ownedDistricts.includes(b.reqDistrict)) return false;
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
    <div>
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
    </div>
  );
}

function FamiliesPanel() {
  const { state, dispatch, showToast } = useGame();
  const charmStat = getPlayerStat(state, 'charm');
  const bribeCost = Math.max(1000, 3500 - (charmStat * 150));

  const conqueredCount = state.conqueredFactions?.length || 0;
  const totalFactions = Object.keys(FAMILIES).length;

  return (
    <div>
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
    </div>
  );
}
