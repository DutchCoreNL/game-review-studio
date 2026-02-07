import { useGame } from '@/contexts/GameContext';
import { getEncounterText } from '@/game/missions';
import { getPlayerStat } from '@/game/engine';
import { DISTRICTS } from '@/game/constants';
import { StatId } from '@/game/types';
import { TypewriterText } from './animations/TypewriterText';
import { motion, AnimatePresence } from 'framer-motion';
import { GameButton } from './ui/GameButton';
import { MapPin, Swords, Brain, Heart, Flame, Trophy, Skull, Star, Zap } from 'lucide-react';

const STAT_ICONS: Record<StatId, React.ReactNode> = {
  muscle: <Swords size={12} />,
  brains: <Brain size={12} />,
  charm: <Star size={12} />,
};

const STAT_COLORS: Record<StatId, string> = {
  muscle: 'text-blood',
  brains: 'text-ice',
  charm: 'text-gold',
};

const STAT_LABELS: Record<StatId, string> = {
  muscle: 'KRACHT',
  brains: 'VERNUFT',
  charm: 'CHARISMA',
};

const DIFFICULTY_LABELS = (d: number) => {
  if (d <= 25) return { label: 'MAKKELIJK', color: 'text-emerald' };
  if (d <= 40) return { label: 'GEMIDDELD', color: 'text-gold' };
  if (d <= 55) return { label: 'MOEILIJK', color: 'text-blood' };
  return { label: 'EXTREEM', color: 'text-blood' };
};

