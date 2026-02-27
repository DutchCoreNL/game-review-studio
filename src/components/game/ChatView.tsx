import { useState, useRef, useEffect } from 'react';
import { useChat, ChatChannel } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ViewWrapper } from './ui/ViewWrapper';
import { SectionHeader } from './ui/SectionHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Globe, TrendingUp, Users, MapPin } from 'lucide-react';

const CHANNELS: { id: ChatChannel; label: string; icon: React.ReactNode }[] = [
  { id: 'global', label: 'Global', icon: <Globe size={14} /> },
  { id: 'trade', label: 'Trade', icon: <TrendingUp size={14} /> },
  { id: 'gang', label: 'Gang', icon: <Users size={14} /> },
  { id: 'district', label: 'District', icon: <MapPin size={14} /> },
];

function MessageBubble({ msg, isOwn }: { msg: any; isOwn: boolean }) {
  const time = new Date(msg.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-1.5`}
    >
      <div className={`max-w-[80%] rounded-lg px-3 py-1.5 text-xs ${
        isOwn
          ? 'bg-primary/20 border border-primary/30 text-foreground'
          : 'bg-card border border-border text-foreground'
      }`}>
        {!isOwn && (
          <span className="text-[0.55rem] font-bold text-gold block mb-0.5">{msg.username}</span>
        )}
        <p className="break-words whitespace-pre-wrap">{msg.message}</p>
      </div>
      <span className="text-[0.45rem] text-muted-foreground mt-0.5 px-1">{time}</span>
    </motion.div>
  );
}

export function ChatView() {
  const { user } = useAuth();
  const [channel, setChannel] = useState<ChatChannel>('global');
  const { messages, loading, sendMessage } = useChat(channel);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [username, setUsername] = useState('Speler');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('username').eq('id', user.id).single()
      .then(({ data }) => { if (data?.username) setUsername(data.username); });
  }, [user]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await sendMessage(input, username);
    setInput('');
    setSending(false);
  };

  return (
    <ViewWrapper>
      <SectionHeader title="Chat" />

      {/* Channel tabs */}
      <div className="flex gap-1 mb-3 bg-card rounded-lg border border-border p-1">
        {CHANNELS.map(ch => (
          <button
            key={ch.id}
            onClick={() => setChannel(ch.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[0.6rem] font-bold uppercase tracking-wider transition-all ${
              channel === ch.id
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {ch.icon} {ch.label}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-border bg-background/50 p-3 mb-3"
        style={{ height: 'calc(100vh - 320px)', maxHeight: '500px' }}
      >
        {loading ? (
          <p className="text-center text-muted-foreground text-xs py-8">Laden...</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-xs">Geen berichten in #{channel}</p>
            <p className="text-[0.55rem] text-muted-foreground mt-1">Wees de eerste!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwn={msg.user_id === user?.id}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={`Bericht in #${channel}...`}
          maxLength={500}
          className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="bg-primary/20 border border-primary/30 text-primary rounded-lg px-3 py-2 hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send size={16} />
        </button>
      </div>
    </ViewWrapper>
  );
}
