// ========== CAMPAIGN GEAR SETS — Chapter-specific gear with set bonuses ==========

export interface GearSetPiece {
  name: string;
  icon: string;
  type: 'weapon' | 'armor' | 'gadget';
  effect: string;
}

export interface GearSet {
  chapterId: string;
  name: string;
  icon: string;
  pieces: GearSetPiece[];
  setBonus2: { name: string; description: string; effect: string };
  setBonus3: { name: string; description: string; effect: string };
}

export const CHAPTER_GEAR_SETS: Record<string, GearSet> = {
  ch1: {
    chapterId: 'ch1',
    name: 'Slager Set',
    icon: '🪓',
    pieces: [
      { name: "Kozlov's Hakmes", icon: '🔪', type: 'weapon', effect: '+5% crit kans' },
      { name: 'Slagers Schort', icon: '🩸', type: 'armor', effect: '+8% damage reduction' },
      { name: 'Vleeshaak', icon: '🪝', type: 'gadget', effect: '+3 schade per aanval' },
    ],
    setBonus2: { name: '2-delig', description: '+10% crit schade', effect: 'critDamage:10' },
    setBonus3: { name: 'Volledige Set', description: '+20% crit schade & +5% lifesteal', effect: 'critDamage:20,lifesteal:5' },
  },
  ch2: {
    chapterId: 'ch2',
    name: 'Syndicaat Set',
    icon: '🎩',
    pieces: [
      { name: 'Vergulde Derringer', icon: '🔫', type: 'weapon', effect: '+8% accuracy' },
      { name: 'Zijden Kogelvrij Vest', icon: '🎩', type: 'armor', effect: '+12% dodge' },
      { name: "Vasari's Manchetknopen", icon: '💎', type: 'gadget', effect: '+15% handelswinst' },
    ],
    setBonus2: { name: '2-delig', description: '+10% handelswinst', effect: 'trade:10' },
    setBonus3: { name: 'Volledige Set', description: '+20% handelswinst & -10% heat', effect: 'trade:20,heat:-10' },
  },
  ch3: {
    chapterId: 'ch3',
    name: 'Wolvenroedel Set',
    icon: '🐺',
    pieces: [
      { name: 'Wolfsklauw Mes', icon: '🐺', type: 'weapon', effect: '+5 snelheid' },
      { name: 'Wolfspels Mantel', icon: '🧥', type: 'armor', effect: '+10% dodge kans' },
      { name: 'Roedel Talisman', icon: '🦴', type: 'gadget', effect: '+5% aanvalsnelheid' },
    ],
    setBonus2: { name: '2-delig', description: '+15% dodge kans', effect: 'dodge:15' },
    setBonus3: { name: 'Volledige Set', description: '+20% dodge & eerste ontwijking per gevecht gratis', effect: 'dodge:20,freeDodge:1' },
  },
  ch4: {
    chapterId: 'ch4',
    name: 'Wetshandhaver Set',
    icon: '🛡️',
    pieces: [
      { name: 'Confiscated Assault Rifle', icon: '🔫', type: 'weapon', effect: '+10 schade' },
      { name: 'Riot Gear', icon: '🛡️', type: 'armor', effect: '+20% damage reduction' },
      { name: 'Politie Radio', icon: '📻', type: 'gadget', effect: '-15% heat gain' },
    ],
    setBonus2: { name: '2-delig', description: '-20% heat gain', effect: 'heat:-20' },
    setBonus3: { name: 'Volledige Set', description: '-30% heat & +10% armor', effect: 'heat:-30,armor:10' },
  },
  ch5: {
    chapterId: 'ch5',
    name: 'Architect Set',
    icon: '🏛️',
    pieces: [
      { name: 'Blauwdruk Precisiegeweer', icon: '🎯', type: 'weapon', effect: '+15% accuracy' },
      { name: 'Gepantserd Pak', icon: '🏛️', type: 'armor', effect: '+15% alle defensie' },
      { name: 'Holografische Kaart', icon: '📐', type: 'gadget', effect: '+10% XP bonus' },
    ],
    setBonus2: { name: '2-delig', description: '+15% XP bonus', effect: 'xp:15' },
    setBonus3: { name: 'Volledige Set', description: '+25% XP & +10% alle stats', effect: 'xp:25,allStats:10' },
  },
  ch6: {
    chapterId: 'ch6',
    name: 'Schaduwraad Set',
    icon: '🔮',
    pieces: [
      { name: 'Psionische Disruptor', icon: '🌀', type: 'weapon', effect: '+10% stun kans' },
      { name: 'Schaduwmantel', icon: '🔮', type: 'armor', effect: '+20% stealth bonus' },
      { name: 'Orakel Fragment', icon: '👁️', type: 'gadget', effect: '+10% succes kans' },
    ],
    setBonus2: { name: '2-delig', description: '+15% succes kans', effect: 'success:15' },
    setBonus3: { name: 'Volledige Set', description: '+20% succes & vijandelijke aanvallen voorspeld', effect: 'success:20,predict:1' },
  },
  ch7: {
    chapterId: 'ch7',
    name: 'Feniks Set',
    icon: '🔥',
    pieces: [
      { name: 'Vuurspuwer', icon: '🔥', type: 'weapon', effect: '+12 brandschade' },
      { name: 'Asbest Harnas', icon: '🛡️', type: 'armor', effect: 'Immuniteit voor brandschade' },
      { name: 'Vuurvogel Amulet', icon: '🪶', type: 'gadget', effect: '+15% HP regeneratie' },
    ],
    setBonus2: { name: '2-delig', description: '+20% HP regeneratie', effect: 'hpRegen:20' },
    setBonus3: { name: 'Volledige Set', description: 'Herrijzenis: eenmaal per gevecht herleef met 30% HP', effect: 'hpRegen:30,revive:1' },
  },
  ch8: {
    chapterId: 'ch8',
    name: 'Kroon Set',
    icon: '⚜️',
    pieces: [
      { name: 'Scepter van Noxhaven', icon: '👑', type: 'weapon', effect: '+20 schade & +10% crit' },
      { name: 'Koninklijke Wapenrusting', icon: '⚜️', type: 'armor', effect: '+25% alle defensie' },
      { name: 'Zegel van de Eeuwige', icon: '💎', type: 'gadget', effect: '+20% alle stats' },
    ],
    setBonus2: { name: '2-delig', description: '+15% alle stats', effect: 'allStats:15' },
    setBonus3: { name: 'Volledige Set', description: '+30% alle stats & unieke aura', effect: 'allStats:30,aura:1' },
  },
};

export function getGearSetPiecesOwned(chapterId: string, trophies: string[]): number {
  // Simplified: count based on boss kills and chapter completion
  // In a full implementation, this would check actual inventory
  return trophies.includes(CHAPTER_GEAR_SETS[chapterId]?.pieces[0]?.name) ? 3 : 0;
}
