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

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, entryId, userId: targetUserId, reason, duration, targetUsername } = await req.json();

    // Helper to log admin actions
    const logAction = async (actionName: string, details?: Record<string, unknown>) => {
      await adminClient.from('admin_logs').insert({
        admin_id: user.id,
        action: actionName,
        target_user_id: targetUserId || null,
        target_username: targetUsername || null,
        details: details || null,
      });
    };

    if (action === 'delete_entry') {
      if (!entryId) return new Response(JSON.stringify({ error: 'entryId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { error } = await adminClient.from('leaderboard_entries').delete().eq('id', entryId);
      if (error) throw error;
      await logAction('delete_entry', { entryId });
      return new Response(JSON.stringify({ ok: true, message: 'Entry deleted' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'reset_entry') {
      if (!entryId) return new Response(JSON.stringify({ error: 'entryId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { error } = await adminClient.from('leaderboard_entries').update({
        rep: 0, cash: 0, day: 1, level: 1, districts_owned: 0, crew_size: 0, karma: 0,
      }).eq('id', entryId);
      if (error) throw error;
      await logAction('reset_entry', { entryId });
      return new Response(JSON.stringify({ ok: true, message: 'Entry reset' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'ban_player') {
      if (!targetUserId) return new Response(JSON.stringify({ error: 'userId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      await adminClient.from('leaderboard_entries').delete().eq('user_id', targetUserId);
      const { error } = await adminClient.auth.admin.updateUserById(targetUserId, { ban_duration: '876000h' });
      if (error) throw error;
      await logAction('ban_player');
      return new Response(JSON.stringify({ ok: true, message: 'Player banned' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'warn_player') {
      if (!targetUserId) return new Response(JSON.stringify({ error: 'userId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { error } = await adminClient.from('player_sanctions').insert({
        user_id: targetUserId, admin_id: user.id, type: 'warning', reason: reason || 'Verdacht gedrag gedetecteerd',
      });
      if (error) throw error;
      await logAction('warn_player', { reason });
      return new Response(JSON.stringify({ ok: true, message: 'Warning issued' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'mute_player') {
      if (!targetUserId) return new Response(JSON.stringify({ error: 'userId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const hours = duration || 24;
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      const { error } = await adminClient.from('player_sanctions').insert({
        user_id: targetUserId, admin_id: user.id, type: 'mute', reason: reason || 'Tijdelijk gemute', expires_at: expiresAt,
      });
      if (error) throw error;
      await logAction('mute_player', { reason, duration: hours });
      return new Response(JSON.stringify({ ok: true, message: `Player muted for ${hours}h` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get_sanctions') {
      if (!targetUserId) return new Response(JSON.stringify({ error: 'userId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { data, error } = await adminClient.from('player_sanctions')
        .select('*').eq('user_id', targetUserId).order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, sanctions: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'revoke_sanction') {
      if (!entryId) return new Response(JSON.stringify({ error: 'entryId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { error } = await adminClient.from('player_sanctions').update({ active: false }).eq('id', entryId);
      if (error) throw error;
      await logAction('revoke_sanction', { sanctionId: entryId });
      return new Response(JSON.stringify({ ok: true, message: 'Sanction revoked' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get_logs') {
      const { data, error } = await adminClient.from('admin_logs')
        .select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, logs: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
