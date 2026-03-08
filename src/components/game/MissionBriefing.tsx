import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/contexts/GameContext';
import { SoloOperation, MissionApproach, ActiveMission } from '@/game/types';
import { SOLO_OP_BRIEFINGS } from '@/game/constants';
import { calculateOperationRewardRange, rollActualReward } from '@/game/operationRewards';
import { generateMissionEncounters } from '@/game/missions';
import { SOLO_OP_IMAGES } from '@/assets/items';
import { GameButton } from './ui/GameButton';
import { X, Shield, Zap, Flame, Target, AlertTriangle, DollarSign, Crosshair, Eye, Swords } from 'lucide-react';

const APPROACH_DATA: Record<MissionApproach, { label: string; desc: string; icon: React.ReactNode; color: string; borderColor: string; bgColor: string; iconBg: string }> = {
  cautious: {
    label: 'VOORZICHTIG',
    desc: 'Minder heat, lagere beloningen, makkelijker',
    icon: <Shield size={16} />,
    color: 'text-ice',
    borderColor: 'border-ice',
    bgColor: 'bg-ice/10',
    iconBg: 'bg-ice/20 border-ice/40',
  },
  standard: {
    label: 'STANDAARD',
    desc: 'Normale risico\'s en beloningen',
    icon: <Target size={16} />,
    color: 'text-gold',
    borderColor: 'border-gold',
    bgColor: 'bg-gold/10',
    iconBg: 'bg-gold/20 border-gold/40',
  },
  aggressive: {
    label: 'AGRESSIEF',
    desc: 'Meer heat, hogere beloningen, moeilijker',
    icon: <Flame size={16} />,
    color: 'text-blood',
    borderColor: 'border-blood',
    bgColor: 'bg-blood/10',
    iconBg: 'bg-blood/20 border-blood/40',
  },
};

interface MissionBriefingProps {
  operation: SoloOperation;
  onClose: () => void;
}

