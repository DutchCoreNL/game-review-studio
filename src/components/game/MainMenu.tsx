import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Settings, BookOpen, Users, Volume2, VolumeX, Wifi, WifiOff, LogOut, Zap, Skull } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import menuBg from '@/assets/main-menu-bg.jpg';

interface MainMenuProps {
  hasSave: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onHardcoreStart?: () => void;
  isLoggedIn?: boolean;
  username?: string;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
}

const CREDITS = [
  { role: 'Game Design & Development', name: 'Noxhaven Studio' },
  { role: 'Art Direction', name: 'Lovable AI' },
  { role: 'Sound Design', name: 'Procedural Audio Engine' },
  { role: 'Narrative', name: 'Noxhaven Writers Room' },
];

const HOW_TO_PLAY = [
  { title: 'Handelen', desc: 'Koop laag, verkoop hoog. Elk district heeft andere prijzen.' },
  { title: 'Missies', desc: 'Solo operaties en contracten leveren geld, XP en reputatie op.' },
  { title: 'Crew', desc: 'Rekruteer specialisten: Chauffeurs, Enforcers, Hackers en Smokkelaars.' },
  { title: 'Imperium', desc: 'Koop districten, bouw bedrijven, en verdedig je territorium.' },
  { title: 'Heat', desc: 'Criminele activiteit trekt politie-aandacht. Beheer je heat of ga onderduiken.' },
  { title: 'Villa', desc: 'Bouw een villa met labs, kluizen en verdedigingswerken.' },
  { title: 'Einddoel', desc: 'Versla alle facties en word de onbetwiste heerser van Noxhaven.' },
];

type SubScreen = 'settings' | 'credits' | 'howto' | null;

