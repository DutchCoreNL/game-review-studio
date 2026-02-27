import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TIME_PHASES = ['dawn', 'day', 'dusk', 'night'] as const;
const WEATHER_TYPES = ['clear', 'rain', 'fog', 'heatwave', 'storm'] as const;
const WEATHER_WEIGHTS = [40, 25, 15, 10, 10]; // clear is most common

function weightedRandomWeather(): string {
  const total = WEATHER_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WEATHER_TYPES.length; i++) {
    r -= WEATHER_WEIGHTS[i];
    if (r <= 0) return WEATHER_TYPES[i];
  }
  return 'clear';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Read current world state
    const { data: ws, error: readErr } = await supabase
      .from('world_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (readErr || !ws) {
      throw new Error(`Failed to read world_state: ${readErr?.message}`);
    }

    const currentPhaseIdx = TIME_PHASES.indexOf(ws.time_of_day as any);
    const nextPhaseIdx = (currentPhaseIdx + 1) % TIME_PHASES.length;
    const nextPhase = TIME_PHASES[nextPhaseIdx];
    const isDawn = nextPhase === 'dawn';

    // Build update
    const update: Record<string, any> = {
      time_of_day: nextPhase,
      next_cycle_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isDawn) {
      // New day: increment world_day, roll new weather
      update.world_day = ws.world_day + 1;
      update.current_weather = weightedRandomWeather();
      update.weather_changed_at = new Date().toISOString();
    }

    const { error: updateErr } = await supabase
      .from('world_state')
      .update(update)
      .eq('id', 1);

    if (updateErr) throw new Error(`Failed to update: ${updateErr.message}`);

    // Insert district event for the phase change
    const phaseLabels: Record<string, string> = {
      dawn: '🌅 De zon komt op boven Noxhaven',
      day: '☀️ Het is dag in Noxhaven',
      dusk: '🌆 De avond valt over Noxhaven',
      night: '🌙 De nacht daalt neer over Noxhaven',
    };

    await supabase.from('district_events').insert({
      district_id: 'low',
      event_type: 'world_time',
      title: phaseLabels[nextPhase] || 'Tijd verandert',
      description: isDawn
        ? `Dag ${update.world_day} begint. Weer: ${update.current_weather}`
        : `De stad schakelt over naar ${nextPhase}.`,
      data: { time_of_day: nextPhase, weather: update.current_weather || ws.current_weather, world_day: update.world_day || ws.world_day },
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      phase: nextPhase,
      world_day: update.world_day || ws.world_day,
      weather: update.current_weather || ws.current_weather,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
