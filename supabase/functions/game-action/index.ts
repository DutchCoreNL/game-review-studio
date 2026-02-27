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

// ========== TRADE (SERVER-SIDE MARKET ECONOMY) ==========

async function handleTrade(supabase: any, userId: string, ps: any, payload: { goodId: string; mode: "buy" | "sell"; quantity: number }): Promise<ActionResult> {
  const { goodId, mode, quantity } = payload;
  if (!goodId || !mode || !quantity || quantity <= 0) return { success: false, message: "Ongeldige parameters." };

  const good = GOODS.find((g) => g.id === goodId);
  if (!good) return { success: false, message: "Onbekend goed." };

  let blocked = checkBlocked(ps); if (blocked) return { success: false, message: blocked };
  let energyErr = checkEnergy(ps, "trade"); if (energyErr) return { success: false, message: energyErr };

  // Fetch LIVE market price from shared market_prices table
  const { data: marketRow } = await supabase.from("market_prices")
    .select("*").eq("good_id", goodId).eq("district_id", ps.loc).maybeSingle();
  if (!marketRow) return { success: false, message: "Geen marktprijs beschikbaar." };

  const { data: invRow } = await supabase.from("player_inventory").select("*").eq("user_id", userId).eq("good_id", goodId).maybeSingle();
  const currentQty = invRow?.quantity || 0;
  const currentAvgCost = invRow?.avg_cost || 0;

  const { data: activeVeh } = await supabase.from("player_vehicles").select("vehicle_id").eq("user_id", userId).eq("is_active", true).maybeSingle();
  const maxInv = getVehicleStorage(activeVeh?.vehicle_id || "toyohata");

  const { data: allInv } = await supabase.from("player_inventory").select("quantity").eq("user_id", userId);
  const totalInv = (allInv || []).reduce((sum: number, r: any) => sum + (r.quantity || 0), 0);

  const charm = getPlayerStat(ps.stats || {}, ps.loadout || {}, "charm");
  const charmBonus = charm * 0.02 + (ps.rep || 0) / 5000;
  const energyCost = ENERGY_COSTS.trade || 2;
  const livePrice = marketRow.current_price;

  if (mode === "buy") {
    const spaceLeft = maxInv - totalInv;
    const maxBuy = Math.min(quantity, spaceLeft);
    if (maxBuy <= 0) return { success: false, message: "Kofferbak vol." };

    let buyPrice = livePrice;
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

    // === SUPPLY & DEMAND: buying increases price ===
    const priceImpact = Math.max(1, Math.floor(livePrice * 0.02 * actualQty / 5));
    const newPrice = Math.min(livePrice * 3, livePrice + priceImpact); // cap at 3x base
    const newBuyVol = (marketRow.buy_volume || 0) + actualQty;
    const trend = newBuyVol > (marketRow.sell_volume || 0) ? "up" : "stable";

    await supabase.from("market_prices").update({
      current_price: newPrice, buy_volume: newBuyVol,
      price_trend: trend, last_updated: new Date().toISOString(),
    }).eq("good_id", goodId).eq("district_id", ps.loc);

    // Log trade history
    await supabase.from("market_trade_history").insert({
      good_id: goodId, district_id: ps.loc, price: buyPrice, volume: actualQty, trade_type: "buy",
    });

    return { success: true, message: `${actualQty}x ${good.name} gekocht voor €${totalCost}`, data: { quantity: actualQty, totalCost, newMoney: ps.money - totalCost, marketPrice: newPrice } };
  } else {
    if (currentQty <= 0) return { success: false, message: "Niet op voorraad." };
    const actualQty = Math.min(quantity, currentQty);
    const sellPrice = Math.floor(livePrice * 0.85 * (1 + charmBonus));
    const totalRevenue = sellPrice * actualQty;
    const remainingQty = currentQty - actualQty;
    const repGain = Math.floor(2 * actualQty);
    const profitPerUnit = sellPrice - currentAvgCost;

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

    // === SUPPLY & DEMAND: selling decreases price ===
    const priceImpact = Math.max(1, Math.floor(livePrice * 0.02 * actualQty / 5));
    const newPrice = Math.max(Math.floor(good.base * 0.3), livePrice - priceImpact); // floor at 30% of base
    const newSellVol = (marketRow.sell_volume || 0) + actualQty;
    const trend = newSellVol > (marketRow.buy_volume || 0) ? "down" : "stable";

    await supabase.from("market_prices").update({
      current_price: newPrice, sell_volume: newSellVol,
      price_trend: trend, last_updated: new Date().toISOString(),
    }).eq("good_id", goodId).eq("district_id", ps.loc);

    await supabase.from("market_trade_history").insert({
      good_id: goodId, district_id: ps.loc, price: sellPrice, volume: actualQty, trade_type: "sell",
    });

    return { success: true, message: `${actualQty}x ${good.name} verkocht voor €${totalRevenue} (${profitPerUnit >= 0 ? '+' : ''}€${profitPerUnit}/stuk)`, data: { quantity: actualQty, totalRevenue, newMoney: ps.money + totalRevenue, profitPerUnit, marketPrice: newPrice } };
  }
}