export function MainMenu({ hasSave, onNewGame, onContinue, onHardcoreStart, isLoggedIn, onLoginClick, onLogoutClick }: MainMenuProps) {
  const [show, setShow] = useState(false);
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [confirmHardcore, setConfirmHardcore] = useState(false);
  const [muted, setMuted] = useState(false);
  const [nickname, setNickname] = useState('');
  const [nickError, setNickError] = useState('');
  const [nickLoading, setNickLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleNewGame = () => {
    if (hasSave && !confirmNew) {
      setConfirmNew(true);
      return;
    }
    onNewGame();
  };

  const handleQuickNewGame = async () => {
    if (!nickname.trim() || nickname.trim().length < 3) {
      setNickError('Nickname moet minimaal 3 tekens zijn');
      return;
    }
    if (nickname.trim().length > 20) {
      setNickError('Nickname mag maximaal 20 tekens zijn');
      return;
    }
    setNickLoading(true);
    setNickError('');

    const { data, error: anonError } = await supabase.auth.signInAnonymously();
    if (anonError) {
      setNickError(anonError.message);
      setNickLoading(false);
      return;
    }
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, username: nickname.trim() });
      if (profileError) {
        setNickError(profileError.message.includes('duplicate') ? 'Nickname is al bezet' : profileError.message);
        setNickLoading(false);
        return;
      }
    }
    setNickLoading(false);
    onNewGame();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={menuBg}
          alt=""
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />
      </div>

      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="w-full h-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }} />
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {subScreen === null ? (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-[400px] w-full"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={show ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb--2"
            >
              <img src="/icon-192.png" alt="Noxhaven" className="w-24 h-24 mx-auto rounded-2xl shadow-2xl glow-gold" />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={show ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center -mt-2"
            >
              <h1 className="font-display text-5xl sm:text-6xl font-black tracking-wider text-foreground gold-text-glow">
                NOXHAVEN
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={show ? { opacity: 1 } : {}}
                transition={{ delay: 1.2 }}
                className="mt-2 text-xs tracking-[0.3em] uppercase text-muted-foreground font-ui"
              >
                Elke nacht heeft zijn prijs
              </motion.p>
            </motion.div>

            {/* Menu Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={show ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="flex flex-col gap-3 w-full"
            >
              {hasSave && (
                <MenuButton
                  icon={<Play size={18} />}
                  label="DOORGAAN"
                  accent
                  onClick={onContinue}
                />
              )}

              {/* Nickname input for non-logged-in users */}
              {!isLoggedIn && !hasSave && (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Kies je nickname (min. 3 tekens)"
                    value={nickname}
                    onChange={e => { setNickname(e.target.value); setNickError(''); }}
                    className="w-full px-4 py-3 rounded border border-border bg-card/80 text-sm font-ui text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50"
                  />
                  {nickError && <p className="text-xs text-blood font-ui">{nickError}</p>}
                </div>
              )}

              {confirmNew ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-center text-blood font-ui">
                    Je bestaande save wordt overschreven. Weet je het zeker?
                  </p>
                  <div className="flex gap-2">
                    <MenuButton
                      icon={<Play size={16} />}
                      label="JA, NIEUW SPEL"
                      accent
                      onClick={isLoggedIn ? onNewGame : handleQuickNewGame}
                      className="flex-1"
                    />
                    <MenuButton
                      icon={<RotateCcw size={16} />}
                      label="ANNULEER"
                      onClick={() => setConfirmNew(false)}
                      className="flex-1"
                    />
                  </div>
                </div>
              ) : (
                <MenuButton
                  icon={isLoggedIn ? <Play size={18} /> : <Zap size={18} />}
                  label={nickLoading ? 'LADEN...' : 'NIEUW SPEL'}
                  accent={!hasSave}
                  onClick={isLoggedIn ? handleNewGame : (hasSave ? handleNewGame : handleQuickNewGame)}
                />
              )}

              {/* Hardcore Mode */}
              {!confirmHardcore ? (
                <MenuButton
                  icon={<Skull size={18} />}
                  label="HARDCORE MODE"
                  onClick={() => setConfirmHardcore(true)}
                  className="!border-blood/50 !text-blood hover:!bg-blood/10"
                />
              ) : (
                <div className="flex flex-col gap-2 p-3 rounded border border-blood/50 bg-blood/5">
                  <p className="text-xs text-center text-blood font-ui font-bold">
                    ☠️ HARDCORE MODE
                  </p>
                  <p className="text-[0.6rem] text-muted-foreground text-center">
                    Eén leven. Geen Last Stand. Geen tweede kans. +50% beloningen.
                  </p>
                  <div className="flex gap-2">
                    <MenuButton
                      icon={<Skull size={16} />}
                      label="START HARDCORE"
                      accent
                      onClick={() => onHardcoreStart?.()}
                      className="flex-1 !border-blood/50 !bg-blood/10 !text-blood"
                    />
                    <MenuButton
                      icon={<RotateCcw size={16} />}
                      label="ANNULEER"
                      onClick={() => setConfirmHardcore(false)}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}

              <div className="h-px bg-border/50 my-1" />

              <MenuButton
                icon={<BookOpen size={18} />}
                label="HOE TE SPELEN"
                onClick={() => setSubScreen('howto')}
              />
              <MenuButton
                icon={<Settings size={18} />}
                label="INSTELLINGEN"
                onClick={() => setSubScreen('settings')}
              />
              <MenuButton
                icon={<Users size={18} />}
                label="CREDITS"
                onClick={() => setSubScreen('credits')}
              />

              <div className="h-px bg-border/50 my-1" />

              {isLoggedIn ? (
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded border border-emerald/30 bg-emerald/5 text-emerald text-xs font-ui font-semibold">
                    <Wifi size={14} /> ONLINE
                  </div>
                  <MenuButton
                    icon={<LogOut size={16} />}
                    label="UITLOGGEN"
                    onClick={() => onLogoutClick?.()}
                    className="flex-1"
                  />
                </div>
              ) : (
                <MenuButton
                  icon={<WifiOff size={18} />}
                  label="INLOGGEN / REGISTREREN"
                  onClick={() => onLoginClick?.()}
                />
              )}
            </motion.div>

            {/* Version */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={show ? { opacity: 0.3 } : {}}
              transition={{ delay: 1.5 }}
              className="text-[0.6rem] text-muted-foreground font-ui tracking-widest"
            >
              v1.0 — 2026
            </motion.p>
          </motion.div>
        ) : subScreen === 'howto' ? (
          <SubPanel key="howto" title="HOE TE SPELEN" onBack={() => setSubScreen(null)}>
            <div className="flex flex-col gap-3">
              {HOW_TO_PLAY.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="game-card"
                >
                  <h3 className="text-xs font-bold text-gold font-display tracking-wide">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </SubPanel>
        ) : subScreen === 'settings' ? (
          <SubPanel key="settings" title="INSTELLINGEN" onBack={() => setSubScreen(null)}>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setMuted(!muted)}
                className="game-card-interactive flex items-center gap-3"
              >
                {muted ? <VolumeX size={18} className="text-blood" /> : <Volume2 size={18} className="text-emerald" />}
                <span className="text-sm font-ui">{muted ? 'Geluid uit' : 'Geluid aan'}</span>
              </button>
              <p className="text-[0.65rem] text-muted-foreground">
                Meer audio-instellingen zijn beschikbaar in het PROFIEL-tabblad in het spel.
              </p>
            </div>
          </SubPanel>
        ) : subScreen === 'credits' ? (
          <SubPanel key="credits" title="CREDITS" onBack={() => setSubScreen(null)}>
            <div className="flex flex-col gap-4">
              {CREDITS.map((c, i) => (
                <motion.div
                  key={c.role}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <p className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">{c.role}</p>
                  <p className="text-sm font-display text-gold mt-0.5">{c.name}</p>
                </motion.div>
              ))}
            </div>
          </SubPanel>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MenuButton({ icon, label, accent, onClick, className }: {
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center gap-3 px-5 py-3 rounded border transition-all duration-200 font-ui text-sm font-semibold tracking-wider ${
        accent
          ? 'border-gold/50 bg-gold/10 text-gold hover:bg-gold/20 glow-gold'
          : 'border-border bg-card/80 text-foreground hover:border-muted-foreground/40 hover:bg-muted/30'
      } ${className || ''}`}
    >
      {icon}
      {label}
    </motion.button>
  );
}

function SubPanel({ title, children, onBack }: {
  title: string;
  children: React.ReactNode;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 flex flex-col gap-4 px-6 max-w-[400px] w-full max-h-[70vh]"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Terug
        </button>
        <h2 className="font-display text-lg font-bold tracking-wider text-gold">{title}</h2>
      </div>
      <div className="overflow-y-auto game-scroll pr-1">
        {children}
      </div>
    </motion.div>
  );
}
