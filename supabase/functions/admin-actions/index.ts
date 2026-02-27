import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify user
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = claimsData.claims.sub;

    // Check admin role using service_role (bypasses RLS)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, entryId, userId: targetUserId } = await req.json();

    if (action === 'delete_entry') {
      if (!entryId) {
        return new Response(JSON.stringify({ error: 'entryId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { error } = await adminClient.from('leaderboard_entries').delete().eq('id', entryId);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, message: 'Entry deleted' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'reset_entry') {
      if (!entryId) {
        return new Response(JSON.stringify({ error: 'entryId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { error } = await adminClient.from('leaderboard_entries').update({
        rep: 0, cash: 0, day: 1, level: 1, districts_owned: 0, crew_size: 0, karma: 0,
      }).eq('id', entryId);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, message: 'Entry reset' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'ban_player') {
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: 'userId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      // Delete leaderboard entry + profile
      await adminClient.from('leaderboard_entries').delete().eq('user_id', targetUserId);
      // Ban via auth admin (disable user)
      const { error } = await adminClient.auth.admin.updateUserById(targetUserId, { ban_duration: '876000h' }); // ~100 years
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, message: 'Player banned' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
