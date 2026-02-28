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

// ========== BOT GANG NAMES ==========
const BOT_GANG_NAMES = [
  { name: 'Los Lobos', tag: 'LOB' },
  { name: 'Iron Fist Crew', tag: 'IFC' },
  { name: 'Neon Wolves', tag: 'NWF' },
  { name: 'Shadow Syndicate', tag: 'SSY' },
  { name: 'Port Authority', tag: 'PAU' },
  { name: 'Crown Kings', tag: 'CRK' },
  { name: 'Lowrise Reapers', tag: 'LRR' },
  { name: 'Black Serpents', tag: 'BSP' },
];

// ========== BOT SIMULATION ==========
const BOT_ACTIONS = [
  { action: 'travel', weight: 25 },
  { action: 'trade', weight: 20 },
  { action: 'crime', weight: 20 },
  { action: 'fight', weight: 10 },
  { action: 'chat', weight: 10 },
  { action: 'market', weight: 8 },
  { action: 'faction', weight: 5 },
  { action: 'idle', weight: 2 },
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

// ========== BOT CHAT MESSAGES ==========
const BOT_CHAT_GLOBAL = [
  (name: string) => `Iemand nog tips voor Crown Heights? Net aangekomen.`,
  (name: string) => `Pas op in Lowrise vanavond, politie is overal 🚔`,
  (name: string) => `Net een mooie deal gesloten 💰 goedenavond allemaal`,
  (name: string) => `Zoekt iemand een partner voor een run naar Port Nero?`,
  (name: string) => `Die storm maakt het lastig om te reizen...`,
  (name: string) => `Wie heeft er Synthetica? DM me, goede prijs.`,
  (name: string) => `Iron Borough is rustig vandaag, goed moment om te handelen`,
  (name: string) => `Heeft iemand info over die nieuwe gang in Neon Strip?`,
  (name: string) => `Weer een dag overleefd in Noxhaven 💪`,
  (name: string) => `Die faction boss is bijna down, wie helpt?`,
  (name: string) => `Ik heb gehoord dat de haven geblokkeerd is, prijzen gaan omhoog`,
  (name: string) => `GG aan iedereen op het leaderboard 🏆`,
  (name: string) => `Zoek een gang, level ${Math.floor(Math.random() * 30) + 10}. Stuur me een invite.`,
  (name: string) => `Let op: grote razzia in de buurt van Neon Strip`,
  (name: string) => `Hoe verdienen jullie het snelst geld hier? Tips welkom`,
  (name: string) => `Net m'n eerste district veroverd! 🎉`,
  (name: string) => `Wie wil er meedoen aan een organized crime? We zoeken nog een hacker`,
  (name: string) => `De marktprijzen voor wapens zijn belachelijk hoog vandaag`,
];

const BOT_CHAT_TRADE = [
  (name: string) => `Verkoop: 50x Synthetica, €180/stuk. DM voor deal.`,
  (name: string) => `Zoek: Zware Wapens, betaal marktprijs +10%`,
  (name: string) => `Tip: Zwarte Data is goedkoop in Port Nero nu`,
  (name: string) => `Medische Voorraad is schaars — prijzen stijgen snel`,
  (name: string) => `Geroofde Kunst te koop, beste aanbod wint`,
  (name: string) => `Wie wil ruilen? Ik heb tech, zoek drugs.`,
  (name: string) => `Let op de markttrend — alles gaat omhoog in Crown Heights`,
  (name: string) => `Bulk deal: 100x drugs voor €15k. Serieuze kopers only.`,
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

// ========== BOT CHAT SIMULATION ==========
async function simulateBotChat(supabase: any, bots: any[], phase: string) {
  try {
    // 2-4 bots chat per tick
    const chatters = bots.sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3));
    const rows: any[] = [];

    for (const bot of chatters) {
      // 70% global, 30% trade
      const isTradeChat = Math.random() < 0.3;
      const channel = isTradeChat ? 'trade' : 'global';
      const templates = isTradeChat ? BOT_CHAT_TRADE : BOT_CHAT_GLOBAL;
      const template = templates[Math.floor(Math.random() * templates.length)];
      const message = template(bot.username);

      rows.push({
        user_id: bot.id,
        username: bot.username,
        channel,
        message,
      });
    }

    if (rows.length > 0) {
      await supabase.from('chat_messages').insert(rows);
    }
  } catch (e) {
    console.error('Bot chat error:', e);
  }
}

// ========== BOT MARKET LISTINGS ==========
const GOODS_IDS = ['drugs', 'weapons', 'tech', 'luxury', 'meds', 'explosives', 'crypto', 'chemicals', 'electronics'];
const GOODS_BASE_PRICES: Record<string, number> = { drugs: 200, weapons: 1100, tech: 900, luxury: 2400, meds: 600, explosives: 1800, crypto: 3200, chemicals: 450, electronics: 750 };

async function simulateBotMarketListings(supabase: any, bots: any[]) {
  try {
    // Remove expired bot listings
    await supabase.from('market_listings')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .in('seller_id', bots.map((b: any) => b.id));

    // Count existing bot listings
    const { count } = await supabase.from('market_listings')
      .select('id', { count: 'exact', head: true })
      .in('seller_id', bots.map((b: any) => b.id))
      .eq('status', 'active');

    // Keep 3-8 active bot listings at all times
    const target = 3 + Math.floor(Math.random() * 6);
    const toCreate = Math.max(0, target - (count || 0));
    if (toCreate === 0) return;

    const listings: any[] = [];
    for (let i = 0; i < toCreate; i++) {
      const bot = bots[Math.floor(Math.random() * bots.length)];
      const goodId = GOODS_IDS[Math.floor(Math.random() * GOODS_IDS.length)];
      const basePrice = GOODS_BASE_PRICES[goodId];
      // Vary price ±20% around base
      const price = Math.floor(basePrice * (0.8 + Math.random() * 0.4));
      const quantity = 5 + Math.floor(Math.random() * 46); // 5-50

      listings.push({
        seller_id: bot.id,
        seller_name: bot.username,
        good_id: goodId,
        quantity,
        price_per_unit: price,
        district_id: bot.loc,
        status: 'active',
        expires_at: new Date(Date.now() + (2 + Math.random() * 10) * 60 * 60 * 1000).toISOString(), // 2-12 hours
      });
    }

    if (listings.length > 0) {
      await supabase.from('market_listings').insert(listings);
    }
  } catch (e) {
    console.error('Bot market listings error:', e);
  }
}

// ========== BOT FACTION ATTACKS ==========
async function simulateBotFactionAttacks(supabase: any, bots: any[]) {
  try {
    // Only high-level bots attack factions
    const eligible = bots.filter(b => b.level >= 15);
    if (eligible.length === 0) return;

    const factionIds = ['cartel', 'bikers', 'syndicate'];

    for (const factionId of factionIds) {
      // 30% chance per faction per tick
      if (Math.random() > 0.3) continue;

      const { data: faction } = await supabase.from('faction_relations')
        .select('*').eq('faction_id', factionId).maybeSingle();
      if (!faction || faction.status === 'vassal' || faction.boss_hp <= 0) continue;

      // Pick 1-3 bots to attack
      const attackers = eligible.sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));

      let totalDamage = 0;
      const damageMap = faction.total_damage_dealt || {};

      for (const bot of attackers) {
        const damage = 5 + Math.floor(Math.random() * 15) + Math.floor(bot.level / 5);
        totalDamage += damage;
        damageMap[bot.id] = (damageMap[bot.id] || 0) + damage;
      }

      const newHp = Math.max(0, faction.boss_hp - totalDamage);

      await supabase.from('faction_relations').update({
        boss_hp: newHp,
        total_damage_dealt: damageMap,
        last_attack_by: attackers[0].id,
        last_attack_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('faction_id', factionId);

      // 20% chance to generate news about the attack
      if (Math.random() < 0.2) {
        const attName = attackers[0].username;
        const fName = FACTION_NAMES[factionId] || factionId;
        await supabase.from('news_events').insert({
          text: `${attName} en bondgenoten vallen ${fName} aan — boss HP daalt naar ${newHp}!`,
          icon: '⚔️',
          urgency: 'medium',
          category: 'faction',
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        });
      }
    }
  } catch (e) {
    console.error('Bot faction attack error:', e);
  }
}

