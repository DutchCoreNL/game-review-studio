import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { RACES, VEHICLES } from '@/game/constants';
import { RaceDef, RaceType } from '@/game/types';
import { pickRaceNPC, calculateRaceResult, RaceResult } from '@/game/racing';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Flame, Trophy, AlertTriangle, Car } from 'lucide-react';

export function RacingPanel() {
  const { state, dispatch, showToast } = useGame();
  const [selectedRace, setSelectedRace] = useState<RaceType | null>(null);
  const [bet, setBet] = useState(1000);
  const [result, setResult] = useState<RaceResult | null>(null);
  const [racing, setRacing] = useState(false);

  const activeVehicle = VEHICLES.find(v => v.id === state.activeVehicle);
  if (!activeVehicle) return null;

  const isRaceAvailable = (race: RaceDef) => {
    if (race.reqDistrict && !state.ownedDistricts.includes(race.reqDistrict)) return false;
    if (race.reqDay && state.day < race.reqDay) return false;
    return true;
  };

  const handleStartRace = () => {
    if (!selectedRace || state.raceUsedToday || state.money < bet || racing) return;
    const raceDef = RACES.find(r => r.id === selectedRace)!;
    const npc = pickRaceNPC(selectedRace);
    
    setRacing(true);
    setResult(null);

    setTimeout(() => {
      const raceResult = calculateRaceResult(state, selectedRace, bet, npc);
      setResult(raceResult);
      dispatch({ type: 'START_RACE', raceType: selectedRace, bet, result: raceResult });
      setRacing(false);
      
      if (raceResult.won) {
        showToast(`🏆 Gewonnen! +€${Math.floor(bet * raceResult.multiplier).toLocaleString()}`);
      } else {
        showToast(`💀 Verloren! -€${bet.toLocaleString()}`);
      }
    }, 2000);
  };

  const selected = selectedRace ? RACES.find(r => r.id === selectedRace) : null;

  return (
    <div>
      <SectionHeader title="Illegale Races" icon={<Flag size={12} />} badge={state.raceUsedToday ? 'COOLDOWN' : undefined} badgeColor="blood" />

      {state.raceUsedToday && (
        <div className="game-card border-l-[3px] border-l-muted-foreground mb-3">
          <p className="text-[0.55rem] text-muted-foreground">⏳ Je hebt vandaag al geracet. Morgen weer beschikbaar.</p>
        </div>
      )}

      {/* Race selection */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {RACES.map(race => {
          const available = isRaceAvailable(race);
          const isSelected = selectedRace === race.id;
          return (
            <button
              key={race.id}
              disabled={!available || state.raceUsedToday}
              onClick={() => { setSelectedRace(race.id); setBet(race.minBet); setResult(null); }}
              className={`p-2 rounded border text-center transition-all ${
                isSelected
                  ? 'bg-gold/15 border-gold text-gold'
                  : available
                    ? 'bg-muted border-border text-foreground hover:border-gold/50'
                    : 'bg-muted/50 border-border/50 text-muted-foreground opacity-50'
              }`}
            >
              <span className="text-lg block">{race.icon}</span>
              <span className="text-[0.55rem] font-bold block">{race.name}</span>
              <span className="text-[0.4rem] text-muted-foreground block">
                {available ? `€${race.minBet.toLocaleString()}-${race.maxBet.toLocaleString()}` : race.reqDistrict ? `🔒 ${race.reqDistrict}` : `🔒 Dag ${race.reqDay}+`}
              </span>
              <span className="text-[0.4rem] text-blood block">
                <Flame size={8} className="inline" /> +{race.heatGain}
              </span>
            </button>
          );
        })}
      </div>

      {/* Race config */}
      {selected && !state.raceUsedToday && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-card border-l-[3px] border-l-gold mb-3"
        >
          <h4 className="font-bold text-xs mb-1">{selected.name}</h4>
          <p className="text-[0.5rem] text-muted-foreground mb-3">{selected.desc}</p>

          <div className="mb-3">
            <div className="flex justify-between text-[0.5rem] mb-1">
              <span className="text-muted-foreground">Inzet</span>
              <span className="font-bold text-gold">€{bet.toLocaleString()}</span>
            </div>
            <Slider
              value={[bet]}
              min={selected.minBet}
              max={Math.min(selected.maxBet, state.money)}
              step={selected.minBet <= 5000 ? 500 : 2500}
              onValueChange={([v]) => setBet(v)}
            />
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="text-[0.5rem]">
              <span className="text-muted-foreground">Voertuig: </span>
              <span className="font-bold">{activeVehicle.name}</span>
              <span className="text-muted-foreground"> (Spd: {activeVehicle.speed})</span>
            </div>
            <div className="text-[0.45rem] text-blood flex items-center gap-0.5">
              <Flame size={8} /> +{selected.heatGain} heat
            </div>
          </div>

          <GameButton
            variant="gold"
            size="sm"
            fullWidth
            glow
            disabled={racing || state.money < bet}
            onClick={handleStartRace}
          >
            {racing ? '🏁 RACEN...' : `RACE STARTEN — €${bet.toLocaleString()}`}
          </GameButton>
        </motion.div>
      )}

      {/* Racing animation */}
      <AnimatePresence>
        {racing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="game-card border-l-[3px] border-l-gold mb-3 overflow-hidden"
          >
            <div className="flex items-center justify-center gap-3 py-4">
              <motion.div
                animate={{ x: [0, 200] }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              >
                <Car size={24} className="text-gold" />
              </motion.div>
              <motion.span
                className="text-[0.6rem] font-bold text-gold uppercase"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                Race bezig...
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`game-card border-l-[3px] mb-3 ${result.won ? 'border-l-emerald' : 'border-l-blood'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {result.won ? <Trophy size={16} className="text-emerald" /> : <AlertTriangle size={16} className="text-blood" />}
              <h4 className={`font-bold text-sm ${result.won ? 'text-emerald' : 'text-blood'}`}>
                {result.won ? 'GEWONNEN!' : 'VERLOREN!'}
              </h4>
            </div>
            <p className="text-[0.55rem] text-muted-foreground mb-2">{result.narrative}</p>
            <div className="text-[0.5rem] space-y-0.5">
              <p>vs. <span className="font-bold">{result.npc.name}</span> ({result.npc.vehicle})</p>
              {result.won ? (
                <>
                  <p className="text-emerald">💰 +€{Math.floor(bet * result.multiplier).toLocaleString()} ({result.multiplier}x)</p>
                  <p className="text-gold">⭐ +{result.repGain} rep · +{result.xpGain} XP</p>
                </>
              ) : (
                <>
                  <p className="text-blood">💸 -€{bet.toLocaleString()}</p>
                  {result.conditionLoss > 0 && <p className="text-blood">🔧 -{result.conditionLoss}% conditie</p>}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
