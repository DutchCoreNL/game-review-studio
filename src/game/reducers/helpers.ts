import { GameState } from '../types';
import { updateChallengeProgress } from '../dailyChallenges';

export function syncChallenges(s: GameState): void {
  if (!s.dailyChallenges || s.dailyChallenges.length === 0) return;
  s.dailyChallenges = updateChallengeProgress(s.dailyChallenges, s.dailyProgress, s.heat);
}