// ========== BOT BOUNTIES ==========
async function simulateBotBounties(supabase: any, bots: any[]) {
  try {
    // Only every ~5th tick (low frequency)
    if (Math.random() > 0.2) return;

    // Rich bots place bounties on real players
    const richBots = bots.filter(b => b.cash > 20000 && b.level >= 10);
    if (richBots.length === 0) return;

    // Get real players to target
    const { data: players } = await supabase.from('player_state')
      .select('user_id, rep, level')
      .gt('rep', 100)
      .eq('game_over', false)
      .limit(20);
    if (!players || players.length === 0) return;

    // Check existing bot bounties (don't spam)
    const { count: existingCount } = await supabase.from('player_bounties')
      .select('id', { count: 'exact', head: true })
      .in('placer_id', bots.map((b: any) => b.id))
      .eq('status', 'active');
    if ((existingCount || 0) >= 3) return;

    const bot = richBots[Math.floor(Math.random() * richBots.length)];
    const target = players[Math.floor(Math.random() * players.length)];

    // Don't place bounty on other bots
    if (bots.some(b => b.id === target.user_id)) return;

    const amount = 2000 + Math.floor(Math.random() * 8000) + target.level * 100;
    const reasons = ['rivaliteit', 'territoriumdispuut', 'verraad', 'zakelijk conflict', 'persoonlijke vendetta'];

    await supabase.from('player_bounties').insert({
      placer_id: bot.id,
      target_id: target.user_id,
      amount: Math.min(amount, bot.cash),
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      status: 'active',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Deduct from bot
    await supabase.from('bot_players').update({
      cash: Math.max(0, bot.cash - amount),
    }).eq('id', bot.id);

    // News
    await supabase.from('news_events').insert({
      text: `${bot.username} heeft een premie van €${amount.toLocaleString()} geplaatst — de jacht is geopend!`,
      icon: '🎯',
      urgency: 'high',
      category: 'player',
      expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    });
  } catch (e) {
    console.error('Bot bounty error:', e);
  }
}

// ========== BOT LEADERBOARD SYNC ==========
async function syncBotsToLeaderboard(supabase: any, bots: any[]) {
  try {
    const entries = bots
      .filter(b => b.level >= 3) // Only meaningful bots
      .map(b => ({
        user_id: b.id,
        username: b.username,
        level: b.level,
        rep: b.rep,
        cash: b.cash,
        day: b.day,
        crew_size: b.crew_size,
        karma: b.karma,
        prestige_level: b.prestige_level,
        backstory: b.backstory,
        districts_owned: b.districts_owned,
        is_hardcore: false,
        updated_at: new Date().toISOString(),
      }));

    if (entries.length > 0) {
      await supabase.from('leaderboard_entries').upsert(entries, { onConflict: 'user_id' });
    }
  } catch (e) {
    console.error('Bot leaderboard sync error:', e);
  }
}

// Create bot gangs if none exist yet
async function ensureBotGangs(supabase: any, bots: any[]) {
  try {
    const botsWithGang = bots.filter(b => b.gang_id);
    if (botsWithGang.length >= 3) return;

    const { data: existingGangs } = await supabase.from('gangs').select('name, tag');
    const usedNames = new Set((existingGangs || []).map((g: any) => g.name));
    const usedTags = new Set((existingGangs || []).map((g: any) => g.tag));

    const available = BOT_GANG_NAMES.filter(g => !usedNames.has(g.name) && !usedTags.has(g.tag));
    if (available.length === 0) return;

    const eligibleLeaders = bots.filter(b => !b.gang_id && b.level >= 5);
    if (eligibleLeaders.length === 0) return;

    const gangsToCreate = Math.min(available.length, Math.min(eligibleLeaders.length, 3));

    for (let i = 0; i < gangsToCreate; i++) {
      const leader = eligibleLeaders[i];
      const template = available[i];

      const { data: gang, error: gangErr } = await supabase.from('gangs').insert({
        name: template.name,
        tag: template.tag,
        leader_id: leader.id,
        description: `Gang geleid door ${leader.username}`,
        level: Math.max(1, Math.floor(leader.level / 5)),
        treasury: Math.floor(Math.random() * 50000) + 10000,
      }).select('id').single();

      if (gangErr || !gang) continue;

      await supabase.from('gang_members').insert({
        gang_id: gang.id,
        user_id: leader.id,
        role: 'leader',
      });
      await supabase.from('bot_players').update({ gang_id: gang.id }).eq('id', leader.id);

      const otherBots = bots.filter(b => !b.gang_id && b.id !== leader.id).slice(0, 2 + Math.floor(Math.random() * 3));
      for (const member of otherBots) {
        await supabase.from('gang_members').insert({
          gang_id: gang.id,
          user_id: member.id,
          role: 'member',
        });
        await supabase.from('bot_players').update({ gang_id: gang.id }).eq('id', member.id);
        member.gang_id = gang.id;
      }

      const homeDistrict = leader.loc || pick(DISTRICTS);
      const { data: existingClaim } = await supabase.from('gang_territories')
        .select('gang_id').eq('district_id', homeDistrict).maybeSingle();
      if (!existingClaim) {
        await supabase.from('gang_territories').insert({
          gang_id: gang.id,
          district_id: homeDistrict,
          total_influence: 50 + Math.floor(Math.random() * 100),
          defense_level: Math.floor(Math.random() * 3),
        });
      }

      await supabase.from('district_influence').upsert({
        user_id: leader.id,
        gang_id: gang.id,
        district_id: homeDistrict,
        influence: 30 + Math.floor(Math.random() * 50),
      }, { onConflict: 'user_id,district_id' }).select();

      await supabase.from('news_events').insert({
        text: `Nieuwe gang "${template.name}" [${template.tag}] opgericht in ${DISTRICT_NAMES[homeDistrict]}!`,
        icon: '⚔️',
        urgency: 'medium',
        category: 'player',
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      });
    }
  } catch (e) {
    console.error('Bot gang creation error:', e);
  }
}

// Bot gangs actively contribute influence and claim territories
async function simulateBotGangActivity(supabase: any) {
  try {
    const { data: botGangs } = await supabase
      .from('bot_players')
      .select('id, gang_id, loc, username, level')
      .eq('is_active', true)
      .not('gang_id', 'is', null);

    if (!botGangs || botGangs.length === 0) return;

    const gangGroups: Record<string, any[]> = {};
    for (const bot of botGangs) {
      if (!gangGroups[bot.gang_id]) gangGroups[bot.gang_id] = [];
      gangGroups[bot.gang_id].push(bot);
    }

    const newsToInsert: any[] = [];
    const expiresAt = new Date(Date.now() + 35 * 60 * 1000).toISOString();

    for (const [gangId, members] of Object.entries(gangGroups)) {
      if (Math.random() > 0.5) continue;

      const { data: gang } = await supabase.from('gangs').select('name, tag, level').eq('id', gangId).single();
      if (!gang) continue;

      const memberLocs = members.map(m => m.loc);
      const targetDistrict = pick(memberLocs.length > 0 ? memberLocs : DISTRICTS);
      const influenceGain = 5 + Math.floor(Math.random() * 16);
      const contributor = pick(members);

      await supabase.from('district_influence').upsert({
        user_id: contributor.id,
        gang_id: gangId,
        district_id: targetDistrict,
        influence: influenceGain,
      }, { onConflict: 'user_id,district_id' }).select();

      const { data: existingTerritory } = await supabase
        .from('gang_territories')
        .select('gang_id, total_influence, defense_level')
        .eq('district_id', targetDistrict)
        .maybeSingle();

      if (existingTerritory && existingTerritory.gang_id === gangId) {
        await supabase.from('gang_territories').update({
          total_influence: existingTerritory.total_influence + influenceGain,
          defense_level: Math.min(5, existingTerritory.defense_level + (Math.random() < 0.1 ? 1 : 0)),
        }).eq('district_id', targetDistrict);
      } else if (!existingTerritory) {
        if (Math.random() < 0.15) {
          await supabase.from('gang_territories').insert({
            gang_id: gangId,
            district_id: targetDistrict,
            total_influence: influenceGain,
            defense_level: 0,
          });
          newsToInsert.push({
            text: `Gang [${gang.tag}] ${gang.name} claimt territorium in ${DISTRICT_NAMES[targetDistrict]}!`,
            icon: '🏴',
            urgency: 'medium',
            category: 'player',
            expires_at: expiresAt,
          });
        }
      }

      if (Math.random() < 0.05) {
        const gangNews = [
          `Leden van ${gang.name} gezien tijdens patrouille in ${DISTRICT_NAMES[targetDistrict]}`,
          `${gang.name} versterkt hun positie in ${DISTRICT_NAMES[targetDistrict]}`,
          `Schermutselingen gemeld bij territorium van ${gang.name}`,
        ];
        newsToInsert.push({
          text: pick(gangNews),
          icon: '⚔️',
          urgency: 'low',
          category: 'player',
          expires_at: expiresAt,
        });
      }
    }

    if (newsToInsert.length > 0) {
      await supabase.from('news_events').insert(newsToInsert);
    }
  } catch (e) {
    console.error('Bot gang activity error:', e);
  }
}

// ========== BOT ONLINE STATUS ==========
async function simulateBotOnlineStatus(supabase: any, bots: any[]) {
  try {
    const onlineBots = bots.sort(() => Math.random() - 0.5).slice(0, Math.floor(bots.length * 0.6));
    const rows = onlineBots.map(b => ({
      user_id: b.id,
      username: b.username,
      district_id: b.loc,
      level: b.level,
      is_online: true,
      last_seen_at: new Date().toISOString(),
    }));
    if (rows.length > 0) {
      await supabase.from('player_online_status').upsert(rows, { onConflict: 'user_id' });
    }
  } catch (e) { console.error('Bot online status error:', e); }
}

// ========== BOT ACTIVITY FEED ==========
const BOT_ACTIVITY_TEMPLATES: Array<(bot: any) => { action_type: string; description: string; icon: string }> = [
  (b) => ({ action_type: 'trade', description: `heeft een handelspartij afgerond in ${DISTRICT_NAMES[b.loc]}`, icon: '📦' }),
  (b) => ({ action_type: 'crime', description: `heeft een overval gepleegd in ${DISTRICT_NAMES[b.loc]}`, icon: '💥' }),
  (b) => ({ action_type: 'travel', description: `is gearriveerd in ${DISTRICT_NAMES[b.loc]}`, icon: '🚗' }),
  (b) => ({ action_type: 'fight', description: `heeft gevochten in ${DISTRICT_NAMES[b.loc]}`, icon: '⚔️' }),
  (b) => ({ action_type: 'levelup', description: `is gestegen naar level ${b.level}!`, icon: '⬆️' }),
  (b) => ({ action_type: 'market', description: `plaatst een advertentie op de zwarte markt`, icon: '🏪' }),
  (b) => ({ action_type: 'bounty', description: `is betrokken bij een premiejacht`, icon: '🎯' }),
  (b) => ({ action_type: 'faction', description: `valt een factie aan`, icon: '🐉' }),
  (b) => ({ action_type: 'heist', description: `plant een overval met de gang`, icon: '🏦' }),
  (b) => ({ action_type: 'casino', description: `gokt in het casino van ${DISTRICT_NAMES[b.loc]}`, icon: '🎰' }),
];

async function simulateBotActivityFeed(supabase: any, bots: any[]) {
  try {
    // 3-6 activity feed entries per tick
    const count = 3 + Math.floor(Math.random() * 4);
    const selected = bots.sort(() => Math.random() - 0.5).slice(0, count);
    const rows = selected.map(bot => {
      const template = pick(BOT_ACTIVITY_TEMPLATES);
      const activity = template(bot);
      return {
        user_id: bot.id,
        username: bot.username,
        action_type: activity.action_type,
        description: activity.description,
        icon: activity.icon,
        district_id: bot.loc,
      };
    });
    if (rows.length > 0) {
      await supabase.from('activity_feed').insert(rows);
    }
  } catch (e) { console.error('Bot activity feed error:', e); }
}

// ========== BOT WORLD RAIDS ==========
async function simulateBotWorldRaids(supabase: any, bots: any[]) {
  try {
    const { data: raids } = await supabase.from('world_raids')
      .select('*').eq('status', 'active').gt('boss_hp', 0);
    if (!raids || raids.length === 0) return;

    const eligible = bots.filter(b => b.level >= 8);
    if (eligible.length === 0) return;

    for (const raid of raids) {
      if (Math.random() > 0.4) continue; // 40% chance per raid per tick
      const attackers = eligible.sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 4));
      let totalDmg = 0;
      const participants = raid.participants || {};

      for (const bot of attackers) {
        const dmg = 3 + Math.floor(Math.random() * 12) + Math.floor(bot.level / 3);
        totalDmg += dmg;
        participants[bot.id] = (participants[bot.id] || 0) + dmg;
      }

      const newHp = Math.max(0, raid.boss_hp - totalDmg);
      await supabase.from('world_raids').update({
        boss_hp: newHp,
        participants,
        total_participants: Object.keys(participants).length,
        ...(newHp <= 0 ? { status: 'completed', completed_at: new Date().toISOString() } : {}),
      }).eq('id', raid.id);

      if (newHp <= 0) {
        await supabase.from('news_events').insert({
          text: `🏆 World Raid "${raid.title}" is verslagen! ${Object.keys(participants).length} spelers droegen bij!`,
          icon: '🏆', urgency: 'high', category: 'world',
          expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        });
      }
    }
  } catch (e) { console.error('Bot world raids error:', e); }
}

