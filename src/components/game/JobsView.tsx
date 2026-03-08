import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { ViewWrapper } from './ui/ViewWrapper';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { StatBar } from './ui/StatBar';
import { motion } from 'framer-motion';
import { Briefcase, Clock, TrendingUp, Star, DollarSign, Wine, Car, Shield, Wrench, Calculator, Scale, Stethoscope, Building2, LucideIcon } from 'lucide-react';
import { gameApi } from '@/lib/gameApi';
import { toast } from 'sonner';
import operationsBg from '@/assets/operations-bg.jpg';

interface JobDef {
  id: string;
  name: string;
  icon: LucideIcon;
  iconColor: string;
  salary: number;
  perk: string;
  reqLevel: number;
  reqStat?: { stat: string; value: number };
  desc: string;
}

const JOBS: JobDef[] = [
  { id: 'barman', name: 'Barman', icon: Wine, iconColor: 'text-game-purple', salary: 1500, perk: '+5% Charm XP', reqLevel: 1, desc: 'Werk achter de bar. Goed voor connecties.' },
  { id: 'taxichauffeur', name: 'Taxichauffeur', icon: Car, iconColor: 'text-gold', salary: 2500, perk: '-10% Reistijd', reqLevel: 2, desc: 'Ken elke straat van Noxhaven.' },
  { id: 'beveiliger', name: 'Beveiliger', icon: Shield, iconColor: 'text-blood', salary: 4000, perk: '+5% Defense', reqLevel: 4, reqStat: { stat: 'muscle', value: 5 }, desc: 'Nachtwerk bij clubs en evenementen.' },
  { id: 'monteur', name: 'Automonteur', icon: Wrench, iconColor: 'text-ice', salary: 5000, perk: '-15% Voertuig reparatie', reqLevel: 5, reqStat: { stat: 'brains', value: 4 }, desc: 'Repareer en tune voertuigen.' },
  { id: 'boekhouder', name: 'Boekhouder', icon: Calculator, iconColor: 'text-emerald', salary: 7000, perk: '+10% Witwas limiet', reqLevel: 7, reqStat: { stat: 'brains', value: 8 }, desc: 'Creatieve boekhouding voor de onderwereld.' },
  { id: 'advocaat', name: 'Advocaat', icon: Scale, iconColor: 'text-gold', salary: 10000, perk: '-25% Gevangenisstraf', reqLevel: 10, reqStat: { stat: 'brains', value: 12 }, desc: 'Ken de wet. Buig de wet.' },
  { id: 'arts', name: 'Arts', icon: Stethoscope, iconColor: 'text-emerald', salary: 12000, perk: 'Kan spelers reviven', reqLevel: 12, reqStat: { stat: 'brains', value: 15 }, desc: 'Genees anderen. Verdien respect.' },
  { id: 'makelaar', name: 'Vastgoedmakelaar', icon: Building2, iconColor: 'text-ice', salary: 15000, perk: '-10% Vastgoedprijzen', reqLevel: 15, reqStat: { stat: 'charm', value: 12 }, desc: 'Handel in het duurste goed: locatie.' },
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

  useEffect(() => { loadJobState(); }, []);

  const loadJobState = async () => {
    const res = await gameApi.getJobs();
    if (res.success && res.data) setJobState(res.data as any);
  };

  const handleApply = async (jobId: string) => {
    setLoading(true);
    const res = await gameApi.applyJob(jobId);
    if (res.success) { toast.success(res.message); loadJobState(); } else { toast.error(res.message); }
    setLoading(false);
  };

  const handleWork = async () => {
    setLoading(true);
    const res = await gameApi.workJob();
    if (res.success) { toast.success(res.message); loadJobState(); } else { toast.error(res.message); }
    setLoading(false);
  };

  const handleQuit = async () => {
    setLoading(true);
    const res = await gameApi.quitJob();
    if (res.success) { toast.success(res.message); setJobState(prev => prev ? { ...prev, currentJob: null, daysWorked: 0, promotion: 0 } : null); } else { toast.error(res.message); }
    setLoading(false);
  };

  const currentJobDef = jobState?.currentJob ? JOBS.find(j => j.id === jobState.currentJob) : null;
  const promotionLevel = jobState?.promotion || 0;
  const salary = currentJobDef ? Math.floor(currentJobDef.salary * (1 + promotionLevel * 0.2)) : 0;

  return (
    <ViewWrapper bg={operationsBg}>
      {/* Cinematic header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
          <Briefcase size={18} className="text-gold" />
        </div>
        <div>
          <h2 className="font-display text-lg text-gold uppercase tracking-widest font-bold">Werkgelegenheid</h2>
          <p className="text-[0.55rem] text-muted-foreground">Kies een baan voor dagelijks inkomen en perks</p>
        </div>
      </div>

      {/* Current job */}
      {currentJobDef && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="game-card border-l-[3px] border-l-gold mb-3"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {(() => { const Icon = currentJobDef.icon; return <div className={`w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center ${currentJobDef.iconColor}`}><Icon size={16} /></div>; })()}
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

          <div className="mb-3">
            <div className="flex justify-between text-[0.5rem] text-muted-foreground mb-1">
              <span>Promotie voortgang</span>
              <span>{(jobState?.daysWorked || 0) % 10}/10 dagen</span>
            </div>
            <StatBar value={(jobState?.daysWorked || 0) % 10} max={10} color="gold" height="sm" />
          </div>

          <div className="flex gap-2">
            <GameButton
              size="sm"
              variant="gold"
              fullWidth
              disabled={loading || !jobState?.canWork}
              onClick={handleWork}
            >
              <Clock size={14} />
              {jobState?.canWork ? 'Werken' : 'Al gewerkt vandaag'}
            </GameButton>
            <GameButton
              size="sm"
              variant="blood"
              disabled={loading}
              onClick={handleQuit}
            >
              Ontslag
            </GameButton>
          </div>
        </motion.div>
      )}

      {/* Job listings */}
      <SectionHeader title="Beschikbare Banen" icon={<Briefcase size={12} />} />
      <div className="space-y-2">
        {JOBS.map((job, i) => {
          const isCurrentJob = jobState?.currentJob === job.id;
          const hasLevel = state.player.level >= job.reqLevel;
          const hasStat = !job.reqStat || (state.player.stats[job.reqStat.stat as 'muscle' | 'brains' | 'charm'] || 0) >= job.reqStat.value;
          const canApply = hasLevel && hasStat && !isCurrentJob && !jobState?.currentJob;
          const locked = !hasLevel || !hasStat;
          
          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`game-card ${
                isCurrentJob 
                  ? 'border-l-[3px] border-l-gold'
                  : locked 
                    ? 'opacity-50'
                    : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {(() => { const Icon = job.icon; return <div className={`w-9 h-9 rounded-lg bg-muted/40 border border-border flex items-center justify-center ${locked ? 'opacity-50' : job.iconColor}`}><Icon size={16} /></div>; })()}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">{job.name}</span>
                      {isCurrentJob && <GameBadge variant="gold" size="xs">ACTIEF</GameBadge>}
                    </div>
                    <p className="text-[0.55rem] text-muted-foreground">{job.desc}</p>
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
                  <span className={hasLevel ? '' : 'text-blood'}>Lvl {job.reqLevel}</span>
                  {job.reqStat && (
                    <span className={hasStat ? '' : 'text-blood'}>{job.reqStat.stat} ≥ {job.reqStat.value}</span>
                  )}
                </div>
                {!isCurrentJob && (
                  <GameButton
                    size="sm"
                    variant={canApply ? 'gold' : 'muted'}
                    disabled={!canApply || loading}
                    onClick={() => handleApply(job.id)}
                  >
                    {!hasLevel ? 'Te laag level' : !hasStat ? 'Stats te laag' : jobState?.currentJob ? 'Neem ontslag' : 'Solliciteren'}
                  </GameButton>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </ViewWrapper>
  );
}
