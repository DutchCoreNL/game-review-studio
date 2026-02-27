import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SyncPayload {
  rep: number;
  cash: number;
  day: number;
  level: number;
  districts_owned: number;
  crew_size: number;
  karma: number;
  backstory: string | null;
}

// Reasonable bounds for validation
const LIMITS = {
  rep: { min: 0, max: 100000 },
  cash: { min: 0, max: 50000000 },
  day: { min: 1, max: 9999 },
  level: { min: 1, max: 100 },
  districts_owned: { min: 0, max: 5 },
  crew_size: { min: 0, max: 20 },
  karma: { min: -100, max: 100 },
};

function validate(data: unknown): { ok: true; data: SyncPayload } | { ok: false; error: string } {
  if (!data || typeof data !== "object") return { ok: false, error: "Invalid payload" };

  const d = data as Record<string, unknown>;

  for (const [key, bounds] of Object.entries(LIMITS)) {
    const val = d[key];
    if (typeof val !== "number" || !Number.isFinite(val)) {
      return { ok: false, error: `${key} must be a finite number` };
    }
    if (val < bounds.min || val > bounds.max) {
      return { ok: false, error: `${key} out of range (${bounds.min}-${bounds.max})` };
    }
    // Must be integer
    if (!Number.isInteger(val)) {
      return { ok: false, error: `${key} must be an integer` };
    }
  }

  if (d.backstory !== null && typeof d.backstory !== "string") {
    return { ok: false, error: "backstory must be string or null" };
  }
  if (typeof d.backstory === "string" && d.backstory.length > 50) {
    return { ok: false, error: "backstory too long" };
  }

  return {
    ok: true,
    data: {
      rep: d.rep as number,
      cash: d.cash as number,
      day: d.day as number,
      level: d.level as number,
      districts_owned: d.districts_owned as number,
      crew_size: d.crew_size as number,
      karma: d.karma as number,
      backstory: (d.backstory as string | null),
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create anon client to verify user token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate payload
    const body = await req.json();
    const result = validate(body);
    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for write (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get username from profile
    const { data: profile } = await adminClient
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "No profile found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: max 1 sync per 10 seconds
    const { data: existing } = await adminClient
      .from("leaderboard_entries")
      .select("updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.updated_at) {
      const lastUpdate = new Date(existing.updated_at).getTime();
      const now = Date.now();
      if (now - lastUpdate < 10000) {
        return new Response(JSON.stringify({ error: "Rate limited. Wait 10 seconds." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Anti-cheat: scores can only go up (rep, cash, day, level)
    if (existing) {
      const { data: prev } = await adminClient
        .from("leaderboard_entries")
        .select("rep, day, level")
        .eq("user_id", user.id)
        .single();

      // Day should generally increase (allow reset for NG+)
      // Rep and level should not decrease dramatically (allow small dips for game mechanics)
      if (prev) {
        const repDrop = prev.rep - result.data.rep;
        if (repDrop > 500 && result.data.day > 5) {
          // Suspicious large rep drop outside early game
          console.warn(`Suspicious rep drop for ${user.id}: ${prev.rep} -> ${result.data.rep}`);
        }
      }
    }

    // Upsert validated data
    const { error: upsertError } = await adminClient
      .from("leaderboard_entries")
      .upsert(
        {
          user_id: user.id,
          username: profile.username,
          ...result.data,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return new Response(JSON.stringify({ error: "Failed to sync" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
