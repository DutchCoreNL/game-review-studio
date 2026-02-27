import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ========== GAME CONSTANTS ==========

const GOODS = [
  { id: "drugs", name: "Synthetica", base: 200, faction: "cartel" },
  { id: "weapons", name: "Zware Wapens", base: 1100, faction: "bikers" },
  { id: "tech", name: "Zwarte Data", base: 900, faction: "syndicate" },
  { id: "luxury", name: "Geroofde Kunst", base: 2400, faction: null },
  { id: "meds", name: "Medische Voorraad", base: 600, faction: null },
];

const GEAR: { id: string; type: string; name: string; cost: number; stats: Record<string, number>; reqRep?: { f: string; val: number } | null }[] = [
  { id: "glock", type: "weapon", name: "Glock 19", cost: 3500, stats: { muscle: 2 }, reqRep: null },
  { id: "shotgun", type: "weapon", name: "Afgekorte Shotgun", cost: 8000, stats: { muscle: 4 }, reqRep: null },
  { id: "ak47", type: "weapon", name: "AK-47 Custom", cost: 18000, stats: { muscle: 6 }, reqRep: { f: "bikers", val: 30 } },
  { id: "sniper", type: "weapon", name: "Dragunov Sniper", cost: 35000, stats: { muscle: 8 }, reqRep: { f: "syndicate", val: 50 } },
  { id: "cartel_blade", type: "weapon", name: "Cartel Machete", cost: 12000, stats: { muscle: 5, charm: 1 }, reqRep: { f: "cartel", val: 30 } },
  { id: "vest", type: "armor", name: "Kevlar Vest", cost: 5000, stats: { muscle: 1 }, reqRep: null },
  { id: "suit", type: "armor", name: "Gepantserd Pak", cost: 15000, stats: { muscle: 2, charm: 3 }, reqRep: null },
  { id: "skull_armor", type: "armor", name: "Skull Plate Armor", cost: 40000, stats: { muscle: 5 }, reqRep: { f: "bikers", val: 60 } },
  { id: "phone", type: "gadget", name: "Burner Phone", cost: 2000, stats: { brains: 2 }, reqRep: null },
  { id: "laptop", type: "gadget", name: "Hacker Laptop", cost: 12000, stats: { brains: 5 }, reqRep: null },
  { id: "implant", type: "gadget", name: "Neural Implant", cost: 50000, stats: { brains: 8, charm: 2 }, reqRep: { f: "syndicate", val: 70 } },
];

const VEHICLES = [
  { id: "toyohata", name: "Toyo-Hata Swift", cost: 0, storage: 5, speed: 1, armor: 0, charm: 1 },
  { id: "forgedyer", name: "Forge-Dyer Heavy", cost: 9500, storage: 30, speed: -1, armor: 3, charm: -1 },
  { id: "bavamotor", name: "Bava-Motor Shadow", cost: 24000, storage: 12, speed: 4, armor: 1, charm: 3 },
  { id: "meridiolux", name: "Meridio-Lux Baron", cost: 48000, storage: 15, speed: 2, armor: 2, charm: 8 },
  { id: "lupoghini", name: "Lupo-Ghini Strike", cost: 135000, storage: 8, speed: 7, armor: 1, charm: 12 },
  { id: "royaleryce", name: "Royale-Ryce Eternal", cost: 350000, storage: 20, speed: 3, armor: 5, charm: 20 },
];

const SOLO_OPERATIONS = [
  { id: "pickpocket", name: "Zakkenrollen", level: 1, stat: "charm", risk: 15, heat: 5, reward: 300 },
  { id: "atm_skimming", name: "ATM Skimming", level: 3, stat: "brains", risk: 25, heat: 10, reward: 1200 },
  { id: "car_theft", name: "Auto Diefstal", level: 5, stat: "brains", risk: 40, heat: 20, reward: 2500 },
  { id: "store_robbery", name: "Juwelier Overval", level: 7, stat: "muscle", risk: 55, heat: 35, reward: 5000 },
  { id: "crypto_heist", name: "Crypto Heist", level: 10, stat: "brains", risk: 70, heat: 15, reward: 12000 },
];

const BUSINESSES = [
  { id: "stripclub", name: "Stripclub", cost: 20000, income: 800, clean: 500, reqDistrict: "neon", reqRep: 0, reqDay: 0, reqBusinessCount: 0 },
  { id: "wasstraat", name: "Wasstraat", cost: 15000, income: 500, clean: 1500, reqDistrict: undefined, reqRep: 0, reqDay: 0, reqBusinessCount: 0 },
  { id: "restaurant", name: "Restaurant", cost: 35000, income: 1200, clean: 2000, reqDistrict: "crown", reqRep: 50, reqDay: 0, reqBusinessCount: 1 },
  { id: "autodealer", name: "Autodealer", cost: 60000, income: 2000, clean: 3000, reqDistrict: "iron", reqRep: 100, reqDay: 10, reqBusinessCount: 2 },
  { id: "casino_biz", name: "Casino", cost: 150000, income: 5000, clean: 5000, reqDistrict: "neon", reqRep: 200, reqDay: 20, reqBusinessCount: 3 },
];

const ENERGY_COSTS: Record<string, number> = {
  trade: 2, travel: 5, solo_op: 10, buy_gear: 0, buy_vehicle: 0, wash_money: 3, bribe: 5, attack: 15,
};
const NERVE_COSTS: Record<string, number> = {
  solo_op: 5, attack: 10,
};

const ATTACK_COOLDOWN_SECONDS = 300; // 5 minutes
const HOSPITAL_SECONDS = 600; // 10 minutes base

// ========== HELPERS ==========

function getPlayerStat(stats: Record<string, number>, loadout: Record<string, string | null>, statId: string): number {
  let base = stats[statId] || 1;
  for (const slotGear of Object.values(loadout)) {
    if (!slotGear) continue;
    const gear = GEAR.find((g) => g.id === slotGear);
    if (gear?.stats?.[statId]) base += gear.stats[statId];
  }
  return base;
}

function getVehicleStorage(vehicleId: string): number {
  return VEHICLES.find((v) => v.id === vehicleId)?.storage || 5;
}

function checkBlocked(ps: any): string | null {
  if (ps.prison_until && new Date(ps.prison_until) > new Date()) return "Je zit in de gevangenis.";
  if (ps.hospital_until && new Date(ps.hospital_until) > new Date()) return "Je ligt in het ziekenhuis.";
  if (ps.hiding_until && new Date(ps.hiding_until) > new Date()) return "Je bent ondergedoken.";
  return null;
}

