import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, Link, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LinkAccountPanel() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isAnonymous = user?.is_anonymous === true;
  if (!isAnonymous) return null;

  const handleLink = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Vul zowel email als wachtwoord in');
      return;
    }
    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens zijn');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email: email.trim(),
        password: password.trim(),
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
      }
    } catch (e: any) {
      setError(e.message || 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="game-card border-gold/30 border">
      <div className="flex items-center gap-2 mb-3">
        <Link size={16} className="text-gold" />
        <h3 className="font-display text-sm font-bold text-gold">Account Koppelen</h3>
      </div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-emerald text-xs"
          >
            <CheckCircle size={14} />
            <span>Account gekoppeld! Bevestig je email om in te loggen met email/wachtwoord.</span>
          </motion.div>
        ) : (
          <motion.div key="form" className="space-y-2">
            <p className="text-[0.6rem] text-muted-foreground">
              Je speelt nu anoniem. Koppel een email en wachtwoord zodat je later weer kunt inloggen en je voortgang niet verliest.
            </p>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="w-full pl-9 pr-3 py-2 rounded border border-border bg-card/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50"
              />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="Wachtwoord (min. 6 tekens)"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="w-full pl-9 pr-3 py-2 rounded border border-border bg-card/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50"
              />
            </div>
            {error && <p className="text-[0.6rem] text-blood">{error}</p>}
            <button
              onClick={handleLink}
              disabled={loading}
              className="w-full py-2 rounded text-xs font-bold bg-gold text-secondary-foreground hover:bg-gold/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'BEZIG...' : 'KOPPEL ACCOUNT'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
