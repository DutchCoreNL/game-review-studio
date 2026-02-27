import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ========== GAME CONSTANTS (duplicated server-side) ==========

const GOODS = [
  { id: "drugs", name: "Synthetica", base: 200, faction: "cartel" },
  { id: "weapons", name: "Zware Wapens", base: 1100, faction: "bikers" },
  { id: "tech", name: "Zwarte Data", base: 900, faction: "syndicate" },
  { id: "luxury", name: "Geroofde Kunst", base: 2400, faction: null },
  { id: "meds", name: "Medische Voorraad", base: 600, faction: null },
];

const GEAR = [
  { id: "glock", type: "weapon", name: "Glock 19", cost: 3500, stats: { muscle: 2 } },
  { id: "shotgun", type: "weapon", name: "Afgekorte Shotgun", cost: 8000, stats: { muscle: 4 } },
  { id: "ak47", type: "weapon", name: "AK-47 Custom", cost: 18000, stats: { muscle: 6 } },
  { id: "sniper", type: "weapon", name: "Dragunov Sniper", cost: 35000, stats: { muscle: 8 } },
  { id: "cartel_blade", type: "weapon", name: "Cartel Machete", cost: 12000, stats: { muscle: 5, charm: 1 } },
  { id: "vest", type: "armor", name: "Kevlar Vest", cost: 5000, stats: { muscle: 1 } },
  { id: "suit", type: "armor", name: "Gepantserd Pak", cost: 15000, stats: { muscle: 2, charm: 3 } },
  { id: "skull_armor", type: "armor", name: "Skull Plate Armor", cost: 40000, stats: { muscle: 5 } },
  { id: "phone", type: "gadget", name: "Burner Phone", cost: 2000, stats: { brains: 2 } },
  { id: "laptop", type: "gadget", name: "Hacker Laptop", cost: 12000, stats: { brains: 5 } },
  { id: "implant", type: "gadget", name: "Neural Implant", cost: 50000, stats: { brains: 8, charm: 2 } },
];

const VEHICLES = [
  { id: "toyohata", cost: 0, storage: 5, speed: 1, armor: 0, charm: 1 },
  { id: "forgedyer", cost: 9500, storage: 30, speed: -1, armor: 3, charm: -1 },
  { id: "bavamotor", cost: 24000, storage: 12, speed: 4, armor: 1, charm: 3 },
  { id: "meridiolux", cost: 48000, storage: 15, speed: 2, armor: 2, charm: 8 },
  { id: "lupoghini", cost: 135000, storage: 8, speed: 7, armor: 1, charm: 12 },
  { id: "royaleryce", cost: 350000, storage: 20, speed: 3, armor: 5, charm: 20 },
];

const ENERGY_COSTS: Record<string, number> = {
  trade: 2,
  travel: 5,
  solo_op: 10,
  buy_gear: 0,
  buy_vehicle: 0,
  wash_money: 3,
  bribe: 5,
};

const NERVE_COSTS: Record<string, number> = {
  solo_op: 5,
  attack: 10,
};

// ========== HELPERS ==========

function getPlayerStat(stats: Record<string, number>, loadout: Record<string, string | null>, statId: string): number {
  let base = stats[statId] || 1;
  for (const slotGear of Object.values(loadout)) {
    if (!slotGear) continue;
    const gear = GEAR.find((g) => g.id === slotGear);
    if (gear?.stats && (gear.stats as any)[statId]) base += (gear.stats as any)[statId];
  }
  return base;
}

function getVehicleStorage(vehicleId: string): number {
  return VEHICLES.find((v) => v.id === vehicleId)?.storage || 5;
}

// ========== ACTION HANDLERS ==========

interface ActionResult {
  success: boolean;
  message: string;
  data?: Record<string, any>;
}

