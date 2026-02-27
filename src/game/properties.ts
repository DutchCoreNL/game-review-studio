// Property / Housing progression system
// Players progress: Kraakpand → Appartement → Penthouse → Villa

export interface Property {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  reqLevel: number;
  reqRep: number;
  bonuses: {
    maxEnergy?: number;
    maxHp?: number;
    passiveIncome?: number;
    heatReduction?: number;
    storageSlots?: number;
  };
  tier: number; // 0-3
}

export const PROPERTIES: Property[] = [
  {
    id: 'kraakpand',
    name: 'Kraakpand',
    description: 'Een verlaten pand in de sloppen. Beter dan de straat.',
    icon: '🏚️',
    cost: 0,
    reqLevel: 1,
    reqRep: 0,
    bonuses: {},
    tier: 0,
  },
  {
    id: 'appartement',
    name: 'Appartement',
    description: 'Een bescheiden flat met stromend water en een slot op de deur.',
    icon: '🏢',
    cost: 15000,
    reqLevel: 5,
    reqRep: 25,
    bonuses: {
      maxEnergy: 10,
      passiveIncome: 200,
      heatReduction: 5,
    },
    tier: 1,
  },
  {
    id: 'penthouse',
    name: 'Penthouse',
    description: 'Luxueus penthouse met uitzicht over de stad. Status en comfort.',
    icon: '🏙️',
    cost: 75000,
    reqLevel: 12,
    reqRep: 100,
    bonuses: {
      maxEnergy: 25,
      maxHp: 15,
      passiveIncome: 800,
      heatReduction: 10,
      storageSlots: 20,
    },
    tier: 2,
  },
  {
    id: 'villa',
    name: 'Villa',
    description: 'Een fortified villa met alle luxe. Het ultieme machtssymbool.',
    icon: '🏰',
    cost: 250000,
    reqLevel: 20,
    reqRep: 250,
    bonuses: {
      maxEnergy: 50,
      maxHp: 30,
      passiveIncome: 2500,
      heatReduction: 20,
      storageSlots: 50,
    },
    tier: 3,
  },
];

export function getCurrentProperty(ownedPropertyId: string | undefined): Property {
  return PROPERTIES.find(p => p.id === ownedPropertyId) || PROPERTIES[0];
}

export function getNextProperty(currentId: string): Property | null {
  const current = PROPERTIES.find(p => p.id === currentId);
  if (!current) return PROPERTIES[1];
  const next = PROPERTIES.find(p => p.tier === current.tier + 1);
  return next || null;
}

export function canAffordProperty(prop: Property, money: number, level: number, rep: number): boolean {
  return money >= prop.cost && level >= prop.reqLevel && rep >= prop.reqRep;
}
