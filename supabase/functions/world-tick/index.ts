import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TIME_PHASES = ['dawn', 'day', 'dusk', 'night'] as const;
const WEATHER_TYPES = ['clear', 'rain', 'fog', 'heatwave', 'storm'] as const;
const WEATHER_WEIGHTS = [40, 25, 15, 10, 10]; // clear is most common
const DISTRICTS = ['low', 'port', 'iron', 'neon', 'crown'];
const DISTRICT_NAMES: Record<string, string> = { low: 'Lowrise', port: 'Port Nero', iron: 'Iron Borough', neon: 'Neon Strip', crown: 'Crown Heights' };

function weightedRandomWeather(): string {
  const total = WEATHER_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WEATHER_TYPES.length; i++) {
    r -= WEATHER_WEIGHTS[i];
    if (r <= 0) return WEATHER_TYPES[i];
  }
  return 'clear';
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickDistrict(): string { return pick(DISTRICTS); }
function pickDistrictName(): string { return DISTRICT_NAMES[pickDistrict()]; }

// ========== NEWS POOL ==========
interface NewsTemplate { text: string; icon: string; urgency: string; category: string; detail?: string; }

function getPhaseNews(phase: string, weather: string, worldDay: number): NewsTemplate[] {
  const pool: NewsTemplate[] = [];

  // Time-of-day news
  if (phase === 'night') {
    pool.push(
      { text: `Nachtleven explodeert in ${pickDistrictName()} — politie verhoogt patrouilles`, icon: '🌙', urgency: 'medium', category: 'world', detail: 'De nachtclubs draaien op volle toeren. Extra agenten zijn ingezet.' },
      { text: 'Schaduwfiguren gespot bij verlaten pakhuis in de haven', icon: '👤', urgency: 'low', category: 'world', detail: 'Bewoners melden verdachte activiteit na middernacht.' },
    );
  } else if (phase === 'dawn') {
    pool.push(
      { text: `Dag ${worldDay} breekt aan over Noxhaven — de straten ontwaken`, icon: '🌅', urgency: 'low', category: 'world', detail: `Een nieuwe dag in de stad. Het weer: ${weather}.` },
      { text: 'Vroege ochtendrazzia in Lowrise levert wapenvondst op', icon: '🔫', urgency: 'high', category: 'heat', detail: 'De NHPD trof automatische wapens aan in een kelder.' },
    );
  } else if (phase === 'dusk') {
    pool.push(
      { text: `Zonsondergang boven ${pickDistrictName()} — de stad verandert van gezicht`, icon: '🌆', urgency: 'low', category: 'world' },
      { text: 'Handelaren sluiten hun kramen — avondmarkt begint in Neon Strip', icon: '🏪', urgency: 'low', category: 'market' },
    );
  }

  // Weather-specific
  if (weather === 'storm') {
    pool.push(
      { text: 'Code Oranje: Zware storm trekt over Noxhaven — havens gesloten', icon: '⛈️', urgency: 'high', category: 'weather', detail: 'Het KNMI waarschuwt voor windstoten tot 100 km/u.' },
      { text: 'Stormschade in Iron Borough — dakpannen vliegen van gebouwen', icon: '💨', urgency: 'medium', category: 'weather' },
    );
  } else if (weather === 'fog') {
    pool.push(
      { text: 'Dichte mist legt verkeer lam — zichtbaarheid onder 50 meter', icon: '🌫️', urgency: 'medium', category: 'weather', detail: 'De politie adviseert om niet de weg op te gaan.' },
    );
  } else if (weather === 'heatwave') {
    pool.push(
      { text: 'Hittegolf houdt aan: temperaturen boven 35°C — "Blijf hydrateren"', icon: '🌡️', urgency: 'low', category: 'weather' },
    );
  } else if (weather === 'rain') {
    pool.push(
      { text: 'Aanhoudende regenval zorgt voor wateroverlast in Lowrise', icon: '🌧️', urgency: 'low', category: 'weather' },
    );
  }

  // Flavor news (always add a few)
  const flavor: NewsTemplate[] = [
    { text: 'Burgemeester ontkent banden met onderwereld — "Absurd en ongefundeerd"', icon: '🏛️', urgency: 'medium', category: 'flavor', detail: 'Burgemeester Van Dijk reageerde furieus op beschuldigingen.' },
    { text: `Restaurant "La Notte" in ${pickDistrictName()} uitgeroepen tot beste van het jaar`, icon: '🍽️', urgency: 'low', category: 'flavor' },
    { text: 'Mysterieuze graffiti verschijnt op muren in Lowrise: "WIJ ZIEN ALLES"', icon: '👁️', urgency: 'low', category: 'flavor' },
    { text: 'Noxhaven FC wint derby na controversieel doelpunt', icon: '⚽', urgency: 'low', category: 'flavor' },
    { text: 'Havenarbeiders dreigen met staking na loonconflict', icon: '⚓', urgency: 'medium', category: 'flavor' },
    { text: `Nieuwe nachtclub "Eclipse" trekt honderden bezoekers in ${pickDistrictName()}`, icon: '🌙', urgency: 'low', category: 'flavor' },
    { text: `Stroomuitval treft delen van ${pickDistrictName()} — oorzaak onbekend`, icon: '💡', urgency: 'medium', category: 'flavor' },
    { text: 'Archeologen ontdekken oude tunnels onder Crown Heights', icon: '🏗️', urgency: 'low', category: 'flavor' },
    { text: 'Verdachte brand verwoest leegstaand pakhuis in Lowrise', icon: '🔥', urgency: 'medium', category: 'flavor' },
    { text: 'Politie pakt illegale gokkring op in kelder van Crown Heights', icon: '🎲', urgency: 'medium', category: 'flavor' },
    { text: 'Luxe jacht aangemeerd in Port Nero — eigenaar onbekend', icon: '🛥️', urgency: 'low', category: 'flavor' },
    { text: 'Oud-commissaris schrijft onthullend boek over corruptie bij NHPD', icon: '📖', urgency: 'medium', category: 'flavor' },
    { text: `Filmploeg gespot in ${pickDistrictName()} — opnames van nieuwe thriller`, icon: '🎬', urgency: 'low', category: 'flavor' },
    { text: 'Anonieme tip leidt tot vondst van wapenarsenaal in kelder', icon: '🔫', urgency: 'high', category: 'heat' },
    { text: `Explosieve groei van cryptocurrency-handel in Neon Strip`, icon: '₿', urgency: 'low', category: 'market' },
    { text: 'NHPD: "Criminaliteitscijfers stijgen — we houden de situatie scherp in de gaten"', icon: '👮', urgency: 'medium', category: 'heat' },
    { text: 'Mysterieuze zwarte bestelbus gespot in meerdere wijken', icon: '🚐', urgency: 'low', category: 'flavor' },
    { text: `Haven van Port Nero breekt exportrecord dit kwartaal`, icon: '📦', urgency: 'low', category: 'market' },
  ];

  // Pick 2-3 random flavor items
  const shuffled = flavor.sort(() => Math.random() - 0.5);
  pool.push(...shuffled.slice(0, 2 + Math.floor(Math.random() * 2)));

  return pool;
}

