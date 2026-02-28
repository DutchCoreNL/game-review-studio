import { supabase } from "@/integrations/supabase/client";

export type GameAction =
  | "init_player" | "get_state" | "save_state" | "load_state"
  | "trade" | "travel"
  | "solo_op"
  | "buy_gear" | "equip_gear" | "unequip_gear"
  | "buy_vehicle" | "switch_vehicle"
  | "wash_money" | "bribe_police" | "buy_business"
  | "attack" | "list_players"
  | "get_public_profile"
  | "send_message" | "get_messages" | "read_message" | "delete_message"
  | "create_gang" | "get_gang" | "gang_invite" | "gang_accept_invite"
  | "gang_leave" | "gang_kick" | "gang_promote"
  | "gang_claim_territory" | "gang_donate" | "gang_declare_war"
  | "gang_war_attack" | "gang_chat" | "get_gang_invites" | "list_gangs" | "join_gang"
  | "contribute_influence" | "get_district_info"
  | "get_market_prices"
  | "place_bounty" | "get_most_wanted"
  | "district_leaderboard"
  | "pvp_combat_start" | "pvp_combat_action"
  | "casino_play"
  | "unlock_skill" | "get_skills" | "prestige" | "gain_xp"
  | "get_district_data"
  | "accept_contract"
  | "drop_contract"
  | "complete_contract"
  | "complete_hit"
  | "get_faction_state"
  | "attack_faction"
  | "faction_action"
  | "claim_event"
  | "bust_prison"
  | "revive_player"
  | "create_heist"
  | "join_heist"
  | "start_coop_heist"
  | "raid_safehouse"
  | "sabotage_lab"
  | "create_live_auction"
  | "bid_live_auction"
  | "claim_live_auction"
  | "get_live_auctions"
  | "start_gang_arc"
  | "resolve_gang_arc_step"
  | "get_gang_arcs"
  | "assign_nemesis"
  | "get_nemesis"
  | "resolve_nemesis"
  | "check_backstory_crossover"
  | "get_npc_mood"
  | "contribute_npc_mood"
  | "process_turn"
  | "attack_world_raid"
  | "get_world_raids"
  | "use_smuggle_route"
  | "create_smuggle_route"
  | "get_gang_alliances"
  | "propose_alliance"
  | "accept_alliance"
  | "break_alliance"
  | "heartbeat"
  | "get_player_titles"
  | "plant_mole"
  | "extract_mole"
  | "get_moles";

interface GameActionResult {
  success: boolean;
  message: string;
  data?: Record<string, any>;
}

export async function invokeGameAction(
  action: GameAction,
  payload?: Record<string, any>
): Promise<GameActionResult> {
  const { data, error } = await supabase.functions.invoke("game-action", {
    body: { action, payload },
  });

  if (error) {
    console.error("Game action error:", error);
    return { success: false, message: error.message || "Verbindingsfout." };
  }

  return data as GameActionResult;
}

