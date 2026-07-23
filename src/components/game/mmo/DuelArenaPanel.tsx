import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Shield, Heart } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { selectDuelOpponents, botToPvPInfo } from '@/game/world/botProfile';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { StatBar } from '../ui/StatBar';
import { PvPCombatView } from '../PvPCombatView';

const DISTRICT_NAMES: Record<string, string> = {
  low: 'Lowrise', port: 'Port Nero', iron: 'Iron Borough', neon: 'Neon Strip', crown: 'Crown Heights',
};

export function DuelArenaPanel({ currentDistrict }: { currentDistrict: string }) {
  const { state, dispatch } = useGame();

  // Online bots in (or near) the current district, ranked as believable duel opponents.
  const nearbyPlayers = useMemo(() => {
    const opponents = selectDuelOpponents(state.world, currentDistrict, state.player.level, 20);
    return opponents.filter(b => b.loc === currentDistrict && b.online).slice(0, 8);
  }, [state.world, currentDistrict, state.player.level]);

  const hasCooldown = state.attackCooldownUntil && new Date(state.attackCooldownUntil) > new Date();
  const canDuel = !hasCooldown && state.energy >= 15 && state.nerve >= 10;

  const handleChallenge = (botId: string) => {
    const bot = state.world?.bots.find(b => b.id === botId);
    if (!bot) return;
    dispatch({ type: 'START_PVP_COMBAT', target: botToPvPInfo(bot) });
  };

  return (
    <div>
      <SectionHeader title="Duel Arena" icon={<Swords size={12} />} badge={`${nearbyPlayers.length} online`} badgeColor="blood" />

      {nearbyPlayers.length === 0 ? (
        <div className="text-center py-4">
          <Shield size={20} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-[0.5rem] text-muted-foreground">
            Geen spelers online in {DISTRICT_NAMES[currentDistrict] || currentDistrict}.
          </p>
          <p className="text-[0.4rem] text-muted-foreground mt-1">
            Reis naar een drukker district om tegenstanders te vinden.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {nearbyPlayers.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-2 py-1.5 rounded bg-card/50 border border-border/50 hover:border-blood/30 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[0.55rem] font-bold text-foreground truncate">{p.name}</span>
                  <span className="text-[0.4rem] text-muted-foreground">Lv.{p.level}</span>
                  <GameBadge variant={(p.combatRating || 1000) > 1200 ? 'gold' : 'muted'} size="xs">
                    ⚔️{p.combatRating || 1000}
                  </GameBadge>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Heart size={7} className="text-blood flex-shrink-0" />
                  <StatBar value={p.hp ?? p.maxHp ?? 100} max={p.maxHp ?? 100} color="blood" height="sm" />
                </div>
              </div>
              <GameButton
                variant={canDuel ? 'blood' : 'muted'}
                size="sm"
                icon={<Swords size={8} />}
                onClick={() => handleChallenge(p.id)}
                disabled={!canDuel}
                className="px-2"
              >
                Duel
              </GameButton>
            </motion.div>
          ))}
        </div>
      )}

      {!canDuel && nearbyPlayers.length > 0 && (
        <p className="text-[0.4rem] text-blood/80 mt-1.5 text-center">
          {hasCooldown ? 'Duel cooldown actief.' : 'Niet genoeg energy/nerve (15 energy + 10 nerve).'}
        </p>
      )}

      {/* Active duel overlay */}
      <AnimatePresence>
        {state.activePvPCombat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-background/95 backdrop-blur-sm overflow-y-auto"
          >
            <div className="max-w-md mx-auto px-3 py-4">
              <PvPCombatView />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