async function handleGetMarketPrices(supabase: any, userId: string, ps: any): Promise<ActionResult> {
  // Get all market prices
  const { data: prices } = await supabase.from("market_prices").select("good_id, district_id, current_price, buy_volume, sell_volume, price_trend");

  // Get recent trade history for the current district (last 10 trades per good)
  const { data: history } = await supabase.from("market_trade_history")
    .select("good_id, price, trade_type, created_at")
    .eq("district_id", ps.loc)
    .order("created_at", { ascending: false })
    .limit(50);

  // Build price map: { district: { good: price } }
  const priceMap: Record<string, Record<string, { price: number; trend: string; buyVol: number; sellVol: number }>> = {};
  for (const p of (prices || [])) {
    if (!priceMap[p.district_id]) priceMap[p.district_id] = {};
    priceMap[p.district_id][p.good_id] = {
      price: p.current_price,
      trend: p.price_trend,
      buyVol: p.buy_volume,
      sellVol: p.sell_volume,
    };
  }

  return {
    success: true,
    message: "Marktprijzen opgehaald.",
    data: { prices: priceMap, history: history || [] },
  };
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

  const [invRes, gearRes, vehicleRes, districtRes, bizRes, crewRes, villaRes, memberRes] = await Promise.all([
    supabase.from("player_inventory").select("*").eq("user_id", userId),
    supabase.from("player_gear").select("*").eq("user_id", userId),
    supabase.from("player_vehicles").select("*").eq("user_id", userId),
    supabase.from("player_districts").select("*").eq("user_id", userId),
    supabase.from("player_businesses").select("*").eq("user_id", userId),
    supabase.from("player_crew").select("*").eq("user_id", userId),
    supabase.from("player_villa").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("gang_members").select("gang_id").eq("user_id", userId),
  ]);

  // Fetch gang territories for player's gang(s) to merge into ownedDistricts
  let gangDistricts: string[] = [];
  const gangIds = (memberRes.data || []).map((m: any) => m.gang_id);
  if (gangIds.length > 0) {
    const { data: gangTerritories } = await supabase.from("gang_territories")
      .select("district_id").in("gang_id", gangIds);
    gangDistricts = [...new Set((gangTerritories || []).map((t: any) => t.district_id))];
  }

  // Combine personal districts + gang territories (deduped)
  const personalDistricts = (districtRes.data || []).map((d: any) => d.district_id);
  const allDistricts = [...new Set([...personalDistricts, ...gangDistricts])];

  return {
    success: true, message: "State opgehaald.",
    data: {
      playerState: ps,
      inventory: invRes.data || [], gear: gearRes.data || [], vehicles: vehicleRes.data || [],
      districts: districtRes.data || [], businesses: bizRes.data || [],
      crew: crewRes.data || [], villa: villaRes.data || null,
      gangDistricts, allDistricts,
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
      targetUpdate.hp = target.max_hp || 100;
    }
    await supabase.from("player_state").update(targetUpdate).eq("user_id", targetUserId);

    // === RIVALRY: create/update rivalry on PvP ===
    await upsertRivalry(supabase, userId, targetUserId, 10, "pvp");

    // === BOUNTY: check if target has active bounty, claim it ===
    const { data: bounties } = await supabase.from("player_bounties")
      .select("*").eq("target_id", targetUserId).eq("status", "active");
    let bountyBonus = 0;
    for (const b of (bounties || [])) {
      if (b.placer_id !== userId) { // Can't claim own bounty
        bountyBonus += b.amount;
        await supabase.from("player_bounties").update({
          status: "claimed", claimed_by: userId, claimed_at: now.toISOString(),
        }).eq("id", b.id);
      }
    }
    if (bountyBonus > 0) {
      await supabase.from("player_state").update({
        money: (ps.money || 0) + stolen + bountyBonus,
      }).eq("user_id", userId);
    }

    // === REVENGE BONUS: check if target attacked us recently ===
    const { data: recentRivalry } = await supabase.from("player_rivalries")
      .select("rivalry_score").eq("player_id", targetUserId).eq("rival_id", userId).maybeSingle();
    const revengeBonus = (recentRivalry && recentRivalry.rivalry_score >= 10) ? Math.floor(stolen * 0.5) : 0;
    if (revengeBonus > 0) {
      await supabase.from("player_state").update({
        money: (ps.money || 0) + stolen + bountyBonus + revengeBonus,
        rep: (ps.rep || 0) + 25,
      }).eq("user_id", userId);
    }

    const hospitalMsg = hospitalUntil ? ` ${targetName} is gehospitaliseerd!` : "";
    const bountyMsg = bountyBonus > 0 ? ` 🎯 Premie geclaimed: €${bountyBonus.toLocaleString()}!` : "";
    const revengeMsg = revengeBonus > 0 ? ` ⚔️ Wraakbonus: +€${revengeBonus.toLocaleString()}!` : "";
    return {
      success: true,
      message: `Je hebt ${targetName} verslagen! €${stolen.toLocaleString()} gestolen.${hospitalMsg}${bountyMsg}${revengeMsg}`,
      data: {
        won: true, stolen, damage: dmgToTarget, targetHospitalized: !!hospitalUntil,
        targetName, attackerPower: Math.round(attackerPower), defenderPower: Math.round(defenderPower),
        bountyBonus, revengeBonus,
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

// ========== GANG SYSTEM ==========

async function handleCreateGang(supabase: any, userId: string, payload: any): Promise<ActionResult> {
  const { name, tag, description } = payload || {};
  if (!name || name.length < 3 || name.length > 24) return { success: false, message: "Gangnaam moet 3-24 tekens zijn." };
  if (!tag || tag.length < 2 || tag.length > 5) return { success: false, message: "Tag moet 2-5 tekens zijn." };

  // Check not already in a gang
  const { data: existing } = await supabase.from("gang_members").select("id").eq("user_id", userId).maybeSingle();
  if (existing) return { success: false, message: "Je zit al in een gang." };

  // Check player has enough money (€25,000 to create)
  const { data: ps } = await supabase.from("player_state").select("money, level").eq("user_id", userId).maybeSingle();
  if (!ps) return { success: false, message: "Speler niet gevonden." };
  if (ps.money < 25000) return { success: false, message: "Je hebt €25.000 nodig om een gang op te richten." };
  if (ps.level < 5) return { success: false, message: "Je moet minimaal level 5 zijn." };

  // Create gang
  const { data: gang, error: gangErr } = await supabase.from("gangs").insert({
    name: name.trim(), tag: tag.trim().toUpperCase(), description: (description || "").trim().slice(0, 200), leader_id: userId,
  }).select("id").single();

  if (gangErr) {
    if (gangErr.message?.includes("unique")) return { success: false, message: "Naam of tag is al in gebruik." };
    return { success: false, message: "Kon gang niet aanmaken." };
  }

  // Add leader as member
  await supabase.from("gang_members").insert({ gang_id: gang.id, user_id: userId, role: "leader" });

  // Deduct money
  await supabase.from("player_state").update({ money: ps.money - 25000 }).eq("user_id", userId);

  return { success: true, message: `Gang "${name}" opgericht!`, data: { gangId: gang.id } };
}

async function handleGetGang(supabase: any, userId: string, payload: any): Promise<ActionResult> {
  const gangId = payload?.gangId;

  // If no gangId, get user's gang
  let targetGangId = gangId;
  if (!targetGangId) {
    const { data: mem } = await supabase.from("gang_members").select("gang_id").eq("user_id", userId).maybeSingle();
    if (!mem) return { success: true, message: "Geen gang.", data: { gang: null } };
    targetGangId = mem.gang_id;
  }

  const [gangRes, membersRes, territoriesRes, warsRes] = await Promise.all([
    supabase.from("gangs").select("*").eq("id", targetGangId).maybeSingle(),
    supabase.from("gang_members").select("user_id, role, joined_at, contributed").eq("gang_id", targetGangId),
    supabase.from("gang_territories").select("district_id, defense_level, captured_at").eq("gang_id", targetGangId),
    supabase.from("gang_wars").select("*").or(`attacker_gang_id.eq.${targetGangId},defender_gang_id.eq.${targetGangId}`).eq("status", "active"),
  ]);

  if (!gangRes.data) return { success: false, message: "Gang niet gevonden." };

  // Resolve member usernames
  const memberIds = (membersRes.data || []).map((m: any) => m.user_id);
  const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", memberIds);
  const nameMap: Record<string, string> = {};
  (profiles || []).forEach((p: any) => { nameMap[p.id] = p.username; });

  const members = (membersRes.data || []).map((m: any) => ({
    userId: m.user_id, username: nameMap[m.user_id] || "Onbekend",
    role: m.role, joinedAt: m.joined_at, contributed: m.contributed,
  }));

  // Get my membership info
  const myMember = members.find((m: any) => m.userId === userId);

  return {
    success: true, message: "Gang opgehaald.",
    data: {
      gang: gangRes.data,
      members,
      territories: territoriesRes.data || [],
      activeWars: warsRes.data || [],
      myRole: myMember?.role || null,
      isMember: !!myMember,
    },
  };
}

async function handleGangInvite(supabase: any, userId: string, payload: any): Promise<ActionResult> {
  const { targetUserId } = payload || {};
  if (!targetUserId) return { success: false, message: "Geen speler opgegeven." };

  const { data: mem } = await supabase.from("gang_members").select("gang_id, role").eq("user_id", userId).maybeSingle();
  if (!mem) return { success: false, message: "Je zit niet in een gang." };
  if (mem.role === "member") return { success: false, message: "Alleen officers en de leader kunnen uitnodigen." };

  // Check target not already in a gang
  const { data: targetMem } = await supabase.from("gang_members").select("id").eq("user_id", targetUserId).maybeSingle();
  if (targetMem) return { success: false, message: "Speler zit al in een gang." };

  // Check member count
  const { count } = await supabase.from("gang_members").select("id", { count: "exact", head: true }).eq("gang_id", mem.gang_id);
  if ((count || 0) >= 20) return { success: false, message: "Gang is vol (max 20 leden)." };

  const { error } = await supabase.from("gang_invites").insert({
    gang_id: mem.gang_id, inviter_id: userId, invitee_id: targetUserId,
  });

  if (error) {
    if (error.message?.includes("unique")) return { success: false, message: "Speler is al uitgenodigd." };
    return { success: false, message: "Kon uitnodiging niet versturen." };
  }

  // Send in-game message
  const { data: gang } = await supabase.from("gangs").select("name").eq("id", mem.gang_id).maybeSingle();
  await supabase.from("player_messages").insert({
    sender_id: userId, receiver_id: targetUserId,
    subject: "Gang Uitnodiging",
    body: `Je bent uitgenodigd om lid te worden van [${gang?.name || "gang"}]. Ga naar Imperium → Gang om te accepteren.`,
  });

  return { success: true, message: "Uitnodiging verstuurd!" };
}

async function handleGangAcceptInvite(supabase: any, userId: string, payload: any): Promise<ActionResult> {
  const { inviteId } = payload || {};
  if (!inviteId) return { success: false, message: "Geen uitnodiging opgegeven." };

  const { data: invite } = await supabase.from("gang_invites").select("*").eq("id", inviteId).eq("invitee_id", userId).maybeSingle();
  if (!invite) return { success: false, message: "Uitnodiging niet gevonden." };

  // Check not already in a gang
  const { data: existing } = await supabase.from("gang_members").select("id").eq("user_id", userId).maybeSingle();
  if (existing) return { success: false, message: "Je zit al in een gang." };

  // Check member count
  const { count } = await supabase.from("gang_members").select("id", { count: "exact", head: true }).eq("gang_id", invite.gang_id);
  if ((count || 0) >= 20) return { success: false, message: "Gang is vol." };

  await supabase.from("gang_members").insert({ gang_id: invite.gang_id, user_id: userId, role: "member" });
  await supabase.from("gang_invites").delete().eq("invitee_id", userId); // Remove all pending invites

  return { success: true, message: "Je bent lid geworden van de gang!" };
}

async function handleGangLeave(supabase: any, userId: string): Promise<ActionResult> {
  const { data: mem } = await supabase.from("gang_members").select("gang_id, role").eq("user_id", userId).maybeSingle();
  if (!mem) return { success: false, message: "Je zit niet in een gang." };

  if (mem.role === "leader") {
    // Transfer leadership or disband
    const { data: others } = await supabase.from("gang_members").select("user_id, role")
      .eq("gang_id", mem.gang_id).neq("user_id", userId).order("role").limit(1);

    if (others && others.length > 0) {
      // Transfer to first officer/member
      await supabase.from("gang_members").update({ role: "leader" }).eq("user_id", others[0].user_id).eq("gang_id", mem.gang_id);
      await supabase.from("gangs").update({ leader_id: others[0].user_id }).eq("id", mem.gang_id);
    } else {
      // Disband gang (CASCADE will clean up)
      await supabase.from("gangs").delete().eq("id", mem.gang_id);
      return { success: true, message: "Gang ontbonden (geen leden over)." };
    }
  }

  await supabase.from("gang_members").delete().eq("user_id", userId);
  return { success: true, message: "Je hebt de gang verlaten." };
}

async function handleGangKick(supabase: any, userId: string, payload: any): Promise<ActionResult> {
  const { targetUserId } = payload || {};
  if (!targetUserId) return { success: false, message: "Geen speler opgegeven." };

  const { data: mem } = await supabase.from("gang_members").select("gang_id, role").eq("user_id", userId).maybeSingle();
  if (!mem || mem.role === "member") return { success: false, message: "Geen rechten." };

  const { data: target } = await supabase.from("gang_members").select("role").eq("user_id", targetUserId).eq("gang_id", mem.gang_id).maybeSingle();
  if (!target) return { success: false, message: "Speler zit niet in jouw gang." };
  if (target.role === "leader") return { success: false, message: "Je kunt de leader niet kicken." };
  if (target.role === "officer" && mem.role !== "leader") return { success: false, message: "Alleen de leader kan officers kicken." };

  await supabase.from("gang_members").delete().eq("user_id", targetUserId).eq("gang_id", mem.gang_id);
  return { success: true, message: "Speler gekickt." };
}

async function handleGangPromote(supabase: any, userId: string, payload: any): Promise<ActionResult> {
  const { targetUserId, newRole } = payload || {};
  if (!targetUserId || !newRole) return { success: false, message: "Ongeldige parameters." };
  if (!["officer", "member"].includes(newRole)) return { success: false, message: "Ongeldige rol." };

  const { data: mem } = await supabase.from("gang_members").select("gang_id, role").eq("user_id", userId).maybeSingle();
  if (!mem || mem.role !== "leader") return { success: false, message: "Alleen de leader kan rollen wijzigen." };

  await supabase.from("gang_members").update({ role: newRole }).eq("user_id", targetUserId).eq("gang_id", mem.gang_id);
  return { success: true, message: `Rol gewijzigd naar ${newRole}.` };
}

async function handleGangClaimTerritory(supabase: any, userId: string, payload: any): Promise<ActionResult> {
  const { districtId } = payload || {};
  if (!districtId) return { success: false, message: "Geen district opgegeven." };

  const { data: mem } = await supabase.from("gang_members").select("gang_id, role").eq("user_id", userId).maybeSingle();
  if (!mem) return { success: false, message: "Je zit niet in een gang." };
  if (mem.role === "member") return { success: false, message: "Alleen officers en de leader kunnen territory claimen." };

  // Check district not already claimed
  const { data: existing } = await supabase.from("gang_territories").select("gang_id").eq("district_id", districtId).maybeSingle();
  if (existing) {
    if (existing.gang_id === mem.gang_id) return { success: false, message: "Jullie gang bezit dit district al." };
    return { success: false, message: "Dit district is al geclaimd door een andere gang. Start een gang war!" };
  }

  // Cost: €50,000 from gang treasury
  const { data: gang } = await supabase.from("gangs").select("treasury").eq("id", mem.gang_id).maybeSingle();
  if (!gang || gang.treasury < 50000) return { success: false, message: "Gang treasury heeft €50.000 nodig. Leden kunnen doneren." };

  // Apply territory discount based on gang level
  const { data: gangFull } = await supabase.from("gangs").select("level").eq("id", mem.gang_id).maybeSingle();
  const discount = getGangTerritoryDiscount(gangFull?.level || 1);
  const cost = Math.floor(50000 * (1 - discount));
  if (gang.treasury < cost) return { success: false, message: `Gang treasury heeft €${cost.toLocaleString()} nodig. Leden kunnen doneren.` };

  await supabase.from("gangs").update({ treasury: gang.treasury - cost }).eq("id", mem.gang_id);
  await supabase.from("gang_territories").insert({ gang_id: mem.gang_id, district_id: districtId });

  // Award gang XP for territory claim
  const xpResult = await addGangXP(supabase, mem.gang_id, 200);
  const levelMsg = xpResult.leveled ? ` 🎉 Gang is nu level ${xpResult.newLevel}!` : "";

  return { success: true, message: `District geclaimd! +200 Gang XP.${levelMsg}`, data: { gangXP: 200, gangLeveled: xpResult.leveled, newGangLevel: xpResult.newLevel } };
}

async function handleGangDonate(supabase: any, userId: string, payload: any): Promise<ActionResult> {
  const { amount } = payload || {};
  if (!amount || amount < 1000) return { success: false, message: "Minimaal €1.000 doneren." };

  const { data: mem } = await supabase.from("gang_members").select("gang_id").eq("user_id", userId).maybeSingle();
  if (!mem) return { success: false, message: "Je zit niet in een gang." };

  const { data: ps } = await supabase.from("player_state").select("money").eq("user_id", userId).maybeSingle();
  if (!ps || ps.money < amount) return { success: false, message: "Niet genoeg geld." };

  await supabase.from("player_state").update({ money: ps.money - amount }).eq("user_id", userId);
  await supabase.rpc("", {}).catch(() => {}); // fallback
  // Direct update treasury
  const { data: gang } = await supabase.from("gangs").select("treasury").eq("id", mem.gang_id).maybeSingle();
  await supabase.from("gangs").update({ treasury: (gang?.treasury || 0) + amount }).eq("id", mem.gang_id);
  await supabase.from("gang_members").update({ contributed: (0) }).eq("user_id", userId).eq("gang_id", mem.gang_id);
  // Update contributed: fetch current and add
  const { data: myMem } = await supabase.from("gang_members").select("contributed").eq("user_id", userId).eq("gang_id", mem.gang_id).maybeSingle();
  await supabase.from("gang_members").update({ contributed: (myMem?.contributed || 0) + amount }).eq("user_id", userId).eq("gang_id", mem.gang_id);

  return { success: true, message: `€${amount.toLocaleString()} gedoneerd aan de gang treasury!` };
}

async function handleGangDeclareWar(supabase: any, userId: string, payload: any): Promise<ActionResult> {
  const { targetGangId, districtId } = payload || {};
  if (!targetGangId) return { success: false, message: "Geen doelgang opgegeven." };

  const { data: mem } = await supabase.from("gang_members").select("gang_id, role").eq("user_id", userId).maybeSingle();
  if (!mem) return { success: false, message: "Je zit niet in een gang." };
  if (mem.role === "member") return { success: false, message: "Alleen officers en leader kunnen oorlog verklaren." };
  if (mem.gang_id === targetGangId) return { success: false, message: "Je kunt geen oorlog verklaren aan je eigen gang." };

  // Check no active war between these gangs
  const { data: activeWar } = await supabase.from("gang_wars").select("id").eq("status", "active")
    .or(`and(attacker_gang_id.eq.${mem.gang_id},defender_gang_id.eq.${targetGangId}),and(attacker_gang_id.eq.${targetGangId},defender_gang_id.eq.${mem.gang_id})`)
    .maybeSingle();
  if (activeWar) return { success: false, message: "Er is al een actieve oorlog met deze gang." };

  // Cost: €25,000
  const { data: gang } = await supabase.from("gangs").select("treasury, name").eq("id", mem.gang_id).maybeSingle();
  if (!gang || gang.treasury < 25000) return { success: false, message: "Gang treasury heeft €25.000 nodig." };

  await supabase.from("gangs").update({ treasury: gang.treasury - 25000 }).eq("id", mem.gang_id);

  const { data: war } = await supabase.from("gang_wars").insert({
    attacker_gang_id: mem.gang_id,
    defender_gang_id: targetGangId,
    district_id: districtId || null,
  }).select("id").single();

  return { success: true, message: "Oorlog verklaard! 24 uur om te scoren.", data: { warId: war?.id } };
}

async function handleGangWarAttack(supabase: any, userId: string, payload: any): Promise<ActionResult> {
  const { warId } = payload || {};
  if (!warId) return { success: false, message: "Geen oorlog opgegeven." };

  const { data: mem } = await supabase.from("gang_members").select("gang_id").eq("user_id", userId).maybeSingle();
  if (!mem) return { success: false, message: "Je zit niet in een gang." };

  const { data: war } = await supabase.from("gang_wars").select("*").eq("id", warId).eq("status", "active").maybeSingle();
  if (!war) return { success: false, message: "Oorlog niet gevonden of al beëindigd." };

  // Check war hasn't expired
  if (new Date(war.ends_at) < new Date()) {
    // End the war
    const winner = war.attacker_score > war.defender_score ? war.attacker_gang_id :
                   war.defender_score > war.attacker_score ? war.defender_gang_id : null;
    await supabase.from("gang_wars").update({ status: "ended", ended_at: new Date().toISOString(), winner_gang_id: winner }).eq("id", warId);

    // If there's a contested district and attacker wins, transfer it
    if (winner && war.district_id && winner === war.attacker_gang_id) {
      await supabase.from("gang_territories").update({ gang_id: winner }).eq("district_id", war.district_id);
    }
    // Award 500 XP to the winning gang
    if (winner) {
      await addGangXP(supabase, winner, 500);
    }
    return { success: false, message: "Oorlog is afgelopen!" };
  }

  const isAttacker = mem.gang_id === war.attacker_gang_id;
  const isDefender = mem.gang_id === war.defender_gang_id;
  if (!isAttacker && !isDefender) return { success: false, message: "Jouw gang is niet betrokken bij deze oorlog." };

  // Cost: 10 energy, 5 nerve
  const { data: ps } = await supabase.from("player_state").select("energy, nerve, stats, level").eq("user_id", userId).maybeSingle();
  if (!ps) return { success: false, message: "Speler niet gevonden." };
  if (ps.energy < 10) return { success: false, message: "Niet genoeg energy (10 nodig)." };
  if (ps.nerve < 5) return { success: false, message: "Niet genoeg nerve (5 nodig)." };

  const muscle = (ps.stats as any)?.muscle || 1;
  // Apply gang level war bonus
  const { data: myGang } = await supabase.from("gangs").select("level").eq("id", mem.gang_id).maybeSingle();
  const warBonus = getGangWarBonus(myGang?.level || 1);
  const basePoints = Math.floor(muscle * (1 + ps.level * 0.05) + Math.random() * 10);
  const points = Math.floor(basePoints * (1 + warBonus));

  await supabase.from("player_state").update({ energy: ps.energy - 10, nerve: ps.nerve - 5 }).eq("user_id", userId);

  if (isAttacker) {
    await supabase.from("gang_wars").update({ attacker_score: war.attacker_score + points }).eq("id", warId);
  } else {
    await supabase.from("gang_wars").update({ defender_score: war.defender_score + points }).eq("id", warId);
  }

  // Award gang XP for war participation
  const xpResult = await addGangXP(supabase, mem.gang_id, points);
  const levelMsg = xpResult.leveled ? ` 🎉 Gang level ${xpResult.newLevel}!` : "";

  return { success: true, message: `+${points} punten gescoord! +${points} Gang XP.${levelMsg}`, data: { points, gangXP: points, gangLeveled: xpResult.leveled, newGangLevel: xpResult.newLevel } };
}

async function handleGangChat(supabase: any, userId: string, payload: any): Promise<ActionResult> {
  const { message } = payload || {};
  if (!message || message.trim().length === 0) return { success: false, message: "Bericht mag niet leeg zijn." };
  if (message.length > 300) return { success: false, message: "Max 300 tekens." };

  const { data: mem } = await supabase.from("gang_members").select("gang_id").eq("user_id", userId).maybeSingle();
  if (!mem) return { success: false, message: "Je zit niet in een gang." };

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();

  await supabase.from("gang_chat").insert({
    gang_id: mem.gang_id, sender_id: userId, sender_name: profile?.username || "Onbekend",
    message: message.trim().slice(0, 300),
  });

  return { success: true, message: "Bericht verstuurd." };
}

async function handleGetGangInvites(supabase: any, userId: string): Promise<ActionResult> {
  const { data: invites } = await supabase.from("gang_invites").select("id, gang_id, inviter_id, created_at").eq("invitee_id", userId);

  if (!invites || invites.length === 0) return { success: true, message: "Geen uitnodigingen.", data: { invites: [] } };

  // Resolve gang names and inviter names
  const gangIds = [...new Set(invites.map((i: any) => i.gang_id))];
  const inviterIds = [...new Set(invites.map((i: any) => i.inviter_id))];
  const [gangsRes, profilesRes] = await Promise.all([
    supabase.from("gangs").select("id, name, tag").in("id", gangIds),
    supabase.from("profiles").select("id, username").in("id", inviterIds),
  ]);

  const gangMap: Record<string, any> = {};
  (gangsRes.data || []).forEach((g: any) => { gangMap[g.id] = g; });
  const nameMap: Record<string, string> = {};
  (profilesRes.data || []).forEach((p: any) => { nameMap[p.id] = p.username; });

  const enriched = invites.map((i: any) => ({
    id: i.id, gangId: i.gang_id,
    gangName: gangMap[i.gang_id]?.name || "Onbekend",
    gangTag: gangMap[i.gang_id]?.tag || "??",
    inviterName: nameMap[i.inviter_id] || "Onbekend",
    createdAt: i.created_at,
  }));

  return { success: true, message: "Uitnodigingen opgehaald.", data: { invites: enriched } };
}

async function handleListGangs(supabase: any): Promise<ActionResult> {
  const { data: gangs } = await supabase.from("gangs").select("id, name, tag, level, leader_id, created_at")
    .order("level", { ascending: false }).limit(50);

  if (!gangs || gangs.length === 0) return { success: true, message: "Geen gangs.", data: { gangs: [] } };

  // Get member counts
  const gangIds = gangs.map((g: any) => g.id);
  const { data: members } = await supabase.from("gang_members").select("gang_id").in("gang_id", gangIds);
  const countMap: Record<string, number> = {};
  (members || []).forEach((m: any) => { countMap[m.gang_id] = (countMap[m.gang_id] || 0) + 1; });

  // Get territory counts
  const { data: territories } = await supabase.from("gang_territories").select("gang_id").in("gang_id", gangIds);
  const terrMap: Record<string, number> = {};
  (territories || []).forEach((t: any) => { terrMap[t.gang_id] = (terrMap[t.gang_id] || 0) + 1; });

  const enriched = gangs.map((g: any) => ({
    ...g, memberCount: countMap[g.id] || 0, territoryCount: terrMap[g.id] || 0,
  }));

  return { success: true, message: "Gangs opgehaald.", data: { gangs: enriched } };
}

// ========== GANG XP / LEVELING ==========

const GANG_LEVEL_XP = (level: number) => level * 500; // XP needed to reach next level
const GANG_LEVEL_MAX_MEMBERS = (level: number) => 20 + (level - 1) * 2; // +2 members per level
const GANG_LEVEL_BONUSES: Record<number, string> = {
  2: "+2 leden, +5% war score",
  3: "+2 leden, +10% war score",
  5: "+2 leden, territory korting -10%",
  7: "+2 leden, +15% war score",
  10: "+2 leden, territory korting -25%",
};

async function addGangXP(supabase: any, gangId: string, xpAmount: number): Promise<{ leveled: boolean; newLevel: number; newXp: number }> {
  const { data: gang } = await supabase.from("gangs").select("xp, level, max_members").eq("id", gangId).maybeSingle();
  if (!gang) return { leveled: false, newLevel: 1, newXp: 0 };

  let xp = (gang.xp || 0) + xpAmount;
  let level = gang.level || 1;
  let leveled = false;

  // Check for level ups (multiple possible)
  while (xp >= GANG_LEVEL_XP(level)) {
    xp -= GANG_LEVEL_XP(level);
    level++;
    leveled = true;
  }

  const newMaxMembers = GANG_LEVEL_MAX_MEMBERS(level);
  await supabase.from("gangs").update({ xp, level, max_members: newMaxMembers }).eq("id", gangId);
  return { leveled, newLevel: level, newXp: xp };
}

function getGangWarBonus(gangLevel: number): number {
  if (gangLevel >= 7) return 0.15;
  if (gangLevel >= 3) return 0.10;
  if (gangLevel >= 2) return 0.05;
  return 0;
}

function getGangTerritoryDiscount(gangLevel: number): number {
  if (gangLevel >= 10) return 0.25;
  if (gangLevel >= 5) return 0.10;
  return 0;
}

// ========== RIVALRY & BOUNTY HELPERS ==========

async function upsertRivalry(supabase: any, playerId: string, rivalId: string, score: number, source: string) {
  const { data: existing } = await supabase.from("player_rivalries")
    .select("id, rivalry_score").eq("player_id", playerId).eq("rival_id", rivalId).maybeSingle();
  if (existing) {
    await supabase.from("player_rivalries").update({
      rivalry_score: existing.rivalry_score + score,
      source, last_interaction: new Date().toISOString(),
    }).eq("id", existing.id);
  } else {
    await supabase.from("player_rivalries").insert({
      player_id: playerId, rival_id: rivalId, rivalry_score: score, source,
    });
  }
  // Also create reverse rivalry (so both sides see it)
  const { data: reverse } = await supabase.from("player_rivalries")
    .select("id, rivalry_score").eq("player_id", rivalId).eq("rival_id", playerId).maybeSingle();
  if (reverse) {
    await supabase.from("player_rivalries").update({
      rivalry_score: reverse.rivalry_score + Math.floor(score / 2),
      last_interaction: new Date().toISOString(),
    }).eq("id", reverse.id);
  } else {
    await supabase.from("player_rivalries").insert({
      player_id: rivalId, rival_id: playerId, rivalry_score: Math.floor(score / 2), source,
    });
  }
}

// ========== MOST WANTED / BOUNTY ACTIONS ==========

async function handlePlaceBounty(supabase: any, userId: string, ps: any, payload: any): Promise<ActionResult> {
  const { targetUserId, amount } = payload || {};
  if (!targetUserId || !amount) return { success: false, message: "Ongeldige parameters." };
  if (targetUserId === userId) return { success: false, message: "Je kunt geen premie op jezelf zetten." };
  if (amount < 1000) return { success: false, message: "Minimaal €1.000 premie." };
  if (amount > 500000) return { success: false, message: "Maximaal €500.000 premie." };
  if (ps.money < amount) return { success: false, message: "Niet genoeg geld." };

  // Check target exists
  const { data: target } = await supabase.from("profiles").select("username").eq("id", targetUserId).maybeSingle();
  if (!target) return { success: false, message: "Speler niet gevonden." };

  // Check if already has active bounty on this target
  const { data: existing } = await supabase.from("player_bounties")
    .select("id").eq("placer_id", userId).eq("target_id", targetUserId).eq("status", "active").maybeSingle();
  if (existing) return { success: false, message: "Je hebt al een actieve premie op dit doelwit." };

  // Deduct money
  await supabase.from("player_state").update({
    money: ps.money - amount,
    stats_total_spent: (ps.stats_total_spent || 0) + amount,
    last_action_at: new Date().toISOString(),
  }).eq("user_id", userId);

  // Create bounty
  await supabase.from("player_bounties").insert({
    placer_id: userId, target_id: targetUserId, amount, reason: "rivalry",
  });

  // Create rivalry from bounty
  await upsertRivalry(supabase, userId, targetUserId, 15, "bounty");

  return {
    success: true,
    message: `🎯 Premie van €${amount.toLocaleString()} geplaatst op ${target.username}!`,
    data: { targetName: target.username, amount },
  };
}

async function handleGetMostWanted(supabase: any, userId: string): Promise<ActionResult> {
  // Get top bounties (active)
  const { data: bounties } = await supabase.from("player_bounties")
    .select("id, target_id, amount, placer_id, reason, created_at, expires_at")
    .eq("status", "active")
    .order("amount", { ascending: false })
    .limit(20);

  // Get unique target IDs for profile lookup
  const targetIds = [...new Set((bounties || []).map((b: any) => b.target_id))];
  const placerIds = [...new Set((bounties || []).map((b: any) => b.placer_id))];
  const allIds = [...new Set([...targetIds, ...placerIds])];

  const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", allIds);
  const profileMap: Record<string, string> = {};
  for (const p of (profiles || [])) profileMap[p.id] = p.username;

  // Get player's own rivalries
  const { data: rivalries } = await supabase.from("player_rivalries")
    .select("rival_id, rivalry_score, source, last_interaction")
    .eq("player_id", userId)
    .order("rivalry_score", { ascending: false })
    .limit(10);

  // Enrich rivalries with profiles and state
  const rivalIds = (rivalries || []).map((r: any) => r.rival_id);
  const { data: rivalStates } = await supabase.from("player_state")
    .select("user_id, level, rep, loc")
    .in("user_id", rivalIds.length > 0 ? rivalIds : ["none"]);
  const stateMap: Record<string, any> = {};
  for (const s of (rivalStates || [])) stateMap[s.user_id] = s;

  // Aggregate bounties per target
  const bountyTotals: Record<string, number> = {};
  for (const b of (bounties || [])) {
    bountyTotals[b.target_id] = (bountyTotals[b.target_id] || 0) + b.amount;
  }

  // Build Most Wanted list (top targets by total bounty)
  const mostWanted = Object.entries(bountyTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([targetId, totalBounty], i) => ({
      rank: i + 1,
      userId: targetId,
      username: profileMap[targetId] || "Onbekend",
      totalBounty,
      bountyCount: (bounties || []).filter((b: any) => b.target_id === targetId).length,
    }));

  return {
    success: true,
    message: "Most Wanted opgehaald.",
    data: {
      mostWanted,
      myRivals: (rivalries || []).map((r: any) => ({
        userId: r.rival_id,
        username: profileMap[r.rival_id] || "Onbekend",
        score: r.rivalry_score,
        source: r.source,
        level: stateMap[r.rival_id]?.level || 1,
        rep: stateMap[r.rival_id]?.rep || 0,
        loc: stateMap[r.rival_id]?.loc || "?",
        lastInteraction: r.last_interaction,
      })),
      activeBounties: (bounties || []).map((b: any) => ({
        id: b.id,
        targetId: b.target_id,
        targetName: profileMap[b.target_id] || "Onbekend",
        placerName: profileMap[b.placer_id] || "Anoniem",
        amount: b.amount,
        expiresAt: b.expires_at,
      })),
      myBounties: (bounties || []).filter((b: any) => b.target_id === userId).map((b: any) => ({
        id: b.id,
        placerName: profileMap[b.placer_id] || "Anoniem",
        amount: b.amount,
      })),
    },
  };
}

// ========== DISTRICT INFLUENCE ==========

async function handleContributeInfluence(supabase: any, userId: string, ps: any, payload: any): Promise<ActionResult> {
  const { districtId, amount } = payload || {};
  if (!districtId || !amount || amount < 500) return { success: false, message: "Minimaal €500 invloed bijdragen." };

  const validDistricts = ["port", "crown", "iron", "low", "neon"];
  if (!validDistricts.includes(districtId)) return { success: false, message: "Ongeldig district." };

  // Must be in a gang
  const { data: mem } = await supabase.from("gang_members").select("gang_id").eq("user_id", userId).maybeSingle();
  if (!mem) return { success: false, message: "Je moet in een gang zitten om invloed bij te dragen." };

  // Must be in the district
  if (ps.loc !== districtId) return { success: false, message: "Je moet in dit district zijn." };

  // Check money
  if (ps.money < amount) return { success: false, message: "Niet genoeg geld." };

  // Convert money to influence (€500 = 1 influence point)
  const influenceGain = Math.floor(amount / 500);
  const actualCost = influenceGain * 500;

  // Update player money
  await supabase.from("player_state").update({
    money: ps.money - actualCost,
    stats_total_spent: (ps.stats_total_spent || 0) + actualCost,
    last_action_at: new Date().toISOString(),
  }).eq("user_id", userId);

  // Upsert influence record
  const { data: existing } = await supabase.from("district_influence")
    .select("id, influence").eq("user_id", userId).eq("district_id", districtId).maybeSingle();

  if (existing) {
    await supabase.from("district_influence").update({
      influence: existing.influence + influenceGain,
      gang_id: mem.gang_id,
      updated_at: new Date().toISOString(),
    }).eq("id", existing.id);
  } else {
    await supabase.from("district_influence").insert({
      user_id: userId, gang_id: mem.gang_id, district_id: districtId, influence: influenceGain,
    });
  }

  // Check if gang has enough influence to claim the territory
  const { data: gangInfluence } = await supabase.from("district_influence")
    .select("influence").eq("gang_id", mem.gang_id).eq("district_id", districtId);
  const totalGangInfluence = (gangInfluence || []).reduce((s: number, r: any) => s + (r.influence || 0), 0);

  // Threshold to control a district: 100 influence
  const CONTROL_THRESHOLD = 100;
  let controlMsg = "";

  if (totalGangInfluence >= CONTROL_THRESHOLD) {
    // Check if already controlled by this gang
    const { data: existingTerritory } = await supabase.from("gang_territories")
      .select("gang_id").eq("district_id", districtId).maybeSingle();

    if (!existingTerritory) {
      // Claim it
      await supabase.from("gang_territories").insert({
        gang_id: mem.gang_id, district_id: districtId, total_influence: totalGangInfluence,
      });
      const xpResult = await addGangXP(supabase, mem.gang_id, 200);
      controlMsg = ` 🏴 Jullie gang controleert nu ${districtId}! +200 Gang XP.${xpResult.leveled ? ` Level ${xpResult.newLevel}!` : ""}`;
    } else if (existingTerritory.gang_id !== mem.gang_id) {
      // Contested — need to also overcome the existing gang's influence
      const { data: defenderInfluence } = await supabase.from("district_influence")
        .select("influence").eq("gang_id", existingTerritory.gang_id).eq("district_id", districtId);
      const defTotal = (defenderInfluence || []).reduce((s: number, r: any) => s + (r.influence || 0), 0);

      if (totalGangInfluence > defTotal + 50) {
        // Overtake
        await supabase.from("gang_territories").update({
          gang_id: mem.gang_id, total_influence: totalGangInfluence, captured_at: new Date().toISOString(),
        }).eq("district_id", districtId);
        const xpResult = await addGangXP(supabase, mem.gang_id, 300);
        controlMsg = ` ⚔️ District overgenomen van vijandige gang! +300 Gang XP.${xpResult.leveled ? ` Level ${xpResult.newLevel}!` : ""}`;
      }
    } else {
      // Update total influence
      await supabase.from("gang_territories").update({ total_influence: totalGangInfluence }).eq("district_id", districtId);
    }
  }

  return {
    success: true,
    message: `+${influenceGain} invloed in ${districtId} (€${actualCost.toLocaleString()}).${controlMsg}`,
    data: { influenceGain, totalGangInfluence, controlThreshold: CONTROL_THRESHOLD },
  };
}

async function handleGetDistrictInfo(supabase: any, userId: string): Promise<ActionResult> {
  // Get all gang territories
  const { data: territories } = await supabase.from("gang_territories")
    .select("district_id, gang_id, total_influence, gangs(name, tag)");

  // Get player's gang
  const { data: mem } = await supabase.from("gang_members").select("gang_id").eq("user_id", userId).maybeSingle();

  // Get player's influence
  const { data: myInfluence } = await supabase.from("district_influence")
    .select("district_id, influence").eq("user_id", userId);

  // Get gang's total influence per district (if in gang)
  let gangInfluence: any[] = [];
  if (mem) {
    const { data: gi } = await supabase.from("district_influence")
      .select("district_id, influence").eq("gang_id", mem.gang_id);
    gangInfluence = gi || [];
  }

  // Aggregate gang influence per district
  const gangInfluenceMap: Record<string, number> = {};
  for (const gi of gangInfluence) {
    gangInfluenceMap[gi.district_id] = (gangInfluenceMap[gi.district_id] || 0) + gi.influence;
  }

  return {
    success: true,
    message: "District info opgehaald.",
    data: {
      territories: (territories || []).map((t: any) => ({
        districtId: t.district_id,
        gangId: t.gang_id,
        gangName: t.gangs?.name || "Onbekend",
        gangTag: t.gangs?.tag || "??",
        totalInfluence: t.total_influence,
      })),
      myInfluence: (myInfluence || []).reduce((m: any, r: any) => { m[r.district_id] = r.influence; return m; }, {}),
      gangInfluence: gangInfluenceMap,
      gangId: mem?.gang_id || null,
    },
  };
}

async function handleDistrictLeaderboard(supabase: any): Promise<ActionResult> {
  // Get all gang territories with gang info
  const { data: territories } = await supabase.from("gang_territories")
    .select("district_id, gang_id, total_influence, defense_level, gangs(name, tag, level)");

  // Get all individual contributions grouped by district
  const { data: allInfluence } = await supabase.from("district_influence")
    .select("district_id, gang_id, user_id, influence")
    .order("influence", { ascending: false });

  // Get profiles for top contributors
  const userIds = [...new Set((allInfluence || []).map((i: any) => i.user_id))];
  const { data: profiles } = await supabase.from("profiles")
    .select("id, username").in("id", userIds.length > 0 ? userIds : ["none"]);
  const profileMap: Record<string, string> = {};
  for (const p of (profiles || [])) profileMap[p.id] = p.username;

  // Get gang names
  const gangIds = [...new Set((allInfluence || []).map((i: any) => i.gang_id))];
  const { data: gangs } = await supabase.from("gangs")
    .select("id, name, tag, level").in("id", gangIds.length > 0 ? gangIds : ["none"]);
  const gangMap: Record<string, any> = {};
  for (const g of (gangs || [])) gangMap[g.id] = g;

  // Build per-district data
  const districtIds = ["low", "iron", "neon", "port", "crown"];
  const result: any[] = districtIds.map(districtId => {
    // Controlling gang (from territories)
    const terr = (territories || []).find((t: any) => t.district_id === districtId);
    
    // All gangs with influence in this district
    const distInfluence = (allInfluence || []).filter((i: any) => i.district_id === districtId);
    
    // Aggregate by gang
    const gangTotals: Record<string, { gangId: string; name: string; tag: string; level: number; total: number; members: { userId: string; username: string; influence: number }[] }> = {};
    for (const inf of distInfluence) {
      if (!gangTotals[inf.gang_id]) {
        const g = gangMap[inf.gang_id];
        gangTotals[inf.gang_id] = {
          gangId: inf.gang_id,
          name: g?.name || "Onbekend",
          tag: g?.tag || "??",
          level: g?.level || 1,
          total: 0,
          members: [],
        };
      }
      gangTotals[inf.gang_id].total += inf.influence;
      gangTotals[inf.gang_id].members.push({
        userId: inf.user_id,
        username: profileMap[inf.user_id] || "Onbekend",
        influence: inf.influence,
      });
    }

    // Sort gangs by total influence desc
    const gangRanking = Object.values(gangTotals)
      .sort((a, b) => b.total - a.total);
    
    // Sort members within each gang
    for (const g of gangRanking) {
      g.members.sort((a, b) => b.influence - a.influence);
      g.members = g.members.slice(0, 5); // top 5 per gang
    }

    // Top contributors across all gangs
    const topContributors = distInfluence
      .sort((a: any, b: any) => b.influence - a.influence)
      .slice(0, 10)
      .map((i: any) => ({
        userId: i.user_id,
        username: profileMap[i.user_id] || "Onbekend",
        gangName: gangMap[i.gang_id]?.name || "?",
        gangTag: gangMap[i.gang_id]?.tag || "?",
        influence: i.influence,
      }));

    return {
      districtId,
      controller: terr ? {
        gangId: terr.gang_id,
        gangName: terr.gangs?.name || "Onbekend",
        gangTag: terr.gangs?.tag || "??",
        gangLevel: terr.gangs?.level || 1,
        totalInfluence: terr.total_influence,
        defenseLevel: terr.defense_level,
      } : null,
      gangRanking: gangRanking.slice(0, 5),
      topContributors,
      totalInfluence: distInfluence.reduce((s: number, i: any) => s + i.influence, 0),
    };
  });

  return { success: true, message: "District leaderboard opgehaald.", data: { districts: result } };
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
      case "get_market_prices":
        result = await handleGetMarketPrices(supabase, user.id, playerState);
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
      case "create_gang":
        result = await handleCreateGang(supabase, user.id, payload);
        break;
      case "get_gang":
        result = await handleGetGang(supabase, user.id, payload);
        break;
      case "gang_invite":
        result = await handleGangInvite(supabase, user.id, payload);
        break;
      case "gang_accept_invite":
        result = await handleGangAcceptInvite(supabase, user.id, payload);
        break;
      case "gang_leave":
        result = await handleGangLeave(supabase, user.id);
        break;
      case "gang_kick":
        result = await handleGangKick(supabase, user.id, payload);
        break;
      case "gang_promote":
        result = await handleGangPromote(supabase, user.id, payload);
        break;
      case "gang_claim_territory":
        result = await handleGangClaimTerritory(supabase, user.id, payload);
        break;
      case "gang_donate":
        result = await handleGangDonate(supabase, user.id, payload);
        break;
      case "gang_declare_war":
        result = await handleGangDeclareWar(supabase, user.id, payload);
        break;
      case "gang_war_attack":
        result = await handleGangWarAttack(supabase, user.id, payload);
        break;
      case "gang_chat":
        result = await handleGangChat(supabase, user.id, payload);
        break;
      case "get_gang_invites":
        result = await handleGetGangInvites(supabase, user.id);
        break;
      case "list_gangs":
        result = await handleListGangs(supabase);
        break;
      case "contribute_influence":
        result = await handleContributeInfluence(supabase, user.id, playerState, payload);
        break;
      case "get_district_info":
        result = await handleGetDistrictInfo(supabase, user.id);
        break;
      case "place_bounty":
        result = await handlePlaceBounty(supabase, user.id, playerState, payload);
        break;
      case "district_leaderboard":
        result = await handleDistrictLeaderboard(supabase);
        break;
      case "get_most_wanted":
        result = await handleGetMostWanted(supabase, user.id);
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