function checkEnergy(ps: any, action: string): string | null {
  const cost = ENERGY_COSTS[action] || 0;
  if (cost > 0 && ps.energy < cost) return `Niet genoeg energy (nodig: ${cost}, heb: ${ps.energy}).`;
  return null;
}

function checkNerve(ps: any, action: string): string | null {
  const cost = NERVE_COSTS[action] || 0;
  if (cost > 0 && ps.nerve < cost) return `Niet genoeg nerve (nodig: ${cost}, heb: ${ps.nerve}).`;
  return null;
}

// ========== ACTION RESULT TYPE ==========

interface ActionResult {
  success: boolean;
  message: string;
  data?: Record<string, any>;
}

// ========== TRADE ==========

async function handleTrade(supabase: any, userId: string, ps: any, payload: { goodId: string; mode: "buy" | "sell"; quantity: number }): Promise<ActionResult> {
  const { goodId, mode, quantity } = payload;
  if (!goodId || !mode || !quantity || quantity <= 0) return { success: false, message: "Ongeldige parameters." };

  const good = GOODS.find((g) => g.id === goodId);
  if (!good) return { success: false, message: "Onbekend goed." };

  let blocked = checkBlocked(ps); if (blocked) return { success: false, message: blocked };
  let energyErr = checkEnergy(ps, "trade"); if (energyErr) return { success: false, message: energyErr };

  const { data: invRow } = await supabase.from("player_inventory").select("*").eq("user_id", userId).eq("good_id", goodId).maybeSingle();
  const currentQty = invRow?.quantity || 0;
  const currentAvgCost = invRow?.avg_cost || 0;

  // Get active vehicle for storage
  const { data: activeVeh } = await supabase.from("player_vehicles").select("vehicle_id").eq("user_id", userId).eq("is_active", true).maybeSingle();
  const maxInv = getVehicleStorage(activeVeh?.vehicle_id || "toyohata");

  const { data: allInv } = await supabase.from("player_inventory").select("quantity").eq("user_id", userId);
  const totalInv = (allInv || []).reduce((sum: number, r: any) => sum + (r.quantity || 0), 0);

  const basePrice = good.base;
  const charm = getPlayerStat(ps.stats || {}, ps.loadout || {}, "charm");
  const charmBonus = charm * 0.02 + (ps.rep || 0) / 5000;
  const energyCost = ENERGY_COSTS.trade || 2;

  if (mode === "buy") {
    const spaceLeft = maxInv - totalInv;
    const maxBuy = Math.min(quantity, spaceLeft);
    if (maxBuy <= 0) return { success: false, message: "Kofferbak vol." };

    let buyPrice = basePrice;
    if (ps.heat > 50) buyPrice = Math.floor(buyPrice * 1.2);

    const actualQty = Math.min(maxBuy, Math.floor(ps.money / buyPrice));
    if (actualQty <= 0) return { success: false, message: "Te weinig kapitaal." };

    const totalCost = buyPrice * actualQty;
    const newQty = currentQty + actualQty;
    const newAvgCost = newQty > 0 ? Math.floor(((currentQty * currentAvgCost) + totalCost) / newQty) : buyPrice;

    await supabase.from("player_state").update({
      money: ps.money - totalCost, energy: ps.energy - energyCost,
      stats_total_spent: (ps.stats_total_spent || 0) + totalCost,
      stats_trades_completed: (ps.stats_trades_completed || 0) + actualQty,
      last_action_at: new Date().toISOString(),
    }).eq("user_id", userId);

    await supabase.from("player_inventory").upsert(
      { user_id: userId, good_id: goodId, quantity: newQty, avg_cost: newAvgCost },
      { onConflict: "user_id,good_id" }
    );

    return { success: true, message: `${actualQty}x ${good.name} gekocht voor €${totalCost}`, data: { quantity: actualQty, totalCost, newMoney: ps.money - totalCost } };
  } else {
    if (currentQty <= 0) return { success: false, message: "Niet op voorraad." };
    const actualQty = Math.min(quantity, currentQty);
    const sellPrice = Math.floor(basePrice * 0.85 * (1 + charmBonus));
    const totalRevenue = sellPrice * actualQty;
    const remainingQty = currentQty - actualQty;
    const repGain = Math.floor(2 * actualQty);

    await supabase.from("player_state").update({
      money: ps.money + totalRevenue, rep: (ps.rep || 0) + repGain,
      energy: ps.energy - energyCost,
      stats_total_earned: (ps.stats_total_earned || 0) + totalRevenue,
      stats_trades_completed: (ps.stats_trades_completed || 0) + actualQty,
      last_action_at: new Date().toISOString(),
    }).eq("user_id", userId);

    if (remainingQty <= 0) {
      await supabase.from("player_inventory").delete().eq("user_id", userId).eq("good_id", goodId);
    } else {
      await supabase.from("player_inventory").update({ quantity: remainingQty }).eq("user_id", userId).eq("good_id", goodId);
    }

    return { success: true, message: `${actualQty}x ${good.name} verkocht voor €${totalRevenue}`, data: { quantity: actualQty, totalRevenue, newMoney: ps.money + totalRevenue } };
  }
}

// ========== TRAVEL ==========

async function handleTravel(supabase: any, userId: string, ps: any, payload: { district: string }): Promise<ActionResult> {
  const { district } = payload;
  const validDistricts = ["port", "crown", "iron", "low", "neon"];
  if (!validDistricts.includes(district)) return { success: false, message: "Ongeldig district." };
  if (ps.loc === district) return { success: false, message: "Je bent hier al." };

  let blocked = checkBlocked(ps); if (blocked) return { success: false, message: blocked };
  let energyErr = checkEnergy(ps, "travel"); if (energyErr) return { success: false, message: energyErr };

  if (ps.travel_cooldown_until && new Date(ps.travel_cooldown_until) > new Date()) {
    const remaining = Math.ceil((new Date(ps.travel_cooldown_until).getTime() - Date.now()) / 1000);
    return { success: false, message: `Nog ${remaining}s cooldown.` };
  }

  const cooldownUntil = new Date(Date.now() + 30 * 1000).toISOString();
  await supabase.from("player_state").update({
    loc: district, energy: ps.energy - (ENERGY_COSTS.travel || 5),
    travel_cooldown_until: cooldownUntil, last_action_at: new Date().toISOString(),
  }).eq("user_id", userId);

  return { success: true, message: `Gereisd naar ${district}.`, data: { district, cooldownUntil } };
}

// ========== SOLO OP ==========

