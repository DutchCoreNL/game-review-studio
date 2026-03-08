import React from 'react';
import { MapView } from './MapView';
import { TradeView } from './TradeView';
import { ProfileView } from './ProfileView';
import { ImperiumView } from './ImperiumView';
import { OperationsView } from './OperationsView';

// Lazy-loaded standalone views
const AdminPanelView = React.lazy(() => import('./AdminPanel').then(m => ({ default: m.AdminPanel })));
const CasinoView = React.lazy(() => import('./CasinoView').then(m => ({ default: m.CasinoView })));
const SafehouseView = React.lazy(() => import('./SafehouseView').then(m => ({ default: m.SafehouseView })));
const VillaView = React.lazy(() => import('./villa/VillaView').then(m => ({ default: m.VillaView })));
const HospitalView = React.lazy(() => import('./HospitalView').then(m => ({ default: m.HospitalView })));
const ChopShopView = React.lazy(() => import('./ChopShopView').then(m => ({ default: m.ChopShopView })));
const GarageView = React.lazy(() => import('./garage/GarageView').then(m => ({ default: m.GarageView })));
const GangView = React.lazy(() => import('./GangView').then(m => ({ default: m.GangView })));
const HeistView = React.lazy(() => import('./heist/HeistView').then(m => ({ default: m.HeistView })));
const BountyBoardPanel = React.lazy(() => import('./bounty/BountyBoardPanel').then(m => ({ default: m.BountyBoardPanel })));
const DailyChallengesView = React.lazy(() => import('./DailyChallengesView').then(m => ({ default: m.DailyChallengesView })));
const HitsView = React.lazy(() => import('./HitsView').then(m => ({ default: m.HitsView })));
const MostWantedView = React.lazy(() => import('./MostWantedView').then(m => ({ default: m.MostWantedView })));
const PvPAttackView = React.lazy(() => import('./PvPAttackView').then(m => ({ default: m.PvPAttackView })));
const CorruptionView = React.lazy(() => import('./CorruptionView').then(m => ({ default: m.CorruptionView })));
const MessagesView = React.lazy(() => import('./MessagesView').then(m => ({ default: m.MessagesView })));
const LeaderboardView = React.lazy(() => import('./LeaderboardView').then(m => ({ default: m.LeaderboardView })));

// Lazy trade sub-panels
const MarketPanel = React.lazy(() => import('./trade/MarketPanel').then(m => ({ default: m.MarketPanel })));
const MarketAnalysisPanel = React.lazy(() => import('./trade/MarketAnalysisPanel').then(m => ({ default: m.MarketAnalysisPanel })));
const AuctionPanel = React.lazy(() => import('./trade/AuctionPanel').then(m => ({ default: m.AuctionPanel })));
const StockMarketPanel = React.lazy(() => import('./trade/StockMarketPanel').then(m => ({ default: m.StockMarketPanel })));
const LaunderingPanel = React.lazy(() => import('./trade/LaunderingPanel').then(m => ({ default: m.LaunderingPanel })));
const GearPanel = React.lazy(() => import('./trade/GearPanel').then(m => ({ default: m.GearPanel })));

// Lazy imperium sub-panels  
const DistrictDefensePanel = React.lazy(() => import('./imperium/DistrictDefensePanel').then(m => ({ default: m.DistrictDefensePanel })));
const DistrictLeaderboardPanel = React.lazy(() => import('./imperium/DistrictLeaderboardPanel').then(m => ({ default: m.DistrictLeaderboardPanel })));
const BusinessPanel = React.lazy(() => import('./imperium/BusinessPanel').then(m => ({ default: m.BusinessPanel })));
const FamiliesPanel = React.lazy(() => import('./imperium/FamiliesPanel').then(m => ({ default: m.FamiliesPanel })));

// Lazy ops sub-panels
const ContractsPanel = React.lazy(() => import('./ops/ContractsPanel').then(m => ({ default: m.ContractsPanel })));
const CrewPanel = React.lazy(() => import('./ops/CrewPanel').then(m => ({ default: m.CrewPanel })));

// Lazy profile sub-panels
const SkillTreePanel = React.lazy(() => import('./profile/SkillTreePanel').then(m => ({ default: m.SkillTreePanel })));
const NpcRelationsPanel = React.lazy(() => import('./profile/NpcRelationsPanel').then(m => ({ default: m.NpcRelationsPanel })));
const StoryArcsPanel = React.lazy(() => import('./profile/StoryArcsPanel').then(m => ({ default: m.StoryArcsPanel })));
const ReputationLeaderboard = React.lazy(() => import('./profile/ReputationLeaderboard').then(m => ({ default: m.ReputationLeaderboard })));
const DrugEmpireStatsPanel = React.lazy(() => import('./profile/DrugEmpireStatsPanel').then(m => ({ default: m.DrugEmpireStatsPanel })));
const AudioSettingsPanel = React.lazy(() => import('./profile/AudioSettingsPanel').then(m => ({ default: m.AudioSettingsPanel })));
const LoadoutPanel = React.lazy(() => import('./profile/LoadoutPanel').then(m => ({ default: m.LoadoutPanel })));
const TrophiesPanel = React.lazy(() => import('./profile/TrophiesPanel').then(m => ({ default: m.TrophiesPanel })));
const EducationView = React.lazy(() => import('./EducationView').then(m => ({ default: m.EducationView })));
const GymViewLazy = React.lazy(() => import('./GymView').then(m => ({ default: m.GymView })));
const JobsViewLazy = React.lazy(() => import('./JobsView').then(m => ({ default: m.JobsView })));
const PropertiesView = React.lazy(() => import('./PropertiesView').then(m => ({ default: m.PropertiesView })));
const TravelViewLazy = React.lazy(() => import('./TravelView').then(m => ({ default: m.TravelView })));
const ChatViewLazy = React.lazy(() => import('./ChatView').then(m => ({ default: m.ChatView })));
const OCViewLazy = React.lazy(() => import('./OrganizedCrimesView').then(m => ({ default: m.OrganizedCrimesView })));

