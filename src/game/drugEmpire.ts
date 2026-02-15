import { GameState, DistrictId, GoodId, NightReportData } from './types';
import { DISTRICTS, GOODS } from './constants';

// ========== TYPES ==========

export type DrugTier = 1 | 2 | 3;
export type ProductionLabId = 'wietplantage' | 'coke_lab' | 'synthetica_lab';

export interface DealerAssignment {
  district: DistrictId;
  crewName: string;
  marketShare: number; // 0-100
  daysActive: number;
  product: GoodId;
}

export interface DrugEmpireState {
  labTiers: Record<ProductionLabId, DrugTier>;
  selectedQuality: Record<ProductionLabId, DrugTier>;
  dealers: DealerAssignment[];
  noxCrystalStock: number;
  noxCrystalProduced: number;
  labOffline: Record<ProductionLabId, number>; // days remaining offline
  deaInvestigation: number; // days remaining, 0 = inactive
  // Cumulative stats
  totalDealerIncome: number;
  totalNoxCrystalSold: number;
  totalNoxCrystalRevenue: number;
  totalLabRaids: number;
  totalDeaInvestigations: number;
  totalContaminatedBatches: number;
  totalRivalSabotages: number;
  totalBigHarvests: number;
  riskEventLog: { type: string; title: string; day: number }[];
}

// ========== CONSTANTS ==========

export const DRUG_TIER_LABELS: Record<DrugTier, string> = {
  1: 'Straat',
  2: 'Premium',
  3: 'Puur',
};

export const DRUG_TIER_PRICE_MULT: Record<DrugTier, number> = {
  1: 1.0,
  2: 1.8,
  3: 3.0,
};

export const DRUG_TIER_HEAT_MULT: Record<DrugTier, number> = {
  1: 1.0,
  2: 1.5,
  3: 2.5,
};

export const LAB_UPGRADE_COSTS: Record<ProductionLabId, Record<2 | 3, number>> = {
  wietplantage: { 2: 75000, 3: 200000 },
  coke_lab: { 2: 120000, 3: 300000 },
  synthetica_lab: { 2: 90000, 3: 250000 },
};

export const LAB_UPGRADE_REQ_VILLA_LEVEL: Record<2 | 3, number> = {
  2: 2,
  3: 3,
};

export const NOXCRYSTAL_VALUE = { min: 8000, max: 12000 };
export const NOXCRYSTAL_HEAT = 15;
export const NOXCRYSTAL_CHEM_COST = 10;
export const MAX_DEALERS = 5;
export const MARKET_SHARE_GROWTH_PER_DAY = 5; // +5% per day active

export const LAB_OUTPUT_MULT: Record<DrugTier, number> = {
  1: 1.0,
  2: 1.5,
  3: 2.0,
};

export const LAB_CHEM_REDUCTION: Record<DrugTier, number> = {
  1: 1.0,
  2: 0.8,
  3: 0.7,
};

// ========== INIT ==========

export function createDrugEmpireState(): DrugEmpireState {
  return {
    labTiers: { wietplantage: 1, coke_lab: 1, synthetica_lab: 1 },
    selectedQuality: { wietplantage: 1, coke_lab: 1, synthetica_lab: 1 },
    dealers: [],
    noxCrystalStock: 0,
    noxCrystalProduced: 0,
    labOffline: { wietplantage: 0, coke_lab: 0, synthetica_lab: 0 },
    deaInvestigation: 0,
    totalDealerIncome: 0,
    totalNoxCrystalSold: 0,
    totalNoxCrystalRevenue: 0,
    totalLabRaids: 0,
    totalDeaInvestigations: 0,
    totalContaminatedBatches: 0,
    totalRivalSabotages: 0,
    totalBigHarvests: 0,
    riskEventLog: [],
  };
}

// ========== UNLOCK CHECKS ==========

export function shouldShowDrugEmpire(state: GameState): boolean {
  if (!state.villa) return false;
  const productionModules: ProductionLabId[] = ['wietplantage', 'coke_lab', 'synthetica_lab'];
  return productionModules.some(m => state.villa!.modules.includes(m));
}

