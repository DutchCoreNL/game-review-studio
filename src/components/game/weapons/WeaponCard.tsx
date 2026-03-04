import { GeneratedWeapon, getBrandDef, getFrameDef, WEAPON_RARITY_COLORS, WEAPON_RARITY_BG, WEAPON_RARITY_LABEL } from '@/game/weaponGenerator';
import { getMasteryProgress, getMasteryTitle, getEffectiveStats } from '@/game/weaponUpgrade';
import { GameBadge } from '../ui/GameBadge';
import { motion } from 'framer-motion';
import { Crosshair, Flame, Zap, Shield, Target, Lock, Star } from 'lucide-react';

interface WeaponCardProps {
  weapon: GeneratedWeapon;
  compact?: boolean;
  onClick?: () => void;
  actions?: React.ReactNode;
  highlight?: boolean;
  onToggleLock?: () => void;
}

function StatBar({ label, value, max, icon, color }: { label: string; value: number; max: number; icon: React.ReactNode; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-1.5">
      <span className={`${color}`}>{icon}</span>
      <span className="text-[0.45rem] text-muted-foreground w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${color.replace('text-', 'bg-')}`}
        />
      </div>
      <span className="text-[0.5rem] font-bold w-5 text-right">{value}</span>
    </div>
  );
}

