/**
 * Safehouse Raids System
 * Enemy factions can attack safehouses based on heat and hostile relations.
 * Defense is based on safehouse upgrades, crew, and district rep.
 */

import type { GameState, NightReportData, DistrictId, FamilyId } from './types';
import { addPhoneMessage } from './newFeatures';

const RAID_BASE_CHANCE = 0.08; // 8% per turn per safehouse
const RAID_NAMES = [
  'Los Muertos', 'De Schaduwjagers', 'Sector 7', 'Black Viper Crew',
  'De IJzeren Vuist', 'Nachtwacht', 'Rogue Unit', 'De Bloedbroeders',
];

export interface SafehouseRaidResult {
  district: DistrictId;
  attackerName: string;
  won: boolean;
  details: string;
  loot?: number;
}

/** Check if a safehouse raid occurs and resolve it */
export function processSafehouseRaids(state: GameState, report: NightReportData): void {
  if (!state.safehouses || state.safehouses.length === 0) return;
  if (state.hidingDays > 0) return; // safe while hiding

  for (const safehouse of state.safehouses) {
    // Calculate raid chance
    let raidChance = RAID_BASE_CHANCE;

    // Higher personal heat = more raids
    const pH = state.personalHeat || 0;
    if (pH > 40) raidChance += 0.05;
    if (pH > 70) raidChance += 0.08;

    // Hostile factions in the same district increase chance
    const hostileFactions = (['cartel', 'syndicate', 'bikers'] as FamilyId[])
      .filter(fid => (state.familyRel[fid] || 0) < -30);
    raidChance += hostileFactions.length * 0.03;

    // District ownership reduces raid chance
    if (state.ownedDistricts.includes(safehouse.district)) {
      raidChance *= 0.5;
    }

    // Reinforced upgrade reduces chance
    if (safehouse.upgrades.includes('reinforced')) {
      raidChance *= 0.6;
    }

    // Comms upgrade gives early warning (reduces chance)
    if (safehouse.upgrades.includes('comms')) {
      raidChance *= 0.7;
    }

    // Skip if no raid
    if (Math.random() > raidChance) continue;

    // Raid happens!
    const attackerName = RAID_NAMES[Math.floor(Math.random() * RAID_NAMES.length)];
    
    // Calculate defense score
    let defense = 10; // base defense
    defense += safehouse.level * 15; // level bonus
    if (safehouse.upgrades.includes('reinforced')) defense += 20;
    if (safehouse.upgrades.includes('vault')) defense += 10;
    if (safehouse.upgrades.includes('garage')) defense += 5;
    
    // Crew in the same district helps defend
    const crewDefense = state.crew
      .filter(c => c.hp > 30)
      .reduce((sum, c) => sum + c.level * 3 + (c.role === 'Enforcer' ? 10 : 0), 0);
    defense += Math.min(crewDefense, 40); // cap crew contribution

    // District rep helps
    const distRep = state.districtRep[safehouse.district] || 0;
    defense += Math.floor(distRep / 5);

    // Attack strength scales with day
    const attackStrength = 20 + Math.floor(state.day * 1.5) + Math.floor(Math.random() * 20);

    const won = defense >= attackStrength;

    if (won) {
      // Successful defense
      const loot = Math.floor(500 + Math.random() * 1000 + state.day * 50);
      state.money += loot;
      state.stats.totalEarned += loot;
      state.rep += 5;
      
      // Crew gets XP for defending
      state.crew.forEach(c => {
        if (c.hp > 30) {
          c.xp += 5;
          // Loyalty boost for defending together
          c.loyalty = Math.min(100, (c.loyalty || 75) + 3);
        }
      });

      report.safehouseRaid = {
        district: safehouse.district,
        attackerName,
        won: true,
        details: `${attackerName} viel je safehouse in ${safehouse.district} aan! Je verdediging hield stand (${defense} vs ${attackStrength}).`,
        loot,
      };

      addPhoneMessage(state, 'anonymous', `⚔️ Aanval afgeslagen bij je safehouse in ${safehouse.district}! Buitgemaakt: €${loot}.`, 'info');
    } else {
      // Failed defense — lose resources
      const moneyLost = Math.floor(state.money * 0.08);
      state.money = Math.max(0, state.money - moneyLost);
      
      // Crew takes damage
      state.crew.forEach(c => {
        if (c.hp > 0) {
          const dmg = Math.floor(Math.random() * 20) + 5;
          c.hp = Math.max(1, c.hp - dmg);
          // Loyalty hit from failed defense
          c.loyalty = Math.max(0, (c.loyalty || 75) - 3);
        }
      });

      // Safehouse may lose an upgrade
      let upgradeLost: string | undefined;
      if (safehouse.upgrades.length > 0 && Math.random() < 0.3) {
        const idx = Math.floor(Math.random() * safehouse.upgrades.length);
        upgradeLost = safehouse.upgrades[idx];
        safehouse.upgrades.splice(idx, 1);
      }

      report.safehouseRaid = {
        district: safehouse.district,
        attackerName,
        won: false,
        details: `${attackerName} overviel je safehouse in ${safehouse.district}! Verdediging te zwak (${defense} vs ${attackStrength}).${upgradeLost ? ` ${upgradeLost} vernietigd!` : ''} €${moneyLost} gestolen.`,
        loot: -moneyLost,
      };

      addPhoneMessage(state, 'anonymous', `🔥 Je safehouse in ${safehouse.district} is aangevallen door ${attackerName}! €${moneyLost} verloren.${upgradeLost ? ` ${upgradeLost} upgrade vernietigd.` : ''}`, 'threat');
    }

    // Only one raid per turn
    break;
  }
}
