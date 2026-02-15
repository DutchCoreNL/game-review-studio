import { useState, useEffect } from 'react';
import { useGame } from '@/contexts/GameContext';
import { getEncounterText, getEffectiveDifficulty } from '@/game/missions';
import { getPlayerStat } from '@/game/engine';
import { DISTRICTS, SOLO_OPERATIONS } from '@/game/constants';
import { StatId } from '@/game/types';
import { TypewriterText } from './animations/TypewriterText';
import { motion, AnimatePresence } from 'framer-motion';
import { GameButton } from './ui/GameButton';
import { SOLO_OP_IMAGES } from '@/assets/items';
import encounterBg from '@/assets/items/encounter-bg.jpg';
import { MapPin, Swords, Brain, Heart, Flame, Trophy, Skull, Star, Zap, CloudRain, CloudFog, Sun, CloudLightning, Users, Car, CheckCircle, XCircle, AlertCircle, Lock, Cpu } from 'lucide-react';
import { LockpickGame } from './minigames/LockpickGame';
import { HackingGame } from './minigames/HackingGame';

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

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  rain: <CloudRain size={10} />,
  fog: <CloudFog size={10} />,
  heatwave: <Sun size={10} />,
  storm: <CloudLightning size={10} />,
};

const FEEDBACK_COLORS: Record<string, string> = {
  success: 'from-emerald/30',
  partial: 'from-gold/30',
  fail: 'from-blood/30',
};