export function MissionBriefing({ operation, onClose }: MissionBriefingProps) {
  const { state, dispatch } = useGame();
  const [approach, setApproach] = useState<MissionApproach>('standard');
  const [launching, setLaunching] = useState(false);

  // Don't render during tutorial or backstory selection
  if (!state.tutorialDone || state.backstory === null) return null;

  const briefing = SOLO_OP_BRIEFINGS[operation.id]?.[state.loc] || SOLO_OP_BRIEFINGS[operation.id]?.['neon'];
  const bgImage = SOLO_OP_IMAGES[operation.id];
  const rewardRange = calculateOperationRewardRange(operation, state);

  const heatMult = approach === 'cautious' ? 0.7 : approach === 'aggressive' ? 1.3 : 1;
  const rewardMult = approach === 'cautious' ? 0.8 : approach === 'aggressive' ? 1.3 : 1;

  const startMission = () => {
    setLaunching(true);
    setTimeout(() => {
      const actualReward = rollActualReward(rewardRange);
      const encounters = generateMissionEncounters('solo', operation.id, undefined, state.loc);
      const mission: ActiveMission = {
        type: 'solo',
        missionId: operation.id,
        currentEncounter: 0,
        encounters,
        totalReward: 0,
        totalHeat: 0,
        totalCrewDamage: 0,
        totalRelChange: {},
        log: [],
        baseReward: Math.floor(actualReward * rewardMult),
        baseHeat: Math.floor(operation.heat * heatMult),
        finished: false,
        success: false,
        approach,
        choiceResults: [],
      };
      dispatch({ type: 'START_MISSION', mission });
      onClose();
    }, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-background flex flex-col"
    >
      {/* ═══ CINEMATIC BACKGROUND ═══ */}
      <div className="absolute inset-0">
        {bgImage && <img src={bgImage} alt="" className="w-full h-full object-cover opacity-20" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex-none px-4 pt-4 pb-2 flex items-center justify-between">
          <div>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[0.45rem] text-gold font-bold uppercase tracking-[0.3em]"
            >
              MISSIE BRIEFING
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-xl text-foreground uppercase tracking-wider"
            >
              {operation.name}
            </motion.h1>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 game-scroll">
          {/* Intel cards with icon circles */}
          {briefing && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2 mb-5"
            >
              {[
                { icon: <Target size={12} className="text-gold" />, label: 'DOELWIT', text: briefing.targetDesc, border: 'border-gold/30', bg: 'bg-gold/5', iconBg: 'bg-gold/20 border-gold/40', labelColor: 'text-gold' },
                { icon: <Eye size={12} className="text-ice" />, label: 'LOCATIE', text: briefing.locationDesc, border: 'border-ice/30', bg: 'bg-ice/5', iconBg: 'bg-ice/20 border-ice/40', labelColor: 'text-ice' },
                { icon: <AlertTriangle size={12} className="text-emerald" />, label: 'INTEL', text: briefing.intel, border: 'border-emerald/30', bg: 'bg-emerald/5', iconBg: 'bg-emerald/20 border-emerald/40', labelColor: 'text-emerald' },
              ].map((card) => (
                <div key={card.label} className={`p-3 rounded-xl border ${card.border} ${card.bg}`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 rounded-full border ${card.iconBg} flex items-center justify-center shrink-0`}>
                      {card.icon}
                    </div>
                    <div>
                      <span className={`text-[0.45rem] font-bold ${card.labelColor} uppercase tracking-wider`}>{card.label}</span>
                      <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">{card.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Risk analysis */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-5"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-[0.4rem] font-bold text-muted-foreground uppercase tracking-widest">Risico-analyse</span>
              <div className="h-px flex-1 bg-border/40" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-blood/5 border border-blood/20 text-center">
                <AlertTriangle size={14} className="text-blood mx-auto mb-1" />
                <p className="text-[0.45rem] text-muted-foreground">Risico</p>
                <p className="text-sm font-bold text-blood">{operation.risk}%</p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-center">
                <Flame size={14} className="text-amber-400 mx-auto mb-1" />
                <p className="text-[0.45rem] text-muted-foreground">Heat</p>
                <p className="text-sm font-bold text-amber-400">+{Math.floor(operation.heat * heatMult)}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-gold/5 border border-gold/20 text-center">
                <DollarSign size={14} className="text-gold mx-auto mb-1" />
                <p className="text-[0.45rem] text-muted-foreground">Beloning</p>
                <p className="text-xs font-bold text-gold">
                  €{Math.floor(rewardRange.min * rewardMult).toLocaleString()}–{Math.floor(rewardRange.max * rewardMult).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          {/* ═══ APPROACH SELECTION AS CARDS ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-5"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-[0.4rem] font-bold text-muted-foreground uppercase tracking-widest">Kies je aanpak</span>
              <div className="h-px flex-1 bg-border/40" />
            </div>
            <div className="space-y-2">
              {(['cautious', 'standard', 'aggressive'] as MissionApproach[]).map((a) => {
                const data = APPROACH_DATA[a];
                const selected = approach === a;
                return (
                  <motion.button
                    key={a}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setApproach(a)}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                      selected
                        ? `${data.borderColor} ${data.bgColor}`
                        : 'border-border bg-card hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full border ${selected ? data.iconBg : 'bg-muted/30 border-border/40'} flex items-center justify-center shrink-0 transition-all`}>
                        <span className={selected ? data.color : 'text-muted-foreground'}>{data.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-bold uppercase tracking-wider ${selected ? data.color : 'text-foreground'}`}>
                          {data.label}
                        </p>
                        <p className="text-[0.5rem] text-muted-foreground">{data.desc}</p>
                      </div>
                      {selected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`w-5 h-5 rounded-full ${data.bgColor} border ${data.borderColor} flex items-center justify-center`}
                        >
                          <div className={`w-2 h-2 rounded-full ${data.color.replace('text-', 'bg-')}`} />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Launch button */}
        <div className="flex-none px-4 pb-5 pt-2">
          <AnimatePresence mode="wait">
            {launching ? (
              <motion.div
                key="launching"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full py-4 rounded-xl bg-gold/20 border border-gold flex items-center justify-center gap-3"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Crosshair size={20} className="text-gold" />
                </motion.div>
                <span className="text-gold font-bold uppercase tracking-wider text-sm">MISSIE START...</span>
              </motion.div>
            ) : (
              <motion.div key="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <GameButton variant="gold" size="lg" fullWidth glow icon={<Crosshair size={16} />} onClick={startMission}>
                  START OPERATIE
                </GameButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
