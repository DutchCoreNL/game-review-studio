import { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/hooks/useAuth';
import { gameApi } from '@/lib/gameApi';
import { PvPPlayerInfo } from '@/game/types';
import { SectionHeader } from './ui/SectionHeader';
import { GameButton } from './ui/GameButton';
import { GameBadge } from './ui/GameBadge';
import { StatBar } from './ui/StatBar';
import { ConfirmDialog } from './ConfirmDialog';
import { CooldownTimer } from './header/CooldownTimer';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Shield, Heart, Skull, RefreshCw, Zap, Brain, Trophy, AlertTriangle, User, Eye } from 'lucide-react';
import { PlayerDetailPopup } from './PlayerDetailPopup';
import { Mail } from 'lucide-react';
import { MessagesComposePopup } from './MessagesComposePopup';
import { PvPCombatView } from './PvPCombatView';

interface PlayerTarget extends PvPPlayerInfo {}

interface AttackResult {
  won: boolean;
  stolen?: number;
  damage: number;
  targetHospitalized?: boolean;
  hospitalized?: boolean;
  targetName: string;
  attackerPower: number;
  defenderPower: number;
}

export function PvPAttackView() {
  const { state, dispatch, showToast } = useGame();
  const { user } = useAuth();
  const [players, setPlayers] = useState<PlayerTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [attacking, setAttacking] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<PlayerTarget | null>(null);
  const [lastResult, setLastResult] = useState<AttackResult | null>(null);
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [messageTarget, setMessageTarget] = useState<{ userId: string; username: string } | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PlayerTarget | null>(null);

  const fetchPlayers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await gameApi.listPlayers();
      if (res.success && res.data?.players) {
        setPlayers(res.data.players);
      }
    } catch {
      showToast('Kon spelers niet laden.', true);
    }
    setLoading(false);
  }, [user, showToast]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  // If active PvP combat, show combat view
  if (state.activePvPCombat) {
    return <PvPCombatView />;
  }
    if (!user) return;
    setLoading(true);
    try {
      const res = await gameApi.listPlayers();
      if (res.success && res.data?.players) {
        setPlayers(res.data.players);
      }
    } catch {
      showToast('Kon spelers niet laden.', true);
    }
    setLoading(false);
  }, [user, showToast]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  const executeAttack = async (target: PlayerTarget) => {
    setAttacking(true);
    setConfirmTarget(null);
    try {
      const res = await gameApi.attack(target.userId);
      if (res.success && res.data) {
        setLastResult(res.data as AttackResult);
        showToast(res.message, !res.data.won);
        // Re-fetch players list and sync state
        fetchPlayers();
        const stateRes = await gameApi.getState();
        if (stateRes.success && stateRes.data) {
          // Trigger a state merge (dispatch is not directly available here, but the
          // serverSync hook in GameContext will handle this on next action)
        }
      } else {
        showToast(res.message, true);
      }
    } catch {
      showToast('Aanval mislukt door verbindingsfout.', true);
    }
    setAttacking(false);
  };

  const hasAttackCooldown = state.attackCooldownUntil && new Date(state.attackCooldownUntil) > new Date();
  const hasEnergy = state.energy >= 15;
  const hasNerve = state.nerve >= 10;
  const canAttack = !hasAttackCooldown && hasEnergy && hasNerve && !attacking;

  return (
    <div>
      <SectionHeader title="PvP Aanvallen" icon={<Swords size={12} />} />
      <p className="text-[0.55rem] text-muted-foreground mb-3">
        Val andere spelers in jouw district aan. Steel hun geld en hospitaliseer ze.
      </p>

      {/* Cooldown & resource display */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <CooldownTimer label="Aanval" until={state.attackCooldownUntil} icon={<Swords size={7} />} />
        <div className="flex items-center gap-1 text-[0.5rem]">
          <Zap size={8} className="text-gold" />
          <span className={hasEnergy ? 'text-foreground' : 'text-blood'}>15 Energy</span>
        </div>
        <div className="flex items-center gap-1 text-[0.5rem]">
          <Brain size={8} className="text-blood" />
          <span className={hasNerve ? 'text-foreground' : 'text-blood'}>10 Nerve</span>
        </div>
      </div>

      {/* Last attack result */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`game-card mb-3 border-l-[3px] ${lastResult.won ? 'border-l-emerald bg-emerald/5' : 'border-l-blood bg-blood/5'}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {lastResult.won ? (
                <Trophy size={14} className="text-emerald" />
              ) : (
                <Skull size={14} className="text-blood" />
              )}
              <span className={`font-bold text-xs ${lastResult.won ? 'text-emerald' : 'text-blood'}`}>
                {lastResult.won ? 'GEWONNEN!' : 'VERLOREN!'}
              </span>
            </div>
            <div className="text-[0.5rem] space-y-0.5 text-muted-foreground">
              <p>Tegenstander: <span className="text-foreground font-bold">{lastResult.targetName}</span></p>
              <p>Jouw kracht: <span className="text-gold">{lastResult.attackerPower}</span> vs <span className="text-blood">{lastResult.defenderPower}</span></p>
              {lastResult.won && lastResult.stolen ? (
                <p className="text-emerald font-bold">💰 €{lastResult.stolen.toLocaleString()} gestolen!</p>
              ) : null}
              <p>Schade: <span className="text-blood">{lastResult.damage} HP</span></p>
              {lastResult.targetHospitalized && <p className="text-emerald">🏥 Doelwit gehospitaliseerd!</p>}
              {lastResult.hospitalized && <p className="text-blood">🏥 Je bent gehospitaliseerd!</p>}
            </div>
            <GameButton variant="muted" size="sm" className="mt-2" onClick={() => setLastResult(null)}>
              Sluiten
            </GameButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player list header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.5rem] text-muted-foreground font-bold uppercase tracking-wider">
          Spelers in {state.loc ? state.loc.toUpperCase() : '???'}
        </span>
        <GameButton variant="muted" size="sm" onClick={fetchPlayers} disabled={loading}>
          <RefreshCw size={8} className={loading ? 'animate-spin' : ''} />
        </GameButton>
      </div>

      {/* Player list */}
      {!user ? (
        <div className="game-card text-center py-6">
          <Shield size={24} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground italic">Log in om andere spelers aan te vallen.</p>
        </div>
      ) : loading ? (
        <div className="game-card text-center py-6">
          <RefreshCw size={16} className="text-muted-foreground mx-auto mb-2 animate-spin" />
          <p className="text-xs text-muted-foreground">Spelers laden...</p>
        </div>
      ) : players.length === 0 ? (
        <div className="game-card text-center py-6">
          <Shield size={24} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground italic">
            Geen aanvalbare spelers in dit district.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {players.map((p) => (
            <motion.div
              key={p.userId}
              className="game-card flex items-center gap-2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setViewProfileId(p.userId)}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <User size={8} className="text-muted-foreground" />
                  <span className="font-bold text-xs truncate hover:text-gold transition-colors">{p.username}</span>
                  <GameBadge variant="muted" size="xs">Lv.{p.level}</GameBadge>
                </div>
                <div className="flex items-center gap-1">
                  <Heart size={8} className="text-blood flex-shrink-0" />
                  <StatBar value={p.hp} max={p.maxHp} color="blood" height="sm" />
                  <span className="text-[0.45rem] text-muted-foreground tabular-nums">{p.hp}/{p.maxHp}</span>
                </div>
              </div>
              <div className="flex gap-1">
                {!p.userId.startsWith('bot_') && (
                  <GameButton
                    variant="muted"
                    size="sm"
                    onClick={() => setMessageTarget({ userId: p.userId, username: p.username })}
                  >
                    <Mail size={10} />
                  </GameButton>
                )}
                <GameButton
                  variant={canAttack ? 'blood' : 'muted'}
                  size="sm"
                  disabled={!canAttack}
                  glow={canAttack}
                  onClick={() => setConfirmTarget(p)}
                >
                  <Swords size={10} />
                </GameButton>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Requirements warning */}
      {(!hasEnergy || !hasNerve) && (
        <div className="mt-2 text-[0.45rem] text-blood flex items-center gap-1">
          <AlertTriangle size={8} />
          {!hasEnergy && <span>Niet genoeg energy (15 nodig).</span>}
          {!hasNerve && <span>Niet genoeg nerve (10 nodig).</span>}
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmTarget !== null}
        title="Aanval Bevestigen"
        message={confirmTarget ? `Wil je ${confirmTarget.username} (Lv.${confirmTarget.level}) aanvallen?\n\nKosten: 15 Energy + 10 Nerve\nCooldown: 5 minuten\n\nBij verlies kun je gehospitaliseerd worden!` : ''}
        confirmText="AANVALLEN"
        variant="danger"
        onConfirm={() => { if (confirmTarget) executeAttack(confirmTarget); }}
        onCancel={() => setConfirmTarget(null)}
      />

      {/* Public Profile Popup */}
      {viewProfileId && (
        <PlayerDetailPopup userId={viewProfileId} onClose={() => setViewProfileId(null)} />
      )}

      {/* Compose Message Popup */}
      {messageTarget && (
        <MessagesComposePopup
          targetUserId={messageTarget.userId}
          targetUsername={messageTarget.username}
          onClose={() => setMessageTarget(null)}
        />
      )}
    </div>
  );
}
