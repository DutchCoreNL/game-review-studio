/**
 * TerritoryHeatmap — SVG overlay for CityMap showing gang influence intensity,
 * contested zones, and active war pulses.
 */
import { motion } from 'framer-motion';
import type { GangTerritoryInfo, DistrictData } from '@/hooks/useDistrictData';
import type { DistrictId } from '@/game/types';

// Same zones as CityMap
const DISTRICT_ZONES: Record<DistrictId, { x: number; y: number; w: number; h: number }> = {
  port:  { x: 30,  y: 50,  w: 100, h: 65 },
  crown: { x: 270, y: 40,  w: 110, h: 75 },
  iron:  { x: 30,  y: 185, w: 110, h: 65 },
  low:   { x: 275, y: 195, w: 100, h: 60 },
  neon:  { x: 155, y: 145, w: 100, h: 60 },
};

function gangHue(tag: string): number {
  return tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
}

interface Props {
  districtData: DistrictData;
  activeWars?: { district_id?: string; attacker_gang_id: string; defender_gang_id: string }[];
}

export function TerritoryHeatmap({ districtData, activeWars = [] }: Props) {
  const { territories } = districtData;

  // Build per-district influence map
  const districtInfluence: Record<string, GangTerritoryInfo[]> = {};
  territories.forEach(t => {
    if (!districtInfluence[t.district_id]) districtInfluence[t.district_id] = [];
    districtInfluence[t.district_id].push(t);
  });

  // Detect contested districts (2+ gangs or active war)
  const warDistricts = new Set(activeWars.map(w => w.district_id).filter(Boolean));
  const contested = new Set<string>();
  for (const [did, gangs] of Object.entries(districtInfluence)) {
    if (gangs.length > 1 || warDistricts.has(did)) contested.add(did);
  }

  return (
    <g pointerEvents="none">
      {/* Influence intensity fill */}
      {territories.map(t => {
        const zone = DISTRICT_ZONES[t.district_id as DistrictId];
        if (!zone) return null;
        const hue = gangHue(t.gang_tag);
        const intensity = Math.min(1, t.total_influence / 200);
        const opacity = 0.03 + intensity * 0.12;

        return (
          <motion.rect
            key={`heat-${t.district_id}-${t.gang_id}`}
            x={zone.x} y={zone.y} width={zone.w} height={zone.h}
            rx="4"
            fill={`hsla(${hue}, 60%, 45%, ${opacity})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        );
      })}

      {/* Contested pulse effect */}
      {Array.from(contested).map(did => {
        const zone = DISTRICT_ZONES[did as DistrictId];
        if (!zone) return null;
        const cx = zone.x + zone.w / 2;
        const cy = zone.y + zone.h / 2;
        const isWar = warDistricts.has(did);

        return (
          <g key={`contested-${did}`}>
            {/* Pulsing border */}
            <motion.rect
              x={zone.x} y={zone.y} width={zone.w} height={zone.h}
              rx="4" fill="none"
              stroke={isWar ? 'hsla(0, 70%, 50%, 0.5)' : 'hsla(30, 80%, 50%, 0.4)'}
              strokeWidth={isWar ? 2 : 1.5}
              strokeDasharray={isWar ? '3 2' : '5 3'}
              animate={{ 
                strokeOpacity: [0.5, 0.2, 0.5],
                strokeDashoffset: [0, 10],
              }}
              transition={{ duration: isWar ? 1 : 2, repeat: Infinity, ease: 'linear' }}
            />
            {/* War explosion pulse */}
            {isWar && (
              <motion.circle
                cx={cx} cy={cy} r="8"
                fill="none"
                stroke="hsla(0, 70%, 50%, 0.3)"
                strokeWidth="1"
                animate={{ r: [8, 25, 8], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
            {/* Contested icon */}
            <motion.text
              x={cx} y={zone.y + 8} textAnchor="middle"
              fontSize="5" fill={isWar ? 'hsla(0, 70%, 60%, 0.8)' : 'hsla(30, 80%, 60%, 0.7)'}
              animate={{ opacity: [0.8, 0.4, 0.8] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {isWar ? '⚔️' : '⚡'}
            </motion.text>
          </g>
        );
      })}

      {/* Defense level indicators */}
      {territories.filter(t => t.defense_level > 0).map(t => {
        const zone = DISTRICT_ZONES[t.district_id as DistrictId];
        if (!zone) return null;
        const shields = Math.min(3, t.defense_level);
        const hue = gangHue(t.gang_tag);
        
        return (
          <g key={`def-${t.district_id}`}>
            {Array.from({ length: shields }).map((_, i) => (
              <motion.circle
                key={i}
                cx={zone.x + zone.w - 6 - i * 5}
                cy={zone.y + zone.h - 6}
                r="2.5"
                fill={`hsla(${hue}, 50%, 50%, 0.6)`}
                stroke={`hsla(${hue}, 50%, 60%, 0.8)`}
                strokeWidth="0.5"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}
