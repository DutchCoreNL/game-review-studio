import { useState, useRef, useEffect } from 'react';
import { useChat, ChatChannel } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ViewWrapper } from './ui/ViewWrapper';
import { SectionHeader } from './ui/SectionHeader';
import { SkeletonCard } from './ui/SkeletonCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Globe, TrendingUp, Users, MapPin, MessageSquare } from 'lucide-react';
import chatBg from '@/assets/chat-bg.jpg';

const CHANNELS: { id: ChatChannel; label: string; icon: React.ReactNode }[] = [
  { id: 'global', label: 'Global', icon: <Globe size={14} /> },
  { id: 'trade', label: 'Trade', icon: <TrendingUp size={14} /> },
  { id: 'gang', label: 'Gang', icon: <Users size={14} /> },
  { id: 'district', label: 'District', icon: <MapPin size={14} /> },
];

function UserAvatar({ name }: { name: string }) {
  const letter = (name || '?')[0].toUpperCase();
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[0.55rem] font-bold shrink-0 border border-border"
      style={{ backgroundColor: `hsl(${hue}, 40%, 20%)`, color: `hsl(${hue}, 60%, 70%)` }}
    >
      {letter}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center px-3 py-2">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg, isOwn }: { msg: any; isOwn: boolean }) {
  const time = new Date(msg.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const isBot = msg.username === 'SYSTEM' || msg.username === 'Bot';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} mb-2`}
    >
      {!isOwn && <UserAvatar name={msg.username} />}
      <div className="flex flex-col max-w-[75%]">
        <div className={`rounded-lg px-3 py-1.5 text-xs ${
          isOwn
            ? 'bg-primary/20 border border-primary/30 text-foreground'
            : isBot
              ? 'bg-game-purple/10 border border-game-purple/30 text-foreground'
              : 'bg-card border border-border text-foreground'
        }`}>
          {!isOwn && (
            <span className={`text-[0.55rem] font-bold block mb-0.5 ${isBot ? 'text-game-purple' : 'text-gold'}`}>
              {msg.username}
            </span>
          )}
          <p className="break-words whitespace-pre-wrap">{msg.message}</p>
        </div>
        <span className={`text-[0.45rem] text-muted-foreground mt-0.5 px-1 ${isOwn ? 'text-right' : ''}`}>{time}</span>
      </div>
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
    <ViewWrapper bg={chatBg}>
      {/* Cinematic header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
          <MessageSquare size={18} className="text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg text-gold uppercase tracking-widest font-bold">Comms</h2>
          <p className="text-[0.55rem] text-muted-foreground">Versleuteld kanaal — Noxhaven Underground</p>
        </div>
      </div>

      <SectionHeader title="Kanalen" icon={<Globe size={12} />} />

      {/* Channel tabs */}
      <div className="flex gap-1 mb-3 bg-card/80 backdrop-blur-sm rounded-lg border border-border p-1">
        {CHANNELS.map(ch => (
          <button
            key={ch.id}
            onClick={() => setChannel(ch.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[0.6rem] font-bold uppercase tracking-wider transition-all ${
              channel === ch.id
                ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_8px_hsl(var(--primary)/0.15)]'
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
        className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-border bg-background/60 backdrop-blur-sm p-3 mb-3"
        style={{ height: 'calc(100vh - 340px)', maxHeight: '500px' }}
      >
        {loading ? (
          <div className="space-y-3 py-4">
            {[0, 1, 2, 3].map(i => <SkeletonCard key={i} variant="message" />)}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare size={32} className="mx-auto text-muted-foreground/30 mb-3" />
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
        {sending && <TypingIndicator />}
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
          className="flex-1 bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:shadow-[0_0_8px_hsl(var(--primary)/0.1)]"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="bg-primary/20 border border-primary/30 text-primary rounded-lg px-3 py-2 hover:bg-primary/30 hover:shadow-[0_0_12px_hsl(var(--primary)/0.2)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send size={16} />
        </button>
      </div>
    </ViewWrapper>
  );
}
