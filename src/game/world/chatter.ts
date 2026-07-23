import type { WorldSimState } from './types';

export type ChatChannel = 'global' | 'trade' | 'gang' | 'district';

export interface ChatLine {
  id: string;
  user_id: string;
  username: string;
  channel: string;
  message: string;
  created_at: string;
}

const GLOBAL_LINES = [
  'iemand interesse in een deal?',
  'wie heeft Crown Heights nog vrij?',
  'de politie is actief vanavond, let op je heat',
  'net level up, eindelijk 🎉',
  'die karteloorlog loopt uit de hand',
  'nieuwe lading net binnen, prijzen gaan zakken',
  'wie durft een duel?',
  'Neon Strip casino betaalt vanavond goed uit',
  'gang recruteert, DM me',
  'iemand die weet waar de beste smokkelroute is?',
  'respect voor wie de haven controleert',
  'ik ben clean, ff heat laten zakken',
];

const TRADE_LINES = [
  'WTS 10x Synthetica, scherpe prijs',
  'zoek Zware Wapens, betaal goed',
  'crypto wallets te koop, DM',
  'iemand die medische voorraad heeft?',
  'dumpprijs op geroofde kunst, snel zijn',
  'koop alles wat explosieven is',
  'ruil tech tegen luxury?',
];

const GANG_LINES = [
  'we vallen morgen aan, iedereen paraat',
  'goed werk team 💪',
  'wie neemt de nachtdienst op de grens?',
  'treasury ziet er goed uit deze week',
  'nieuwe rekruut, heet hem welkom',
  'rivalen zijn zwak nu, we slaan toe',
];

const DISTRICT_LINES = [
  'rustig in dit district vandaag',
  'veel activiteit hier, pas op',
  'iemand die dit district wil overnemen?',
  'de dealers hier betalen slecht',
  'goede plek om laag te liggen',
];

const LINES_BY_CHANNEL: Record<ChatChannel, string[]> = {
  global: GLOBAL_LINES,
  trade: TRADE_LINES,
  gang: GANG_LINES,
  district: DISTRICT_LINES,
};

/** Generates a single ambient bot chat line for the given channel, or null if the world is empty. */
export function generateBotChatLine(world: WorldSimState | undefined, channel: ChatChannel): ChatLine | null {
  if (!world || world.bots.length === 0) return null;
  const bot = world.bots[Math.floor(Math.random() * world.bots.length)];
  const pool = LINES_BY_CHANNEL[channel] || GLOBAL_LINES;
  const message = pool[Math.floor(Math.random() * pool.length)];
  return {
    id: `chat_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    user_id: bot.id,
    username: bot.name,
    channel,
    message,
    created_at: new Date().toISOString(),
  };
}

/** Seeds a short backlog of chat so the channel isn't empty on first open. */
export function seedBotChat(world: WorldSimState | undefined, channel: ChatChannel, count = 6): ChatLine[] {
  const lines: ChatLine[] = [];
  for (let i = 0; i < count; i++) {
    const line = generateBotChatLine(world, channel);
    if (line) {
      // Stagger timestamps into the recent past.
      line.created_at = new Date(Date.now() - (count - i) * 45_000).toISOString();
      line.id = `chat_seed_${channel}_${i}`;
      lines.push(line);
    }
  }
  return lines;
}