async function generateAndInsertNews(supabase: any, phase: string, weather: string, worldDay: number) {
  const templates = getPhaseNews(phase, weather, worldDay);
  // Pick 3-5 items, deduplicate by category
  const seen = new Set<string>();
  const selected: NewsTemplate[] = [];
  for (const t of templates.sort(() => Math.random() - 0.5)) {
    if (seen.has(t.category)) continue;
    seen.add(t.category);
    selected.push(t);
    if (selected.length >= 4) break;
  }

  if (selected.length === 0) return;

  const expiresAt = new Date(Date.now() + 35 * 60 * 1000).toISOString(); // 35 min (slightly longer than cycle)
  const rows = selected.map(t => ({
    text: t.text,
    category: t.category,
    urgency: t.urgency,
    icon: t.icon,
    detail: t.detail || null,
    expires_at: expiresAt,
  }));

  await supabase.from('news_events').insert(rows);

  // Cleanup old expired news (keep DB clean)
  await supabase.from('news_events').delete().lt('expires_at', new Date().toISOString());
}

// ========== BOT SIMULATION ==========
const BOT_ACTIONS = [
  { action: 'travel', weight: 30 },
  { action: 'trade', weight: 25 },
  { action: 'crime', weight: 20 },
  { action: 'fight', weight: 10 },
  { action: 'idle', weight: 15 },
];

