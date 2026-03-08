// ========== WEAPON SKIN / COSMETIC SYSTEM ==========
// Skins change the visual appearance (border glow / color) of weapon/gear cards

// ========== TYPES ==========

export type SkinId = 
  | 'neon_red' | 'gold_plated' | 'skull_camo' | 'arctic_white'
  | 'shadow_purple' | 'blood_crimson' | 'toxic_green' | 'cyber_blue'
  | 'chrome_silver' | 'inferno_orange' | 'midnight_black' | 'diamond_frost'
  | 'holographic' | 'crimson_dragonscale' | 'ghost_wire' | 'rusted_iron';

export interface SkinDef {
  id: SkinId;
  name: string;
  icon: string;
  rarity: 'uncommon' | 'rare' | 'epic' | 'legendary';
  glowClass: string;    // tailwind classes for border/ring glow
  borderColor: string;  // tailwind border class
  description: string;
  cost: number;         // purchase cost at Black Market
}

export interface SkinItem {
  id: string;         // unique instance
  skinId: SkinId;
}

// ========== SKIN DEFINITIONS ==========

export const WEAPON_SKINS: SkinDef[] = [
  {
    id: 'neon_red', name: 'Neon Rood', icon: '🔴', rarity: 'uncommon',
    glowClass: 'ring-1 ring-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
    borderColor: 'border-red-500/50',
    description: 'Felrode neon gloed',
    cost: 3000,
  },
  {
    id: 'gold_plated', name: 'Gold Plated', icon: '✨', rarity: 'rare',
    glowClass: 'ring-1 ring-gold/60 shadow-[0_0_10px_rgba(212,175,55,0.4)]',
    borderColor: 'border-gold/50',
    description: 'Vergulde afwerking met gouden glans',
    cost: 8000,
  },
  {
    id: 'skull_camo', name: 'Skull Camo', icon: '💀', rarity: 'rare',
    glowClass: 'ring-1 ring-slate-400/60 shadow-[0_0_8px_rgba(148,163,184,0.3)]',
    borderColor: 'border-slate-400/50',
    description: 'Dodelijke schedel-camouflage patroon',
    cost: 7000,
  },
  {
    id: 'arctic_white', name: 'Arctic White', icon: '🤍', rarity: 'uncommon',
    glowClass: 'ring-1 ring-white/40 shadow-[0_0_8px_rgba(255,255,255,0.3)]',
    borderColor: 'border-white/30',
    description: 'Ijskoude witte finish',
    cost: 3500,
  },
  {
    id: 'shadow_purple', name: 'Shadow Purple', icon: '💜', rarity: 'epic',
    glowClass: 'ring-1 ring-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.4)]',
    borderColor: 'border-purple-500/50',
    description: 'Mysterieuze paarse schaduw aura',
    cost: 15000,
  },
  {
    id: 'blood_crimson', name: 'Blood Crimson', icon: '🩸', rarity: 'epic',
    glowClass: 'ring-1 ring-red-800/60 shadow-[0_0_12px_rgba(153,27,27,0.4)]',
    borderColor: 'border-red-800/50',
    description: 'Donkerrood met bloedvlekken effect',
    cost: 14000,
  },
  {
    id: 'toxic_green', name: 'Toxic Green', icon: '☢️', rarity: 'rare',
    glowClass: 'ring-1 ring-green-500/60 shadow-[0_0_10px_rgba(34,197,94,0.4)]',
    borderColor: 'border-green-500/50',
    description: 'Radioactieve groene gloed',
    cost: 6000,
  },
  {
    id: 'cyber_blue', name: 'Cyber Blue', icon: '💎', rarity: 'rare',
    glowClass: 'ring-1 ring-cyan-400/60 shadow-[0_0_10px_rgba(34,211,238,0.4)]',
    borderColor: 'border-cyan-400/50',
    description: 'Futuristische blauwe cyber coating',
    cost: 7500,
  },
  {
    id: 'chrome_silver', name: 'Chrome Silver', icon: '🪞', rarity: 'uncommon',
    glowClass: 'ring-1 ring-gray-300/50 shadow-[0_0_6px_rgba(209,213,219,0.3)]',
    borderColor: 'border-gray-300/40',
    description: 'Gespiegelde chrome afwerking',
    cost: 4000,
  },
  {
    id: 'inferno_orange', name: 'Inferno', icon: '🔥', rarity: 'epic',
    glowClass: 'ring-1 ring-orange-500/60 shadow-[0_0_12px_rgba(249,115,22,0.5)]',
    borderColor: 'border-orange-500/50',
    description: 'Vlammen-effect met intense hitte gloed',
    cost: 16000,
  },
  {
    id: 'midnight_black', name: 'Midnight Black', icon: '🖤', rarity: 'rare',
    glowClass: 'ring-1 ring-gray-800/60 shadow-[0_0_8px_rgba(31,41,55,0.5)]',
    borderColor: 'border-gray-800/50',
    description: 'Diepzwarte stealth coating',
    cost: 6500,
  },
  {
    id: 'diamond_frost', name: 'Diamond Frost', icon: '💠', rarity: 'legendary',
    glowClass: 'ring-2 ring-cyan-200/60 shadow-[0_0_16px_rgba(165,243,252,0.5)]',
    borderColor: 'border-cyan-200/50',
    description: 'Schitterende diamant-ijs kristallen coating',
    cost: 35000,
  },
  {
    id: 'holographic', name: 'Holographic', icon: '🌈', rarity: 'legendary',
    glowClass: 'ring-2 ring-pink-300/50 shadow-[0_0_16px_rgba(236,72,153,0.4)] animate-pulse',
    borderColor: 'border-pink-300/50',
    description: 'Regenboog-shimmer holografisch effect',
    cost: 40000,
  },
  {
    id: 'crimson_dragonscale', name: 'Crimson Dragonscale', icon: '🐲', rarity: 'epic',
    glowClass: 'ring-1 ring-red-600/60 shadow-[0_0_12px_rgba(220,38,38,0.4)]',
    borderColor: 'border-red-600/50',
    description: 'Rode geschubde drakenhuid textuur',
    cost: 18000,
  },
  {
    id: 'ghost_wire', name: 'Ghost Wire', icon: '👻', rarity: 'rare',
    glowClass: 'ring-1 ring-slate-300/40 shadow-[0_0_8px_rgba(203,213,225,0.3)]',
    borderColor: 'border-slate-300/30',
    description: 'Transparante wireframe hologram look',
    cost: 7000,
  },
  {
    id: 'rusted_iron', name: 'Rusted Iron', icon: '🔩', rarity: 'uncommon',
    glowClass: 'ring-1 ring-amber-700/50 shadow-[0_0_6px_rgba(180,83,9,0.3)]',
    borderColor: 'border-amber-700/40',
    description: 'Verweerde industriële roestige afwerking',
    cost: 3000,
  },
];

