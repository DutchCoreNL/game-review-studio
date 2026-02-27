// Travel / Reissysteem — destinations, goods, pricing

export interface TravelDestination {
  id: string;
  name: string;
  country: string;
  flag: string;
  description: string;
  travelMinutes: number; // base real-time travel duration
  reqLevel: number;
  goods: TravelGood[];
  customsRiskBase: number; // base % chance of customs inspection (0-100)
  dangerLevel: 'low' | 'medium' | 'high';
}

export interface TravelGood {
  id: string;
  name: string;
  buyPrice: number; // price at destination
  sellPrice: number; // sell price back in Noxhaven
  maxQuantity: number; // max you can buy per trip
  category: 'drugs' | 'weapons' | 'tech' | 'luxury' | 'meds';
  illegal: boolean; // increases customs risk
}

export const DESTINATIONS: TravelDestination[] = [
  {
    id: 'zurich',
    name: 'Zürich',
    country: 'Zwitserland',
    flag: '🇨🇭',
    description: 'Bankgeheimen, witte boorden en ongetraceerd goud. Perfecte plek om zwart geld in luxe om te zetten.',
    travelMinutes: 30,
    reqLevel: 3,
    customsRiskBase: 15,
    dangerLevel: 'low',
    goods: [
      { id: 'swiss_gold', name: 'Zwitsers Goud', buyPrice: 8000, sellPrice: 12000, maxQuantity: 5, category: 'luxury', illegal: false },
      { id: 'pharma_grade', name: 'Pharma-Grade Steroïden', buyPrice: 3000, sellPrice: 5500, maxQuantity: 10, category: 'meds', illegal: true },
      { id: 'crypto_keys', name: 'Cold Wallet Keys', buyPrice: 15000, sellPrice: 22000, maxQuantity: 3, category: 'tech', illegal: false },
    ],
  },
  {
    id: 'bogota',
    name: 'Bogotá',
    country: 'Colombia',
    flag: '🇨🇴',
    description: 'Het hart van de cocaïne-industrie. Goedkope grondstoffen, maar de terugweg is dodelijk.',
    travelMinutes: 90,
    reqLevel: 8,
    customsRiskBase: 40,
    dangerLevel: 'high',
    goods: [
      { id: 'raw_coca', name: 'Ruwe Coca Pasta', buyPrice: 1500, sellPrice: 6000, maxQuantity: 15, category: 'drugs', illegal: true },
      { id: 'cartel_weapons', name: 'Cartel Wapens', buyPrice: 4000, sellPrice: 9000, maxQuantity: 5, category: 'weapons', illegal: true },
      { id: 'emeralds', name: 'Colombiaanse Smaragden', buyPrice: 5000, sellPrice: 8500, maxQuantity: 8, category: 'luxury', illegal: false },
    ],
  },
  {
    id: 'hongkong',
    name: 'Hong Kong',
    country: 'China',
    flag: '🇭🇰',
    description: 'Neon-verlichte markten vol namaak-tech en echte black-market elektronica.',
    travelMinutes: 120,
    reqLevel: 12,
    customsRiskBase: 25,
    dangerLevel: 'medium',
    goods: [
      { id: 'hk_tech', name: 'Black-Market Chips', buyPrice: 6000, sellPrice: 11000, maxQuantity: 8, category: 'tech', illegal: true },
      { id: 'jade_art', name: 'Antiek Jade', buyPrice: 12000, sellPrice: 18000, maxQuantity: 4, category: 'luxury', illegal: false },
      { id: 'synth_fentanyl', name: 'Synthetisch Fentanyl', buyPrice: 2000, sellPrice: 7500, maxQuantity: 10, category: 'drugs', illegal: true },
    ],
  },
  {
    id: 'moscow',
    name: 'Moskou',
    country: 'Rusland',
    flag: '🇷🇺',
    description: 'Wapens van militaire kwaliteit en wodka die sterker is dan de wet.',
    travelMinutes: 60,
    reqLevel: 6,
    customsRiskBase: 30,
    dangerLevel: 'medium',
    goods: [
      { id: 'mil_grade', name: 'Militaire Wapens', buyPrice: 7000, sellPrice: 14000, maxQuantity: 4, category: 'weapons', illegal: true },
      { id: 'russian_meds', name: 'Nootropics', buyPrice: 2500, sellPrice: 4500, maxQuantity: 12, category: 'meds', illegal: false },
      { id: 'black_caviar', name: 'Zwarte Kaviaar', buyPrice: 4000, sellPrice: 7000, maxQuantity: 6, category: 'luxury', illegal: false },
    ],
  },
  {
    id: 'lagos',
    name: 'Lagos',
    country: 'Nigeria',
    flag: '🇳🇬',
    description: 'Chaos, kansen en de goedkoopste goederen ter wereld — als je het overleeft.',
    travelMinutes: 75,
    reqLevel: 10,
    customsRiskBase: 35,
    dangerLevel: 'high',
    goods: [
      { id: 'conflict_diamonds', name: 'Conflict Diamanten', buyPrice: 3000, sellPrice: 10000, maxQuantity: 6, category: 'luxury', illegal: true },
      { id: 'bootleg_meds', name: 'Bootleg Medicijnen', buyPrice: 800, sellPrice: 2500, maxQuantity: 20, category: 'meds', illegal: true },
      { id: 'scam_tech', name: 'Geclonede Devices', buyPrice: 1500, sellPrice: 4000, maxQuantity: 10, category: 'tech', illegal: true },
    ],
  },
];

export function calculateTravelTime(dest: TravelDestination, hasHelipad: boolean): number {
  const base = dest.travelMinutes;
  return hasHelipad ? Math.ceil(base * 0.5) : base;
}

export function calculateCustomsRisk(dest: TravelDestination, heat: number, illegalCount: number): number {
  const base = dest.customsRiskBase;
  const heatBonus = Math.min(30, Math.floor(heat / 3));
  const illegalBonus = illegalCount * 5;
  return Math.min(95, base + heatBonus + illegalBonus);
}

export function formatTravelTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}u ${m}m` : `${h}u`;
}

export function formatCountdown(targetTime: string): string {
  const diff = new Date(targetTime).getTime() - Date.now();
  if (diff <= 0) return 'Aangekomen!';
  const mins = Math.ceil(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}u ${m}m` : `${h}u`;
}
