/**
 * Karma System — Morele keuzes met gameplay-gevolgen.
 * Karma loopt van -100 (Meedogenloos) tot +100 (Eerbaar).
 *
 * MEEDOGENLOOS (karma < -20):
 * • Intimidatie: hogere succeskans, meer rep & geld
 * • Rep gain: +20% op alle rep gains
 * • Fear-factor: vijandige facties doen minder schade
 *
 * EERBAAR (karma > 20):
 * • Crew: betere healing, minder schade bij mislukte contracten
 * • Politie: lagere raid-kans, snellere heat decay
 * • Onderhandelingen: goedkopere negotiate/bribe
 * • Trade: betere verkoopprijzen
 */

import type { GameState } from './types';

// ========== KARMA ALIGNMENT ==========

export type KarmaAlignment = 'meedogenloos' | 'neutraal' | 'eerbaar';

export function getKarmaAlignment(karma: number): KarmaAlignment {
  if (karma <= -20) return 'meedogenloos';
  if (karma >= 20) return 'eerbaar';
  return 'neutraal';
}

export function getKarmaLabel(karma: number): string {
  if (karma <= -75) return 'Genadeloos';
  if (karma <= -50) return 'Meedogenloos';
  if (karma <= -20) return 'Hardvochtig';
  if (karma < 20) return 'Neutraal';
  if (karma < 50) return 'Principieel';
  if (karma < 75) return 'Eerbaar';
  return 'Rechtschapen';
}

export function getKarmaIcon(karma: number): string {
  if (karma <= -50) return '🩸';
  if (karma <= -20) return '⚡';
  if (karma < 20) return '⚖️';
  if (karma < 50) return '🛡️';
  return '✨';
}

// ========== KARMA INTENSITY ==========
// Returns 0-1 based on how far the karma leans in its direction

function karmaIntensity(karma: number): number {
  const alignment = getKarmaAlignment(karma);
  if (alignment === 'neutraal') return 0;
  if (alignment === 'meedogenloos') return Math.min(1, (Math.abs(karma) - 20) / 80);
  return Math.min(1, (karma - 20) / 80);
}

// ========== MEEDOGENLOOS EFFECTS ==========

/** Extra intimidation success chance (0 - 0.20) */
export function getKarmaIntimidationBonus(state: GameState): number {
  const karma = state.karma || 0;
  if (karma >= -20) return 0;
  return 0.05 + karmaIntensity(karma) * 0.15; // 5%-20%
}

/** Rep multiplier for meedogenloos (1.0 - 1.3) */
export function getKarmaRepMultiplier(state: GameState): number {
  const karma = state.karma || 0;
  if (karma >= -20) return 1.0;
  return 1.0 + karmaIntensity(karma) * 0.3; // 1.0x-1.3x
}

/** Intimidation money multiplier (1.0 - 1.5) */
export function getKarmaIntimidationMoneyBonus(state: GameState): number {
  const karma = state.karma || 0;
  if (karma >= -20) return 1.0;
  return 1.0 + karmaIntensity(karma) * 0.5; // 1.0x-1.5x
}

/** Faction war damage reduction for meedogenloos (fear factor) (0 - 0.30) */
export function getKarmaFearReduction(state: GameState): number {
  const karma = state.karma || 0;
  if (karma >= -20) return 0;
  return karmaIntensity(karma) * 0.30; // 0%-30%
}

// ========== EERBAAR EFFECTS ==========

/** Crew healing bonus (0 - 0.40) */
export function getKarmaCrewHealingBonus(state: GameState): number {
  const karma = state.karma || 0;
  if (karma <= 20) return 0;
  return karmaIntensity(karma) * 0.40; // 0%-40%
}

/** Crew damage reduction on failed contracts (0 - 0.25) */
export function getKarmaCrewProtection(state: GameState): number {
  const karma = state.karma || 0;
  if (karma <= 20) return 0;
  return karmaIntensity(karma) * 0.25; // 0%-25%
}

