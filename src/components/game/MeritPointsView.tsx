import { useGame } from '@/contexts/GameContext';
import { MERIT_NODES, MERIT_CATEGORIES, canUnlockMeritNode, getMeritNodeLevel, MeritCategoryId, MeritNodeDef } from '@/game/meritSystem';
import { ViewWrapper } from './ui/ViewWrapper';
import { SectionHeader } from './ui/SectionHeader';
import { GameBadge } from './ui/GameBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Lock, ChevronRight, Star, Sparkles } from 'lucide-react';
import profileBg from '@/assets/profile-bg.jpg';

export function MeritPointsView() {
  const { state, dispatch } = useGame();
  const [selectedCategory, setSelectedCategory] = useState<MeritCategoryId>('combat');
  const [upgradeFlash, setUpgradeFlash] = useState<string | null>(null);
  const meritPoints = state.meritPoints || 0;
  const meritNodes = state.meritNodes || {};
  const totalInvested = Object.values(meritNodes).reduce((a: number, b: number) => a + (b || 0), 0);

  const handleUpgrade = (nodeId: string) => {
    dispatch({ type: 'UPGRADE_MERIT_NODE', payload: { nodeId } });
    setUpgradeFlash(nodeId);
    setTimeout(() => setUpgradeFlash(null), 800);
  };

  const categoryNodes = MERIT_NODES.filter(n => n.category === selectedCategory);

  return (
    <ViewWrapper bg={profileBg}>
      {/* Cinematic header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
            <Sparkles size={18} className="text-gold" />
          </div>
          <div>
            <h2 className="font-display text-lg text-gold uppercase tracking-widest font-bold">Verdiensten</h2>
            <p className="text-[0.55rem] text-muted-foreground">Permanente passieve bonussen</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GameBadge variant="gold" size="xs">⭐ {meritPoints}</GameBadge>
          <span className="text-[0.45rem] text-muted-foreground">{totalInvested} geïnvesteerd</span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3">
        {MERIT_CATEGORIES.map(cat => {
          const catNodes = MERIT_NODES.filter(n => n.category === cat.id);
          const investedInCat = catNodes.reduce((sum, n) => sum + getMeritNodeLevel(state, n.id), 0);
          const maxInCat = catNodes.reduce((sum, n) => sum + n.maxLevel, 0);
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-gold/20 border border-gold/40 text-gold'
                  : 'bg-muted/30 border border-border/50 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              {investedInCat > 0 && (
                <span className="text-[10px] text-gold ml-0.5">{investedInCat}/{maxInCat}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Nodes */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {categoryNodes.map((node, i) => (
            <MeritNodeCard
              key={node.id}
              node={node}
              currentLevel={getMeritNodeLevel(state, node.id)}
              canUnlock={canUnlockMeritNode(state, node)}
              onUpgrade={() => handleUpgrade(node.id)}
              flashing={upgradeFlash === node.id}
              index={i}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Active bonuses summary */}
      <ActiveBonusesSummary meritNodes={meritNodes} />
    </ViewWrapper>
  );
}

function MeritNodeCard({ node, currentLevel, canUnlock, onUpgrade, flashing, index }: {
  node: MeritNodeDef;
  currentLevel: number;
  canUnlock: { canUnlock: boolean; reason?: string };
  onUpgrade: () => void;
  flashing: boolean;
  index: number;
}) {
  const isMaxed = currentLevel >= node.maxLevel;
  const isLocked = !canUnlock.canUnlock && currentLevel === 0 && !!node.requires;
  const totalBonus = currentLevel * node.bonusPerLevel.value;
  const nextBonus = (currentLevel + 1) * node.bonusPerLevel.value;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative game-card border-l-[3px] transition-all ${
        isMaxed
          ? 'border-l-gold bg-gold/5'
          : isLocked
          ? 'border-l-border opacity-60'
          : 'border-l-border'
      } ${flashing ? 'ring-2 ring-gold/50' : ''}`}
    >
      {flashing && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-gold/20"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      )}

      <div className="flex items-start gap-3">
        <div className={`text-2xl flex-shrink-0 ${isLocked ? 'grayscale opacity-50' : ''}`}>
          {isLocked ? <Lock className="w-6 h-6 text-muted-foreground" /> : node.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">{node.name}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: node.maxLevel }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < currentLevel ? 'bg-gold' : 'bg-muted-foreground/20'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{node.desc}</p>

          {currentLevel > 0 && (
            <div className="mt-1 flex items-center gap-1.5">
              <Star className="w-3 h-3 text-gold" />
              <span className="text-xs text-gold">
                {node.bonusPerLevel.label.replace(/\+?\d+/, `+${totalBonus}`).replace(/-?\d+/, `-${totalBonus}`)}
              </span>
              {!isMaxed && (
                <>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {node.bonusPerLevel.label.replace(/\+?\d+/, `+${nextBonus}`).replace(/-?\d+/, `-${nextBonus}`)}
                  </span>
                </>
              )}
            </div>
          )}

          {!canUnlock.canUnlock && !isMaxed && canUnlock.reason && (
            <p className="text-[10px] text-blood/70 mt-1">{canUnlock.reason}</p>
          )}
          {node.minPlayerLevel && currentLevel === 0 && (
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">Vereist level {node.minPlayerLevel}</p>
          )}
        </div>

        <div className="flex-shrink-0">
          {isMaxed ? (
            <GameBadge variant="gold" size="xs">MAX</GameBadge>
          ) : (
            <button
              onClick={onUpgrade}
              disabled={!canUnlock.canUnlock}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                canUnlock.canUnlock
                  ? 'bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 hover:border-gold/50'
                  : 'bg-muted/30 text-muted-foreground/50 border border-border/30 cursor-not-allowed'
              }`}
            >
              {node.costPerLevel} ⭐
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ActiveBonusesSummary({ meritNodes }: { meritNodes: Record<string, number> }) {
  const activeBonuses = MERIT_NODES
    .filter(n => (meritNodes[n.id] || 0) > 0)
    .map(n => ({
      name: n.name,
      icon: n.icon,
      total: (meritNodes[n.id] || 0) * n.bonusPerLevel.value,
      label: n.bonusPerLevel.label,
    }));

  if (activeBonuses.length === 0) return null;

  return (
    <div className="game-card mt-4">
      <SectionHeader title="Actieve Bonussen" icon={<Star size={12} />} />
      <div className="grid grid-cols-2 gap-1.5">
        {activeBonuses.map(b => (
          <div key={b.name} className="flex items-center gap-1.5 text-xs">
            <span>{b.icon}</span>
            <span className="text-gold font-medium">
              {b.label.replace(/\+?\d+/, `+${b.total}`).replace(/-?\d+/, `-${b.total}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