async function handleSoloOp(supabase: any, userId: string, ps: any, payload: { opId: string }): Promise<ActionResult> {
  const { opId } = payload;
  if (!opId) return { success: false, message: "Geen operatie opgegeven." };

  const op = SOLO_OPERATIONS.find((o) => o.id === opId);
  if (!op) return { success: false, message: "Onbekende operatie." };

  let blocked = checkBlocked(ps); if (blocked) return { success: false, message: blocked };
  let energyErr = checkEnergy(ps, "solo_op"); if (energyErr) return { success: false, message: energyErr };
  let nerveErr = checkNerve(ps, "solo_op"); if (nerveErr) return { success: false, message: nerveErr };

  if (ps.level < op.level) return { success: false, message: `Je hebt level ${op.level} nodig (heb: ${ps.level}).` };

  // Check crime cooldown
  if (ps.crime_cooldown_until && new Date(ps.crime_cooldown_until) > new Date()) {
    const remaining = Math.ceil((new Date(ps.crime_cooldown_until).getTime() - Date.now()) / 1000);
    return { success: false, message: `Crime cooldown: nog ${remaining}s.` };
  }

  const statVal = getPlayerStat(ps.stats || {}, ps.loadout || {}, op.stat);

  // Check if player owns Lowrise for risk reduction
  const { data: ownedDistricts } = await supabase.from("player_districts").select("district_id").eq("user_id", userId);
  const ownsLowrise = (ownedDistricts || []).some((d: any) => d.district_id === "low");
  const effectiveRisk = ownsLowrise ? Math.floor(op.risk * 0.7) : op.risk;

  const chance = Math.min(95, 100 - effectiveRisk + statVal * 5);
  const scaledReward = Math.floor(op.reward * Math.min(3, 1 + ps.level * 0.1));
  const roll = Math.random() * 100;
  const success = roll < chance;

  const energyCost = ENERGY_COSTS.solo_op || 10;
  const nerveCost = NERVE_COSTS.solo_op || 5;
  const crimeCooldown = new Date(Date.now() + 60 * 1000).toISOString(); // 60s cooldown

  if (success) {
    const heatGain = Math.min(100, (ps.heat || 0) + op.heat) - (ps.heat || 0);
    const repGain = 10;

    await supabase.from("player_state").update({
      dirty_money: (ps.dirty_money || 0) + scaledReward,
      heat: Math.min(100, (ps.heat || 0) + op.heat),
      personal_heat: Math.min(100, (ps.personal_heat || 0) + Math.floor(op.heat * 0.4)),
      rep: (ps.rep || 0) + repGain,
      energy: ps.energy - energyCost,
      nerve: ps.nerve - nerveCost,
      crime_cooldown_until: crimeCooldown,
      stats_total_earned: (ps.stats_total_earned || 0) + scaledReward,
      stats_missions_completed: (ps.stats_missions_completed || 0) + 1,
      xp: ps.xp + 15,
      last_action_at: new Date().toISOString(),
    }).eq("user_id", userId);

    return {
      success: true,
      message: `${op.name} geslaagd! +€${scaledReward.toLocaleString()} zwart geld.`,
      data: { reward: scaledReward, heatGain, repGain, chance: Math.round(chance), crimeCooldown },
    };
  } else {
    const failHeat = Math.floor(op.heat * 1.5);
    const nearMissDiff = Math.round(chance);
    const statLabel = op.stat === "muscle" ? "Kracht" : op.stat === "brains" ? "Vernuft" : "Charisma";
    let nearMiss = `Slagingskans was ${nearMissDiff}%.`;
    if (nearMissDiff >= 60) nearMiss += ` Bijna! Upgrade je ${statLabel}.`;
    else if (nearMissDiff >= 40) nearMiss += ` Verbeter je ${statLabel}.`;
    else nearMiss += ` Meer training nodig.`;

    // Chance of arrest on failure
    const arrestChance = op.risk > 70 ? 0.3 : 0.15;
    let imprisoned = false;
    let prisonDays = 0;

    if (Math.random() < arrestChance) {
      prisonDays = Math.floor(Math.random() * 3) + 1;
      const prisonUntil = new Date(Date.now() + prisonDays * 60 * 60 * 1000).toISOString(); // hours as "days" for MMO pace
      imprisoned = true;

      await supabase.from("player_state").update({
        heat: Math.min(100, (ps.heat || 0) + failHeat),
        personal_heat: Math.min(100, (ps.personal_heat || 0) + Math.floor(failHeat * 0.3)),
        energy: ps.energy - energyCost,
        nerve: ps.nerve - nerveCost,
        crime_cooldown_until: crimeCooldown,
        stats_missions_failed: (ps.stats_missions_failed || 0) + 1,
        prison_until: prisonUntil,
        prison_reason: `Gearresteerd na mislukte ${op.name}.`,
        last_action_at: new Date().toISOString(),
      }).eq("user_id", userId);
    } else {
      await supabase.from("player_state").update({
        heat: Math.min(100, (ps.heat || 0) + failHeat),
        personal_heat: Math.min(100, (ps.personal_heat || 0) + Math.floor(failHeat * 0.3)),
        energy: ps.energy - energyCost,
        nerve: ps.nerve - nerveCost,
        crime_cooldown_until: crimeCooldown,
        stats_missions_failed: (ps.stats_missions_failed || 0) + 1,
        last_action_at: new Date().toISOString(),
      }).eq("user_id", userId);
    }

    return {
      success: false,
      message: imprisoned
        ? `${op.name} mislukt! Gearresteerd — ${prisonDays}u gevangenis.`
        : `${op.name} mislukt! Extra heat opgelopen.`,
      data: { nearMiss, chance: nearMissDiff, imprisoned, prisonDays, crimeCooldown },
    };
  }
}

// ========== BUY GEAR ==========

async function handleBuyGear(supabase: any, userId: string, ps: any, payload: { gearId: string }): Promise<ActionResult> {
  const { gearId } = payload;
  if (!gearId) return { success: false, message: "Geen gear opgegeven." };

  const item = GEAR.find((g) => g.id === gearId);
  if (!item) return { success: false, message: "Onbekend gear item." };

  // Check if already owned
  const { data: existing } = await supabase.from("player_gear").select("id").eq("user_id", userId).eq("gear_id", gearId).maybeSingle();
  if (existing) return { success: false, message: "Je hebt dit al." };

  // Price with heat surcharge
  let price = item.cost;
  if ((ps.heat || 0) > 50) price = Math.floor(price * 1.2);
  if (ps.money < price) return { success: false, message: `Te weinig geld (nodig: €${price.toLocaleString()}).` };

  // Check faction rep requirement
  if (item.reqRep) {
    // We'd need to check faction relations — simplified: check from player_state or a separate table
    // For now, skip faction check (can be added later when faction_relations table exists)
  }

  await supabase.from("player_state").update({
    money: ps.money - price,
    stats_total_spent: (ps.stats_total_spent || 0) + price,
    last_action_at: new Date().toISOString(),
  }).eq("user_id", userId);

  await supabase.from("player_gear").insert({ user_id: userId, gear_id: gearId });

  return {
    success: true,
    message: `${item.name} gekocht voor €${price.toLocaleString()}!`,
    data: { gearId, price, newMoney: ps.money - price },
  };
}

