import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, BUSINESSES, GOODS } from '@/game/constants';
import { SectionHeader } from '../ui/SectionHeader';
import { InfoRow } from '../ui/InfoRow';
import { StatBar } from '../ui/StatBar';
import { BarChart3, TrendingUp, Shield, Flame, Building2, Coins, Car } from 'lucide-react';
import { getKarmaHeatDecayBonus } from '@/game/karma';
import { DistrictId } from '@/game/types';

export function StatsOverviewPanel() {
  const { state } = useGame();

  // Income breakdown
  const districtIncome = state.ownedDistricts.reduce((s, id) => s + DISTRICTS[id].income, 0);
  const businessIncome = state.ownedBusinesses.reduce((s, bid) => {
    const biz = BUSINESSES.find(b => b.id === bid);
    return s + (biz?.income || 0);
  }, 0);
  const totalDailyIncome = districtIncome + businessIncome;

  // Heat breakdown
  const vehicleHeat = state.ownedVehicles.find(v => v.id === state.activeVehicle)?.vehicleHeat ?? 0;
  const personalHeat = state.personalHeat ?? 0;
  const globalHeat = state.heat;

  // Heat decay calculation
  let vDecay = 8;
  if (state.ownedDistricts.includes('crown')) vDecay += 2;
  if (state.villa?.modules.includes('server_room')) vDecay += 5;

  let pDecay = 2;
  if (state.ownedDistricts.includes('crown')) pDecay += 1;
  if (state.villa?.modules.includes('server_room')) pDecay += 5;
  if (state.crew.some(c => c.role === 'Hacker')) pDecay += 2;
  pDecay += getKarmaHeatDecayBonus(state);
  if (state.safehouses) {
    state.safehouses.forEach(sh => {
      if (sh.district === state.loc) {
        pDecay += sh.level <= 1 ? 3 : sh.level === 2 ? 5 : 8;
      } else {
        pDecay += sh.level >= 2 ? 1 : 0;
      }
    });
  }

  // Active bonuses
  const bonuses: { label: string; source: string }[] = [];
  if (state.ownedDistricts.includes('port')) bonuses.push({ label: '+10% Opslag', source: 'Port Nero' });
  if (state.ownedDistricts.includes('crown')) bonuses.push({ label: '-20% Heat Decay', source: 'Crown Heights' });
  if (state.ownedDistricts.includes('iron')) bonuses.push({ label: '-20% Healing', source: 'Iron Borough' });
  if (state.ownedDistricts.includes('low')) bonuses.push({ label: 'Goedkopere Ops', source: 'Lowrise' });
  if (state.ownedDistricts.includes('neon')) bonuses.push({ label: '+10% Casino', source: 'Neon Strip' });
  if (state.villa?.modules.includes('server_room')) bonuses.push({ label: '+5 Heat Decay', source: 'Villa Server Room' });
  if (state.villa?.modules.includes('kluis')) bonuses.push({ label: 'Geld Beschermd', source: 'Villa Kluis' });
  if (state.crew.some(c => c.role === 'Hacker')) bonuses.push({ label: '+2 Heat Decay', source: 'Hacker Crew' });
  if (state.crew.some(c => c.role === 'Smokkelaar')) bonuses.push({ label: '+5 Opslag', source: 'Smokkelaar Crew' });

  // Washing capacity
  const dailyWash = state.ownedBusinesses.reduce((s, bid) => {
    const biz = BUSINESSES.find(b => b.id === bid);
    return s + (biz?.clean || 0);
  }, 0);

  return (
    <div>
      <SectionHeader title="Financieel Overzicht" icon={<TrendingUp size={12} />} />
      <div className="game-card mb-4">
        <div className="grid grid-cols-2 gap-2">
          <InfoRow icon={<Building2 size={10} />} label="District Inkomen" value={`€${districtIncome.toLocaleString()}/dag`} valueClass="text-emerald" />
          <InfoRow icon={<Coins size={10} />} label="Bedrijf Inkomen" value={`€${businessIncome.toLocaleString()}/dag`} valueClass="text-emerald" />
          <InfoRow icon={<TrendingUp size={10} />} label="Totaal Dagelijks" value={`€${totalDailyIncome.toLocaleString()}/dag`} valueClass="text-gold" />
          <InfoRow icon={<Coins size={10} />} label="Witwas Capaciteit" value={`€${dailyWash.toLocaleString()}/dag`} valueClass="text-ice" />
          <InfoRow icon={<Coins size={10} />} label="Zwart Geld" value={`€${state.dirtyMoney.toLocaleString()}`} valueClass="text-muted-foreground" />
          {state.debt > 0 && (
            <InfoRow icon={<Coins size={10} />} label="Rente/dag" value={`-€${Math.floor(state.debt * 0.03).toLocaleString()}`} valueClass="text-blood" />
          )}
        </div>
      </div>

      <SectionHeader title="Heat Breakdown" icon={<Flame size={12} />} />
      <div className="game-card mb-4 space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">🌐 Globaal</span>
            <span className="font-bold">{globalHeat}/100</span>
          </div>
          <StatBar value={globalHeat} max={100} color="blood" height="sm" />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">🚗 Voertuig</span>
            <span className="font-bold">{vehicleHeat}/100 <span className="text-emerald text-[0.5rem]">(-{vDecay}/dag)</span></span>
          </div>
          <StatBar value={vehicleHeat} max={100} color="gold" height="sm" />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">👤 Persoonlijk</span>
            <span className="font-bold">{personalHeat}/100 <span className="text-emerald text-[0.5rem]">(-{pDecay}/dag)</span></span>
          </div>
          <StatBar value={personalHeat} max={100} color="purple" height="sm" />
        </div>
      </div>

      {bonuses.length > 0 && (
        <>
          <SectionHeader title="Actieve Bonussen" icon={<Shield size={12} />} />
          <div className="game-card mb-4">
            <div className="space-y-1.5">
              {bonuses.map((b, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-gold font-semibold">{b.label}</span>
                  <span className="text-[0.5rem] text-muted-foreground">{b.source}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
