import { GameState, GoodId, VillaModuleId, VillaState, NightReportData } from './types';
import { GOODS } from './constants';
import { LAB_OUTPUT_MULT, LAB_CHEM_REDUCTION, DRUG_TIER_HEAT_MULT, type DrugTier, type ProductionLabId } from './drugEmpire';

// ========== VILLA CONSTANTS ==========

export const VILLA_COST = 150000;
export const VILLA_REQ_LEVEL = 8;
export const VILLA_REQ_REP = 300;

export const VILLA_UPGRADE_COSTS: Record<number, number> = {
  2: 100000,
  3: 250000,
};

export interface VillaModuleDef {
  id: VillaModuleId;
  name: string;
  cost: number;
  icon: string;
  desc: string;
  reqLevel: number; // villa level required
}

export const VILLA_MODULES: VillaModuleDef[] = [
  { id: 'kluis', name: 'Kluis', cost: 25000, icon: '🔐', desc: 'Sla geld veilig op. Max: €50k/100k/200k per villa-level.', reqLevel: 1 },
  { id: 'opslagkelder', name: 'Opslagkelder', cost: 20000, icon: '📦', desc: 'Sla goederen veilig op. Max: 20/40/60 items per level.', reqLevel: 1 },
  { id: 'synthetica_lab', name: 'Synthetica Lab', cost: 15000, icon: '🧪', desc: 'Produceert Synthetica uit chemicaliën vanuit de villa.', reqLevel: 1 },
  { id: 'wietplantage', name: 'Wietplantage', cost: 30000, icon: '🌿', desc: 'Passieve productie: 5-10 drugs/nacht zonder input.', reqLevel: 1 },
  { id: 'coke_lab', name: 'Coke Laboratorium', cost: 50000, icon: '💎', desc: 'Premium productie: 3-5 Puur Wit/nacht, vereist chemicaliën.', reqLevel: 2 },
  { id: 'crew_kwartieren', name: 'Crew Kwartieren', cost: 20000, icon: '🏠', desc: '+2 max crew slots, versneld herstel (2x).', reqLevel: 1 },
  { id: 'wapenkamer', name: 'Wapenkamer', cost: 15000, icon: '🔫', desc: 'Sla ammo veilig op, +50 max ammo.', reqLevel: 1 },
  { id: 'commandocentrum', name: 'Commandocentrum', cost: 40000, icon: '🎯', desc: '+10% missie-succes, spionage-bonus.', reqLevel: 2 },
  { id: 'helipad', name: 'Helipad', cost: 80000, icon: '🚁', desc: 'Snel reizen naar elk district (0 heat/kosten), 1x/dag.', reqLevel: 2 },
  { id: 'zwembad', name: 'Zwembad & Lounge', cost: 35000, icon: '🏊', desc: 'Crew-moraal bonus, +5 charm bij villa-deals.', reqLevel: 1 },
  { id: 'camera', name: 'Bewakingscamera\'s', cost: 45000, icon: '📹', desc: '+25 verdediging, waarschuwing bij aanvallen, nemesis-aanvalkans -30%.', reqLevel: 2 },
  { id: 'tunnel', name: 'Ondergrondse Tunnel', cost: 60000, icon: '🕳️', desc: 'Ontsnappingsroute: +25% gevangenis-ontsnapping, bij villa-aanval verlies gehalveerd.', reqLevel: 3 },
  { id: 'garage_uitbreiding', name: 'Garage Uitbreiding', cost: 15000, icon: '🏗️', desc: '+10 max bagage ruimte voor al je voertuigen.', reqLevel: 1 },
  { id: 'server_room', name: 'Server Room', cost: 25000, icon: '🖥️', desc: '-5 extra heat decay per nacht (voertuig & persoonlijk).', reqLevel: 2 },
];

// ========== PRESTIGE UPGRADES ==========

export interface VillaPrestigeDef {
  id: VillaModuleId;
  cost: number;
  bonus: string; // human-readable bonus description
}

