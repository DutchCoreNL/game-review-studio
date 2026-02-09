import { useGame } from '@/contexts/GameContext';
import { DISTRICTS } from '@/game/constants';
import { GameButton } from '../ui/GameButton';
import { StatBar } from '../ui/StatBar';
import { motion } from 'framer-motion';
import { Skull, MapPin, Swords, Zap, Clock, Trophy } from 'lucide-react';

export function NemesisInfo() {
  const { state, dispatch, showToast } = useGame();
  const nem = state.nemesis;
  if (!nem) return null;

  // All generations defeated
  if (!nem.alive && nem.generation >= 5 && !state.freePlayMode) {
    return (
      <motion.div className="game-card border-l-[3px] border-l-emerald mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={16} className="text-emerald" />
          <h4 className="font-bold text-xs text-emerald">Geen Rivaal Meer</h4>
        </div>
        <p className="text-[0.55rem] text-muted-foreground">De onderwereld is rustig. Alle 5 rivalen zijn uitgeschakeld.</p>
        {nem.defeatedNames.length > 0 && (
          <p className="text-[0.5rem] text-muted-foreground mt-1 italic">
            Verslagen: {[...nem.defeatedNames, nem.name].join(', ')}
          </p>
        )}
      </motion.div>
    );
  }

  // Nemesis is dead, waiting for successor
  if (!nem.alive) {
    const daysLeft = nem.nextSpawnDay - state.day;
    return (
      <motion.div className="game-card border-l-[3px] border-l-muted mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-1">
          <Clock size={16} className="text-muted-foreground" />
          <h4 className="font-bold text-xs text-muted-foreground">Geen Actieve Rivaal</h4>
        </div>
        <p className="text-[0.55rem] text-muted-foreground">
          {daysLeft > 0
            ? `Een opvolger wordt verwacht over ${daysLeft} ${daysLeft === 1 ? 'dag' : 'dagen'}...`
            : 'Een nieuwe rivaal kan elk moment verschijnen...'}
        </p>
        {nem.defeatedNames.length > 0 && (
          <p className="text-[0.5rem] text-muted-foreground mt-1 italic">
            Verslagen: {nem.defeatedNames.join(', ')}
          </p>
        )}
      </motion.div>
    );
  }

  // Active nemesis
  const isHere = state.loc === nem.location;
  const canFight = isHere;

  return (
    <motion.div
      className="game-card border-l-[3px] border-l-blood mb-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded bg-blood/15 flex items-center justify-center">
          <Skull size={16} className="text-blood" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-xs">
            {nem.generation > 1 ? `Rivaal #${nem.generation}: ` : ''}{nem.name}
          </h4>
          <div className="flex items-center gap-2 text-[0.5rem] text-muted-foreground">
            <span className="flex items-center gap-0.5"><Zap size={8} className="text-blood" /> PWR {nem.power}</span>
            <span className="flex items-center gap-0.5"><MapPin size={8} /> {DISTRICTS[nem.location]?.name}</span>
            {nem.defeated > 0 && <span className="text-gold">×{nem.defeated} verslagen</span>}
          </div>
        </div>
      </div>

      <StatBar value={nem.hp} max={nem.maxHp} color="blood" height="sm" label="HP" showLabel />
      {nem.lastAction && (
        <p className="text-[0.5rem] text-muted-foreground mt-1.5 italic">
          Laatste actie: {nem.lastAction}
        </p>
      )}
      <GameButton
        variant={canFight ? 'blood' : 'muted'}
        size="sm"
        fullWidth
        disabled={!canFight}
        glow={canFight}
        icon={<Swords size={12} />}
        className="mt-2"
        onClick={() => {
          if (!isHere) {
            showToast(`Reis naar ${DISTRICTS[nem.location].name}`, true);
            return;
          }
          dispatch({ type: 'START_NEMESIS_COMBAT' });
        }}
      >
        {isHere ? 'UITDAGEN' : `REIS NAAR ${DISTRICTS[nem.location].name.toUpperCase()}`}
      </GameButton>
    </motion.div>
  );
}
