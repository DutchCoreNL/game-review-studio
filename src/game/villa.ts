import { GameState, GoodId, VillaModuleId, VillaState, NightReportData } from './types';
import { GOODS } from './constants';

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
  { id: 'wapenkamer', name: 'Wapenkamer', cost: 15000, icon: '🔫', desc: 'Sla ammo veilig op, +5 max ammo.', reqLevel: 1 },
  { id: 'commandocentrum', name: 'Commandocentrum', cost: 40000, icon: '🎯', desc: '+10% missie-succes, spionage-bonus.', reqLevel: 2 },
  { id: 'helipad', name: 'Helipad', cost: 80000, icon: '🚁', desc: 'Snel reizen naar elk district (0 heat/kosten), 1x/dag.', reqLevel: 2 },
  { id: 'zwembad', name: 'Zwembad & Lounge', cost: 35000, icon: '🏊', desc: 'Crew-moraal bonus, +5 charm bij villa-deals.', reqLevel: 1 },
  { id: 'camera', name: 'Bewakingscamera\'s', cost: 45000, icon: '📹', desc: '+25 verdediging, waarschuwing bij aanvallen, nemesis-aanvalkans -30%.', reqLevel: 2 },
  { id: 'tunnel', name: 'Ondergrondse Tunnel', cost: 60000, icon: '🕳️', desc: 'Ontsnappingsroute: +25% gevangenis-ontsnapping, bij villa-aanval verlies gehalveerd.', reqLevel: 3 },
  { id: 'garage_uitbreiding', name: 'Garage Uitbreiding', cost: 15000, icon: '🏗️', desc: '+10 max bagage ruimte voor al je voertuigen.', reqLevel: 1 },
  { id: 'server_room', name: 'Server Room', cost: 25000, icon: '🖥️', desc: '-5 extra heat decay per nacht (voertuig & persoonlijk).', reqLevel: 2 },
];

// ========== VILLA STORAGE LIMITS ==========

export function getVaultMax(villaLevel: number): number {
  return [0, 50000, 100000, 200000][villaLevel] || 0;
}

export function getStorageMax(villaLevel: number): number {
  return [0, 20, 40, 60][villaLevel] || 0;
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
  const currentInv = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
  let space = state.maxInv - currentInv;

  // Wietplantage: passive 5-10 drugs/night
  if (villa.modules.includes('wietplantage') && space > 0) {
    const wietYield = 5 + Math.floor(Math.random() * 6); // 5-10
    const produced = Math.min(wietYield, space);
    const existing = state.inventory.drugs || 0;
    const existingCost = state.inventoryCosts.drugs || 0;
    const baseCost = GOODS.find(g => g.id === 'drugs')!.base * 0.3; // low cost since self-produced
    state.inventory.drugs = existing + produced;
    state.inventoryCosts.drugs = existing + produced > 0
      ? Math.floor(((existing * existingCost) + (produced * baseCost)) / (existing + produced))
      : baseCost;
    result.wietProduced = produced;
    space -= produced;
    result.heatGenerated += 2; // low heat
  }

  // Coke Lab: 3-5 per night, requires chemicals
  if (villa.modules.includes('coke_lab') && space > 0 && state.lab.chemicals > 0) {
    const cokeYield = 3 + Math.floor(Math.random() * 3); // 3-5
    const chemsNeeded = cokeYield * 2; // costs 2 chems per coke
    const chemsAvailable = Math.min(state.lab.chemicals, chemsNeeded);
    const produced = Math.min(Math.floor(chemsAvailable / 2), space);
    if (produced > 0) {
      state.lab.chemicals -= produced * 2;
      // Store coke as luxury (premium product)
      const existing = state.inventory.luxury || 0;
      const existingCost = state.inventoryCosts.luxury || 0;
      const baseCost = GOODS.find(g => g.id === 'luxury')!.base * 0.6;
      state.inventory.luxury = existing + produced;
      state.inventoryCosts.luxury = existing + produced > 0
        ? Math.floor(((existing * existingCost) + (produced * baseCost)) / (existing + produced))
        : baseCost;
      result.cokeProduced = produced;
      space -= produced;
      result.heatGenerated += 5; // higher heat
    }
  }

  // Synthetica Lab (moved to villa): same as HQ lab but from villa
  if (villa.modules.includes('synthetica_lab') && space > 0 && state.lab.chemicals > 0) {
    const batch = Math.min(state.lab.chemicals, 15, space);
    if (batch > 0) {
      state.lab.chemicals -= batch;
      const existing = state.inventory.drugs || 0;
      const existingCost = state.inventoryCosts.drugs || 0;
      const baseCost = GOODS.find(g => g.id === 'drugs')!.base * 0.5;
      state.inventory.drugs = existing + batch;
      state.inventoryCosts.drugs = existing + batch > 0
        ? Math.floor(((existing * existingCost) + (batch * baseCost)) / (existing + batch))
        : baseCost;
      result.labProduced = batch;
      result.heatGenerated += 3;
    }
  }

  return result;
}

// ========== VILLA PROTECTION (Anti-Prison) ==========

export function getVillaProtectedMoney(state: GameState): number {
  if (!state.villa || !state.villa.modules.includes('kluis')) return 0;
  return Math.min(state.villa.vaultMoney, getVaultMax(state.villa.level));
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
  return 2;
}

export function getVillaCrewHealMultiplier(state: GameState): number {
  if (!state.villa || !state.villa.modules.includes('crew_kwartieren')) return 1;
  return 2;
}

// ========== CHARM BONUS ==========

export function getVillaCharmBonus(state: GameState): number {
  if (!state.villa || !state.villa.modules.includes('zwembad')) return 0;
  return 5;
}

// ========== MISSION SUCCESS BONUS ==========

export function getVillaMissionBonus(state: GameState): number {
  if (!state.villa || !state.villa.modules.includes('commandocentrum')) return 0;
  return 0.10; // +10%
}