export const gameApi = {
  initPlayer: () => invokeGameAction("init_player"),
  getState: () => invokeGameAction("get_state"),
  trade: (goodId: string, mode: "buy" | "sell", quantity: number) =>
    invokeGameAction("trade", { goodId, mode, quantity }),
  travel: (district: string) => invokeGameAction("travel", { district }),
  soloOp: (opId: string) => invokeGameAction("solo_op", { opId }),
  buyGear: (gearId: string) => invokeGameAction("buy_gear", { gearId }),
  equipGear: (gearId: string) => invokeGameAction("equip_gear", { gearId }),
  unequipGear: (slot: string) => invokeGameAction("unequip_gear", { slot }),
  buyVehicle: (vehicleId: string) => invokeGameAction("buy_vehicle", { vehicleId }),
  switchVehicle: (vehicleId: string) => invokeGameAction("switch_vehicle", { vehicleId }),
  washMoney: (amount: number) => invokeGameAction("wash_money", { amount }),
  bribePolice: () => invokeGameAction("bribe_police"),
  buyBusiness: (businessId: string) => invokeGameAction("buy_business", { businessId }),
  attack: (targetUserId: string) => invokeGameAction("attack", { targetUserId }),
  listPlayers: () => invokeGameAction("list_players"),
  getPublicProfile: (targetUserId: string) => invokeGameAction("get_public_profile", { targetUserId }),
  sendMessage: (targetUserId: string, subject: string, body: string) =>
    invokeGameAction("send_message", { targetUserId, subject, body }),
  getMessages: (folder: "inbox" | "sent" = "inbox", limit = 20) =>
    invokeGameAction("get_messages", { folder, limit }),
  readMessage: (messageId: string) => invokeGameAction("read_message", { messageId }),
  deleteMessage: (messageId: string) => invokeGameAction("delete_message", { messageId }),

  // Gang
  createGang: (name: string, tag: string, description?: string) =>
    invokeGameAction("create_gang", { name, tag, description }),
  getGang: (gangId?: string) => invokeGameAction("get_gang", { gangId }),
  gangInvite: (targetUserId: string) => invokeGameAction("gang_invite", { targetUserId }),
  gangAcceptInvite: (inviteId: string) => invokeGameAction("gang_accept_invite", { inviteId }),
  gangLeave: () => invokeGameAction("gang_leave"),
  gangKick: (targetUserId: string) => invokeGameAction("gang_kick", { targetUserId }),
  gangPromote: (targetUserId: string, newRole: string) => invokeGameAction("gang_promote", { targetUserId, newRole }),
  gangClaimTerritory: (districtId: string) => invokeGameAction("gang_claim_territory", { districtId }),
  gangDonate: (amount: number) => invokeGameAction("gang_donate", { amount }),
  gangDeclareWar: (targetGangId: string, districtId?: string) => invokeGameAction("gang_declare_war", { targetGangId, districtId }),
  gangWarAttack: (warId: string) => invokeGameAction("gang_war_attack", { warId }),
  gangChat: (message: string) => invokeGameAction("gang_chat", { message }),
  getGangInvites: () => invokeGameAction("get_gang_invites"),
  listGangs: () => invokeGameAction("list_gangs"),
  joinGang: (gangId: string) => invokeGameAction("join_gang", { gangId }),

  // District Influence
  contributeInfluence: (districtId: string, amount: number) =>
    invokeGameAction("contribute_influence", { districtId, amount }),
  getDistrictInfo: () => invokeGameAction("get_district_info"),

  // Market
  getMarketPrices: () => invokeGameAction("get_market_prices"),

  // Most Wanted / Bounties
  placeBounty: (targetUserId: string, amount: number) =>
    invokeGameAction("place_bounty", { targetUserId, amount }),
  getMostWanted: () => invokeGameAction("get_most_wanted"),
  getDistrictLeaderboard: () => invokeGameAction("district_leaderboard"),

  // PvP Combat (turn-based)
  pvpCombatStart: (targetUserId: string) => invokeGameAction("pvp_combat_start", { targetUserId }),
  pvpCombatAction: (sessionId: string, action: string, skillId?: string) =>
    invokeGameAction("pvp_combat_action", { sessionId, action, skillId }),

  // Casino (server-validated)
  casinoPlay: (game: string, bet: number, choice?: any) =>
    invokeGameAction("casino_play", { game, bet, choice }),

  // Cloud saves
  saveState: (saveData: any, day: number) => invokeGameAction("save_state", { saveData, day }),
  loadState: () => invokeGameAction("load_state"),

  // Skill Tree & Prestige
  unlockSkill: (skillId: string) => invokeGameAction("unlock_skill", { skillId }),
  getSkills: () => invokeGameAction("get_skills"),
  prestige: () => invokeGameAction("prestige"),
  gainXp: (amount: number, source: string) => invokeGameAction("gain_xp", { amount, source }),

  // District MMO data
  getDistrictData: () => invokeGameAction("get_district_data"),

  // Server-validated contract acceptance
  acceptContract: () => invokeGameAction("accept_contract"),
  dropContract: (contractId: number) => invokeGameAction("drop_contract", { contractId }),

  // Server-validated contract/hit completion
  completeContract: (contractId: number, contractType: string, successRate: number, encounterCount: number) =>
    invokeGameAction("complete_contract", { contractId, contractType, successRate, encounterCount }),
  completeHit: (hitId: string) =>
    invokeGameAction("complete_hit", { hitId }),

  // Faction MMO state
  getFactionState: () => invokeGameAction("get_faction_state"),
  attackFaction: (factionId: string, phase: string) =>
    invokeGameAction("attack_faction", { factionId, phase }),
  factionAction: (factionId: string, actionType: string) =>
    invokeGameAction("faction_action", { factionId, actionType }),

  // Claim a server-driven district event
  claimEvent: (eventId: string) => invokeGameAction("claim_event", { eventId }),

  // Jail busting & hospital revive
  bustPrison: (targetUserId: string) => invokeGameAction("bust_prison", { targetUserId }),
  revivePlayer: (targetUserId: string) => invokeGameAction("revive_player", { targetUserId }),

  // Co-op Heists
  createHeist: (heistId: string) => invokeGameAction("create_heist", { heistId }),
  joinHeist: (sessionId: string, role: string) => invokeGameAction("join_heist", { sessionId, role }),
  startCoopHeist: (sessionId: string) => invokeGameAction("start_coop_heist", { sessionId }),

  // Safehouse Raids PvP
  raidSafehouse: (targetUserId: string) => invokeGameAction("raid_safehouse", { targetUserId }),

  // Drug Empire PvP
  sabotageLab: (targetUserId: string) => invokeGameAction("sabotage_lab", { targetUserId }),

  // Live Auctions
  createLiveAuction: (itemType: string, itemId: string, startingPrice: number, quantity?: number) =>
    invokeGameAction("create_live_auction", { itemType, itemId, startingPrice, quantity: quantity || 1 }),
  bidLiveAuction: (auctionId: string, amount: number) =>
    invokeGameAction("bid_live_auction", { auctionId, amount }),
  claimLiveAuction: (auctionId: string) =>
    invokeGameAction("claim_live_auction", { auctionId }),
  getLiveAuctions: () => invokeGameAction("get_live_auctions"),

  // Gang Story Arcs (MMO)
  startGangArc: (arcId: string) => invokeGameAction("start_gang_arc", { arcId }),
  resolveGangArcStep: (gangArcId: string, choiceId: string) =>
    invokeGameAction("resolve_gang_arc_step", { gangArcId, choiceId }),
  getGangArcs: () => invokeGameAction("get_gang_arcs"),

  // Nemesis System (MMO)
  assignNemesis: () => invokeGameAction("assign_nemesis"),
  getNemesis: () => invokeGameAction("get_nemesis"),
  resolveNemesis: (nemesisId: string, action: 'execute' | 'banish' | 'recruit') =>
    invokeGameAction("resolve_nemesis", { nemesisId, action }),

  // Backstory Crossovers (MMO)
  checkBackstoryCrossover: () => invokeGameAction("check_backstory_crossover"),

  // NPC Collective Mood (MMO)
  getNpcMood: (districtId?: string) => invokeGameAction("get_npc_mood", { districtId }),
  contributeNpcMood: (npcId: string, change: number) =>
    invokeGameAction("contribute_npc_mood", { npcId, change }),

  // Server-side turn processing (MMO)
  processTurn: () => supabase.functions.invoke('process-turn', { body: { mode: 'single' } })
    .then(res => res.data ? { success: res.data.success, message: res.data.message, data: res.data.data } : { success: false, message: 'Server error' })
    .catch(err => ({ success: false, message: err.message })),

  // World Raids
  attackWorldRaid: (raidId: string) => invokeGameAction("attack_world_raid", { raidId }),
  getWorldRaids: () => invokeGameAction("get_world_raids"),

  // Smuggle Routes
  useSmuggleRoute: (routeId: string, quantity: number) => invokeGameAction("use_smuggle_route", { routeId, quantity }),
  createSmuggleRoute: (fromDistrict: string, toDistrict: string, goodId: string) =>
    invokeGameAction("create_smuggle_route", { fromDistrict, toDistrict, goodId }),

  // Gang Alliances
  getGangAlliances: () => invokeGameAction("get_gang_alliances"),
  proposeAlliance: (targetGangId: string) => invokeGameAction("propose_alliance", { targetGangId }),
  acceptAlliance: (allianceId: string) => invokeGameAction("accept_alliance", { allianceId }),
  breakAlliance: (allianceId: string) => invokeGameAction("break_alliance", { allianceId }),

  // Player Titles
  getPlayerTitles: (userId?: string) => invokeGameAction("get_player_titles", { userId }),

  // Heartbeat
  heartbeat: () => invokeGameAction("heartbeat"),

  // Informant & Mol Systeem
  plantMole: (targetGangId: string) => invokeGameAction("plant_mole", { targetGangId }),
  extractMole: (moleId: string) => invokeGameAction("extract_mole", { moleId }),
  getMoles: () => invokeGameAction("get_moles"),
};