// ========== EQUIP / UNEQUIP GEAR ==========

async function handleEquipGear(supabase: any, userId: string, ps: any, payload: { gearId: string }): Promise<ActionResult> {
  const { gearId } = payload;
  const item = GEAR.find((g) => g.id === gearId);
  if (!item) return { success: false, message: "Onbekend gear item." };

  // Check ownership
  const { data: owned } = await supabase.from("player_gear").select("id").eq("user_id", userId).eq("gear_id", gearId).maybeSingle();
  if (!owned) return { success: false, message: "Je bezit dit niet." };

  const newLoadout = { ...(ps.loadout || {}) };
  newLoadout[item.type] = gearId;

  await supabase.from("player_state").update({ loadout: newLoadout, last_action_at: new Date().toISOString() }).eq("user_id", userId);

  return { success: true, message: `${item.name} uitgerust.`, data: { loadout: newLoadout } };
}

async function handleUnequipGear(supabase: any, userId: string, ps: any, payload: { slot: string }): Promise<ActionResult> {
  const { slot } = payload;
  if (!["weapon", "armor", "gadget"].includes(slot)) return { success: false, message: "Ongeldige slot." };

  const newLoadout = { ...(ps.loadout || {}) };
  newLoadout[slot] = null;

  await supabase.from("player_state").update({ loadout: newLoadout, last_action_at: new Date().toISOString() }).eq("user_id", userId);

  return { success: true, message: `${slot} verwijderd.`, data: { loadout: newLoadout } };
}

// ========== BUY VEHICLE ==========

async function handleBuyVehicle(supabase: any, userId: string, ps: any, payload: { vehicleId: string }): Promise<ActionResult> {
  const { vehicleId } = payload;
  if (!vehicleId) return { success: false, message: "Geen voertuig opgegeven." };

  const vehicle = VEHICLES.find((v) => v.id === vehicleId);
  if (!vehicle) return { success: false, message: "Onbekend voertuig." };

  // Check if already owned
  const { data: existing } = await supabase.from("player_vehicles").select("id").eq("user_id", userId).eq("vehicle_id", vehicleId).maybeSingle();
  if (existing) return { success: false, message: "Je hebt dit voertuig al." };

  if (ps.money < vehicle.cost) return { success: false, message: `Te weinig geld (nodig: €${vehicle.cost.toLocaleString()}).` };

  // Deactivate current active vehicle
  await supabase.from("player_vehicles").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);

  await supabase.from("player_state").update({
    money: ps.money - vehicle.cost,
    stats_total_spent: (ps.stats_total_spent || 0) + vehicle.cost,
    last_action_at: new Date().toISOString(),
  }).eq("user_id", userId);

  await supabase.from("player_vehicles").insert({ user_id: userId, vehicle_id: vehicleId, is_active: true });

  return {
    success: true,
    message: `${vehicle.name} gekocht voor €${vehicle.cost.toLocaleString()}!`,
    data: { vehicleId, cost: vehicle.cost, newMoney: ps.money - vehicle.cost, newStorage: vehicle.storage },
  };
}

// ========== SWITCH VEHICLE ==========

async function handleSwitchVehicle(supabase: any, userId: string, ps: any, payload: { vehicleId: string }): Promise<ActionResult> {
  const { vehicleId } = payload;
  const { data: owned } = await supabase.from("player_vehicles").select("id").eq("user_id", userId).eq("vehicle_id", vehicleId).maybeSingle();
  if (!owned) return { success: false, message: "Je bezit dit voertuig niet." };

  await supabase.from("player_vehicles").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);
  await supabase.from("player_vehicles").update({ is_active: true }).eq("user_id", userId).eq("vehicle_id", vehicleId);

  const vehicle = VEHICLES.find((v) => v.id === vehicleId);
  return { success: true, message: `Gewisseld naar ${vehicle?.name || vehicleId}.`, data: { vehicleId } };
}

// ========== WASH MONEY ==========

async function handleWashMoney(supabase: any, userId: string, ps: any, payload: { amount: number }): Promise<ActionResult> {
  const { amount } = payload;
  if (!amount || amount <= 0) return { success: false, message: "Ongeldig bedrag." };
  if ((ps.dirty_money || 0) <= 0) return { success: false, message: "Geen zwart geld." };

  let blocked = checkBlocked(ps); if (blocked) return { success: false, message: blocked };
  let energyErr = checkEnergy(ps, "wash_money"); if (energyErr) return { success: false, message: energyErr };

  // Calculate wash capacity
  const { data: ownedDistricts } = await supabase.from("player_districts").select("district_id").eq("user_id", userId);
  const numDistricts = (ownedDistricts || []).length;

  const { data: ownedBiz } = await supabase.from("player_businesses").select("business_id").eq("user_id", userId);
  let bizBonus = 0;
  for (const b of (ownedBiz || [])) {
    const biz = BUSINESSES.find((x) => x.id === b.business_id);
    if (biz) bizBonus += biz.clean;
  }

  const totalCap = 3000 + numDistricts * 1000 + bizBonus;
  const used = ps.wash_used_today || 0;
  const remaining = Math.max(0, totalCap - used);

  if (remaining <= 0) return { success: false, message: "Dagelijkse witwaslimiet bereikt." };

  const washAmt = Math.min(amount, Math.min(ps.dirty_money, remaining));
  if (washAmt <= 0) return { success: false, message: "Niets om te wassen." };

  // Neon district bonus
  const ownsNeon = (ownedDistricts || []).some((d: any) => d.district_id === "neon");
  let washedAmt = washAmt;
  if (ownsNeon) washedAmt = Math.floor(washAmt * 1.15);

  const cleanAmt = Math.floor(washedAmt * 0.85);
  const heatGain = Math.max(1, Math.floor(washAmt / 500));
  const xpGain = Math.max(1, Math.floor(washAmt / 200));

  await supabase.from("player_state").update({
    dirty_money: (ps.dirty_money || 0) - washAmt,
    money: ps.money + cleanAmt,
    wash_used_today: used + washAmt,
    heat: Math.min(100, (ps.heat || 0) + heatGain),
    personal_heat: Math.min(100, (ps.personal_heat || 0) + heatGain),
    energy: ps.energy - (ENERGY_COSTS.wash_money || 3),
    stats_total_earned: (ps.stats_total_earned || 0) + cleanAmt,
    xp: ps.xp + xpGain,
    last_action_at: new Date().toISOString(),
  }).eq("user_id", userId);

  const fee = washAmt - cleanAmt;
  return {
    success: true,
    message: `€${washAmt.toLocaleString()} witgewassen → €${cleanAmt.toLocaleString()} schoon geld (${ownsNeon ? "+15% Neon bonus, " : ""}15% fee: €${fee.toLocaleString()}).`,
    data: { washed: washAmt, clean: cleanAmt, fee, remaining: remaining - washAmt, totalCap },
  };
}

