import { GeneratedGear, GEAR_RARITY_COLORS, GEAR_RARITY_LABEL, getGearBrandDef, getGearFrameDef, GearModId, GearType } from '@/game/gearGenerator';
import { GEAR_FRAME_IMAGES } from '@/assets/items/arsenal';
import { canUpgradeGear, getGearUpgradeCost, getGearModSwapCost, getAvailableMods, getEffectiveGearStats, getGearMasteryProgress, getGearMasteryTitle } from '@/game/gearUpgrade';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Brain, Heart, Sparkles, ArrowUp, ArrowDown, Wrench, Star, Smartphone } from 'lucide-react';
import { useState } from 'react';

const ACCENT_STYLES = {
  armor: {
    iconBg: 'bg-ice/15 border-ice/40',
    iconText: 'text-ice',
  },
  gadget: {
    iconBg: 'bg-game-purple/15 border-game-purple/40',
    iconText: 'text-game-purple',
  },
} as const;

interface GearCompareProps {
  gear: GeneratedGear;
  currentGear: GeneratedGear | null;
  gearType: GearType;
  onEquip: () => void;
  onSell: () => void;
  onUpgrade: () => void;
  onBack: () => void;
}

function ComparisonStat({ label, newVal, oldVal, icon }: { label: string; newVal: number; oldVal: number; icon: React.ReactNode }) {
  const diff = newVal - oldVal;
  if (newVal === 0 && oldVal === 0) return null;
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[0.5rem] text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[0.55rem] font-bold">{newVal}</span>
        {diff !== 0 && (
          <span className={`text-[0.5rem] font-bold flex items-center gap-0.5 ${diff > 0 ? 'text-emerald' : 'text-blood'}`}>
            {diff > 0 ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
            {Math.abs(diff)}
          </span>
        )}
      </div>
    </div>
  );
}