// ========== BOT SMUGGLE ROUTES ==========
async function simulateBotSmuggleRoutes(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.15) return; // Low frequency

    const gangBots = bots.filter(b => b.gang_id && b.level >= 10);
    if (gangBots.length === 0) return;

    // Check existing bot routes
    const { count } = await supabase.from('smuggle_routes')
      .select('id', { count: 'exact', head: true })
      .in('created_by', bots.map((b: any) => b.id))
      .eq('status', 'active');
    if ((count || 0) >= 3) return;

    const bot = pick(gangBots);
    const from = bot.loc;
    const to = pick(DISTRICTS.filter(d => d !== from));
    const goodId = pick(GOODS_IDS);

    await supabase.from('smuggle_routes').insert({
      from_district: from,
      to_district: to,
      good_id: goodId,
      gang_id: bot.gang_id,
      created_by: bot.id,
      profit_multiplier: 1.2 + Math.random() * 0.8,
      risk_level: 1 + Math.floor(Math.random() * 4),
      capacity: 20 + Math.floor(Math.random() * 80),
      expires_at: new Date(Date.now() + (6 + Math.random() * 18) * 60 * 60 * 1000).toISOString(),
    });

    await supabase.from('news_events').insert({
      text: `Nieuwe smokkelroute ontdekt van ${DISTRICT_NAMES[from]} naar ${DISTRICT_NAMES[to]}!`,
      icon: '🚢', urgency: 'low', category: 'market',
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  } catch (e) { console.error('Bot smuggle routes error:', e); }
}

// ========== BOT AUCTION BIDDING ==========
async function simulateBotAuctions(supabase: any, bots: any[]) {
  try {
    const { data: auctions } = await supabase.from('live_auctions')
      .select('*').eq('status', 'active').gt('ends_at', new Date().toISOString());
    if (!auctions || auctions.length === 0) return;

    const richBots = bots.filter(b => b.cash > 5000);
    if (richBots.length === 0) return;

    for (const auction of auctions) {
      if (Math.random() > 0.25) continue; // 25% chance to bid per auction
      // Don't bid on own auctions
      const eligible = richBots.filter(b => b.id !== auction.seller_id && b.id !== auction.current_bidder_id && b.cash > auction.current_bid + auction.min_increment);
      if (eligible.length === 0) continue;

      const bot = pick(eligible);
      const bidAmount = auction.current_bid + auction.min_increment + Math.floor(Math.random() * auction.min_increment * 2);
      if (bidAmount > bot.cash) continue;

      await supabase.from('auction_bids').insert({
        auction_id: auction.id,
        bidder_id: bot.id,
        bidder_name: bot.username,
        amount: bidAmount,
      });
      await supabase.from('live_auctions').update({
        current_bid: bidAmount,
        current_bidder_id: bot.id,
        current_bidder_name: bot.username,
        bid_count: auction.bid_count + 1,
      }).eq('id', auction.id);
      await supabase.from('bot_players').update({ cash: bot.cash - bidAmount }).eq('id', bot.id);
      bot.cash -= bidAmount; // Update in-memory too
    }
  } catch (e) { console.error('Bot auction bidding error:', e); }
}

// ========== BOT GANG ALLIANCES ==========
async function simulateBotGangAlliances(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.1) return; // Very low frequency

    const gangBots = bots.filter(b => b.gang_id);
    if (gangBots.length === 0) return;

    // Get unique gang IDs from bots
    const botGangIds = [...new Set(gangBots.map(b => b.gang_id))];
    if (botGangIds.length < 2) return;

    // Check existing alliances
    const { count } = await supabase.from('gang_alliances')
      .select('id', { count: 'exact', head: true })
      .or(botGangIds.map(id => `gang_a_id.eq.${id},gang_b_id.eq.${id}`).join(','))
      .eq('status', 'active');
    if ((count || 0) >= 2) return;

    // Also consider alliances with player gangs
    const { data: allGangs } = await supabase.from('gangs').select('id').limit(20);
    if (!allGangs || allGangs.length < 2) return;

    const gangA = pick(botGangIds);
    const otherGangs = (allGangs || []).map(g => g.id).filter(id => id !== gangA);
    if (otherGangs.length === 0) return;
    const gangB = pick(otherGangs);

    // Check if alliance already exists
    const { data: existing } = await supabase.from('gang_alliances')
      .select('id')
      .or(`and(gang_a_id.eq.${gangA},gang_b_id.eq.${gangB}),and(gang_a_id.eq.${gangB},gang_b_id.eq.${gangA})`)
      .limit(1);
    if (existing && existing.length > 0) return;

    const proposer = gangBots.find(b => b.gang_id === gangA) || gangBots[0];
    await supabase.from('gang_alliances').insert({
      gang_a_id: gangA,
      gang_b_id: gangB,
      proposed_by: proposer.id,
      status: 'active',
      accepted_at: new Date().toISOString(),
    });
  } catch (e) { console.error('Bot gang alliances error:', e); }
}

// ========== BOT GANG WARS ==========
async function simulateBotGangWars(supabase: any, bots: any[]) {
  try {
    // Bots participate in existing wars
    const { data: wars } = await supabase.from('gang_wars')
      .select('*').eq('status', 'active');
    if (!wars || wars.length === 0) return;

    const gangBots = bots.filter(b => b.gang_id && b.level >= 8);
    if (gangBots.length === 0) return;

    for (const war of wars) {
      if (Math.random() > 0.35) continue;

      // Find bots in either gang
      const attackerBots = gangBots.filter(b => b.gang_id === war.attacker_gang_id);
      const defenderBots = gangBots.filter(b => b.gang_id === war.defender_gang_id);

      if (attackerBots.length > 0 && Math.random() < 0.5) {
        const scoreGain = 1 + Math.floor(Math.random() * 3);
        await supabase.from('gang_wars').update({
          attacker_score: war.attacker_score + scoreGain,
          attacker_chain: Math.min(10, war.attacker_chain + 1),
          attacker_last_hit_at: new Date().toISOString(),
        }).eq('id', war.id);
      }
      if (defenderBots.length > 0 && Math.random() < 0.5) {
        const scoreGain = 1 + Math.floor(Math.random() * 3);
        await supabase.from('gang_wars').update({
          defender_score: war.defender_score + scoreGain,
          defender_chain: Math.min(10, war.defender_chain + 1),
          defender_last_hit_at: new Date().toISOString(),
        }).eq('id', war.id);
      }
    }

    // Occasionally start a new war (very rare)
    if (Math.random() > 0.05) return;
    const botGangIds = [...new Set(gangBots.map(b => b.gang_id))];
    if (botGangIds.length < 2) return;

    // Check if any bot gang is already in an active war
    const { data: activeWars } = await supabase.from('gang_wars')
      .select('attacker_gang_id, defender_gang_id').eq('status', 'active');
    const warringGangs = new Set<string>();
    for (const w of (activeWars || [])) { warringGangs.add(w.attacker_gang_id); warringGangs.add(w.defender_gang_id); }
    const availableGangs = botGangIds.filter(id => !warringGangs.has(id));
    if (availableGangs.length < 2) return;

    const attacker = availableGangs[0];
    // Try to find a player gang to attack (more interesting)
    const { data: playerGangs } = await supabase.from('gangs').select('id')
      .not('id', 'in', `(${botGangIds.join(',')})`)
      .limit(5);
    const defender = playerGangs && playerGangs.length > 0 ? pick(playerGangs).id : availableGangs[1];

    await supabase.from('gang_wars').insert({
      attacker_gang_id: attacker,
      defender_gang_id: defender,
      district_id: pick(DISTRICTS),
    });
    // News
    const { data: gA } = await supabase.from('gangs').select('name, tag').eq('id', attacker).single();
    const { data: gD } = await supabase.from('gangs').select('name, tag').eq('id', defender).single();
    if (gA && gD) {
      await supabase.from('news_events').insert({
        text: `⚔️ GANG WAR! [${gA.tag}] ${gA.name} verklaart de oorlog aan [${gD.tag}] ${gD.name}!`,
        icon: '⚔️', urgency: 'high', category: 'player',
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      });
    }
  } catch (e) { console.error('Bot gang wars error:', e); }
}

// ========== BOT PVP ATTACKS ==========
async function simulateBotPvP(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.15) return; // ~15% chance per tick

    const strongBots = bots.filter(b => b.level >= 12 && b.hp > 50);
    if (strongBots.length === 0) return;

    // Get real players in the same district
    const bot = pick(strongBots);
    const { data: targets } = await supabase.from('player_state')
      .select('user_id, level, hp, loc, money')
      .eq('loc', bot.loc)
      .eq('game_over', false)
      .is('prison_until', null)
      .is('hospital_until', null)
      .gt('hp', 30)
      .limit(5);

    if (!targets || targets.length === 0) return;

    // Pick a target near same level
    const target = pick(targets);

    // Create rivalry record
    await supabase.from('player_rivalries').upsert({
      player_id: bot.id,
      rival_id: target.user_id,
      rivalry_score: 1 + Math.floor(Math.random() * 5),
      source: 'bot_attack',
      last_interaction: new Date().toISOString(),
    }, { onConflict: 'player_id,rival_id' });

    // Activity feed
    const { data: targetProfile } = await supabase.from('profiles')
      .select('username').eq('id', target.user_id).maybeSingle();
    const targetName = targetProfile?.username || 'een speler';

    await supabase.from('activity_feed').insert({
      user_id: bot.id,
      username: bot.username,
      action_type: 'attack',
      description: `heeft ${targetName} aangevallen in ${DISTRICT_NAMES[bot.loc]}!`,
      icon: '⚔️',
      district_id: bot.loc,
      target_name: targetName,
    });
  } catch (e) { console.error('Bot PvP error:', e); }
}

