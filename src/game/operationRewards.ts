import { SoloOperation, GameState, DistrictId } from './types';

const DISTRICT_MODS: Record<DistrictId, number> = {
  crown: 0.10,
  neon: 0.05,
  iron: 0.03,
  port: 0.02,
  low: 0.10,
};

export interface OperationRewardRange {
  min: number;
  max: number;
  bonuses: { label: string; value: string }[];
}

export function calculateOperationRewardRange(
  op: SoloOperation,
  state: GameState
): OperationRewardRange {
  const bonuses: { label: string; value: string }[] = [];

  // Day progression bonus (up to +80% at day 50+)
  const dayBonus = Math.min(0.8, state.day * 0.015);
  if (dayBonus >= 0.1) {
    bonuses.push({ label: 'DAG BONUS', value: `+${Math.round(dayBonus * 100)}%` });
  }

  // District modifier
  const districtMod = DISTRICT_MODS[state.loc] || 0;
  if (districtMod > 0) {
    bonuses.push({ label: state.loc.toUpperCase(), value: `+${Math.round(districtMod * 100)}%` });
  }

  // Heat premium
  const heatPremium = state.heat > 50 ? 0.15 : 0;
  if (heatPremium > 0) {
    bonuses.push({ label: 'HEAT PREMIE', value: '+15%' });
  }

  const base = op.reward * (1 + dayBonus + districtMod + heatPremium);

  const min = Math.floor(base * 0.7);
  const max = Math.floor(base * 1.4);

  return { min, max, bonuses };
}

export function rollActualReward(range: OperationRewardRange): number {
  return Math.floor(range.min + Math.random() * (range.max - range.min));
}
