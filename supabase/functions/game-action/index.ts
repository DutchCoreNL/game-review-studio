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

// ========== TIME-OF-DAY MODIFIERS ==========

interface TimeModifiers {
  crimeSuccessBonus: number;
  tradeIncomeMultiplier: number;
  heatMultiplier: number;
  raidChanceMultiplier: number;
  xpMultiplier: number;
  phase: string;
  activeEventName: string | null;
}

async function getTimeModifiers(supabase: any): Promise<TimeModifiers> {
  try {
    const { data: ws } = await supabase.from('world_state').select('time_of_day, active_event').eq('id', 1).single();
    const phase = ws?.time_of_day || 'day';
    const activeEvent = ws?.active_event;
    const xpMult = activeEvent?.xp_multiplier || 1;
    const eventName = activeEvent?.name || null;

    switch (phase) {
      case 'night':
        return { crimeSuccessBonus: 10, tradeIncomeMultiplier: 1.15, heatMultiplier: 0.7, raidChanceMultiplier: 0.5, xpMultiplier: xpMult, phase, activeEventName: eventName };
      case 'dusk':
        return { crimeSuccessBonus: 5, tradeIncomeMultiplier: 1.05, heatMultiplier: 0.85, raidChanceMultiplier: 0.75, xpMultiplier: xpMult, phase, activeEventName: eventName };
      case 'dawn':
        return { crimeSuccessBonus: -5, tradeIncomeMultiplier: 0.95, heatMultiplier: 1.1, raidChanceMultiplier: 1.1, xpMultiplier: xpMult, phase, activeEventName: eventName };
      case 'day':
      default:
        return { crimeSuccessBonus: 0, tradeIncomeMultiplier: 1.0, heatMultiplier: 1.0, raidChanceMultiplier: 1.0, xpMultiplier: xpMult, phase, activeEventName: eventName };
    }
  } catch {
    return { crimeSuccessBonus: 0, tradeIncomeMultiplier: 1.0, heatMultiplier: 1.0, raidChanceMultiplier: 1.0, xpMultiplier: 1, phase: 'day', activeEventName: null };
  }
}

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

// ========== PLAYER NEWS HELPER ==========

const DISTRICT_NAMES: Record<string, string> = { low: 'Lowrise', port: 'Port Nero', iron: 'Iron Borough', neon: 'Neon Strip', crown: 'Crown Heights' };

