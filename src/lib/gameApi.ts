import { supabase } from "@/integrations/supabase/client";

export type GameAction = "init_player" | "get_state" | "trade" | "travel";

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

// Convenience wrappers
export const gameApi = {
  initPlayer: () => invokeGameAction("init_player"),
  getState: () => invokeGameAction("get_state"),
  trade: (goodId: string, mode: "buy" | "sell", quantity: number) =>
    invokeGameAction("trade", { goodId, mode, quantity }),
  travel: (district: string) =>
    invokeGameAction("travel", { district }),
};
