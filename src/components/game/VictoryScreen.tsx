import { useGame } from '@/contexts/GameContext';
import { ENDGAME_PHASES } from '@/game/endgame';
import { ACHIEVEMENTS } from '@/game/constants';
import { VictoryRank } from '@/game/types';
import { GameButton } from './ui/GameButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Trophy, Star, Swords, Calendar, Coins, Target, Dices, Users, MapPin, Skull, Medal, RotateCcw, Play, Sparkles } from 'lucide-react';
import victoryBg from '@/assets/items/victory-kingpin.jpg';
import { PrestigeBadge } from './ui/PrestigeBadge';

const RANK_CONFIG: Record<VictoryRank, { label: string; color: string; glow: string; desc: string }> = {
  S: { label: 'LEGENDE', color: 'text-gold', glow: 'glow-gold', desc: 'Perfect gespeeld. Noxhaven knielt.' },
  A: { label: 'MEESTER', color: 'text-gold', glow: 'glow-gold', desc: 'Indrukwekkend. Weinig hadden dit gekund.' },
  B: { label: 'VETERAAN', color: 'text-emerald', glow: 'glow-emerald', desc: 'Solide prestatie. De stad is van jou.' },
  C: { label: 'OVERLEVER', color: 'text-ice', glow: '', desc: 'Het was niet mooi, maar je hebt het gehaald.' },
  D: { label: 'GELUKVOGEL', color: 'text-muted-foreground', glow: '', desc: 'Net aan. Maar een overwinning is een overwinning.' },
};