export function canUpgradeLab(state: GameState, labId: ProductionLabId, targetTier: 2 | 3): boolean {
  if (!state.villa || !state.drugEmpire) return false;
  if (!state.villa.modules.includes(labId)) return false;
  const currentTier = state.drugEmpire.labTiers[labId];
  if (currentTier >= targetTier) return false;
  if (targetTier === 3 && currentTier < 2) return false; // must upgrade sequentially
  const villaLevelReq = LAB_UPGRADE_REQ_VILLA_LEVEL[targetTier];
  if (state.villa.level < villaLevelReq) return false;
  const cost = LAB_UPGRADE_COSTS[labId][targetTier];
  if (state.money < cost) return false;
  // Tier 3 requires all districts owned
  if (targetTier === 3 && state.ownedDistricts.length < 5) return false;
  return true;
}

export function canProduceNoxCrystal(state: GameState): boolean {
  if (!state.drugEmpire) return false;
  const de = state.drugEmpire;
  return (
    de.labTiers.wietplantage >= 3 &&
    de.labTiers.coke_lab >= 3 &&
    de.labTiers.synthetica_lab >= 3 &&
    state.lab.chemicals >= NOXCRYSTAL_CHEM_COST &&
    de.deaInvestigation <= 0 &&
    de.labOffline.wietplantage <= 0 &&
    de.labOffline.coke_lab <= 0 &&
    de.labOffline.synthetica_lab <= 0
  );
}

export function canAssignDealer(state: GameState, district: DistrictId): boolean {
  if (!state.drugEmpire) return false;
  if (!state.ownedDistricts.includes(district)) return false;
  if (state.drugEmpire.dealers.length >= MAX_DEALERS) return false;
  if (state.drugEmpire.dealers.some(d => d.district === district)) return false;
  // Need at least 1 crew member not assigned as dealer
  const dealerNames = state.drugEmpire.dealers.map(d => d.crewName);
  const available = state.crew.filter(c => c.hp > 0 && !dealerNames.includes(c.name));
  return available.length > 0;
}

export function getAvailableCrew(state: GameState): string[] {
  if (!state.drugEmpire) return [];
  const dealerNames = state.drugEmpire.dealers.map(d => d.crewName);
  return state.crew.filter(c => c.hp > 0 && !dealerNames.includes(c.name)).map(c => c.name);
}

// ========== DEALER INCOME ==========

export function calculateDealerIncome(dealer: DealerAssignment, state: GameState): number {
  const de = state.drugEmpire;
  if (!de) return 0;
  const district = DISTRICTS[dealer.district];
  if (!district) return 0;
  const good = GOODS.find(g => g.id === dealer.product);
  if (!good) return 0;
  const districtDemand = district.mods[dealer.product] || 1;
  // Find the lab that produces this product and get its quality
  const labForProduct = getLabForProduct(dealer.product);
  const quality = labForProduct ? de.selectedQuality[labForProduct] : 1;
  const priceMult = DRUG_TIER_PRICE_MULT[quality as DrugTier] || 1;
  // Dealer level = crew member level
  const crewMember = state.crew.find(c => c.name === dealer.crewName);
  const dealerLevel = crewMember?.level || 1;
  return Math.floor(
    good.base * priceMult * districtDemand * (dealer.marketShare / 100) * (1 + dealerLevel * 0.1)
  );
}

function getLabForProduct(product: GoodId): ProductionLabId | null {
  if (product === 'drugs') return 'wietplantage';
  if (product === 'luxury') return 'coke_lab';
  if (product === 'tech') return 'synthetica_lab';
  return null;
}

// ========== NIGHTLY PRODUCTION ==========

export interface DrugEmpireNightResult {
  dealerIncome: number;
  dealerDetails: { district: string; income: number; crewName: string }[];
  noxCrystalProduced: number;
  riskEvent: DrugRiskEvent | null;
  labsOfflineDecremented: boolean;
  deaDecremented: boolean;
}

