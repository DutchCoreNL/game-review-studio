import { useGame } from '@/contexts/GameContext';
import { DISTRICTS } from '@/game/constants';
import { NEMESIS_ARCHETYPES, NEMESIS_NEGOTIATE_COST_BASE, NEMESIS_ABILITY_LABELS, NEMESIS_REVENGE_TYPES } from '@/game/constants';
import { negotiateNemesis, scoutNemesis } from '@/game/newFeatures';
import { getPlayerStat } from '@/game/engine';
import { GameButton } from '../ui/GameButton';
import { StatBar } from '../ui/StatBar';
import { motion } from 'framer-motion';
import { Skull, MapPin, Swords, Zap, Clock, Trophy, Handshake, Search, Shield, Users, Flame, AlertTriangle } from 'lucide-react';
import { FAMILIES } from '@/game/constants';

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
  const canFight = isHere && nem.truceDaysLeft === 0;
  const archDef = NEMESIS_ARCHETYPES.find(a => a.id === nem.archetype);
  const charm = getPlayerStat(state, 'charm');
  const brains = getPlayerStat(state, 'brains');
  const hasHacker = state.crew.some(c => c.role === 'Hacker' && c.hp > 0);
  const canNegotiate = charm >= 30 && !nem.negotiatedThisGen && nem.truceDaysLeft === 0;
  const canScout = hasHacker || brains >= 25;
  const negotiateCost = NEMESIS_NEGOTIATE_COST_BASE + nem.generation * 5000;

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

      {/* Archetype badge */}
      {archDef && (
        <div className="flex items-center gap-1.5 mb-2 bg-blood/8 rounded px-2 py-1">
          <span className="text-sm">{archDef.icon}</span>
          <span className="text-[0.6rem] font-bold text-blood">{archDef.name}</span>
          <span className="text-[0.5rem] text-muted-foreground">— {archDef.desc}</span>
        </div>
      )}

      {/* Truce indicator */}
      {nem.truceDaysLeft > 0 && (
        <div className="flex items-center gap-1.5 mb-2 bg-emerald/10 rounded px-2 py-1">
          <Handshake size={12} className="text-emerald" />
          <span className="text-[0.55rem] text-emerald font-bold">BESTAND — {nem.truceDaysLeft} {nem.truceDaysLeft === 1 ? 'dag' : 'dagen'} over</span>
        </div>
      )}

      {/* Claimed district */}
      {nem.claimedDistrict && (
        <div className="flex items-center gap-1.5 mb-1.5 text-[0.5rem] text-muted-foreground">
          <Shield size={10} className="text-blood" />
          <span>Claimt <span className="text-blood font-bold">{DISTRICTS[nem.claimedDistrict]?.name}</span> (+15% inkoop, -10% verkoop)</span>
        </div>
      )}

      {/* Allied faction */}
      {nem.alliedFaction && (
        <div className="flex items-center gap-1.5 mb-1.5 text-[0.5rem] text-muted-foreground">
          <Users size={10} className="text-blood" />
          <span>Bondgenoot: <span className="text-blood font-bold">{FAMILIES[nem.alliedFaction]?.name}</span> (-3 relatie/dag)</span>
        </div>
      )}

      {/* Abilities */}
      {nem.abilities && nem.abilities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {nem.abilities.map(ab => {
            const abDef = NEMESIS_ABILITY_LABELS[ab];
            if (!abDef) return null;
            return (
              <span key={ab} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blood/10 border border-blood/20 text-[0.5rem] text-blood">
                <span>{abDef.icon}</span> {abDef.name}
              </span>
            );
          })}
        </div>
      )}

      {/* Revenge indicator */}
      {nem.revengeActive && nem.revengeDaysLeft > 0 && (
        <div className="flex items-center gap-1.5 mb-2 bg-blood/15 rounded px-2 py-1 border border-blood/30">
          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
            <Flame size={12} className="text-blood" />
          </motion.div>
          <span className="text-[0.55rem] text-blood font-bold">
            WRAAK: {NEMESIS_REVENGE_TYPES[nem.archetype]?.name} — {nem.revengeDaysLeft} {nem.revengeDaysLeft === 1 ? 'dag' : 'dagen'} over
          </span>
        </div>
      )}

      <StatBar value={nem.hp} max={nem.maxHp} color="blood" height="sm" label="HP" showLabel />
      
      {nem.lastAction && (
        <p className="text-[0.5rem] text-muted-foreground mt-1.5 italic">
          Laatste actie: {nem.lastAction}
        </p>
      )}
      {nem.lastReaction && (
        <p className="text-[0.5rem] text-blood/70 mt-0.5 italic">
          Reactie: {nem.lastReaction}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-1.5 mt-2">
        <GameButton
          variant={canFight ? 'blood' : 'muted'}
          size="sm"
          fullWidth
          disabled={!canFight}
          glow={canFight}
          icon={<Swords size={12} />}
          onClick={() => {
            if (!isHere) {
              showToast(`Reis naar ${DISTRICTS[nem.location].name}`, true);
              return;
            }
            dispatch({ type: 'START_NEMESIS_COMBAT' });
          }}
        >
          {isHere ? 'UITDAGEN' : DISTRICTS[nem.location].name.toUpperCase()}
        </GameButton>
        
        <GameButton
          variant={canNegotiate ? 'emerald' : 'muted'}
          size="sm"
          disabled={!canNegotiate || state.money < negotiateCost}
          icon={<Handshake size={12} />}
          onClick={() => {
            const result = negotiateNemesis(JSON.parse(JSON.stringify(state)));
            if (!result.success) {
              showToast(result.message, true);
              return;
            }
            dispatch({ type: 'NEGOTIATE_NEMESIS' });
            showToast(result.message);
          }}
        >
          DEAL
        </GameButton>

        <GameButton
          variant={canScout ? 'purple' : 'muted'}
          size="sm"
          disabled={!canScout}
          icon={<Search size={12} />}
          onClick={() => {
            const result = scoutNemesis(JSON.parse(JSON.stringify(state)));
            if (!result.success) {
              showToast(result.message, true);
              return;
            }
            dispatch({ type: 'SCOUT_NEMESIS' });
            showToast('Informant gestuurd! Check je telefoon.');
          }}
          
        >
          SCOUT
        </GameButton>
      </div>
    </motion.div>
  );
}
