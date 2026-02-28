import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Loader2, Clock, CheckCircle, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { GameButton } from '../ui/GameButton';
import { SectionHeader } from '../ui/SectionHeader';

interface StoryChoice {
  id: string;
  label: string;
  desc: string;
  reward: { money: number; rep: number; karma: number; heat: number; xp: number };
}

interface StoryEvent {
  id: string;
  story_title: string;
  story_text: string;
  choices: StoryChoice[];
  chosen_option: string | null;
  reward_data: any;
  status: string;
  created_at: string;
}

export function AIStoryPanel() {
  const [stories, setStories] = useState<StoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [choosing, setChoosing] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchStories = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('personal_story_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    setStories((data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const generateStory = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-story');
      if (error) throw error;
      if (data?.success) {
        showMsg('Nieuw verhaal gegenereerd!');
        fetchStories();
      } else {
        showMsg(data?.message || 'Fout bij genereren.');
      }
    } catch (e: any) {
      showMsg(e.message || 'Fout bij genereren.');
    }
    setGenerating(false);
  };

  const makeChoice = async (storyId: string, choice: StoryChoice) => {
    setChoosing(storyId);
    try {
      // Apply rewards directly via game-action
      const { data: gameResult } = await supabase.functions.invoke('game-action', {
        body: {
          action: 'resolve_story',
          payload: { storyId, choiceId: choice.id },
        },
      });

      if (gameResult?.success) {
        showMsg(gameResult.message || 'Keuze gemaakt!');
        fetchStories();
      } else {
        showMsg(gameResult?.message || 'Fout bij keuze.');
      }
    } catch (e: any) {
      showMsg(e.message || 'Fout.');
    }
    setChoosing(null);
  };

  const pendingStory = stories.find(s => s.status === 'pending');
  const pastStories = stories.filter(s => s.status !== 'pending');

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] bg-background border border-gold/40 rounded px-3 py-1.5 text-xs text-gold shadow-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <SectionHeader title="AI Verhaallijn" icon={<Sparkles size={12} />} badge="✨ Uniek" badgeColor="gold" />

      <p className="text-[0.55rem] text-muted-foreground">
        Ontvang gepersonaliseerde verhaalevenementen gebaseerd op jouw spelgeschiedenis, keuzes en reputatie.
      </p>

      {/* Generate button */}
      {!pendingStory && (
        <GameButton onClick={generateStory} disabled={generating} variant="gold" size="sm" fullWidth>
          {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {generating ? 'Verhaal wordt gegenereerd...' : 'Genereer Nieuw Verhaal'}
        </GameButton>
      )}

      {/* Pending story */}
      {pendingStory && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="game-card border-gold/30 space-y-3"
        >
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-gold" />
            <h3 className="font-display text-sm text-gold uppercase tracking-wider">{pendingStory.story_title}</h3>
          </div>

          <p className="text-xs text-foreground/90 leading-relaxed">{pendingStory.story_text}</p>

          <div className="space-y-2">
            <span className="text-[0.5rem] text-muted-foreground uppercase tracking-wider font-bold">Kies je pad:</span>
            {(pendingStory.choices as StoryChoice[]).map((choice) => (
              <motion.button
                key={choice.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => makeChoice(pendingStory.id, choice)}
                disabled={choosing === pendingStory.id}
                className="w-full text-left game-card hover:border-gold/40 transition-colors p-2 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gold">{choice.label}</span>
                  {choosing === pendingStory.id && <Loader2 size={10} className="animate-spin text-gold" />}
                </div>
                <p className="text-[0.5rem] text-muted-foreground">{choice.desc}</p>
                <div className="flex gap-2 text-[0.45rem] flex-wrap">
                  {choice.reward.money !== 0 && (
                    <span className={choice.reward.money > 0 ? 'text-emerald-400' : 'text-blood'}>
                      {choice.reward.money > 0 ? '+' : ''}€{choice.reward.money.toLocaleString()}
                    </span>
                  )}
                  {choice.reward.rep !== 0 && (
                    <span className={choice.reward.rep > 0 ? 'text-gold' : 'text-blood'}>
                      {choice.reward.rep > 0 ? '+' : ''}{choice.reward.rep} rep
                    </span>
                  )}
                  {choice.reward.karma !== 0 && (
                    <span className={choice.reward.karma > 0 ? 'text-blue-400' : 'text-blood'}>
                      {choice.reward.karma > 0 ? '+' : ''}{choice.reward.karma} karma
                    </span>
                  )}
                  {choice.reward.heat > 0 && <span className="text-orange-400">+{choice.reward.heat} heat</span>}
                  {choice.reward.xp > 0 && <span className="text-purple-400">+{choice.reward.xp} XP</span>}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Past stories */}
      {pastStories.length > 0 && (
        <div>
          <SectionHeader title="Verhaalgeschiedenis" icon={<Clock size={12} />} badge={`${pastStories.length}`} badgeColor="purple" />
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {pastStories.map(story => (
              <div key={story.id} className="game-card opacity-70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{story.story_title}</span>
                  <CheckCircle size={10} className="text-emerald-400" />
                </div>
                <p className="text-[0.45rem] text-muted-foreground mt-1 line-clamp-2">{story.story_text}</p>
                {story.chosen_option && (
                  <div className="mt-1 flex items-center gap-1">
                    <Gift size={8} className="text-gold" />
                    <span className="text-[0.45rem] text-gold">
                      Keuze: {(story.choices as StoryChoice[]).find(c => c.id === story.chosen_option)?.label || story.chosen_option}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-gold" /></div>}
    </div>
  );
}
