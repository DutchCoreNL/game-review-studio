import { GoodId, GameState } from './types';

export interface CraftIngredient {
  goodId: GoodId;
  amount: number;
}

export interface CraftRecipe {
  id: string;
  name: string;
  icon: string;
  desc: string;
  ingredients: CraftIngredient[];
  chemCost: number; // chemicals needed
  output: { goodId: GoodId; amount: number };
  heatGain: number;
  reqVillaLevel: number;
  reqModule: 'synthetica_lab' | 'coke_lab' | 'wietplantage';
  craftTimeLabel: string; // flavour only
  sellMultiplier: number; // base price multiplier for output
}

export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'synth_premium',
    name: 'Premium Synthetica',
    icon: '💊',
    desc: 'Zuiver Synthetica met medische voorraad. 2× basiswaarde.',
    ingredients: [{ goodId: 'drugs', amount: 5 }, { goodId: 'meds', amount: 3 }],
    chemCost: 2,
    output: { goodId: 'drugs', amount: 4 },
    heatGain: 3,
    reqVillaLevel: 1,
    reqModule: 'synthetica_lab',
    craftTimeLabel: 'Direct',
    sellMultiplier: 2.0,
  },
  {
    id: 'designer_drug',
    name: 'Designer Drug',
    icon: '🧬',
    desc: 'Combineer Synthetica + Zwarte Data voor high-tech drugs. 2.5× waarde.',
    ingredients: [{ goodId: 'drugs', amount: 4 }, { goodId: 'tech', amount: 2 }],
    chemCost: 3,
    output: { goodId: 'drugs', amount: 3 },
    heatGain: 5,
    reqVillaLevel: 2,
    reqModule: 'synthetica_lab',
    craftTimeLabel: 'Direct',
    sellMultiplier: 2.5,
  },
  {
    id: 'puur_wit',
    name: 'Puur Wit Deluxe',
    icon: '💎',
    desc: 'Ultiem luxeproduct van kunst + chemicaliën. 1.8× waarde.',
    ingredients: [{ goodId: 'luxury', amount: 2 }, { goodId: 'meds', amount: 2 }],
    chemCost: 5,
    output: { goodId: 'luxury', amount: 3 },
    heatGain: 6,
    reqVillaLevel: 2,
    reqModule: 'coke_lab',
    craftTimeLabel: 'Direct',
    sellMultiplier: 1.8,
  },
  {
    id: 'militair_pakket',
    name: 'Militair Pakket',
    icon: '🎖️',
    desc: 'Wapens + tech = exclusief militair pakket. 2× waarde.',
    ingredients: [{ goodId: 'weapons', amount: 3 }, { goodId: 'tech', amount: 3 }],
    chemCost: 0,
    output: { goodId: 'weapons', amount: 4 },
    heatGain: 8,
    reqVillaLevel: 2,
    reqModule: 'synthetica_lab',
    craftTimeLabel: 'Direct',
    sellMultiplier: 2.0,
  },
  {
    id: 'bio_serum',
    name: 'Bio-Serum',
    icon: '🧪',
    desc: 'Medische voorraad + drugs = experimenteel serum. 2.2× waarde.',
    ingredients: [{ goodId: 'meds', amount: 5 }, { goodId: 'drugs', amount: 3 }],
    chemCost: 4,
    output: { goodId: 'meds', amount: 4 },
    heatGain: 4,
    reqVillaLevel: 1,
    reqModule: 'wietplantage',
    craftTimeLabel: 'Direct',
    sellMultiplier: 2.2,
  },
  {
    id: 'nox_blend',
    name: 'Nox Blend',
    icon: '☠️',
    desc: 'Het ultieme product: alle grondstoffen. 3× basiswaarde.',
    ingredients: [
      { goodId: 'drugs', amount: 5 },
      { goodId: 'tech', amount: 3 },
      { goodId: 'meds', amount: 3 },
      { goodId: 'luxury', amount: 2 },
    ],
    chemCost: 8,
    output: { goodId: 'luxury', amount: 5 },
    heatGain: 12,
    reqVillaLevel: 3,
    reqModule: 'coke_lab',
    craftTimeLabel: 'Direct',
    sellMultiplier: 3.0,
  },
];

export interface CraftLogEntry {
  id: string;
  day: number;
  recipeId: string;
  recipeName: string;
  outputGoodId: GoodId;
  outputAmount: number;
  estimatedValue: number;
}

export function canCraft(state: GameState, recipe: CraftRecipe): { ok: boolean; reason?: string } {
  if (!state.villa) return { ok: false, reason: 'Geen villa' };
  if (state.villa.level < recipe.reqVillaLevel) return { ok: false, reason: `Villa Level ${recipe.reqVillaLevel} vereist` };
  if (!state.villa.modules.includes(recipe.reqModule)) return { ok: false, reason: `Module "${recipe.reqModule}" niet geïnstalleerd` };
  if (state.lab.chemicals < recipe.chemCost) return { ok: false, reason: `Te weinig chemicaliën (${recipe.chemCost} nodig)` };
  for (const ing of recipe.ingredients) {
    const owned = state.inventory[ing.goodId] || 0;
    if (owned < ing.amount) return { ok: false, reason: `Te weinig ${ing.goodId} (${ing.amount} nodig, ${owned} beschikbaar)` };
  }
  const currentInv = Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0);
  const ingredientTotal = recipe.ingredients.reduce((a, i) => a + i.amount, 0);
  const netChange = recipe.output.amount - ingredientTotal;
  if (netChange > 0 && currentInv + netChange > state.maxInv) return { ok: false, reason: 'Inventaris vol' };
  return { ok: true };
}