export interface DrugRiskEvent {
  type: 'lab_raid' | 'contaminated_batch' | 'rival_sabotage' | 'dea_investigation' | 'big_harvest';
  title: string;
  desc: string;
  labId?: ProductionLabId;
  districtId?: DistrictId;
}

export function processDrugEmpireNight(state: GameState): DrugEmpireNightResult {
  const result: DrugEmpireNightResult = {
    dealerIncome: 0,
    dealerDetails: [],
    noxCrystalProduced: 0,
    riskEvent: null,
    labsOfflineDecremented: false,
    deaDecremented: false,
  };

  const de = state.drugEmpire;
  if (!de) return result;

  // 1. Decrement lab offline timers
  const labIds: ProductionLabId[] = ['wietplantage', 'coke_lab', 'synthetica_lab'];
  for (const lab of labIds) {
    if (de.labOffline[lab] > 0) {
      de.labOffline[lab]--;
      result.labsOfflineDecremented = true;
    }
  }

  // 2. Decrement DEA investigation
  if (de.deaInvestigation > 0) {
    de.deaInvestigation--;
    result.deaDecremented = true;
    // DEA active: no production at all
    return result;
  }

  // 3. NoxCrystal production
  if (canProduceNoxCrystal(state)) {
    const noxYield = 1 + (Math.random() < 0.3 ? 1 : 0); // 1-2
    state.lab.chemicals -= NOXCRYSTAL_CHEM_COST;
    de.noxCrystalStock += noxYield;
    de.noxCrystalProduced += noxYield;
    result.noxCrystalProduced = noxYield;
  }

  // 4. Dealer income
  for (const dealer of de.dealers) {
    dealer.daysActive++;
    dealer.marketShare = Math.min(100, dealer.marketShare + MARKET_SHARE_GROWTH_PER_DAY);
    const income = calculateDealerIncome(dealer, state);
    state.money += income;
    state.stats.totalEarned += income;
    de.totalDealerIncome = (de.totalDealerIncome || 0) + income;
    result.dealerIncome += income;
    result.dealerDetails.push({
      district: DISTRICTS[dealer.district]?.name || dealer.district,
      income,
      crewName: dealer.crewName,
    });
  }

  // 5. Risk events (only one per night)
  result.riskEvent = rollDrugRiskEvent(state);
  if (result.riskEvent) {
    applyRiskEvent(state, result.riskEvent);
    // Track cumulative stats
    switch (result.riskEvent.type) {
      case 'lab_raid': de.totalLabRaids = (de.totalLabRaids || 0) + 1; break;
      case 'dea_investigation': de.totalDeaInvestigations = (de.totalDeaInvestigations || 0) + 1; break;
      case 'contaminated_batch': de.totalContaminatedBatches = (de.totalContaminatedBatches || 0) + 1; break;
      case 'rival_sabotage': de.totalRivalSabotages = (de.totalRivalSabotages || 0) + 1; break;
      case 'big_harvest': de.totalBigHarvests = (de.totalBigHarvests || 0) + 1; break;
    }
    // Log event (keep last 20)
    de.riskEventLog = de.riskEventLog || [];
    de.riskEventLog.push({ type: result.riskEvent.type, title: result.riskEvent.title, day: state.stats.daysPlayed });
    if (de.riskEventLog.length > 20) de.riskEventLog = de.riskEventLog.slice(-20);
  }

  return result;
}

