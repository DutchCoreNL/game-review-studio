// ========== BLACK MARKET PRICE FLUCTUATIONS ==========

export type MarketModifierSource = 'gang_war' | 'dea_raid' | 'supply_shortage' | 'festival' | 'police_crackdown' | 'smuggle_boom';

export interface MarketPriceModifier {
  id: string;
  source: MarketModifierSource;
  name: string;
  desc: string;
  icon: string;
  effects: {
    weaponPriceMod?: number;    // multiplier (e.g. 1.3 = +30%)
    drugPriceMod?: number;
    techPriceMod?: number;
    luxuryPriceMod?: number;
    allGoodsMod?: number;
  };
  daysRemaining: number;
  startDay: number;
}

export interface InsiderTipData {
  id: string;
  tipText: string;
  affectedCategory: string;
  direction: 'up' | 'down';
  magnitude: number; // percentage
  expiresDay: number;
  fromContact: string;
}

const MODIFIER_TEMPLATES: Omit<MarketPriceModifier, 'id' | 'daysRemaining' | 'startDay'>[] = [
  {
    source: 'gang_war',
    name: 'Gang Oorlog',
    desc: 'Wapenprijzen stijgen door hoge vraag van strijdende gangs.',
    icon: '⚔️',
    effects: { weaponPriceMod: 1.3 },
  },
  {
    source: 'dea_raid',
    name: 'DEA Onderzoek',
    desc: 'Drugsprijzen kelderen — niemand durft te kopen.',
    icon: '🚨',
    effects: { drugPriceMod: 0.8 },
  },
  {
    source: 'supply_shortage',
    name: 'Leveringsproblemen',
    desc: 'Tekort aan tech-goederen drijft prijzen op.',
    icon: '📦',
    effects: { techPriceMod: 1.25 },
  },
  {
    source: 'festival',
    name: 'Neon Festival',
    desc: 'Luxegoederenhandel bloeit tijdens het festival.',
    icon: '🎆',
    effects: { luxuryPriceMod: 1.4 },
  },
  {
    source: 'police_crackdown',
    name: 'Politie Inval',
    desc: 'Alle illegale handel wordt riskanter en duurder.',
    icon: '🔴',
    effects: { allGoodsMod: 1.15 },
  },
  {
    source: 'smuggle_boom',
    name: 'Smokkelboom',
    desc: 'Overvloed aan goederen drukt de prijzen.',
    icon: '📉',
    effects: { allGoodsMod: 0.85 },
  },
];

export function rollMarketModifier(day: number): MarketPriceModifier | null {
  if (Math.random() > 0.25) return null; // 25% chance per day
  const template = MODIFIER_TEMPLATES[Math.floor(Math.random() * MODIFIER_TEMPLATES.length)];
  return {
    ...template,
    id: `mod_${day}_${Math.random().toString(36).slice(2, 6)}`,
    daysRemaining: 2 + Math.floor(Math.random() * 4), // 2-5 days
    startDay: day,
  };
}

export function getBlackMarketPriceMultiplier(modifiers: MarketPriceModifier[], itemType: 'weapon' | 'armor' | 'gadget'): number {
  let mult = 1.0;
  for (const mod of modifiers) {
    if (mod.effects.allGoodsMod) mult *= mod.effects.allGoodsMod;
    if (itemType === 'weapon' && mod.effects.weaponPriceMod) mult *= mod.effects.weaponPriceMod;
  }
  return mult;
}

export function getGoodsPriceMultiplier(modifiers: MarketPriceModifier[], goodCategory: string): number {
  let mult = 1.0;
  for (const mod of modifiers) {
    if (mod.effects.allGoodsMod) mult *= mod.effects.allGoodsMod;
    if (goodCategory === 'drugs' && mod.effects.drugPriceMod) mult *= mod.effects.drugPriceMod;
    if (goodCategory === 'tech' && mod.effects.techPriceMod) mult *= mod.effects.techPriceMod;
    if (goodCategory === 'luxury' && mod.effects.luxuryPriceMod) mult *= mod.effects.luxuryPriceMod;
  }
  return mult;
}

export function processModifierTick(modifiers: MarketPriceModifier[]): MarketPriceModifier[] {
  return modifiers
    .map(m => ({ ...m, daysRemaining: m.daysRemaining - 1 }))
    .filter(m => m.daysRemaining > 0);
}

export function generateInsiderTip(modifiers: MarketPriceModifier[], day: number): InsiderTipData | null {
  if (modifiers.length === 0) return null;
  if (Math.random() > 0.3) return null; // 30% chance
  const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
  const effectKeys = Object.entries(mod.effects).filter(([, v]) => v !== undefined);
  if (effectKeys.length === 0) return null;
  const [key, value] = effectKeys[0];
  const direction = (value as number) > 1 ? 'up' : 'down';
  const magnitude = Math.abs(((value as number) - 1) * 100);
  const categories: Record<string, string> = {
    weaponPriceMod: 'Wapens',
    drugPriceMod: 'Drugs',
    techPriceMod: 'Tech',
    luxuryPriceMod: 'Luxe',
    allGoodsMod: 'Alle goederen',
  };
  return {
    id: `tip_${day}_${Math.random().toString(36).slice(2, 6)}`,
    tipText: `${categories[key] || 'Markt'} gaan ${direction === 'up' ? 'stijgen' : 'dalen'} met ~${Math.round(magnitude)}%`,
    affectedCategory: categories[key] || 'Markt',
    direction,
    magnitude,
    expiresDay: day + mod.daysRemaining,
    fromContact: 'Corrupte Bron',
  };
}
