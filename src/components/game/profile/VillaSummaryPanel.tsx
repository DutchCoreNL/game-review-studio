import { useGame } from '@/contexts/GameContext';
import { VILLA_MODULES, getVaultMax, getStorageMax } from '@/game/villa';
import { SectionHeader } from '../ui/SectionHeader';
import { StatBar } from '../ui/StatBar';
import { InfoRow } from '../ui/InfoRow';
import { Shield, Factory, Package, Coins, Zap } from 'lucide-react';

export function VillaSummaryPanel() {
  const { state } = useGame();
  const villa = state.villa;

  if (!villa) {
    return (
      <div className="game-card p-4 text-center">
        <p className="text-xs text-muted-foreground italic">Je hebt nog geen villa. Koop er een via het Imperium tab.</p>
      </div>
    );
  }

  const vaultMax = getVaultMax(villa.level);
  const storageMax = getStorageMax(villa.level);
  const storedCount = Object.values(villa.storedGoods).reduce((a, b) => a + (b || 0), 0);

  // Defense score (mirrors VillaView OverviewTab logic)
  const baseDefense = villa.level * 10;
  const moduleDefense = (villa.modules.includes('camera') ? 25 : 0)
    + (villa.modules.includes('wapenkamer') ? 10 : 0)
    + (villa.modules.includes('commandocentrum') ? 15 : 0);
  const totalDefense = baseDefense + moduleDefense;
  const maxDefense = 30 + 25 + 10 + 15;
  const defensePct = Math.min(100, Math.round((totalDefense / maxDefense) * 100));
  const defenseRating = totalDefense >= 60 ? 'FORT KNOX' : totalDefense >= 40 ? 'GOED BEWAAKT' : totalDefense >= 20 ? 'REDELIJK' : 'KWETSBAAR';
  const defenseColor = totalDefense >= 60 ? 'text-emerald' : totalDefense >= 40 ? 'text-gold' : totalDefense >= 20 ? 'text-orange-400' : 'text-blood';
  const defenseBarColor = totalDefense >= 60 ? 'emerald' : totalDefense >= 40 ? 'gold' : 'blood';

  // Production summary
  const hasWiet = villa.modules.includes('wietplantage');
  const hasCoke = villa.modules.includes('coke_lab');
  const hasLab = villa.modules.includes('synthetica_lab');
  const hasProduction = hasWiet || hasCoke || hasLab;

  // Installed module names
  const installedModules = VILLA_MODULES.filter(m => villa.modules.includes(m.id));

  return (
    <div className="space-y-4">
      {/* Villa Overview */}
      <SectionHeader title="Villa Noxhaven" icon={<Shield size={12} />} />
      <div className="game-card">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <InfoRow icon={<Zap size={10} />} label="Level" value={`${villa.level}/3`} valueClass="text-gold" />
          <InfoRow icon={<Package size={10} />} label="Modules" value={`${villa.modules.length}/${VILLA_MODULES.length}`} />
          {villa.modules.includes('kluis') && (
            <InfoRow icon={<Coins size={10} />} label="Kluis" value={`€${villa.vaultMoney.toLocaleString()}`} valueClass="text-gold" />
          )}
          {villa.modules.includes('opslagkelder') && (
            <InfoRow icon={<Package size={10} />} label="Opslag" value={`${storedCount}/${storageMax}`} />
          )}
        </div>
      </div>

      {/* Defense Score */}
      <SectionHeader title="Verdediging" icon={<Shield size={12} />} />
      <div className="game-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold">Verdedigingsscore</span>
          <span className={`text-xs font-bold ${defenseColor}`}>{defenseRating}</span>
        </div>
        <StatBar value={totalDefense} max={maxDefense} color={defenseBarColor} height="sm" animate={false} />
        <div className="flex justify-between text-[0.5rem] text-muted-foreground mt-1">
          <span>{totalDefense} / {maxDefense} punten</span>
          <span>{defensePct}%</span>
        </div>

        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-[0.5rem]">
            <span className="text-muted-foreground">🏛️ Villa Level {villa.level}</span>
            <span className="font-bold text-foreground">+{baseDefense}</span>
          </div>
          {villa.modules.includes('camera') && (
            <div className="flex justify-between text-[0.5rem]">
              <span className="text-muted-foreground">📹 Camera's</span>
              <span className="font-bold text-emerald">+25</span>
            </div>
          )}
          {villa.modules.includes('wapenkamer') && (
            <div className="flex justify-between text-[0.5rem]">
              <span className="text-muted-foreground">🔫 Wapenkamer</span>
              <span className="font-bold text-emerald">+10</span>
            </div>
          )}
          {villa.modules.includes('commandocentrum') && (
            <div className="flex justify-between text-[0.5rem]">
              <span className="text-muted-foreground">🎯 Commandocentrum</span>
              <span className="font-bold text-emerald">+15</span>
            </div>
          )}
          {villa.modules.includes('tunnel') && (
            <div className="flex justify-between text-[0.5rem]">
              <span className="text-muted-foreground">🕳️ Tunnel (verlies gehalveerd)</span>
              <span className="font-bold text-gold">✓</span>
            </div>
          )}
        </div>
      </div>

      {/* Production */}
      <SectionHeader title="Productie" icon={<Factory size={12} />} />
      <div className="game-card">
        {!hasProduction ? (
          <p className="text-xs text-muted-foreground italic">Geen productie-modules actief.</p>
        ) : (
          <div className="space-y-1.5">
            {hasWiet && (
              <div className="flex justify-between text-[0.6rem]">
                <span className="text-muted-foreground">🌿 Wietplantage</span>
                <span className="text-emerald font-bold">5-10 drugs/nacht</span>
              </div>
            )}
            {hasCoke && (
              <div className="flex justify-between text-[0.6rem]">
                <span className="text-muted-foreground">💎 Coke Lab</span>
                <span className="text-game-purple font-bold">3-5 luxe/nacht</span>
              </div>
            )}
            {hasLab && (
              <div className="flex justify-between text-[0.6rem]">
                <span className="text-muted-foreground">🧪 Synthetica Lab</span>
                <span className="text-blood font-bold">max 15/nacht</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Installed Modules */}
      <SectionHeader title="Geïnstalleerde Modules" />
      <div className="game-card">
        <div className="flex flex-wrap gap-1.5">
          {installedModules.map(mod => (
            <span key={mod.id} className="text-[0.5rem] font-semibold px-1.5 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">
              {mod.icon} {mod.name}
            </span>
          ))}
          {installedModules.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Nog geen modules geïnstalleerd.</p>
          )}
        </div>
      </div>
    </div>
  );
}
