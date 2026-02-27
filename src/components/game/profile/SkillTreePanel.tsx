import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { SKILL_NODES, BRANCH_INFO, canUnlockSkill, getSkillLevel, PRESTIGE_CONFIG, LEVEL_GATES, XP_MULTIPLIERS, type SkillBranch } from '@/game/skillTree';
import { SectionHeader } from '../ui/SectionHeader';
import { GameButton } from '../ui/GameButton';
import { StatBar } from '../ui/StatBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Brain, Gem, Star, Crown, Zap, Lock, ChevronRight, Trophy } from 'lucide-react';
import { gameApi } from '@/lib/gameApi';

const BRANCH_ICONS: Record<SkillBranch, React.ReactNode> = {
  muscle: <Swords size={14} />,
  brains: <Brain size={14} />,
  charm: <Gem size={14} />,
};

const BRANCH_COLORS: Record<SkillBranch, string> = {
  muscle: 'border-blood bg-blood/5',
  brains: 'border-ice bg-ice/5',
  charm: 'border-gold bg-gold/5',
};

const BRANCH_ACCENT: Record<SkillBranch, string> = {
  muscle: 'text-blood',
  brains: 'text-ice',
  charm: 'text-gold',
};

export function SkillTreePanel() {
  const { state, dispatch, showToast } = useGame();
  const [activeBranch, setActiveBranch] = useState<SkillBranch>('muscle');
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const unlockedSkills = state.unlockedSkills || [];
  const sp = state.player.skillPoints;
  const prestige = state.prestigeLevel || 0;

  const handleUnlock = async (skillId: string) => {
    setUnlocking(skillId);
    try {
      const result = await gameApi.unlockSkill(skillId);
      if (result.success) {
        // Update local state from server response
        if (result.data) {
          dispatch({ type: 'SYNC_SKILLS', skills: result.data.skills, skillPoints: result.data.skillPoints });
        }
        showToast(result.message);
      } else {
        showToast(result.message, true);
      }
    } catch {
      showToast('Verbindingsfout', true);
    }
    setUnlocking(null);
  };

  const handlePrestige = async () => {
    try {
      const result = await gameApi.prestige();
      if (result.success) {
        showToast(result.message);
        // Reload state
        const stateResult = await gameApi.getState();
        if (stateResult.success && stateResult.data) {
          dispatch({ type: 'SET_STATE', state: stateResult.data as any });
        }
      } else {
        showToast(result.message, true);
      }
    } catch {
      showToast('Verbindingsfout', true);
    }
  };

  const branchNodes = SKILL_NODES.filter(n => n.branch === activeBranch);

  // Calculate XP multipliers for display
  const districtBonus = XP_MULTIPLIERS.districtBonus[state.loc] || 0;
  const streakBonus = Math.min(XP_MULTIPLIERS.streakMax, state.xpStreak || 0) * XP_MULTIPLIERS.streakPerAction;
  const prestigeBonus = prestige * XP_MULTIPLIERS.prestigePerLevel;
  const totalMultiplier = 1 + districtBonus + streakBonus + prestigeBonus;

  return (
    <>
      {/* SP & XP Multiplier Summary */}
      <SectionHeader title="Skill Points" icon={<Star size={12} />} />
      <div className="game-card mb-3">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-bold text-gold">{sp} SP</span>
            <span className="text-[0.5rem] text-muted-foreground ml-2">beschikbaar</span>
          </div>
          <div className="text-right">
            <span className="text-[0.55rem] text-emerald font-semibold">XP ×{totalMultiplier.toFixed(2)}</span>
            <div className="text-[0.4rem] text-muted-foreground space-x-2">
              {districtBonus > 0 && <span>District +{(districtBonus * 100).toFixed(0)}%</span>}
              {streakBonus > 0 && <span>Streak +{(streakBonus * 100).toFixed(0)}%</span>}
              {prestigeBonus > 0 && <span>Prestige +{(prestigeBonus * 100).toFixed(0)}%</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Branch Selector */}
      <div className="flex gap-1.5 mb-3">
        {(['muscle', 'brains', 'charm'] as SkillBranch[]).map(branch => (
          <button
            key={branch}
            onClick={() => setActiveBranch(branch)}
            className={`flex-1 py-2 rounded text-[0.6rem] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
              activeBranch === branch
                ? `${BRANCH_COLORS[branch]} border ${BRANCH_ACCENT[branch]}`
                : 'bg-muted/30 border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {BRANCH_ICONS[branch]}
            {BRANCH_INFO[branch].label}
          </button>
        ))}
      </div>

      {/* Skill Tree Nodes */}
      <SectionHeader title={`${BRANCH_INFO[activeBranch].icon} ${BRANCH_INFO[activeBranch].label} Boom`} />
      <div className="space-y-2 mb-4">
        {branchNodes.map((node, idx) => {
          const currentLevel = getSkillLevel(unlockedSkills, node.id);
          const { canUnlock, reason } = canUnlockSkill(node, unlockedSkills, sp, state.player.level);
          const isMaxed = currentLevel >= node.maxLevel;
          const isLocked = !canUnlock && currentLevel === 0;

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              {/* Connector line */}
              {idx > 0 && (
                <div className="flex justify-center -mt-1 mb-1">
                  <div className={`w-0.5 h-3 ${currentLevel > 0 || branchNodes[idx - 1] && getSkillLevel(unlockedSkills, branchNodes[idx - 1].id) > 0 ? 'bg-gold/40' : 'bg-border'}`} />
                </div>
              )}
              
              <div className={`game-card border-l-[3px] ${
                isMaxed ? `${BRANCH_COLORS[activeBranch]} border-l-emerald` :
                currentLevel > 0 ? `${BRANCH_COLORS[activeBranch]}` :
                isLocked ? 'opacity-50 border-l-border' :
                'border-l-gold/50'
              }`}>
                <div className="flex items-start gap-2.5">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                    isMaxed ? 'bg-emerald/15 border border-emerald/40' :
                    currentLevel > 0 ? `${BRANCH_COLORS[activeBranch]} border border-current/30` :
                    'bg-muted border border-border'
                  }`}>
                    {isLocked ? <Lock size={14} className="text-muted-foreground" /> : node.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${isMaxed ? 'text-emerald' : currentLevel > 0 ? BRANCH_ACCENT[activeBranch] : ''}`}>
                        {node.name}
                      </span>
                      <span className="text-[0.45rem] text-muted-foreground">
                        Lv {currentLevel}/{node.maxLevel}
                      </span>
                      {isMaxed && <span className="text-[0.4rem] text-emerald font-bold">MAX</span>}
                    </div>
                    <p className="text-[0.45rem] text-muted-foreground">{node.desc}</p>
                    
                    {/* Effects */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {node.effects.map((e, i) => (
                        <span key={i} className={`text-[0.4rem] px-1 py-0.5 rounded font-semibold ${
                          currentLevel > 0 ? 'bg-gold/10 text-gold' : 'bg-muted/50 text-muted-foreground'
                        }`}>
                          {e.label}
                        </span>
                      ))}
                    </div>

                    {/* Level bar */}
                    {node.maxLevel > 1 && (
                      <div className="mt-1.5">
                        <StatBar value={currentLevel} max={node.maxLevel} color={isMaxed ? 'emerald' : 'gold'} height="sm" />
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0">
                    {!isMaxed && canUnlock && (
                      <GameButton
                        variant="gold" size="sm"
                        onClick={() => handleUnlock(node.id)}
                        disabled={unlocking === node.id}
                      >
                        {unlocking === node.id ? '...' : `${node.cost} SP`}
                      </GameButton>
                    )}
                    {!isMaxed && !canUnlock && reason && (
                      <span className="text-[0.4rem] text-muted-foreground italic">{reason}</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Level Gates */}
      <SectionHeader title="Content Tiers" icon={<Zap size={12} />} />
      <div className="game-card mb-4">
        <div className="space-y-1">
          {LEVEL_GATES.map(gate => {
            const unlocked = state.player.level >= gate.level;
            return (
              <div key={gate.level} className={`flex items-center gap-2 text-[0.55rem] py-0.5 ${unlocked ? '' : 'opacity-40'}`}>
                <span className={`font-bold w-8 ${unlocked ? 'text-gold' : 'text-muted-foreground'}`}>Lv{gate.level}</span>
                <ChevronRight size={8} className="text-muted-foreground" />
                <span className={unlocked ? 'text-foreground' : 'text-muted-foreground'}>{gate.unlocks.join(', ')}</span>
                {unlocked && <span className="text-emerald ml-auto">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Prestige */}
      <SectionHeader title={`Prestige ${prestige > 0 ? `(Lv ${prestige})` : ''}`} icon={<Crown size={12} />} />
      <div className="game-card mb-4">
        {prestige > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={14} className="text-game-purple" />
            <span className="text-xs font-bold text-game-purple">Prestige {prestige}</span>
            <span className="text-[0.45rem] text-muted-foreground">+{(prestige * 5)}% XP permanent</span>
          </div>
        )}
        
        {PRESTIGE_CONFIG.rewards.map(r => (
          <div key={r.level} className={`flex items-center gap-2 text-[0.5rem] py-0.5 ${prestige >= r.level ? '' : 'opacity-40'}`}>
            <span className="font-bold">{r.reward}</span>
            <span className="text-muted-foreground flex-1">{r.desc}</span>
            {prestige >= r.level && <span className="text-emerald">✓</span>}
          </div>
        ))}

        {state.player.level >= PRESTIGE_CONFIG.requiredLevel && prestige < PRESTIGE_CONFIG.maxPrestige && (
          <GameButton variant="purple" size="sm" className="w-full mt-3" onClick={handlePrestige}>
            PRESTIGE → Level {prestige + 1}
          </GameButton>
        )}
        {state.player.level < PRESTIGE_CONFIG.requiredLevel && (
          <p className="text-[0.45rem] text-muted-foreground italic mt-2">
            Bereik level {PRESTIGE_CONFIG.requiredLevel} om te prestige. (Huidig: {state.player.level})
          </p>
        )}
      </div>
    </>
  );
}