export function MissionEncounterView() {
  const { state, dispatch } = useGame();
  const mission = state.activeMission;

  if (!mission) return null;

  const encounter = mission.encounters[mission.currentEncounter];
  const isFinished = mission.finished;

  if (isFinished) {
    return <MissionResult />;
  }

  if (!encounter) return null;

  const text = getEncounterText(encounter, state.loc);
  const districtName = DISTRICTS[state.loc].name;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex-none bg-gradient-to-b from-[hsl(0,0%,6%)] to-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gold" />
            <span className="text-[0.6rem] text-gold font-bold uppercase tracking-widest">{districtName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[0.55rem] text-muted-foreground">
              {mission.currentEncounter + 1}/{mission.encounters.length}
            </span>
            {/* Progress dots */}
            <div className="flex gap-1">
              {mission.encounters.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${
                  i < mission.currentEncounter ? 'bg-gold' :
                  i === mission.currentEncounter ? 'bg-gold animate-pulse' : 'bg-muted'
                }`} />
              ))}
            </div>
          </div>
        </div>
        <h2 className="font-display text-sm text-foreground mt-1 uppercase tracking-wider">
          {mission.type === 'solo' ? 'Solo Operatie' : 'Contract Missie'}
          {mission.crewName && <span className="text-gold ml-2">— {mission.crewName}</span>}
        </h2>
      </div>

      {/* Story content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 game-scroll">
        {/* Mission log (previous encounters) */}
        {mission.log.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {mission.log.slice(-3).map((entry, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                className={`text-[0.6rem] italic pl-2 border-l-2 ${
                  entry.includes('✓') ? 'text-emerald border-l-emerald' :
                  entry.includes('△') ? 'text-gold border-l-gold' :
                  entry.includes('✗') ? 'text-blood border-l-blood' :
                  'text-muted-foreground border-l-border'
                }`}
              >
                {entry}
              </motion.p>
            ))}
          </div>
        )}

        {/* Current encounter text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={encounter.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <div className="game-card border-l-[3px] border-l-gold p-4 mb-5">
              <p className="text-sm text-foreground leading-relaxed font-light">
                <TypewriterText text={text} speed={20} />
              </p>
            </div>

            {/* Choices */}
            <div className="space-y-2.5">
              {encounter.choices.map((choice, idx) => {
                const statVal = getPlayerStat(state, choice.stat);
                const diff = DIFFICULTY_LABELS(choice.difficulty);
                const statColor = STAT_COLORS[choice.stat];

                return (
                  <motion.button
                    key={choice.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                    onClick={() => dispatch({ type: 'MISSION_CHOICE', choiceId: choice.id })}
                    className="w-full game-card-interactive p-3 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                            {choice.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1 text-[0.55rem] font-bold ${statColor}`}>
                            {STAT_ICONS[choice.stat]}
                            <span>{STAT_LABELS[choice.stat]}</span>
                            <span className="text-foreground ml-0.5">({statVal})</span>
                          </div>
                          <span className={`text-[0.5rem] font-bold ${diff.color}`}>{diff.label}</span>
                          {choice.effects.bonusReward > 0 && (
                            <span className="text-[0.5rem] text-gold font-semibold">+€{choice.effects.bonusReward}</span>
                          )}
                          {choice.effects.heat > 5 && (
                            <span className="text-[0.5rem] text-blood font-semibold flex items-center gap-0.5">
                              <Flame size={8} /> +{choice.effects.heat}
                            </span>
                          )}
                        </div>
                      </div>
                      <Zap size={16} className="text-muted-foreground mt-1" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Running totals */}
        <div className="flex gap-3 mt-5 text-[0.55rem] text-muted-foreground justify-center">
          {mission.totalReward > 0 && (
            <span className="text-gold font-semibold">+€{mission.totalReward}</span>
          )}
          {mission.totalHeat > 0 && (
            <span className="text-blood font-semibold flex items-center gap-0.5">
              <Flame size={8} /> +{mission.totalHeat}
            </span>
          )}
          {mission.totalCrewDamage > 0 && (
            <span className="text-blood font-semibold flex items-center gap-0.5">
              <Heart size={8} /> -{mission.totalCrewDamage}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MissionResult() {
  const { state, dispatch } = useGame();
  const mission = state.activeMission;
  if (!mission) return null;

  const successCount = mission.log.filter(l => l.includes('✓')).length;
  const partialCount = mission.log.filter(l => l.includes('△')).length;
  const failCount = mission.log.filter(l => l.includes('✗')).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[10000] bg-background flex flex-col items-center justify-center px-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="w-full max-w-md"
      >
        {/* Result icon */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 ${
              mission.success ? 'bg-gold/20' : 'bg-blood/20'
            }`}
          >
            {mission.success ? (
              <Trophy size={32} className="text-gold" />
            ) : (
              <Skull size={32} className="text-blood" />
            )}
          </motion.div>
          <h2 className={`font-display text-2xl uppercase tracking-wider ${
            mission.success ? 'text-gold gold-text-glow' : 'text-blood blood-text-glow'
          }`}>
            {mission.success ? 'MISSIE VOLTOOID' : 'MISSIE MISLUKT'}
          </h2>
        </div>

        {/* Stats */}
        <div className="game-card p-4 mb-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Resultaat</span>
            <div className="flex gap-2">
              <span className="text-emerald font-bold">✓ {successCount}</span>
              <span className="text-gold font-bold">△ {partialCount}</span>
              <span className="text-blood font-bold">✗ {failCount}</span>
            </div>
          </div>
          {mission.totalReward > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Bonus Beloning</span>
              <span className="text-gold font-bold">+€{mission.totalReward}</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Heat</span>
            <span className="text-blood font-bold">+{mission.totalHeat + mission.baseHeat}</span>
          </div>
          {mission.totalCrewDamage > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Crew Schade</span>
              <span className="text-blood font-bold">-{mission.totalCrewDamage} HP</span>
            </div>
          )}
        </div>

        {/* Story log */}
        <div className="game-card p-3 mb-5 max-h-36 overflow-y-auto game-scroll">
          {mission.log.map((entry, i) => (
            <p key={i} className={`text-[0.6rem] py-0.5 ${
              entry.includes('✓') ? 'text-emerald' :
              entry.includes('△') ? 'text-gold' :
              entry.includes('✗') ? 'text-blood' :
              'text-muted-foreground'
            }`}>
              {entry}
            </p>
          ))}
        </div>

        <GameButton variant="gold" size="lg" fullWidth glow onClick={() => dispatch({ type: 'END_MISSION' })}>
          DOORGAAN
        </GameButton>
      </motion.div>
    </motion.div>
  );
}
