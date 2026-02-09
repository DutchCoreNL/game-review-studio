import { useGame } from '@/contexts/GameContext';
import { VEHICLES, BUSINESSES, HQ_UPGRADES, FAMILIES } from '@/game/constants';
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
import { motion } from 'framer-motion';
import { Car, Gauge, Shield, Gem, Wrench, Factory, Store, Crown, Users, Skull, Handshake, Swords } from 'lucide-react';
import { useState } from 'react';

type SubTab = 'assets' | 'business' | 'families' | 'corruption' | 'war';

export function ImperiumView() {
  const { state, dispatch, showToast } = useGame();
  const [subTab, setSubTab] = useState<SubTab>('assets');

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4 mt-1 flex-wrap">
        {([
          { id: 'assets' as SubTab, label: 'BEZIT', icon: <Car size={12} /> },
          { id: 'business' as SubTab, label: 'BEDRIJVEN', icon: <Store size={12} /> },
          { id: 'war' as SubTab, label: 'OORLOG', icon: <Swords size={12} /> },
          { id: 'families' as SubTab, label: 'FACTIES', icon: <Users size={12} /> },
          { id: 'corruption' as SubTab, label: 'CORRUPTIE', icon: <Handshake size={12} /> },
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

      {subTab === 'assets' && <AssetsPanel />}
      {subTab === 'business' && <BusinessPanel />}
      {subTab === 'war' && <DistrictDefensePanel />}
      {subTab === 'families' && <FamiliesPanel />}
      {subTab === 'corruption' && <CorruptionView />}
    </div>
  );
}

function AssetsPanel() {
  const { state, dispatch, showToast } = useGame();
  const activeV = VEHICLES.find(v => v.id === state.activeVehicle);
  const activeObj = state.ownedVehicles.find(v => v.id === state.activeVehicle);
  const ownedIds = state.ownedVehicles.map(v => v.id);

  return (
    <div>
      {/* Active Vehicle */}
      <SectionHeader title="Garage" icon={<Car size={12} />} />
      {activeV && activeObj && (
        <motion.div className="game-card border-l-[3px] border-l-gold mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
              <Car size={20} className="text-gold" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{activeV.name}</h3>
              <p className="text-[0.55rem] text-muted-foreground">{activeV.desc}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            <MiniStat icon={<Car size={10} />} label="Store" value={activeV.storage} />
            <MiniStat icon={<Gauge size={10} />} label="Speed" value={activeV.speed} />
            <MiniStat icon={<Shield size={10} />} label="Armor" value={activeV.armor} />
            <MiniStat icon={<Gem size={10} />} label="Charm" value={activeV.charm} />
          </div>

          <StatBar value={activeObj.condition} max={100} color={activeObj.condition > 50 ? 'emerald' : 'blood'} label="Conditie" showLabel />

          {activeObj.condition < 100 && (
            <GameButton
              variant="blood"
              size="sm"
              fullWidth
              icon={<Wrench size={12} />}
              onClick={() => { dispatch({ type: 'REPAIR_VEHICLE' }); showToast('Auto gerepareerd!'); }}
              className="mt-2"
            >
              REPAREER (€{(100 - activeObj.condition) * 25})
            </GameButton>
          )}
        </motion.div>
      )}

      {/* Other owned vehicles */}
      {state.ownedVehicles.length > 1 && (
        <div className="space-y-2 mb-4">
          {state.ownedVehicles.filter(v => v.id !== state.activeVehicle).map(ov => {
            const vDef = VEHICLES.find(v => v.id === ov.id)!;
            return (
              <div key={ov.id} className="game-card flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-xs">{vDef.name}</h4>
                  <p className="text-[0.5rem] text-muted-foreground">Conditie: {ov.condition}%</p>
                </div>
                <GameButton variant="gold" size="sm" onClick={() => { dispatch({ type: 'SET_VEHICLE', id: ov.id }); showToast(`${vDef.name} geselecteerd`); }}>
                  GEBRUIK
                </GameButton>
              </div>
            );
          })}
        </div>
      )}

      {/* Buy Vehicles */}
      <SectionHeader title="Chop Shop" />
      <div className="space-y-2 mb-4">
        {VEHICLES.filter(v => !ownedIds.includes(v.id)).map(v => (
          <div key={v.id} className="game-card">
            <h4 className="font-bold text-xs">{v.name}</h4>
            <p className="text-[0.5rem] text-muted-foreground">
              Store: {v.storage} | Spd: {v.speed} | Arm: {v.armor} | Charm: {v.charm}
            </p>
            <GameButton variant="gold" size="sm" fullWidth disabled={state.money < v.cost}
              onClick={() => { dispatch({ type: 'BUY_VEHICLE', id: v.id }); showToast(`${v.name} gekocht!`); }} className="mt-2">
              KOOP €{v.cost.toLocaleString()}
            </GameButton>
          </div>
        ))}
      </div>

      {/* Lab */}
      {state.hqUpgrades.includes('lab') && (
        <>
          <SectionHeader title="Synthetica Lab" icon={<Factory size={12} />} />
          <div className="game-card border-l-[3px] border-l-game-purple mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Factory size={16} className="text-game-purple" />
                <div>
                  <h4 className="font-bold text-xs">Lab Actief</h4>
                  <p className="text-[0.5rem] text-muted-foreground">Chemicaliën: {state.lab.chemicals}</p>
                </div>
              </div>
              <GameButton variant="purple" size="sm"
                onClick={() => { dispatch({ type: 'BUY_CHEMICALS', amount: 10 }); showToast('Chemicaliën gekocht'); }}>
                KOOP 10 (€500)
              </GameButton>
            </div>
            <p className="text-[0.5rem] text-muted-foreground">Productie: max 20 Synthetica per nacht</p>
          </div>
        </>
      )}

      {/* Smuggle Routes */}
      <div className="mb-4">
        <SmuggleRoutesPanel />
      </div>

      {/* HQ Upgrades */}
      <SectionHeader title="HQ Upgrades" icon={<Crown size={12} />} />
      <div className="space-y-2">
        {HQ_UPGRADES.map(u => {
          const owned = state.hqUpgrades.includes(u.id);
          return (
            <div key={u.id} className="game-card flex justify-between items-center">
              <div>
                <h4 className="font-bold text-xs">{u.name}</h4>
                <p className="text-[0.5rem] text-muted-foreground">{u.desc}</p>
              </div>
              <GameButton variant={owned ? 'muted' : 'gold'} size="sm" disabled={owned || state.money < u.cost}
                onClick={() => { dispatch({ type: 'BUY_UPGRADE', id: u.id }); showToast(`${u.name} geïnstalleerd!`); }}>
                {owned ? 'BEZIT' : `€${u.cost.toLocaleString()}`}
              </GameButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BusinessPanel() {
  const { state, dispatch, showToast } = useGame();

  return (
    <div>
      <SectionHeader title="Dekmantels" icon={<Store size={12} />} />
      <div className="space-y-2 mb-4">
        {BUSINESSES.map(b => {
          const owned = state.ownedBusinesses.includes(b.id);
          return (
            <div key={b.id} className="game-card flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Store size={14} className={owned ? 'text-emerald' : 'text-muted-foreground'} />
                <div>
                  <h4 className="font-bold text-xs">{b.name}</h4>
                  <p className="text-[0.5rem] text-muted-foreground">{b.desc}</p>
                  <p className="text-[0.45rem] text-gold">+€{b.income}/dag | Wast €{b.clean}/dag</p>
                </div>
              </div>
              <GameButton variant={owned ? 'muted' : 'gold'} size="sm" disabled={owned || state.money < b.cost}
                onClick={() => { dispatch({ type: 'BUY_BUSINESS', id: b.id }); showToast(`${b.name} gekocht!`); }}>
                {owned ? 'BEZIT' : `€${b.cost.toLocaleString()}`}
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
