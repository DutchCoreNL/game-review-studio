// ========== EXTENDED LAUNDERING METHODS ==========

import { DistrictId } from './types';

export type LaunderMethodId = 'standard' | 'casino' | 'crypto' | 'shell_company';

export interface LaunderMethod {
  id: LaunderMethodId;
  name: string;
  desc: string;
  icon: string;
  cleanRate: number; // 0-1, how much you keep
  heatPerUnit: number; // heat per €1000 laundered
  dailyCapacity: number; // max per day
  riskLevel: 'low' | 'medium' | 'high' | 'none';
  unlockCondition: string; // display text
}

export const LAUNDER_METHODS: LaunderMethod[] = [
  {
    id: 'standard',
    name: 'Standaard Witwas',
    desc: 'Via je dekmantels en cash bedrijven.',
    icon: '💧',
    cleanRate: 0.85,
    heatPerUnit: 2,
    dailyCapacity: 25000,
    riskLevel: 'medium',
    unlockCondition: 'Altijd beschikbaar',
  },
  {
    id: 'casino',
    name: 'Casino Witwas',
    desc: 'Via casinowinsten. Laag risico maar beperkt volume.',
    icon: '🎰',
    cleanRate: 0.92,
    heatPerUnit: 0.5,
    dailyCapacity: 8000,
    riskLevel: 'low',
    unlockCondition: 'Bezit Neon Strip district',
  },
  {
    id: 'crypto',
    name: 'Crypto Mixing',
    desc: 'Via crypto wallets en mixers. Snel maar riskant.',
    icon: '₿',
    cleanRate: 0.78,
    heatPerUnit: 4,
    dailyCapacity: 50000,
    riskLevel: 'high',
    unlockCondition: 'Level 10+',
  },
  {
    id: 'shell_company',
    name: 'Vastgoed Shell Companies',
    desc: 'Via vastgoed en holdings. Geen risico maar extreem traag.',
    icon: '🏢',
    cleanRate: 0.95,
    heatPerUnit: 0,
    dailyCapacity: 5000,
    riskLevel: 'none',
    unlockCondition: '3+ properties bezit',
  },
];

export function isMethodUnlocked(
  methodId: LaunderMethodId,
  ownedDistricts: string[],
  playerLevel: number,
  propertyId: string,
): boolean {
  switch (methodId) {
    case 'standard': return true;
    case 'casino': return ownedDistricts.includes('neon');
    case 'crypto': return playerLevel >= 10;
    case 'shell_company': {
      const propertyRank = ['kraakpand', 'appartement', 'penthouse', 'villa'].indexOf(propertyId);
      return propertyRank >= 2; // penthouse or villa
    }
    default: return false;
  }
}

export function getMethodCapacity(method: LaunderMethod, ownedBusinesses: string[], neonBonus: boolean): number {
  let cap = method.dailyCapacity;
  if (method.id === 'standard') {
    cap += ownedBusinesses.length * 2000;
    if (neonBonus) cap = Math.floor(cap * 1.15);
  }
  return cap;
}
