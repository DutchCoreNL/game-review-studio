import { useGame } from '@/contexts/GameContext';
import { DISTRICTS, SAFEHOUSE_COSTS, SAFEHOUSE_UPGRADE_COSTS, SAFEHOUSE_UPGRADES, SAFEHOUSE_PERKS } from '@/game/constants';
import { DistrictId, SafehouseUpgradeId } from '@/game/types';
import { GameButton } from './ui/GameButton';
import { SectionHeader } from './ui/SectionHeader';
import { StatBar } from './ui/StatBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Shield, ArrowLeft, Zap, Plus, Lock, ChevronUp } from 'lucide-react';
import { useState } from 'react';

function SafehouseCard({ district, onSelect }: { district: DistrictId; onSelect: () => void }) {
  const { state } = useGame();
  const sh = state.safehouses.find(h => h.district === district);
  const districtData = DISTRICTS[district];

  if (!sh) {
    // District owned but no safehouse — show buy option
    if (!state.ownedDistricts.includes(district)) return null;
    const cost = SAFEHOUSE_COSTS[district];
    return (
      <motion.button
        onClick={onSelect}
        className="w-full text-left game-card bg-muted/20 p-3 border border-dashed border-border hover:border-gold/30 transition-all"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded bg-muted/30 border border-border flex items-center justify-center">
            <Plus size={16} className="text-muted-foreground" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold">{districtData.name}</span>
            <div className="text-[0.5rem] text-muted-foreground">Koop safehouse — €{cost.toLocaleString()}</div>
          </div>
          <Lock size={14} className="text-muted-foreground" />
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={onSelect}
      className="w-full text-left game-card bg-emerald/5 p-3 border border-emerald/20 hover:brightness-110 transition-all"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded bg-emerald/10 border border-emerald/20 flex items-center justify-center text-lg">
          🏠
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold truncate">{districtData.name}</span>
            <span className="text-[0.45rem] font-bold px-1.5 py-0.5 rounded bg-emerald/10 text-emerald border border-emerald/20">
              Level {sh.level}
            </span>
          </div>
          <div className="text-[0.5rem] text-muted-foreground mt-0.5">
            {SAFEHOUSE_PERKS[sh.level]}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[0.5rem] font-bold text-emerald">{sh.upgrades.length} upgrades</span>
        </div>
      </div>
    </motion.button>
  );
}

function SafehouseDetail({ district, onBack }: { district: DistrictId; onBack: () => void }) {
  const { state, dispatch, showToast } = useGame();
  const sh = state.safehouses.find(h => h.district === district);
  const districtData = DISTRICTS[district];
  const isOwned = state.ownedDistricts.includes(district);

  // Buy mode
  if (!sh) {
    const cost = SAFEHOUSE_COSTS[district];
    const canBuy = isOwned && state.money >= cost;

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <button onClick={onBack} className="flex items-center gap-1 text-[0.6rem] text-muted-foreground mb-3 hover:text-foreground transition-colors">
          <ArrowLeft size={12} /> Terug naar overzicht
        </button>
        <div className="game-card bg-muted/30 p-4 mb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">🏚️</div>
            <div>
              <h3 className="font-bold text-sm">Safehouse — {districtData.name}</h3>
              <p className="text-[0.55rem] text-muted-foreground">Veilige schuilplaats in het district.</p>
            </div>
          </div>
          <p className="text-[0.55rem] text-muted-foreground mb-3">
            Een safehouse geeft je een vaste uitvalsbasis. Vermindert persoonlijke heat, biedt extra opslag en crew-herstel.
          </p>
          <div className="bg-background/50 rounded p-2 mb-3 text-[0.5rem]">
            <div className="font-bold text-emerald mb-1">Level 1 Voordelen:</div>
            <div className="text-muted-foreground">{SAFEHOUSE_PERKS[1]}</div>
          </div>
          {!isOwned ? (
            <div className="text-[0.5rem] text-blood text-center py-2 bg-blood/5 rounded border border-blood/20">
              ⚠️ Je moet dit district eerst bezitten
            </div>
          ) : (
            <GameButton variant="emerald" size="lg" fullWidth glow={canBuy} icon={<Home size={14} />}
              disabled={!canBuy} onClick={() => {
                dispatch({ type: 'BUY_SAFEHOUSE', district });
                showToast(`🏠 Safehouse gekocht in ${districtData.name}!`);
              }}>
              KOPEN — €{cost.toLocaleString()}
            </GameButton>
          )}
          {isOwned && state.money < cost && (
            <p className="text-[0.45rem] text-blood text-center mt-1">Te weinig geld</p>
          )}
        </div>
      </motion.div>
    );
  }

  // Detail mode
  const canUpgradeLevel = sh.level < 3;
  const upgradeCost = canUpgradeLevel ? SAFEHOUSE_UPGRADE_COSTS[sh.level + 1] : 0;
  const canAffordUpgrade = canUpgradeLevel && state.money >= upgradeCost;
  const isCurrentDistrict = state.loc === district;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <button onClick={onBack} className="flex items-center gap-1 text-[0.6rem] text-muted-foreground mb-3 hover:text-foreground transition-colors">
        <ArrowLeft size={12} /> Terug naar overzicht
      </button>

      {/* Header */}
      <div className="game-card bg-emerald/5 border border-emerald/20 p-4 mb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-3xl">🏠</div>
          <div>
            <h3 className="font-bold text-sm">{districtData.name} Safehouse</h3>
            <div className="flex items-center gap-2 text-[0.55rem]">
              <span className="font-bold text-emerald">Level {sh.level}</span>
              {isCurrentDistrict && (
                <span className="text-[0.45rem] font-bold px-1.5 py-0.5 rounded bg-gold/10 text-gold border border-gold/30">
                  📍 Huidige locatie
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[0.55rem]">
          <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1.5">
            <span className="text-muted-foreground">Heat Reductie</span>
            <span className="font-bold text-emerald">
              {isCurrentDistrict ? (sh.level <= 1 ? '-3' : sh.level === 2 ? '-5' : '-8') : (sh.level >= 2 ? '-1' : '0')}/nacht
            </span>
          </div>
          <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1.5">
            <span className="text-muted-foreground">Opslag Bonus</span>
            <span className="font-bold text-gold">+{sh.level >= 3 ? 10 : sh.level >= 2 ? 5 : 0} slots</span>
          </div>
          <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1.5">
            <span className="text-muted-foreground">Gekocht</span>
            <span className="font-bold">Dag {sh.purchaseDay}</span>
          </div>
          <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1.5">
            <span className="text-muted-foreground">Upgrades</span>
            <span className="font-bold text-ice">{sh.upgrades.length}/{SAFEHOUSE_UPGRADES.length}</span>
          </div>
        </div>
      </div>

      {/* Level upgrade */}
      {canUpgradeLevel && (
        <div className="game-card bg-muted/30 p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <ChevronUp size={14} className="text-gold" />
            <span className="text-xs font-bold">Upgrade naar Level {sh.level + 1}</span>
          </div>
          <p className="text-[0.5rem] text-muted-foreground mb-1">
            {SAFEHOUSE_PERKS[sh.level + 1]}
          </p>
          <GameButton variant="gold" size="md" fullWidth icon={<ChevronUp size={12} />}
            disabled={!canAffordUpgrade} glow={canAffordUpgrade}
            onClick={() => {
              dispatch({ type: 'UPGRADE_SAFEHOUSE', district });
              showToast(`🏠 Safehouse geüpgraded naar level ${sh.level + 1}!`);
            }}>
            UPGRADE — €{upgradeCost.toLocaleString()}
          </GameButton>
          {!canAffordUpgrade && <p className="text-[0.45rem] text-blood text-center mt-1">Te weinig geld</p>}
        </div>
      )}

      {/* Module upgrades */}
      <div className="game-card bg-muted/30 p-3 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={14} className="text-ice" />
          <span className="text-xs font-bold">Modules</span>
          <span className="text-[0.45rem] text-muted-foreground">Speciale faciliteiten</span>
        </div>
        <div className="space-y-1.5">
          {SAFEHOUSE_UPGRADES.map(upg => {
            const hasUpgrade = sh.upgrades.includes(upg.id);
            const canAfford = state.money >= upg.cost;
            return (
              <div key={upg.id} className={`flex items-center gap-2 rounded px-2.5 py-2 border ${
                hasUpgrade ? 'bg-ice/10 border-ice/20' : 'bg-background/50 border-border'
              }`}>
                <span className="text-sm flex-shrink-0">{upg.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[0.6rem] font-bold">{upg.name}</span>
                    {hasUpgrade && <span className="text-[0.45rem] text-ice font-bold">✓</span>}
                  </div>
                  <div className="text-[0.45rem] text-muted-foreground">{upg.desc}</div>
                </div>
                {!hasUpgrade && (
                  <GameButton variant="muted" size="sm" disabled={!canAfford}
                    onClick={() => {
                      dispatch({ type: 'INSTALL_SAFEHOUSE_UPGRADE', district, upgradeId: upg.id });
                      showToast(`${upg.icon} ${upg.name} geïnstalleerd!`);
                    }}>
                    €{upg.cost.toLocaleString()}
                  </GameButton>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export function SafehouseView() {
  const { state } = useGame();
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictId | null>(null);
  const districts: DistrictId[] = ['low', 'port', 'iron', 'neon', 'crown'];

  return (
    <div>
      <SectionHeader title="Safehouses" icon={<Home size={16} />} badge={`${state.safehouses.length}/5`} />

      {/* Stats */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 game-card bg-muted/30 p-2 text-center">
          <div className="text-[0.5rem] text-muted-foreground">Actief</div>
          <div className="text-sm font-bold text-emerald">{state.safehouses.length}</div>
        </div>
        <div className="flex-1 game-card bg-muted/30 p-2 text-center">
          <div className="text-[0.5rem] text-muted-foreground">Heat Reductie</div>
          <div className="text-sm font-bold text-ice">
            -{state.safehouses.reduce((sum, sh) => sum + (sh.district === state.loc ? (sh.level <= 1 ? 3 : sh.level === 2 ? 5 : 8) : (sh.level >= 2 ? 1 : 0)), 0)}/n
          </div>
        </div>
        <div className="flex-1 game-card bg-muted/30 p-2 text-center">
          <div className="text-[0.5rem] text-muted-foreground">Extra Opslag</div>
          <div className="text-sm font-bold text-gold">
            +{state.safehouses.reduce((sum, sh) => sum + (sh.level >= 3 ? 10 : sh.level >= 2 ? 5 : 0), 0)}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedDistrict ? (
          <SafehouseDetail key="detail" district={selectedDistrict} onBack={() => setSelectedDistrict(null)} />
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="space-y-2">
              {districts.map(d => (
                <SafehouseCard key={d} district={d} onSelect={() => setSelectedDistrict(d)} />
              ))}
            </div>
            {state.ownedDistricts.length === 0 && (
              <div className="text-center py-6 text-[0.55rem] text-muted-foreground">
                <Home size={24} className="mx-auto mb-2 opacity-30" />
                <p className="font-bold mb-1">Geen districten in bezit</p>
                <p>Koop een district om een safehouse te bouwen.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