export function MissionEncounterView() {
  const { state, dispatch } = useGame();
  const mission = state.activeMission;
  const [feedbackFlash, setFeedbackFlash] = useState<'success' | 'partial' | 'fail' | null>(null);
  const [activeMinigame, setActiveMinigame] = useState<{ type: 'lockpick' | 'hacking'; choiceId: string } | null>(null);

  // Clear flash after animation
  useEffect(() => {
    if (feedbackFlash) {
      const t = setTimeout(() => setFeedbackFlash(null), 800);
      return () => clearTimeout(t);
    }
  }, [feedbackFlash]);

  if (!mission) return null;

  const encounter = mission.encounters[mission.currentEncounter];
  const isFinished = mission.finished;

  if (isFinished) return <MissionResult />;
  if (!encounter) return null;

  const text = getEncounterText(encounter, state.loc);
  const districtName = DISTRICTS[state.loc].name;
  const opBg = mission.type === 'solo' ? SOLO_OP_IMAGES[mission.missionId] : null;

  // Determine which mini-games are available for this mission
  const getMinigameForChoice = (choiceStat: StatId): 'lockpick' | 'hacking' | null => {
    const isStealth = (mission.type === 'contract' && mission.missionId?.includes('stealth')) ||
      ['store_robbery', 'pickpocket', 'car_theft'].includes(mission.missionId);
    const isTech = (mission.type === 'contract' && mission.missionId?.includes('tech')) ||
      ['crypto_heist', 'atm_skimming'].includes(mission.missionId);

    if (choiceStat === 'brains') {
      return isTech ? 'hacking' : isStealth ? 'lockpick' : (Math.random() > 0.5 ? 'hacking' : 'lockpick');
    }
    if (isStealth && choiceStat === 'charm') return 'lockpick';
    if (isTech) return 'hacking';
    return null;
  };

  const handleChoice = (choiceId: string, forceResult?: 'success' | 'fail') => {
    dispatch({ type: 'MISSION_CHOICE', choiceId, forceResult });
    setTimeout(() => {
      const m = state.activeMission;
      if (m && m.choiceResults && m.choiceResults.length > 0) {
        setFeedbackFlash(m.choiceResults[m.choiceResults.length - 1]);
      }
    }, 50);
  };

  const handleMinigameComplete = (success: boolean) => {
    if (!activeMinigame) return;
    const choiceId = activeMinigame.choiceId;
    setActiveMinigame(null);
    handleChoice(choiceId, success ? 'success' : 'fail');
    setFeedbackFlash(success ? 'success' : 'fail');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-background flex flex-col"
    >
      {/* Feedback flash overlay */}
      <AnimatePresence>
        {feedbackFlash && (
          <motion.div
            key="flash"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className={`absolute inset-0 z-50 bg-gradient-to-b ${FEEDBACK_COLORS[feedbackFlash]} to-transparent pointer-events-none`}
          />
        )}
      </AnimatePresence>

      {/* Banner Header with op-specific bg */}
      <div className="flex-none relative h-32 overflow-hidden">
        <img src={opBg || encounterBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          {/* Phase label */}
          {encounter.phase && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 mb-1.5"
            >
              <span className="text-[0.5rem] font-bold text-gold uppercase tracking-[0.2em] bg-gold/10 border border-gold/30 px-2 py-0.5 rounded">
                FASE {mission.currentEncounter + 1}: {encounter.phase}
              </span>
            </motion.div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gold" />
              <span className="text-[0.6rem] text-gold font-bold uppercase tracking-widest">{districtName}</span>
              {mission.approach && mission.approach !== 'standard' && (
                <span className={`text-[0.45rem] font-bold px-1.5 py-0.5 rounded border ${
                  mission.approach === 'cautious' ? 'text-ice border-ice/30 bg-ice/10' : 'text-blood border-blood/30 bg-blood/10'
                }`}>
                  {mission.approach === 'cautious' ? '🛡️ VOORZICHTIG' : '🔥 AGRESSIEF'}
                </span>
              )}
            </div>
            {/* Phase progress dots */}
            <div className="flex items-center gap-2">
              <span className="text-[0.55rem] text-muted-foreground">
                {mission.currentEncounter + 1}/{mission.encounters.length}
              </span>
              <div className="flex gap-1">
                {mission.encounters.map((enc, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i < mission.currentEncounter ? 'bg-gold' :
                      i === mission.currentEncounter ? 'bg-gold animate-pulse ring-2 ring-gold/30' : 'bg-muted'
                    }`} />
                    {enc.phase && (
                      <span className={`text-[0.35rem] uppercase tracking-wider ${
                        i <= mission.currentEncounter ? 'text-gold' : 'text-muted-foreground/50'
                      }`}>
                        {enc.phase.slice(0, 4)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <h2 className="font-display text-sm text-foreground mt-1 uppercase tracking-wider">
            {mission.type === 'solo' ? 'Solo Operatie' : 'Contract Missie'}
            {mission.crewName && <span className="text-gold ml-2">— {mission.crewName}</span>}
          </h2>
        </div>
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
            {/* Atmosphere intro */}
            {encounter.atmosphere && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-[0.6rem] text-muted-foreground italic mb-3 leading-relaxed pl-3 border-l-2 border-l-muted"
              >
                {encounter.atmosphere}
              </motion.p>
            )}

            <div className="game-card border-l-[3px] border-l-gold p-4 mb-5">
              <p className="text-sm text-foreground leading-relaxed font-light">
                <TypewriterText text={text} speed={20} />
              </p>
            </div>

            {/* Choices */}
            <div className="space-y-2.5">
              {encounter.choices.map((choice, idx) => {
                const statVal = getPlayerStat(state, choice.stat);
                const statColor = STAT_COLORS[choice.stat];
                const minigameType = getMinigameForChoice(choice.stat);

                return (
                  <motion.div
                    key={choice.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                  >
                    <button
                      onClick={() => handleChoice(choice.id)}
                      className="w-full game-card-interactive p-3 text-left"
                    >
                      {(() => {
                        const { difficulty: effDiff, weatherMod, crewMod } = getEffectiveDifficulty(state, choice, mission);
                        const effLabel = DIFFICULTY_LABELS(effDiff);
                        return (
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                                  {choice.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className={`flex items-center gap-1 text-[0.55rem] font-bold ${statColor}`}>
                                  {STAT_ICONS[choice.stat]}
                                  <span>{STAT_LABELS[choice.stat]}</span>
                                  <span className="text-foreground ml-0.5">({statVal})</span>
                                </div>
                                <span className={`text-[0.5rem] font-bold ${effLabel.color}`}>{effLabel.label}</span>
                                {weatherMod !== 0 && (
                                  <span className={`text-[0.5rem] font-semibold flex items-center gap-0.5 ${weatherMod > 0 ? 'text-blood' : 'text-emerald'}`}>
                                    {WEATHER_ICONS[state.weather] || null}
                                    {weatherMod > 0 ? `+${weatherMod}` : `${weatherMod}`}
                                  </span>
                                )}
                                {crewMod !== 0 && (
                                  <span className="text-[0.5rem] font-semibold flex items-center gap-0.5 text-ice">
                                    <Users size={8} />
                                    {crewMod}
                                  </span>
                                )}
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
                        );
                      })()}
                    </button>
                    {/* Mini-game alternative button */}
                    {minigameType && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMinigame({ type: minigameType, choiceId: choice.id });
                        }}
                        className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded border border-game-purple/40 bg-game-purple/10 hover:bg-game-purple/20 transition-colors text-game-purple"
                      >
                        {minigameType === 'lockpick' ? <Lock size={10} /> : <Cpu size={10} />}
                        <span className="text-[0.5rem] font-bold uppercase tracking-wider">
                          {minigameType === 'lockpick' ? '🔓 Lockpick Poging' : '💻 Hack Systeem'}
                        </span>
                        <span className="text-[0.4rem] text-muted-foreground ml-1">— Succes = gegarandeerd ✓</span>
                      </button>
                    )}
                  </motion.div>
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
          {mission.totalHeat > 0 && (() => {
            const contract = mission.contractId != null ? state.activeContracts.find(c => c.id === mission.contractId) : null;
            const isTransport = mission.type === 'contract' && contract?.type === 'delivery';
            const vehicleHeatPart = isTransport ? Math.ceil(mission.totalHeat * 0.7) : Math.ceil(mission.totalHeat * 0.3);
            const personalHeatPart = mission.totalHeat - vehicleHeatPart;
            return (
              <>
                {vehicleHeatPart > 0 && (
                  <span className="text-ice font-semibold flex items-center gap-0.5">
                    <Car size={8} /> +{vehicleHeatPart}
                  </span>
                )}
                {personalHeatPart > 0 && (
                  <span className="text-blood font-semibold flex items-center gap-0.5">
                    <Flame size={8} /> +{personalHeatPart}
                  </span>
                )}
              </>
            );
          })()}
          {mission.totalCrewDamage > 0 && (
            <span className="text-blood font-semibold flex items-center gap-0.5">
              <Heart size={8} /> -{mission.totalCrewDamage}
            </span>
          )}
        </div>
      </div>
      {/* Mini-game overlays */}
      {activeMinigame?.type === 'lockpick' && (
        <LockpickGame
          difficulty={Math.min(3, Math.ceil(state.player.level / 5))}
          brainsBonus={getPlayerStat(state, 'brains')}
          onComplete={handleMinigameComplete}
        />
      )}
      {activeMinigame?.type === 'hacking' && (
        <HackingGame
          difficulty={Math.min(3, Math.ceil(state.player.level / 5))}
          brainsBonus={getPlayerStat(state, 'brains')}
          hasHacker={state.crew.some(c => c.role === 'Hacker' && c.hp > 0)}
          onComplete={handleMinigameComplete}
        />
      )}
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
  const opBg = mission.type === 'solo' ? SOLO_OP_IMAGES[mission.missionId] : null;

  const RESULT_ICONS = {
    success: <CheckCircle size={14} className="text-emerald" />,
    partial: <AlertCircle size={14} className="text-gold" />,
    fail: <XCircle size={14} className="text-blood" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[10000] bg-background flex flex-col"
    >
      {/* Background */}
      <div className="absolute inset-0">
        {opBg && <img src={opBg} alt="" className="w-full h-full object-cover opacity-15" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/50" />
      </div>

      <div className="relative z-10 flex flex-col h-full items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-full max-w-md"
        >
          {/* Result icon */}
          <div className="text-center mb-5">
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
            {mission.approach && mission.approach !== 'standard' && (
              <p className={`text-[0.5rem] mt-1 font-bold uppercase tracking-wider ${
                mission.approach === 'cautious' ? 'text-ice' : 'text-blood'
              }`}>
                {mission.approach === 'cautious' ? '🛡️ Voorzichtige Aanpak' : '🔥 Agressieve Aanpak'}
              </p>
            )}
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
            {(() => {
              const totalHeat = mission.totalHeat + mission.baseHeat;
              const contract = mission.contractId != null ? state.activeContracts.find(c => c.id === mission.contractId) : null;
              const isTransport = mission.type === 'contract' && contract?.type === 'delivery';
              const vehicleHeatPart = isTransport ? Math.ceil(totalHeat * 0.7) : Math.ceil(totalHeat * 0.3);
              const personalHeatPart = totalHeat - vehicleHeatPart;
              return (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><Car size={10} className="text-ice" /> Voertuig Heat</span>
                    <span className="text-ice font-bold">+{vehicleHeatPart}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><Flame size={10} className="text-blood" /> Persoonlijke Heat</span>
                    <span className="text-blood font-bold">+{personalHeatPart}</span>
                  </div>
                </>
              );
            })()}
            {mission.totalCrewDamage > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Crew Schade</span>
                <span className="text-blood font-bold">-{mission.totalCrewDamage} HP</span>
              </div>
            )}
          </div>

          {/* Timeline of choices */}
          <div className="game-card p-3 mb-5 max-h-44 overflow-y-auto game-scroll">
            <h4 className="text-[0.5rem] font-bold text-muted-foreground uppercase tracking-wider mb-2">TIJDLIJN</h4>
            <div className="space-y-2">
              {mission.encounters.map((enc, i) => {
                const result = mission.choiceResults?.[i];
                const logEntry = mission.log[i];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2"
                  >
                    {/* Phase indicator */}
                    <div className="flex flex-col items-center gap-0.5 flex-shrink-0 mt-0.5">
                      {result ? RESULT_ICONS[result] : <div className="w-3.5 h-3.5 rounded-full bg-muted" />}
                      {i < mission.encounters.length - 1 && (
                        <div className={`w-0.5 h-4 ${result ? (result === 'success' ? 'bg-emerald/30' : result === 'partial' ? 'bg-gold/30' : 'bg-blood/30') : 'bg-muted'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {enc.phase && (
                        <span className={`text-[0.4rem] font-bold uppercase tracking-wider ${
                          result === 'success' ? 'text-emerald' : result === 'partial' ? 'text-gold' : result === 'fail' ? 'text-blood' : 'text-muted-foreground'
                        }`}>
                          {enc.phase}
                        </span>
                      )}
                      {logEntry && (
                        <p className={`text-[0.55rem] leading-relaxed ${
                          logEntry.includes('✓') ? 'text-emerald/80' :
                          logEntry.includes('△') ? 'text-gold/80' :
                          logEntry.includes('✗') ? 'text-blood/80' :
                          'text-muted-foreground'
                        }`}>
                          {logEntry.replace(/^[✓△✗]\s*/, '')}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <GameButton variant="gold" size="lg" fullWidth glow onClick={() => dispatch({ type: 'END_MISSION' })}>
            DOORGAAN
          </GameButton>
        </motion.div>
      </div>
    </motion.div>
  );
}