// ========== BRIBE POLICE ==========

async function handleBribePolice(supabase: any, userId: string, ps: any): Promise<ActionResult> {
  let blocked = checkBlocked(ps); if (blocked) return { success: false, message: blocked };
  let energyErr = checkEnergy(ps, "bribe"); if (energyErr) return { success: false, message: energyErr };

  const charm = getPlayerStat(ps.stats || {}, ps.loadout || {}, "charm");
  const cost = Math.max(1500, 4000 - charm * 150);

  if (ps.money < cost) return { success: false, message: `Te weinig geld (nodig: €${cost.toLocaleString()}).` };

  const newHeat = Math.max(0, (ps.heat || 0) - 10);
  const newPersonalHeat = Math.max(0, (ps.personal_heat || 0) - 10);

  await supabase.from("player_state").update({
    money: ps.money - cost,
    police_rel: Math.min(100, (ps.police_rel || 50) + 15),
    heat: newHeat,
    personal_heat: newPersonalHeat,
    energy: ps.energy - (ENERGY_COSTS.bribe || 5),
    stats_total_spent: (ps.stats_total_spent || 0) + cost,
    last_action_at: new Date().toISOString(),
  }).eq("user_id", userId);

  return {
    success: true,
    message: `Politie omgekocht voor €${cost.toLocaleString()}. Heat -10, relatie +15.`,
    data: { cost, newMoney: ps.money - cost, newHeat, policeRel: Math.min(100, (ps.police_rel || 50) + 15) },
  };
}

// ========== BUY BUSINESS ==========

async function handleBuyBusiness(supabase: any, userId: string, ps: any, payload: { businessId: string }): Promise<ActionResult> {
  const { businessId } = payload;
  if (!businessId) return { success: false, message: "Geen business opgegeven." };

  const biz = BUSINESSES.find((b) => b.id === businessId);
  if (!biz) return { success: false, message: "Onbekende business." };

  const { data: existing } = await supabase.from("player_businesses").select("id").eq("user_id", userId).eq("business_id", businessId).maybeSingle();
  if (existing) return { success: false, message: "Je hebt deze business al." };

  if (ps.money < biz.cost) return { success: false, message: `Te weinig geld (nodig: €${biz.cost.toLocaleString()}).` };
  if (biz.reqRep && ps.rep < biz.reqRep) return { success: false, message: `Onvoldoende reputatie (nodig: ${biz.reqRep}).` };

  // Check district requirement
  if (biz.reqDistrict) {
    const { data: ownedD } = await supabase.from("player_districts").select("district_id").eq("user_id", userId).eq("district_id", biz.reqDistrict).maybeSingle();
    if (!ownedD) return { success: false, message: `Je moet ${biz.reqDistrict} bezitten.` };
  }

  // Check business count requirement
  if (biz.reqBusinessCount) {
    const { data: allBiz } = await supabase.from("player_businesses").select("id").eq("user_id", userId);
    if ((allBiz || []).length < biz.reqBusinessCount) return { success: false, message: `Je hebt minimaal ${biz.reqBusinessCount} businesses nodig.` };
  }

  await supabase.from("player_state").update({
    money: ps.money - biz.cost,
    stats_total_spent: (ps.stats_total_spent || 0) + biz.cost,
    last_action_at: new Date().toISOString(),
  }).eq("user_id", userId);

  await supabase.from("player_businesses").insert({ user_id: userId, business_id: businessId });

  return {
    success: true,
    message: `${biz.name} gekocht voor €${biz.cost.toLocaleString()}! Dagelijks inkomen: €${biz.income.toLocaleString()}.`,
    data: { businessId, cost: biz.cost, income: biz.income, newMoney: ps.money - biz.cost },
  };
}

// ========== INIT PLAYER ==========

async function handleInitPlayer(supabase: any, userId: string): Promise<ActionResult> {
  const { data: existing } = await supabase.from("player_state").select("id").eq("user_id", userId).maybeSingle();
  if (existing) return { success: true, message: "Speler bestaat al.", data: { existing: true } };

  const { error } = await supabase.from("player_state").insert({ user_id: userId });
  if (error) return { success: false, message: `Fout bij aanmaken: ${error.message}` };

  await supabase.from("player_vehicles").insert({ user_id: userId, vehicle_id: "toyohata", is_active: true });

  return { success: true, message: "Nieuwe speler aangemaakt!", data: { existing: false } };
}

// ========== GET STATE ==========

async function handleGetState(supabase: any, userId: string): Promise<ActionResult> {
  const { data: ps } = await supabase.from("player_state").select("*").eq("user_id", userId).maybeSingle();
  if (!ps) return { success: false, message: "Speler niet gevonden." };

  // Energy regen: 1 per 5 min
  const now = Date.now();
  const energyRegenAt = new Date(ps.energy_regen_at).getTime();
  if (ps.energy < ps.max_energy && now > energyRegenAt) {
    const elapsed = Math.floor((now - energyRegenAt) / (5 * 60 * 1000));
    if (elapsed > 0) {
      ps.energy = Math.min(ps.max_energy, ps.energy + elapsed);
      await supabase.from("player_state").update({
        energy: ps.energy,
        energy_regen_at: new Date(energyRegenAt + elapsed * 5 * 60 * 1000).toISOString(),
      }).eq("user_id", userId);
    }
  }

  // Nerve regen: 1 per 3 min
  const nerveRegenAt = new Date(ps.nerve_regen_at).getTime();
  if (ps.nerve < ps.max_nerve && now > nerveRegenAt) {
    const elapsed = Math.floor((now - nerveRegenAt) / (3 * 60 * 1000));
    if (elapsed > 0) {
      ps.nerve = Math.min(ps.max_nerve, ps.nerve + elapsed);
      await supabase.from("player_state").update({
        nerve: ps.nerve,
        nerve_regen_at: new Date(nerveRegenAt + elapsed * 3 * 60 * 1000).toISOString(),
      }).eq("user_id", userId);
    }
  }

  // Auto-release prison/hospital
  if (ps.prison_until && new Date(ps.prison_until) <= new Date()) {
    await supabase.from("player_state").update({ prison_until: null, prison_reason: null }).eq("user_id", userId);
    ps.prison_until = null; ps.prison_reason = null;
  }
  if (ps.hospital_until && new Date(ps.hospital_until) <= new Date()) {
    await supabase.from("player_state").update({ hospital_until: null, hp: ps.max_hp }).eq("user_id", userId);
    ps.hospital_until = null; ps.hp = ps.max_hp;
  }

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
    success: true, message: "State opgehaald.",
    data: {
      playerState: ps,
      inventory: invRes.data || [], gear: gearRes.data || [], vehicles: vehicleRes.data || [],
      districts: districtRes.data || [], businesses: bizRes.data || [],
      crew: crewRes.data || [], villa: villaRes.data || null,
    },
  };
}

