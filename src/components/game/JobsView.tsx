import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { Briefcase, Clock, TrendingUp, Star, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gameApi } from '@/lib/gameApi';
import { toast } from 'sonner';

interface JobDef {
  id: string;
  name: string;
  icon: string;
  salary: number;
  perk: string;
  reqLevel: number;
  reqStat?: { stat: string; value: number };
  desc: string;
}

const JOBS: JobDef[] = [
  { id: 'barman', name: 'Barman', icon: '🍸', salary: 500, perk: '+5% Charm XP', reqLevel: 1, desc: 'Werk achter de bar. Goed voor connecties.' },
  { id: 'taxichauffeur', name: 'Taxichauffeur', icon: '🚕', salary: 800, perk: '-10% Reistijd', reqLevel: 2, desc: 'Ken elke straat van Noxhaven.' },
  { id: 'beveiliger', name: 'Beveiliger', icon: '🛡️', salary: 1200, perk: '+5% Defense', reqLevel: 4, reqStat: { stat: 'muscle', value: 5 }, desc: 'Nachtwerk bij clubs en evenementen.' },
  { id: 'monteur', name: 'Automonteur', icon: '🔧', salary: 1500, perk: '-15% Voertuig reparatie', reqLevel: 5, reqStat: { stat: 'brains', value: 4 }, desc: 'Repareer en tune voertuigen.' },
  { id: 'boekhouder', name: 'Boekhouder', icon: '📊', salary: 2000, perk: '+10% Witwas limiet', reqLevel: 7, reqStat: { stat: 'brains', value: 8 }, desc: 'Creatieve boekhouding voor de onderwereld.' },
  { id: 'advocaat', name: 'Advocaat', icon: '⚖️', salary: 3000, perk: '-25% Gevangenisstraf', reqLevel: 10, reqStat: { stat: 'brains', value: 12 }, desc: 'Ken de wet. Buig de wet.' },
  { id: 'arts', name: 'Arts', icon: '🏥', salary: 3500, perk: 'Kan spelers reviven', reqLevel: 12, reqStat: { stat: 'brains', value: 15 }, desc: 'Genees anderen. Verdien respect.' },
  { id: 'makelaar', name: 'Vastgoedmakelaar', icon: '🏠', salary: 4000, perk: '-10% Vastgoedprijzen', reqLevel: 15, reqStat: { stat: 'charm', value: 12 }, desc: 'Handel in het duurste goed: locatie.' },
];

export function JobsView() {
  const { state } = useGame();
  const [loading, setLoading] = useState(false);
  const [jobState, setJobState] = useState<{
    currentJob: string | null;
    daysWorked: number;
    promotion: number;
    lastWorked: string | null;
    canWork: boolean;
  } | null>(null);

  useEffect(() => {
    loadJobState();
  }, []);

  const loadJobState = async () => {
    const res = await gameApi.getJobs();
    if (res.success && res.data) {
      setJobState(res.data as any);
    }
  };

  const handleApply = async (jobId: string) => {
    setLoading(true);
    const res = await gameApi.applyJob(jobId);
    if (res.success) {
      toast.success(res.message);
      loadJobState();
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  const handleWork = async () => {
    setLoading(true);
    const res = await gameApi.workJob();
    if (res.success) {
      toast.success(res.message);
      loadJobState();
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  const handleQuit = async () => {
    setLoading(true);
    const res = await gameApi.quitJob();
    if (res.success) {
      toast.success(res.message);
      setJobState(prev => prev ? { ...prev, currentJob: null, daysWorked: 0, promotion: 0 } : null);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  const currentJobDef = jobState?.currentJob ? JOBS.find(j => j.id === jobState.currentJob) : null;
  const promotionLevel = jobState?.promotion || 0;
  const salary = currentJobDef ? Math.floor(currentJobDef.salary * (1 + promotionLevel * 0.2)) : 0;

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Briefcase className="text-gold" size={24} />
        <div>
          <h2 className="font-display text-lg text-foreground uppercase tracking-widest">Banen</h2>
          <p className="text-xs text-muted-foreground">Kies een legitieme baan voor dagelijks inkomen en perks</p>
        </div>
      </div>

      {/* Current job */}
      {currentJobDef && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gold/5 border border-gold/20 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentJobDef.icon}</span>
              <div>
                <div className="text-sm font-bold text-foreground">{currentJobDef.name}</div>
                <div className="text-[0.6rem] text-muted-foreground">
                  {jobState?.daysWorked || 0} dagen gewerkt • Promotie lvl {promotionLevel}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gold">€{salary.toLocaleString()}/dag</div>
              <div className="text-[0.55rem] text-muted-foreground">{currentJobDef.perk}</div>
            </div>
          </div>

          {/* Promotion progress */}
          <div className="mb-3">
            <div className="flex justify-between text-[0.5rem] text-muted-foreground mb-1">
              <span>Promotie voortgang</span>
              <span>{(jobState?.daysWorked || 0) % 10}/10 dagen</span>
            </div>
            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gold"
                animate={{ width: `${((jobState?.daysWorked || 0) % 10) * 10}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 text-xs"
              disabled={loading || !jobState?.canWork}
              onClick={handleWork}
            >
              <Clock size={14} className="mr-1" />
              {jobState?.canWork ? 'Werken' : 'Al gewerkt vandaag'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              disabled={loading}
              onClick={handleQuit}
            >
              Ontslag
            </Button>
          </div>
        </motion.div>
      )}

      {/* Job listings */}
      <div className="space-y-2">
        {JOBS.map(job => {
          const isCurrentJob = jobState?.currentJob === job.id;
          const hasLevel = state.player.level >= job.reqLevel;
          const hasStat = !job.reqStat || (state.player.stats[job.reqStat.stat as 'muscle' | 'brains' | 'charm'] || 0) >= job.reqStat.value;
          const canApply = hasLevel && hasStat && !isCurrentJob && !jobState?.currentJob;
          
          return (
            <div
              key={job.id}
              className={`p-3 rounded-lg border transition-all ${
                isCurrentJob 
                  ? 'bg-gold/10 border-gold/30'
                  : !hasLevel || !hasStat 
                    ? 'bg-muted/5 border-border/30 opacity-60'
                    : 'bg-card border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{job.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-foreground">{job.name}</div>
                    <div className="text-[0.55rem] text-muted-foreground">{job.desc}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="flex items-center gap-1 text-xs font-bold text-gold">
                    <DollarSign size={12} />
                    {job.salary.toLocaleString()}
                  </div>
                  <div className="text-[0.5rem] text-muted-foreground">{job.perk}</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2 text-[0.5rem] text-muted-foreground">
                  <span>Lvl {job.reqLevel}</span>
                  {job.reqStat && (
                    <span>{job.reqStat.stat} ≥ {job.reqStat.value}</span>
                  )}
                </div>
                {!isCurrentJob && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[0.55rem] px-2"
                    disabled={!canApply || loading}
                    onClick={() => handleApply(job.id)}
                  >
                    {!hasLevel ? 'Te laag level' : !hasStat ? 'Stats te laag' : jobState?.currentJob ? 'Neem eerst ontslag' : 'Solliciteren'}
                  </Button>
                )}
                {isCurrentJob && (
                  <span className="text-[0.55rem] text-gold font-bold flex items-center gap-1">
                    <Star size={10} /> Huidige baan
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
