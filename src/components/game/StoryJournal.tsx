import { useGame } from '@/contexts/GameContext';
import { STORY_ARCS } from '@/game/storyArcs';
import { STORY_ARC_IMAGES } from '@/assets/items';
import { motion } from 'framer-motion';
import { BookOpen, Check, Clock, ChevronRight, Star, X } from 'lucide-react';

export function StoryJournal() {
  const { state } = useGame();
  const activeArcs = state.activeStoryArcs || [];
  const completedArcIds = state.completedArcs || [];

  const activeArcData = activeArcs.filter(a => !a.finished).map(a => ({
    active: a,
    template: STORY_ARCS.find(t => t.id === a.arcId),
  })).filter(a => a.template);

  const completedArcData = completedArcIds.map(id => ({
    active: activeArcs.find(a => a.arcId === id),
    template: STORY_ARCS.find(t => t.id === id),
  })).filter(a => a.template);

  const availableArcs = STORY_ARCS.filter(arc =>
    !activeArcs.some(a => a.arcId === arc.id) &&
    !completedArcIds.includes(arc.id)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={18} className="text-game-purple" />
        <h2 className="font-display text-lg text-game-purple uppercase tracking-widest">Verhaaldagboek</h2>
      </div>

      {/* Active Arcs */}
      {activeArcData.length > 0 && (
        <section>
          <h3 className="text-[0.6rem] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Clock size={10} /> Actieve Verhaallijnen
          </h3>
          <div className="space-y-2">
            {activeArcData.map(({ active, template }) => (
              <ArcCard
                key={template!.id}
                template={template!}
                currentStep={active!.currentStep}
                status="active"
                failedSteps={active!.failedSteps}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed Arcs */}
      {completedArcData.length > 0 && (
        <section>
          <h3 className="text-[0.6rem] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Check size={10} /> Voltooide Verhaallijnen
          </h3>
          <div className="space-y-2">
            {completedArcData.map(({ active, template }) => (
              <ArcCard
                key={template!.id}
                template={template!}
                currentStep={template!.steps.length}
                status={active?.success ? 'success' : 'failed'}
                failedSteps={active?.failedSteps || 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* Locked/Available Arcs */}
      {availableArcs.length > 0 && (
        <section>
          <h3 className="text-[0.6rem] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Star size={10} /> Nog te Ontdekken
          </h3>
          <div className="space-y-2">
            {availableArcs.slice(0, 5).map(arc => (
              <motion.div
                key={arc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="game-card p-3 border border-border/50 opacity-60"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm blur-[2px]">{arc.icon}</span>
                  <div className="flex-1">
                    <p className="text-[0.6rem] font-bold text-muted-foreground">???</p>
                    <p className="text-[0.45rem] text-muted-foreground italic">Voldoe aan de voorwaarden om te ontgrendelen</p>
                  </div>
                  <div className="flex flex-col gap-0.5 text-[0.4rem] text-muted-foreground">
                    {arc.triggerConditions.minDay && <span>Dag {arc.triggerConditions.minDay}+</span>}
                    {arc.triggerConditions.minRep && <span>Rep {arc.triggerConditions.minRep}+</span>}
                    {arc.triggerConditions.minDistricts && <span>{arc.triggerConditions.minDistricts}+ districten</span>}
                  </div>
                </div>
              </motion.div>
            ))}
            {availableArcs.length > 5 && (
              <p className="text-[0.45rem] text-muted-foreground text-center italic">
                +{availableArcs.length - 5} meer verhaallijnen te ontdekken...
              </p>
            )}
          </div>
        </section>
      )}

      {/* Empty state */}
      {activeArcData.length === 0 && completedArcData.length === 0 && (
        <div className="text-center py-8">
          <BookOpen size={24} className="text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-[0.6rem] text-muted-foreground">Nog geen verhaallijnen gestart.</p>
          <p className="text-[0.45rem] text-muted-foreground italic mt-1">Speel door om verhaallijnen te ontgrendelen.</p>
        </div>
      )}
    </div>
  );
}

// ========== Sub-component ==========

interface ArcCardProps {
  template: typeof STORY_ARCS[0];
  currentStep: number;
  status: 'active' | 'success' | 'failed';
  failedSteps: number;
}

function ArcCard({ template, currentStep, status, failedSteps }: ArcCardProps) {
  const progress = Math.min(100, (currentStep / template.steps.length) * 100);
  const hasBanner = !!STORY_ARC_IMAGES[template.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`game-card overflow-hidden border ${
        status === 'active' ? 'border-game-purple/40' :
        status === 'success' ? 'border-emerald/40' :
        'border-blood/40'
      }`}
    >
      {/* Mini banner */}
      {hasBanner && (
        <div className="relative h-12 overflow-hidden">
          <img src={STORY_ARC_IMAGES[template.id]} alt={template.name} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        </div>
      )}

      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm">{template.icon}</span>
            <div>
              <h4 className="text-[0.6rem] font-bold text-foreground">{template.name}</h4>
              <p className="text-[0.45rem] text-muted-foreground">{template.description}</p>
            </div>
          </div>
          {status === 'active' && (
            <span className="text-[0.4rem] bg-game-purple/20 text-game-purple px-1.5 py-0.5 rounded-full font-bold uppercase">
              Actief
            </span>
          )}
          {status === 'success' && (
            <span className="text-[0.4rem] bg-emerald/20 text-emerald px-1.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-0.5">
              <Check size={8} /> Voltooid
            </span>
          )}
          {status === 'failed' && (
            <span className="text-[0.4rem] bg-blood/20 text-blood px-1.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-0.5">
              <X size={8} /> Mislukt
            </span>
          )}
        </div>

        {/* Progress timeline */}
        <div className="flex items-center gap-1 mt-2">
          {template.steps.map((step, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                i < currentStep
                  ? status === 'failed' && i >= currentStep ? 'bg-blood' : 'bg-game-purple'
                  : i === currentStep && status === 'active'
                    ? 'bg-game-purple animate-pulse ring-2 ring-game-purple/30'
                    : 'bg-muted'
              }`} />
              {i < template.steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-0.5 ${
                  i < currentStep ? 'bg-game-purple/50' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[0.4rem] text-muted-foreground">
            Stap {Math.min(currentStep + (status === 'active' ? 1 : 0), template.steps.length)}/{template.steps.length}
          </span>
          {failedSteps > 0 && (
            <span className="text-[0.4rem] text-blood">{failedSteps} mislukt</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
