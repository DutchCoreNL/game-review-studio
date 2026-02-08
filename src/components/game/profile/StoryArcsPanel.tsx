import { useGame } from '@/contexts/GameContext';
import { STORY_ARCS, ActiveStoryArc } from '@/game/storyArcs';
import { BACKSTORY_ARCS } from '@/game/backstoryArcs';
import { SectionHeader } from '../ui/SectionHeader';
import { StatBar } from '../ui/StatBar';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, Lock, Clock, ChevronDown, ChevronUp, Flame, Shield } from 'lucide-react';
import { useState } from 'react';

/** All arcs combined */
const ALL_ARCS = [...STORY_ARCS, ...BACKSTORY_ARCS];

type ArcStatus = 'active' | 'completed' | 'locked';

interface ArcDisplayData {
  arc: typeof ALL_ARCS[0];
  status: ArcStatus;
  activeData?: ActiveStoryArc;
  success?: boolean;
}

function getArcDisplayData(state: ReturnType<typeof useGame>['state']): ArcDisplayData[] {
  return ALL_ARCS.map(arc => {
    const activeData = state.activeStoryArcs?.find(a => a.arcId === arc.id);
    const isCompleted = state.completedArcs?.includes(arc.id);

    if (isCompleted) {
      return {
        arc,
        status: 'completed' as ArcStatus,
        activeData,
        success: activeData?.success ?? true,
      };
    }

    if (activeData && !activeData.finished) {
      return { arc, status: 'active' as ArcStatus, activeData };
    }

    return { arc, status: 'locked' as ArcStatus };
  });
}

