import { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from '@/contexts/GameContext';
import { generateBotChatLine, seedBotChat, type ChatChannel, type ChatLine } from '@/game/world/chatter';

export type { ChatChannel } from '@/game/world/chatter';
export type ChatMessage = ChatLine;

/**
 * Local chat: ambient bot chatter generated from the world population, plus the player's own
 * messages. No backend — the channel fills itself with believable underworld talk.
 */
export function useChat(channel: ChatChannel) {
  const { state } = useGame();
  const worldRef = useRef(state.world);
  worldRef.current = state.world;
  const [messages, setMessages] = useState<ChatMessage[]>(() => seedBotChat(state.world, channel));
  const [loading] = useState(false);

  // Reseed when switching channels.
  useEffect(() => {
    setMessages(seedBotChat(worldRef.current, channel));
  }, [channel]);

  // Periodically drop in a new bot line so the channel feels alive.
  useEffect(() => {
    const interval = setInterval(() => {
      const line = generateBotChatLine(worldRef.current, channel);
      if (line) setMessages(prev => [...prev.slice(-99), line]);
    }, 12_000 + Math.random() * 12_000);
    return () => clearInterval(interval);
  }, [channel]);

  const sendMessage = useCallback(async (text: string, username: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages(prev => [...prev.slice(-99), {
      id: `chat_me_${Date.now()}`,
      user_id: 'player',
      username,
      channel,
      message: trimmed.slice(0, 500),
      created_at: new Date().toISOString(),
    }]);
  }, [channel]);

  return { messages, loading, sendMessage };
}