// ========== BOT MESSAGES ==========
const BOT_MESSAGE_TEMPLATES = [
  { subject: 'Waarschuwing', body: 'Ik heb gehoord dat er een razzia op komst is. Pas op in de haven.' },
  { subject: 'Zakelijk voorstel', body: 'Ik heb een partij goederen beschikbaar. Interesse? Laat het me weten.' },
  { subject: 'Bondgenootschap?', body: 'We zouden samen kunnen werken. Mijn gang zoekt nog sterke spelers.' },
  { subject: 'Territorium', body: 'Blijf uit mijn district. Dit is een waarschuwing.' },
  { subject: 'Tip', body: 'Er is een smokkelroute geopend naar Crown Heights. Goed moment om te investeren.' },
  { subject: 'Bedankt', body: 'GG voor die trade eerder. Laten we weer zaken doen.' },
  { subject: 'Oorlog', body: 'Onze gang overweegt een aanval. Kies de juiste kant.' },
];

async function simulateBotMessages(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.1) return; // ~10% per tick

    const { data: players } = await supabase.from('player_state')
      .select('user_id').eq('game_over', false).limit(10);
    if (!players || players.length === 0) return;

    // Don't send to other bots
    const botIds = new Set(bots.map(b => b.id));
    const realPlayers = players.filter(p => !botIds.has(p.user_id));
    if (realPlayers.length === 0) return;

    const bot = pick(bots.filter(b => b.level >= 5));
    if (!bot) return;
    const target = pick(realPlayers);
    const template = pick(BOT_MESSAGE_TEMPLATES);

    await supabase.from('player_messages').insert({
      sender_id: bot.id,
      receiver_id: target.user_id,
      subject: template.subject,
      body: `${template.body}\n\n- ${bot.username}`,
    });
  } catch (e) { console.error('Bot messages error:', e); }
}

// ========== BOT DISTRICT EVENT CLAIMS ==========
async function simulateBotDistrictEvents(supabase: any, bots: any[]) {
  try {
    const { data: events } = await supabase.from('district_events')
      .select('*')
      .eq('source_type', 'system')
      .is('claimed_by', null)
      .gt('expires_at', new Date().toISOString())
      .limit(10);
    if (!events || events.length === 0) return;

    for (const event of events) {
      if (Math.random() > 0.2) continue; // 20% chance per event
      const botsInDistrict = bots.filter(b => b.loc === event.district_id);
      if (botsInDistrict.length === 0) continue;

      const bot = pick(botsInDistrict);
      // Add bot as participant
      const participants = event.participants || [];
      if (participants.some((p: any) => p.id === bot.id)) continue;
      participants.push({ id: bot.id, name: bot.username, action: 'joined' });

      const shouldClaim = participants.length >= 3 && Math.random() < 0.3;
      await supabase.from('district_events').update({
        participants,
        ...(shouldClaim ? { claimed_by: bot.id, claimed_at: new Date().toISOString() } : {}),
      }).eq('id', event.id);
    }
  } catch (e) { console.error('Bot district events error:', e); }
}

// ========== BOT NPC MOOD CONTRIBUTIONS ==========
async function simulateBotNpcMood(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.25) return;

    const NPC_IDS = ['rosa', 'marco', 'yilmaz', 'luna', 'krow'];
    const bot = pick(bots);
    const npcId = pick(NPC_IDS);
    const change = Math.random() > 0.6 ? 1 : -1; // Slight positive bias

    // Upsert NPC mood
    const { data: existing } = await supabase.from('npc_district_mood')
      .select('*').eq('npc_id', npcId).eq('district_id', bot.loc).maybeSingle();

    if (existing) {
      const newScore = Math.max(-100, Math.min(100, existing.collective_score + change));
      let status = 'neutral';
      if (newScore >= 30) status = 'friendly';
      else if (newScore >= 60) status = 'legendary';
      else if (newScore <= -30) status = 'hostile';

      await supabase.from('npc_district_mood').update({
        collective_score: newScore,
        interaction_count: existing.interaction_count + 1,
        status,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      await supabase.from('npc_district_mood').insert({
        npc_id: npcId,
        district_id: bot.loc,
        collective_score: change,
        interaction_count: 1,
        status: 'neutral',
      });
    }
  } catch (e) { console.error('Bot NPC mood error:', e); }
}

// ========== BOT GANG CHAT ==========
const BOT_GANG_CHAT_MESSAGES = [
  'Wie is er online? Laten we een OC doen.',
  'Ik ga naar Crown Heights, iemand mee?',
  'We moeten ons territorium verdedigen, er zijn vijanden in de buurt.',
  'Net een goede deal gesloten 💰',
  'Pas op voor die nieuwe gang, ze worden sterker.',
  'Wie heeft er ammo over? Ik ben bijna leeg.',
  'Goed gevochten vandaag team! 💪',
  'We moeten meer influence bijdragen in ons district.',
  'Die faction boss is bijna down, laten we aanvallen.',
  'Iemand interesse in een alliance met een andere gang?',
];

async function simulateBotGangChat(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.3) return;

    const gangBots = bots.filter(b => b.gang_id);
    if (gangBots.length === 0) return;

    const bot = pick(gangBots);
    const message = pick(BOT_GANG_CHAT_MESSAGES);

    await supabase.from('gang_chat').insert({
      gang_id: bot.gang_id,
      sender_id: bot.id,
      sender_name: bot.username,
      message,
    });
  } catch (e) { console.error('Bot gang chat error:', e); }
}

// ========== BOT CASINO ==========
async function simulateBotCasino(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.2) return;
    const gamblers = bots.filter(b => b.cash > 5000).sort(() => Math.random() - 0.5).slice(0, 3);
    for (const bot of gamblers) {
      const bet = Math.floor(Math.random() * Math.min(bot.cash * 0.1, 10000)) + 500;
      const won = Math.random() > 0.55;
      const delta = won ? bet : -bet;
      await supabase.from('bot_players').update({ cash: Math.max(0, bot.cash + delta) }).eq('id', bot.id);
      bot.cash = Math.max(0, bot.cash + delta);
    }
  } catch (e) { console.error('Bot casino error:', e); }
}

// ========== BOT GEAR & VEHICLES ==========
async function simulateBotGearVehicles(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.1) return;
    // Simulate bots buying gear by boosting combat_rating equivalent (rep)
    const rich = bots.filter(b => b.cash > 20000).sort(() => Math.random() - 0.5).slice(0, 2);
    for (const bot of rich) {
      const cost = Math.floor(Math.random() * 15000) + 5000;
      await supabase.from('bot_players').update({ cash: bot.cash - cost }).eq('id', bot.id);
      bot.cash -= cost;
    }
  } catch (e) { console.error('Bot gear error:', e); }
}

// ========== BOT BUSINESSES ==========
async function simulateBotBusinesses(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.08) return;
    const eligible = bots.filter(b => b.cash > 50000 && b.level >= 10);
    if (eligible.length === 0) return;
    const bot = pick(eligible);
    const businessIds = ['bar', 'club', 'restaurant', 'garage', 'laundromat', 'pawnshop'];
    const biz = pick(businessIds);
    // Business gives passive income via rep/cash growth already simulated
    const cost = 30000 + Math.floor(Math.random() * 50000);
    await supabase.from('bot_players').update({ cash: Math.max(0, bot.cash - cost) }).eq('id', bot.id);
  } catch (e) { console.error('Bot business error:', e); }
}

// ========== BOT MONEY WASHING ==========
async function simulateBotMoneyWashing(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.12) return;
    const rich = bots.filter(b => b.cash > 30000).sort(() => Math.random() - 0.5).slice(0, 2);
    for (const bot of rich) {
      const washAmount = Math.floor(bot.cash * 0.1);
      // Washing costs ~20% fee
      const fee = Math.floor(washAmount * 0.2);
      await supabase.from('bot_players').update({ cash: bot.cash - fee }).eq('id', bot.id);
      bot.cash -= fee;
    }
  } catch (e) { console.error('Bot money washing error:', e); }
}

// ========== BOT HEISTS ==========
async function simulateBotHeists(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.08) return;
    // Check for open heist sessions, bots join them
    const { data: openHeists } = await supabase.from('heist_sessions')
      .select('*')
      .eq('status', 'recruiting')
      .limit(3);
    if (!openHeists || openHeists.length === 0) return;
    for (const heist of openHeists) {
      const slots = heist.crew_slots || {};
      const roles = ['lookout', 'driver', 'hacker', 'muscle'];
      const emptyRoles = roles.filter(r => !slots[r]);
      if (emptyRoles.length === 0) continue;
      const gangBots = bots.filter(b => b.gang_id === heist.gang_id);
      if (gangBots.length === 0) continue;
      const bot = pick(gangBots);
      const role = pick(emptyRoles);
      slots[role] = { userId: bot.id, username: bot.username };
      await supabase.from('heist_sessions').update({ crew_slots: slots }).eq('id', heist.id);
    }
  } catch (e) { console.error('Bot heist error:', e); }
}

// ========== BOT SAFEHOUSE RAIDS ==========
async function simulateBotSafehouseRaids(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.05) return;
    const { data: safehouses } = await supabase.from('player_safehouses')
      .select('*')
      .limit(10);
    if (!safehouses || safehouses.length === 0) return;
    const target = pick(safehouses);
    const attacker = pick(bots.filter(b => b.level >= 15 && b.id !== target.user_id));
    if (!attacker) return;
    const won = Math.random() > 0.5;
    const loot = won ? Math.floor(Math.random() * 5000) + 1000 : 0;
    await supabase.from('safehouse_raids').insert({
      attacker_id: attacker.id,
      defender_id: target.user_id,
      district_id: target.district_id,
      attacker_won: won,
      loot_stolen: loot,
      attacker_damage: Math.floor(Math.random() * 30),
      defender_damage: Math.floor(Math.random() * 30),
    });
    if (won) {
      await supabase.from('bot_players').update({ cash: attacker.cash + loot }).eq('id', attacker.id);
    }
  } catch (e) { console.error('Bot safehouse raid error:', e); }
}

