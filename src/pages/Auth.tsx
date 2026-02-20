import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import menuBg from '@/assets/main-menu-bg.jpg';

interface AuthProps {
  onBack: () => void;
  onAuth: () => void;
}

export function Auth({ onBack, onAuth }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else onAuth();
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!username.trim() || username.length < 3) {
      setError('Username moet minimaal 3 tekens zijn');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, username: username.trim() });

      if (profileError) {
        setError(profileError.message.includes('duplicate') ? 'Username is al bezet' : profileError.message);
        setLoading(false);
        return;
      }
    }

    setSuccess('Account aangemaakt! Check je email om te bevestigen.');
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') handleLogin();
    else handleRegister();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0">
        <img src={menuBg} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col gap-6 px-6 max-w-[380px] w-full"
      >
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors self-start">
          <ArrowLeft size={16} /> Terug
        </button>

        <div className="text-center">
          <h1 className="font-display text-3xl font-black tracking-wider text-foreground gold-text-glow">
            {mode === 'login' ? 'INLOGGEN' : 'REGISTREREN'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-ui">
            {mode === 'login' ? 'Log in om je score te synchroniseren' : 'Maak een account om mee te doen aan het leaderboard'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Username (min. 3 tekens)"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded border border-border bg-card/80 text-sm font-ui text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded border border-border bg-card/80 text-sm font-ui text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50"
          />
          <input
            type="password"
            placeholder="Wachtwoord"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded border border-border bg-card/80 text-sm font-ui text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50"
          />

          {error && <p className="text-xs text-blood font-ui">{error}</p>}
          {success && <p className="text-xs text-emerald font-ui">{success}</p>}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded border border-gold/50 bg-gold/10 text-gold font-ui text-sm font-semibold tracking-wider hover:bg-gold/20 glow-gold disabled:opacity-50"
          >
            {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
            {loading ? 'LADEN...' : mode === 'login' ? 'INLOGGEN' : 'REGISTREREN'}
          </motion.button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
          className="text-xs text-muted-foreground hover:text-gold transition-colors font-ui text-center"
        >
          {mode === 'login' ? 'Nog geen account? Registreer hier' : 'Al een account? Log hier in'}
        </button>
      </motion.div>
    </div>
  );
}