// ========== PVP ATTACK ==========

async function handleAttack(supabase: any, userId: string, ps: any, payload: { targetUserId: string }): Promise<ActionResult> {
  const { targetUserId } = payload;
  if (!targetUserId) return { success: false, message: "Geen doelwit opgegeven." };
  if (targetUserId === userId) return { success: false, message: "Je kunt jezelf niet aanvallen." };

  const blocked = checkBlocked(ps);
  if (blocked) return { success: false, message: blocked };
  const energyErr = checkEnergy(ps, "attack");
  if (energyErr) return { success: false, message: energyErr };
  const nerveErr = checkNerve(ps, "attack");
  if (nerveErr) return { success: false, message: nerveErr };

  // Check attack cooldown
  if (ps.attack_cooldown_until && new Date(ps.attack_cooldown_until) > new Date()) {
    const secs = Math.ceil((new Date(ps.attack_cooldown_until).getTime() - Date.now()) / 1000);
    return { success: false, message: `Aanval op cooldown (${secs}s).` };
  }

  // Get target player state
  const { data: target } = await supabase.from("player_state").select("*").eq("user_id", targetUserId).maybeSingle();
  if (!target) return { success: false, message: "Doelwit niet gevonden." };

  // Target must not be in hospital/prison/hiding
  if (target.hospital_until && new Date(target.hospital_until) > new Date()) {
    return { success: false, message: "Doelwit ligt in het ziekenhuis." };
  }
  if (target.prison_until && new Date(target.prison_until) > new Date()) {
    return { success: false, message: "Doelwit zit in de gevangenis." };
  }

  // Get gear for both players
  const [attackerGear, defenderGear] = await Promise.all([
    supabase.from("player_gear").select("gear_id").eq("user_id", userId),
    supabase.from("player_gear").select("gear_id").eq("user_id", targetUserId),
  ]);

  // Calculate combat power
  const attackerMuscle = getPlayerStat(ps.stats || {}, ps.loadout || {}, "muscle");
  const defenderMuscle = getPlayerStat(target.stats || {}, target.loadout || {}, "muscle");

  // Combat formula: power = muscle * level_factor + random
  const attackerPower = attackerMuscle * (1 + ps.level * 0.1) + Math.random() * 20;
  const defenderPower = defenderMuscle * (1 + target.level * 0.1) + Math.random() * 20;

  const attackerWins = attackerPower > defenderPower;
  const now = new Date();
  const cooldownUntil = new Date(now.getTime() + ATTACK_COOLDOWN_SECONDS * 1000).toISOString();

  // Get target profile for username
  const { data: targetProfile } = await supabase.from("profiles").select("username").eq("id", targetUserId).maybeSingle();
  const targetName = targetProfile?.username || "Onbekend";

  const energyCost = ENERGY_COSTS.attack || 15;
  const nerveCost = NERVE_COSTS.attack || 10;

  if (attackerWins) {
    // Steal money: 5-15% of target's cash
    const stealPct = 0.05 + Math.random() * 0.10;
    const stolen = Math.floor((target.money || 0) * stealPct);
    const dmgToTarget = 20 + Math.floor(Math.random() * 30); // 20-50 damage
    const targetNewHp = Math.max(0, (target.hp || 100) - dmgToTarget);

    // Hospitalize target if HP <= 0
    const hospitalUntil = targetNewHp <= 0
      ? new Date(now.getTime() + HOSPITAL_SECONDS * 1000).toISOString()
      : null;

    // Update attacker
    await supabase.from("player_state").update({
      money: (ps.money || 0) + stolen,
      energy: ps.energy - energyCost,
      nerve: ps.nerve - nerveCost,
      attack_cooldown_until: cooldownUntil,
      personal_heat: Math.min(100, (ps.personal_heat || 0) + 15),
      xp: (ps.xp || 0) + 50,
      last_action_at: now.toISOString(),
    }).eq("user_id", userId);

    // Update target
    const targetUpdate: any = {
      money: Math.max(0, (target.money || 0) - stolen),
      hp: targetNewHp,
      updated_at: now.toISOString(),
    };
    if (hospitalUntil) {
      targetUpdate.hospital_until = hospitalUntil;
      targetUpdate.hospitalizations = (target.hospitalizations || 0) + 1;
      targetUpdate.hp = target.max_hp || 100; // Heal on hospital admit
    }
    await supabase.from("player_state").update(targetUpdate).eq("user_id", targetUserId);

    const hospitalMsg = hospitalUntil ? ` ${targetName} is gehospitaliseerd!` : "";
    return {
      success: true,
      message: `Je hebt ${targetName} verslagen! €${stolen.toLocaleString()} gestolen.${hospitalMsg}`,
      data: {
        won: true, stolen, damage: dmgToTarget, targetHospitalized: !!hospitalUntil,
        targetName, attackerPower: Math.round(attackerPower), defenderPower: Math.round(defenderPower),
      },
    };
  } else {
    // Attacker loses
    const dmgToAttacker = 15 + Math.floor(Math.random() * 25); // 15-40 damage
    const attackerNewHp = Math.max(0, (ps.hp || 100) - dmgToAttacker);

    const hospitalUntil = attackerNewHp <= 0
      ? new Date(now.getTime() + HOSPITAL_SECONDS * 1000).toISOString()
      : null;

    const attackerUpdate: any = {
      energy: ps.energy - energyCost,
      nerve: ps.nerve - nerveCost,
      attack_cooldown_until: cooldownUntil,
      hp: attackerNewHp,
      personal_heat: Math.min(100, (ps.personal_heat || 0) + 10),
      last_action_at: now.toISOString(),
    };
    if (hospitalUntil) {
      attackerUpdate.hospital_until = hospitalUntil;
      attackerUpdate.hospitalizations = (ps.hospitalizations || 0) + 1;
      attackerUpdate.hp = ps.max_hp || 100;
    }
    await supabase.from("player_state").update(attackerUpdate).eq("user_id", userId);

    const hospitalMsg = hospitalUntil ? " Je bent gehospitaliseerd!" : "";
    return {
      success: true,
      message: `${targetName} heeft je verslagen! -${dmgToAttacker} HP.${hospitalMsg}`,
      data: {
        won: false, damage: dmgToAttacker, hospitalized: !!hospitalUntil,
        targetName, attackerPower: Math.round(attackerPower), defenderPower: Math.round(defenderPower),
      },
    };
  }
}

