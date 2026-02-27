import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { gameApi } from '@/lib/gameApi';
import { GameButton } from './ui/GameButton';

interface MessagesComposePopupProps {
  targetUserId: string;
  targetUsername: string;
  onClose: () => void;
  onSent?: () => void;
}

export function MessagesComposePopup({ targetUserId, targetUsername, onClose, onSent }: MessagesComposePopupProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!body.trim()) { setError('Bericht mag niet leeg zijn.'); return; }
    setSending(true);
    setError('');
    const res = await gameApi.sendMessage(targetUserId, subject, body);
    setSending(false);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => { onSent?.(); onClose(); }, 1200);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="game-card w-full max-w-[360px] border-gold/40 p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm text-gold uppercase tracking-widest">Bericht aan {targetUsername}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>

        {success ? (
          <p className="text-xs text-emerald text-center py-4">✅ Bericht verstuurd!</p>
        ) : (
          <div className="space-y-3">
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
                rows={4}
                placeholder="Typ je bericht..."
                className="w-full bg-muted/30 border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gold/50 resize-none"
              />
              <span className="text-[0.4rem] text-muted-foreground">{body.length}/500</span>
            </div>

            {error && <p className="text-[0.5rem] text-blood">{error}</p>}

            <GameButton onClick={handleSend} disabled={sending} variant="gold" size="sm" className="w-full">
              {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Verstuur
            </GameButton>
          </div>
        )}
      </motion.div>
    </div>
  );
}
