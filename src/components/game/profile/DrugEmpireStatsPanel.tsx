import { useGame } from '@/contexts/GameContext';
import { SectionHeader } from '../ui/SectionHeader';
import { InfoRow } from '../ui/InfoRow';
import { StatBar } from '../ui/StatBar';
import { DRUG_EMPIRE_IMAGES } from '@/assets/items';
import { DISTRICTS } from '@/game/constants';
import { calculateDealerIncome, DRUG_TIER_LABELS, type ProductionLabId, type DrugTier } from '@/game/drugEmpire';
import { Skull, TrendingUp, FlaskConical, AlertTriangle, Users, Gem, ShieldAlert, Sprout } from 'lucide-react';

const RISK_EVENT_ICONS: Record<string, string> = {
  lab_raid: '🚨',
  contaminated_batch: '☠️',
  rival_sabotage: '⚔️',
  dea_investigation: '🔍',
  big_harvest: '🌿',
};

const RISK_EVENT_COLORS: Record<string, string> = {
  lab_raid: 'text-blood',
  contaminated_batch: 'text-blood',
  rival_sabotage: 'text-gold',
  dea_investigation: 'text-blood',
  big_harvest: 'text-emerald',
};

export function DrugEmpireStatsPanel() {
  const { state } = useGame();
  const de = state.drugEmpire;

  if (!de) return (
    <div className="game-card text-center py-6">
      <Skull size={24} className="mx-auto text-muted-foreground mb-2" />
      <p className="text-xs text-muted-foreground">Drug Imperium nog niet ontgrendeld.</p>
      <p className="text-[0.5rem] text-muted-foreground mt-1">Koop een productiemodule in je Villa.</p>
    </div>
  );

  const labNames: Record<ProductionLabId, string> = {
    wietplantage: 'Wietplantage',
    coke_lab: 'Coke Lab',
    synthetica_lab: 'Synthetica Lab',
  };

  const totalMarketShare = de.dealers.length > 0
    ? Math.round(de.dealers.reduce((sum, d) => sum + d.marketShare, 0) / de.dealers.length)
    : 0;

  const totalDealerIncomePerNight = de.dealers.reduce((sum, d) => sum + calculateDealerIncome(d, state), 0);

  return (
    <div className="space-y-4">
      <SectionHeader title="💀 Drug Imperium" icon={<Skull size={12} />} badge="Statistieken" />

      {/* Hero banner */}
      <div className="relative h-28 rounded-lg overflow-hidden">
        <img src={DRUG_EMPIRE_IMAGES.dealer_network} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-sm font-bold font-display tracking-wider text-gold">IMPERIUM OVERZICHT</p>
          <p className="text-[0.55rem] text-muted-foreground">Totaaloverzicht van je drugsoperatie</p>
        </div>
      </div>

      {/* Revenue stats */}
      <div className="game-card border-l-[3px] border-l-emerald">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp size={12} className="text-emerald" />
          <span className="text-xs font-bold text-emerald">Inkomsten</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <InfoRow icon={<Users size={10} />} label="Dealer totaal" value={`€${(de.totalDealerIncome || 0).toLocaleString()}`} valueClass="text-emerald" />
          <InfoRow icon={<Users size={10} />} label="Per nacht" value={`€${totalDealerIncomePerNight.toLocaleString()}`} valueClass="text-emerald" />
          <InfoRow icon={<Gem size={10} />} label="NoxCrystal omzet" value={`€${(de.totalNoxCrystalRevenue || 0).toLocaleString()}`} valueClass="text-game-purple" />
          <InfoRow icon={<Gem size={10} />} label="NoxCrystal verkocht" value={`${de.totalNoxCrystalSold || 0}x`} valueClass="text-game-purple" />
        </div>
      </div>

      {/* Lab Status */}
      <div className="game-card">
        <div className="flex items-center gap-1.5 mb-2">
          <FlaskConical size={12} className="text-gold" />
          <span className="text-xs font-bold text-gold">Lab Status</span>
        </div>
        <div className="space-y-2">
          {(['wietplantage', 'coke_lab', 'synthetica_lab'] as ProductionLabId[]).map(labId => {
            if (!state.villa?.modules.includes(labId)) return null;
            const tier = de.labTiers[labId];
            const quality = de.selectedQuality[labId];
            const offline = de.labOffline[labId] > 0;
            const tierImg = tier >= 3 ? DRUG_EMPIRE_IMAGES.lab_tier3 : tier >= 2 ? DRUG_EMPIRE_IMAGES.lab_tier2 : DRUG_EMPIRE_IMAGES.lab_tier1;
            return (
              <div key={labId} className="flex items-center gap-2">
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                  <img src={tierImg} alt="" className={`w-full h-full object-cover ${offline ? 'grayscale' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.65rem] font-bold truncate">{labNames[labId]}</span>
                    <span className="text-[0.55rem] text-gold font-bold">Tier {tier}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[0.5rem] text-muted-foreground">
                    <span>Kwaliteit: {DRUG_TIER_LABELS[quality]}</span>
                    {offline && <span className="text-blood font-bold">OFFLINE ({de.labOffline[labId]}d)</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* NoxCrystal */}
      <div className="game-card border-l-[3px] border-l-game-purple">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
            <img src={DRUG_EMPIRE_IMAGES.noxcrystal} alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-xs font-bold text-game-purple">NoxCrystal</span>
            <div className="flex gap-3 text-[0.55rem] text-muted-foreground">
              <span>Voorraad: <b className="text-game-purple">{de.noxCrystalStock}</b></span>
              <span>Geproduceerd: <b>{de.noxCrystalProduced}</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Dealer Network */}
      {de.dealers.length > 0 && (
        <div className="game-card">
          <div className="flex items-center gap-1.5 mb-2">
            <Users size={12} className="text-gold" />
            <span className="text-xs font-bold text-gold">Dealer Netwerk</span>
            <span className="text-[0.5rem] text-muted-foreground ml-auto">Gem. marktaandeel: {totalMarketShare}%</span>
          </div>
          <div className="space-y-1.5">
            {de.dealers.map(dealer => {
              const income = calculateDealerIncome(dealer, state);
              return (
                <div key={dealer.district} className="flex items-center justify-between text-[0.6rem]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">{DISTRICTS[dealer.district]?.name}</span>
                    <span className="text-muted-foreground">({dealer.crewName})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatBar value={dealer.marketShare} max={100} color="gold" height="sm" />
                    <span className="text-emerald font-bold w-16 text-right">€{income.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risk Event History */}
      <div className="game-card">
        <div className="flex items-center gap-1.5 mb-2">
          <ShieldAlert size={12} className="text-blood" />
          <span className="text-xs font-bold text-blood">Risico Overzicht</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[0.6rem] mb-3">
          <div className="bg-blood/5 rounded p-1.5 border border-blood/10">
            <p className="text-muted-foreground">Lab Raids</p>
            <p className="font-bold text-blood text-sm">{de.totalLabRaids || 0}</p>
          </div>
          <div className="bg-blood/5 rounded p-1.5 border border-blood/10">
            <p className="text-muted-foreground">DEA Onderzoeken</p>
            <p className="font-bold text-blood text-sm">{de.totalDeaInvestigations || 0}</p>
          </div>
          <div className="bg-gold/5 rounded p-1.5 border border-gold/10">
            <p className="text-muted-foreground">Sabotages</p>
            <p className="font-bold text-gold text-sm">{de.totalRivalSabotages || 0}</p>
          </div>
          <div className="bg-emerald/5 rounded p-1.5 border border-emerald/10">
            <p className="text-muted-foreground">Grote Oogsten</p>
            <p className="font-bold text-emerald text-sm">{de.totalBigHarvests || 0}</p>
          </div>
        </div>

        {/* Recent event log */}
        {de.riskEventLog && de.riskEventLog.length > 0 && (
          <div className="space-y-1">
            <p className="text-[0.55rem] text-muted-foreground font-bold uppercase">Recente Events</p>
            {de.riskEventLog.slice(-8).reverse().map((evt, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[0.55rem]">
                <span>{RISK_EVENT_ICONS[evt.type] || '❓'}</span>
                <span className={`font-bold ${RISK_EVENT_COLORS[evt.type] || ''}`}>{evt.title}</span>
                <span className="text-muted-foreground ml-auto">Dag {evt.day}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DEA status */}
      {de.deaInvestigation > 0 && (
        <div className="relative rounded-lg overflow-hidden">
          <img src={DRUG_EMPIRE_IMAGES.dea_investigation} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="relative p-3 flex items-center gap-2 bg-blood/10 border border-blood rounded-lg">
            <AlertTriangle size={16} className="text-blood flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-blood">DEA ONDERZOEK ACTIEF</p>
              <p className="text-[0.55rem] text-muted-foreground">Nog {de.deaInvestigation} {de.deaInvestigation === 1 ? 'dag' : 'dagen'} resterend.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
