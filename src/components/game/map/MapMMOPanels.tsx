import { DistrictId } from '@/game/types';
import { ActivityFeedPanel } from '../mmo/ActivityFeedPanel';
import { OnlinePlayersIndicator } from '../mmo/OnlinePlayersIndicator';
import { DuelArenaPanel } from '../mmo/DuelArenaPanel';

interface MapMMOPanelsProps {
  currentDistrict: DistrictId;
}

/**
 * Living-world panels shown on the city map. Single-player: every panel here is
 * backed by the local bot-world simulation (rivals active in the district, the
 * duel arena, and the underworld activity feed). Server-backed panels that used
 * to live here (season events, market alerts, world raids, smuggle routes, the
 * bounty-hunter and reputation leaderboards) had no local data and were removed.
 */
export function MapMMOPanels({ currentDistrict }: MapMMOPanelsProps) {
  return (
    <>
      {/* Rivals active in this district */}
      <div className="mb-2">
        <OnlinePlayersIndicator currentDistrict={currentDistrict} compact />
      </div>

      {/* Duel Arena */}
      <div className="mb-2">
        <DuelArenaPanel currentDistrict={currentDistrict} />
      </div>

      {/* Underworld activity feed */}
      <div className="mb-2">
        <ActivityFeedPanel districtFilter={currentDistrict} maxItems={10} />
      </div>
    </>
  );
}
