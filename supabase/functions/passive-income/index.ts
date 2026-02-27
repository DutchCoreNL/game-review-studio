import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DISTRICT_INCOME: Record<string, number> = {
  low: 300, port: 600, iron: 800, neon: 1000, crown: 1500,
};

const BUSINESS_INCOME: Record<string, number> = {
  stripclub: 800, wasstraat: 500, restaurant: 1200, autodealer: 2000, casino_biz: 5000,
};

const TICKS_PER_DAY = 96;

// ========== SHARED MARKET ECONOMY ==========

const GOODS = [
  { id: "drugs", name: "Synthetica", base: 200 },
  { id: "weapons", name: "Zware Wapens", base: 1100 },
  { id: "tech", name: "Zwarte Data", base: 900 },
  { id: "luxury", name: "Geroofde Kunst", base: 2400 },
  { id: "meds", name: "Medische Voorraad", base: 600 },
];

const DISTRICT_IDS = ["low", "port", "iron", "neon", "crown"];

// District price modifiers (how much more/less a good costs in each district)
const DISTRICT_MODS: Record<string, Record<string, number>> = {
  port:  { drugs: 0.7, weapons: 0.6, tech: 1.3, luxury: 1.4, meds: 0.8 },
  crown: { drugs: 1.6, weapons: 1.4, tech: 0.6, luxury: 1.8, meds: 1.3 },
  iron:  { drugs: 1.2, weapons: 0.5, tech: 0.8, luxury: 1.1, meds: 1.0 },
  low:   { drugs: 0.5, weapons: 1.5, tech: 1.0, luxury: 0.7, meds: 1.4 },
  neon:  { drugs: 1.4, weapons: 1.2, tech: 1.6, luxury: 0.9, meds: 0.6 },
};

async function tickMarketEconomy(supabase: any) {
  // Fetch all current market prices
  const { data: prices, error } = await supabase.from("market_prices").select("*");
  if (error) { console.error("Market fetch error:", error); return; }

  // If no prices exist, seed the market
  if (!prices || prices.length === 0) {
    await seedMarketPrices(supabase);
    return;
  }

  const now = new Date();
  let updated = 0;

  for (const row of prices) {
    const good = GOODS.find(g => g.id === row.good_id);
    if (!good) continue;

    const distMod = DISTRICT_MODS[row.district_id]?.[row.good_id] || 1.0;
    const basePrice = Math.floor(good.base * distMod);

    // === PRICE DECAY: prices drift back toward base price ===
    const currentPrice = row.current_price;
    const diff = currentPrice - basePrice;
    // Decay 5-15% of the difference per tick (faster for bigger deviations)
    const decayRate = Math.abs(diff) > basePrice * 0.5 ? 0.15 : 0.05;
    const decay = Math.floor(diff * decayRate);
    let newPrice = currentPrice - decay;

    // === RANDOM VOLATILITY: add small random price fluctuation ===
    const volRange = good.base < 500 ? 0.04 : good.base < 1200 ? 0.03 : 0.02;
    const randomShift = Math.floor(basePrice * volRange * (Math.random() * 2 - 1));
    newPrice += randomShift;

    // === DEMAND EVENTS: random demand spikes (2% chance per tick) ===
    if (Math.random() < 0.02) {
      const spike = Math.random() > 0.5 ? 1.3 : 0.7; // demand surge or crash
      newPrice = Math.floor(newPrice * spike);
    }

    // Clamp price: 30% - 300% of base
    newPrice = Math.max(Math.floor(basePrice * 0.3), Math.min(Math.floor(basePrice * 3), newPrice));

    // Determine trend
    const trend = newPrice > currentPrice ? "up" : newPrice < currentPrice ? "down" : row.price_trend;

    // Volume decay: reduce volumes over time (represents market calming down)
    const newBuyVol = Math.max(0, Math.floor((row.buy_volume || 0) * 0.95));
    const newSellVol = Math.max(0, Math.floor((row.sell_volume || 0) * 0.95));

    if (newPrice !== currentPrice || newBuyVol !== row.buy_volume || newSellVol !== row.sell_volume) {
      await supabase.from("market_prices").update({
        current_price: newPrice,
        price_trend: trend,
        buy_volume: newBuyVol,
        sell_volume: newSellVol,
        last_updated: now.toISOString(),
      }).eq("id", row.id);
      updated++;
    }
  }

  console.log(`Market tick: ${updated} prices updated`);
}

async function seedMarketPrices(supabase: any) {
  const rows: any[] = [];
  for (const distId of DISTRICT_IDS) {
    for (const good of GOODS) {
      const distMod = DISTRICT_MODS[distId]?.[good.id] || 1.0;
      const basePrice = Math.floor(good.base * distMod);
      // Add slight randomness to initial prices
      const volatility = 0.9 + Math.random() * 0.2;
      rows.push({
        good_id: good.id,
        district_id: distId,
        current_price: Math.floor(basePrice * volatility),
        buy_volume: 0,
        sell_volume: 0,
        price_trend: "stable",
      });
    }
  }
  const { error } = await supabase.from("market_prices").upsert(rows, { onConflict: "good_id,district_id" });
  if (error) console.error("Market seed error:", error);
  else console.log(`Market seeded: ${rows.length} prices`);
}

// ========== MAIN HANDLER ==========

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // === MARKET ECONOMY TICK ===
    await tickMarketEconomy(supabase);

    // === PASSIVE INCOME ===
    const { data: players, error: pErr } = await supabase
      .from("player_state")
      .select("user_id, money, dirty_money")
      .eq("game_over", false);

    if (pErr) throw pErr;
    if (!players || players.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const player of players) {
      const { data: districts } = await supabase
        .from("player_districts").select("district_id").eq("user_id", player.user_id);
      const { data: businesses } = await supabase
        .from("player_businesses").select("business_id").eq("user_id", player.user_id);

      let cleanIncome = 0;
      let dirtyIncome = 0;

      if (districts) {
        for (const d of districts) {
          dirtyIncome += Math.floor((DISTRICT_INCOME[d.district_id] || 0) / TICKS_PER_DAY);
        }
      }
      if (businesses) {
        for (const b of businesses) {
          cleanIncome += Math.floor((BUSINESS_INCOME[b.business_id] || 0) / TICKS_PER_DAY);
        }
      }

      if (cleanIncome === 0 && dirtyIncome === 0) continue;

      const { error: updateErr } = await supabase.from("player_state").update({
        money: (player.money || 0) + cleanIncome,
        dirty_money: (player.dirty_money || 0) + dirtyIncome,
        updated_at: new Date().toISOString(),
      }).eq("user_id", player.user_id);

      if (!updateErr) processed++;
    }

    // === EXPIRE OLD BOUNTIES ===
    await supabase.from("player_bounties").update({ status: "expired" })
      .eq("status", "active").lt("expires_at", new Date().toISOString());

    console.log(`Passive income: ${processed} players, market ticked`);

    return new Response(
      JSON.stringify({ success: true, processed, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Passive income error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