export const VILLA_PRESTIGE_UPGRADES: VillaPrestigeDef[] = [
  { id: 'kluis', cost: 50000, bonus: 'Kluis capaciteit +50%' },
  { id: 'opslagkelder', cost: 40000, bonus: 'Opslag capaciteit +50%' },
  { id: 'wietplantage', cost: 60000, bonus: 'Productie 8-15/nacht (+50%)' },
  { id: 'coke_lab', cost: 100000, bonus: 'Productie 5-8/nacht (+60%)' },
  { id: 'synthetica_lab', cost: 30000, bonus: 'Geen heat van productie' },
  { id: 'crew_kwartieren', cost: 40000, bonus: '+1 extra crew slot (totaal +3)' },
  { id: 'wapenkamer', cost: 30000, bonus: '+100 extra ammo opslag, +20 verdediging' },
  { id: 'commandocentrum', cost: 80000, bonus: '+25% missie-succes (totaal)' },
  { id: 'camera', cost: 90000, bonus: '+15 verdediging, -50% aanvalkans' },
  { id: 'server_room', cost: 50000, bonus: '-10 extra heat decay (totaal -15/nacht)' },
  { id: 'zwembad', cost: 70000, bonus: '+10 charm (totaal +15)' },
  { id: 'helipad', cost: 120000, bonus: '2x per dag reizen i.p.v. 1x' },
  { id: 'tunnel', cost: 100000, bonus: '100% ontsnapping, 75% verliesreductie' },
  { id: 'garage_uitbreiding', cost: 30000, bonus: '+20 extra bagage (totaal +30)' },
];

// ========== VILLA STORAGE LIMITS ==========

export function getVaultMax(villaLevel: number, hasPrestige: boolean = false): number {
  const base = [0, 50000, 100000, 200000][villaLevel] || 0;
  return hasPrestige ? Math.floor(base * 1.5) : base;
}

export function getStorageMax(villaLevel: number, hasPrestige: boolean = false): number {
  const base = [0, 20, 40, 60][villaLevel] || 0;
  return hasPrestige ? Math.floor(base * 1.5) : base;
}

// ========== VILLA PRODUCTION ==========

export interface VillaProductionResult {
  wietProduced: number;
  cokeProduced: number;
  labProduced: number;
  heatGenerated: number;
}

export function processVillaProduction(state: GameState): VillaProductionResult {
  const result: VillaProductionResult = { wietProduced: 0, cokeProduced: 0, labProduced: 0, heatGenerated: 0 };
  if (!state.villa) return result;

  const villa = state.villa;
  const de = state.drugEmpire;
  const currentInv = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
  let space = state.maxInv - currentInv;
  const prestige = villa.prestigeModules || [];

  // Helper: get tier multipliers from Drug Empire state
  const getLabTier = (labId: ProductionLabId): DrugTier => de?.labTiers[labId] || 1;
  const getQuality = (labId: ProductionLabId): DrugTier => de?.selectedQuality[labId] || 1;
  const isLabOffline = (labId: ProductionLabId): boolean => (de?.labOffline[labId] || 0) > 0;
  const isDEAActive = (): boolean => (de?.deaInvestigation || 0) > 0;
  // Check for big harvest event (doubles output)
  const isBigHarvest = false; // Handled separately in drugEmpire night processing

  // Wietplantage: passive 5-10 drugs/night (prestige: 8-15)
  if (villa.modules.includes('wietplantage') && space > 0 && !isLabOffline('wietplantage') && !isDEAActive()) {
    const isPrestige = prestige.includes('wietplantage');
    const tier = getLabTier('wietplantage');
    const quality = getQuality('wietplantage');
    const outputMult = LAB_OUTPUT_MULT[tier];
    const baseYield = isPrestige ? (8 + Math.floor(Math.random() * 8)) : (5 + Math.floor(Math.random() * 6));
    const wietYield = Math.floor(baseYield * outputMult);
    const produced = Math.min(wietYield, space);
    const existing = state.inventory.drugs || 0;
    const existingCost = state.inventoryCosts.drugs || 0;
    const baseCost = GOODS.find(g => g.id === 'drugs')!.base * 0.3;
    state.inventory.drugs = existing + produced;
    state.inventoryCosts.drugs = existing + produced > 0
      ? Math.floor(((existing * existingCost) + (produced * baseCost)) / (existing + produced))
      : baseCost;
    result.wietProduced = produced;
    space -= produced;
    result.heatGenerated += Math.ceil(2 * DRUG_TIER_HEAT_MULT[quality]);
  }

  // Coke Lab: 3-5 per night (prestige: 5-8), requires chemicals
  if (villa.modules.includes('coke_lab') && space > 0 && state.lab.chemicals > 0 && !isLabOffline('coke_lab') && !isDEAActive()) {
    const isPrestige = prestige.includes('coke_lab');
    const tier = getLabTier('coke_lab');
    const quality = getQuality('coke_lab');
    const outputMult = LAB_OUTPUT_MULT[tier];
    const chemReduction = LAB_CHEM_REDUCTION[tier];
    const baseYield = isPrestige ? (5 + Math.floor(Math.random() * 4)) : (3 + Math.floor(Math.random() * 3));
    const cokeYield = Math.floor(baseYield * outputMult);
    const chemsNeeded = Math.ceil(cokeYield * 2 * chemReduction);
    const chemsAvailable = Math.min(state.lab.chemicals, chemsNeeded);
    const produced = Math.min(Math.floor(chemsAvailable / Math.max(1, Math.ceil(2 * chemReduction))), space);
    if (produced > 0) {
      state.lab.chemicals -= Math.ceil(produced * 2 * chemReduction);
      const existing = state.inventory.luxury || 0;
      const existingCost = state.inventoryCosts.luxury || 0;
      const baseCost = GOODS.find(g => g.id === 'luxury')!.base * 0.6;
      state.inventory.luxury = existing + produced;
      state.inventoryCosts.luxury = existing + produced > 0
        ? Math.floor(((existing * existingCost) + (produced * baseCost)) / (existing + produced))
        : baseCost;
      result.cokeProduced = produced;
      space -= produced;
      result.heatGenerated += Math.ceil(5 * DRUG_TIER_HEAT_MULT[quality]);
    }
  }

  // Synthetica Lab: prestige = no heat
  if (villa.modules.includes('synthetica_lab') && space > 0 && state.lab.chemicals > 0 && !isLabOffline('synthetica_lab') && !isDEAActive()) {
    const isPrestige = prestige.includes('synthetica_lab');
    const tier = getLabTier('synthetica_lab');
    const quality = getQuality('synthetica_lab');
    const outputMult = LAB_OUTPUT_MULT[tier];
    const chemReduction = LAB_CHEM_REDUCTION[tier];
    const maxBatch = Math.floor(15 * outputMult);
    const chemsNeeded = Math.ceil(maxBatch * chemReduction);
    const batch = Math.min(Math.floor(state.lab.chemicals / Math.max(1, chemReduction)), maxBatch, space);
    if (batch > 0) {
      state.lab.chemicals -= Math.ceil(batch * chemReduction);
      const existing = state.inventory.drugs || 0;
      const existingCost = state.inventoryCosts.drugs || 0;
      const baseCost = GOODS.find(g => g.id === 'drugs')!.base * 0.5;
      state.inventory.drugs = existing + batch;
      state.inventoryCosts.drugs = existing + batch > 0
        ? Math.floor(((existing * existingCost) + (batch * baseCost)) / (existing + batch))
        : baseCost;
      result.labProduced = batch;
      result.heatGenerated += isPrestige ? 0 : Math.ceil(3 * DRUG_TIER_HEAT_MULT[quality]);
    }
  }

  return result;
}