// ========== LIST PLAYERS (for PvP targeting) ==========

async function handleListPlayers(supabase: any, userId: string, ps: any): Promise<ActionResult> {
  // Get players in the same district, excluding self, hospital, prison
  const { data: players } = await supabase
    .from("player_state")
    .select("user_id, level, hp, max_hp, loc, hospital_until, prison_until")
    .eq("loc", ps.loc)
    .neq("user_id", userId)
    .eq("game_over", false)
    .limit(20);

  if (!players || players.length === 0) {
    return { success: true, message: "Geen spelers in dit district.", data: { players: [] } };
  }

  // Get profiles for usernames
  const userIds = players.map((p: any) => p.user_id);
  const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", userIds);
  const profileMap: Record<string, string> = {};
  (profiles || []).forEach((p: any) => { profileMap[p.id] = p.username; });

  const now = new Date();
  const result = players
    .filter((p: any) => {
      if (p.hospital_until && new Date(p.hospital_until) > now) return false;
      if (p.prison_until && new Date(p.prison_until) > now) return false;
      return true;
    })
    .map((p: any) => ({
      userId: p.user_id,
      username: profileMap[p.user_id] || "Onbekend",
      level: p.level,
      hp: p.hp,
      maxHp: p.max_hp,
    }));

  return { success: true, message: `${result.length} spelers gevonden.`, data: { players: result } };
}

// ========== PUBLIC PROFILE ==========

async function handleGetPublicProfile(supabase: any, targetUserId: string): Promise<ActionResult> {
  if (!targetUserId) return { success: false, message: "Geen speler opgegeven." };

  const [profileRes, stateRes, gearRes, vehicleRes, districtRes, bizRes, crewRes] = await Promise.all([
    supabase.from("profiles").select("username, created_at").eq("id", targetUserId).maybeSingle(),
    supabase.from("player_state").select("level, xp, rep, karma, hp, max_hp, loc, backstory, endgame_phase, stats, loadout, day, money, dirty_money, hospitalizations, stats_total_earned, stats_trades_completed, stats_missions_completed, stats_casino_won, stats_casino_lost").eq("user_id", targetUserId).maybeSingle(),
    supabase.from("player_gear").select("gear_id").eq("user_id", targetUserId),
    supabase.from("player_vehicles").select("vehicle_id, is_active, condition, vehicle_heat").eq("user_id", targetUserId),
    supabase.from("player_districts").select("district_id, district_rep").eq("user_id", targetUserId),
    supabase.from("player_businesses").select("business_id").eq("user_id", targetUserId),
    supabase.from("player_crew").select("name, role, level, specialization").eq("user_id", targetUserId),
  ]);

  if (!stateRes.data) return { success: false, message: "Speler niet gevonden." };

  const ps = stateRes.data;
  const profile = profileRes.data;

  // Map gear IDs to names
  const gearList = (gearRes.data || []).map((g: any) => {
    const gear = GEAR.find(gi => gi.id === g.gear_id);
    return { id: g.gear_id, name: gear?.name || g.gear_id, type: gear?.type || "unknown" };
  });

  // Map vehicle IDs to names
  const vehicleList = (vehicleRes.data || []).map((v: any) => {
    const veh = VEHICLES.find(vi => vi.id === v.vehicle_id);
    return { id: v.vehicle_id, name: veh?.name || v.vehicle_id, active: v.is_active, condition: v.condition };
  });

  // Map district IDs to names
  const districtNames: Record<string, string> = {
    low: "Lowrise", port: "Port Nero", iron: "Iron Borough", neon: "Neon Strip", crown: "Crown Heights"
  };
  const districtList = (districtRes.data || []).map((d: any) => ({
    id: d.district_id, name: districtNames[d.district_id] || d.district_id, rep: d.district_rep,
  }));

  // Map business IDs to names
  const bizList = (bizRes.data || []).map((b: any) => {
    const biz = BUSINESSES.find(bi => bi.id === b.business_id);
    return { id: b.business_id, name: biz?.name || b.business_id };
  });

  const crewList = (crewRes.data || []).map((c: any) => ({
    name: c.name, role: c.role, level: c.level, spec: c.specialization,
  }));

  return {
    success: true,
    message: "Profiel opgehaald.",
    data: {
      username: profile?.username || "Onbekend",
      memberSince: profile?.created_at || null,
      level: ps.level,
      xp: ps.xp,
      rep: ps.rep,
      karma: ps.karma,
      hp: ps.hp,
      maxHp: ps.max_hp,
      loc: ps.loc,
      locName: districtNames[ps.loc] || ps.loc,
      backstory: ps.backstory,
      endgamePhase: ps.endgame_phase,
      day: ps.day,
      wealth: (ps.money || 0) + (ps.dirty_money || 0),
      stats: ps.stats,
      hospitalizations: ps.hospitalizations,
      totalEarned: ps.stats_total_earned,
      tradesCompleted: ps.stats_trades_completed,
      missionsCompleted: ps.stats_missions_completed,
      casinoWon: ps.stats_casino_won,
      casinoLost: ps.stats_casino_lost,
      gear: gearList,
      vehicles: vehicleList,
      districts: districtList,
      businesses: bizList,
      crew: crewList,
    },
  };
}

// ========== MESSAGING ==========

