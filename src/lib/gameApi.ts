import { supabase } from "@/integrations/supabase/client";

export type GameAction =
  | "init_player" | "get_state"
  | "trade" | "travel"
  | "solo_op"
  | "buy_gear" | "equip_gear" | "unequip_gear"
  | "buy_vehicle" | "switch_vehicle"
  | "wash_money" | "bribe_police" | "buy_business";

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
};
