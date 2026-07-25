import type { GameState } from './types';

/**
 * UITRUSTING — the multiplier chain the loop was missing.
 *
 * Everything you do produces two currencies: dirty money from jobs, clean money
 * once you launder it. Until now clean money only bought crew. Equipment is what
 * you spend it on to make *yourself* stronger, and it is what turns a flat grind
 * into a curve: a better toolkit makes every tap count, a faster car makes your
 * whole crew quicker, a bigger stash means fewer forced fire-sales, and a deeper
 * network keeps the heat and the neighbours off your back.
 *
 * Four tracks, five tiers each, bought in order. Each tier is gated by respect as
 * well as price, so gear and reputation pull each other forward.
 */

export type EquipSlot = 'gereedschap' | 'voertuig' | 'opslag' | 'netwerk';

export interface EquipTier {
  name: string;
  flavor: string;
  cost: number;
  minRespect: number;
  /** The effect magnitude at this tier — meaning depends on the slot. */
  value: number;
}

export interface EquipTrack {
  id: EquipSlot;
  name: string;
  icon: string;
  /** What this track does, in the player's words. */
  effect: string;
  accent: 'gold' | 'blood' | 'emerald' | 'purple';
  tiers: EquipTier[];
}

export const EQUIPMENT: EquipTrack[] = [
  {
    id: 'gereedschap', name: 'Gereedschap', icon: '🧰', accent: 'gold',
    effect: 'Meer voortgang per tik',
    tiers: [
      { name: 'Koevoet', flavor: 'Roestig, maar hij opent deuren.', cost: 4000, minRespect: 0, value: 2 },
      { name: 'Slotenset', flavor: 'Geen herrie, geen sporen.', cost: 18000, minRespect: 30, value: 5 },
      { name: 'Snijbrander', flavor: 'Voor als de deur van staal is.', cost: 60000, minRespect: 90, value: 10 },
      { name: 'Thermische lans', flavor: 'Snijdt door een kluisdeur alsof het karton is.', cost: 200000, minRespect: 200, value: 20 },
      { name: 'Doorbraakteam', flavor: 'Je hoeft niets meer zelf vast te houden.', cost: 700000, minRespect: 400, value: 40 },
    ],
  },
  {
    id: 'voertuig', name: 'Voertuig', icon: '🚗', accent: 'blood',
    effect: 'Je crew werkt sneller',
    tiers: [
      { name: 'Bestelbus', flavor: 'Deuken genoeg, maar hij rijdt.', cost: 6000, minRespect: 0, value: 0.2 },
      { name: 'Opgevoerde sedan', flavor: 'Snel weg zijn is het halve werk.', cost: 25000, minRespect: 40, value: 0.45 },
      { name: 'Gepantserde wagen', flavor: 'Rijdt door een wegversperring heen.', cost: 90000, minRespect: 120, value: 0.8 },
      { name: 'Wagenpark', flavor: 'Drie ploegen, drie routes, tegelijk.', cost: 300000, minRespect: 250, value: 1.3 },
      { name: 'Konvooi', flavor: 'De stad ziet je komen en gaat aan de kant.', cost: 900000, minRespect: 450, value: 2 },
    ],
  },
  {
    id: 'opslag', name: 'Opslag', icon: '📦', accent: 'emerald',
    effect: 'Meer contrabande in voorraad',
    tiers: [
      { name: 'Kelderbox', flavor: 'Vochtig, maar niemand kijkt er.', cost: 5000, minRespect: 0, value: 10 },
      { name: 'Garagebox', flavor: 'Een rolluik en een goed slot.', cost: 22000, minRespect: 35, value: 25 },
      { name: 'Loods', flavor: 'Ruimte zat, zolang de huur betaald wordt.', cost: 80000, minRespect: 110, value: 60 },
      { name: 'Koelhuis', flavor: 'Officieel staat hier vis.', cost: 260000, minRespect: 220, value: 140 },
      { name: 'Vrijhaven-depot', flavor: 'Papieren grond. Niemand mag naar binnen.', cost: 800000, minRespect: 420, value: 300 },
    ],
  },
  {
    id: 'netwerk', name: 'Netwerk', icon: '🕸️', accent: 'purple',
    effect: 'Minder hitte en minder aandacht',
    tiers: [
      { name: 'Tipgever', flavor: 'Een agent die belt voordat er iets gebeurt.', cost: 8000, minRespect: 10, value: 1 },
      { name: 'Advocaat', flavor: 'Hij stelt vragen die dossiers vertragen.', cost: 30000, minRespect: 50, value: 2 },
      { name: 'Rechercheur op de loonlijst', flavor: 'Onderzoeken lopen dood op zijn bureau.', cost: 110000, minRespect: 140, value: 4 },
      { name: 'Officier van justitie', flavor: 'Zaken die niet uitkomen, komen niet voor.', cost: 350000, minRespect: 280, value: 6 },
      { name: 'De burgemeester', flavor: 'Niemand komt nog aan je zonder toestemming.', cost: 1000000, minRespect: 500, value: 9 },
    ],
  },
];

export const EQUIP_BY_ID: Record<EquipSlot, EquipTrack> =
  EQUIPMENT.reduce((a, t) => { a[t.id] = t; return a; }, {} as Record<EquipSlot, EquipTrack>);

/** Tier you own on a track: 0 means nothing yet, 1..5 index into `tiers`. */
export function ownedTier(state: GameState, slot: EquipSlot): number {
  return state.equipment?.[slot] || 0;
}

/** The next tier you could buy, or null when the track is maxed. */
export function nextTier(state: GameState, slot: EquipSlot): EquipTier | null {
  const track = EQUIP_BY_ID[slot];
  const owned = ownedTier(state, slot);
  return owned >= track.tiers.length ? null : track.tiers[owned];
}

/** Whether the next tier on a track is affordable and unlocked right now. */
export function canBuyTier(state: GameState, slot: EquipSlot): boolean {
  const tier = nextTier(state, slot);
  if (!tier) return false;
  return state.money >= tier.cost && (state.org?.respect || 0) >= tier.minRespect;
}

/** Effect value currently active on a track (0 when you own nothing). */
export function activeValue(state: GameState, slot: EquipSlot): number {
  const owned = ownedTier(state, slot);
  return owned > 0 ? EQUIP_BY_ID[slot].tiers[owned - 1].value : 0;
}

// ---- The effects, consumed across the game ----

/** Extra progress every tap adds, on top of your own hands. */
export function equipTapBonus(state: GameState): number {
  return activeValue(state, 'gereedschap');
}

/** Multiplier on how fast your crew works a job. */
export function equipCrewMultiplier(state: GameState): number {
  return 1 + activeValue(state, 'voertuig');
}

/** Extra contraband slots your stash holds. */
export function equipStashBonus(state: GameState): number {
  return activeValue(state, 'opslag');
}

/** Heat (and rival attention) your network quietly absorbs each day. */
export function equipHeatShield(state: GameState): number {
  return activeValue(state, 'netwerk');
}
