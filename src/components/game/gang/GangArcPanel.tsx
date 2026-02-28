import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Loader2, Users, Zap, CheckCircle, XCircle, Clock, Shield, Brain, Heart } from 'lucide-react';
import { gameApi } from '@/lib/gameApi';
import { useAuth } from '@/hooks/useAuth';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { SectionHeader } from '../ui/SectionHeader';
import { Progress } from '@/components/ui/progress';
import { GANG_ARCS, type GangArcTemplate } from '@/game/gangArcs';

const STAT_ICONS: Record<string, React.ReactNode> = {
  muscle: <Shield size={10} className="text-blood" />,
  brains: <Brain size={10} className="text-game-purple" />,
  charm: <Heart size={10} className="text-gold" />,
};

export function GangArcPanel({ gangLevel }: { gangLevel: number }) {
  const { user } = useAuth();
  const [activeArcs, setActiveArcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState('');

  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchArcs = useCallback(async () => {
    setLoading(true);
    const res = await gameApi.getGangArcs();
    if (res.success && res.data) setActiveArcs(res.data.arcs || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchArcs(); }, [fetchArcs]);

  const handleStart = async (arcId: string) => {
    setActing(true);
    const res = await gameApi.startGangArc(arcId);
    showMsg(res.message);
    if (res.success) fetchArcs();
    setActing(false);
  };

  const handleChoice = async (gangArcId: string, choiceId: string) => {
    setActing(true);
    const res = await gameApi.resolveGangArcStep(gangArcId, choiceId);
    showMsg(res.message);
    if (res.success) fetchArcs();
    setActing(false);
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-gold" /></div>;

  // Find available arcs that can be started
  const activeArcIds = activeArcs.filter(a => a.status === 'active').map(a => a.arc_id);
  const availableArcs = GANG_ARCS.filter(a => a.requiredGangLevel <= gangLevel && !activeArcIds.includes(a.id));

  return (
    <div>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] bg-background border border-gold/40 rounded px-3 py-1.5 text-xs text-gold shadow-lg">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <SectionHeader title="Gang Missies" icon={<BookOpen size={12} />} badge="CO-OP" badgeColor="purple" />

      {/* Active arcs */}
      {activeArcs.filter(a => a.status === 'active').map(arc => {
        const template = GANG_ARCS.find(t => t.id === arc.arc_id);
        if (!template) return null;
        const currentStep = template.steps[arc.current_step];
        const hasVoted = arc.member_choices?.[arc.current_step]?.[user?.id || ''];
        const voterCount = Object.keys(arc.member_choices?.[arc.current_step] || {}).length;

        return (
          <motion.div key={arc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="game-card border-l-[3px] border-l-game-purple mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{template.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{template.name}</h4>
                  <span className="text-[0.45rem] text-muted-foreground">Stap {arc.current_step + 1}/{template.steps.length}</span>
                </div>
              </div>
              <GameBadge variant="purple" size="xs">ACTIEF</GameBadge>
            </div>

            <Progress value={((arc.current_step) / template.steps.length) * 100} className="h-1 bg-muted/30 mb-3" />

            {currentStep && (
              <div className="space-y-2">
                <div className="bg-muted/20 rounded p-2 border border-border/30">
                  <h5 className="text-[0.6rem] font-bold text-gold uppercase tracking-wider mb-1">{currentStep.title}</h5>
                  <p className="text-[0.5rem] text-muted-foreground leading-relaxed">{currentStep.briefing}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[0.4rem] text-muted-foreground flex items-center gap-0.5">
                      <Users size={8} /> Min. {currentStep.minParticipants} leden
                    </span>
                    <span className="text-[0.4rem] text-game-purple flex items-center gap-0.5">
                      <CheckCircle size={8} /> {voterCount} gestemd
                    </span>
                  </div>
                </div>

                {hasVoted ? (
                  <div className="text-center py-2 text-[0.5rem] text-emerald flex items-center justify-center gap-1">
                    <CheckCircle size={10} /> Je hebt gekozen: <span className="font-bold">{hasVoted}</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {currentStep.choices.map(choice => (
                      <button key={choice.id} disabled={acting}
                        onClick={() => handleChoice(arc.id, choice.id)}
                        className="w-full text-left game-card hover:border-game-purple/40 transition-colors p-2 group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {STAT_ICONS[choice.stat]}
                            <span className="text-[0.55rem] font-bold uppercase tracking-wider">{choice.label}</span>
                          </div>
                          <span className="text-[0.4rem] text-muted-foreground">Moeilijkheid: {choice.difficulty}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Completed arcs */}
      {activeArcs.filter(a => a.status === 'completed').map(arc => {
        const template = GANG_ARCS.find(t => t.id === arc.arc_id);
        if (!template) return null;
        const success = arc.result?.success;
        return (
          <div key={arc.id} className="game-card opacity-60 mb-2">
            <div className="flex items-center gap-2">
              <span>{template.icon}</span>
              <span className="text-xs font-bold">{template.name}</span>
              {success ? <CheckCircle size={12} className="text-emerald" /> : <XCircle size={12} className="text-blood" />}
            </div>
          </div>
        );
      })}

      {/* Available arcs to start */}
      {availableArcs.length > 0 && (
        <>
          <SectionHeader title="Beschikbare Missies" icon={<Zap size={12} />} />
          {availableArcs.map(arc => (
            <motion.div key={arc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="game-card mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{arc.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold">{arc.name}</h4>
                    <span className="text-[0.4rem] text-muted-foreground">Lv.{arc.requiredGangLevel}+ • {arc.requiredMembers}+ leden • {arc.steps.length} stappen</span>
                  </div>
                </div>
              </div>
              <p className="text-[0.5rem] text-muted-foreground mb-2">{arc.description}</p>
              <div className="flex items-center justify-between">
                <div className="text-[0.4rem] text-emerald">
                  Beloning: €{arc.rewards.moneyPerMember.toLocaleString()}/lid + {arc.rewards.repPerMember} rep
                </div>
                <GameButton variant="purple" size="sm" onClick={() => handleStart(arc.id)} disabled={acting}>
                  Start Missie
                </GameButton>
              </div>
            </motion.div>
          ))}
        </>
      )}

      {activeArcs.length === 0 && availableArcs.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Geen missies beschikbaar. Verhoog je gang level voor nieuwe missies.
        </p>
      )}
    </div>
  );
}