const BOT_NEWS_TEMPLATES = [
  (name: string, loc: string) => ({ text: `${name} gespot in ${DISTRICT_NAMES[loc] || loc} — handelt grote partij goederen`, icon: '📦', urgency: 'low' as const, category: 'player' }),
  (name: string, loc: string) => ({ text: `${name} pleegt gewapende overval in ${DISTRICT_NAMES[loc] || loc}`, icon: '💥', urgency: 'medium' as const, category: 'heat' }),
  (name: string, _: string) => ({ text: `${name} beklimt de ranglijst — reputatie stijgt snel`, icon: '📈', urgency: 'low' as const, category: 'player' }),
  (name: string, loc: string) => ({ text: `Schietpartij gemeld in ${DISTRICT_NAMES[loc] || loc} — ${name} betrokken`, icon: '🔫', urgency: 'high' as const, category: 'heat' }),
  (name: string, loc: string) => ({ text: `${name} koopt vastgoed op in ${DISTRICT_NAMES[loc] || loc}`, icon: '🏠', urgency: 'low' as const, category: 'market' }),
  (name: string, _: string) => ({ text: `${name} gezien bij nachtclub met onbekende zakenlieden`, icon: '🍸', urgency: 'low' as const, category: 'flavor' }),
  (name: string, loc: string) => ({ text: `Politie zoekt ${name} na incident in ${DISTRICT_NAMES[loc] || loc}`, icon: '🚔', urgency: 'medium' as const, category: 'heat' }),
  (name: string, _: string) => ({ text: `${name} sluit lucratieve deal — miljoenen verdiend`, icon: '💰', urgency: 'low' as const, category: 'market' }),
];

function pickWeighted(items: { action: string; weight: number }[]): string {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.action;
  }
  return items[0].action;
}

