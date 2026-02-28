import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Niet ingelogd.");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Niet ingelogd.");

    // Check cooldown: max 1 story per 30 min
    const { data: recent } = await supabaseAdmin.from("personal_story_events")
      .select("id")
      .eq("user_id", user.id)
      .gt("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .limit(1);
    if (recent && recent.length > 0) {
      return new Response(JSON.stringify({ success: false, message: "Je kunt maar 1 verhaal per 30 minuten ontvangen." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather player context
    const { data: ps } = await supabaseAdmin.from("player_state").select("*").eq("user_id", user.id).single();
    if (!ps) throw new Error("Geen spelerstatus.");

    const { data: profile } = await supabaseAdmin.from("profiles").select("username").eq("id", user.id).single();
    const username = profile?.username || "Onbekend";

    // Get recent actions for narrative context
    const { data: recentActions } = await supabaseAdmin.from("game_action_log")
      .select("action_type, result_data, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get gang info
    const { data: gangMember } = await supabaseAdmin.from("gang_members")
      .select("gang_id, role").eq("user_id", user.id).maybeSingle();
    let gangName = null;
    if (gangMember) {
      const { data: gang } = await supabaseAdmin.from("gangs").select("name").eq("id", gangMember.gang_id).single();
      gangName = gang?.name;
    }

    // Get nemesis
    const { data: nemesis } = await supabaseAdmin.from("player_nemesis")
      .select("nemesis_id, district_id").eq("player_id", user.id).eq("status", "active").maybeSingle();

    // Get reputation echo
    const { data: repEcho } = await supabaseAdmin.from("player_reputation_echo")
      .select("*").eq("user_id", user.id).eq("district_id", ps.loc).maybeSingle();

    const DISTRICT_NAMES: Record<string, string> = {
      low: "Lowrise", port: "Port Nero", iron: "Iron Borough", neon: "Neon Strip", crown: "Crown Heights",
    };

    const contextSnapshot = {
      username, level: ps.level, cash: ps.money, hp: ps.hp,
      district: DISTRICT_NAMES[ps.loc] || ps.loc,
      karma: ps.karma, rep: ps.rep, backstory: ps.backstory,
      gangName, gangRole: gangMember?.role,
      hasNemesis: !!nemesis,
      prestigeLevel: ps.prestige_level,
      recentActions: (recentActions || []).map(a => a.action_type),
      reputation: repEcho ? {
        violence: repEcho.violence, trade_trust: repEcho.trade_trust,
        loyalty: repEcho.loyalty, stealth: repEcho.stealth,
      } : null,
    };

    // Build AI prompt
    const prompt = `Je bent een narratieve AI voor een online misdaadspel genaamd "Noxhaven". Genereer een kort, uniek verhaalevent voor deze speler. Het verhaal moet persoonlijk aanvoelen en verwijzen naar hun context.

SPELER CONTEXT:
- Naam: ${username}
- Level: ${ps.level}, Prestige: ${ps.prestige_level}
- District: ${DISTRICT_NAMES[ps.loc] || ps.loc}
- Karma: ${ps.karma} (${ps.karma > 30 ? 'goed' : ps.karma < -30 ? 'slecht' : 'neutraal'})
- Reputatie: ${ps.rep}
- Backstory: ${ps.backstory || 'Onbekend'}
- Gang: ${gangName || 'Geen'}${gangMember ? ` (${gangMember.role})` : ''}
- Heeft nemesis: ${nemesis ? 'Ja' : 'Nee'}
- Recente acties: ${(recentActions || []).map(a => a.action_type).join(', ') || 'geen'}
${repEcho ? `- District reputatie: Geweld=${repEcho.violence}, Handel=${repEcho.trade_trust}, Loyaliteit=${repEcho.loyalty}` : ''}

REGELS:
1. Schrijf in het Nederlands, straattaal/noir stijl
2. Max 150 woorden voor het verhaal
3. Geef een titel (max 8 woorden)
4. Geef precies 3 keuzes met elk een korte beschrijving en mogelijke beloning
5. Keuzes moeten consequenties hebben (geld, rep, karma, heat)
6. Verwijs naar de spelers backstory, district of recente acties
7. Maak het spannend en onverwacht

ANTWOORD IN EXACT DIT JSON FORMAT:
{
  "title": "Korte titel hier",
  "story": "Het verhaal tekst hier...",
  "choices": [
    { "id": "a", "label": "Keuze A label", "desc": "Wat er gebeurt", "reward": { "money": 0, "rep": 0, "karma": 0, "heat": 0, "xp": 0 } },
    { "id": "b", "label": "Keuze B label", "desc": "Wat er gebeurt", "reward": { "money": 0, "rep": 0, "karma": 0, "heat": 0, "xp": 0 } },
    { "id": "c", "label": "Keuze C label", "desc": "Wat er gebeurt", "reward": { "money": 0, "rep": 0, "karma": 0, "heat": 0, "xp": 0 } }
  ]
}

Houd beloningen realistisch: geld tussen -5000 en +15000, rep tussen -20 en +50, karma tussen -15 en +15, heat tussen 0 en 30, xp tussen 50 en 500.`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI error: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("AI response parsing failed");
    }

    // Validate structure
    if (!parsed.title || !parsed.story || !parsed.choices || parsed.choices.length < 2) {
      throw new Error("Invalid story structure");
    }

    // Save to database
    const { data: storyEvent, error: insertErr } = await supabaseAdmin.from("personal_story_events").insert({
      user_id: user.id,
      story_title: parsed.title,
      story_text: parsed.story,
      choices: parsed.choices,
      context_snapshot: contextSnapshot,
      status: "pending",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }).select("id").single();

    if (insertErr) throw new Error(`DB error: ${insertErr.message}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Nieuw verhaalevent!",
      data: {
        id: storyEvent.id,
        title: parsed.title,
        story: parsed.story,
        choices: parsed.choices,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
