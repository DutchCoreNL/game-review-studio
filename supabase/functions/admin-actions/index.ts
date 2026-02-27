import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DISTRICTS = ['low', 'port', 'neon', 'iron', 'crown'];

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

    const body = await req.json();
    const { action, entryId, userId: targetUserId, reason, duration, targetUsername, stats } = body;

    const ok = (data: unknown) => new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const bad = (msg: string) => new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const logAction = async (actionName: string, details?: Record<string, unknown>) => {
      await adminClient.from('admin_logs').insert({
        admin_id: user.id,
        action: actionName,
        target_user_id: targetUserId || null,
        target_username: targetUsername || null,
        details: details || null,
      });
    };

    // ============ EXISTING ACTIONS ============

    if (action === 'delete_entry') {
      if (!entryId) return bad('entryId required');
      const { error } = await adminClient.from('leaderboard_entries').delete().eq('id', entryId);
      if (error) throw error;
      await logAction('delete_entry', { entryId });
      return ok({ ok: true, message: 'Entry deleted' });
    }

    if (action === 'reset_entry') {
      if (!entryId) return bad('entryId required');
      const { error } = await adminClient.from('leaderboard_entries').update({
        rep: 0, cash: 0, day: 1, level: 1, districts_owned: 0, crew_size: 0, karma: 0,
      }).eq('id', entryId);
      if (error) throw error;
      await logAction('reset_entry', { entryId });
      return ok({ ok: true, message: 'Entry reset' });
    }

    if (action === 'ban_player') {
      if (!targetUserId) return bad('userId required');
      await adminClient.from('leaderboard_entries').delete().eq('user_id', targetUserId);
      const { error } = await adminClient.auth.admin.updateUserById(targetUserId, { ban_duration: '876000h' });
      if (error) throw error;
      await logAction('ban_player');
      return ok({ ok: true, message: 'Player banned' });
    }

    if (action === 'warn_player') {
      if (!targetUserId) return bad('userId required');
      const { error } = await adminClient.from('player_sanctions').insert({
        user_id: targetUserId, admin_id: user.id, type: 'warning', reason: reason || 'Verdacht gedrag gedetecteerd',
      });
      if (error) throw error;
      await logAction('warn_player', { reason });
      return ok({ ok: true, message: 'Warning issued' });
    }

    if (action === 'mute_player') {
      if (!targetUserId) return bad('userId required');
      const hours = duration || 24;
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      const { error } = await adminClient.from('player_sanctions').insert({
        user_id: targetUserId, admin_id: user.id, type: 'mute', reason: reason || 'Tijdelijk gemute', expires_at: expiresAt,
      });
      if (error) throw error;
      await logAction('mute_player', { reason, duration: hours });
      return ok({ ok: true, message: `Player muted for ${hours}h` });
    }

    if (action === 'get_sanctions') {
      if (!targetUserId) return bad('userId required');
      const { data, error } = await adminClient.from('player_sanctions')
        .select('*').eq('user_id', targetUserId).order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return ok({ ok: true, sanctions: data });
    }

    if (action === 'revoke_sanction') {
      if (!entryId) return bad('entryId required');
      const { error } = await adminClient.from('player_sanctions').update({ active: false }).eq('id', entryId);
      if (error) throw error;
      await logAction('revoke_sanction', { sanctionId: entryId });
      return ok({ ok: true, message: 'Sanction revoked' });
    }

    if (action === 'edit_entry') {
      if (!entryId || !stats) return bad('entryId and stats required');
      const allowedFields = ['rep', 'cash', 'day', 'level', 'districts_owned', 'crew_size', 'karma', 'username'];
      const updates: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if (stats[key] !== undefined) updates[key] = stats[key];
      }
      if (Object.keys(updates).length === 0) return bad('No valid fields');
      const { error } = await adminClient.from('leaderboard_entries').update(updates).eq('id', entryId);
      if (error) throw error;
      await logAction('edit_entry', { entryId, changes: updates });
      return ok({ ok: true, message: 'Entry updated' });
    }

    if (action === 'get_logs') {
      const { data, error } = await adminClient.from('admin_logs')
        .select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return ok({ ok: true, logs: data });
    }

    // ============ PLAYER STATE ACTIONS ============

    if (action === 'get_player_state') {
      if (!targetUserId) return bad('userId required');
      const { data, error } = await adminClient.from('player_state').select('*').eq('user_id', targetUserId).maybeSingle();
      if (error) throw error;
      return ok({ ok: true, player_state: data });
    }

    if (action === 'edit_player_state') {
      if (!targetUserId || !stats) return bad('userId and stats required');
      const allowed = ['money', 'dirty_money', 'hp', 'max_hp', 'energy', 'max_energy', 'nerve', 'max_nerve', 'heat', 'personal_heat', 'karma', 'rep', 'level', 'xp', 'next_xp', 'loc', 'day', 'debt', 'prison_until', 'hospital_until', 'hiding_until', 'prison_reason', 'skill_points', 'ammo'];
      const updates: Record<string, unknown> = {};
      for (const key of allowed) {
        if (stats[key] !== undefined) {
          // Allow setting null for timestamp fields
          if (['prison_until', 'hospital_until', 'hiding_until', 'prison_reason'].includes(key) && (stats[key] === '' || stats[key] === null)) {
            updates[key] = null;
          } else {
            updates[key] = stats[key];
          }
        }
      }
      if (Object.keys(updates).length === 0) return bad('No valid fields');
      const { error } = await adminClient.from('player_state').update(updates).eq('user_id', targetUserId);
      if (error) throw error;
      await logAction('edit_player_state', { changes: updates });
      return ok({ ok: true, message: 'Player state updated' });
    }

    // ============ MARKET ACTIONS ============

    if (action === 'get_market_prices') {
      const { data, error } = await adminClient.from('market_prices').select('*').order('good_id');
      if (error) throw error;
      return ok({ ok: true, prices: data });
    }

    if (action === 'edit_market_price') {
      const { priceId, current_price, price_trend } = body;
      if (!priceId) return bad('priceId required');
      const updates: Record<string, unknown> = {};
      if (current_price !== undefined) updates.current_price = current_price;
      if (price_trend !== undefined) updates.price_trend = price_trend;
      if (Object.keys(updates).length === 0) return bad('No valid fields');
      const { error } = await adminClient.from('market_prices').update(updates).eq('id', priceId);
      if (error) throw error;
      await logAction('edit_market_price', { priceId, ...updates });
      return ok({ ok: true, message: 'Price updated' });
    }

    if (action === 'bulk_update_prices') {
      const { multiplier } = body;
      if (!multiplier || multiplier <= 0) return bad('Valid multiplier required');
      const { data: prices, error: fetchErr } = await adminClient.from('market_prices').select('id, current_price');
      if (fetchErr) throw fetchErr;
      for (const p of (prices || [])) {
        await adminClient.from('market_prices').update({ current_price: Math.round(p.current_price * multiplier) }).eq('id', p.id);
      }
      await logAction('bulk_update_prices', { multiplier, count: prices?.length });
      return ok({ ok: true, message: `${prices?.length} prices updated with x${multiplier}` });
    }

    // ============ BOT ACTIONS ============

    if (action === 'get_bots') {
      const { data, error } = await adminClient.from('bot_players').select('*').order('username');
      if (error) throw error;
      return ok({ ok: true, bots: data });
    }

    if (action === 'edit_bot') {
      const { botId } = body;
      if (!botId || !stats) return bad('botId and stats required');
      const allowed = ['username', 'level', 'hp', 'max_hp', 'cash', 'rep', 'loc', 'is_active', 'karma', 'crew_size', 'districts_owned', 'day', 'backstory'];
      const updates: Record<string, unknown> = {};
      for (const key of allowed) {
        if (stats[key] !== undefined) updates[key] = stats[key];
      }
      if (Object.keys(updates).length === 0) return bad('No valid fields');
      const { error } = await adminClient.from('bot_players').update(updates).eq('id', botId);
      if (error) throw error;
      await logAction('edit_bot', { botId, changes: updates });
      return ok({ ok: true, message: 'Bot updated' });
    }

    if (action === 'delete_bot') {
      const { botId } = body;
      if (!botId) return bad('botId required');
      const { error } = await adminClient.from('bot_players').delete().eq('id', botId);
      if (error) throw error;
      await logAction('delete_bot', { botId });
      return ok({ ok: true, message: 'Bot deleted' });
    }

    if (action === 'create_bot') {
      if (!stats?.username) return bad('username required');
      const { error } = await adminClient.from('bot_players').insert({
        username: stats.username,
        level: stats.level || 1,
        hp: stats.hp || 100,
        max_hp: stats.max_hp || 100,
        cash: stats.cash || 5000,
        rep: stats.rep || 0,
        loc: stats.loc || DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)],
        karma: stats.karma || 0,
        crew_size: stats.crew_size || 0,
        districts_owned: stats.districts_owned || 0,
        backstory: stats.backstory || null,
      });
      if (error) throw error;
      await logAction('create_bot', { username: stats.username });
      return ok({ ok: true, message: 'Bot created' });
    }

    if (action === 'randomize_bot_locations') {
      const { data: bots, error: fetchErr } = await adminClient.from('bot_players').select('id');
      if (fetchErr) throw fetchErr;
      for (const bot of (bots || [])) {
        await adminClient.from('bot_players').update({ loc: DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)] }).eq('id', bot.id);
      }
      await logAction('randomize_bot_locations', { count: bots?.length });
      return ok({ ok: true, message: `${bots?.length} bot locations randomized` });
    }

    // ============ WORLD STATS ============

    if (action === 'get_world_stats') {
      const [playersRes, stateRes, gangsRes, warsRes] = await Promise.all([
        adminClient.from('leaderboard_entries').select('id, cash, level, districts_owned'),
        adminClient.from('player_state').select('loc, money, level'),
        adminClient.from('gangs').select('id, name, tag, level, treasury, xp'),
        adminClient.from('gang_wars').select('*').eq('status', 'active'),
      ]);

      const players = playersRes.data || [];
      const states = stateRes.data || [];
      const gangs = gangsRes.data || [];
      const wars = warsRes.data || [];

      const totalCash = states.reduce((s, p) => s + (Number(p.money) || 0), 0);
      const avgLevel = states.length > 0 ? Math.round(states.reduce((s, p) => s + p.level, 0) / states.length) : 0;

      const districtCounts: Record<string, number> = {};
      for (const d of DISTRICTS) districtCounts[d] = 0;
      for (const s of states) districtCounts[s.loc] = (districtCounts[s.loc] || 0) + 1;

      // Get member counts per gang
      const { data: members } = await adminClient.from('gang_members').select('gang_id');
      const gangMemberCounts: Record<string, number> = {};
      for (const m of (members || [])) gangMemberCounts[m.gang_id] = (gangMemberCounts[m.gang_id] || 0) + 1;
      const gangsWithCounts = gangs.map(g => ({ ...g, member_count: gangMemberCounts[g.id] || 0 }));

      return ok({
        ok: true,
        stats: {
          total_players: players.length,
          active_states: states.length,
          total_cash: totalCash,
          avg_level: avgLevel,
          district_counts: districtCounts,
          gangs: gangsWithCounts,
          active_wars: wars,
        },
      });
    }

    // ============ MESSAGING ============

    if (action === 'send_message') {
      const { receiverId, subject, messageBody } = body;
      if (!receiverId || !messageBody) return bad('receiverId and messageBody required');
      const { error } = await adminClient.from('player_messages').insert({
        sender_id: user.id,
        receiver_id: receiverId,
        subject: subject || '📢 Systeembericht',
        body: messageBody,
      });
      if (error) throw error;
      await logAction('send_message', { receiverId, subject });
      return ok({ ok: true, message: 'Message sent' });
    }

    if (action === 'send_broadcast') {
      const { subject, messageBody } = body;
      if (!messageBody) return bad('messageBody required');
      const { data: allPlayers, error: fetchErr } = await adminClient.from('player_state').select('user_id');
      if (fetchErr) throw fetchErr;
      let sent = 0;
      for (const p of (allPlayers || [])) {
        await adminClient.from('player_messages').insert({
          sender_id: user.id,
          receiver_id: p.user_id,
          subject: subject || '📢 Broadcast',
          body: messageBody,
        });
        sent++;
      }
      await logAction('send_broadcast', { subject, recipients: sent });
      return ok({ ok: true, message: `Broadcast sent to ${sent} players` });
    }

    return bad('Unknown action');
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
