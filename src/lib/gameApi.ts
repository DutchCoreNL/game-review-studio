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
  | "gang_war_attack" | "gang_chat" | "get_gang_invites" | "list_gangs"
  | "contribute_influence" | "get_district_info"
  | "get_market_prices"
  | "place_bounty" | "get_most_wanted"
  | "district_leaderboard"
  | "pvp_combat_start" | "pvp_combat_action";

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

  // Cloud saves
  saveState: (saveData: any, day: number) => invokeGameAction("save_state", { saveData, day }),
  loadState: () => invokeGameAction("load_state"),
};