function rollDrugRiskEvent(state: GameState): DrugRiskEvent | null {
  const de = state.drugEmpire;
  if (!de) return null;

  // Big Harvest (5% at Tier 3) — positive, check first
  const tier3Labs = (['wietplantage', 'coke_lab', 'synthetica_lab'] as ProductionLabId[])
    .filter(l => de.labTiers[l] >= 3 && de.labOffline[l] <= 0 && state.villa?.modules.includes(l));
  if (tier3Labs.length > 0 && Math.random() < 0.05) {
    return {
      type: 'big_harvest',
      title: '🌿 Grote Oogst!',
      desc: 'Uitzonderlijke opbrengst vannacht — dubbele productie!',
    };
  }

  // DEA Investigation (NoxCrystal + Heat > 40)
  if (de.noxCrystalProduced > 0 && state.heat > 40 && Math.random() < 0.15) {
    return {
      type: 'dea_investigation',
      title: '🔍 DEA Onderzoek',
      desc: 'De DEA start een onderzoek. Alle productie stopt voor 3 dagen en arrestatiekans +15%.',
    };
  }

  // Lab Raid (Heat > 60)
  if (state.heat > 60 && Math.random() < 0.2) {
    const activeLabs = (['wietplantage', 'coke_lab', 'synthetica_lab'] as ProductionLabId[])
      .filter(l => de.labOffline[l] <= 0 && state.villa?.modules.includes(l));
    if (activeLabs.length > 0) {
      const target = activeLabs[Math.floor(Math.random() * activeLabs.length)];
      return {
        type: 'lab_raid',
        title: '🚨 Lab Inval!',
        desc: `Politie heeft je ${target === 'wietplantage' ? 'Wietplantage' : target === 'coke_lab' ? 'Coke Lab' : 'Synthetica Lab'} binnengevallen! 2 dagen offline.`,
        labId: target,
      };
    }
  }

  // Rival Sabotage (market share > 60% in any district)
  const highShareDealer = de.dealers.find(d => d.marketShare > 60);
  if (highShareDealer && Math.random() < 0.15) {
    return {
      type: 'rival_sabotage',
      title: '⚔️ Rivaal Sabotage',
      desc: `Je dealer ${highShareDealer.crewName} in ${DISTRICTS[highShareDealer.district]?.name} is aangevallen! Marktaandeel -20%.`,
      districtId: highShareDealer.district,
    };
  }

  // Contaminated Batch (10%)
  if (Math.random() < 0.10) {
    return {
      type: 'contaminated_batch',
      title: '☠️ Besmette Batch',
      desc: 'Een slechte batch is op straat beland. Karma -5, Reputatie -10.',
    };
  }

  return null;
}

function applyRiskEvent(state: GameState, event: DrugRiskEvent): void {
  const de = state.drugEmpire;
  if (!de) return;

  switch (event.type) {
    case 'lab_raid':
      if (event.labId) {
        de.labOffline[event.labId] = 2;
      }
      break;
    case 'contaminated_batch':
      state.karma = Math.max(-100, (state.karma || 0) - 5);
      state.rep = Math.max(0, state.rep - 10);
      break;
    case 'rival_sabotage':
      if (event.districtId) {
        const dealer = de.dealers.find(d => d.district === event.districtId);
        if (dealer) {
          dealer.marketShare = Math.max(0, dealer.marketShare - 20);
          // Damage crew member
          const crew = state.crew.find(c => c.name === dealer.crewName);
          if (crew) crew.hp = Math.max(1, crew.hp - 20);
        }
      }
      break;
    case 'dea_investigation':
      de.deaInvestigation = 3;
      break;
    case 'big_harvest':
      // Handled in processVillaProduction — doubles output
      break;
  }
}

// ========== NOXCRYSTAL SELL ==========

export function sellNoxCrystal(state: GameState, amount: number): number {
  const de = state.drugEmpire;
  if (!de || de.noxCrystalStock < amount) return 0;
  const totalValue = Array.from({ length: amount }).reduce<number>((sum) => {
    return sum + NOXCRYSTAL_VALUE.min + Math.floor(Math.random() * (NOXCRYSTAL_VALUE.max - NOXCRYSTAL_VALUE.min));
  }, 0);
  de.noxCrystalStock -= amount;
  de.totalNoxCrystalSold = (de.totalNoxCrystalSold || 0) + amount;
  de.totalNoxCrystalRevenue = (de.totalNoxCrystalRevenue || 0) + totalValue;
  state.money += totalValue;
  state.stats.totalEarned += totalValue;
  // NoxCrystal sales generate massive heat
  state.personalHeat = Math.min(100, (state.personalHeat || 0) + amount * NOXCRYSTAL_HEAT);
  state.heat = Math.min(100, state.heat + amount * NOXCRYSTAL_HEAT);
  return totalValue;
}
