import { describe, it, expect } from 'vitest';
import {
  travelCost, travelBlockedReason, canTravel, travelCooldownLeft,
  TRAVEL_BASE_COST, TRAVEL_ENERGY,
} from './cityTravel';
import type { GameState, DistrictId } from './types';

function driver(over: Partial<GameState> = {}): GameState {
  return {
    loc: 'low',
    money: 10000,
    energy: 100,
    crew: [],
    ownedDistricts: [],
    ownedVehicles: [],
    activeVehicle: null,
    weather: 'clear',
    travelCooldownUntil: null,
    hidingDays: 0,
    prison: null,
    hospital: null,
    ...over,
  } as unknown as GameState;
}

const CROWN = 'crown' as DistrictId;

describe('travelCost', () => {
  it('is the base fare for someone with nothing', () => {
    expect(travelCost(driver(), CROWN)).toBe(TRAVEL_BASE_COST);
  });

  it('is free with a Chauffeur on the crew', () => {
    expect(travelCost(driver({ crew: [{ role: 'Chauffeur' }] } as any), CROWN)).toBe(0);
  });

  it('is free with a racer, on turf you own, and in a storm', () => {
    expect(travelCost(driver({ crew: [{ specialization: 'racer' }] } as any), CROWN)).toBe(0);
    expect(travelCost(driver({ ownedDistricts: ['crown'] } as any), CROWN)).toBe(0);
    expect(travelCost(driver({ weather: 'storm' } as any), CROWN)).toBe(0);
  });

  it('drops with vehicle speed upgrades — the popup used to quote a flat €50 regardless', () => {
    const tuned = driver({
      activeVehicle: 'v1',
      ownedVehicles: [{ id: 'v1', upgrades: { speed: 3 } }],
    } as any);
    expect(travelCost(tuned, CROWN)).toBeLessThan(TRAVEL_BASE_COST);
  });
});

describe('travelBlockedReason', () => {
  it('lets you go when nothing is in the way', () => {
    expect(travelBlockedReason(driver(), CROWN)).toBeNull();
    expect(canTravel(driver(), CROWN)).toBe(true);
  });

  it('names the reason instead of refusing silently', () => {
    // Every one of these used to be a bare `return s` in the reducer, while the Reis &
    // Koop dialog announced your arrival anyway.
    expect(travelBlockedReason(driver({ energy: 1 }), CROWN)).toContain('energie');
    expect(travelBlockedReason(driver({ money: 0 }), CROWN)).toContain('geld');
    expect(travelBlockedReason(driver({ prison: { daysRemaining: 2 } } as any), CROWN)).toContain('vast');
    expect(travelBlockedReason(driver({ hidingDays: 2 }), CROWN)).toContain('ondergedoken');
    expect(travelBlockedReason(driver(), 'low' as DistrictId)).toContain('al');
  });

  it('holds you for the cooldown and counts it down out loud', () => {
    const soon = new Date(Date.now() + 12000).toISOString();
    const s = driver({ travelCooldownUntil: soon });
    expect(travelCooldownLeft(s)).toBeGreaterThan(0);
    expect(travelBlockedReason(s, CROWN)).toMatch(/\d+s/);
  });

  it('does not charge energy against a fare you cannot pay', () => {
    // The reducer deducted energy and set the cooldown before checking your wallet, so a
    // trip you could not afford still cost you both.
    const broke = driver({ money: 0 });
    expect(canTravel(broke, CROWN)).toBe(false);
    expect(broke.energy).toBeGreaterThanOrEqual(TRAVEL_ENERGY);
  });
});