export function GearCompare({ gear, currentGear, gearType, onEquip, onSell, onUpgrade, onBack }: GearCompareProps) {
  const { state, dispatch, showToast } = useGame();
  const [showModSwap, setShowModSwap] = useState(false);
  const brand = getGearBrandDef(gear.brand);
  const frame = getGearFrameDef(gear.frame);
  const stats = getEffectiveGearStats(gear);
  const mastery = getGearMasteryProgress(gear.masteryXp || 0);
  const masteryTitle = getGearMasteryTitle(gear.frame, mastery.level);

  const oldStats = currentGear ? getEffectiveGearStats(currentGear) : { defense: 0, brains: 0, charm: 0, bonusHP: 0 };
  const upgradeCheck = canUpgradeGear(gear, state.money);

  const isArmor = gearType === 'armor';
  const HeaderIcon = isArmor ? Shield : Smartphone;
  const accent = ACCENT_STYLES[gearType];

  const handleModSwap = (modId: GearModId) => {
    const cost = getGearModSwapCost();
    if (state.money < cost) { showToast('Niet genoeg geld!'); return; }
    dispatch({ type: 'SWAP_GEAR_MOD', gearId: gear.id, gearType, modId });
    showToast(`Mod gewisseld! -€${cost.toLocaleString()}`);
    setShowModSwap(false);
  };

  return (
    <div>
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-[0.55rem] text-muted-foreground hover:text-gold mb-3 transition-colors">
        <ArrowLeft size={12} /> Terug naar arsenaal
      </button>

      {/* Cinematic header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full ${accent.iconBg} flex items-center justify-center`}>
          <HeaderIcon size={18} className={accent.iconText} />
        </div>
        <div>
          <h2 className={`font-display text-base ${GEAR_RARITY_COLORS[gear.rarity]} uppercase tracking-widest font-bold`}>{gear.name}</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[0.45rem] ${brand.color}`}>{brand.icon} {brand.name}</span>
            <GameBadge variant={gear.rarity === 'legendary' ? 'gold' : gear.rarity === 'epic' ? 'purple' : gear.rarity === 'rare' ? 'ice' : gear.rarity === 'uncommon' ? 'emerald' : 'muted'} size="xs">
              {GEAR_RARITY_LABEL[gear.rarity]}
            </GameBadge>
            {gear.isUnique && <GameBadge variant="purple" size="xs">UNIEK</GameBadge>}
          </div>
        </div>
      </div>

      {/* Gear display */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`game-card p-4 mb-3 text-center border ${gear.rarity === 'legendary' ? 'border-gold/50' : gear.rarity === 'epic' ? 'border-game-purple/50' : 'border-border'} ${gear.isUnique ? gear.uniqueGlow || '' : ''}`}
      >
        <img src={GEAR_FRAME_IMAGES[gear.frame]} alt={frame.name} className="w-20 h-20 object-contain mx-auto mb-2 drop-shadow-lg" />
        <div className="text-[0.5rem] text-muted-foreground">Level {gear.level} • {frame.name}</div>
        {gear.lore && <p className="text-[0.45rem] italic text-muted-foreground mt-2 max-w-xs mx-auto">"{gear.lore}"</p>}
      </motion.div>

      {/* Mastery */}
      {(gear.masteryXp || 0) > 0 && (
        <div className="game-card p-3 mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <Star size={10} className="text-gold" />
              <span className="text-[0.5rem] font-bold text-gold">Mastery Level {mastery.level}/5</span>
              {masteryTitle && <span className="text-[0.45rem] text-gold/70 italic ml-1">"{masteryTitle}"</span>}
            </div>
            <span className="text-[0.45rem] text-muted-foreground">{gear.masteryXp}/{mastery.nextXp} XP</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${mastery.progress * 100}%` }} />
          </div>
          {mastery.level > 0 && <p className="text-[0.4rem] text-gold/70 mt-1">+{mastery.level * 2}% stat bonus actief</p>}
        </div>
      )}

      {/* Stat comparison */}
      <div className="game-card p-3 mb-3">
        <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground font-bold mb-2">
          {currentGear ? 'Vergelijking met huidig' : 'Statistieken'}
        </div>
        <ComparisonStat label="Defensie" newVal={stats.defense} oldVal={oldStats.defense} icon={<Shield size={10} className="text-ice" />} />
        <ComparisonStat label="Vernuft" newVal={stats.brains} oldVal={oldStats.brains} icon={<Brain size={10} className="text-game-purple" />} />
        <ComparisonStat label="Charisma" newVal={stats.charm} oldVal={oldStats.charm} icon={<Sparkles size={10} className="text-gold" />} />
        <ComparisonStat label="Bonus HP" newVal={stats.bonusHP} oldVal={oldStats.bonusHP} icon={<Heart size={10} className="text-blood" />} />
      </div>

      {/* Special effect */}
      {gear.specialEffect && (
        <div className="game-card p-3 mb-3">
          <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground font-bold mb-1">Speciaal effect</div>
          <div className="text-[0.5rem] text-game-purple">{gear.specialEffect}</div>
        </div>
      )}

      {/* Upgrade section */}
      <div className="game-card p-3 mb-3">
        <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground font-bold mb-2">
          <Wrench size={8} className="inline mr-1" /> Verbeteren
        </div>
        <GameButton variant="gold" size="sm" fullWidth disabled={!upgradeCheck.canUpgrade} onClick={onUpgrade}>
          <Sparkles size={10} /> UPGRADE Lvl {gear.level}→{gear.level + 1} (€{upgradeCheck.cost.toLocaleString()})
        </GameButton>
        {!upgradeCheck.canUpgrade && upgradeCheck.reason && <p className="text-[0.4rem] text-blood mt-1">{upgradeCheck.reason}</p>}
        <button onClick={() => setShowModSwap(!showModSwap)} className="text-[0.45rem] text-ice hover:text-foreground mt-2 transition-colors">
          🔧 Mod wisselen (€{getGearModSwapCost().toLocaleString()})
        </button>
        {showModSwap && (
          <div className="mt-2 space-y-1">
            {getAvailableMods(gear.mod).map(mod => (
              <button key={mod.id} onClick={() => handleModSwap(mod.id)} className="w-full text-left text-[0.45rem] p-1.5 rounded bg-muted/30 hover:bg-muted/60 transition-colors flex items-center gap-2">
                <span>{mod.icon}</span>
                <span className="font-semibold">{mod.name}</span>
                <span className="text-muted-foreground">{mod.effect}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <GameButton variant="gold" size="lg" fullWidth glow onClick={onEquip}>
          {gear.equipped ? 'AL UITGERUST' : 'UITRUSTEN'}
        </GameButton>
        {!gear.locked && (
          <GameButton variant="muted" size="lg" onClick={onSell}>
            VERKOOP €{gear.sellValue.toLocaleString()}
          </GameButton>
        )}
      </div>
    </div>
  );
}
