import { useState } from 'react';
import { BACKSTORIES, type BackstoryDef } from '@/game/backstory';
import { useLanguage } from '@/contexts/LanguageContext';
import { getGameText } from '@/i18n/gameData';
import { TypewriterText } from './animations/TypewriterText';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Zap, Brain, Heart } from 'lucide-react';
import { BACKSTORY_IMAGES } from '@/assets/items';

const STAT_ICONS: Record<string, React.ReactNode> = {
  muscle: <Zap size={14} className="text-blood" />,
  brains: <Brain size={14} className="text-ice" />,
  charm: <Heart size={14} className="text-gold" />,
};

interface BackstorySelectionProps {
  onSelect: (id: string) => void;
}

export function BackstorySelection({ onSelect }: BackstorySelectionProps) {
  const [selected, setSelected] = useState<BackstoryDef | null>(null);
  const [phase, setPhase] = useState<'intro' | 'choose' | 'confirm'>('intro');
  const { t, lang } = useLanguage();

  const STAT_NAMES: Record<string, string> = {
    muscle: t.profile.muscle,
    brains: t.profile.brains,
    charm: t.profile.charm,
  };

  const getBsText = (bs: BackstoryDef, field: string) => {
    return getGameText(lang, 'backstories', bs.id, field, (bs as any)[field] || '');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-background z-[10001] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-6">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }} className="text-4xl mb-2">🌃</motion.div>
              <h1 className="font-display text-xl text-foreground tracking-widest uppercase">Noxhaven</h1>
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <TypewriterText text={t.backstory.welcome} speed={30} className="text-xs text-muted-foreground leading-relaxed" onComplete={() => {}} />
              </div>
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} onClick={() => setPhase('choose')}
                className="px-6 py-2.5 rounded bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/30 transition-all">
                {t.backstory.choosePast} <ChevronRight size={12} className="inline ml-1" />
              </motion.button>
            </motion.div>
          )}

          {phase === 'choose' && !selected && (
            <motion.div key="choose" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-3">
              <h2 className="font-display text-sm text-center text-muted-foreground uppercase tracking-[0.2em] mb-4">{t.backstory.whoAreYou}</h2>
              {BACKSTORIES.map((bs, idx) => (
                <motion.button key={bs.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.15 }}
                  onClick={() => { setSelected(bs); setPhase('confirm'); }}
                  className={`w-full text-left rounded-lg border border-border bg-card overflow-hidden hover:border-${bs.color}/50 hover:bg-${bs.color}/5 transition-all active:scale-[0.98] group`}>
                  {BACKSTORY_IMAGES[bs.id] && (
                    <div className="relative h-20 overflow-hidden">
                      <img src={BACKSTORY_IMAGES[bs.id]} alt={getBsText(bs, 'name')} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{bs.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display text-xs text-foreground uppercase tracking-wider">{getBsText(bs, 'name')}</h3>
                          <div className="flex items-center gap-1">
                            {Object.entries(bs.statBonuses).map(([stat, val]) => (
                              <span key={stat} className="flex items-center gap-0.5 text-[0.5rem] text-muted-foreground">
                                {STAT_ICONS[stat]} +{val} {STAT_NAMES[stat]}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-[0.55rem] text-muted-foreground italic mt-0.5">{getBsText(bs, 'subtitle')}</p>
                        <p className="text-[0.6rem] text-muted-foreground mt-1">{getBsText(bs, 'desc')}</p>
                        <div className="mt-1.5 flex items-center gap-1.5 bg-primary/5 border border-primary/10 rounded px-2 py-1">
                          <span className="text-sm">{bs.mmoPerk.icon}</span>
                          <div>
                            <span className="text-[0.5rem] font-bold text-primary uppercase tracking-wider">{getBsText(bs, 'mmoPerkLabel') || bs.mmoPerk.label}</span>
                            <p className="text-[0.45rem] text-muted-foreground">{getBsText(bs, 'mmoPerkDesc') || bs.mmoPerk.desc}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {phase === 'confirm' && selected && (
            <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-border">
                {BACKSTORY_IMAGES[selected.id] && (
                  <div className="relative h-28 overflow-hidden">
                    <img src={BACKSTORY_IMAGES[selected.id]} alt={getBsText(selected, 'name')} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                    <div className="absolute bottom-2 left-0 right-0 text-center">
                      <span className="text-3xl">{selected.icon}</span>
                      <h2 className="font-display text-lg text-foreground uppercase tracking-widest mt-1">{getBsText(selected, 'name')}</h2>
                      <p className="text-[0.55rem] text-muted-foreground italic">{getBsText(selected, 'subtitle')}</p>
                    </div>
                  </div>
                )}
                {!BACKSTORY_IMAGES[selected.id] && (
                  <div className="text-center pt-4">
                    <span className="text-4xl">{selected.icon}</span>
                    <h2 className="font-display text-lg text-foreground uppercase tracking-widest mt-2">{getBsText(selected, 'name')}</h2>
                    <p className="text-[0.55rem] text-muted-foreground italic">{getBsText(selected, 'subtitle')}</p>
                  </div>
                )}
                <div className="p-3">
                  <div className="bg-muted/30 rounded-lg p-3 border border-border">
                    <TypewriterText text={getBsText(selected, 'longDesc')} speed={20} className="text-[0.6rem] leading-relaxed text-foreground" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selected.statBonuses).map(([stat, val]) => (
                  <div key={stat} className="bg-card rounded p-2 border border-border flex items-center gap-2">
                    {STAT_ICONS[stat]}
                    <div>
                      <span className="text-[0.55rem] text-muted-foreground">{STAT_NAMES[stat]}</span>
                      <span className="text-xs text-emerald font-bold ml-1">+{val}</span>
                    </div>
                  </div>
                ))}
                {selected.startBonuses.money && (
                  <div className="bg-card rounded p-2 border border-border flex items-center gap-2">
                    <span className="text-sm">💰</span>
                    <div>
                      <span className="text-[0.55rem] text-muted-foreground">{t.backstory.startingMoney}</span>
                      <span className="text-xs text-gold font-bold ml-1">+€{selected.startBonuses.money}</span>
                    </div>
                  </div>
                )}
                {selected.startBonuses.rep && (
                  <div className="bg-card rounded p-2 border border-border flex items-center gap-2">
                    <span className="text-sm">⭐</span>
                    <div>
                      <span className="text-[0.55rem] text-muted-foreground">{t.backstory.reputation}</span>
                      <span className="text-xs text-gold font-bold ml-1">+{selected.startBonuses.rep}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2.5">
                <span className="text-xl mt-0.5">{selected.mmoPerk.icon}</span>
                <div>
                  <span className="text-[0.6rem] font-bold text-primary uppercase tracking-wider">{t.profile.mmoPerk}: {getBsText(selected, 'mmoPerkLabel') || selected.mmoPerk.label}</span>
                  <p className="text-[0.55rem] text-muted-foreground mt-0.5">{getBsText(selected, 'mmoPerkDesc') || selected.mmoPerk.desc}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setSelected(null); setPhase('choose'); }}
                  className="flex-1 py-2 rounded border border-border text-muted-foreground text-[0.6rem] hover:bg-muted/30 transition-all">
                  {t.backstory.back}
                </button>
                <button onClick={() => onSelect(selected.id)}
                  className="flex-1 py-2 rounded bg-primary/20 border border-primary/30 text-primary text-[0.6rem] font-bold uppercase tracking-wider hover:bg-primary/30 transition-all">
                  {t.backstory.confirmChoice}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}