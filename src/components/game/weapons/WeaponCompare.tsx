import { GeneratedWeapon, WEAPON_RARITY_COLORS, WEAPON_RARITY_LABEL, getBrandDef, getFrameDef } from '@/game/weaponGenerator';
import { GameButton } from '../ui/GameButton';
import { GameBadge } from '../ui/GameBadge';
import { SectionHeader } from '../ui/SectionHeader';
import { motion } from 'framer-motion';
import { ArrowLeft, Crosshair, Target, Flame, Zap, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface WeaponCompareProps {
  weapon: GeneratedWeapon;
  currentWeapon: GeneratedWeapon | null;
  onEquip: () => void;
  onSell: () => void;
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

export function WeaponCompare({ weapon, currentWeapon, onEquip, onSell, onBack }: WeaponCompareProps) {
  const brand = getBrandDef(weapon.brand);
  const frame = getFrameDef(weapon.frame);

  const oldDamage = currentWeapon?.damage ?? 0;
  const oldAccuracy = currentWeapon?.accuracy ?? 0;
  const oldFireRate = currentWeapon?.fireRate ?? 0;
  const oldClip = currentWeapon?.clipSize ?? 0;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-[0.55rem] text-muted-foreground hover:text-foreground mb-3 transition-colors">
        <ArrowLeft size={12} /> Terug naar arsenaal
      </button>

      <SectionHeader title={weapon.name} />

      {/* Weapon display */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`game-card p-4 mb-3 text-center border ${weapon.rarity === 'legendary' ? 'border-gold' : weapon.rarity === 'epic' ? 'border-game-purple' : 'border-border'}`}
      >
        <span className="text-4xl block mb-2">{frame.icon}</span>
        <h3 className={`text-sm font-bold font-display ${WEAPON_RARITY_COLORS[weapon.rarity]}`}>{weapon.name}</h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className={`text-[0.5rem] ${brand.color}`}>{brand.icon} {brand.name}</span>
          <GameBadge variant={weapon.rarity === 'legendary' ? 'gold' : weapon.rarity === 'epic' ? 'purple' : weapon.rarity === 'rare' ? 'ice' : weapon.rarity === 'uncommon' ? 'emerald' : 'muted'} size="sm">
            {WEAPON_RARITY_LABEL[weapon.rarity]}
          </GameBadge>
        </div>
      </motion.div>

      {/* Stat comparison */}
      <div className="game-card p-3 mb-3">
        <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground font-bold mb-2">
          {currentWeapon ? 'Vergelijking met huidig wapen' : 'Statistieken'}
        </div>
        <ComparisonStat label="Schade" newVal={weapon.damage} oldVal={oldDamage} icon={<Crosshair size={10} className="text-blood" />} />
        <ComparisonStat label="Accuracy" newVal={weapon.accuracy} oldVal={oldAccuracy} icon={<Target size={10} className="text-ice" />} />
        <ComparisonStat label="Vuursnelheid" newVal={weapon.fireRate} oldVal={oldFireRate} icon={<Flame size={10} className="text-gold" />} />
        {!frame.isMelee && (
          <ComparisonStat label="Clip" newVal={weapon.clipSize} oldVal={oldClip} icon={<Zap size={10} className="text-emerald" />} />
        )}
      </div>

      {/* Special effects */}
      {(weapon.specialEffect || weapon.critChance > 5 || weapon.armorPierce > 0) && (
        <div className="game-card p-3 mb-3">
          <div className="text-[0.5rem] uppercase tracking-wider text-muted-foreground font-bold mb-1">Speciale effecten</div>
          <div className="space-y-1">
            {weapon.critChance > 5 && <div className="text-[0.5rem] text-gold">💥 {weapon.critChance}% kritieke kans</div>}
            {weapon.armorPierce > 0 && <div className="text-[0.5rem] text-blood">🛡️ {weapon.armorPierce}% armor doordringing</div>}
            {weapon.specialEffect && <div className="text-[0.5rem] text-game-purple">{weapon.specialEffect}</div>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <GameButton variant="gold" size="lg" fullWidth glow onClick={onEquip}>
          {weapon.equipped ? 'AL UITGERUST' : 'UITRUSTEN'}
        </GameButton>
        <GameButton variant="muted" size="lg" onClick={onSell}>
          VERKOOP €{weapon.sellValue.toLocaleString()}
        </GameButton>
      </div>
    </div>
  );
}