// ========== FUNCTIONS ==========

export function getSkinDef(id: SkinId): SkinDef {
  return WEAPON_SKINS.find(s => s.id === id)!;
}

let skinIdCounter = 0;
export function createSkinItem(skinId: SkinId): SkinItem {
  skinIdCounter++;
  return { id: `skin_${Date.now()}_${skinIdCounter}`, skinId };
}

/** Roll a random skin drop */
export function rollSkinDrop(playerLevel: number): SkinDef | null {
  // 8% base chance
  const chance = 0.08 + Math.min(playerLevel * 0.005, 0.1);
  if (Math.random() > chance) return null;

  const r = Math.random();
  const pool = r < 0.05 ? WEAPON_SKINS.filter(s => s.rarity === 'legendary')
    : r < 0.20 ? WEAPON_SKINS.filter(s => s.rarity === 'epic')
    : r < 0.50 ? WEAPON_SKINS.filter(s => s.rarity === 'rare')
    : WEAPON_SKINS.filter(s => s.rarity === 'uncommon');

  if (pool.length === 0) return WEAPON_SKINS[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

export const SKIN_RARITY_LABEL: Record<string, string> = {
  uncommon: 'Ongewoon',
  rare: 'Zeldzaam',
  epic: 'Episch',
  legendary: 'Legendarisch',
};
