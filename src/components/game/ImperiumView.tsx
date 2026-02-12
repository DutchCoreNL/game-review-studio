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
import { Car, Factory, Store, Users, Skull, Handshake, Swords, Shield } from 'lucide-react';
import { useState } from 'react';
import imperiumBg from '@/assets/imperium-bg.jpg';
import { GarageView } from './garage/GarageView';
import { AlliancePactPanel } from './imperium/AlliancePactPanel';

type SubTab = 'garage' | 'assets' | 'business' | 'families' | 'corruption' | 'war' | 'alliances';

export function ImperiumView() {
  const { state, dispatch, showToast } = useGame();
  const [subTab, setSubTab] = useState<SubTab>('garage');

  return (
    <div className="relative min-h-[70vh] -mx-3 -mt-2 px-3 pt-2">
      <img src={imperiumBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30 pointer-events-none" />
      <div className="relative z-10">
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4 mt-1 flex-wrap">
        {([
          { id: 'garage' as SubTab, label: 'GARAGE', icon: <Car size={12} /> },
          { id: 'assets' as SubTab, label: 'BEZIT', icon: <Store size={12} /> },
          { id: 'business' as SubTab, label: 'BEDRIJVEN', icon: <Store size={12} /> },
          { id: 'war' as SubTab, label: 'OORLOG', icon: <Swords size={12} /> },
          { id: 'families' as SubTab, label: 'FACTIES', icon: <Users size={12} /> },
          { id: 'corruption' as SubTab, label: 'CORRUPTIE', icon: <Handshake size={12} /> },
          { id: 'alliances' as SubTab, label: 'PACTEN', icon: <Shield size={12} /> },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex-1 py-2 rounded text-[0.5rem] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
              subTab === tab.id
                ? 'bg-gold/15 border border-gold text-gold'
                : 'bg-muted border border-border text-muted-foreground'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'garage' && <GarageView />}
      {subTab === 'assets' && <AssetsPanel />}
      {subTab === 'business' && <BusinessPanel />}
      {subTab === 'war' && <DistrictDefensePanel />}
      {subTab === 'families' && <FamiliesPanel />}
      {subTab === 'corruption' && <CorruptionView />}
      {subTab === 'alliances' && <AlliancePactPanel />}
      </div>
    </div>
  );
}

function AssetsPanel() {
  const { state } = useGame();

  return (
    <div>
      {/* Smuggle Routes */}
      <div className="mb-4">
        <SmuggleRoutesPanel />
      </div>

      {/* Lab (legacy HQ upgrade — still shown if owned, villa lab takes over) */}
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
    </div>
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

  // Sort: owned first, then unlocked, then locked
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

      {/* Witwassen */}
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

      {/* Conquest progress */}
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

      {/* Corruptie */}
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

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-muted/50 rounded p-1.5 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">{icon}</div>
      <div className="text-[0.45rem] text-muted-foreground uppercase">{label}</div>
      <div className="text-xs font-bold">{value}</div>
    </div>
  );
}
