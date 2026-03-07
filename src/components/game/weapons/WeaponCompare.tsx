import { GeneratedWeapon, WEAPON_RARITY_COLORS, WEAPON_RARITY_LABEL, getBrandDef, getFrameDef, AccessoryId } from '@/game/weaponGenerator';
import { WEAPON_FRAME_IMAGES } from '@/assets/items/arsenal';
import { canUpgradeWeapon, getUpgradeCost, getAccessorySwapCost, getAvailableAccessories, getEffectiveStats, getMasteryProgress, getMasteryTitle } from '@/game/weaponUpgrade';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { useGame } from '@/contexts/GameContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Crosshair, Target, Flame, Zap, ArrowUp, ArrowDown, Wrench, Star, Sparkles, Sword } from 'lucide-react';
import { useState } from 'react';

interface WeaponCompareProps {
  weapon: GeneratedWeapon;
  currentWeapon: GeneratedWeapon | null;
  onEquip: () => void;
  onSell: () => void;
  onUpgrade: () => void;
  onBack: () => void;
}

function ComparisonStat({ label, newVal, oldVal, icon }: { label: string; newVal: number; oldVal: number; icon: React.ReactNode }) {
  const diff = newVal - oldVal;
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

export function WeaponCompare({ weapon, currentWeapon, onEquip, onSell, onUpgrade, onBack }: WeaponCompareProps) {
  const { state, dispatch, showToast } = useGame();
  const [showAccessorySwap, setShowAccessorySwap] = useState(false);
  const brand = getBrandDef(weapon.brand);
  const frame = getFrameDef(weapon.frame);
  const effectiveStats = getEffectiveStats(weapon);
  const mastery = getMasteryProgress(weapon.masteryXp || 0);
  const masteryTitle = getMasteryTitle(weapon.frame, mastery.level);

  const oldStats = currentWeapon ? getEffectiveStats(currentWeapon) : { damage: 0, accuracy: 0, fireRate: 0, clipSize: 0, critChance: 0, armorPierce: 0 };

  const upgradeCheck = canUpgradeWeapon(weapon, state.money);

  const handleAccessorySwap = (accessoryId: AccessoryId) => {
    const cost = getAccessorySwapCost();
    if (state.money < cost) {
      showToast('Niet genoeg geld!');
      return;
    }
    dispatch({ type: 'SWAP_WEAPON_ACCESSORY', weaponId: weapon.id, accessoryId });
    showToast(`Accessoire gewisseld! -€${cost.toLocaleString()}`);
    setShowAccessorySwap(false);
  };

  return (
    <div>
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-[0.55rem] text-muted-foreground hover:text-gold mb-3 transition-colors">
        <ArrowLeft size={12} /> Terug naar arsenaal
      </button>

      {/* Cinematic header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
          <Sword size={18} className="text-gold" />
        </div>
        <div>
          <h2 className={`font-display text-base ${WEAPON_RARITY_COLORS[weapon.rarity]} uppercase tracking-widest font-bold`}>{weapon.name}</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[0.45rem] ${brand.color}`}>{brand.icon} {brand.name}</span>
            <GameBadge variant={weapon.rarity === 'legendary' ? 'gold' : weapon.rarity === 'epic' ? 'purple' : weapon.rarity === 'rare' ? 'ice' : weapon.rarity === 'uncommon' ? 'emerald' : 'muted'} size="xs">
              {WEAPON_RARITY_LABEL[weapon.rarity]}
            </GameBadge>
            {weapon.isUnique && <GameBadge variant="purple" size="xs">UNIEK</GameBadge>}
          </div>
        </div>
      </div>

      {/* Weapon display */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`game-card p-4 mb-3 text-center border ${weapon.rarity === 'legendary' ? 'border-gold/50' : weapon.rarity === 'epic' ? 'border-game-purple/50' : 'border-border'} ${weapon.isUnique ? weapon.uniqueGlow || '' : ''}`}
      >
        <img src={WEAPON_FRAME_IMAGES[weapon.frame]} alt={frame.name} className="w-20 h-20 object-contain mx-auto mb-2 drop-shadow-lg" />
        <div className="text-[0.5rem] text-muted-foreground">Level {weapon.level} • {frame.name}</div>
        {weapon.lore && (
          <p className="text-[0.45rem] italic text-muted-foreground mt-2 max-w-xs mx-auto">"{weapon.lore}"</p>
        )}
      </motion.div>

      {/* Mastery */}
      {(weapon.masteryXp || 0) > 0 && (
        <div className="game-card p-3 mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <Star size={10} className="text-gold" />
              <span className="text-[0.5rem] font-bold text-gold">Mastery Level {mastery.level}/5</span>
              {masteryTitle && <span className="text-[0.45rem] text-gold/70 italic ml-1">"{masteryTitle}"</span>}
            </div>
            <span className="text-[0.45rem] text-muted-foreground">{weapon.masteryXp}/{mastery.nextXp} XP</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${mastery.progress * 100}%` }} />
          </div>
          {mastery.level > 0 && (
            <p className="text-[0.4rem] text-gold/70 mt-1">+{mastery.level * 2}% stat bonus actief</p>
          )}
        </div>
      )}

      {/* Stat comparison */}
      <div className="game-card p-3 mb-3">
        <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground font-bold mb-2">
          {currentWeapon ? 'Vergelijking met huidig wapen' : 'Statistieken'}
        </div>
        <ComparisonStat label="Schade" newVal={effectiveStats.damage} oldVal={oldStats.damage} icon={<Crosshair size={10} className="text-blood" />} />
        <ComparisonStat label="Accuracy" newVal={effectiveStats.accuracy} oldVal={oldStats.accuracy} icon={<Target size={10} className="text-ice" />} />
        <ComparisonStat label="Vuursnelheid" newVal={effectiveStats.fireRate} oldVal={oldStats.fireRate} icon={<Flame size={10} className="text-gold" />} />
        {!frame.isMelee && (
          <ComparisonStat label="Clip" newVal={effectiveStats.clipSize} oldVal={oldStats.clipSize} icon={<Zap size={10} className="text-emerald" />} />
        )}
        <div className="border-t border-border mt-1 pt-1">
          <div className="flex items-center justify-between text-[0.5rem]">
            <span className="text-muted-foreground">DPS (schade × vuursnelheid)</span>
            <span className="font-bold text-gold">{effectiveStats.damage * effectiveStats.fireRate}</span>
          </div>
        </div>
      </div>

      {/* Special effects */}
      {(weapon.specialEffect || effectiveStats.critChance > 5 || effectiveStats.armorPierce > 0) && (
        <div className="game-card p-3 mb-3">
          <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground font-bold mb-1">Speciale effecten</div>
          <div className="space-y-1">
            {effectiveStats.critChance > 5 && <div className="text-[0.5rem] text-gold">💥 {effectiveStats.critChance}% kritieke kans</div>}
            {effectiveStats.armorPierce > 0 && <div className="text-[0.5rem] text-blood">🛡️ {effectiveStats.armorPierce}% armor doordringing</div>}
            {weapon.specialEffect && <div className="text-[0.5rem] text-game-purple">{weapon.specialEffect}</div>}
          </div>
        </div>
      )}

      {/* Upgrade section */}
      <div className="game-card p-3 mb-3">
        <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground font-bold mb-2">
          <Wrench size={8} className="inline mr-1" /> Verbeteren
        </div>
        <div className="flex gap-2">
          <GameButton
            variant="gold"
            size="sm"
            fullWidth
            disabled={!upgradeCheck.canUpgrade}
            onClick={onUpgrade}
          >
            <Sparkles size={10} /> UPGRADE Lvl {weapon.level}→{weapon.level + 1} (€{upgradeCheck.cost.toLocaleString()})
          </GameButton>
        </div>
        {!upgradeCheck.canUpgrade && upgradeCheck.reason && (
          <p className="text-[0.4rem] text-blood mt-1">{upgradeCheck.reason}</p>
        )}
        <button
          onClick={() => setShowAccessorySwap(!showAccessorySwap)}
          className="text-[0.45rem] text-ice hover:text-foreground mt-2 transition-colors"
        >
          🔧 Accessoire wisselen (€{getAccessorySwapCost().toLocaleString()})
        </button>
        {showAccessorySwap && (
          <div className="mt-2 space-y-1">
            {getAvailableAccessories(weapon.accessory).map(acc => (
              <button
                key={acc.id}
                onClick={() => handleAccessorySwap(acc.id)}
                className="w-full text-left text-[0.45rem] p-1.5 rounded bg-muted/30 hover:bg-muted/60 transition-colors flex items-center gap-2"
              >
                <span>{acc.icon}</span>
                <span className="font-semibold">{acc.name}</span>
                <span className="text-muted-foreground">{acc.effect}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <GameButton variant="gold" size="lg" fullWidth glow onClick={onEquip}>
          {weapon.equipped ? 'AL UITGERUST' : 'UITRUSTEN'}
        </GameButton>
        {!weapon.locked && (
          <GameButton variant="muted" size="lg" onClick={onSell}>
            VERKOOP €{weapon.sellValue.toLocaleString()}
          </GameButton>
        )}
      </div>
    </div>
  );
}
