import { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import {
  DUNGEON_DEFS, DUNGEON_TIERS, TIER_LABELS,
  getDungeonDef, getDungeonTierDef, canStartDungeon,
  getTimeRemaining, isDungeonComplete,
  type DungeonId, type DungeonTier, type DungeonRunResult,
} from '@/game/dungeons';
import { LOOT_BOX_DEFS, getLootBoxDef } from '@/game/lootBoxes';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import dungeonBg from '@/assets/bg/dungeon-bg.jpg';

type Phase = 'select' | 'dungeon' | 'running' | 'result';

export function DungeonView() {
  const { state, dispatch, showToast } = useGame();
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedDungeon, setSelectedDungeon] = useState<DungeonId | null>(null);
  const [selectedTier, setSelectedTier] = useState<DungeonTier>(1);
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0, totalSeconds: 0 });

  const activeDungeon = state.activeDungeon || null;
  const lastResult = state.lastDungeonResult || null;

  // Detect active run on mount
  useEffect(() => {
    if (activeDungeon) {
      if (isDungeonComplete(activeDungeon)) {
        setPhase('running'); // will show "collect" state
      } else {
        setPhase('running');
      }
    }
  }, []);

  // Timer tick
  useEffect(() => {
    if (phase !== 'running' || !activeDungeon) return;
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(activeDungeon);
      setTimeLeft(remaining);
      if (remaining.totalSeconds <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, activeDungeon]);

  const handleSelectDungeon = (id: DungeonId) => {
    setSelectedDungeon(id);
    setSelectedTier(1);
    setPhase('dungeon');
  };

  const handleStartRun = () => {
    if (!selectedDungeon) return;
    const check = canStartDungeon(selectedTier, state.player?.level || 1, state.energy || 0, activeDungeon);
    if (!check.ok) {
      showToast(check.reason!);
      return;
    }
    dispatch({ type: 'START_DUNGEON', dungeonId: selectedDungeon, tier: selectedTier });
    setPhase('running');
  };

  const handleCollect = () => {
    dispatch({ type: 'COLLECT_DUNGEON' });
    setPhase('result');
  };

  const handleBack = () => {
    setPhase('select');
    setSelectedDungeon(null);
  };

  const isComplete = activeDungeon ? isDungeonComplete(activeDungeon) : false;

  return (
    <div className="relative min-h-full">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={dungeonBg} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 p-4 space-y-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black tracking-wider text-foreground">
            🕳️ RAIDS
          </h1>
          <p className="text-xs text-muted-foreground">
            Start een raid, wacht, en claim je buit
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* ===== DUNGEON SELECT ===== */}
          {phase === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 gap-3"
            >
              {DUNGEON_DEFS.map((d, i) => (
                <motion.button
                  key={d.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => handleSelectDungeon(d.id)}
                  className="p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm text-left
                    hover:border-border hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group relative overflow-hidden"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity"
                    style={{ background: `radial-gradient(circle at center, hsl(${d.glowColor} / 0.4), transparent 70%)` }}
                  />
                  <div className="relative z-10 space-y-2">
                    <div className="text-3xl">{d.icon}</div>
                    <p className={`text-sm font-bold ${d.color}`}>{d.name}</p>
                    <p className="text-[0.55rem] text-muted-foreground leading-relaxed">{d.description}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* ===== TIER SELECT ===== */}
          {phase === 'dungeon' && selectedDungeon && (
            <motion.div
              key="dungeon"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="space-y-4"
            >
              {(() => {
                const d = getDungeonDef(selectedDungeon);
                return (
                  <div className="flex items-center gap-3">
                    <button onClick={handleBack} className="text-muted-foreground hover:text-foreground text-lg">←</button>
                    <span className="text-2xl">{d.icon}</span>
                    <div>
                      <p className={`text-base font-bold ${d.color}`}>{d.name}</p>
                      <p className="text-[0.6rem] text-muted-foreground">Kies moeilijkheid</p>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2">
                {DUNGEON_TIERS.map(t => {
                  const locked = (state.player?.level || 1) < t.minLevel;
                  const isSelected = selectedTier === t.tier;
                  return (
                    <button
                      key={t.tier}
                      onClick={() => !locked && setSelectedTier(t.tier)}
                      disabled={locked}
                      className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${
                        locked
                          ? 'opacity-30 cursor-not-allowed border-border/20 bg-muted/10'
                          : isSelected
                            ? 'border-gold/50 bg-gold/5 scale-[1.01]'
                            : 'border-border/40 bg-card/30 hover:border-border/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{TIER_LABELS[t.tier]}</span>
                          <span className={`text-sm font-bold ${isSelected ? 'text-gold' : 'text-foreground'}`}>
                            {t.name}
                          </span>
                          {locked && <span className="text-[0.5rem] text-blood">Lvl {t.minLevel}+</span>}
                        </div>
                        <span className="text-[0.6rem] text-muted-foreground">{t.durationMinutes} min</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[0.55rem] text-muted-foreground">
                        <span>⚡ {t.energyCost}</span>
                        <span>💰 €{t.moneyRange[0].toLocaleString()}-{t.moneyRange[1].toLocaleString()}</span>
                        <span>⚙️ {t.scrapRange[0]}-{t.scrapRange[1]}</span>
                      </div>
                      {/* Loot box chances */}
                      <div className="flex items-center gap-2 mt-1.5">
                        {Object.entries(t.lootBoxChances).map(([boxTier, chance]) => {
                          const box = getLootBoxDef(boxTier as any);
                          return (
                            <span key={boxTier} className={`text-[0.5rem] ${box.color}`}>
                              {box.icon} {Math.round((chance as number) * 100)}%
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button onClick={handleStartRun} className="w-full" size="lg">
                🔥 Start Raid — Tier {selectedTier}
              </Button>
            </motion.div>
          )}

          {/* ===== ACTIVE RUN ===== */}
          {phase === 'running' && activeDungeon && (
            <motion.div
              key="running"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {(() => {
                const d = getDungeonDef(activeDungeon.dungeonId);
                const t = getDungeonTierDef(activeDungeon.tier);
                return (
                  <>
                    <div className="text-center space-y-2">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-5xl"
                      >
                        {d.icon}
                      </motion.div>
                      <p className={`text-lg font-bold ${d.color}`}>{d.name}</p>
                      <p className="text-xs text-muted-foreground">{TIER_LABELS[activeDungeon.tier]} {t.name}</p>
                    </div>

                    {isComplete ? (
                      <div className="text-center space-y-4">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200 }}
                          className="text-gold text-lg font-black"
                        >
                          ✅ RAID COMPLEET
                        </motion.div>
                        <Button onClick={handleCollect} className="px-8" size="lg">
                          🎁 Claim Buit
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        {/* Timer */}
                        <div className="relative">
                          <div className="text-4xl font-mono font-bold text-foreground tabular-nums">
                            {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                          </div>
                          <p className="text-[0.6rem] text-muted-foreground mt-1">Nog bezig...</p>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: `hsl(${d.glowColor})` }}
                            initial={{ width: '0%' }}
                            animate={{
                              width: `${Math.max(0, 100 - (timeLeft.totalSeconds / (t.durationMinutes * 60)) * 100)}%`,
                            }}
                            transition={{ duration: 1 }}
                          />
                        </div>

                        {/* Flavor texts */}
                        <RunningFlavorText dungeonId={activeDungeon.dungeonId} />
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* ===== RESULT ===== */}
          {phase === 'result' && lastResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {(() => {
                const d = getDungeonDef(lastResult.dungeonId);
                return (
                  <>
                    <div className="text-center space-y-2">
                      <div className="text-4xl">{d.icon}</div>
                      <p className={`text-lg font-bold ${lastResult.success ? 'text-gold' : 'text-blood'}`}>
                        {lastResult.success ? '🏆 RAID GESLAAGD' : '💀 RAID MISLUKT'}
                      </p>
                      {lastResult.bonusText && (
                        <motion.p
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-sm font-bold text-gold"
                        >
                          {lastResult.bonusText}
                        </motion.p>
                      )}
                    </div>

                    {/* Rewards */}
                    <div className="space-y-2">
                      <RewardRow icon="💰" label="Geld" value={`€${lastResult.money.toLocaleString()}`} delay={0.1} />
                      <RewardRow icon="⭐" label="XP" value={`+${lastResult.xp}`} delay={0.2} />
                      {lastResult.scrap > 0 && (
                        <RewardRow icon="⚙️" label="Scrap" value={`+${lastResult.scrap}`} delay={0.3} />
                      )}

                      {/* Loot boxes */}
                      {lastResult.lootBoxRewards.map((boxTier, i) => {
                        const box = getLootBoxDef(boxTier);
                        return (
                          <RewardRow
                            key={`${boxTier}_${i}`}
                            icon={box.icon}
                            label={box.name}
                            value="GEDROPT!"
                            valueColor={box.color}
                            delay={0.4 + i * 0.15}
                            highlight
                          />
                        );
                      })}

                      {lastResult.lootBoxRewards.length === 0 && lastResult.success && (
                        <p className="text-center text-[0.6rem] text-muted-foreground mt-2">
                          Geen loot box dit keer — probeer een hogere tier!
                        </p>
                      )}
                    </div>

                    <Button onClick={handleBack} className="w-full" size="lg">
                      Terug naar Raids
                    </Button>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats footer */}
        {phase === 'select' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-[0.6rem] text-muted-foreground space-y-0.5"
          >
            <p>Totaal raids: {state.dungeonsCompleted || 0}</p>
            <p>⚡ Energie: {state.energy || 0}/{state.maxEnergy || 100}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ===== Sub-components =====

function RewardRow({ icon, label, value, valueColor, delay, highlight }: {
  icon: string; label: string; value: string; valueColor?: string; delay: number; highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`flex items-center justify-between p-2.5 rounded-lg border ${
        highlight ? 'border-gold/30 bg-gold/5' : 'border-border/30 bg-card/30'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={`text-sm font-bold ${valueColor || 'text-foreground'}`}>{value}</span>
    </motion.div>
  );
}

const FLAVOR_TEXTS: Record<DungeonId, string[]> = {
  gang_raid: [
    'Je breekt door de eerste verdedigingslinie...',
    'Schoten galmen door de gangen...',
    'De kluis is in zicht...',
    'Bewakers worden uitgeschakeld...',
  ],
  tunnels: [
    'Duisternis omringt je...',
    'Vreemde geluiden echoën door de tunnels...',
    'Een verborgen kamer gevonden...',
    'Ratten rennen over je voeten...',
  ],
  complex: [
    'Beveiligingscamera\'s omzeild...',
    'Lasergrids gedeactiveerd...',
    'Digitale sloten gekraakt...',
    'Alarmsysteem uitgeschakeld...',
  ],
  docks: [
    'Golven slaan tegen de kade...',
    'Containers worden doorzocht...',
    'Smokkelaars gesignaleerd...',
    'Een scheepswrak bevat schatten...',
  ],
};

function RunningFlavorText({ dungeonId }: { dungeonId: DungeonId }) {
  const [index, setIndex] = useState(0);
  const texts = FLAVOR_TEXTS[dungeonId];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % texts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0.6, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-xs text-muted-foreground italic"
      >
        {texts[index]}
      </motion.p>
    </AnimatePresence>
  );
}