// ========== VILLA PROTECTION (Anti-Prison) ==========

export function getVillaProtectedMoney(state: GameState): number {
  if (!state.villa || !state.villa.modules.includes('kluis')) return 0;
  const hasPrestige = state.villa.prestigeModules?.includes('kluis') || false;
  return Math.min(state.villa.vaultMoney, getVaultMax(state.villa.level, hasPrestige));
}

export function getVillaProtectedGoods(state: GameState): Partial<Record<GoodId, number>> {
  if (!state.villa || !state.villa.modules.includes('opslagkelder')) return {};
  return { ...state.villa.storedGoods };
}

export function getVillaProtectedAmmo(state: GameState): number {
  if (!state.villa || !state.villa.modules.includes('wapenkamer')) return 0;
  return state.villa.storedAmmo;
}

// ========== HELIPAD ==========

export function canUseHelipad(state: GameState): boolean {
  if (!state.villa) return false;
  if (!state.villa.modules.includes('helipad')) return false;
  return !state.villa.helipadUsedToday;
}

// ========== VILLA HIDING BONUS ==========

export function getVillaHeatReduction(state: GameState): number {
  if (!state.villa) return 0;
  return 10; // -10 per night when hiding in villa (best in game)
}

// ========== CREW BONUS ==========

export function getVillaMaxCrewBonus(state: GameState): number {
  if (!state.villa || !state.villa.modules.includes('crew_kwartieren')) return 0;
  return state.villa.prestigeModules?.includes('crew_kwartieren') ? 3 : 2;
}

export function getVillaCrewHealMultiplier(state: GameState): number {
  if (!state.villa || !state.villa.modules.includes('crew_kwartieren')) return 1;
  return 2;
}

// ========== CHARM BONUS ==========

export function getVillaCharmBonus(state: GameState): number {
  if (!state.villa || !state.villa.modules.includes('zwembad')) return 0;
  return state.villa.prestigeModules?.includes('zwembad') ? 15 : 5;
}

// ========== MISSION SUCCESS BONUS ==========

export function getVillaMissionBonus(state: GameState): number {
  if (!state.villa || !state.villa.modules.includes('commandocentrum')) return 0;
  return state.villa.prestigeModules?.includes('commandocentrum') ? 0.25 : 0.10;
}