/** Police raid chance reduction (0 - 0.25) */
export function getKarmaRaidReduction(state: GameState): number {
  const karma = state.karma || 0;
  if (karma <= 20) return 0;
  return karmaIntensity(karma) * 0.25; // 0%-25%
}

/** Extra personal heat decay (0 - 4) */
export function getKarmaHeatDecayBonus(state: GameState): number {
  const karma = state.karma || 0;
  if (karma <= 20) return 0;
  return Math.floor(karmaIntensity(karma) * 4); // 0-4 extra decay/day
}

/** Negotiate/bribe cost reduction (0 - 0.25) */
export function getKarmaDiplomacyDiscount(state: GameState): number {
  const karma = state.karma || 0;
  if (karma <= 20) return 0;
  return karmaIntensity(karma) * 0.25; // 0%-25%
}

/** Trade sell price bonus (0 - 0.08) */
export function getKarmaTradeSellBonus(state: GameState): number {
  const karma = state.karma || 0;
  if (karma <= 20) return 0;
  return karmaIntensity(karma) * 0.08; // 0%-8%
}

// ========== ACTIVE BONUSES SUMMARY ==========

export interface KarmaBonus {
  label: string;
  value: string;
  positive: boolean;
}

export function getActiveKarmaBonuses(state: GameState): KarmaBonus[] {
  const karma = state.karma || 0;
  const alignment = getKarmaAlignment(karma);
  const bonuses: KarmaBonus[] = [];

  if (alignment === 'meedogenloos') {
    const intimBonus = getKarmaIntimidationBonus(state);
    if (intimBonus > 0) bonuses.push({ label: 'Intimidatie succeskans', value: `+${Math.round(intimBonus * 100)}%`, positive: true });
    
    const repMult = getKarmaRepMultiplier(state);
    if (repMult > 1) bonuses.push({ label: 'Reputatie gain', value: `+${Math.round((repMult - 1) * 100)}%`, positive: true });
    
    const moneyBonus = getKarmaIntimidationMoneyBonus(state);
    if (moneyBonus > 1) bonuses.push({ label: 'Intimidatie opbrengst', value: `+${Math.round((moneyBonus - 1) * 100)}%`, positive: true });
    
    const fearRed = getKarmaFearReduction(state);
    if (fearRed > 0) bonuses.push({ label: 'Vijandige factie-schade', value: `-${Math.round(fearRed * 100)}%`, positive: true });
  }

  if (alignment === 'eerbaar') {
    const healBonus = getKarmaCrewHealingBonus(state);
    if (healBonus > 0) bonuses.push({ label: 'Crew healing', value: `+${Math.round(healBonus * 100)}%`, positive: true });
    
    const crewProt = getKarmaCrewProtection(state);
    if (crewProt > 0) bonuses.push({ label: 'Crew schade (bij falen)', value: `-${Math.round(crewProt * 100)}%`, positive: true });
    
    const raidRed = getKarmaRaidReduction(state);
    if (raidRed > 0) bonuses.push({ label: 'Politie-inval kans', value: `-${Math.round(raidRed * 100)}%`, positive: true });
    
    const heatDecay = getKarmaHeatDecayBonus(state);
    if (heatDecay > 0) bonuses.push({ label: 'Extra heat decay/dag', value: `+${heatDecay}`, positive: true });
    
    const diplomacy = getKarmaDiplomacyDiscount(state);
    if (diplomacy > 0) bonuses.push({ label: 'Diplomatie korting', value: `-${Math.round(diplomacy * 100)}%`, positive: true });
    
    const tradeSell = getKarmaTradeSellBonus(state);
    if (tradeSell > 0) bonuses.push({ label: 'Verkoopprijs bonus', value: `+${Math.round(tradeSell * 100)}%`, positive: true });
  }

  return bonuses;
}