async function insertPlayerNews(supabase: any, opts: { text: string; icon: string; detail?: string; urgency?: string; category?: string; districtId?: string }) {
  try {
    await supabase.from("news_events").insert({
      text: opts.text,
      icon: opts.icon,
      category: opts.category || 'player',
      urgency: opts.urgency || 'medium',
      detail: opts.detail || null,
      district_id: opts.districtId || null,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2h expiry
    });
  } catch (e) {
    console.error("Player news insert error (non-fatal):", e);
  }
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

  // Time-of-day trade modifiers
  const timeMods = await getTimeModifiers(supabase);

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
    const sellPrice = Math.floor(livePrice * 0.85 * (1 + charmBonus) * timeMods.tradeIncomeMultiplier);
    const totalRevenue = sellPrice * actualQty;
    const remainingQty = currentQty - actualQty;
    const repGain = Math.floor(2 * actualQty);
    const profitPerUnit = sellPrice - currentAvgCost;
    const nightLabel = timeMods.phase === 'night' ? ' 🌙' : timeMods.phase === 'dusk' ? ' 🌆' : '';

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

    return { success: true, message: `${actualQty}x ${good.name} verkocht voor €${totalRevenue}${nightLabel} (${profitPerUnit >= 0 ? '+' : ''}€${profitPerUnit}/stuk)`, data: { quantity: actualQty, totalRevenue, newMoney: ps.money + totalRevenue, profitPerUnit, marketPrice: newPrice, timeBonus: timeMods.phase } };
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

  // Time-of-day modifiers
  const timeMods = await getTimeModifiers(supabase);

  // Check if player owns Lowrise for risk reduction
  const { data: ownedDistricts } = await supabase.from("player_districts").select("district_id").eq("user_id", userId);
  const ownsLowrise = (ownedDistricts || []).some((d: any) => d.district_id === "low");
  const effectiveRisk = ownsLowrise ? Math.floor(op.risk * 0.7) : op.risk;

  const chance = Math.min(95, 100 - effectiveRisk + statVal * 5 + timeMods.crimeSuccessBonus);
  const rewardMultiplier = timeMods.phase === 'night' ? 1.2 : timeMods.phase === 'dusk' ? 1.1 : 1.0;
  const scaledReward = Math.floor(op.reward * Math.min(3, 1 + ps.level * 0.1) * rewardMultiplier);
  const roll = Math.random() * 100;
  const success = roll < chance;

  const energyCost = ENERGY_COSTS.solo_op || 10;
  const nerveCost = NERVE_COSTS.solo_op || 5;
  const crimeCooldown = new Date(Date.now() + 60 * 1000).toISOString(); // 60s cooldown

  const nightLabel = timeMods.phase === 'night' ? ' 🌙' : timeMods.phase === 'dusk' ? ' 🌆' : '';

  if (success) {
    const adjustedHeat = Math.floor(op.heat * timeMods.heatMultiplier);
    const heatGain = Math.min(100, (ps.heat || 0) + adjustedHeat) - (ps.heat || 0);
    const repGain = 10;

    await supabase.from("player_state").update({
      dirty_money: (ps.dirty_money || 0) + scaledReward,
      heat: Math.min(100, (ps.heat || 0) + adjustedHeat),
      personal_heat: Math.min(100, (ps.personal_heat || 0) + Math.floor(adjustedHeat * 0.4)),
      rep: (ps.rep || 0) + repGain,
      energy: ps.energy - energyCost,
      nerve: ps.nerve - nerveCost,
      crime_cooldown_until: crimeCooldown,
      stats_total_earned: (ps.stats_total_earned || 0) + scaledReward,
      stats_missions_completed: (ps.stats_missions_completed || 0) + 1,
      xp: ps.xp + Math.floor(15 * timeMods.xpMultiplier),
      last_action_at: new Date().toISOString(),
    }).eq("user_id", userId);

    return {
      success: true,
      message: `${op.name} geslaagd!${nightLabel} +€${scaledReward.toLocaleString()} zwart geld.`,
      data: { reward: scaledReward, heatGain, repGain, chance: Math.round(chance), crimeCooldown, timeBonus: timeMods.phase },
    };
  } else {
    const failHeat = Math.floor(op.heat * 1.5 * timeMods.heatMultiplier);
    const nearMissDiff = Math.round(chance);
    const statLabel = op.stat === "muscle" ? "Kracht" : op.stat === "brains" ? "Vernuft" : "Charisma";
    let nearMiss = `Slagingskans was ${nearMissDiff}%.`;
    if (nearMissDiff >= 60) nearMiss += ` Bijna! Upgrade je ${statLabel}.`;
    else if (nearMissDiff >= 40) nearMiss += ` Verbeter je ${statLabel}.`;
    else nearMiss += ` Meer training nodig.`;

    // Chance of arrest on failure — reduced at night
    const baseArrestChance = op.risk > 70 ? 0.3 : 0.15;
    const arrestChance = baseArrestChance * timeMods.raidChanceMultiplier;
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

// ========== CLOUD SAVE / LOAD ==========

async function handleSaveState(supabase: any, userId: string, payload: { saveData: any; day: number }): Promise<ActionResult> {
  if (!payload?.saveData) return { success: false, message: "Geen save data ontvangen." };

  // Strip sensitive/transient fields before storing
  const cleanData = { ...payload.saveData };
  delete cleanData.showPhone;
  delete cleanData.activeCombat;
  delete cleanData.pendingMinigame;
  delete cleanData.screenEffect;

  // Check if player_state row exists; create if not
  const { data: existing } = await supabase.from("player_state")
    .select("save_version").eq("user_id", userId).maybeSingle();

  if (!existing) {
    // Auto-init player state row so save works even if init_player wasn't called
    const { error: initErr } = await supabase.from("player_state").insert({ user_id: userId });
    if (initErr) return { success: false, message: `Init mislukt: ${initErr.message}` };
  }

  const newVersion = (existing?.save_version || 0) + 1;

  const { error } = await supabase.from("player_state").update({
    save_data: cleanData,
    save_version: newVersion,
    last_save_at: new Date().toISOString(),
    day: payload.day || cleanData.day || 1,
  }).eq("user_id", userId);

  if (error) return { success: false, message: `Save mislukt: ${error.message}` };
  return { success: true, message: "Cloud save opgeslagen.", data: { saveVersion: newVersion } };
}

async function handleLoadState(supabase: any, userId: string): Promise<ActionResult> {
  const { data: ps } = await supabase.from("player_state")
    .select("save_data, save_version, last_save_at, day")
    .eq("user_id", userId).maybeSingle();

  if (!ps || !ps.save_data) return { success: false, message: "Geen cloud save gevonden." };

  return {
    success: true,
    message: "Cloud save geladen.",
    data: {
      saveData: ps.save_data,
      saveVersion: ps.save_version,
      lastSaveAt: ps.last_save_at,
      day: ps.day,
    },
  };
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

// ========== PVP COMBAT (TURN-BASED) ==========

const PVP_COMBAT_SKILLS: { id: string; name: string; icon: string; unlockLevel: number; cooldownTurns: number; effect: any }[] = [
  { id: "snelle_slag", name: "Snelle Slag", icon: "⚡", unlockLevel: 1, cooldownTurns: 0, effect: { type: "damage", value: 8 } },
  { id: "schild_muur", name: "Schild Muur", icon: "🛡️", unlockLevel: 3, cooldownTurns: 4, effect: { type: "buff", buffId: "defense_boost", duration: 2 } },
  { id: "adrenaline_rush", name: "Adrenaline Rush", icon: "💉", unlockLevel: 6, cooldownTurns: 5, effect: { type: "heal_and_buff", healAmount: 20, buffId: "damage_boost", duration: 3 } },
  { id: "vuistcombo", name: "Vuistcombo", icon: "👊", unlockLevel: 8, cooldownTurns: 3, effect: { type: "multi_hit", hits: 3, damagePerHit: 6 } },
  { id: "dodelijke_precisie", name: "Dodelijke Precisie", icon: "🎯", unlockLevel: 11, cooldownTurns: 4, effect: { type: "crit", multiplier: 2.5 } },
  { id: "intimidatie", name: "Intimidatie", icon: "😈", unlockLevel: 13, cooldownTurns: 5, effect: { type: "stun", chance: 0.7, stat: "charm" } },
  { id: "executie", name: "Executie", icon: "💀", unlockLevel: 16, cooldownTurns: 6, effect: { type: "execute", thresholdPct: 0.3, bonusDamage: 25 } },
];

const COMBO_THRESHOLD = 3;
const COMBO_FINISHER_DAMAGE = 35;

interface PvPCombatFighterState {
  hp: number;
  maxHp: number;
  muscle: number;
  brains: number;
  charm: number;
  level: number;
  loadout: Record<string, string | null>;
  activeBuffs: { id: string; duration: number }[];
  skillCooldowns: Record<string, number>;
  comboCounter: number;
  stunned: boolean;
}

function createFighterState(ps: any): PvPCombatFighterState {
  return {
    hp: ps.hp || 100,
    maxHp: ps.max_hp || 100,
    muscle: getPlayerStat(ps.stats || {}, ps.loadout || {}, "muscle"),
    brains: getPlayerStat(ps.stats || {}, ps.loadout || {}, "brains"),
    charm: getPlayerStat(ps.stats || {}, ps.loadout || {}, "charm"),
    level: ps.level || 1,
    loadout: ps.loadout || { weapon: null, armor: null, gadget: null },
    activeBuffs: [],
    skillCooldowns: {},
    comboCounter: 0,
    stunned: false,
  };
}

function pvpApplySkill(attacker: PvPCombatFighterState, defender: PvPCombatFighterState, skillId: string): { damage: number; log: string; stunApplied: boolean } {
  const skill = PVP_COMBAT_SKILLS.find(s => s.id === skillId);
  if (!skill) return { damage: 0, log: "Onbekende skill.", stunApplied: false };
  const eff = skill.effect;
  let damage = 0;
  let log = "";
  let stunApplied = false;

  switch (eff.type) {
    case "damage":
      damage = Math.floor(attacker.muscle * 2 + (eff.value || 8) + Math.random() * 5);
      log = `${skill.icon} ${skill.name}! ${damage} schade!`;
      break;
    case "buff":
      attacker.activeBuffs.push({ id: eff.buffId, duration: eff.duration });
      log = `${skill.icon} ${skill.name} geactiveerd!`;
      break;
    case "heal_and_buff":
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + (eff.healAmount || 0));
      attacker.activeBuffs.push({ id: eff.buffId, duration: eff.duration });
      log = `${skill.icon} ${skill.name}! +${eff.healAmount} HP!`;
      break;
    case "multi_hit": {
      const hits = eff.hits || 3;
      for (let i = 0; i < hits; i++) damage += Math.floor((eff.damagePerHit || 6) + attacker.muscle * 0.8 + Math.random() * 3);
      log = `${skill.icon} ${skill.name}! ${hits}x treffer = ${damage} schade!`;
      break;
    }
    case "crit":
      damage = Math.floor((10 + attacker.muscle * 2.5 + Math.random() * 8) * (eff.multiplier || 2.5));
      log = `${skill.icon} ${skill.name}! KRITIEK! ${damage} schade!`;
      break;
    case "stun": {
      const statVal = eff.stat === "charm" ? attacker.charm : attacker.muscle;
      if (Math.random() < (eff.chance || 0.7) + statVal * 0.02) {
        stunApplied = true;
        damage = Math.floor(3 + attacker.charm);
        log = `${skill.icon} ${skill.name}! Vijand STUNNED! +${damage} schade.`;
      } else {
        log = `${skill.icon} ${skill.name} mislukt!`;
      }
      break;
    }
    case "execute": {
      if (defender.hp <= defender.maxHp * (eff.thresholdPct || 0.3)) {
        damage = Math.floor(attacker.muscle * 3 + (eff.bonusDamage || 25) + Math.random() * 10);
        log = `${skill.icon} ${skill.name}! EXECUTIE! ${damage} schade!`;
      } else {
        damage = Math.floor(attacker.muscle * 2 + Math.random() * 8);
        log = `${skill.icon} ${skill.name}! ${damage} schade.`;
      }
      break;
    }
  }

  // Apply damage boost buff
  if (damage > 0 && attacker.activeBuffs.some(b => b.id === "damage_boost")) {
    damage = Math.floor(damage * 1.3);
  }
  // Apply defense boost on defender
  if (damage > 0 && defender.activeBuffs.some(b => b.id === "defense_boost")) {
    damage = Math.floor(damage * 0.5);
  }

  return { damage, log, stunApplied };
}

function pvpTickBuffsAndCooldowns(fighter: PvPCombatFighterState) {
  fighter.activeBuffs = fighter.activeBuffs.map(b => ({ ...b, duration: b.duration - 1 })).filter(b => b.duration > 0);
  for (const key of Object.keys(fighter.skillCooldowns)) {
    fighter.skillCooldowns[key] = Math.max(0, fighter.skillCooldowns[key] - 1);
    if (fighter.skillCooldowns[key] <= 0) delete fighter.skillCooldowns[key];
  }
}

function pvpBasicAttack(attacker: PvPCombatFighterState, defender: PvPCombatFighterState, actionType: "attack" | "heavy" | "defend"): { damage: number; counterDamage: number; log: string; counterLog: string } {
  let damage = 0;
  let log = "";
  if (actionType === "attack") {
    damage = Math.floor(5 + attacker.muscle * 1.5 + Math.random() * 8);
    if (attacker.activeBuffs.some(b => b.id === "damage_boost")) damage = Math.floor(damage * 1.3);
    if (defender.activeBuffs.some(b => b.id === "defense_boost")) damage = Math.floor(damage * 0.5);
    log = `⚔️ Aanval! ${damage} schade.`;
  } else if (actionType === "heavy") {
    damage = Math.floor(10 + attacker.muscle * 2.5 + Math.random() * 12);
    if (attacker.activeBuffs.some(b => b.id === "damage_boost")) damage = Math.floor(damage * 1.3);
    if (defender.activeBuffs.some(b => b.id === "defense_boost")) damage = Math.floor(damage * 0.5);
    log = `💥 Zware aanval! ${damage} schade!`;
  } else {
    damage = 0;
    log = `🛡️ Verdedigde!`;
  }

  // Counter-attack from defender (AI)
  let counterDamage = 0;
  let counterLog = "";
  if (!defender.stunned) {
    counterDamage = Math.floor(3 + defender.muscle * 1.2 + Math.random() * 6);
    if (actionType === "defend") counterDamage = Math.floor(counterDamage * 0.4);
    if (defender.activeBuffs.some(b => b.id === "damage_boost")) counterDamage = Math.floor(counterDamage * 1.3);
    if (attacker.activeBuffs.some(b => b.id === "defense_boost")) counterDamage = Math.floor(counterDamage * 0.5);
    counterLog = `Tegenstander slaat terug voor ${counterDamage} schade!`;
  } else {
    counterLog = "Tegenstander is verdoofd!";
    defender.stunned = false;
  }

  return { damage, counterDamage, log, counterLog };
}

async function handlePvPCombatStart(supabase: any, userId: string, ps: any, payload: { targetUserId: string }): Promise<ActionResult> {
  const { targetUserId } = payload;
  if (!targetUserId) return { success: false, message: "Geen doelwit opgegeven." };
  if (targetUserId === userId) return { success: false, message: "Je kunt jezelf niet aanvallen." };

  const blocked = checkBlocked(ps);
  if (blocked) return { success: false, message: blocked };
  const energyErr = checkEnergy(ps, "attack");
  if (energyErr) return { success: false, message: energyErr };
  const nerveErr = checkNerve(ps, "attack");
  if (nerveErr) return { success: false, message: nerveErr };

  if (ps.attack_cooldown_until && new Date(ps.attack_cooldown_until) > new Date()) {
    const secs = Math.ceil((new Date(ps.attack_cooldown_until).getTime() - Date.now()) / 1000);
    return { success: false, message: `Aanval op cooldown (${secs}s).` };
  }

  const attackerState = createFighterState(ps);
  let defenderState: PvPCombatFighterState;
  let targetName: string;
  const isBot = targetUserId.startsWith("bot_");

  if (isBot) {
    const botId = targetUserId.replace("bot_", "");
    const { data: bot } = await supabase.from("bot_players").select("*").eq("id", botId).maybeSingle();
    if (!bot) return { success: false, message: "Bot niet gevonden." };
    defenderState = {
      hp: bot.hp, maxHp: bot.max_hp, level: bot.level,
      muscle: Math.floor(bot.level * 1.5) + 3, brains: Math.floor(bot.level * 0.8), charm: Math.floor(bot.level * 0.5),
      loadout: { weapon: null, armor: null, gadget: null },
      activeBuffs: [], skillCooldowns: {}, comboCounter: 0, stunned: false,
    };
    targetName = bot.username;
  } else {
    const { data: target } = await supabase.from("player_state").select("*").eq("user_id", targetUserId).maybeSingle();
    if (!target) return { success: false, message: "Doelwit niet gevonden." };
    if (target.hospital_until && new Date(target.hospital_until) > new Date()) return { success: false, message: "Doelwit in ziekenhuis." };
    if (target.prison_until && new Date(target.prison_until) > new Date()) return { success: false, message: "Doelwit in gevangenis." };
    defenderState = createFighterState(target);
    const { data: prof } = await supabase.from("profiles").select("username").eq("id", targetUserId).maybeSingle();
    targetName = prof?.username || "Onbekend";
  }

  // Deduct energy/nerve, set cooldown
  const cooldownUntil = new Date(Date.now() + ATTACK_COOLDOWN_SECONDS * 1000).toISOString();
  await supabase.from("player_state").update({
    energy: ps.energy - (ENERGY_COSTS.attack || 15),
    nerve: ps.nerve - (NERVE_COSTS.attack || 10),
    attack_cooldown_until: cooldownUntil,
    last_action_at: new Date().toISOString(),
  }).eq("user_id", userId);

  // Create combat session
  const { data: session, error } = await supabase.from("pvp_combat_sessions").insert({
    attacker_id: userId,
    defender_id: targetUserId,
    attacker_state: attackerState,
    defender_state: defenderState,
    combat_log: [{ turn: 0, text: `Gevecht gestart tegen ${targetName}!` }],
    status: "active",
    turn: 0,
  }).select("id").single();

  if (error) return { success: false, message: "Kon gevechtssessie niet aanmaken." };

  return {
    success: true,
    message: `Gevecht gestart tegen ${targetName}!`,
    data: {
      sessionId: session.id,
      attackerState,
      defenderState,
      targetName,
      targetUserId,
    },
  };
}

async function handlePvPCombatAction(supabase: any, userId: string, payload: { sessionId: string; action: string; skillId?: string }): Promise<ActionResult> {
  const { sessionId, action, skillId } = payload;
  if (!sessionId || !action) return { success: false, message: "Ongeldige parameters." };

  const { data: session } = await supabase.from("pvp_combat_sessions").select("*").eq("id", sessionId).eq("attacker_id", userId).maybeSingle();
  if (!session) return { success: false, message: "Sessie niet gevonden." };
  if (session.status !== "active") return { success: false, message: "Gevecht is al afgelopen." };

  const attacker: PvPCombatFighterState = session.attacker_state;
  const defender: PvPCombatFighterState = session.defender_state;
  const combatLog: { turn: number; text: string }[] = session.combat_log || [];
  const turn = (session.turn || 0) + 1;
  const logs: string[] = [];

  // === GEAR SYNERGY: Apply gear-specific effects ===
  const attackerWeapon = attacker.loadout?.weapon;
  const defenderArmor = defender.loadout?.armor;
  const defenderGadget = defender.loadout?.gadget;

  // Armor damage reduction for defender
  const armorReduction = defenderArmor === 'skull_armor' ? 0.20 : defenderArmor === 'suit' ? 0.12 : defenderArmor === 'vest' ? 0.08 : 0;
  // Gadget dodge chance for defender
  const dodgeChance = defenderGadget === 'implant' ? 0.15 : defenderGadget === 'laptop' ? 0.08 : defenderGadget === 'phone' ? 0.05 : 0;

  // Weapon-specific effects for attacker
  let weaponBleedChance = 0;
  let weaponCritBonus = 0;
  if (attackerWeapon === 'shotgun') weaponBleedChance = 0.20;
  else if (attackerWeapon === 'sniper') weaponCritBonus = 0.15;
  else if (attackerWeapon === 'cartel_blade') weaponBleedChance = 0.12;
  else if (attackerWeapon === 'ak47') weaponCritBonus = 0.08;

  // Player action
  if (action === "skill" && skillId) {
    const skill = PVP_COMBAT_SKILLS.find(s => s.id === skillId);
    if (!skill) return { success: false, message: "Onbekende skill." };
    if (attacker.skillCooldowns[skillId] > 0) return { success: false, message: "Skill op cooldown." };
    attacker.skillCooldowns[skillId] = skill.cooldownTurns;
    const result = pvpApplySkill(attacker, defender, skillId);
    let dmg = result.damage;
    // Apply dodge
    if (dmg > 0 && Math.random() < dodgeChance) {
      logs.push(`💨 Tegenstander ontwijkt! (gadget bonus)`);
      dmg = 0;
    }
    // Apply armor reduction
    if (dmg > 0) dmg = Math.max(1, Math.floor(dmg * (1 - armorReduction)));
    // Weapon crit bonus
    if (dmg > 0 && Math.random() < weaponCritBonus) {
      dmg = Math.floor(dmg * 1.5);
      logs.push(`🎯 Kritieke treffer! (wapen bonus)`);
    }
    defender.hp = Math.max(0, defender.hp - dmg);
    if (result.stunApplied) defender.stunned = true;
    if (dmg > 0) attacker.comboCounter++;
    // Weapon bleed effect
    if (dmg > 0 && Math.random() < weaponBleedChance) {
      defender.activeBuffs.push({ id: 'bleed', duration: 2 });
      logs.push(`🩸 Bloeding toegebracht! (wapen effect)`);
    }
    logs.push(result.log);
  } else if (action === "combo_finisher") {
    if (attacker.comboCounter < COMBO_THRESHOLD) return { success: false, message: "Combo meter niet vol." };
    let damage = COMBO_FINISHER_DAMAGE + Math.floor(attacker.muscle * 2);
    if (attacker.activeBuffs.some(b => b.id === "damage_boost")) damage = Math.floor(damage * 1.3);
    if (defender.activeBuffs.some(b => b.id === "defense_boost")) damage = Math.floor(damage * 0.5);
    damage = Math.max(1, Math.floor(damage * (1 - armorReduction)));
    defender.hp = Math.max(0, defender.hp - damage);
    if (Math.random() < 0.4) { defender.stunned = true; logs.push("💫 STUNNED!"); }
    attacker.comboCounter = 0;
    logs.push(`🔥 COMBO FINISHER! ${damage} schade!`);
  } else {
    const basicAction = (["attack", "heavy", "defend"].includes(action) ? action : "attack") as "attack" | "heavy" | "defend";
    const result = pvpBasicAttack(attacker, defender, basicAction);
    let dmg = result.damage;
    // Apply dodge & armor
    if (dmg > 0 && Math.random() < dodgeChance) { dmg = 0; logs.push(`💨 Ontwijkt!`); }
    if (dmg > 0) dmg = Math.max(1, Math.floor(dmg * (1 - armorReduction)));
    if (dmg > 0 && Math.random() < weaponCritBonus) { dmg = Math.floor(dmg * 1.5); logs.push(`🎯 Kritiek!`); }
    defender.hp = Math.max(0, defender.hp - dmg);
    attacker.hp = Math.max(0, attacker.hp - result.counterDamage);
    if (basicAction !== "defend" && dmg > 0) attacker.comboCounter++;
    else if (basicAction === "defend") attacker.comboCounter = 0;
    // Weapon bleed on basic attack
    if (dmg > 0 && Math.random() < weaponBleedChance) {
      defender.activeBuffs.push({ id: 'bleed', duration: 2 });
      logs.push(`🩸 Bloeding!`);
    }
    logs.push(result.log);
    if (defender.hp > 0 && attacker.hp > 0) logs.push(result.counterLog);
  }

  // Apply bleed damage on defender
  if (defender.activeBuffs.some(b => b.id === 'bleed')) {
    defender.hp = Math.max(0, defender.hp - 5);
    logs.push(`🩸 Bloedingsschade: ${defender.activeBuffs.filter(b => b.id === 'bleed').length * 5} HP`);
  }

  // Check if combat ended
  let status = "active";
  let winnerId: string | null = null;

  if (defender.hp <= 0) {
    status = "finished"; winnerId = userId;
    logs.push("🏆 Je hebt gewonnen!");
  } else if (attacker.hp <= 0) {
    status = "finished"; winnerId = session.defender_id;
    logs.push("💀 Je bent verslagen...");
  } else if (turn >= 20) {
    status = "finished";
    const attackerPct = attacker.hp / attacker.maxHp;
    const defenderPct = defender.hp / defender.maxHp;
    winnerId = attackerPct >= defenderPct ? userId : session.defender_id;
    logs.push(winnerId === userId ? "⏰ Tijd op! Je wint op punten!" : "⏰ Tijd op! Je verliest op punten...");
  }

  // === ADAPTIVE AI: Defender uses skills and adapts to player patterns ===
  if (status === "active" && !defender.stunned) {
    const defHpPct = defender.hp / defender.maxHp;
    // Track player action history in combat log for pattern detection
    const recentPlayerActions = combatLog.slice(-6).map(l => l.text);
    const attackCount = recentPlayerActions.filter(t => t.includes('Aanval') || t.includes('ZWARE')).length;
    const defendCount = recentPlayerActions.filter(t => t.includes('Verdedig')).length;

    // Adaptive strategy
    let aiAction: "attack" | "heavy" | "defend" | "skill" = "attack";
    if (attackCount >= 3) aiAction = "defend"; // player spams attack → defend
    else if (defendCount >= 2) aiAction = "heavy"; // player defends → heavy
    else if (defHpPct < 0.3) aiAction = Math.random() < 0.5 ? "defend" : "heavy";
    else if (defHpPct < 0.6) aiAction = Math.random() < 0.4 ? "heavy" : "attack";
    else aiAction = Math.random() < 0.5 ? "attack" : "heavy";

    // AI skill usage based on defender level
    const defLevel = defender.level || 1;
    const availableAiSkills = PVP_COMBAT_SKILLS.filter(s => defLevel >= s.unlockLevel && !(defender.skillCooldowns[s.id] > 0));

    // 30% chance to use a skill if available
    if (availableAiSkills.length > 0 && Math.random() < 0.30) {
      const aiSkill = availableAiSkills[Math.floor(Math.random() * availableAiSkills.length)];
      defender.skillCooldowns[aiSkill.id] = aiSkill.cooldownTurns;
      const result = pvpApplySkill(defender, attacker, aiSkill.id);
      // Apply attacker's armor/dodge in reverse
      const atkArmor = attacker.loadout?.armor;
      const atkArmorRed = atkArmor === 'skull_armor' ? 0.20 : atkArmor === 'suit' ? 0.12 : atkArmor === 'vest' ? 0.08 : 0;
      let aiDmg = Math.max(1, Math.floor(result.damage * (1 - atkArmorRed)));
      attacker.hp = Math.max(0, attacker.hp - aiDmg);
      if (result.stunApplied) attacker.stunned = true;
      logs.push(`🤖 ${result.log}`);
    } else if (action === "skill" || action === "combo_finisher") {
      // AI basic counter-attack
      const aiResult = pvpBasicAttack(defender, attacker, aiAction as "attack" | "heavy" | "defend");
      attacker.hp = Math.max(0, attacker.hp - aiResult.damage);
      logs.push(`Tegenstander: ${aiResult.log}`);
    }

    if (attacker.hp <= 0) {
      status = "finished"; winnerId = session.defender_id;
      logs.push("💀 Je bent verslagen...");
    }
  } else if (defender.stunned && (action === "skill" || action === "combo_finisher")) {
    logs.push("Tegenstander is verdoofd en kan niet aanvallen!");
    defender.stunned = false;
  }

  // Tick buffs/cooldowns for both sides
  pvpTickBuffsAndCooldowns(attacker);
  pvpTickBuffsAndCooldowns(defender);

  for (const l of logs) combatLog.push({ turn, text: l });

  // === APPLY REWARDS WITH ELO RATING & LEVEL SCALING ===
  if (status === "finished") {
    const attackerWon = winnerId === userId;
    const isBot = session.defender_id.startsWith("bot_");

    // Fetch current ratings
    const { data: atkState } = await supabase.from("player_state").select("xp, personal_heat, combat_rating, level").eq("user_id", userId).single();
    const atkRating = atkState?.combat_rating || 1000;
    let defRating = 1000;
    if (!isBot) {
      const { data: defState } = await supabase.from("player_state").select("combat_rating").eq("user_id", session.defender_id).single();
      defRating = defState?.combat_rating || 1000;
    } else {
      defRating = 800 + (defender.level || 1) * 20; // Estimated bot rating
    }

    // Elo calculation
    const expectedScore = 1 / (1 + Math.pow(10, (defRating - atkRating) / 400));
    const kFactor = 32;
    const actualScore = attackerWon ? 1 : 0;
    const ratingChange = Math.round(kFactor * (actualScore - expectedScore));

    // Level-scaled rewards
    const levelDiff = (defender.level || 1) - (atkState?.level || 1);
    const levelMultiplier = Math.max(0.5, 1 + levelDiff * 0.15); // +15% per level difference
    const baseXP = 50;
    const scaledXP = Math.floor(baseXP * levelMultiplier);
    const bonusCash = attackerWon ? Math.floor(Math.max(0, levelDiff) * 500) : 0;

    if (attackerWon) {
      await supabase.from("player_state").update({
        xp: (atkState?.xp || 0) + scaledXP,
        personal_heat: Math.min(100, (atkState?.personal_heat || 0) + 15),
        combat_rating: atkRating + ratingChange,
        money: bonusCash > 0 ? (await supabase.from("player_state").select("money").eq("user_id", userId).single()).data?.money + bonusCash : undefined,
      }).eq("user_id", userId);

      if (!isBot) {
        await supabase.from("player_state").update({
          combat_rating: Math.max(100, defRating - ratingChange),
        }).eq("user_id", session.defender_id);
        await upsertRivalry(supabase, userId, session.defender_id, 10, "pvp");
      }

      // Generate combat news
      const { data: atkProf } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();
      const atkName = atkProf?.username || "Onbekend";
      const { data: ps } = await supabase.from("player_state").select("loc").eq("user_id", userId).single();
      const distName = DISTRICT_NAMES[ps?.loc || 'low'] || 'Noxhaven';
      insertPlayerNews(supabase, {
        text: `${atkName} verslaat een rivaal in ${distName}! Rating stijgt naar ${atkRating + ratingChange}`,
        icon: '⚔️', urgency: ratingChange > 20 ? 'high' : 'medium', districtId: ps?.loc,
      });
    } else {
      await supabase.from("player_state").update({
        combat_rating: Math.max(100, atkRating + ratingChange),
      }).eq("user_id", userId);
      if (!isBot) {
        await supabase.from("player_state").update({
          combat_rating: defRating - ratingChange,
        }).eq("user_id", session.defender_id);
      }
    }

    // Add rating info to last log
    combatLog.push({ turn, text: `📊 Rating: ${ratingChange > 0 ? '+' : ''}${ratingChange} (${atkRating} → ${atkRating + ratingChange})` });
    if (scaledXP !== baseXP) combatLog.push({ turn, text: `⭐ Level-bonus: ${scaledXP} XP (${levelDiff > 0 ? '+' : ''}${levelDiff} level verschil)` });
    if (bonusCash > 0) combatLog.push({ turn, text: `💰 Bonus: €${bonusCash.toLocaleString()} (hoger level tegenstander)` });
  }

  // Update session
  await supabase.from("pvp_combat_sessions").update({
    attacker_state: attacker, defender_state: defender,
    combat_log: combatLog, turn, status, winner_id: winnerId,
    updated_at: new Date().toISOString(),
  }).eq("id", sessionId);

  return {
    success: true, message: logs.join(" "),
    data: { sessionId, turn, attackerState: attacker, defenderState: defender, logs, status, winnerId },
  };
}

// ========== PVP ATTACK (LEGACY 1-CLICK) ==========

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

  const isBot = targetUserId.startsWith("bot_");
  const now = new Date();
  const cooldownUntil = new Date(now.getTime() + ATTACK_COOLDOWN_SECONDS * 1000).toISOString();
  const energyCost = ENERGY_COSTS.attack || 15;
  const nerveCost = NERVE_COSTS.attack || 10;

  let target: any;
  let targetName: string;

  if (isBot) {
    // Fetch bot from bot_players table
    const botId = targetUserId.replace("bot_", "");
    const { data: bot } = await supabase.from("bot_players").select("*").eq("id", botId).maybeSingle();
    if (!bot) return { success: false, message: "Bot-speler niet gevonden." };
    target = {
      user_id: targetUserId,
      hp: bot.hp,
      max_hp: bot.max_hp,
      level: bot.level,
      money: bot.cash,
      stats: { muscle: Math.floor(bot.level * 1.5) + 3, brains: Math.floor(bot.level * 0.8), charm: Math.floor(bot.level * 0.5) },
      loadout: { weapon: null, armor: null, gadget: null },
      hospitalizations: 0,
      personal_heat: 0,
    };
    targetName = bot.username;
  } else {
    // Get real target player state
    const { data: realTarget } = await supabase.from("player_state").select("*").eq("user_id", targetUserId).maybeSingle();
    if (!realTarget) return { success: false, message: "Doelwit niet gevonden." };

    if (realTarget.hospital_until && new Date(realTarget.hospital_until) > now) {
      return { success: false, message: "Doelwit ligt in het ziekenhuis." };
    }
    if (realTarget.prison_until && new Date(realTarget.prison_until) > now) {
      return { success: false, message: "Doelwit zit in de gevangenis." };
    }

    target = realTarget;
    const { data: targetProfile } = await supabase.from("profiles").select("username").eq("id", targetUserId).maybeSingle();
    targetName = targetProfile?.username || "Onbekend";
  }

  // Calculate combat power
  const attackerMuscle = getPlayerStat(ps.stats || {}, ps.loadout || {}, "muscle");
  const defenderMuscle = getPlayerStat(target.stats || {}, target.loadout || {}, "muscle");

  const attackerPower = attackerMuscle * (1 + ps.level * 0.1) + Math.random() * 20;
  const defenderPower = defenderMuscle * (1 + target.level * 0.1) + Math.random() * 20;

  const attackerWins = attackerPower > defenderPower;

  if (attackerWins) {
    const stealPct = 0.05 + Math.random() * 0.10;
    const stolen = Math.floor((target.money || 0) * stealPct);
    const dmgToTarget = 20 + Math.floor(Math.random() * 30);
    const targetNewHp = Math.max(0, (target.hp || 100) - dmgToTarget);
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

    // Update real target (skip for bots)
    if (!isBot) {
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

      // Rivalry & bounty logic only for real players
      await upsertRivalry(supabase, userId, targetUserId, 10, "pvp");

      const { data: bounties } = await supabase.from("player_bounties")
        .select("*").eq("target_id", targetUserId).eq("status", "active");
      let bountyBonus = 0;
      for (const b of (bounties || [])) {
        if (b.placer_id !== userId) {
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
    }

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
    const dmgToAttacker = 15 + Math.floor(Math.random() * 25);
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
  const TARGET_PLAYER_COUNT = 10;

  const { data: players } = await supabase
    .from("player_state")
    .select("user_id, level, hp, max_hp, loc, hospital_until, prison_until, stats, loadout, backstory, rep, combat_rating")
    .eq("loc", ps.loc)
    .neq("user_id", userId)
    .eq("game_over", false)
    .limit(20);

  const realPlayers = players || [];
  const userIds = realPlayers.map((p: any) => p.user_id);
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("id, username").in("id", userIds)
    : { data: [] };
  const profileMap: Record<string, string> = {};
  (profiles || []).forEach((p: any) => { profileMap[p.id] = p.username; });

  const now = new Date();
  const result = realPlayers
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
      stats: p.stats || { muscle: 1, brains: 1, charm: 1 },
      loadout: p.loadout || { weapon: null, armor: null, gadget: null },
      backstory: p.backstory || null,
      rep: p.rep || 0,
      isBot: false,
      combatRating: p.combat_rating || 1000,
    }));

  // Fill up with bots if needed
  const botsNeeded = Math.max(0, TARGET_PLAYER_COUNT - result.length);
  if (botsNeeded > 0) {
    const { data: bots } = await supabase
      .from("bot_players")
      .select("id, username, level, hp, max_hp, loc")
      .eq("loc", ps.loc)
      .eq("is_active", true)
      .limit(botsNeeded);

    if (bots && bots.length > 0) {
      for (const bot of bots) {
        result.push({
          userId: `bot_${bot.id}`,
          username: bot.username,
          level: bot.level,
          hp: bot.hp,
          maxHp: bot.max_hp,
          stats: { muscle: Math.floor(bot.level * 1.5) + 3, brains: Math.floor(bot.level * 0.8), charm: Math.floor(bot.level * 0.5) },
          loadout: { weapon: null, armor: null, gadget: null },
          backstory: bot.backstory || null,
          rep: bot.rep || 0,
          isBot: true,
          combatRating: 800 + bot.level * 20,
        });
      }
    }
  }

  return { success: true, message: `${result.length} spelers gevonden.`, data: { players: result } };
}

// ========== CLAIM DISTRICT EVENT ==========

async function handleClaimEvent(supabase: any, userId: string, ps: any, payload: { eventId: string }): Promise<ActionResult> {
  const { eventId } = payload;
  if (!eventId) return { success: false, message: "Geen event opgegeven." };

  const blocked = checkBlocked(ps);
  if (blocked) return { success: false, message: blocked };

  // Fetch the event
  const { data: evt } = await supabase.from("district_events").select("*").eq("id", eventId).maybeSingle();
  if (!evt) return { success: false, message: "Event niet gevonden." };
  if (new Date(evt.expires_at) < new Date()) return { success: false, message: "Event verlopen." };
  if (evt.district_id !== ps.loc) return { success: false, message: "Je bent niet in het juiste district." };

  const eventData = evt.data || {};

  // === COMPETITIVE EVENT: first to claim wins ===
  if (eventData.competitive) {
    if (evt.claimed_by) return { success: false, message: "Al geclaimd door een andere speler!" };

    await supabase.from("district_events").update({
      claimed_by: userId,
      claimed_at: new Date().toISOString(),
    }).eq("id", eventId);

    // Apply rewards
    const reward = eventData.reward || {};
    const moneyGain = reward.money || 0;
    const repGain = reward.rep || 0;
    const heatChange = reward.heat || 0;

    await supabase.from("player_state").update({
      money: ps.money + moneyGain,
      rep: (ps.rep || 0) + repGain,
      heat: Math.max(0, Math.min(100, (ps.heat || 0) + heatChange)),
      xp: (ps.xp || 0) + (reward.xp || 25),
      last_action_at: new Date().toISOString(),
    }).eq("user_id", userId);

    const { data: prof } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();
    insertPlayerNews(supabase, {
      text: `${prof?.username || 'Een speler'} claimt ${evt.title} in ${DISTRICT_NAMES[evt.district_id] || evt.district_id}!`,
      icon: '🏆', urgency: 'high', districtId: evt.district_id,
    });

    return {
      success: true,
      message: `${evt.title} geclaimd! +€${moneyGain.toLocaleString()}, +${repGain} rep.`,
      data: { money: moneyGain, rep: repGain, heat: heatChange, xp: reward.xp || 25 },
    };
  }

  // === COOPERATIVE EVENT: join participants ===
  if (eventData.cooperative) {
    const participants: string[] = evt.participants || [];
    if (participants.includes(userId)) return { success: false, message: "Je doet al mee aan dit event." };

    participants.push(userId);
    const participantCount = participants.length;
    const scaleFactor = Math.min(3, 1 + (participantCount - 1) * 0.25); // 25% bonus per extra participant, max 3x

    await supabase.from("district_events").update({
      participants,
      data: { ...eventData, participantCount },
    }).eq("id", eventId);

    // Apply scaled reward
    const baseReward = eventData.reward || {};
    const heatReduction = Math.floor((baseReward.heatReduction || 5) * scaleFactor);

    await supabase.from("player_state").update({
      heat: Math.max(0, (ps.heat || 0) - heatReduction),
      rep: (ps.rep || 0) + Math.floor((baseReward.rep || 5) * scaleFactor),
      xp: (ps.xp || 0) + 20,
      last_action_at: new Date().toISOString(),
    }).eq("user_id", userId);

    return {
      success: true,
      message: `Deelgenomen aan ${evt.title}! ${participantCount} spelers — heat -${heatReduction} (${Math.round(scaleFactor * 100)}% bonus).`,
      data: { participantCount, heatReduction, scaleFactor },
    };
  }

  return { success: false, message: "Dit event kan niet geclaimd worden." };
}

// ========== PUBLIC PROFILE ==========

async function handleGetPublicProfile(supabase: any, targetUserId: string): Promise<ActionResult> {
  if (!targetUserId) return { success: false, message: "Geen speler opgegeven." };

  // Handle bot profiles
  if (targetUserId.startsWith("bot_")) {
    const botId = targetUserId.replace("bot_", "");
    const { data: bot } = await supabase.from("bot_players").select("*").eq("id", botId).maybeSingle();
    if (!bot) return { success: false, message: "Speler niet gevonden." };
    const districtNames: Record<string, string> = {
      low: "Lowrise", port: "Port Nero", iron: "Iron Borough", neon: "Neon Strip", crown: "Crown Heights"
    };
    return {
      success: true, message: "Profiel opgehaald.",
      data: {
        username: bot.username, memberSince: bot.created_at, level: bot.level, xp: 0,
        rep: bot.rep, karma: bot.karma, hp: bot.hp, maxHp: bot.max_hp, loc: bot.loc,
        locName: districtNames[bot.loc] || bot.loc, backstory: bot.backstory,
        endgamePhase: bot.level >= 15 ? "onderwereld_koning" : bot.level >= 8 ? "drugsbaas" : "straatdealer",
        day: bot.day, wealth: bot.cash,
        stats: { muscle: Math.floor(bot.level * 1.5) + 3, brains: Math.floor(bot.level * 0.8), charm: Math.floor(bot.level * 0.5) },
        hospitalizations: 0, totalEarned: bot.cash * 3, tradesCompleted: bot.day * 2,
        missionsCompleted: Math.floor(bot.day * 0.8), casinoWon: Math.floor(bot.cash * 0.2),
        casinoLost: Math.floor(bot.cash * 0.15),
        gear: [], vehicles: [], districts: [], businesses: [], crew: [], isBot: true,
      },
    };
  }

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
  const { data: gangs } = await supabase.from("gangs").select("id, name, tag, level, leader_id, created_at, description, treasury, xp, max_members")
    .order("level", { ascending: false }).limit(50);

  if (!gangs || gangs.length === 0) return { success: true, message: "Geen gangs.", data: { gangs: [] } };

  // Get member counts + leader usernames
  const gangIds = gangs.map((g: any) => g.id);
  const leaderIds = gangs.map((g: any) => g.leader_id);
  const { data: members } = await supabase.from("gang_members").select("gang_id").in("gang_id", gangIds);
  const countMap: Record<string, number> = {};
  (members || []).forEach((m: any) => { countMap[m.gang_id] = (countMap[m.gang_id] || 0) + 1; });

  // Get territory counts + district ids
  const { data: territories } = await supabase.from("gang_territories").select("gang_id, district_id").in("gang_id", gangIds);
  const terrMap: Record<string, number> = {};
  const terrDistricts: Record<string, string[]> = {};
  (territories || []).forEach((t: any) => {
    terrMap[t.gang_id] = (terrMap[t.gang_id] || 0) + 1;
    if (!terrDistricts[t.gang_id]) terrDistricts[t.gang_id] = [];
    terrDistricts[t.gang_id].push(t.district_id);
  });

  // Get leader usernames
  const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", leaderIds);
  const leaderMap: Record<string, string> = {};
  (profiles || []).forEach((p: any) => { leaderMap[p.id] = p.username; });

  // Get active wars count
  const { data: wars } = await supabase.from("gang_wars").select("attacker_gang_id, defender_gang_id").eq("status", "active");
  const warMap: Record<string, number> = {};
  (wars || []).forEach((w: any) => {
    warMap[w.attacker_gang_id] = (warMap[w.attacker_gang_id] || 0) + 1;
    warMap[w.defender_gang_id] = (warMap[w.defender_gang_id] || 0) + 1;
  });

  const enriched = gangs.map((g: any) => ({
    ...g,
    memberCount: countMap[g.id] || 0,
    territoryCount: terrMap[g.id] || 0,
    territoryDistricts: terrDistricts[g.id] || [],
    leaderName: leaderMap[g.leader_id] || 'Onbekend',
    activeWars: warMap[g.id] || 0,
  }));

  return { success: true, message: "Gangs opgehaald.", data: { gangs: enriched } };
}

async function handleJoinGang(supabase: any, userId: string, payload: any): Promise<ActionResult> {
  const { gangId } = payload || {};
  if (!gangId) return { success: false, message: "Geen gang opgegeven." };

  // Check not already in a gang
  const { data: existing } = await supabase.from("gang_members").select("id").eq("user_id", userId).maybeSingle();
  if (existing) return { success: false, message: "Je zit al in een gang. Verlaat eerst je huidige gang." };

  // Check gang exists and has space
  const { data: gang } = await supabase.from("gangs").select("id, max_members, name, tag").eq("id", gangId).maybeSingle();
  if (!gang) return { success: false, message: "Gang niet gevonden." };

  const { count } = await supabase.from("gang_members").select("id", { count: "exact", head: true }).eq("gang_id", gangId);
  if ((count || 0) >= gang.max_members) return { success: false, message: "Deze gang zit vol." };

  // Check player level >= 3
  const { data: ps } = await supabase.from("player_state").select("level").eq("user_id", userId).maybeSingle();
  if (!ps || ps.level < 3) return { success: false, message: "Je hebt minimaal level 3 nodig om een gang te joinen." };

  // Join as member
  await supabase.from("gang_members").insert({ gang_id: gangId, user_id: userId, role: "member" });

  return { success: true, message: `Je bent lid geworden van [${gang.tag}] ${gang.name}!` };
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

// ========== CASINO (SERVER-SIDE RNG) ==========

const CASINO_RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const CASINO_SUITS = ['spade', 'heart', 'diamond', 'club'];

function serverCreateDeck() {
  const deck: { rank: string; suit: string }[] = [];
  for (const suit of CASINO_SUITS) {
    for (const rank of CASINO_RANKS) {
      deck.push({ rank, suit });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function bjScore(hand: { rank: string }[]) {
  let score = 0, aces = 0;
  for (const c of hand) {
    if (c.rank === 'A') { aces++; score += 11; }
    else if (['K','Q','J'].includes(c.rank)) score += 10;
    else score += parseInt(c.rank);
  }
  while (score > 21 && aces > 0) { score -= 10; aces--; }
  return score;
}

function getCardRankVal(rank: string): number {
  return CASINO_RANKS.indexOf(rank);
}

async function handleCasinoPlay(supabase: any, userId: string, ps: any, payload: any): Promise<ActionResult> {
  const { game, bet, choice } = payload || {};
  if (!game || !bet || bet < 10) return { success: false, message: "Ongeldige casino parameters." };
  if (bet > Number(ps.money)) return { success: false, message: "Niet genoeg geld." };

  const blocked = checkBlocked(ps);
  if (blocked) return { success: false, message: blocked };

  // Anti-exploit: max bet cap per game
  const MAX_BET = 500000;
  if (bet > MAX_BET) return { success: false, message: `Maximale inzet is €${MAX_BET.toLocaleString()}.` };

  let netResult = 0; // positive = player wins, negative = player loses
  let resultData: Record<string, any> = {};

  switch (game) {
    case "blackjack": {
      // Full blackjack simulation server-side
      const deck = serverCreateDeck();
      const playerHand = [deck.pop()!, deck.pop()!];
      const dealerHand = [deck.pop()!, deck.pop()!];

      const action = choice?.action; // 'stand', 'hit', or 'double'
      // For simplicity: client sends the FULL action sequence as an array
      // e.g. choice = { actions: ['hit', 'hit', 'stand'] }
      const actions: string[] = choice?.actions || ['stand'];
      let activeBet = bet;
      let doubled = false;

      for (const act of actions) {
        if (act === 'hit') {
          playerHand.push(deck.pop()!);
          if (bjScore(playerHand) > 21) break;
        } else if (act === 'double') {
          if (!doubled && playerHand.length === 2 && activeBet <= Number(ps.money) - bet) {
            activeBet = bet * 2;
            doubled = true;
            playerHand.push(deck.pop()!);
            break; // after double, auto-stand
          }
        } else { // stand
          break;
        }
      }

      const ps_score = bjScore(playerHand);
      let ds_score = bjScore(dealerHand);

      if (ps_score <= 21) {
        // Dealer draws
        while (ds_score < 17) {
          dealerHand.push(deck.pop()!);
          ds_score = bjScore(dealerHand);
        }
      }

      const isBj = ps_score === 21 && playerHand.length === 2;
      let won: boolean | null = null;
      if (ps_score > 21) { won = false; }
      else if (ds_score > 21) { won = true; }
      else if (ps_score > ds_score) { won = true; }
      else if (ps_score === ds_score) { won = null; } // push
      else { won = false; }

      if (won === true) {
        const mult = isBj ? 2.5 : 2;
        netResult = Math.floor(activeBet * mult) - activeBet;
      } else if (won === false) {
        netResult = -activeBet;
      } else {
        netResult = 0; // push - return bet
      }

      resultData = { playerHand, dealerHand, playerScore: ps_score, dealerScore: ds_score, won, isBj, activeBet };
      break;
    }

    case "roulette": {
      const num = Math.floor(Math.random() * 37); // 0-36
      const RED_NUMS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
      const color = num === 0 ? 'green' : RED_NUMS.includes(num) ? 'red' : 'black';
      const betType = choice?.betType; // 'red','black','green','even','odd','low','high'

      let won = false, mult = 0;
      if (betType === 'red' && color === 'red') { won = true; mult = 2; }
      else if (betType === 'black' && color === 'black') { won = true; mult = 2; }
      else if (betType === 'green' && num === 0) { won = true; mult = 14; }
      else if (betType === 'even' && num > 0 && num % 2 === 0) { won = true; mult = 2; }
      else if (betType === 'odd' && num % 2 === 1) { won = true; mult = 2; }
      else if (betType === 'low' && num >= 1 && num <= 18) { won = true; mult = 2; }
      else if (betType === 'high' && num >= 19 && num <= 36) { won = true; mult = 2; }

      netResult = won ? Math.floor(bet * mult) - bet : -bet;
      resultData = { num, color, won, mult };
      break;
    }

    case "slots": {
      const BASE_SYMBOLS = ['🍒','🍒','🍋','🍋','🍇','🍊','🔔','⭐','🍀','🎲','💎','7️⃣'];
      const pick = () => BASE_SYMBOLS[Math.floor(Math.random() * BASE_SYMBOLS.length)];
      const reels = [pick(), pick(), pick()];
      const [a, b, c] = reels;

      let winMult = 0;
      let isJackpot = false;

      if (a === b && b === c) {
        if (a === '7️⃣') { winMult = 0; isJackpot = true; } // jackpot handled separately
        else if (a === '💎') { winMult = 25; }
        else { winMult = 8; }
      } else if (a === b || b === c || a === c) {
        winMult = 1.2;
      }

      if (isJackpot) {
        // Award jackpot from player_state
        const jackpotAmount = ps.casino_jackpot || 10000;
        netResult = jackpotAmount; // full jackpot as net win
        // Reset jackpot
        await supabase.from("player_state").update({ casino_jackpot: 500 }).eq("user_id", userId);
        resultData = { reels, isJackpot: true, jackpotAmount };
      } else {
        // Add to jackpot pool
        const jackpotAdd = Math.floor(bet * 0.05);
        await supabase.from("player_state").update({
          casino_jackpot: (ps.casino_jackpot || 10000) + jackpotAdd,
        }).eq("user_id", userId);

        if (winMult > 0) {
          netResult = Math.floor(bet * winMult) - bet;
        } else {
          netResult = -bet;
        }
        resultData = { reels, winMult, isJackpot: false };
      }
      break;
    }

    case "highlow": {
      // Server plays the full high-low game
      // choice = { guesses: ['higher', 'lower', ...], cashOutAfter?: number }
      const deck = serverCreateDeck();
      const guesses: string[] = choice?.guesses || [];
      const MULT_LADDER = [1.3, 1.8, 2.5, 4, 7, 12];
      let currentCard = deck.pop()!;
      const cards = [currentCard];
      let round = 0;
      let lost = false;

      for (let i = 0; i < guesses.length && i < 6; i++) {
        const nextCard = deck.pop()!;
        cards.push(nextCard);
        const curVal = getCardRankVal(currentCard.rank);
        const nextVal = getCardRankVal(nextCard.rank);
        const guess = guesses[i];

        const correct = guess === 'higher' ? nextVal > curVal : nextVal < curVal;
        if (!correct) {
          lost = true;
          break;
        }
        round++;
        currentCard = nextCard;
      }

      if (lost) {
        netResult = -bet;
        resultData = { cards, round, lost: true };
      } else if (round > 0) {
        const mult = MULT_LADDER[Math.min(round - 1, MULT_LADDER.length - 1)];
        netResult = Math.floor(bet * mult) - bet;
        resultData = { cards, round, lost: false, mult };
      } else {
        netResult = 0;
        resultData = { cards, round: 0, lost: false };
      }
      break;
    }

    case "russian_roulette": {
      // choice = { rounds: number } - how many times to pull trigger
      const rounds = Math.min(choice?.rounds || 1, 5);
      const ROUL_MULTS = [1.5, 2.5, 4, 7, 12];
      const CHAMBERS = 6;
      let survived = 0;
      let dead = false;

      for (let i = 0; i < rounds; i++) {
        const chambersLeft = CHAMBERS - i;
        if (Math.random() < (1 / chambersLeft)) {
          dead = true;
          break;
        }
        survived++;
      }

      if (dead) {
        netResult = -bet;
        resultData = { survived, dead: true };
      } else if (survived > 0) {
        const mult = ROUL_MULTS[Math.min(survived - 1, ROUL_MULTS.length - 1)];
        netResult = Math.floor(bet * mult) - bet;
        resultData = { survived, dead: false, mult };
      } else {
        netResult = 0;
        resultData = { survived: 0, dead: false };
      }
      break;
    }

    default:
      return { success: false, message: `Onbekend casino spel: ${game}` };
  }

  // Apply VIP bonus on net wins
  if (netResult > 0) {
    const { data: ownedDistricts } = await supabase.from("player_districts").select("district_id").eq("user_id", userId);
    const ownsNeon = (ownedDistricts || []).some((d: any) => d.district_id === "neon");
    let vipBonus = 0;
    if (ownsNeon) vipBonus += 5;
    // Cap VIP at 15%
    vipBonus = Math.min(vipBonus, 15);
    if (vipBonus > 0) {
      netResult = netResult + Math.floor(netResult * (vipBonus / 100));
    }
  }

  // Update player money and stats
  const newMoney = Number(ps.money) + netResult;
  const updateData: Record<string, any> = {
    money: Math.max(0, newMoney),
    last_action_at: new Date().toISOString(),
  };

  if (netResult > 0) {
    updateData.stats_casino_won = (ps.stats_casino_won || 0) + netResult;
    updateData.stats_total_earned = (ps.stats_total_earned || 0) + netResult;
  } else if (netResult < 0) {
    updateData.stats_casino_lost = (ps.stats_casino_lost || 0) + Math.abs(netResult);
    updateData.stats_total_spent = (ps.stats_total_spent || 0) + Math.abs(netResult);
  }

  await supabase.from("player_state").update(updateData).eq("user_id", userId);

  const won = netResult > 0;
  return {
    success: true,
    message: won ? `Gewonnen! +€${netResult.toLocaleString()}` : netResult === 0 ? 'Gelijkspel.' : `Verloren: -€${Math.abs(netResult).toLocaleString()}`,
    data: { ...resultData, netResult, newMoney: Math.max(0, newMoney) },
  };
}

// ========== SKILL TREE CONSTANTS (server-side) ==========

const SKILL_TREE_NODES: Record<string, { branch: string; tier: number; cost: number; requires: string | null; maxLevel: number; effects: { type: string; stat?: string; value: number; key?: string }[] }> = {
  brawler:      { branch: 'muscle', tier: 1, cost: 1, requires: null, maxLevel: 3, effects: [{ type: 'stat_bonus', stat: 'muscle', value: 1 }, { type: 'passive', key: 'crit_chance', value: 3 }] },
  tank:         { branch: 'muscle', tier: 2, cost: 2, requires: 'brawler', maxLevel: 3, effects: [{ type: 'passive', key: 'max_hp_bonus', value: 15 }, { type: 'passive', key: 'damage_reduction', value: 5 }] },
  berserker:    { branch: 'muscle', tier: 3, cost: 3, requires: 'tank', maxLevel: 2, effects: [{ type: 'passive', key: 'lifesteal', value: 8 }, { type: 'passive', key: 'low_hp_damage', value: 20 }] },
  hacker:       { branch: 'brains', tier: 1, cost: 1, requires: null, maxLevel: 3, effects: [{ type: 'stat_bonus', stat: 'brains', value: 1 }, { type: 'passive', key: 'hack_success', value: 5 }] },
  strategist:   { branch: 'brains', tier: 2, cost: 2, requires: 'hacker', maxLevel: 3, effects: [{ type: 'passive', key: 'trade_bonus', value: 4 }, { type: 'passive', key: 'heist_intel', value: 10 }] },
  mastermind:   { branch: 'brains', tier: 3, cost: 3, requires: 'strategist', maxLevel: 2, effects: [{ type: 'passive', key: 'xp_bonus', value: 10 }, { type: 'passive', key: 'cooldown_reduction', value: 15 }] },
  smooth_talker:{ branch: 'charm', tier: 1, cost: 1, requires: null, maxLevel: 3, effects: [{ type: 'stat_bonus', stat: 'charm', value: 1 }, { type: 'passive', key: 'npc_relation', value: 5 }] },
  negotiator:   { branch: 'charm', tier: 2, cost: 2, requires: 'smooth_talker', maxLevel: 3, effects: [{ type: 'passive', key: 'recruit_chance', value: 8 }, { type: 'passive', key: 'corruption_discount', value: 10 }] },
  kingpin:      { branch: 'charm', tier: 3, cost: 3, requires: 'negotiator', maxLevel: 2, effects: [{ type: 'passive', key: 'rep_multiplier', value: 15 }, { type: 'passive', key: 'intimidation', value: 20 }] },
};

const TIER_LEVEL_REQ: Record<number, number> = { 1: 1, 2: 10, 3: 25 };
const XP_SCALE = 1.4;
const SP_PER_LEVEL = 2;
const PRESTIGE_REQ_LEVEL = 50;
const PRESTIGE_MAX = 10;

// ========== UNLOCK SKILL ==========

async function handleUnlockSkill(supabase: any, userId: string, ps: any, payload: { skillId: string }): Promise<ActionResult> {
  const { skillId } = payload;
  if (!skillId) return { success: false, message: "Geen skill opgegeven." };

  const node = SKILL_TREE_NODES[skillId];
  if (!node) return { success: false, message: "Onbekende skill." };

  // Get current skills
  const { data: skills } = await supabase.from("player_skills").select("skill_id, level").eq("user_id", userId);
  const skillMap: Record<string, number> = {};
  for (const s of (skills || [])) skillMap[s.skill_id] = s.level;

  const currentLevel = skillMap[skillId] || 0;
  if (currentLevel >= node.maxLevel) return { success: false, message: "Max level bereikt." };
  if (ps.skill_points < node.cost) return { success: false, message: `${node.cost} SP nodig (heb: ${ps.skill_points}).` };
  if (ps.level < (TIER_LEVEL_REQ[node.tier] || 1)) return { success: false, message: `Level ${TIER_LEVEL_REQ[node.tier]} vereist.` };

  // Check parent requirement
  if (node.requires) {
    const parentLevel = skillMap[node.requires] || 0;
    if (parentLevel < 1) return { success: false, message: `Vereist: ${node.requires}` };
  }

  // Unlock/upgrade the skill
  if (currentLevel === 0) {
    await supabase.from("player_skills").insert({ user_id: userId, skill_id: skillId, level: 1 });
  } else {
    await supabase.from("player_skills").update({ level: currentLevel + 1 }).eq("user_id", userId).eq("skill_id", skillId);
  }

  // Deduct SP
  const newSP = ps.skill_points - node.cost;
  await supabase.from("player_state").update({ skill_points: newSP }).eq("user_id", userId);

  // Return updated skills
  const { data: updatedSkills } = await supabase.from("player_skills").select("skill_id, level").eq("user_id", userId);
  const skillList = (updatedSkills || []).map((s: any) => ({ skillId: s.skill_id, level: s.level }));

  return {
    success: true,
    message: `${skillId} ${currentLevel === 0 ? 'ontgrendeld' : `→ level ${currentLevel + 1}`}!`,
    data: { skills: skillList, skillPoints: newSP },
  };
}

// ========== GET SKILLS ==========

async function handleGetSkills(supabase: any, userId: string): Promise<ActionResult> {
  const { data: skills } = await supabase.from("player_skills").select("skill_id, level").eq("user_id", userId);
  return {
    success: true,
    message: "Skills opgehaald.",
    data: { skills: (skills || []).map((s: any) => ({ skillId: s.skill_id, level: s.level })) },
  };
}

// ========== PRESTIGE ==========

const PRESTIGE_PERKS: Record<number, { label: string; stat_bonus?: Record<string, number>; max_hp_bonus?: number; max_energy_bonus?: number; cash_bonus?: number; sp_carry?: number }> = {
  1: { label: "Prestige I — Gouden Badge", cash_bonus: 25000, sp_carry: 2 },
  2: { label: "Prestige II — Elite Contracts", stat_bonus: { muscle: 2 }, max_hp_bonus: 10, cash_bonus: 50000, sp_carry: 3 },
  3: { label: "Prestige III — Prestige Gear", stat_bonus: { brains: 2 }, max_energy_bonus: 10, cash_bonus: 75000, sp_carry: 4 },
  4: { label: "Prestige IV — Veteraan", stat_bonus: { charm: 2 }, max_hp_bonus: 15, cash_bonus: 100000, sp_carry: 5 },
  5: { label: "Prestige V — Prestige Villa", stat_bonus: { muscle: 2, brains: 2 }, max_energy_bonus: 15, cash_bonus: 150000, sp_carry: 6 },
  6: { label: "Prestige VI — Onderwerelds Icoon", stat_bonus: { muscle: 3, charm: 2 }, max_hp_bonus: 20, cash_bonus: 200000, sp_carry: 7 },
  7: { label: "Prestige VII — Schaduwkoning", stat_bonus: { brains: 3, charm: 3 }, max_energy_bonus: 20, cash_bonus: 250000, sp_carry: 8 },
  8: { label: "Prestige VIII — Onsterfelijk", stat_bonus: { muscle: 3, brains: 3, charm: 3 }, max_hp_bonus: 25, cash_bonus: 350000, sp_carry: 9 },
  9: { label: "Prestige IX — Godfather", stat_bonus: { muscle: 5, brains: 5, charm: 5 }, max_hp_bonus: 30, max_energy_bonus: 25, cash_bonus: 500000, sp_carry: 10 },
  10: { label: "Prestige X — Legende", stat_bonus: { muscle: 8, brains: 8, charm: 8 }, max_hp_bonus: 50, max_energy_bonus: 50, cash_bonus: 1000000, sp_carry: 15 },
};

function calculatePrestigeTotalBonuses(prestigeLevel: number) {
  let totalStats: Record<string, number> = {};
  let totalMaxHp = 0, totalMaxEnergy = 0;
  for (let i = 1; i <= prestigeLevel; i++) {
    const p = PRESTIGE_PERKS[i];
    if (!p) continue;
    if (p.stat_bonus) for (const [k, v] of Object.entries(p.stat_bonus)) totalStats[k] = (totalStats[k] || 0) + v;
    totalMaxHp += p.max_hp_bonus || 0;
    totalMaxEnergy += p.max_energy_bonus || 0;
  }
  return { totalStats, totalMaxHp, totalMaxEnergy };
}

async function handlePrestige(supabase: any, userId: string, ps: any): Promise<ActionResult> {
  if (ps.level < PRESTIGE_REQ_LEVEL) return { success: false, message: `Level ${PRESTIGE_REQ_LEVEL} vereist (heb: ${ps.level}).` };
  const currentPrestige = ps.prestige_level || 0;
  if (currentPrestige >= PRESTIGE_MAX) return { success: false, message: "Maximum prestige bereikt." };

  const newPrestige = currentPrestige + 1;
  const perk = PRESTIGE_PERKS[newPrestige];
  const { totalStats, totalMaxHp, totalMaxEnergy } = calculatePrestigeTotalBonuses(newPrestige);

  const baseStats = { muscle: 1 + (totalStats.muscle || 0), brains: 1 + (totalStats.brains || 0), charm: 1 + (totalStats.charm || 0) };
  const newMaxHp = 100 + totalMaxHp;
  const newMaxEnergy = 100 + totalMaxEnergy;
  const carryOverSP = perk?.sp_carry || 2;
  const cashBonus = perk?.cash_bonus || 0;

  await supabase.from("player_state").update({
    level: 1, xp: 0, next_xp: 100,
    skill_points: carryOverSP,
    prestige_level: newPrestige,
    xp_streak: 0,
    stats: baseStats,
    max_hp: newMaxHp, hp: newMaxHp,
    max_energy: newMaxEnergy, energy: newMaxEnergy,
    money: (ps.money || 0) + cashBonus,
  }).eq("user_id", userId);

  await supabase.from("player_skills").delete().eq("user_id", userId);

  await supabase.from("game_action_log").insert({
    user_id: userId,
    action_type: "prestige",
    action_data: { fromLevel: ps.level, fromPrestige: currentPrestige },
    result_data: { newPrestige, perkLabel: perk?.label, cashBonus, carryOverSP, baseStats, maxHp: newMaxHp, maxEnergy: newMaxEnergy },
  });

  const perksText = [
    cashBonus > 0 ? `€${cashBonus.toLocaleString()} startbonus` : null,
    carryOverSP > 2 ? `${carryOverSP} SP behouden` : null,
    totalMaxHp > 0 ? `+${totalMaxHp} Max HP` : null,
    totalMaxEnergy > 0 ? `+${totalMaxEnergy} Max Energy` : null,
    `+${newPrestige * 5}% XP permanent`,
  ].filter(Boolean).join(", ");

  return {
    success: true,
    message: `${perk?.label || `Prestige ${newPrestige}`}! ${perksText}`,
    data: {
      prestigeLevel: newPrestige,
      perk,
      totalBonuses: { stats: totalStats, maxHp: totalMaxHp, maxEnergy: totalMaxEnergy },
      cashBonus, carryOverSP,
    },
  };
}

// ========== GAIN XP (server-validated) ==========

async function handleGainXp(supabase: any, userId: string, ps: any, payload: { amount: number; source: string }): Promise<ActionResult> {
  let { amount, source } = payload;
  if (!amount || amount <= 0) return { success: false, message: "Ongeldige XP." };
  if (amount > 10000) amount = 10000; // anti-exploit cap

  // Build multiplier breakdown
  const bonuses: { key: string; label: string; value: number }[] = [];
  let multiplier = 1.0;

  // 1. District bonus
  const districtBonuses: Record<string, number> = { low: 0, port: 0.05, iron: 0.10, neon: 0.15, crown: 0.20 };
  const districtBonus = districtBonuses[ps.loc] || 0;
  if (districtBonus > 0) {
    multiplier += districtBonus;
    bonuses.push({ key: "district", label: `${(ps.loc as string).toUpperCase()} district`, value: districtBonus });
  }

  // 2. Streak bonus (+2% per action streak, max 20%)
  const streak = Math.min(10, ps.xp_streak || 0);
  const streakBonus = streak * 0.02;
  if (streakBonus > 0) {
    multiplier += streakBonus;
    bonuses.push({ key: "streak", label: `Streak ×${streak}`, value: streakBonus });
  }

  // 3. Prestige bonus (+5% per prestige level)
  const prestigeBonus = (ps.prestige_level || 0) * 0.05;
  if (prestigeBonus > 0) {
    multiplier += prestigeBonus;
    bonuses.push({ key: "prestige", label: `Prestige Lv${ps.prestige_level}`, value: prestigeBonus });
  }

  // 4. Gang bonus (+10% if in gang, +15% if gang level >= 5)
  const { data: gangMember } = await supabase
    .from("gang_members").select("gang_id").eq("user_id", userId).limit(1);
  let gangBonus = 0;
  if (gangMember && gangMember.length > 0) {
    gangBonus = 0.10;
    // Check gang level for extra bonus
    const { data: gang } = await supabase
      .from("gangs").select("level").eq("id", gangMember[0].gang_id).maybeSingle();
    if (gang && gang.level >= 5) gangBonus = 0.15;
    multiplier += gangBonus;
    bonuses.push({ key: "gang", label: `Gang${gang?.level >= 5 ? " Elite" : ""}`, value: gangBonus });
  }

  // 5. First-of-day bonus (+25% for first XP action of a new day)
  const lastActionDate = ps.last_action_at ? new Date(ps.last_action_at).toDateString() : null;
  const todayDate = new Date().toDateString();
  const isFirstOfDay = lastActionDate !== todayDate;
  if (isFirstOfDay) {
    multiplier += 0.25;
    bonuses.push({ key: "first_of_day", label: "Eerste actie bonus", value: 0.25 });
  }

  // 6. Mastermind skill bonus (+10% per level)
  const { data: mastermindSkill } = await supabase
    .from("player_skills").select("level").eq("user_id", userId).eq("skill_id", "mastermind").maybeSingle();
  if (mastermindSkill) {
    const skillBonus = mastermindSkill.level * 0.10;
    multiplier += skillBonus;
    bonuses.push({ key: "skill_mastermind", label: `Mastermind Lv${mastermindSkill.level}`, value: skillBonus });
  }

  // 7. Night bonus (+10% during night phase from world_state)
  // 8. World event bonus (e.g. 2x XP Weekend)
  const { data: worldState } = await supabase
    .from("world_state").select("time_of_day, active_event").eq("id", 1).maybeSingle();
  if (worldState?.time_of_day === "night") {
    multiplier += 0.10;
    bonuses.push({ key: "night", label: "Nachtbonus", value: 0.10 });
  }
  const activeEvent = worldState?.active_event;
  if (activeEvent?.xp_multiplier && activeEvent.xp_multiplier > 1) {
    const eventBonus = activeEvent.xp_multiplier - 1; // e.g. 2x = +1.0
    multiplier += eventBonus;
    bonuses.push({ key: "world_event", label: activeEvent.name || "World Event", value: eventBonus });
  }

  const totalXp = Math.floor(amount * multiplier);
  let newXp = ps.xp + totalXp;
  let newLevel = ps.level;
  let newNextXp = ps.next_xp;
  let newSP = ps.skill_points;
  let levelUps = 0;

  // Process level ups
  while (newXp >= newNextXp) {
    newXp -= newNextXp;
    newLevel++;
    levelUps++;
    newSP += SP_PER_LEVEL;
    newNextXp = Math.floor(newNextXp * XP_SCALE);
  }

  // Increment streak (reset if first-of-day)
  const newStreak = isFirstOfDay ? 1 : (ps.xp_streak || 0) + 1;

  await supabase.from("player_state").update({
    xp: newXp, level: newLevel, next_xp: newNextXp,
    skill_points: newSP, xp_streak: newStreak,
    last_action_at: new Date().toISOString(),
  }).eq("user_id", userId);

  // Log XP gain for analytics
  await supabase.from("game_action_log").insert({
    user_id: userId,
    action_type: "gain_xp",
    action_data: { source, baseAmount: amount },
    result_data: { totalXp, multiplier, bonuses, levelUps, newLevel },
  });

  const bonusSummary = bonuses.map(b => `${b.label} +${Math.round(b.value * 100)}%`).join(", ");
  return {
    success: true,
    message: levelUps > 0
      ? `+${totalXp} XP (×${multiplier.toFixed(2)}) — Level ${newLevel}! +${levelUps * SP_PER_LEVEL} SP`
      : `+${totalXp} XP (×${multiplier.toFixed(2)})${bonusSummary ? ` [${bonusSummary}]` : ""}`,
    data: { xpGained: totalXp, baseAmount: amount, multiplier, bonuses, newXp, newLevel, newNextXp, newSP, levelUps, streak: newStreak, isFirstOfDay },
  };
}

// ========== GET DISTRICT DATA (MMO map) ==========

async function handleGetDistrictData(supabase: any): Promise<ActionResult> {
  const districts = ["port", "crown", "iron", "low", "neon"];
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  // 1. Player counts per district (active in last 15 min)
  const { data: playerRows } = await supabase.from("player_state")
    .select("loc")
    .gte("last_action_at", fifteenMinAgo);
  
  const playerCounts: Record<string, number> = {};
  for (const d of districts) playerCounts[d] = 0;
  for (const r of (playerRows || [])) {
    if (playerCounts[r.loc] !== undefined) playerCounts[r.loc]++;
  }

  // 2. Active district events (not expired)
  const { data: events } = await supabase.from("district_events")
    .select("*")
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  // 3. Gang territories with gang info
  const { data: terrs } = await supabase.from("gang_territories")
    .select("district_id, gang_id, total_influence, defense_level");
  
  const territories: any[] = [];
  if (terrs && terrs.length > 0) {
    const gangIds = [...new Set(terrs.map((t: any) => t.gang_id))];
    const { data: gangs } = await supabase.from("gangs")
      .select("id, name, tag")
      .in("id", gangIds);
    const gangMap: Record<string, any> = {};
    for (const g of (gangs || [])) gangMap[g.id] = g;

    for (const t of terrs) {
      const gang = gangMap[t.gang_id];
      if (gang) {
        territories.push({
          district_id: t.district_id,
          gang_id: t.gang_id,
          gang_name: gang.name,
          gang_tag: gang.tag,
          total_influence: t.total_influence,
          defense_level: t.defense_level,
        });
      }
    }
  }

  // 4. Danger levels — based on recent PvP + active gang wars + events
  const { data: recentPvP } = await supabase.from("game_action_log")
    .select("action_data")
    .eq("action_type", "attack")
    .gte("created_at", fifteenMinAgo)
    .limit(100);
  
  const { data: activeWars } = await supabase.from("gang_wars")
    .select("district_id")
    .eq("status", "active");

  const dangerLevels: Record<string, number> = {};
  for (const d of districts) {
    let danger = playerCounts[d] * 2; // more players = more danger
    // Count PvP activity
    // Count events in this district
    const distEvents = (events || []).filter((e: any) => e.district_id === d);
    danger += distEvents.length * 10;
    // Active wars in this district
    const wars = (activeWars || []).filter((w: any) => w.district_id === d);
    danger += wars.length * 25;
    dangerLevels[d] = Math.min(100, danger);
  }

  // 5. Top 5 players per district
  const districtPlayers: Record<string, any[]> = {};
  for (const d of districts) {
    const { data: topPlayers } = await supabase.from("player_state")
      .select("user_id, level, rep")
      .eq("loc", d)
      .gte("last_action_at", fifteenMinAgo)
      .order("rep", { ascending: false })
      .limit(5);

    if (topPlayers && topPlayers.length > 0) {
      const userIds = topPlayers.map((p: any) => p.user_id);
      const { data: profiles } = await supabase.from("profiles")
        .select("id, username")
        .in("id", userIds);
      const profileMap: Record<string, string> = {};
      for (const p of (profiles || [])) profileMap[p.id] = p.username;

      districtPlayers[d] = topPlayers.map((p: any) => ({
        username: profileMap[p.user_id] || "???",
        level: p.level,
        rep: p.rep,
      }));
    } else {
      districtPlayers[d] = [];
    }
  }

  return {
    success: true,
    message: "District data opgehaald.",
    data: { playerCounts, events: events || [], territories, dangerLevels, districtPlayers },
  };
}

// ========== ACCEPT CONTRACT (server-side generation) ==========

const CONTRACT_TEMPLATES_SERVER = [
  { name: "Koeriersdienst", risk: 15, heat: 8, rewardBase: 1200, type: "delivery", reqPrestige: 0 },
  { name: "Rivalen Intimideren", risk: 45, heat: 25, rewardBase: 3500, type: "combat", reqPrestige: 0 },
  { name: "Inbraak", risk: 55, heat: 35, rewardBase: 5500, type: "stealth", reqPrestige: 0 },
  { name: "Datadiefstal", risk: 40, heat: 12, rewardBase: 4000, type: "tech", reqPrestige: 0 },
  { name: "Wapenlevering", risk: 35, heat: 20, rewardBase: 2800, type: "delivery", reqPrestige: 0 },
  { name: "Bescherming Bieden", risk: 25, heat: 10, rewardBase: 2000, type: "combat", reqPrestige: 0 },
  { name: "Surveillance Missie", risk: 30, heat: 8, rewardBase: 2500, type: "tech", reqPrestige: 0 },
  { name: "Safe Kraken", risk: 65, heat: 40, rewardBase: 8000, type: "stealth", reqPrestige: 0 },
  { name: "Smokkelroute Openen", risk: 50, heat: 30, rewardBase: 6000, type: "delivery", reqPrestige: 0 },
  { name: "Server Hack", risk: 60, heat: 15, rewardBase: 7000, type: "tech", reqPrestige: 0 },
  // Elite contracts — Prestige 2+
  { name: "Diplomatieke Liquidatie", risk: 80, heat: 50, rewardBase: 18000, type: "combat", reqPrestige: 2 },
  { name: "Schaduw Protocol", risk: 75, heat: 20, rewardBase: 15000, type: "stealth", reqPrestige: 2 },
  { name: "Quantum Dataroof", risk: 70, heat: 15, rewardBase: 14000, type: "tech", reqPrestige: 2 },
  { name: "Intercontinentale Smokkel", risk: 65, heat: 35, rewardBase: 16000, type: "delivery", reqPrestige: 2 },
  { name: "Overheids Sabotage", risk: 85, heat: 60, rewardBase: 22000, type: "tech", reqPrestige: 3 },
  { name: "Kingpin Executie", risk: 90, heat: 70, rewardBase: 30000, type: "combat", reqPrestige: 3 },
];

const FACTION_IDS = ["bikers", "cartel", "syndicate"];

async function handleAcceptContract(supabase: any, userId: string, ps: any, payload: any): Promise<ActionResult> {
  const blocked = checkBlocked(ps);
  if (blocked) return { success: false, message: blocked };

  // Energy check
  const energyCost = 5;
  if (ps.energy < energyCost) return { success: false, message: `Niet genoeg energy om een contract te zoeken (nodig: ${energyCost}).` };

  // Rate limit: max 3 contracts accepted per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentAccepts } = await supabase.from("game_action_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action_type", "accept_contract")
    .gte("created_at", oneHourAgo);
  if ((recentAccepts || 0) >= 3) {
    return { success: false, message: "Je kunt maximaal 3 contracten per uur aannemen. Probeer later opnieuw." };
  }

  // Load save_data
  const { data: stateRow } = await supabase.from("player_state")
    .select("save_data").eq("user_id", userId).maybeSingle();
  if (!stateRow?.save_data) return { success: false, message: "Geen speeldata gevonden." };

  const saveData = typeof stateRow.save_data === "string" ? JSON.parse(stateRow.save_data) : { ...stateRow.save_data };
  const activeContracts = saveData.activeContracts || [];

  // Max 5 active contracts
  if (activeContracts.length >= 5) {
    return { success: false, message: "Je hebt al 5 actieve contracten. Voltooi of verwijder er eerst één." };
  }

  // Check which factions are active (not conquered)
  const { data: factionRows } = await supabase.from("faction_relations")
    .select("faction_id, status, conquest_phase")
    .in("status", ["active"]);
  const activeFactions = (factionRows || []).map((f: any) => f.faction_id).filter((fid: string) => FACTION_IDS.includes(fid));
  const factions = activeFactions.length >= 2 ? activeFactions : FACTION_IDS;

  // Time-of-day modifiers
  const timeMods = await getTimeModifiers(supabase);

  // Generate contract server-side
  // Filter templates by player prestige level
  const playerPrestige = ps.prestige_level || 0;
  const availableTemplates = CONTRACT_TEMPLATES_SERVER.filter(t => (t.reqPrestige || 0) <= playerPrestige);
  const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
  const dayScaling = 1 + Math.min(ps.day * 0.05, 3.0);
  const levelBonus = 1 + ps.level * 0.05;
  const nightRewardMult = timeMods.phase === "night" ? 1.2 : timeMods.phase === "dusk" ? 1.1 : 1.0;

  const employer = factions[Math.floor(Math.random() * factions.length)];
  let target = factions[Math.floor(Math.random() * factions.length)];
  let attempts = 0;
  while (target === employer && factions.length >= 2 && attempts < 10) {
    target = factions[Math.floor(Math.random() * factions.length)];
    attempts++;
  }

  const contractId = Date.now() + Math.floor(Math.random() * 10000);
  const risk = Math.min(95, Math.floor(template.risk + ps.day / 2));
  const heat = Math.floor(template.heat * timeMods.heatMultiplier);
  const reward = Math.floor(template.rewardBase * dayScaling * levelBonus * nightRewardMult);
  const xp = Math.floor(35 + ps.day * 2 + (template.reqPrestige >= 2 ? 50 : 0));
  const isElite = (template.reqPrestige || 0) >= 2;

  const newContract = {
    id: contractId,
    name: template.name,
    type: template.type,
    employer,
    target,
    risk,
    heat,
    reward,
    xp,
    elite: isElite,
  };

  activeContracts.push(newContract);
  saveData.activeContracts = activeContracts;

  // Deduct energy, update save_data
  await supabase.from("player_state").update({
    save_data: saveData,
    energy: ps.energy - energyCost,
    last_action_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);

  const nightLabel = timeMods.phase === "night" ? " 🌙" : timeMods.phase === "dusk" ? " 🌆" : "";

  return {
    success: true,
    message: `Nieuw contract aangenomen: ${template.name}${nightLabel} — €${reward.toLocaleString()} beloning, ${risk}% risico.`,
    data: { contract: newContract, saveData, timeBonus: timeMods.phase },
  };
}

// ========== DROP CONTRACT (server-validated) ==========

async function handleDropContract(supabase: any, userId: string, ps: any, payload: any): Promise<ActionResult> {
  const { contractId } = payload || {};
  if (contractId === undefined) return { success: false, message: "Geen contract ID opgegeven." };

  const blocked = checkBlocked(ps);
  if (blocked) return { success: false, message: blocked };

  // Load save_data
  const { data: stateRow } = await supabase.from("player_state")
    .select("save_data").eq("user_id", userId).maybeSingle();
  if (!stateRow?.save_data) return { success: false, message: "Geen speeldata gevonden." };

  const saveData = typeof stateRow.save_data === "string" ? JSON.parse(stateRow.save_data) : { ...stateRow.save_data };
  const contracts = saveData.activeContracts || [];
  const idx = contracts.findIndex((c: any) => c.id === contractId);
  if (idx === -1) return { success: false, message: "Contract niet gevonden." };

  const contract = contracts[idx];

  // Rep penalty: 10 base + 5% of contract reward value
  const repPenalty = Math.min(50, 10 + Math.floor(contract.reward * 0.05));
  const karmaPenalty = -3;

  // Remove contract
  contracts.splice(idx, 1);
  saveData.activeContracts = contracts;

  // Apply karma
  saveData.karma = (saveData.karma || 0) + karmaPenalty;

  const newRep = Math.max(0, (ps.rep || 0) - repPenalty);

  await supabase.from("player_state").update({
    save_data: saveData,
    rep: newRep,
    karma: saveData.karma,
    updated_at: new Date().toISOString(),
    last_action_at: new Date().toISOString(),
  }).eq("user_id", userId);

  // Log
  await supabase.from("game_action_log").insert({
    user_id: userId, action_type: "drop_contract",
    action_data: { contractId, contractName: contract.name },
    result_data: { repPenalty, karmaPenalty },
  });

  return {
    success: true,
    message: `Contract "${contract.name}" geannuleerd. -${repPenalty} REP | ${karmaPenalty} Karma`,
    data: { repPenalty, karmaPenalty, saveData },
  };
}

// ========== COMPLETE CONTRACT (server-validated) ==========

const CONTRACT_TYPES: Record<string, { baseReward: [number, number]; baseXp: [number, number]; baseHeat: [number, number]; baseRep: [number, number] }> = {
  delivery: { baseReward: [2000, 6000], baseXp: [20, 40], baseHeat: [5, 15], baseRep: [5, 15] },
  combat: { baseReward: [4000, 10000], baseXp: [30, 60], baseHeat: [10, 25], baseRep: [10, 25] },
  stealth: { baseReward: [3000, 8000], baseXp: [25, 50], baseHeat: [3, 10], baseRep: [8, 20] },
  tech: { baseReward: [3500, 9000], baseXp: [25, 55], baseHeat: [5, 12], baseRep: [8, 18] },
};

async function handleCompleteContract(supabase: any, userId: string, ps: any, payload: any): Promise<ActionResult> {
  const { contractId, contractType, successRate, encounterCount } = payload || {};
  if (contractId === undefined || !contractType || successRate === undefined || !encounterCount) {
    return { success: false, message: "Ongeldige contractdata." };
  }

  const blocked = checkBlocked(ps);
  if (blocked) return { success: false, message: blocked };

  // Energy & nerve checks
  const energyCost = 15;
  const nerveCost = 10;
  if (ps.energy < energyCost) return { success: false, message: `Niet genoeg energy (nodig: ${energyCost}, heb: ${ps.energy}).` };
  if (ps.nerve < nerveCost) return { success: false, message: `Niet genoeg nerve (nodig: ${nerveCost}, heb: ${ps.nerve}).` };

  // Crime cooldown check
  if (ps.crime_cooldown_until && new Date(ps.crime_cooldown_until) > new Date()) {
    const remaining = Math.ceil((new Date(ps.crime_cooldown_until).getTime() - Date.now()) / 1000);
    return { success: false, message: `Crime cooldown actief. Wacht nog ${remaining}s.` };
  }

  // Anti-abuse: rate limit completions (max 10 per hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCompletions } = await supabase.from("game_action_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action_type", "complete_contract")
    .gte("created_at", oneHourAgo);
  if ((recentCompletions || 0) >= 10) {
    return { success: false, message: "Te veel contracten in korte tijd. Wacht even." };
  }

  // Anti-abuse: validate input ranges
  if (typeof contractId !== "number" || contractId < 0) return { success: false, message: "Ongeldig contract ID." };
  if (typeof successRate !== "number" || successRate < 0 || successRate > 1) return { success: false, message: "Ongeldige success rate." };
  if (typeof encounterCount !== "number" || encounterCount < 1 || encounterCount > 10) return { success: false, message: "Ongeldig aantal encounters." };

  // Validate contract type exists
  const typeDef = CONTRACT_TYPES[contractType];
  if (!typeDef) return { success: false, message: "Onbekend contracttype." };

  // Load save_data to verify contract exists
  const { data: stateRow } = await supabase.from("player_state")
    .select("save_data").eq("user_id", userId).maybeSingle();
  
  if (!stateRow?.save_data) return { success: false, message: "Geen speeldata gevonden." };
  
  const saveData = typeof stateRow.save_data === "string" ? JSON.parse(stateRow.save_data) : { ...stateRow.save_data };
  
  // Verify the contract exists in activeContracts
  const contractIdx = (saveData.activeContracts || []).findIndex((c: any) => c.id === contractId);
  if (contractIdx === -1) return { success: false, message: "Contract niet gevonden in je actieve contracten." };
  
  const contract = saveData.activeContracts[contractIdx];

  // Time-of-day modifiers
  const timeMods = await getTimeModifiers(supabase);

  // Server-side reward calculation (prevents client tampering)
  const dayScaling = Math.min(ps.day * 0.02, 2.0);
  const levelBonus = 1 + ps.level * 0.05;
  
  // Clamp successRate to [0, 1]
  const clampedRate = Math.max(0, Math.min(1, successRate));
  const encountersClamped = Math.max(1, Math.min(5, encounterCount));
  
  // Calculate reward based on contract's stored values + success rate
  let reward = contract.reward || Math.floor(
    (typeDef.baseReward[0] + Math.random() * (typeDef.baseReward[1] - typeDef.baseReward[0])) * (1 + dayScaling) * levelBonus
  );
  let xpGain = Math.floor((contract.xp || Math.floor(
    typeDef.baseXp[0] + Math.random() * (typeDef.baseXp[1] - typeDef.baseXp[0])
  )) * timeMods.xpMultiplier);
  let heatGain = contract.heat || Math.floor(
    typeDef.baseHeat[0] + Math.random() * (typeDef.baseHeat[1] - typeDef.baseHeat[0])
  );
  let repGain = Math.floor(
    typeDef.baseRep[0] + Math.random() * (typeDef.baseRep[1] - typeDef.baseRep[0])
  );
  
  const overallSuccess = clampedRate >= 0.5;
  
  if (clampedRate >= 0.8) {
    reward = Math.floor(reward * 1.3);
    repGain = Math.floor(repGain * 1.5);
  } else if (clampedRate >= 0.5) {
    reward = Math.floor(reward * 0.8);
  } else {
    reward = Math.floor(reward * 0.3);
    heatGain = Math.floor(heatGain * 1.5);
    repGain = Math.max(2, Math.floor(repGain * 0.3));
  }

  // Apply time-of-day modifiers
  reward = Math.floor(reward * (timeMods.phase === 'night' ? 1.2 : timeMods.phase === 'dusk' ? 1.1 : 1.0));
  heatGain = Math.floor(heatGain * timeMods.heatMultiplier);

  // Apply faction relation changes from contract
  if (contract.employer && contract.target) {
    saveData.familyRel = saveData.familyRel || {};
    if (overallSuccess) {
      saveData.familyRel[contract.employer] = Math.min(100, (saveData.familyRel[contract.employer] || 0) + 10);
      saveData.familyRel[contract.target] = Math.max(-100, (saveData.familyRel[contract.target] || 0) - 8);
    } else {
      saveData.familyRel[contract.employer] = Math.max(-100, (saveData.familyRel[contract.employer] || 0) - 5);
    }
  }

  // Remove contract from active list
  saveData.activeContracts.splice(contractIdx, 1);
  
  // Update daily progress
  if (saveData.dailyProgress) {
    saveData.dailyProgress.contracts = (saveData.dailyProgress.contracts || 0) + 1;
  }

  // Update save_data
  if (overallSuccess) {
    saveData.dirtyMoney = (saveData.dirtyMoney || 0) + reward;
    saveData.stats = saveData.stats || {};
    saveData.stats.totalEarned = (saveData.stats.totalEarned || 0) + reward;
    saveData.stats.missionsCompleted = (saveData.stats.missionsCompleted || 0) + 1;
  } else {
    saveData.stats = saveData.stats || {};
    saveData.stats.missionsFailed = (saveData.stats.missionsFailed || 0) + 1;
  }
  saveData.rep = (saveData.rep || 0) + repGain;

  // XP + level up
  saveData.player = saveData.player || { xp: 0, nextXp: 100, level: 1, skillPoints: 0 };
  saveData.player.xp = (saveData.player.xp || 0) + xpGain;
  let leveledUp = false;
  if (saveData.player.xp >= (saveData.player.nextXp || 100)) {
    saveData.player.xp -= saveData.player.nextXp;
    saveData.player.level = (saveData.player.level || 1) + 1;
    saveData.player.nextXp = Math.floor((saveData.player.nextXp || 100) * 1.4);
    saveData.player.skillPoints = (saveData.player.skillPoints || 0) + 2;
    leveledUp = true;
  }

  // Heat (split between personal and vehicle)
  const personalHeatGain = Math.floor(heatGain * 0.5);
  saveData.personalHeat = Math.min(100, (saveData.personalHeat || 0) + personalHeatGain);
  saveData.heat = Math.max(saveData.personalHeat || 0, 
    (saveData.ownedVehicles || []).find((v: any) => v.id === saveData.activeVehicle)?.vehicleHeat || 0
  );

  const crimeCooldown = new Date(Date.now() + 90 * 1000).toISOString(); // 90s cooldown for contracts

  // Write back
  await supabase.from("player_state").update({
    save_data: saveData,
    dirty_money: (ps.dirty_money || 0) + (overallSuccess ? reward : 0),
    rep: (ps.rep || 0) + repGain,
    heat: saveData.heat || ps.heat,
    personal_heat: saveData.personalHeat || ps.personal_heat,
    xp: saveData.player.xp,
    level: saveData.player.level,
    energy: ps.energy - energyCost,
    nerve: ps.nerve - nerveCost,
    crime_cooldown_until: crimeCooldown,
    stats_missions_completed: overallSuccess ? (ps.stats_missions_completed || 0) + 1 : ps.stats_missions_completed,
    stats_missions_failed: !overallSuccess ? (ps.stats_missions_failed || 0) + 1 : ps.stats_missions_failed,
    stats_total_earned: (ps.stats_total_earned || 0) + (overallSuccess ? reward : 0),
    updated_at: new Date().toISOString(),
    last_action_at: new Date().toISOString(),
  }).eq("user_id", userId);

  // Log
  await supabase.from("game_action_log").insert({
    user_id: userId, action_type: "complete_contract",
    action_data: { contractId, contractType, successRate: clampedRate },
    result_data: { success: overallSuccess, reward, xpGain, repGain, heatGain },
  });

  const nightLabel = timeMods.phase === 'night' ? ' 🌙' : timeMods.phase === 'dusk' ? ' 🌆' : '';
  const msg = overallSuccess
    ? `Contract voltooid!${nightLabel} +€${reward.toLocaleString()} | +${xpGain} XP | +${repGain} REP${leveledUp ? " | LEVEL UP!" : ""}`
    : `Contract mislukt.${nightLabel} +${xpGain} XP | +${repGain} REP | Extra heat opgelopen.`;

  return {
    success: true,
    message: msg,
    data: {
      overallSuccess,
      reward: overallSuccess ? reward : 0,
      xpGain,
      repGain,
      heatGain,
      leveledUp,
      newLevel: saveData.player.level,
      saveData,
    },
  };
}

// ========== COMPLETE HIT (server-validated assassination) ==========

const HIT_TYPE_CONFIG: Record<string, {
  diffRange: [number, number]; rewardRange: [number, number]; repRange: [number, number];
  heatRange: [number, number]; ammoRange: [number, number]; karmaRange: [number, number]; xpRange: [number, number];
}> = {
  luitenant: { diffRange: [20, 45], rewardRange: [3000, 8000], repRange: [15, 30], heatRange: [8, 15], ammoRange: [3, 4], karmaRange: [-5, -8], xpRange: [30, 50] },
  ambtenaar: { diffRange: [35, 60], rewardRange: [6000, 15000], repRange: [10, 25], heatRange: [12, 25], ammoRange: [4, 5], karmaRange: [-8, -12], xpRange: [40, 70] },
  zakenman: { diffRange: [45, 70], rewardRange: [10000, 25000], repRange: [5, 15], heatRange: [10, 20], ammoRange: [4, 6], karmaRange: [-7, -10], xpRange: [50, 80] },
  verrader: { diffRange: [30, 55], rewardRange: [8000, 18000], repRange: [20, 40], heatRange: [5, 12], ammoRange: [3, 5], karmaRange: [-5, -8], xpRange: [35, 60] },
  vip: { diffRange: [65, 90], rewardRange: [25000, 60000], repRange: [40, 80], heatRange: [20, 35], ammoRange: [6, 8], karmaRange: [-12, -15], xpRange: [80, 120] },
};

async function handleCompleteHit(supabase: any, userId: string, ps: any, payload: any): Promise<ActionResult> {
  const { hitId } = payload || {};
  if (!hitId) return { success: false, message: "Geen hit ID opgegeven." };

  const blocked = checkBlocked(ps);
  if (blocked) return { success: false, message: blocked };

  // Energy & nerve checks (same as contracts)
  const energyCost = 20;
  const nerveCost = 15;
  if (ps.energy < energyCost) return { success: false, message: `Niet genoeg energy (nodig: ${energyCost}, heb: ${ps.energy}).` };
  if (ps.nerve < nerveCost) return { success: false, message: `Niet genoeg nerve (nodig: ${nerveCost}, heb: ${ps.nerve}).` };

  // Crime cooldown check
  if (ps.crime_cooldown_until && new Date(ps.crime_cooldown_until) > new Date()) {
    const remaining = Math.ceil((new Date(ps.crime_cooldown_until).getTime() - Date.now()) / 1000);
    return { success: false, message: `Crime cooldown actief. Wacht nog ${remaining}s.` };
  }

  // Anti-abuse: rate limit (max 8 hits per hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentHits } = await supabase.from("game_action_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action_type", "complete_hit")
    .gte("created_at", oneHourAgo);
  if ((recentHits || 0) >= 8) {
    return { success: false, message: "Te veel hits in korte tijd. Wacht even." };
  }

  // Load save_data
  const { data: stateRow } = await supabase.from("player_state")
    .select("save_data, ammo_stock").eq("user_id", userId).maybeSingle();
  
  if (!stateRow?.save_data) return { success: false, message: "Geen speeldata gevonden." };
  
  const saveData = typeof stateRow.save_data === "string" ? JSON.parse(stateRow.save_data) : { ...stateRow.save_data };
  
  // Find hit contract
  const hitIdx = (saveData.hitContracts || []).findIndex((h: any) => h.id === hitId);
  if (hitIdx === -1) return { success: false, message: "Hit contract niet gevonden." };
  
  const hit = saveData.hitContracts[hitIdx];
  
  // Validate target type
  const typeConfig = HIT_TYPE_CONFIG[hit.targetType];
  if (!typeConfig) return { success: false, message: "Ongeldig doelwit type." };

  // Time-of-day modifiers
  const timeMods = await getTimeModifiers(supabase);

  // Validate district
  if (ps.loc !== hit.district) {
    const districtNames: Record<string, string> = { port: "Port Nero", crown: "Crown Heights", iron: "Iron Borough", low: "Lowrise", neon: "Neon Strip" };
    return { success: false, message: `Je moet in ${districtNames[hit.district] || hit.district} zijn.` };
  }

  // Validate deadline
  if (saveData.day > hit.deadline) {
    saveData.hitContracts.splice(hitIdx, 1);
    await supabase.from("player_state").update({ save_data: saveData }).eq("user_id", userId);
    return { success: false, message: "Contract is verlopen." };
  }

  // Validate ammo from save_data (server-side check)
  const ammoStock = saveData.ammoStock || stateRow.ammo_stock || { "9mm": 0, "7.62mm": 0, shells: 0 };
  // Determine active ammo type from loadout
  const weaponId = saveData.loadout?.weapon;
  let ammoType = "9mm";
  if (weaponId === "shotgun") ammoType = "shells";
  else if (weaponId === "ak47" || weaponId === "sniper") ammoType = "7.62mm";
  
  const currentAmmo = ammoStock[ammoType] || 0;
  if (currentAmmo < hit.ammoCost) {
    return { success: false, message: `Niet genoeg ${ammoType} munitie (${hit.ammoCost} nodig, ${currentAmmo} beschikbaar).` };
  }

  // Consume ammo
  ammoStock[ammoType] = Math.max(0, currentAmmo - hit.ammoCost);
  saveData.ammoStock = ammoStock;
  const totalAmmo = (ammoStock["9mm"] || 0) + (ammoStock["7.62mm"] || 0) + (ammoStock.shells || 0);

  // Server-side success chance calculation
  const stats = ps.stats || {};
  const loadout = ps.loadout || {};
  const muscle = getPlayerStat(stats, loadout, "muscle");
  const brains = getPlayerStat(stats, loadout, "brains");
  
  let chance = 50;
  chance += (muscle + brains) * 2.5;
  chance += ps.level * 2;
  chance -= hit.difficulty;
  // Night bonus for hits
  if (timeMods.phase === 'night') chance += 8;
  else if (timeMods.phase === 'dusk') chance += 4;
  
  // Karma bonus
  if ((ps.karma || 0) < -30) chance += 5;
  
  // District bonus
  if (ps.loc === hit.district) chance += 10;
  
  // Crew enforcer bonus (check save_data crew)
  const hasEnforcer = (saveData.crew || []).some((c: any) => c.role === "Enforcer" && c.hp > 0);
  if (hasEnforcer) chance += 8;
  
  chance = Math.max(10, Math.min(95, Math.round(chance)));
  
  const roll = Math.random() * 100;
  const success = roll < chance;

  if (success) {
    const isMeedogenloos = (ps.karma || 0) < -30;
    const rewardMult = isMeedogenloos ? 1.15 : 1.0;
    let reward = Math.floor(hit.reward * rewardMult);
    const repGain = hit.repReward;
    let xpGain = Math.floor((hit.xpReward || 0) * timeMods.xpMultiplier);
    let heatGain = hit.heatGain;
    const karmaChange = hit.karmaEffect;

    // Apply time-of-day modifiers
    reward = Math.floor(reward * (timeMods.phase === 'night' ? 1.25 : timeMods.phase === 'dusk' ? 1.1 : 1.0));
    heatGain = Math.floor(heatGain * timeMods.heatMultiplier);

    // Update save_data
    saveData.dirtyMoney = (saveData.dirtyMoney || 0) + reward;
    saveData.rep = (saveData.rep || 0) + repGain;
    saveData.stats = saveData.stats || {};
    saveData.stats.totalEarned = (saveData.stats.totalEarned || 0) + reward;
    saveData.stats.missionsCompleted = (saveData.stats.missionsCompleted || 0) + 1;
    saveData.karma = Math.max(-100, (saveData.karma || 0) + karmaChange);
    
    // Heat
    const personalHeatGain = Math.floor(heatGain * 0.8);
    saveData.personalHeat = Math.min(100, (saveData.personalHeat || 0) + personalHeatGain);
    saveData.heat = Math.max(saveData.personalHeat || 0,
      (saveData.ownedVehicles || []).find((v: any) => v.id === saveData.activeVehicle)?.vehicleHeat || 0
    );

    // XP + level
    saveData.player = saveData.player || { xp: 0, nextXp: 100, level: 1, skillPoints: 0 };
    saveData.player.xp = (saveData.player.xp || 0) + xpGain;
    let leveledUp = false;
    if (saveData.player.xp >= (saveData.player.nextXp || 100)) {
      saveData.player.xp -= saveData.player.nextXp;
      saveData.player.level = (saveData.player.level || 1) + 1;
      saveData.player.nextXp = Math.floor((saveData.player.nextXp || 100) * 1.4);
      saveData.player.skillPoints = (saveData.player.skillPoints || 0) + 2;
      leveledUp = true;
    }

    // Faction effect
    if (hit.factionEffect) {
      saveData.familyRel = saveData.familyRel || {};
      saveData.familyRel[hit.factionEffect.familyId] = Math.max(-100, Math.min(100,
        (saveData.familyRel[hit.factionEffect.familyId] || 0) + hit.factionEffect.change
      ));
    }

    // Daily progress
    if (saveData.dailyProgress) {
      saveData.dailyProgress.hits_completed = (saveData.dailyProgress.hits_completed || 0) + 1;
    }

    // Remove contract
    saveData.hitContracts.splice(hitIdx, 1);

    // Write back
    const crimeCooldown = new Date(Date.now() + 120 * 1000).toISOString(); // 120s cooldown for hits
    await supabase.from("player_state").update({
      save_data: saveData,
      dirty_money: (ps.dirty_money || 0) + reward,
      rep: (ps.rep || 0) + repGain,
      heat: saveData.heat || ps.heat,
      personal_heat: saveData.personalHeat || ps.personal_heat,
      karma: saveData.karma,
      xp: saveData.player.xp,
      level: saveData.player.level,
      ammo: totalAmmo,
      ammo_stock: ammoStock,
      energy: ps.energy - energyCost,
      nerve: ps.nerve - nerveCost,
      crime_cooldown_until: crimeCooldown,
      stats_missions_completed: (ps.stats_missions_completed || 0) + 1,
      stats_total_earned: (ps.stats_total_earned || 0) + reward,
      updated_at: new Date().toISOString(),
      last_action_at: new Date().toISOString(),
    }).eq("user_id", userId);

    // Log
    await supabase.from("game_action_log").insert({
      user_id: userId, action_type: "complete_hit",
      action_data: { hitId, targetType: hit.targetType },
      result_data: { success: true, reward, xpGain, repGain, heatGain, chance },
    });

    const nightLabel = timeMods.phase === 'night' ? ' 🌙' : timeMods.phase === 'dusk' ? ' 🌆' : '';
    return {
      success: true,
      message: `${hit.targetName} is uitgeschakeld!${nightLabel} +€${reward.toLocaleString()} | +${repGain} REP | +${xpGain} XP${leveledUp ? " | LEVEL UP!" : ""}`,
      data: { overallSuccess: true, reward, repGain, xpGain, heatGain, karmaChange, leveledUp, chance, saveData },
    };
  } else {
    // Failed hit — still costs energy/nerve
    const extraHeat = Math.floor(hit.heatGain * 1.5 * timeMods.heatMultiplier);
    saveData.personalHeat = Math.min(100, (saveData.personalHeat || 0) + Math.floor(extraHeat * 0.7));
    saveData.heat = Math.max(saveData.personalHeat || 0,
      (saveData.ownedVehicles || []).find((v: any) => v.id === saveData.activeVehicle)?.vehicleHeat || 0
    );
    saveData.stats = saveData.stats || {};
    saveData.stats.missionsFailed = (saveData.stats.missionsFailed || 0) + 1;

    // Crew damage on failure
    if ((saveData.crew || []).length > 0 && Math.random() < 0.4) {
      const idx = Math.floor(Math.random() * saveData.crew.length);
      const dmg = 10 + Math.floor(Math.random() * 16);
      saveData.crew[idx].hp = Math.max(1, saveData.crew[idx].hp - dmg);
    }

    // Faction warned
    if (hit.factionEffect) {
      saveData.familyRel = saveData.familyRel || {};
      saveData.familyRel[hit.factionEffect.familyId] = Math.max(-100,
        (saveData.familyRel[hit.factionEffect.familyId] || 0) - 10
      );
    }

    // Remove contract
    saveData.hitContracts.splice(hitIdx, 1);

    const crimeCooldown = new Date(Date.now() + 120 * 1000).toISOString();
    await supabase.from("player_state").update({
      save_data: saveData,
      heat: saveData.heat || ps.heat,
      personal_heat: saveData.personalHeat || ps.personal_heat,
      ammo: totalAmmo,
      ammo_stock: ammoStock,
      energy: ps.energy - energyCost,
      nerve: ps.nerve - nerveCost,
      crime_cooldown_until: crimeCooldown,
      stats_missions_failed: (ps.stats_missions_failed || 0) + 1,
      updated_at: new Date().toISOString(),
      last_action_at: new Date().toISOString(),
    }).eq("user_id", userId);

    // Log
    await supabase.from("game_action_log").insert({
      user_id: userId, action_type: "complete_hit",
      action_data: { hitId, targetType: hit.targetType },
      result_data: { success: false, heatGain: extraHeat, chance },
    });

    const nightLabel = timeMods.phase === 'night' ? ' 🌙' : timeMods.phase === 'dusk' ? ' 🌆' : '';
    return {
      success: true,
      message: `De aanslag op ${hit.targetName} is mislukt!${nightLabel} Extra heat opgelopen.`,
      data: { overallSuccess: false, reward: 0, heatGain: extraHeat, chance, saveData },
    };
  }
}

// ========== FACTION STATE (MMO shared) ==========

async function handleGetFactionState(supabase: any): Promise<ActionResult> {
  const { data, error } = await supabase.from("faction_relations").select("*");
  if (error) return { success: false, message: "Kan factiestatus niet laden." };
  const factions: Record<string, any> = {};
  for (const f of data || []) factions[f.faction_id] = f;
  return { success: true, message: "OK", data: { factions } };
}

const FACTION_ATTACK_COOLDOWN_SECONDS = 600; // 10 minutes between faction attacks

async function handleAttackFaction(supabase: any, userId: string, ps: any, payload: any): Promise<ActionResult> {
  const { factionId, phase } = payload || {};
  if (!factionId || !phase) return { success: false, message: "Ongeldige aanval data." };

  const blocked = checkBlocked(ps);
  if (blocked) return { success: false, message: blocked };

  // Energy check
  if ((ps.energy || 0) < 15) return { success: false, message: "Niet genoeg energie (15 nodig)." };

  // Nerve check
  if ((ps.nerve || 0) < 10) return { success: false, message: "Niet genoeg lef (10 nodig)." };

  // Get current faction state
  const { data: faction } = await supabase.from("faction_relations")
    .select("*").eq("faction_id", factionId).maybeSingle();
  if (!faction) return { success: false, message: "Factie niet gevonden." };
  if (faction.status === "vassal") return { success: false, message: `${factionId} is al een vazal.` };

  // === 10-MIN COOLDOWN CHECK ===
  if (faction.last_attack_by === userId && faction.last_attack_at) {
    const elapsed = (Date.now() - new Date(faction.last_attack_at).getTime()) / 1000;
    if (elapsed < FACTION_ATTACK_COOLDOWN_SECONDS) {
      const remaining = Math.ceil(FACTION_ATTACK_COOLDOWN_SECONDS - elapsed);
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      return { success: false, message: `Cooldown! Wacht nog ${mins}m ${secs}s voordat je deze factie opnieuw kunt aanvallen.` };
    }
  }

  // Validate phase progression
  const validPhases = ["defense", "subboss", "leader"];
  if (!validPhases.includes(phase)) return { success: false, message: "Ongeldige fase." };

  const phaseIdx = validPhases.indexOf(phase);
  const currentIdx = faction.conquest_phase === "none" ? -1 : validPhases.indexOf(faction.conquest_phase);
  if (phaseIdx > currentIdx + 1) return { success: false, message: "Je moet eerst de vorige fase voltooien." };

  // Server-side combat calculation
  const stats = ps.stats || {};
  const loadout = ps.loadout || {};
  const muscle = getPlayerStat(stats, loadout, "muscle");
  const brains = getPlayerStat(stats, loadout, "brains");

  const phaseDifficulty = { defense: 30, subboss: 50, leader: 75 };
  const difficulty = phaseDifficulty[phase as keyof typeof phaseDifficulty];

  let chance = 40;
  chance += muscle * 3;
  chance += brains * 1.5;
  chance += ps.level * 1.5;
  chance -= difficulty;
  chance = Math.max(10, Math.min(90, Math.round(chance)));

  const roll = Math.random() * 100;
  const success = roll < chance;

  // Consume energy/nerve
  await supabase.from("player_state").update({
    energy: Math.max(0, (ps.energy || 0) - 15),
    nerve: Math.max(0, (ps.nerve || 0) - 10),
    last_action_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);

  if (success) {
    const damage = 15 + Math.floor(Math.random() * 20) + Math.floor(muscle * 1.5);

    // Track per-user damage in total_damage_dealt jsonb
    const damageMap = faction.total_damage_dealt || {};
    damageMap[userId] = (damageMap[userId] || 0) + damage;

    // Track per-gang damage
    const gangDamageMap: Record<string, Record<string, number>> = faction.gang_damage || {};
    const { data: attackerMembership } = await supabase.from("gang_members")
      .select("gang_id").eq("user_id", userId).maybeSingle();
    const attackerGangId = attackerMembership?.gang_id || null;
    if (attackerGangId) {
      if (!gangDamageMap[attackerGangId]) gangDamageMap[attackerGangId] = {};
      gangDamageMap[attackerGangId][userId] = (gangDamageMap[attackerGangId][userId] || 0) + damage;
    }

    // === BOSS HP SCALING: +30/attacker, cap 800 ===
    const uniqueAttackers = Object.keys(damageMap).length;
    const scaledMaxHp = Math.min(800, faction.boss_max_hp + (uniqueAttackers > 1 ? (uniqueAttackers - 1) * 30 : 0));
    const newMaxHp = Math.max(faction.boss_max_hp, scaledMaxHp);
    const hpBoost = newMaxHp - faction.boss_max_hp;
    const adjustedCurrentHp = faction.boss_hp + hpBoost;

    const newHp = Math.max(0, adjustedCurrentHp - damage);
    const phaseComplete = newHp <= 0;

    // Fetch attacker username for news
    const { data: attackerProfile } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();
    const attackerName = attackerProfile?.username || "Een onbekende speler";

    const updateData: any = {
      boss_hp: phaseComplete ? (phase === "leader" ? 0 : 100) : newHp,
      boss_max_hp: phaseComplete ? (phase === "leader" ? newMaxHp : 100) : newMaxHp,
      last_attack_by: userId,
      last_attack_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_damage_dealt: damageMap,
      gang_damage: gangDamageMap,
    };

    // News event for every successful hit
    if (!phaseComplete) {
      const hpPct = Math.round((newHp / newMaxHp) * 100);
      await insertPlayerNews(supabase, {
        text: `⚔️ ${attackerName} valt de ${factionId} aan! Boss HP: ${hpPct}%`,
        icon: '⚔️',
        urgency: 'low',
        category: 'faction',
        detail: `${attackerName} heeft ${damage} schade toegebracht aan de ${factionId} boss. HP: ${newHp}/${newMaxHp}. ${Object.keys(damageMap).length} speler(s) hebben tot nu toe aangevallen.`,
      });
    }

    if (phaseComplete) {
      if (phase === "leader") {
        // Faction conquered!
        updateData.status = "vassal";
        updateData.conquest_phase = "conquered";
        updateData.conquered_by = userId;
        updateData.conquered_at = new Date().toISOString();
        updateData.vassal_owner_id = userId;
        updateData.boss_hp = 0;
        updateData.reset_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

        // === DYNAMIC REWARD POOL: scales with contributors ===
        const totalDamage = Object.values(damageMap as Record<string, number>).reduce((a, b) => a + b, 0);
        const contributorCount = Object.keys(damageMap).length;
        const baseRewardPool = 100000 + (contributorCount * 15000); // +15k per contributor
        const baseRepPool = 100 + (contributorCount * 10); // +10 rep per contributor

        // Distribute to all contributors proportionally
        const sorted = Object.entries(damageMap as Record<string, number>)
          .sort(([, a], [, b]) => b - a);
        
        for (const [dealerId, dealerDmg] of sorted) {
          const proportion = (dealerDmg as number) / totalDamage;
          const reward = Math.max(1000, Math.floor(baseRewardPool * proportion));
          const repBonus = Math.max(5, Math.floor(baseRepPool * proportion));
          
          const { data: dealerState } = await supabase.from("player_state")
            .select("money, rep").eq("user_id", dealerId).single();
          if (dealerState) {
            await supabase.from("player_state").update({
              money: dealerState.money + reward,
              rep: dealerState.rep + repBonus,
            }).eq("user_id", dealerId);
          }

          // Rank badge for top 3
          const rank = sorted.findIndex(([id]) => id === dealerId);
          const rankEmoji = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;
          
          await supabase.from("player_messages").insert({
            sender_id: userId,
            receiver_id: dealerId,
            subject: `🏴 Factie ${factionId} Veroverd!`,
            body: `${rankEmoji} Je hebt ${dealerDmg} schade bijgedragen (${Math.round(proportion * 100)}%) en ontvangt €${reward.toLocaleString()} + ${repBonus} rep.\n\nReward pool: €${baseRewardPool.toLocaleString()} (${contributorCount} bijdragers).`,
          });
        }

        // Gang bonus: extra rewards for gang members who participated
        const gangNames: Record<string, string> = {};
        for (const [gangId, members] of Object.entries(gangDamageMap)) {
          const gangTotalDmg = Object.values(members).reduce((a, b) => a + b, 0);
          const gangProportion = gangTotalDmg / totalDamage;
          const gangBonus = Math.floor(20000 * gangProportion);
          
          const { data: gangData } = await supabase.from("gangs")
            .select("name, treasury").eq("id", gangId).single();
          if (gangData) {
            gangNames[gangId] = gangData.name;
            await supabase.from("gangs").update({
              treasury: gangData.treasury + gangBonus,
              xp: gangBonus,
            }).eq("id", gangId);
          }

          const { data: allGangMembers } = await supabase.from("gang_members")
            .select("user_id").eq("gang_id", gangId);
          if (allGangMembers) {
            const contributorIds = new Set(Object.keys(members));
            for (const member of allGangMembers) {
              if (contributorIds.has(member.user_id)) continue;
              const passiveReward = Math.floor(2000 * gangProportion);
              const { data: memberState } = await supabase.from("player_state")
                .select("money, rep").eq("user_id", member.user_id).single();
              if (memberState && passiveReward > 0) {
                await supabase.from("player_state").update({
                  money: memberState.money + passiveReward,
                  rep: memberState.rep + 5,
                }).eq("user_id", member.user_id);
                await supabase.from("player_messages").insert({
                  sender_id: userId,
                  receiver_id: member.user_id,
                  subject: `🏴 Gang Conquest: ${factionId}`,
                  body: `Je gang ${gangData?.name || ''} heeft ${Math.round(gangProportion * 100)}% bijgedragen aan de verovering! Passieve bonus: €${passiveReward.toLocaleString()} + 5 rep.`,
                });
              }
            }
          }
        }

        const gangSummary = Object.entries(gangDamageMap)
          .map(([gid, members]) => {
            const total = Object.values(members).reduce((a, b) => a + b, 0);
            return { name: gangNames[gid] || gid.slice(0, 8), total, members: Object.keys(members).length };
          })
          .sort((a, b) => b.total - a.total);

        const gangNewsDetail = gangSummary.length > 0
          ? ` Gangs: ${gangSummary.map(g => `${g.name} (${g.members} leden, ${g.total} dmg)`).join(', ')}.`
          : '';

        await insertPlayerNews(supabase, {
          text: `👑 ${attackerName} heeft de ${factionId} veroverd!`,
          icon: '👑',
          urgency: 'high',
          category: 'faction',
          detail: `De ${factionId} is verslagen en 48 uur lang onderworpen. ${contributorCount} spelers vochten mee. Reward pool: €${baseRewardPool.toLocaleString()}.${gangNewsDetail}`,
        });
      } else {
        // Phase complete, advance
        const nextPhase = validPhases[phaseIdx + 1] || "leader";
        updateData.conquest_phase = nextPhase;
        updateData.boss_hp = phase === "defense" ? 100 : 150;
        updateData.boss_max_hp = phase === "defense" ? 100 : 150;

        const phaseNames = { defense: "Verdediging", subboss: "Sub-boss", leader: "Leider" };
        const phaseName = phaseNames[phase as keyof typeof phaseNames];
        const nextPhaseName = phaseNames[nextPhase as keyof typeof phaseNames] || nextPhase;

        await insertPlayerNews(supabase, {
          text: `🔥 ${factionId} ${phaseName}-fase doorbroken! ${nextPhaseName} ontgrendeld.`,
          icon: '🔥',
          urgency: 'medium',
          category: 'faction',
          detail: `${attackerName} heeft de ${phaseName} fase van de ${factionId} doorbroken met de beslissende klap. De ${nextPhaseName} fase is nu beschikbaar voor alle spelers.`,
        });
      }
      updateData.conquest_progress = (phaseIdx + 1) * 33;
    }

    await supabase.from("faction_relations").update(updateData).eq("faction_id", factionId);

    // Award rep/xp to attacker
    const repGain = phaseComplete ? (phase === "leader" ? 100 : 30) : 10;
    const xpGain = phaseComplete ? (phase === "leader" ? 150 : 50) : 20;
    await supabase.from("player_state").update({
      rep: (ps.rep || 0) + repGain,
      xp: (ps.xp || 0) + xpGain,
    }).eq("user_id", userId);

    const phaseNames = { defense: "Verdediging", subboss: "Sub-boss", leader: "Leider" };
    const phaseName = phaseNames[phase as keyof typeof phaseNames];
    const attackerCount = Object.keys(damageMap).length;

    // Calculate cooldown expiry for client
    const cooldownUntil = new Date(Date.now() + FACTION_ATTACK_COOLDOWN_SECONDS * 1000).toISOString();

    return {
      success: true,
      message: phaseComplete
        ? phase === "leader"
          ? `👑 ${factionId} is veroverd! Reset in 48 uur.`
          : `${phaseName} fase voltooid! Schade: ${damage}. Volgende fase ontgrendeld.`
        : `Aanval succesvol! ${damage} schade aan ${phaseName}. HP: ${newHp}/${newMaxHp}`,
      data: {
        damage, newHp, newMaxHp, phaseComplete, chance,
        conquered: phase === "leader" && phaseComplete,
        repGain, xpGain, attackerCount,
        totalDamageDealt: damageMap,
        cooldownUntil,
      },
    };
  } else {
    // Failed attack — player takes damage
    const playerDamage = 10 + Math.floor(Math.random() * 15);
    const newPlayerHp = Math.max(1, (ps.hp || 100) - playerDamage);
    const heatGain = 5 + Math.floor(Math.random() * 8);

    await supabase.from("player_state").update({
      hp: newPlayerHp,
      heat: Math.min(100, (ps.heat || 0) + heatGain),
      personal_heat: Math.min(100, (ps.personal_heat || 0) + heatGain),
    }).eq("user_id", userId);

    const cooldownUntil = new Date(Date.now() + FACTION_ATTACK_COOLDOWN_SECONDS * 1000).toISOString();

    return {
      success: true,
      message: `Aanval mislukt! Je hebt ${playerDamage} schade geleden en ${heatGain} heat opgelopen.`,
      data: { damage: 0, playerDamage, heatGain, chance, conquered: false, cooldownUntil },
    };
  }
}

// ========== FACTION ACTIONS (server-validated) ==========

const FACTION_ACTION_DEFS: Record<string, { baseCost: number; requiresDistrict: boolean; minRel: number | null; maxRel: number | null }> = {
  negotiate: { baseCost: 2000, requiresDistrict: true, minRel: -50, maxRel: null },
  bribe: { baseCost: 5000, requiresDistrict: false, minRel: null, maxRel: null },
  intimidate: { baseCost: 0, requiresDistrict: true, minRel: null, maxRel: null },
  sabotage: { baseCost: 1000, requiresDistrict: true, minRel: null, maxRel: null },
  gift: { baseCost: 0, requiresDistrict: false, minRel: null, maxRel: null },
  intel: { baseCost: 3000, requiresDistrict: false, minRel: 20, maxRel: null },
};

const FACTION_GIFT_GOODS: Record<string, string> = { cartel: 'drugs', syndicate: 'tech', bikers: 'weapons' };

async function handleFactionAction(supabase: any, userId: string, ps: any, payload: any): Promise<ActionResult> {
  const { factionId, actionType } = payload || {};
  if (!factionId || !actionType) return { success: false, message: "Ongeldige parameters." };

  const actionDef = FACTION_ACTION_DEFS[actionType];
  if (!actionDef) return { success: false, message: "Onbekende factie-actie." };

  const blocked = checkBlocked(ps);
  if (blocked) return { success: false, message: blocked };

  // Get faction state
  const { data: faction } = await supabase.from("faction_relations")
    .select("*").eq("faction_id", factionId).maybeSingle();
  if (!faction) return { success: false, message: "Factie niet gevonden." };
  if (faction.status === "vassal") return { success: false, message: "Deze factie is al een vazal." };

  const rel = faction.global_relation || 0;

  // Check min relation
  if (actionDef.minRel !== null && rel < actionDef.minRel) {
    return { success: false, message: `Relatie te laag (min: ${actionDef.minRel}, huidig: ${rel}).` };
  }

  // Check district requirement
  if (actionDef.requiresDistrict) {
    const factionHomes: Record<string, string> = { cartel: 'port', syndicate: 'crown', bikers: 'iron' };
    const homeDistrict = factionHomes[factionId];
    if (homeDistrict && ps.loc !== homeDistrict) {
      return { success: false, message: `Reis eerst naar het thuisdistrict van deze factie.` };
    }
  }

  // Calculate actual cost
  const stats = ps.stats || {};
  const loadout = ps.loadout || {};
  const charm = getPlayerStat(stats, loadout, "charm");

  let cost = 0;
  let relChange = 0;
  let repChange = 0;
  let message = "";

  switch (actionType) {
    case 'negotiate': {
      cost = Math.max(500, 2000 - (charm * 100));
      if (ps.money < cost) return { success: false, message: `Te weinig geld (€${cost} nodig).` };
      const base = 5 + Math.floor(charm / 2);
      relChange = base + Math.floor(Math.random() * 5);
      repChange = 2;
      message = `Onderhandeling geslaagd! Relatie +${relChange}.`;
      break;
    }
    case 'bribe': {
      cost = 5000 + Math.floor(Math.abs(rel) * 30);
      if (ps.money < cost) return { success: false, message: `Te weinig geld (€${cost} nodig).` };
      relChange = 8 + Math.floor(Math.random() * 8);
      repChange = -1;
      message = `Omkoping geslaagd! Relatie +${relChange}.`;
      break;
    }
    case 'intimidate': {
      const success = Math.random() < 0.6 + (charm * 0.02);
      if (success) {
        relChange = -(5 + Math.floor(Math.random() * 5));
        repChange = 5 + Math.floor(Math.random() * 5);
        message = `Intimidatie geslaagd! Rep +${repChange}, Relatie ${relChange}.`;
      } else {
        relChange = -(10 + Math.floor(Math.random() * 5));
        repChange = -2;
        message = `Intimidatie gefaald! Relatie ${relChange}.`;
      }
      break;
    }
    case 'sabotage': {
      cost = 1000;
      if (ps.money < cost) return { success: false, message: `Te weinig geld (€${cost} nodig).` };
      const success = Math.random() < 0.5 + (getPlayerStat(stats, loadout, "brains") * 0.03);
      if (success) {
        relChange = -(8 + Math.floor(Math.random() * 8));
        repChange = 8;
        message = `Sabotage geslaagd! Rep +${repChange}, Relatie ${relChange}.`;
      } else {
        relChange = -(15 + Math.floor(Math.random() * 5));
        repChange = -3;
        message = `Sabotage ontdekt! Relatie ${relChange}.`;
      }
      break;
    }
    case 'gift': {
      const giftGood = FACTION_GIFT_GOODS[factionId];
      if (!giftGood) return { success: false, message: "Deze factie accepteert geen giften." };
      // Check inventory
      const { data: inv } = await supabase.from("player_inventory")
        .select("quantity").eq("user_id", userId).eq("good_id", giftGood).maybeSingle();
      if (!inv || inv.quantity < 3) return { success: false, message: `Je hebt minimaal 3 stuks nodig.` };
      // Consume 3 goods
      await supabase.from("player_inventory").update({ quantity: inv.quantity - 3 })
        .eq("user_id", userId).eq("good_id", giftGood);
      relChange = 12 + Math.floor(Math.random() * 6);
      repChange = 3;
      message = `Gift geaccepteerd! Relatie +${relChange}.`;
      break;
    }
    case 'intel': {
      cost = 3000;
      if (ps.money < cost) return { success: false, message: `Te weinig geld (€${cost} nodig).` };
      relChange = 3;
      repChange = 5;
      message = `Intel gekocht! Je hebt waardevolle informatie verkregen. Rep +${repChange}.`;
      break;
    }
    default:
      return { success: false, message: "Onbekende actie." };
  }

  // Deduct money
  if (cost > 0) {
    await supabase.from("player_state").update({
      money: ps.money - cost,
      last_action_at: new Date().toISOString(),
    }).eq("user_id", userId);
  }

  // Update faction relation
  const newRel = Math.max(-100, Math.min(100, rel + relChange));
  await supabase.from("faction_relations").update({
    global_relation: newRel,
    updated_at: new Date().toISOString(),
  }).eq("faction_id", factionId);

  // Update player rep
  if (repChange !== 0) {
    await supabase.from("player_state").update({
      rep: Math.max(0, (ps.rep || 0) + repChange),
    }).eq("user_id", userId);
  }

  return {
    success: true,
    message,
    data: { relChange, newRelation: newRel, repChange, cost, actionType },
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
    const skipPlayerStateActions = ["init_player", "save_state", "load_state", "get_district_data", "get_faction_state"];
    if (!skipPlayerStateActions.includes(action)) {
      const { data: ps } = await supabase.from("player_state").select("*").eq("user_id", user.id).maybeSingle();
      if (!ps && action !== "get_state") {
        return new Response(JSON.stringify({ success: false, message: "Speler niet gevonden. Initialiseer je speler eerst." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      playerState = ps;
    }

    // Fetch username for player news
    let playerUsername = "Onbekend";
    const { data: pProfile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
    if (pProfile) playerUsername = pProfile.username;

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
      case "join_gang":
        result = await handleJoinGang(supabase, user.id, payload);
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
      case "save_state":
        result = await handleSaveState(supabase, user.id, payload);
        break;
      case "load_state":
        result = await handleLoadState(supabase, user.id);
        break;
      case "pvp_combat_start":
        result = await handlePvPCombatStart(supabase, user.id, playerState, payload);
        break;
      case "pvp_combat_action":
        result = await handlePvPCombatAction(supabase, user.id, payload);
        break;
      case "casino_play":
        result = await handleCasinoPlay(supabase, user.id, playerState, payload);
        break;
      case "unlock_skill":
        result = await handleUnlockSkill(supabase, user.id, playerState, payload);
        break;
      case "get_skills":
        result = await handleGetSkills(supabase, user.id);
        break;
      case "prestige":
        result = await handlePrestige(supabase, user.id, playerState);
        break;
      case "gain_xp":
        result = await handleGainXp(supabase, user.id, playerState, payload);
        break;
      case "get_district_data":
        result = await handleGetDistrictData(supabase);
        break;
      case "accept_contract":
        result = await handleAcceptContract(supabase, user.id, playerState, payload);
        break;
      case "drop_contract":
        result = await handleDropContract(supabase, user.id, playerState, payload);
        break;
      case "complete_contract":
        result = await handleCompleteContract(supabase, user.id, playerState, payload);
        break;
      case "complete_hit":
        result = await handleCompleteHit(supabase, user.id, playerState, payload);
        break;
      case "get_faction_state":
        result = await handleGetFactionState(supabase);
        break;
      case "attack_faction":
        result = await handleAttackFaction(supabase, user.id, playerState, payload);
        break;
      case "faction_action":
        result = await handleFactionAction(supabase, user.id, playerState, payload);
        break;
      case "claim_event":
        result = await handleClaimEvent(supabase, user.id, playerState, payload);
        break;
      default:
        result = { success: false, message: `Onbekende actie: ${action}` };
    }

    // Log action (skip get_state for performance)
    if (action !== "get_state" && action !== "save_state" && action !== "load_state" && action !== "get_district_data" && action !== "get_faction_state") {
      await supabase.from("game_action_log").insert({
        user_id: user.id, action_type: action,
        action_data: payload || {},
        result_data: { success: result.success, message: result.message },
      });
    }

    // === PLAYER NEWS: broadcast notable actions to all players ===
    if (result.success && playerUsername !== "Onbekend") {
      const loc = playerState?.loc || "low";
      const distName = DISTRICT_NAMES[loc] || loc;
      const newsTemplates: Record<string, () => { text: string; icon: string; detail?: string; urgency?: string; districtId?: string } | null> = {
        solo_op: () => {
          const opName = payload?.opId || "operatie";
          const reward = result.data?.reward;
          if (!reward) return null; // only on success
          return {
            text: `${playerUsername} voerde een succesvolle ${opName.replace(/_/g, ' ')} uit in ${distName}`,
            icon: '💰', detail: `Een speler heeft €${reward.toLocaleString()} buitgemaakt in ${distName}. De politie onderzoekt de zaak.`,
            districtId: loc,
          };
        },
        trade: () => {
          const good = GOODS.find(g => g.id === payload?.goodId);
          const qty = result.data?.quantity;
          const mode = payload?.mode;
          if (!good || !qty || qty < 3) return null; // only newsworthy for 3+ units
          return {
            text: `Grote ${mode === 'sell' ? 'verkoop' : 'aankoop'} in ${distName}: ${qty}x ${good.name} door ${playerUsername}`,
            icon: mode === 'sell' ? '📤' : '📥', detail: `De marktprijs van ${good.name} in ${distName} is beïnvloed door deze transactie.`,
            urgency: qty >= 10 ? 'high' : 'medium', districtId: loc,
          };
        },
        attack: () => {
          const won = result.data?.won;
          const targetName = result.data?.targetName;
          if (!targetName) return null;
          if (won) {
            return {
              text: `${playerUsername} heeft ${targetName} verslagen in ${distName}!`,
              icon: '⚔️', detail: `Een gewelddadige confrontatie in ${distName}. ${result.data?.targetHospitalized ? `${targetName} is gehospitaliseerd.` : 'Het slachtoffer overleefde.'}`,
              urgency: 'high', districtId: loc,
            };
          } else {
            return {
              text: `Mislukte aanval: ${playerUsername} werd verslagen door ${targetName}`,
              icon: '🩸', detail: `${playerUsername} beet in het zand na een mislukte aanval in ${distName}.`,
              urgency: 'medium', districtId: loc,
            };
          }
        },
        complete_contract: () => {
          const ok = result.data?.overallSuccess;
          const reward = result.data?.reward;
          if (!ok || !reward) return null;
          return {
            text: `${playerUsername} voltooide een ${result.data?.elite ? 'elite ' : ''}contract voor €${reward.toLocaleString()}`,
            icon: result.data?.elite ? '💎' : '📋', detail: `Een professioneel contract is succesvol afgerond in ${distName}. De opdrachtgever is tevreden.`,
            urgency: result.data?.elite ? 'high' : 'medium', districtId: loc,
          };
        },
        pvp_combat_start: () => {
          return {
            text: `PvP gevecht uitgebroken in ${distName}! ${playerUsername} daagt een rivaal uit`,
            icon: '🥊', detail: `Een directe confrontatie is aan de gang. Wie loopt weg als winnaar?`,
            urgency: 'high', districtId: loc,
          };
        },
        casino_play: () => {
          const won = (result.data?.winnings || 0);
          if (won < 5000) return null; // only newsworthy for big wins
          return {
            text: `JACKPOT! ${playerUsername} won €${won.toLocaleString()} in het casino!`,
            icon: '🎰', detail: `Een geluksvogel heeft groot gewonnen in het Noxhaven Casino.`,
            urgency: 'high',
          };
        },
        attack_faction: () => {
          if (!result.data?.damage) return null;
          return {
            text: `${playerUsername} viel een factie-basis aan!`,
            icon: '💥', detail: `Een brutale aanval op een factie-bolwerk schokt de onderwereld.`,
            urgency: 'high',
          };
        },
      };

      const newsGen = newsTemplates[action];
      if (newsGen) {
        const news = newsGen();
        if (news) {
          insertPlayerNews(supabase, news); // fire-and-forget
        }
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: `Server fout: ${err.message}` }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
