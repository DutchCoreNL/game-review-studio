// ========== WAPENHANDEL NETWERK — Arms Dealing System ==========

import { DistrictId, GoodId } from './types';

export type ArmsContactStatus = 'active' | 'compromised' | 'busted';

export interface ArmsContact {
  id: string;
  district: DistrictId;
  name: string;
  demandType: 'pistol' | 'smg' | 'rifle' | 'shotgun' | 'explosive';
  weeklyDemand: number; // units per week
  priceMultiplier: number; // 1.0 - 2.5
  trustLevel: number; // 0-100
  status: ArmsContactStatus;
  lastDeliveryDay: number;
  totalDelivered: number;
  totalEarned: number;
}

export interface ArmsNetwork {
  contacts: ArmsContact[];
  totalRevenue: number;
  interceptedShipments: number;
  networkLevel: number; // 1-5
  weeklyCapacity: number; // max deliveries per week
  lastRaidDay: number;
}

export function createInitialArmsNetwork(): ArmsNetwork {
  return {
    contacts: [],
    totalRevenue: 0,
    interceptedShipments: 0,
    networkLevel: 1,
    weeklyCapacity: 3,
    lastRaidDay: 0,
  };
}

const CONTACT_NAMES: Record<DistrictId, string[]> = {
  port: ['Kapitein Vos', 'Dock-Jan', 'El Marinero'],
  crown: ['De Bankier', 'Victoria Cross', 'Silk'],
  iron: ['Hamerfist', 'Diesel', 'Pjotr de Smid'],
  low: ['Ratface', 'Mama Rosa', 'Switchblade'],
  neon: ['Neon Nick', 'DJ Cobra', 'Glass Eye'],
};

const DEMAND_TYPES: ArmsContact['demandType'][] = ['pistol', 'smg', 'rifle', 'shotgun', 'explosive'];

const DEMAND_LABELS: Record<ArmsContact['demandType'], string> = {
  pistol: 'Pistolen',
  smg: 'SMGs',
  rifle: 'Rifles',
  shotgun: 'Shotguns',
  explosive: 'Explosieven',
};

const BASE_PRICES: Record<ArmsContact['demandType'], number> = {
  pistol: 2000,
  smg: 4500,
  rifle: 7000,
  shotgun: 5500,
  explosive: 10000,
};

export { DEMAND_LABELS, BASE_PRICES };

export function generateContact(district: DistrictId, existingContacts: ArmsContact[]): ArmsContact {
  const names = CONTACT_NAMES[district].filter(
    n => !existingContacts.some(c => c.name === n)
  );
  const name = names.length > 0 ? names[Math.floor(Math.random() * names.length)] : `Agent-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const demandType = DEMAND_TYPES[Math.floor(Math.random() * DEMAND_TYPES.length)];

  return {
    id: `arms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    district,
    name,
    demandType,
    weeklyDemand: 2 + Math.floor(Math.random() * 4), // 2-5
    priceMultiplier: 1.0 + Math.random() * 1.5, // 1.0-2.5
    trustLevel: 20 + Math.floor(Math.random() * 30), // 20-50
    status: 'active',
    lastDeliveryDay: 0,
    totalDelivered: 0,
    totalEarned: 0,
  };
}

export function getContactRecruitCost(networkLevel: number): number {
  return 5000 + networkLevel * 3000;
}

export function getDeliveryPrice(contact: ArmsContact): number {
  return Math.floor(BASE_PRICES[contact.demandType] * contact.priceMultiplier * (1 + contact.trustLevel / 200));
}

export function getInterceptChance(heat: number, personalHeat: number, networkLevel: number): number {
  const baseChance = 0.05;
  const heatBonus = (heat + personalHeat) / 500;
  const networkReduction = networkLevel * 0.02;
  return Math.min(0.5, Math.max(0.01, baseChance + heatBonus - networkReduction));
}

export function getNetworkUpgradeCost(currentLevel: number): number {
  return [0, 15000, 35000, 75000, 150000][currentLevel] || 999999;
}

export function getWeeklyCapacity(networkLevel: number): number {
  return 3 + networkLevel * 2;
}

export function processDelivery(
  contact: ArmsContact,
  quantity: number,
  heat: number,
  personalHeat: number,
  networkLevel: number,
  day: number,
): { success: boolean; revenue: number; heatGain: number; trustGain: number; intercepted: boolean } {
  const unitPrice = getDeliveryPrice(contact);
  const interceptChance = getInterceptChance(heat, personalHeat, networkLevel);
  const intercepted = Math.random() < interceptChance;

  if (intercepted) {
    return {
      success: false,
      revenue: 0,
      heatGain: 15,
      trustGain: -10,
      intercepted: true,
    };
  }

  const revenue = unitPrice * quantity;
  const trustGain = Math.min(10, 2 + Math.floor(quantity / 2));
  const heatGain = 3 + Math.floor(quantity * 1.5);

  return {
    success: true,
    revenue,
    heatGain,
    trustGain,
    intercepted: false,
  };
}