// ========== BOT SABOTAGE LAB ==========
async function simulateBotSabotageLab(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.05) return;
    // Simulate via activity feed only (no dedicated table)
    const attacker = pick(bots.filter(b => b.level >= 12));
    if (!attacker) return;
    await supabase.from('activity_feed').insert({
      user_id: attacker.id,
      username: attacker.username,
      action_type: 'sabotage',
      description: `heeft een rivaal-lab gesaboteerd in ${DISTRICT_NAMES[attacker.loc]}`,
      icon: '💣',
      district_id: attacker.loc,
    });
  } catch (e) { console.error('Bot sabotage error:', e); }
}

// ========== BOT GANG STORY ARCS ==========
async function simulateBotGangArcs(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.06) return;
    // Progress existing bot gang arcs
    const botGangIds = [...new Set(bots.filter(b => b.gang_id).map(b => b.gang_id))];
    if (botGangIds.length === 0) return;
    const { data: arcs } = await supabase.from('gang_story_arcs')
      .select('*')
      .in('gang_id', botGangIds)
      .eq('status', 'active')
      .limit(5);
    if (!arcs || arcs.length === 0) return;
    for (const arc of arcs) {
      const newStep = arc.current_step + 1;
      if (newStep >= arc.total_steps) {
        await supabase.from('gang_story_arcs').update({
          current_step: newStep,
          status: 'completed',
          completed_at: new Date().toISOString(),
          result: { outcome: 'success', reward: { cash: 10000, rep: 50 } },
        }).eq('id', arc.id);
      } else {
        await supabase.from('gang_story_arcs').update({ current_step: newStep }).eq('id', arc.id);
      }
    }
  } catch (e) { console.error('Bot gang arc error:', e); }
}

// ========== BOT NEMESIS ==========
async function simulateBotNemesis(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.04) return;
    // Progress existing nemesis arcs
    const botIds = bots.map(b => b.id);
    const { data: nemeses } = await supabase.from('player_nemesis')
      .select('*')
      .in('player_id', botIds)
      .eq('status', 'active')
      .limit(5);
    if (!nemeses || nemeses.length === 0) return;
    for (const nem of nemeses) {
      const newProgress = Math.min(100, nem.arc_progress + Math.floor(Math.random() * 20) + 10);
      const eventsLog = nem.events_log || [];
      eventsLog.push({ event: 'confrontation', timestamp: new Date().toISOString() });
      if (newProgress >= 100) {
        const actions = ['execute', 'banish', 'recruit'];
        await supabase.from('player_nemesis').update({
          arc_progress: 100,
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          events_log: eventsLog,
        }).eq('id', nem.id);
      } else {
        await supabase.from('player_nemesis').update({
          arc_progress: newProgress,
          events_log: eventsLog,
        }).eq('id', nem.id);
      }
    }
  } catch (e) { console.error('Bot nemesis error:', e); }
}

// ========== BOT UNDERCOVER MISSIONS ==========
async function simulateBotUndercover(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.06) return;
    const botIds = bots.map(b => b.id);
    const { data: missions } = await supabase.from('undercover_missions')
      .select('*')
      .in('user_id', botIds)
      .eq('status', 'active')
      .limit(3);
    if (!missions || missions.length === 0) {
      // Maybe start a new one
      if (Math.random() > 0.5) return;
      const eligible = bots.filter(b => b.level >= 15 && b.cash > 10000);
      if (eligible.length === 0) return;
      const bot = pick(eligible);
      const factions = ['syndicate', 'cartel', 'yakuza', 'bratva', 'triad'];
      const covers = ['Marco Verdi', 'Elena Rossi', 'Viktor Petrov', 'Carlos Mendez', 'Yuki Tanaka'];
      await supabase.from('undercover_missions').insert({
        user_id: bot.id,
        target_faction: pick(factions),
        cover_identity: pick(covers),
      });
      await supabase.from('bot_players').update({ cash: bot.cash - 10000 }).eq('id', bot.id);
      return;
    }
    // Progress existing missions
    for (const m of missions) {
      const coverLoss = Math.floor(Math.random() * 15) + 5;
      const newCover = Math.max(0, m.cover_integrity - coverLoss);
      const success = Math.random() > 0.3;
      const intel = m.intel_gathered || [];
      if (success) intel.push({ text: 'intel verzameld', day: new Date().toISOString() });
      if (newCover <= 0) {
        await supabase.from('undercover_missions').update({
          cover_integrity: 0, status: 'blown', completed_at: new Date().toISOString(),
          intel_gathered: intel,
        }).eq('id', m.id);
      } else {
        await supabase.from('undercover_missions').update({
          cover_integrity: newCover,
          missions_completed: m.missions_completed + (success ? 1 : 0),
          days_active: m.days_active + 1,
          intel_gathered: intel,
        }).eq('id', m.id);
      }
    }
  } catch (e) { console.error('Bot undercover error:', e); }
}

// ========== BOT TRIBUNAL ==========
async function simulateBotTribunal(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.04) return;
    // Vote on existing cases
    const { data: cases } = await supabase.from('tribunal_cases')
      .select('*')
      .eq('status', 'voting')
      .limit(5);
    if (!cases || cases.length === 0) {
      // Maybe file a new case
      if (Math.random() > 0.7 || bots.length < 2) return;
      const accuser = pick(bots);
      // Get a human player target from leaderboard
      const { data: targets } = await supabase.from('leaderboard_entries')
        .select('user_id, username')
        .neq('user_id', accuser.id)
        .limit(20);
      if (!targets || targets.length === 0) return;
      const target = pick(targets);
      const charges = ['marktmanipulatie', 'territoriumdiefstal', 'verraderij', 'buitensporig geweld', 'oplichting'];
      const evidences = ['Meerdere getuigen bevestigen dit', 'Transactiegeschiedenis toont fraude', 'Screenshot bewijs beschikbaar'];
      await supabase.from('tribunal_cases').insert({
        accuser_id: accuser.id,
        accuser_name: accuser.username,
        target_id: target.user_id,
        target_name: target.username,
        charge: pick(charges),
        evidence: pick(evidences),
        status: 'voting',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      return;
    }
    // Vote on cases
    for (const tc of cases) {
      const voters = bots.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1);
      for (const voter of voters) {
        if (voter.id === tc.accuser_id || voter.id === tc.target_id) continue;
        const { data: existing } = await supabase.from('tribunal_votes')
          .select('id').eq('case_id', tc.id).eq('juror_id', voter.id).maybeSingle();
        if (existing) continue;
        const vote = Math.random() > 0.5 ? 'guilty' : 'innocent';
        await supabase.from('tribunal_votes').insert({
          case_id: tc.id,
          juror_id: voter.id,
          juror_name: voter.username,
          vote,
        });
      }
    }
  } catch (e) { console.error('Bot tribunal error:', e); }
}

// ========== BOT MOLE OPERATIONS ==========
async function simulateBotMoles(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.05) return;
    // Progress existing moles
    const botIds = bots.map(b => b.id);
    const { data: moles } = await supabase.from('gang_moles')
      .select('*')
      .in('player_id', botIds)
      .eq('status', 'active')
      .limit(5);
    if (moles && moles.length > 0) {
      for (const mole of moles) {
        const coverLoss = Math.floor(Math.random() * 10) + 2;
        const newCover = Math.max(0, mole.cover_strength - coverLoss);
        const intel = mole.intel_reports || [];
        if (Math.random() > 0.4) {
          intel.push({ type: 'treasury', value: Math.floor(Math.random() * 50000), timestamp: new Date().toISOString() });
        }
        if (newCover <= 0) {
          await supabase.from('gang_moles').update({
            cover_strength: 0, status: 'discovered',
            discovered_at: new Date().toISOString(),
            intel_reports: intel,
          }).eq('id', mole.id);
        } else {
          await supabase.from('gang_moles').update({
            cover_strength: newCover, intel_reports: intel,
            last_intel_at: new Date().toISOString(),
          }).eq('id', mole.id);
        }
      }
    }
    // Maybe plant a new mole
    if (Math.random() > 0.7) return;
    const gangBots = bots.filter(b => b.gang_id);
    if (gangBots.length === 0) return;
    const bot = pick(gangBots);
    const otherGangIds = [...new Set(gangBots.filter(b => b.gang_id !== bot.gang_id).map(b => b.gang_id))];
    if (otherGangIds.length === 0) return;
    const targetGang = pick(otherGangIds);
    await supabase.from('gang_moles').insert({
      player_id: bot.id,
      player_gang_id: bot.gang_id,
      target_gang_id: targetGang,
    });
  } catch (e) { console.error('Bot mole error:', e); }
}

// ========== BOT CONTRACTS ==========
async function simulateBotContracts(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.15) return;
    // Bots simulate completing contracts by earning cash/rep/xp
    const active = bots.filter(b => b.level >= 5).sort(() => Math.random() - 0.5).slice(0, 3);
    for (const bot of active) {
      const cashReward = Math.floor(Math.random() * 8000) + 2000;
      const repReward = Math.floor(Math.random() * 15) + 5;
      await supabase.from('bot_players').update({
        cash: bot.cash + cashReward,
        rep: bot.rep + repReward,
      }).eq('id', bot.id);
      bot.cash += cashReward;
      bot.rep += repReward;
      // Activity feed
      await supabase.from('activity_feed').insert({
        user_id: bot.id,
        username: bot.username,
        action_type: 'contract',
        description: `heeft een contract voltooid in ${DISTRICT_NAMES[bot.loc]}`,
        icon: '📋',
        district_id: bot.loc,
      });
    }
  } catch (e) { console.error('Bot contracts error:', e); }
}

// ========== BOT POLICE BRIBING ==========
async function simulateBotPoliceBribe(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.1) return;
    // Simulate bots bribing police (reduce heat via activity feed)
    const hotBots = bots.filter(b => b.cash > 10000).sort(() => Math.random() - 0.5).slice(0, 2);
    for (const bot of hotBots) {
      const cost = Math.floor(Math.random() * 5000) + 2000;
      await supabase.from('bot_players').update({ cash: Math.max(0, bot.cash - cost) }).eq('id', bot.id);
      bot.cash -= cost;
    }
  } catch (e) { console.error('Bot bribe error:', e); }
}

