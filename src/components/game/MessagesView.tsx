import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MailOpen, Send, Trash2, Inbox, SendHorizonal, ArrowLeft, Loader2, RefreshCw, User } from 'lucide-react';
import { gameApi } from '@/lib/gameApi';
import { GameButton } from './ui/GameButton';
import { ViewWrapper } from './ui/ViewWrapper';
import { SubTabBar } from './ui/SubTabBar';
import { PlayerDetailPopup } from './PlayerDetailPopup';
import profileBg from '@/assets/profile-bg.jpg';

interface Message {
  id: string;
  otherUserId: string;
  otherUsername: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
}

type Folder = 'inbox' | 'sent';

export function MessagesView() {
  const [folder, setFolder] = useState<Folder>('inbox');
  const [messages, setMessages] = useState<Message[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [composing, setComposing] = useState(false);
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);

  // Compose state
  const [toUsername, setToUsername] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const res = await gameApi.getMessages(folder);
    if (res.success && res.data) {
      setMessages(res.data.messages as Message[]);
      setUnread(res.data.unread as number);
    }
    setLoading(false);
  }, [folder]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleRead = async (msg: Message) => {
    setSelectedMsg(msg);
    if (!msg.read && folder === 'inbox') {
      await gameApi.readMessage(msg.id);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
      setUnread(prev => Math.max(0, prev - 1));
    }
  };

  const handleDelete = async (id: string) => {
    await gameApi.deleteMessage(id);
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selectedMsg?.id === id) setSelectedMsg(null);
  };

  const startReply = (msg: Message) => {
    setToUserId(msg.otherUserId);
    setToUsername(msg.otherUsername);
    setSubject(msg.subject.startsWith('Re: ') ? msg.subject : `Re: ${msg.subject}`);
    setBody('');
    setComposing(true);
    setSelectedMsg(null);
  };

  const startCompose = (targetUserId?: string, targetUsername?: string) => {
    setToUserId(targetUserId || '');
    setToUsername(targetUsername || '');
    setSubject('');
    setBody('');
    setSendError('');
    setComposing(true);
    setSelectedMsg(null);
  };

  const handleSend = async () => {
    if (!toUserId) { setSendError('Selecteer een ontvanger.'); return; }
    if (!body.trim()) { setSendError('Bericht mag niet leeg zijn.'); return; }
    setSending(true);
    setSendError('');
    const res = await gameApi.sendMessage(toUserId, subject, body);
    setSending(false);
    if (res.success) {
      setComposing(false);
      setFolder('sent');
      fetchMessages();
    } else {
      setSendError(res.message);
    }
  };

  const tabs = [
    { id: 'inbox' as Folder, label: 'Inbox', icon: <Inbox size={10} />, badge: unread > 0 ? unread : undefined },
    { id: 'sent' as Folder, label: 'Verstuurd', icon: <SendHorizonal size={10} /> },
  ];

  // Compose view
  if (composing) {
    return (
      <ViewWrapper bg={profileBg}>
        <button onClick={() => setComposing(false)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft size={12} /> Terug
        </button>

        <h2 className="font-display text-sm text-gold uppercase tracking-widest mb-3">Nieuw Bericht</h2>

        <div className="space-y-3">
          <div>
            <label className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">Aan</label>
            <div className="bg-muted/30 border border-border rounded px-2 py-1.5 text-xs">
              {toUsername || <span className="text-muted-foreground">Kies een speler vanuit PvP of Leaderboard</span>}
            </div>
          </div>

          <div>
            <label className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">Onderwerp</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              maxLength={100}
              placeholder="Optioneel..."
              className="w-full bg-muted/30 border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gold/50"
            />
          </div>

          <div>
            <label className="text-[0.5rem] text-muted-foreground uppercase tracking-wider">Bericht</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              maxLength={500}
              rows={5}
              placeholder="Typ je bericht..."
              className="w-full bg-muted/30 border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gold/50 resize-none"
            />
            <span className="text-[0.4rem] text-muted-foreground">{body.length}/500</span>
          </div>

          {sendError && <p className="text-[0.5rem] text-blood">{sendError}</p>}

          <GameButton onClick={handleSend} disabled={sending} variant="gold" size="sm" className="w-full">
            {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Verstuur
          </GameButton>
        </div>
      </ViewWrapper>
    );
  }

  // Detail view
  if (selectedMsg) {
    return (
      <ViewWrapper bg={profileBg}>
        <button onClick={() => setSelectedMsg(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft size={12} /> Terug
        </button>

        <div className="game-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setViewProfileId(selectedMsg.otherUserId)}
              className="text-xs font-bold text-gold hover:underline flex items-center gap-1"
            >
              <User size={10} />
              {selectedMsg.otherUsername}
            </button>
            <span className="text-[0.4rem] text-muted-foreground">
              {new Date(selectedMsg.createdAt).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {selectedMsg.subject && (
            <p className="text-[0.6rem] font-bold">{selectedMsg.subject}</p>
          )}

          <p className="text-[0.55rem] leading-relaxed text-foreground whitespace-pre-wrap">{selectedMsg.body}</p>

          <div className="flex gap-2 pt-2">
            {folder === 'inbox' && (
              <GameButton onClick={() => startReply(selectedMsg)} variant="gold" size="sm">
                <Send size={10} /> Beantwoord
              </GameButton>
            )}
            <GameButton onClick={() => handleDelete(selectedMsg.id)} variant="blood" size="sm">
              <Trash2 size={10} /> Verwijder
            </GameButton>
          </div>
        </div>

        {viewProfileId && (
          <PlayerDetailPopup userId={viewProfileId} onClose={() => setViewProfileId(null)} />
        )}
      </ViewWrapper>
    );
  }

  // Message list
  return (
    <ViewWrapper bg={profileBg}>
      <div className="flex items-center justify-between mb-3">
        <SubTabBar
          tabs={tabs}
          active={folder}
          onChange={(t) => setFolder(t as Folder)}
        />
        <div className="flex gap-1">
          <GameButton onClick={() => fetchMessages()} variant="muted" size="sm">
            <RefreshCw size={10} />
          </GameButton>
          <GameButton onClick={() => startCompose()} variant="gold" size="sm">
            <Send size={10} /> Nieuw
          </GameButton>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-gold" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-8">
          <Mail size={24} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            {folder === 'inbox' ? 'Geen berichten ontvangen.' : 'Geen berichten verstuurd.'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {messages.map(msg => (
              <motion.button
                key={msg.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                onClick={() => handleRead(msg)}
                className={`w-full text-left p-2.5 rounded border transition-all ${
                  !msg.read && folder === 'inbox'
                    ? 'bg-gold/5 border-gold/30'
                    : 'bg-muted/20 border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[0.55rem] font-bold truncate max-w-[60%]">
                    {folder === 'inbox' ? `Van: ${msg.otherUsername}` : `Aan: ${msg.otherUsername}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[0.4rem] text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' })}
                    </span>
                    {!msg.read && folder === 'inbox' ? (
                      <Mail size={8} className="text-gold" />
                    ) : (
                      <MailOpen size={8} className="text-muted-foreground" />
                    )}
                  </div>
                </div>
                {msg.subject && <p className="text-[0.5rem] font-semibold truncate">{msg.subject}</p>}
                <p className="text-[0.45rem] text-muted-foreground truncate">{msg.body}</p>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {viewProfileId && (
        <PlayerDetailPopup userId={viewProfileId} onClose={() => setViewProfileId(null)} />
      )}
    </ViewWrapper>
  );
}
