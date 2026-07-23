import { useState, useEffect } from 'react';
import type { WeatherType } from '@/game/types';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export interface WorldEvent {
  id: string;
  name: string;
  desc: string;
  xp_multiplier: number;
  started_day: number;
  ends_day: number;
}

export interface WorldState {
  worldDay: number;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  nextCycleAt: string;
  activeEvent: WorldEvent | null;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}

const WEATHER_TYPES: WeatherType[] = ['clear', 'rain', 'fog', 'heatwave', 'storm'];
const WEATHER_WEIGHTS = [40, 25, 15, 10, 10];

// Time-of-day derived from the real local clock (was server-driven; now fully local):
// Dawn 06-12, Day 12-18, Dusk 18-24, Night 00-06.
function getPhaseFromRealTime(): { phase: TimeOfDay; nextCycleAt: string } {
  const now = new Date();
  const h = now.getHours();
  let phase: TimeOfDay;
  let nextBoundary: number;
  if (h >= 6 && h < 12) { phase = 'dawn'; nextBoundary = 12; }
  else if (h >= 12 && h < 18) { phase = 'day'; nextBoundary = 18; }
  else if (h >= 18) { phase = 'dusk'; nextBoundary = 24; }
  else { phase = 'night'; nextBoundary = 6; }
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(nextBoundary % 24);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return { phase, nextCycleAt: next.toISOString() };
}

function getWorldDayFromDate(): number {
  const ref = new Date('2025-01-01T06:00:00').getTime();
  return Math.floor((Date.now() - ref) / (24 * 60 * 60 * 1000)) + 1;
}

// Deterministic weather per world-day so it stays stable within a day but varies day to day.
function weatherForDay(day: number): WeatherType {
  const total = WEATHER_WEIGHTS.reduce((a, b) => a + b, 0);
  // Simple hash of the day → [0, total)
  let r = ((day * 2654435761) % total + total) % total;
  for (let i = 0; i < WEATHER_TYPES.length; i++) {
    r -= WEATHER_WEIGHTS[i];
    if (r < 0) return WEATHER_TYPES[i];
  }
  return 'clear';
}

function computeWorldState(): WorldState {
  const { phase, nextCycleAt } = getPhaseFromRealTime();
  const worldDay = getWorldDayFromDate();
  return {
    worldDay,
    timeOfDay: phase,
    weather: weatherForDay(worldDay),
    nextCycleAt,
    activeEvent: null,
    maintenanceMode: false,
    maintenanceMessage: null,
  };
}

export function useWorldState() {
  const [worldState, setWorldState] = useState<WorldState>(computeWorldState);

  useEffect(() => {
    // Re-evaluate the clock-driven world state every minute so the phase/countdown stays fresh.
    const tick = () => setWorldState(computeWorldState());
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, []);

  return { ...worldState, loading: false };
}

// Time-of-day icons for UI
export const TIME_OF_DAY_ICONS: Record<TimeOfDay, string> = {
  dawn: '🌅',
  day: '☀️',
  dusk: '🌆',
  night: '🌙',
};

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  dawn: 'Dageraad',
  day: 'Dag',
  dusk: 'Schemering',
  night: 'Nacht',
};