export function StoryArcsPanel() {
  const { state } = useGame();
  const arcs = getArcDisplayData(state);
  const [expandedArc, setExpandedArc] = useState<string | null>(null);

  const active = arcs.filter(a => a.status === 'active');
  const completed = arcs.filter(a => a.status === 'completed');
  const locked = arcs.filter(a => a.status === 'locked');

  return (
    <div>
      {/* Active Arcs */}
      {active.length > 0 && (
        <>
          <SectionHeader title="Actieve Bogen" icon={<BookOpen size={12} />} badge={`${active.length}`} badgeColor="gold" />
          <div className="space-y-2 mb-4">
            {active.map(data => (
              <ArcCard key={data.arc.id} data={data} expanded={expandedArc === data.arc.id}
                onToggle={() => setExpandedArc(expandedArc === data.arc.id ? null : data.arc.id)} />
            ))}
          </div>
        </>
      )}

      {/* Completed Arcs */}
      {completed.length > 0 && (
        <>
          <SectionHeader title="Voltooid" icon={<CheckCircle size={12} />} badge={`${completed.length}`} badgeColor="emerald" />
          <div className="space-y-2 mb-4">
            {completed.map(data => (
              <ArcCard key={data.arc.id} data={data} expanded={expandedArc === data.arc.id}
                onToggle={() => setExpandedArc(expandedArc === data.arc.id ? null : data.arc.id)} />
            ))}
          </div>
        </>
      )}

      {/* Locked Arcs */}
      {locked.length > 0 && (
        <>
          <SectionHeader title="Vergrendeld" icon={<Lock size={12} />} />
          <div className="space-y-2 mb-4">
            {locked.map(data => (
              <LockedArcCard key={data.arc.id} arc={data.arc} currentState={state} />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {active.length === 0 && completed.length === 0 && (
        <div className="game-card text-center py-6">
          <BookOpen size={24} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Nog geen verhaalbogen ontgrendeld.</p>
          <p className="text-[0.5rem] text-muted-foreground mt-1">Bouw reputatie en verken districten om bogen te activeren.</p>
        </div>
      )}
    </div>
  );
}

/** Card for active / completed arcs with expandable timeline */
function ArcCard({ data, expanded, onToggle }: { data: ArcDisplayData; expanded: boolean; onToggle: () => void }) {
  const { arc, status, activeData, success } = data;
  const totalSteps = arc.steps.length;
  const currentStep = activeData?.currentStep ?? totalSteps;
  const completedSteps = status === 'completed' ? totalSteps : currentStep;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);

  const borderColor = status === 'completed'
    ? success ? 'border-l-emerald' : 'border-l-blood'
    : 'border-l-gold';

  const isBackstoryArc = arc.id.startsWith('backstory_');

  return (
    <motion.div layout className={`game-card border-l-[3px] ${borderColor}`}>
      {/* Header */}
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-center gap-2">
          <span className="text-lg">{arc.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-xs truncate">{arc.name}</h4>
              {isBackstoryArc && (
                <span className="text-[0.4rem] px-1 py-0.5 rounded bg-game-purple/15 text-game-purple border border-game-purple/30 font-bold">
                  BACKSTORY
                </span>
              )}
              {status === 'completed' && (
                <span className={`text-[0.4rem] px-1 py-0.5 rounded font-bold ${
                  success ? 'bg-emerald/15 text-emerald border border-emerald/30' : 'bg-blood/15 text-blood border border-blood/30'
                }`}>
                  {success ? 'SUCCES' : 'MISLUKT'}
                </span>
              )}
            </div>
            <p className="text-[0.5rem] text-muted-foreground truncate">{arc.description}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[0.55rem] font-bold text-gold">{completedSteps}/{totalSteps}</span>
            {expanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2">
          <StatBar
            value={completedSteps}
            max={totalSteps}
            color={status === 'completed' ? (success ? 'emerald' : 'blood') : 'gold'}
            height="sm"
            animate
          />
        </div>
      </button>

      {/* Expanded Timeline */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border">
              <StepTimeline arc={arc} completedSteps={completedSteps} status={status} activeData={activeData} />

              {/* Completion reward */}
              {status === 'completed' && (
                <div className="mt-3 pt-2 border-t border-border/50">
                  <p className="text-[0.5rem] text-muted-foreground uppercase tracking-wider font-bold mb-1">Beloning</p>
                  <div className="flex gap-3 text-[0.5rem]">
                    {arc.completionReward.money > 0 && (
                      <span className="text-emerald font-bold">€{arc.completionReward.money.toLocaleString()}</span>
                    )}
                    {arc.completionReward.rep > 0 && (
                      <span className="text-gold font-bold">{arc.completionReward.rep} REP</span>
                    )}
                    {arc.completionReward.dirtyMoney > 0 && (
                      <span className="text-muted-foreground">€{arc.completionReward.dirtyMoney.toLocaleString()} zwart</span>
                    )}
                  </div>
                </div>
              )}

              {/* Active arc info */}
              {status === 'active' && activeData && (
                <div className="mt-3 pt-2 border-t border-border/50 flex justify-between text-[0.5rem]">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock size={8} /> Gestart dag {activeData.startedDay}
                  </span>
                  {activeData.failedSteps > 0 && (
                    <span className="text-blood font-bold">{activeData.failedSteps} mislukt</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Visual timeline showing each step */
function StepTimeline({ arc, completedSteps, status, activeData }: {
  arc: typeof ALL_ARCS[0];
  completedSteps: number;
  status: ArcStatus;
  activeData?: ActiveStoryArc;
}) {
  return (
    <div className="relative pl-4">
      {/* Vertical line */}
      <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border" />

      {arc.steps.map((step, i) => {
        const isDone = i < completedSteps;
        const isCurrent = status === 'active' && i === completedSteps;
        const isFuture = i > completedSteps;

        return (
          <div key={step.id} className="relative mb-2.5 last:mb-0">
            {/* Dot */}
            <div className={`absolute -left-4 top-0.5 w-2.5 h-2.5 rounded-full border-2 ${
              isDone
                ? 'bg-emerald border-emerald'
                : isCurrent
                  ? 'bg-gold border-gold animate-pulse'
                  : 'bg-muted border-border'
            }`} />

            {/* Content */}
            <div className={`${isFuture ? 'opacity-30' : ''}`}>
              <p className={`text-[0.55rem] font-bold ${
                isDone ? 'text-foreground' : isCurrent ? 'text-gold' : 'text-muted-foreground'
              }`}>
                Stap {i + 1}
                {isCurrent && <span className="text-gold ml-1">← Huidig</span>}
              </p>
              <p className="text-[0.45rem] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                {isFuture ? '???' : step.text.slice(0, 100) + (step.text.length > 100 ? '...' : '')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Card for locked/unavailable arcs */
function LockedArcCard({ arc, currentState }: { arc: typeof ALL_ARCS[0]; currentState: ReturnType<typeof useGame>['state'] }) {
  const cond = arc.triggerConditions;
  const isBackstoryArc = arc.id.startsWith('backstory_');

  // Check individual conditions
  const dayMet = currentState.day >= cond.minDay;
  const repMet = !cond.minRep || currentState.rep >= cond.minRep;
  const distMet = !cond.minDistricts || currentState.ownedDistricts.length >= cond.minDistricts;
  const backstoryMet = !cond.requiredBackstory || currentState.backstory === cond.requiredBackstory;

  return (
    <div className="game-card border-l-[3px] border-l-border opacity-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-muted/40 flex items-center justify-center">
          <Lock size={14} className="text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-xs text-muted-foreground">{arc.name}</h4>
            {isBackstoryArc && (
              <span className="text-[0.4rem] px-1 py-0.5 rounded bg-game-purple/10 text-game-purple/50 border border-game-purple/20 font-bold">
                BACKSTORY
              </span>
            )}
          </div>
          {/* Requirements */}
          <div className="flex flex-wrap gap-1 mt-1">
            {cond.minDay > 0 && (
              <RequirementChip label={`Dag ${cond.minDay}+`} met={dayMet} />
            )}
            {cond.minRep && (
              <RequirementChip label={`${cond.minRep}+ REP`} met={repMet} />
            )}
            {cond.minDistricts && (
              <RequirementChip label={`${cond.minDistricts}+ District`} met={distMet} />
            )}
            {cond.requiredBackstory && (
              <RequirementChip label={`Backstory: ${cond.requiredBackstory}`} met={backstoryMet} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RequirementChip({ label, met }: { label: string; met: boolean }) {
  return (
    <span className={`text-[0.4rem] px-1 py-0.5 rounded font-semibold ${
      met
        ? 'bg-emerald/10 text-emerald border border-emerald/20'
        : 'bg-muted/50 text-muted-foreground border border-border'
    }`}>
      {met ? '✓' : '✗'} {label}
    </span>
  );
}