const MeritPointsViewLazy = React.lazy(() => import('./MeritPointsView').then(m => ({ default: m.MeritPointsView })));
const WarViewLazy = React.lazy(() => import('./WarView').then(m => ({ default: m.WarView })));
const WeaponInventoryLazy = React.lazy(() => import('./weapons/WeaponInventory').then(m => ({ default: m.WeaponInventory })));
const CampaignViewLazy = React.lazy(() => import('./campaign/CampaignView').then(m => ({ default: m.CampaignView })));
const CodexViewLazy = React.lazy(() => import('./codex/CodexView').then(m => ({ default: m.CodexView })));
const ArmorInventoryLazy = React.lazy(() => import('./gear/GearInventory').then(m => {
  function ArmorWrapper() { return m.GearInventory({ gearType: 'armor' }); }
  return { default: ArmorWrapper };
}));
const GadgetInventoryLazy = React.lazy(() => import('./gear/GearInventory').then(m => {
  function GadgetWrapper() { return m.GearInventory({ gearType: 'gadget' }); }
  return { default: GadgetWrapper };
}));
const BlackMarketViewLazy = React.lazy(() => import('./shop/BlackMarketView').then(m => ({ default: m.BlackMarketView })));
const SalvageViewLazy = React.lazy(() => import('./crafting/SalvageView').then(m => ({ default: m.SalvageView })));
const LootBoxViewLazy = React.lazy(() => import('./lootbox/LootBoxView').then(m => ({ default: m.LootBoxView })));
const DungeonViewLazy = React.lazy(() => import('./dungeon/DungeonView').then(m => ({ default: m.DungeonView })));

// View mapping — each sidebar entry maps to a component
export const views: Record<string, React.ComponentType> = {
  // Stad
  city: MapView,
  casino: CasinoView,
  hospital: HospitalView,
  safehouse: SafehouseView,
  villa: VillaView,
  chopshop: ChopShopView,
  // Acties
  ops: OperationsView,
  contracts: ContractsPanel,
  heists: HeistView,
  bounties: BountyBoardPanel,
  pvp: PvPAttackView,
  challenges: DailyChallengesView,
  hits: HitsView,
  wanted: MostWantedView,
  crew: CrewPanel,
  // Handel
  trade: TradeView,
  market: MarketPanel,
  analysis: MarketAnalysisPanel,
  auction: AuctionPanel,
  stocks: StockMarketPanel,
  launder: LaunderingPanel,
  gear: GearPanel,
  // Crew & Oorlog
  families: FamiliesPanel,
  gang: GangView,
  war: WarViewLazy,
  corruption: CorruptionView,
  // Imperium
  empire: ImperiumView,
  business: BusinessPanel,
  garage: GarageView,
  districts: DistrictLeaderboardPanel,
  // Profiel
  profile: ProfileView,
  skills: SkillTreePanel,
  loadout: LoadoutPanel,
  contacts: NpcRelationsPanel,
  reputation: ReputationLeaderboard,
  arcs: StoryArcsPanel,
  trophies: TrophiesPanel,
  leaderboard: LeaderboardView,
  messages: MessagesView,
  'imperium-stats': DrugEmpireStatsPanel,
  settings: AudioSettingsPanel,
  education: EducationView,
  gym: GymViewLazy,
  jobs: JobsViewLazy,
  properties: PropertiesView,
  travel: TravelViewLazy,
  chat: ChatViewLazy,
  'organized-crimes': OCViewLazy,
  merit: MeritPointsViewLazy,
  weapons: WeaponInventoryLazy,
  campaign: CampaignViewLazy,
  codex: CodexViewLazy,
  'armor-arsenal': ArmorInventoryLazy,
  'gadget-arsenal': GadgetInventoryLazy,
  'black-market': BlackMarketViewLazy,
  'salvage': SalvageViewLazy,
  'loot-boxes': LootBoxViewLazy,
  'raids': DungeonViewLazy,
  // Admin
  admin: AdminPanelView,
};

// Map view to music scene
export function getMusicScene(v: string): 'city' | 'trade' | 'ops' | 'empire' | 'profile' {
  if (['city', 'casino', 'hospital', 'safehouse', 'villa', 'chopshop', 'travel', 'chat'].includes(v)) return 'city';
  if (['ops', 'contracts', 'heists', 'bounties', 'pvp', 'challenges', 'hits', 'wanted', 'crew', 'campaign', 'raids'].includes(v)) return 'ops';
  if (['trade', 'market', 'analysis', 'auction', 'stocks', 'launder', 'gear', 'black-market', 'salvage', 'loot-boxes'].includes(v)) return 'trade';
  if (['families', 'gang', 'war', 'corruption', 'empire', 'business', 'garage', 'districts', 'education', 'properties', 'gym', 'jobs'].includes(v)) return 'empire';
  return 'profile';
}
