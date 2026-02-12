import { motion } from 'framer-motion';
import { VehicleUpgradeType } from '@/game/types';
import { VEHICLE_IMAGES } from '@/assets/items';

interface VehiclePreviewProps {
  vehicleId: string;
  vehicleName: string;
  upgrades: Partial<Record<VehicleUpgradeType, number>>;
  heatLevel: 'safe' | 'warning' | 'critical';
}

const HEAT_BORDER = {
  safe: 'border-emerald/30',
  warning: 'border-gold/40',
  critical: 'border-blood/50',
};

const HEAT_GLOW = {
  safe: '',
  warning: 'shadow-[0_0_12px_hsl(var(--gold)/0.2)]',
  critical: 'shadow-[0_0_16px_hsl(var(--blood)/0.3)]',
};

export function VehiclePreview({ vehicleId, vehicleName, upgrades, heatLevel }: VehiclePreviewProps) {
  const armorLevel = upgrades.armor || 0;
  const speedLevel = upgrades.speed || 0;
  const storageLevel = upgrades.storage || 0;
  const totalUpgrades = armorLevel + speedLevel + storageLevel;
  const imgSrc = VEHICLE_IMAGES[vehicleId];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-lg border ${HEAT_BORDER[heatLevel]} bg-background/60 overflow-hidden mb-2.5 ${HEAT_GLOW[heatLevel]}`}
    >
      {/* Vehicle image */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={vehicleName}
          className="w-full h-24 object-cover"
        />
      ) : (
        <div className="w-full h-24 bg-muted flex items-center justify-center text-muted-foreground text-xs">
          {vehicleName}
        </div>
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

      {/* Heat indicator bar */}
      {heatLevel !== 'safe' && (
        <motion.div
          className={`absolute top-0 left-0 right-0 h-0.5 ${heatLevel === 'critical' ? 'bg-blood' : 'bg-gold'}`}
          animate={heatLevel === 'critical' ? { opacity: [1, 0.4, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {/* Vehicle name & tier badges */}
      <div className="absolute bottom-1.5 left-2.5 flex items-center gap-1.5">
        <span className="text-[0.55rem] font-bold text-foreground uppercase tracking-wider drop-shadow-md">
          {vehicleName}
        </span>
        {totalUpgrades > 0 && (
          <span className="text-[0.45rem] font-bold px-1 py-0.5 rounded bg-gold/20 text-gold border border-gold/30 backdrop-blur-sm">
            +{totalUpgrades}
          </span>
        )}
      </div>

      {/* Upgrade indicators */}
      <div className="absolute bottom-1.5 right-2.5 flex gap-1">
        {armorLevel > 0 && (
          <span className="text-[0.45rem] px-1 py-0.5 rounded bg-ice/20 text-ice border border-ice/30 backdrop-blur-sm">
            🛡️{armorLevel}
          </span>
        )}
        {speedLevel > 0 && (
          <span className="text-[0.45rem] px-1 py-0.5 rounded bg-blood/20 text-blood border border-blood/30 backdrop-blur-sm">
            ⚡{speedLevel}
          </span>
        )}
        {storageLevel > 0 && (
          <span className="text-[0.45rem] px-1 py-0.5 rounded bg-gold/20 text-gold border border-gold/30 backdrop-blur-sm">
            📦{storageLevel}
          </span>
        )}
      </div>
    </motion.div>
  );
}
