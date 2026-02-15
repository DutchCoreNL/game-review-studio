import { useGame } from '@/contexts/GameContext';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Users, Truck, Gem, FlaskConical, AlertTriangle, Crown } from 'lucide-react';
import { GameButton } from '../ui/GameButton';
import { SectionHeader } from '../ui/SectionHeader';
import { DISTRICTS, GOODS } from '@/game/constants';
import { DistrictId, GoodId } from '@/game/types';
import {
  DRUG_TIER_LABELS, DRUG_TIER_PRICE_MULT, DRUG_TIER_HEAT_MULT,
  LAB_UPGRADE_COSTS, LAB_UPGRADE_REQ_VILLA_LEVEL, NOXCRYSTAL_VALUE,
  canUpgradeLab, canProduceNoxCrystal, canAssignDealer, getAvailableCrew,
  calculateDealerIncome, MAX_DEALERS, shouldShowDrugEmpire,
  type ProductionLabId, type DrugTier,
} from '@/game/drugEmpire';

type EmpireTab = 'labs' | 'dealers' | 'noxcrystal';

export function DrugEmpirePanel() {
  const { state, dispatch, showToast } = useGame();
  const [tab, setTab] = useState<EmpireTab>('labs');

  if (!shouldShowDrugEmpire(state)) return null;

  const de = state.drugEmpire;
  const villa = state.villa!;

  const tabs: { id: EmpireTab; label: string; icon: string }[] = [
    { id: 'labs', label: 'Lab Upgrades', icon: '🧪' },
    { id: 'dealers', label: 'Dealers', icon: '🤝' },
    { id: 'noxcrystal', label: 'NoxCrystal', icon: '💎' },
  ];

  return (
    <div className="space-y-3">
      <SectionHeader title="💀 Drug Imperium" badge="Endgame" />

      {/* DEA Warning */}
      {de && de.deaInvestigation > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blood/10 border border-blood rounded-lg p-3 flex items-center gap-2"
        >
          <AlertTriangle size={16} className="text-blood flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-blood">🔍 DEA ONDERZOEK ACTIEF</p>
            <p className="text-[0.6rem] text-muted-foreground">Alle productie gestopt. Nog {de.deaInvestigation} {de.deaInvestigation === 1 ? 'dag' : 'dagen'}.</p>
          </div>
        </motion.div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 rounded text-[0.65rem] font-bold uppercase tracking-wider transition-all ${
              tab === t.id ? 'bg-blood/20 text-blood border border-blood/30' : 'bg-muted/30 text-muted-foreground border border-transparent'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'labs' && <LabUpgradesTab />}
      {tab === 'dealers' && <DealersTab />}
      {tab === 'noxcrystal' && <NoxCrystalTab />}
    </div>
  );
}

function LabUpgradesTab() {
  const { state, dispatch, showToast } = useGame();
  const de = state.drugEmpire;
  const villa = state.villa!;
  const labs: { id: ProductionLabId; name: string; icon: string; color: string }[] = [
    { id: 'wietplantage', name: 'Wietplantage', icon: '🌿', color: 'emerald' },
    { id: 'coke_lab', name: 'Coke Lab', icon: '💎', color: 'game-purple' },
    { id: 'synthetica_lab', name: 'Synthetica Lab', icon: '🧪', color: 'blood' },
  ];

  return (
    <div className="space-y-2">
      {labs.map(lab => {
        if (!villa.modules.includes(lab.id)) return null;
        const currentTier = de?.labTiers[lab.id] || 1;
        const currentQuality = de?.selectedQuality[lab.id] || 1;
        const isOffline = (de?.labOffline[lab.id] || 0) > 0;

        return (
          <div key={lab.id} className={`bg-${lab.color}/5 border border-${lab.color}/20 rounded-lg p-3 space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{lab.icon}</span>
                <span className={`text-xs font-bold text-${lab.color}`}>{lab.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[0.55rem] text-muted-foreground">Tier</span>
                {[1, 2, 3].map(t => (
                  <span key={t} className={`text-[0.6rem] w-5 h-5 rounded flex items-center justify-center font-bold ${
                    t <= currentTier ? `bg-${lab.color}/30 text-${lab.color}` : 'bg-muted/30 text-muted-foreground'
                  }`}>{t}</span>
                ))}
              </div>
            </div>

            {isOffline && (
              <p className="text-[0.55rem] text-blood font-bold">🚨 OFFLINE — {de!.labOffline[lab.id]} dagen resterend</p>
            )}

            {/* Quality selector */}
            <div className="space-y-1">
              <p className="text-[0.55rem] text-muted-foreground font-bold uppercase">Kwaliteit</p>
              <div className="flex gap-1">
                {([1, 2, 3] as DrugTier[]).map(tier => {
                  const locked = tier > currentTier;
                  const active = currentQuality === tier;
                  return (
                    <button key={tier} disabled={locked}
                      onClick={() => dispatch({ type: 'SET_DRUG_TIER', labId: lab.id, tier })}
                      className={`flex-1 py-1 rounded text-[0.55rem] font-bold border transition-all ${
                        locked ? 'opacity-30 cursor-not-allowed border-border text-muted-foreground' :
                        active ? `border-${lab.color} text-${lab.color} bg-${lab.color}/10` :
                        'border-border text-muted-foreground hover:border-foreground/30'
                      }`}>
                      {DRUG_TIER_LABELS[tier]}
                      <br />
                      <span className="text-[0.5rem] opacity-70">{DRUG_TIER_PRICE_MULT[tier]}x💰 {DRUG_TIER_HEAT_MULT[tier]}x🔥</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upgrade buttons */}
            {currentTier < 3 && (
              <div>
                {([2, 3] as const).filter(t => t === currentTier + 1).map(targetTier => {
                  const cost = LAB_UPGRADE_COSTS[lab.id][targetTier];
                  const villaReq = LAB_UPGRADE_REQ_VILLA_LEVEL[targetTier];
                  const canDo = canUpgradeLab(state, lab.id, targetTier);
                  return (
                    <GameButton key={targetTier} variant="gold" size="sm" fullWidth disabled={!canDo}
                      onClick={() => {
                        dispatch({ type: 'UPGRADE_LAB', labId: lab.id, targetTier });
                        showToast(`${lab.name} upgraded naar Tier ${targetTier}!`);
                      }}>
                      <ArrowUp size={10} /> TIER {targetTier} — €{cost.toLocaleString()}
                      {villa.level < villaReq && <span className="text-[0.5rem] opacity-60 ml-1">(Villa Lvl {villaReq})</span>}
                    </GameButton>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DealersTab() {
  const { state, dispatch, showToast } = useGame();
  const de = state.drugEmpire;
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictId | null>(null);
  const [selectedCrew, setSelectedCrew] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<GoodId>('drugs');

  const availableCrew = getAvailableCrew(state);
  const ownedDistricts = state.ownedDistricts.filter(d => !de?.dealers.some(dl => dl.district === d));

  return (
    <div className="space-y-3">
      {/* Active dealers */}
      {de && de.dealers.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[0.6rem] text-muted-foreground font-bold uppercase">Actieve Dealers ({de.dealers.length}/{MAX_DEALERS})</p>
          {de.dealers.map(dealer => {
            const income = calculateDealerIncome(dealer, state);
            return (
              <div key={dealer.district} className="bg-muted/30 border border-border rounded-lg p-2 flex items-center justify-between">
                <div>
                  <p className="text-[0.65rem] font-bold">{DISTRICTS[dealer.district]?.name}</p>
                  <p className="text-[0.55rem] text-muted-foreground">
                    {dealer.crewName} • {GOODS.find(g => g.id === dealer.product)?.name} • {dealer.marketShare}% markt
                  </p>
                  <p className="text-[0.55rem] text-emerald">€{income.toLocaleString()}/nacht</p>
                </div>
                <GameButton variant="ghost" size="sm" onClick={() => {
                  dispatch({ type: 'RECALL_DEALER', district: dealer.district });
                  showToast(`${dealer.crewName} teruggeroepen uit ${DISTRICTS[dealer.district]?.name}`);
                }}>
                  ✕
                </GameButton>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign new dealer */}
      {(de?.dealers.length || 0) < MAX_DEALERS && availableCrew.length > 0 && ownedDistricts.length > 0 && (
        <div className="bg-gold/5 border border-gold/20 rounded-lg p-3 space-y-2">
          <p className="text-xs font-bold text-gold">🤝 Dealer Toewijzen</p>

          <div className="space-y-1">
            <p className="text-[0.55rem] text-muted-foreground">District</p>
            <div className="flex flex-wrap gap-1">
              {ownedDistricts.map(d => (
                <button key={d} onClick={() => setSelectedDistrict(d)}
                  className={`px-2 py-1 rounded text-[0.55rem] border ${
                    selectedDistrict === d ? 'border-gold text-gold bg-gold/10' : 'border-border text-muted-foreground'
                  }`}>
                  {DISTRICTS[d]?.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[0.55rem] text-muted-foreground">Crewlid</p>
            <div className="flex flex-wrap gap-1">
              {availableCrew.map(name => (
                <button key={name} onClick={() => setSelectedCrew(name)}
                  className={`px-2 py-1 rounded text-[0.55rem] border ${
                    selectedCrew === name ? 'border-gold text-gold bg-gold/10' : 'border-border text-muted-foreground'
                  }`}>
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[0.55rem] text-muted-foreground">Product</p>
            <div className="flex flex-wrap gap-1">
              {['drugs', 'luxury', 'tech'].map(g => (
                <button key={g} onClick={() => setSelectedProduct(g as GoodId)}
                  className={`px-2 py-1 rounded text-[0.55rem] border ${
                    selectedProduct === g ? 'border-gold text-gold bg-gold/10' : 'border-border text-muted-foreground'
                  }`}>
                  {GOODS.find(gd => gd.id === g)?.name}
                </button>
              ))}
            </div>
          </div>

          <GameButton variant="gold" size="sm" fullWidth
            disabled={!selectedDistrict || !selectedCrew || !canAssignDealer(state, selectedDistrict!)}
            onClick={() => {
              if (!selectedDistrict || !selectedCrew) return;
              dispatch({ type: 'ASSIGN_DEALER', district: selectedDistrict, crewName: selectedCrew, product: selectedProduct });
              showToast(`${selectedCrew} is nu dealer in ${DISTRICTS[selectedDistrict]?.name}!`);
              setSelectedDistrict(null);
              setSelectedCrew('');
            }}>
            <Truck size={10} /> DEALER TOEWIJZEN
          </GameButton>
        </div>
      )}

      {availableCrew.length === 0 && (de?.dealers.length || 0) < MAX_DEALERS && (
        <p className="text-[0.6rem] text-muted-foreground text-center py-2">Geen crewleden beschikbaar. Rekruteer meer crew.</p>
      )}
    </div>
  );
}

function NoxCrystalTab() {
  const { state, dispatch, showToast } = useGame();
  const de = state.drugEmpire;
  const canProduce = canProduceNoxCrystal(state);
  const stock = de?.noxCrystalStock || 0;
  const produced = de?.noxCrystalProduced || 0;

  const allTier3 = de && de.labTiers.wietplantage >= 3 && de.labTiers.coke_lab >= 3 && de.labTiers.synthetica_lab >= 3;

  return (
    <div className="space-y-3">
      <div className="bg-game-purple/10 border border-game-purple/30 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Crown size={16} className="text-game-purple" />
          <div>
            <p className="text-xs font-bold text-game-purple">NoxCrystal</p>
            <p className="text-[0.55rem] text-muted-foreground">Het ultieme product. Alle labs Tier 3 vereist.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[0.6rem]">
          <div className="bg-muted/30 rounded p-2">
            <p className="text-muted-foreground">Voorraad</p>
            <p className="font-bold text-game-purple text-sm">{stock}</p>
          </div>
          <div className="bg-muted/30 rounded p-2">
            <p className="text-muted-foreground">Totaal Geproduceerd</p>
            <p className="font-bold text-foreground text-sm">{produced}</p>
          </div>
        </div>

        <div className="text-[0.55rem] text-muted-foreground space-y-0.5">
          <p>💰 Verkoopwaarde: €{NOXCRYSTAL_VALUE.min.toLocaleString()} - €{NOXCRYSTAL_VALUE.max.toLocaleString()} per stuk</p>
          <p>🔥 Heat per verkoop: +15</p>
          <p>🧪 Productiekosten: 10 chemicaliën/nacht</p>
        </div>

        {!allTier3 && (
          <p className="text-[0.55rem] text-blood">❌ Alle 3 labs moeten Tier 3 zijn om NoxCrystal te produceren.</p>
        )}
        {allTier3 && !canProduce && (
          <p className="text-[0.55rem] text-gold">⚠️ Productie gestopt (onvoldoende chemicaliën of labs offline/DEA).</p>
        )}
        {canProduce && (
          <p className="text-[0.55rem] text-emerald">✓ Productie actief — 1-2 per nacht</p>
        )}

        {stock > 0 && (
          <div className="flex gap-1">
            {[1, Math.min(5, stock), stock].filter((v, i, a) => a.indexOf(v) === i && v > 0).map(amt => (
              <GameButton key={amt} variant="gold" size="sm" fullWidth onClick={() => {
                dispatch({ type: 'SELL_NOXCRYSTAL', amount: amt });
                showToast(`${amt} NoxCrystal verkocht!`);
              }}>
                VERKOOP {amt}x 💎
              </GameButton>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