// ========== BOT SKILL PROGRESSION ==========
async function simulateBotSkills(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.08) return;
    // Bots that level up get skill points reflected in higher stats
    const eligible = bots.filter(b => b.level >= 8);
    if (eligible.length === 0) return;
    const bot = pick(eligible);
    // Increase max_hp or rep as proxy for skill unlocks
    await supabase.from('bot_players').update({
      max_hp: bot.max_hp + 5,
    }).eq('id', bot.id);
  } catch (e) { console.error('Bot skills error:', e); }
}

// ========== BOT PRESTIGE ==========
async function simulateBotPrestige(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.02) return;
    const eligible = bots.filter(b => b.level >= 50 && b.prestige_level < 5);
    if (eligible.length === 0) return;
    const bot = pick(eligible);
    await supabase.from('bot_players').update({
      prestige_level: bot.prestige_level + 1,
      level: 1,
      rep: 0,
      cash: 10000,
    }).eq('id', bot.id);
    await supabase.from('news_events').insert({
      text: `${bot.username} heeft Prestige ${bot.prestige_level + 1} bereikt! 🌟`,
      icon: '🌟',
      urgency: 'high',
      category: 'player',
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  } catch (e) { console.error('Bot prestige error:', e); }
}

// ========== BOT STORY EVENTS ==========
async function simulateBotStoryEvents(supabase: any, bots: any[]) {
  try {
    if (Math.random() > 0.06) return;
    // Resolve pending bot story events
    const botIds = bots.map(b => b.id);
    const { data: pending } = await supabase.from('personal_story_events')
      .select('*')
      .in('user_id', botIds)
      .eq('status', 'pending')
      .limit(5);
    if (!pending || pending.length === 0) return;
    for (const story of pending) {
      const choices = story.choices || [];
      if (choices.length === 0) continue;
      const chosen = pick(choices);
      await supabase.from('personal_story_events').update({
        status: 'resolved',
        chosen_option: chosen.id,
        reward_data: chosen.reward || {},
      }).eq('id', story.id);
    }
  } catch (e) { console.error('Bot story events error:', e); }
}

async function simulateBots(supabase: any, phase: string, worldDay: number) {
  try {
    const { data: bots } = await supabase
      .from('bot_players')
      .select('*')
      .eq('is_active', true);

    if (!bots || bots.length === 0) return;

    // Ensure bot gangs exist
    await ensureBotGangs(supabase, bots);

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
        case 'chat':
        case 'market':
        case 'faction':
          break;
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

      if (Math.random() < 0.05 && newRep > 50) {
        updates.crew_size = Math.min(4, bot.crew_size + 1);
      }
      if (Math.random() < 0.15) {
        updates.karma = bot.karma + (Math.random() > 0.5 ? 1 : -1);
      }

      // Districts owned based on gang territories
      if (bot.gang_id) {
        const { count: distCount } = await supabase.from('gang_territories')
          .select('id', { count: 'exact', head: true })
          .eq('gang_id', bot.gang_id);
        if (distCount !== null) updates.districts_owned = distCount;
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

    // ========== ALL BOT ACTIVITIES (run in parallel) ==========
    await Promise.all([
      simulateBotChat(supabase, bots, phase),
      simulateBotMarketListings(supabase, bots),
      simulateBotFactionAttacks(supabase, bots),
      simulateBotBounties(supabase, bots),
      simulateBotGangActivity(supabase),
      syncBotsToLeaderboard(supabase, bots),
      simulateBotOnlineStatus(supabase, bots),
      simulateBotActivityFeed(supabase, bots),
      simulateBotWorldRaids(supabase, bots),
      simulateBotSmuggleRoutes(supabase, bots),
      simulateBotAuctions(supabase, bots),
      simulateBotGangAlliances(supabase, bots),
      simulateBotGangWars(supabase, bots),
      simulateBotPvP(supabase, bots),
      simulateBotMessages(supabase, bots),
      simulateBotDistrictEvents(supabase, bots),
      simulateBotNpcMood(supabase, bots),
      simulateBotGangChat(supabase, bots),
      // New bot activities
      simulateBotCasino(supabase, bots),
      simulateBotGearVehicles(supabase, bots),
      simulateBotBusinesses(supabase, bots),
      simulateBotMoneyWashing(supabase, bots),
      simulateBotHeists(supabase, bots),
      simulateBotSafehouseRaids(supabase, bots),
      simulateBotSabotageLab(supabase, bots),
      simulateBotGangArcs(supabase, bots),
      simulateBotNemesis(supabase, bots),
      simulateBotUndercover(supabase, bots),
      simulateBotTribunal(supabase, bots),
      simulateBotMoles(supabase, bots),
      simulateBotContracts(supabase, bots),
      simulateBotPoliceBribe(supabase, bots),
      simulateBotSkills(supabase, bots),
      simulateBotPrestige(supabase, bots),
      simulateBotStoryEvents(supabase, bots),
    ]);
  } catch (e) {
    console.error('Bot simulation error:', e);
  }
}

// ========== DAILY DIGEST GENERATION ==========
const CLIFFHANGER_TEMPLATES = [
  { text: 'Er gaan geruchten over een grote drugszending in de haven...', icon: '📦' },
  { text: 'Een onbekende koper wil een fortuin betalen voor zeldzame goederen...', icon: '💎' },
  { text: 'De politie plant een grote razzia in een onbekende wijk...', icon: '🚔' },
  { text: 'Een rivaliserende gang breidt zijn territorium uit naar jouw wijken...', icon: '⚔️' },
  { text: 'Er wordt gefluisterd over een geheime deal op de zwarte markt...', icon: '🤫' },
  { text: 'Een NPC contactpersoon heeft dringend nieuws voor je...', icon: '📱' },
  { text: 'De beurs reageert nerveus op geruchten over een overname...', icon: '📉' },
  { text: 'Een mysterieuze figuur biedt een lucratief contract aan...', icon: '🕵️' },
];

async function generateDailyDigests(supabase: any, completedDay: number, newWeather: string) {
  try {
    const { data: players } = await supabase
      .from('player_state')
      .select('user_id, money, dirty_money, rep, level, heat, personal_heat, loc, day, debt, backstory')
      .eq('game_over', false);

    if (!players || players.length === 0) return;

    const { data: recentNews } = await supabase
      .from('news_events')
      .select('text, category, urgency')
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: activeWars } = await supabase
      .from('gang_wars')
      .select('attacker_gang_id, defender_gang_id, status, district_id')
      .eq('status', 'active')
      .limit(5);

    const { data: activeBounties } = await supabase
      .from('player_bounties')
      .select('target_id, amount, reason')
      .eq('status', 'active')
      .limit(10);

    const bountyMap = new Map<string, { amount: number; reason: string }[]>();
    (activeBounties || []).forEach((b: any) => {
      if (!bountyMap.has(b.target_id)) bountyMap.set(b.target_id, []);
      bountyMap.get(b.target_id)!.push({ amount: b.amount, reason: b.reason });
    });

    const digests: any[] = [];

    for (const player of players) {
      const digest: Record<string, any> = {
        world_day: completedDay,
        weather: newWeather,
        sections: {},
      };

      digest.sections.income = {
        available: true,
        debt: player.debt || 0,
        debtInterest: player.debt > 0 ? Math.floor(player.debt * 0.05) : 0,
      };

      const playerBounties = bountyMap.get(player.user_id) || [];
      digest.sections.pvp = {
        activeBountiesOnYou: playerBounties.length,
        totalBountyAmount: playerBounties.reduce((s: number, b: any) => s + b.amount, 0),
        activeGangWars: (activeWars || []).length,
      };

      const marketHighlights = (recentNews || [])
        .filter((n: any) => n.category === 'market')
        .slice(0, 3)
        .map((n: any) => n.text);
      digest.sections.market = { highlights: marketHighlights };

      const cliffhanger = CLIFFHANGER_TEMPLATES[Math.floor(Math.random() * CLIFFHANGER_TEMPLATES.length)];
      digest.sections.cliffhanger = cliffhanger;

      digests.push({
        user_id: player.user_id,
        world_day: completedDay,
        digest_data: digest,
        seen: false,
      });
    }

    if (digests.length > 0) {
      await supabase.from('daily_digests').upsert(digests, { onConflict: 'user_id,world_day' });
    }
  } catch (e) {
    console.error('Digest generation error:', e);
  }
}

// ========== FACTION BOSS RESET ==========
const FACTION_NAMES: Record<string, string> = {
  cartel: 'Het Cartel', bikers: 'De Bikers', syndicate: 'Het Syndicaat',
};

// ========== WEEKLY FACTION MODIFIERS ==========
const FACTION_MODIFIERS = [
  { id: 'fortified', name: '🛡️ Versterkt', desc: '+50% Boss HP maar dubbele rewards', hpMult: 1.5, rewardMult: 2 },
  { id: 'weakened', name: '💀 Verzwakt', desc: '-30% Boss HP — makkelijker te verslaan', hpMult: 0.7, rewardMult: 1 },
  { id: 'enraged', name: '🔥 Woedend', desc: 'Boss doet meer schade maar geeft +50% rep', hpMult: 1.0, rewardMult: 1.5 },
  { id: 'bountied', name: '💰 Premiejacht', desc: 'Extra €25k voor de top-aanvaller', hpMult: 1.0, rewardMult: 1, bonusCash: 25000 },
];

