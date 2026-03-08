import { DistrictId } from '@/game/types';
import { ActivityFeedPanel } from '../mmo/ActivityFeedPanel';
import { OnlinePlayersIndicator } from '../mmo/OnlinePlayersIndicator';
import { WorldRaidPanel } from '../mmo/WorldRaidPanel';
import { SmuggleRoutesPanel } from '../mmo/SmuggleRoutesPanel';
import { ReputationEchoIndicator } from '../mmo/ReputationEchoIndicator';
import { BountyHunterLeaderboard } from '../mmo/BountyHunterLeaderboard';
import { SeasonEventPanel } from '../mmo/SeasonEventPanel';
import { DuelArenaPanel } from '../mmo/DuelArenaPanel';
import { MarketAlertPanel } from '../mmo/MarketAlertPanel';

interface MapMMOPanelsProps {
  currentDistrict: DistrictId;
}

export function MapMMOPanels({ currentDistrict }: MapMMOPanelsProps) {
  return (
    <>
      {/* Online Players + Rep Echo */}
      <div className="mb-2 flex items-center justify-between">
        <OnlinePlayersIndicator currentDistrict={currentDistrict} compact />
        <ReputationEchoIndicator currentDistrict={currentDistrict} compact />
      </div>

      {/* Season Events */}
      <div className="mb-2">
        <SeasonEventPanel />
      </div>

      {/* World Raids */}
      <div className="mb-2">
        <WorldRaidPanel />
      </div>

      {/* Duel Arena */}
      <div className="mb-2">
        <DuelArenaPanel currentDistrict={currentDistrict} />
      </div>

      {/* Bounty Hunter Leaderboard */}
      <div className="mb-2">
        <BountyHunterLeaderboard />
      </div>

      {/* Smuggle Routes */}
      <div className="mb-2">
        <SmuggleRoutesPanel currentDistrict={currentDistrict} />
      </div>

      {/* Market Alerts */}
      <div className="mb-2">
        <MarketAlertPanel />
      </div>

      {/* Activity Feed */}
      <div className="mb-2">
        <ActivityFeedPanel districtFilter={currentDistrict} maxItems={10} />
      </div>
    </>
  );
}
