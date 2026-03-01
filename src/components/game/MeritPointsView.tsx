import { useGame } from '@/contexts/GameContext';
import { MERIT_NODES, MERIT_CATEGORIES, canUnlockMeritNode, getMeritNodeLevel, MeritCategoryId, MeritNodeDef } from '@/game/meritSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Lock, ChevronRight, Star, Sparkles } from 'lucide-react';

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Merit Punten
          </h2>
          <p className="text-xs text-muted-foreground">Investeer in permanente passieve bonussen</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
            <span className="text-yellow-400 font-bold text-sm">⭐ {meritPoints}</span>
            <span className="text-yellow-400/60 text-xs ml-1">beschikbaar</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
            <span className="text-muted-foreground text-xs">{totalInvested} geïnvesteerd</span>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
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
                  ? 'bg-primary/20 border border-primary/40 text-primary'
                  : 'bg-muted/30 border border-border/50 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              {investedInCat > 0 && (
                <span className="text-[10px] text-yellow-400 ml-0.5">{investedInCat}/{maxInCat}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Nodes grid */}
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
    </div>
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
      className={`relative p-3 rounded-lg border transition-all ${
        isMaxed
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : isLocked
          ? 'bg-muted/20 border-border/30 opacity-60'
          : 'bg-card/50 border-border/50 hover:border-primary/30'
      } ${flashing ? 'ring-2 ring-yellow-400/50' : ''}`}
    >
      {flashing && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-yellow-400/20"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`text-2xl flex-shrink-0 ${isLocked ? 'grayscale opacity-50' : ''}`}>
          {isLocked ? <Lock className="w-6 h-6 text-muted-foreground" /> : node.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">{node.name}</span>
            {/* Level pips */}
            <div className="flex gap-0.5">
              {Array.from({ length: node.maxLevel }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < currentLevel ? 'bg-yellow-400' : 'bg-muted-foreground/20'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{node.desc}</p>

          {/* Current bonus */}
          {currentLevel > 0 && (
            <div className="mt-1 flex items-center gap-1.5">
              <Star className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-yellow-400">
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

          {/* Requirements */}
          {!canUnlock.canUnlock && !isMaxed && canUnlock.reason && (
            <p className="text-[10px] text-red-400/70 mt-1">{canUnlock.reason}</p>
          )}
          {node.minPlayerLevel && currentLevel === 0 && (
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">Vereist level {node.minPlayerLevel}</p>
          )}
        </div>

        {/* Upgrade button */}
        <div className="flex-shrink-0">
          {isMaxed ? (
            <div className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-bold">MAX</div>
          ) : (
            <button
              onClick={onUpgrade}
              disabled={!canUnlock.canUnlock}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                canUnlock.canUnlock
                  ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 hover:border-yellow-500/50'
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
    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
      <h3 className="text-xs font-bold text-muted-foreground mb-2">ACTIEVE BONUSSEN</h3>
      <div className="grid grid-cols-2 gap-1.5">
        {activeBonuses.map(b => (
          <div key={b.name} className="flex items-center gap-1.5 text-xs">
            <span>{b.icon}</span>
            <span className="text-yellow-400 font-medium">
              {b.label.replace(/\+?\d+/, `+${b.total}`).replace(/-?\d+/, `-${b.total}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