async function simulateBots(supabase: any, phase: string, worldDay: number) {
  try {
    const { data: bots } = await supabase
      .from('bot_players')
      .select('*')
      .eq('is_active', true);

    if (!bots || bots.length === 0) return;

    const newsToInsert: any[] = [];
    const expiresAt = new Date(Date.now() + 35 * 60 * 1000).toISOString();

    // Simulate 40-70% of bots per tick
    const activeFraction = 0.4 + Math.random() * 0.3;
    const shuffled = bots.sort(() => Math.random() - 0.5);
    const activeCount = Math.max(1, Math.floor(shuffled.length * activeFraction));

    for (let i = 0; i < activeCount; i++) {
      const bot = shuffled[i];
      const action = pickWeighted(BOT_ACTIONS);
      const updates: Record<string, any> = {};

      switch (action) {
        case 'travel': {
          const newLoc = pick(DISTRICTS.filter(d => d !== bot.loc));
          updates.loc = newLoc;
          break;
        }
        case 'trade': {
          const cashGain = Math.floor(Math.random() * 3000) + 500;
          const repGain = Math.floor(Math.random() * 5) + 1;
          updates.cash = Math.max(0, bot.cash + (Math.random() > 0.3 ? cashGain : -Math.floor(cashGain * 0.5)));
          updates.rep = bot.rep + repGain;
          break;
        }
        case 'crime': {
          const success = Math.random() > 0.35;
          if (success) {
            updates.cash = bot.cash + Math.floor(Math.random() * 5000) + 1000;
            updates.rep = bot.rep + Math.floor(Math.random() * 8) + 2;
          } else {
            updates.hp = Math.max(10, bot.hp - Math.floor(Math.random() * 20));
          }
          break;
        }
        case 'fight': {
          const won = Math.random() > 0.4;
          if (won) {
            updates.rep = bot.rep + Math.floor(Math.random() * 15) + 5;
            updates.cash = bot.cash + Math.floor(Math.random() * 2000);
          } else {
            updates.hp = Math.max(10, bot.hp - Math.floor(Math.random() * 30));
          }
          break;
        }
        default:
          updates.hp = Math.min(bot.max_hp, bot.hp + Math.floor(Math.random() * 10) + 5);
          break;
      }

      // Level up
      const newRep = updates.rep ?? bot.rep;
      const expectedLevel = Math.max(1, Math.floor(newRep / 15) + 1);
      if (expectedLevel > bot.level) {
        updates.level = Math.min(expectedLevel, 50);
        updates.max_hp = 100 + (updates.level - 1) * 5;
      }

      updates.day = bot.day + 1;

      if (Math.random() < 0.03 && newRep > 100) {
        updates.districts_owned = Math.min(5, bot.districts_owned + 1);
      }
      if (Math.random() < 0.05 && newRep > 50) {
        updates.crew_size = Math.min(4, bot.crew_size + 1);
      }
      if (Math.random() < 0.15) {
        updates.karma = bot.karma + (Math.random() > 0.5 ? 1 : -1);
      }

      await supabase.from('bot_players').update(updates).eq('id', bot.id);

      // 10% chance news about this bot
      if (Math.random() < 0.10) {
        const template = pick(BOT_NEWS_TEMPLATES);
        const news = template(bot.username, updates.loc || bot.loc);
        newsToInsert.push({ text: news.text, icon: news.icon, urgency: news.urgency, category: news.category, expires_at: expiresAt });
      }
    }

    if (newsToInsert.length > 0) {
      await supabase.from('news_events').insert(newsToInsert);
    }
  } catch (e) {
    console.error('Bot simulation error:', e);
  }
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

    // ========== WEEKLY EVENT: 2x XP Weekend ==========
    // Every 7 world days (days 6-7 of each week cycle), activate 2x XP
    const currentDay = isDawn ? ws.world_day + 1 : ws.world_day;
    const dayInWeek = ((currentDay - 1) % 7) + 1; // 1-7 cycle
    let activeEvent = ws.active_event;

    if (isDawn) {
      if (dayInWeek === 6) {
        // Start 2x XP Weekend on day 6
        activeEvent = {
          id: '2x_xp_weekend',
          name: '⚡ 2x XP Weekend',
          desc: 'Alle XP-verdiensten zijn verdubbeld dit weekend!',
          xp_multiplier: 2,
          started_day: currentDay,
          ends_day: currentDay + 2,
        };
      } else if (dayInWeek === 1 && activeEvent?.id === '2x_xp_weekend') {
        // End the event on the new week
        activeEvent = null;
      }
    }

    // Build update
    const update: Record<string, any> = {
      time_of_day: nextPhase,
      next_cycle_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      active_event: activeEvent,
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
    // Insert 2x XP Weekend news if event just started
    if (activeEvent?.id === '2x_xp_weekend' && (!ws.active_event || ws.active_event?.id !== '2x_xp_weekend')) {
      await supabase.from('news_events').insert({
        text: '⚡ 2x XP WEEKEND geactiveerd! Alle XP-verdiensten zijn verdubbeld tot het einde van het weekend!',
        icon: '⚡',
        urgency: 'high',
        category: 'world',
        detail: 'Verdien dubbele XP op alle acties: operaties, contracten, handel en meer. Maak er gebruik van!',
        expires_at: new Date(Date.now() + 4 * 30 * 60 * 1000).toISOString(), // lasts 4 phases (~2 game days)
      });
    }

    // Generate realtime news for this phase
    const currentWeather = update.current_weather || ws.current_weather;
    const currentDay = update.world_day || ws.world_day;
    await generateAndInsertNews(supabase, nextPhase, currentWeather, currentDay);

    // ========== SIMULATE BOT ACTIVITY ==========
    await simulateBots(supabase, nextPhase, currentDay);

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
