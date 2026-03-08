// ========== NAMED UNIQUE WEAPONS ==========
// Hand-crafted legendary weapons that drop from specific bosses/missions

import { GeneratedWeapon } from './weaponGenerator';

export interface UniqueWeaponDef {
  id: string;
  name: string;
  brand: GeneratedWeapon['brand'];
  frame: GeneratedWeapon['frame'];
  barrel: GeneratedWeapon['barrel'];
  magazine: GeneratedWeapon['magazine'];
  accessory: GeneratedWeapon['accessory'];
  damage: number;
  accuracy: number;
  fireRate: number;
  clipSize: number;
  critChance: number;
  armorPierce: number;
  specialEffect: string;
  lore: string;
  glowColor: string; // extra CSS class for unique glow
  dropSource: string; // boss/mission that drops this
}

export const UNIQUE_WEAPONS: UniqueWeaponDef[] = [
  {
    id: 'unique_bloedlust',
    name: '🩸 Bloedlust',
    brand: 'serpiente',
    frame: 'blade',
    barrel: 'standaard',
    magazine: 'standaard',
    accessory: 'toxic',
    damage: 22,
    accuracy: 9,
    fireRate: 8,
    clipSize: 0,
    critChance: 35,
    armorPierce: 20,
    specialEffect: '🩸 Leeching: Heal 15% van toegebrachte schade',
    lore: 'Gesmeed in bloed, gevoed door angst. Dit mes fluistert de naam van zijn volgende slachtoffer.',
    glowColor: 'shadow-blood/50 shadow-lg',
    dropSource: 'Chapter 6 — Het Orakel',
  },
  {
    id: 'unique_dondervuist',
    name: '⚡ Dondervuist',
    brand: 'drakon',
    frame: 'shotgun',
    barrel: 'dubbel',
    magazine: 'speciaal',
    accessory: 'shock',
    damage: 28,
    accuracy: 5,
    fireRate: 3,
    clipSize: 8,
    critChance: 20,
    armorPierce: 40,
    specialEffect: '⚡ Thunderclap: 30% kans op AoE stun',
    lore: 'Gebouwd door Drakon Heavy voor één doel: gebouwen slopen. Werkt ook op mensen.',
    glowColor: 'shadow-gold/50 shadow-lg',
    dropSource: 'Chapter 7 — De Feniks',
  },
  {
    id: 'unique_fluisteraar',
    name: '👻 De Fluisteraar',
    brand: 'phantom',
    frame: 'rifle',
    barrel: 'precisie',
    magazine: 'cassette',
    accessory: 'silencer',
    damage: 24,
    accuracy: 10,
    fireRate: 5,
    clipSize: 15,
    critChance: 40,
    armorPierce: 25,
    specialEffect: '👻 Ghost Protocol: 0 heat per kill',
    lore: 'Ze zeggen dat je dit geweer nooit hoort. Ze zeggen ook dat niemand het heeft overleefd om dat te bevestigen.',
    glowColor: 'shadow-slate-400/50 shadow-lg',
    dropSource: 'Chapter 8 — De Ziel van Noxhaven',
  },
  {
    id: 'unique_noxheart',
    name: '💀 Nox\'s Hart',
    brand: 'noxforge',
    frame: 'launcher',
    barrel: 'plasma',
    magazine: 'drum',
    accessory: 'incendiary',
    damage: 35,
    accuracy: 4,
    fireRate: 2,
    clipSize: 6,
    critChance: 15,
    armorPierce: 50,
    specialEffect: '💀 Apocalyps: Brand schade stapelt 2x sneller',
    lore: 'Het ultieme wapen van Noxhaven. Niemand weet wie het heeft gebouwd — alleen dat het alles vernietigt.',
    glowColor: 'shadow-orange-500/50 shadow-lg',
    dropSource: 'Final Boss — De Ziel van Noxhaven',
  },
  {
    id: 'unique_ijzerbijter',
    name: '🦷 De IJzerbijter',
    brand: 'ironjaw',
    frame: 'lmg',
    barrel: 'lang',
    magazine: 'belt',
    accessory: 'geen',
    damage: 18,
    accuracy: 4,
    fireRate: 9,
    clipSize: 60,
    critChance: 10,
    armorPierce: 45,
    specialEffect: '🦷 Relentless: Geen herlaadtijd',
    lore: 'Ironjaw\'s magnum opus. 60 kogels ononderbroken vuur. Richt niet, bid.',
    glowColor: 'shadow-gold/50 shadow-lg',
    dropSource: 'Gang War — Legendarische drop',
  },
  {
    id: 'unique_weduwemaker',
    name: '🎯 De Weduwemaker',
    brand: 'wraithsteel',
    frame: 'sniper',
    barrel: 'precisie',
    magazine: 'speciaal',
    accessory: 'silencer',
    damage: 32,
    accuracy: 10,
    fireRate: 2,
    clipSize: 5,
    critChance: 45,
    armorPierce: 35,
    specialEffect: '🎯 Widowmaker: Eerste schot altijd crit',
    lore: 'Eén kogel, één weduwe. Dit geweer heeft meer families vernietigd dan welke oorlog dan ook.',
    glowColor: 'shadow-cyan-300/50 shadow-lg',
    dropSource: 'Gang War — Legendarische drop',
  },
  {
    id: 'unique_echo',
    name: '🏹 Echo',
    brand: 'phantom',
    frame: 'crossbow',
    barrel: 'gedempt',
    magazine: 'standaard',
    accessory: 'cryo',
    damage: 20,
    accuracy: 9,
    fireRate: 4,
    clipSize: 6,
    critChance: 30,
    armorPierce: 20,
    specialEffect: '🏹 Silent Echo: 0 heat, pijlen ketsen naar 2e target',
    lore: 'De laatste fluistering die je hoort voordat de stilte je opslikt.',
    glowColor: 'shadow-slate-300/50 shadow-lg',
    dropSource: 'Dungeon Boss — Legendarische drop',
  },
  {
    id: 'unique_tweelingvuur',
    name: '🔥 Tweelingvuur',
    brand: 'havoc',
    frame: 'duals',
    barrel: 'kort',
    magazine: 'drum',
    accessory: 'incendiary',
    damage: 12,
    accuracy: 5,
    fireRate: 10,
    clipSize: 36,
    critChance: 15,
    armorPierce: 15,
    specialEffect: '🔥 Twinfire: Elke 5e kogel doet 3x schade',
    lore: 'Twee pistolen, één doel: alles in brand zetten. Havoc Arms\' meest chaotische creatie.',
    glowColor: 'shadow-red-400/50 shadow-lg',
    dropSource: 'Organized Crime — Mijlpaal beloning',
  },
];

