import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  channel: string;
  message: string;
  created_at: string;
}

export type ChatChannel = 'global' | 'trade' | 'gang' | 'district';

export function useChat(channel: ChatChannel) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(channel);
  channelRef.current = channel;

  // Fetch recent messages
  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('channel', channel)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setMessages((data as unknown as ChatMessage[]).reverse());
    setLoading(false);
  }, [channel]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    const sub = supabase
      .channel(`chat-${channel}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel=eq.${channel}`,
        },
        (payload) => {
          const msg = payload.new as unknown as ChatMessage;
          if (msg.channel === channelRef.current) {
            setMessages(prev => [...prev.slice(-99), msg]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [channel]);

  const sendMessage = useCallback(async (text: string, username: string) => {
    if (!user || !text.trim()) return;
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      username,
      channel,
      message: text.trim().slice(0, 500),
    } as any);
  }, [user, channel]);

  return { messages, loading, sendMessage };
}
