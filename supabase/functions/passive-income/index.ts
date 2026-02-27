import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// District income per tick (15 min = 96 ticks/day, so divide daily income by 96)
const DISTRICT_INCOME: Record<string, number> = {
  low: 300,    // €300/day → ~3/tick
  port: 600,
  iron: 800,
  neon: 1000,
  crown: 1500,
};

const BUSINESS_INCOME: Record<string, number> = {
  stripclub: 800,
  wasstraat: 500,
  restaurant: 1200,
  autodealer: 2000,
  casino_biz: 5000,
};

// We pay out 1/96th of daily income per 15-min tick
const TICKS_PER_DAY = 96;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get all active players (not game_over, not in prison/hospital)
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
      // Get districts
      const { data: districts } = await supabase
        .from("player_districts")
        .select("district_id")
        .eq("user_id", player.user_id);

      // Get businesses
      const { data: businesses } = await supabase
        .from("player_businesses")
        .select("business_id")
        .eq("user_id", player.user_id);

      let cleanIncome = 0;
      let dirtyIncome = 0;

      // District income is dirty money
      if (districts) {
        for (const d of districts) {
          const daily = DISTRICT_INCOME[d.district_id] || 0;
          dirtyIncome += Math.floor(daily / TICKS_PER_DAY);
        }
      }

      // Business income is clean money
      if (businesses) {
        for (const b of businesses) {
          const daily = BUSINESS_INCOME[b.business_id] || 0;
          cleanIncome += Math.floor(daily / TICKS_PER_DAY);
        }
      }

      if (cleanIncome === 0 && dirtyIncome === 0) continue;

      // Update player money
      const { error: updateErr } = await supabase
        .from("player_state")
        .update({
          money: (player.money || 0) + cleanIncome,
          dirty_money: (player.dirty_money || 0) + dirtyIncome,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", player.user_id);

      if (!updateErr) processed++;
    }

    console.log(`Passive income processed for ${processed} players`);

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