export function VictoryScreen() {
  const { state, dispatch } = useGame();
  const victory = state.victoryData;

  if (!victory) return null;

  const rankConfig = RANK_CONFIG[victory.rank];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[10000] bg-background/98 flex items-center justify-center p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        className="w-full max-w-[500px] max-h-[90vh] overflow-y-auto game-scroll"
      >
        {/* Hero Banner */}
        <div className="relative h-40 overflow-hidden rounded-t-lg mb-4">
          <img src={victoryBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-end pb-3"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h1 className="font-display text-2xl font-bold tracking-wider text-gold gold-text-glow mb-1">
              NOXHAVEN IS VAN JOU
            </h1>
            <p className="text-xs text-muted-foreground">De stad buigt voor haar nieuwe heerser</p>
          </motion.div>
        </div>

        {/* Rank Card */}
        <motion.div
          className={`game-card border-2 border-gold ${rankConfig.glow} mb-4 text-center py-5`}
          initial={{ scale: 0, rotateY: 180 }}
          animate={{ scale: 1, rotateY: 0 }}
          transition={{ delay: 0.8, type: 'spring' }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Medal size={28} className="text-gold" />
            <span className={`text-4xl font-display font-black ${rankConfig.color}`}>
              {victory.rank}
            </span>
            <Medal size={28} className="text-gold" />
          </div>
          <h2 className={`text-lg font-bold font-display tracking-widest ${rankConfig.color}`}>
            {rankConfig.label}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">{rankConfig.desc}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Star size={12} className="text-gold" />
            <span className="text-sm font-bold text-gold">{victory.score} PUNTEN</span>
            <Star size={12} className="text-gold" />
          </div>
        </motion.div>

        {/* Method */}
        <motion.div
          className="game-card mb-4 text-center"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <p className="text-[0.55rem] text-muted-foreground uppercase tracking-wider mb-1">Veroverings­methode</p>
          <p className="font-bold text-sm text-gold font-display tracking-wider">{victory.method}</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 gap-2 mb-4"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <StatCard icon={<Calendar size={14} />} label="Dagen" value={`${victory.day}`} color="text-foreground" />
          <StatCard icon={<Coins size={14} />} label="Totaal Verdiend" value={`€${victory.totalEarned.toLocaleString()}`} color="text-emerald" />
          <StatCard icon={<Target size={14} />} label="Missies ✓" value={`${victory.missionsCompleted}`} color="text-emerald" />
          <StatCard icon={<Target size={14} />} label="Missies ✗" value={`${victory.missionsFailed}`} color="text-blood" />
          <StatCard icon={<Crown size={14} />} label="Facties Veroverd" value={`${victory.factionsConquered}/3`} color="text-gold" />
          <StatCard icon={<Skull size={14} />} label="Nemesis Verslagen" value={`${victory.nemesisDefeated}x`} color="text-blood" />
          <StatCard icon={<MapPin size={14} />} label="Districten" value={`${victory.districtsOwned}/5`} color="text-ice" />
          <StatCard icon={<Users size={14} />} label="Crew" value={`${victory.crewSize}`} color="text-game-purple" />
          <StatCard icon={<Dices size={14} />} label="Casino +" value={`€${victory.casinoWon.toLocaleString()}`} color="text-gold" />
          <StatCard icon={<Dices size={14} />} label="Casino -" value={`€${victory.casinoLost.toLocaleString()}`} color="text-blood" />
          <StatCard icon={<Trophy size={14} />} label="Achievements" value={`${victory.achievementsUnlocked}/${ACHIEVEMENTS.length}`} color="text-gold" />
          <StatCard icon={<Coins size={14} />} label="Totaal Uitgegeven" value={`€${victory.totalSpent.toLocaleString()}`} color="text-muted-foreground" />
        </motion.div>

        {/* Progression Timeline */}
        <motion.div
          className="game-card mb-4"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <p className="text-[0.55rem] text-muted-foreground uppercase tracking-wider mb-3 text-center">Progressiepad</p>
          <div className="space-y-1.5">
            {ENDGAME_PHASES.map((phase, i) => (
              <div key={phase.id} className="flex items-center gap-2 text-xs">
                <span className="text-base">{phase.icon}</span>
                <span className="font-bold text-gold">{phase.label}</span>
                <span className="text-[0.5rem] text-muted-foreground flex-1">{phase.desc}</span>
                <span className="text-emerald text-[0.5rem] font-bold">✓</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="space-y-2 mt-6"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          <GameButton
            variant="gold"
            size="lg"
            fullWidth
            glow
            icon={<RotateCcw size={14} />}
            onClick={() => dispatch({ type: 'NEW_GAME_PLUS' })}
          >
            NEW GAME+ (MOEILIJKER, BONUSSEN)
          </GameButton>

          {/* Prestige Reset Button */}
          {state.player.level >= 15 && !state.hardcoreMode && (
            <div className="space-y-1">
              <GameButton
                variant="gold"
                size="lg"
                fullWidth
                icon={<Sparkles size={14} />}
                onClick={() => dispatch({ type: 'PRESTIGE_RESET' })}
              >
                PRESTIGE RESET (P{(state.prestigeLevel || 0) + 1})
              </GameButton>
              <div className="text-[0.45rem] text-muted-foreground text-center space-y-0.5">
                <p>Reset naar level 1 met permanente bonussen:</p>
                <p className="text-gold">+5% XP | +€{((state.prestigeLevel || 0) + 1) * 2000} startgeld | +{(state.prestigeLevel || 0) + 1} base stats</p>
                {state.prestigeLevel > 0 && (
                  <div className="flex items-center justify-center gap-1">
                    <span>Huidig:</span>
                    <PrestigeBadge level={state.prestigeLevel} size="sm" />
                  </div>
                )}
              </div>
            </div>
          )}

          <GameButton
            variant="blood"
            size="lg"
            fullWidth
            icon={<Play size={14} />}
            onClick={() => dispatch({ type: 'FREE_PLAY' })}
          >
            VRIJ SPELEN (DOORSPELEN)
          </GameButton>
          <p className="text-[0.45rem] text-muted-foreground text-center mt-2">
            New Game+: Start opnieuw met bonus stats, extra geld, en behoud je achievements.
            {state.newGamePlusLevel > 0 && ` (Huidige NG+ level: ${state.newGamePlusLevel})`}
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="game-card flex items-center gap-2 py-2">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[0.45rem] text-muted-foreground truncate">{label}</p>
        <p className={`text-xs font-bold ${color} truncate`}>{value}</p>
      </div>
    </div>
  );
}
