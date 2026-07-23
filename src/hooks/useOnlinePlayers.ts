import { useGame } from '@/contexts/GameContext';
import { selectOnlinePlayers, selectOnlineCountByDistrict, type OnlinePlayerRow } from '@/game/world/select';

export type OnlinePlayer = OnlinePlayerRow;

/** "Online players" now derived from the local world simulation (bots flagged online). */
export function useOnlinePlayers() {
  const { state } = useGame();
  const players = selectOnlinePlayers(state.world);
  const countByDistrict = selectOnlineCountByDistrict(state.world);
  return { players, countByDistrict, total: players.length };
}