async function applyWeeklyFactionModifiers(supabase: any, worldDay: number) {
  try {
    const factionIds = ['cartel', 'bikers', 'syndicate'];
    // Pick a random faction and modifier
    const targetFaction = factionIds[worldDay % factionIds.length];
    const modifier = FACTION_MODIFIERS[worldDay % FACTION_MODIFIERS.length];

    // Apply HP modifier to non-vassal factions
    const { data: faction } = await supabase.from('faction_relations')
      .select('*').eq('faction_id', targetFaction).maybeSingle();
    if (faction && faction.status !== 'vassal') {
      const newMaxHp = Math.round(100 * modifier.hpMult);
      await supabase.from('faction_relations').update({
        boss_max_hp: newMaxHp,
        boss_hp: Math.min(faction.boss_hp, newMaxHp),
        updated_at: new Date().toISOString(),
      }).eq('faction_id', targetFaction);
    }

    // News about the modifier
    const factionName = FACTION_NAMES[targetFaction] || targetFaction;
    await supabase.from('news_events').insert({
      text: `${modifier.name} — ${factionName} is deze week ${modifier.desc.toLowerCase()}!`,
      icon: modifier.name.slice(0, 2),
      urgency: 'high',
      category: 'faction',
      detail: `Wekelijkse factie-modifier: ${factionName} heeft de "${modifier.name}" status gekregen. ${modifier.desc}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    console.log(`Weekly faction modifier: ${targetFaction} -> ${modifier.id}`);
  } catch (e) {
    console.error('Faction modifier error:', e);
  }
}

async function resetConqueredFactions(supabase: any) {
  try {
    const { data: conquered } = await supabase
      .from('faction_relations')
      .select('faction_id, reset_at, conquered_by, total_damage_dealt')
      .eq('status', 'vassal')
      .not('reset_at', 'is', null);

    if (!conquered || conquered.length === 0) return;

    const now = new Date();
    for (const f of conquered) {
      if (!f.reset_at || new Date(f.reset_at) > now) continue;

      // Reset faction
      await supabase.from('faction_relations').update({
        status: 'active',
        boss_hp: 100,
        boss_max_hp: 100,
        conquest_phase: 'none',
        conquest_progress: 0,
        conquered_by: null,
        conquered_at: null,
        vassal_owner_id: null,
        reset_at: null,
        total_damage_dealt: {},
        gang_damage: {},
        conquest_reward_claimed: [],
        last_attack_by: null,
        last_attack_at: null,
        updated_at: now.toISOString(),
      }).eq('faction_id', f.faction_id);

      // Generate news
      const name = FACTION_NAMES[f.faction_id] || f.faction_id;
      await supabase.from('news_events').insert({
        text: `${name} heeft zich hersteld en een nieuwe leider gekozen! De strijd kan opnieuw beginnen.`,
        icon: '⚔️',
        urgency: 'high',
        category: 'faction',
        detail: `Na 48 uur is ${name} weer op volle sterkte. Alle spelers kunnen opnieuw aanvallen.`,
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      });

      console.log(`Faction ${f.faction_id} reset after 48h timer.`);
    }
  } catch (e) {
    console.error('Faction reset error:', e);
  }
}

// ========== SERVER-DRIVEN DISTRICT EVENTS (enhanced MMO) ==========
const PHASE_DISTRICT_EVENTS: Record<string, { district: string; title: string; description: string; type: string }[]> = {
  night: [
    { district: 'neon', title: 'Nachtelijke Drugsrazzia', description: 'De narcotica-brigade doet invallen in Neon Strip. Dealers worden opgepakt.', type: 'negative' },
    { district: 'port', title: 'Smokkelschip Aangekomen', description: 'Een ongeregistreerd schip is aangemeerd. Goedkope goederen beschikbaar.', type: 'positive' },
    { district: 'low', title: 'Straatgevecht Uitgebroken', description: 'Twee bendes vechten om territorium in Lowrise. Chaos op straat.', type: 'negative' },
    { district: 'iron', title: 'Nachtploeg Staking', description: 'Fabrieksarbeiders staken. De productie ligt stil maar chemicaliën lekken.', type: 'neutral' },
    { district: 'crown', title: 'VIP After-Party', description: 'Een exclusief feest in Crown Heights. Perfecte netwerkmogelijkheid.', type: 'positive' },
  ],
  dawn: [
    { district: 'low', title: 'Ochtendrazzia NHPD', description: 'De politie begint de dag met huiszoekingen in Lowrise.', type: 'negative' },
    { district: 'port', title: 'Vroege Havenlading', description: 'Een container vol ongemarkeerde goederen wordt gelost bij eerste licht.', type: 'positive' },
    { district: 'crown', title: 'Beursopening Crash', description: 'De aandelenmarkt opent met een flash crash. Paniek in Crown Heights.', type: 'negative' },
    { district: 'iron', title: 'Fabrieksexplosie bij Dageraad', description: 'Een chemisch lab ontploft. Grondstoffen liggen verspreid.', type: 'neutral' },
  ],
  dusk: [
    { district: 'neon', title: 'Casino Jackpot Alert', description: 'De jackpot in het casino is verdrievoudigd. Gokkers stromen toe.', type: 'positive' },
    { district: 'crown', title: 'Zakelijke Afrekening', description: 'Een CEO wordt neergeschoten bij zonsondergang. De markt reageert.', type: 'negative' },
    { district: 'port', title: 'Havenstaking Opgeheven', description: 'De staking is voorbij. Handel herstart met een golf van goederen.', type: 'positive' },
    { district: 'iron', title: 'Wapensmokkel Ontdekt', description: 'Douane onderschept wapens in Iron Borough. Prijzen stijgen.', type: 'neutral' },
  ],
  day: [
    { district: 'low', title: 'Buurtfeest in Lowrise', description: 'Een spontaan straatfeest. De sfeer is goed, de heat laag.', type: 'positive' },
    { district: 'crown', title: 'SEC Inspectie', description: 'Financiële inspecteurs bezoeken bedrijven in Crown Heights.', type: 'negative' },
    { district: 'neon', title: 'Celebrity Bezoek', description: 'Een internationale ster bezoekt Neon Strip. Media overal.', type: 'positive' },
  ],
};

// === COMPETITIVE EVENTS: first to claim wins ===
const COMPETITIVE_EVENTS = [
  { title: 'Wapendrop', description: 'Een onbekende heeft een kist wapens achtergelaten. Eerste claimt!', reward: { money: 5000, rep: 15, xp: 30, heat: 8 } },
  { title: 'Verloren Koffer', description: 'Een koffer vol cash gevonden bij het station. Grijp het voor iemand anders!', reward: { money: 8000, rep: 10, xp: 25, heat: 5 } },
  { title: 'Geheime Informant', description: 'Een tipgever wil info delen — maar alleen met de eerste die komt.', reward: { money: 2000, rep: 20, xp: 40, heat: -10 } },
  { title: 'Gestolen Kunstwerk', description: 'Een schilderij ter waarde van duizenden is achtergelaten in een steeg.', reward: { money: 12000, rep: 25, xp: 35, heat: 12 } },
];

// === COOPERATIVE EVENTS: more participants = better outcome ===
const COOPERATIVE_EVENTS = [
  { title: 'Politie-Razzia Alert', description: 'De NHPD plant een grote razzia. Werk samen om de heat te verlagen!', reward: { heatReduction: 10, rep: 5 } },
  { title: 'Buurt Bescherming', description: 'Bewoners vragen om hulp tegen afpersers. Meer helpers = minder criminaliteit.', reward: { heatReduction: 8, rep: 10 } },
  { title: 'Brand in de Wijk', description: 'Een brand dreigt het district te verwoesten. Help blussen!', reward: { heatReduction: 15, rep: 8 } },
  { title: 'Getuigen Beschermen', description: 'Getuigen van een misdrijf moeten beschermd worden. Samen sterker.', reward: { heatReduction: 12, rep: 12 } },
];

// === ESCALATION EVENTS: get worse if nobody responds ===
const ESCALATION_EVENTS = [
  { title: 'Gang Invasie', desc_stages: ['Een rivaliserende gang verkent het district.', 'De gang heeft voet aan de grond — heat stijgt!', 'VOLLEDIGE INVASIE — iedereen krijgt +20 heat!'], heat_per_stage: [5, 10, 20] },
  { title: 'Politie Surveillance', desc_stages: ['Undercover agenten gespot in het district.', 'De surveillance wordt opgevoerd — arrestatiekans stijgt!', 'GROOTSCHALIGE RAZZIA — spelers worden gearresteerd!'], heat_per_stage: [3, 8, 15] },
];

async function generateServerDistrictEvents(supabase: any, phase: string, weather: string, worldDay: number) {
  try {
    const events = PHASE_DISTRICT_EVENTS[phase] || [];
    if (events.length === 0) return;

    // Pick 1-2 standard events
    const shuffled = [...events].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 1 + (Math.random() < 0.4 ? 1 : 0));

    const rows = picked.map(e => ({
      district_id: e.district,
      event_type: `server_${e.type}`,
      title: e.title,
      description: e.description,
      data: { phase, weather, world_day: worldDay, interactive: true },
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }));

    // === 40% chance: Add a COMPETITIVE event ===
    if (Math.random() < 0.4) {
      const compEvent = COMPETITIVE_EVENTS[Math.floor(Math.random() * COMPETITIVE_EVENTS.length)];
      const district = pick(DISTRICTS);
      rows.push({
        district_id: district,
        event_type: 'competitive',
        title: `🏆 ${compEvent.title}`,
        description: compEvent.description,
        data: { phase, weather, world_day: worldDay, interactive: true, competitive: true, reward: compEvent.reward },
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min to claim
      });
    }

    // === 35% chance: Add a COOPERATIVE event ===
    if (Math.random() < 0.35) {
      const coopEvent = COOPERATIVE_EVENTS[Math.floor(Math.random() * COOPERATIVE_EVENTS.length)];
      const district = pick(DISTRICTS);
      rows.push({
        district_id: district,
        event_type: 'cooperative',
        title: `🤝 ${coopEvent.title}`,
        description: coopEvent.description,
        data: { phase, weather, world_day: worldDay, interactive: true, cooperative: true, reward: coopEvent.reward },
        expires_at: new Date(Date.now() + 25 * 60 * 1000).toISOString(), // 25 min
      });
    }

    await supabase.from('district_events').insert(rows);

    // === ESCALATION: Check existing escalation events and escalate ===
    const { data: existingEsc } = await supabase.from('district_events')
      .select('*')
      .eq('event_type', 'escalation')
      .gte('expires_at', new Date().toISOString());

    for (const esc of (existingEsc || [])) {
      const escData = esc.data || {};
      const level = escData.escalation_level || 0;
      const participants = esc.participants || [];

      // If nobody participated, escalate
      if (participants.length === 0 && level < 2) {
        const newLevel = level + 1;
        const template = ESCALATION_EVENTS.find(e => esc.title.includes(e.title));
        if (template) {
          await supabase.from('district_events').update({
            description: template.desc_stages[newLevel],
            escalation_level: newLevel,
            data: { ...escData, escalation_level: newLevel },
          }).eq('id', esc.id);

          // Apply heat to all players in district
          const heatPenalty = template.heat_per_stage[newLevel] || 10;
          const { data: districtPlayers } = await supabase.from('player_state')
            .select('user_id, heat')
            .eq('loc', esc.district_id)
            .eq('game_over', false);

          for (const p of (districtPlayers || [])) {
            await supabase.from('player_state').update({
              heat: Math.min(100, (p.heat || 0) + heatPenalty),
            }).eq('user_id', p.user_id);
          }

          await supabase.from('news_events').insert({
            text: `⚠️ ${esc.title} ESCALEERT in ${DISTRICT_NAMES[esc.district_id]}! Alle spelers krijgen +${heatPenalty} heat!`,
            icon: '🔥', urgency: 'high', category: 'district',
            district_id: esc.district_id,
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          });
        }
      }
    }

    // === 15% chance: Spawn NEW escalation event ===
    if (Math.random() < 0.15 && (existingEsc || []).length < 2) {
      const escTemplate = ESCALATION_EVENTS[Math.floor(Math.random() * ESCALATION_EVENTS.length)];
      const district = pick(DISTRICTS);
      await supabase.from('district_events').insert({
        district_id: district,
        event_type: 'escalation',
        title: `⚠️ ${escTemplate.title}`,
        description: escTemplate.desc_stages[0],
        data: { phase, weather, world_day: worldDay, interactive: true, cooperative: true, escalation_level: 0, reward: { heatReduction: escTemplate.heat_per_stage[0], rep: 5 } },
        escalation_level: 0,
        expires_at: new Date(Date.now() + 90 * 60 * 1000).toISOString(), // 90 min — escalates each tick
      });
    }

    // Broadcast picked standard events as news
    for (const e of picked) {
      await supabase.from('news_events').insert({
        text: `${e.title} in ${DISTRICT_NAMES[e.district] || e.district}`,
        icon: e.type === 'positive' ? '✨' : e.type === 'negative' ? '⚠️' : '📰',
        urgency: e.type === 'negative' ? 'high' : 'low',
        category: 'district', district_id: e.district, detail: e.description,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
    }
  } catch (e) {
    console.error('Server district events error:', e);
  }
}

// ========== MOL DETECTIE & INTEL ==========

async function processMoles(supabase: any) {
  try {
    // Get all active moles
    const { data: moles } = await supabase.from('gang_moles')
      .select('*').eq('status', 'active');

    if (!moles || moles.length === 0) return;

    for (const mole of moles) {
      // Calculate hours since planted
      const hoursSincePlanted = (Date.now() - new Date(mole.planted_at).getTime()) / (1000 * 60 * 60);
      
      // Generate intel every ~24 hours (check if last_intel_at is >20h ago or null)
      const hoursSinceLastIntel = mole.last_intel_at
        ? (Date.now() - new Date(mole.last_intel_at).getTime()) / (1000 * 60 * 60)
        : 999;

      if (hoursSinceLastIntel >= 20) {
        // Gather intel about target gang
        const { data: targetGang } = await supabase.from('gangs')
          .select('name, treasury, level, xp').eq('id', mole.target_gang_id).maybeSingle();
        
        const { data: wars } = await supabase.from('gang_wars')
          .select('attacker_gang_id, defender_gang_id, status, district_id')
          .or(`attacker_gang_id.eq.${mole.target_gang_id},defender_gang_id.eq.${mole.target_gang_id}`)
          .eq('status', 'active');

        const { data: territories } = await supabase.from('gang_territories')
          .select('district_id, defense_level').eq('gang_id', mole.target_gang_id);

        const { data: memberCount } = await supabase.from('gang_members')
          .select('id').eq('gang_id', mole.target_gang_id);

        const intelReport = {
          timestamp: new Date().toISOString(),
          treasury: targetGang?.treasury || 0,
          level: targetGang?.level || 1,
          memberCount: (memberCount || []).length,
          activeWars: (wars || []).length,
          warTargets: (wars || []).map((w: any) => w.district_id).filter(Boolean),
          territories: (territories || []).map((t: any) => ({ district: t.district_id, defense: t.defense_level })),
        };

        const existingReports = mole.intel_reports || [];
        existingReports.push(intelReport);

        // Keep last 10 reports
        const trimmedReports = existingReports.slice(-10);

        await supabase.from('gang_moles').update({
          intel_reports: trimmedReports,
          last_intel_at: new Date().toISOString(),
        }).eq('id', mole.id);
      }

      // Detection check: base 5% per tick, +2% per day active, +5% if target gang is at war
      let detectionChance = 5;
      const daysActive = hoursSincePlanted / 24;
      detectionChance += Math.floor(daysActive * 2);

      // Lower cover = higher detection
      detectionChance += Math.floor((100 - mole.cover_strength) / 10);

      // Target gang activity increases detection
      const { data: activeWars } = await supabase.from('gang_wars')
        .select('id')
        .or(`attacker_gang_id.eq.${mole.target_gang_id},defender_gang_id.eq.${mole.target_gang_id}`)
        .eq('status', 'active');
      if ((activeWars || []).length > 0) detectionChance += 5;

      // Cap at 40%
      detectionChance = Math.min(40, detectionChance);

      // Roll for detection
      if (Math.random() * 100 < detectionChance) {
        // MOL ONTDEKT!
        const { data: targetGang } = await supabase.from('gangs')
          .select('name, leader_id').eq('id', mole.target_gang_id).maybeSingle();
        const { data: playerProfile } = await supabase.from('profiles')
          .select('username').eq('id', mole.player_id).maybeSingle();

        await supabase.from('gang_moles').update({
          status: 'discovered',
          discovered_at: new Date().toISOString(),
          discovery_consequence: 'bounty',
          cover_strength: 0,
        }).eq('id', mole.id);

        // Place automatic bounty
        await supabase.from('player_bounties').insert({
          placer_id: targetGang?.leader_id || mole.target_gang_id,
          target_id: mole.player_id,
          amount: 5000,
          reason: 'Ontmaskerde mol/spion',
          status: 'active',
        });

        // News event
        await supabase.from('news_events').insert({
          text: `SPIONAGE ONTDEKT: ${targetGang?.name || 'Een gang'} heeft een mol ontmaskerd!`,
          icon: '🕵️',
          urgency: 'high',
          category: 'gang',
          detail: `Een infiltrant van een rivaliserende gang is betrapt. Er is een bounty geplaatst.`,
          expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        });

        // Send message to the mole player
        await supabase.from('player_messages').insert({
          sender_id: targetGang?.leader_id || mole.player_id,
          receiver_id: mole.player_id,
          subject: '⚠️ Je mol is ontdekt!',
          body: `Je mol bij ${targetGang?.name || 'een gang'} is ontmaskerd! Er is een bounty van €5.000 op je hoofd geplaatst. Pas op!`,
        });
      } else {
        // Gradually lower cover strength
        const newCover = Math.max(10, mole.cover_strength - Math.floor(Math.random() * 3 + 1));
        if (newCover !== mole.cover_strength) {
          await supabase.from('gang_moles').update({ cover_strength: newCover }).eq('id', mole.id);
        }
      }
    }
  } catch (e) {
    console.error('Mole processing error:', e);
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

    // ========== WEEKLY EVENT: 2x XP Weekend + Faction Modifiers ==========
    const currentDay = isDawn ? ws.world_day + 1 : ws.world_day;
    const dayInWeek = ((currentDay - 1) % 7) + 1; // 1-7 cycle
    let activeEvent = ws.active_event;

    if (isDawn) {
      if (dayInWeek === 6) {
        activeEvent = {
          id: '2x_xp_weekend',
          name: '⚡ 2x XP Weekend',
          desc: 'Alle XP-verdiensten zijn verdubbeld dit weekend!',
          xp_multiplier: 2,
          started_day: currentDay,
          ends_day: currentDay + 2,
        };
      } else if (dayInWeek === 1 && activeEvent?.id === '2x_xp_weekend') {
        activeEvent = null;
      }

      // === WEEKLY FACTION MODIFIERS: rotate every 7 days ===
      if (dayInWeek === 1) {
        await applyWeeklyFactionModifiers(supabase, currentDay);
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

    // ========== GENERATE DAILY DIGESTS ==========
      await generateDailyDigests(supabase, ws.world_day, update.current_weather);

      // ========== FACTION BOSS RESET (48h timer) ==========
      await resetConqueredFactions(supabase);
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

    // ========== SERVER-DRIVEN DISTRICT EVENTS ==========
    // Generate 1-2 interactive events per phase for random districts
    await generateServerDistrictEvents(supabase, nextPhase, currentWeather, resolvedDay);
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
    const resolvedDay = update.world_day || ws.world_day;
    await generateAndInsertNews(supabase, nextPhase, currentWeather, resolvedDay);

    // ========== PROCESS MOLES (INTEL & DETECTION) ==========
    await processMoles(supabase);

    // ========== RESTED XP ACCUMULATION ==========
    // Give offline players rested XP (25 XP/hour base, max 5000)
    try {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      await supabase.rpc('execute_sql', {}).catch(() => {}); // no-op fallback
      // Update all players who haven't been active in 30+ min
      const { data: offlinePlayers } = await supabase.from('player_state')
        .select('user_id, rested_xp, last_action_at')
        .lt('last_action_at', thirtyMinAgo)
        .lt('rested_xp', 5000)
        .limit(200);
      if (offlinePlayers && offlinePlayers.length > 0) {
        for (const p of offlinePlayers) {
          const hoursOffline = Math.min(24, (Date.now() - new Date(p.last_action_at).getTime()) / 3600000);
          const gain = Math.floor(25 * Math.min(hoursOffline, 0.5)); // per tick (30 min = 0.5 hour)
          if (gain > 0) {
            const newRested = Math.min(5000, (p.rested_xp || 0) + gain);
            await supabase.from('player_state').update({ rested_xp: newRested }).eq('user_id', p.user_id);
          }
        }
      }
    } catch (e) { console.error('Rested XP error:', e); }

    // ========== SIMULATE BOT ACTIVITY ==========
    await simulateBots(supabase, nextPhase, resolvedDay);

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