async function handleSendMessage(supabase: any, userId: string, payload: any): Promise<ActionResult> {
  const { targetUserId, subject, body } = payload || {};
  if (!targetUserId) return { success: false, message: "Geen ontvanger opgegeven." };
  if (!body || body.trim().length === 0) return { success: false, message: "Bericht mag niet leeg zijn." };
  if (body.length > 500) return { success: false, message: "Bericht mag max 500 tekens zijn." };
  if (subject && subject.length > 100) return { success: false, message: "Onderwerp mag max 100 tekens zijn." };
  if (targetUserId === userId) return { success: false, message: "Je kunt jezelf geen bericht sturen." };

  // Check target exists
  const { data: target } = await supabase.from("profiles").select("username").eq("id", targetUserId).maybeSingle();
  if (!target) return { success: false, message: "Speler niet gevonden." };

  // Rate limit: max 10 messages per hour
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count } = await supabase.from("player_messages").select("id", { count: "exact", head: true })
    .eq("sender_id", userId).gte("created_at", oneHourAgo);
  if ((count || 0) >= 10) return { success: false, message: "Je kunt max 10 berichten per uur sturen." };

  const { error } = await supabase.from("player_messages").insert({
    sender_id: userId,
    receiver_id: targetUserId,
    subject: (subject || "").trim().slice(0, 100),
    body: body.trim().slice(0, 500),
  });

  if (error) return { success: false, message: "Kon bericht niet versturen." };
  return { success: true, message: `Bericht verstuurd naar ${target.username}.` };
}

async function handleGetMessages(supabase: any, userId: string, payload: any): Promise<ActionResult> {
  const folder = payload?.folder || "inbox"; // inbox | sent
  const limit = Math.min(payload?.limit || 20, 50);

  let query;
  if (folder === "sent") {
    query = supabase.from("player_messages").select("id, receiver_id, subject, body, read, created_at")
      .eq("sender_id", userId).order("created_at", { ascending: false }).limit(limit);
  } else {
    query = supabase.from("player_messages").select("id, sender_id, subject, body, read, created_at")
      .eq("receiver_id", userId).order("created_at", { ascending: false }).limit(limit);
  }

  const { data: messages, error } = await query;
  if (error) return { success: false, message: "Kon berichten niet ophalen." };

  // Resolve usernames
  const userIds = messages.map((m: any) => folder === "sent" ? m.receiver_id : m.sender_id);
  const uniqueIds = [...new Set(userIds)];
  const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", uniqueIds);
  const nameMap: Record<string, string> = {};
  (profiles || []).forEach((p: any) => { nameMap[p.id] = p.username; });

  const enriched = messages.map((m: any) => ({
    id: m.id,
    otherUserId: folder === "sent" ? m.receiver_id : m.sender_id,
    otherUsername: nameMap[folder === "sent" ? m.receiver_id : m.sender_id] || "Onbekend",
    subject: m.subject,
    body: m.body,
    read: m.read,
    createdAt: m.created_at,
  }));

  // Unread count
  const { count: unreadCount } = await supabase.from("player_messages").select("id", { count: "exact", head: true })
    .eq("receiver_id", userId).eq("read", false);

  return { success: true, message: "Berichten opgehaald.", data: { messages: enriched, unread: unreadCount || 0, folder } };
}

async function handleReadMessage(supabase: any, userId: string, payload: any): Promise<ActionResult> {
  const { messageId } = payload || {};
  if (!messageId) return { success: false, message: "Geen bericht-ID." };

  await supabase.from("player_messages").update({ read: true })
    .eq("id", messageId).eq("receiver_id", userId);

  return { success: true, message: "Bericht gelezen." };
}

async function handleDeleteMessage(supabase: any, userId: string, payload: any): Promise<ActionResult> {
  const { messageId } = payload || {};
  if (!messageId) return { success: false, message: "Geen bericht-ID." };

  const { error } = await supabase.from("player_messages").delete()
    .eq("id", messageId).or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

  if (error) return { success: false, message: "Kon bericht niet verwijderen." };
  return { success: true, message: "Bericht verwijderd." };
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, message: "Niet ingelogd." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, message: "Ongeldige sessie." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, payload } = body;

    // Mute check for restricted actions
    if (["trade", "wash_money", "solo_op"].includes(action)) {
      const { data: mutes } = await supabase.from("player_sanctions").select("id, expires_at")
        .eq("user_id", user.id).eq("type", "mute").eq("active", true).limit(1);
      if (mutes && mutes.length > 0) {
        const mute = mutes[0];
        if (!mute.expires_at || new Date(mute.expires_at) > new Date()) {
          return new Response(JSON.stringify({ success: false, message: "Je account is gemute." }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Get player state
    let playerState: any = null;
    if (action !== "init_player") {
      const { data: ps } = await supabase.from("player_state").select("*").eq("user_id", user.id).maybeSingle();
      if (!ps && action !== "get_state") {
        return new Response(JSON.stringify({ success: false, message: "Speler niet gevonden." }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      playerState = ps;
    }

    let result: ActionResult;

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
      case "solo_op":
        result = await handleSoloOp(supabase, user.id, playerState, payload);
        break;
      case "buy_gear":
        result = await handleBuyGear(supabase, user.id, playerState, payload);
        break;
      case "equip_gear":
        result = await handleEquipGear(supabase, user.id, playerState, payload);
        break;
      case "unequip_gear":
        result = await handleUnequipGear(supabase, user.id, playerState, payload);
        break;
      case "buy_vehicle":
        result = await handleBuyVehicle(supabase, user.id, playerState, payload);
        break;
      case "switch_vehicle":
        result = await handleSwitchVehicle(supabase, user.id, playerState, payload);
        break;
      case "wash_money":
        result = await handleWashMoney(supabase, user.id, playerState, payload);
        break;
      case "bribe_police":
        result = await handleBribePolice(supabase, user.id, playerState);
        break;
      case "buy_business":
        result = await handleBuyBusiness(supabase, user.id, playerState, payload);
        break;
      case "attack":
        result = await handleAttack(supabase, user.id, playerState, payload);
        break;
      case "list_players":
        result = await handleListPlayers(supabase, user.id, playerState);
        break;
      case "get_public_profile":
        result = await handleGetPublicProfile(supabase, payload?.targetUserId);
        break;
      case "send_message":
        result = await handleSendMessage(supabase, user.id, payload);
        break;
      case "get_messages":
        result = await handleGetMessages(supabase, user.id, payload);
        break;
      case "read_message":
        result = await handleReadMessage(supabase, user.id, payload);
        break;
      case "delete_message":
        result = await handleDeleteMessage(supabase, user.id, payload);
        break;
      default:
        result = { success: false, message: `Onbekende actie: ${action}` };
    }

    // Log action (skip get_state for performance)
    if (action !== "get_state") {
      await supabase.from("game_action_log").insert({
        user_id: user.id, action_type: action,
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
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
