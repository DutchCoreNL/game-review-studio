import { useGame } from '@/contexts/GameContext';
import { selectActivityFeed, type ActivityRow } from '@/game/world/select';

export type ActivityItem = ActivityRow;

/** Live activity feed, now sourced from the local world simulation instead of Supabase. */
export function useActivityFeed(districtFilter?: string): ActivityItem[] {
  const { state } = useGame();
  return selectActivityFeed(state.world, districtFilter);
}
