import { GeneratedGear, getGearBrandDef, getGearFrameDef, GEAR_RARITY_COLORS, GEAR_RARITY_BG, GEAR_RARITY_LABEL } from '@/game/gearGenerator';
import { getGearMasteryProgress, getGearMasteryTitle, getEffectiveGearStats } from '@/game/gearUpgrade';
import { GEAR_FRAME_IMAGES } from '@/assets/items/arsenal';
import { GameBadge } from '../ui/GameBadge';
import { motion } from 'framer-motion';
import { Shield, Brain, Heart, Lock, Sparkles, Gem } from 'lucide-react';
import { DURABILITY_PENALTY_THRESHOLD } from '@/game/durability';
import { getEnchantmentDef } from '@/game/enchantments';
import { getSkinDef } from '@/game/weaponSkins';
import { ArsenalStatBar, DurabilityBar, GearMasteryBar } from '../arsenal/SharedStatBars';

interface GearCardProps {
  gear: GeneratedGear;
  compact?: boolean;
  onClick?: () => void;
  actions?: React.ReactNode;
  highlight?: boolean;
  onToggleLock?: () => void;
}

export function GearCard({ gear, compact = false, onClick, actions, highlight = false, onToggleLock }: GearCardProps) {
  const brand = getGearBrandDef(gear.brand);
  const frame = getGearFrameDef(gear.frame);
  const stats = getEffectiveGearStats(gear);
  const durability = gear.durability ?? 100;
  const enchantment = gear.enchantmentId ? getEnchantmentDef(gear.enchantmentId) : null;
  const skin = gear.skinId ? getSkinDef(gear.skinId) : null;
  const skinGlow = skin ? skin.glowClass : '';

  if (compact) {
    return (
      <motion.div
        whileTap={onClick ? { scale: 0.97 } : undefined}
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-all ${GEAR_RARITY_BG[gear.rarity]} ${highlight ? 'ring-1 ring-gold' : ''} ${gear.isUnique ? gear.uniqueGlow || '' : ''} ${skinGlow}`}
      >
        <img src={GEAR_FRAME_IMAGES[gear.frame]} alt={frame.name} className="w-8 h-8 object-contain rounded" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-[0.6rem] font-bold truncate ${GEAR_RARITY_COLORS[gear.rarity]}`}>{gear.name}</span>
            {gear.locked && <Lock size={8} className="text-gold shrink-0" />}
            {gear.equipped && <GameBadge variant="gold" size="xs">DRAAG</GameBadge>}
            {gear.isUnique && <GameBadge variant="purple" size="xs">UNIEK</GameBadge>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {stats.defense > 0 && <span className="text-[0.45rem] text-muted-foreground">DEF {stats.defense}</span>}
            {stats.brains > 0 && <span className="text-[0.45rem] text-muted-foreground">INT {stats.brains}</span>}
            {stats.charm > 0 && <span className="text-[0.45rem] text-muted-foreground">CHR {stats.charm}</span>}
            <span className={`text-[0.45rem] ${brand.color}`}>{brand.icon} {brand.name}</span>
            {enchantment && <span className={`text-[0.4rem] ${enchantment.color}`}>{enchantment.icon}</span>}
            {durability < DURABILITY_PENALTY_THRESHOLD && <span className="text-[0.4rem] text-blood">🔧{durability}%</span>}
            {(gear.masteryXp || 0) > 0 && <span className="text-[0.4rem] text-gold">⭐{getGearMasteryProgress(gear.masteryXp || 0).level}</span>}
          </div>
        </div>
        {onToggleLock && (
          <button onClick={(e) => { e.stopPropagation(); onToggleLock(); }} className="p-1 rounded hover:bg-muted/50 transition-colors">
            <Lock size={10} className={gear.locked ? 'text-gold' : 'text-muted-foreground'} />
          </button>
        )}
        {actions}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      whileTap={onClick ? { scale: 0.97 } : undefined}
      onClick={onClick}
      className={`game-card p-3 rounded border transition-all ${GEAR_RARITY_BG[gear.rarity]} ${highlight ? 'ring-1 ring-gold' : ''} ${onClick ? 'cursor-pointer' : ''} ${gear.isUnique ? gear.uniqueGlow || '' : ''} ${skinGlow}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded overflow-hidden border ${GEAR_RARITY_BG[gear.rarity]}`}>
            <img src={GEAR_FRAME_IMAGES[gear.frame]} alt={frame.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h4 className={`text-xs font-bold ${GEAR_RARITY_COLORS[gear.rarity]}`}>{gear.name}</h4>
              {gear.locked && <Lock size={9} className="text-gold" />}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[0.45rem] ${brand.color} font-semibold`}>{brand.icon} {brand.name}</span>
              <GameBadge variant={gear.rarity === 'legendary' ? 'gold' : gear.rarity === 'epic' ? 'purple' : gear.rarity === 'rare' ? 'ice' : gear.rarity === 'uncommon' ? 'emerald' : 'muted'} size="xs">
                {GEAR_RARITY_LABEL[gear.rarity]}
              </GameBadge>
              {gear.equipped && <GameBadge variant="gold" size="xs">DRAAG</GameBadge>}
              {gear.isUnique && <GameBadge variant="purple" size="xs">UNIEK</GameBadge>}
              {skin && <GameBadge variant="muted" size="xs">{skin.icon} {skin.name}</GameBadge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[0.5rem] text-muted-foreground">Lvl {gear.level}</span>
          {onToggleLock && (
            <button onClick={(e) => { e.stopPropagation(); onToggleLock(); }} className="p-0.5 rounded hover:bg-muted/50 transition-colors">
              <Lock size={10} className={gear.locked ? 'text-gold' : 'text-muted-foreground/40'} />
            </button>
          )}
        </div>
      </div>

      {gear.lore && <p className="text-[0.45rem] italic text-muted-foreground mb-2 px-1">"{gear.lore}"</p>}

      <div className="space-y-1 mb-2">
        {stats.defense > 0 && <ArsenalStatBar label="Defensie" value={stats.defense} max={20} icon={<Shield size={8} />} color="text-ice" />}
        {stats.brains > 0 && <ArsenalStatBar label="Vernuft" value={stats.brains} max={15} icon={<Brain size={8} />} color="text-game-purple" />}
        {stats.charm > 0 && <ArsenalStatBar label="Charisma" value={stats.charm} max={10} icon={<Sparkles size={8} />} color="text-gold" />}
        {stats.bonusHP > 0 && <ArsenalStatBar label="Bonus HP" value={stats.bonusHP} max={30} icon={<Heart size={8} />} color="text-blood" />}
        <DurabilityBar durability={durability} />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {gear.specialEffect && <span className="text-[0.45rem] text-game-purple bg-game-purple/10 px-1.5 py-0.5 rounded">{gear.specialEffect}</span>}
        {enchantment && (
          <span className={`text-[0.45rem] ${enchantment.color} bg-muted/30 px-1.5 py-0.5 rounded border border-current/20`}>
            <Gem size={7} className="inline mr-0.5" />{enchantment.icon} {enchantment.name}: {enchantment.description}
          </span>
        )}
      </div>

      <GearMasteryBar masteryXp={gear.masteryXp || 0} frame={gear.frame} getMasteryProgress={getGearMasteryProgress} getMasteryTitle={getGearMasteryTitle} />

      <div className={`text-[0.45rem] ${brand.color} font-semibold mt-2`}>{brand.icon} Merk bonus: {brand.bonus}</div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <span className="text-[0.45rem] text-muted-foreground">Verkoopwaarde</span>
        <span className="text-[0.5rem] font-bold text-gold">€{gear.sellValue.toLocaleString()}</span>
      </div>

      {actions && <div className="mt-2">{actions}</div>}
    </motion.div>
  );
}