function MasteryBar({ weapon }: { weapon: GeneratedWeapon }) {
  const mastery = getMasteryProgress(weapon.masteryXp || 0);
  if (mastery.level === 0 && (weapon.masteryXp || 0) === 0) return null;
  const title = getMasteryTitle(weapon.frame, mastery.level);
  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1">
          <Star size={8} className="text-gold" />
          <span className="text-[0.45rem] text-gold font-semibold">Mastery {mastery.level}/5</span>
          {title && <span className="text-[0.4rem] text-gold/70 italic">"{title}"</span>}
        </div>
        <span className="text-[0.4rem] text-muted-foreground">{weapon.masteryXp || 0}/{mastery.nextXp} XP</span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${mastery.progress * 100}%` }}
          className="h-full rounded-full bg-gold"
        />
      </div>
    </div>
  );
}

export function WeaponCard({ weapon, compact = false, onClick, actions, highlight = false, onToggleLock }: WeaponCardProps) {
  const brand = getBrandDef(weapon.brand);
  const frame = getFrameDef(weapon.frame);
  const effectiveStats = getEffectiveStats(weapon);

  if (compact) {
    return (
      <motion.div
        whileTap={onClick ? { scale: 0.97 } : undefined}
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-all ${WEAPON_RARITY_BG[weapon.rarity]} ${highlight ? 'ring-1 ring-gold' : ''} ${weapon.isUnique ? weapon.uniqueGlow || '' : ''}`}
      >
        <span className="text-lg">{frame.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-[0.6rem] font-bold truncate ${WEAPON_RARITY_COLORS[weapon.rarity]}`}>{weapon.name}</span>
            {weapon.locked && <Lock size={8} className="text-gold shrink-0" />}
            {weapon.equipped && <GameBadge variant="gold" size="xs">DRAAG</GameBadge>}
            {weapon.isUnique && <GameBadge variant="purple" size="xs">UNIEK</GameBadge>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[0.45rem] text-muted-foreground">DMG {effectiveStats.damage}</span>
            <span className="text-[0.45rem] text-muted-foreground">ACC {effectiveStats.accuracy}</span>
            <span className={`text-[0.45rem] ${brand.color}`}>{brand.icon} {brand.name}</span>
            {(weapon.masteryXp || 0) > 0 && (
              <span className="text-[0.4rem] text-gold">⭐{getMasteryProgress(weapon.masteryXp || 0).level}</span>
            )}
          </div>
        </div>
        {onToggleLock && (
          <button onClick={(e) => { e.stopPropagation(); onToggleLock(); }} className="p-1 rounded hover:bg-muted/50 transition-colors">
            <Lock size={10} className={weapon.locked ? 'text-gold' : 'text-muted-foreground'} />
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
      className={`game-card p-3 rounded border transition-all ${WEAPON_RARITY_BG[weapon.rarity]} ${highlight ? 'ring-1 ring-gold' : ''} ${onClick ? 'cursor-pointer' : ''} ${weapon.isUnique ? weapon.uniqueGlow || '' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded flex items-center justify-center text-lg border ${WEAPON_RARITY_BG[weapon.rarity]}`}>
            {frame.icon}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h4 className={`text-xs font-bold ${WEAPON_RARITY_COLORS[weapon.rarity]}`}>{weapon.name}</h4>
              {weapon.locked && <Lock size={9} className="text-gold" />}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[0.45rem] ${brand.color} font-semibold`}>{brand.icon} {brand.name}</span>
              <GameBadge variant={weapon.rarity === 'legendary' ? 'gold' : weapon.rarity === 'epic' ? 'purple' : weapon.rarity === 'rare' ? 'ice' : weapon.rarity === 'uncommon' ? 'emerald' : 'muted'} size="xs">
                {WEAPON_RARITY_LABEL[weapon.rarity]}
              </GameBadge>
              {weapon.equipped && <GameBadge variant="gold" size="xs">DRAAG</GameBadge>}
              {weapon.isUnique && <GameBadge variant="purple" size="xs">UNIEK</GameBadge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[0.5rem] text-muted-foreground">Lvl {weapon.level}</span>
          {onToggleLock && (
            <button onClick={(e) => { e.stopPropagation(); onToggleLock(); }} className="p-0.5 rounded hover:bg-muted/50 transition-colors">
              <Lock size={10} className={weapon.locked ? 'text-gold' : 'text-muted-foreground/40'} />
            </button>
          )}
        </div>
      </div>

      {/* Lore for unique weapons */}
      {weapon.lore && (
        <p className="text-[0.45rem] italic text-muted-foreground mb-2 px-1">"{weapon.lore}"</p>
      )}

      {/* Stats */}
      <div className="space-y-1 mb-2">
        <StatBar label="Schade" value={effectiveStats.damage} max={40} icon={<Crosshair size={8} />} color="text-blood" />
        <StatBar label="Accuracy" value={effectiveStats.accuracy} max={10} icon={<Target size={8} />} color="text-ice" />
        <StatBar label="Vuursnelh." value={effectiveStats.fireRate} max={10} icon={<Flame size={8} />} color="text-gold" />
        {!frame.isMelee && (
          <StatBar label="Clip" value={effectiveStats.clipSize} max={60} icon={<Zap size={8} />} color="text-emerald" />
        )}
      </div>

      {/* Extra stats */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {effectiveStats.critChance > 5 && (
          <span className="text-[0.45rem] text-gold bg-gold/10 px-1.5 py-0.5 rounded">💥 {effectiveStats.critChance}% crit</span>
        )}
        {effectiveStats.armorPierce > 0 && (
          <span className="text-[0.45rem] text-blood bg-blood/10 px-1.5 py-0.5 rounded">🛡️ {effectiveStats.armorPierce}% armor pierce</span>
        )}
        {weapon.specialEffect && (
          <span className="text-[0.45rem] text-game-purple bg-game-purple/10 px-1.5 py-0.5 rounded">{weapon.specialEffect}</span>
        )}
      </div>

      {/* Mastery */}
      <MasteryBar weapon={weapon} />

      {/* Brand bonus */}
      <div className={`text-[0.45rem] ${brand.color} font-semibold mt-2`}>
        {brand.icon} Merk bonus: {brand.bonus}
      </div>

      {/* Sell value */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <span className="text-[0.45rem] text-muted-foreground">Verkoopwaarde</span>
        <span className="text-[0.5rem] font-bold text-gold">€{weapon.sellValue.toLocaleString()}</span>
      </div>

      {actions && <div className="mt-2">{actions}</div>}
    </motion.div>
  );
}