export function createUniqueWeapon(def: UniqueWeaponDef, level: number): GeneratedWeapon {
  return {
    id: `${def.id}_${Date.now()}`,
    name: def.name,
    brand: def.brand,
    frame: def.frame,
    barrel: def.barrel,
    magazine: def.magazine,
    accessory: def.accessory,
    rarity: 'legendary',
    damage: Math.round(def.damage * (1 + level * 0.08)),
    accuracy: def.accuracy,
    fireRate: def.fireRate,
    clipSize: def.clipSize,
    critChance: def.critChance,
    armorPierce: def.armorPierce,
    specialEffect: def.specialEffect,
    level,
    sellValue: 50000,
    equipped: false,
    locked: true, // unique weapons are locked by default
    masteryXp: 0,
    isUnique: true,
    uniqueGlow: def.glowColor,
    lore: def.lore,
  };
}

export function getUniqueWeaponForBoss(chapterId: string): UniqueWeaponDef | null {
  if (chapterId === 'chapter6') return UNIQUE_WEAPONS.find(w => w.id === 'unique_bloedlust') || null;
  if (chapterId === 'chapter7') return UNIQUE_WEAPONS.find(w => w.id === 'unique_dondervuist') || null;
  if (chapterId === 'chapter8') return UNIQUE_WEAPONS.find(w => w.id === 'unique_fluisteraar') || null;
  return null;
}