async function handleTrade(
  supabase: any,
  userId: string,
  playerState: any,
  payload: { goodId: string; mode: "buy" | "sell"; quantity: number }
): Promise<ActionResult> {
  const { goodId, mode, quantity } = payload;
  if (!goodId || !mode || !quantity || quantity <= 0) {
    return { success: false, message: "Ongeldige parameters." };
  }

  const good = GOODS.find((g) => g.id === goodId);
  if (!good) return { success: false, message: "Onbekend goed." };

  // Check energy
  if (playerState.energy < (ENERGY_COSTS.trade || 2)) {
    return { success: false, message: "Niet genoeg energy." };
  }

  // Check prison/hospital
  if (playerState.prison_until && new Date(playerState.prison_until) > new Date()) {
    return { success: false, message: "Je zit in de gevangenis." };
  }
  if (playerState.hospital_until && new Date(playerState.hospital_until) > new Date()) {
    return { success: false, message: "Je ligt in het ziekenhuis." };
  }
  if (playerState.hiding_until && new Date(playerState.hiding_until) > new Date()) {
    return { success: false, message: "Je bent ondergedoken." };
  }

  // Get current inventory for this good
  const { data: invRow } = await supabase
    .from("player_inventory")
    .select("*")
    .eq("user_id", userId)
    .eq("good_id", goodId)
    .maybeSingle();

  const currentQty = invRow?.quantity || 0;
  const currentAvgCost = invRow?.avg_cost || 0;

  // Calculate total inventory for storage check
  const { data: allInv } = await supabase
    .from("player_inventory")
    .select("quantity")
    .eq("user_id", userId);
  const totalInv = (allInv || []).reduce((sum: number, r: any) => sum + (r.quantity || 0), 0);
  const maxInv = getVehicleStorage(playerState.active_vehicle || "toyohata");

  // Simple price calculation (base price * random factor stored server-side)
  // For now, use base price with some variance
  const basePrice = good.base;
  const charm = getPlayerStat(playerState.stats || {}, playerState.loadout || {}, "charm");
  const charmBonus = charm * 0.02 + (playerState.rep || 0) / 5000;

  if (mode === "buy") {
    const spaceLeft = maxInv - totalInv;
    const maxBuy = Math.min(quantity, spaceLeft);
    if (maxBuy <= 0) return { success: false, message: "Kofferbak vol." };

    let buyPrice = basePrice;
    if (playerState.heat > 50) buyPrice = Math.floor(buyPrice * 1.2);

    const actualQty = Math.min(maxBuy, Math.floor(playerState.money / buyPrice));
    if (actualQty <= 0) return { success: false, message: "Te weinig kapitaal." };

    const totalCost = buyPrice * actualQty;
    const newQty = currentQty + actualQty;
    const newAvgCost = newQty > 0 ? Math.floor(((currentQty * currentAvgCost) + totalCost) / newQty) : buyPrice;

    // Update player money & energy
    await supabase
      .from("player_state")
      .update({
        money: playerState.money - totalCost,
        energy: playerState.energy - (ENERGY_COSTS.trade || 2),
        stats_total_spent: (playerState.stats_total_spent || 0) + totalCost,
        stats_trades_completed: (playerState.stats_trades_completed || 0) + actualQty,
        last_action_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Upsert inventory
    await supabase
      .from("player_inventory")
      .upsert(
        { user_id: userId, good_id: goodId, quantity: newQty, avg_cost: newAvgCost },
        { onConflict: "user_id,good_id" }
      );

    return {
      success: true,
      message: `${actualQty}x ${good.name} gekocht voor €${totalCost}`,
      data: { quantity: actualQty, totalCost, newMoney: playerState.money - totalCost },
    };
  } else {
    // SELL
    if (currentQty <= 0) return { success: false, message: "Niet op voorraad." };

    const actualQty = Math.min(quantity, currentQty);
    const sellPrice = Math.floor(basePrice * 0.85 * (1 + charmBonus));
    const totalRevenue = sellPrice * actualQty;
    const remainingQty = currentQty - actualQty;

    // Update money, rep, energy
    const repGain = Math.floor(2 * actualQty);
    await supabase
      .from("player_state")
      .update({
        money: playerState.money + totalRevenue,
        rep: (playerState.rep || 0) + repGain,
        energy: playerState.energy - (ENERGY_COSTS.trade || 2),
        stats_total_earned: (playerState.stats_total_earned || 0) + totalRevenue,
        stats_trades_completed: (playerState.stats_trades_completed || 0) + actualQty,
        last_action_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Update inventory
    if (remainingQty <= 0) {
      await supabase
        .from("player_inventory")
        .delete()
        .eq("user_id", userId)
        .eq("good_id", goodId);
    } else {
      await supabase
        .from("player_inventory")
        .update({ quantity: remainingQty })
        .eq("user_id", userId)
        .eq("good_id", goodId);
    }

    return {
      success: true,
      message: `${actualQty}x ${good.name} verkocht voor €${totalRevenue}`,
      data: { quantity: actualQty, totalRevenue, newMoney: playerState.money + totalRevenue },
    };
  }
}

async function handleTravel(
  supabase: any,
  userId: string,
  playerState: any,
  payload: { district: string }
): Promise<ActionResult> {
  const { district } = payload;
  const validDistricts = ["port", "crown", "iron", "low", "neon"];
  if (!validDistricts.includes(district)) return { success: false, message: "Ongeldig district." };
  if (playerState.loc === district) return { success: false, message: "Je bent hier al." };

  if (playerState.energy < (ENERGY_COSTS.travel || 5)) {
    return { success: false, message: "Niet genoeg energy." };
  }

  // Check cooldown
  if (playerState.travel_cooldown_until && new Date(playerState.travel_cooldown_until) > new Date()) {
    const remaining = Math.ceil((new Date(playerState.travel_cooldown_until).getTime() - Date.now()) / 1000);
    return { success: false, message: `Nog ${remaining}s cooldown.` };
  }

  // 30 second travel cooldown
  const cooldownUntil = new Date(Date.now() + 30 * 1000).toISOString();

  await supabase
    .from("player_state")
    .update({
      loc: district,
      energy: playerState.energy - (ENERGY_COSTS.travel || 5),
      travel_cooldown_until: cooldownUntil,
      last_action_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return {
    success: true,
    message: `Gereisd naar ${district}.`,
    data: { district, cooldownUntil },
  };
}

async function handleInitPlayer(
  supabase: any,
  userId: string
): Promise<ActionResult> {
  // Check if player already exists
  const { data: existing } = await supabase
    .from("player_state")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return { success: true, message: "Speler bestaat al.", data: { existing: true } };

  // Create new player state
  const { error } = await supabase
    .from("player_state")
    .insert({ user_id: userId });

  if (error) return { success: false, message: `Fout bij aanmaken: ${error.message}` };

  // Give starter vehicle
  await supabase
    .from("player_vehicles")
    .insert({ user_id: userId, vehicle_id: "toyohata", is_active: true });

  return { success: true, message: "Nieuwe speler aangemaakt!", data: { existing: false } };
}

async function handleGetState(
  supabase: any,
  userId: string
): Promise<ActionResult> {
  // Regenerate energy/nerve before returning
  const { data: ps } = await supabase
    .from("player_state")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!ps) return { success: false, message: "Speler niet gevonden." };

  // Energy regen: 1 energy per 5 minutes
  const now = Date.now();
  const energyRegenAt = new Date(ps.energy_regen_at).getTime();
  if (ps.energy < ps.max_energy && now > energyRegenAt) {
    const elapsed = Math.floor((now - energyRegenAt) / (5 * 60 * 1000));
    if (elapsed > 0) {
      const newEnergy = Math.min(ps.max_energy, ps.energy + elapsed);
      const nextRegen = new Date(energyRegenAt + elapsed * 5 * 60 * 1000).toISOString();
      await supabase
        .from("player_state")
        .update({ energy: newEnergy, energy_regen_at: nextRegen })
        .eq("user_id", userId);
      ps.energy = newEnergy;
    }
  }

  // Nerve regen: 1 nerve per 3 minutes
  const nerveRegenAt = new Date(ps.nerve_regen_at).getTime();
  if (ps.nerve < ps.max_nerve && now > nerveRegenAt) {
    const elapsed = Math.floor((now - nerveRegenAt) / (3 * 60 * 1000));
    if (elapsed > 0) {
      const newNerve = Math.min(ps.max_nerve, ps.nerve + elapsed);
      const nextRegen = new Date(nerveRegenAt + elapsed * 3 * 60 * 1000).toISOString();
      await supabase
        .from("player_state")
        .update({ nerve: newNerve, nerve_regen_at: nextRegen })
        .eq("user_id", userId);
      ps.nerve = newNerve;
    }
  }

  // Check prison/hospital release
  if (ps.prison_until && new Date(ps.prison_until) <= new Date()) {
    await supabase
      .from("player_state")
      .update({ prison_until: null, prison_reason: null })
      .eq("user_id", userId);
    ps.prison_until = null;
    ps.prison_reason = null;
  }
  if (ps.hospital_until && new Date(ps.hospital_until) <= new Date()) {
    await supabase
      .from("player_state")
      .update({ hospital_until: null, hp: ps.max_hp })
      .eq("user_id", userId);
    ps.hospital_until = null;
    ps.hp = ps.max_hp;
  }

  // Get related data
  const [invRes, gearRes, vehicleRes, districtRes, bizRes, crewRes, villaRes] = await Promise.all([
    supabase.from("player_inventory").select("*").eq("user_id", userId),
    supabase.from("player_gear").select("*").eq("user_id", userId),
    supabase.from("player_vehicles").select("*").eq("user_id", userId),
    supabase.from("player_districts").select("*").eq("user_id", userId),
    supabase.from("player_businesses").select("*").eq("user_id", userId),
    supabase.from("player_crew").select("*").eq("user_id", userId),
    supabase.from("player_villa").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  return {
    success: true,
    message: "State opgehaald.",
    data: {
      playerState: ps,
      inventory: invRes.data || [],
      gear: gearRes.data || [],
      vehicles: vehicleRes.data || [],
      districts: districtRes.data || [],
      businesses: bizRes.data || [],
      crew: crewRes.data || [],
      villa: villaRes.data || null,
    },
  };
}

// ========== MAIN HANDLER ==========

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Authenticate user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, message: "Niet ingelogd." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, message: "Ongeldige sessie." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, payload } = body;

    // Check if player is muted (block certain actions)
    if (["trade", "wash_money"].includes(action)) {
      const { data: mutes } = await supabase
        .from("player_sanctions")
        .select("id, expires_at")
        .eq("user_id", user.id)
        .eq("type", "mute")
        .eq("active", true)
        .limit(1);

      if (mutes && mutes.length > 0) {
        const mute = mutes[0];
        if (!mute.expires_at || new Date(mute.expires_at) > new Date()) {
          return new Response(JSON.stringify({ success: false, message: "Je account is gemute." }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    let result: ActionResult;

    // Get player state for actions that need it
    let playerState: any = null;
    if (action !== "init_player") {
      const { data: ps } = await supabase
        .from("player_state")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!ps && action !== "get_state") {
        return new Response(JSON.stringify({ success: false, message: "Speler niet gevonden. Maak eerst een account aan." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      playerState = ps;
    }

    switch (action) {
      case "init_player":
        result = await handleInitPlayer(supabase, user.id);
        break;
      case "get_state":
        result = await handleGetState(supabase, user.id);
        break;
      case "trade":
        result = await handleTrade(supabase, user.id, playerState, payload);
        break;
      case "travel":
        result = await handleTravel(supabase, user.id, playerState, payload);
        break;
      default:
        result = { success: false, message: `Onbekende actie: ${action}` };
    }

    // Log action
    if (action !== "get_state") {
      await supabase
        .from("game_action_log")
        .insert({
          user_id: user.id,
          action_type: action,
          action_data: payload || {},
          result_data: { success: result.success, message: result.message },
        });
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: `Server fout: ${err.message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
